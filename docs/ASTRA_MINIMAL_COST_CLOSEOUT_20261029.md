# ASTRA 최소 비용 검토 및 ERGON 복귀 인계

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 기존 IRIS 통신을 소스로 대조하고 heartbeat 대체를 보류했다. 이번 실제 요청 절감은 **0회**다. 기존 안정화 시험·미적용 SQL과 한국어 기록만 기능 브랜치 선별 전송 대상으로 삼는다.
- **아직 안 됨:** 신규 retention SQL 실제 PostgreSQL, 자동 정리·장기 세션 표식 정책, 운영 설치본·OS 절전/네트워크·무료 사용량 실측. 온라인·활동 기본 비활성, 운영 DB·main·공개 IRIS 0.4.3은 그대로다.
- **다음:** ASTRA 대형 개발을 추가하지 않고 ERGON D-1 공식 관측 근거와 제한된 검증 제안을 준비한다. 실게임 조회·소비·자동 생산 활성화는 승인하지 않았다.

## 기준과 전송 권한

기준은 `codex/home-gnosis-iris-integration-20261019`의 `2ad9fc3bbe6102f7fafdd060c6d5d3cc6701392b`다. 최신 원격을 fetch해 같은 HEAD임을 확인했다. 운영 main `ca697706a874d21668091588940ceb61338d0700`과 기능 브랜치 릴리스 0.4.2의 차이를 유지한다.

한설은 이번 요청에서 검증된 ASTRA 변경·미적용 SQL proposal·시험·최소 인계의 선별 commit/일반 push를 승인했다. 이전 QA와 릴레이의 commit/push 미승인 문구는 당시 경과다. 이 승인은 운영 DB 적용·온라인/활동 flag·main 병합·Production·공개 IRIS 업데이트를 포함하지 않는다. 원격 최종 SHA는 이 기록을 포함한 커밋과 원격 HEAD를 대조한다.

## 기존 요청 재사용 조사

| 경로 | 실제 호출 조건 | heartbeat 대체 판단 |
|---|---|---|
| `app/iris/desktop/page.tsx`의 1초 `controller.tick()` | 로컬 상태 갱신. `irisDesktopController.flush()`는 저장 기한이 된 변경이 없으면 즉시 종료 | 1초 API 요청 아님. 트레이 무조작 상태 보장 불가 |
| CHRONOS 15초 저장 | `irisDesktopQueue`의 변경 대기 시간. dirty 항목만 `details` 대조 후 `transport.save` | 무변경 상태에서는 서버 요청 0회. 허위 저장을 만들어 heartbeat를 대체하면 오히려 비용/기능 영향 |
| `/api/auth/session`, `/api/iris/characters`, `/api/iris/kronos` | 시작·계정/캐릭터 전환·포커스/기간 변경·탭 갱신·사용자 새로고침 | 인증은 있으나 정기 실행 보장 없음. 포커스 30초 제한도 상시 호출 주기가 아님 |
| 재화 `game.currencies.*` | native bridge·로컬 재화 캐시/게임 조회 | SANCTUM 서버 API가 아님. 재화를 새로 읽거나 기존 게임 조회를 늘리지 않음 |
| `/api/iris/stats`, `/api/iris/synaxis` | 화면 진입·새로고침·사용자 조작·관련 이벤트 | 트레이 상시 주기가 아님. 제보/파티 Realtime의 재접속이나 DB 변경도 인증된 온라인 lease ACK가 아님 |
| `/api/account/activity` | 실제 포커스/사용자 입력, 성공 후 계정별 20분 제한 | 무조작 때 호출되지 않음. 온라인 신호와 활동의 의미가 달라 대체 불가 |
| native `/api/account/online` | `desktop-webview.cs`의 15초 로컬 timer가 `DesktopOnlineConnection.TickAsync` 호출, 실제 touch는 300초 제한 | 현재 유일하게 트레이/사이드바/플로팅과 독립된 인증 연결 유지 경계 |

source: `lib/irisDesktopTransport.ts`, `lib/irisDesktopController.ts`, `lib/irisDesktopQueue.ts`, `lib/irisDesktopStore.ts`, `lib/irisStatsTransport.ts`, `lib/irisSynaxisTransport.ts`, `components/common/AccountActivityReporter.tsx`, `components/iris/useDesktopContentAlerts.ts`, `iris/desktop-online.cs`, `iris/desktop-webview.cs`.

native 온라인 연결은 메모리의 connectionId·sequence를 소유하며, 허용된 현재 WebView의 HttpOnly 쿠키를 읽는다. 고정 Origin·URL로 전송하고 쿠키 교체 시 이전 쿠키로 leave한 뒤 새 연결을 만든다. 거절 상태와 종료 표식·sequence는 지연 요청의 부활을 막는다. 기존 API의 accountId나 DB 수정 시각만으로 이 계약이 충족되지 않는다.

다른 API에 편승하려면 native 연결 식별·sequence 예약·시도/성공 ACK·계정/쿠키 세대·leave와의 경합·응답 유실을 추가로 연결해야 한다. 단순 인증 미들웨어나 성공 이벤트 하나로 next heartbeat를 미루면 잘못된 계정/종료 연결을 살릴 수 있다. 여러 endpoint·renderer/native 경계를 바꾸는 비용에 비해 검증된 절감 근거가 없어 이번에는 **제품 수정 0개·기존 방식 유지**로 결정했다.

