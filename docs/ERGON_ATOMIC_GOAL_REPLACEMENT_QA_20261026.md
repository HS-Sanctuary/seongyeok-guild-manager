# ERGON 원자적 목표 수량 변경 — 2026-10-26

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 실행 이력 없는 제작 목표의 수량 교체 후보를 구현했다. 100→70 변경을 하나의 native mutation·revision·감사 이벤트로 저장한다. 옛 목표는 취소·분리 보존하고 신규 활성 루트 하나만 만든다. native ACK·재조회 뒤 로컬 계획 수량을 반영한다. 기존 취소·미저장 초안 보호를 유지했다.
- **아직 안 됨:** 진행·확인·보류·unknown·자식 목표가 있는 목표의 교체는 차단한다. 실제 설치본·게임 실행은 검증하지 않았다. 전체 자동 생산이나 3차 UI 전체 완료가 아니다. 공개 ERGON과 executionConnected는 계속 비활성이다.
- **다음:** 한설의 코드·검증 결과 검토 후 선별 commit/push 여부를 결정한다. 이력 목표 정책, 계정 공용 계획의 다른 캐릭터 정합성, 실제 앱 검증·자동 생산은 별도 승인 범위다.

이 보고서는 같은 날 앞선 `ERGON_GOAL_MANAGEMENT_QA_20261026.md`의 **수량 변경 미구현 경계**에 대해 후속 승인으로 구현한 결과다. 앞선 시험과 실패 근거를 소급 삭제하지 않는다.

## 기준과 보존

- 기능 브랜치: `codex/home-gnosis-iris-integration-20261019`.
- 시작/현재 HEAD: `7a7b70a98928a780aea555bb70a583ae52cb5d84`. 기존 격리 worktree의 dirty 후보 위에 작업했으며 새 커밋은 없다.
- 운영 main `ca697706a874d21668091588940ceb61338d0700`, IRIS 0.4.3·설치본·ZIP·metadata는 그대로다. 기존 사무실 원본16항목(ACK 포함), 이전 별도 ACK·로그·보호 기록을 보존했다.
- 기존 저장소·원장을 재구현하지 않았다. 실제 게임 CLI/사용자 원장/DB/서버 작업과 commit/push/배포는 수행하지 않았다.

## native 계약

### 하나의 저장 작업

`ReplaceEmptyGoal`에는 이전 goalId·scope·sourcePlanId·crafting·품목·이전 수량과 `replacement`의 새 ID·수량을 담는다. 기존 Store의 공통 cross-process writer, 파일 잠금, revision CAS, operationId 중복 판정, DPAPI 저장·재조회·ACK를 그대로 사용한다.

정확한 이전 상태, active/attached 루트, 해당 목표의 요청·확인 이력 없음, 자식 없음, 전역 진행 미해결 없음, 동일 scope/sourcePlan의 다른 활성·보류 루트 없음, 변경된 유효 수량을 검사한다. 검사·용량·쓰기 실패 시 원래 문서를 부분 교체하지 않는다. 취소·CreateGoal 두 번 호출하는 구현이 아니다.

기존 루트는 `cancelled`, `detached=true`로 보존하고 원래 수량과 감사 기록을 유지한다. 새 루트는 확인량0·남은 수량=새 목표 수량이다. 새 goalId는 이 교체의 operationId이며, 다른 수량/내용으로 같은 operationId를 재사용하면 conflict다.

기존 `CreateGoal` 및 루트 재활성화도 live 쓰기에서 단일 활성 루트 규칙을 통과해야 한다. 이전 감사 replay에 새 uniqueness 제약을 소급 적용하지 않아 과거 문서의 판독을 보존한다. 애초 중복 목표가 있던 자료를 자동 정리하지 않고 교체를 차단한다.

### 기존 문서 호환

nullable `replacement` 한 필드를 mutation에 추가했다. 이 필드가 null이면 기존 mutation canonical digest에서 제외하여 이전 감사 의미/체인 해시를 유지한다. 기존 v1의 해당 필드 없는 암호문을 새 Store로 열고 교체·재시작하는 시험을 통과했다. schemaVersion·파일명·기존 원장 스키마/정리 정책은 바꾸지 않았다.

**역방향 호환을 보장하지 않는다.** 새 `ReplaceEmptyGoal` 이벤트가 있는 문서를 구형 native reader가 이해하는 것은 별도 문제다. 향후 활성화·배포/다운그레이드 설계에서 이 경계를 검토해야 한다. 이번에는 실제 사용자 저장소에 새 이벤트를 쓰지 않았다.

### bridge·실행 보호

고정 allowlist에 `game.life.progress.replaceEmptyGoal`만 추가했다. 요청은 고정된 계정·캐릭터·revision·operationId·이전 목표 정보·새 수량 필드만 허용한다. 브라우저의 파일 경로·보상 증거·확인 생산량을 받지 않는다. typed client도 임의 필드와 타 environment를 거절한다.

