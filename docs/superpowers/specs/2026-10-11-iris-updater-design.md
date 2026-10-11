# IRIS 사용자 클릭 자동 업데이트 설계

2026-10-11 KST · 영겁 · 로컬 구현용, 운영 미배포

## 승인과 목적

한설은 새 버전일 때만 Beta 버전 오른쪽에 강조 버튼을 표시하고 클릭 후 내부 다운로드·설치·자동 재시작하는 방향을 승인했다. 후속으로 설계 정리 후 추가 질문 없이 같은 대화에서 바로 구현하도록 지정했다. 이에 설계/계획의 별도 대화 승인 대기는 생략하고 작성·자체 검토·직접 구현한다. 기존 로컬 미커밋 기능을 함께 사용해야 하므로 현재 codex 기능 브랜치에서 기존 변경을 보존한다. push/운영 배포/공지 게시/실사용 앱 강제 교체는 포함하지 않는다.

## 사용자 흐름

- 설치된 실행 파일의 버전과 업데이트 지원 여부를 native bridge가 전달한다. 웹 표시 버전으로 설치 버전을 추측하지 않는다.
- 시작 후와 화면 복귀 시 새 배포 정보를 확인한다. native에서 30분 제한·단일 요청을 보장한다. 같은 버전/구형 버전/조회 실패 때 새 업데이트 버튼을 만들지 않는다.
- 새 버전이 있으면 버전 오른쪽에 테마색 업데이트 버튼, 정적인 강조와 키보드 포커스를 표시한다. 반복 점멸은 하지 않는다.
- 클릭 후 설명/새 버전/업데이트 노트/명시적 취소를 표시하고 업데이트를 시작한다. 내부 다운로드이며 ZIP을 사용자가 직접 다룰 필요는 없다.
- 다운로드·전체 패키지 검증은 앱을 유지한 채 한다. 설치 준비 완료 뒤 현재 작업을 보호 보관한다. 입력 오류·진행 중 파티 변경·보관 실패면 종료/설치하지 않는다. 자동 DB 재시도/버리기는 하지 않는다.
- 별도 helper가 준비된 패키지만 사용해 부모의 정상 종료를 기다리고 기존 앱 파일을 백업·교체한 뒤 재시작한다. 시작 전 취소는 가능, 다운로드·검증 시작부터 재시작까지 중복 제출/추가 변경을 막는다. 다운로드 진행 중 취소는 현재 후보의 알려진 제한이며 후속 개선한다.
- 새 앱의 native WebView 초기화 확인을 받아 성공을 확정한다. 운영 웹/게임 연결 장애만으로 설치를 실패 처리하지 않는다. 설치/실행 실패면 원본 파일을 복원하고 기존 앱을 다시 실행한다. 강제 종료는 이번 helper가 실행한 정확한 새 앱에만 제한한다. 게임·기존 사용자 앱을 종료하지 않는다.

## 경계와 배포 정보

- Windows x64 production 포터블 앱만 지원한다. 개발 PowerShell 호스트/일반 브라우저/구형 EXE는 설치 버튼을 지원하지 않는다. 현재 공개 ZIP에는 updater가 없으므로 최초 updater 포함 버전은 한 번 수동 다운로드가 필요하다.
- 무료 미서명 선택을 유지한다. 관리자 권한 요청/서비스/예약 작업/보안 기능 비활성화/CLI·WebView Runtime 자동 설치는 없다. Windows 차단 가능성을 숨기지 않는다.
- 고정 HTTPS 운영 도메인의 `/IRIS/downloads/download.json` 및 `/IRIS/downloads/IRIS-beta.zip`만 native가 요청한다. 임의 URL/경로/명령을 웹에서 받지 않고 리다이렉트를 거부한다. hash는 전송/패키지 무결성 확인이며 운영 호스팅 침해까지 막는 별도 서명이 아니다. 배포 계정/HTTPS 신뢰가 남는 경계다.
- 배포 metadata는 schemaVersion1, product IRIS for SANCTUM, channel beta-candidate, architecture win-x64, signature unsigned, version 숫자3자리, updaterVersion1, minUpdaterVersion1, queueSchemaVersion3, UTC 생성시각, ZIP size/hash, payload file name/size/hash 목록을 가진다. 구형 metadata나 지원 불가 형식은 자동 설치 대상이 아니다.
- ZIP 32MiB 이하, metadata 64KiB 이하, 압축 해제 총96MiB 이하. 고정 payload9개와 manifest.json만 허용하며 경로/중복/대소문자 변형/링크/폴더·추가 파일은 거부한다. 각 파일 크기/hash와 내부 manifest의 동일 release 정보까지 검증한다.
- payload: IRIS.exe, IRIS.Updater.exe, IRIS.ico, Microsoft.Web.WebView2.Core.dll, Microsoft.Web.WebView2.WinForms.dll, WebView2Loader.dll, README.txt, LICENSE.WebView2.txt, NOTICE.WebView2.txt.

