# ERGON 자동 작업 — 시작 전 안전 점검 실행 기록

## 2026-10-13 현재 체크포인트

- Task 1: 고정 CLI 4종, 정책·120초 nonce·승인 뒤 재조회·DPAPI 원장/전역 파일잠금·단일 명령 후 결과 관측을 합성 시험으로 구현. 실제 게임에서 소비 명령을 시험하지 않았다.
- Task 2: bridge/client/IRIS 단일 동작 UI·상태/기록을 구현. 최종 독립 리뷰의 업데이트 충돌, 내부 탭 이탈, 재시작 후 미확정 이력, 숨김 뒤 결과확인, 채집 초과/첫 생산품 수량 문제를 수정하고 관련 합성 검증했다. OS/실게임 실행 검증은 별도다.
- Task 3: 5명령·날개25개 계획 미리보기와 완료 후 잔여 계획 갱신만 구현. 자동 다음 명령 전송/재시작 자동 재개는 없다. 아래 Task 3의 자동 상태 기계 연결 체크박스는 **미완료**다. 사용자는 매번 새 준비와 두 단계 확인을 해야 한다.
- 아직 없음: 전체 BOM, 가방 부족분과 Chronos 카드 연동, 일반 채집/낚시, 시설 최대 슬롯·50% 완료 수령/빈 자리 보충, 실제 게임 비용/결과 확인, 완료 푸시 알림. 미확정 원장은 자동 해제/재시도하지 않는다. 공개 버전·운영·ZIP·게시 변경 없음.

한설 ‘남은 사용량동안 PC 구현 최대한’ 승인 범위에서 조회·계획 다음 단계로 진행한다. 기준 설계는 2026-10-13-ergon-life-manager-design.md. 직접 구현, 게임에 실제 명령을 실행하는 검증은 별도 선택 대상/소모 한도 확인 전 금지.

1. 순수 시작 전 검사 모델/TDD: 최신 활동·무게·날개, 동명/미지원 품목, 잠김·실행 중·불명 기록, 게임 신원 미확인, 고정 날개5 비용을 검사한다. 전부 정상이어도 이것은 dry-run이지 실제 시작이 아니다.
2. 에르곤 자동 실행 화면의 ‘시작 전 점검’에 읽기만 연결한다. 불완전 BOM·낚시 구분·시설별 최대slots 때문에 전체 계획 자동 시작은 아직 활성화하지 않는다. 현재 생텀 선택과 게임 신원을 혼동하지 않는 확인 안내를 유지한다.
3. 다음 native 소비 명령 단계는 보호 원장 atomic/DPAPI, 단일 잠금/nonce/재생 방어/사전 native 재조회/실행 결과 확인부터 구현한다. accepted.error/timeout/끊김은 unknown으로 남겨 자동 재시도하지 않는다. 원장과 닉네임 확정·낚시 구분 없는 상태에서는 브라우저 실행 버튼을 열지 않는다.

현재 진행: 1~2 시작 전 순수검사/실제읽기UI 연결·합성검증 완료. 3의 DPAPI 보호원장 기반클래스/시험만 구현하고 아직호스트·브라우저에연결하지않았다. 기록은다음Begin에서30일경과완료분을정리하며미확정은삭제하지않는다. 최종독립검토의LocalMutex세션경계문제를배타filelock으로교체한다. native소비명령/nonce/결과확인/큐/Stop은미구현이다. OR3%에서 정확한 미완료 인계/기능 브랜치 정상push. 공개버전 변경/운영 배포/신규공지 없음.

## 할당량 초기화 후 Step3 실행 세부 — 2026-10-13

기존서면설계·이계획Step3을사용자가‘전부구현’으로재개승인, 직접구현을유지한다. 5h잔여15%에서새구현중단·검증/인계한다. 미래의미확인시설·BOM을추측하는것은승인아님.

### Task 1: native사전검증/intent·nonce/보호원장연결

