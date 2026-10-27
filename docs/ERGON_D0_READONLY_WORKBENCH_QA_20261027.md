# ERGON D-0 읽기 전용 가공 현황 — 선별 전송 QA

## 2026-10-27 22:25 KST 최종 전송 승인

한설이 D-0 제품/시험8·기존 인계5와 저장소 필수 릴리스/구조도2만 기능 브랜치 선별 commit·일반 push 승인했다. 기준 C `aff55344dc213c80ef1e10602d350a11cf9cfc8b`. 정확한 최종 수신 SHA는 본 QA를 포함한 커밋과 기능 원격 HEAD를 대조한다. source8이 마지막 UI 보완을 포함한 보존본과 SHA256 일치하고 ff-only 최신임을 확인한 뒤 최종 검증을 다시 수행한다. 아래 로컬 후보/승인 없음 문구는 개발 당시 기록으로 보존한다.

개인12·수신 ACK 원본·C 계획/수신 메모·사용자 원장/암호문/로그/ignored 사본은 제외한다. 새 게임 조회/생산·공개 잠금 해제·main/DB/Production/IRIS 업데이트 승인은 없다. D-0는 저장된 자료의 표시 연결이며 실제 자동 생산 완성이나 게임 조회 승인과 구분한다.

**최종 소스 재검증 — 22:27 KST:** 마지막 보류 UI 가드까지 포함한 source8 SHA256 일치 확인 후 전체 Node **720/717 PASS/FAIL0/기존3 SKIP**·실제 D-0 React/합성 native 및 기존 보호 UI6종·TypeScript/관련 ESLint·격리 Next build 모두 PASS. N044와 C native14/API2 및 B 관측 보호를 포함한다. 이 검증 뒤 제품/시험 수정 없이 인계만 마감했다. 과거 N04 recovery field-diff 발생 단계 미확정은 C/N04 QA의 제한으로 유지하며 이번 PASS로 소급 해결하지 않는다. 원문 로그/개인 자료를 전송하지 않는다.

