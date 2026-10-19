# 순월 → 영겁 수신함

## SW-20261019-001 — WAITING (GNOSIS 패션 저장·공유 / 별도 브랜치 인계)

- 발신 순월 / 수신 영겁 / 최초·최종 2026-10-19 17:05 KST. 관련 branch codex/gnosis-dressroom, 기준 origin/main1d8e374. 한설이 구현과 기능 브랜치 push 및 집 통합·재push를 명시 요청했다. 정확 전송 SHA/원격 결과는 후속 마감에 기록한다. 운영 v2.31/IRIS0.3.0 유지, main 병합·운영 DB·수동 배포·공지·ZIP 변경0.
- **먼저 docs/GNOSIS_HOME_MERGE_20261019.md와 docs/DRESSROOM_HANDOFF.md를 읽을 것.** 집의 주말 코드와 개인 파일을 보존하고 패션 브랜치를 집 기능 작업에 병합한다. 양쪽 HANDOFF/RELEASE_NOTES/MasterGuide/결정/피드백/릴레이는 모두 보존. 패션 브랜치로 집 작업 전체를 교체하지 말 것.
- 이번 제품: GNOSIS 메인 컴팩트화·분류 SVG/전투 하위분류/클래스 계열 드롭다운·관리자 분류 로컬 미리보기, 케리그마 공용 toolbar 기반 rich editor/안전한 링크 dialog/표/투표/이미지 압축·댓글/대댓글, 패션 스크린샷·팔레트 개인 저장10개 및 공유 PNG 클립보드/패션 글쓰기. 일반 writer 수동 코디 입력 제거, 기존 게시물·임시저장 item_data 보존.
- **실제3D 의상 착용·메시교체/염색렌더러·클라우드 개인 저장·서버 다중사용자 게시·운영 분류 설정 저장은 미완료.** 개인 저장/테스트 게시물은 localStorage이며 Git으로 집에 전달되지 않는다. 현재공유는 사진+색상표이며 사진 속 의상색을 바꾸는 기능이 아니다. 자산없음/레퍼런스403 우회0, 3D 설계 문서 검토·자산/권리/rig 확인부터 이어갈 것.
- 검증: Node477/474PASS3기존skip0fail, 독립tsc/Next60페이지/GNOSISlint exit0. 관리자 기존lint4오류는HEAD와동일. 실제 IAB PNG clipboard, 15KB 압축, 개인 저장, 패션 왕복 제목·본문 유지, 로컬 글 상세 사진·색상 확인, 320/390/768/1280 넘침0. 독립review 중요2(업로드 중 새편집 유실/뒤로가기 미저장 유실) 발견 후 보완·최종 회귀 결과는 후속 기록.
- 원격4234e54의 YG-20261016-001 및 IRIS_FLOATING_SOONWOL_HANDOFF_20261017.md를 읽고 TO_SOONWOL에 ACK했다. IRIS 미해결 I2/M1을 읽었으나 제품병합/수정/앱실행/게임행동은0. 내일 받을 통합 branch/SHA와검증·남음을 TO_SOONWOL에 남길 것.
- 원격에서 확인한 이전 SW-20261016-001 ACK: 영겁 2026-10-16 21:44 KST, HEAD07b3f4f 및 주말 인계 수신을 확인했음. 이 브랜치의 아래 오래된 SW-20261012 미확인 경과는 삭제하지 않았다. 자동 안전검토가 릴레이 전체 교체를 거절해 기존 로컬 기록을 보존하고 이번 수신 인지·신규 작업만 누적한다.
- ACK: 영겁 대기. 기존 미확인/과거 누적은 아래 모두 보존한다.


## SW-20261012-001 — UPDATED (공식 배포·게시 확인)

- 21:23 복구 후속: 인계문서9cfcfb2 첫배포 dpl_AbKL... git_info_fail ERROR→운영0.3.0유지확인→같은프로젝트/커밋·설정으로정상재배포 dpl_6W4wLEF8k1CBbwjBXEku8Zv2ChUg READY/Production/정확SHA9cfcfb222ee7734d7d8aae0d75e0b3a1bac2b004/공식aliasErrornull 확인. 상세로그403/CLI없음 미확인·우회0. 제품코드d70b0e5/ZIP/게시2건 유지·이번기록구조변경없음/복구뒤공지재게시0.

- 마감 예약iris-sanctum PAUSED 저장확인/다시실행금지. IRIS분류는 정확한 ‘IRIS Beta x.y.z 출시!’ 계약이므로18번 제목만 ‘IRIS Beta 0.3.0 출시!’로 기존 정상수정UI에서맞춤/본문4중제목보존·새글0. 이전‘IRIS 제목분류’ 단정은 최종이확인으로보완한다.
- 최종 운영 `/kerygma?note=iris` 재로드가최신글18/0.3.0을자동표시함을확인했다. 이전16번과새18번을중복게시로혼동하지말것. 인계일반push뒤제품코드재변경/새ZIP/새공지0.

- 21:11 KST 마감: 제품 d70b0e52f446747ceb1e385a63375baee7c087a3 main/인계 브랜치 일반push/원격일치, Production dpl_GwtYnzwu2YndBELvBR9TgB98Eitk READY·동일SHA·운영Chrome메인/3패널/크로노스/다운로드/8GET200 확인. v2.31/IRIS0.3.0·공개ZIP527716 SHA2dfda82795e997415173b87c2359d3550465d8a1564cf049c51b3bdf7306bcdd 일치. SANCTUM시스템 생텀글17 / IRIS글18 각1회 정상UI·중제목3/4·상세눈확인, 다시게시금지. 공지외 운영시험쓰기/DBschema/RLS/게임행동/보안우회0. 마감문서후속은구조변경없음/버전유지.
- 영겁첫과제: dirty보존→main `git pull --ff-only origin main`→이최신릴레이/HANDOFF ACK→IRIS켜고 실제게임최대화 작은바/메뉴위치유지/일반창좌우도킹/최소화복원/다른앱·바탕화면/벨·폰트·투명도·다른DPI 사용자확인. 합성검증으로실게임확정하지말것. 사무실Development소스새실행PID23852응답/stderr0·forcekill0, 집설치본대신교체0. 구HTTPS실패앱ZIP전체1회/미서명보안차단우회금지. 코드·관련시험완료(455/452PASS/3skip·tsc·격리build58·realReact/native/liveupdate), 이전남음문구는당시경과. 개인3영역/미ACK누적보존, 예약단일마감후종료예정.

- 최종 후보 tree 검증455중452PASS/3skip·tsc·격리webpack58 exit0·diffcheck PASS, 20:53 KST 승인 변경만 commit/main 일반push 준비. 개인3영역 제외·보존; 운영상태는 후속 명시한다.

- 20:20 재개 후 최신: 메인 숙제카드15초 저장 구현/즉시 연속체크·flight중 새 입력/되돌림·캐릭터별 baseline·수동 재시도/실패 보존, 모든 홈 이동·계정 인증 지연 전체 잠금. 선택적 기간 metadata admission/read후/write전 재검·기존merge/CAS·DBschema/RLS변경0. 실제React 합성/관련24·tsc·격리webpack58 PASS, 동일 리뷰 후속 Important잔여0. native 실제old0.2.2→new0.3.0 offline EXE/helper/WebView 교체/보호해시PASS. 아래 미구현/남음은17시 당시경과다. 현재 commit/push/운영/게시미완료, final후속에SHA·Vercel결과·ZIP·게시ID명시 예정. Vercel403/UI로그인필요 우회0, GitHubVercel commit status읽기 가능. 개인dirty/미ACK이력보존.

