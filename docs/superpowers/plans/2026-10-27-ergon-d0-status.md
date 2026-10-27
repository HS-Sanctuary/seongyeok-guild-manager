# ERGON D-0 읽기 전용 현황 연결

**2026-10-27 선별 전송 승인:** 한설이 아래 검증된 D-0의 제품/시험8·인계5와 저장소 필수 문서2의 기능 브랜치 commit·일반 push를 승인했다. 기준 Caff55344, 정확 최종 SHA는 본 계획 포함 커밋/원격 HEAD를 대조한다. 마지막 UI 소스8은 보존본과 같고 이를 기준으로 최종 검증을 다시 수행한다. 아래 로컬/미승인은 당시 경과다. 운영/게임/사용자 원장/공개 변경과 무관한 자료 전송은 계속 금지한다.

**최종 22:27 KST:** 동일 source8로 Node720/717 PASS/FAIL0/기존3 SKIP·실제 D-0/기존 보호 UI6종·타입/관련 ESLint/격리 Next build PASS 재확인. 제품/시험 추가 변경 없이 인계만 마감한다.

**기준:** C 전송 `aff55344dc213c80ef1e10602d350a11cf9cfc8b`. 한설의 D-0 로컬 구현/합성 검증 승인. commit/push 없음.
**설계:** 기존 작업대에 한 개의 현황 section만 연결한다. 기존 native goal 선택 계약에 표시 전용 review 허용을 명시하고 기본 실행 선택 동작은 유지한다. C load 결과/저장된 B observation을 기존 strict parser로 검사하고 표시용으로만 변환한다. 새로운 목표/예산/원장/진행 엔진이나 저장소는 만들지 않는다.

확정 기록0과 실제 확보량 미확인을 함께 구분한다. source none인0을 실제 성공0으로 표시하지 않는다. 현재 C는 목재100/production blocked 계약이므로 다른 목표는 연결 준비 상태로 안내한다. 기록 자체 updatedAt는 없으므로 확인 필요, B observedAt와 복원 시각은 별도 이름으로 표시한다. 저장된 remainingSeconds는 조회 당시 값이며 카운트다운/완료 전환/멤버십 배율을 적용하지 않는다. workId가 없으면 목표 작업으로 귀속하지 않는다.

호스트 observe는 CLI조회/기록쓰기와 기존 승인 예산이 필요하므로 이번 UI에서는 호출하지 않는다. 이미 저장된 B/C 자료만 load하며 최신 관측을 생성하는 버튼/자동 폴링/생산 버튼은 추가하지 않는다. 계정/캐릭터/goal·plan/문맥epoch·활성 상태가 바뀌면 지연 응답은 폐기하고 이전 내용을 즉시 숨긴다. 결과 입력 초안/종료 보호 상태는 건드리지 않는다.

- [x] 표시 projection 단위시험 RED: 기록0/미확인·foreign plan/scope·과거 관측/시간·unknown·기존 기본 selector 보호.
- [x] 최소 pure helper 및 기존 selector의 표시 전용 옵션 GREEN.
- [x] 기존 DesktopErgon에 소형 read-only section 연결. React 합성 RED→GREEN: 대기/보류/차단/unknown, 재mount, ABA/지연/오류, dirty보호,320/390/768/1280·글자18/20/22.
- [x] 타입/lint/관련 React·B/C/native 원장·전체 Node와 필요한 격리 build, High 안전 검토. 실제 CLI/사용자 파일/서버 호출0.
- [x] 한국어 QA/남은 관측 조건 보고. C 전송 커밋과 분리된 로컬 변경으로 보존, D-0 commit/push 없음.

마감: [D-0 QA](../../ERGON_D0_READONLY_WORKBENCH_QA_20261027.md). Node6, 전체720/717 PASS/FAIL0/기존3 SKIP, 실제 D-0 React 및 기존 보호6종·타입/lint/격리 build PASS. 마지막 보류 가드는 이후 React/type/build로 별도 검증했다. High C0/I0/M1의 epoch 조회 잠금은 작성자가 RED→GREEN으로 보완했다. 현재 C는 paused 목표 load를 거절하므로 UI는 공통 목표의 보류 여부만 표시하며 조회/생산을 시도하지 않는다.
