# ERGON D-1 — 가공 근거 조사와 수동 확인 안내

## 2026-10-29 17:24 KST 선별 전송 승인

한설이 검증된 제품2·시험2와 최소 한국어 인계/필수 기록의 기능 브랜치 commit·일반 push를 승인했다. 기준2a93f61, 대상 `codex/home-gnosis-iris-integration-20261019`. 정확한 최종 SHA는 이 QA를 포함한 커밋과 원격 HEAD다. 아래 commit/push0·미승인은 개발 당시 상태이며 이번 승인으로 전송만 진행한다. 새 CLI 조회·후속 가공 writer·main/운영 배포 승인은 아니다.

전송 전 기존11파일과 검증 SHA256 동일, 단위11 PASS·원본/옛후보·ACK34/N049 지문 동일을 확인했다. 제품/시험 추가 수정 없이 기록만 마감한다. 뉴월에게 결과와 다음 native 가공 확인 계약의 범위/시험/위험을 검토받은 뒤 영겁에게 인계한다. 가공 수량 저장·실제 자동 생산·공식 schema 검증이 완료됐다고 전달하지 않는다.

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 최신 기능 `2a93f61aa78f57d55dfb023b5d5506ddcff694d5`와 인계를 대조하고, B 관측·C DPAPI 저장·D-0 화면·제작 수량 확인 계약의 실제 경계를 조사했다. 기존 목재 현황에 읽기 전용 수동 안내를 추가했다.
- **아직 안 됨:** 새 공식 CLI 조회·최신 schema 검증·게임 캐릭터 귀속·안정 작업/배치 귀속·실제 정원/빈자리·실수령 귀속·실비용·멤버십 시간·외부 개입 배제. **가공 수령량 사용자 확인 저장도 아직 없다.** 새 안내를 반자동 생산 완성으로 표현하지 않는다.
- **다음:** 최소 공식 schema 조회 승인 여부와 가공 사용자 확인의 별도 native 저장 계약을 결정한다. 원장 unknown은 사용자 수량 확인으로 해제하지 않는다. 실제 게임/원장/DB·공개 잠금·commit/push는 이번에 변경하지 않는다.

## 1. 확인한 근거와 최신성

| 근거 | 확인한 범위 | 한계 |
|---|---|---|
| 현재 기능 브랜치 | reader/policy/evidence, C store/parser, D-0 UI, native quantity 승인 계약 | 새 게임 응답은 아님 |
| 10/21 공식 capabilities 검토 | 당시 승인된 1회 조회·28명령의 설명/예시 | 정식 reward row schema와 현재 게임 버전의 실제 응답을 보증하지 않음 |
| 설치 `mabinogi-mobile-cli` skill | 고정 CLI 위치·exit/status/body error·schema/cache·비용 지침 | 개별 품목 비용·시설 정원·현재 캐릭터 값을 제공하지 않음 |
| 현재 로컬 schema 존재 여부 | 표준 `%LOCALAPPDATA%/MabinogiMobileCLI/CAPABILITIES.json` **없음** | 없다는 이유로 capabilities/status/help를 실행하지 않음 |
| 과거 사용자 설명 | 보관함 원격 사용은 전송기·연금술 부스러기·주간 확인창 조건 | 최신 설치/비용/모달을 검증한 공식 증거가 아님 |

실제 CLI 실행0, 원시 last-response/cache·사용자 DPAPI/원장 내용 접근0이다. CAPABILITIES는 존재 여부만 확인했고 생성/갱신하지 않았다. 운영 main `ca697706a874d21668091588940ceb61338d0700`/IRIS0.4.3과 공개 배포물은 그대로다.

## 2. 자동 판정·사용자 확인·실행 차단의 구분

