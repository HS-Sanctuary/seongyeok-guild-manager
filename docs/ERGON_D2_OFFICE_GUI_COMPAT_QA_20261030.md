# ERGON D-2 사무실 독립 검증 — 2026-10-30

**17:50 KST 전송 승인 후속:** 한설이 집 PC 인계를 위한 시험·최소 한국어 문서의 선별 commit·일반 push를 승인했다. 아래 commit/push0·로컬 미전송은 검증 종료 당시 사실이다. 이번 전송은 기능 브랜치만 대상으로 하며 발견한 제품 결함·호환 정책·독립 검토 미완료를 해결하거나 운영 활성화하지 않는다. 최종 수신 SHA는 이 기록을 포함한 커밋과 원격 HEAD다.

전송 직전 새 시험8파일의 SHA256이 최종 검증본과 같고, GUI 격리6개+호환 wrapper1개의 집중 재검증은 **7 PASS / 0 FAIL / 0 SKIP**이었다. 전체 회귀는 같은 소스의791/788 PASS/기존3 SKIP 결과를 유지하고 불필요하게 반복하지 않았다. 이 선별 전송은 새 시험8·QA2·계획1·수신 ACK/인계3·릴레이 발신1·필수 release/master2의 총17파일이다. 별도 사용자 ASTRA 문서 수정은 포함하지 않는다.

- **이번에 완료한 것:** 기능 브랜치 `6a55aa07c67b6a824f7b0d204949079d95e6dc96`의 31파일 수신·ACK, 실제 WinForms/WebView2 작업대와 Windows 확인창의 수령35→추가20→첫35를30으로 정정(합계50), 취소 및 실제120초 초과 승인 거부를 검증했다. 기존 DPAPI 기록으로 A–D 호환성 합성 시험과 전용 경로 보호 시험을 추가했다.
- **아직 안 되는 것:** 운영 사용자 시험·공개 활성화는 보류한다. 구형 개발 reader의 명시적 `Recover`가 새 manual 이력이 없는 백업을 current로 발행할 수 있다. 실제 작업대에서는 캐릭터 선택창을 열었다 닫을 때 미저장 입력·저장 미확인 UI가 사라졌다. 저장된50 및 정정 이력은 유지됐지만 초안 보존은 실패했다. 경로 보호 수정 후 독립 재검토도 이용 한도로 끝내지 못했다.
- **다음 작업:** 임시 비활성화→재조회 중 manual 입력 컴포넌트가 제거되는 경계를 수정·검증한다. 정상 복귀 버전과 구형 복구를 포함한 데이터 호환 정책을 승인받는다. 남은 실제 GUI 전환·장애 시험과 독립 검토를 끝낸 뒤 사용자 시험 여부를 다시 판단한다.

## 수신·범위·보존

대상은 `codex/home-gnosis-iris-integration-20261019`, 제품/시험 `9c4070a08b8c26aac38591c6c08225b7136402ed` 및 후속 문서 `6a55aa0`다. 기존 관리 worktree에 ff-only 수신했고 `TO_SOONWOL.md`에 읽은 범위와 제한을 ACK했다. 운영 main `ca697706a874d21668091588940ceb61338d0700`은 읽기 전용으로 대조했다.

이번 신규 후보는 native 호환성 fixture/runner/Node 시험3개와 GUI 격리 준비·서버·entry·builder·검사5개, 계획 및 한국어 QA다. 기존 D-2 제품 소스·저장 스키마·updater를 수정하지 않았다. 원본 개인16을 포함한 옛 변경·ACK34 및 별도 N049파일의 SHA256이 기존 manifest와 모두 같았다. 현재 worktree에서 별도로 나타난 ASTRA 문서의 사용자 수정1건도 덮어쓰지 않는다. ignored 로그·암호문·프로필은 로컬 보존한다.

실제 게임 CLI/소비·사용자 원장·실제 계정·DB·배포·공개 ZIP/metadata·commit/push는 수행하지 않았다. `ErgonAvailable=false`, `executionConnected=false`는 유지한다. 합성 창에만 명시적인 기존 local-testing 옵션과 별도 프로필을 사용했다.

## 실제 Windows GUI