기준: 2026-10-27 KST 영겁. **C 최종 전송 `aff55344dc213c80ef1e10602d350a11cf9cfc8b`**, 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`와 원격 SHA 일치 확인. C26파일 선별 commit/push 완료, 운영main ca697706/IRIS0.4.3 유지. D-0는 그 뒤의 별도 로컬 미커밋 변경이며 전송 승인이 없다.

## 실제 연결

- `DesktopErgon`의 기존 목표와 native goal 선택을 재사용하고, `DesktopErgonWorkbench`의 생활 현황 안에 `DesktopErgonWoodStatus`를 연결했다. 새 grid/독립 작업대/생산 상태 엔진/저장소는 만들지 않았다.
- 기존 `loadErgonWoodProgress`→C observation 전용 strict parser→표시 projection을 사용한다. scope/goalId·sourcePlanId/planId·품목·수량100이 일치해야 한다. 중복 목표/다른 캐릭터·계정·환경/unsupported 계획은 조회 입장을 열지 않는다. review 상태는 표시 전용으로 선택하되 기존 실행 selector의 기본 조건은 그대로며 unavailable은 표시에서도 거절한다.
- C 안에 이미 저장된 B observation을 원래 observedAt에서 형식/문맥 검증한 뒤 과거 자료로 표시한다. 이 방법은 live freshness나 native source 소유권을 새로 발급하지 않는다. B 자료를 실행 permission으로 전달하지 않는다.
- `observe`는 CLI 조회/관측 저장 및 기존 예산 계약을 요구하므로 D-0에서는 호출하지 않는다. 새 승인/목표/명령/수령/폴링도 만들지 않는다. 새 관측을 만들려면 별도 승인·기존 계약 검토가 필요하다.

## 확인 가능한 값과 확인 필요 값

| 항목 | 표시와 한계 |
| --- | --- |
| 목표/진척 | 기존 목재 추가100 목표·정확히 연결된 C의 확정 기록0/남은100. source none인 기록0은 실제 확보0의 증명이 아니므로 `실제 추가 확보량 확인 필요`를 별도로 표시한다. C가 없거나 읽기 실패면 확정 기록도 확인 필요다. |
| 상태 | native unknown/수량 미확인은 `결과 확인 필요`, 목표 paused는 기존 목표 기록을 근거로 `보류`, 현재 C observation 제약은 `진행 차단`. C load는 활성 목표만 허용하므로 보류에서는 호출/새로고침을 막고 보류 중 가공 진척은 확인 필요로 남긴다. 실패/목표 완료로 위장하지 않는다. |
| 가공 현황 | B가 관측한 해당 품목의 시설·대기/완료 관측·남은 초. `조회 당시` 값 그대로이며 시간 경과로0/수령/완료로 바꾸지 않는다. 동일 이름 작업의 goal 귀속은 확인 필요다. |
| 시각 | B 관측 시각과 C 복원 확인 시각은 구분한다. C v1에 기록 자체의 updatedAt가 없어 `기록 갱신 시각 확인 필요`로 표시한다. 조회한 현재 시각을 저장 시각으로 꾸미지 않는다. |
| 차단 이유 | 작업 구분/시설 자리/실수령량/비용/게임 캐릭터 귀속·미확인 요청을 짧은 한국어로 안내한다. 기술 오류 원문/개인 경로를 노출하지 않는다. |

C production에는 실제 가공 수령량을 증명하는 출처가 아직 없다. synthetic 양수 receipt·예상 산출·등록 횟수·멤버십 배율을 실제 진척으로 승격하지 않는다. 채집/등록/수령의 실제 실행 단계 전환 및 결과 입력 UI는 이번 구현 범위가 아니다.

## 보호와 검증

- read 요청 ticket·현재 epoch·계정/캐릭터/plan key로 응답을 보호한다. ABA/메뉴 비활성/재mount 뒤 이전 응답을 버린다. 동일 scope에서 epoch만 바뀌는 경우에도 payload는 버리고 읽기 종료 상태를 정리해 재조회 잠금이 남지 않게 한다.
- 기존 결과 입력/미저장·requestClose/beforeunload/계정·캐릭터/로그아웃 보호는 변경하지 않았다. D-0는 추가 입력 초안·서버 저장·새 native writer를 갖지 않는다. C load의 기존 native 복원/감사 계약을 바꾸지 않는다.
- Node 표시 계약6 PASS. 실제 `DesktopErgon`+합성 native 응답 React 시험 PASS: 기록0/미확인·대기/보류/차단/unknown·오류·재mount·ABA/계정 전환·늦은 ACK·같은 scope epoch 변경·12개 폭/글자 조합. 관측 생성/소비 호출0. 최초 grid 행 겹침은 기존 overview 안으로 통합해 RED→GREEN 보완했다.
- High 읽기 전용 검토1회 C0/I0/M1. M1(동일 scope epoch 변경 뒤 loading 잠금)은 작성자가 실제 React RED→최소 보완→GREEN을 확인했다. 추가 독립 재검토는 하지 않았다. unavailable 표시 선택도 단위 RED→GREEN으로 좁혔다.
- 기존 React 회귀 첫2종 PASS 후 다른 시험과 port3011이 겹쳐 중단됐다. 제품 실패와 구분해 나머지4종을 순차 재실행했고 모두 PASS했다. 기존 결과 입력·종료/전환·ACK 유실·CHRONOS 저장·재화 cache·공개 잠금 보호6종을 확인했다. 무관한 test server나 실행 중인 IRIS/게임을 종료하지 않았다.
- 첫 전체719/716 PASS/FAIL0/기존3 SKIP 뒤 unavailable 표시 선택을 좁히고, 최종 전체 **720/717 PASS/FAIL0/기존3 SKIP**를 확인했다. C native14/API2·B 관측·N044·기존 원장/저장 회귀를 포함한다. 이후 보류 목표 조회 제약을 맞춘 마지막 UI 가드는 실제 작업대 React RED→GREEN으로 별도 확인했다. native/B/C 저장·parser·bridge 소스는 C 전송 커밋과 동일하다.
- 마지막 UI 가드 반영 후 실제 React·타입·관련 lint·격리 웹 build 모두 PASS다. 원본 로그는 ignored 경로에만 보존하고 Git/채팅에 원문을 싣지 않는다. 최종 D-0 source8파일과 인계5파일을 별도 ignored 소스 사본에 보존한다. 원장/암호문/로그는 소스 사본에 넣지 않는다.

## 다음 실제 관측 검증 조건

1. 공개 잠금 없이 개발 범위에서 어떤 기존 native 목표와 C 기록을 볼지 먼저 정한다. 현재는 목재100 계약 한정이다.
2. 별도 승인 후에만 B 읽기 전용 조회/observe의 정확한 횟수와 기존 승인 예산·game lease/캐릭터 귀속을 확인한다. D-0 화면을 열었다는 이유로 조회·소비를 실행하지 않는다.
3. 안정적 workId/정원/실수령 귀속/실비용 증거가 없으면 blocked를 유지한다. 실제 가공 결과 확인·자동 생산 엔진/UI 공개는 후속 별도 범위다.

개인12·ACK 원본·로그/원장/암호문·기존 격리 사본 보존. 실제 CLI/게임/사용자 원장/DB/신규 Supabase·Vercel 호출/main/Production/IRIS 업데이트/공개 잠금 해제0. **D-0 commit/push0.**