| 항목 | 현재 구현으로 확인 가능한 것 | 사용자 확인으로 보완 가능한 것 | 공식 근거가 필요한 것 |
|---|---|---|---|
| 캐릭터 귀속 | SANCTUM 계정·선택 캐릭터·epoch·목표의 소유 범위 | 게임 화면의 캐릭터와 선택 대상을 직접 대조한 진술 | 실제 게임 캐릭터 ID와 명령/작업의 귀속. B는 `gameIdentityVerified=false` |
| 작업·시설 | `DisplayName/FacilityName/State/IsCompleted/RemainingSeconds`, 시설명 묶음 | 직접 진행할 시설과 완료품 전체 수령 범위 확인 | 안정 workId·요청/배치·재시작 후 귀속. native nonce/requestId는 공식 workId가 아님 |
| 정원·빈자리 | 현재 목록에서 관측한 행 수 | 현재 화면의 시설 정원/사용 중 자리 확인 | 명령 직전 실제 총정원/빈자리와 외부 변경. 빈 목록·기본7·queue_full로 만들지 않음 |
| 수령·대성공 | 지원하는 flat 보고의 `collected/rewards/criticalRewards` 형식과 보상 행 수, 시설 완료품 감소 | 직접 수령해 이번 목표로 추가 확보한 양을 `user-confirmed`로 기록하는 후속 경로 | 목표/work/delivery 귀속·중복/부분 수령·base/critical 합산 의미. 보상 행/수령 건수는 산출 수량이 아님 |
| 재료·날개 비용 | 정책 예상 날개5, 과거 전후 잔액 차, 레시피 부족 항목 | 시작 예산과 게임 화면에서 실제 확인한 비용·보관함 전송 비용에 대한 진술 | 실제 quote/재료 debit·명령 귀속·수령 비용. 비용 불명은 0이 아님 |
| 시간·완료 | 저장된 조회 당시 RemainingSeconds·완료 상태 | 게임의 표시 시간과 실제 완료/수령을 직접 확인 | 등록 시각·기본 기간·멤버십 적용·수령 영수증. 남은0/시간 경과는 완료 진척이 아님 |
| 외부 개입 | 같은 IRIS root를 쓰는 실행기의 lease와 전역 unresolved 차단 | 다른 앱/수동 작업을 중지했다는 진술 | 외부 writer까지 포함한 version/명령 귀속. 사용자 진술만으로 완전 자동 안전을 증명하지 않음 |

위 ‘확인 불가’는 현재 adapter와 과거 공식 설명의 한계이며, 게임 내부에 값이 절대 없다는 뜻이 아니다. 공식 workId가 없으면 검증된 시설 단위 배치 귀속이 대안이 될 수 있지만 현재는 입증하지 않았다.

## 3. 기존 코드 재사용과 구현 가능한 최소 기능

- 계획 생성·수량 수정·취소, native goal/요청 바인딩, DPAPI/revision/operationId, 제작 결과 사용자 확인은 이미 구현된 개발 후보다. 다시 만들지 않는다.
- B는 기존 reader를 사용하는 읽기 전용 관측 provider이며 C는 `wood-v1` DPAPI·pending/영수증/예산·복구의 합성 기반을 갖는다. D-0는 저장 기록을 표시한다. **C가 없어서 진행하지 못하는 상태가 아니다.**
- C production/observation 계약은 확정량0·빈 소비 이벤트·blocked만 허용한다. `synthetic-receipt`를 실제 결과로 바꾸지 않는다. 기존 read-only DTO의 `nativeRoundPersistence=unsupported`는 관측 packet에 자동 실행 가능한 연결 근거가 없다는 의미이며 C 저장소 자체가 미구현이라는 뜻이 아니다.
- native `ConfirmQuantity/CorrectQuantity`는 crafting 요청·native journal 근거에 연결된다. 0·초과·정정은 native 재승인과 wall+monotonic 120초/전후 문맥 검사를 재사용할 수 있지만, **가공 수령량을 제작 API에 넣는 우회는 불가**하다.

이번 독립 구현은 `irisErgonWoodStatus.ts`의 `manualGuide`와 기존 `DesktopErgonWoodStatus` details뿐이다. `executionAllowed=false`, `quantityRecording=unsupported`를 유지한다. 정상 지원 범위도 실행 허가가 아닌 참고 문구다. 저장 unknown·미확인 수량·과거 native unknown/busy/foreign·손상 관측에서는 단계 안내를 숨기고 기록 확인을 먼저 안내한다. 기록 없음·보류도 다음 단계로 진행시키지 않는다.

수량·비용 입력/저장/실행 버튼, 신규 bridge/Store writer·자동 엔진·타이머는 없다. confirmed/acquired null/remaining·관측 시간·scope·기존 actor 상태를 변경하지 않는다. 실제 게임 상태를 확인했다는 문구도 없다.

