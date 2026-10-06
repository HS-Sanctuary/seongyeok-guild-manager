# IRIS 로컬 우선 설계 초안

## 컴팩트 HUD 추가 구조 — 2026-10-06 미배포

DesktopCenter/desktop.css가 단일 버튼형 HUD와 아코디언을, irisDesktopPresentation이 캐릭터별 이름/개수/가장 가까운 저장 시각을 표시한다. UI의 접힘/테마 변경은 기존 DesktopController/보호 큐와 분리된다.

DesktopWebView가 DesktopOverlayCoordinator 한 개를 소유한다. coordinator는 기존 HotkeyRecovery/WindowShortcuts 정책으로 두 단축키·클릭 통과·불투명도·작업 영역 경계를 관리한다. WebView의 신뢰된 desktop 문서 높이를 제한 측정하는500ms UI 타이머는 DB 조회/저장과 무관하며 한 번에 하나만 실행한다. overlay.state/input/opacity는 기존 브리지 출처/epoch/ID 검증을 공유한다. 네이티브 상태 변경 알림도 현재 epoch의 재조회로만 UI에 반영한다.

실제 게임 신원 계약이 없어 스탯 저장 엔진은 추가하지 않았다. 기존 보호 snapshot schema1과 숙제 저장 계약은 변경하지 않는다.

## 2026-10-06 선택 실행기 후보 구조

`desktop.ps1` → `desktop-host.cs` URL/프로필 정책 → `desktop-webview.cs` 내장 화면 → `/iris/desktop` React UI → `irisDesktopController.ts` 직렬 인증/저장 → 기존 생텀 API. `irisDesktopQueue.ts`는 원본 계정·캐릭터·기간·리비전을 보존한다. `irisDesktopStore.ts`와 `desktop-bridge.cs`는 출처/문서 epoch/단조 요청 ID를 확인하며, `desktop-store.cs`는 DPAPI 암호화/원자 교체/손상 격리를 담당한다.

`desktop-lifecycle.cs`는 중복 창 활성화와 비정상 종료 후 소유권 복구를 담당한다. `execution-lock.ps1`은 기존 overlay와 desktop 모두의 전체 실행 기간을 공유 OS mutex로 보호한다. 내장 창의 일반 종료는 웹 안내로 넘기며, 브리지 장애 시 트레이의 손실 경고 복구 종료가 별도로 있다.

06시 경계와 화면 복귀의 제한된 GET은 선택 화면만 갱신하고 이전 기간의 대기 편집은 보존한다. 유휴 주기에는 저장 POST가 없으며, 보관 종료는 서버 조회를 요구하지 않는다. 실제 사용자 검증 전 기존 센터/게임 위젯/단축키 기본 경로는 유지한다.


## 2026-10-05 앱 전용 화면 전환 — 분리된 기반 후보

`desktop-host.cs`는 URL 허용 및 production/development 전용 프로필 정책이다. `desktop-webview.cs`는 분리된 WinForms/WebView2 실행 후보이며 기존 launcher/overlay와 연결되지 않았다. 한설 승인으로 공식 Microsoft.Web.WebView2 1.0.4258.31 SDK를 프로젝트의 ignored vendor 캐시에 확보했다. net462 assembly와 Microsoft 서명 win-x64 loader를 기존 PowerShell에서 사용하며 .NET SDK/OS 설치는 하지 않았다. 고정 source/version/SHA256은 `webview2-package.json`에 기록한다.

`desktop-webview.tests.ps1` 및 별도 fixture는 localhost:3000 요청을 브라우저 안에서 가로채 합성 HTML·HttpOnly 가짜 쿠키만 제공한다. 실제 dev 서버/운영 계정에 접속하지 않는다. 첫 브라우저 프로세스 종료 후 새 프로세스에서 같은 전용 테스트 프로필의 쿠키 유지, JavaScript 쿠키 접근 차단, 외부 navigation/frame/new-window/redirect 차단을 확인했다. host objects/web messages는 비활성이고 download/permission은 거절한다. 보호 대기함 bridge는 아직 없다. 실제 로그인과 기존 기본 경로 교체는 수동 검증 이후다.

`lib/irisDesktopQueue.ts`는 IO 없는 캐릭터별15초 큐다. 환경/account/character/task/period identity, 독립 deadline, serial claim, next revision, unknown/conflict/expired 보류를 제공한다. 개발 환경 큐는 운영 환경 항목을 claim할 수 없다. 복원된 변경은 최신 서버 확인 전 모두 보류한다.

