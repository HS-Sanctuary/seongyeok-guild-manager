# IRIS Checkboard and Classes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native inline execution after the human reviews this plan. No delegation is authorized by this document.

**Goal:** 선택 캐릭터의 크로노스 항목별 상태와 생텀에 저장된 클래스 레벨을 독립 읽기 전용 위젯으로 제공한다.

**Architecture:** 기존 서버 소유권 검증과 브라우저 중계를 확장한다. 동일 원본에서 요약·상세를 만들고 같은 선택 버전으로 원자 전달하며 native 공유 폴링으로 새 위젯을 갱신한다.

**Tech Stack:** Next.js/TypeScript, 기존 Supabase 클라이언트, Node.js, PowerShell STA, Windows Forms/C#.

**Spec:** `docs/superpowers/specs/2026-10-04-iris-checkboard-classes-design.md`

**2026-10-04 실행 기록:** 한설이 계획과 inline 실행을 승인했다. Task1 API, Task2 중계/state, Task3 native 모델, Task4 독립 UI/공유 갱신 배선을 로컬 구현하고 RED→GREEN 회귀 및 전체139/139·별도타입·웹빌드를 확인했다. 공유 모델 참조는 동적 assembly 파일 경로 대신 imports 병합 단일 assembly로 변경했다. 별도 agent 리뷰와 실제 사용자 새 위젯 대조/DPI·장시간은 아직 하지 않았다. 아래 목록은 최초 계획이며 세부 실행/판단은 `.superpowers/sdd/2026-10-04-iris-checkboard-classes/progress.md`와 HANDOFF를 따른다.

## Global Constraints

- 읽기 전용. DB/RLS/운영 쓰기·게임 조작·commit/push/배포 없음. 기존 미커밋 변경을 보존한다.
- `details:{schemaVersion:1,tasks,classes}`. tasks 키는 daily/weekly/abyss/raid이며 행은 `{id,name,completed,total}`, classes 행은 `{id,name,level}`.
- 각 범주 최대 200항목, 클래스 최대 100개, 이름 최대 120 Unicode 문자, ID 최대 100문자, 반복 total 최대 1000, 안전 정수 level 1~1000 또는 null.
- HTTP 본문 65,536바이트; JSON UTF-8 합산 크기도 중계 전 검사. 초과 데이터는 자르지 않는다.
- 기존 15초 직렬 중계, generation/selectionVersion, 60초 stale 비우기, 정확한 Origin/역할별 capability 유지.
- 자동 클래스 조회·게임 캐릭터 신원 추정·숙제 쓰기 제외. 클래스는 `생텀 저장값`, 미저장은 `미등록`.
- 매 태스크는 테스트 RED 확인 → 최소 구현 → GREEN 확인 → diff 확인. 커밋 단계는 사용자 명시 승인까지 보류한다.

## Review Focus

1. 일요일→월요일 반복 허용 횟수 감소: 레거시 체크를 임의 초기화하지 않는다(Task1).
2. 캐릭터 A 조회 중 B 선택: A 상세가 B 위젯에 나타나지 않는다(Task2).
3. 여러 바이트 문자로 합산 본문 초과: 일부 성공 대신 크기 제한 안내(Task2).
4. null/비정상 레벨: 임의 Lv.1 또는 캐릭터 Lv100으로 대체하지 않는다(Task1/3).
5. 긴 항목명·많은 목록·작은 작업 영역: 이름 전체 읽기/내부 스크롤·닫기 복구 유지(Task4).

---

### Task 1: 선택 캐릭터의 정규화 상세 GET

**Files:** Modify `lib/irisKronos.ts`, `app/api/iris/kronos/route.ts`; Test `tests/iris-api.test.mjs`.

**Interfaces:**
- Consumes: `getKronosTaskLists(tasks,now)`, 기존 `normalizeChecklist/isTaskChecked`, 캐릭터 체크와 `levels` name→number JSON, 활성 클래스 `{id,name}`.
- Produces: `buildIrisKronosDetails(character,tasks,contents,classes,now = new Date())` → `{schemaVersion:1,tasks:{daily,weekly,abyss,raid},classes:[{id:string,name:string,level:number|null}]}`. 기존 `buildIrisKronosSummary`를 공통 항목 해석으로 정리해 합계를 같은 행에서 계산한다. 입력 타입은 기존 체크 필드와 optional levels를 사용한다.