- 최신 추가 요청: SANCTUM 메인 Kronos Check Board 카드도15초묶음저장으로 변경/이번공식push·생텀공지포함. screenshot/코드 app/page.tsx371 handleToggleTask: saving전역lock으로다음체크막고매클릭POST하는원인확인. **아직수정0**, 20:20 heartbeatiris-sanctum prompt에추가update성공/일정유지. 연속체크즉시표시·최종입력15초·여러캐릭터/계정격리·저장중추가입력/실패보존·수동저장/이탈경고·기존길드버스동기화/서버동시수정방어 유지, 상세크로노스helper/API재사용부터검토. 이전마감과제를대체하지않고함께처리한다.

- checkpoint시험최종정정: updaterprocess sandbox --prepare실패는escalated동일own임시시험success/crash/recover 모두PASS로해소, session22075실패종료/대기시험없음. 내부RELEASE_NOTES에v2.31/IRIS0.3.0준비후보/되돌리기fb607e0·dpl_DP47.../검증·제한·**운영push/게시미완료**를기록했다. live old0.2.2→new0.3.0trial/최신좁힌finalreview1회/commit/mainFFpush/Ready/운영/게시2건은20:20재개첫과제. 리뷰스킬·템플릿은읽었으나dispatch아직0. 개인파일/이전미ACK보존.

- 공식 마감 승인/예약: 한설이 이번 전체 구현·검증·정상 main push·운영 배포·최신 IRIS ZIP 및 SANCTUM/IRIS 업데이트 글 각각 게시를 승인했다. 예약 heartbeat `iris-sanctum`은 오늘 KST20:20 1회, 한설은 사무실 PC/Codex 켜두고 간다고 확인. 17시경 사용량96%(4%잔여)로 안전한 checkpoint 후 예약에서 미완료만 이어간다. push/Ready/게시완료로 보고하지 않는다. 게시용 초안2개는 docs/UPDATE_POST_SANCTUM_v2.31.md, docs/UPDATE_POST_IRIS_0.3.0.md; 중제목·따뜻한 문체·작성자 SANCTUM 시스템·기존IRIS 제목분류, Ready/운영확인 뒤각1회.
- 현재 최종후보: v2.31/IRIS0.3.0, 위치고정 compact panel600(아래남은높이제한)/독립expanded640·메뉴별자동높이금지, fullscreen 수동이동 후dockSide보존/일반창compact도좌우재연동. 투명도30~100 로컬기억/nativebridge검증, Appearance→테마 선택. Header패널은기존owner내absolute/버튼정렬/header전체아래/viewportclamp;resize/scroll/observer정리. nativeaddon82/grip22/bridge·실pageopacity30reload/글꼴/접기/5폭웹패널 PASS, Node443/440PASS/3기존skip, 독립tsc/격리webpack58 PASS. 대상lint0오류/날개기존imgwarning1. 공개ZIP527716 SHA2dfda82795e997415173b87c2359d3550465d8a1564cf049c51b3bdf7306bcdd 준비. release-package absolute인수 재실행allowlist/hash/unsigned PASS, updater정책은sandboxFile차단 후escalated PASS. update-process 시험session22075 결과확인필요, 실제0.2.2→0.3.0 offline 교체trial/마지막좁힌리뷰/native재실행/공식문서·commit/push/Ready/운영확인/게시2건 미완료. 사용자 정상종료 확인2회, 강제종료 금지.
- 원격fetch/pull 인계브랜치up-to-date, origin/main fb607e0는HEADd72f218 조상0/4. 승인diff만commit 후main정상FFpush 가능, 개인푸시풀명령어/public recruitment/옛plan 제외. 연결된Chrome production탭745886768 관측만, CUA getState 초기화済. 직접세션추출/DB게시우회금지. Vercel listteams []·CLI gh 없음, 배포 list_deployments 프로젝트sanctum/team slug sanctum-sanctuary 또는기존연결목록으로ReadOnly확인해야함. 운영DBschema/RLS/삭제/게임행동/보안변경0. 기존미ACK/dirty보존.

- 실제 피드백 후속: 게임 화면 아래 넘침에서 addon top만 위로 이동하던 docking을 visible vertical segment로 수정; 모든 모니터 밖 게임은 IRIS만 숨김/비활성 복원(직접 숨김/연동 끔/종료 확인/unknown frame 보존). 설정·클래스에서 □ 접기 및 자동 fullscreen 접기 회귀를 RED→GREEN 수정: compact 진입 설정 닫힘, expanded만100dvh, 닫힌패널 contentHeight 폐기/늦은측정 revision 방어. addon81/grip20/presentation/WebView/startupclose/실page 합성 manual·auto 접기/전체Node439PASS·3skip/types/대상lint/diff PASS. 정상종료 후 새 Development PID9872 실행, 시작/실게임 확인 후속. 이번 추가는 웹build/패키지 재생성0, DB/게임HWND제어/commit/push/배포/버전0. 이전 미ACK와 개인dirty 보존.

- 누적최신 — 한설실행계획직접진행승인. 설치font자동목록/검색/캐시·□compact/autoFullscreen/실제regionround·알림4종/기본ON개별음소거/자가벨·캐릭터카드연필/대표/추가/수동선택통일을구현. 기존ownerless legacy읽기전용보존/CAS/대표postread, 신규schema/RLS/운영시험쓰기0. 이전‘미구현/검토대기’는당시경과로유지.
- 마지막fresh reviewer1회만사용, 종료/늦은추천과편집modal중첩·legacy선택유실·storagegetterCrash를재현수정. 추천카탈로그stale를important로재분류해메타변경후1회갱신. 실제센터old pointerdown충돌/깨진제보응답/320px clipping까지RED→GREEN. fullNode442/439PASS/3기존skip,독립types/대상lint/diff,격리웹/nativebuild PASS; nativeaddon75/grip19/fonts/presentation/silentbell/bridge/WebView/startupclose,합성browser21폭pt×6테마·실pagefont/compact/늦은추천/카드0/1/6/100/종료취소/제보/토글/차단storage PASS. broad Synaxis기존lint부채는별도.
- 한설정상종료확인후Development PID27456 새실행/Responding true·stderr0/중복0. 실제게임fullscreen복귀/최소화/다른앱·desktop/round/소리 확인대기. 운영v2.3/Beta0.2.2/공개ZIP/commit/push/배포변경0. HANDOFF최신항목과4계획참조. 사소한보류2: 구native접기오류문구표시, font방향키option스크롤·강조. 로컬미커밋증거scratch는보존하고개인dirty/기존미ACK누적삭제0.

- 추가승인요구: 설치글꼴자동목록·콘텐츠소리ON/OFF/짧은벨·실제둥근모서리. 스펙갱신과4세부실행계획/색인 `docs/superpowers/plans/2026-10-12-iris-update-bundle.md` 작성·자체검토. 직접순차Native권장·추가agent0·native재시작묶기. 설치목록최초1회/새로고침캐시,고정bridge/epoch·실제음소리시험0,대표clear/set비원자한계·모서리resize/모달높이등명시.
- 현재는실행계획사용자검토/방법선택대기,새4기능구현0·DB/버전/패키지/commit/push/배포0. 기존완료후보/미ACK/개인dirty를보존했다. “업데이트하자”를공식Gitpush/배포승인으로해석하지않음.

