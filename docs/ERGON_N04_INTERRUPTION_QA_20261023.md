# ERGON N04 중단·복구 안전 검증 — 2026-10-23 KST

## 이번에 완료한 것 / 아직 안 되는 것 / 다음 작업

- 완료: N04 격리 합성 검증 PASS. 실제 native Begin 직후 소유한 시험 자식만 중단하고 새 프로세스로 보호 상태·이력 보존·재전송0을 확인했다. 최종 전체 Node640 PASS/기존3 SKIP/FAIL0이다. 제품 코드는 수정하지 않았다.
- 아직 안 됨: 실제 설치본/실게임·전원 장애 전 지점·3차 UI 검증이 아니다. 공개 ERGON 비활성 유지. Q13 정정 초안 UI와 0개·초과 산출·정정의 native 명시 확인 계약은 여전히 미구현이다.
- 다음 작업: 결과 검토와 별도 승인 후 native 결과 확인 계약을 설계/구현할 수 있다. 이번에는 추가 기능·commit·push 없이 보존하고 멈춘다.

## 기준과 변경 범위

기준 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`, SHA `9ef6a66196948ca5a258a4e8e895c562e9f1a3f3`. 기존 관리 worktree를 재사용했다. 제품 코드·컴파일 목록·실행 경로·원장 형식/정리 정책은 변경하지 않았다.

- 신규 `iris/desktop-life-progress-interruption.fixture.cs`: 실제 Store/Executor/Connection/Journal을 사용하는 시험 유틸리티와 Begin 이후 정지 decorator.
- 신규 `iris/desktop-life-progress-interruption.tests.ps1`: 모드 allowlist, 격리 경로·재파싱 거절, 실제 소스의 시험 전용 컴파일.
- 신규 `tests/iris-ergon-progress-interruption.test.mjs`: 자신이 spawn한 프로세스 객체만 종료하며 새 probe/recover/reopen 자식을 실행한다.
- 수정 `iris/desktop-life-progress-host.fixture.cs`: 기존 시험 유틸리티를 같은 시험 assembly에서 재사용하도록 internal로 노출하고 가짜 명령 관측 콜백만 추가했다. 실제 앱 소스 목록에는 어떤 fixture도 추가하지 않았다.

## 중단 위치와 증거

시험 전용 decorator는 실제 `DesktopLifeProgressConnection.RecordBegin`을 호출한다. 실제 `journal.Begin`의 암호화 저장, 제작 메타데이터 기록과 native 행 재대조가 반환된 직후, `Dispatch` 전에서 멈춘다. 그때 별도 probe 프로세스가 inflight 행·game lease 독점·writer 독점·진행 파일 digest를 확인한다. 부모는 유효한 ready marker의 PID가 자신의 spawn 객체와 같은지 확인한 뒤 해당 객체만 SIGKILL한다. 프로세스명/PID 검색 종료는 없다.

새 recover 프로세스의 실제 executor 생성자가 기존 `RecoverInterrupted` 정책으로 inflight를 unknown으로 바꾼다. 그 외 필드와 기존 완료 행은 동일하다. 진행 파일 암호문은 동일하고, 별도의 reopen 프로세스에서는 이미 unknown인 원장 암호문도 그대로다. 잃어버린 native 종료를 만들어 내거나 진행 기록으로 원장을 성공 처리하지 않는다.

세 대조군은 각각 새 root/자식으로 실행한다. 표의 명령 수는 가짜 외부 명령 관측값이며 실제 게임 소비량이 아니다.

| 대조군 | 중단/종료 | 복구 후 native 상태 | 기록된 가짜 명령 | 재시작 이후 추가 명령 |
|---|---|---|---:|---:|
| normal | 정상 Run/terminal 저장 후 정상 종료 | completed | 1 | 0 |
| response-loss | 가짜 명령을 호출했지만 응답이 오지 않은 상태에서 중단 | unknown | 1 | 0 |
| after-begin | 실제 Begin 반환 뒤 Dispatch 전에 중단 | unknown | 0 | 0 |

response-loss는 명령 종료 여부를 알 수 없는 응답 유실 대조군이다. 완료가 확정된 실제 게임 응답이나 실제 네트워크 장애를 검증한 것은 아니다.

## 보호·이력 검증

- 이전 목표의 사용자 확인3→정정2, 두 확인 이벤트와 정정 연결·사유·남은 수량을 그대로 유지한다. 이 사전 이력은 기존 Store의 승인된 도메인으로 시험 데이터만 생성한 것이며 새 사용자 정정 API가 아니다.
- 새 요청의 수량은 null, 예상량을0/확정량으로 승격하지 않는다. unknown에는 terminal 증거를 발급하지 않는다.
- 재시작 후 같은 nonce Confirm은 거절된다. unknown 상태의 수량 확인과 새 native Begin도 거절되며 진행 파일·unknown 원장 바이트는 변하지 않는다.
- 중단 전 lease/writer의 독점, 프로세스 종료 후 OS 자원 회수와 재취득을 확인한다. 승인·nonce·writer·lease를 시험용 성공 API로 우회하지 않는다.
- `ErgonAvailable=false`, `executionConnected=false` 및 기존 공개 파일 유지. 실제 CLI/게임/사용자 원장/운영 DB/서버 호출0, 사용자 프로세스 종료0, main/배포/공개 업데이트0.

## 초기 시험 실패와 범위 한계

첫 시험에서 normal/response-loss 후 after-begin의 `paused binding ACK`가 실패했다. 사전 이력 생성에 사용한 연결 객체의 consumed nonce 상태를 decorator에 재사용한 시험 구성 문제였다. 사전 이력 생성 후 새 actor/session으로 분리하자 관련 시험이 PASS했다. 제품 수정의 RED→GREEN으로 표현하지 않는다. 원본 오류 로그는 ignored 경로에 보존한다.

기존 S01 간헐 실패와 최초 수령 회귀 실패의 원인은 여전히 미확정이다. 이번 N04 통과는 두 문제의 해결 근거가 아니다. 실제 저장장치 손상/정전 전 지점·악의적 로컬 파일 교체·실제 UI/게임·전체61개 검증 완료를 주장하지 않는다.

## 최종 검토·회귀

- 독립 High 검토1회: C0/I0/M1. 정상 종료 직후 부모가 늦게 실행될 때 유효 marker도 거절하는 오탐 가능성1건을 발견했다. 검증 증거의 안정성에 영향을 주므로 Important로 상향해 단일 보완 묶음에 포함했고, 종료한 자식의 실제 marker 읽기 시험을 RED→GREEN으로 확인했다. 재검토는 추가하지 않았다. 보류 Minor는 없다.
- 첫 전체 회귀에서 marker를 쓰는 FileShare.None 구간에 부모가 읽어 EBUSY가 발생했다. 이는 시험의 동기화 오류이며 제품 결함이 아니다. ENOENT/부분 JSON과 함께 EBUSY도 기한 내 대기하도록 같은 보완 묶음에서 수정했다. 실패 로그를 보존했고, 최종 녹색 결과를 얻기 위한 전체 재실행1회가 추가되었다. 무제한 재시도는 없었다.
- 최종 `node --test tests/*.test.mjs`: **643개 중640 PASS/기존3 SKIP/FAIL0**, 종료 코드0. 기존641에 신규2시험이 추가된 수치다. A22/B-1 20/H22/R5는 Node 내부에서 실행되므로 총643에 다시 더하지 않는다.
- 기존 저장34 PASS, native8(progress/executor/quantity/actions-bridge/journal/collection/currency-store/desktop-store) PASS, TypeScript·기존 scoped lint 및 신규 Node 시험 lint 종료 코드0.
- 마지막 전체 실행 증거: normal writer21036→recover15748/completed/가짜명령1, response-loss writer16540→recover21732/unknown/1, after-begin writer18960→recover9024/unknown/0. 각 모드의 추가 명령0, 기존 확인량2/정정 포함2이벤트/새 수량null을 확인했다. reopen도 별도 자식으로 실행했다. PID는 시험 증거이며 현재 프로세스를 찾거나 종료하는 데 사용하지 않는다.
- 실제 제품/원장 소스·공개 파일의 기준 HEAD 대비 변경0, 기존 ACK 해시 동일, index 비어 있음, HEAD9ef6a661 유지. 사무실 원본 개인 자료는 수정하지 않았다. 합성 자료/원본 로그는 ignored 경로에 보존하고 전송하지 않는다.
- 5시간 사용량 잔여15%에 도달해 새 구현을 중단했다. 실행 중이던 회귀의 결과 수집과 이 기록만 마무리했다. commit·push0, 다음 수량 확인 계약·UI·자동 생산 개발0.

## 판단 및 검토 제외 범위

1. 승인된 N04 계약의 특성 시험으로 한정하고 새 제품 hook을 만들지 않았다. 기존 동작의 첫 PASS를 제품 결함 수정의 RED→GREEN으로 주장하지 않는다. 비용: 실제 앱·설치본·게임/UI 통합 안전성은 추가 검증이 필요하다.
2. 중단 지점은 실제 RecordBegin 반환 후/Dispatch 전이다. Begin 내부 파일 교체 도중 전원 손실·OS/저장장치 장애 전체는 검증하지 않았다. 비용: 이 부분을 N04 한 시험으로 포괄한다고 주장할 수 없다.
3. 검토자는 실제 앱·설치본·UI·게임 소비, Begin 내부 전원 손실/OS 장애, 전체 B-2 활성화/공개 gate 해제, 최종 전체 회귀 통과 판정을 유보했다. 앞의 세 범위는 승인 경계대로 제외하고 fail-closed를 유지한다. 최종 회귀는 검토자가 아니라 순월이 직접 실행해 위 결과로 확정했다. N04가 PASS여도 공개 활성화 준비나 전체 자동 생산 완료를 의미하지 않는다.
