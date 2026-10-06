# IRIS Character Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans inline. 사용자 자율 실행·후보고 지시로 중간 승인 대기는 생략한다.

**Goal:** native에서 본인 캐릭터를 확인 선택하고 그 캐릭터의 생텀 크로노스 읽기 요약을 받는다.
**Architecture:** 인증은 브라우저 세션에 남고 local server는 제한된 데이터 중계 상태를 메모리에 유지한다. native/browser capability는 분리한다.
**Tech Stack:** Node, Next.js server API, WinForms/PowerShell.
**Spec:** `docs/superpowers/specs/2026-10-03-iris-character-kronos-design.md`

## Global Constraints

- localhost:3000/127.0.0.1:3000 + loopback4317만. 운영 origin 추가 금지.
- 계정 쿠키/코드/native capability는 브라우저와 native 사이에 복사하지 않음.
- DB/권한/게임 조작/배포/commit/push 없음. 캐릭터 ID를 게임 UUID로 부르지 않음.
- 요약60초 freshness, 이전 캐릭터/연결 결과 폐기. 내 캐릭터 소유 확인은 서버가 수행.

## Review Focus

- 숫자/문자열 ID가 혼재하는 기존 행을 UUID라고 가정하지 않음.
- 두 캐릭터의 요약 응답 순서 역전.
- 다른 계정으로 전환하거나 소유 목록에서 삭제된 선택.
- 브라우저 background timer 정지/탭 닫힘 이후 정상 표시 금지.
- native capability가 기존 다른 서버에 유출되지 않음.

### Task 1: 메모리 중계 상태

**Files:** create `iris/connection-state.mjs`, `iris/connection-state.test.mjs`.
**Interfaces:** `new ConnectionState({now})`; begin()->generation; setCharacters(generation,{accountId,characters})->boolean; select(generation,id)->selectionVersion|null; setSummary(generation,selectionVersion,characterId,summary)->boolean; snapshot()->{generation,selectionVersion,accountId,characters,selectedId,summary,status}; disconnect().

- [ ] tests: 다른 선택 후 오래된 summary 거부, 계정 변경 시 선택/요약 제거, 목록에서 선택 삭제, 60초 초과 시 stale 삭제, 잘못된 summary/목록 및 외부 mutation 방어. count bounds0..10000, <=total; 최대100캐릭터/닉네임12자/ID100자.
- [ ] `node --test iris/connection-state.test.mjs` missing feature FAIL.
- [ ] 위 계약의 in-memory 상태 구현. 인증을 대신하지 않으며 서버 handler가 호출 전에 역할별 token 검증해야 함.
- [ ] tests GREEN + 전체 suite, ledger 기록. 아직 server/native로 통합 전임을 명시.

### Task 2: loopback 역할별 HTTP 경계

**Files:** modify `iris/server.mjs`; create focused handler/test.
**Interfaces:** 서버 시작 native token을 메모리 인자로 받고 native connect/select/state와 browser consent/characters/summary/selection routes를 분리. native 요청은 무Origin+token, browser 요청은 exact origin+token.

- [ ] wrongHost/Origin/token/method/oversize/expired/revoked RED fixtures.
- [ ] native 토큰이 없거나 소유 불명 서버면 native 연결 endpoints 비활성. 게임 read endpoint 기존 보존.
- [ ] 연결 세대/선택 버전 확인, 30분 browser token/60초 state freshness, 원본 로그 금지.
- [ ] 실제 HTTP controlled input tests 및 server subprocess 종료 검증.

### Task 3: 인증된 생텀 읽기 API·브라우저

**Files:** modify `/api/iris/characters`, `app/iris/page.tsx`; create `/api/iris/kronos` and API tests.

- [ ] schema 기준 캐릭터 ID 타입·기존 catalog 체크 helper 확인. session/ownership/legacy/failure RED fixtures.
- [ ] 목록 id/accountId 최소 반환, 요약 GET read만. session검사/소유조회/catalog/helper 재사용. 다른 사용자의 rawJSON/메모는 반환하지 않음.
- [ ] browser 명시 전달 동의, 한 in-flight timer, auth실패 stateclear, selection epoch늦은결과 폐기.
- [ ] API/타입/빌드/로그인된 local 화면 검증. 운영 DB 테스트 writes 없음.

### Task 4: native 캐릭터 선택·기억

**Files:** native support and dedicated selector widget; `iris/overlay.ps1` integration.

- [ ] account별 기억 allowlist/소유목록 재확인/수동 게임캐릭터 확인/긴12자 테스트.
- [ ] 생텀 요약 별도 모듈; CLI game mission과 구분. 선택 전/실패/stale 즉시비움.
- [ ] browser 뒤열기 요청 가능성 별도검증, 보장 못하면 명시 열기버튼. 다른앱 focus강제조작 없음.
- [ ] 종료·재연결·탭닫기·로그아웃/늦은응답 테스트, 사용자 게임 수동 확인은 별도.

### Task 5: 전체 검증·인계