- [ ] 테스트 추가: 합성 캐릭터 일간1/1, 일반 주간1/1, 반복2/3, abyss0/1, raid1/1 상세와 summary 합계가 정확히 같음. `nexus_classes` 활성2개/비활성1개와 levels `{전사:65,마법사:'35',숨김:100}`에서 전사65·마법사null·숨김 미전달. nickname/owner/raw checks/intro 미전달, db.writes.length===0.
- [ ] `node --test tests/iris-api.test.mjs` 실행, 새 상세 부재로 FAIL 확인.
- [ ] 기존 함수 공통화를 최소 범위로 구현한다. API 캐릭터 select에 levels만 추가하고 카탈로그 Promise.all에 활성 클래스 `id,name`/ID순 조회를 추가한다. 기존 소유권 검증을 앞에 유지한다.
- [ ] 경계 테스트 추가: 범주200 성공/201 거부, 클래스100/101, 중복 ID, 120/121문자, 비정상 total; 숨김 카탈로그 제외. 일요일14완료→월요일8허용은 기존 period 오류 유지. 빈 카탈로그·미등록 레벨은 null, DB 오류는503.
- [ ] 같은 테스트 GREEN 및 `npx tsc --noEmit` exit0 확인. 실제 DB/개인 게임값 없이 대역만 사용한다.

### Task 2: 버전 상세의 중계와 메모리 검증

**Files:** Create `iris/kronos-details.mjs`; Modify `iris/connection-state.mjs`, `iris/connection-http.mjs`, `lib/irisRelay.ts`; Test `iris/connection-state.test.mjs`, `iris/connection-http.test.mjs`, `tests/iris-relay.test.mjs`.

**Interfaces:**
- Consumes: Task1의 details, 기존 summary와 캐릭터 선택 버전.
- Produces: `validateKronosDetails(details,summary)` → 새로 정규화된 상세 객체 또는 null. `ConnectionState.setSummary(generation,selectionVersion,characterId,summary,details?)` 유지형 확장. native snapshot에 details nullable 추가.

- [ ] 검증 테스트 추가: 같은 범주 duplicate·비정수·negative·완료>total·합계 불일치·schemaVersion2 거부; 상세 없는 기존 요약 수용(details=null). 유효 신형 응답에는 요약·상세 함께 표시. 신형 상세 거부 시 현재 상세/요약을 비워 정상 상태로 유지하지 않음.
- [ ] `node --test iris/connection-state.test.mjs iris/connection-http.test.mjs tests/iris-relay.test.mjs` RED 확인.
- [ ] 별도 validators 모듈에 전송 제한 구현, setSummary와 native snapshot/비우기 경로에 연결한다. HTTP summary route는 body.details를 전달하고 기존 인증을 유지한다.
- [ ] relay PUT summary body에 details를 추가, `new TextEncoder().encode(JSON.stringify(body)).byteLength` 검사로 65,536 초과 전송을 거부한다. 기존 오류 구분에 토큰/본문 없는 크기 제한 안내를 추가한다.
- [ ] 회귀 추가: A 응답이 B 선택 이후 도착하면409/버림; begin/disconnect/삭제/계정변경/stale60초 초과에서 details null; 65,536바이트 이하와 초과 멀티바이트 본문 경계, invalid 상세 이후 유효 재연결. default fetch/timer receiver 테스트 유지.
- [ ] 위 세 파일 GREEN, `npx tsc --noEmit` exit0 및 diff 확인.

### Task 3: Native 상세 표시 모델

**Files:** Modify `iris/overlay-support.cs`, `iris/overlay-support.tests.ps1`; Test `iris/overlay.test.mjs`.

**Interfaces:**
- Consumes: Task2의 native snapshot.details; 기존 ConnectionDisplay의 선택/상태.
- Produces: `KronosTaskDisplay {Id,Name,Completed,Total}`, `KronosClassDisplay {Id,Name,int? Level}`, ConnectionDisplay의 `Dictionary<string,List<KronosTaskDisplay>> Tasks`, `List<KronosClassDisplay> Classes`, `bool HasDetails`. Clear/Expire는 모두 비운다.

