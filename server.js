const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB 연결 (선택적)
let isMongoConnected = false;
let Notice, Admin;

async function connectToMongoDB() {
    const mongoUri = process.env.MONGODB_URI;
    console.log('MongoDB URI 확인:', mongoUri ? '설정됨' : '설정되지 않음');
    
    if (!mongoUri) {
        console.log('MONGODB_URI가 설정되지 않아 게시판 기능이 비활성화됩니다.');
        return;
    }

    try {
        console.log('MongoDB 연결 시도 중...');
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10초 타임아웃
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
        });
        
        console.log('MongoDB 연결 성공');
        isMongoConnected = true;
        
        // 스키마 정의
        const noticeSchema = new mongoose.Schema({
            title: String,
            content: String,
            author: String,
            createdAt: { type: Date, default: Date.now }
        });
        Notice = mongoose.model('Notice', noticeSchema);

        const adminSchema = new mongoose.Schema({
            username: String,
            password: String
        });
        Admin = mongoose.model('Admin', adminSchema);
        
        // 초기 관리자 계정 생성
        await createInitialAdmin();
        
    } catch (error) {
        console.log('MongoDB 연결 실패 상세 정보:');
        console.log('에러 메시지:', error.message);
        console.log('에러 코드:', error.code);
        console.log('에러 이름:', error.name);
        console.log('게시판 기능은 비활성화됩니다.');
        isMongoConnected = false;
    }
}

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
    if (!isMongoConnected) {
        return res.status(503).json({ success: false, message: '데이터베이스가 연결되지 않았습니다.' });
    }

    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (admin && await bcrypt.compare(password, admin.password)) {
            req.session.isAdmin = true;
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: '잘못된 로그인 정보입니다.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

// 관리자 로그아웃 API
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// 공지사항 목록 조회 API
app.get('/api/notices', async (req, res) => {
    if (!isMongoConnected) {
        return res.json([]);
    }

    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 공지사항 작성 API (관리자만)
app.post('/api/notices', async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).json({ message: '데이터베이스가 연결되지 않았습니다.' });
    }

    if (!req.session.isAdmin) {
        return res.status(403).json({ message: '권한이 없습니다.' });
    }

    try {
        const { title, content } = req.body;
        const notice = new Notice({
            title,
            content,
            author: '관리자'
        });
        await notice.save();
        res.json(notice);
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 공지사항 삭제 API (관리자만)
app.delete('/api/notices/:id', async (req, res) => {
    if (!isMongoConnected) {
        return res.status(503).json({ message: '데이터베이스가 연결되지 않았습니다.' });
    }

    if (!req.session.isAdmin) {
        return res.status(403).json({ message: '권한이 없습니다.' });
    }

    try {
        await Notice.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 관리자 상태 확인 API
app.get('/api/admin/status', (req, res) => {
    res.json({ isAdmin: !!req.session.isAdmin });
});

// 초기 관리자 계정 생성 (MongoDB 연결 시에만)
async function createInitialAdmin() {
    if (!isMongoConnected) return;
    
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await Admin.create({
                username: 'admin',
                password: hashedPassword
            });
            console.log('초기 관리자 계정이 생성되었습니다.');
        }
    } catch (error) {
        console.error('관리자 계정 생성 중 오류 발생:', error);
    }
}

// 서버 시작
async function startServer() {
    // MongoDB 연결 시도 (비동기로 처리)
    connectToMongoDB().then(() => {
        // MongoDB 연결 완료 후 서버 시작
        app.listen(port, () => {
            console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
            if (!isMongoConnected) {
                console.log('게시판 기능이 비활성화되어 있습니다.');
            }
        });
    }).catch((error) => {
        // MongoDB 연결 실패해도 서버는 시작
        console.log('MongoDB 연결 실패로 게시판 기능이 비활성화됩니다.');
        app.listen(port, () => {
            console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
            console.log('게시판 기능이 비활성화되어 있습니다.');
        });
    });
}

// 서버 시작
startServer();
