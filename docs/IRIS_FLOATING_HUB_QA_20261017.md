# IRIS Floating Hub — 로컬 후보 QA (2026-10-17)

## 2026-10-18 괄호 제거·좌우 축소

- 한설 요청으로 사용자 키캡/설정안내는 `Alt + ~`로 표시. 공통 순수caption함수만 사용하고 bridge의 기존 `(Alt + ~)` 검증·실제Alt+백틱·등록설정은 그대로 보존했다. React 점검: 추가state/effect/IO 없이 두 표시부가 같은 formatter를 재사용한다.
- native 문구폭에서 괄호2글자 몫18DIP을 빼 기본97→79DIP. 높이28/로고52 및 사용자크기값 유지. DOM/순수caption/native폭 RED→GREEN, 18/20/22 안잘림/모서리·DPI/chrome33 및 기존floating메뉴·설정·드래그 PASS. Node576/573PASS3기존skip0fail·타입/scopedlint0, 캡처눈검증. 폭까지완전반영은정상재실행필요/강제재시작0. 새push/게임행동/DB변경0.

## 2026-10-18 키캡 참고 비율 재조정 — native 재시작 필요

- 한설이 거의 동일한 모양을 재요청. 기존20DIP 키캡 틀이 글자크기/여유를 제한해 높이28DIP, 기본97DIP폭(참고문구 길이 기반), 밝은2px테두리/더큰 둥근굵은글자로 조정했다. 로고 크기/설정값·실제Alt+백틱과 `(Alt + ~)` 표시 유지. 긴 사용자단축키는폭만늘리고작업영역내보정.
- 큰글자/테두리 실제DOM RED→GREEN, native 큰글자공간/모서리/DPI RED→GREEN.18/20/22 글자안잘림·52로고유지, nativechrome33PASS·전체Node572PASS3기존skip0fail·시험lint/privatecompile exit0. 최종캡처 눈검증. 게임행동/DB/새push0.
- 이번은 CSS뿐 아니라 native Region/창 경계도 변경한다. 기존 실행중 앱은 정상재실행 후 새높이가 완전히 적용된다. 강제종료/자동재시작은 하지 않았고 실제 사용자 새높이 확인은 미검증. 아래 재시작불필요는 앞선 CSS-only 조정 시점이다.

## 2026-10-18 키캡 시각 후속

- 한설 첨부 Ctrl+Z 참고에 맞춰 키캡만 진한 차콜/밝은 둥근 테두리/굵은 흰 글자로 조정했다. 아이콘 크기·좌표/키캡 native영역·실제단축키·저장 설정 변경 없음. 기본 `(Alt + ~)` 유지. CSS만이라 native 재시작 불필요.
- 새 실제DOM 대비/모서리/글자폭/52px로고보존 시험은 굵기 RED→GREEN.18/20/22에서75×20영역 안 글자 잘림0. 실제main 래퍼 누락으로 처음 캡처가 비어 fixture를 실제구조로 맞췄으며 최종 캡처 눈검증 완료. 기존 floating 메뉴·설정·드래그 시험 PASS, 전체Node572PASS3기존skip0fail. 기존 미해결Minor/실사용미확인은 별개다. 새push/운영배포0.

## 2026-10-18 재개 결과 — Important2 수정 / 실제 사용자 확인 별도

