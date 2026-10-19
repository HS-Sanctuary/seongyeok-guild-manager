# IRIS 플로팅 종료·창모드 설정 — 2026-10-18 로컬

## 요청·설계

한설이 직전 후보를 정상 재실행했다고 알려왔고 설정 다음 종료 아이콘과 창모드에서도 플로팅할지 고르는 설정을 요청했다. 기존 흐름을 확장하는 제한 작업이며 앞선 추가확인 없는 구현 지시를 유지했다. 직전 재실행 보고를 새 기능 실검증으로 간주하지 않는다.

- 순서: 크로노스 → 시낙시스 → 에르곤 → 설정 → 종료. 전원 SVG와 기존 펼침/좌우 배치를 사용한다.
- 종료는 기존 `requestClose`에 연결한다. 미저장 선택/중복 요청/업데이트·생활작업 보호와 native Decision 확장을 유지하며 강제종료는 하지 않는다.
- ‘게임 창모드에서도 자동 플로팅’ 기본 꺼짐, 켜면 즉시 적용/재실행 복원. 전체화면 자동 플로팅은 유지한다. ‘전체 작업창’으로 펼친 뒤 같은 frame으로 다시 접지 않고 다음 전체화면 전환/재실행에는 자동 설정을 따른다. 직접 최소화의 수동 플로팅은 별개다.
- 로고 크기·키캡·드래그 경계·좌표/게임행동·원장/DB/API 권한은 유지한다.

## 구현·호환

- Hub/Settings/Icons와 page: 종료 콜백/비활성화, 새 체크박스, 구native 정상재실행 안내. 기존 기능창을 재사용한다.
- `FloatingLayout`은5번째 실제 hit region과 작은영역 간격보정, 기존DPI/게임client검사를 사용한다.
- `FloatingPreferences.WindowedFloating`과 Presentation 정책으로 자동/수동을 분리하고 초기화/변경에 동일 적용한다.
- bridge는 정수4필드 또는 정수4+boolean1의 정확한 payload만 허용한다. 임의필드/문자열boolean/추가필드는 소유자에 도달하지 않는다.
- 같은 `window-floating-v1.json` 경로의 내부version2로 저장하며 v1의 위치·크기·키·투명도를 읽고 새 설정만off로 기본화한다. 손상 원본은 보존한다. 이전 native로의 역방향 파일 호환은 주장하지 않는다.
- browser는 구4/new5메뉴와 optionalboolean을 검증한다. 구host는 영역 없는 종료를 숨기고 새설정은비활성+재시작안내. 구4필드설정변경은 새host에서 이미 저장한 창모드설정을 지우지 않는다.

## 검증·실패 기록

- RED: parser가새설정/5메뉴거절, native정책메서드·5영역·저장필드부재, 실제합성React의종료없는4개목록. 구현후GREEN.
- 새 `iris-floating-controls.browser.mjs`: 설정뒤종료/콜백1회/중복비활성, 창모드on/off/다른설정수정중보존PASS. 실컴포넌트+합성IO이며 실계정·게임0. 메뉴/설정스크린샷직접확인.
- native floating정책: bounds/단축키/손상원본보호, v1→2이전/새설정재시작저장/5hit영역/DPI모서리PASS. presentation 자동/수동/같은frame override/전체화면왕복PASS.
- host chrome56PASS: 이전게임경계48개+창모드즉시적용/명시전체작업창/legacy설정보존/재시작복원/resize edge숨김/끄면normal복원. addon82/workspace-dockingPASS.
- bridge 구/신payload·잘못된입력무부작용PASS. 첫fixture의별도Add-Type익명타입이름충돌은test helper를Dictionary로바꿔PASS.
- Node578/575PASS3기존skip0fail, 독립tsc/변경TS·TSX eslintPASS, 비공개nativecompile exit0(공개ZIP복사없음). 기존실React플로팅/설정/드래그/Escape·숨긴Center편집유지·늦은응답회귀PASS.
- 샌드박스임시저장실패/합성브라우저localhost ACCESS_DENIED는 동일코드전용fixture권한재시도PASS. 사용자설정/실세션/게임접근0.
- 독립검토C0/I0/M0. reviewer는parser8/presentation/diffcheck를확인, native fixture의File.InternalMove 접근거부를소스변경없는진단으로격리했다. 실제게임창전환/DPI·다중모니터/설치앱재실행/실제종료대화조작은판단보류, 미검증으로유지한다. 재검토없음.

## 적용 상태

로컬후보, 새commit/push/운영버전/공개ZIP/공지·DB변경없음. 최초마감시실행IRIS강제종료/재시작0. 한설이종료를알려준뒤부재·개발page200확인, 13:59:56KST 정상Development14952를한번시작/Respondingtrue·stderr0확인. 종료·창모드native적용후보이며 사용자실조작확인은별도다. 경로: 로고→설정다음종료, 설정→플로팅아이콘→게임창모드에서도자동플로팅. 이후새추천위치/키캡native잘림피드백은별도QA를따르며 latestnativeclip은아직이PID에미적용이다.

기존label Region잘림/legacy캐릭터backdrop·구locator실패/기존Synaxislint 등은 이번해결로표시하지않는다.
