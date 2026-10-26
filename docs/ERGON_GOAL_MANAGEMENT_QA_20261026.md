# ERGON 목표 관리 검증 — 2026-10-26

> 이후 별도 승인된 원자적 수량 변경의 최신 결과는 `ERGON_ATOMIC_GOAL_REPLACEMENT_QA_20261026.md`를 따른다. 아래의 A 미구현·G04 경계는 앞선 작업 당시의 결과이며 원본 검증 근거로 보존한다.

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 실행·확인·보류 이력이 없는 제작 목표의 `그만하기` → native 취소 재조회 → 해당 로컬 계획 제거 후보. 저장 실패·ACK 유실 재확인, 다른 계획의 미저장 초안 보호, 기존 연결 목표의 직접 편집 차단을 합성 검증했다.
- **아직 안 됨:** 목표 수량 변경은 구현하지 않았다. 기존 native API에 원자적 목표 교체와 동일 계획의 대체 목표 단일 승자 계약이 없다. 실행·확인·unknown 이력이 있는 목표의 변경·취소, 동일 품목 재등록 전체 흐름도 미완료다. 자동 생산 완료가 아니다.
- **다음:** 원자적 목표 교체의 native 계약 승인 → 교체·재등록의 소유권/중복 예약 검증. 진행 중 목표의 변경 정책은 별도 결정한다. 이번 변경은 로컬 미커밋이며 commit·push 승인을 기다린다.

## 수신·보존

