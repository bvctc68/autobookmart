(() => {
  // ================= CẤU HÌNH =================
  const SERVER_WS_URL = 'wss://autobookmart.onrender.com'; // THAY URL THỰC TẾ

  // ================= CSS =================
  const style = document.createElement('style');
  style.textContent = `
    #cf2-popup{position:fixed;top:20px;left:50%;transform:translateX(-50%);width:900px;max-height:95vh;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.3);border-radius:12px;z-index:9999;font-family:Arial;display:flex;flex-direction:column;resize:both;overflow:auto}
    #cf2-popup .popup-header{cursor:move;display:flex;justify-content:space-between;align-items:center;padding:10px 15px;background:#f5f5f5;border-radius:12px 12px 0 0;user-select:none}
    #cf2-popup .popup-header h3{margin:0;font-size:16px;flex:1}
    #cf2-popup .popup-header .header-btns{display:flex;gap:5px;align-items:center}
    #cf2-popup .popup-header button{background:#ddd;border:none;font-size:18px;cursor:pointer;width:28px;height:28px;border-radius:4px;display:flex;align-items:center;justify-content:center}
    #cf2-popup.minimized .popup-body{display:none}
    #cf2-popup .tab-row{display:flex;border-bottom:1px solid #ddd;flex-wrap:wrap}
    #cf2-popup .tab-btn{padding:8px 12px;cursor:pointer;background:#f5f5f5;border:none;font-size:13px;margin-right:2px;white-space:nowrap}
    #cf2-popup .tab-btn.active{background:#fff;font-weight:bold;border:1px solid #ddd;border-bottom:1px solid #fff}
    #cf2-popup .tab-content{display:none;padding:15px;flex:1;overflow-y:auto}
    #cf2-popup .tab-content.active{display:block}
    #cf2-popup textarea{width:100%;height:60px;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:6px;resize:vertical;box-sizing:border-box}
    #cf2-popup input[type=number]{width:80px;padding:6px}
    #cf2-popup button.popup-action{background:#ee4d2d;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin:2px}
    #cf2-popup .result-item{margin:4px 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    #cf2-popup .link-text{flex:1;word-break:break-all}
    #cf2-popup .copy-btn{background:#007bff;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer}
    #cf2-popup .copy-all{background:#28a745;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin:2px}
    #cf2-popup .info-text{font-size:12px;color:#888}
    #cf2-popup .mode-row{display:flex;gap:20px;align-items:center;margin:8px 0}
    #cf2-popup .variant-btn{background:#6c757d;color:#fff;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:12px;user-select:none}
    .progress{font-size:13px;color:#555;margin:4px 0}
    .warning{color:#d9534f;font-weight:bold}
    .filter-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0}
    .filter-row label{font-size:13px}
    .filter-row input{width:60px;padding:4px}
    #cf2-popup table{width:100%;border-collapse:collapse;margin:10px 0}
    #cf2-popup th,#cf2-popup td{border:1px solid #ddd;padding:8px;text-align:left}
    #cf2-popup .scan-buttons{display:flex;gap:10px;margin-bottom:10px}
    #cf2-popup .vouch-date-header{font-weight:bold;margin-top:12px;padding:4px 0;border-bottom:1px solid #eee;font-size:14px;color:#333}
    .vbm-success{color:#0a0;font-weight:bold}
    .vbm-error{color:#d00;font-weight:bold}
    .vbm-warn{color:#e67e22;font-weight:bold}
  `;
  document.head.appendChild(style);

  // ================= POPUP HTML =================
  const popup = document.createElement('div');
  popup.id = 'cf2-popup';
  popup.innerHTML = `
    <div class="popup-header" id="cf2-header">
      <h3>🛍️ Săn Shopee All-in-One</h3>
      <div class="header-btns">
        <span id="ws-status" title="Trạng thái kết nối server" style="cursor:pointer;font-size:18px;margin-right:8px">🔴</span>
        <button id="cf2-minimize" title="Thu nhỏ / Mở rộng">–</button>
        <button id="cf2-close" title="Đóng">✕</button>
      </div>
    </div>
    <div class="popup-body">
      <div class="tab-row">
        <button class="tab-btn active" data-tab="flash">⚡ Flash Sale</button>
        <button class="tab-btn" data-tab="voucher">🎫 Voucher Shop</button>
        <button class="tab-btn" data-tab="scp">🎯 SCP Deals</button>
        <button class="tab-btn" data-tab="rcmd">🎯 Scan Gợi ý</button>
        <button class="tab-btn" data-tab="savevoucher">💾 Lưu mã</button>
        <button class="tab-btn" data-tab="scan">📋 Scan SP</button>
      </div>

      <!-- FLASH SALE -->
      <div class="tab-content active" id="flash-content">
        <div class="mode-row">
          <label><input type="radio" name="flash-mode" value="html" checked> Quét HTML</label>
          <label><input type="radio" name="flash-mode" value="id"> Nhập Shop ID</label>
          <label><input type="radio" name="flash-mode" value="category"> Category (cat.xxx)</label>
        </div>
        <textarea id="flash-input" placeholder="Nhập danh sách Shop ID hoặc Category ID (tùy chế độ)"></textarea>
        <label>Giảm giá ≥ <input id="flash-min" type="number" value="70" min="0" max="99">%</label><br>
        <label>Giá gốc ≥ <input id="flash-price-min" type="number" value="0" min="0" step="10" placeholder="k">k</label><br>
        <label>Số shop tối đa <input id="flash-maxshop" type="number" value="10" min="1" max="50"></label><br>
        <label><input type="checkbox" id="flash-ongoing"> Chỉ đang diễn ra</label><br>
        <button id="flash-search" class="popup-action">🔍 Tìm Flash Sale</button>
        <button id="flash-copyall" class="copy-all" style="display:none">📋 Copy tất cả</button>
        <button id="flash-reset" style="background:#ffc107;color:#000;padding:8px 16px;border-radius:6px;border:none;cursor:pointer;margin:2px">🗑️ Reset đã quét</button>
        <div id="flash-progress" class="progress"></div>
        <div class="info-text" id="flash-info"></div>
        <div id="flash-result"></div>
      </div>

      <!-- VOUCHER SHOP -->
      <div class="tab-content" id="voucher-content">
        <div class="mode-row">
          <label><input type="radio" name="vouch-mode" value="html" checked> Quét HTML</label>
          <label><input type="radio" name="vouch-mode" value="id"> Nhập Shop ID</label>
        </div>
        <textarea id="vouch-input" placeholder="Nhập danh sách Shop ID (nếu chọn Nhập Shop ID)"></textarea>
        <div class="filter-row">
          <label>Giảm % ≥</label><input id="vouch-fpct" type="number" placeholder="%" min="0">
          <label>Đơn tối thiểu ≥</label><input id="vouch-fmin" type="number" placeholder="k" min="0">
          <label>Giảm tối đa ≥</label><input id="vouch-fcap" type="number" placeholder="k" min="0">
          <label>Số shop tối đa</label><input id="vouch-maxshop" type="number" value="5" min="1" max="30">
        </div>
        <button id="vouch-search" class="popup-action">🔍 Lấy voucher</button>
        <button id="vouch-copyall" class="copy-all" style="display:none">📋 Copy tất cả</button>
        <button id="vouch-reset" style="background:#ffc107;color:#000;padding:8px 16px;border-radius:6px;border:none;cursor:pointer;margin:2px">🗑️ Reset đã quét</button>
        <div id="vouch-progress" class="progress"></div>
        <div class="info-text" id="vouch-info"></div>
        <div id="vouch-result"></div>
      </div>

      <!-- SCP DEALS -->
      <div class="tab-content" id="scp-content">
        <div class="mode-row">
          <label><input type="radio" name="scp-mode" value="html" checked> Quét HTML</label>
          <label><input type="radio" name="scp-mode" value="id"> Nhập Shop ID</label>
        </div>
        <textarea id="scp-input" placeholder="Nhập danh sách Shop ID (nếu chọn Nhập Shop ID)"></textarea>
        <label>Giảm giá ≥ <input id="scp-min" type="number" value="60" min="0" max="99">%</label>
        <label>Số shop tối đa <input id="scp-maxshop" type="number" value="10" min="1" max="30"></label>
        <button id="scp-search" class="popup-action">🔍 Lấy SCP Deals</button>
        <div id="scp-progress" class="progress"></div>
        <div id="scp-result" style="margin-top:10px"></div>
      </div>

      <!-- SCAN GỢI Ý -->
      <div class="tab-content" id="rcmd-content">
        <div class="mode-row">
          <label><input type="radio" name="rcmd-mode" value="url" checked> Tự động (URL shop)</label>
          <label><input type="radio" name="rcmd-mode" value="id"> Nhập Shop ID</label>
        </div>
        <textarea id="rcmd-input" placeholder="Nhập Shop ID (nếu chọn Nhập Shop ID)"></textarea>
        <label>Giảm giá ≥ <input id="rcmd-min" type="number" value="30" min="0" max="99">%</label>
        <label>Số sản phẩm tối đa <input id="rcmd-maxitems" type="number" value="200" min="1" max="1000"></label>
        <button id="rcmd-search" class="popup-action">🔍 Quét sản phẩm gợi ý</button>
        <div id="rcmd-progress" class="progress"></div>
        <div id="rcmd-result" style="margin-top:10px"></div>
      </div>

      <!-- LƯU MÃ -->
      <div class="tab-content" id="savevoucher-content">
        <textarea id="sv-input" placeholder="Nhập mã voucher, mỗi mã một dòng..." style="height:80px"></textarea>
        <button id="sv-save" class="popup-action">📥 Lưu tất cả</button>
        <div id="sv-status" class="progress"></div>
        <table id="sv-table" style="width:100%;border-collapse:collapse;margin-top:10px">
          <thead><tr><th>Mã & Thông tin</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>

      <!-- SCAN SP -->
      <div class="tab-content" id="scan-content">
        <div class="scan-buttons">
          <button id="scan-scan" class="popup-action">🔍 Quét lại</button>
          <button id="scan-copyshop" class="popup-action" style="background:#007bff">📋 Sao chép tất cả ID Shop</button>
          <button id="scan-reset" style="background:#ffc107;color:#000;padding:8px 16px;border-radius:6px;border:none;cursor:pointer;margin:2px">🗑️ Xóa lịch sử</button>
        </div>
        <div class="tabs" style="display:flex;border-bottom:1px solid #ddd;margin-bottom:10px">
          <button class="tab-btn active" data-subtab="scan-shopid">ID Shop</button>
          <button class="tab-btn" data-subtab="scan-product">URL + Tiêu đề</button>
        </div>
        <div id="scan-shopid" class="subtab-content active" style="padding:10px 0"></div>
        <div id="scan-product" class="subtab-content" style="padding:10px 0;display:none"></div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  // ================= DRAG & DROP =================
  let isDragging = false, startX, startY, initialX, initialY;
  const header = document.getElementById('cf2-header');
  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.id === 'ws-status') return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = popup.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    popup.style.transform = 'none';
    popup.style.left = initialX + 'px';
    popup.style.top = initialY + 'px';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    popup.style.left = (initialX + e.clientX - startX) + 'px';
    popup.style.top = (initialY + e.clientY - startY) + 'px';
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  document.getElementById('cf2-minimize').addEventListener('click', () => {
    popup.classList.toggle('minimized');
    document.getElementById('cf2-minimize').textContent = popup.classList.contains('minimized') ? '+' : '–';
  });
  document.getElementById('cf2-close').addEventListener('click', () => popup.remove());

  // ================= TAB HANDLERS =================
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('#cf2-popup .tab-content').forEach(c => c.classList.remove('active'));
      const target = document.getElementById(this.dataset.tab + '-content');
      if (target) target.classList.add('active');
      if (this.dataset.tab === 'scan') scanPage();
    });
  });

  document.querySelectorAll('#scan-content .tab-btn[data-subtab]').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#scan-content .tab-btn[data-subtab]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('scan-shopid').style.display = 'none';
      document.getElementById('scan-product').style.display = 'none';
      document.getElementById(this.dataset.subtab).style.display = 'block';
    });
  });

  // ================= HELPER FUNCTIONS =================
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

  // ================= SCAN SP =================
  const SCAN_KEY = 'cf2_scanned_shops_list';
  function scanGetScanned() { try { return JSON.parse(localStorage.getItem(SCAN_KEY)) || []; } catch (e) { return []; } }
  function scanAddScanned(ids) { const cur = scanGetScanned(); const upd = [...new Set([...cur, ...ids])]; localStorage.setItem(SCAN_KEY, JSON.stringify(upd)); return upd; }
  function scanReset() { localStorage.removeItem(SCAN_KEY); }
  function scanPage() {
    const shopDiv = $('scan-shopid'), prodDiv = $('scan-product');
    const products = [];
    const currentShopSet = new Set();
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      let m = href.match(/i\.(\d+)\.(\d+)/);
      if (!m) return;
      const shopId = m[1], itemId = m[2];
      const link = 'https://shopee.vn/product/' + shopId + '/' + itemId;
      let title = (a.getAttribute('aria-label') || '').replace(/^Product card:\s*/i, '');
      if (!title) { const card = a.closest('div[role="group"][aria-label^="Product card:"]'); if (card) title = card.getAttribute('aria-label').replace(/^Product card:\s*/i, ''); }
      if (!title) { const labeled = a.closest('[aria-label]'); if (labeled) { const lbl = labeled.getAttribute('aria-label'); if (lbl && lbl.indexOf('image overlay') !== 0) title = lbl.replace(/^Product card:\s*/i, ''); } }
      if (!title) { title = (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim(); }
      if (!title) title = 'Không tiêu đề';
      title = title.replace(/^Product card:\s*/i, '');
      const short = title.length > 20 ? title.slice(0, 20) + '...' : title;
      products.push({ shopId, itemId, link, shortTitle: short, fullTitle: title });
      currentShopSet.add(shopId);
    });
    const savedIds = scanGetScanned();
    const allIds = scanAddScanned(Array.from(currentShopSet));
    shopDiv.innerHTML = ''; prodDiv.innerHTML = '';
    if (!allIds.length) {
      shopDiv.innerHTML = '<p>Chưa quét được shop nào.</p>';
      prodDiv.innerHTML = '<p>Không có dữ liệu.</p>';
      return;
    }
    const sorted = allIds.slice().sort((a, b) => a - b);
    let shopHtml = '<table><tr><th>ID Shop</th><th>Link Shop</th></tr>';
    sorted.forEach(id => { shopHtml += `<tr><td>${id}</td><td><a href="https://shopee.vn/shop/${id}" target="_blank">https://shopee.vn/shop/${id}</a></td></tr>`; });
    shopHtml += `</table><p>Tổng: <b>${sorted.length}</b> shop.</p>`;
    shopDiv.innerHTML = shopHtml;
    if (products.length) {
      let prodHtml = '<ul>';
      products.forEach(p => { prodHtml += `<li><span>${p.shortTitle}</span>: <a href="${p.link}" target="_blank">${p.link}</a></li>`; });
      prodHtml += '</ul>';
      prodDiv.innerHTML = prodHtml;
    } else {
      prodDiv.innerHTML = '<p>Không có sản phẩm ở trang này.</p>';
    }
  }
  $('scan-scan').addEventListener('click', scanPage);
  $('scan-copyshop').addEventListener('click', () => {
    const ids = scanGetScanned();
    if (!ids.length) { alert('Không có ID shop nào!'); return; }
    navigator.clipboard.writeText(ids.join('\n')).then(() => alert('Đã sao chép ' + ids.length + ' ID shop!'));
  });
  $('scan-reset').addEventListener('click', () => {
    if (confirm('Xóa toàn bộ lịch sử shop đã quét?')) { scanReset(); scanPage(); }
  });

  // ================= FLASH SALE =================
  const FLASH_KEY = 'cf2_scanned_shops';
  let flashItems = [], flashAbort = null;
  function flashGetScanned() { try { return JSON.parse(localStorage.getItem(FLASH_KEY)) || []; } catch (e) { return []; } }
  function flashAddScanned(ids) { const cur = flashGetScanned(); const upd = [...new Set([...cur, ...ids])]; localStorage.setItem(FLASH_KEY, JSON.stringify(upd)); return upd; }
  function flashReset() { localStorage.removeItem(FLASH_KEY); }
  function flashUpdateInfo() { const s = flashGetScanned(); $('flash-info').textContent = 'Đã quét ' + s.length + ' shop (bỏ qua khi quét lại)'; }
  function flashFormatPrice(v) { const d = v / 100000; if (d >= 1000000) return (d / 1000000).toFixed(1) + 'tr'; if (d >= 1000) return (d / 1000).toFixed(0) + 'k'; return d.toLocaleString('vi-VN'); }
  function flashTruncName(n) { return n.length > 30 ? n.substring(0, 30) + '..' : n; }
  async function fetchModelNames(itemId, shopId, modelIds) {
    try {
      const r = await fetch('https://shopee.vn/api/v4/item/get?itemid=' + itemId + '&shopid=' + shopId, { headers: { 'x-requested-with': 'XMLHttpRequest' }, credentials: 'include' });
      if (!r.ok) return null;
      const j = await r.json();
      if (j.error) return null;
      const models = j.data?.models;
      if (!models) return null;
      const map = {};
      models.forEach(m => { map[m.modelid] = m.name; });
      return modelIds.map(mid => map[mid] || ('Model ' + mid)).join(', ');
    } catch (e) { return null; }
  }
  function flashRender() {
    const d = $('flash-result');
    d.innerHTML = '';
    if (!flashItems.length) { d.innerHTML = '<p>Không có sản phẩm flash sale nào.</p>'; $('flash-copyall').style.display = 'none'; return; }
    const now = Math.floor(Date.now() / 1000);
    let h = '';
    flashItems.forEach(i => {
      const upcoming = i.start_time > now;
      let prefix = '';
      if (upcoming) { const date = new Date(i.start_time * 1000); const mins = date.getMinutes(); prefix = '- ' + date.getHours() + 'H' + (mins > 0 ? mins.toString().padStart(2, '0') : '') + ' '; }
      const text = prefix + '-' + i.raw_discount + '% còn ' + flashFormatPrice(i.price) + ' - ' + flashTruncName(i.name) + ': ' + i.link + ' [SL: ' + i.stock + ']';
      const mids = i.model_ids || [];
      const vbtn = mids.length > 0 ? '<button class="variant-btn" data-itemid="' + i.itemid + '" data-shopid="' + i.shopid + '" data-models=\'' + JSON.stringify(mids) + '\'>Phân loại</button>' : '';
      h += '<div class="result-item"><span class="link-text">' + text + '</span>' + vbtn + '<span class="variant-info" style="font-size:12px;color:#555;margin-left:4px"></span></div>';
    });
    d.innerHTML = h;
    $('flash-copyall').style.display = 'block';
    d.querySelectorAll('.variant-btn').forEach(b => {
      b.onclick = async function() {
        const info = this.parentElement.querySelector('.variant-info');
        info.textContent = 'Đang tải...';
        const names = await fetchModelNames(this.dataset.itemid, this.dataset.shopid, JSON.parse(this.dataset.models));
        info.textContent = names || 'Lỗi';
      };
    });
  }
  $('flash-copyall').onclick = () => {
    const now = Math.floor(Date.now() / 1000);
    const all = flashItems.map(i => {
      const up = i.start_time > now;
      let p = '';
      if (up) { const d = new Date(i.start_time * 1000); const mins = d.getMinutes(); p = '- ' + d.getHours() + 'H' + (mins > 0 ? mins.toString().padStart(2, '0') : '') + ' '; }
      return p + '-' + i.raw_discount + '% còn ' + flashFormatPrice(i.price) + ' - ' + flashTruncName(i.name) + ': ' + i.link + ' [SL: ' + i.stock + ']';
    }).join('\n');
    navigator.clipboard.writeText(all).then(() => {
      const o = $('flash-copyall').textContent;
      $('flash-copyall').textContent = '✓ Đã copy';
      setTimeout(() => $('flash-copyall').textContent = o, 1500);
    });
    sendResultToServer('⚡ Flash Sale:\n' + all);
  };
  $('flash-reset').onclick = () => { if (confirm('Xóa lịch sử quét Flash Sale?')) { flashReset(); flashUpdateInfo(); } };
  async function fetchFlashSale(shopId) {
    const ctrl = flashAbort;
    const r = await fetch('https://shopee.vn/api/v4/shop/get_shop_flash_sale_items?shopid=' + shopId, { headers: { 'x-requested-with': 'XMLHttpRequest' }, credentials: 'include', signal: ctrl ? ctrl.signal : undefined });
    if (!r.ok) { if (r.status === 403 || r.status === 429) throw new Error('BLOCKED'); return []; }
    const j = await r.json();
    if (j.error !== 0) return [];
    const sales = j.data?.flash_sales;
    if (!sales) return [];
    const items = [];
    for (const s of sales) {
      if (s.items) {
        for (const it of s.items) items.push({ ...it, shopId, start_time: it.start_time || s.start_time, end_time: it.end_time || s.end_time, price: it.price || it.applied_product_promo_price || 0, price_before_discount: it.price_before_discount || 0, model_ids: it.model_ids || [] });
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
      prog.innerHTML = 'Batch ' + (i + 1) + '-' + Math.min(i + batchSize, shopIds.length) + '/' + shopIds.length + '...';
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
          if (e.message === 'BLOCKED') { prog.innerHTML = '<br><span class="warning">🚫 Bị chặn (403/429). Dừng lại.</span>'; i = shopIds.length; break; }
          else { prog.innerHTML += '<br><span style="color:red">Lỗi shop ' + sid + ': ' + e.message + '</span>'; }
        }
      }
      i += batch.length;
      if (i < shopIds.length && !flashAbort.signal.aborted && !prog.innerHTML.includes('Bị chặn')) {
        const delay = 4000 + Math.floor(Math.random() * 6000);
        prog.innerHTML = 'Chờ ' + (delay / 1000).toFixed(1) + 's...';
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return collected;
  }
  $('flash-search').onclick = async () => {
    const mode = document.querySelector('input[name="flash-mode"]:checked').value;
    const input = $('flash-input').value.trim();
    const min = parseInt($('flash-min').value) || 70;
    const minPriceK = parseInt($('flash-price-min').value) || 0;
    const maxShop = parseInt($('flash-maxshop').value) || 10;
    const ongoing = $('flash-ongoing').checked;
    const now = Math.floor(Date.now() / 1000);
    const prog = $('flash-progress');
    prog.innerHTML = '';
    flashItems = [];
    $('flash-copyall').style.display = 'none';
    flashAbort = new AbortController();
    flashUpdateInfo();
    let shopIds = [];
    if (mode === 'html') {
      prog.innerHTML = 'Đang quét HTML...';
      const all = extractShopIdsFromHTML();
      if (!all.length) { prog.innerHTML = '<p style="color:red">Không tìm thấy shop.</p>'; return; }
      const scanned = flashGetScanned();
      const newIds = all.filter(id => !scanned.includes(id));
      if (!newIds.length) { prog.innerHTML = 'Tất cả shop đã quét.'; return; }
      shopIds = newIds.slice(0, maxShop);
      prog.innerHTML = 'Tìm thấy ' + all.length + ' shop, ' + newIds.length + ' mới. Quét ' + shopIds.length + ' shop.';
    } else if (mode === 'id') {
      if (!input || !/^[\d\s,]+$/.test(input)) { prog.innerHTML = '<p style="color:red">Danh sách ID không hợp lệ.</p>'; return; }
      shopIds = input.split(/[\s,]+/).filter(id => /^\d+$/.test(id));
      const scanned = flashGetScanned();
      shopIds = shopIds.filter(id => !scanned.includes(id));
      if (!shopIds.length) { prog.innerHTML = 'Tất cả shop đã quét.'; return; }
      shopIds = shopIds.slice(0, maxShop);
      prog.innerHTML = 'Dùng ' + shopIds.length + ' shop nhập tay.';
    } else if (mode === 'category') {
      const referer = location.href;
      let catId = input;
      if (!catId) { const m = referer.match(/cat\.(\d+)/); if (m) catId = m[1]; else { prog.innerHTML = '<p style="color:red">Không tìm thấy Category ID.</p>'; return; } }
      if (!referer.includes('cat.')) { prog.innerHTML = '<p style="color:red">Phải đứng ở trang category.</p>'; return; }
      prog.innerHTML = 'Đang lấy shop từ category ' + catId + '...';
      try {
        const ids = await (async () => {
          const set = new Set(); let off = 0, lim = 60;
          while (true) {
            const r = await fetch('https://shopee.vn/api/v4/recommend/recommend_v2', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'XMLHttpRequest', 'x-api-source': 'pc', 'x-csrftoken': getCsrfToken(), Referer: referer }, credentials: 'include', body: JSON.stringify({ catid: parseInt(catId), limit: lim, offset: off, bundle: 'category_landing_page', cat_level: 1, need_dynamic_translation: true }) });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const j = await r.json();
            if (j.error) throw new Error(j.error_msg);
            const data = j.data;
            if (!data || !data.units) break;
            for (const u of data.units) { const sid = u.item?.item_data?.shopid; if (sid) set.add(sid); }
            const total = data.total || 0;
            off += lim;
            prog.innerHTML = 'Đã quét ' + off + '/' + total + ' sản phẩm...';
            if (off >= total) break;
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
          }
          return [...set];
        })();
        const scanned = flashGetScanned();
        const newShops = ids.filter(id => !scanned.includes(id));
        if (!newShops.length) { prog.innerHTML = 'Tất cả shop đã quét.'; return; }
        shopIds = newShops.slice(0, maxShop);
        prog.innerHTML = 'Lấy ' + shopIds.length + ' shop mới.';
      } catch (e) { prog.innerHTML = '<p style="color:red">Lỗi: ' + e.message + '</p>'; return; }
    }
    prog.innerHTML += '<br>Đang quét Flash Sale...';
    const collected = await processBatchFlash(shopIds, min, ongoing, now, prog, minPriceK);
    if (!flashAbort.signal.aborted) { flashAddScanned(shopIds); flashUpdateInfo(); }
    flashItems = collected.sort((a, b) => b.raw_discount - a.raw_discount);
    prog.innerHTML = 'Đã quét ' + shopIds.length + ' shop, tìm thấy ' + flashItems.length + ' SP ≥ ' + min + '%' + (minPriceK > 0 ? ', giá gốc ≥ ' + minPriceK + 'k' : '') + (ongoing ? ' (đang diễn ra)' : '') + '.';
    flashItems = flashItems.map(it => ({ ...it, link: 'https://shopee.vn/product/' + (it.shopid || it.shop_id) + '/' + (it.itemid || it.item_id), stock: it.stock || 0 }));
    flashRender();
  };

  // ================= VOUCHER SHOP =================
  const VOUCH_KEY = 'vcat_scanned_shops';
  let vouchVouchers = [], vouchAbort = null;
  function vouchGetScanned() { try { return JSON.parse(localStorage.getItem(VOUCH_KEY)) || []; } catch (e) { return []; } }
  function vouchAddScanned(ids) { const cur = vouchGetScanned(); const upd = [...new Set([...cur, ...ids])]; localStorage.setItem(VOUCH_KEY, JSON.stringify(upd)); return upd; }
  function vouchReset() { localStorage.removeItem(VOUCH_KEY); }
  function vouchUpdateInfo() { const s = vouchGetScanned(); $('vouch-info').textContent = 'Đã quét ' + s.length + ' shop (bỏ qua khi quét lại)'; }
  const vToK = v => Math.round(v / 100000000);
  const vFormatK = v => { const num = v / 100000; if (num >= 1000000) return (num / 1000000).toFixed(1) + 'tr'; if (num >= 1000) return (num / 1000).toFixed(0) + 'k'; return num.toLocaleString('vi-VN'); };
  function vIsPercent(v) { return v.reward_percentage > 0 || v.reward_type === 1; }
  function formatVouchTime(ts) { if (!ts) return ''; const d = new Date(ts * 1000); const hours = d.getHours(); const minutes = d.getMinutes(); if (minutes === 0) return hours + 'h'; return hours + 'h' + minutes; }

  function vouchRender() {
    const fpct = parseFloat($('vouch-fpct').value) || 0;
    const fminRaw = $('vouch-fmin').value.trim();
    const fmin = (fminRaw !== '' && !isNaN(parseFloat(fminRaw))) ? parseFloat(fminRaw) : null;
    const fcap = parseFloat($('vouch-fcap').value) || 0;
    const now = Math.floor(Date.now() / 1000);
    const d = $('vouch-result');
    d.innerHTML = '';
    let filtered = vouchVouchers.filter(v => {
      const pct = vIsPercent(v);
      if (pct) { if (fpct > 0 && v.reward_percentage < fpct) return false; if (fcap > 0 && vToK(v.reward_cap) < fcap) return false; }
      else { if (fcap > 0 && vToK(v.reward_value) < fcap) return false; }
      if (fmin !== null) { if (fmin === 0) { if (v.min_spend !== 0) return false; } else { if (v.min_spend === 0) return false; if (vToK(v.min_spend) < fmin) return false; } }
      return true;
    });
    if (!filtered.length) { d.innerHTML = '<p>Không có voucher khớp.</p>'; $('vouch-copyall').style.display = 'none'; return; }
    const activeVouchers = filtered.filter(v => !v.start_time || v.start_time <= now);
    const upcomingVouchers = filtered.filter(v => v.start_time && v.start_time > now).sort((a, b) => a.start_time - b.start_time);
    const grouped = {};
    upcomingVouchers.forEach(v => { const d = new Date(v.start_time * 1000); const key = d.toDateString(); if (!grouped[key]) grouped[key] = []; grouped[key].push(v); });
    let h = '';
    activeVouchers.forEach(v => {
      let desc;
      if (vIsPercent(v)) desc = 'giảm ' + v.reward_percentage + '% max ' + vFormatK(v.reward_cap) + '/' + (v.min_spend > 0 ? vFormatK(v.min_spend) : '0đ');
      else desc = 'giảm ' + vFormatK(v.reward_value) + '/' + (v.min_spend > 0 ? vFormatK(v.min_spend) : '0đ');
      const link = 'https://shopee.vn/search?promotionId=' + v.promotionid + '&signature=' + v.signature + '&voucherCode=' + v.voucher_code;
      const text = v.voucher_code + ' ' + desc + ' áp list: ' + link;
      h += '<div class="vitem" style="margin:6px 0;display:flex;align-items:center;flex-wrap:wrap"><span class="vtext" style="flex:1;word-break:break-all">' + text + '</span></div>';
    });
    if (activeVouchers.length && Object.keys(grouped).length) h += '<hr style="margin:10px 0">';
    Object.keys(grouped).sort().forEach(dateKey => {
      const d = new Date(dateKey);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      h += '<div class="vouch-date-header">' + day + '/' + month + '</div>';
      grouped[dateKey].forEach(v => {
        let desc;
        if (vIsPercent(v)) desc = 'giảm ' + v.reward_percentage + '% max ' + vFormatK(v.reward_cap) + '/' + (v.min_spend > 0 ? vFormatK(v.min_spend) : '0đ');
        else desc = 'giảm ' + vFormatK(v.reward_value) + '/' + (v.min_spend > 0 ? vFormatK(v.min_spend) : '0đ');
        const link = 'https://shopee.vn/search?promotionId=' + v.promotionid + '&signature=' + v.signature + '&voucherCode=' + v.voucher_code;
        const prefix = '- ' + formatVouchTime(v.start_time) + ' ';
        const text = prefix + v.voucher_code + ' ' + desc + ' áp list: ' + link;
        h += '<div class="vitem" style="margin:6px 0;display:flex;align-items:center;flex-wrap:wrap"><span class="vtext" style="flex:1;word-break:break-all">' + text + '</span></div>';
      });
    });
    d.innerHTML = h;
    $('vouch-copyall').style.display = 'block';
  }

  $('vouch-copyall').onclick = () => {
    const now = Math.floor(Date.now() / 1000);
    const texts = vouchVouchers.filter(v => {
      const fpct = parseFloat($('vouch-fpct').value) || 0;
      const fminRaw = $('vouch-fmin').value.trim();
      const fmin = (fminRaw !== '' && !isNaN(parseFloat(fminRaw))) ? parseFloat(fminRaw) : null;
      const fcap = parseFloat($('vouch-fcap').value) || 0;
      const pct = vIsPercent(v);
      if (pct) { if (fpct > 0 && v.reward_percentage < fpct) return false; if (fcap > 0 && vToK(v.reward_cap) < fcap) return false; }
      else { if (fcap > 0 && vToK(v.reward_value) < fcap) return false; }
      if (fmin !== null) { if (fmin === 0) { if (v.min_spend !== 0) return false; } else { if (v.min_spend === 0) return false; if (vToK(v.min_spend) < fmin) return false; } }
      return true;
    }).map(v => {
      let desc;
      if (vIsPercent(v)) desc = 'giảm ' + v.reward_percentage + '% max ' + vFormatK(v.reward_cap) + '/' + (v.min_spend > 0 ? vFormatK(v.min_spend) : '0đ');
      else desc = 'giảm ' + vFormatK(v.reward_value) + '/' + (v.min_spend > 0 ? vFormatK(v.min_spend) : '0đ');
      const link = 'https://shopee.vn/search?promotionId=' + v.promotionid + '&signature=' + v.signature + '&voucherCode=' + v.voucher_code;
      let prefix = '';
      if (v.start_time && v.start_time > now) { prefix = '- ' + formatVouchTime(v.start_time) + ' '; }
      return prefix + v.voucher_code + ' ' + desc + ' áp list: ' + link;
    }).join('\n');
    navigator.clipboard.writeText(texts).then(() => {
      const o = $('vouch-copyall').textContent;
      $('vouch-copyall').textContent = '✓ Đã copy';
      setTimeout(() => $('vouch-copyall').textContent = o, 1500);
    });
    sendResultToServer('🎫 Voucher:\n' + texts);
  };

  ['vouch-fpct', 'vouch-fmin', 'vouch-fcap'].forEach(id => $(id).addEventListener('input', vouchRender));
  $('vouch-reset').onclick = () => { if (confirm('Xóa lịch sử quét Voucher?')) { vouchReset(); vouchUpdateInfo(); } };

  async function fetchVouchersForShop(shopId) {
    const ctrl = vouchAbort;
    const r = await fetch('https://shopee.vn/api/v4/shop/get_shop_tab', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'XMLHttpRequest', 'x-api-source': 'pc', 'x-csrftoken': getCsrfToken() }, credentials: 'include', signal: ctrl ? ctrl.signal : undefined, body: JSON.stringify({ entry_point: 'ShopByPDP', rcmd_condition: { cat_id: 0, item_id: 0, upstream: 'pdp' }, shopid: parseInt(shopId) }) });
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
      prog.innerHTML = 'Batch ' + (i + 1) + '-' + Math.min(i + batchSize, shopIds.length) + '/' + shopIds.length + '...';
      for (const sid of batch) {
        if (vouchAbort.signal.aborted) break;
        try {
          const v = await fetchVouchersForShop(sid);
          vouchers.push(...v);
        } catch (e) {
          if (e.message === 'BLOCKED') { prog.innerHTML = '<br><span class="warning">🚫 Bị chặn (403/429). Dừng lại.</span>'; i = shopIds.length; break; }
          else { prog.innerHTML += '<br><span style="color:red">Lỗi shop ' + sid + ': ' + e.message + '</span>'; }
        }
      }
      i += batch.length;
      if (i < shopIds.length && !vouchAbort.signal.aborted && !prog.innerHTML.includes('Bị chặn')) {
        const delay = 4000 + Math.floor(Math.random() * 6000);
        prog.innerHTML = 'Chờ ' + (delay / 1000).toFixed(1) + 's...';
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return vouchers;
  }

  $('vouch-search').onclick = async () => {
    const mode = document.querySelector('input[name="vouch-mode"]:checked').value;
    const input = $('vouch-input').value.trim();
    const maxShop = parseInt($('vouch-maxshop').value) || 5;
    const prog = $('vouch-progress');
    prog.innerHTML = '';
    vouchVouchers = [];
    $('vouch-copyall').style.display = 'none';
    vouchAbort = new AbortController();
    vouchUpdateInfo();
    let shopIds = [];
    if (mode === 'html') {
      prog.innerHTML = 'Đang quét HTML...';
      const all = extractShopIdsFromHTML();
      if (!all.length) { prog.innerHTML = '<p style="color:red">Không tìm thấy shop.</p>'; return; }
      const scanned = vouchGetScanned();
      const newIds = all.filter(id => !scanned.includes(id));
      if (!newIds.length) { prog.innerHTML = 'Tất cả shop đã quét.'; return; }
      shopIds = newIds.slice(0, maxShop);
      prog.innerHTML = 'Tìm thấy ' + all.length + ' shop, ' + newIds.length + ' mới. Quét ' + shopIds.length + ' shop.';
    } else if (mode === 'id') {
      if (!input || !/^[\d\s,]+$/.test(input)) { prog.innerHTML = '<p style="color:red">Danh sách ID không hợp lệ.</p>'; return; }
      shopIds = input.split(/[\s,]+/).filter(id => /^\d+$/.test(id));
      const scanned = vouchGetScanned();
      shopIds = shopIds.filter(id => !scanned.includes(id));
      if (!shopIds.length) { prog.innerHTML = 'Tất cả shop đã quét.'; return; }
      shopIds = shopIds.slice(0, maxShop);
      prog.innerHTML = 'Dùng ' + shopIds.length + ' shop nhập tay.';
    }
    prog.innerHTML += '<br>Đang lấy voucher...';
    const vouchers = await processBatchVoucher(shopIds, prog);
    if (!vouchAbort.signal.aborted) { vouchAddScanned(shopIds); vouchUpdateInfo(); }
    if (!vouchers.length) { prog.innerHTML += '<br>Không tìm thấy voucher.'; }
    else { prog.innerHTML = 'Đã lấy ' + vouchers.length + ' voucher từ ' + shopIds.length + ' shop.'; vouchVouchers = vouchers; vouchRender(); }
  };

  // ================= SCP DEALS =================
  let scpDeals = [], scpVouchers = [];
  const fmtK = n => { let k = n / 1e8; return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'k'; };
  const fmtTime = ts => new Date(ts * 1e3).toLocaleString('vi-VN', { hour12: false });

  function renderSCP() {
    const min = parseInt($('scp-min').value) || 60;
    const fd = scpDeals.filter(d => d.discount >= min).sort((a, b) => b.discount - a.discount);
    const now = Date.now() / 1e3;
    const fv = scpVouchers.filter((v, i, a) => a.findIndex(x => x.promotionId === v.promotionId && x.code === v.code) === i);
    let html = '<div><b>🔥 Deals (' + fd.length + ')</b><div style="max-height:200px;overflow:auto;margin-bottom:10px">';
    fd.forEach(d => {
      const short = d.name.substring(0, 20) + (d.name.length > 20 ? '...' : '');
      const url = 'https://shopee.vn/product/' + d.shopid + '/' + d.itemid;
      html += `<div class="result-item"><span class="link-text">-${d.discount}% - ${short}: <a href="${url}" target="_blank">${url}</a></span></div>`;
    });
    if (!fd.length) html += '<i>Không có deal phù hợp</i>';
    html += '</div></div>';
    html += '<div><b>🎟 Vouchers (' + fv.length + ')</b><div style="max-height:200px;overflow:auto">';
    fv.forEach(v => {
      const prefix = v.start > now ? '- ' + fmtTime(v.start) + ' ' : '- ';
      const url = 'https://shopee.vn/search?promotionId=' + v.promotionId + '&signature=' + v.sig + '&voucherCode=' + encodeURIComponent(v.code);
      html += `<div class="result-item" style="border-bottom:1px solid #eee;padding-bottom:4px">${prefix}<b>${v.code}</b> giảm ${fmtK(v.discount)}/${fmtK(v.min)}: <a href="${url}" target="_blank">${url}</a></div>`;
    });
    if (!fv.length) html += '<i>Không có voucher</i>';
    html += '</div></div>';
    $('scp-result').innerHTML = html;
  }

  $('scp-min').addEventListener('input', renderSCP);

  $('scp-search').onclick = async () => {
    const mode = document.querySelector('input[name="scp-mode"]:checked').value;
    const input = $('scp-input').value.trim();
    const maxShop = parseInt($('scp-maxshop').value) || 10;
    const prog = $('scp-progress');
    prog.innerHTML = '';
    scpDeals = [];
    scpVouchers = [];

    let shopIds = [];
    if (mode === 'html') {
      prog.innerHTML = 'Đang quét HTML...';
      const all = extractShopIdsFromHTML();
      if (!all.length) { prog.innerHTML = 'Không tìm thấy shop.'; return; }
      shopIds = all.slice(0, maxShop);
    } else if (mode === 'id') {
      if (!input || !/^[\d\s,]+$/.test(input)) { prog.innerHTML = 'Danh sách ID không hợp lệ.'; return; }
      shopIds = input.split(/[\s,]+/).filter(id => /^\d+$/.test(id)).slice(0, maxShop);
      if (!shopIds.length) { prog.innerHTML = 'Không có ID hợp lệ.'; return; }
    }

    prog.innerHTML = 'Đang xử lý ' + shopIds.length + ' shop...';
    let processed = 0;
    const total = shopIds.length;
    const queue = [...shopIds];

    while (queue.length > 0) {
      const batchSize = Math.floor(Math.random() * 4) + 2;
      const batch = queue.splice(0, batchSize);
      for (const sid of batch) {
        processed++;
        try {
          const r = await fetch('https://shopee.vn/api/v4/shop/get_scp_list?shopid=' + sid, {
            headers: { 'x-requested-with': 'XMLHttpRequest', 'x-api-source': 'pc', 'referer': 'https://shopee.vn/' },
            credentials: 'include'
          });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const j = await r.json();
          if (j.error !== 0) throw new Error(j.error_msg);
          (j.data?.scp_session_detail || []).forEach(sess => {
            (sess.deep_discount_list || [sess]).forEach(list => {
              (list.items || []).forEach(obj => {
                const it = obj.item || {};
                if (!it.itemid) return;
                const discount = Math.round(it.item_card_display_price?.discount ?? (it.show_discount || it.raw_discount || 0));
                scpDeals.push({ discount, name: it.name || '', shopid: it.shopid, itemid: it.itemid });
                [it.item_card_display_price?.recommended_shop_voucher_info,
                 it.item_card_display_price?.recommended_platform_voucher_info].forEach(v => {
                  if (!v) return;
                  scpVouchers.push({
                    start: v.time_info?.start_time || v.start_time || 0,
                    code: v.voucher_code || '',
                    discount: v.voucher_discount || 0,
                    min: v.min_spend || 0,
                    promotionId: v.promotion_id || '',
                    sig: v.signature || ''
                  });
                });
              });
            });
          });
          prog.innerHTML = `Đã xong shop ${sid} (${processed}/${total})`;
        } catch (e) {
          prog.innerHTML = `Lỗi shop ${sid}: ${e.message}`;
        }
      }
      if (queue.length > 0) {
        const delay = Math.floor(Math.random() * 16) + 5;
        prog.innerHTML += ` – Chờ ${delay}s...`;
        await new Promise(r => setTimeout(r, delay * 1000));
      }
    }
    prog.innerHTML = `Xong! ${scpDeals.length} deals, ${scpVouchers.length} vouchers.`;
    renderSCP();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(`🎯 SCP Deals: ${scpDeals.length} deals, ${scpVouchers.length} vouchers`);
    }
  };

