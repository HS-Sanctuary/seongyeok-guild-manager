export type BusWindow = { party_date?: string; time_start: string; time_end: string };
export type BusEntry = { character_name: string; time_start?: string; time_end?: string; is_completed?: boolean; allow_repeat?: boolean };

export function isGuildBusParty(party: {party_type?: string; is_guild_bus?: boolean; sub_content?: unknown; memo?: unknown; content_name?: string}): boolean {
  return party.party_type === '길드버스' || party.is_guild_bus === true ||
    [party.sub_content,party.memo,party.content_name].some(value => typeof value === 'string' && value.replace(/\s/g,'').includes('길드버스'));
}

function minutes(time: string | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time || '');
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 24 && minute < 60 && (hour !== 24 || minute === 0) ? hour * 60 + minute : null;
}

export function eligibleBusCandidates<T extends BusEntry>(members: T[], bus: BusWindow, now: Date): T[] {
  const start = minutes(bus.time_start);
  const rawEnd = minutes(bus.time_end);
  if (start === null || rawEnd === null) return [];
  const end = rawEnd <= start ? rawEnd + 1440 : rawEnd;
  const kstParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(now).reduce<Record<string, string>>((parts, part) => {
    parts[part.type] = part.value;
    return parts;
  }, {});
  const todayKst = `${kstParts.year}-${kstParts.month}-${kstParts.day}`;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(bus.party_date || '') ? bus.party_date! : todayKst;
  if (date > todayKst) return [];
  const sameDay = date === todayKst;
  const minuteNow = sameDay ? Number(kstParts.hour) * 60 + Number(kstParts.minute) : (date < todayKst ? end : start);
  if (minuteNow >= end) return [];
  return members.filter((member) => {
    if (member.is_completed && !member.allow_repeat) return false;
    const memberStart = minutes(member.time_start) ?? start;
    const memberRawEnd = minutes(member.time_end) ?? end;
    const memberEnd = memberRawEnd <= memberStart ? memberRawEnd + 1440 : memberRawEnd;
    return [0, 1440].some((offset) => minuteNow >= memberStart + offset && minuteNow < memberEnd + offset);
  });
}

export function isBusOperator(leader: string | undefined, account: string, characters: string[], isAdmin: boolean): boolean {
  return !!leader && isAdmin && (leader === account || characters.includes(leader));
}

export function ownedPartyCharacters<T extends {owner?: string; nickname?: string}>(characters: T[], account: string): T[] {
  if (!account) return [];
  return characters.filter(character => character.owner === account || (!character.owner && character.nickname === account));
}

export function formatBusRoster(selectedNames: string[], members: BusEntry[]): string {
  const byName = new Map(members.map((member) => [member.character_name, member]));
  const unique = [...new Set(selectedNames.filter(Boolean))];
  const retained = unique.filter((name) => byName.get(name)?.is_completed && byName.get(name)?.allow_repeat);
  const changed = unique.filter((name) => !retained.includes(name));
  return `잔존: ${retained.join('/ ') || '없음'}\n변경: ${changed.join('/ ') || '없음'}`;
}
