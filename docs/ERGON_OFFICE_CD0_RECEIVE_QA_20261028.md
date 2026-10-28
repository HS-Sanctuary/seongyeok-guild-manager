# 순월 C/D-0 수신 독립 검증 — 2026-10-28

기준 수신 HEAD: `a826ad0ad4728540034678cb8e46167f57a2b5e1`. C/D-0 제품을 수정하지 않고 기존 합성 시험과 정적 대조만 수행했다. 이 문서는 전체 Node 최종 결과를 대신하지 않는다. ACK/Git 작업은 부모 작업자가 담당한다.

## PASS

- 실제 React D-0 시험: 확정 기록0/실제 확보량 미확인, 대기 관측, 조회 당시90초, unknown/오류, 보류 목표 조회 차단, 재mount, ABA/계정·캐릭터 및 같은 scope epoch 변경의 늦은 응답 폐기, 320/390/768/1280과 글자18/20/22 조합, observe/소비0을 확인했다.
- 기존 React6종: workbench-results, page-protection, lifecycle-ack, save-transition, currency-cache, release-lock 모두 PASS. 목표4/확인3/남은1·초안·종료/계정/캐릭터/업데이트 보호·ACK 유실·CHRONOS 저장 실패 전환·재화 복원·공개 ERGON 잠금을 확인했다.
- 현 n04 경로의 native 기존 시험: progress34, journal, progress-host22, host 정책41, currency3그룹, encrypted store 모두 exit0.
- 공개 `IRIS_ERGON_AVAILABLE=false`, 기존 executionConnected=false 및 observation native DTO의 executionAllowed=false 유지 확인.

## FAIL / 미완료

- 현 n04 native collection 시험은 exit1. 정확한 assertion: `Observed official flat collection receipt became unknown despite matching facility reduction`. 위치는 `iris/desktop-life-collection.fixture.cs`의 live-flat-collection 사례다. 재시도·sleep·기대값 완화·제품 수정은 하지 않았다. 수령 회귀 전체 통과로 보고하지 않는다. 부모 작업자의 전체 Node 최종 결과와 함께 판단해야 한다.
- 과거 최초 수령 간헐 실패와 이번 실패가 같은 원인인지는 미확정이다. 현재 fixture SHA256은 `A178FD7C9FB2B105A601E11041AF67B7A093E7EC4A3D171C551C6ED94FD6A107`, executor는 `78658AF33BED9546B980D84AD32B586306457CA9A74DB08A66E21B800494DFB6`, journal은 `1FA3673F3B9CD160C8A7B989A0635DED3403CF3F91F1AC59B6295A0F1D1DA54C`다. 원문은 ignored `ergon-desktop-life-collection.tests.ps1.log`에 보존한다.
- C native14/API2·N044와 전체 Node는 부모 작업자의 별도 검증 담당이므로 이 독립 보고서에서 중복 PASS를 주장하지 않는다.

## 환경 실패와 시험 조정

- 첫 D-0 브라우저는 assertion 전 localhost 접근 `ERR_NETWORK_ACCESS_DENIED`로 종료했다. 같은 합성 시험을 루프백 접근이 허용된 실행에서 PASS 확인했다.
- release-lock은 집 전용 runtime 경로 때문에 MODULE_NOT_FOUND였다. ignored 시험 사본에서 runtime 경로만 사무실 경로로 바꾸고 PASS 확인했다. 제품·원본 시험 파일은 수정하지 않았다.
- 짧은 외부 source-only 사본 준비는 첫 sandbox AccessDenied 후 PowerShell이 계속 진행해 원래 cwd에서 native 시험이 잘못 시작됐다. 소유 세션을 중단했다. 허용 실행의 외부 고유 사본도 임시 DPAPI 경로 DirectoryNotFoundException으로 유효 결과를 얻지 못했고 부모 지시에 따라 사용을 중단했다. 두 실행은 PASS 근거가 아니며 실패 로그를 보존했다. 이후 위 native 결과는 원래 n04 경로에서 별도로 얻었다.
- 로그·브라우저 시험 사본·스크린샷은 ignored `.superpowers/astra-20261028/ergon-*` 범위에 보존했다. 브라우저3011은 종료·해제했다.

## 기존 사무실 진단과 수신 N04의 겹침

옛 진단 worktree와 현 N04 runner 포함14파일을 줄끝 정규화 후 비교했다. 9동일, 4상이, diagnostics fixture1개는 옛 사본에 없다. 상이한 파일은 journal/executor/interruption fixture/runner다.

