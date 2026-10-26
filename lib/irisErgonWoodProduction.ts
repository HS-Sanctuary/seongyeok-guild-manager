import {parseErgonPlans,requiredErgonRuns,type ErgonPlanItem} from './irisErgonPlan';
import {parseErgonProgressView,type ProgressScope} from './irisErgonProgress';

// Deliberately has no desktop-store/bridge/CLI process import. These ports may
// only be composed by isolated synthetic fixtures until native contracts exist.
export type WoodWork={id:string;recipeId:string;facilityId:string;readyAt:number;ready:boolean};
export type WoodSnapshot={source:'synthetic-cli';scope:ProgressScope;observedAt:number;version:number;unknown:boolean;external:boolean;logs:number;wood:number;wings:number;recipe:{id:string;output:number;logs:number;durationMs:number}|null;facility:{id:string;capacity:number}|null;gatherLimit:number|null;works:WoodWork[]};
export type WoodCommand={id:string;kind:'gather'|'register'|'collect';amount:number;workId:string|null};
export type WoodQuote={source:'synthetic-cli';commandId:string;version:number;expiresAt:number;wings:number|null;logs:number|null};
export type WoodReceipt={source:'synthetic-cli';scope:ProgressScope;commandId:string;beforeVersion:number;afterVersion:number;wings:number;logs:number;gainedLogs:number;work:WoodWork|null;delivery:{id:string;workId:string;quantity:number;closed:boolean}|null};
export type WoodApproval={id:string;maxWings:number;maxLogs:number;maxGather:number;expiresAt:number};
export type WoodConfig={scope:ProgressScope;goalId:string;plan:ErgonPlanItem;approval:WoodApproval};
type Phase='planning'|'dispatching'|'waiting'|'paused'|'blocked'|'completed';
type Event={command:WoodCommand;quote:WoodQuote;receipt:WoodReceipt|null};
export type WoodState={schemaVersion:1;revision:number;config:WoodConfig;phase:Phase;reason:string;version:number|null;facts:string|null;baselineWood:number|null;events:Event[]};
export type WoodResult=WoodState&{confirmed:number;openWorks:WoodWork[]};
export interface WoodRepository {mode:'synthetic';withActor<T>(scope:ProgressScope,body:()=>Promise<T>):Promise<T>;load():Promise<WoodState|null>;commit(expectedRevision:number,state:WoodState):Promise<WoodState>}
export interface SyntheticWoodCli {mode:'synthetic';observe():Promise<WoodSnapshot>;quote(command:WoodCommand,snapshot:WoodSnapshot):Promise<WoodQuote>;execute(command:WoodCommand,quote:WoodQuote):Promise<WoodReceipt>}
const clone=<T>(v:T):T=>structuredClone(v),same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
// Enough for the supported 100-unit small-yield scenario, still bounded. A
// pending event is completed in place, so its terminal record needs no new slot.
const commandLimit=1024;
function need(v:unknown,why:string):asserts v{if(!v)throw Error(why);}
const integer=(v:unknown,min=0,max=1_000_000):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const text=(v:unknown):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=160&&!/[\u0000-\u001f\u007f]/.test(v);
const sameScope=(a:ProgressScope,b:ProgressScope)=>a&&b&&a.environment===b.environment&&a.accountId===b.accountId&&a.characterId===b.characterId;
function work(w:WoodWork){need(w&&text(w.id)&&text(w.recipeId)&&text(w.facilityId)&&integer(w.readyAt,1,Number.MAX_SAFE_INTEGER)&&typeof w.ready==='boolean','작업 ID·완료 시각 미확인');}
function totals(s:WoodState){
 const ids=new Set<string>(),deliveries=new Set<string>(),works=new Map<string,WoodWork>();let confirmed=0,wings=0,logs=0,gather=0;
 need(Array.isArray(s.events)&&s.events.length<=commandLimit,'작업 기록 한도');
 for(const [index,event] of s.events.entries()){
  const {command:c,quote:q,receipt:r}=event;need(c&&text(c.id)&&!ids.has(c.id)&&['gather','register','collect'].includes(c.kind)&&integer(c.amount,1)&& (c.kind==='collect'?text(c.workId):c.workId===null),'명령 기록 불일치');ids.add(c.id);
  need(q&&q.source==='synthetic-cli'&&q.commandId===c.id&&integer(q.version,1,Number.MAX_SAFE_INTEGER)&&integer(q.expiresAt,1,Number.MAX_SAFE_INTEGER)&&integer(q.wings)&&integer(q.logs),'비용 기록 미확인');wings+=q.wings!;logs+=q.logs!;if(c.kind==='gather')gather+=c.amount;
  if(r===null){need(index===s.events.length-1,'미해결 기록 뒤 새 명령');continue;}
  need(r.source==='synthetic-cli'&&sameScope(r.scope,s.config.scope)&&r.commandId===c.id&&r.beforeVersion===q.version&&r.afterVersion===q.version+1&&r.wings===q.wings&&r.logs===q.logs&&integer(r.gainedLogs),'실행 영수증 불일치');
  if(c.kind==='register'){need(r.work!==null&&r.delivery===null&&r.gainedLogs===0,'등록 근거 누락');work(r.work!);need(!works.has(r.work!.id),'중복 작업 ID');works.set(r.work!.id,clone(r.work!));}
  else if(c.kind==='collect'){const d=r.delivery;need(r.work===null&&r.gainedLogs===0&&d&&text(d.id)&&!deliveries.has(d.id)&&d.workId===c.workId&&works.has(d.workId)&&integer(d.quantity,1)&&typeof d.closed==='boolean','중복·미소유 수령 근거');deliveries.add(d!.id);confirmed+=d!.quantity;if(d!.closed)works.delete(d!.workId);}
  else need(r.work===null&&r.delivery===null,'채집 영수증 불일치');
 }
 need(integer(confirmed)&&integer(wings)&&integer(logs)&&integer(gather),'누적 수량 한도');
 return {confirmed,wings,logs,gather,works:[...works.values()]};
}
function validate(s:WoodState,c:WoodConfig){
 need(s&&s.schemaVersion===1&&integer(s.revision,1,Number.MAX_SAFE_INTEGER)&&same(s.config,c)&&['planning','dispatching','waiting','paused','blocked','completed'].includes(s.phase)&&typeof s.reason==='string'&&s.reason.length<=500&&(s.version===null||integer(s.version,1,Number.MAX_SAFE_INTEGER))&&(s.baselineWood===null||integer(s.baselineWood))&&(s.facts===null||typeof s.facts==='string'),'저장 기록·소유권 불일치');totals(s);
}
export function createSyntheticWoodProduction(input:WoodConfig,repo:WoodRepository,cli:SyntheticWoodCli,readProgress:()=>Promise<unknown>,now:()=>Promise<number>){
 const config=clone(input);parseErgonPlans({schemaVersion:1,items:[config.plan]});need(repo.mode==='synthetic'&&cli.mode==='synthetic'&&config.scope.environment==='development'&&text(config.scope.accountId)&&text(config.scope.characterId)&&text(config.goalId)&&config.plan.kind==='altering'&&config.plan.displayName==='목재'&&config.plan.targetQuantity===100,'합성 목재100 시나리오 전용');
 const a=config.approval;need(a&&text(a.id)&&integer(a.maxWings)&&integer(a.maxLogs)&&integer(a.maxGather)&&integer(a.expiresAt,1,Number.MAX_SAFE_INTEGER),'승인 범위 미확인');
 let flight:Promise<WoodResult>|null=null;
 const result=(s:WoodState):WoodResult=>{const t=totals(s);return {...clone(s),confirmed:t.confirmed,openWorks:t.works};};
 async function save(s:WoodState,next:WoodState){const value={...clone(next),revision:s.revision+1};validate(value,config);const ack=await repo.commit(s.revision,value);need(same(ack,value),'저장 ACK 불일치');const loaded=await repo.load();need(same(loaded,value),'저장 재조회 불일치');return value;}
 async function load(){const s=await repo.load();if(s){validate(s,config);return s;}const first:WoodState={schemaVersion:1,revision:1,config,phase:'planning',reason:'',version:null,facts:null,baselineWood:null,events:[]};const ack=await repo.commit(0,clone(first));need(same(ack,first)&&same(await repo.load(),first),'초기 저장 ACK 미확인');return first;}
 async function block(s:WoodState,reason:string){return save(s,{...s,phase:'blocked',reason:reason.slice(0,500)});}
 async function observe(s:WoodState){
  const n=await now();need(integer(n,1,Number.MAX_SAFE_INTEGER)&&n<=config.approval.expiresAt,'승인 만료');const p=parseErgonProgressView(await readProgress(),config.scope),g=p.goals.find(g=>g.goalId===config.goalId);
  need(p.health==='ok'&&!p.goals.some(g=>g.quantityUnconfirmed)&&g&&g.sourcePlanId===config.plan.id&&g.action==='altering'&&g.displayName==='목재'&&g.targetQuantity===100&&g.lifecycle==='active'&&!g.detached,'native 목표·원장 확인 필요');
  const v=clone(await cli.observe());need(v&&v.source==='synthetic-cli'&&sameScope(v.scope,config.scope)&&integer(v.observedAt,1,Number.MAX_SAFE_INTEGER)&&integer(v.version,1,Number.MAX_SAFE_INTEGER)&&v.unknown===false&&v.external===false&&integer(v.logs)&&integer(v.wood)&&integer(v.wings),'재고·문맥·외부 개입 확인 필요');
  need(v.recipe&&text(v.recipe.id)&&integer(v.recipe.output,1)&&integer(v.recipe.logs,1)&&integer(v.recipe.durationMs,1)&&v.facility&&text(v.facility.id)&&integer(v.facility.capacity,1,100)&&Array.isArray(v.works)&&v.works.length<=v.facility.capacity,'시설 정원·재료·가공 시간 미확인');
  const ids=new Set<string>();for(const w of v.works){work(w);need(!ids.has(w.id)&&w.recipeId===v.recipe.id&&w.facilityId===v.facility.id,'시설 작업 불일치');ids.add(w.id);}
  const facts=JSON.stringify([v.recipe,v.facility,v.gatherLimit]);need(s.facts===null||s.facts===facts,'레시피·시설 문맥 변경');
  const t=totals(s);need(s.version===null||s.version===v.version,'외부 재고/작업 변경');need(s.baselineWood===null||v.wood===s.baselineWood+t.confirmed,'수령 기록·현재 재고 불일치');need(v.works.length===t.works.length&&t.works.every(w=>v.works.some(row=>row.id===w.id&&row.recipeId===w.recipeId&&row.facilityId===w.facilityId&&row.readyAt===w.readyAt)),'작업 ID/소유 기록 불일치');
  const end=await now();need(integer(end,1,Number.MAX_SAFE_INTEGER)&&end>=n&&end<=a.expiresAt&&end>=v.observedAt&&end-v.observedAt<=15000,'조회 중 승인 만료·시각 변경·스냅샷 만료');return {v,n:end,facts};
 }
 async function stepOnce(){
  let s=await load();if(s.phase==='completed'||s.phase==='blocked'||s.phase==='paused')return result(s);
  if(s.events.at(-1)?.receipt===null)return result(await block(s,'이전 명령 결과 미확인 · 자동 재전송 금지'));
  let v:WoodSnapshot,n:number;try{const observed=await observe(s);v=observed.v;n=observed.n;if(s.version===null){const runs=requiredErgonRuns(100,v.recipe!.output),logs=Math.max(0,runs*v.recipe!.logs-v.logs);need(!logs||integer(v.gatherLimit,1),'확인된 채집 한도 없음');const gathers=logs?Math.ceil(logs/v.gatherLimit!):0;need(runs+100+gathers<=commandLimit,'현재 기록 한도로 지원할 수 없는 계획 · 시작하지 않음');s=await save(s,{...s,version:v.version,facts:observed.facts,baselineWood:v.wood});}}catch(e){return result(await block(s,e instanceof Error?e.message:'조회 실패'));}
  const t=totals(s),remaining=Math.max(0,100-t.confirmed);if(!remaining)return result(await save(s,{...s,phase:'completed',reason:'실제 수령 확인으로 목표 달성 · 등록된 기존 작업은 취소하지 않음'}));
  const ready=v.works.find(w=>w.ready),runs=Math.max(0,requiredErgonRuns(remaining,v.recipe!.output)-t.works.length),free=v.facility!.capacity-v.works.length;
  let command:WoodCommand|null=null;
  if(ready)command={id:crypto.randomUUID(),kind:'collect',amount:1,workId:ready.id};
  else if(runs&&free){const shortage=Math.max(0,Math.min(runs,free)*v.recipe!.logs-v.logs);if(shortage){if(!integer(v.gatherLimit,1)){return result(await block(s,'확인된 채집 한도 없음'));}command={id:crypto.randomUUID(),kind:'gather',amount:Math.min(shortage,v.gatherLimit!),workId:null};}else command={id:crypto.randomUUID(),kind:'register',amount:1,workId:null};}
  if(!command)return result(s.phase==='waiting'?s:await save(s,{...s,phase:'waiting',reason:'확인된 작업 완료를 기다리는 중'}));
  const c=command;let q:WoodQuote;
  try{need(s.events.length<commandLimit,'작업 기록 한도');q=clone(await cli.quote(clone(c),clone(v)));const clock=await now();need(q.source==='synthetic-cli'&&q.commandId===c.id&&q.version===v.version&&integer(q.expiresAt,1,Number.MAX_SAFE_INTEGER)&&clock>=n&&clock<=q.expiresAt&&clock<=a.expiresAt&&integer(q.wings)&&integer(q.logs)&&q.logs===(c.kind==='register'?v.recipe!.logs:0),'명시 비용 quote 미확인');need(t.wings+q.wings!<=a.maxWings&&t.logs+q.logs!<=a.maxLogs&&t.gather+(c.kind==='gather'?c.amount:0)<=a.maxGather&&q.wings!<=v.wings&&q.logs!<=v.logs,'사용자 승인/현재 재화 범위 초과');}catch(e){return result(await block(s,e instanceof Error?e.message:'비용 불명'));}
  // Durable pending includes conservatively reserved costs before any dispatch.
  try{s=await save(s,{...s,phase:'dispatching',reason:'명령 결과 대기',events:[...s.events,{command:c,quote:q,receipt:null}]});}catch{return result(await block(s,'실행 전 저장 ACK 미확인 · 실행하지 않음'));}
  try{
   const checked=await observe(s),dispatchAt=await now();need(integer(dispatchAt,1,Number.MAX_SAFE_INTEGER)&&dispatchAt>=checked.n&&dispatchAt<=q.expiresAt&&dispatchAt<=a.expiresAt&&dispatchAt-checked.v.observedAt<=15000&&checked.v.logs===v.logs&&checked.v.wings===v.wings,'최종 승인/재고 변경');
   const receipt=clone(await cli.execute(clone(c),clone(q))),next=clone(s);next.events[next.events.length-1].receipt=receipt;const total=totals(next);const after=clone(await cli.observe());
   need(after.source==='synthetic-cli'&&sameScope(after.scope,config.scope)&&after.unknown===false&&after.external===false&&after.version===receipt.afterVersion&&after.wood===s.baselineWood!+total.confirmed&&after.wings===v.wings-receipt.wings&&after.logs===v.logs-receipt.logs+receipt.gainedLogs,'실행 영수증·재고 대조 실패');
   if(c.kind==='register')need(receipt.work!.recipeId===v.recipe!.id&&receipt.work!.facilityId===v.facility!.id&&receipt.work!.readyAt===v.observedAt+v.recipe!.durationMs,'등록 작업/시간 불일치');
   next.version=after.version;next.phase=total.confirmed>=100?'completed':'planning';next.reason=next.phase==='completed'?'실제 수령으로 목표 달성':'';
   // Revalidate the entire observation against the candidate, not expected output.
   await observe(next);s=await save(s,next);return result(s);
  }catch(e){return result(await block(s,e instanceof Error?e.message:'실행 결과 불명'));}
 }
 function step(){if(flight)return flight;const pending=repo.withActor(config.scope,stepOnce);flight=pending;void pending.finally(()=>{if(flight===pending)flight=null;}).catch(()=>{});return pending;}
 async function lifecycle(resume:boolean){return repo.withActor(config.scope,async()=>{let s=await load();if(s.phase==='blocked'||s.phase==='completed')return result(s);if(s.events.at(-1)?.receipt===null)return result(await block(s,'미해결 명령은 재개하지 않음'));if(resume){need(s.phase==='paused','보류 상태만 재개');try{await observe(s);}catch(e){return result(await block(s,e instanceof Error?e.message:'재개 확인 실패'));}}s=await save(s,{...s,phase:resume?'planning':'paused',reason:resume?'':'사용자 보류 · 진행 중 가공은 취소하지 않음'});return result(s);});}
 return {step,pause:()=>lifecycle(false),resume:()=>lifecycle(true)};
}
