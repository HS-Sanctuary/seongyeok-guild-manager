import {kronosPeriodStart} from './kronos';
export type BarterScope='character'|'account';
export type BarterBaseRecord={characterId:string;recordKey:string};
export type BarterKey={tradeId:string;scope:BarterScope;periodKey:string;catalogKey:string;baseRecords:BarterBaseRecord[]};
export type BarterWriteContext=BarterKey;
export type IrisBarterDetail={id:string;map:string;npc:string;reward:string;rewardCount:number;cost:string;costCount:number;total:number;resetType:'일간'|'주간';scope:BarterScope;completed:number;completedBy:string|null;periodKey:string;consistent:boolean};
export type BarterEdit=BarterKey&{requestId:string;accountId:string;characterId:string;baseCompleted:number;desiredCompleted:number};
export type BarterResult={requestId:string;status:'saved'|'unknown';completed:number;completedBy:string|null;baseRecords:BarterBaseRecord[]};
export type BarterCharacter={id:string|number;nickname:string;owner?:string|null;trade_checks?:unknown};
type Catalog={id:string;map:string;npc:string;reward:string;rewardCount:number;cost:string;costCount:number;total:number;resetType:'일간'|'주간';scope:BarterScope};
type Digest=(value:string)=>string;
export class BarterError extends Error {constructor(public status:number){super('물물교환 정보를 다시 확인해 주세요.');}}
export const barterPeriodStart=(resetType:string,now=new Date())=>kronosPeriodStart(now,resetType==='일간');
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const identity=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=100&&!/[\u0000-\u0020\u007f]/u.test(v);
const text=(v:unknown,max=160):v is string=>typeof v==='string'&&Array.from(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
const count=(v:unknown,max=1000):v is number=>Number.isSafeInteger(v)&&(v as number)>=0&&(v as number)<=max;
export const validBarterDigest=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function validBarterRecords(value:unknown):value is BarterBaseRecord[]{
  if(!Array.isArray(value)||value.length<1||value.length>100)return false;
  const ids=new Set<string>();return value.every(v=>object(v)&&Object.keys(v).length===2&&identity(v.characterId)&&validBarterDigest(v.recordKey)&&!ids.has(v.characterId)&&!!ids.add(v.characterId));
}
export function validateBarterEdit(input:unknown):BarterEdit{
  const fields=['requestId','accountId','characterId','tradeId','scope','periodKey','catalogKey','baseRecords','baseCompleted','desiredCompleted'];
  if(!object(input)||Object.keys(input).length!==fields.length||fields.some(f=>!Object.hasOwn(input,f))||
    !identity(input.requestId)||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)||
    ![input.accountId,input.characterId,input.tradeId].every(identity)||!['character','account'].includes(String(input.scope))||
    !count(input.baseCompleted)||!count(input.desiredCompleted)||!validBarterDigest(input.catalogKey)||!validBarterRecords(input.baseRecords)||
    typeof input.periodKey!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/.test(input.periodKey)||!Number.isFinite(Date.parse(input.periodKey))||new Date(input.periodKey).toISOString()!==input.periodKey)throw new BarterError(400);
  if(!input.baseRecords.some(r=>r.characterId===input.characterId)||(input.scope==='character'&&input.baseRecords.length!==1))throw new BarterError(400);
  return structuredClone(input) as BarterEdit;
}
export function parseBarterPayload(rows:unknown,contexts:unknown):{rows:IrisBarterDetail[];contexts:BarterWriteContext[]}{
  if(!Array.isArray(rows)||rows.length>500||!Array.isArray(contexts)||contexts.length!==rows.length)throw new BarterError(502);
  const ids=new Set<string>();const cleanRows=rows.map(r=>{
    if(!object(r)||!identity(r.id)||ids.has(r.id)||![r.map,r.npc,r.reward,r.cost].every(v=>text(v)&&!!String(v).trim())||
      !count(r.rewardCount,1_000_000_000)||r.rewardCount<1||!count(r.costCount,1_000_000_000)||r.costCount<1||!count(r.total)||r.total<1||!count(r.completed)||r.completed>r.total||
      !['일간','주간'].includes(String(r.resetType))||!['account','character'].includes(String(r.scope))||typeof r.consistent!=='boolean'||(r.completedBy!==null&&!text(r.completedBy,120)))throw new BarterError(502);
    ids.add(r.id);return {id:r.id,map:r.map,npc:r.npc,reward:r.reward,rewardCount:r.rewardCount,cost:r.cost,costCount:r.costCount,total:r.total,resetType:r.resetType,scope:r.scope,completed:r.completed,completedBy:r.completedBy,periodKey:r.periodKey,consistent:r.consistent} as IrisBarterDetail;
  });
  const cleanContexts=cleanRows.map(r=>{
    const matches=contexts.filter(c=>object(c)&&c.tradeId===r.id);if(matches.length!==1||!object(matches[0]))throw new BarterError(502);
    const c=matches[0];
    if(!validBarterRecords(c.baseRecords))throw new BarterError(502);
    validateBarterEdit({requestId:'11111111-1111-4111-8111-111111111111',accountId:'validation',characterId:c.baseRecords[0].characterId,tradeId:c.tradeId,scope:c.scope,periodKey:c.periodKey,catalogKey:c.catalogKey,baseRecords:c.baseRecords,baseCompleted:r.completed,desiredCompleted:r.completed});
    const records=c.baseRecords;
    if(c.scope!==r.scope||c.periodKey!==r.periodKey||(r.scope==='character'&&records.length!==1)||(r.consistent&&records.some(b=>b.recordKey!==records[0].recordKey)))throw new BarterError(502);
    return {tradeId:r.id,scope:r.scope,periodKey:r.periodKey,catalogKey:c.catalogKey,baseRecords:structuredClone(records)} as BarterWriteContext;
  });
  return {rows:cleanRows,contexts:cleanContexts};
}
function canonical(v:unknown):string {
  if(v===null||typeof v==='string'||typeof v==='boolean'||(typeof v==='number'&&Number.isFinite(v)))return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  if(object(v))return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  throw new BarterError(503);
}
const raw=(c:BarterCharacter)=>{if(c.trade_checks==null)return {};if(!object(c.trade_checks))throw new BarterError(503);return c.trade_checks;};
const recordKey=(r:Record<string,unknown>,id:string,digest:Digest)=>digest(canonical(Object.hasOwn(r,id)?[true,r[id]]:[false,null]));
function catalog(input:unknown[]):Catalog[]{
  if(!Array.isArray(input)||input.length>500)throw new BarterError(503);
  const ids=new Set<string>();return input.map(v=>{
    if(!object(v)||!identity(String(v.id))||ids.has(String(v.id))||!['일간','주간'].includes(String(v.reset_type))||!['캐릭당','계정당'].includes(String(v.scope))||
      ![v.map,v.npc,v.reward,v.cost].every(value=>text(value))||!String(v.reward).trim()||!String(v.cost).trim()||
      !count(v.limit)||v.limit<1||!count(v.reward_cnt,1_000_000_000)||v.reward_cnt<1||!count(v.cost_cnt,1_000_000_000)||v.cost_cnt<1)throw new BarterError(503);
    const id=String(v.id);ids.add(id);return {id,map:String(v.map)||'전역',npc:String(v.npc)||'NPC',reward:String(v.reward),rewardCount:v.reward_cnt,cost:String(v.cost),costCount:v.cost_cnt,total:v.limit,resetType:v.reset_type as '일간'|'주간',scope:v.scope==='계정당'?'account':'character'};
  });
}
function current(r:Record<string,unknown>,item:Catalog,now:Date){
  const v=r[item.id];if(!object(v)||v.period_version!==2)return {count:0,buyer:null};
  const start=typeof v.period_start==='number'?v.period_start:typeof v.period_start==='string'?Date.parse(v.period_start):NaN;
  if(start!==barterPeriodStart(item.resetType,now))return {count:0,buyer:null};
  if(!count(v.count)||v.count>item.total||(v.completed_by!==null&&!text(v.completed_by,120)))throw new BarterError(503);
  return {count:v.count,buyer:v.count>0?(v.completed_by as string|null):null};
}
function targets(chars:BarterCharacter[],id:string,scope:BarterScope){
  const chosen=chars.find(c=>String(c.id)===id);if(!chosen)throw new BarterError(403);
  const all=scope==='account'?chars:[chosen];if(all.length<1||all.length>100||new Set(all.map(c=>String(c.id))).size!==all.length||all.some(c=>!identity(String(c.id))||!text(c.nickname,120)))throw new BarterError(503);
  return {chosen,all:all.toSorted((a,b)=>String(a.id).localeCompare(String(b.id)))};
}
export function buildBarterDetails(chars:BarterCharacter[],input:unknown[],characterId:string,now:Date,digest:Digest){
  const rows:IrisBarterDetail[]=[],contexts:BarterWriteContext[]=[];
  for(const item of catalog(input)){
    const {all}=targets(chars,characterId,item.scope),copies=all.map(c=>{const r=raw(c);return {r,c,value:current(r,item,now),recordKey:recordKey(r,item.id,digest)};});
    const winner=copies.reduce((a,b)=>b.value.count>a.value.count?b:a),periodKey=new Date(barterPeriodStart(item.resetType,now)).toISOString();
    const expected=digest(canonical([true,{count:winner.value.count,completed_by:winner.value.buyer,period_version:2,period_start:barterPeriodStart(item.resetType,now)}]));
    rows.push({...item,completed:winner.value.count,completedBy:winner.value.buyer,periodKey,consistent:copies.every(c=>c.recordKey===expected)});
    contexts.push({tradeId:item.id,scope:item.scope,periodKey,catalogKey:digest(canonical(item)),baseRecords:copies.map(c=>({characterId:String(c.c.id),recordKey:c.recordKey}))});
  }
  return {rows,contexts};
}
export function planBarterEdit(chars:BarterCharacter[],input:unknown[],candidate:unknown,now:Date,digest:Digest){
  const edit=validateBarterEdit(candidate),item=catalog(input).find(i=>i.id===edit.tradeId);if(!item)throw new BarterError(400);
  if(item.scope!==edit.scope||digest(canonical(item))!==edit.catalogKey||new Date(barterPeriodStart(item.resetType,now)).toISOString()!==edit.periodKey)throw new BarterError(409);
  if(edit.baseCompleted>item.total||edit.desiredCompleted>item.total)throw new BarterError(400);
  const {chosen,all}=targets(chars,edit.characterId,item.scope);
  if(all.length!==edit.baseRecords.length||all.some(c=>!edit.baseRecords.some(b=>b.characterId===String(c.id))))throw new BarterError(409);
  const desired={count:edit.desiredCompleted,completed_by:edit.desiredCompleted?chosen.nickname:null,period_version:2,period_start:barterPeriodStart(item.resetType,now)};
  const expected=digest(canonical([true,desired]));
  const changes=all.map(c=>{
    const r=raw(c);current(r,item,now);const actual=recordKey(r,item.id,digest),baseline=edit.baseRecords.find(b=>b.characterId===String(c.id))!;
    if(actual!==baseline.recordKey&&actual!==expected)throw new BarterError(409);
    return {characterId:String(c.id),baseRaw:c.trade_checks??null,nextRaw:{...r,[item.id]:desired},changed:actual!==expected};
  }).filter(c=>c.changed);
  return {changes,completed:edit.desiredCompleted,completedBy:desired.completed_by,baseRecords:all.map(c=>({characterId:String(c.id),recordKey:expected}))};
}
