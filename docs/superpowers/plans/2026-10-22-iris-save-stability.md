# IRIS 저장 안정성·재화 보관·0.4.2 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution. Steps use checkbox (`- [ ]`) syntax for tracking. 설계는 한설 승인. 이 계획의 검토 후 제품 구현을 시작한다. 제품 commit/push는 별도 승인 경계를 확인한다.

**Goal:** 저장 대기 누적·전환 유실을 방지하고 연결 없이 마지막 재화를 확인하게 하며, 검증 후 ERGON 잠금 유지 상태의 0.4.2 업데이트를 제공한다.

**Architecture:** 기존 queue/CAS/직렬 controller를 유지하며 deadline과 전환 gate를 개선한다. 재화는 별도 native DPAPI 캐시에 저장하며 UI는 live와 last-known을 구분한다. 실행 원장·B-1/B-2·서버 스키마는 변경하지 않는다.

**Tech Stack:** 기존 TypeScript/React/Node 합성 fixture, C#/DPAPI/FileStream/PowerShell native fixture. 신규 패키지·유료 서비스 없음.

**Spec:** [승인 설계](../specs/2026-10-22-iris-save-stability-design.md). 기준 `a95c0768a490d18ff0f8ab4b1e0c62cd5c05bb33`.

## Global Constraints

- 실제 DB 시험 쓰기/추가 게임 CLI/재료 소비/사용자 보호 파일 접근·삭제/강제 재시작 금지.
- Supabase/Vercel 신규 저장/API/Realtime/유료 서비스0. 실제 Production 배포·main 병합은 기존 금지 유지. 0.4.2 공개 업데이트 요청이 이를 암묵 승인했다고 간주하지 않는다.
- 원래 checkout 개인12항목 보존. 순월 B-1/신규 진행 저장 원장·unknown 유지, B-2 보류.
- 실제 수량·ACK·로컬 보관 성공을 추정하지 않는다. 재화 캐시는 ERGON 가용 잔액이 아니다.
- 버전/업데이트 설명은 검증된 변경만 포함. 공개 ERGON 앱·플로팅·native 소비 잠금 유지.

## Review Focus

1. 전환 실패 후 다른 계정 응답이 현재 화면에 적용되는가: Task2 지연응답/epoch 합성.
2. 전송 중 새 revision이 이전 ACK로 지워지는가: Task1·2 동일항목 후속 변경 합성.
3. 부분 재화 응답이 과거 숫자를 null/0으로 덮는가: Task3 품목별 정상 시각 검증.
4. 일부 ACK만 확인됐는데 저장 완료가 표시되는가: Task4 잔여 pending/unknown UI 합성.
5. 공개 업데이트가 실행기 잠금을 우회하거나 이전 사용자 교체를 막는가: Task5 구버전 교체/공개 잠금 fixture.

### Task 1: deadline과 직렬 저장 재현

**Files:** Modify `lib/irisDesktopQueue.ts`; Test `tests/iris-desktop-queue.test.mjs`, `tests/iris-workspace-queue.test.mjs`.

**Interfaces:** 기존 edit/editWorkspace/saveNow/claim/settle/snapshot 스키마3 유지. leaveCharacter는 pending을 즉시 due로 만드는 계약으로 변경한다. unknown/conflict/expired는 대상이 아니다.

- [ ] 실패 시험: t=0 최초 수정, t=1000~4000 임무5항목 수정 → 모두 deadline15000. 같은항목 변경/취소는 원래 baseline 유지·불필요 쓰기0. 다른 scope 기한 독립.
- [ ] `node --test tests/iris-desktop-queue.test.mjs tests/iris-workspace-queue.test.mjs`로 새 기대값의 RED 확인. 기존 trailing-debounce 기대는 명시적으로 새 계약으로 교체하고 보호 assertion은 유지한다.
- [ ] 신규 pending의 기한은 같은 scope 열린 pending 중 가장 이른 기한과 now+15000의 최솟값을 사용한다. 기존 inflight 내용/ID는 수정하지 않는다. 실패 phase는 재예약하지 않는다.
- [ ] 같은 명령으로 GREEN 확인. 추가로 전송중 새 revision/기간 경계/복원 inflight→unknown/500건 제한을 재검증한다.

