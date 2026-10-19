# IRIS 0.4.0 공개 업데이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 플로팅 후보를 기존 업데이트 버튼과 공개 다운로드로 전달한다.

**Architecture:** 통합 기능 브랜치의 기존 updater/native gate를 유지한다. 공식 build-beta로 패키지를 만들고 원본 0.3.0 helper 교체와 보호 파일 보존을 증명한 뒤 main에 정상 통합한다.

**Tech Stack:** Next.js, Windows .NET Framework/WebView2, PowerShell, Git/Vercel.

**Spec:** `docs/HOME_INTEGRATION_20261019.md`, `docs/UPDATE_POST_IRIS_0.4.0.md`, 한설의 2026-10-19 공개 업데이트 승인.

## Global Constraints

- 개인 파일과 양쪽 미ACK 인계는 보존한다. 운영 DB 구조/권한은 변경하지 않는다.
- IRIS0.4.0, 웹 후속표시 v2.32. GNOSIS 메뉴는 기존 준비중, ERGON은 양쪽 UI/native 잠금 유지.
- ZIP은 기존 10개 allowlist만 포함, unsigned beta 고지 유지. 기존 사용자 IRIS·게임을 강제 종료하지 않는다.
- Ready·운영 다운로드 해시·핵심 화면 확인 전 출시 완료/공지 게시를 주장하지 않는다.

## Review Focus

- 오래된 helper가 새 ZIP을 설치하는지: 원본 공개0.3.0으로 offline fresh WebView 실교체 시험.
- 기존 설정/보호 대기함 보존: 교체 전후 파일 지문 동일.
- 설치 경로/비밀 파일 유출: allowlist·manifest·ZIP hash 시험.
- 준비중 기능 진입: 기존 ERGON gate 회귀와 GNOSIS PC/모바일 메뉴 링크 부재 확인.
- 배포 전후 혼합 캐시: 운영 metadata/version/실제 ZIP SHA 대조.

## Task 1 — 패키지와 릴리스 표시

- [x] 기존0.3.0 ZIP을 ignored 백업에 보존·추출한다.
- [x] 공개0.4.0 ZIP/metadata를 기존 `iris/build-beta.ps1 -PrepareDownload`로 생성한다.
- [x] `iris/release-package.tests.ps1`, updater policy/process/network 및 old→new live 시험을 실행한다.
- [x] `lib/release.ts`를 v2.32로 올리고 필수4문서/승인결정을 누적한다.

## Task 2 — 검증과 배포

- [x] 전체Node, 격리build/독립tsc, lock/updater/focus 브라우저 검증 및 독립 릴리스 검토.
- [x] diff 확인·개인변경 제외한 명시 staging·기능 push. 원격 main 최신 확인 뒤 정상 main push.
- [x] Vercel 성공 상태와 운영 download4폭/ZIP해시/핵심 익명경로·권한경계를 확인한다.
- [x] 기존 정상 공지 UI로만 승인된 IRIS 공지 게시(세션/권한 없으면 사용자 행동 요청), 중복 게시 금지.
- [x] 정확SHA/배포·남은 제한을 필수4문서와 릴레이에 누적·push한다.

## Execution Ledger

- 21:25KST 마감: 0.4공지는한설권한전환뒤정상UI게시id19/표준제목·시스템작성자·중제목7개·note=iris최신연결확인. 이후실사용저장P1을별도핫픽스0.4.1(4480646)/웹v2.321로검증·배포Ready·실다운로드대조. 한설최신지시로0.4.1신규공개공지0·앱요약‘버그픽스’만. 상세는최신HANDOFF/릴레이. 기존대기기록은당시경과로보존.

- 21:00KST: 제품3e6f7ae main+통합push/원격exact. 배포dpl_7rwKTwyaDQNrYN49xnvTLcRhCh5V 실제로그인UI Ready/Production/Current domain/SHA일치, 운영4폭·ZIP해시/핵심익명경로·publicnotes PASS. 공지권한뉴월부마스터disabled로한설계정전환요청·未게시, 보호우회0. 문서결과마감후정확HEAD인계.

- 20:52KST: Task1검증 완료. 추가 bounded 아이콘표시 설계를 한설이 승인했다. helper기존이름 유지/실행시동일바이트별칭·원본숨김, TDD/패키지hidden RED→GREEN·최종원본helper실교체PASS. 최종ZIP595194/SHAea2a4f784fde6e79b632582681525e651b9ac1debcbb61aab57d58ce4ec04fd3. fullNode601PASS3skip·웹60/독립타입·l​​int·lock/updater/focus PASS·독립release/icon각C0I0M0. 기존personal상태6개·7115문서줄·40GNOSIS제품 보존.

- 2026-10-19: 한설이 GNOSIS 코드 동반 push와 IRIS 플로팅 공개 업데이트를 명시 승인했다. 기존 DB 변경 별도 승인 원칙은 유지한다. 기존 요청의 연속 실행으로 추가 설계 확인 없이 직접 수행한다.
- GNOSIS의 현재 잠금은 PC/모바일 전역 메뉴의 comingSoon 링크 부재다. 기존 직접 URL의 로컬 시제품까지 접근권한으로 차단한 구조는 아니며, 이를 보안 잠금으로 표현하지 않는다.
