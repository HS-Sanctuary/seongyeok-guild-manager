# ERGON 이동 중 내부 편집 QA — 2026-10-17 영겁

## 범위

한설 승인: 게임 이동 중 IRIS 전체를 잠그지 않고 일반 메뉴/설정·다음 계획 편집은 허용한다. 계정·캐릭터 변경, 추가 게임 실행/수령, 충돌하는 native 조회는 차단한다. 이미 접수한 대상·수량·요청ID는 내부 편집과 독립적으로 종료까지 관측한다. native 정책 완화/게임 재전송/원장 조작/DB 변경/배포 없음.

## 재현과 보완

- 실제 desktop page/controller/native bridge에 가짜 API/게임 IO만 연결해 수령 중 상위 메뉴 잠금 RED를 확인했다. 내부 편집과 gameBusy/identityLocked를 분리한 뒤 GREEN.
- 독립 검토 I2: 스탯 탭 자동 조회가 locked와 별개로 실행됨, 확인 응답 running과 이미 대기 중인 idle 상태 조회 경합이 접수 잠금을 조기 해제함. 각각 실제 React/페이지 RED→GREEN. Stats readPaused, Execution의 접수ID latch/같은ID 종료 후 해제/숨김 관측을 보완했다. 재검토 C0/I0/M0.
- 목록 수량/선택/교체·재료/기록·크로노스/스탯/재화/설정 왕복 후 원래 collection 1회만 유지, 같은 시설/캐릭터로 종료 관측, 실행 중 추가 native life/currency/stats 조회0.
- 제작 중 다른 계획 선택·수량 편집과 숨김 종료, 원래20개 목표에 확인5개/남은15개 반영, 원래 목표를30개로 바꾸면 과거5개를 새 목표에 적용하지 않음. 늦은 idle 응답 전후에도 busy 유지, 추가 prepare/confirm0.

## 검증 결과

- `node --test tests/*.test.mjs`: 565건, 562PASS, 3기존skip, 실패0.
- `npx tsc --noEmit`: exit0. 수정 TSX/신규 브라우저 테스트를 명시한 ESLint: exit0, 경고0.
- actual React: collection/workspace/list/catalog/quantity/craft-goal/actions/read-planning 및 신규 navigation/edit-during-action PASS. 모두 synthetic IO이며 실제 게임 실행과 구분한다.
- 루트 `npm run lint`는 실패했다. `.superpowers`의 과거 생성빌드와 기존 scripts/tests도 포함해 82983문제(16240error/66743warning)를 보고했다. 생성물/기존 테스트를 이 작업에서 정리하거나 lint 설정을 느슨하게 하지 않았다. 전체lint PASS로 표시하지 않는다.
- 추가 전체 `iris-desktop-ui.browser.mjs`는 실패: line50의 제목 locator 클릭을 열린 focus-dialog backdrop이 가로막아 outside-dismiss 시험이 실행되지 못했다. 관련 FocusDialog/CharacterPicker는 이번 수정 대상이 아니다. 이 기존 시험의 방식과 현재 모달 동작 대조는 미완료로 기록한다. ERGON 새 실제 페이지 시험의 계정/캐릭터 잠금과 메뉴 왕복 결과를 전체 desktop 회귀 성공으로 확대하지 않는다.

## 실제 앱/수령 상태와 다음 단계

- 후속 실검증: 한설이 캐릭터를 **한떨(빙결술사)**로 바꾼 뒤 직접 가죽 수령 성공을 보고했다. 첨부5장으로 가죽 상급1건+일반3건의 이동·게임 보상 화면·IRIS ‘수령 완료 / 최근 작업 상급 가죽 완료 확인’ 및 가공 완료8→4를 확인했다. 날개 표시는 전후77,427이나 연속 원본 측정이 아니므로 수령 비용0 확정으로 승격하지 않는다. 앞선 탄월 기준 승인을 그대로 한떨의 에이전트 게임 실행 권한으로 사용하지 않았으며 에이전트 실제 게임 요청0.
- 이어 한설이 ‘목재도 다 완료받았어’라고 확인했다. 목재 상급1건+일반3건의 실제 수령 완료는 사용자 확인, 마지막 첨부는 목재 이동 중이므로 목재의 앱 최종 판정/최종 완료0은 사진으로 별도 확인하지 않았다. 추가 게임 행동은 하지 않는다. 이동 중 IRIS 메뉴 전환·계획 편집의 실제 사용자 확인과 과거 금속 false unknown 원인은 여전히 별개다. 아래 재시작/실수령 대기 문구는 해당 시점 경과다.

- 한설은 금속 수령 완료·완료 수 감소를 직접 확인했다. 앱의 철괴(광석) unknown 뒤 가죽이 이전 종료 미확인으로 차단됐다.
- 기존 판정은 작업명과 보상명 exact-match를 요구한다. 합성에서 작업명 철괴(광석)/보상명 철괴는 unknown이지만, 실제 응답/실패 단계가 저장돼 있지 않아 이번 금속의 단일 원인으로 확정하지 않는다. 타임아웃/후속조회 실패 가능성도 남는다.
- 같은 세션 unknown은 자동 분리하지 않는 기존 정책을 보존했다. 이전 세션 unknown도 12분·실행/CLI 부재·두 번의 안전 상태 및 같은 게임프로세스/문서/문맥/원본 해시 증거가 필요하다. 사용자 확인을 성공 주입·무조건 해제 근거로 쓰지 않는다.
- 한설 정상 X 종료 후 Development8388 한 번 재실행. 페이지200·응답true·stdout/stderr0바이트. 새 UI 실제 확인·가죽 실제수령 검증은 별도다. 금속 재전송 금지, 다음 게임 행동은 직전 승인→1회→결과 확인.
- 공개main/버전/ZIP/공지/운영DB/push0. 사용자 개인dirty/삭제/새파일은 보존했다. 15% 중단 해제는 최신 지시대로 유지한다.
