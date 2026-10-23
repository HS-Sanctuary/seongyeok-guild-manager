# ERGON Important 2건 최소 수정 — 2026-10-23 KST

기준 기능 HEAD `e9575ec5c6432156d6b8a033cd50217b24da7d47`. 실제 DesktopErgon/page 연결·자동 생산·공개 활성화가 아닌 N-R1/U-R1만 승인받아 수정했다. commit/push는 아직 승인되지 않았다.

## RED → 최소 수정 → GREEN

### N-R1: 일반 양수/이미 적용된 요청의 최종 문맥 검사

- 변경: `iris/desktop-life-progress-connection.cs`. Inspect/Audit와 순수 도메인 사전 검증 이후, 일반 양수 Commit 및 already-applied 반환 분기 직전에 동일 payload·계정·캐릭터·document epoch·contextVersion을 다시 검사한다.
- 시험: 기존 quantity fixture에 V13 추가. 일반 양수 및 이미 저장된 요청 각각에 account/character/A→B→A/epoch/payload 수량 변경을 Inspect 직후 주입한다. 저장 암호문 불변·거절 후 Busy/lease 해제·추가 가짜 게임 명령0을 확인한다. 기존 V05/V06/V11/V12는 승인 대기 중 변경·만료·정정 대상과 사유 변경·특별 승인 뒤 최종 검사 경계를 유지한다.
- RED: 기존 코드의 V13은 `rejected quantity changed current`로 FAIL했다. GREEN: V01–V13 모두 PASS. 기존 source=user-confirmed·0/null·정정 이력·nonce·unknown·lease 계약을 바꾸지 않았다.

### U-R1: lifecycle ACK 유실 복구와 보호 상태

- 변경: `components/iris/DesktopErgonResultConfirmation.tsx`. 보류/취소 pending을 수량 초안과 구분하여 onDirtyChange 및 beforeunload에 포함한다. pending 중 새 수량 쓰기를 막고, 단순 건강한 조회만으로 operation 성공을 추정하지 않는다.
- `보류·취소 저장 상태 확인`은 원래 operationId/goalId/revision/lifecycle을 그대로 native에 재전달한다. native의 중복 판정과 최신 view가 있는 정상 ACK에서만 pending을 정리한다. 실패/거절/응답 불명은 유지한다. paused/cancelled 상태에서도 pending 확인 버튼은 남아 있고, 재생성된 새 operation으로 중복 요청하지 않는다. 기존 native/typed ACK 계약을 재사용하여 서버·새 저장소·새 원장 API를 추가하지 않았다.
- 새 React+합성 API 시험: native 저장 성공/ACK 유실, 저장 전 unavailable, 반복 확인 실패, 건강한 재조회만으로 guard 해제 금지, locked 상태의 pending 보호, 같은 operation의 committed/already-applied ACK 후 remount 없이 취소 버튼 복구·guard 해제.
- RED: 기존 패널은 응답 유실 후 dirty=false로 FAIL했다. GREEN: 새 시험 PASS. 기존 late foreign ACK·capability 소실·초안 복구·보류remount 시험도 유지한다.
- 실제 page와 연결하지 않았으므로 앱 전체 종료/캐릭터 메뉴 보호 완료라는 뜻은 아니다. 이번에는 패널이 부모에게 제공하는 보호 상태와 beforeunload 경계만 합성 검증했다.

## 검증

- 전체 `node --test tests/*.test.mjs`: 645개 / 642 PASS / 기존 3 SKIP / 0 FAIL. V13은 기존 Node 시험이 실행하는 native 내부 사례이므로 Node 건수에 다시 더하지 않는다.
- 별도 TypeScript/scoped ESLint PASS.
- React 합성8스크립트 PASS: progress/result, lifecycle, review, 새 lifecycle-ack, 저장 전환, floating save strip, floating save overlay, 공개 ERGON lock. 기존12폭·글자/늦은캐릭터 ACK 포함.
- native quantity V01–V13 PASS. Node 내부 N04/H22/R5/A22/B20/저장 기반 회귀 PASS. 별도 executor/journal/actions-bridge/desktop-store/workspace-store/기존 quantity 회귀 PASS. 모든 자료는 합성 root/가짜 IO다.
- N04 normal·S01·최초 수령 회귀의 과거 간헐 실패 원인은 여전히 미확정이다. 이번 PASS를 근본원인 해결로 보고하지 않는다. 실제 native 창/설치본/게임 성공은 미검증이다.
- 최종 High 독립 검토1회 **C0/I1/M0**. 최초 보완 뒤에도 Store.Commit 내부 두 번째 Read 이후 검사가 없어 V13 변형이 FAIL함을 검토자가 메모리 내 합성으로 확인했다. 재검토는0회이며, 아래 추가 RED→GREEN과 마감 회귀는 영겁이 직접 실행한 결과다.

### High I1 보완: 실제 저장 내부와 ACK 경계

`iris/desktop-life-progress.cs`의 내부 writer Commit에 native 전용 선택적 validation callback을 추가했다. 기존 caller의 저장·암호화·복구 형식은 유지하며 bridge에는 콜백/경로/증거 입력을 노출하지 않는다. 수량 경로만 payload/context 검사(특수 승인 경로는 deadline 포함)를 내부 읽기 후, 게시 전, temp 검증 후, atomic 교체 직전과 최종 ACK 전에 적용한다. 이미 적용된 operation의 반환 경로도 검사한다.

확장 V13은 최초 Inspect/Commit 내부 Read/temp 읽기에 계정·캐릭터·A→B→A·epoch·수량 변경을 각각 주입한다. 내부 Read 주입의 추가 RED를 실제로 확인한 뒤 보완했고 GREEN이다. V14는 교체 완료 후 문맥 변경에서 성공 ACK를 거절하되 이미 커밋한 확인 기록을 보존하고, 동일 operation 재전달로 최신 결과를 정확히 한 번 확인한다. 저장 후 문맥 변경을 실패 rollback이나 게임 재실행으로 처리하지 않는다. **V01–V14 모두 PASS.**

제품 변경은 Connection/Store/독립 결과 패널3파일, 관련 공식 시험은 native quantity fixture/Node assertion/새 lifecycle React3파일이다. 실제 page/hook/실행기/원장 형식은 바꾸지 않았다. 아직 실제 사용자 설치본 또는 운영 동선의 검증이 아니다.

## 보존과 범위

집 원본 개인12항목의 파일 상태·SHA256은 수신 검토 시작 기준과 동일하다. 기존 ACK와 수신 검토 문서는 보존한다. 실제 사용자 원장/게임/CLI 접근0, main/DB/Production/IRIS0.4.2/공개 ZIP·metadata 변경0. 공개 ERGON lock·executionConnected=false 유지. UI 실제 mount·Task4 확장·자동 생산 구현0. 실행 가능한 새 계속하기 기능 없음. 현재 변경은 로컬 미커밋이며 검토 후 별도 전송 승인을 기다린다.
