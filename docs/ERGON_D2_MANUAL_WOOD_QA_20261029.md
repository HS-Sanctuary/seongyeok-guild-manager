## 2026-10-29 20:57 KST — ERGON D-2 선별 전송 승인 마감

한설이 D-2 검증 후보의 기능 브랜치 선별 commit·일반 push를 승인했다. 기준2b451846c62661bccbfa64bc8260a64ac2015378, 대상 codex/home-gnosis-iris-integration-20261019. 아래 미전송/미승인은 당시 상태로 보존한다. 정확한 전송 SHA는 후속 수신 확인 기록과 원격 HEAD다.

목재100 수동 확인35→55→정정50, 단일 native audit 권위, ACK/재조회·계정 전환·중복 보호를 전달한다. C wood-v1과 crafting confirmedQuantity는 수정하지 않는다. 최종784/781 PASS·기존3 SKIP·FAIL0, 관련 native/React/타입/lint/격리build PASS, High C0/I0/M0. 검증29파일 SHA256 동일을 재확인해 전체 회귀는 반복하지 않았다.

실제 Windows 확인창 클릭·게임·사용자 저장/설치본은 미실행이다. 새 manual 이벤트 파일은 구버전 reader 판독 불가이며 다운그레이드 정책 승인 전 운영 적용하지 않는다. 공개 ERGON/실행false, 운영 IRIS0.4.3·ZIP/metadata·main·DB·Production 유지. 개인12·기존 ACK 원본·원장·로그·암호문·시험 사본 제외/보존.

순월 다음: 실제 원격 수신·ACK → D-2 QA/전송 파일 대조 → 격리 Windows 확인창/전환 시험과 역방향 정책 준비 → 한설 승인 후 실행. 자동 생산·실제 CLI·운영 적용을 시작하지 않는다.
# ERGON D-2 — 목재 수령량 사용자 확인

