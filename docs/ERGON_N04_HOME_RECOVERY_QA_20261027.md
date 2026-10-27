# N04 집 독립 복구 및 C 검증 — 2026-10-27 KST

**최종 전송 승인:** 한설이 이 검증 범위의 기능 브랜치 선별 commit·일반 push를 승인했다. 기준 B971a4d8, 최종 수신 SHA는 본 QA 포함 커밋/원격 HEAD다. 최종 source19 SHA256 일치/ff-only 최신을 확인했다. 아래 승인 대기는 검증 마감 당시 경과이며 원본 실패·미확정은 그대로 보존한다. ACK 원본·개인12·실사용 원장/암호문/로그·격리 사본과 별도 계획/수신 메모는 전송하지 않는다.

영겁. 기준 B/원격 기능 HEAD `971a4d81f8c69fb1ef1bdf046aa75931a6f14bc4`, 브랜치 `codex/home-gnosis-iris-integration-20261019`. C는 집 로컬 미커밋 후보다. 순월의 10월27일 진단 파일은 미수신이며 아래는 집에서 독립 확보한 근거다. 실제 게임·사용자 원장·운영 환경에 적용한 결과가 아니다.

## 1. 보존 및 비교

- 기존 개인12·삭제·ACK·C후보19·원본 실패 로그와 source-only 사본을 유지했다. 원본 checkout은 편집하지 않았다. 새 B/C 시험 사본은 ignored 격리 하위에 만들고 실제 게임 파일은 복사하지 않았다.
- 원래 N04의 실제 컴파일 소스/runner/test14파일은 B와 C가 동일했다. C 신규 wood 저장소는 N04 컴파일 목록에 포함되지 않는다. 각각 짧은 독립 사본에서 기존 N04 2 PASS/0 FAIL을 확인했다. 이것만으로 간접 영향이나 과거 간헐 실패를 해소했다고 판단하지 않는다.
- 시험 전용 진단을 추가해 소유 합성 자식의 단계·단조 시각·스레드·IOException 형식/HResult/메서드·복구 전후 변경 필드·lease probe를 ignored 파일에 기록한다. 계정 원문·개인 경로·암호문·원본 로그는 이 문서나 Git 대상에 넣지 않는다. 제품 빌드/host 목록에는 진단 fixture를 추가하지 않았다.

## 2. 확인한 결함 A — 복구 IOException 과도한 무시

`DesktopLifeExecutor` 생성자는 모든 `IOException`을 살아 있는 sibling의 game lease 경합처럼 무시했다. 실제 합성 journal.lock을 점유시킨 결정적 시험에서, game lease 획득 후 journal lock 단계 실패도 생성자가 정상 반환했다. 원장 바이트는 유지됐지만 복구 실패를 구분할 수 없었다. 신규 시험에서 RED를 확인했다.

최소 제품 수정:

- `desktop-life-journal.cs`: game run-lock의 FileStream 열기에서 실제 Win32 공유/잠금 충돌32/33만 내부 `LifeExecutionLeaseBusyException : IOException`으로 구분한다. root 디렉터리 생성이나 다른 파일/읽기/쓰기 오류는 이 타입으로 바꾸지 않는다.
- `desktop-life-executor.cs`: 이 내부 busy 타입만 복구 유예로 처리하고 journal lock/read/write 등 다른 IOException은 전파한다. 재시도·unknown 해제·정상 종료 위장·원장 형식 변경은 없다.
- 동일 시험에서 journal I/O는 거절, game lease 점유는 기존처럼 유예, 양쪽 원장 bytes 동일을 GREEN으로 확인했다.

이는 확인된 독립 결함의 수정이다. 과거 전체 실행의 `recovery changed fields other than inflight state`에서 실제 발생한 IOException 단계가 보존 로그에 없으므로 그 역사적 실패의 정확한 원인까지 확정하지 않는다. 새 진단은 이를 구분할 수 있도록 한다.

## 3. 확인한 결함 B — response-loss 합성 생산자의 수명

`response-loss` fixture의 완료되지 않는 TCS/Trial/actor/Run은 await 사이클만 형성하고 외부에서 유지하는 생산자가 없었다. 프로세스가 살아 있어도 GC가 사이클과 lease의 FileStream을 수거할 수 있었다.

