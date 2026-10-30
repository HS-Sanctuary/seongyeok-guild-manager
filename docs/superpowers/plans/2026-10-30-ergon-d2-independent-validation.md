# ERGON D-2 정식 인수·Windows 확인창·업데이트 호환 검증

## 목표·경계

기준6a55aa0/제품9c4070a, 기존2b45184 대비31파일을 수신/ACK했다. 기존 B/C/D-0/D-1/D-2를 재작성하지 않는다. 테스트 전용 root·가짜 계정/목표·실제 WinForms/WebView2/DPAPI와 고정 구버전 reader만 사용한다. 실제 CLI·게임/원장·운영 DB/flag/main·IRIS/ZIP·commit/push0이다.

## Task 1 — 수신·기존 집중 회귀

- 기존 개인16을 포함한 원본/옛후보·ACK34/N049 지문 확인, 깨끗한 관리 worktree ff-only6a55aa0와 ACK.
- 수신31파일과 QA 대조, 정식 D2 domain/host/compat driver를 짧은 소스 전용 사본에서 실행한다. last-domain-root 같은 시험 전역 파일은 직렬 접근한다.
- 목재35→55→정정50·중복 op/CAS/ACK·쓰기 장애·scope/epoch·unknown·C/legacy 합산 분리를 실제 수신 소스로 확인한다.

## Task 2 — 호환 A~D와 정책 (별도 담당)

- 신규 고유 합성 프로세스로 old→new·new→old拒否/no-write·중단/업데이트 응답 유실·new복귀를 검증한다.
- 고정2b reader와 운영 main0.4.3의 실제 source/compile 목록을 구별한다. 구버전 reader 시험을 실제0.4.3앱 시험이라고 하지 않는다.
- 감사 prefix/revision/digest·암호문/백업을 비교하고 자동초기화/변환은 하지 않는다. 필요한 스키마/정책 수정은 설계안으로만 남긴다.
- 신규 파일은 desktop-life-manual-upgrade fixture/runner·Node계약·전용 한국어 호환 QA다.

## Task 3 — 실제 Windows 확인창 GUI (fixture 담당 + 순월 조작)

- 기존0.4.3 소스 전용 격리 builder와 전체 DesktopPage를 재사용한다. CUA로 실제 제품 MessageBox의 승인/취소를 클릭하며 fake bool승인을 실제GUI로 보고하지 않는다.
- native game tracker/CLI·외부 요청/창·실제 updater를 사본에서 차단하고 테스트 소유 UUID/profile/store/PID만 사용한다. 기본 실행과 임의root/외부origin을 거부한다.
- 정상35/취소/닫기/실제120초 만료·승인 대기 문맥변경·ACK/read 유실·초안 종료/로그아웃/업데이트/전환·float/sidebar·좁은폭/큰글자를 확인한다.
- GUI fault 주입은 소유 테스트 데이터 제어에 한정한다. Windows 조작은 Computer Use JS만 사용하며 실제 PC 절전이나 사용자 앱 종료는 하지 않는다.
- 격리를 입증하지 못한 조합은 미실행으로 보고하고 대체 합성 PASS와 분리한다.

## Task 4 — 최종 회귀·안전 검토·인계

- 신규 fixture 관련 RED→GREEN, 수신native실제compile·D2/N04/C/B·관련React/저장/재화/ASTRA·전체Node·타입·변경lint·격리Next build·diff체크를 최종소스로 실행한다.
- 독립 안전검토1회, C/I 처리와 남은항목을 구분한다. 시험 전역/port/PID 경합을 피하고 원문 최초실패를 보존한다.
- 한국어 QA 첫 요약은 완료/아직 안됨/다음으로 작성. 실제 사용자 시험 가능 여부는 GUI/reader/실제앱·운영 정책의 증거 범위에 따라 판정한다.
- HANDOFF/TO_YEONGGEOP/ERGON_NEWOL에 로컬 미전송 인계, 개인/ACK/N04 지문 재확인. commit/push 없이 종료한다.
