# 순월에게 IRIS 작업 이어받기

## 최신 인계 — 2026-10-13 KST

- 전송된기능기준: `c1f302de51ba99ad9d625c3cdb6d156b583ed9ad` 일반push/원격일치. 서면설계117af74포함, 이후문서마감도같은브랜치에추가한다. 아래명령으로최신HEAD를받고최종전달SHA와대조한다. GitHubVercel검사pending/대시보드조회403이므로Preview실확인을완료로추정하지않는다.

- 한설 승인: 영겁의 로컬 후보·설계를 `codex/iris-checkboard-classes`에만 검증 후 commit/push하고 사무실에서 이어간다. 운영main/제품버전0.3.0/공개ZIP/공지/DB 변경 없음. 새벽예약·PC자동종료는 생성/실행하지 않는다.
- 수신 순서: AGENTS → CODEX_RELAY → relay/TO_SOONWOL의 YG-20261013-001 → HANDOFF 최신 → BETA_FEEDBACK → superpowers/specs/2026-10-13-ergon-quantity-stop-design.md. 순월 ACK 후 현재남은일을 짧게 브리핑한다. 아래2026-10-12 메뉴/HUD우선순위는 당시경과이며 이번우선순위가아니다.
- 완료한 후보를 재구현하지 않는다: 기존생활조회7종/단일native행동/원장/nonce + 영겁의 수동제작예산보존/중지·기한/메뉴왕복·ABA늦은응답방어, LastRunningInteractionType과거이력오인수정(현재Compass+15flags+던전밖).
- 실제게임: 한설이 실제앱에서승인된통나무1회시작·벌목을확인. 최종명령결과/날개정확5차감은미확정, 목표1개와CLI최대100/현재‘다음중지’의실제중지미연결문제를접수했다. 원장unknown는지우거나자동재전송하지않는다. 추가실게임시험은품목·수량·소모한도·중지영향별도승인.
- 다음 A: 서면설계검토대기부터이어받아확인→구현계획작성/검토→직접구현. **현재채집실제중지/추가수량목표/재고진행관측/간결한UI**가우선, 이후B **확인된재료표기반부족분→채집·가공·제작** 별도계획. 모비웍스와생활커넥터설치코드를참고하되복사배포/무조건Stop반복·연주우회·미확인BOM추정금지.
- 이번최종검증: Node496/493PASS/3기존skip/0fail, 독립tsc/관련lint/native reader·actor/실React제한묶음·중지·기한·ABA·6테마/격리webpack58 exit0. 공식배포완료가아닌기능브랜치인계다. 환경500은devcache보관후익명3회검증/사용자실앱복구확인. 집PC의캐시/프로필/비밀값/게임기록은전달하지않는다.

### 한설이 순월에게 보낼 최신 문장

> 순월아, `codex/iris-checkboard-classes` 최신 인계를 받아서 이어가줘. 개인 변경을 먼저 보존하고 AGENTS 순서대로 릴레이·네 수신함·HANDOFF·BETA_FEEDBACK을 읽고 ACK해줘. 완료된 생활 조회와 native 단일 실행, 수동 묶음 보호 수정은 다시 만들지 마. `2026-10-13-ergon-quantity-stop-design.md`의 서면 설계 검토 대기부터 이어받아 필요한 확인을 짧게 받은 뒤 구현계획을 작성하고 직접 구현·검증해줘. 우선 현재 채집을 실제로 멈추는 중지, 추가로 캘 수량과 진행 표시, 설명을 접은 간결한 UI를 완성하고 다음으로 확인된 재료표에 따른 부족 재료 확보·가공·제작을 연결해줘. 모비웍스·생활 커넥터 동작을 충분히 참고하되 미확인 자료나 타앱 코드를 그대로 복사하지 마. 집에서 통나무 1회 시작만 확인됐고 최종 결과·날개 검증은 미확정이야. 추가 게임 행동·운영 배포·DB 변경은 먼저 확인해줘.

### 사무실 VS Code PowerShell

먼저 실행한다. 파일 목록이 나오면 더 진행하지 말고 순월에게 보존을 맡긴다.

```powershell
Set-Location 'C:\Users\sungw\sanc\seongyeok-guild-manager'
git status --short
```

출력이 없을 때만 아래를 한 줄씩 실행한다. 어느 줄이든 오류나 충돌이 나오면 멈춘다.