- 한설의 계속 구현/추가확인 불필요 지시로4234e54부터 재개. 새 push·운영배포 승인으로 확대하지 않았다.
- I1: 실제 provider 시험에서 숨김 도착의 소리 선재생 RED. document.visibilityState와 새 native windowVisible을 모두 확인한 뒤 첫 표시/소리/10초 시작. 이미 표시된 알림은 숨김 중에도 기존 deadline 보존. 숨김15초→복귀 최초10초/숨김 중 만료/native만 숨김 회귀 GREEN.
- I2: 저장 compact=true의 실제 Form 생성→Show에서 resize edge 잔존 RED. 초기화/전환에 같은 accessory visibility 함수를 적용. Browser.Bounds==ClientRectangle, 일반복귀 edge 복원·실제 표시/숨김 revision까지 native chrome33PASS. 사용자 프로필/브라우저세션은 쓰지 않는 전용 fixture다.
- 표시 DTO의 optional windowVisible은 bool만 허용, 누락된 옛 floating host는 document 가시성으로 호환. native VisibleChanged/Resize에서 같은 versioned event/revision에 반영한다. 게임 bridge 변경 없음.
- 전체 Node575/572PASS3기존skip0fail, 타입·수정 scoped lint exit0. 정책/presentation/workspace/startup-close/WebView/bridge PASS. 새 visibility 및 기존 bubble/character-floating/floating/integration/ERGON-edit 실제 React 회귀 PASS. 격리webpack 및 private nativecompile exit0를 이번 회차 직접 확인했다.
- 초기 sandbox의 loopback network denial·temp 저장·junction EPERM은 같은 명령을 정상 권한으로 재실행해 통과했다. 제품 오류와 구분한다. ERGON 시험 최초 argv 누락도 기존 런타임 경로 지정 후 PASS.
- 기존 legacy manual-intent-cancels-pending-yes는 격리 전체페이지에서 재실행해 동일 backdrop pointer 차단 실패. 구 iris-desktop-ui outside-title locator/기존 Synaxis lint2오류1경고는 미수정. 일반 전체browser/lint 성공으로 표현하지 않는다.
- **남음:** Minor1 한글 menu label의 native Region 밖 잘림은 보류. 실제 게임 전체화면/키충돌·DPI·모니터이동·바깥게임클릭은 미검증. 원본unknown·실게임 비용/이동중 사용자편집 미확인 보존.
- 새 개발 서버6132/로컬페이지200 확인→기존 IRIS0 재확인→Development3156 한 번 시작. 정상 권한 메타데이터에서Responding=true/자체stdout·stderr0바이트 확인. 눈으로 본 native 성공/게임수령 검증을 뜻하지 않는다. 게임 행동0. 로컬 주소 http://localhost:3000/iris/desktop.

아래 C0/I2/M1 미해결/사용자중단은2026-10-17 시점의 경과다. 최신은 중요2수정·Minor1보류이며 전체 출시완료는 아니다.

## 최종 인계 판정 — 미완료

한설이 사용량 사유로 새구현 중단/인계push 요청. 독립리뷰 C0/I2/M1은 미수정: 숨김중 새알림 수명소진, savedcompact 초기resizePanel, nativeRegion 밖 menu label. 자세한 경로/수정순서는 `docs/IRIS_FLOATING_SOONWOL_HANDOFF_20261017.md`. 새 native실행0, 실제전체화면·키·DPI 미검증. 아래 push없음/재검증대기는 당시 경과다. 최신 최종build 로그 산출물완료는 확인했으나 종료코드 재조회불가이므로 최신회차exit0 재확인으로 표현하지 않는다.

영겁. 운영 배포·push·공개ZIP·버전 변경·게임 명령·운영 DB 변경 없음. 사용자 개인 dirty 보존.

## 구현

- 독립 일반창 bounds/플로팅 anchor, 화면 경계/DPI 어댑터, 표시 요소만 native Region에 포함.
- 원형 기존 IRIS 마크·반원형 기능 메뉴·펼침/reduced-motion, 기본 Alt+백틱 실제 키와 `(Alt + ~)` 아래 키캡.
- 설정: 로고36~80 DIP/기본52, 불투명도35~100%/기본80, 조합/키 변경·기본값 복원. 새 키 등록 실패 시 이전 키 보존, 손상 파일 덮기 금지.
- 버전/epoch/environment/revision 검증. 늦은 열기 응답으로 닫힌 창을 다시 열지 않음. 기존 모듈은 복제/재마운트하지 않음.
- 일반 정보는 실제 표시부터10초/진행 바/비차단. 캐릭터 후보는 명시 확인·신선도 재검증 유지, 자동 만료 없음. 접기 후 다시 열기.
- 심층 목록에 지명·개수·제보자·시각, 새 제보 한 번만 안내. 초기 조회/재접속은 목록 baseline, 삭제/주기 만료는 대기 알림도 회수.

## 확인 결과

