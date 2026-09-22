# SANCTUM Supabase 구조 기준서

> **스냅샷 기준:** 2026-09-22 KST
>
> **출처:** 한설이 Supabase SQL Editor에서 실행해 전달한 public 스키마 컬럼 목록(최대 100행), RLS 현황 JSON, `db backup/0919` CSV의 헤더
>
> **중요:** 이 문서는 실제 데이터·입장 코드·API 키를 포함하지 않는다. 데이터베이스 구조의 현재 확인본이지, 추측으로 완성한 설계도가 아니다.

## 1. 이 문서를 쓰는 방법

- 영겁은 DB 관련 작업 전 이 문서를 먼저 확인한다.
- 한설 또는 영겁이 DB 구조를 바꾸면 같은 작업에서 이 문서와 마스터 가이드, 업데이트 노트, 인계 문서를 갱신한다.
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

## 6-1. 준비된 계정 보안 1차 마이그레이션 (아직 운영 DB 미적용)

파일: `supabase/migrations/20260922_account_code_hash_and_login_rpc.sql`

- 기존 `accounts.code`의 값으로 `code_hash`(bcrypt)를 채운다. 기존 평문 코드는 검증 기간 동안만 남긴다.
- `sanctum_verify_login` RPC는 닉네임·접속 코드가 맞을 때만 안전한 계정 기본 정보만 반환한다.
- `sanctum_request_join` RPC는 신규 가입 코드를 해시로 저장한다.
- `sanctum_sessions`는 서버가 발급한 웹 로그인 세션의 **토큰 해시**와 만료 시간만 저장한다. RLS를 켜고 브라우저 직접 접근 정책은 만들지 않는다.
- 실행 전 Supabase Database Backup을 만들고, 실행 직후에는 로그인·가입 신청·승인 계정을 각각 한 번씩 확인한다.
- 이 단계가 안정화된 뒤 별도 마이그레이션으로 `accounts.code` 평문 제거 여부를 결정한다. 지금 제거하면 복구와 롤백이 어려워지므로 함께 삭제하지 않는다.

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
