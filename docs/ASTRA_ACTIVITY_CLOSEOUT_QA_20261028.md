# 순월 — ASTRA 마감 전 안전 재검증

> 후속 전송 승인: 한설의 기능 브랜치 선별 commit·일반 push 요청으로 검증된 비활성 후보와 최소 인계를 전송한다. 아래 승인 전/미전송 경과는 보존하며 DB/flag/운영/실게임 승인은 아니다. 전송 직전 최종 소스 지문 동일·관련24 PASS, browser runtime을 개인 경로 대신 인자로 전달한 뒤 실제 ASTRA React PASS를 확인했다. 정확한 수신 SHA는 이 기록을 포함한 커밋/원격 HEAD다.

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- **완료:** 기존 후보·개인 자료 보존, 수령 실패 잔존 원장 대조·경계 진단·결정적 저장 장애 주입, ZIP 동일성 확인, ASTRA SQL/실제 native 주소·인증 경로 독립 검토. 미적용 SQL의 잠금 순서와 직접 권한 회수를 최소 보완했다.
- **아직 안 됨:** 과거 수령 FAIL 당시 terminal 저장 예외의 정확한 종류·발생 원인은 미확정이다. 재실행 PASS를 해결로 보지 않는다. 실제 PostgreSQL·IRIS 설치본 헤더/쿠키 복원·운영 활성화는 미검증이다.
- **다음:** 재발 시 terminal 저장의 예외 종류·HResult·호출 경계를 보존해 원인을 확정한다. DB 적용 전 실제 권한/역할 멤버십·동시성·만료 시험은 별도 승인 후 진행한다. 이번에는 보고 뒤 중단하며 commit/push·활성화하지 않는다.

## 수령 FAIL 조사

기준 HEAD는 `a826ad0ad4728540034678cb8e46167f57a2b5e1`이다. 이전 실패 원문과 현재 native executor/journal/policy/fixture를 대조했고 제품 소스는 변경하지 않았다. 실패 당시의 **시험 소유** DPAPI만 읽기 전용으로 복호화해 `live-flat-collection` 행이 `inflight`임을 확인했다. 정상 합성 수령의 같은 행은 `completed`였다. 실패 시험의 임시 원장 경로214자는 MAX_PATH 이내이며 C의 긴 경로 실패와 다르다.

`Run`은 실행/관측 오류 때도 terminal 쓰기를 시도한다. 이 시험에서 정착한 작업의 행이 `inflight`로 남은 사실은 terminal 기록이 확정 저장되지 못한 경계를 가리킨다. 그러나 원래 catch가 예외를 보존하지 않아 당시 `Locked/Read/Write/File.Replace/DPAPI` 중 정확한 실패 단계·예외 종류는 확인할 수 없다. 최초 FAIL의 문구만으로 CLI 응답 parser 결함이나 장기 경로 결함이라고 단정하지 않는다.

제품을 바꾸지 않은 원본 시험은 이번에 PASS였다. ignored 진단 사본에서 실행/terminal catch를 구분해 예외를 출력했고, 일반 실행과 sandbox 실행 모두 정상 flat 수령은 PASS였다. 무제한 재시도나 sleep 추가는 하지 않았다.

그다음 같은 가짜 CLI의 terminal 직전에 합성 journal `.lock`을 점유하는 **한 가지 장애**를 주입했다. `DesktopLifeJournal.Locked`의 공유 위반 `IOException` → durable `inflight` 보존 → 화면 `unknown` → 두 번째 수령 거절·추가 호출0을 결정적으로 확인했다. 이는 저장 실패 때 기존 fail-closed 동작이 유지된다는 증거이며, 과거 원인까지 같은 공유 위반이었다는 증거는 아니다. 원장/unknown 보호를 완화하거나 terminal 쓰기를 자동 재시도하는 제품 수정은 하지 않았다.

## 최종 소스 회귀

최종 전체 Node: **740건 / 737 PASS / 0 FAIL / 기존3 SKIP**, exit0. 최종 SQL/계약 시험과 ZIP을 고정한 뒤 직렬 실행했고 source/SQL/test/ZIP12개 지문이 active 후보와 일치한다.

- SQL 추가 보완 전 전체는740건/737 PASS/0 FAIL/기존3 SKIP였다. 이후 독립 검토의 최종 SQL·계약 시험을 고정하고 전체를 다시 실행했다. 이전 ZIP 누락은 원본 ZIP/metadata의 SHA256을 바꾸지 않은 복사로 해소했다.
- 활동 단위20/서버8 합성 계약 PASS. 잠금 순서와 직접/default service_role 권한 회수의 RED→GREEN 원문을 보존했다. 실제 PostgreSQL 실행 시험을 뜻하지 않는다.
- 실제 React8종 PASS: ASTRA/공통 Reporter, D-0 가공 현황, 결과 작업대, page-protection, lifecycle-ACK, CHRONOS 저장 전환, 재화 cache, 공개 ERGON release-lock. 320/390/768/1280과 글자18/20/22 조합을 포함한다.
- native8개 스크립트 PASS: 진행 저장34, A22/B20, progress-host H22, journal, executor, host41, currency-store, encrypted desktop-store. 수령 원본/진단/저장 장애 주입도 PASS지만 과거 FAIL은 별도 미확정으로 남긴다.
- TypeScript PASS. 신규 모듈/API/Reporter·directory·IRIS page ESLint PASS. 기존 ASTRA15 errors/4 warnings와 layout7 errors/5 warnings는 유지되며 전체 lint PASS가 아니다(이전 후보와 동일).
- 최종 격리 `next build --webpack`: **PASS**, exit0. 실제 키·.env 없이 합성 환경값만 사용했다. 타입 검사는 빌드의 생략 설정과 별도로 수행했다.

