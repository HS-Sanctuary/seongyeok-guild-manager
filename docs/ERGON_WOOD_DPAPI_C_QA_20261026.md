# ERGON C — DPAPI 가공 진행 보존 / 전송 보류

**2026-10-27 최종 선별 전송 승인:** 한설이 검증된 C/N04 제품·시험·필수 인계만 기능 브랜치 commit·일반 push 승인했다. 기준 B971a4d8, 최종 수신 SHA는 본 QA 포함 커밋/원격 HEAD다. 아래 보류·승인 대기는 각 당시 기록이다. source19 최종 PASS 일치, Node714/711 PASS/FAIL0/기존3 SKIP 확인. 운영/게임/공개 활성화와 개인 ACK·원장/로그 전송은 승인하지 않았다.

## 2026-10-27 후속 — 합성 검증 통과 / 전송 승인 대기

[N04 집 독립 복구 QA](ERGON_N04_HOME_RECOVERY_QA_20261027.md)를 먼저 읽을 것. 사무실 진단 파일 없이 IOException 과도한 무시를 제품 최소2파일로 보완하고, response-loss 합성 생산자 GC 소실을 시험 fixture에서 RED→GREEN으로 해결했다. 최종 Node714/711 PASS/FAIL0/기존3 SKIP, C native14/API2·N044·React6·타입/관련 lint·private native/웹 격리 build PASS다. 역사적 복구 field-diff의 정확한 발생 단계는 미확정으로 유지한다. 아래 10월26일 실패·전송 보류는 당시 기록이며 삭제하지 않는다. C는 이제 선별 전송 후보로 정리 가능하지만 최신 승인 범위에 따라 commit/push하지 않고 대기한다. 실제 생산/공개 활성화·운영 변경은 없다.

