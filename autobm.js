(() => {
  // ================= CẤU HÌNH =================
  const SERVER_WS_URL = 'wss://autobookmart.onrender.com'; // THAY BẰNG URL THỰC TẾ

  // ================= CSS (ẩn popup) =================
  const style = document.createElement('style');
  style.textContent = `#cf2-popup { display: none !important; }`; // Ẩn hoàn toàn popup
  document.head.appendChild(style);

  // Không tạo popup HTML, chỉ giữ các chức năng quét
  // Tạo các element ẩn nếu cần (ví dụ progress, result) để code cũ không lỗi
  function createHiddenElement(id, tag = 'div') {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag);
      el.id = id;
      el.style.display = 'none';
      document.body.appendChild(el);
    }
    return el;
  }

  // Tạo sẵn các element cần thiết
  createHiddenElement('flash-min', 'input');
  createHiddenElement('flash-price-min', 'input');
  createHiddenElement('flash-maxshop', 'input');
  createHiddenElement('flash-ongoing', 'input');
  createHiddenElement('flash-progress');
  createHiddenElement('flash-result');
  createHiddenElement('flash-copyall', 'button');
  createHiddenElement('flash-info');
  createHiddenElement('vouch-fpct', 'input');
  createHiddenElement('vouch-fmin', 'input');
  createHiddenElement('vouch-fcap', 'input');
  createHiddenElement('vouch-maxshop', 'input');
  createHiddenElement('vouch-progress');
  createHiddenElement('vouch-result');
  createHiddenElement('vouch-copyall', 'button');
  createHiddenElement('vouch-info');
  createHiddenElement('scan-shopid');
  createHiddenElement('scan-product');

  // Các biến và hàm giữ nguyên, nhưng không dùng popup, chỉ dùng các element ẩn
  const $ = id => document.getElementById(id);
  function getCsrfToken() {
    const m = document.cookie.match(/csrftoken=([^;]+)/);
    return m ? m[1] : '';
  }
  function extractShopIdsFromHTML() {
    const ids = new Set();
    document.querySelectorAll('a[href*="i."], a[href*="/product/"], div.BlBXvx.J0nYy6 a[href]').forEach(a => {
      const href = a.href;
      if (!href) return;
      let m = href.match(/i\.(\d+)\.(\d+)/);
      if (!m) m = href.match(/\/product\/(\d+)\/(\d+)/);
      if (m) ids.add(m[1]);
    });
    return [...ids];
  }

  // Flash Sale functions
  const FLASH_KEY = 'cf2_scanned_shops';
  let flashItems = [], flashAbort = null;
  function flashGetScanned() { try { return JSON.parse(localStorage.getItem(FLASH_KEY)) || []; } catch (e) { return []; } }
  function flashAddScanned(ids) { const cur = flashGetScanned(); const upd = [...new Set([...cur, ...ids])]; localStorage.setItem(FLASH_KEY, JSON.stringify(upd)); return upd; }
  function flashFormatPrice(v) { const d = v / 100000; if (d >= 1000000) return (d / 1000000).toFixed(1) + 'tr'; if (d >= 1000) return (d / 1000).toFixed(0) + 'k'; return d.toLocaleString('vi-VN'); }
  function flashTruncName(n) { return n.length > 30 ? n.substring(0, 30) + '..' : n; }

  async function fetchFlashSale(shopId) {
    const ctrl = flashAbort;
    const r = await fetch('https://shopee.vn/api/v4/shop/get_shop_flash_sale_items?shopid=' + shopId, {
      headers: { 'x-requested-with': 'XMLHttpRequest' },
      credentials: 'include',
      signal: ctrl ? ctrl.signal : undefined
    });
    if (!r.ok) { if (r.status === 403 || r.status === 429) throw new Error('BLOCKED'); return []; }
    const j = await r.json();
    if (j.error !== 0) return [];
    const sales = j.data?.flash_sales;
    if (!sales) return [];
    const items = [];
    for (const s of sales) {
      if (s.items) {
        for (const it of s.items) items.push({
          ...it,
          shopId,
          start_time: it.start_time || s.start_time,
          end_time: it.end_time || s.end_time,
          price: it.price || it.applied_product_promo_price || 0,
          price_before_discount: it.price_before_discount || 0,
          model_ids: it.model_ids || []
        });
      }
    }
    return items;
  }

  async function processBatchFlash(shopIds, min, ongoing, now, prog, minPriceK) {
    let collected = [];
    let i = 0;
    const minPriceDong = minPriceK > 0 ? minPriceK * 1000 : 0;
    while (i < shopIds.length) {
      if (flashAbort.signal.aborted) break;
      const batchSize = Math.floor(Math.random() * 4) + 2;
      const batch = shopIds.slice(i, i + batchSize);
      if (prog) prog.innerHTML = 'Batch ' + (i + 1) + '-' + Math.min(i + batchSize, shopIds.length) + '/' + shopIds.length + '...';
      for (const sid of batch) {
        if (flashAbort.signal.aborted) break;
        try {
          const items = await fetchFlashSale(sid);
          let filtered = items.filter(it => {
            if (it.raw_discount < min) return false;
            if (minPriceDong > 0 && (it.price_before_discount / 100000) < minPriceDong) return false;
            return true;
          });
          if (ongoing) filtered = filtered.filter(it => it.start_time <= now && it.end_time >= now);
          collected.push(...filtered);
        } catch (e) {
          if (e.message === 'BLOCKED') {
            if (prog) prog.innerHTML = '<br><span class="warning">🚫 Bị chặn (403/429). Dừng lại.</span>';
            i = shopIds.length;
            break;
          }
        }
      }
      i += batch.length;
      if (i < shopIds.length && !flashAbort.signal.aborted) {
        const delay = 4000 + Math.floor(Math.random() * 6000);
        if (prog) prog.innerHTML = 'Chờ ' + (delay / 1000).toFixed(1) + 's...';
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return collected;
  }

  async function scanFlashSale(minDiscount, minPriceK, maxShop, ongoing) {
    const now = Math.floor(Date.now() / 1000);
    flashAbort = new AbortController();
    const all = extractShopIdsFromHTML();
    if (!all.length) return { error: 'Không tìm thấy shop nào trên trang.' };
    const scanned = flashGetScanned();
    const newIds = all.filter(id => !scanned.includes(id));
    if (!newIds.length) return { error: 'Tất cả shop đã quét.' };
    const shopIds = newIds.slice(0, maxShop);
    const collected = await processBatchFlash(shopIds, minDiscount, ongoing, now, $('flash-progress'), minPriceK);
    if (!flashAbort.signal.aborted) flashAddScanned(shopIds);
    flashItems = collected.sort((a, b) => b.raw_discount - a.raw_discount);
    const resultText = '⚡ Flash Sale:\n' + flashItems.map(i => {
      const upcoming = i.start_time > now;
      let prefix = '';
      if (upcoming) {
        const d = new Date(i.start_time * 1000);
        const mins = d.getMinutes();
        prefix = '- ' + d.getHours() + 'H' + (mins > 0 ? mins.toString().padStart(2, '0') : '') + ' ';
      }
      return prefix + '-' + i.raw_discount + '% còn ' + flashFormatPrice(i.price) + ' - ' + flashTruncName(i.name) + ': https://shopee.vn/product/' + i.shopid + '/' + i.itemid + ' [SL: ' + (i.stock || 0) + ']';
    }).join('\n');
    return { success: true, text: resultText, count: flashItems.length };
  }

  // Voucher functions (tương tự, viết gọn lại)
  const VOUCH_KEY = 'vcat_scanned_shops';
  let vouchVouchers = [], vouchAbort = null;
  function vouchGetScanned() { try { return JSON.parse(localStorage.getItem(VOUCH_KEY)) || []; } catch (e) { return []; } }
  function vouchAddScanned(ids) { const cur = vouchGetScanned(); const upd = [...new Set([...cur, ...ids])]; localStorage.setItem(VOUCH_KEY, JSON.stringify(upd)); return upd; }
  const vToK = v => Math.round(v / 100000000);
  const vFormatK = v => { const num = v / 100000; if (num >= 1000000) return (num / 1000000).toFixed(1) + 'tr'; if (num >= 1000) return (num / 1000).toFixed(0) + 'k'; return num.toLocaleString('vi-VN'); };
  function vIsPercent(v) { return v.reward_percentage > 0 || v.reward_type === 1; }
  function formatVouchTime(ts) { if (!ts) return ''; const d = new Date(ts * 1000); const hours = d.getHours(); const minutes = d.getMinutes(); if (minutes === 0) return hours + 'h'; return hours + 'h' + minutes; }

  async function fetchVouchersForShop(shopId) {
    const ctrl = vouchAbort;
    const r = await fetch('https://shopee.vn/api/v4/shop/get_shop_tab', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'XMLHttpRequest', 'x-api-source': 'pc', 'x-csrftoken': getCsrfToken() },
      credentials: 'include',
      signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({ entry_point: 'ShopByPDP', rcmd_condition: { cat_id: 0, item_id: 0, upstream: 'pdp' }, shopid: parseInt(shopId) })
    });
    if (!r.ok) { if (r.status === 403 || r.status === 429) throw new Error('BLOCKED'); return []; }
    const j = await r.json();
    if (j.error !== 0) return [];
    const deco = j.data?.decoration;
    if (!deco) return [];
    const comp = deco.find(d => d.type === 303 && d.shop_voucher);
    if (!comp) return [];
    return comp.shop_voucher.voucher_list.map(v => ({ ...v, shopId, start_time: v.start_time || 0 }));
  }

  async function processBatchVoucher(shopIds, prog) {
    let vouchers = [];
    let i = 0;
    while (i < shopIds.length) {
      if (vouchAbort.signal.aborted) break;
      const batchSize = Math.floor(Math.random() * 4) + 2;
      const batch = shopIds.slice(i, i + batchSize);
      if (prog) prog.innerHTML = 'Batch ' + (i + 1) + '-' + Math.min(i + batchSize, shopIds.length) + '/' + shopIds.length + '...';
      for (const sid of batch) {
        if (vouchAbort.signal.aborted) break;
        try {
          const v = await fetchVouchersForShop(sid);
          vouchers.push(...v);
        } catch (e) {
          if (e.message === 'BLOCKED') {
            if (prog) prog.innerHTML = '<br><span class="warning">🚫 Bị chặn (403/429). Dừng lại.</span>';
            i = shopIds.length;
            break;
          }
        }
      }
      i += batch.length;
      if (i < shopIds.length && !vouchAbort.signal.aborted) {
        const delay = 4000 + Math.floor(Math.random() * 6000);
        if (prog) prog.innerHTML = 'Chờ ' + (delay / 1000).toFixed(1) + 's...';
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return vouchers;
  }

  async function scanVoucher() {
    vouchAbort = new AbortController();
    const all = extractShopIdsFromHTML();
    if (!all.length) return { error: 'Không tìm thấy shop nào.' };
    const scanned = vouchGetScanned();
    const newIds = all.filter(id => !scanned.includes(id));
    if (!newIds.length) return { error: 'Tất cả shop đã quét.' };
    const shopIds = newIds.slice(0, 5); // mặc định 5 shop
    const vouchers = await processBatchVoucher(shopIds, $('vouch-progress'));
    if (!vouchAbort.signal.aborted) vouchAddScanned(shopIds);
    vouchVouchers = vouchers;
    const now = Math.floor(Date.now() / 1000);
    const filtered = vouchVouchers.filter(v => true); // không lọc gì thêm
    const resultText = '🎫 Voucher:\n' + filtered.map(v => {
      let desc = vIsPercent(v) ? `giảm ${v.reward_percentage}% max ${vFormatK(v.reward_cap)}/${v.min_spend > 0 ? vFormatK(v.min_spend) : '0đ'}` : `giảm ${vFormatK(v.reward_value)}/${v.min_spend > 0 ? vFormatK(v.min_spend) : '0đ'}`;
      let prefix = '';
      if (v.start_time && v.start_time > now) prefix = '- ' + formatVouchTime(v.start_time) + ' ';
      return prefix + v.voucher_code + ' ' + desc + ' áp list: https://shopee.vn/search?promotionId=' + v.promotionid + '&signature=' + v.signature + '&voucherCode=' + v.voucher_code;
    }).join('\n');
    return { success: true, text: resultText, count: vouchers.length };
  }

  // ================= WEBSOCKET =================
  let ws = null;
  let wsReconnectTimer = null;
  let pingInterval = null;

  function connectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    ws = new WebSocket(SERVER_WS_URL);
    ws.onopen = () => {
      console.log('WS connected');
      if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
      pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 25000);
    };
    ws.onmessage = async (event) => {
      try {
        const cmd = JSON.parse(event.data);
        if (cmd.action === 'scan_flash') {
          const result = await scanFlashSale(cmd.minDiscount || 70, cmd.minPriceK || 0, cmd.maxShop || 10, false);
          if (result.success) sendResultToServer(result.text);
          else sendResultToServer('❌ ' + result.error);
        } else if (cmd.action === 'scan_voucher') {
          const result = await scanVoucher();
          if (result.success) sendResultToServer(result.text);
          else sendResultToServer('❌ ' + result.error);
        }
      } catch (e) { console.error('WS message error', e); }
    };
    ws.onclose = () => {
      console.log('WS disconnected');
      clearInterval(pingInterval);
      ws = null;
      if (!wsReconnectTimer) wsReconnectTimer = setTimeout(connectWebSocket, 10000);
    };
    ws.onerror = () => { ws.close(); };
  }

  function sendResultToServer(text) {
    console.log('Sending to server, length:', text.length);
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (text.length > 4000) {
        // Chia nhỏ nếu quá dài
        for (let i = 0; i < text.length; i += 4000) {
          ws.send(text.substring(i, i + 4000));
        }
      } else {
        ws.send(text);
      }
    } else {
      console.log('WS not open, cannot send');
    }
  }

  // Bắt đầu kết nối
  connectWebSocket();
})();
