# 🏛️ SANCTUM Master Guide

검증 — 2026-10-05 18:18 KST: 웹 커밋 후보만 별도 폴더로 추출해 node --test 58/58, 별도 TypeScript, 관련 ESLint, 기본 Turbopack Production 빌드(static48), staged diff 검사를 통과했다. 자정 방식으로 되돌린 회귀3건은 모두 실패, 수정 복원 후3/3 통과. 더보기 합성 화면의 밝은/어두운 캡처 및 6테마 배경 계산 확인. 임시 의존성 junction의 첫 빌드 실패는 실제 파일 복사 후 해소했다. 실제 최신 정상 롤백 배포는 a8f7d78 / dpl_89vTuY8joQuZ1jJBsxHnDurb789s(READY/production)다. 운영 로그인 조작/실제06시 경계·공지 게시는 이 검증에 포함되지 않는다.

## 2026-10-05 v2.151 크로노스 웹 핫픽스

- lib/kronos.ts getKronosResetDay는 기존 KST06 일간 기간 시작에서 날짜 key와 weekday를 파생한다. app/character/page.tsx 검은 구멍 최대 횟수와 초기화 안내가 사용한다.
- 검은 구멍은 월06시8·화9·수10·목11·금12·토13·일14, 다음 월05:59까지14다. 저장된 완료 기록은 수정하지 않는다.
- app/globals.css 더보기 디바이더의 배경 마스크는 --panel을 따른다. 공개 버전 lib/release.ts v2.151.
- API/DB/RLS/권한 구조 변경 없음. 배포 및 실제 운영 확인 결과는 RELEASE_NOTES/HANDOFF 후속 기록을 따른다.

## 2026-10-02 v2.15 공식 배포 범위

- 최종 결과: 코드 1b1b401의 Production/Ready와 로그인된 운영 화면·등록 레이드 난이도를 확인하고, 기존 작성 UI/서버 권한 경로로 업데이트 공지 ID 13(SANCTUM 시스템)을 1회 게시했다. `docs/UPDATE_POST_v2.15.md`는 게시본 보관이다. 후속 결과 문서 push는 구조 변경 없음. 실제 회차/저장 검증 및 과거 기록 복구는 별도 남은 과제다.

- 21:46 KST Vercel 대시보드에서 코드 배포 `CrGH4wg7wJeAfadsg5UJUnLiMFeR`의 Production/Ready/운영 도메인 확인을 완료했다. 공지 게시에는 별도 생텀 길드마스터 서버 세션이 필요하다.

- 코드 `1b1b401`의 Vercel 성공 배포와 운영 HTML v2.15를 확인했다. 공지 초안은 `docs/UPDATE_POST_v2.15.md`이며 세션 만료 후 한설의 운영 재로그인을 기다린다. 이 문서 초안만으로 게시된 것으로 간주하지 않는다. 후속 배포 확인 문서 변경에는 구조 변경이 없다.

- 한설의 공식 push/공지 게시 요청에 따라 아래 10월 1~2일 로컬 시낙시스·크로노스 변경을 v2.15에 통합한다. `lib/release.ts`가 화면 버전 기준이다. 구조는 아래 공통 카탈로그/액션/체크 병합/카드 이름 측정 항목을 따른다. 신규 DB 객체·RLS·SQL 변경은 없다.
- 공지는 기존 `/kerygma/write`→`/api/notices/mutate`의 길드마스터 권한 경로로 게시하며 새 `생텀 업데이트`의 서버 작성자는 `SANCTUM 시스템`이다. 배포 성공 및 운영 화면 확인 뒤 제목별 중복 방어를 사용한다. 실제 결과는 RELEASE_NOTES/HANDOFF에 기록한다. IRIS 내부 시제품은 이번 공개 노트 범위 밖이다.

## 2026-10-02 길드버스 카드·목록 헤더 반응형 — 로컬 수정, 미배포

- 공통 `GuildBusCard`의 본문만 `GuildBusCard.module.css`의 `guild-bus-card` 크기 쿼리 컨테이너가 된다. 실제 카드 폭에 따라 출전자 1/2/4열(20rem/39rem)을 적용한다. 출전자 칸은 클래스/역할/전체 전투력 윗줄과 이름 아랫줄의 2줄이다. `ResponsiveMemberName.tsx`가 실제 전체 이름 폭을 관찰해 들어갈 때 전체 닉네임, 부족하면 저장 애칭 최대 3자 또는 이름 앞 3자를 선택한다. 한설의 후속 승인으로 항상 전체 이름을 줄바꿈하던 이전 동작을 대체한다. 컨트롤러 버튼 전체 줄바꿈, 본인 캐릭터 칩 래핑은 유지한다. 화면 전체 폭으로 중첩 홈 카드를 4열로 강제하지 않는다. fixed 인계/참가 모달은 쿼리 컨테이너 밖에 유지한다.
- `PartyFilterHeader.module.css`가 제목·탭 래핑 및 실제 헤더 폭 기준 검색/필터 행 전환(42rem)을 담당한다. 테마 변수·전역 rem 글자 크기와 기존 콜백을 유지한다. API/DB/권한 구조 변경 없음. 내부 합성 브라우저 검증 도구는 `tests/party-layout-preview.mjs`, 기록은 BETA-061/HANDOFF를 따른다.
- 저장 애칭은 버스 참가 JSON이 아닌 캐릭터 프로필이 기준이다. 홈 `allCharactersList`→`SynaxisPartySection.characterProfiles`와 `/party`의 기존 `allCharactersMap`→`GuildBusCard.characterProfiles`→이름 위젯으로 전달해 두 화면이 같은 현재 애칭을 사용한다. 추가 DB 요청이나 참가 JSON 보정은 없다.

## 2026-10-01 길드버스/크로노스 공통 경로 — 로컬 수정, 미배포

- 홈 `SynaxisPartySection`과 `/party`는 동일 `PartyCard`/`GuildBusCard` 및 필수 `PartyCatalog`를 사용한다. `hooks/usePartyCatalog.ts`가 `nexus_classes`, `nexus_contents`, `content_power_reqs`를 병렬 조회하고 60초 캐시·탭 활성/주기 갱신·중복 요청 방어를 제공한다. 역할은 현재 클래스 설정이 과거 저장 역할보다 우선하며 서포터는 음유시인 전용이다.
- `/party`→`PartyModals`→`ContentSelectModal` 및 `BusCreateModal`의 내부 선택 모달도 같은 필수 카탈로그를 사용한다. `lib/partyContentCatalog.ts`는 기존 `CONTENT_DB`의 ID/이름을 유지하되 선택 가능한 난이도는 DB의 종류+콘텐츠명으로만 구성하며 어비스 다중은 공통 난이도만 허용한다. 난이도별 정격 인원 및 레거시 지옥 공백 조회를 호환한다. 로딩/오류/미등록 시 적용·신청/개설을 방어하며 현재 유효 콘텐츠/난이도를 적용 콜백으로 전달한다. DB 객체·기존 파티 일괄 변경 없음.
- `lib/guildBusPolicy.ts`의 버스 판별·시간 eligibility·운행자 판정을 공통 사용한다. `GuildBusCard`→`lib/guildBusActions.ts`→`/api/member-mutations`의 `_busMemberAction`으로 반복/선택 탈퇴/대기 순서 재구성을 처리한다. 서버는 본인 소유 캐릭터와 현재 운행자 권한을 확인하고 최신 `members` JSON을 조건 비교해 저장한다. 탑승은 모달에 전달된 파티 ID로 최신 행을 읽는다.
- `lib/busUtils.ts`는 콘텐츠 접두사 정규화 후 난이도별 기준을 조회한다. 계정별 후보를 함께 평가하여 4인 각 전투력 등급 1~2명, 8인 압도 3명·권장 2~3명·그 외 2~3명 목표를 적용한다. 부족한 등급은 가능한 후보로 충원하고 중복 계정은 제외한다. `parties.members[].selection_order`는 재구성/회차 이후 우선순위를 보존하는 앱 JSON 메타데이터다.
- `/api/parties/sync-checklist`의 `finishRound`가 실제 출전자 숙제를 콘텐츠 ID로 추가하고 그 멤버만 완료 처리/순서 갱신한다. 길드버스는 현재 운행자 전용이다. 여러 행은 단일 트랜잭션이 아니며 일부 저장 실패를 사용자에게 반환한다. 일반 파티도 동기화 실패를 무시하고 종료하지 않는다.
- `lib/matchingUtils.ts`가 구형 체크 JSON 읽기·완료/해제·기준값 대비 병합을 공유한다. 홈 `_checklistAction`은 해당 항목만, 크로노스 `_checklistBase`는 로드 이후 직접 수정한 항목만 최신 서버 상태에 반영한다. 크로노스 저장 요청은 직렬 처리한다. 새 DB 객체·RLS·운영 SQL 변경 없음. 과거 실제 손실 복구는 별도 승인/백업 과제다.
- 검증/남은 실제 화면 확인은 `docs/HANDOFF.md` 2026-10-01 항목을 따른다. 이번 작업은 한설 지시로 다음 릴리스에 노트를 통합하며 버전·공개 공지는 변경하지 않는다.
- 일반 자동 매칭의 난이도 비교도 `normalizeDifficulty`를 사용해 기존 `지옥 1`과 DB 표준 `지옥1` 신청이 같은 파티 후보에 포함되도록 한다. 기존 파티 저장값을 일괄 수정하지 않는다.

