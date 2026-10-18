# IRIS Floating Hub Implementation Plan

**2026-10-18 재개:** 한설 계속구현 지시. 중요2건 RED→GREEN 수정/전체회귀·빌드 통과, 개발 후보 정상 시작. Minor1·실제전체화면/키/DPI 및 기존 legacybrowser 실패는 남았다. 최신 QA 절을 따르며 전체완료로 표기하지 않는다.

**2026-10-17 실행 상태: 사용자 요청으로 중단·인계, 미완료.** 중요2/Minor1 미수정과 native실검증은 `docs/IRIS_FLOATING_SOONWOL_HANDOFF_20261017.md`를 따른다. 체크포인트4c31b54를 완료/출시로 해석하지 않는다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 네모 compact 센터를 위치가 보존되는 IRIS 플로팅 로고·Alt+백틱 호출·작은 안내/10초 알림으로 교체한다.

**Architecture:** native가 좌표·모드·단축키·입력 Region의 기준을 소유하고 버전 있는 새 floating bridge로 프런트에 전달한다. 기존 모듈을 계속 마운트한 채 표시만 바꾸며, 공통 알림 표시기가 정보 알림과 캐릭터 확인을 서로 다른 수명으로 처리한다. 심층 제보는 기존 조회/Realtime을 재사용한다.

**Tech Stack:** 현재 Windows PowerShell/.NET Framework WinForms/WebView2, Next.js/React/TypeScript/CSS, 기존 Supabase client. 새 패키지/분석 엔진 설치 없음.

**Spec:** `docs/superpowers/specs/2026-10-17-iris-floating-hub-design.md` (한설 승인).

## Global Constraints

- 실제 단축키: **Alt + 백틱 키**, Shift 불필요. 등록 modifier는 `MOD_ALT | MOD_NOREPEAT` (`0x4001`), 키는 표준 배열의 `VK_OEM_3` (`0xC0`). 사용자 표시 문구는 정확히 **`(Alt + ~)`**.
- 로고 주변 반원형 메뉴: 크로노스·시낙시스·에르곤·설정. 키캡은 로고 바로 아래 가운데, 첨부 Ctrl+Z처럼 짙은 회색 반투명 바탕/밝은 얇은 테두리/흰 글자. 약200ms 펼침, reduced-motion에서 이동/확대 생략.
- 일반 정보 알림은 표시 시점부터 **10,000ms**. 캐릭터 확인은 자동 만료 없음. 실행 동의/종료·변경 손실 확인은 자동 승인하지 않음.
- 일반 창 좌표/크기와 플로팅 앵커는 독립 저장. 게임 전체화면 진입 때마다 모서리 초기화 금지. 닫힌 투명 영역은 게임 입력을 막지 않음.
- 기존 최근 ERGON busy 분리/접수ID 관측·계정/캐릭터·대기열·미확정 보호와 개인 dirty 보존. 게임 명령/원장 변경·새 자동화·DB/RLS/publication 변경·운영배포/push/공개ZIP 교체 없음.
- 전역 rem/테마 규칙 유지. 모바일 최소12px, PC 기본글자18/20/22 확인. 기존 IRIS 로고 `public/IRIS/logo/IRIS 로고 마크.svg` 재사용, 새 이미지 생성 없음.

## Review Focus

1. DPI/음수 좌표 모니터와 모니터 해제: 다른 모드 위치를 덮지 않고 보이는 작업영역으로만 보정(Task1 `FloatingBoundsSurviveDpiAndMonitorRemoval`).
2. native geometry/이전 document 응답 지연: 닫힌 UI 입력 영역이 남지 않고 stale revision이 새 화면을 덮지 않음(Task2 `StaleSurfaceReplyCannotReopenHitRegions`).
3. 전역키와 로컬키 이중 전달/핸들 재생성: 한 번만 토글하며 등록 실패 뒤에도 클릭/트레이 복구 가능(Task1 `OneKeypressOneToggleAfterHandleRecreation`).
4. 타이머 throttling/숨김/동시 알림과 미결 캐릭터: 정보 알림만10초 만료하고 선택/안전 보호를 잃지 않음(Task3 `HiddenDeadlineAndPersistentCharacterDecision`).
5. 초기 조회/재접속/제보 수정·삭제/주기 초기화: 과거 알림 재생·삭제된 제보·거짓0개 방지(Task4 `ReportReconnectDeletionAndPeriodBoundary`).

