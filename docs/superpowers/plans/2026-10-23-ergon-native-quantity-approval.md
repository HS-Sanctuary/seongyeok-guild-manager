# ERGON native 수량 재확인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution. Steps use checkbox (`- [ ]`) syntax for tracking. 설계는 한설이 승인했으며 이 계획 확인 후 제품 구현을 시작한다. commit/push는 별도 승인 전 금지한다.

**Goal:** 0개·초과 산출·정정에 신뢰된 native 승인을 연결하고, 승인 전후 불일치와 중복 반영을 차단한다.

**Architecture:** 기존 Connection 안에 수량 요청 전용 비동기 경계를 분리한다. 승인 대기 중 mutation/Busy·game lease는 유지하고 writer/Store 잠금은 해제한다. 승인은 native 내부의 동결된 요청에만 적용하며 기존 도메인/CAS/operationId를 재사용한다.

**Tech Stack:** 기존 Windows C#/WinForms/DPAPI, PowerShell native fixtures, Node test runner. 새 의존성·서버 없음.

**Spec:** `docs/superpowers/specs/2026-10-23-ergon-native-quantity-approval-design.md`, 기존 `2026-10-21-ergon-progress-result-confirmation-design.md`의4.3/6절.

## Global Constraints

- 기준 HEAD9ef6a661, N04 미커밋 시험4파일·보고서 및 개인 변경/ACK 보존.
- quantity0~5,000,000 정수, null/빈칸은 확인0과 구별. 예상량은 확정량이 아니다.
- 수정 범위: `iris/desktop-life-progress-connection.cs`, `iris/desktop-webview.cs`, 관련 신규 시험. Store/원장 형식·공개 allowlist·React3차 UI는 변경하지 않는다.
- ErgonAvailable=false, executionConnected=false 유지. 실제 게임/사용자 원장·DB·서버·main·배포·commit/push0. 이번 타임15% 중단은 해제됐으나 사용량이 소진되면 안전하게 보존·보고한다.

## Review Focus

1. 승인 중 브라우저 payload 값 변경: 처음 동결한 값 외의 저장0.
2. 최신 정정 대상이 바뀜: 이전 승인을 재사용하지 않고 저장0.
3. 저장 ACK 유실 뒤 재전달: 확인 이벤트 중복0, 최신 view 반환.
4. 승인 대기 중 writer 필요 작업: 파일 잠금 교착 없이 revision 충돌 시 저장0.
5. 창 파괴·거절·예외·늦은 응답: 승인으로 처리하지 않으며 lease/Busy 정리.

### Task 1: native 수량 승인·저장 경계

**Files:** Modify `iris/desktop-life-progress-connection.cs`; Create `iris/desktop-life-progress-quantity.fixture.cs`, `iris/desktop-life-progress-quantity.tests.ps1`, `tests/iris-ergon-progress-quantity.test.mjs`.

**Interfaces:** 기존 `RequestAsync(confirmQuantity|correctQuantity, payload)`를 유지한다. 내부 `ProgressQuantityPreview`는 실제 소유/품목·요청/이전값/새값/예상량/사유를 복사한 읽기 전용 객체다. `BindQuantityApproval(Func<ProgressQuantityPreview,Task<bool>>)`은 native 코드에서만 설정하며 미설정은 명시 승인 필수 요청을 거절한다. 내부 `QuantityAsync`가 입력 동결·단일 mutation/game lease 소유·writer 전후 대조·최종 Commit을 담당한다.

- [ ] **RED:** 실제 Store/Connection/Executor와 가짜 native 승인으로 `zero_requires_native_approval`, `extra_is_not_clamped`, `correction_three_to_two_replaces_contribution` 시험을 작성한다. `node --test tests/iris-ergon-progress-quantity.test.mjs`가 기존 명시 승인 차단 때문에 실패하는지 확인한다.
- [ ] **구현:** 원본 숫자를 먼저 검증한 뒤 의미별 payload를 동결한다. writer 아래 실제 terminal/소유/revision/최신 정정 대상 및 도메인 유효성을 검증한다. 0개·초과·정정에만 native 승인을 요청하며 writer는 await 전에 해제한다. 확인 후 같은 값·문맥/epoch·store/revision·이벤트·native 근거를 재검증하고 native 승인 객체를 생성하여 기존 Store.Commit으로 저장한다. 승인 시작 후120초를 넘거나 시각이 역전된 응답은 거절한다. 팝업 자동 종료 기능은 추가하지 않는다.
- [ ] **GREEN:** `approval_declined_exception_or_missing_writes_nothing`, `approval_drift_context_revision_request_blocks`, `payload_mutation_cannot_change_saved_quantity`, `late_approval_rejected`, `writer_available_while_prompt_waits`, `unknown_never_approved`, `storage_failure_preserves_previous`, `duplicate_ack_returns_latest_without_prompt_or_reapply`, `same_operation_changed_meaning_rejected`를 검증한다. 중복 판단은 저장된 원래 의미를 대조하며 native 보호 상태를 성공으로 해제하지 않는다.

### Task 2: 기존 Windows 확인 기능 연결·마감

**Files:** Modify `iris/desktop-webview.cs`; Task1 시험 및 한국어 결과 보고서.

**Interfaces:** `ConfirmProgressQuantityAsync(ProgressQuantityPreview)`는 기존 `DesktopLifeProgressApproval.RequestAsync`를 사용한다. 현재 계정·캐릭터/품목·이전값→새값·정정 사유·사용자 확인 출처를 표시하고 기본 선택은 취소다. 정상 host에서만 provider를 연결하며 browser가 승인 플래그를 제공하는 API는 만들지 않는다.

- [ ] **연결:** 작은 native 재확인만 구현한다. React 결과 입력/정정 초안 UI·자동 생산은 추가하지 않는다. 기존 owner 파괴/비동기 창 처리와 host 가용성 확인을 재사용한다.
- [ ] **관련 검증:** Task1 native 시험과 기존 owner 파괴·N04·H22/R5를 실행하고 native 소스 목록을 컴파일한다. 실제 앱/게임/사용자 자료는 열지 않는다.
- [ ] **최종 검증:** `node --test tests/*.test.mjs`, 저장34·A22·B-1 20·기존native 회귀, 별도 타입/scoped lint, `git diff --check`를 실행한다. 안전 검토는 전체 변경1회만 수행하고 중요한 지적은 재현·보완한다. 기존 S01·최초 수령 회귀 원인 미확정과 시험 자체 실패를 구분해 기록한다.
- [ ] **보고 후 정지:** 제품·시험·한국어 기록을 미커밋 보존하고 실제 UI/게임/공개 활성화 완료를 주장하지 않는다. commit/push·다음 단계는 별도 승인이다.

## 자체 점검

승인된 설계1~6항은 Task1 저장 경계와 Task2 native 연결에 대응한다. 기존 ProgressMutation/QuantityAcknowledgement/operationId 계약을 그대로 재사용하며 신규 저장 권위·공개 method가 없다. 미실행 Q13 초안 UI·실게임·Begin 내부 전원 장애는 범위 밖으로 남긴다.
