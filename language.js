function changeLanguage() {
    const select = document.getElementById('languageSelect');
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';
    
    if (select.value === 'ko') {
        // 영문 페이지에서 한글 페이지로 전환
        if (currentFile.includes('_en')) {
            window.location.href = currentFile.replace('_en', '');
        } else if (currentFile === 'index_en.html') {
            window.location.href = 'index.html';
        }
    } else {
        // 한글 페이지에서 영문 페이지로 전환
        if (!currentFile.includes('_en')) {
            if (currentFile === 'index.html') {
                window.location.href = 'index_en.html';
            } else {
                const fileName = currentFile.split('.')[0];
                const fileExt = currentFile.split('.')[1];
                window.location.href = `${fileName}_en.${fileExt}`;
            }
        }
    }
}

// 새로운 슬라이더 기능
document.addEventListener('DOMContentLoaded', function() {
    // 슬라이더 요소들
    const sliderContainer = document.querySelector('.menu-slider-container');
    const slider = document.querySelector('.menu-slider');
    const slides = document.querySelectorAll('.menu-slide');
    const prevBtn = document.querySelector('.slider-button.prev');
    const nextBtn = document.querySelector('.slider-button.next');
    const menuTabs = document.querySelectorAll('.menu-tab');

    // 슬라이더 상태
    let currentPosition = 0;
    let currentCategory = 'sandwich';
    const slideWidth = 220; // 슬라이드 너비 + 간격
    const visibleSlides = 5;

    // 슬라이드 이동 함수
    function moveSlides(direction) {
        const activeSlides = document.querySelectorAll('.menu-slide[data-category="' + currentCategory + '"]');
        const maxPosition = Math.max(0, (activeSlides.length - visibleSlides)) * slideWidth;

        if (direction === 'next' && currentPosition < maxPosition) {
            currentPosition += slideWidth;
        } else if (direction === 'prev' && currentPosition > 0) {
            currentPosition -= slideWidth;
        }

        slider.style.transform = `translateX(-${currentPosition}px)`;
        updateButtons(activeSlides.length);
    }

    // 버튼 상태 업데이트
    function updateButtons(totalSlides) {
        prevBtn.style.opacity = currentPosition <= 0 ? '0.5' : '1';
        prevBtn.style.cursor = currentPosition <= 0 ? 'default' : 'pointer';
        
        const maxPosition = Math.max(0, (totalSlides - visibleSlides)) * slideWidth;
        nextBtn.style.opacity = currentPosition >= maxPosition ? '0.5' : '1';
        nextBtn.style.cursor = currentPosition >= maxPosition ? 'default' : 'pointer';
    }

    // 카테고리 변경 함수
    function changeCategory(category) {
        currentCategory = category;
        currentPosition = 0;
        
        // 모든 슬라이드 숨기기
        slides.forEach(slide => {
            slide.style.display = 'none';
        });
        
        // 선택된 카테고리의 슬라이드만 표시
        const activeSlides = document.querySelectorAll('.menu-slide[data-category="' + category + '"]');
        activeSlides.forEach(slide => {
            slide.style.display = 'block';
        });
        
        // 슬라이더 위치 초기화
        slider.style.transform = 'translateX(0)';
        updateButtons(activeSlides.length);
    }

    // 이벤트 리스너 설정
    prevBtn.addEventListener('click', () => moveSlides('prev'));
    nextBtn.addEventListener('click', () => moveSlides('next'));

    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            menuTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            changeCategory(category);
        });
    });

    // 초기 설정
    changeCategory(currentCategory);
}); 