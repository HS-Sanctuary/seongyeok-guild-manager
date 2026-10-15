# REA 로컬 설치·집 PC 인계

## 사무실 설치 — 2026-10-15 09:32 KST / 순월

- 한설의 `REA 설치해서 해보자` 승인으로 공식 npm `rea-agents@6.5.0` 고정 버전 설치·연결. Node24.18.0, 요구사항은22.19+/24.11+/26+ 계열. 전역 프로젝트 의존성 추가 없이 npm 패키지 캐시/버전고정 npx 실행 사용.
- Codex 사용자 설정의 `mcp_servers.rea`만 추가: `cmd.exe /d /c npx -y rea-agents@6.5.0 mcp`, startup30초. 기존 설정 바이트 prefix 보존 확인, 로컬 `config.toml.rea.backup` 유지. 설정 파일·백업·캐시·인증정보는 Git에 넣지 않는다.
- 정식 스킬 경로는 사용자 `.agents/skills/reverse-engineer-anything`, package판 workflow42/tool_count207. 초기 설치 도우미가 만든 `.codex/skills` 사본은 소스판으로 tool_count와 고정버전 치환이 달랐으며, 공식 setup으로 올바른 스킬을 설치했다. 이 작업이 만든 중복 사본만 `.superpowers/rea-install/manual-skill-6.5.0-backup`으로 보관(삭제0/개인 스킬 덮어쓰기0).
- fresh `doctor --client codex --skill --json`: exit0/healthytrue/skillaligned. 별도 stdio MCP initialize→tools/list207→binary_session({}) PASS, targetfree/게임파일읽기0/소비명령0. 이 smoke는 서버 동작 증거이며 현재 Codex 대화의 도구 연결을 증명하지 않는다. Codex 재시작 뒤 실제 REA 도구 노출 확인이 필요하다. 스킬도 다음 턴/재시작에 인식된다.
- Ghidra/Java/Hopper/IDA 등 추가 분석 엔진이나 Rust 도구체인은 설치하지 않았다. native 심층분석은 별도 필요성과 범위를 확인한다. 타 앱·게임의 실제 분석·실행/원본 수정/데이터 추출0, 생텀 앱코드/DB/운영 배포/commit/push 없음.

## 집 영겁 PC

### 사무실 실제 연결 후속 — 2026-10-15

Codex 정상 재시작 뒤 이 대화에서 실제 `binary_session(expected_package_version:"6.5.0")` 도구 호출이 성공했다. actual client와 서버 버전6.5.0/207도구/alignment aligned 확인, open:false/분석 중인 대상 없음. 앞선 ‘재시작 뒤 확인 필요’는 설치 당시 경과이며, 게임·타앱 분석 완료를 뜻하지 않는다. 설치/doctor를 반복할 필요는 없다.

REA 실행 환경과 사용자별 Codex 연결은 PC마다 별도 설치해야 한다. Git pull은 이 문서와 우리가 작성한 코드만 전달하며 사무실의 REA 캐시/설정/스킬/백업을 설치하지 않는다.

영겁에게 보낼 말:

> 순월이가 사무실에 REA6.5.0을 설치했어. docs/REA_SETUP.md를 읽고 집에도 같은 버전으로 Codex 한 곳만 연결해줘. 먼저 현재 Node·기존 연결·스킬을 확인하고 설치 변경 미리보기와 백업을 보존해줘. 게임 파일 수정·실행 중 개입·추가 분석 엔진 설치는 하지 말고, 연결 점검 뒤 Codex 재시작이 필요한지 알려줘.

설치 담당자가 확인할 기본 순서(사용자는 직접 실행할 필요 없음):

```powershell
node --version
npx --yes --ignore-scripts rea-agents@6.5.0 setup --client codex --dry-run --json
```

검토한 경로·변경 범위가 승인되면 같은 Codex 범위로만 적용한다. 설정 출력에 비밀값이 섞이지 않게 원문을 채팅에 붙이지 않는다.

```powershell
npx --yes --ignore-scripts rea-agents@6.5.0 setup --client codex --yes --json
npx --yes --ignore-scripts rea-agents@6.5.0 setup --skill-client codex --yes --json
npx --yes --ignore-scripts rea-agents@6.5.0 doctor --client codex --skill --json
```

현재 대화에 도구가 없더라도 설치를 반복하지 말고 Codex를 정상 재시작한 뒤 확인한다. 정적 파일 분석은 대상별 허용 범위를 먼저 확인하고, 런타임 관찰·게임 동작은 별도 승인 없이 확대하지 않는다.

## 역할 구분

- Rust: 프로그램을 작성하는 언어. 기존 C#/TypeScript 코드를 설치만으로 Rust로 바꾸지 않는다.
- REA: 프로그램 구조·배포 파일 분석을 돕는 도구. 원래 소스가 있는 일반 코드 분석에는 기존 검색·파일 도구를 먼저 쓴다.
- GitHub: 우리 코드·설계·설치 지침을 버전 관리. 개인 설정·도구 설치·비밀값·타 앱 전체 파일을 자동 동기화하는 수단이 아니다.

공식 출처: [REA 설치](https://github.com/morluto/rea/blob/main/docs/installation.md), [Rust](https://rust-lang.org/learn/), [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
