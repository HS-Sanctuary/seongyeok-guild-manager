# ERGON native 수량 재확인 — Task 1·2 결과

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- 이번에 완료한 것: 0개·초과 산출·정정의 native 승인 경계와 작은 Windows 재확인창 연결 후보를 구현했다. 수량 출처는 `user-confirmed`만 사용한다. 관련 합성 시험 및 전체 Node 회귀는 통과했다.
- 아직 안 되는 것: 실제 Windows 창·설치본·실게임은 검증하지 않았다. Q13 React 결과 입력·정정 초안 UI와 자동 생산은 구현하지 않았다. 공개 실행은 비활성 상태다.
- 다음 작업: Task 1·2의 합성 검증 결과를 사용자에게 보고하고 멈춘다. 3차 UI 연결에 사용할 native 기반은 준비됐으나 실제 UI 검증은 남았다. 3차 UI, commit·push 및 활성화는 별도 승인 사항이다.

## 범위와 구현

기준 HEAD: `9ef6a66196948ca5a258a4e8e895c562e9f1a3f3`. 기존 N04 시험과 개인 변경·수신 ACK는 보존한다.

제품 수정은 `iris/desktop-life-progress-connection.cs`, `iris/desktop-webview.cs` 두 파일이다. 신규 시험은 `iris/desktop-life-progress-quantity.fixture.cs`, `iris/desktop-life-progress-quantity.tests.ps1`, `tests/iris-ergon-progress-quantity.test.mjs` 세 파일이다. Store·native journal 저장 형식, 공개 allowlist, React 및 서버 코드는 변경하지 않았다.

- native 내부 readonly preview에 실제 계정·캐릭터·품목·요청·기존/새 수량·사유를 복사한다. 브라우저 승인 플래그를 증거로 받지 않는다.
- 0개·초과 산출·정정에만 명시적 native 승인을 요구한다. 일반 범위 최초 양수 확인의 기존 동작을 유지한다.
- 승인 대기에는 writer/Store 파일 잠금을 풀되 actor Busy와 game lease를 유지한다. 승인 이후 문맥·payload·storeId·revision·commitDigest·native 원장을 다시 대조한다.
- 순수 도메인 사전 검증은 파일에 저장하지 않는다. 승인과 최종 대조를 통과한 뒤 실제 Store.Commit 및 저장 ACK를 확인한다.
- 승인 120초는 Stopwatch 단조 시간과 wall clock을 함께 검사한다. 시각 역전/큰 전진은 보수적으로 거절한다. 이 제한은 저장 승인 유효시간이며 팝업 자동 닫힘 기능은 아니다.
- 수량은 `user-confirmed`이며 공식 CLI 보상 검증·현재 가방 재고가 아니다. native unknown은 해제하지 않는다.
- 동일 operationId/의미 재전달은 중복 반영 없이 최신 view를 반환한다. 변경된 의미의 재사용은 차단한다. native 보호 상태가 불명확하면 재전달도 보수적으로 차단하며 별도 조회가 필요할 수 있다.

## 검증 결과

아래 PASS는 격리 합성 자료와 가짜 실행기를 사용한 결과다. 실제 게임 성공을 의미하지 않는다.

| 시험 | 결과 | 검증 내용 |
| --- | --- | --- |
| V01 | PASS | 0개는 native 승인 후 확인 0으로 저장, 추가 소비 없음 |
| V02 | PASS | 초과 5개를 예상 3개로 축소하지 않음 |
| V03 | PASS | 확인 3→2 정정은 누적 5가 아닌 2, 이력 유지 |
| V04 | PASS | provider 미설정·거절·예외 시 암호문 보존, Busy/lease 정리 |
| V05 | PASS | 계정·캐릭터·epoch·revision·수량·요청·목표 변경 시 저장 차단 |
| V06 | PASS | 단조 120초 초과, wall clock 동결/역전/전진, 단조 역전 차단 |
| V07 | PASS | 비동기 승인 중 writer 사용 가능, game lease와 Busy 유지 |
| V08 | PASS | native unknown에서 승인창·수량 저장 없이 원장 불변 |
| V09 | PASS | ACK 유실 재전달은 최신 정정 결과 반환, 중복 이벤트·재승인 없음 |
| V10 | PASS | 저장 장애 시 직전 정상 진행·native terminal 보존, 자동 재실행 없음 |
| V11 | PASS | 승인 중 정정 대상·사유 변경 시 저장 차단 |
| V12 | PASS | 최종 Inspect 읽기 도중 캐릭터·epoch·단조시간·payload 수량 변경 시 저장 차단 |