`527c134` main push 후 운영 공개 경로와 비로그인 IRIS API 차단을 1차 확인했다. 이어지는 운영 확인 문서 push에는 구조·DB·권한 변경이 없다.

## 2026-09-28 PC 동반 프로그램 시제품 — 로컬·운영 미배포

- 공식 명칭은 `Sanctum IRIS`, 프로젝트명은 `프로젝트_IRIS`다. 목표·확인된 사실·미확인 과제·단계별 완료 기준은 `docs/PROJECT_IRIS.md`를 따른다. 엠포리온·그노시스 융합은 장기 검토이며 기존 구조는 유지한다.
- `app/companion-preview/page.tsx`는 개발 환경에서만 `/companion-preview`를 열고 운영 빌드에서는 404로 응답한다. `CompanionPreview.tsx`·`preview.module.css`는 게임 위 오버레이 형태, 크로노스 일일·주간 체크, 내 캐릭터 스탯 변경분 확인, 시낙시스 파티 요약·기존 `/party` 진입을 샘플 데이터로 시연한다. 실제 게임·AI 커넥터·운영 DB와 연결하지 않으며 자동 게임 명령도 실행하지 않는다.
- 실연동 후보는 게임에서 허용된 본인 데이터만 로컬에서 확인한 뒤 변경된 값만 계정·캐릭터에 연결해 전송하는 방향이다. 시낙시스 실제 신청은 기존 웹 로그인·권한 경로를 재사용하며 샘플 오버레이에서는 신청을 수행하지 않는다. 운영용 PC 프로그램, 인증, 데이터 저장 구조, 게임 초상화 취득은 아직 설계·승인 전이다.
- 넥슨 AI 커넥터 안내는 내 능력치·미션 조회를 명시하지만 초상화 이미지 제공은 확인되지 않았다. 설치된 AI(아님)커넥터 스크립트에서도 초상화 요청·이미지 필드를 찾지 못했다. 모비라이프의 초상화 표시 방식은 확인되지 않았으므로 동일 경로로 수집 가능하다고 가정하지 않는다.

## 2026-09-28 케리그마 업데이트 글 편집 권한 — 로컬 구현, 운영 미배포

- `app/kerygma/write/page.tsx`와 `/api/notices/mutate`는 부마스터에게 기존 `생텀 업데이트`의 수정만 허용한다. 새 업데이트 발행·일반 글에서 업데이트로 변경·업데이트의 다른 카테고리 변경은 길드마스터 전용으로 유지한다. `생텀 공지사항`도 길드마스터만 저장한다.
- 서버는 기존 공지 카테고리를 조회해 권한을 판정하고 기존 작성자·반응 수는 수정 시 보존한다. DB 스키마·RLS·운영 공지 데이터 변경 없음. 운영 배포와 부마스터 계정 실검증은 남아 있다.

## 2026-09-29 IRIS 로컬 읽기 시제품 (`v2.14` 유지, 비공개 경로)

- 크로노스 `CharacterSelector`의 캐릭터 버튼 목록을 `OwnedCharacterPicker`로 분리했다. 모바일에서 닉네임 3글자 절단을 없애고 전체 이름이 읽히도록 했다. 기존 캐릭터 전환·관리 동작은 그대로다.
- 생텀 `/iris`는 비공개 메뉴 경로의 클라이언트 미리보기다. `/api/iris/characters`는 서버 세션의 승인 계정과 `characters.owner`를 확인해 본인 캐릭터만 읽고, 구형 대표 캐릭터 중 owner가 없는 자기 닉네임 행만 보완한다. 사용자가 캐릭터를 직접 선택·확인하며 새로고침 시 초기화한다.
- 로컬 `iris/server.mjs`는 127.0.0.1:4317 전용이고 허용 Origin·30분 토큰을 만족하는 브라우저에만 `/api/bridge/snapshot` 읽기를 허용한다. 로컬 승인 페이지에서 토큰을 URL fragment로 전달하고 생텀 화면에서 즉시 주소에서 지운다. 승인 후 15초마다 읽으며 연결 해제로 토큰을 폐기한다. 개발 Origin만 허용하므로 운영 사이트에서 이 브리지는 연결되지 않는다.
- `iris/reader.mjs`의 읽기 허용 명령·정규화 계약은 `iris/DATA_CONTRACT.md`, 지원 여부는 `iris/CAPABILITY_AUDIT.md` 참조. 게임 닉네임/초상화·장착 룬·랭킹·길드 공헌도·나이트메어 드릴 층·크로노스 항목별 완료는 확인된 읽기 API에 없다. 어비스·레이드·필드보스는 주간 목표 횟수만 보인다. 게임 자동 조작, SANCTUM DB 쓰기/스키마/권한 변경, 서버 전송, 영구 페어링은 없다.
- `iris/overlay.ps1`은 Windows PowerShell의 작은 항상 위 창으로 로컬 `/api/snapshot`을 5초 간격으로 읽는다. 한설의 일반 PC 환경에서 실제 수치 표시를 확인했다. 게임 전체 화면 위 표시, 설치형 배포, 자동 시작은 아직 검증·구현하지 않았다.

## 2026-09-28 v2.14 크로노스 카드·교환 기간

- `components/character/ProgressiveGrid.tsx`는 기존 즐겨찾기 우선 목록을 반응형 열 수에 따라 첫 3줄, 버튼마다 추가 3줄씩 보인다. `public/svgs/logo/더보기.svg`를 `app/globals.css`의 테마색 마스크·어두운 글자 음영과 함께 카드 경계에 겹친 얇은 디바이더로 사용한다.
- `TradeList`와 `KronosWorkspace`의 물물교환·상점·임무 카드는 왼쪽 강조선, 제목/내용/하단 횟수 조작 영역, 한도 도달 시 초록 테두리·수량 표시를 공유한다. 물물교환도 MAX/MIN을 제공하며 긴 이름은 버튼과 겹치지 않도록 감싼다.
- `app/character/page.tsx`의 교환 횟수는 `lib/kronos.ts`의 한국 시간 06시 일간·주간 시작값과 각 품목의 `period_version: 2`/`period_start`를 비교한다. 구형 기록은 현재 완료로 보지 않되 JSON 원본은 보존한다. 실제 수정한 품목만 기간을 갱신하고 계정당 교환의 기간·횟수·완료자를 함께 동기화한다. DB 테이블·RLS·API 변경 없음.
- `be5d1c2` 운영 제공 확인 뒤 추가한 검증 기록 문서 push에는 구조 변경 없음. 공개 경로와 SVG 제공은 확인했지만 로그인 후 카드 실조작·기간 경계는 후속 확인 사항이다.

## 2026-09-28 v2.13 공지·헤더·크로노스 목록

- `KerygmaReaderView`의 운영진용 `읽은 길드원 목록`은 기존 브라우저별 `sanctum_notice_readers_*` 값 대신 `/api/notices/reads`를 사용하도록 변경했다. 서버는 로그인 세션의 계정 ID로 공지당 최초 읽음 1건만 기록하고, 목록은 길드마스터·부마스터에게만 제공한다. `supabase/migrations/20260928_notice_reads.sql`의 비공개 `notice_reads` 테이블은 한설이 운영 적용했고 RLS·역할별 권한을 읽기 전용으로 검증했다. 적용 전 기기별 읽음 기록은 신뢰할 수 없어 합치지 않는다. 알림함 자체의 읽지 않음 상태는 기존 기기별 localStorage 그대로다.
- `app/layout.tsx`는 페이지 이동 시 상단 스크롤과 헤더 표시를 복원하고, 배너로 고정 헤더 높이가 늘어날 때 사용자가 상단 근처에 있으면 가려진 조작부가 다시 보이도록 맨 위로 정렬한다. `app/kerygma/page.tsx`는 공지 열기·닫기처럼 같은 경로의 쿼리만 바뀔 때도 상단으로 이동한다. DB 영향 없음.
- `components/character/ProgressiveGrid.tsx`는 물물교환·상점·임무의 기존 즐겨찾기 우선 결과를 반응형 1/2/3열에서 6줄씩 노출한다. 검색어가 바뀌면 첫 6줄로 돌아간다. `app/character/page.tsx`의 중복 필터 안내 문장은 제거했다.
- `components/character/KronosWorkspace.tsx`는 상점의 마을·NPC·품목 안정 정렬과 사포/도면 구매 조건 표시를 추가했다. `supabase/migrations/20260928_kronos_weekly_shop_catalog.sql`의 128개 원본 품목은 한설이 운영에 적용했고 기존 앨빈 사포를 건너뛰어 127개가 추가됐다. 사전 1행·사후 128행, 중복 0, RLS/익명 접근 차단을 읽기 전용으로 확인했다. DB 구조·RLS·API 형태 변경 없음.
- `d9e6fe9` 운영 제공 확인 뒤 추가한 배포 기록 문서 push는 코드·DB·구조 변경 없음. 로그인 후 크로노스 6줄/더보기, 다른 기기의 공지 읽음, 캐릭터 저장은 후속 실검증 항목이다.

## 2026-09-27 v2.11 케리그마 화면·업데이트 게시

