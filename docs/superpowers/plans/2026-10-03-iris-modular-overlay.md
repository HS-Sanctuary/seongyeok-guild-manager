# IRIS Modular Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline. 사용자 명시 지시로 중간 승인 대기를 생략하고 자율 실행·후보고한다.

**Goal:** 기존 게임 조회/두 단축키를 보존하면서 세 개의 독립 정보 창을 제공한다.
**Architecture:** 관리창 하나가 native 단축키·폴링·수명주기를 소유하고 모듈창이 같은 SnapshotDisplay 결과를 표시한다. 설정은 기존 안전 allowlist를 창별로 재사용한다.
**Tech Stack:** Windows PowerShell 5.1, WinForms, .NET Framework C#, Node test.
**Spec:** `docs/superpowers/specs/2026-10-03-iris-modular-overlay-design.md`

## Global Constraints

- 독립 stats/processing/missions 창. 기존 Ctrl+Alt+I/O 유지.
- 디스크에는 창별 xy/collapsed만 저장. 조회는 SnapshotPoller 하나.
- 현재 미커밋 의존 파일을 보존하여 현재 폴더에서 실행. commit/push/DB/배포/구매 제외.

## Review Focus

- 모듈마다 단축키 등록하여 충돌하지 않는가.
- 전체 복구가 개별 숨김 의도를 무시하지 않는가.
- 접었다 펼칠 때 긴 직업/수치가 잘리지 않는가.
- 관리창 종료 때 자식 창/설정/폰트가 누수되지 않는가.
- 숨김 후 오래된 값을 다시 표시하지 않는가.

### Task 1: 독립 모듈창과 관리창 통합

**Files:** create `iris/overlay-modules.cs`; modify `iris/overlay-native.cs`, `iris/overlay.ps1`, `iris/overlay-support.tests.ps1`.
**Interfaces:** OverlayWindow(bool ownsShortcuts), ShortcutOwner; ModuleWindow(string title,string[] fields,OverlayWindow owner), string[] values via SetValues(string[]), bool Collapsed/EnabledByUser, SetCollapsed(bool), RestoreIfEnabled(), HideByUser().

- [x] 테스트 먼저 추가: `ModuleWindow` stats 6행 초기값 `—`, SetValues로 6행 표시, 접기44/재펼침 원높이, 숨김 후 RestoreIfEnabled가 개별 의도를 보존. passive window는 ownsShortcuts=false와 owner 참조를 통해 복구 권한 판단.
- [x] `node --test iris/overlay.test.mjs`: missing module class로 FAIL 확인.
- [x] native에 passive constructor/owner 참조를 추가하고 module class 작성. 기존 native default는 단축키 소유를 유지.
- [x] overlay에서 기존 행 label 참조를 새 모듈로 이동. 관리창 모듈 표시 버튼·트레이 복구, 공통 모드 변경 적용. 창별 기존 Preferences 저장/화면 보정/종료 cleanup.
- [x] 실제 renderer/timer 테스트가 새 모듈에 같은 값 배분하는지 확인. 전체 `node --test`, PowerShell parse, C# compilation, git diff --check 확인.
- [x] 미커밋 유지, 결과/남은 수동 검증을 ledger/HANDOFF/relay에 기록.

### Task 2: 배포 준비 요건 조사

**Files:** create `docs/IRIS_DISTRIBUTION.md`; update `iris/README.md`, `docs/PROJECT_IRIS.md`.
**Interfaces:** 공식 링크·확인 시각·확인/미확인 구분이 있는 배포 체크리스트.

- [x] Microsoft 공식 코드 서명/MSIX/SmartScreen, Nexon AI 커넥터·운영정책, 음악 제공자 인증 제약 조사.
- [x] 앱 서명과 HTTPS 인증서를 구분. 인증서 구매/Store 등록/공개 배포는 실행하지 않음. 의존성 license/SBOM/개인정보·삭제·업데이트 검증 항목 포함.
- [x] 문서 링크와 사실 확인. 후속 본인 캐릭터 인증 연결 작업이 남았다고 명확히 기록.

## Execution ledger

- Ruling: 사용자 자율 실행·후보고 지시로 반복 승인 gate를 생략. 미커밋 alpha 의존성이 있으므로 현재 작업 폴더 유지; Git mutation/외부 배포는 별도 승인 전 미실행.
- Pre-flight: Task 1의 UI/native 변경과 Task 2 문서 조사에는 공유 코드 인터페이스 없음. 본인 캐릭터 인증 구현은 별도 다음 계획이다.
- Task 1: 모듈 3건과 실제 timer 배분 테스트 RED→GREEN. 별도 리뷰에서 모니터 제거 후 개별 창 회복 누락 Important 발견; 화면 보정 함수와 회귀 RED→GREEN으로 수정. system close로 timer 대상이 disposed되는 위험도 회귀 RED→GREEN으로 보완.
- Final: minor (deferred): 합성 60자 한글 직업명은 고정 값 열에서 잘릴 수 있다. 현재 실제 직업 표시는 실측 범위 내지만 다중 DPI/과도한 직업명에 대한 적응형 행 높이는 후속. 사용자 캐릭터 닉네임 선택 UI에는 별도 긴 이름 방어 필요.
- Final: Ruling: 게임 초점·실제 클릭 전달·트레이/드래그·다중 DPI·live handle 재생성·실제 프로세스 종료는 자동 테스트로 검증 완료라 간주하지 않음. 네이티브 UI 제어 제한을 우회하지 않고 한설 수동 확인 대기로 남김; 잘못 판단하면 현장에서 입력/복구 문제가 잔존할 수 있음.
- Task 2: Microsoft/Nexon/Spotify/YouTube 공식 문서로 docs/IRIS_DISTRIBUTION.md 작성. 멜론 API·MoFo 구현·Nexon의 IRIS 배포 허용·한국 개인 인증서 실제 발급 자격은 미확인으로 표시. 외부 등록/유료 구매 없음.
- 마지막 전체 검증: 연결 기반 Task1 추가 이후 node --test83/83, diff 통과. Native 모듈 후보와 게임상 사용자 실검증은 구분한다.