- [ ] PS 합성 테스트 추가: 정상 상세 각 범주 횟수, Unicode 이름 보존, null 미등록, 상세 없는 old snapshot HasDetails=false, invalid detail 및 stale/선택변경의 전체 비우기.
- [ ] `node --test iris/overlay.test.mjs` RED 확인(새 표시 모델 없음).
- [ ] ConnectionDisplay.Apply에 schema/상한/합계 검사를 추가하고 유효 모델을 원자 교체한다. 게임 SnapshotDisplay는 수정하지 않는다.
- [ ] `node --test iris/overlay.test.mjs` GREEN 확인. 컴파일 환경 제한이면 원인을 기록하고 실제 GUI 검증 성공으로 대체하지 않는다.

### Task 4: 독립 체크보드 UI와 통합

**Files:** Create `iris/overlay-checkboard.cs`, `iris/overlay-checkboard.tests.ps1`, `iris/overlay-checkboard.test.mjs`; Modify `iris/overlay.ps1`, `iris/README.md`, `iris/ARCHITECTURE.md`, `docs/HANDOFF.md`, `docs/IRIS_WIDGET_ROADMAP.md`, `docs/relay/TO_SOONWOL.md`.

**Interfaces:**
- Consumes: Task3 모델, OverlayWindow와 기존 테마/불투명도/클릭통과/모듈 show/hide 수명주기.
- Produces: `Iris.CheckboardWindow : OverlayWindow`, `Apply(string nickname,string status,Dictionary<string,List<KronosTaskDisplay>> tasks,List<KronosClassDisplay> classes,bool hasDetails)`, `Clear(string status)`. 별도 Add-Type compilation에 support 어셈블리를 참조해 같은 표시 타입을 사용한다.

- [ ] Windows 테스트 harness에서 기본 창 생성, 범주 아코디언, 남은 항목 필터의 합계불변, no remaining vs empty catalog 구분, 클래스 미등록 표시, Clear 후 이전 텍스트 없음 assertions 작성한다. Node wrapper는 기존 overlay.test 방식으로 결과를 테스트하고 non-Windows skip한다.
- [ ] `node --test iris/overlay-checkboard.test.mjs` RED 확인(위젯 미구현).
- [ ] 새 파일에 화면 영역 내 크기/내부 스크롤, 전체 제목 줄바꿈, 범주 버튼·읽기상태·필터·클래스 아코디언 구현한다. 명칭 `크로노스 체크보드`, `생텀 기록 · 읽기 전용`, `클래스 · 생텀 저장값`, `미등록` 유지.
- [ ] overlay.ps1은 새 클래스를 로드하고 센터 상단 숙제 진입점·기존 모듈 목록에 등록한다. 공유 Update-IrisConnection에서 선택 이름/상세를 전달한다. 숨김/만료/전환은 Clear, 닫기는 hide, 센터/트레이로 복구한다. 기존 마우스/단축키/테마 적용을 함께 배선하고 별도 HTTP/DB 폴링은 추가하지 않는다.
- [ ] Windows 회귀 추가: 12자 nickname·120자 항목명·많은 목록·작은 화면영역 내부 스크롤, ×→복구, 테마6/불투명도 적용, 클릭통과 복구; Clear가 필터/아코디언 선택과 관계없이 데이터를 제거한다.
- [ ] `node --test` 전체, `npx tsc --noEmit`, `npm run build`, `git diff --check` 실행. build가 환경상 실패하면 로그에서 비밀값 제거 후 미완료로 기록한다.
- [ ] docs에 실제 자동 테스트 결과와 수동 대기를 구분한다. 사용자 안내: IRIS 종료 확인 후 재실행 → 기존 localhost `/iris` 새 연결 → 캐릭터 확인 → 센터 숙제. 웹 `/character`와 항목/클래스 저장값 대조, 닫기/복구·필터·스크롤 확인 요청. 로그인 입력/게임 조작을 대신하지 않는다.

## 계획 자기 검토·실행 조건

Task1 API와 Task2 전송, Task3 native 모델, Task4 위젯/통합으로 각 경계에 회귀가 있다. 상세 없는 기존 계약을 유지하고 신형 잘못된 계약은 안전하게 비운다. 문서 설계의 네 범주·클래스·출처·필터·수명주기·크기·기간·N+1 방지·보안·운영 제외를 모두 태스크에 반영했다. 새로운 패키지/스키마는 필요하지 않는다.

한설의 계획 검토/native inline 실행 승인 뒤 로컬 구현했다. 운영 권한·게임 조작·추가 쓰기로 자동 확장하지 않는다. 독립 리뷰 agent 실행은 별도 명시 승인 없이는 시작하지 않으며, 해당 검증은 아직 대기다.
