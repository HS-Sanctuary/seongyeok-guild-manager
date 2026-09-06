export interface Member {
  name: string;
  character_name?: string; // 👈 ts(2339) 에러 해결을 위한 속성 추가
  nickname?: string;       // 👈 범용성 확장을 위한 별명 속성 추가
  job: string;
  roles: string[];
  time_start: string;
  time_end: string;
  is_driver?: boolean;
  combat_power?: number;
  magic_resistance?: number;
}

export interface Party {
  id: number | string; // id가 컴포넌트 환경에 따라 string으로도 넘어올 수 있음을 대비
  content_name: string;
  sub_content?: string;
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
}

export interface ContentItem {
  id: string;
  name: string;
  category: "어비스" | "레이드";
  size: number;
  diffs: string[];
  defaultDiff: string;
}

export const ROLE_GROUPS: Record<string, string[]> = {
  "탱커": ["빙결술사", "전사", "기사"],
  "힐러": ["힐러", "사제", "수도사", "음유시인"],
  "근딜": ["검술사", "대검전사", "댄서", "도적", "격투가", "듀얼블레이드"],
  "원딜": ["마법사", "화염술사", "전격술사", "궁수", "장궁병", "석궁사수", "악사", "암흑술사"]
};

export const ROLE_COLORS: Record<string, string> = {
  "탱커": "text-[var(--accent)] bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "힐러": "text-emerald-500 dark:text-emerald-400 bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "근딜": "text-rose-500 dark:text-rose-400 bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "원딜": "text-amber-500 dark:text-amber-400 bg-[var(--inner-box)] border-[var(--panel-border)] font-bold"
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  "입문": "text-purple-600 dark:text-purple-400 bg-[var(--panel)] border-[var(--panel-border)]",
  "어려움": "text-amber-600 dark:text-amber-400 bg-[var(--panel)] border-[var(--panel-border)]",
  "매우 어려움": "text-rose-600 dark:text-rose-400 bg-[var(--panel)] border-[var(--panel-border)]",
  "지옥 1": "text-red-600 dark:text-red-500 bg-[var(--panel)] border-[var(--panel-border)]",
  "지옥 2": "text-rose-700 dark:text-rose-300 bg-[var(--panel)] border-[var(--panel-border)]"
};

export const CONTENT_DB: ContentItem[] = [
  { id: "abyss_all", name: "어비스 3종 (통합)", category: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"], defaultDiff: "매우 어려움" },
  { id: "abyss_1", name: "어비스 - 허상의 정박지", category: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"], defaultDiff: "매우 어려움" },
  { id: "abyss_2", name: "어비스 - 광기의 동굴", category: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"], defaultDiff: "매우 어려움" },
  { id: "abyss_3", name: "어비스 - 흩어진 물길", category: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1", "지옥 2"], defaultDiff: "매우 어려움" },
  { id: "raid_cav", name: "레이드 - 카브락", category: "레이드", size: 8, diffs: ["입문", "어려움"], defaultDiff: "어려움" },
  { id: "raid_airel", name: "레이드 - 에이렐", category: "레이드", size: 4, diffs: ["어려움"], defaultDiff: "어려움" },
  { id: "raid_white", name: "레이드 - 화이트 서큐버스", category: "레이드", size: 4, diffs: ["어려움", "매우 어려움"], defaultDiff: "매우 어려움" }
];