native 연결은 actor mutation → game lease → 공통 writer → Store 순서를 사용한다. native 문맥·epoch·요청 내용을 저장 각 경계에서 재검증하고, 기존 journal Audit/global unresolved 보호를 통과해야 한다. actor가 자신의 mutation을 보유하면 Busy가 되는 기존 계약을 존중한다. 승인된 코드가 공개 실행 경로를 활성화하지 않는다.

## 로컬 계획·화면·복구

안정 operationId는 scope·이전 goalId·계획·품목·이전/새 수량으로 만든다. ACK 유실 때 새 ID로 우회하지 않는다. 재시작 뒤 계획100/native70 불일치가 있으면 보존된 옛 목표와 현재 대체 목표를 찾고, **같은 교체 operationId를 native에 재전달하여 감사 증거를 확인**한 뒤 다시 조회한다. 모양이 비슷한 활성 목표만으로 성공 처리하지 않는다.

그 후에만 해당 로컬 계획의 수량을 바꾸고 저장 결과를 재조회한다. native 성공·로컬 실패를 native 롤백으로 표현하지 않는다. `저장 상태 확인 필요`와 재확인 버튼으로 복구한다. 로컬 기존 항목/다른 계획과 초안을 보존하고 미저장 초안은 교체를 차단한다. 현재 문맥이 바뀌면 늦은 ACK로 공용 계획을 수정하지 않는다.

기존 결과 패널에 `새 목표 수량` → 변경 내용 확인 → 저장/수량 저장 상태 확인을 추가했다. 편집 상태는 계획 ID를 기준으로 유지하여 native 목표 교체가 입력 초안을 불필요하게 재생성하지 않게 했다. 실제 게임 작업의 취소·실행 버튼으로 표현하지 않는다.

native/계획 수량이 불일치한 동안 전체 대기열에서 해당 계획의 부족분 계산과 예약은 보류한다. 동기화 뒤 새 목표 하나의 확인량/남은 수량만 사용한다. 옛 예상 산출이나 보존 목표의 수량을 합산하지 않는다. 기존 직접 목록 편집 차단·결과 확인·취소·CHRONOS 저장 분리를 유지한다.

로컬 계획은 native와 단일 트랜잭션이 아니며 브라우저 저장 자체의 cross-window CAS를 추가한 것은 아니다. 관측된 외부 변경은 차단하고 자동 병합하지 않는다. 실제 여러 창이 동시에 같은 계정 계획을 편집하는 운영 정책은 추가 검증이 필요하다.

## 검증 결과

| 항목 | 결과 | 근거·한계 |
|---|---|---|
| 전체 Node | PASS | 최종 664개 중 **661 PASS / 기존3 SKIP / 0 FAIL** |
| 신규 Node | PASS | 8개: 예약 경계, ACK/재시작, 차단 조건, 로컬 복구, 실제 Store, 중복/거짓 재조회, native 연결, typed bridge |
| 저장34/A22/B-1 20/H22/R5·기존 수량/N04 | PASS | 전체 Node 및 관련 합성 회귀. 기존 61개 원래 조건 전체 완료라는 뜻은 아님 |
| R01 | PASS | 실제 Store 100→70, 이전100 보존·감사 한 건·활성 루트1 |
| R02 | PASS | 재시작·동일 operation 재전달·내용 변경·stale CAS·옛 목표 재교체 차단 |
| R03 | PASS | 구 CreateGoal/SetLifecycle의 활성 루트 중복 우회 차단 |
| R04 | PASS | 타 소유자·이전 수량 불일치·요청·자식·보류·미해결 차단, 암호문 불변 |
| R05 | PASS | 새 필드 없는 과거 v1 문서 판독·감사 digest·새 교체 이벤트 재시작 |
| R06 | PASS | 독립 PowerShell 프로세스 두 개가 같은 revision에서 경쟁, committed1/conflict1 |
| R07 | PASS | native 쓰기 장애 주입 후 원본 암호문/활성 목표 유지, 성공 ACK 없음 |
| R08 | PASS | 목표 저장 한도에서 교체 거절·부분 비활성화 없음 |
| R09/R10 | PASS | 교체된 root 아래 새 child 차단, 기존 child의 취소/보류 root 우회 바인딩 차단·과거 판독 유지 |
| J01/J02 | PASS | 실제 native connection·가짜 executor, replay/소유권/임의 필드/global unresolved/이력 차단, 새 게임 dispatch0 |
| 실제 React 16종 | PASS | 신규 교체, 기존 취소·초안, 생성·결과·page/lifecycle/정정/ACK·수령 차단·재화·공개 잠금·CHRONOS 저장3종 |
| 신규 React 교체 상세 | PASS | 100→70·native 실패 초안·ACK 유실·재시작·native 성공 후 local 실패/복구·다른 계획 보존·늦은 캐릭터 ACK·미저장 초안 차단 |
| 폭·글자 | PASS | 320/390/768/1280 × 18/20/22, 가로 넘침 없음·격리 화면 직접 확인 |
| 별도 기존 native 7종 | PASS | executor/quantity/actions-bridge/journal/collection/currency-store/store |
| 전체 native 소스 목록 컴파일 | PASS | 설치본 실행/패키지 생성 없음 |
| TypeScript·관련 lint | PASS | 최종 TS/TSX 코드·관련 시험 기준 |
| 격리 Next webpack build | PASS | 운영 env/비밀값 없이 소스·정적 metadata 사본 사용 |
| 실게임·운영 IRIS 직접 동작 | 미실행 | 승인 제외. 합성 성공을 실제 게임 성공으로 보고하지 않음 |
| 진행·이력 목표 교체/전체 공용계획 운영 | 미실행 | 이번에는 거절·보존 경계만 검증 |

