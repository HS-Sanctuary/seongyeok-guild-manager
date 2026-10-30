# ERGON D-2 업데이트·역방향 호환성 독립 검증

2026-10-30 KST / 순월 / 격리 합성 검증. 최초 기록은 로컬 미전송이며, 17:50 KST 한설이 시험·한국어 인계의 기능 브랜치 선별 전송을 승인했다. 운영 적용 승인은 아니다.

기준 HEAD는 `6a55aa07c67b6a824f7b0d204949079d95e6dc96`다. 고정 구형 개발 reader/writer는 `2b451846c62661bccbfa64bc8260a64ac2015378`, 운영 main 소스 관측 기준은 `ca697706a874d21668091588940ceb61338d0700`이다. 제품·구형 reader·스키마는 수정하지 않았다.

**A–D 합성 시나리오는 통과했지만, 다운그레이드 전체가 안전하다는 뜻은 아니다. Important 1건: 구형 reader의 명시적 `Recover`가 과거 백업을 현재 파일로 게시해 새 manual35를 현재 기록에서 가릴 수 있다. 업데이트/다운그레이드 정책의 검토·승인 전 D-2 운영 활성화를 차단해야 한다.** 이 건은 일반 `Load`/`SetLifecycle`의 거부·무쓰기와 구분한다.

## 격리와 증거 범위

- 신규 시험 파일은 `iris/desktop-life-manual-upgrade.fixture.cs`, `iris/desktop-life-manual-upgrade.tests.ps1`, `tests/iris-ergon-d2-upgrade.test.mjs`다. 고정 소스는 Git에서 추출하고 구형/신형을 각각 새 `powershell.exe` 프로세스로 컴파일·실행한다.
- 실행 위치는 짧은 경로의 source-only 시험 사본이다. 합성 `development` scope와 고유 `.superpowers/d2/<GUID>`만 사용한다. 실제 Windows DPAPI CurrentUser로 암호화하지만 사용자 원장·프로필을 복사하거나 읽지 않는다. 스크립트는 허용 합성 root 밖 경로와 reparse point를 거부한다.
- 강제종료는 이 runner가 소유한 합성 자식 프로세스만 대상으로 한다. 전역 프로세스 종료·설치/업데이트 helper 실행·실제 CLI/게임·DB·공개 설치본 사용은 없다. 기존 `last-domain-root.txt`를 읽거나 갱신하지 않는다.
- 최종 A–D 원본과 암호문/백업은 시험 사본의 ignored `.superpowers/d2/<GUID>`에 유지한다. 구형 복구 probe는 그 아래 `explicit-old-recover` 사본, 중단 probe는 `crash-before/after/ack` 사본만 변경한다. 원본 A–D에 구형 복구를 실행하지 않는다. 절대 경로와 개별 실행 매핑은 로컬 전용 manifest에만 보존한다.
- `results.log`, `old-result.json`, `explicit-old-recover/old-recover-result.json`, `source-hashes.json`, 자식 stdout/stderr, 중단 전 `before-ciphers`를 ignored 증거로 보존한다. 이 자료와 DPAPI 파일·추출 구형 소스는 전송 대상이 아니다.

## A–D 결과

