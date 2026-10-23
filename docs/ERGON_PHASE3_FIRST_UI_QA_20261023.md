# ERGON 3차 첫 결과 확인 UI — 격리 후보 인계

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- 완료: 독립 `DesktopErgonResultConfirmation`과 `useErgonProgress`, strict typed native 수량·보류/취소 요청/ACK 계약. 빈칸/0 구분, 사용자 확인·정정 이력, ACK 이후 진척, 실패 입력 유지, 동일 operation 재전달, 보류 복원과 다른 캐릭터의 늦은 응답 차단을 격리 React에서 확인했다.
- 아직 안 됨: **실제 DesktopErgon/page에 mount하지 않았다.** 실제 앱에 새 화면이 나타나지 않는 것이 정상이다. 실행 요청 바인딩/기존 CraftGoal·Queue 연결, 메뉴·캐릭터·종료 보호, 계획 삭제, 재고 재계산·계속하기, Q13 전체는 미완료다. 실제 게임·설치본 검증이 아니다.
- 다음 작업: 영겁이 아래 진입점과 기존 Task4 계획을 대조하여 실제 종료/전환 보호부터 연결한다. 공개 활성화·자동 생산은 별도 승인 전 금지한다.

## 전송 단위와 설계 판단

첫 전송: `d92d8ba259dbb1dfc69079b3be45c99dfcc21041`, N04 시험4·native 수량5 및 한국어 기록18파일. 당시 전체644/641PASS3SKIP0FAIL과 검증 소스 해시를 대조하고 일반 push/원격일치를 확인했다.

두 번째 후보: 제품5파일(`lib/irisErgonProgress.ts`, `lib/irisDesktopStore.ts`, `components/iris/useErgonProgress.ts`, `components/iris/DesktopErgonResultConfirmation.tsx`, `app/iris/desktop/desktop.css`)과 신규 시험5파일. 정확 최종 SHA는 이 문서를 포함한 기능브랜치 HEAD/원격 대조 결과를 따른다.

판단: 종료·캐릭터 이동 보호를 붙이지 않은 패널을 실제 앱에 노출하면 초안 유실 위험이 있다. 사용자에게 선행 안내한 대로 독립 후보까지만 전송하고 실제 mount를 보류한다. 비용은 실제 앱 사용 불가와 후속 보호 연결 작업이다. 별도 localStorage 진척 저장소·신규 서버 호출·새 실행 권위는 없다. 기존 native 고정 allowlist를 typed client에서 소비하며 native/bridge 제품은 이번 UI에서 변경하지 않았다.

패널은 저장된 제작 목표만 표시한다. 입력은 이번 제작으로 추가 확보한 수량이며 가방 총재고가 아니다. 0/초과/정정은 기존 native 승인을 사용한다. 보류·취소는 기존 native lifecycle만 변경하고 원장·확인 이력을 삭제하지 않는다. 미연결 계속하기 버튼은 없다. 사용자 확인 source만 표시한다.

## 검증 및 High 검토

- RED: `saveErgonQuantity` 미구현 Node FAIL, 결과 컴포넌트 누락 React FAIL. 이후 typed 요청·실제 React 패널로 GREEN.
- High 독립 검토 **C0/I3/M0**, 재검토 추가 없음. 다음 3건을 한 보완 단계에서 재현·수정했다.
  1. native 거절도 응답 불명으로 간주해 같은 attempt가 잠김: 임의 성공/거절 추정 대신 **저장 상태 확인**으로 실제 native 조회를 요청한다. 조회가 건강하고 해당 요청이 존재할 때만 operation 이벤트를 대조하고, 이미 저장됐으면 최신 결과 유지/초안 해제, 저장되지 않았으면 수정 가능한 초안으로 돌린다. 원장 busy/조회 실패는 초안을 풀지 않는다. 같은 요청 재전송도 유지한다.
  2. 같은 scope의 API 소실/조회 실패 시 view를 비워 초안 unmount: 마지막 읽기 모델을 보존하고 지원 불가/조회 중에는 입력·쓰기를 차단한다. 연결 소실은 초안 버리기 승인이 아니다.
  3. ACK 대상 증거 부족: 제출 revision보다 새 ACK, 정확한 goal/request/operation 이벤트·수량·정정 대상/사유를 검사한다. `already-applied`는 원래 이벤트를 확인하면서 최신 view를 유지한다. 비어 있는 목표의 성공 ACK와 같은 revision 성공을 거절하는 RED→GREEN을 확인했다.
- 실제 React 3개 스크립트: 결과/수명/검토 회귀 PASS. 최초 strict locator 중복과 React 반영 전 assert는 시험 동기화 오류로 보완했고 제품 실패와 구분했다.
- **최종 전체 Node645 / 642 PASS / 기존3 SKIP / 0 FAIL**, exit0. 저장34/A22/B20/H22/R5/N04/native수량12 포함.
- 타입·수정 범위 lint·diff 검사 PASS. 환경 파일 없이 합성 설정의 최종 격리 Next webpack 빌드 PASS. 기존 공개 ERGON 잠금·재화 캐시·전환 저장·플로팅 저장 strip/overlay React 회귀 PASS.
- 화면: 320/390/768/1280 × 글자18/20/22의12조건 가로 넘침0. PC 캡처를 눈으로 확인했다. 실제 설치본 DPI/키보드 전수·실제 native 승인창은 미실행이다.

