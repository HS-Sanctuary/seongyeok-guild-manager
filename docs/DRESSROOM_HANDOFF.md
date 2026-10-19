# 드레스룸 전용 작업 인계

- 작성 순월 / 2026-10-19 KST. 집의 미전송 변경을 받지 않은 독립 작업이다.
- 브랜치: codex/gnosis-dressroom. 기준: 운영 origin/main 1d8e3749f306456bea1c2a7b2e05da813b98e5fa.
- 폴더: C:/Users/sungw/.codex/worktrees/gnosis-dressroom/seongyeok-guild-manager.
- 기존 IRIS 폴더와 개인 변경/삭제/새 파일은 보존했다. 원격 IRIS의4234e54는 ls-remote로 존재만 확인했고 기존 폴더에 pull/merge하지 않았다.
- 현재 변경은 본 인계와 설계 문서뿐이다. 제품 코드·게임 모델·새3D의존성·DB·RLS·main·push·배포 없음.
- 현재 로컬: npm ci --ignore-scripts 완료(365 packages), 독립 TypeScript exit0, Node 전체455/452PASS/3기존skip/0fail, dev127.0.0.1:3100. /gnosis/write HTTP200, 기존 패션 옵션 브라우저 표시 확인. 이 화면은 기존 시제품이며 새 드레스룸 완성이 아니다.
- 비밀값 보존: 환경 파일은 Git 제외. 기존 공개 Supabase 연결 설정2개만 분리 폴더에 복사, 서버키/로그인코드 복사0. 새 운영 데이터 작성/게임 행동0.

## REA 조사 근거

- REA capture_browser_scenario Evidence ev_a3ad5b96a1b575c88ee624d9895cc9544825440f3f9e27d16ed52fbef418f797.
- 임시 Chrome headless로 https://erinn.kr/dressroom 접속→7초대기, 네트워크 메타데이터/최종DOM 관측. 종료 terminated-owned-process. 관측 completeness complete, page-error0. 초기 호출의 action 스키마 검증 오류3건 뒤 유효 입력으로 실행했으며 오류 호출은 페이지 실행 증거가 아니다.
- 관측된 자료: /model/b20261018/manifest.json, costume-catalog-kr.json, regions/kr/customize.json, body_rig.json, eye_layers.json, expression.json; body/costume/customize/environment GLB와 PNG 이미지.
- 이것은 자료 요청의 관측이다. 리그 호환성·염색 셰이더·재사용 권한·실제 코디 공유 저장 경로는 미확인이다. 원문 DOM/다른 사이트 코드/모델을 제품에 복사하지 않았다. REA 원문은 세션 보관 Evidence이며 Git에 넣지 않았다.
- 별도 PowerShell JSON 직접조회2건은 HTTP403이었다. 브라우저 관측 성공과 직접 다운로드 가능성을 혼동하지 않는다. 우회/추가 다운로드하지 않았다.

## 영겁이 이어받을 때

1. 집의 아직 보내지 못한 변경을 먼저 확인해 커밋으로 안전하게 보존한다. reset/force/파일 덮어쓰기 금지.
2. 드레스룸 브랜치 push 여부와 정확SHA를 확인한다. 이번에는 push 요청이 없으므로 원격에서 보인다고 가정하지 않는다.
3. 설계 docs/superpowers/specs/2026-10-19-gnosis-dressroom-design.md의 승인 상태부터 확인한다. 현재 작성 설계 검토 대기이며 상세 구현 계획/제품 구현 전이다.
4. 집의 app/gnosis/*/package-lock.json 변경 여부를 대조한 뒤 통합한다. 오래된 운영기준 공통 HANDOFF/릴레이를 최신 파일에 통째로 덮어쓰지 않는다. 본 전용 인계를 최신 공통 문서에 누적한다.
5. 운영DB/main병합/배포는 별도 승인 경계다. 공식push시 필수문서·최신릴레이·검증결과를 함께 갱신한다.
