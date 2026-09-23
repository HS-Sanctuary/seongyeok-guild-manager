# 🏛️ SANCTUM Master Guide

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
| `/support` · `app/support/page.tsx` | LOGOS 문의 작성·조회·운영진 답변 상태 처리. | `inquiries` |
| `/customize` · `app/customize/page.tsx` | 테마·스티커 개인화 화면. | `ThemeModal`, `StickerCanvas`, 브라우저 저장소 |
| `/admin` · `app/admin/page.tsx` | 관리자 탭 허브. 가입 승인, 배너, 클래스, 컨텐츠, 교환, 임무, GNOSIS 관리. PC 글자 단계에 따른 관리자 전용 밀도 조정. | `/api/auth/session`으로 진입 역할 확인, `app/admin/components/*`, `app/admin/admin.css`; 다른 관리자 테이블 직접 쓰기는 후속 보안 과제 |

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
| `/api/auth/health` | 서버 키와 인증 DB 객체 연결 점검. | 인증 함수·세션·시도 제한 테이블 | 응답에 계정·키를 담지 않음 |
| `/api/admin/accounts`, `/api/admin/pending`, `/api/accounts/directory` | 운영진 가입 승인·대기 알림·길드원 표시 정보. | `accounts`, 서버 세션 | 계정 목록은 비밀 코드를 반환하지 않음 |
| `/api/admin/catalog` | 운영진 카탈로그 8개 테이블의 서버 저장·수정·삭제. | `nexus_*`, `content_power_reqs`, `gnosis_guides` | 운영진 세션·요청 출처 검사. Phase C 적용 전 Preview 쓰기 확인 |
| `/api/notices/mutate` | 공지 저장·고정·삭제와 로그인 이용자 투표·댓글. | `notices` | 작성 권한과 댓글 작성자 확인. Phase C 적용 전 검증 |
| `/api/reports` | 로그인 이용자의 심층/어비스 제보. | `deep_holes`, `abyss_reports` | 제보자 이름은 세션에서 설정 |
| `/api/member-mutations` | 본인 캐릭터, 참여 파티, 문의의 서버 저장·수정·삭제. | `characters`, `parties`, `inquiries` | 세션·소유자/참여자·운영진 권한 확인. Phase D 전 핵심 쓰기 검증 |
| `/api/parties/sync-checklist` | 파티 완료 시 참여 캐릭터 숙제 체크 동기화. | `parties`, `characters` | 파티 참가자/운영진만 요청 가능 |
| `/api/inquiries` | 본인 문의 또는 운영진 문의 목록·대기 건수. | `inquiries` | 비로그인·타인 문의 조회 차단. Phase D에서 공개 SELECT 제거 |

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
