# IRIS 게임 창 내부 플로팅·최소화 — 2026-10-18

## 요청과 범위

한설 요청: 플로팅 위치를 마비노기 창 내부로 제한하고 IRIS 최소화는 플로팅 아이콘으로 전환한다. 기존 현재폴더/추가확인 없는 일반 구현 지시에 따라 진행했다. 로고 크기·Alt+백틱/괄호없는 Alt + ~·기존 계획/원장 보호는 유지한다. 새 게임 명령/DB/API·운영배포/push 없음.

## 구현

- `DesktopGameWindowTracker.ClientBounds`: 기존 추적 PID/HWND/제목·생존을 재검증한 창의 client 영역만 읽는다. 제목 표시줄/테두리를 제외한다. Windows 읽기 API만 사용하며 게임창을 이동하거나 입력하지 않는다. IRIS HWND의 DPI awareness context에서 조회하고 원래 thread context를 복원한다.
- `FloatingContainer`: client와 모니터 작업영역의 교차 안에 로고·키캡·메뉴·임시 기능창을 배치한다. 게임 이동만큼 앵커를 이동시키고 크기축소 때 안으로 보정한다. 게임 창을 일시적으로 잃으면 마지막 안전 client 경계를 유지한다. 일반 IRIS 창의 좌표는 덮지 않는다.
- `WM_MOVING`: 실제 OS 드래그 제안 RECT도 경계 안으로 보정한다. 드래그 시작에 임시 메뉴를 접고 마지막 경계 보정 뒤 앵커를 저장한다.
- `MinimizeToFloating`: 기존 bridge 최소화와 Windows SC_MINIMIZE를 같은 표시 전환으로 처리한다. 임시 모듈도 닫고 로고로 남는다. 게임 자체의 최소화에 따라 programmatic WindowState를 바꾸는 기존 동작은 가로채지 않는다. 종료/미저장/unknown 보호와 무관하다.
- **복구 가정:** 게임을 한 번도 찾지 못했거나 표시 가능한 공간이96×128DIP보다 작을 때는 기존 monitor 복구를 보존한다. 유효 game client를 확인한 상태에서의 내부 제한과 구분한다. 이 예외는 한설에게 중간 안내했다. 복구 예외까지 무조건 게임 내부라고 주장하지 않는다. `FloatingLayout.FitsContainer`의 DPI별 최소 공간 검사를 현재/마지막 경계와 실제 layout 계산에 함께 사용한다.

## 검증

- RED: 실제 Form의 Windows 최소화가 로고로 남지 않음 → 최소화 전환 GREEN.
- RED: logo/keycap이 monitor에 남아 game client 밖임 → client 경계 GREEN.
- RED: 임시 HWND/제목 상실 때 monitor로 벗어남 → 마지막 안전 경계 GREEN.
- native chrome48PASS: titlebar 있는 전용 game Form, client 좌표일치, live WM_MOVING RECT, 양끝 드래그,40/30 이동동기화, 크기축소, 임시기능창, 반복최소화, 일반창복원, 게임주도최소화 보존. 실제 게임/사용자 WebView 세션은 사용하지 않았다.
- addon82PASS 및 기존 floating/presentation/workspace-docking/startup-close/WebView/bridge 회귀 PASS. 최종 Node576/573PASS3기존skip0fail. 비공개 nativecompile exit0(공개다운로드 복사 없음). 최종 diffcheck PASS.
- 독립검토 C0/I0/M1: 고배율·작은 가시영역에서 음수 로고 geometry가 가능했다. DPI384/96×128 viewport 거절 회귀 RED를 확인한 뒤 DPI별96×128DIP admission과 layout guard를 적용했다. 96/144/192/288/384/768DPI 최소영역에서도 최대 설정80DIP 로고와 키캡이 경계 안에 유지되는 정책시험 GREEN. 첫 수정의 불필요한 Ceiling(int) 컴파일 모호성은 제거했다. 최종 정책시험은 샌드박스 임시폴더 저장에서 실패했으나, 전용 새 임시 fixture만 사용하는 권한 재시도에서 PASS했다. 실제 사용자 설정/게임은 접근하지 않았다. 수정 후 chrome48/addon82/Node전체/privatecompile을 다시 통과했다. 재검토는 하지 않았다.
- DPI 보완 중 physical→logical 재변환을 추가하자 client 확인 회귀가 실패했다. IRIS HWND와 같은 DPI context에서 client를 읽고 별도 재변환하지 않는 방식으로 바꾼 뒤 실제Form 경계가 다시 일치했다. 실제 서로 다른 DPI 모니터 간 이동 검증은 별개다.

## 적용 상태·남음

이 문서는 로컬 후보다. 새 native를 실행중 사용자 IRIS에 재적용하거나 강제 종료하지 않았다. 정상 종료/재실행 후 최소화→로고, 경계 드래그, 게임 이동/크기변경을 실제 화면에서 확인해야 한다. 실제 게임 fullscreen/다중모니터/DPI/비용·수령을 합성 시험으로 대체하지 않는다. 기존 label nativeRegion 잘림/legacy캐릭터browser backdrop 실패·구locator·기존Synaxislint는 별개 미해결이다.

좌표 참고: [ClientToScreen](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-clienttoscreen), [Windows DPI virtualization](https://learn.microsoft.com/en-us/windows/win32/hidpi/high-dpi-desktop-application-development-on-windows), [PhysicalToLogicalPointForPerMonitorDPI](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-physicaltologicalpointforpermonitordpi). Microsoft도 API별 virtualization 문서가 완전하지 않음을 명시하므로 실제 mixed-DPI 성공을 단정하지 않는다.
