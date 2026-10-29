# FROMAQI 웹사이트

프로마치(FROMAQI) 공식 브랜드 사이트 — https://www.fromaqi.com

빌드 과정이 없는 정적 사이트이며 Vercel에서 그대로 배포됩니다.

## 구조

```
index.html    홈 (브랜드, 대표 메뉴, 이야기, 온라인 스토어, 매장, 문의)
menu.html     전체 메뉴
styles.css    공통 스타일
img/          웹용으로 압축한 사진 (WebP), 로고, 공유 이미지(og-image.jpg)
sitemap.xml   검색엔진 제출용 페이지 목록
robots.txt    검색엔진 수집 허용
vercel.json   이미지 캐시, 예전 영문 페이지 리다이렉트
naver…html    네이버 서치어드바이저 소유 확인 파일 (삭제 금지)
```

## 자주 하는 수정

- **스마트스토어 연결:** `index.html`에서 `id="smartstore-link"` 버튼의 `href`에 스토어 주소를 넣고 `aria-disabled="true"`를 지웁니다. 버튼 문구도 "네이버 스마트스토어 바로가기"로 바꿉니다.
- **매장 정보:** `index.html`의 `#stores` 영역과, `<head>` 안 구조화 데이터(JSON-LD)를 함께 고칩니다.
- **메뉴·가격:** `menu.html`.
- **사진 추가:** 가로 700~1200px WebP로 줄여 `img/`에 넣습니다.
- 페이지를 추가하면 `sitemap.xml`에도 추가합니다.