## ASTRA 독립 보안 검토와 최소 보완

세션 쿠키 해시에서 실제 쓰기 계정을 결정하며 `expectedAccountId`는 교차 계정 방어값이다. 타인 ID·nickname·클라이언트 시각은 쓰기 권한이 아니고, origin/exact256B payload·승인/만료·늦은 응답/ABA/로그아웃/503 복구를 합성 시험과 정적 경로로 대조했다.

독립 검토가 기존 `FOR SHARE OF s,a` 조인 잠금과 계정 DELETE의 FK cascade 사이 역순 경합 가능성을 발견했다. **미적용 제안 SQL만** 잠금 없는 소유자 탐색 → 승인 계정 `FOR SHARE` → token hash·동일 계정의 세션 재조회 `FOR SHARE` 순서로 바꿨다. 최초 탐색을 인증으로 쓰지 않으며 세션 철회/소유 변경은 재조회에서 거절한다. advisory lock 뒤 DB 시각 만료 재검사는 유지했다. 실제 교착 재현은 미실행이며 정적 위험을 줄인 수정이다.

테이블의 직접/default service_role 권한도 명시적으로 회수한 뒤 SELECT/INSERT/UPDATE만 부여한다. 역할 멤버십을 통한 상속 권한은 별도로 검사해야 한다. 후속 독립 검토에서 추가 Critical/Important/Minor0, 서버 시험8/8 PASS다.

## 실제 IRIS WebView와 세션 경로

정적 근거: `iris/desktop.ps1`·`desktop-host.cs`의 개발 주소는 `http://localhost:3000/iris/desktop`, 운영 주소는 `https://sanctum-tawny-three.vercel.app/iris/desktop`이며 scheme/host/port 고정 allowlist다. 합성3011은 실제 앱 허용 origin이 아니다. `desktop-webview.cs`는 환경별 독립 WebView profile과 표준 WebView2 환경을 사용하며 쿠키 프록시/수동 Origin 변조를 찾지 못했다.

로그인/전환 쿠키는 HttpOnly·SameSite=Lax·Path=/, 운영 Secure다. `irisDesktopTransport.ts`의 인증·세션은 상대 URL/credentials same-origin/redirect error이고, Reporter 역시 상대 URL·same-origin credentials다. Reporter의 redirect는 fetch 기본값으로 차이가 있지만 현재 고정 API 경로에서 redirect는 확인하지 못했다. navigation의 epoch 무효화와 controller 잠금/계정 초기화가 기존 요청을 끊는다.

이 구조는 새 POST의 same-origin 검사와 정적으로 호환된다. **사용자 계정 로그인/활동 기록은0회**다. 실제 설치본의 Origin 헤더·쿠키 저장/재시작 복원·redirect·서버가 보는 request.url은 이번에 실측하지 않았다. 이 점검을 실사용 PASS로 표현하지 않는다.

## 20분 제한·무료 운영·적용 전 위험

20분은 계정 공통 **DB 시각 갱신 간격**이다. 클라이언트도 살아 있는 Reporter별로20분을 제한하지만 재마운트/다중 탭·기기는 API/RPC 인증 조회를 더 만들 수 있다. 단 한 번의 호출을 모든 기기가 공유한다는 뜻이 아니다. 일시 장애의60초 대기는 자동 timer가 아니라 다음 실제 사용 시도의 최소 간격이다.

DB는 계정당1행이고 새 append log/Realtime/파일 Storage는0이다. 실제 사용8시간/일·40명·1기기 가정의 기록 후보는 최대 약960회/일,24시간은2880회/일이다. API/RPC는 재마운트·기기에 따라 더 많을 수 있다. Supabase Free 확인과 실제 잔여 사용량 미확인은 이전과 같다. 현재 신규 DB 경로는 비활성이고 배포하지 않아 후보로 인한 운영 기록·저장 증가0이다. 무료 잔여량과 실제 PostgreSQL 검증 없이 활성화하지 않는다.

적용 전 필수: 객체 이름/형식 충돌·세션 소유권/승인/만료·동시 웹/IRIS UPSERT·동시 계정 삭제/코드 변경/로그아웃·잠금 대기 중 만료·실제 RLS/EXECUTE/역할 멤버십을 검증한다. 준비 SQL은 proposals에만 있고 migration/DB 적용은 없다.

## 보존과 commit/push 준비 판정

기존 후보23개 중 이번 제품/시험 보완은 미적용 SQL·서버 계약 시험2개뿐이다. 실제 ERGON native 제품/시험·공개 ZIP/metadata 변경0이다. 원본 개인16·옛B17·옛 수신ACK1은 기존 지문과 동일하고 별도 N04 진단·원본 실패 로그도 보존한다. 새 진단 소스·암호문·원문 로그·해시 manifest는 ignored 로컬 자료로만 남긴다.

ASTRA 비활성 후보의 선별 파일·근거는 준비돼 있으나 **과거 수령 원인 규명까지 완료한 통합 안전 마감은 아니다**. 실제 사용/DB 활성화 승인을 뜻하지 않으며, 전송 여부는 이 제한을 보고한 뒤 한설이 별도로 결정한다. commit/push·main/DB/Production/공개 IRIS·ERGON 잠금/실게임 변경은0이다.