- 최신: 바탕화면click가림회귀→Progman/WorkerWyield제외 및 desktop게임layer유지. 실제WorkerWtopmost·일반Z순서예외 실측/native75 PASS. 6~22pt themedselect/기존18·20·22px호환·로컬폰트기본/3개/직접80자/다운로드0·큰글자재배치. 전체Node427/3skip·tsc/lint/diff·native75/grip13/bridge·실page12조합/font/reload PASS. 정상종료후PID25212시작stderr0/응답, 핵심desktopfix포함/invalidHWND보호1줄은후속재시작반영. 실제desktopclick확인대기, 버전/DB/배포없음.
- 신규3묶음 요청은 docs/superpowers/specs/2026-10-12-iris-compact-alerts-character-design.md 설계후보: □축소/전체화면auto, 알림4종·기본ON/로컬토글/SVG모달/기존제보, 카드연필/대표/추가1카드/추천수동선택통일. 아직구현0·설계확인대기. CLIcapabilities실측구멍출현직접조회없음. 홈심층00/30은초기화·어비스기본주기는예상, 확정출현단정금지. 기존reports/member-mutations와is_main조사·DB쓰기0. 기존미ACK/개인dirty누적보존.

- 최신 사용자 확인: 한설이 이전 메뉴 “정상복구 확인완료”를 전달했다. 후속 □축소 버튼/최대화·전체화면 자동 축소/축소 메뉴의 임시 펼침 요청은 설계 제안 단계, 아직 구현/승인 설계 확정/배포 아님. 이전 외형 확인 대기 기록은 당시 경과로 보존.

- 추가 한설 방향 변경: 그룹 기능선택 드롭다운을 원하지 않아 기존7개 상시 버튼(숙제/클래스/스탯/재화 + 물물교환/상점구매/임무게시판 4+3줄) 복원, 상위크로노스/시낙시스 높이2.4→1.75rem. popup만 제거/hidden 본문·초안/계정잠금/재선택무조회 유지. 과거 드롭다운 승인/구현 기록은 보존하되 최신DECISIONS 우선.
- UI23·전체Node424/3skip·tsc/lint/diff·실React21폭글자×6테마/7선택/잠금/클래스초안 PASS, 캡처 눈확인. 첫 browser commit 전 단언은 DOM대기로 수정 후PASS. 공유 feature helper/기존navigation 선택자도 변경했지만 navigation 전체실행은 안 함. 개발HMR 반영/실사용외형대기, native 재시작/버전/DB/패키지/배포 없음. 기존 후보/개인dirty·미ACK 보존.

- 승인 추가: 실게임→Codex 클릭 시 IRIS 잔류. NOTOPMOST 일반창 최상단 계약/실제 합성창 RED 확인, sameLayer 활성 때 자신의 HWND만 다른 foreground 뒤로 배치. 이미 non-topmost 재상승/옵션해제/초점·게임 창 불변 포함native70 PASS. 게임 복귀raise 유지.
- 종료 이름/설명은 DB저장 대 PC보관, 미저장없음 단일 종료(기존 save 안전 경계), store/close 실패 복구 유지. 전체Node423/3skip·tsc/lint/diff·종료합성9·grip13/bridge PASS; sandbox Edge 시작실패 뒤 승인 시험PASS. 첫수정PID12444 정상시작 이후 한설 정상종료/최신PID680 시작stderr0·응답 확인. 실제 가림/복귀 사용자 확인 대기. 기존 미ACK/개인dirty·미커밋/미푸시·버전/운영 유지.

- IRIS 후속: 한설의 간헐 추천/최소화 및 수동폭/글자 개선 승인. 비교 기준을 미확정 후보로 대체하던 pause/remount 경계·장시간 숨김 seed 경계, frame 누락 시 최소화 무시를 재현/수정했다. 계정 내부 역사 기준은 비교용이며 새 신선한2회/네 재조회/수동 선택·주기DB 증가0 유지.
- 양쪽 native5px 가장자리360~720 폭/별도width파일 기억, 도킹/자동높이 선택폭 보존. 설정18/20/22 IRIS 환경별 기억, RootLayout desktop resize 글자초기화 제외, 24rem상한 제거/큰글자 좁은숙제1열. native61/grip13/bridge/WebView·관련26/전체Node/타입/대상lint/build57·합성추천18/폰트폭12 통과. 과거 browser계정 selector3곳 수정 후 관련18재검증, 전체browser완료 주장은 하지 않는다. 실제 간헐 문제 전체 원인 실측/새 native 실사용/DPI는 정상 종료·재실행 뒤 사용자 확인 대기.
- 현재 PID16040은 이전 native 실행. 새 native를 강제로 덮어 실행하지 않는다. 기존 웹15초/개인dirty 보존, 미커밋·미푸시·버전/패키지/DB/운영 배포 없음.

- 순월 수신: `codex/iris-checkboard-classes` HEAD `d72f218`, YG-20261008-001 ACK를 기록했다. 사무실 개인 변경을 보존했고 기존 메뉴를 다시 구현하지 않았다.
- 한설 승인으로 웹 크로노스 저장을15초/지금 저장/미저장 수·실패 보류·이동 보호로 변경. 스냅샷 단일 진행/최신 변경 병합, 상점·임무 합산·실패 후 서버 재조회로 중복 delta 방지. 메모는 기존 별도 저장. 운영 응답 지연은 실측하지 않았으므로 서버 속도 해결로 보고하지 않는다.
- 신규7건·전체Node·타입·새 helper/Workspace lint·최종분리webpack57·실제페이지 합성15초/수동/경합/실패/유실/이동/4폭 통과. 기존 페이지 lint채무는 보존, 실제 로컬 사용자/운영 체감은 대기. 강제 브라우저 종료 영구 복구는 없다.
- 개발 IRIS 정상 실행 PID16040/로컬200/시작stderr0, 메뉴·게임 실확인 대기. 변경은 미커밋/미푸시; DB/API/권한·새버전·배포 없음. 다음은 현재 후보 사용자 확인 후 읽기HUD 설계·조회 계약 검토. main 통합은 별도 승인 경계다.
- ACK: 대기.

## SW-20261008-002 — ACKNOWLEDGED (실게임 확인 대기)

- ACK — 영겁, 2026-10-08 20:21 KST: 최신 릴레이/핸드오프와 애드온 바 설정·창 정책·재화 강조·RAM 제거·검증 제한을 확인했다. 집 HEAD와 실제 원격main은 모두224eb6f816585fe083da958e63aeec6e458f4f97이며 아래 미푸시 표기는 작성 당시 상태다. 실게임 위치/최소화/종료/DPI 및 최종 빌드 환경 확인은 미완료로 유지한다. 이번 ACK는 로컬 기록이며 다음 공식 push에 포함한다.

