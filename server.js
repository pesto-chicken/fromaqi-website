const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// CORS 설정 추가
app.use((req, res, next) => {
    // Vercel 도메인 명시적 허용
    const allowedOrigins = [
        'https://fromaqi.com',
        'https://www.fromaqi.com',
        'https://fromaqi-website.vercel.app',
        'https://fromaqi-website-git-main-pesto-chicken.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 메모리 기반 임시 저장소 (MongoDB 연결 실패 시 사용)
let tempNotices = [];
let tempAdmins = [
    { username: 'admin', password: 'admin123' }
];

// MongoDB 연결
let isMongoConnected = false;
let Notice, Admin;

// MongoDB 연결 시도
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        console.log('=== MongoDB 연결 디버깅 시작 ===');
        console.log('MONGODB_URI 환경변수 존재:', !!mongoURI);
        
        if (!mongoURI) {
            console.log('❌ MONGODB_URI 환경변수가 설정되지 않았습니다.');
            console.log('로컬 환경에서는 메모리 기반 임시 저장소를 사용합니다.');
            console.log('배포 환경에서는 Render 대시보드 → Environment → MONGODB_URI 설정 필요');
            return;
        }

        // MongoDB 모듈 동적 로드
        const mongoose = require('mongoose');

        // 연결 문자열 분석
        console.log('연결 문자열 길이:', mongoURI.length);
        console.log('연결 문자열 시작:', mongoURI.substring(0, 20) + '...');
        
        // 연결 문자열에서 민감한 정보 숨기기
        const sanitizedURI = mongoURI.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1***:***@');
        console.log('연결 문자열 (보안처리됨):', sanitizedURI);

        // 연결 옵션 설정
        const connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // 5초 타임아웃
            socketTimeoutMS: 45000, // 소켓 타임아웃
            connectTimeoutMS: 10000, // 연결 타임아웃
            maxPoolSize: 10, // 최대 연결 풀 크기
        };

        console.log('MongoDB 연결 시도 중...');
        await mongoose.connect(mongoURI, connectionOptions);

        console.log('✅ MongoDB에 성공적으로 연결되었습니다.');

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
            console.log('✅ 초기 관리자 계정이 생성되었습니다. (admin/admin123)');
        } else {
            console.log('✅ 기존 관리자 계정 확인됨');
        }

        isMongoConnected = true;
        console.log('🎉 게시판 기능이 완전히 활성화되었습니다!');
        
    } catch (error) {
        console.error('❌ MongoDB 연결 실패');
        console.error('오류 메시지:', error.message);
        console.error('오류 코드:', error.code);
        console.error('전체 오류:', error);
        
        console.log('\n=== MongoDB Atlas 문제 해결 체크리스트 ===');
        
        if (error.message.includes('ENOTFOUND')) {
            console.log('🔍 문제: DNS 조회 실패 - 클러스터 주소가 잘못됨');
            console.log('해결: MongoDB Atlas에서 정확한 연결 문자열 복사');
        } else if (error.message.includes('bad auth')) {
            console.log('🔍 문제: 인증 실패 - 사용자명/비밀번호 오류');
            console.log('해결: Database Access에서 사용자 정보 확인');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('🔍 문제: 연결 거부 - 네트워크 접근 설정 필요');
            console.log('해결: Network Access에서 0.0.0.0/0 추가');
        } else if (error.message.includes('timeout')) {
            console.log('🔍 문제: 연결 타임아웃 - 네트워크 또는 방화벽 문제');
            console.log('해결: Network Access 설정 확인');
        }
        
        console.log('\n📋 수동 설정 가이드:');
        console.log('1. MongoDB Atlas → Database → Connect');
        console.log('2. Connect to your application 선택');
        console.log('3. Driver: Node.js, Version: 5.0 or later');
        console.log('4. 연결 문자열 복사 후 Render 환경변수에 설정');
        console.log('5. Database Access에서 사용자 권한 확인');
        console.log('6. Network Access에서 0.0.0.0/0 추가');
        
        isMongoConnected = false;
        console.log('💡 로컬 환경에서는 메모리 기반 임시 저장소를 사용합니다.');
    }
};

// MongoDB 연결 시도
connectDB();

// JWT 인증 미들웨어
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET || 'fromaqi-jwt-secret-key', (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
}

// 관리자 로그인 API (JWT 토큰 발급)
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        let isValid = false;
        if (isMongoConnected) {
            const admin = await Admin.findOne({ username, password });
            isValid = !!admin;
        } else {
            const admin = tempAdmins.find(a => a.username === username && a.password === password);
            isValid = !!admin;
        }
        if (isValid) {
            const token = jwt.sign({ username, isAdmin: true }, process.env.JWT_SECRET || 'fromaqi-jwt-secret-key', { expiresIn: '2h' });
            res.json({ success: true, token });
        } else {
            res.status(401).json({ success: false, message: '잘못된 로그인 정보입니다.' });
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

// 관리자 로그아웃 API (JWT 방식에서는 세션 삭제 불필요)
app.post('/api/admin/logout', (req, res) => {
    res.json({ success: true });
});

// 공지사항 목록 조회 API
app.get('/api/notices', async (req, res) => {
    try {
        if (isMongoConnected) {
            const notices = await Notice.find().sort({ createdAt: -1 });
            res.json(notices);
        } else {
            // 메모리 기반 조회
            res.json(tempNotices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
    } catch (error) {
        console.error('공지사항 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 공지사항 작성 API (JWT 인증 필요)
app.post('/api/notices', authenticateJWT, async (req, res) => {
    if (!req.user.isAdmin) return res.sendStatus(403);
    try {
        const { title, content } = req.body;
        if (isMongoConnected) {
            const notice = await Notice.create({
                title,
                content,
                author: '관리자'
            });
            res.status(201).json(notice);
        } else {
            const notice = {
                _id: Date.now().toString(),
                title,
                content,
                author: '관리자',
                createdAt: new Date()
            };
            tempNotices.push(notice);
            res.status(201).json(notice);
        }
    } catch (error) {
        console.error('공지사항 작성 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 공지사항 삭제 API (JWT 인증 필요)
app.delete('/api/notices/:id', authenticateJWT, async (req, res) => {
    if (!req.user.isAdmin) return res.sendStatus(403);
    try {
        const { id } = req.params;
        if (isMongoConnected) {
            await Notice.findByIdAndDelete(id);
        } else {
            tempNotices = tempNotices.filter(notice => notice._id !== id);
        }
        res.json({ message: '공지사항이 삭제되었습니다.' });
    } catch (error) {
        console.error('공지사항 삭제 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 관리자 상태 확인 API (JWT 토큰 필요)
app.get('/api/admin/status', authenticateJWT, (req, res) => {
    res.json({ isAdmin: !!req.user.isAdmin });
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
    if (isMongoConnected) {
        console.log('게시판 기능이 활성화되어 있습니다. (MongoDB 연결됨)');
    } else {
        console.log('게시판 기능이 활성화되어 있습니다. (메모리 기반 임시 저장소 사용)');
        console.log('관리자 계정: admin / admin123');
    }
});
