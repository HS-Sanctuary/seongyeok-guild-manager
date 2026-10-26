# ERGON B native observation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. 이번 사용자 요청의 상세 구현 범위를 기준으로 직접 구현하고 마지막 안전 검토 1회를 수행한다. commit/push 금지.

**Goal:** 실제 native reader의 읽기 전용 공급자를 고정 bridge와 기존 strict 증거 판정기에 연결한다. 실제 게임 명령 없이 주입된 fake 응답으로 제품 경계를 검증한다.

**Architecture:** native scope/document/contextVersion·actor state를 조회 전후 대조하고 materials/inventory/altering/works를 기존 reader로 읽는다. 별도 read-only packet과 실패 사유를 반환하며 collection 보고는 기존 실행 응답의 제한된 메모리 관측만 허용한다. 소비·자동 진척·DPAPI 가공 저장은 제공하지 않는다. TS는 기존 pure parser와 판정기를 재사용하고 현재 bridge 응답의 객체 신원을 store 내부에만 등록한다.

**Tech Stack:** 기존 C#/.NET·WebView2 bridge, TypeScript, Node·PowerShell native fixture·실제 React 합성 회귀.

**Spec:** 한설의 「ERGON B단계 구현 및 자동 생산 가능성 판정」(2026-10-26), [수신 검토](../../ERGON_HOME_RECEIVE_REVIEW_20261026.md).

## Global Constraints

- 기준 ba0374676d593a88118f226b3737603de9557db8. 기존 개인12/로컬 ACK·검토 문서 보존. 실제 게임 명령·사용자 원장·DB/main/배포/공개잠금/새 서버 사용/commit/push 금지.
- executionConnected=false 유지. workId/정원/실비용/보상 합산을 추정하지 않는다. C단계 저장과 자동 실행을 확대하지 않는다.
- 브라우저 payload에는 accountId/characterId/targetName만 받는다. raw 관측/보상/source/임의 명령은 받지 않는다. 게임 캐릭터 실귀속은 확인되지 않았으므로 gameIdentityVerified=false로 명시한다.

## Review Focus

- A→B→A·document 변경·비동기 종료 직전 문맥 변경 시 결과 혼합 없음.
- native unknown/busy는 조회·소비를 열지 않고 상태를 보존한다. failed/stale 조회를 0으로 대체하지 않는다.
- browser source 위조/clone/old epoch는 store의 native 객체 신원을 얻지 못한다.
- 보상은 보고일 뿐이며 중복/critical 별도, target/request/시간 불일치·미지원 응답은 비승격.
- 합성 포트에 실제 packet이 전달돼도 quote/execute0, pending 새 프로세스 재전송0.

### Task 1: native 공급자 및 고정 bridge

Files: 신규 iris/desktop-life-evidence.cs, .fixture.cs, .tests.ps1; 수정 desktop-bridge.cs/webview.cs/desktop.ps1/build-beta.ps1. 테스트는 Normalize에 fake JSON을 주입하고 실제 CLI를 호출하지 않는다.

- [x] RED: 정상4조회·중복 이름 보존·다른 scope·A/B/A·stale/실패·unknown/busy·collection 보고·임의 payload 거절 시험.
- [x] GREEN: 공급자 ReadAsync(payload), ReportCollection(context,raw) 구현. bridge는 전용 read route만 전달하며 기존 보상 응답 관측 실패가 실행 결과에 영향을 주지 않는다.
- [x] native fixture 및 기존 bridge/reader/progress 보호 회귀 확인. 신규 소스는 실제 빌드 목록에도 포함하고 private compile만 수행한다.

### Task 2: strict TS/store 연결과 합성 관리자 비승격

Files: 신규 lib/irisErgonNativeObservation.ts 및 tests/iris-ergon-native-observation.test.mjs; 수정 lib/irisDesktopStore.ts.

- [x] RED: packet strict parse·기존 readonly 평가·bridge 고정 scope payload·native object 신원/epoch·foreign/stale/실패·collection 비합산·manager 소비0 시험.
- [x] GREEN: parser는 untrusted 읽기 모델만 만든다. store는 고정 경로의 검증 완료 응답만 epoch/scope와 함께 WeakMap에 보관하고 ownsErgonObservation으로 객체 신원을 확인한다. 이 신원은 실행 허가가 아니다.
- [x] 목재13/pending9/readonly8·전체 Node·관련 React/native·타입/lint·필요 private build 확인.

### Task 3: 안전 검토와 결과 보고

- [x] High 독립 검토 1회, 중요 결함은 RED→최소 수정→GREEN 및 전체 회귀. 별도 재검토 확대 없음.
- [x] A 자동관측 / B 추가 공식증거 / C 사용자보조 / D 필수차단, 최소 실제 관측 계획과 한계를 문서화하고 로컬에서 중단한다.

## Rulings / ledger

- 기존 격리 worktree를 재사용한다. 질문/재설계 반복 대신 상세 승인 범위를 실행한다. 제품 실행/저장 허가를 추가하지 않는 B에 한정한다.
- 순차 다중 조회는 원자 게임 snapshot이 아니다. 문맥·actor 상태 재검사는 하되 게임 외부 일관성/게임 캐릭터 인증은 미지원으로 남긴다.
- 기존 수령 원문은 보관하지 않는다. 실행 응답에 이미 있는 제한 flat profile만 메모리에서 보존하며 미지원 envelope와 과거/다른 문맥은 null이다. report는 수량 확인/unknown 해제를 뜻하지 않는다.
- Task1/2 완료: 신규8 PASS, 전체696/693PASS3기존SKIP, 타입/lint/native private compile/격리웹build 및 React10. 소스 커밋은 사용자 미승인으로 하지 않는다.
- Final: High 1회 C0/I1/M0. I1 시간 계약은 JS timeout RED 및 native 초과 호출 RED 뒤25초/15초 예산 최소 보완·GREEN, 전체 회귀 재실행. 재리뷰 없음/보류 Minor 없음.
- Final Ruling: 실제 WinForms runtime/게임 귀속·원자성·외부 개입/실비용/실수령/C 저장은 검토 유보를 유지한다. 실제 앱/게임·원장 접근은 승인 범위 밖이며 합성/컴파일을 그 성공으로 표현하지 않는 비용을 감수한다.