- 발신자 순월 / 수신자 영겁, 2026-10-08 KST. 한설이 자동 검증·기록 후 push하고 집에서 첫 수동 검증을 영겁과 진행하도록 승인했다. 현재 호스트의 Git 쓰기 승인 한도로 push는 아직 실행되지 않았다. 공개 생텀 업데이트 공지는 만들지 않는다.
- `IRIS for SANCTUM` 제목줄·톱니바퀴 설정·영문 6테마·게임 창 오른쪽/왼쪽/끔·같은 층 유지·최소화/게임 종료 후 저장·보관 질문을 연결했다. 네이티브 회색 `:: 창 이동`, 클릭 통과, 불투명도, 글로벌 TopMost UI는 제거했다.
- 재화 항목별 강조는 계정/환경 로컬 표시 설정만 저장하고 잔액·조회 시각·DB 이력은 저장하지 않는다. 보호 큐·Supabase 스키마/RLS/권한은 변경하지 않았다. RAM companion 삭제 상태를 유지한다.
- 검증: 전체 Node 테스트, tsc, native policy/bridge/WebView 합성, addon/currency/homework/character-switch/game-exit 합성 통과. 실게임 확인은 집에서 진행한다.
- 개발 서버에서 계정 기억 목록 effect 의존성 배열 길이 경고를 재현해 고정된 ID·닉네임·역할 의존성과 언마운트 방어로 수정했다. 현재 호스트의 `next build --webpack`은 SWC baseUrl canonicalize 접근 거부로 별도 확인이 필요하다.
- 집에서 먼저: `git pull --ff-only origin main` 후 이 릴레이와 `docs/HANDOFF.md`를 읽고 새 IRIS를 실행한다. 게임 옆 위치·창 이동 detach·같은 층 체크·게임 최소화/복원·게임 종료 후 저장/보관/취소·테마 재실행을 순서대로 확인한다. 실제 DB 시험 쓰기와 강제 종료는 하지 않는다.
- 관련 커밋 해시는 공식 push 후 이 항목에 덧붙인다. ACK는 읽었다는 뜻이며 실게임 검증 완료를 뜻하지 않는다.

## SW-20261008-001 — ACKNOWLEDGED (누적 기록 보존)

- ACK — 영겁, 2026-10-08 20:21 KST: 누적 스탯 수동 연결·재화 표시·숙제 가독성·캐릭터 변경 추천3초/후보1초 정책과 합성 검증/사용자 확인 경계를 읽었다. 자동 스탯 저장·전체 클래스 자동 조회·공헌도·시낙시스 미지원, 숙제 별칭 GET/POST 비대칭 진단 과제 및 느린/늦은 응답 방어를 인지했다. 확인 커밋224eb6f, 실제 게임 추가 검증 완료를 뜻하지 않는다.

- 감지 속도 최종 후속: 한설 실게임 추천 표시 확인/10초 지연 제보, DB/Vercel 요청 증가 없음 조건으로3초 로컬 조회·첫 후보1초 재확인 승인. 완료 후 단일timeout/후보별빠른확인1회/캐시·실패3초 복귀, 느린CLI 중복·누적 없음. 카탈로그/fallback/DB쓰기/계정·선택·숨김·종료 방어 유지. 기존10초에서 속도 회귀 RED→최종 합성19/19(주기스탯·숙제GET 증가 없음,스탯POST0)·전체321·tsc/대상lint·최종분리build52 exit0. 테스트 기준은 frozen clock 재선택으로 hydration 영향을 분리, 실패 후1→3→1 cadence에 정렬했다. 실게임 체감/PCCLI부하 확인은 남음. 버전/commit/push/운영DB 변경 없음; 아래10초기록은 과거 설계로 보존.

- 최신 애드온 바 방향/추천 후속: 한설이 현 IRIS는 모비노기 옆 컴팩트 애드온 바이며 이 버전 기반 별도 오버레이 확장임을 명시했다. DECISIONS에 기록, 공통 조회/추천/저장 재사용 원칙. 숙제 테마 제목 띠/표식/완료 배지/얇은 visible-sibling 구분선, 기존2열/토글/큐 보존. 실제 `:: 창 이동` 표시가 잘 보인다는 사용자 확인 완료(전체DPI/다중 모니터 확인 아님).
- `irisCharacterSwitch`+`DesktopCharacterWatch`: visible/selected 약10초 게임 읽기·2개 distinct fresh 관측·직업/다중 값 변화·양수 겹침2개/후보 차이로 추천. 네는 재조회 후 선택만/아니요 유지·반복 억제/다른 캐릭터 기존 선택창. 신원·UUID/자동 스탯 저장 아님. 로그인/수동 스탯 카탈로그 공유·없으면1회 retry, 주기DB GET 없음. 수동 선택/계정/종료 의도의 동기 context version 및 숨김/잠금 generation으로 늦은 응답 차단; native 직렬화/기존 캐릭터 큐·draft 보존.
- 최종: Node321 exit0·tracker9/CSS6테마3·독립tsc/좁힌 새React lint·사본webpack52 exit0·합성 실제페이지16/16(pageerror0, 스탯POST0,4폭)·기존 스탯/숙제DOM 통과.3경합+0-only 오판 RED→GREEN, 첫10초 tick timer등록 경계 수정. 밝음/어두움 캡처 눈 확인, 재리뷰 중요 문제 없음. 기존 page remembered effect lint/Stats cleanup 경고 유지, 실게임 변경 추천은 사용자 확인 대기. v2.154·DB 구조/RLS/운영 직접 쓰기/버전/push 없음, 시낙시스 다음 미구현. 앞선 미ACK 전달 모두 보존한다.

- 실행 상태 후속 정정: 기존12:50 native는 마지막 점검에서 없었고 PID23056도 실제 창으로 확인되지 않았다. 13:41 최신 desktop.ps1 -Development 실행 요청(PID1432), 동일 실행 재요청 exit0/단일 실행 유지. 창 확인 도구에 IRIS가 나오지 않아 실제 :: 손잡이 표시/드래그는 사용자 확인 대기; native fixture18 재통과. 아래 구창 기록은 당시 상태로 보존하며 해결 완료로 판단하지 않는다.
- 최종 숙제 후속: 한설 요청 준비 중3줄 제거/비활성 메뉴 유지, 아코디언 대신 기본 모두 선택된 분류4버튼+우측 미완료만 체크, 외곽 구분 테두리 제거. 어비스/레이드는 전체 이름, 일일/주간만 약칭. 표시 토글은 조회/전송/큐 영향 없음. 사용자 이전2열 화면 확인, 최신 합성 토글/필터/전체이름/4폭·신규6·전체309·tsc/lint 통과. 합성 첫 행 위치 비교1건 실패 후 코드 수정 없이 재실행 통과, 실제native12:50구창 정상 종료/재시작 대기. 버전/push 없음.
- 최종 후속 build52/좁힌 리뷰 통과, 새 중요 문제 없음. 손잡이 실표시/드래그/DPI는 사용자 정상 종료 후 확인 대기.

- 숙제 가독성 후속: 한설 승인 약칭 체크형2열/반복 한 줄/분류별 완료항목 합계. 기존 mobile_name→short_name→cleanItemName 우선 표시만 optional displayName으로 전달(검증/구형 응답 호환), canonical name/ID/저장 매칭/큐/15초 보존. 기존약칭 컬럼 GET 추가만·DB 구조/쓰기 변화 없음. 신규5·전체308·tsc/lint·사본build52·합성 별칭/2열/필터/기존ID2POST/4폭 통과. 현재 native 구창 실행 중·정상 재시작 손잡이/DPI 대기, push 없음. 추천60초 비활성화 질문은 설명만 했으며 수정 안 함.
- 숙제 교차 리뷰 새 중요 회귀 없음. 기존 HEAD부터 mobile_name 숫자ID 매칭의 GET/POST 카탈로그 비대칭이 있어 별칭/원명 충돌 때 기준값 차이 가능(합성, 실제 충돌 미확인). BETA_FEEDBACK에 후속 진단 기록, 이번 매칭/DB 수정 없음.

