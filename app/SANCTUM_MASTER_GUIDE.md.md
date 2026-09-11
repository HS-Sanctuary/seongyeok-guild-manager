# 🏛️ SANCTUM_MASTER_GUIDE.md
**최신 업데이트**: v1.4 (2026년 9월 11일)  
**목표 릴리즈**: 2026년 9월 14일 (v1.0 MVP 정식 오픈)  
**역할 & 정체성**: 'SANCTUM' 수석 풀스택 아키텍트 & 개발자 (기획자/길드마스터 '한설' 님과 전적 협업)

---

## 1. 프로젝트 기본 정보 (Basic Information)
* **서비스명**: SANCTUM (`seongyeok-guild-manager`)
* **서비스 목적**: 마비노기 모바일 데이안 서버 '성역' 길드 전용 통합 스마트 플랫폼
* **핵심 기술 스택**: 
  - **Framework**: Next.js (App Router, App Directory Architecture)
  - **Language**: TypeScript (Strict Mode)
  - **Styling**: Tailwind CSS (v4), `@theme` 기반 CSS 변수 테마 시스템
  - **Database & Realtime**: Supabase (Public Schema, Postgres Realtime)
  - **State Management**: Zustand / React Context API
  - **Deployment**: Vercel Serverless Platform
* **3단 Z-Index 레이어 격리 구조**:
  - **Z-0 ~ Z-10 (Background)**: 전역 테마 배경, 그리드 패턴, 동적 그라디언트
  - **Z-20 ~ Z-80 (UI Layer)**: 대시보드, 네비게이션, 카드, 테이블, 모달 (Z-100~150)
  - **Z-90 (StickerCanvas)**: 테마 스튜디오 커스텀 스티커 듀얼 레이어 렌더링 및 플로팅 툴바

---

## 2. 📁 최신 디렉터리 구조 및 모듈 지도 (Directory Structure)

