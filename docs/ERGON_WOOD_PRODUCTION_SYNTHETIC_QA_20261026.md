# 목재 추가100 합성 관리자 — 2026-10-26

> 후속 승인된 pending 새 프로세스·동시 진입 시험 결과는 `ERGON_WOOD_PROCESS_RECOVERY_QA_20261026.md`를 따른다. 아래 M1 미실행은 앞선 작업 당시의 기록으로 보존한다. 후속 PASS도 합성 어댑터 범위이며 실제 native host/CLI 연결 완료가 아니다.

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 재고→부족 통나무→가짜 채집→가공 등록→대기→실제 수령 대조→남은 회차→추가100의 synthetic-only 관리자 후보. 부분 수령·초과 산출·예산·보류/재개·대기 상태의 새 Node 프로세스 복구를 검증했다.
- **아직 안 됨:** 실제 CLI/native 실행기/DPAPI 가공 진척 writer/작업대 UI 연결은 없다. 합성 수령량을 공식/native 확정량으로 쓰지 않는다. 실제 cross-process actor 배타와 pending의 새 프로세스 시험도 미완료다. 공개 자동 생산 완료가 아니다.
- **다음:** 아래 실제 연결 계약과 pending 새 프로세스 회귀를 먼저 검토한다. 이번 목재 후보는 로컬 미커밋/미전송이며 별도 승인 전 commit/push·실제 연결·공개 활성화를 하지 않는다.

## 목표 관리 전송과 보존

