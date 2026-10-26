# 목재 pending 새 프로세스 복구 — 2026-10-26

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 실행 전·응답 유실·terminal 저장 실패를 채집/등록/수령 각각 재현하고, 소유 Node 자식만 종료한 뒤 새 프로세스와 재복구에서 자동 재전송0·예약/영수증 중복0을 검증했다. 동일 합성 root의 두 협력 프로세스는 native OS lease를 빌린 시험 어댑터에서 배타 진입한다.
- **아직 안 됨:** 실제 native host/DPAPI round 복구·공식 CLI 연결·공개 활성화는 없다. helper 자체 고장, 다른 root, 비협력 외부 앱, 실제 전원 손실까지 배타/내구성을 입증하지 않았다.
- **다음:** [native 누락 계약 조사](ERGON_WOOD_NATIVE_CONTRACT_GAPS_20261026.md)의 읽기 전용 capability/가공 관측·수령 증거 DTO를 먼저 검토한다. 필수 값이 없으면 unsupported/차단을 반환하도록 설계하고 실제 소비 경로는 열지 않는다.

## 기준과 보존

HEAD는 `c63da183679bb219bbd21f7626a4b869d34ba524`, 기능 브랜치 수신 기준은 `codex/home-gnosis-iris-integration-20261019`다. 앞선 목재 후보 제품2·시험3파일의 검증 SHA256이 모두 그대로임을 확인했다. 기존 로컬 후보/계획/QA/릴레이·ignored 실패/성공 로그를 보존했다. 기존 M1은 그 당시 미실행 기록으로 남기고 이번 문서가 후속 결과를 담당한다.

사무실 원본16항목(ACK 포함)·기존 별도 ACK·사용자 원장은 보존한다. 실제 게임/CLI 명령, 사용자 원장·DB/main/Production/IRIS0.4.3·ZIP/metadata 변경과 commit/push는 하지 않는다.

## 구현 범위 — 시험 코드만 추가

- `tests/iris-ergon-wood-process.test.mjs`: 소유 자식 생성·중단·새 PID 복구·동시 프로세스 검증.
- `tests/iris-ergon-wood-process-worker.mjs`: 중단 지점 주입과 restore/step/hold 작업. 실제 앱·게임 PID 검색/종료가 없다.
- `tests/iris-ergon-wood-process.fixture.mjs`: 기존 FileRepo 내부 actor 제외 구간을 소유 native lease helper로 감싸는 **합성 전용** ProcessRepo.
- `iris/desktop-life-wood-process.fixture.cs`, `.tests.ps1`: UUID 합성 경로/world·기존 경로 reparse 검사 후 기존 `DesktopLifeJournal.AcquireExecutionLease`를 사용한다. helper stdin EOF까지 OS FileShare.None을 보유한다. 기존 journal 소스를 변경하거나 실제 Begin/terminal을 생성하지 않는다.

기존 process-local FileRepo만 쓸 때 두 프로세스가 모두 진입하는 RED를 먼저 확인했다. ProcessRepo는 native lease 아래 초기화·CAS·pending·실행·terminal 저장 전 구간을 배제하여 GREEN을 확인했다. 이 테스트 helper는 desktop/build-beta 소스 목록이나 bridge에 추가하지 않았다. 실제 제품 host는 lease를 host 자신의 수명/소유권으로 가져야 하며 이 stdin helper를 제품 경로로 채택해서는 안 된다.

## 중단 지점과 검증

| 경계 | 중단 위치 | 중단 전 새 명령 효과 | 새 프로세스 결과 |
|---|---|---|---|
| before-execute | pending 파일 저장 후, commit ACK가 manager에 반환되기 전 | 0회 | pending 복원→blocked, 자동 전송0 |
| response-loss | 가짜 world 효과 저장 후, receipt가 manager에 반환되기 전 | 1회 | 효과/미확정 기록 보존, 자동 재전송0 |
| terminal-failure | receipt의 terminal 저장을 거절한 후 blocked/pending 보존 | 1회 | 미확정 유지, 성공/수량 추정 및 재전송0 |

각 경계를 gather/register/collect에 적용한 **9개 조합 PASS**다. 각 조합에서 첫 소유 Node만 종료하고, 별도 새 Node 및 한 번 더 새 Node로 재복구한다. marker의 events와 복구 events 전체가 같고 가짜 world도 같아 추가 command·작업 등록·수령·비용 예약이 생기지 않음을 확인했다. 수령 조합은 기존 확인3개를 먼저 저장하고 복구해도3개를 유지한다. 미저장된 새 수령 효과를 확정량으로 올리지 않는다.