```text
seongyeok-guild-manager/
├── 📁 app/                          # [App Router 기반 페이지 및 API 라우트]
│   ├── 📁 admin/                    # 관리자 전용 제어 센터
│   ├── 📁 api/                      # Supabase Sync & External API Routes
│   │   ├── analyze-item/            # 아이템 분석 API
│   │   ├── game-events/             # 캘린더 이벤트 동기화
│   │   ├── guild-characters/        # 길드원 캐릭터 일괄 수집
│   │   ├── market/                  # 거래소 시세 트래킹
│   │   ├── sync-client/             # 클라이언트 스탯 동기화
│   │   └── sync-weekly/             # 주간 숙제 자동 리셋
│   ├── 📁 character/                # ⚔️ 크로노스 (캐릭터 관리/스탯/체크리스트)
│   ├── 📁 customize/                # 🎨 테마 스튜디오 (CSS 변수 & 스티커 캔버스)
│   ├── 📁 gnosis/                   # 📖 그노시스 (정보 공유 & 공략 보드)
│   ├── 📁 login/                    # 🔐 인증 & 로그인
│   ├── 📁 lounge/                   # 🏛️ 아고라 (PANTHEON 랭킹 & ASTRA 현황)
│   ├── 📁 market/                   # 💰 엠포리온 (거래소 정보 추적)
│   ├── 📁 notice/                   # 📜 케리그마 (길드 공지사항)
│   ├── 📁 party/                    # ⚔️ 시낙시스 (스마트 파티 매칭 시스템)
│   ├── 📁 support/                  # 💬 로고스 (1:1 문의 & 건의)
│   ├── globals.css                  # 전역 스타일 및 6종 CSS 테마 변수 정의
│   ├── layout.tsx                   # RootLayout (전역 스토어, Navbar, StickerCanvas)
│   └── page.tsx                     # 메인 대시보드
│
├── 📁 components/                   # [재사용 모듈화 UI 컴포넌트]
│   ├── 📁 character/                # 캐릭터 모달, 스탯, 체크리스트, 직업레벨
│   ├── 📁 common/                   # ClassIcon (21개 직업 SVG + Rank 1~3 오라)
│   ├── 📁 layout/                   # Navbar, MobileBottomSheet, StickerCanvas, ThemeModal
│   └── 📁 party/                    # 시낙시스 파티 매칭 전용 컴포넌트
│       ├── 📁 modals/               # 🧩 [v1.4 모듈화] 8종 독립 서브 모달
│       │   ├── SynaxisInfoModal.tsx # [1] SYNAXIS 안내 팝업
│       │   ├── LoreGuideModal.tsx   # [2] 매칭 가이드 팝업
│       │   ├── ContentSelectModal.tsx # [3] 목표 컨텐츠 선택 모달
│       │   ├── ScheduleModal.tsx    # [4] 출발 희망 일시 모달
│       │   ├── FilterCalendarModal.tsx # [5] 필터 달력 모달 (스와이프/휠 제스처)
│       │   ├── BusCreateModal.tsx   # [6] 공식 길드 버스 개설 모달
│       │   ├── InspectCharacterModal.tsx # [7] 캐릭터 스탯 상세 모달
│       │   └── JoinPartyModal.tsx   # [8] 파티 참여 모달 (3열 그리드 버튼)
│       ├── CustomTimePicker.tsx     # 시간 선택 커스텀 컴포넌트
│       ├── GuildBusCard.tsx         # 길드 버스 카드 UI
│       ├── GuildBusJoinModal.tsx    # 길드 버스 탑승 모달
│       ├── PartyCard.tsx            # 일반 파티 카드 UI
│       ├── PartyCreateForm.tsx      # 파티 생성 폼
│       ├── PartyFilterHeader.tsx    # 파티 필터링 헤더
│       ├── PartyModals.tsx          # 👑 서브 모달 8종 통합 라우팅 & 스크롤 락 허브
│       └── types.ts                 # 파티 시스템 전역 타입 정의
│
├── 📁 hooks/                        # 커스텀 훅 (usePartyManager, usePressAndHold 등)
├── 📁 lib/                          # 비즈니스 로직 및 유틸리티 (busUtils, partyDateUtils 등)
├── 📁 public/                       # 정적 에셋 (public/svgs/classes/ 21개 직업군 SVG)
└── 📁 types/                        # TypeScript 전역 타입 정의
```

---

## 3. ⚔️ 파티/시낙시스 모듈화 아키텍처 (v1.4 Spec)
* **단일 허브 구조**: `PartyModals.tsx`를 통제 허브로 사용하고, 실제 모달 UI는 `components/party/modals/` 내 8개 서브 컴포넌트로 100% 격리.
* **Scroll Lock 스크롤 차단 시스템**:
  - `isAnyModalOpen` 통합 상태 감지 시 `body`/`html` 오버플로우 고정 (`overflow: hidden`).
  - Native `wheel` 및 `touchmove` 이벤트 가로채기를 통해 배경 페이지 스크롤 튕김 현상 완전 차단.
* **JoinPartyModal UI/UX 개편**:
  - 드롭다운 제거 -> `ClassIcon`과 직업 오라가 포함된 **3열 버튼 그리드** 전환.
  - 모집 일정 및 일시 폰트 시인성 확대 (`text-xs sm:text-sm`, `font-extrabold`).

---

## 4. 🗄️ 데이터베이스 스키마 명세 (Supabase Public Schema)
* `characters`: 직업, 전투력(CP), 마법 저항력, 일간/주간/레이드 체크리스트 (`jsonb`), 랭킹, 대표 캐릭터 여부(`is_main`), 계정 소유자(`owner`).
* `accounts` / `members`: 길드원 계정, 닉네임, 입장 코드, 권한 (`role`: admin/member), 칭호 (`titles`, `equipped_title`).
* `parties`: 컨텐츠명, 난이도, 모집시간 (`time_start`, `time_end`), 최종출발시간 (`final_start_time`), 멤버 목록 (`jsonb`), 파티 상태 (`status`).
* `boards`, `gnosis_guides`, `lounge_posts`, `inquiries`, `abyss_reports`, `guild_settings`

