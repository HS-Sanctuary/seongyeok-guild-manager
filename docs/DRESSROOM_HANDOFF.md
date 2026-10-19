# 드레스룸 전용 작업 인계

- 작성 순월 / 2026-10-19 KST. 집의 미전송 변경을 받지 않은 독립 작업이다.
- 브랜치: codex/gnosis-dressroom. 기준: 운영 origin/main 1d8e3749f306456bea1c2a7b2e05da813b98e5fa.
- 폴더: C:/Users/sungw/.codex/worktrees/gnosis-dressroom/seongyeok-guild-manager.
- 기존 IRIS 폴더와 개인 변경/삭제/새 파일은 보존했다. 원격 IRIS의4234e54는 ls-remote로 존재만 확인했고 기존 폴더에 pull/merge하지 않았다.
- 설계 문서·인계는 로컬 커밋6229add에 보존했다. 이후 한설의 구체 요청으로 그노시스 메인 진입 버튼·준비 페이지·기존 SVG와 메인 목록 레이아웃 개선을 미커밋으로 추가했다. 게임 모델·새3D의존성·DB·RLS·main·push·배포 없음.
- 현재 로컬: npm ci --ignore-scripts 완료(365 packages), 독립 TypeScript exit0, Node 전체455/452PASS/3기존skip/0fail, dev127.0.0.1:3100. /gnosis/write HTTP200, 기존 패션 옵션 브라우저 표시 확인. 이 화면은 기존 시제품이며 새 드레스룸 완성이 아니다.
- 비밀값 보존: 환경 파일은 Git 제외. 기존 공개 Supabase 연결 설정2개만 분리 폴더에 복사, 서버키/로그인코드 복사0. 새 운영 데이터 작성/게임 행동0.

## REA 조사 근거

- REA capture_browser_scenario Evidence ev_a3ad5b96a1b575c88ee624d9895cc9544825440f3f9e27d16ed52fbef418f797.
- 임시 Chrome headless로 https://erinn.kr/dressroom 접속→7초대기, 네트워크 메타데이터/최종DOM 관측. 종료 terminated-owned-process. 관측 completeness complete, page-error0. 초기 호출의 action 스키마 검증 오류3건 뒤 유효 입력으로 실행했으며 오류 호출은 페이지 실행 증거가 아니다.
- 관측된 자료: /model/b20261018/manifest.json, costume-catalog-kr.json, regions/kr/customize.json, body_rig.json, eye_layers.json, expression.json; body/costume/customize/environment GLB와 PNG 이미지.
- 이것은 자료 요청의 관측이다. 리그 호환성·염색 셰이더·재사용 권한·실제 코디 공유 저장 경로는 미확인이다. 원문 DOM/다른 사이트 코드/모델을 제품에 복사하지 않았다. REA 원문은 세션 보관 Evidence이며 Git에 넣지 않았다.
- 별도 PowerShell JSON 직접조회2건은 HTTP403이었다. 브라우저 관측 성공과 직접 다운로드 가능성을 혼동하지 않는다. 우회/추가 다운로드하지 않았다.

## 영겁이 이어받을 때

