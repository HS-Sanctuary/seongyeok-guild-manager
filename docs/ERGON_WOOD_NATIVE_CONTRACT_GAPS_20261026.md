# 목재 자동 생산 native 연결 누락 계약 — 정적 조사

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 기존 CLI wrapper/read/policy/executor/journal/DPAPI progress와 2026-10-21 공식 capabilities 조사 문서를 대조했다. 실제 연결 가능 부분과 자동 실행 차단 근거를 아래에 구분했다.
- **아직 안 됨:** 최신 공식 schema·실게임 응답의 새 검증, 안정 work/delivery 귀속, 실수령 native 진척 writer, 비용 quote·외부 개입의 완전한 배제 근거는 없다. 합성 포트 값을 공식 계약으로 취급하지 않는다.
- **다음:** 먼저 읽기 전용 native 계약 DTO/기능표를 합성 검증하고, 누락 항목이면 기능 없음/차단을 반환하도록 설계한다. 실제 CLI 연결·실제 조회/소비·공개 활성화는 별도 승인 대상이다.

## 근거와 최신성

| 근거 | 확인 범위 | 한계 |
|---|---|---|
| 현재 source | c63da183 기준의 `desktop-life-cli/read/policy/executor/journal/progress/connection/coordinator` | adapter가 받는/버리는 필드와 보호 경계. 실제 최신 게임 응답은 아님 |
| `ERGON_CLI_CAPABILITIES_REVIEW_20261021.md` | 과거 승인된 공식 capabilities1회/28명령에 대한 익명화 검토 | 10/21 설명·예시의 범위. 원시 schema의 현재 값이나 실제 수령 귀속을 재검증한 것은 아님 |
| 설치 CLI skill | exit/status/body error 판정, 비용은 동적 metadata note 및 응답 cost 확인, blocking 명령 유지 | 정적 사용 지침이며 각 품목의 현재 비용/슬롯 수를 제공하지 않음 |
| 합성 시험 | 명시적인 capacity/workId/readyAt/quote/delivery/version 포트 | 공식 CLI에 이 필드가 있다는 증거가 아님 |

표준 skill 경로의 CAPABILITIES.json은 이번 환경에서 없었다. 게임에 닿는 status/capabilities/조회 명령을 실행하거나 캐시를 갱신하지 않았다. 사용자 원장·last-response 등 실제 응답 파일도 읽지 않았다. 아래 ‘미확인’은 현재 adapter와 위 날짜의 설명에서 입증하지 못한 의미이며, 게임 내부에 절대 없다는 선언이 아니다.

## 항목별 판정

| 항목 | 코드/문서에서 확인한 사실 | 사용자 확인 가능 범위 | 자동 실행 차단 항목 |
|---|---|---|---|
| 재고 | read의 get_items 정규화는 이름/분류/위치/수량/잠김. 정책은 모호·잠긴 재료/장비 부재를 보수 처리 | 목표가 ‘추가100’인지, 시작 재고의 수동 보조 확인 | 조회 신선도·계정/캐릭터·재고 외부 이동 귀속. 총재고 증가만으로 해당 요청 산출 확정 금지 |
| 레시피 | get_alterable_items의 ProducedPerWork/Alterable/부족 재료. installed-reference는 complete=false | 품목·계획 수량/단일 품목 재료표를 확인하고 출처를 user-confirmed로 저장하는 제안 가능 | 완전한 입력표·변경 version·실제 적용 재료/대체 경로. 부분 reference를 소비 권위로 사용 금지 |
| 시설 정원 | works는 completedCount 및 DisplayName/FacilityName/State/IsCompleted/RemainingSeconds. queue_full/레벨 실패는 정원 수치가 아님 | 현재 화면의 총정원/시설 레벨·정책을 수동 보조 입력 | 화면 자기신고는 매 명령 시점의 빈자리/외부 사용 증명이 아님. 7개·작업 수로 총정원 추정/실패 탐색 금지 |
| 작업 식별 | native 요청 nonce/journal requestId는 IRIS 요청 ID. 등록 판정은 같은 이름 InProgress 개수 증가 | 특정 작업을 봤다는 수동 보조 진술 | 공식 workId·슬롯/요청 결합·재시작 안정 귀속이 현재 노출되지 않음. requestId를 공식 workId로 개명 금지 |
| 가공 시간 | 기존 작업 RemainingSeconds와 완료 상태 관측 | 사용자 화면의 표시 시간·멤버십 상태를 계획 참고로 제공 | 표준/실제 등록 시각·기간·시간 배율·스냅샷 변경을 입증 못함. 남은0/계산상 경과만으로 완료·수령 가능 판정 금지 |
| 수령 범위 | complete_altering_work wrapper는 displayName 인자. 정책은 동일 FacilityName의 완료품 전체를 묶어 사전 표시 | ‘해당 시설 완료품 전체’ 영향 범위에 대한 명시 동의 후보 | 단일 work 수령이라고 가정 금지. 다른 품목/목표까지 포함되면 단일목표 승인으로 자동 수령 불가 |
| 실제 수령량 | FlatCollectionOutcome는 collected와 rewards/criticalRewards의 Name/Amount 형태 및 시설 완료 상태를 확인. envelope 경로는 collected/완료 수 감소 중심 | 사용자가 직접 확인한 추가 확보량을 별도 user-confirmed로 기록하는 향후 계약 | 현재 정책은 outcome 문자열을 반환하고 per-work/delivery 실수량 증거를 저장하지 않음. 형식/귀속·중복·부분 수령·critical 합산 대조 없이 자동 진척 반영 금지 |
| 비용 | skill은 동적 note/응답 cost 요구. 현 정책의 일반 동작은 expectedWings5 및 전후 날개 debit 대조. 수령은 expectedWings=null, collectCostKnown=false | 사용자 승인 예산·해당 명령에서 읽은 비용에 대한 동의 | 승인만으로 미확인 비용이 확인되는 것은 아님. 수령0비용 가정/기존 one-click 비용불명 허용을 자동 생산에 상속 금지. raw cost/최대소모·재료 및 원격 전송 비용 근거 필요 |
| 외부 앱/수동 개입 | native game lease는 같은 저장 root를 공유하는 IRIS의 협력 실행을 배제. activity/신선도/재고·문맥 변화와 journal unresolved 보호 | ‘다른 앱 정지/수동 조작 안 함’ 안내와 확인 | 타 앱·게임 수동 조작은 IRIS 잠금에 참여하지 않음. 일관된 재고/작업 version이나 동등한 명령 귀속 근거 부재. 사용자 진술만으로 완전 자동 안전을 보장할 수 없음 |

