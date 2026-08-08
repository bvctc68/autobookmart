require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

const bot = new TelegramBot(BOT_TOKEN);
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clientWs = null;

wss.on('connection', (ws) => {
  console.log('Client connected');
  clientWs = ws;

  ws.on('close', () => {
    console.log('Client disconnected');
    clientWs = null;
  });

  ws.on('message', (data) => {
    const message = data.toString();
    bot.sendMessage(CHAT_ID, message).catch(console.error);
  });
});

app.use(express.json());
app.post('/webhook', (req, res) => {
  const { message } = req.body;
  if (!message || !message.text) return res.sendStatus(200);
  
  const chatId = message.chat.id;
  if (chatId.toString() !== CHAT_ID) {
    bot.sendMessage(chatId, '⛔ Bạn không có quyền điều khiển.');
    return res.sendStatus(200);
  }

  const text = message.text.trim();
  const args = text.split(' ');

  if (text === '/start') {
    bot.sendMessage(chatId, '🤖 Bot săn Shopee sẵn sàng.\nDùng /help để xem lệnh.');
  } else if (text === '/help') {
    bot.sendMessage(chatId, `/scan_flash [giảm%] [giá_gốc_k] [số_shop] - Quét Flash Sale\n/scan_voucher - Quét voucher\n/status - Kiểm tra trạng thái`);
  } else if (text.startsWith('/scan_flash')) {
    const minDiscount = parseInt(args[1]) || 70;
    const minPriceK = parseInt(args[2]) || 0;
    const maxShop = parseInt(args[3]) || 10;
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        action: 'scan_flash',
        minDiscount,
        minPriceK,
        maxShop
      }));
      bot.sendMessage(chatId, `🔍 Đang quét Flash Sale: ≥ ${minDiscount}%, giá gốc ≥ ${minPriceK}k, ${maxShop} shop`);
    } else {
      bot.sendMessage(chatId, '❌ Trình duyệt chưa kết nối. Mở Shopee và chạy bookmarklet.');
    }
  } else if (text === '/scan_voucher') {
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ action: 'scan_voucher' }));
      bot.sendMessage(chatId, '🔍 Đang quét voucher...');
    } else {
      bot.sendMessage(chatId, '❌ Trình duyệt chưa kết nối.');
    }
  } else if (text === '/status') {
    bot.sendMessage(chatId, clientWs && clientWs.readyState === WebSocket.OPEN ? '✅ Client đang online.' : '⛔ Client offline.');
  } else {
    bot.sendMessage(chatId, '❓ Lệnh không hợp lệ. /help để xem danh sách lệnh.');
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (WEBHOOK_URL) {
    bot.setWebHook(WEBHOOK_URL).then(() => console.log('Webhook set to', WEBHOOK_URL)).catch(console.error);
  } else {
    console.warn('WEBHOOK_URL not set. Using polling...');
    bot.startPolling();
  }
});
