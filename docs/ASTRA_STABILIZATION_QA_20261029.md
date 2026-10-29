# ASTRA 운영 전 안정화 — 2026-10-29 순월 결과

후속: [최소 비용 검토 및 선별 전송 마감](ASTRA_MINIMAL_COST_CLOSEOUT_20261029.md). 한설이 검증된 로컬 후보의 기능 브랜치 commit·일반 push를 새로 승인했다. 아래 미전송·미승인은 이 QA 작성 당시 상태로 보존하며 실제 최종 전송/회귀 판정은 후속 기록을 따른다. 운영 적용·flag·main·공개 배포는 여전히 승인하지 않았다.

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 최신 기능 브랜치 수신·ACK, 만료 연결 정리 SQL proposal와 합성 시험 15개, IRIS 0.4.3 화면을 적용한 실제 WebView2 격리 통합 시험, 비용 계측과 최종 회귀.
- **아직 안 됨:** 신규 정리 SQL의 실제 PostgreSQL 검증, 자동 정리 주기와 전역 저장량 상한, 운영 인증·사용자 설치본·물리 두 PC·실제 절전/NIC/DPI 검증. 현재 운영 사용량도 권한 부족으로 미확인이다.
- **다음:** 신규 SQL의 격리 PG 검증 → 장기 세션 표식과 자동 유지보수 정책 검토 → 무료 잔여량 및 운영 0.4.3 선별 통합 확인. 운영 적용·기능 활성화·commit/push는 별도 승인 전 진행하지 않는다.

## 기준과 보존

기능 브랜치는 `codex/home-gnosis-iris-integration-20261019`, 수신 기준은 `2ad9fc3bbe6102f7fafdd060c6d5d3cc6701392b`다. 제품 변경 53파일은 `c091bc4`이며 `0836670` 이후 최신 HEAD까지는 문서 변경이다. 기존 관리 worktree를 재사용해 이미 구현된 온라인 제품 코드를 다시 만들지 않았다.

운영 main `ca697706a874d21668091588940ceb61338d0700`은 IRIS 0.4.3, 기능 브랜치 릴리스는 0.4.2다. 운영 파일을 병합하거나 공개 ZIP·metadata를 덮어쓰지 않았다. 필요한 기존 ZIP과 SDK는 지문이 같은 시험 사본으로만 사용했다.

사무실 원본 개인 16항목을 포함한 기존 변경·ACK 34개와 N04 진단 9개를 이전 manifest와 대조해 **변경 0개**를 확인했다. 삭제 파일도 그대로 보존했다. 별도 로컬 ACK 사본·ignored 원본 로그·실제 사용자 원장은 Git 전송 대상이 아니다. 이 QA 작성 당시에는 시험 사본의 비문서 분류 886파일과 소스 지문이 동일했다. 후속 선별 마감에서는 구조도 문서를 추가 갱신했으며 제품·시험 지문은 그대로다. 최신 범위는 후속 마감 QA를 따른다.

## 전역 만료 정리 proposal

신규 `supabase/proposals/20261029_account_online_retention.sql`은 **미적용 제안**이다. 기존 `20261028_account_online.sql`은 변경하지 않았다.

기존 touch의 `updated_at < 1 day` 삭제는 아직 유효한 세션의 closed 표식과 최고 sequence까지 지울 수 있었다. 합성 모델에서 25시간 뒤 늦은 heartbeat가 다시 `recorded`가 되거나 sequence가 퇴행하는 RED를 재현했다. 신규 proposal은 touch를 같은 정의로 재작성하되 이 DELETE만 제거한다. heartbeat·TTL·인증·활동 기록의 의미는 유지한다.

새 `sanctum_online_prune(environment, batch=128)`는 **service_role 전용 수동 유지보수 함수**다. 만료 세션 → 해당 연결 순서로 잠그고 `SKIP LOCKED`와 만료 재확인을 사용한다. 세션·계정·활동 행과 유효기간은 수정하지 않는다. 신규 테이블·인덱스·endpoint·heartbeat 호출·상시 서버·cron은 추가하지 않았다.