동일 root의 첫 worker가 진입한 동안 두 번째 helper가 CONTENDED를 반환했고 첫 worker 해제 후에만 진입했다. 두 정상 프로세스가 같은 목표를 처리한 경우 서로 다른 command2개만 순서대로 저장·실행됐고 영수증2개·날개 비용2회가 정확히 대응했다. 중단 사례에서 새 프로세스 진입이 성공한 것은 소유 Node 종료→stdin EOF→이전 helper의 OS lease 해제 근거다.

## 최종 검증

| 항목 | 결과 |
|---|---|
| 신규 프로세스 시험3개 | PASS: 배타 진입,9개 중단/복구 조합,정상 동시 직렬 처리 |
| 기존 목재13개 | PASS, 기존 제품/시험 소스 해시 불변 |
| 전체 Node | **680개 중677 PASS / 기존3 SKIP / FAIL0** |
| 기존 목표 관리/저장/native 합성 회귀 | 전체 Node에 포함되어 PASS. 과거 전체61개 원래 조건 전체 완료라는 뜻은 아님 |
| 별도 native journal | PASS: DPAPI unknown/restart/cross-account/environment/replay/corruption, 실제 게임 명령0 |
| TypeScript·관련 lint | PASS, 오류/경고0 |
| 제품 native/bridge/host·배포 소스 목록 | 변경 없음, helper 미포함 |
| 실제 앱/게임·사용자 원장/공식 CLI 새 조회 | 미실행 |

이번에는 제품 TS/native 소스를 바꾸지 않았으므로 기존 격리 build·React 검증 근거를 유지하고 불필요하게 반복하지 않았다. 과거 S01/N04 normal/최초 수령 간헐 실패 원인은 미확정이며 이번 PASS로 해결했다고 보고하지 않는다.

## 독립 High 검토와 판단 경계

**1회 C0/I0/M0.** 신규 코드·로그·정적 계약을 읽기 전용으로 검토했으며 추가 검토나 제품 수정은 없었다. 다음은 검토에서 판단하지 않은 범위이며 그대로 미검증/활성화 차단으로 남긴다.

1. **helper 자체 crash:** Node crash와 다르다. helper가 먼저 죽었을 때 살아 있는 body를 즉시 취소하는 연결은 없다. 이번 PASS는 helper 정상 생존 및 소유 Node 종료의 범위다. 제품에 연결하지 않는다.
2. **실제 native host/DPAPI 종단 복구:** 기존 lease primitive 재사용만 검증했다. 합성 JSON 복구로 실제 native round 저장/호스트 재시작 안전을 주장하지 않는다.
3. **다른 root·비협력 외부 앱·수동 게임 조작:** 같은 잠금 경로를 공유하는 협력 worker 밖의 배타는 보장하지 않는다.
4. **적대적 junction/파일 링크 교체·전원 손실:** 생성된 정상 합성 경로의 검사만 했으며 TOCTOU/하드웨어 내구성을 증명하지 않았다.
5. **최신 공식 CLI/캐시:** 독립 검토는 지정 worktree 밖을 읽지 않았다. 순월이 확인한 로컬 표준 cache 부재와 설치 skill·과거 조사에 근거하며 새 공식 조회는 실행하지 않았다.
6. **최종 전체 회귀:** 검토자는 실행하지 않았고, 검토 이후 순월이 위 최종 결과를 직접 확인했다.

## 실제 연결 가능 기반과 필수 미확인

재사용 가능한 것은 기존 Prepare/Confirm nonce·actor/game lease·journal Begin/terminal·global unresolved·DPAPI writer/CAS/ACK·scope/epoch 검사다. 이것만으로 새 가공 목표 자동화를 활성화할 수는 없다.

필수 미확인은 안정 work/delivery 귀속, 실시간 정원·가용자리, 완전한 레시피/실제 시간, 수령 실수량·범위·부분/critical·중복 근거, 명시 비용/상한, 외부 개입과 일관성 근거, 가공 round/pending/delivery native 저장 계약이다. 현재 공식 노출에 없다고 입증한 것이 아니라, 현 source/과거 metadata에서 확인하지 못한 항목이다.

사용자 확인으로 목표·예산·시설 전체 수령 동의·수동 추가 확보량 출처는 보완할 수 있다. 현재 화면 정원이나 다른 앱 정지 진술도 참고가 된다. 그러나 이를 workId·현재 빈자리·비용 증거로 승격하거나 unknown을 해제하여 자동 반복해서는 안 된다. 상세 판단/근거와 다음 최소 구현은 별도 계약 조사 문서를 따른다.

## 종료 상태

앞선 목재 후보와 이번 시험/문서는 모두 로컬 미커밋/미전송이다. 공개 gate/executionConnected=false 유지. 실제 native 실행 경로/사용자 원장/운영 DB/main/IRIS0.4.3/Production·새 서버 사용 변경0. 사용자 검토 전 commit·push하지 않고 여기서 마감한다.