| 구분 | 수행과 판정 | 결과 |
| --- | --- | --- |
| A1 | 고정 구형 프로세스가 pre-D2 golden의 기존 확인3을 검증하고 목재100 목표를 구형 writer로 저장 | PASS |
| A2 | 신형 새 프로세스의 최초 읽기에서 암호문·백업 무변경, revision/digest 동일. manual35 append 후 기존 audit prefix와 마지막 과거 digest 보존 | PASS |
| B | 실제 새 manual35 DPAPI를 고정 구형 프로세스로 읽기: `health=unavailable`, `error=invalid-current`, 목표 노출0. `SetLifecycle`은 `unavailable/current-unavailable`로 거부. current/백업/tmp/intent 암호문 inventory 불변 | PASS, 지원 제한 |
| B 추가 | 별도 사본에서 구형 `Load`가 노출한 revision5 복구 후보를 명시적으로 `Recover`. `committed`, revision6, 이후 `review-required`. 현재 암호문 변경·현재 manual 기록 비노출·교체 전 새 암호문은 백업에 보존 | LIMIT / Important |
| C-before | tmp 쓰기 직전 자식 종료 → 새 프로세스에서 기존35, 과거 확인3/audit 유지, inventory 불변 | PASS |
| C-after | 원자 교체 직후 자식 종료 → intent와 새 이벤트20 유지, `review-required`, 일반 쓰기 거부, 최초35 암호문은 백업 유지 | PASS |
| C-ack | 정상 publish 완료 뒤 응답 전에 자식 종료 → 합계55. 동일 operation 재전달은 `already-applied`, 해당 이벤트1개·추가 가산0, 재전달 무쓰기 | PASS |
| C-update | 고정 main의 archive validator에 길이3·해시 불일치 합성 ZIP 입력 → stage 생성 전 `Archive integrity mismatch`, 원장·백업 무변경 | PASS, 다운로드/설치 전체 시험 아님 |
| D1 | 구형 일반 읽기/저장 거부와 실패 ZIP 검사 뒤, 원본을 신형 새 프로세스로 열어35 복귀. 최초35를30으로 정정하며 원본 이벤트 보존 | PASS |
| D2 | 다시 새 프로세스에서35→30 정정 이력, 원본 event 참조·정정 이유·과거 audit prefix·기존 확인3 복원. 읽기 무쓰기 | PASS |

시험 wrapper의 PASS는 위 동작과 **명시적 복구 위험의 재현**을 모두 확인했다는 뜻이다. 구형에서 새 이벤트를 지원하거나, 복구 뒤 자동으로35가 현재 기록으로 돌아온다는 뜻은 아니다. 복구 사본에서는 신형 복구/백업 선택을 자동 실행하지 않았다.

## Important: 업데이트·다운그레이드 정책의 빈틈

고정 구형 `desktop-life-progress.cs`의 `Read`는 새 이벤트가 있는 current를 해석하지 못해도 읽을 수 있는 과거 `.bak`를 후보로 노출한다(88–101행). `Commit`의 `Recover` 분기는 `document == null` 일반 쓰기 거부보다 앞서 후보로 commit을 만들고 publish한다(136–149행). 별도 합성 사본에서 실제 교체를 확인했으므로 “구형은 어떤 조작에서도 덮어쓰지 않는다”는 보장은 성립하지 않는다. 백업 잔존은 현재 기록의 가림과 이후 백업 회전 위험을 해결하지 않는다.

운영 main의 자동 업데이트는 더 높은 앱 버전만 후보로 삼는다(`desktop-update.cs` 39행, `desktop-update-install.cs` 44행). 준비·설치·rollback은 앱 파일 목록을 대상으로 하고 Desktop store/profile을 순회하지 않는다(`desktop-update-install.cs` 16–20, 40–50, 74–78행). progress 이벤트/reader 호환성을 확인하는 경로는 이 소스에서 확인하지 못했다. 앱 파일 rollback을 progress 데이터 rollback으로 간주하면 안 된다. 이번 C-update는 archive validator 단위의 실패 시험이며 실제 네트워크 다운로드·전체 installer·rollback 실증이 아니다.

특히 `ca697706`에는 `iris/desktop-life-progress.cs`가 없고 `iris/build-beta.ps1`의 제품 컴파일 목록에도 progress가 없다. 따라서 이번 고정 `2b45184` 개발 reader 시험을 **실제 배포 IRIS0.4.3에서 새 progress를 보호한다는 증거로 확대할 수 없다.** 공개 바이너리·설치본은 실행하지 않았다.

영겁 후속: 실제 출시 후보와 정상 복귀 버전의 reader 범위를 먼저 확정하고, 새 이벤트가 존재할 때 구형 실행/복구·앱 rollback을 어떻게 차단할지 구체적 정책을 준비한다. 원본 보존·복구 사본·수동 복구 조건과 실패 시 사용자 안내를 함께 검토하고 한설의 승인을 받는다. 정책과 검증 전 운영 flag/공개 D-2를 활성화하지 않는다. 이번 작업에서 제품 방어·마이그레이션·구형 코드 수정을 임의로 추가하지 않았다.

## 실행 마감과 실패 기록

