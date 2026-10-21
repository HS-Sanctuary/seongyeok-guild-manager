# ERGON 2026-10-21 집 마감 — 순월 인계

## 기준·전송 식별

- 작성 영겁, 2026-10-21 23:56 KST. 브랜치 `codex/home-gnosis-iris-integration-20261019`.
- 시작 로컬/원격 HEAD `a6bea6824fcff9c7566834c83a979d9985869b6b`; 마감 시 원격 조회·`pull --ff-only` 결과 동일/Already up to date. index는 비어 있었다.
- 이 문서는 커밋 전 작성했다. push 성공을 선기록하지 않는다. 마감 커밋 SHA는 `git log -1 --format=%H -- docs/ERGON_CLOSEOUT_20261021.md`로 식별한다. 정상 push 뒤 영겁의 최종 보고에서 그 SHA와 원격 HEAD 일치를 확인한다. 순월은 원격 최신 HEAD까지 수신 후 아래 범위를 ACK한다.
- 공개 버전 상승 없음. 기존 v2.322 기능 후보의 수량 정확성 후속 인계이며 운영 웹/IRIS 버전·ZIP·main·DB·Production을 변경하지 않는다.

## 구현·설계·미구현 구분

**구현:** 제작 명령 completed/예상 산출을 실수량으로 더하지 않는다. confirmedOutput만 진척·남은 목표·완료품 예약에 사용하며, 결과 수량 미확인 시 추가 제작 준비/새 묶음/선행 재료 안내를 막는다. 과거 예상 진척을 확인 수량으로 소급 변환하지 않는다. 명령 unknown과 수량 미확인은 별개이며 native 잠금은 유지한다. 진척은 아직 화면 메모리다.

**설계 승인, 제품 미구현:** 별도 암호화 진행 저장소·사용자 수량 확인/정정 이력·요청 바인딩/원장 대조·재시작 복구·보류/취소. native 30일/300건 정책은 그대로이며 최소 종료 증거 보존도 실행 허가가 아니다. 61개 시나리오는 1차34/2차13/3차14로 배정만 완료했고 신규 저장 검증은 미실행이다.

**미구현:** 신규 진행 저장소, 공식 보상 수량 검증, 사용자 결과 확인 UI/영속화, 목표 미달 재계획, 자동 채집→가공 페이즈→수령→제작 연결, CHRONOS 부족분 만들기, 주간 루틴, 모바일 원격 실행. 공개 ERGON 잠금 유지.

## 전달 파일과 근거

- 제품5: `lib/irisErgonCraftGoal.ts`, `components/iris/DesktopErgon.tsx`, `DesktopErgonExecution.tsx`, `DesktopErgonQueue.tsx`, `DesktopErgonPlanRow.tsx`.
- 직접 시험9: `tests/iris-ergon-craft-goal.test.mjs` 및 craft-goal/craft/edit-during-action/final-reservation/goal-workbench/list-progress/workbench/prerequisite-quantity의 `iris-ergon-*.browser.mjs`.
- [공식 CLI capabilities 조사](ERGON_CLI_CAPABILITIES_REVIEW_20261021.md), [1차 수정·검증 기록](ERGON_RESULT_ACCURACY_QA_20261021.md).
- [진행 보존 설계](superpowers/specs/2026-10-21-ergon-progress-result-confirmation-design.md), [3단계 구현 계획](superpowers/plans/2026-10-21-ergon-progress-three-stage-implementation.md), [61개 검증 계획](ERGON_PROGRESS_SYNTHETIC_VALIDATION_PLAN_20261021.md).
- 최소 공통 인계: 이 문서, HANDOFF/RELEASE_NOTES/Master Guide/TO_SOONWOL 누적. 기존 인계는 삭제하지 않는다. 링크는 저장소 상대 경로다.

### 보상 응답 오프라인 조사 — 익명화한 기존 보고

기존 조사 보고에서는 실제 제작 보상 응답 자료를 확보하지 못했다. capabilities의 rewards/criticalRewards 필드 존재 계약만으로 보상 행의 품목·수량·중복 합산 의미를 확정하지 않는다. 이번 마감에는 응답 캐시·암호화 원장·게임 사용자 파일을 열람/해독하지 않았고 추가 CLI도 실행하지 않았다. 실제0·누락·수량 미확정의 해석은 미해결이며 보상 파서를 만들지 않는다. 원문·캐시·백업·개인 경로는 전송하지 않는다.

## 검증 결과와 한계

