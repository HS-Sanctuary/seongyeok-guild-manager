# 2026-10-19 집 통합 인계 — GNOSIS + 주말 IRIS

## 최종 현황 — 2026-10-19 21:00 KST

추가 사용자 승인 뒤 제품3e6f7ae456576dd8bb145b91a1dddd6082d5c2da를main/통합브랜치에정상push했다. 웹v2.32/IRIS0.4.0은운영공개됐고 Vercel dpl_7rwKTwyaDQNrYN49xnvTLcRhCh5V Ready/Production/현재도메인·정확SHA/운영ZIP595194·SHAea2a4f784fde6e79b632582681525e651b9ac1debcbb61aab57d58ce4ec04fd3/4폭·핵심익명경로를확인했다. DB구조·권한변경0/ERGON잠금·GNOSIS메뉴준비중유지. 아래공개보류·0.3유지는당시경과다. 아이콘표시는사용자추가승인으로첫실행시‘아이리스 로고.ico’별칭/호환IRIS.ico숨김, oldhelper계약유지. 공지작성만뉴월부마스터권한disabled로한설계정전환대기·未게시이며공개다운로드는바로가능하다. 자세한결과는최신HANDOFF/RELEASE_NOTES/TO_SOONWOL부터읽고문서마감까지최신HEAD를받는다.

## 전송 확인 — 2026-10-19 20:07 KST

