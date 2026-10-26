# 가공·수령 읽기 전용 DTO/capability — 2026-10-26

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 확인된 native 정규화 조회·정책·executor 필드만 사용하는 strict DTO와 관측/사용자 확인/미지원 판정기를 구현했다. 지원하지 않는 값은 null/unsupported이며 실행 허가와 확정 진척을 생성하지 않는다.
- **아직 안 됨:** 실제 native 공급자/bridge/CLI 조회·실행·DPAPI 가공 진척·사용자 확인 저장 연결은 없다. 필수 미확인 항목을 사람이 확인했다고 자동 증거로 승격하는 기능도 없다.
- **다음:** 이 계약을 제공할 신뢰된 native 읽기 전용 공급자와 누락 capability 응답의 합성 구현을 검토한다. 실제 실행은 계속 차단하며 공식 식별/귀속/비용 근거를 확보해야 한다.

## 구현 범위

- 신규 제품 `lib/irisErgonReadOnlyEvidence.ts`: `parseErgonReadOnlyDTO`, `assessErgonReadOnlyEvidence` 두 순수 함수. IO/네트워크/bridge/CLI·저장 import나 호출이 없다.
- 신규 시험 `tests/iris-ergon-readonly-evidence.test.mjs`: strict 형식·오염/누락·시각·소유 문맥·수량/비용 비승격·불변성·실제 목재 관리자 소비0 검증.
- 기존 `parseErgonSnapshot('works')`, `parseErgonActionState`를 재사용했다. native 제품·목재 관리자·DPAPI·원장·UI 파일을 수정하지 않았다.
- 입력 packet은 `scope/works/actionState/collection`, 기대 문맥은 `scope/targetName/now`만 허용한다. 이 봉투는 로컬 분석 계약이며 새로운 공식 CLI schema가 아니다. scope 일치는 기대 문맥 비교일 뿐 실제 응답 출처를 인증하지 않는다.

## 지원 프로파일과 제한

works는 기존 native 정규화의 completedCount/items 및 name/facility/state/completed/remainingSeconds만 받는다. 동일 내용의 행도 보존하며 순번이나 합성 ID를 안정 workId로 만들지 않는다. 완료 표시와 남은 시간은 관측값일 뿐 수령 허가/목표 확보량이 아니다.

actionState는 기존 strict parser로 검증하고 현재 account/character의 기대 문맥을 대조한다. cost DTO는 기존 expectedWings를 `policyExpectedWings`로 구분하며 beforeWings/afterWings/역사 잔액 차만 보존한다. 현재 시점·독점 귀속·확정 비용을 보장하지 않는다. 잔액 차0은 무료 수령 근거가 아니며 null과0을 구분한다.

collection은 현재 `FlatCollectionOutcome`가 읽는 **collected/rewards/criticalRewards**, 각 행의 **Name/Amount**만 받는 제한된 exact profile이다. 정식 전체 공식 응답 schema를 확인했다는 뜻은 아니다. 추가 cost/workId/미래 필드나 다른 envelope는 거절한다. base/critical 배열은 별도로 보존하며 합산 의미를 추정하지 않는다. collected는 보고된 수령 작업 수이며 목재 산출량이 아니다. 배열이 비었거나 미지원이라고 확보0으로 만들지 않는다.

DTO와 판정 결과는 입력과 분리해 clone/deep-freeze한다. 판정 결과는 항상 **automaticReady=false / executionAllowed=false / confirmedProgress=null**이다. 불량·미지원 packet은 valid=false와 invalid-evidence 차단을 반환하며 부분 자료만으로 ready를 만들지 않는다.

## 정보별 판정

| 정보 | 판정 | 의미·제한 |
|---|---|---|
| 신선한 works 목록/보고 상태·남은 시간 | automatic | 현재 프로파일 관측/형식만. 완료량/정원/실행 허가 아님 |
| 지원 flat profile 보상 행 | automatic | 보고된 행 수/내용 관측만. 실제 수령 귀속/합산 아님 |
| 해당 가공/수령의 역사 날개 잔액 차 | automatic | 산술 관측만. 현재 quote/실비용 아님 |
| 목표·재료/날개 예산 | user-confirmation | 사용자 결정 대상. 확인된 비용을 대체하지 않음 |
| 시설 완료품 전체의 영향 범위 동의 | user-confirmation | 다른 품목까지 포함할 수 있음. 단일 work 귀속을 대체하지 않음 |
| 사용자가 직접 본 추가 확보량 | user-confirmation | 향후 별도 user-confirmed 기록 대상. 현재 저장/API 없음. 공식 수량·unknown 해제 아님 |
| 안정 workId·요청 결합 | unsupported/null | 이름/시설/행 순서/requestId로 공식 workId를 만들지 않음 |
| 실제 총정원/빈자리 | unsupported/null | 빈 목록도7빈자리로 추정하지 않음 |
| 실제 등록 시각·가공 기간 | unsupported/null | RemainingSeconds0·멤버십 진술로 기간/완료를 확정하지 않음 |
| 요청에 귀속된 실제 수령량 | unsupported/null | work/delivery 귀속·부분·중복·critical 의미가 연결되지 않음 |
| 확인된 가공/수령 비용 | unsupported/null | 정책 예상5·잔액 차·사용자 예산과 분리 |
| 외부 앱/수동 개입 배제 | unsupported/null | 같은 IRIS lease에 참여하지 않는 개입을 증명하지 못함 |
| native round/pending/delivery 저장 | unsupported/null | 기존 crafting 확인량으로 가공 진척을 위장하지 않음 |

