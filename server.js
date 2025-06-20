const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB 연결
let isMongoConnected = false;
let Notice, Admin;

// MongoDB 연결 시도
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        console.log('MongoDB 연결 시도 중...');
        console.log('MONGODB_URI 환경변수 존재:', !!mongoURI);
        
        if (!mongoURI) {
            console.log('MONGODB_URI 환경변수가 설정되지 않았습니다.');
            return;
        }

        // 연결 문자열에서 민감한 정보 숨기기
        const sanitizedURI = mongoURI.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1***:***@');
        console.log('연결 문자열 (보안처리됨):', sanitizedURI);

        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('MongoDB에 성공적으로 연결되었습니다.');

        // 스키마 정의
        const noticeSchema = new mongoose.Schema({
            title: { type: String, required: true },
            content: { type: String, required: true },
            author: { type: String, default: '관리자' },
            createdAt: { type: Date, default: Date.now }
        });

        const adminSchema = new mongoose.Schema({
            username: { type: String, required: true, unique: true },
            password: { type: String, required: true }
        });

        Notice = mongoose.model('Notice', noticeSchema);
        Admin = mongoose.model('Admin', adminSchema);

        // 초기 관리자 계정 생성
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
            await Admin.create({
                username: 'admin',
                password: 'admin123'
            });
            console.log('초기 관리자 계정이 생성되었습니다. (admin/admin123)');
        }

        isMongoConnected = true;
    } catch (error) {
        console.error('MongoDB 연결 실패:', error.message);
        console.error('전체 오류:', error);
        console.log('=== MongoDB 연결 문제 해결 방법 ===');
        console.log('1. 비밀번호에 특수문자가 있다면 URL 인코딩하세요:');
        console.log('   @ → %40, : → %3A, / → %2F, ? → %3F, # → %23');
        console.log('2. MongoDB Atlas에서 새 사용자 생성 (특수문자 없는 비밀번호)');
        console.log('3. 네트워크 접근 설정에서 0.0.0.0/0 추가');
        console.log('4. 연결 문자열 형식: mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority');
        isMongoConnected = false;
    }
};

// MongoDB 연결 시도
connectDB();

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

// 관리자 인증 미들웨어
const requireAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ message: '관리자 권한이 필요합니다.' });
    }
    next();
};

// 관리자 로그인 API
app.post('/api/admin/login', async (req, res) => {
    try {
        if (!isMongoConnected) {
            return res.status(503).json({ success: false, message: '데이터베이스가 연결되지 않았습니다.' });
        }

        const { username, password } = req.body;
        const admin = await Admin.findOne({ username, password });

        if (admin) {
            req.session.isAdmin = true;
            res.json({ success: true, message: '로그인 성공' });
        } else {
            res.status(401).json({ success: false, message: '잘못된 로그인 정보입니다.' });
        }
    } catch (error) {
        console.error('로그인 오류:', error);
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
    try {
        if (!isMongoConnected) {
            return res.json([]);
        }

        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        console.error('공지사항 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 공지사항 작성 API (관리자만)
app.post('/api/notices', requireAdmin, async (req, res) => {
    try {
        if (!isMongoConnected) {
            return res.status(503).json({ message: '데이터베이스가 연결되지 않았습니다.' });
        }

        const { title, content } = req.body;
        const notice = await Notice.create({
            title,
            content,
            author: '관리자'
        });

        res.status(201).json(notice);
    } catch (error) {
        console.error('공지사항 작성 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 공지사항 삭제 API (관리자만)
app.delete('/api/notices/:id', requireAdmin, async (req, res) => {
    try {
        if (!isMongoConnected) {
            return res.status(503).json({ message: '데이터베이스가 연결되지 않았습니다.' });
        }

        const { id } = req.params;
        await Notice.findByIdAndDelete(id);
        res.json({ message: '공지사항이 삭제되었습니다.' });
    } catch (error) {
        console.error('공지사항 삭제 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 관리자 상태 확인 API
app.get('/api/admin/status', (req, res) => {
    res.json({ isAdmin: !!req.session.isAdmin });
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
    if (isMongoConnected) {
        console.log('게시판 기능이 활성화되어 있습니다.');
    } else {
        console.log('게시판 기능이 비활성화되어 있습니다. (MongoDB 연결 실패)');
    }
});
