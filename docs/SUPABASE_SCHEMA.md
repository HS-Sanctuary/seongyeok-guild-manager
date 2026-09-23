# SANCTUM Supabase 구조 기준서

> **스냅샷 기준:** 2026-09-22 KST
>
> **출처:** 한설이 Supabase SQL Editor에서 실행해 전달한 public 스키마 컬럼 목록(최대 100행), RLS 현황 JSON, `db backup/0919` CSV의 헤더
>
> **중요:** 이 문서는 실제 데이터·입장 코드·API 키를 포함하지 않는다. 데이터베이스 구조의 현재 확인본이지, 추측으로 완성한 설계도가 아니다.

## 1. 이 문서를 쓰는 방법

- 영겁과 순월은 DB 관련 작업 전 이 문서를 먼저 확인한다.
- 한설, 영겁 또는 순월이 DB 구조를 바꾸면 같은 작업에서 이 문서와 마스터 가이드, 업데이트 노트, 인계 문서를 갱신한다.
- 구조 변경 SQL은 가능한 경우 `supabase/migrations/YYYYMMDDHHMM_설명.sql`로 저장한다. 운영 DB에 먼저 실행하고 나중에 기억으로 SQL을 재작성하지 않는다.
- 테이블/컬럼이 이 문서에 없다고 해서 "절대 없다"고 단정하지 않는다. 최신 추출로 확인하기 전까지는 **미확인**으로 취급한다.
- 실제 행 데이터, `accounts.code`, 서비스 역할 키, API 키는 이 문서에 절대 적지 않는다.

## 2. 현재 확인된 public 테이블 (25개)

| 분류 | 테이블 |
| --- | --- |
| 계정·캐릭터 | `accounts`, `characters`, `activity_logs`, `weekly_stat_snapshots`, `sync_batches` |
| 공지·커뮤니티 | `notices`, `notice_comments`, `boards`, `gnosis_guides`, `lounge_posts`, `inquiries` |
| 파티·실시간 제보 | `parties`, `abyss_reports`, `deep_holes`, `server_events` |
| 운영 카탈로그 | `nexus_banners`, `nexus_classes`, `nexus_contents`, `nexus_tasks`, `nexus_trades`, `nexus_missions`, `nexus_purchases`, `nexus_titles`, `content_power_reqs`, `guild_settings` |

## 3. RLS 현황

### RLS 사용 중

| 테이블 | 정책 수 | 비고 |
| --- | ---: | --- |
| `accounts` | 4 | 로그인·가입·역할의 핵심 테이블 |
| `activity_logs` | 2 | 활동 기록 |
| `characters` | 2 | 캐릭터/숙제 핵심 테이블 |
| `inquiries` | 2 | 1:1 문의 |
| `lounge_posts` | 2 | 라운지 게시물 |
| `nexus_classes` | 1 | 직업 마스터 데이터 |
| `parties` | 2 | 파티/길드 버스 |

### RLS 꺼짐 또는 정책 미적용

`abyss_reports`, `boards`, `content_power_reqs`, `deep_holes`, `gnosis_guides`, `guild_settings`, `nexus_banners`, `nexus_contents`, `nexus_missions`, `nexus_purchases`, `nexus_tasks`, `nexus_titles`, `nexus_trades`, `notice_comments`, `notices`, `server_events`, `sync_batches`, `weekly_stat_snapshots`.

2026-09-23 운영 DB 읽기 전용 재검사에서 위 18개 테이블 **모두** `anon`에 INSERT·UPDATE·DELETE 중 하나 이상의 쓰기 권한이 있고 RLS가 꺼진 것으로 확인됐다. `accounts.code`와 `accounts.code_hash`도 `anon` SELECT 권한이 참이다. 실제 권한 변경은 아직 하지 않았다. 브라우저의 기존 직접 쓰기와 외부 동기화 호출을 서버 인증 경로로 옮기기 전에 일괄 차단하면 기능이 중단될 수 있다.

`notices`는 정책 2개가 존재하지만 RLS가 꺼져 있어 현재 정책이 적용되지 않는다. RLS를 켜기만 하면 브라우저의 기존 직접 호출이 멈출 수 있으므로, 인증 방식과 서버 Route Handler 정비 없이 일괄 활성화하지 않는다.

## 4. 핵심 테이블 상세

### `accounts`