`irisDesktopTransport.ts`는 같은-origin 기존 auth/IRIS API adapter다. account/character/details/period/row 응답을 검사하고 표시 필드만 반환한다. POST timeout/503/불일치 ack는 unknown으로 보존하며 재전송하지 않는다. `irisDesktopController.ts`는 보호 store 인터페이스에 claim을 먼저 보관하고 현재 계정 소유 캐릭터의 최신 GET→기간/base 검사→단일 POST를 직렬 실행한다. 지금 저장은 timer를 기다리지 않는다. 계정 전환·로그아웃·저장 종료는 편집을 잠그고 in-flight를 기다린 뒤 기존 계정 unknown을 GET 확인한다. desired면 제거, 다른 값이면 conflict, 새 기간이면 expired, base 그대로면 unknown 보류한다. 원래 캐릭터의 ack는 다른 선택 화면을 갱신하지 않는다. 대기함 저장 실패는 추가 전송/편집을 잠근다. 합성16 tests로 검증했으며 실제 보호 store/UI/API 호출은 아직 연결하지 않았다. 기존 native/브라우저 relay 큐와 동시에 활성화하지 않는다. 기존 read widgets는 보존한다.

## 2026-10-04 명시 체크 저장 — 최신 로컬 후보

Native CheckboardWindow UI intent → PowerShell `Stage-IrisKronosEdit`/`Submit-IrisKronosEdits` → 역할별 native edits 경로 → ConnectionState/KronosEditQueue 메모리 → 별도 수정 동의 브라우저 relay → same-origin 인증 POST `/api/iris/kronos` → 단일 필드 CAS → GET 재확인 → browser results → native typed 상태. 네이티브에 세션 쿠키/서비스 키/DB URL 쓰기 권한을 주지 않는다. 기존 직렬 읽기 주기만 재사용한다.

`lib/irisKronosWrite.ts`는 strict Edit·periodKeys·순수 부분 변경, `lib/server/irisKronosWrite.ts`는 세션 owner/카탈로그/CAS를 처리한다. GET은 한 관측 시각으로 details와 periodKeys를 만든다. 반복 daily는 기존 웹처럼 weekly_checks.repeat에 유지한다. 변환 후 모든 활성 항목의 무관 완료 수 보존을 검사해 legacy 통합 키 분해를 추측하지 않는다.

큐는 최초 base/마지막 desired, 최대200과 전체 native snapshot 64000 UTF8 바이트 경계(전송65,536 제한 여유)다. GET edits 최초 claim을 unknown으로 바꾸며 이후 claim은 reconcileOnly다. 결과 유실·재접속 때 POST 자동 재생을 막는 비용으로, 실제 전송 전 끊기면 재조회 후 사용자 재시도가 필요하다. 긴 직렬 배치는 각 검증 GET의 summary로60초 freshness를 갱신한다. 실제 DB의 원자적 batch/durable idempotency 저장소는 없다.

ConnectionDisplay/ApplyDisplay는 typed identity·기간·동의·큐 상태를 검증한다. 구형 readonly Apply 호환 유지. pending 값/합계 우선 표시, submitted/unknown은 조작 잠금, conflict 저장 차단, 별도 폐기 기본 No. 숨김은 큐를 지우지 않으며 pending 건수는 종료 경고용 controller 메모리에도 보수적으로 남긴다. 강제종료 복구 보장 없음. 운영 저장·게임 조작·독립 리뷰 검증은 수행하지 않았다.

## 2026-10-04 항목별 체크보드·클래스 저장값 (로컬 후보)

인증·소유 확인된 GET `/api/iris/kronos`는 기존 체크와 활성 클래스 카탈로그를 병렬 조회하고 동일 행에서 `summary`와 `details:{schemaVersion:1,tasks:{daily,weekly,abyss,raid},classes}`를 만든다. 신규 DB/RLS/쓰기 없이 기존 `characters.levels` name→number를 읽으며 미등록은null이다. 클래스 카탈로그 조회 하나가 기존 요청에 추가되며 항목/클래스별 추가 조회는 없다.

`lib/irisRelay.ts`는 기존 직렬15초 주기로 상세를 함께 보내고 UTF-8 JSON65,536바이트를 넘으면 전송 전 거부한다. `kronos-details.mjs`는 범주200/클래스100/Unicode 이름120/ID100/횟수1~1000/레벨1~1000 또는null/중복과 합계 일치를 검사한다. state는 선택 버전과 함께 원자 적용하고 실패·전환·만료 시 요약/상세를 함께 비운다. 상세 없는 구형 요약은 유지하지만 체크보드에 상세를 만들어 내지 않는다.