## 파일과 책임

- 신규 `iris/desktop-floating.cs`: 순수 배치/표시 상태/로고 입력 Region 및 단축키 소유자. 기존 source build 체계와 같은 .NET Framework 문법 사용.
- 신규 `iris/desktop-floating-store.cs`: 환경별 위치 설정 저장/읽기·구형 compact 설정 마이그레이션, 손상 원본 보존.
- 수정 `iris/desktop-webview.cs`, `desktop-addon.cs`, `desktop-overlay.cs`, `desktop-bridge.cs`: 표시 coordinator 연결, 일반 창/게임 붙이기/플로팅 충돌 제거. 기존 life bridge 변경 금지.
- 신규 `lib/irisFloating.ts`: 새 floating DTO/엄격 parser/일관된 UI 좌표 단위.
- 신규 `components/iris/useDesktopFloating.ts`, `DesktopFloatingHub.tsx`, `floating-hub.css`: bridge 이벤트·로고·키캡·메뉴·기능창 배치와 접근성.
- 수정 `app/iris/desktop/page.tsx`, `desktop.css`, `DesktopCenter.tsx`, `DesktopTitlebar.tsx`, `useDesktopPresentation.ts`: compact 네모 표시 제거/기존 모듈 재사용/복구 경로.
- 신규 `lib/irisNotificationQueue.ts`, `components/iris/useIrisNotifications.ts`, `DesktopNotificationHost.tsx`, `notification-bubble.css`: 시간/큐/캐릭터 말풍선/일반 알림 렌더러.
- 신규 `lib/irisDeepReports.ts`: 검증된 현재 주기 제보 투영/새 제보 fingerprint.
- 수정 `DesktopCharacterWatch.tsx`, `DesktopStatsSession.tsx`, `DesktopContentAlerts.tsx`, `useDesktopContentAlerts.ts`, `DesktopSynaxisSurface.tsx`, `lib/irisContentAlerts.ts`: 새 표시기로 전달하되 기존 신원/조회/쓰기 보호 보존.
- native 신규 테스트, `tests/iris-floating*.test.mjs`, `tests/iris-floating*.browser.mjs`, 알림/제보 테스트. 기존 fixture/실행 도구 재사용.

## Task 1: native 배치·위치 저장·단축키 정책

**Files:** 위 native 신규2파일, `iris/desktop-floating.tests.ps1`, `iris/desktop-floating.fixture.cs`.

**Interfaces:**
- `FloatingLayout.Calculate(Point anchorPx, Rectangle workPx, Size panelDip, bool menuOpen, bool bubbleOpen, bool panelOpen, int dpi): FloatingLayoutResult`. 반환은 실제 창 bounds/앵커 및 표시 요소 Region, side/up-down 방향. 요소의 프런트 좌표는 CSS px로 정규화하며 변환은 이 adapter 한 곳에서만 한다.
- `DesktopFloatingBoundsStore.Load(Rectangle initialNormal, Point initialAnchor): FloatingBoundsSnapshot`, `Save(FloatingBoundsSnapshot): bool`. snapshot은 version1/normalBounds/floatingAnchor/monitorId/dpi/persistent/unreadable이며 unreadable이면 원본 쓰기 금지.
- `DesktopFloatingHotkey(IShortcutRegistry registry, Action toggle)`: Alt/no-repeat/OEM3 하나만 소유하고 Dispose/handle 교체 때 해제. 테스트는 fake registry로 실제 전역키를 차지하지 않음.

