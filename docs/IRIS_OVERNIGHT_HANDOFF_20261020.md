# 2026-10-20 영겁 → 순월: 어비스·저장줄·ERGON·설치 글꼴

## 먼저 읽을 상태

- 작업 브랜치: `codex/home-gnosis-iris-integration-20261019`. 기준 `06e1eca`. 최종 전송 SHA와 검증 결과는 아래 마감 항목 및 TO_SOONWOL 최신 누적을 따른다.
- 한설이 수면 중 자율 로컬 개선·검증·인계 push를 승인했고 주간 잔여3%에서 새 작업을 멈추고 마감하도록 요청했다. 15% 기준은 해제됐으며 이번3% 기준이 우선한다.
- 이번 소스는 **v2.322 후속 후보**, 운영 웹v2.321/IRIS0.4.1과 공개 ZIP·다운로드 버전은 유지한다. main 승격·새 설치 파일 배포는 이 인계에 포함하지 않는다. 승인받은 어비스 운영 자료5행만 이미 반영했다.
- ERGON 앱/플로팅/native 공개 잠금은 그대로다. 실게임 소비·수령·이동0, 과거 unknown/계획/즐겨찾기 원본을 보존했다. 로컬 UI는 실제 컴포넌트+합성 IO 시험으로 확인한다. `NODE_ENV`로 gate를 풀지 않는다.

## 반영한 범위

1. **플로팅 저장줄**: `DesktopCenter` sticky header의 캐릭터 선택 위에 한 줄. pending 수·카운트다운/지금 저장/버리기, 완료 즉시 숨김. 복구 대상은 접힌 확인 영역. 정상 사이드 바 네 모서리 설정 유지. 다른 캐릭터 unknown 때문에 현재 pending 저장을 막지 않도록 적용 scope 분리. controller/15초/서버 저장은 변경하지 않았다.
2. **ERGON 동선**: 비어 있으면 품목·수량 선택을 자동 노출. ‘작업 선택’ 후 기존 저장 목록과 선택 작업의 재료·실행 준비 연결. 사용자가 직접 펼친 목록은 선택 후에도 유지한다. 소화면은 품목/목록/선택 작업 순서, 큰 화면은 기존 다열 작업대 유지. 중복 제목 제거, 즐겨찾기/교체/수량/제거/계정 분리는 보존했다.
3. **(?) 안내**: `DesktopContextHelp`는 모달을 새로 만들지 않고 본문에서 펼친다. 바깥 pointer/Escape로 닫으며 Escape는 상위 플로팅 창까지 전달하지 않는다. 실제 부족·미확정·실행 확인·비용 경고는 감추지 않는다. 품목 선택/작업 목록/생활 작업대/제작 수량의 상시 설명만 옮겼다.
4. **가공 상태·산출**: 목록에서 시설 가득 참/재료 부족/잠긴 재료/원격 비용 부족 등을 구분, 작업당 산출량 표시. 가죽+ 추가100 목표는 산출3 기준 예상34건/날개170/산출102(+2)를 보여준다. 이는 계획이며 **34건 자동 등록을 구현한 것이 아니다**. 등록은 생산 완료가 아니고, 수령·시설 회전·실총비용 계약이 남았다.
5. **설치 글꼴**: 기존 native InstalledFontCollection/bridge를 재사용, 폰트 파일은 읽거나 전송하지 않는다. 검색하지 않고 전체 가족 목록을 펼쳐 스크롤/방향키·Home/End/Enter로 선택. 선택 미리보기·개수·초기화·새로고침·선택적 검색. 검색창 Home/End는 커서 이동 유지. 목록 Escape만 소비하고 닫힌 뒤 Escape는 상위로 전달. 이 PC 실제 읽기449가족/현재 필터 제외0; 실제 앱 설치본 UI 확인은 미완료다.

## 어비스 운영 자료: 승인·실행·복구

- 한설이 직전5행 추가 제안에 ‘응’으로 승인. 2026-10-20 01:04 KST 실행 완료. 재실행 가능한 자료 SQL `supabase/sql/20261020_abyss_difficulty_catalog.sql`, DDL/RLS/권한 변경0.
- 원인: 허상에만 매우 어려움2·지옥4, 광기·물길에 누락/광기지옥3 누락. 통합의 교집합 검증을 완화하지 않고 부족한 기준만 허상과 같은 값으로 추가했다.
- 새 행:33 물길지옥4,34 광기매우어려움2,35 광기지옥3,36 광기지옥4,37 물길매우어려움2. 전체31→36, 기존31행 전체 JSON md5 `279d12e8cbc98a216a1ee1e4167d2cb3` 유지. 기존 광기어려움(id13) 등 사용자 기준은 임의 보정하지 않았다.
- 신규매어2 CP82500/87000/100000·MR2500/3000, 지옥4 CP110000/116000/133500·MR8500/9000, 광기지옥3 CP102500/108000/124000·MR7200/7800, 모두 정원4.
- 다시 적용하면 기존 동일 값을 유지, 다른 값이면 중단한다. 복구는 **별도 승인 뒤** 위 새ID와 정확 기준값이 모두 일치한 행만 삭제한다. 기존 행/파티/숙제는 삭제하지 않는다.
- 코드에서 DB 등록값만 사용하고 매어2→지옥1~4 순서로 정렬, 기존 공백 표기 호환/신규 배지 보완. 일반/버스생성·버스수정·IRIS server 생성검증이 같은 catalog를 사용한다. 관리자 난이도명은 원래 자유 입력이다. 실제 로그인 운영 UI 클릭 검증은 내일 `/party`와 홈 시낙시스에서 새로고침해 확인할 것. 실서버 파티 생성은 하지 않았다.

