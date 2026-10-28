# ASTRA 웹·IRIS 온라인 통합 설계
기준: c9a376fa5ecb28c575000a86e8a3e4241916d086. 로컬 구현 승인, DB 적용/commit/push/배포 미승인.

## 선택
기존 Presence는 ASTRA 방문에만 연결되고 클라이언트 닉네임을 신뢰한다. 커스텀 HttpOnly 세션은 Supabase Auth JWT가 아니므로 Presence 확장에는 별도 JWT/채널 권한과 native WebSocket이 필요하다.
서버 세션 기반 heartbeat를 선택한다(영겁 구현 판단). 닉네임·계정·시각을 인증 정보로 사용하지 않는다. 최근 활동 reporter/테이블은 그대로이며 heartbeat가 이를 호출하지 않는다.

## 계약
POST /api/account/online: connectionId(UUID), sequence(단조 증가 정수), kind(web/iris), action(touch/leave), expectedAccountId(web 필수, native null).
세션 쿠키 해시로 서버 RPC가 승인 계정·유효 세션을 다시 검사한다. kind는 표시용 자기신고이며 공식 장치 인증이 아니다. 연결별 300초 touch, DB lease 720초. leave는 terminal tombstone, 늦은/중복 touch로 부활 금지. 계정당 OR 집계, 여러 기기/탭의 개별 연결 종료는 다른 연결을 지우지 않는다.
GET는 인증된 계정만 전체 승인 계정의 만료 시각(연결 원문/세션/토큰 제외)을 받는다. ASTRA에서 최대60초 간격 읽기, 브라우저에서 만료 시각을 검사한다. 서버 오류는 확인 불가, 오래된 온라인을 무한 유지하지 않는다.
웹은 공통 layout에서 verifiedAccountId로 동작. IRIS document는 웹 reporter 제외, native UI timer가 숨김/플로팅/트레이와 무관하게 전용 CookieManager에서 현재 HttpOnly 세션을 읽어 고정 허용 origin에만 전송한다. renderer로 토큰 노출/저장/bridge 메서드 추가 없음. 정상 종료는 best effort leave 후 TTL fallback, 로그아웃은 session join으로 즉시 제외. 계정 전환 때 native는 구 쿠키 연결을 종료하고 새 연결 생성; 웹 지연 정리는 TTL 안전장치로 처리한다.

## DB 제안 / 안전
별도 presence lease 테이블+server-only RPC, RLS 및 직접 anon/authenticated 권한 없음. 활동 집계와 독립 플래그 SANCTUM_ACCOUNT_ONLINE_ENABLED 기본false. DB/플래그 적용 전 실제 사용 불가. 신규 제안만 작성, 실제 PG 실행 없음.
승인 계정→세션 재검사 잠금, bounded admission/cleanup, 만료 후 재확인, closed tombstone 보존. 계정·세션 삭제 외 기존 기록/ERGON 원장 변경 없음.

## 무료 운영
현재 정책과 기존 API/활동을 포함한 비용표는 [마감 보고](../../ASTRA_ONLINE_CLOSEOUT_20261028.md)를 따른다. 300초/720초로 heartbeat40% 절감, 600초/720초는1회 실패 내성이 부족하여 미채택. 40명2연결8h의 정상 주기 합계348,480+B,24h는1,045,440+B라 무료 보장하지 않는다. 기존 API B/CPU/egress 실제값과 전역 만료 lease 보존 정책 확인 전 활성화 금지.