# 순월 인계 — IRIS 플로팅 미완료 후보 / 2026-10-17 KST

## 현재 상태와 우선순위

한설이 사용량 부족으로 추가 구현을 멈추고 현 상태를 push·인계하도록 요청했다. **release-ready가 아니다.** `codex/iris-checkboard-classes` 최신 문서 마감까지 pull하고 수신함 ACK 후 이어간다. 코드 체크포인트: 618fadd(이동 중 내부 편집), da152e9(정책), 4c31b54(허브·설정·알림).

운영 main1d8e374, SANCTUMv2.31 / IRIS0.3.0, 공개 ZIP·공지·DB는 유지한다. 직전 정상 Vercel 기준 dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR. 운영 승격하지 않는다. 한설 IRIS 정상 종료 확인 및 프로세스 없음 확인 후 **새 native 앱은 실행하지 않았다.** 다음 세션에서는 실행 상태를 다시 확인한다.

## 미해결 독립 리뷰 — Critical0 / Important2 / Minor1

1. **Important: 숨김 중 새 알림의10초 소진.** `components/iris/useIrisNotifications.tsx` canShow/tick이 document.visibilityState와 native 실제 가시성을 검사하지 않고 queue.show(at)를 호출한다. 트레이/게임 숨김 중 도착한 알림이 첫 실제 표시 전에 끝날 수 있다. 이미 표시한 알림의 deadline은 보존하고 새 알림은 실제 표시 가능할 때 최초10초를 시작해야 한다. 숨김 도착→복귀→첫 표시10초 회귀부터 추가한다.
2. **Important: compact 저장 후 재시작 시 resize Panel 잔존.** `iris/desktop-floating-host.cs` InitializeFloating이 Presentation.Compact를 floatingMode에 직접 대입하며 SetFloatingMode의 accessory visibility 단계를 거치지 않는다. `iris/desktop-webview.cs` 생성자의 좌우5px Panel이 남아 Browser/Region 좌표를 어긋나게 할 수 있다. compact=true 프로필의 실제 Form fixture로 Panel.Visible=false 및 Browser.ClientRectangle을 확인하고 초기화도 공통 표시 규칙을 적용한다.
3. **Minor: 한글 menu label native 잘림.** `components/iris/floating-hub.css` top:100% 설명은36DIP 버튼 밖인데 `iris/desktop-floating.cs` Region/Bounds는 버튼 rect만 포함한다. label까지 geometry에 포함하거나 Region 안으로 옮긴다. 브라우저 캡처만으로 native 표시 성공이라고 쓰지 않는다.

세 건은 **발견만/미수정**이다. 사용자 중단 요청으로 수정 라운드를 보류했다. 중요2건→회귀→정상 앱 시작→실제 전체화면·키·DPI 확인 순서로 이어간다. 추가 결함이 없다는 보장은 하지 않는다.

## 구현된 후보

- 기존 SVG 원형 IRIS 로고/드래그·방향적응4메뉴. 기본 실제 Alt+백틱(Shift 없음), 로고 아래 `(Alt + ~)` 키캡.
- 설정: 크기36~80DIP 기본52, 불투명도35~100% 기본80, 키 변경/복원. 새키 등록 실패 시 이전키 보존, Ctrl+Alt+I/O 복구키 예약.
- native 표시 전용 versioned bridge, 환경별 `window-floating-v1.json` 원자 저장/손상원본 보존, 일반/플로팅 좌표·투명도 분리. epoch/environment/revision 검증 및 구 native fallback.
- 기존 Center 모듈 마운트·편집값 유지/늦은 열기 응답 무시. 내부 탐색·편집은 가능하고 추가게임행동·계정/캐릭터만 실행 중 보호.
- 공통 정보10초/게이지·비차단, 캐릭터 무기한 명시 선택/기존 재확인. 실행동의·unknown·저장손실 등 안전 상태는 자동만료/승인하지 않는다.
- 심층 지명·개수·제보자·시각 목록. 기존 SELECT/Realtime 재사용, 초기/재접속 baseline·신규1회·변경/삭제/기간 만료 회수. 새 API/DB/RLS/publication 변경 없음.

## 검증과 남은 실패

- 마지막 전체 Node **574 total /571 PASS /3기존 skip /0 fail**. 타입/신규·연계 scoped lint 및 관련 native 정책/chrome24/bridge/startup-close/WebView, 실제 React 허브·설정·마운트/지연응답·10초·캐릭터·심층·에르곤·파티 PASS 기록. fixture 성공을 실게임 성공으로 쓰지 않는다.
- 격리 webpack/private native compile 통과 기록. 최신 최종 build 로그에도 완료 산출물이 있다. 다만 세션 정리 후 마지막 회차 종료코드 재조회 불가: 최신 exit0를 새로 확인했다고 주장하지 않는다. 신규 테스트 lint 로그도 비어 있으나 마지막 종료코드 재조회 불가. 필요 시 순월이 재실행한다.
- 기존 Synaxis lint2오류/1경고는 변경 전 소스에서도 재현. 루트lint 전체 성공 아님.
- `iris-character-switch.browser.mjs`: legacy native 경로22개 통과 뒤 manual-intent-cancels-pending-yes 실패(기존 modal backdrop이 배경 picker 차단). 새 비차단 CharacterWatch는 별도 통과. 기존 `iris-desktop-ui.browser.mjs` 제목 뒤 locator 실패는 미재실행/미해결.
- 실제 전체화면 왕복·원좌표 복귀·Win32 Region 밖 게임 클릭·전역키 충돌/handle재생성·savedcompact·다중모니터/DPI·운영 Realtime 재접속 미검증.
- 설계: `docs/superpowers/specs/2026-10-17-iris-floating-hub-design.md`; 실행계획: `docs/superpowers/plans/2026-10-17-iris-floating-hub.md`; 상세 QA: `docs/IRIS_FLOATING_HUB_QA_20261017.md`.

## 보존 경계

- 한떨 가죽4건은 사용자 이동/보상/IRIS완료확인 및8→4 확인. 목재4건 전량수령도 사용자 확인(마지막 앱 최종판정 사진 없음). 이동 중 내부메뉴/편집은 사용자가 아직 테스트하지 않았다. 날개 동일 표시로 비용0을 확정하지 않는다.
- 과거 금속 unknown은 실수령 사용자 확인과 앱 판정이 다르며 원본응답/실패단계 부재로 원인 미확정. 별칭 완화·원장 성공주입·같은세션unknown 해제 금지. 기존12분/두번안전idle/동일프로세스문맥·원본hash/CLI부재 조건 보존.
- 게임행동은 직전 질문→승인→1회→결과질문. 자동모달 승인/추가소비/무제한chain 확대 없음.
- 개인 dirty 제외·보존: docs/UPDATE_POST_v2.151.md 수정, 루트 개인문서3개 삭제, tests/kronos-theme-preview.mjs 및 아이리스 실행 파워쉘 명령어 미추적. `git add -A` 금지.
- 집 로컬dev3000/isolated preview3001은 원격으로 전달되지 않는다. 순월 환경에서 시작한다. `.superpowers` 로그·캡처·private빌드·프로필/비밀설정/원장은 Git 인계 대상 아님.
- 예전15% 자동중단은 해제였으나 이번 사용자 명시 인계·중단 요청이 우선한다. 새로운 구현을 더 하지 않는다.

Git전송/VercelReady/실Preview는 별개로 확인한다. 접근거부 시 인증 우회·임시링크·운영승격 없이 미확인으로 보고한다.