- RED: native 승인 계약/단조 시간 주입 미구현으로 V01–V10 10 FAIL을 확인했다. 구현 후 10 PASS, 추가 경계 확장 후 V01–V11 11 PASS다.
- 전체 Node: High 지적 보완 후 `node --test tests/*.test.mjs` → **644건 / 641 PASS / 기존 3 SKIP / 0 FAIL**, exit 0.
- 기존 저장 34개, A01–A22·B01–B20, H22·R5 및 N04가 포함된 관련 회귀 PASS. 별도 관련 Node 6 PASS/0 FAIL.
- High 지적 보완 후 native 8종: progress, executor, quantity, actions bridge, journal, collection, currency store, desktop store 모두 PASS, exit 0.
- 타입 검사·기존 scoped lint 및 신규 Node 시험 lint PASS. `git diff --check` PASS. Git 줄끝 정규화 안내는 시험 실패가 아니다.
- 전체 native 소스 목록 컴파일 PASS. 앱 실행·패키지/ZIP·download metadata 쓰기 없음.
- High 독립 검토 1회: 최초 사용량 제한·재개 시 capacity 오류는 검토 결과가 아니며, 동일 검토자의 최종 결과는 **C0 / I1 / M0**이다. I1은 최종 Inspect/Audit의 동기 I/O 이후 문맥·유효시간 재검사가 빠진 점이다. V12에서 기존 코드가 저장해 버리는 FAIL을 재현한 뒤, 원장 대조 이후 Commit 진입 직전에 `QuantityDeadline`·`QuantityContext`를 다시 적용했다. 보완 후 V01–V12 **12 PASS / 0 FAIL**, 재검토는 추가하지 않았다.
- 검토에서 실행하지 않은 범위: 실제 확인창·실게임·사용자 원장·운영 동작 및 검토자의 독립 테스트 실행. 이 범위는 제품 검증 완료로 주장하지 않는다.

원본 출력은 로컬 전용 `.superpowers/quantity-red.log`, `quantity-related-expanded.log`, `quantity-related.log`, `quantity-review-red.log`, `quantity-review-green.log`, `quantity-final-node.log`, `quantity-final-native.log`, `quantity-native-compile.log`에 보존하며 Git 전송 대상이 아니다. 보완 뒤 최종 로그는 `quantity-final-node-after-review.log`, `quantity-final-native-after-review.log`, `quantity-final-compile-after-review.log`다.

## 검증 대상 소스 SHA256

| 파일 | SHA256 |
| --- | --- |
| `iris/desktop-life-progress-connection.cs` | `96620CBFCE024AC07DC3C7F00FB9616C8635275A5F83578D4EF1F8C47D00F1F4` |
| `iris/desktop-webview.cs` | `D912ACA362B74EDE8057D1937CCFE5322825B13CCB8D0DA121AC53523C4E2538` |
| `iris/desktop-life-progress-quantity.fixture.cs` | `4A28020FBD1232E0E90AF52CD549AE33DF76C690A0B264EEB0197A1B07A42AFA` |
| `iris/desktop-life-progress-quantity.tests.ps1` | `8EE2569AEEAB311B06B3B837F0E0F1BEAFFD841EBB099C0D54E8F43327731ADC` |
| `tests/iris-ergon-progress-quantity.test.mjs` | `960EBB4C7A973AD043E9D6E7C2235EA8BC4866D82F624AF2CF44ECD3A6549755` |

## 보존과 한계

- N04 interruption fixture·PowerShell 시험·Node 시험·host fixture의 SHA256은 작업 전 보존값과 정확히 일치했다. 기존 N04 정상/응답 유실/Begin 직후 중단 회귀 PASS다.
- 사무실 원본 checkout의 개인 16항목과 기존 ACK는 수정하지 않았다. 작업은 별도 관리 worktree에서 수행했고 staged 파일은 없다.
- `DesktopBridge.ErgonAvailable=false`, `executionConnected=false` 유지. 개발 전용 시험 경계를 공개 실행으로 전환하지 않았다.
- 실제 사용자 원장·게임·CLI·DB·Supabase/Vercel·main·공개 IRIS/운영 0.4.2 ZIP·metadata·배포·commit·push는 변경/실행하지 않았다.
- 기존 S01 간헐 실패와 최초 수령 회귀 실패의 원인은 이번 검증과 별개로 미확정이다. 이번 회귀 PASS를 근본 원인 해결로 해석하지 않는다.
- 실제 native 창의 눈으로 확인 및 Q13 초안 UI 연동은 **미실행**이다. 안전 검토와 결과 승인이 끝나기 전 3차 UI 착수 또는 공개 활성화 완료로 보고하지 않는다.
