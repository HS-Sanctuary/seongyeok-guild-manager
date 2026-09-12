```markdown
# 🏛️ SANCTUM_MASTER_GUIDE.md

**최신 업데이트**: v1.6 (2026년 9월 12일)  
**목표 릴리즈**: 2026년 9월 14일 (v1.0 MVP 정식 오픈)  
**역할 & 정체성**: 'SANCTUM' 수석 풀스택 아키텍트 & 개발자 (기획자/길드마스터 '한설' 님과 전적 협업)

---

## 1. 프로젝트 기본 정보 (Basic Information)

* **서비스명**: SANCTUM (`seongyeok-guild-manager`)
* **서비스 목적**: 마비노기 모바일 데이안 서버 '성역' 길드 전용 통합 스마트 플랫폼
* **핵심 기술 스택**:
  * **Framework**: Next.js (App Router, App Directory Architecture)
  * **Language**: TypeScript (Strict Mode)
  * **Styling**: Tailwind CSS (v4), `@theme` 기반 CSS 변수 테마 시스템
  * **Database & Realtime**: Supabase (Public Schema, Postgres Realtime)
  * **State Management**: Zustand / React Context API
  * **Deployment**: Vercel Serverless Platform

* **3단 Z-Index 레이어 격리 구조**:
  * **Z-0 ~ Z-10 (Background)**: 전역 테마 배경, 그리드 패턴, 동적 그라디언트
  * **Z-100 (Base Popup)**: `InspectCharacterModal`, `LoreGuideModal`, `SynaxisInfoModal`, `ContentSelectModal`
  * **Z-150 (Filter Layer)**: `FilterCalendarModal`
  * **Z-250 (Bus Form Layer)**: `BusCreateModal` (공식 길드 버스 개설)
  * **Z-300 ~ Z-350 (Time/Picker Detail Layer)**: `ScheduleModal`, `CustomTimePicker`, `GuildBusJoinModal`
  * **Z-90 (StickerCanvas)**: 테마 스튜디오 커스텀 스티커 듀얼 레이어 렌더링 및 플로팅 툴바

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
│   ├── 📁 party/                    # ⚔️ 시낙시스 (스마트 파티 매칭 시스템 메인)
│   │   └── page.tsx                 # 시낙시스 대시보드 (Suspense/Fab/Timeout/Cards)
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
│       ├── 📁 modals/               # 8종 독립 서브 모달
│       │   ├── SynaxisInfoModal.tsx # [1] SYNAXIS 안내 팝업
│       │   ├── LoreGuideModal.tsx   # [2] 매칭 가이드 팝업
│       │   ├── ContentSelectModal.tsx # [3] 목표 컨텐츠 선택 모달
│       │   ├── ScheduleModal.tsx    # [4] 출발 희망 일시 모달 (1주 슬라이드/전체 연도)
│       │   ├── FilterCalendarModal.tsx # [5] 필터 달력 모달 (스와이프/휠 제스처)
│       │   ├── BusCreateModal.tsx   # [6] 공식 길드 버스 개설 모달
│       │   ├── InspectCharacterModal.tsx # [7] 캐릭터 스탯 상세 모달
│       │   └── JoinPartyModal.tsx   # [8] 일반 파티 참여 모달 (3열 그리드 버튼)
│       ├── CustomTimePicker.tsx     # 아날로그 시계/디지털 겸용 시간 선택 피커
│       ├── GuildBusCard.tsx         # 길드 버스 전용 카드 UI
│       ├── GuildBusJoinModal.tsx    # 길드 버스 탑승 모달 (멀티 캐릭터 타임 슬롯 설정)
│       ├── PartyCard.tsx            # 일반 파티 카드 UI (교집합 타임 계산/가변 닉네임)
│       ├── PartyCreateForm.tsx      # 파티 생성 폼 (모바일 1줄 단축 일시)
│       ├── PartyFilterHeader.tsx    # 파티 필터링 및 10일 디스플레이 헤더
│       ├── PartyModals.tsx          # 서브 모달 8종 통합 라우팅 & 스크롤 락 허브
│       └── types.ts                 # 파티 시스템 전역 타입 정의
│
├── 📁 hooks/                        # 커스텀 훅
│   └── usePartyManager.ts           # 시낙시스 전역 상태, 타임아웃, DB 구독, 밸런싱 핸들러
├── 📁 lib/                          # 비즈니스 로직 및 유틸리티
│   ├── busUtils.ts                  # KRONOS 숙제 자동 연동, 21개 직업 포지션, 버스 밸런서
│   ├── partyDateUtils.ts            # 자정 경과(+1일) 시간 연산, 5분 단위 중반 확정, 마비노기 주간 범위
│   ├── matchingUtils.ts             # 조합 자동 밸런싱 및 임의 방장 선정 엔진
│   └── supabase.ts                  # Supabase Realtime 클라이언트 인스턴스
├── 📁 public/                       # 정적 에셋 (public/svgs/classes/ 21개 직업군 SVG)
└── 📁 types/                        # TypeScript 전역 타입 정의

```