- `KerygmaCategoryTabs`: 700px 이상에서는 7개 카테고리를 스크롤 없는 단일 행 그리드로 보여 주고, 중간 폭의 긴 라벨을 짧게 표시한다. 운영진용 작성 버튼은 그 아래 줄로 분리한다. 700px 미만은 기존 카테고리 선택 모달을 유지한다.
- `KerygmaHeader`: 전체 소개가 두 줄을 넘을 수 있는 1280px 미만에서는 `(i)` 안내 버튼과 모달로 전환한다. 바깥 클릭·Escape로 닫힌다.
- `/api/notices/mutate`: 새 `생텀 업데이트`는 길드마스터만 등록하며 작성자는 서버에서 `SANCTUM 시스템`으로 기록한다. 동일 제목의 업데이트 글은 중복 등록하지 않는다. DB 스키마·기존 공지 데이터 변경 없음.
- 운영 확인 후속 문서 push는 구조 변경 없음. v2.11 `41a8fe9`의 화면과 `생텀 업데이트` 글 ID 11·시스템 작성자 표시를 확인했다.

## 2026-09-27 관리자 헤더·전역 알림·시낙시스 카드 로컬 수정

- `components/layout/MobileBottomSheet.tsx`와 `app/globals.css`: 모바일 플로팅 메뉴는 `public/svgs/logo/바텀메뉴버튼.svg`를 전역 `--accent` 색 마스크로 표시하고 중앙 내부는 `--panel`로 채운다. 로고 뒤 단일 후광과 닫힌 상태의 드문 두 박자 하트비트를 사용한다. 누르는 동안 로고·중앙 배경이 같이 축소되고 열린 상태는 약간 작은 로고·강한 후광으로 구별한다. 동작 감소 설정에서는 반복 애니메이션을 중지한다. 접근성 이름과 클릭·드래그는 유지한다.
- `components/character/KronosWorkspace.tsx`: 임무 카드의 안쪽 간격을 줄이고 보상 목록과 횟수 조작을 넓은 카드에서는 나란히, 좁은 카드에서는 줄바꿈 배치한다. 보상명·수량과 임무 설명은 말줄임 없이 표시한다. 데이터 구조 변경 없음.
- `components/character/ClassLevelManager.tsx`: 640px 이상 클래스 카드의 첫 줄에 마크·전체 클래스명·레벨 직접 입력, 둘째 줄에 1~65 범위 게이지를 표시한다. 이 구간의 증감/MAX/MIN 버튼은 제거하고 게이지 드래그·키보드 또는 숫자 입력으로 수정한다. 640px 미만의 기존 모바일 버튼은 유지한다. API·DB 구조 변경 없음.

- `app/admin/page.tsx`: 서버 세션 확인으로 관리자 본문이 늦게 나타날 때 이전 스크롤 복원을 맨 위로 되돌려 고정 메뉴가 제목을 가리지 않게 한다.
- `app/layout.tsx`의 `nexus_banners`는 Realtime 변경 이벤트와 열린 탭 30초 재조회로 새 활성 배너를 반영한다. `BannerAdminTab`은 저장 직후 같은 탭의 전역 헤더 갱신 이벤트를 보낸다. `hooks/useNoticeNotifications.ts`의 `notices` 알림도 Realtime과 30초 재조회로 갱신하며, 공지 외 운영 알림을 재조회 시 보존한다. DB publication·스키마·권한은 변경하지 않았다.
- `components/party/PartyCard.tsx`·`PartyCard.module.css`: 파티원 슬롯의 아이콘·닉네임을 상단에 배치한다. 전투력·마도저항은 큰 상태 아이콘과 전체 숫자만 각각 한 줄로, 신청 시간은 시계 아이콘과 시간만 한 줄로 표시한다. 카드 컨테이너 폭에 따라 슬롯을 1·2·4열로 전환해 좁은 목록 열에서 닉네임이 한 글자씩 꺾이거나 시간이 넘치지 않도록 한다. 보조 문구는 화면 판독기용으로 유지한다. 데이터 구조 변경 없음.
- `PantheonRankingSection`의 홈 Top 3 수치는 단위를 제거하고 닉네임과 다른 행에 놓는다. 긴 카테고리 탭명은 한 줄을 유지하되 화면 폭에 비례한 rem 최소·최대 글자 크기로 축소하고 말줄임을 쓰지 않는다. `useNoticeNotifications`는 판테온 이전/현재 Top 3를 비교해 순위별 변경자를 다음 알림부터 표시한다. 홈 `SynaxisPartySection`의 신청 버튼은 `app/page.tsx`에서 `/party?join=ID`로 이동하고 `app/party/page.tsx`가 해당 파티에 대해 공통 `JoinPartyModal`을 연다. 별도 홈 신청 모달과 저장 함수는 제거했다. DB·권한 구조 변경 없음.
- `lib/pantheonNotifications.ts`는 알림용 Top 3 스냅샷과 변동 설명을 만든다. 테크네는 계정별 최고 생활력 캐릭터, 피에타스는 계정별 메인 캐릭터(없으면 최고 공헌도)를 대표로 점수를 산정하되 알림의 순위 식별자는 캐릭터 닉네임이 아닌 계정 소유자다. 심포니아도 계정 단위로 비교한다. `useNoticeNotifications`는 v3 로컬 스냅샷으로 최초 기준값을 세우며 대표 캐릭터만 바뀌었을 때는 알리지 않는다. DB·권한 구조 변경 없음.

## 2026-09-26 케리그마 가이드 링크 핫픽스

- `app/kerygma/page.tsx`는 목록 복귀와 링크 없는 목록 진입에서 카테고리를 `전체`로 초기화한다.
- `components/kerygma/KerygmaReaderView.tsx`는 `Notice.link`가 유효한 http(s) URL일 때 `생텀 가이드 열기` 링크를 새 탭으로 표시한다. 버전·DB·API 구조 변경 없음.

## 2026-09-25 v2.022 시낙시스 권한 핫픽스

- `hooks/usePartyManager.ts`의 길드 버스 생성 전 역할 판정을 `app/api/member-mutations/route.ts`의 운영진 역할(길드마스터·부마스터·부마스터 대행)과 일치시켰다. 세션 없는 클라이언트의 관리자 기본값도 제거했다. API·DB 구조 변경 없음.

## 2026-09-25 v2.021 로고·버전 정렬

- `components/layout/Navbar.tsx`의 로고 오른쪽에 `SANCTUM`, 길드 플랫폼 설명, `BETA v2.021`을 3줄로 배치한다. 중간 폭은 메뉴 가용 공간을 위해 버전만 축약 표시한다. 버전 값은 `lib/release.ts`에서 관리한다. DB·API 구조 변경 없음.

## 2026-09-25 v2.02 베타 메뉴 안내

- 버전 표시는 홈 본문 대신 모든 비로그인 제외 페이지의 `components/layout/Navbar.tsx` 로고 아래에서 `lib/release.ts` 값을 사용한다.
- `types/layout.ts`의 엠포리온·그노시스 메뉴 항목을 `comingSoon`으로 지정했다. PC `Navbar`와 모바일 `MobileBottomSheet`는 링크 대신 `[준비중]` 비활성 항목을 렌더링한다. `/market`·`/gnosis` 라우트 자체와 직접 주소 접근은 유지한다. DB·API 구조 변경 없음.

## 2026-09-25 v2.01 베타 화면 안내

- 홈 `app/page.tsx`는 `lib/release.ts`의 버전을 `SANCTUM BETA` 배지로 표시한다. 공식 버전이 바뀔 때 표시값도 릴리스 노트와 함께 수동 갱신한다.
- `app/market/page.tsx`와 `app/gnosis/page.tsx`는 개발 중 안내를 표시한다. 엠포리온의 시험용 가격은 실시간 정보가 아니고, 그노시스 예시 자료는 확정 공략이 아니다.
- 길드원 안내 원고는 `docs/BETA_MEMBER_GUIDE_DRAFT.md`; 아직 운영 `생텀 가이드` 게시물로 등록되지 않았다. 기존 링크형 분류·작성자 권한 구조는 그대로다. DB·API 구조 변경 없음.

## 2026-09-25 폐쇄 베타 운영 배포 후보

- **02:05 KST 운영 확인 완료:** 앱 코드 포함 `main` 커밋 `08f0f78` Vercel Ready, 운영 헬스·비로그인 API와 한설의 로그인 후 캐릭터 저장·공지/파티·관리자·로고스 화면 확인 통과. 길드원 대상 최대 40명 폐쇄 베타 초대 가능. 기능 동결 상태에서 P0/P1만 우선 대응한다. 시스템 공지 게시 전이며 아래 배포 후보 문구는 배포 직전 기록이다.

- 한설 승인 아래 v1.994/1.994.1 Preview 검증 코드를 운영 `main`에 fast-forward해 v2.0 폐쇄 베타 후보로 준비한다. 이 문서 아래의 "로컬/미배포" 문구는 작성 당시 기록이며, 이번 운영 push 후 Vercel Ready·실화면 확인 전에는 베타 오픈 완료가 아니다.
- 운영 DB의 가입 프로필, 크로노스 4개 테이블/진행 함수, 로고스 비공개 사진과 `inquiries.retention_review_at`은 이미 한설이 적용·읽기 전용 진단을 확인했다. 이번 push에서 SQL을 재실행하거나 기존 글을 삭제하지 않는다. 현재 앱 구조는 `/login`→서버 세션·프로필 가입, `/admin`→권한/카탈로그, `/character`→크로노스 상점/임무/메모, `/support`→1:1 문의·비공개 제보/건의 및 길드마스터 60일 검토다.
- 운영 확인 순서: Vercel Ready→실제 로그인·캐릭터 저장·공지·파티·운영진 접근/일반 회원 차단·로고스 비공개 조회→릴리스 노트 실결과 기록→길드원 초대. 기존 정상 코드 기준선은 v1.993 `db06f7e`; DB는 이미 확장됐으므로 복구 시 추가 컬럼/함수를 임의 삭제하지 않는다.

