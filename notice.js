// 전역 변수
let isAdmin = false;

// API 기본 URL 설정 (window 전역 변수 사용)
const API_BASE_URL = window.API_BASE_URL || '';

// 디버깅 로그 추가
console.log('=== Notice.js 초기화 ===');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('현재 도메인:', window.location.origin);

// DOM 요소
const noticeList = document.getElementById('noticeList');
const adminLoginForm = document.getElementById('adminLoginForm');
const noticeForm = document.getElementById('noticeForm');
const loginForm = document.getElementById('loginForm');
const writeNoticeForm = document.getElementById('writeNoticeForm');

// API URL 생성 함수
function getApiUrl(endpoint) {
    const url = API_BASE_URL + endpoint;
    console.log('API 호출 URL:', url);
    return url;
}

// JWT 토큰 가져오기
function getToken() {
    const token = localStorage.getItem('jwtToken');
    console.log('저장된 JWT 토큰:', token ? '존재함' : '없음');
    return token;
}

// JWT 토큰에서 isAdmin 추출(간단 파싱)
function isAdminFromToken() {
    const token = getToken();
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT 페이로드:', payload);
        return payload.isAdmin;
    } catch (e) {
        console.error('JWT 파싱 오류:', e);
        return false;
    }
}

// 관리자 상태 확인 (JWT 토큰 기반)
function checkAdminStatus() {
    isAdmin = isAdminFromToken();
    console.log('관리자 상태:', isAdmin);
    if (isAdmin) {
        showNoticeForm();
    } else {
        showLoginForm();
    }
}

// 공지사항 목록 조회
async function loadNotices() {
    try {
        console.log('공지사항 로드 시작...');
        const response = await fetch(getApiUrl('/api/notices'));
        console.log('공지사항 응답 상태:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const notices = await response.json();
        console.log('로드된 공지사항:', notices);
        displayNotices(notices);
    } catch (error) {
        console.error('공지사항 로드 중 오류 발생:', error);
        noticeList.innerHTML = '<div class="notice-error">공지사항을 불러올 수 없습니다. 서버 연결을 확인해주세요.</div>';
    }
}

// 공지사항 표시
function displayNotices(notices) {
    noticeList.innerHTML = notices.map(notice => `
        <div class="notice-item" data-id="${notice._id}">
            <h3>${notice.title}</h3>
            <div class="notice-meta">
                <span>작성자: ${notice.author}</span>
                <span>작성일: ${new Date(notice.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="notice-content">${notice.content}</div>
            ${isAdmin ? `
                <div class="notice-actions">
                    <button onclick="deleteNotice('${notice._id}')">삭제</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// 관리자 로그인
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('로그인 시도:', { username, password: '***' });
    
    try {
        const response = await fetch(getApiUrl('/api/admin/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        console.log('로그인 응답 상태:', response.status);
        console.log('로그인 응답 헤더:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('로그인 응답 데이터:', data);
        
        if (data.success && data.token) {
            localStorage.setItem('jwtToken', data.token);
            console.log('JWT 토큰 저장됨');
            isAdmin = true;
            showNoticeForm();
            loadNotices();
            alert('로그인 성공!');
        } else {
            console.error('로그인 실패:', data.message);
            alert('로그인에 실패했습니다: ' + (data.message || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('로그인 중 오류 발생:', error);
        alert('로그인 중 오류가 발생했습니다: ' + error.message);
    }
}

// 공지사항 작성
async function handleWriteNotice(event) {
    event.preventDefault();
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    try {
        const response = await fetch(getApiUrl('/api/notices'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ title, content })
        });
        if (response.ok) {
            document.getElementById('noticeTitle').value = '';
            document.getElementById('noticeContent').value = '';
            loadNotices();
        } else {
            alert('공지사항 작성에 실패했습니다.');
        }
    } catch (error) {
        console.error('공지사항 작성 중 오류 발생:', error);
        alert('공지사항 작성 중 오류가 발생했습니다.');
    }
}

// 공지사항 삭제
async function deleteNotice(id) {
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;
    try {
        const response = await fetch(getApiUrl(`/api/notices/${id}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        if (response.ok) {
            loadNotices();
        } else {
            alert('공지사항 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('공지사항 삭제 중 오류 발생:', error);
        alert('공지사항 삭제 중 오류가 발생했습니다.');
    }
}

// 폼 표시 함수들
function showLoginForm() {
    adminLoginForm.style.display = 'block';
    noticeForm.style.display = 'none';
}

function showNoticeForm() {
    adminLoginForm.style.display = 'none';
    noticeForm.style.display = 'block';
}

// 로그아웃 함수 추가
function logout() {
    localStorage.removeItem('jwtToken');
    isAdmin = false;
    showLoginForm();
}

// 이벤트 리스너 등록
loginForm.addEventListener('submit', handleLogin);
writeNoticeForm.addEventListener('submit', handleWriteNotice);

// 초기 로드
checkAdminStatus();
loadNotices(); 