# ASTRA 운영 전 안정화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. 작업은 승인된 로컬 후보와 합성 시험에 한정하며 commit/push는 하지 않는다.

**Goal:** 전역 만료 기록의 안전한 최소 정리와 운영0.4.3 UI를 보존한 격리 통합 시험을 구현한다.

**Architecture:** 기존 온라인/활동 계약과300초 heartbeat·720초 TTL·60초 조회·20분 활동을 재사용한다. 정리는 proposal과 별도 시험으로 구현하며 유효 세션의 sequence/종료 표식을 잃지 않게 한다. GUI는 소스 전용 사본에 운영0.4.3 변경을 선별 적용하고 운영 계정/프로필/게임 검색을 차단한다.

**Tech Stack:** TypeScript/React·native C#/WebView2·격리 PostgreSQL17·기존 소유권 검증 fixture.

**Spec:** 한설의 2026-10-29 「ASTRA 통합 온라인 — 최신 인계 수신 및 운영 전 안정화」 요청. 기존 야간 근거는 docs/ASTRA_ONLINE_NIGHT_QA_20261029.md.

## 공통 경계

- 기능 기준2ad9fc3, 운영main ca697706/IRIS0.4.3. 기존 worktree/ACK/개인16·옛후보·N04·로그·원장 보존.
- 운영 DB/flag/main/Production/공개 ZIP·metadata/실게임 변경0. 실제 GUI는 시험 소유 창·쿠키·합성 계정만 사용한다.
- 로컬 코드·시험·proposal·한국어 QA만 승인. Docker 부재 시 운영 URL로 대체하거나 미검증을 PASS로 표현하지 않는다.
- 전체 회귀는 변경 안정화 후 마지막에 수행하고 원문 실패는 보존한다.

## 설계 검토 초점

1. 종료/sequence 표식 정리 후 지연 요청의 부활 차단, 유효 세션의 정리 제외.
2. 다른 writer/정리기·세션 삭제/연장 경합, 잠금 순서·실패/rollback 보존.
3. 정원·상한과 인덱스·제한 batch, 요청마다 전체 스캔하지 않는 실행 조건.
4. 실제 WebView 계정ABA/종료/재시작/중복 실행과 합성 절전·장애의 연결 귀속.
5. 0.4.3 sidebar-return 보존, 실제 게임/사용자 앱 접근 차단, 테스트 사본의 출처 명시.

## Task 1 — 정리 proposal과 회귀

- [x] 기존 SQL/세션 보존 분석, 수동 유지보수·기존 요청에 제한적으로 편승하는 방식 비교 및 최소안 확정.
- [x] 신규 supabase/proposals/20261029_account_online_retention.sql과 전용 시험. RED → 최소 구현 → GREEN.
- [x] 격리 PG 실행 가능 여부 확인 완료. Docker/PG 부재로 실제 신규 retention SQL은 미실행이며 합성 15 PASS와 분리해 기록했다.
- [x] 정책의 호출·잠금·읽기/쓰기 비용 및 실행되지 않을 때의 한계를 보고한다.

## Task 2 — 0.4.3 격리 통합 검증

- [x] 기존 검증 builder/HTTP fixture 재사용, 운영 main의 필요한 UI 변경을 사본에만 적용·지문 대조.
- [x] 전체 DesktopWorkspace/인증 화면을 안전하게 격리할 수 있는지 먼저 검증. 부족하면 미실행 사유를 명확히 남긴다.
- [x] 합성 계정/실제 WebView 쿠키·늦은 응답·sidebar/floating/tray·종료/장애/재시작/중복·합성 절전 시험을 추가한다.
- [x] 실제 PC절전·사용자 IRIS·운영 세션/게임 접근0을 검증한다.

## Task 3 — 비용·최종 회귀·인계

- [x] 기존 실제 reporter/API의 가상40명·2연결·8/24시간 계측, 공식 무료 제한과 기존 사용량 미확인 구분.
- [x] 신규 SQL/테스트와 GUI 격리의 독립 안전 검토, 중요 지적을 관련 RED/GREEN으로 보완한다.
- [x] 전체 Node·native·React·TypeScript·변경 범위 lint·격리 build 최종 실행. 기존 lint/SKIP·GUI timeout/수령 이력 유지.
- [x] 한국어 QA/HANDOFF/순월→영겁 누적 인계·보존 지문 확인. commit/push 없이 보고 후 종료.
