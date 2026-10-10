import {kronosPeriodStart} from './kronos';
export type WorkspaceKey={itemKind:'shop'|'mission';itemId:string;field:'count'|'bookmark';scope:'account'|'character';periodKey:string;catalogKey:string};
export type WorkspaceEdit=WorkspaceKey&{requestId:string;accountId:string;characterId:string;baseCompleted:number;desiredCompleted:number};
export type WorkspaceRow={id:string;itemKind:'shop'|'mission';title:string;location:string;npc:string;description:string;rewards:{name:string;count:number}[];cost:number|null;requirement:string|null;total:number;resetType:'일간'|'주간';scope:'account'|'character';completed:number;bookmarked:boolean;key:WorkspaceKey};
export class WorkspaceError extends Error{constructor(public status:number){super('상점·임무 정보를 다시 확인해 주세요.');}}
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max=500):v is string=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v);
const id=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=100&&!/[\u0000-\u0020\u007f]/u.test(v);
const count=(v:unknown,max=9999):v is number=>Number.isSafeInteger(v)&&(v as number)>=0&&(v as number)<=max;
export function validWorkspaceKey(v:unknown):v is WorkspaceKey&Record<string,unknown>{
  return obj(v)&&['shop','mission'].includes(String(v.itemKind))&&typeof v.itemId==='string'&&/^[1-9]\d{0,14}$/.test(v.itemId)&&Number.isSafeInteger(Number(v.itemId))&&['count','bookmark'].includes(String(v.field))&&['account','character'].includes(String(v.scope))&&(v.itemKind!=='mission'||v.scope==='character')&&typeof v.catalogKey==='string'&&/^[a-f0-9]{64}$/.test(v.catalogKey)&&typeof v.periodKey==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/.test(v.periodKey)&&Number.isFinite(Date.parse(v.periodKey))&&new Date(v.periodKey).toISOString()===v.periodKey;
}
export function validateWorkspaceEdit(v:unknown):WorkspaceEdit{
  const fields=['itemKind','itemId','field','scope','periodKey','catalogKey','requestId','accountId','characterId','baseCompleted','desiredCompleted'];
  if(!obj(v)||Object.keys(v).length!==fields.length||fields.some(f=>!Object.hasOwn(v,f))||!validWorkspaceKey(v)||!id(v.accountId)||!id(v.characterId)||typeof v.requestId!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.requestId)||!count(v.baseCompleted,v.field==='bookmark'?1:9999)||!count(v.desiredCompleted,v.field==='bookmark'?1:9999))throw new WorkspaceError(400);
  return structuredClone(v) as WorkspaceEdit;
}
export function buildWorkspaceDetails(shops:unknown[],missions:unknown[],progress:unknown[],nickname:string,now:Date,digest:(v:string)=>string):WorkspaceRow[]{
  if(!Array.isArray(shops)||!Array.isArray(missions)||!Array.isArray(progress)||shops.length>500||missions.length>500||progress.length>1000)throw new WorkspaceError(503);
  const records=new Map<string,Record<string,unknown>>();
  for(const p of progress){
    if(!obj(p)||!['shop','mission'].includes(String(p.kind))||!Number.isSafeInteger(Number(p.item_id))||Number(p.item_id)<1||!(p.character_name===null||text(p.character_name,100))||!count(p.count)||typeof p.bookmarked!=='boolean'||typeof p.period_start!=='string'||!Number.isFinite(Date.parse(p.period_start)))throw new WorkspaceError(503);
    if(p.character_name!==null&&p.character_name!==nickname)continue;
    const key=JSON.stringify([p.kind,String(p.item_id),p.character_name]);if(records.has(key))throw new WorkspaceError(503);records.set(key,p);
  }
  const ids=new Set<string>();return [...shops.map(v=>({v,itemKind:'shop' as const})),...missions.map(v=>({v,itemKind:'mission' as const}))].map(({v,itemKind})=>{
    if(!obj(v)||!Number.isSafeInteger(Number(v.id))||Number(v.id)<1||v.is_active!==true)throw new WorkspaceError(503);
    const itemId=String(v.id),identity=itemKind+':'+itemId;if(ids.has(identity))throw new WorkspaceError(503);ids.add(identity);
    const shop=itemKind==='shop',scope=shop&&v.scope==='계정당'?'account':'character',resetType=shop?v.reset_type:'주간',total=shop?v.limit:v.max_count;
    if(!count(total)||total<1||!['일간','주간'].includes(String(resetType))||(shop&&!['계정당','캐릭당'].includes(String(v.scope))))throw new WorkspaceError(503);
    const title=shop?v.reward:v.title,location=shop?v.map:v.town,npc=shop?v.npc:'',description=shop?'':v.description;
    const rewards=shop?[{name:v.reward,count:v.reward_cnt}]:v.rewards;
    if(!text(title,200)||!title.trim()||!text(location,200)||!text(npc,200)||!text(description,4000)||!Array.isArray(rewards)||rewards.length<1||rewards.length>6||rewards.some(r=>!obj(r)||!text(r.name,200)||!r.name.trim()||!count(r.count,1_000_000_000)||r.count<1)||(shop&&!count(v.cost_cnt,1_000_000_000)))throw new WorkspaceError(503);
    const periodKey=new Date(kronosPeriodStart(now,resetType==='일간')).toISOString(),p=records.get(JSON.stringify([itemKind,itemId,scope==='account'?null:nickname]));
    const completed=p&&Date.parse(p.period_start as string)===Date.parse(periodKey)?p.count as number:0;
    // Preserve a real count above a newly reduced limit; CAS must not use a clamped baseline.
    const row={id:itemId,itemKind,title,location,npc,description,rewards:rewards as {name:string;count:number}[],cost:shop?v.cost_cnt as number:null,requirement:shop&&v.reward==='사포'&&['앨빈','델렌'].includes(String(v.npc))?'생활력 7,000 이상':shop&&v.npc==='조셀린'&&v.reward==='상급 설비 증축 도면'?'아르바이트 Lv.15 이상':null,total,resetType:resetType as '일간'|'주간',scope:scope as 'account'|'character'};
    const key:WorkspaceKey={itemKind,itemId,scope:row.scope,field:'count',periodKey,catalogKey:digest(JSON.stringify(row))};
    return {...row,completed,bookmarked:p?.bookmarked as boolean??false,key};
  });
}
export function parseWorkspaceRows(value:unknown):WorkspaceRow[]{
  if(!Array.isArray(value)||value.length>1000)throw new WorkspaceError(502);
  const ids=new Set<string>();return value.map(v=>{
    if(!obj(v)||!validWorkspaceKey(v.key)||v.id!==v.key.itemId||v.itemKind!==v.key.itemKind||v.scope!==v.key.scope||!count(v.completed)||!count(v.total)||v.total<1||typeof v.bookmarked!=='boolean'||!['일간','주간'].includes(String(v.resetType))||![v.title,v.location,v.npc,v.description].every(x=>text(x,4000))||!Array.isArray(v.rewards)||v.rewards.length<1||v.rewards.length>6||v.rewards.some(r=>!obj(r)||!text(r.name,200)||!count(r.count,1_000_000_000))||(v.cost!==null&&!count(v.cost,1_000_000_000))||(v.requirement!==null&&!text(v.requirement))||ids.has(v.itemKind+':'+v.id))throw new WorkspaceError(502);
    ids.add(v.itemKind+':'+v.id);return structuredClone(v) as WorkspaceRow;
  });
}
