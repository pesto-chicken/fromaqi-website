// 간단한 모바일 슬라이더
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

    // 상태 변수
    let currentPosition = 0;
    let currentCategory = 'sandwich';

    showDebug('간단한 슬라이더 초기화');

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
        
        // 버튼 상태 업데이트
        updateButtons(totalSlides);
    }
    
    // 버튼 상태 업데이트
    function updateButtons(totalSlides) {
        showDebug(`=== 버튼 상태 업데이트 ===`);
        showDebug(`총 슬라이드: ${totalSlides}`);
        showDebug(`현재 위치: ${currentPosition}`);
        
        const slideWidth = 125;
        const maxPosition = Math.max(0, (totalSlides - 3) * slideWidth); // 3개씩 보인다고 가정
        
        showDebug(`최대 위치: ${maxPosition}`);
        
        // 이전 버튼
        const prevDisabled = currentPosition <= 0;
        prevBtn.style.opacity = prevDisabled ? '0.5' : '1';
        prevBtn.disabled = false; // 항상 활성화
        showDebug(`이전 버튼 비활성화: ${prevDisabled}`);
        
        // 다음 버튼
        const nextDisabled = currentPosition >= maxPosition;
        nextBtn.style.opacity = nextDisabled ? '0.5' : '1';
        nextBtn.disabled = false; // 항상 활성화
        showDebug(`다음 버튼 비활성화: ${nextDisabled}`);
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
        
        // 버튼 상태 업데이트
        updateButtons(activeSlides.length);
        
        // 탭 활성화
        menuTabs.forEach(tab => {
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }
    
    // 이벤트 리스너
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showDebug('이전 버튼 클릭');
            moveSlide('prev');
        });
        
        prevBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showDebug('이전 버튼 터치');
            moveSlide('prev');
        }, { passive: false });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showDebug('다음 버튼 클릭');
            moveSlide('next');
        });
        
        nextBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showDebug('다음 버튼 터치');
            moveSlide('next');
        }, { passive: false });
    }
    
    // 탭 이벤트
    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            changeCategory(category);
        });
    });
    
    // 초기화
    showDebug('=== 초기화 완료 ===');
    showDebug(`화면 크기: ${window.innerWidth}x${window.innerHeight}`);
    changeCategory(currentCategory);
}); 