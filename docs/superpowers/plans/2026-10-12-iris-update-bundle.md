# IRIS 업데이트 묶음 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans after user plan review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 글꼴·축소/둥근창·알림/소리·캐릭터관리 묶음을 단계별로 완성한다.
**Architecture:** 독립4계획으로 나눠각각RED→GREEN을확인하되네이티브연결은순차로작업한다. 실제앱재시작은가능하면처음3네이티브변경을묶어1회만요청한다.
**Tech Stack:** 기존 Next.js/React·Supabase API/Realtime·WinForms/WebView2.
**Spec:** `docs/superpowers/specs/2026-10-12-iris-compact-alerts-character-design.md`.

## Global Constraints

- 순월사무실인계브랜치/기존dirty·현재완료후보보존. Git강제reset/강제종료0.
- 각계획의제한과계약을따르며명령목록조회외게임행동0,운영DB시험쓰기0,Schema/RLS변경0.
- 버전/공식push/배포/ZIP교체는별도승인. 현재대화직접순차실행권장,추가에이전트기본사용안함.

## Review Focus

1. 구native+새UI는목록/축소/소리불가를안내해도기존앱/큐를보존→폰트/축소/알림계획.
2. 새기능모달끼리/추천/종료확인이겹치지않고높이가읽기좋음→축소/알림/캐릭터계획.
3. 계정·로그아웃·늦은응답이범위/저장/알림을섞지않음→각UI/controller시험.
4. 최대화·바탕화면·다른앱·최소화·DPI·6~22pt는독립합성뒤사용자실확인→축소/폰트시험.
5. 메타데이터대표순차변경한계·제보unknown·소리실패를성공이라고안내하지않음→캐릭터/알림시험.

## 실행 체크

- [x] 사용자에게 이색인/세부계획 검토와 현재대화직접실행(Native)방법 확인받기.
- [x] [설치 글꼴 자동 목록](2026-10-12-iris-installed-fonts.md) 두Task 실행.
- [x] [축소바·둥근 모서리](2026-10-12-iris-compact-window.md) 두Task 실행.
- [x] [콘텐츠 알림·소리](2026-10-12-iris-content-alerts.md) 두Task 실행.
- [x] [캐릭터 관리·선택창](2026-10-12-iris-character-manager.md) 두Task 실행.
- [x] 묶음마감 `node --test tests/*.test.mjs`, 독립`npx tsc --noEmit`, 수정파일ESLint/diff, native addon/presentation/fonts/bridge/grip/WebView, 실제React합성통합흐름 실행. 실제출력에근거한결과/skip/실패를기록.
- [x] 비밀파일없는분리build·한설정상종료후native재시작/초기로그/중복앱0확인. 실제게임/소리수동확인은최종안내와HANDOFF로남김, 사용자실확인완료로표시하지않음.
- [x] HANDOFF/BETA_FEEDBACK/DECISIONS/masterguide/미ACKrelay에누적. 자체diff·미완료위험보고. 공식push는추가명시요청없이는하지않음.

## 자체검토

- 전체스펙은위4세부계획으로대응한다. 소리기본ON은사용자요청에맞춘제안,전체화면수동override/구nativefallback/원자대표한계는명시했다.
- 새bridge메서드는파일/URL/HWND/게임인수를받지않으며기존addon/store메시지형식은유지한다. 새형식만정확히검증한다.
- 로컬실행후단일fresh검토의중요문제는재현/수정했다. 전체Node442중439PASS/3기존skip·types/대상lint·격리웹/native빌드·관련합성browser PASS. 사소한보류와실제게임검증/대표비원자한계는HANDOFF에명시. 공식release완료는아니다.
