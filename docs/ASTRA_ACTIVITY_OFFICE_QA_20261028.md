# 순월 — C/D-0 수신과 ASTRA 통합 활동 후보 검증

> 후속 마감 결과는 [안전 재검증](ASTRA_ACTIVITY_CLOSEOUT_QA_20261028.md)이 최신이다. 아래 최초 수령 FAIL/ZIP 누락 경과는 원문 보존한다. 후속 최종 전체740/737 PASS/FAIL0/3 SKIP, 수령은 terminal 저장 경계까지 확인했지만 과거 세부 예외 원인은 미확정이다. SQL 잠금 순서·명시적 직접 권한 회수도 후속에서 최소 보완했다.

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 기능 브랜치 `a826ad0ad4728540034678cb8e46167f57a2b5e1` 수신·ACK, 기존 자료 보존, C/D-0 합성 재검증, 웹·IRIS 공통 활동 API/Reporter와 ASTRA 표시의 로컬 비활성 후보. 실제 PostgreSQL 적용은 하지 않았다.
- **아직 안 됨:** 활동 집계 DB·운영 활성화·실제 IRIS 설치본 검증, 실게임 자동 생산. 별도 native 수령 회귀 실패 1건의 원인은 미확정이다. 전체 회귀 무실패라고 보고하지 않는다.
- **다음:** 수령 실패 원인 분리 → 활동 집계 DB 제안 검토·별도 승인 → 승인된 환경에서 실제 PostgreSQL 권한/경합/만료 검증 → 활성화·배포는 별도 결정. ERGON D-1의 실제 관측도 별도 승인 필요다.

## 수신과 보존

대상은 `codex/home-gnosis-iris-integration-20261019`다. 별도 관리 worktree를 최신 수신 SHA까지 ff-only로 수신했다. 실제 작업 위치는 detached HEAD의 로컬 후보이며 기능 브랜치에 commit/push하지 않았다. 기존 사무실 원본16·옛 B 후보17·옛 수신 ACK1은 이전 SHA256 manifest와 모두 같고, 별도 N04 진단9도 이번 검증 전후 동일하다. 원본 삭제 상태·미저장 자료·ignored 로그·사용자 원장과 기존 인계 내용을 보존했다.

최신 C/N04의 typed lease 충돌 구분과 response-loss fixture의 `pendingProducer` 보유/forced-GC 검증은 이미 수신돼 있었다. 옛 진단을 덮어씌우거나 C를 다시 구현하지 않았다. 과거 field-diff 실패의 정확한 I/O 발생 단계는 여전히 미확정이다.

## ERGON 결과

| 대상 | 결과 | 근거·한계 |
|---|---|---|
| C native 저장·복구 | **14 PASS** | 실제 DPAPI를 전용 합성 경로에서 사용. 추가100·pending·새 프로세스·원장/문맥·저장 장애 포함 |
| N04 / C API | **4 PASS / 2 PASS** | 소유 시험 자식 중단·새 프로세스 unknown 복구·재전송 방지 |
| 기존 native | **PASS** | progress34, journal, progress-host22, host41, currency3그룹, encrypted store |
| D-0 실제 React | **PASS** | 기록0/실수량 미확인·과거90초·보류/unknown·ABA/늦은 응답·폭/글자12조합 |
| 기존 보호 React6종 | **PASS** | 결과/초안·저장전환·ACK·재화·공개 잠금 등 |
| 별도 native collection | **FAIL** | `Observed official flat collection receipt became unknown despite matching facility reduction`. 기존 최초 수령 간헐 실패와 같은 원인인지 미확정. 재시도·기대값 완화·제품 수정 없음 |
| 실게임·실제 CLI·사용자 원장 | **미실행** | 이번 승인 밖 |

원래 worktree 및 표준 TEMP의 C 시험은 긴 임시 DPAPI 파일 경로 때문에 `DirectoryNotFoundException`이 났다. 최장 suffix까지 계산해 239자 이하인 별도 source-only 사본에서 동일 IRIS source/test460파일의 SHA256을 대조한 뒤 C14 PASS를 확보했다. 앞선 환경 실패 원문은 보존하며 수령 assertion 실패와 혼동하지 않는다. [독립 수신 QA](ERGON_OFFICE_CD0_RECEIVE_QA_20261028.md)에 상세 경과를 남겼다.

## 기존 세션을 활동 집계로 재사용하지 않은 이유

운영 DB를 읽기 전용으로 확인했다. `sanctum_sessions`에는 UUID `id/account_id`, unique `token_hash`, `expires_at/created_at/last_seen_at timestamptz`가 있다. 확인 시점68세션/14계정/만료23개였고 `last_seen_at`이 생성 뒤 갱신된 행은0개다. 관련 사용자 trigger와 sessions를 다루는 cron 작업도 찾지 못했다.