## 2026-09-24 가입 프로필·로그인 화면 로컬 보완 (미배포)

- 로컬 로그인 실패는 서버 DB 네트워크 연결 문제로 확인됐고, 서버 재시작 뒤 한설이 한글 코드 직접 입력 로그인을 확인했다. 기존/신규 접속 코드는 한글을 영문 키로 변환하지 않는다.
- `components/common/SecretCodeInput.tsx` 안내 문구의 배경 대비와 `app/login/page.tsx` 자물쇠 위치를 보정했다.
- `app/api/auth/register/route.ts`는 좋아하는 것과 월일 생일을 새 서버 등록 함수에 전달한다. `app/api/admin/accounts/route.ts`와 `AccountApprovalTab.tsx`는 길드마스터 재확인 뒤 길드원 프로필을 조회·수정한다. 목록은 계정별 직책·프로필을 독립 카드로 묶고 길드마스터→부마스터→부마스터 대행→길드원 순으로 표시한다. 부마스터·대행 응답에는 접속 코드의 재료인 두 값이 포함되지 않는다. 기존 계정은 프로필을 직접 등록하지 않았다면 미등록이며 접속 코드는 응답에 포함하지 않는다.
- 추가 SQL: `supabase/migrations/20260924_account_profile_registration.sql` (한설이 운영 Success와 읽기 전용 권한 확인 완료). 공개 생일 배너는 구상 단계이며 이번 변경에 포함하지 않는다.

## 2026-09-24 크로노스 확장 — 로컬 구현, 운영 미배포

- `app/login/page.tsx` → `components/common/SecretCodeInput.tsx`: 한글 IME용 text 입력과 CSS 시각적 마스킹, 보기/숨김, 조합 중 Enter 제출 방어. 코드 내용을 변환하지 않으며 가입 후 로그인칸에 자동 삽입하지 않는다.
- `app/admin/page.tsx` → `TradeAdminTab`: 확인된 `nexus_trades` 실제 컬럼 사용. 별도 상점 탭은 `kronos_shop_items`에 골드 구매 카탈로그 등록. 두 카탈로그 모두 확인창을 거친 삭제와 기존 행 수정 지원. `MissionAdminTab`은 `kronos_missions`에 5개 마을·내용·최대 횟수·보상 1~6개 등록/수정/삭제, 모바일에서 보상과 횟수를 분리해 표시.
- `app/api/admin/catalog/route.ts`: 세션 기반 운영진 GET 카탈로그 읽기 추가; 신규 카탈로그 POST 입력 검증. 미적용 테이블은 준비 오류로 표시한다.
- `app/character/page.tsx`: 6개 다중 선택 탭, 선택 없음=전체, 고정 순서. 기존 `ContentChecklist` 진행률 옆 리마인드 진입점. `CharacterSelector` 관리 버튼은 테마 강조색·10초 주기 짧은 톱니 회전(reduced-motion 제외).
- `components/character/KronosWorkspace.tsx` → `/api/kronos`: 상점 검색·횟수·북마크·MAX/MIN(상한 전량 완료/0으로 복귀), 단가×상한 고정 `총합` 골드 안내, 즉시 화면 반영과 연속 조작 묶음 저장. 임무는 마을 탭 없이 전체 표시·마을 이름 검색, 즐겨찾기 우선과 이멘마하→반호르→콜헨→던바튼→티르코네일 순 정렬, 임무 MAX/MIN 지원. 카드의 `임무`/`보상` 이름 시작선을 맞추고 보상 수량은 품목 바로 뒤에 붙이며, 제목 옆에 현재 캐릭터 배지와 `초기화: 매주 월 06시`를 표시한다. 실제 주간 카운터는 한국 시간 월요일 06시에 새 기간으로 계산한다. 임무 내용/소모는 호박색, 보상은 청록색으로 구분하며 라이트 테마에서는 더 짙은 색을 쓴다. 물물교환·상점·임무의 초기화/범위/마을 배지는 공통 규격, 물품 수량은 `× N` 표기다. ☆/★는 모두 카드 제목 왼쪽에 배치해 횟수 조작과 분리한다. 현재 캐릭터의 메모 읽기. 구매 ID와 물물교환 ID를 섞지 않는다.
- `components/character/ReminderWindows.tsx`: 캐릭터별 2개 메모, 제목·본문·색·글꼴·크기, 이동·크기 조절·활성 창 전면 표시. 위치와 미저장 초안은 계정/캐릭터별 localStorage, 저장 버튼은 서버. 다른 숙제를 함께 조작하는 비모달 창으로 바깥 클릭 시 유지, X/Escape로 닫는다.
- `app/api/kronos/route.ts` → `kronos_shop_items`, `kronos_missions`, `kronos_progress`, `kronos_reminders`: 세션·캐릭터 소유 확인. 진행은 `sanctum_kronos_progress`의 원자적 갱신. `supabase/migrations/20260924_kronos_progress_batch.sql`은 한설이 운영 Success를 보고했고, 함수의 ±9999 증감 허용으로 MAX/연속 클릭을 한 요청에 저장한다. 메모는 슬롯별 갱신/삭제. 공개 DB 직접 읽기·쓰기 없음.
- `lib/kronos.ts`: 카탈로그 타입, 5개 마을/모바일 줄임말, 한국 시간 월요일 06시 주간 기준. 자세한 적용 순서는 `docs/KRONOS_MORNING_CHECKLIST.md`.
- `components/layout/MobileBottomSheet.tsx`: 닫힌 메뉴는 transform뿐 아니라 visibility/inert로 숨긴다.

기존 `nexus_purchases`·`nexus_missions`는 컬럼·제약 미확인으로 보존한다. 운영 SQL 적용과 실제 로그인/개인 기록 저장 확인 후 배포를 결정한다.

> **문서 기준일:** 2026-09-23 (KST)
>
> **문서 성격:** Git push 때마다 실제 구조·운영 규약을 갱신하는 살아있는 기준 문서
>
> **프로젝트:** `seongyeok-guild-manager`
>
> **서비스:** 마비노기 모바일 데이안 서버 「성역」 길드 전용 플랫폼
>
> **운영 책임자:** 한설
>
> **현재 단계:** 폐쇄 베타 출시 준비 — 길드원 최대 40명

---

## 1. 서비스 목적과 출시 원칙

SANCTUM은 성역 길드원이 캐릭터·숙제·파티·공지·길드 운영 정보를 한 곳에서 관리하는 웹 플랫폼이다. 외부 공개 서비스가 아닌 길드 전용 폐쇄형 서비스이며, 베타는 소수의 테스터가 실제 길드 활동에서 사용하며 오류를 찾는 것을 목적으로 한다.

### 베타에 포함하는 기능

- 길드원 가입 신청, 운영진 승인, 역할 표시
- KRONOS 캐릭터·스탯·일일/주간/레이드 체크
- KERYGMA 공지, 투표, 댓글
- AGORA 길드원 현황 및 랭킹
- SYNAXIS 파티 모집, 일정 조율, 길드 버스
- 관리자 컨텐츠·클래스·교환·임무·배너 관리
- 사이트 내부 알림함과 읽지 않음 표시

### 알림 서비스 현황과 확장 명세

**현재 적용됨 — 1차:** KERYGMA `notices`의 새 공지를 사이트 내 알림함·빨간 읽지 않음 수로 표시한다. 사용자가 브라우저 권한을 허용했을 때, **SANCTUM 탭이 열려 있는 동안** 운영체제 브라우저 알림도 표시한다. 읽음 상태는 현재 기기별 `localStorage` 기준이다.

**아직 미적용 — 이후 알림 종류:**

1. KRONOS: 일일/주간 숙제 초기화, 주간 숙제 미완료 임박
2. AGORA: 판테온 1·2·3위 순위 변동
3. EMPORION: 사용자가 북마크한 아이템이 설정 가격 이하로 하락
4. SYNAXIS: 내 파티 매칭 완료, 길드 버스 신규 생성
5. GNOSIS: 사용자가 구독/북마크한 분류의 새 게시물
6. 운영진: 신규 가입 신청 및 승인 대기

**공통 기반이 먼저 필요하다:** 공지 전용 `notices`와 별도로 대상 사용자·종류·원본 링크·발생 시각·읽음 시각을 저장하는 범용 `notifications`/`notification_reads` 구조, 사용자별 알림 설정, 중복 방지 키, 서버에서 이벤트를 만드는 작업이 필요하다. 숙제·가격·순위처럼 시간 또는 외부 데이터에 의존하는 알림은 Vercel Cron 또는 Supabase Edge Function/스케줄러를 사용한다.

**종료 후 모바일 알림:** 현재는 불가능하다. Service Worker·PWA manifest·Push 구독 저장소·VAPID 비밀키·서버 Push 발송을 갖춘 Web Push 2차를 구현해야 한다. Android는 지원 브라우저에서, iPhone/iPad는 홈 화면에 추가한 웹 앱에서 권한을 허용하는 방식으로 제공한다.

### 정식 오픈 이후 고도화하는 기능

