// Phase 1 read contract only: no file, bridge, game, browser storage or network IO.
export type ProgressScope = {environment:'development'|'production';accountId:string;characterId:string};
export type QuantityConfirmation = {eventId:string;revision:number;quantity:number;source:'user-confirmed';confirmedAt:number;supersedesEventId:string|null;reason:string|null};
export type ProgressRequestView = {requestId:string;action:'crafting'|'altering'|'gathering';displayName:string;craftCount:number|null;outputPerCraft:number|null;expectedOutput:number|null;processingRound:number|null;preparedAt:number;expiresAt:number;terminalOutcome:'completed'|'registered'|'rejected'|'stopped'|null;quantity:number|null;confirmations:QuantityConfirmation[]};
export type GoalView = {goalId:string;sourcePlanId:string;parentGoalId:string|null;rootGoalId:string;action:ProgressRequestView['action'];displayName:string;targetQuantity:number;lifecycle:'active'|'paused'|'cancelled'|'archived';detached:boolean;confirmedQuantity:number;remainingQuantity:number;excessQuantity:number;quantityUnconfirmed:boolean;quantitySatisfied:boolean;registeredCount:number;requests:ProgressRequestView[]};
export type ProgressView = {schemaVersion:1;revision:number;health:'ok'|'review-required'|'unavailable';scope:ProgressScope;capacityWarning:boolean;recoveryCandidates:{commitDigest:string;revision:number}[];goals:GoalView[]};
export type ErgonQuantityWrite={revision:number;operationId:string;goalId:string;requestId:string;quantity:number;supersedesEventId?:string;reason?:string};
export type ErgonLifecycleWrite={revision:number;operationId:string;goalId:string;lifecycle:'paused'|'cancelled'};
export type ErgonProgressAck={status:'committed'|'already-applied'|'conflict'|'rejected'|'unavailable';operationId:string;revision:number;view:ProgressView|null;error:string|null};
export function parseErgonProgressAck(value:unknown,scope:ProgressScope,operationId:string,submitted?:ErgonQuantityWrite|ErgonLifecycleWrite):ErgonProgressAck{
 const r=record(value,['status','operationId','revision','view','error']),status=choice(r.status,['committed','already-applied','conflict','rejected','unavailable']),revision=integer(r.revision);
 if(uuid(r.operationId)!==uuid(operationId))return fail();
 const view=r.view===null?null:parseErgonProgressView(r.view,scope);
 if(view&&view.revision!==revision||(status==='committed'||status==='already-applied')&&(!view||view.health!=='ok'||r.error!==null))return fail();
 if(submitted&&(status==='committed'||status==='already-applied')){
  if(revision<=submitted.revision)return fail();
  const goal=view!.goals.find(g=>g.goalId===submitted.goalId);if(!goal)return fail();
  if('requestId' in submitted){
   const request=goal.requests.find(r=>r.requestId===submitted.requestId),event=request?.confirmations.find(c=>c.eventId===operationId);
   if(!event||event.quantity!==submitted.quantity||event.revision!==submitted.revision+1||event.supersedesEventId!==(submitted.supersedesEventId??null)||event.reason!==(submitted.reason??null))return fail();
   if(status==='committed'&&(event.revision!==revision||request!.confirmations.at(-1)?.eventId!==operationId))return fail();
  }else if(status==='committed'&&(goal.lifecycle!==submitted.lifecycle||revision!==submitted.revision+1))return fail();
 }
 return {status,operationId,revision,view,error:r.error===null?null:text(r.error,1000)};
}
const fail = ():never => {throw new Error('Invalid ERGON progress projection');};
function record(value:unknown, keys:string[]):Record<string,unknown> {
  if(!value||typeof value!=='object'||Array.isArray(value)) return fail();
  const r=value as Record<string,unknown>;
  if(Object.keys(r).length!==keys.length||keys.some(k=>!Object.hasOwn(r,k))) return fail();
  return r;
}
function integer(v:unknown,min=0,max=Number.MAX_SAFE_INTEGER):number {if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min||v>max) return fail();return v;}
function text(v:unknown,max:number):string {if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u001f\u007f]/.test(v))return fail();return v;}
function uuid(v:unknown):string {const s=text(v,36);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s)||s==='00000000-0000-0000-0000-000000000000')return fail();return s;}
function choice<T extends string>(v:unknown,values:readonly T[]):T {if(typeof v!=='string'||!values.includes(v as T))return fail();return v as T;}
function flag(v:unknown):boolean {if(typeof v!=='boolean')return fail();return v;}
function list(v:unknown,max:number):unknown[] {if(!Array.isArray(v)||v.length>max)return fail();return v;}
function scopeOf(v:unknown):ProgressScope {const r=record(v,['environment','accountId','characterId']);return {environment:choice(r.environment,['development','production']),accountId:text(r.accountId,100),characterId:text(r.characterId,100)};}
const actions=['crafting','altering','gathering'] as const;
export function parseErgonQuantityInput(value:string):{kind:'empty'}|{kind:'invalid'}|{kind:'valid';quantity:number} {
  if(typeof value!=='string')return {kind:'invalid'};
  const s=value.trim();if(!s)return {kind:'empty'};
  if(!/^[0-9]{1,7}$/.test(s))return {kind:'invalid'};
  const n=Number(s);return n<=5_000_000?{kind:'valid',quantity:n}:{kind:'invalid'};
}
export function parseErgonProgressView(value:unknown,scope:ProgressScope):ProgressView {
  const expected=scopeOf(scope), v=record(value,['schemaVersion','revision','health','scope','capacityWarning','recoveryCandidates','goals']);
  if(v.schemaVersion!==1)return fail();
  const actual=scopeOf(v.scope);
  if(actual.environment!==expected.environment||actual.accountId!==expected.accountId||actual.characterId!==expected.characterId)return fail();
  const revision=integer(v.revision),health=choice(v.health,['ok','review-required','unavailable']);
  const goalIds=new Set<string>(),requestIds=new Set<string>(),eventIds=new Set<string>(),eventRevisions=new Set<number>();let requestCount=0,eventCount=0;
  const goals:GoalView[]=list(v.goals,100).map(value=>{
    const g=record(value,['goalId','sourcePlanId','parentGoalId','rootGoalId','action','displayName','targetQuantity','lifecycle','detached','confirmedQuantity','remainingQuantity','excessQuantity','quantityUnconfirmed','quantitySatisfied','registeredCount','requests']);
    const goalId=uuid(g.goalId);if(goalIds.has(goalId))return fail();goalIds.add(goalId);
    const action=choice(g.action,actions), displayName=text(g.displayName,160), targetQuantity=integer(g.targetQuantity,1,1_000_000);
    let processingRound=0;
    const requests:ProgressRequestView[]=list(g.requests,1000).map(value=>{
      if(++requestCount>1000)return fail();
      const r=record(value,['requestId','action','displayName','craftCount','outputPerCraft','expectedOutput','processingRound','preparedAt','expiresAt','terminalOutcome','quantity','confirmations']);
      const requestId=uuid(r.requestId);if(requestIds.has(requestId))return fail();requestIds.add(requestId);
      const ra=choice(r.action,actions);if(ra!==action||text(r.displayName,160)!==displayName)return fail();
      const craftCount=ra==='crafting'?integer(r.craftCount,1,5):null,outputPerCraft=ra==='crafting'?integer(r.outputPerCraft,1,1_000_000):null,expectedOutput=ra==='crafting'?integer(r.expectedOutput,1,5_000_000):null;
      if(ra==='crafting' ? expectedOutput!==craftCount!*outputPerCraft! : r.craftCount!==null||r.outputPerCraft!==null||r.expectedOutput!==null)return fail();
      const round=ra==='altering'?integer(r.processingRound,1,1000):null;
      if(ra==='altering' ? round!==++processingRound : r.processingRound!==null)return fail();
      const preparedAt=integer(r.preparedAt,1,8_640_000_000_000_000),expiresAt=integer(r.expiresAt,preparedAt,8_640_000_000_000_000);
      const terminalOutcome=r.terminalOutcome===null?null:choice(r.terminalOutcome,['completed','registered','rejected','stopped']);
      if(terminalOutcome==='registered'&&ra!=='altering'||terminalOutcome==='completed'&&ra==='altering')return fail();
      let previous:QuantityConfirmation|null=null;
      const confirmations:QuantityConfirmation[]=list(r.confirmations,4000).map(value=>{
        if(++eventCount>4000)return fail();
        const c=record(value,['eventId','revision','quantity','source','confirmedAt','supersedesEventId','reason']);
        const eventId=uuid(c.eventId),rev=integer(c.revision,1,revision);
        if(eventIds.has(eventId)||eventRevisions.has(rev)||previous&&rev<=previous.revision)return fail();eventIds.add(eventId);eventRevisions.add(rev);
        const supersedesEventId=c.supersedesEventId===null?null:uuid(c.supersedesEventId),reason=c.reason===null?null:text(c.reason,400);
        if(previous?supersedesEventId!==previous.eventId||reason===null:supersedesEventId!==null||reason!==null)return fail();
        const result:QuantityConfirmation={eventId,revision:rev,quantity:integer(c.quantity,0,5_000_000),source:choice(c.source,['user-confirmed']),confirmedAt:integer(c.confirmedAt,1,8_640_000_000_000_000),supersedesEventId,reason};previous=result;return result;
      });
      const quantity=r.quantity===null?null:integer(r.quantity,0,5_000_000),latest=confirmations.at(-1);
      if(quantity!==(latest?.quantity??null)||confirmations.length>0&&(ra!=='crafting'||terminalOutcome!=='completed'))return fail();
      return {requestId,action:ra,displayName,craftCount,outputPerCraft,expectedOutput,processingRound:round,preparedAt,expiresAt,terminalOutcome,quantity,confirmations};
    });
    const confirmedQuantity=requests.reduce((sum,r)=>sum+(r.quantity??0),0),remainingQuantity=Math.max(0,targetQuantity-confirmedQuantity),excessQuantity=Math.max(0,confirmedQuantity-targetQuantity);
    const quantityUnconfirmed=requests.some(r=>r.terminalOutcome===null||r.action==='crafting'&&r.terminalOutcome==='completed'&&r.quantity===null);
    const quantitySatisfied=health==='ok'&&!quantityUnconfirmed&&confirmedQuantity>=targetQuantity,registeredCount=requests.filter(r=>r.action==='altering'&&r.terminalOutcome==='registered').length;
    if(integer(g.confirmedQuantity)!==confirmedQuantity||integer(g.remainingQuantity)!==remainingQuantity||integer(g.excessQuantity)!==excessQuantity||flag(g.quantityUnconfirmed)!==quantityUnconfirmed||flag(g.quantitySatisfied)!==quantitySatisfied||integer(g.registeredCount)!==registeredCount)return fail();
    return {goalId,sourcePlanId:text(g.sourcePlanId,100),parentGoalId:g.parentGoalId===null?null:uuid(g.parentGoalId),rootGoalId:uuid(g.rootGoalId),action,displayName,targetQuantity,lifecycle:choice(g.lifecycle,['active','paused','cancelled','archived']),detached:flag(g.detached),confirmedQuantity,remainingQuantity,excessQuantity,quantityUnconfirmed,quantitySatisfied,registeredCount,requests};
  });
  for(const g of goals) {
    const seen=new Set<string>();let current=g;
    while(current.parentGoalId!==null) {if(seen.has(current.goalId))return fail();seen.add(current.goalId);const parent=goals.find(x=>x.goalId===current.parentGoalId);if(!parent)return fail();current=parent;}
    if(current.goalId!==g.rootGoalId)return fail();
  }
  const candidates=new Set<string>();
  const recoveryCandidates=list(v.recoveryCandidates,200).map(value=>{const r=record(value,['commitDigest','revision']);const digest=text(r.commitDigest,64);if(!/^[0-9a-f]{64}$/.test(digest)||candidates.has(digest))return fail();candidates.add(digest);return {commitDigest:digest,revision:integer(r.revision,1)};});
  if(health==='unavailable'&&goals.length)return fail();
  return {schemaVersion:1,revision,health,scope:actual,capacityWarning:flag(v.capacityWarning),recoveryCandidates,goals};
}