원래 `DesktopPage`/`DesktopErgon`과 native `DesktopWebView`/`DesktopLifeProgressConnection`/DPAPI 저장소를 사용했다. native 승인 delegate는 제품의 `ConfirmManualWoodAsync`와 `MessageBox.Show` 그대로다. `Task.FromResult(true)` 또는 브라우저 가짜 승인으로 대체하지 않았다. 입력·버튼은 Computer Use로 조작했다. 원래 사용자 IRIS·게임은 제어하지 않았다.

시험 사본은 외부 HTTP/창 열기/updater/Process.Start/게임 추적·CLI를 차단한다. localhost 합성 계정·캐릭터와 owner별 GUID 프로필만 허용한다. 공개 feature flag는 원본에서 바꾸지 않았다. 관측이 지원되지 않는 생활 현황을 가짜 값으로 채우지 않았다.

| 항목 | 결과 | 실제 근거 및 한계 |
| --- | --- | --- |
| 합성 계정·캐릭터 선택과 ERGON 진입 | PASS | 실제 WebView2에서 `합성A`·`합성A캐릭터` 선택. 초기 진행 조회 실패 뒤 명시적 새로고침으로 진입 |
| Windows 확인창 표시·귀속 | PASS | 계정·캐릭터·목재·추가목표100·수량35 및 user-confirmed 안내를 실제 창에서 확인 |
| 수령35 저장·재조회 | PASS | revision2, manual35/남음65, receipt1, `user-confirmed`. crafting 확인량0, 실행0 |
| 추가20 저장 | PASS | revision3, manual55/남음45 |
| 첫35→30 정정 | PASS | revision4, manual50/남음50. 첫 이력 `[35,30]`과 정정 사유, 두 번째20 보존 |
| native 취소 | PASS | 20 승인 취소 시 기존35/남음65 및 입력20 유지. 이후 별도 승인으로55 저장 |
| 실제 승인 만료 | PASS | prompt 관측 후151초를 넘겨 확인 클릭. native `not-applied`, revision4·50/50·receipt2 유지. 시계 변경 방어는 기존 native 합성 시험과 구분 |
| 빈칸과0 구분 | 부분 검증 | 초기 빈칸의 저장 버튼 비활성 확인. 실제0 저장 클릭은 미실행, native/React 합성 시험은 별도 PASS |
| 미저장·저장 미확인 상태의 임시 화면 전환 | **FAIL** | 만료로 pending7이 남은 상태에서 캐릭터 선택창 열기→닫기 후 입력 및 재확인 버튼 소실. 확정50은 보존 |
| 확인창 X 닫기 | 미실행 | native 취소 클릭과 동일한 시험으로 집계하지 않음 |
| 승인 도중 계정·캐릭터·epoch 변경 | 미실행 | native 합성 H 시험 PASS와 실제 GUI 시험을 구분. fixture의 epoch fault 기능을 실제 GUI에서 사용하지 않음 |
| 실제 GUI ACK 유실·재조회 장애 | 미실행 | 실제 timeout UI는 관측했으나 별도 dropAck/readFail 시험은 미실행. React 합성 시험과 구분 |
| 실제 GUI 로그아웃·업데이트·플로팅·큰 글자 | 미실행 | 기존 React/native 회귀만 수행. 운영 설치본·OS 동작 검증으로 확대하지 않음 |

창 활성화는 최초 `failed to activate captured window`로 실패했다. 시험 창을 다시 열고 사용자가 합성A 창의 상단을 클릭한 뒤 입력이 가능해졌다. native modal의 cached element 입력은 한 번 실패하여 최신 modal screenshot에서 버튼 위치를 재확인한 후 클릭했다. 실패를 숨기거나 실제 사용자 앱으로 우회하지 않았다.

## 신규 발견: 임시 비활성화 후 manual 초안 소실

실제 GUI 관측을 합성 React로 별도 고정했다. `DesktopErgon`에 manual 입력7을 두고 `active=false` 후 재활성화할 때 진행 재조회 응답을 잠시 보류했다. 조회 중 manual subtree가 제거되고 다시 마운트되면 결과는 `before=7, after='', dirty=true, manualWrites=0`이었다. 초안 보존 assertion은 **FAIL**이다. 새 native 저장 없이도 재현되며 사용자 자료는 사용하지 않는다.

