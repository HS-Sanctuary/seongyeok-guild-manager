# IRIS 플로팅 공통 확인창·이동·설정 수정 — 2026-10-18 로컬 후보

## 22:55 KST 실제 원인 후속 — 움직임 확인/창 접힘 수정 후보

- 적용 22:57:01 KST: 정상 종료·기존 프로세스 부재/page200 후 Development3964 단일 시작. 정상 권한 읽기 metadata에서 Responding=true, 출력/오류 로그0, live capable=true 확인. 실제 모듈 유지+WASD 동시 확인은 한설에게 요청/아직 대기. 강제 종료·중복 실행·게임 입력0.

- 실제 Development28704의 capable=false 기록이 native `FloatingState()`의 `gameFocus` 누락을 드러냈다. 합성 frontend에만 true를 넣었던 검증의 빈틈이며 앞선 네이티브 연결 완료 추정은 철회한다. 실제 DTO 확인을 RED→GREEN으로 추가, `gameFocus=true` 발행 후 한설 정상 종료→22:44:25 KST Development29996 단일 시작/응답true·stdout/stderr0·page200. 실제 trace request/reply returned=true·documentFocus=false, 한설 움직임 복귀 확인.
- 이후 메뉴에서 기능창이 순간 열렸다 사라짐. frontend close trace 없이 성공한 handoff 직후 kronos/synaxis/ergon/settings→none. native Deactivate 지연callback이 이후 foreground 관측에만 의존해 의도적 게임 복귀를 외부 이동으로 접는다. 실제 소유 Form에서 handoff 후 대상 관측을 일시 상실시키면 settings가 접히는 RED 확인. 성공 handoff 구분·Activated 초기화/interaction 세대 검사로 GREEN. 실패한 중복 handoff가 앞선 성공 표시를 지워 다시 접는 두 번째 RED도 확인·이전 성공 보존으로 GREEN. 새 command 뒤 오래된 blur 무시·fresh 외부앱 접기 유지.
- 검증: nativechrome92/addon83/bridge/presentation, 전체 Node exit0, 독립 tsc/수정 eslint, 실제 hook trusted-pointer·modal/text/keyboard 예외 및 Hub+Center stale응답/모듈state유지, private native compile PASS. browser localhost sandbox거부는 동일 테스트 정상권한 PASS로 별도 구분. 실제 게임/키 합성·CLI·원장/DB 변경0, 추가 독립리뷰 성공 판정 없음.
- 임시 dev trace는 정확한 enum/boolean만 같은 localhost Origin의 development route에서 ignored64KiB 고정경로로 저장. key/text/nickname/account/HWND0·production404. 진단 자체는 game action이나 focus request를 발생시키지 않는다. 새 native 재실행 후 **모듈 유지와 WASD 동시 실사용 확인 대기**. 에르곤 준비중 잠금은 권장만 했고 아직 미구현, 배포·push·공개ZIP 변경 없음.

## WASD 후속 — 실제 게임 성공 미확인 유지

사용자가 열린 크로노스 floating 창에서 계속 움직이지 않는 사진을 보냈다. 앞선 네이티브 소유 fixture 성공을 실게임 성공으로 보지 않는다. 포인터 특정 control 뒤에만 요청하던 hook에서 초기/후속 module-open, 빈 읽기 영역, wheel 이후 요청 누락을 추가했다. 휠 직후 W 입력을 모든 키=UI keyboard mode로 분류해 handoff가 취소되는 RED를 별도로 확인하고 탐색 키만 그 모드로 분류했다.

- 실제 hook 합성: 초기 창 열기, pointer checkbox/button/빈 영역, wheel+W, 후속 native 모듈 응답에서 반환 요청. 입력/모달/키보드 Space·모듈 탐색은 유지. 스크롤 휠은80ms 안정화, pointer-held/선택 텍스트 보호. 모든 타이머·리스너 teardown. window focus를 관찰해 타 앱 선택을 되돌리지 않는다.
- 네이티브/키 입력 경로는 그대로다. IRIS28704·게임29460/Framework StartTime 메타데이터 조회 가능만 읽기 확인했다. 실제 WASD나 게임 버튼 입력은 하지 않았다. 화면 코드 HMR로 추가 종료·재실행 요청 없음. 실제 첫 키/휠/스크롤바 드래그의 게임 동작은 사용자 검증 전이다.