| 컬럼 | 타입/기본값 | 용도 |
| --- | --- | --- |
| `id` | uuid, `gen_random_uuid()` | 계정 식별자 |
| `nickname` | text, 필수 | 길드/로그인 표시 이름 |
| `code` | text, 필수 | 현재 입장 코드. 평문 보관 확인됨 — 노출 금지 |
| `code_hash` | text, 보안 1차 마이그레이션 후 추가 | bcrypt 접속 코드 해시. 신규 로그인은 이것만 사용 |
| `role` | text, 기본 `길드원` | 길드마스터·부마스터·길드원 역할 |
| `status` | varchar, 기본 `승인대기` | 가입 승인 상태 |
| `created_at` | timestamptz | 생성 시각 |

### `characters`

| 구역 | 컬럼 |
| --- | --- |
| 식별·소유 | `id`, `nickname`, `owner`, `alias`, `sort_order`, `is_main` |
| 기본 스탯 | `job`, `combat_power`, `magic_resistance`, `life_energy`, `charm`, `intro`, `contribution` |
| JSONB 상태 | `levels`, `daily_checks`, `weekly_checks`, `raid_checks`, `trade_checks`, `rankings` |
| 시간 | `created_at`, `updated_at`, `last_active_at` |

`combat_power`, `magic_resistance`, `life_energy`, `charm`은 text 타입이다. 숫자 정렬/계산 전 안전하게 숫자로 변환해야 한다. JSONB는 부분 수정 시 전체 객체 덮어쓰기와 동시 저장 충돌에 주의한다.

### `notices`

백업 헤더에서 확인된 컬럼은 `id`, `type`, `title`, `content`, `author`, `is_pinned`, `created_at`, `poll`, `link`, `likes`, `dislikes`, `comments`다.

- KERYGMA 공지·투표·댓글 트리를 한 테이블에서 처리한다.
- `content`는 HTML을 포함할 수 있으므로 출력 전 허용 HTML 정제가 필요하다.
- 향후 `SANCTUM 시스템` 자동 공지에는 중복 방지를 위한 버전 식별자 또는 별도 게시 기록 구조가 필요하다. 구현 전에는 새 컬럼을 임의로 가정하지 않는다.

### `parties`

백업 헤더에서 확인된 컬럼은 `id`, `content_name`, `sub_content`, `difficulty`, `time_start`, `time_end`, `max_members`, `members`, `status`, `created_at`, `matching_mode`, `wanted_roles`, `party_type`, `final_start_time`, `leader_name`, `memo`, `party_date`다.

- SYNAXIS와 길드 버스가 사용하며 Realtime 구독 코드가 있다.
- `members`의 실제 데이터 형식(JSON 또는 텍스트)은 최신 스키마 추출에서 다시 확인해야 한다.

### 기타 확인된 테이블과 백업 헤더

| 테이블 | 확인된 핵심 컬럼 |
| --- | --- |
| `abyss_reports` | `id`, `reporter_name`, `hole_time`, `status`, `channel`, `created_at` |
| `activity_logs` | `id`, `character_name`, `content_name`, `difficulty`, `action`, `created_at` |
| `boards` | `id`, `board_type`, `author_id`, `is_anonymous`, `title`, `content`, `read_by`, `created_at` |
| `content_power_reqs` | `id`, `content_type`, `content_name`, `difficulty`, `min_cp`, `rec_cp`, `op_cp`, `content_id`, `rec_mr`, `op_mr`, `max_members` |
| `deep_holes` | `id`, `zone`, `channel`, `reporter_name`, `reported_at` |
| `gnosis_guides` | `id`, `category`, `sub_category`, `title`, `content`, `author`, `youtube_id`, `item_data`, `created_at` |
| `guild_settings` | `id`, `category`, `data`, `updated_at` |
| `inquiries` | `id`, `category`, `title`, `content`, `author`, `is_secret`, `status`, `created_at`, `reply` |
| `lounge_posts` | `id`, `title`, `content`, `author_name`, `category`, `likes`, `created_at` |
| `nexus_banners` | `id`, `message`, `is_active`, `created_at` |
| `nexus_classes` | `id`, `name`, `icon`, `is_active`, `created_at`, `role`(화면 확인) |
| `nexus_contents` | `id`, `type`, `name`, `short_name`, `is_weekend`, `is_active`, `created_at`, `mobile_name` |
| `nexus_tasks` | `id`, `type`, `name`, `max_count`, `is_active`, `created_at`, `mobile_name` |
| `nexus_trades` | `id`, `map`, `npc`, `reward`, `reward_cnt`, `cost`, `cost_cnt`, `limit`, `reset_type`, `scope`, `created_at` |
| `server_events` | `id`, `boundary_remaining_sec`, `boundary_status`, `abyss_time_text`, `abyss_remaining_sec`, `deep_reset_sec`, `senmai_channels`, `pale_mountain_channels`, `updated_at` |
| `sync_batches` | `id`, `started_at`, `status`, `total_targets`, `matched`, `failed`, `requested_by` |
| `weekly_stat_snapshots` | `id`, `character_id`, `character_nickname`, `combat_power`, `life_energy`, `charm`, `week_start_date`, `created_at` |

