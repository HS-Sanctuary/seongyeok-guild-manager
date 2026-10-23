# IRIS 플로팅→사이드바 핫픽스 후보 — 2026-10-23

기준 main b0b63c7 / 운영 IRIS0.4.2. 브랜치 codex/iris-floating-sidebar-043-20261023. 한설 승인 범위는 별도 hotfix 구현·검증·기능브랜치 일반push까지다. 운영main/Production/새설치본 공개는 최종승인전 금지. 배포 시 제안버전은0.4.3이며 현재 lib 버전/공개 ZIP/metadata는0.4.2를 그대로 보존한다.

## 변경

DesktopFloatingHub의 설정 아래/종료 위에 `사이드바로 전환` 접근성명·title과 왼쪽 사이드바 창 SVG를 추가했다. 기존 normal 명령만 호출한다. native FloatingLayout은6개 원형 영역을 만들고 작은 높이에서는 크기를 제한해 겹침/끝부분잘림을 막는다. CreateRegion은 기존 ellipse 합집합을 그대로 사용한다. parser는4/5/6개 호스트를 지원한다. 4/5개 구호스트에는 없는 슬롯의 신규 버튼을 그리지 않는다. 기존 normal/floating host 전환 엔진·프로필·계정·저장·원장 소스는 수정하지 않았다.

## 검증

- RED: 신규6개 parser 및 native menu count 실패. GREEN: parser10시험/native layout·region·설정저장·단축키/복원 PASS.
- native:96/120/144/192 DPI(100/125/150/200%),320/390 포함 작업영역·4모서리/화면밖 anchor·36/52/80 아이콘. 버튼간 overlap0,작업영역내 bounds,원형센터 클릭/투명모서리 비클릭. 실제 사용자 Windows 모니터/게임 위 수동시험은 미실시.
- 실제 React+합성 bridge/hook:6버튼순서/normal복귀/플로팅재진입·설정·종료별도1회/동일 workspace mount1·편집초안/캐릭터표시보존·320/390 버튼bounds PASS. 일반부모nav가 box가 없다는 fixture wait 문제 및 합성panel의 잘못된 logo겹침을 시험에서 정정했으며 제품결함으로 숨기지 않는다.
- 전체 Node618 /615PASS/기존3skip/0fail. 독립타입 검사 PASS. 기존 header/save-strip/save-overlay/focus/public-lock 및 scoped lint 결과는 최종 실행 출력을 따른다. native presentation의 자동/수동복귀·override·설정 회귀 PASS.
- 실제 native 설치본에서 버튼을 눌러 게임 위 동작을 확인한 것은 아니다. native layout과 기존 presentation, React command/상태 전환을 분리 검증했다. 새설치본/ZIP생성·공개·실게임 명령0.

## 보존/다음

집 원본 개인12항목 및 별도 ERGON N-R1/U-R1 미커밋/ACK는 원래 위치에 그대로 남긴다. 미공개ERGON 기능브랜치 이식0, 공개lock/DB/main 유지. 이 브랜치를 기능브랜치 전체와 병합하지 않는다. 최종승인 뒤0.4.3 버전/notes·native컴파일·패키지/업데이트호환·공개해시를 함께 검증하고 공개해야 한다. 현재 후보 push를 운영배포완료로 보고하지 않는다.
