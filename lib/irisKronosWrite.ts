import {kronosPeriodStart} from '@/lib/kronos';
import {buildIrisKronosDetails,getKronosTaskLists,type KronosCatalogItem} from '@/lib/irisKronos';
import {setChecklistField} from '@/lib/matchingUtils';

export type Category='daily'|'weekly'|'abyss'|'raid';
export type IrisEdit={requestId:string;generation:number;selectionVersion:number;accountId:string;characterId:string;category:Category;taskId:string;baseCompleted:number;desiredCompleted:number;periodKey:string};
export type IrisEditResult={requestId:string;status:'saved'|'conflict'|'failed'|'unknown';completed:number|null};
export class IrisWriteError extends Error {constructor(public status:number){super('숙제 저장 상태를 확인해 주세요.');}}
export function getIrisPeriodKeys(now=new Date()):Record<Category,string>{
  const daily=new Date(kronosPeriodStart(now,true)).toISOString(),weekly=new Date(kronosPeriodStart(now,false)).toISOString();
  return {daily,weekly,abyss:weekly,raid:weekly};
}
export function validateIrisEdit(input:unknown):IrisEdit{
  const e=input as IrisEdit;
  const fields=['requestId','generation','selectionVersion','accountId','characterId','category','taskId','baseCompleted','desiredCompleted','periodKey'];
  if(!e || typeof e!=='object' || Array.isArray(e) || Object.keys(e).length!==fields.length || Object.keys(e).some(k=>!fields.includes(k)) ||
    typeof e.requestId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.requestId) ||
    !['daily','weekly','abyss','raid'].includes(e.category) ||
    [e.accountId,e.characterId,e.taskId].some(v=>typeof v!=='string' || v.length>100 || !v.trim() || /[\u0000-\u0020\u007f]/u.test(v)) ||
    [e.generation,e.selectionVersion].some(v=>!Number.isSafeInteger(v)||v<1) ||
    [e.baseCompleted,e.desiredCompleted].some(v=>!Number.isSafeInteger(v)||v<0||v>1000) ||
    typeof e.periodKey!=='string' || e.periodKey.length>30) throw new IrisWriteError(400);
  return e;
}
type Character={daily_checks?:unknown;weekly_checks?:unknown;raid_checks?:unknown};
export function computeIrisKronosEdit(character:Character,catalog:{tasks:KronosCatalogItem[];contents:KronosCatalogItem[]},input:unknown,now=new Date()){
  const edit=validateIrisEdit(input);
  if(edit.periodKey!==getIrisPeriodKeys(now)[edit.category]) throw new IrisWriteError(409);
  let details;
  try{details=buildIrisKronosDetails(character,catalog.tasks,catalog.contents,[],now);}catch{throw new IrisWriteError(503);}
  const row=details.tasks[edit.category].find(r=>r.id===edit.taskId);
  if(!row || edit.baseCompleted>row.total || edit.desiredCompleted>row.total) throw new IrisWriteError(400);
  if(row.completed!==edit.baseCompleted && row.completed!==edit.desiredCompleted) throw new IrisWriteError(409);
  const lists=getKronosTaskLists(catalog.tasks,now);
  const list=edit.category==='daily'?lists.daily:edit.category==='weekly'?lists.weekly:catalog.contents.filter(c=>c.is_active!==false && c.type===edit.category);
  const item=list.find(i=>String(i.id)===edit.taskId)!;
  const field=item.type.startsWith('repeat')?'weekly_checks':edit.category==='daily'?'daily_checks':edit.category==='weekly'?'weekly_checks':'raid_checks';
  const baseRaw=character[field]??null;
  let raw=baseRaw;
  if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch{throw new IrisWriteError(503);}}
  if(row.completed===edit.desiredCompleted)return {field,baseRaw,nextRaw:raw,completed:row.completed,changed:false} as const;
  let nextRaw;
  if(item.type.startsWith('repeat')){
    const wrapped=raw && typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:null;
    const repeat=wrapped?.repeat;
    if(repeat!=null && (typeof repeat!=='object'||Array.isArray(repeat)))throw new IrisWriteError(503);
    const r=(repeat??{}) as Record<string,unknown>,slots=r[edit.taskId];
    if(slots!=null && (!Array.isArray(slots)||slots.some(v=>typeof v!=='boolean')||slots.length>row.total))throw new IrisWriteError(503);
    nextRaw={...(wrapped??{}),normal:wrapped?.normal??(wrapped?[]:raw??[]),repeat:{...r,[edit.taskId]:Array.from({length:row.total},(_,i)=>i<edit.desiredCompleted)}};
  }else nextRaw=setChecklistField(raw,item,edit.desiredCompleted===1,edit.category==='abyss'?'raid':edit.category,catalog.contents);
  // A legacy shared key (e.g. abyss_all) may represent multiple completions.
  // Do not split it by guessing, or silently uncheck another catalog row.
  const after=buildIrisKronosDetails({...character,[field]:nextRaw},catalog.tasks,catalog.contents,[],now);
  for(const category of ['daily','weekly','abyss','raid'] as const){
    for(const before of details.tasks[category]){
      const expected=category===edit.category&&before.id===edit.taskId?edit.desiredCompleted:before.completed;
      if(after.tasks[category].find(r=>r.id===before.id)?.completed!==expected)throw new IrisWriteError(409);
    }
  }
  return {field,baseRaw,nextRaw,completed:edit.desiredCompleted,changed:true} as const;
}
