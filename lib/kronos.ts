export const MISSION_TOWNS = [
  "티르코네일",
  "던바튼",
  "콜헨",
  "반호르",
  "이멘마하",
] as const;
export const TOWN_SHORT: Record<string, string> = {
  티르코네일: "티르",
  던바튼: "던바",
  콜헨: "콜헨",
  반호르: "반호르",
  이멘마하: "이멘",
};
export type Reward = { name: string; count: number };
export type ShopItem = {
  id: number;
  map: string;
  npc: string;
  reward: string;
  reward_cnt: number;
  cost_cnt: number;
  limit: number;
  reset_type: "일간" | "주간";
  scope: "캐릭당" | "계정당";
  is_active: boolean;
};
export type Mission = {
  id: number;
  town: string;
  title: string;
  description: string;
  max_count: number;
  rewards: Reward[];
  is_active: boolean;
};
export type Progress = {
  kind: "shop" | "mission";
  item_id: number;
  character_name: string | null;
  count: number;
  bookmarked: boolean;
  period_start: string;
};
export type Reminder = {
  slot: number;
  title: string;
  content: string;
  color: string;
  font: string;
  font_size: number;
};
export const NOTE_COLORS = ["theme", "cream", "mint", "rose", "blue"] as const;
export const NOTE_FONTS = ["sans", "serif", "mono"] as const;

// Reset boundaries are Korean time even on devices outside Korea.
export function kronosPeriodStart(now = new Date(), daily = false): number {
  const shifted = new Date(now.getTime() + 3 * 3600000); // KST minus the 06:00 reset hour
  shifted.setUTCHours(0, 0, 0, 0);
  if (!daily)
    shifted.setUTCDate(shifted.getUTCDate() - ((shifted.getUTCDay() + 6) % 7));
  return shifted.getTime() - 3 * 3600000;
}
export function currentProgress(
  row: Progress | undefined,
  daily = false,
  now = new Date(),
) {
  return row && Date.parse(row.period_start) === kronosPeriodStart(now, daily)
    ? row.count
    : 0;
}
export function blankReminder(slot: number): Reminder {
  return {
    slot,
    title: "",
    content: "",
    color: "theme",
    font: "sans",
    font_size: 0.85,
  };
}
