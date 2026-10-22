# IRIS 저장 안정성·재화 마지막 조회 검증 — 2026-10-22

> 최종 공개 후속: 제품955332a 기능전송 후 main0d2b432에 필요한 저장 개선만 선별했다. 최종main b0b63c7·Production dpl_GimXVW6ejrr2xcu4n27msrbNrdb9 Ready/정확SHA·실0.4.2metadata/notes/ZIP/해시/다운로드UI 확인. [운영 검증 원문](https://github.com/HS-Sanctuary/seongyeok-guild-manager/blob/b0b63c7a5786380f4e36c67651d8596640f35db7/docs/IRIS_042_RELEASE_QA_20261022.md)을 최신으로 따른다. 아래는 기능후보의 경과이며 main기반618/615PASS3skip와 기능638/635PASS3skip를 구분한다. 안전검토 거절로main되합치기0/충돌0, 기능브랜치의 옛0.4.1ZIP 재배포금지. ERGON잠금·DB/실게임금지는유지한다.

영겁 / 기준 `a95c0768a490d18ff0f8ab4b1e0c62cd5c05bb33`의 별도 관리 worktree. 로컬 미커밋 후보이며 순월 B-1·집 원래 checkout 개인12항목과 삭제 상태를 보존한다. ERGON B-2는 보류한다.

## 실제 발견·수정

- queue edit/leaveCharacter는 같은 범위 pending 모두를 now+15초로 재예약했다. 최초 묶음의 가장 이른 기한을 유지하고 전환은 즉시 저장 확인 후 이동하도록 수정했다. CAS/멱등성·단일 inflight는 유지한다.
- 계정 전환/login은 keep 경로였다. 기본 save로 변경했고 실패 시 재시도/이 PC 보관 후 전환/돌아가기를 제공한다. 인증 만료로 계정을 잃으면 기본 전환을 중단한다. 명시적 keep은 네트워크 재조회 없이 보호 보관한다. unknown/conflict/expired 자동 재전송0.
- 재화는 메모리뿐이었다. 별도 native DPAPI 캐시로 환경·계정 namespace/품목별 정상 시각을 보관한다. 공식 캐릭터 증거가 없어 항상 unverified다. null/누락/빈/오래된 응답·실패가 정상 숫자를 덮지 않는다. 캐시를 ERGON live balance로 전달하지 않는다.
- 임무/상점 inflight를 결과 불명처럼 표시하던 안내를 전송 중과 확인 필요로 분리했다. 로컬 보관 중·서버 대기·ACK 확인 완료도 구분한다.

## 검증 결과

- 초기 관련 Node59/59 PASS. 신규 deadline/전환/캐시·native 문맥/복구 경계를 RED→GREEN으로 검증했다.
- 최종 전체 Node **638건/635PASS/기존3skip/실패0**. 옛 debounce 기대는 승인된 최초기한 계약으로 갱신했으며 CAS/소유권/복원 보호 assertion은 유지했다.
- 임무5개(t0~4초) 실제 controller+합성 API: t14999 쓰기0, t15000 details5/save5·최대 inflight1·최종 count 모두1·잔여0. 요청 병합이나 신규 서버 API 없이 반복 대기를 줄였다.
- High 독립 읽기 검토의 중요2건: (1) inflight unauthorized가 account를 지운 뒤 save 전환 우회, (2) 문서 revoke 후 재화가 응답 거절보다 먼저 저장됨. 전환 진입 owner/epoch 고정과 저장 직전 native context 재검사로 각각 RED→GREEN 보완했다. 이후 전체638 재검증 완료. 독립 재검토를 받은 것으로 표현하지 않는다.
- 새 재화 Node parser/bridge PASS. 별도 임시 root native:0/null/빈/오래된 응답·계정/환경 분리·재시작·암호화·atomic replace 실패 시 기존 바이트 보존·primary 누락 시 backup 조회/덮어쓰기 차단·취소된 문서 결과 쓰기0 PASS.
- React+합성 IO5파일 PASS: currency-cache/save-transition/floating-save-strip/floating-save-overlay/ergon-release-lock. 재화320/390/768/1280 가로 넘침0 및 합성 화면 눈으로 확인. fixture 금액은 제품 기본값이 아니다.
- 기존 native queue store/workspace store/life journal/life executor PASS. ERGON native 공개 gate PASS: public/dev 소비·낡은 floating 명령 차단 유지.
- 별도 타입 검사/scoped ESLint PASS. 가짜 localhost 환경의 격리 Next webpack60페이지 빌드 PASS. 프로젝트 빌드의 타입 생략 설정과 별도로 tsc를 실행했다. 운영 환경 파일/DB 사용0.
- 후보 native ZIP/manifest 컴파일·updater policy·temporary process 성공/충돌/복구·release allowlist/hash 합성 PASS. 실제 사용자0.4.1→0.4.2 교체/실제 정전·장치 고장 시험은 별도다.
- `iris-desktop-ui.browser.mjs`는 기본 localhost:3000 서버 부재로 ERR_CONNECTION_REFUSED, 제품 assertion 이전 전제 미충족이다. 통과에 포함하지 않는다. 기존 탐색/버스 lint 미해결도 해결했다고 주장하지 않는다.

## 전수 소스 점검 — 모든 기능이15초 저장인 것은 아님

| 기능 | 실제 계약 | 이번 범위/제약 |
|---|---|---|
| 숙제 | 항목별 queue→DPAPI→CAS·기간 key→ACK | 최초 기한·전환 수정, 실제 DB 시험0 |
| 클래스 | 유효 숫자 queue, 잘못된 초안은 메모리·전환 차단 | 보호 유지. 잘못된 초안 영속 복구는 후속 |
| 물물교환 | account/character scope·원본 digest·직렬 CAS | coalescing/ACK와 새 기한 합성 유지 |
| 상점 | count/bookmark·기간·catalog digest·공용/개별 | 공통 저장/표시 개선 |
| 임무 | 캐릭터별 주간 period·count/bookmark | 5항목 호출 수/최종 상태 확인 |
| 스탯 | 확인→최신 값 대조→명시 저장→서버 재조회 | 15초 queue 아님, 실계정 E2E 미실시 |
| SYNAXIS | 명시 API·계정별 unknown receipt/재전송 억제·기존 Realtime | 15초 queue 아님, 실제 파티 작업0 |
| 설정 | localStorage 즉시·native 창/플로팅 별도 | 기존 환경/계정 계약 유지, 큐로 합치지 않음 |
| ERGON | 계획 localStorage·진행 저장·실행 원장 별도 | 소스 미수정, B-2 보류·공개 lock 유지 |
| 종료/재실행 | save/keep/discard·원자 보관·복원 pending/inflight→unknown | keep 네트워크 불필요·보호 회귀 PASS |

## 비용·보존·남은 위험

새 DB/API/Realtime 구독/Storage/유료 서비스0. 재화는 활성화·명시적 새로고침당 기존과 같은 공식 조회1회이며 새 고빈도 폴링이 없다. 검증 중 실제 CLI0. 품목200개/1MiB·primary+backup 상한이며 기존 원장30일/300건 정책과 무관하다. 브라우저는 임의 숫자를 저장 요청하지 않고 native가 읽은 관측만 보관한다.

계정 namespace는 SANCTUM 로그인 관측 주체이며 공식 게임 계정/캐릭터 증거가 아니다. 캐시를 확정 캐릭터 값/가용 잔액으로 승격하지 않는다. 손상/backup 복구 상태는 마지막 값을 읽되 새 저장은 차단하며 원본 자동 삭제·덮어쓰기는 금지한다. 별도 사용자 복구 UX는 후속이다. 실제 PC 정전/운영 계정 E2E는 미검증이다.

## 0.4.2 공개 경계와 다음 작업

후보 `lib/irisRelease.ts`는0.4.2이며 [업데이트 설명](../public/IRIS/notes/0.4.2.json)을 추가했다. ERGON 잠금 유지. 다운로드 메타데이터/기존 공개 ZIP/운영 웹은 아직0.4.1로 두었다. 새 ZIP은 ignored 로컬 산출물이며 다운로드 공개 완료가 아니다.

IRIS는 운영 웹 `/iris/desktop`을 읽으므로 새 native만 올리면 queue/전환/화면 개선은 적용되지 않는다. **2026-10-22 한설이 이번 저장 개선의 선별 commit/push, 필요한 main 반영·Production 배포, IRIS0.4.2 공개를 승인했다.** 운영 기준은 main `06e1eca3e876cc240e62806be584aa725f95c69c`, Production `dpl_GYEnrxpprAXGwr6X2BQKRK4aKkyH`다. 별도 main 기반 릴리스 작업공간에 이번 변경만 옮긴다. 기능 브랜치의 미공개 ERGON/GNOSIS 작업 전체를 병합하지 않는다. DB 변경·ERGON 해제·실제 게임 행동·앱 강제 재시작은 계속 금지다. 승인과 공개 성공을 구분하며 최종 결과는 후속 인계에 기록한다.

다음 작업자는 이 문서→설계/계획→최신 diff를 읽는다. 승인 후 선별 인계하고, 운영 반영 허용 시 rollback 기준/0.4.1 교체/업데이트 감지·노트·해시/실제 핵심 화면 확인을 거쳐 공개 완료를 보고한다. 실제 게임 소비·운영 DB 변경은 계속 금지한다.
