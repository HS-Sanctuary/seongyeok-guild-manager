# IRIS 0.4.2 선별 릴리스 검증 — 2026-10-22 KST

## 최종 공개 확인 — 2026-10-22 21:43 KST

제품 `0d2b432f2db8afd3f2f9bbc3507b393397698447`을 main에 일반 push하고 원격 일치를 확인했다. Vercel `dpl_6t5gGW1AgNRTTHVfSxyLpgWTarX3`는 Ready / Production / 정확 main SHA / 운영 도메인 alias이며 GitHub Vercel status도 success다. 정상 Vercel 프로젝트 화면에서도 Current Production·Ready·같은 SHA를 확인했다. 이 후속은 문서 마감이며 제품 구조 변경은 없다.

실운영 download.json/notes는 모두 0.4.2, 다운로드 ZIP 598816 bytes와 SHA256 아래 값 일치, archive 10파일/manifest 버전/모든 payload 크기·해시 일치를 확인했다. `/`, `/login`, `/character`, `/party`, `/kerygma`, `/iris/desktop`, `/iris/download` GET200. 실제 브라우저 다운로드 화면의 Beta0.4.2·ZIP 링크/미서명 안내를 눈으로 확인했다. 일반 브라우저 desktop은 앱 연결 대기/편집 차단을 유지한다. 실제 사용자 native 앱·DB 저장·게임을 조작하지 않았다.

추가 합성 updater/floating-updater UI PASS: 조건부 업데이트 버튼·노트·4폭/3글자·취소·준비/보관 실패 시 apply0·성공 apply1·플로팅에서 사이드 바로 이탈하지 않음. native updater version/strict metadata/archive와 임시 프로세스 success/crash/recover 및 패키지 allowlist/hash/미서명 상태 PASS. 이것은 실제 사용자 설치본 교체 성공과 구분한다.

Vercel 팀 범위 deployment-list API는403이어서 공개 domain lookup/정상 로그인 대시보드/커밋 상태로 동일 배포를 교차 확인했다. 별도 runtime error 로그 전수 조회는 확보하지 않았으며 오류0으로 보고하지 않는다. 새 공개 공지 게시0·DB/RLS 변경0·실제 게임 명령0·강제 재시작0. 실제 사용자는 앱 업데이트 확인 후 정상 업데이트하고 저장/전환 체감을 확인할 수 있다.

## 승인과 분리 기준

한설은 저장 안정성 개선의 선별 commit/push, 필요한 main 반영과 Production, IRIS 0.4.2 공개를 승인했다. 실제 게임 행동·DB/RLS 변경·공개 ERGON 해제·앱 강제 재시작은 제외한다.

- 운영 기준: main `06e1eca3e876cc240e62806be584aa725f95c69c`, Production `dpl_GYEnrxpprAXGwr6X2BQKRK4aKkyH`.
- 기능 후보: `955332a38aeddd07d90af411015c3d4ab0c49cdb`, `codex/home-gnosis-iris-integration-20261019`에 일반 push 후 원격 일치 확인.
- 별도 main 기반 작업공간에 저장·전환·재화 캐시와 직접 테스트만 옮겼다. 기능 브랜치의 미공개 ERGON/B-1·GNOSIS·폰트·어비스 변경 전체를 병합하지 않는다. SANCTUM 웹 표시 버전은 그대로, IRIS만 0.4.2다.
- 집 원래 checkout의 개인 변경 12항목·삭제 상태·실행 원장·사용자 보호 파일은 수정/전송하지 않았다.

## 실제 변화

연속 편집은 첫 저장 기한을 유지한다. 임무 5개 합성 검증에서 15초 전 쓰기 0회, 기한 도달 후 항목별 읽기 5회/저장 5회·최대 동시 전송 1개·최종 모두 1·대기함 0개를 확인했다. CAS/요청 ID/unknown/conflict/expired 보호는 유지하며 요청을 무리하게 병합하지 않는다.

캐릭터·계정 변경은 기존 세션으로 즉시 저장/ACK 확인 후 이동한다. 실패하면 재시도·이 PC에 보관 후 전환·돌아가기를 제공한다. 명시적 보관은 네트워크 복구를 요구하지 않으며 다른 계정으로 요청을 재귀속하지 않는다.