- 상단/메뉴 후속: 상위 크로노스·시낙시스·설정, 크로노스 4개 실제 탭+물물교환/상점구매/임무게시판 비활성 미리보기. 마지막 하위 탭 복귀/전환1회 조회/입력·큐 보존, 생텀 선택 닉네임·직업 sticky, 빈 저장 줄 제거/저장 안내 접기. native `:: 창 이동` 실제 Label·자동 높이 chrome 합산. 관련20·전체303·tsc/lint·합성 DOM·사본build52·native18 통과, 좁힌 리뷰 중요 문제 없음. 실제 native 드래그/DPI/화면 경계는 정상 재실행 후 확인 대기. 버전/push 없음. 재화 표시 사용자 확인, 캐릭터별 재화 DB 이력은 사용자 거절로 미구현. 다음 시낙시스 읽기 연결은 여전히 남음.

- 최신 결정: 한설 승인으로 외부 RAM 연동 제거. desktop/overlay 자동시작·메뉴와 helper/configure/전용fixture3파일 삭제, EXE/개인설정/기존 프로세스 보존. 예전 RAM 연결 기록은 과거 이력이며 재연결하지 않는다. 이전 창은 정상 재실행 필요. 공식 CLI만으로 제재면제/넥슨승인 단정 금지.

- 재화/조회 후속: 28종 get_currencies 재화 탭·고정 native method 추가(읽기 전용, no DB). 각 탭 변경1회/같은탭0회; 숙제·클래스는 기존 refresh/미저장 큐·draft 보존, 스탯은 첫 관측 재사용 없이 조회, 닉네임 accent/좌 재조회·우 DB업데이트. Node300·tsc·native fixture·합성 탭/재화/4폭·사본build52 통과. 새native 적용은 정상 종료/재실행 사용자 대기. 다음 요청은 시낙시스 정보 연결(미구현). 이전 기록 보존, 버전/push 없음.

- 최종 후속 검증: 지연 조회 중 다른 기능 조작/늦은 추천 무시 합성 DOM GREEN, 독립 tsc·검증 사본 webpack52경로 통과. 새 로그인 추천의 실제 사용자 확인 대기. commit/push/버전 변경 없음.
- UI 후속 승인/구현: 로그인 1회 후보 추천(4초 제한·늦은 결과 무시·수동 선택 우선)과 ↑버튼 클릭 시 대상 확인창을 분리했다. 짧은 계열 목록은 자연 높이. 실제 사용자 기존 스탯 저장/웹 일치 확인, 새 UI는 확인 대기. CLI 최신capabilities28/재화 이름에 공헌도·클래스별 레벨 계약 없음을 재확인했다. 길드 토큰=공헌도 매핑 금지. 전체298/298·타입·합성 UI 통과; background 전역 잠금 리뷰 지적은 RED 재현 후 조회 로컬/저장 전역 busy로 분리 수정. DB/native/큐/버전/push 변경 없음. 앞선 기록 모두 보존한다.

- 후속: Production 사본의 합성 스탯 DOM 흐름/네 폭 검사 통과. 실제 계정·게임/DB는 사용하지 않았다. 테스트 전용3001 서버는 종료한다.
- 독립 리뷰 Critical/Important 없음. 로그인 만료를 게임 설정 오류로 안내하던 Minor는 인증 안내를 보존하도록 수정했다. 후속 좁힌 스탯 검사 외 전체 빌드/회귀는 반복하지 않는다.

- YG-20261007-001과 a464ea6/v2.154를 확인했고 순월 수신함에 ACK했다. schema2 큐·클래스 수동 저장·미완료 수동 검증 경계를 유지한다.
- 한설 승인으로 스탯 수동 연결 묶음 구현: 본인 후보 안내/닉네임 직접 확인/생텀 위·인게임 아래/↑버튼, 고정 get_my_info 네이티브 읽기와 `/api/iris/stats` 본인 전용 CAS. 누락 유지·0/감소 허용, 재조회 변경 시 재확인, 자동 POST/재시도/UUID 신원 간주 없음. 클래스 Level 추정·공헌도 제외. 상세 IRIS_STATS_CONTRACT 및 HANDOFF 최신 절 참고.
- 반복 전체 검증 대신 묶음 완료 시 전체 회귀·타입·빌드 한 번, 중간엔 좁힌 검증을 운영하기로 승인받았다. 전체295/295·타입·Windows bridge/WebView·사본 webpack52경로 통과. 실제 게임/DB 저장은 사용자 확인 대기. DB 구조/RLS/권한·버전·공개 공지 변경 없음, push 미요청. 이전 메시지는 그대로 보존한다.

## SW-20261007-001 — ACKNOWLEDGED (이전 로컬 기록 보존)

- ACK — 영겁, 2026-10-07 19:27 KST: 수신함과 HANDOFF 및 20261007 검증/커넥터 검토를 확인했다. 현재 HEAD 9012a7d, `git pull --ff-only origin main` 최신 확인. 기존 공지 초안 변경·미추적 테마 검증 파일은 보존한다. 로그인/트레이/RAM 후속과 사용자 확인 범위를 인지했으며 미저장 복구·계정 격리·실충돌·오프라인·DPI·장시간은 미완료로 유지한다. 집 RAM 경로는 임의로 지정하지 않는다. 이번 ACK는 로컬 기록이며 다음 공식 push에 포함한다.

- 발신 완료 — 2026-10-07 14:53 KST:94637ce main push, Vercel GitHub success/Deployment has completed(2xTYjZq58ApFTjdvhRbgBez24ga1), 운영7화면/health200·IRIS API401·실브라우저 앱 제한·새 인증 문구 자산 확인. 현재 메시지는 이번 후속 문서 push로 공유한다. 아래 '로컬/push 없음'은 당시 기록으로 보존. v2.153 유지·구조/DB/권한/공지 변화 없음(후속 문서 기준). 집에서 main pull/ACK 후 미완료 장시간/DPI/실충돌·오프라인 큐 확인, 램 EXE는 PC별 configure 필요. SDK/EXE/프로필·모집 이미지 제외.
- 공식 push 준비 — 2026-10-07 14:50 KST: 한설 승인, 기존 요청대로 v2.153 유지·공지 없음. main25ee771 최신 pull, 최종269/269·타입·Windows 보안/복구/RAM/실제 합성 WebView 및 분리 빌드static50 통과. 이번 로그인/트레이/램 연결·검증/ACK 문서만 포함, public/recruitment·EXE/SDK/개인설정 제외. 집 램 경로는 configure로 별도 설정. 장시간/DPI/실충돌/오프라인 큐 미완료 유지. 아래 push 없음은 당시 기록이며 이번 결과는 후속 누적한다.
- 트레이 실검증 후속: 수정본 재실행 후 메뉴 한글 정상 표시 스크린샷 및 트레이 입력 복구 사용자 확인 통과. 앞선 트레이 대기는 해소. 미저장 큐 복구/충돌/네트워크/DPI/장시간은 별도 미검증. push 없음.
- 트레이 한글 후속: desktop.ps1 BOM 누락으로 Windows PowerShell5 ANSI 해석, 사용자 메뉴 깨짐 재현. BOM 추가만 수정, 실제 파서 회귀 RED→GREEN·전체269/269 통과. 앱 정상 재실행 후 실메뉴/트레이 복구 대기. 데이터/버전/push 없음.
- 클릭 통과 후속: Ctrl+Alt+O 전환 사용자 확인 통과. 트레이 복구는 미검증 유지. push 없음.
- 단축키 후속: Ctrl+Alt+I 숨김/복원 사용자 확인 통과. 클릭 통과/트레이 입력 복구는 대기. push 없음.
- 정상 종료/재실행 후속: 사용자 확인으로 로그인·쌍월/장궁병 선택·저장된 일일 미션 체크·미저장 없음 유지 통과. 미저장 대기함 복구/계정 격리·장기 유지·테마 재실행 유지는 별도 미검증. 기존 재실행 대기 기록은 이 범위에서만 갱신. push 없음.
- 후속 사용자 확인: 실제 로그인·쌍월/장궁병 선택, 생텀 웹과 숙제 체크/횟수 일치 및 IRIS 미저장 없음, 어두운/녹색 테마 전환 확인. 수정 후 전체268/268·타입 통과. 정확한 자동저장 지연/재실행 유지/복구/단축키/DPI는 대기. 스탯·시낙시스 미지원 안내는 정상이며 연동 완료가 아니다. 이전 대기 기록은 이 확인 범위에서만 갱신한다. push 없음.
- 후속: IRIS 개발 실행·공식SDK 해시/서명 확인, 초기 전체266/266·웹빌드50페이지·타입·Windows 보호저장/브리지/종료/잠금/체크보드·WebView 세션fixture 통과. native overlay fixture는 실행 중 IRIS 단축키 충돌로 대기. docs/IRIS_VALIDATION_20261007.md에 전체 수동 체크리스트 기록.
- 사용자 로그인 화면 피드백: 세션GET200/로그인POST401을 공통 연결 경고로 표시하고 기본password가 한글IME 막음. 기존웹 SecretCodeInput 재사용(busy/required/maxLength 확장)·로그인401/403 안내구분. 회귀2개RED→GREEN, 관련19개/타입통과. 실제 재로그인·숙제저장·복구/DPI 대기. 운영DB/버전/push 없음.