`ConnectionDisplay`가 같은 상세를 native에서 재검증하고 `CheckboardWindow`가 공유 갱신값을 읽는다. support/native/modules/checkboard를 imports 중복 제거 후 단일 메모리 C# assembly로 컴파일한다. 센터 상단 숙제/트레이 복구, 4범주+클래스 아코디언, 남은 항목 표시 필터, 내부 스크롤, 전체 테마/불투명도/숨김을 배선했다. 동일 내용은 UI를 다시 생성하지 않는다. 새 HTTP/DB 폴러나 게임 action은 없다.

자동139/139·타입·웹빌드 통과(실제 공유 갱신 배선 포함). 독립 agent 리뷰와 실제 사용자 새 위젯 대조/DPI/장시간 검증은 미완료다. 과거 절의 미구현 표현은 해당 날짜 당시의 상태이며 최신 로컬 후보는 본 절을 따른다.

## 2026-10-03 캐릭터·크로노스 읽기 후보

Windows owned child(stdin capability/READY/EOF) → 역할별 loopback handler → 메모리 ConnectionState ↔ 동의한 `/iris` relay ↔ 인증·소유 확인한 GET API. Native와 browser 토큰은 분리하며 URL fragment 제거/동의/계정 변경 폐기를 적용한다. 게임 CLI 스냅샷과 생텀 요약의 갱신/실패는 별개다. 소유를 확인하지 못한 기존 서버에는 native 토큰을 보내지 않는다.

별도 크로노스 ModuleWindow는 6개 정보 행+선택/명시 확인/새 연결/브라우저 열기 footer다. OwnedServer 비동기 Task를 WinForms timer가 한 번에 하나만 소비한다. 숨김은 취소와 기존 응답 폐기 표시를 함께 적용한다. RememberedSelection은 version/accountId/characterId만 atomic 저장, 현재 소유 목록에 같은 계정 ID가 있을 때 제안만 한다. ConnectionDisplay는 잘못된 값과60초 native 수신 중단을 비운다. 브라우저 freshness는 서버에서 별도60초 제한한다.

아직 항목별 체크 쓰기·게임 수령 없음. 기간 정보 없는 구형 반복 슬롯이 현재 최대치를 초과하면 summary API는503으로 중단한다. 데이터 삭제/재도장/무음 clamp는 하지 않는다. 실제 Windows DPI/로그인/캐릭터 전환/탭닫기 확인은 대기다.

## 2026-10-03 커맨드센터 안전·표시 설정 후보

기존 shortcut/poller owner가 커맨드센터를 겸한다. 사용자 close는 center만 숨기고 전역 Hidden/폴링은 유지한다. 전체 종료는 Request-IrisExit 단일 경계의 기본 No 확인/재진입 방어 후 허용한다. Windows shutdown은 막지 않는다. 별도 DisplayPreferences가 6개 theme/opacityPercent 40~100만 허용하고 기존 position 저장과 atomic writer를 공유한다. 테마 값은 globals.css의 panel/text/sub/accent 토큰을 사용한다. 현재 자체 가공 수령·크로노스 쓰기·자동 종료는 미구현이므로 종료 시 DB 저장을 했다고 표시하지 않는다.

## 2026-10-03 모듈창 구조 (로컬 후보)

`overlay.ps1`의 관리창은 유일한 HotkeyRecovery/SnapshotPoller/서버 소유자다. `overlay-modules.cs/ModuleWindow` 세 창은 passive OverlayWindow로 owner의 복구 단축키 가용성을 참조하고 같은 SnapshotDisplay의 0..5/6/7 값을 배분받는다. 개별 close는 숨김이며 관리창 종료에서 dispose한다. 모든 모드 복구/개별 표시 시 현재 모니터 작업 영역으로 위치를 보정한다. 모듈별 Preferences 저장은 기존 allowlist를 재사용한다. 생텀 인증/숙제 기록과 별개인 게임 출처 요약이다. 인증된 캐릭터 연결 설계 및 배포 checklist는 docs/superpowers/specs와 docs/IRIS_DISTRIBUTION.md에 있으며 현재 해당 연결은 미구현이다.

목표: 길드원이 게임의 `마비노기 모바일 AI 커넥터`를 활성화하면 자신의 PC에서 IRIS가 게임 CLI를 직접 읽고, 필요한 값만 SANCTUM에 동기화한다. **길드원마다 OpenAI/Gemini 계정·API 키·모델 사용량을 요구하지 않는다.**