- GNOSIS: 라이브러리, 특화 에디터, 클래스별 공략, 룬/펫/세팅 데이터
- EMPORION: 모비라이프 실거래 API, 즐겨찾기 가격 알림, 제작 대 구매 계산기
- LOGOS: 문의 운영 경험을 반영한 고도화
- 브라우저/모바일 푸시, 문서 기반 Q&A 챗봇

### 출시 판단 기준

베타는 완벽한 정식 서비스가 아니라, 길드원이 안전하게 로그인하고 핵심 길드 활동을 수행할 수 있는 검증 버전이다. 신규 기능보다 기존 기능의 오류 수정, 권한 보호, 모바일 사용성, 백업 가능성이 우선이다.

---

## 2. 운영·권한 원칙

| 역할 | 대상 | 기본 운영 범위 |
| --- | --- | --- |
| 길드마스터 | 한설 | 전체 설정, 권한 위임, 최종 운영·백업 판단 |
| 부마스터 | 신파랑, 제스, 수도사는수도사 | 가입 승인 및 지정된 길드 운영 기능 |
| 부마스터 대행 | 향후 지정 | 길드마스터가 정한 제한적 운영 권한 |
| 길드원 | 그 외 모든 사용자 | 본인 캐릭터·숙제·파티·글 작성 |

- 서비스는 길드원만 사용한다.
- 계정 복구는 개인정보를 수집하지 않고, 운영진이 입장 코드를 재발급하는 방식으로 한다.
- 탈퇴·추방 시 계정, 캐릭터, 파티 관련 데이터는 삭제한다.
- GNOSIS 게시물은 남기되 작성자 표기는 `탈퇴한 길드원`으로 익명화하는 것을 원칙으로 한다.
- 게임 닉네임, 캐릭터 직업, 전투력, 길드 활동 정보는 길드 내부에 공개한다.

---

## 3. 기술 스택과 실제 구조

### 기술 스택

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript / React 19
- **Styling:** Tailwind CSS v4 + `app/globals.css` CSS 변수 테마
- **Database:** Supabase Postgres + Realtime
- **Server routes:** Next.js Route Handlers
- **Deployment:** Vercel
- **외부 연동:** 모비라이프 API, Gemini 아이템 이미지 분석 API

### 주요 디렉터리

```text
app/
  admin/              관리자 제어 센터와 탭 컴포넌트
  api/                분석·이벤트·거래소·동기화 Route Handlers
  character/          KRONOS
  customize/          테마·스티커 설정
  gnosis/             GNOSIS
  kerygma/            KERYGMA
  lounge/             AGORA
  login/              길드원 로그인·가입 신청
  market/             EMPORION
  party/              SYNAXIS
  support/            LOGOS
  layout.tsx          전역 계정/테마/네비게이션/스티커 레이아웃
components/
  character/ common/ layout/ party/ sanctum/ kerygma/
hooks/
  usePartyManager.ts  파티·길드 버스 상태와 DB 연동
lib/
  busUtils.ts, matchingUtils.ts, partyDateUtils.ts, supabase.ts
public/
  svgs/classes/       21개 직업 SVG
  svgs/UI mark/       UI·메뉴 마크
  items_catalog.json  엠포리온 아이템 카탈로그
```

### 페이지·라우트 상세 지도

| URL / 파일 | 역할 | 주요 연결 |
| --- | --- | --- |
| `/` · `app/page.tsx` | SANCTUM 홈 대시보드. 숙제, 심연 제보, 파티 요약과 헤더 위젯을 조합한다. | `characters`, `nexus_tasks`, `nexus_contents`, `parties`, `deep_holes`, `abyss_reports`; `components/sanctum/*` |
| `/login` · `app/login/page.tsx` | 닉네임·입장 코드 로그인, 가입 신청·승인대기 처리, 최초 캐릭터 생성 흐름. | `/api/auth/login`, `/api/auth/register`, HttpOnly 세션 쿠키, 브라우저 표시 설정 |
| `/account/settings` · `app/account/settings/page.tsx` | 계정 드롭다운에서 들어가는 개인 설정. 현재 접속 코드를 확인한 뒤 새 코드로 변경하고 재로그인한다. | `/api/auth/session`, `/api/auth/change-code`, `accounts`, `sanctum_sessions` |
| `/character` · `app/character/page.tsx` | KRONOS. 캐릭터 선택/편집, 숙제·교환·구매 체크, 대표 캐릭터와 기여도 관리. | `characters`, `nexus_classes`, `nexus_tasks`, `nexus_contents`, `nexus_trades`, `nexus_purchases`; `components/character/*` |
| `/character/detail` · `app/character/detail/page.tsx` | 특정 캐릭터 상세 조회 화면. | `characters` |
| `/kerygma` · `app/kerygma/page.tsx` | 공지 목록·상세, 고정/삭제, 투표·댓글 관련 화면, 공지 Realtime 구독. | `notices`, `accounts`, `characters`; `components/kerygma/*` |
| `/kerygma/write` · `app/kerygma/write/page.tsx` | 공지 작성·수정 에디터. | `notices`, `KerygmaEditorToolbar`, `KerygmaPollModal` |
| `/party` · `app/party/page.tsx` | SYNAXIS 파티와 길드 버스 화면의 진입점. | `hooks/usePartyManager.ts`, `components/party/*`, `nexus_classes` |
| `/lounge` · `app/lounge/page.tsx` | AGORA 컨테이너. ASTRA 길드원 현황과 PANTHEON 랭킹을 전환한다. | `AstraView`, `PantheonView` |

| `/market` · `app/market/page.tsx` | EMPORION 검색·카탈로그·가격 비교 UI. | `public/items_catalog.json`, `/api/market`; 현재 화면 가격 시뮬레이션 존재 |
| `/gnosis` · `app/gnosis/page.tsx` | GNOSIS 가이드 목록·필터·카드 UI. | `nexus_classes`, `app/gnosis/[id]`, `app/gnosis/write` |
| `/gnosis/[id]` | GNOSIS 개별 글 상세. | 라우트 파라미터 `id` |
| `/gnosis/write` | GNOSIS 작성 화면. | `nexus_classes` |
| `/support` · `app/support/page.tsx` | LOGOS 1:1 문의·생텀 버그 제보·건의사항의 탭/작성/조회/길드마스터 답변. `?tab=bug|idea`로 새로고침 후 선택 탭 유지. 제보 사진 붙여넣기·WebP 축소 미리보기. 2026-09-25 로컬 후속: 제보·건의의 60일 검토 안내와 길드마스터의 글별 삭제/60일 보류 UI. | `inquiries`, 비공개 `logos-reports` Storage |
| `/customize` · `app/customize/page.tsx` | 테마·스티커 개인화 화면. | `ThemeModal`, `StickerCanvas`, 브라우저 저장소 |
| `/admin` · `app/admin/page.tsx` | 관리자 탭 허브. 가입 승인, 배너, 클래스, 컨텐츠, 교환, 임무, GNOSIS 관리. PC 글자 단계에 따른 관리자 전용 밀도 조정. | `/api/auth/session`으로 진입 역할 확인, `app/admin/components/*`, `app/admin/admin.css`; 다른 관리자 테이블 직접 쓰기는 후속 보안 과제 |

아스트라의 파티 배지는 `lib/activeParty.ts`에서 KST 날짜와 시작·종료 시각을 확인한다. 지난 파티는 참가자로 표시하지 않는다. `lib/approvedCharacters.ts`는 승인 계정 디렉터리와 캐릭터 소유자를 대조하며 아스트라·판테온·홈 요약·판테온 알림에 적용된다. 조회 실패 시 오래된 길드원 데이터를 그대로 노출하지 않는다. 추방 계정의 기존 캐릭터/파티 레코드는 보존하며, 정리는 별도 운영 승인 과제다.

v2.12 운영 확인: 홈 버전 표시·개인 설정 입력 화면·아스트라 승인 계정/캐릭터 목록과 지난 파티 배지 제거를 확인했다. 이 확인 기록은 구조 변경이 아니다. 접속 코드의 실변경과 기존 레코드 정리는 수행하지 않았다.

캐릭터 관리 상세의 숙제 체크는 500ms 디바운스 뒤 서버 세션 경로로 자동 저장된다. 변경되지 않은 대표·기여도·계정 공통 교환 정보는 별도 서버 요청으로 다시 쓰지 않는다. 기존 캐릭터의 일반 저장은 `nickname`과 로그인 계정 `owner`를 동시에 조건으로 건 단일 수정 요청이며, 새 캐릭터는 기존 등록 경로를 사용한다. `app/character/page.tsx`의 저장 상태 알림은 홈 체크보드의 상태 표시와 별개다. v1.991부터 `document.body` 포털의 작은 반투명 플로팅 알림만 잠깐 표시한다. 완료 표시 뒤 새로고침해야 한다.

### 서버 API 상세 지도