여기서 automatic은 **관측값의 자동 판정**이며 자동 실행 가능이라는 뜻이 아니다. 오래되거나 미래인 works, native busy/blocked/unknown, 누락/외국 문맥은 별도 차단 사유로 남긴다. 사용자 확인으로 unsupported를 supported로 바꾸는 경로는 없다.

## 검증

신규8개 RED(모듈 없음)→GREEN, 최종 전체 **688개 중685 PASS / 기존3 SKIP / FAIL0**. 기존 목재13개·pending9복구 조합·목표 관리/native 보호 회귀를 유지했다. TypeScript·관련 lint도 오류/경고0이다.

| 신규 시험 | 결과 |
|---|---|
| 알려진 관측/미확인 capability 분리 | PASS |
| 남은 시간0/빈 목록 비승격 | PASS |
| 임의 workId/capacity/cost·envelope·위험 수량 거절 | PASS |
| null/0/음수 역사 잔액 차와 실제 비용 분리 | PASS |
| 기대 scope/오염/가짜 source 거절 | PASS |
| 오래됨/미래/누락·unknown과 보상 비승격 | PASS |
| clone/freeze·사용자 확인 비승격 | PASS |
| 기존 목재 관리자에 실행 자료로 오연결 시 quote/execute0 | PASS |

마지막 시험은 실제 관리자를 사용하지만 CLI/저장은 합성 포트/임시 파일이다. 공식 DTO를 synthetic-cli snapshot으로 변환하지 않았고, source/필수 증거 검사에서 blocked·확정0·소비0이다. 실제 native 실행 성공이 아니다. 이번에는 UI/host/native 소스를 바꾸지 않아 이전 격리 build/React 근거를 유지하고 반복하지 않았다.

Sol Medium 교차 검토1회 **C0/I0/M0**, 수정 권고 없음. 판단 유보는 실제 최신 CLI/실수령 귀속·정원/기간·실비용·외부 배제·DPAPI 연계/실행 성공과 packet 출처 인증이다. 모두 미검증으로 유지한다. 검토자는 새 게임 조회나 테스트를 실행하지 않았으며 순월이 위 최종 회귀를 확인했다.

## 최종 결론 — 막힌 문제와 해결 방식

**현재 완전자동을 막는 것은** 안정적인 작업/수령 귀속·실제 정원·검증된 비용/외부 개입 근거와 native 가공 진척 저장 연결의 부재다. 관측값을 읽는 코드가 생겼다고 이 문제가 해결된 것은 아니다.

**해결 가능한 부분:** native 읽기 전용 공급자, round/pending/delivery DPAPI 저장과 기존 journal 정합성은 별도 승인 후 우리 코드로 구현할 수 있다. 작업 식별·시설/수령·비용은 공식 schema/응답 근거를 확보하여 확인되면 계약을 확장할 수 있다. work 단위 귀속이 제공되지 않으면 검증된 시설 단위 독점 배치 계약이 대안이 될 수 있지만, 현재는 설계/입증되지 않았다.

**근거를 확보하지 못하면:** 현재 필드와 현 안전 조건만으로 무감독 자동 생산을 허용할 수 없다. 사용자 확인 한 번으로 workId·현 빈자리·실비용·외부 개입이 해결된다고 말하지 않는다. 후속 반자동을 택할 경우 목표/재료·날개 예산, 매 회차 시설 전체 수령 범위, 직접 확인한 이번 추가 확보량과 출처를 확인받아야 한다. 그 확인을 저장·정정할 별도 native 계약도 아직 필요하다. unknown은 단순 ‘받았어요’ 답변으로 해제하지 않고 기존 보호/대조 근거를 유지한다.

이번에는 사용자에게 실게임 확인을 요청하거나 수동 확인을 실제 기록으로 저장하지 않았다. 다음 최소 구현은 **실행 기능 없는 native 읽기 전용 공급자·capability parity 합성 시험**이며, 누락은 계속 unsupported로 반환해야 한다. 실제 실행·새 CLI 조회·저장 연결·공개 활성화는 별도 승인 전 하지 않는다.

## 보존과 마감

기준 HEAD c63da183679bb219bbd21f7626a4b869d34ba524와 기존 모든 미커밋 목재 후보·개인16/ACK/원장/ignored 로그 보존. 새 CLI 명령·사용자 원장·DPAPI 진척·DB/서버·main/IRIS0.4.3/Production 변경0, 공개 gate/executionConnected=false 유지. 이번 제품/시험/문서는 로컬 미커밋/미전송이다. 과거 간헐 실패 원인 미확정 및 새 교체 이벤트 구 native 역방향 호환 미검증 위험도 그대로 남긴다.
