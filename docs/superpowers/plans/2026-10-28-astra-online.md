# ASTRA 통합 온라인 실행 계획
Spec: ../specs/2026-10-28-astra-online-design.md
로컬 구현만, commit/push 없음. 기존 집 개인12/ACK/원장/옛 worktree 유지.

## Task 1 — 서버와 순수 계약
새 lib/accountOnline.ts, lib/server/accountOnline.ts, app/api/account/online/route.ts 및 supabase/proposals/20261028_account_online.sql.
RED: 다중 기기 OR/기한 만료/sequence/닫힌 연결/계정 위조/feature disabled/오류 검사.
GREEN: 입력 제한, 세션해시 RPC, strict 응답, 권한·수명 SQL 제안.

## Task 2 — native 수명 연결
desktop-online.cs coordinator + 전용 host partial; 기존 WebView Initialize/Dispose에서 연결. 폴링은 CookieManager만15초, 네트워크300초/한번만. HttpWebRequest fixed origin, redirect 금지/timeout/제한 응답, 토큰은 메모리만.
RED→GREEN 합성 C# 쿠키변경·기기·응답유실·숨김·종료·disabled; private native compile.

## Task 3 — 웹·ASTRA 연결
공통 reporter, ASTRA online count/filter/card. disabled 때 기존 웹 ASTRA Presence 표기를 명확히 유지; enabled/error 때 anonymous Presence를 권위로 합치지 않음. 실제 React/합성 fetch, 계정/늦은응답/만료/모바일.
기존 활동·CHRONOS 저장·재화·ERGON C/D-0/잠금 회귀 보존.

## Task 4 — 검증과 인계
전체 Node, 관련 React/native, 타입/관련 lint/격리 빌드. 기존 실패는 구분. SQL 실제 PG 및 WebView 트레이 실서버 검증은 미실행 표기. 무료 예상량/승인 경계 한국어 QA. 최종 독립 안전 검토 1회 후 중요 사항 실패 재현·수정.

후속 마감은 docs/ASTRA_ONLINE_CLOSEOUT_20261028.md의300초/720초 정책과 실제 PG 검증 대기·선별 전송 경계를 따른다.