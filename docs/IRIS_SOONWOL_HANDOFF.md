# 순월에게 IRIS 작업 이어받기 — 2026-10-12 KST

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
