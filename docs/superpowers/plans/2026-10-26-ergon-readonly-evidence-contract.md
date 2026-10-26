# 가공·수령 읽기 전용 계약

사용자의 최소 DTO/capability 구현 승인을 설계 기준으로 적용한다. 기존 목재 후보/개인16·ACK·원장은 보존. 실제 native/CLI/DPAPI/bridge/UI 연결·새 명령·공개 잠금·DB/배포·commit/push 금지.

## Task1 — strict DTO (RED→GREEN)

`lib/irisErgonReadOnlyEvidence.ts`와 `tests/iris-ergon-readonly-evidence.test.mjs`를 추가한다. 기존 `parseErgonSnapshot('works')`와 `parseErgonActionState`를 재사용한다. 수령은 현재 FlatCollectionOutcome가 읽는 collected/rewards/criticalRewards와 Name/Amount만 지원하는 제한된 exact profile이다. 미래 필드/다른 envelope/cost schema는 거절하며 정식 전체 응답 schema라고 주장하지 않는다.

입력 packet은 scope/works/actionState/collection, 별도 기대 문맥은 scope/targetName/now다. scope·숫자·프로파일·미지원 필드를 검증하고 deep clone/freeze한다. 표본은 게임 조회 없이 합성한다.

## Task2 — capability/목재 연결 경계

automatic은 관측값/형식·역사 잔액 차의 판정만 의미한다. 사용자 확인은 목표/예산·시설 일괄 수령 동의·수동 추가 확보량 출처를 분류한다. workId/정원·현재 빈자리/기간·수령 귀속·비용/외부 개입/native 가공 저장은 unsupported/null이다. remainingSeconds0·잔액차0·등록/완료/collected/보상 배열을 자동 생산 진척으로 승격하지 않는다.

반환은 automaticReady=false/executionAllowed=false/confirmedProgress=null 고정이다. 기존 synthetic 목재 관리자가 이 DTO를 실행 스냅샷으로 오인해 받더라도 quote/execute0인지 실제 관리자 합성 시험으로 확인한다. 어떠한 실제 실행 adapter나 변환 함수도 만들지 않는다.

## Task3 — 회귀·보고

관련 시험→기존 목재13·pending9조합/전체Node·타입/lint. Sol Medium 교차 검토1회, 필요한 중요지적만 RED→GREEN 보완. 한국어 QA/릴레이에 실제 차단 원인·해결 가능성·사용자 확인의 한계와 다음 최소 단계를 기록하고 미커밋 마감한다.

## Review Focus

**마감:** 신규8 RED→GREEN, 최종 Node685 PASS/기존3 SKIP/FAIL0(총688), 목재13/pending9 유지·타입/lint PASS. Sol Medium 교차검토1회 C0/I0/M0. 순수 분석 계약만 구현했으며 실제 native 공급자·실행·저장 연결 없이 미커밋 보존한다. 최종 판단/사용자 확인의 한계는 `docs/ERGON_READONLY_EVIDENCE_QA_20261026.md`를 따른다.

1. 보고된 보상/collected가 실수령/목표 진척으로 승격되는가.
2. 예상5·잔액차0이 확인된 비용/0비용 quote가 되는가.
3. 누락·미지원·오염·외국 scope·오래된 관측값이 false-ready를 만들 수 있는가.
4. 사용자 확인이 unknown/작업 ID/권위 증거 누락을 덮는가.
5. DTO가 synthetic snapshot으로 변환되거나 실제 실행/저장 경로에 연결되는가.