플로팅 저장줄은 캐릭터 선택 위에 간결하게 표시한다. 로컬 보관/서버 대기/전송/확인 완료와 결과 확인 필요를 구분한다. main 이식 직후 상단 배치 회귀가 실패해 DesktopCenter의 저장줄 위치 두 줄을 함께 이식하고 재통과했다. 무관한 기능 이식은 없다.

재화는 별도 PC 로컬 DPAPI 캐시에 마지막 정상 숫자/품목별 UTC 관측 시각을 저장하고 UI에 KST로 표시한다. 환경·SANCTUM 계정 namespace 분리, 게임 계정/캐릭터 귀속은 항상 미확인이다. 조회 실패·null/빈/오래된 값이 정상 숫자를 덮지 않는다. 현재 가용 잔액/ERGON 비용 근거가 아니며 ERGON의 fresh read 경로도 바꾸지 않았다. 손상/backup 복구 상태는 읽기만 허용하고 자동 덮어쓰기를 막는다.

## 릴리스 소스 검증

- clean main 기반 저장/controller/workspace 59 PASS 후 변경 이식.
- 기능 후보 전체 638건: 635 PASS / 기존 3 skip / 실패 0.
- main 기반 릴리스 전체 618건: 615 PASS / 기존 3 skip / 실패 0. 기능 브랜치 전용 테스트 차이 때문에 총수가 다르다.
- 별도 타입 검사·수정 TS/TSX scoped ESLint PASS. 합성 localhost 환경 격리 Next webpack 빌드 PASS. 이 빌드는 Production에 재사용하지 않는다.
- 실제 React+합성 IO: currency-cache, save-transition, floating-save-strip, floating-save-overlay, ergon-release-lock PASS. 재화 320/390/768/1280, 저장줄 320/390/520 및 18/20/22 글자 크기 검증. ERGON 자물쇠/disabled/낡은 외부 진입 거절 유지.
- native 재화: 0/null/빈/오래된 응답·계정/환경·재시작·암호화·atomic 실패 원본 보존·backup 읽기 후 쓰기 차단·취소 문서 저장 0회 PASS. 기존 native store/workspace/journal/executor 회귀도 PASS.
- 0.4.2 native 컴파일과 공개 후보 ZIP 생성. 업데이트/패키지 검증 결과와 실제 운영 확인은 아래 후속 기록을 따른다.

## 남은 제약과 비용

실제 사용자 0.4.1 설치 위치 교체·정전/장치 고장·실계정 저장 E2E는 미실시다. 기존 IRIS 탐색/lint 문제를 이번 작업으로 해결했다고 주장하지 않는다. 기본 localhost 서버가 없는 legacy desktop-ui 시험은 assertion 이전 연결 실패로 별도 분류한다. 깨진 캐시의 사용자 복구 UI·잘못된 클래스 초안의 영속 복구는 후속이다.

새 DB 구조/서버 API/Realtime/Storage/유료 서비스 0. 서버 저장은 기존 항목별 요청이며 추가 고빈도 폴링이 없다. 재화 캐시는 활성화/수동 새로고침의 기존 공식 조회를 보관할 뿐이다. 검증 중 실제 게임 CLI/DB 쓰기 0. ERGON B-2는 보류한다.

## 공개 후보 무결성과 되돌리기

- ZIP: 598816 bytes, SHA256 `9ea1c1d9f2ee8d758c702b5436c8658cdf7b2092b8d74001a10de9caef719274`.
- `public/IRIS/downloads/download.json` / ZIP / `public/IRIS/notes/0.4.2.json` / web release version을 함께 공개한다. 기존 앱 업데이트 창이 이 버전의 요약을 읽는다.
- 무료 미서명 베타라는 안내를 유지한다. Windows 경고를 우회하거나 보안을 끄도록 안내하지 않는다.
- 문제 발생 시 위 직전 정상 Production과 0.4.1 소스를 기준으로 되돌리기를 제안한다. 새 캐시를 지우거나 기존 queue·원장을 수정하는 되돌리기는 금지한다. native 다운그레이드 시 신규 전용 캐시는 그대로 보존한다.
- 아래 최종 운영 검증이 추가되기 전에는 공개 완료라고 간주하지 않는다.