1. 집의 아직 보내지 못한 변경을 먼저 확인해 커밋으로 안전하게 보존한다. reset/force/파일 덮어쓰기 금지.
2. 드레스룸 브랜치 push 여부와 정확SHA를 확인한다. 이번에는 push 요청이 없으므로 원격에서 보인다고 가정하지 않는다.
3. 설계 docs/superpowers/specs/2026-10-19-gnosis-dressroom-design.md의 승인 상태부터 확인한다. 전체 드레스룸은 작성 설계 검토 대기이며 상세 구현 계획/3D 구현 전이다. 별도 승인된 메인 진입 버튼과 준비 안내만 구현됐다.
4. 집의 app/gnosis/*/package-lock.json 변경 여부를 대조한 뒤 통합한다. 오래된 운영기준 공통 HANDOFF/릴레이를 최신 파일에 통째로 덮어쓰지 않는다. 본 전용 인계를 최신 공통 문서에 누적한다.
5. 운영DB/main병합/배포는 별도 승인 경계다. 공식push시 필수문서·최신릴레이·검증결과를 함께 갱신한다.

## 2026-10-19 메인 게시판 진입 변경

- 한설이 작성 화면 대신 그노시스 메인에 스텔라그램 SVG를 사용한 패션 시뮬레이터 버튼을 명시 요청했다.
- app/gnosis/page.tsx: 메인 헤더 아래 버튼 행, 패션 시뮬레이터 링크와 기존 새 지식 공유하기 버튼 유지. 모바일 세로/넓은 화면 가로, 색상은 테마 변수와 CSS mask 사용.
- 신규 app/gnosis/dressroom/page.tsx: 준비 상태를 정확히 알리고 게시판으로 복귀하는 화면. 실제 착용·염색·저장 기능은 없음.
- public/svgs/UI mark/스텔라그램 마크.svg: 기존 IRIS 작업 폴더의 사용자 SVG를 바이트 그대로 복사(해시 일치). 원본과 다른 개인 파일은 수정하지 않았다.
- 검증: 독립 TypeScript exit0, 신규 페이지 ESLint exit0, diff check 통과. 실제 브라우저320/390/768/1280px에서 버튼 잘림·페이지 가로 넘침 없음, SVG mask/테마색 확인. 메인→준비 화면 이동과 게시판 복귀 확인.
- 작업 범위는 위3개 제품 파일과 이 인계·설계 진입점 수정이다. 전체3D 설계 승인/운영 공유/배포 완료로 해석하지 않는다.

## 2026-10-19 메인 컴팩트 레이아웃

- 한설이 메이저 사이트를 참고해 순월 판단으로 메인을 정리하되 생텀 일관성을 유지하도록 요청했다. 드레스룸 전체 구현 승인과 별개의 기존 게시판 레이아웃 작업이다.
- 참고: https://github.com/orgs/community/discussions (분류/검색/목록 구분), https://www.inven.co.kr/board/maple/5974 (게시글 제목/작성자/날짜 중심 정보 구성). 코드·브랜드·이미지 복사 없음. 내부 비교: components/party/SynaxisSurface.tsx 제목/테마/패널 기준.
- app/gnosis/page.tsx를 컴팩트 제목+한줄 개발 안내, PC 분류 사이드바/모바일 분류 탭·접힌 세부 필터, 검색/정렬/제목·본문 요약·작성자·날짜·추천 목록으로 재구성했다. 스텔라그램 패션 버튼/글 작성/상세 새탭 이동 유지. 기존 큰 미디어 썸네일은 영상 보기 버튼과 펼침 iframe으로 전환했다.
- 새 app/gnosis/gnosis.css는 gnosis 범위에만 적용한다. 전역 테마 CSS 변수/rem 사용, 전역 layout/다른 페이지/IRIS 스타일 수정 없음. 제목·작성자는 생략하지 않고 본문 미리보기만 최대2줄이다. 반복 마우스 이벤트·떠다니는 요약/이미지 자동로드를 제거했다.
- 기존 gnosis_mock_db 키/글 데이터/기본 예시를 유지했다. 로컬 읽기를 타입 검사하고 손상 기록은 덮어쓰지 않고 안내한다. nexus_classes 조회는 기존1회 조회 구조를 유지하며 서버/API/DB 스키마·권한 변경 없음.
- 검증: 독립 TypeScript와 두 변경 페이지 ESLint exit0. 브라우저320/390/768/1280px 가로 넘침/행동 버튼 잘림 없음. PC 글자18/20/22px 확인 후 원래20px로 복원. 클래스→도적 계열→도적 필터/모바일 세부 필터 접힘, 검색 결과0 및 전체 초기화, 상세 링크/영상 열기·닫기 확인.
- 영상 iframe 연결은 확인했으나 기존 예시 YouTube 동영상은 외부 플레이어에서 재생 불가 안내를 표시했다. 실제 영상 재생 성공으로 기록하지 않는다. 이번에는 AUREUM 실제 화면을 확인했으며 밝은 테마 전환은 별도 미검증이다.
- 로컬127.0.0.1:3100/gnosis를 사용자 브라우저에 열어뒀다. PC/모바일 캡처는 채팅 시각확인용 로컬 아티팩트이며 Git에 넣지 않았다. 실제 다중 사용자 게시/3D 착용/공식 배포는 여전히 미완료다.

## 2026-10-19 분류 SVG·계열 직접 노출·시뮬레이터 강조

- 사용자 구체 지시: 전체보기/클래스/생활/패션/악보/기타 순서로 표시. 모바일 세부 분류 드롭다운 제거, 클래스 선택 즉시 모든 계열 버튼 노출→선택 계열의 직업 SVG 표시. 제목에서 두 행동 버튼을 분리하고 시뮬레이터를 강조한다.
- 메인 분류명·검색·글쓰기 표기에서 중복된 지식 표현을 제거했다. 생활은 ERGON과 동일한 생활 마크.svg, 악보는 악기 마크.svg, 패션은 패션 마크.svg를 CSS mask로 표시한다. 계열/직업에는 기존 ClassIcon을 사용하고 전체보기/기타 문양은 유지한다.
- 시뮬레이터는 제목 아래의 테마 accent 테두리·아이콘·배경 강조 링크로 분리했다. 준비 중 표시는 유지한다. 글쓰기는 목록 도구 영역으로 이동했다. 클래스 계열은 모바일2열, md이상3열이며 선택된 계열의 클래스 버튼을 아래에 표시한다. 생활 세부 분류도 바로 표시한다.
- 신규 components/gnosis/GnosisMark.tsx, lib/gnosisCategories.ts, tests/gnosis-categories.test.mjs. 기존 데이터의 악보 지식/기타 지식/패션 지식 등은 수정하지 않고 새 표시명과 필터로 연결한다. 이전 item_data가 있는 글은 기존 분류를 유지하면서 패션에서도 찾을 수 있다.
- app/gnosis/write/page.tsx는 패션 작성 분류 추가, 표시명/분류 SVG/글쓰기 제목만 보완했다. 기존 저장 키·글 형식·AI 처리 경로·작성자 시제품 동작은 유지한다. 작성창 AI 실패 시 예시 주입은 기존 제한으로 남아 있다.
- public/svgs/UI mark의 생활/악기 파일을 원본 IRIS 작업 폴더에서 전용 worktree로 복사했다. 패션도 원본과 일치하며 기존 추적본과 차이 없다. 세 파일 모두 원본과 SHA-256 일치, 원본 수정 없음. 집 병합 때 동일 경로 추가가 있으면 내용 일치를 확인하고 이름을 바꾸지 않는다.
- 검증: 분류 호환성 테스트4건 RED→GREEN, 전체Node459 중456 PASS/기존3skip/0fail. 독립 TypeScript exit0. 메인·GnosisMark·분류 도우미 ESLint exit0. 작성 페이지는 HEAD 기준과 동일한 기존 오류3/경고1(no-explicit-any/no-unused-vars/immutability)이며 새 오류 추가 없음.
- 브라우저320/390/768/1280px에서 계열6개 직접 노출/직업3개SVG/가로 넘침·버튼 잘림0/제목 내부 행동 링크0/구 드롭다운0 확인. SVG mask 경로, 계열/개별 직업 필터, 글쓰기의 패션/악보/기타 표시 확인. 실제 글 게시·운영데이터 쓰기·DB/RLS·게임행동·push·배포0.

## 2026-10-19 최신: 간결한 계열 메뉴·전투·분류 편집 미리보기

- 앞선 큰 계열 그리드/하단 직업 패널은 사용자 피드백으로 대체했다. GnosisClassFilter는 SVG+전사/마법사/궁수/힐러/음유시인/도적의 작은 행을 표시하고 선택 계열의 직업을 포털 드롭다운으로 표시한다. 바깥 pointerdown/Escape/화면 이동으로 닫고 Escape/선택 후 트리거 초점 복귀, 위아래/Home/End 키 탐색을 지원한다.
- 최종 기본 순서: 전체/클래스/전투/생활/패션/악보/기타. 전투는 기존 public/svgs/status mark/전투력 마크.svg를 사용한다. 글쓰기에도 전투를 추가했다. 공략 글쓰기는 목록 상단의 채워진 accent 버튼으로 강조했다.
- 한설이 분류 이름/순서/아이콘 관리도 요청했다. 신규 lib/gnosisNavigation.ts는 고정 분류 키와 편집 표시명을 분리한다. 이름을 바꿔도 기존 글/레거시 분류는 다시 저장하지 않는다. 7개 고유 키/1~12자 고유 이름/내장 SVG 아이콘만 검증하며 외부 URL/누락/중복/추가 필드는 거부한다.
- hooks/useGnosisNavigation.ts: version1 브라우저 설정 sanctum:gnosis:navigation-preview:v1만 저장한다. 같은 탭 및 다른 열린 탭을 storage 이벤트로 동기화한다. 손상 설정은 보존하고 기본값 및 복구 안내를 표시한다. 글 데이터와 서버 쓰기를 하지 않는다.
- GnosisNavigationEditor를 기존 관리자 그노시스 탭에 추가했다. 이름 입력/내장 아이콘 선택/위아래 순서 변경/미리보기/기본값 복원을 제공한다. 화면에 현재 브라우저 전용이며 길드 전체에 적용되지 않는다고 명시했다. admin?tab=gnosis는 기존 권한 검사를 유지하며 해당 탭으로 진입한다.
- 개발 전용 /gnosis/admin-preview는 같은 편집기만 보여준다. NODE_ENV가 development가 아니면 notFound()로 차단한다. 운영 관리자 API/글/인증 우회는 포함하지 않는다. 실제 관리자 로그인은 이 분리 환경에 서버키/세션이 없어 미검증이다.
- 공유 저장/권한/서버 설정 API/DB 마이그레이션은 미구현이다. 집 작업을 받은 뒤 실제 스키마와 권한을 확인하고 별도 승인받아 연결해야 한다. 기존 관리자 글 고정/삭제 기능은 그대로이며 새 글 분류 변경 서버 기능을 구현했다고 해석하지 않는다.
- 검증: 분류/설정8건 PASS, 전체Node463 중460PASS/기존3skip/0fail. 독립 TypeScript --incremental false PASS, 메인/신규 편집기/훅/도우미 ESLint PASS. 작성창은 기존3error/1warning 유지. 본문 popup에 Escape/터치바깥닫기/aria-expanded 및 화면 높이 제한을 보완했다.
- 실브라우저: 편집기 이름/순서/아이콘을 변경→저장→다른 게시판 탭 반영→작성창 전투 선택 확인, 기본값 복원 완료. 게시판과 편집기320/390/768/1280px 가로넘침0/조작 잘림0. 편집기 PC18/20/22px 확인 후20px 복원. 클래스 Escape/바깥클릭 닫기와 메뉴 화면 내 위치 확인. 실제 글 작성/운영 DB 변경/push/배포는 실행하지 않았다.
- 병합 대상 추가: app/admin/page.tsx, app/admin/components/GnosisAdminTab.tsx, app/gnosis/admin-preview, components/gnosis/*, hooks/useGnosisNavigation.ts, lib/gnosisNavigation.ts, tests/gnosis-navigation.test.mjs, docs/DECISIONS.md. 기존 원본 IRIS 작업과 개인 파일은 수정하지 않는다.

## 2026-10-19 후속: 전투 하위 분류와 헤더 컴팩트화

- 한설의 이미지 피드백 반영: 상위 클래스 아이콘은 기존 UI mark/장비 마크.svg(검/방패)로 교체했다. 각 계열/직업의 ClassIcon은 유지한다. 관리자 아이콘 선택의 클래스도 같은 장비 문양을 사용한다.
- 전투는 생활과 같은 하위 필터 행으로 전투 전체/레이드 공략/어비스 공략/기타 전투 공략을 제공한다. GNOSIS_COMBAT_CATEGORIES를 목록 필터와 작성창에서 공유한다. 예전 전투/전투 지식은 전투 전체에 남기며 임의로 세부 분류하지 않는다. 작성창에서 세부 분류를 선택할 수 있다.
- 별도 큰 시뮬레이터 배너/설명/진행표시/개발안내 줄을 제거했다. 스텔라그램 SVG+패션 시뮬레이터 링크만 기존 제목 오른쪽에 accent의 작은 버튼으로 옮겼다. 좁은 화면은 같은 헤더 안에서 줄바꿈한다. 공략 글쓰기 강조 버튼은 유지한다.
- 그노시스 본문의 개발 중/준비 중 배지를 제거했다. 드레스룸 내부는 실제 미구현 상태를 '의상 입어보기와 염색 기능은 아직 연결되지 않았어요'로 설명한다. 전역 다른 페이지/메뉴의 운영 안내는 수정하지 않았다.
- 검증: 전투 세부 분류 포괄·클래스/생활 혼합 방지 테스트 RED→GREEN. 분류/설정9건 PASS, TypeScript PASS, 메인/드레스룸/Mark/도우미 ESLint PASS, diff check PASS. 작성창의 기존 lint3error/1warning은 이전 기록과 동일하며 이번 완료 판정에 포함하지 않는다.
- 실브라우저320/390/768/1280px 가로넘침0, 헤더 버튼 표시/장비 SVG mask/전투4하위탭 확인. 레이드 필터 선택과 작성창 어비스 분류 선택 확인, 실제 글 저장은 하지 않았다. 원본 IRIS/개인파일/운영DB/main/push/배포 변경0.

## 2026-10-19 나이트메어 드릴 분류·SVG 추가

- 사용자 첨부57×60 PNG의 밝은 문양만 추출해 윤곽을 벡터화했다. 신규 public/svgs/contens mark/나이트메어 드릴 마크.svg: viewBox 0 0 57 60, 투명 배경, currentColor, 외부 이미지/폰트/스크립트 없음. SVG path2개로 원본 안쪽 V와 바깥쪽 문양을 보존했다. IRIS 실제 코드·원본 폴더는 수정하지 않았으며 공용 리소스 병합 후 재사용 가능하다.
- GNOSIS_COMBAT_CATEGORIES 순서: 레이드 공략/어비스 공략/나이트메어 드릴 공략/기타 전투 공략. 앞의 전투 전체 필터는 유지한다. 메인 하위 탭/글쓰기 선택/게시물 분류 마크에서 신규 SVG를 CSS mask로 사용한다.
- 검증: 관련 분류·설정9건 PASS, 독립 TypeScript PASS, 메인/Mark/분류 도우미 ESLint PASS, diff check PASS. 실브라우저 나이트메어 드릴 선택/아이콘 표시 및320/390/768/1280px 가로 넘침·버튼 잘림0 확인. 실제 글 저장·운영 DB·원본 IRIS·main·push·배포 변경0.

## 2026-10-19 글쓰기·상세·댓글 업그레이드

- 한설이 그노시스 글쓰기와 댓글/대댓글을 기존 기능을 살리며 케리그마 작성 화면을 참고해 개선하도록 명시 요청했다. 내부 참고: app/kerygma/write/page.tsx 상단 액션/임시저장/제목/본문 도구, KerygmaEditorToolbar. 외부 참고: GitHub 공식 About writing and formatting on GitHub 및 Participating in a discussion, Discourse 공식 New User Tips and Tricks의 작성/답글 흐름. 코드/브랜드/콘텐츠 복사 없음.
- app/gnosis/write/page.tsx: 작은 상단 복귀/임시저장/작성완료, 분야/세부분류 2단계, 제목/서식 도구/작성·미리보기, PC 우측 첨부·표시 설정(모바일 아래 배치). 굵게/기울임/밑줄/취소선/소제목/목록/인용/HTTP 링크/이모지를 실제 본문 선택에 연결했다. 신규 본문은 안전한 제한 서식 소스와 content_format=markdown, 기존 글은 원문 그대로 표시한다. HTML을 삽입 렌더링하지 않는다.
- 임시저장 키 gnosis_writer_draft_v1은 제목/본문/분류/영상/패션/표시옵션 전체를 저장한다. 새로고침 후 불러오기 안내, 저장 실패 안내, 브라우저 이탈 경고, 작성 중복 제출 방어가 있다. 기존 gnosis_mock_db 글/댓글/추가필드를 보존하고 손상된 기록은 덮어쓰지 않는다.
- 유튜브는 정확한 YouTube 호스트/11자 ID를 검사한다. 기존 코디 스크린샷 분석 API 경로는 유지하되 실패 시 가짜 예시 주입을 제거했다. PNG4MB/단일요청/중단/응답형식 검사, 오류 안내와 아이템/등급/염색 색상 수동입력을 제공한다. 분석 버튼은 AI 서비스 전송임을 표시한다. 실제 외부 AI 호출 성공은 미검증/호출0.
- 신규 GnosisCategoryFields/GnosisContent/GnosisComments, lib/gnosisLocal.ts/gnosisClassGroups.ts, gnosis-editor.css. 클래스 목록은 작성창에서 기존 nexus_classes 1회 읽기/기본그룹 대체를 유지하며 관리자 분류 이름/순서/아이콘 미리보기와 연결된다. 메인 목록은 새 서식의 기호를 요약에서 정리한다.
- app/gnosis/[id]/page.tsx: 전역 테마/글자 크기, 게시판/작성 복귀 링크, 작성자/날짜/분류, 미디어 숨김 반영, 스포일러 직접 펼치기, 코디 색상 카드, 읽기실패/글없음 상태. 기존 댓글/다단 답글/추천/60개 이모지 기능을 유지한다. 들여쓰기를 최대2rem으로 제한하고 답글 대상/취소/2,000자/빈 입력 방어/Escape·바깥 이모지 닫기를 추가했다. 저장 실패 시 입력을 지우지 않는다. 다른 탭 변경을 storage 이벤트로 읽고 쓰기 직전 최신 글을 다시 읽는다.
- 검증: 새 저장보존/손상보호/중첩답글/영상URL/서식HTML비실행/게시→댓글→답글→재조회 테스트5건 PASS, 분류설정 포함14건 PASS. 전체Node469 중466PASS/기존3skip/0fail. 최종 타입/작성·상세·모든gnosis컴포넌트·도우미 ESLint PASS. 과거 작성창3error/1warning은 새 작성창에서 해소됐다. diff check PASS.
- 브라우저: 분류→제목/굵게→미리보기→임시저장→새로고침/복원→수동코디→스포일러→로컬작성→펼치기→댓글→답글/이모지→추천→새로고침 유지 확인. 작성/상세320/390/768/1280px 가로넘침0. 테스트 글 [로컬 확인용] 그노시스 작성·댓글 동작(id c5bc72bb-a61c-42d2-a8ce-d6d35259428c)과 댓글2개는 해당 브라우저에만 남겼다. 기존 예시글/개인 작성글은 변경하지 않았다.
- 여전히 브라우저 전용 시제품이며 작성자 한설 고정은 기존 제약이다. 계정별 작성권한/멀티유저 공유/서버 댓글/댓글1회추천/관리자 새 분류 저장은 별도 단계다. 운영 DB·RLS·새 API·의존성·IRIS·원본 개인 파일·main·push·배포 변경0. 집 변경을 먼저 받은 뒤 실제 스키마/권한과 함께 연결한다.
- 최종 시각 점검: 작성 화면 PC18/20/22px에서 가로넘침0, 사용자 설정은 기존 AUREUM/20px로 복원했다. 실제 밝은 테마 적용은 이번 확인에서 확정하지 않았으므로 밝은 테마 실검증 완료로 해석하지 않는다. 임시 viewport override도 해제했다. 작성 화면과 로컬 댓글 확인용 탭을 사용자에게 남겼다.

## 2026-10-19 작성·댓글 마무리 검증

- 한설이 이어갈 범위를 글쓰기·댓글 마무리로 명확히 지정했다. 추가 제품 기능/3D/운영 DB 범위를 확장하지 않았다.
- npm run build exit0,60/60 정적 페이지 생성 완료. 프로젝트 설정은 ignoreBuildErrors=true이므로 이 결과와 별도로 npx tsc --noEmit --incremental false exit0도 확인했다.
- 임시127.0.0.1:3101 production 서버에서 /gnosis200, /gnosis/write200, /gnosis/admin-preview404 확인. 개발 전용 편집 미리보기의 production 차단을 실제 빌드 결과로 확인했다. 검증 서버는 종료하며 기존3100 개발 서버는 유지한다.
- 첫 일반 sandbox HTTP 조회는 소켓 권한 차단으로 실패했고, 권한 있는 로컬 read-only 조회로 재확인한 결과만 위 상태에 반영했다. 브랜치 push/main 병합/Vercel 배포/운영 DB 변경0.

## 2026-10-19 케리그마 작성 도구 이식 후속

- 사용자 피드백: 간소한 서식 도구가 미완성처럼 보이며 케리그마 작성 도구를 거의 그대로 옮기길 요청했다. 이전 제한 서식 입력 방식 대신 contentEditable 편집기를 도입하고 기존 KerygmaEditorToolbar 자체를 재사용했다. 케리그마 원본 파일은 수정하지 않았다.
- 도구: B/i/U/S, 좌/중/우/양쪽 정렬, 숫자·알파벳·기호 각3단계 헤더, 12~32 크기(rem 저장), 1.1~2.1 줄간격, 최대10×10 표, 기존 특수문자 팔레트, 투표. 추가 실행취소/다시실행·글머리/번호 목록·들여쓰기/내어쓰기·글자/배경색·HTTP링크/해제·서식지우기·이미지 첨부/붙여넣기/드롭을 연결했다.
- 표 셀 선택 시 행/열 추가·삭제, 오른쪽 셀 병합·분할, 배경색, 표 삭제 도구를 표시한다. 이미지 선택 시 절반/전체폭·삭제, 본문 내부 드래그 이동을 제공한다. 케리그마의 표 드래그 핸들/마우스 자유크기 조절 전체를 복사한 것은 아니다. 이 동작을 구현했다고 과장하지 않는다.
- 이미지 PNG/JPEG/WebP 최대10MB 입력→1600px 이내 WebP 압축, 개별dataURL1.5M·본문4.5M 제한 및 저장 실패 보호. 외부 HTML 붙여넣기/드롭은 텍스트로 제한한다. AI 분석용 스크린샷 경로는 기존 별도 옵션 그대로다.
- 새 lib/gnosisRichText.ts의 허용된 태그·스타일·HTTP링크·래스터data이미지만 JSON AST로 저장한다(content_format=richtext,rich_content). 렌더는 정규화 후 React 요소로 구성하고 이벤트속성/스크립트/iframe/SVGdata/위치CSS를 허용하지 않는다. legacy plain/markdown 글은 기존 렌더 유지, 임시저장은 같은 키의 선택적 richDoc/poll 필드로 확장했다. 기존 기록을 일괄 변환하지 않았다.
- 새 GnosisRichEditor/GnosisRichContent/GnosisPoll. 투표는 주제/2~10항목/복수선택/익명표기/마감 설정과 글 첨부, 로컬 상세 참여·결과·브라우저1회 방어를 연결한다. 계정 전체 공유 투표나 실제 익명성/공개 투표자 조회를 운영 서버에서 보장하는 기능은 아니다.
- UI 검증: 실제 굵게/가운데 정렬/24크기/숫자헤더→2×2표 생성→셀병합·분할·행추가→투표 첨부→사용자 첨부 PNG 삽입→임시저장/새로고침/복원→로컬 작성완료→상세서식·이미지·표 유지→투표참여/재조회 결과1표 유지 확인. 작성320/390/768/1280px 가로넘침0,320px 특수문자 패널 화면안/Escape 닫기 확인. 이미지 파일 선택 도구1회가82초 걸렸으나 이후 삽입 성공을 확인했다.
- 로컬 확인글 [로컬 확인용] 케리그마 도구 이식 id95b35fb1-3b30-455a-8b14-37801b48223b를 브라우저에 남겼다. 기존 확인글/댓글은 보존했다. 새 툴바 캡처 gnosis-kerygma-rich-toolbar.jpg는 채팅 아티팩트로만 보관한다.
- 검증: 타입/변경컴포넌트lint PASS, 새 AST 보존·위험속성 차단2건 PASS, 전체Node471중468PASS/기존3skip/0fail. npm run build exit0(60/60), 프로젝트 ignoreBuildErrors 설정과 별개로 독립tsc PASS. 최종 CSS 양쪽정렬 글자 세로쌓임 방어. DB/API/새의존성/IRIS/main/push/배포 변경0.

## 2026-10-19 링크 오류·케리그마 일관성·이미지 초경량화

- 사용자 prompt() is not supported 제보를 직접 수신. GnosisRichEditor 링크 prompt를 native dialog 기반 화면 내 입력으로 교체했다. URL/표시글자 입력, 선택 Range 유지, HTTP(S) 검증, 오류 시 입력 유지, 취소/Escape/배경 닫기/초점 및 배경 스크롤 보호. 작성 취소의 confirm도 화면 내 확인창으로 대체했다. gnosis 경로의 prompt/confirm/alert 호출 검색0.
- 기본 케리그마 툴바 유지. 기존 항상 노출하던 많은 추가 도구는 details 추가 도구 기본 접힘으로 정리했다. 상단 그노시스 게시글 작성/임시저장/취소/작성완료 구성. 기존 데이터/댓글/원본 케리그마 파일은 보존한다.
- lib/gnosisImage.ts:10MB 이하 PNG/JPEG/WebP 입력,1000×1600 이내/확대없음, WebP .7부터 품질+해상도 최대9회 축소, 최종200KB 이하만 첨부. 처리 중 재입력/작성완료 방어, unmount 후 편집기 밖 실행 방지. 첨부 전후 KB/해상도를 UI에 표시한다. 실제 사용자 첨부 PNG105305B(103KB)→약15KB(약85% 감소),1000×523 확인.
- lib/gnosisPoll.ts: 주제/서로 다른 항목2~10/고유ID/유효 미래마감/수치 검증, 로컬투표 외부ID·중복·단일선택 복수입력·마감·재참여 차단. 투표 창 닫기/재진입 시 미첨부 입력이 초기화되던 문제를 수정했다. 정상첨부/중복오류/재진입 유지 UI 확인. 이미 선택한 항목은 결과에서도 체크 표시한다. 여전히 브라우저 로컬 투표이며 계정 전체 보장은 아니다.
- 표는 분리된 셀/테이블 참조 방어, 행·열 최대20 제한과 이미지가 표 안에 있어도 이미지 편집을 우선한다. 실제2×2 생성→행/열추가→병합/나누기 후3×3 일관성 및 오류0 확인.
- 새 안전 테스트3건 RED→GREEN, 관련10건PASS, 전체Node474중471PASS/기존3skip/0fail. 변경파일 타입/린트PASS, 로컬build 결과는 마감 후속 확인. 운영DB/main/push/배포 변경0. 테스트는 별도 확인 탭에서 수행하며 이번에는 실제 글·댓글을 저장하지 않았다.
- 마감 검증: npm run build exit0/60페이지 생성, ignoreBuildErrors 설정과 별도로 독립 TypeScript exit0. 수정파일 ESLint exit0, diff check PASS. 실제 대상 탭 기준320/390/768/1280px 가로넘침0/추가도구 기본접힘 확인. 링크·표·투표·압축 QA 내용은 저장하지 않고 취소했다. 사용자 제공 화면의 (1) 제목/6자 배치를 작성 탭에 복원했다. 기본 도구 정리 캡처 gnosis-toolbar-simplified.jpg 보관, 임시 viewport 해제. 운영 DB·push·배포0.

## 2026-10-19 17:10 KST — 저장·공유 구현과 집 통합 준비

- 최신 상태는 docs/GNOSIS_HOME_MERGE_20261019.md 참조. 앞부분의 미커밋/push0·준비페이지·writer 코디옵션 유지 문구는 당시 경과다. 한설이 이번 구현·별도 브랜치 push를 명시 승인했다.
- 일반 writer에서 코디·염색 입력/AI추출패널 제거, 기존 item_data/legacy초안 읽기는 보존. 시뮬레이터에 코디명/등급/염색파트·스크린샷 편집, localStorage개인저장10개/같은ID갱신/손상기록덮어쓰기방지. AI 분석 API 수정·호출0.
- 공유 dialog: canvas로사진+팔레트PNG→실제ClipboardItem image/png, 별도이미지파일저장, 그노시스패션작성. raw사진은200KB이하WebP로압축저장. 글쓰기 전달은fashion분류/사진/색상+기존초안본문·서식·투표 유지, 시뮬레이터수정왕복시먼저초안보관.
- 실제IAB 사용자첨부스크린샷103KB→15KB, PNGclipboard base64크기263088확인. 로컬확인글ce7dca4a-a921-4ba1-8309-0c4e2950c0dc에서사진·색상·본문확인. 개인저장1건·확인글1건은브라우저한정/운영DB0, 기존다른글보존.
- 리뷰요청스킬에따른읽기전용별도검토: Critical0/중요2. 압축중old look덮어쓰기는함수형최신state이미지합치기로수정, 미저장뒤로가기는native자체dialog로수정. UI에서등급입력→뒤로가기→계속편집→에픽보존/개인저장확인. 다른전역헤더이동/강제종료의모든초안보존은보장하지않음.
- 실제3D착용/의상염색렌더러·의상검색/mesh·계정동기화/운영설정저장은미완료. 프로젝트3D자산0, 외부403우회/모델복제0. 주간잔여33%·5시간45%에서부족한3D자산을가짜기능으로대체하지않고검증·인계를우선한다. 15%는중단상한이며의도적소진목표가아니다.
- 원격집4234e54의인계/릴레이를읽고최신TO_SOONWOL에ACK했다. IRIS미해결I2/M1은인지한것이며제품수정/새native실행/게임행동0. 집제품코드를이브랜치에병합하지않았다.
- 구조: lib/gnosisFashion.ts, lib/gnosisFashionCapture.ts, app/gnosis/dressroom/page.tsx 및dressroom.css, writer수정, tests/gnosis-fashion.test.mjs. 신규저장키gnosis_fashion_library_v1 / gnosis_fashion_work_v1 / gnosis_fashion_transfer_v1, 기존gnosis_writer_draft_v1은확장호환.
- 코드검증477중474PASS3skip0fail/독립tsc·GNOSISlint·Next60페이지buildPASS. 관리자2파일기존lint4오류HEAD와동일. 리뷰보완후최종검증과push결과는다음마감에기록한다.
### 2026-10-19 17:15 KST 최종 검증
검토 보완 후 독립 tsc·GNOSIS scoped ESLint exit0, Next60/60 build exit0. 전체 Node477/474PASS3기존skip0fail, git diff --cached --check PASS. 실제 IAB에서 미저장 이동확인/계속편집 입력유지/개인저장 후 새로고침 복원을 확인했다. 관리자 기존4lint오류는 별도보류. 이 상태를 codex/gnosis-dressroom에 정상 push하며 main/운영DB/수동배포/공지/ZIP는 유지한다. 제품3D는미완료이며로컬사진/팔레트공유만구현됐다.