목표 취소·원자적 수량 변경의 검증된 제품/시험·최소 한국어 공식 기록 **35파일**을 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`에 일반 push했다.

**전송 SHA: `c63da183679bb219bbd21f7626a4b869d34ba524`**. 최신 원격과 기준7a7b70a를 대조하고 검증 소스 해시·staged allowlist/민감정보를 확인했다. push 직후 로컬·원격 SHA 일치 및 깨끗한 상태를 확인한 뒤 목재 후보를 시작했다. 사무실 원본16항목(ACK 포함)·별도 ACK·사용자 원장·ignored 로그는 보존했다.

구 v1 자료를 새 native로 읽는 호환은 PASS다. **새 교체 이벤트의 구 native 역방향 호환은 미검증/미보장**이며 향후 배포/다운그레이드 게이트다. 운영 main/IRIS0.4.3·ZIP·metadata·DB·Production은 변경하지 않았다.

## 구현과 재사용

- `lib/irisErgonWoodProduction.ts`: phase/영수증 원장, pending 비용 예약, 저장 ACK·재조회·최종 재검증, actor lease 포트, 재전송 차단, 보류·재개.
- `lib/irisErgonPlan.ts`: `requiredErgonRuns`를 추출하여 기존 계획과 새 관리자가 공유한다. 기존 수급 미리보기의 부분 자료를 실행 권위로 승격하지 않는다.
- `ErgonPlanItem`, `ProgressScope`, `parseErgonPlans`, `parseErgonProgressView`와 native 목표 건강/소유권 검사를 재사용했다. 기존 native executor/Store/bridge를 새 루프에 연결하거나 복제하지 않았다.
- `tests/iris-ergon-wood.fixture.mjs`: 가짜 world와 임시 파일 CAS/rename, 동일 root 내 process-local actor 직렬화. 실제 CLI 호출은 없다.
- `tests/iris-ergon-wood-production.test.mjs`, `tests/iris-ergon-wood-worker.mjs`: 실패→성공 시험과 새 Node 프로세스 재개.

현재 `works` projection에는 안정 workId/총정원/실제 등록시간·가공 기간이 부족하고 installed-reference는 complete=false다. 기존 native 수량 확인은 crafting용이다. 이 정보를 추정하거나 가공 수령량으로 위장하지 않기 위해 이번 포트는 명시적으로 **synthetic/development/목재 추가100 전용**이다. 실제 adapter는 구현하지 않았다.

## 상태·수량·소비 경계

`planning → dispatching → planning/waiting → completed`, 별도 `paused/blocked` 상태다. step은 최대 한 명령만 보낸다. 같은 관리자 중복 호출은 flight를 공유하고 여러 관리자는 저장 포트의 actor lease·CAS를 거친다. lease는 실행 응답·종료 기록 저장까지 유지한다.

확인량은 수령 delivery의 실제 추가 수량만 합산한다. 기존 목재50개는 추가100에 포함하지 않는다. 등록·예상 산출·대기는 확인량0이다. 부분 수령은 별도 delivery ID로 기록하며 중복/미소유 작업을 거절한다. 목표 달성 후 새 소비를 멈추되 이미 등록된 작업은 취소했다고 표시하지 않고 기록에 남긴다.

레시피·시설 정원·작업 ID·기간·명시 quote 비용·scope/시점/version/native 보호를 확인한다. 예상 산출은 계획 회차에만 사용하고 실제 수령 후 초과 산출을 반영해 재계산한다. 시간이 지났다는 이유만으로 ready 상태를 추정하지 않는다.

승인된 날개·재료·채집 한도와 현재 재고를 대조한다. pending 저장 때 비용을 보수적으로 예약한다. 실행 전 ACK 유실·응답 유실·terminal 저장 실패는 pending/blocked를 보존하고 자동 재전송하지 않는다. 비용/결과 불명, 외부 변화, 작업 불일치, native 보호 상태는 추가 소비를 차단한다. blocked를 임의 해제하는 API는 없다. 예산이 부족해 멈춘 뒤 등록된 작업도 기록에 남지만 자동 추가 승인이나 소비를 하지 않는다.

## 검증

**최종 전체 Node 677개: 674 PASS / 기존3 SKIP / FAIL0.** 기존 저장34/A22/B-1 20/H22/R5·수량/목표 관리/native 합성 회귀를 유지했다. 과거 전체61개 원래 조건이나 실게임 전체의 완료를 의미하지 않는다.

| 목재 시험13개 | 결과 | 범위 |
|---|---|---|
| 공통 회차 | PASS | 100/3→34, 31/3→11, 미확인 산출 거절 |
| High I1 만료 | PASS | 최종 관측 I/O 중 quote/승인 만료 시 execute0 |
| High I2 정상 소단위 | PASS | output1/logs2/gatherLimit1에서256개 초과 기록 후 추가100 완료 |
| High I2 기록 예산 | PASS | 지원 불가능한 계획은 첫 소비0 |
| 승인/native/작업 변경 | PASS | 잔여 재료·채집·만료·native 보호·시설 facts·작업 ID 변경 차단 |
| 기본 다회차 | PASS | 재고50 별도, 실제 추가 수령100 이상, 직렬 execute |
| 초과 산출 | PASS | 남은 회차 감소, 목표 뒤 새 명령0 |
| 부분 수령 | PASS | 1개씩100회 수령, 등록량 미가산 |
| 보류·새 프로세스 | PASS | 임시 파일/가짜 world를 새로운 Node가 읽고 재개·완료 |
| 미확인 계약 | PASS | unknown/비용/정원/시간/외부개입/소유권 미확인 시 소비0 |
| 장애·재전송 | PASS | pending 저장/ACK·실행 응답·terminal 실패 후 새 관리자에서 재전송0 |
| 동시 관리자 | PASS(제한) | 같은 root·프로세스 내 actor 직렬화, 외부 version 변경 차단 |
| 기록 불일치 | PASS | 영수증/재고 version 불일치·중복 delivery 미가산 |

TypeScript·관련 lint는 최종 PASS/경고0, 격리 Next webpack build PASS다. 운영 env/비밀값은 사용하지 않았다. 기존 실제 React 작업대 결과·목표 교체2종 PASS다. 새 React 화면은 없다. native 제품은 이번 목재 후보에서 수정하지 않았으며 앞서 전송한 native7종/전체 소스 compile 근거와 이번 전체 Node의 native 회귀를 구분한다.

## 독립 High 검토와 남긴 항목

**1회 C0/I2/M1.** 중요2건을 한 번의 RED→GREEN 보완 후 최종 전체 회귀로 확인했다. 재검토는 수행하지 않았다.

- I1: await 전 시각으로 승인 만료를 검사하던 문제. 관측 I/O 완료 뒤와 dispatch 직전에 현재 시각·승인·quote·신선도를 재검사한다. 지연 시험 소비0.
- I2: 정상 작은 단위가256개 기록 뒤 목표63에서 막히던 문제. 한도를1024로 조정하고 시작 전 레시피 기준 등록/채집 및 최대100회 부분 수령 기록 예산을 검사한다. terminal은 기존 pending 슬롯에 저장한다. 이 계획은 실제 수확·총 비용 보증이 아니며 비정상 저수확/승인 소진에는 별도 안전 중단이 남는다.
- **보류 Minor M1:** pending의 새 프로세스 복구 시험 미실행. pending은 같은 프로세스에서 새 관리자를 만들어 검증했고 실제 새 프로세스는 waiting/pause만 시험했다. 다음 시험 우선순위다.

검토에서 판단하지 않은 범위는 실제 native/DPAPI/공식 수령량, 다른 root/프로세스의 actor 배타, 전원 손실 내구성, 악의적 포트/파일 위조, 실게임·운영·배포다. 모두 미구현/미검증으로 남긴다. 임시 rename 저장을 native 보호 저장소의 안전성으로 보고하지 않는다. 검토 중 원본 릴레이 문서 두 개의 읽기 이탈이 있었으나 변경은 없었고 이후 지정 worktree만 읽었다.

## 실제 연결에 필요한 최소 계약

1. **조회:** 완전한 레시피/입력·기본 산출, 확인된 정원/가용자리, 안정 workId·소유 시설/레시피·실제 등록 시점/기간·완료/미수령 상태, 재고·외부 개입의 일관성 근거. 현재 이름/remainingSeconds만으로 ID/정원을 추정하지 않는다.
2. **실행 입장:** 기존 native Prepare/Confirm/nonce/game lease/common writer/journal Begin·terminal에 commandId·승인·quote·최종 문맥을 결합한다. 실제 mutation 직전 외부 변화/version·기한·비용 검증은 native adapter에도 필요하다. fake execute를 실제 CLI 호출로 치환하는 것만으로 충족되지 않는다.
3. **수령 증거:** collect/work/delivery ID, 실제 추가 지급량·부분/잔량/폐쇄 여부, 전후 재고/비용·native 종료 대조. 전체 받기가 타 작업을 포함하면 소유 범위를 재설계해야 한다. 비용0도 명시 근거가 필요하다.
4. **저장:** native DPAPI round/pending/delivery와 ACK·CAS·cross-process writer 및 모든 실행기의 동일 actor 소유권. crafting 확인량 대신 별도 승인된 가공 수령 확인 계약이 필요하다. pending 새 프로세스·중단/전원 장애 시험을 확장한다.
5. **화면:** 승인/예산·용량·보류/재개·남은 기존 작업 표시와 보호 연결을 검증한 뒤 호스트 후보 활성화를 검토한다. 실제 게임/공개 활성화는 별도 승인 전 금지다.

## 마감

목표 관리만 c63da183으로 전송했다. 새 목재 제품2·시험3·계획/QA/릴레이는 **로컬 미커밋/미전송**이다. 원본 실패/성공 로그는 ignored 로컬 경로에 보존하며 전송하지 않는다. 사용량 제한으로 직전 문서 저장은 자동 승인 검토가 완료되지 않아 미실행됐고, 재개 후 동일 승인 범위의 문서만 마감했다.

공개 gate/executionConnected=false·main·IRIS0.4.3·배포물·사용자 원장/unknown·DB·Production 유지. 신규 앱 Supabase/Vercel 호출0, 실제 게임 명령0. 과거 S01/N04 normal/최초 수령 간헐 원인 미확정과 새 교체 이벤트 역방향 호환 위험을 유지한다.
