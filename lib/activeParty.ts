import { normalizeDateStr } from "@/lib/partyDateUtils";

export type ScheduledParty = {
  status?: string | null;
  party_date?: string | null;
  created_at?: string | null;
  time_start?: string | null;
  time_end?: string | null;
  final_start_time?: string | null;
};

function minutesOfDay(value: string | null | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value?.trim() || "");
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

function partyDate(party: ScheduledParty): string | null {
  if (party.party_date) {
    const normalized = normalizeDateStr(party.party_date);
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
  }
  if (!party.created_at) return null;
  const createdAt = new Date(party.created_at).getTime();
  if (!Number.isFinite(createdAt)) return null;
  return new Date(createdAt + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function getPartyWindow(party: ScheduledParty): { start: number; end: number } | null {
  const date = partyDate(party);
  const startMinutes = minutesOfDay(party.final_start_time || party.time_start);
  const endMinutes = minutesOfDay(party.time_end);
  if (!date || startMinutes === null || endMinutes === null) return null;
  const midnight = Date.parse(`${date}T00:00:00+09:00`);
  if (!Number.isFinite(midnight)) return null;
  return {
    start: midnight + startMinutes * 60_000,
    end: midnight + (endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes) * 60_000,
  };
}

export function isCurrentParty(party: ScheduledParty, now = Date.now()): boolean {
  const status = party.status?.trim();
  if (!status || ["종료", "종료됨", "취소", "취소됨", "삭제됨"].includes(status)) return false;
  const window = getPartyWindow(party);
  return window !== null && window.end > now;
}

export function isPartyInProgress(party: ScheduledParty, now = Date.now()): boolean {
  if (!isCurrentParty(party, now)) return false;
  if (party.status === "운행중") return true;
  const window = getPartyWindow(party);
  return window !== null && window.start <= now;
}