### Task 2: 인증 유지 전환과 실패 선택

**Files:** Modify `lib/irisDesktopController.ts`, `app/iris/desktop/page.tsx`, `components/iris/DesktopSaveStatus.tsx`; Test `tests/iris-desktop-controller.test.mjs`, `tests/iris-desktop-ui.browser.mjs` 및 신규 `tests/iris-save-transition.browser.mjs`.

**Interfaces:** `selectCharacter(id:string, disposition:'save'|'keep'='save')`, `switchAccount(id:string, disposition:'save'|'keep'='save')`. login도 기존 계정이 있으면 default save 경계를 적용한다. 기존 logout/shutdown의 명시적 save/keep/discard 의미는 유지한다. 재시도 UI는 고정 전환 intent를 다시 실행하며 keep은 보관 성공 후에만 전환한다.

- [ ] RED: 5개 baseline 항목이면 details 검사5/save5·단일 inflight, 기한 후 추가15초 대기 없음. 이미 desired 응답은 save 생략. 첫 실패 후 다른 항목 처리와 동일항목 후속 차단을 각각 확인한다.
- [ ] RED: 전환 중 느린 save→새 입력 차단→ACK 이후 새 details; 계정 switch 호출보다 구계정 save가 먼저. 401/응답유실이면 전환 안 됨·큐 보존. 다른 계정 항목 미삭제. 잘못된 클래스 초안 유지.
- [ ] 전환 gate를 편집/재진입/flush와 통합한다. 기존 계정·epoch를 캡처하고 await 뒤 다시 대조한다. save 실패의 계정 null 처리를 포함해 null dereference나 잘못된 세션 전송이 없는지 확인한다.
- [ ] 실패 안내는 ‘재시도 / 이 PC에 보관 후 전환 / 돌아가기’. keep도 내구성 실패 시 중단한다. unknown 자동 복구/재전송은 금지한다.
- [ ] 관련 Node/브라우저 GREEN, 저장 도중 종료·세션만료 재로그인·지연응답·캐릭터 왕복을 검증한다. 종료 keep은 네트워크 없이 유지한다.

### Task 3: 별도 재화 캐시

**Files:** Create `lib/irisCurrencyCache.ts`, `iris/desktop-currency-store.cs`, `iris/desktop-currency-store.fixture.cs`, `iris/desktop-currency-store.tests.ps1`, `tests/iris-currency-cache.test.mjs`; Modify `lib/irisDesktopStore.ts`, `iris/desktop-bridge.cs`, `iris/desktop-webview.cs`, `iris/desktop.ps1`, `iris/build-beta.ps1`.

**Interfaces:** `CurrencyCacheView={schemaVersion:1,environment:'development'|'production',accountId:string,attribution:'unverified',items:{name:string,amount:number,observedAt:string}[]}`. `parseCurrencyCache(value:unknown,scope:{environment:string,accountId:string}):CurrencyCacheView`는 통신 입력을 엄격하게 검증한다. `mergeCurrencyCache(previous:CurrencyCacheView|null,incoming:CurrencySnapshot,scope):CurrencyCacheView`는 null/누락/오래된 응답으로 정상 수치를 덮지 않는다.

native proposed bridge: `store.currencies.load` payload `{accountId}` → view|null; `store.currencies.observe` payload `{accountId,snapshot}` → persisted view. これは未実装メソッドである。既存 game.currencies.read の正常応答と同じdocument/epochに結び付くnative観測だけ保存でき、UIが任意数字を保存証拠として提出できないようobserve時にnative保持観測と一致確認する。

- [ ] RED Node: strict environment/account/未確認帰属、0・大数・重複名・未来/不正時刻、null/空応答/古い応答、品目ごとの時刻、他scope拒否。
- [ ] RED native: 一時rootのみでDPAPI/別環境・別account・上限200品目/1MiB・失敗時旧ファイル保持・原子replace/flush・backup復旧/破損原本保護・同時writerを確認する。実際のユーザー保存ディレクトリは開かない。
- [ ] Implement separate cache store using desktop-store encryption/atomic-file pattern, not its queue payload/path/entropy. Use fixed currency namespace; hash account identifiers for filename. Null/empty is not deletion. Restored backup remains visibly last-known.
- [ ] native authority: bind cache IO to trusted environment/document epoch; capture account on read, reject observation after context change; do not assert actual game-character ownership. Client cache API has no access to arbitrary root paths.
- [ ] Add fixed bridge allowlist/parser and host binding, compile sources in both entrypoints. Run new Node/native fixtures and existing desktop-store/bridge/release package regressions. No CLI invocation.