---

## 5. 🎨 전역 테마 시스템 명세 (`app/globals.css`)
* **6종 CSS 테마 지원**:
  - `AUREUM` (Dark / Gold Accent) - 기본 시그니처 테마
  - `LUMEN` (Light / Bright Clean)
  - `NEMETON` (Mint / Forest Green Accent)
  - `VESPER` (Purple / Mystic Night Accent)
  - `ROSARIUM` (Rose / Red Crimson Accent)
  - `ELYSIUM` (Celestial / Deep Cyan Accent)
* **Strict 전역 변수 규칙**: `var(--bg-main)`, `var(--panel)`, `var(--panel-border)`, `var(--inner-box)`, `var(--accent)`, `var(--text-main)`, `var(--text-sub)`를 하드코딩 색상 대신 필수로 사용.

---

## 6. 🛡️ UI/UX 4대 절대 원칙 (Absolute Principles)
1. **맥락에 맞는 완벽한 반응형 (Context-Aware Responsiveness)**
   - 단순 비율 조절이 아닌, 기기별 사용성(모바일 FAB/바텀시트, PC 고정 헤더/사이드 레이아웃)에 맞춘 유동적 UI 구조 구현.
2. **가로 스크롤 원천 차단 (No Horizontal Scroll)**
   - 데이터 테이블 영역을 제외한 전 페이지 가로 스크롤 완전 통제 (`100% Fit`, `Truncate`, `Break-all` 적용).
3. **극한의 방어적 디자인 (Defensive UI)**
   - 10만 단위 스탯, 12자 이상 한글 닉네임, 예외적 장문 인입 시에도 레이아웃 파괴 방지.
4. **실용주의 미니멀리즘 (Pragmatic Minimalism)**
   - 불필요한 장식을 배제하고 `var(--accent)` 중심의 성역 톤앤매너 유지 및 정보 인지 속도 최우선 설계.

---

## 7. 🤖 AI & 개발자 협업 프로토콜 (Workflow & Command Switch)
1. **통짜 코드(Full File Code) 제공 필수**
   - 코드 수정 시 생략이나 `// 기존 코드 동일` 표기를 금지하며, 즉시 복사-붙여넣기 가능한 완벽한 전체 파일을 제공한다.
2. **성능 최적화 및 무결성 기본 탑재**
   - Vercel 서버리스 DB 부하 최소화, Supabase N+1 차단, 로컬스토리지 Draft 임시 저장, 데이터 동시성(Race Condition) 방어 로직 기본 작성.
3. **의논과 코딩 모드의 분리 (Command Switch)**
   - 한설 님이 **"의논 하자"**라고 하면 아이디어 기획 및 구조 설계 회의 모드로 전환한다.
   - 방향 결정 후 **"코딩하자"**라고 하면 즉시 개발 및 통짜 코드 작성 모드로 복귀한다.
4. **"푸쉬하자" 연동 자동 버전 승급 및 문서 세트 생성**
   - **"푸쉬하자"** 명령 수신 시 직전 버전에서 0.1 승급.
   - 마스터 기획서(`PROJECT_SPEC.md`), 업데이트 노트(`RELEASE_NOTES.md`), AI 세션 인계 프롬프트(`AI_HANDOVER_PROMPT.md`) 3종 세트를 자동 생성한다.
5. **크로스 더블 체크 리포트 의무화**
   - 코드 작업 완료 후 `[의도 파악 브리핑 -> 변경 파일 경로 안내 -> 통짜 코드 생성 -> 변경 전후 검증 리포트]` 순서로 상세 보고한다.
6. **정보 수급 및 코드 파괴 방지**
   - 기존 파일 코드가 기억에 없거나 정보가 불확실한 경우 임의 작성 금지 및 한설 님에게 원본 코드 수급 요청 후 기존 기능/로직을 파괴하지 않고 작업을 수행한다.