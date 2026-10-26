# ERGON B — native 읽기 전용 관측 연결·자동화 판정

기준: 2026-10-26 KST / 영겁. 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`, 수신 HEAD `ba0374676d593a88118f226b3737603de9557db8`. 이번 제품/시험은 **로컬 미커밋·미전송**이다. 실제 게임/CLI 조회·사용자 원장·운영 변경은 하지 않았다.

## 실제 구현한 연결

`DesktopLifeReader.ReadAsync` → 신규 `DesktopLifeEvidenceProvider` → 고정 `game.life.evidence.read` → `createDesktopStore.readErgonNativeObservation` → 신규 strict 읽기 모델/기존 `assessErgonReadOnlyEvidence`.

- native payload는 accountId/characterId/targetName 세 필드만 받는다. 브라우저의 raw response·source·정원·비용·명령 문자열은 받지 않는다. native 공급자가 환경·현재 문맥/document/contextVersion·actor 상태를 직접 읽고 조회 전후 대조한다. 다른 소유권·A→B→A·늦은 상태 변화는 결과를 거절한다.
- materials/inventory/altering/works는 기존 reader·정규화 경계를 재사용한다. 가방/공용·캐릭터 창고/잠김 재료를 합치지 않는다. 레시피의 missing 목록은 확인된 부족 정보이지 완전한 재료표가 아니다. 중복된 동명 작업 행도 그대로 보존하며 ID를 만들지 않는다.
- unknown/busy에는 추가 조회 없이 상태와 null 자료를 반환한다. 개별 조회 실패·오래됨·전체 예산 부족은 null/기계적 사유로 표시하고 0 또는 성공으로 바꾸지 않는다. 오류 원문/개인 경로는 반환하지 않는다.
- native 전체 관측 예산은 15초다. 기존 한 reader의 최대8초를 남길 수 없는 시점에는 다음 종류를 시작하지 않는다. 이미 시작한 reader는 끝까지 기다리고 bridge.gameBusy를 유지한다. B 전용 JS 대기는25초다. 부분 관측은 사용 가능하되 자동 실행 근거는 아니다.
- 기존 perform 경로가 이미 받은 collect 응답만 observer로 본다. 제한 flat collected/rewards/criticalRewards와 Name/Amount의 양수 행만 메모리에 분리 보관한다. raw 원문/파일 저장은 없다. 같은 문맥·request·품목에 대해15초 이내 보고만 노출한다. 보고 관측 오류는 기존 실행 응답/terminal 판단을 변경하지 않는다. 미지원 envelope는 null이며 보상 합산/중복 제거·실제 확보 판정은 하지 않는다.
- TS parser는 자료형 검사일 뿐 출처 인증이 아니다. 고정 bridge 응답을 실제 받은 store만 해당 동결 객체를 private WeakMap에 등록한다. 임의 source·원본 packet·clone은 `ownsErgonObservation`을 통과하지 않는다. epoch/문맥 변경 시작 및 지연 응답·오래된 객체도 무효다. 이것은 기존 trusted WebView 채널 안의 객체 출처 구분이며 변조된 renderer에 대한 새 암호학적 보증이나 실행 허가가 아니다.
- 선택된 IRIS 문맥을 대조한 것과 실제 게임 캐릭터 귀속 증명은 다르다. **gameIdentityVerified=false**, 비원자 관측 사유, automaticReady=false/executionAllowed=false/confirmedProgress=null을 유지한다. 실제 B packet을 합성 실행 포트로 넣어도 자동 실행 자료로 바뀌지 않는다.

## A/B/C/D 자동 생산 가능성 결론

| 항목 | A: 현재 코드로 자동 관측 가능 | B: 추가 공식 근거 필요 | C: 사용자 보조 가능 | D: 증거 없으면 소비 차단 |
| --- | --- | --- | --- | --- |
| 재고·레시피 | 읽은 수량/위치/잠김·출력 단위·부족 목록·시각 | 실제 게임 캐릭터 귀속, 완전한 입력표·변경 일관성 | 추가100 목표·품목/예산·화면 보조 확인 | partial missing/선택 문맥만으로 완전 BOM·게임 귀속 확정 금지 |
| 시설 정원/빈자리 | 보고된 작업 행 개수만 | 실제 총정원/가용자리 | 화면 참고·시설 사용 방침 | 행 개수나 실패 탐색으로 정원 추정 금지 |
| 작업 식별/소유권 | 작업명·시설명·상태 | 안정 workId/요청 결합 또는 검증된 시설 단위 독점 배치 | 시설 전체 수령 범위 동의 | 이름·행 순서·IRIS requestId만으로 공식 귀속 만들기 금지 |
| 실제 수령량 | 제한 보상 행을 별도 관측 | 요청/work/delivery별 실제 지급·부분·중복 근거 | 직접 본 이번 추가량을 향후 user-confirmed로 기록 | 보고 행·collected/예상량을 확인 진척으로 승격 금지 |
| 일반/대성공 보상 | 원래 배열과 중복 행 보존 | base와 critical의 가산/포함 관계 | 결과 화면의 수동 추가량 확인 | 의미 확인 전 합산·중복 제거 금지 |
| 채집/가공/수령 비용 | 기존 요청의 역사 잔액/정책 예상치 구분 | 현재 명시 비용/상한·재료·원격 부대비용 | 날개·재료·채집 예산 승인 | 역사 차0·예산 동의로 비용0/실비용 확정 금지 |
| 외부/수동 개입 | IRIS 문맥·actor 변화/unknown 감지 | 외부 개입과 일관성·귀속 근거 | 다른 앱 정지/수동 개입 자제 안내 | 동일 IRIS lease 밖의 개입을 없다고 단정 금지 |
| 시간·멤버십 | 완료 표시·remainingSeconds | 실제 등록 시점·적용 기간·멤버십 배율 | 멤버십/화면 표시를 계획 참고로 확인 | 시간 경과만으로 완료/수령 가능 또는 할인 확정 금지 |

**현재 계약으로 완전자동 채집→가공→수령은 실행 불가다.** 자동으로 연결한 것은 읽기·형식 검사·보수적 차단이다. 사용자 확인은 목표/예산/범위/수동 수량 출처의 보조이지 공식 기계 증거·unknown 해제 권한이 아니다. C의 native round/pending/delivery 저장 및 수동 가공 확인 저장/UI도 이번에 만들지 않았다.

## 검증 근거

신규 시험 파일은 `tests/iris-ergon-native-observation.test.mjs`와 새 프로세스 worker, native fixture/runner다. 모든 CLI 응답은 **fake JSON → 실제 DesktopLifeReader.Normalize → 제품 공급자/실제 bridge**로 주입했다. 실제 ReadAsync의 외부 CLI 실행은 호출하지 않았다.

- 신규8 PASS: native/bridge 정상·다른 scope/문맥/epoch·busy/unknown·실패/오래됨·중복 이름, strict 판정·보상 비합산, 임의 source/clone 비승격, 같은 문서 전환의 예전/진행 중 응답 무효화, manager quote/execute0, pending 새 PID 재복구2회 소비/조회0,10초 초과 정상 응답 수신. native 하위 assertion은 별도로 시험 개수를 부풀리지 않는다.
- 기존 기준선: Node688 중685 PASS/기존3 SKIP/0 FAIL. 수정 후 최종 전체 **696 중693 PASS/기존3 SKIP/0 FAIL**. 목재13/pending9조합/readonly8 및 기존 수량·원장 보호 회귀 포함.
- 실제 React+합성 bridge10 스크립트 PASS: read-planning/workbench-results/page-protection/lifecycle-ack/goal-cancel/goal-cancel-draft/goal-replacement/save-transition/currency-cache/release-lock. 새 공개 화면/실게임 UI 사용 가능을 의미하지 않는다.
- 최종 TypeScript·수정 범위 ESLint·private native 전체 소스 컴파일·비밀 env 미복사 격리 Next 빌드·git diff --check PASS. private package는 ignored 경로이며 실행하지 않았다. 공개 ZIP/metadata는 바꾸지 않았다.
- 초기 native fixture stdout의 VoidTaskResult/문자 인코딩 및 새 webview namespace 누락·TS narrowing 오류는 원인 확인 후 보완했다. 기존 테스트 기대값을 약화하지 않았다.

## 독립 안전 검토 1회 및 실패 재현

Sol High 읽기 전용 **C0/I1/M0**. I1: 순차 최대4조회×8초와 기존 JS10초 대기가 충돌했다.10초 초과 응답의 폐기와 native 예산 초과 추가 호출을 각각 RED로 재현했다. B 전용25초 대기와15초 관측 예산/8초 여유 검사를 최소 보완했고 GREEN을 확인했다. 실제 bridge에서 in-flight gameBusy 유지 및 완료 후 해제도 합성 검증했다. 이후 전체 회귀/타입/lint/native·웹 빌드를 재실행했으며 추가 독립 재검토는 하지 않았다.

판단 유보: 실제 WinForms runtime 스레드/게임 동작, 실제 캐릭터 귀속·다중 조회의 원자성·정원/비용/실수령 귀속, C 저장/전원 손실 내구성은 여전히 미검증이다. 이번 비소비성 B 승인 범위를 넘어서 시험하지 않는다. 과거 S01/N04 normal/최초 수령 간헐 실패와 목표 교체 이벤트의 구 native 역방향 호환 미확정도 유지한다.

## 첫 목재 생산 전에 할 최소 실제 관측·검증 — 제안만

1. 별도 승인받아 최신 공식 metadata/capabilities의 지원 필드를 확인한다. 기존 자료를 우선하며 최신 조회를 한다면 정확 명령/횟수를 먼저 정한다. 이번에는 실행하지 않았다.
2. 실제 게임 캐릭터와 IRIS 선택 문맥을 확인한 뒤, 별도 승인된 읽기 전용 항목(materials/inventory/altering/works 등)만 각1회 관측한다. 현재 구현의 값·누락·정원/식별/시간/비용 정보를 대조하고 원문을 Git/채팅에 올리지 않는다. 선택 문맥 일치나 사용자 진술을 자동 귀속 인증으로 바꾸지 않는다.
3. 수령 응답의 실제 지급/critical 관계는 보유한 본인 자료의 별도 승인된 오프라인 조사부터 진행한다. 새 샘플을 만들기 위한 수령/가공은 별도 소비 승인 대상이다. 근거가 없으면 해당 기능은 unsupported다.
4. C의 실제 native round/pending/delivery 저장·journal 대조·중단/ACK/새 프로세스/소유권 소실 시험을 격리 저장으로 마친다. 동일 root helper 정상 상태의 기존 PASS를 production 안전으로 확대하지 않는다.
5. 필수 근거와 저장 계약이 충족된 뒤에만 최소한의 한 회차를 대상·비용·수령 범위·실측 확인 기준과 함께 별도 제안한다. 지금 B 완료만으로 첫 생산 또는 추가100 무감독 실행을 승인하지 않는다.

## 보존·마감

집 원본 개인12·기존 수신 ACK/검토 문서·실사용 원장 보존. IRIS0.4.3/main ca697706·공개 ERGON false/executionConnected=false 유지. 사용자 저장/DB/RLS·Supabase/Vercel 서버 호출/추가 비용·배포·commit/push 변경0. 다음 구현은 결과 검토 후 별도 승인한다.