## 21:51 KST 이후 추가 — 설정·초점·모달 높이·헤더

- 새 회귀: `iris-settings-pending.browser.mjs`는 실제 settings+hook+Hub로 지연 저장 중 다른 체크/슬라이더 조작, 실행 시점 최신 preferences 병합, 단축키 적용 중 해당 버튼만 잠금, 변경 caption, 상단 tools 부재·로고 border0·사이드 바 명칭을 검증한다. 첫 실행은 전체 fieldset 잠금으로 RED, 수정 후 PASS. 기존 categories/range/font와 floating controls/default restore 시험도 PASS.
- `iris-floating-focus.browser.mjs`: trusted checkbox/button 후 handoff 요청, 텍스트/WASD 입력·모달 열기/닫기·키보드 Space 탐색에는 요청0. native chrome fixture는 실제 소유 Form 두 개만 사용해 IRIS→tracked fixture 초점, 게임 복귀 후 settings 유지, 메뉴 단축키가 게임 초점 보존, 다른 앱·대상 변경·보호 종료 거절을 검증한다. 외부 게임 조작 없음. 고정 target/null payload의 bridge source/epoch 검증 및 bool 응답 계약 unit PASS. 참고: [Windows SetForegroundWindow의 foreground/keyboard 정책](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow).
- 실제 dialogs browser는 짧은 실제 picker 자연 높이<400, backdrop 투명, nested/Escape/focus/18·20·22px/저장0을 추가 검증했다. native는 280 DIP 측정 반영/이전 빈 하단 hit region 제거/invalid measurement 무시/module 높이 복원. getter는 clipped scroll bodies를 포함하고 기존 native timer에서 source/revision/modal 재확인 후80..680으로 제한한다. 음영만 지우고 큰 클릭 차단 면적을 남기지 않는다. 초기 측정 전 최대500ms의 전환 시간은 가능하며 실제 긴 목록/다중 DPI는 실사용 확인 대상.
- 사용자 후속 헤더 사진은 `iris-floating-header.browser.mjs`로 실제 Center에서 RED(2.25rem offset 때문에 main tabs 겹침)→floating scoped top0 GREEN. 18/20/22px geometry와 ignored `floating-header-clean.png`/`settings-clean.png` 직접 시각 확인. normal 헤더/제목줄은 바꾸지 않았다.
- 최신 전체 Node581 / PASS578 / 기존skip3 / fail0. Nativechrome88, addon83, bridge/presentation PASS. TypeScript 독립 검사·수정 파일 eslint 및 private settings-focus build PASS. 후속 React 입력/접근성 체크 적용. 앞선 reviewer 사용량 제한 이후 새 독립 리뷰를 우회 요청하지 않았으며 이번 후속은 자체 점검이다.
- 한설의 정상 종료 답변 뒤 실행 여부 확인, 21:51:15 KST Development28704 단일 실행·Responding=true·출력/오류 로그0·개발 페이지200 확인. 헤더 후속은 CSS HMR이며 다시 종료 요청하지 않는다. 실제 게임 WASD 최초 입력·설정 재실행·긴 목록 적합성은 한설 확인 전, 게임 CLI/키 합성/DB/원장/공개배포·push0. 가죽+100개 자동 반복은 여전히 미완료다.

## 범위와 결과

한설의 스탯 업데이트 확인창/직접 캐릭터 선택 시 일반 창 전환, 넓은 작업화면 먹통, 좌측 세로선으로 돌아가는 드래그, 추천 여백/글자/버튼, 설정 혼잡/불투명도 분리와 게임 클릭 시 로고 가려짐을 처리했다. 수량 가공 전체 자동화나 번호 단축키는 이번 수정에 포함하지 않는다. 기존 미커밋/개인 dirty 및 원본 보호기록을 보존했다. 공개 버전·ZIP·운영 DB·권한·공지·push 변경 없음.