- 현 journal은 game lease 파일 열기의 Win32 공유/잠금 충돌32/33만 `LifeExecutionLeaseBusyException`으로 구분하고 executor는 이 타입만 복구 유예한다. 다른 I/O 오류를 숨기지 않는 수정은 이미 수신돼 있다.
- 현 response-loss fixture에는 `pendingProducer`와 forced-GC 검증이 있다. 옛 사무실 probe-diagnostic/field-mismatch 기록과 현 N04Diagnostics 이벤트는 진단 방식 차이다. 옛 진단 코드를 재이식하거나 제품을 재구현하지 않았다.
- 과거 `recovery changed fields other than inflight state`의 정확한 발생 단계는 여전히 미확정이다. 새 합성 PASS로 소급 해결하지 않는다.

## D-1에 남은 실제 증거

공식 안정 workId, 시설 총정원, 실제 수령량의 목표 귀속, 실비용, 게임 캐릭터 귀속은 기존 인계대로 미지원/미확인이다. D-0는 저장된 B/C 읽기 표시이며 화면 접근이 실제 게임 조회 승인이나 자동 생산 완성을 뜻하지 않는다. 후속은 대상 기존 목재100 목표와 조회 횟수·승인 범위를 정한 뒤 별도 승인된 소량 관측 계획이어야 한다.

이번 실제 CLI/게임/사용자 원장/DB/서비스 호출·앱 종료·공개 잠금 변경·commit/push는 없다. 합성 자식/임시 DPAPI와 source-only 사본만 사용했다.

## 후속: 경로 길이 분리 검증과 보존 지문

**최종 환경 분리 결과:** 더 짧은 고유 source-only 사본에서 동일 C native14가 **14 PASS/0 FAIL/exit0**, 약95초다. 추가100 DPAPI·새 프로세스·pending/unknown·중복·원장/문맥·rollback/원자 실패를 포함한다. 실행 전 최장 경로를 tmp230/intent233/pending238/verified239/head235자로 계산해 모두240자 미만임을 확인한 뒤 한 번 실행했다. 앞선 표준 TEMP의 경로 실패를 삭제하거나 제품 논리 실패로 합산하지 않는다. 별도 collection assertion 실패는 이 결과로 해결됐다고 보지 않는다.

이 최종 snapshot은 공개 자산을 포함한1008파일 SHA256 확인, node_modules junction만 재사용했다. active n04와 IRIS 관련460 source/test SHA256이 모두 같다. ASTRA 최종 변경의 동기화는 부모 작업자가 별도 수행한 뒤 전체 Node/build에 이 경로를 재사용할 수 있다. C14 결과는 ignored `ergon-ultrashort-c14.log`, 경로/길이/source 지문은 `ergon-ultrashort-*`에 보존한다. N044/API2는 아래 표준 TEMP의 같은 소스 시험에서6 PASS이며 무의미하게 반복하지 않았다.

부모 작업자의 n04 대상 시험은 목재 hash/임시 suffix의 긴 경로로 실패했다. 같은 제품/시험을 소스 전용 사본으로 옮겨 경로변수만 바꿔 확인했다. 표준 Windows TEMP의 `a6fb693e8` 사본은 C14/N044/API2 총20건 중7 PASS/13 FAIL이며, C 실패의 최초 `.dpapi.<32>.tmp` 경로가 정확히261자였다. N044/API2는 PASS다.

basename을5자 줄인 TEMP `a8a8`에서는 첫 임시 파일을 지나 더 긴 `.dpapi.head.<32>.tmp` 경로261자에서 C14 중13건이 실패했다(1 PASS). `.verified.<32>.bak`는 이보다4자가 더 길다. 그러므로 basename만 소폭 줄이는 것으로 충분하다고 가정할 수 없으며, 이 결과를 C 제품 논리 PASS/FAIL로 확정하지 않는다. 반복 횟수로 PASS를 얻으려는 재시도가 아니라 파일명별 길이 경계를 기록한 환경 분리 검증이다. 모든 source-only 사본은 보존한다.

복사 대상은 소스/문서/config/공개 자산과 현재 ASTRA 신규 소스이며 `.env`, Git, private 자료, 로그, runtime DPAPI는 제외했다. node_modules만 원본 의존성 junction을 사용한다. 한 사본은 최초 Git Unicode quoting으로 빠진 자산66개를 채운 뒤 SHA256을 대조했다. 그 뒤 ASTRA browser 소스 변경을 탐지한 복사는 시험 시작 전 중단하고 새 manifest를 만들었다. ERGON 소스는 변경하지 않았다.

기존 진단의 `preserved-before.json`과 현재 파일 내용을 비교한 결과 원본16/옛 B17/옛 수신 ACK1 모두 SHA256 및 ABSENT 상태가 일치한다. 별도 N04 진단9항목도 이번 후속의 시작/끝 SHA256이9개 모두 일치한다. 이9개는 과거 기준 manifest에 포함되지 않으므로 그 이전 상태와 같다고 확대하지 않는다. 현재 manifest·대조 결과는 ignored `ergon-preserved-current.json`, `ergon-diagnostic-current.json`, `ergon-diagnostic-after.json`에 보존한다.