| Route Handler | 현재 목적 | 관련 데이터/외부 연동 | 운영 유의점 |
| --- | --- | --- | --- |
| `/api/market` | 모비라이프 거래소 요청을 중계한다. | 모비라이프 API | 키 노출, 캐시, 호출 제한, 실제 가격 표기 여부를 정식 오픈 전에 정비 |
| `/api/analyze-item` | Gemini 기반 아이템 이미지 분석 요청. | Gemini API | API 키는 서버 환경변수만 사용 |
| `/api/game-events` | 게임 이벤트 데이터 제공. | `server_events` | 데이터 갱신 주기 확인 필요 |
| `/api/guild-characters` | 길드 캐릭터 이름 목록 제공. | `characters` | 공개 범위·호출 권한 점검 필요 |
| `/api/sync-client` | 캐릭터 동기화/보정 처리. 관리자 세션 또는 운영진 닉네임·접속 코드 재확인 후 실행한다. | `characters`, Tampermonkey v8.3 | 기존 무인증 호출 차단, 스크립트 갱신 필요. 중복 호출과 동시 수정 방어 후속 과제 |
| `/api/sync-weekly` | 주간 교환/체크 상태 동기화. 관리자 세션 또는 운영진 코드 재확인 후 실행한다. | `nexus_trades`, `characters` | 기존 무인증 호출 차단. 주간 초기화 기준과 대상 범위 확인 필요 |
| `/api/auth/login`, `/api/auth/register`, `/api/auth/session`, `/api/auth/logout`, `/api/auth/switch` | 서버 로그인·가입·세션 확인·종료·저장 계정 전환. | `accounts`, `sanctum_sessions`, `sanctum_login_attempts`, `characters` | 서버 전용 키 사용; Preview 실제 로그인 검증 전 |
| `/api/auth/change-code` | 현재 코드·세션·요청 출처를 검증하고 새 코드를 저장한다. 기존 모든 세션은 변경 전에 무효화한다. | `accounts.code`와 기존 해시 트리거, `sanctum_sessions`, 로그인 시도 제한 RPC | 운영 계정의 실제 변경은 미검증; 새 코드 로그인과 다른 기기 로그아웃을 전용 테스트 계정으로 확인 필요 |
| `/api/auth/health` | 서버 키와 인증 DB 객체 연결 점검. | 인증 함수·세션·시도 제한 테이블 | 응답에 계정·키를 담지 않음 |
| `/api/admin/accounts`, `/api/admin/pending`, `/api/accounts/directory` | 운영진 가입 승인·대기 알림·길드원 표시 정보. | `accounts`, 서버 세션 | 계정 목록은 비밀 코드를 반환하지 않음 |
| `/api/admin/catalog` | 운영진 카탈로그 8개 테이블의 서버 저장·수정·삭제. | `nexus_*`, `content_power_reqs`, `gnosis_guides` | 운영진 세션·요청 출처 검사. Phase C 적용 전 Preview 쓰기 확인 |
| `/api/notices/mutate` | 공지 저장·고정·삭제와 로그인 이용자 투표·댓글. | `notices` | 작성 권한과 댓글 작성자 확인. Phase C 적용 전 검증 |
| `/api/reports` | 로그인 이용자의 심층/어비스 제보. | `deep_holes`, `abyss_reports` | 제보자 이름은 세션에서 설정 |
| `/api/member-mutations` | 본인 캐릭터, 참여 파티, 문의의 서버 저장·수정·삭제. 기존 캐릭터의 닉네임 기준 수정은 소유자 조건을 같은 DB 요청에 적용. | `characters`, `parties`, `inquiries` | 세션·소유자/참여자·운영진 권한 확인. Phase D 적용 후에도 서버 경로 유지 |
| `/api/parties/sync-checklist` | 파티 완료 시 참여 캐릭터 숙제 체크 동기화. | `parties`, `characters` | 파티 참가자/운영진만 요청 가능 |
| `/api/inquiries` | 본인 문의 또는 운영진 문의 목록·대기 건수. 새 제보·건의의 타인 기록은 길드마스터만 조회. | `inquiries` | 비로그인·타인 제보 조회 차단. Phase D에서 공개 SELECT 제거 |
| `/api/inquiries/reports`, `/api/inquiries/attachments` | 새 제보·건의의 글/사진 저장, 작성자·길드마스터의 비공개 사진 URL 조회. | `inquiries.attachment_paths`, `inquiries.reporter_account_id`, 비공개 `logos-reports` Storage | SQL·읽기 전용 진단 확인. Preview 역할별 검증 전 배포 금지. 계정 ID 권한 확인·용량·형식 검사; 사진 URL 5분 유효 |
| `/api/inquiries/retention` | 2026-09-25 로컬 후속: 길드마스터 전용 만기 제보 목록·60일 보류·글/첨부 삭제. 상단 알림함은 사이트가 열려 있을 때 만기 항목을 조회한다. | `inquiries.retention_review_at`, `logos-reports` Storage | 신규 SQL `20260925_logos_retention_review.sql` 운영 적용·읽기 전용 진단 통과, 앱 미배포. 자동 삭제·종료 상태 푸시 없음. 1:1 문의 제외 |

### 전역 레이아웃·상태 흐름

```text
app/layout.tsx
  ├─ 전역 CSS / 폰트 / 메타데이터
  ├─ 현재 사용자·테마·배너·운영 문의 수 조회
  ├─ Navbar.tsx
  │    └─ 브랜드 락업, 데스크톱 메뉴, 우측 도구(정령의 날개·테마·알림함·계정) 표시
  ├─ SpiritWingsMenu.tsx
  │    └─ 우측 도구 영역의 게임 관련 외부 빠른 이동 메뉴
  ├─ MobileBottomSheet.tsx
  │    └─ 모바일 및 좁은 노트북 폭(<xl)의 네비게이션·보조 조작
  ├─ ThemeModal.tsx
  │    └─ CSS 변수 기반 6개 테마 선택
  └─ StickerCanvas.tsx
       └─ 일반 UI와 분리된 최상위 장식 레이어
```

- v1.96 Preview 후보는 서버 전용 로그인·가입 API와 HttpOnly 세션 쿠키를 사용한다. 운영 DB Phase A가 적용됐고 계정 13개의 해시 및 새 객체를 읽기 전용으로 확인했다. Production 배포·실로그인 검증·계정 공개 권한 차단 Phase B는 아직 완료되지 않았다. 다른 관리자 테이블의 브라우저 직접 쓰기도 후속 보안 과제다.
- 파티 상태는 `usePartyManager.ts`에 집중되어 있으며 `parties` Realtime 채널(`realtime-parties-sync`)을 구독한다. 파티 생성, 참여, 수정, 종료·삭제, 길드 버스 흐름을 이 훅과 모달 컴포넌트가 나눠 맡는다.
- `lib/supabase.ts`는 브라우저 측 Supabase 클라이언트의 공통 진입점이다. 서버 전용 키가 필요한 로직은 Route Handler로 분리한다.
- `hooks/useNoticeNotifications.ts`는 로그인한 계정별로 KERYGMA `notices`를 읽고 새 공지를 Realtime으로 감지한다. 읽음 상태는 현재 해당 브라우저의 `localStorage`에만 저장한다.
- `components/layout/NotificationInbox.tsx`는 Navbar에서 열리는 알림함이다. 알림 권한은 사용자가 버튼을 눌렀을 때만 요청하며, 허용된 경우 SANCTUM을 열어 둔 동안 새 공지를 운영체제 브라우저 알림으로 표시한다. 날개·알림·계정 드롭다운은 하나씩만 열리고, 작은 화면에서는 최대 높이 안에서 내용만 스크롤하며 긴 제목을 숨기지 않는다. `ThemeModal.tsx`는 배경 클릭·Escape로 닫히고 열려 있는 동안 배경 스크롤과 키보드 초점 이탈을 막는다.

### 컴포넌트 책임 상세 지도

| 구역 | 파일군 | 책임 |
| --- | --- | --- |
| 공통 아이콘 | `components/common/ClassIcon.tsx`, `MarkIcon.tsx` | 직업 SVG 마스크/등급 오라, UI 마크 선택과 테마 대응 |
| KRONOS | `CharacterSelector`, `CharacterManageModal`, `CharacterStats`, `ClassLevelManager`, `ContentChecklist`, `TradeList` | 캐릭터 선택·등록·수정, 스탯, 직업/레벨, 숙제와 교환 체크 |
| KERYGMA | `KerygmaHeader`, `CategoryTabs`, `TableList`, `ReaderView`, `EditorToolbar`, `PollModal`, `TableContextMenu` | 공지 탐색·읽기·작성·투표와 운영 메뉴 |
| SYNAXIS | `PartyCard`, `PartyCreateForm`, `PartyFilterHeader`, `PartyModals`, `GuildBusCard`, `GuildBusJoinModal`, `GuildBusAccountDetailModal`, `CustomTimePicker`, `components/party/modals/*` | 파티 카드/필터/생성/참여/시간 조율, 길드 버스, 역할 조합과 세부 팝업 |
| 홈 | `SanctumHeaderWidgets`, `KronosCheckboardSection`, `PantheonRankingSection`, `SynaxisPartySection`, `SanctumModals` | 홈의 요약 위젯, 숙제/랭킹/파티 섹션과 홈 모달 |
| AGORA | `AstraView`, `PantheonView` | 길드원 현황·온라인 presence, 랭킹/직업 데이터 시각화 |
| 관리자 | `AccountApprovalTab`, `BannerAdminTab`, `ClassAdminTab`, `ContentAdminTab`, `TradeAdminTab`, `TaskAdminTab`, `MissionAdminTab`, `GnosisAdminTab` | 운영 데이터별 CRUD와 승인 처리 |
| 공통 로직 | `usePartyManager`, `usePressAndHold`, `busUtils`, `matchingUtils`, `partyDateUtils`, `imageUtils` | 파티 상태/길게 누르기/버스 배정/매칭/날짜/이미지 처리 |
| 알림 | `useNoticeNotifications`, `NotificationInbox` | 공지 Realtime 감지, 계정별 읽음 상태, 상단 알림함, 사용자 선택형 브라우저 알림 |

