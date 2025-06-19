// 새로운 슬라이더 기능
document.addEventListener('DOMContentLoaded', function() {
    // 슬라이더 요소들
    const sliderWrapper = document.querySelector('.menu-slider-wrapper');
    const slider = document.querySelector('.menu-slider');
    const slides = document.querySelectorAll('.menu-slide');
    const prevBtn = document.querySelector('.slider-button.prev');
    const nextBtn = document.querySelector('.slider-button.next');
    const menuTabs = document.querySelectorAll('.menu-tab');

    // 슬라이더 상태
    let currentPosition = 0;
    let currentCategory = 'sandwich';
    let slideWidth;
    const visibleSlides = 4; // 한 번에 보이는 슬라이드 수를 4개로 고정

    // 화면 크기에 따른 슬라이드 너비 계산
    function calculateSlideWidth() {
        if (window.innerWidth > 1200) {
            slideWidth = 255; // 235px + 20px gap
        } else if (window.innerWidth > 900) {
            slideWidth = 205; // 185px + 20px gap
        } else if (window.innerWidth > 700) {
            slideWidth = 155; // 135px + 20px gap
        } else {
            slideWidth = 105; // 85px + 20px gap
        }
    }

    // 슬라이드 가운데 정렬 함수
    function centerSlides(activeSlides) {
        const totalSlides = activeSlides.length;
        
        // 4개 초과인 경우 기존 방식대로 처리
        if (totalSlides > visibleSlides) {
            slider.style.transform = `translateX(-${currentPosition}px)`;
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            return;
        }
        
        // 4개 이하인 경우만 가운데 정렬 (soup, salad 카테고리)
        if (currentCategory !== 'sandwich' && currentCategory !== 'panini') {
            const wrapperWidth = sliderWrapper.offsetWidth;
            const totalSlidesWidth = totalSlides * slideWidth + (totalSlides - 1) * 20; // 20은 gap 크기
            const offset = (wrapperWidth - totalSlidesWidth) / 2;
            slider.style.transform = `translateX(${offset}px)`;
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            // 샌드위치와 파니니는 항상 왼쪽 정렬
            slider.style.transform = `translateX(0)`;
            if (totalSlides > visibleSlides) {
                prevBtn.style.display = 'flex';
                nextBtn.style.display = 'flex';
            } else {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            }
        }
    }

    // 슬라이드 이동 함수
    function moveSlides(direction) {
        const activeSlides = document.querySelectorAll('.menu-slide[data-category="' + currentCategory + '"]:not([style*="display: none"])');
        const totalSlides = activeSlides.length;
        
        // 4개 이하이고 soup/salad 카테고리면 이동하지 않음
        if (totalSlides <= visibleSlides && (currentCategory === 'soup' || currentCategory === 'salad')) {
            return;
        }

        // 전체 슬라이더 너비 계산
        const maxPosition = Math.max(0, totalSlides - visibleSlides) * slideWidth;

        if (direction === 'next' && currentPosition < maxPosition) {
            // 남은 슬라이드 수 확인
            const remainingSlides = Math.ceil((maxPosition - currentPosition) / slideWidth);
            
            // 다음 이동으로 마지막 슬라이드가 보일 경우
            if (remainingSlides <= visibleSlides) {
                currentPosition = maxPosition; // 정확히 마지막 위치로 이동
            } else {
                currentPosition += slideWidth;
            }
        } else if (direction === 'prev' && currentPosition > 0) {
            currentPosition -= slideWidth;
        }

        // 슬라이더 이동
        slider.style.transform = `translateX(-${currentPosition}px)`;
        updateButtons(activeSlides.length);
    }

    // 버튼 상태 업데이트
    function updateButtons(totalSlides) {
        // soup/salad 카테고리이고 4개 이하면 버튼 숨김
        if ((currentCategory === 'soup' || currentCategory === 'salad') && totalSlides <= visibleSlides) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            return;
        }

        const maxPosition = Math.max(0, (totalSlides - visibleSlides)) * slideWidth;
        
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        
        // 이전 버튼 상태 업데이트
        prevBtn.style.opacity = currentPosition <= 0 ? '0.5' : '1';
        prevBtn.style.cursor = currentPosition <= 0 ? 'default' : 'pointer';
        prevBtn.disabled = currentPosition <= 0;
        
        // 다음 버튼 상태 업데이트
        nextBtn.style.opacity = currentPosition >= maxPosition ? '0.5' : '1';
        nextBtn.style.cursor = currentPosition >= maxPosition ? 'default' : 'pointer';
        nextBtn.disabled = currentPosition >= maxPosition;
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
        
        // 슬라이더 위치 초기화 및 가운데 정렬
        centerSlides(activeSlides);
        updateButtons(activeSlides.length);

        // 탭 활성화 상태 업데이트
        menuTabs.forEach(tab => {
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    // 이벤트 리스너 설정
    prevBtn.addEventListener('click', () => moveSlides('prev'));
    nextBtn.addEventListener('click', () => moveSlides('next'));

    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            changeCategory(category);
        });
    });

    // 반응형 처리
    function handleResize() {
        calculateSlideWidth();
        const activeSlides = document.querySelectorAll('.menu-slide[data-category="' + currentCategory + '"]:not([style*="display: none"])');
        currentPosition = 0;
        centerSlides(activeSlides);
        updateButtons(activeSlides.length);
    }

    window.addEventListener('resize', handleResize);

    // 초기 설정
    calculateSlideWidth();
    changeCategory(currentCategory);
}); 