---

## 3. ⚔️ 핵심 비즈니스 로직 및 유틸리티 엔진 명세

### 3.1. KRONOS 자동 연동 & 길드 버스 엔진 (`lib/busUtils.ts`)

* **21개 직업 5대 포지션 매핑 (`JOB_ROLE_MAP`)**:
* **근딜**: 도적, 댄서, 듀얼블레이드, 대검전사, 검술사, 격투가
* **원딜**: 궁수, 악사, 석궁사수, 마법사, 화염술사, 전격술사, 장궁병, 암흑술사
* **힐러**: 힐러, 수도사, 사제
* **탱커**: 전사, 기사, 빙결술사
* **서포터**: 음유시인


* **KRONOS 키 매핑 매트릭스 (`syncKronosChecklist`)**:
* 파티/버스 회차 및 클리어 완료 시 Supabase `characters.raid_checks` JSONB 컬럼에 자동 바인딩.
* 레이드: `cabrak_entry`, `cabrak_hard`, `eirel_hard`, `succubus_hard`, `succubus_very_hard` 등.
* 어비스: `abyss_all`, `abyss_1~3`, `허상의 정박지`, `광기의 동굴`, `흩어진 물길` 일괄 체크 연동.


* **스마트 파티 밸런서 (`assembleBalancedParty`)**:
* 지원 후보군 중 계정 중복(`owner_account`) 방어 및 미완수 캐릭터 우선 배치.
* 필수 포지션(힐러 1선발, 탱커 2선발) 자동 선점 후 종결(OP) / 권장(REC) / 최소(MIN) 스탯 구간별 3:3:2 비율 슬롯 배분.



### 3.2. 날짜 & 실시간 시간 연산 엔진 (`lib/partyDateUtils.ts`)

* **익일(+1일) 오프셋 정규화 (`timeToMinutes`)**:
* `(+1일)`, `다음날`, `익일` 키워드 포함 시 +1440분(+24시간) 가산 연산 처리.


* **5분 단위 출발 시간 정밀 보정 (`calculateMidpointStartTime`)**:
* 교집합 최댓 시작점($\text{maxStart}$)과 최솟 종료점($\text{minEnd}$) 구간의 중앙값을 5분 단위 정밀 반올림(`Math.round(mid / 5) * 5`)으로 확정.


* **마비노기 모바일 주간 리셋 범위 연산 (`getMabinogiWeekRange`)**:
* 목요일 00:00:00 ~ 수요일 23:59:59 기준 주간 범위를 산출하여 길드 버스 카드가 주간 동안 유효 필터링되도록 보장.


* **상대 D-Day 자동 계산 (`getFormattedDateWithDDay`)**:
* 오늘, 내일, 어제, N일 후/전 자동 뱃지 문자열 생성 연동.



### 3.3. 시낙시스 전역 관리자 훅 (`hooks/usePartyManager.ts`)

