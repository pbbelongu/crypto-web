const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const { WebsocketStream } = require('@binance/connector');

const app = express();
const PORT = 3000;

app.use(session({
  secret: 'secret', 
  resave: true,
  saveUninitialized: true
}));

// 解析POST請求的body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MySQL 連接配置
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '0000',
  database: 'crypto_db'
});

// 連接到 MySQL 數據庫
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

// 設置模板引擎
app.set('view engine', 'ejs');

// 中間件處理靜態資源
app.use(express.static('public'));

// 註冊頁面路由
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

// 登入頁面路由
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// 處理註冊請求
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // 在這裡將用戶信息插入到 MySQL 數據庫
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, password], (err, result) => {
    if (err) {
      res.status(500).send('註冊失敗');
      throw err;
    }
    console.log('註冊成功');
    res.status(200).send('註冊成功');
  });
});

// 處理登入請求
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 在這裡檢查用戶名和密碼是否匹配
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      res.status(500).send('An error occurred while processing login');
    } else {
      if (results.length > 0) {
        // 如果找到匹配的用戶，則登入成功，將用戶導向主頁
        req.session.loggedIn = true;
        req.session.username = username;
        res.redirect('/');
      } else {
        // 如果未找到匹配的用戶，則登入失敗
        res.status(401).send('Invalid username or password');
      }
    }
  });
});

app.get('/logout', (req, res) => {
  req.session.username = null; 
  res.redirect('/');
});

app.get('/', (req, res) => {
  const loggedIn = req.session.loggedIn;
  const username = req.session.username;

  res.render('index', { loggedIn, username });
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

// 啟動WebSocket客戶端
websocketStreamClient.ticker('btcusdt');
websocketStreamClient.ticker('ethusdt'); 
websocketStreamClient.ticker('solusdt');
websocketStreamClient.ticker('bnbusdt');
websocketStreamClient.ticker('dotusdt');

// 啟動服務器
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// 設置Socket.IO
const io = require('socket.io')(server);

// 監聽客戶端連接事件
io.on('connection', (socket) => {
  console.log('A client connected');
});

// 關閉WebSocket客戶端
/*setTimeout(() => {
  websocketStreamClient.disconnect();
  server.close();
}, 60000); //關閉WebSocket客戶端和服務器
*/