## 구성

`desktop-update-policy.cs`: release parser/version/고정 이름·크기·hash·ZIP 검증. `desktop-update-install.cs`: 준비/백업/journal/복원/재시작 handshake. `desktop-update.cs`: 고정 HTTP·native 상태/단일 작업. `desktop-update-helper.cs`: 최소 helper 진입점. build-beta.ps1이 동일 버전정보로 앱/helper/metadata를 만든다.

기존 DesktopBridge에 updater 전용 state/check/prepare/apply만 추가한다. 실제 파일 경로/토큰은 응답에 포함하지 않는다. 기존 source·route·epoch·replay 검증을 재사용한다. async 응답은 epoch 변경 시 폐기한다. UI는 지원 확인 이후에만 동작하며 종료·설정·파티 쓰기와 경합하지 않는다.

## 데이터 및 실패 복구

보호 대기함·WebViewProfile·로그인 쿠키·테마·게임 설정·CLI는 설치 대상에 포함하지 않는다. 업데이트의 staging/backup/journal은 LocalAppData/Sanctum/IRIS/Updates의 임의 transaction 폴더에 보관하며 native/helper만 결정한다. install 경로의 root·reparse point·읽기전용 파일·transaction 경로 중첩을 거부하고 정상 종료 전에 쓰기 가능성을 확인한다. 원래 파일의 hash를 준비 때 기록하고 교체 전에 재확인한다.

모든 원본 백업 후 journal/설치 폴더의 transaction marker를 먼저 기록한다. 파일 교체는 같은 폴더의 임시 파일과 원자 교체를 사용한다. 복구 가능한 백업은 성공 뒤에도 당장 삭제하지 않는다. 다음 일반 실행에서 미완료 marker가 있으면 복구 helper로 연결하며 알 수 없는 marker는 덮어쓰지 않는다. 실패 기록에는 개인정보/키/대기함 본문을 넣지 않는다. 정상 rollback 불가(다른 프로세스 잠금/권한/복구 파일 손상)면 보존하고 수동 복구 안내를 표시한다.

## 검증과 출시 경계

실제 production DB 쓰기 없이 metadata/버전 비교·오래된 bridge·malformed/epoch·중복 요청·다운로드 변조·ZIP traversal/추가/중복/링크·원본 변경·잠금/부모 미종료·복원·재시작 확인을 임시 폴더/합성 native 프로세스로 검증한다. UI는 실제 컴포넌트와 native 응답 경계 fixture로 320/390/768/1280px, 테마·글자 크기·취소/키보드·보관 실패·패키지 실패를 확인한다. 전체 Node·tsc·native compile/fixture·분리 웹 build 후 교차 리뷰한다.

새 빌드는 임시 출력에만 만든다. 공개 ZIP/metadata 교체·IRIS/SANCTUM 버전 상승·운영 노트 수정은 별도 push/배포 요청 이후 적용한다. 정상 EXE 업데이트를 지원한다고 보고하기 전 임시 fixture뿐 아니라 실제 앱 재시작·다른 PC·Windows 경고 검증의 남은 범위를 명시한다.