기준: 2026-10-26 KST, 영겁. B 전송 **`971a4d81f8c69fb1ef1bdf046aa75931a6f14bc4`**, 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`. B는 일반 push·원격 일치를 확인했다. **C는 로컬 미커밋/미전송**이며 전체 보호 회귀 실패 때문에 조건부 전송 승인을 적용하지 않는다. 최신 사용량 중단 기준은 남은15%다.

## 구현한 범위

- `desktop-life-wood-store.cs`: 별도 wood-v1 DPAPI/entropy/환경·계정·캐릭터·목표·모드별 파일. 기존 ProgressFileIO·공통 writer·game lease·native goal/sourcePlanId·journal 계약을 재사용한다. 기존 원장/제작 진행 형식과30일300건 정책은 변경하지 않는다.
- 목표100·승인 예산·회차 단계·전송 요청/pending·수령 영수증·출처·보수적 비용 예약·남은 예산·보류/차단·복구 이력을 보존한다. operationId/CAS/append-only 검증으로 같은 요청·예약·영수증을 중복 가산하거나 과거 기록을 수정하지 못한다. 등록/예상량만으로 목표 완료가 되지 않는다.
- 임시 암호화 파일 flush→검증→intent→current 원자 교체→암호화 head 확인 기록→intent 제거. 확인된 backup2개만 유지하고 불완전/손상 후보를 자동 삭제하지 않는다. C 기록은 최대1024 명령·4096 operation·64 복구 이력·4MiB로 제한하고 한도 초과는 차단한다.
- commit witness인 head를 확정량 기준으로 사용한다. current가 과거본이면 최신 head의 확인량3을 보존한다. terminal 교체가 중간 실패하면 새 receipt를 확정하지 않고 head의 pending/확인량을 유지한다. 미완료 current의 새 pending 예약만 보수적으로 보존하고 소비를 막는다. 파일 전체/확인 기록을 함께 악의적으로 되돌리는 OS 수준 공격까지 보증하지 않는다.
- native journal terminal의 최소 행·digest를 C에 보존하고 현재 행/전역 unknown·기존 progress의 `quantityUnconfirmed`와 대조한다. 기존 journal 정리 후 최소 증거 보존은 실행 허가나 unknown 해제가 아니다. 불일치는 blocked/review-required이며 이전 확인 기록은 지우지 않는다.
- `irisErgonWoodPersistence`: 기존 목재 manager의 native 저장 port/strict scope·수량·예산·모드 parser. 합성 입장은 native 테스트 생성자만 연다. production에 raw manager/receipt commit route는 없다.
- `desktop-life-wood-connection`·기존 bridge/webview/store 연결: `game.life.wood.load`/`observe`만 고정 노출하며 공개 gate=false다. native B 공급자에서 직접 얻은 자료만 관측 저장하고, 브라우저 packet/receipt/source 입력은 받지 않는다. 예산은 사용자 승인 한도이지 실제 비용이나 잔액이 아니다. C load/observe의 늦은 ACK도 같은 문서의 캐릭터 전환을 넘어가지 못한다.
- production은 관측 이력/확인량0/blocked/실행 false다. 작업 목록·완료·남은 시간을 저장해도 workId/정원/실수령 귀속/비용/보상 합산·게임 캐릭터 귀속은 unsupported다. 저장된 B 관측은 과거 기록이지 현재 가용 재고/비용 또는 자동 실행 자료가 아니다. C의 수동 가공 결과 확인 UI와 실제 생산 연결은 만들지 않았다.

## 합성으로 확인한 것

가짜 world/CLI는 기존 테스트 fixture를 재사용하고 저장과 journal은 UUID 임시 경로의 **실제 native DPAPI**를 사용했다. native helper가 실제 game lease·writer를 보유하며, 가짜 실행 전 journal Begin/응답 뒤 terminal과 저장을 대조한다. helper는 시험 소스일 뿐 실제 host 실행기로 포함하지 않는다.

- 추가100 생성→가짜 채집/등록→waiting 저장→native 프로세스 종료→다른 native 프로세스 복원→수령 확인→남은 목표 재계산→추가100 이상 완료. 등록 시 확인량0, 재시작 전후 이력/예산 보존. 실제 게임이나 IRIS를 종료한 시험은 아니다.
- 보류/새 프로세스 복원·신선한 합성 관측 뒤 재개, ACK 유실·응답 유실·terminal 쓰기 실패, 중복 operation/수령·타 캐릭터·문맥 상실, native journal/progress 미확인·동시 프로세스 lease 배제, temp/intent/replace/context/rollback/corrupt 조합 검증.
- production native B 저장은 blocked/confirmed0. 가짜 수령량을 production으로 올리거나 기존 unknown을 해제하는 경로는 없다. 단순 사용자 진술을 공식 증거로 바꾸지 않는다.

## 안전 검토 1회

Sol High 읽기 전용 **C0/I3/M0**. 작성자가 아래3건을 각각 RED→최소 보완→GREEN으로 확인했다. 추가 독립 재검토는 하지 않았다.

1. rollback 때 head에 남아 있던 최신 확인3이0으로 표시됨 → 확정 head 기준 projection, 확인3/남은97/blocked 보존.
2. journal unknown 없이 기존 progress에 terminal 없는 요청이 있을 때 C가 정상 입장 → 공통 writer 안의 실제 native projection 미확인 검사를 C audit에 연결. fixture의 readProgress도 static fake view 대신 실제 common.Load로 변경.
3. terminal current 교체 직후 실패 때 새 수령3을 확정하고 pending 소실 → durable head의 이전 확인0/pending을 보존, 실패한 current receipt 비승격.

이와 별개로 같은 문서의 늦은 C ACK를 RED→generation 보호→GREEN 보완했다. 전체100 DPAPI 시험의 초기120초 timeout은 같은 원장을 영수증마다 재복호화하던 경로를 한 번 읽어 대조하도록 고쳤고 단독 약66초 PASS를 확인했다. 전체 부하 여유는 신규 시험240초로 두되 완료·수량·보호 조건은 그대로다. 동시 fixture의 native registry 준비 전 초기화 경합은 준비 ACK 후 두 번째 프로세스를 시작하고 **실제 IOException** 거절을 확인하도록 보완했다.

## 검증 결과와 전송 판단

- 신규 C native14개 및 고정 API2개가 대상이다. High3건/원자 복구6조합·새 process·production 비승격의 개별 회귀는 PASS. C의 전체100 사례도 단독 PASS다.
- 타입·관련 lint·private native 전체 소스 컴파일·비밀 env 미복사 웹 격리 빌드 PASS. 기존 React6종(workbench-results/page-protection/lifecycle-ack/save-transition/currency-cache/release-lock) PASS.
- **동시 전체 Node:**712 중707 PASS/2 FAIL/기존3 SKIP. 하나는 신규 동시 fixture 초기화(위 보완), 하나는 기존 N04 `paused child lost game lease`다.
- **N04 단독:**2 PASS/0 FAIL. 기존 N04/native 실행·journal·progress 소스는 B 기준과 동일하다. 단독 PASS가 전체 실패 원인 해결을 뜻하지 않는다.
- **직렬 전체 마감:** 712건 중708 PASS/1 FAIL/기존3 SKIP. 신규 C native14개와 고정 API2개는 모두 PASS. 실패는 기존 N04의 `recovery changed fields other than inflight state`이며 동시 전체의 lease 실패와 정확한 증상이 다르다. 기존 N04가 직렬 전체에서도 실패했으므로 전체 통과로 보고하지 않는다. 과거 간헐 이력과 이번 정확한 실패를 구분해 보존한다.
- 위 전체 보호 회귀를 해소/판단하기 전 C를 검증 완료로 전송하지 않는다. 후속은 새 기능이 아니라 N04 전체/단독 차이의 안전한 재현·원인 분석과 최종 전체 검증이다. 기존 보호 기대값을 약화하거나 임의 sleep/retry로 PASS만 얻지 않는다.

## 보존·승인 경계

원본 개인12·기존 ACK·사용자 원장/캐시/응답은 그대로다. 테스트는 소유 임시 DPAPI·가짜 CLI만 사용했다. 실제 게임 명령/원장 변경·DB/RLS·추가 Supabase/Vercel 호출/구독·main/Production/IRIS0.4.3/공개 잠금 변경0. C 파일과 로컬 실패/성공 로그는 관리 worktree에 보존한다. 원문 로그/암호화 기록/개인 파일을 Git에 넣지 않는다. B만 원격 전송된 상태이며 C의 별도 commit/push는 미실행이다.
