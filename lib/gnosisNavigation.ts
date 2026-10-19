import { GNOSIS_SECTIONS, gnosisCategoryLabel, type GnosisSection } from "./gnosisCategories";

export const GNOSIS_ICON_OPTIONS = [...GNOSIS_SECTIONS, "시뮬레이터"] as const;
export type GnosisNavigationItem = { key: GnosisSection; label: string; icon: typeof GNOSIS_ICON_OPTIONS[number] };
export const DEFAULT_GNOSIS_NAVIGATION: GnosisNavigationItem[] = GNOSIS_SECTIONS.map(key => ({ key, label: key, icon: key }));

export function parseGnosisNavigation(value: unknown): GnosisNavigationItem[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const root = value as Record<string, unknown>;
  if (Object.keys(root).length !== 2 || root.version !== 1 || !Array.isArray(root.items) || root.items.length !== GNOSIS_SECTIONS.length) return null;
  const keys = new Set<string>();
  const labels = new Set<string>();
  const items: GnosisNavigationItem[] = [];
  for (const item of root.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const row = item as Record<string, unknown>;
    if (Object.keys(row).length !== 3 || !GNOSIS_SECTIONS.includes(row.key as GnosisSection) || !GNOSIS_ICON_OPTIONS.includes(row.icon as GnosisNavigationItem["icon"]) || typeof row.label !== "string") return null;
    const label = row.label.trim();
    if (!label || [...label].length > 12 || /[\u0000-\u001f\u007f]/.test(row.label) || keys.has(String(row.key)) || labels.has(label)) return null;
    keys.add(String(row.key)); labels.add(label);
    items.push({ key: row.key as GnosisSection, label, icon: row.icon as GnosisNavigationItem["icon"] });
  }
  return items;
}

export function gnosisDisplayLabel(category: string, items: GnosisNavigationItem[]) {
  const key = gnosisCategoryLabel(category);
  return items.find(item => item.key === key)?.label ?? key;
}
