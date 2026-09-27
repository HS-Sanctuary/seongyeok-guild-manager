export type OwnedCharacter = { owner?: string | null; nickname?: string | null };

export async function getApprovedAccountNames(): Promise<Set<string>> {
  const response = await fetch("/api/accounts/directory", { cache: "no-store" });
  if (!response.ok) throw new Error("승인된 길드원 명단을 불러오지 못했습니다.");
  const result = await response.json() as { accounts?: Array<{ nickname?: string }> };
  return new Set((result.accounts ?? []).map(account => account.nickname?.trim() ?? "").filter(Boolean));
}

export function filterApprovedCharacters<T extends OwnedCharacter>(characters: T[], approvedNames: Set<string>): T[] {
  return characters.filter(character => approvedNames.has(character.owner?.trim() || character.nickname?.trim() || ""));
}