- 기준 Node565/562PASS/기존3skip. 최신 전체 Node574/571PASS/기존3skip/0fail.
- native 순수 정책: 독립 bounds,96/144/192DPI·음수/모니터 제거·사방 모서리·버튼 비중첩·손상 원본·가짜 키 registry PASS.
- native chrome24(일반30%=alpha76/플로팅80%=alpha204 독립성 포함), startup-close, 실제 격리 WebView의 세션/HttpOnly/출처 차단 PASS. 실제 사용자 창/게임 화면 검증과는 다름.
- 실제 React: 로고/키캡/메뉴/설정·드래그·Escape PASS. real hook+Hub+Center의 지연 응답/편집 값/마운트 수 보존 PASS.
- 가짜 시계:10초/게이지/비차단/캐릭터60초 무만료·접기/다시 열기 PASS.
- 가짜 Supabase: 첫 snapshot 목록만, 신규 알림1회/소리1회, 재접속 재생0, DELETE 목록·알림 삭제, 읽기 최대4회 PASS. 실제 운영 제보 전송0.
- 기존 에르곤 이동 중 편집/숨겨진 종료 관측/고정 접수ID·수량·진척/추가 요청0 PASS.
- 기존 콘텐츠 카드/소리 OFF/제보 중복 제출 보호, 파티 참가·버스 편집·초안 보존·Realtime/4폭·3글자 크기 PASS.
- TypeScript 독립 검사 PASS. 신규/연계 파일 scoped lint PASS(아래 기존 Synaxis 오류 별도).
- 비밀 설정 없는 격리 Next webpack build PASS, private native EXE/ZIP compile PASS. 최신 변경 후 최종 재검증 대기.

## 남은 실패·실검증

- `DesktopSynaxisSurface.tsx`의 기존 effect setState2건/불필요 dependency1건은 변경 전 git 소스로도 같은 ESLint 결과. 이번 작업의 새 lint 오류와 구분한다. 루트 lint는 이전 생성물 대량 오류 이력 때문에 실행하지 않고 변경 파일을 명시 검사한다.
- `iris-character-switch.browser.mjs`:22개 시나리오 PASS 뒤 `manual-intent-cancels-pending-yes` 실패. legacy native(새 floating 미지원) 경로에서 확인 중인 modal backdrop이 배경 캐릭터 선택 클릭을 차단한다. 테스트를 삭제하거나 보호를 풀지 않았다. 신규 비차단 캐릭터 렌더 경로와 구분해서 보고한다.
- 기존 `iris-desktop-ui.browser.mjs`의 제목 뒤 클릭 locator 문제는 실제 backdrop pointer 대조가 남았다.
- 사용자 앱의 실제 Alt 키·투명도·Win32 Region 바깥 게임 클릭·다중 모니터/DPI/전체화면 반복은 정상 재시작 및 눈 검증 전이다. 합성 시험 성공을 실제 검증으로 바꾸어 적지 않는다.
- 과거 금속 unknown 기록, 실제 수령 비용, 이동 중 사용자 편집 실시험의 미확인은 그대로다.

## 알림 분류

| 경로 | 처리 |
| --- | --- |
| 필드보스·결계·어비스·심층 정보 | 공통10초·게이지·중복/만료 방어 |
| 시낙시스 일시 안내 | 공통10초, 구 단독 fixture도10초 |
| 캐릭터 후보 확인 | 무기한 선택, 기존 재조회/계정/문맥 검증 유지 |
| 실행 동의·종료·저장 손실·원클릭 허용 해제 | 선택 필수, 자동 승인/만료 없음 |
| 조회 오류·unknown·저장 내구성·불명 결과 | 작업 상태/보호 안내로 유지, 알림 만료와 독립 |
| 스탯 결과·허용 해제 결과·업데이트 진행 | 해당 화면의 작업 결과 상태, popup 알림 아님 |

알림이 오래 대기해 의미를 잃으면 표시하지 않는다. 대기 유효기간과 이미 나타난10초 deadline은 분리하며, 삭제/주기 초기화는 명시 회수한다. 캐릭터 후보가 선택 필수 창을 가리지 않으며 큰 확인 대화가 필요하면 일반 작업창으로 복귀한다.