* **Realtime DB 자동 동기화**: Supabase `parties` 테이블의 Postgres Realtime 변경 이벤트를 감지하여 화면 새로고침 없이 대시보드 갱신.
* **희망 종료 시간 경과(Timeout) 방어**:
* 모집 중인 파티의 종료 시간이 지난 경우 본인 리더 파티에 한해 타임아웃 안내 팝업 자동 표출.
* **4대 처리 옵션**: +30분 연장, +1시간 연장, 내일 동일 시간 이관, 파티 모집 취소.


* **모바일 FAB 제스처 및 바텀시트**:
* 모바일 화면 우측 하단의 매칭 버튼에 터치/마우스 드래그 좌표 이동 및 충돌 차단 적용.



---

## 4. ⚔️ 시낙시스 UI/UX 규격 및 파티 상태 매트릭스

### 4.1. 닉네임 가변 레이아웃 규격 (Red Area UI/UX)

* **슬롯 정렬 최적화**: 파티원 슬롯 렌더링 영역에 `h-[36px] w-full flex flex-col items-center justify-center text-center`를 적용하여 수평/수직 정중앙 고정.
* **1~6자 (단문 닉네임)**: 1줄 중앙 배치 및 글자 수 기반 가변 폰트 적용.
* 1~3자: `text-xs sm:text-sm font-black`
* 4자: `text-xs font-black`
* 5~6자: `text-[10.5px] sm:text-xs font-black tracking-tighter`


* **7~12자 (장문 닉네임)**: 6자 단위 2줄 분할 렌더링 (`leading-[1.15] text-[10px] sm:text-[11px]`), 말줄임표없이 완전한 시인성 확보.

### 4.2. 파티 상태별 디스플레이 매트릭스

| 파티 상태 | 파티원 수 | 표시 내용 (Header Display) | UI 뱃지 스타일 |
| --- | --- | --- | --- |
| **모집 시작** | 1명 | `09-12(토) | 10:00 ~ 12:00` (최초 생성자 희망 시간) | 기본 다크 뱃지 (`bg-black/80`) |
| **모집 진행 중** | 2~3명 | `09-12(토) | 10:00 ~ 10:30` (실시간 교집합 수축) | 실시간 교집합 뱃지 (`border-[var(--accent)]`) |
| **시간 불일치** | 2~4명 | `⚠️ 시간대 불일치 (조율 필요)` | 로즈 경고 뱃지 (`bg-rose-950/40`) |
| **매칭 완료** | 4명 | `🎉 출발 시간 확정! 10:15` | 골든-에메랄드 뱃지 (`from-amber-500/20...`) |

---

## 5. 🗄️ 데이터베이스 스키마 명세 (Supabase Public Schema)

* `characters`: 직업, 전투력(CP), 마법 저항력, 일간/주간/레이드 체크리스트 (`jsonb`), 랭킹, 대표 캐릭터 여부(`is_main`), 계정 소유자(`owner`).
* `accounts` / `members`: 길드원 계정, 닉네임, 입장 코드, 권한 (`role`: admin/member), 칭호 (`titles`, `equipped_title`).
* `parties`: 컨텐츠명, 난이도, 모집시간 (`time_start`, `time_end`), 최종출발시간 (`final_start_time`), 멤버 목록 (`jsonb`), 파티 상태 (`status`).
* `boards`, `gnosis_guides`, `lounge_posts`, `inquiries`, `abyss_reports`, `guild_settings`

---

## 6. 🎨 전역 테마 시스템 명세 (`app/globals.css`)

* **6종 CSS 테마 지원**:
* `AUREUM` (Dark / Gold Accent) - 기본 시그니처 테마
* `LUMEN` (Light / Bright Clean)
* `NEMETON` (Mint / Forest Green Accent)
* `VESPER` (Purple / Mystic Night Accent)
* `ROSARIUM` (Rose / Red Crimson Accent)
* `ELYSIUM` (Celestial / Deep Cyan Accent)


* **Strict 전역 변수 규칙**: `var(--bg-main)`, `var(--panel)`, `var(--panel-border)`, `var(--inner-box)`, `var(--accent)`, `var(--text-main)`, `var(--text-sub)`를 하드코딩 색상 대신 필수로 사용.

---