계획: `docs/superpowers/plans/2026-10-18-iris-floating-dialogs.md`; 실행 기록/로그/합성 스크린샷은 같은 이름의 ignored `.superpowers/sdd/`에 있다.

## 원인과 변경

- `useDesktopFloating`의 모든 role=dialog → normal 전환을 제거했다. 새 `useDesktopFloatingDialogs`가 공유 확인창과 기존 파티 fixed portal을 native panel 좌표 안에 배치한다. 내부 명령 dialog-open/dialog-close와 optional dialogOpen 상태를 추가했다. 일반 창 좌표·모듈 선택과 모달 입력 영역을 분리하며, 종료 결정은 DOM 동기화로 해제하지 않는다. 구 native는 계속 파싱하고, 모듈 panel이 있으면 유지한다. 구 native의 아이콘 단독 확인창만 기존 복구 전환을 사용하므로 새 native 재실행이 필요하다.
- Hub는 대화상자 내부/배경 취소를 외부 클릭으로 다시 처리하지 않는다. Esc도 현재 확인창만 닫는다. 스탯 확인·재화 강조·종료를 공통 FocusDialog로 묶고, 중첩/교체 종료 순서와 관계없이 background inert와 body scroll lock을 마지막 확인창까지 유지한다. SSR 경고/종료 선택 내용은 보존한다. 파티 업무 로직/DB 호출을 바꾸지 않았다.
- native SetWorkspace의 옛 compact 차단을 floating에는 적용하지 않는다. 기존 API 그대로 floating panel을 420↔980 DIP로 확대/복원하고 게임 경계에 제한한다. normal 복귀 좌표는 별도로 보존한다.
- WM_MOVING에서 새 물리 anchor와 local layout을 즉시 반영한다. resize/상태 갱신이 드래그 이전 좌표로 되돌리는 재현을 막았다. 좌우 고정/자동 도킹을 새로 넣지 않았다.
- 알림 내용 ResizeObserver → bounded optional height(80..360 DIP) → native geometry/둥근 region. 고정 180px 아래 빈 영역과 검은 사각 모서리를 줄였다. 초기 추천은 왼쪽 “아니요, 직접 선택”, 오른쪽 “네, 선택”; 닉네임 .9rem, 긴 이름 옆 접기 버튼 줄바꿈 방어. 변경 추천의 기존 선택 의미/재확인/소리는 보존했다.
- 설정을 플로팅/작업창/테마·글꼴/계정·저장으로 분리한다. hidden 영역도 상태를 보존한다. 기존 일반 창 불투명도와 native floating preference는 별도로 저장하고, floating 불투명도는 로고뿐 아니라 메뉴·말풍선·임시 작업창에도 적용한다. 바뀐 단축키는 native 확정 응답의 label을 키캡에 그대로 반영한다.
- 게임 클릭 시 로고 가려짐은 실제 읽기 관측에서 game foreground/IRIS visible/양쪽 minimized=false인데 IRIS topmost=false였다. 원인은 자동숨김 작업표시줄이 보이기만 하면 실제 겹침 없이도 양보하는 판정. 관측 rect(로고193,1290,57×58 / bar0,1392,2560×48)를 합성 시험에 고정해 RED를 확인했다. 겹칠 때만 양보하도록 변경, 같은 read-only 판정 true→false. 다른 앱/작업표시줄의 실제 겹침 우선권은 유지한다. 기존 우측 가장자리 hover 시험은 창도 우측에 놓도록 범위에 맞게 조정했다.

## 검증