- [ ] **1. 실패 시험 작성:** `NormalAndFloatingBoundsAreIndependent`에서 normal(100,80,420,640) 저장→float(800,300) 드래그→normal 복귀가 원래 normal과 같음. `FloatingBoundsSurviveDpiAndMonitorRemoval`은96/144DPI, 음수left, 사방 모서리, 모니터 제거에서 로고+키캡과 열린 영역이 work 안에 남는지 assert. `CorruptBoundsNeverOverwriteOriginal`은 임시 fixture 파일 바이트 동일 assert.
- [ ] **2. RED 실행:** `powershell.exe -NoProfile -File iris/desktop-floating.tests.ps1`. 신규 policy 부재/잘못된 좌표 assert로 FAIL 확인. 테스트 자신의 임시 경로만 생성하고 실제 프로필은 열지 않음.
- [ ] **3. 정책 구현:** circle52DIP, 아래 키캡 최소72×20DIP, 간격4DIP/작업영역여백8DIP를 기준으로 앵커를 보존하고 menu/bubble/panel union bounds를 계산. 모니터/글자 크기로 필요한 공간이 늘면 요소를 안쪽에 두되 앵커가 가능한 한 유지되게 보정. normal 좌표와 float 좌표의 쓰기 경로 분리/원자 저장 구현.
- [ ] **4. 키 등록 실패 시험→구현:** `OneKeypressOneToggleAfterHandleRecreation`은 등록값 `0x4001/0xC0`, 성공/실패/Dispose/핸들 재생성의 register/unregister 균형과1회토글 assert. local key handler는 같은 입력을 다시 toggle하지 않음. 실패 상태를 callback/state로 전달하고 클릭 복구는 유지.
- [ ] **5. GREEN/회귀:** 신규 시험 및 `iris/desktop-presentation.tests.ps1`, `iris/desktop-workspace.tests.ps1` PASS. 기존 창 일반 레이아웃 시험은 새 플로팅 정의에 맞게 책임을 나누되 원래 normal restore/unknown fullscreen 입력 방어를 삭제하지 않음.
- [ ] **6. 로컬 체크포인트:** 신규 native 정책/fixture만 diff/검증 후 명시 stage/commit. 기존 사용자 dirty 포함 금지, push 없음.

## Task 2: 버전 있는 bridge·native 창·플로팅 허브 연결

**Files:** native 기존4파일, `lib/irisFloating.ts`, `lib/irisDesktopStore.ts`, 신규 hub/hook/CSS, page/Center/Titlebar/presentation hook/desktop CSS. `iris/desktop.ps1`, `iris/build-beta.ps1`, `iris/desktop-grip.tests.ps1`, `iris/desktop-startup-close.tests.ps1`, `iris/desktop-webview.tests.ps1`의 컴파일 source 목록에 신규2파일 추가. 실제 source 참조 목록은 `rg -l 'desktop-presentation.cs' iris --glob '*.ps1'`로 누락 점검.

**Interfaces:**
- `FloatingModule = 'kronos'|'synaxis'|'ergon'|'settings'`.
- `FloatingState = {schemaVersion:1, mode:'normal'|'floating', menuOpen:boolean, surface:'none'|FloatingModule, revision:number, layout:FloatingGeometry, hotkeyAvailable:boolean, hotkeyLabel:'(Alt + ~)'}`.
- `FloatingGeometry = {width:number,height:number,anchor:{x:number,y:number,size:number},side:'left'|'right',vertical:'up'|'down',menu:{x:number,y:number,width:number,height:number}[],bubble:{x:number,y:number,width:number,height:number}|null,panel:{x:number,y:number,width:number,height:number}|null}`. 유한 양수/geometry 내부/메뉴 최대4개를 검증하고 모순되는 표시 상태를 거부한다.
- `parseFloatingState(value:unknown):FloatingState`、store `floatingState():Promise<FloatingState>`, `floatingCommand(command:'menu'|'close'|'normal'|'floating'|FloatingModule):Promise<FloatingState>`, `setFloatingNotice(kind:'none'|'information'|'character'):Promise<FloatingState>`。
- 신규 `window.floating.state`(null), `window.floating.command`({command}), `window.floating.notice`({kind}) 및 `window.floating.changed` 이벤트. origin/epoch/environment/정확한 payload와 증가 revision을 검증한다. 구 native의 기존 presentation 응답을 새 DTO로 오인하지 않는다.
- `useDesktopFloating(store)`→`{state,supported,busy,error,command,setNotice}`. `DesktopFloatingHub({state,onCommand,children,notice})`는 DOM 표시만 담당하며 게임 API를 받지 않는다.

