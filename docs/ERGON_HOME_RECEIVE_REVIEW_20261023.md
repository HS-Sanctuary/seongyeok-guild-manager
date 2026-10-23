# ERGON 집 수신·ACK·검토 — 2026-10-23 KST

## 기준과 승인 범위

- 검토자: 영겁. 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`.
- 수신 HEAD: `e9575ec5c6432156d6b8a033cd50217b24da7d47`. 이전 집 인계 `b3e243cc4b08356a9096abdb062e837dd1d1238c`에서 기존 관리 worktree에 fast-forward 수신, 충돌 0.
- 운영 main은 `b0b63c7a5786380f4e36c67651d8596640f35db7` 그대로다. 이번은 수신·ACK·오프라인 합성 검토·다음 최소 범위 제안만 승인됐다. 제품 코드 수정/commit/push/실제 게임/기존 사용자 원장/DB/main/배포 변경은 하지 않았다.
- 집 원본 checkout은 기존 개인 변경 12항목·삭제 상태를 그대로 두었다. 검토는 별도 작업공간에서 수행하고 개인 파일 지문은 로컬 세션에서만 대조한다. 사무실 원본 개인16항목 보존은 순월의 보고이며 집에서 그 PC의 현재 파일까지 검사한 것은 아니다.

## 실제 전송과 미완료의 구분

| 커밋 | 실제 원격 내용 | 아직 아닌 것 |
|---|---|---|
| `9ef6a66` | B-2 executor/진행 저장/native journal 비활성 연결·보호·시험 | 공개 실행 활성화/전체 자동 생산 |
| `d92d8ba` | N04 소유 자식 중단복구 시험, native 0/초과/정정 승인 V01–V12 | 실제 native 창/실게임·설치본 검증 |
| `e9575ec` | 독립 결과 패널/hook, typed 수량/lifecycle 요청·ACK, React 합성 시험 | DesktopErgon/page mount·실제 종료/전환/계획 삭제 연결 |

따라서 3차 첫 결과 UI가 사무실 로컬에만 남은 상태는 아니다. 원격 소스에 포함되어 집에서도 확인했다. 추가 미전송 UI 작업이 사무실 로컬에 남았는지는 이 PC에서 확인할 수 없으며, 승인이나 계획만으로 그런 구현이 존재한다고 추정하지 않는다.

[순월 UI QA](ERGON_PHASE3_FIRST_UI_QA_20261023.md)의 I03/L10/L11/L12는 격리 범위, I08/L06–L09/Q13은 부분, L01–L05는 미실행이라는 구분이 코드와 일치한다. 실제 page는 새 패널/hook을 import/mount하지 않는다. 기존 Task4 체크리스트를 이미 전부 끝낸 것으로 취급하지 않는다.

## 집에서 새로 실행한 검증

- 전체 Node: **645건 / 642 PASS / 기존 3 SKIP / 0 FAIL**, exit 0. 순월 최종 수치와 같다. 전체 시험에 포함된 하위 H22/R5/V12 등을 다시 더하지 않는다.
- 별도 집중 Node 4파일/7시험 PASS: strict client ACK, H22·R5, native 수량 V01–V12, N04 marker 및 중단·복구.
- N04: normal은 completed/가짜 명령1, response-loss는 unknown/1, after-begin은 unknown/0. 재시작 이후 추가 명령0, 기존 사용자 확인3→정정2/이벤트2개/새 수량null 유지. 시험이 직접 spawn한 합성 자식 객체만 중단했다.
- 실제 React + 합성 API 3스크립트 PASS: 빈칸/0, 정정3→2, 실패 초안, 동일operation ACK 유실 재전달, 보류remount, locked 초안, 다른 캐릭터 늦은 ACK, capability 소실 후 초안 유지. 320/390/768/1280×18/20/22 총12조건 가로 넘침 검사 PASS. 공개 ERGON 잠금 React 회귀도 PASS.
- 별도 TypeScript와 이번 UI/client 4파일 scoped ESLint PASS. 전체 lint/설치본/실제 native 창/실게임 검증으로 확대하지 않는다. 새 빌드는 수행하지 않았고 순월의 격리 build PASS는 이전 보고로 구분한다.
- native 수량 QA의 5개 검증 소스는 수신 내용과 일치한다. 집 Git 줄끝 변환으로 raw SHA256이 4개 달랐으나 LF 정규화 시 기록값과 일치했고 webview는 CRLF 원본 해시가 일치했다. d92d8ba→e9575ec의 native 소스 차이도0이다. 이 줄끝 차이를 제품 변경/자료 손상으로 판정하지 않는다.

### 기존 실패 이력은 유지

순월 보고의 N04 normal ready marker 전 `native-result-review-required` 1회 실패, S01 간헐 실패, 최초 수령 회귀 실패는 원인 미확정이다. 집의 이번 통과가 그 원인을 해결했다는 증거는 아니다. 실패를 없애려고 재시도·보호 완화·원장 수정은 하지 않았다.

## 추가 발견 — 실제 연결 전 해결할 Important 2건

### N-R1. 일반 양수 저장 직전 문맥 재검사가 빠짐

위치: `iris/desktop-life-progress-connection.cs:57`, `:61`, `:62`.

최초 `QuantityContext` 뒤 `Inspect/Audit`는 파일 I/O를 수행한다. 일반 양수와 already-applied 분기는 그 이후 문맥을 재검사하지 않고 `QuantityCommit`한다. 반면 native 특별 승인 후 분기에는 `:70`의 최종 재검사가 있다. `AcquireWriterAsync`는 worker로 이어지고, coordinating 중 `SetContext`/document epoch 변화는 가능한 경계다.

High 독립 읽기 검토 C0/I1/M0에서 이 경계를 지적했고, 영겁이 기존 실제 Store/Connection/Executor와 가짜 실행기·별도 생성한 암호화 파일로 재현했다. 일반 양수3의 `Inspect` 읽기 직후 (a) 캐릭터, (b) epoch를 각각 변경해도 두 경우 모두 committed/확인량3이 저장되었다. 실제 사용자 자료·게임·원장 접근0. 이미 저장된 요청 분기는 같은 정적 누락이 있으나 별도 동적 재현은 하지 않았다.

기존 V12는 0개 승인 이후 분기를 검사하므로 일반 양수 분기의 재현과 모순되지 않는다. 최소 후속은 **모든 commit/중복 반환 직전 payload·계정·캐릭터·epoch 재검사**와 일반 양수/이미 적용된 operation의 Inspect·Audit 도중 변경 회귀다. native unknown/기존 원장/출처를 바꾸는 해결책은 금지한다. 실제 제품 수정은 이번에 하지 않았다.

### U-R1. 보류 ACK 유실 후 정상 재조회해도 lifecycle pending이 남음

위치: `components/iris/DesktopErgonResultConfirmation.tsx:60`–`:63`.

실제 패널과 합성 API로 ‘보류 저장은 성공 → ACK만 유실 → 진행 기록 새로고침 → 건강한 paused 기록 수신’을 재현했다. `pending`은 saved/rejected 반환 때만 해제되어 건강한 조회 후에도 남는다. 보류 버튼은 이미 paused라 비활성이고 ‘그만하기’도 다른 pending 유형 때문에 비활성이다. 패널 remount 후에는 정상 사용 가능하다. 이때 부모 onDirtyChange는 false여서 lifecycle 응답 미확인 상태를 포괄하지 않는다.

수량 확인의 ‘저장 상태 확인’과 달리 lifecycle에는 pending을 정리하는 조회 대조가 없다. 최소 후속은 operation에 대한 권위 있는 재조회·동일 operation 재전달 후 pending 정리와 종료 보호에 응답 미확인 상태를 연결하는 회귀다. 단순히 pending을 임의로 지우거나 조회 없이 성공 처리하면 안 된다. 소비/삭제/보호 원장 변경은 없었고 제품 코드는 수정하지 않았다.

## 다음 최소 작업 제안 — 아직 구현 승인 아님

1. N-R1 native 문맥 경계와 U-R1 lifecycle ACK 유실 복구를 먼저 고장 주입 회귀로 보완한다. 정상/거절/unknown·중복/늦은응답·다른캐릭터·같은캐릭터 A→B→A를 구분한다.
2. 기존 page의 `requestClose`, `beforeunload`, `onBeforeApply`, `changeContext`에 새 결과 초안/저장 중/응답 미확인 상태를 함께 대조한다. 별도 종료 관리자나 localStorage 진척 fallback을 만들지 않는다. 실제 mount 전에 종료·메뉴·계정·캐릭터 전환과 기존 숙제 자동저장 보호를 합성 검증한다.
3. 다음 작은 단위로 기존 DesktopErgonExecution의 native 목표 생성/준비 바인딩·복원과 CraftGoal/Queue의 표시 권위를 연결한다. native 확인량을 사용하되 메모리 예상량을 확정량으로 승격하지 않는다. 계획 삭제 L01–L05는 별도 최소 단위로 native 취소 ACK→로컬 계획 삭제 순서와 실패 복구를 검증한다.

N04/V12/native 저장/typed parser/첫 결과 패널을 다시 만들지 않는다. 자동 생산 루프·계속하기 소비·공식 rewards 파서·모바일 원격·무료 서비스 추가는 이번 후속 최소 범위에서 제외한다. 전체61/Task4 완료나 공개 활성화 준비로 보고하지 않는다.

## 보존 상태와 인계

`ErgonAvailable=false`, `executionConnected=false`, 웹 `IRIS_ERGON_AVAILABLE=false` 유지. main/IRIS0.4.2 운영 파일·기존 journal 소스·개인 파일은 변경하지 않았다. 기능브랜치의 공개 ZIP/metadata는 여전히0.4.1이므로 그대로 운영 배포하지 않는다.

이번 로컬 문서 변경은 본 보고서와 수신 ACK/발신 검토 누적만이다. 추가 합성 진단 소스·출력·암호화 fixture 자료는 ignored `.superpowers`에만 보존한다. 최초 추가 native 진단의 PowerShell 런타임 참조 오류는 제품 실패가 아니며 기존 시험과 같은 Windows PowerShell 실행으로 재현을 확인했다. 공식 제품/시험 코드는 바꾸지 않았다. commit/push는 별도 승인 전 하지 않는다.