## 검증 및 참조

- 전체 Node와 실제 React 브라우저/독립 타입·격리 build 최종 결과는 마감 항목에 적는다. 합성 테스트를 실게임 성공으로 안내하지 않는다.
- 설치 폰트 native cache/필터/refresh/source/payload/concurrency/revocation fixture PASS. 본체 native 실행 또는 사용자 IRIS 재시작0.
- 좁은 독립 검토 C0/I0/M1: 검색창 Home/End 가로챔 발견→RED→GREEN 보완. 추가로 font Escape 상위 창 동반 닫힘도 RED→GREEN. 포트3011은 브라우저 fixture들이 공유하므로 병렬 실행하지 않는다.
- UI 참조: [Fluent 정보 도움말](https://fluent2.microsoft.design/components/web/react/core/popover/usage), [Tooltip 안내](https://fluent2.microsoft.design/components/web/react/core/tooltip/usage). 문맥 정보는 (?)로 제공하되 중요한 상태/위험을 tooltip에 숨기지 않았다. [Windows 글꼴 가족 열거](https://learn.microsoft.com/en-us/dotnet/api/system.drawing.text.installedfontcollection)는 기존 구현 확인에 참고, 새 라이브러리 추가0.
- `node tests/iris-ergon-quick-work.browser.mjs`, `node tests/iris-font-browse.browser.mjs`, `node tests/iris-floating-save-strip.browser.mjs`로 합성 UI 재현. 그 외 browser mjs는 Playwright package 경로 인자가 필요한 경우가 있다. 집 경로를 순월 PC에 맞게 바꾼다.
- 남은 우선순위: 실제 native 가공 수량 계약/시설 회전·수령·예산/등록 진척과 생산 완료 분리→한 번씩 승인된 실시험. 전체 BOM/창고 전송기·부스러기·게임 주간 확인 조건을 추정으로 생략하지 말 것. 과거 라이트 크로스보우S unknown을 성공 처리하지 말 것.

## 보존·전송 원칙

개인 `docs/UPDATE_POST_v2.151.md`, 기존 루트3삭제, 개인 `tests/kronos-theme-preview.mjs`, 실행 명령어는 push에서 제외하고 그대로 남긴다. 기존7문서7,115줄/순월40제품의 보존 검사를 마감에 재실행한다. `.superpowers` 시험 산출·로컬 글꼴 이름·비밀값은 전송하지 않는다. 릴레이는 이전 미ACK 항목을 삭제하지 않고 누적한다.

## 2026-10-20 01:25 KST 마감 전 검증

- 최종 합집합16개 browser PASS: quick-work/catalog/duplicates/workbench/workspace/goal-workbench/guided-flow/polling/read-planning/start/craft-goal/list/list-progress/font-browse/save-strip/save-overlay. 각 경로를 직렬 실행했다. 추가 산출 문자열/새 (?) 버튼 순서 등 의도한 UI 변경의 시험 기대값만 갱신, 상태·상관관계·비용 보호는 유지했다.
- 최종 소스 격리 `sanctum-iris-build-FOfa8T` webpack60·독립tsc exit0. 전체608/605PASS3skip0fail·scopedlint exit0. 순월은 실제 게임 및 설치본 확인을 다음 단계로 진행한다.

- 전체 Node608/605PASS/기존3skip/0fail, scoped ESLint exit0, 정확소스 격리 webpack60/독립tsc exit0. native font fixture PASS. 개인6상태/기존문서7,115줄/순월40제품 보존 오류0.
- 브라우저 확장 중 기존 workbench fixture가 running 승인 뒤 영원히 idle/null을 반환하면서 read 재개를 기대하는 부정확한 가정을 발견했다. 현재 상관관계 보호는 idle만으로 잠금을 풀지 않는 것이 맞다. **제품 보호 코드를 바꾸지 않고** 같은 requestId·계정·캐릭터·craft metadata·정확날개 차감의 terminal completed를 돌려주도록 fixture를 보완, 목표 완료 후에는 재료 부족 계산이 아니라 목표완료 표시를 검증한다.
- 새 (?) 때문에 header의 첫 버튼이 바뀐 기존 workspace 시험도 첫 DOM 버튼 대신 aria-pressed 창확장 버튼을 찾도록 정정. 핵심 상태/비용/보호 검증은 약화하지 않았다. 최종 전체브라우저 결과·전송 SHA는 아래 후속.