## 4. 사용자에게 제안하는 최소 반자동 흐름 — 저장 연결은 다음 단계

`목표 선택 → 게임에서 직접 등록·완료품 수령 → 이번 추가 확보량 한 번 확인 → 사용자 확인 진척/남은 목표 표시`

1. 시작할 때 목표/선택 캐릭터·시설 완료품 전체 수령 범위·재료/날개/원격 전송 예산을 한 묶음으로 확인한다. 이것은 동의/자기신고이며 공식 비용 인증이 아니다.
2. 게임의 등록·대기·수령은 사용자가 직접 한다. IRIS는 새 소비 명령을 보내지 않는다. 다른 목표가 섞여 이번 추가량을 분리할 수 없으면 수량 미확인을 유지한다.
3. 수령 뒤 ‘이번에 추가 확보한 목재’만 입력한다. 기본은 빈칸, 실제0·초과 산출·정정은 명시적으로 확인한다. 출처는 항상 `user-confirmed`, 미확인은0으로 바꾸지 않는다.
4. native 저장 ACK·재조회 후에만 진척을 반영한다. 중복 operationId·ACK 유실·계정/목표 변경을 방어한다. unknown·기록 불일치가 있으면 저장 성공이나 다음 소비로 넘어가지 않는다.

현재 화면에는 1~3의 **읽기 전용 안내만** 있으며 3~4의 가공 수량 저장은 구현하지 않았다. 사용자가 오늘 이 화면에 수량을 입력해 저장할 수 있다고 안내하지 않는다. 재고 총량을 ‘이번 추가 확보량’으로 자동 가져오지 않으며 대성공 예상량도 가산하지 않는다.

## 5. 다음 구현 파일·시험·난이도

권장 최소 범위는 목재 추가100부터의 **별도 native 가공 사용자 확인 계약**이다. 기존 crafting 가드를 완화하지 않는다. 사용자 확인 원본의 권위는 기존 native 진행 저장 한 곳에 두고 C/D-0는 projection으로 읽는다. C 파일과 공통 goal 파일에 연속 두 번 써 놓고 원자적이라고 하지 않는다. 기록 eventId/중복 키는 로컬 감사 ID이며 공식 workId/deliveryId로 표시하지 않는다.

| 단위 | 예상 파일/시험 | 난이도·선행 조건 |
|---|---|---|
| native 확인 원본·승인 | `desktop-life-progress.cs`, `desktop-life-progress-connection.cs`, `desktop-bridge.cs`; 신규 event/고정 allowlist·전역 unknown·CAS/operationId·0/초과/정정·120초·손상/재시작 시험 | **중상**. 단일 권위와 구버전 역방향 호환부터 설계/검증 |
| typed 연결·목표 합산 | `irisErgonProgress.ts`, `irisDesktopStore.ts`, 기존 progress hook/wood status; source 구분·C 중복 합산 방지·ACK 유실/늦은 응답 시험 | **중**. 위 native 계약 완료 후 |
| 기존 화면의 입력 한 칸 | `DesktopErgonWoodStatus.tsx` 또는 기존 결과 확인 UI 재사용; 빈칸/0·저장 실패 초안·전환/종료·사용자 확인 라벨·폭/큰 글자 React 시험 | **중**. 동작하지 않는 저장 버튼을 먼저 공개하지 않음 |

실제 자동 등록·수령 반복은 위 계약과 별개다. 공식 귀속·정원·실수령·실비용 근거가 끝내 제공되지 않으면 현재 안전 조건으로 무감독 자동 생산을 열 수 없다. 반자동 사용자 기록은 우리 코드로 구현 가능하지만 자동 실행의 증명을 대체하지 않는다.

## 6. 필요한 공식 조회 제안 — 이번에는 실행0

