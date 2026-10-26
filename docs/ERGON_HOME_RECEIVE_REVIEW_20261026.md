# ERGON 집 수신·검토 — 2026-10-26 KST

## 기준·보존·이번 승인

- 작성: 영겁. 대상 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`.
- 수신: `7a7b70a98928a780aea555bb70a583ae52cb5d84` → **`ba0374676d593a88118f226b3737603de9557db8`**, 기존 관리 worktree에서 fast-forward/충돌 없음. 수신 당시 작업 트리는 깨끗했다.
- 집 원본의 개인12항목(수정4·삭제3·미추적5)과 삭제 상태는 원래 checkout에 유지했다. 개인 파일·사용자 암호화 원장·게임 응답·캐시를 읽거나 복사하지 않았다.
- AGENTS → CODEX_RELAY → TO_YEONGGEOP → HANDOFF → ERGON_NEWOL_HANDOFF를 확인하고 SW-20261026-001의 ACK를 수신함에 누적했다. 기존 기록을 삭제하지 않는다.
- 이번은 수신·검토·격리 합성 검증과 다음 조건 제안이다. 제품 코드 수정, 추가 게임 명령, 사용자 보호 원장 변경, 운영 DB/main/배포, commit/push는 하지 않았다. ACK·본 문서는 로컬에만 남는다.

## 실제 원격에 포함된 것

| 커밋 | 확인한 범위 | 아직 의미하지 않는 것 |
| --- | --- | --- |
| `c63da183679bb219bbd21f7626a4b869d34ba524` | 빈 제작 목표 취소 및 원자 수량 교체, 기존 native 진행 저장/bridge·UI·회귀 | 진행 이력/unknown 목표의 임의 취소·전체 계획 삭제·자동 생산 |
| `ba0374676d593a88118f226b3737603de9557db8` | 목재 추가100 합성 관리자, pending 새 프로세스 시험, 순수 readonly DTO·capability 판정, 관련 QA/계획 | 실제 native 관측 공급자 B, DPAPI 가공 진행 저장 C, 실제 host/CLI/작업대 자동 생산 연결 |

최신 HANDOFF/뉴월 인계는 **A만 전송**, B/C는 독립 검증 후 별도 전송이라고 명시한다. B/C가 사무실 로컬에 작성되어 있는지는 집에서 확인할 수 없다. 원격에 없다는 사실을 사무실에서도 미구현이라고 단정하지 않으며 다음 작업 전 순월의 최신 인계를 확인해야 한다. 과거 문서의 미전송·시험 미실행 문구는 후속 전송/시험보다 앞선 경과로 읽는다.

## 집중 검토

### native 저장과 pending 복구

기존 `desktop-life-progress.cs`의 암호화 진행 저장/공통 writer와 실행 journal은 그대로 존재하며 목표 취소·교체에 재사용된다. 그러나 새 목재 관리자는 `WoodRepository.mode=synthetic`과 `SyntheticWoodCli.mode=synthetic`, development·목재 추가100 조건을 요구한다. `FileRepo`의 임시 JSON/CAS/rename을 실제 DPAPI 가공 저장으로 취급하면 안 된다. 새 round/pending/delivery native writer는 원격에 없다.

`ProcessRepo`는 시험 전용 C# helper가 기존 `AcquireExecutionLease`를 보유하는 동안 동일 root의 협력 Node들을 직렬화한다. 가공 manager가 pending을 먼저 저장하고 ACK·재조회를 확인한 뒤에만 fake execute로 간다. 응답/terminal 저장이 불명확하면 pending/blocked를 유지하며 재전송하지 않는다. 기존 확인3개도 새 미확인 수령으로 덮거나 증가시키지 않는다.

확인한 한계: helper가 먼저 죽으면 살아 있는 body를 즉시 취소하는 연결이 없다. 소유 Node 종료→stdin EOF→helper 종료와 잠금 해제의 시험을 helper crash 안전으로 일반화하지 않는다. helper는 실제 host/bridge/배포 소스 목록에 포함되지 않는다. 다른 root·외부 앱·수동 조작·전원 손실 내구성도 미검증이다.

### 실제 CLI 증거·수량 권위

`irisErgonReadOnlyEvidence`는 순수 parser/판정기이며 IO·신뢰된 native 공급자는 없다. scope 비교는 입력 내용 대조이지 출처 인증이 아니다. `automaticReady=false`, `executionAllowed=false`, `confirmedProgress=null`을 유지한다. works의 이름/남은 시간으로 workId·빈자리·실제 기간을 만들지 않는다. collected는 산출 수량이 아니며 rewards/criticalRewards의 실제 귀속·합산을 확정하지 않는다. 역사 날개 차와 정책 예상5는 현재 실비용/무료 증거가 아니다.

따라서 공식 work/delivery 귀속, 현재 정원, 검증된 비용, 외부 개입·일관성 근거가 아직 부족하다. 이것은 공식 CLI에 절대 기능이 없다는 결론이 아니라 현재 코드/과거 조사만으로 입증하지 못했다는 뜻이다. 이번에는 capabilities/status/재고 등 어떤 게임 명령도 실행하지 않았다.

### unknown·공개 잠금

native `Audit`는 `journal.HasUnresolved()`를 거절하고 요청의 소유권/terminal을 대조한다. 기존 수량 확인은 crafting/user-confirmed이며 가공 수령량을 끼워 넣는 경로를 추가하지 않았다. 합성 관리자의 pending/unknown 차단도 별개로 유지된다. 사용자 확인이나 보류 해제로 native unknown을 푸는 기능은 없다.

`IRIS_ERGON_AVAILABLE=false`, bridge `ErgonAvailable=false`, native capability `executionConnected=false`를 소스에서 확인했다. 새 목재/readonly 모듈의 실제 화면·native 실행 연결은 없다. 운영 main **`ca697706a874d21668091588940ceb61338d0700`**, IRIS0.4.3/배포물은 이번 수신에서 변경하지 않았다.

## 검증: 순월 보고와 집 재확인을 구분

- 순월 보고: 최종 전체 Node688 중685 PASS/기존3 SKIP/0 FAIL, 타입·관련 lint PASS. 목표 관리 단계의 React/native/build 및 과거 전체 회귀 수치는 해당 QA의 당시 범위다.
- 집 직접 실행: `node --test tests/iris-ergon-wood-production.test.mjs tests/iris-ergon-wood-process.test.mjs tests/iris-ergon-readonly-evidence.test.mjs tests/iris-ergon-goal-management.test.mjs tests/iris-ergon-goal-replacement.test.mjs` → **37 PASS / 0 FAIL / 0 SKIP**.
- 집 시험에는 목재13, readonly8, process3(채집/등록/수령×before-execute/response-loss/terminal-failure 9조합), 목표 관리·원자 교체 회귀가 포함된다. 소유 시험 자식과 UUID 합성 root만 사용했다. 실제 게임/앱의 종료·재시작은 없다.
- 이번에는 전체 Node·React·타입·빌드를 다시 실행하지 않았다. 순월의 전체 검증을 집 재실행으로 표현하지 않는다. 과거 S01/N04 normal/최초 수령 간헐 원인은 미확정이며 새 교체 이벤트의 구 native 역방향 호환 미검증도 유지한다.

## 다음 실제 연결의 최소 조건과 첫 검증 범위 — 구현 승인 전 제안

1. **먼저 B 전송 여부 확인.** 없다면 실행 기능 없는 native 관측 공급자만 검토한다. 기존 reader를 주입 가능한 합성 입력으로 감싸고 DTO와 capability를 일치시킨다. 누락 필드는 null/unsupported, 자동 실행/확정 진척은 계속 false/null이다. 첫 시험은 정상/누락/오래됨/다른 계정·캐릭터/unknown/새 필드/보상 중복 및 base-critical 비합산/CLI 소비0이다. 실제 CLI 조회는 별도 승인이 필요하다.
2. **C는 별도 저장 단계.** 공통 actor·writer·journal Begin/terminal과 연결된 버전별 DPAPI round/pending/delivery 계약이 먼저 필요하다. 실행 전 저장·ACK 유실·응답 유실·terminal 저장 실패·새 프로세스 재복구·이중 프로세스·helper/소유권 소실·캐릭터 왕복·원장 불일치를 격리 파일로 시험한다. 추가 소비0/중복 진척0/기존 확인량 보존이 완료 기준이며 실제 사용자 파일은 쓰지 않는다.
3. **실제 소비 연결은 보류.** work/delivery 또는 검증된 시설 단위 귀속·수령 범위, 현 정원, 명시 비용/예산·외부 개입 근거가 충족돼야 한다. 미확인 값을 fake 포트 기본값으로 채우거나 crafting 수량 확인 API를 가공용으로 전용하지 않는다. 근거가 부족하면 사용자 확인 출처의 반자동 대안을 별도로 검토하되 unknown 해제나 무감독 반복 허가로 쓰지 않는다.

이번 검토는 위 조건을 제안하는 데서 끝낸다. 기존 완료 기능을 재개발하지 않고 다음 구현은 한설의 별도 승인 후 진행한다.