가방/보관함 원격 재료는 기존 사용자 설명상 마이홈 전송기·연금술 부스러기·주간 확인창 조건이 있다. 그 진술은 계획 참고이며 이번에는 설치/비용/모달을 조회·조작하지 않았다. 실제 자동 사용은 조건·비용·품목 범위를 검증하는 별도 계약 전 차단한다.

## 재사용 가능한 보호 경계

- `DesktopLifeExecutor`: Prepare/Confirm의 동결 nonce·문맥/epoch·사용자 승인 후 재검사, actor mutation, Run terminal까지 game lease 유지. 새 자동 관리자에서 구 Confirm 우회 경로를 만들면 안 된다.
- `DesktopLifeJournal`: Begin 전 중복 request/unresolved 거절, inflight 재시작 unknown 복구, 환경 간 미해결 보호, 파일 공유 잠금. 외부 앱까지 독점한다는 의미는 아니다.
- `DesktopErgonProgressStore`: DPAPI·파일 원자 교체/ACK·revision CAS·operationId·감사·공통 writer. JSON 합성 FileRepo를 이 저장소로 바꿔 끼우는 것만으로 round/delivery 계약이 생기지는 않는다.
- `DesktopLifeProgressConnection`: journal 행 귀속/terminal digest/전역 unresolved 대조. 현재 collect는 일반 생산 terminal 관측과 별도 경로이며 per-delivery 목표 바인딩이 없다.
- native 수량 확인은 `a.action==crafting`, completed 근거, source=user-confirmed 조건이다. 가공 수령량을 이 API에 넣거나 사용자 확인만으로 native unknown을 해제하지 않는다.

## 다음 최소 구현 제안 — 이번에는 미구현

1. 실행 기능 없는 **native 가공 관측/수령 증거 자료형과 capability 판정**을 정의한다. workId/정원/cost 등이 없으면 null·unsupported와 차단 이유를 반환한다. 실제 정보가 없는 곳에 합성 ID/기본값을 채우지 않는다.
2. 별도 승인하에 native DPAPI의 round/pending/collection-event 계약을 공통 writer 안에서 구현하고, 기존 journal Begin/terminal과 request/goal/scope의 정합성을 합성 검증한다. terminal 응답 유실은 unknown 유지·재전송 금지다.
3. 공식 schema/응답 근거를 읽는 별도 승인 범위가 생기면 정적 표의 미확인을 갱신한다. work 단위 귀속이 불가능하면 증명된 시설 단위 배치 독점 계약을 별도로 설계해야 하며 현재는 자동 반복을 허용하지 않는다.

실제 게임·사용자 원장·DB·공개 잠금·native 실행 경로 변경0, commit/push0. 이 문서는 자동 실행 활성화 승인서가 아니다.