**Files:** create iris/desktop-life-executor.cs,iris/desktop-life-executor.tests.ps1;modify iris/desktop-life-journal.cs,iris/desktop-life-read.cs,lib/irisErgonRead.ts and nativecompilelists.
**Interfaces:** DesktopLifeExecutor(journal,readKind,currencyRead,perform,confirm,allowed,epoch,clock). PrepareAsync intent정확히accountId/characterId/action/displayName(4키),actioncollect/altering/crafting/gathering enum. challenge nonceGuid/expiry120초/epoch/표시이름/현재목록조건/동일시설완료목록/날개5혹은미확인. ConfirmAsync payloadnonce1키, native부모창확인(생텀선택≠게임실제명명)/승인뒤재조회, journalBegin성공후에만fixedCLI. 취소/만료/문맥변경에는명령0. unknown는재시도/후속작업차단. activity에는abyssSequence/interactionType추가해누락차단.
- [ ] RED native실제커널:잘못된종류/추가필드/이름·수량/foreign계정nonce재생/만료/epoch교체/중복동시/ConfirmNo/원장실패0perform;accepted.error/시작후끊김→unknown;alterstarted→registered;재조회무게/날개/활동바뀜→0perform.
- [ ] GREEN 고정이름공식목록검증,도구/가공제작가능true·단일회/craftCount1,JSON역슬래시quote안전인자/고정exe. reader8초와분리,소비명령timeout은결과unknown이고gameStop강제kill과혼동금지. collect고정날개·gather낚시구분미확인은자동큐금지/제한표시.
- [ ] Verify powershell -NoProfile -File iris/desktop-life-executor.tests.ps1,기존journal/reader회귀PASS,임시fakeCLI1MiB/quote/timeout·권한거부(실제게임명령0). localcommit.

### Task 2: fixedbridge/client/실행확인·이력 UI

**Files:** modify iris/desktop-bridge.cs,iris/desktop-webview.cs,lib/irisDesktopStore.ts,app/iris/desktop/page.tsx,components/iris/DesktopErgon.tsx;create components/iris/DesktopErgonExecution.tsx,lib/irisErgonActions.ts,tests/iris-ergon-actions.test.mjs,tests/iris-ergon-actions.browser.mjs.
**Interfaces:** game.life.actions.capabilities null→schema1/supportedActions;game.life.prepare 정확4필드→challenge;game.life.confirm nonce→receipt;game.life.history accountId1필드→해당계정기록+전역blocked. nativeepoch/origin/id/1flight기존검증공유. cancel은준비취소/다음명령차단만,stop_action generic노출없음. parentonBusyChange가추천/계정전환/업데이트를중단·native종료중게임명령미발송. 기존읽기7종cap변경없음.
- [ ] RED 채널명령allowlist/extra필드/구앱/권한/브리지replay·도중문맥전환·UI모달취소·스마트이름긴문구·승인중첩·이력조회다른계정비노출·unknown차단이실제컴포넌트로재현.
- [ ] GREEN 별도실행컴포넌트,신원확인/정확품목/소모범위/등록≠생산완료·unknown안내/native최종확인. UI로재고를실행성공처럼변조하거나과거준비nonce로재시도하지않음.
- [ ] Verify 실제320/390/720pt·6테마/키보드·Escape/밖클릭/작업중잠금/closure회귀,node전체/tsc/lint/nativefixture/격리build/패키지PASS. 마지막freshreview1회,Important만RED→GREEN한번수정.

### Task 3: 검증된 단일 동작의 제한 대기열

**Files:** create lib/irisErgonRunQueue.ts,tests/iris-ergon-run-queue.test.mjs;modify 실행UI.
**Interfaces:** 현재단일실행의confirmedreceipt만소비. 최대5명령/날개25,다음작업정지·시간한도는다음시작차단만,재시작자동재개금지. 중복의도/낚시·미확인BOM·미확인collectcost·시설정원불명은자동큐차단. unknown/등록불명/비관측작업은다음의존계획정지. 범용shell/게임키조작없음.
- [ ] RED 5/6·25/26·도중중지·선택변경·unknown·미관측등록·중복·다른게임행동·늦은비용수신을시험한다.
- [ ] GREEN 순수state기계와원장성공·각native사전검증을연결,완료결과확인전후속발송0.
- [ ] Verify 전체회귀/서로다른실제시설승인시험은사용자대상·비용한도확인후,보고는합성/실게임을분리한다. 공개배포·BOM/Chronos연동은검증된기능만후속통합.

### 검토 초점/판단

- 살아있는2번째host가원장을재구성하면첫hostinflight를unknown으로바꿀수있음: executor인스턴스1개/별도process실행mutex유지·동시2인스턴스시험(Task1).
- 소비CLI완료시간과WebView응답시간차: jobstate/poll,브라우저타임아웃≠재시도허가(Task2).
- 질문창동안게임캐릭터/활동/epoch변경:재검·nonce폐기(Task1).
- reward숫자를필요재료로취급·gained없이completed처리:관측·receipt파싱(Task1/3).
- 준비와실행UI가살아있는처음source를HMR로교체:기존close복구/네이티브지원cap·경고·원장승인상태를확인(Task2).
