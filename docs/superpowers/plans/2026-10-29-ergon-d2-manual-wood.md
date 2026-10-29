# ERGON D-2 manual wood receipts

Goal: 목재 추가100의 사용자 직접 수령량을 기존 native 진행 감사 원장 한 곳에 저장하고 기존 작업대에 연결한다.
기준2b451846c62661bccbfa64bc8260a64ac2015378. 로컬 구현/합성만, commit/push/실게임/운영 금지.

## 계약과 검증 순서

- [x] 별도 관리 worktree 수신/ACK. 기존 개인/원장/옛 ACK 보존.
- [x] 기존 v1 판독 경계 native8, 기준 Node780/777 PASS3SKIP, 변경 전 합성 golden 고정.
- [x] 기존 audit mutation 필드를 새 가공 수동 도메인에서만 사용한다. 로컬 receipt ID는 공식 request/work/delivery ID가 아니다. persisted document/goal/attempt 필드를 추가하지 않아 legacy canonical을 바꾸지 않는다.
- [x] 새 native ManualWood projection은 수동 이벤트에서만 합산한다. 기존 C synthetic-confirmed와 합산/이중 쓰기하지 않는다. 기존 crafting projection/approval/journal 도메인은 보존한다.
- [x] 모든 수량에 별도 native prompt. actor/mutation→game lease→common writer→file 순서, prompt 동안 writer/file 해제, 전후 epoch/payload/goal/CAS/health/global unknown 재검사.
- [x] native ACK+재조회에서 정확 operation 의미 확인 후 UI 성공. 안정 operation 재사용/다른 의미 conflict. 예외/ACK불명은 보호 상태 유지.
- [x] 기존 WoodStatus/공통 progress dirty 보호에 입력·정정·pending 연결. 전체 회귀/High1회 마감.

## 호환성 판정

구버전 reader는 새 manual event를 읽지 못한다. 이는 지원 범위 제한이며 과거 이력 손상으로 부르지 않는다. 배포/다운그레이드 정책은 별도 승인 사항이다.
변경 전 golden(합성 제작 확인3)을 새 reader로 읽고 audit prefix/digest/암호문 보존, manual append 후 기존 prefix 보존을 검증한다. 실제 이력 손상이나 안전한 분리가 불가능한 근거가 확인되면 해당 변경은 보류한다.

## 단계

1. native 순수 도메인·golden/CAS/중복/정정/장애 시험 RED→GREEN.
2. native 승인/bridge와 API strict DTO, 미확인 원장/C pending 차단·컨텍스트 경합 시험.
3. 기존 작업대/공통 전환 보호, 실제 React 합성 시험·전체회귀·독립검토.