### 반드시 남길 실패 이력

High 보완 전 전체 Node에서 **645/641PASS3SKIP1FAIL**: N04 `normal` 시험 자식이 ready marker 이전에 `native-result-review-required`로 종료했다. coordinator의 Begin 진입 이후 예외라는 경계까지 확인했으며 원인은 미확정이다. 해당 native/N04 소스는 첫 커밋과 차이가 없다. 분리 진단 1회2PASS, 보완 뒤 최종 전체0FAIL이지만 **재실행 PASS를 원인 해결로 판단하지 않는다**. 원본 실패 로그·격리 자료 보존, 잠금/원장/unknown 우회0. 기존 S01 간헐 실패와 최초 수령 회귀 실패도 별개로 원인 미확정이다.

## 3차 소유 시나리오별 상태

| ID | 결과 | 실제 범위 / 남은 것 |
| --- | --- | --- |
| I03 | PASS(격리) | 다른 캐릭터로 전환 후 늦은 ACK의 현재 화면 반영 없음. 실제 page 전환 미연결 |
| I08 | 부분 | 패널 remount 시 native projection 복원 PASS. 실제 메뉴/플로팅 왕복 미실행 |
| L01 | 미실행 | native 취소→계획 삭제 원자 순서 미연결 |
| L02 | 미실행 | 취소 실패→계획 삭제 보존 전체 동선 미연결 |
| L03 | 미실행 | native 취소 성공/local 계획 삭제 실패 미연결 |
| L04 | 미실행 | 계정 공용 계획 삭제/재추가의 목표 분리 미연결 |
| L05 | 미실행 | 실제 실행 중 보류/취소와 종료 응답 미연결 |
| L06 | 부분 | 보류 목표 remount 복원 PASS. 전체 native 통합 확인은 후속 |
| L07 | 부분 | 초안·명시적 초안 버리기·beforeunload 경고 후보. 실제 메뉴/캐릭터/종료 조정 미연결 |
| L08 | 부분 | 저장 시스템 분리/기존 저장 UI 회귀 PASS. 양쪽 동시 장애 통합 미실행 |
| L09 | 부분 | 기존 자동 저장 회귀 PASS. 실제 버리기/복구와 새 패널 통합 미실행 |
| L10 | PASS(격리) | 소비 API/자동 반복/계속하기 없음. 재계획 준비 자체는 미연결 |
| L11 | PASS(격리 범위) | 12폭·글자 조건 넘침 방어. 실제 설치/DPI 전수 미실행 |
| L12 | PASS(격리) | capability 소실 안내·저장 차단·공개 lock/session미mount 유지, 진척 fallback 없음 |
| Q13 | 부분 | locked 상태에서 정정 입력 보존/저장 차단. 실제 실행 원장 상태와 UI 연결 미실행 |

전체 Task4 또는 전체61 완료가 아니다. 합성 native bridge 저장을 실제 DPAPI 재시작 검증으로 대체하지 않는다.

## 영겁의 정확한 진입점

1. 기존 `docs/superpowers/plans/2026-10-21-ergon-progress-three-stage-implementation.md` Task4와 본 표를 읽는다.
2. `DesktopErgonResultConfirmation`의 props(api/scope/active/locked/onDirtyChange)와 `useErgonProgress`의 native ACK 경계를 확인한다. 현재 production import/mount는 없다.
3. `app/iris/desktop/page.tsx` 기존 requestClose/beforeunload/onBeforeApply·계정/캐릭터 전환과 `DesktopErgon`의 메뉴/초안을 같은 종료 조정자에 연결하는 최소 설계를 먼저 검토한다. callback만 연결하고 전부 끝났다고 하지 않는다.
4. `DesktopErgonExecution` 준비 바인딩 및 native 목표/요청 복원과 기존 CraftGoal·Queue·계획삭제를 연결한다. 메모리 예상량을 native 확정 진척으로 승격하지 않는다.
5. I08/L01–L09/Q13의 미검증을 채운 뒤 활성화 여부는 별도 승인받는다. N04 새 간헐 실패와 S01/수령 이력을 숨기지 않는다.

시험 명령: Node는 `node --test tests/*.test.mjs`. React3개는 각 `tests/iris-ergon-progress.browser.mjs`, `iris-ergon-progress-lifecycle.browser.mjs`, `iris-ergon-progress-review.browser.mjs`에 로컬 Playwright 설치의 `node_modules/package.json` 절대 경로를 첫 인자로 준다. 개인 경로는 소스에 하드코딩하지 않는다. 원본 로그/캡처는 `.superpowers/task4-*`에 로컬 전용으로 보존하며 전송하지 않는다.

## 보존·금지

사무실 개인16·기존 ACK·N04/수량 확정 소스·사용자 보호 원장 보존. ErgonAvailable=false/executionConnected=false 유지. 실제 게임/CLI·IRIS 강제 종료·unknown 해제·DB·신규 서버 사용·main·Production·공개 IRIS·ZIP/metadata 변경0. 운영0.4.2와 기능0.4.1 배포물 차이를 유지하며 이 브랜치 그대로 운영 배포하지 않는다.