```powershell
git fetch origin
git switch codex/iris-checkboard-classes
git pull --ff-only origin codex/iris-checkboard-classes
git log -1 --oneline
```

main만pull하면인계를받을수없다. 강제reset/clean/임의stash금지, 원격최종SHA는영겁최종보고와relay기록으로대조한다. 동료호스트에서도컴퓨터자동종료나옛예약작업을이승인으로재개하지않는다.

## 2026-10-12 인계 기록 (당시 경과 보존)

## 한설이 순월에게 보낼 문장

> 순월아, 영겁이 작업한 `codex/iris-checkboard-classes` 인계 브랜치를 받아서 이어가줘. 사무실 미커밋 변경을 먼저 보존하고, AGENTS 순서대로 릴레이·순월 수신함·HANDOFF를 읽고 ACK를 남겨줘. IRIS 메뉴 정리는 로컬 구현·합성 검증까지 끝났으니 다시 만들지 말고 실제 앱 확인부터 해줘. 후속 5설계는 IRIS_FORWARD_DESIGNS에 있고, 다음은 읽기 전용 HUD 설계와 실제 커넥터 조회 계약 검토야. 미래 설계 전체가 구현 승인된 것은 아니야. main 병합·운영 배포·새 버전·게임 조작·DB 변경은 따로 확인해줘. 오래된 자동화로 완료 작업을 반복하지 말고 현재 상태부터 짧게 브리핑해줘.

## VS Code에서 직접 받을 때

사무실 프로젝트 폴더를 열고 상단 **터미널 → 새 터미널**을 누른다. 명령은 한 줄씩 실행하며 오류가 나면 다음 줄로 넘어가지 않는다.

먼저 현재 폴더와 변경 상태를 확인한다.

```powershell
cd C:\Users\sungw\sanc\seongyeok-guild-manager
git status --short
```

파일 목록이 나오면 멈추고 순월에게 보존을 맡긴다. reset/clean/강제 checkout 또는 임의 stash로 지우지 않는다. 출력이 없으면 아래를 한 줄씩 실행한다.

```powershell
git fetch origin
git switch codex/iris-checkboard-classes
git pull --ff-only origin codex/iris-checkboard-classes
git log -3 --oneline
```

`git switch`는 같은 이름의 로컬 브랜치가 있으면 그 브랜치로 이동하고, 없고 origin에만 있으면 해당 원격 브랜치를 추적하는 로컬 브랜치를 만든다. 이동 오류·로컬 변경 경고·분기/충돌 오류가 나면 강제 처리하지 말고 순월에게 그대로 전달한다. 성공 후 VS Code 왼쪽 아래에 `codex/iris-checkboard-classes`가 보이는지 확인한다.

**이번 작업은 main에 없으므로 main만 pull하면 안 된다.** `git pull --ff-only` 실패 시 rebase/merge/reset으로 임의 처리하지 않는다. 의존성·실행 환경 확인과 개발 서버 재시작은 순월이 이어서 맡는다. 집의 localhost3011 합성 화면과 Temp 경로는 사무실로 전달되지 않는다.

## 읽을 순서 / 이어받을 기준

1. `CODEX_RELAY.md` → `relay/TO_SOONWOL.md`의 YG-20261008-001 최신 인계 → `HANDOFF.md` 최신 항목. 수신 후 순월이 직접 ACK.
2. `superpowers/plans/2026-10-11-iris-navigation.md`: 승인 범위·실행 결과·남은 실제 앱 확인. 구현 `6fd6d3d`, 회귀/설계 `2d71996`, 최초 인계 `e4806fd`.
3. `IRIS_FORWARD_DESIGNS.md`: 49항목과 5설계 순서. 이미 완료한 상점/임무/시낙시스/업데이트는 재구현하지 않는다.
4. `superpowers/specs/2026-10-11-iris-readonly-hud-design.md`: 다음 검토 대상. 새 게임 행동·운영 DB/RLS·원격 노출은 별도 승인.

운영 버전은 SANCTUM v2.3 / IRIS Beta0.2.2 그대로이며 이번 공유는 개발 인계다. 후보 코드/문서를 전달하는 것이지 운영 배포·실제 앱 시험 완료나 순월 수신 확인을 뜻하지 않는다.