- [ ] **1. DTO/bridge RED:** `tests/iris-floating.test.mjs`와 native bridge fixture에서 extra field/NaN/음수/메뉴4개 초과/다른 epoch·origin/낡은 revision/구 native를 거부한다. 게임busy 중에도 표시 전용 command는 가능하고 다른 게임 요청 제한은 유지한다.
- [ ] **2. adapter 구현:** Task1을 WebView/Addon에 연결한다. compact의 강제 모서리 재설정·normal.Location으로 float 좌표 혼입·FitContentHeight 경합을 교체한다. minimumsize/resize edge/rounded Region은 모드별로 적용한다. 닫힌 영역은 native Region에서 제거하고 표시/계측 변화 때 revision을 갱신한다. 늦은 응답으로 큰 Region을 복원하지 않는다.
- [ ] **3. UI RED→GREEN:** `tests/iris-floating.browser.mjs`에서 실제 hub+Center/기존 모듈과 fake bridge로 `(Alt + ~)` 로고 직하단, 드래그 뒤 클릭0, 클릭/키로4메뉴, 모듈 선택/큰 창 복귀, 바깥 클릭/Escape, 12자 긴 이름/4모서리/18·20·22px/reduced-motion을 assert한다. 기존 SVG/200ms animation을 사용하며 클릭을 가로채는 거대한 투명 배경을 만들지 않는다.
- [ ] **4. 수명 회귀 추가:** `StaleSurfaceReplyCannotReopenHitRegions`에서 A의 open 응답을 B의 close 뒤 반환해 B의 닫힌 입력 영역이 유지됨을 assert한다. 기존 ERGON navigation/edit-during-action fixture로 float/module 변경 후 같은 접수ID의 종료·진척 관측/재송신0을 확인한다. 모듈 상태를 중복 마운트하지 않는다.
- [ ] **5. native/구버전 복구:** 가짜 gameframe의 fullscreen/windowed·IRIS minimize→float·재드래그·초기화 실패·구 native를 시험한다. 트레이/큰 작업창 복귀, X종료/미저장 대화는 기존대로 보장한다. 전면 게임 입력 후킹은 하지 않는다. 키 등록 실패는 설정/키캡의 상태 설명에 표시한다.
- [ ] **6. GREEN/compile/commit:** `node --test tests/iris-floating.test.mjs`, browser fixture, `iris/desktop-floating.tests.ps1`·`desktop-webview.tests.ps1`·`desktop-grip.tests.ps1`·`desktop-startup-close.tests.ps1` PASS. Task1/2의 명시 파일만 로컬 커밋한다.

## Task 3: 공통10초 정보 알림과 무기한 캐릭터 말풍선

**Files:** 신규 queue/hook/host/CSS, CharacterWatch/StatsSession/ContentAlerts/page. `tests/iris-notification-queue.test.mjs`, `tests/iris-notification-bubble.browser.mjs`, 기존 character-switch/content-alert 시험.

**Interfaces:**
- `IrisInformationNotice = {key:string,scope:string,title:string,message:string,reporter?:string,createdAt:number,expiresAt:number|null,sound:boolean}`. 콘텐츠 유효기간과 표시10초 deadline은 별개다.
- `createIrisNotificationQueue(scope:string)`→`push(notice)`, `remove(key)`, `show(now):{notice:IrisInformationNotice,shownAt:number,deadline:number}|null`, `dismiss(key)`, `tick(now)`, `state()`. scope가 바뀌면 이전 queue를 버리고, 중복 key는 추가하지 않는다.
- `notificationRemaining(shownAt:number,now:number):{milliseconds:number,fraction:number}`는 `max(0,10000-(now-shownAt))`와0..1 비율을 반환한다.
- `CharacterNotice = {key:string,scope:string,nickname:string,job:string,content:ReactNode}`. 기존 watch의 확인 핸들러를 content에 재사용한다. Watch/StatsSession에 `renderPrompt?: (notice:CharacterNotice)=>ReactNode`를 추가하고 기본값은 기존 일반창이다. floating에서는 공통host의 캐릭터 slot으로 portal을 반환한다. 렌더 중 부모 setState는 하지 않고 후보 등록/해제는 수명 effect로 처리한다. 시간 만료는 없고 scope/후보 유효성 상실은 취소한다.
- `DesktopNotificationHost({information,character,floating,onDismiss,onCharacterCollapse})`: 일반 알림은 role=status/포커스 비강제, character는 기존 명시 선택이다. Task2의 notice kind로 native에 필요한 영역만 요청한다.

