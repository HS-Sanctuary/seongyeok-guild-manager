# ASTRA 통합 활동 후보 구현 계획

**기준:** 한설의 2026-10-28 상세 요청. 운영 DB 적용·배포·commit/push 승인 아님.

## 설계·확인된 제약

- 기존 sessions.last_seen_at은 생성 후 갱신0, logout/change-code에서 행 삭제. 영구 최근 활동 기준으로 부적합하다. characters.updated_at/last_active_at과 과거 세션 생성값은 이관하지 않는다.
- 새 계정당1행 집계 테이블 제안. DB 서버 시각·세션 소유권·승인 상태를 RPC 내부에서 확인하고 20분 조건부 upsert. 두 기기 경쟁은 PK와 조건부 갱신으로 합친다. 세션 삭제와 충돌 시 행 잠금으로 순서를 정한다.
- 기본 비활성 서버 flag. 승인 전 실제 새 테이블/RPC 조회·쓰기0, UI는 준비 중과 기록 없음을 구분. 별도 웹/IRIS 엔진 없이 같은 서버 API와 클라이언트 수명 관리 재사용.
- client expectedAccountId는 인증이 아닌 교차 계정 방어값이다. 실제 대상·시각은 서버 세션/DB가 결정한다. native CLI/ERGON 실행과 무관하다.
- 진입·전경 복귀·사용자 입력 시만 기록을 시도하고 클라이언트/DB 모두20분 제한. timer/상시 Realtime 추가0. 로그인 성공은 유효 활동, 과거 로그인 세션만 있는 경우 집계 없음.
- 기존 ASTRA Presence는 웹 ASTRA 연결로 표기하며 최근 활동과 별개다. 클라이언트 Presence 자체가 계정 인증을 증명한다고 주장하지 않는다.

## 파일/단계

- [x] 수신 ACK·사무실 자료 보존·C/D-0 검증과 N04 중복 대조.
- [x] lib/accountActivity.ts: strict 읽기 계약·시간 표시, 공통 입력 기반 reporter/epoch·중복/실패 보호.
- [x] lib/server/accountActivity.ts, app/api/account/activity/route.ts: 고정 server RPC 경계, 비활성 gate·세션·same-origin·exact payload. SQL은 supabase/proposals/20261028_account_activity.sql의 미적용 검토안만 작성.
- [x] components/common/AccountActivityReporter.tsx: 웹 verifiedAccountId·IRIS controller account에 공통 연결. 인증 전/이후 전환·unmount 늦은 응답 무시.
- [x] AstraView: updated_at 쓰기/최근시각 사용 제거, 서버 계정 목록·집계와 묶음 매핑, 웹 Presence 문구·검색/필터 유지. 별도 열 없이 행 안에서 표시.
- [x] 합성 서버·client/실제 React: 권한·전환ABA/만료·경합·기록null/오류/시간·320/390/768/1280·큰 글자. RED→GREEN.
- [x] 관련/최종 Node·타입/lint·격리 build 및 독립 안전 검토. 한국어 결과/DB승인 요청·D-1 정적 점검 기록. commit/push0.

**DB 적용 경계:** SQL 검토안의 객체·권한·복구·예상 호출을 완성한 뒤 승인 요청. 아직 없는 객체를 운영에 존재한다고 문서화하지 않는다. 무료 plan은 확인했으나 실시간 잔여사용량은 확인하지 못했으므로 금액0을 보장하지 않는다.

## 실행 결과

실제 구현·PASS/FAIL/미실행은 docs/ASTRA_ACTIVITY_OFFICE_QA_20261028.md에 기록했다. 공통 쓰기는 POST /api/account/activity, 읽기는 기존 GET /api/accounts/directory의 배치 조회를 재사용한다. DB는 제안만 준비했고 운영 적용/활성화/전송은 하지 않았다. 전체 회귀의 ZIP 누락 환경 실패와 별도 native collection assertion 실패, 기존 Astra/layout lint 실패를 숨기지 않는다.
