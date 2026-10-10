# IRIS 물물교환·집중 UI 구현 계획

Spec: `docs/superpowers/specs/2026-10-09-iris-barter-focus.md`

## 공통 제약

현재 브랜치/폴더에서 진행한다(한설의 기존 명시적 선택). 기존 미커밋 변경/릴레이를 보존한다. 운영 DB/스키마/권한/배포 변경과 게임 조작 금지. 범위별 테스트 먼저 RED→GREEN, 최종 한 번의 교차 리뷰. 매 작업 전체 저장소 검증 대신 한설이 요청한 영향 범위 검증을 한다.

## Task 1 — 물물교환 저장 계약

담당: barter_contract. 새 모델/인증 API/컨트롤러/보호 큐/전송/표시/네이티브 검증과 새 DesktopBarter를 소유한다. page/Center/desktop.css는 수정하지 않는다.

Interfaces: DesktopBarter는 현재 캐릭터 detail의 물물교환 값·pending·locked와 `onEdit`를 받고, 컨트롤러는 `editBarter`를 제공한다. props와 데이터 계약을 구현 전 공유한다. GET/POST는 세션 소유권과 카탈로그 범위·기간·한도를 서버 검증한다. 계정당 감소/중복/부분 성공/기간 변경/unknown 복구·v2 큐 보존 테스트를 먼저 실패시킨다. 관련 Node/native 테스트 GREEN이 예상 결과다.

## Task 2 — 직접 계정 선택

담당: account_focus. DesktopTitlebar/Icons/AccountPanel과 새 scoped CSS·테스트만 소유한다. page는 부모가 연결한다.

Interfaces: titlebar `onAccount`/`accountOpen`; panel은 열렸을 때 기억된 계정 목록과 로그인/로그아웃을 즉시 표시한다. 포커싱 공통 대화상자가 필요하면 별도 파일로 제공하여 Task3도 재사용한다. 버튼/직접 전환/실패 유지/바깥 클릭/Escape/초점 복귀를 RED→GREEN으로 검증한다.

## Task 3 — 높이·추천 시인성

담당: focus_ui. DesktopClasses/CharacterWatch와 새 scoped CSS·테스트만 소유한다. Center/desktop.css는 부모가 연결한다.

Interfaces: 클래스 pane 높이 전달에 필요한 Center 클래스/props를 공유한다. 추천은 기존 stale context/재확인/거절 로직을 보존하고 중앙 dialog로 감싼다. 소리 중복·키보드·중앙 위치·클래스 남은 높이 회귀를 RED→GREEN으로 검증한다.

## Task 4 — 통합·문서·검증

담당: 영겁. page/Center/desktop.css 통합, DECISIONS/HANDOFF/MASTER/BETA_FEEDBACK/발신 릴레이 갱신. 영향 범위 Node/type/lint, 격리 localhost3001 DOM(native·API 합성, 원격 차단) 검증 후 밝음/어두움 캡처를 눈으로 확인한다. 독립 리뷰 1회, 중요 발견은 재현 테스트와 한 번의 수정 패스로 닫는다. native 저장 형식 변경 시 사용자 정상 종료/재시작 전 구 앱은 물물교환 편집을 활성화하지 않는다.

## Review Focus

계정당 감소 때 높은 이전 사본 부활, partial CAS 후 잘못된 saved 판정, 새 캐릭터/기간 변경, old native 큐 격리, 잘못된 계정 응답·미저장 데이터 소실, 추천의 늦은 응답/반복 소리/OS 포커스, 다중 dialog 겹침/키보드 이탈, 짧은 창·12자 닉네임·가로 스크롤을 점검한다.
