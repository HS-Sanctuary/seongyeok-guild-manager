# IRIS Synaxis Full Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** IRIS에서 생텀 시낙시스 목록·가입·매칭·길드버스 운영을 기존 엔진으로 이용한다.

**Architecture:** 공용 SynaxisSurface를 추출하고 IRIS 계정/활성 상태 공급자로 연결한다. 서버 쓰기는 기존 엔진과 권한을 유지하며 계정 ID 및 결과 불명 방어를 전달한다.

**Tech Stack:** 기존 Next.js/React/TypeScript/Supabase. 새 의존성 없음.

**Spec:** docs/superpowers/specs/2026-10-10-iris-synaxis-full-design.md

## Global Constraints

- 운영 DB/RLS/권한 변경·실제 파티 시험 생성/삭제·게임 조작·push·배포·공지 없음.
- 기존 dirty IRIS/native 및 개인 파일 삭제를 보존한다.
- 본인 캐릭터 선택, 운영진 버스 생성, 현재 운행자 컨트롤러의 서버 판정을 재사용한다.
- 로그인 계정당 채널 하나, 숨긴 탭의 반복/이벤트 조회 없음, 늦은 계정/조회 결과 무시. 새 파티/버스 레드닷은 숨김에도 보관하고 목록에 실제 반영된 항목만 확인 처리한다.
- 명시적 요청만 저장하며 결과 불명 요청은 자동 재전송하지 않는다.
- 320/390/768/1280px와 PC 18/20/22px, rem·테마·닉네임 전체 표시.

## Review Focus

- 다른 탭에서 쿠키 계정이 바뀌어도 이전 IRIS 화면의 요청은 새 계정으로 저장되지 않는다.
- 실제 요청은 성공했지만 응답이 끊겨도 재생성/재완료 요청이 자동 발생하지 않는다.
- 탭을 숨긴 뒤 늦은 조회/Realtime 이벤트가 기존 계정 화면을 다시 활성화하지 않는다.
- DB 난이도 순서가 달라도 레이드 최고 난이도, 어비스 매우 어려움이 선택된다.
- 좁은 화면의 포털 버스 수정/달력 중첩에서 초점·뒤쪽 카드·닫기 동작이 안전하다.

## Task 1: 계정·쓰기·난이도 계약

**Files:** lib/partySurfacePolicy.ts, components/party/PartySurfaceContext.tsx, lib/memberMutationClient.ts, lib/guildBusActions.ts, sync-checklist route, tests/iris-synaxis-surface.test.mjs

**Interfaces:** 공급자 context는 account{id,nickname,role}, active, locked, request(input,init)를 제공한다. partyDefaultDifficulty(item:ContentItem):string은 유효 난이도 중 기본값을 반환한다. scopedPartyRequest(accountId,current,storage,fetcher,onBusy)는 expectedAccountId와 계정별 receipt를 연결한다.

- [x] RED: 최고 난이도/어비스 기본, expectedAccountId, 중복/숨김/결과 불명 요청 차단과 서버 계정 불일치 테스트를 먼저 작성·실행한다.
- [x] GREEN: 공용 공급자와 요청 guard를 구현하고 기존 회원 mutation/회차 요청에 계정 ID를 전달한다.
- [x] 해당 Node 테스트 통과, 타입 확인, diff 검토. 무관한 변경은 커밋하지 않고 이 작업은 로컬 후보로 보존한다.

## Task 2: 공용 목록·매칭·가입·컨트롤러

**Files:** components/party/SynaxisSurface.tsx, app/party/page.tsx, hooks/usePartyManager.ts, hooks/usePartyCatalog.ts, GuildBusCard.tsx, BusEditModal.tsx, ContentSelectModal.tsx

**Interfaces:** SynaxisSurface는 공용 공급자를 읽고 동일한 PartyManager 결과로 기존 카드/모달을 렌더한다. 웹 기본 context=null은 기존 페이지 동작을 유지한다. usePartyManager의 IRIS context는 계정별 초안과 활성 수명을 사용한다.

- [x] RED: 실제 훅에서 활성 계정 본인 목록·세션 공급자의 채널 소유·숨김 읽기 차단·늦은 결과 무시·초안 격리, 실제 화면에서 일반/버스 탭 및 관리자 UI 테스트를 작성·실행한다.
- [x] GREEN: 기존 PartyPage 구성을 공용 화면으로 추출한다. IRIS는 목록 우선·두 탭·리모컨 접기·수동 조회와 오류 상태를 제공한다. 공용 카드/버스 수정은 Task1 request로 모든 쓰기 경계를 연결한다.
- [x] 웹 파티/길드버스 기존 회귀와 새 합성 테스트 통과, diff 검토.

## Task 3: IRIS 연결·레이아웃·최종 검증

**Files:** components/iris/DesktopSynaxisSurface.tsx, components/iris/desktop-synaxis-surface.css, app/iris/desktop/page.tsx, tests/iris-synaxis.fixture.mjs 및 iris-synaxis.browser.mjs, 인계/구조/결정 문서

**Interfaces:** DesktopSynaxisSurface({account,active,locked,onBusyChange})는 공용 공급자와 화면을 연결하고 legacy receipt를 포함해 불명확 요청을 안내한다. 기존 DesktopSynaxis 생성 초안과 크로노스 큐는 수정하지 않는다.

- [x] RED: 실제 React에서 목록→가입·매칭→달력·버스 운영 표시 및 긴 문구 폭/초점/모달 닫기를 확인하는 합성 테스트를 작성·실행한다.
- [x] GREEN: desktop 진입 연결, 좁은 카드·버튼·모달 안전 스타일과 결과 불명 확인 흐름을 구현한다.
- [x] 관련 및 전체 Node, npx tsc --noEmit, 분리 webpack build, 합성 브라우저 화면 검증. 운영 쓰기0을 유지한다.
- [x] 최종 독립 리뷰 후 중요 지적은 RED→GREEN 수정하고 문서에 검증/미완료를 기록한다. 공식 push/공지 없이 로컬로 인계한다.

## 실행 기록

- 한설이 설계 정리 후 바로 구현하도록 위임했으므로 문서별 추가 확인은 생략하고 직접 실행한다.
- 현재 codex/iris-checkboard-classes에 기존 미커밋 초안이 있어 새 worktree에서 누락시키지 않고 같은 checkout에서 겹치는 변경만 최소 수정한다. origin main ff-only pull 최신 확인.
