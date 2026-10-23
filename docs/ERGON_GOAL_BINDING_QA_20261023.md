# ERGON 목표 연결·요청 등록·단일 진척 — 2026-10-23

## 2026-10-24 KST 전송 마감 확인

한설이 검증된 집 작업과 인계의 기능 브랜치 commit·일반 push를 승인했다. 아래 미전송 문구는 작성 당시 상태다. 최종 제품 소스의 커밋 직전 전체 Node를 다시 실행하여 651건/648 PASS/기존3 SKIP/0 FAIL을 확인했다(루트 목표 선택 제한 포함). 제품 소스는 최종 React14·타입/lint·격리 빌드 검증 이후 변경하지 않았다. 최신 중단 기준은 남은 사용량10%이며 전송 확인 뒤 추가 개발 없이 마감한다. 정확 전송 SHA는 이 문서 포함 커밋 이력/원격 HEAD로 확인한다. 공개 배포·main·DB·실게임은 승인 범위가 아니다.

기준 기능 원격 `codex/home-gnosis-iris-integration-20261019` / `e9575ec5c6432156d6b8a033cd50217b24da7d47`. 운영 main은 `ca697706a874d21668091588940ceb61338d0700` 유지. 관리 worktree의 로컬 미커밋 작업이며 commit/push/배포하지 않았다.

## 기존 상태 보존

사용자가 언급한 10파일만 임의로 선택하지 않고 시작 시점 dirty/untracked 19개 소스·시험·문서를 ignored 로컬 사본으로 보존했다. 이번 작업 이후에도 기존 native 3파일(N-R1/U-R1/V15), page 종료 보호, 수신 ACK의 SHA256이 시작 사본과 일치한다. 집 원본 개인 12항목과 기존 삭제 상태는 그대로 둔다. 사용자 저장 파일·암호화 원장·캐시·게임 응답은 열거나 복사하지 않았다.

## 구현 범위

### 1. 목표 연결

`lib/irisErgonGoalBinding.ts`는 먼저 기존 native 읽기 모델에서 환경·계정·캐릭터·sourcePlanId·루트 여부·행동·품목·목표 수량을 대조한다. 정확한 기존 목표는 goalId를 그대로 재사용한다. 다른 내용이나 중복 목표를 임의로 병합하거나 새 성공 기록으로 변환하지 않는다.

새 목표만 의미 기반의 안정 ID를 제안하고 기존 `game.life.progress.createGoal`에 저장한다. 환경/계정/캐릭터/sourcePlanId/행동/품목/목표 수량을 SHA-256 입력으로 사용한다. native가 저장한 정확한 goalId와 건강한 범위별 뷰를 다시 읽기 전에는 성공으로 표시하지 않는다. 응답 유실·실패·재마운트에서도 다른 ID로 중복 생성하지 않는다. 기존 무작위 goalId를 새 ID로 바꾸거나 마이그레이션하지 않는다.

실제 작업대의 제작 계획에 `목표 기록 연결`을 추가했다. 이는 로컬 목표 저장이지 게임 실행이 아니다. 확인되지 않은 저장은 같은 목표의 `목표 저장 상태 확인`으로 남기고 기존 dirty/종료·전환 보호를 재사용한다. 다른 행동의 목표는 어댑터 계약만 허용하며 이번 결과 확인 UI의 새 연결 버튼은 제작 계획에 한정한다.

### 2. 준비 요청 등록 계약

기존 `game.life.progress.bindPrepared`만 호출하는 비소비성 store 어댑터를 추가했다. scope/goal/nonce와 native에 기록된 제작 횟수·단위 산출·예상 산출을 대조한다. 동일 nonce의 동시 요청은 합치고, 이미 저장된 요청과 ACK 유실은 권위 있는 최신 기록으로 확인한다. 다른 목표에 있는 nonce는 재등록하지 않는다. 문맥 또는 입력이 바뀌면 중단한다.

반환값은 항상 `executionAllowed:false`다. 저장된 등록 행은 native의 일회성 실행 허가/lease/nonce를 대신하지 못한다. 재시작 후 등록을 확인해도 실행 허가를 복원하지 않는다. 새 준비·confirm·collect 호출을 드라이버에 넣지 않았다. 실제 호스트의 소비 명령을 열지 않았으며 UI에 새 실행 요청 버튼을 추가하지 않았다. 새 API도 기존 native 고정 라우트·스키마를 재사용한다.

### 3. 확인 진척 단일화