- 통합 제품 커밋 `64cdd50c36619677a50900d41ac15d28d080e39d`를 `origin/codex/home-gnosis-iris-integration-20261019`에 정상 push했고 `ls-remote`가 정확히 일치했다. 이 결과를 적는 문서 마감 커밋까지 브랜치 최신 HEAD를 받는다.
- push 직전 fetch에서 순월 브랜치 `06c4097`, 운영 main `1d8e374`가 그대로임을 확인했다. main 병합·강제 push·운영 DB·수동 배포·공지 게시·공개 ZIP 변경은 실행하지 않았다.
- GitHub Vercel 상태는 제품 커밋 기준 pending이다. [자동 미리보기 상태](https://vercel.com/sanctum-sanctuary/sanctum/CTJVJ6ZKwCn5vMkP7WBQuBaKQ3pN). Ready나 보호된 실제 Preview 화면 확인으로 간주하지 않는다.
- 마지막 보존 재검: 개인 파일/삭제 상태6개, 공통7문서 양쪽7,115줄, 순월 제품40파일 누락·변경 오류0. 이번 마감은 문서만 추가하며 구조 변경 없음.

## 내일 순월이 받을 기준

- 통합 브랜치: `codex/home-gnosis-iris-integration-20261019`.
- 집 주말 복구 기준: `82e2325` (선행 집 HEAD `95e38a4`).
- 순월 인계: `06c4097` / 제품 `83b437a`, 공통 기준 `1d8e374`.
- 이 문서는 개발 인계다. 운영 main 병합·DB 변경·운영 배포·업데이트 공지 게시를 승인하거나 완료한 기록이 아니다.
- 최종 전송 SHA는 `docs/relay/TO_SOONWOL.md`의 전송 결과와 사용자에게 전달한 SHA를 확인한다. 문서 마감 커밋까지 포함한 브랜치 최신 HEAD를 받는다.

## 보존과 충돌 비교

- 병합 전 변경 88개를 ignored `.superpowers/sdd/2026-10-19-home-integration/before-merge`에 파일 복사·SHA-256·tracked binary patch로 보존했다. 비밀 환경 파일/브라우저 저장소를 Git에 넣지 않았다.
- 주말 제품 변경은 개인 문서를 제외하고 복구용 로컬 커밋 `82e2325`에 먼저 보존했다. 원래 집 브랜치와 사무실 브랜치를 reset/force/clean으로 교체하지 않았다.
- 제품 코드는 자동 병합됐고 공통 문서 6개에서만 충돌했다. 최신 집 기록 1~3일분을 오래된 사무실 문서로 덮지 않고 두 기록을 모두 누적했다. 순월의 4234e54 범위 ACK와 그 이후 미확인 집 누적은 구분했다.
- 통합 직후 검증: 문서를 제외한 집 파일 83개 바이트/삭제 상태 동일, 공통 7문서 양쪽 비어 있지 않은 7,115줄 누락0, 사무실 제품 파일 40개 내용 동일. 이후 아래 IRIS 중단 작업만 의도적으로 보완했다.
- 개인 변경은 미커밋 상태로 그대로 보존·제외: `docs/UPDATE_POST_v2.151.md`, `tests/kronos-theme-preview.mjs`, 루트 `아이리스 실행 파워셀 명령어`, 루트 개인 문서 3개의 기존 삭제 상태. Git에 없는 개인 설정·환경 파일도 건드리지 않았다.

## 이번 통합의 실제 범위

- GNOSIS: 순월의 메인·분류·rich editor·댓글·사진/팔레트 개인 저장·공유를 그대로 받았다. `DRESSROOM_HANDOFF.md`와 `GNOSIS_HOME_MERGE_20261019.md`를 함께 읽는다.
- GNOSIS 개인 저장과 게시물은 브라우저 localStorage 시제품이다. 실제 3D 의상 착용/의상색 렌더러, 계정별 클라우드 저장/다중 사용자 서버 게시/운영 분류 저장은 여전히 미완료다. 사무실 브라우저의 개인 코디·확인 글이 Git으로 전달되는 것은 아니다.
- IRIS: 한설이 주말 마지막 native 적용 후 기능창 유지와 WASD가 함께 잘 된다고 확인했다. 현재 후보는 원형 플로팅·자유 이동·좌표 분리/설정 분류/알림/캐릭터 말풍선과 관련 회귀 수정까지 포함한다. 다른 PC·다중 DPI 전부 검증한 것으로 확대하지 않는다.
- ERGON: 모든 환경의 기본 UI는 자물쇠·준비중·disabled, stale external section도 작업대를 mount하지 않는다. 실제 native bridge/host도 새 prepare/confirm/collect와 floating ergon 진입을 차단한다. stop/cancel/history/reconciliation 및 기존 계획·원장은 보존한다. 테스트의 명시적 development 전용 opt-in을 실제 앱/사용자 설정으로 노출하지 않는다.
- 업데이트: 단일 기존 updater가 플로팅 기능창의 작은 요약 상자로 portal 표시된다. 버전별 변경 두 줄과 기존 보호 업데이트 창으로 이어지는 버튼을 제공한다. 중복 조회/설치 경로를 만들지 않고 설치 전 보호 보관 흐름을 유지한다.
- 표시용 IRIS 소스 후보는 `0.4.0`, 요약은 `public/IRIS/notes/0.4.0.json`이다. **공개 ZIP/download.json은 기존 0.3.0 그대로이며 운영 출시가 아니다.** 비공개 native 빌드만 준비했다. 임시 개발 focus 진단 endpoint/코드는 제거했고 ignored 원본 기록과 복구 커밋은 보존했다.

## 검증과 한계

- 전체 Node: 604개, 601 PASS / 기존 skip3 / fail0.
- state cache 변경 뒤 최종 재검에서 기존 hotfix 표시 시험의 useState 대체가 새 기본값을 undefined로 만들던 문제를 확인했다. 생략된 state는 실제 initializer를 쓰도록 fixture를 보완해 단독4건 및 전체604건을 다시 통과했다. 제품 코드를 시험용 undefined 상태에 맞춰 약화하지 않았다.
- GNOSIS 및 수정한 IRIS 범위 ESLint PASS. 전체 관리자 lint의 기존 부채까지 해결했다고 주장하지 않는다.
- 실행 중인 개발 서버의 `.next/dev/types`에는 제거된 진단 route 참조가 남아 루트 tsc가 실패했다. 캐시/서버를 강제 삭제하지 않고 비밀 환경값 없는 정확한 임시 소스 사본에서 독립 `tsc --noEmit --incremental false` PASS와 Next webpack 60페이지 build PASS를 별도로 확인했다.
- 실제 격리 production 브라우저: GNOSIS 게시판→드레스룸, 새 브라우저 개인 저장/재로드, 공유 Escape, 글쓰기 및 320/390/768/1280px 가로 넘침0 PASS. 외부 네트워크 차단, 운영 DB/실제 개인 저장소 쓰기0. 첫 시험의 숨긴 dialog 중복 문구 선택자는 visible status로 좁혔다.
- production 로컬 GET: gnosis/write/dressroom 200, 개발 전용 admin-preview 404, 제거된 focus-debug 404.
- ERGON native default lock(실제 소비 delegate0), stop/history 유지, native chrome93/bridge/private compile PASS. 실제 UI의 양쪽 자물쇠·클릭 차단/세션 mount0, 플로팅 업데이트 요약·버전 캐시·보호 dialog·다른 모듈 왕복·좁은 폭·구 native, 포인터 입력 복귀 합성 PASS.
- 독립 읽기 전용 통합/잠금/updater 검토 Critical0/Important0. GNOSIS 전체 재심사·실게임·사용자 설치본 교체 성공·공개 ZIP 출시 판단은 그 검토 범위 밖이다.

## 이어갈 일과 승인 경계

1. 순월은 사무실 dirty와 개인 파일부터 보존하고 통합 브랜치를 fetch/pull한다. 이 최신 문서·HANDOFF·양쪽 릴레이를 읽고 ACK를 남긴다. 원래 드레스룸 브랜치로 집 코드를 교체하지 않는다.
2. 한설에게 **운영 배포 별도 승인**을 받은 뒤 IRIS 출시 경로를 결정한다. 이 통합 전체를 main에 올려 GNOSIS localStorage 시제품까지 무심코 공개하지 않는다. 필요하면 운영 기준에서 IRIS만 담은 별도 출시 브랜치로 분리한다.
3. IRIS 0.4.0 최종 ZIP/manifest/hash 및 0.3.0→0.4.0 실제 helper·새 offline WebView 교체/보호 파일 해시 보존 시험이 남는다. 실제 사용자 IRIS는 정상 종료 확인 후에만 재실행한다. 강제 종료/보안 우회 금지.
4. 승인된 출시의 Ready·운영 화면·다운로드 해시 확인 뒤에만 중제목/문장별 줄바꿈의 따뜻한 IRIS 공지 초안을 기존 정상 관리자 UI로 게시한다. `docs/UPDATE_POST_IRIS_0.4.0.md`는 아직 초안이다. 운영 DB 직접 쓰기로 게시하지 않는다.
5. ERGON 가죽+100개→1회등록은 미완료다. 이번 잠금이 수량 가공 완성을 뜻하지 않는다. 원본 unknown 원장·보호 상태를 임의 해제하지 않는다. 실제 게임 행동은 별도 직전 승인 경계를 유지한다.
