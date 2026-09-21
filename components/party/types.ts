export interface Member {
  name: string;
  character_name?: string;
  nickname?: string;
  job: string;
  roles: string[];
  role?: string;
  time_start: string;
  time_end: string;
  is_driver?: boolean;
  combat_power?: number | string;
  magic_resistance?: number | string;
  allow_repeat?: boolean;
  is_completed?: boolean;
  account_id?: string;
  owner?: string;
  cp?: number | string;
  owner_account?: string;
  character_id?: string | number;
  class_name?: string;
  is_highlighted?: boolean;
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
}

export interface Party {
  id: number | string;
  content_name: string;
  sub_content?: string;
  selected_sub_contents?: string[] | string;
  sub_contents?: string[] | string;
  memo?: string;
  difficulty: string;
  party_type: string;
  party_date?: string;
  time_start: string;
  time_end: string;
  max_members: number;
  matching_mode?: string;
  wanted_roles?: string[];
  members: Member[];
  status: string;
  leader_name?: string;
  final_start_time?: string;
  created_at?: string;
  is_started?: boolean;
}

export interface NexusContent {
  id: number;
  code?: string | null;
  type: string;
  name: string;
  short_name: string | null;
  mobile_name: string | null;
  duration_minutes: number;
  max_count: number;
  is_weekend: boolean;
  is_active: boolean;
}

export interface ContentPowerReq {
  id: number;
  content_id: number;
  content_type: string;
  content_name: string;
  difficulty: string;
  min_cp: number;
  rec_cp: number;
  op_cp: number;
  rec_mr: number;
  op_mr: number;
  max_members?: number; // 🛡️ Supabase DB 정격 인원수 컬럼
}

export interface NexusClassItem {
  id: number | string;
  name: string;
  role: "근딜" | "원딜" | "탱커" | "힐러" | "서포터";
}

export interface ContentItem {
  id: string;
  code?: string;
  name: string;
  category: "어비스" | "레이드";
  size: number;
  diffs: string[];
  defaultDiff: string;
}

export interface AbyssSubDungeon {
  id: string;
  name: string;
}

export const ROLE_COLORS: Record<string, string> = {
  "탱커": "text-[var(--text-main)] bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "힐러": "text-[var(--text-main)] bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "근딜": "text-[var(--text-main)] bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "원딜": "text-[var(--text-main)] bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "서포터": "text-[var(--text-main)] bg-[var(--inner-box)] border-[var(--panel-border)] font-bold"
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  "입문": "text-purple-400 bg-[var(--panel)] border-[var(--panel-border)]",
  "어려움": "text-amber-400 bg-[var(--panel)] border-[var(--panel-border)]",
  "매우 어려움": "text-rose-400 bg-[var(--panel)] border-[var(--panel-border)]",
  "지옥 1": "text-red-500 bg-[var(--panel)] border-[var(--panel-border)]",
  "지옥 2": "text-rose-300 bg-[var(--panel)] border-[var(--panel-border)]"
};

// 🎯 순수 어비스 던전명 리스트
export const ABYSS_SUB_DUNGEONS: AbyssSubDungeon[] = [
  { id: "abyss_1", name: "허상의 정박지" },
  { id: "abyss_2", name: "광기의 동굴" },
  { id: "abyss_3", name: "흩어진 물길" }
];

// 🛡️ 기본 컨텐츠 정보 (DB 미수신 시 폴백용 규격)
export const CONTENT_DB: ContentItem[] = [
  {
    id: "abyss_all",
    name: "어비스 - 통합 (3종)",
    category: "어비스",
    size: 4,
    diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"],
    defaultDiff: "어려움"
  },
  {
    id: "abyss_1",
    name: "어비스 - 허상의 정박지",
    category: "어비스",
    size: 4,
    diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"],
    defaultDiff: "어려움"
  },
  {
    id: "abyss_2",
    name: "어비스 - 광기의 동굴",
    category: "어비스",
    size: 4,
    diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"],
    defaultDiff: "어려움"
  },
  {
    id: "abyss_3",
    name: "어비스 - 흩어진 물길",
    category: "어비스",
    size: 4,
    diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"],
    defaultDiff: "어려움"
  },
  {
    id: "raid_cabrak",
    name: "레이드 - 카브락",
    category: "레이드",
    size: 8,
    diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"],
    defaultDiff: "어려움"
  },
  {
    id: "raid_succubus",
    name: "레이드 - 화이트 서큐버스",
    category: "레이드",
    size: 4,
    diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"],
    defaultDiff: "어려움"
  },
  {
    id: "raid_eirel",
    name: "레이드 - 에이렐",
    category: "레이드",
    size: 4,
    diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"],
    defaultDiff: "어려움"
  }
];