소스의 logout은 현재 세션을, change-code는 해당 계정 세션들을 삭제한다. 세션만 재사용하면 로그아웃·정리 뒤 최근 활동이 사라진다. `characters.updated_at/last_active_at`은 캐릭터 자료이므로 이용 이력으로 소급 이관하지 않는다. 조사한 계정 컬럼·관련 코드에서 활동 공유 설정은 발견하지 못했으며 새로운 공개 설정을 임의로 만들지 않았다.

## 실제 구현 범위

- `lib/accountActivity.ts`: 엄격한 읽기 DTO, KST 상대시각, 계정별20분 제한과 진행 요청 중복 억제. 시간 누락·잘못된 시간은 활동으로 추정하지 않는다.
- `lib/server/accountActivity.ts`, `app/api/account/activity/route.ts`: 같은 출처의 POST, 최대256바이트·정확한 `expectedAccountId` 하나만 허용한다. 기대 ID는 전환 방어값이며 현재 세션 쿠키의 계정과 DB 시각이 기록 권위다. 타인 ID·클라이언트 시각·닉네임을 쓰기 권한으로 받지 않는다.
- `components/common/AccountActivityReporter.tsx`: 웹의 `verifiedAccountId`와 IRIS의 검증된 controller account가 같은 Reporter를 사용한다. 보이는 전경에서 진입/복귀/실제 입력 시만 시도하며 timer·상시 heartbeat·새 Realtime·localStorage 활동 저장소는 없다.
- 기존 `app/api/accounts/directory/route.ts`: 인증된 명단 GET 안에 승인 계정 집계를 한 번 배치 조회한다. 선택적 활동 조회 실패는 기존 길드원 명단을 숨기지 않는다. 인증 전에는 명단/활동을 반환하지 않는다.
- `AstraView.tsx`: 캐릭터 `updated_at` 쓰기와 최근 활동 판단을 제거했다. 계정 묶음·검색 결과 행 안에 통합 활동을 표시한다. 기존 Presence/필터/인원은 **웹 ASTRA 연결**로 범위를 명시하며 최근 활동으로 온라인을 선언하지 않는다.

독립 High 검토에서 일시503 후 영구 중단과 다른 탭 storage 변경 후 기록 중단을 발견했다. 각각 RED를 재현하고 보완했다. 명시적 `activity-disabled`만 기능 비활성으로 처리하고 일시 장애는60초 뒤 다음 실제 사용 때만 재시도한다. storage는 신원 정보로 읽지 않고 기존 검증 ID를 기대값으로 서버 쿠키를 재확인한다. 401/409 후 매 입력마다 다시 요청하지 않는다. generation/abort·20분 제한을 유지했다. 보완 후 미해결 Critical/Important/Minor는0건이다.

## ASTRA 시나리오

| 요구 | 결과 | 범위 |
|---|---|---|
| 웹만 / IRIS만 / 양쪽 최근 활동 | **PASS(합성)** | 공통 서버 경계와 실제 Reporter/ASTRA. 실제 설치본의 이용 기록은 미실행 |
| 과거 로그인만 있고 이용 기록 없음 | **PASS** | 세션·캐릭터 시각 backfill0, `기록 없음` |
| A→B→A 및 늦은 ACK | **PASS** | 실제 React와 순수 Reporter. 이전 계정 응답의 표시/이벤트 반영 차단 |
| 만료·로그아웃·타인 ID/시각 위조 | **PASS(합성)** | 인증 거절, exact payload, owner mismatch, stale client 중단 |
| 두 기기/창 경합 | **PASS(합성 계약)** / **미실행(실제 PG)** | 계정당 한 행·DB20분 규칙. 실제 행 잠금/동시 트랜잭션 검증은 승인 뒤 |
| 오래된/누락/잘못된/미래 시각 | **PASS** | 서버 정규화·strict DTO·KST 상대시각 |
| 320/390/768/1280와 글자18/20/22 | **PASS** | 실제 React12조합. 가로 넘침0·새 활동 문구12px 이상. 390/1280 합성 화면 육안 확인 |
| 검색·연결 필터·기존 캐릭터 보존 | **PASS(해당 합성 흐름)** | IRIS만 최근이어도 웹 연결 필터에 포함하지 않음, 캐릭터 쓰기0. 기존 클래스/통계/정렬 계산은 유지 |
| 기능 비활성 | **PASS** | 새 테이블/RPC 호출0, `활동 기록 준비 중`과 `기록 없음` 구분 |
| 실제 DB·Production·공개 IRIS | **미실행** | 별도 승인 필요 |

## 최종 회귀와 한계

