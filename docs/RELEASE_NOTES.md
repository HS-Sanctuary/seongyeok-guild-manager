# SANCTUM 업데이트 노트

## 2026-10-20 KST — v2.322 후속 후보 / 순월 인계 브랜치

- 전송 결과01:31KST: 제품2549718을 기능브랜치에 일반push/원격exact·main06e1eca유지. Vercel dpl_Cj6zrxhT62oXjENHhxEH5M11WcUv 정상UI Ready/Preview/정확제품SHA, GitHubsuccess. 실제Preview `/party` 통합창에 매어2·지옥3·지옥4 표시/순서 확인·취소, 실등록0. 이 후속은 결과 문서 마감/구조 변경 없음, 최신브랜치HEAD까지 받을 것.

- 최종 로컬 검증: Node608/605PASS3기존skip0fail·16개 관련 browser PASS·scopedlint/격리60build/독립타입 exit0·native font cache/bridge fixture PASS. 기존 개인6상태/문서7,115줄/순월40제품 보존 오류0. 새 실제게임 소비·사용자 설치본 적용·운영 로그인 UI 검증은 미실시.

- 공개 운영 버전 웹v2.321/IRIS0.4.1·ZIP·새 공지는 유지. 이번은 기능 브랜치 인계이며 main 승격/수동 운영 배포를 하지 않는다. 직전 정상 운영 제품4480646·Vercel dpl_3Z2KVcSMJnMxuZmp8ye3HZ5E75ds를 기준선으로 유지한다.
- 플로팅 저장 알림을 캐릭터 줄 위 pending-only 한 줄로 변경, 일반 사이드 바 설정과 복구 보호 유지. ERGON 빈 화면 품목·수량 바로 선택/작업 목록 연결/(?) 문맥 안내/가공 불가 이유·단위 산출·초과 수량 표시. 설치 글꼴 목록 스크롤/키보드 선택·미리보기·초기화·선택적 검색, Escape/Home/End 보완.
- 한설 승인 어비스 누락5기준 운영 추가: 새ID33~37·31→36행, 원래31행 hash보존. UI/저장·server IRIS 통합 난이도 검증 시험과 정렬·배지 보완. DDL/RLS/권한 변경0. 상세/복구/주의사항은 `IRIS_OVERNIGHT_HANDOFF_20261020.md`.
- ERGON 공개 잠금·실제 소비0·기존 unknown/계획/개인파일 보존. 묶음 가공 자동실행/시설 회전/전체 BOM은 미완료. 실제 게임/설치본 UI와 로그인 운영 UI 시험은 별도다. 최종 검증/전송 결과는 아래 마감에 누적한다.

## 2026-10-19 21:25 KST — 내부 마감 / IRIS0.4.1 운영 확인