### Task 4: 재화 화면·저장 상태 및 전수 점검

**Files:** Modify `components/iris/DesktopCurrencies.tsx`, `components/iris/DesktopWorkspace.tsx`, `components/iris/DesktopSaveStatus.tsx`, `app/iris/desktop/page.tsx`; Create `tests/iris-currency-cache.browser.mjs`, `docs/IRIS_SAVE_STABILITY_QA_20261022.md`; update `docs/BETA_FEEDBACK.md` in isolated worktree only.

**Interfaces:** currency UI receives scoped cache load/observe callbacks from native bridge and separate live read; cached values never flow back through `readCurrencies` into ERGON. Display cache item timestamp independently when observations differ. Transition intent/status belongs to page/controller, not queue data format.

- [ ] RED React: last-known on start/offline, full KST date/time, attribution warning/manual refresh, failed refresh retaining data, late old-account response, no cache→ERGON live path. Cache write failure is distinct from query success.
- [ ] RED React: pending/inflight/unknown distinct in mission rows; inline save ACK indication not hidden immediately; partial successes with pending are not whole-scope saved. Local-store failure never says stored.
- [ ] Implement readable minimal labels: ‘마지막 확인 기록’, ‘게임 연결이 끊겨 마지막 확인값을 보여주고 있어요’, ‘게임 캐릭터 귀속 미확인’, ‘새로고침’. No invented balance/date examples in product defaults.
- [ ] Audit actual contracts for homework/classes/barter/shop/missions/stats/SYNAXIS/settings/ERGON/close. QA table records severity, source, reproduction, fixed/deferred—not all use15seconds.
- [ ] Run new React + existing floating save strip/overlay, queue/workspace/account transitions and invalid draft regressions at320/390/768/1280. No real DB writes.

### Task 5: 출시 검증 및 0.4.2 조건부 공개

**Files:** Modify `lib/irisRelease.ts`, existing update-notes source located by `tests/iris-update-notes.test.mjs`, minimum release/handoff/relay records. Keep `iris/desktop-ergon-release.tests.ps1` and `tests/iris-ergon-release-lock.browser.mjs` passing without enabling ERGON.

- [ ] Run all Node tests, relevant native synthetic suites, browser fixtures, type check and isolated build. Record existing failures separately; independent High review only save/ownership risks. Fix blocking findings with RED→GREEN before release.
- [ ] After preceding gates, set version0.4.2 and show verified Korean notes in updater: 저장 대기 개선 / 캐릭터·계정 전환 전 저장 확인 / 재화 마지막 조회 기록(귀속 미확인 안내). If any feature incomplete, do not claim it or publish incomplete bundle as finished.
- [ ] Build isolated installer ZIP/metadata, hash verification, previous supported installation→0.4.2 synthetic helper swap/rollback/locked files. No forced running IRIS/game restart. ERGON remains app+floating locked and nonclickable; GNOSIS public lock unchanged.
- [ ] Inspect actual publication pipeline and auth. Latest user authorizes conditional0.4.2 public update, but earlier commit/push/main/Production boundaries require explicit reconciliation before any publish step that entails them. Do not merge main or issue DB/Production commands under assumed authority.
- [ ] Only after safe authorized publication, verify actual updater check resolves0.4.2 and notes/asset hash match. Report publication success separately from build success. Otherwise preserve candidate and state exact release blocker; no fabricated release.

## 실행 기록

현재 제품 수정/테스트 실행0. 먼저baseline 확보 후 Task1부터 TDD로 진행한다. Windows 관리 worktree는 기본sandbox Git 경로 접근이 제한되어 승인된exec 경로로 확인했다. 원래 checkout 개인 파일은 변경하지 않는다. 계획 검토 후 inline 실행을 권장한다. commit/push/main/운영DB/실게임은 실행 단계별 승인 경계를 지킨다.