`nexus_missions`, `nexus_purchases`, `nexus_titles`, `notice_comments`는 존재와 RLS 현황은 확인했지만, 이번 컬럼 추출 범위 밖이다. 최신 스키마 추출 전에는 컬럼을 가정하지 않는다.

## 5. 코드와 DB의 확인 필요 항목

- 코드의 `components/character/CharacterStats.tsx`는 `members`를 조회한다. 현재 확인된 25개 테이블 목록에는 없다.
- 코드의 `app/lounge/components/AstraView.tsx`는 `homework_status`를 조회한다. 현재 확인된 25개 테이블 목록에는 없다.
- 두 항목은 과거 테이블 잔재, 다른 스키마, 또는 실제 런타임 오류 후보다. 베타 핵심 테스트 전에 Supabase에서 존재 여부와 호출 결과를 확인한다.
- `notice_comments` 테이블이 별도로 존재하지만 KERYGMA 현재 코드는 `notices.comments` JSONB를 갱신한다. 댓글 데이터의 단일 기준점을 정하기 전에는 두 구조를 혼용하지 않는다.

## 6. DB 변경 체크리스트

1. 변경 목적과 대상 테이블/컬럼/정책을 설명한다.
2. 영향받는 페이지·API·권한·기존 데이터를 확인한다.
3. 복구 방법을 정한다. 삭제/변환이면 백업과 되돌릴 SQL을 먼저 마련한다.
4. 검토 가능한 SQL 마이그레이션을 `supabase/migrations/`에 추가한다.
5. 한설의 승인을 받은 뒤 운영 DB에 적용한다.
6. 적용 후 스키마·RLS·정책을 재조회해 이 문서에 실제 결과를 반영한다.
7. 관련 코드 동작과 빌드, 실제 화면을 확인한다.
8. 공식 push 시 마스터 가이드, 릴리스 노트, 인계 문서를 함께 갱신한다.

## 6-1. 계정 보안 단계별 적용 상태 — 2026-09-23

- `supabase/migrations/20260922_account_code_hash_and_login_rpc.sql`은 과거 초안이다. `accounts.code`가 `NOT NULL`인 현재 구조에서 해시만 쓰는 가입이 실패하므로 **실행하지 않는다**.
- `supabase/migrations/20260923_accounts_prepare.sql`(Phase A)은 운영 DB에 적용됐다. 기존 코드의 bcrypt 해시 갱신, 구버전 롤백 호환용 코드 동기화 트리거, 서버 전용 로그인·가입·시도 제한 함수와 `sanctum_sessions`·`sanctum_login_attempts` 테이블을 추가했다. 기존 계정·코드·캐릭터 행을 삭제하거나 제약을 약화하지 않았다. 신규 가입 코드도 전환 기간에는 기존 컬럼에 남으므로 별도 승인된 회전·평문 제거 작업이 필요하다.
- `supabase/migrations/20260923_accounts_lockdown.sql`은 별도 승인 단계다. 서버 전용 키 설정, 준비 SQL 적용, 새 로그인·가입·승인 흐름의 실제 검증 후에만 `accounts`의 `PUBLIC`·`anon`·`authenticated` 접근과 과다 허용 정책을 차단한다.
- 한설이 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`를 Vercel Production·Preview에 저장했다고 확인했다. 새 배포부터 적용된다. 읽기 전용 확인 결과 운영 계정 13개 모두 해시를 보유하고 누락은 0이며 새 테이블·함수는 모두 존재한다.
- 최근 자동 백업은 2026-09-23 08:14:31 KST다. 전체 복원은 이후 기록을 잃을 수 있어 기본 복구 방법으로 삼지 않는다. `accounts.code` 평문 제거는 로그인 전환 검증 후 별도 결정한다. 계정 외 다른 관리자 테이블의 브라우저 쓰기·RLS도 확대 베타 전 조사한다.

## 7. 최신 스키마 갱신용 읽기 전용 SQL

아래 쿼리는 구조를 읽기만 하며 데이터를 바꾸지 않는다. 결과를 JSON/CSV로 전달받아 문서를 갱신한다.

```sql
select
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

```sql
select
  c.relname as tablename,
  c.relrowsecurity as rls_enabled,
  count(p.polname)::int as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relname;
```
