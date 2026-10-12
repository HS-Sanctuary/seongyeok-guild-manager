import {isTaskChecked,setChecklistField} from './matchingUtils';
import {kronosPeriodStart} from './kronos';
export type HomeCharacter={id:string|number;nickname:string;owner?:string;[key:string]:unknown};
type Item={id:string|number;name?:string;[key:string]:unknown};
type Kind='daily'|'weekly'|'raid';
type Edit={item:Item;kind:Kind;completed:boolean;version:number;period?:number};
type Node={base:HomeCharacter;edits:Map<string,Edit>;dueAt:number;flight:Promise<void>|null;error:string;timer?:unknown};
export function createHomeChecklistAutosave(options:{account:{id:string;nickname:string};save:(character:HomeCharacter,payload:Record<string,unknown>)=>Promise<HomeCharacter>;onSaved?(row:HomeCharacter):void;now?:()=>number;schedule?:(fn:()=>Promise<void>,delay:number)=>unknown;cancel?:(timer:unknown)=>void}){
  const now=options.now??Date.now,schedule=options.schedule??((fn,ms)=>setTimeout(()=>void fn(),ms)),cancel=options.cancel??(timer=>clearTimeout(timer as ReturnType<typeof setTimeout>));
  const nodes=new Map<string,Node>(),listeners=new Set<()=>void>();let version=0,disposed=false;
  const notify=()=>listeners.forEach(fn=>fn()),key=(edit:Pick<Edit,'kind'|'item'>)=>edit.kind+':'+edit.item.id;
  const checked=(row:HomeCharacter,edit:Edit,catalog:Item[])=>isTaskChecked(row[edit.kind+'_checks'],edit.item,catalog);
  function stop(node:Node){if(node.timer!==undefined)cancel(node.timer);node.timer=undefined;}
  function arm(node:Node,catalog:Item[]){stop(node);if(disposed||node.flight||node.error||!node.edits.size)return;node.timer=schedule(async()=>{node.timer=undefined;try{await saveOne(node,catalog);}catch{/* Explicit retry only; preserve optimistic edits. */}},Math.max(0,node.dueAt-now()));}
  function saveOne(node:Node,catalog:Item[]):Promise<void>{
    if(node.flight)return node.flight;if(disposed)return Promise.reject(Error('저장 화면이 닫혔어요.'));if(!node.edits.size)return Promise.resolve();stop(node);node.error='';
    const edits=new Map(node.edits),base={...node.base},payload:Record<string,unknown>={},original:Record<string,unknown>={},periods:Record<string,string>={};
    if([...edits.values()].some(edit=>edit.period!==kronosPeriodStart(new Date(now()),edit.kind==='daily'))){node.error='숙제 초기화 시간이 지났어요. 새로고침 후 현재 기간을 확인해 주세요.';notify();return Promise.reject(Error(node.error));}
    for(const edit of edits.values()){const field=edit.kind+'_checks';if(!(field in original))original[field]=base[field]??null;payload[field]=setChecklistField(field in payload?payload[field]:base[field],edit.item,edit.completed,edit.kind,catalog);}
    for(const edit of edits.values())periods[edit.kind+'_checks']=new Date(edit.period!).toISOString();
    payload._checklistBase=original;payload._checklistPeriods=periods;
    node.flight=Promise.resolve().then(()=>options.save(base,payload)).then(saved=>{if(disposed)return;if(!saved||saved.id!==base.id||saved.nickname!==base.nickname||saved.owner!==options.account.nickname)throw Error('저장된 캐릭터를 확인하지 못했어요. 변경은 유지했어요.');node.base=saved;if([...edits.values()].some(edit=>!Object.hasOwn(saved,edit.kind+'_checks')||checked(saved,edit,catalog)!==edit.completed))throw Error('다른 화면의 숙제 변경을 확인해야 해요. 변경은 유지했으니 다시 저장해 주세요.');for(const [id,edit] of node.edits){if(edits.get(id)?.version===edit.version||checked(saved,edit,catalog)===edit.completed)node.edits.delete(id);}options.onSaved?.(saved);}).catch(error=>{if(!disposed)node.error=error instanceof Error?error.message:'저장하지 못했어요. 변경은 유지했어요.';throw error;}).finally(()=>{node.flight=null;if(!disposed){notify();arm(node,catalog);}});notify();return node.flight;
  }
  return {
    state(){const rows=[...nodes.values()];return {pending:rows.reduce((n,row)=>n+row.edits.size,0),saving:rows.some(row=>!!row.flight),error:rows.find(row=>row.error)?.error??'',dueAt:rows.filter(row=>row.edits.size&&!row.error).reduce<number|null>((min,row)=>min===null?row.dueAt:Math.min(min,row.dueAt),null)};},
    subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},
    overlay(row:HomeCharacter,catalog:Item[]){const node=nodes.get(String(row.id));if(!node||(!node.edits.size&&!node.flight))return row;const next={...node.base};for(const edit of node.edits.values()){const field=edit.kind+'_checks';next[field]=setChecklistField(next[field],edit.item,edit.completed,edit.kind,catalog);}return next;},
    edit(row:HomeCharacter,item:Item,kind:Kind,catalog:Item[]){if(disposed)throw Error('저장 화면이 닫혔어요.');if(!row.id||!row.nickname||row.owner!==options.account.nickname||item.id==null)throw Error('본인 캐릭터만 체크할 수 있어요.');let node=nodes.get(String(row.id));if(!node){node={base:row,edits:new Map(),dueAt:now()+15000,flight:null,error:''};nodes.set(String(row.id),node);}else if(!node.edits.size&&!node.flight)node.base=row;const probe:Edit={item,kind,completed:false,version:++version,period:kronosPeriodStart(new Date(now()),kind==='daily')},existing=node.edits.get(key(probe));const completed=!(existing?.completed??checked(node.base,probe,catalog));probe.completed=completed;if(!node.flight&&checked(node.base,probe,catalog)===completed)node.edits.delete(key(probe));else node.edits.set(key(probe),probe);node.dueAt=now()+15000;notify();arm(node,catalog);},
    async flush(catalog:Item[]=[]){if(disposed)throw Error('저장 화면이 닫혔어요.');for(const node of nodes.values()){stop(node);if(node.flight)await node.flight;while(node.edits.size)await saveOne(node,catalog);}},
    dispose(){disposed=true;for(const node of nodes.values())stop(node);listeners.clear();},
  };
}
