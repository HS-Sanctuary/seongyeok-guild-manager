# ERGON 원자적 목표 교체 구현 계획

사용자의 2026-10-26 원자적 목표 수량 변경 계약을 승인된 설계로 적용한다. 기존 로컬 목표 관리 후보를 보존하고 순월이 직접 구현한다. commit/push/실게임/운영 변경 금지.

## Task1 — native 단일 교체

- 실제 Store 시험을 먼저 RED로 만든다. ReplaceEmptyGoal 한 mutation에 원래 scope/goal/sourcePlan/action/name/수량과 대체 ID/수량을 포함한다.
- 공통 writer·CAS·operationId·원자 교체/감사 체인을 재사용한다. 이전 루트는 cancelled/detached로 보존하고 신규 빈 crafting 루트를 만든다. 요청/자식/보류/전역 미해결 시 차단한다.
- live CreateGoal/재활성화의 같은 scope/sourcePlan 루트 중복도 막는다. 기존 감사 replay는 기존 규칙을 유지하여 과거 자료를 소급 무효화하지 않는다.
- 기존 mutation에 nullable replacement 계약을 추가하되 null은 canonical digest에서 제외하여 이전 암호화 문서/감사 해시와 호환한다. 실제 구형 문서 재조회와 새 이벤트 재시작을 검증한다.
- 독립 프로세스 CAS 경쟁·중복 요청·저장 실패·이력 보존을 격리 경로에서 검증한다.

## Task2 — 제한된 typed bridge·복구

- 기존 allowlist/origin/epoch/actor mutation/game lease/Audit/writer/validate 경계를 재사용하는 replaceEmptyGoal만 추가한다. 공개 gate/실행 비활성 유지.
- scope/이전 goal/새 수량으로 안정적인 operationId·새 goalId를 만든다. native ACK 검증과 재조회 후에만 로컬 목록을 변경한다. ACK 유실은 동일 operationId 재확인한다.
- 재시작 후 native의 보존된 이전 목표와 현재 대체 목표가 로컬 계획과 다르면 동일 교체 요청을 재전달하여 감사 증거를 확인한 뒤 로컬 저장만 복구한다. 브라우저에 확정 진척/별도 목표 권위 저장소를 만들지 않는다.
- 미저장 초안·외부 수정·타 소유 문맥·실행 이력은 차단. local 실패를 native 롤백으로 표현하지 않는다. 활성 목표 선택과 예약은 대체 목표 하나만 사용한다.

## Task3 — 기존 작업대 UI·마감

- 빈 제작 목표의 수량 수정/변경 확인/저장·저장 상태 확인만 기존 패널에 추가한다. 기존 취소·미저장·dirty 보호 유지.
- Node/native/실제 React RED→GREEN. 100→70·경쟁·ACK 유실·로컬 실패/재시작·계정/캐릭터·실행중 차단과 기존4/3/1·취소 회귀.
- 최종 전체 Node·관련 native/React·타입/lint/격리 build, High 독립 안전 검토1회. 지적은 재현 시험 후 보완한다. 한국어 QA/릴레이만 로컬 기록한다.

## Review Focus

**마감:** Task1–3의 승인 범위 구현·합성 검증 완료. Node661 PASS/기존3 SKIP/FAIL0, native R01–R10/J01–J02·기존7종/전체 소스 compile, React16·타입/lint/격리 build PASS. High1회 중요I1은 옛 root child 생성/바인딩 RED→GREEN으로 보완했다. 상세 결과/한계는 `docs/ERGON_ATOMIC_GOAL_REPLACEMENT_QA_20261026.md`. commit/push/실제 게임·설치본 적용 없이 보존한다.

1. nullable mutation 추가가 이전 감사 digest·DPAPI 문서를 무효화하지 않는가.
2. 구 CreateGoal/SetLifecycle 및 다른 프로세스가 활성 루트 단일 승자를 우회하지 못하는가.
3. ACK 유실·재시작 복구가 단순 모양 일치로 성공 처리하지 않고 같은 operationId의 native 감사 증거를 확인하는가.
4. native 저장과 local 저장 사이 scope/초안/외부 변경을 차단하고 보존하는가.
5. 교체된 옛 목표가 결과/예약/취소/재연결의 우회 통로가 되지 않는가.