- 제품 `4480646f0b6238dbaff71a7ddb6fbf995c47f631` main+통합브랜치 일반push/원격exact. [운영 배포](https://vercel.com/sanctum-sanctuary/sanctum/3Z2KVcSMJnMxuZmp8ye3HZ5E75ds) 정상 대시보드 Ready/Production/Current 운영도메인/main4480646 확인.
- 실운영 다운로드320/390/768/1280px·0.4.1·metadata/ZIP595192bytes/SHA07b5c1db6c046ab4dbf9d4d406c0fd09c35ff7bd83a00c4d03bb19642ba4dacd 정확일치, 핵심6GET200/guest2API401/pageerror0 PASS. 공개notes0.4.1은‘버그픽스’제목·내용 한 구역만 확인. 핫픽스 신규공지0, 기존0.4공지id19유지.
- 코드회귀/패키지/0.4→0.4.1실교체 결과는 아래 참조. 실게임의 저장버튼/Alt~ 최종체감은한설 재확인대기이며 모의회귀를 사용자실성공으로 확대하지 않는다. 운영DB구조/권한·원본큐/개인파일 변경0. 이 마감은 문서만 추가/구조 변경 없음, 문서마감까지최신HEAD를순월에게전달한다.

## 2026-10-19 21:21 KST — 내부 기록 / v2.321·IRIS0.4.1 핫픽스 준비

- 한설이 저장안내 ‘지금 저장’/Alt+~ 시 플로팅 겹침·먹통을 긴급 수정·0.4.1 공개 요청했다. **새 케리그마 업데이트 공지는 작성하지 않고 앱 내 요약은 ‘버그픽스’만 표시**한다. 이 문서는 작업자 내부기록이다.
- body portal의 외부클릭 오인→native 영역축소·남은저장안내클리핑을 RED 재현. SaveStatus를 안정된 workspace portal에 붙이고 준비 전 표시보류, native panel좌표 안에 배치해 메뉴/접기 시 함께 숨긴다. 저장/복구/대기함·15초 timer/서버API/native운영로직 변경 없음. 에르곤/GNOSIS 잠금 유지.
- 새브라우저 회귀 수동save/no-close·4위치·scroll·menuhidden·pending보존·reopen·normal PASS, 기존focus/dialog/updater PASS. Node604/601PASS3skip0fail·독립타입/lint·최종Next60 PASS. 독립좁은reviewC0I0M0/관련31PASS. 최초시험의native초기dialog-close 모형/absolute nav높이/루트viewport 누락 및 React commit 기다림은 fixture보완으로 구분했다.
- 공개후보ZIP595192/SHA256 `07b5c1db6c046ab4dbf9d4d406c0fd09c35ff7bd83a00c4d03bb19642ba4dacd`, packageallowlist/hash/unsigned PASS. 사용자IRIS정상종료 확인 후 원본0.4.0 helper→최종0.4.1 EXE/fresh offlineWebView committed·친절아이콘/숨김·보호지문동일PASS(Temp iris-update-live-9989e3e8323e494189e1e6cda1d80f5e). 실게임입력0.
- 직전 정상 운영기준0.4.0/웹v2.32 제품3e6f7ae/배포dpl_7rwKTwyaDQNrYN49xnvTLcRhCh5V, 0.4.0백업은ignored .superpowers/sdd/2026-10-19-iris-0.4.1/previous-0.4.0. 실패시코드+ZIP함께복원·보호큐삭제금지. 실제push/Ready/운영파일검증은후속기록한다.
- 이전0.4.0 공지는 한설정상계정전환 후 정상UI로1건게시(id19), SANCTUM시스템/중제목7개·문장문단·표준제목 확인. `/kerygma?note=iris`가0.4.0을여는것도확인했다. 0.4.1새공지는0건.

## 2026-10-19 21:00 KST — v2.32 / IRIS Beta0.4.0 운영 공개 확인

- 제품 커밋 `3e6f7ae456576dd8bb145b91a1dddd6082d5c2da`를 통합 브랜치와 운영 main에 정상 push·ls-remote exact 확인. [Vercel 운영 배포](https://vercel.com/sanctum-sanctuary/sanctum/7rwKTwyaDQNrYN49xnvTLcRhCh5V) UI에서 Ready/Production/Current domain/정확 main SHA 확인, GitHub Vercel success도 일치했다. MCP scope403은 로그인된 정상 대시보드의 읽기 확인으로 구분했고 인증/권한 설정 변경0.
- 운영 익명 실제브라우저: 다운로드320/390/768/1280px·0.4.0표시/ZIP링크·가로넘침0, 공개metadata0.4.0와 실제 ZIP595194bytes/SHA256ea2a4f784fde6e79b632582681525e651b9ac1debcbb61aab57d58ce4ec04fd3 정확일치. 홈/로그인/캐릭터/케리그마/파티/관리자 GET200, 비로그인 IRIS2API401, pageerror/폼쓰기0. 공개notes0.4.0/3sections 확인. 운영 케리그마 실제 로그인 UI의 웹v2.32·그노시스 준비중도 확인했다. 로그인 후 저장/파티 생성 등 운영 쓰기 회귀는 하지 않았다.
- 기존 지원 앱은 업데이트 버튼, 새 사용자/구형 앱은 `/iris/download`에서 ZIP으로 받을 수 있다. 실제 원본0.3 helper→최종0.4.0 offline 교체/보호지문 검증은 아래 참조. 에르곤은 준비중 잠금이며 가공100개 문제 해결 출시가 아니다.
- **공지 게시만 대기:** 현재 브라우저 뉴월·부마스터의 ‘생텀 업데이트’ 버튼이 disabled여서 게시하지 않았다. 기존0.4.0중복 공지 없음 확인, 초안은 `docs/UPDATE_POST_IRIS_0.4.0.md`. 권한 있는 한설 계정으로 전환 요청, 코드/권한 우회·DB직접게시0. 따라서 공지가 올라갔다고 보고하지 않는다.
- 이번 마감은 문서만 추가/구조 변경 없음. 운영 DB 구조·권한/개인파일·보호원장 변경 없음. 바로 이전 정상v2.31/IRIS0.3.0 및 복구 기준은 아래 보존한다.

### 2026-10-19 20:52 KST — v2.32 최종 패키지 검증 (배포 결과 전)

아이콘 요청을 추가 반영했다. 실행은 IRIS.exe(응용 프로그램), 첫 실행 후 그림은 `아이리스 로고.ico`로 구분한다. 기존0.3.0 helper 호환용 IRIS.ico는 ZIP hidden 속성과 앱 실행 후 hidden을 적용하며 원본이름/내용은 유지한다. 새 표시 파일은 로컬에서만 생성해 ZIP10파일 계약을 지킨다. 같은 이름의 개인 파일/링크는 덮어쓰지 않으며 읽기전용 실패도 시작을 막지 않는다. 숨김 파일 표시를 켜면 호환파일도 보인다.

**최종 ZIP은595194bytes/SHA256 `ea2a4f784fde6e79b632582681525e651b9ac1debcbb61aab57d58ce4ec04fd3`**이며 아래 이전594801 패키지는 교체 전 검증 경과다. 표시이름 TDD RED→GREEN, ZIP hidden 보존 RED→명시속성 GREEN. 원본공개0.3.0 helper→이 최종0.4.0 실제교체/fresh offline WebView·표시ICO존재/동일해시·원본숨김·보호파일지문동일 PASS(Temp iris-update-live-9bb81c89daca46e4a7d2b1cd2b017f8c). Node601PASS3skip 재검·최종웹v2.32 격리Next60/독립tsc·scopedlint·lock/updater/focus 실제React PASS. 독립릴리스/아이콘검토 각각C0I0M0. 로컬다운로드4폭/해시·6핵심GET·익명401 PASS(아이콘후최종공개해시는운영후다시대조). 개인6상태·공통7문서7115줄·순월40제품보존오류0. 구조추가: DesktopReleaseFiles의 비차단 표시파일 준비와 builder hidden entry; DB/권한/보호저장형식 변경없음.

## 2026-10-19 20:45 KST — v2.32 / IRIS Beta0.4.0 공개 업데이트 준비

- 한설이 GNOSIS 준비중 메뉴를 유지한 통합 코드의 동반 push와 IRIS 플로팅 공개 업데이트를 승인했다. 웹 후속 버전v2.32/독립 기능 IRIS0.4.0. 운영 DB/권한 변경 없음. 실제 배포 결과는 후속 기록 전까지 미완료다.
- 원형 플로팅·Alt+~·게임 안 자유 이동·위치 복원·최소화 전환, 크기/단축키/별도 불투명도/분류 설정, 10초 일반 알림과 캐릭터 확인 유지·심층 제보 요약, 포인터 조작 후 입력 복귀를 포함한다. ERGON은 양쪽 자물쇠/disabled와 native 신규 실행 차단. GNOSIS 전역 PC/모바일 메뉴 준비중 유지, 기존 직접URL 로컬 시제품은 서버 접근제어가 아니다.
- 플로팅 기능창 업데이트 요약 두 줄과 기존 보호 설치 dialog를 연결했다. 공개 ZIP594801bytes/SHA256 `c2b306d4a0e222b46a98ce7450284c73f2beec1b3b949d72a5b81435a347ee02`, unsigned beta/기존10파일 allowlist. 코드 구조는 앞선 통합 설명과 동일하며 이번은 패키지/버전/문서 변경, DB 구조 변경 없음.
- fresh Node604/601PASS3skip0fail, native package/정책/ZIP공격·해시/프로세스 성공·실패복원·복구/HTTPS PASS. 원본 공개0.3.0 helper→0.4.0 실제 EXE+fresh offline WebView committed·보호 설정/대기함 지문 동일. 최초 sandbox 권한/격리 junction 차단과 정상 권한 재검은 구분한다. 앱/게임 강제 종료나 실제 게임 행동 없음.
- 이전 정상 운영v2.31/IRIS0.3.0/commit1d8e374, deployment dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR. 필요시 이 기준으로 코드와 ZIP을 함께 복원하며 설정/대기함을 삭제하지 않는다. Ready·운영화면/공개ZIP해시·공지 게시는 후속 확인한다.

## 2026-10-19 20:07 KST — 통합 기능 브랜치 전송 마감 / 운영 버전 유지

- 제품 `64cdd50c36619677a50900d41ac15d28d080e39d`를 `codex/home-gnosis-iris-integration-20261019`에 정상 push·원격 exact 확인했다. 이 결과를 기록하는 문서 마감까지 최신 HEAD가 인계 대상이다.
- 구조 변경 없음. 제품 검증은 아래 20:00 기록과 동일하며 마지막 개인6상태·양쪽7문서7,115줄·순월40제품 보존 재검 오류0, diff check PASS.
- 자동 Vercel Preview는 제품 SHA의 GitHub 상태 pending이며 Ready/실화면 확인 미완료다. 운영 v2.31/IRIS0.3.0·main1d8e374 및 직전 정상 배포 기준 유지. 운영 DB·수동 배포·다운로드 ZIP·공지 게시 변경 없음.

## 2026-10-19 20:00 KST — 집·사무실 통합 기능 브랜치 인계 / 운영 버전 유지

- 버전: 이번은 검증한 개발 통합본 전송이다. 운영 SANCTUMv2.31·IRIS0.3.0 유지, 소스 IRIS0.4.0은 출시 후보다. main/운영 DB/RLS·배포/공개ZIP·공지 변경 없음. 직전 정상 운영 기준1d8e374 / dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR 유지.
- 순월06c4097의 GNOSIS 메인·작성·댓글·사진/팔레트 저장/공유를 집 주말82e2325 위에 병합했다. 실제3D·다중사용자 서버 공유·운영 분류 저장은 미완료다. 개인파일은 push에서 제외·보존했다.
- IRIS: 자물쇠/disabled와 native 진입·소비 차단의 에르곤 준비중, 기존 보호 경로 유지. 플로팅 기능창의 업데이트 요약/공유 updater dialog 연결과 version0.4.0 표시용 요약, 임시 개발진단 제거. 앞선 원형플로팅/설정/알림/좌표·초점 수정도 포함한다.
- 구조: GNOSIS 로컬 UI/모델 및 IRIS featureAvailability·page portal/updater cache/native gate. 운영 DB/API 권한·보호원장 스키마 변경 없음. 소스에서 제거한 진단 endpoint는 production에서도404 확인. 상세 `docs/HOME_INTEGRATION_20261019.md`.
- 검증 Node604/601PASS3skip0fail, 격리 독립tsc/Next60 build/scopedlint·nativechrome93/defaultreleasegate/bridge/privatecompile·lock/updater/focus React PASS. 실제 격리GNOSIS4폭·저장reload·dialog·writer 시각/HTTP·독립좁은reviewC0I0. 이전 관리자lint부채와 루트staleNext생성type 오류를 전역 lint/type 완료로 감추지 않는다.
- 공통7문서 양쪽7,115줄 누락0·통합직후83집파일/40사무실제품파일 보존 확인. 양쪽 ACK범위·주말미확인누적 보존. 최종 패키지 실제교체/새앱실사용·공개 배포는 다음 승인 단계이며 완료로 기록하지 않는다.

## 2026-10-19 17:05 KST — GNOSIS 인계 후보 / 운영 버전 v2.31 유지

- 버전 제안: 이번은 독립 기능 브랜치의 미완료 후보 인계이므로 운영 v2.31/IRIS0.3.0 표기 유지. 실제 3D/다중 사용자 저장 완성 및 집 코드 통합 검증 뒤 기능 버전을 결정한다. 공식 출시·공지 게시가 아니다.
- 사용자 변화: GNOSIS 컴팩트 게시판/분류 SVG·전투/나이트메어 드릴, 케리그마 도구 재사용 rich editor·링크/표/투표·이미지200KB이하압축·댓글/대댓글. 일반 글쓰기 코디 입력은 시뮬레이터로 이동, 개인저장·PNG클립보드·패션글 작성 연결.
- 구조 변경: app/gnosis, components/gnosis, lib/gnosis*, useGnosisNavigation, 관리자 분류편집 진입과 개발전용 미리보기. API/DB스키마/RLS·IRIS·공개ZIP/공지 변경없음.
- 제한: 모두 브라우저 localStorage 시제품. 실제3D착용/의상색 렌더링·계정클라우드저장/다중사용자게시/운영분류관리 미완료. 기존4관리자lint오류는HEAD동일. 사용량15%는 새작업중단선이며 소진목표가 아니다.
- 검증: Node477중474PASS3기존skip0fail, 독립tsc/GNOSISlint/Next60페이지build PASS; 실제PNG복사·패션왕복·로컬게시 확인,320/390/768/1280넘침0. 리뷰보완후최종회귀와push원격일치는후속기록.
- 운영 배포0. 되돌리기 기준은 기존 운영 main1d8e374 / v2.31, 원격집인계의 정상배포기준 dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR 참조. 이번브랜치를운영승격하지않았다.

### 2026-10-17 15:15 KST — 플로팅 미완료 개발 인계 / 공개버전 유지

- 전송결과15:20KST: 27e8252874ad8d3affc846daf0004a17a777ffe3 push/ls-remote 정확일치. 결과 문서마감 최신HEAD까지 받는다. Vercel403/CLI없음으로 Ready·실Preview 미확인. 이번 결과마감은 구조변경없음/버전·운영유지.

- 사용자 요청으로 추가구현 중단·`codex/iris-checkboard-classes`만 push. SANCTUMv2.31/IRIS0.3.0·운영main1d8e374 유지. 직전정상배포 dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR, 운영승격0.
- 후보: 원형로고/방향적응4메뉴·Alt+백틱 `(Alt + ~)`·크기/투명도/키설정·좌표분리저장·정보10초/캐릭터무만료·심층제보상세목록. 구조는 native floating coordinator/store/표시bridge 및 frontend hub/notification queue 추가. 기존 게임실행/DB/RLS 구조 변경 없음.
- **출시 미완료 C0/I2/M1:** 숨김알림수명/compact초기Panel/labelRegion 미수정. 실제 앱 정상시작·전체화면/키/DPI 검증도 남음.
- Node574/571PASS3기존skip0fail 및 관련native/React·타입/scopedlint·격리build/privatecompile 기록. legacy캐릭터browser 실패/구UIlocator/기존Synaxislint2오류1경고 구분. 상세 `docs/IRIS_FLOATING_SOONWOL_HANDOFF_20261017.md`.
- 개인dirty/원본unknown/비밀설정 보존, 공개ZIP·공지·운영DB 변경0. Git전송·Vercel·실Preview는 전송후 별도확인하며 운영완료로 쓰지 않는다.

### 2026-10-16 KST — 개발 인계 코드 전송 확인 / 구조 변경 없음

- d63fd03 일반push/원격정확일치, 선행34e6aef 포함. 결과문서마감 최신HEAD까지 pull한다. 운영main1d8e374/공개버전·다운로드·공지·DB변경없음.
- GitHub Vercel pending, 직접조회403/CLI없음으로 Ready·실Preview화면 미확인. 마지막 코드 검증554PASS3기존skip·타입/lint/관련native·React/private compile PASS, 앱정상재시작/실수령은집후속. 이번문서추가 자체는 구조변경없음.

### 2026-10-16 KST 후속 — 수령·조건부창고 개발수정 / 공개버전 유지

- 기능브랜치 인계 후보 마감: 새 큰 화면은 방향 확인 전이므로 공개버전 상승/운영승격 없이 검증된 수정과 신규요구 문서를 전송한다. 정확SHA/원격확인은 후속기록, 공개정상기준선 main1d8e374/dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR 유지.
- 실제 승인CLI수령은 이동/목재7건·날개96,790동일 확인. 앱의프로세스조회접근거부를 최소생성시각조회로 수정/실readonly ready. 직접body 수령응답을 시설감소·보상대조로판정, 기존안전·원본보호유지. 실행앱정상재시작/앱실수령 확인은남음.
- 가방외창고수량 별도표시·재료전송기/연금술부스러기/게임확인 조건부안내. 무료무조건가용합산/주간창자동확인0. 편집목록/즐겨찾기·한화면작업대는 요구사항/제안 인계이며 출시기능아님.
- Node554PASS3기존skip0fail·타입/lint0·조건부창고실React/nativecollection+executor/private nativecompilePASS·좁은reviewC0/I0/M0. 새웹전체build 미반복/직전후보build와구분. 구조변경은 프로세스메타데이터/collect직접body/조건부창고모델, 운영API/DB/RLS/보호원장스키마변경없음. 공개main/v2.31/IRIS0.3.0·ZIP·공지유지, 전송은후속기록.

### 2026-10-16 KST — ERGON 현황·부족분 다음작업 개발 후보 / 공개 버전 유지

- 날개·가방·가공완료를 한 줄3칸으로 압축하고 새로고침을 짧게 표시. 보이는 대기화면은15초마다 한 묶음으로 갱신하며 준비/확인/실행/숨김에는 일반조회 중단, 복귀·종료 후 즉시 갱신한다. 캐릭터 전환 중 이전 재화 수치를 숨긴다.
- 원래 제작 목표를 유지한 채 필요한 선행 단계를 선택하고 완료 확인 후 원래 목표로 복귀. 등록 중 가공품은 대기/수령을 우선하고 아직 가방 재고로 세지 않는다. 선택은 기존 직접 준비/native동의를 사용하며 무인 반복생산은 미구현이다.
- 실제 던전 중 수령 차단에서 현재 게임행동 안내를 과거기록 확인실패로 잘못 표시한 문제를 수정. 전투/던전/자동행동에 대한 차단·원본보호는 유지한다. 이 native수정은 정상 재실행 후 적용한다.
- 자동검증553PASS/기존skip3/0fail, 타입/관련lint·격리웹빌드/private native컴파일 및 관련 실React/native회귀 PASS. 좁은/넓은 실제 화면은 한설 확인, 실제 수령 성공·정확비용은 확인 중이다. 전체BOM·시설정원·무인chain의 완성으로 표시하지 않는다.
- 구조 변경: 일반조회hook/순수다음단계모델·임시선행계획 연결 및 native알려진차단코드 전달. 운영 API/DB/RLS/보호원장 스키마 변경 없음. 공개 SANCTUMv2.31/IRIS0.3.0, 직전 운영main1d8e374/dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR 유지. 공식push·배포·공지·다운로드 갱신 결과는 별도 후속기록을 따른다.

### 2026-10-15 23:38 KST — 인계 전송 확인 / 구조 변경 없음

- 기능·인계 e7fa78d0c8c6ae56945dc3ff6d0100d4cf23580c 일반 push 및 원격 정확 일치 확인. 이 후속 마감은 문서만 변경하며 공개 버전/운영 기준/DB 유지, 구조 변경 없음.
- push 직전 Node549/546PASS3skip0fail·타입/관련lint exit0. GitHub 해당 SHA의 Vercel 상태 pending: https://vercel.com/sanctum-sanctuary/sanctum/4LDmd4TjkbN19QiQUMXAKivZkKsb . 직접 Vercel403/CLI 없음이라 Ready·실페이지 미확인, 서비스 배포 완료 아님. 최종 문서 마감까지 최신 브랜치를 pull할 것.

### 2026-10-15 23:33 KST — ERGON 원클릭 수령 개발 후보 인계 / 공개 버전 유지

- 한설 명시 요청으로 `codex/iris-checkboard-classes`만 인계 push한다. 실게임 수령 검증 전이므로 공개 SANCTUM v2.31/IRIS Beta0.3.0·운영 main1d8e374·공개 ZIP/공지/DB/RLS는 유지한다. 직전 운영 정상 기준은 dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR이며 운영 승격·되돌리기는 수행하지 않는다.
- 사용자 변화: 최초 native 수령 허용 후 시설 버튼 한 번으로 안전 점검·이전 세션 잠금 판정·시설 이동/완료품 수령 요청. 시설 아이콘과 짧은 두 열 카드, 넓은 작업화면·업데이트 안내 후보를 포함한다. 채집/제작/재등록/무한 반복 권한으로 확대하지 않는다.
- 구조: 별도 DPAPI 허용/감사/암호화 백업, 원본 unknown 보존, native 조정기·고정 수령 bridge·읽기 전용 collectionObservation 추가. 운영 API/DB/권한 구조 변경 없음. 상세는 Master Guide/승인 설계 참조.
- 코드 최종483f767. 이번 push 직전 task3-verify 재검 exit0: Node549/546PASS3기존skip0fail·타입/관련lint 통과. 앞선 별도 reader97/97·관련 native/7브라우저·격리웹/private native compile 통과는 이번에 반복하지 않았다. 정확한 전송 SHA는 후속 마감 기록에 남긴다. quantity File.Replace 합성 오류1회 후 단독/전체 재검 통과, 원인 미확정·잠금 우회 없음.
- 실제 새 화면은 한설이 확인. 실제 수령 성공·날개/재고 변화·원장 자동 분리는 미확인이고 완료로 표시하지 않는다. 최신 화면의 생활 현황 압축/대기15초 권장안은 아직 미구현·설계 승인 전, 현행10초 유지. 사용량13% 확인으로 새 구현 중단/15% 약속 유지.
- Vercel 동일 팀/프로젝트 직접 조회403, 설치 CLI 없음. Ready/배포 실화면 미확인이고 우회·수동 배포하지 않는다. 기능 인계와 서비스 배포 완료를 구분한다.

### 2026-10-15 11:05 KST — B1 인계 전송 마감 / 구조 변경 없음

- 기능02cde76/검토수정520d136 정상push·원격exact일치, main1d8e374 유지. 공개 SANCTUMv2.31/IRIS0.3.0·다운로드·공지·DB/RLS 변경0. 이 후속은 문서만 변경, 구조 변경 없음.
- 코드629/626PASS3기존skip/타입·l​​int/최종격리58 및 실제React·관련native/privatecompile PASS. 독립 중요1 최종품 예약 RED→GREEN/재리뷰0, 실제 게임 검증·unknown해제는 하지 않았다.
- GitHub Vercel status success/동일520d136 확인. Vercel MCP403·CLI없음으로 직접 Ready·실페이지 미확인, 우회/임시공유링크/수동배포0. 집 실제검증 및 후속 B2는 HANDOFF/IRIS_YEONGGEOP_HANDOFF를 따른다. 인계 push를 공개 배포 완료로 표시하지 않는다.

### 2026-10-15 KST — ERGON 통합 대기열·큰 제작 목표 B1 후보 / 공개 버전 유지

- 최종 자동검증: 중요지적 수정본 전체629/626PASS/3기존skip/0fail, 독립tsc·관련eslint0, 최종격리webpack58/58 exit0. 새 Queue 예약 회귀 및 기존 진척·큐 화면 GREEN. 실제 게임·Preview실화면·설치 검증으로 대신하지 않는다. 인계브랜치 정상push/원격확인 결과는 후속 전송기록.

- 마지막 검토 후속: 독립 리뷰 중요1(완료 최종품이 다른 목표 재료로 재사용되어 부족해지는 계산) 재현·수정. 통합 큐의 완료목표 예약량과 실제 초과분을 분리하고 부분완료도 시험했다. unit/실제Queue RED→GREEN, 수정후 전체629/626PASS/3기존skip0fail. 추가 소비·원장해제0/예약은 계획용으로 native 개별실행에서 강제하는 기능은 아니다. 최종 빌드/전송 상태는 마감 참조.

- 버전 판단: 실게임 검증 전의 기능브랜치 인계 후보이므로 공개 SANCTUMv2.31/IRIS Beta0.3.0을 올리지 않는다. 운영 정상 기준 main1d8e374/dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR 유지. 공개 ZIP/공지/DB/API/RLS 변경0, 새 버전 공지를 게시하지 않는다.
- 사용자 변화: 여러 목표를 펼쳐 수량 수정/선택/제거하고 전체 부족분·가공 등록/수령/제작 순서를 함께 확인. 같은 가방 재료 중복 사용 방지, 부분 참고자료/실제 재고/예상 산출 분리. 시설별 등록·완료와 수령 검토 안내(정원 추정·자동 수령 없음).
- 제작 목표20과 요청 최대5회를 분리, 본인이 보낸 요청의 수량·완료·정확 비용이 확인된 양만 진척으로 반영. 완료5 이후 큐·재료는 남은15, 원본20은 보관한다. 완료 목표 재준비 차단·명시적 새 목표/예산 갱신, 메뉴·다른 품목 왕복 유지. 매 소비는 기존 native 최종 동의가 필요하며 자동 반복하지 않는다.
- 알려진 제한: 점검으로 실제 게임 검증은 저녁 영겁에게 위임. 기존 비용 미확정 보호 보존/자동 해제0. 전체 재료표·시설 정원/전체수령 비용·native 총예산 chain/자동 재충전·Chronos/모바일 미완료. UI 진척은 이번 실행 세션이며 재시작 후 자동 복원하지 않는다.
- 검증 중간 결과: 전체Node628/625PASS/3기존skip/0fail, 독립 타입/관련lint, 새·기존 실제React 합성, native 행동보호/수량/CLI/원장/bridge/창회귀 PASS. 격리 webpack58 exit0/private native compile exit0. sandbox localhost 접근 실패는 정상 권한의 동일 시험 재검으로 구분했다. 최종 리뷰·전송/Ready·실페이지 확인은 후속 기록이며 아직 운영 배포 완료가 아니다.
- 구조 변경: IRIS 순수 통합 공급/시설·추가목표 모델과 관제실 연결만. 기존 native bridge/보호 원장 형식 및 운영 서버·DB·권한 구조 변경 없음. REA 설치 문서는 PC별 도구 안내이며 프로젝트 의존성·타앱 소스를 추가하지 않는다.

### 2026-10-15 00:43 KST — 순월 검증용 인계 후보 / 공개 버전 유지

- 전송 확인: 기능 코드 `24c7534` 일반 push·원격 SHA 일치, main `1d8e374` 유지. 후속 문서 마감은 구조 변경 없음. GitHub Vercel 검사 pending, MCP 403/CLI 미설치로 Preview Ready·실화면 미확인. 운영 배포 완료나 공개 업데이트 게시로 표시하지 않는다.
- 한설의 명시적 요청으로 `codex/iris-checkboard-classes`에 ERGON 관제실·선택적 넓은 작업창·업데이트 변경요약 후보와 인계 문서를 전송한다. 공개 SANCTUM v2.31 / IRIS Beta 0.3.0 및 ZIP·공지·DB/RLS는 그대로다. 운영 정상 기준 main `1d8e374` / `dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR`.
- 구조 변경은 아래 10월 14일 로컬 UI/창 bridge/버전별 설명 JSON에 한정한다. 이번 인계 마감 자체의 추가 제품 구조 변경 없음. 운영 배포·실사용 검증 완료를 뜻하지 않는다.
- 10월 14일 최종 Node 519/516 PASS/3 기존 skip/0 fail, 타입·관련 lint·격리 빌드·private native 컴파일·관련 React/native 통과 기록 확인. 이번에는 전체 검증을 반복하지 않고 scoped diff 검사/ff-only 최신 확인을 수행한다. 실제 앱·게임 중지와 소모·설치 교체·모니터/DPI 검증은 순월에게 위임한다. 미확정 보호는 유지하고 추가 소비는 별도 승인한다.

### 2026-10-14 21:28 KST — ERGON 관제실·설치 전 변경요약 (로컬 미배포)

- 공개 SANCTUMv2.31/IRISBeta0.3.0 유지. 정상운영기준 main1d8e374/dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR. commit/push/main·공개ZIP·공지·DB/RLS 변경 없음.
- 현황/품목/수량·재료/실행을 한 작업화면으로 정리, 테마별 역할색·짧은안내·실제기록 확인. 작은바와 저장폭을 유지한 선택적 넓은 작업창. 한설 실제 넓은창 표시 확인, 일반창도킹 축소 버그를 실제tracker 합성으로 수정.
- 업데이트창은 대상버전 변경요약을 먼저 표시하고 설치는 기존 별도 버튼으로 한다. 다른버전·실패 안내/크기·시간 제한/HTML실행0. 기존파일검증·보관·설치 계약은 유지. 구조변경은 로컬UI/boolean창bridge/설명JSON이며 운영 DB/API/RLS 구조변경 없음.
- 최종 Node519/516PASS/3기존skip, 독립tsc/eslint0·격리webpack/nativecompile0·관련React/native 합성 PASS. 독립 UI리뷰 중요1 수정 RED→GREEN, 재리뷰0. 실제 게임 소비·수동복구·실설치/다른DPI는 미시험. dev webpack캐시 접근오류는 파일보관/Turbopack 우회로page/notes200, 상세원인 미확정.

### 2026-10-14 18:50 KST — ERGON 퇴근 인계 후보 / 공개버전 유지

- 전송마감18:56KST: 코드885e97f 일반push/원격일치, Preview dpl_AYQu36cM6WFdqnUeBq4ikbB4A7M3 READY·동일SHA 확인. 본추가는문서전용/구조변경없음. 보호된Preview 실화면조회는임시공유링크별도승인없어 auto-review거부, 우회0·사용자질문미응답/실확인미완료. 운영main·공개버전/ZIP·공지 그대로.

- 최종 fresh 검증: Node613/610PASS/3기존skip/0fail·독립tsc·관련lint0error0warning·신규supply/workbench/craft와기존quantity/actions 실React·native actor/quantity/CLI/journal/reference/bridge PASS, 격리webpack58 exit0·비공개nativecompile exit0. 마지막review 지적2개 RED→GREEN 및 직접회귀, 실제게임/Preview 완료 의미 아님.

- 최신 퇴근 요청으로 기능브랜치 일반 push 승인. 실제 게임 전체 검증 전 후보라 공개 SANCTUMv2.31/IRIS0.3.0 유지, 정상 운영 main1d8e374 / dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR. 운영main/공개ZIP/공지/DB/RLS 변경 없음.
- 현황·필요/보유/부족 재료·수량·준비를 같은 화면에 모으고 목록을 접음. 추가 제작 최대5횟수 한 요청/날개5/예상 산출 확인, 장비 미확인 재고를0으로 오판하지 않음.
- 부족분 순서 미리보기: 가방 공유재고·산출잔량·참고자료/공식 부족 목록으로 채집→가공 등록→수령→제작 순서와 단계 계획 추가. 부분 자료이므로 자동 실행/전체 비용 확정 아님. 불명·충돌·미해금은 확인 안내, 임의 오류와 경로는 숨김.
- 알려진 제한: 과거 S제작의 날개 미확정 보호 유지·수동복구 승인 미응답. 전체자동생활/시설반복·50%수령/Chronos/모바일 미완료, 마지막 native 안내는 정상 재시작 필요. 새실게임/Preview 검증 별도. 최종 검증·정확 SHA·Preview는 마감 후속 참조.
- 구조: 로컬 수량 schema3/선택 참고자료/작업대/읽기전용 수급 프리뷰/안전 오류 안내 변경. 운영 서버API/DB/RLS 구조 변경 없음.

### 2026-10-14 15:28 KST — ERGON 수량 제작·작업대 로컬 후보 (미배포)

- 공개 버전 상승 없음: SANCTUMv2.31/IRIS0.3.0, 정상 운영 기준 main1d8e374/dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR 유지. 이번 push 금지 지시를 따라 로컬 후보만 수정했다.
- 변화: 추가 결과 수량을 제작 횟수1~5로 묶어 한 번 요청/날개5, 장비는 확인할 수 없는 가방 수량을0으로 표시하지 않음. 선택 작업의 필요·가방·부족 재료/날개/가공현황과 실행 준비를 같은 화면에서 확인, 긴 목록·계획은 접는다. 설치 참고 재료표는 출처·날짜·미검증 상태를 표시하고 외부파일을 제품에 복사하지 않는다.
- 수정: 실제 완료 횟수·날개 비용 판정, 수량 수정과 재료 계산 동기화, 준비/확인 중 자동조회 충돌 방어, 문맥 변경 시 지난 캐릭터 조회값 폐기. 기존 원장/nonce/실행 보호·구형 읽기/수동 예산/채집Stop 유지.
- 알려진 사항: 기존 S1개 제작의 날개 차감은 사용자 미확인, 원장unknown 보존/자동 재시도 없음. 최신성·완전성이 입증되지 않은 참고자료를 자동연쇄 실행에 사용하지 않는다. 부족 재료 자동채집·가공·수령·최종제작/시설반복·Chronos 연결 미완료. 실제 게임/장시간 검증은 합성 시험으로 대체하지 않는다.
- 검증: 전체Node507중504PASS/3기존skip·타입/관련lint·native actor/quantity/CLI/journal/bridge/reference·실제React 수량/설비/부족분/10초갱신/느린준비·확인·구동선·격리webpack58/native패키지 compile PASS. 독립 review 중요2 수정 RED→GREEN. 새 local readonly reference/수량 action 구조가 변경됐으나 DB/API/RLS/공개배포 구조 변경 없음. 최종 앱 적용·후속 확인은 HANDOFF에 기록한다.

### 2026-10-14 11:05 KST — ERGON 추가 수량·현재 중지 로컬 후보 (미배포)

- 공개 제품버전은 SANCTUMv2.31/IRISBeta0.3.0 유지. 직전 정상 운영 main1d8e374 / dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR. 공개 다운로드/운영 화면/게시물은 이번 후보로 갱신하지 않았다.
- 후보 변화: 통나무 추가 수량1~100, 확보·남은·초과량/날개 표시, 현재 채집 ‘지금 중지’, 별도 동의한 목표 자동 중지, 접힌 안내/기록과 새 계획 복귀. 원래 가지고 있던 재고는 새 성과로 세지 않는다. 채집 묶음/읽기·중지 지연 때문에 목표를 초과할 수 있다.
- 수정: 일반 실행 busy와 별도로 scoped stop 통로, 완료 CLI에 늦은 stop 전송 차단, 잘못된 재고 위치 차단, 메뉴 왕복·만료 후 재준비, 늦은 stop 응답의 완료 상태 덮어쓰기 방어. 기존 보호 기록과 구형 응답 읽기를 보존한다.
- 검증: 전체Node499/496PASS/3기존skip/0fail·독립tsc/eslint·native 수량/actor/CLI/원장/bridge/reader/startup/grip22·실제React 수량/중지/구앱/폭·글자/기존제작회귀 PASS, 격리webpack58·scratch native패키지 compile exit0. 실제 게임 채집·현재 중지·날개 차감은 아직 별도 시험 전이다.
- 구조는 IRIS 로컬 native목표/stop bridge/보호원장schema2와 UI만 변경, 운영 서버/API/DB/RLS 구조 변경 없음. 제작 추가수량/전체BOM·부족분chain·Chronos·시설 반복/수령·모바일 알림은 남는다. 미확정 기록 자동해제/소비 자동재시도 없음. 코드 후보를 완성된 공개 생활 자동화로 안내하지 않는다.

### 2026-10-13 23:09 KST — ERGON 기능브랜치 인계 체크포인트

- 전달확인: 기능커밋c1f302de51ba99ad9d625c3cdb6d156b583ed9ad/원격인계브랜치SHA동일 일반push성공. 설계117af74도포함. GitHubVercel검사는전송직후pending, MCP403/CLI없음으로Ready·Preview눈확인은미확인. 후속문서commit은구조변경없음/제품버전유지/운영배포0이며사용자는최신인계브랜치를pull한다.

- 배포조회주의: 연결된Vercel MCP가동일운영scope조회403, CLI fallback설치없음. 이번은인계푸시만이며Preview Ready를검증했다고보고하지않는다. 운영배포/승격을우회실행하거나팀권한을변경하지않는다.

- **제품버전유지:** SANCTUMv2.31/IRISBeta0.3.0. 한설승인기능브랜치인계이며main·공개ZIP·게시·DB/RLS를변경하지않는다. 정상운영기준 main1d8e374 / dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR, 운영구조변경없음. 후보의로컬상태/활동조회필드구조변경은MASTERGUID 최신기록참조.
- 변경: 수동제작5회/25날개예산보존·5분새시작기한·명시재준비/다음시작중지, 메뉴왕복/계획·화면ABA 늦은nonce폐기·중첩조회방어. 과거던전입장이력대신현재주버튼상태를검사하고기존15flags·던전밖/미확인차단은유지한다.
- fresh검증: Node496/493PASS/3기존skip/0fail, tsc/관련lint/native reader·actor/실React예산·중지·기한·메뉴·ABA/6테마/격리webpack58 exit0. 타입검사는빌드의ignoreBuildErrors와별도로실행했다. 실제사용자앱복구·통나무1회시작관측, 최종비용/응답확인은미완료.
- 알려진사항: 채집계획목표1은실제1개중지가아니며CLI한호출최대100; 다음작업중지는현재게임채집중지아님. 실제중지/수량진행/압축UI는새설계서검토대기, 전체BOM·부족분자동chain/낚시/시설반복은미구현. 인계후이제약을숨기거나완성버전으로공지하지않는다.

### 2026-10-13 21:28 KST — 제한 수동 묶음 로컬 검증, 미배포

- 실제 사용자 준비 실패 후속 수정: 던전 입장 이력이 남아 마을에서도 실행 준비를 막던 안전검사 해석을 수정. 현재 주 버튼 상태와 기존 던전/15flags를 함께 검사, 현재/미확인 위험은 차단하며 과거 이력은 유지한다. reader/actor/TS 회귀 RED→GREEN, 전체496/493PASS/3skip·tsc/관련lint/격리58 exit0. 실제 공식 read-only native 검사 PASS, 정상종료 후 수정 앱 재실행. 실제 채집 명령0·공개ZIP/제품 버전/운영배포/게시0 유지.

- 공개 버전 상승 없음, SANCTUMv2.31/IRISBeta0.3.0 유지. 직전 정상 운영 main `1d8e374` / `dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR`. 로컬 수동 제작 예산 유지·다음 시작 중지·5분 기한·명시적 새 묶음·메뉴 왕복/늦은 준비 응답 방어. 자동 다음 실행 기능이 아니다.
- 전체 Node496중493PASS/3기존skip/0fail, tsc/관련eslint/격리webpack58 exit0, 실제 React6테마/12폭·글자 조합/중지·소진·기한·메뉴/ABA 회귀 PASS. 최종 독립 리뷰 중요2건 RED→GREEN. native 실행 코드는 변경하지 않았다.
- 통나무1회/날개최대5 시험 승인만 확보. 실제 명령0, 개발 IRIS 정상 실행 뒤 화면 도구 오류로 사용자 화면 요청 대기. 실제 비용/완료·장시간 작동은 검증 전. 전체BOM/시설반복/Chronos/자동발송 미완료.
- 서버·DB·RLS·공개패키지 구조 변경 없음, IRIS 로컬 상태/수명 구조만 변경. push/운영 배포/공지 게시 없음. 관련 사용자 개인 변경 보존.

### 2026-10-13 개발 체크포인트 — ERGON 단일 동작 후보, 미배포

- **공개 버전 변화 없음:** SANCTUM v2.31 / IRIS Beta 0.3.0 유지. 이번 기록은 기능 브랜치 인계용이며 운영 `main`·공개 ZIP·업데이트 게시물은 변경하지 않는다. 구조 변경은 IRIS 로컬 native 생활 실행/원장/고정 bridge와 화면에 한정, DB 스키마·RLS 변경 없음. 직전 정상 운영 기준은 main `1d8e374` / Production `dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR`.
- 사용자에게 보일 후보: 에르곤에서 단일 채집·가공 등록·제작·완료분 수령의 조건/날개 예상치를 보고 두 단계로 확인할 수 있다. 완료/등록/결과불명을 구분하고 기록을 확인한다. 최대 5회·25날개 묶음은 **계획 미리보기**만 제공하며 반복 자동 실행은 아니다. 잘못된 문맥/오래된 조회/미확정 결과/재시도는 차단한다.
- 검증 후보: 가짜 CLI·합성 게임 응답·React 화면/브리지/native 원장 시험, 전체 Node 492중489 PASS·3기존 skip·0 fail, 독립 tsc exit0/격리 webpack 정적58·native scratch 패키지 컴파일 통과. 빌드는 가짜 공개 환경값만 사용했다. 정확한 push SHA는 최종 전송에서 확인한다. 실제 게임 행동·사용자 설치/운영 페이지 확인은 **미실시**, 따라서 이 체크포인트를 공개 기능 완료로 안내하지 않는다.
- 독립 리뷰 Critical 0/Important 6건을 수정: 업데이트 중첩 native 거부, 실행 중 메뉴 잠금, 재시작 후 결과불명 이력 조회, 숨김 뒤 결과 확인, 목표 초과 채집 응답, 첫 생산품의 보유0 처리. 동명 이종분류는 합산하지 않는다. 관련 native·브리지·브라우저 합성 테스트를 다시 통과했고 전체 Node 492/489 PASS·3 기존 skip/0 fail, 독립 tsc exit0, scratch native EXE/ZIP compile exit0, 격리 webpack 정적58/58 exit0.
- 알려진 제한: 전체 BOM/현재 가방 부족분 자동 계산·Chronos 생산 대기열·시설 병렬 슬롯/50% 수령·자동 반복·낚시/소량 채집·완료 푸시 알림은 미구현. 비용을 확정할 수 없는 수령은 별도 경고가 필요하다. 원장 unknown은 자동 재시도/해제하지 않는다.

### 2026-10-13 개발 체크포인트 마감 추가

- 마지막소스전체Node484중481PASS/3기존skip/0fail·tsc/관련lint0error·격리webpackexit0. native생활읽기/보호기록·배타파일잠금/브리지/시작종료/창grip22/WebView격리profile·scratch패키지compilePASS. 실제종료복구·새native적용은사용자확인대기.

- 사용량5h잔여3%로새구현중단. 기능브랜치만인계push하며제품버전0.3.0/운영v2.31 유지. 실제자동생활명령·신규공지·공개업데이트배포없음.
- 개발화면FastRefresh 후 native요청번호가1로되돌아가저장·종료연결이거부되는경로를실제store시험RED→GREEN으로수정. 기존막힌앱은트레이복구종료 안내/최근미보관변경손실주의/보호대기함덮어쓰기0. 실제사용자복구확인대기.
- 보호작업기록세션간경합방어를배타filelock으로수정·검증. 기록30일정리는다음작업시수행,미확정작업삭제금지. native소비명령과보호원장은아직미연결. 본문과구조도/인계/상대릴레이에동일미완료경계기록.

## 2026-10-13 KST — ERGON 로컬 개발 체크포인트 (미배포·버전 유지)

- 에르곤에 공식 생활 목록·가방/창고 재료·무게·가공현황 조회, 검색과 목표 수량 계획을 구현했다. 이 PC에만 계정별 계획 저장, 손상 기록 보존·저장 실패 안내. 제작 불가 이유와 현재1회 부족분을 표시한다.
- 시작 전 점검에서 최신 게임 상태·날개 보유·대상 조건을 읽는다. **자동 채집·가공·제작 명령은 아직 미연결**이며 50%수령/빈자리 재등록/Chronos장바구니/전체부족재료 계산은 완료하지 않았다. 보호 작업 원장(DPAPI) 기반만 별도 구현·합성 검증, 실행버튼을 완료처럼 열지 않았다.
- 독립 읽기검토의4 중요사항 수정: 실패status/body.error 거부, 잠깐숨겼다복귀한이전응답폐기, 활성가공목록 수동성공후에만poll/오류중지, 공식잠김·불가이유표시. 제작 호출묶음 계약에 맞춰 날개예상을 범위로 수정. PS소스목록 수정 중 BOM인코딩 실패를 복구했다. 확장창고정 요구에맞춰 기존native높이fixture를수정해통과.
- 최근 전체Node483중480PASS/3기존skip, tsc/관련lint·실React조회계획/시작전점검·native브리지/정상종료/grip22·생활reader7실제읽기·scratch패키지compile PASS. 최신격리webpack검증 및 안전기반 독립검토는 진행 중이며 결과를 갱신한다. 실제 소비 게임명령0.
- 구조 변경: 생활 전용 native readonly bridge/모델/로컬계획/사전점검/미연결 보호원장 추가. 운영DB·RLS·기존 저장큐 구조 변경 없음. SANCTUMv2.31/IRIS0.3.0과 직전정상1d8e374/dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR 유지. 새공개ZIP·업데이트글 게시0.

## 2026-10-13 KST — IRIS 로컬 UI 후보 / 아직 공식 배포 아님

- 세 상위 메뉴와 생활 마크·에르곤 소개/4영역 화면 준비. 에르곤 게임 명령은 아직 연결하지 않았다. 한글두줄/선택·hover영어한줄, 테마·키보드·움직임 줄이기 반영.
- 상시 저장 줄 대신 필요할 때만 나타나는 반투명 안내. 설정에서4모서리 위치/4초 미리보기, 이 PC에만 기억. 오류복구 유지/확인 모달 중 숨김. DB/API/native/보호 큐 구조 변경 없음.
- 최종460/457PASS/3기존skip·tsc/관련lint·격리webpack58·실React·기존 메뉴회귀PASS. 중간 기존 버스 알림 시험1회 간헐 실패는 HANDOFF에 보존, 단독/전체 직렬 재검증PASS. 실제 게임·DPI 확인 별도.
- commit/push/운영 배포·버전업·ZIP·공지 변경 없음. 운영 기준v2.31/IRIS0.3.0·직전 정상1d8e374/dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR 유지. 새 공지 중복 게시하지 않는다.

## SANCTUM v2.31 / IRIS Beta 0.3.0 — 2026-10-12 KST 공식 배포

### 운영 확인과 게시 완료 — 21:11 KST

- 21:23 KST 후속 배포 복구: 인계 문서 커밋9cfcfb222ee7734d7d8aae0d75e0b3a1bac2b004의 첫 Production dpl_AbKLQpbzhfgmajDmPxFZzabd7ssN은 git_info_fail로 ERROR였다. 기존 정상 제품 배포/공개0.3.0는 유지됨을 확인했고, 같은 프로젝트/같은 커밋을 설정 변경 없이 정상 재배포했다. dpl_6W4wLEF8k1CBbwjBXEku8Zv2ChUg **READY·동일SHA·Production·공식 도메인 aliasError null** 확인. https://vercel.com/sanctum-sanctuary/sanctum/6W4wLEF8k1CBbwjBXEku8Zv2ChUg . 상세 build log403/CLI없음은 미확인 제한이며 인증 우회0. 코드/ZIP/공지 변경 없이 복구, 이 기록은 구조 변경 없음.

- 게시 분류 후속: 기존 엄격한 IRIS 제목 계약에 맞춰18번 제목만 ‘IRIS Beta 0.3.0 출시!’로 정상 수정 UI에서 정리한다. 공지 분류 코드/DB유형 확장 없음·본문/중제목 유지·중복 생성0. 단일 예약 iris-sanctum은 앱 도구로 PAUSED/저장 상태 확인, 완료 작업 반복 금지.
- 제목 수정 후 실제 운영 `/kerygma?note=iris` 재로드에서 **IRIS Beta0.3.0 최신 글18/시스템 작성자/본문4중제목** 자동 연결 확인. 이전16번으로 열리던 준비 단계는 해소됐으며 이 결과까지 마감 인계한다.

- 제품 커밋 d70b0e52f446747ceb1e385a63375baee7c087a3를 main/인계 브랜치에 정상 push하고 원격 SHA 일치 확인. Vercel project prj_toZtfgFvZWlw1q0OXuBlungxW6Q7 / Production dpl_GwtYnzwu2YndBELvBR9TgB98Eitk READY·main 동일 SHA 확인: https://vercel.com/sanctum-sanctuary/sanctum/GwtYnzwu2YndBELvBR9TgB98Eitk . 팀 slug 범위403은 우회하지 않았으며 기본 연결의 실제 프로젝트 ID 조회로 정상 범위를 확인했다. 정상 UI Vercel 로그인은 하지 않았다.
- 운영 Chrome 메인 카드·상단 계정/알림/정령의 날개 버튼 근처 배치, Escape 닫힘/알림 바깥 클릭, 상세 크로노스 기능 버튼·다운로드 Beta0.3.0 눈 확인. 공개 metadata0.3.0·ZIP527716bytes·SHA2562dfda82795e997415173b87c2359d3550465d8a1564cf049c51b3bdf7306bcdd 일치. /·login·character·kerygma·party·admin·iris/download·auth/health 8GET200(실제 로그인 새 입력/운영 숙제 쓰기 시험은 아님).
- 정상 로그인된 Chrome 한설 계정의 케리그마 작성 UI로 SANCTUM 시스템·생텀 업데이트 각1회 게시. 생텀 v2.31 글17 https://sanctum-tawny-three.vercel.app/kerygma?id=17 , IRIS0.3.0 글18 https://sanctum-tawny-three.vercel.app/kerygma?id=18 . 게시 전 동일 버전 없음 확인, 실제 중제목 도구3/4구역·본문·작성자·상세 표시 확인. 붙여넣기 서식/입력 위치 문제는 미게시 상태에서 바로잡았고 raw HTML은 게시하지 않았다. 공지2건 외 운영 기록 시험쓰기/삭제·DB스키마/RLS·게임행동·보안 우회0.
- 사무실 정상 종료된 Development IRIS를 최종 소스로1회 재시작 PID23852/Responding true/stderr0 확인. 사용자 설치본 강제 교체/강제 종료 없음. 집 첫 과제는 IRIS 실행 후 게임 최대화→작은 바/메뉴 위치 유지→일반창 좌우 도킹→최소화/복원과 다른 DPI 실사용 확인이다. 합성/native 시험을 실제 게임 확인으로 대신하지 않는다.
- 전체455 중452 PASS/3기존skip, 독립tsc·격리webpack58·실React 회귀·native/실제 업데이트 교체 검증 통과. 직전 정상 fb607e0(코드48d5611)/dpl_DP47tvp3qsVdrzpomVmJarb5XrTu가 되돌리기 기준이다. 이 마감 기록 후속은 **구조 변경 없음/제품 버전 유지**이며 다시 게시하지 않는다.

### 이전 준비 기록 — 아래 항목은 배포 전 경과

- 20:53 KST 최종 후보 검증: 전체 Node455 중452 PASS/3기존skip/0fail, 독립 tsc exit0·격리 webpack58 exit0·diff check PASS. 마지막 소스 변경 후 재검사했다. 정상 push/운영 검증·공지 게시 결과는 아직 별도다.

- 20:20 실행 후 홈 Kronos Check Board15초 묶음 저장 구현. 연속 체크·전송 중 새 입력/되돌림·캐릭터별 baseline·수동 지금/다시 저장·실패 보존·모든 홈 버튼 이동/계정 전환 보호를 적용한다. 선택적 기간 메타데이터와 기존 delta merge/CAS 유지, DB스키마/RLS 변경 없음. 관련24/실제 React 회귀·독립tsc·최종 격리webpack58 exit0, 전체 최종 결과는 운영 후속에 기록한다.
- native 실제0.2.2→0.3.0 EXE/helper/새 offline WebView trial PASS/보호해시 보존; 아래 ‘남음’은17시 경과다. 같은 리뷰 자리의 geometry/header/opacity 및 홈 저장 경계 Important를 수정해 잔여 없음. 실제 게임/다른DPI 실사용 확인은 여전히 남는다.

- **아직 공식 push/운영 배포/게시 미완료.** 한설이 마감·업데이트 가능한ZIP·따뜻한 중제목공지2글 게시를승인. 사용량96%구간 checkpoint/20:20동일대화재개예약. 완료시정확한KST시각·SHA·Ready·운영눈확인·게시ID를추가기록한다.
- SANCTUM: 크로노스웹15초묶음저장/즉시편집·수동저장·pending때만컴팩트반투명상태, 기능버튼높이축소. 상단3패널은호출버튼근처/header도구전체아래/작은화면경계/내부스크롤. 웹원래테마·권한·기록보존.
- IRIS: 애드온바/제목통합·상시하위8버튼·숙제그룹/미완료필터·추천/수동선택통일, 스탯재조회·확인후업데이트/계정길드공헌도, 재화·강조/시낙시스·기존상점/임무기능보존, 메모리정리제거유지. 설치글꼴자동검색/6~22pt/폭360~720/로컬기억/투명도30~100·테마선택, □작은바/고정위치600패널·내부scroll/게임최대화·일반복귀좌우도킹/같은층·최소화·바탕화면/둥근region. 캐릭터연필·추가·대표·메타추천새로고침, 알림4종·기본ON/개별음소거/짧은자가벨·기존제보·예상과확정구분. 종료저장·보관설명/초안보존.
- 구조변화: IRIS character-management endpoint·controller와표시용nativefonts/presentation/sound 고정bridge, 홈/IRIS시간계산공유, header panelposition hook. 기존DB테이블만사용, **DB스키마/RLS/권한 변경없음**. 대표clear/set는cross-client전역원자성없음/postread부분실패경고, 신규RPC없음. 운영시험쓰기/삭제/게임행동/보안우회0.
- 검증후보: Node443/440PASS/3기존skip·독립tsc/격리webpack58 exit0, 대상lint0오류/날개기존imgwarning1·기존Synaxis broadlint부채별도. 이전단일fullbundle리뷰와중요회귀수정PASS. 최신nativeaddon82/grip22/bridge/presentation/fonts/bell/WebView/startupclose, 실제React합성폰트/폭/접기/opacity30reload/5폭header/메뉴/알림/카드 PASS(범위상세HANDOFF). 최종좁힌geometry/header/opacity 리뷰와실제최신ZIP live교체trial/운영확인은20:20후속.
- 패키지후보: public IRIS ZIP0.3.0/527716bytes/SHA2562dfda82795e997415173b87c2359d3550465d8a1564cf049c51b3bdf7306bcdd, allowlist10파일/manifesthash/icon/unsigned PASS. updaterpolicy 및임시프로세스success/crash/recover PASS, sandbox경로거부/relative인수실패는절대경로/승인된격리시험경계에서분리재검. 실제0.2.2→0.3.0 EXE/helper/WebView교체와보호hash시험은아직남음.
- 알려진제한: 실제게임/다른DPI 최종재확인남음, 미서명베타/조직차단우회금지, 구0.2.0/0.2.1 HTTPS실패앱은ZIP전체수동1회교체. 현재글초안2개는게시전이며Ready뒤중복검사후SANCTUM시스템으로각1회게시.
- 되돌리기기준: 직전정상 origin/main fb607e051eaf53afeac52dc88905dd2c08643ea0(제품코드48d5611), SANCTUMv2.3/IRIS0.2.2 Production dpl_DP47tvp3qsVdrzpomVmJarb5XrTu READY. 현재운영DB구조는그대로이며실패시안전한코드/패키지롤백을먼저검토한다.

## 개발 인계 기록 — 2026-10-12 KST — 운영 버전 변경 없음

- 한설 승인으로 영겁의 `codex/iris-checkboard-classes`를 순월에게 공유한다. **공식 운영 릴리스가 아니며** main/운영 제품 SANCTUMv2.3·IRISBeta0.2.2를 변경하지 않는다. 새 ZIP/공개 업데이트 게시/운영 DB 변경 없음.
- 후보 사용자 변화: 기존 크로노스7기능을 현재 기능 + 3그룹 선택으로 정리, 기능 왕복 초안 보존/닫힘·초점·짧은 화면 내부 스크롤. 새 HUD 기능은 아직 없다. 후속5설계/49항목은 보관용이며 일괄 구현 승인이 아니다.
- 직전 후보 검증 기록은 승인 계획 끝에 보존: Node412 PASS/3skip, 독립tsc/격리webpack57 exit0, 합성 기능5·SVG/확인창6그룹 및4폭·3글자·6테마. 실제 사용자 앱/게임/다른 PC와 다른6개 전체 브라우저 엔트리 재실행은 별도다. 이번 전송용 문서만 추가했으며 빌드/네이티브 시험 전체를 반복하지 않는다.
- 전송 안내는 `docs/IRIS_SOONWOL_HANDOFF.md`; 신규 안내/릴레이 문서 후속 **구조 변경 없음**. 인계 후보의 이전 구현 커밋6fd6d3d/2d71996과 운영 기준fb607e0을 구분한다. 원격 HEAD 일치/순월 ACK와 운영 배포 완료는 서로 다르다.
- 푸시 전 원격 fetch/main pull --ff-only up to date, 새 전체 Node 검증412 PASS·3skip·0fail와 독립 TypeScript exit0을 확인했다. 제품 코드는 이전 검증 뒤 변경하지 않았다. 사용자 개인 미커밋 파일과 삭제를 제외했다.

## IRIS Beta 0.2.2 — 업데이트 보안 연결·스탯 쉼표 핫픽스 — 2026-10-11 19:43 KST

### 운영 배포 확인 — 2026-10-11 19:51 KST

- main48d5611b438d44207faab7d45a1f9384fd0acc5c 일반 push, Vercel sanctum Production dpl_DP47tvp3qsVdrzpomVmJarb5XrTu READY/동일SHA를 배포 목록 연결 도구로 확인했다. https://vercel.com/sanctum-sanctuary/sanctum/DP47tvp3qsVdrzpomVmJarb5XrTu . 운영 Chrome 다운로드 Beta0.2.2/정상ZIP 링크/보안 안내 눈 확인, iris-0.2.2-production.jpg 저장.
- 운영 metadata0.2.2·ZIP519982bytes SHA453d417129625d4c4af998627cdb8ac9a6a28c4dc5e8467532896c9077981f00 일치/핵심7GET200/authready=true. 완성 패키지 EXE 자체 네이티브 CheckAsync가 공개available0.2.2/installed0.2.0을 실제 감지했다. 정책 및 success/crash/recover도 PASS. 실제 한설 설치본 자동 교체/게임·DB 시험 쓰기는 하지 않았으며 구버전 ZIP 전체1회 안내, 사용자 설치 후 재확인은 남는다.
- 조회 상세 도구의 팀 범위403/CLI 미설치로 서버로그 오류 스캔은 미확인이다. 다른 연결된 배포 목록의 동일 프로젝트·커밋·Production READY와 운영 읽기·화면을 확인했으며 권한 우회는 하지 않았다. 공개 추가 노트0. 이 검증 기록 후속은 **구조 변경 없음**, IRIS0.2.2/SANCTUMv2.3 유지.

### 최종 후보 검증 — 2026-10-11 19:47 KST

- 한설 정상 종료 확인 후 최종 공개 ZIP 실제0.2.1→0.2.2 helper/IRIS.exe/새 오프라인 WebView readiness 통과, 보호 큐·설정 파일 해시 보존. 임시 trial iris-update-live-893df12a67f74373b7ad73ab79e4cad8. 기본 native 정책과 임시 프로세스 success/crash/recover도 확인한다.
- 최종 패키지의 IRIS.exe 어셈블리 자체 CheckAsync를 실제 .NET4 프로세스로 호출해 TLS1.2/기본 인증서 검증/운영 공개 신버전 감지 PASS. 합성 TLS 클라이언트 성공을 제품 성공으로 대체하지 않았다. 전체 Node 재검/tsc·최종 공개 metadata 포함 격리 webpack57(IeZhxx) exit0. 앞선 “종료/빌드 대기”는 해소, push/Ready·운영 화면은 다음 기록한다.

- 한설 수정·검증 후 main push 승인. IRIS0.2.1→0.2.2, SANCTUMv2.3 유지. 별도 케리그마 공개 업데이트 글은 게시하지 않는다(내부 배포 기록).
- 실제 IRIS와 동일 .NET4-target 기본 SSL3/TLS1.0 연결이 운영 업데이트 서버에 실패해 버튼이 없었던 원인 수정: 공통 metadata/ZIP 요청의 프로세스 내부 TLS1.2 지정. 인증서 검증·OS 프록시·고정 HTTPS·해시·설치/복구 및 보호 대기함 정책 유지. 버전 옆 조회 실패 표시 추가, 실제 신버전이 없으면 업데이트 버튼은 숨긴다.
- 생텀 스탯 숫자 문자열도 인게임 숫자와 동일하게 세 자리 쉼표(94,282) 표시. 실제 원본·저장·API/DB/RLS/권한 변화 없음. **구조 변경 없음**(기존 다운로드/UI 경로의 좁힌 수정).
- 구버전0.2.0/0.2.1 연결 실패 PC는 정상 종료 후 최신 ZIP 전체를 한 번 수동 교체해야 한다. 이전 “재실행으로 바로 내부 갱신” 안내는 HTTPS 실검증 누락으로 정정한다. 미서명/보안·조직 차단 시 중단, 보안 설정/인증서 검증을 낮추지 않는다.
- 검증: 실제 CheckAsync .NET 회귀 RED→GREEN(available0.2.1/installed0.2.0), 표시 신규4 및 관련16, 전체 Node·독립 tsc·좁힌 코드리뷰 통과. React 합성390/320px 실패표시/버전버튼/확인창/숫자/넘침 없음 눈 확인. 최종 ZIP10파일·manifest SHA·아이콘·미서명/정책 추출 통과, ZIP519982bytes SHA453d417129625d4c4af998627cdb8ac9a6a28c4dc5e8467532896c9077981f00. 실제0.2.1→0.2.2 교체 시험은 사용자 앱 정상 종료 대기(안전장치 중단), 최종 build/Ready·공개파일·실화면 확인은 후속 기록한다.
- 되돌리기 기준: IRIS0.2.1 codeb343f24 + docs95c116f / Vercel dpl_6oLfLVDaYVXGweibwLBS1VwyN7qt READY. 구버전 HTTPS 실패 제한까지 복귀할 수 있으므로 무조건 롤백하지 않고 사유·영향을 먼저 보고한다. 운영 시험 생성/탈퇴/삭제·공개 게시0, 다른 PC/네트워크/보안 정책/실사용 앱 확인은 미완료.

## IRIS Beta 0.2.1 — 길드버스 해산·탈퇴 핫픽스 — 2026-10-11 19:18 KST

### 운영 배포 확인 — 2026-10-11 19:21 KST

- main `b343f24956f53eb9b21fad22091dd529173f1376` 일반 push, Vercel `dpl_Bad1AjApPg5ri5ukj5LVMRoyhwpK` / sanctum / Production / READY / 동일 SHA를 연결 도구로 확인했다. https://vercel.com/sanctum-sanctuary/sanctum/Bad1AjApPg5ri5ukj5LVMRoyhwpK . 아래 배포 대기는 이 확인으로 해소됐다.
- 운영 Chrome `/iris/download` Beta0.2.1·정상 다운로드 링크·4단계·미서명 제한 및 `/iris/desktop` 앱 연결 대기/브라우저 편집 방어를 눈 확인. 공개 metadata/ZIP GET200·519786bytes·SHA4f43cb87ff5a4c30100aa83b870c8b2bc60fb47df80b286b60b777f0a09fb13c 일치, 핵심8페이지 GET200·authhealth ready=true. 캡처 `iris-0.2.1-production.jpg`. 인증 후 운영 버스 삭제/탈퇴 시험은 하지 않았다.
- 사용 중이던 Downloads/IRIS-beta의 공개 manifest는 installed0.2.0/updater1로 읽기 확인, 정상 재실행 후 내부 업데이트 안내 가능. 사용자 앱을 대신 설치/실행하지 않았으며 실제 계정 동작 재확인은 한설에게 안내한다. 공개 추가 게시0. 후속 검증 문서는 **구조 변경 없음**, SANCTUMv2.3/IRIS0.2.1 유지.

- 한설 승인: 수정·검증 후 main push, IRIS 0.2.0→0.2.1. SANCTUM v2.3 유지. 별도 케리그마 공개 업데이트 글은 작성하지 않는다. 이 항목은 내부 배포 기록이다.
- 길드버스 해산·본인 캐릭터 탈퇴의 기본 브라우저 확인창이 native 설정에 막혀 요청되지 않던 문제를 기존 IRIS 확인창/결과 안내로 연결했다. 취소·Escape는 요청하지 않으며 확인 중 중복 클릭을 막고 해산 완료/서버 오류를 기다려 표시한다. 웹의 기존 확인창과 서버 소유권·운행자 권한 검사, 탈퇴 단일 행동 요청은 유지한다.
- 검증: 실제 핸들러 회귀8/8 RED→GREEN, 전체 Node/독립 tsc exit0, 최종 공개 메타데이터 포함 격리 webpack57 exit0(`sanctum-iris-build-Qfn41W`), 교차 리뷰 새 결함 없음. 실제 React 합성 화면 390px에서 해산 확인/취소/성공 카드 제거, 탈퇴 Escape/성공/0명 갱신·재신청 안내·가로 넘침 없음 확인. 패키지 allowlist10/manifest·파일 SHA/unsigned 상태 및 native 업데이트 정책·임시 프로세스 success/crash/recover 검증 통과.
- 최종 공개 ZIP 519786 bytes / SHA-256 `4f43cb87ff5a4c30100aa83b870c8b2bc60fb47df80b286b60b777f0a09fb13c`. 원본 helper와 실제 EXE의 격리 0.2.0→0.2.1 교체·WebView 준비 통과, 보호 큐/설정 파일 해시 동일. 실행 중 IRIS 때문에 첫 시험은 안전 중단했고 한설 정상 종료 후 재시험했다. 사용 중 앱/게임 강제 종료·운영 파티 시험 쓰기 없음.
- 알려진 사항: 회차 완료/관리자 인계/이전 요청 확인의 기존 native 대화상자 제한과 미서명·다른 PC 검증은 남는다. 업데이트 다운로드 시작 후 취소 제한도 유지한다. DB/API/RLS/권한·native updater 구조 변경 없음; 기존 확인 인터페이스 호출과 release 패키지만 변경.
- 되돌리기 기준: `dd227d61c31b7090ce92e010eeb504bd87c9aadf`, IRIS0.2.0 / Vercel production `dpl_7ASAXcAhXUWUk1kVVMwnHqoeJ9DY` READY 확인. 0.2.1 push/운영 화면 검증은 후속 기록 전까지 대기다. 버전 낮춤은 현재 updater로 자동 적용되지 않는다.

## IRIS Beta 0.2.0 — 앱 내부 업데이트 / 출시 안내 — 2026-10-11 14:22 KST

### 출시글 운영 게시 확인 — 2026-10-11 15:23 KST

- 정상 관리자 작성 UI로 `IRIS Beta 0.2.0 출시!` 1회 게시 완료: https://sanctum-tawny-three.vercel.app/kerygma?id=16 . 작성자 SANCTUM 시스템·7개 구역의 테마 제목/구분선·코드 노출 없는 본문을 실제 화면으로 확인했으며 IRIS 업데이트 탭의 단일 목록에 표시된다. 아래 게시 연결 대기는 당시 기록이다.
- “조직에서 차단함” 다운로드 피드백은 조사 중이며 게시글에도 사용 중단/정책 담당자 확인을 안내했다. 미서명이 원인이라고 단정하지 않고 차단 우회 방법을 안내하지 않는다. 작성창 IRIS 하위 선택 UI는 현재 없고 제목·시스템 작성자 기반 분류다.
- 구조 변경 없음, 제품 코드·DB 스키마/RLS/권한·ZIP·버전·추가 push 변경 없음. 공개 게시물 1건만 사용자 승인 범위로 생성했다.

### 운영 확인·비교 보고 — 2026-10-11 14:30 KST

- main 코드 `44a958c32bc97a00d9f228d8bbb786dac0c53b01` 일반 fast-forward push 완료. 해당 커밋의 GitHub Vercel 상태 success 및 배포 링크 `https://vercel.com/sanctum-sanctuary/sanctum/8DdZj7yt8YycSNYjYHz5Pj4bPcY4` 확인. 직접 대시보드 Ready/빌드 로그는 연결 제한으로 미조회이며 이를 별도 관측으로 과장하지 않는다.
- 운영 `/iris/download` 실제 Chrome 320/390/768/1280에서 Beta0.2.0·네 단계·AI 커넥터 안내·다운로드 링크 확인, 가로 넘침/pageerror/비GET 제출0. 390/1280 캡처 눈 확인. 공개 metadata/ZIP GET200·519708bytes·위 SHA 일치, 핵심6경로 GET200·health ready=true·IRIS guest2경로401. 저장된 로그인·운영 파티/숙제 시험쓰기 없음. 캡처 `iris-production-release-QlXlAl`.
- 따뜻한 기능 출시 본문은 docs/IRIS_UPDATE_POST.md 작성 완료, 케리그마 게시만 CUA/NodeREPL 연결 오류로 미완료. 실제 글 ID/게시 시각 없음; 우회 DB 쓰기와 세션 추출을 하지 않았다. 게시 연결 복구 뒤 중복 확인→정상 관리자 게시만 이어간다.
- docs/IRIS_CONNECTOR_COMPARISON_20261011.md에 모비 생활 커넥터/MoFo/MobiWorks 기능표와49항목 도입 검토를 추가한다. 제작자 공개 자료·설치본 소스/README·실행파일 메타데이터를 대조하며 외부 앱 실행/게임 행동0. 후속 문서는 **구조 변경 없음**, 앱·DB·권한·SANCTUM v2.3·IRIS0.2.0 유지. 개인 미커밋 변경/삭제는 제외했다.

- SANCTUM 기능 버전은 v2.3 유지, IRIS 독립 버전은 0.1.0→0.2.0이다. native 교체 기능 첫 공개이며 기존 지원 없는 앱은 ZIP을 한 번 수동으로 받아 모든 파일을 압축 해제해야 한다. 이후 더 새로운 지원 버전일 때만 앱 제목줄 버전 옆 업데이트 버튼을 강조한다.
- 사용자 클릭→고정 운영 HTTPS 다운로드→ZIP/파일 SHA·버전·allowlist 검증→보호 보관→별도 설치 helper→자동 재시작. 실패 복구와 미완료 시작 복구를 연결한다. 설치된 native 버전으로 비교하며 웹에서 임의 URL/경로/명령을 넘기지 않는다. 게임·CLI·로그인 프로필·보호 대기함은 교체 대상 밖이다.
- 생텀 상단 빠른 도구 2×2/테마 IRIS 로고 다운로드, 새 IRIS 버전별 계정·브라우저1회 안내(노트·다운로드·명시 닫기), 다운로드 안내 테마/4단계/상세 접기, 케리그마 생텀·IRIS 하위 탭을 함께 배포한다. 기능 소개 `IRIS Beta 0.2.0 출시!` 본문은 docs/IRIS_UPDATE_POST.md에 준비, 현재 게시 연결 도구 오류로 아직 게시되지 않았다.
- 구조 변경: standalone desktop-update-policy/install/helper/manager, strict manifest/download.json, native bridge window.update.*(null), DesktopUpdater 상태/잠금/보관 연결, lib/irisRelease 독립 버전 및 kerygmaUpdates 시스템 글 판별. 기존 공지·auth·DB/RLS/권한/Realtime 변경 없음. 기존 크로노스·시낙시스 기능 재구현 없음.
- 최종 공개 ZIP 519708 bytes, SHA-256 `1ced8923c386f19c5892710d830c6b696f231aa6237bb38d23a7cd5b4f420cc7`. 9 payload+manifest, 개인 설정·게임/CLI·비밀값 미포함. 무료 미서명 베타이며 SHA는 파일 일치 검사이지 코드 서명/제작자 인증을 대체하지 않는다.
- 검증: 전체 Node dot/독립 tsc exit0, 분리 production webpack57 exit0(sanctum-iris-build-wbVXuB), 대상 lint exit0, native host41/bridge/policy/실제 프로세스 success·crash·recover3 흐름 PASS. UI4폭/PC3글자/6accent·실패/보관/중복/종료 방어 PASS. **배포할 최종 ZIP 자체**로 원본 helper·실제 release EXE 0.1.0→0.2.0 교체와 실제 WebView 준비 handshake PASS(iris-update-live-7da3c0ee0d964eb0bac88a22a5a3d819). 시험은 별도 설치·새 WebView 데이터·외부 네트워크 차단, 보호 파일 전후 해시 동일·로그인/운영 시험쓰기0. 시험용 0.1.0은 updater 지원 기준 빌드로, 기존 공개 0.1.0 앱의 자동 업데이트 지원을 뜻하지 않는다.
- 알려진 제한: 다운로드 시작 뒤 취소 불가, 다른 PC/DPI/SmartScreen·장시간 실제 사용 미검증. 일부 버스 운영/이전 요청 확인창은 기존 웹 party 우회 안내 유지. 실제 운영 웹 연결+사용자 보호 보관+업그레이드의 전체 연속 동작은 합성 UI/오프라인 native 시험과 구분한다. CUA/NodeREPL kernel assets 오류로 기존 관리자 브라우저 세션/공개 공지 게시 접근 불가. 서버 로그 관측도 기존 Vercel MCP403/CLI 없음 제한을 유지한다.
- 되돌리기 기준선: SANCTUM v2.3 / 코드2b9067e·문서62bdfc2, production Ready `dpl_Bk8w2ww62gSTqaXaqLHbkEYV5cVt`. 앱/웹 파일을 이전 정상본으로 되돌리더라도 DB와 보호 큐를 삭제하거나 구형 schema로 역변환하지 않는다. main push 및 새 배포 Ready/운영 화면·ZIP 확인은 후속 실제 결과로 추가한다.

## v2.3 — IRIS Windows 베타 다운로드 / 크로노스·시낙시스 연동 — 2026-10-10 23:45 KST

### 운영 확인 — 2026-10-11 02:18 KST

- main 코드2b9067ed3bd333924ca0fc4ecb32e9b56ca32040 일반push, Vercel dpl_Bk8w2ww62gSTqaXaqLHbkEYV5cVt Ready·Production·28초·동일커밋·운영도메인 직접확인. 실제 Chrome `/iris/download` 설치예외 안내/미서명/ZIP링크/확인값 및 `/party` 기존 부마스터 계정·공용화면/빈목록 표시, 관찰콘솔 error/warn0. 실제 로그인/생성/가입/운행/숙제 시험쓰기는 하지 않았다.
- 공개9경로 GET200, health200 ready=true, 신규IRIS synaxis/kronos 비로그인401. 공개 ZIP GET200/431067bytes/SHA77a87c1f87e6eab4aa41daf803292ff11e20b398811a316525cacef263145b87 일치. 실제native 정상재실행/다른PC·SmartScreen·장시간 및 운영 실시간 수신/쓰기 검증은 남는다.
- Vercel MCP team403/CLI없음으로 서버로그·drain 상세는 미점검, 기존GitHub 브라우저 세션으로 동일프로젝트 Ready 확인했다. 관찰콘솔0을 서버전체오류0으로 확대하지 않는다. 운영 DB/권한/SQL·공지 게시 변경 없음. 이 확인 문서 후속은 구조 변경 없음.

- 한설 승인으로 누적 로컬 IRIS 묶음을 main에 배포한다. IRIS 다운로드 안내 `/iris/download`에서 Windows x64 ZIP과 확인값을 제공한다. 관리자 권한·Node.js·개발 서버는 필요 없으며 Microsoft Edge WebView2 Runtime과 게임의 공식 생활 커넥터/CLI가 필요하다. 게임·CLI·개인 설정·보호 대기 기록·비밀값은 배포 파일에 포함하지 않는다.
- 크로노스 물물교환·상점 구매·임무 게시판의 진행과 즐겨찾기를 기존 계정 DB와 연결한다. 앞선 v2.21 유지 배포의 물물교환 계정 공통 별표·기존 브라우저 목록 명시 가져오기 개선도 이번 사용자용 노트에 통합한다. 이전 별표는 본인 확인 후 가져오며 기존 DB의 해제값을 덮어쓰지 않는다. 자동 가져오기·새 SQL 실행은 없다.
- 시낙시스 일반 파티/길드버스 현황, 본인 캐릭터 선택 가입·매칭, 운영진 길드버스 생성과 기존 운행자 화면을 공용 화면으로 연결한다. 날짜 달력·레이드/어비스 완료 열람, 어비스 매우 어려움/레이드 최고 유효 난이도 기본값, 신규 개설 자동 반영·레드닷을 제공한다. 일반 파티 탈퇴/관리자 삭제는 IRIS 확인창과 결과 안내로 수정하며 시간은 탈퇴 후 재가입으로 조정한다.
- 상위 메뉴 가방/레이드 마크, 컴팩트 참가 카드, 칸 사이 여백, 모든 IRIS 스크롤바의 테마색, 스탯 확인창 취소 위치를 개선했다. 제목 앞 테마 IRIS 로고와 프로그램/트레이 아이콘, 캐릭터 선택 줄의 계정→홈→설정 배치를 제공한다.
- 구조 변경: `/api/iris/barter`, `/api/iris/workspace`, `/api/iris/synaxis`, 공용 SynaxisSurface/PartySurfaceContext 및 expectedAccountId 요청 경계, workspace 보호 큐 schema3, production 전용 native WinExe/빌드 도구/다운로드 정적 자산. DB 구조·RLS·권한·Realtime 변경 없음. 새 채널은 기존 parties publication을 재사용한다.
- 알려진 제한: 미서명 베타로 Windows 보안 경고가 가능하며 보안 기능을 끄지 않는다. 다른 PC·런타임 미설치·DPI·장시간 실사용은 미검증이다. 일부 버스 회차 완료/해산/인계·결과 불명 확인에는 기존 기본 대화상자 경로가 남아 있어 IRIS 내부 확인/피드백을 모두 이식한 상태가 아니다. 해당 조작에 반응이 없으면 생텀 웹 `/party`에서 처리한다. 일반 파티 동시 쓰기의 서버 원자성·회차 다중 행 비트랜잭션 제한은 유지된다. 실시간 절전 지연/소급 알림 없음, 결과 불명 요청 자동 재전송 없음.
- 업데이트 시 기존 IRIS를 ×로 정상 종료하고 ZIP을 새 폴더에 모두 압축 해제한다. 보호 대기함은 지우거나 구형 앱으로 역변환하지 않는다. 웹은 운영 배포를 따르며 기본 브라우저와 IRIS 로그인은 별도다.
- 배포 전 최종 검증과 운영 Ready/다운로드/핵심 화면 확인은 아래 후속 기록에 실제 결과로 남긴다. 운영 시험 생성·삭제·가입·숙제 쓰기는 자동 실행하지 않는다. 공지 게시 승인/게시 없음.
- 되돌리기 기준선: v2.21 / main da1738e0eb2991f49f57cd27017399850faffd5b, Vercel dpl_734XzqaoK6MvTwrZLnMitjxm5E8w(Production Ready/운영 도메인 연결 직접 확인). 앱 코드 롤백 시에도 DB/별표/보호 큐를 삭제하지 않으며 schema3 큐는 구형 앱에서 열지 않는다.

최종 후보 확인 — 2026-10-11 02:14 KST: 정확한 staged 사본 전체 Node dot exit0·독립 tsc exit0·분리 production webpack57경로 exit0. 설치 안내를 마지막으로 명확히 한 뒤 다운로드3회귀·4폭/실제ZIPhash 통과, 최신 타입/빌드는 추가 확인 중이다. 헤더4폭/3글자/6테마, 공용 시낙시스 가입/매칭/버스 수정/레드닷 및 일반파티 탈퇴/삭제/실패/경합8 합성 통과; nativehost36·시작실패안전닫기·encrypted/workspace store·WebView 합성 통과. 스테이징 추가행 credential-pattern 검사/diff check 통과. 실제 운영 쓰기와는 구분한다. Windows11/대부분Windows10은 WebView2 기존 설치를 재사용하고 없다는 오류 때만 설치한다. 최종 공개 ZIP431067bytes/SHA77a87c1f87e6eab4aa41daf803292ff11e20b398811a316525cacef263145b87, 개인자료/CLI 미포함.

최종 안내 재검 — 2026-10-11 02:15 KST: 최신 후보의 독립 tsc·production webpack57경로 exit0, 공개 ZIP9파일/각 manifest SHA 일치·EXE NotSigned 확인. 위 추가 확인 중 표기는 이 범위에서 해소하며 운영 배포/실화면은 아직 확인 전이다.

## v2.21 유지 — 즐겨찾기 기능 적용 기록 — 2026-10-10 12:51 KST

- 운영 확인 — 2026-10-10 12:55 KST: main 62bd6786b4d792b141159cdcc740d34727b3fe9d, Vercel dpl_PWxBfDz2QPfKUbHmhrYiM7cRfD45 대시보드 Ready/Production/Current·운영 도메인·동일 커밋 확인(27초). 실제 Chrome 한설 /character?char=순월에서 계정 공통 즐겨찾기 정상 안내·저장된 앨빈 별표·기존 브라우저5개 가져오기/본인 확인 전 비활성 버튼·관찰 콘솔 error/warn0 확인. 공개 핵심5경로 GET200·health200 ready true·새 API 비로그인401. 실제 별표 POST/가져오기·IRIS 운영 동시 저장은 미시험, 사용자 조작으로 확인할 것. 버전 상승/공개 공지/추가 SQL 없음. 후속 기록은 구조 변경 없음.

- 한설 요청에 따라 버전 상승·공개 업데이트노트·새 공지 게시 없이 물물교환 계정 공통 즐겨찾기만 배포한다. 다음 버전의 공개 업데이트노트에 통합할 항목으로 보존한다.
- 웹의 별표를 본인 서버 세션 계정의 DB와 연결한다. 이전 브라우저 별표는 본인 계정 확인 후 명시적으로 가져오며, 기존 DB의 선택/해제 값을 덮어쓰지 않는다. 교환 횟수·상점/임무·미배포 IRIS/native·시낙시스 변경은 제외한다.
- 구조 변경: /api/kronos/barter-favorites, useBarterFavorites, TradeList 피드백과 서버 세션 UUID 연결. 한설이 이미 적용한 kronos_barter_favorites SQL 기록을 포함하며 이번 배포에서 DB 구조/RLS/권한을 변경하지 않는다.
- 정확한 staged 사본 전체 Node suite exit0·독립 tsc exit0·Production webpack 53경로 exit0·독립 리뷰 Critical/Important 0·diff check 통과. 운영 배포/화면 확인은 후속 기록한다. 실제 즐겨찾기 시험 쓰기/레거시 가져오기는 실행하지 않았다.
- 되돌리기 기준선: v2.21 코드 89034a5 / 문서 a36a2c2, Vercel dpl_3weipgZgD3d5AVtrdTFoaXX1ZQao. 코드 롤백해도 기존 별표/DB 행은 삭제하지 않는다. 구형 웹은 DB 별표를 읽지 않는 제한이 있다.

## 미배포 준비 기록 — 즐겨찾기 DB 적용 확인 — 2026-10-10 KST

- 공식 버전은 v2.21 그대로다. 한설이 물물교환 계정 공통 즐겨찾기 SQL을 실행하고 검증 JSON을 제공했다. 복합 PK·FK·인덱스, RLS 활성·공개 정책/권한0·서버 조회/추가/수정만 허용을 확인했다. 상점/임무의 기존 DB 별표와 횟수 기록은 변경하지 않는다.
- 구조 변경: public.kronos_barter_favorites 추가. API/UI는 앞선 로컬 구현을 재사용하되 아직 운영 배포하지 않았다. 기존 브라우저 물물교환 별표는 본인 계정 확인 후 가져오기, 실제 웹/IRIS 연동은 사용자 확인 대기다. 새 코드 빌드·배포·실제 쓰기를 이번 메타데이터 확인으로 검증했다고 주장하지 않는다.
- 되돌리기: 기존 기록과 신규 테이블을 삭제하지 않고 SQL 파일에 기록된 새 서버 경로 접근 차단형 복구를 별도 승인 후 사용한다. commit/push/외부 배포/공지 게시 없음.
- 로컬 후속 수정: 크로노스 화면에서 표시용 계정 정보의 누락 UUID 대신 서버 세션이 확인한 계정 번호를 연결해 물물교환 별표·다시 조회 잠김을 해소했다. 처리 중에만 대기 커서를 표시한다. 실제 로그인 재조회 확인, 신규4/관련23/React 합성11·독립 타입·전체 Node 테스트 통과. 운영 별표 시험 쓰기는 없으며 실제 웹/IRIS 저장 대조는 남는다. 이 후속은 추가 DB 구조·권한 변경 없음, 운영 배포 전이다.

## v2.21 — 길드버스 만료 안내 담당자 제한 — 2026-10-10 02:16 KST

- v2.2 길드버스 운영 개선에 대한 후속 핫픽스다. 만료된 길드버스의 시간 경과 안내를 현재 담당 관리자에게만 표시한다. 일반 참가자·다른 버스 관리자는 이 안내로 이용이 막히지 않는다. 담당자의 기존 30분/1시간 연장·내일 이동·모집 취소 기능은 유지한다.
- 안내에 닫기 버튼·바깥 클릭·Escape를 연결하고 같은 페이지의 동일 일정 재노출을 막는다. 일정/운행자 변경은 새 안내 대상으로 판단한다. 일반 파티의 기존 참가자 안내 기준은 유지한다.
- 공개 안내는 이번 수정과 앞선 v2.2의 공지 보존, 설정 수정·본인 참가 캐릭터 제한, 접속 중 변경/출발 알림, 일정순 정렬, 레이드·어비스 완료 열람을 합쳐 docs/UPDATE_POST_v2.21.md에 정리한다. 운영 배포·화면 확인 후 기존 길드마스터 공지 경로로 한 번 게시한다. 시스템 자동 게시 기능을 새로 구현하거나 켜지 않는다.
- 구조 변경: hooks/usePartyManager의 현재 운행자 판정·초기 역할 ref·만료 대상 제거·페이지 수명 닫기 키와 app/party/page.tsx의 닫기 동선. API·DB 구조·RLS·권한·Realtime 설정 변경 없음. 기존 신청/숙제 데이터 변경 없음. IRIS·즐겨찾기 후속 작업은 미포함이다.
- 배포 전 검증: 신규 만료 회귀18개 및 관련86/86 통과, 독립 TypeScript 통과, 기존 공유 lint42오류/8경고는 신규 증가 없이 남아 있다. 최종 배포 후보 검증·운영 확인·게시 결과는 아래에 후속 기록한다. 실제 버스 연장/취소 시험 쓰기는 하지 않는다.
- 되돌리기 기준선: 직전 v2.2 / 61cc25bdd1411922481fbafb71002510af58efbd, Vercel GitHub 성공 배포 5wdCNRoi7GUgJiZh9Gf21BGs23oG. 기존 버스 데이터나 Realtime 설정은 코드 롤백으로 삭제하지 않는다.
- 알려진 제한: 알림의 최초 접속 전 소급 없음·브라우저 절전 지연, 자동 출발 없음, 기존 회차 완료의 다중 행 비트랜잭션 제한은 유지한다. 운영 중 권한 변경 시 서버가 최종 권한을 검사한다.

배포 후보 검증 — 2026-10-10 02:21 KST: staged tree를 별도 폴더로 추출하여 전체 `node --test --test-reporter=dot` exit0, 독립 `tsc --noEmit --incremental false` exit0, 비밀 환경 파일 없는 webpack Production 빌드52경로 exit0. 첫 제한 환경 전체 테스트는 임시 파일/루프백 접근 거부로 실패했고 같은 후보의 허용 환경 재실행은 통과했다. 범위 한정 독립 리뷰 blocking0·신규18회귀 통과·실제 네 action callback의 대역 검증 통과. 운영 쓰기 시험과는 구분한다.

### 운영 배포·공개 게시 확인 — 2026-10-10 02:25 KST

- 코드 89034a5a9021de5c8177a5ffbb3d7cb1951ab1e1을 main에 일반 push. GitHub Vercel success 및 로그인된 Vercel 대시보드의 Ready/Production/Current Domains·동일 main 커밋 확인. 배포 dpl_3weipgZgD3d5AVtrdTFoaXX1ZQao, 운영 sanctum-tawny-three.vercel.app 연결. MCP 팀 접근403은 그대로이며 브라우저 기존 세션으로 읽기 확인했다. 재인증/권한 변경은 하지 않았다.
- 실제 운영 /party: 한설 길드마스터 세션, BETA v2.21, 만료 안내 없이 조작 화면 표시, 관찰 콘솔 error/warn0. 현재 조건의 파티가 없는 상태로 운행자 실연장/취소 쓰기는 하지 않았다. 서버 네 동작은 대역 회귀 결과와 구분한다.
- 최종 게시 직전 별도 한설 승인을 받아 기존 공지 작성 UI로 통합 업데이트 한 건 게시. 생텀 업데이트/SANCTUM 시스템/제목·본문·게시 후 목록 단일 항목 확인. 주소 https://sanctum-tawny-three.vercel.app/kerygma?id=15. 공지 열람으로 본인 읽음 기록이 저장되며 자동 게시 기능 추가·DB 구조/RLS 변경 없음. IRIS/즐겨찾기 로컬 파일은 보존한다. 이 후속 커밋은 확인 기록만이며 구조 변경 없음.

## v2.2 — 시낙시스 길드버스 운영 개선 — 2026-10-10 01:40 KST

### 길드원이 확인할 변화

- 길드버스 생성 중 직접 적은 공지가 컨텐츠를 다시 선택해도 기본 문구로 덮이지 않습니다.
- 해당 버스 관리자는 컨텐츠·난이도·공지·날짜/시간과 본인 계정의 참가 캐릭터를 수정할 수 있습니다. 8인→4인 변경도 새 조건에 맞게 편성하며 기존 등록 인원을 자동 삭제하지 않고 대기열에 보관합니다. 다른 계정의 신청 시간·반복 설정과 숙제 기록은 유지합니다.
- 접속 중 참가자에게 공지·일정·컨텐츠·정원·참가 설정 변경을 알리고, 알림을 누르면 해당 버스로 이동합니다.
- 지금 참가 가능한 서로 다른4/8계정이 준비되면 해당 버스 관리자에게만 `길드버스 출발 가능합니다!`를 알립니다. 같은 계정의 여러 캐릭터는 하나로 세며 신청 시간·완료 여부·반복 참여 설정을 반영합니다. 자동 출발은 아닙니다.
- 길드버스는 가까운 예정일과 빠른 시작 시간 순으로 표시됩니다. 파티 가입·버스 생성/가입에서 캐릭터 닉네임을 누르면 저장된 레이드/어비스 완료 상태를 확인할 수 있습니다. 참가 선택과 상태 열람은 별개입니다.

### 적용 범위·주의사항

- 이번 공식 push는 위 생텀 길드버스 묶음만 포함합니다. IRIS 후속·물물교환 즐겨찾기 연동·개인 메모/무관한 삭제는 로컬에 보존합니다. 즐겨찾기 새 테이블 준비 SQL은 적용하지 않습니다.
- 기존 신청/숙제 기록을 보호하고 동시 수정은 충돌로 안내합니다. 공지가 이미 기본값으로 저장된 버스는 원문 복원이 불가능하므로 관리자가 다시 적어 주세요.
- 알림은 시낙시스 알림 설정을 따르며 최초 접속/재연결 이전의 변경이나 이미 준비된 버스의 알림을 소급하지 않습니다. 시간 경계는 기기 캐시만 평가하므로 브라우저 절전/비활성 상태에서 늦어질 수 있습니다. 계정 소유 연결이 확인되지 않는 구형 자료는 출발 인원으로 추측하지 않습니다.
- 구조 변경: 공통 버스 수정 모달·설정 snapshot/CAS 서버 검증·참가 소유 제한·캐시 기반 변경/출발 전이·카드 링크·공통 완료 상태 열람. 기존 parties Realtime은 앞선 한설 승인으로 활성화된 상태이며 이번 배포에서 DB 설정·권한·RLS를 추가 변경하지 않습니다. 회차 완료의 다중 행 쓰기는 기존 비트랜잭션 제한이 남습니다.
- 검증: 로컬 관련87/87·타입·새 lib lint·diff 통과. IRIS 후속을 제외한 공식 staged 후보 전체 Node384통과/0실패/기존 브라우저 런타임 관련3skip, 독립 TypeScript 검사 통과, 비밀 환경 파일 없는 webpack Production 빌드52경로 exit0. 첫 격리 실행의 Windows EACCES는 허용 환경에서 재실행해 확인했습니다. 운영 화면 확인 결과는 후속 기록하며 실제 출발 수신은 정상 운영에서 확인할 항목입니다.
- 되돌리기 기준선: v2.154 / 224eb6f816585fe083da958e63aeec6e458f4f97, Vercel GitHub 성공 배포 G953mg9hhTULweP9oTpVZfsLsPEr. Realtime/기존 데이터는 코드 롤백으로 삭제하지 않습니다. IRIS 보호 큐를 구버전으로 역변환하지 않습니다.
- 공개 케리그마 공지는 게시하지 않고 사용자용 업데이트 노트는 docs/UPDATE_POST_v2.2.md에 보관합니다. 배포 성공·운영 화면 확인 전에는 완료로 기록하지 않습니다.

### 배포 확인 — 2026-10-10 01:52 KST

- 기능 커밋 fb9150d60f66dc20f80f6f7222dcdc06f5118cd7을 origin/main에 fast-forward push했습니다. GitHub Vercel status=success, 배포 식별자 9FedV9MiUDCvv5JNsPcgP4CnDaVC. MCP의 팀 접근403으로 직접 Ready 조회는 제한됐으나 운영 /party·/character·/kerygma의 BETA v2.2와 로그인 계정/실제 데이터 로딩을 브라우저에서 확인했습니다. 확인 화면 콘솔 error/warn 없음.
- /login·/character·/kerygma·/party·/admin·/api/auth/health 읽기 응답 모두200. 로그인 신규 제출·운영진 쓰기·새 버스 생성/수정 시험은 하지 않았습니다. 기존 파티 시간 만료 안내에 연장/취소만 있어 새 모달 열람은 막혀 있으며 임의 변경하지 않았습니다. 생성/수정·상태 열람은 후보 회귀와 앞선 사용자 확인을 근거로 기록하고, 실제 출발 수신은 운영 후 확인합니다.
- 이번 배포에 추가 DB 변경·공개 공지 게시 없음. IRIS/즐겨찾기 로컬 변경과 개인 파일을 보존했습니다.

## v2.154 후속 로컬 후보 — 2026-10-09 KST / 길드버스 참가 수정·접속 중 알림

- 수정 화면의 추가·교체 목록을 생성 관리자 본인 계정 캐릭터로 제한하고 타 계정 기존 참가자/신청 시간/반복 설정을 보존한다. 개별 참가 시간 입력을 제거하며 신규 본인 캐릭터만 버스 일정으로 신청한다. 공지/컨텐츠/시간/정원 수정·기존 체크 보호/재편성은 유지한다.
- 접속 중 등록 계정의 알림함에 버스 공지·컨텐츠·일정·정원·참가 설정 변경을 표시하고 클릭하면 해당 카드로 이동한다. 별도 폴링/채널 추가 없음. 최초/재연결 baseline 이전·미접속 이벤트 재전송 없음, 시낙시스 알림 설정 off 유지.
- 구조 변경: lib/guildBusNotifications·기존 알림 hook/Navbar 계정 ID·카드 anchor·수정 API 소유 범위. 한설 별도 승인으로 운영 parties publication만 활성화했다. 데이터/테이블 구조/RLS/권한/identity 변경 없음. SQL·복구 기록은 schema/HANDOFF 및 supabase/sql/parties_realtime.sql 참조.
- 관련 Node62/브라우저5·타입/새파일lint/diff 및 실제 공개클라이언트 SELECT/Reatime SUBSCRIBED 확인. 운영 데이터 시험 쓰기 없음. 실제2계정 수신·배포는 대기. 공유파일 기존 lint 오류·IRIS 별도 집계 실패·레거시 시간 안내 Minor 보류. 버전/commit/push/Vercel/공개공지 없음. 직전 공식 정상 배포 기준선은 기존 기록을 유지한다.

## v2.154 후속 로컬 후보 — 2026-10-08 KST

- IRIS를 `IRIS for SANCTUM` 컴팩트 애드온 바로 정리하고, 네이티브 회색 이동 띠·오버레이 불투명도·클릭 통과 UI를 제거했다. 게임 창 오른쪽/왼쪽 붙이기, 같은 층 유지, 게임 최소화·종료 후 안전 확인을 연결했다.
- 재화 항목별 색상·굵게·기울임 강조와 계정별 로컬 복원을 추가했다. 재화 수량·조회 시각은 저장하지 않으며 생텀 DB에도 쓰지 않는다. 스탯·숙제·클래스·캐릭터 추천 기존 보호 큐는 유지한다.
- 개발 서버에서 계정 기억 목록 effect 의존성 배열 길이가 바뀌며 발생한 React 경고를 고정된 ID·닉네임·역할 의존성으로 수정했다. 늦은 effect 결과는 언마운트 시 반영하지 않는다.
- 구조 변경: 새 Windows 창 정책/추적기와 고정 브리지 메서드, IRIS 설정 화면·영문 테마 선택. Supabase 테이블·RLS·권한 변경 없음. RAM companion은 IRIS 구성에서 제외한다.
- 자동 검증: 전체 Node 테스트·TypeScript 검사·수정 대상 ESLint·네이티브 창 정책/브리지/WebView 합성 통과. 브라우저 회귀는 Playwright 런타임 경로가 현재 호스트에 없어 합성 API 범위로 기록하며, `next build --webpack`은 이 호스트의 SWC baseUrl canonicalize 접근 거부로 실행 환경 확인이 필요하다. 실제 게임 창 이동·DPI·최소화·종료·재실행 확인은 집에서 후속 진행한다.
- 공개 `생텀 업데이트` 공지와 Vercel 배포는 하지 않는다. 실게임 확인 전까지 버전 표기는 v2.154를 유지한다.

## v2.154 — IRIS 클래스 편집·저장 피드백 — 2026-10-07 21:24 KST

- 클래스 전용 탭, 계열 필터, 숫자/게이지 직접 수정. 생텀 저장값이 기본값이며 게임 자동 클래스 조회가 아니다. 숙제와 동일한15초 자동저장/지금 저장·변경 버리기, 캐릭터별 마지막 저장 확인 시각을 제공한다.
- 구조 변경: POST /api/iris/classes, 본인 소유/활성 클래스/기준값 CAS 검사와 한 키 병합, task/class 보호 대기 큐schema2 및 기존 암호문 보존 전환. DesktopClasses UI를 분리한다. DB 구조/RLS/권한 변경 없음.
- 검증: 전체 Node294/294·별도 타입·합성 클래스 탭/게이지/필터/수동 저장/포커스/4폭 및 Windows 보호저장/브리지 통과. 비밀 환경 파일 없는 분리 webpack Production 빌드51경로 exit0. 운영 배포·화면 확인은 후속 기록한다.
- 알려진 제한: 자동 스탯 저장/시낙시스 미지원, 실제 계정 클래스 저장·DPI/장시간·실충돌 확인 대기. 구버전 앱은schema2를 읽을 수 없으므로 새 앱 사용, 암호문 백업은 유지한다. 기존 웹 전체levels 저장과의 이후 덮어쓰기 위험은 별도 과제.
- 되돌리기 기준: 직전 정상v2.153 코드94637ce, Vercel 성공 배포2xTYjZq58ApFTjdvhRbgBez24ga1. 앱 보호 큐는 구버전으로 역변환하지 않는다.
- 한설 요청으로 조용히 push하며 케리그마 공개 공지는 게시하지 않는다. 비밀값/SDK/EXE/개인 프로필·무관한 공지 초안/파일 삭제 제외.

운영 확인 — 2026-10-07 14:53 KST: 코드94637ce main push, GitHub Vercel success/'Deployment has completed', 배포2xTYjZq58ApFTjdvhRbgBez24ga1 확인. 운영 핵심7화면·auth health200, IRIS 두 조회401, 실제 브라우저 /iris/desktop 전용 앱 안내/편집 차단 유지. 운영 JS에 새 인증 거절 안내 포함 확인. Vercel 대시보드는 로그인 필요하여 Ready 표기를 직접 읽지는 않았으며 배포 성공 신호와 운영 응답으로 확인했다. 운영 실로그인/숙제 쓰기는 이번 배포 후 자동 실행하지 않았다. 본 후속은 검증 기록만, 구조 변경 없음·v2.153 유지·공개 공지/DB 변경 없음.

## v2.153 유지 — IRIS 후속 보완 — 2026-10-07 14:50 KST

- 한설 요청으로 버전 유지. IRIS 한글 접속 코드 입력을 기존 SecretCodeInput으로 통일, 로그인 거절/만료와 연결 오류 안내 구분, Windows 트레이 한글 인코딩 수정.
- PC별 명시 설정으로 램누수정리v2 함께 시작: 기본 꺼짐·기존 프로세스 재사용·실패 비차단·IRIS 종료 시 외부 도구 유지. EXE/SDK/개인 설정/프로필 및 무관한 모집 이미지 미포함.
- 사용자 확인: 실제 로그인·쌍월 숙제 웹 연동·재실행 후 로그인/선택/체크 유지·숨김/복원·클릭 통과·트레이 입력 복구·한글 메뉴 정상.
- 최종 검증: Node269/269, 별도 타입, Windows host/store/bridge/lifecycle/shared-lock/RAM9/overlay-support41/checkboard8/실제 합성 WebView 통과. 환경 파일 없는 분리 Production 빌드 exit0/static50. 합성 충돌/네트워크 실패·큐 복구 검증을 실제 계정 실검증으로 확대하지 않는다.
- 남은 제한: 실자동저장 시간·실충돌/네트워크/미저장 큐 복구·DPI/다중 화면·장시간·테마 재실행 기억. native overlay fixture는 실앱 단축키 점유로 미완료, 사용자 실단축키 검증은 통과. 스탯 자동DB/시낙시스/게임 자동작업 미지원 유지.
- 구조 변경: ram-companion/configure/tests 및 desktop/overlay 트레이 연결, SecretCodeInput 선택 props/DesktopLogin 재사용, transport 인증 안내. DB 구조/RLS/권한 변경·공개 공지 없음.
- 직전 정상 기준선:25ee771(v2.153), Vercel EmrkhKQZaxeJWpXv17R2e1aXG9N8(GitHub success), 이전 기능 배포 dpl_54HeX3xKBDPYjGDgDR5Gefnxew5p. 새 배포/운영 확인은 후속 기록.

운영 확인 — 2026-10-06 18:53 KST: v2.153 코드 a99481f main push, Vercel dpl_54HeX3xKBDPYjGDgDR5Gefnxew5p READY/production 및 운영 도메인 연결 확인. 새 비로그인 실제 브라우저에서 /·/login·/character·/party·/kerygma·/admin·/iris/desktop HTTP200, desktop 전용 앱 안내/전역 메뉴 숨김, pageerror0 확인. GET /api/iris/characters와 /api/iris/kronos는401로 차단되고 운영 홈 v2.153 표시를 확인했다. 로그인 입력·실운영 숙제 쓰기·게임 조작·DB 구조/RLS/권한·공개 공지는 하지 않았다. 게임 위 새 후보/DPI/계정 전환·실저장 시간은 수동 대기. 이 후속 push는 검증 문서만 추가, 구조 변경 없음.

## v2.153 IRIS 컴팩트 센터·숙제 저장 후보 — 2026-10-06 18:47 KST

배포 전 검증 — 2026-10-06 KST: 현재 후보 전체 Node260/260 fail0, 별도 TypeScript exit0, 합성 브라우저72폭/글자/테마 조합 및 체크/저장/종료 모달/로그인 입력 유지 통과. Windows 자식 WebView 실제 합성 클릭 전달·핸들/단축키 복구·로그인 보호·암호화 큐·epoch 거절·공유 실행 잠금 통과. 환경 파일 미복사·가짜 공개 설정의 분리 Production 빌드 exit0. staged diff와 바이너리/프로필/비밀 패턴 제외 확인. 실게임 입력/저장 시간·DPI는 여전히 수동 대기다.

- 한설 요청으로 IRIS 누적 후보를 포함해 조용히 push한다. 케리그마 공지/업데이트 글 게시 없음. 실제 게임 위 최종 수동 검증은 미완료이며 기본 구형 실행기를 자동 교체하지 않는다.
- 생텀 계정 로그인/계정 전환·본인 캐릭터 선택, 캐릭터별15초 자동저장·지금 저장·미저장 변경 보호 보관, 좁은 둥근 센터·1열 아코디언·남은 숙제 필터·이름별 저장 요약을 추가한다.
- 선택 Windows 실행기는 항상 위·내용 높이 조정·드래그·CtrlAltI/O·클릭 통과/입력 복구·50~100% 불투명도를 제공한다. 단축키 충돌 시 통과를 차단한다. 공식 SDK 고정 버전은 프로젝트 로컬이며 바이너리/프로필/테스트 자료는 Git에서 제외한다.
- 구조 변경: /iris/desktop 및 Desktop* UI/보호 큐/브리지/네이티브 실행기, /api/iris/kronos 본인 소유·기간·기준값 조건부 숙제 저장, 캐릭터 조회 ID와 캐시 차단, 공통 크로노스 목록 투영. DB 구조/RLS/권한 변경과 운영 데이터 직접 쓰기 없음.
- 미지원: 공식 커넥터에 확실한 현재 캐릭터 신원·전체 캐릭터/길드공헌도 조회 계약이 없어 자동 스탯 DB 갱신은 비활성. 시낙시스는 미지원 안내. 게임 자동 조작/보상 수령은 이 배포의 완료 기능이 아니다.
- 검증: 전체 회귀·별도 타입·합성 UI/네이티브 검사를 다시 실행한 결과와 배포 확인은 후속 기록으로 남긴다. 독립 리뷰의 작은 창 종료 모달 잘림을 재현·수정했고 합성 로그인 입력 유지 게이트를 보완했다. 실제 게임 전체화면·DPI·다중 모니터·저장 시간은 수동 대기다.
- 알려진 경미 사항: 수동 저장/버리기는 현재 선택 캐릭터 범위이나 요약은 계정 전체다. 테마 선택의 재실행 기억과 복구 행 캐릭터명 표기는 후속이다. 기존 다른 화면 ESLint 미해결 사항은 그대로다.
- 직전 정상 기준선: v2.152 cfa0bc7, Vercel dpl_74MV3teDdw3GeFNiw2jPsjU3xuy7 READY/production. 실패 시 이 배포로 안전한 되돌리기를 제안하며 DB 마이그레이션은 없다.

운영 확인 — 2026-10-05 21:01 KST: v2.152 코드 4d43fd9를 main에 push하고 Vercel dpl_FSt8AvKkjTp3UXyJgnCKmGzbKRsM READY/production 및 운영 도메인 연결을 확인했다. 운영 로그인된 브라우저에서 공지14→목록(/kerygma)→같은14 재열기, 읽은14 알림 숨김, 분야별 설정 5개, 케리그마 끄기 시 빈 목록·숫자 숨김/다시 켜기 시 복원을 확인했다. 설정은 전부 켜짐으로 복원했다. 브라우저 수집 오류·경고0. /·/character·/party·/kerygma·/admin HTTP200·v2.152, /login HTTP200, 인증 헬스200/ready true. 공개 공지 게시·IRIS 배포·DB 구조/RLS/권한 변경 없음. 이 후속 push는 검증 기록만 추가하며 구조 변경 없음. 다른 분야 실제 팝업·계정 전환·전체 모바일 폭 검증은 미완료다.

## v2.152 알림 설정·케리그마 이동 수정 — 2026-10-05 20:55 KST

검증 — 2026-10-05 20:58 KST: 실제 staged 웹 후보만 임시 폴더에 추출해 자동 테스트 55/55, 별도 TypeScript 검사, Turbopack Production 빌드(static48), staged diff 검사를 통과했다. 후보에는 미커밋 IRIS 코드·문서·테스트를 포함하지 않았다. 운영 배포 확인은 다음 기록을 따른다.

- 읽은 알림을 알림함과 숫자에서 숨깁니다. 직접 공지를 열어 읽은 경우도 반영하며 기존 읽음 기록을 보존합니다.
- 알림 설정에서 케리그마·크로노스·아고라·시낙시스·로고스 수신을 개별로 켜고 끕니다. 목록·숫자·브라우저 팝업에 적용합니다. 계정별 현재 브라우저에 저장하며 가입 승인 등 운영 알림은 유지합니다.
- 공지에서 목록으로 돌아온 뒤 같은 글이 열리지 않거나 메뉴 재진입 시 이전 글이 남던 URL·화면 불일치를 수정합니다.
- 구조 변경: notificationPolicy 도우미, 알림 훅·상단 알림 설정 UI, 공지 열림 이벤트와 동기적인 브라우저 이력 갱신. DB 구조·RLS·권한 변경 없음.
- 한설 요청으로 조용히 웹 변경만 배포합니다. IRIS 변경과 공개 공지·업데이트 글 게시는 제외합니다. 기존 미커밋 IRIS 변경과 미확인 릴레이 기록은 보존합니다.
- 로컬: 회귀 테스트 RED→GREEN, 전체 194/194·타입 검사·빌드 통과, 실제 브라우저 공지 재열기·메뉴 복귀·읽음 숨김·설정 토글 확인 및 한설 확인 완료. 배포 후보의 독립 검증과 운영 확인 결과는 후속 기록에 남깁니다.
- 알려진 제한: 설정은 기기 간 동기화되지 않습니다. 실제 다른 분야 팝업·계정 전환·모바일 전체 폭 검증은 별도 대상입니다. 케리그마 기존 ESLint 오류 12개/경고 4개와 알림 훅 기존 오류 1개는 남아 있습니다.
- 직전 정상 기준선: v2.151 e17eb92, Vercel dpl_75bxSt92bsbZuNvCXDhwiqXsTQfD READY/production.

운영 확인 — 2026-10-05 18:23 KST: 코드 9ff2414 main push, Vercel dpl_EaPngNa9nqNzJLUCCjcUiGMmMbFT READY/production 확인. 운영 /·/character·/party·/kerygma·/admin HTTP200 및 HTML v2.151, /login HTTP200, 인증 헬스200/ready true. 기존 로그인된 운영 크로노스에서 캐릭터 정보·월요일 검은 구멍 최대8·3목록 패널색 마스크를 읽기 확인했고 물물교환 더보기9→14개 펼침을 확인했다. 브라우저 수집 오류 로그0. 체크/저장 등 운영 데이터 쓰기·실제06시 시간 전환 테스트는 하지 않았다. docs/UPDATE_POST_v2.151.md는 공개 안내 초안이며 공지 게시 없음. 이 후속 기록 push는 문서만 변경하며 구조 변경 없음.

검증 — 2026-10-05 18:18 KST: 웹 커밋 후보만 별도 폴더로 추출해 node --test 58/58, 별도 TypeScript, 관련 ESLint, 기본 Turbopack Production 빌드(static48), staged diff 검사를 통과했다. 자정 방식으로 되돌린 회귀3건은 모두 실패, 수정 복원 후3/3 통과. 더보기 합성 화면의 밝은/어두운 캡처 및 6테마 배경 계산 확인. 임시 의존성 junction의 첫 빌드 실패는 실제 파일 복사 후 해소했다. 실제 최신 정상 롤백 배포는 a8f7d78 / dpl_89vTuY8joQuZ1jJBsxHnDurb789s(READY/production)다. 운영 로그인 조작/실제06시 경계·공지 게시는 이 검증에 포함되지 않는다.

## v2.151 크로노스 날짜 경계·더보기 수정 — 2026-10-05 18:15 KST

- 검은 구멍 최대 횟수가 월요일 자정에 14회에서 8회로 일찍 내려가던 문제를 수정합니다. 한국 시간 매일 06시에 하루가 바뀌며, 월요일 06시 8회부터 하루 한 회씩 늘어나 일요일 14회가 됩니다.
- 크로노스 초기화 안내도 같은 한국 시간 06시 날짜·요일을 사용합니다.
- 물물교환·상점 구매·임무 게시판의 더보기 문양 뒤 검은 얼룩을 화면 테마의 패널색으로 바꿨습니다.

이용 안내: 배포 후 열어 둔 화면을 새로고침해 주세요. 기존 완료 기록을 삭제하거나 보정하지 않습니다. 장시간 열린 화면의 06시 자동 갱신이나 과거 기록 복구를 추가한 업데이트는 아닙니다.

구조 변경: 기존 lib/kronos.ts 날짜 도우미와 캐릭터 화면 날짜 판정, 더보기 CSS만 변경. DB 구조·RLS·권한·운영 데이터 직접 변경 없음. 직전 정상 기준선 v2.15 코드 1b1b401, 문서 a8f7d78, Vercel Production/Ready CrGH4wg7wJeAfadsg5UJUnLiMFeR. 배포 전 검증과 실제 운영 확인 결과는 아래 후속 기록을 따른다. 로그인 후 조작과 실제 06시 경계 확인은 별도 수동 확인 대상이다.

이 문서는 **GitHub에 push한 공식 버전**만 기록한다. 시간은 한국 표준시(KST, Asia/Seoul)로 적는다.

## v2.15 시낙시스·크로노스 안정화 — 2026-10-02 21:36 KST

성역 여러분이 알려 주신 불편함을 모아, 파티를 준비하고 기록을 남기는 흐름을 다듬었습니다. 기다려 주시고 꼼꼼하게 알려 주셔서 감사합니다.

- 홈 미리보기와 시낙시스가 같은 클래스·역할 설정과 길드버스 반복/탈퇴 동작을 사용합니다. 현재 관리자 설정을 우선하며 서포터는 음유시인만 해당합니다. 탈퇴와 반복 변경은 실제 선택한 본인 캐릭터를 대상으로 처리합니다.
- 길드버스 첫 구성·재구성·다음 회차에 4인/8인 정원에 맞는 전투력 등급 분배와 대기 순서를 적용합니다. 같은 계정에서 여러 캐릭터가 동시에 출전하지 않으며, 참가 시간과 완료 상태도 반영합니다.
- 콘텐츠 선택은 등록된 콘텐츠별 난이도와 정원을 사용합니다. 레이드에 어비스의 미등록 난이도가 섞여 보이던 문제를 수정합니다.
- 파티 완료와 크로노스 저장에서 기존 다른 완료 기록을 보존하고, 항목별 체크 해제와 연속 저장의 충돌을 방어합니다. 이미 실제로 유실된 과거 기록을 자동 복구하는 작업은 아닙니다.
- 길드버스 출전자 카드를 두 줄로 정리했습니다. 위에는 클래스·역할·전투력, 아래에는 이름을 표시합니다. 전체 이름이 들어갈 때는 전체 닉네임, 좁을 때는 저장 애칭(없으면 앞 3자)을 사용합니다. 컨트롤러 버튼은 통째로 다음 줄로 넘어가며 목록 제목·참여 캐릭터 칩도 카드 밖으로 넘치지 않게 했습니다.

이용 안내: 배포 후 열어 둔 화면을 한 번 새로고침해 주세요. 과거 완료 기록이 이미 사라졌거나 조작 후 표시가 맞지 않는 경우 운영진에게 화면과 상황을 알려 주세요.

구조 변경: 공통 파티 카탈로그·길드버스 액션, 항목별 크로노스 병합/직렬 저장, 카드 컨테이너 쿼리 및 이름 측정 컴포넌트. 신규 DB 객체·SQL·RLS·운영 데이터 직접 보정 없음. 직전 운영 기준선은 v2.14 `c7f1aa3`, Vercel 성공 배포 `Bnd9QDJMH3E7svwn8GX4piwExFrR`입니다. 검증 및 실제 배포·공지 게시 결과는 아래 후속 기록에 남깁니다. 운영에서 실제 파티 완료/반복/탈퇴 저장, 과거 기록 복구, 여러 행 회차 저장의 부분 성공 위험과 새 카드 전체 폭/글자 설정 행렬은 추가 확인 대상입니다. 전체 ESLint에는 기존 오류가 남아 있어 전체 통과로 표기하지 않습니다.

배포 전 재검증: `node --test` 55/55, 별도 `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. 한설이 로컬 카드 표시를 확인했습니다. 운영 게시용 길드마스터 세션과 기존 운영 시낙시스 로딩은 확인했으며 새 버전 배포 결과는 push 후 확인합니다.

운영 배포 확인 — 2026-10-02 21:44 KST: `1b1b401` main push, GitHub Vercel 배포 상태 success(`CrGH4wg7wJeAfadsg5UJUnLiMFeR`) 확인. 운영 홈·파티·캐릭터·케리그마·관리자 응답 HTML의 v2.15와 핵심 경로 HTTP 200, 인증 헬스 200/ready true를 확인했습니다. Vercel 대시보드는 로그인 필요로 Ready 라벨을 직접 읽지 못했습니다. 브라우저의 기존 계정 표시는 오래된 클라이언트 정보였고 서버 확인 후 세션 만료로 로그인 화면에 이동했습니다. 로그인된 새 화면 확인과 공지 게시는 한설의 길드마스터 재로그인 대기이며, 공지 초안은 `docs/UPDATE_POST_v2.15.md`입니다. 게시 완료로 간주하지 않습니다.

21:46 KST 후속 확인: 한설이 Vercel에 로그인한 뒤 대시보드에서 해당 커밋의 `Ready`·`Production` 및 현재 운영 도메인을 직접 확인했습니다. 생텀 서버 세션 재로그인과 실제 공지 게시 확인은 이어서 진행합니다.

21:51 KST 운영·게시 완료: 한설이 생텀에 재로그인한 실제 운영 탭에서 BETA v2.15, 홈 크로노스 기존 완료 표시와 시낙시스 정상 빈 상태를 확인했습니다. 운영 콘텐츠 선택에서 카브락 입문/어려움·8인, 에이렐 및 화이트 서큐버스 어려움/매우 어려움·4인만 표시되는 것을 확인했습니다. 신청/체크/파티 완료 테스트 쓰기는 하지 않았습니다. `생텀 업데이트`에 동일 제목 미게시를 확인한 뒤 정상 작성 화면으로 1회 게시했습니다. 글 ID 13·제목 `SANCTUM BETA v2.15 업데이트 안내`·작성자 `SANCTUM 시스템`·전체 본문 표시를 확인했습니다. 링크: https://sanctum-tawny-three.vercel.app/kerygma?id=13 . 읽기 확인 중 브라우저 오류 로그 없음. 이 후속 확인 기록과 게시본 보관 push는 문서만 바꾸며 구조 변경 없음. 실제 회차/저장 검증 및 과거 손실 복구 제한은 위 기록대로 유지합니다.

## v2.14 유지 — 크로노스 캐릭터 선택 표시 보완 — 2026-09-29 20:37 KST

- 크로노스 캐릭터 선택 목록에서 모바일 닉네임을 앞 3글자로 자르지 않고 전체 이름을 읽을 수 있게 했습니다. 기존 캐릭터 전환·등록 기능은 유지합니다.
- 기존 SANCTUM 공개 메뉴와 데이터 저장 규칙은 바꾸지 않았습니다. 이번 작업으로 길드원이 새로 해야 할 일은 없습니다. 알려진 제한: 긴 닉네임의 실제 모바일 폭별 표시와 기존 크로노스 동작은 운영 로그인 후 확인이 필요합니다.

구조 변경: 캐릭터 선택 목록을 공용 표시 컴포넌트로 분리했습니다. DB 테이블·RLS·권한·운영 데이터 직접 변경 없음. 직전 정상 기준선 v2.14 `6b3948c`. 합친 코드의 TypeScript 검사·Production 빌드·로컬 읽기 테스트 4건 통과. 운영 배포 결과는 push 뒤 확인합니다. 한설 요청에 따라 버전 표기는 `v2.14`를 유지하고 케리그마 업데이트 공지는 게시하지 않습니다.

운영 1차 확인: `527c134` main push 뒤 홈·로그인·캐릭터·케리그마·파티·관리자 공개 경로와 인증 헬스가 HTTP 200으로 응답했습니다. Vercel 대시보드 권한 부족으로 Ready 표시는 확인하지 못했고, 로그인 후 실제 조작도 미검증입니다. 이 확인 기록만 더하는 후속 문서 push에는 코드·DB·구조 변경이 없습니다.

## v2.14 크로노스 카드·교환 초기화 개선 — 2026-09-28 14:43 KST

- 물물교환·상점 구매·임무 게시판의 기본 목록을 3줄로 줄이고, 날개 문양의 가는 `더보기`를 누를 때마다 3줄씩 펼칩니다. 화면 폭에 따른 카드 열 수를 기준으로 줄을 셉니다.
- 세 목록의 카드 제목·내용·횟수 조작 영역을 정리했습니다. 완료 시 별도 배지 대신 초록 테두리와 수량 색으로 알려 주며, 물물교환에도 MAX/MIN 조작을 추가했습니다. 긴 품목명과 마을명은 좁은 카드에서도 읽을 수 있게 배치합니다.
- 물물교환 횟수는 한국 시간 일간 매일 06시, 주간 월요일 06시를 기준으로 판정합니다. 예전 형식의 횟수는 현재 완료로 추정하지 않되 원본 기록은 다른 설정 저장으로 지우지 않습니다. 변경한 품목에만 새 기간을 기록하고 계정당 교환은 다른 캐릭터에도 같은 기간을 전달합니다.

구조 변경: `ProgressiveGrid`의 3줄 노출·SVG 디바이더와 물물교환 품목별 `period_version: 2`/`period_start` 저장 규칙. DB 테이블·RLS·권한·운영 데이터 직접 변경 없음. 직전 정상 기준선 v2.13 `6e76476`(코드 `d9e6fe9`). 검증: `npx tsc --noEmit`, `npm run build` 통과. 로그인한 실제 화면·Vercel Ready·일/주간 06시 경계의 실시간 전환은 배포 후 추가 확인이 필요합니다.

운영 1차 확인: `be5d1c2` push 뒤 실제 운영 `/character` HTTP 200과 HTML의 `BETA v2.14`, 새 `/svgs/logo/더보기.svg` HTTP 200을 확인했습니다. `/`, `/login`, `/kerygma`, `/party`, `/admin`, `/api/auth/health`도 HTTP 200입니다. 이는 새 배포가 운영에 제공되는 확인이며 Vercel 대시보드의 Ready 표시를 직접 읽은 것은 아닙니다. 로그인 후 3줄 카드·더보기·완료 조작·계정당 교환 동기화와 06시 경계는 확인 전입니다. 이 운영 기록을 더하는 후속 문서 push에는 코드·DB·구조 변경이 없습니다.

## v2.13 공지 읽음·크로노스 목록 개선 — 2026-09-28 11:02 KST

- 케리그마의 `읽은 길드원 목록`을 브라우저별 임시 기록 대신 계정별 서버 기록으로 전환했습니다. 새로운 읽음부터 기기 간 공유되며, 과거 로컬 기록은 소급 합치지 않습니다.
- 긴급 배너가 켜지거나 화면을 옮겼을 때 고정 메뉴가 본문 첫 부분을 가리지 않도록 헤더 높이와 스크롤 위치를 다시 맞췄습니다.
- 크로노스 캐릭터 관리에서 바뀐 항목만 저장하고 `저장 중` 상태를 즉시 보여 줍니다. 중복 저장과 닫기·다시 열기 중 상태 엇갈림도 방어했습니다.
- 물물교환·상점 구매·임무 게시판은 즐겨찾기 우선으로 화면 폭에 맞는 첫 6줄만 보이고, `더보기`를 누를 때마다 6줄씩 추가합니다. 기능 선택 아래의 불필요한 안내 문장은 제거했습니다.
- 상점 구매에 5개 마을과 두갈드아일의 주간 골드 품목 127개를 추가했습니다. 기존 앨빈 사포 1건은 중복 등록하지 않아 총 128개입니다. 사포·도면의 구매 조건도 카드에 표시합니다.

구조 변경: 비공개 `notice_reads` 테이블과 `/api/notices/reads` 경로가 추가됐습니다. 한설이 운영 DB에 읽음 테이블 SQL을 적용하고 RLS·접근 권한의 읽기 전용 검증을 완료했습니다. 상점 SQL은 기존 행·구매 진행·즐겨찾기를 수정하지 않는 데이터 추가이며, 최근 백업 `2026-09-27 23:13:52 UTC` 확인 후 한설이 운영 적용했습니다. 사전 1행(앨빈 사포 1), 사후 128행(앨빈 사포 1·중복 0), RLS 활성·익명 SELECT/INSERT 차단을 읽기 전용으로 검증했습니다. 상점 테이블 구조·정책은 변경하지 않았고 기존 공지·계정·캐릭터 기록은 삭제하지 않았습니다. 직전 정상 기준선 v2.12 `d7c3681`; Vercel 직전 운영 배포 `50dd039`. 검증: TypeScript, 신규 크로노스 컴포넌트 ESLint, Production 빌드, SQL JSON 품목 128개 확인. `app/character/page.tsx` 전체 ESLint의 기존 `any` 등 오류는 남아 있습니다. Vercel Ready·운영 실화면은 배포 뒤 별도 확인이 필요합니다.

운영 1차 확인: `d9e6fe9` push 뒤 운영 `/character` HTTP 200과 HTML의 `BETA v2.13`, `/api/auth/health` 200 `ready:true`를 확인했습니다. `/login`, `/kerygma`, `/party`, `/admin`은 모두 HTTP 200이고, 비로그인 `/api/notices/reads?id=1`은 401로 차단됩니다. 로그인 후 상점 카드/6줄 더보기, 공지 읽음의 다른 기기 반영, 캐릭터 저장, Vercel 대시보드 Ready 표시는 아직 확인 전입니다. 이 운영 확인 기록만 추가하는 후속 문서 push에는 코드·구조·DB 변경이 없습니다.

## v2.12 아고라 표시·개인 설정 개선 — 2026-09-28 00:19 KST

- 아스트라의 지난 파티가 계속 `파티중`으로 보이던 문제를 수정했습니다. 파티 날짜와 종료 시각을 확인해 예정/진행 중인 파티만 표시합니다.
- 추방되어 승인 계정이 없는 캐릭터는 아스트라, 판테온, 홈 길드원·순위 요약 및 판테온 순위 알림에서 제외합니다. 기존 캐릭터·파티 레코드는 삭제하지 않았습니다.
- 우측 상단 계정 메뉴에 `개인 설정 · 접속 코드 변경`을 추가했습니다. 현재 코드를 확인하고 새 코드로 바꾸면 모든 기기의 기존 세션을 종료합니다. 새 코드로 다시 로그인해야 합니다.

구조 변경: `/account/settings`, `/api/auth/change-code`, 승인 계정 캐릭터 필터와 현재 파티 시간 판정 도우미를 추가했습니다. DB 스키마·정책 변경 없음. 알려진 사항: 추방 계정의 기존 캐릭터/파티 레코드는 DB에 남아 있으며, 삭제 범위와 복구 계획은 별도 승인 후 정해야 합니다. 실제 운영 계정의 접속 코드 변경은 무인 테스트하지 않았습니다. 직전 정상 기준선 v2.11 `9499d68`. 검증: 로컬 아스트라에서 추방 테스트 계정 미노출 및 지난 파티 배지 제거, 개인 설정 화면 로딩, 합성 날짜 경계 검사, `npm run build`, `npx tsc --noEmit`, 새 파일 ESLint, 비로그인 변경 요청 401, `git diff --check` 통과. 기존 알림 훅의 린트 오류 2건은 이번 수정 범위 밖의 기존 `setState` effect 경고다. 배포 결과는 아래 후속 검증 기록을 따른다.

운영 확인: `50dd039` push 뒤 실제 운영 홈에서 `BETA v2.12`, `/account/settings` HTTP 200 및 로그인 계정의 입력 화면을 확인했다. 운영 아스트라에서 SOL 14 계정·LUNA 53 캐릭터로 승인 계정만 보였고, 제보된 지난 파티 참여자의 `파티중` 배지는 사라졌다. Vercel 대시보드의 Ready 표시는 별도로 읽지 못했으나 운영 경로에 새 코드가 제공되는 것은 확인했다. 운영 접속 코드의 실제 변경은 보안상 시행하지 않았다. 이 운영 확인 기록만 추가하는 후속 문서 push에는 구조·코드 변경이 없다.

## v2.11 케리그마 공지 화면 개선 — 2026-09-27 23:42 KST

안녕하세요, 성역 길드원 여러분. 베타 오픈 이후 보내주신 화면 의견을 반영해 케리그마 공지 목록을 더 편하게 볼 수 있도록 다듬었습니다.

- 태블릿 크기의 케리그마 분류 탭을 가로 스크롤 없이 한 줄에서 볼 수 있게 했습니다. 운영진 전용 `새 공지 작성` 버튼은 탭 아래로 옮겼습니다.
- 케리그마 소개가 잘리는 화면 폭에서는 `(i)` 버튼으로 전체 설명을 열어 볼 수 있습니다.
- 길드마스터가 새 `생텀 업데이트` 공지를 올리면 작성자가 `SANCTUM 시스템`으로 표시됩니다. 같은 제목의 업데이트 글은 중복 등록되지 않습니다.

기존 공지·DB 구조는 변경하지 않았습니다. 직전 정상 기준선은 v2.1 `e5ac849`입니다. 검증: TypeScript·Production 빌드·차이 검사 통과. 운영 화면과 게시물 확인 결과는 배포 뒤 기록합니다. 문의나 불편한 점은 언제든 운영진에게 알려주세요. 더 편한 SANCTUM으로 보답하겠습니다.

운영 확인: `main` 커밋 `41a8fe9` 반영 뒤 운영 `/kerygma`에서 `BETA v2.11`, 7개 분류 한 줄 배치, 작성 버튼 분리, `(i)` 안내 열기·Escape 닫기를 확인했습니다. `생텀 업데이트` 글 `SANCTUM BETA v2.11 업데이트 안내`를 한 번 게시했고, 게시글 ID 11·작성자 `SANCTUM 시스템`·본문 표시를 확인했습니다. 게시글 링크: https://sanctum-tawny-three.vercel.app/kerygma?id=11
이 운영 확인 기록만 추가하는 후속 문서 push에는 구조·코드 변경이 없습니다.

## v2.1 전역 알림·반응형 화면·플로팅 메뉴 개선 — 2026-09-27 KST

안녕하세요, 성역 길드원 여러분. SANCTUM이 조금 더 읽기 쉽고 편하게 사용할 수 있도록 화면과 알림 흐름을 다듬었습니다. 이번 업데이트를 확인해 주세요.

- 공지와 긴급 배너가 열린 화면에서 실시간으로 반영되며, 새로고침 없이도 최대 30초 안에 갱신됩니다.
- 시낙시스 파티 카드에서 긴 닉네임·전투력·마도저항·신청 시간이 잘리지 않도록 카드 폭에 맞춰 재배치했습니다.
- 홈 판테온 순위의 수치 단위를 정리하고, 긴 탭 이름이 화면 폭에 맞춰 읽히도록 조정했습니다. 순위 변동 알림에는 이전·현재 대상이 함께 표시됩니다.
- 홈 시낙시스 요약의 신청 버튼이 실제 시낙시스 신청 모달로 연결됩니다.
- 클래스 레벨 관리에서 PC·태블릿은 직업명과 레벨을 두 줄로 표시하고, 게이지 또는 숫자 입력으로 수정할 수 있습니다. 좁은 모바일 조작은 기존 방식 그대로입니다.
- 모바일 플로팅 메뉴는 제공된 SANCTUM 로고를 전역 테마색으로 표시하며, 닫힌 상태의 하트비트·누르는 반응·열린 상태 변화를 추가했습니다.
- 중간 폭에서 브랜드 설명과 베타 버전이 어색하게 따로 남지 않도록 숨김 규칙을 정리했습니다.

기존 계정·캐릭터·파티·공지 데이터와 DB 구조는 변경하지 않았습니다. `npm run build`, `npx tsc --noEmit`, `git diff --check`를 통과했습니다. 직전 정상 기준선은 v2.022입니다. 알려진 사항: 실제 운영 화면의 모바일 메뉴와 일부 실시간 알림은 배포 후 한설의 최종 확인이 필요합니다.

## v2.022 케리그마 가이드 링크 핫픽스 — 2026-09-26 KST

- `생텀 가이드` 링크형 공지의 저장된 URL을 상세 화면에서 실제 새 탭 링크로 표시한다. HTTPS/http 외 값은 링크로 실행하지 않는다.
- 목록으로 돌아오거나 링크 없이 목록을 새로 열면 선택 카테고리를 `전체`로 초기화해 생텀 가이드가 계속 선택된 것처럼 보이지 않게 했다.
- 버전 표시는 요청대로 변경하지 않았다. DB·기존 공지·권한 변경 없음. `npm run build`, `npx tsc --noEmit`, `git diff --check` 통과.

## v2.022 시낙시스 길드 버스 권한 수정 — 2026-09-25 23:10 KST

- 부마스터가 길드 버스 생성 모달을 열 수 있지만 제출 시 클라이언트의 잘못된 관리자 판정으로 거부되던 문제를 수정했다. 길드마스터·부마스터·부마스터 대행 역할을 기존 서버 권한과 동일하게 판단한다.
- 로그인 정보가 없거나 손상된 경우 관리자 UI 권한을 주지 않는다. 서버 권한·DB 구조·기존 파티 데이터는 바꾸지 않는다.
- `npm run build`, `npx tsc --noEmit` 통과. 실제 부마스터 계정의 운영 생성은 배포 후 한설 확인이 필요하다. 직전 정상 기준선 v2.021 `ac23a7d`.

## v2.021 로고 버전 정렬 — 2026-09-25 10:54 KST

- 한설의 화면 확인 후 로고 아래에 혼자 있던 버전 문구를 오른쪽 `SANCTUM / 성역 길드 전용 플랫폼 / BETA v2.021` 3줄 묶음으로 옮겼다. 좁은 중간 폭에서는 기존 메뉴 공간을 지키도록 간결한 버전 표기만 유지한다.
- DB·API·권한·기존 데이터 변경 없음. `npm run build`와 빌드 완료 후 `npx tsc --noEmit` 통과. 직전 정상 기준선 v2.02 `e693609`; 운영 화면은 배포 후 확인한다.

## v2.02 베타 메뉴 안내 — 2026-09-25 10:37 KST

- 한설의 운영 화면에서 홈 상단의 v2.01 배지가 보이지 않았다. 버전을 홈 본문에서 모든 페이지의 로고 바로 아래로 옮겨 `BETA v2.02`를 표시한다.
- 엠포리온·그노시스는 PC 상단 메뉴와 모바일 바텀 메뉴에서 `[준비중]`으로 덮어 표시하고 링크를 제거했다. 기존 페이지와 직접 URL 접근은 유지한다.
- DB·권한·기존 데이터 변경 없음. 로컬 Production 빌드 HTML에서 버전 문자열과 준비중 표시가 존재하고 두 메뉴의 `href`가 없음을 확인했다. `npm run build`, 타입 검사, 차이 검사 통과. 직전 정상 기준선은 v2.01 `5aac341`; 운영 Ready·실화면 확인은 push 후 별도 기록한다.

## v2.01 베타 안내 표시 — 2026-09-25 02:39 KST

- 홈 상단에 현재 `SANCTUM BETA v2.01` 표시를 추가했다. 다음 공식 버전에서는 `lib/release.ts`의 표시값을 릴리스 노트와 함께 갱신한다.
- 엠포리온·그노시스에 개발 중임을 알리고, 시험용 가격·예시 자료를 실시간 거래 정보나 확정 공략으로 오해하지 않도록 문구를 고쳤다.
- 길드원용 기본 사용 가이드 원고는 `docs/BETA_MEMBER_GUIDE_DRAFT.md`에 준비했다. `생텀 가이드` 분류가 링크형이고 공지 작성자가 로그인 계정명으로 저장되는 구조라 운영 게시물은 **아직 게시하지 않았다**.
- DB 구조·권한·기존 데이터 변경 없음. `npm run build`, `npx tsc --noEmit`, `git diff --check` 통과. 관련 페이지 전체 ESLint는 기존 `any`·effect 규칙 위반 등 44개 오류로 실패했으며 이번 문구·배지 변경에서는 새 오류를 추가하지 않았다. 직전 정상 기준선은 v2.0 Production `717369c`다. Vercel Ready·운영 화면 확인 결과는 배포 뒤 기록한다.

## v2.0 길드원 폐쇄 베타 오픈 — 2026-09-25 02:05 KST

- 한설의 명시적 요청으로 길드원 대상 폐쇄 베타를 열기 위해, 검증된 v1.994/1.994.1 Preview 코드(`e1dfe73`)를 운영 `main`에 fast-forward한다. 가입 프로필·관리자 권한 명단, 크로노스 상점/임무/메모, 로고스 비공개 제보·건의/사진과 60일 길드마스터 검토가 포함된다. 기존 이름과 데이터는 보존한다.
- 운영 DB의 계정 프로필·크로노스·로고스 사진·60일 검토 SQL은 한설이 이미 적용하고 읽기 전용 권한/구조 진단을 확인했다. 이번 배포는 SQL을 다시 실행하거나 운영 글·사진을 삭제하지 않는다. 공개 읽기/쓰기 권한은 기존 차단 상태를 유지한다.
- Preview 실제 확인: 길드마스터와 일반/부마스터/대행 계정의 제보 격리, 가입→승인→로그인·프로필 표시, 캐릭터 숙제 저장, 기존 문의/공지/파티, 제보 글·사진·답변·새로고침 유지. v1.994.1 60일 검토는 합성 데이터로 보류/삭제·역할 차단을 검증했고, 운영 데이터의 만기 글 삭제는 시험하지 않았다.
- 알려진 제한: 사이트가 완전히 닫힌 상태의 푸시/메일 알림은 없고, Storage 사진과 DB 글의 삭제는 단일 트랜잭션이 아니다. 계정 탈퇴·추방 시 제보 익명화/사진 정리 방침은 후속 결정이 필요하다. 기능 동결 중 P0/P1만 수정한다.
- 직전 정상 기준선: v1.993 Production `db06f7e`. 운영 push 뒤 Vercel Ready와 운영 주소의 로그인·캐릭터·공지·파티·운영진·로고스 실화면 확인 전에는 초대 확대·시스템 공지를 진행하지 않는다. 문제가 나면 운영 DB에 적용된 추가 컬럼/함수를 지우지 않고 코드 롤백 가능 범위를 먼저 확인한다.
- 운영 확인 결과: 코드 포함 `main` 커밋 `08f0f78` Vercel `Deployment has completed`. 운영 `/api/auth/health`는 `ready: true`, `/login`·`/character`·`/kerygma`·`/party`·`/support`는 200, 비로그인 `/api/inquiries`는 401·`/api/inquiries/retention`은 403이었다. 한설이 운영 주소에서 로그인 후 캐릭터 숙제 저장, 공지·파티 목록, 관리자 길드원 목록, 로고스 제보 탭이 모두 정상이라고 확인했다. 길드원 대상 폐쇄 베타 초대 가능. 이 기록만 갱신하는 후속 커밋에는 앱 코드 변경이 없다. 길드원용 `SANCTUM 시스템` 공지는 아직 게시하지 않았다.

## v1.994.1 Preview 후보 — 2026-09-25 01:27 KST

- LOGOS 생텀 버그 제보·건의사항에 작성 60일 뒤 삭제 가능성을 알리는 문구를 추가했다. 자동 삭제는 하지 않는다. 만기 글은 길드마스터의 사이트 알림함과 해당 글에 검토 대상으로 표시하고, 길드마스터가 글별로 60일 보류하거나 확인 후 글·답변·첨부 사진을 삭제할 수 있다. 1:1 문의는 이 정책에서 제외한다.
- 한설이 `20260925_logos_retention_review.sql`을 운영 SQL Editor에서 실행했고, 읽기 전용 확인에서 검토일 컬럼·공개 권한 차단·비공개 사진 버킷 true, 검토일 누락 글 0을 확인했다. 이번 Git push는 DB를 추가 변경하거나 글·사진을 삭제하지 않는다. 기존 제보의 검토일은 작성일+60일이다.
- 권한: 검토 목록·보류·삭제 API는 길드마스터 세션으로 제한한다. 사진과 DB 글 삭제는 단일 트랜잭션이 아니므로 실패 시 재시도해야 할 수 있다. 사이트가 닫혀 있을 때 메일·모바일 푸시는 보내지 않는다. 계정 탈퇴/추방 시 제보 익명화·사진 정리 정책은 별도 미결정이다.
- 검증: `npx tsc --noEmit`, `npm run build`, 관련 API·화면 ESLint, 밝은/어두운 테마의 LOGOS 합성 UI 320/390/768/1280px, 합성 길드마스터 보류·삭제/일반 길드원 버튼 비노출, 비로그인 검토 API 403, `git diff --check` 통과. 운영 글 삭제는 시험하지 않았다.
- 배포 범위: `codex/v1-994-beta-preview` 브랜치 Preview만. push 후 Vercel Ready와 실제 화면 확인이 남아 있다. 직전 Preview 기준선 `546b928`; Production 기준선은 v1.993 `db06f7e`로 변경하지 않는다.

## v1.994 Preview 후보 — 2026-09-24 20:25 KST

- 로컬에서 확인한 가입 프로필(좋아하는 것·생일)과 관리자 권한 목록 표시/수정, 로그인 코드 입력 안내를 포함한다. 기존 계정의 빈 프로필은 `미등록`으로 유지한다.
- 크로노스에 서버 경유 골드 상점·마을 임무·진행률·즐겨찾기·두 칸 메모를 추가한다. 상점 MAX/MIN과 묶음 저장, 월요일 06시(한국 시간) 주간 초기화, 모바일 카드 배치를 반영한다. 관리자 물물교환·상점·임무 수정 화면도 개선한다.
- 로고스에 생텀 버그 제보·건의사항을 추가한다. 제보 사진은 브라우저에서 350KB 이하 WebP로 압축해 비공개 Storage에 최대 3장 보관하고, 길드마스터가 전체 제보를 확인·답변한다. 작성자는 자신의 글만 보고 부마스터·대행은 타인의 제보를 볼 수 없다. 메일 발송은 포함하지 않는다.
- 한설이 관련 계정 프로필·크로노스·로고스 SQL을 운영에 적용한 뒤 읽기 전용 컬럼/RLS/비공개 저장소 진단을 확인했다. 이번 push 자체가 DB 데이터를 변경하지는 않는다. 사진 보존·계정 탈퇴 시 정리 정책과 실제 역할별 제보 테스트는 미완료다.
- 검증: `npx tsc --noEmit`, `npm run build`, 관련 ESLint, 크로노스·로고스 합성 UI 테스트(320/390/768/1280px) 통과. 운영 데이터에 시험 글을 만들지 않았다. Preview 배포와 실제 계정 확인 전에는 베타 확대 완료로 보지 않는다. 직전 정상 기준선: v1.993 Production `db06f7e`.
- Preview 후속 확인: v1.994 후보 `2c0e378` Vercel 배포 완료. 한설이 로그인, 로고스 버그 제보의 사진 3장 첨부·글 작성·길드마스터 답변·새로고침 후 내용 유지를 확인했다. 새로고침 때 1:1 문의 탭으로 돌아오던 문제는 `?tab=bug|idea` 유지로 수정하고 로컬 UI 테스트·빌드를 통과했다. 일반/부마스터 계정의 타인 제보 비노출과 Production 화면은 아직 미확인이다.

## v1.993 — 2026-09-24 02:53 KST

- 크로노스의 기존 캐릭터 숙제 저장 시, 서버에서 소유자를 별도로 조회한 다음 저장하던 두 단계를 계정 소유 조건이 포함된 한 번의 수정 요청으로 줄였다. 다른 계정의 캐릭터는 수정할 수 없고, 새 캐릭터 등록 경로는 그대로 유지한다.
- v1.992 운영 배포 `69443a1`에서 한설이 두 체크의 새로고침 후 유지 여부를 확인했으나 저장 완료까지 여전히 약 3~5초가 걸렸다. 이번 최적화의 실제 속도는 운영 배포 후 다시 확인한다.
- 후속 운영 확인: v1.993 `db06f7e` Ready, 한설이 저장 약 2~3초로 개선됐음을 확인했다. 크로노스 확장 작업은 별도 미배포 후보이며 이 버전의 기능으로 포함하지 않는다.
- DB 구조·권한 변경 없음. `npx tsc --noEmit`, `npm run build`, 비로그인 저장 요청 401 확인. 직전 정상 기준선: v1.992 Production `69443a1`.

## v1.992 — 2026-09-24 02:34 KST

- 크로노스 캐릭터 관리에서 숙제 체크 하나를 저장할 때 바뀌지 않은 대표 캐릭터·기여도·계정 공통 교환 정보를 다시 쓰지 않도록 했다. 일반 체크는 캐릭터 저장 요청 하나로 끝나도록 줄였고 자동 저장 시작 대기를 800ms에서 500ms로 낮췄다.
- 영겁의 집 호스트 대화 자기 지칭을 `영겁`·`영겁이 누나`·`누나` 중 상황에 맞게 사용하도록 작업 규칙을 갱신했다. 서비스 내 `SANCTUM 시스템` 공지의 문체는 변경하지 않는다.
- DB 구조·권한 변경 없음. `npx tsc --noEmit`, `npm run build` 통과. 실제 저장 시간·새로고침 유지 여부는 운영 배포 후 확인한다. 직전 정상 기준선: v1.991 Production `0966a57`.

## v1.991 — 2026-09-24 00:55 KST

- v1.99에서 저장 상태가 실제로 표시되는 것을 한설이 확인했다. 진단용으로 넣었던 숙제 목록의 긴 상시 안내 막대는 제거했다.
- 캐릭터 관리 상세의 저장 중·완료·실패 표시는 기존처럼 잠깐 나타났다 사라지는 작은 반투명 플로팅 알림으로 유지한다. 페이지 최상위 레이어를 사용해 상단 메뉴 뒤에 숨지 않도록 한다.
- DB 구조·권한 변경 없음. `npm run build`, 빌드 완료 후 `npx tsc --noEmit` 통과. 직전 운영 기준선은 v1.99 `b118f3a`다. v1.991 `0966a57` Production Ready 뒤 한설이 작은 알림과 저장 상태 표시를 실제 화면에서 확인했다.

## v1.99 — 2026-09-24 00:49 KST

- 캐릭터 관리 상세의 저장 상태를 숙제 목록 안에 항상 표시한다. 저장 중·완료·실패에 맞춰 문구가 바뀌며, 떠 있는 알림은 페이지의 레이어 밖으로 옮겨 다른 화면 요소에 가리지 않도록 했다.
- v1.98은 Production Ready였지만 한설의 실제 화면에서 저장 표시가 보이지 않았다. 저장은 약 3~5초 기다린 뒤 새로고침하면 유지됐다. v1.99에서는 표시가 작동하는 것을 한설이 확인했으며, 상시 안내 막대는 후속 v1.991에서 제거한다.
- DB 구조·권한 변경 없음. `npx tsc --noEmit`, `npm run build` 통과. 직전 운영 기준선은 v1.98 Production `3a2318a`다.

## v1.98 — 2026-09-24 00:28 KST

- 크로노스 캐릭터 관리 상세 화면의 자동 저장 알림을 화면 아래 중앙으로 옮겼다. 기존 알림은 상단 고정 메뉴 뒤에 가려졌으며, 이제 모바일 플로팅 메뉴보다 위에서 `저장 중/완료/실패`를 볼 수 있다. 완료 표시는 2.5초 유지한다.
- 저장 완료 표시가 다음 저장 진행 중에 사라지지 않도록 이전 표시 타이머를 취소한다. DB 구조·권한 변경 없음.
- 검증: `npx tsc --noEmit`, `npm run build` 통과. Production Ready였으나 한설의 실제 화면에서 표시가 보이지 않아 v1.99를 준비했다.
- 직전 정상 기준선: v1.97 Production `0628582` Ready(한설 확인). 이 버전의 홈 저장 표시는 상세 화면과 별도이며 홈 실제 표시 여부는 아직 확인되지 않았다.

## v1.97 — 2026-09-24 00:05 KST

- 홈 크로노스 숙제 체크에 `저장 중/완료/실패` 표시를 추가했다. 저장 중 중복 클릭을 막고, 실패 시 화면 값을 되돌려 다시 시도할 수 있게 했다. 서버 저장 왕복 3~5초 자체는 추후 개선 과제다.
- 운영 DB Phase B/C/D 적용 사실을 구조도·DB 문서·인계서에 반영하고, 읽기 전용 권한 검증 SQL을 저장했다. 이 배포에서 추가 DB 구조·권한 변경은 없다.
- 검증: `npx tsc --noEmit`, `npm run build` 통과. 한설이 Production `0628582` Ready를 확인했다. 홈 저장 표시의 실제 화면 확인은 아직 남았다.
- 직전 정상 기준선: v1.96 Production `e62d138`. DB 차단 후 v1.95 이하 코드로 단독 롤백하지 않는다.

## v1.96 — 2026-09-23 23:12 KST

### 2026-09-23 베타 보안 배포 경과
- 23:34 KST: Production `e62d138` Ready. 한설이 실제 서비스에서 재로그인·관리자 계정 목록을 확인했다. 운영 DB Phase B/C/D를 순서대로 적용했고, 익명·authenticated 쓰기 가능 public 테이블 각 0개, 계정 코드·해시 및 비공개 문의 익명 읽기 불가를 읽기 전용 SQL로 확인했다. 권한 차단 후 배너 수정·공지 댓글·캐릭터 체크 저장·테스트 파티 삭제·문의/답변 조회도 확인했다.
- 홈 숙제 체크는 서버 저장 완료까지 약 3~5초 걸릴 수 있어, 후속 v1.97에 저장 중·완료·실패 표시와 저장 중 중복 조작 방어를 준비했다.
- Preview `5fa5f8a` Ready. 한설이 로그인, 캐릭터 숙제 저장, 파티 생성, 공지 작성, 문의 등록·답변, 관리자 배너 등록을 직접 확인한 뒤 Production에 반영했다.
- Preview 배너 저장 테스트에서 확인된 존재하지 않는 `bg_color` 컬럼 사용을 제거하고, 실제 DB 컬럼만 저장하도록 수정했다. 색상 선택 UI는 지원 컬럼이 마련될 때까지 숨겼다.
- 관리자 카탈로그·공지 작성/투표/댓글·실시간 제보·캐릭터·파티·문의 쓰기를 로그인 세션을 확인하는 서버 경로로 이동했다. 1:1 문의 조회도 본인/운영진 전용 서버 경로로 이동했다.
- 운영 DB 권한 차단 Phase B(`accounts`), Phase C(기존 RLS-off 18개와 직업 테이블), Phase D(캐릭터·파티·문의·활동로그·라운지)를 적용했다. 기존 데이터 삭제 없음.
- 구조 변경: `/api/admin/catalog`, `/api/notices/mutate`, `/api/reports`, `/api/member-mutations`, `/api/parties/sync-checklist`, `/api/inquiries` 및 대응 클라이언트 호출 추가.
- `npx tsc --noEmit`, `npm run build` 통과. 로그인 상태의 쓰기 경로는 Preview와 Production에서 핵심 동선을 확인했다.
- 적용 전 `accounts`, `characters`, `parties`, `inquiries`, `nexus_classes`의 `PUBLIC` 쓰기 허용 정책을 확인했다. 적용 후 테이블 권한 재검사에서 익명·authenticated 쓰기 대상 0개를 확인했다.
- 직전 정상 기준선: v1.95 Production `13a62ec` / 배포 `6604812049`. 권한 SQL 적용 후 v1.95로 코드만 되돌려서는 로그인·쓰기가 복구되지 않으므로 단독 롤백하지 않는다.

### 사용자에게 보이는 변화
- 로그인·가입 신청을 서버에서 처리하는 경로로 전환하고, 기존 계정 전환과 운영진 가입 승인 흐름을 세션에 연결했다. 기존 사용자는 배포 후 한 번 다시 로그인해야 한다.
- 관리자 권한 목록을 행형으로 정리하고 PC 글자 크기 설정·긴 닉네임·모바일 배치를 보완했다.
- 상단 메뉴와 모바일 메뉴·설정창을 다듬고, 정령 날개·테마·우편함 표시를 SVG로 정리했다.
- 홈 TECHNÈ 순위는 한 계정의 최고 생활력 캐릭터만 반영하고, AGORA 판테온의 중간 폭·모바일 카드 겹침을 수정했다.

### 수정·보안
- 운영 DB Phase A를 적용했다. 계정 13개 모두 접속 코드 해시를 보유하며 누락은 0이다. 서버 세션·가입·로그인 제한 경로가 준비됐다.
- 신규 가입의 계정과 최초 캐릭터를 한 트랜잭션으로 저장한다. 구버전 복귀를 위해 기존 `accounts.code` 값은 유지한다.
- `accounts`의 기존 공개 권한을 차단하는 Phase B와 나머지 공개 쓰기를 닫는 Phase C/D를 2026-09-23 운영 DB에 적용했다. 기존 행 삭제 없음.
- 서버 키가 활성화된 기존 `/api/sync-client`·`/api/sync-weekly`에 운영진 인증을 추가했다. Tampermonkey 동기화 스크립트 v8.3은 전송 직전 접속 코드를 물으며 파일에 저장하지 않는다. 배포 후에는 이 스크립트 갱신이 필요하다.

### 구조·운영 변경
- 새 Route Handler: `/api/auth/register`, `/api/auth/switch`, `/api/auth/health`, `/api/accounts/directory`, `/api/admin/pending`.
- 운영 DB: `sanctum_sessions`, `sanctum_login_attempts`, 로그인·가입·제한 함수와 기존 가입용 해시 동기화 트리거를 추가했다. 기존 행 삭제 없음.
- Vercel의 `SUPABASE_SERVICE_ROLE_KEY`는 Production·Preview에 저장됐다. 값은 Git에 없다.

### 검증
- `npx tsc --noEmit`, `npm run build`: 통과.
- Phase A 읽기 전용 확인: 계정 13개, 해시 누락 0, 새 테이블·함수 모두 존재.
- Preview에서 `/api/auth/health`의 `ready: true`, 한설 계정 로그인·관리자 계정 13명 목록·처음 대기 신청 0건 확인. 이어서 테스트 계정 신규 신청, 관리자 대기 1건·승인, 새 계정 로그인, 첫 캐릭터·공지·파티 읽기, 일반 길드원 관리자 접근 차단을 한설이 확인했다.
- 승인된 테스트 계정은 발급 코드 원문을 그대로 붙여넣어 새 Preview에서 로그인 성공했다. 기억으로 재입력한 코드는 불일치했으나 DB의 평문 코드·해시 일치와 승인 상태를 읽기 전용 검사로 확인해 저장·검증 오류가 아님을 구분했다.
- 로컬 무인증 동기화 POST 2개는 403. Production 실제 재로그인과 주요 쓰기 화면은 확인했다. Tampermonkey 실동기화 쓰기는 별도 검증이 남아 있다.

### 알려진 사항
- 공개 계정 읽기·수정·삭제와 다른 public 테이블의 익명 쓰기 위험은 Phase B/C/D와 권한 재검사로 해결했다. 남은 점검은 신규 가입·승인, 동기화 스크립트, 저장 왕복 지연 및 실제 테스터 피드백이다.
- 직전 정상 기준선: v1.95 커밋 `13a62ec`, Vercel Production 배포 `6604812049`.
- 운영 권한은 Phase B/C/D에서 변경했다. 테이블 행 삭제나 새 컬럼 추가는 없다. 직전 정상 배포 v1.95는 권한 차단 이후 코드만 되돌리면 로그인·쓰기가 깨질 수 있으므로 단독 롤백하지 않는다.

---

## v1.95 — 2026-09-23 11:06 KST

### 사용자에게 보이는 변화
- v1.94 배포 뒤 모든 기존 계정에서 발생한 로그인 불가 문제를 복구했다.
- 운영 DB가 현재 사용하는 닉네임·접속 코드 방식으로 다시 로그인하고 가입 신청할 수 있다.

### 수정·안정화
- 운영 DB에 아직 적용하지 않은 인증 함수와 세션 테이블을 로그인 화면이 먼저 호출하던 순서 오류를 수정했다.
- 저장된 로그인 계정이 미적용 서버 세션 검사로 자동 삭제되던 문제를 수정했다.
- CBT 전체 사용자를 막은 P0 장애로 `docs/BETA_FEEDBACK.md`에 기록했다.

### 구조·운영 변경
- 페이지·컴포넌트·API·DB 구조 변경 없음.
- 준비된 HttpOnly 서버 세션 API와 SQL 마이그레이션은 삭제하지 않았으며, 운영 DB 적용과 검증 전까지 로그인 화면에 연결하지 않는다.
- 운영 DB·RLS·환경변수 변경 없음.

### 검증
- `npm run build`: 통과
- 로컬 화면 확인: `http://localhost:3000/login` HTTP 200
- 기존 계정 로그인: 한설 확인 완료
- Vercel: Production 배포 `6604812049` 성공(`Deployment has completed`)
- 실제 배포 화면: Vercel 로그인 보호로 비로그인 자동 확인은 제한됨. 한설의 기존 계정 로그인 성공 확인을 사용자 검증으로 기록함.

### 알려진 사항
- 현재 로그인은 v1.94 이전 운영 방식으로 복구된 상태다. 서버 세션 보안 전환은 운영 DB 변경 승인과 단계별 로그인 검증 뒤 별도 배포한다.
- 직전 기준선: `v1.94` (`87af6ff`, 로그인 장애 포함). v1.95 코드 커밋 `13a62ec`을 새 정상 기준선으로 사용한다.

---

## 기록 형식

```md
## vX.Y — YYYY-MM-DD HH:mm KST

### 사용자에게 보이는 변화
- ...

### 수정·안정화
- ...

### 구조·운영 변경
- 페이지 / 컴포넌트 / API / DB / 권한 중 실제 변경된 항목

### 검증
- npm run build: 통과/실패
- 화면 확인: 확인한 경로
- Vercel: Ready/실패 및 배포 URL

### 알려진 사항
- ...
```

### 2026-10-19 17:06 KST 최종 검증
검토 보완 후 독립 tsc·GNOSIS scoped ESLint exit0, Next60/60 build exit0. 전체 Node477/474PASS3기존skip0fail, git diff --cached --check PASS. 실제 IAB에서 미저장 이동확인/계속편집 입력유지/개인저장 후 새로고침 복원을 확인했다. 관리자 기존4lint오류는 별도보류. 이 상태를 codex/gnosis-dressroom에 정상 push하며 main/운영DB/수동배포/공지/ZIP는 유지한다. 제품3D는미완료이며로컬사진/팔레트공유만구현됐다.
### 2026-10-19 17:07 KST 전송 결과
- 제품83b437af50c4ca98e0847c17cae8e8c32fac3b69를 origin/codex/gnosis-dressroom에 정상 push, ls-remote 정확 일치. 최초 원격 기능브랜치라 upstream 생성, push 전 fetch/해당원격없음 확인. 이번 후속 문서 마감까지 최신 HEAD를 받을 것.
- Git 자동 Preview dpl_33y9Lt9E7XyUhUnBuJZrdyXnXqdL READY/정확제품SHA/target null/aliasError null 확인. 수동배포·Production승격0, origin/main1d8e374 유지. 실제 Preview URL은 Vercel 로그인 보호 화면으로 이동하므로 제품 화면 확인 미완료/로컬 검증과 구분한다. 인증우회/공유링크생성/로그인설정변경0.
- https://vercel.com/sanctum-sanctuary/sanctum/33y9Lt9E7XyUhUnBuJZrdyXnXqdL . 로컬 http://127.0.0.1:3100/gnosis/dressroom 은 화면 검증 후 열어두었다.
- 마감은 구조 변경 없는 문서만 추가, 제품 버전 유지. 주간31%·5시간37% 잔여 시점이며15%까지소진하지않고3D자산부재/집통합전안전인계를우선했다. 집에서는 GNOSIS_HOME_MERGE_20261019.md 순서대로 주말작업·개인파일을 보존하며 통합 후 통합 branch/SHA를 TO_SOONWOL에 남길 것.
