# ERGON 수량 제작·통합 작업대 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. 승인된 요청을 현재 기능 브랜치에서 직접 이어서 구현한다.

**Goal:** 1회 고정 및 장비 결과 오판을 해결하고 작업 화면 왕복을 줄인다.
**Architecture:** native 고정 제작 CLI에 수량 바인딩, schema3 craft metadata, 기존 schema1/2 읽기 호환. 같은 상태 유지 실행 컴포넌트를 계획 화면에도 표시한다.
**Tech Stack:** Windows .NET/PowerShell5, React/TypeScript.
**Spec:** docs/superpowers/specs/2026-10-14-ergon-craft-workbench-design.md

## Global Constraints
- 신규 제작 횟수1..5/명령1회/날개5. native 최종 동의와 nonce/epoch/문맥/원장 보호 유지.
- 미확인 BOM 추측/자동 반복/unknown 해제/운영 변경 금지. 최신 퇴근 요청으로 기능브랜치 인계 push 승인, 잔여15%에서 새 구현 중단.
- 개인 dirty와 기존 공개 버전 보존, 기존 checkout 유지(겹치는 개인 변경 없음).

## Review Focus
- 장비 빈 get_items와 조회 가능한 소비품의 무증가를 구분.
- 계획·수량 변경 및 계정 ABA에서 오래된 nonce 실행 방어.
- 실제 craftCount와 승인한 횟수 불일치는 unknown.
- 구 native schema1/2 fallback 및 schema3 보호 원장 읽기.
- 긴 재료명/320px/큰 글자/가공 등록과 생산 완료 구분.

### Task 1: 제작 판정·수량 native
- [x] 장비 재고 제외 상황 RED→GREEN; 재고 null 표시/공식 완료+정확 차감 검증.
- [x] 횟수3 단일 전송/틀린 횟수/nonce 재사용/수량 범위/원장 재읽기 fixture RED→GREEN.
- [x] CLI/bridge/웹 확인창/기록에 craftCount(1..5), outputPerCraft, expectedOutput 전달 및 schema3 검증.
- [x] native actor/journal/CLI/bridge 테스트 PASS.

### Task 2: 수량 제작 UI와 작업대
- [x] strict schema3 parser/store/결과수량 계산 단위 시험 RED→GREEN.
- [x] 실제 React 목표3→요청3/날개5, 장비null 재고·단일 전송/구앱회귀 검증.
- [x] 계획에서 선택 즉시 실행·재료/날개/시설 확인, 품목검색/상태 표시.
- [x] tsc/lint/Node 전체/관련 실제 React 검증.

### Task 3: 마감 검증·현황 기록
- [x] 한 차례 독립 리뷰 및 중요 발견 재현/수정, 격리빌드/native 패키지 검증.
- [x] HANDOFF/BETA_FEEDBACK/구조/릴레이에 실제 완료와 남은 BOM 연계를 구분 기록.
- [x] 기존 앱 프로세스 부재 확인 후 개발 후보 정상 시작, 사용자 실화면/게임 검증은 분리 대기. push 없음.

### Task 4: 부족분 수급 미리보기·안전한 준비 실패 안내
- [x] 현재 가방 공유 재고 차감·산출 단위 반올림 잔량·채집→가공→수령→제작 순서 계산. 32노드/8깊이, 모호/미확인 경로 차단.
- [x] 선택 품목과 실제 부족한 하위 품목만 고정 참고자료 순차 조회, 최대32품목. 계획 추가만 허용하며 자동실행 없음.
- [x] 실제 React 연속 하위조회 중복 방지·계획 추가·320/390/720px 검증.
- [x] native 준비 오류는 허용된 코드만 전달하고 알기 쉬운 안내로 변환, 임의 예외·경로는 숨김. 고정 Stop 회귀 유지.
- [x] 새 slice 독립 리뷰·중요/사소 수정·최종 전체 검증. 인계 push 결과는 HANDOFF 최신 마감 참조.

## 실행 기록
- 최종퇴근인계: 수급review 중요1/사소1(공식부족품누락/미해금) 각각RED→GREEN, Node613/610PASS3skip/tsc/lint0/새·구실React/native/격리58/privatecompile PASS. 최신퇴근요청으로기능branch만push승인/잔여15%중단. 기존unknown/실게임미확정/전체자동chain미완료를기록, 정확전송은HANDOFF후속.
- 2026-10-14: 이전 진단에서 official get_items의 장비 제외와 craftCount 지원 확인. 현재 사용자 화면은 3개 계획/실제1개/unknown. 첫 회귀는 장비 완료+날개5지만 빈 재료조회인 상황을 재현한다.
- 사용자 이번15% cutoff·checkpoint push 철회: 계속 로컬 구현, 새 push 없음. 이미 f07470d의 A는 반복 구현하지 않는다.
- Task1 RED→GREEN: 장비 get_items 제외/official completed+wing5 판정, count3 단일 전송/nonce 재생 방어/틀린 count unknown/DPAPI quantity reload. 기존 조회 가능한 소비품의 무증가 차단 유지.
- Task2 RED→GREEN: strict schema3 parser/store, 실제 React 추가3→craftCount3/날개5/장비null/자동추가0; partial needed9−bag3=6/창고·잠김·stale·동명 방어; 계정/캐릭터 scope reset/late snapshot 폐기; 계획 화면에서 실행 준비 연결.
- Task2 추가: 사무실 설치 참고자료가 실제 존재함을 확인. selected reference parser/read-only 고정 경로 + 날짜/partial-only/Owned 제외 테스트 RED→GREEN. 완전 BOM·자동 연쇄로 승격하지 않는다. 네이티브/React 새 contract가 추가돼 최종 전체 검증에 포함한다.
- Ruling: 실행은 기존 공유 feature checkout 유지 — 개인 dirty와 수정 경로 겹침 없음/실앱이 이 경로를 사용 — 잘못 판단하면 개인 변경과 충돌할 수 있어 diff allowlist로 보존.
- Ruling: 참고자료는 선택 품목 사실의 PC-local 읽기만 허용, full BOM 검증/전체 DB import는 제외 — 기존 사용자 참고 지시의 범위이며 권리·최신성·완전성이 입증되지 않은 번들 배포를 피함 — 일부 품목의 자동 재료 수급은 아직 잠긴다.
- 최종15:30KST: 리뷰중요2를실제React RED→GREEN/전체Node504PASS3skip로수정, 늦은준비·동의11초각조회0/resume/계획수량3→5와재료9→15 확인. compact추가후별도58 build·타입/lint·신규/legacy브라우저회귀 PASS. private native compile PASS, Development30700 정상실행/stderr0. 새소비0/unknown보존/실앱실게임한설확인전, 미커밋/push0. full material chain은 이 P1slice와별개로미완료다.
