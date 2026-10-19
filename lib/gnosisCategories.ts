export const GNOSIS_SECTIONS = ["전체", "클래스", "전투", "생활", "패션", "악보", "기타"] as const;
export type GnosisSection = typeof GNOSIS_SECTIONS[number];
export const GNOSIS_LIFE_CATEGORIES = ["채집", "가공", "제작", "데코", "마이홈"];
export const GNOSIS_COMBAT_CATEGORIES = ["레이드 공략", "어비스 공략", "나이트메어 드릴 공략", "기타 전투 공략"];

const LEGACY_LABELS: Record<string, string> = {
  "전체보기": "전체", "전투 지식": "전투",
  "전체 지식": "전체", "클래스 지식": "클래스", "생활 지식": "생활",
  "패션 지식": "패션", "악보 지식": "악보", "기타 지식": "기타",
};

export function gnosisCategoryLabel(category: string): string {
  return LEGACY_LABELS[category] ?? category;
}

export function matchesGnosisSection(
  section: GnosisSection,
  guide: { sub_category: string; item_data?: unknown },
  classNames: ReadonlySet<string>,
): boolean {
  if (section === "전체") return true;
  const category = gnosisCategoryLabel(guide.sub_category);
  if (section === "클래스") return category === "클래스" || classNames.has(guide.sub_category);
  if (section === "생활") return category === "생활" || GNOSIS_LIFE_CATEGORIES.includes(guide.sub_category);
  if (section === "전투") return category === "전투" || GNOSIS_COMBAT_CATEGORIES.includes(guide.sub_category);
  if (section === "패션") return category === "패션" || Boolean(guide.item_data && typeof guide.item_data === "object" && !Array.isArray(guide.item_data));
  return category === section;
}
