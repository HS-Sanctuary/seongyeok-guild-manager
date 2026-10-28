## 2026-10-29 영겁 — ASTRA 온라인 기능 브랜치 전송 마감

이번 요청에서 한설이 실제 격리 PostgreSQL 검증·최소 수정·검증된 후보의 기능 브랜치 선별 commit/일반 push를 승인했다. 아래 과거 미전송·미승인은 당시 상태로 보존한다. 기준 c9a376f, 대상 codex/home-gnosis-iris-integration-20261019. 최종 SHA는 전송 마감 기록/원격 HEAD를 확인한다.

[야간 최종 QA](ASTRA_ONLINE_NIGHT_QA_20261029.md): 실제 PG17.11 권한/RLS·다중기기·종료/지연 heartbeat·세션 철회/소유권 변경·Lock barrier·rollback/timeout·FK·정원/보존17그룹 PASS. 실제 API+HTTP+PG+브라우저2세션12 PASS, 기존 in-memory HTTP10 PASS. 전체 Node756/753 PASS·FAIL0·기존3 SKIP, 관련 React9·타입/신규 lint·격리 build62 PASS. Windows GUI는 QA 마감 항목의 최종 판정과 미검증 범위를 따르며 실제 전체 작업대/운영 설치본 완료로 해석하지 않는다.

소스사본만 사용한 legacy MAX_PATH·tracker 콜백 차단 RED→GREEN, 새벽 달력 경계 fixture 고정, 명시적 PG 잠금 관측을 보완했다. 제품 저장/원장/인증 의미 변경0. 최초 GUI state timeout 원인 미확정 및 이전 수령 예외 원인 미확정은 유지한다.

온라인/활동 기본 flagfalse, 공개 ERGON/실행false 유지. 개인12·기존 ACK·원장·ignored로그 보존. 운영 DB/main/Production/IRIS0.4.3·ZIP/metadata 변경0. feature의 오래된0.4.2 release assets를 운영0.4.3 위에 덮어쓰지 않는다. 다음은 미검증 GUI/절전·전역 만료 정리·무료 한도·운영 권한 사전점검이며 실제 운영 적용은 별도 승인이다.

# SANCTUM 작업 인계

## 2026-10-28 영겁 — ASTRA 웹·IRIS 온라인 로컬 후보

후속 마감: [비용·DB 안전·선별 범위](ASTRA_ONLINE_CLOSEOUT_20261028.md). 현재300초/720초, 이전180/600을 운영 사실로 해석하지 않는다. 정상 종료 leave는 즉시 요청하되 화면 반영60초/네트워크 실패TTL을 구분. 기존 활동·API까지 포함한24h2연결은 무료 한도 초과 가능, 전역 만료 session/lease 보존정책도 미확정이므로 운영 비활성. 선별 전송 준비만이며 commit/push 미승인.

기준 기능 HEAD c9a376fa5ecb28c575000a86e8a3e4241916d086 수신/ACK, 기존 집 개인12/이전 ACK/미전송 자료는 원본 worktree에 보존. 새 관리 worktree의 detached HEAD에서만 미커밋 구현했다. [한국어 최종 QA](ASTRA_ONLINE_QA_20261028.md), [설계](superpowers/specs/2026-10-28-astra-online-design.md), [미적용 SQL](../supabase/proposals/20261028_account_online.sql).

웹 공통 heartbeat/native 숨김과 무관한 수명·ASTRA count/filter/card를 연결했다. 활동 기록과 별도, source 자기신고를 인증으로 쓰지 않고 HttpOnly 세션만 소유권으로 사용. 기본 flagfalse/SQL제안만, 실제 DB·게임·사용자 원장·배포·commit/push0. 기존 IRIS0.4.3/ERGON 공개 잠금·C/D-0 유지. Node752/749 PASS/FAIL0/기존3 SKIP, 실제 신규/활동 React2·기존 보호7/native·타입/관련 lint·격리 build PASS. 기존 Astra/layout22오류9경고는 HEAD와동일. 독립 Important3 중2건 합성 RED→GREEN, SQL statement snapshot 보완은 실제 PG 경합 미검증으로 남음.

다음은 QA의 배포 전 승인5단계부터 확인. SQL runtime/실제 설치본 tray/절전 및24시간 사용 시 무료 한도는 검증 전이므로 공개 활성화 금지. 순월 과거 수령 예외 원인 미확정은 이번에 해결한 것으로 바꾸지 않는다. 새 구현 승인 전 사용자 보고·검토 대기.


## 2026-10-28 순월 — ASTRA 기능 브랜치 선별 전송 승인 마감

한설이 검증된 ASTRA 비활성 제품8·시험4·미적용 SQL1과 필요한 한국어 인계/필수 기록의 commit·일반 push를 승인했다. 기준 `a826ad0ad4728540034678cb8e46167f57a2b5e1`, 대상 `codex/home-gnosis-iris-integration-20261019`; 최종 수신 SHA는 이 항목을 포함한 커밋/원격 HEAD다. 아래 승인 없음·미전송 문구는 당시 경과로 보존한다. 원격 ff-only 수신과 검증 지문 동일성을 확인한 뒤 문서·시험 runtime 인자만 마감했다. runtime 정리 후 실제 ASTRA React/관련24 PASS다.

영겁 순서: 개인 변경 보존 → 기능 브랜치 ff-only 수신/ACK → [최신 마감 QA](ASTRA_ACTIVITY_CLOSEOUT_QA_20261028.md) → 수령 terminal 저장 예외의 종류/HResult/단계 조사. 과거 원인 미확정과 실제 PG/설치본 미검증을 완료 처리하지 않는다. [미적용 DB 제안](ASTRA_ACTIVITY_DB_PROPOSAL_20261028.md)은 별도 승인 전 적용/활성화하지 않는다. 새 코드가 있는 것과 운영에서 사용 가능한 것은 별개다.

현재 사무실 작업은 detached 관리 worktree에서 원격 기능 브랜치로 일반 fast-forward push하며, 옛 수신 worktree가 사용하는 로컬 브랜치/ACK는 이동하지 않는다. 원본16·옛 B17·옛 ACK1·별도 N049·로그/원장 보존, ERGON 제품/ZIP/metadata 변경0이다. main·DB·Production·공개 IRIS·공개 ERGON/실게임은 이번 승인에 포함하지 않는다.

## 2026-10-28 순월 — ASTRA 마감 전 안전 검증 후속

**완료:** 최종 SQL/시험/ZIP 고정 후 전체740/737 PASS/0 FAIL/기존3 SKIP, native8·실제 React8·TypeScript·격리 build PASS. 관련 신규 lint PASS, 기존 Astra/layout lint 실패 유지. [후속 QA](ASTRA_ACTIVITY_CLOSEOUT_QA_20261028.md)가 최신이며 아래 첫 ZIP 누락/실패 경과는 보존한다.

**미완료:** 과거 수령 실패의 합성 원장이 inflight로 남아 terminal 저장 미확정 경계는 확인했다. 저장 잠금 IOException 주입 시 unknown/inflight·재전송0은 정상이나 과거 예외 종류/정확 원인은 미확정이다. 제품/unknown 보호는 수정하지 않았다.

**ASTRA/다음:** 독립 검토 후 미적용 SQL의 계정→세션 재검사 잠금 순서와 직접/default service_role 권한 회수를 최소 보완했다. 실제 WebView Origin/쿠키 경로는 정적 호환, 설치본·PG 권한/멤버십/경합/만료는 미검증이다. ASTRA 비활성 후보의 선별 근거는 준비됐지만 수령 원인까지 규명한 통합 완료는 아니다. 별도 승인 전 commit/push·DB/flag/main/Production/공개 IRIS/ERGON·실게임 금지. 원본16·옛B17·옛ACK1·N049 지문/로그 보존.

## 2026-10-28 순월 — C/D-0 수신 및 ASTRA 활동 로컬 후보

- **완료:** 기능 브랜치 `a826ad0ad4728540034678cb8e46167f57a2b5e1` ff-only 수신/ACK. 원본16·옛 B17·옛 수신 ACK1의 기존 지문 동일, 별도 N04 진단9도 이번 전후 동일. C를 재구현하거나 옛 진단을 덮어씌우지 않았다.
- **후보:** 웹/IRIS 공통 세션 기반 활동 POST/Reporter·기존 directory 배치 조회·ASTRA 통합 한 줄. 캐릭터 updated_at 쓰기 제거, Presence는 웹 ASTRA 연결로 명시. 새 집계 DB는 제안만이며 기본 비활성이다. 실제 기록/운영 활성화는 아직 안 된다.
- **검증:** [종합 QA](ASTRA_ACTIVITY_OFFICE_QA_20261028.md), [C/D-0 독립 QA](ERGON_OFFICE_CD0_RECEIVE_QA_20261028.md) 참조. C14/N044/API2·보호 React/기존 native 관련 PASS, 별도 collection assertion FAIL/원인 미확정. 활동20·관련24 PASS/실제 React12폭·글자 조합/타입/격리 build PASS. 전체740 중736 PASS·1 ZIP 누락 환경FAIL·3 SKIP, 기존 ZIP 동일 복사 뒤 관련4 PASS(전체 재실행 아님). 기존 Astra/layout lint 실패는 유지한다.
- **다음:** 수령 실패 원인 분리, [활동 DB 제안](ASTRA_ACTIVITY_DB_PROPOSAL_20261028.md)의 새 테이블1/RPC1·실제 PG 검증 승인. D-1 실제 조회는 항목/명령/횟수/캐시 영향 제시 뒤 별도 승인. 아직 사용자 설치본·실게임·PG 권한/동시성 검증은 없다.
- **보존/경계:** detached 관리 worktree의 로컬 미커밋·미전송 후보. commit/push 승인 없음. main/DB/Production/IRIS0.4.3 ZIP·metadata/공개 ERGON·executionConnected=false·사용자 원장 유지. Supabase Free 확인, 실제 사용량과 Vercel 잔여량은 미확인으로 활성화 확대 금지. 아래 과거 인계는 보존한다.

## 2026-10-27 22:25 KST — D-0 선별 전송 마감

대상 `codex/home-gnosis-iris-integration-20261019`, 기준 C `aff55344dc213c80ef1e10602d350a11cf9cfc8b`. 한설이 D-0 source/test8·필수 인계5·저장소 필수 릴리스/구조도2만 선별 commit·일반 push 승인했다. 최종 수신 SHA는 이 항목을 포함한 커밋과 원격 HEAD이며 `git rev-parse HEAD`로 대조한다. 아래 승인 없음/집 로컬은 당시 경과로 보존한다.

완료는 기존 생활 현황 안의 읽기 전용 B/C 기록 표시다. source none의 기록0과 실제 확보량 미확인, 과거 관측 잔여 시간/시각과 저장 갱신 시각 미확인, 보류/unknown/차단을 구분한다. B/C parser·C load·기존 goal selector를 재사용하며 실행 selector 기본 조건과 C native/저장 소스는 변경하지 않았다. C가 거절하는 보류 목표 load도 UI에서 시도하지 않는다. [최종 QA/검증](ERGON_D0_READONLY_WORKBENCH_QA_20261027.md)을 먼저 읽는다.

최종 재검증: 마지막 UI 포함 source8 SHA256 일치, Node720/717 PASS/FAIL0/기존3 SKIP·실제 D-0 React/기존 보호6종·TypeScript/관련 ESLint/격리 Next build PASS. N04/C 저장·복구 회귀와 공개 잠금을 포함한다. 제품/시험 추가 변경 없이 인계만 마감한다. 과거 N04 field-diff의 정확 원인 미확정은 그대로 유지한다.

순월 순서: 사무실 개인/미전송 N04 자료 보존→안전 수신/ACK→D-0 목표/수량/시간/지연 응답과 기존 저장 보호 회귀 대조→실제 관측의 대상·횟수·캐릭터 귀속/작업 ID·정원·수령량·비용 증거의 누락을 한설에게 보고. 실제 CLI/생산/원장 해제는 이 인계로 승인되지 않는다. 개인12·ACK 원본·원장/암호문/로그·사본은 제외/보존했고 공개 ERGON/실행false·main ca697706·IRIS0.4.3/DB/Production은 유지한다.

## 2026-10-27 후속 D-0 — C 전송 완료 / UI 로컬 검증 후보

C 원격 전송 SHA **`aff55344dc213c80ef1e10602d350a11cf9cfc8b`** 일치 확인. [D-0 QA](ERGON_D0_READONLY_WORKBENCH_QA_20261027.md)는 그 뒤의 로컬 변경이다. 기존 생활 현황 안에 C load/저장된 B 관측 현황을 연결했고 새 observe/생산/저장 엔진은 없다. 기록0과 실제 수량 미확인·조회 당시 잔여 시간·보류/unknown을 구분한다. C 계약상 보류 목표는 진척 load하지 않는다. 전체720/717 PASS/FAIL0/기존3 SKIP와 실제 React 보완 결과를 QA에서 대조한다.

**D-0는 미커밋/미전송이며 승인 없음.** 사무실에는 C만 전달됐다. 다음은 D-0 결과 검토와 별도 전송 승인, 실제 관측 시험의 대상/횟수/예산/캐릭터 귀속을 별도 결정하는 일이다. 실제 CLI/소비·사용자 원장·공개 잠금/main/DB/IRIS0.4.3/Production 변경 금지. 개인12/ACK/로그·사본은 보존한다. 사무실의 미전송 N04 진단과 C의 journal/executor/fixture가 겹치면 덮어쓰지 말고 비교한다.

## 2026-10-27 20:51 KST — C/N04 기능 브랜치 선별 전송 승인 마감

한설이 검증된 C 제품·시험/N04 최소 수정·필수 인계만 선별 commit·일반 push하도록 승인했다. 대상 `codex/home-gnosis-iris-integration-20261019`, 기준 B `971a4d81f8c69fb1ef1bdf046aa75931a6f14bc4`; 정확한 최종 수신 SHA는 이 항목을 포함한 커밋/원격 HEAD다. 아래 승인 대기·로컬 미전송 문구는 각 시점 경과로 보존한다. source19개가 최종 PASS 보존본과 일치하고 원격 기준과 ff-only 최신임을 확인했다.

전송은 source/test19와 필수 문서7개다. 제외한 수신 ACK 원본·수신 확인 메모·계획2개는 집에 유지하며 개인12·실사용 원장/암호문/로그/격리 사본은 포함하지 않는다. 순월은 수신/ACK→[N04/C 최종 QA](ERGON_N04_HOME_RECOVERY_QA_20261027.md)/현재 소스 대조→native 저장/복구·목표4/확인3 회귀→실제 관측에 필요한 증거와 다음 최소 연결 범위를 제안할 것. B/C를 재구현하지 않는다. 실제 CLI/소비·원장 수정/자동 해제·공개 잠금 해제·main/DB/IRIS0.4.3/Production은 별도 승인 전 금지다.

## 2026-10-27 집 — N04 독립 복구 / C 검증 마감 / 전송 승인 대기

[독립 복구 QA](ERGON_N04_HOME_RECOVERY_QA_20261027.md)가 최신이다. 순월 진단 패키지는 미수신인 채 B/C 짧은 사본 비교와 직접 합성 RED→GREEN을 수행했다. 제품은 journal game lease의 실제 공유 충돌만 typed busy로 구분하고 executor가 다른 복구 IOException을 숨기지 않도록 최소 수정했다. `paused child lost game lease`는 response-loss fixture의 외부 root 없는 미완료 TCS 수명을 forced-GC로 B/C에서 재현하고 fixture 보유로 보완했다. 제품의 lease/unknown 보호는 약화하지 않았다.

최종 Node714/711 PASS/FAIL0/기존3 SKIP, C native14/API2·N044·React6·타입·관련 lint·private native/격리 웹 build PASS. 이번 High 검토 C0/I0/M0. 과거 recovery field-diff의 정확한 IOException 단계는 여전히 미확정이며 후속 통과로 소급 해결하지 않는다. C는 선별 전송 후보이나 **commit/push 승인 대기**다. 원격 B971a4d8·운영main ca697706/IRIS0.4.3/공개 잠금/executionConnected=false·집 개인12/ACK/원본 실패 로그 보존. 실제 게임·사용자 원장·DB/Production 변경0. 아래 과거 보류 기록을 보존한다.

## 2026-10-26 집 — B 전송 완료 / C 전송 보류

B `971a4d81f8c69fb1ef1bdf046aa75931a6f14bc4` 일반 push·원격 일치 확인. C의 별도 DPAPI 가공 저장/native·typed port/B 관측 연결은 로컬 구현했고 High C0/I3를 RED→GREEN 보완했다. [C QA](ERGON_WOOD_DPAPI_C_QA_20261026.md)를 우선 읽을 것. production은 blocked/확인0/실행false이며 실제 가공 실행을 열지 않았다.

전체 동시712/707PASS·2FAIL·3기존SKIP 중 신규 fixture 경합은 보완했지만 기존 N04 `paused child lost game lease`가 직렬 전체에서도 실패했다. N04 단독2PASS·C 개별 회귀/타입/lint/native private compile/격리 웹 build/React6 PASS와 구분한다. 보호 기대값을 낮추지 않고 C commit/push는 보류한다. C 소스·실패/성공 로그는 로컬 보존, 기존 개인12/ACK·실사용 원장·운영main ca697706/IRIS0.4.3/공개false/executionConnected=false 유지. 최신 약속은 남은15%에서 중단이다. 사무실 원격에는 C가 없으므로 완료로 오인하지 말 것.

- **2026-10-26 B 전송 승인:** 한설이 아래 검증된 B 변경의 기능 브랜치 commit·일반 push를 승인했다. 기준 ba0374676d593a88118f226b3737603de9557db8, 정확 전송 SHA는 본 기록 포함 커밋/원격 HEAD 대조 기준이다. 아래 미승인·로컬 문구는 당시 경과다. C 구현은 이 전송 뒤 별도 delta/커밋으로 진행하며 검증되지 않은 C를 B에 섞지 않는다. 개인12/ACK·실사용 원장/운영0.4.3/main/DB/공개 잠금 유지.

## 2026-10-26 KST — 집 B native 관측 구현 / 로컬 미전송

한설의 상세 B 구현 승인으로 기존 reader→native 공급자→고정 bridge→strict TS/store 읽기 모델을 연결했다. [B QA/자동화 판정](ERGON_NATIVE_OBSERVATION_B_QA_20261026.md)이 최신이다. 실제 CLI는 fake JSON 주입만 사용했고 C 가공 저장·소비 엔진·공개 화면 활성화는 없다. 선택 문맥과 게임 캐릭터 귀속을 구분하고 gameIdentityVerified=false/자동 진척 null/실행 false를 유지한다.

최종 Node696/693 PASS/기존3 SKIP/0 FAIL, 신규8·React10·타입/lint·native private compile·격리 웹 빌드 PASS. High 1회 C0/I1/M0의 다중 조회 시간 계약을 RED→GREEN 보완했다. 실제 정원/work·delivery 귀속/비용·보상 합산/외부 일관성 및 C 저장이 없으면 완전자동은 차단된다. 실게임·실사용 원장·DB/main/IRIS0.4.3/공개 잠금 변경0, 집 개인12·기존 ACK 보존. commit/push는 별도 승인 전 금지. 아래 A 전송 기록은 그 시점의 경과다.

## 2026-10-26 KST — v2.322 개발 후보 후속 / 목재 후보 A 선별 전송

- 이번에 완료한 것: 목재 추가100 합성 관리자·pending 새 프로세스 복구·readonly DTO. 기존 검증 소스 SHA256 12개 일치. Node688 중685 PASS/기존3 SKIP/0 FAIL, 타입·관련 lint PASS. 목재13·pending9복구 조합·DTO8 유지. 검증된 A와 최소 인계를 기능 브랜치에만 전송한다. 정확한 수신 SHA는 이 문서를 포함한 커밋과 원격 HEAD다.
- 아직 안 되는 것: 실제 자동 생산·native 가공 저장·호스트 연결. 기존 pending 배타는 정상 helper를 사용하는 동일 합성 root의 협력 프로세스에 한정된다. helper 자체 사망은 다음 필수 검증으로 남기며 production 안전 보장이 아니다. 현재 DTO는 순수 계약으로 native 출처를 인증하지 않는다.
- 다음 작업: 기존 reader 기반 native 관측 B와 별도 버전 DPAPI 가공 저장 C. workId·정원·실수령 귀속·실비용·외부 배제 근거는 unsupported로 유지한다. B/C는 독립 검증 후 별도 전송한다.
- 구조 변경: 공통 순수 회차 계산과 합성 전용 TS/시험 추가. 서버/API/DB/공개 UI 구조 변경 없음. 실제 CLI·게임·공개 잠금·executionConnected=false·운영 main/IRIS0.4.3 ZIP/metadata·Production 변경0. 신규 서버 호출0.
- 보존/위험: 개인16항목·기존 ACK·사용자 원장·ignored 원본 로그는 보존/전송 제외. 과거 S01/N04 normal/최초 수령 간헐 원인 미확정과 새 목표 교체 이벤트 구 native 역방향 호환 미검증 유지. 아래 미승인·미전송 문구는 당시 경과이며 이번 승인으로 검증된 A/B/C의 선별 commit·일반 push가 허용되었다.
- 근거: docs/ERGON_WOOD_PRODUCTION_SYNTHETIC_QA_20261026.md, docs/ERGON_WOOD_PROCESS_RECOVERY_QA_20261026.md, docs/ERGON_READONLY_EVIDENCE_QA_20261026.md.

## 2026-10-26 KST — 목표 관리 선별 전송 / 목재100 합성 착수 승인

- 한설이 검증된 빈 제작 목표 취소·원자 수량 교체와 최소 한국어 기록만 기능 브랜치 commit·일반 push 승인. 기준 `7a7b70a98928a780aea555bb70a583ae52cb5d84`; 최종 SHA는 이 문서를 포함한 커밋과 원격 HEAD를 대조한다. [원자 교체 QA](ERGON_ATOMIC_GOAL_REPLACEMENT_QA_20261026.md)와 [앞선 취소 QA](ERGON_GOAL_MANAGEMENT_QA_20261026.md)를 따른다.
- Node661 PASS/기존3 SKIP/0 FAIL, React16·native/타입/lint/build PASS. 구 v1 판독 유지, 새 이벤트를 구 native에서 읽는 역방향 호환은 미검증/미보장. 과거 간헐 실패 원인 미확정 유지. 공개 gate/executionConnected=false·운영 IRIS0.4.3/ZIP/metadata 보존.
- 원본 개인16항목(ACK 포함), 별도 ACK·로그·사용자 원장은 전송에서 제외/보존한다. 기존 QA의 미커밋/승인대기 문구는 당시 경과다.
- 다음 승인: 목재 추가100의 재고→부족통나무→채집→가공→대기→수령→실수량→반복을 **가짜 CLI·격리 저장**으로 연결하는 최소 관리자. 실제 가공 확정량을 현재 crafting 전용 native 확인량으로 위장하지 않는다. 필요한 CLI/영수증/저장 계약을 먼저 구분한다. 새 자동 생산 코드의 commit/push는 별도 승인 전 금지.
- main/DB/Production/실게임/공개 잠금/새 서버 사용 변경 금지. 이번 목표 관리 전송은 자동 생산 또는 공개 배포 완료가 아니다.

## 2026-10-24 KST — 집 작업 마감 / 기능 브랜치 전송 승인

한설이 오늘까지 검증한 변경과 최소 인계 기록의 선별 commit·일반 push를 승인했다. 대상은 `codex/home-gnosis-iris-integration-20261019`, 수신 기준은 `e9575ec5c6432156d6b8a033cd50217b24da7d47`다. 정확한 전송 SHA는 이 항목을 포함한 커밋의 Git 이력과 원격 HEAD를 대조한다. 아래 로컬/미승인 문구는 당시 경과로 보존한다.

- 포함: N-R1/U-R1/V15, 실제 결과 패널·page 보호, 제작 목표 생성/재사용, 비소비성 요청 등록 계약, native 확인 진척 단일화, 관련 합성 시험·QA·수신 ACK. [목표 연결 QA](ERGON_GOAL_BINDING_QA_20261023.md), [작업대 QA](ERGON_PHASE3_WORKBENCH_QA_20261023.md), [보호 수정 QA](ERGON_IMPORTANT2_FIX_QA_20261023.md), [뉴월 요약](ERGON_NEWOL_HANDOFF.md)을 순서대로 확인한다.
- 최종 검증: Node651/648 PASS/기존3 SKIP/0 FAIL, React14·타입·관련 lint·격리 빌드 PASS. High 1회 C0/I2 보완. N04/S01/최초 수령 간헐 실패 원인 미확정 유지. 실제 게임 시험·전체 자동 생산 완료가 아니다.
- 제외/보존: 집 원본 개인12항목(기존 수정4·삭제3·미추적5), 실제 원장/캐시/게임 응답/로그, ignored 소스 사본. 원래 checkout은 변경하지 않는다. 공개 main ca697706·IRIS0.4.3 설치본/metadata 유지. 기능 브랜치의 오래된 배포물을 공개하지 말 것.
- 순월 첫 순서: 수신·ACK → 소스/QA와 실제 코드 대조 → 기존 저장/목표4·확인3·남은1 회귀 → 목표 변경/취소 정책 및 다음 최소 합성 연결 범위를 한설과 결정. 자동 생산이나 실제 소비를 임의로 시작하지 않는다.
- 종료: 사용량 중단 기준은 최신 요청의 남은10%다. 이번 push 확인 후 새 개발 없이 종료한다. 공개 잠금/executionConnected=false 유지, main 병합·DB·Production·공개 IRIS·실게임·사용자 보호 원장 변경은 승인하지 않았다.

## 2026-10-23 ERGON 목표·바인딩·단일 진척 — 로컬 미커밋

[최신 QA](ERGON_GOAL_BINDING_QA_20261023.md): 기존19파일 사본·N-R1/U-R1/V15·page/수신 ACK 보존 위에 비소비성 새 목표 연결, 기존 준비 요청 등록 어댑터, native 진척의 작업대/Queue 단일화를 추가했다. 실행 허가 false, 공개 잠금 유지. High 1회 C0/I2 보완(수령 우회·stale 진척)과 합성 회귀 확인. 취소/계획 삭제 전체·자동 재계획·실행 활성화는 미구현. 기능 e9575ec/운영 main ca697706·0.4.3 파일 유지, commit/push 미승인. 이전 UI 연결 기록은 해당 단계의 경과로 보존한다.

## 2026-10-23 ERGON 3차 실제 작업대 연결 — 로컬 미커밋

[최신 연결 QA](ERGON_PHASE3_WORKBENCH_QA_20261023.md)를 우선 읽을 것. 기존 N-R1/U-R1/V15와 ACK 보존 위에 결과 패널·정확 계획 매칭·page 종료/전환/로그아웃/업데이트 보호를 연결했다. High Important 1건 ACK 유실 왕복 복구 RED→GREEN 및 기존 중지 보존 합성 PASS. 공개 잠금·executionConnected=false·운영 main0.4.3/ZIP/DB 유지. 새 실행 바인딩·자동 생산·계획 삭제 전체는 미구현. commit/push 승인 없으며 이 기록도 로컬만 유지한다. 앞선 미연결 기록은 해당 시점 경과다.

## 2026-10-23 집 — N-R1/U-R1 최소 수정 로컬 후보 (미전송)

수신 e9575ec에서 승인된 Important2만 수정했다. [최소 수정 QA](ERGON_IMPORTANT2_FIX_QA_20261023.md)에 RED/GREEN·범위·최종검토를 기록한다. native 최종 문맥 재검사와 lifecycle ACK유실의 동일operation 재확인/보호상태만 변경, 실제 DesktopErgon/page 연결0. 전체645/642PASS3skip·관련 React/native/type/lint PASS, High독립검토1회 결과는 QA최신을 따른다. 집개인12·원장·기존ACK·공개lock/운영0.4.2/mainb0b63c7 보존. commit/push는 별도승인전금지. 과거N04/S01/수령간헐원인미확정유지.

## 2026-10-23 KST — 퇴근 인계 / 독립 3차 첫 UI 후보

첫 전송 d92d8ba(N04·native수량18파일) 원격일치. 후속 독립 결과패널/hook·typed native요청/ACK 제품5·시험5 후보를 선별 전송한다. **DesktopErgon/page mount 없음**, 실제앱새화면없음/공개lock유지. ERGON_PHASE3_FIRST_UI_QA_20261023.md에 ID별 PASS/부분/미실행과 정확한 진입점을 기록했다. 최종Node645/642PASS3기존SKIP0FAIL·React3·타입/lint·격리build·기존lock/currency/saveUI 회귀 PASS. High중요3 RED→GREEN/재검토0.

새 N04 normal의 marker전 native-result-review-required 1FAIL은 분리/최종PASS와 별개로 원인미확정 보존. 기존S01/최초수령회귀도미확정. 다음은 실제page종료/전환보호→목표바인딩/복원·Queue/CraftGoal/삭제연결이며 전체Task4/자동생산완료아님. 개인16/ACK/원장보존, 게임/main/DB/서버/Production/공개IRIS/ZIPmetadata변경0. 최종기능SHA는본기록포함HEAD/원격일치결과기준.

## 2026-10-23 KST — N04·native 수량 확인 1차 선별 인계

한설 승인 범위 N04 시험4·수량확인5파일 및 최소 기록을 기능 브랜치로 전송한다. N04 새 프로세스 unknown/중복0/이력 보존, 수량 V01–V12 PASS. 최종 Node644/641PASS3기존SKIP0FAIL·저장34/A22/B20/H22/R5/native8/types/lint/소스목록컴파일 PASS. High C0/I1/M0의 I1은 V12 RED→GREEN 보완했다. 두 QA 문서를 먼저 읽는다. 로그·개인 경로·사용자 자료는 전송하지 않는다.

ErgonAvailable=false/executionConnected=false 유지. 실제 native창/게임/Q13 UI 미검증, S01·최초 수령회귀 원인 미확정 유지. 운영IRIS0.4.2와 기능0.4.1 배포물 차이 보존/main병합·운영배포 금지. 다음은 이번에 별도 승인된 Task4 첫 UI이며 검증 실패 시 첫 전송만 유지한다. 개인16/ACK/보호기록 보존, 구조 변경은 native 재확인 내부 경계와 시험만이다.

## 2026-10-23 13:05 +09:00 KST — ERGON B-2 비활성 연결 후보 선별 인계

- **완료:** 기준 기능 b3e243cc4b08356a9096abdb062e837dd1d1238c에서 B-2 제품10·시험9를 구현·검증했고 한설이 비활성 조건으로 인정 및 기능 브랜치 선별 commit/push를 승인했다. [B-2 QA](ERGON_B2_QA_20261023.md)와 [영겁 수신함](relay/TO_YEONGGEOP.md)의 SW-20261023-001을 우선 읽고 ACK한다. 최종 SHA는 이 인계를 포함한 커밋과 원격 HEAD를 대조한다.
- **검증:** Node638 PASS/3기존 SKIP/FAIL0, 저장34·A22·B-1 20·H22·R5 PASS. 필수13 중11 PASS, N04·Q13 부분 검증. 검증 소스19파일 SHA256 일치 확인. native8·타입·scoped lint·native 소스 목록 컴파일 PASS. 원본 로그는 로컬 전용이다.
- **아직 안 됨:** 실제 활성화/실게임/전체61/UI 검증 완료 아님. S01 간헐 실패와 최초 수령 회귀 실패 원인 미확정. ErgonAvailable=false, executionConnected=false 유지.
- **다음 순서:** 별도 승인 후 N04 journal.Begin 직후 합성 자식 프로세스 중단·복구 → 0개/초과 산출/정정의 native 명시 확인 계약 → Q13 정정 초안·실행 상태를 3차 UI에서 검증. nonce·공통 writer·lease·unknown 보호를 유지한다.
- 기존 사무실 개인16항목/별도 ACK는 원본 worktree에 보존하고 이번 전송에서 제외한다. main b0b63c7 운영 IRIS0.4.2 및 기능브랜치의 기존0.4.1 공개 파일 차이를 유지한다. main 병합/DB/Production/공개 IRIS/게임 행동/잠금 해제 금지. 새 제품 기능 추가 없이 선별 전송만 진행한다.

## 2026-10-22 KST — IRIS 0.4.2 운영 공개 최종 인계

한설 승인 후 main에 이번 저장 개선만 선별 반영했다. 제품 `0d2b432f2db8afd3f2f9bbc3507b393397698447`, 운영 문서마감/main `b0b63c7a5786380f4e36c67651d8596640f35db7`, 현재 Production `dpl_GimXVW6ejrr2xcu4n27msrbNrdb9` Ready/정확SHA/운영도메인 확인. [운영 릴리스 검증](https://github.com/HS-Sanctuary/seongyeok-guild-manager/blob/b0b63c7a5786380f4e36c67651d8596640f35db7/docs/IRIS_042_RELEASE_QA_20261022.md)을 우선 읽을 것. 실0.4.2metadata/notes/ZIP598816·SHA9ea1c1d9f2ee8d758c702b5436c8658cdf7b2092b8d74001a10de9caef719274/내부payload·핵심7GET200·실다운로드UI·브라우저편집차단 확인. ERGON 자물쇠/disabled 유지, 새공지/DB/실게임/강제재시작0.

기능브랜치 제품955332a(638/635PASS3skip), main선별후618/615PASS3skip·타입/scopedlint/격리build·관련native/React/updaterPASS. 실제설치본교체/실사용DB저장/runtime로그전수는 미확인. 집개인12항목·원장·B-1보존/B-2보류. main 전체를 기능브랜치에 되합치기는 안전검토에서 거절되어 실행0·충돌0. 이 기능브랜치의 다운로드ZIP/metadata는 아직0.4.1이므로 여기서 재배포하지 말 것. 다음은 양쪽 diff 확인 후 별도 승인받아 main 운영파일만 안전하게 통합하는 작업이다. 기존 미ACK·개인자료를 덮어쓰지 않는다.

## 2026-10-22 집 — IRIS 저장 안정성 우선 / 0.4.2 공개 승인

한설이 이번 저장 개선의 선별 commit/push·필요한 main 반영·Production·IRIS0.4.2 공개를 승인했다. main06e1eca에서 별도 릴리스 후보를 만들고 이번 delta만 검증한다. 미공개 ERGON/B-1/GNOSIS 전체 병합은 제외한다. 아래 승인 대기 문구는 승인 전 경과이며 공개 성공은 후속 검증 기록으로만 판단한다. DB/실게임/ERGON 해제/강제 재시작 금지는 유지한다.

순월 B-1 기준a95c0768을 별도 worktree로 수신·ACK했다. ERGON B-2 보류, 개인12항목/원장 보존. [저장 안정성 QA](IRIS_SAVE_STABILITY_QA_20261022.md)가 최신 로컬 상태다. 최초 기한·전환 save/keep·native 재화 별도 캐시·업데이트 설명을 구현했고 전체638/635PASS3skip, native/합성UI/타입/빌드 검증을 구분 기록했다. High 중요2건은 재현 회귀로 보완했다. 아직 commit/push/운영 웹/공개 ZIP 변경0. 0.4.2 공개에는 기존 main/Production 금지 및 선별 전송 승인 경계의 최종 확인이 필요하다. B-2·실제 게임·운영DB는 계속 금지.

## 2026-10-22 KST — ERGON B-1 합성 검증 완료·선별 인계

- 선별 인계 직전 재검증(2026-10-22 KST): Node624 중621 PASS/기존3 SKIP/FAIL0(통합 A22+B20 포함), 격리 저장34 PASS/FAIL0/종료 코드0. S01 세부 보존 진단 PASS, 최초 간헐 실패 원인은 여전히 미확정. 원본 로그는 전송하지 않는다.

- **이번에 완료한 것:** 기준 `37e9762244d7c02ace2294bd3c6686252a10f233`에서 B-1 승인 6파일의 공통 writer 잠금·비동기 승인 재검증·lease 인계 계약을 구현했다. 보고서 SHA256 6개와 전송 소스의 일치를 확인했다. 코드·시험 6파일과 필수 한국어 인계 문서만 기능 브랜치로 전송한다.
- **아직 안 되는 것:** 실제 host 연결·실제 Confirm 우회 차단·native 원장 terminal 정합성은 미실행이다. 전체 2차·UI·자동 생산 완료가 아니다.
- **다음 작업:** 별도 승인 전 B-2 제품 구현·실제 연결을 시작하지 않는다. 실제 모든 writer의 공통 잠금 참여, 실제 Confirm 우회 불가, Run terminal까지 lease 유지·모든 예외 정리, unknown/전역 미해결 보호, S01 간헐 실패 진단을 B-2 필수 게이트로 둔다. Q13/N05/N07/N08/N12·실제 host/terminal 연결 미실행.
- 합성 결과: B01–B20 신규20 PASS, A01–A22 기존22 PASS, 저장 Q01–Q12/Q14–Q15/I01–I02/I04–I07 및 S01–S14 34 PASS. 구현 마감 Node624 중621 PASS/기존3 SKIP/FAIL0, 기존 native4종·타입·lint PASS. native4종은 검토 수정 전 결과이며 후보 2파일을 컴파일하지 않는 시험이다. 실제 게임 검증은 미실행이다.
- 독립 High 검토 C0/I2/M0: 위조 writer admission과 Dispose 예외 후 이중 해제를 B19/B20 RED→GREEN으로 보완했다. 재검토0. S01 최종 진단은 암호문 동일/revision4/health ok/confirmed3/원본 mutation 동일이지만 최초 간헐 실패 원인은 미확정이다. 단순 재실행 통과를 원인 해결로 보지 않는다.
- 잠금 순서 mutation10→game20→writer30→file40. 승인 대기 중 writer/file 잠금 없음, 가짜 Run은 Claim 후 terminal까지 소유한다. 동일 프로세스 점유는 보수적으로 차단하며 외부 writer 대기는 최대5초다. 실제 동작의 보장은 B-2에서 별도 입증한다.
- 사무실 원본 개인16·별도 수신 ACK·로컬 보고서/원본 로그 보존·전송 제외. 실제 게임·기존 원장·DB·main·Production·공개 IRIS 변경 없음. 기능 push 성공 여부와 최종 SHA는 Git 이력 및 원격 일치 보고로 확인한다. 보고·검토·인계·진행 기록은 한국어 기본, 식별자/명령/원본 출력은 유지한다.

### B-1 검증 소스 SHA256

- `iris/desktop-life-progress.cs`: `07792792D623F5198A7CB7C5A36C09614B7539F8B10142483750501CAA8813AE`
- `iris/desktop-life-progress-coordinator.cs`: `1D0BA4EBCB1278CEA1E629D4A8CE9E5726D8CACDA589486C63D983D2D24FA1BE`
- `iris/desktop-life-progress.fixture.cs`: `FA104ED1856EAD982CD4AE5E0F7ECA99CA965C673826B0135C063F4ADB217995`
- `iris/desktop-life-progress-integration.fixture.cs`: `562C9DD68DF03078A67C6FEFE7FF3727D3435CB1AA4BD6C42A96871250B7E4E6`
- `iris/desktop-life-progress-integration.tests.ps1`: `02EB786D75B1C44DA4E22F3BE90577DFF42BFB21C141F5E26FDA9F26188BBCB6`
- `tests/iris-ergon-progress-bridge.test.mjs`: `7C57588524686A049C84CDD69C11B3DEE17340DB7CA99996836B5F66018F9882`

## 2026-10-22 KST — ERGON 2차 A 마감 / B 연결 준비

기준 `f4eda6bc997d757c00923a609bd0a42fc40559c6`에서 신규4파일과 최소 인계만 기능 브랜치에 선별 전송한다. native 후보 코디네이터의 저장 ACK·소유권·일회성 바인딩·필수 writer 제외 admission을 합성22개로 검증했다. 기존1차34 최종 PASS, Node621 PASS/기존3 SKIP/0 FAIL, 기존 native4·타입·scoped lint PASS. 최초 S01 보존 assertion 실패1회 원인은 미확정이며 단독/최종 직렬 전체는 PASS. 실제 실행기/bridge/host/원장·UI는 미연결이다. 모든 실제 writer가 공통 cross-process 제외에 참여하고 구 confirm 우회를 차단하기 전 B 활성화 금지. 원래2차13개 전체와 UI14개는 미완료이며 B 코드는 별도 승인 후 시작한다. 개인16항목/별도 ACK·개인 로그 보존·전송 제외; 게임·DB·main·배포 변경0.

## 2026-10-22 KST — ERGON 1차 저장 기반 전송

기능 브랜치 `codex/home-gnosis-iris-integration-20261019`에 Task 1·2 전용 신규5파일과 최소 인계 문서를 선별 전송했다. 시작 기준 SHA `29009670ef54a81e422a91f1c33e504eeac27da5`; 최종 전송 SHA는 이 커밋을 따른다. 합성 소유 시나리오34 PASS/0 FAIL/0 미실행, 후속27개 미실행. Node623: 620 PASS/기존3 SKIP/0 FAIL; 기존 native 회귀4·독립 타입·scoped lint PASS. DPAPI 저장 기반은 기존 실행기/UI/실제 원장과 연결되지 않았다. 사무실 개인변경16항목과 로컬 전용 로그 보존·전송 제외. 복구 검토 상태, 타PC DPAPI/실제 정전, 긴 Windows 경로 제약을 후속 연결 전 검토한다. 한설·뉴월의 별도 승인이 있기 전 2차 원장 연결·3차 UI를 시작하지 않는다. 게임·운영 DB·main·Production 변경0.

## 2026-10-21 23:56 KST — ERGON 수량 정확성·진행 보존 설계 마감

[오늘 순월 인계](ERGON_CLOSEOUT_20261021.md)를 먼저 읽는다. 기준 a6bea682/동일 기능 원격 ff-only 확인. 기존 수량 정확성 제품5·직접 시험9·조사/설계5 및 최소 인계만 선별 전송하며 개인12항목은 제외·보존한다. 예상 산출은 진척/예약에 넣지 않고 수량 미확인/unknown 보호를 유지한다. 암호화 진행 저장·확인 UI·자동 생산은 미구현이다. 기존617/614PASS3skip·native4·browser14·빌드/타입은 QA의 이전 검증이고 신규61시나리오는 미실행. Task1·2 신규5파일/34합성의 시작 가능 여부를 먼저 보고하며 순월 신규 구현은 아직 시작 승인 아님. main/DB/Production/공개IRIS/게임 행동0. 정확 최종 SHA는 인계 파일 Git 이력과 원격 일치 보고를 대조한다.

- **2026-10-20 최종 코드 식별:** CHRONOS·ERGON 설계 커밋 `040e03d0ddc545af5fc91b45a786cfbe0bd6fbac`. 최종 문서 마감은 그 다음 커밋이며 [HOME_CLOSEOUT](HOME_CLOSEOUT_20261020.md)의 최신 변경 SHA/원격 브랜치 HEAD까지 받는다. 전송 대상612/609PASS3skip, 기존11항목 미전송·보존, 운영main/공개IRIS/DB/게임행동0. 정확 push 성공은 영겁의 원격 일치 확인 보고와 대조한다.

## 2026-10-20 22:27 KST — 오늘 집 작업 마감 / 순월 우선 인계

- 한설 최종 승인: 새 개발 중단, CHRONOS 표시4파일·관련2시험·ERGON 설계·최소 인계만 `codex/home-gnosis-iris-integration-20261019`에 commit/push. 시작/원격 기준5102571c65621d971609389110cd1bf2963f843f, ff-only pull 최신 확인. 정확 전송 커밋·결과는 [집 마감 인계](HOME_CLOSEOUT_20261020.md)와 릴레이 최상단 후속을 따른다.
- 아래 ‘push 승인 대기’는 이전 시점 기록이다. 이번 승인은 운영main/Production/공개 IRIS/DB/실게임 행동·자동 생산 코드 구현을 포함하지 않는다.
- 내일 순서: 수신/ACK → CHRONOS 표시와 저장/이동 회귀 → ERGON 설계/실제 코드 차이 → 첫 end-to-end 실행기 누락 계약과 검증 기준만 확정. 구현·재료 소비는 새 승인 전 시작하지 않는다.

## 2026-10-20 집 — CHRONOS 표시·ERGON 통합 설계 / 로컬 승인 범위

- 브랜치 `codex/home-gnosis-iris-integration-20261019`, 대조 HEAD `5102571c65621d971609389110cd1bf2963f843f`. 이번 변경은 미커밋·미전송이며 **push 승인 대기**다. 아래 야간 전송 기록과 혼동하지 않는다.
- 표시 CHRONOS/크로노스 통일: 제품4파일의 문자열·주석만 변경. 내부 `kronos`·저장 구조·라우트·기능은 유지한다. 기존 미커밋/개인 자료와 삭제 상태를 보존한다.
- [명칭 검증 보고](CHRONOS_NAMING_QA_20261020.md): 전체 Node611통과/3skip, 격리 빌드60·tsc, 표시/자동 저장 브라우저 통과. 기존 lint 진단·IRIS 탐색3실패는 명시적으로 남겨 둔다.
- [ERGON 통합 설계](superpowers/specs/2026-10-20-ergon-goal-production-integration-design.md)와 뉴월 인계서를 갱신했다. 부족분→목표 생산·진척 보존/재조회·관측 기반 ETA·로컬 우선 무료 제약이며 신규 실행 구현은 아니다. 실제 게임 소비·운영 DB·main·Production·공개 IRIS 변경0.

## 2026-10-20 집 — 야간 후속 후보 / 먼저 전용 인계 확인

- **전송/화면확인완료01:31KST:** 제품2549718 기능브랜치push/원격exact·main06e1eca유지, Vercel dpl_Cj6zrxhT62oXjENHhxEH5M11WcUv 정상UI Ready/Preview·같은SHA/GHsuccess. 실제Preview `/party`에서 통합매어2·지옥3·지옥4 순서·목표3던전 표시/취소확인·파티쓰기0. native설치본/실게임·운영생성수정은다음단계. 이번결과문서마감까지최신HEAD받을것.

- 마감검증: Node608/605PASS3skip0fail·16개browser PASS·lint/정확소스격리60build/독립tsc0·nativefontfixture PASS·개인6/문서7115/순월40보존0. 결과를 실게임 성공으로 확대하지 않는다. 최신 전송 SHA는 다음 누적.

다음 순월은 **`docs/IRIS_OVERNIGHT_HANDOFF_20261020.md`부터 읽는다.** 한설이 수면 중 자율 ERGON UX/설치글꼴 개선·검증·주간3% 전송 마감을 요청. 브랜치 `codex/home-gnosis-iris-integration-20261019`, v2.322후속후보/운영v2.321·IRIS0.4.1 유지. 승인 어비스5행은01:04KST 운영적용·새33~37/원래31행hash동일, 이전 승인대기 표기는 당시 경과다. 저장줄/ERGON 직접품목선택·(?)·산출초과/폰트목록·미리보기·키보드 로컬 개선, 공개ERGON잠금/게임소비0·개인dirty보존. 최종검증·전송SHA/Preview결과는후속누적.

## 2026-10-19 집 — 어비스 난이도 누락 우선 전환 / 운영 추가 승인 대기

한설이 매우어려움2·지옥4 통합3종 누락을 지금 우선 수정하라고 요청했다. readonly Supabase 확인 결과 허상만 두 행 존재, 광기·물길에 없고 광기지옥3도 누락. 기존 getPartyContentOptions의 교집합이 자료대로 제외한 것으로, union/고정버튼으로 우회하지 않는다. 일반파티/버스생성·수정/clientguard/serverGuildBusSettings/IRISSynaxis 공통 카탈로그 경로 확인, 관리자 난이도명 자유입력. 총5행(두 난이도×광기/물길+광기지옥3)을 기존 허상 기준으로 복사할지 한설에게 운영 자료 추가 승인 요청. 승인 전 운영쓰기/스키마/RLS/배포0. 상세 수치와 상태는 최신 BETA_FEEDBACK. 신규 매우어려움2 순위·배지 표기 후속 코드 점검 대상이며 수정 미완료. 기존 저장줄 로컬 후보와 ERGON read-only 조사/개인dirty는 보존한다.

## 2026-10-19 집 — 상단 저장 안내 로컬 개선 / ERGON 수량 후속

- 한설 승인: 플로팅 하단 저장 상자를 없애고 `생텀 선택` 위 sticky header에 `저장 대기 N개 · N초 / 지금 저장 / 버리기` 한 줄로 배치. 완료 직후 행 제거, unknown/conflict/expired는 접힌 복구 안내를 남기며 미확인 결과를 재전송하지 않는다. 일반 사이드 바의 기존 네 모서리 위치 설정·미리보기·완료 안내는 보존한다. 저장 controller/15초/서버/native/원장 변경 없음. 로컬 소스만 수정, 공개 IRIS0.4.1·ZIP·배포는 아직 그대로다.
- 실제 React 새 시험: header 순서 RED→GREEN, 320/390/520 폭×18/20/22 글자에서 한 줄·버튼 잘림0, 카운트다운/수동 저장/버리기/완료 후 숨김/unknown 복구/메뉴 접기·재열기 PASS. 기존 floating save overlay browser PASS, 전체 Node601PASS3기존skip0fail·scoped lint·격리 독립tsc/Next60 build PASS. 마지막 작은 글자/여백 보완은 CSS뿐이며 다음 공개 전에 최종 상태 재검증한다. 사용자 설치본 실게임 검증은 별개다.
- 한설이 이번 작업의 잔여15% 자동중단 기준을 명시 해제했다. 과거 누적/이전 지시는 당시 기록으로 남긴다. 공개 ERGON 잠금·운영 DB 승인·실제 게임 재료 사용 직전 승인 규칙은 유지한다.
- ERGON 후속 원인: `DesktopErgonExecution.prepare`는 가공 목표 수량을 native intent에 포함하지 않는다. native `DesktopLifeExecutor.Intent`도 수량 채집/제작만 허용, `DesktopLifeCli.PerformAsync(altering)`는 `execute_altering`에 displayName만 전송한다. 가공 결과는 작업 등록 증가를 registered로 확인하며 생산 완료가 아니다. 따라서 목표100개를 한 등록으로 처리하는 현 구조를 수량 완료로 안내하면 안 된다. 묶음 가공은 시설 여유·단위 산출·등록/수령·비용 확인 후 별도 계약이 필요하며 임의100회 반복 금지.
- 현재 CLI status는 disconnected/game_off(실제 exit1)이고 표준 로컬 CAPABILITIES 캐시가 없다. 게임 자동 실행/재료 소비0, 사용자에게 게임 접속 또는 코드 분석만 계속할지 질문했다. 게임 접속 뒤 readonly capabilities부터 확인하고 현 스키마를 근거로 수량 계약을 정할 것. 기존 queue·목표진척·즐겨찾기를 중복 구현하거나 public gate/과거 unknown을 해제하지 않는다.
- **연결 판정 정정:** 한설이 게임 실행 상태/사진을 확인했다. 제한 환경 status의 game_off는 실제 종료로 확정하면 안 된다. 일반 권한 readonly 재조회는 connected/exit0. 최초 판정을 근거로 게임 재실행을 요구하지 않는다. readonly capabilities/get_alterable_items(가죽)/get_altering_works만 조회, 재료 소비·이동·수령0.
- **현행 공식 가공 계약:** execute_altering은 displayName만 받고 성공 1회당 작업1건 등록 뒤 시설 UI 자동 종료. N건은 각 started 결과 뒤 다시 호출하며 회당 날개5(성공 cost 확인). 가죽+ ProducedPerWork=3/Alterable=false/queue_full 관측. 현재 가죽 시설 완료 작업7건(가죽+4/가죽3), 전체 완료23건. 이는 현재 점유 관측이지 시설 최대 정원7의 확정 근거가 아니다. 순수 추가100개 목표라면 재고 무시 시34건/102개·등록비170날개가 계산되며, 초과2개 동의·실재료·시설 회전/수령·비용/unknown 보호를 별도 설계해야 한다. 기존1건등록을100개완료로 고치거나 임의100회 실행 금지.
- 좁은 읽기 전용 검토 C0/I0/M1: 다른 캐릭터 unknown이 현재 pending의 즉시저장을 막는 새 inline gate 발견→새 mixed-character 시험 RED 확인→선택 캐릭터+계정공용 pending에 한정해 버튼 가능 여부 계산 GREEN. 저장/버리기 적용 범위 title 추가. 다른 캐릭터 unknown은 명시 복구만 가능하며 자동 재시도0.

## 2026-10-19 21:25 KST — 0.4.1 운영 마감

제품4480646f0b6238dbaff71a7ddb6fbf995c47f631 main+통합원격exact, Vercel dpl_3Z2KVcSMJnMxuZmp8ye3HZ5E75ds 정상UI Ready/Production/현재운영도메인/정확SHA. 실운영download4폭/0.4.1metadata·ZIP595192/SHA07b5c1db6c046ab4dbf9d4d406c0fd09c35ff7bd83a00c4d03bb19642ba4dacd·핵심6GET/guest2API401/pageerror0 PASS. notesJSON은‘버그픽스’만, 한설지시대로신규공개공지0/기존0.4id19유지. 이제0.4.1업데이트가능. 실제게임저장/Alt~ 체감은한설재확인대기. 이문서마감까지최신HEAD받을것·문서전용/구조변경없음·개인dirty/보호큐/양쪽미ACK보존·DB구조권한0.

## 2026-10-19 21:21 KST — 0.4.1 긴급 수정 후보 / 공개 공지 추가 금지

- 한설0.4.0 실사용 P1: 하단‘지금저장’/저장팝업+Alt~로 로고/메뉴클리핑·먹통,15초후회복. bodyportal 밖클릭오인close RED→workspaceportal/준비전표시보류·panel4좌표 GREEN. 원인/재현은최신BETA_FEEDBACK. queue/controller·native production/서버저장·15초timer 무변경/대기ID보존, ERGON잠금/GNOSIS준비중유지.
- 버전0.4.1/웹v2.321, 표시JSON notes0.4.1은‘버그픽스’만. 한설최신지시로 핫픽스공개공지 새작성금지. 기존0.4.0 공지는정상UI게시완료id19/SANCTUM시스템·중제목7개/표준제목·note=iris연결확인, 이전권한대기는해결됨.
- fresh601PASS3skip·최종독립타입/lint/Next60·새저장브라우저/기존focusdialogupdater PASS, 독립C0I0M0/관련31PASS. native0.4원본helper→0.4.1실EXE/fresh offlineWebView·아이콘·보호지문PASS. ZIP595192/SHA07b5c1db6c046ab4dbf9d4d406c0fd09c35ff7bd83a00c4d03bb19642ba4dacd. 사용자IRIS정상종료확인·강제종료/게임키입력0. 운영push/Ready/실해시는후속.
- 최신개인dirty·미ACK릴레이/순월GNOSIS제품 보존. 운영DB/RLS/권한직접변경0. 실사용자게임창 재확인은배포뒤한설확인이필요, 모의회귀를실게임해결로확대하지않는다.

## 2026-10-19 21:00 KST — 운영 공개 완료 / 공지 권한 전환 대기

- 최신 제품 `3e6f7ae456576dd8bb145b91a1dddd6082d5c2da`는 main과 `codex/home-gnosis-iris-integration-20261019` 양쪽에 정상push/원격exact. 결과 문서 마감까지 최신HEAD를 받는다. 웹v2.32/IRIS0.4.0 공개. Vercel dpl_7rwKTwyaDQNrYN49xnvTLcRhCh5V 정상 로그인UI에서 Ready/Production/Current domain/정확SHA 확인, GHsuccess. 이전 미배포/보류는 당시 경과다.
- 실운영 다운로드4폭/metadata·실ZIP595194·SHAea2a4f784fde6e79b632582681525e651b9ac1debcbb61aab57d58ce4ec04fd3/6핵심GET200·guest2API401/pageerror0/공개notes0.4.0세구역 PASS. 로그인후실저장·파티생성·새사용자다중DPI는 추가검증이며 성공으로확대금지. 에르곤 UI/native 잠금·그노시스 메뉴준비중, 기존직접URL로컬시제품한계 그대로.
- 남은1: 뉴월·부마스터 브라우저는 생텀업데이트 작성disabled. 한설계정전환 요청했고 공지未게시. 새0.4공지중복없음 확인, 열린 `/kerygma/write` 내용미입력. `UPDATE_POST_IRIS_0.4.0.md` 중제목/문장문단·SANCTUM시스템으로 기존정상UI게시 후 결과기록. 권한우회·DB직접쓰기금지. 완료된 공개업데이트 자체는 이 공지와 별개로 사용할 수 있다.
- 운영DB구조/권한0·개인6상태/7115줄/순월40제품보존. 문서전용결과마감/구조변경없음. 임시격리서버3119는 정상중지, 게임/사용자IRIS강제종료0.

### 2026-10-19 20:52 KST 최종 후보

아이콘추가요청/호환숨김+아이리스로고표시 승인 완료. DesktopReleaseFiles는 첫실행에 동일바이트 `아이리스 로고.ico`를 생성하고 IRIS.ico를 숨김. 기존다른파일/링크 비덮어쓰기·읽기전용failsoft, builderZIP hidden 명시·정확10파일. 최종공개ZIP595194/SHAea2a4f784fde6e79b632582681525e651b9ac1debcbb61aab57d58ce4ec04fd3. 원본0.3helper로 이 최종ZIP→실EXE0.4/offline freshWebView·표시파일·숨김·보호지문 PASS(Temp iris-update-live-9bb81c89daca46e4a7d2b1cd2b017f8c). 앞선594801은이전후보경과다. Node601PASS3skip·최종웹v2.32 Next60/독립타입·l​​int·React3회귀 PASS, 독립릴리스/아이콘review각C0I0M0. 개인6상태·양쪽7115줄/40제품보존. 정확전송/운영검증·공지게시 결과는후속누적한다.

## 2026-10-19 20:45 KST — 공개 업데이트 승인 후 출시 준비

- 한설이 GNOSIS 기존 준비중 메뉴 유지 조건으로 통합 코드 동반 push와 IRIS 플로팅 공개 업데이트를 승인했다. 아래 운영 보류는 당시 경과이며 이번 IRIS0.4.0/웹v2.32 범위에서 해제, DB 구조/권한 변경은 여전히 승인 대상이다.
- 공개 ZIP594801bytes/SHA256c2b306d4a0e222b46a98ce7450284c73f2beec1b3b949d72a5b81435a347ee02 생성. 원본 공개0.3.0 보존/추출 후 기존 helper로 실제0.4.0 교체와 fresh offline WebView committed·보호 파일 지문 동일 PASS. trial은 Temp/iris-update-live-ba8d9e20ea64492eb86437319b5e9ec3. 사용자 설치본 강제종료/게임행동0.
- 전체Node601PASS3skip/패키지allowlist·manifest·unsigned·updater정책/프로세스3경로/HTTPS·실React잠금/업데이트요약/초점복귀 PASS. 최종격리build/타입·독립검토·운영push/화면검증 결과는 후속 기록. 에르곤 잠금/원장보존·가공100개미완료/GNOSIS로컬시제품 한계 유지. 최종공지 초안은 UPDATE_POST_IRIS_0.4.0, 게시전이다.
- Vercel 직접 MCP는 동일팀scope403/권한부족이다. 다른팀/토큰추출로 우회하지 않고 기존 Git 자동 배포와 GitHub 상태·운영 읽기 검증을 사용한다. 직접 Ready 확인과 실운영 확인을 구분한다. 개인dirty/양쪽미ACK인계 보존, 계획은 docs/superpowers/plans/2026-10-19-iris-floating-release.md.

## 2026-10-19 20:07 KST — 통합 전송 확인

- `origin/codex/home-gnosis-iris-integration-20261019`에 제품 `64cdd50c36619677a50900d41ac15d28d080e39d` 정상 push·원격 exact 확인. 이 결과 문서 마감까지 최신 HEAD를 받는다. 상세 순서는 `docs/HOME_INTEGRATION_20261019.md`.
- 제품 자동 Vercel 미리보기는 GitHub status pending(CTJVJ6ZKwCn5vMkP7WBQuBaKQ3pN). Ready·실화면 확인 미완료. 운영 main1d8e374/DB·공개 ZIP·공지 유지, 운영 배포는 한설 별도 승인 전 금지.
- 최종 보존6개 개인 상태/7문서7,115줄/40개 순월 제품 오류0. 문서 전용 결과 마감이며 구조 변경 없음. 아래 양쪽 기존 인계는 삭제하지 않았다.

## 2026-10-19 20:00 KST 영겁 — 집 주말 작업 + GNOSIS 통합 / 운영 배포 보류

- 다음 작업자는 **`docs/HOME_INTEGRATION_20261019.md`부터 읽는다.** 통합 브랜치 `codex/home-gnosis-iris-integration-20261019`, 주말 보존82e2325/기존95e38a4와 순월06c4097(제품83b437a)을 통합했다. main/운영 DB·운영 배포/공개 ZIP·공지 변경0. 한설의 최신 지시는 운영 DB·배포 전 별도 확인이다.
- 충돌은 공통 문서6개뿐. 양쪽 최신 내용을 누적해 공통7문서의 비어 있지 않은7,115줄 누락0, 통합 직후 집83파일 바이트/삭제 상태 동일·순월40제품파일 동일 확인. 88변경 ignored별도백업과 복구 커밋 보존. 개인문서/루트기존삭제/개인테스트/실행명령어는 제외하고 그대로 남겼다.
- IRIS 어제 중단 작업 후속: 한설이 기능창 유지+WASD 잘 됨을 확인. ERGON은 앱/플로팅 자물쇠·준비중·disabled/hidden mount0, native 새 prepare/confirm/collect와 ergon진입 차단·stop/history/원본기록 보존. 단일 updater의 portal 요약상자를 실제 floating workspace에 연결·2줄요약/버전캐시/기존보호설치창, ref-render 오류는 state cache로 수정했다. 임시 focus-debug endpoint와 진단 코드만 제거, ignored 원본 기록 보존.
- IRIS 소스/요약은0.4.0 후보이며 공개 ZIP/download.json 및 운영은0.3.0 그대로. 비공개 compile만 수행, 최종 ZIP 교체·old→new helper/WebView/보호해시 시험과 운영 승인·배포확인·공지게시 남음. 따뜻한 중제목/문장별 문단 초안 `docs/UPDATE_POST_IRIS_0.4.0.md`는 게시전이다. 통합 전체를 main에 올려 GNOSIS 로컬 시제품까지 함께 공개하지 않는다.
- fresh검증 Node604/601PASS3기존skip0fail·격리소스 독립tsc/Next60build·GNOSIS/수정IRIS lint PASS. nativechrome93/bridge/defaultlock/privatecompile·실React lock/updater/focus PASS. 실제 격리production GNOSIS4폭·개인저장reload·공유Escape·writer시각확인, 3GET200/admin-preview404/debug404. 독립 좁은review C0/I0·문서누락0. 루트 tsc의 오래된 `.next/dev/types` 참조 오류는 캐시삭제 없이 격리사본 독립검증으로 구분했다.
- GNOSIS3D/서버공유·관리자운영설정/ERGON수량100개반복 미완료, 사용자설치본 업데이트 성공 아님. 순월은 원본dirty보존→통합브랜치fetch/pull→최신문서/릴레이ACK. 정확pushSHA/원격결과는후속마감 기록을 따른다.

## 2026-10-19 17:05 KST 순월 — GNOSIS 기능 브랜치 인계 후보

- 이번은 운영 출시가 아니다. 운영 v2.31/IRIS0.3.0과 main1d8e374 유지. 별도 codex/gnosis-dressroom에 GNOSIS 메인/에디터/댓글/분류/패션 저장·공유만 구현했다. 운영 DB/RLS·IRIS 제품·개인 파일 변경0, main병합·수동배포0.
- 집 통합은 docs/GNOSIS_HOME_MERGE_20261019.md를 먼저 따른다. 집의 최신 주말 작업은 origin/codex/iris-checkboard-classes4234e54에 있으며 이 브랜치에는 제품을 섞지 않았다. IRIS 플로팅 미해결I2/M1은 원격 문서로 읽고 ACK했을 뿐 해결하지 않았다.
- 완료/남음/검증 상세는 docs/DRESSROOM_HANDOFF.md 및 전용 병합 안내. 개인저장10개/PNG클립보드/패션 글쓰기는 브라우저 시제품이며 실제3D착용·의상염색/계정저장·여러길드원서버공유는 미완료다. 코드만 Git 인계되며 로컬 코디·테스트 글은 집으로 옮겨지지 않는다.
- 현재 검증 Node477/474PASS3skip0fail, 독립tsc/Next60페이지/GNOSISlint PASS. 기존관리자lint4오류는HEAD동일. 검토 중요2보완 뒤 최종회귀·전송결과는 후속 기록. 이전 공식배포 내용은 아래 그대로 보존한다.

## 2026-10-18 22:55 KST — WASD 실제 capability 누락과 복귀 시 자동 접힘

- 적용 후속 22:57 KST: 한설 정상 종료 확인→기존 IRIS 부재/개발 page200→Development3964 단일 시작(22:57:01)/Responding=true·stdout/stderr0. live state capable=true 확인. 모듈 유지+게임 재클릭 없이 WASD 동시 확인을 한설에게 요청하며, 실제 성공 판정은 아직 대기다. 제한 환경의 Get-Process 미탐지는 정상 권한 읽기 조회로 존재/응답을 확인했으며 중복 실행하지 않았다.

- 최신 root: native `FloatingState()`가 optional `gameFocus`를 실제로 발행하지 않아 앞선 hook 전부 비활성이었다. 로컬 live trace capable=false로 확인, 실제 DTO 회귀 RED→GREEN/`gameFocus=true` 추가. Development29996(22:44:25 KST) 적용 뒤 한설은 움직임 복귀 확인, 대신 메뉴 버튼의 기능창이 즉시 사라진다고 보고했다. 이동 성공과 창 유지 성공을 혼동하지 않는다.
- live trace의 frontend close0/성공한 handoff 뒤 surface→none 및 소유 Form 재현: 지연 native Deactivate callback이 의도한 게임 복귀와 최신 명령을 접는다. `gameFocusHandoff`는 성공 복귀를 다음 Activated까지 구분하며 실패한 중복 요청으로 지우지 않는다. `floatingInteraction` 세대는 오래된 blur가 새 activation/command를 닫지 못하게 한다. 새로운 외부 앱 전환은 기존 접기 유지. 외부 앱 초점 훔치기/키 합성·후킹 없음.
- 검증: chrome92(직렬화 capability/복귀관측상실/중복요청/새모듈/신규 외부앱 포함), addon83, bridge/presentation, 전체 Node exit0, tsc/eslint, React focus·Hub 통합, 비공개 `private-handoff-lifecycle-build` PASS. 사용자 정상 종료 완료, 최신 native 단일 재실행 및 기능창+WASD 동시 실사용 확인이 다음 행동. 강제 종료/게임 행동/원장 변경0.
- 임시 진단 `lib/irisFocusTrace.ts`와 `/api/iris/focus-debug`: development+localhost+동일 Origin 한정, 정확한 enum/boolean 필드만, ignored 고정 경로64KiB 상한. 키·본문·계정/닉네임/HWND 저장0, production404. 공개 출시 전 유지 필요 여부 재검토. 독립 리뷰는 이전 사용량 제한 이후 추가 성공 판정 없음.
- 에르곤은 플로팅 자물쇠/앱 준비중으로 잠가 플로팅 중심 출시를 권장했으나 **아직 미구현·출시/push 미실행**. 가죽+100개→1회등록 미완료와 원본 보호원장은 보존. 공개0.3.0/ZIP·운영DB·버전·공지 그대로.

## 2026-10-18 WASD 추가 보고 — 창 열기/읽기 영역 후 초점 누락

- 사용자가 최신28704의 열린 크로노스 화면에서 여전히 WASD 불가 보고. 앞선 수정 성공으로 종결하지 않는다. frontend는 button/checkbox/range release만 처리해 초기/후속 module-open·일반 읽기 영역·휠에서 요청이 누락됐다. 휠 직후 W도 UI keyboard mode로 오인해 반환을 막는 재현 확인.
- `useDesktopFloatingFocus`에 mode/menu/surface 응답 후 반환, 일반 pointer release·debounced wheel 경로와 pointer-held 방어를 추가. UI keyboard mode는 Tab/방향키/Enter/Space/Home/End/PageUpDown으로 한정하며 입력창·모달·선택 텍스트는 보호. 전역 창 활성화 감시나 게임 키 전달은 추가하지 않음. native strict target/foreground/생존 보호 그대로, 새 native 코드/재실행 없음. 28704+게임29460의 메타데이터만 읽기 확인(Framework StartTime 조회 가능), 게임 입력/원장/DB0.
- 최신 `iris-floating-focus.browser.mjs`가 초기 열기·후속 모듈 응답, 빈 영역·wheel+W 경합, 입력/모달/Space·키보드 모듈 탐색을 검증한다. 실제 게임 성공은 사용자 확인 전이다. 설정/공통 dialog/헤더/단축키 실제 React 회귀·Node/타입/lint를 재확인. 공개0.3.0/ZIP/버전/공식배포·push 없음.

## 2026-10-18 21:51 KST 이후 — 플로팅 설정·게임 초점·캐릭터 헤더 후속

- 한설 추가 사진/요청: 캐릭터 선택 모달 위아래 음영, 플로팅 설정 먹통, ‘작업창’→‘사이드 바’, 체크 후 게임 클릭 필요, 중복 상단 행/로고 노란 테두리 제거, 캐릭터 헤더와 메인 메뉴 겹침. 최신 후보에서 모두 관련 재현/수정했다. 이전 미커밋과 개인 dirty를 그대로 보존하며 새로운 가공 목표 구현은 시작하지 않았다.
- `useDesktopFloatingFocus` + optional `FloatingState.gameFocus` + strict `window.game.focus` null payload. 포인터 조작 뒤 알려진 게임에만 native 초점 반환, 입력/모달/키보드 탐색 제외. 현재 foreground=IRIS·tracked PID/생존/제목/가시성/최소화 확인, 다른 앱으로 Alt+Tab 뒤 늦은 요청은 부작용 없음. 게임으로 넘어가도 플로팅 모듈 유지. 게임 foreground에서 단축키 메뉴 열기는 비활성화하지 않음. 키 합성/전달·게임 CLI 호출 없음.
- floating 설정은 Partial preferences를 직렬 실행 시점의 확정값에 합친다. 전체 fieldset의 네트워크 busy 잠금 제거, 슬라이더/체크 초안과 실패 복원·버튼별 중복 방어. 사이드 바 불투명도와 독립. Hub 상단 tools행/로고 border 제거; normal titlebar offset이 floating header에 남던 겹침은 scoped top:0으로 수정.
- modal native height는 문서의 `__irisFloatingDialogHeight()`를 기존 500ms timer에서 읽어 80..680 DIP로 제한한다. source/revision/가시성/modal 재확인, 내부 scrollHeight 포함. 배경 shade/transition 제거, underlying module 숨김/보존, modal 닫을 때 기존 module 폭·높이/일반 좌표 복원. 보호 종료는 DOM sync로 해제하지 않는다.
- 한설 정상 종료 답변 뒤 기존 앱 없음 확인, 21:51:15 KST Development28704 한 번 실행. Responding=true·stdout/stderr0·개발 페이지200. 이후 화면 코드의 header top:0은 HMR 적용 대상으로 추가 native 재실행 필요 없음. 실제 모비노기에서 첫 키/WASD·긴 목록 modal·저장값 재실행 유지는 사용자 확인 대상이다.
- 검증 상세는 `docs/IRIS_FLOATING_DIALOG_QA_20261018.md` 후속. 전체 Node581/578PASS3기존skip0fail, nativechrome88/addon83·bridge/presentation PASS, 실제 React 설정/초점/헤더·모달·메뉴/알림 회귀 및 비공개 앱 compile PASS. 독립 reviewer는 앞선 사용량 제한 이후 재요청하지 않았고 이번 후속은 자체 점검·합성 검증이다. 공개0.3.0/ZIP·운영 DB/권한/공지/commit/push 없음. 가죽+100개 반복 미완료는 여전히 별도 P1.

## 2026-10-18 21:24 KST — 플로팅 공통 창·자유 이동·설정·로고 가려짐 후속

- 최신 로컬 후보: 확인창/직접선택이 floating 유지, native modal 입력영역 분리, wide420↔980, live drag anchor, 내용 높이 bubble/둥근 region·초기직접선택왼쪽/큰닉네임, 설정4분류·일반/플로팅opacity독립·키표시연동. 게임 클릭 로고 가려짐은 자동숨김 작업표시줄의 비겹침 양보 버그, actualread/RED→GREEN으로 overlap-only 수정.
- Node576PASS3skip0fail/독립tsc·수정lint/실React/nativechrome73·addon83/bridge·정책/비공개compilePASS. 독립리뷰는 사용량 제한 중단으로 최종판정없음. 자세한 근거와 한계 `docs/IRIS_FLOATING_DIALOG_QA_20261018.md`.
- 한설 정상종료 두 차례 확인 후 최신 Development17184 정상 시작(21:24KST), 응답true·stdout/stderr0·개발page200. 실제 로고유지/자유드래그/직접선택 실사용확인 남음. 아래29208/4660은 이전 실행. 강제종료·게임행동·DB/공개ZIP/commitpush0.
- P1 새 보고 **가죽+100개→1회등록**: 목표수량이 altering 실행에 연결되지 않은 소스 경로 확인. 수량가공 자동반복 미완료, 임의100인자·재전송/원장변경0. 총비용/시설정원/등록대기수령/중단보호를 포함해 후속 구현할 것. 오늘 플로팅만 업데이트할 수 있는지 문의 중이며 출시/에르곤 숨김 결정은 아직 아님. 기존 공개0.3.0 유지.

## 2026-10-18 21:24 KST — 플로팅 공통 창·자유 이동·설정·로고 가려짐 후속

- 최신 로컬 후보: 확인창/직접선택이 floating 유지, native modal 입력영역 분리, wide420↔980, live drag anchor, 내용 높이 bubble/둥근 region·초기직접선택왼쪽/큰닉네임, 설정4분류·일반/플로팅opacity독립·키표시연동. 게임 클릭 로고 가려짐은 자동숨김 작업표시줄의 비겹침 양보 버그, actualread/RED→GREEN으로 overlap-only 수정.
- Node576PASS3skip0fail/독립tsc·수정lint/실React/nativechrome73·addon83/bridge·정책/비공개compilePASS. 독립리뷰는 사용량 제한 중단으로 최종판정없음. 자세한 근거와 한계 `docs/IRIS_FLOATING_DIALOG_QA_20261018.md`.
- 한설 정상종료 두 차례 확인 후 최신 Development17184 정상 시작(21:24KST), 응답true·stdout/stderr0·개발page200. 실제 로고유지/자유드래그/직접선택 실사용확인 남음. 아래29208/4660은 이전 실행. 강제종료·게임행동·DB/공개ZIP/commitpush0.
- P1 새 보고 **가죽+100개→1회등록**: 목표수량이 altering 실행에 연결되지 않은 소스 경로 확인. 수량가공 자동반복 미완료, 임의100인자·재전송/원장변경0. 총비용/시설정원/등록대기수령/중단보호를 포함해 후속 구현할 것. 오늘 플로팅만 업데이트할 수 있는지 문의 중이며 출시/에르곤 숨김 결정은 아직 아님. 기존 공개0.3.0 유지.

## 2026-10-18 compact·추천 모달 복구·자율 사용성 점검

- 적용후속16:40KST:한설정상종료확인후기존IRIS부재/page200→최신Development29208한번시작·응답true/stdout0stderr0. 이번compact/경계·메뉴입력영역포함후보, 실화면·소리·실조작사용자확인대기. 아래28168미적용/답변대기는이전시점. 강제종료/게임·DB/push0.

- 최종reviewC0/I0/M1의긴키캡/메뉴겹침도사용자polish요청범위RED→GREEN수정:menuopen동안badgeDOM/nativeRegion숨김·닫으면복원, geometryDTO유지. 정책/browser/chrome56/privatecompile확인·재리뷰0. 전체/타입lint마감은usabilityQA/ledger후속. 정상종료질문발송/답변대기.

- 한설추가요구/자율개선승인:36로고/57×20키캡gap2·logo기준좌우끝/독립badge, v1·v2old52만36이전·v3저장(기타설정보존). normal중앙FocusDialog복구/floating추천간결·선택3버튼180px무스크롤. hover확장없음.
- audit2명확인추가수정:메뉴·기능창알림겹침제거/새알림최초표시대기·기존10초deadline유지, 메뉴ellipse와잘리는label제거(title/aria유지), slider최종값만전송/실패복원, 중복manualfont·긴안내접기/낡은에르곤문구수정.
- RED→GREEN/관련실React·정책·Node575PASS3skip/타입lint/chrome56/privatecompilePASS. addon포커스보존시험은반복실패/HEAD동일실패·좌표동일/FG변화확인·원인미확정. 전체native녹색아님. 상세 `docs/IRIS_USABILITY_POLISH_QA_20261018.md`, plan/ledger참조·최종검토후속.
- Development28168은15:39native/최신compact정상재시작필요. 강제종료/게임원장·DB·운영ZIP/commit·push0. 개인dirty·이전미커밋모두보존. 아래inline추천기록은현재normalmodal복구로대체된과거경과.

- 2026-10-18 15:39 KST 적용 후속: 한설 정상종료 확인→IRIS부재/page200→최신 Development28168 한 번 정상시작, 응답true/stdout·stderr0. 새 native 키캡잘림까지 적용후보, 실제모양/추천·창모드·종료 실조작은사용자확인대기. 아래14952미적용/종료답변대기는이전시점. 강제종료·게임원장/DB·push0.

## 2026-10-18 추천 위치·키캡 모서리 피드백

한설종료확인뒤13:59Development14952정상실행/응답true·stderr0/page200, 종료·창모드후보적용. 후속사진의normal추천bottom fixed/BadgeRegion사각형원인을각RED→GREEN수정: normal추천은원래statusinline, floating은bubble/캐릭터상태보존; native9DIP roundedBadge와CSS9px일치. 위치/선택보호/알림실React·policy/chrome56/privatecompile·타입lintPASS. 최종Node575PASS3skip/reviewC0I0M0/diffcheckPASS, 첫bus-live-notifications1회실패→단독25/전체재시도PASS는QA보류기록. 상세 `docs/IRIS_NOTICE_KEYCAP_QA_20261018.md`. 새native잘림은14952미적용/다음정상재시작필요·사용자종료답변대기·강제종료0, 게임원장/DB/운영push0.

## 2026-10-18 플로팅 종료·창모드 설정 — 로컬 후속

- 한설 직전 정상재실행 보고 뒤 새 요청 구현. 설정 다음 전원/종료→기존 requestClose 보호, native5번째영역; 창모드 자동플로팅 기본off/즉시적용·재시작복원·전체작업창수동override 유지.
- prefs파일v1읽기/v2쓰기·구4필드/4메뉴host호환, 구host새기능재시작안내. 게임/원장·DB/운영변경0, 강제재시작0. 새native 정상재실행필요.
- RED→GREEN·새/기존실React/정책/bridge/chrome56/addon82/workspace·Node575PASS3skip/타입/변경lint/privatecompilePASS. 독립검토C0/I0/M0(실게임/설치앱재실행/DPI판단보류), 상세 `docs/IRIS_FLOATING_EXIT_WINDOWED_QA_20261018.md`. 개인dirty·이전미커밋경계수정보존, 새push없음.

## 2026-10-18 게임 내부 플로팅·최소화 로컬 후속

- 한설 요청으로 유효한 game client 안에 로고/키캡/메뉴/임시창을 제한하고 게임이동·크기축소/live WM_MOVING 보정·마지막 경계 보존을 추가. IRIS Windows최소화/bridge최소화를 로고전환으로 통일, 게임주도최소화·일반창좌표 보존.
- 상세/복구가정·검증은 `docs/IRIS_GAME_BOUND_FLOATING_QA_20261018.md`. chrome48/addon82·관련native·Node573PASS3skip/privatecompilePASS, 실제사용자재실행·mixedDPI확인전. 게임최초미탐지/너무작은영역은기존monitor복구예외를 유지한다고 안내했다.
- 새push/운영버전/ZIP/공지·DB/게임행동0, 개인dirty와원장보존. native정상재실행필요, 강제종료/추가게임검증0. 독립검토C0/I0/M1의고DPI작은영역음수geometry를RED→GREEN으로보완, 최소96×128DIP공유guard. 최종정책시험은임시쓰기권한재시도PASS, chrome48/addon82/Node573PASS3skip/privatecompile재확인. 실제mixedDPI는미검증.

## 2026-10-18 키캡 확정 후속 — 괄호 제거

표시는 `Alt + ~`, native기본폭79/높이28DIP로 축소. 로고크기/실제키/bridge구호환 보존, 설정안내도같은caption함수 사용. Node573PASS3skip/타입·l​​int/nativechrome33/실제DOM·기존floatingPASS. 최신QA참조. 폭전체적용은정상재실행필요, 새push·운영/게임행동0. 아래97폭은이전시점.

## 2026-10-18 키캡 후속 — 참고 Ctrl+Z 비율 / 정상재실행 적용 대기

한설 거의동일요청으로 키캡 높이28DIP·기본문구폭97DIP/큰굵은둥근글자/2px밝은테두리 조정. 로고크기유지. CSS+native배치/Region 수정이라 기존개발앱 정상재실행 필요(강제종료0). native/DOM RED→GREEN·chrome33/Node572PASS3skip/lint/privatecompilePASS. 최신QA 참조. 이번재조정 새push0, 운영/게임행동/원장/DB변경0. 기존 Minor/실사용미확인과 구browser실패 보존.

## 2026-10-18 영겁 — 플로팅 중요2건 수정·개발 후보 재개

- 한설 계속구현/일반진행 확인불필요 지시,4234e54 ff-only최신·개인dirty보존. 새알림 숨김수명 및 savedcompact resize edge 잔존을 각각 재현 후 수정했다. native windowVisible optionalbool/엄격parser/구host호환 추가. 게임행동·unknown원장·운영DB 변경0.
- Node575/572PASS3기존skip0fail·타입/scopedlint0·nativechrome33/정책·bridge·WebView·presentation/workspace/startup PASS, visibility/bubble/character-floating/floating/integration/ERGONedit 실제React PASS, 이번 격리webpack/privatecompile exit0 확인.
- 기존 legacy manual-intent-cancels-pending-yes backdrop 실패 재현, 구UIlocator/Synaxislint 미수정. Minor menu label nativeRegion 잘림/사용자 실제전체화면·키·DPI·이동중편집 검증 남음. 전체출시완료 아님.
- 기존IRIS0→개발서버6132·페이지200→Development3156 한 번 정상시작/응답true·자체로그0. 실제 눈검증/게임수령과 구분. QA `docs/IRIS_FLOATING_HUB_QA_20261017.md` 최신절 참조. 이번 새push/운영승격·버전/ZIP/공지 변경0.

## 2026-10-17 15:15 KST — 사용자 요청 중단·순월 인계 push

- **전송결과15:20KST:** 27e8252874ad8d3affc846daf0004a17a777ffe3 일반push/원격정확일치. 이 결과 문서의 최신HEAD까지 pull. Vercel403/CLI없음·Ready/실Preview 미확인·운영승격0. 구조변경없는 결과마감이며 새제품수정0.

- **최우선: `docs/IRIS_FLOATING_SOONWOL_HANDOFF_20261017.md`.** 사용량 사유로 추가 구현·새 IRIS 실행 중단. 코드618fadd/da152e9/4c31b54와 최신 문서 마감까지 기능브랜치만 전송한다. 미완료 후보/운영 배포 아님.
- 독립리뷰 **C0/I2/M1 미해결**: 숨김중 새알림10초 소진, savedcompact 초기resizePanel 잔존, nativeRegion 밖 menu label 잘림. 순월 우선 수정 후 실앱 검증 필요.
- Node574/571PASS3기존skip0fail 및 관련검증 기록/기존browser·lint 실패는 전용 인계/QA 참조. 실제 전체화면·키·DPI 미검증. 한설 종료확인/새후보 실행0.
- 운영main1d8e374·SANCTUMv2.31/IRIS0.3.0·공개ZIP·공지·DB·개인dirty 보존. 아래 로컬/미push/종료요청중은 이전 시점 경과다.

## 2026-10-17 영겁 — IRIS 플로팅 허브·설정·알림 로컬 후보

- 한설이 서면 설계/계획과 직접 구현+최종 독립 검토를 승인했다. 현재 폴더 사용 승인. 후속으로 아이콘 크기·투명도·호출 키 설정을 요청했다. 15% 중단은 사용자가 재지시할 때까지 해제 상태다.
- 새 native 표시 전용 bridge와 독립 위치 저장/Region/Alt+백틱, 로고·반원 메뉴·설정·기존 모듈 수명 보존을 구현했다. 기본 `(Alt + ~)`, 크기52/불투명도80; 키 등록 실패는 이전 키/클릭 복구 보존.
- 공통10초 비차단 정보/게이지, 무기한 캐릭터 말풍선 및 기존 재확인 보호, 심층 현재 제보 목록/신규1회·초기·재접속·삭제 방어. 게임 요청/DB 권한·구조 변경 없음.
- QA: `docs/IRIS_FLOATING_HUB_QA_20261017.md`. 전체 Node573/570PASS3기존skip 이후 추가 시간회귀1건 GREEN, 최신 전체 재실행 중. native chrome24/bridge/startup/WebView, React floating/설정·지연닫기·마운트보존·10초·실CharacterWatch의 수동선택/늦은Yes차단·심층/에르곤/파티 PASS.
- 미확인: 사용자 실제 native 위치/투명/키/바깥 클릭/전체화면 왕복. 정상 종료 확인 요청 중이며 강제 종료/게임 행동0. legacy character browser의 배경 picker 클릭1건과 기존 Synaxis lint2건은 QA에 구분 기록했다. 최종 독립 검토/최신 build는 다음 마감 결과를 따른다.
- 이전 ERGON 수정은 `618fadd`, 플로팅 순수 정책은 `da152e9` 로컬 커밋. 이후 통합 후보 로컬 체크포인트 진행. 명시 push 없음/운영main·버전·공개ZIP·공지·DB 유지, 개인 dirty/삭제 보존.

## 2026-10-17 영겁 — 이동 중 내부 메뉴/계획 편집 잠금 분리

- **실검증 후속:** 한설이 탄월에서 **한떨(빙결술사)**로 바꿔 직접 가죽4건 수령. 이동·게임 보상·IRIS 수령완료/최근작업 완료확인·가공완료8→4를 첨부로 확인했다. 이어 목재4건도 전부 수령했다고 사용자 확인했다(마지막 사진은 목재 이동중이라 앱 최종판정/완료0 미확인). 날개 표시는77,427 동일이나 정확 비용0 실측으로 확정하지 않는다. 에이전트 새게임요청0/과거unknown 성공주입0. 아래 실수령 대기는 당시 경과이며, 남은 실제확인은 이동 중 메뉴전환/편집과 금속unknown 원인이다.

- HEAD7ec1d74 위 로컬 후속. 사용자 신고: 수령 이동 중 IRIS 메뉴가 막힘, 가죽 수령은 이전 종료 미확인. 실제 페이지/보호 bridge 합성으로 전체잠금 RED 재현 후 일반 탐색·설정·계획 편집과 계정/캐릭터·추가 게임 요청 잠금을 분리했다. 이미 보낸 대상/수량은 고정하고 내부 편집·화면 숨김에도 종료 관측을 보존한다.
- 독립리뷰 I2(스탯 자동 native조회, 확인 접수와 늦은 idle 경합) 각각 actual React RED→GREEN 보완, 재검토 C0/I0/M0. `DesktopStats.readPaused`, `DesktopCurrencies.readPaused`, Center.identityLocked/ContextActions.accountDisabled, Ergon.gameBusy/pinnedTarget, Execution.sentRequestId가 추가됐다. 자동 다음 소비/미전송 준비 취소·중지/원장 보호는 그대로다.
- 한설이 금속은 실제 수령 완료·완료 수 감소를 확인. 가죽 차단은 앞선 금속 unknown 보호와 일치한다. 실제 CLI 원본/실패 단계가 남아 있지 않아 false unknown의 실제 원인은 미확정. 작업명 철괴(광석)와 보상명 철괴가 다르면 기존 판정이 unknown인 합성 사례는 확인했으나 실제 응답이라고 단정하지 않는다. native·원장·정책 완화/직접게임소비0.
- 기존 자동 분리는 이전 세션 unknown·12분 경과·같은 게임프로세스/문서/문맥/원본해시·CLI/실행부재·두 번의 안전 activity 증거를 요구한다. 새 앱 시작만으로 수령 성공/분리 완료로 쓰지 말 것. 한설 정상 X 종료 뒤 Development8388/응답true/자체로그0·페이지200. 실제 새 화면·가죽1회 검증 대기, 금속 재전송 금지.
- 검증: Node565/562PASS/3기존skip, 타입/수정 파일 ESLint exit0(경고0). 관련 actual React 수령/workspace/list/catalog/수량/제작목표/actions/readplanning 및 새 실제페이지/편집중실행 회귀 PASS. 루트 `npm run lint`는 .superpowers 과거 생성빌드/기존 scripts·tests까지 검사해 실패(기존산출물 포함82983문제); 전체lint성공으로 표현하지 않는다. 상세 최종 마감은 `docs/ERGON_BUSY_NAVIGATION_QA_20261017.md`.
- 개인dirty/삭제/새파일 보존·제외, 공식push/main/버전/ZIP/공지/운영DB 변경0. 15% 중단 해제는 최신 사용자 지시대로 유지한다.

## 2026-10-17 영겁 — 재부팅 후 중복 경고·두 줄 카드 후속

- 한설이 어제 작업 계속 진행을 요청했다. HEAD0ac7ade/수신 ACK·개인 dirty 유지, 어제 중단한 local Catalog/PlanRow/CSS/회귀 변경을 이어받았다. 15% 중단 해제는 최신 지시대로 유지하며 push·운영배포 승인으로 확대하지 않는다.
- 실제 공식 목록 동명4종의 이름 단독 key 충돌을 분류+이름+동명 등장순으로 수정했다. 원본 행 삭제/병합0, 검색·즐겨찾기 갱신의 잔존 행 실제 React RED→GREEN. 한설 승인 기본 두 줄 카드에 맞춰 반복 라벨/입력 폭을 줄이고 기존 편집·진척·접근성 이름을 보존했다.
- 높이 회귀의 `.iris-ergon` fixture 래퍼 누락을 수정했으며 올바른 범위의 기존 production 행도 높이 기준에 실패함을 별도 확인했다. 새 짧은 행은390/18에서 약74px, 320/390/768/1280×18/20/22 넘침·밝고어두운 캡처 및 기존 편집 회귀를 검증 중이다. 정확한 최종 수치/개발 후보 상태는 아래 후속 마감 기록을 따른다.
- 재부팅 뒤 IRIS/3000서버0 확인, 로컬 개발 서버를 재시작했다. 실제 게임 명령·원장 수동변경·main/공개ZIP/공지/DB/push0. 기존 actual 앱수령/원격 확인창 실검증은 직전 질문→승인→1회→결과질문이 필요하다.
- 후속 후보를 정상 시작했다: Development19644·응답true·stdout/stderr0바이트, 로컬페이지200. 실제 앱 화면의 사용자 확인/게임수령 성공은 이 수치로 대체하지 않는다. 재부팅 전24660은 과거 프로세스다.
- 최종 검증: Node565/562PASS3기존skip0fail, 관련 실제React10그룹 PASS(동명/catalog/list/queue/최종품예약/list-progress/workspace/workbench/goal-workbench/read-planning), tsc·관련lint·격리webpack exit0. 밝고어두운 캡처 확인 및12폭/글자조합 넘침0. 로컬 커밋/개인dirty제외, 원격push0. 다음은 상단 캐릭터 선택 후 새 작업계획 사용자 확인이며 실제수령은 별도 승인한다.

## 2026-10-16 영겁 — 목록형 ERGON 작업대 로컬 구현

- 기준07b3f4f에서 한설의 상세 설계·실행계획 승인 뒤 직접 구현했다. 드롭다운/중복 보관 편집을 기본 노출 작업 목록으로 대체하고 수량 증감·직접 입력·교체·제거·분류별 즐겨찾기를 연결했다. 넓은 창은 품목/목록/선택 상세3영역, 좁은 창은 목록 우선·품목 펼침이다. 기존 계획 schema1/최대50개·공유예약/진척/원클릭 수령 경로를 재사용한다.
- 가방/계정창고/캐릭터창고는 별도 표시하고 전송기·부스러기·게임 확인 조건을 유지한다. 환경/계정 전환은 이전 계획·즐겨찾기를 동기적으로 숨기고, 손상된 저장 원본은 덮어쓰지 않는다. native 제품 코드/게임 파일/원본 journal/운영 API·DB 변경0.
- 코드26280cb/3f5d87d/42c6b96. 최종 독립 리뷰 C0/I3/M1: 추가 실패 시 실행 대상 변경, 상세 변경 후 목록+ 무시, 다른 캐릭터 진척 차감의 세 Important를 실제 React RED→GREEN 한 수정 단계로 보완했다. 계정·캐릭터·현재 산출량까지 검사하며 재리뷰하지 않는다. 제목 중복1개는 Minor로 보류했다. 자세한 판단/검증·남은 범위는 `docs/ERGON_LIST_WORKBENCH_QA_20261016.md`를 따른다.
- 최종 Node565/562PASS3기존skip0fail·타입/lint0, ERGON17+공용대화상자2 actual React 합성그룹 PASS, 격리webpack/nativecollection·executor·workspace bridge exit0. 추가 QA의 배경클릭 focus 소실도 RED→GREEN으로 같은 수정 단계에서 보완했다. 390×720 sticky 안내/버튼은 스크롤 후 hit-test 접근 확인, 순간 겹침 제거로 표현하지 않는다.
- 최신 사용자 지시로 **15% 잔여 중단은 다시 말하기 전까지 해제**다. 이전 문서의15% 규칙은 당시 경과. 직전 질문→승인→게임행동1회→결과질문, 원격모달 동의/자동chain 미구현·원본 unknown 보존은 그대로다. 직접 CLI 성공과 새 앱 실수령 성공을 혼동하지 않는다.
- 현재 로컬 검증/개발 후보이며 공식 push·운영 main·버전·공개ZIP·공지 변경0. 사용자 개인 dirty/삭제/새 파일은 보존·제외한다. 앱 실수령은 새 후보 정상 시작 후 별도 직전 승인을 받아야 한다.
- 기존 IRIS/직접런처0 확인 후 Development24660 한 번 시작, `/iris/desktop`200·응답true·stdout/stderr0바이트. 화면 사용자 확인을 요청했고 실제 앱 시설수령은 미검증이다. 자동 실행/직접 게임 명령은 보내지 않았다.
- 최종 검토/자체QA 보완 코드는 로컬3d8af7e에 커밋했다. 이 문서마감까지 미전송이며, 다음 공식push 승인 때 RELEASE_NOTES와 버전/배포 확인을 함께 수행한다.

## 2026-10-16 인계 전송 결과 — 코드 d63fd03 / 새 제품 구현 중단

- `d63fd03fbe3c42c135faae45d7ee17b071539419` 일반 push 및 ls-remote 정확일치. 선행34e6aef 포함. 원격main1d8e374 그대로, 개인변경 제외. 이 결과 문서마감의 최신 HEAD까지 pull할 것.
- GitHub 해당SHA Vercel pending 관측(BLZrpv5U7GiQEWESKekmfzssM1wS). 같은 team/project MCP403·로컬CLI없음이라 Ready/실Preview페이지 미확인. 우회인증·공유링크·수동배포/운영승격0. 전송성공을 앱실수령/공개완료로 쓰지 않는다.
- 5h최근18%/주간42%잔여,15%침범 전 마감여유로 새제품구현은 중단하고 필수인계 전송만 마친다. 집은 신규요구 문서의 목록형작업대 제안 방향확인→설계를 이어갈 것. 앱후속native 정상재시작/실수령 미검증·모달자동승인0 유지.

## 2026-10-16 순월 후속 — 직접CLI수령 성공 / native 차단·창고 조건 / 새 작업대 요구

- 인계 마감 준비: 최근5h잔여21%라 큰 재설계는 승인 전 새로 시작하지 않고 검증된 수정과 요구사항을 먼저 마감한다. 15%이하 새구현금지 유지. 기능브랜치 정상 전송 결과/정확SHA는 후속기록, 운영배포·앱실수령완료로 표현하지 않는다.
- **전체 요구 필독:** `docs/ERGON_WORKBENCH_REQUIREMENTS_20261016.md`. 기본노출 편집목록/수량·품목수정·삭제/즐겨찾기/한화면 재료·진행, 원격전송기·부스러기·주간창, 과거생산요구와 집순서를 모두 기록. 큰 재설계는 제안 단계이며 승인/구현완료 아님. 기존 접힌queue에 수량수정/제거가 있으므로 중복구현하지 말 것.
- 실제게임: 한설 직전질문→승인 아래 CLI상급목재수령1회/이동·수령 사용자확인. collected7/완료15→8·목재7→0/센마이평원→이멘마하/날개96,790 동일. 다음 행동은 다시 직전승인→1회→결과질문. 앱수령 성공/과거craftunknown 성공·해제근거 아님, 원장수동변경0.
- 근본오류: 동일native readonly probe가 Framework게임HasExited/StartTime에서 Win32접근거부5. QUERY_LIMITED_INFORMATION/GetProcessTimes 생성·종료 메타데이터 조회로 수정 후 실ready. PID/생성시각·idle·CLI·lease·원본방어 유지, 게임메모리/파일/디버그·권한상승0. 실제수령은status/body 없는직접body여서 collect한정 엄격완료판정 추가(전량·시설완료0·알려진보상), 타행동성공추정0.
- 창고 나무진액40/잠김false·공식상급목재가공true 확인. 사용자 추가조건은 마이홈 재료전송기/연금술부스러기/주간확인창, 사진비용4 고정금지. 가방/창고분리·조건부원격안내/중복예약방지·수동확인단계 구현, 무조건무료합산·자동모달·추가가공0.
- 검증: Node557/554PASS3기존skip0fail·타입/lint0·새조건부창고실React/nativecollection+executor/private nativecompilePASS(IRIS-beta-20261016-161922-9c52263b, 비공개/미설치). 좁은후속review C0/I0/M0. 새웹전체build 미반복/직전34e6aef격리build와구분. helper AddType 빈inmemory경로 오류는 같은source묶음compile로 고친 뒤 접근거부→ready 확인.
- **남은 적용:** 현재Development6428은 후속native수정 전 실행, 정상재시작→사용자승인 앱1회수령 남음. 실모달/추가가공·비용/전체보호원장·새UI·배포는 리뷰판정제외, 각각 별도실검증/설계로 유지. 최신5h28%·주간43% 잔여/15%중단·인계기능브랜치push 유지. 공개main/버전·ZIP·공지·DB 유지, 개인dirty/삭제/새SVG·옛계획 보존. 정확SHA/전송은후속기록.

## 2026-10-16 순월 — 생활 현황·선행 작업 동선 로컬 적용 / 실제 수령 확인 중

- 기준 HEAD c666b61510b98de18fabe1d3b592664fcf60fbdf/기능브랜치 ff-only 최신 확인, 영겁 수신 ACK. 한설 직접 구현 승인. 시작 때15% 중단을 철회했지만 최신 지시로 **이번5시간 잔여15%에서 새 구현 중단·검증/인계·기능브랜치 정상push**를 복원했다. 최근 잔여58%, 주간48%. 개인 dirty/삭제/추가SVG·옛 계획 보존.
- 생활 현황3칸 한 줄·짧은 새로고침, idle일반조회15초 직렬화·중복주기 통합. 준비/최종확인/실행/숨김은 일반조회를 중단하고 복귀·작업종료 즉시 갱신. 실행 관측2초와 native신선도15초는 유지. 재화값/오류는 환경·계정·캐릭터 scope로 분리해 전환 중 이전 날개가 표시되지 않는다.
- 원래 최종목표를 유지한 ‘다음 작업’ 안내: 부족 통나무→가공1회준비→등록품 대기/시설전체수령→실재고 재계산→원래 제작. 선행 작업은 메모리의 임시계획이며 보관 계획을 늘리거나 원래목표·제작진척을 덮어쓰지 않는다. 자신의 completed/registered/stopped 응답만 원래목표 복귀에 사용, unknown 성공 추정/재전송0. 참고 complete:false/무인 연속소비 미구현.
- 검증: Node556/553PASS3기존skip0fail, 타입/관련lint0, 새 polling/guided실React 및 기존workbench/supply/craft-goal/quantity/workspace/collection/queue/goal-workbench PASS. 격리webpack exit0(샌드박스EPERM/환경URL누락을 구분하고 정상권한·검증용환경값으로 성공; 운영키/환경파일 복사0), private native EXE/ZIP compile0/공개교체0. 단일frontend fresh리뷰 C0/I0/M0.
- 실제 dev15444/Development26452 정상시작·응답true·자체로그0, /iris/desktop200. 한설이 좁은/넓은 새 화면을 사진으로 확인했다(마치·완료15). 사용자 첫수령 허용 뒤 게임 반응0: readonly공식상태는 자동행동/자동이동true·DungeonInProgress·Stop이라 **정상 precommit 차단**. 다만 현재행동 차단을 과거원장 확인실패로 숨기는 native안내오류를 발견했다.
- 후속 bounded수정: ProbeCollection이 life_game_blocked만 정확히 전파하고 그 외 오류는 기존 fail-closed 유지. combat/dungeon/auto native시험3 RED→GREEN/원본바이트·분리이력·소비0 확인, 기존collection/executor/automation/journal/quantity 회귀PASS. 이 수정은 이전frontend리뷰 이후의 별도 자체TDD보완이며 현재 실행앱에는 정상재시작 후 적용된다.
- 최신 한설이 던전 밖 대기라고 답했고 readonly상태는 자동행동/이동/전투false·NotInDungeon·Compass 확인. 기존앱에서 시설수령 한 번 재확인 요청, 실제 성공/비용은 아직 미확인. 추가 소비·게임입력·직접CLI행동·강제앱종료·수동보호해제0. 실제수령 결과와 다음 안전한 한 품목 검증을 이어갈 것.
- 공식 CLI선택읽기: 라이트크로스보우S Craftabletrue/ProducedPerCraft1, 상급목재 Alterablefalse/ProducedPerWork3/queue_full. 가능 응답에는 Ingredients/MissingIngredients 자체가 없어 전체BOM으로 승격할 수 없다. 시설의 등록수≠정원 원칙 유지.
- 운영main/SANCTUMv2.31/IRIS0.3.0/공개ZIP·공지·DB/RLS 그대로. 현재 로컬 후보이며 commit/push/운영배포는 후속마감 결과를 확인한다. 새 설계/계획은2026-10-16-ergon-guided-flow, ignored동명workspace의 검증로그/private패키지는 보존.

- 2026-10-15 23:38KST 전송 확인: e7fa78d 기능브랜치 push/원격 정확 일치, 이 후속 문서 마감까지 최신 pull 필요. GitHub 해당 SHA Vercel pending/직접403/CLI 없음·Ready/실페이지 미확인. push직전 Node549/546PASS3skip0fail·타입/lint0. 순월은 아래23:33 우선순위대로 실수령 검증→생활현황 압축 설계를 이어받고 기존 unknown·개인 dirty·15% 약속을 보존한다.

## 2026-10-15 23:33 KST — 순월 인계 push 승인 / 새 구현 중단

- 한설이 기능 브랜치 push·순월 인계를 명시 요청했다. 코드483f767과 문서만 전달하며 공개 버전/운영 main/ZIP/공지/DB는 유지한다. 아래 전송0·확인대기는 당시 경과, 정확 전송 결과는 최상단 후속 기록이 우선한다.
- 우선순위1: 새 Development 후보에서 실제 한 시설 수령을 사용자 선택/첫 허용 아래 검증. 전후 날개·가방·완료 수/원본 보존을 기록하고 unknown은 재전송/수동해제하지 않는다. 사용자가 새 화면을 답변·사진으로 확인했지만 실제 수령 성공은 미확인이다. PID28384 당시 응답true·오류로그0·재시작 전후 암호화 원장 동일 확인.
- 우선순위2: 생활 현황 수치3개를 한 줄3칸/짧은 갱신 버튼으로 압축. 권장 대기15초·숨김/준비/실행 중 일반 현황 정지·수령 후 즉시 갱신, 실행 안전 확인 주기와 분리. 현재10초이며 이 변경안은 아직 승인/구현/부하 실측 전이다.
- 사용량13% 확인으로 새 제품 수정 중단, 15% 약속 유지. 필수 문서 및 순월 미ACK 누적을 보존한다. REA/개인 설정·DPAPI·개인 dirty/ignored 검증 산출물은 Git 전달 대상이 아니며 사무실에서 실행 환경을 확인해야 한다. 직접 Vercel 조회403/설치CLI 없음, Ready·실화면 미확인.

## 2026-10-15 영겁 — 원클릭 수령 로컬 구현·합성 검증 / 정상 재시작·실게임 확인 대기

- **현재 마감:** 코드 최종483f767, 독립 중요2건 단일 수정/전체 검증 PASS. 한설 정상 X 종료 후 Development 후보 PID28384를 한 번 실행했다. 새 화면 사용자 확인·실제 한 시설 수령/비용 검증은 아직 남았다. 최근 5시간 잔여17%이며 15% 중단 약속 복원에 따라 새 기능을 시작하지 않고 안전 마감한다. 명시 push 요청은 없어 원격 전송0이다.
- 실행 로그: 이 계획의 ignored workspace `2026-10-15-ergon-one-click-collection/candidate.stdout.log`·`candidate.stderr.log`. 첫 중복 방지 검사에서 실행용 셸 자신의 명령문이 잡혀 시작하지 않았고, 직접 `-File` 실행/자기 PID 제외로 재확인 후 중복 없이 한 번만 시작했다. 강제 종료·다른 앱 변경·게임 행동0. 실제 원장 비교/앱 응답의 후속 결과는 최신 릴레이를 확인한다.

- 한설이 서면 설계와 구현 계획을 모두 승인하고 직접 구현·검증을 선택했다. 이후 최신 요청으로 **5시간 사용량 15%가 남으면 새 작업 중단·안전 인계 규칙을 다시 적용**한다. 앞선 15% 무시 지시는 철회됐다. 아래 설계/계획 승인 대기는 당시 경과이며 현재 승인 상태가 우선한다.
- 독립 최종 검토 C0/I2/M0: actor 이전 조회 대기 중 취소 유실, 접수 응답 영구 유실 뒤 숨김 관측 누락. 실제 bridge+actor 지연 read/cancel 시험과 실제 React 영구 유실/첫 상태 전 숨김 시험을 RED→GREEN으로 보완했다. 조회 대기를 actor 안으로 옮기고, 전송 전 클릭 ID 게시+정확한 읽기 전용 `collectionObservation`으로 종료를 확인한다. 완료 뒤 도착한 이전 응답은 안내/새 flight를 덮어쓰지 않는다. 한 번의 수정 단계이며 재리뷰하지 않는다.
- 한설이 IRIS 정상 종료를 확인했고 인스턴스0을 확인했다. 새 후보는 최종 검증 마감 뒤 실행 예정이며 아직 실제 수령/허용/원장 자동 분리0이다. Node 최종549/546PASS3skip0fail, 별도 reader97/97PASS, 타입/lint/웹·private native 빌드0, 새/구 native 및 관련7브라우저 PASS. quantity 합성 파일 원자 교체 오류1회는 동일 단독 시험 및 이어진 전체 native 회귀에서 모두 통과했지만 근본 원인은 확정하지 않았다. 잠금 우회/쓰기 재시도는 추가하지 않았고 파일 오류 시 fail-closed를 유지한다.
- 최초 1회 native 허용 후 시설 버튼 한 번이 자동 점검→이전 세션 unknown 종료 증거 확인→해당 시설 이동·완료품 전체 수령으로 이어진다. 권한은 사용자 DPAPI·계정·환경·정책1에 한정하며 채집/제작/재등록/자동 반복은 포함하지 않는다. 비용 미실측과 실제 게임 캐릭터 확인 안내를 유지한다.
- 원본 unknown은 삭제/성공 처리하지 않는다. 별도 DPAPI 정리 이력과 private 암호화 백업만 사용한다. 전역 실행 lease·CLI 없음·이전 세션/12분·동일 게임 PID/시작 시각·문맥/epoch·원본 해시·두 fresh idle 관측을 모두 요구한다. 현재 unknown/inflight/근거 부족은 차단, 결과 손실은 신규 unknown이며 재전송하지 않는다.
- UI는 확인 중→이동·수령 중→수령 완료, 접힌 수령 안내에 허용 상태/철회, 정리된 과거 기록은 성과와 분리한다. 실행 전 이탈은 자신의 요청만 취소, 이미 실행된 늦은 receipt는 숨김 중에도 관측한다. 일시 조회 오류만 회복 시 지운다. 한설 추가 승인으로 시설은 두 열/좁으면 한 열, ‘금속 가공’처럼 표기하고 ‘수령’ 화살표/좌우 여백을 줄였다. 실제 명령의 시설 이름은 그대로다.
- 로컬 커밋: 정책 저장 1b2ec65, native e174893, 이탈/신선도 보완 a3206eb, UI 5811d13. 새 합성/기존 실행·채집·CLI·journal·bridge·창 회귀 PASS, 실제 React 원클릭/철회/숨김/회복/320·390·768·1280·글자18/20/22 PASS, 기존 작업대/queue/craft/quantity/goal-workbench/workbench PASS. 전체 Node 546/543 PASS/기존 skip3/실패0, 타입/lint0, 격리 웹 빌드0, private native compile0. 독립 최종 리뷰는 후속 결과를 확인한다.
- 실제 개인 원장/권한 설정/자동 분리/게임 행동은 아직 0. 과거 원장 파일은 읽기 전용 비교 기준만 확보했다. 새 native는 기존 실행 중 앱에 자동 적용되지 않으므로 IRIS 정상 X 종료 후 Development 후보 재실행이 필요하다. 사용자가 시설 하나의 수령 버튼과 최초 허용을 직접 눌러 전후 완료 수·가방·날개를 확인하기 전에는 실게임 성공으로 표시하지 않는다.
- 운영 DB·main·공개 버전/ZIP·공지·push0. 개인 문서/루트 삭제/미추적 파일은 보존·제외했다. 원본/sidecar/백업·빌드 산출물은 Git 제외. 안전한 복귀는 원클릭 허용 철회 및 기존 엄격 차단 정책이며 원장 삭제가 아니다.

## 2026-10-15 영겁 — 원클릭·과거 잠금 자동 판정 방향 승인 / 서면 설계 검토 대기

- 한설이 매번 기록을 확인하는 수동 복구보다 자동 판정/수령 한 번 클릭을 승인하고 에르곤 자동화 우선을 명시했다. 아래 19:42 native 매번 최종 동의 유지 정책의 후속 변경 방향이다. 아직 제품 동작은 변경하지 않았다.
- `docs/superpowers/specs/2026-10-15-ergon-one-click-collection-design.md`에 native 최초1회 원클릭 수령 허용/다른 소비 불포함, 원본 unknown 보존+별도 DPAPI 감사 이력, 실행 lease·남은CLI·이전세션/12분하한·2회fresh idle·문맥 고정의 복합 조건을 작성/자체 검토했다. 시간·idle만으로 성공/잠금 해제하지 않는다.
- 다음은 한설의 서면 설계 검토→구현 계획 검토/실행 방식 결정→TDD 구현이다. 방향 승인을 존재하지 않던 서면 설계/계획 승인으로 취급하지 않는다. 구형 원장/기존 사용자 dirty를 보존하고 실제 unknown 해제·권한 설정·게임 행동·push/배포0. 스펙 작성 때문에 재설치/REA 점검/게임 조회를 반복할 필요 없다.
- 로컬 설계 문서만 `c6a7f9e`로 커밋했다. ff-only pull은 최신이었고 push0, 기존 제품/개인 변경은 스테이징·커밋하지 않았다. 이 인계·결정·릴레이 누적은 다음 공식 push에 함께 포함한다.

## 2026-10-15 19:42 KST 영겁 — 시설 버튼의 실제 이동·수령 연결 정정 (로컬)

- 한설은 시설 `수령 →`가 실제 게임 시설로 이동하는 버튼이라고 명확히 했고 즉시 구현 지시. 생활 커넥터1.3.1/MobiWorks 설치 소스의 실제 호출을 직접 추적했다. `complete_altering_work`는 별도 이동이 아니라 시설 이동+해당 시설 완료품 전체 수령을 한 요청으로 처리한다. 근거/해시/한정 명령표는 `docs/IRIS_COLLECTION_COMMAND_TRACE_20261015.md`. 추가 엔진/다른 앱 실행·설정 변경/게임 파일 수정0.
- 기존 세 단계(미리보기→수령준비→최종창)를 시설 버튼→기존 native 최종 동의 1회로 변경. `requestErgonCollection`이 현재 범위·busy/unknown/완료품을 확인하고 준비 응답의 시설/계정/캐릭터/품목을 대조한 뒤 confirm을 요청한다. 게임 명령은 사용자 native 승인 뒤 기존 executor가 한 번만 보낸다. 자동 재시도/다른 시설 순회/재등록/unknown 해제0.
- 작은 창은 자동 실행 탭 확인 영역에 초점·스크롤. ref로 준비 중 연타를 막고 기존 단일 Execution의 busy와 합친다. 독립리뷰 C0/I1/M0의 숨김 중 늦은 running 응답 관측 누락은 실제 React RED→GREEN으로 수정: UI 안내는 stale이면 버리되 receipt ID는 보존하고 숨김 중에도 같은 ID 결과를 계속 읽어 종료 때 잠금을 해제한다. 재리뷰0.
- 검증: 신규 단위4 RED→GREEN 포함 전체539/536PASS/기존skip3/0fail, 실제 React 직접 최종동의·취소·불일치·연타·늦은 준비/복귀 재개0·늦은 실행/숨김 결과 관측·unknown·좁은창/아이콘 PASS. 기존 goal-workbench/workbench/통합 queue 최종 PASS, 타입/lint0, 최종 격리webpack exit0, native executor+가짜CLI PASS. 초기 sandbox 링크/네트워크 제한은 같은 합성검증의 정상권한 재실행과 구분. 비밀값/운영 환경은 빌드에 복사하지 않음.
- 실제 개발3000 페이지200, 기존 Development28396 RespondingTrue/로그0 확인. 이번 제품 native 소스 추가 수정 없이 UI 연결만 변경하여 새 native 재시작 요청 없음. 실제 게임 이동·수령·비용 측정은0, 한설이 기존 최종창에서 시설/게임캐릭터를 확인한 뒤 직접 승인해 시험해야 한다. 이전 unknown이 있으면 이 버튼도 차단하며 자동 복구하지 않는다. 실제 이전 좁은/넓은 아이콘·두줄 화면은 한설이 확인했고, 이번 직접 이동 흐름의 실게임 결과는 별도다.
- HEAD67300b1 위 미커밋 후보/공식 push·운영main·공개 버전/ZIP·공지·DB 변경0. 기존 사용자 dirty/삭제와 상대 미ACK 누적은 보존. 아래17:36의 미리보기 전용 설명은 정정 이전 경과다.

## 2026-10-15 17:36 KST 영겁 — 시설 수령 진입·이미지·세로 컴팩트화 로컬 적용

- 한설 승인: 시설별 수령하러가기→완료품 확인→수령 준비→native 최종 확인, 이미지6개 적용, 반복 설명 제거와 시설행 최대1~2줄. 기존 checkout HEAD67300b1/개인 dirty 보존, 앱코드·테스트·첨부원본만 추가. commit/push/운영main·제품버전·공개 ZIP·공지·DB/RLS 변경 없음.
- 시설 카드는 아이콘/시설명/완료N/등록N과 짧은 `수령 →` 버튼. 긴 접근성 이름은 시설별 수령하러가기, 기본 반복문은 접힌 수령 안내로 통합. 완료0·조회오래됨·완료불명은 진입 비활성. 작은 글자 최소12px/rem 유지, 320/390/720/1240 큰글자에서 행70px 미만·가로넘침0 합성 확인.
- `ergonCollectionPreview`는 선택 시설의 완료작업 전체를 표시하고 다른 시설과 동명인 품목을 anchor로 쓰지 않는다. 기존 단일 Execution 인스턴스에 collect 계획을 연결하며 navigation만으로 prepare/confirm 하지 않음. preparation 응답의 시설·품목·계정·캐릭터/비용불명 계약을 확인하고 불일치 nonce 취소. 수령 비용 미확인/완료품전체 범위를 표시하고 기존 최종 동의·unknown 차단을 그대로 사용한다.
- native는 준비 시 선택 시설을 내부 nonce에 고정하고 동의 전·후 같은 시설인지 재검, 변경 시 수행0. bridge payload/DPAPI 원장 스키마/실제 게임 CLI 계약 변경 없음. 자동 이동·수령·재시도·재등록·unknown 해제0. 기존 결과불명 상태에서는 수령 준비도 막히는 것이 정상이며 버튼 추가가 복구 승인은 아니다.
- 첨부 PNG6개를 `public/IRIS/facilities`에 원본 그대로 복사/해시 일치/실제알파 확인. Next Image의 실제96px 요청6종은200/WebP/2,236~3,078bytes. fixture의 Next Image 대체는 프레임워크 경계만 단순화하고 허용된6PNG를 실제 제공/이미지 decode 검사한다. 재그리기/배경편집/새 엔진0.
- 검증: 신규수령 unit3 RED→GREEN, native시설변경 동의전/중 RED→GREEN, 전체 Node535/532PASS/3기존skip/0fail. 실제React 수령진입/준비/취소/불일치/수동최종호출/unknown/이미지·두줄높이 및 기존queue/goal-workbench/workbench PASS. 타입/관련lint0, 격리webpack/private native compile0. 단일 독립리뷰 Critical0/Important0/Minor0, 재리뷰0. 최종 문구·높이는 부모가 추가 직접 검증했고 합성 화면을 눈으로 확인했다. 실제게임 수령·비용은 미시험.
- 한설 X정상종료 확인 뒤 새 Development PID28396/RespondingTrue/stdout·stderr0, dev3000 유지. 새 native시설고정 적용, 실제 화면의 최종 사용자 확인은 별도. 공개앱/보호원장/기존 개인 변경은 그대로다.

## 2026-10-15 16:31 KST 영겁 — 집 후보 적용·합성 검증 / 시설 수령 진입 UX 요청

- 기능 브랜치67300b1 fetch/ff-only 최신 확인, 개인 dirty·삭제 보존. 대상 계산·보호 단위23개(큰 목표/수급·예약/시설·기존 workspace) PASS, 실제 React queue/craft-goal/goal-workbench 세 묶음 PASS. 공유재고 shortage3→7/최종품 예약·늦은 캐릭터/잠금 IO0, 목표20→수동5씩/자동소비0, 남은15 재료와 원본20 보존 확인. 실제 게임 성공 증거는 아니다.
- 로컬 Turbopack3000/session28096, `/iris/desktop`200/스크립트25개 실패0. Development native PID22300/WebView자식6460/응답True/자체로그0 확인. Computer Use 목록에는 IRIS 창이 없어 게임·다른앱 조작으로 우회하지 않고 한설 화면을 받았다. 첫 실행 잠금 조회가 검사 셸 자신을 포함한 것은 PID제외로 구분, 제품 수정/잠금 해제/강제종료 없음.
- 한설 첨부 화면으로 실제 넓은 관제실·시설별 현황·대기열0 확인. 달걀·통나무 계획은 한설이 직접 제거했다고 알림(영겁 삭제0). 실제 수량 제작/현재 중지/비용은 아직 미검증, 과거 결과 불명 차단이 표시되며 유지한다.
- 새 요청은 시설별 ‘수령하러가기’ 버튼. native collect 계약은 있지만 현 Execution UI는 채집/가공/제작 계획만 연결되어 시설 수령 진입은 미구현이다. 짧은 설계 승인을 먼저 받고 완료품 확인→수령 준비→기존 최종 동의 방향을 검토한다. 버튼 클릭 즉시 수령/게임 이동·과거 unknown 해제는 승인으로 추정하지 않는다. 앱코드/추가게임명령/운영/commit/push0.

## 2026-10-15 영겁 — REA 실제 Codex 연결 확인 완료

- 한설 재시작 후 현재 대화의 REA `binary_session(expected_package_version:"6.5.0")` 성공. 실제 client codex-mcp-client/패키지·서버6.5.0/207도구/workflow42/alignment aligned/openfalse 확인. 별도 시험이 아닌 현 대화 연결 증거다. 아래 재시작 대기는 당시 경과, 추가 설치/doctor 반복 불필요.
- REA_SETUP에 결과 기록. 분석 대상·게임 열기/개입·파일 수정·추가 엔진·앱 구현·운영/DB/commit/push 없음. 이후 분석 대상과 범위를 별도 확정한다.

## 2026-10-15 16:19 KST 영겁 — 집 REA6.5.0 설치 / 실제 Codex 연결은 재시작 후

- HEAD67300b1/B1 인계를 읽고 SW-20261015-001 ACK. 이번 한설 요청은 REA 설치·백업·Codex 단일 연결 확인이며 앱 구현/게임 시험을 시작하지 않았다. 기존 개인 dirty/삭제 보존.
- 공식 고정 npm6.5.0을 Codex 한 곳과 `.agents` 공식 스킬에 설치. 쓰기 전 별도 설정 백업과 공식 백업의 원본 일치/기존 prefix 보존 확인. doctor healthytrue/registration·skill aligned(workflow42/207도구), 추가 분석 엔진 없음. 독립 stdio initialize/list207/binary_session6.5.0/openfalse/aligned PASS. 세부 재현·백업 경계는 REA_SETUP 최신 항목 참조.
- 현재 대화에는 REA 도구 미노출. 한설이 Codex를 정상 종료·다시 열면 실제 도구 호출로 연결을 확인한다. 별도 시험을 현 대화 연결 증거로 혼동하지 말고 재설치 반복 금지. 엔진 필요 시 먼저 알리고, 게임 설치파일 수정/실행 중 개입/추가 소비/unknown 해제/운영 변경은 하지 않는다. 설치·백업·캐시·시험 스크립트는 Git 전송 대상 아님. 이번 commit/push0.

## 2026-10-15 11:05 KST 순월 — B1 전송 완료·집 인수 검증 대기

- 기능 `02cde7633b037b2d9ae3146327d27fde082583ba` + 리뷰수정 `520d136730c4f180e7fd35a34da0dd9170930328`을 `codex/iris-checkboard-classes`에 정상 push, `ls-remote` 정확 일치. 원격 main `1d8e3749f306456bea1c2a7b2e05da813b98e5fa` 유지. 이 후속은 전송 결과만 기록하는 문서 마감이며 최신 branch HEAD까지 받는다.
- GitHub commit status Vercel **success** 확인: https://vercel.com/sanctum-sanctuary/sanctum/14UZgf1y3gnmDu32LkKFvQLMUb2X . Vercel MCP는 동일 project/team 명시 시403, CLI 미설치로 직접 Ready/보호된 실제 화면 미확인. 인증·공유링크·환경변수/세션 추출·보호 해제·수동 배포·승격0. 성공 상태와 실페이지/실게임 검증을 구분한다.
- 최종 코드 자동검증629/626PASS3기존skip0fail·독립타입/관련lint0·최종격리webpack58exit0, 새·구 실제React/관련native/private패키지compile PASS. 단일fresh리뷰 중요1만 한 번 RED→GREEN 수정/사소0/재리뷰0. 자세한 판단과 비용·검증 경계는 IRIS_YEONGGEOP_HANDOFF의 마지막 두 절을 참조한다.
- 공개 SANCTUMv2.31/IRIS0.3.0/main/ZIP/공지/DB/RLS 그대로. 이번 문서 마감은 구조 변경 없음. 개인dirty·삭제·SVG·옛 계획은 제외·보존, 실제 게임/unknown해제0. 영겁 첫 작업은 수신ACK/REA별도설치 확인→로컬 dev+Development앱→한설과 소규모 실제 검증이다. B2 자동chain/시설 반복/Chronos/모바일은 여전히 미완료.

## 2026-10-15 순월 — 통합 대기열·큰 추가 제작 목표 B1 로컬 후보

- 검증 마감: 중요지적 수정 후 fresh 전체629/626PASS/3기존skip/0fail·독립tsc/관련lint0error0warning·수정본격리webpack58/58 exit0. 완료최종품 예약 회귀/기존진척·큐 실제React GREEN, 이전 native/private compile 증거 유지(이번 native소스변경0). 단일리뷰 지적1건 수정/재리뷰0, 실게임/원장해제/운영/공개ZIP0. 최종 사용량은5h잔여19%/주간20%로15%전, 신규소비기능은넓히지않고 인계·정상push 마감만 진행한다.

- 최종 검토 후속: 로컬 기능커밋 `02cde7633b037b2d9ae3146327d27fde082583ba`. 단일 fresh독립리뷰 Critical0/Important1/Minor0. 완료한 최종품을 livebag에서 다른 목표 재료로 다시 쓰는 과소생산을 재현했고, 완료목표 예약량은 별도 공제/실제 초과분만 공유하도록 unit+실제Queue browser RED→GREEN 수정. 부분완료 root도 검증했다. 최종 fullNode629/626PASS/3기존skip/0fail. 수정 후 타입/lint/격리build 최종결과·전송은 후속 마감, 재리뷰 반복0.
- 한계 재강조: 통합 큐의 예약은 미리보기 계산이며 현재 native 개별실행이 실제 재고의 예약/소유권을 강제하지 않는다. 선택 작업 재료는 실제 가방 기준이고 여러 최종 목표의 순서는 통합 큐로 확인한다. 자동chain/실제 소비를 연결하기 전 native 측 총예산·예약·완전BOM 및 시설계약 검증이 필요하다. 과거 unknown은 여전히 자동 해제하지 않는다.

- 한설 최신 승인: 점검 중 실게임 검증은 저녁 영겁에게 위임, 사무실은 즉시 설계/구현·자동시험을 진행하고 5시간 잔여15%에서 새 구현 중단·인계/기능브랜치 정상 push. 공개 main/SANCTUMv2.31/IRIS0.3.0·ZIP·공지·DB/RLS 유지. 개인 dirty/루트 삭제/새SVG는 제외·보존한다.
- 원격 ff-only 최신 HEAD498e254 위 직접 구현. 기존 관제실·A/단일수량 native·unknown 보호는 재구현하지 않았다. 새 통합 대기열은 여러 목표의 같은 가방 재고를 한 번만 예약하고 단위 잔량만 공유한다. root 결과물을 다른 목표가 빼앗지 않으며32노드/4깊이·50계획/참고32품목 직렬 한도, 부분 재료표는 자동실행 권위가 아니다.
- 시설별 조회 등록/완료/가까운 완료시각을 표시, 조회된 등록 작업 절반 이상 완료 시 전체 수령 대상 확인을 안내한다. 등록수≠시설 정원, 자동 수령·재등록0/비용·정원 미확인. 실패/오래된 값은 실행 판단에 사용하지 않는다.
- 추가 제작 목표20과 단일명령 최대5횟수를 분리했다. 이번 화면에서 보낸 requestId·현재 계획ID/계정/캐릭터·수량 metadata·정확 날개5 차감과 completed가 모두 맞는 경우만 진척에 반영한다. 장비 null 재고/기존 보유량·과거이력·중복응답은 성과로 세지 않는다. 5명령/날개25/새 준비5분·각요청 native동의 유지, 자동 후속 소비0/unknown 해제0.
- 부모 관제실은 원본 추가 목표와 임시 목표진척을 구분한다. 완료5/원본20이면 큐·필요재료는 남은15, 선택 왕복에도 진척·예산 유지. 완료 목표 중복 준비 차단, ‘같은 수량으로 새 추가 목표’만 명시적 재설정. 목표 수정은 새 추가 목표, 앱 재시작은 자동 복원/재개하지 않는다.
- 검증 중간 마감: full Node628/625PASS/3기존skip/0fail, 독립tsc·관련lint0, 실제React 새 queue/craft-goal/goal-workbench 및 기존 workbench/workspace/actions/craft/quantity/supply PASS. 처음 전체Node는 샌드박스 localhost EACCES, 같은 합성시험 일반권한 재검으로 통과. idle 준비취소 뒤 메뉴 왕복의 ‘보낸 작업중지’ 오안내는 기존workspace RED→GREEN 수정. native actor/quantity/journal/CLI/bridge/workspace tracker·strictbool PASS. 격리 webpack58 exit0/private native EXE/ZIP compile PASS. 최종 독립 리뷰·추가 수정 후 검증/전송 SHA는 후속 마감에 기록한다.
- 비공개 compile만 수행: `.superpowers/sdd/2026-10-15-ergon-shared-queue/private-package/IRIS-beta-20261015-105157-b8a07aea`. 공개 다운로드 교체·설치·개발 앱 실행/강제 종료·게임 명령0. 이 EXE는 배포된 원격 UI를 읽으므로 집의 후보 확인은 로컬 dev+Development 모드로 한다.
- REA6.5.0은 사무실 실제 MCP 연결/207도구 aligned까지 확인했다. 집은 별도 사용자 설치/MCP+공식스킬·재시작 필요, Gitpull은 설치가 아니다. docs/REA_SETUP.md 및 docs/IRIS_YEONGGEOP_HANDOFF.md 참조. 새 분석 엔진/Rust 설치·타앱 원본 변경/번들 복사0.
- 남음: 실제 native 수량·비용·중지·수동복구 별도 승인·실검증, 전체 BOM/시설 실제 정원·수령대상·비용 확인 후 native 총예산 부족분 자동chain(B2), 시설 반복 재충전·Chronos 카트·모바일. 기존 S1개는 아이템만 확인/날개불명 unknown을 보존한다. 이 후보를 전체 자동생활 완성/운영배포로 안내하지 않는다.

## 2026-10-15 09:32 KST 순월 — REA 사무실 로컬 연결

- 사용자 REA 설치 승인. npm6.5.0 pin/Codex 전용 사용자설정+백업/공식 .agents workflow42·207tools 설치, 기존configprefix보존. fresh doctor Codex+skill healthytrue/exit0, 별도 MCP initialize/list207/targetfree session PASS. 현재대화도구는재시작후확인필요, 새엔진/Rust설치0/타앱분석·게임파일읽기·실게임동작0.
- 소스helper사본과공식관리경로차이를확인해정식스킬로정렬, 이번에만든중복사본만ignored privatebackup에보관(삭제0). 사용자타설정·개인dirty유지. docs/REA_SETUP.md에집별도설치·버전고정·검증범위기록, Gitpull은도구/사용자설정/캐시를설치하지않음. 앱코드/DB/배포/commit/push없음. 게임점검중실검증보류/기존unknown보호와보조앱라이선스확인경계유지.

## 2026-10-15 00:43 KST 영겁 → 순월 — 검증 위임·인계 브랜치 전송

- 전송 마감: 코드 `24c7534129e14811d0caa3fe7b2666e6119ea9cf` 일반 push 성공, `ls-remote`와 정확히 일치. 원격 main `1d8e3749f306456bea1c2a7b2e05da813b98e5fa` 유지. 이번 후속은 전송 결과만 기록하는 문서 마감이므로 최신 branch HEAD까지 받는다. 사용자 개인 dirty/삭제/untracked만 로컬에 보존했다.
- Preview는 GitHub Vercel 검사 `pending` 관측. Vercel MCP는 명시한 동일 project/team에서 403, CLI 미설치라 Ready/실화면 미확인이다. 권한 우회·임시 공유링크·수동 배포·승격은 하지 않았다. 순월이 접근 가능한 환경에서 read-only 확인할 것. 인계 push 성공과 운영 배포 완료는 별개다.
- 한설이 “순월이한테 인계할꺼 푸시…검증은 순월이 통해서” 요청. `codex/iris-checkboard-classes`의 후보와 인계 문서만 일반 commit/push한다. 공개 SANCTUM v2.31 / IRIS Beta 0.3.0 유지, main 병합·운영 배포·공개 ZIP·공지·DB/RLS 변경은 하지 않는다. 정상 운영 기준 main `1d8e374` / `dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR` 유지.
- 수신 순서: AGENTS → CODEX_RELAY → TO_SOONWOL의 YG-20261014-001 누적 → 이 최신 항목 → IRIS_SOONWOL_HANDOFF. 순월이 직접 ACK한다. 완료된 수량 채집/현재 중지 A, 수량 제작, 읽기 전용 수급, 아래 관제실·업데이트 요약을 재구현하지 않는다.
- 10월 14일 최종 검증 증거는 아래 21:28 항목과 동일하다. Node 519/516 PASS/3 기존 skip/0 fail, 타입·관련 lint·격리 빌드·private native 컴파일 및 React/native 회귀 통과 로그를 재확인했다. 이번 전송 단계는 전체 테스트를 반복하지 않고 scoped diff/공백 검사와 원격 ff-only 최신 확인만 한다. 실제 게임·설치·다른 DPI 검증이 끝났다고 표시하지 않는다.
- 순월의 첫 확인: 최신 native를 별도 빌드하고 기존 IRIS가 있으면 한설의 정상 종료 후 적용 → 에르곤 좁은/넓은/복원·다른 메뉴 왕복·게임 일반창/전체화면/모니터·DPI → 수량/필요량·미확정 보호와 계정별 기록 → 업데이트 변경요약/실패 안내를 확인한다. 집에서 넓은 화면 표시는 한설이 확인했고, 실게임 중지·비용과 실제 업데이트 교체는 미확인이다.
- 다음 구현 경계: 감사 가능한 수동복구는 방향만 합의, 실제 unknown 해제는 미승인이다. 원래 기록 보존·완료/성공 위조·자동 재전송 금지. 완전한 재료표 검증과 native 총예산 순차 chain, 시설 반복·Chronos·모바일은 미완료. 추가 게임 시험은 품목·수량·횟수·날개 한도를 새로 확인하고 최종 native 동의를 받아야 한다.
- 환경 주의: 집의 webpack dev 파일 접근 오류는 Turbopack 우회이며 영구 해결이 아니다. 캐시 백업·사용자 원장·설정·참고파일·private 패키지·검증 로그는 Git으로 보내지 않는다. 사용자 개인 dirty/삭제 파일은 제외하고 보존한다. 최신 인계 브랜치 전체를 pull해야 하며 main만 받아서는 후보가 없다.

## 2026-10-14 21:28 KST 영겁 — ERGON 관제실·설치 전 변경요약 로컬 완료

- 한설이 역할별 버튼색/선택 작업 중심/작은바+확장 화면을 승인하고 ‘바로 구현’ 요청. 기존 feature checkout/HEAD5ec9988 위 로컬 수정, 개인 dirty·삭제·untracked 보존. commit/push/main병합/공개버전·ZIP·공지·운영 DB/RLS 변경0.
- ERGON: 현황/검색목록/선택 수량·필요·가방·부족재료/실행준비가 같은 작업화면. 320~좁은 폭은 수직, 중간2영역/넓은3영역. 실행은 기존1인스턴스를 계속 mount, 새게임명령/원장해제/예산변경 없음. 금색(테마accent) 주요행동·청록 담기·무채색 일반·적색 현재중지, 상태문구/아이콘 병용. 현황/목록 수치 쉼표, 긴 출처안내·보관계획 details. 미확정 ‘기록 확인’→계정별 실제 이력으로 연결, 성공 위조/해제/재전송0.
- bool-only `window.workspace`는 opt-in1240폭/작업영역 제한·이전 좁은bounds 복원·기존360~720 저장폭 미변경. 비활성/이탈의 늦은응답복원, compact/native navigation 복원. 최종 단일 독립리뷰 Important1(일반 창에서 tracker도킹이 넓은폭 덮음)을 실제 tracker placement 합성 RED→GREEN으로 수정. 기존 windowed compact도킹/fullscreen은 보존. 그 밖 Critical0/Minor0, 재리뷰 반복0.
- 실앱: 한설 정상종료 확인 후 최신 Development PID27308/응답True/자체로그0. 한설 ‘응넓은화면 잘나온다’ 확인. 실제 채집/제작/현재중지·비용/다른DPI의 추가시험은0, 이전unknown 그대로. 별도실게임승인을 추정하지 않는다.
- 후속 업데이트창: 기존 installer/metadata/C#업데이트계약은 변경하지 않고 `/IRIS/notes/<version>.json`의 버전일치 plain-text요약 표시. 16KiB 스트림/6구역·10항목·글자수제한·8초취소/닫힘·버전교체 응답폐기. HTML실행/쿠키/리다이렉트/임의주소0, 조회실패·다른버전은 상세노트링크 안내/기존설치흐름유지. 0.3.0 요약은 이미 공개한 기능만 기록(ERGON 후보를 출시기능으로 쓰지 않음). 향후 새버전 배포 시 해당파일도 작성해야 한다. 공개 게시 자동화0.
- fresh검증: 최종Node519/516PASS/3기존skip/0fail·독립tsc/관련eslint0·최종격리webpack exit0, private native 최종compile0. real React 새관제실/6테마·320~1240/늦은창·unknown기록·기존수량/채집stop/제작/느린준비·동의/예산·read-only2048/계정분리/사전점검 PASS. native geometry/strictbool bridge/실tracker배치/기존compact PASS. 업데이트창은 별도 bounded후속으로 실제React 버전요약/HTML글자표시/다른버전fallback/기존설치보관·실패·재시작 합성 PASS. 공유fixture는 updater쿼리일 때만 합성origin의 고정notes GET 통과, 다른 API는 기존fake 그대로다.
- 환경: webpack dev layout.js open UNKNOWN/packrename 오류 재발. own43805 중지→`.next/dev-before-workspace-20261014-2115`로 캐시 이동보관(삭제0)→53913 일시복구 후 재발. 생성파일 자체는 OpenRead 성공, Windows 상세원인은 미확정. 같은 프로젝트 설정/보안정책을 바꾸지 않고 설치된Turbopack dev로 전환(own34828/3000), 마지막 `/iris/desktop`·`/IRIS/notes/0.3.0.json` HTTP200. 캐시 재삭제 반복/보안해제/사용자앱 forcekill0. 이 환경 우회를 영구 원인 해결이라고 표시하지 않는다.
- 남음: 감사가능 수동복구 상세설계·실제해제 별도승인, 완전BOM/native총예산chain/시설반복·Chronos/모바일. 실제업데이트 설치본 교체·운영배포/공지 미실행. 검증 ledger와 screenshot은 미커밋 증거라 `.superpowers/sdd/2026-10-14-ergon-command-workspace`에 보관한다.

## 2026-10-14 20:40 KST 영겁 — 집 수신·좁힌 회귀·개발 후보 적용

- 추가 UX요청: 생활커넥터3열을 참고한 작은바+확장생활작업화면 방향 제안(폭 선택 미응답), 복구 설계 방향은 사용자 동의/실제 해제0. 추가로 업데이트 버튼 클릭 시 대상 버전의 변경내역을 앱 안에서 먼저 표시 요청. 설치폴더 version1.3.1/13_AppUpdate·UpdateCore readonly 확인, IRIS 기존창은 외부노트링크만 존재. 버전일치 내역/별도 설치·오류fallback/기존검증·작업잠금 보존 범위 제안, 아직 제품수정0. BETA_FEEDBACK/DECISIONS 참조.

- 후속 실화면: 한설 첨부4장으로 ERGON 네 탭/생활 현황/가공 목록·재료/보호 차단 안내 표시를 확인했다. 날개71041·무게726/930·가공완료6→7·시설15칸은 사진 시점의 관측값이며 비용·정원 계약의 증명이 아니다. 계획0/50이고 새 실행은 결과불명 보호로 잠김. 선택 후 통합 작업대/새 소비·목표중지·수량제작 성공은 아직 실게임 미확인. 작업 기록 탭은 안내만 있고 실제 보호 이력은 자동 실행 details에 분산되어 있어, 감사 가능한 복구와 함께 정리할 다음 설계 범위로 제안한다. 원장 변경/보호해제 승인으로 해석하지 않는다.

- `codex/iris-checkboard-classes` HEAD5ec9988 수신, fetch/ff-only pull up-to-date 확인. SW-20261014-001 수신 ACK. 완료된 A/수량 제작/작업대/읽기전용 수급은 재구현하지 않았다. 개인 공지 초안·루트 삭제·untracked 파일은 보존했다.
- 집 fresh 검증: 재료/참고/수급/오류 Node13/13 PASS, real React quantity/craft/supply/workbench 4개 스크립트 PASS, native quantity/reference 합성 PASS, 독립 tsc exit0. 최초 sandbox 원자 파일교체·SWC 접근거부는 동일 범위 정상 권한 재검으로 통과. 이번에는 제품 코드 변경이 없어 전체613/빌드를 반복하지 않았으며, 전체 검증은 위 순월의 해당 커밋 결과와 구분한다.
- 한설이 다운로드 IRIS 정상 종료를 확인한 뒤, 개발서버3000(session43805) `/iris/desktop` 및 6개 script HTTP200 선행 검사 후 새 Development native PID2196 시작. 자체 stderr/stdout 0byte/RespondingTrue, 한설은 새 IRIS 화면이 보임을 확인했다. sky 도구에는 해당 native 창이 반환되지 않아 실제 작업대 화면/보호 안내는 스크린샷 요청 대기. 정상 페이지 응답·사용자 창 확인만으로 전체 기능 실게임 검증 완료로 표시하지 않는다.
- 집에도 설치 참고 JSON 2개/공식 CLI 존재 확인(파일 복사·재배포 없음). 실제 채집/제작/중지 명령·원장 직접 열람/해제·운영 DB/공개 패키지/게시/푸시0. 과거 결과불명 처리의 승인 미응답은 계속 보존한다.
- 다음: 사용자 ERGON 화면 확인 → 기록 삭제나 완료 위조 없이 감사 가능한 수동 결과 확인/보호 해제의 범위를 사용자에게 설명·승인 → 필요한 경우 새 품목·수량·날개/목표중지 시험을 별도 승인. full BOM 및 총예산 순차 chain은 별도 설계이며 부분 참고표를 실행 권위로 승격하지 않는다.

## 2026-10-14 18:50 KST 순월 — 퇴근 인계 / 수급 순서·수량 제작

- **전송 결과18:56KST:** 기능코드 `885e97f4281acf341cbe1bc79c4a39872fb6348d`(A f07470d 포함) 일반push 성공·ls-remote 일치, main1d8e374 unchanged. 해당코드 Preview `dpl_AYQu36cM6WFdqnUeBq4ikbB4A7M3` READY/project·branch·SHA 일치 MCP확인: https://vercel.com/sanctum-sanctuary/sanctum/AYQu36cM6WFdqnUeBq4ikbB4A7M3 . 개발페이지 HTTP200. 이 후속은 문서 전용, 최종 branch HEAD까지수신한다.
- Preview 실화면 미확인: 일반페이지302 보호안내, authenticated fetch 도구는 임시공유접근생성에 구체승인없어 auto-review 거부. 공개범위변경 위험으로 우회/토큰추출/보호해제/CLI신규설치0, 기존CLI없음. 한설에게 임시링크승인 여부 질문 미응답, 집에서 직접보거나 별도승인후 확인한다. Ready와 실제핵심화면 확인은구분하며운영배포완료아님. 초기 scope403과 달리 실제projectId기본연결목록/Ready는 이번에정상확인됐다.

- 마감 검증: fresh 전체 Node613/610PASS/3기존skip/0fail, 독립tsc·관련eslint0error0warning, 새supply/quantity/workbench/craft/구actions 실제React PASS, nativeactor/quantity/CLI/journal/reference/bridge PASS, 최종별도webpack58 exit0/nativecompile exit0. 수급 리뷰 지적 수정 뒤 회귀와 빌드를 직접 재실행, 실게임 확인은 여전히 별도. 마지막5h잔여31%/주간45%로15%조건 전, 더 넓은 소비자동화는 복구/완전자료 확인이 필요해 검증 후보를 먼저 인계한다.

- **최신 승인:** 퇴근 요청으로 기능브랜치 push·영겁 인계를 다시 승인, 5시간 잔여15%에서 새 구현 중단. 아래15:28 철회는 당시 경과. 대상 `codex/iris-checkboard-classes`만, 운영main/공개 SANCTUMv2.31·IRIS0.3.0/공개ZIP/공지/DB/RLS 유지. 최종 SHA·원격 일치·Preview는 후속 마감 참조.
- 후보 완료 범위: A 추가 통나무 수량·현재 중지(f07470d), P1 추가 제작1~5횟수·장비 재고null 판정·한 화면 현황/재료/수량/실행, 읽기전용 부족분 수급 순서. 공유 가방 예약·산출 잔량·참고자료+공식 부족 목록 합집합으로 채집→가공 등록→수령→제작을 표시. 불명 수량/잠김/동명/다중 경로/순환/미해금은 확인 단계, 최대32노드·8깊이·root+필요 하위31자료 직렬 조회. 창고/과거cachedOwned 제외, 자동전체 실행·검증 전 채집품 실행 없음.
- 확인 화면: `IRIS → ERGON → 작업 계획`에서 품목 선택, 목록은 접히고 현황·선택 재료·수량·준비가 우선. 재료 아래 `부족분 수급 순서 보기`로 펼쳐 날개 최소/상한 미확인과 단계 계획 추가 확인. 준비/native동의/실행 중 조회 정지. 준비 오류는 허용된 사유만 친절 안내, 임의 예외·경로·stale frame은 숨김.
- 검증: sandbox 최초 localhost/EACCES·임시 설정 접근 차단 실패, 동일 합성 테스트 정상 권한 재검으로 구분. P1 리뷰 중요2(수량/조회경합), 수급 리뷰 중요1/사소1(공식 추가재료 누락/미해금) 각각 실제 회귀 RED→GREEN 수정, 중복 재리뷰 없음. 최종 fresh 전체·타입·브라우저·격리빌드 결과는 아래 마감에 기록한다.
- 비공개 native EXE/ZIP compile PASS: `.superpowers/ergon-supply-final-package/IRIS-beta-20261014-184120-7cfcdae0`, 공개 다운로드 미복사. Development10540 RespondingTrue/stderr없음, 마지막 native 오류안내 bridge는 정상 재시작 필요. 사용자 종료 확인 없이 forcekill하지 않는다. dev own30435/3000 유지. 집에 이 패키지/PID/캐시/개인재고/보호원장이 Git으로 전달된다고 추정하지 않는다.
- 실게임: 한설은 기존 S1개만 확인, 날개 차감은 모름. 기존unknown 보존·소비/원장조작/직접CLI/가짜동의0. 감사를 남긴 수동복구 버튼 질문 미응답이므로 구현하지 않음. 집에서 native 최종 동의로 품목·수량·소모한도를 확인해 실제 시험한다. 합성 시험으로 실제 비용 확인을 대체하지 않는다.
- **영겁 다음:** 수신·ACK→완료 후보 재구현 금지→실앱 수량/보호 이유/작업대 확인→과거unknown 처리 방향 사용자 확인→공식 최신/완전 재료표 확보 경로 및 부족분 native 총예산 순차 실행 별도 설계. 시설7칸/50%수령재충전·Chronos 쇼핑 큐·모바일 푸시 미완료. 전체 자동생활 완성/운영배포로 공지하지 않는다. 개인 루트 수정·삭제/신규SVG/옛addon계획 제외·보존.

## 2026-10-14 15:28 KST 순월 — ERGON 수량 제작·통합 작업대 로컬 후속

- 최종 후속15:30KST: compact 적용뒤 fresh Node507/504PASS/3skip/0fail, 독립 tsc/관련eslint0error0warning, 새 작업대수량·느린준비/동의·resume·접힌목록/기존craft/readonly2048/시작점검 PASS, 별도webpack58 exit0. 변경목록/diffcheck 확인(개인dirty보존, LF→CRLF경고만). 기존IRIS20364/IRIS.exe/desktop.ps1프로세스부재 확인 뒤 page+6scripts200 선행검사로 Development PID30700 정상 시작/RespondingTrue/stderr0. 강제종료/원장조작/소비명령0. 현재새실앱화면·사용자실제작결과는한설확인전. 코드·문서미커밋/push없음.

- 최신 사용자 지시: 이번에는 잔여15%여도 계속 작업하며 push하지 않는다. 다음 타임에 다시15% 약속을 요청하면 그때 적용한다. 아래 A 항목의15% checkpoint 지시는 당시 경과로 보존한다. HEAD f07470d 위 미커밋 후보, remote e5b4ed6/운영 main1d8e374·SANCTUMv2.31/IRIS0.3.0/공개ZIP·공지·DB/RLS 유지.
- 사용자 제작 제보 원인: execute_crafting craftCount1 고정 + get_items가 장비를 제외하는데 결과물 재고 증가를 강제검사. 실제 official read-only S 카탈로그 availabletrue/산출1/부족표null, named 조회0행 확인. 최초 sandbox game_off는 호스트 실제 상태가 아닌 격리 조회 결과이며 실제 읽기는 연결됐다.
- 수정: 신규 제작1..5횟수를 고정 CLI 한 명령/날개5로 전달. 목표는 추가 결과물이며 ceil(목표/산출)·산출단위 초과를 표시. native 수량 동의/nonce/epoch/후속 안전조회, actual craftCount와 정확 debit5 대조, known stock 무증가 unknown 유지. absent equipment stock=null로 표시, 공식 완료+debit로 확인. schema3 challenge/current/history/DPAPI crafting metadata(count/output/expectedOutput), schema1/2 읽기·기존 entropy/path·unknown 보존.
- 화면: 계획에서 품목 선택 후 선택 재료·수량·실행을 먼저 표시, 목록/보관 계획은 접기. 현재 날개·가방 무게·시설 현황/대기 중10초 조회. 수량3→5가 재료 필요량/부족분에도 동기화된다. 준비·native 동의·실행 중에는 overview 조회를 멈추며 idle 응답만으로 준비 잠금을 풀지 않는다. 기존 수동5명령 예산/기간/ABA와 채집Stop 회귀 유지.
- optional reference: 설치된 C:/Program Files/AI_Connector의 두 고정 JSON에서 선택 품목 사실만 읽음. 파일/코드/번들 복사배포0, 임의 경로/설정/로그/즐겨찾기 접근0. source installed-reference/2026-09-21/completefalse, cached Owned를 현재재고로 사용하지 않음. 공식 산출·재료 수량 충돌 시 참고 제외, 부분정보는 full BOM/자동chain으로 승격하지 않음. S 참고상급목재3+강철괴3 확인, 현재가방으로 필요·부족 계산, 부족품의 가공/검증 채집 계획 추가.
- 검증: Node507/504PASS/3기존skip/0fail, tsc·관련lint exit0, native actor/quantity/bridge/CLI/journal/reference 및 real React batch3/null/wing5/no-repeat/workbench/10초poll/수량동기화/느린준비·동의11초·기존예산/Stop PASS. 격리webpack58·비공개 native EXE/ZIP compile PASS. 마지막 독립 review Critical0/Important2, 실제 React RED→GREEN 및 전체 suite로 수정(수량 불일치/읽기·행동 경합), 재리뷰 없음. 최종 compact 배치 뒤 fresh 회귀/빌드 결과와 앱 PID는 후속 기록을 확인한다.
- 실제 게임: 사용자는 기존 S1개 생성만 확인했고 날개 차감은 모름. 이전 unknown 기록은 자동 해제/삭제/완료 처리하지 않았다. Agent 실제 소비/stop0. 이 보호 때문에 새 실행이 잠길 수 있으며 단순 재시작으로 해제하지 않는다. 개발 후보 정상 시작·사용자 실앱/게임 결과 검증은 별도다.
- **남은 실제 목표**: 완전 재료표 검증/부족분 채집→가공→수령→제작 native 총예산·중단/시설7칸·50%완료 수령재충전/Chronos 큐는 미완료. 현재5회 제작을 전체 자동생활완료로 공지하지 않는다. 후보 적용 후 실제 화면 확인, 기존 미확정 결과의 감사가능 수동 복구 방식은 사용자 추가 선택이 필요하다. 보호 파일 직접 읽기·삭제·비밀 세션 추출·게임 CLI로 우회금지.
- 개인 root수정/삭제·신규SVG·옛addon계획 보존, 새 push/commit/운영 배포/공지 게시0. 이 PC 설치 reference/실행프로세스/원장/개인 재고는 Git으로 전달되는 데이터가 아니다.

## 2026-10-14 11:05 KST 순월 — ERGON 수량·현재 채집 중지 A 로컬 후보

- 한설이 서면 설계 뒤 ‘진행하자’로 A 직접 구현을 승인했다. 기준 e5b4ed6/기능브랜치 ff-only 최신. 추가 채집1..100/가방 시작+추가 목표, native1초 single-flight 재고·활동 감시, 별도 현재 stop control, 원래 CLI 종료까지 잠금, 부분 stopped/unknown 보호 원장을 연결했다. 실제 품목은 기존 통나무1종/소비1회·날개5, 자동 다음 소비명령은 없다.
- 자동 목표중지는 기본off이며 사용자 체크와 native 최종 동의에 묶인다. stop_action 행동ID 부재 잔여 경합 때문에 다른 앱·수동 행동 동시사용을 금하고, 교체 징후/불명 조회는 전송0. Stop 상태만 전송, invalid_state만 새 읽기 뒤 최대3회/10초 시도창; accepted 응답은 중지 요청 접수이지 완료가 아니다. 원래 결과·재고·날개·idle을 확인한 뒤만 terminal을 정한다. 초과량도 표시하며 정확1개 보장은 없다.
- strict schema2 capabilities/목표/진행과 scoped stop bridge, schema1 파서/DPAPI 읽기·기존 entropy/path 보존. v2 기록에는 gathering 목표·마지막 재고·중지 이유/상태를 보존한다. 구앱은 조회를 유지하고 새 수량 실행을 잠근다. 손상/unknown/실행 중 기록을 삭제하거나 자동해제하지 않는다.
- 화면: 추가 수량 스테퍼/동의, 확보·남은·초과/날개/지금 중지, 긴 안내·기록 details, 메뉴 복귀/만료 뒤 명시적 새 계획. 연결된 실행 화면의 중복 사전점검을 제거했고 read-only 점검은 유지한다. 기존 제작5회/날개25/5분/ABA/메뉴 보존 회귀를 통과했다. 제작의 추가 결과물 의미/부족분 연결은 B에서 바꾼다.
- 검증: 전체 Node499/496PASS/3기존skip/0fail, 독립 tsc/eslint exit0, native quantity/old executor/journal/CLI/bridge/reader·startup/grip22 PASS, 실제 React 수량/자동중지 동의/실행 중 stop/메뉴 복귀/늦은 응답/구앱/320·390·720·6..22pt PASS. 격리 webpack58 exit0, 비공개 scratch native EXE/ZIP compile exit0. localhost 최초 sandbox 차단·격리 junction EPERM은 같은 범위 승인 실행으로 해소. 구 dry-run browser의 불완전 활동 fixture는 현재 계약 필드를 채워 재검 PASS.
- 마지막 독립 리뷰 Critical0/Important3/Minor1. 실제 완료 task가 journal/state lock 뒤 중지되던 경합·새 계획 복귀·unknown location→0은 RED→GREEN. 늦은 stop 응답의 완료 화면 덮어쓰기도 실제 React RED→GREEN으로 중요도를 올려 수정했다. 재리뷰 반복 없음.
- 개발 서버 own session30435/3000 Ready, 페이지+6 scripts HTTP200 뒤 개발 IRIS PID20364 정상 시작/RespondingTrue/stderr0. 실제 앱 화면은 한설 확인 대기이며 실제 채집·Stop·날개 검증은 수행하지 않았다. local capabilities 읽기만 game_off였다. 기존 집의 통나무1회 결과 미확정은 새 완료로 덮지 않는다.
- 공개 SANCTUMv2.31/IRIS0.3.0, main1d8e374/Production dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR, 공개ZIP·공지·운영DB/RLS 유지. 이번 후보는 로컬, push/운영배포 없음. 개인 루트 수정/삭제·신규SVG·옛addon계획 보존. 종료/보호원장 강제 삭제 금지.
- 다음: 사용자 화면 확인→명시적으로 새로 승인한 통나무 추가수량/1회/날개최대5/목표중지 포함 시험→최종 CLI/실재고·날개/partial stopped/unknown 검사. 직접 CLI·가짜 동의로 우회하지 않는다. 그 뒤 B 확인된 완전 재료표만 부족분 미리보기→수동 단계→별도 제한 순차실행. Chronos/시설슬롯·수령50%/모바일은 아직 미구현. 5시간 잔여15%에서 새 구현 중단·영겁 인계/기능브랜치 checkpoint push 지시 유지.

## 2026-10-13 23:09 KST 영겁 — 사무실 수신용 체크포인트 마감

- 전송확인: 기능코드·인계커밋 `c1f302de51ba99ad9d625c3cdb6d156b583ed9ad` 일반push성공/ls-remote정확일치(선행설계117af74포함). origin/main1d8e374변경없음. GitHub combinedstatus의 Vercel은전송직후pending, 연결MCP403으로Ready/실제Preview화면은미확인. 이문서마감후속은코드c1f302d위의문서전용이며최신브랜치HEAD를수신하면된다.

- Vercel상태조회는same scope403/CLI없음으로미확인. Git인계전송과Preview Ready확인을구분, 이번에수동배포/production승격/권한변경을하지않는다. 순월이접근가능할때인계브랜치Preview를read-only확인할것.

- 한설명시승인으로 기능브랜치 `codex/iris-checkboard-classes` 후보만 검증·commit/push한다. 운영main/제품SANCTUMv2.31·IRISBeta0.3.0/공개ZIP/공지17·18/DB 유지. 새벽자동화·컴퓨터종료는하지않는다. 최종정확SHA/원격일치/Preview상태는아래마감후속참조.
- 최종 fresh검증 Node496/493PASS/3기존skip/0fail·독립tsc·관련eslint0error0warning·native reader/actor PASS·실React 제한예산/중지전후/기한/부모메뉴/ABA/6테마 PASS·격리webpack58 exit0. 후보diff는직접대조, 마지막독립queue리뷰중요2수정·회귀통과이며현장활동오인수정은native/TS/실읽기검증으로추가했다. 실제전체생활자동화완료검증아님.
- 후보수정/완료범위는아래누적기록. 사용자통나무1회실앱시작/획득·계속채집관측, 최종응답/날개5차감미확정. 현재목표1은계획값/CLI최대100, 다음중지는실제게임Stop아님. **다음작업**은quantity-stop-design 서면검토대기→A실제중지/추가수량/진행/간결UI의계획검토·직접구현, B확인BOM부족분chain별도계획. 상세사용자복사문장·VSCode수신명령은 IRIS_SOONWOL_HANDOFF.md 최신항목.
- 개인파일 UPDATE_POST_v2.151/루트삭제3개/새실행메모/kronos-theme-preview는제외·보존, 개발캐시·프로필·DPAPI·전체재고·비밀값은커밋하지않는다. 집서버10247/개발IRIS2072는현재실행상태일뿐사무실에서자동실행할근거아님. 보호unknown 해제/운영시험쓰기/추가게임명령금지.

## 2026-10-13 21:28 KST 영겁 — 제한 수동 묶음 후속 / 실게임 시험 대기

- 수량/중지 후속설계: 한설 ‘진행하자 참고를좀많이…’로 방향승인. 설치모비웍스workqueue/work/recipedb/UI와생활커넥터02/03/04/05/08 동작을깊게정적대조. `docs/superpowers/specs/2026-10-13-ergon-quantity-stop-design.md` 새파일만local117af74 commit, fetch/pull인계브랜치up-to-date, push0/기존dirty보존. **서면설계검토대기**: A추가수량/IRIS현재채집중지/간결UI, B확인BOM부족분chain별도계획. 공식작업ID없음/다른행동stop잔여위험과별도목표중지동의, partialBOM자동차단·창고판정검증·초과확보표시를명시. 서면승인전계획/제품코드착수금지, 새실게임명령0. 기존1회최종완료·비용검증미확정유지.

- 실게임/요청최신: 사용자 실제IRIS 복구 및 통나무1회 시작 성공을 알림(목표1인데4+6획득후계속/게임통나무0/100/앱running화면). 이후 다음중지도채집계속/긴설명·UIUX비판/수량증가·가공품부족재료만수급요청. 아래 game명령0은 시험전 경과, **현재는 사용자가실앱에서1회실행, agent추가발송0; 최종완료/날개5차감검증미완료**. 마지막read-only는Compass/이동전투false. 보호원장해제/재시도금지.
- 생활커넥터04/08/05 및 MobiWorks workqueue 정적참고: 재고감시목표도달→stop_action, 부족량계산/수급연결. 새구조설계방향제안단계로 actualstop/수량진행+간결UI부터, 확인재료표부족분chain후속. 목표정확1개/자동생산완료약속금지, 조회·중지지연초과량표시. 타앱코드/데이터재배포·설정변경·실행0,제품추가구현0. 먼저신규설계승인필요.

- 재실행 최신: 한설 ‘종료했어’ 확인 뒤 기존IRIS없음·localhost page/layout/desktop script모두200 선행guard통과 후 개발PID2072 시작. 서버10247·보관캐시 유지/추가파일변경0. 실제앱이새문서를표시하는지 사용자확인전, 실제채집명령0. PID5756은 종료된 이전오류문서다.

- 최신 개발환경: Ctrl+R 안 됨/사용자 정상종료 후 앱5756 재시작. 서버7732 layout.js openUNKNOWN 재발, own서버만 종료→검증된 cache `.next/dev`를 `.next/dev-before-ergon-recovery-20261013`에 이동 보존→새3000서버10247. 익명 실제Chrome 페이지+assets+React3회200/500·pageerror0 PASS. 캐시삭제/소스수정/앱게임forceclose/기록변경0, 파일환경 원인미확정. 앱5756 RespondingTrue/stderr0이나 오류화면갱신은 user확인대기. 앞으로 GET실패 시 ErrorActionPreference Stop으로 launch중단, 이미실행된앱은 임의재시작/강제종료금지. 아래 서버7732/PID29448 복구완료 표현은 재발전경과다.

- 개발 서버 오류 최신: native29448 재시작 뒤 WebView Internal Server Error, own Next30786의 page.js open UNKNOWN/pack rename ENOENT 기록. 별도 파일읽기 가능해 환경 근본원인 미확정. own서버만 Ctrl+C→escalated동일3000 webpack7732 정상시작; 연속 page200/script200. cache삭제/원장변경/앱·게임강제종료/소비명령0. 사용자 WebView Ctrl+R 후 실제 복구 확인 대기, 서버 HTTP성공을 앱 화면/채집 성공으로 보고하지 말 것.

- 최신 실게임 준비 차단 수정: 던전 밖/전장false인데 LastRunningInteractionType=EnterDungeon 유지 → 과거 행동을 현재로 해석한 버그. 활동 조회에 mainButtonState 추가, native/client 점검에서 NotInDungeon·모든15flags=false·Compass만 허용. 이력 자체는 보존, 기존 형식은 현재mode=null로 처리하여 실행 차단. reader/actor/TS 회귀 RED→GREEN, 전체496/493PASS/3skip·tsc/lint/격리58 PASS. 실제 공식 read-only→수정native정책 PASS. 한설 정상종료 후 개발 PID29448 재실행/원장·저장파일 보존. 통나무1회 실행은 아직0, 새 화면의 준비 확인을 기다린다. 아래 던전 밖 대기/PID28028은 이 수정 전 경과다.

- 사용자 실제 화면 후속: 목록/재료/가공 현황 및 통나무 계획 선택을 확인. 통나무 준비도 거부됨. 공식 `get_activity` read-only에서 던전 InProgress·전장true·EnterDungeon 확인 → 현재 SafeActivity 차단 근거. 던전 밖 안정 상태/게임 캐릭터 확인 전 소비시험 보류, 게임 명령0 유지. 안내 포괄 오류와 단일동작 연결 이전 ‘native 준비 중’ 문구를 BETA_FEEDBACK에 기록. 코드 안전조건 수정/추가 시험 명령/운영 변경0.

- 집 HEAD/원격 `codex/iris-checkboard-classes` `71cdadda98089301e3f023d30c82e4175ea4c6ea` 수신·ff-only 확인. 완료된 native/bridge Tasks 1/2는 재구현하지 않았다. 아래 순월 기록은 수신 당시 경과로 보존한다.
- 로컬 후보: 제작 수동 묶음 최대 5회/날개25 예산 유지, 완료 재고 증가·정확한 날개 감소만 차감, 다음 작업 중지/첫 준비 후 5분 새 시작 제한/명시적 새 묶음. 중지는 이미 보낸 게임 작업을 취소하지 않는다. 내부 메뉴 왕복에도 실행 컴포넌트를 유지하여 중지/소진 예산을 보존하고, 문맥·화면 세대 번호로 늦은 준비 응답을 폐기한다. 비활성·비실행 화면의 주기 조회를 멈추고 중첩 상태 조회/다른 문맥의 늦은 이력 응답을 차단한다.
- 최종 독립 리뷰 1회 Critical0/Important2, 모두 회귀 RED→GREEN: 실제 부모 메뉴 왕복 예산 소실, 준비 중 화면/계획 A→B→A 늦은 nonce 채택. 추가 리뷰 반복 없음. 전체 Node496/493PASS/3기존skip/0fail, 독립 tsc exit0·관련 eslint0error0warning·격리 webpack58페이지 exit0. 실제 React 중지 전/후·5회 소진·5분 만료·메뉴 왕복/지연 응답·6테마×12폭/글자 조합 PASS. 합성 IO이며 게임 소비 검증으로 대체하지 않는다.
- 한설 승인: 통나무 채집 명령 **1회만 / 날개 최대5 / 최대100개 채집**, 반복·제작·가공 시험 금지. 승인 전후 실제 게임 소비 명령0. 개발 서버3000 GET200, 개발 native 정상 PID28028/RespondingTrue/stderr0로 시작. Windows Computer Use kernel assets 경로 초기화 오류가 재설정 후에도 반복되어 화면 조작 중단, 사용자 에르곤 화면 요청 상태. 로그인/게임 신원을 임의 입력·추정하지 말 것. 사용자가 제공할 화면을 확인하고 진짜 앱 준비/네이티브 최종 확인 경로로만 시험한다. direct CLI/가짜 확인 함수로 우회하지 않는다.
- 실제 시험에서 unknown/timeout이면 재실행 금지·보호 원장 보존. CLI 응답 제한10분은 게임 작업 중지 기능이 아니다. 전체 BOM·Chronos·시설 슬롯/반복 수령·낚시·자동 다음 명령은 미완료. 상세 판단은 실행계획 후속 기록 참조.
- 미커밋 후보, 새 push/main배포/제품 버전/공개ZIP/업데이트 게시/DB변경0. 개인 변경·삭제·새 루트 파일·kronos-theme-preview는 그대로 보존. 실제 시험 전 완료/출시로 보고하지 않는다.

## 2026-10-13 순월 — ERGON 단일 생활 동작 후보 (기능 브랜치, 운영 미배포)

- 기준: `codex/iris-checkboard-classes`의 기존 체크포인트 `81a2724` 위에 작업 중. 공식 제품은 SANCTUM v2.31 / IRIS Beta 0.3.0, 운영 `main` 1d8e374 / Production dpl_F6ymNLT5U6aJJLNofK4wtEi8sWXR. 공개 ZIP·공지 17/18·DB 구조/RLS/운영 데이터는 바꾸지 않았다. 이 항목의 정확한 새 커밋·원격 상태는 후속 기록을 확인한다.
- 구현 후보: native 고정 생활 명령 4종(채집·가공 등록·제작·시설 완료분 전체 수령), 공식 조회 기반 정책/날개·가방·활동 검사, 120초 nonce·네이티브 최종 Yes/No·승인 뒤 재조회·DPAPI 원장·세션 간 파일잠금. 실행 중 계정/캐릭터 전환·창 종료를 막고, 결과불명/중단/재시작은 `unknown`으로 후속 작업 및 재시도를 차단한다. 기존 read-only 7종은 유지한다.
- IRIS 화면은 준비→조건/비용 표시→사용자 확인→네이티브 확인→상태/계정별 기록의 단일 동작이다. 여러 번 제작은 최대 5회·날개 25개 계획 미리보기만 가능하며, **다음 명령을 자동으로 보내지 않는다**. 완료 관측 뒤에도 매 회 새 준비와 두 번의 수동 확인이 필요하다. 등록(`registered`)은 생산 완료가 아니다. 미확정 비용 수령·낚시·전체 BOM·시설 자리 수·정확한 소량 채집은 자동 큐 대상이 아니다.
- 검증: 가짜 CLI EXE/합성 스냅샷/가짜 브라우저로 native 보호원장·CLI 인자/시간제한·executor nonce/계정/캐릭터/비용·bridge 권한, React 실행 UI, 제한 계획을 시험했다. 최종 Node 전체 492중489 PASS/3 기존 skip/0 fail, 독립 TypeScript exit0·격리 웹 webpack 정적58/58·native 후보 EXE·ZIP 컴파일 통과. 격리 빌드는 가짜 빌드 전용 공개 환경값을 사용했다. **실제 게임 행동·재고 소비·장시간 운영·사용자 설치본 교체는 시험하지 않았다.** 새 후보 ZIP은 `.superpowers` 아래 비공개이며 다운로드 파일은 그대로다.
- 최종 독립 리뷰 Critical 0/Important 6건: 업데이트 도우미/명령 충돌은 UI+native 양쪽 차단, 실행 중 내부 탭 전환 잠금, 재시작 unknown 이력은 실행 준비 없이 계정 문맥을 먼저 설정해 조회, 창 숨김 뒤에도 이미 보낸 명령의 공식 응답·재고 검증을 계속 수행, 채집 초과 성과는 `gained>=target`, 공식 이름 필터의 빈 목록은 보유0으로 처리. 동명 이종분류 혼합도 차단. 관련 native 합성·bridge·browser 테스트 통과. 실제 공식 `get_items` 이름 필터의 빈 목록 의미와 게임 실행 결과는 현장 확인 전 가정하지 말 것.
- 최종 빌드 재검증 참고: 격리 webpack 첫 재실행은 sandbox SWC 경로 권한 오류, 권한 허용 후 컴파일은 성공했으나 가짜 Supabase 환경값 없이 페이지 수집이 멈췄다. 가짜 **빌드 전용** 공개 URL/키로 재실행해 전체 58페이지 생성까지 exit0. 실제 비밀값·운영 접속은 사용하지 않았다.
- 다음 순서: (1) 독립 리뷰 Important를 수정/재검증, (2) 전체 Node·tsc·native·격리 빌드, (3) 승인 diff만 기능 브랜치 commit/push, (4) 집의 영겁은 해당 SHA를 `fetch`/`pull --ff-only` 후 실제 게임에서 명시적으로 합의한 **한 품목·한 번·날개 상한**만 검증. 행동을 시험하지 않았다면 자동 실행 완료/운영 배포/업데이트 글로 홍보하지 말 것. 이후 전체 재료 의존·재고 부족분·Chronos 대기열·시설 슬롯/50% 완료 수령·완료 알림은 별도 개발.
- 개인 변경 `푸시풀명령어`, 삭제 `혹시몰라서 그냥 둠`, 사용자 신규 SVG/루트 프롬프트·옛 계획은 commit에서 제외하고 보존. 비밀값·게임 행동/DB 직접 쓰기·force push/reset 금지.

## 2026-10-13 순월 — 사용량 3% 개발 체크포인트 / 종료 연결 복구 주의

- 최종확인: 전체Node484/481PASS/3기존skip/0fail, 독립tsc·관련eslint exit0, 최종격리webpack exit0. nativeReader/DPAPI/FileShareNone/브리지/정상종료/grip22/WebView(개별profilescope분리)/scratch패키지 compile PASS. 사용자현재 종료실패앱은아직미복구확인으로남긴다. 아래예전483/480·NamedMutex·build진행중은당시경과다.

- 5시간사용량 잔여3%(used97), 주간10%에 사용자 OR조건 충족. 새 구현중단/아래후보 최종검증·인계브랜치 `codex/iris-checkboard-classes`만 정상commit/push. main/운영/제품버전/공개ZIP/공지 변경 금지. 개인새SVG/루트파일/옛addon계획은 제외·보존.
- 사용자 ‘안꺼져 뭘눌러도’ +보관실패 종료모달 제보: FastRefresh로createDesktopStore재생성시id1부터 시작→native lastId replay거부를 동일channel+모듈재생성시험으로RED재현/GREEN수정. Symbol.for globalWeakMap으로channel별번호연속보존, native origin/epoch/replay검증 약화0. 기존막힌문서는native epoch 재설정이 필요하므로 **트레이 IRIS우클릭→복구 종료·최근 변경 손실 주의**를 사용자에게 안내했다. 기존보호dpapi 덮어쓰기/삭제0, 아직실앱종료·재실행확인전. 실행PID1864는escalatedCIM에서존재(일반sandboxGetProcess에서는조회실패); 강제종료하지않음. stderr0. 사용자 정상종료 답변후에만 새Development소스실행.
- 보호원장최종독립검토 Important1: LocalMutex로그인세션경계를 실제배타파일잠금으로RED→GREEN수정. terminal30일정리는다음Begin때, 미확정삭제금지. 원장constructor재시작 inflight→unknown/중복ID/다른계정차단/DPAPI암호화/손상보존/파일잠금PASS. 원장미연결·실제게임명령0.
- 읽기독립검토 중요4건은수정/검증했고추가리뷰반복하지않음. 보류사소함: 재료/무게/작업조회 나이UI일관성, 실제page직렬큐까지포함한통합race장기시험; 실제ReactStrictMode/단기서스펜션/실패poll0은PASS. 외부커넥터BOM복사·미확인낚시/시설정원·게임신원 자동확정금지.
- nativeWebView재실행에서공유fixture부모의접기설정이시험간남아expanded안정성실패→현재계획전용probe-GUID/WebView로설정scope분리,재시험PASS. 제품창로직수정아님. PSBOM실패복구/잘못된PS7AddType실패/격리SWC권한실패도원인기록했고정상PS5/escalated동일build로검증했다.
- 다음: (1) 사용자트레이복구종료·실제새native조회확인 (2) 보호원장호스트접속/계정필터history/nonce·확인창/사전native재조회 (3) 승인된품목1회액션/결과불명차단부터 (4) 일반채집/낚시구분 검증후제한큐 (5) 전체BOM/실제재고부족계산·Chronos계획추가·시설slots/50%완료수령/빈칸보충·완료소리. **자동 채집 실행은 아직 구현완료 아님**.

## 2026-10-13 순월 — ERGON 조회·계획 구현 중 (운영 미배포)

- 한설 ‘PC 작업부터…구현 최대한’으로 계획 실행 승인. readonly7종 native 고정 allowlist/1MiB/8초/2048행, client 재검증/직렬조회/문맥 변경 폐기와 에르곤 조회·계획 화면을 구현했다. 개인 SVG/루트 파일은 보존. 아직 새 실행 명령 endpoint는 없으며 조회로 게임 재료·날개 소비하지 않는다.
- 공식 CLI 실제 native ReadAsync7종 성공: 채집178/가공91/제작1834/재료297/가공현황28행. 가공·제작 목록은 별도 입력 불필요. 커넥터03_RecipeEngine은 일부 수동·관측 보완표이고 권리/완전성 미확인이라 복사0. 전체 BOM/시설 최대slots는 확인 전 추측 금지.
- 계획50개/32KiB/계정·환경별 localStorage, 목표1~1000000, 검색/위치별재고/잠김/무게/작업현황. 손상원본 자동덮어쓰기 금지·저장실패 세션 유지. crafting craftCount 여러회 묶음 가능→날개5~(횟수×5), 가공은등록회수×5, 채집100은최대이므로 최소소모만. 아직 총부족재료/자동채집·50%수령·반복생산/Chronos연결은 미구현.
- 검증: 전체Node478/475PASS/3기존skip(다음수정으로재실행필요),독립tsc/관련lint, 실제React2048목록/20목표/계획재로드/계정분리/가방창고/실패보존/비활성poll/12폭글자PASS. nativeNormalizer/bridge/시작종료/grip22/WebView 및scratch패키지compile PASS. WebView기존높이시험은확장창자동축소를전제해실패→현재정상고정/컴팩트Toggle구분으로수정PASS. PSsource목록기계수정에서BOM없어한글encoding RED→BOM복구PASS.
- 초기직접Add-Type를PowerShell7에서시도한실패는런타임불일치(.NETFrameworkrefs)였음. WindowsPowerShell5 -File실제7종읽기는PASS. 실제게임행동0, 공개ZIP/버전/운영DB/공지/push0. 최신사용량5h29%/주간14%, OR3%체크포인트조건미충족. 독립review1회진행중, 격리build새source재복사후검증/실앱정상종료후native적용/자동실행후속이남음.

## 2026-10-13 순월 — 생활 설계 승인 / 조회·계획 실행계획 검토 대기

- 한설 ‘구현해줘’로 생활 설계 승인. docs/superpowers/plans/2026-10-13-ergon-read-planning.md는 파일/읽기bridge/모델/계산/계획저장/UI/검증을 구체화한 **사용자 검토 대기 실행계획**. 새생활코드 아직착수전. 직접구현/최종독립리뷰1회 방식 유지.
- 사용량 중단 조건 추가 승인: **5시간 OR 주간 잔여3% 이하**에 새작업중단/인계/체크포인트push. 마지막조회5시간55%/주간19%로 미충족. 예비5%근처에는정리비용을확보. 미완성생활명령 운영합침/공지0.
- 최신UI피드백: 크로노스.14em은유지, 에르곤은과한.42em→.18em으로좁힘. 시낙시스레이드마크→기존어비스마크, 실제SVG bbox를확인해uniform1.4배/중앙보정(currentColor mask). 실제12폭·pt/6테마/저장안내흐름/자간제한PASS. 제목/소개삭제 유지. 새UI코드와원격push는아직후속.

## 2026-10-13 순월 — 제목·자간 후속 완료 / ERGON 기능 설계 검토 대기

- 설계 문서만 로컬 커밋960d66d로 보존했다. 코드 후보/개인 변경은 미커밋 그대로이며 원격 push0. 제목·자간 최종 격리webpack58 exit0 확인. 설계 검토 승인 후 실행계획 작성/검토 단계로 이어간다.

- 한설 승인: 크로노스 .14em/에르곤 .42em 한글 이름만 자간 확대, 시낙시스/영어 유지. 실제 제목/부제 폭비율0.9~1.1·큰글자/좁은창/아이콘간격PASS. IRIS 시낙시스 제목 ‘시낙시스 - 스마트 파티 매칭 시스템 및 길드 버스’, 에르곤 제목 ‘에르곤 - 스마트 채집 가공 제작 생활 매니저’. 에르곤 브랜드/영어 제목/중복 부제/그리스어·소개 문단 제거. SANCTUM 웹 제목과 DB 변경 없음.
- 기능 구현 요청을 받아 기존 재고/생활 보관 설계와 공식 CLI --help/capabilities 및 읽기7종(activity/무게/가공현황/채집후보/제작후보/가공후보/Ingredient재료)을 실제 확인했다. 게임 행동0. activity는 실제평면필드이며 생활목록117KB/80KB로 기존64KB reader와 다르다. 기록에는 응답형태만, 개인 재고 원문은 Git제외 scratch만 사용.
- 중요한 계약: 채집/가공등록/제작 호출당날개5; 채집1회최대100/작은목표정확종료미확인; 낚시started는무기한; 수령은1시설완료전체; 전체BOM/작업전용StopID없음. 기존native8초reader로 행동을 실행하지 않는다. 실패/불명 재전송0.
- docs/superpowers/specs/2026-10-13-ergon-life-manager-design.md는 **사용자 설계 검토 대기**. 에르곤 조회/재고/레시피/계획/단일행동/제한큐/원장 경계와 비용·소유권·불명·재시작안전 설명. 음악/모바일원격/독립HUD 추가 아님. 승인 후 파일별실행계획 검토를 거쳐 조회부터 구현. 현재 실제생활 기능은 아직 미연결이다.
- 최신 Node461/458PASS/3기존skip, tsc exit0, 관련eslint0error/공용SynaxisSurface의 기존useEffect 의존성warning1은 이번 제목 수정과 무관해 보존. 제목 실React6폭·글자 조합 및 메뉴·저장 전체fixturePASS. 격리build검증은 해당계획의 최신 기록 참조. 제품버전/ZIP/push/게시변경0, 현재5시간잔여60%/주간19%로 체크포인트push조건 미충족.

## 2026-10-13 순월 — 에르곤·저장 안내 로컬 후보 (미배포)

- 한설은 집 후속 작업 없음 확인. 사무실 HEAD1d8e374 인계 브랜치 ff-only up-to-date, 기존 개인 root파일/옛계획/미ACK 보존. 이번분 commit/push/운영 배포·게시·패키지 갱신 없음, v2.31/IRIS0.3.0·ZIP·글17/18 유지.
- 상위 세 메뉴는 한글 이름/부제 두 줄→선택·hover·focus 영어+SVG, 수평 교차전환·1회 빛 스침/reduced-motion. 에르곤 소개와 작업 계획·재료 확보·자동 실행·작업 기록은 **UI 준비만**, 실제 게임 명령 미연결.
- 저장 안내는 body 포털: 유휴없음, 변경/저장중/오류 유지, 완료3초/미리보기4초. 네 모서리 위치는 환경별 이 PC에만 저장. 실제 변경이 있을 때 미리보기도 실제 상태임을 알리며 저장·게임 IO를 만들지 않는다. 모든 visible모달 중 안내 숨김, compact 포털 클릭으로 메뉴가 닫히지 않음. 기존 controller/큐/save/discard/recover 유지.
- 실제React 360/390/600/720×6/13.5/22pt·6테마/네모서리/재시작/차단저장·복구/완료/compact/Escape/reduced-motion PASS. 기존 메뉴21폭·폰트조합×6테마/클래스 초안 유지 PASS. 영문잘림 RED→GREEN, 독립리뷰 Important1(스탯·추천 모달 뒤 안내) 실모달 RED→GREEN 수정. subtitle도 기본18px에서12px 가독성 확보.
- 최종 전체 Node460/457PASS/3기존skip, 단독tsc/관련lint/격리webpack58 PASS. 중간 전체시험에서 기존 bus-live-notifications 반복 출발 시험1회 간헐 실패(2/3알림); 단독25/25 및 전체 직렬 재검증 PASS. 기존 -Date.now()-random1000 ID 충돌 가능성 별도 기록, 이번 범위 밖 hook 수정하지 않음. 실패 숨김0.
- localhost3000 webpack 정상 실행·/iris/desktop200. Development launcherPID1864 최초응답true/stderr0, 후속조회에서는 종료됨. 사용자 첨부 실제 새메뉴 화면 확인 후 SVG/부제 간격 제보→2cqw 간격/생활마크 확대 제거·영문 폭 조정, 실제 간격RED→GREEN/12폭·pt 및 관련29시험PASS. 실제 게임·다른DPI는 이번 시험으로 확정하지 않는다. native 수정/강제종료0.
- 사용자 승인 push조건은 **5시간 잔여2–3% 체크포인트**. 마지막잔여69%/주간21%로 미충족, 아직 미push. 실제 생활 실행은 별도 안전 첫기능 설계/승인 후 연결. SVG 요청 예시 docs/IRIS_ASSET_PROMPTS.md, 구현 기록 docs/superpowers/plans/2026-10-13-iris-ergon-navigation.md.

## 2026-10-12 순월 — 공식 push·운영 배포·공지 2건 마감

- **21:23 추가 복구 확인:** 문서 후속 커밋9cfcfb2 최초 배포는 git_info_fail ERROR(dpl_AbKL...)였다. 실제 운영0.3.0 유지 확인 후 동일 커밋·기존 프로젝트 설정으로 재배포하여 dpl_6W4wLEF8k1CBbwjBXEku8Zv2ChUg READY/Production/9cfcfb222ee7734d7d8aae0d75e0b3a1bac2b004/공식domain aliasError null 확인했다. 실패를 숨기거나 코드·설정·보안 권한을 바꾸지 않았다. 상세로그는403/CLI없음으로 미확인. 제품코드d70b0e5/패키지·게시2건 그대로, 이번 복구 기록은 문서 전용이다.

- 예약 iris-sanctum은 완료 후 앱 도구로 PAUSED 전환/저장 상태 확인했다. 같은 작업 재개·중복 게시하지 않는다. 기존 IRIS 분류는 정확한 ‘IRIS Beta x.y.z 출시!’ 제목만 허용하여18번 제목을 ‘IRIS Beta0.3.0 출시!’(실제 공백 포함 표준형)로 정상 수정 UI에서 맞췄다. 본문4중제목 유지·추가 글 생성0.
- 최종 `/kerygma?note=iris` 재로드에서 최신 글18/IRIS0.3.0 자동 연결·작성자·본문 확인 완료. 이전16번은 과거 출시 기록으로 남는다. 공개 공지 재게시/추가 제목 변경 필요 없다.

- 제품 코드 d70b0e52f446747ceb1e385a63375baee7c087a3 main/인계 브랜치 일반push·원격일치. Production dpl_GwtYnzwu2YndBELvBR9TgB98Eitk READY/동일SHA, 실제 운영 Chrome 메인/상단3패널·상세크로노스·다운로드 확인. SANCTUMv2.31/IRIS0.3.0, 공개ZIP527716/SHA2dfda82795e997415173b87c2359d3550465d8a1564cf049c51b3bdf7306bcdd 일치. 필수8GET200. 최종 문서 후속은 제품 코드/버전·구조 변경 없음.
- 공지 게시 완료: SANCTUM시스템 생텀업데이트 글17(v2.31) / 글18(IRIS0.3.0), 정상 Chrome 관리자 작성 UI·중제목3/4구역·상세 내용 눈 확인·각1회·중복 없음. https://sanctum-tawny-three.vercel.app/kerygma?id=17 / https://sanctum-tawny-three.vercel.app/kerygma?id=18 . 이전 ‘게시 미완료’는 경과이며 다시 게시 금지. 공지 외 운영 숙제/캐릭터 시험쓰기0·DBschema/RLS·게임행동·보안우회0.
- **집 영겁 첫 순서:** 개인 dirty부터 확인하고 정상 `git pull --ff-only origin main` 후 이 최신 항목/릴레이를 읽고 ACK한다. 아이리스를 켜고 실제 게임 최대화 자동 작은 바·클래스 메뉴 위치 유지/패널 내부 스크롤·일반 창 복귀 왼쪽/오른쪽 도킹·실제 최소화/복원·다른 앱/바탕화면을 확인한다. 실제 벨/글꼴·30~100투명도·재실행 기억·다른 DPI도 사용자와 확인. 이후 홈 두 캐릭터 연속 체크/15초·저장중 입력·실패 재시도는 사용자 실제 이용 때 확인(시험 임의 기록쓰기 금지).
- 사무실 Development 새 소스1회 실행 PID23852/Respondingtrue/stderr0. 공개 ZIP 업데이트 준비·실제0.2.2→0.3.0 EXE/helper/offline WebView 교체/보호해시 시험PASS; 집의 실제 사용자 설치본을 대신 교체한 것은 아니다. 구0.2.0/0.2.1 HTTPS실패앱 ZIP전체수동1회 안내/미서명·조직보안차단우회금지 유지.
- 전체455/452PASS/3기존skip·독립tsc·격리webpack58 exit0/실React/native/좁힌교차리뷰 중요잔여0. 실제게임/다른DPI는 미확인으로 남긴다. 사소한 보류2(구native 접기 오류문구 표시/font방향키option강조·스크롤)는 그대로다. Vercel slug403→기본연결 실제 projectId 정상조회로 Ready 확인, 인증 추출/CLI설치/DB게시우회0. 개인 푸시풀명령어/public recruitment/옛계획3영역은 보존·미커밋. 이번 단일 예약은 마감 후 종료해 완료 작업을 반복하지 않는다.

## 2026-10-12 순월 — 20:20 예약 마감 실행 / 최종 후보 검증

- 최종 tree 전체 Node455 중452 PASS/3기존skip/0fail, 독립 tsc·격리webpack58 exit0, same reviewer 중요 잔여0. 20:53 KST 승인 범위만 commit/main 정상push 준비, 운영 결과는 후속 기록한다.

- 아래 17시 checkpoint의 미구현 항목은 이 후속으로 갱신한다. 홈 Kronos Check Board는 캐릭터별 baseline/의도/version을 보관하고 마지막 수정 후15초에 묶어 저장한다. 저장 중 추가 체크·되돌림 가능, 늦은 응답은 해당 snapshot만 ACK한다. 기존 길드버스 체크·서버 CAS 병합 유지, 수동 저장/실패 재시도·실패 값 보존·이동/새로고침 안내, 계정 전환 전체 요청 구간 잠금과 홈 모든 위젯/파티 버튼 이동 보호를 연결했다. 강제 브라우저 종료의 영구 복구는 보장하지 않는다.
- 기존 member-mutations에 선택적 _checklistPeriods를 전달하고 진입/캐릭터 조회 후/갱신 직전 기간을 재확인한다. 실제 DB 시간 경계를 포함한 트랜잭션 수준 원자성은 기존 API 한계이며 새 DB 함수/스키마/RLS 변경은 없다. 인증 결과가 불명확한 실패는 재로드로 현재 세션 확인, 편집을 임의 재개하지 않는다.
- 실제 React hook+카드+전송 클라이언트 합성 PASS: 연속 체크/15초·진행 중 입력/되돌림·두 캐릭터·실패 재시도·계정 저장 후 인증 지연 잠금/빈 큐 잠금·프로그램 이동 대기. 교차 점검 Important(계정 잠금·모든 버튼 이동·기간 재검사)을 RED→GREEN 수정, 동일 리뷰 후속 잔여 없음. 실제 운영 숙제 시험 쓰기0.
- 독립 tsc exit0·최종 격리 webpack58 exit0(최초sandbox 경로권한 실패 후 동일 사본 승인 재실행), 관련24 PASS. native 실제 구0.2.2 ZIP→최신0.3.0 EXE/helper/새 offline WebView 교체 PASS, 보호 큐/설정 해시 보존(Temp iris-update-live-628bed510053487b8f35b81e62832b73). updater policy/process success/crash/recover PASS, ZIP527716/SHA2dfda82795e997415173b87c2359d3550465d8a1564cf049c51b3bdf7306bcdd.
- 예정 공식 버전 SANCTUMv2.31/IRIS0.3.0. 이 기록 시점 commit/push/배포/게시 미완료. Vercel 연결403/CLI없음/UI로그인 필요는 우회하지 않으며 GitHub Vercel commit status는 조회 가능하다. 개인 푸시풀명령어/public recruitment/옛2026-10-08계획 제외·보존. 실제 게임/다른 DPI 확인은 집 영겁의 첫 과제로 남는다.

## 2026-10-12 순월 — 공식 마감 승인 / 20:20 단일 재개 예약

- **20:20 추가 승인 과제 — 메인 Kronos Check Board 15초 묶음 저장:** 한설 screenshot의 메인 여러 캐릭터 숙제 카드가 클릭마다 저장하며 다음 체크를 막는다고 제보. app/page.tsx handleToggleTask의 `taskSaveStatus==='saving'` 전역 조기반환과 클릭별 memberMutationOrThrow 요청을 확인했다. 현재 구현0, 상세크로노스와 같은 마지막 수정 후15초 debounce/즉시로컬표시/연속체크허용/수동지금저장·작은pending상태로 변경한다. 여러 캐릭터·계정별 baseline/desired 분리, 저장중추가입력·늦은응답·실패변경보존·페이지이탈안내·기존_checklistAction 서버의길드버스/동시수정 안전장치를검증한다. 기존helper/API를조사해재사용하고전체체크JSON을구버전으로덮어쓰지않는다. main배포와생텀업데이트글에포함, IRIS글과구분한다. 예약iris-sanctum의prompt를이과제포함하여update성공, KST20:20/COUNT1유지.

- 마지막시험후속: updaterprocess는sandbox --prepare실패→승인된own임시파일경계escalated로동일시험재실행 success/crash/recover 3개PASS(iris-update-process-66e5792d). session22075는실패종료확인, background시험대기없음. 공개릴리스후보내부노트작성済; actualold0.2.2 package는gitarchive로HEAD추적publicZIP을ignored폴더에추출해서live offline trial에사용가능(아직실행0). 최종geometry/header/opacity 좁힌review는요청스킬/템플릿읽었으나usage4%로아직dispatch0. 20:20최초에독립read-only1회만실행, 이전fullbundle검토를전체재반복하지않는다. 재시작은최종검증뒤한번;사용자이미정상종료확인했지만실행프로세스재확인하고forcekill금지.

- checkpoint 후속(17시 KST): 사용량96%/4%잔여. **아직 commit/push/운영 배포/게시0**. 최종 격리 webpack58 exit0, Node443 중440PASS/3skip, native release-package absolute인수 allowlist/hash/unsigned PASS, updaterpolicy sandbox권한차단후escalated PASS. update-process session22075 결과대기, 실제0.2.2→0.3.0 offline교체/최종좁힌교차검토가남음. 다음이어서: (1) 남은native검증과경계리뷰·수정, (2) 최종types/diff/필수공식문서, (3) 승인파일만commit/main정상FFpush, (4) 동일SHA Ready와운영웹·ZIP 확인, (5) 준비된 두공지정상UI로게시/중복방지, (6) 실제재시작/영겁인계. Chrome extensionproduction기존탭745886768 연결확인만; Vercel teams[]/ghCLI없음이며deployment목록 team slug sanctum-sanctuary/project sanctum 또는기존연결도구확인. 보안·인증우회금지. 여기서중단된상태를예약20:20에서미완료부터시작하고전체과거작업을반복하지않는다.

- 한설이 이번 미완료 묶음의 구현·검증·정상 push·운영 배포·업데이트 가능한 IRIS ZIP 갱신 및 SANCTUM/IRIS 업데이트 글 각각 게시를 명시 승인했다. 글은 따뜻한 설명/중제목/작성자 SANCTUM 시스템, 기존 분류 방식, Ready·운영 검증 뒤에만 각1회. DB 구조/RLS/삭제/게임 제어/보안 우회는 승인되지 않았다.
- 재개 예약 `iris-sanctum`: 이 대화 heartbeat, 2026-10-12 KST20:20 1회, 완료 작업 반복/중복 게시 금지. 사용자 사무실 PC·Codex 켜두고 간다고 확인. 사용량 최초 확인82%사용/18%잔여. 단순 예약만으로 배포·게시 완료가 되는 것은 아니다.
- 새 실제 피드백 반영 중: 수동 위치에서 compact 메뉴 고정600px(아래 남은 공간 제한)/긴 내용 내부스크롤, 독립 expanded 높이640 유지, 전체화면 수동이동도 dockSide 기억, 일반창 복귀 compact도 좌우 재도킹. 투명도30~100 native/bridge/client·환경 로컬 기억, 설정 ‘테마 선택’. native grip22/addon82/bridge PASS. native 게임 최소화/실복귀 사용자 확인은 별도.
- 웹 패널 공통 useHeaderPanelPosition: 기존 outside-click owner 안에서 absolute, 호출 버튼 끝에 정렬/상단 도구 전체 아래/viewport 좌우 여백/남은높이/resize+scroll+observer 정리. 실제 Navbar/알림/날개 합성5폭·PC3글자/mobile18 검증 PASS. 기존 Layout Escape/바깥클릭 경로 보존. 대상 lint0오류, SpiritWingsMenu 기존img warning1.
- 버전 후보 SANCTUMv2.31/IRIS0.3.0. 공개 ZIP 후보527716bytes SHA2dfda82795e997415173b87c2359d3550465d8a1564cf049c51b3bdf7306bcdd 생성됨(아직 운영배포 아님). Node443 중440PASS/3기존skip; tsc 및 actual desktop 합성 투명도30/reload·글꼴/접기 PASS. 격리 webpack 빌드 진행 중, 최종 패키지·updater trial/통합 확인/commit/push/Ready/실화면/게시2글은 아직 미완료.
- 원격 fetch/pull --ff-only 인계브랜치 up-to-date, origin/main fb607e0는 HEAD d72f218의 조상(0/4). 승인된 후보를 commit 후 main으로 정상 fast-forward push 가능; 강제 push/dirty reset 금지. 개인 루트 ‘푸시풀명령어’, public/recruitment, 이전2026-10-08 plan은 이번에 넣지 않는다. 공지 초안 docs/UPDATE_POST_SANCTUM_v2.31.md / docs/UPDATE_POST_IRIS_0.3.0.md. Chrome extension 연결 살아 있음/기존production 탭745886768 확인만, 세션 추출/직접 DB 공지 쓰기 금지.

## 2026-10-12 순월 — 실제 피드백: 게임 화면 밖 이동·접기 높이 회귀

- 사용자 screenshot 뒤 게임이 화면 아래로 넘어간 것으로 정정. native docking은 게임과 작업영역의 보이는 세로 구간에 맞춘다. 완전히 모든 모니터 밖인 경우 FollowGameVisibility가 소유 IRIS만 숨김/비활성 복원, 사용자 직접 숨김/연동 끔/종료 확인/unknown frame은 구분한다.
- 설정이 열린 상태의 manual/auto compact는 page에서 설정을 닫는다. classes 100dvh는 expanded에만 적용. native panel 닫힘은 이전 contentHeight 폐기, await 측정은 layoutRevision이 바뀌면 무시. 편집 본문·초안은 기존 hidden 유지.
- 재현 실패→통과: 부분 화면 밖 docking, 설정·클래스 접기, 큰 설정 측정 후 panel 닫힘. native addon81/grip20 및 presentation/WebView/startup-close PASS; 실제 페이지 합성 manual/auto 접기·폰트·폭·선택 PASS; Node442 중439PASS/3기존skip, tsc/대상 ESLint/diff PASS. 이번에는 웹 full build/패키지 재생성하지 않음. 한설 정상 종료 확인 후 Development PID9872 재실행/Responding true/시작stderr0, 실제 게임 확인은 대기. DB/게임 제어/commit/push/배포/버전 변경 없음.

## 2026-10-12 순월 — IRIS 업데이트 묶음 로컬 구현·단일 교차검토·재실행

- 한설이 계획 직접 실행을 승인했다. 설치 글꼴 자동 목록/검색/새로고침, □ 축소/게임 최대화 자동 접기/실제 둥근 창, 크로노스 알림4종/개별 알림·소리 기본ON/기존 제보, 카드별 연필/추가1카드/대표 설정/추천 수동선택 통일을 구현했다. 아래 과거 ‘미구현/계획 검토 대기’는 당시 경과다.
- 글꼴 이름만 네이티브 실행 캐시(2048개/80자), 로컬6~22pt/기존설정 유지. 창 폭360~720 유지, 본문·초안·대기함은 접혀도 보존한다. Region은 실제 모서리를 자르고 resize 중간은 유지한다. 같은층/바탕화면/최소화 경계는 기존보완 유지.
- 알림은 KST 홈 계산을 공통화하고 초기 bounded 조회+기존2개Realtime 구독+로컬 타이머만 쓴다. 승인 어비스만 확정, 심층00/30은 제보초기화. 큐 최대4·15초 유효·한 번만 안내/소리, 외부포커스 강제활성화 없음. 자체0.6초WAV/2초 native rate limit, 테스트 소리0. 기존reports POST를 명시적 제출 때만 재사용, timeout/깨진 응답은 중복제출 차단/현재값 확인 안내.
- 새 `/api/iris/character-management`는 세션/Origin/4096byte/소유/CAS/활성클래스/닉네임 중복 검증. 닉네임은1~12자(기존긴이름 그대로유지는허용), 기존UUID/숙제/클래스/과거기록 보존. 대표clear→set은 기존DB에서 전역원자성이 없으며 postread/부분실패 경고로 보완, 신규RPC/스키마/RLS/운영쓰기시험 없음. owner없는legacy는읽기전용 유지.
- 구현은 순월 직접, 마지막에 fresh reviewer1회만 사용했다. 검토의 종료/추천·편집 모달 겹침, legacy선택 목록 유실, localStorage getter SecurityError를 각각RED→GREEN으로 수정. 추가로 메타 변경 후추천카탈로그 stale를 중요한 문제로 재분류해 명시적변경 후1회 재조회, 기존pointerdown 충돌·깨진제보응답·320px 긴메뉴도 실재현/수정했다. 종료확인취소는 편집초안 유지, 보고제보 진행 중 종료 선택은 대기한다.
- 검증: 전체Node442 중439PASS/3기존skip, 독립tsc/수정파일ESLint/diff PASS; native fonts/presentation/silent bell/bridge/WebView/startup-close PASS, addon75/grip19 PASS; actual desktop합성폰트검색/한번캐시/12폭·pt조합/접기/늦은추천·선택 PASS; 메뉴21폭·폰트×6테마 PASS; 알림·소리토글/중복/제보/저장소차단/로그아웃 및 카드0/1/6/100/연필/추가/종료취소/추천표시갱신 합성browser PASS. 웹빌드는 비밀파일 없는격리사본+가짜Supabase설정으로PASS, native build는ignored사본에만 생성. 기존수정하지않은DesktopSynaxisSurface의 broad lint2오류/1경고는별도기존부채이며 대상수정파일lint는clean.
- 정상종료 확인 후 Development PID27456 재실행, Responding true·stderr0·중복앱0 확인. 실제 게임 최대화/일반복귀·바탕화면/다른앱·최소화/둥근모서리·실제소리 확인은 한설 몫으로 남는다. 운영버전SANCTUMv2.3/IRISBeta0.2.2·공개ZIP·commit/push/배포·운영DB 무변경. 후보브랜치/개인dirty 보존.
- 사소한 보류: 구native의 접기 오류문구가 화면에 직접 나오지 않는 점, 폰트목록 방향키 active option의 스크롤/강조. 다음실제피드백 때 보완. 세부계획/판단/증거는docs/superpowers와ignored .superpowers/sdd/2026-10-12-iris-*에 있다. 통합/공식push는한설명시승인후, 증거가미커밋이므로scratch를삭제하지 않는다.

## 2026-10-12 순월 — 설치 글꼴 자동 목록·알림 소리·둥근 창 포함 실행계획 작성

- 한설이 “그것까지 포함해서 업데이트하자”로 설치된 글꼴 자동 조회/검색/새로고침을 묶음에 포함하길 승인했고, 콘텐츠별 알림ON/OFF 옆 소리ON/OFF·짧은벨, 실제둥근네이티브모서리를 추가 요청했다. 알림OFF는소리없음·ON상태에서개별음소거·선택로컬기억, 기본알림/소리ON을계획에 제안했다.
- 승인설계후보를갱신하고 `docs/superpowers/plans/2026-10-12-iris-update-bundle.md` 색인 + installed-fonts/compact-window/content-alerts/character-manager 4세부계획을작성/자체검토했다. 기존코드경로/네이티브host source목록/시간119초·대표순차쓰기한계를확인해정확한API·시험을명시했다. 순월직접순차Native 실행권장·추가에이전트없음·실제재시작은가능하면native변경묶어1회.
- **이번 후속은계획까지만 작성. 새4기능코드/bridge/API/DB/패키지/버전/commit/push/배포 변경없음. 사용자실행계획검토·방법확인대기.** 설치글꼴/축소/알림/캐릭터관리가이미완료됐다고보고하지않는다. 이전6~22pt/수동글꼴·바탕화면후보와실행PID25212는유지한다. 다음승인후executing-plans/TDD로4계획을순차실행한다.

## 2026-10-12 순월 — 바탕화면 클릭 회귀 / 6~22pt·로컬 글꼴 / 다음 3묶음 설계

- 한설: 다른앱 가림은 괜찮지만 바탕화면 클릭 때 IRIS가 없어짐. Windows Progman/WorkerW 배경을 다른앱으로 yield하던 경계였다. read-only shell handle 시험에서 실제 WorkerW가WS_EX_TOPMOST였고 일반Z순서 가정도 성립하지 않아, desktop 배경에서 기존 게임 범위 layer를 유지하고 뒤로 배치하지 않는다. 다른앱/작업표시줄·게임 종료/옵션해제는 기존 처리. native75 PASS, 실제 클릭 사용자 확인 대기.
- 글자 크기는 사용자 추가 지시에 따라 작게/보통/크게가 아닌6~22pt 드롭다운. 기존18/20/22px를13.5/15/16.5pt로 그대로 복원, 로컬 font key 호환. 글꼴 기본/맑은고딕/돋움/굴림/직접 이름 입력(80자, URL/스타일 주입 거부), IRIS main에만 적용/설치안됨fallback·다운로드0. 환경별로컬 저장, DB/웹전역설정 무변경. 10pt미만 안내, 큰폰트 좁은메뉴2열/숙제1열. N 표시는 실제Next app-next-dev의 dev overlay로 생산entry에는 연결되지 않음.
- 신규font RED→GREEN 포함관련33/전체Node430 중427PASS·3기존skip, 독립tsc·대상lint·diff·native75/grip13/bridge PASS. 실제페이지 합성6/13.5/22pt×360/420/600/720·임의Segoe UI·reload·resize·12자닉/하위메뉴클리핑0 PASS. 극대22pt 캡처 눈확인(브랜드 단어 단위 줄바꿈/메뉴2열). 첫 WorkerW 시험은 일반 Z-order를 가정해 실패, 실측같은층 유지/visible/상대관계 보존으로 검증을 바로잡음. 운영/game test쓰기0.
- 사용자 정상 종료 후 Development PID25212 다시 시작/Responding true·stderr0. 바탕화면 실확인 대기. 코드 마지막 invalid HWND 보호1줄은 다음 native 재시작에 포함되는 보수적 추가이며, 현재 실행에는 바탕화면 핵심 수정은 포함되어 있다. 미커밋/미푸시·버전/패키지/배포 없음.
- 추가 요청: □축소바/전체화면 자동접힘(일반메뉴 유지), 크로노스알림4종/기본ON 콘텐츠별토글/SVG·일회모달/제보, 캐릭터카드 연필·대표·추가카드1개·추천수동선택 통일. [설계 후보](superpowers/specs/2026-10-12-iris-compact-alerts-character-design.md)에 범위/안전/검증을 정리했다. 새3묶음은 아직 구현되지 않았고 설계 확인→실행계획 후 순차 진행한다. 생텀의기존 reports/member-mutations/characters.is_main을 조사했지만 실제DB쓰기는 하지 않았다.
- CLI현재 capabilities를 직접 읽음: 구멍 출현시간/좌표/개수 직접명령 없음. 환경은내위치, activity는내진행/상호작용이라 출현으로 역산불가. 홈기준 결계매시00분임박/02~04활성, 보스12/15/18/20/22시2분전/30분활성, 승인어비스제보2분전/15분활성. 심층00/30은제보초기화, 어비스기본36시간15분은예상이며 확정출현모달로 단정금지. 새DB/RLS·운영제보·배포승인 없음.

## 2026-10-12 순월 — 하위 메뉴 상시 버튼 복원 / 상위 버튼 높이 축소

- 후속 사용자 확인: 한설이 위 메뉴가 정상 복원됐다고 확인했다. 이어서 최소화/닫기 사이 □축소 버튼·게임 최대화/전체화면 자동 축소·축소 메뉴/임시 패널을 요청했다. 이 후속은 현재 설계 제안 단계이며 native 구현이나 완료 기록으로 혼동하지 않는다.

- 한설이 실행된 인계 브랜치의 기능 드롭다운을 거부하고 원래 상시 버튼 복원·크로노스/시낙시스 세로 축소를 승인했다. `DesktopFeaturePicker`는 기존7개 ID를 4+3 두 줄로 즉시 표시, DesktopCenter의 popup 상태/effect만 제거. 현재 본문 hidden 유지·클래스 초안/캐릭터 선택/계정 잠금·재선택 무조회는 유지한다. 상위 높이2.4→1.75rem, 전역테마·글자 설정 그대로.
- SSR 신규RED→GREEN/UI23, 전체Node427 중424PASS/3기존skip·독립tsc·대상lint/diff PASS. 실제React/CSS 합성7기능 전환/재선택IO0/계정잠금/클래스53 초안 유지·21폭글자×6테마/상위버튼≤2rem·가로넘침/버튼잘림0 PASS, 390px 캡처 눈 확인. 브라우저 첫 상태검사는 React commit 전 count를 읽어 실패, DOM 대기 후 동일검사PASS. 공용 feature helper와 기존 navigation 시험 진입부/선택자를 상시버튼으로 갱신; navigation 전체엔트리는 이번에 실행하지 않음.
- 개발 native 재시작 없이 localhost:3000/iris/desktop에 반영, 사용자 실제 외형 확인 대기. 기존 폭·폰트·추천·창 순서·종료 설명 후보 보존. 버전/DB/API/권한/게임제어/패키지/commit/push/배포 없음. 이전 드롭다운 설계 기록은 과거 경과로 보존, 최신 결정은 docs/DECISIONS.md 우선.

## 2026-10-12 순월 — 다른 앱 뒤로 창 연동 / 종료 선택 설명 후속

- 한설 게임→Codex 클릭 시 IRIS가 앞에 남는 실사용 제보. `HWND_NOTOPMOST`는 일반 창 그룹 맨 앞에 놓으므로 topmost bit 해제 시험이 가림 순서를 놓쳤다. [Microsoft 계약](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowpos)과 화면 밖 실제 WinForms 창 RED로 확인. 승인 후 sameLayer 활성·유효 게임/다른 foreground 조건에서 자신의 HWND만 해당 창 뒤로 배치, 이미 non-topmost 재상승 경계도 방어. 게임/다른 창·입력 초점·geometry 변경 없음. 게임 복귀 raise·작업표시줄·옵션해제·종료 예외 유지.
- 종료 이름 `생텀에 저장 후 종료` / `이 PC에 보관 후 종료`와 설명. 현재 계정 미저장/잘못된 클래스 초안이 없으면 단일 `종료`(기존 save 경계로 늦은 변경/실패 방어 유지). store/close 실패는 복구 선택 유지. controller/store 형식 변경 없음.
- 전체Node426 중423 PASS/3 기존skip·독립tsc·대상lint·diff 통과. native70/grip13/bridge PASS. 종료 실제페이지 합성9(clean/keep POST0·저장·unknown/conflict/401·invalid draft·keep실패·close재시도 중복방지) PASS, 390px 설명 캡처 눈 확인. sandbox Edge 시작 접근 실패 후 승인 실행으로 동일 시험PASS. 실게임/DB쓰기 없음.
- 한설 정상 종료 후 첫 수정본 PID12444 시작stderr0, 이번 후속 정상 종료 후 최신PID680 Development 재시작/Responding true·stderr0 확인. 실제 다른앱 클릭→IRIS 뒤로/게임 복귀→앞으로 확인은 사용자 대기. 이전 PID 기록은 당시 경과. 버전/패키지/commit/push/운영 배포/DB/API 변경 없음.

## 2026-10-12 순월 — IRIS 추천·최소화 경계/수동 폭·글자 크기 로컬 후보

- 한설 제보: 캐릭터 추천과 게임 최소화 동기화가 가끔 빠지고 창 폭/글자 크기가 불안정함. 해당 검증·개선을 승인했다. 사무실 인계 브랜치에서 기존 웹15초 저장/개인 dirty를 보존한다.
- 추천: 첫 변화 후보를 마지막 비교 기준으로 저장해 설정/숨김 후 remount에서 변화를 놓치는 경계와 오래 최소화한 뒤 fresh seed가 사라지는 경계를 재현했다. `baselineObservation`으로 확정된 비교 기준만 계정 세션 메모리에 보관하며, watch는 역사적 기준을 비교용으로만 허용한다. 추천 증거는 여전히 새 신선한 관측2개, 네는 재조회/수동 선택, 주기DB/자동선택·쓰기 추가 없음. 부족/비슷한 DB 수치 때 보류는 유지한다.
- 최소화: 관측에 DWM frame이 없으면 IsIconic까지 무시하던 policy/adapter 경계를 수정했다. 트레이로 다시 연 뒤 게임이 아직 최소화된 경우에도 재적용한다. 접근 거부/잘못된 PID/없는 handle을 게임 종료로 추정하지 않는다. 실제 간헐 증상의 모든 원인을 실측 확정한 것은 아니다.
- 가로폭: 양쪽5px 네이티브 가장자리로360~720을 직접 조절, 별도 `window-width-v1.json`(환경별 profile 부모 폴더) 저장/복원. 도킹·내용 높이 자동 조절은 선택 폭을 유지한다. 게임/앱 최소화·종료·저장 보호 경계 유지, 브리지 메서드/권한 변경 없음. 화면 공간 부족은 기존 독립창 방어를 따른다.
- 글자: 설정에18/20/22(작게 FHD/보통/크게 QHD) 선택, IRIS 환경별 로컬 저장. root layout은 desktop에서 SANCTUM 글자/모바일 리사이즈 effect를 적용하지 않으며 웹으로 돌아오면 기존 규칙을 적용한다. main의24rem 너비 상한 제거/keep-all·좁은 큰글자 숙제1열. 해상도 자동 판정이 아니라 Windows 배율에 맞춘 직접 선택이다.
- 검증: 신규 추천2/폰트1 및 기존 관련26, 전체 Node·독립tsc·대상lint·분리webpack57 통과. native addon61/grip13/bridge/WebView 통과. 실제페이지 합성 추천18시나리오(새 pause2·계정격리·최신2관측·큐/draft·숨김/늦은응답, statsPOST0), 폰트/폭12조합(360/420/600/720×18/20/22), 긴12자 이름·재조회 없이 글자 복원·390계열 캡처 확인. 최초 전체 browser 실행은 과거 설정→로그아웃 동선에서 실패하여 해당 fixture3곳을 현 계정 도구로 수정했고 관련18을 다시 통과했다. 모든 기존 browser 엔트리 통과로 확대하지 않는다.
- 현재 실행 중인 PID16040은 변경 전 native다. 사용자 정상 종료 후 새 `desktop.ps1 -Development`를 실행해 실제 최소화/복원·연속 추천·가장자리 폭·글자/재실행을 확인해야 한다. 새 native 실사용 성공·DPI 전체 검증으로 보고하지 않는다. 버전/패키지/commit/push/운영 배포·DB/API 변경 없음.

## 2026-10-12 순월 — 웹 크로노스 15초 묶음 저장 로컬 후보

- 사용자 후속 확인: 기본 저장 동작은 정상이라고 제보. 기능 필터 버튼의 min-height를 제거하고 세로 여백을 줄였다. 상시 저장 줄은 제거하고 미저장/저장 중/오류 때만 우측 상단 반투명 패널+직접 저장을 표시하며 깨끗해지면 숨긴다. 중복 기존 토스트는 억제한다. 합성 화면 조건부 표시/자동 숨김과 저장 회귀 통과, 실제 새 외형 사용자 확인 대기.

- 사무실 인계 브랜치 `codex/iris-checkboard-classes` / `d72f218` 수신, YG-20261008-001 ACK. 사용자 개인 `푸시풀명령어`, 과거 계획, public/recruitment는 보존했다. 메뉴 정리를 다시 구현하지 않았다.
- 한설이 웹 크로노스 저장 지연을 제보하고 15초 자동저장/지금 저장/이동 보호를 승인했다. 기존 500ms마다 캡처된 저장을 Promise 체인에 누적하던 경로를 최신 snapshot 단일 진행·마지막 수정 후 15초로 변경했다. 이것은 요청 누적 개선이며 운영 서버 지연을 실측해 해결한 것은 아니다.
- `lib/kronosAutosave.ts`와 `/character` 저장 상태 줄: 미저장 항목 수·카운트다운·지금/다시 저장, 초기 로딩/되돌린 동일값 무쓰기, 진행 중 수정/취소값 보존, 실패 자동 재전송 없음. 캐릭터 전환/관리창 열기/링크/뒤로 이동은 먼저 저장하고 실패하면 현재 화면을 유지한다. 닫기/새로고침은 브라우저 미저장 경고이며 강제 닫기·브라우저 종료에 대한 영구 복구 보장은 없다.
- `KronosWorkspace` 상점/임무 count·즐겨찾기도 같은 15초 정책/상단 합산/이동 보호에 등록한다. 관련 항목만 순차 delta 전송하며 응답 유실 시 수동 재시도 전에 현재 progress를 재조회해 같은 delta를 중복 보내지 않는다. 기간 경계/다른 결과는 오류로 보류한다. 메모는 기존 별도 저장 흐름을 유지한다. 물물교환 공유 사본 실패 때 dirty ID를 보존하도록 완료 처리 순서를 조정했다.
- 검증: 단일 진행/늦은 변경/진행 중 되돌림/실패 재시도 등 신규 7건, 전체 Node 통과(기존 skip 유지), 타입 통과. 실제 페이지 합성 IO로 15초·수동 저장·진행 중 수정·실패 전환 중단·상점 응답 유실 중복 방지·링크 이동/새로고침 경고·320/390/768/1280px 통과. 테스트 fixture의 누락 useCallback 및 잘못된 기간 응답을 수정했다. 새 helper/Workspace lint 통과; 페이지 기존 any/ref/effect lint 채무는 남는다. 비밀 환경 파일 없는 최종 사본 webpack57경로 통과, 합성390px 캡처 확인.
- 로컬 `http://localhost:3000/character`에서 사용자 확인 필요. 운영 DB 시험쓰기·스키마/RLS·API·버전·commit/push·배포 없음. 개발 서버 PID24068, 한설 정상 종료 후 개발 IRIS PID16040 실행·desktop/session/characters/stats200·시작 stderr0 확인. 실제 새 메뉴 표시/게임 연동은 사용자 확인 대기. 다음 IRIS 작업은 읽기 HUD 설계와 실제 조회 계약 검토다.

## 2026-10-12 KST 영겁 → 순월 — 인계 브랜치 공유 승인

- 한설이 인계 브랜치만 푸시하고 main은 유지하는 방향을 승인했다. 브랜치 `codex/iris-checkboard-classes`, 전송 안내 `docs/IRIS_SOONWOL_HANDOFF.md`. 아래 ‘원격 전달 대기/미승인’은 승인 전 경과다. 브랜치 HEAD 수신 후 순월이 ACK해야 수신 완료이며, 영겁이 대신 ACK하지 않는다.
- 이번 전달 후속은 **구조 변경 없음**. 새 버전/ZIP/운영 공지/DB·권한·게임 동작 변경 없음. 실제 앱 메뉴 확인·main 통합·HUD 첫 묶음 승인은 남는다. main만 pull하거나 예전 완료 작업을 반복하지 않는다.

## 2026-10-11 영겁 → 순월 — 이어받기 준비, 원격 전달 대기

- 한설이 이번 대화의 구현/검증/후속 설계 전체를 순월이 이어받도록 요청했다. 세부 인계와 남은 승인 경계는 `docs/relay/TO_SOONWOL.md`의 YG-20261008-001 최신 인계에 누적했다. 순월 ACK는 대기이며 영겁이 대신 기록하지 않는다.
- 로컬 브랜치 `codex/iris-checkboard-classes`, 구현 `6fd6d3d`, 회귀·5설계 `2d71996`. 새 인계 문서 커밋을 추가한다. **main 병합/원격 push는 아직 승인되지 않았으며 사무실 전달 완료가 아니다.** 기능/검증 결과는 아래 로컬 완료 항목 및 승인 계획을 기준으로 한다. 문서 인계만 추가했으며 기존 코드 시험을 다시 수행하지 않았다.
- 순월은 수신 후 기존 미커밋 변경을 보존하고 후보 브랜치/커밋 확인→ACK→실제 앱 메뉴 확인/통합 선택 확인→읽기 전용 HUD 설계·조회 계약 검토 순서로 이어받는다. 과거 완료한 크로노스/시낙시스/업데이트를 반복하지 않는다. 나머지 미래 설계는 보관용 검토안이며 일괄 구현 승인이 아니다.

## 2026-10-11 영겁 — IRIS 탐색 정리 로컬 완료·후속 설계 보관

- 한설이 기능 선택 설계와 직접 구현 계획을 승인했다. 기존 크로노스 7개 기능을 현재 기능 줄 + `기능 선택`의 3그룹으로 정리했다. 상위 메뉴·캐릭터·스탯/저장 경로·미저장 초안·보호 대기함은 유지한다. 계정/설정/잠금/캐릭터 전환 시 목록 닫힘, 바깥 클릭/Escape/초점 복귀, 짧은 높이의 목록 내부 스크롤을 검증했다.
- 최신 로컬 후보는 `codex/iris-checkboard-classes`. 첫 작업 커밋 `6fd6d3d`. **새 버전·ZIP·push·배포·공개 게시·운영 DB/게임 조작 없음**. 운영 제품은 아래 Beta0.2.2 그대로다. 사용자 기존 UPDATE_POST 수정·루트 문서 삭제/개인 파일은 제외하고 보존했다.
- 전체 Node 415개 중 412 PASS·3 skip·0 fail, 독립 tsc exit0, 격리 webpack build57 exit0 (`sanctum-iris-build-zHNLOM`). 새 기능 합성 브라우저 5그룹, 기존 SVG/확인창 브라우저 6그룹 PASS. 4폭·PC 글자 3단계·6테마·짧은 높이·클래스 초안 유지/불필요 IO0 확인. 밝은/어두운 390px 합성 캡처를 눈으로 확인했다. 실제 사용자 앱·게임·다른 PC 시험은 하지 않았다. 진입부만 조정한 다른 6개 기존 브라우저 엔트리는 이번에 전부 실행하지 않았으므로 PASS로 표현하지 않는다.
- 단일 최종 리뷰의 중요 문제(목록 높이가 실제 상단 위치를 무시)를 내부 스크롤만으로 재현한 뒤 남은 화면 높이 측정으로 수정했다. 실패→통과·최종 전체 검증 완료. 시험 두 개의 동일3011 포트 병행은 EADDRINUSE로 실패했으며 순차 재실행 통과, 제품 장애가 아니다.
- `docs/IRIS_FORWARD_DESIGNS.md`는 기존 비교표49항목을 읽기 HUD → 재고/레시피 → 생활 작업 → 음악/미디어 → 원격/공유의 5설계로 추적한다. 미래 설계는 보관용 미승인·미구현이며 게임 행동/운영 DB/외부 노출은 별도 승인이 필요하다. 다음은 읽기 전용 HUD 설계 검토와 실제 조회 계약 확인이다. 이미 완료한 상점/임무/시낙시스/업데이트를 다시 만들지 않는다.

## 2026-10-11 19:51 KST 영겁 — IRIS0.2.2 운영 확인 완료

- 코드48d5611b438d44207faab7d45a1f9384fd0acc5c main 일반push, Vercel sanctum Production dpl_DP47tvp3qsVdrzpomVmJarb5XrTu READY/동일SHA 연결 목록 확인. 운영 다운로드 Beta0.2.2·ZIP519982/SHA453d417129625d4c4af998627cdb8ac9a6a28c4dc5e8467532896c9077981f00 일치·7핵심GET200/authready·실제 패키지EXE HTTPSCheckAsync 신버전0.2.2 감지PASS. 캡처 iris-0.2.2-production.jpg.
- 수정/전체Node/tsc/build57/리뷰/표시UI/최종ZIP/helper실교체0.2.1→0.2.2/보호파일불변/정책success-crash-recover 확인 완료. 이전0.2.0/0.2.1 재실행만으로 연결 해결된다고 안내하지 말 것: 새ZIP전체수동1회 필요. 사용자 앱 대신 설치·게임조작·DB쓰기를 하지 않았다. 실제 사용자 최신ZIP 설치 후 재확인/다른PC·조직차단 원인 미확정은 남음.
- 공개 추가 게시0·글16/0.2.0 출시 이력 유지. 상세Vercel조회403/CLI없음→서버로그 스캔 미확인(목록READY/운영화면검증과 구분). 후속 문서 구조변경없음/IRIS0.2.2유지·unrelated dirty/미ACK 릴레이 보존. 새 기능/완료 기능 반복 금지.

## 2026-10-11 19:47 KST 영겁 — IRIS0.2.2 최종 후보 검증

- 한설 정상 종료 확인 후 최종 공개 ZIP 실제 원본helper/IRIS.exe/새 오프라인 WebView0.2.1→0.2.2 교체·ready PASS, 보호 큐/설정 파일 해시 불변(trial iris-update-live-893df12a67f74373b7ad73ab79e4cad8). 실제 최종 패키지 EXE 안 CheckAsync도 운영 HTTPS 신버전 감지 PASS; source별도 컴파일뿐 아닌 최종EXE 검증이다.
- native 정책·프로세스 success/crash/recover, 전체 Node 재검·tsc·최종 metadata 포함 분리webpack57 IeZhxx exit0. 아래 정상 종료/최종build 대기 해소, 이제 narrow diff/commit/mainpush→Ready→운영metadata/ZIP/hash/UI를 확인한다. 실제 사용자 설치본 교체는 하지 않았으며 0.2.0/0.2.1 수동ZIP1회 필요·보안차단 우회 금지 유지.

## 2026-10-11 19:43 KST 영겁 — IRIS0.2.2 업데이트 조회/스탯 핫픽스 후보

- 한설 승인: 세 가지 수정·검증 후 main push, 독립 IRIS0.2.2/SANCTUMv2.3 유지, 별도 공개 업데이트 글 없음. 이미 완료된 버스 기능은 재구현하지 않는다.
- 실제 .NET4-target EXE가 SSL3/TLS1.0 기본값으로 운영 HTTPS에서 SecureChannelFailure, TLS1.2 지정 시 HTTP200/신버전 확인. desktop-update.cs의 metadata/ZIP 공통 다운로드에 프로세스 내부 TLS1.2만 지정, 인증서 검증·OS 프록시·고정 URL·해시/allowlist 유지. CheckAsync 실제 회귀 RED(check_failed)→GREEN(available0.2.1 vs installed0.2.0).
- DesktopUpdater는 installed Beta 옆 check_failed 안내, 최신 버전 없으면 업데이트 버튼 없음. DesktopStats는 기존 score로 문자열/숫자 모두 쉼표 표시(94,282), 원래 데이터·저장 경로 불변. API/DB/RLS/권한/게임/보호 대기함 변경 없음.
- 중요 정정: 이전 0.2.1 기록의 “0.2.0 재시작 후 내부 갱신 가능”은 실제 HTTPS 탐지 검증 누락이었다. 실제 교체 시험은 오프라인 helper/WebView 검증이지 HTTPS 조회 증거가 아니었다. 연결 실패 구버전0.2.0/0.2.1은 정상 종료 후 최신 ZIP 전체를 한 번 수동 교체해야 한다. 보안/조직 차단을 우회하지 않는다.
- 후보 ZIP519982bytes SHA453d417129625d4c4af998627cdb8ac9a6a28c4dc5e8467532896c9077981f00, 10파일/manifest/icon/미서명·실제 ZIP 정책 검사 통과. 전체 Node/독립 tsc/회귀16/교차 리뷰 통과, 최종 공개 metadata 포함 빌드 및 0.2.1→0.2.2 실제 교체는 후속 확인. 현재 사용자 IRIS가 실행 중이라 native 시험 안전장치가 중단했으며 정상 종료를 요청했다. 강제 종료/시험 우회 없음.
- CUA 실제 React 합성390/320px 조회실패·최신버전 버튼/확인창·스탯 쉼표/가로넘침 없음 확인. 운영 시험 쓰기0. 직전0.2.1 코드b343f24/문서95c116f, Vercel dpl_6oLfLVDaYVXGweibwLBS1VwyN7qt READY를 기준으로 삼되 구버전 HTTPS 제한은 유지. unrelated dirty/개인삭제 및 미ACK 릴레이 보존. 아직 commit/push/운영 확인은 하지 않았다.

## 2026-10-11 19:21 KST 영겁 — IRIS0.2.1 운영 확인 완료

- 핫픽스 main b343f24956f53eb9b21fad22091dd529173f1376 push, Vercel sanctum Production dpl_Bad1AjApPg5ri5ukj5LVMRoyhwpK READY/동일SHA를 연결 도구로 확인. 운영 Chrome 다운로드 Beta0.2.1/링크/4단계/보안안내·desktop 일반브라우저 연결대기/편집방어 확인, 공개metadata·ZIP519786 SHA4f43cb87ff5a4c30100aa83b870c8b2bc60fb47df80b286b60b777f0a09fb13c 일치/핵심8GET200/authready. 아래 배포 대기는 해소.
- 현재 사용자 설치본 공개manifest0.2.0/updater1 읽기 확인; 다시 실행→새버전 버튼으로 내부 갱신 안내. 실제 helper/EXE0.2→0.2.1 격리 시험·보호파일 해시 보존과 업데이트 정책/success/crash/recover/최종Node·tsc·webpack57 모두 통과. 운영 버스 시험삭제/탈퇴0, 한설 실제 사용 재확인만 남는다. 앱/게임 대신 실행·강제종료·DB변경·공개추가게시0.
- 이 후속은 구조 변경 없음/버전 유지. 출시글16을 다시 게시하거나 HUD/기존완료 기능을 반복하지 않는다. 남는 회차완료/인계/이전확인 제한, unrelated dirty/개인삭제/미ACK 릴레이 보존.

## 2026-10-11 19:18 KST 영겁 — IRIS 0.2.1 길드버스 핫픽스 / 공개 준비

- 최신 한설 요청만 처리: 길드버스 해산/본인 캐릭터 탈퇴 무반응. `GuildBusCard` 두 핸들러가 native에서 꺼진 기본 confirm 대신 기존 surface.confirm/notify를 사용하며 확인 전 actionLock, 해산 async callback await, 결과/오류 안내를 적용한다. 웹 fallback과 기존 서버 소유권/권한·단일 leave payload 유지, DB/API/권한 변경 없음.
- 독립 IRIS0.2.1/최종 public ZIP519786 SHA4f43cb87ff5a4c30100aa83b870c8b2bc60fb47df80b286b60b777f0a09fb13c. 실제 원본 helper/EXE 오프라인 새 WebView 프로필 0.2.0→0.2.1 교체/준비·보호파일 해시 보존 통과. 한설 기존 앱 정상 종료 뒤 시험, 사용 중 IRIS나 게임을 강제로 종료하지 않았다.
- 회귀8/8 RED→GREEN·전체 Node·tsc·교차 리뷰 통과. CUA 실제 React 합성 390px 해산 취소/성공 및 탈퇴 Escape/성공/명단 갱신/재신청 안내·넘침 없음. fixture IO는 leave 단일 행동을 합성 명단에 반영하도록 보완했다. 운영 파티 생성/삭제/탈퇴 시험은 하지 않는다.
- main push 승인 있음, 별도 공개 업데이트 노트 금지. 기존 출시글16/0.2.0은 그대로 둔다. 배포 뒤 Ready/동일커밋/운영 다운로드0.2.1·ZIP 일치·IRIS 화면 읽기 확인을 기록할 것. updater 지원0.2.0은 내부 버튼으로 갱신 가능; 최초 미지원 앱만 수동 ZIP1회 필요. native 새 버전 조회 간격은30분이며 정상 재시작 시 조회한다.
- 회차 완료/관리자 인계/이전 요청 확인은 이번 범위 밖 기존 제한. unrelated UPDATE_POST_v2.151·개인삭제/메모/테마실험과 미ACK 릴레이를 보존한다. 되돌리기 기준dd227d6/dpl_7ASAXcAhXUWUk1kVVMwnHqoeJ9DY(READY), 낮은 native 버전 자동 설치는 허용하지 않는다.

## 2026-10-11 15:23 KST 영겁 — IRIS 출시글 게시 완료 / 다운로드 차단 진단 대기

- 정상 Chrome 관리자 계정 전환·작성 UI로 `IRIS Beta 0.2.0 출시!`를 한 번 게시했다. 운영 글16 `/kerygma?id=16`, 작성자 SANCTUM 시스템, IRIS 하위 탭 단일 목록 표시 확인. HTML 코드가 보이던 초안은 미게시 상태에서 교정했고, 에디터의 제목 도구로 7구역/테마 구분선과 문단을 적용한 실제 상세 화면을 확인했다. 직접 DB 쓰기·인증 추출·권한 변경 없음. 아래 게시 대기는 과거 경과이며 같은 출시글을 재생성하지 않는다.
- 작성창에는 IRIS 분류 선택 버튼이 없다. 현재 시스템 작성자·정규 출시 제목 기반 분류가 실제로 동작했다. 명시적인 작성 하위 선택 UI는 미구현; 한설에게 구조를 설명했다.
- 다운로드 “조직에서 차단함” 제보는 P1 접수. Chrome/Edge HKLM/HKCU 정책 경로 부재를 읽기 확인했지만 클라우드 정책·파일 평판/다른 보호 계층을 배제할 수 없다. 전날 성공과 새 ZIP/해시 변경을 원인 확정으로 해석하지 않는다. 차단 해제·다른 경로로 우회·보안 설정 변경은 하지 않았다.
- 제품 코드/버전/ZIP/push 변경 없음. 이번 결과는 로컬 문서에만 기록하며 이전 개인 dirty/삭제를 보존한다. HUD 신규 구현은 시작하지 않았다.

## 2026-10-11 14:30 KST 영겁 — IRIS0.2.0 main/운영 검증 완료, 게시 연결만 대기

- 코드44a958c 일반 main push→동일커밋 Vercel GitHub success, 운영 Chrome 다운로드4폭/버전/4단계/실제 ZIP519708bytes·SHA1ced8923c386f19c5892710d830c6b696f231aa6237bb38d23a7cd5b4f420cc7 일치. 핵심6경로200·healthready·guestIRIS2경로401, pageerror/제출0. 390/1280 화면 눈 확인. 직접 Vercel 로그/Ready 대시보드 관측 제한은 유지; 운영 파일·화면은 확인했다.
- 실제 native 두 버전 교체·준비 handshake/복구·보호 파일 해시 보존 및 전체 검증은 아래14:22와 RELEASE_NOTES를 따른다. 같은 크로노스/시낙시스나 updater를 다시 만들지 않는다. 최초 지원 ZIP 수동1회가 필요하고 현재 버전에는 업데이트 버튼이 뜨지 않는 것이 정상이다.
- 남은 공개 작업은 docs/IRIS_UPDATE_POST.md의 출시글 게시 하나다. 정상 관리자 브라우저 접근 도구가 kernel assets 오류로 실패, CDP포트없음. 원문은 준비 완료이나 실제 게시0/글ID없음. 복구 뒤 기존 IRIS 글 여부를 확인하고 중복 없이 수정/1회생성; 정상 인증경로만 사용한다.
- 읽기 조사 결과 docs/IRIS_CONNECTOR_COMPARISON_20261011.md 기능표/49항목/권리·정책·불확실성 기록. 생활커넥터 최신1.3.1/설치1.3.0, MobiWorks 최신·설치1.0.11, MoFo 설치metadata0.1.0/최신미확정. 외부 실행/자동화/계정정보 읽기 없음. 첫 후보는 미션·가공·환경·무게 읽기 HUD; 새 구현은 별도 지시 후 진행한다.
- 후속 문서 push는 구조 변경 없음/동일 버전 유지. UPDATE_POST_v2.151/개인삭제/테마 실험·IRIS 개인메모는 계속 제외, 기존 미ACK 릴레이 보존. 오래된 자동화 automation은 이전에 삭제됐으며 복구하지 않는다.

## 2026-10-11 14:22 KST 영겁 — 실제 native 시험 통과 / main 공개 준비

- 한설이 외출 중 기능 수정 없이 검증·main push·업데이트 노트 완료를 위임했다. 아래 실제시험 차단은 해소: Microsoft 공식 WebView 환경 옵션으로 시험 프로세스만 새 user-data+DNS 차단, 앱 코드는 그대로. 최종 공개 ZIP 자체를 실제 helper/IRIS.exe로 0.1.0→0.2.0 교체·WebView 준비 성공, 기존 Desktop 보호 파일/설정 전후 해시 동일. 테스트 스크립트의 OfflineIsolatedWebView 옵션과 fail-closed ID/경로 확인을 추가했으며 제품 코드 수정은 없다.
- 공개 패키지 준비: IRIS Beta0.2.0/519708 bytes/SHA1ced8923c386f19c5892710d830c6b696f231aa6237bb38d23a7cd5b4f420cc7. 동일 버전 manifest/metadata/helper10파일, 최초 지원 ZIP은 수동1회. 전체 Node·tsc·webpack57/대상lint·nativepolicy/host41/bridge·실프로세스3흐름·UI4폭/3글자/6theme 통과. 실제 게시/운영 확인은 아직 대기, 성공 전 완료로 기록하지 않는다.
- 계속 남는 연결 제한: CUA/NodeREPL kernel assets 오류, Chrome/Edge 및 msedgewebview2 remote-debugging port 없음. 관리자 세션을 추출하거나 직접 운영DB로 게시하지 않는다. 출시글은 docs/IRIS_UPDATE_POST.md 준비; Ready 후 정상 브라우저 연결로 기존 IRIS 글 조회/수정 또는1회생성. 서버 관측 MCP403/CLI없음 제한도 유지.
- 푸시 뒤 생활커넥터/MoFo/MobiWorks의 공식 자료·설치본 비교 보고서를 docs/IRIS_CONNECTOR_COMPARISON_20261011.md에 추가한다. 조사 범위는 읽기/브리핑, 게임 조작·외부 자동화·앱 기능 추가·DB 구조 변경을 위임받은 것이 아니다. 이전 개인 dirty/삭제·UPDATE_POST_v2.151·테마 실험은 커밋에서 제외한다.

## 2026-10-11 14:13 KST 영겁 — IRIS 0.2.0 출시 준비 / 게시 연결 차단

- 한설이 자동 업데이트 검증 후 main push와 기능 소개를 포함한 `IRIS Beta 0.2.0 출시!` 게시를 승인했다. `lib/irisRelease.ts`를 로컬 0.2.0 후보로 올리고 실제 0.1.0/0.2.0 native 패키지를 ignored build/iris-updater-verify에 준비했다. 공개 ZIP/download.json은 여전히 이전 배포 그대로다. commit/push/배포/게시/운영 DB 쓰기를 실행하지 않았다.
- docs/IRIS_UPDATE_POST.md에 따뜻한 출시 본문을 기능·이번 업데이트·시작4단계·보안/한계·피드백 절로 나눠 작성했다. 기존 IRIS 시스템 글이 있으면 이전 이력을 보존해 수정하고, 없다면 한 번만 생성한다. 정상 관리자 API, SANCTUM 시스템 작성자, Ready/운영 확인 뒤 게시 원칙 유지.
- `lib/kerygmaUpdates.ts`는 기존 고정 제목과 엄격한 `IRIS Beta x.y.z 출시!` 시스템 제목을 함께 인식한다. 해당 제목/잘못된 작성자·분류·버전·접미사 회귀4/4 및 다운로드·updater 관련 총12, 독립 tsc/diff check exit0. 기존 전체/native/UI/빌드 통과 범위는 아래 기록을 유지한다.
- 새 실제 release EXE 시험 스크립트는 sandbox AppData임을 확인하고 실제 사용자 설치/프로필을 건드리지 않는다. 두 번 모두 준비 단계 AtomicText/File.Move가 sandbox 접근 거부로 실패해 helper/실제 WebView 앱을 실행하지 못했다. 로그: sandbox 임시 iris-update-live-6556af943e3f4453855e8afd33891d23. 이는 실앱 업그레이드 성공 증거가 아니다. 기존 합성 success/crash/recover 3/3과 구분하며 새 실제 시험이 끝나기 전 무검증 설치 파일 공개를 진행하지 않았다. 일반/관리자 실제 사용자 AppData로 우회 실행하지 않는다.
- 게시 연결 차단: CUA와 Node REPL이 kernel assets 경로 오류, 초기화 재시도도 동일. 기존 Chrome/Edge 원격 디버깅 포트 숫자만 승인 조회했으나 없어 세션을 정상 재사용할 수 없었다. 쿠키/로그인 코드 추출·직접 DB INSERT로 우회하지 않았다. Vercel MCP403/CLI 미설치는 아래 기존 제한. 브라우저 연결 복구와 실제 격리 앱 시험 후 공개 패키지 교체→최종검증→문서/relay→main push→Ready/운영 확인→기존 글 조회/게시→ID·시간 기록 순서로 이어갈 것. 오래된 크로노스/시낙시스 완료 작업은 반복하지 않는다.

## 2026-10-11 영겁 — IRIS 내부 자동 업데이트 (로컬 후보, 미배포)

- 현재 작업은 크로노스/시낙시스 재구현이 아닌 native 자동 업데이트다. 오래된 `automation` 예약을 삭제했다. 아래 이전의 "설계 대기/새 updater 코드 없음"은 당시 기록이며 이 항목이 최신이다. 한설은 사용량 낭비를 지적하고 자동 업데이트만 우선 이어가도록 지정했다.
- `desktop-update-policy.cs`의 고정 HTTPS metadata/ZIP·엄격한 버전/파일 allowlist/hash/크기/내부 manifest 검증 → `desktop-update.cs`의 30분 조회 제한/단일 준비 → `desktop-update-install.cs`의 원본 백업/journal/원자 교체/별도 helper/재시작 handshake/실패 복구를 연결했다. 웹은 URL·파일 경로·명령을 넘기지 않는다. EXE와 `IRIS.Updater.exe`를 함께 빌드하고 ZIP10파일/버전 metadata를 만든다.
- 실제 설치된 native 버전 옆에 새 버전이 있을 때만 테마 강조 버튼. 확인·진행·노트·오류 표시, 보호 보관 실패/잘못된 입력/파티 쓰기 중 설치 차단. 다운로드 전 native 종료 방어를 켜고, 성공 시 프로세스 종료까지 버튼을 잠근다. 보호 대기함/프로필/로그인/게임/CLI/DB는 업데이트 파일 대상이 아니다.
- fresh reviewer Important2건을 회귀 테스트 RED→GREEN으로 수정: 추출 중 원본 변경을 새 baseline으로 수용하지 않음(원래 manifest digest 포함), 복구도 공통 queue mutex·live install 확인·journal 재조회 적용. helper 동작 중 중복 시작은 복구 journal을 덮어쓰지 않는다. Minor: 다운로드 시작 이후 취소는 현재 잠김; 시작 전 명시적 취소 가능, 후속 개선으로 보류.
- 검증: 전체 Node exit0, 독립 tsc/새 컴포넌트·store lint exit0, 격리 webpack57 exit0(`sanctum-iris-build-gr7ehJ`). native 정책/브리지/WebView/패키지 빌드 및 metadata 실제 추출 통과. 임시 실제 프로세스3개 흐름(success/crash/recover)에서 교체·재시작·rollback 확인(`iris-update-process-29131c41c5bc4fe1ab010badde9000e9`). UI4폭/PC3글자·native version·지원 없음·실패 보관·종료 방어·중복 클릭 합성 통과, 320px 캡처 눈 확인. 실제 사용자 앱/게임 종료·운영 DB 쓰기는 없음.
- 다음: 현재 공개 ZIP은 updater 없는 구형이고 그대로 유지했다. 최초 지원 버전은 수동 다운로드1회 필요하며 그 다음부터 내부 업데이트 가능. 실제 WebView 앱 두 버전 업그레이드/SmartScreen·권한 제한/다른 PC 검증과 공개 패키지 교체·버전 상승·push·배포는 아직 미실행. 지원 패키지 공개 시 `build-beta.ps1 -PrepareDownload`로 EXE/ZIP/download.json을 같은 버전으로 준비하고 웹 배포 성공도 확인한다. 내부 설계/계획/검증 기록만 갱신; 기존 unrelated dirty 변경과 개인 파일 삭제는 보존한다.
- 최종 보강: fixed update-note URL 검증41/41, 실제 startup PID/start/version handshake와 rollback 이후 거부, 실제 generated metadata/ZIP 재검 통과. 최종 UI는6테마 accent와 Escape도 확인(`iris-update-ui-fVGM7D`). 테마 전환 도중 색을 채집하던 합성 테스트는 animation을 fixture에서만 끄고 검증했으며 제품 애니메이션은 변경하지 않았다.

## 2026-10-11 영겁 — 케리그마 업데이트 하위 분류 / 실행 4단계 (로컬, 미배포)

- 한설 승인 후 생텀 업데이트 아래 생텀 업데이트/IRIS 업데이트 버튼을 추가했다. KerygmaCategoryTabs는 전역 테마·aria-pressed/키보드 포커스·2열로 표시하며 기존 선택/작성 권한은 보존한다. URL updates=sanctum|iris로 선택을 유지하고 기존 notices 목록만 필터한다. lib/kerygmaUpdates.ts는 정확한 IRIS 업데이트 노트/생텀 업데이트/SANCTUM 시스템 글만 IRIS로 판별하며 새 DB type/조회는 없다.
- numeric id와 note=iris 링크 유지, 글 읽기 후 해당 하위 목록 복귀·새로고침/뒤로가기·모바일 카테고리 선택/다른 분류 전환을 합성 검증했다. 기존 추출 navigation 테스트는 실제 판별 함수를 연결해 구형 전체목록 이동 회귀를 유지한다. IRIS 안내 테스트의 목록 복귀 기대를 새 승인 동선으로 갱신했다. 실제 공지 게시·운영 DB 시험 쓰기는 하지 않는다.
- 추가 사용자 피드백 반영: /iris/download 실행 안내는 AI 커넥터 켜기 → 압축 풀기 → IRIS.exe 실행 → 생텀 로그인 4단계다. 인게임 설정 게임 탭의 "마비노기 모바일 AI 커넥터 beta" 켜기 문구는 한설이 제공한 명칭/경로를 사용한다. 게임 설정을 대신 조작하지 않았다. 카드는 모바일1/태블릿2/넓은PC4열, 공개 ZIP/native는 보존한다.
- docs/IRIS_UPDATE_POST.md 초안을 두 하위 탭/4단계로 갱신했다. 앞으로 IRIS 실제 배포 확인 때 동일 IRIS 글 위에 버전 이력을 누적한다. 새 공개 글·배포·push·버전 상승은 없다.
- 최종 검증: 전체 Node 테스트 exit0, 격리 webpack57 exit0(sanctum-iris-build-0w9kUz). 독립 tsc/변경 대상 lint exit0, 실제 로컬 브라우저 하위 탭·URL/읽기 복귀·모바일 분류·키보드·4폭/3글자/6테마 통과(kerygma-updates-ZdCLaj), 다운로드/안내 기존 동선·4단계/4폭/3글자/6테마+사용자 지정·ZIP hash 통과(iris-download-page-Zwup38). 320px 하위 탭과 390px 실행4단계 캡처 눈 확인, diff check 통과. 기존 Kerygma 전체 lint12오류/4경고는 이번 변경과 별개로 유지한다. 운영 게시·실앱 재시작/DPI 확인을 완료로 주장하지 않는다.
- 다음 요청(설계 대기): IRIS 설치된 native 버전 옆에 새 버전이 있을 때만 강조된 업데이트 버튼을 보여주고 사용자 클릭으로 내부 다운로드/파일 교체/재시작. 현 native는 고정 운영 웹 화면을 읽고 실행 파일 자동 업데이트는 없다. 현재 download.json에는 native 버전 필드가 없고 웹 IRIS_VERSION_LABEL은 설치 버전이 아니다. 별도 helper/신뢰된 배포 확인/보호 큐 보존/실패 복구 설계를 승인받은 뒤 구현해야 한다. 새 updater 코드는 아직 없다.

## 2026-10-11 영겁 — 상단 IRIS 도구 / 첫 안내 오버레이 (로컬, 미배포)

- 한설이 홈 다운로드 카드 대신 상단 날개/테마/알림/IRIS 2×2 배치를 승인했다. 홈 카드 호출 및 신규 임시 IrisDownloadEntry 파일은 제거했다. Navbar의 IRIS 링크는 테마 accent 배경/대조색 원본 SVG/정적 광원, /iris/download 이동이다. 네 버튼은 모바일에서도 동일 크기이며 테마 버튼도 보인다. 기존 전역 메뉴·알림·계정 권한은 유지한다.
- header ResizeObserver의 기존 측정 결과를 --sanctum-header-height로 전달해 날개/알림/계정 메뉴가 두 줄 도구 아래에 열린다. 계정 메뉴 겹침은 320px RED→GREEN으로 보완했다.
- 로그인 확인 완료 계정에만 IrisWelcomeGuide native dialog를 띄운다. 로컬 계정 프리셋만으로 열지 않고 기존 session GET의 확인 ID를 재사용한다. 추가 조회 없음. 계정별 이 브라우저에서 한 번 안내하며 Esc/바깥 클릭/명시적 닫기/다운로드 이동 시 완료를 로컬에 기록한다. 원본 버튼 강조/화살표, 테마 안내/키보드·배경 조작 차단/스크롤 복원·좁은 화면 내부 스크롤을 적용한다.
- 교차 리뷰 5건 보완: 계정 메뉴 하단 정렬, 늦은 배너 때 nav 관찰/강조 이동, 로그인 GET 확인 전 안내 방지, 숨은 헤더에서는 안내 유예/전환 완료 후 측정, 로그아웃 때 sync generation 무효화로 늦은 로그인 응답이 계정을 복원하지 않기. 모두 좁힌 RED→GREEN, 최종 리뷰 새 차단 문제 없음. 브라우저 fixture의 첫 RAF 대기 경계는 요소 표시를 기다리도록 수정했다.
- 한설이 실화면 도구/안내 정상 노출을 확인했고 × 대신 닫기를 요청해 반영했다. 후속 승인: IRIS 독립 Beta 0.1.0/같은 케리그마 글 최신 상단 누적. lib/irisRelease.ts의 버전/제목/정규 링크를 애드온 제목·다운로드·안내에 공유한다. 안내 키는 버전+계정이며 예전 v1 완료 기록은 새 버전을 막지 않는다. 옆 노트 버튼도 완료 처리한다. /kerygma?note=iris는 기존 목록에서 정확한 시스템 제목/분류/작성자 글을 열고, 미게시/조회 실패 시 안내·다운로드 우회 링크를 보인다. 숫자 id 경로는 유지한다. 추가 목록 조회/DB 변경 없음.
- docs/IRIS_UPDATE_POST.md는 고정 제목·단일 글 누적·게시 순서와 Beta 0.1.0 공개 본문 초안이다. 아직 글 ID/게시 시각이 없고 공개 게시하지 않았다. main 배포 Ready 및 운영 실화면 확인 뒤 기존 관리자 공지 API로 최초 게시 또는 같은 글 수정, 실제 ID/시간을 기록해야 한다. 임의 글 ID/기존 생텀 글 재사용 금지. 안내 버전은 웹 애드온 식별이며 기존 ZIP을 새 빌드처럼 재표기·재생성하지 않는다. SANCTUM은 v2.3 유지.
- 독립 버전 후속 검증: 애드온 버전 미표시/구형 안내 완료로 새 안내 없음/정규 링크 미게시 안내 없음 RED 후 GREEN. 전체 Node·독립 tsc·신규 버전/제목/다운로드/안내 lint exit0, 격리 webpack57 exit0(sanctum-iris-build-Myr6L6). 최종 실제 로컬 브라우저 4폭/3글자/6테마+사용자 지정·두 CTA/동일 버전 재안내 없음·미게시/조회 실패 구별·일반 동명 글 제외·정규 시스템 글/숫자 링크/목록 복귀·ZIP hash 통과(iris-download-page-AcNb3j). 애드온 제목 합성 4폭/3글자/6테마 통과(iris-brand-header-3GK0NZ); 320/390 안내 및 애드온 캡처 눈 확인. 읽음 POST는 기존 Reader 동작으로 합성 글991에만 허용, 운영 HTTP/외부 WS 차단. 의도적 실패의 Next dev stack 조회는 개발 진단 요청으로 구분한다. 좁힌 교차 리뷰 새 결함 없음. Kerygma 전체 lint는 HEAD와 현재 모두 기존12오류(any9/set-state-in-effect3)·4경고(exhaustive-deps1/unused3)로 규칙별 개수 동일하며 해결 완료로 주장하지 않는다. 실제 운영 게시/배포/native 재시작·DPI 검증은 미완료다.
- 마지막 UI 보완: 여유 폭에서도 두 CTA가 세로로 내려가는 390px RED를 확인하고 반응형 2열 grid(360px 미만 1열)로 수정했다. 최종 전체 Node·독립 tsc·신규 대상 lint와 4폭/3글자/7테마·모든 안내/공지 이동 회귀 exit0(iris-download-page-dMyVSz), 390px 밝은 안내 두 버튼 나란히 눈 확인. 최종 격리 webpack57 exit0(sanctum-iris-build-8uXJTC). 내용/권한/배포 파일 영향 없음.
- 최종 전체 Node·독립tsc·변경된 신규 TSX/알림 대상 lint·분리 webpack57 exit0, 실제 로컬 4폭·6테마+사용자 지정·3글자·안내4폭·Esc/바깥/다운로드 뒤 재노출 방지/지연 인증·배너·스크롤·로그아웃·ZIP hash 통과. 최종 캡처 iris-download-page-7lZvml, 빌드 sanctum-iris-build-9ljBSJ. 320 안내/1280 헤더와 이전390 밝은 안내 눈 확인. 합성 API/외부 WS 차단, 테스트 로그아웃 POST는 fixture에서만 응답하고 실제 운영 쓰기는 없다. 별도 날개 컴포넌트 lint의 기존 favicon img 경고1개는 유지한다. 초기 tsc에 포함된 ignored build 검증 사본의 구형 Navbar 호출은 새 optional 검증 ID(미제공 시 안내 없음)로 호환하며 tsconfig/사본을 수정·삭제하지 않았다.
- ZIP/metadata/native/DB/SQL/권한·SANCTUM 버전·commit/push/배포/공지 게시 변화 없음. 현재 확인은 http://localhost:3000/ 상단과 /iris/download, /iris/desktop 제목, /kerygma?note=iris. 아래 홈 카드 작업 기록은 이전 경과다.

## 2026-10-11 02:37 KST 영겁 — 홈 IRIS 진입 / 다운로드 안내 개선 (로컬, 미배포)

- 후속 사용자 승인: 유료 서명 없이 무료 미서명 베타 유지 및 사용자 선택/보안 주의 문구를 다운로드 화면에 반영했다. 이어서 한설의 컴팩트 카드 승인 후 로고/제목/소개/여백을 축소하고 큰 전체 폭 CTA를 작은 우측 버튼으로 바꿨다. 폭이 부족하면 버튼만 다음 행 우측으로 배치하며 제목/글자는 숨기지 않는다. 파일·DB·배포 변화 없음.
- 컴팩트 후속 검증: 기존320px 전체 폭 버튼을 브라우저 검사로 RED 재현 후 수정, 320/390/768/1280·PC18/20/22·6테마+사용자 지정에서 버튼 폭/카드 높이/넘침0/테마/이동/ZIP hash 통과. 전체 Node·독립tsc·대상 lint exit0, 홈390/1280 캡처 눈 확인(iris-download-page-IIebMX). 문구만 바뀌어 실패하는 기존 정적 테스트 단어 검사는 제거했고 다운로드/유효성/확인값 계약 검사는 유지한다. 이번 작은 UI/문구 후속에서 빌드를 다시 실행하지 않았으며 앞선 전체 디자인의 격리빌드 결과와 구분한다.
- 한설의 짧은 디자인 승인 후 홈 상단 위젯 아래 IrisDownloadEntry를 추가했다. app/iris/download/page.tsx는 소개/다운로드/실행3단계/항상 보이는 보안·버스 우회 안내/선택적 details 설명으로 재구성했다. IrisBrandMark는 기존 SVG를 테마 accent 마스크로 재사용한다. 별도 상태·조회·설치/자동 업데이트 기능은 추가하지 않았다.
- 최종 실제 로컬 브라우저: 홈 버튼→다운로드 이동, 확인값 기본 접힘·Enter 펼침/닫힘, 보안/웹 시낙시스 링크 노출, 두 화면 320/390/768/1280·PC18/20/22·6테마+사용자 지정, 펼친 긴 확인값 넘침0, CTA/배지 대비4.5 이상, 실제 ZIP hash 일치 통과. 다운로드3/전체Node·tsc·신규TSX lint·격리webpack57 통과, 최종 사용자 지정 배경 수정 후 전체Node/격리webpack57도 exit0. 밝음/어두움/모바일·홈 카드 캡처 눈 확인, 독립 좁힌 리뷰 잔여 지적 없음. 최종 캡처 iris-download-page-Ax4dol, 빌드 sanctum-iris-build-OOdtxM.
- 검증 보완: 초기 HTTP 응답 대체만으로 Realtime 차단을 보장하지 못했다. 최종 테스트는 운영 HTTP/API 응답 대체·외부 소켓 차단, 로컬 Next HMR만 허용한다. 모든 소켓 차단 시 Turbopack hydration 미시작을 진단했고 테스트 설정만 수정했다. ELYSIUM 작은 배지3.89 대비 RED→주요 글자색으로 GREEN, 전역 테마 값/제품 동작은 보존한다.
- 사용자 지정 밝은 테마는 layout이 accent-soft를 덮어쓰지 않아 배지 대비1.22를 추가 RED 재현했다. 이 화면의 배경만 accent12%/panel88% 혼합으로 바꿔 GREEN, 전역 설정은 변경하지 않았다. 브라우저 color(srgb)0~1 반환도 검증기의 대비 계산에 반영했다.
- ZIP/metadata/native/DB/SQL/권한·버전·commit/push/배포/공지 변화 없음. 기존 개인 삭제·메모·UPDATE_POST·테마 실험 변경은 유지한다. 확인 경로 http://localhost:3000/ 및 /iris/download, 실제 운영 페이지는 기존 v2.3 디자인 유지. 이후 한설의 명시적 push 요청 전에는 배포하지 않는다.

## 2026-10-11 02:18 KST 영겁 — v2.3 IRIS 베타 공개 다운로드 운영 확인

- 코드2b9067e main 일반push, Vercel dpl_Bk8w2ww62gSTqaXaqLHbkEYV5cVt Ready/Production/28초/동일commit/운영도메인 직접확인. https://sanctum-tawny-three.vercel.app/iris/download 공개 안내와 최종ZIP431067bytes/SHA77a87c1f87e6eab4aa41daf803292ff11e20b398811a316525cacef263145b87 GET200 일치. 공개9화면200·health ready=true·IRIS 비로그인401, 실제부마스터 `/party` 공용화면 표시·관찰콘솔0.
- 추가설치는 필수가 아니며 한설PC 기존WebView2·CLI 읽기확인, 공식안내대로 대부분PC 추가설치없음/없다는오류만공식Runtime. 미서명/다른PC/장시간/native 정상재시작·운영실시간/쓰기미검증·일부버스확인창 웹우회 제한은 유지. 운영DB/SQL/권한/공지게시0. Vercel team403/CLI없음 때문에 서버로그/drains미점검; Ready는 브라우저 기존세션으로 확인.
- 문서후속커밋은 배포확인만·구조변경없음. 아래 로컬/공식후보 미배포 표기는 과거경과로 보존한다. 개인삭제3개·UPDATE_POST_v2.151·개인실행메모·테마실험은 계속로컬보존/미포함. 다음은 정상종료→배포EXE실행 및 다른PC테스터 확인, 버스기본대화상자 잔여이식이다.

## 2026-10-11 02:14 KST 영겁 — v2.3 최종 후보 검증 후속

- 02:15 후속: 최종안내 반영 후보 독립tsc/webpack57 exit0, 실제공개ZIP9파일/모든manifest SHA/EXE NotSigned 확인. 아래 최종빌드대기는 해소, 커밋/main/Ready/운영실화면 확인은 다음 단계다.

- 한설의 추가 설치 질문에 로컬 WebView2/게임CLI 존재를 읽기 확인하고, 다운로드/ZIP 설명을 대부분 추가설치 없음·Runtime 없다는 오류 때만 공식설치·기존 게임커넥터 재사용으로 명확히 했다. 최신 ZIP431067bytes/SHA77a87c1f87e6eab4aa41daf803292ff11e20b398811a316525cacef263145b87, 기존23:32/23:45 후보hash는 과거기록.
- 정확한 staged 사본 전체Node·독립tsc·격리webpack57 exit0, 최종안내 download3/4폭hash 통과; header·Synaxis·partycontrols 합성 및 nativehost36/startup/store/workspace/WebView 통과, credential-pattern/diff 확인. 최신 안내의 최종빌드·main push/운영확인은 아직 확인 중이며 완료 후 기록한다. Windows tar 한글경로 실패를 ZIP 추출로 대체해 정확한자산 확인, 제품문제 아님. 개인삭제/메모/UPDATE_POST/테마실험 보존, DB/공지변경0.

## 2026-10-10 23:45 KST 영겁 — v2.3 IRIS 베타 공식 배포 준비

- 한설이 main 푸시·공개 배포 진행을 승인했다. v2.3 기능 묶음으로 누적 IRIS 크로노스/시낙시스/브랜드/다운로드 및 앞선 별표 개선을 노트에 통합한다. 로컬 개인 삭제3개·개인 실행 메모·UPDATE_POST_v2.151 무관한 편집·테마 실험 파일은 제외/보존. SQL/DB/권한 변경·운영 시험 쓰기·공지 게시 없음.
- 원격 main ff-only pull 최신. Vercel MCP team403/CLI없음, 기존 GitHub 브라우저 로그인으로 동일 sanctum/team/HS-Sanctuary 저장소 확인; 현재 production da1738e/dpl_734XzqaoK6MvTwrZLnMitjxm5E8w Ready·운영 도메인을 롤백 기준으로 기록했다. 새 배포/최종 후보 검사·운영 확인은 완료 뒤 후속 기록할 것.
- 미서명 후보ZIP와 기존 원본 PNG/SVG·생성ICO 공개를 승인 범위에 포함한다. native/웹 기본 대화상자 잔여 경로는 웹 `/party` 우회가 필요한 알려진 제한이며 전체 컨트롤러 실사용 완료로 과장하지 않는다. 다른 PC/장시간/SmartScreen과 정상 재실행 확인은 남긴다.

## 2026-10-10 23:32 KST 영겁 — IRIS 브랜드와 베타 후보 다운로드

- DesktopTitlebar 제목 앞 SVG currentColor 마스크·창2버튼, DesktopContextActions 계정→운영홈→설정은 DesktopCenter contextActions 슬롯/비로그인 도구행. 긴 이름 보호로 폭 부족 시 도구 우측 다음행, 기존 패널 서로 닫기/큐/권한 유지. 운영홈 NewWindow는 ValidateHomeExternal 고정 source/production root/질의·fragment 금지/user-click 정책으로 제한한다.
- 원본 public/IRIS/logo PNG/SVG 보존, generated IRIS.ico(16/24/32/48/64/128/256)·개발PS 트레이/창/배포EXE. iris/desktop-release.cs production-only WinExe, 동일 사용자/profile·공통 큐 mutex 및 DPAPI store 재사용. 초기화 실패는 편집 문서가 없을 때만 AbortUninitializedStartup으로 종료하고 정상 세션은 보호한다.
- iris/build-beta.ps1 -PrepareDownload로 public/IRIS/downloads/IRIS-beta.zip(430771bytes)/download.json·source ico, /iris/download 서버 정적manifest import 안내·기존 /iris 진입 링크. 패키지9파일만(EXE/ico/SDK3파일/license/notice/readme/manifest), CLI·소스·SDK개발파일·비밀값·프로필/큐 제외. ZIP sha256 fc378ffc9cb24e4de1886254d1abaec93caa57eff171077ada3c918407dd3ef0. 미서명 후보이며 외부 공개 완료로 보고하지 않는다.
- 최종 전체Node·tsc·대상lint·격리webpack57 exit0, 헤더4폭/3글자/6테마·계정회귀·다운로드4폭+로컬HTTP/ZIPhash·패키지allowlist/icon/hash·nativehost36·합성WebView2·임시store 시작실패닫기/ready세션 보호 GREEN. 독립 리뷰 제품지적 해결/테스트nullstore 보완. /iris/download 로컬 확인 가능.
- 남음: 실제 native 정상 종료/재실행(새 홈 allowlist/아이콘 적용), 다른 PC/런타임 미설치/SmartScreen/장시간; 운영 main 푸시/Vercel실화면/공개다운로드·공지. 현재 사용자 앱/개발서버 유지, SQL/DB·운영쓰기·버전·commit/push 없음. EXE는 현재 운영 웹을 읽으므로 최신 웹 UI/API는 해당 배포 후에만 적용된다.

## 2026-10-10 22:59 KST 영겁 — IRIS 전체 스크롤바 테마

- 한설 승인으로 desktop.css에 :root:has(.iris-desktop) 문서/자손 범위의 테마 scrollbar를 추가했다. 포털과 미래 overflow도 포함, 웹 페이지는 IRIS root 제거 시 비적용. accent/text-sub 혼합 thumb·panel track·둥근 .65rem rail·hover/active accent, forced-colors native fallback. DB/권한/저장/native 정책/push 없음.
- 신규 실제 CSS 합성 검사 RED→GREEN:6테마 고유색, 문서·중첩·본문 포털, 휠, 고대비, IRIS 제거 후 비적용. 기존 간격3·전체 Node·tsc exit0. 실제 IRIS WebView 사용자 확인 대기, 기존 개발 서버 유지.

## 2026-10-10 22:53 KST 영겁 — IRIS 칸 사이 여백

- 한설 승인 후 desktop.css의 control/group 간격 토큰(.4/.7rem), 숙제 필터·2열 칸·분류 간격을 조정했다. desktop-synaxis-surface.css는 툴바 grid 간격(.6rem)과 검색 필터(.45rem)만 조정한다. 행/참가 카드 높이·전체 문구·마크·저장/권한은 보존한다.
- 신규 간격 합성3·메뉴6·파티 조작8, 전체 Node·tsc·격리 build56 exit0. 최초 회귀 브라우저 실행은 sandbox localhost 접근 거절로 실패, 연결 허용 재검 통과. 독립 좁힌 리뷰 지적 없음. 실제 새 간격 사용자 확인 대기, 기존 서버 session89595 유지. DB/운영 쓰기·버전·공지·push 없음.
- 큰 글자에서 참가 카드가 길어지는 기존 줄바꿈은 유지하며, 이번 변경 전 툴바 배치와 높이가 동일함을 검사했다. 합성 IO 검증을 운영/게임 전체 검증으로 확대하지 않는다.

## 2026-10-10 22:18 KST 영겁 — IRIS 메뉴 계층 / 가방·레이드 마크 / 취소 위치

- 한설 승인대로 상위 두 기능은 넓은 직접 탭·채워진 선택 배경·문양, 하위 기능은 기존 작은 테두리 강조다. 사용자 추가 지정으로 크로노스 가방/시낙시스 레이드 SVG를 사용한다. 원본 viewBox/실제 경계를 측정해 메뉴 전용 currentColor 마스크의 크기/중심만 보정하며 공용 자산은 보존했다. 새로운 숨김 메뉴/미구현 기능은 없다.
- DesktopCenter/DesktopIcons/desktop.css 표시 변경, DesktopStatsConfirmation의 네/아니요/취소 버튼을 같은 행으로 묶고 취소를 아니요 오른쪽에 배치했다. 선택 모드·콜백·초점/Escape/바깥 클릭·진행 중 잠금·하위 탭 기억·레드닷 계약은 유지한다. DB/API/권한/네이티브/보호 큐 변경 없음.
- TDD: 아이콘 부재/별도 취소 행 및 밝은 테마 글자 대비를 RED 재현 후 GREEN. 교차 리뷰 Critical/Important 없음; 비선택 글자 대비 Minor는 실제 계산 확인 후 text-main으로 수정했다. 실제 React/CSS/SVG 합성6시나리오 exit0,6테마 글자 대비4.5 이상·320/390/768/1280폭·PC18/20/22 글자·메뉴 기억/쓰기0·확인창 초점/콜백/버튼 잘림0. DPR3 문양 픽셀 경계는 두 마크 모두16/17.33/19.33px 정사각으로 일치(글자18/20/22), 어두움/밝음 캡처 눈 확인. 캡처 iris-navigation-B6y7TH.
- 최종 tsc/3컴포넌트 ESLint exit0, 분리 production webpack56경로 exit0(sanctum-iris-build-BZiSPN). 전체 Node 최초392중388pass/1fail/기존3skip: 기존 bus-live-notifications의 `duplicate full events stay quiet but a fresh readiness episode and next round notify again`에서2!=3. 해당 파일25/25 단독 통과·동일 전체 dot 재검 exit0. 현재 UI와 무관한 고정 테스트 시계/난수 알림 ID 충돌 가능성은 피드백에 별도 기록했으며 알림 제품 코드/테스트를 이번 UI 작업에서 수정하지 않았다.
- 확인 경로: 실행 중 개발 IRIS 또는 http://localhost:3000/iris/desktop → 상위 가방/레이드 메뉴 구분 → 크로노스/스탯의 적용 확인창에서 아니요 오른쪽 취소. 실제 새 UI 사용자 확인은 대기이며 테스트의 운영/게임/스탯 쓰기는0이다. 사용자 서버session89595와 미저장/기존 대량 dirty 변경 유지. commit/push/버전/배포/공지 없음.

## 2026-10-10 21:04 KST 영겁 — IRIS 일반 파티 탈퇴·강제 삭제 / 카드 컴팩트

- 사용자 확인 후속 — 21:33 KST: 한설이 실제 IRIS 탈퇴·관리자 강제 삭제·컴팩트 카드와 결과 안내 정상 확인을 전달했다. 아래 실제 사용자 확인 대기는 이 범위에서만 해소한다. 다음 요청은 상위 메뉴 계층 시인성·스탯 확인창 취소 버튼 오른쪽 배치이며 짧은 디자인 승인 전 제품 변경 없음.
- 한설 승인으로 일반 파티의 기본 confirm 의존을 IRIS 자체 확인창·화면 결과 안내로 대체했다. PartySurfaceContext 선택적 confirm/notify → DesktopSynaxisSurface, usePartyManager 탈퇴·PartyCard 관리자 삭제 연결. 취소/Escape/바깥 클릭/화면 비활성은 요청0, 중복 제출 방어·성공 후 목록 재조회. 웹은 기존 기본 대화상자를 유지하며 생성 관리자 노출·소유권/운행자·서버 권한은 그대로다.
- 참가 시간 수정 API는 추가하지 않았다. 탈퇴 뒤 가입 신청에서 새 시작/종료 시간을 선택하는 기존 경로를 복구했다. UI 변경은 PartyCard 의미 클래스 + IRIS 범위 CSS: 이름/역할/전투력/마도저항/시간 보존, 캐릭터 높이 축소·빈 슬롯 약49px. 일반 웹 레이아웃은 유지한다.
- 비동기 확인 대기 중 새 참가자가 가입하면 이전 members로 덮어쓰던 P1을 교차 리뷰·합성 RED로 재현했다. 승인 후 maybeSingle 최신 행을 비교해 변경/삭제 시 쓰기 없이 재조회·재확인을 안내한다. 최신 조회 직후 실제 쓰기 사이 서버 원자 CAS는 기존 API의 미해결 한계다.
- 최종 검증: tsc exit0; 전체 Node392/389pass/0fail/기존3skip; 분리 production webpack56경로 exit0(검증 사본sanctum-iris-build-6e9DjS). 실제 React 합성 브라우저8시나리오 exit0(캡처iris-party-controls-J8yWVv,320/390 눈 확인); 기존 전체 시낙시스 합성 가입/매칭/버스 수정/레드닷/달력/4폭/PC3글자 exit0. 교차 리뷰 P1 수정 재검토 후 새 Critical/Important 없음, 삭제된 행의 single 오류 Minor도 maybeSingle로 보완했다.
- 실제 사용자 확인: 개발 IRIS → 시낙시스 → 일반 파티에서 탈퇴 확인창/컴팩트 카드, 관리자 강제 삭제 확인창을 확인한다. 실제 운영 탈퇴/삭제는 Codex가 시험하지 않았다. 현재 사용자 서버session89595는 유지한다. UI가 옛 상태면 미저장 기록을 보존한 정상 새로고침/재실행만 안내한다.
- 미완료 후속: 기존 버스·매칭·unknown 복구에는 여전히 native confirm/alert 경로가 남는다. 전체 시낙시스 실사용 완료로 보고하지 말고 같은 표면 확인/안내 계약으로 후속 점검한다. DB 구조/RLS/권한·네이티브 dialog 설정·운영 데이터 시험 쓰기·commit/push/버전/공지 없음. 기존 대량 미커밋·개인 삭제 보존.

## 2026-10-10 20:39 KST 영겁 — IRIS 개발 서버 연결 복구

- 사용자 IRIS `localhost` 연결 거부 제보. 일반 실행 환경에서 3000번 수신 없음과 직접 GET 연결 거부 확인. 실행 중 Node는 Codex 도구 런타임이었고 프로젝트 서버는 없었다. 기존 서버가 왜 종료됐는지는 미확정.
- 프로젝트 `npm run dev -- --port 3000` 재실행(session89595), Ready760ms·`/iris/desktop` HTTP200 확인. 이 서버는 사용자 개발 IRIS용으로 유지하며 검증 helper처럼 종료하지 않는다. 기존 IRIS/게임 강제 종료·데이터/코드 수정·DB/배포 없음.
- 다음 사용자 행동: 연결 오류 화면 왼쪽 아래 `새로 고침` 한 번. 실제 IRIS 화면/시낙시스 동작은 사용자 확인 대기.

## 2026-10-10 14:00 KST 영겁 — IRIS 시낙시스 전체 공용 화면 로컬 후보

- 구현 완료·미배포: 일반 파티/운행 예정·운행 중 길드버스 목록, 본인 계정의 다른 캐릭터 가입·탈퇴·스마트 매칭, 기존 버스 생성/수정/가입/운영 컨트롤러를 공용 `SynaxisSurface`로 연결했다. 생성은 관리자에게만, 운영은 현재 운행자에게만 노출하며 서버 권한 검사를 유지한다.
- 설계/계획: `docs/superpowers/specs/2026-10-10-iris-synaxis-full-design.md`, `docs/superpowers/plans/2026-10-10-iris-synaxis-full.md`. 기존 SANCTUM 카드·모달·엔진을 재사용하며 웹 `/party`도 같은 화면의 웹 기본 동작을 사용한다. 날짜 달력, 본인 캐릭터 레이드/어비스 완료 확인, 어비스 매우 어려움·레이드 최고 유효 난이도 기본값을 연결했다.
- 신규 개설 자동 반영/레드닷: 로그인 계정당 Realtime 채널 하나를 사용한다. 숨겨진 화면은 목록을 읽지 않고 새 이벤트와 점만 보관한다. 다시 활성화하면 조회하고 실제 불러온 행만 읽음 처리한다. Realtime/DB 구조·RLS·권한 설정 변경 없음.
- 쓰기 보호: `expectedAccountId`, 본인 캐릭터 소유권·운행자 권한, 중복 제출 방어, 계정별 초안과 결과 불명 대기 기록을 유지한다. 요청은 20초 제한 뒤 잠금을 해제하되 결과 불명 기록을 보존하며 자동 재전송하지 않는다.
- 독립 리뷰 후 수정: 비활성 버스 수정 포털이 다른 모달 위에 남는 문제, 활성화 중복 조회, 처음 열린 목록의 점이 남는 문제를 재현 후 수정했다. 중첩 달력 Escape/초점·바깥 클릭, 좁은 버튼/긴 닉네임·작은 안내 글씨를 함께 보완했다.
- 최종 검증: `npx tsc --noEmit` exit0; 전체 Node392개 중389 통과/0 실패/기존3 제외; 분리 production webpack56 routes exit0. 실제 React/Tailwind/CSS 합성 브라우저에서 가입·매칭·카브락→에이렐 수정, 숨김 조회0, 레드닷, 권한 UI, 320/390/768/1280 및 PC 글자18/20/22 검증 통과. 가로 넘침/버튼 글자 잘림/브라우저 오류0.
- 제한/인계: 브라우저 테스트는 HTTP/DB IO를 합성한 검증이며 실제 운영 파티 쓰기·게임/DPI·운영 Realtime 수신은 미시험이다. 운영 DB 쓰기·게임 조작·커밋·push·버전 상승·공지 게시 없음. 기존 대량 미커밋 변경과 개인 파일 삭제를 보존하며 전체 staging 금지.
- 사용자 확인: IRIS → 시낙시스에서 두 목록, 다른 본인 캐릭터 가입 선택, 달력·관리자 컨트롤러를 확인한다. 이전 Fast Refresh 상태가 남으면 미저장 기록을 보존한 채 IRIS만 정상 종료/재실행한다. 웹 회귀 확인 경로 `http://localhost:3000/party`.

## 2026-10-10 12:51 KST 영겁 — 물물교환 즐겨찾기 한정 배포

- 로컬 후속 확인(다음 공식 push에 포함): 문서 da1738e / Vercel 734XzqaoK6MvTwrZLnMitjxm5E8w Ready·Production 확인. 검증 도중 브라우저 계정 한설→뉴월 변경 후 이전 한설 탭의 수동 GET은 403(12:56:00 서버 기록), 새 뉴월 페이지 초기/수동 재조회 모두 정상 안내·관찰 콘솔0. 계정 불일치 보호 동작이며 권한 완화/자동 다른 계정 가져오기 금지. 계정을 다른 탭에서 바꿨으면 기존 탭 새로고침 안내. 가져오기/별표 시험 POST0, 최종 운영 화면 캡처 보존.

- 운영 확인 — 2026-10-10 12:55 KST: main 62bd6786b4d792b141159cdcc740d34727b3fe9d, Vercel dpl_PWxBfDz2QPfKUbHmhrYiM7cRfD45 대시보드 Ready/Production/Current·운영 도메인·동일 커밋 확인(27초). 실제 Chrome 한설 /character?char=순월에서 계정 공통 즐겨찾기 정상 안내·저장된 앨빈 별표·기존 브라우저5개 가져오기/본인 확인 전 비활성 버튼·관찰 콘솔 error/warn0 확인. 공개 핵심5경로 GET200·health200 ready true·새 API 비로그인401. 실제 별표 POST/가져오기·IRIS 운영 동시 저장은 미시험, 사용자 조작으로 확인할 것. 버전 상승/공개 공지/추가 SQL 없음. 후속 기록은 구조 변경 없음.

- 한설이 기능만 main에 적용하고 버전/공개 업데이트노트는 다음 묶음에 통합하도록 지정했다. v2.21 유지·새 공지 없음. staged 소스 10개와 관련 내부 문서만 포함한다. 기존 미커밋 IRIS/native·상점/임무·시낙시스·개인 삭제는 보존하고 제외한다.
- 서버 쿠키 세션의 본인 UUID로 웹 별표 GET/POST를 연결했다. 계정 전환 늦은 응답/중복 저장/불완전 조회 방어, 명시적 구형 브라우저 가져오기(기존 true/false 보존). 운영 구형 별표가 DB와 연동되지 않던 P1의 앱 적용이다.
- 한설 적용 테이블의 읽기 전용 검증: RLS true·정책0·anon/authenticated SELECT false·service_role SELECT/INSERT/UPDATE true·DELETE false. 이번 작업 SQL 실행/실데이터 쓰기 없음.
- 후보 전체 Node·독립 tsc·분리 webpack 53경로 exit0, 독립 리뷰 blocking0. main 최신 pull 확인. Vercel Ready 및 실제 운영 별표 조회 화면은 후속 확인하며 DB 저장/가져오기 실조작은 사용자가 수행한다.

## 2026-10-10 영겁 — 즐겨찾기 사용자 대조 후속 / 로컬 실제 연동·운영 구형 저장 확인

- 한설이 상점·임무 별표의 실제 웹/IRIS 연동을 확인했다. 물물교환 사진은 웹 별표 표시와 IRIS 조회 실패 안내가 함께 보인다. 읽기 전용 Supabase aggregate로 한설·뉴월 kronos_barter_favorites 기록 모두0 확인. 사진 왼쪽의 구형 UI는 브라우저 로컬 별표/운영 미배포 가능성이므로 실제 주소와 명시 가져오기 상태를 구분한다.
- 실행 IRIS development 확인(명령줄 비밀값 미출력), localhost 뉴월 웹 GET 완료·기존 목록1개 안내·버튼 활성. Chrome 실제 왼쪽 화면은 운영 sanctum-tawny-three.vercel.app의 한설 /character로 확인되어 구형 localStorage 별표임을 확정했다. 한설이 이후 로컬 별표 변경의 즉시 IRIS 연동을 실제 확인했고 운영 웹은 아직 불연동이라고 구분했다. 새 API/UI는 미배포이므로 SQL 추가나 공개 권한 확대가 아니라 배포 후 원래 origin/브라우저의 기존 목록 명시 가져오기가 필요하다. 계정이 다른 옛 목록을 자동 병합하지 않는다.
- 임시 개발 전용 서버/클라이언트 진단(단계/상태 코드, 비밀값/계정 값 미기록)은 제거했다. 관찰 GET200을 개별 네이티브 요청과 연결하지 못해 최초 실패 원인은 미확정이다. 관련 API16/16·독립 tsc 통과. 임의 운영 쓰기·자동 가져오기·영구 제품 코드 수정/SQL/push/배포 없음. 기존 브라우저 별표는 훼손하지 않았고 운영 가져오기는 배포 이후 사용자 확인이 남는다.

## 2026-10-10 영겁 — 물물교환 즐겨찾기 화면 계정 경계 수정 / 실제 GET 확인

- SQL 적용 뒤 한설의 다시 조회 불가·별표 wait 제보를 실제 뉴월 로그인에서 확인했다. nexus_user 표시 정보에는 id가 없는데 CharacterPage가 user.id를 전달해 즐겨찾기 요청이 시작되지 않았다. 초기 효과에서 기존 /api/auth/session GET을 병렬로 1회 시작, 표시 닉네임 일치·승인 상태·UUID 확인 후 별표 전용 barterAccountId 전달로 수정했다. 표시 ID/다른 기억 계정으로 대체하지 않는다. 늦은 응답 active/abort 차단, 서버의 계정 비교 유지.
- 실제 localhost /character에서 수정 후 별표 활성/pointer, 명시 다시 조회 완료, 기존 브라우저 목록 1개 가져오기 안내를 확인했다. DB 실제 쓰기/가져오기/상점·임무·IRIS 별표 대조는 하지 않았다. 신규 경계4 RED→GREEN, 관련23/23·기존 실제 React 합성11/11·독립 tsc·전체 Node exit0. 첫 제한 환경 Edge 프로필/connection·overlay·owned-server 임시 파일/루프백 실패는 허용 환경 재실행 통과와 구분한다.
- 교환/즐겨찾기 원본·DB 권한·SQL·버전 변경 없음. 기존 모든 미커밋 작업 보존, commit/push/배포 없음. 다음 사용자 행동은 자신의 기존 목록을 확인하고 명시 가져오기 또는 별표1개 저장, 같은 계정 IRIS 조회 대조다. 시낙시스 전체 이식은 앞선 방향 논의 상태로 유지하며 이번에 확대하지 않았다.
- 좁힌 독립 리뷰 Critical/Important0·경계4 재통과. 초기 세션 조회의 일시 실패는 자동 재시도 없이 화면 새로고침이 필요하다. 기존 잘못된 nexus_user JSON·다른 탭 계정 동기화·전체 IRIS/운영 저장은 이번 리뷰 범위 밖이며 완료로 판단하지 않는다. 새 빌드는 이번 좁힌 수정에서 반복하지 않았다.

## 2026-10-10 영겁 — 물물교환 즐겨찾기 DB 적용 결과 확인 / 실저장 대기

- 한설이 적용 SQL의 결과 JSON을 제공했다. 복합 PK/양쪽 FK/ trade_id 인덱스, RLS true·정책0·PUBLIC grant0·anon/authenticated 모든 접근 false·service_role SELECT/INSERT/UPDATE만 true를 확인했다. 아래 미적용 기록은 당시 상태이며 현재 새 테이블은 존재한다. 기존 상점/임무/횟수/즐겨찾기 기록 변경이나 Codex 운영 시험 쓰기는 없다.
- docs/SUPABASE_SCHEMA.md·Master Guide·RELEASE_NOTES의 미배포 DB 준비 기록을 갱신한다. 새 공식 버전/commit/push/배포/공지 없음. API/UI는 기존 로컬 구현이며 SQL만으로 운영 웹에 새 UI가 배포된 것은 아니다.
- 다음 사용자 확인: 저장 중인 변경이 없을 때 localhost3000/character의 크로노스 물물교환에서 다시 조회, 기존 브라우저 즐겨찾기 안내 확인 후 본인 계정 여부를 명시 확인해 가져오기. 같은 계정 웹/IRIS 별표 대조는 그 이후. 실제 IO 검증 전 연동 완료로 선언하지 않는다.

## 2026-10-10 영겁 — 즐겨찾기 진단 JSON 수신 / 물물교환 SQL 제공

- 한설이 전체 시낙시스 이식보다 즐겨찾기 SQL 연동을 먼저 요청했다. 직접 실행한 읽기 전용 진단 JSON에서 상점/임무의 기존 kronos_progress.bookmarked·PK·서버 전용 RPC/권한 및 accounts UUID/nexus_trades bigint를 재확인, kronos_barter_favorites는 없음. 상점/임무 저장소를 중복 생성하거나 기존 기록을 이관/초기화하지 않는다.
- 준비 SQL supabase/sql/iris_barter_favorites.sql은 새 물물교환 테이블만 생성·서버 SELECT/INSERT/UPDATE 최소 권한·공개 접근 차단, 후속 검증은 한 개 result JSON으로 정리했다. 사용자에게 목적/영향/접근 차단형 복구를 안내하고 SQL을 제공한다. Codex 운영 SQL 실행/운영 시험 쓰기/push/배포는 없다. 실행 결과 확인 전 운영 적용 완료로 기록하지 않는다.
- 다음: 한설의 적용 결과 JSON으로 RLS/권한/PK/FK/인덱스 확인 → 기존 브라우저 물물교환 즐겨찾기는 명시적 가져오기로 보존 이관 → 같은 계정(상점/임무는 해당 캐릭터/공용 범위) 웹·IRIS 별표 대조. 메타데이터 존재는 실제 저장 성공/동기화 검증이 아니다.

## 2026-10-10 06:56 KST 영겁 — 야간 IRIS 크로노스·시낙시스 로컬 후보

- 06:26 예약 재개. 집 릴레이 수신함 확인 완료(새 WAITING/UPDATED 없음), origin main ff-only pull 최신 확인. `codex/iris-checkboard-classes`의 이전 IRIS/물물교환/즐겨찾기·개인 파일 변경을 보존했다. 공식 버전/운영은 아래 v2.21 그대로이며 이번 작업은 commit/push/배포/공지 없음.
- IRIS 상점구매·임무게시판: 기존 `kronos_shop_items`, `kronos_missions`, `kronos_progress` 읽기와 본인/공용 범위별 저장. 검색/미완료/즐겨찾기·금액/보상/조건·MAX/MIN·횟수·15초/직접 저장·보호 대기함 재사용. 제목200자와 줄어든 상한보다 큰 기존 횟수 보존, 임시 읽기 실패는 unknown 유지. 구형 bridge는 새 workspace 저장을 실행 전에 막는다. 새 네이티브로 정상 재시작 필요.
- IRIS 시낙시스 생성: 활성 DB 카탈로그와 4/8인 정원·본인 캐릭터·운영진 bus 권한을 서버에서 재조회, 공지를 memo/sub_content에 일치시켜 기존 member-mutations 경로로 생성한다. 일반 파티1캐릭터/모집우선/1회 클리어, 길드버스 여러 본인 캐릭터·반복·익일 종료 지원. 회차 완료는 false로 시작(주간 숙제 완료와 구분). 기존 웹 버스 엔진이 이후 참여/편성을 담당한다. IRIS 내 자동 매칭·가입·출발·회차 운영은 아직 구현 범위 밖이다.
- 생성은 명시 확인 후1회, 자동 저장/재전송 없음. 요청 전에 계정별 결과 불명 표시만 localStorage에 기록(초안/자격증명 아님), 재시작 때 중복 생성 차단. 불명확 결과는 `/party` 확인 후 명시 해제한다. 네이티브는 사용자 클릭·활성 desktop source·동일 환경의 정확한 `/party`만 기본 브라우저로 열고 다른 팝업은 계속 차단한다. 생성 중 account/close 조작 잠금 및 unmount 해제 회귀 포함. 기존 member-mutations에 선택적 expectedAccountId를 추가해 준비/최종 인증 간 계정 변경을 차단한다.
- 검증: 최종 전체 Node481개(478통과/3의도된skip/실패0), 독립 tsc exit0, scoped ESLint 오류0, 임시 복사본·합성 환경변수 webpack Production56경로 exit0. native DPAPI store/bridge/overlay/stats/currencies/addon·host allowlist28개·합성 WebView 보안 PASS. 브라우저 실제 컴포넌트/컨트롤러+합성 IO로 상점 수동·임무 자동 저장/공용 범위/캐릭터 격리/시낙시스 생성 확인·불명 응답 재시작/재전송 차단 확인. 각 화면320/390/768/1280 ×18/20/22px 총36조합에서 카드/버튼/가로 넘침0. 독립 리뷰 두 묶음 지적 총6건 수정/회귀 및 재리뷰 blocker0. 실제 운영 쓰기/게임/배포 검증과 혼동하지 말 것.
- DB DDL/RLS/권한/Realtime 변경 및 게임 조작·운영 시험 생성/삭제 없음. 이번 상점·임무·생성 연결에는 새 SQL 불필요. 이전 물물교환 즐겨찾기 SQL 승인/운영 미적용 상태는 유지한다. SQL 없는 생성 exactly-once는 보장하지 않으며 카탈로그/소유권의 다중 요청 간 경합과 실제 hosting latency는 미검증이다.
- 아침 확인: 켜진 IRIS가 있다면 × 정상 종료→최신 개발용 IRIS 실행→크로노스 상점구매/임무게시판을 웹 `/character` 기록과 대조. 시낙시스의 본인 목록/4·8인 정원/공지 확인 단계까지만 먼저 확인하고, 실제 생성은 한설 의도로 진행한다. 실제 기본 브라우저 링크·native 글자/DPI/게임 부착 실검증은 남았다. 합성 임시 서버와 탭은 정리한다. 계획/검증 이력은 `docs/superpowers/plans/2026-10-10-iris-workspace.md`, `2026-10-10-iris-synaxis.md`.

## 2026-10-10 02:25 KST 영겁 — v2.21 운영·통합 공지 완료

- main 89034a5, Vercel dpl_3weipgZgD3d5AVtrdTFoaXX1ZQao. GitHub success·기존 로그인 Vercel 브라우저에서 Ready/Production/운영 도메인/동일 커밋 직접 확인. MCP403을 성공으로 오인하지 말 것. 운영 /party BETA v2.21·한설 세션·만료 안내 없음·사용 화면·관찰 콘솔0. 현 날짜 조건에 파티가 없어서 실제 담당자 연장/취소 쓰기는 미시험이다.
- 한설의 게시 직전 추가 승인 후 기존 공지 UI로 통합 업데이트 ID15 발행. https://sanctum-tawny-three.vercel.app/kerygma?id=15 / 생텀 업데이트 / SANCTUM 시스템 / 제목·본문·목록 단일 항목 확인. 같은 버전 새 글을 만들지 말 것. UPDATE_POST_v2.21는 게시 상태로 갱신. 별도 생텀 가이드 글은 생성하지 않았다.
- 후보 전체 Node·독립 tsc·52경로 Production 빌드 통과/리뷰 blocking0. 후속은 확인 기록만·구조 변경 없음. 미배포 IRIS/즐겨찾기·SQL/개인 파일 변경은 보존한다. 아래 준비/로컬 미배포 절은 당시 경과이며 만료 수정은 운영 반영됐다.

## 2026-10-10 02:16 KST 영겁 — v2.21 공식 push·통합 공지 준비

- 한설 명시 승인: 만료 안내 담당자 제한까지 main push, 앞선 v2.2와 합친 버전업/업데이트 공지 게시. v2.21 핫픽스, lib/release.ts 및 UPDATE_POST_v2.21 사용자용 본문 갱신. 기존 길드마스터 notices/mutate 경로가 생텀 업데이트 작성자를 SANCTUM 시스템으로 고정하고 같은 제목 중복을 거절하므로 이 경로만 사용한다. 자동 게시 기능 추가/DB 구조 변경 없음.
- 아래 로컬 미배포 경과는 당시 기록이다. 이번 staged 후보는 만료 hook/page/18회귀·버전·관련 문서만 추가하고 IRIS/즐겨찾기 로컬 변경·준비 SQL·개인 파일 삭제는 보존/제외한다. 원격 main 최신 pull 확인, force push 없음. 배포/게시 완료는 후속 결과로만 기록한다.
- rollback: v2.2/61cc25b, Vercel GitHub success 5wdCNRoi7GUgJiZh9Gf21BGs23oG. 운행자 실제 연장/취소는 시험하지 않는다. 통합 공지 제목은 SANCTUM BETA v2.21 업데이트 — 길드버스 운영 개선이며 재시도 전에 기존 게시 여부를 확인한다.
- 공식 staged 후보 분리 검증: 전체 Node dot reporter exit0·독립 tsc exit0·52경로 webpack Production 빌드 exit0. 최초 제한 환경의 임시파일/루프백 EACCES는 동일 후보 허용 환경 재검증으로 해소. 독립 한정 리뷰 blocking0·18회귀 및 네 실제 action callback 대역 통과. 운영 버스 시험 쓰기 없음.

## 2026-10-10 영겁 — 만료 안내 담당자 제한 / 로컬 미배포

- 한설 제보: 참가 중인 만료 버스에서 네 버튼 모두403으로 이용 차단. 팝업 제거 제안을 거부하고 현재 담당 관리자만 안내+연장 유지 지정. usePartyManager의 checkTimeouts에 공통 isBusOperator 판정/초기 역할 ref, 재조회 시 권한/대상 소멸의 stale popup 제거. 일반 파티는 기존 참가 기준 유지. 서버/API/RLS 변경0.
- /party 만료 창 닫기/바깥/Escape, 현재 페이지 동일 일정 재노출 억제(시간/운행자 바뀌면 재안내). 버스 필터/종료·삭제 정책은 그대로. 신규18+관련86/86·독립tsc·diff 통과, 기존 공유 lint42오류/8경고. 로컬 한설 계정 새로고침 후 만료 팝업 없이 이용 화면 확인. 실제 운영 연장/삭제 시험쓰기0·commit/push/버전 변경 없음. 현재 운영은 v2.2/61cc25b이며 이번 수정은 다음 승인 push 대상으로 보존한다.

## 2026-10-10 01:52 KST 영겁 — v2.2 main push·운영 확인

- 기능 커밋 fb9150d60f66dc20f80f6f7222dcdc06f5118cd7 origin/main fast-forward, Vercel GitHub success/9FedV9MiUDCvv5JNsPcgP4CnDaVC. 운영 party/character/kerygma BETA v2.2·기존 한설 세션/실데이터 로딩·관찰 콘솔 error/warn0, 로그인/캐릭터/공지/파티/admin/auth health GET200. 신규 로그인 제출·운영 데이터 시험 쓰기는 하지 않았다. MCP team403으로 직접 Ready는 확인 불가하며 배포 성공 신호와 운영 확인을 구분한다.
- 기존 시간 만료 팝업은 연장/취소만 있어 생성 모달 실열람을 막는다. 확인을 위해 다른 사람의 버스를 임의 변경하지 않았다. 새 모달은 회귀/앞선 사용자 확인, 실제 출발 수신은 운영 확인 대기. 별도 정책 결정 없이 만료 안내를 우회하거나 파티를 취소하지 말 것.
- 아래 로컬 작업 경과는 당시 상태로 보존한다. v2.2 공식 배포는 길드버스 범위만이며 IRIS/즐겨찾기 변경·개인 삭제는 여전히 로컬, 신규 SQL 적용/공개공지 게시0. 검증384pass/3skip·타입·분리52경로빌드 통과, 이전 rollback224eb6f/v2.154 유지.

## 2026-10-10 01:40 KST 영겁 — v2.2 공식 push 준비

- 한설이 push·생텀 버전업·업데이트 노트를 요청했다. 독립 기능 묶음인 길드버스 공지 보존/설정 수정·본인 참가 제한·접속 중 변경/출발 알림·일정순·완료 열람을 v2.2로 올린다. 현재 feature branch에서 검증한 staged 후보만 HEAD:main fast-forward push한다. 원격 main224eb6f 최신 pull 확인, force push 없음.
- 제외: IRIS 후속 변경·즐겨찾기 API/UI/준비 SQL·무관한 공지 초안/개인 메모 삭제·SDK/프로필/비밀값. 해당 로컬 변경은 보존한다. 아래 IRIS/즐겨찾기 구현 기록은 운영 배포를 뜻하지 않는다. 이미 승인된 parties Realtime SQL 이력/스키마 문서는 포함하되 재실행하지 않는다.
- 사용자용 노트 docs/UPDATE_POST_v2.2.md, 공개 케리그마 게시 없음. 직전 기준선 v2.154/224eb6f·GitHub Vercel success G953mg9hhTULweP9oTpVZfsLsPEr. Vercel MCP는 현재 team 접근403·CLI 미설치로 직접 Ready 조회 불가, GitHub 성공 신호와 운영 응답을 별도로 확인한다. 권한 우회/자동 재인증은 하지 않는다.
- staged 후보 Node384통과/0실패/기존 브라우저 런타임 관련3skip, 독립 tsc 통과, 비밀 환경 파일 없는 분리 webpack 빌드52경로 exit0, cached diff check 통과. 첫 sandbox 실행의 Windows EACCES는 같은 후보의 허용 환경 재실행으로 해소했다. 실제 운영 화면/새 커밋은 후속 기록한다. 실제 출발 알림 수신은 정상 운영 확인 대기, 기존 비트랜잭션·브라우저 배경 지연 제한 유지.

## 2026-10-10 영겁 — 길드버스 출발 가능 알림 마감 / 로컬 미배포

- 한설 승인대로 현재 신청 시간·완료/반복 여부를 반영한 서로 다른 4/8계정이 준비되면 해당 버스의 현재 관리자에게만 `길드버스 출발 가능합니다!` 알림과 카드 링크를 제공한다. 자동 출발은 없다. 기존 카드 관리 권한과 같은 리더 이름/본인 캐릭터 판정을 사용한다.
- BusLiveTracker.takeReadyBuses/forget 및 기존 useNoticeNotifications parties INSERT/UPDATE/DELETE에 연결했다. 최초/재연결 조회의 동시 이벤트를 병합하고 삭제는 tombstone으로 보존한다. 최초부터 준비된 버스는 조용히 기준 상태로 삼는다. 미달→충족에 한 번, 이탈/회차 이후 재충족은 새 알림이다. 시낙시스 알림 off는 유지한다.
- 관리자에게만 로컬 60초 캐시 평가를 추가했다. DB 반복 조회·새 채널·DB 구조/권한/publication 변경·운영 시험 쓰기 없음. UUID와 명시적 닉네임 별칭은 같은 계정으로 병합, UUID 혼재 행의 연결 근거 없는 닉네임은 보수적으로 제외한다. 브라우저가 비활성/절전이면 시간 알림은 지연될 수 있다.
- 관련 Node87/87, 최종 tsc 및 새 lib lint 통과. 독립 리뷰의 삭제 버스 지연 알림/동일 계정 중복 집계는 RED→GREEN 수정, 카드 권한과 다른 UUID-only 리더 허용도 제거했다. 실제 UUID/미연결 별칭 검사 추가. 전체 앱 build/IRIS 회귀는 반복하지 않았으며 기존 실패와 다중 행 비트랜잭션 제한은 유지한다.
- 한설은 앞선 일정 정렬·캐릭터 완료 상태 기능이 잘 된다고 확인했다. 새 출발 알림은 localhost3000/party 새로고침 후 정상 운영에서 확인한다: 관리자는 수신, 다른 운영진/참가자는 출발 알림 미수신, 클릭하면 해당 버스. 최초 접속 시 이미 찬 버스에는 알림이 없다는 점에 유의한다. commit/push/버전/배포 없음.
- IRIS 실행 후속: 정상 desktop.ps1 -Development 재요청은 중복 없이 기존 PID31608 복원을 요청했다. 기존 읽기 전용 layer-state에서 IRIS HWND1578720 visible=True, WebView 자식 프로세스 및 desktop HTTP200 확인. 실제 사용자 화면 확인은 별도 대기다. 이전 실행 승인 사용량 실패가 GUI 실행 불가를 입증하지는 않으며 CIM 검사 우회/강제 종료는 반복하지 않았다.

## 2026-10-09 영겁 — 길드버스 일정 정렬·완료 상태 펼치기 / 로컬 미배포

- 한설이 이전 길드버스 수정 및 접속 중 알림을 실제 확인했다. 승인한 후속: /party 길드버스는 예정일→시작시간→동률 최신 생성순. 일반 파티 상태/생성순·버스 우선 그룹·기존 지난 날짜 제외는 유지한다(hooks/usePartyManager.ts).
- CharacterCompletionStatus/CharacterCompletionName 공통 컴포넌트를 JoinPartyModal·GuildBusJoinModal·BusCreateModal에 연결. 닉네임으로 읽기 전용 레이드/어비스 목록을 카드 아래 한 캐릭터씩 펼침, 선택은 라디오/체크박스로 독립. PartyModals 및 /party에서 기존 카탈로그 전달, 기존 본인 characters.raid_checks 재사용. 클릭 요청·자동 갱신·DB 쓰기·구조/권한 변경 없음. 수정 모드에서 체크 컬럼이 없는 캐릭터는 확인 불가 안내(수정 전용 조회 범위는 변경하지 않음).
- 신규 회귀8/8·버스/알림/파티 관련 전체70/70·격리 실제 React 브라우저3/3(4폭×18/20/22)·tsc·새 파일 lint·diff 확인·독립 리뷰 중요 문제 없음. 390px 생성/가입 캡처 눈 확인, localhost /party200. 기존 전체 앱 lint/IRIS 실패 및 과거 다중 행 비트랜잭션 제한은 이번에 점검/수정하지 않았다.
- 다음: 한설이 /party에서 버스 일정순, 닉네임 펼치기와 선택 독립, 실제 크로노스 체크 일치를 확인한다. commit/push/버전/배포 없음. 아래 이전 실사용 확인 대기는 당시 경과로 보존한다.

## 2026-10-09 영겁 — 길드버스 본인 참가 수정·접속 중 알림 후속 / 로컬 미배포

- 아래 이전 전체 참가자/개별 시간 편집 해석을 한설 요청으로 정정. BusEditModal은 로그인 계정 owner 조회만, BusCreateModal은 본인 추가·교체와 타 계정 읽기 전용 신청 시간 요약. 개별 시간 입력 제거. 서버 ownNames 외403, 타 계정 기존 참가자·시간·반복 설정 보존, 본인 기존 시간 유지/신규 본인만 버스 시간 적용. 본인0명/타인 유지, 기존 정원·체크·CAS 보존.
- guildBusNotifications의 BusLiveTracker/변경 분류→기존 useNoticeNotifications parties UPDATE→알림함. 최초 접속·재연결 baseline만 조회, 새 폴링/채널 없음. Navbar 계정 UUID/닉네임과 본인 이름으로 신규/개명 캐릭터도 판별. 공지·컨텐츠·일정·정원·참가 설정만 알림, 완료/스탯/정렬 제외. 이전/새 참가자 합집합 수신, 늦은 응답/cleanup/단절/중복/저장소 제한 방어, 해당 카드 anchor 이동.
- **운영 설정 적용:** parties Realtime false→true. SQL/복구·구독자별 검사 부하 안내 후 한설 별도 승인으로 MCP 실행/재확인. replica identity=d, 데이터·권한·RLS·테이블 구조 그대로. supabase/sql/parties_realtime.sql 재실행/복구 이력(CLI 미설치). 다른 publication 확대 없음. 운영 버스 시험 쓰기는 하지 않았다.
- 최종 관련 Node62/62·실제 React 합성 HTTP 브라우저5/5(4폭×18/20/22)·tsc·새 파일 lint·diff 확인. 기존 공유 파일 lint 오류·IRIS 별도 실패는 남고 전체 앱 build/전체 회귀는 반복하지 않음. 운영 공개 클라이언트 SELECT 및 Realtime SUBSCRIBED·로컬 /party HTTP200 확인. 리뷰 Important 신규/개명 알림 누락은 RED→GREEN/추가조회0 수정. 실제 두 계정 수정 알림은 한설 확인 대기.
- Minor 보류: startTime/endTime만 있는 구형 참가자의 수정 화면 안내는 실제 보존 시간과 다를 수 있다(서버 보존 정상). 미접속/최초 baseline 조회 중 이벤트 재전송 없음. 명시적 시낙시스 알림 off 유지. commit/push/버전/배포 없음, 즐겨찾기 운영 SQL 승인 대기도 보존.
- 다음: localhost3000/party 새로고침→운행자 본인 추가 목록 확인. 참가자 다른 계정으로 생텀을 열어 시낙시스 알림 켜짐 확인 후 정상 운영에서 공지/일정 수정, 알림과 클릭 이동 확인. 실제 데이터는 한설 정상 운영 조작으로만 변경한다.

## 2026-10-09 영겁 — 길드버스 공지·설정 수정 로컬 구현 / 미배포·실사용 확인 대기

- 물물교환 즐겨찾기 운영 SQL 승인 대기는 그대로 보존하고 오늘 실사용 길드버스 점검을 우선했다. 운영 SELECT에서 제스 버스id172의 두 공지 컬럼 모두 기본값, 등록6명 조회/운행자 연결 정상 확인. 실제 데이터를 수정하지 않았다.
- 실제 생성 모달의 컨텐츠 적용 콜백이 수동 공지를 기본값으로 덮는 경로를 합성으로 재현했다. 카드 출력/서버 insert에는 계정별 공지 분기가 없다. 제스 당시 클릭 순서는 미확인이다. 상세 제보·제한은 BETA_FEEDBACK의 당일 항목을 따른다.
- 한설 승인 후 `GuildBusCard`→`BusEditModal`→기존 `BusCreateModal` 편집 모드→`member-mutations._busSettings` 구현. 현재 운행자 전용, 운영 카탈로그 정원·소유 계정/스탯·역할 재조회, 전체 설정 CAS/충돌 안내·명시적 새 조회, 운영 중 회차 종료 확인·제외 인원 확인. 정원 축소는 선택 캐릭터를 자동 삭제하지 않고 대기열 유지, 숙제 JSON 쓰기 없음. 사용자 입력 공지는 재적용에도 보존한다.
- `guildBusSettings`는 설정 snapshot/공지 보존/엄격한 시간 파서, `server/guildBusSettings`는 서버 수정 검증/CAS, `partyRosterValues`는 browser Supabase 초기화와 분리한 공통 역할/수치 파서다. `guildBusPolicy`는 익일 표기·자정 이후 및 당일 조기 도착 신청을 지원한다. 선택 전체 토글도 개별 시간 보존, 삭제 캐릭터는 해제 가능한 표시로 남긴다.
- 회차 완료 클라이언트는 baseline을 전달하고 서버는 checklist 쓰기 전 비교 및 마지막 CAS를 수행한다. 구 화면에서 baseline 없이 완료 요청하면409/새로고침 안내. 회차 완료 다중 캐릭터 쓰기는 여전히 비트랜잭션이고 중간 실패 위험은 유지한다. 운영 쓰기 시험이나 DB/RLS/DDL 변경 없음.
- 최종 관련57/57·합성 실제 React/HTTP 브라우저5/5·tsc·새 파일 lint·diff check 통과.4폭×글자3단계와390px 캡처 확인. 교차 리뷰 지적 모두 회귀 재현 후 수정. 전체 Node는 별도 IRIS 주간 집계 기대2/2 실제1/2 테스트1건 실패(BETA_FEEDBACK), 전체 통과 주장 금지. 전체 빌드는 비용 요청대로 반복하지 않았다. 운영 컬럼 SELECT에서 selected_sub_contents text[]/members jsonb 확인하여 기준서 보완.
- 로컬 `/party` HTTP200 확인. 다음: localhost3000/party에서 운행자 계정으로 공지·8→4인·참가 설정 확인. 운영에 이미 기본 공지로 저장된 문구는 원래 입력을 복구할 수 없으므로 직접 다시 입력해야 한다. commit/push/버전/배포/공지는 하지 않았다. 물물교환 즐겨찾기 SQL 승인 대기는 유지한다.

## 2026-10-09 영겁 — 물물교환 계정 공통 즐겨찾기 / 운영 SQL 승인 대기

- 계정 공통 즐겨찾기 API/UI 구현. 신규 `kronos_barter_favorites`는 **운영 미적용**이다. 실제 읽기 전용 검사에서 accounts.id UUID/nexus_trades.id bigint/신규 테이블 없음 확인. `supabase/sql/iris_barter_favorites.sql` 대상·기존 데이터 무변경·접근 차단형 복구 안내 후 적용 승인을 요청했다. CLI 미설치로 임의 타임스탬프 migration 파일을 만들지 않았다. 승인 전 운영 SQL/시험 쓰기 금지.
- `/api/kronos/barter-favorites`는 승인 세션/계정 일치/Origin/JSON·16KiB·가져오기500개 검증, 원하는 boolean upsert, bulk ignoreDuplicates 가져오기로 기존 true/false 보존. 삭제된 품목은 가져오기에서 제외한다. 목록·카탈로그는 반환 한도에 잘리지 않게 제한된 keyset/count로 조회한다.
- `useBarterFavorites`와 웹 TradeList/IRIS DesktopBarter가 별표·우선 정렬·전용 필터를 공유한다. `BarterFavoritesFeedback`의 상태/재조회와 웹 확인 후 기존 목록 가져오기, 원본 보존 제공. 계정 전환 commit 때 이전 IO를 무효화하며 중복 쓰기를 막는다. POST 실패는 GET 확인 전 잠금, 자동 POST 재시도 없음. 기존 횟수·15초 보호 큐/native는 변경하지 않았다.
- 관련 Node27/27·실제 React/합성 HTTP 화면11/11·tsc·새 파일 lint 통과. 교차 리뷰 Critical/Important 없음; 조회 전 빈 목록 오안내 Minor를 RED→GREEN 수정했다. 실제 세션/DB 별표 쓰기·운영 반영은 미검증. 전체 빌드/전체 회귀는 비용 요청대로 반복하지 않았다.
- 재부팅 후 localhost3000 서버 재시작, desktop GET200·비로그인 즐겨찾기 API401 확인. 일반 격리 환경은 로컬 소켓이 거절되어 일반 실행 환경에서 읽기 전용 재확인했다. native 실행/로그인 확인은 별도다. 미커밋·미푸시·버전/배포/공지 없음. 다음: SQL 승인→적용/권한 읽기 전용 검사→한설이 같은 계정의 웹/IRIS 별표를 직접 확인.

## 2026-10-09 영겁 — 물물교환·집중 UI 로컬 구현 / 새 앱 실확인 대기

- 당시 다음 요청 검토: 초기 추천 버튼은 한설이 정상 표시를 확인했다. 웹 별표는 브라우저 `nexus_pinned_trades`에만 저장됐으며 기존 DB 북마크는 상점/임무만 허용했다. 이후 계정 공통 즐겨찾기 방향을 승인받아 위 최신 절에 구현/운영 미적용 경계를 기록했다.

- 한설이 CBT 제공을 보류하고 물물교환 우선 구현을 승인했다. 크로노스→물물교환에서 기존 저장값, 검색·범위/주기·미완료 필터, 횟수 ±/MAX/MIN을 제공한다. 마지막 수정 15초 자동저장과 지금 저장을 재사용한다. 게임 교환·조작은 실행하지 않는다. 상점구매/임무게시판/시낙시스 신규 기능은 여전히 미구현이다.
- 계정당 품목은 캐릭터를 바꿔도 하나의 대기 변경으로 공유한다. `/api/iris/barter`는 본인 소유/현재 품목·초기화 기간/기준값을 검증하고 각 사본의 전체 JSON CAS 뒤 모두 재확인한다. 감소·누락값·관련 없는 JSON은 보호하며 MAX만 같다고 완료 처리하지 않는다. 다중 행 트랜잭션은 아니므로 부분 성공/응답 불명/기간·카탈로그·대상 변경은 보류하며 자동 반복하지 않는다. 결과 확인 필요 항목의 명시적 재시도만 허용한다. 운영 DB 스키마/RLS/RPC/권한 변경이나 시험 쓰기는 없다.
- 보호 큐 schema3와 `store.capabilities` 확인을 추가했다. 구 native에서는 저장소 접근 전에 정상 재시작 안내로 잠근다. 새 native는 v1/v2를 검증·이관한 뒤 원래 DPAPI 암호문을 복구용 백업으로 보존한다. 구버전으로 되돌려 중복 활성 대기함을 만들지 말 것. 실제 개인 대기함 복구는 사용자 확인 대상이며 삭제/강제 종료하지 않는다.
- 클래스 전체 목록은 창의 남은 세로 공간을 사용하고 짧은 계열은 자연 높이다. 변경 추천/로그인 추천과 계정은 중앙 대화상자다. 변경 추천은 후보당 짧은 소리 한 번을 시도하되 실패는 추천을 막지 않는다. DOM 초점·Escape·배경 닫기·내부 스크롤을 제공하고 OS 게임 활성은 바꾸지 않는다. 제목줄 톱니 왼쪽 사람 아이콘에서 기억 계정을 바로 선택하며 다른 계정 로그인/로그아웃을 제공한다. 기존 창 붙이기/활성 범위 위 표시/작업표시줄 양보 정책은 보존했다.
- 검증: 관련 Node129/129, 전체 타입 검사 및 대상 lint 통과(기존 lint 경고는 별도). 격리3001 실제 페이지 합성은 320/390/768/1280 폭·전체/짧은 클래스 높이·계정 직접 선택/초점/Escape/배경·캐릭터 전환 중 계정당 값 보존·15초/수동 저장·검색 통과, 합성 물물교환 POST2만 수행. 밝음/어두움 캡처 확인. 독립 좁힌 리뷰에서 새 Critical/Important/구체적 Minor 없음, 추가 관련23/23. native store/bridge/WebView fixture 통과. 실제 DB·게임 IO는 시험에 사용하지 않았다. 전체 앱 빌드/전체 회귀는 사용자 비용 요청대로 반복하지 않았다.
- 한설이 기존 IRIS를 × 정상 종료했다고 확인했다. 최신 native로 정상 실행한 뒤 클래스 공간·중앙 추천/소리·사람 아이콘/직접 계정 선택·물물교환 실제 웹 동기화를 한 항목씩 확인한다. 이번 변경은 미커밋/미푸시이며 버전/배포/공개 공지 없음. 상세 승인 범위와 계획은 `docs/superpowers/{specs,plans}/2026-10-09-iris-barter-focus.md`다. 이전 미커밋/릴레이 기록은 보존한다.
- 최종 관련 추천 DOM4개도 통과: 단일 오래된 스탯 추천, 네 재조회 때 게임 변경 방어, 경쟁 후보 보류, 중앙 추천 확인 전후 이전 캐릭터 클래스 미저장 보존. 추천에 의한 스탯 POST0. 격리3001 시험 서버는 종료했으며 실제3000/게임에는 종료 조작이 없다.
- 실행 후속: 일반 환경 IRIS runner0·localhost3000 desktop200 확인 뒤 최신 native PID29392 정상 실행, alive/시작stderr0bytes 확인. 한설이 새 창이 잘 나온다고 화면으로 확인했다. 초기 접속 추천의 두 버튼에 세 버튼용3열이 적용돼 줄바꿈된 P1을 추가 접수했다. 데이터/추천 로직은 유지하고 동등2열·짧은 문구로 수정, 개발 화면 변경이므로 native 재시작은 필요 없다. 상세 레이아웃 확인 결과는 아래 후속에 기록한다.
- 버튼 후속 검증: 초기 추천 실제 JSX320/390×글자18/20/22의6조합 RED→GREEN(한 줄·동등2열·12자 이름·가로 넘침 방어), 390/20 캡처 확인. 관련 UI21/21·대상 lint·fixture 구문 검사 통과. 전체 검증/빌드 반복은 없고 실제 수정 버튼은 사용자 창 확인 대기다.

## 2026-10-09 영겁 — 단일 오래된 스탯 추천 보완 / 정상 재시작 대기

- 사용자 실확인 후속: 수정본 추천 표시→네 후 선택 반영에 이어 “캐릭터3번 바꿨는데 잘된다” 확인. 해당 사용자 환경의 연속 전환 검증 완료로 기록하되 모든 캐릭터/다른 PC까지 검증한 것으로 확대하지 않는다. 한설이 소수 CBT 제공 방법을 질문했으며 구현/배포 승인은 아직 아니다. 현재 실행은 localhost3000 개발 모드, production URL 연결 실행 분기는 존재하나 최신 변경 미푸시·패키지/다른PC/게임배포정책 확인은 남는다. 우선 소수 가입 길드원용 묶음 배포와 좁힌 저장/권한/설치 확인을 제안한다.

- 재실행 후속: 한설이 × 종료했다고 확인, 일반 환경 CIM 기존 runner0·localhost3000 desktop HTTP200 후 수정본 `desktop.ps1 -Development` PID22092 실행. 이후 runnerAlive=true·시작 stderr0bytes 확인. 사용자 화면/다음 게임 캐릭터 전환 추천은 아직 확인 대기이며 강제 종료·게임 조작·DB 시험쓰기는 하지 않았다.

- 한설 승인으로 `lib/irisCharacterSwitch.ts`의 변경 추천 전용 순위를 보완했다. 같은 직업의 양수 비교값 중 가까운3개(각 상대차이20% 이내)가 있으면 그 평균도 사용하고 기존4값 점수와 높은 쪽을 선택한다. 경쟁 후보에도 같은 규칙을 적용해 점수 차이8% 미만이면 보류한다. 기존 양수2개 일반 매칭·두 distinct fresh 관측·네 재조회·직업/다중 변화·수동 선택/거절 방어는 유지한다. 로그인 추천·DB 값·API·native·15초 저장은 변경하지 않았다.
- 사진의 밤설91186/8366/0/20237 vs94149/9542/3428/20290 누락, 비영점 이상치 누락, 정확한 후보와3값 일치 경쟁후보 오판을 RED로 확인했다. 수정 후 tracker17/17 및 기존 stats8/8 통과. 분리3001 실제 JSX/controller 합성 새3개(오래된 값 추천→네 재조회→선택, 네 전 게임 변경 시 유지, 경쟁 후보 시 보류) 통과; 스탯/숙제/클래스 POST0, 추천 중 카탈로그/숙제 GET 증가0. tsc --noEmit --incremental false·대상 lib lint·diff check exit0. 전체 테스트/빌드는 사용자 비용 요청대로 반복하지 않았다.
- 새 변경 교차 리뷰를 요청했으나 리뷰 에이전트가 사용량 제한으로 종료되어 독립 리뷰 완료를 주장하지 않는다. 앞선 seed 리뷰 결과와 이번 추가 구현을 구분한다. 코드 자체의 순위/경합/양수 조건과 관련 회귀는 직접 확인했다.
- 한설이 재시작을 요청했다. 실제 환경에서 IRIS runner PID14028 1개·localhost3000 desktop HTTP200 확인, 기존 창을 강제 종료하지 않았다. 사용자 × 정상 종료 확인 후 수정본을 실행하고 게임만 다른 캐릭터로 바꾸는 흐름을 확인해야 한다. 실제 밤설/다른 후보 카탈로그와 전체 실게임 해결은 아직 미확인이다. 운영DB 쓰기·버전·commit/push·배포/공지 없음.

## 2026-10-08 영겁 — 추천 관측 이어받기 로컬 수정 / 실게임 재검증 대기

- 밤설 후보 탈락 재현: 사용자 직접 선택 화면의 저장값(힐러·91186/8366/0/20237)과 게임값(94149/9542/3428/20290)을 기존 pure rank/tracker로 계산하면 유사도71.0668%로80% 기준 미달, 이전 기준이 정상이어도3회 모두null. 같은 직업/나머지3개의 비교는 가까우나0→3428 항목이 평균에 큰 벌점을 준다. DB에는 읽기/쓰기를 실행하지 않은 사진 기반 재현이며 당시 Watch catalog/다른 힐러 후보·사용자 업데이트 후 저장 성공은 독립 확인 아님. 후속은 스탯1개 차이에 견디는 명확한3개 양수 비교/후보 경합 방어 설계 승인을 받은 뒤 최소 수정·관련 회귀. 아직 추가 제품 판정 수정/임계값 완화·운영DB/push 없음.

- 실제 연속 전환 후속: 한설이 젼설 선택 후 게임 거월→뉴월로 전환했고 두 추천 및 다음 선택 상태가 첨부 화면에서 확인됐다. 뉴월→밤설에서 다시 추천이 안 떠 IRIS 뉴월 선택 유지. 고정 공식 조회는309ms/exit0·힐러·94149/9542/3428/20290 정상. 밤설의 저장 직업/스탯 및 다른 힐러 후보 점수·실제 기준/거절 상태는 아직 미확인이다. 추가 수정 전에 사용자 밤설 저장/게임 비교 화면으로 원인을 좁힌다. 지금 DB 업데이트 버튼은 누르지 않도록 안내 예정; 제품 코드 추가/운영 DB/버전/push 없음. 정상 current game 읽기만으로 Watch 전체 정상이나 수정 완료를 선언하지 않는다.

- 실행 후속: 한설이 게임을 젼설로 변경한 뒤 IRIS 정상 종료를 확인했다. 일반 환경 CIM runner0/localhost desktop HTTP200 확인 후 정상 `desktop.ps1 -Development` 수정본 PID14028 재실행 요청, 시작 stderr0bytes. 숙제 체크/저장·캐릭터 선택은 사용자만 수행하며 추천 연속 전환 실확인은 아직 대기다. 새 앱은 재시작 시 현재 게임으로 자체 기준을 시작하므로 다음 실제 게임 전환에서 확인한다.

- 한설이 같은 계정 내 최근 관측 보존·계정 전환 분리·2회 확인/자동 선택·쓰기 금지 유지의 좁힌 수정안을 승인했다. `DesktopStatsSession`의 계정 key 안에 메모리 ref만 두고 정상 관측과 네 확인의 재조회 결과를 보존한다. 새 `DesktopCharacterWatch`는 이를 tracker 기준으로 이어받는다. 신선도60초·양수2개·오래된 timestamp 방어, 새 관측2회 및 version/generation/잠금/숨김 방어는 유지한다. 저장소·API·DB·native 명령 변경 없음, 주기 DB 호출 증가 없음.
- TDD: tracker seed 회귀 및 실제 JSX/controller의 A→추천 B 확인→B의 첫 조회 전 C 전환 경합을 수정 전 실패로 확인, 수정 후 tracker12/12·추천 DOM21/21 통과. 계정 logout→다른 synthetic 계정/초기 읽기 실패 시 이전 기준 비상속, 수동 선택·중복/오래된 관측·네 재조회·숨김/잠금/선택/종료/계정의 늦은 응답·이전 큐/draft 보존 포함. stats POST0, 신규 경합 숙제/클래스 POST0, 카탈로그 재조회 증가0. tsc --noEmit --incremental false 및 변경3파일 lint exit0, diff check exit0(CRLF 경고만).
- 분리3001 개발 사본은 실제 계정/게임 IO·외부 브라우저 요청을 차단한 fixture이며 초기 SWC 권한/CSS 검색 범위/가짜 연결 설정 문제를 분리해 실행했다. 테스트 사본에만 CSS source 범위 제한·접속 불가 가짜 주소를 사용했고 원본 global CSS/환경 파일은 변경·복사하지 않았다. 전체 프로젝트 테스트/빌드는 사용자 요청에 따라 반복하지 않았다.
- 실제 거월→젼설 당시 Watch 기준 유실 여부·젼설 저장 스탯은 여전히 미확인이다. 코드의 재현 가능한 관측 유실 결함을 수정한 것이며 이번 사용자 증상 전체 해결로 단정하지 않는다. 한설의 정상 종료/재실행 후 연속 캐릭터 변경과 추천 네 확인을 검증한다. 운영 DB·버전·commit/push·배포/공지 없음. 추천 변경만 읽기 전용 교차 리뷰에서 새 Critical/Important 회귀 없음; 실제 게임 검증은 별도다. 분리3001 테스트 서버는 정상 중단했고 실제3000/IRIS는 종료하지 않았다.

## 2026-10-08 영겁 — 작업표시줄 예외 수정 / 추천 후속 조사

- 추천 재발/가설: 한떨→거월은 성공, 거월→젼설은 미표시. 공식 read239ms/exit0·석궁사수·96226/8822/5100/20540 정상, 저장 직업도 사용자 확인. 선택/watchVersion remount로 baseline 유실 후 첫 관측이 새 게임이면 추천이 계속null인 결함을 합성 재현했다(완전히 일치하는 가상 후보에서도 이전관측있음→2회성공/첫관측전환후→4회null). 실제 사용 당시 baseline·저장 스탯은 미확인, 원인 단정 금지. 마지막 fresh 게임 관측의 계정별 세션 보존/선택 후 이어받기를 좁힌 수정 방향으로 검토 중, 구현/DB/push 없음.

- 선택 확인 후속: 한설이 추천의 네 버튼 후 IRIS 선택도 한떨로 변경됐다고 확인했다. 통제 흐름의 추천 표시→확인→선택 반영은 실확인 완료. 이전 미표시 원인은 여전히 미확정이며 추천 코드 수정·DB 시험 쓰기·push는 하지 않았다.

- 추천 통제 재현 성공: IRIS 거월 유지/게임만 한떨 변경 후 사용자 화면에 빙결술사·한떨 추천 표시 확인. 네 버튼의 선택 반영은 아직 별도. 앞선 추천 미표시는 재현 안 됨/원인 미확정으로 유지하며 제품 수정 완료로 과장하지 않는다. 추천 코드·DB/push 변경 없음.

- 추천 화면 후속: 현재 캐릭터는 한떨이 아닌 거월로 사용자 정정. 거월·대검전사 저장/게임 네 스탯94282/8822/3616/16540 일치, 사용자 업데이트 성공 안내 및 오래된 조회 표시가 첨부됐다. 현재 조회/비교 성공은 확인되지만 이전 한떨 추천 실패 원인은 미확정이다. 다음 통제 재현은 IRIS 거월 유지/게임만 다른 캐릭터로 변경, 추천 표시 여부를 확인한다. 추가 코드/DB/push 변경 없음.

- 사용자 확인 후속: 수정 앱에서 한설이 “너가말한대로 작동해”로 작업표시줄 양보/복귀 동작을 확인했다. 해당 제보는 로컬 실확인 완료, DPI/다중 모니터 전체 완료는 아니다. 다음 요청은 캐릭터 변경 추천의 읽기 전용 조사다. 한떨의 저장/게임 스탯 비교 화면은 아직 전달되지 않았으며 임계값 완화·자동 선택·DB 업데이트는 하지 않는다.

- 실행 후속: 한설 정상 종료 확인→기존 runner0/로컬 desktop HTTP200→정상 개발 수정본 PID3600 실행. 시작 stderr 없음, 읽기 전용 상태에서 IRIS HWND1378746 visible/game foreground/위 표시 확인. 자동 숨김 작업표시줄 hover·숨김 복귀 실제 확인을 안내한다. 추천은 아직 저장/게임 스탯 비교 대기이며 수정하지 않았다.

- 한설 승인 후 addon 정책/adapter에 작업표시줄 양보를 추가했다. shell 기본·보조 창의 monitor/rect와 cursor를 물리 좌표로 읽고 자동 숨김 가장자리 접근·2px 초과 노출 동안 자체 topmost를 해제한다. 고정 표시 때는 실제 IRIS 겹침을 판단한다. 다른 모니터에만 있는 bar는 무관, 정상 숨김 뒤 활성 범위 위 표시 복귀. 외부창 이동/활성·OS설정·입력·계정/큐/DB 변경 없음.
- TDD 실제 native 상태 실패 확인→addon52/52, WebView PASS·diff check exit0. geometry11종+native 해제/복귀/IRIS활성 우선순위 추가, 이전 창 상태 회귀 보존. 전체 웹 테스트/빌드는 반복하지 않았다. 현재 사용자 앱은 이전 native이므로 정상 종료/재실행 후 자동 숨김 작업표시줄 실확인 필요. commit/push 없음.
- 동시에 추천 미표시 제보(이전 캐릭터→한떨) 조사. 공식 get_my_info 읽기는 일반 환경244ms/exit0, 빙결술사/양수4스탯 정상; sandbox exit5를 게임 오류로 단정하지 않는다. 한떨 저장 직업도 빙결술사 사용자 확인. 관련 tracker9/9 PASS지만 저장 스탯·실제 Watch 기준/거절 상태 확인 전 원인 단정 불가. 추천 코드/DB 변경 없음. 다음에는 한떨 직접 선택 후 스탯 화면의 저장/게임 값 비교를 사용자에게 요청한다.

## 2026-10-08 영겁 — 작업표시줄 가림 후속 조사

- 한설이 다른 계정 로그인도 사용했고 전환 계정의 캐릭터 목록이 맞는다고 확인했다. 로그아웃·미저장 보존 개별 실검증은 별도다.
- 새 P1: 게임 활성/클릭 없는 작업표시줄 hover 노출 시 IRIS가 작업표시줄을 가린다. foreground만 보는 기존 활성 범위 topmost 판단에 작업표시줄 노출 예외가 없다. 가장자리 접근·표시 동안 자체 위 표시를 해제하고 숨김 뒤 복귀하는 좁힌 방향을 제안한다. 설계 확인 전 제품 코드 수정 없음; 계정/저장/DB 영향 없음.

## 2026-10-08 영겁 — 계정 전환 사용자 확인

- 한설이 “계정전환도 잘되고있어”로 실제 계정 전환 성공을 확인했다. 활성 범위 창 표시와 계정 전환은 사용자 확인 완료다.
- 다른 계정 신규 로그인·로그아웃·미저장 변경 보존의 개별 실검증까지 확인한 것은 아니다. 기존 대기 기록은 당시 경과로 보존한다. 이번에는 확인 기록만 추가했으며 코드·DB·commit/push 변경 없음.

## 2026-10-08 영겁 — 활성 범위 창 표시 사용자 확인

- 한설에게 브라우저 클릭→게임 클릭의 해제/복귀를 안내한 뒤 사용자가 “오 된다”라고 정상 동작을 확인했다. 현재 수정 앱의 활성 범위 위 표시 문제는 사용자 확인 완료로 기록한다. 앞선 재실패·대기 기록은 당시 경과로 보존한다.
- 계정 전환/다른 계정 로그인/로그아웃의 실제 사용자 확인은 별도로 남는다. 드래그 분리·게임 종료 질문·테마 복원·DPI/다중 모니터 전체 확인까지 완료된 것은 아니다. 새 구현·DB 변경·commit/push 없음.

## 2026-10-08 영겁 — 활성 앱 범위 위 표시·계정 동선 수정 / 실제 해제 확인 대기

- 이전 HWND_TOP 수정본도 사용자 실게임에서 실패했다. PID26064 진단 앱의 실제 기록은 foreground=게임, 호출true/error0이지만 own rank39→39/game32→32로 순서 불변이었다. 반환 성공만 확인하는 검사는 불충분했다. 아래 이전 수정/대기 기록은 경과로 보존하며 해결로 판단하지 않는다.
- 한설 승인: 게임 또는 IRIS 활성 때만 IRIS 자신의 topmost 상태를 켜고 다른 앱 활성 때 해제한다. native tracker는 tick의 finally에서 모든 조기 반환에도 레이어를 정리하고, 미확인/없는/최소화 게임·숨긴 IRIS·종료 질문·설정 해제·Dispose에서 해제한다. 자체 HWND에 NOACTIVATE/NOOWNERZORDER로만 변경, 게임 HWND/권한/포커스/저장 큐 변경 없음. 영구 전역 TopMost가 아닌 활성 범위 정책이다.
- 합성 실제 Windows 창 테스트를 먼저 실패시킨 후 addon37/37 및 native WebView PASS. 표시 비트 실제 켜짐/다른 앱 해제/IRIS 활성 유지/설정·숨김·unknown·최소화·종료질문·Dispose 해제와 포커스 유지를 검증했다. 별도 사용자 게임 조작은 하지 않았다.
- 계정 UI 승인·수정: 설정의 생텀 계정에 계정 전환/다른 계정 로그인/로그아웃을 항상 표시하고 선택 목록·로그인 폼은 인라인으로 펼친다. Escape/바깥 클릭·busy 잠금, 이전 계정 keep 정책 보존. 로그아웃 성공 후 설정을 닫아 로그인 화면을 표시한다(실패 시 닫지 않음). 로그인 코드 입력 대행/인증 API 구조 변경 없음.
- 검증: UI/bridge 관련 Node24/24·tsc·두 변경 컴포넌트 lint·diff check 통과. 실제 페이지 합성 browser의320/390px 버튼 범위/가로 스크롤 없음, 새 로그인 폼/Escape,2회 계정 전환·명시 logout→로그인 화면,테마 격리·조회 불증가 PASS. 외부API만 synthetic, 운영 계정·DB 입력 없음. React 점검으로 effect cleanup/안정된 의존성·기존 run 오류 처리·버튼잠금 확인. 전체 웹 빌드는 반복하지 않았다.
- 한설 정상 종료 확인 후 일반 수정 앱 PID25504 실행. 시작 오류 없음. 읽기 전용 실제 상태: foreground=게임, IRIS rank9/게임33, IRIS topmost=true/게임false로 실제 앞 배치 확인. 사용자에게 브라우저 클릭 시 해제→게임 클릭 시 복귀를 안내했다. 이 해제/복귀의 사용자 확인과 실제 계정 전환 성공은 아직 남는다.
- 현재 로컬 변경만. commit/push/배포/공지/운영DB/강제 종료 없음. ignored layer-debug-desktop.ps1은 이전 HWND_TOP 소스용이므로 최신 제품에 그대로 실행하면 source mismatch로 멈춘다. 다음에는 정상 desktop.ps1 -Development만 사용한다.

## 2026-10-08 영겁 — 같은 층 접근 거부 원인 확인 / 수정본 재실행 대기

- 실행 후속: 한설이 진단 앱 정상 종료를 알렸다. CIM으로 중복 실행 없음 확인 후 정상 desktop.ps1 -Development 수정본 PID9620을 실행했다. 오류 로그 없음. 실제 같은 층 동작은 사용자 확인 대기이며 아래 진단 앱 종료 대기는 이전 상태다.
- 사용자 정상 종료 후 진단 앱 PID24640을 실행했다. 실제 같은 층 호출이 `false/error=5`로 실패했고, 게임이 foreground인 때도 동일했다. 원인은 게임 HWND를 삽입 기준으로 넘기는 기존 호출의 접근 거부이며, 관리자 권한이나 게임 제어로 우회하지 않는다.
- `desktop-addon.cs`/`desktop-addon-policy.cs`: 게임이 foreground이고 IRIS가 게임 아래에 있을 때에만 IRIS 자신을 HWND_TOP으로 올린다. NOACTIVATE/NOOWNERZORDER, 비TopMost 유지. 다른 앱 활성 시 승격 없음, 이미 위에 있으면 반복 없음. 숨은 IME/owner 창 때문에 즉시 인접 여부로 판단하지 않고 최대512개 이전창 연결을 읽는다. 게임 HWND 변경·포커스 입력·저장 정책 변경 없음.
- 관련 회귀5개를 먼저 추가해 실패 확인 후 addon32/32, native WebView 검사 및 diff check 통과. 화면 밖 자체 창 probe의 HWND_TOP 성공/error0·foreground 유지·TopMost=false를 확인했다. 실제 게임에서 수정본 동작은 아직 검증 전이다. 전체 웹 빌드/테스트는 변경 영역 밖이라 반복하지 않았다.
- 현재 열린 것은 진단용 구코드 앱이다. 한설에게 × 정상 종료를 요청했고, 종료 확인 후 정상 `iris/desktop.ps1 -Development`로 수정본을 실행할 것. 종료 없이 강제 종료/동시 저장 연결 금지. 다음 한 항목은 Chrome로 IRIS를 가린 뒤 게임 클릭 시 IRIS가 함께 앞으로 나오는지다. 역방향 게임 승격이나 영구 최상위 보장은 하지 않는다.
- 계정 전환은 기존 `톱니바퀴 → 생텀 계정 → 닉네임 · 계정` 안의 기억 목록/다른 계정 추가다. 사용자에게 위치를 안내했으며 실제 전환 성공은 미확인이다. 현재 변경은 로컬이며 commit/push/운영DB/공지 없음.

## 2026-10-08 영겁 — 같은 층 유지 실패 조사 / 진단 재실행 대기

- 사용자 확인: 게임을 클릭해도 IRIS가 브라우저 뒤에 계속 가림. HWND_NEXT 실제 연결도 game→browser→IRIS, 별도 표시 설정 sameLayer=true. EnumWindows 열거 순서는 실제 Z순서와 달랐으므로 근거로 삼지 않는다.
- 기존 SetWindowPos 정책은 화면 밖 합성창에서 정상 배치. 실제 호출 반환값/오류는 아직 없으므로 원인을 단정하거나 창 권한/글로벌 TopMost로 우회하지 않았다.
- `.superpowers/release-build-20261008-224eb6f-home/layer-debug-desktop.ps1`은 원래 desktop.ps1/저장/단일 실행을 재사용하고 addon 소스의 같은 층 호출에 메모리 내 반환값/오류 로깅만 더한 임시 진단이다. parser PASS, 실제 실행/컴파일은 다음 단계다. 정상 종료 후 `powershell.exe -NoProfile -STA -File <위 경로> -Development` 실행, stdout/stderr는 ignored 별도 파일로 받는다. 로그에는 HWND/오류만, 인증·게임 데이터·큐 내용 없음.
- 현재 앱 PID2984는 정상 제품 코드. 사용자 정상 종료 확인 없이 강제 종료/동시 저장 연결 금지. 같은 층 동작은 미완료, 붙이기/최소화/복원/세로 추종의 앞선 사용자 통과는 유지한다.

## 2026-10-08 영겁 — 실제 붙이기 실패 원인 수정 / 사용자 붙이기 확인 완료

- 후속 사용자 확인: 게임 최소화 시 IRIS 숨김, 게임 복원 시 옆 배치 복귀와 세로 크기 따라오기를 한설이 확인했다. 다음 수동 항목은 제목줄 드래그 후 붙이기 분리다. 같은 층 설정·게임 종료 질문·테마 복원·DPI/다중 모니터 전체 검증은 여전히 남는다.
- 한설 정상 종료 후 수정 앱을 재실행했다. 최신 사용자 스크린샷과 보고에서 게임 옆(왼쪽 대체 배치) 붙이기를 확인했다. 붙이기 실패 항목만 해결 확인이며, 다음은 사용자 직접 게임 최소화/복원 확인이다. 아래 정상 재실행 대기는 이전 상태 기록으로 보존한다. 새 push 없음.

- 사용자 실검증에서 오른쪽 선택 후 게임 감지 실패를 확인했다. 최초 Discover는 성공하지만 Windows PowerShell5/.NET Framework HasExited의 SYNCHRONIZE 접근 거부로 다음 Alive가 unknown이 되는 것을 재현했다.
- `iris/desktop-addon.cs`의 불필요한 HasExited만 제거했다. 기존 PID+시작 시각의 수명 비교·없는 PID 종료/읽기 거부 unknown·게임 입력/이동 금지·저장 큐 정책은 보존한다.
- `desktop-addon.tests.ps1`에 제한된 OS 프로세스 API fixture로 실제 Alive 로직 회귀4개 추가: live/없는PID/시작시각 접근거부/PID수명불일치. RED→27/27 GREEN, native WebView 검사 PASS. 실제 게임 읽기 전용 진단3Tick도 tracked=true 유지했다. 웹 코드·DB 변경이 없어 전체 웹 검증은 반복하지 않았다.
- 현재 열린 개발 IRIS는 수정 전 native다. 한설에게 × 정상 종료를 안내했다. 종료 확인 후 `desktop.ps1 -Development`를 다시 실행하고 오른쪽 붙이기를 확인한다. 붙이기/최소화/종료/DPI 수동 통과를 아직 주장하지 않는다. 강제 종료·DB 쓰기·로그인 입력·commit/push 없음.

## 2026-10-08 영겁 — 애드온 바 집 환경 빌드·실행 확인

- 확인 기준 HEAD는 `224eb6f`이며 실제 원격 main과 일치한다. 아래 순월의 미푸시 표기는 작성 당시 기록으로 보존한다.
- 독립 TypeScript 검사 exit0, Windows 창 정책·설정 합성 테스트 23/23 통과. 비밀 환경 파일을 제외한 별도 사본의 webpack Production 빌드는 52경로 exit0이다. 격리 환경에서는 같은 SWC baseUrl 접근 거부가 재현됐지만 일반 권한에서는 통과했다. 제품 코드 수정 없이 환경 경계를 확인했다.
- 닫혀 있던 localhost:3000 개발 서버와 최신 `desktop.ps1 -Development`를 실행했다. `/iris/desktop` HTTP200 및 앱의 계정 세션·캐릭터·스탯 GET200을 로그에서 확인했고, 한설이 새 `IRIS for SANCTUM` 창 표시를 직접 확인했다. 로그인 입력·시험 DB 쓰기·게임 조작·강제 종료는 하지 않았다.
- 남은 수동 확인: 게임 옆 오른쪽/왼쪽 붙이기, 드래그 후 분리, 같은 층 설정, 게임 최소화/복원, 게임 종료 시 저장/보관/취소, 테마 재실행 복원, DPI/다중 모니터. 실행 확인은 이 동작들의 완료를 뜻하지 않는다.
- 이번 후속은 검증·실행·인계 기록만이며 제품 코드·DB 구조/RLS/권한·버전·공개 공지·commit/push 변경 없음. 기존 무관한 미커밋 변경과 보호 큐를 보존했다.

## 2026-10-08 순월 — IRIS 애드온 바 후속 push 후보 / 실게임 확인 대기

- `IRIS for SANCTUM` 제목줄과 설정 화면을 추가했다. 설정은 영문 6테마, 게임 창 오른쪽·왼쪽·끔, 게임과 같은 층 유지로 구성한다. 네이티브 `:: 창 이동`, 클릭 통과, 불투명도, 전역 TopMost UI는 제거했다.
- Windows 창 추적은 `MabinogiMobile`·제목 `마비노기 모바일`을 읽기 전용으로 찾고 IRIS만 이동한다. 게임 최소화는 IRIS도 최소화하며, 게임 종료 후 저장하고 종료/보관하고 종료/취소를 묻는다. 창 핸들 교체·접근 거부·PID 재사용은 종료로 오판하지 않는다.
- 재화 강조는 환경·계정별 localStorage 설정만 저장하고 수량·조회 시각은 저장하지 않는다. 색상 대비 경고, Escape/바깥 클릭 닫기와 포커스 복귀를 포함한다. 캐릭터별 재화 DB 이력은 만들지 않는다.
- RAM companion 삭제 상태를 유지한다. DB 구조·RLS·권한·운영 직접 쓰기·공개 공지·Vercel 배포는 없다.
- 자동 검증은 전체 Node 테스트·tsc·native addon policy/bridge/WebView·합성 browser 및 게임 종료 실패 매트릭스를 통과했다. 실게임 창/DPI/최소화/종료는 집에서 후속 확인한다.
- 개발 서버에서 계정 기억 목록 effect 의존성 배열 길이 경고가 재현되어 ID·닉네임·역할 3개 의존성으로 고정하고 언마운트 후 늦은 반영을 막았다. `next build --webpack`은 이 호스트의 SWC baseUrl canonicalize 접근 거부로 별도 환경 확인이 필요하다.
- **집에서 첫 확인:** 정상 종료 후 `git pull --ff-only origin main`, 릴레이와 이 인계 문서를 읽고 새 IRIS를 실행한다. 게임 옆 붙이기, 창 이동 detach, 같은 층 해제, 게임 최소화/복원, 게임 종료 후 저장·보관 선택, 테마 재실행 복원을 순서대로 확인한다.
- 현재 사무실 호스트에서는 Git 인덱스/원격 쓰기 승인 한도에 걸려 commit/push가 아직 실행되지 않았다. 이 문서와 코드는 로컬 후보이며, push 후에만 집에서 pull한다.

## 2026-10-08 순월 — 감지 속도 후속 (미푸시)

- 한설 실게임 변경 추천 표시 확인, 약10초 지연 제보. DB/Vercel 주기 호출 증가 없음 조건으로 평소3초·첫 변화 후보1초 뒤 재확인을 승인했다. Watch를 완료 후 단일 timeout으로 변경, tracker의 미확인 후보를 사용해 후보별 빠른 재확인1회만 제공한다. 캐시 반복/실패는3초, 느린 native 요청 겹침/누적 및 숨김/잠금/이전 응답 방어는 유지한다. 카탈로그 재사용·fallback1회·선택/저장 경로 변경 없음.
- 검증: 속도 회귀가 기존10초 코드에서3초 후 읽기 없음으로 RED, 수정 후 합성 전체19/19.3초/1초 정확한 감지·느린 CLI 겹침 없음·중복 timestamp 뒤1초 루프 없음·DB스탯 GET/숙제 GET 불증가·스탯POST0·기존3경합/큐·draft/4폭 확인. 초기 테스트는 실제 hydration 경과를 타이머 기준으로 오인해 실패하여 frozen clock에서 실제 재선택/기준 읽기로 정렬했다. 실패 이후 cadence 기대도1초 실패→3초 복귀→1초 확인으로 수정했고 제품 안전 기준은 완화하지 않았다.
- 전체 Node321 exit0·독립tsc/대상lint exit0·비밀 환경 파일 없는 최종 사본webpack52 exit0. UI/native 명령/DB 구조·RLS·권한·스탯 저장·버전·push 변경 없음. 로컬 개발 창은 웹 변경으로 적용되며 강제 종료/재시작하지 않는다. 실게임 단축 체감/장시간 CLI 부하는 사용자 확인 필요(실CLI 시간을 측정해 보장하지 않음). 아래10초 기록은 이전 설계다.

## 2026-10-08 순월 — 애드온 바 방향·분류 시인성·캐릭터 변경 추천 (미푸시)

- 한설이 현 IRIS를 게임 옆에 상주하는 컴팩트 애드온 바로 정의했다. 애드온 바를 먼저 완성하고 조회/추천/저장 공통 모듈을 기반으로 별도 오버레이 버전을 확장한다. 현재 창을 완성된 오버레이로 안내하지 않는다. 작고 유용한 UX 개선은 제안/진행 가능하지만 DB 구조·권한·배포 승인을 뜻하지 않는다.
- 숙제 제목에 테마색 띠·왼쪽 표식·완료 배지, 보이는 분류 사이 얇은 구분선을 추가했다. 기존2열/전체 폭 횟수·분류 토글·전체 이름·저장 계약을 보존한다. 한설이 실제 `:: 창 이동` 표시가 명확하다고 확인했다. 아래 미표시/구창 기록은 과거 관찰이며 현재 표시 상태를 대신하지 않는다. DPI/다중 모니터 전체 확인은 여전히 별도다.
- `irisCharacterSwitch`/`DesktopCharacterWatch`: 선택 후 보이는 앱에서 약10초 간격 게임 읽기, 최초 기준값과 다른 후보가 서로 다른 신선한 관측2번에 안정적으로 일치할 때만 질문. 직업/다중 수치 변화·양수 비교2개·후보 간 차이를 확인하고 장비 단일 변화·0만 일치·부족/오래된 값·실패·애매한 후보는 제외한다. 네는 최신 재조회 후 선택만, 아니요는 유지/같은 후보 반복 억제, 다른 캐릭터는 기존 선택창. 자동 스탯 POST/신원·UUID 보증 없음.
- 로그인/스탯 탭의 기존 본인 카탈로그를 세션에서 공유하고 없으면1회 읽기 재시도한다. DB 카탈로그를 주기 조회하지 않는다. native 읽기 직렬화/진행 공유·기존 캐릭터별 숙제 큐/클래스 draft를 보존한다. 수동 선택 의도/계정 변경/종료/숨김/잠금 이후 늦은 결과는 동기 context version·generation으로 버린다. 선택창 호출 요청도 선택/계정 의도 때 초기화한다.
- 검증: 전체 Node321개(dot) exit0, 새 tracker9·6테마 렌더CSS3 포함. 독립tsc·새/좁힌 React lint·비밀 환경 파일 없는 사본 webpack52경로 exit0. 실제 DesktopPage/controller 합성 브라우저16/16·pageerror0·스탯POST0·4폭320/390/768/1280 통과; 기존 스탯/숙제 DOM도 통과. 수동 선택/종료 취소/숨김 복귀 경합3건과0-only 오판 RED→GREEN, 최초10초 tick 건너뛰기는 기준 읽기 시작 뒤 timer 등록으로 수정. 어두운/밝은 숙제·추천 캡처를 직접 확인했다. 좁힌 재리뷰 Important/Critical 없음; stale catch 안내도 version/generation 방어를 적용했다.
- 알려진 제한: 기존 page 기억 계정 effect lint 오류1/경고1와 Stats cleanup 경고1는 이 기능 이전부터 남아 있다. 합성 판정은 실제 게임/DB 검증이 아니다. 실제 게임 캐릭터 변경 후10~20초+조회 시간 추천/세 버튼을 한설이 확인할 차례다. 현재 파일은 로컬 후보, v2.154·DB 구조/RLS/권한·운영 직접 쓰기·commit/push/배포 변경 없음. 다음 우선 기능은 시낙시스 읽기 연결(아직 미구현).

## 2026-10-08 순월 — 숙제 약칭 2열 로컬 후보

- 실행 상태 후속 정정: 아래 PID31148/12:50 구창 기록은 당시 관찰이다. 마지막 확인에서는 해당 실행기가 없었고, transient PID23056도 실제 IRIS 창으로 확인되지 않았다. 13:41 최신 desktop.ps1 -Development를 숨긴 PowerShell로 시작(PID1432), 이후 동일 실행 요청은 단일 실행 경로로 exit0. Windows 창 확인 도구는 IRIS 창을 반환하지 않아 실제 표시/드래그는 아직 사용자 확인이 필요하다. 손잡이 독립 native fixture18/18 재통과, 강제 종료/DB 시험 쓰기 없음. 새 실행 요청만으로 미표시 해결을 판정하지 않는다.
- 최종 사용자 후속: 준비 중3개 보조 줄 제거(비활성 버튼 유지). 아코디언/외곽 구분 테두리를 없애고 기본 전체 선택된 일일/주간/어비스/레이드 표시 토글+우측 미완료만 체크를 제공한다. 분류 선택은 표시만 바꾸며 전송·조회·큐를 바꾸지 않는다. 어비스/레이드는 전체 원명을 cleanItemName으로 표시, 일일/주간만 약칭 우선. 실제 사용자 스크린샷으로 이전2열 UI 정상 적용 확인; 새로운 분류 토글은 합성/사용자 대기.
- 후속 검증: 새6/6·전체309/309·독립tsc/lint·합성 토글/전부 해제 안내/전체 이름/2열/횟수/필터/수동 저장2POST/4폭 통과. 최초 합성 실행은 viewport 전환의 행 위치 비교1건 실패했으며 동일 검사 재실행에서는 통과했다(제품 수정 없이 테스트 진단 문구/실패 캡처만 추가). 실제 native PID31148 시작12:50:46 그대로 실행 중, ×→보관하고 종료까지 사용자 안내. 손잡이 적용/재시작 완료로 보고하지 않는다.
- 최종 후속 사본webpack52경로 빌드 및 좁힌 독립 리뷰 통과(새 Important/Critical 없음). 실제 native 표시/드래그·DPI는 정상 종료 후 재실행 확인이 남는다.

- 한설 설계 승인: 체크형 숙제2열, 반복 횟수는 전체 폭 한 줄, 분류 제목에 완료 항목/전체 항목 수. 기존 remaining 필터·보류 복구 행·낙관적 대기 변경/15초 저장 정책 유지. 완료는 체크/수치+accent 배경/테두리로 구분하며 필터가 숨긴 항목도 분류 합계에는 포함한다.
- 기존 카탈로그 mobile_name→short_name→cleanItemName 표시 우선순위, name/ID/체크 매칭은 보존한다. /api/iris/kronos GET에서 확인된 기존 약칭 컬럼만 추가 조회, optional displayName을 검증해 DesktopCheckboard에 전달. 구형 서버의 name-only 응답도 지원하며 DB 구조/RLS/쓰기 계약/보호 큐 변화 없음.
- 테스트 우선 RED4→GREEN, 최종 관련37 및 약칭 GET 통합 포함 신규5/5·전체308/308·독립tsc·수정 파일lint·사본webpack52경로 통과. 합성 화면에서 약칭/2열/반복 전체 폭/완료합계/필터/기존ID 수동저장2POST·4폭 통과. 실제 계정·DB 쓰기 없음. native는 변경하지 않았고 PID31148의 변경 전 창이 여전히 실행 중이라 손잡이 정상 재실행/실제 drag·DPI 확인은 남음. 버전/commit/push 없음.
- 추천 네 버튼은 기존 freshStats 60초 경계로 렌더 갱신 시 비활성화된다. 이번 사용자 질문에는 설명만 했으며 추천 동작은 수정하지 않았다.
- 좁힌 교차 리뷰 새 중요 회귀 없음. 숫자ID 체크의 기존 contents.mobile_name 읽기/쓰기 카탈로그 비대칭은 HEAD에도 존재하며, 원명/약칭 충돌 합성에서 기준값 차이 가능성이 있다. 실제 충돌은 미확인·이번 매칭 변경 없음, BETA_FEEDBACK 별도 진단 과제. 완료 표시를 임의로 재해석하거나 운영 데이터를 수정하지 않는다.

## 2026-10-08 순월 — IRIS 상단·메뉴 계층 로컬 후보

- 한설 승인: 상위 크로노스/시낙시스/설정, 크로노스 아래 숙제/클래스/스탯/재화 및 비활성 물물교환/상점구매/임무게시판 미리보기. 크로노스 복귀는 마지막 하위 탭을 유지한다. 기존 폼·큐와 탭 변경1회/같은 탭0회 조회를 보존했다. 시낙시스 실제 정보 연결은 다음 작업이며 이번에는 구현하지 않았다.
- DesktopCenter/desktop.css의 상단 브랜드·생텀 선택 닉네임/직업은 스크롤 중에도 고정된다. 게임 신원을 자동 확인한 표시가 아니다. 저장 상태의 빈 줄을 제거하고 확인 시각/15초 설명은 접힌 저장 안내에 넣되 오류·복구 경고는 숨기지 않았다.
- desktop-webview.cs에 실제 드래그 Label `:: 창 이동`을 추가했다. 기존 네이티브 이동 메시지·하단 리사이즈를 유지하고 자동 높이는 실제 손잡이 높이를 합산한다. 현재 실행 중인 이전 native 창은 사용자 정상 종료 후 재실행해야 반영된다. 강제 종료/게임/운영 DB 조작 없음.
- 검증: 관련 UI20/20·전체 Node303/303·독립tsc·수정 React lint·비밀 환경 파일 없는 사본 webpack52경로 빌드 통과. 합성 DOM에서 메뉴 복귀/준비 중 버튼/스크롤 고정/선택창 Escape/재조회 횟수/입력 보존/네 폭 통과, native 손잡이 전용18/18 통과. 좁힌 독립 리뷰 Important/Critical 없음. 실제 드래그·DPI·화면 경계/다중 모니터는 사용자 확인 대기. 버전 v2.154·push/배포 변경 없음.
- 한설이 실제 재화 표시를 확인했다. 다른 캐릭터의 재화 이력/DB 저장은 의미가 적다는 결정으로 구현하지 않는다.

## 2026-10-08 순월 — 외부 RAM 도구 연결 제거

- 검증: 외부 호출/연결 파일 제거 회귀 RED→GREEN, 전체 Node301 검사 및 desktop/overlay PowerShell 파서 통과. 웹/DB 코드는 이번 제거에서 변경하지 않아 웹 빌드는 반복하지 않았다.
- 한설 명시 승인: IRIS를 공식 CLI/생텀 연결에 집중하고 외부 램 정리 연동은 제거한다. desktop/overlay의 자동 시작·트레이 연결과 ram-companion/configure/전용 fixture3파일 삭제. Git 이력에서 복구 가능하며 외부 EXE/개인설정/프로세스는 보존한다. 과거 연결 기록은 당시 상태로 보존하며 현재 기능이 아니다.
- 현재 실행 중인 이전 창에는 기존 메뉴가 남으므로 정상 종료/재실행 필요. 이미 실행 중인 별도 램 도구는 사용자 직접 종료 필요. 공식 CLI를 사용한다는 사실은 IRIS에 대한 넥슨 승인/무제재 보장이 아니다. 운영DB·버전·push 변경 없음.

## 2026-10-08 순월 — 재화/탭 재조회 로컬 후보

- 한설 승인: 재화 탭 추가, 탭 변경 때 해당 데이터1회 재조회, 같은 탭 재클릭은 조회하지 않음. 설정/미지원 시낙시스는 게임 조회 없음. 다음 우선 작업은 시낙시스 정보 연결이며 아직 미구현이다.
- `DesktopCurrencies.tsx`/`lib/irisCurrencies.ts` 및 고정 `game.currencies.read`→`get_currencies`만 허용하는 native 연결. DisplayName/Amount를 이름/안전한 정수 또는 미확인으로 정규화; 28종 실조회 이름/필드 구조 확인, 보유량은 문서/채팅에 기록하지 않았다. 재화는 읽기 전용·DB 저장 없음.
- 스탯 추천용 초기 관측 재사용을 제거: 탭 진입 때 생텀/게임 병렬 재조회, ↑확인 시 추가 재조회/CAS 유지. 첫 화면 값 차이의 코드상 원인 후보는 추천 snapshot 재사용이며 CLI 일시 값 변화까지 확정한 것은 아니다. 왼쪽 스탯 재조회/오른쪽 생텀 DB에 업데이트, 추천/확인 닉네임 accent 강조.
- homework/classes 전환은 기존 controller.refresh 읽기만 사용, 큐/입력 draft는 보존. 게임 읽기 직렬화 및 동일 종류 진행 요청 공유, 비활성 탭 늦은 응답 무시. 6탭은 3열2행으로 좁은 창에서도 조작 공간 보장.
- 검사: Node전체300 통과(처음 sandbox 로컬 연결/보호저장 실패 후 승인 권한에서 GREEN), 독립tsc·Windows bridge/currency 형식/보안 fixture·합성 스탯/재화 탭1회·같은탭0회·무자동POST·4폭 통과, 비밀 환경 파일 없는 사본webpack52경로 빌드 통과. 실제 새 native는 앱 정상 종료/재실행 후 사용자 확인 필요. 버전/commit/push/운영DB 변경 없음.

## 2026-10-08 순월 후속 — 로그인 추천/수동 업데이트 확인창

- 최종 후속 검증: 지연 조회 중 클래스 조작 가능·4초 추천 종료·늦은 추천의 수동 선택 덮어쓰기 방지 합성 DOM GREEN, 독립 tsc 및 비밀 환경 파일 없는 검증 사본 webpack 빌드52경로 통과. 새 UI의 실제 사용자 확인은 대기하며 push하지 않았다.
- 한설 실제 검증으로 네 개 스탯의 IRIS→생텀 업데이트와 웹/게임/IRIS 일치 확인. 클래스 전체 자동 읽기/공헌도 검증은 아니다.
- `DesktopStatsSession.tsx` 계정 키별 로그인 1회 병렬 조회, 4초 추천 제한·늦은 결과 무시·수동 선택 우선. 비교값2개 이상/수치 유사성·후보 간 간격을 확인하며 실제 UUID/신원으로 간주하지 않는다. 초기 신선한 게임 관측은 선택한 스탯 화면에서 재사용; Windows 조회 진행 promise 공유로 중복 native 호출 차단.
- `DesktopStatsConfirmation.tsx` 대상 닉네임 확인창은 ↑버튼 클릭 때만 표시. 네는 게임 재조회 후 기존CAS, 아니요는 본인 캐릭터 선택, 취소/Escape/바깥 클릭·초점/스크롤 복구. 조회 busy는 스탯 내부에만, 전역 busy는 수동 저장에만 적용한다. 계정/캐릭터 키 변경은 확인창/관측 격리. 기존 클래스/숙제 schema2 큐는 유지.
- `.iris-class-list` 전체/5행 이상은 내부 높이 제한, 짧은 계열은 자연 높이. 실제 새 UI/추천 지연/앱 재실행 확인은 사용자 대기. 공식 CLI28명령과 재화 이름에 공헌도/클래스별 레벨 없음; 길드 토큰을 공헌도로 매핑하지 않는다.
- 검증: 관련25/25·전체298/298·독립tsc 통과, 합성 DOM 추천/무쓰기·확인창 취소/아니요·게임 변경 재확인·단일POST·필터 스크롤/네 폭. 리뷰 지적의 느린 background 조회 전역 잠금은 합성 RED 재현 후 분리 수정. 사본 CSS의 이전 빌드 산출물 자동 탐색 오류는 검증 사본만 source 범위를 제한해 수정(제품 전역CSS 미수정). Native/DB API 변경 없음, 버전/commit/push/배포 없음.

## 2026-10-08 순월 — IRIS 수동 스탯 연결 로컬 후보

- a464ea6 최신 main 확인·YG-20261007-001 ACK. 승인된 묶음: 직업/스탯 후보 안내, 직접 닉네임 확인, 생텀 위/인게임 아래 비교와 수동 ↑업데이트. 수치 fingerprint는 변경 감지일 뿐 신원/UUID가 아니다.
- `lib/irisStats.ts`, `irisStatsTransport.ts`, `server/irisStatsWrite.ts`, `/api/iris/stats`, `DesktopStats.tsx` 및 Windows `game.stats.read` 연결. 기존 네 개 text 필드만 CAS 갱신, 누락 유지·0/감소·타인/경쟁 수정 차단. 게임 재조회 후 변경 시 확인 해제, 불명 결과 자동 재전송 없음. schema2 큐/클래스/숙제 계약 보존.
- 자동검증: 전체 Node295/295(실패/skip0), 독립 tsc 통과, Windows bridge/game normalize/epoch 및 WebView fixture PASS, 비밀 환경 파일 없는 사본 webpack 빌드52경로 통과. 새 모듈 lint 오류0(세대 ref cleanup 경고1); 기존 페이지의 effect lint 문제는 이번 작업과 무관하게 남아 있다. 개발 사본 Turbopack CSS 소스 탐색 오류로 합성 UI 검사는 Production 사본에서 수행한다.
- 실게임 수치·단위/실계정 저장·DPI·장시간·오프라인·충돌은 별도 사용자 검증 대기. 운영 DB 직접 실행/스키마/RLS/권한 변경 없음. 버전 v2.154 유지, commit/push/배포 없음. 기존 무관한 루트 명령어 및 public/recruitment 변경은 보존한다.
- Production 사본 합성 DOM: 확인 전 차단·업데이트 직전 값 변경 재확인·누락 유지/0/감소·단일 POST·주기적 게임 조회 없음·다시 읽기 확인 해제·320/390/768/1280px 가로 넘침 없음 PASS. 실제 DB/게임 대신 합성 API/native 채널을 사용했다.
- 독립 읽기 전용 리뷰: Critical/Important 없음. Minor 로그인 만료를 게임 연결 오류로 안내하는 문제는 인증 안내 보존으로 수정했다. 후속은 좁힌 스탯 테스트로 확인한다. 실게임/DB/DPI/장시간은 리뷰 완료 범위가 아니다.

## 2026-10-07 21:24 KST 영겁 — v2.154 공식 push 준비

- 최신 분리 webpack Production 빌드51경로 exit0, 비밀 환경 파일 미복사·가짜 공개 설정 사용. staged39파일에서 무관한 공지 초안/삭제/테마 테스트·바이너리/환경값 제외 확인. 빌드 설정의 타입 건너뛰기는 별도tsc로 보완한다.

- 한설 명시 승인으로 IRIS 누적 클래스 편집/저장 확인 시각/전용 탭 후보를 main에 반영한다. 원격main pull 최신, 전체294/294·타입·합성 클래스 화면·보호저장/브리지 통과. 운영 배포/실화면 확인은 후속 기록한다. 무관한 공지 초안/루트 삭제/테마 테스트는 로컬 보존·미포함, 공개 공지 없음.
- DB 구조/RLS/권한/직접 운영 데이터 쓰기 없음. 기존 보호 큐schema2 전환은 새 앱 실행 때 적용하며 구버전 역호환 없음. 이전 기준94637ce/v2.153. 실제 계정 클래스 저장/DPI/장시간·오프라인·실충돌 및 자동 스탯/시낙시스는 미완료 경계 유지.

## 2026-10-07 영겁 — 클래스 전용 탭/게이지 로컬 후속

- 승인 범위만 구현: 숙제 목록에서 클래스를 분리한 5번째 센터 기능 탭, 숫자/게이지 편집, 6계열 필터, 높이 제한 내부 목록. 새 `DesktopClasses.tsx`가 표시를 담당하며 기존 controller/API/15초 자동저장·지금 저장 계약은 변경하지 않았다.
- 미등록 레벨은 빈 값 유지, 기존65초과 값은 게이지 최대값을 확장해 보존. 오류/복구 보류 행은 계열 필터로 숨기지 않는다. 게임 자동 클래스 읽기·스탯 연결은 이번 변경에 포함하지 않았다.
- 좁힌 검증: 관련 UI15/15, 타입 exit0, 합성 브라우저 탭 분리/게이지/오류 필터/수동 저장/포커스/4폭 통과. 전체 suite/native/빌드는 반복하지 않았다. 실계정/게임 쓰기 없음, 사용자 확인 대기, commit/push 없음.

## 2026-10-07 영겁 — IRIS 클래스 직접 수정 로컬 후보

- 한설 승인: 선택 캐릭터의 생텀 DB 값을 기본값으로 직접 입력, 닉네임 재확인 없음. 숙제와 동일한 마지막 유효 조작/캐릭터 이탈 후15초 자동저장 및 선택 캐릭터의 지금 저장·변경 버리기 사용. 게임 전체 클래스 자동 읽기는 지원 계약이 없어 구현하지 않았다.
- `/api/iris/classes`는 기존 세션/소유자/활성 클래스 ID 검증 후 `characters.levels`의 해당 이름 키만 병합한다. null 등록/레벨 감소1~1000 허용, 잘못된 원본 편집 금지, 다른 키 보존, 전체 원본 CAS409, JSON 스트림64KiB 제한. DB 구조/RLS/권한/직접 운영 데이터 변경 없음.
- task/class 공통 schema2 큐 및 Windows DPAPIv2 저장. v1을 엄격 검증→v2 쓰기/검증→원본 암호문 recovery 백업으로 이동한다. 실패/두 활성 버전 공존은 잠금하며 자동 전송하지 않는다. 구버전 앱으로 롤백해 v2 큐를 읽는 것은 지원하지 않는다. 실제 큐·계정 프로필은 자동 검사하지 않았다.
- 클래스 입력은 작은 아코디언 내 숫자 입력이다. 오류 원문은 메모리 보존, 해당 캐릭터 전체 저장/전환/일반 종료 보류; 다른 캐릭터의 유효 대기는 독립 전송. 원복 no-op은 초안 제거, 느린 전환 직전 오류 재검사, 충돌 버리기는 최신 서버 기준 재조회 후 초안 제거. 마지막 저장 확인 시각은 기존 캐릭터별 피드백 유지.
- 최종 자동검증: Node292/292(fail/skip0), 독립 tsc exit0, Windows store/bridge/host/lifecycle/overlay/WebView6스크립트 PASS, 합성 브라우저 클래스15초/수동 저장·오류 보류·포커스 및72폭/테마/글자조합 PASS, 비밀 환경 파일 없는 분리 소스 빌드51경로 exit0. 최초 사본 빌드의 hooks/types 누락은 사본 보완 후 재검증했다. native 잠금실패 뒤 추가 Replace에서 일회성 파일 오류가 있었으며 별도 재실행과 최종6검사에서 재현되지 않았다; 실패 시 원본 보존/전송 잠금 유지.
- 최종 독립 리뷰: 미해결 Critical/Important/Minor 없음. 전환 중 오류·원복 초안·설정 안내3건은 회귀 검증 후 수정. 실제 DB/실계정/게임/DPI/장시간/오프라인 실큐 검증은 미완료. 기존 웹의 전체 levels 저장이 이후 값을 덮어쓸 위험은 별도 과제로 남긴다.
- 현재 폴더 기존 미커밋/무관한 공지 초안·테마 파일·루트 삭제 보존. commit/push/배포/버전/공개 공지 없음. 다음은 IRIS 숙제→클래스의 기본값 확인 후 한설이 직접1개 변경→15초→웹 비교, 지금 저장/캐릭터 전환 확인 순서다.

## 2026-10-07 19:41 KST 영겁 저장 시각 피드백 — 로컬 후보

- 후속 클래스 계약 확인: 사용자가 기능 목록 조회만 명시 승인했고 공식 CLI capabilities exit0/28명령/loading없음을 확인했다. 전체 클래스·클래스별 레벨 계약 없음. get_my_info Level은 클래스 레벨로 간주하지 않는다. 실제 캐릭터 정보/게임 명령/DB 쓰기 없음. 상세 IRIS_STATS_CONTRACT.md. 앞선 안전 검토 차단은 승인 전 기록으로 보존한다.

- 한설이 실제 체크 후 마지막 저장 시각 피드백을 요청/승인했다. 사용자 정상 종료 및 프로세스 부재 확인 후 수정. controller에서 계정·캐릭터별 서버 성공 응답/값 재확인 시각을 메모리에만 기록, 선택 캐릭터의 날짜·초/KST를 표시한다. 실제 DB 수정 시각과 구분하며 시작 전 과거 시각은 추정하지 않는다. 실패/불명/버리기/변경 없는 저장은 성공 시각을 갱신하지 않는다.
- 회귀3개 RED→GREEN, 표시 회귀1개, 전체273/273·별도 타입 통과. DB/큐 스키마·조회 횟수·15초 저장 정책 변경 없음. UI 실제 사용자 확인은 대기. commit/push 없음.
- 전체 합성 browser fixture는 수동 저장 POST1개/표시 측정 후 기존 로그인 `input[type=password]` 선택자 fill timeout(124행)으로 실패했다. SecretCodeInput 재사용 후 선택자 호환 조사 필요, 전체 브라우저 통과로 보고하지 않는다. 이 실행은 실제 계정/쿠키/DB를 사용하지 않았다.
- 클래스: 사진은 생텀 저장값이며 게임 전체 클래스 조회가 아니다. 한설은 게임에서 읽은 레벨→생텀 저장 버튼→닉네임 직접 확인→저장을 요청했다. 지원 계약 재조회용 공식 CLI capabilities 실행은 안전 검토가 게임 연결 영향 위험으로 차단, 실행/우회 없음. 기존 문서로 전체 클래스 조회 지원은 미확인. 읽기 계약 확인 및 수동 연결 설계 승인 후 별도 구현할 것. 현재 목록을 게임 관측값으로 재저장하지 않는다.
- 작업 중 발견한 무관한 루트 한글 파일2개의 삭제 상태는 이 작업에서 발생시키지 않았으며 보존/미포함 대상이다.

## 2026-10-07 19:27 KST 영겁 재개 확인 — 로컬 기록

- 순월 SW-20261007-001 수신/ACK, HEAD 9012a7d에서 main fast-forward pull 최신 확인. 기존 공지 초안 변경 및 미추적 테마 검증 파일 보존. 새 commit/push/배포 없음.
- 전체 `node --test` 269/269 통과(실패·스킵0), 별도 `npx tsc --noEmit` exit0, diff --check 통과. 첫 제한 환경 실행은 루프백/임시 파일 접근 거절로 실패했으며 허용된 환경 재실행과 구분한다.
- 확인 시 로컬3000 리스너 및 desktop/overlay PowerShell 실행 없음. 다음 사용자 수동 검증은 미저장 보관 종료→재실행 복구부터 진행한다. 게임/로그인/운영 DB를 대신 조작하지 않는다. 집 RAM 경로 별도 설정·DPI·오프라인/충돌·장시간은 미완료 유지.

## 2026-10-07 14:53 KST 순월 push·운영 확인

- 94637ce main push 완료, GitHub Vercel success/Deployment has completed·2xTYjZq58ApFTjdvhRbgBez24ga1. 핵심7화면/health200·IRIS 조회2개401, 실제 브라우저 전용 앱 안내 및 운영 자산 신규 인증 문구 확인. 대시보드 Ready 직접 열람은 로그인 필요로 미확인, 배포 성공 신호 확인과 구분한다.
- 전체269/269·타입·분리 빌드static50·Windows 검사 및 사용자 실검증 인계 완료. 장시간/DPI/실충돌·오프라인 미저장 큐 검증은 남음. 집에서는 main pull 후 본 릴레이 ACK, 램 경로 별도 설정. 후속 문서 push는 구조 변경 없음·버전v2.153 유지. 모집 이미지 폴더는 미포함 보존.

## 2026-10-07 14:50 KST 순월 후속 push 승인

- 한설이 남은 검증 후 push 요청. 앞선 요청대로 v2.153 유지·공개 공지 없음. main25ee771 최신 pull 확인. 로그인/트레이 보완·램 연결·검증/릴레이만 포함, public/recruitment 제외.
- 최종269/269·타입·Windows 보호저장/브리지/종료/잠금/RAM9/overlay-support41/checkboard8/합성 WebView 통과, 분리 Production 빌드 exit0/static50. 사용자 실로그인/숙제/재실행/단축키/트레이 확인. 장시간·DPI·실충돌/오프라인 큐는 미완료.
- 집 PC 램 연결은 configure로 별도 설정, 기본 꺼짐. EXE/SDK/프로필/AppData 미포함. 직전 기준선25ee771 / Vercel EmrkhKQZaxeJWpXv17R2e1aXG9N8(success). DB 구조/RLS/권한 변경 없음. 배포 확인은 후속 기록.

## 2026-10-07 순월 로컬: 사용자 IRIS 연동 확인

- 트레이 수정 실검증 완료: 수정본 재실행 후 메뉴 한글 정상 표시 및 트레이 입력 복구 사용자 확인. 앞선 트레이 대기 기록은 해소. 미저장 큐 복구·충돌·네트워크 실패·DPI·장시간 검증은 별도 미완료 유지.
- 트레이 후속: desktop.ps1 UTF-8 BOM 누락으로 Windows PowerShell5에서 메뉴 한글 깨짐 재현. BOM만 추가, 실제 파서 한글 회귀 RED→GREEN·전체269/269 통과. 정상 재실행 후 메뉴/트레이 복구 사용자 확인 대기. push 없음.
- 클릭 통과 후속: Ctrl+Alt+O 전환 사용자 확인 통과. 트레이를 통한 입력 복구는 별도 대기.
- 단축키 후속: Ctrl+Alt+I 창 숨김/복원 사용자 확인 통과. Ctrl+Alt+O 클릭 통과·트레이 복구는 아직 대기.
- 후속: 정상 종료 후 동일 개발 실행기 재실행, 로그인 폼 없이 쌍월/장궁병·일일 미션 체크·미저장 없음 유지 사용자 확인. 미저장 보호 대기함 복구/계정 격리와 장기 로그인 유지 검증은 별도 대기. 재실행은 어두운 테마로 표시되어 녹색 테마 유지까지 검증하지 않았다.
- 로그인 오류 안내/한글 입력 후보 수정 후 전체 Node268/268·타입 통과. 한설이 실제 로그인, 쌍월/장궁병 선택, 웹과 일일 체크·주간 횟수/체크 일치 및 IRIS '미저장 변경 없음'을 확인했다. 어두운/녹색 계열 테마 전환도 스크린샷 확인.
- 실제 저장 경로의 자동/수동 구분과 정확한 15초 지연, 정상 종료 후 로그인/숙제 유지, 보호 대기함 복구, 단축키/DPI는 수동 검증이 남는다. 스탯 자동DB·시낙시스 연결 완료로 보지 않는다. 상세: `docs/IRIS_VALIDATION_20261007.md`. 버전업·commit/push·배포 없음.

## 2026-10-07 순월 로컬: 램 도구 함께 시작

한설 요청으로 `iris/ram-companion.ps1` 및 연결 설정 스크립트/회귀 검사를 추가하고 desktop/overlay 트레이 생성 경로에 연결했다. 설정은 사용자 AppData, 기본 꺼짐/사무실 PC 명시 켜짐. 기존 램 도구 재사용·시작 경쟁 Mutex·파일 누락/설정 실패 시 IRIS 계속 실행·실행 폴더 지정·종료 시 외부 도구 유지. 실제 기존 두 프로세스 재사용과 Windows PowerShell 회귀9개/트레이 생성 검증. 전체 IRIS 재시작/실제 미실행 EXE 시작은 수동 검증 대기. 상세 조사 `IRIS_CONNECTOR_REVIEW_20261007.md`: 커넥터 활성화 후 기존 IRIS 실제 조회 성공, 램 UI500MB/5초와 Downloads 설정2000MB/45초 불일치 원인 미확정. 코드/자료 복사·생텀 DB·버전업·commit/push/배포 없음.

## 2026-10-06 18:53 KST v2.153 운영 확인

- a99481f main push 및 Vercel dpl_54HeX3xKBDPYjGDgDR5Gefnxew5p READY/production, sanctum-tawny-three.vercel.app 연결 확인. 새 비로그인 실제 브라우저의 핵심7페이지200, desktop 전용 앱 안내/전역 메뉴 숨김, pageerror0. IRIS 두 GET API401, 운영 홈 v2.153 확인.
- 공개 공지/운영 직접 데이터 쓰기/로그인 입력/게임 조작/DB 구조·RLS·권한 변경 없음. 운영 실로그인 뒤 숙제저장·게임 위 새 후보/DPI는 미확인으로 유지한다. 이전 화연 실로그인·체크 웹 반영 확인과 이번 배포 자동/비로그인 확인을 혼동하지 않는다.
- 검증 기록만 후속 push하며 구조 변경 없음. 기존 docs/UPDATE_POST_v2.151.md 변경과 tests/kronos-theme-preview.mjs는 미커밋 그대로 보존했다. SDK/프로필/ignored 검증 자료는 미포함. 복귀 기준선 v2.152 cfa0bc7 / dpl_74MV3teDdw3GeFNiw2jPsjU3xuy7.

## 2026-10-06 18:47 KST v2.153 조용한 push 승인

- 한설이 기존 IRIS 정상 종료를 확인하고 남은 주간 사용량5%에서 검증 후 생텀에 조용히 push하도록 요청했다. IRIS 누적 후보 포함, 공개 공지 없음. 원격 main cfa0bc7과 fast-forward pull 확인.
- 현재 후보/보호 큐를 보존하고 SDK·프로필·ignored 합성 자료·무관한 이전 공개 공지 초안 변경은 제외한다. 자동 스탯 쓰기/시낙시스 미지원·게임/DPI 수동 게이트는 유지한다. Git 배포 승인은 게임 조작/운영 DB 직접 쓰기 승인이 아니다.
- 검증/코드 커밋/Production READY·실페이지 확인 결과는 후속 기록 참조. 직전 정상 배포 dpl_74MV3teDdw3GeFNiw2jPsjU3xuy7.
- push 직전 전체260/260, tsc, UI72조합, native overlay/WebView/bridge/store/shared-lock, 분리 생산 빌드 exit0을 다시 확인했다. staged111소스/문서 파일, SDK/프로필/ignored자료 제외. 무관한 docs/UPDATE_POST_v2.151.md와 tests/kronos-theme-preview.mjs 변경은 로컬에 보존한다.

## 2026-10-06 둥근 컴팩트 HUD — 로컬 후보, 게임 수동 검증 대기

- 승인한 1단계 계획을 현재 dirty 폴더에서 이어 구현했다. DesktopCenter의 작은 버튼형 센터, 캐릭터 선택 패널, 숙제/스탯/시낙시스/설정 4칸, 1열 숙제 아코디언·남은 항목 필터, 캐릭터별 저장 요약을 추가했다. 기본 일일만 펼치고 나머지는 접는다. 저장/불명·충돌 복구는 접어도 유지된다.
- desktop-overlay.cs가 borderless/TopMost·상단 드래그·하단 리사이즈·Ctrl+Alt+I 표시/숨김·Ctrl+Alt+O 클릭 통과와 트레이 복구를 소유한다. 두 단축키를 확보하지 못하면 클릭 통과를 막는다. 실제 내용 높이를 네이티브에서 한 번에 제한 측정해 접으면 창도 줄인다. 기본 폭420, 범위320~480, 작업 영역 안으로 제한한다.
- overlay.state/input/opacity(50~100 정수)만 엄격 브리지로 연결했다. 출처/문서 epoch/요청 ID/기존 DPAPI 큐를 유지하며 새 저장 타이머나 DB 폴링을 만들지 않았다. 15초 자동저장/지금 저장/계정·기간 격리는 기존 엔진 그대로다.
- 합성 브라우저72폭·글자·테마 조합, DOM/포커스/스크롤·아코디언 유지, 한 번 체크, 패널 바깥 클릭/Escape 통과. 실제 자식 WebView 위에서 합성 뒤쪽 버튼으로 클릭 전달, 핸들 재생성/단축키 충돌·해제, 네이티브 높이 축소, HttpOnly 합성 로그인·비어 있지 않은 보호 큐 유지·stale epoch 거절을 검증했다. 최종 전체 검사/독립 리뷰 결과는 아래 후속 기록을 참조한다.
- 사용자의 실행 중 앱을 강제 종료/새로고침하지 않았다. 기존 후보 정상 종료 뒤 같은 전용 프로필의 새 후보 하나만 실행해 실제 게임 위 가림·입력/투명도·DPI/다중 모니터·15초 저장을 확인해야 한다. 웹 화면만으로 오버레이 완료를 선언하지 않는다. 구형 기본 실행기는 교체하지 않았다.
- docs/IRIS_STATS_CONTRACT.md: 공식28명령에서 네 개 스탯 필드는 확인했으나 현재 캐릭터 식별자/닉네임·전체 캐릭터 조회·길드공헌도 계약 없음. 자동 스탯 DB 갱신은 비활성, 추정 신원 쓰기 금지. 시낙시스는 미지원 안내만 표시한다.
- 운영 DB/스키마/RLS/권한·실게임 조작·비밀값 추출·commit/push/배포/공지 없음. 현재 계획의 ignored 작업 폴더는 미커밋 및 수동 검증 증거 보존을 위해 남긴다.
- 최종 결과: Node260/260 fail0, 별도 tsc exit0, 합성 브라우저72조합·실제 WebView 입력/선택영역/DOM 유지·보호 큐/문서 epoch·네이티브 단축키/클릭 전달/단일 실행 통과, 가짜 공개 환경 설정의 분리 소스 빌드 exit0, diff --check exit0. 최초 빌드 준비 명령의 cwd 실수로 저장소에서도 빌드가 한 번 완료됐고 이후 분리 경로로 정정했다. .next 삭제/서버 종료 없이 로컬 desktop200을 확인했다.
- 독립 최종 리뷰 중요2건 처리: 접힌 높이의 종료 모달 잘림 RED→뷰포트 제한 내부 스크롤 GREEN(320/420폭·260높이 저장 실패 경고 포함); 합성 접속 코드의 값/선택영역/DOM/포커스가 배경 갱신과 실제 WebView 통과/트레이 복구 후 유지됨. 실제 코드 값은 사용/출력하지 않았다. 경미 보류: 지금 저장/버리기의 선택 캐릭터 범위 표기와 개별 복구 행 캐릭터명은 후속. keep 완료 뒤 네이티브 종료 응답 실패 시 기존 엔진은 편집 잠금을 유지하므로 종료 재시도/트레이 복구로 마무리한다.
- 한설 다음 확인 한 단계: 기존 IRIS를 정상 종료했다고 알려주면 후보를 하나만 재실행하고 작은 센터/접기/단축키부터 게임 위에서 대조한다. 운영 푸시/스탯 저장 활성화는 하지 않는다.

## 2026-10-06 컴팩트 오버레이·스탯 후속 방향

- 한설이 화연 로그인·캐릭터 목록·직접 체크의 웹 크로노스 반영을 확인했다. 현재 큰 내장 창은 일반 프로그램이며 게임용 오버레이 완료가 아니다.
- 센터까지 작은 오버레이로 통합하고 실제 읽힌 본인 캐릭터의 변경 스탯을 저장하는 작성 설계서를 승인했다. 1단계 계획 `docs/superpowers/plans/2026-10-06-iris-compact-overlay.md` 실행 및 둥근 버튼/아코디언 방향을 승인받았다. 위 로컬 후보 기록이 최신이며 실제 스탯 쓰기는 검증된 계약 기반 별도2단계 계획 대상이다.
- 길드공헌도·전체 캐릭터 읽기·자동 식별은 현재 확인되지 않았다. 검증된 식별 없이는 스탯 쓰기를 활성화하지 않는다. 기존 로그인 프로필·보호 숙제 대기함·공유 실행 잠금 유지, 구형/신규 저장 주체 동시 실행 금지.

## 2026-10-06 재부팅 후 후보 실로그인 점검

- 로컬 `/iris/desktop`의 캐시 의존404는 서버 정상 종료 후 검증된 `.next/dev`를 `.next/dev-reboot-check-20261006`으로 보관 이동하고 재시작해200으로 복구했다. 소스/사용자 데이터 삭제 없음. 개발 서버 exec session1011, 내장 후보 프로세스19952에서 한설이 화연으로 직접 로그인했다(서버 로그인200/캐릭터GET200).
- 캐릭터 목록200 뒤 앱 오류가 보였다. 등록 코드의 합법적인 빈 별칭을 desktop transport가502로 거절하는 경우를 재현·수정했다. 조회 실패와 실제 빈 계정을 구분하고 재로그인 없이 읽기 전용 재시도를 제공한다. 실응답 본문/쿠키/비밀값 추출 없음. 화연 실제 목록은 새 코드 로드 후 수동 확인 대기다.
- 후속 검증: Node254/254, 독립tsc0, 합성 브라우저 빈 별칭·조회503후재시도·재조회0POST·72레이아웃 통과. 운영 DB 변경/저장·게임 조작·commit/push/배포 없음.

## 2026-10-06 IRIS 생텀 데스크톱 — 로컬 수동 검증 후보

- 기존 미커밋 변경을 보존한 채 승인된 desktop 계획 Task1~6과 선택 실행기 후보를 구현했다. 아래 이전 날짜 기록의 ‘DPAPI/UI 미구현’은 당시 상태다.
- `iris/desktop.ps1 -Development`는 WebView2 전용 프로필과 `/iris/desktop`을 연다. 기존 실행기는 자동 교체하지 않았다. 두 실행기는 사용자별 공유 OS mutex로 동시에 큐를 실행하지 못한다. 후보는 게임 읽기 서버/단축키를 새로 시작하지 않는다.
- 기존 생텀 인증 API와 HttpOnly 세션을 사용한다. 코드는 입력 직후 UI 상태에서 제거하며 저장하지 않는다. 계정 표시 목록만 localStorage에 둔다. 미저장 항목은 환경·계정·캐릭터·기간별 Windows CurrentUser DPAPI 보호 파일에 보관한다.
- 캐릭터별 마지막 조작/떠남 후 15초 자동저장, 지금 저장/버리기, 계정 전환, 불명확 결과의 명시적 확인·재시도, 저장/보관/버리기 종료를 제공한다. 401 재인증 시 이전 큐는 보류한다. 오프라인 보관 종료는 조회하지 않는다. 보호 저장 실패 시 손실 경고 종료와 트레이 복구 종료가 별도로 있다.
- 배경 저장 중 DOM/포커스/접힘/스크롤 유지, 72개 폭·글자·6테마 합성 브라우저 검증 통과. 복귀/06시 경계 재조회는 기존 대기 항목을 덮어쓰지 않는다. 게임 명령/수령 기능은 아니다. 클래스 레벨은 생텀 저장값이다.
- 독립 리뷰의 중요 사항 5개를 재현 테스트 후 수정했다. 실제 로그인·유지·계정 전환·15초 자동저장·수동 저장·재실행 복구·게임 위 사용성과 복구 종료 확인은 한설 수동 대기다. 실제 기존 오버레이 깜빡임/10초 저장 지연 해결이나 기본 센터 통합 완료로 확대하지 않는다.
- 운영 DB/구조/RLS/권한·배포·공지·commit/push 없음. SDK ignored 캐시가 필요하며 Production 새 경로는 배포되지 않았다. 로컬 개발 서버를 켠 뒤 기존 IRIS를 종료하고 후보만 실행한다.
- 최종 회귀: `node --test tests/*.test.mjs iris/*.test.mjs` 252/252, native store/bridge/WebView/singleton/shared-lock 통과, 격리 브라우저 72조합 통과, 최신 분리 소스 사본 production build 통과. 빌드는 기존 ignoreBuildErrors 설정을 사용하므로 독립 `tsc --noEmit` 결과도 별도로 확인한다. 운영 요청/실제 계정은 사용하지 않았다. 저장 상태 카드의 내부 캐릭터 ID를 닉네임·항목명으로 바꾸는 작은 개선은 보류했다.
- 독립 `tsc --noEmit` exit0. 합성 브라우저 측정: 편집→표시47ms, 지금 저장→POST30ms, POST→ack 표시846ms(인위적 응답 대기500ms 포함), POST1개. 의도된 자동 대기15000ms와 전송 시간은 별개다. 운영1초 저장 보장은 하지 않는다.

### 완료 조건 대응 / 남은 게이트

- 타이머·원복0쓰기·즉시 저장·버리기, A/B 독립·late 응답·inflight 후속 편집: desktop queue/controller tests.
- 부분 성공·CAS 충돌·응답 유실·401 계정 격리·소유권 거절: controller/transport 및 기존 iris-api/iris-kronos-write 합성 tests.
- 06시·월요일·시간대·과거 기간: kronos-black-hole, iris-kronos-write, controller tests. 복귀 재조회: actual browser focus fixture. 실제 절전/시계 변경은 수동 대기.
- 큐 손상·원자 교체·중복 실행·종료/복구: native store/bridge/lifecycle/shared-lock, controller tests. 실제 디스크 고장·OS 로그오프·강제 프로세스 종료는 검증하지 않았다.
- 유휴0POST·연속 편집 병합: queue/controller tests. 화면 안정성·읽기 재조회 제한·72레이아웃: 격리 browser fixture.
- 실제 코드 입력→재실행 로그인 유지→A 체크/B 전환→15초 뒤 A 웹 반영→지금 저장→계정 전환→로그아웃은 한설이 직접 수행한다. 한 번에 한 단계씩 안내한다.


## 2026-10-05 IRIS 내장 호스트 gate 및 인증 controller — 로컬 후보

- 한설이 공식 WebView2 개발 SDK의 프로젝트 내 확보를 명시 승인했다. Microsoft.Web.WebView2 1.0.4258.31 NuGet 패키지를 ignored `iris/vendor/webview2/`에 다운로드·추출했고 SHA256과 공식 URL을 `iris/webview2-package.json`에 고정했다. win-x64 loader의 Microsoft Authenticode Valid 확인. OS/runtime/.NET SDK 설치 없음.
- `desktop-webview.cs` 후보를 기존 PowerShell에서 컴파일·실행했다. 합성 요청 interception으로 localhost:3000 실제 서버를 사용하지 않고 fake HttpOnly 쿠키를 검증했다. 첫 browser process 완전 종료 후 새 process에서 프로필 유지, JS 쿠키 접근 차단, 외부 navigation/frame/popup/redirect 차단 통과. 실제 로그인·보호 대기함 bridge·overlay launcher 전환은 미완료이며 기존 실행 경로는 그대로다.
- Task3: `irisDesktopTransport.ts` 및 `irisDesktopController.ts`, 합성16 tests. cookie same-origin/응답 schema·ownership identity 검사, 불명확 POST 재전송0, 직렬 저장, 계정 전환/종료 편집 잠금, late A ack→B 표시 격리, 즉시 저장, partial success, 유휴60초 POST0, 기간 변경 전송0, durability 실패 전송0을 검증했다. 저장 종료 중 잠금 해제와 protected-store 대기 중 이전 캐릭터 선택이 뒤늦게 덮어쓰는 문제를 RED→GREEN으로 수정했다.
- 보호 store는 TypeScript 인터페이스/합성 IO뿐이고 DPAPI 구현/UI/실제 API·운영 저장에 아직 연결하지 않았다. unknown GET이 base 그대로이면 보류하며 명시 재시도/폐기 UI는 후속 보호 복구·UI 단계에서 구현한다. 실제 저장 시간이나 실제 깜빡임이 해결됐다고 주장하지 않는다.
- 현재 기존 미커밋 변경 모두 보존. commit/push·배포·운영 DB 변경·게임 조작·접속 코드 입력 없음. 다음 순서는 Task4 기존 서버 계약 회귀, Task5 DPAPI 대기함, Task6 앱 화면, Task7 단일 창 연결·사용자 검증이다.
- 이번 체크포인트 검증: 전체 Node 합성226/226, npx tsc --noEmit exit0, 정책16, 내장 WebView2 합성 gate 통과. 운영 로그인·실저장·게임 위 시각 검증은 포함하지 않는다.

## 2026-10-05 IRIS 앱 전환 착수 — 저장 큐 검증, 내장 호스트 의존성 승인 대기

- 한설이 구현 계획을 “진행하자”로 승인하고 기존 폴더에서 이어가기를 선택했다. 현재 codex/iris-checkboard-classes의 미커밋 변경을 보존한다. 기존 main 체크아웃으로 가정하지 말 것.
- iris/desktop-host.cs는 실행 호스트가 아닌 navigation/profile policy만 구현했다. 정확한 운영 HTTPS origin 및 개발 localhost:3000을 분리하고 사용자 브라우저 프로필 복사 없이 전용 프로필 경로를 산출한다. RED→GREEN 16 assertions. iris/desktop-probe.ps1은 읽기 전용이다.
- Probe: WebView2 Runtime 154.0.4258.53 있음, repo vendor/표준 NuGet 캐시에 WinForms managed SDK 후보 0개, dotnet SDK 없음. 실제 WebView2 화면·쿠키 재실행 유지·종료·브리지 검증은 미완료. 설치/SDK 확보 승인 전 내장 앱 경로로 교체하지 않는다.
- lib/irisDesktopQueue.ts: 캐릭터별15초 deadline, 전환 시 이전 캐릭터 재예약, 기준값 병합/원복0쓰기, 지금 저장/미전송 폐기, 단일 in-flight claim, 저장 중 successor 보존, 늦은/중복 응답 격리, unknown·충돌·기간 만료 자동 재생 차단. 환경/account/character/category/task/period로 격리한다. snapshot은 detached·엄격한 schema·500건/1MiB 제한이며 restore 시 pending/inflight를 unknown으로 보류한다. controller 인증·조회 확인은 아직 없음.
- 새 큐18 tests RED→GREEN, 기존 포함 전체210/210, npx tsc --noEmit, policy16, git diff --check 통과(LF→CRLF 안내만). 최초 sandbox suite의 localhost/temp 접근 실패는 정상 Windows 환경 재실행192/192으로 분리했다.
- 아직 화면/API/DB에 새 큐를 연결하지 않았다. 15초 실제 자동저장·암호화 대기함·새 로그인 완료라고 표현하지 않는다. commit/push·배포·운영 DB 변경·게임 조작 없음.
- 진행 기록: .superpowers/sdd/2026-10-05-iris-sanctum-desktop/progress.md. Task1 partial/runtime gate, Task2 complete(미커밋 코드), Tasks3–8 pending. 다음은 승인된 WebView2 SDK 확보 및 Task3 인증 controller; Task7 기본 native 전환은 Task1 실제 gate 통과 뒤에만 한다.

## 2026-10-05 IRIS 생텀 전용 앱 전환 — 설계 승인·구현 계획 검토 대기

- 한설이 반복적인 외부 브라우저 연결/읽기·쓰기 승인 대신 앱 내 생텀 로그인 유지·본인 캐릭터 선택·캐릭터별 15초 자동저장 방향을 승인했다. 계정은 한 계정씩 전환하는 권장안, UI는 둥근 카드/버튼 기준이며 대규모 디자인 정리는 기능 안정화 뒤다.
- docs/superpowers/specs/2026-10-05-iris-sanctum-desktop-design.md 작성. WebView2 내장 화면을 우선 검증 후보로 기존 HttpOnly 세션/API 재사용, 캐릭터별 독립 대기·계정 전환 시 격리·06시 기간 경계·불명확 POST 재전송 금지·암호화 복구 큐·종료 경계를 정리했다. 새 런타임 설치/제품 전환은 실행 가능성 검증 및 계획 승인 전 하지 않는다.
- 한설이 설계서를 “좋아”로 승인했다. docs/superpowers/plans/2026-10-05-iris-sanctum-desktop.md에 실행 가능성→캐릭터별 큐→인증/API→보호 복구→UI→native 연결→전체 검증 계획을 작성했으며 계획 검토/실행 방식 승인 대기다. dotnet runtime은 있으나 SDK 목록은 비어 있고 WebView2 존재는 미확인이다. 필요한 설치는 별도 승인 대상으로 남긴다.
- 새 앱 인증/15초 자동저장/읽기·쓰기 승인 통합은 아직 구현하지 않았다. 기존 깜빡임·15초 relay 대기 수정은 보존하며 실제 수정 실행본 검증도 아직 완료로 간주하지 않는다. 이번 변경은 계획/상태 문서만이며 제품 코드·운영 DB 변경·commit/push·배포 없음.

## 2026-10-05 IRIS 체크보드 안정화·저장 전달 지연 수정

- 한설이 실제 오버레이 레이드 저장→웹 크로노스 반영을 확인했다. 이어서 반복 깜빡임 및 10초 이상 저장 대기를 제보했다.
- iris/overlay.ps1: state 읽기는 checkboard busy 대상에서 제외, 무변경 조회의 컨트롤 재생성 방지. lib/irisRelay.ts: 직렬 1초 로컬 선택/저장 큐 확인과 15초 DB 계정/요약 갱신을 분리. 선택 변경 요약 갱신과 서버 권한 검사·저장 후 GET 검증·불확실 POST 재전송 금지 유지.
- 회귀 RED→GREEN 및 전체192/192·tsc·diff 검사 통과. 실제 총 저장 시간/게임 위 깜빡임은 재시작 이후 수동 재검증 대기. 기존 native 상태 조회 간격 3초 및 서버 응답 시간은 여전히 최종 표시 지연에 포함된다.
- 로컬 미커밋/미푸시, 운영 DB 직접 쓰기·게임 조작 없음. 현재 실행본은 이전 버전이므로 사용자가 정상 종료 후 재시작해야 한다. 수정된 브라우저 relay는 새 연결에서 로드할 것. 이전 재실행 때 격리 환경의 프로세스 조회 결과를 종료로 잘못 판단해 중복 실행한 사례가 있었다. 다음 시작/종료 확인은 승인된 환경에서 실제 프로세스와 포트를 함께 확인하고, 미확인 결과에 중복 실행하지 말 것.

## 2026-10-05 IRIS 숙제 버튼 전송 차단 로컬 수정

- 사용자 수동 검증에서 읽기 연결·수정 허용 후 `+` 클릭 시 연결 대기 깜빡임 제보. iris/overlay-support.cs의 OwnedServer.RequestAsync 허용 목록이 숙제 요청 3개를 누락한 것이 원인이다.
- edits·edits/submit·edits/discard POST만 최소 추가. iris/overlay-support.tests.ps1에 실제 C#→합성 owned HTTP 서버 회귀3건 추가, RED3→GREEN3 및 전체 Node191/191 통과. 서버 승인/내용 검증과 임의 경로 차단 유지.
- 실제 운영 DB 쓰기·게임 조작·commit/push 없음. 기존 IRIS 프로세스는 코드를 다시 읽지 않으므로 사용자가 IRIS 종료로 정상 종료한 뒤 재시작할 것. 체크보드 증감의 미저장 상태 및 실제 저장/웹 반영 검증은 아직 미완료. 기존 미커밋 변경 모두 보존.

운영 확인 — 2026-10-05 21:01 KST: v2.152 코드 4d43fd9를 main에 push하고 Vercel dpl_FSt8AvKkjTp3UXyJgnCKmGzbKRsM READY/production 및 운영 도메인 연결을 확인했다. 운영 로그인된 브라우저에서 공지14→목록(/kerygma)→같은14 재열기, 읽은14 알림 숨김, 분야별 설정 5개, 케리그마 끄기 시 빈 목록·숫자 숨김/다시 켜기 시 복원을 확인했다. 설정은 전부 켜짐으로 복원했다. 브라우저 수집 오류·경고0. /·/character·/party·/kerygma·/admin HTTP200·v2.152, /login HTTP200, 인증 헬스200/ready true. 공개 공지 게시·IRIS 배포·DB 구조/RLS/권한 변경 없음. 이 후속 push는 검증 기록만 추가하며 구조 변경 없음. 다른 분야 실제 팝업·계정 전환·전체 모바일 폭 검증은 미완료다.

## v2.152 알림 설정·케리그마 이동 수정 — 2026-10-05 20:55 KST

검증 — 2026-10-05 20:58 KST: 실제 staged 웹 후보만 임시 폴더에 추출해 자동 테스트 55/55, 별도 TypeScript 검사, Turbopack Production 빌드(static48), staged diff 검사를 통과했다. 후보에는 미커밋 IRIS 코드·문서·테스트를 포함하지 않았다. 운영 배포 확인은 다음 기록을 따른다.

- 읽은 알림을 알림함과 숫자에서 숨깁니다. 직접 공지를 열어 읽은 경우도 반영하며 기존 읽음 기록을 보존합니다.
- 알림 설정에서 케리그마·크로노스·아고라·시낙시스·로고스 수신을 개별로 켜고 끕니다. 목록·숫자·브라우저 팝업에 적용합니다. 계정별 현재 브라우저에 저장하며 가입 승인 등 운영 알림은 유지합니다.
- 공지에서 목록으로 돌아온 뒤 같은 글이 열리지 않거나 메뉴 재진입 시 이전 글이 남던 URL·화면 불일치를 수정합니다.
- 구조 변경: notificationPolicy 도우미, 알림 훅·상단 알림 설정 UI, 공지 열림 이벤트와 동기적인 브라우저 이력 갱신. DB 구조·RLS·권한 변경 없음.
- 한설 요청으로 조용히 웹 변경만 배포합니다. IRIS 변경과 공개 공지·업데이트 글 게시는 제외합니다. 기존 미커밋 IRIS 변경과 미확인 릴레이 기록은 보존합니다.
- 로컬: 회귀 테스트 RED→GREEN, 전체 194/194·타입 검사·빌드 통과, 실제 브라우저 공지 재열기·메뉴 복귀·읽음 숨김·설정 토글 확인 및 한설 확인 완료. 배포 후보의 독립 검증과 운영 확인 결과는 후속 기록에 남깁니다.
- 알려진 제한: 설정은 기기 간 동기화되지 않습니다. 실제 다른 분야 팝업·계정 전환·모바일 전체 폭 검증은 별도 대상입니다. 케리그마 기존 ESLint 오류 12개/경고 4개와 알림 훅 기존 오류 1개는 남아 있습니다.
- 직전 정상 기준선: v2.151 e17eb92, Vercel dpl_75bxSt92bsbZuNvCXDhwiqXsTQfD READY/production.


## 2026-10-05 케리그마 무반응 직접 재현 후 로컬 검증 — 미배포

- 기존 사용자 사이드탭에서 실제 주소id14 + 목록 상태 및 같은 글 클릭 무반응을 직접 확인했다. 이전 별도 탭 정상 보고와 구분한다. page.tsx 닫기/열기의 주소·선택 상태 어긋남을 회귀3건으로 확인, 쿼리 전환에 native history + 즉시 공지/댓글 선택 적용.
- RED3→GREEN3, 전체194/194·tsc·Production build 통과. page ESLint HEAD/working 동일12오류4경고(신규 위반 없음). 실제 기존 로그인 로컬에서 목록→같은 글, 홈→케리그마 목록, 알림→공지→목록→같은 글 정상 및 콘솔 오류0. 알림 읽음 숨김·숫자 감소, 설정5분야 표시 및 케리그마 끄기/복원 확인. 팝업 실제 이벤트·계정 전환·모바일 행렬 대기.
- 로컬 Production preview localhost:3000, 실행 세션86622를 켜두었다. 확인 탭7 유지. 운영 사용자 실패 탭1은 보존. 코드·문서 미커밋/미푸시, 기존 IRIS 변경 보존. 운영 DB 직접 변경 없음; 기존 공지 읽음 처리만 발생. 상세 BETA_FEEDBACK 참조.

## 2026-10-05 알림 설정 로컬 구현 및 공지 이동 조사 — 미배포

- 읽은 알림 숨김, 케리그마·크로노스·아고라·시낙시스·로고스 개별 설정을 구현했다. 알림함·숫자·브라우저 팝업에 동일 정책, 가입 승인 운영 알림 유지. 계정별 브라우저 저장이며 DB 구조·운영 데이터 직접 변경 없음. 직접 공지 진입도 로컬 읽음으로 연결하고 기존 읽음 ID를 합쳐 보존한다.
- 정책 테스트4/4 및 전체 Node191/191, TypeScript·Production 빌드 통과. 기존 비로그인 effect 상태 변경 lint1건은 남음. 로그인된 로컬 설정 조작·계정 전환·분야별 팝업 확인 대기. 임시3012 서버는 종료했다. commit/push/배포 없음, 기존 IRIS 변경 보존.
- 공지 이동 제보는 P1 조사 중이다. 운영 IAB에서 알림14번→목록→같은 글→홈→케리그마는 정상, 최종 /kerygma 목록 및 콘솔 오류0. 일반 브라우저 실패는 미재현으로 원인 확정·수정 완료를 주장하지 않는다. 실패 순간 실제 주소와 화면 추가 확인 필요. 상세는 BETA_FEEDBACK.

운영 확인 — 2026-10-05 18:23 KST: 코드 9ff2414 main push, Vercel dpl_EaPngNa9nqNzJLUCCjcUiGMmMbFT READY/production 확인. 운영 /·/character·/party·/kerygma·/admin HTTP200 및 HTML v2.151, /login HTTP200, 인증 헬스200/ready true. 기존 로그인된 운영 크로노스에서 캐릭터 정보·월요일 검은 구멍 최대8·3목록 패널색 마스크를 읽기 확인했고 물물교환 더보기9→14개 펼침을 확인했다. 브라우저 수집 오류 로그0. 체크/저장 등 운영 데이터 쓰기·실제06시 시간 전환 테스트는 하지 않았다. docs/UPDATE_POST_v2.151.md는 공개 안내 초안이며 공지 게시 없음. 이 후속 기록 push는 문서만 변경하며 구조 변경 없음.

검증 — 2026-10-05 18:18 KST: 웹 커밋 후보만 별도 폴더로 추출해 node --test 58/58, 별도 TypeScript, 관련 ESLint, 기본 Turbopack Production 빌드(static48), staged diff 검사를 통과했다. 자정 방식으로 되돌린 회귀3건은 모두 실패, 수정 복원 후3/3 통과. 더보기 합성 화면의 밝은/어두운 캡처 및 6테마 배경 계산 확인. 임시 의존성 junction의 첫 빌드 실패는 실제 파일 복사 후 해소했다. 실제 최신 정상 롤백 배포는 a8f7d78 / dpl_89vTuY8joQuZ1jJBsxHnDurb789s(READY/production)다. 운영 로그인 조작/실제06시 경계·공지 게시는 이 검증에 포함되지 않는다.

## 2026-10-05 v2.151 웹 핫픽스 배포

- 한설 요청으로 웹 변경만 선별한다. 검은 구멍 최대 횟수와 초기화 안내의 날짜/요일을 KST06 게임 날짜로 통일하고, 더보기 문양 배경을 고정 검정에서 --panel 기반으로 변경한다.
- 월요일00~05:59 최대14 유지, 월06시8→일06시14. 완료 기록 삭제/보정·운영 DB 변경 없음. 날짜 도우미는 기존 kronosPeriodStart(daily)에서 파생한다.
- 직전 기준선 a8f7d78(v2.15 코드 1b1b401, Production/Ready CrGH4wg7wJeAfadsg5UJUnLiMFeR). 배포·검증 결과는 후속 기록에 남긴다. 실제 로그인 조작/장시간 열린 화면 06시 자동 갱신은 확인 완료로 보지 않는다.

## 2026-10-05 KST — BETA-068 검은 구멍 자정 조기 축소 수정

- 한설이 모든 게임 하루/요일은 KST06시라고 확인했다. 최대 횟수만 calendar midnight에 월8로 바뀌고 기존 완료14가 남는14/8 재현. lib/kronos.ts getKronosResetDay는 기존 kronosPeriodStart(daily)에서 게임 날짜/요일을 파생, lib/irisKronos.ts 공통 목록 및 app/character/page.tsx 초기화 알림에 연결했다. 월06시8→일06시14/월05:59까지14 유지.
- 신규 tests/kronos-black-hole.test.mjs 회귀 RED→GREEN, 월00/05:59/06시·7요일·UTC/한국/미국 시간대·읽기 시14완료 보존 확인. 기존 IRIS 모순 테스트의 Monday fixture를 실제06시 이후로 이동, 초기화되지 않은 구형 기록의 failclosed 검사는 유지한다. 운영 DB/RLS/완료 기록 수정·삭제·commit/push/배포 없음. 기존 dirty 전부 보존.
- 최종 node --test184/184 fail0 skip0, 별도 tsc/관련 함수·회귀테스트 ESLint/build/diff-check exit0. 로컬 /character?char=본인캐릭터 에서 확인, 운영 주소에는 아직 미배포다. 장시간 열린 화면은 다음 렌더/새로고침 시 반영하며 자동 실시간 초기화/DB 주간 삭제를 새로 구현한 것은 아니다. 실제 로그인 화면/운영 시간 경계 확인은 대기, 자체 검토이며 독립 리뷰 아님.

## 2026-10-04 KST — 자율 야간 개발 1차 검증 / 00:27 재개

- 한설이 10월5일03시까지 로컬 기능·성역 고유 UIUX 개발을 승인했다. 중간 질문 없이 직접 실행, 기존 dirty 보존. 단일 센터를 게임 위젯/생텀 그룹으로 재배치하고 기존 이벤트·복구·종료 경로를 유지했다. 가짜 시낙시스/그노시스 버튼이나 별도 센터 창은 추가하지 않았다.
- 개별 위젯 불투명도40~100%: 센터/상태/가공/미션/캐릭터 연결/체크보드, 전체 선택은 개별값 초기화. 별도 widget-display-settings.json에는 허용된 표시값만 저장. 실제 설정 모달/DPI 대조는 대기다.
- 수정 동의 응답 유실 시 연결을 중단하고 permission lease 갱신을 멈춘다. 해제 실패를 UI만 성공한 것처럼 남기지 않는다. native disconnect 실패 시 기존60초 만료 경계가 최후 방어다.
- iris/action-queue.mjs 및 action-contract.mjs는 순수 오프라인 기반이다. 최대100작업/3600초/신선도15초/과적 상한/본인 고정/직렬 claim/unknown 자동재시도 금지/중복 시작 시간 연장 차단. 실제 CLI metadata 기반 채집100개 한도, 가공1등록, 제작 횟수와 생산량 구분, 선택 시설 완료 작업 수령 요청 검증. HTTP/게임 실행 배선 없음. 전체 완성 또는 실제 자동화로 보고하지 않는다.
- 자동 node --test178/178 fail0 skip0, 별도 tsc/변경 ESLint 통과. 합성 native48/48 및 센터 렌더 확인. npm run build exit0(static49), git diff --check exit0. 빌드 자체 타입검사 생략은 별도 tsc로 보완했다. 운영 DB 쓰기·게임 조작·로그인 입력·DB/RLS/권한·commit/push/배포/공지 없음.
- 재개 heartbeat iris-00-27: 10월5일00:27KST 한 번, 해당 호출 시 삭제. PC/Codex 실행 필요. 사용량00:26:24 reset 예정으로 확인했으나 재개 시 다시 조회한다.03시 이후 새 구현 금지.
- 재개 다음 범위: relay/이 문서/overnight plan 확인 → 위젯 설정 합성 테스트 보강·6테마 접근성·가공 표시 밀도 정돈 → 본인 시낙시스 읽기 계약 조사/합성 테스트와 제한된 API 설계. 실제 저장/게임 명령은 사용자 검증으로 남긴다. catalog와 queue의 수량 의미가 달라 직접 연결 금지. fishing started는 무한 자동낚시일 수 있어 bounded adapter 전 실행 금지. 수령 collected 실제 타입은 metadata만으로 확정 못했으며 숫자만 인정, 나머지 unknown. 추측으로 완료 처리 금지.

## 2026-10-04 KST — IRIS 크로노스 명시 저장 로컬 구현

- 한설의 `작업진행해줘 왠만하면 쭉 해줘`로 승인 계획을 영겁이 직접 실행했다. 기존 dirty 보존, 별도 에이전트 리뷰 없음. 아래 이전 날짜의 읽기 전용 설명보다 본 최신 상태를 우선한다.
- 인증 POST `/api/iris/kronos`는 본인 owner/세션·Origin·활성 항목·KST06시 일/월요일 주 경계·기준값을 검증하고 단일 체크 필드를 CAS로 저장한다. 무관/구형 기록 보존, 이미 원하는 값이면 UPDATE 없음. owner 없는 대표 캐릭터는 읽기 호환만 유지하며 쓰기는 거절한다. 통합 `abyss_all` 등을 나누다 다른 항목까지 바뀌면409로 보존한다.
- 별도 웹 `동의하고 숙제 수정 허용` → native 체크/−/+ → `변경 저장`. 자동 저장 아님. 최대200 메모리 항목과 UTF8 전체 상태64KB 여유 경계, 첫 기준값/최종 목표 병합, 저장 중 중복 수정·제출 차단. 각 POST 후 GET에서 identity/기간/완료 수가 일치해야 saved. 잃어버린 응답은 재조회만, 자동 POST 재송신 없음. 항목별 성공만 제거해 부분 실패가 남는다.
- 계정 변경은 수정 동의 해제, 이전 generation/선택 큐는 재연결에 자동 재생하지 않는다. 정상 폴링은 미저장 값을 덮지 않는다. 위젯 숨김/×는 큐 유지, 폐기/캐릭터 전환/새 연결/종료는 기본 No 확인. 이미 도착한 서버 저장을 되돌린다고 약속하지 않는다. 강제종료 복구·여러 항목 원자적 저장은 보장하지 않는다.
- 자동 검증/최종 결과는 아래 검증 마감 절에 기록한다. 합성 Windows 렌더와 브라우저 초기 수정 버튼 disabled/console error0 확인. 실제 운영 DB 저장, 실제 게임 조작, 로그인 코드 입력, DB/RLS/스키마/권한 변경, commit/push/배포/공지 없음.
- 사용자 확인 대기: 기존 IRIS 정상 종료 후 재실행, 새 읽기 연결/본인 확인/별도 수정 동의. 별도 승인한 숙제 하나를 체크→명시 저장→웹 같은 항목 대조→새로고침 유지·무관 항목 보존 확인. DPI/장시간/실제 경쟁·탭 닫힘도 미완료. 시낙시스 상태 조회와 단일 센터 내부 카테고리 정리는 다음 설계 범위이며 아직 미구현; 커넥터 자동 채집/가공/수령도 미완료.

### 로컬 자동 검증 마감

- 최종 `node --test` **161/161**, fail0/skip0(기존139 대비22 추가, Windows C# compile/합성 UI/실제 PS controller 함수 포함). RED→GREEN: 서버/큐/중계/typed UI 신규 경로, 계정 전환 동의 잔존, 긴 batch freshness, 공유 legacy 완료 키, JSONB 구형 문자열 CAS 인코딩.
- `npx tsc --noEmit`·이번 저장 범위5파일 ESLint·`npm run build` 통과. Next 빌드는 타입 검증을 생략하도록 기존 설정돼 있어 별도 tsc 결과를 기준으로 삼는다. diff 검사는 LF/CRLF 안내와 별개로 완료 시 확인한다.
- 합성 native 렌더 미저장/명시 저장·반복 상한 잠금·6테마·숨김 복구 확인. 별도 가짜 fragment 브라우저 탭에서 수정 허용 버튼 초기 disabled/수집 console error0 확인 후 테스트 탭 닫음(로그인 입력/동의 버튼/실제 DB 저장 실행 안 함).
- 독립 리뷰·실제 Windows DPI/게임 위 저장 조작·운영 JSONB CAS 응답은 미검증이다. 실제 DB 대상 승인 없는 저장 시험을 대신 수행하지 않는다. 수동 단계: 기존 IRIS 재실행 → 새 읽기 연결/본인 확인 → 웹 수정 동의 → 승인된 한 항목 변경 저장/웹대조/무관항목 보존. 이것이 남은 검증 경계다.

## 2026-10-04 KST — 크로노스 저장 설계 승인·계획 작성

- 한설의 `진행하자`로 작성된 크로노스 쓰기 설계 승인. `docs/superpowers/plans/2026-10-04-iris-kronos-write.md`를 작성하고 범위·인터페이스·테스트·실행 승인 경계를 자체 검토했다.
- 계획은 서버 부분 저장 → 메모리 큐/별도 동의 → 브라우저 직렬 중계 → native 조작/검증 4단계다. 사용자 계획 검토와 실행 방식 승인 대기이며 제품 구현을 시작하지 않았다.
- 권장 방식은 영겁의 현 대화 직접 순차 구현, 독립 에이전트 리뷰는 별도 승인 전 제외. 실제 운영 쓰기 검증·게임 조작·DB/RLS/권한·commit/push/배포 없음. 작성 문서만 변경했다.

## 2026-10-04 KST — 체크보드 사용자 확인·다음 저장 설계

- 한설이 실제 게임 위 상세 체크보드의 표시·읽기 연결을 스크린샷으로 확인했다. 전체 DPI/장시간/저장 동작 검증을 뜻하지 않는다. 현재 위젯은 읽기 전용이며 DB 저장 기능은 없다.
- 다음 방향: 크로노스 체크 저장 → 시낙시스 내 파티·신청 상태 조회 → 단일 IRIS 센터 내부 카테고리 정리. 별도 카테고리 센터 창을 다수 추가하지 않고 선택 위젯만 표시하는 방향이다.
- `docs/superpowers/specs/2026-10-04-iris-kronos-write-design.md` 작성·작성자 검토 완료, 사용자 문서 검토 대기. 첫 저장은 별도 수정 동의·명시 저장·변경 항목만·경쟁 변경 거부를 제안했다. 아직 계획·제품 구현·운영 쓰기 검증은 수행하지 않았다. 기존 dirty 보존, commit/push/배포·DB/RLS/권한 변경·게임 조작 없음.

## 2026-10-04 KST — 로컬 서버 재실행·실제 로그인 확인

- 한설의 로컬 닫힘 제보에서3000번 listener 부재 확인. 네트워크 접근 가능한 환경으로 `npm run dev -- --hostname 127.0.0.1 --port 3000` 재실행, Ready 확인.
- `/login`·홈200, `/api/auth/health`200/ready:true. 앱 내 브라우저 로그인 UI 정상, 오류 overlay/수집 console error0. agent-browser CLI 미설치라 CUA 브라우저로 확인했다.
- 한설이 접속 코드를 직접 입력해 실제 로그인 완료. 서버 POST `/api/auth/login`200/후속 session200, 브라우저 홈의 한설 길드마스터 표시 확인. 코드를 받거나 대신 입력하지 않았다. 무쿠키 session200은 로그인 증거가 아니며 실제 사용자 결과와 구분한다.
- 개발 서버 실행 상태 유지. 코드·환경변수·DB/RLS·권한·배포 변경 없음. 새 native 체크보드의 실제 화면 대조는 별도 대기다.

## 최신 — 2026-10-04 독립 숙제 체크보드 로컬 구현

승인된 계획 Task1~4를 `codex/iris-checkboard-classes`에서 구현했다. 센터 `숙제`→항목별 4범주 아코디언/남은 숙제 필터/클래스 생텀 저장값, 기존 테마·불투명도·복구 경로를 공유한다. 타입/웹빌드 통과, 자동139/139(실제 Update-IrisConnection 배선 검증 포함). 사용자 새 위젯 대조/DPI·장시간/독립 리뷰는 대기다. DB 쓰기/게임 동작/commit/push/배포 없음. AI(아님)커넥터 전체 목표는 유지하지만 수령·자동 채집·가공은 미구현이며 다음 후보는 명시 수령 경계 설계다. 상세 구현 인계는 이 문서 말미의 같은 날짜 기록을 참조한다. 아래 설계 대기 기록은 이전 상태다.

## 2026-10-04 KST — IRIS 실제 읽기 연결 확인·상세 위젯 설계

- 한설이 실제 브라우저 승인 → native 본인 캐릭터 목록 → 수동 캐릭터 확인 → 크로노스 요약 전달을 스크린샷으로 확인했다. BETA-067의 이 정상 연결 경로는 사용자 확인 완료다. 기존 Node122/122·타입 통과 기록은 이전 실행 결과이며 이번 문서 작업에서 재실행한 결과가 아니다. 탭 종료/계정 전환/장시간/다중 DPI 등 전체 수동 검증 완료는 아니다.
- 한설이 독립 숙제 체크보드·범주별 아코디언·남은 숙제 필터·클래스 생텀 저장값 목록 방향을 승인했다. `docs/superpowers/specs/2026-10-04-iris-checkboard-classes-design.md` 작성, 문서 검토 대기. 현재 제품 코드 변경 없음. 게임 모든 클래스 자동 조회·숙제 체크 쓰기·게임 수령/자동화는 이 범위에 없다.
- 기존 미커밋 변경 보존, 운영 DB/RLS/데이터 쓰기·commit/push/배포 없음. 작성 설계 확인 뒤 구현 계획을 작성한다.

## 2026-10-03 KST — IRIS 전달 동의 실패 진단 중 (BETA-067)

- fetch 수정 뒤 한설이 ‘생텀 조회503/연결 끊김’을 재현. 서버 로그의 characters200과 달리 기본 `this.schedule=setTimeout` / `this.cancel=clearTimeout`도 잘못된 receiver로 호출됐다. 브라우저 timer receiver를 검증하는 회귀가 실제 사용자 안내와 같은503으로 실패했고, 두 기본 함수를 bare-call wrapper로 변경 후 연결 유지/종료 성공. relay10/10·Node전체122/122·tsc 통과. 실제 Chrome 지속 연결/선택 요약 확인은 아직 필요. 정상 흐름은 새 연결→생텀 화면 열기→동의→오버레이 캐릭터 확인이며, 새로고침/구형 미리보기 승인은 정상 연결 절차가 아니다.

- 후속 원인 후보 재현/수정: default browser fetch를 `this.fetcher=fetch`로 저장한 뒤 객체 메서드로 호출해 receiver가 IrisRelay가 됐다. Window fetch의 receiver 검증으로 HTTP 전 Illegal invocation이 발생할 수 있고 catch가 안내로 삼켜 콘솔에 별도 오류가 없었다. Node fetch/주입 arrow fake는 이 브라우저 제약을 검사하지 못했다. Web IDL receiver를 검증하는 회귀를 먼저 실패시킨 뒤 default fetch를 bare 호출 wrapper로 변경, relay9/9·전체 Node121/121·tsc 통과. 실제 Chrome 새 연결 승인/본인 목록 표시 재확인 대기. 이 브라우저 수정은 HMR 적용 가능, native 재시작 없이 새 연결 탭 사용. 앞선 CORS 수정은 별도 진단 보완이며 승인 차단의 직접 원인으로 단정하지 않는다.

- 추가 수동 재현: 새 연결 consent가 ‘승인 연결 응답 없음’으로 실패. 사용자가 새로고침→구형 `/api/bridge/pair` 승인→웹 캐릭터 선택을 하면 게임 미리보기만 되고 native waiting-browser/빈 목록이 유지됨. 이는 새 캐릭터 중계와 별도 경로이며 복구 성공이 아니다.
- 확인된 진단 결함: connection HTTP가 알려진 local Origin의 잘못된/만료된 capability403에 CORS를 붙이지 않아 브라우저에서 실제 거절 상태가 transport 오류로 가려졌다. generic 거절 응답에도 exact-origin CORS 적용(외부 Origin 제외·인증/상태 접근은 기존 유지), failing regression 후 Node 전체120/120 통과. 사용자 PC에서 실제 원인이 잘못된 capability인지 네트워크 차단인지는 아직 미확정. 실행 중 owned child는 JS hot reload가 없으므로 새 서버 코드 적용에는 사용자가 IRIS 종료 확인 후 재실행해야 한다. 재실행 뒤 새 연결 탭을 승인 전에 바인딩해 오류를 직접 수집할 것. 브라우저 보안/권한을 자동 변경하지 않는다.

- 실제 Chrome에서 생텀 로그인 후 전달 동의가 실패했다. 서버 login200, session200, iris/characters200 확인. 소유 IRIS 서버의 consent OPTIONS204와 정확한 localhost Origin/CORS 응답도 확인. 이것만으로 브라우저의 실제 POST 성공을 증명하지 않는다. 실패 탭의 수집 콘솔은 비어 있어 직접 원인은 아직 미확정이다.
- `lib/irisRelay.ts`가 모든 실패를 로그인/연결 만료로 표시하던 안내 오류를 수정했다. 요청 대상·HTTP 상태를 내부에서 구분해 생텀 로그인401, 권한403, 조회 실패, 아이리스 전송/승인 실패에 각각 안내한다. 토큰/응답 원문 로그는 추가하지 않았다. 보안 경계와 실패 시 폐기는 유지한다.
- 실패 테스트 3개 확인 후 수정, relay8/8 및 전체 Node119/119, tsc 통과. 실제 연결 복구는 미확인. 한설에게 새 읽기 연결→생텀 화면 열기→동의 재현을 요청했다. 실패 시 새 상태 문구와 실제 브라우저 오류를 확인할 것. 로그인 반복 요구·브라우저 보안 비활성·운영 DB 변경 금지. commit/push/배포 없음.

## 2026-10-03 KST — 로컬 서버·로그인 실행 환경 복구

- 한설의 로컬 사이트 연결 불가 제보: 3000번 ECONNREFUSED 확인 후 개발 서버 실행. `/iris`·홈200 및 브라우저의 IRIS 내용/오류 오버레이 없음 확인.
- 이어진 로그인 실패는 코드 불일치가 아니라 DB 요청 fetch failed와 login503, health503/ready:false였다. 영겁이 시작한 해당 격리 개발 서버만 종료하고 승인된 네트워크 허용 환경으로 같은127.0.0.1:3000 서버 재실행 뒤 health200/ready:true 확인했다. 코드/DB/권한/비밀값 수정 없이 실행 환경만 복구. 후속 실제 사용자 login200/session200 확인(BETA-066). IRIS 전달 동의 실패는 별도 BETA-067.

## 2026-10-03 KST — IRIS 본인 캐릭터·크로노스 읽기 연결 로컬 후보

- 한설의 반복 질문 없이 진행 지시에 따라 character-connection Task3~4를 구현했다. 기존 dirty 보존, 운영 DB/권한/데이터 쓰기·게임 조작·commit/push/배포 없음.
- 브라우저 세션으로 본인 목록(id/accountId 최소 응답)과 선택 캐릭터의 일일/주간/어비스/레이드 완료 요약만 GET한다. 서버 소유 확인/owner 없는 구형 대표 호환/승인대기 차단, raw 체크·메모·스탯 미반환. 공통 숙제 목록은 한국 요일 기준이다. `/iris#connect=…&g=…`는 즉시 주소에서 제거하고 명시 전달 동의 후 중계한다. 쿠키/코드/native capability는 브라우저 밖으로 전송하지 않는다.
- Windows는 직접 소유한 `owned-server.mjs` child에 stdin pipe로 capability를 전달한다. 명령줄/환경변수/파일/로그에 토큰을 쓰지 않는다. READY 확인 전 native 요청 금지, EOF/종료 시 소유 프로세스만 정리. 기존 서버 발견 시 게임 읽기만 유지하고 새 연결은 비활성 안내한다.
- 새 `생텀 · 크로노스` 모듈에서 본인 전체 닉네임 선택→기본 No 확인→읽기 요약. 마지막 accountId/characterId만 별도 파일로 기억하며 최신 같은 계정 소유 목록에서 제안만 한다. 게임 UUID/닉네임 자동 대조가 아니다. 기존 게임 미션과 분리, 실패/60초/계정 변경/소유 삭제 시 비우기, 숨김 중 조회 중단·이전 완료/늦은 응답 폐기. 브라우저 뒤열기 보장 불가하여 명시 `생텀 화면 열기` 버튼 사용; 자동 뒤열림 완료로 보고하지 않는다.
- 검증: 마지막 idle-hide 후속까지 전체123/123 및 별도 타입 검사 통과. 프로덕션 빌드 통과(웹 bundle만, 설치형 인증/배포가 아님). 독립 리뷰에서 반복기간 clamp/계정409 테스트 경계/숨김 복원 응답 경쟁을 찾아 각각 방어 또는 기록했다. 마지막 재검토에서 추가 지적 없음. 실제 사용자 로그인/게임/포커스 검증은 이 결과에 포함하지 않는다.
- 알려진 기간 문제 BETA-065: 구형 `검은 구멍` 완료 슬롯이 현재 요일 최대치를 넘으면 기존 화면은 모두 세지만 기간 타임스탬프가 없어 의미를 판정할 수 없다. IRIS는 조용히 clamp/초기화하지 않고503으로 읽기를 중단한다. 저장 기록은 보존. 기존 화면 기간 처리 별도 결함으로 유지한다.
- 실제 로그인→승인→목록→캐릭터 변경/재실행 기억/탭닫기/OS 포커스/DPI 수동 확인은 아직 없다. 실행: 기존 IRIS 종료 후 `powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File iris/overlay.ps1`; 로컬 `http://localhost:3000/iris`, 오버레이 센터의 `생텀 연결 · 크로노스` 진입. 브라우저 로그인 입력은 한설이 직접 한다.
- 다음 기능은 체크보드 항목 읽기·로컬 변경 큐·부분 병합 저장부터 별도 설계/TDD. 현재 총수 요약만 읽으며 숙제 체크 저장·가공 수령·자동 채집/제작·환경/음악/미디어는 미완료. UIUX 정리는 기능 연결 뒤 한설에게 요청할 것.

## 2026-10-03 KST — 사용자 실제 확인·기능 우선 방향

- 한설이 새 IRIS를 실행하여 테마 전환·불투명도 조절·숨김/다시 표시가 정상이라고 확인했다. 고정 동작도 정상이라고 표현했으나 위치 잠금인지 클릭 통과/전면 유지인지 별도 특정하지 않았으므로 새 위치 잠금 기능이 검증됐다고 추정하지 않는다. 전체 종료 확인/취소·재실행 설정 유지·다중 모니터는 이번 보고에서 확인되지 않았다. 개인 게임 수치는 문서에 옮기지 않는다.
- 한설은 지금은 기능 확인/확장 우선이며 UI/UX 취향 피드백은 기능 흐름 연결 뒤 요청받길 원한다. UI/UX 집중 정리 단계에 들어갈 때 먼저 수정 의견을 물을 것. 글자 가림/누를 수 없는 버튼/잘못된 상태 표시처럼 사용을 막는 문제는 후순위로 미루지 않는다.
- 다음 목표: 본인 캐릭터 선택·현재 게임 캐릭터 수동 확인, 크로노스 항목의 오버레이 체크·안전 저장, 시설별 명시 수령, 이후 채집/제작/가공 자동 작업. 현재 창에는 수령 버튼/실행이 없고 게임 미션은 크로노스 체크보드가 아니다. AI(아님)커넥터 기능 목표를 자체 구현하되 타 도구 코드/자료를 그대로 복사하거나 전체 기능 완료로 보고하지 않는다. 실제 게임 캐릭터 UUID/닉네임 자동 인식은 확인되지 않았다.

## 2026-10-03 12:43 KST — 예약 재개 검증

- 13:00 KST 추가 구현: 캐릭터 연결 역할별 HTTP 경계를 `connection-http.mjs`에 구현하고 `createIrisServer`로 연결했다. 게임 읽기 bridge와 분리하며 native capability 없는 기본 실행은503이다. Windows launcher·생텀 인증 API/선택 UI 연결은 아직 미구현. 합성 HTTP10개와 기존 Windows·파티 회귀 포함 전체 **105/105 통과**. 실제 게임/로그인/운영 DB/배포 검증이 아니다.
- 독립 connection_http_review가 재현한 Important2건을 테스트 RED→GREEN으로 수정: 늦은 native disconnect는 generation이 다르면409로 거부, 계정 변경은 consent에 묶인 accountId가 다르면 token/state를 폐기하고 새 승인을 요구한다(60초 표시 만료 뒤에도 적용). 리뷰의 제외 항목인 native 토큰 전달·서버 소유 발견, 브라우저/native UI·동의 화면, 생텀 세션/소유권 API, 실제 게임 읽기/OS 포커스/운영 준비도는 이번 HTTP 경계 통과로 검증됐다고 보고하지 않는다. 새 minor 없음. 직접 server subprocess 시작/종료 뒤 같은 포트 재바인딩도 확인했다.

- 영겁 수신함 ACKNOWLEDGED, 기존 미커밋 변경 보존. 5시간 사용량 초기화 후 0% 사용, 주간 16% 사용을 확인했다. 이번 예약 환경은 저장소 읽기 전용으로 시작했다.
- 기본 격리 환경의 Windows 테스트는 C# 컴파일용 임시 파일 접근 거부로 실패했다. 승인된 격리 밖 자동 테스트 재실행에서 전체 `node --test` 95/95 통과. 실제 게임 조작/로그인 입력/DB 쓰기는 하지 않았다. `git diff --check` 통과(기존 LF/CRLF 경고만).
- 코드 확인: ConnectionState는 메모리 계약만이며 server.mjs에는 아직 native/browser 역할별 연결·선택·요약 경로가 없다. 기존 pairing은 게임 읽기 snapshot 공유용으로, 인증된 캐릭터 연결이나 수령 권한으로 재사용하면 안 된다. reader는 5개 읽기 명령만 허용한다. 자동 채집/제작/수령 완료로 보고하지 않는다.
- 다음 구현은 character-connection 계획 Task2의 역할별 HTTP 경계부터. native 토큰 없는 서버는 새 연결 기능 비활성, 정확한 Host/Origin·역할별 토큰·본문 크기·만료/폐기·이전 연결 응답 거부를 합성 HTTP 테스트로 먼저 검증한다. 한설 수동 확인(실제 UI 대비/포커스/연결/게임 수령)은 미완료로 유지한다.

## 2026-10-03 KST — 작업별 가공 바·자동화 전체 기능 현황 검토

- 사용자 후속 요청: 가공 완료를 타원형 개수 바·수령 버튼으로, 에린 시간/에린력/날씨/위치 포함, AI(아님)커넥터 자동 기능 전체도 구현 목표에 포함하고 현황 설명 요청. **전체 구현 안 됨**을 명확히 답한다. `docs/IRIS_AUTOMATION_PARITY.md`에서 설치본 README 설명과 현재 IRIS 실제 경로를 비교했다. 현재 게임 실행 allowlist/경로가 전혀 없으며 새 수령 인증/명시 실행은 아직 구현 전이다. 실제 게임 action 없이 capabilities 계약만 재확인했다.
- 이번 추가 코드: ProcessingSlots 자체 paint로 작업 하나당 capsule, 완료 주황/대기 흐림, 7개는7칸. 최대14칸/초과 추가N 요약, 정확한 전체 수 유지. SetProcessing와 hide/disconnect 모두 비우기, 기존 timer 테스트의 값/33%는 호환 파생 값으로 유지하되 실제 UI는 개수 바. 타입 부재 RED→GREEN, 합성 DrawToBitmap에서 완료2칸/흐림1칸/네번째 없음 확인. 전체95/95·diff 통과(실제 화면/게임 수령 검증 아님).
- 독립 slots_review 정적검토 Critical/Important 없음(독립 테스트 재실행은 안 함). Minor 두 건 후속: 밝은 테마에서 고정 주황/대기 alpha 대비 직접 확인, 14개 초과 때 추가N이 시간/수령가능 둘째 줄을 대체함. 실제 UI·게임실행/인증/환경 연결은 이 리뷰에서 제외했고 미검증으로 유지. 수령/자동화 완료로 보고하지 않는다.
- 환경 조회 metadata의 ErinnNow는 에린력 시간이라고만 확인, 상세 응답 형식은 아직 확인 전. 조작이나 개인 게임 수치는 조회/보관하지 않았다. 환경/수령/크로노스 쓰기/채집·제작 큐/프리셋/자동화/음악/미디어 모두 후속으로 남는다. 한설이 기능 목표를 승인했어도 기본 자동 실행이나 실제 게임 검증 실행을 시작하는 것은 아니다.

## 2026-10-03 KST — 가공 3×2 읽기 후속 로컬 후보

- `reader.mjs` 시설별 total/가장 이른 양수 remainingSeconds만 추가(품목 DisplayName 미전송). 읽기 명령 allowlist/조회 횟수 변경 없음. `SnapshotDisplay` 고정6시설 문자열/완료/등록 배열, 정확한 시설명 공백 정규화, null/시간 미상, 잘못된 목록 조회 불가, 중복/잘못된 개수 이전 값 제거. `ModuleWindow` 기존 constructor 보존+선택형6칸 grid, 430×240, 완료 개수 비율 게이지. 실제 PowerShell 공용 timer→6칸 값/33%→연결 실패0을 테스트했다. 가공 수령 명령은 미구현/실행 안 함.
- TDD 추가 회귀: 시설별 남은 시간/등록 수,6개 매핑,3×2 control bounds/접힘/게이지 비우기, malformed list object→조회 불가 RED→GREEN. 리뷰가 지적한 탭/NBSP 시설명 인식도 실제 잘못된 대기 표시가 될 수 있어 Important로 재평가하고 RED→Regex whitespace normalization→GREEN 수정. 최신 전체 **93/93 통과**, diff 통과. 처리량/실제 게임 응답·DPI·6테마 시각 확인은 대기다.
- 독립 processing_review는 정적 검토로 critical/important 없음(공백 정규화 지적은 최종 수정 전 결과). 리뷰 환경에서는 System.Web.Extensions.dll 해석 실패로 독립 실행 못했으며 부모 환경의 C# compile 포함93/93 실제 실행 증거와 구분한다. 더보기·센터 후보까지 미커밋/미푸시, 운영 DB/배포/공지 없음. 다음 우선순위는 사용자 명시 수령 경계와 캐릭터/크로노스 인증 연결; pending 큐 없이 저장 성공/자동 종료 기능을 흉내 내지 말 것.

## 2026-10-03 09:30~ KST — 커맨드센터 안전·표시 설정 로컬 후보

- 한설은 각 위젯 ×는 숨김, 커맨드센터에서 복구, 별도 전체 종료 확인, 투명도, 6대 테마와 MoFo/AI(아님)커넥터 기능을 성역 독자 디자인으로 발전시키도록 요청했다. 자율 로컬 구현 승인 유지. 이번 묶음 구현은 센터 숨김/복구·종료 확인·6테마·전체 불투명도 40~100%만이다.
- `iris/overlay.ps1`: 센터 ×/Alt-F4는 센터만 숨김, 폴링/다른 모듈 유지. CtrlAltI 한 번 또는 트레이로 센터 복구. 센터/트레이의 종료가 기본 No 확인과 재진입 방어를 거침. Windows shutdown은 막지 않음. 테마·투명도 모달은 적용/취소/Esc, 실제 globals.css 팔레트와 모든 창 opacity 적용.
- `iris/overlay-support.cs`: DisplayPreferences version/theme/opacityPercent allowlist, 별도 display-settings.json. 기존 위치 설정과 공용 atomic writer를 사용하되 위치 JSON 형식은 그대로. 게임/계정/키 저장 없음.
- 실제 함수/설정 TDD RED→GREEN 및 전체 `node --test` **88/88 통과**, parser/C# compile 테스트 포함. 독립 reviewer `center_review`도 28/28 Windows 케이스 통과, Critical/Important 없음. Minor: 색상 차이 테스트는 실제 시각 대비를 증명하지 못함(표현·추가 대비 검증 후속). 설정 모달 중 단축키·트레이·테마 대비·DPI 실화면은 미검증, 귀가 후 확인해야 함. 기존 모듈 표시/접힘 정상 사용자 확인과 새 센터 검증은 구분한다.
- `docs/IRIS_WIDGET_ROADMAP.md`에 가공 3×2/명시 수령, 생텀 인증 체크보드/15초~최대60초 차등 저장 큐, 환경 시계, 자체 음악회 모션, Windows 미디어 리모컨, 자동 종료·프리셋 등 남은 요청과 안전 조건을 분리했다. 아직 그 기능들이 구현된 것은 아니다. 가공 총 생산시간/타인 닉네임/작곡자/악보 원문 제공을 가정하지 않음.
- 첨부 MP4는 파일 존재만 확인. 현재 ffmpeg/OpenCV/av 추출 도구 미설치라 동영상 자체 재생/모션 확인은 못했으며 첨부 정지 화면만 참고했다. 타 제작자 코드·이미지·레시피 파일 복사 없음. AI(아님)커넥터의 링크/기능 기록은 PROJECT_IRIS에 이미 있으므로 재전송 요청 불필요.
- 12:43 재개 heartbeat `iris-12-43` 조회 카드 확인, 중복 생성하지 않음. 최신 사용자 승인과 이 상태에서 남은 가공/인증 연결 작업을 이어갈 것. 미커밋/미푸시·운영 DB/배포/공지 변경 없음. 종료 시 DB 저장 완료를 표시하는 기능 없음(쓰기가 미구현).

이 문서는 **공식 push 직전 또는 직후** 현재 코드 상태를 다음 Codex 세션과 한설님에게 전달하기 위한 문서다.

## 2026-10-03 09시 전후 KST — IRIS 독립 모듈창 로컬 후보

- 사용자 실검증 추가: 한설이 모듈창이 잘 동작한다고 확인했고 스테이터스/가공/게임미션/관리창 분리 및 접힘 화면을 제공했다. 이미지/실제 캐릭터 값은 저장소에 복사하지 않는다. 다중 DPI/초점/트레이/장시간까지 완료로 확장하지 않는다.
- 후속 의논 요청: 가공6종 3×2 카드·게이지·개별 시설 완료수령, 오버레이 크로노스 수동 체크의 생텀 저장 및 저장빈도/egress 절감. 이번 턴은 제안이며 게임 조작/DB 쓰기 구현·실행 없음. capabilities 계약만 확인: get_altering_works는 DisplayName/FacilityName/State/IsCompleted/RemainingSeconds를 제공하되 시작시각/전체 소요시간 없음. 정확한 시간진행%는 불가, 완료건수/전체건수 게이지와 남은시간은 가능. complete_altering_work는 완료 DisplayName을 받아 **그 시설의 완료 작업 전체**를 이동 포함 수령, 여러 시설은 시설당1회 순차 호출. blocked/timeout/canceled/stopped_by_user 시 중단/재조회가 필요. 수령 명령 비용은 현 계약에 명시되지 않아 무료로 단정하지 않음.
- 저장 권장안(미승인 제안): 30분/1시간 대기 대신 변경만 local pending journal에 즉시 보존하고 연속 클릭10~30초 묶음/최대60초 server patch. 변경 없으면 쓰기0, 캐릭터 선택 변경/IRIS 정상종료/명시 저장 때 flush, 실패하면 pending 유지·재시도/알림. 강제 게임종료·실제 게임 캐릭터변경은 완벽히 감지/차단 불가. UI에는 서버 저장성공과 로컬대기를 구분. journal은 기존 창설정과 별도 최소 체크 ID/값/기간/operationID만, 로그인토큰·게임원본 제외; 아직 구현하지 않음. 기존 웹/파티 체크와 충돌 병합 및 일주간 경계 검증 필수.

- 한설이 독립 소형 창 방향을 승인하고 “거의 멈추지 말고 자율 아이디어·후보고”를 명시 요청했다. 설계/계획 중간 질문을 생략하는 승인이지 운영 DB·게임 조작·구매·commit/push/배포 승인으로 확장하지 않는다. 기존 예약 `iris-12-43`은 중복 생성하지 않는다. 이전 문서의 서면 승인 대기 문구는 이 최신 명시 지시로 대체한다.
- 로컬 `overlay.ps1` 관리창과 passive `overlay-modules.cs` 스테이터스/가공/게임 미션 세 창. 각 창 드래그/아코디언/개별 숨김·관리창/트레이 표시, xy/collapsed만 창별 원자 저장. global Ctrl+Alt+I/O와 폴링/서버는 관리창 하나. `overlay-native.cs`의 기본 단축키 소유 동작 보존, passive 창은 owner 복구 권한 참조. 전체 복구 때 개별 숨김 의도 유지, 모니터 제거 후 위치 보정, 시스템 개별 닫힘은 숨김으로 처리.
- TDD: 모듈 클래스/실제 timer 배분 RED→GREEN, 리뷰의 화면 밖 복귀와 system close RED→GREEN. 최신 node --test **78/78**, 별도 tsc 통과, PS parser/C# compile(테스트 내), diff 통과. 리뷰 Critical 없음/Important 위치 복구 수정. 합성 60자 직업명 고정 열 잘림 Minor는 후속 적응형 행 검토로 남긴다. 사용자 게임 화면의 창 분리·접힘·드래그·트레이·DPI·실제 프로세스 종료 확인은 아직 없다. 기존 IRIS 종료 후 동일 README 명령으로 재실행하여 확인 요청했다.
- `docs/IRIS_DISTRIBUTION.md`: MSIX/EXE 설치, 앱 코드 서명과 HTTPS 구분, Store 경로, 한국 개인 Artifact Signing 지역 제한, SmartScreen 평판, 게임 정책 확인/라이선스/SBOM/개인정보 동의/업데이트·복구 checklist. 서명 구매·스토어 등록·게임 도구 배포 허용·음악 서비스 연동 승인이 완료된 것이 아니다. Nexon 공식 CLI 가이드 존재를 IRIS 공개 배포 허용으로 단정하지 않음.
- 다음 우선 작업: `docs/superpowers/specs/2026-10-03-iris-character-kronos-design.md`에 따라 인증된 본인 캐릭터 선택/마지막 선택 기억/생텀 크로노스 읽기 연결 계획·구현을 이어간다. 현재 모듈의 게임 미션은 생텀 숙제 체크 쓰기가 아니다. 주변 연주·음악은 별도 후속 단위. localhost origin 범위 유지, 계정 쿠키/로그인 코드 native 복사 금지, stale/계정 전환/이전 요청 폐기부터 검증한다.
- 연결 기반 후속: `docs/superpowers/plans/2026-10-03-iris-character-connection.md` 작성하고 Task1 `iris/connection-state.mjs`를 합성 테스트5개 RED→GREEN으로 추가했다. 세대/선택버전·account전환/목록제거·60초 freshness·숫자/문자 ID 정규화·스키마 제한/깊은복사. **HTTP/native/browser 통합 전이며 실제 캐릭터 연결 완료 아님.** 다음 Task2 역할별 capability/Origin/Host/본문 제한과 실제 HTTP 테스트를 먼저 구현할 것. caller인증을 이 상태 클래스가 대신하지 않는다.
- 미커밋/미푸시. 웹/API/DB/게임 CLI 명령 변경 없음. 실제 운영의 더보기 테마 fix도 아직 배포되지 않았다. IRIS 공개 릴리스 노트/버전/공지 제외 지시는 유지한다.

## 2026-10-03 08:30~ KST — 더보기 테마 수정·IRIS 연결 설계 검토

- 한설 승인으로 BETA-064 고정 검정 음영을 `app/globals.css`의 주변 패널색 기반 방사형 바탕으로 교체했다. SVG·클릭·3줄 추가·DB 데이터 변경 없음. `tests/kronos-theme-preview.mjs`는 실제 ProgressiveGrid/CSS를 합성 품목으로 SSR 표시하는 로컬 검증 화면이며 클릭 동작 검증용 hydration은 없다. LUMEN 수정 전 검정 회귀 실패→수정 후 패널색/문양 확인, 6테마 배경값·가로 넘침 없음 확인. 전체 73건·별도 타입·Production 빌드 통과. 실제 `/character` 사용자 재확인과 운영 배포는 아직 대기다. pull 결과 up to date, commit/push 없음.
- IRIS 다음 방향: 오버레이에서 내 캐릭터 선택·마지막 생텀 ID 기억·크로노스 읽기 전용, 생텀 연결 클릭 시 브라우저 자동 열림(게임 초점 유지 목표). 현재 CLI 내 정보 필드/28명령에 게임 UUID·이름 조회가 확인되지 않아 자동 추정 금지. 생텀 행 ID는 게임 신원 증명이 아니다. 실제 값 없이 필드 이름/명령 계약만 읽었다.
- 대화 승인 내용을 `docs/superpowers/specs/2026-10-03-iris-character-kronos-design.md`로 정리했다. **서면 설계 검토 대기**, 이어서 구현 계획 검토·실행 방식 승인 필요. 연결용 브라우저 탭 유지, 쿠키는 브라우저만, loopback 역할별 임시 토큰, 새 목록 소유 확인, PC에는 ID만 저장, 이전 응답 폐기/60초 freshness, 로컬 origin만 허용. 뒤에서 브라우저 열림 미지원이면 자동 열림 대신 명시 버튼으로 대체. 운영 DB/새 인증 기기 토큰/쓰기·push·배포는 제외다. 신규 IRIS 연결 코드 아직 없음.

## 2026-10-03 KST — 영겁 IRIS 사용자 실검증 확인·다음 단계 검토

- 한설 일정: 약 09시 외출, 약 14시 귀가. 외출 전 설계/계획 승인과 직접 검증을 우선 받고 이후 실제 승인 범위의 로컬 작업을 자율 진행해 달라고 요청했다. 오늘 12:42:10 KST 사용량 초기화 뒤 **12:43 한 번짜리 현재 대화 재개**를 앱 heartbeat `iris-12-43`로 생성(ACTIVE)했다. 앱 도구에서 생성 성공 및 조회 카드 확인. 로컬 실행에는 PC/앱 유지가 필요하다. 자동화는 미승인 구현·운영 DB/RLS/쓰기·commit/push/배포·공지·게임 조작을 승인으로 간주하지 않는다. 실제 사용량과 최신 대화에서 승인한 설계/계획을 먼저 확인하고 중복 예약하지 않는다. 14시 확인용 결과/남은 수동 검증을 정리한다.
- 한설이 게임 위 새 오버레이 표시와 Ctrl+Alt+I 숨김/표시, Ctrl+Alt+O 클릭 통과 켜기/끄기를 직접 정상 확인했다고 전달했다. 사용자 제공 화면에서 연결 표시와 요약 행이 보였다. 개인 수치·이름·화면 파일을 저장소에 옮기지 않는다. 이는 사용자가 확인한 현재 게임 환경의 결과이며 독점 전체 화면·모든 해상도·포커스 조건까지 검증한 것은 아니다.
- 아래 10/2 후보의 미확인 목록 중 위 표시/두 단축키·입력 통과 전환만 사용자 실검증으로 갱신한다. 위치/접힘 재실행, 게임 종료/캐릭터 전환, 단축키 충돌·트레이 복구, 다중 모니터/DPI·장시간 사용은 여전히 남는다. 이번 확인 기록에는 테스트 재실행·기능 코드 변경·commit/push·배포·DB 변경이 없다.
- 한설이 다음 단계 개발 재개를 요청했다. 기존 `/iris`의 브라우저 승인/본인 캐릭터 선택은 임시 미리보기이며 Windows 오버레이의 인증된 크로노스 연결은 아직 없다. 다음 범위·새 인증 경계를 설계 중이고 구현 승인으로 앞선 단계 완료/자동 동기화/운영 DB 쓰기를 간주하지 않는다.

## 2026-10-02 22:46 KST — 영겁 IRIS 오버레이 안정화, 로컬 후보

- 한설이 v2.15 이후 IRIS 개발 재개와 짧은 설계를 승인했다. 기준 HEAD `a8f7d78`, `git pull --ff-only origin main` 결과 up to date. 이번 작업은 **미커밋/미푸시**, 운영 배포·버전·RELEASE_NOTES·공개 공지 변경 없음. 앞선 v2.15 공지 게시 완료는 그대로다.
- `iris/overlay.ps1`의 UI 스레드 동기 HTTP 조회를 `overlay-support.cs/SnapshotPoller` 비동기로 바꿨다. 고정 loopback 주소/프록시·리다이렉트 없음/최대 한 요청/45초 제한, 정상 응답 후 5초·실패 최대 30초 대기를 적용한다. 숨김 중 새 조회를 막고 숨기기 전 완료 응답도 취소 표식으로 폐기한다. HTTP 취소는 이미 진행 중인 서버의 읽기 CLI를 직접 중단시키지 않는다.
- `SnapshotDisplay`는 끊김·잘못된 응답·관측 30초 경과 시 8개 값을 비운다. 누락값을 0으로 채우지 않는다. `OverlayPreferences`는 개인 PC의 `%LOCALAPPDATA%\SanctumIRIS\overlay-settings.json`에 version/x/y/collapsed 네 필드만 원자 저장한다. 잘못된 설정은 기본값, 모니터 이탈은 현재 작업 영역으로 복구한다. 게임 데이터/이름/로그인/토큰·숨김/클릭 통과는 저장하지 않는다.
- `overlay-native.cs`는 자기 창에만 클릭 통과를 적용한다. Ctrl+Alt+I 표시/숨김, Ctrl+Alt+O 통과 토글과 트레이 표시/입력 복구를 추가했다. 두 단축키 중 하나라도 확보 실패하면 부분 등록을 해제하고 통과를 막는다. 재시작은 표시·조작 가능(저장된 접힘만 유지), HWND 파괴 때 등록 해제. 숨기기 중 드래그 잔존도 실제 함수 회귀 테스트로 실패→수정→통과했다.
- 최신 검증: **node --test 73/73(Windows 오버레이 17개 사례+상위 테스트 포함), 별도 TypeScript, Production 빌드, PowerShell AST 문법, C# .NET Framework 컴파일, diff 검사 통과**. 테스트는 합성 데이터와 실제 core/타이머/숨기기 함수, 외부 HTTP/라벨/단축키 경계 대역을 사용한다. 설정 저장은 고유 임시 폴더만 사용했고 실제 게임 값이나 사용자 AppData 파일은 조회/생성하지 않았다. 코드 리뷰에서 P0/P1/P2 지적 없음, P3 드래그 해제를 보완했다. 전체 ESLint 통과를 주장하지 않는다(앞선 기존 경고/오류 상태 유지).
- **실제 새 창 시작/게임 위 클릭 전달/전역 단축키·트레이/다중 모니터·DPI/장시간 동작은 미확인**. 현재 컴퓨터 제어의 native 앱 표면이 없어서 shell로 GUI 입력을 우회하지 않았다. 9/29 실제 수치 확인은 구형 알파의 증거이며 새 입력 기능 검증과 혼동하지 않는다. 한설이 기존 IRIS를 닫은 후 README 명령으로 새 실행 → 수치 → 숨김/복구 → 통과/복구 → 이동/접힘 재시작 → 게임 종료 값 비우기를 확인해야 한다.
- `reader.mjs`, `server.mjs`, 웹/브리지 인증/API/DB/게임 허용 명령은 변경 없음. 캐릭터 자동 인증·웹 쓰기·게임 자동 조작·설치 패키지·자동 시작은 계속 별도 과제다. D-015와 README/ARCHITECTURE/PROJECT_IRIS의 최신 상태를 참고한다. 새 push 지시 전에는 배포하지 않는다.

## 2026-10-02 21:51 KST — 영겁 v2.15 배포·업데이트 게시 완료

- 코드 커밋 `1b1b401`, Vercel Production/Ready `CrGH4wg7wJeAfadsg5UJUnLiMFeR`, 운영 HTML/실제 로그인 화면 v2.15 확인 완료. 한설 재로그인 탭으로 홈의 기존 숙제 표시와 시낙시스 빈 상태, 실제 콘텐츠 선택의 세 레이드 등록 난이도·정원을 확인했다. 실제 테스트 가입/탈퇴/반복/체크/회차 쓰기는 하지 않았다. 현재 활성 버스 없음.
- 정상 길드마스터 공지 작성 UI로 `SANCTUM BETA v2.15 업데이트 안내`를 1회 게시, 글 ID 13·작성자 `SANCTUM 시스템`·전체 내용 확인, 오류 로그 없음. https://sanctum-tawny-three.vercel.app/kerygma?id=13 . `docs/UPDATE_POST_v2.15.md`는 게시본 보관 문서다. 같은 제목/버전 공지를 다시 게시하지 않는다.
- 배포 전 전체 테스트 55/55·타입·빌드·diff 통과. 실제 회차 동작/동시 저장/새 카드 전체 폭 행렬 및 과거 물리적 손실 복구는 완료로 간주하지 않는다. 후속 결과 보관 push에는 코드·DB·구조 변경 없음. 아래 준비/로그인 대기 기록은 진행 이력이며 현재 상태는 이 완료 항목을 우선한다.

- 21:46 KST: 한설의 Vercel 로그인 후 코드 배포의 Ready/Production/현재 운영 도메인을 브라우저로 직접 확인하고 증거 화면을 저장했다. 생텀 계정은 아직 로그인 화면이어서 별도 재로그인을 요청했다. 대시보드 인증을 생텀 계정 인증으로 간주하지 않는다.

- 21:44 KST 결과: `1b1b401` push 및 GitHub Vercel success(`CrGH4wg7wJeAfadsg5UJUnLiMFeR`), 핵심 운영 경로 200/HTML v2.15 및 인증 헬스 ready true 확인. Vercel 대시보드는 로그인 필요로 Ready 라벨 직접 확인 불가. 앞서 보인 한설 계정은 오래된 클라이언트 표시로 서버 세션 만료 후 로그인 화면으로 이동했다. 비밀값을 추출하거나 권한을 우회하지 않고 한설에게 운영 재로그인을 요청했다. 로그인된 새 핵심 화면 및 공지 게시 대기. 공지 초안 `docs/UPDATE_POST_v2.15.md`, 동일 제목이 이미 게시돼 있는지 다시 확인하고 작성자/글 ID/링크까지 확인할 것.

- 공식 커밋 직전 재검증: 전체 테스트 55/55·별도 타입 검사·Production 빌드·diff 검사 통과. 운영 브라우저에 한설 길드마스터 세션이 있으며 기존 시낙시스는 활성 파티 없는 정상 빈 상태로 로딩된다. 새로운 파티 생성/완료/탈퇴 같은 운영 테스트 쓰기는 하지 않는다.

- 한설이 로컬 길드버스 표시를 확인하고 공식 push와 다정한 업데이트 글 게시를 요청했다. 이전 핫픽스의 버전/공개 노트 보류 지시를 이번 릴리스에 통합한다. `lib/release.ts`를 v2.15로 올리며 시낙시스·크로노스 BETA-057~063 변경을 함께 배포한다. IRIS는 공개 업데이트 글에 포함하지 않는다.
- 직전 운영 기준선 `c7f1aa3`, GitHub Vercel 상태 success 및 배포 `Bnd9QDJMH3E7svwn8GX4piwExFrR` 확인. Vercel 연결 도구는 해당 팀 범위 403이므로 GitHub 배포 상태와 실제 운영 화면을 함께 확인한다. 배포 성공 확인 전에는 공지를 게시하지 않는다.
- 기존 공지 작성 UI/API를 통해 길드마스터 세션으로 `생텀 업데이트`를 한 번 게시한다. 작성자는 서버의 `SANCTUM 시스템`, 제목은 `SANCTUM BETA v2.15 업데이트 안내`로 고정해 중복 확인한다. 계정 권한을 우회하거나 서비스 역할로 직접 삽입하지 않는다.
- 자동 테스트·타입·빌드·diff는 커밋 전에 재실행한다. 로컬 표시 확인은 실제 운영 저장 검증을 대신하지 않는다. 여러 행 회차 저장은 단일 트랜잭션이 아니고, 이미 물리적으로 사라진 숙제 기록은 복구하지 않았다. 신규 DB 구조/SQL/RLS 변경 없음. 아래 이전 로컬 기록의 미배포/보류 표기는 당시 상태이며 이번 공식 결과를 우선한다.

## 2026-10-02 KST — 영겁 길드버스 2줄·유동 닉네임 후속, 로컬 수정

- BETA-063: 한설이 앞선 큰 출전자 카드를 줄이도록 승인했다. 공통 `GuildBusCard`는 아이콘/현재 역할/전체 전투력 윗줄, 이름 아랫줄의 2줄 구조다. 슬롯 최소 높이 3.25rem, 실제 카드 폭 기준 20rem부터 2열·39rem부터 4열이다. 기존 헤더/컨트롤러/참여 칩 래핑과 fixed 모달 경계는 유지한다.
- `ResponsiveMemberName`은 전체 이름의 숨겨진 측정 폭과 칸의 실제 폭을 `ResizeObserver`로 비교한다. 들어가면 실제 닉네임, 부족하면 유효한 저장 alias/tempAlias 최대 3자, 없으면 실제 이름 앞 3자를 표시한다. 글자 축소·말줄임으로 이름을 잘라 보이지 않는다. 전체 이름 title/접근성 이름은 유지한다. 폰트 로드·크기 변경 재측정 및 관찰 해제 처리를 포함한다. 리뷰에서 참가 `members` JSON에는 저장 애칭이 없음을 발견해, 홈의 이미 조회한 전체 캐릭터 목록과 시낙시스의 기존 캐릭터 맵을 `characterProfiles`로 전달했다. 현재 캐릭터 애칭을 우선하고 구형 멤버 애칭은 보조로만 사용한다. 추가 조회/구성/신청/반복/탈퇴/DB 저장 영향 없음.
- 합성 실제 카드 브라우저에서 기존 109px·3줄을 확인하고 수정 후 66px·2줄, 540px 카드의 전체 12자 이름(별칭 존재), 836px 카드의 앞 3자 전환을 확인했다. 추가 모바일/PC 글자 설정 행렬은 Next build가 테스트 JS를 지워 임시 서버가 종료된 뒤 오류 탭 URL 정책에 막혀 중단했다. 서버가 생성 JS를 메모리에 보관하도록 보완했지만 차단 탭을 우회 재시도하지 않았다. 남은 폭·큰 수치·실시간 리사이즈 검증은 새 사용자 검증 세션에서 이어가야 한다.
- 실제 로컬 `/party` 200 및 로그인된 화면 정상 로딩 확인, 현재 활성 파티가 없어 실제 카드 검증은 미완료다. 개발 서버 3000은 계속 실행 중. 테스트 화면 3010은 세션/DB 없이 이름 위젯만 hydrate하고 모든 파티 버튼은 비활성 동작이다.
- `node --test` 55건·별도 타입 검사·Production 빌드·새 이름 위젯/테스트 유틸 린트 통과. 저장 애칭 누락 회귀는 수정 전 `열두글`≠`별명` 실패→수정 후 통과 확인, 후속 읽기 전용 코드 리뷰 추가 지적 없음. 기존 `GuildBusCard` 전체 린트 14오류/7경고는 남아 있어 전체 린트 통과로 표시하지 않는다. commit/push/운영 DB/버전/공개 노트 변경 없음, 다음 릴리스 통합 지시 유지.

## 2026-10-02 KST — 영겁 길드버스 반응형 방어, 로컬 수정

- 로컬 재접속 BETA-062: 3000 리스너가 없어 연결 거부가 났다. 제한 환경에서 시작한 서버는 홈 200이지만 인증 헬스 503이었으며, 해당 프로세스를 중지하고 네트워크 제한 밖에서 다시 시작해 홈 200·인증 헬스 200/ready true 확인. 현재 개발 서버 실행 중. 오류 상태의 기존 브라우저 탭은 자동화 URL 정책에 막혀 새 탭 우회 없이 한설에게 새로고침을 요청했다. 이 복구에는 앱 코드 변경이 없다.

- BETA-061: 실제 카드 폭과 무관한 viewport `sm` 4열/가로 컨트롤러, 3글자 닉네임 절단과 말줄임이 원인이었다. `GuildBusCard.module.css`의 명명된 컨테이너 쿼리로 출전자 1/2/4열을 적용하고 전체 닉네임·전투력을 표시한다. 컨트롤러는 버튼 문구를 한 줄로 유지한 채 버튼 전체가 다음 줄로 넘어간다. 본인 참여 칩·상태/안내 행·상단 시간/단장도 감싼다.
- `PartyFilterHeader.module.css`는 목록 제목 축소를 막고 카테고리 탭을 다음 줄로 넘긴다. 좁은 컨테이너에서는 검색창과 상태/날짜 필터가 별도 줄을 사용한다. 홈 확장 미리보기와 `/party`가 동일 `GuildBusCard`를 사용한다. 크기 쿼리 컨테이너는 본문에만 적용해 기존 fixed 참가/인계 모달의 화면 기준 위치를 바꾸지 않는다. 이벤트·API·DB 변경 없음.
- `tests/party-render.test.mjs`에서 실제 카드의 12자 이름이 출전자/참여 칩 모두 표시되는 회귀를 수정 전 실패→수정 후 통과로 확인했다. 전체 테스트 52건·타입·Production 빌드 통과. 기존 헤더 ESLint의 any 2건/미사용 prop 경고는 남아 있으며 전체 린트 통과로 표시하지 않는다.
- `node tests/party-layout-preview.mjs`는 127.0.0.1:3010 읽기 전용 합성 화면이다. 실제 카드/헤더와 로컬 Tailwind CSS를 렌더하지만 세션/DB/실제 버튼 이벤트는 사용하지 않는다. 개발 CSS가 생성된 환경에서 사용한다. 브라우저 320/390/768/1280, PC 18/20/22px 및 넓은 화면의 540px 중첩 카드에서 숨긴 글자·버튼 돌출·가로 스크롤 없음 확인. 운영 버튼 저장 검증 근거가 아니다.
- 이전 BETA-057~060 변경은 보존했다. 한설이 양쪽 콘텐츠 난이도 표시를 확인했다고 답했다. 운영 DB/commit/push/배포 없음. 버전·공개 노트·공지 없이 다음 릴리스 통합 지시 유지. BETA-057~059 실제 저장/회차 확인은 여전히 별도 필요하다.

## 2026-10-01 KST — 영겁 콘텐츠 난이도 후속 핫픽스, 로컬 검증 완료

- BETA-060: DB는 정상인데 일반 파티/길드버스의 `ContentSelectModal`이 `CONTENT_DB` 고정 5개 난이도를 사용했다. 읽기 전용 확인 결과 카브락은 입문/어려움(8인), 화이트 서큐버스·에이렐은 어려움/매우 어려움(4인)이다. 기존 고정 목록은 9/21부터 있었으며 이번 DB 데이터 혼합이 아니다.
- `lib/partyContentCatalog.ts`가 콘텐츠 종류+정확한 정규화 이름으로 DB 난이도를 구성한다. `CONTENT_DB`는 기존 선택 ID/이름만 유지하며 고정 `diffs`를 UI 선택지로 사용하지 않는다. 어비스 다중은 선택한 모든 던전의 공통 난이도만 허용한다. DB의 `지옥1`과 구형 `지옥 1` 조회를 호환하고 인원/전투력 조회도 선택 난이도에 맞춘다.
- `app/party/page.tsx`→`PartyModals`→일반 선택 모달 및 `BusCreateModal`→버스 선택 모달에 같은 필수 `PartyCatalog`를 전달한다. 모달은 현재 유효 선택값을 직접 적용 콜백으로 전달해 상태 변경 시점에 의존하지 않는다. 기준 로딩/실패/미등록 시 적용을 막으며 신청/개설 전 클라이언트도 유효 난이도를 확인한다. 기존 잘못 생성된 파티를 일괄 수정하지 않는다.
- 난이도 회귀 12건 추가, 전체 `node --test` 51건·`npx tsc --noEmit`·Production 빌드·새 공통 유틸/선택 모달 ESLint 통과. 로그인된 로컬 `/party`의 일반/버스 선택 화면에서 세 레이드 각각 두 난이도 확인, 에이렐 매우 어려움 적용 후 설정/공지 메모 반영, 새 검증 탭 콘솔 오류 0건 확인. 기존 탭 자동화 응답 지연으로 새 임시 검증 탭을 사용했다. 실제 파티 개설/가입/회차 완료는 수행하지 않았다.
- 별도 코드 리뷰에서 새 DB 표기 `지옥1`과 기존 파티 `지옥 1`의 엄격 비교가 매칭을 나누는 회귀를 발견했다. 실제 `handleReservation`을 외부 IO 대역으로 실행하는 테스트를 추가해 수정 전 신규 insert를 재현하고, 공유 난이도 정규화 비교로 수정 후 기존 파티 update를 확인했다. 기존 파티 데이터 자체는 수정하지 않았다.
- 운영 DB 데이터/구조/RLS 변경 없음, commit/push/운영 배포 없음. 한설의 핫픽스 통합 지시에 따라 버전·공개 업데이트 노트·케리그마 공지는 그대로 유지한다. 앞선 BETA-057~059의 실제 운영 저장/회차 검증은 여전히 별도 필요하다.

## 2026-10-01 KST — 영겁 길드버스·크로노스 회귀 수정, 로컬 검증 후보

- 한설 제보: 홈/시낙시스 역할·반복/탈퇴 차이, 4인 버스 대표 반복 캐릭터 고정, 재구성/다음 회차 정체, 파티 완료 후 크로노스 기존 기록 초기화·홈 완료 해제 실패. BETA-057~059로 접수했다. 기준 HEAD는 `c7f1aa3`; 시작 때 남아 있던 버스/동기화 변경도 보존해 이어서 수정했다. 아직 commit/push하지 않았다.
- 두 화면은 원래 같은 카드 파일을 쓰지만 카탈로그 전달과 변경 콜백이 달랐다. `usePartyCatalog`로 클래스/콘텐츠/전투력 기준을 공통 조회·중복 방지하고 두 카드에 필수 전달한다. 현재 관리자 역할이 저장 당시 `member.role`보다 우선하며, 서포터는 정확히 음유시인만 허용한다. 공통 `isGuildBusParty`가 레거시 memo도 판별한다.
- `GuildBusCard`가 반복/선택 캐릭터 탈퇴/재구성/다음 회차를 직접 공통 처리한다. `guildBusActions`→서버 `_busMemberAction`은 최신 멤버 목록에서 본인 대상만 바꾸고 멤버 JSON 비교로 충돌을 감지한다. 다른 운영진도 현재 운행자가 아니면 컨트롤러 작업/회차 완료/해산을 거부한다. 본인 캐릭터가 없을 때 전체 캐릭터를 자기 목록으로 쓰던 fallback을 제거했다. 탑승은 이름·난이도가 아니라 해당 버스 ID의 최신 행을 조회한다.
- `assembleBalancedParty`는 첫 구성부터 4인 압도/권장/그 외 각 1~2명, 8인 압도 3명·권장 2~3명·그 외 2~3명을 목표로 계정당 한 캐릭터를 고른다. 미완료 대기자를 우선하며 부족한 등급은 가능한 다른 후보로 충원한다. 관리자 기준 조회에 접두사 정규화를 적용하고, 압도 컷 누락을 전원 압도로 해석하지 않는다. 재구성/다음 회차는 멤버 JSON의 `selection_order`를 저장한다. 참여 시간 필터와 공지 메모 렌더링은 유지한다.
- 기존 `raid_checks` 배열을 객체로 펼친 저장 때문에 숫자 키 객체가 생겼고, 크로노스 배열 전용 파싱은 이를 빈 목록으로 봤다. `normalizeChecklist`로 배열/문자열/boolean map/숫자 키 객체를 읽고, `setTaskChecked`로 별칭과 ID를 일관되게 완료/해제한다. 홈은 `_checklistAction`으로 최신 서버 기록의 해당 항목만 수정한다. 크로노스 자동 저장은 `_checklistBase`와 최신 기록을 비교해 사용자가 바꾼 차이만 병합하며 저장 큐를 직렬화한다. 기존 다른 완료 기록을 보존하는 회귀 테스트가 있다.
- `node --test` 39건, `npx tsc --noEmit`, `npm run build`, 신규 공통 훅/액션/테스트 ESLint, `git diff --check` 통과. 실제 TS 함수·API·카드를 실행하며 DB는 메모리 대역으로 검증한다. 로컬 서버를 정상 네트워크 환경에서 다시 켜 로그인된 홈 `/`·시낙시스 `/party` 로딩을 확인했다. 두 화면에 활성 파티가 없어 실제 역할 배지/버튼 저장/회차 완료는 한설 검증 대기다. 운영 계정/파티를 테스트용으로 생성·완료·삭제하지 않았다.
- DB 테이블·컬럼·RLS·함수 변경/SQL 실행 없음. `selection_order`는 기존 `members` JSON 안의 앱 메타데이터다. 회차 완료는 여러 행을 단일 DB 트랜잭션으로 갱신하지 못하므로 일부 저장 후 오류가 날 수 있으며, 오류를 숨기지 않고 재조회/재시도한다. 이미 물리적으로 덮어써진 과거 완료 기록 복구는 별도 백업/승인이 필요하다; 이번 파서 호환 수정과 혼동하지 말 것.
- **한설 지시: 이번 핫픽스는 버전 상승·공개 업데이트 노트·케리그마 공지를 따로 내지 않고 다음 정식 릴리스에 합친다.** 이 지시를 유지하며 이번 로컬 작업은 push 미승인 상태다. 다음 검증은 테스트용 버스를 홈에서 펼쳐 역할 확인→반복 해제→시낙시스/새로고침에 유지 확인→선택 캐릭터 탈퇴 확인 순서다. 기존 운영 기록을 대량 초기화/보정하지 않는다.

## 2026-09-29 20:40 KST — 영겁 main push 후 운영 1차 확인

- 순월의 `1793c3d` 위에 집의 로컬 읽기·브라우저 확인·Windows 오버레이를 합쳐 `527c134`로 main에 push했다. 한설 스크린샷에서 오버레이 실제 수치 표시를 확인했다. `v2.14` 유지, 케리그마 업데이트 공지 없음, DB 직접 변경 없음.
- 합친 코드에서 TypeScript·Production 빌드·리더 테스트 4건 통과. 운영 홈·로그인·캐릭터·케리그마·파티·관리자·인증 헬스는 HTTP 200, `/companion-preview`는 404, 새 `/iris`는 200, 비로그인 `/api/iris/characters`는 401이었다. Vercel API는 팀 접근 403으로 Ready 표시를 직접 확인하지 못했다. 로그인 후 핵심 조작·게임 전체 화면 위 오버레이는 미검증이다.
- 이 운영 확인 기록만 더하는 후속 문서 push에는 코드·DB·구조 변경이 없다.

## 2026-09-28 KST — v2.14 유지, Sanctum IRIS 인계

- 한설이 새 Windows 동반 프로그램의 이름을 **Sanctum IRIS / 프로젝트_IRIS**로 확정했다. `docs/PROJECT_IRIS.md`가 사실·미확인·단계·안전 경계의 기준 문서이고, `docs/DECISIONS.md` D-014가 명칭과 장기 방향을 기록한다. 기존 그노시스·엠포리온 기능은 유지한다.
- 개발 환경 전용 `app/companion-preview/` 샘플 웹 화면을 인계한다. 크로노스 체크·스탯 변경분·시낙시스 파티 요약은 샘플 상태이며 실제 Windows HUD·게임/DB 동기화는 아니다. 운영 빌드의 해당 경로는 404다. 공식 게임 CLI `get_my_info`의 본인 조회는 일반 PC 환경에서 성공했지만 Codex 격리 환경에서는 `game_off` 오진이 있었으므로 연결 실패를 성급히 단정하지 말 것. 개인 값은 기록하지 않았다.
- **이번 push에는 버전 상승 없음.** 운영 API·DB·권한을 바꾸지 않는다. 별도로 남아 있는 케리그마 부마스터 편집 권한 코드와 D-013/베타 피드백은 이번 커밋에서 제외하고 사무실 작업 트리에 보존한다. 영겁은 집 PC `main` pull 뒤 IRIS 문서·시제품과 릴레이 `SW-20260928-001`을 읽고 ACK할 것. 실제 구현/DB 변경 전에 한설과 단계 0 범위를 합의한다.
- 기준선은 v2.14 `6b3948c`(기능 코드 `be5d1c2`). TypeScript·신규 ESLint·빌드·시제품 404/반응형 검증 통과. push 뒤 Vercel Ready, 운영 로그인·캐릭터·공지·파티·관리자 공개 경로와 운영 시제품 404를 확인하고 결과를 릴리스 노트에 반영해야 배포 확인이 끝난다.

## 2026-09-29 KST — IRIS 로컬 읽기 시제품 인계 (`v2.14` 유지)

- 한설 결정: SANCTUM과 IRIS는 순월·영겁이 공동 개발한다. 최종 목표는 게임 오버레이와 안전한 동기화지만, 이번 push 범위는 집 PC 로컬 게임 CLI의 읽기 전용 시제품·생텀 내 캐릭터 확인·브라우저 미리보기다. 모델 계정/사용량을 길드원에게 필수로 요구하지 않는다.
- `iris/reader.mjs`는 허용한 5개 읽기 명령만 호출한다. `iris/server.mjs`는 `127.0.0.1:4317`에서만 제공하고, 로컬 화면의 명시적 승인으로 30분짜리 토큰을 발급한다. 생텀 개발 Origin과 토큰이 모두 맞을 때만 브라우저 미리보기가 읽힌다. 15초 간격 표시이며 연결 해제로 토큰을 폐기한다. 게임 조작·DB 쓰기·원격 전송 없음.
- `/api/iris/characters`는 생텀 서버 세션을 검증하고 로그인 계정 소유 캐릭터만 읽는다. `/iris`는 크로노스와 공용 `OwnedCharacterPicker`에서 대상 캐릭터를 사용자가 직접 선택·확인한다. 게임 API는 닉네임을 제공하지 않으므로 이 확인은 동일 인물 증명이 아니다. 계정/캐릭터별 영구 페어링과 안전한 동기화는 미구현이다.
- 집에서 로컬 승인→생텀 복귀→캐릭터 선택·확인→게임 값 표시를 로그인 브라우저에서 확인했다. `npx tsc --noEmit`, `npm run build`, `node --test iris/reader.test.mjs` 통과. 허용 Origin+토큰은 200, 다른 Origin·토큰 누락은 403, Private Network preflight는 204였다. 운영 DB·스키마·권한 직접 변경 없음.
- Windows PowerShell용 `iris/overlay.ps1`을 추가했다. 한설의 PC에서 로컬 서버를 일반 터미널에서 재시작한 뒤 직업·레벨, 5개 스탯, 가공기, 일일·주간 숙제 수치가 실제로 표시되는 스크린샷을 확인했다. Codex 격리 환경의 오래된 4317 서버는 `game_off`를 반환해 종료했다. 게임 전체 화면 위 표시와 장시간 연결 안정성은 미검증이다.
- 순월: 사무실에서 먼저 `git status`를 확인해 미커밋 파일을 보존하고, 깨끗하면 `git pull --ff-only origin main`으로 받는다. `docs/relay/TO_SOONWOL.md`의 `YG-20260929-001`을 읽고 ACK한다. 사무실 게임/CLI 환경에서 `iris/overlay.ps1`을 실행하려면 MM AI 에이전트가 켜져 있어야 한다. 게임 자동 제작·채집, 닉네임 확인, 운영 DB 동기화는 아직 시작하지 않는다. 구체 한계는 `iris/CAPABILITY_AUDIT.md`, 후보 매핑은 `iris/DATA_CONTRACT.md` 참조.
- 본 기능은 공개 메뉴에 연결하지 않고 공식 이용 안내·케리그마 업데이트 공지에 넣지 않는다. `lib/release.ts`의 버전은 한설 지시대로 `v2.14` 유지한다. main push로 Vercel에 새 코드가 제공될 수 있어 운영 공개 핵심 경로·인증 헬스를 배포 후 확인한다.

## 2026-09-28 KST — v2.14 크로노스 후속 개선

- 루나 작업 트리의 3줄씩 더보기, 한설 제공 `더보기.svg`의 작은 테마 디바이더, 물물교환·상점·임무 카드의 공통 정보/하단 조작 배치와 완료 테두리·수량 표시를 정리했다. 물물교환 MAX/MIN을 추가했다. `BETA-050`, `052`~`055` 참조.
- 물물교환의 일간/주간 경계는 `kronosPeriodStart`의 KST 06시로 판단한다. 구형 `trade_checks`는 완료로 추정하지 않지만 다른 설정 저장 시 원본 JSON을 보존한다. 실제 조작한 교환 ID만 v2 기간으로 갱신하고, 계정당 ID는 기간까지 다른 소유 캐릭터에 동기화한다. 테이블·권한·운영 데이터 직접 변경 없음.
- TypeScript·Production 빌드 통과. 실제 로그인 후 320/390/768/1280px 카드 배치, 3줄 더보기, 캐릭터 간 계정당 교환, 일/주간 06시 경계는 운영 실검증이 남는다. v2.13의 공지 읽음 두 기기 확인도 미완료다. 직전 정상 기준선 `6e76476`.
- `be5d1c2`를 main에 push했다. 운영 `/character`의 v2.14 HTML, 더보기 SVG, 홈·로그인·공지·파티·관리자 공개 경로와 인증 헬스의 200 응답을 확인했다. Vercel Ready 대시보드는 미확인이고 로그인 후 카드 조작·교환 동기화는 미검증이므로 최종 배포 완료로 단정하지 않는다. 이 줄을 더하는 문서 후속 push에는 코드·DB·구조 변경이 없다.

## 2026-09-28 KST — v2.13 배포 후보

- 케리그마 읽음 서버 기록(운영 `notice_reads` SQL·권한 확인 완료), 배너가 있는 헤더의 높이 재측정/상단 복원, 캐릭터 관리의 변경분 저장·즉시 진행 상태, 크로노스 기능 선택 강조를 같은 배포 후보에 모았다. 기존 알림함의 개인 읽지 않음 표시는 로컬로 유지한다.
- 물물교환·상점·임무의 즐겨찾기 우선 정렬은 그대로 두고, 각 반응형 그리드에서 처음 6줄과 클릭마다 6줄을 표시하는 `ProgressiveGrid`를 추가했다. 기능 선택의 중복 안내 문구를 제거했다.
- `20260928_kronos_weekly_shop_catalog.sql`은 주간 골드 상점 128개 원본 품목 중 기존 앨빈 사포를 건너뛰고 127개를 운영 DB에 추가했다. 한설 승인·최근 백업 `2026-09-27 23:13:52 UTC` 확인 뒤 실행 성공을 보고했다. 사전 품목 1·최대 ID 1·앨빈 1, 사후 품목 128·앨빈 1·중복 0, RLS true·익명 SELECT/INSERT false를 읽기 전용으로 검증했다. 기존 앨빈 사포·구매/즐겨찾기 기록은 수정하지 않았다. 앱 푸시 뒤 실제 카드/조건 표시 확인이 남았다.
- 버전 표기는 v2.13. 로컬 TypeScript·Production 빌드 및 새 크로노스 컴포넌트 ESLint 통과. `app/character/page.tsx` 전체 ESLint의 기존 오류는 남는다. Vercel Ready와 운영 로그인/공지/캐릭터/파티/관리자 핵심 화면, 두 기기의 공지 읽음 및 반응형 6줄·더보기 실화면은 아직 확인 전이다.
- `d9e6fe9`를 `main`에 push했고, 운영 `/character` 200 및 `BETA v2.13`, 인증 헬스 200/ready true, 로그인·케리그마·파티·관리자 공개 경로 200, 비로그인 공지 읽음 조회 401을 확인했다. 길드원 계정으로 카드/더보기와 읽음 목록·캐릭터 저장을 확인해야 배포를 최종 완료로 판정할 수 있다. Vercel 대시보드 Ready 표시는 미확인이다. 이 줄을 더하는 후속 문서 push에는 코드·구조·DB 변경이 없다.

## 2026-09-28 KST — 사무실 로컬 수정, 운영 미반영

- 순월이 `origin/main`의 v2.12 결과 기록 커밋 `d7c3681`까지 fast-forward pull하고 영겁의 릴레이에 ACK를 로컬 기록했다. 아직 commit/push하지 않았다.
- 한설이 본인 계정의 접속 코드 변경이 동작한다고 보고했다. 다른 기기의 이전 세션 무효화는 별도 확인 전이며 코드 원문은 받지 않았다.
- 케리그마 `읽은 길드원 목록`은 현재 기기 localStorage만 읽는 것이 원인으로 확인됐다. 세션 확인 서버 API와 비공개 `notice_reads` 추가 SQL을 로컬 준비했다. **한설이 2026-09-28 운영 SQL Editor 적용 성공을 보고했고**, 읽기 전용 진단에서 테이블 존재·RLS 활성화 true, anon/authenticated SELECT·INSERT false, service_role 읽기·쓰기 true를 확인했다. 기존 공지·계정 데이터는 변경하지 않았고, 과거 기기별 읽음 기록은 합치지 않는다. 서로 다른 계정/기기 실검증은 아직 대기 중이다. 앱 코드는 미배포이므로 현재 운영의 읽음 목록은 여전히 브라우저 로컬 기준이다.
- 송출 배너가 있는 고정 헤더가 이전 스크롤 위치의 본문 상단을 가리는 제보에 대해 경로 및 케리그마 공지 전환 시 상단 이동을 로컬 적용했다. 실제 PC/모바일 화면 확인이 남았다. 타입·빌드 통과, 신규 서버 API ESLint 통과; 기존 전체 화면 파일에는 이전 lint 오류가 남는다.

## 2026-09-28 KST — v2.12 아고라/개인 설정 작업

- 한설 제보: 아스트라에서 종료 시각이 지난 파티의 `파티중` 표시가 남고, 추방한 테스트 계정의 캐릭터가 아스트라에 남음. 아스트라는 파티 날짜·시각·상태를 함께 확인하고, 승인된 계정 소유자의 캐릭터만 표시한다. 홈 요약·판테온·판테온 알림도 같은 승인 계정 필터를 적용했다. 실제 DB의 고아 캐릭터·파티 데이터는 삭제하지 않았다.
- 계정 메뉴에서 `/account/settings`로 이동해 현재 접속 코드를 검증하고 새 코드로 변경하는 서버 경로를 추가했다. 변경 전에 해당 계정의 모든 세션을 무효화하며, 실패 시 기존 코드로 재로그인해야 한다. 비밀 코드는 로그나 문서에 남기지 않는다.
- 로컬 아스트라에서 테스트 계정 카드가 사라지고 지난 파티 배지가 사라진 것을 확인했다. 개인 설정 화면의 로그인 계정·입력칸·로그아웃 안내를 확인했다. 합성 시간 판정 경계 검사를 통과했다. 실제 운영 계정 코드 변경은 수행하지 않았으므로, 순월은 전용 승인 테스트 계정으로 변경→모든 기기 로그아웃→새 코드 로그인 동작을 확인하고 필요 시 후속 수정할 것. 운영 DB 기존 레코드 정리는 한설 승인 전 금지.
- `npm run build`, `npx tsc --noEmit`, 신규 파일 ESLint, 비로그인 변경 요청 401, `git diff --check` 통과. 기존 `hooks/useNoticeNotifications.ts` 전체 린트에는 이번 변경과 무관한 `react-hooks/set-state-in-effect` 2건이 남아 있다. 배포 이후 운영 코드 변경 화면은 실코드 입력 없이 읽기 전용으로 확인한다.
- 사무실에서 시작할 때 먼저 `git status`를 확인하고 깨끗하면 `git pull --ff-only origin main`으로 동기화한다. 작업 중 변경이 있거나 fast-forward가 안 되면 덮어쓰지 말고 충돌을 확인한다. 최신 배포·운영 화면 검증 상태는 본 문서 최상단과 릴레이 발신함을 우선한다.
- `50dd039`를 `main`에 push했다. 운영 홈의 `BETA v2.12`, `/account/settings` 200 및 계정 입력 화면, 아스트라 SOL 14/LUNA 53과 지난 파티 배지 제거를 실제 확인했다. Vercel 대시보드 Ready 자체는 확인하지 못했지만 새 운영 화면은 제공 중이다. 본 문서 후속 기록 push는 코드·구조 변경 없음.

## 2026-09-27 KST — v2.11 케리그마 핫픽스

- 한설이 중간 폭 케리그마의 카테고리 가로 스크롤과 소개 문구 잘림을 제보했다. 700px 이상은 7개 탭 단일 행·중간 폭 짧은 라벨, 운영진 작성 버튼 하단 분리로 수정했다. 1280px 미만은 소개를 `(i)` 모달로 전환했다.
- 새 `생텀 업데이트` 공지는 길드마스터만 서버 저장 가능하며 `SANCTUM 시스템` 작성자로 기록된다. 같은 제목은 409로 중복 방어한다. DB 구조·기존 글 변경 없음.
- 이전 v2.1 push `e5ac849` 직후의 문서 인계 변경은 이번 커밋에 포함한다. v2.11 push·Vercel Ready·운영 화면 확인 뒤, 인사말이 포함된 업데이트 공지를 중복 확인 후 한 번만 게시한다.
- `41a8fe9`를 `main`에 push했다. 운영 `/kerygma`에 `BETA v2.11`과 7개 분류 한 줄, 작성 버튼 분리, `(i)` 안내 열기·Escape 닫기가 반영된 것을 확인했다. `생텀 업데이트`에 `SANCTUM BETA v2.11 업데이트 안내`를 글 ID 11로 한 번 게시했고 작성자 `SANCTUM 시스템`·본문 표시를 확인했다. https://sanctum-tawny-three.vercel.app/kerygma?id=11

## 2026-09-27 KST — v2.1 공식 push 완료

- `lib/release.ts`를 `v2.1`로 올리고 중간 폭 Navbar에서 베타 버전만 홀로 남지 않도록 축약 배지를 제거했다.
- v2.1 릴리스 노트에 실시간 배너·공지 갱신, 파티 카드, 판테온 알림, 홈 신청 모달, 클래스 카드, 모바일 플로팅 메뉴 개선을 기록했다.
- `e5ac849`로 `main`에 공식 push 완료. 새 SVG와 릴리스 노트·마스터 가이드·릴레이 문서를 같은 커밋에 포함했다. DB 구조·권한·운영 데이터 변경은 없다.
- 빌드·타입·차이 검사 통과. 남은 확인은 Vercel 배포 Ready 상태와 운영 화면에서 중간 폭 Navbar, 플로팅 메뉴, 공지/배너 실시간 갱신, 파티·클래스 카드의 최종 표시다. 운영 `생텀 업데이트` 공지는 배포 Ready와 화면 확인 후 중복 없이 게시한다.

## 2026-09-27 KST — 관리자·알림·배너·파티 카드 로컬 수정

- 모바일 플로팅 메뉴의 여러 겹 광선·외곽 배경·임의 마크 안은 한설 피드백으로 폐기했다. 한설이 추가한 `public/svgs/logo/바텀메뉴버튼.svg`(현재 미추적 파일)를 테마 `--accent` 마스크로 쓰고 로고 중앙은 `--panel`로 채웠다. 단일 후광에 닫힌 상태의 드문 두 박자 하트비트, 누르는 동안의 축소·밝기 반응, 열린 상태의 약간 작은 로고를 더했다. 동작 감소 설정에서는 반복 애니메이션을 끈다. 접근성 이름과 클릭·드래그는 유지한다. 실제 화면 재확인 대기이며 커밋 시 새 SVG도 포함해야 한다.
- `KronosWorkspace` 임무 카드는 보상과 횟수 조작을 한 줄에 배치할 공간이 있으면 나란히 놓고, 폭이 좁으면 감싼다. 안쪽 여백·행 간격을 줄이되 제목·임무·보상명·수량은 생략하지 않는다. DB·API 영향 없음. 로컬 화면 확인 대기.
- `ClassLevelManager`는 640px 이상에서 직업 마크·전체 이름·레벨 입력 한 줄, 1~65 게이지 둘째 줄로 바꿨다. 기존 증감/MAX/MIN 버튼은 이 구간에서 제거했고, 640px 미만 모바일 조작은 유지했다. DB 구조·권한 변경 없음. 빌드·타입 검사 통과, 로컬 실제 화면 확인 대기. push·배포하지 않았다.

- `/admin` 인증 후 빈 화면의 이전 스크롤 위치가 복원돼 관리자 제목이 고정 헤더에 가리는 현상에 대해 계정 확인 직후 맨 위로 이동시켰다.
- `app/layout.tsx`의 긴급 배너는 최초 1회 조회에서 변경 감지·화면 활성 상태 30초 재조회로 확장했다. 관리자 배너 저장 직후에는 같은 창에 갱신 이벤트를 보낸다. `hooks/useNoticeNotifications.ts`도 새 공지 Realtime 외에 화면 활성 상태 30초 재조회 및 중복 브라우저 알림 방어를 갖췄다. Realtime DB publication이 꺼져 있어도 열린 화면은 최대 약 30초 후 새 데이터를 확인한다.
- 시낙시스 파티원 슬롯의 이름 말줄임을 없앴고, 전투력·마도저항은 큰 아이콘과 숫자만 각 한 줄로, 신청 시간은 문구 없이 시계 아이콘과 시간만 한 줄로 배치했다. 후속 확인에서 좁은 카드의 닉네임 꺾임과 시간 넘침이 발견돼 `PartyCard.module.css`의 카드 폭 기준 1·2·4열 전환으로 보완했다. DB·기존 레코드·권한 변경 없음. 관리자 화면은 한설이 정상 확인했다. 파티 최종 화면과 두 브라우저 간 배너/공지 갱신 확인 대기. 현재 로컬 수정이며 push·배포하지 않았다.
- 홈 판테온 Top 3 카드는 순위·직업·닉네임과 수치를 분리하고 CP/LV/PT 등 단위를 제거해 넘침을 막았다. SYMPHONIA·HARMONIA 등 긴 카테고리 탭 이름도 한 줄 그대로 화면 폭에 맞춰 글자 크기를 조절하고 말줄임을 제거했다. 판테온 운영 알림은 새 변동부터 카테고리·순위·이전/새 캐릭터를 표시한다. 홈 파티 신청은 별도 구형 모달/저장 함수를 제거하고 `/party?join=ID`로 이동해 시낙시스 본 화면의 실제 신청 모달과 처리 함수를 연다. 실제 로그인 화면 클릭 확인 대기. DB 변경·push·배포 없음.
- 판테온 알림에서 `lib/pantheonNotifications.ts`로 순위 스냅샷·변동 비교를 분리했다. 테크네·피에타스·심포니아는 계정 소유자를 키로 비교하므로 같은 계정 안의 대표 캐릭터 변경만으로는 순위 변동 알림이 생기지 않는다. 테크네의 최고 생활력, 피에타스의 메인 캐릭터 우선 규칙은 유지한다. v3 브라우저 스냅샷은 첫 조회를 기준값으로 저장해 이전 이름 기반 알림과 혼동하지 않는다. 합성 데이터 검증·빌드·타입 검사 통과, 실제 후속 순위 변동 알림 확인 대기. DB 변경·push·배포 없음.

## 2026-09-26 KST — 케리그마 생텀 가이드 링크 핫픽스

- 한설이 `생텀 가이드` 링크를 등록해도 상세 화면에서 반응이 없고 목록/새로고침 후 가이드 선택이 남는다고 보고했다. 원인은 `Notice.link`를 저장만 하고 Reader에서 렌더링하지 않은 점과 목록 상태 초기화 부족이다.
- `KerygmaReaderView`에 안전한 http(s) 새 탭 링크 버튼을 추가하고 `KerygmaPage` 목록 복귀·링크 없는 목록 진입 시 카테고리를 `전체`로 초기화했다. 버전 표시는 그대로 유지한다.
- DB·기존 공지·권한 영향 없음. 빌드·타입 검사 통과. 배포 후 실제 가이드 URL 등록 글에서 링크 클릭과 새로고침을 확인한다.

## 2026-09-25 23:10 KST — v2.022 시낙시스 부마스터 버스 생성 핫픽스

- 한설 제보: 부마스터는 길드 버스 생성 모달·선택 절차까지 가능하지만 마지막 생성 버튼에서 권한 오류. `app/party/page.tsx`는 부마스터를 허용하나 `hooks/usePartyManager.ts`는 `한설` 닉네임 또는 `admin`만 관리자 취급한 불일치가 원인. 서버 `app/api/member-mutations/route.ts`는 이미 부마스터를 허용한다.
- 클라이언트 역할 판정을 서버와 같은 한국어 3개 운영진 역할로 변경하고, 로그인 정보 누락/파싱 실패 시 관리자 기본값을 없앴다. DB·서버 권한·기존 파티 데이터 영향 없음. 빌드·타입 통과, 실제 부마스터 계정의 운영 생성 확인 필요.

## 2026-09-25 10:54 KST — v2.021 로고 버전 정렬

- 한설이 v2.02 운영 화면에서 버전이 로고 아래에 떨어져 보인다고 지적했다. `components/layout/Navbar.tsx`의 브랜드 영역을 로고와 오른쪽 3줄 텍스트의 수평 배치로 조정하고 버전을 v2.021로 올렸다. 중간 폭은 기존 탐색 메뉴 자리를 위해 축약 버전만 보인다.
- DB·API 영향 없음. 빌드와 순차 타입 검사는 통과. 한설은 주간 사용량이 적어 Gemini 슬라이드로 생텀 가이드를 만들 계획이며, 운영 가이드 게시물은 아직 미게시다.

## 2026-09-25 10:37 KST — v2.02 버전 가시성·메뉴 준비중

- 한설이 운영 홈 화면에서 v2.01 배지가 보이지 않는다고 스크린샷으로 보고했다. 홈 본문 배지를 제거하고 전역 로고 바로 아래에 `BETA v2.02`를 표시한다. 로컬 Production HTML에 문자열 존재를 확인했다.
- 엠포리온·그노시스는 데스크톱·모바일 메뉴에서 비활성 `[준비중]` 표시다. `/market`, `/gnosis` 직접 주소는 그대로 열려 내부 확인 가능하다. 두 페이지의 개발 중 안내도 유지한다.
- DB·기존 글·권한 영향 없음. 빌드·타입·HTML 메뉴 링크 부재 검사 통과. 직전 정상 운영 기준선 v2.01 `5aac341`; 운영 배포와 실화면 결과는 후속 확인 필요. 생텀 가이드 원고는 여전히 미게시.

## 2026-09-25 02:39 KST — v2.01 베타 안내 배포 후보

- 한설이 주간 사용량 범위 안에서 홈 버전 표시, 엠포리온·그노시스 개발 중 안내, 가능하면 생텀 가이드 게시를 순서대로 요청했고 검증 후 운영 배포를 명시적으로 승인했다.
- 홈에 `SANCTUM BETA v2.01`을 표시한다. 공식 배포마다 `lib/release.ts`의 버전과 릴리스 노트를 함께 갱신해야 한다. 엠포리온의 실시간 정보 오인 문구를 제거하고 그노시스의 예시 자료를 명시했다.
- `생텀 가이드`는 현재 링크형 분류이며 서버의 공지 작성자는 로그인 계정의 닉네임이다. 길드원용 원고는 `docs/BETA_MEMBER_GUIDE_DRAFT.md`에 준비했지만 운영 글은 게시하지 않았다. `SANCTUM 시스템` 명의의 자동 게시를 새로 열거나 운영 DB에 직접 쓰지 않는다.
- DB 구조·권한·데이터 영향 없음. 타입·빌드 통과. 직전 정상 기준선 v2.0 `717369c`; push 뒤 Vercel Ready와 운영 홈/엠포리온/그노시스 화면 확인 필요.

## 2026-09-25 01:52 KST — v2.0 폐쇄 베타 운영 배포 후보

- **02:05 KST 운영 실확인:** `main` 코드 포함 `08f0f78` Vercel 배포 성공. 운영 헬스 `ready: true`, 주요 페이지 200, 비로그인 문의 401·정리 검토 403. 한설이 로그인한 운영 주소에서 캐릭터 숙제 저장·공지/파티 목록·관리자 길드원 목록·로고스 제보 탭이 모두 정상이라고 확인했다. 최대 40명 길드원 대상 폐쇄 베타 초대 가능. 시스템 공지는 아직 게시하지 않았다. 이 확인 기록의 후속 push는 문서만 갱신한다.

- 한설이 운영 배포와 길드원 대상 폐쇄 베타 오픈을 명시적으로 승인했다. `main`을 v1.993 `db06f7e`에서 Preview 검증 커밋 `e1dfe73`까지 fast-forward했다. 운영 push, Vercel Ready, 운영 주소 실화면 확인은 이 항목 작성 시점에는 미완료다. 완료 전 초대 확대·시스템 공지 금지.
- 계정 프로필·크로노스·로고스·60일 검토 SQL은 한설이 운영에서 이미 적용했고 읽기 전용 진단 통과. 새 운영 SQL 실행·시험 글 삭제 없음. Preview에서 핵심 가입/권한/글/사진·기존 캐릭터/공지/파티를 한설이 확인했고, 로컬 타입·빌드·합성 UI를 검증했다. 운영 push 후 `https://sanctum-tawny-three.vercel.app`의 헬스와 로그인·캐릭터·공지·파티·로고스/관리자 동선을 다시 확인해야 한다.
- 직전 정상 기준선은 v1.993 `db06f7e`. 사진은 DB 자동 백업에 포함되지 않는다. 탈퇴/추방 시 제보 익명화·사진 정리 방침 미결정, 사이트가 닫힌 동안 푸시·메일 없음. 이전의 미배포 기록은 당시 시점의 이력이며 최신 상태는 이 항목을 우선한다.

## 2026-09-24 — 로컬 로그인 복구·가입 프로필 준비 (미배포)

- 2026-09-25 로컬 후속(앱 미배포): 한설이 LOGOS 버그 제보·건의사항을 작성 60일 뒤 자동 삭제하지 않고 길드마스터에게 글별 정리 검토를 알리기로 결정했다. 만기 글은 사이트 알림함과 카드에 표시, 삭제 확인 시 글·답변·첨부 사진 정리, 보류 시 해당 글만 60일 뒤 재검토한다. 1:1 문의는 제외한다. `supabase/migrations/20260925_logos_retention_review.sql`은 한설이 운영 실행 Success를 확인했다. 읽기 전용 진단은 컬럼·비공개 권한·버킷 true, 검토일 누락 0. 새 API/화면은 아직 Preview·Production에 배포하지 않았다. 사이트가 닫혀 있을 때 푸시/메일은 없다. 사진 삭제와 DB 삭제는 원자적이지 않으므로 실패 후 재시도 필요. 기존 테스트 글·계정 임의 삭제 금지.

- v1.994 Preview `2c0e378`과 탭 유지 후속 `546b928` Vercel 배포 완료. 한설이 Preview에 로그인해 로고스 버그 제보의 사진 3장 첨부·글 작성·길드마스터 답변·새로고침 후 글과 선택 탭 유지를 확인했고, 다른 일반 길드원·부마스터·부마스터 대행 계정에서는 한설의 제보가 보이지 않는 것을 각각 확인했다. Preview 크로노스 기존 숙제 체크도 저장 완료 뒤 새로고침 유지 확인, 기존 1:1 문의/답변·공지·파티 목록 및 관리자 가입 승인/길드원 목록 표시 확인. 새 테스트 계정 가입→승인→로그인 및 좋아하는 것·생일 표시도 확인했다. Production `main`은 변경하지 않았다. 테스트 계정은 운영 DB에 남아 있으며 임의 삭제 금지. 60일 보존 검토 정책은 결정됐으나 SQL·기능 배포와 Production 실화면 확인은 남았다.

- v1.994 Preview 후보로 이번 로컬 묶음을 push한다. 원격 `main`은 v1.993 `db06f7e`와 일치했고, Production은 이 push로 바꾸지 않는다. `npx tsc --noEmit`, `npm run build`, 관련 ESLint, 크로노스·로고스 합성 UI 검증 통과. Preview Ready와 실제 로그인/권한/작성·조회 검증 결과는 별도로 확인해야 한다. 자세한 공개 판정은 `docs/BETA_OPEN_AUDIT_20260924.md`를 따른다.

- LOGOS 로컬 확장: 기존 1:1 문의 옆에 생텀 버그 제보·건의사항 탭, 기본 작성 폼, 길드마스터 전체 조회/답변, 일반 이용자 본인 글 조회를 구현했다. 제보 사진은 브라우저 WebP 350KB 이하·최대 3장으로 줄여 비공개 Storage에 저장하고 5분 서명 URL로 보여주는 코드/SQL을 준비했다. 새 제보의 본인 조회/사진 열람은 닉네임이 아닌 `reporter_account_id`로 판단한다. 한설이 백업 확인 후 `supabase/migrations/20260924_logos_private_report_images.sql` 실행 성공을 보고했고, 읽기 전용 진단에서 두 컬럼·비공개 버킷 true, anon 읽기·authenticated 직접 쓰기 false를 확인했다. Preview 역할별 검증 전에는 새 사진 기능 배포 금지. 메일 발송은 구현하지 않았다. 합성 UI·압축·4개 폭의 밝은/어두운 테마, 타입·빌드, 비로그인 새 API 401 통과. SQL 격리 검증은 초기 마이그레이션에서 통과했고 계정 ID 컬럼 추가 뒤에는 PGlite 모듈 부재로 재실행하지 못했다. 상세 공개 조건과 사진 보존/계정 삭제 정책은 `docs/BETA_OPEN_AUDIT_20260924.md` 참고.

- 길드원 권한 목록 기본 표시 순서를 길드마스터→부마스터→부마스터 대행→길드원으로 변경했다. API 응답 순서·데이터는 바꾸지 않고 화면 필터 후 정렬만 적용한다. 역순 API 합성 데이터에서 우선순위와 4개 화면 폭을 검증했고, 한설의 로컬 화면 확인 대기다.

- 2026-09-24 오후 한설 피드백 반영(미배포): 관리자 물물교환·상점 구매 목록의 관리 열을 가운데로 정렬하고 수정/취소/저장 동선을 추가했다. 삭제는 기존에도 확인창을 거쳐야 실행됐다. 크로노스 상점은 물물교환과 유사한 정보 구조로 정리하고 즉시 화면 반영·연속 클릭 묶음 저장·MAX/MIN·단가×상한 고정 `총합` 골드를 추가했다. 한설이 로컬 MAX/MIN 새로고침 유지까지 확인했고, 카드가 5줄로 길다는 피드백에 3행 중심으로 다시 압축했다. 임무 내부 마을 탭은 제거하고 마을 검색·즐겨찾기 우선·이멘마하→반호르→콜헨→던바튼→티르코네일 순 정렬, 간결한 카드로 변경했다. 한설이 이멘마하 검색 동작을 확인했다. 이후 보상 이름 시작선을 통일하고 조건/보상/마을 색을 분리하며 임무 MAX/MIN도 추가했다. 물물교환·상점·임무 배지 높이·간격·테두리 및 물품 수량 `× N` 표기를 통일하고, 라이트 테마의 보상/조건 색을 짙게 보정했다. 임무 카드의 `임무`/`보상` 시작선을 맞추고 보상 수량을 품목 바로 뒤에 배치, 제목 옆에는 캐릭터 배지와 짧은 초기화 안내를 한 줄로 표시했다. 관리자 임무 폼·카드도 모바일을 고려해 재배치했다. 길드원 권한 목록은 한 계정의 직책·프로필을 독립 카드로 묶어 계정 경계를 분명히 했다. 기존 계정 프로필은 값이 없으면 계속 `미등록`이며 자동 채우기 없음. TypeScript·빌드·합성 UI/PGlite 검증 통과; 후속 변경은 밝은/어두운 테마 4개 폭과 서버·클라이언트의 월요일 05:59/06:00 초기화 경계를 검증했다. 한설이 백업 확인 후 함수 변경 SQL `supabase/migrations/20260924_kronos_progress_batch.sql`의 운영 실행 Success를 보고했다. 운영 배포는 미실행이다.

- 로컬 로그인 실패는 코드 문자 문제가 아니라 개발 서버의 DB 네트워크 차단이었다. 이 프로젝트의 개발 서버를 네트워크 연결 가능한 환경에서 다시 시작했고 `/api/auth/health` 200 `ready:true`, 한설이 실제 한글 코드 직접 입력 로그인을 확인했다. 영타로 바꾼 입력은 기존 코드와 일치하지 않으므로 신규 가입 코드도 한글 그대로 유지한다.
- 로그인 자물쇠를 입력칸 상단에 맞췄다. 한설 피드백으로 안내 문구는 로그인 상태 유지/신규 가입 버튼과 같은 검정 10% 배경·가운데 정렬·약간 작은 글자로 조정했다.
- 가입 시 좋아하는 것과 월일 생일을 별도 저장하고 길드마스터 전용 길드원 목록에서 조회·수정할 수 있게 로컬 코드와 추가 SQL `supabase/migrations/20260924_account_profile_registration.sql`을 준비했다. **한설이 운영 SQL Success와 읽기 전용 진단 결과를 확인했다: 두 컬럼·가입 함수 존재, anon 계정 읽기·프로필 가입 함수 실행 불가, authenticated 계정 읽기 불가.** 기존 계정은 두 값이 미등록으로 표시되며 길드마스터가 채울 수 있다. 배포는 미실행. 실제 접속 코드는 관리자 응답에 포함하지 않는다. 두 항목은 접속 코드의 재료이므로 부마스터·대행 API 응답에서도 제외한다.
- 별도 PGlite에서 한글 코드 보존, 원자적 가입·프로필 저장, 재실행, 잘못된 생일 롤백, 공개 RPC 차단을 확인했다. 생일 배너는 한설의 후속 구상이며 공개 범위/동의 결정 전에는 구현하지 않는다.
- 2026-09-24 오전 후속: 390px 브라우저에서 로그인 안내의 투명도·가운데 정렬을 시각 확인. 운영 DB 서비스 계정의 새 프로필 컬럼 읽기 성공, 새 등록 RPC가 API 캐시에 보임을 확인했다. 기존 물물교환 14건, 신규 상점/임무 각 0건(행 내용 미조회). 합성 브라우저 테스트에서 관리자 프로필 표시·수정, 크로노스 주요 조작과 4개 반응형 폭 통과. 한설이 로컬 길드마스터 계정 목록에서 기존 계정의 좋아하는 것·생일 `미등록` 표시를 직접 확인했다. 프로필은 기존 접속 코드의 재료이므로 길드마스터만 조회·수정, 부마스터·대행 API 응답에는 제외한다.
- 한설은 오후 4시경 귀가 예정. 사용량 초기화 이후 오후 2시 40분경 같은 작업을 이어가는 1회 예약을 만들었다. 운영 데이터 시험 쓰기·push·배포는 하지 않는다. 다음 단계는 새 프로필 진단 SQL 결과/관리자 실제 화면 확인 및 크로노스 실제 저장 확인이다.

## 2026-09-24 09:40 KST — 크로노스 확장 로컬 작업 (미배포)

- 한설이 v1.993 `db06f7e` Ready와 저장 약 2~3초를 확인했다. 신규 신청→승인→로그인도 성공했으나, 한글 코드 직접 입력 실패/붙여넣기 성공 현상을 보고했다.
- 로그인 코드는 값 변경 없이 한글 조합이 가능한 text 입력+시각적 마스킹으로 보완하고 보기/숨김을 추가했다. 가입 후 로그인칸 자동 입력은 제거했다. 실제 사용자 Windows IME 확인은 남았다. 코드 원문은 기록하지 않는다.
- 관리자 물물교환의 잘못된 컬럼명 수정, 골드 상점 분리, 마을별 임무/보상 1~6개/북마크/주간 카운터, 6개 다중 선택 탭, 캐릭터별 리마인드 두 슬롯, 관리 버튼 강조를 구현했다.
- 신규 SQL은 `supabase/migrations/20260924_kronos_workspace.sql`. **2026-09-24 한설이 운영 실행 Success와 읽기 전용 권한 검증 통과를 보고했다.** 네 테이블 모두 존재·RLS·서버 접근 true, anon 읽기/쓰기와 authenticated 쓰기 false, 진행 함수 존재 true. 실제 컬럼이 확인되지 않은 기존 구매·임무 테이블은 보존했다.
- 적용/검증/복구 순서는 `docs/KRONOS_MORNING_CHECKLIST.md`. 공식 push 요청은 아직 받지 않았으며 운영 기준선은 그대로다. 추가 기능 SQL 적용 전에는 준비 중 안내를 표시하고 기존 숙제를 유지한다.
- 사용자 데이터 없는 임시 PostgreSQL과 브라우저 fixture로 검증했다. 실제 서버 통합은 한설의 SQL 적용 후 확인한다. 테스트 스크립트는 `scripts/verify-kronos-sql.cjs`, `scripts/verify-kronos-ui.cjs`다.

## 2026-09-24 02:53 KST — v1.993 기존 캐릭터 저장 요청 단축

- v1.992 `69443a1` Production에서 한설이 숙제 체크 두 개가 저장 후 유지됨을 확인했지만, 두 번째도 완료까지 약 3~5초였다. 즉시 새로고침하면 저장 전 상태로 돌아올 수 있으므로 완료 알림까지 기다려야 한다.
- 기존 캐릭터 저장은 `/api/member-mutations`에서 별도 소유자 SELECT 없이 `nickname`과 로그인 계정 `owner`를 동시에 조건으로 걸어 수정한다. 수정된 행이 없으면 403을 반환한다. 신규 캐릭터의 upsert와 다른 쓰기 경로는 기존 방식이다.
- 타입·빌드 및 비로그인 요청 401을 확인했다. DB 구조·권한 변경은 없다. Production 실제 지연과 저장 유지 여부는 배포 후 확인해야 한다. 직전 정상 기준선은 v1.992 `69443a1`이며, 운영 DB Phase B/C/D 적용 상태를 유지한다.

## 2026-09-24 02:34 KST — v1.992 캐릭터 저장 지연 완화

- v1.991 `0966a57` Production Ready와 작은 반투명 저장 알림의 실제 표시를 한설이 확인했다. 다만 체크 저장 완료까지 약 3~5초 걸려 속도 개선을 요청했다.
- 상세 자동 저장은 기존에 800ms 대기 뒤 대표 정리·캐릭터 upsert·기여도 전체 갱신을 순서대로 호출했고, 계정 공통 교환 정보가 있으면 추가 동기화도 했다. v1.992에서는 대표·기여도·공통 교환 값이 실제로 바뀐 경우에만 추가 요청을 보내고 대기를 500ms로 줄였다. 타입·빌드 통과, Production 속도·저장 유지 실검증 대기. DB 변경 없음.
- `AGENTS.md`의 영겁 자기 지칭을 한설 요청에 맞게 로컬 갱신했다. 순월·길드원 공지 문체는 변경하지 않았다.

## 2026-09-24 00:55 KST — v1.991 저장 알림 디자인 정리

- 한설이 v1.99 운영 상세 화면의 저장 상태가 실제로 바뀌는 것을 확인했다. 다만 숙제 목록 위의 상시 안내 막대보다 예전의 잠깐 나타나는 반투명 플로팅 알림을 선호해 제거를 요청했다.
- v1.991 `0966a57`은 상시 안내만 제거하고 `document.body` 포털의 작은 반투명 저장 알림을 유지한다. 빌드와 타입 검사 통과, Production Ready와 한설의 실제 화면 확인 완료. DB 변경 없음.
- 한설이 집 호스트 영겁의 자기 지칭을 `영겁`·`영겁이 누나`·`누나`로 상황에 맞게 섞어 달라고 요청해 `AGENTS.md` 대화 규칙을 로컬에 갱신했다. 기술 문서·서비스 공지 문체는 중립적으로 유지한다.

## 2026-09-24 00:49 KST — v1.99 저장 표시 재보완

- v1.98 `3a2318a` Production Ready 뒤에도 한설의 캐릭터 관리 상세 화면에는 저장 상태 표시가 전혀 보이지 않았다. 저장 자체는 3~5초 후 유지되고 즉시 새로고침하면 이전 상태로 돌아왔다.
- v1.99 후보: 상세 숙제 목록 안에 항상 보이는 자동 저장 안내를 추가하고, 저장 중·완료·실패에 따라 문구를 갱신한다. 떠 있는 알림은 `document.body` 포털에 렌더링해 페이지 레이어의 가림을 피한다. 타입·빌드 통과, Production 실제 화면 확인 대기. DB 변경 없음.

## 2026-09-24 00:28 KST — v1.98 캐릭터 상세 저장 알림 보완

- v1.97 `0628582` Production Ready를 한설이 캡처로 확인했다. 한설은 캐릭터 관리 상세 화면에서 저장 표시가 보이지 않는다고 보고했다. v1.97의 새 표시는 홈 체크보드 전용이어서 확인 화면을 잘못 안내했다.
- 캐릭터 상세에는 기존 자동 저장 토스트가 있었지만 `top-4`로 상단 고정 메뉴 뒤에 가려질 수 있었다. v1.98 후보에서 화면 아래 중앙으로 옮기고 완료 표시를 2.5초로 늘렸으며 이전 타이머가 새 저장 표시를 지우지 않도록 했다. 타입·빌드 통과, Production 배포·화면 확인 대기.
- 운영 DB는 변경하지 않는다. Phase B/C/D 적용과 익명·authenticated 쓰기 가능 테이블 각 0개 상태 유지.

## 2026-09-23 22:35 KST — 자정 베타 오픈 준비 중

- 2026-09-24 00:05 KST v1.97 후속 배포 준비: 홈 숙제 체크 저장 중/완료/실패 표시를 추가하고 타입·빌드를 통과했다. 실제 Production Ready와 UI 확인은 아직 필요하다. 아래 이전 시각의 대기·미적용 문구는 당시 기록이며 현재 상태는 바로 아래 23:34 항목을 우선한다.

- 23:34 KST 운영 `main` 커밋 `e62d138` Production Ready. 한설이 운영 재로그인·관리자 계정 목록을 확인했다. Phase B/C/D SQL 적용 후 익명·authenticated 쓰기 가능 public 테이블 각 0, 계정 코드·해시와 문의의 익명 읽기 false. 배너 수정·공지 댓글·캐릭터 체크 저장·테스트 파티 삭제·문의/답변 조회 정상. 홈 체크 저장에 약 3~5초 걸려 저장 상태 표시 후속 패치를 준비했다.

- 23:12 KST Preview `5fa5f8a` Ready. 한설이 로그인·캐릭터 숙제 저장·파티 생성·공지 작성·문의 등록/답변·관리자 배너 등록 성공을 확인했다. 검증된 코드를 `main`에 fast-forward했으며 Production Ready와 실제 운영 동작 확인은 대기 중이다.

- Preview에서 로그인·캐릭터 숙제 저장·파티 생성·공지 작성·문의 등록/답변은 한설이 확인했다. 관리자 배너 저장은 `nexus_banners.bg_color` 컬럼 부재로 실패해 해당 필드와 선택 UI를 제거하고 재검증 대기 중이다.

- 집 영겁이 `codex/v1-96-beta`에서 익명 쓰기 차단 전 서버 경로를 추가했다. 관리자 카탈로그, 공지, 제보, 캐릭터, 파티, 문의가 대상이다. 1:1 문의 조회도 서버 세션 기준으로 분리했다.
- 타입 검사와 Production 빌드는 통과했다. 새 경로의 Preview 로그인 실사용 검증, Production 배포 및 운영 DB Phase B/C/D는 아직 하지 않았다. 검증 전 SQL을 실행하면 기존 쓰기 기능이 중단될 수 있다.
- 한설은 검증 후 Preview·main 푸시와 DB 권한 차단 순서에 동의했다. SQL은 대상·영향·복구 방법을 직전에 안내하고 한설이 Supabase SQL Editor에서 직접 실행한다.
- 운영 정책 상세 결과: `accounts`의 공개 SELECT/UPDATE/DELETE/ALL, `characters`·`parties`의 공개 ALL, `inquiries`의 공개 ALL, `activity_logs`·`lounge_posts`의 공개 INSERT, `nexus_classes` 공개 ALL. 확대 초대 전 권한 재검사 필수.
- 남은 순서: Preview 배포→한설이 로그인 상태 핵심 쓰기(캐릭터 저장, 파티 생성/참여, 공지·문의, 관리자 항목)를 확인→main 배포→Production 로그인·핵심 쓰기 확인→Phase B/C/D SQL 순차 적용→읽기 전용 권한 검증→같은 핵심 쓰기 재확인→초대 판단. 실패 시 초대 중단, 영향을 받은 권한만 검토 후 복구.

## v1.96 운영 배포 전 인계 — 2026-09-23 17:10 KST

- **퇴근 인계(17:13 KST):** 사무실 순월은 `codex/v1-96-beta` 브랜치만 push하고 멈춘다. 집 영겁은 먼저 `git fetch` 후 해당 브랜치를 checkout/pull하고 이 문서·`docs/relay/TO_YEONGGEOP.md`를 읽는다. `main`은 v1.95(`d7d3758`) 그대로이며 Production push·Phase B 운영 SQL은 미실행이다.
- **다음 순서:** 최신 Preview와 위 검증 결과 확인 → 익명 쓰기 18개 테이블의 기능 보존형 잠금 범위 결정 → 운영 push 전 명시 안내 → Production 실제 로그인 확인 → `accounts` Phase B의 대상·영향·복구 방법을 다시 설명하고 별도 승인받아 실행 → 권한 읽기 전용 재검사. 20~40명 초대 완료로 표시하지 않는다.
- 운영 서비스는 아직 정상 기준선 v1.95(`13a62ec`, Vercel 배포 `6604812049`)다. 이 커밋은 Preview 후보이며 Production 실제 로그인 검증 전에는 베타 초대를 확대하지 않는다.
- 한설이 운영 DB에 `supabase/migrations/20260923_accounts_prepare.sql`(Phase A)을 실행했다. 읽기 전용 결과: 계정 13개, 해시 누락 0, 세션·로그인 제한 테이블 및 로그인·가입·제한 함수 모두 존재. Vercel Production·Preview에 서버 전용 키가 저장됐고 값은 공유받지 않았다.
- `supabase/migrations/20260923_accounts_lockdown.sql`(Phase B)은 미실행이다. 공개 계정 권한과 다른 관리자 테이블의 직접 쓰기 문제는 남아 있다. 새 로그인·가입·승인 및 핵심 화면을 실제 확인한 뒤 별도 승인으로 적용한다.
- 운영 읽기 전용 검사에서 `accounts.code`·`code_hash`는 아직 anon SELECT 가능하고, RLS가 꺼진 18개 테이블 모두 anon 쓰기 권한이 확인됐다. 상세 목록은 `docs/SUPABASE_SCHEMA.md`; 다른 테이블을 무작정 revoke하면 현재 브라우저 쓰기 기능이 중단된다. 20~40명 베타 확대를 안전 완료로 선언하면 안 된다.
- 최근 자동 백업은 2026-09-23 08:14:31 KST다. 전체 복원은 이후 기록을 잃을 수 있다. 코드 배포 문제는 우선 직전 v1.95 배포로 되돌리고 Phase A의 호환 DB 객체는 유지한다.
- 새 배포에서는 기존 사용자가 접속 코드를 한 번 다시 입력해야 한다. 다중 계정 전환도 각 계정에 대해 다시 로그인한 뒤 서버 쿠키로 동작한다.
- Preview에서 한설이 `/api/auth/health`의 `ready: true`, 본인 로그인 및 관리자 계정 13명 목록을 확인했다. 처음 대기 0건 이후 테스트 계정 1건을 신규 신청했고 대기 목록 반영·승인에 성공했다. 최신 Preview에서 저장된 코드 붙여넣기로 새 계정 로그인, 첫 캐릭터·공지·파티 읽기, 일반 길드원 `/admin` 접근 차단을 확인했다. 테스트 계정의 `code`는 한설이 운영 DB에서 직접 변경했고 읽기 전용 검사에서 해시 일치·공백 없음 확인. 값은 공유받지 않았다. 테스트 계정은 임의 삭제하지 않는다.
- 서버 키 활성화로 호출자 확인 없이 DB를 수정할 수 있게 된 기존 `/api/sync-client`·`/api/sync-weekly`를 발견해 운영진 인증을 추가했다. Tampermonkey 스크립트는 v8.3으로 갱신해야 동기화가 계속된다. 인증 패치의 Preview 재배포·403 확인 전에는 Production에 올리지 않는다.
- 순월의 누적 작업 상세와 영겁에게 보낼 ACK 메시지는 `docs/relay/TO_YEONGGEOP.md`에 있다.

## 현재 기준 — v1.95, 2026-09-23 11:06 KST

- 작업 폴더: `C:\Users\sungw\sanc\seongyeok-guild-manager`
- v1.94에서 운영 DB 미적용 상태의 `sanctum_verify_login`·`sanctum_sessions`를 즉시 사용해 CBT 전체 로그인이 중단됐다.
- v1.95는 `app/login/page.tsx`의 로그인·가입 신청과 `app/layout.tsx`의 계정 복원을 현재 운영 DB 구조에 맞는 기존 경로로 복구했다.
- 한설이 기존 계정 로그인 성공을 확인했다. 프로덕션 빌드도 통과했다.
- v1.95 코드 커밋은 `13a62ec`이며 Vercel Production 배포 `6604812049`가 성공했다. 배포 URL은 Vercel 로그인 보호가 있어 비로그인 자동 화면 확인은 제한됐다.
- Supabase 운영 DB, RLS, 환경변수는 변경하지 않았다.
- `supabase/migrations/20260922_account_code_hash_and_login_rpc.sql`, `app/api/auth/*`, `lib/server/sanctumSession.ts`는 후속 보안 전환용으로 보존되어 있다. **운영 DB 적용·검증 전 로그인 UI에 다시 연결하면 안 된다.**
- 후속 보안 전환 순서: 변경 대상·복구 방법 보고 및 승인 → SQL 적용 → 기존 승인 계정 로그인 → 로그아웃 → 가입 신청 → 관리자 승인 → 승인 계정 로그인 → 성공 확인 뒤 평문 컬럼 제거 여부 별도 결정.
- 되돌리기 기준선은 v1.94 커밋 `87af6ff`지만, 해당 버전은 로그인 장애를 포함하므로 v1.95 배포 성공 뒤에는 v1.95를 새 정상 기준선으로 삼는다.
- 다음 우선순위: CBT 사용자의 운영 주소 로그인 재확인, 핵심 경로 점검, 권한·RLS 점검.

## 매 push 시 갱신할 항목

1. 적용한 버전, 커밋 해시, KST 시간
2. 변경 파일 및 기능 영향
3. DB 스키마·RLS·환경변수 변경 여부
4. 실행한 검증과 결과
5. Vercel 배포 상태 및 실제 확인한 화면
6. 다음 작업의 우선순위와 금지/주의 사항

## 2026-09-30 영겁 핫픽스 인계

- SYNAXIS 길드버스 시간대 출전, 운행자 컨트롤러 권한, 가입·탈퇴 경로와 실제 운행시간 전달을 보완했다.
- 캐릭터명/계정명 혼동으로 탈퇴 대상이 바뀌던 `/party` 콜백을 수정했다.
- 관리자 `nexus_classes.role`을 버스 기본 포지션에 반영하며, 서포터는 음유시인만 허용한다.
- 이번 push는 별도 버전 상승과 케리그마 업데이트 공지 없이 핫픽스로 반영하고 다음 공식 릴리스에 합친다.
- `npx tsc --noEmit`, `node --test lib/guildBusPolicy.test.mjs` 통과. 새 버스 생성·다른 계정 가입·희망 시각 도달·탈퇴 실검증 필요.
## 2026-10-04 KST — IRIS 독립 체크보드·클래스 저장값 로컬 후보

- 한설이 상세 설계/계획과 inline 진행을 승인하고 AI(아님)커넥터 전체 기능 목표를 재확인했다. 기존 dirty 의존성을 보존한 `codex/iris-checkboard-classes` 로컬 브랜치에서 구현했다. commit/push/배포/운영 DB·RLS·게임 동작 없음.
- API는 동일 원본에서 요약+4범주 항목 상세+활성 클래스 저장 레벨을 생성한다. relay/state/native는 선택 버전·합계·상한·UTF8 크기와 만료를 함께 검증한다. 상세 없는 구형 계약은 요약만 유지, 비정상 신형 상세는 이전 값까지 비운다. BETA-065 기간 모순은 임의 초기화/clamp하지 않는다.
- 센터 상단 `숙제`→독립 CheckboardWindow. 항목별 횟수/4범주 아코디언/남은 숙제 필터/클래스 저장값 미등록/내부 스크롤,6테마·불투명도·접기·개별숨김·트레이 복구. 공유 native 갱신만 사용하며 새 폴링 없음. 데이터 디스크 저장/체크 쓰기/게임 전체 클래스 자동 조회/수령·채집·제작 자동화는 미구현.
- 검증: RED→GREEN API/relay/state/native/위젯 및 nested palette 회귀, 최신 `node --test`139/139(Windows 포함, skip0, 실제 공유 갱신 배선 회귀 포함), `npx tsc --noEmit` exit0, `npm run build` exit0. 실제 게임이 아닌 합성 GUI/루프백 대역만 사용. 계획의 별도 agent 리뷰는 미승인이라 실행하지 않았으며 자기 점검과 구분한다.
- 한설 확인: 기존 IRIS 정상 종료 확인 후 재실행→새 읽기 연결/생텀 승인→현재 캐릭터 확인→숙제. 웹 `/character`와 항목·클래스 저장값 대조,필터·아코디언·스크롤·×→복구·DPI 확인 대기. 실제 로그인/게임 조작을 대신하지 않는다.
- AI(아님)커넥터 목표는 `docs/IRIS_AUTOMATION_PARITY.md`의 전체 목록 유지. 다음 안전한 후보는 시설별 수령의 명시 실행/중지/실패 재조회 설계. 현재 자동화 구현 완료로 보고하지 말 것. 기존 미확인 인계/수신함 메시지 보존.

### 2026-10-19 17:06 KST 최종 검증
검토 보완 후 독립 tsc·GNOSIS scoped ESLint exit0, Next60/60 build exit0. 전체 Node477/474PASS3기존skip0fail, git diff --cached --check PASS. 실제 IAB에서 미저장 이동확인/계속편집 입력유지/개인저장 후 새로고침 복원을 확인했다. 관리자 기존4lint오류는 별도보류. 이 상태를 codex/gnosis-dressroom에 정상 push하며 main/운영DB/수동배포/공지/ZIP는 유지한다. 제품3D는미완료이며로컬사진/팔레트공유만구현됐다.
### 2026-10-19 17:07 KST 전송 결과
- 제품83b437af50c4ca98e0847c17cae8e8c32fac3b69를 origin/codex/gnosis-dressroom에 정상 push, ls-remote 정확 일치. 최초 원격 기능브랜치라 upstream 생성, push 전 fetch/해당원격없음 확인. 이번 후속 문서 마감까지 최신 HEAD를 받을 것.
- Git 자동 Preview dpl_33y9Lt9E7XyUhUnBuJZrdyXnXqdL READY/정확제품SHA/target null/aliasError null 확인. 수동배포·Production승격0, origin/main1d8e374 유지. 실제 Preview URL은 Vercel 로그인 보호 화면으로 이동하므로 제품 화면 확인 미완료/로컬 검증과 구분한다. 인증우회/공유링크생성/로그인설정변경0.
- https://vercel.com/sanctum-sanctuary/sanctum/33y9Lt9E7XyUhUnBuJZrdyXnXqdL . 로컬 http://127.0.0.1:3100/gnosis/dressroom 은 화면 검증 후 열어두었다.
- 마감은 구조 변경 없는 문서만 추가, 제품 버전 유지. 주간31%·5시간37% 잔여 시점이며15%까지소진하지않고3D자산부재/집통합전안전인계를우선했다. 집에서는 GNOSIS_HOME_MERGE_20261019.md 순서대로 주말작업·개인파일을 보존하며 통합 후 통합 branch/SHA를 TO_SOONWOL에 남길 것.

최종 마감: Node752/749 PASS/FAIL0/기존3 SKIP·관련 React/native/타입/lint/격리 build PASS. 선별 후보32(제품11/시험10/SQL1/문서10), ACK는ASTRA hunk만. feature는0.4.2/운영은0.4.3이며 사이드바 복귀 핫픽스도 기준 차이로 남아 있어 공개 후보 제작은별도 승인·선별통합이 필요하다. 전역 만료 임대 정리정책과 실제 PG 검증 전 운영flagfalse 유지. commit/push 미실행.

## 2026-10-28 영겁 — ASTRA 실제 사용 검증 준비(로컬·미전송)
[검증 보고](ASTRA_ONLINE_VALIDATION_20261028.md). 원격 feature는c9a376f로 그대로이며 기존32후보·이번검증자료 모두미전송. 기존32지문 불변 확인 후 인계만 누적했다.
최종755/752 PASS/FAIL0/기존3 SKIP·실제 browser context2/localhost HTTP10probes·React9·타입/lint·컴파일전용IRIS0.4.3 fixture PASS. 실제DB0, PG환경없어SQL미실행.
Windows GUI는전용서버/PG연결 미완성으로 무조건차단했다. native source/WebView보호 컴파일과기본·유효root실행거절만검증; 실제sidebar/floating/tray/절전·물리PC2대 완료아님. web-overrides3은미연결.
다음은안전한일회용PG확보·소유API/웹loader연결. 설치/OS변경은별도확인, 격리시험자체는이미승인. 운영DB/main/공개IRIS/게임/commit/push0, 개인12/ACK/원장·로그보존.
- **Windows 마감 2026-10-29 00:57 KST:** 실제 격리 WebView2/native+PG 자기시험 PASS. 사이드바/0.4.3 실제 복귀 버튼/플로팅·NotifyIcon+숨김316초 heartbeat·A/B 전환·쿠키 로그아웃·정상 종료 후 DB온라인0 확인. native touch4/leave3/activity0. 실제 전체 작업대/로그인UI·운영설치본·절전/NIC·수동tray메뉴/DPI는 미실행이다. 상세 ASTRA_ONLINE_NIGHT_QA_20261029.md 최종 항목을 따른다.