## 요청 절감과 비용 판단

이번 구현으로 줄어든 API/DB 호출은 **0회**다. 새 공통 미들웨어·heartbeat endpoint·서버 timer·Realtime 교체를 만들지 않았다. heartbeat 300초·TTL 720초·ASTRA 조회 최소 60초·활동 20분을 그대로 유지한다.

기존 월 계측은 40명·총 80연결·ASTRA viewer4·각 연결의 20분 입력을 가정했으며 8시간 348,480 API, 24시간 1,045,440 API다. 매일 80연결 종료를 가정하면 각각 350,880 / 1,047,840에 기존 API·시작·로그인·오류 요청을 더해야 한다. [안정화 QA](ASTRA_STABILIZATION_QA_20261029.md)의 가정과 무료 한도 경고를 유지한다. 현재 실제 사용량은 읽기 권한 부족으로 미확인이다.

40명이 각각 웹1+IRIS1을 쓴다면 IRIS 40연결의 정상 heartbeat 수는 월 115,200회(하루8시간) 또는 345,600회(24시간)다. 모든 heartbeat와 정확히 겹치는 기존 요청이 있다는 비현실적 가정의 산술 상한이며 **절감 실측/달성치가 아니다**. 트레이 무조작에서 대체 가능한 기존 요청의 보장 수는 0회다. 유효 heartbeat ACK 없이 요청을 생략하지 않는다.

활동 POST를 기존 heartbeat HTTP와 결합하는 이전 아이디어도 이번에는 진행하지 않는다. 사용자 입력 의미·지연·실패·계정 귀속 계약까지 변경하는 별도 후속이며 무료 운영을 약속할 근거가 아니다.

## 검증 및 알려진 제약

2026-10-29 전송 직전 소스와 격리 사본 지문을 대조하고 최종 회귀를 다시 실행했다. 아래는 이번 마감의 실제 결과이며, 운영 계정/DB/설치본 검증과 구분한다. 비용 최적화 제품 변경은 없다.

- **전체 Node 774건 / 771 PASS / 0 FAIL / 기존 3 SKIP**, 종료 코드0. 관련 native9·React9 및 추가 두 Chrome 세션·격리 Next build62경로를 포함한 21개 실행 단계가 모두 종료 코드0이다. TypeScript 별도 PASS, 변경 MJS11파일 ESLint 오류0·경고0. 실제 사용자 앱/원장/게임/DB 호출은 추가하지 않았다.
- 합성 retention15는 이번 전체 Node에서도 PASS. 이전 실제 WebView2/0.4.3 결과는 사본 지문이 같은 기존 근거로 유지하며 이번에 사용자 설치본 GUI를 실행하지 않았다. 상세: [상세 QA](ASTRA_STABILIZATION_QA_20261029.md). 새 retention 실제 PG는 **미실행**이다.
- 독립 검토 C0/I0/M0와 최초 시험 폴더 누락 RED→GREEN은 기존 결과로 보존한다. 제품 보호는 완화하지 않았다.
- 기존 3 SKIP·Astra/layout lint22오류9경고·과거 S01/GUI timeout/ERGON 수령 최초 실패 원인 미확정은 별도 유지한다.

## ERGON 복귀 순서

1. `ERGON_NEWOL_HANDOFF.md`와 C/N04·D-0 QA를 읽고 이미 완료된 B 관측·C `wood-v1` DPAPI 저장·pending/receipt/예산/terminal 대조·D-0 읽기 전용 화면을 재사용한다. 새 엔진이나 저장소를 다시 만들지 않는다.
2. D-1은 현 공식 CLI schema/응답을 근거로 **캐릭터 귀속, 안정 workId 또는 시설 배치 귀속, 실제 총정원/빈자리, 요청에 귀속된 실제 수령량/대성공, 실제 비용·멤버십 시간·외부 개입**을 구분한다. 미확인은 `unsupported`/확인 불가로 남긴다.
3. 실제 읽기 조회가 필요하면 대상·공식 명령·횟수·캐시 영향·원장 비접근·합격 기준부터 한설에게 제시하고 승인받는다. 이번에는 실제 CLI를 호출하지 않는다.
4. 공식 근거를 얻지 못하면 사용자 확인으로 해결 가능한 반자동 결과량과 자동 소비 차단 조건을 분리한다. 사용자 진술을 공식 workId/비용 증명으로 바꾸거나 unknown을 해제하지 않는다.

ASTRA 운영 적용은 별도 후속이다. retention 실제 PG·장기 표식/자동 유지보수·무료 사용량·운영 0.4.3 선별 통합 승인이 먼저 필요하다. 지금은 ERGON 공개 잠금과 `executionConnected=false`를 유지한다.

## 선별 전송 및 보존 확인

선별 대상27파일은 시험15·미적용SQL1·한국어문서11이다. 기존 개인16을 포함한 원본/옛후보·ACK34항목 및 N04진단9파일은 지문 동일, 새로 추가한 내용의 민감정보/개인경로·원문로그/암호문/ZIP 포함0을 확인했다. 격리 작업의 로컬 보존 브랜치는 별도로 만들고 원격은 승인된 기능 브랜치에만 일반 push한다. 원격/로컬 최종 SHA 일치는 전송 결과에서 확인하며 force/main/운영배포는 하지 않는다.
