# IRIS compact·추천·사용성 점검 — 2026-10-18 로컬 후보

## 사용자 요구와 경계

한설: G버튼에가까운작은로고/작은Alt+~글자·여백, 좌우끝은로고기준/키캡만안쪽이동, 플로팅추천버튼무스크롤, 일반창의기존중앙모달복원. 추가로눈에띄는IRIS불편은직접판단해개선, hover확장은명시적으로넣지않기로했다. 현재폴더/추가승인없는구현지시유지. 게임소비/원장·DB/권한/공개ZIP/배포/push/강제종료권한확대는아니다.

계획: `docs/superpowers/plans/2026-10-18-iris-usability-polish.md`. 진행ledger와시험로그는같은이름의ignored `.superpowers/sdd/` workspace. 읽기전용점검2명+root구현+fresh최종검토1명으로분리했다. 이전미커밋후보·개인dirty는보존했다.

## 구현 결과

1. 로고기본52→36DIP. 기본키캡79×28→57×20DIP, 간격4→2DIP, font `.98rem`→`.72rem`(12px최소). 설정의36..80범위와실제단축키는그대로다. 네이티브는로고의좌우범위를먼저clamp하고키캡을독립clamp하여끝에서만안쪽으로밀린다. 가운데에서는중앙정렬유지.
2. 설정파일같은경로·내부version3쓰기/v1·v2·v3읽기. 구버전52만36으로한번이전(구기록에서직접고른52와기본52는구분할metadata없음), 다른사용자지정크기/위치/키/투명도/창모드보존. v3에서다시52를선택하면유지. 손상원본보존기존정책유지. 역방향구native파일호환은보장하지않는다.
3. normal추천은원래중앙 `DesktopFocusDialog`/배경inert·가림으로복구. floating은작은말풍선. 직전statusinline수정은요구오해였음을한설에게설명했고이번복구로대체한다. 모드전환에추천중복/자동선택없음. 실제CharacterWatch의cue효과·선택전재조회/문맥검증은유지, 실제소리청취시험은별도.
4. CharacterNotice의optionalcompactContent/dismissDisabled로floating만이름·직업한줄+짧은질문+기존선택버튼을표시. 긴중복설명제거, 확인중접기/닫기보호. normal에는기존자세한내용. 최초접속추천의2버튼/변경추천의3버튼선택의미는보존.
5. 읽기점검에서확인한추가불편: 메뉴·임시기능창에알림이겹쳐버튼/헤더를덮던배치와panel fallback제거. 새미표시알림은표시공간이생길때부터10초, 이미표시한알림은기존deadline유지(메뉴조작중만료가능). 캐릭터추천은자동만료없음.
6. CSS원형메뉴의native사각hit영역을ellipse로바꿔투명모서리입력가로챔과검은사각배경줄임. 잘리던아래쪽customlabel제거, native title/aria-label유지. 호버확장추가없음.
7. 크기·선명도slider는localdraft로연속조절하고pointerrelease/blur에최종값한번전송. 저장응답동안중복방어/실패시확정값복원. keyboard는Tab으로벗어날때적용. 다른설정수정의bridge검증/보호유지.
8. 설치글꼴목록과중복된수동입력은접기영역으로보존, 설치글꼴선택만으로추가입력폼이튀어나오지않음. 긴사용안내도접고“게임조작/수령없음”오류문구를현재에르곤의명시실행안내로수정.

## 검증

- nativepolicy RED: leftedge가키캡중앙기준/old52미이전/메뉴+알림동시geometry. GREEN: logo8/right1272·키캡안쪽이동/36·57×20·gap2/이전설정보존/v3직접52유지/5ellipse중앙포함·모서리제외/알림겹침없음. DPI모서리·손상원본·단축키기존회귀PASS.
- 실React RED: 작은키캡기준옛큰폰트, normaldialog부재,180px추천scroll, slider중간calls1vs0, 설치글꼴선택시중복form, 알림의moduleheader덮음. 각최소수정후GREEN.
- 실React PASS: 키캡18/20/22폰트와36circle, normal중앙modal/inert↔floatingbubble, 실제CharacterWatch선택버튼3개180px내무스크롤18/20/22, 늦은Yes수동의도보호, 캐릭터60초유지/접기/복원,10초progress/최초표시대기/native문서숨김deadline유지, 메뉴5조작·moduleheader보호, range최종1회/실패복원/글꼴접기·입력보존, 기존설정/모듈편집유지/늦은open응답회귀. 스크린샷직접확인.
- Node최종578total/575PASS/3기존skip/0fail, 독립tsc/변경TS·TSX eslintPASS, nativechrome56PASS/비공개nativecompileexit0. 공개download복사없음.
- **기존addon시험실패보존:** `desktop-addon.tests.ps1`의 `Yield changes only own z-order, never geometry or input focus`가반복실패. 정상권한도동일. 메모리내진단에서before/afterBounds동일(X/Y-30000,136×100),foregroundhandle만변함. `git show HEAD:iris/desktop-addon.cs`를파일수정없이같은fixture에넣어도동일실패. 이번plan의제품변경으로발생했다고확인되지않았으며포커스변화의실제원인은미확정. 무시/skip/통과처리하지않았다. 최초진단을pwsh에서돌린CodeDom미지원실패는원래WindowsPowerShell에서재실행해구분했다.
- 최종fresh독립검토C0/I0/M1: 긴 `Ctrl + Alt + Shift + F12`의176px키캡과메뉴겹침. 사용자자율polish승인범위에서이minor도수정: menuopen동안badgeDOM/실nativeRegion을잠깐숨기고닫으면복원. 실제DOM count1→0/숨김badge영역inside→outside RED→GREEN, policy/관련browser/chrome56/privatecompile재확인. DTO의badgeRect는양의유효값유지/화면전체좌표와기존파서호환. 재검토없음.
- 실제게임/다중모니터·mixedDPI/실제소리·새native실화면·장시간은합성시험으로대체하지않는다. 기존Synaxislint/legacy구locator등별개기존문제도전부해결주장안함.

## 적용/인계

2026-10-18 16:40 KST 적용후속: 한설‘닫았어’확인→기존IRIS부재/개발page200→최신Development29208한번정상시작. Respondingtrue·stdout0/stderr0확인. 이번compact/edge/menuRegion/설정이전코드까지실행후보에포함하며실화면·게임위조작·소리확인은사용자대기. 아래재시작대기는당시경과로보존, 강제종료/추가게임행동/DB/push0.

검토후마감: Node전체578/575PASS3skip0fail, 독립tsc/변경lint/diffcheckPASS, native정책·chrome56·비공개compilePASS. addon실패/HEAD비교미해결은위기록그대로이며전체native정상판정아님. 사용자정상종료질문발송·답변대기. 소스확정후임의재시작하지않았다.

현재Development28168은15:39재시작시점native다. 브라우저HMR과별개로새compact경계/원형native영역/설정이전은정상종료후재실행필요. 아직강제종료/재실행하지않았다. 한설의종료확인뒤한번열고응답·로그만확인한다. 이번점검은현재IRIS의플로팅·알림·설정·센터/에르곤읽기점검이며모든기능의실사용전수검증완료가아니다.
