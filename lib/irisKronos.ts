import { isTaskChecked, normalizeChecklist } from "@/lib/matchingUtils";
import { getKronosResetDay } from "@/lib/kronos";

export type KronosCatalogItem = {
  id: string | number; name: string; type: string; max_count?: number;
  is_active?: boolean; mobile_name?: string;
};

// Shared by the character page and IRIS. This does not reset or rewrite any checks.
export function getKronosTaskLists(tasks: KronosCatalogItem[], now = new Date()) {
  // Allowance belongs to the KST06 game day, not the midnight calendar day.
  // Reuse the reset boundary so Sunday14 remains valid until Monday06.
  const day = getKronosResetDay(now).weekday;
  const extras: KronosCatalogItem[] = [
    {id:9900,name:"검은 구멍",mobile_name:"검은 구멍",type:"repeat_weekly",max_count:day === 0 ? 14 : day + 7},
    {id:9901,name:"소환의 결계",mobile_name:"소환의 결계",type:"repeat_weekly",max_count:7},
    {id:9902,name:"뱅가드 브리치",mobile_name:"뱅가드 브리치",type:"repeat_weekly",max_count:3},
  ];
  const active = tasks.filter(t=>t.is_active !== false && typeof t.name === 'string' && !t.name.includes('검은 구멍'));
  return {
    daily:active.filter(t=>['daily','repeat_daily'].includes(t.type)),
    weekly:[...extras,...active.filter(t=>['weekly','repeat_weekly','repeat_weekend'].includes(t.type) && !extras.some(e=>e.name===t.name))],
  };
}

type KronosCharacter = {daily_checks?:unknown;weekly_checks?:unknown;raid_checks?:unknown;levels?:unknown};
export type IrisTaskDetail = {id:string;name:string;completed:number;total:number};
export type IrisClassDetail = {id:string;name:string;level:number|null};
function safeText(value:unknown,max:number): value is string {
  return typeof value === 'string' && value.trim().length>0 && Array.from(value).length<=max && !/[\u0000-\u001f\u007f]/u.test(value);
}
function catalogIdentity(item:{id:string|number;name:string},ids:Set<string>) {
  const id=typeof item.id==='number' && Number.isSafeInteger(item.id) && item.id>=0 ? String(item.id) : item.id;
  if (!safeText(id,100) || !safeText(item.name,120) || ids.has(id)) throw new Error('Invalid catalog identity');
  ids.add(id);return id;
}
export function buildIrisKronosDetails(character:KronosCharacter,tasks:KronosCatalogItem[],
  contents:KronosCatalogItem[],classes:{id:string|number;name:string;is_active?:boolean}[],now=new Date()) {
  const {daily,weekly} = getKronosTaskLists(tasks,now);
  let rawWeekly = character.weekly_checks;
  if (typeof rawWeekly === 'string') { try { rawWeekly=JSON.parse(rawWeekly); } catch { rawWeekly=null; } }
  const wrapped = rawWeekly && typeof rawWeekly === 'object' && !Array.isArray(rawWeekly) ? rawWeekly as Record<string,unknown> : null;
  const normal = wrapped && ('normal' in wrapped || 'repeat' in wrapped) ? wrapped.normal : rawWeekly;
  const repeat = wrapped?.repeat && typeof wrapped.repeat === 'object' && !Array.isArray(wrapped.repeat)
    ? wrapped.repeat as Record<string,unknown> : {};
  const catalog = contents.filter(item=>item.is_active !== false);
  function rows(list: KronosCatalogItem[], checks: unknown) {
    if(list.length>200) throw new Error('Too many tasks');
    const result:IrisTaskDetail[]=[],ids=new Set<string>();
    let total=0;
    for (const item of list) {
      const id=catalogIdentity(item,ids);
      if (item.type.startsWith('repeat')) {
        const max = item.max_count ?? 1;
        if (!Number.isSafeInteger(max) || max < 1 || max > 1000) throw new Error('Invalid task count');
        const slots = repeat[String(item.id)];
        const done = Array.isArray(slots) ? slots.filter(Boolean).length : 0;
        // Legacy checks lack period timestamps. Do not invent a reset or silently
        // alter their meaning when a calendar-based allowance becomes smaller.
        if (done > max) throw new Error('Unresolved repeat period boundary');
        total += max;
        result.push({id,name:item.name,completed:done,total:max});
      } else {
        total++;
        result.push({id,name:item.name,completed:isTaskChecked(normalizeChecklist(checks),item,catalog) ? 1 : 0,total:1});
      }
    }
    if (total > 10000) throw new Error('Too many tasks');
    return result;
  }
  const activeClasses=classes.filter(item=>item.is_active!==false);
  if(activeClasses.length>100) throw new Error('Too many classes');
  const ids=new Set<string>();
  const levels=character.levels && typeof character.levels==='object' && !Array.isArray(character.levels)
    ? character.levels as Record<string,unknown> : {};
  return {
    schemaVersion:1 as const,
    tasks:{daily:rows(daily,character.daily_checks),weekly:rows(weekly,normal),
      abyss:rows(catalog.filter(item=>item.type==='abyss'),character.raid_checks),
      raid:rows(catalog.filter(item=>item.type==='raid'),character.raid_checks)},
    classes:activeClasses.map(item=>{
      const id=catalogIdentity(item,ids),raw=Object.hasOwn(levels,item.name) ? levels[item.name] : null;
      return {id,name:item.name,level:typeof raw==='number' && Number.isSafeInteger(raw) && raw>=1 && raw<=1000 ? raw : null};
    }),
  };
}
export function summarizeIrisKronosDetails(details:ReturnType<typeof buildIrisKronosDetails>) {
  const count=(rows:IrisTaskDetail[])=>rows.reduce((sum,row)=>({completed:sum.completed+row.completed,total:sum.total+row.total}),{completed:0,total:0});
  return {daily:count(details.tasks.daily),weekly:count(details.tasks.weekly),abyss:count(details.tasks.abyss),raid:count(details.tasks.raid)};
}
export function buildIrisKronosSummary(character:KronosCharacter,tasks:KronosCatalogItem[],contents:KronosCatalogItem[],now=new Date()) {
  return summarizeIrisKronosDetails(buildIrisKronosDetails(character,tasks,contents,[],now));
}