- [ ] **1. 시간 RED:** `NotificationExpiresExactlyAfterVisibleTenSeconds`는 show(1000) 뒤 tick(10999)에1ms, tick(11000)에null, 중간 비율0.5를 assert한다. 이벤트 at부터 세어 조기 종료하거나 hover/focus로 무한 연장하지 않는다.
- [ ] **2. 큐/시간 구현:** 순수 deadline/queue를 `lib/irisNotificationQueue.ts`에 구현한다. 일반 알림 하나만 표시, 중복key없음/최대4대기, 콘텐츠 유효기한이 지나면 버림. native/game/DB I/O 없음.
- [ ] **3. 실제 React RED→GREEN:** fake clock으로10초/줄어드는 progress/수동X·확인/비전면 뒤 deadline 복귀/클릭으로 게임요청0을 검증한다. `HiddenDeadlineAndPersistentCharacterDecision`은60초 뒤에도 캐릭터 확인 유지, Escape로 접고 다시 열기, 다른 account/scope 후보 숨김을 assert한다. 미결 캐릭터를 일반 알림이 덮지 않으며 일반 알림은 body inert/스크롤lock/초점 강탈을 하지 않는다.
- [ ] **4. 기존 경로 전환:** content 정보Modal을 공통host로, Watch/StatsSession 후보는 기존 검증/재조회/네·아니요·다른캐릭터를 유지한 renderPrompt로 옮긴다. 소리는 key당1회/ON·OFF 유지. 오류 알림이 닫혀도 busy/unknown·저장 결과는 바꾸지 않는다.
- [ ] **5. GREEN/commit:** `node --test tests/iris-notification-queue.test.mjs tests/iris-character-switch.test.mjs tests/iris-content-alerts.test.mjs`, 신규bubble/기존character-switch 브라우저 시험PASS. queue/host와 명시 연계 파일만 로컬 커밋한다.

## Task 4: 심층 구멍 위치/개수/제보자와 일반 알림 통일

**Files:** `lib/irisDeepReports.ts`, `lib/irisContentAlerts.ts`, `useDesktopContentAlerts.ts`, `DesktopContentAlerts.tsx`, `DesktopSynaxisSurface.tsx`, `tests/iris-deep-reports.test.mjs`, `tests/iris-deep-reports.browser.mjs`, `tests/iris-content-alerts.browser.mjs`.

**Interfaces:**
- `DeepReportRow = {id:string|number,zone:string,channel:string,reported_at:string,reporter_name:string}`는 현행 DB 읽기 계약이다. `projectDeepReports(rows:unknown[],periodStart:number,now:number):{id:string,zone:string,zoneLabel:string,count:number,reportedAt:number,reporter:string,key:string}[]`. knownzone은 `hz_001→창백한 산`, `hz_002→센마이 평원`, count는0..3정수다. 0은 해당 제보의 구멍없음 표시만 하고 발생 알림은 보내지 않는다. 불명/손상값을0이나 다른 지명으로 추측하지 않는다.
- `deepReportNotice(report):IrisInformationNotice`는 제목 `심층 구멍 제보`, 본문예시 `창백한 산 · 2개 발생`, reporter `한설`. key는 ID/제보시각/내용에 묶고 expiresAt은 해당 주기 끝으로 정한다. 조회error와 빈array는 다른 상태로 표시한다.
- `useDesktopContentAlerts`는 기존 fetch/subscription scope를 유지한다. 최초/재접속 snapshot으로 baseline을 세우고 이후 신규 유효 제보만 Task3의 push/remove로 연결한다. 확인 강제 Modal을 다시 도입하지 않는다.

- [ ] **1. 데이터 RED:** `ReportReconnectDeletionAndPeriodBoundary`에서 주기경계/미래/만료/중복ID/같은내용 갱신/삭제/재접속을 시험한다. `channel='2'`는2개, 제보자의 한자/12자 이름은 원형 유지, 서로 다른 제보를 임의 합산하지 않음을 assert한다. 수치누락/손상시각/불명zone의 경고·제외도 고정한다.
- [ ] **2. projector/문구 구현:** 기존 현재 주기 계산을 이용해 알림 화면 deep카드에 지역·개수·이름·시각 행을 표시한다. 빈상태/오류/연결끊김 구분. DB 테이블/컬럼/권한/기존 report POST 의미 변경 없음.
- [ ] **3. hook 실제 React RED→GREEN:** `loadTS`/`iris-ui.fixture.mjs`의 fake Supabase/Realtime만 사용해 최초행 목록만 표시, 다른사용자 신규행 목록+알림1회, DELETE 목록·대기 제거, 재접속 재알림0, 10초 종료를 assert한다. 실제 DB/운영client에 시험 데이터를 쓰지 않는다.
- [ ] **4. 정보 알림 경로 점검/통합:** IRIS 아래 notice/setNotice/Modal/confirm을 열거한다. `DesktopSynaxisSurface` 등의 일시 성공·안내는 queue로 옮기고 inline 검증오류/저장보호/실행동의/폐기확인은 상태 또는 선택필수로 남긴다. 정보toast만 따로 무기한 남는 경로가 없음을 합성 확인하고 QA에 분류표를 기록한다. SANCTUM 웹 전체의 모달/알림함을 범위 밖에서 바꾸지 않는다.
- [ ] **5. GREEN/commit:** 새deep projector/browser, 기존content-alert/character-switch/party 행동시험PASS. 표시·읽기 연계만 로컬 커밋한다. 실제 연결 미확인은 명시하고 데이터 권한을 바꾸지 않는다.