코드상 `DesktopErgonResultConfirmation`은 진행 조회 중 `onViewChange(null)`을 보낸다. `DesktopErgon`의 선택 목표가 사라지고 `DesktopErgonWoodStatus`의 manual identity도 사라져 입력 컴포넌트가 제거된다. 재조회 완료 후 local state가 빈 입력으로 다시 생성된다. 실제 GUI에서 pending 요청 UI도 소실된 점을 보존한다. 이 결과를 native 원장 손상이나 성공 처리로 확대하지 않는다.

최초 진단은 비활성 직후 곧바로 subtree가 없어질 것이라는 잘못된 가정으로 timeout됐다. 소스 대조 후 **재활성→loading** 경계를 지연 응답으로 고정하여 기대값7과 실제빈칸의 실패를 확인했다. 두 원본 로그를 모두 보존한다. 성공할 때까지 재실행한 결과가 아니다.

필요한 최소 후속은 동일 소유 목표의 draft/pending identity를 조회 로딩과 분리하여 보존하고, 조회 중·실패·문맥 변경에서는 저장을 계속 차단하는 것이다. 단순히 `null` 전달을 없애는 것만으로 실패·다른 계정·목표 교체까지 안전하다고 간주하지 않는다. pending operationId·revision·수량·정정대상 보존과 재조회 후 동일 요청 복구를 실제 작업대에서 검증해야 한다. 이번 마감에서는 미검토 제품 패치를 넣지 않았다.

## 업데이트·다운그레이드

상세 A–D와9개 합성 PASS, 최초 시험 가정 수정 및 해시는 [호환성 QA](ERGON_D2_UPGRADE_COMPAT_QA_20261030.md)를 따른다.

- 기존 v1→새 reader, 새 이벤트 후 구형 Load/일반 Commit의 안전한 거부, 저장 중단·ACK 유실, 새 reader 복귀는 격리 DPAPI/새 프로세스에서 검증했다.
- **중요 미해결:** 고정 구형 개발 reader `2b45184`의 명시적 `Recover`는 old-compatible 백업을 current로 발행할 수 있다. 시험에서 `committed/review-required`, currentChanged=true, manualVisibleInCurrent=false였다. 새 manual 암호문은 백업에 남지만 사용자 화면에서 최신 이력이 사라지는 위험은 해소되지 않았다.
- 운영 main의 IRIS0.4.3 소스에는 progress reader 및 build 연결이 없다. `2b45184`의 결과를 실제0.4.3 설치본의 reader 검증으로 부르지 않는다.
- 앱 업데이트의 파일 rollback에는 progress reader/감사 호환 검사가 확인되지 않았다. 실제 installer·직접 다운로드·실제 운영 데이터의 rollback은 미실행이다.

운영 정책 제안은 **새 이벤트를 읽고 보존할 수 있는 정상 복귀 버전을 먼저 확정하고, 그 전에는 D-2 사용자 기록 생성을 공개하지 않는 것**이다. 호환되지 않는 구형 복구·앱 rollback을 막는 정책과 사용자 안내는 별도 승인이 필요하다. 오류 시 자동 초기화·감사 이력 삭제·구형 백업 강제 복원은 허용하지 않는다. 실행 파일을 사용자가 직접 보유한 상황까지 현재 updater만으로 통제할 수 있다고 주장하지 않는다.

## 시험 결과 및 근거

로컬 원문은 ignored `.superpowers/ergon-d2-receive-20261030/` 및 owner별 시험 출력에 보존한다. 경로·로그·암호문·개인자료는 Git 후보에 포함하지 않는다.