- 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`, 수신 HEAD `7a7b70a98928a780aea555bb70a583ae52cb5d84`를 기존 깨끗한 격리 worktree에 ff-only 수신했다.
- 운영 main `ca697706a874d21668091588940ceb61338d0700`과 IRIS 0.4.3을 구분했다. main 병합·ZIP·metadata·설치본 변경은 없다.
- `AGENTS.md` → `CODEX_RELAY` → `TO_SOONWOL` → `HANDOFF` → `ERGON_NEWOL_HANDOFF`, 최신 목표 연결·작업대 QA 및 실제 소스를 대조했다. 수신 ACK는 `docs/relay/TO_SOONWOL.md`에 로컬 기록했다.
- 사무실 원본의 상태 16항목(기존 ACK 포함), 이전 별도 worktree의 ACK와 ignored 로그를 보존했다. 원본 파일을 정리·stash·삭제하지 않았다.

## 구현 범위

### 취소·계획 제거

`irisErgonGoalManagement.ts`는 기존 load/setLifecycle만 사용한다. 계정·캐릭터·environment를 검증한 최신 native 조회에서 계획 ID·품목·종류·수량이 일치하는 루트 목표 하나만 허용한다. 요청·확인량·미확인량·등록량·자식 목표·보류/분리 상태가 있으면 차단한다.

active 목표를 기존 CAS로 cancelled 저장한 뒤 같은 목표를 다시 조회하여 확인한다. ACK 유실은 성공으로 추정하지 않는다. 이미 cancelled인 목표는 재조회로 복구하며 새 취소 이벤트를 중복 제출하지 않는다. 이후 현재 문맥과 로컬 계획 전체를 재확인하고 해당 항목만 제거·재조회한다. 실패 시 native 취소를 되돌리거나 기존 이력을 삭제하지 않는다.

실제 작업대 연결은 기존 제작 결과 패널의 빈 제작 목표에 한정된다. 어댑터의 일반 자료형 지원을 채집·가공 전체 UI 완성으로 보고하지 않는다. native 취소 뒤 로컬 계획이 남더라도 취소 목표의 산출·재료를 다시 예약하지 않는다. 기존 이력 목표의 보류·결과 확인은 유지한다.

기존 연결 목표는 PlanRow와 상위 저장 경계에서 직접 수량 변경·교체·제거를 차단한다. native 조회 불명·타 소유 범위도 차단한다. 미연결 로컬 초안 편집은 유지한다.

### 미저장 초안 보호

High 검토 중요 지적 I1: 다른 계획 Q 수정과 새 계획 R 추가가 로컬 저장 실패로 메모리에만 남았을 때 취소 제거가 옛 디스크 목록으로 덮어쓸 수 있었다. 실제 React 재현 시험 RED 후 다음을 적용하여 GREEN을 확인했다.

- 미저장 계획이 있으면 목표 취소 버튼과 제거 경계를 차단한다.
- `계획 저장 다시 시도`는 마지막 성공 기준과 디스크가 일치할 때만 현재 초안을 저장·재조회한다. 외부 변경을 임의 병합하지 않는다.
- 취소 후 제거 직전 최신 세션·문맥·메모리와 저장 목록 전체가 일치해야 한다.
- Q 수량 7과 새 R 수량 3을 유지한 뒤 P만 취소·제거하는 React 시험을 통과했다.

### 수량 변경 보류의 근거

G04는 기존 Store의 별도 CAS 연산으로 원래 100개 목표를 취소한 뒤 같은 sourcePlanId에 새 70개와 60개 목표가 모두 생성되는 경계를 재현한다. **G04 PASS는 안전한 교체 기능의 성공이 아니라 기존 계약의 부족을 입증한 결과다.** client-only 연속 호출이나 임의 ID로 우회하지 않았다.

필요한 최소 후속 계약은 공통 writer 안의 단일 원자 교체다. 기존 목표의 scope/root/empty 상태·revision 재검증, 이전 기록 보존·비활성화/분리, 신규 목표 연결과 단일 승자 보장, durable 교체 operationId 및 ACK 유실 재조회가 함께 필요하다. 기존 goal 덮어쓰기나 이력 상속을 해서는 안 된다. 이번에는 native 제품 API를 추가하지 않았다.

## 검증 결과

모두 격리 합성 저장·가짜 bridge를 사용했다. 로그는 로컬 ignored 경로에만 보존하며 사용자 자료·개인 경로·원본 로그를 전송하지 않는다.

| 항목 | 결과 | 근거·범위 |
|---|---|---|
| 전체 Node | PASS | 656개 중 653 PASS / 기존 3 SKIP / 0 FAIL |
| 신규 관리 Node | PASS | 5개: 취소 ACK/중복, 차단 조건, 저장·문맥 실패, 로컬 제거, native 연동 |
| G01 | PASS | 실제 격리 Store 취소·재시작·이력·operationId 재전달·추가 바인딩 차단 |
| G02 | PASS | 사전 확인 후 요청 추가 시 stale revision 취소 충돌, 기존 암호문 보존 |
| G03 | PASS | 다른 캐릭터 취소 거절·암호문 불변 |
| G04 | PASS(경계 입증) | 별도 연산의 복수 대체 목표 생성 가능. 수량 교체는 미구현 |
| 실제 React 신규 취소 | PASS | native 실패·로컬 실패·ACK 유실·재시도·다른 계획 보존·캐릭터 전환 늦은 ACK |
| High I1 재현/보완 | PASS | 미저장 Q 수정/R 추가 RED → 명시 저장 후 P 취소 GREEN |
| 화면 폭·글자 | PASS | 320/390/768/1280 × 18/20/22, 가로 넘침 없음 |
| 기존 React 회귀 | PASS | 목표 생성, 작업대 결과, page 보호, progress, lifecycle, review, lifecycle ACK, 결과 전용 수령 차단 |
| 기존 IRIS 보호 화면 | PASS | CHRONOS 전환/플로팅 저장 3종, 재화 캐시, 공개 ERGON 잠금 |
| TypeScript·관련 lint·격리 build | PASS | 최종 코드 기준. 운영 환경변수·실제 서버 사용 없음 |
| 실게임·운영 설치본 | 미실행 | 승인 제외. 실제 게임 성공으로 해석 금지 |

기존 저장34/A22/B-1 20/H22/R5 및 수량·N04 관련 회귀는 전체 Node에 포함되어 통과했다. 이번 요청에서 과거 전체 61개 원래 조건을 모두 재검증한 것은 아니다.

### 사용자 필수 항목과 L01–L05

| 항목 | 결과 | 제한 |
|---|---|---|
| 실행 이력 없는 목표 수량 변경 | 미실행 | A 미구현, G04로 계약 한계만 입증 |
| 변경 ACK 유실·중복 클릭 | 부분 | 취소의 ACK 유실/중복만 PASS, 수량 교체 미실행 |
| 이전/신규 목표 중복 예약 | 부분 | cancelled 로컬 잔존 예약 제외 PASS, 신규 교체 목표 미실행 |
| L01 비활성 저장 후 제거 | PASS(제한) | 빈 제작 목표 한정, 기존 목표·취소 이벤트 보존 |
| L02 native 실패 | PASS(제한) | 빈 목표 계획 유지, 성공 표시 없음 |
| L03 native 성공·로컬 실패 | PASS(제한) | 카드 유지·재확인·중복 native 취소 없음 |
| L04 공용 계획·외부 삭제·재추가 | 부분 | 다른 캐릭터 늦은 응답 방어/다른 항목 보존 PASS. 동일 품목 새 목표 생성까지의 전체 흐름 미실행 |
| L05 실행 중 취소 후 종료 응답 | 미실행 | 이력 목표 관리 취소 차단. 기존 관측/원장 변경 없음 |
| 실행중·unknown 변경 차단 | PASS(제한) | 관리 어댑터/상위 저장 경계 합성. 실게임 진행 상태 미실행 |
| 캐릭터·계정 보호 | PASS(제한) | 소유권 단위 시험·캐릭터 늦은 ACK React. 실제 로그인 전환 미실행 |
| 목표4/확인3/남은1 | PASS | 기존 결과/작업대 합성 및 3→2 정정 회귀 |
| CHRONOS·재화·공개 잠금 | PASS(합성) | 운영 IRIS 0.4.3 설치본 직접 검증 아님 |

## 독립 검토와 실패 이력

- High 독립 검토 1회: C0/I1/M0. I1은 위 실제 React RED→GREEN으로 보완했다. 두 번째 독립 검토는 수행하지 않았다.
- 개발 중 기존 `보류하기` 회귀 실패를 발견하고 기존 동작을 복원했다. 관련 원본 실패 로그와 최종 통과 로그를 모두 보존했다.
- page 보호 시험의 최종 정상 전환 단계는 부모 dirty 해제 알림 전에 조작하여 실패했다. fixture가 실제 dirty 해제 알림을 기다리도록 수정했다. 보호 제품 코드·초기 차단 검증을 완화하지 않았다.
- 과거 N04 normal/S01/최초 수령 회귀의 간헐 실패 원인은 여전히 미확정이다. 이번 전체 PASS를 원인 해결로 보고하지 않는다.

## 파일과 남은 위험

- 제품 신규: `lib/irisErgonGoalManagement.ts`.
- 제품 수정: `DesktopErgon.tsx`, `DesktopErgonPlanRow.tsx`, `DesktopErgonQueue.tsx`, `DesktopErgonResultConfirmation.tsx`, `useErgonProgress.ts`, `useErgonSession.ts`.
- 시험 신규: `iris/desktop-life-goal-management.fixture.cs`, `iris/desktop-life-goal-management.tests.ps1`, `tests/iris-ergon-goal-management.test.mjs`, `tests/iris-ergon-goal-cancel.browser.mjs`, `tests/iris-ergon-goal-cancel-draft.browser.mjs`.
- 시험 수정: `tests/iris-ergon-page-protection.browser.mjs`의 정상 전환 타이밍 동기화만 변경.
- 로컬 계획 저장과 native 취소는 분리된 저장이다. 로컬 실패 때 native 취소가 이미 완료될 수 있고, readback 불명 때 롤백을 보장하지 않는다. 상태 재확인을 안내한다. 외부 창의 동시 로컬 수정은 자동 병합하지 않으며 충돌 시 보존·차단한다.
- 다른 캐릭터가 같은 계정 공용 계획을 사용하는 전체 정책과 이력이 있는 목표의 교체·취소는 다음 계약에서 추가 검증해야 한다.
- `ErgonAvailable=false`, `IRIS_ERGON_AVAILABLE=false`, `executionConnected=false` 유지. 실제 게임/사용자 원장/unknown/DB/main/Production/공개 IRIS/배포물 변경 없음. 신규 서버 호출·비용 없음. staged·commit·push 없음.

실제 설치본에는 이번 화면을 적용하지 않았다. 화면 증거는 격리 React fixture이며 공개 잠금 해제나 게임 검증을 요청하지 않는다.