홈의 테크네 Top 3는 AGORA 판테온과 동일하게 계정(`owner`)별 최고 생활력 캐릭터 한 명만 선발한다. 모바일 요약 위젯은 작은 마크를 왼쪽, 이름·수치를 오른쪽에 놓는다. 길드·도감 마크의 과도한 원본 `viewBox` 여백만 `MarkIcon.maskZoom`으로 해당 화면 안에서 보정하며 다른 화면의 원본 SVG와 배율에는 영향을 주지 않는다.

### 데이터 호출 실제 지도

| 테이블 | 코드에서 확인된 사용 영역 | 주요 동작 |
| --- | --- | --- |
| `accounts` | 로그인, 전역 레이아웃, KERYGMA, 길드 버스, 관리자 승인 | 로그인/가입 승인/역할/계정 삭제 |
| `characters` | 홈, KRONOS, 상세, KERYGMA, AGORA, 파티/버스, API | 조회·등록·수정·대표 지정·삭제·랭킹/숙제 데이터 |
| `parties` | 홈, SYNAXIS 훅, AGORA, 길드 버스 | 생성·참여·수정·삭제·Realtime |
| `notices` | KERYGMA 목록/작성/수정 | 공지 CRUD·Realtime |
| `inquiries` | LOGOS, 전역 운영 알림 | 문의 작성·답변·대기 수 조회 |
| `nexus_classes` | KRONOS, 파티, AGORA, GNOSIS, 관리자, 버스 | 직업 마스터 데이터 CRUD/조회 |
| `nexus_tasks`, `nexus_contents`, `nexus_trades`, `nexus_purchases` | KRONOS·홈·주간 동기화·관리자 | 숙제/컨텐츠/교환/구매 기준 데이터 |
| `nexus_banners`, `nexus_missions`, `content_power_reqs`, `gnosis_guides` | 전역 배너·관리자 | 운영 데이터 CRUD |
| `deep_holes`, `abyss_reports` | 홈 | 심연/어비스 제보 생성·목록 |
| `server_events` | 게임 이벤트 API | 서버 이벤트 제공 |

#### DB-코드 불일치 후보

- 현재 확인된 Supabase 테이블 목록에는 `members`, `homework_status`가 없지만, `CharacterStats.tsx`와 `AstraView.tsx`에서 이 이름을 조회한다. 이는 과거 테이블 잔재, 별도 스키마, 또는 실제 런타임 오류 후보이므로 베타 점검 첫 단계에서 확인한다.
- 확인된 테이블 중 `boards`, `lounge_posts`, `notice_comments`, `weekly_stat_snapshots`, `sync_batches`, `nexus_titles`, `guild_settings` 등은 현재 소스 직접 호출 여부·운영 목적을 별도 점검 대상으로 둔다. "테이블이 존재한다"와 "현재 화면이 사용한다"를 같은 뜻으로 취급하지 않는다.
- 2026-09-23 읽기 전용 검사에서 `accounts.code`·`code_hash`의 anon SELECT와 RLS가 꺼진 18개 테이블의 anon 쓰기 권한이 확인됐다. 이번 검증 문서 push는 구조 변경 없음. 실제 권한 차단은 현재 브라우저 직접 쓰기·외부 동기화를 서버 경로로 옮기고 별도 승인받은 뒤에만 한다.

### 자산·테마 구조

- `public/svgs/classes/`: 21개 직업 SVG. `ClassIcon`에서 표시한다.
- `public/svgs/UI mark/`, `status mark/`, `contens mark/`, `logo/`: 메뉴·상태·컨텐츠·브랜드 SVG. 상단 도구는 신규 `정령의 날개 마크.svg`·`테마 팔레트 마크.svg`와 기존 `우편함 마크.svg`를 `MarkIcon` 마스크로 표시해 전역 테마 색을 따른다.
- `public/images/bg-login-pc.webp`, `bg-login-mobile.webp`: 로그인 반응형 배경.
- `public/items_catalog.json`: 엠포리온 아이템 검색의 로컬 카탈로그.
- `app/globals.css`: AUREUM, LUMEN, NEMETON, VESPER, ROSARIUM, ELYSIUM의 전역 CSS 변수와 공통 스타일의 기준점.

### 전역 UI 구조

- 전역 테마, 일반 UI, `StickerCanvas`는 서로 레이어를 분리한다.
- 모바일은 단순 축소가 아니라 바텀시트, 터치 조작, 정보 밀도를 고려해 재배치한다.
- `sm` 경계(640px)까지는 모바일로 취급한다. 3열 카드·6열 탭·가로형 Top 3는 `md`(768px)부터 사용하며, 고정 플로팅 메뉴와 본문이 겹치지 않도록 전역 하단 안전 여백을 둔다.
- 직업 SVG는 `ClassIcon`, 컨텐츠/UI SVG는 `MarkIcon`을 우선 사용한다.
- 테마 색상은 하드코딩보다 `var(--panel)`, `var(--accent)`, `var(--text-main)`, `var(--text-sub)` 등 전역 변수를 우선한다.

---

## 4. 현재 기능 지도

| 영역 | 현재 구현 | 베타 판단 |
| --- | --- | --- |
| SANCTUM 홈 | 길드 상태 위젯, 숙제·랭킹·파티 요약 | 점검 후 유지 |
| KRONOS | 다중 캐릭터, 직업/레벨, 전투력·마도저항, 숙제·교환 체크 | 베타 핵심 |
| KERYGMA | 공지 CRUD, 고정, 투표, 댓글/대댓글, Realtime 구독 | 베타 핵심 |
| AGORA | ASTRA 길드원 현황, PANTHEON 랭킹 | 베타 포함 |
| SYNAXIS | 파티 생성/참여, 역할 조합, 일정 겹침 검사, 길드 버스 | 베타 핵심 |
| 관리자 | 가입 승인, 배너, 숙제·컨텐츠·클래스·교환·임무·GNOSIS 관리 | 베타 핵심 |
| EMPORION | 카탈로그/검색 UI, API Route 존재 | 화면 가격은 현재 시뮬레이션이므로 정식 오픈 과제 |
| GNOSIS | 가이드 목록·작성 프로토타입 | 베타에서는 최소 유지 |
| LOGOS | 1:1 문의·답변 | 최소 유지, 이후 고도화 |
| 알림 | 상단 알림함, 공지 실시간 감지, 읽지 않음 수, 브라우저 알림 허용 버튼 | 1차 구현 완료; 브라우저/탭 완전 종료 후 푸시는 후속 과제 |

---

## 5. Supabase 현재 상태 (2026-09-22 확인)

### Public schema 테이블

| 분류 | 테이블 |
| --- | --- |
| 계정·캐릭터 | `accounts`, `characters`, `activity_logs`, `weekly_stat_snapshots`, `sync_batches` |
| 공지·커뮤니티 | `notices`, `notice_comments`, `boards`, `gnosis_guides`, `lounge_posts`, `inquiries` |
| 파티·이벤트 | `parties`, `abyss_reports`, `deep_holes`, `server_events` |
| 운영 카탈로그 | `nexus_banners`, `nexus_classes`, `nexus_contents`, `content_power_reqs`, `nexus_tasks`, `nexus_trades`, `nexus_missions`, `nexus_purchases`, `nexus_titles`, `guild_settings` |

### RLS 확인 결과

RLS가 켜진 테이블은 `accounts`, `activity_logs`, `characters`, `inquiries`, `lounge_posts`, `nexus_classes`, `parties`다. 나머지 다수의 public 테이블은 RLS가 꺼져 있다.

2026-09-23 정책 상세 확인에서 위 테이블의 RLS가 켜져 있어도 `PUBLIC` 대상 `true` 쓰기 정책이 있었음을 확인했다. 서버 쓰기 경로를 배포·검증한 뒤 Phase B/C/D SQL로 공개 권한을 차단했다.

2026-09-23 23:27 KST Phase B/C/D를 운영 DB에 적용했다. 익명 쓰기 가능한 public 테이블은 0개이며 계정 코드·해시와 비공개 문의의 익명 읽기는 차단됐다. 기존 RLS 정책 이름 자체가 남은 테이블도 테이블 권한이 없어 브라우저 익명 쓰기를 허용하지 않는다. 이후 DB 변경 시 서버 API 경로와 권한을 함께 갱신한다.

특히 `notices`는 정책이 존재하지만 RLS 자체가 꺼져 있으므로 정책이 적용되지 않는다. RLS를 한꺼번에 활성화하면 기존 클라이언트 직접 호출이 중단될 수 있으므로, 베타 전에는 핵심 테이블부터 코드와 함께 단계적으로 정비한다.

### 데이터 모델 유의점

- `accounts.code`는 현재 일반 텍스트 입장 코드다. 로그·백업·Git에 노출하지 않는다. `supabase/migrations/20260922_account_code_hash_and_login_rpc.sql`로 bcrypt 해시·서버 세션 전환을 준비했으나, 운영 DB 적용 전이므로 아직 평문 컬럼을 삭제하지 않는다.
- `characters.combat_power`, `magic_resistance`, `life_energy`, `charm`은 텍스트 타입이다. 수치 계산/정렬 시 변환을 일관되게 처리한다.
- 숙제, 레벨, 랭킹, 파티 멤버 등의 일부 데이터는 JSONB다. 동시 수정 시 기존 값을 덮어쓰지 않도록 주의한다.
- 기존 백업 CSV는 데이터 참고용이며, 앞으로 DB 구조 변경은 `supabase/migrations/` SQL 마이그레이션으로 기록한다.

