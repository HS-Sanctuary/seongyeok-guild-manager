# IRIS 에르곤 메뉴·저장 안내 구현 계획

> **For agentic workers:** Use superpowers:executing-plans for this bounded UI implementation. No game action is authorized by this UI plan.

**Goal:** 승인된 세 상위 메뉴와 생활 마크, 필요한 순간에만 나타나는 저장 안내를 제공한다.

**Architecture:** 기존 센터의 숨김 유지 패널에 에르곤 소개를 추가한다. 보호 대기함·저장 엔진은 변경하지 않고 저장 표시만 body 포털로 옮긴다. 표시 위치는 기존 환경별 로컬 외형 설정으로 격리한다.

**Tech Stack:** React, TypeScript, 테마 CSS, 코드 기반 SVG.

**Spec:** 2026-10-13 한설이 승인한 대화 디자인: 한글 두 줄/선택 영어 한 줄, 수평 교차전환과 빛 스침, 4모서리 저장 안내와 미리보기. 실제 생활 실행은 별도 안전 설계 후 연결.

## Global Constraints

- 기존 캐릭터·클래스 초안·저장·오류 복구·컴팩트 창 위치 동작 유지.
- DB·API·native bridge·게임 명령·패키지 버전 변경 없음.
- SVG는 `public/svgs/UI mark/생활 마크.svg`, `viewBox="0 0 64 64"`, currentColor.
- 위치 기본 오른쪽 아래. 미리보기 4초, 완료 3초, 미확인 오류는 유지.
- 주간/5시간 사용량 확인. 5시간 잔여 2–3%면 신규 작업 중단, 인계 기록 및 승인된 체크포인트 push.

## Review Focus

- 좁은 창/22pt에서 영어 메뉴 잘림 없이 3열 유지.
- 컴팩트 모드 포털 클릭이 메뉴를 닫지 않음.
- 계정 전환·모달 중 다른 계정의 저장 안내 노출 방지.
- 로컬 저장 차단 시 세션 설정 유지, 실패 안내.
- 에르곤·미리보기 조작은 저장/게임 IO를 발생시키지 않음.

## 실행 체크

- [x] 실제 컴포넌트 SSR/로컬 저장 테스트 5개 RED 확인 후 구현.
- [x] DesktopMainTabs/DesktopErgon/SVG: 기존 패널 숨김 유지, 한글 접근성 이름 보존.
- [x] DesktopSaveStatus body 포털/유휴 숨김/실패 복구 유지, useDesktopAppearance/설정/page 위치·미리보기 연결.
- [x] 실제 브라우저: 폭 360/390/600/720, 글자 6/13.5/22pt, 6테마, hover/focus/reduced-motion, 4모서리/재시작/오류/컴팩트 확인.
- [x] 타입·관련 lint·전체 Node·격리 build·최종 독립 리뷰.
- [x] 로컬 화면 확인 경로 및 남은 생활 실행 설계 전달. 사용자 파일 보존.

## 진행 기록

- 후속 승인: 한글 크로노스.14em/에르곤.42em 자간, 실제제목/부제폭0.9~1.1 PASS. 시낙시스 기능설명제목·에르곤 단일기능설명제목/브랜드·그리스어소개제거 SSR RED→GREEN. actualSynaxisSurface 제목/조회버튼 360/390/720×18/29.333px PASS. 전체461/458PASS/3skip·tsc exit0/관련eslint0errors·기존공용hookwarning1. 별도 기능 착수설계는 사용자검토 대기이며 UI 계획을 생활실행 승인으로 확대하지 않는다.

- 구현 전 테스트 5개 실패, 구현 후 관련 SSR 29/29 PASS. 기존 유휴 안내 테스트는 새 요청대로 빈 렌더를 기대하도록 변경했고 저장 설명 테스트는 실제 변경이 있는 상황에서 유지했다.
- 모든 구현은 동일 사무실 폴더에서 진행: 현재 앱과 공유해야 하는 로컬 UI 요청이며 개인 변경을 포함하지 않는다. 새 배포·업데이트 게시·게임 명령은 수행하지 않는다.
- 최종: node --test --test-concurrency=1 tests/*.test.mjs → 460/457PASS/3기존skip/0fail, tsc/관련eslint exit0, 격리webpack58 exit0. 실제 UI 새 fixture 및 기존 feature-picker 회귀 PASS. Windows sandbox의 경로/소켓 거부는 정상 승인 실행으로 검증했고 설정·보안 우회 없음. 브라우저 fixture3011 충돌1회는 단독 실행으로 해소, 앱 결함으로 간주하지 않는다.
- 독립 리뷰 Important1: 스탯·추천 모달 뒤 저장 안내 → 실제 DesktopStatsConfirmation 시험 RED(visibletrue) 후 공통 visible aria-modal CSS 차단 GREEN(화면/접근성숨김). hidden retained 모달은 활성 안내를 막지 않음도 PASS. 부제 최소 가독성은 프로젝트 기준에 맞춰 정상18px에서12px로 조정, 큰 글자/좁은창 다시 PASS. 실제 게임·다른DPI는 판단 범위 밖으로 유지한다.
- 기존 전체시험의 버스 알림 간헐1회 실패는 숨기지 않고 BETA_FEEDBACK에 기록, 단독25/25 및 최종 전체 재검PASS. 해당hook/DB는 수정하지 않았다.
- 마지막 사용량: 5시간 잔여69%, 주간21%. 중단/push 조건(잔여2–3%) 미충족. 후보는 로컬 미커밋/미배포 보존. SVG 요청 안내 docs/IRIS_ASSET_PROMPTS.md, 로컬앱 PID1864/HTTP200/stderr0. 화면 캡처 .superpowers/iris-ergon-preview.png는 실제 컴포넌트 합성 데이터 미리보기이며 사용자 실제 게임 캡처가 아니다.
- 사용자 실제 상위 메뉴 화면 확인 후 SVG와 부제의 간격 부족 제보. 아이콘/글자 사이 여백을 창 폭에 비례하는 2cqw로 넓히고 생활 마크의 추가1.1배 확대를 제거했다. 영어는 확보된 영역에 맞게3.6cqw로 조정. 실제 icon box/텍스트 사이 최소4.5px 시험 RED→GREEN, 12폭·pt 조합에서 글자 잘림과 간격/새UI 전체 흐름PASS, 관련SSR29/29PASS. 저장/게임 연결 변경 없음. launcherPID1864는 후속조회에서 종료됨; 사용자 첨부로 실제 새 메뉴 화면 확인, 강제종료0.