- 활동 단위 **20/20 PASS**. 최종 관련 시험은 기존 다운로드4와 합쳐 **24/24 PASS**.
- 전체 Node는 격리 사본에서 직렬1회: **740건 / 736 PASS / 1 FAIL / 기존3 SKIP**. 실패는 사본에서 ignored 공개 ZIP을 빠뜨린 `iris-download`의 ENOENT였다. 기존 ZIP을 원본과 SHA256 동일하게 복사한 뒤 해당4건을 포함한 관련24건 PASS를 확인했다. 전체740건을 재실행하지 않았으므로 전체 무실패 재실행으로 표현하지 않는다.
- 전체 회귀 뒤 hook/lint 정리한 최종2 UI 파일은 실제 브라우저 관련 시험과 TypeScript·격리 build로 다시 확인했다. ERGON 제품은 변경0이다.
- `tsc --noEmit --incremental false` **PASS**. 격리 `next build --webpack` **PASS**(합성 환경값만 사용). 프로젝트 빌드의 타입 생략 설정은 그대로이며 타입 PASS는 별도 tsc 결과다.
- 신규 모듈/API/Reporter·directory·IRIS page ESLint **PASS**. 기존 `AstraView/layout`의 전체 lint는 **실패 유지**: 기준17/7 errors·6/5 warnings → 후보15/7 errors·4/5 warnings. 기존 any·layout 규칙 및 ASTRA 초기 비동기 조회에 대한 effect 규칙을 전체 정상으로 보고하지 않는다. 범위 밖 기존 UI를 일괄 수정하지 않았다.
- 실제 IRIS·게임 강제 종료0, 실제 CLI0, 사용자 원장 변경0. `ErgonAvailable=false`, `IRIS_ERGON_AVAILABLE=false`, `executionConnected=false` 유지. 기존 운영 IRIS0.4.3와 기능 브랜치 ZIP/metadata의 차이도 보존했다.

원문 로그·환경 실패·스크린샷·해시 manifest는 ignored 로컬 자료로만 보존한다. 비밀키·세션 토큰·운영 응답·개인 파일은 후보 문서에 포함하지 않는다. `git diff --check` PASS다.

## 무료 운영과 승인 필요 사항

Supabase 조직의 Free 플랜은 읽기 전용으로 확인했다. 실시간 잔여 사용량은 확인하지 못했다. 연결된 Vercel의 해당 프로젝트/팀 조회는 결과가 없어 Hobby 계약·현재 잔여량을 검증하지 못했다. 사용량 확인 없는 활성화·추가 기능 확대는 하지 않는다.

설계상 계정당1행, 추가 파일 Storage0·Realtime0이다. 승인된 활성화 이후 실제 사용을8시간/일·40명·1기기로 가정하면 최대 약960회/일의20분 간격 기록 후보이며24시간 사용 가정은2880회/일이다. 기기가 늘면 RPC 읽기·API 호출은 늘 수 있지만 DB 갱신은 계정 공통20분 제한이다. 명단 방문에는 기존 명단 GET 안의 추가 배치 SELECT1회만 있다. 예측치이지 현재 사용량·무료 보장은 아니다. 기본 비활성에서는 새 집계 DB 호출0이며 배포도 하지 않았다.

기존 세션을 억지로 재사용하는 대신 [계정당 집계 DB 제안](ASTRA_ACTIVITY_DB_PROPOSAL_20261028.md)과 `supabase/proposals/20261028_account_activity.sql`을 준비했다. **새 테이블1·RPC1·제한 권한의 DB 적용은 미승인/미적용**이다. 자동 migrations 경로에도 넣지 않았다. 승인 후 실제 PostgreSQL의 권한/RLS·만료/철회·동시 갱신·잠금 대기 중 만료를 검증해야 한다. DB 적용·플래그 활성화·배포·commit/push는 각각 현재 범위 밖이다.

## D-1 정적 점검과 후속

현재 B/C/D-0를 재사용하며 실제 명령은 호출하지 않았다. 게임 캐릭터 귀속, 안정 workId/시설 단위 귀속, 총정원/빈자리, 수령 실추가량·대성공 귀속, 실비용, 멤버십 시간, 외부 수동 개입 배제는 아직 자동 생산을 허용할 근거가 부족하다. 추정값·합성 ID로 채우지 않는다.

사용자 확인은 관측 당시 캐릭터·화면/수량의 재확인에 도움을 줄 수 있지만 CLI 검증된 작업 ID/원자 수령 영수증/배타 실행 근거로 대체하지 않는다. 따라서 현재 자동 생산은 계속 차단한다. 다음은 기존 목표 하나에 대해 읽을 항목·공식 조회 명령·최대 횟수·캐시 영향·검증 기준을 먼저 제시하고 별도 조회 승인을 받는 단계다. 이번에는 D-1 실제 조회 계약 검증을 실행하지 않았다.

확인 경로는 개발 서버의 `/lounge?tab=ASTRA`다. 운영 페이지에는 반영되지 않았다. 로컬 합성 화면에서 최근 활동 한 줄·별도 웹 ASTRA 연결 표시·긴 이름/작은 화면의 줄바꿈을 확인한다.
