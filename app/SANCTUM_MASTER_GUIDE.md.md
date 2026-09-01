# 🏛️ SANCTUM (성역 길드 전용 플랫폼) 마스터 아키텍처 및 기획 지시서

본 문서는 `seongyeok-guild-manager` 프로젝트의 최신 폴더 구조, 컴포넌트 역할, 데이터 흐름, 그리고 프론트엔드/풀스택 개발자가 반드시 지켜야 할 절대 규칙을 정의한 단일 마스터 가이드입니다.

---

## 1. 프로젝트 기본 정보
*   **서비스명**: SANCTUM (마비노기 모바일 데이안 서버 '성역' 길드 전용 플랫폼)
*   **기술 스택**: Next.js (App Router), TypeScript, Tailwind CSS (v4), Supabase, Zustand/Context API (전역 상태)
*   **목표 오픈일**: 2026년 9월 14일 (v1.0 MVP 오픈)
*   **핵심 철학**: UI(화면)와 DB(데이터)의 무결성 유지, CSS 변수(`@theme`)를 활용한 실시간 전역 테마 동기화, 3단 Z-Index 레이어(배경 -> UI -> 스티커)의 철저한 격리.

---

## 2. 📁 최신 디렉터리 구조 및 역할 (Directory Structure)

```text
seongyeok-guild-manager/
├── 📁 app/                      # [Next.js App Router 기반 페이지 및 API 라우팅]
│   ├── 📁 admin/                # 관리자 전용 페이지
│   ├── 📁 api/                  # Supabase 및 외부 통신용 API 라우트
│   │   ├── analyze-item/, game-events/, guild-characters/, market/, sync-client/, sync-weekly/
│   ├── 📁 character/            # 크로노스 (캐릭터 관리 - 스탯, 직업, 숙제)
│   ├── 📁 customize/            # 테마 스튜디오 (CSS 변수, 배경, 스티커 커스텀)
│   ├── 📁 gnosis/               # 그노시스 (정보 공유 보드)
│   ├── 📁 login/                # 인증 및 로그인
│   ├── 📁 lounge/               # 아고라 (길드 라운지, PANTHEON 랭킹, ASTRA 현황)
│   ├── 📁 market/               # 엠포리온 (거래소 정보 추적)
│   ├── 📁 notice/               # 케리그마 (길드 공지사항)
│   ├── 📁 party/                # 시낙시스 (파티 매칭 보드)
│   ├── 📁 support/              # 로고스 (1:1 문의/건의)
│   ├── globals.css              # 전역 스타일 및 Tailwind @theme 변수 정의
│   ├── layout.tsx               # 👑 RootLayout: 전역 상태, 모듈 조립, 스마트 상단바 제어
│   └── page.tsx                 # 메인 대시보드 (체크보드, 타이머 등)
│
├── 📁 components/               # [재사용 가능한 모듈화 UI 컴포넌트]
│   ├── 📁 character/            # 캐릭터 관리 특화 컴포넌트 (모달, 스탯, 체크리스트 등)
│   ├── 📁 common/               # 공통 요소 (ClassIcon 등)
│   └── 📁 layout/               # 레이아웃 구성 요소
│       ├── MobileBottomSheet.tsx# 모바일 FAB 및 바텀 메뉴 시트
│       ├── Navbar.tsx           # 상단 네비게이션 및 계정 스위처
│       ├── StickerCanvas.tsx    # 스티커 듀얼 레이어 렌더링 및 툴바
│       └── ThemeModal.tsx       # 테마 변경 및 스티커 구출 모달
│
├── 📁 hooks/                    # [커스텀 React Hooks] (예: usePressAndHold.ts)
├── 📁 lib/                      # [비즈니스 로직 및 유틸리티]
│   ├── imageUtils.ts            # 이미지 오토트림 및 누끼 알고리즘
│   ├── matchingUtils.ts         # 파티 매칭 연산 유틸
│   └── supabase.ts              # Supabase DB 연결 클라이언트
│
├── 📁 public/                   # [정적 에셋]
│   └── 📁 svgs/classes/         # 21개 직업군 SVG 아이콘 자산
│
└── 📁 types/                    # [TypeScript 타입 정의] (layout.ts 등)