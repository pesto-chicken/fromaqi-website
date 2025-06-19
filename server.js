const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB 연결 비활성화 (임시)
let isMongoConnected = false;
let Notice, Admin;

console.log('MongoDB 연결이 비활성화되어 있습니다.');
console.log('게시판 기능은 사용할 수 없습니다.');

// 세션 설정
app.use(session({
    secret: process.env.SESSION_SECRET || 'fromaqi-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 관리자 로그인 API
app.post('/api/admin/login', async (req, res) => {
    return res.status(503).json({ success: false, message: '데이터베이스가 연결되지 않았습니다.' });
});

// 관리자 로그아웃 API
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// 공지사항 목록 조회 API
app.get('/api/notices', async (req, res) => {
    return res.json([]);
});

// 공지사항 작성 API (관리자만)
app.post('/api/notices', async (req, res) => {
    return res.status(503).json({ message: '데이터베이스가 연결되지 않았습니다.' });
});

// 공지사항 삭제 API (관리자만)
app.delete('/api/notices/:id', async (req, res) => {
    return res.status(503).json({ message: '데이터베이스가 연결되지 않았습니다.' });
});

// 관리자 상태 확인 API
app.get('/api/admin/status', (req, res) => {
    res.json({ isAdmin: false });
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
    console.log('게시판 기능이 비활성화되어 있습니다.');
});
