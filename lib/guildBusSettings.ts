export const BUS_SNAPSHOT_FIELDS = ['content_name','difficulty','sub_content','memo','party_date','time_start','time_end','max_members','selected_sub_contents','status','leader_name','members','final_start_time'] as const;
type SnapshotSource = {[K in typeof BUS_SNAPSHOT_FIELDS[number]]?: unknown};
export function busSettingsSnapshot(party: SnapshotSource): Record<string, unknown> {
  return Object.fromEntries(BUS_SNAPSHOT_FIELDS.map(key => [key, party[key] ?? null]));
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)]));
  return value;
}
export function matchesBusSnapshot(party: SnapshotSource, baseline: unknown): boolean {
  return !!baseline && typeof baseline === 'object' && !Array.isArray(baseline) &&
    JSON.stringify(canonical(busSettingsSnapshot(party))) === JSON.stringify(canonical(busSettingsSnapshot(baseline)));
}
export function validBusDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function validBusTime(value: unknown): value is string {
  return typeof value === 'string' && parseBusClock(value)!==null;
}
export function parseBusClock(value: string | undefined): number | null {
  const match=/^(\d{1,2}):(\d{2})(?:\s*(\(\+1일\)|\+1일|다음날|익일))?$/.exec(value||'');
  if (!match) return null;
  const hour=Number(match[1]),minute=Number(match[2]);
  if (hour>24 || minute>59 || (hour===24 && (minute!==0 || match[3]))) return null;
  return hour*60+minute+(match[3]?1440:0);
}
export function busClockInput(value: string): string {
  const total=parseBusClock(value);
  return total===null ? '' : `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}
export function changeBusClock(value: string, clock: string, nextDay=(parseBusClock(value)??0)>=1440): string {
  return clock ? `${clock}${nextDay?' (+1일)':''}` : '';
}
export function preserveBusMemo(current: string, oldDefault: string, nextDefault: string): string {
  return !current.trim() || current.trim() === oldDefault ? nextDefault : current;
}