| 순서 | 고정 명령·최대 횟수 | 목적과 영향 |
|---|---|---|
| 먼저 별도 승인 | `MabinogiMobile_CLI capabilities` **1회**, 재시도0 | 현재 명령/필드/설명·예시 최신성. metadata 조회라도 게임 IPC와 CLI 자체 응답 캐시 갱신 가능. 기존 캐시 원본 보존/쓰기 범위도 승인에 명시해야 함 |
| schema 확인 뒤 각각 별도 승인 | `get_altering_works` **1회** | 실제 시설/작업/시간 필드 확인. 조회는 생산/수령이 아니지만 캐시를 갱신할 수 있고 응답은 비원자 관측임 |
| 필요성이 남을 때만 별도 승인 | `get_alterable_items` **1회** | 목재 레시피·기본 산출/재료·비용 관련 필드 확인. 예상 metadata를 실제 비용/수령량으로 승격하지 않음 |

현재는 status/help/capabilities를 포함한 CLI0회다. 이 표는 실행 승인 요청의 범위 제안이지 실행 지시/자동 재시도 일정이 아니다. 첫 schema에 필요한 필드가 없으면 후속 조회로 임의 탐색하지 않고 한계를 보고한다. `complete_altering_work`, `execute_altering`, `execute_crafting` 등 소비/수령은 제안 범위에도 포함하지 않는다.

## 7. 검증과 보존

- 단위: 기존 D0 6 + 신규 D1 5 = **11 PASS**. 누락 guide RED → 최소 projection GREEN. 원본 입력 불변·unknown/과거 busy/손상·보류/기록 없음·완료0초 비승격을 확인했다.
- 실제 `DesktopErgon`+합성 native React: 누락 문구 timeout RED → GREEN. 안내 표시·unknown에서 체크리스트 숨김·quantity writer/prepare/confirm/collect0·계정/epoch/늦은 응답·보류·320/390/768/1280×글자18/20/22 PASS. 실제 게임/사용자 앱/원장은 사용하지 않았다.
- 합성 화면 390px 캡처를 눈으로 확인했다. 추가 안내는 기존 details와 스타일을 사용하며 가로 넘침·새 입력/버튼이 없다. 별도 타입·변경4파일 lint PASS.
- 독립 안전 검토 1회: **C0/I0/M1**. M1은 손상/미래 관측을 미해결 작업으로 단정한 안내 문구였다. 공통 확인 필요 문구로 RED→GREEN 보완했고 단위11 PASS를 재확인했다. 독립 재검토는 반복하지 않았다. 최종 소스의 전체 Node **779건 / 776 PASS / 0 FAIL / 기존3 SKIP**, B 관측 native PASS, C native14/API2 PASS, native 수량 V1~V15 PASS, 관련 React6+공개 잠금1·타입/변경4파일 lint·격리 Next build62경로 PASS. 최종 제품/시험4파일은 시험 사본과 SHA256이 같다.

개인16·옛후보/ACK34·N049·기존 로그/자료는 보존한다. 이번 변경은 제품2·기존시험2·계획/한국어 인계이며 실제 CLI·사용자 보호 파일·운영 DB/flag/main/IRIS·commit/push0이다.
### 최초 추가 호출 오류와 최종 판정

전체 Node는 처음부터 779건 중 776 PASS/FAIL0/기존3 SKIP였다. 그 뒤 작성자가 추가 native 단독 실행에 `desktop-life-wood-store.tests.ps1`을 필수 `-Root` 없이 넣어 `MissingMandatoryParameter`로 종료됐다. 이 파일은 Node fixture가 Root와 JSON 요청을 전달하는 시험용 서버이며, **제품 시험 시작 전의 마감 호출 오류**다. 제품/native 소스는 변경하지 않았다.

원본 오류 로그와 최초 results의 ExitCode1을 보존했다. 기존 정식 `iris-ergon-wood-native.test.mjs`와 store-api 드라이버로 실행해16 PASS를 확인하고, 중단됐던 나머지10단계를 모두 종료 코드0으로 마쳤다. 인자를 임의로 생략하거나 검증 기대값을 완화하지 않았으며 제품 결함을 재시도 성공으로 덮은 것이 아니다. 이 추가 호출 실패를 최종 제품 회귀 FAIL로 합산하지 않고 별도 이력으로 남긴다.

실제 CLI/게임/운영 설치본 검증은 미실행이다. 과거 S01·GUI timeout·수령 terminal 최초 실패 원인 미확정은 별도로 유지하며 이번 PASS로 소급 해결됐다고 하지 않는다. source/schema/자동 생산의 미확인은 위 표 그대로다.
