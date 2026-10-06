# Sanctum IRIS — 배포 준비·규약 점검

확인일: 2026-10-03 KST. 조사 결과이며 인증서 구매·스토어 등록·배포 승인이 아니다. 현재는 로컬 PowerShell/WinForms 알파이며 설치형 제품이 없다.

## 한설에게 필요한 구분

| 항목 | 의미 | 현재 판단 |
|---|---|---|
| 설치 패키지 | 사용자가 설치/제거/업데이트하는 묶음 | MSI/EXE와 MSIX를 비교할 단계. 확정 아님 |
| 코드 서명 인증서 | 앱의 배포자와 파일 변조 여부를 확인 | HTTPS 인증서와 별개. 제작 후 공개 배포 전에 결정 |
| SmartScreen 평판 | Windows가 새 파일/배포자를 신뢰하는지 평가 | 서명만으로 첫 실행 경고 제거를 보장하지 않음 |
| Store 심사 | Microsoft 배포 채널의 심사 | 게임 CLI/loopback/동반 도구 작동 및 심사 적합성 미확인 |
| 게임 운영정책 | 게임/외부 도구 사용의 허용 경계 | 공식 CLI 사용과 제품 배포 허용을 같은 것으로 보지 않음 |
| 음악 연동 동의 | 각 서비스가 허용한 범위의 로그인·권한 | 계정 ID 입력만으로 연동하지 않음 |

## Windows 서명: 확인한 사실

MSIX 설치에는 유효하고 기기에서 신뢰되는 서명이 필요하다. 자체 서명은 개발·관리된 테스트용이지 길드원에게 임의 루트 인증서 설치를 요구하는 공개 배포 해법이 아니다. 서명 시 타임스탬프도 고려해야 한다. [Microsoft MSIX 서명](https://learn.microsoft.com/en-us/windows/msix/package/signing-package-overview)

Microsoft Store의 MSIX 경로는 Store가 다시 서명한다. Store의 MSI/EXE 경로는 배포자가 서명해야 하므로 두 경로를 혼동하지 않는다. Azure Artifact Signing의 공개 신뢰 인증은 현재 지역 제한이 있어 한국 개인 개발자에게 바로 사용 가능하다고 가정할 수 없다. 기존 CA 인증서도 개인/조직 자격, 키 보관 방식, 실제 견적 확인 전 구매하지 않는다. 공식 안내 페이지 간 예시 비용도 다르므로 가격을 확정 예산으로 쓰지 않는다. [Microsoft 서명 선택지](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)

서명된 새 실행 파일도 SmartScreen 경고가 날 수 있다. EV 인증서도 즉시 경고 면제를 보장하지 않는다. 배포 안내에 “백신/SmartScreen 끄기”를 해결책으로 쓰지 않는다. [Microsoft SmartScreen 평판](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)

## 게임과 콘텐츠: 확인한 사실·남은 판단

Nexon은 AI 커넥터 가이드와 외부 도구 연동 운영정책을 제공한다. 허용되지 않은 변조와 다른 이용자의 게임 이용 방해는 금지되며 사용자의 행위 책임도 명시한다. 공개 가이드 존재만으로 IRIS의 직접 CLI 호출 방식·프로그램 재배포가 별도 승인됐다고 표현하지 않는다. 게임 CLI 실행 파일/게임 이미지/음원은 IRIS 설치물에 무단 포함하지 않는다. 공개 배포 전에 커넥터를 호출하는 동반 읽기 프로그램의 허용 범위를 Nexon에 확인하는 것을 release gate로 둔다. 현재 게임 조작·메모리 읽기·후킹·입력 자동화는 넣지 않는다. [운영정책 11항](https://mabinogimobile.nexon.com/Support/Policy/2753857), [공식 커넥터 가이드](https://mabinogimobile.nexon.com/Info/Guide/3545322)

주변 연주는 CLI의 곡 제목·진행 시간·복사 가능 여부까지만 계약을 확인했다. 연주자 닉네임/악보 원문/작곡가를 자동 추정하거나 복사 불가 악보를 우회하지 않는다. MoFo 구현과 코드/어셋 라이선스는 확인하지 않았으므로 복제 허용 또는 동일 기능 실현을 단정하지 않는다.

Spotify는 OAuth 기반 사용자 동의가 필요하고 개발 모드 최대 5명, 앱 소유자의 Premium 조건 등 제한이 있다. 길드 최대 40명 제공을 확정하지 않는다. YouTube Data API의 플레이리스트 조회는 YouTube Music 전체 라이브러리·백그라운드 스트리밍 권한을 증명하지 않는다. 멜론은 공식 사용 가능한 연동 API/계약을 아직 확인하지 않았다. 목록 조회·현재 재생 정보 표시·실제 음원 재생은 각각 별도 검토한다. [Spotify 인증](https://developer.spotify.com/documentation/web-api/concepts/authorization), [Spotify 제한](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [YouTube playlists.list](https://developers.google.com/youtube/v3/docs/playlists/list)

## 제품화 권장 순서 — 아직 구현/인증 완료 아님

1. 로컬 모듈창/캐릭터 연결 기능과 종료·복구·저장 검증.
2. 컴파일된 데스크톱 실행 파일로 전환 가능성 검증: Node/PowerShell을 사용자가 별도 설치해야 하는 현재 조건을 줄인다. 동반 프로세스 실행/정리·실행 경로/무결성부터 정리한다.
3. 깨끗한 Windows PC에서 일반 사용자 권한 설치·실행·제거·업데이트 및 CLI 경로 탐색을 확인. 관리자 실행을 기본 요구하지 않는다.
4. 배포자 이름/지원 연락처·최소 지원 Windows/CPU·런타임·서명/배포 채널을 확정. 한국 개인의 실제 발급 자격과 비용 확인은 사용자와 함께 한다.
5. 라이선스 목록/SBOM·의존성 보안 업데이트·동봉 고지, 데이터 처리 설명/동의/연결 해제/로컬 설정 삭제를 준비한다. 법적 적합성을 단정하지 말고 공개·유료화 범위가 결정되면 별도 검토한다.
6. 서명된 산출물과 해시·버전 manifest를 검증하고 이전 정상 설치물로 복귀하는 절차를 준비한다. 자동 업데이터는 임의 URL 코드 실행 없이 서명/해시 검증 후에만 도입한다.
7. 실제 배포 전 게임 정책 확인·서명·외부 인증 정책·완전한 설치 검증 결과를 함께 보고하고 한설 승인받는다.

현재 미완료: 설치 패키지, 서명 인증서/키, Store 심사, Nexon 배포 허용 확인, music OAuth 앱 등록, 업데이트 서버, 라이선스 전체 조사, 다른 PC 설치 검증. 지금은 구매나 외부 등록을 수행하지 않는다.
