import {parseErgonProgressView,parseErgonProgressAck,type ProgressScope,type ProgressView,type GoalView,type ErgonLifecycleWrite} from './irisErgonProgress';
import {parseErgonPlans,readErgonPlans,writeErgonPlans,type ErgonPlanItem} from './irisErgonPlan';
type CancelApi={loadErgonProgress:(s:ProgressScope)=>Promise<unknown>;setErgonGoalLifecycle:(s:ProgressScope,p:ErgonLifecycleWrite)=>Promise<unknown>};
const samePlan=(a:ErgonPlanItem,b:ErgonPlanItem)=>a.id===b.id&&a.kind===b.kind&&a.displayName===b.displayName&&a.targetQuantity===b.targetQuantity;
export function emptyErgonGoal(view:ProgressView,plan:ErgonPlanItem):GoalView{
 if(view.health!=='ok')throw Error('진행 기록과 원장을 먼저 확인해 주세요.');
 const rows=view.goals.filter(g=>g.sourcePlanId===plan.id&&!g.detached&&g.parentGoalId===null);
 if(rows.length!==1)throw Error('현재 계획의 목표를 하나로 확인하지 못했어요.');
 const g=rows[0];
 if(g.parentGoalId!==null||g.rootGoalId!==g.goalId||g.action!==plan.kind||g.displayName!==plan.displayName||g.targetQuantity!==plan.targetQuantity||g.detached||!['active','cancelled'].includes(g.lifecycle)||g.requests.length||g.confirmedQuantity||g.quantityUnconfirmed||g.registeredCount||view.goals.some(other=>other.goalId!==g.goalId&&other.rootGoalId===g.goalId))throw Error('실행·확인·보류 이력이 있는 목표는 지금 변경하거나 제거하지 않아요.');
 return g;
}
// Existing load/setLifecycle only. No create, prepare, bind, confirm or game API.
export function createErgonGoalCancellation(api:CancelApi,contextVersion:()=>number){
 const flights=new Map<string,Promise<{goal:GoalView;view:ProgressView;executionAllowed:false}>>();
 const cancel=(scope:ProgressScope,plan:ErgonPlanItem)=>{
  const owner={...scope},item=parseErgonPlans({schemaVersion:1,items:[plan]})[0],stamp=contextVersion(),key=JSON.stringify([scope,plan,stamp]);
  const current=()=>{if(stamp!==contextVersion()||JSON.stringify([scope,plan,stamp])!==key)throw Error('목표 문맥이 바뀌었어요. 원래 캐릭터에서 저장 상태를 확인해 주세요.');};
  const prior=flights.get(key);if(prior)return prior;
  const read=async()=>{current();const view=parseErgonProgressView(await api.loadErgonProgress(owner),owner);current();return {view,goal:emptyErgonGoal(view,item)};};
  const promise=(async()=>{
   let found=await read();const goalId=found.goal.goalId;
   if(found.goal.lifecycle==='active'){
    const payload:ErgonLifecycleWrite={revision:found.view.revision,operationId:crypto.randomUUID(),goalId,lifecycle:'cancelled'};current();
    try{await api.setErgonGoalLifecycle(owner,payload);}catch{/* An ACK loss is not success. Re-read native authority, never guess or retry consumption. */}
    found=await read();
   }
   if(found.goal.goalId!==goalId||found.goal.lifecycle!=='cancelled')throw Error('목표 취소를 확인하지 못했어요. 계획을 유지했어요.');
   current();return {...found,executionAllowed:false as const};
  })();flights.set(key,promise);void promise.finally(()=>flights.delete(key)).catch(()=>{});return promise;
 };
 return {cancel};
}
export function removeErgonPlanAfterCancel(storage:Pick<Storage,'getItem'|'setItem'>,scope:ProgressScope,plan:ErgonPlanItem):ErgonPlanItem[]{
 if(!['development','production'].includes(scope.environment)||!scope.accountId.trim()||!scope.characterId.trim())throw Error('계획 소유 범위를 확인해 주세요.');
 const item=parseErgonPlans({schemaVersion:1,items:[plan]})[0],before=readErgonPlans(storage,scope.environment,scope.accountId);
 if(!before.persistent||before.unreadable)throw Error('저장된 계획을 확인하지 못했어요.');
 const target=before.items.find(p=>p.id===item.id);if(target&&!samePlan(target,item))throw Error('계획이 바뀌었어요. 새로 확인해 주세요.');
 if(!target)return before.items;
 const next=before.items.filter(p=>p.id!==item.id);
 if(!writeErgonPlans(storage,scope.environment,scope.accountId,next))throw Error('목표는 취소됐지만 계획 제거는 저장하지 못했어요. 다시 확인해 주세요.');
 const after=readErgonPlans(storage,scope.environment,scope.accountId);
 if(!after.persistent||after.unreadable||JSON.stringify(after.items)!==JSON.stringify(next))throw Error('목표는 취소됐지만 계획 제거 결과를 확인하지 못했어요.');
 return after.items;
}