- [ ] 최신 전체 suite/타입/빌드/diff, 한 fresh read-only reviewer. 사용자 확인 범위 분리.
- [ ] HANDOFF/relay/IRIS 구조 문서 갱신. 공개 노트/배포·DB 변화 없음.

## Execution ledger

- Task3~4 최종 재검증: idle-hide 후속 포함 전체123/123·별도 타입·웹 빌드·diff 검증. 독립 재검토 추가 지적 없음. 체크박스 중 실제 로그인/수동 게임/OS focus/DPI 검증은 미완료로 유지한다. 기능 코드 로컬 후보까지이며 설치형/운영 준비 완료가 아니다.

- Task3~4 후속: 본인 목록·소유 확인 요약 GET/공통 KST catalog/동의 relay, owned child private stdin bootstrap, native 선택·기억 제안·수동 확인·별도 크로노스 요약 구현. 기능 부재/API/parser/계정409/native클래스 RED→GREEN. 전체123/123/타입/빌드 통과(마지막 idle-hide 변경은 재검증 예정). 실제 로그인/게임/DPI/브라우저 focus 확인은 별도 대기이며 checkbox 전체 완료 처리하지 않는다.
- 독립 리뷰 대응: 계정409 테스트가 same-origin API에 잘못 걸리던 fixture를 loopback 정확주소로 고침. 구형 반복 기간 모순은 BETA-065 기록+summary503 failclosed로 의미 변경/데이터 초기화 방지. 숨김 직전에 완료된 native 응답과 복원 후 늦은 응답 폐기 회귀; idle-hide는 당시 존재한 task만 폐기하도록 후속 수정. 서버 소유 확인/EOF 테스트는 synthetic native HTTP만 실행, 게임 CLI action 없음.
- 운영 DB/권한/실데이터 쓰기·게임 조작·commit/push/배포 없음. 다음 write-checkboard는 항목별 읽기/로컬 변경 큐/부분 병합 저장 별도 설계 범위다.

- Ruling: 기존 미커밋 alpha 의존성을 보존하여 현재 폴더 inline 실행. 사용자 자율 진행 지시로 반복 승인 질문을 생략하며 보안 민감 외부 action/DB 구조/배포는 여전히 별도 승인.
- Pre-flight: Task1은 인증을 수행하지 않고 Task2 token-validation 뒤에만 호출. Task3 accountId는 인증 수단이 아니라 account-scope 구분값. Task4 기억은 latestownedlist에서 제안만 하며 게임신원 자동증명 없음.
- Task 1: `connection-state.mjs`와 5개 합성 데이터 회귀 RED→GREEN. 이전 캐릭터/연결 응답 폐기, account변경/삭제 선택 비우기, 60초 freshness, shape/countbounds/복사본 검증. null payload 예외도 재현 후 안전거부로 수정. **아직 server/native/browser에 연결하지 않았으며 캐릭터 선택 기능 완료가 아니다.** 다음 Task2 HTTP 역할별 인증 경계부터 진행할 것.
- Task 2 진행(12:43 예약 재개): `connection-http.mjs` 역할별 handler와 실제 server factory 연결. native 메모리 인자 없으면503, 정확한 Host/port·Origin·서로 다른 capability·browser 전달 동의·64KiB/5초 JSON·30분 만료/해제·generation/selectionVersion 거부 구현. 최초 handler 부재 및 server factory 부재 RED→GREEN, 7개 합성 HTTP 테스트 통과. 요청 본문이 늦게 도착하는 동안 연결 교체 시 기존 토큰을 다시 검사하는 회귀도 추가했다.
- Task 2 Ruling: 토큰을 환경변수/명령줄/파일로 공급하지 않는다. 현재 Windows launcher는 아직 owned native capability bootstrap을 전달하지 않으므로 기본 CLI 실행은 새 연결 경로503을 유지한다. Task4에서 직접 소유한 child process와 메모리 전달 경로를 연결할 것. 이 단계만으로 사용 가능한 캐릭터 선택 UI가 완료됐다고 보고하지 않는다.
- 테스트 보정: Node fetch는 사용자 지정 Host를 실제 wire에 전달하지 않음을 합성 echo 서버에서 확인했다. HTTP 경계 검증은 `http.request`로 바꿔 실제 wrongHost 403을 검사했다. import 테스트가 기존 자동 listen을 시작한 테스트 process는 해당 세션만 종료했고, server 직접 실행과 import를 분리했다. 아직 Task2 subprocess 종료 회귀/추가 HTTP 경계 검증과 독립 리뷰 마감은 남는다.
- Task2 HTTP slice 마감13:00: subprocess 회귀 추가/포트재바인딩 통과. 독립 리뷰 Important2건 수정(늦은native disconnect generation거부, 계정전환시 consent/token폐기) 각각 RED→GREEN, 전체105/105. 리뷰가 판단 제외한 bootstrap/UI/사용자동의화면/생텀인증·소유권API/실게임·포커스/운영준비는 Task3~4 또는 사용자검증으로 유지. 이번범위로 완료추정하지 않음. 추가minor없음. commit/push 없이 ledger를본문에유지.
