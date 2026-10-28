# ASTRA 온라인 후보 마감·비용 정책 — 2026-10-28

기준 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`, 로컬·원격 수신 기준 `c9a376fa5ecb28c575000a86e8a3e4241916d086`.
이번 상태는 **미커밋 로컬 후보·전송 준비**, commit/push·DB 적용·flag 활성화·main/Production·공개 IRIS·게임 명령 실행 없음.
[최초 구현 QA](ASTRA_ONLINE_QA_20261028.md)의180/600과 비용은 당시 결과로 보존하며, 현재 정책은 본 문서300/720이 우선한다.

## 선택한 정책과 최소 변경
영겁 판단으로 heartbeat300초 / lease720초를 웹·native·SQL proposal에 함께 반영했다. 사용자에게 간격 선택을 위임받은 로컬 후보 결정이며 운영 활성화 승인이 아니다.
웹15초 scheduler와 native15초 CookieManager 점검은 그대로다. 이것은 서버 요청 주기가 아니다. 전송은 최초1회 후300초 이상, ASTRA 조회는 visible document에서60초 이상, focus 반복도 제한한다. disabled는 최초 확인 뒤 주기 네트워크0.
변경은 lib/accountOnline.ts 상수2개, iris/desktop-online.cs 스케줄1곳, 온라인 SQL 만료1곳과 대응 시험뿐이다. 새 인증·유료 서비스·activity 저장 변경 없음.

| 후보 | 갱신1회 누락 | 강제 종료 시 임대 만료 상한 | 판단 |
|---|---|---|---|
|180/600|2회 연속 누락 후540초 갱신도600초 전|10분+표시 최대1분|원래 후보, 비용 큼|
|300/720|300초 누락 후600초 갱신에120초 여유|12분+표시 최대1분|선택, heartbeat40% 절감|
|600/720|600초1회 누락 시 다음1200초 전에 임대 만료|12분+표시 최대1분|한 번의 통신 실패에 최대8분 false-offline 위험|
|600/1320|600초 누락 후1200초 갱신에120초 여유|22분+표시 최대1분|더 저렴하지만 오래된 온라인이 오래 남아 보류|

정상 종료/로그아웃은 어느 주기든 다음 heartbeat를 기다리지 않는다. 마지막 연결의 leave가 DB에서 확인되면 즉시 제외하는 계약이며 ASTRA 화면 반영에는 최대60초가 든다. 다른 기기가 살아 있으면 계정은 온라인을 유지한다.
네트워크 실패·강제 종료에는 즉시 제외를 보장하지 않는다. 웹 leave/Dispose는 best effort이고 TTL이 최종 경계다. 기존 logout이 세션 삭제 실패를 삼키는 경우도 즉시 제외 보장 불가다.
트레이·플로팅·사이드바는 같은 native connection을 유지한다. 실제 설치본의 세 상태/절전·복귀 시험은 아직 미실행이며 합성과 private compile을 운영 검증으로 부르지 않는다.

## 월 heartbeat 요청 비교
30일·40명·한 기기당1 connection을 가정한 정상 주기만 계산한다. 웹+IRIS/여러 탭을 동시에 켜면 각각 connection이며 단순히 PC 수만 세지 않는다. 시작·종료·재로그인·오류·계정 전환 요청은 추가된다.

| 간격 |1연결/명·8h|2연결/명·8h|1연결/명·24h|2연결/명·24h|
|---|---:|---:|---:|---:|
|180초|192,000|384,000|576,000|1,152,000|
|300초|115,200|230,400|345,600|691,200|
|600초|57,600|115,200|172,800|345,600|

## 기존 API·최근 활동을 포함한 계산
Astra 동시 viewer document4개, 매60초 조회. 실제 입력이 충분해 각 connection이20분마다 activity POST한다고 가정했다(백그라운드 IRIS는 실제로 이보다 적고 heartbeat는 activity를 호출하지 않음).
Astra4개 문서에서 activity ACK 뒤 directory GET도20분마다 발생한다고 가정했다. 이 GET을 새 online GET과 혼동하지 않는다.
나머지 기존 API/로그인·카탈로그·CHRONOS 저장·account directory 초기 조회 등은 **B**로 표기한다. 운영 analytics/로그를 조회하지 않았으므로 B의 실제 값을 만들지 않았다. 여러 페이지/기동/실패/동기화는 이 정상 주기 표를 넘을 수 있다.

| 간격 |1연결·8h 합계|2연결·8h 합계|1연결·24h 합계|2연결·24h 합계|
|---|---:|---:|---:|---:|
|180초|281,280+B|502,080+B|843,840+B|1,506,240+B|
|300초|204,480+B|348,480+B|613,440+B|1,045,440+B|
|600초|146,880+B|233,280+B|440,640+B|699,840+B|

300초·2연결·8h의 구성: heartbeat230,400 + online GET57,600 + activity POST57,600 + activity ACK directory GET2,880 =348,480+B.
24h 구성:691,200+172,800+172,800+8,640=1,045,440+B.
activity API에는 클라이언트별 제한과 DB 계정당20분 집계 제한이 다르다. 여러 기기에서 같은 계정의 DB 쓰기는 제한돼도 이미 도착한 API 호출 자체가 사라지지는 않는다.
Astra viewer40개가 모두24h라면 online GET만1,728,000회다. viewer4 가정을 전체 길드의 최대치로 안내하지 않는다.

## 무료 플랜 여유와 대안
[Vercel Functions 공식 기준](https://vercel.com/docs/functions/usage-and-pricing): Hobby 월1,000,000 invocations·active CPU4h·provisioned memory360GB-h. 성공/실패 요청 모두 계산된다.
300초·2연결·8h 정상치의 호출 여유는651,520회에서 B와 기동/오류를 빼야 한다.24h2연결은 이미45,440회 초과여서 무료 보장 불가다.
CPU 평균10ms라는 가정만 넣으면348,480회는약0.97CPU-h,1,045,440회는약2.90CPU-h이다. 실제 CPU·기존 부하는 측정하지 않았다. wall-time·동시성·메모리/egress도 별도로 남는다.
[Supabase Free 공식 기준](https://supabase.com/pricing): API 요청 횟수 자체는 unlimited 표기이나 DB500MB/shared compute·egress5GB 등은 무한하지 않다. 이 후보는 신규 Realtime·Storage0, touch/snapshot 각1 RPC로 항목별 N+1이 없다.
활동 API는 기존1 RPC, directory는 기존 계정 조회와 선택적 활동 배치 조회를 하므로 Vercel 호출 수=총DB SQL문 수가 아니다.
DB row 물리 크기/index bloat/응답 평균 크기·실제 잔여량은 미측정이다. 예를 들어 online GET57,600×응답10KB이면약576MB의 응답량이라는 가정치이며 실제 측정값이 아니다.

이번에는300/720만 최소 반영하고 다음 무료 대안은 제안으로 남긴다.
- 보이는 ASTRA만 조회하는 현 정책 유지, 관측 실패/disabled 때 중복 요청 금지.
- 활동 실제 입력이 적은 IRIS tray를 activity 요청으로 계산해 강제20분 갱신하지 않기.
- B/동시 viewer를 확인하고 필요 시 visible online GET을120초로 완화(표시 지연도120초가 됨).
- 극단적24h 사용은600/1320을 명시적인 느린 상태 정책으로 검토. 무료 한도를 위해 보이지 않는 오프라인 오판을 감수하는600/720을 자동 선택하지 않기.
- 동일 브라우저 origin의 대표 연결은 향후 무료 대안이나 cookie/계정 전환 fencing 복잡도가 늘어 이번에 구현하지 않음.
유료 업그레이드·새 JWT·native WebSocket/서비스·추가 구독을 전제로 하지 않는다. 예산이 불충분하면 운영 비활성을 유지한다.

## DB 안전 대조 — 정적 확인, 실제 PostgreSQL 미실행
| 항목 | 온라인 proposal | 최근 활동 proposal / 판정 |
|---|---|---|
|객체·flag|connections1/touch·snapshot2, ONLINE flagfalse|activity1/touch1, ACTIVITY flagfalse; 서로 호출/의존 없음|
|권한|RLS on, anon/authenticated/PUBLIC revoke, service_role invoker|동일 server-only 패턴, 실제 grant/RLS/row-lock 권한은 승인 후 확인|
|소유권|token hash→승인 계정 공유잠금→같은 session 재조회→expected ID 대조|활동과 동일 잠금 순서. native source는 자기신고이며 장치 인증으로 승격 안 함|
|만료|DB clock·session expiry와 lease의최솟값, snapshot join에서 재확인|activity 영속 시각과 세션 last_seen을 온라인으로 사용하지 않음|
|다중기기|session+connection별 PK/advisory lock, account별OR|활동은 account1행 UPSERT/20분; 정상 갱신과 충돌 없음|
|종료·늦은응답|closed tombstone 우선+증가sequence, leave/갱신 직렬화|과거 활동 시각을 지우거나 logout으로 소급 변경하지 않음|
|만료 자동제외|snapshot에서 expires_at와sessionexpiry 검사|물리 row 삭제를 기다리지 않아도 offline|
|snapshot|인증·clock·임대 집계를 단일 statement/MATERIALIZED clock|기존 activity directory 배치와 독립|
|데이터 증가|자기 session별 active8/보존256,24h 지난 자기 row 정리,session삭제FK|계정당activity1행은 별도. 온라인에는 **전역 보존 상한이 없음**|

로그인 소스는 매 login 새 session을 insert하며, 확인한 소스·스키마 문서에는 만료 session의 전역 GC가 없다.
따라서 다시 접속하지 않는 만료 session/lease는 현재 proposal만으로 물리 정리된다고 보장할 수 없다. 세션당256은 전체 DB의 무제한 증가 방지 증명이 아니다. 온라인 SQL에 이 한계를 주석으로 명시했다.
운영 활성화 전에 (a) 신규 임대 테이블만 대상으로24h 지난 만료 행을 bounded batch로 정리하는 정책 또는 (b) 별도 승인된 expired-session GC와FK cascade 정책을 확정·검증해야 한다. 기존 session/활동/ERGON 보호 원장은 이번에 삭제하지 않는다.
온라인은 env별 분리이고 기존 활동 proposal은 account 공통 집계다. 두 flag를 한꺼번에 켜거나 development에서 production 활동 기록을 시험하지 않는다.

### 실제 PG 승인 후 시험 절차
1. 별도 승인된 일회용 PG/staging에서 합성 accounts/sessions만 구성. 운영 행·원문 응답·보호 파일 복사 금지. 실제 제약/객체 충돌/권한을 먼저 대조한다.
2. 두 proposal을 각각 단독 적용한 환경과 함께 적용한 환경에서 flags 독립성 검사. 기존 객체가 있으면 덮어쓰지 않고 중단.
3. anon/authenticated/PUBLIC에서 table/RPC 접근 거부, service_role 최소 필요 권한과 RLS 실제 검사. 운영 role 권한을 추정으로 승인하지 않음.
4. null/잘못된/만료/철회/pending session은 쓰기0, cookieB+expectedA는 conflict·쓰기0. 대기 중 계정/세션 변경과 잠금3초 timeout 뒤 원본 보존.
5. A의session2개/각connection2개 동시 갱신→단일 계정 온라인. 한 연결 leave 뒤 나머지 유지, 전부 leave하면 제외.
6. 두 DB 연결로 touch-before-leave/leave-before-late-touch/중복seq/더 높은 늦은seq를 교차 commit해 closed 재활성0.
7. lease720초/sessionexpiry의빠른쪽 이후 snapshot자동제외, 행을 삭제하지 않고도 offline. 실제 시간 또는 격리 합성 row값으로 확인하며 운영 시계를 바꾸지 않음.
8. snapshot의statement snapshot이동시commit보다 일관된 시각을 주는지 두 연결·반복 barrier 시험.최대TTL보다1ms 미래·잘못된 DTO는 fail closed.
9. active8/보존256/24h cleanup·env분리·세션삭제FK, 실제 query plan/row 크기/index·advisory 경합/월 예상량 측정.
10. 전역 보존정책을 별도 확정하고 row증가가 bounded인지 검증. 실패하면 flags는 계속false.
이 절차 작성은 실제 PG/운영 DB 적용·테스트 계정 생성·정리 작업의 승인이 아니다.

## 검증·전송 준비
정책 변경 전 시험3건 RED(180초 재전송/native299초/12분DTO)→최소 수정 후 온라인12 GREEN. 실제 React는 활동 flagfalse에서도 온라인2명 유지·간격/ABA/늦은응답/12화면 크기 합성 PASS.
최종 전체 Node/타입/관련 lint/private native/격리 build 결과는 아래 마감 항목에 기록한다. 앞선 독립 검토의3건·실제 PG 미검증은 최초 QA와 함께 보존한다. 간격 외 인증/저장 보호를 재설계하지 않았다.
기존 공개 main은ca697706a874d21668091588940ceb61338d0700, 기능 기준은c9a376f다. 기능 브랜치에 이미 있는 오래된 irisRelease/ZIP/download.json/0.4.3 note 차이를 확인했다. **이번 후보는 이4개를 변경하지 않았고 운영0.4.3 위로 가져오지 않는다.** feature 전체 main 병합 금지.
집 개인12·ACK 원본·옛 C/D-0 미전송4·ignored logs/DPAPI/private compile 결과는 원래 작업공간에 보존. 이 후보 source29의 수정 전 사본/지문도 ignored에만 보존했다.
TO_YEONGGEOP는 이번 ASTRA ACK/수신 상태 hunk만 전송 후보로 잡는다. 거기에 누적해 둔 기존10/27 ACK2개 원본은 계속 로컬에 보존하고 이번 ASTRA 선별 전송에서 제외한다. 이 ACK가 참조하는 미전송 개인 수신 메모도 보내지 않는다.
정확한 전체 허용 파일과최종지문은 마감 검증 후본 문서아래에 남긴다. index는비워두며 commit/push 권한을 앞선 개발승인에서 추정하지 않는다.
### 최종 마감 결과
300/720 최종 source 기준 Node752/749 PASS/FAIL0/기존3 SKIP, 신규 온라인12 PASS. 실제 온라인/기존 활동 React·타입/신규 관련 ESLint·private native compile·격리 Next build PASS.
이전 작업대/전환·종료/ACK/CHRONOS 저장/재화/공개 잠금 React7종은 최초 후보에서 PASS이며 이번에는 변경 없는 제품 경계라 불필요하게 반복하지 않았다. 전체 Node에서 기존 N04/C 저장·원장 회귀는 다시 PASS했다.
새 브라우저 시험의 ACTIVITY flagfalse/ONLINE flagtrue 분리도 PASS. 기존 Astra/layout lint22오류9경고는 최초 후보에서 HEAD와 동일 확인됐고 해당 파일은 이번 간격 변경에서 수정0이다.
이번 정책 시험 RED3→GREEN, 기존 실패·독립 리뷰·실제 PG 미검증을 삭제하지 않았다. 신규 민감자료/개인경로/원장/ZIP는 전송목록0.

**중요한 운영 기준 차이:** 기능 HEAD의IRIS_BETA_VERSION은0.4.2, 운영 main은0.4.3이다. release/ZIP/download.json/note뿐 아니라 DesktopFloatingHub·DesktopIcons·irisFloating·desktop-floating의 사이드바 복귀 핫픽스도 기능 기준에 빠져 있다. 이를 이번에 수정·병합하지 않았다. 공개 후보를 만들려면 별도 승인으로 운영0.4.3 소스 위에 선별 통합·회귀해야 하며 이 feature를 통째로 운영에 배포하면 안 된다.

### 선별 전송 허용 목록 —32파일
제품11:
- app/api/account/online/route.ts
- app/layout.tsx
- app/lounge/components/AstraView.tsx
- components/common/AccountOnlineReporter.tsx
- lib/accountOnline.ts
- lib/server/accountOnline.ts
- lib/useAccountOnline.ts
- iris/desktop-online.cs
- iris/desktop-webview.cs
- iris/build-beta.ps1
- iris/desktop.ps1

시험10:
- iris/desktop-online.fixture.cs
- iris/desktop-online.tests.ps1
- iris/desktop-grip.tests.ps1
- iris/desktop-startup-close.tests.ps1
- iris/desktop-webview.tests.ps1
- tests/account-activity.browser.mjs
- tests/account-online-native.test.mjs
- tests/account-online-server.test.mjs
- tests/account-online.browser.mjs
- tests/account-online.test.mjs

미적용 SQL1:
- supabase/proposals/20261028_account_online.sql

문서10:
- app/SANCTUM_MASTER_GUID.md
- docs/ASTRA_ONLINE_QA_20261028.md
- docs/ASTRA_ONLINE_CLOSEOUT_20261028.md
- docs/superpowers/specs/2026-10-28-astra-online-design.md
- docs/superpowers/plans/2026-10-28-astra-online.md
- docs/HANDOFF.md
- docs/RELEASE_NOTES.md
- docs/DECISIONS.md
- docs/relay/TO_SOONWOL.md
- docs/relay/TO_YEONGGEOP.md — 새 ASTRA ACK와 SW-20261028 상태만 선별; 기존10/27 ACK2는 제외

소스 지문/인계 후보 ACK 사본은 ignored 마감 영역에 보존한다. ACK 원본/작업트리는 변경하지 않고 검토용 사본에서만 상기2문단을 뺐다. 아직 스테이징하지 않았으며 index가 비어 있다.
이 목록 검토와 별도 commit·일반push 승인이 있으면 기능 브랜치로 전송할 준비가 돼 있다. 운영용 배포/SQL 적용 준비 완료를 뜻하지 않는다.