export type ErgonGoalReplacementWrite={revision:number;operationId:string;goalId:string;sourcePlanId:string;action:'crafting';displayName:string;targetQuantity:number;replacementQuantity:number};
type ReplacementApi={loadErgonProgress:(s:ProgressScope)=>Promise<unknown>;replaceErgonGoal:(s:ProgressScope,p:ErgonGoalReplacementWrite)=>Promise<unknown>};
async function replacementId(scope:ProgressScope,old:GoalView,quantity:number){const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(['ergon-replace-v1',scope.environment,scope.accountId,scope.characterId,old.goalId,old.sourcePlanId,old.action,old.displayName,old.targetQuantity,quantity]))));b[6]=(b[6]&15)|80;b[8]=(b[8]&63)|128;const h=Array.from(b.slice(0,16),n=>n.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
const emptyRoot=(g:GoalView,v:ProgressView)=>g.action==='crafting'&&g.parentGoalId===null&&g.rootGoalId===g.goalId&&!g.requests.length&&!g.confirmedQuantity&&!g.quantityUnconfirmed&&!g.registeredCount&&!v.goals.some(other=>other.goalId!==g.goalId&&other.rootGoalId===g.goalId);
export function createErgonGoalReplacement(api:ReplacementApi,contextVersion:()=>number){
 const flights=new Map<string,Promise<{goal:GoalView;view:ProgressView;executionAllowed:false}>>();
 const replace=(scope:ProgressScope,plan:ErgonPlanItem,quantity:number)=>{
  const owner={...scope},item=parseErgonPlans({schemaVersion:1,items:[plan]})[0],stamp=contextVersion(),key=JSON.stringify([owner,item,quantity,stamp]);
  const current=()=>{if(stamp!==contextVersion()||JSON.stringify([scope,plan,quantity,stamp])!==key)throw Error('목표 문맥이 바뀌었어요. 원래 캐릭터에서 저장 상태를 확인해 주세요.');};
  const prior=flights.get(key);if(prior)return prior;
  const read=async()=>{current();const v=parseErgonProgressView(await api.loadErgonProgress(owner),owner);current();if(v.health!=='ok')throw Error('진행 기록과 원장을 먼저 확인해 주세요.');return v;};
  const promise=(async()=>{
   if(item.kind!=='crafting'||!Number.isSafeInteger(quantity)||quantity<1||quantity>1000000||quantity===item.targetQuantity)throw Error('다른 목표 수량을 1~1000000개로 입력해 주세요.');
   let view=await read();const active=view.goals.filter(g=>g.sourcePlanId===item.id&&!g.detached&&['active','paused'].includes(g.lifecycle)&&g.parentGoalId===null);if(active.length!==1||active[0].lifecycle!=='active'||!emptyRoot(active[0],view))throw Error('실행·확인·보류 이력이 있는 목표는 수량을 변경하지 않아요.');
   let old:GoalView,operationId:string;
   if(samePlan(item,{id:active[0].sourcePlanId,kind:active[0].action,displayName:active[0].displayName,targetQuantity:active[0].targetQuantity})){
    old=emptyErgonGoal(view,item);operationId=await replacementId(owner,old,quantity);
   }else{
    // After restart, prove this exact replacement by replaying its stable operation.
    // A similar-looking active goal alone is never a durable receipt.
    const possible=view.goals.filter(g=>g.sourcePlanId===item.id&&g.displayName===item.displayName&&g.targetQuantity===item.targetQuantity&&g.lifecycle==='cancelled'&&g.detached&&emptyRoot(g,view));
    const matches=[];for(const g of possible){const op=await replacementId(owner,g,quantity);if(op===active[0].goalId&&active[0].displayName===item.displayName&&active[0].targetQuantity===quantity)matches.push({g,op});}if(matches.length!==1)throw Error('계획과 다른 목표예요. 저장 상태 확인이 필요해요.');old=matches[0].g;operationId=matches[0].op;
   }
   current();const payload:ErgonGoalReplacementWrite={revision:view.revision,operationId,goalId:old.goalId,sourcePlanId:item.id,action:'crafting',displayName:item.displayName,targetQuantity:item.targetQuantity,replacementQuantity:quantity};
   const ack=parseErgonProgressAck(await api.replaceErgonGoal(owner,payload),owner,operationId);current();if(!['committed','already-applied'].includes(ack.status))throw Error('목표를 변경하지 못했어요. 저장 상태 확인이 필요해요.');
   view=await read();const goal=view.goals.find(g=>g.goalId===operationId),previous=view.goals.find(g=>g.goalId===old.goalId),roots=view.goals.filter(g=>g.sourcePlanId===item.id&&!g.detached&&['active','paused'].includes(g.lifecycle)&&g.parentGoalId===null);
   if(view.revision<ack.revision||!previous||previous.lifecycle!=='cancelled'||!previous.detached||previous.targetQuantity!==item.targetQuantity||!goal||!emptyRoot(goal,view)||goal.sourcePlanId!==item.id||goal.displayName!==item.displayName||goal.targetQuantity!==quantity||goal.lifecycle!=='active'||goal.detached||roots.length!==1||roots[0].goalId!==operationId)throw Error('대체 목표 저장 상태 확인이 필요해요. 계획은 유지했어요.');
   return {goal,view,executionAllowed:false as const};
  })();flights.set(key,promise);void promise.finally(()=>flights.delete(key)).catch(()=>{});return promise;
 };
 return {replace};
}
export function replaceErgonPlanAfterGoal(storage:Pick<Storage,'getItem'|'setItem'>,scope:ProgressScope,plan:ErgonPlanItem,quantity:number):ErgonPlanItem[]{
 const item=parseErgonPlans({schemaVersion:1,items:[{...plan,targetQuantity:quantity}]})[0];if(plan.kind!=='crafting'||!['development','production'].includes(scope.environment)||!scope.accountId.trim()||!scope.characterId.trim())throw Error('목표 소유 범위를 확인해 주세요.');
 const before=readErgonPlans(storage,scope.environment,scope.accountId);if(!before.persistent||before.unreadable)throw Error('계획 저장 상태 확인이 필요해요.');const old=before.items.find(p=>p.id===plan.id);if(!old||!samePlan(old,plan)&&!samePlan(old,item))throw Error('다른 편집이 있어요. 기존 계획을 유지해요.');if(samePlan(old,item))return before.items;
 const next=before.items.map(p=>p.id===item.id?item:p);if(!writeErgonPlans(storage,scope.environment,scope.accountId,next))throw Error('native 목표는 변경됐지만 계획 저장 상태 확인이 필요해요.');const verified=readErgonPlans(storage,scope.environment,scope.accountId);if(!verified.persistent||verified.unreadable||JSON.stringify(verified.items)!==JSON.stringify(next))throw Error('계획 변경 저장 상태 확인이 필요해요.');return verified.items;
}
