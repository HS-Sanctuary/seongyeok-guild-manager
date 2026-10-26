# 목재 추가100 — 합성 목표형 실행 관리자

사용자가 승인한 첫 완결 시나리오를 순월이 직접 구현한다. 목표 관리 전송 기준은 c63da183679bb219bbd21f7626a4b869d34ba524. 이번 새 코드는 commit/push 금지.

## 경계

- 기존 ErgonPlanItem/ProgressScope/strict native projection과 회차 계산을 재사용한다. 기존 executor·Store·bridge·공개 gate를 새 자동 루프에 연결하지 않는다.
- 현 `works` 조회에는 안정 workId/총정원/recipe duration이 없고 installed-reference는 complete=false다. 현재 native 확인량은 crafting용이다. 이 정보로 실제 가공 수령 증거·승인을 위조하지 않는다.
- 최소 구현은 synthetic-only CLI/저장/actor lease 포트와 상태 관리자다. 임시 파일 어댑터와 가짜 world로 여러 회차 및 실제 새 프로세스 재개를 시험한다. 새 가공 확정량은 합성 수령 원장에만 기록하며 실제 native 확정 생산량으로 보고하지 않는다.

## Task1 — 실패 시험

추가100(기존 목재 재고 제외)·실제 수령만 합산·다회차·초과 산출 재계산·부분 수령/중복 delivery·waiting 재시작·unknown/비용/외부개입 차단·동일 actor 직렬화·쓰기 장애를 시험한다. 새 TS 관리자가 없어 RED인지 확인한다.

## Task2 — 최소 상태 관리자

planning→dispatching→planning/waiting→completed, paused/blocked. 안정 commandId와 실행 전 durable pending·보수적 예산 예약을 저장한다. pending 저장 ACK/재검증 없이는 execute0, 응답/terminal 저장 불명은 재전송0이다. actor lease는 terminal 저장까지 유지한다. 새 스냅샷의 scope/신선도/native health/recipe·시설·작업 소유·version과 명시 quote 비용/승인 범위를 확인한다. 추정값은 회차 계획에만 사용한다.

## Task3 — 복구·회귀·마감

실제 임시 파일 CAS 어댑터/가짜 CLI world로 새 Node 프로세스 waiting 재개 및 pending 재전송 차단을 확인한다. 관련→최종 전체 Node/type/lint/격리 build/native 회귀 유지. High 중요 안전 검토1회, 지적 RED→GREEN. 한국어 QA와 미전송 인계 기록만 로컬 보존한다.

## Review Focus

**마감:** 최소 synthetic-only 후보 구현·검증 완료. 목재13 및 전체 Node674 PASS/기존3 SKIP/FAIL0, 타입/lint/격리 build·기존 React2 PASS. High1회 C0/I2/M1: 중요2 RED→GREEN, Minor pending 새 프로세스 시험 보류. 실제 native/DPAPI/CLI/교차프로세스 연결은 미구현이며 `ERGON_WOOD_PRODUCTION_SYNTHETIC_QA_20261026.md`의 게이트를 따른다. commit/push 없이 보존한다.

1. pending ACK 유실·execute 응답 유실·terminal 저장 실패에서 중복 소비 없는가.
2. 부분/중복 delivery와 재고 외부 증가가 추가 확보량을 부풀리지 않는가.
3. 총정원/작업 ID/시간·레시피/비용이 미확인 또는 변경되면 멈추는가.
4. 재시작·동시 관리자·다른 목표가 동일 actor lease/저장 CAS를 준수하는가.
5. synthetic 포트가 실제 실행/native 확인 수량/공개 잠금으로 연결되지 않는가.
