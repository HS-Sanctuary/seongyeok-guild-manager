# IRIS 플로팅→사이드바 핫픽스 후보 — 2026-10-23

## 최종 운영 확인 — 2026-10-23 22:14 KST

제품 `b32c84759292855c72e6c501fe02564cdc0c8414` / `codex/iris-floating-sidebar-043-20261023`와 main 원격 일치. Production `dpl_HzZPriY1wNNNpQN4rDq3gdZ1rwg1` READY, 정확 main SHA 및 `sanctum-tawny-three.vercel.app` 도메인 할당을 확인했다. 같은 SHA의 Preview 성공만으로 운영 완료를 판단하지 않았다.

실제 운영 다운로드 화면 Beta 0.4.3을 시각 확인했다. 공개 download.json·notes/0.4.3.json, ZIP 598836 bytes / SHA256 `2bf026144bdf1ef7e7598137203dd25585274bcd58bcf8150b287cfa39a9111e`, 내부 9개 payload 크기·해시가 모두 일치했다. `/`, `/login`, `/character`, `/kerygma`, `/party`, `/iris/download`, `/iris/desktop` GET 200은 접속 확인이며 로그인 후 저장 성공을 뜻하지 않는다.

기존 Node 618건 중 615 PASS / 3 skip, 타입·격리 빌드·관련 React/native 합성 검증 결과는 아래와 같다. 실제 설치 교체 시험은 실행 중인 IRIS 보호로 중단되어 미통과다. 앱을 종료하거나 보호를 우회하지 않았다. 실제 설치본에서 게임 위 버튼 조작·다중 모니터 수동 시험·전체 runtime 로그 검사는 미실시다. 기존 updater 코드는 변경하지 않았지만 이 한계를 설치 성공으로 확대하지 않는다.

집 원본 개인 12항목 및 별도 ERGON N-R1/U-R1 미커밋은 보존했다. 본 핫픽스에는 미공개 ERGON 코드를 포함하지 않았다. ERGON 잠금·계정·큐·안전 원장·DB 유지, 실제 게임 명령·강제 종료·신규 공지 게시 없음. 이 마감은 문서만 추가 / 구조 변경 없음. 아래 미공개·승인 대기는 당시 경과로 보존하며 최신 상태는 이 절을 따른다.

## 공개 승인 후속

한설이 별도 질문에서 `0.4.3 운영 반영·공개 승인`을 명시했다. 아래 배포대기는 승인 전 경과다. 버전/노트/패키지를0.4.3으로 함께 준비한다. 운영 기준은 mainb0b63c7·Production dpl_GimXVW6ejrr2xcu4n27msrbNrdb9이며 다른 미공개ERGON 작업은 포함하지 않는다. 새 ZIP598836bytes/SHA256 `2bf026144bdf1ef7e7598137203dd25585274bcd58bcf8150b287cfa39a9111e`, 패키지allowlist/manifest/unsigned 및 실제 native컴파일 PASS. 기존 unsigned베타 안내 유지.

설치교체 policy 시험은 `Another IRIS running`으로 중단됐다. 실제 실행 앱의 공유 보호를 존중했고 종료/우회/잠금변경하지 않았다. 이 실패를 PASS로 숨기지 않으며 실제 실행 설치본 교체/게임 위 수동확인은 여전히 미검증이다. updater/queue/journal코드는 이번에 변경하지 않았다. public release metadata/모든내부payload/다운로드UI와정확Production SHA는 배포후 추가확인한다. DB·원장·게임·강제재시작 금지는 유지한다.

기준 main b0b63c7 / 운영 IRIS0.4.2. 브랜치 codex/iris-floating-sidebar-043-20261023. 한설 승인 범위는 별도 hotfix 구현·검증·기능브랜치 일반push까지다. 운영main/Production/새설치본 공개는 최종승인전 금지. 배포 시 제안버전은0.4.3이며 현재 lib 버전/공개 ZIP/metadata는0.4.2를 그대로 보존한다.

## 변경

DesktopFloatingHub의 설정 아래/종료 위에 `사이드바로 전환` 접근성명·title과 왼쪽 사이드바 창 SVG를 추가했다. 기존 normal 명령만 호출한다. native FloatingLayout은6개 원형 영역을 만들고 작은 높이에서는 크기를 제한해 겹침/끝부분잘림을 막는다. CreateRegion은 기존 ellipse 합집합을 그대로 사용한다. parser는4/5/6개 호스트를 지원한다. 4/5개 구호스트에는 없는 슬롯의 신규 버튼을 그리지 않는다. 기존 normal/floating host 전환 엔진·프로필·계정·저장·원장 소스는 수정하지 않았다.

## 검증

- RED: 신규6개 parser 및 native menu count 실패. GREEN: parser10시험/native layout·region·설정저장·단축키/복원 PASS.
- native:96/120/144/192 DPI(100/125/150/200%),320/390 포함 작업영역·4모서리/화면밖 anchor·36/52/80 아이콘. 버튼간 overlap0,작업영역내 bounds,원형센터 클릭/투명모서리 비클릭. 실제 사용자 Windows 모니터/게임 위 수동시험은 미실시.
- 실제 React+합성 bridge/hook:6버튼순서/normal복귀/플로팅재진입·설정·종료별도1회/동일 workspace mount1·편집초안/캐릭터표시보존·320/390 버튼bounds PASS. 일반부모nav가 box가 없다는 fixture wait 문제 및 합성panel의 잘못된 logo겹침을 시험에서 정정했으며 제품결함으로 숨기지 않는다.
- 전체 Node618 /615PASS/기존3skip/0fail. 독립타입 검사 PASS. 기존 header/save-strip/save-overlay/focus/public-lock 및 scoped lint 결과는 최종 실행 출력을 따른다. native presentation의 자동/수동복귀·override·설정 회귀 PASS.
- 실제 native 설치본에서 버튼을 눌러 게임 위 동작을 확인한 것은 아니다. native layout과 기존 presentation, React command/상태 전환을 분리 검증했다. 새설치본/ZIP생성·공개·실게임 명령0.

## 보존/다음

집 원본 개인12항목 및 별도 ERGON N-R1/U-R1 미커밋/ACK는 원래 위치에 그대로 남긴다. 미공개ERGON 기능브랜치 이식0, 공개lock/DB/main 유지. 이 브랜치를 기능브랜치 전체와 병합하지 않는다. 최종승인 뒤0.4.3 버전/notes·native컴파일·패키지/업데이트호환·공개해시를 함께 검증하고 공개해야 한다. 현재 후보 push를 운영배포완료로 보고하지 않는다.