| 방식 | 비용과 제약 | 판단 |
|---|---|---|
| 명시적 수동 정리 | 실행할 때만 RPC/트랜잭션, 기존 expiry 인덱스와 연결 PK 활용 | 이번 최소 proposal |
| 기존 요청에 편승 | 추가 HTTP 없이 가능하나 공용 gate·동시성·읽기/쓰기 계약 필요 | 후속 검토 |
| 주기 작업 | 자동성은 높지만 권한·주기·실패 관측·무료 플랜 조건 검증 필요 | 이번에 생성하지 않음 |

한 번에 삭제하는 연결은 최대 256행, 반환되는 만료 세션 후보는 최대 32개다. 동시 UPDATE의 EPQ 재평가에서는 반환되지 않은 행도 잠길 수 있으므로 **절대 잠금 32개 보장이 아니다**. 삭제 상한도 읽기량·실행시간 상한은 아니다. 오래된 빈 세션이 많으면 후보 탐색 비용이 늘 수 있다. 호출자는 별도 트랜잭션에 `statement_timeout` 5초를 설정하고 실패 시 무한 재시도하지 않아야 한다. [PostgreSQL 17 잠금 규칙](https://www.postgresql.org/docs/17/sql-select.html)을 따른다.

환경별 하루 한 batch부터 백로그를 검토하는 것은 **운영 권고일 뿐 자동 실행 보장이 아니다**. 호출이 없으면 정리도 0회이며, 현재 구현으로 전역 저장량 상한을 보장할 수 없다. 예를 들어 만료 세션 80개가 연결 하나씩을 가졌다면 경합·추가 백로그가 없을 때도 후보 32개 제한 때문에 최소 3회 호출이 필요하다. autovacuum의 공간 재사용과 즉시 파일 크기 축소도 구분해야 한다.

유효 세션의 표식을 보존하므로 기존 세션별 총 256개 cap에 도달하면 새 연결이 제한될 수 있다. 현재 로그인은 새 token을 만들며 자동 로그아웃·정원 확장은 추가하지 않았다. 이미 정리한 만료 token을 이후 연장하거나 재사용하면 옛 표식을 되살릴 수 없다. 현재 인증에 없는 갱신 정책을 나중에 추가한다면 반드시 재검토해야 한다.

### 정리 검증

- **15 PASS / 0 FAIL:** 합성 정책·트랜잭션 스케줄러·SQL 변경 구조·PG query emitter 계약. 유효/만료·환경·다중 연결·sequence/지연 응답·128/256 batch·동시 정리/rollback·writer/세션 연장·삭제·저장 실패·후보 제한·256 cap·heartbeat 정리 0회를 포함한다.
- **실제 PG 미실행:** `tests/account-online-retention.pg-run.mjs`와 SQL fixture를 작성했으나 Docker/PostgreSQL 실행기가 없다. 권한·300행 batch·동시 정리·FK·세션 연장/삭제·trigger 실패·EXPLAIN/Buffers의 실제 결과는 없다. 컨테이너 시작과 실제 DB 호출은 0회다.
- 독립 검토에서 PG seed는 `iris`, 재요청은 `web`인 시험 결함을 발견했다. emitter를 분리해 불일치 RED → `web` 일치 GREEN으로 보완했다. SQL 종류 충돌 검사를 완화하지 않았다.
- 영겁의 야간 **기존 SQL PG 17그룹 PASS**는 이번 신규 정리 SQL의 PASS를 대신하지 않는다.

## 운영 IRIS 0.4.3 격리 통합

실제 `DesktopPage`·controller·transport와 최신 온라인 코드를 사용했다. 소스 전용 사본에 운영 main의 `DesktopFloatingHub.tsx`, `DesktopIcons.tsx`, `irisFloating.ts`, `desktop-floating.cs`를 선별 적용하고 웹 `irisRelease.ts`와 native 표시를 0.4.3으로 맞췄다. 원본 제품·릴리스 파일은 변경하지 않았다.

새 UUID의 시험 프로필·DPAPI 경로·합성 계정만 사용했다. 사본의 game tracker timer/Tick/Discover, native CLI binding과 `game.*` bridge, 외부 요청/창, 실제 updater를 차단했다. 기본 실행이나 프로필 인자만 있는 실행은 GUI 생성 전에 거절한다. 종료 대상도 시험 소유 child PID뿐이며 기존 사용자 IRIS·게임을 찾거나 종료하지 않았다.

시험은 **실제 WinForms/WebView2 + 전체 제품 화면 + 실제 온라인 API handler + 합성 인증 endpoint/임대 모델**이다. 운영 인증·RLS·PostgreSQL 성공을 증명하지 않는다.

| 검증 항목 | 결과와 범위 |
|---|---|
| 로그인·캐릭터 선택·A→B→A·로그아웃 | PASS, 제품 화면과 합성 auth endpoint |
| HttpOnly·persistent cookie | PASS, 실제 CookieManager/Set-Cookie, JS에서 HttpOnly 비노출 |
| 늦은 A 응답 중 B 전환 | PASS, 이전 계정 결과 반영 차단 |
| 0.4.3 floating → sidebar | PASS, 실제 버튼·운영 hotfix·웹/native 표시·캡처 대조 |
| NotifyIcon 숨김/복귀 | PASS, 실제 메뉴 `PerformClick`; 물리 tray 클릭 아님 |
| 절전·연결 장애 | PASS, 721초 합성 시각·강제 heartbeat·합성 503/복구 |
| 두 native PID의 한 계정 | PASS, 한 명 집계·다른 연결 유지 |
| 소유 PID 중단·재시작 | PASS, 합성 TTL 후 오프라인·생존 PID heartbeat·정상 종료 |
| 같은 전용 profile 재시작 | PASS, 실제 persistent cookie 복원·새 login API 호출 없음 |
| 운영 인증/RLS·실제 PG·사용자 설치본·물리 두 PC·OS 절전/NIC·수동 tray·Windows DPI | **미실행** |

최신 확장 GUI에서 touch 11회/leave 6회, HTTP 35회가 관측됐다. 시험 제어 요청이 포함된 수치이며 운영 비용으로 외삽하지 않는다. 활동 POST 18회는 합성 403으로 차단돼 실제 활동 쓰기는 0회다. 이전 두 GUI PASS에는 중복 실행·중단·프로필 재시작이 없었으므로 최신 확장 결과와 섞지 않았다.

최종 fixture 정리는 미사용 PG/보조 포트 분기 제거이며, PASS한 native/웹 사본 지문은 그대로다. 정리 후 sourceguard 2개와 실제 HTTP/API 합성 모델 7개 PASS를 별도 확인했다. 최초 sandbox loopback `WSAEACCES`는 GUI 생성 전 중단됐고 허용된 소유 시험에서 통과했다. masked code 입력·초기 캐릭터 선택·종료 기록·persistent cookie Max-Age 발급은 시험 fixture에서 보완했다. 원본 실패 로그와 사본은 보존했다.

웹 쿠키가 먼저 교체되면 이전 쿠키로 leave를 보낼 수 없어 옛 연결이 TTL 720초와 조회 주기 60초까지 남을 수 있다. 두 브라우저 시험은 이 만료 경계를 검증하며 즉시 오프라인으로 과장하지 않는다. native는 보관한 이전 쿠키로 leave를 보낸다. 운영 승인 시 두 경로의 차이를 설명해야 한다.

## 무료 운영 비용

기존 실제 reporter/API를 가상 하루와 합성 RPC로 계측했다. **40명·2연결·ASTRA viewer 4명이 계속 화면을 보고, 각 연결에서 20분마다 실제 입력 신호가 있는 상황**을 가정한다. 제품에 활동 timer나 새 정책을 넣지 않았다.

| 일일 사용 | 월 정상 API | 월 RPC adapter | 매일 80회 종료 포함 API |
|---|---:|---:|---:|
| 8시간 | 348,480 | 345,600 | 350,880 + B |
| 24시간 | 1,045,440 | 1,036,800 | 1,047,840 + B |

B는 기존 기능·로그인/시작·계정 변경·오류 요청이다. 월 내내 연속 실행하면 매일 종료를 더하지 않는다. RPC 수는 SQL 내부 읽기·쓰기 수와 다르며 CPU·메모리·egress 실측이 아니다. 비용 회귀 2개 PASS, 실제 DB 호출은 0회다.

[Vercel 공식 문서](https://vercel.com/docs/functions/usage-and-pricing)의 Hobby 월 100만 호출·Active CPU 4시간·메모리 360GB-hours는 각각 별도 한도다. **24시간 2연결 가정은 API만으로도 100만을 넘는다.** [Supabase Free](https://supabase.com/pricing)의 API unlimited도 DB 500MB·공유 CPU/RAM·egress 여유를 보장하지 않는다. 프로젝트는 확인했으나 팀 사용량 조회가 403으로 거절돼 실제 잔여량은 미확인이다. 무료 운영을 보장하지 않는다.

저비용 대안은 비교만 했다. 사용하지 않는 연결을 종료하는 운영안은 개발 없이 가능하지만 상시 두 앱 사용을 강제로 제한하지 않는다. 향후 사용자 입력에서 발생한 활동 저장을 기존 heartbeat HTTP와 결합하면 산술상 월 172,800 API를 줄일 여지가 있다. 그러나 활동의 의미·지연·계정 귀속·실패 계약을 새로 검증해야 하며, 872,640(+종료/B)은 구현·실측 결과가 아니다. 이번에는 heartbeat 300초·TTL 720초·조회 60초·활동 20분을 유지했다.

## 최종 회귀와 남은 이력

| 검증 | 최종 판정 |
|---|---|
| 전체 Node | **774건 / 771 PASS / 0 FAIL / 기존 3 SKIP**, 종료 코드 0 |
| 관련 native | **9개 스크립트 PASS**: 온라인·progress34/A22/B20/H22·journal/executor·host41·currency/desktop-store |
| 실제 React | **9종 PASS**, 추가 2Chrome/HTTP 세션 10 probes PASS |
| 반응형/기존 기능 | 320/390/768/1280·큰 글자·검색/필터·온라인/활동 구분·CHRONOS·재화 캐시·ERGON 공개 잠금 회귀 PASS |
| TypeScript | 별도 `tsc --noEmit --incremental false` PASS |
| 변경 범위 ESLint | MJS 11파일 오류 0·경고 0 |
| 격리 Next build | **62경로 생성 PASS, 종료 코드 0**, 합성 환경값 사용 |
| 독립 안전 검토 | 최종 Critical 0 / Important 0 / Minor 0 |

첫 전체 시험은 774건 중 770 PASS/1 FAIL/3 SKIP였다. 새 사본에서 기존 validation builder가 결과 폴더를 만들지 않아 `DirectoryNotFound`가 발생했다. 다른 시험이 폴더를 먼저 만들면 숨겨지는 시험 독립성 결함이다. builder에 전용 폴더 생성 1줄만 추가하고, 소유 사본의 기존 결과를 삭제 없이 보존 이동한 뒤 빈 경로에서 단독 PASS와 최종 전체 PASS를 확인했다. 제품 안전 조건은 변경하지 않았다.

빌드 로그의 타입 검증 생략은 별도 TypeScript PASS와 구분한다. 기능 브랜치 Next 빌드의 기존 릴리스 값과 별도 0.4.3 WebView 통합을 혼동하지 않는다. 첫 최종 빌드 출력이 도구 응답에서 잘려 종료 코드를 읽을 수 없어, 같은 소스의 후속 빌드에 종료 코드 파일을 남겨 0을 확인했다.

기존 Astra/layout lint **22오류·9경고**는 그대로이며 전체 lint PASS로 보고하지 않는다. 과거 S01 간헐 실패·최초 GUI timeout·ERGON 수령 terminal 최초 실패 원인 미확정도 이번 PASS만으로 해결됐다고 판단하지 않는다. 새 정리 SQL 실제 PG·물리 환경 검증은 미실행으로 유지한다.

## 승인과 인계

이번 수정은 시험·미적용 SQL proposal·한국어 기록이며 기존 온라인 제품 소스는 변경하지 않았다. 운영 DB/권한/RLS/migration/job, 온라인·활동 flag, main/Production/공개 IRIS·ZIP, 실제 게임·사용자 원장, commit/push는 모두 변경 0이다.

[순월→영겁 인계](relay/TO_YEONGGEOP.md)의 `SW-20261029-001`은 **로컬 작성·미전송**이다. 다음 사용자는 신규 PG runner부터 확인해야 한다. 장기 표식·자동 유지보수·무료 한도·운영 통합 검토 후 각 적용을 별도 승인받는다. 현재 후보를 운영 적용 가능한 완성본으로 취급하지 않는다.
