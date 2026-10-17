# IRIS Floating Hub — 로컬 후보 QA (2026-10-17)

영겁. 운영 배포·push·공개ZIP·버전 변경·게임 명령·운영 DB 변경 없음. 사용자 개인 dirty 보존.

## 구현

- 독립 일반창 bounds/플로팅 anchor, 화면 경계/DPI 어댑터, 표시 요소만 native Region에 포함.
- 원형 기존 IRIS 마크·반원형 기능 메뉴·펼침/reduced-motion, 기본 Alt+백틱 실제 키와 `(Alt + ~)` 아래 키캡.
- 설정: 로고36~80 DIP/기본52, 불투명도35~100%/기본80, 조합/키 변경·기본값 복원. 새 키 등록 실패 시 이전 키 보존, 손상 파일 덮기 금지.
- 버전/epoch/environment/revision 검증. 늦은 열기 응답으로 닫힌 창을 다시 열지 않음. 기존 모듈은 복제/재마운트하지 않음.
- 일반 정보는 실제 표시부터10초/진행 바/비차단. 캐릭터 후보는 명시 확인·신선도 재검증 유지, 자동 만료 없음. 접기 후 다시 열기.
- 심층 목록에 지명·개수·제보자·시각, 새 제보 한 번만 안내. 초기 조회/재접속은 목록 baseline, 삭제/주기 만료는 대기 알림도 회수.

## 확인 결과

- 기준 Node565/562PASS/기존3skip. 최신 전체 Node574/571PASS/기존3skip/0fail.
- native 순수 정책: 독립 bounds,96/144/192DPI·음수/모니터 제거·사방 모서리·버튼 비중첩·손상 원본·가짜 키 registry PASS.
- native chrome24(일반30%=alpha76/플로팅80%=alpha204 독립성 포함), startup-close, 실제 격리 WebView의 세션/HttpOnly/출처 차단 PASS. 실제 사용자 창/게임 화면 검증과는 다름.
- 실제 React: 로고/키캡/메뉴/설정·드래그·Escape PASS. real hook+Hub+Center의 지연 응답/편집 값/마운트 수 보존 PASS.
- 가짜 시계:10초/게이지/비차단/캐릭터60초 무만료·접기/다시 열기 PASS.
- 가짜 Supabase: 첫 snapshot 목록만, 신규 알림1회/소리1회, 재접속 재생0, DELETE 목록·알림 삭제, 읽기 최대4회 PASS. 실제 운영 제보 전송0.
- 기존 에르곤 이동 중 편집/숨겨진 종료 관측/고정 접수ID·수량·진척/추가 요청0 PASS.
- 기존 콘텐츠 카드/소리 OFF/제보 중복 제출 보호, 파티 참가·버스 편집·초안 보존·Realtime/4폭·3글자 크기 PASS.
- TypeScript 독립 검사 PASS. 신규/연계 파일 scoped lint PASS(아래 기존 Synaxis 오류 별도).
- 비밀 설정 없는 격리 Next webpack build PASS, private native EXE/ZIP compile PASS. 최신 변경 후 최종 재검증 대기.

## 남은 실패·실검증

- `DesktopSynaxisSurface.tsx`의 기존 effect setState2건/불필요 dependency1건은 변경 전 git 소스로도 같은 ESLint 결과. 이번 작업의 새 lint 오류와 구분한다. 루트 lint는 이전 생성물 대량 오류 이력 때문에 실행하지 않고 변경 파일을 명시 검사한다.
- `iris-character-switch.browser.mjs`:22개 시나리오 PASS 뒤 `manual-intent-cancels-pending-yes` 실패. legacy native(새 floating 미지원) 경로에서 확인 중인 modal backdrop이 배경 캐릭터 선택 클릭을 차단한다. 테스트를 삭제하거나 보호를 풀지 않았다. 신규 비차단 캐릭터 렌더 경로와 구분해서 보고한다.
- 기존 `iris-desktop-ui.browser.mjs`의 제목 뒤 클릭 locator 문제는 실제 backdrop pointer 대조가 남았다.
- 사용자 앱의 실제 Alt 키·투명도·Win32 Region 바깥 게임 클릭·다중 모니터/DPI/전체화면 반복은 정상 재시작 및 눈 검증 전이다. 합성 시험 성공을 실제 검증으로 바꾸어 적지 않는다.
- 과거 금속 unknown 기록, 실제 수령 비용, 이동 중 사용자 편집 실시험의 미확인은 그대로다.

## 알림 분류

| 경로 | 처리 |
| --- | --- |
| 필드보스·결계·어비스·심층 정보 | 공통10초·게이지·중복/만료 방어 |
| 시낙시스 일시 안내 | 공통10초, 구 단독 fixture도10초 |
| 캐릭터 후보 확인 | 무기한 선택, 기존 재조회/계정/문맥 검증 유지 |
| 실행 동의·종료·저장 손실·원클릭 허용 해제 | 선택 필수, 자동 승인/만료 없음 |
| 조회 오류·unknown·저장 내구성·불명 결과 | 작업 상태/보호 안내로 유지, 알림 만료와 독립 |
| 스탯 결과·허용 해제 결과·업데이트 진행 | 해당 화면의 작업 결과 상태, popup 알림 아님 |

알림이 오래 대기해 의미를 잃으면 표시하지 않는다. 대기 유효기간과 이미 나타난10초 deadline은 분리하며, 삭제/주기 초기화는 명시 회수한다. 캐릭터 후보가 선택 필수 창을 가리지 않으며 큰 확인 대화가 필요하면 일반 작업창으로 복귀한다.