| 범위 | 결과 |
| --- | --- |
| 수신 D-2 native·host·고정 구형 호환 Node 집중 | 5 PASS / 0 FAIL |
| 신규 A–D 실제 DPAPI 자식 프로세스 | 9 PASS, wrapper1 PASS. 명시적 구형 Recover는 별도 LIMIT/운영 차단 |
| 신규 GUI source/path 격리 | 6 PASS. 합성 junction→합성 폴더만 사용 |
| 강화 GUI native 컴파일·소유권 없는 실행 차단 | PASS. GUI 실행 결과와 구분 |
| 실제 제품 native 전체 소스 컴파일만 | PASS. 생성 실행 파일은 시작하지 않음 |
| 실제 React 집중5개와 ASTRA2개 드라이버 | 모두 exit0: D-2, D-0/D-1, 진행 lifecycle, 재화 캐시, addon lifecycle, ASTRA online/activity. D-2 및 ASTRA의12 폭/글자 조합·ACK/재조회·정정 포함. 진행 lifecycle 드라이버는 실제 Page 종료 통합을 검증하지 않는다고 명시한다. 신규 전환 진단 FAIL은 이 기존 PASS로 덮지 않음 |
| 추가 IRIS 통합 React 드라이버 | **FAIL**: `iris-desktop-ui.browser.mjs:50`의 제목 클릭이 열린 `.iris-focus-backdrop`에 막혀 timeout. 최초 로그 보존·재실행하지 않음. 수신 제품 소스 그대로의 시험에서 관측했지만 기존 발생 이력·제품 결함/시험 기대 불일치의 구체 원인은 미확정. 전체 IRIS 사용성 PASS로 보고하지 않음 |
| TypeScript | PASS, exit0 |
| 신규 MJS4개 ESLint | 오류0, warning1 (`readFileSync` 미사용) |
| 격리 Next webpack build | PASS, 62페이지. 합성 환경값 사용·배포0. build가 타입 검사를 생략하므로 별도 tsc 결과를 사용 |
| 최초 전체 Node | 791 중787 PASS / 1 FAIL / 기존3 SKIP. 격리 사본의 WebView2 Core/Forms SDK 누락 CS0006 |
| 누락 SDK 복원 후 해당 시험 | 1 PASS / 0 FAIL. 기존 SDK3개만 SHA 대조해 사본에 복원 |
| SDK 복원 후 최종 전체 Node | **791건 / 788 PASS / 0 FAIL / 기존3 SKIP**, 직렬487.5초, exit0. N04 중단·응답유실·새 프로세스 복구, C/B/unknown/lease 회귀 포함. 별도 React FAIL을 해소하지 않음 |
| 신규 초안 소실 진단 | **FAIL**, 입력7→빈칸·manualWrites0 |

## 독립 검토와 마감 판단

요청한 High 독립 검토1회에서 새 Critical0·Important1(시험 경로 ancestor/manifest 격리), 기존 정책 Important1(구형 Recover)을 지적했다. 시험 전용5파일 안에서 모든 ancestor의 symlink/junction을 파일 읽기·mkdir 전에 거부하고 exact owned output/profile/manifest를 확인하도록 보완했다. RED→6 PASS 및 강화본 컴파일·실제 GUI를 확인했다. **해당 보완의 마지막 독립 재확인은 이용 한도 도달로 미완료**이며, 완료된 검토로 표시하지 않는다. 이후 실제 GUI에서 발견한 초안 소실도 독립 검토 완료 범위 밖이다.

과거 S01·최초 수령 회귀 실패 이력은 이번 시험으로 원인 해결을 선언하지 않는다. 수신 N04/원장/unknown/lease 보호 회귀는 최종 전체 Node에서 통과했다. 기존3 SKIP은 category heading/separator/summary 정적 화면 시험이다.

최종 소스 대조는 tracked1111파일을 대상으로 했다. 31파일은 checkout 줄바꿈(CRLF/LF)만 달랐고, 내용 차이는 로컬 수신 ACK 및 별도 사용자 ASTRA 문서 수정뿐이었다. 받은 제품 코드의 내용은 같으며 신규 시험8파일은 사본과 SHA256이 같다. 실제 제품·운영 ZIP/metadata 변경0, staged 파일0이다. 최종 `git diff --check`를 확인한다. 합성 GUI·서버는 exe 경로/owner를 확인해 정리했고 프로필·원본 로그·암호문은 삭제하지 않았다.

결론: 실제 Windows 확인창과 DPAPI 저장·정정의 기본 흐름은 검증했지만 **실제 사용자 시험은 아직 시작하지 않는다.** 초안/pending 보존, 구형 복구·rollback 정책, 남은 GUI 장애·전환과 독립 검토가 선행 조건이다. 공개 ERGON/실행 연결은 그대로 닫혀 있고 commit/push는 하지 않았다.