- 전체 Node 579개: 576 PASS / 기존 skip3 / 실패0. 독립 `tsc --noEmit --incremental false`와 수정 TS/TSX eslint PASS.
- 새 실 React: 실제 스탯 버튼, 신·구 host, 대화상자 안/배경/Esc, 원래 모듈·초점 복원, 중첩 계정, busy 종료 보호, 아이콘 단독 실제 캐릭터 목록, 18/20/22 글자 크기 PASS. 실제 API 저장/선택/종료 0.
- 실제 StatsSession 초기 추천: 긴 닉네임, 왼쪽 직접 선택, 자동 높이 수렴, 접기 한 줄, 공백 없는 shell PASS. 설정 분류/분리된 slider/설치 글꼴/초안·실패 복원 PASS. 합성 PNG 직접 시각 확인.
- 기존 회귀: 변경 추천, normal 중앙 확인창↔floating bubble, 편집 state 보존/늦은 응답, fifth exit/windowed preference, 변경 단축키 label, 계정 초점24레이아웃, 숨김 알림 deadline/메뉴 충돌 PASS. 계정 브라우저 첫 호출은 런타임 인자 누락으로 실행 오류 후 올바른 인자로 PASS했다.
- native chrome73, addon83, floating 정책·DPI·설정, bridge 정확 필드/번호·bounded height·거절 부작용0, presentation/시작실패 종료보호/기존 workspace PASS. 비공개 native 패키지 컴파일 exit0, PrepareDownload 미사용.
- 앞선 addon Yield foreground 시험은 이번 두 최종 실행에서는 PASS이나, 이전 HEAD에서도 간헐 실패한 경과를 해결했다고 주장하지 않는다. 첫 floating 정책 실행의 임시 파일 이동 제한은 동일 합성 시험을 승인된 일반 권한으로 재실행해 PASS했다.
- 독립 최종 리뷰를 요청했지만 reviewer가 사용량 제한으로 중단되어 최종 판정 없음. 자체 교차점검과 테스트가 이를 대체한 독립 리뷰라는 뜻은 아니다. 출시 전 좁은 재검토 권장.

## 적용 및 남은 일

- 한설 정상 종료 확인 뒤 개발4660을 정상 시작했고, 후속 게임클릭 가려짐 수정 후 다시 정상 종료 확인을 받아 2026-10-18 21:24 KST Development17184를 한 번 정상 시작했다. Responding=true, stdout/stderr 각0바이트, localhost3000/iris/desktop 200. 강제 종료·게임 입력·소비 명령0.
- 실제 게임 클릭 후 로고 유지, 자유 드래그, 직접 선택 확인창의 floating 유지가 사용자 확인 대상이다. 합성 검증으로 실사용/다중 DPI/전용 전체화면/장시간 검증을 대신하지 않는다.
- **P1 미완료: 가죽+ 100개 목표가 1회 등록 후 종료.** 사용자가 직접 시험한 보고이며 정확 산출·비용·실제 기록은 아직 대조하지 않았다. 소스에서 목표수량은 계획에만 있고 prepare의 altering payload에는 quantity가 없으며 native execute_altering도 displayName만 전송함을 확인했다. 수량 목표와 실제 반복 등록은 아직 연결되지 않았다. 임의 quantity 인자·반복 호출·원장 수정·재실행 없음. 정원/등록→대기→수령/총비용/중단·unknown 보호를 갖춘 별도 bounded 가공 목표 구현이 필요하다.
- Alt+~ 동시 1..5는 가능성 조사만 요청받았다. 현재 RegisterHotKey는 modifier+단일 일반 키이며 추가 다중키 처리가 필요하다. 메뉴 호출 후 숫자 선택 방식이 후보. 게임 가방 직접 열기는 현 CLI schema 미확인이라 지원 확정하지 않는다. CLI status의 disconnected/game_off와 실제 game process 발견이 불일치해 연결 상태 추가 확인이 필요하며 게임을 재시작하거나 행동을 보내지 않았다.
- 한설은 오늘 에르곤 제외/플로팅 중심 업데이트 가능성을 문의했다. 권장 범위는 플로팅·설정·알림, 생산판 에르곤은 비노출/비활성 개발 경계로 분리하는 별도 출시 준비다. 아직 방향 확정·공식 push/배포 승인 아님. 공유 창/bridge를 쓰므로 파일 몇 개 제외만으로 분리됐다고 보지 않는다.
