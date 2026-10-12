# IRIS 캐릭터 카드 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans after user plan review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카드별 연필·닉네임/주클래스·대표·추가1카드·추천수동선택 통일.
**Architecture:** 기존 본인 캐릭터/활성클래스/대표 필드와 서버 session 검증을 쓰는 제한 metadata API를 추가한다. Controller가 기존 저장 큐와 metadata 요청을 직렬화하며 디렉터리를 재조회한다. UI는 실제 등록 카드만 만든다.
**Tech Stack:** React/Next.js route handler, existing Supabase tables/session/ownership and IRIS queue.
**Spec:** `docs/superpowers/specs/2026-10-12-iris-compact-alerts-character-design.md` §3.

## Global Constraints

- 본인소유 UUID/기존id로 식별, account nickname/과거기록 전역치환/삭제 없음. 기존대표 `characters.is_main`, 활성클래스사용.
- 실제카드만·추가카드1개, 임의6개제한금지(기존조회상한100 유지). 긴12자닉/오래된 이름 보존.
- 기존입력초안·큐를 조용히 폐기하지 않는다. 중복/unknown 저장은 자동재시도금지.
- 새Schema/RPC/RLS·운영쓰기테스트·배포 없음. 원자적 대표전환이 필요한 DB변경은 별도승인.

## Review Focus

1. 타인/expired/pending계정/위조필드는 어떤 metadata도 쓰지 못한다.
2. 오래된nickname/job/대표snapshot은 다른창수정을 덮지 않고conflict로 남는다.
3. 대표clear→set부분실패는성공으로표시하지 않고현재값을읽어복구안내; 다중대표의전역원자성은현DB만으로보장했다고말하지않는다.
4. 큐 unknown/conflict·invalid draft·inflight동안metadata수정/추천전환이데이터를잃지않는다.
5. 빈계정/1/6/100카드·긴닉·legacy owner없는행·응답유실에서단일선택창/추가카드가안전하다.

### Task 1: 제한 metadata API·controller 직렬화

**Files:** Create `lib/irisCharacterManagement.ts`, `lib/server/irisCharacterManagement.ts`, `app/api/iris/character-management/route.ts`, `tests/iris-character-management.test.mjs`; Modify `app/api/iris/characters/route.ts`, `lib/irisDesktopTransport.ts`, `lib/irisDesktopController.ts` and related fixtures.
**Interfaces:** `CharacterMetaIntent={action:'create'|'update'|'makeMain',characterId?:string,nickname?:string,job?:string,expected?:{nickname:string,job:string,isMain:boolean}}`; no owner/account/score/check fields supplied by client. GET metadata returns owned characters/active jobs; POST bounded JSON with exact fields returns refreshed owned directory or409/503. `DesktopCharacter.isMain` is optional for legacy replies, normalized safely. Controller `manageCharacter(intent):Promise<void>` locks/drains/reconciles old scope then requests metadata; never queues metadata into old protected edit schema.

- [ ] RED: ownedcreate/update/main succeed; foreign IDs/sessions/extrafields/inactiveclass/blank·duplicate nickname/stale snapshot cause0writes. StableID/checks/levels unchanged onrename. Existinglegacy ownerless rows are read-only until ownership association is confirmed; no implicit claim. Mainpartialfailure/2mains readbackerror, lostreply noauto repeatedcreate. Controller inflight/unknown/invaliddraft/lateaccount guard.
- [ ] Run new tests and existing controller/transport suite; expected missing behavior fails.
- [ ] Verify current Supabase docs, use getSessionAccount/isPendingAccount/getServerSupabase and strict same-origin POST/bodylimit. Match id+owner and captured old metadata for CAS; preserve rawnullable oldflags. Newname≤12codepoints, unchangedlegacy longername can retainjobedit. Existingnamecollision409; no upsert masqueradingascreate. Representative uses existingclear/set pattern with postreadexactly1 before success; expose known non-atomic crossclient limit, no silent repair/DBmigration.
- [ ] Run synthetic DB-boundary/controllertests and tsc; no actual data writes. GET directory/catalog boundedbatch, no per-cardN+1.
- [ ] Review API/diff/optional commit `feat(iris): safely manage owned character metadata`.

### Task 2: 단일 선택창·연필/대표/추가 UI

**Files:** Create `components/iris/DesktopCharacterPicker.tsx`, `components/iris/DesktopCharacterEditor.tsx`, `tests/iris-character-management.browser.mjs`; Modify Center/page/StatsSession/StatsConfirmation/Stats/CSS and existing recommendation/selection fixtures.
**Interfaces:** Picker consumes owned directory/selectedId/busy and callbacks select/edit/add/makeMain. Editor consumes existingmeta/jobs/busy/error; emits only `CharacterMetaIntent`. Unified `onChooseOther()` closes recommendation first then requests same card picker; editor and picker are never opened behind another modal.

- [ ] RED: 0→onlyaddcard,1→existing+oneadd,6→six+oneadd,100→boundeddisabledadd with explanation; no placeholder slots. Cardselection and pencil are separate buttons, representative marker readable, labels/full12chars uncut. Validedit/add/main exactrequestonce; error/partial/unknown staysvisible. Everyinitial/switch/stat-confirmationother path opens samepicker; no different inlinecandidate chooser.
- [ ] Run new synthetic browser and recommendation scenarios; observe missing UI/path failure.
- [ ] Implement themedfocus/dialog dismissal with existing FocusDialog, metadata save buttons/queue status and jobs catalog. After success update directory/selected details and invalidate old recommendation observations; preserve unrelated queue/draft. Don't modify historical parties or login identity.
- [ ] Verify compact/modalheight, keyboard/Escape/outside, multiplefonts/widths; all synthregressions PASS, no realcreate/rename/main mutation.
- [ ] Inspect capture/diff/optional commit `feat(iris): unify character picker and editing cards`; record actual tests and remaining representative atomicity/legacy limitations in HANDOFF/relay.