기준: 2026-10-29 KST / 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`의 `2b451846c62661bccbfa64bc8260a64ac2015378`.
영겁의 별도 관리 작업공간에서 구현한 **로컬 미커밋 후보**다. 이 문서와 제품은 아직 GitHub에 전송하지 않았다. 실제 게임·사용자 저장 파일·운영 DB·설치본 시험 결과가 아니다.

## 완료한 사용자 흐름

기존 ERGON 작업대에서 정확히 연결된 **목재 추가100** 목표만 다룬다. 이번에 직접 수령한 추가 수량을 빈 입력창에 적고, Windows native 확인창에서 계정·캐릭터·품목·목표·수량을 확인한다. 저장 ACK와 동일 operation의 권위 있는 재조회를 확인한 뒤 표시한다.

- 첫 수령35 → 확인35 / 남음65.
- 새 수령20 → 확인55 / 남음45.
- 첫 기록35를30으로 정정 → 확인50 / 남음50. 기존35와 정정 이유·시각도 보존한다.
- 빈칸과 사용자 확인0은 다르다. 목표 초과 수량도 임의 축소하지 않는다.
- 출처는 **사용자 직접 확인 / `user-confirmed`**이다. 가방 총량·시작 재고·예상 산출·등록 횟수는 합산하지 않는다.

추가 생산이나 게임 명령을 실행하지 않는다. 공식 수령량·작업 귀속·비용을 증명한 것도 아니다. 공개 ERGON과 `executionConnected=false`는 그대로다.

## 저장 계약과 변경 파일

| 영역 | 파일과 변경 |
| --- | --- |
| 단일 저장 권위 | `iris/desktop-life-progress.cs`: 기존 progress-v1 DPAPI audit에 `ConfirmManualWoodReceipt` / `CorrectManualWoodReceipt` 추가. 기존 document/goal/attempt/mutation의 persisted 필드·canonical 규칙은 변경하지 않음 |
| 수동 도메인 | 새 ManualWoodView는 해당 목표의 수동 audit만 읽고 receipt별 최신 기여량을 합산. mutation의 requestId 필드는 이 두 kind에서만 **로컬 수동 기록 키**이며 게임 요청/workId/deliveryId가 아님. 양방향 ID 충돌 차단 |
| native 승인·ACK | `desktop-life-progress-connection.cs`, `desktop-webview.cs`: 모든 입력에 별도 native 승인. actor mutation→game lease→공통 writer 순서, 승인 중 writer/file lock 해제. wall/monotonic120초·scope/epoch/payload/revision/goal·저장 전후 대조 |
| C 안전 대조 | `desktop-life-wood-store.cs`, `desktop-life-wood-connection.cs`: 기존 C observation을 읽기만 함. 손상·pending·전역 unknown·저장된 위험/외부 문맥 관측 차단. C 파일·수량에는 쓰지 않음 |
| typed bridge | `desktop-bridge.cs`, `lib/irisDesktopStore.ts`, `lib/irisErgonManualWood.ts`: 세 개의 별도 manual 메서드·필드 allowlist·scope/수량/정정 체인 검증. browser approved 값 거부 |
| 기존 작업대 | `DesktopErgon.tsx`, `DesktopErgonWoodStatus.tsx`, 신규 `DesktopErgonManualWood.tsx`: 수량·이력·정정·저장 상태·같은 요청 재확인 연결. C 관측 문구와 사용자 확인 합계를 구별 |

기존 crafting projection/승인·attempt·journal terminal을 위조하거나 가공 수량을 끼워 넣지 않는다. 기존 목표의 confirmedQuantity도 수동 합계로 덮지 않는다. 이 별도 수동 projection을 자동 소비·재료 예약의 허가로 전달하지 않는다. Supabase/Vercel 호출 추가0, 서버 저장0이다.

### 성공·취소·불명확한 응답

- 정상 ACK 후에도 재조회에서 operationId·revision·receipt·수량·정정 의미를 확인한다.
- native가 **publish 시도 전** 실패/승인 취소를 확인하고, 같은 문맥의 원장을 다시 읽어 해당 operation이 없음을 확인했을 때만 `not-applied` 음성 ACK를 반환한다. 입력은 남기고 수정/취소할 수 있다.
- publish를 시도했거나 문맥이 달라졌거나 응답/재조회가 불명확하면 pending과 안정 operationId를 유지한다. ‘저장 상태 확인’ 또는 같은 요청 재전달로만 복구한다. 결과 불명 요청의 임의 취소는 없다.
- 순수 입력 초안은 이후 목표가 잠겨도 취소할 수 있다. 실제 pending은 취소하지 않는다. 기존 page의 progress dirty 경계로 종료·메뉴·로그아웃·계정/캐릭터·업데이트를 보호한다. native에서도 뒤늦은 응답과 A→B→A를 재검증한다.

## 호환성과 다운그레이드

**새 이벤트가 없는 기존 v1 문서의 판독·감사 digest·확인3은 보존됐다.** 변경 전 기준 소스로 만든 고정 합성 golden과 고정된 구버전 소스로 각각 검증했다. 새 수동 기록 append 뒤에도 과거 audit prefix/digest가 같다. 원본 사용자 파일에 대한 검증은 하지 않았다.

**새 manual 이벤트가 들어간 파일은 구버전이 읽지 못한다.** 실제 새 DPAPI 파일을 기준 커밋의 reader로 읽었을 때 healthy로 인정하지 않고 암호문을 바꾸지 않는 것을 확인했다. 자동 초기화·과거 백업으로 자동 복원·이벤트 삭제·마이그레이션을 추가하지 않았다. 따라서 기능 공개 전 업데이트/다운그레이드 지원 정책의 별도 검토·승인이 필요하다. 이를 과거 기록 손상이나 감사 불일치로 오인하지 않는다.

초기8 probe는 당시 계약 점검이다. 현재 소스로 실행하는 malformed 후보 거부를 구버전의 유효한 D-2 이벤트 판독 시험이라고 부르지 않는다. 최종 역방향 증거는 `desktop-life-manual-downgrade.tests.ps1`의 **고정 구버전 + 실제 새 이벤트 파일** 시험이다.

## 필수 시나리오 대조

| # | 범위 | 결과·직접 근거 |
| --- | --- | --- |
| 1–3 | 35→55→정정50 / 남음65→45→50 | PASS: D2D01/03/04 + 실제 DesktopErgon React |
| 4–5 | 빈칸·명시0·초과 | PASS: D2D05, D2H02, React. 수량 기본값 빈칸, 전 수량 native 승인 |
| 6 | 승인 거절·예외·기한 | PASS: D2H03. 저장0, 확정 publish 전 거절과 불명 응답 분리 |
| 7–8 | ACK 유실·동일 op 중복·다른 의미 | PASS: D2D02/D2H01, typed bridge, React 같은 op 재전달/재조회. 중복 가산0 |
| 9 | 쓰기/부분쓰기/교체/검증 실패·암호문 손상 | PASS: D2D08/11. 허위 ACK0, 정상35 원본/백업 보존. 실제 새 프로세스 저장 회귀도 유지 |
| 10–11 | 승인 중 계정/캐릭터/목표/계획/수량/epoch/revision, A→B→A, 늦은 ACK | PASS: D2H03/07/08 + React epoch/다른 계정 늦은 ACK. 교체 후 문맥 변경도 ACK 차단 |
| 12 | 다른 프로세스 writer·stale CAS | PASS: D2D12. 실제 Windows 시험 프로세스2개, committed1/conflict1, 합계 증가1 |
| 13 | native 전역 unknown 우회 금지 | PASS: D2H05/06. 기존 journal unknown 유지, 저장된 위험 B/C 관측도 native 차단 |
| 14 | C·기존 목표 이중 합산 금지 | PASS: D2D06 + D2H06. manual35 뒤 C 암호문 동일, legacy 목표 confirmed0, manual만35 |
| 15 | 재시작 이력·수량·정정 | PASS: D2D10 새 PowerShell 프로세스 + React 재마운트 |
| 16 | 과거 판독·audit 호환성 | PASS: 고정 golden·D2D06. 역방향은 지원 제한: D2V01 구버전 새 이벤트 거부/무쓰기 |
| 17 | 초안/pending 종료·전환 보호 | PASS: 실제 작업대 dirty 전달·native 취소와 ACK/read 유실·동일 op 재확인·잠금 중 순수 초안 취소. 공통 page 보호 기존 회귀 재사용 |
| 18 | 기존 crafting/교체/취소/저장/재화/ASTRA/공개 잠금 | 최종 전체 회귀 결과는 아래 마감 집계. 해당 기능의 실사용 검증이나 운영 적용을 뜻하지 않음 |

## 검증 마감

- 기준 전체 Node780 /777 PASS /기존3 SKIP. 1차 전체783 /780 PASS /0 FAIL /기존3 SKIP.
- 최종 전체 Node784 /781 PASS /0 FAIL /기존3 SKIP. 새 typed bridge 시험과 마지막 native 장애/경합 시험까지 포함한다.
- 신규 native D2D01–12, D2H01–08, 고정 구버전 D2V01 및 기존 B/C·N04·native 수량V01–15: 합성 경계 검증. 실제 사용자 파일/게임0. Windows 확인창은 제품 호스트에 연결하고 컴파일했으며, 승인 동작은 합성 delegate로 검증했다. 실제 설치본에서 확인창을 누르는 시험은 미실행이다.
- 실제 React + 합성 bridge: D-2 작업대 및 기존 D-0/D-1·제작 결과·보류/ACK 복구·수량 정확성·CHRONOS 전환 저장·재화 캐시7개 회귀 PASS. 320/390/768/1280 × 18/20/22 글자12조합 PASS, 390 캡처 육안 확인.
- TypeScript, 변경 제품5+신규 시험4파일 ESLint, 전체 Windows native host **컴파일만**, 마지막 UI 수정 후 격리 Next build PASS. 빌드는 타입 검사를 건너뛰는 기존 설정이라 별도 tsc 결과를 병기한다.
- 독립 High 안전 검토1회 최종 **Critical0 / Important0 / Minor0**. 검토자가 제품/ACK를 수정하거나 게임을 실행하지 않음.

### 실패 원본과 RED→GREEN

위험 관측을 native 수동 저장으로 우회하는 경계, 로컬 receipt 키를 게임 요청으로 재사용하는 경계, 잠긴 상태에서 순수 초안 취소가 막히는 교착을 각각 RED 재현 후 최소 수정했다. 승인 취소와 ACK 불명 구분도 보완했다. 새 React render-ref lint 오류는 상태 기반 표시로 수정해 PASS했다.

시험 작성 중 잘못 세운 가정도 숨기지 않는다. (1) intent 없는 부분 tmp는 기존 Store가 정상 current35를 유지하므로 health ok일 수 있다. 불완전 tmp를 정상 수량으로 승격하지 않는지·원본35 보존을 검증하는 계약으로 대조했다. (2) 파일 교체 후 epoch 변경은 이미 검증된35의 손상이 아니다. ACK를 차단하고 동일 op 재확인 시35를 중복 없이 복원하는 것이 맞다. 최초 실패 로그는 ignored 격리 자료로 보존하며 기대값 완화로 제품 결함을 숨긴 것으로 집계하지 않는다.

과거 N04/GUI/수령 예외의 원인 미확정 기록과 기존 SKIP·무관한 lint 이력은 유지한다. 이번 합성 성공을 실제 게임 수령 성공으로 보고하지 않는다.

## 보존·미완료·다음 승인

집 원본 개인12항목(삭제 상태 포함), 기존 ASTRA ACK, 사용자 원장·암호문·이전 실패 로그를 수정/삭제하지 않았다. 새 작업공간에만 제품·시험·ACK/한국어 인계를 보존한다. ignored 로그·임시 DPAPI·구버전 소스 사본·빌드 출력은 전송 대상이 아니다. HEAD는 기준2b45184 그대로이며 staged/commit/push0이다.

미완료: 실제 CLI 보상 구조/수령 귀속·시설 정원·실비용·멤버십 근거, 자동 생산/자동 재계획, 실제 설치본/사용자 저장 호환 검증 및 다운그레이드 운영 정책. 추가 게임 조회·보호 파일 시험·운영 적용·전송은 별도 승인 사항이다.

다음 순서: 뉴월과 수동 확인 UX/역방향 제한 검토 → 전송 범위 별도 승인 → 순월은 최신 기록을 수신/ACK하고 중복 구현하지 않음 → 실제 관측의 명령·횟수·캐시 영향을 제안 후 한설 승인. 미확인 기록의 해제나 공개 실행을 먼저 하지 않는다.
