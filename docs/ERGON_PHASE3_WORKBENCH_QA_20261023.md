# ERGON 3차 작업대 결과 UI 연결 — 2026-10-23

기준 기능 HEAD `e9575ec5c6432156d6b8a033cd50217b24da7d47`. 운영 main `ca697706a874d21668091588940ceb61338d0700` 유지. 기존 N-R1/U-R1/V15 미커밋과 ACK 위에 이번 UI 연결만 추가했다. commit/push/배포 승인 없음.

## 실제 연결 범위

- `DesktopErgon`은 기존 `DesktopErgonResultConfirmation` / `useErgonProgress` / native store API를 유지 마운트한다. 환경·계정·캐릭터 scope를 분리하고 native goalId/요청 ID를 그대로 사용한다. sourcePlanId / action / displayName / targetQuantity 네 값이 현재 계획과 정확히 맞을 때만 수정한다. 다르거나 분리된 기록은 보존 기록으로 표시하며 수정하지 않는다.
- 실제 확인량은 native 읽기 모델만 표시한다. 예: `목표 4개 · 확인 3개 · 남은 1개`. 사용자 확인 출처·정정 이력·보류 표시를 유지한다. CraftGoal/Queue의 예상값이나 메모리 진척을 합산·승격하지 않는다.
- page의 requestClose / beforeunload / changeContext / 공통 차단 run에 결과 초안·저장 진행·미확인 ACK 상태를 연결했다. updater onBeforeApply 및 직접 logout도 같은 run 보호를 통과한다. CHRONOS의 대기함은 별도로 유지하며 ERGON 상태를 서버 저장 성공으로 취급하지 않는다.
- 결과 입력 중 새 계획 변경 및 기존 실행기의 신규 준비를 차단한다. 전체 fieldset을 비활성화하지 않아 기존 중지를 가로막지 않는다. 진행 저장 API가 있는 native는 이번 단계에서 결과 전용이며, 새 소비 준비는 잠근다. capability의 executionConnected=false와 공개 IRIS_ERGON_AVAILABLE=false를 유지한다.

## 재현과 보완

1. 작업대에 결과 패널 없음 → 실제 DesktopErgon fixture RED → 기존 패널 연결 GREEN.
2. page가 초안이 있어도 캐릭터 전환 호출 → 실제 page + 합성 controller/store RED → 종료·전환 보호 GREEN.
3. 결과 초안 중 계획 변경 가능 → 실제 작업대 메뉴 RED → 새 계획/실행 준비 잠금 GREEN.
4. High 독립 검토 1회: Critical 0 / Important 1. ACK 유실 뒤 active 왕복·자동 재조회로 실제 수량이 나타나면 저장 확인 버튼이 사라짐. 실제 page의 계정 패널 왕복 RED 후, pending 복구 버튼을 새 수량 입력 조건 밖으로 분리해 GREEN. pending 중 다른 정정 시작도 금지한다. 추가 독립 재검토는 하지 않았고 작성자가 회귀로 보완했다.
5. High 검토의 추가 확인 사항: 늦은 running 응답과 결과 초안이 겹쳐도 중지 가능해야 함. 전체 fieldset 차단을 제거하고 실행기의 기존 locked만 사용한다. 실제 작업대 + 합성 running/stop 응답에서 `지금 중지` 활성·합성 중지 1회·초안 유지·확인 저장 GREEN. 실제 게임 중지는 실행하지 않았다.

## 검증 결과와 한계

