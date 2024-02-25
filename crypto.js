const express = require('express');
const { WebsocketStream } = require('@binance/connector');

const app = express();
const PORT = 3000;

// 設置模板引擎
app.set('view engine', 'ejs');

// 中間件處理靜態資源
app.use(express.static('public'));

// 路由處理
app.get('/', (req, res) => {
  res.render('index', { latestPrice: 'Loading...' }); // 初始顯示Loading...
});

// 創建WebSocket客戶端
const websocketStreamClient = new WebsocketStream({
  callbacks: {
    message: data => {
      const message = JSON.parse(data);
      const latestPrice = message.c;
      const symbol = message.s.toLowerCase();

      // 發送價格更新到所有連接的客戶端，區分不同交易對
      io.emit(`${symbol}PriceUpdate`, latestPrice);
    }
  }
});

// 启动WebSocket客户端
websocketStreamClient.ticker('btcusdt');
websocketStreamClient.ticker('ethusdt'); 
websocketStreamClient.ticker('solusdt');
websocketStreamClient.ticker('bnbusdt');
websocketStreamClient.ticker('dotusdt');

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// 设置Socket.IO
const io = require('socket.io')(server);

// 监听客户端连接事件
io.on('connection', (socket) => {
  console.log('A client connected');
});

// 关闭WebSocket客户端
setTimeout(() => {
  websocketStreamClient.disconnect();
  server.close();
}, 60000); // 关闭WebSocket客户端和服务器