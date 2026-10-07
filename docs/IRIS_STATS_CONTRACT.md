# IRIS 스탯 저장 계약 조사 — 2026-10-06

현재 상태: 읽기 계약 조사 완료, 자동 DB 갱신 미구현/비활성. 본 문서는 운영 쓰기나 스키마 변경 승인이 아니다.

## 2026-10-07 기능 목록 재확인

- 한설이 “게임 조작 없이 기능 목록 조회만 승인해”라고 명시 승인한 뒤, 집 PC의 공식 CLI `capabilities` 한 번만 실행했다. exit0, 명령28개, loading 표기 없음. 실제 캐릭터 정보/게임 조작/DB 저장 명령은 실행하지 않았다.
- 전체 전투 클래스 목록·클래스별 레벨을 반환하는 명령/필드는 공개 목록에 없다. `get_my_info`는 `Level` 및 `EnabledCombatJobDisplayName`을 명시하지만, `Level`을 개별 전투 클래스 레벨로 해석할 근거가 없다. 사진의 생텀 저장 레벨 목록을 게임 읽기 결과로 표시하거나 다시 가져온 값으로 저장하지 않는다.
- 요청한 “생텀 저장→대상 닉네임 수동 확인→저장” 방향은 기록하되, 현재 공식 계약에서는 전체 클래스 자동 가져오기 구현을 보류한다. 닉네임 수동 확인이 존재하지 않는 데이터 조회를 가능하게 만드는 것은 아니다.

## 확인 근거

- 설치된 공식 `MabinogiMobile_CLI.exe capabilities`의 공개 계약만 조회했다. 28개 명령을 확인했으며 실제 캐릭터 데이터/게임 조작 명령은 실행하지 않았다.
- `get_my_info`의 OutputExample는 Title, RealmName, Level, EnabledCombatJobDisplayName 및 아래 스탯을 명시한다. 스탯은 `{ DisplayName, Value }` 객체다. Value의 정확한 숫자 타입/단위/범위는 이 설명만으로 확정할 수 없다.
- `iris/reader.mjs`, `docs/SUPABASE_SCHEMA.md`, 캐릭터 화면 저장 및 member-mutations 호출 경로를 읽었다. 운영 SQL/DB 조회·수정, 비밀값 추출은 하지 않았다.

## 필드 매핑 후보

| 대상 | 공식 필드/형식 | 현재 읽기 | 기존 DB 후보 | 판정 |
| --- | --- | --- | --- | --- |
| 현재 캐릭터 식별 | 닉네임/고유 ID 없음; RealmName은 서버명 | 신원 매칭 불가 | characters.id / nickname / owner | unsupported |
| 전투력 | CombatScore, DisplayName/Value 객체 | 숫자 정규화 | combat_power (문서상 text) | 필드 verified; 타입·단위 unverified |
| 생활력 | LivingScore, DisplayName/Value 객체 | 숫자 정규화 | life_energy (text) | 필드 verified; 타입·단위 unverified |
| 매력 | AttractivenessScore, DisplayName/Value 객체 | 숫자 정규화 | charm (text) | 필드 verified; 타입·단위 unverified |
| 마도저항 | ArcaneResistance, DisplayName/Value 객체 | 숫자 정규화 | magic_resistance (text) | 필드 verified; 타입·단위 unverified |
| 길드공헌도 | 공개 계약 없음 | 미지원 | contribution | unsupported |
| 모든 본인 캐릭터 스탯 | 전체 캐릭터 조회 명령 없음 | 미지원 | 본인 소유 목록과는 별개 | unsupported |

Title/직업/레벨/전투력 조합이나 주변 플레이어 목록은 고유 식별자가 아니다. UI에서 선택한 캐릭터를 게임이 제공한 신원으로 간주하지 않는다. 기존 생텀 클래스 저장값도 실제 게임 전체 클래스 조회 결과가 아니다.

## 후속 구현 전 필수 조건

1. 공식 신원 계약 또는 별도 서면 승인된 수동 연결 설계를 먼저 확보한다. 현재 설계를 약화해 추정 매칭하는 2단계 구현 계획은 작성하지 않는다.
2. 서버에서 세션 본인 소유를 검증하고 환경·계정·캐릭터·연결 epoch·관측 시각으로 격리한다. 늦은 응답/계정 전환/게임 캐릭터 변경/오래된 관측은 쓰지 않는다.
3. 누락/null/실패를 0으로 바꾸지 않는다. 실제 0과 감소도 보존한다. 기존 reader의 Number(null/빈 문자열)→0 변환은 표시용 구현일 뿐 저장 검증으로 재사용하면 안 된다.
4. 스탯 전용 허용 필드/범위/형식 검증 및 이전 값 비교(CAS)가 필요하다. 체크리스트 CAS나 관리자 전체 동기화 API를 일반 회원 스탯 쓰기로 재사용하지 않는다. 현재 앱의 길드공헌도 저장은 계정 소유 캐릭터 전체에 반영하므로 캐릭터별 공헌도를 추정해 덮어쓰지 않는다.
5. 보호 저장소 schema1을 임의 확장하지 않는다. 버전별 엄격 검증·명시 마이그레이션·복구 보류를 먼저 설계하고 숙제 큐와 독립적인 부분 성공/불명 결과를 처리한다. 지속 관측으로 15초 저장이 끝없이 밀리지 않아야 한다.
6. 변경 없음 0쓰기, 누락 유지, 0/감소, 타인 거절, 경쟁 수정, 부분 성공, 응답 유실, 재실행 보류를 합성 테스트로 먼저 증명한다.

결론: 네 개 스탯의 필드 이름은 확인했지만 자동 저장을 안전하게 허용할 신원 계약이 없다. 길드공헌도와 모든 캐릭터 일괄 갱신은 현재 공식 계약에서 지원하지 않는다. 숙제 저장/컴팩트 오버레이 후보 검증은 이 제한과 별개로 진행한다.