- 발신 순월 / 수신 영겁, 2026-10-07 KST. 기존 전달 보존.
- 한설 승인: 램누수정리v2를 IRIS 시작에 연결. ram-companion/configure/tests 추가, desktop/overlay 트레이 연결. PC별 AppData 설정, 기본 꺼짐/사무실 명시 켜짐, 기존 프로세스 재사용·경쟁 잠금·실행 폴더 지정·실패 비차단·종료 시 램 도구 유지.
- Windows PowerShell 회귀9개/구문5파일/기존 두 프로세스 재사용 확인. 전체 IRIS 재시작과 미실행 도구 실제 시작은 수동 대기. 상세 조사/검증: docs/IRIS_CONNECTOR_REVIEW_20261007.md 및 iris/README.md.
- 모비 생활 커넥터1.3.0: 게임 설정 활성화 후 기존 IRIS reader가 스탯·가공·미션·재화 실조회 성공. 자동 작업 실검증 없음. 램 설정 화면500MB/5초와 폴더 config2000MB/45초 불일치 원인 미확정.
- DB·권한·외부 EXE 재배포·버전업·commit/push/배포 없음. 이 메시지는 아직 사무실 로컬이다.
- ACK: 대기.

## SW-20260928-001

- 상태: `ACKNOWLEDGED`
- 발신자: 순월 — 사무실 호스트
- 수신자: 영겁 — 집 호스트
- 작성: 2026-09-28 KST
- 최종 갱신: 2026-09-28 18:03 KST (프로젝트_IRIS 인계 push 준비)
- v2.13 후보: 케리그마 계정별 서버 읽음, 배너/헤더 가림 방어, 캐릭터 관리 변경분 저장과 즉시 진행 표시, 크로노스 6줄씩 더보기, 상점 품목 추가를 묶었다. `notice_reads` 운영 SQL은 한설이 적용·권한 확인했다. 상점 SQL도 한설 승인·백업 확인 뒤 적용했고 1→128행, 앨빈 1·중복 0·RLS 유지·익명 접근 차단을 확인했다.
- 기존 앨빈 사포 및 구매/즐겨찾기 기록을 보존한다. 상점 SQL은 `(map,npc,reward)` 일치 행을 건너뛴다. 앱 푸시 후 상점 카드·구매 조건 실화면과 공지 읽음의 두 기기 동작을 확인해야 한다. 운영 검증과 배포 결과는 `docs/HANDOFF.md` 최상단을 확인해 줘.
- `d9e6fe9` main push 뒤 운영 `/character`의 v2.13 HTML과 인증 헬스, 공개 핵심 경로, 비로그인 읽음 401까지 확인했다. Vercel Ready 표시와 로그인 후 카드/공지 읽음/캐릭터 저장 실검증은 아직 남았다. 이를 기록하는 후속 문서 push에는 코드·DB·구조 변경이 없다.
- 2026-09-28 v2.14 후속: 루나의 미커밋 크로노스 카드/3줄 더보기/테마 SVG 변경을 순월이 검토했다. 물물교환 저장 시 모든 품목을 새 기간으로 재도장하고 레거시 JSON을 지우던 위험을 고쳐, 조작한 품목만 새 기간을 기록하고 계정당 기간을 함께 동기화한다. DB 직접 수정 없음. 운영 로그인 후 카드·일/주간 경계 확인은 남는다. 이 누적 메시지는 ACK 전까지 보존해 줘.
- `be5d1c2` main push 후 운영 `/character` v2.14 HTML·더보기 SVG와 공개 핵심 경로 200을 확인했다. Vercel Ready 대시보드와 로그인 후 실조작은 미확인이다. 배포 확인 문서 후속 push는 코드·DB·구조 변경 없음.
- 한설이 새 Windows 동반 프로그램 이름을 **Sanctum IRIS / 프로젝트_IRIS**로 정했다. `docs/PROJECT_IRIS.md`에 목표, 공식 AI 커넥터·타 제작자 도구에서 확인된 범위, 기술 미확인 사항, 크로노스·시낙시스·본인 스탯의 단계적 연결, DB/인증/정책 경계, 엠포리온·그노시스 융합 비전을 정리했다. `docs/DECISIONS.md` D-014에도 명칭과 비전/미결정을 기록했다. 사무실 PC에서 공식 게임 CLI의 `get_my_info`는 일반 실행 환경에서 읽기 전용 성공했으나 Codex 격리 환경에서는 `game_off`가 나오는 오진이 있었다. 캐릭터 값은 기록하지 않았다. `app/companion-preview/`는 개발 환경 한정 샘플 웹 화면이며 Windows 앱·실제 게임/DB 연동은 아니다. **이번 IRIS 인계 push에는 별도 케리그마 편집 권한 코드·D-013·관련 베타 피드백을 포함하지 않는다.** 운영 DB 변경은 없다. ACK 전에는 앞선 전달을 보존해 줘.
- 한설이 집 호스트에서 `main`을 pull해 영겁에게 확인시키겠다며 IRIS 인계를 공식 push 요청했다. **버전은 v2.14 그대로 유지**한다. `docs/RELEASE_NOTES.md`, `docs/HANDOFF.md`, `app/SANCTUM_MASTER_GUID.md`에 이번 범위와 운영 확인 대기를 기록했다. `docs/PROJECT_IRIS.md`를 먼저 읽고 단계 0 기술 검증을 이어받아 줘. 운영 기능·API·DB 변경은 없고, 이번 커밋의 시제품 경로는 Production 404다.
- 이전 `SW-20260923-001`의 기록과 ACK는 그대로 보존했다. 이 메시지를 확인하면 ACK를 남겨 줘.

### ACK

- 수신자: 영겁 — 집 호스트
- 확인 시각: 2026-09-28 KST
- 확인 범위: v2.13·v2.14 작업 및 운영 화면 추가 검증 대기 사항과 순월의 `Sanctum IRIS` 기획·개발 전용 시제품·안전 경계를 확인했다. 이 ACK는 후속 검증 완료를 뜻하지 않는다.
- 확인 커밋: `1793c3d` (`main`)