결과 패널의 native 뷰를 기존 작업대 루트 부족분·Queue 표시·완료품 예약 계산에 전달한다. 결과 전용 native가 있는 모드에서는 CraftGoal 메모리/예상값 fallback을 사용하지 않는다. 기존 코드의 실행 예산·expectedOutput은 별도로 유지한다. native 확인 3개/목표4개면 작업대와 목록 모두 남은1개다. 조회 중·실패·범위 불일치·중복 목표는 진척 계산을 보류하며 0개 확정으로 표시하지 않는다. 결과 패널의 마지막 확인 기록은 그 사실을 표시하고 보존한다.

## 검증

- 새 Node 6개: 동시/재생성 어댑터의 동일 목표 재사용, 정확한 scope/plan 진척 선택, 고정 비소비성 route/엄격 payload, 요청 nonce 중복/ACK 유실, 문맥 변경 전 차단, 실패 후 동일 ID 재확인 PASS.
- 전체 Node 651건 / 648 PASS / 기존 3 SKIP / 0 FAIL. 기존 native coordinator/host/수량/N04·저장 보호 합성 회귀 포함. 전체 결과 후 루트 목표 선택 제한을 추가했고 관련 6개를 다시 확인했다.
- React 14개 스크립트 PASS: goal-create, result-only-collection, workbench-results, page-protection, progress, progress-lifecycle, progress-review, lifecycle-ack, save-transition, floating-save-strip, floating-save-overlay, release-lock, currency-cache, 기존 collection. 실제 컴포넌트와 합성 API/격리 저장만 사용한다.
- 목표 생성 ACK 유실 후 한 목표만 유지·재마운트 재사용, 실제 확인3과 목록 남은1, 조회 실패 시 stale 진척 계산 보류, 결과 전용 수령 버튼 및 직접 callback 차단, 기존 입력/전환/ACK 보호 PASS. 기존 collection 시험의 합성 데이터만 공유 fixture로 분리했고 동작 조건은 유지했다.
- 독립 TypeScript / 수정 범위 ESLint / git diff --check / 환경 파일을 복사하지 않는 격리 Next 빌드 PASS. 마감의 마지막 작은 제한은 관련 단위 회귀로 재확인한다.

## High 독립 검토 1회

Critical 0 / Important 2. 작성자가 다음 두 항목을 보완했다. 추가 독립 재검토는 하지 않았다.

1. 결과 전용 모드에서도 기존 overview의 수령 경로가 남아 있음: UI의 gameDisabled와 openCollection 양쪽에서 차단. 공개/native 잠금이 계속 false여서 실호스트 소비는 원래도 차단된 상태였다. 실제 완료 시설 UI 및 직접 callback 합성 회귀 PASS. 초기 로딩 때문에 버튼이 이미 잠긴 시험을 음성 재현으로 오인하지 않고, callback 경계까지 검증했다.
2. 실패한 재조회 뒤 과거 healthy 뷰가 최신 진척 계산에 남음: 실제 작업대 회귀에서 `확인 수량 조회 필요`가 나타나지 않는 RED를 확인했다. 조회 중/지원 불가에는 부모에 null을 전달하고, Queue는 미확정0이 아닌 조회 필요로 표시하도록 보완했다. 연결 회복 뒤 native 확인3/남은1 복귀 GREEN. 패널의 과거 기록은 별도 보존한다.

목표 생성 버튼 없음·작업 목록의 native 진척 미연결·store 어댑터 없음에서 실패를 확인한 뒤 최소 연결했다. 최초 route 타입 누락 및 React ref 갱신 lint 오류는 보완 후 재검증했다. 합성 결과를 실게임 성공으로 표현하지 않는다. 과거 N04/S01/최초 수령의 간헐 실패 원인은 여전히 미확정이다.

## 남은 범위와 결정

- 준비·바인딩 어댑터와 기존 native의 합성 계약은 검증했지만, 새 소비 실행은 실제 UI/호스트에 연결하지 않았다. 실제 게임 CLI/자원 소비/설치본 적용 시험 없음.
- 제작 외 새 목표 UI, 계획 취소·삭제 전체, 바뀐 품목/수량을 기존 목표와 교체하는 정책, 자동 재계획/반복 생산/모바일 원격은 미구현이다. 현재는 같은 sourcePlanId에 다른 목표 내용이 남으면 새 목표 생성 대신 확인을 요구한다.
- 실행 capability와 공개 ERGON은 계속 false다. 운영 0.4.3 ZIP/metadata/버전·main·DB/RLS·native 원장 및 스키마 변경 없음. Supabase/Vercel 신규 호출·비용·배포 없음.
- 다음 최소 단계는 기존 목표의 변경/취소·계획 제거 정책을 먼저 결정하거나, 별도 승인된 개발용 합성 실행 경로에서 준비→등록→종료의 전체 UI 계약을 확장하는 것이다. 지금 저장된 목표/요청이 있다는 이유로 실제 실행을 승인하지 않는다.