- 새 시험은 소유 시험 자식에만 root SHA 기반 named event를 통해 GC 1회를 요청하고, ACK 뒤 다른 소유 probe가 game lease를 확인한다. sleep/반복 재시도 대신 명시적 이벤트를 쓰며 대기는 제한한다.
- 수정 전 B/C의 짧은 사본에서 모두 `paused child lost game lease`를 재현했다. 원래 N04 소스14개가 동일한 기준 대조다. 사무실 조사 결과를 빌린 재현이 아니다.
- 최소 수정은 **시험 fixture에만** `pendingProducer`를 두고 가짜 요청이 끝날 때까지 Trial을 유지한 것이다. 별도 lease를 획득하지 않고 요청이 끝나면 finally에서 해제한다. 제품 lease 수명 규칙은 바꾸지 않았다.
- 같은 forced-GC 시험 GREEN: 자식 생존 중 lease 유지, 소유 자식 종료 후 새 프로세스에서 unknown 복구, 기존 확인2/새 수량null/가짜 명령1회 유지·추가 재전송0.
- 실제 호스트는 Form의 lifeActor 필드/bridge delegate와 실제 CLI의 WaitForExit/스트림/timeout 생산자가 존재한다. 이 합성 결함으로 제품의 모든 프로세스 수명·GC 안전성이 입증되는 것은 아니다.

## 4. 검토와 검증

- High 독립 안전 검토: 제품 최소 변경 및 추가 GC fixture 확인 모두 C0/I0/M0. 기존 C 전체를 새로 전면 검토한 결과는 아니다. 검토자는 새 시험을 실행하거나 제품/사용자 원장을 수정하지 않았다.
- 신규 IOException RED→GREEN 및 N04 기존3흐름을 합친 첫 대상 회귀3 PASS. 이후 추가 forced-GC/unknown 복구 시험1 PASS. 타입·관련 lint PASS, 기존 React6종 PASS, private native 컴파일·비밀 env 미복사 웹 격리 빌드 PASS.
- 첫 전체:713 중709 PASS/1 FAIL/기존3 SKIP. 기존 N04는 PASS. 실패는 목재 cross-process 시험의 기존 `/IOException/` 문자열이 새 IOException 하위 타입명과 맞지 않은 것이다. 정확한 `LifeExecutionLeaseBusyException:Life execution lease busy`로 검사 범위를 좁혔고 대상 회귀 PASS를 확인했다. 거절 기대값을 완화하지 않았다.
- **최종 전체 결과:**714건 중711 PASS/FAIL0/기존3 SKIP, 종료 코드0. 신규 C native14/API2 및 N044를 포함한다. 실제 native DPAPI 추가100/회차·pending·수령·비용/새 프로세스/원장 불일치/문맥/중복 보호가 모두 PASS다. 추가100 native 사례는 전체 부하에서 약95초였다. 전체 통과는 승인된 합성 범위의 결과이며 실제 게임 성공이나 공개 실행 준비 완료가 아니다.

## 5. 남은 경계

- 역사적 복구 field-diff 실패의 정확한 발생 단계는 미확정이다. 후속 PASS나 IOException 경계 개선만으로 과거 원인을 소급 확정하지 않는다. 긴 경로 별도 오류와도 묶지 않는다. 짧은 경로/기존 managed 경로 시험은 수행했으나 모든 Windows 경로 길이를 지원한다는 보증은 아니다.
- C production은 B 관측 이력·blocked·확인량0·executionAllowed=false다. 안정적 workId/정원/실수령 귀속/실비용/보상 관계의 공식 증거가 부족한 상태에서 자동 실행을 열지 않는다. 추가100 완료는 가짜 CLI+임시 DPAPI 합성 결과다.
- 전체 회귀를 통과하여 C 저장·복구 후보와 N04 최소 제품/시험·한국어 인계를 선별 전송 후보로 정리할 수 있다. **이번 작업의 commit/push 승인 없음.** 원격은 B971a4d8 그대로이며 index는 비워 둔다. 별도 승인 시 개인12·원본 로그/DPAPI·사본을 제외하고 정확한 파일 및 공통 문서 hunk를 다시 검토한다. 운영 IRIS0.4.3/main/DB/Production/공개 잠금과 executionConnected=false 유지, 실제 CLI/게임/사용자 원장 변경0.