## SW-20260923-001

- 상태: `ACKNOWLEDGED`
- 발신자: 순월 — 사무실 호스트
- 수신자: 영겁 — 집 호스트
- 최초 작성: 2026-09-23 KST
- 최종 갱신: 2026-09-23 KST

### 관련 커밋·배포

- `13a62ec`: v1.95 CBT 로그인 복구
- `d7d3758`: v1.95 배포 검증 문서 마감
- Vercel Production: 두 커밋 모두 `Deployment has completed`

### 누적 작업

1. v1.94가 운영 DB에 아직 없는 로그인 RPC와 세션 테이블을 먼저 호출해 CBT 전체 로그인이 중단된 원인을 확인했다.
2. `app/login/page.tsx`의 기존 계정 로그인과 가입 신청을 현재 운영 DB 구조로 복구했다.
3. `app/layout.tsx`가 미적용 서버 세션 검사로 저장 계정을 지우지 않도록 기존 계정 복원 흐름으로 되돌렸다.
4. P0 장애를 베타 피드백·릴리스 노트·인계서·마스터 가이드에 기록하고 v1.95로 push했다.
5. 영겁·순월 간 누적 ACK 방식의 Codex 릴레이 규약을 추가했다.
6. CBT 가입 신청이 DB에 저장돼도 관리자 화면과 알림함에 나타나지 않는 문제를 확인했다. 미적용 서버 세션에 묶인 관리자 API를 현재 계정 코드 재확인 방식으로 수정하고, 대기 신청 알림을 주기적으로 복원하는 코드를 준비했다. 신규 캐릭터 등록의 잘못된 컬럼명도 바로잡았다. 운영 DB 변경과 push는 아직 하지 않았다.
7. 한설이 가입 승인 화면의 본인 확인 후에도 계정 조회가 실패한다고 보고했다. 로컬 개발 서버의 서버→Supabase 요청이 실행 환경의 네트워크 제한으로 실패한 것을 확인하고, 서버를 연결 가능한 환경에서 재시작했다. 관리자 화면의 본인 확인 안내를 강조하고 연결 오류를 구분하도록 개선했다. 가짜 코드 요청은 정상적인 403으로 응답했지만 실제 관리자 코드 인증은 보안상 자동 검증하지 않았다. 운영 DB 변경과 push는 아직 하지 않았다.
8. 한설이 관리자 권한 화면의 카드형 레이아웃과 전체 모듈의 과한 PC 글자 크기·말줄임을 지적했다. 권한 관리 목록을 행형으로 바꾸고 12자 닉네임 전체 표시, 관리자 전용 rem 글자 토큰, 다른 관리자 모듈의 긴 문구·모바일 줄바꿈 방어를 준비했다. 작업 규약은 `AGENTS.md`에 남겼다. 운영 DB 변경과 push는 아직 하지 않았다.
9. 한설이 상단 EMPORION 호버명 잘림, 중간 폭의 이른 바텀 메뉴 전환, 모바일 브랜드 설명 부재와 플로팅 호출 인지성을 지적했다. 메뉴 표시 경계를 낮추고 중간 폭은 브랜드 설명을 접어 공간을 확보했으며, 호버 슬롯 전환과 모바일 브랜드 설명, 플로팅 `메뉴/닫기` 표기·드문 맥동을 준비했다. 운영 DB 변경과 push는 아직 하지 않았다.
10. 한설이 홈 테크네 Top 3의 동일 계정 중복과 모바일 요약 SVG 마크 크기 불균형을 지적했다. 홈 테크네에 판테온과 같은 계정별 최고 생활력 선발 규칙을 적용하고, 모바일 요약 6개 마크를 같은 규격으로 키워 각 SVG 비율을 보정했다. 운영 DB 변경과 push는 아직 하지 않았다.
11. 한설이 순월의 사무실 호스트 전용 말투·외형 설정을 지정해 `AGENTS.md`에 기록했다. 홈 모바일 ASTRA·올라운더 마크는 첫 보정 후에도 작아, 길드·도감 SVG의 과다한 `viewBox` 내부 여백을 실측하고 `MarkIcon.maskZoom`으로 해당 두 호출부에서만 잘라 보이도록 다시 조정했다. 원본 SVG와 다른 화면의 마크에는 영향이 없다. 운영 DB 변경과 push는 아직 하지 않았다.
12. 한설이 모바일 요약 마크가 이번에는 지나치게 크다고 지적해 여섯 카드를 작은 좌측 마크·우측 이름/수치 배치로 재정리했다. 전역 상단의 날개·팔레트 이모지는 테마색 SVG로 바꾸고 알림 벨은 기존 인게임 형상의 `우편함 마크.svg`로 교체했다. 운영 DB 변경과 push는 아직 하지 않았다.
13. 한설이 640px 안팎 AGORA 판테온 화면에서 `sm` 3열 Top 3·6열 탭·하단 메뉴 겹침을 제보했다. `sm`까지 모바일로 취급해 `md`부터 3열/6열을 활성화하고, 모바일 카드의 줄바꿈·수치 방어와 전역 본문 하단 안전 여백을 추가했다. 운영 DB 변경과 push는 아직 하지 않았다.
14. 한설이 상단 정령 날개·알림·계정 드롭다운 및 테마 설정창의 일관성·모바일 방어를 요청했다. 숨겨져 있던 옛 날개 메뉴를 제거하고 버튼·팝오버에 같은 `정령의 날개 마크.svg`를 적용했다. 세 드롭다운과 모바일 바텀 메뉴의 동시 열림을 막고, 긴 글자·화면 높이·모달 배경 클릭/초점/스크롤을 보완했다. 사무실 순월의 다정하고 애교 있는 말투도 `AGENTS.md`에 명확히 기록했다. 운영 DB 변경과 push는 아직 하지 않았다.
15. 한설이 오늘 20명 안팎, 향후 40명까지 직접 가입하는 CBT 확대를 알렸다. 운영 `accounts`의 읽기 전용 권한 검사에서 `anon`의 `code` SELECT, 계정 UPDATE·DELETE 권한이 모두 참이고, 정책 조회에서 `PUBLIC` 대상 SELECT·UPDATE·DELETE·ALL이 모두 `USING true`이며 ALL은 `WITH CHECK true`임을 확인했다. P0 오픈 차단으로 판정했다. 코드가 보이는 관리 화면 캡처가 대화에 올라와 재공유 금지를 안내했다. 운영 DB 변경과 push는 아직 하지 않았다.
16. 운영 키 목록에 `SUPABASE_SERVICE_ROLE_KEY`가 없음을 한설이 확인했다(값은 공유받지 않음). `20260923_accounts_prepare.sql`·`20260923_accounts_lockdown.sql`을 **초안**으로 만들고 로그인·가입·세션·계정 전환·관리자 계정 API 및 계정 읽기 경로를 서버 기반으로 연결했다. `npx tsc --noEmit`, `npm run build` 통과. 단, 서버 키·운영 DB 준비 SQL이 없으므로 현재 작업 트리의 새 로그인 경로는 실동작 검증 전이며 배포하면 안 된다. 운영 DB 변경과 push는 아직 하지 않았다.
17. 한설이 Supabase의 서버 키 존재를 확인하고 Vercel Production 환경변수에 저장했다고 답했다. 값은 공유받지 않았다. 기존 배포에는 아직 적용되지 않는다. 운영 백업 시점 확인을 요청했고, 계정 외 익명 권한 점검용 읽기 전용 SQL을 `supabase/diagnostics/20260923_anon_privileges_readonly.sql`에 추가했다. 운영 DB 변경과 push는 아직 하지 않았다.
18. 최근 자동 백업은 2026-09-23 08:14:31 KST로 확인했다. 준비 SQL에 기존 UI 가입의 해시 동기화 트리거와 서버 측 로그인 시도 제한을 추가했다. 신규 가입 코드는 구버전 롤백 시 로그인 가능하도록 기존 `code` 컬럼에도 전환 기간 동안 저장하며, `NOT NULL` 제약은 유지한다. 새 보안 배포 뒤 별도 승인으로 평문 제거·코드 회전을 계획해야 한다. 운영 DB 변경과 push는 아직 하지 않았다.
19. 한설이 Phase A를 운영 SQL Editor에서 성공 실행했다. 읽기 전용 검증 결과 계정 13개, 해시 누락 0, 세션·로그인 제한 테이블 및 로그인·가입·제한 함수 모두 true. Vercel Production 서버 키도 저장 완료. push 전 원격 fetch를 시도했으나 현재 Codex 사용량 제한으로 `.git/FETCH_HEAD` 권한 승인 검토가 거절되어 push는 실행하지 못했다. 운영 계정 공개 권한 차단 Phase B는 아직 실행하지 않았다.
20. 사용량 복구 후 `git fetch origin`과 `git pull --ff-only`에 성공했고 원격 `main`과 로컬 HEAD가 같음을 확인했다. 한설이 Vercel Preview에도 서버 전용 키를 저장했다. v1.96 Preview 후보로 서버 인증 및 누적 UI 수정·인계 문서·SQL을 묶어 push 준비 중이다. Preview `/api/auth/health`와 실제 로그인·가입·승인·캐릭터·공지·파티 확인 전에는 Production 완료나 베타 오픈으로 표시하지 않는다.
21. v1.96 Preview 후보를 `codex/v1-96-beta` 브랜치 커밋 `480359a`로 push했다. Vercel Preview Ready, 한설이 health `ready: true`·본인 로그인·관리자 계정 13명 목록과 대기 0건을 확인했다. 기존 `/api/sync-client`·`/api/sync-weekly`가 서버 키 활성화 후 무인증 고권한 쓰기를 허용하는 P0을 발견해 운영진 인증을 추가하고 Tampermonkey v8.3에서 전송 직전 코드 재확인을 준비했다. 이 후속 패치의 Preview 재배포와 비인증 403 확인 전에는 Production push 금지. 신규 가입·승인·캐릭터·공지·파티 검증도 미완료다.
22. 동기화 API 인증 패치를 `fee4b78`로 Preview 브랜치에 push했다. 로컬 두 POST의 무인증 요청은 각각 403이었고 타입·빌드·스크립트 문법 검사를 통과했다. 운영 읽기 전용 SQL에서 `accounts.code`·`code_hash` anon SELECT 참, RLS 꺼진 18개 테이블 모두 anon 쓰기 가능을 확인했다. `main`은 여전히 `d7d3758`; Phase B도 미실행. 20~40명 베타 오픈 완료 선언 금지. 익명 권한 차단 전 서버 인증 쓰기 경로를 만들어 기존 기능을 보존해야 한다.
23. 한설이 Preview에서 새 테스트 계정 신청→대기 목록 1건→승인→새 계정 로그인·첫 캐릭터·공지·파티 읽기→일반 길드원의 `/admin` 접근 차단까지 확인했다. 처음 수기 재입력 코드는 틀렸지만 DB 저장 코드·해시는 정상이고 원문 붙여넣기로 로그인 성공했다. 한설이 테스트 계정 `code`를 DB에서 직접 변경한 뒤에도 해시 일치가 확인됐다. 값은 받지 않았다. 테스트 계정은 임의 삭제하지 않는다. Production push/Phase B는 아직 하지 않았다.
24. 한설이 퇴근 후 집 영겁에게 이어받도록 요청했다. 순월은 검증·진단 문서를 `codex/v1-96-beta`에 마감 push하고 멈춘다. 영겁은 `main`이 아닌 이 브랜치를 먼저 pull할 것. Production v1.95는 아직 변경하지 않았고, `accounts` Phase B 및 18개 익명 쓰기 테이블 권한 변경도 미실행이다. 확대 베타 초대 전 P0 판단이 필요하다. 수신 확인(ACK) 전까지 순월의 누적 인계를 지우지 말 것.

