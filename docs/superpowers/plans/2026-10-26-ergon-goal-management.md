# ERGON 목표 관리 — 기존 Task4의 제한된 취소 연결

> REQUIRED SUB-SKILL: superpowers:executing-plans. 사용자 2026-10-26 요청과 기존 결과 확인 설계/Task4 L01–L05를 적용한다. commit/push 금지.

**Goal:** 실행 이력 없는 목표만 취소 확인 후 계획에서 제거한다. A 수량 교체는 기존 API의 원자 교체/동시 fork 방지 계약 부재로 구현하지 않고 근거를 보고한다.

**Architecture:** 기존 native load/setLifecycle와 CAS를 재사용한다. 새 우회 API/원장 변경 없음. 취소는 fresh scope/plan/root/empty 상태 검증→native cancelled 저장→권위 재조회→현재 문맥 재검증→대상 계획만 저장 제거 순서다. 실패하면 이력을 보존하고 같은 목표로 재확인한다.

**Spec:** 사용자 목표 수정·취소 개발 요청, `2026-10-21-ergon-progress-result-confirmation-design.md` §7/8 및 기존3단계 Task4.

## 경계·판단

- 취소 가능: 루트·현재 계획 정확히 일치·요청/확인량/미해결/자식 목표 없음·active 또는 이전 취소 결과 재확인용 cancelled. paused/archived/detached/기록 불일치 차단.
- A: setLifecycle/DetachPlan/CreateGoal은 별도 CAS다. 두 변경자가 각기 다른 새 목표를 만드는 것을 한 트랜잭션으로 막는 기존 계약 없음. 새 목표를 덮어쓰거나 임의 fork하지 않는다.
- B: 계정 공용 계획 제거는 해당 계획만 대상으로 하고 다른 캐릭터 목표는 수정하지 않는다. 저장 실패 시 native 취소는 되돌리지 않고 계획 재제거를 안내한다.
- 실행중·unknown·확인/정정이력 있는 목표 정책은 이번 미실행/차단. 기존 결과 확인과 stop/관측 보존. 소비0/공개잠금·executionConnected=false/운영0.4.3 보존.

## Task1 — 비소비성 취소 어댑터·로컬 제거

- [ ] `lib/irisErgonGoalManagement.ts`: `createErgonGoalCancellation(api,contextVersion).cancel(scope,plan)`은 요청 동결·동일 flight 중복 방어·정확한 권위 재조회. `removeErgonPlanAfterCancel(storage,scope,plan)`은 최신 저장 목록의 같은 항목만 제거/검증한다. 기존 plan 저장 형식 유지.
- [ ] 신규 Node 시험 RED→GREEN: 취소 ACK 전 제거0, ACK유실/동시클릭, storage실패/타계정·외부변경·요청/paused/unknown 차단, 새id 재등록 시 확정량 상속0.
- [ ] 격리 native Store CAS·취소/이력보존 및 A의 다중 단계 한계 합성 검증.

## Task2 — 기존 작업대 연결

- [ ] `useErgonSession/useErgonProgress/ResultConfirmation/DesktopErgon`: 결과 패널의 empty 목표 그만하기가 native 확인 후 계획 제거를 호출. 오류와 재시도는 별도 안내. 기존 page dirty 보호 사용.
- [ ] Queue/PlanRow: native 연결 목표의 기존 직접 수량/교체/제거를 차단. 미연결 초안 편집은 유지. 실제 save 경계도 검증하여 UI우회 없음.
- [ ] 실제 React 합성: empty취소·local실패 재시도·ACK유실·동일품목재추가·기존4/3/1 및 request/unknown 차단. 12폭/글자 점검. 기존 page/목표생성/결과/저장/재화/공개잠금 회귀.

## 최종

- [ ] 전체Node·타입·scopedlint·격리build, High1회→중요지적 한 번의 RED/GREEN 보완. QA/릴레이에 A미구현·L01–L05 실제범위만 기록. 개인16/기존ACK/로그/원장보존. staged/commit/push0.

## Review Focus

**실행 결과(2026-10-26):** Task1/2의 빈 제작 목표 취소·로컬 제거 후보와 최종 회귀/High1회 보완을 완료했다. 위 체크리스트에는 동일 품목 재추가 등 미실행 조건이 섞여 있어 일괄 완료로 바꾸지 않는다. A 수량 교체 미구현, L01–L03 제한 PASS/L04 부분/L05 미실행. 전체 Node653 PASS/기존3 SKIP/FAIL0, 타입/lint/격리 build 및 관련 React 회귀 PASS. 상세 범위·근거는 `docs/ERGON_GOAL_MANAGEMENT_QA_20261026.md`가 최종 결과다. commit/push 없이 로컬 보존한다.

1. 취소와 local 제거 사이 scope/계획 변경; 다른 계정·캐릭터에 성공 전달 금지.
2. CAS 뒤 요청 추가/unknown 발생; 확인 불가면 local 제거 금지.
3. ACK 유실 취소 재전달/재시작; 이미 cancelled면 중복 이벤트 없이 재조회.
4. local write/readback 실패·외부계획 변경; 원본 계획·다른항목 보존/새 실행 금지.
5. 기존 결과 이력/중지/관측 및 공개gate를 관리 UI가 우회하지 않음.
