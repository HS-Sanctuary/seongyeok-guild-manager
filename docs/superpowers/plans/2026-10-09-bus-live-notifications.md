# 길드버스 본인 참가 수정·접속 중 알림 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 본인 캐릭터만 추가/교체하고 기존 신청 시간을 보존하며 접속 중 참가자에게 수정 알림을 제공한다.
**Architecture:** 기존 수정 API와 알림 채널을 재사용한다. 다른 계정 참가자는 서버에서 합쳐 보존하고 클라이언트에서는 읽기 전용으로 표시한다. 실시간 이전 값은 접속 시 조회한 스냅샷과 비교한다.
**Tech Stack:** Next.js/React/TypeScript/Supabase, Node 합성 DB·React 브라우저 테스트.
**Spec:** docs/BETA_FEEDBACK.md의 2026-10-09 참가 범위 정정 및 한설의 접속 중 알림 승인.

## Global Constraints

- 현재 폴더의 기존 미커밋 작업을 보존한다. push/배포/운영 데이터 시험 쓰기는 하지 않는다.
- 다른 계정의 기존 참가자·시간·반복 설정은 수정하지 않는다. 본인 기존 시간도 유지한다.
- 신규 반복 조회와 새 알림 채널을 추가하지 않는다. 미접속 영속 알림은 제외한다.
- 운영 설정은 승인된 parties 실시간 전송만 변경한다. 데이터·권한·replica identity는 변경하지 않는다.
- 되돌리기: ALTER PUBLICATION supabase_realtime DROP TABLE public.parties; 기존 비활성 상태 복구.

## Review Focus

- 위조된 다른 계정 이름은 서버403.
- 본인 참가0명이어도 다른 참가자는 보존.
- 일정 변경이 기존 참가 시간을 덮지 않음.
- 회차 완료·스탯 갱신만으로 수정 알림 중복 없음.
- 계정 전환/언마운트 후 늦은 이벤트는 무시.

### Task 1: 본인 참가 수정 경계

Files: lib/server/guildBusSettings.ts, app/api/member-mutations/route.ts, components/party/modals/BusEditModal.tsx, BusCreateModal.tsx, components/party/GuildBusCard.tsx.
Interface: saveGuildBusSettings(db, party, input, ownedNames:Set<string>), BusEditModal.accountNickname.
- [x] 위조403·본인0명·시간보존 테스트 작성 및 실패 확인(3건).
- [x] 서버에서 본인 선택과 보존 참가자를 합치고 UI owner 필터·읽기 전용 요약·개별 시간 제거.
- [x] node --test tests/bus-settings.test.mjs 통과, 브라우저 테스트 own-directory 계약으로 갱신·통과.

### Task 2: 접속 중 변경 알림

Files: lib/guildBusNotifications.ts, hooks/useNoticeNotifications.ts, tests/bus-live-notifications.test.mjs.
Interface: describeBusChanges(before,after):string[], ownsBusEntry(party,names):boolean.
- [x] 참가자 수신·비참가자 제외·중복/회차 변경 제외·초기 조회/해제 경합 테스트 RED→GREEN.
- [x] 기존 party 채널에서 최초 스냅샷 조회와 UPDATE 비교. 알림함 경로 /party#guild-bus-ID.
- [x] 승인된 publication만 활성화, 읽기 전용 설정 재확인.

### Task 3: 범위 검증·인계

- [x] 관련 Node62/62·브라우저5/5·tsc·새 TS 파일 lint·diff check. 공유 파일 기존 lint 오류 보존, 전체 앱 빌드는 반복하지 않음(한설의 범위 검증 선호).
- [x] 신규 범위만 독립 리뷰하고 중요 문제를 회귀 테스트 후 수정.
- [x] BETA_FEEDBACK/HANDOFF/DECISIONS/MASTER_GUID/SCHEMA/릴레이 누적 갱신.
- [x] /party에서 본인 캐릭터와 변경 알림 확인 방법 인계 기록. 실제2계정 알림은 사용자 확인 필요.

## Ledger

- Ruling: 현재 폴더에서 이어가며 자동 커밋하지 않는다 — 한설의 기존 명시적 선택과 push 제한 — 잘못하면 인계가 누락되므로 문서·diff 보존.
- Ruling: 전체 회귀 대신 이 범위만 검증 — 기존 IRIS 별도 집계 실패와 반복 전체 검증 절약 요청 — 관계없는 회귀는 남을 수 있음.
- Pre-flight: Task1의 member 이름/시간 불변 규칙이 Task2의 참가 변경 분류에 연결됨. 알림은 원본 목록 비교하며 완료/스탯은 제외.
- 2026-10-09 운영 읽기 확인: parties_realtime_enabled=false, relreplident=d. 한설은 부하 설명 후 parties publication 활성화를 승인했다.
- Task1: 서버 RED3→GREEN15, 실제 모달 checkbox6→1 RED→GREEN, 합성 브라우저5/5.
- Task2: 실제 hook RED5→GREEN8, publication true/d 확인, 공개 클라이언트 SELECT/Reatime SUBSCRIBED.
- Final: fixed 신규/개명 캐릭터 알림 누락 — 회귀 기대2/실제1 RED→계정 UUID 비교 GREEN, 추가 조회0. characters publication은 비활성이므로 승인 없이 확대하지 않음.
- Final: minor (deferred): legacy startTime/endTime-only 참가자의 수정 화면 시간 안내 fallback은 실제 보존값과 다를 수 있음. 서버는 실제값 유지.
- Final: Ruling: 초기/재연결 기준 이전 이벤트 재전송·전역 기존 쓰기 권한 경로·운영 두 계정 시험·IRIS 전체 회귀는 이번 리뷰 밖 — 접속 중 알림 및 좁힌 구현 승인 — 미접속 알림/구 권한/관계없는 회귀는 별도 확인이 필요.
- Task3: complete 로컬 범위 — Node62/62, 실제 React 모달5/5, tsc exit0, 새 helper/BusEditModal lint exit0, diff check exit0. 읽기 진단 SELECT OK/SUBSCRIBED exit0, /party200. commit/push는 하지 않음. 전체 공유 파일 lint는 기존 오류21/경고9(새 unused 함수 제거 전 집계); 전체통과 주장하지 않음.
- Final review: Critical0/Important1 fixed/Minor1 deferred. 폐기/추가 구현 없이 사용자 요청 범위로 보존했다.