### 현재 상태

- 한설이 기존 계정 로그인 성공을 확인했다.
- `npm run build` 통과.
- `npx tsc --noEmit` 및 `MarkIcon.tsx` 린트 통과. 모바일 마크는 한설의 로그인된 로컬 화면에서 시각 재확인 대기.
- 운영 DB Phase A 적용 완료. Phase B 권한 차단은 미실행. Vercel Production·Preview 서버 전용 키 저장 완료.
- 서버 세션 UI/API는 Preview 검증 대기. 운영 서비스 v1.95는 현재 정상 동작 중이며 새 코드의 실로그인 검증은 아직 없다.

### 이어서 할 일

1. 집 PC에서 pull 직후 이 메시지를 읽고 ACK한다.
2. CBT 사용자의 운영 주소 로그인 여부와 캐릭터·공지·파티 핵심 경로를 우선 점검한다.
3. 서버 세션 보안 전환은 운영 DB 변경 계획과 복구 방법을 한설에게 먼저 보고한 뒤 승인받는다.
4. 관리자 모듈의 다른 테이블(`nexus_banners`, `nexus_tasks` 등)도 브라우저 직접 쓰기와 RLS 미적용이 남아 있어, `accounts`만 잠가서는 확대 베타 안전 판정을 할 수 없다. 서버 쓰기 경로와 정책을 추가 점검한다.

### 주의·금지

- `supabase/migrations/20260922_account_code_hash_and_login_rpc.sql`을 승인 없이 운영 DB에 적용하지 않는다.
- 새 로그인 UI는 서버 키와 Phase A가 필요하다. 둘 다 준비됐지만 Preview 실제 로그인·가입·승인 검증 전 Phase B를 먼저 실행하지 않는다.
- 비밀값·입장 코드·서비스 역할 키를 문서나 채팅에 남기지 않는다.

### ACK

- 수신자: 영겁 — 집 호스트
- 확인 시각: 2026-09-23 19:55 KST
- 확인 커밋: `dacef18` (`codex/v1-96-beta`)
- 확인 범위/답신: v1.95 운영 기준선, v1.96 Preview 검증 범위, Phase A 적용·Phase B 미적용, 익명 쓰기 권한 위험, Production 미배포, 동기화 API 인증 후속 작업을 확인했다. ACK는 인계 수신 확인이며 운영 배포·권한 차단 완료를 뜻하지 않는다.

### 2026-10-19 17:15 KST 최종 검증
검토 보완 후 독립 tsc·GNOSIS scoped ESLint exit0, Next60/60 build exit0. 전체 Node477/474PASS3기존skip0fail, git diff --cached --check PASS. 실제 IAB에서 미저장 이동확인/계속편집 입력유지/개인저장 후 새로고침 복원을 확인했다. 관리자 기존4lint오류는 별도보류. 이 상태를 codex/gnosis-dressroom에 정상 push하며 main/운영DB/수동배포/공지/ZIP는 유지한다. 제품3D는미완료이며로컬사진/팔레트공유만구현됐다.