## 독립 High 검토와 보완

High 검토는 **1회, C0/I1/M0**였다. 중요 I1은 교체된 옛 root 아래 새 active child 생성과 child 바인딩이 가능하다는 지적이었다.

R09(옛 root child 생성), R10(기존 child의 비활성 root 바인딩)을 각각 RED로 재현했다. live child 생성 및 새 바인딩에서 부모부터 root까지 active/attached인지 검증하도록 보완했다. 과거 감사 replay의 판독 규칙은 유지했다. 신규8개 GREEN 및 최종 전체 Node661 PASS/3 SKIP/0 FAIL, 관련 native 회귀로 마감했다. 두 번째 독립 검토는 수행하지 않았다.

검토에서 판단하지 않은 범위에 대한 처리:

- 실제 게임·재료 소비·수령: 이번 범위 제외, 미실행 유지.
- 운영 원장·DB·서버·배포·설치본: 접근/변경/실동작 판단 없이 보존.
- 이력 목표 교체·취소와 공용 계획 전체 정책: 후속 승인 대상으로 유지.
- 과거 간헐 실패 원인: 이번 PASS로 해결 처리하지 않음.
- 실제 전원 장애·디스크 장치 고장: 장애 주입 시험까지만 PASS이며 실제 하드웨어 보장은 주장하지 않음.

## 실패 이력과 시험 데이터 보완

- 처음 전체 Node의 N04 및 pruning R03 실패는 새 루트 제약에 기존 합성 seed가 충돌한 **확정적 원인**이었다. 과거 기록과 새 독립 작업에 같은 고정 계획 ID를 쓰던 두 위치만 별도 계획 ID로 분리했다. 기존 보호·검증 기대값은 유지하고 관련5개 PASS 및 최종 전체 PASS를 확인했다.
- 별도 기존 executor 회귀 helper도 매 준비마다 새 목표를 같은 계획 ID로 생성하여 실패했다. 합성 독립 작업의 sourcePlanId만 구분하고 기존 native7종을 통과시켰다. 제품 단일 루트 보호를 완화하지 않았다.
- 초기 격리 build의 hooks/정적 download.json 사본 누락은 시험 환경 구성 오류였다. 원본 제품·배포물을 변경하지 않고 사본 의존성을 완성한 뒤 PASS했다.
- 과거 **S01/N04 normal/최초 수령 간헐 실패 원인은 미확정**이다. 이번에 원인이 확인된 fixture 충돌 및 전체 PASS와 별개로 남긴다. 원본 실패/성공 로그는 로컬 ignored 경로에 보존한다.

## 파일 범위

- native 제품: `iris/desktop-life-progress.cs`, `iris/desktop-life-progress-connection.cs`, `iris/desktop-bridge.cs`.
- typed 제품: `lib/irisErgonGoalManagement.ts`, `lib/irisDesktopStore.ts`.
- 기존 작업대·hook: `DesktopErgon.tsx`, `DesktopErgonResultConfirmation.tsx`, `DesktopErgonQueue.tsx`, `DesktopErgonPlanRow.tsx`, `useErgonProgress.ts`, `useErgonSession.ts`.
- 신규 교체 시험: `iris/desktop-life-goal-replacement.fixture.cs`, `.tests.ps1`, `desktop-life-goal-replacement-host.fixture.cs`, `.tests.ps1`, `tests/iris-ergon-goal-replacement.test.mjs`, `.browser.mjs`.
- 기존 fixture 조정: `desktop-life-progress-host.fixture.cs`, `desktop-life-progress-interruption.fixture.cs`, `desktop-life-progress-regression.fixture.cs`. 앞선 미커밋 취소 시험 G04는 과거 경계 재현에서 새 live 중복 차단 회귀로 갱신했다. 이전 로그·QA는 보존한다.
- 앞선 목표 관리 후보의 제품·시험·page 보호 fixture·ACK는 그대로 포함된 로컬 후보다. 이번 수정으로 삭제하거나 별도 전송하지 않았다.

`ErgonAvailable=false`, `IRIS_ERGON_AVAILABLE=false`, `executionConnected=false` 유지. 실제 원장/unknown/운영 DB/main/Production/공개 IRIS/ZIP·metadata 변경0, 신규 Supabase/Vercel 사용0. staged·commit·push 없음. 구현 후보·검증 결과·개인 변경을 안전하게 보존하고 여기서 종료한다.