// ================= SCAN GỢI Ý (RCMD ITEMS) =================
function getShopIdFromUrl() {
    const href = location.href;
    let m = href.match(/\/shop\/(\d+)/);
    if (m) return m[1];
    m = href.match(/i\.(\d+)\.(\d+)/);
    if (m) return m[1];
    m = href.match(/\/product\/(\d+)\/(\d+)/);
    if (m) return m[1];
    return null;
}

const fmtKLocal = n => {
    const k = n / 1e8;
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'k';
};

// ✅ FIX: Sửa tham số API cho đúng với response thực tế
async function fetchRcmdItemsPage(shopId, offset, limit = 48) {
    const csrf = getCsrfToken();
    const res = await fetch('https://shopee.vn/api/v4/shop/rcmd_items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'XMLHttpRequest',
            'x-api-source': 'pc',
            'x-csrftoken': csrf,
            'Referer': `https://shopee.vn/shop/${shopId}/recommendation-landing?upstream=pdp`
        },
        credentials: 'include',
        body: JSON.stringify({
            bundle: 'shop_page_rfy',                  // giữ nguyên bundle bạn đã thấy hoạt động
            shop_id: parseInt(shopId),
            limit,
            offset,
            upstream: 'pdp',                          // upstream từ trang sản phẩm hoặc recommendation
            item_card_use_scene: 'rfy_landing_page',  // ✅ sửa lỗi chính tả "langding" → "landing"
            is_insert_new_arrival: false
        })
    });
    console.log(`[RCMD] Fetch offset=${offset} status=${res.status}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    console.log(`[RCMD] Response offset=${offset}:`, json);
    if (json.error !== 0) throw new Error(json.error_msg || 'API error ' + json.error);
    return json.data;
}

async function scanAllRcmdItems(shopId, maxItems, minDiscount, prog) {
    let allItems = [];
    let offset = 0;
    const limit = 48;
    let totalFromApi = null;
    let hasError = false;

    while (true) {
        const cap = totalFromApi !== null ? Math.min(totalFromApi, maxItems) : '?';
        prog.innerHTML = `⏳ Đang tải... ${allItems.length}/${cap} SP (offset=${offset})`;

        let data;
        try {
            data = await fetchRcmdItemsPage(shopId, offset, limit);
        } catch (e) {
            hasError = true;
            prog.innerHTML = allItems.length > 0
                ? `⚠️ Lỗi ở offset=${offset}: ${e.message}. Giữ ${allItems.length} SP đã lấy.`
                : `<span class="warning">❌ Lỗi gọi API: ${e.message}</span>`;
            break;
        }

        // Lấy total từ response nếu có
        if (totalFromApi === null && data.total && data.total > 0) {
            totalFromApi = data.total;
        }

        const cards = data?.centralize_item_card?.item_cards;
        if (!cards || !cards.length) {
            console.log('[RCMD] Không còn sản phẩm, dừng.');
            break;
        }

        allItems.push(...cards);
        console.log(`[RCMD] Đã lấy ${cards.length} SP, tổng: ${allItems.length}`);

        // Điều kiện dừng
        if (data.no_more === true) {
            console.log('[RCMD] no_more = true');
            break;
        }
        if (totalFromApi !== null && allItems.length >= totalFromApi) {
            console.log(`[RCMD] Đã lấy đủ ${totalFromApi} SP`);
            break;
        }
        if (allItems.length >= maxItems) {
            console.log('[RCMD] Đạt giới hạn maxItems');
            break;
        }
        if (cards.length < limit) {
            console.log('[RCMD] Số sản phẩm trang cuối < limit, dừng');
            break;
        }

        offset += limit;
        // delay ngẫu nhiên tránh bị chặn
        await new Promise(r => setTimeout(r, 600 + Math.random() * 900));
    }

    // Cắt bớt nếu vượt maxItems
    if (allItems.length > maxItems) allItems = allItems.slice(0, maxItems);

    // Lọc theo discount
    const filtered = allItems.filter(c => (c.item_card_display_price?.discount || 0) >= minDiscount);
    console.log(`[RCMD] Lọc còn ${filtered.length} SP với discount >= ${minDiscount}%`);
    return { items: filtered, hasError };
}

function buildRcmdLine(card, isHtml) {
    const dp = card.item_card_display_price || {};
    const name = card.item_card_displayed_asset?.name || card.name || 'Không tên';
    const shortName = name.length > 40 ? name.substring(0, 40) + '...' : name;
    const discount = dp.discount || 0;
    const price = dp.price || 0;
    const origPrice = dp.strikethrough_price || dp.original_price || 0;
    const link = `https://shopee.vn/product/${card.shopid}/${card.itemid}`;
    const priceNow = Math.round(price / 100000).toLocaleString('vi-VN');
    const priceOld = Math.round(origPrice / 100000).toLocaleString('vi-VN');
    const pv = dp.recommended_platform_voucher_info;
    const sv = dp.recommended_shop_voucher_info;

    if (isHtml) {
        const priceHtml = origPrice > price
            ? `<s>${priceOld}đ</s> ${priceNow}đ`
            : `${priceNow}đ`;
        let vHtml = '';
        if (pv) {
            const d = fmtKLocal(pv.voucher_discount || 0);
            const mn = pv.min_spend ? fmtKLocal(pv.min_spend) : '0đ';
            vHtml += ` <span style="color:#e74c3c;font-size:11px">[PV:${d}/${mn}]</span>`;
        }
        if (sv) {
            const d = fmtKLocal(sv.voucher_discount || 0);
            const mn = sv.min_spend ? fmtKLocal(sv.min_spend) : '0đ';
            vHtml += ` <span style="color:#2980b9;font-size:11px">[SV:${d}/${mn}]</span>`;
        }
        return `-${discount}% ${shortName}: <a href="${link}" target="_blank">${link}</a> ${priceHtml}${vHtml}`;
    } else {
        const priceText = origPrice > price ? `${priceOld}→${priceNow}đ` : `${priceNow}đ`;
        let vText = '';
        if (pv) {
            const d = fmtKLocal(pv.voucher_discount || 0);
            const mn = pv.min_spend ? fmtKLocal(pv.min_spend) : '0đ';
            vText += ` [PV:${d}/${mn}]`;
        }
        if (sv) {
            const d = fmtKLocal(sv.voucher_discount || 0);
            const mn = sv.min_spend ? fmtKLocal(sv.min_spend) : '0đ';
            vText += ` [SV:${d}/${mn}]`;
        }
        return `-${discount}% ${shortName}: ${link} ${priceText}${vText}`;
    }
}

