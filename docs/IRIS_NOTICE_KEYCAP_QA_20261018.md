# IRIS 추천 위치·키캡 모서리 후속 — 2026-10-18

## 피드백과 원인

한설이 새앱을보고 일반창 추천이맨아래로내려감, 플로팅 Alt + ~ 테두리밖뾰족한모서리잔존을사진제보했다. 앞선종료/창모드자동설정은유지하며두결함만수정한다.

- 추천위치: normal모드의 `.iris-floating-notice`는모든알림을bottom fixed로표시하므로 캐릭터선택status위치에서등록한추천도긴창맨아래로이동했다. 합성390×1330화면에서y상단조건실패로재현.
- 키캡: CSS테두리는둥글지만 native `CreateRegion()`은Badge전체사각형을Union하여 테두리밖사각모서리도실창영역에남았다. 실제GraphicsRegion의cornerIsVisible=true를확인했다.

## 수정

- provider View에현재floating여부를전달한다. normal이면 `DesktopCharacterPrompt`가원래캐릭터status자리에서추천Host를inline표시하고, floating이면globalLayer에서native bubble영역에표시한다. 중복표시/자동선택없음. 일반정보알림bottom/10초·캐릭터계속유지/접기/재열기규칙변경없음.
- BadgeRegion을9DIP roundedGraphicsPath로변경하고CSS도9px의동일논리반경으로맞췄다. CSS폰트크기에따른모서리반경불일치를방지하며로고/키캡폭79·높이28/단축키/글자설정은그대로다.

## 검증

- 새위치실React시험 RED→GREEN: 일반창selector아래/플로팅bubble전환/추천한개/클릭한번만선택. 실제입력/계정/게임0. screenshot직접확인.
- native순수정책RED→GREEN: 좌상/우하모서리outside·상단중앙테두리inside. 기존DPI/설정이전/5메뉴회귀PASS. 합성hostchrome56/privatecompilePASS.
- 기존실ReactCharacterWatch의수동의도후늦은Yes취소/비모달, 알림10초progress·캐릭터60초유지/접기/재열기PASS. 타입/해당TSX eslintPASS.
- 독립검토C0/I0/M0, reviewer의96/144/192/288/384DPI corner/상단중앙합성검사PASS·diffcheckPASS. 실제게임/DPI·설치앱모양판단보류. 첫전체Node는578/574PASS3skip1fail: `bus-live-notifications.test.mjs`의 `duplicate full events stay quiet but a fresh readiness episode and next round notify again` expected2/actual1(130줄). 이번수정과무관한파일이며 원인확정/수정하지않았다. 동일파일단독25/25재시도PASS, 최종전체재실행결과는후속. 기존Synaxislint/legacy캐릭터backdrop·구locator/기능label Region잘림·실mixedDPI는별개미해결이다.

## 적용

2026-10-18 15:39 KST 후속: 한설의 정상종료 확인 뒤 기존 IRIS 부재·개발 page200을 확인하고 최신소스 Development28168을 한 번 정상 시작했다. Responding=true/stdout0·stderr0. native 둥근키캡 후보까지 적용했으며 실제게임 위 모양/추천 위치·종료·창모드설정 사용자확인은 대기한다. 아래 재시작대기는 당시 경과로 보존한다. 강제종료/게임행동/DB·push0.

최종전체재실행:578/575PASS3기존skip0fail. 위첫간헐실패는보존하며원인해소로표시하지않는다. 최종diffcheckPASS. 한설에게latestnative적용을위한정상종료만요청한상태이며아직강제종료/추가재시작하지않았다.

종료·창모드후보는한설정상종료확인뒤13:59Development14952로재실행, stderr0/응답true/page200. 추천위치는개발화면HMR, 새native키캡잘림은다음정상재실행필요. 강제종료/사용자설정조작/게임행동·원장/DB/새push·운영ZIP변경0.
