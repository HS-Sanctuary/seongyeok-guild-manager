# 길드버스 출발 가능 알림 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 신청 시간·완료/반복 상태를 반영한 서로 다른 4/8계정이 준비되면 해당 버스 관리자에게만 접속 중 알림을 보낸다.

**Architecture:** 기존 BusLiveTracker가 캐시된 파티의 준비 상태 전이를 추적한다. 기존 parties 구독의 이벤트와 로컬 60초 시계로 평가하며 DB 반복 조회·새 채널은 추가하지 않는다.

**Tech Stack:** TypeScript, React hooks, 기존 Supabase Realtime.

**Spec:** 한설의 2026-10-09 대화 승인(“후자가 좋겠어”), docs/DECISIONS.md의 길드버스 출발 가능 알림 절.

## Global Constraints

- 동일 계정 여러 캐릭터는 1계정, 정원은 4/8만 인정한다.
- 해당 버스의 현재 관리자만 수신한다. 전체 운영진·참가자 전송, 자동 출발, 운영 DB 변경은 제외한다.
- 최초/재연결 baseline에서는 과거 알림을 재생하지 않는다.
- 기존 폴더·미커밋 작업을 보존하고 commit/push는 하지 않는다.

## Review Focus

- 계정 UUID/닉네임·리더 캐릭터 이름의 소유 판별과 미확인 소유자 보수적 제외.
- 밤샘 신청 시간 및 완료/반복 플래그의 기존 편성 기준과 일치.
- 중복 UPDATE/타이머, 정원 미달 뒤 재충족, 회차 종료 후 재준비.
- 단절·재연결·cleanup·계정 전환 때 이전 세션 알림 방지.
- 최초 조회와 동시 실시간 이벤트 경합에서 잘못된 준비 상태를 만들지 않기.

### Task 1: 캐시 판정·실시간 연결과 회귀

**Files:** Modify lib/guildBusNotifications.ts, hooks/useNoticeNotifications.ts, tests/bus-live-notifications.test.mjs. 문서: DECISIONS/HANDOFF/MASTER_GUID/BETA_FEEDBACK/TO_SOONWOL.

**Interfaces:** BusLiveTracker.seed(parties,names,now?)의 baseline; takeReadyBuses(now:Date,isAdmin:boolean):Record<string,unknown>[]로 새롭게 준비된 본인 버스만 반환. 기존 update/participates API 유지.

- [x] 실제 알림 훅에서 3→4/7→8, 중복 계정, 관리자 전용, 시간 경계/DB 추가 조회0 회귀를 먼저 작성한다.
- [x] node --test tests/bus-live-notifications.test.mjs: 신규 준비 알림의 길이 0 오류로 RED 확인.
- [x] 기존 eligibility/운행자 판정 재사용, baseline 조용히 seed, UPDATE/INSERT 및 로컬 시계 평가·cleanup을 연결한다.
- [x] 관련 알림/버스/파티 회귀87/87, tsc, 대상 lib lint, 문서 기록 후 최종 git diff --check: PASS.
- [x] 좁힌 독립 리뷰 1회, 중요 지적은 회귀 RED→GREEN으로 수정한다.
- [x] 문서 및 사용자 확인 경로를 기록한다. 실제 운영 쓰기·push는 하지 않는다.
