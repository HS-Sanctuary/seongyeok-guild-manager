# ERGON D-1 정적 근거와 읽기 전용 수동 안내

## 목적과 선택

한설의 D-1 요청 중 안전하게 독립 구현할 범위는 **기존 목재 현황의 수동 확인 안내**다. 가공 실수량 입력/저장이나 자동 생산을 구현 완료로 표현하지 않는다. 기존 B/C/D-0·제작 수량 확인 계약을 재사용/대조한다.

- 공식 자동 생산 연결: work/시설·정원·실수령·실비용·캐릭터 귀속 근거가 없어 제외.
- 가공 수량 저장 UI 연결: 기존 native 확인은 crafting 전용이고 C 관측 모드는 확정량0만 허용한다. 별도 원자적 사용자 가공 확인 계약 없이 재사용하지 않는다.
- **선택:** 저장/실행이 없는 안내 projection과 기존 현황의 작은 details. 요청에서 위임한 독립 범위에 대한 작성자의 판단이다. 새 관리 화면·엔진·브리지·사용자 자료 접근은 없다.

## 근거 조사

- 최신 기능2a93f61 수신 대조, 운영 main ca697706/IRIS0.4.3 보존.
- 설치 skill·기존 10/21 capabilities 조사·현재 reader/policy/evidence/C 저장·수량 확인을 대조한다. 현재 표준 CAPABILITIES 파일은 없어 최신 schema를 확인했다고 하지 않는다. 실제 CLI/응답 캐시 접근은 하지 않는다.
- 공식 설명/현재 adapter/합성 추론/사용자 진술을 분리해 한국어 QA를 작성한다. 실제 조회가 필요하면 고정 명령·횟수·캐시 영향·합격 기준부터 제안한다.

## Task 1 — projection RED → GREEN

- 수정: `lib/irisErgonWoodStatus.ts`, `tests/iris-ergon-wood-status.test.mjs`.
- guide는 quantityRecording=unsupported, executionAllowed=false. 정원·비용·실수령량을 새로 계산하지 않는다.
- 정상 지원 범위는 참고 안내만 표시. 저장 unknown·미확인 수량·과거 native unresolved/busy·손상 관측·기록 없음에서는 진행 단계 안내를 숨기고 기록 확인을 먼저 안내한다.
- 기존 confirmed/acquired/null·scope/목표·관측 시각/남은 시간 계약을 그대로 유지한다. 미래·오래된 관측으로 현재 완료/수령 권한을 만들지 않는다.

## Task 2 — 기존 UI 합성 검증

- 수정: `components/iris/DesktopErgonWoodStatus.tsx`, `tests/iris-ergon-wood-status.browser.mjs`.
- 기존 details/문구 스타일 재사용, 신규 수량 입력·저장·실행 버튼 없음.
- 실제 DesktopErgon + 합성 native로 안내 표시/unknown 차단·보류·계정/epoch/늦은 응답·모바일 폭/글자 크기·관측/소비/수량 writer0을 확인한다.
- 기대 문구가 없는 RED를 확인한 뒤 최소 표시 연결. 다른 시험의 공통 fixture는 변경하지 않는다.

## Task 3 — 마감

- 관련 B/C/목재/수량/결과 UI·공개 잠금 회귀, 타입·변경 lint·격리 빌드. 필요한 전체 Node/native를 최종 소스에서 확인한다.
- 실제 공식 조회/소비·사용자 저장소·운영 DB/flag/main/IRIS·commit/push0. 개인16·옛후보/ACK34·N049 지문 보존.
- 다음 가공 사용자 확인 writer의 최소 파일·원자성·0/초과/정정·unknown 보호 시험을 제안하되 이번에 구현하지 않는다.

## 실행 결과

Task1~3 완료. 상세 PASS/최초 호출 오류/독립 M1 보완/미실행은 ../../ERGON_D1_MANUAL_REVIEW_QA_20261029.md를 따른다. 실제 CLI·사용자 원장·운영·commit/push0이며 다음 native 가공 사용자 확인 writer는 이번에 구현하지 않았다.