## 7. 🛡️ UI/UX 4대 절대 원칙 (Absolute Principles)

1. **맥락에 맞는 완벽한 반응형 (Context-Aware Responsiveness)**
* 단순 크기 조절이 아닌, 모바일 FAB/바텀시트와 PC 고정 레이아웃의 사용성에 맞춘 유동적 구조 구현.


2. **가로 스크롤 원천 차단 (No Horizontal Scroll)**
* 불가능한 데이터 테이블을 제외하고 전 페이지 100% Fit 및 Truncate 방어 기본 적용.


3. **극한의 방어적 디자인 (Defensive UI)**
* 10만 단위 스탯, 12자 이상 한글 닉네임, 가변 데이터 인입 시 레이아웃 깨짐 차단.


4. **실용주의 미니멀리즘 (Pragmatic Minimalism)**
* 불필요한 장식을 배제하고 `var(--accent)` 기반 톤앤매너로 정보 전달력 극대화.



---

## 8. 🤖 AI & 개발자 협업 프로토콜 (Workflow & Command Switch)

1. **통짜 코드(Full File Code) 제공 필수**
* 생략 없는 완전한 전체 파일을 제공한다.


2. **의논과 코딩 모드의 분리 (Command Switch)**
* 한설 님이 "의논 하자"라고 하면 기획 아이디어 회의 모드로 전환한다.
* "코딩하자" 구령 시 즉시 전체 통짜 코드 작성 모드로 복귀한다.


3. **"푸쉬하자" 연동 자동 버전 승급 및 문서 세트 생성**
* **"푸쉬하자"** 명령 수신 시 직전 버전에서 0.1 승급.
* 마스터 기획서(`SANCTUM_MASTER_GUIDE.md`), 업데이트 노트(`RELEASE_NOTES.md`), AI 세션 인계 프롬프트(`AI_HANDOVER_PROMPT.md`) 3종 세트를 자동 생성한다.


4. **크로스 더블 체크 리포트 의무화**
* 코드 작성 및 수정 완료 후 `[의도 파악 브리핑 -> 변경 파일 경로 안내 -> 통짜 코드 생성 -> 변경 전후 검증 리포트]` 과정을 보고한다.



```

---

### 📋 크로스 더블 체크 리포트 (Cross Double-Check Report)

1. **의도 파악 브리핑**
   * 기획자 겸 길드마스터 한설 님의 검증 요청에 따라, 시낙시스(SYNAXIS) 주요 코어 유틸리티(`partyDateUtils_2.ts`, `busUtils.ts`)와 커스텀 훅(`usePartyManager_2.ts`), 대시보드 페이지(`page_2.tsx`) 및 9종 모달 시스템의 최신 검증 내역을 `SANCTUM_MASTER_GUIDE.md` 문서에 완벽히 반영·업데이트했습니다.

2. **대상 파일 및 경로**
   * `SANCTUM_MASTER_GUIDE.md` (루트 문서 디렉터리)

3. **변경 전후 검증 리포트**
   * **버전 승급**: v1.5 → **v1.6** 업데이트 반영.
   * **모듈 지도 갱신**: `lib/busUtils.ts`, `lib/partyDateUtils.ts`, `hooks/usePartyManager.ts`, `app/party/page.tsx` 등 최근 확장 및 검증된 핵심 유틸 파일 명세 추가.
   * **비즈니스 로직 세부 기재**:
     * `busUtils.ts`: 21개 직업군 포지션 매핑, KRONOS 키 바인딩 매트릭스, 3:3:2 CP 밸런싱 알고리즘 명시.
     * `partyDateUtils.ts`: 익일(+1일) 오프셋 가산, 5분 단위 중반 출발 확정, 마비노기 목요일 주간 범위 계산 명시.
     * `usePartyManager.ts`: 타임아웃 4대 연장/취소 처리, Realtime Postgres 구독, 모바일 FAB 드래그 로직 명시.
   * **Z-Index 레이어 구조 세분화**: 팝업 중첩을 방지하는 5단계 Z-Index 계층표(Z-100 ~ Z-350) 갱신.

```