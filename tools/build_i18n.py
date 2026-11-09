#!/usr/bin/env python3
"""Build English (en/) and Simplified Chinese (zh/) pages from the Korean originals.

The Korean pages (index.html, menu.html) are the source of truth. Edit them, add or
update the matching lines in the tables below, then run:

    python3 tools/build_i18n.py

Every Korean phrase listed must still be found in the source, and no Korean text may be
left in the output except the lines marked as kept on purpose (company legal line and
the Korean address shown to taxi drivers). If either check fails, the script stops and
says which phrase to add or fix.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HANGUL = re.compile(r'[가-힣]')

LANGS = {
    'en': {'html': 'en', 'label': 'EN', 'aria': 'Language'},
    'zh': {'html': 'zh-CN', 'label': '中文', 'aria': '语言 · Language'},
}

# Korean text kept on purpose in translated pages.
KEEP_KO = [
    '주식회사 에스엔씨엘인터내셔널 · 대표 이산 · 사업자등록번호 108-81-99752 · 통신판매업신고 제2016-서울성북-0522호<br>본점 서울 성북구 고려대로24가길 13 · 대표전화 070-4038-8537',
    '서울 성북구 고려대로24가길 13, 1층',
    '서울 강남구 논현로111길 22, 101호',
    '충북 청주시 서원구 1순환로 696, 1층',
    '한국어',
]

# ---------------------------------------------------------------- shared (both pages)
LEGAL_KO = KEEP_KO[0]
COMMON = [
    (f'<span>{LEGAL_KO}</span>',
     f'<span>S AND CL INTERNATIONAL CO., LTD. · Business Registration No. 108-81-99752<br>Head office: 1F, 13 Goryeodae-ro 24ga-gil, Seongbuk-gu, Seoul · +82 70-4038-8537<small class="legal-ko">{LEGAL_KO}</small></span>',
     f'<span>S AND CL INTERNATIONAL CO., LTD. · 营业登记号码 108-81-99752<br>总店：首尔特别市 城北区 Goryeodae-ro 24ga-gil 13, 1层 · 电话 +82 70-4038-8537<small class="legal-ko">{LEGAL_KO}</small></span>'),
    ('aria-label="프로마치 홈"', 'aria-label="FROMAQI home"', 'aria-label="FROMAQI 首页"'),
    ('alt="FROMAQI 프로마치 샌드위치 델리"', 'alt="FROMAQI Sandwich Deli"', 'alt="FROMAQI 三明治熟食店"'),
    ('>메뉴</a>', '>Menu</a>', '>菜单</a>'),
    ('>이야기</a>', '>Story</a>', '>品牌故事</a>'),
    ('>매장</a>', '>Stores</a>', '>门店</a>'),
    ('<span class="hide-xs">온라인 </span>스토어', '<span class="hide-xs">Online </span>Store', '<span class="hide-xs">网上</span>商店'),
    ('<meta property="og:site_name" content="프로마치 FROMAQI">', '<meta property="og:site_name" content="FROMAQI">', '<meta property="og:site_name" content="FROMAQI">'),
]

# ---------------------------------------------------------------- home page
INDEX = [
    ('<title>프로마치 FROMAQI | 매일 굽는 치아바타 샌드위치 · 파니니</title>',
     '<title>FROMAQI | Ciabatta Sandwiches &amp; Panini Baked Fresh Daily · Seoul</title>',
     '<title>FROMAQI | 每日现烤夏巴塔三明治 · 帕尼尼 · 首尔</title>'),
    ('content="매일 굽는 치아바타와 생바질 페스토로 만드는 프로마치 샌드위치·파니니. 안암·논현언주·청주 사창동점."',
     'content="FROMAQI makes sandwiches and panini with ciabatta baked daily and fresh basil pesto. Anam, Nonhyeon-Eonju (Seoul) and Cheongju."',
     'content="FROMAQI 用每日现烤的夏巴塔和新鲜罗勒青酱制作三明治与帕尼尼。首尔安岩店、论岘彦州店及清州店。"'),
    ('content="프로마치 FROMAQI | 매일 굽는 치아바타 샌드위치"',
     'content="FROMAQI | Ciabatta sandwiches baked fresh daily"',
     'content="FROMAQI | 每日现烤夏巴塔三明治"'),
    ('content="매일 굽는 치아바타, 생바질 페스토, 직접 숙성한 파스트라미. 안암 본점 · 논현언주점 · 청주 사창동점"',
     'content="Ciabatta baked daily, fresh basil pesto, house-aged pastrami. Anam · Nonhyeon-Eonju · Cheongju"',
     'content="每日现烤夏巴塔、新鲜罗勒青酱、自家熟成帕斯特拉米。安岩店 · 论岘彦州店 · 清州店"'),
    ('<span class="kicker">프로마치 · Sandwich Deli</span>', '<span class="kicker">FROMAQI · Sandwich Deli</span>', '<span class="kicker">FROMAQI · Sandwich Deli</span>'),
    ('<span class="line">빵부터 소스까지,</span><span class="line"><mark>전부 직접</mark> 만듭니다.</span>',
     '<span class="line">From bread to sauce,</span><span class="line">we make <mark>everything</mark> ourselves.</span>',
     '<span class="line">从面包到酱料，</span><span class="line"><mark>全部亲手</mark>制作。</span>'),
    ('매일 아침 굽는 치아바타, 생바질을 듬뿍 갈아 만든 페스토, 4일 숙성한 파스트라미. 프로마치의 샌드위치는 재료 하나하나를 직접 만드는 데서 시작합니다.',
     'Ciabatta baked every morning, pesto ground from heaps of fresh basil, pastrami aged for four days. Every FROMAQI sandwich starts with ingredients we make ourselves.',
     '每天早上现烤的夏巴塔、用大量新鲜罗勒研磨的青酱、熟成四天的帕斯特拉米。FROMAQI 的每一份三明治，都从亲手制作的食材开始。'),
    ('메뉴 보기 <span', 'See the menu <span', '查看菜单 <span'),
    ('>가까운 매장 찾기</a>', '>Find a store</a>', '>查找门店</a>'),
    ('<dt>안암동에서</dt><dd>10<span>년차</span></dd>', '<dt>In Anam-dong for</dt><dd>10<span>years</span></dd>', '<dt>扎根安岩洞</dt><dd>10<span>年</span></dd>'),
    ('<dt>직접 만드는 소스</dt><dd>6<span>종</span></dd>', '<dt>House-made sauces</dt><dd>6<span>kinds</span></dd>', '<dt>自制酱料</dt><dd>6<span>种</span></dd>'),
    ('<dt>파스트라미 숙성</dt><dd>4<span>일</span></dd>', '<dt>Pastrami aging</dt><dd>4<span>days</span></dd>', '<dt>帕斯特拉米熟成</dt><dd>4<span>天</span></dd>'),
    ('alt="치아바타 샌드위치와 샐러드, 수프가 차려진 프로마치 테이블"', 'alt="A FROMAQI table with ciabatta sandwiches, salad and soup"', 'alt="摆满夏巴塔三明治、沙拉和浓汤的 FROMAQI 餐桌"'),
    ('<i aria-hidden="true">●</i>매일 아침 굽는 치아바타</span>', '<i aria-hidden="true">●</i>Ciabatta baked every morning</span>', '<i aria-hidden="true">●</i>每天早上现烤的夏巴塔</span>'),
    ('<i aria-hidden="true">●</i>생바질 페스토</span>', '<i aria-hidden="true">●</i>Fresh basil pesto</span>', '<i aria-hidden="true">●</i>新鲜罗勒青酱</span>'),
    ('<h2>프로마치가 매일 직접 만드는 세 가지</h2>', '<h2>Three things we make fresh every day</h2>', '<h2>FROMAQI 每天亲手制作的三样东西</h2>'),
    ('alt="겉은 바삭하고 속은 촉촉한 치아바타 단면"', 'alt="Cross-section of ciabatta, crisp outside and soft inside"', 'alt="外脆内软的夏巴塔切面"'),
    ('<h3>매일 아침 굽는 치아바타</h3>', '<h3>Ciabatta baked every morning</h3>', '<h3>每天早上现烤的夏巴塔</h3>'),
    ('<p>겉은 바삭하고 속은 쫄깃합니다. 모든 샌드위치와 파니니의 바탕이 되는 빵을 매일 매장에서 굽습니다.</p>',
     '<p>Crisp outside, chewy inside. We bake the bread behind every sandwich and panini in our stores each day.</p>',
     '<p>外皮酥脆，内里有嚼劲。所有三明治和帕尼尼用的面包，都是每天在店里烤的。</p>'),
    ('alt="갓 갈아낸 초록빛 생바질 페스토"', 'alt="Freshly ground green basil pesto"', 'alt="刚研磨好的翠绿罗勒青酱"'),
    ('<h3>생바질 페스토</h3>', '<h3>Fresh basil pesto</h3>', '<h3>新鲜罗勒青酱</h3>'),
    ('<p>신선한 생바질을 아낌없이 갈아 바질 본연의 향을 살렸습니다.</p>', '<p>Made with generous amounts of fresh basil to keep its natural aroma.</p>', '<p>大量使用新鲜罗勒研磨，保留罗勒原本的香气。</p>'),
    ('alt="얇게 썬 프로마치 파스트라미"', 'alt="Thinly sliced FROMAQI pastrami"', 'alt="切成薄片的 FROMAQI 帕斯特拉米"'),
    ('<h3>4일 숙성 파스트라미</h3>', '<h3>Four-day aged pastrami</h3>', '<h3>熟成四天的帕斯特拉米</h3>'),
    ('<p>4일간 숙성한 뒤 2시간 동안 천천히 굽습니다.</p>', '<p>Aged for four days, then slow-roasted for two hours.</p>', '<p>熟成四天后，再慢烤两个小时。</p>'),
    ('<h2>가장 많이 찾는 메뉴</h2>', '<h2>Our most-ordered</h2>', '<h2>人气菜单</h2>'),
    ('전체 메뉴 보기 <span', 'Full menu <span', '查看全部菜单 <span'),
    ('alt="페스토 치킨 샌드위치"', 'alt="Pesto chicken sandwich"', 'alt="青酱鸡肉三明治"'),
    ('<span class="chip">샌드위치</span><h3>페스토 치킨</h3><p>숙성 염지 닭가슴살 · 바질 페스토</p>',
     '<span class="chip">Sandwich</span><h3>Pesto Chicken</h3><p>Brined chicken breast · basil pesto</p>',
     '<span class="chip">三明治</span><h3>青酱鸡肉</h3><p>腌制鸡胸肉 · 罗勒青酱</p>'),
    ('alt="포크 파스트라미 샌드위치"', 'alt="Pork pastrami sandwich"', 'alt="猪肉帕斯特拉米三明治"'),
    ('<span class="chip">샌드위치</span><h3>포크 파스트라미</h3><p>숙성 파스트라미 · 모짜렐라</p>',
     '<span class="chip">Sandwich</span><h3>Pork Pastrami</h3><p>Aged pastrami · mozzarella</p>',
     '<span class="chip">三明治</span><h3>猪肉帕斯特拉米</h3><p>熟成帕斯特拉米 · 马苏里拉奶酪</p>'),
    ('alt="커리 치킨 파니니"', 'alt="Curry chicken panini"', 'alt="咖喱鸡肉帕尼尼"'),
    ('<span class="chip">파니니</span><h3>커리 치킨 파니니</h3><p>홈메이드 커리 소스 · 모짜렐라</p>',
     '<span class="chip">Panini</span><h3>Curry Chicken Panini</h3><p>House-made curry sauce · mozzarella</p>',
     '<span class="chip">帕尼尼</span><h3>咖喱鸡肉帕尼尼</h3><p>自制咖喱酱 · 马苏里拉奶酪</p>'),
    ('alt="리코타 치즈 샐러드"', 'alt="Ricotta cheese salad"', 'alt="里科塔奶酪沙拉"'),
    ('<span class="chip">샐러드</span><h3>리코타 샐러드</h3><p>직접 만든 리코타 · 견과류</p>',
     '<span class="chip">Salad</span><h3>Ricotta Salad</h3><p>House-made ricotta · nuts</p>',
     '<span class="chip">沙拉</span><h3>里科塔奶酪沙拉</h3><p>自制里科塔奶酪 · 坚果</p>'),
    ('<blockquote>집밥 이상의 밥은 없다는 마음으로, <em>소스 하나까지</em> 직접 만듭니다.</blockquote>',
     '<blockquote>Nothing beats a home-cooked meal, so we make <em>every last sauce</em> ourselves.</blockquote>',
     '<blockquote>没有什么比家常饭更好，所以我们<em>连每一种酱料</em>都亲手制作。</blockquote>'),
    ('<p>프로마치는 안암동 고려대 앞에서 시작해 10년째 같은 방식으로 샌드위치를 만들고 있습니다. 모든 소스는 다국적 스태프가 머리를 맞대 완성한 홈메이드 레시피입니다.</p>',
     '<p>FROMAQI started in front of Korea University in Anam-dong and has made sandwiches the same way for ten years. Every sauce is a house recipe developed together by our international staff.</p>',
     '<p>FROMAQI 起步于安岩洞高丽大学门前，十年来一直用同样的方式制作三明治。所有酱料都是来自不同国家的员工共同研发的自家配方。</p>'),
    ('<p>빵은 매일 굽고, 리코타 치즈와 파스트라미도 직접 만듭니다.</p>', '<p>We bake bread daily and make our own ricotta and pastrami.</p>', '<p>面包每天现烤，里科塔奶酪和帕斯特拉米也是自己做的。</p>'),
    ('aria-label="프로마치가 직접 만드는 소스"', 'aria-label="Sauces we make ourselves"', 'aria-label="FROMAQI 自制的酱料"'),
    ('<span>바질 페스토</span><span>치킨시저</span><span>블루치즈</span><span>와사비</span><span>커리</span><span>타코 시즈닝</span>',
     '<span>Basil pesto</span><span>Chicken Caesar</span><span>Blue cheese</span><span>Wasabi</span><span>Curry</span><span>Taco seasoning</span>',
     '<span>罗勒青酱</span><span>鸡肉凯撒酱</span><span>蓝纹奶酪酱</span><span>芥末酱</span><span>咖喱酱</span><span>塔可调味料</span>'),
    ('alt="손질한 생바질 잎"', 'alt="Fresh basil leaves"', 'alt="新鲜罗勒叶"'),
    ('alt="토마토 수프와 치아바타"', 'alt="Tomato soup with ciabatta"', 'alt="番茄浓汤配夏巴塔"'),
    ('alt="매장에서 굽는 수제 쿠키"', 'alt="Cookies baked in store"', 'alt="店内现烤的手工曲奇"'),
    ('<h2>프로마치의 빵과 소스를 집에서도</h2>', '<h2>FROMAQI bread and sauce, at home</h2>', '<h2>在家也能吃到 FROMAQI 的面包和酱料</h2>'),
    ('<p>매장에서 매일 만드는 치아바타와 바질 페스토를 집에서도 즐길 수 있도록 온라인 스토어를 준비하고 있습니다.</p>',
     '<p>We are preparing an online store so you can enjoy the ciabatta and basil pesto we make every day at home. Delivery within Korea.</p>',
     '<p>我们正在筹备网上商店，让您在家也能享用每天现做的夏巴塔和罗勒青酱。仅限韩国境内配送。</p>'),
    ('<li>냉동 치아바타<small>오븐에 데워 갓 구운 그대로</small></li>', '<li>Frozen ciabatta<small>Warm it in the oven, like fresh from ours</small></li>', '<li>冷冻夏巴塔<small>放入烤箱加热，如同刚出炉</small></li>'),
    ('<li>생바질 페스토<small>파스타 · 샌드위치 · 샐러드</small></li>', '<li>Fresh basil pesto<small>Pasta · sandwiches · salads</small></li>', '<li>新鲜罗勒青酱<small>意面 · 三明治 · 沙拉</small></li>'),
    ('<li>홈 파니니 키트<small>빵 + 페스토 + 크루통</small></li>', '<li>Home panini kit<small>Bread + pesto + croutons</small></li>', '<li>居家帕尼尼套装<small>面包 + 青酱 + 面包丁</small></li>'),
    ('<!-- 스마트스토어 개설 후: href에 스토어 주소를 넣고 aria-disabled 속성을 지우면 버튼이 활성화됩니다. -->', '', ''),
    ('>네이버 스마트스토어 · 오픈 준비 중</a>', '>Naver Smart Store · coming soon</a>', '>Naver Smart Store · 即将开业</a>'),
    ('<p class="shop-note">오픈 소식은 인스타그램 <a href="https://www.instagram.com/fromaqi" target="_blank" rel="noopener">@fromaqi</a>에서 가장 먼저 알려드립니다.</p>',
     '<p class="shop-note">Follow <a href="https://www.instagram.com/fromaqi" target="_blank" rel="noopener">@fromaqi</a> on Instagram to hear first when we open.</p>',
     '<p class="shop-note">开业消息将第一时间在 Instagram <a href="https://www.instagram.com/fromaqi" target="_blank" rel="noopener">@fromaqi</a> 发布。</p>'),
    ('alt="프로마치 치아바타"', 'alt="FROMAQI ciabatta"', 'alt="FROMAQI 夏巴塔"'),
    ('<h2>프로마치 매장</h2>', '<h2>Our stores</h2>', '<h2>FROMAQI 门店</h2>'),
    ('<p>라스트오더는 마감 30분 전입니다.</p>', '<p>Last orders 30 minutes before closing.</p>', '<p>打烊前30分钟停止点单。</p>'),
    ('<h3>안암점 <small style="font-size:15px;font-weight:600;opacity:.7">본점</small></h3>',
     '<h3>Anam <small style="font-size:15px;font-weight:600;opacity:.7">Flagship</small></h3>',
     '<h3>安岩店 <small style="font-size:15px;font-weight:600;opacity:.7">总店</small></h3>'),
    ('<address>서울 성북구 고려대로24가길 13, 1층</address>\n              <p class="way">안암역 2번 출구 도보 5분</p>',
     '<address>1F, 13 Goryeodae-ro 24ga-gil, Seongbuk-gu, Seoul</address>\n              <p class="way">5-min walk from Anam Station (Line 6), Exit 2</p>\n              <p class="addr-ko"><b>Show your taxi driver</b>서울 성북구 고려대로24가길 13, 1층</p>',
     '<address>首尔特别市 城北区 Goryeodae-ro 24ga-gil 13, 1层</address>\n              <p class="way">地铁6号线安岩站2号出口，步行5分钟</p>\n              <p class="addr-ko"><b>可出示给出租车司机</b>서울 성북구 고려대로24가길 13, 1층</p>'),
    ('<h3>논현언주점</h3>', '<h3>Nonhyeon-Eonju</h3>', '<h3>论岘彦州店</h3>'),
    ('<address>서울 강남구 논현로111길 22, 101호</address>\n              <p class="way">언주역 1번 출구</p>',
     '<address>#101, 22 Nonhyeon-ro 111-gil, Gangnam-gu, Seoul</address>\n              <p class="way">Near Eonju Station (Line 9), Exit 1</p>\n              <p class="addr-ko"><b>Show your taxi driver</b>서울 강남구 논현로111길 22, 101호</p>',
     '<address>首尔特别市 江南区 Nonhyeon-ro 111-gil 22, 101号</address>\n              <p class="way">地铁9号线彦州站1号出口附近</p>\n              <p class="addr-ko"><b>可出示给出租车司机</b>서울 강남구 논현로111길 22, 101호</p>'),
    ('<h3>청주 사창동점</h3>', '<h3>Cheongju Sachang</h3>', '<h3>清州社仓洞店</h3>'),
    ('<address>충북 청주시 서원구 1순환로 696, 1층</address>\n              <p class="way">사창지구대 옆</p>',
     '<address>1F, 696 1sunhwan-ro, Seowon-gu, Cheongju, Chungcheongbuk-do</address>\n              <p class="way">Next to the Sachang police box</p>\n              <p class="addr-ko"><b>Show your taxi driver</b>충북 청주시 서원구 1순환로 696, 1층</p>',
     '<address>忠清北道 清州市 西原区 1sunhwan-ro 696, 1层</address>\n              <p class="way">社仓派出所旁</p>\n              <p class="addr-ko"><b>可出示给出租车司机</b>충북 청주시 서원구 1순환로 696, 1층</p>'),
    ('<th>월–금</th>', '<th>Mon–Fri</th>', '<th>周一至周五</th>'),
    ('<th>월–토</th>', '<th>Mon–Sat</th>', '<th>周一至周六</th>'),
    ('<th>토</th>', '<th>Sat</th>', '<th>周六</th>'),
    ('<th>일</th>', '<th>Sun</th>', '<th>周日</th>'),
    ('>정기휴무</td>', '>Closed</td>', '>休息</td>'),
    ('>네이버 지도</a>', '>Naver Map</a>', '>Naver 地图</a>'),
    ('<h3>단체 주문 · 케이터링</h3>', '<h3>Group orders · catering</h3>', '<h3>团体订餐 · 餐饮外送</h3>'),
    ('<p>행사·회의용 단체 주문은 가까운 매장으로 미리 연락 주세요. 수량과 픽업 시간을 맞춰 드립니다.<br>\n            안암 <a',
     '<p>For events and meetings, call your nearest store ahead of time. We will prepare the quantity and pickup time you need.<br>\n            Anam <a',
     '<p>活动、会议等团体订餐，请提前联系就近门店，我们会按您需要的数量和取餐时间准备。<br>\n            安岩店 <a'),
    ('</a> · 논현언주 <a', '</a> · Nonhyeon-Eonju <a', '</a> · 论岘彦州店 <a'),
    ('<h3>가맹 · 제휴 문의</h3>', '<h3>Franchise · partnerships</h3>', '<h3>加盟 · 合作咨询</h3>'),
    ('<p>본점 <a href="tel:070-4038-8537">070-4038-8537</a> 또는 인스타그램 <a href="https://www.instagram.com/fromaqi" target="_blank" rel="noopener">@fromaqi</a> 메시지로 연락 주세요.</p>',
     '<p>Call our flagship at <a href="tel:070-4038-8537">070-4038-8537</a> or message <a href="https://www.instagram.com/fromaqi" target="_blank" rel="noopener">@fromaqi</a> on Instagram.</p>',
     '<p>请致电总店 <a href="tel:070-4038-8537">070-4038-8537</a>，或通过 Instagram <a href="https://www.instagram.com/fromaqi" target="_blank" rel="noopener">@fromaqi</a> 私信联系我们。</p>'),
    # live-status script
    ("var text = '오늘 휴무', open = false;", "var text = 'Closed today', open = false;", "var text = '今日休息', open = false;"),
    ("if (now < a) text = r[0] + ' 오픈';", "if (now < a) text = 'Opens ' + r[0];", "if (now < a) text = r[0] + ' 开门';"),
    ("{ open = true; text = '영업 중'; }", "{ open = true; text = 'Open now'; }", "{ open = true; text = '营业中'; }"),
    ("else text = '영업 종료';", "else text = 'Closed now';", "else text = '今日已打烊';"),
]

# ---------------------------------------------------------------- menu page
def item(ko_alt, ko_name, ko_desc, en, zh):
    """One menu card: alt text, name and description."""
    return [
        (f'alt="{ko_alt}"', f'alt="{en[0]}"', f'alt="{zh[0]}"'),
        (f'<h3>{ko_name}</h3></div>\n            <p>{ko_desc}</p>',
         f'<h3>{en[0]}</h3></div>\n            <p>{en[1]}</p>',
         f'<h3>{zh[0]}</h3></div>\n            <p>{zh[1]}</p>'),
    ]

MENU = [
    ('<title>메뉴 | 프로마치 FROMAQI 샌드위치 · 파니니 · 샐러드 · 수프</title>',
     '<title>Menu | FROMAQI Sandwiches · Panini · Salads · Soups</title>',
     '<title>菜单 | FROMAQI 三明治 · 帕尼尼 · 沙拉 · 浓汤</title>'),
    ('content="프로마치 전체 메뉴. 매일 굽는 치아바타 샌드위치와 파니니, 리코타 샐러드, 수프, 수제 쿠키."',
     'content="The full FROMAQI menu: ciabatta sandwiches and panini baked daily, ricotta salad, soups and homemade cookies."',
     'content="FROMAQI 全部菜单：每日现烤夏巴塔三明治和帕尼尼、里科塔奶酪沙拉、浓汤和手工曲奇。"'),
    ('content="프로마치 메뉴 | 샌드위치 · 파니니 · 샐러드"', 'content="FROMAQI menu | Sandwiches · Panini · Salads"', 'content="FROMAQI 菜单 | 三明治 · 帕尼尼 · 沙拉"'),
    ('content="매일 굽는 치아바타와 홈메이드 소스로 만드는 프로마치 전체 메뉴"', 'content="The full FROMAQI menu, made with ciabatta baked daily and house-made sauces"', 'content="用每日现烤的夏巴塔和自制酱料制作的 FROMAQI 全部菜单"'),
    ('<h1>프로마치 메뉴</h1>', '<h1>FROMAQI menu</h1>', '<h1>FROMAQI 菜单</h1>'),
    ('<p>모든 샌드위치와 파니니는 매일 굽는 치아바타로 만듭니다. 하프 사이즈도 주문할 수 있습니다.</p>',
     '<p>Every sandwich and panini is made on ciabatta we bake daily. Half sizes are available too.</p>',
     '<p>所有三明治和帕尼尼都使用每日现烤的夏巴塔制作，也可以点半份。</p>'),
    ('<span>가격은 매장별 네이버 플레이스에서 확인해 주세요</span>', '<span>See prices on each store’s Naver Place page</span>', '<span>价格请查看各门店的 Naver Place 页面</span>'),
    ('rel="noopener">안암점</a>', 'rel="noopener">Anam</a>', 'rel="noopener">安岩店</a>'),
    ('rel="noopener">논현언주점</a>', 'rel="noopener">Nonhyeon-Eonju</a>', 'rel="noopener">论岘彦州店</a>'),
    ('rel="noopener">청주 사창동점</a>', 'rel="noopener">Cheongju Sachang</a>', 'rel="noopener">清州社仓洞店</a>'),
    ('aria-label="메뉴 분류"', 'aria-label="Menu categories"', 'aria-label="菜单分类"'),
    ('<a href="#sandwich">샌드위치</a>', '<a href="#sandwich">Sandwiches</a>', '<a href="#sandwich">三明治</a>'),
    ('<a href="#panini">파니니</a>', '<a href="#panini">Panini</a>', '<a href="#panini">帕尼尼</a>'),
    ('<a href="#salad">샐러드</a>', '<a href="#salad">Salads</a>', '<a href="#salad">沙拉</a>'),
    ('<a href="#soup">수프</a>', '<a href="#soup">Soups</a>', '<a href="#soup">浓汤</a>'),
    ('<a href="#dessert">디저트</a>', '<a href="#dessert">Dessert</a>', '<a href="#dessert">甜点</a>'),
    ('<a href="#drink">음료</a>', '<a href="#drink">Drinks</a>', '<a href="#drink">饮品</a>'),
    ('<h2>샌드위치</h2>', '<h2>Sandwiches</h2>', '<h2>三明治</h2>'),
    ('<p class="sub">겉은 바삭, 속은 쫄깃한 치아바타에 홈메이드 소스를 더했습니다.</p>',
     '<p class="sub">Crisp, chewy ciabatta with our house-made sauces.</p>',
     '<p class="sub">外脆内韧的夏巴塔，搭配自制酱料。</p>'),
    *item('페스토 치킨 샌드위치', '페스토 치킨', '숙성 염지 닭가슴살, 홈메이드 페스토, 홈메이드 치킨시저 소스, 토마토, 양파, 로메인',
          ('Pesto Chicken', 'Brined, aged chicken breast, house-made pesto, house-made chicken Caesar sauce, tomato, onion, romaine'),
          ('青酱鸡肉', '腌制熟成鸡胸肉、自制青酱、自制鸡肉凯撒酱、番茄、洋葱、罗马生菜')),
    *item('포크 파스트라미 샌드위치', '포크 파스트라미', '4일 숙성 후 2시간 구운 파스트라미, 양파·피망·버섯 볶음, 홈메이드 스테이크 소스, 마요네즈, 모짜렐라',
          ('Pork Pastrami', 'Pastrami aged four days and roasted for two hours, sautéed onion, bell pepper and mushroom, house-made steak sauce, mayonnaise, mozzarella'),
          ('猪肉帕斯特拉米', '熟成四天后烤制两小时的帕斯特拉米、炒洋葱青椒蘑菇、自制牛排酱、蛋黄酱、马苏里拉奶酪')),
    *item('커리 치킨 샌드위치', '커리 치킨', '홈메이드 리코타 치즈, 숙성 염지 닭가슴살, 홈메이드 커리 소스, 토마토, 양파, 로메인, 마요네즈',
          ('Curry Chicken', 'House-made ricotta, brined, aged chicken breast, house-made curry sauce, tomato, onion, romaine, mayonnaise'),
          ('咖喱鸡肉', '自制里科塔奶酪、腌制熟成鸡胸肉、自制咖喱酱、番茄、洋葱、罗马生菜、蛋黄酱')),
    *item('이탈리안 콤보 샌드위치', '이탈리안 콤보', '홈메이드 리코타 치즈, 살라미, 토마토, 양파, 샐러드 채소',
          ('Italian Combo', 'House-made ricotta, salami, tomato, onion, salad greens'),
          ('意式拼盘', '自制里科塔奶酪、萨拉米、番茄、洋葱、沙拉蔬菜')),
    *item('멕시칸 타코 샌드위치', '멕시칸 타코', '홈메이드 타코 시즈닝 고기, 체다 치즈, 토마토, 양파, 로메인, 사워크림',
          ('Mexican Taco', 'Meat with house-made taco seasoning, cheddar, tomato, onion, romaine, sour cream'),
          ('墨西哥塔可', '自制塔可调味肉、切达奶酪、番茄、洋葱、罗马生菜、酸奶油')),
    *item('노르웨이 연어 샌드위치', '노르웨이 연어', '훈제 연어, 홈메이드 와사비 소스, 케이퍼, 레몬, 홈메이드 리코타 치즈, 토마토, 양파, 샐러드 채소',
          ('Norwegian Salmon', 'Smoked salmon, house-made wasabi sauce, capers, lemon, house-made ricotta, tomato, onion, salad greens'),
          ('挪威三文鱼', '烟熏三文鱼、自制芥末酱、刺山柑、柠檬、自制里科塔奶酪、番茄、洋葱、沙拉蔬菜')),
    *item('베지테리안 샌드위치', '베지테리안 딜라이트', '모짜렐라, 홈메이드 페스토, 토마토, 양파, 샐러드 채소',
          ('Vegetarian Delight', 'Mozzarella, house-made pesto, tomato, onion, salad greens'),
          ('素食之选', '马苏里拉奶酪、自制青酱、番茄、洋葱、沙拉蔬菜')),
    ('<h2>파니니</h2>', '<h2>Panini</h2>', '<h2>帕尼尼</h2>'),
    ('<p class="sub">그릴에 눌러 구워 치즈가 녹아드는 따뜻한 파니니. 일부 메뉴는 모짜렐라 또는 리코타를 고를 수 있습니다.</p>',
     '<p class="sub">Pressed on the grill until the cheese melts. Some panini let you choose mozzarella or ricotta.</p>',
     '<p class="sub">在烤盘上压烤至奶酪融化的热帕尼尼。部分菜单可选马苏里拉或里科塔奶酪。</p>'),
    *item('페스토 치킨 파니니', '페스토 치킨 파니니', '숙성 염지 닭가슴살, 홈메이드 페스토, 토마토, 양파, 모짜렐라',
          ('Pesto Chicken Panini', 'Brined, aged chicken breast, house-made pesto, tomato, onion, mozzarella'),
          ('青酱鸡肉帕尼尼', '腌制熟成鸡胸肉、自制青酱、番茄、洋葱、马苏里拉奶酪')),
    *item('커리 치킨 파니니', '커리 치킨 파니니', '숙성 염지 닭가슴살, 홈메이드 커리 소스, 토마토, 양파, 모짜렐라',
          ('Curry Chicken Panini', 'Brined, aged chicken breast, house-made curry sauce, tomato, onion, mozzarella'),
          ('咖喱鸡肉帕尼尼', '腌制熟成鸡胸肉、自制咖喱酱、番茄、洋葱、马苏里拉奶酪')),
    *item('포크 파스트라미 파니니', '포크 파스트라미 파니니', '숙성 파스트라미, 양파·피망·버섯 볶음, 홈메이드 스테이크 소스, 마요네즈, 모짜렐라',
          ('Pork Pastrami Panini', 'Aged pastrami, sautéed onion, bell pepper and mushroom, house-made steak sauce, mayonnaise, mozzarella'),
          ('猪肉帕斯特拉米帕尼尼', '熟成帕斯特拉米、炒洋葱青椒蘑菇、自制牛排酱、蛋黄酱、马苏里拉奶酪')),
    *item('멕시칸 타코 파니니', '멕시칸 타코 파니니', '홈메이드 타코 시즈닝 고기, 사워크림, 토마토, 양파, 체다 치즈',
          ('Mexican Taco Panini', 'Meat with house-made taco seasoning, sour cream, tomato, onion, cheddar'),
          ('墨西哥塔可帕尼尼', '自制塔可调味肉、酸奶油、番茄、洋葱、切达奶酪')),
    ('<h2>샐러드</h2>', '<h2>Salads</h2>', '<h2>沙拉</h2>'),
    ('<p class="sub">직접 만든 리코타와 홈메이드 드레싱으로 든든하게.</p>', '<p class="sub">Hearty salads with our own ricotta and dressings.</p>', '<p class="sub">搭配自制里科塔奶酪和自制酱汁，分量十足。</p>'),
    *item('리코타 치즈 샐러드', '리코타 샐러드', '샐러드 채소, 홈메이드 리코타 치즈, 발사믹 소스, 견과류 믹스, 방울토마토, 건자두, 치아바타',
          ('Ricotta Salad', 'Salad greens, house-made ricotta, balsamic sauce, mixed nuts, cherry tomatoes, prunes, ciabatta'),
          ('里科塔奶酪沙拉', '沙拉蔬菜、自制里科塔奶酪、意大利黑醋酱、综合坚果、小番茄、西梅干、夏巴塔')),
    *item('치킨 시저 샐러드', '치킨 시저 샐러드', '샐러드 채소, 숙성 염지 닭가슴살, 홈메이드 치킨시저 소스, 토마토, 양파, 올리브, 크루통',
          ('Chicken Caesar Salad', 'Salad greens, brined, aged chicken breast, house-made chicken Caesar sauce, tomato, onion, olives, croutons'),
          ('鸡肉凯撒沙拉', '沙拉蔬菜、腌制熟成鸡胸肉、自制鸡肉凯撒酱、番茄、洋葱、橄榄、面包丁')),
    *item('치즈보드 샐러드', '치즈보드 샐러드', '샐러드 채소, 홈메이드 리코타 치즈, 홈메이드 페스토, 치아바타',
          ('Cheese Board Salad', 'Salad greens, house-made ricotta, house-made pesto, ciabatta'),
          ('奶酪拼盘沙拉', '沙拉蔬菜、自制里科塔奶酪、自制青酱、夏巴塔')),
    ('<h2>수프</h2>', '<h2>Soups</h2>', '<h2>浓汤</h2>'),
    ('<p class="sub">매장에서 직접 끓이는 크림 수프.</p>', '<p class="sub">Cream soups cooked in our stores.</p>', '<p class="sub">店内亲手熬煮的奶油浓汤。</p>'),
    *item('버섯 수프', '버섯 수프', '양송이와 새송이 버섯으로 끓인 크림 수프',
          ('Mushroom Soup', 'Cream soup with button and king oyster mushrooms'),
          ('蘑菇浓汤', '用口蘑和杏鲍菇熬煮的奶油浓汤')),
    *item('토마토 수프', '토마토 수프', '토마토로 끓인 크림 수프',
          ('Tomato Soup', 'Cream soup made with tomatoes'),
          ('番茄浓汤', '用番茄熬煮的奶油浓汤')),
    ('<h2>디저트</h2>', '<h2>Dessert</h2>', '<h2>甜点</h2>'),
    *item('프로마치 수제 쿠키', '수제 쿠키', '매일 매장에서 직접 굽는 쿠키',
          ('Homemade Cookie', 'Cookies baked in our stores every day'),
          ('手工曲奇', '每天在店里现烤的曲奇')),
    ('<h2>음료</h2>', '<h2>Drinks</h2>', '<h2>饮品</h2>'),
    ('<li><span>아메리카노</span></li>', '<li><span>Americano</span></li>', '<li><span>美式咖啡</span></li>'),
    ('<li><span>카페 라떼</span></li>', '<li><span>Caffè latte</span></li>', '<li><span>拿铁咖啡</span></li>'),
    ('<li><span>펩시콜라 <small>/ 제로</small></span></li>', '<li><span>Pepsi <small>/ Zero</small></span></li>', '<li><span>百事可乐 <small>/ 无糖</small></span></li>'),
    ('<li><span>스프라이트</span></li>', '<li><span>Sprite</span></li>', '<li><span>雪碧</span></li>'),
    ('<li><span>크랜베리 주스</span></li>', '<li><span>Cranberry juice</span></li>', '<li><span>蔓越莓汁</span></li>'),
    ('<li><span>자몽 주스</span></li>', '<li><span>Grapefruit juice</span></li>', '<li><span>西柚汁</span></li>'),
    ('<li><span>망고 주스</span></li>', '<li><span>Mango juice</span></li>', '<li><span>芒果汁</span></li>'),
    ('<p class="menu-note">메뉴 구성은 매장 사정에 따라 달라질 수 있습니다. 가격과 판매 메뉴는 각 매장의 네이버 플레이스에서 확인해 주세요.</p>',
     '<p class="menu-note">Menus can vary by store. Check each store’s Naver Place page for prices and what is available today.</p>',
     '<p class="menu-note">各门店菜单可能有所不同。价格和在售菜单请查看各门店的 Naver Place 页面。</p>'),
]

GLOBE = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'
         '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>')


def switcher(lang, file):
    cur = {'ko': '', 'en': '', 'zh': ''}
    cur[lang] = ' aria-current="true"'
    up = '../'
    ko = f'{up}{file}'
    en = file if lang == 'en' else f'{up}en/{file}'
    zh = file if lang == 'zh' else f'{up}zh/{file}'
    meta = LANGS[lang]
    return (f'<details class="lang"><summary aria-label="{meta["aria"]}">{GLOBE}{meta["label"]}</summary><div class="lang-menu">'
            f'<a href="{ko}" hreflang="ko" lang="ko"{cur["ko"]}>한국어</a>'
            f'<a href="{en}" hreflang="en" lang="en"{cur["en"]}>English</a>'
            f'<a href="{zh}" hreflang="zh-CN" lang="zh-CN"{cur["zh"]}>简体中文</a></div></details>')


def build(lang, file, table):
    src = open(os.path.join(ROOT, file), encoding='utf-8').read()
    s = src
    idx = 1 if lang == 'en' else 2
    missing = []
    # longest first, so a short phrase never eats part of a longer one
    for row in sorted(COMMON + table, key=lambda r: -len(r[0])):
        ko, out = row[0], row[idx]
        if ko not in s:
            missing.append(ko)
            continue
        s = s.replace(ko, out)
    if missing:
        sys.exit(f'[{lang}/{file}] Korean text not found in source (update the table):\n  ' + '\n  '.join(missing))

    s = s.replace('<html lang="ko">', f'<html lang="{LANGS[lang]["html"]}">', 1)
    # assets live one folder up
    s = re.sub(r'(src|href)="(img/|styles\.css)', r'\1="../\2', s)
    # page URL
    path = '' if file == 'index.html' else 'menu.html'
    s = s.replace(f'<link rel="canonical" href="https://www.fromaqi.com/{path}">',
                  f'<link rel="canonical" href="https://www.fromaqi.com/{lang}/{path}">')
    s = s.replace(f'<meta property="og:url" content="https://www.fromaqi.com/{path}">',
                  f'<meta property="og:url" content="https://www.fromaqi.com/{lang}/{path}">')
    s = re.sub(r'\s*<meta name="(naver|google)-site-verification"[^>]*>', '', s)
    # Korean structured data stays on the Korean page only
    s = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', '', s, flags=re.S)
    s = re.sub(r'<details class="lang">.*?</details>', switcher(lang, file), s, flags=re.S)

    leftover = s
    for keep in KEEP_KO:
        leftover = leftover.replace(keep, '')
    bad = sorted({m.group(0) for m in re.finditer(r'[^<>"\n]*[가-힣][^<>"\n]*', leftover)})
    if bad:
        sys.exit(f'[{lang}/{file}] untranslated Korean left:\n  ' + '\n  '.join(bad))

    os.makedirs(os.path.join(ROOT, lang), exist_ok=True)
    out = os.path.join(ROOT, lang, file)
    open(out, 'w', encoding='utf-8').write(s)
    print('wrote', os.path.relpath(out, ROOT))


if __name__ == '__main__':
    for lang in LANGS:
        build(lang, 'index.html', INDEX)
        build(lang, 'menu.html', MENU)