1. 게임 CLI ↔ 각 길드원 PC의 IRIS: 읽기·제작·채집을 명령/규칙 기반으로 처리한다. 현 시제품은 읽기 허용 목록만 갖는다.
2. IRIS 로컬 화면: 사용자에게 게임 상태·실행 대상·예상 소모를 보여준다. 게임 조작은 명시적 시작/중지, 중복 방어, 실패 복구가 필요하며 현재 미구현이다.
3. IRIS → SANCTUM: 생텀 로그인 세션으로 본인 계정과 대상 캐릭터를 확인한 뒤 동의받은 필드만 보낸다. 서버는 소유권과 값 범위를 재검증한다. 현재 미구현이며 운영 DB·권한 변경 전 한설 승인이 필요하다.
4. AI 모델은 필수 경로에 넣지 않는다. 장차 자유문장 계획·추천 기능이 필요할 때만 별도 선택 기능과 비용 정책으로 검토한다.

제약: IRIS는 게임과 같은 PC에서 실행해야 한다. 로컬 게임 CLI가 제공하지 않는 닉네임·초상화·랭킹·길드공헌도·장착 룬·나이트메어 드릴 기록·크로노스 구매/교환 이력은 AI 모델을 붙인다고 자동으로 정확해지지 않는다. 공식 읽기 경로나 사용자 확인 절차가 필요하다.

## 2026-10-02 Windows 오버레이 안정화 (로컬 후보)

`overlay.ps1`의 WinForms 메시지 루프는 200ms마다 완료 여부만 확인한다. `overlay-support.cs/SnapshotPoller`가 고정 주소 `http://127.0.0.1:4317/api/snapshot`으로 비동기 요청을 실행하며 리다이렉트/프록시를 사용하지 않는다. 완료 응답을 소비하기 전에는 새 요청을 받지 않는다. 숨김/종료는 조회를 취소하며 숨김 이전 완료 응답도 폐기한다. 이 취소는 클라이언트 조회만 중지하며, 이미 시작된 로컬 서버의 CLI 읽기를 새 게임 조작으로 중단시키지 않는다.

`SnapshotDisplay`는 성공 JSON/관측 시각을 확인하고 30초가 지난 값, 실패 응답, 누락 수치를 안전하게 비운다. 정상 응답 5초 후 재조회, 실패는 최대 30초 대기다. 표시 시각은 로컬 관측 시각이며 서버에 업로드하지 않는다. 기존 `reader.mjs`의 순차 읽기·허용 명령과 서버의 in-flight 공유를 유지한다.

`overlay-native.cs/OverlayWindow`는 자기 HWND의 extended style만 변경하며 [Microsoft의 layered-window 입력 규칙](https://learn.microsoft.com/en-us/windows/win32/winmsg/window-features)을 따른다. [RegisterHotKey](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerhotkey)로 Ctrl+Alt+I/O를 확보하며 두 키 중 하나라도 실패하면 부분 등록을 해제한다. 키보드 후킹/입력 주입은 하지 않는다. HWND 파괴 시 해제하고 재생성 시 안전한 조작 모드로 돌아간다. 트레이 메뉴도 복구 경로다.

허용된 디스크 저장은 창 표시 환경 네 항목(version/x/y/collapsed)뿐이다. 임시 파일 후 원자 교체하며 게임 원본/스냅샷/로그인 정보는 직렬화하지 않는다. 설정 저장 오류가 나도 표시 기능은 계속 유지한다. 숨김·클릭 통과는 세션 메모리 상태이며 재시작 시 복원하지 않는다. 이 후보에는 SANCTUM 서버·DB·권한 변경과 외부 배포가 없다.
# 2026-10-03 후속 — 캐릭터 연결 HTTP 경계 (로컬 후보)

`connection-http.mjs`는 게임 읽기 bridge와 별개의 역할별 연결 경계다. `createIrisServer({nativeToken})`가 직접 소유한 서버의 메모리 capability를 받을 때만 활성화한다. 기존 CLI/Windows launcher는 아직 해당 토큰을 전달하지 않으므로 새 연결 경로는 기본503이다. native 무Origin+native token, browser localhost:3000/127.0.0.1:3000 exactOrigin+별도 browser token+전달 동의를 요구한다. 토큰/목록/요약은 디스크에 저장하지 않는다. JSON64KiB/수신5초, browser30분 만료, connection generation·selection version 검사 및 본문 수신 후 재인증을 적용한다. 운영 Origin은 허용하지 않는다.

실제 브라우저 인증 API·Windows 캐릭터 선택 UI·토큰 bootstrap·수령 명령 연결은 미완료다. 해당 경계 테스트는 합성 계정/캐릭터 데이터와 루프백 HTTP만 사용하며 실제 게임/운영 DB에 접근하지 않는다. server 파일은 직접 실행할 때만 listen하고 import는 factory만 제공한다.