---

## 6. 베타 전 우선 위험 요소

1. **권한 검증:** 브라우저 `localStorage`의 역할값만으로 관리자 기능을 신뢰하지 않는다. 로그인 세션과 역할은 서버의 HttpOnly 쿠키·DB 조회를 기준으로 하며, 관리자 데이터 변경 API도 다음 단계에서 서버 검증으로 옮긴다.
2. **RLS 미적용:** 공개 테이블의 조회·수정 범위를 코드 흐름과 함께 점검한다.
3. **계정 코드 노출:** 입장 코드가 포함된 백업 및 Git 추적 파일을 정리하고 코드 교체 계획을 수립한다.
4. **공지 HTML:** `dangerouslySetInnerHTML` 출력 전 허용 HTML 정제(sanitization)를 적용한다.
5. **엠포리온 표기:** 현재 시뮬레이션 가격을 실시간 데이터처럼 표시하지 않는다.
6. **코드 품질:** 현재 `npm run lint`에는 기존 오류가 다수 있으므로, 베타 수정으로 새 오류를 추가하지 않고 `npm run build` 통과를 최소 출시 조건으로 삼는다.

---

## 7. UI/UX 절대 원칙

1. **맥락형 반응형:** PC와 모바일의 사용 목적에 맞춰 레이아웃을 재구성한다.
   - 헤더에서는 브랜드·주요 메뉴·도구 영역을 독립적으로 확보한다. 공간이 모자라는 폭에서는 주요 메뉴를 하단 메뉴로 전환하며, 버튼이나 글자가 서로 겹치는 상태를 허용하지 않는다.
2. **가로 스크롤 방지:** 데이터 테이블을 제외하고 모바일 가로 스크롤을 만들지 않는다.
3. **방어적 레이아웃:** 긴 닉네임, 큰 수치, 빈 데이터, 로딩/실패 상태에서도 깨지지 않게 한다.
4. **실용적 미니멀리즘:** 장식보다 길드원이 즉시 읽고 행동할 수 있는 정보 구조를 우선한다.
5. **테마 일관성:** 신규 컴포넌트도 6개 전역 테마에서 읽을 수 있어야 한다.
6. **글자 단계와 정보 보존:** PC는 전역 18/20/22px 루트 단계에 맞춰 rem으로 비례하고, 모바일은 18px 루트와 최소 보조 글자 크기를 지킨다. 관리자 전용 비례 토큰은 `app/admin/admin.css`를 사용한다. 12자 닉네임·제목·값은 말줄임 대신 행/열 재배치와 안전한 줄바꿈으로 전체를 읽게 한다.
7. **전역 탐색 헤더:** `components/layout/Navbar.tsx`는 메뉴를 보여 줄 수 있는 중간 폭에서 로고 문양만 남겨 공간을 확보하고, 모바일에서는 로고 옆 브랜드 설명을 표시한다. 영어 메뉴명은 호버·키보드 포커스 시 전체가 보이는 세로 슬롯 전환을 사용한다. 우측 정령의 날개는 버튼과 열린 메뉴 모두 `정령날개 마크.svg`, 테마 설정은 `테마 팔레트 마크.svg`, 알림함은 인게임 형상의 `우편함 마크.svg`를 전역 테마색으로 사용한다. 상단 드롭다운은 겹치지 않게 하나씩 열리고 열린 패널은 화면 높이 안에서 스크롤된다. `components/layout/MobileBottomSheet.tsx`의 단일 플로팅 호출점은 실제 모바일 폭에서만 나타나고, `메뉴/닫기` 표기와 절제된 맥동으로 조작 가능성을 알린다. 모션 감소 설정에서는 반복 애니메이션을 끈다.

---

## 8. Codex 협업 규칙

### 작업 모드

- **`의논:`** 코드·DB를 변경하지 않고 선택지와 추천안을 제시한다.
- **`점검:`** 현재 상태를 읽고 문제를 보고한다.
- **`구현:`** 실제 파일을 수정하고 검증한다.
- **`베타 우선:`** 이틀 베타 범위에 필요한 것만 다룬다.
- **`정식 오픈:`** 장기 확장성과 데이터 구조까지 고려한다.
- **`배포:`** 빌드, 환경변수, 배포 상태, 핵심 페이지 스모크 테스트를 확인한다.

### 구현 원칙

- 기존 파일, 연동 컴포넌트, 타입, DB 호출을 확인한 뒤 변경한다.
- 모르는 DB 구조는 추측하지 않고 스키마/대시보드에서 확인한다.
- 새 패키지, 외부 API, DB 삭제, 권한 변경, 배포는 이유와 영향을 먼저 설명한다.
- 전체 파일을 채팅에 반복 출력하지 않는다. 실제 파일 변경, 변경 요약, 검증 결과를 제공한다.
- 작업 완료 시 `의도 → 변경 파일 → 검증 결과 → 남은 위험` 순서로 보고한다.

### Git·문서 규칙

- Git 푸시는 한설의 명시적 요청이 있을 때만 한다.
- 푸시 전 변경 파일, 빌드 결과, 버전 상승안, 릴리스 노트 초안을 확인한다.
- 기존 최신 Git 기능 표기 `v1.9`를 보존한다. 기능 단위는 `v1.9 → v2.0`처럼 다음 `0.1`/정수 마일스톤으로, 그보다 작은 후속·핫픽스는 `v1.91 → v1.92`처럼 세부 버전으로 올린다.
- 매 push에는 `docs/RELEASE_NOTES.md`(KST 시간·변경·검증·Vercel 결과), `docs/HANDOFF.md`(프로젝트 전체 상태), 이 마스터 가이드의 실제 구조 변경, 현재 호스트의 Codex 릴레이 발신함을 함께 갱신한다.
- 구조 변경이 없으면 업데이트 노트에 명시하며, 구조 변경이 있으면 페이지·컴포넌트·API·DB·권한 중 바뀐 부분만 근거를 가지고 갱신한다.
- `docs/DECISIONS.md`에는 장기 운영 결정을, `docs/BETA_FEEDBACK.md`에는 한설이 전달한 베타 피드백의 처리 상태를 기록한다.

### 시스템 공지 규칙

- 향후 시스템 공지 기능이 구현되면, 공식 push와 Vercel `Ready` 확인 뒤 `SANCTUM 시스템` 작성자의 `생텀 업데이트` 공지를 게시한다.
- 공지는 길드원이 이해할 수 있게 버전·날짜·사용자 변화·필요 행동만 설명한다. 내부 파일명·DB·오류 로그·비밀값은 공개하지 않는다.
- 사용 방법이나 운영 규칙이 달라질 때만 `생텀 가이드`를 갱신한다. 모든 배포에 가이드 글을 중복 게시하지 않는다.
- 이 자동 게시 기능은 아직 구현 전이다. 서버 전용 권한, 같은 버전 중복 방지, 배포 성공 확인을 갖춘 뒤 활성화한다.

### 알림 기능 단계

- **1차 구현 완료:** KERYGMA 새 공지 알림함, 읽지 않음 표시, 알림 클릭 시 해당 공지 이동, 사용자 선택형 브라우저 알림.
- **현재 제한:** 읽음 상태는 계정별 브라우저 저장소에만 저장되며, 탭 또는 브라우저가 완전히 종료된 뒤에는 알림을 보낼 수 없다.
- **후속 단계:** DB 기반 알림 기록, 운영진/개인 대상 알림, 읽음 상태의 여러 기기 동기화, 서비스 워커와 Web Push 기반의 종료 후 푸시 알림.

### 베타 우선순위

| 등급 | 처리 기준 | 예시 |
| --- | --- | --- |
| P0 | 즉시 점검·핫픽스 | 로그인 불가, 데이터 삭제/유출, 관리자 권한 노출, 전체 접속 불가 |
| P1 | 다음 베타 배포 우선 | 캐릭터·공지·파티·가입 승인 오류, 모바일에서 조작을 막는 UI |
| P2 | 피드백에 기록 후 보류 | 취향성 UI 조정, 새로운 장기 아이디어, 엠포리온·그노시스 로고스 확장 |

한설이 직접 우선 구현을 지정하면 P2도 진행할 수 있으나, 현재 작업 중인 영겁 또는 순월은 베타 핵심 일정에 주는 영향을 먼저 알린다.

---

## 9. 다음 우선순위

1. 계정 보안 1차 SQL 적용 후 로그인·가입 신청·승인 계정의 실제 흐름 테스트
2. 관리자 승인·계정 관리의 브라우저 직접 DB 변경을 서버 권한 검증 API로 전환
3. KRONOS, KERYGMA, SYNAXIS, 관리자 기능의 실제 흐름 테스트
4. 모바일 화면·빈 상태·실패 상태 점검
5. 8명 베타 테스터 배포 및 핫픽스
6. 범용 알림 데이터 구조와 사용자별 설정 설계 후, KRONOS·SYNAXIS·운영진 이벤트부터 내부 알림함에 단계적으로 연결
7. Service Worker/PWA/Web Push를 추가해 종료 후 모바일·브라우저 알림 지원
8. 베타 안정화 후 GNOSIS와 EMPORION 고도화