## Task 5: 통합 검증·실제 앱 적용·인계

**Files:** 신규 `tests/iris-floating-integration.browser.mjs`, QA `docs/IRIS_FLOATING_HUB_QA_20261017.md`, `docs/BETA_FEEDBACK.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md`, `app/SANCTUM_MASTER_GUID.md`.

- [ ] **1. 통합 시험:** full desktop page+fake native/HTTP/Realtime으로 normal→float→menu→module→닫기→normal 왕복, 드래그/키캡/다른계정 후보 초기화, 게임요청1회 뒤 hidden종료/추가요청0/unknown보호를 검증한다. 정보게이지/10초·캐릭터무기한·심층목록도 같은 흐름에서 확인한다.
- [ ] **2. 전체 검증:** `node --test tests/*.test.mjs`, `npx tsc --noEmit`, 변경 TS/TSX/시험의 명시ESLint, 관련browser/native시험 실행. fixture3011은 직렬이다. 루트lint가 기존생성물/옛script로 실패하면 이름과 범위를 보고하고 설정완화로 숨기지 않는다. 기존desktop outside-title locator 문제는 실제 backdrop pointer 대조로 확인하며 시험만 고치면 이유를 기록한다.
- [ ] **3. build/눈으로 확인:** `iris/build-beta.ps1 -OutputRoot .superpowers/artifacts/iris-floating-private-build`를 공개복사 없이 실행한다. native컴파일 성공과 실제WebView Region/투명/키 동작은 별개다. 320/390/768/1280폭, 18/20/22, 명암테마,4모서리/DPI 캡처·입력hit-test 확인.
- [ ] **4. 독립 검토:** 의존interface/좌표/투명입력영역/키중복/알림deadline/캐릭터identity/게임접수latch를 read-only reviewer 한 명에게 확인 요청한다. 지적을 실제 재현한 뒤 수정하고 관련시험을 재실행한다.
- [ ] **5. 실제 후보:** 현재IRIS 강제종료 금지. 사용자 X정상종료 확인→local page200/기존instance0→Development1회 실행. 먼저 게임소비 없이 로고/키/모서리/normal복귀를 확인받는다. 게임행동은 직전 별도승인 없이 보내지 않는다.
- [ ] **6. 문서/완료 표시:** 설계/구현/합성/실제native눈검증/미확인을 구분한다. 과거금속unknown·이동중편집의 미확인을 임의로 해결완료 처리하지 않는다. 실패한 전체검사/남은위험은 QA에 기록한다. 명시push 요청 없으면 push/버전/ZIP/공지/DB변경0을 유지해 인계한다.

## 실행 전 체크포인트와 자체 검토

- 111행 설계 승인. Task1..5가 spec1..8을 포괄하며 Review Focus5개는 담당task의 구체시험에 대응한다. Floating DTO/Task3 queue/Task4 제보projection의 이름을 일치시켰다.
- 현재branch `codex/iris-checkboard-classes`, HEAD e423ed3. 이전 ERGON busy/관측수정과 개인dirty가 함께 있다. 구현자는 using-git-worktrees에 따라 기존artifact/branch를 점검하고 필요하면 **이전작업에서 자신이 수정한 파일만** 별도 체크포인트로 저장해 이어받는다. 개인 UPDATE_POST/삭제파일/스크립트는 포함하거나 reset하지 않는다.
- 계획 작성 시점에 floating 제품코드/native/게임행동 변경0. 계획 확인과 실행방식 승인을 기다린다. 권장은 영겁이 같은 세션에서 직접 구현하고 마지막에 독립review 한 명을 요청하는 방식이다. 인터페이스 의존성이 강해 동시 별도구현은 하지 않는다.