- 인수 시 기존 `cf505fe0cd394a59b5f7327735d24215` 로그에서 A–D 9 PASS, 명시적 복구 LIMIT, .NET SHA 마감을 확인했다. 이미 끝난 개별 trial을 다시 만들지 않았다.
- 담당 마감 시 시험 사본에서 `node --test tests/iris-ergon-d2-upgrade.test.mjs`를 **1회** 실행했다. exit0, **1 test / 1 PASS / 0 FAIL / 0 SKIP**, 약24.25초. 내부 고정 소스·새 프로세스·중단/복구 시나리오가 모두 수행됐다. 이후 순월의 최종 전체 회귀와 전송 직전 집중 검증은 별도 사무실 QA 기록을 따른다.
- 최종 wrapper 원문은 관리 worktree의 `.superpowers/ergon-d2-receive-20261030/upgrade-final-node.log`에 있다. 합성 원본의 `results.log`에는 PASS9와 `LIMIT D2U-B-recover`가 각각 남아 있다.
- 최초 `010584850eec4c8f9d1d7d6b24bfee27` 실행은 ACK-loss 뒤 모든 verified 백업이 영구 유지된다는 잘못된 시험 가정에서 중단됐다. 제품은 정상 publish 후 최근2개 검증 조상을 보존·회전한다. 기대 계약을 정상 current55와 중단 전 current35 암호문의 백업 보존, 오래된 삭제 백업의 동일 store·audit 조상 여부 검증으로 바로잡았다. 제품 코드를 고친 결과로 보고하지 않는다. 최초 results.log(C-after까지)·중단 사본·before-ciphers와 당시 도구 응답은 보존하며 삭제/성공 로그 대체를 하지 않는다. 예외 원문은 당시 대화의 도구 응답에 있으며, 최초 results.log 파일 자체에는 ACK 실패 예외문이 들어 있지 않다.
- `0254e8969aaa4d319b9c15161a6de42d`는 A–D PASS 뒤 runner의 `Get-FileHash` 부재로 마감 실패한 실행이다. 해시는 .NET SHA256으로 바꿨고 이후 `cf505...`와 최종 실행에 `source-hashes.json` 생성까지 확인했다. 이 실패를 제품 저장 실패로 집계하지 않는다.
- 이번 검증의 미실행 범위: 실제 사용자 데이터·설치본 호환/다운그레이드, 실제 앱 updater/rollback, GUI/CUA, 전체 회귀·빌드, 실CLI/게임, DB/운영 main/flag/공개 ZIP, Git commit/push. GUI·회귀와 최종 안전 검토는 별도 담당 결과를 따른다.

## SHA256

관리 worktree와 시험 사본의 제품/fixture/runner 내용이 같음을 확인했다. 아래는 최종 실행 소스와 증거의 바이트 해시다.

| 파일 | SHA256 |
| --- | --- |
| `iris/desktop-life-progress.cs` | `664bdb6f337f6861b50c9e710c7fba340eaa08d0efc6f3bdfe32724f74f2e8c9` |
| `iris/desktop-life-manual-upgrade.fixture.cs` | `f5d0ea612b32b5e6209f5f8275d3fb44925aa5e67d4d0d1aed8d882b3b0d4efb` |
| `iris/desktop-life-manual-upgrade.tests.ps1` | `7ce480a22d21b7092ccc6649d18da9a4627e486418f3e8186c3a90e60bd608b0` |
| `tests/iris-ergon-d2-upgrade.test.mjs` | `a972db2b18b2651fe8f8ebf13568fa9bcd1e83f18a6df0c071abcc076dc5c2f9` |
| `tests/fixtures/ergon-progress-v1-before-d2.json` | `fe705d669c713685d0576cfe94468e624493e32246f9b3147b00467593590d27` |
| `upgrade-final-node.log` | `dbbe682b6044fb4fb25212b6568667d35bac3eed91dfc5ac5b0b5b113b1c10c8` |

기존 개인16·이전 ACK34·N049·공용 릴레이는 이 담당이 수정하지 않았다. 모든 합성 원본/실패 증거는 로컬에 보존하며 전달 후보는 위 신규 시험3파일과 이 한국어 보고뿐이다.
