export const PANTHEON_NOTIFICATION_CATEGORIES = [
  "TELOS", "SYMPHONIA", "KRATOS", "TECHNE", "HARMONIA", "PIETAS",
] as const;

export type PantheonNotificationCategory = typeof PANTHEON_NOTIFICATION_CATEGORIES[number];

export type PantheonRankEntry = {
  key: string;
  label: string;
  score: number;
};

export type PantheonRankSnapshot = Record<PantheonNotificationCategory, PantheonRankEntry[]>;

export type PantheonCharacterForNotification = {
  nickname: string;
  owner?: string | null;
  is_main?: boolean | null;
  combat_power?: string | number | null;
  life_energy?: string | number | null;
  charm?: string | number | null;
  contribution?: string | number | null;
};

const accountName = (character: PantheonCharacterForNotification) =>
  character.owner?.trim() || character.nickname;

const scoreOf = (character: PantheonCharacterForNotification, category: PantheonNotificationCategory) => {
  const combat = Number(character.combat_power) || 0;
  const life = Number(character.life_energy) || 0;
  const charm = Number(character.charm) || 0;
  if (category === "KRATOS") return combat;
  if (category === "TECHNE") return life;
  if (category === "HARMONIA") return charm;
  if (category === "PIETAS") return Number(character.contribution) || 0;
  return combat + life + charm;
};

const topThree = (entries: PantheonRankEntry[]) =>
  entries.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key, "ko")).slice(0, 3);

export function buildPantheonRankSnapshot(characters: PantheonCharacterForNotification[]): PantheonRankSnapshot {
  const snapshot = {} as PantheonRankSnapshot;

  for (const category of PANTHEON_NOTIFICATION_CATEGORIES) {
    if (category === "SYMPHONIA") {
      const accounts = new Map<string, number>();
      for (const character of characters) {
        const owner = accountName(character);
        accounts.set(owner, (accounts.get(owner) || 0) + scoreOf(character, "TELOS"));
      }
      snapshot[category] = topThree([...accounts].map(([owner, score]) => ({ key: owner, label: owner, score })));
      continue;
    }

    if (category === "TECHNE" || category === "PIETAS") {
      const representatives = new Map<string, PantheonCharacterForNotification>();
      for (const character of characters) {
        const owner = accountName(character);
        const current = representatives.get(owner);
        if (!current || (category === "PIETAS" && character.is_main && !current.is_main) ||
          (category === "PIETAS" && !character.is_main && !current.is_main && scoreOf(character, category) > scoreOf(current, category)) ||
          (category === "TECHNE" && scoreOf(character, category) > scoreOf(current, category))) {
          representatives.set(owner, character);
        }
      }
      snapshot[category] = topThree([...representatives].map(([owner, character]) => ({
        key: owner, label: owner, score: scoreOf(character, category),
      })));
      continue;
    }

    snapshot[category] = topThree(characters.map((character) => ({
      key: character.nickname,
      label: character.nickname,
      score: scoreOf(character, category),
    })));
  }

  return snapshot;
}

export function describePantheonRankChanges(
  previous: PantheonRankSnapshot,
  current: PantheonRankSnapshot,
  category: PantheonNotificationCategory,
): string[] {
  const oldEntries = previous[category] || [];
  const nextEntries = current[category] || [];
  const isAccountRank = ["SYMPHONIA", "TECHNE", "PIETAS"].includes(category);
  const display = (entry?: PantheonRankEntry) => entry ? `${entry.label}${isAccountRank ? " 계정" : ""}` : "빈자리";

  return Array.from({ length: Math.max(oldEntries.length, nextEntries.length) }, (_, index) => {
    const before = oldEntries[index];
    const after = nextEntries[index];
    return before?.key !== after?.key ? `${index + 1}위 ${display(before)} → ${display(after)}` : null;
  }).filter((change): change is string => change !== null);
}
