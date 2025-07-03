// 모바일 터치 스와이프 슬라이더 - 완전히 새로 작성
document.addEventListener('DOMContentLoaded', function() {
    // 디버깅 정보 표시
    function showDebug(message) {
        console.log(message);
        
        let debugDiv = document.getElementById('debug-info');
        if (!debugDiv) {
            debugDiv = document.createElement('div');
            debugDiv.id = 'debug-info';
            debugDiv.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 10000;
                max-width: 300px;
                word-wrap: break-word;
            `;
            document.body.appendChild(debugDiv);
        }
        
        const time = new Date().toLocaleTimeString();
        debugDiv.innerHTML += `<div>[${time}] ${message}</div>`;
        
        // 최근 10개만 유지
        const lines = debugDiv.innerHTML.split('<div>');
        if (lines.length > 11) {
            debugDiv.innerHTML = lines.slice(-10).join('<div>');
        }
    }

    // 요소들 가져오기
    const slider = document.querySelector('.menu-slider');
    const prevBtn = document.querySelector('.slider-button.prev');
    const nextBtn = document.querySelector('.slider-button.next');
    const menuTabs = document.querySelectorAll('.menu-tab');
    const sliderWrapper = document.querySelector('.menu-slider-wrapper');

    // 상태 변수
    let currentPosition = 0;
    let currentCategory = 'sandwich';
    let isMobile = window.innerWidth <= 700;

    showDebug('터치 스와이프 슬라이더 초기화');
    showDebug(`모바일 모드: ${isMobile}`);

    // 모바일에서 화살표 버튼 완전히 숨기기
    function hideArrowButtons() {
        if (isMobile) {
            if (prevBtn) {
                prevBtn.style.display = 'none';
                prevBtn.style.visibility = 'hidden';
                prevBtn.style.opacity = '0';
                prevBtn.style.pointerEvents = 'none';
            }
            if (nextBtn) {
                nextBtn.style.display = 'none';
                nextBtn.style.visibility = 'hidden';
                nextBtn.style.opacity = '0';
                nextBtn.style.pointerEvents = 'none';
            }
            showDebug('화살표 버튼 완전히 숨김');
        }
    }

    // 터치 스와이프 변수
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startPosition = 0;

    // 터치 시작
    function handleTouchStart(e) {
        if (!isMobile) return;
        
        startX = e.touches[0].clientX;
        startPosition = currentPosition;
        isDragging = true;
        
        showDebug(`터치 시작: ${startX}`);
        showDebug(`시작 위치: ${startPosition}`);
        
        // 슬라이더에 스타일 추가
        slider.style.transition = 'none';
        slider.style.cursor = 'grabbing';
        
        // 이벤트 전파 중단
        e.preventDefault();
        e.stopPropagation();
    }

    // 터치 이동
    function handleTouchMove(e) {
        if (!isMobile || !isDragging) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        currentX = e.touches[0].clientX;
        const diffX = startX - currentX;
        const newPosition = startPosition + diffX;
        
        // 슬라이더 이동
        slider.style.transform = `translateX(-${newPosition}px)`;
        
        showDebug(`터치 이동: ${currentX}, 차이: ${diffX}`);
    }

    // 터치 종료
    function handleTouchEnd(e) {
        if (!isMobile || !isDragging) return;
        
        isDragging = false;
        const diffX = startX - currentX;
        const slideWidth = 125; // 105px + 20px gap
        
        showDebug(`터치 종료: 차이 ${diffX}`);
        
        // 스와이프 방향 결정 (최소 50px 이동해야 함)
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // 왼쪽으로 스와이프 (다음)
                moveSlide('next');
            } else {
                // 오른쪽으로 스와이프 (이전)
                moveSlide('prev');
            }
        } else {
            // 원래 위치로 복귀
            slider.style.transform = `translateX(-${currentPosition}px)`;
        }
        
        // 스타일 복원
        slider.style.transition = 'transform 0.3s ease';
        slider.style.cursor = 'grab';
        
        // 이벤트 전파 중단
        e.preventDefault();
        e.stopPropagation();
    }

    // 슬라이드 이동 함수
    function moveSlide(direction) {
        const activeSlides = document.querySelectorAll('.menu-slide[data-category="' + currentCategory + '"]:not([style*="display: none"])');
        const totalSlides = activeSlides.length;
        
        showDebug(`=== 슬라이드 이동: ${direction} ===`);
        showDebug(`카테고리: ${currentCategory}`);
        showDebug(`총 슬라이드: ${totalSlides}`);
        showDebug(`현재 위치: ${currentPosition}`);
        
        // 슬라이드 너비 (gap 포함)
        const slideWidth = 125; // 105px + 20px gap
        
        if (direction === 'next') {
            // 다음으로 이동
            currentPosition += slideWidth;
            showDebug(`다음 위치: ${currentPosition}`);
        } else if (direction === 'prev') {
            // 이전으로 이동
            currentPosition = Math.max(0, currentPosition - slideWidth);
            showDebug(`이전 위치: ${currentPosition}`);
        }
        
        // 슬라이더 이동
        slider.style.transform = `translateX(-${currentPosition}px)`;
        showDebug(`Transform: translateX(-${currentPosition}px)`);
    }
    
    // 카테고리 변경
    function changeCategory(category) {
        currentCategory = category;
        currentPosition = 0;
        
        showDebug(`=== 카테고리 변경: ${category} ===`);
        
        // 모든 슬라이드 숨기기
        const allSlides = document.querySelectorAll('.menu-slide');
        allSlides.forEach(slide => {
            slide.style.display = 'none';
        });
        
        // 선택된 카테고리만 표시
        const activeSlides = document.querySelectorAll(`.menu-slide[data-category="${category}"]`);
        activeSlides.forEach(slide => {
            slide.style.display = 'block';
        });
        
        showDebug(`활성 슬라이드: ${activeSlides.length}개`);
        
        // 슬라이더 초기화
        slider.style.transform = 'translateX(0)';
        showDebug('슬라이더 위치 초기화');
        
        // 탭 활성화
        menuTabs.forEach(tab => {
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }
    
    // 모바일 터치 이벤트 리스너 등록
    if (isMobile) {
        showDebug('모바일 터치 이벤트 리스너 등록 시작');
        
        // 슬라이더 래퍼에 이벤트 리스너 등록
        if (sliderWrapper) {
            sliderWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
            sliderWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
            sliderWrapper.addEventListener('touchend', handleTouchEnd, { passive: false });
            showDebug('슬라이더 래퍼에 터치 이벤트 등록');
        }
        
        // 슬라이더 자체에도 이벤트 리스너 등록
        if (slider) {
            slider.addEventListener('touchstart', handleTouchStart, { passive: false });
            slider.addEventListener('touchmove', handleTouchMove, { passive: false });
            slider.addEventListener('touchend', handleTouchEnd, { passive: false });
            showDebug('슬라이더에 터치 이벤트 등록');
        }
        
        // 슬라이더 컨테이너에도 이벤트 리스너 등록
        const sliderContainer = document.querySelector('.menu-slider-container');
        if (sliderContainer) {
            sliderContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            sliderContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            sliderContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
            showDebug('슬라이더 컨테이너에 터치 이벤트 등록');
        }
        
        showDebug('모바일 터치 이벤트 리스너 등록 완료');
    }
    
    // 탭 이벤트
    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            changeCategory(category);
        });
    });
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', () => {
        const wasMobile = isMobile;
        isMobile = window.innerWidth <= 700;
        
        if (wasMobile !== isMobile) {
            showDebug(`모드 변경: ${isMobile ? '모바일' : '데스크톱'}`);
            hideArrowButtons();
        }
    });
    
    // 초기화
    showDebug('=== 초기화 완료 ===');
    showDebug(`화면 크기: ${window.innerWidth}x${window.innerHeight}`);
    showDebug(`User Agent: ${navigator.userAgent}`);
    hideArrowButtons();
    changeCategory(currentCategory);
}); 