# 📌 SANCTUM 프로젝트 상태 및 개발 기획지시서 (PROJECT_SPEC)

## 1. 프로젝트 기본 정보
- **서비스명**: SANCTUM (데이안 성역 길드 전용 플랫폼)
- **기술 스택**: Next.js (App Router), TypeScript, Tailwind CSS, Supabase
- **전역 레이아웃**: `app/layout.tsx` (3단 z-index 레이어, CSS 변수 기반 전역 테마)
- **목표 오픈일**: 2026년 9월 14일 (v1.0 MVP 오픈)

## 2. 전역 시스템 및 테마 설정 (필수 준수)
- **전역 테마 변수 (`PRESET_THEMES`)**: `--background`, `--panel`, `--panel-border`, `--inner-box`, `--text-main`, `--text-sub`, `--accent`, `--accent-fg`
- **스티커 및 레이어 구조 (`layout.tsx`)**: 스티커 렌더링 레이어 최상단 고정 (`z-index` 유지)
- **UI 스타일 규칙**: Tailwind 작성 시 hardcoded 색상보다 globals.css의 전역 CSS 테마 변수 사용 우선

## 3. 페이지별 구현 상태 및 개발 순서
- **[완료] 크로노스 (`app/character/page.tsx`)**: `Promise.all` 병렬 DB 저장 및 스탯 관리 최적화 완료
- **[완료] 아고라 (`app/lounge/page.tsx`)**: PANTHEON 5대 랭킹, ASTRA 길드원 현황, 로어 툴팁 및 Supabase 연동 완료
- **[진행 예정] 시낙시스 (SYNAXIS / `app/party/page.tsx`)**: 파티 매칭 게시판 (현재 작업 대상)
- **[대기] 그노시스 (GNOSIS / `app/gnosis/page.tsx`)**: 정보 공유 커뮤니티
- **[대기] 케리그마 (KERYGMA / `app/notice/page.tsx`)**: 길드 공지사항
- **[대기] 로고스 (LOGOS / `app/support/page.tsx`)**: 1:1 문의 및 건의사항