function renderRcmdResult(items) {
    const d = $('rcmd-result');
    d.innerHTML = '';
    if (!items.length) {
        d.innerHTML = '<p>Không có sản phẩm phù hợp.</p>';
        return;
    }

    items.sort((a, b) => (b.item_card_display_price?.discount || 0) - (a.item_card_display_price?.discount || 0));

    let html = `<button id="rcmd-copyall-btn" class="copy-all" style="margin-bottom:8px">📋 Copy tất cả (${items.length})</button>`;
    items.forEach(card => {
        html += `<div class="result-item"><span class="link-text">${buildRcmdLine(card, true)}</span></div>`;
    });
    d.innerHTML = html;

    document.getElementById('rcmd-copyall-btn').addEventListener('click', function () {
        const text = items.map(c => buildRcmdLine(c, false)).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            this.textContent = '✓ Đã copy!';
            setTimeout(() => this.textContent = `📋 Copy tất cả (${items.length})`, 1500);
        });
        sendResultToServer('🎯 RCMD:\n' + text);
    });
}

$('rcmd-search').onclick = async () => {
    const mode = document.querySelector('input[name="rcmd-mode"]:checked').value;
    let shopId;

    if (mode === 'url') {
        shopId = getShopIdFromUrl();
        if (!shopId) {
            $('rcmd-progress').innerHTML = '<span class="warning">⚠️ Không tìm thấy shop ID trong URL.<br>Cần đứng ở trang <b>shop</b>, <b>sản phẩm</b>, hoặc <b>recommendation-landing</b> — hoặc chọn "Nhập Shop ID" và nhập thủ công.</span>';
            return;
        }
    } else {
        shopId = $('rcmd-input').value.trim();
        if (!shopId || !/^\d+$/.test(shopId)) {
            $('rcmd-progress').innerHTML = '<span class="warning">⚠️ Shop ID không hợp lệ (chỉ nhập số).</span>';
            return;
        }
    }

    const maxItems = parseInt($('rcmd-maxitems').value) || 200;
    const minDiscount = parseInt($('rcmd-min').value) || 30;
    const prog = $('rcmd-progress');

    $('rcmd-result').innerHTML = '';
    prog.innerHTML = `🔍 Đang quét shop ${shopId}...`;

    const { items, hasError } = await scanAllRcmdItems(shopId, maxItems, minDiscount, prog);

    prog.innerHTML = hasError && items.length === 0
        ? '<span class="warning">❌ Không lấy được dữ liệu, kiểm tra Console (F12) để biết chi tiết.</span>'
        : `✅ Xong! <b>${items.length}</b> SP có discount ≥ ${minDiscount}% (shop: ${shopId})`;

    renderRcmdResult(items);
    sendResultToServer(`🎯 Scan Gợi ý shop ${shopId}: ${items.length} SP ≥${minDiscount}%`);
};
  
  // ================= LƯU MÃ VOUCHER =================
  function formatTimeParts(ts) {
    const d = new Date(ts * 1000);
    return { hour: d.getHours(), day: d.getDate(), month: d.getMonth() + 1 };
  }
  function formatK2(amount) { return Math.round(amount / 1e8); }

  function addSaveRow(code, data) {
    const tbody = document.querySelector('#sv-table tbody');
    const tr = document.createElement('tr');
    const tdInfo = document.createElement('td');
    const tdStatus = document.createElement('td');
    const tdTime = document.createElement('td');

    if (!data) {
      tdInfo.textContent = `🔸 ${code}`;
      tdStatus.className = 'vbm-error'; tdStatus.textContent = '❌ Lỗi mạng';
      tdTime.textContent = '—';
    } else if (data.error && data.error !== 0) {
      tdInfo.textContent = `🔸 ${code}`;
      tdStatus.className = 'vbm-error'; tdStatus.textContent = `❌ ${data.error_msg || 'Lỗi API'}`;
      tdTime.textContent = '—';
    } else if (data.voucher) {
      const v = data.voucher;
      const start = formatTimeParts(v.start_time || 0);
      const end = formatTimeParts(v.end_time || 0);
      const discountText = v.reward_percentage > 0
        ? `${v.reward_percentage}% max ${formatK2(v.reward_cap||0)}k`
        : `${formatK2(v.reward_value||0)}k`;
      const minSpend = `${formatK2(v.min_spend||0)}k`;
      const link = `https://shopee.vn/search?promotionId=${v.promotionid}&signature=${v.signature}&voucherCode=${code}`;
      tdInfo.innerHTML = `- ${start.hour}h: ${code} giảm ${discountText}/${minSpend} áp list: <a href="${link}" target="_blank">link</a>`;
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = '📋 Copy';
      copyBtn.onclick = () => {
        const text = `- ${start.hour}h: ${code} giảm ${discountText}/${minSpend} áp list: ${link}`;
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = '✅';
          setTimeout(() => copyBtn.textContent = '📋 Copy', 1500);
        });
      };
      tdInfo.appendChild(copyBtn);

      const msgCode = data.invalid_message_code;
      if (msgCode === 0) { tdStatus.className = 'vbm-success'; tdStatus.textContent = '✅ Đã lưu'; }
      else if (msgCode === 4) { tdStatus.className = 'vbm-error'; tdStatus.textContent = '❌ Hết lượt'; }
      else if (msgCode === 14) { tdStatus.className = 'vbm-warn'; tdStatus.textContent = '⚠️ Đã lưu trước'; }
      else if (msgCode !== null && msgCode !== undefined) { tdStatus.className = 'vbm-warn'; tdStatus.textContent = `⚠️ Trạng thái (mã ${msgCode})`; }
      else { tdStatus.className = 'vbm-warn'; tdStatus.textContent = '⚠️ Không xác định'; }

      tdTime.textContent = `${start.hour}h - ${start.day}/${start.month} | ${end.hour}h - ${end.day}/${end.month}`;
    } else {
      tdInfo.textContent = `🔸 ${code}`;
      const msgCode = data.invalid_message_code;
      if (msgCode === 4) { tdStatus.className = 'vbm-error'; tdStatus.textContent = '❌ Hết lượt'; }
      else if (msgCode === 14) { tdStatus.className = 'vbm-warn'; tdStatus.textContent = '⚠️ Đã lưu trước'; }
      else if (msgCode) { tdStatus.className = 'vbm-warn'; tdStatus.textContent = `⚠️ Lỗi (mã ${msgCode})`; }
      else { tdStatus.className = 'vbm-warn'; tdStatus.textContent = '⚠️ Không thể lưu'; }
      tdTime.textContent = '—';
    }

    tr.appendChild(tdInfo);
    tr.appendChild(tdStatus);
    tr.appendChild(tdTime);
    tbody.prepend(tr);
  }

  $('sv-save').onclick = async () => {
    const codes = $('sv-input').value.split('\n').map(s => s.trim()).filter(Boolean);
    if (!codes.length) return;
    $('sv-save').disabled = true;
    $('sv-status').textContent = `Đang xử lý ${codes.length} mã...`;
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      $('sv-status').textContent = `Đang xử lý ${i+1}/${codes.length}: ${code}...`;
      try {
        const res = await fetch('https://shopee.vn/api/v2/voucher_wallet/save_platform_voucher_by_voucher_code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voucher_code: code })
        });
        const json = await res.json();
        if (json.error !== 0) {
          addSaveRow(code, { error: json.error, error_msg: json.error_msg });
        } else {
          addSaveRow(code, json.data || {});
        }
      } catch (e) {
        addSaveRow(code, null);
      }
      await new Promise(r => setTimeout(r, 400));
    }
    $('sv-save').disabled = false;
    $('sv-status').textContent = '✅ Hoàn thành!';
  };

  // ================= WEBSOCKET =================
  let ws = null;
  let wsReconnectTimer = null;

  function updateStatus(connected) {
    const el = $('ws-status');
    if (el) {
      el.textContent = connected ? '🟢' : '🔴';
      el.title = connected ? 'Đã kết nối server' : 'Mất kết nối - Click để thử lại';
    }
  }

  function connectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    ws = new WebSocket(SERVER_WS_URL);
    ws.onopen = () => {
      updateStatus(true);
      if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
    };
    ws.onmessage = (event) => {
      try {
        const cmd = JSON.parse(event.data);
        if (cmd.action === 'scan_flash') {
          $('flash-min').value = cmd.minDiscount || 70;
          $('flash-price-min').value = cmd.minPriceK || 0;
          $('flash-maxshop').value = cmd.maxShop || 10;
          document.querySelector('input[name="flash-mode"][value="html"]').checked = true;
          document.querySelector('.tab-btn[data-tab="flash"]').click();
          $('flash-search').click();
        } else if (cmd.action === 'scan_voucher') {
          document.querySelector('input[name="vouch-mode"][value="html"]').checked = true;
          document.querySelector('.tab-btn[data-tab="voucher"]').click();
          $('vouch-search').click();
        } else if (cmd.action === 'scan_scp') {
          document.querySelector('.tab-btn[data-tab="scp"]').click();
          $('scp-search').click();
        } else if (cmd.action === 'save_voucher') {
          document.querySelector('.tab-btn[data-tab="savevoucher"]').click();
          if (cmd.codes && Array.isArray(cmd.codes)) {
            $('sv-input').value = cmd.codes.join('\n');
            $('sv-save').click();
          }
        } else if (cmd.action === 'scan_rcmd') {
          document.querySelector('.tab-btn[data-tab="rcmd"]').click();
          $('rcmd-search').click();
        }
      } catch (e) {}
    };
    ws.onclose = () => {
      updateStatus(false);
      ws = null;
      if (!wsReconnectTimer) wsReconnectTimer = setTimeout(connectWebSocket, 10000);
    };
    ws.onerror = () => { ws.close(); };
  }

  function sendResultToServer(text) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(text);
    }
  }

  $('ws-status').addEventListener('click', connectWebSocket);

  // ================= KHỞI ĐỘNG =================
  connectWebSocket();
  scanPage();
  flashUpdateInfo();
  vouchUpdateInfo();
})();
