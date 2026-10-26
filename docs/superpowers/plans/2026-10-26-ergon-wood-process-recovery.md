# 목재 pending 새 프로세스 복구·native 누락 계약 조사

기준 c63da183679bb219bbd21f7626a4b869d34ba524와 기존 미커밋 목재 후보를 보존한다. 사용자 승인: 합성 자식 프로세스 중단/복구·경합 시험, 정적 계약 조사만. 실제 CLI·사용자 원장·제품 실행 경로·공개 잠금·commit/push 변경 금지.

## Task1 — RED/격리 프로세스

- 새 시험 worker/fixture로 pending 저장 후 실행 전, 실행 효과 후 응답 전, terminal 저장 실패를 구분한다. gather/register/collect 각각 검증한다.
- 소유 Node 자식만 종료하고 새 프로세스에서 복원한다. 명령 ID·영수증·비용 예약 보존 및 자동 재전송0을 대조한다.
- 현재 process-local FileRepo의 경합 한계를 별도 프로세스 동시 진입 시험 RED로 재현한다. 신규 합성 어댑터에서만 기존 native game lease(FileShare.None)를 빌려 쓰는 시험 helper를 사용한다. 기존 제품 host/bridge 소스 목록에는 추가하지 않는다.
- 두 프로세스의 healthy serialization 및 소유 worker 종료 후 다음 진입을 시험한다. helper는 worker stdin EOF에 종료하여 OS lease를 해제한다. 실제 native host 보장으로 확대 보고하지 않는다.

## Task2 — 정적 계약 조사

- executor/정책/read adapter/journal/DPAPI progress/coordinator와 설치된 CLI skill·과거 공식 capabilities 검토를 대조한다. 현재 공식 cache가 없으면 게임 호출로 갱신하지 않고 최신성 한계를 명시한다.
- 정원·work/delivery ID·실수령량·비용·외부 개입을 근거/사용자 확인 가능/자동화 차단으로 구분한다. user-confirmed가 unknown을 풀거나 공식 증거를 대체하지 않게 한다.

## Task3 — 마감

기존 목재13개/관련 회귀→전체Node/타입/lint/관련 native 회귀, High1회·중요지적 RED→GREEN. 한국어 QA/인계 로컬 보존. 기존 원본16·ACK·원장·로그 보존, 미커밋 유지.

## Review Focus

**마감:** 신규3개(9중단조합 포함)/기존목재13·전체Node677PASS3기존SKIP0FAIL, 타입/lint·native journal PASS. High1회 C0/I0/M0. 제품/호스트 소스 변경 없이 시험/정적조사만 수행. helper 정상생존/동일root 협력worker의 범위이며 실제host/DPAPI·타root/외부앱·helper자체crash는 미검증. `ERGON_WOOD_PROCESS_RECOVERY_QA_20261026.md`를 따르며 commit/push 없이 보존한다.

1. Node worker 강제 종료가 소유 helper의 EOF/lease 해제로 이어지는가. 실제 앱을 종료하지 않는가.
2. pending 종류별 복구에서 새 command/등록/수령/예약이 생기지 않는가.
3. 동시 프로세스 CAS와 terminal 저장이 같은 actor lease 안에 있는가.
4. 시험 경로·reparse 방어 및 child 종료 대상이 제한되는가.
5. 정적 공식 계약의 날짜·공백과 사용자 확인의 한계를 과장하지 않는가.