- 전체 Node 645건 / 642 PASS / 기존 3 SKIP / 0 FAIL. 이 안의 native N04/진행 저장/수량·보호 회귀는 합성 자료이며 실게임 성공이 아니다.
- 독립 TypeScript / 변경 범위 ESLint / git diff --check PASS. 격리 Next 빌드 PASS. 최종 마감 로그는 로컬 ignored 검증 폴더에 보존한다.
- React 11개 스크립트: 새 workbench-results / page-protection, 기존 progress / progress-lifecycle / progress-review / lifecycle-ack / save-transition / floating-save-strip / floating-save-overlay / release-lock / currency-cache PASS.
- 실제 page 핸들러 시험은 합성 controller/native API와 단순화한 주변 패널을 사용한다. 실제 DesktopErgon 시험은 별도로 수행했다. 두 시험을 실제 설치본 전체 end-to-end라고 표현하지 않는다.
- 4→확인3→남은1, 3→2 정정, 실패 초안, ACK 유실·메뉴 왕복 후 복구, 보류·동일 권위 기록 재마운트 복원, 다른 sourcePlanId 차단, 320/390/768/1280 × 글자18/20/22 가로 넘침 없음 PASS. 실제 앱 재시작은 하지 않았다. 디스크 내구성/재시작은 기존 native 합성 회귀, 화면 복원은 합성 API + React 재마운트로 각각 검증했다.
- 기존 lifecycle 시험은 새 표시 문구와 불일치해 최초 실패했다. 동작 조건을 완화하지 않고 기대 문구만 갱신한 뒤 통과했다. 최초 page fixture의 외부 모듈/호스트 메서드 누락도 실제 제품 실패와 구분한다.
- 결과 전용 신규 실행 가드를 잠시 제거하는 음성 시험은 안전 검토가 거절해 시행하지 않았다. 가드는 유지했고 정상 상태에서 신규 준비 비활성 여부를 검증했다. 우회·실제 소비 없음.
- 기존 N04/S01/최초 수령의 간헐 실패 원인은 미확정이며 이번 PASS로 해결됐다고 보고하지 않는다.

## 시나리오 판정

| 범위 | 판정 | 의미 |
| --- | --- | --- |
| I03 | 부분 | 기존 hook의 늦은 타 캐릭터 ACK 방어 및 page 미저장 전환 차단 PASS. 실제 설치본 전환은 미실행 |
| I08 / L06 | 부분 | 보류·확인량·정정 이력 재마운트와 active 왕복 PASS. 실제 앱 재시작은 미실행 |
| L07 | 부분 | 실제 page 종료·계정·캐릭터·로그아웃·업데이트·beforeunload 보호 PASS. 모든 OS 강제 종료·외부 문서 전환은 보장하지 않음 |
| L08 / L09 | 부분 | 기존 CHRONOS 저장·대기함 회귀 유지. 모든 양방향 동시 실패 조합은 미실행 |
| L10 | 부분 | 새 준비 비활성·계속하기 미노출·실제 소비 없음. 재계획/보류 해제는 미구현 |
| L11 / L12 | 연결 범위 PASS | 12개 폭/글자 합성, 공개 잠금 및 구 capability 안내 유지 |
| L01–L05 | 미완료/이번 제외 | 계획 삭제 전체·감사 분리·실행 중 취소 전체 UI는 구현하지 않음 |
| Q13 | 부분 | 실행 중 결과 입력 잠금 및 기존 stop 유지 PASS. 모든 후속 실행 정정 조합은 미실행 |

## 다음 최소 단계 / 보존

이번 결과 UI는 기존 native에 실제 존재하는 목표를 관리한다. 새 실행의 goalId/sourcePlanId 생성·바인딩과 CraftGoal/Queue의 권위 진척 통합은 아직 하지 않았다. 부족분 재계획·자동 생산·계획 삭제 전체·모바일 원격은 이번 범위 밖이다. 다음 단계는 새 실행 바인딩 계약과 기존 목표의 권위 진척 반영을 별도 승인 범위에서 검증하는 것이다.

원본 집 개인 12항목·기존 미커밋·수신 ACK·안전 원장을 보존했다. 원장/게임/CLI/DB 접근·마이그레이션·Supabase/Vercel 신규 사용·운영 ZIP/metadata 수정·main 병합·commit/push/배포 없음. 공개 사용자에게는 ERGON 준비 중 잠금이 그대로 보이며, 이번 화면은 합성 개발 검증에서만 확인했다.