- 이전 최종 로컬 검증: Node617건/614PASS/기존3skip, native 합성4그룹, 관련 React+합성 IO 브라우저14파일, 격리60페이지 빌드/별도 타입 검사/scoped lint 통과. 자세한 명령·범위는 QA 문서 참조. 실제 게임 성공 증거가 아니다.
- 마감 전송 범위에서는 이전 개인 `iris-ergon-plan.test.mjs`의 2개 추가 시험을 제외한다. 그 파일의 기존 HEAD 시험까지 포함한 전송 수치와 이번 fresh 결과는 마감 후속 검증 절에 구분한다. 제품5파일은 검증 당시와 동일하며 이번 마감에는 제품 코드를 추가 수정하지 않는다.
- 기존 실패: `iris-ergon-save-overlay.browser.mjs`의 공개 잠금 진입 가정1건. 기존 IRIS 탐색3실패와 버스 lint16오류/9경고도 미해결이다. 실패를 숨기거나 공개 잠금을 풀어 통과시키지 않는다.
- 새 저장소의61개 시나리오는 테스트 계획이지 통과 결과가 아니다. 실제 게임/사용자 보호 파일 접근 없이 임시 fixture만 사용해야 한다.

## 보존·미전송

마감 시작 dirty31개 중 ERGON 직접 변경19개만 선택한다. 아래12개는 원래 바이트/삭제 상태를 보존하고 전송하지 않는다. 파일 내용·개인 값은 공개하지 않는다.

- 이전/개인 문서7개: `BETA_FEEDBACK.md`, `IRIS_OVERNIGHT_HANDOFF_20261020.md`, `UPDATE_POST_v2.151.md`, `CHATGPT_PROJECT_HANDOFF_SANCTUM_IRIS_20261020.md`, `ERGON_GOAL_FEASIBILITY_20261021.md`, `ERGON_REFERENCE_ARCHITECTURE_20261020.md`, 루트의 개인 실행 명령 메모1개.
- 이전 시험2개: `tests/iris-ergon-plan.test.mjs`의 개인 추가2시험, `tests/kronos-theme-preview.mjs`.
- 루트 개인 메모3개의 기존 삭제 상태. 복구/삭제 재실행/커밋하지 않는다.
- 기능 브랜치 수신만으로 이 개인 파일이나 DPAPI 원장/진척이 사무실 PC에 복사되는 것은 아니다. 이들은 Git 전달 대상이 아니다.

## 순월 첫 작업과 승인 경계

### 마감 후속 검증

- 전송 범위 Node fresh 재검: 개인 변경이 있는 plan 시험 파일 전체를 제외한 **610건/607PASS/기존3skip/실패0**, 해당 파일의 **HEAD 원본5건/5PASS**를 별도 메모리 실행했다. 합계 **615건/612PASS/기존3skip/실패0**. 이전 전체 로컬617과의 차이2건은 미전송 개인 추가 시험이며 제품 차이가 아니다. 원본 파일을 교체하지 않았다.
- 이번 마감에는 제품 코드를 바꾸지 않았으므로 native/브라우저/격리 빌드·타입 전체 반복은 생략했다. 이전 QA 결과와 위 fresh Node 결과를 구분한다. 61개 새 저장 시나리오의 원래 ID는 중복 없이61개, 문서 상대 링크 누락0을 확인했다. staged 범위·개인정보/비밀값·제외 파일의 바이트/삭제 상태를 commit 전 점검한다.

### 이어받기 순서

1. 개인 dirty를 먼저 보존하고 대상 브랜치 최신 수신 → 릴레이 읽기/ACK → 코드·문서·환경 차이 확인. 오래된 2026-10-20 인계보다 이번 내용을 우선한다.
2. 기존 CHRONOS 저장/이동과 수량 정확성 회귀·공개 잠금 유지 확인. 이번 수량 수정의 메모리 한계를 저장 기반 완성으로 오해하지 않는다.
3. 승인된 계획 Task1·2의 시작 가능 여부를 한설에게 보고한다. **이번 인계는 순월의 새 구현 시작 승인이 아니다.**
4. 다음 최소 범위는 신규5파일: `iris/desktop-life-progress.cs`, `.fixture.cs`, `.tests.ps1`, `lib/irisErgonProgress.ts`, `tests/iris-ergon-progress.test.mjs`. 암호화 저장·확인/정정·중복·원자 저장/복구, 소유34개 합성 시나리오만. 기존 원장/bridge/UI·컴파일 목록에는 아직 연결하지 않는다.
5. 실제 게임 제작/채집/가공/수령·추가 CLI·사용자 보호 파일 접근·unknown 해제·DB/main/Production·공개 ERGON 해제/IRIS 배포는 별도 승인 전 금지. 신규 Supabase/Vercel 호출/비용도 추가하지 않는다. 앱·게임·개발 환경 강제 종료0.
