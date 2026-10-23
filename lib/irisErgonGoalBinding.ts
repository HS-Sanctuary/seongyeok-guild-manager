import {parseErgonProgressView,type ProgressScope,type ProgressView,type GoalView} from './irisErgonProgress';
import type {ErgonPlanItem} from './irisErgonPlan';
import type {ErgonChallenge} from './irisErgonActions';
export type ErgonGoalWrite={revision:number;operationId:string;goalId:string;sourcePlanId:string;parentGoalId:null;action:ErgonPlanItem['kind'];displayName:string;targetQuantity:number};
export type ErgonBindingWrite={revision:number;operationId:string;goalId:string;nonce:string};
export type ErgonGoalApi={loadErgonProgress(scope:ProgressScope):Promise<unknown>;createErgonGoal(scope:ProgressScope,p:ErgonGoalWrite):Promise<unknown>;bindErgonPrepared?(scope:ProgressScope,p:ErgonBindingWrite):Promise<unknown>};
const sameScope=(a:ProgressScope,b:ProgressScope)=>a.environment===b.environment&&a.accountId===b.accountId&&a.characterId===b.characterId;
const matches=(g:GoalView,p:ErgonPlanItem)=>g.sourcePlanId===p.id&&g.action===p.kind&&g.displayName===p.displayName&&g.targetQuantity===p.targetQuantity;
export function selectErgonNativeGoal(view:ProgressView|null,scope:ProgressScope,plan:ErgonPlanItem):GoalView|null{
 if(!view||view.health!=='ok'||!sameScope(view.scope,scope))return null;
 const candidates=view.goals.filter(g=>g.sourcePlanId===plan.id&&g.parentGoalId===null&&!g.detached&&g.lifecycle!=='cancelled'&&g.lifecycle!=='archived');
 return candidates.length===1&&matches(candidates[0],plan)?candidates[0]:null;
}
async function stableId(value:unknown){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))));bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s)&&s!=='00000000-0000-0000-0000-000000000000';
// Non-consuming admission only. This module has no prepare/confirm/collect API.
export function createErgonGoalBinding(api:ErgonGoalApi,contextVersion:()=>number){
 const flights=new Map<string,Promise<{goal:GoalView;view:ProgressView;executionAllowed:false}>>();
 const capture=(scope:ProgressScope,plan:ErgonPlanItem)=>{const stamp=contextVersion(),owner={...scope},item={...plan},key=JSON.stringify([owner,item]);const current=()=>{if(stamp!==contextVersion()||key!==JSON.stringify([scope,plan]))throw Error('목표 문맥이 바뀌었어요. 다시 확인해 주세요.');};return {owner,item,key,current};};
 const read=async(scope:ProgressScope,current:()=>void)=>{current();const v=parseErgonProgressView(await api.loadErgonProgress(scope),scope);current();if(v.health!=='ok')throw Error('진행 기록과 원장을 확인해 주세요.');return v;};
 const ensure=(scope:ProgressScope,plan:ErgonPlanItem)=>{
  const c=capture(scope,plan),flightKey=JSON.stringify([contextVersion(),c.key]);const existing=flights.get(flightKey);if(existing)return existing;
  const promise=(async()=>{
   if(!['crafting','altering','gathering'].includes(c.item.kind)||!c.item.id||c.item.id.length>100||!c.item.displayName||c.item.displayName.length>160||!Number.isSafeInteger(c.item.targetQuantity)||c.item.targetQuantity<1||c.item.targetQuantity>1000000)throw Error('목표 품목과 수량을 확인해 주세요.');
   let view=await read(c.owner,c.current);let goal=selectErgonNativeGoal(view,c.owner,c.item);if(goal)return {goal,view,executionAllowed:false as const};
   if(view.goals.some(g=>g.sourcePlanId===c.item.id))throw Error('같은 계획의 기존 목표를 먼저 확인해 주세요.');
   // Stable across restarts and concurrent writers. A collision never authorizes a different goal.
   const identity=[c.owner.environment,c.owner.accountId,c.owner.characterId,c.item.id,c.item.kind,c.item.displayName,c.item.targetQuantity];
   const goalId=await stableId(['ergon-goal-v1',...identity]),operationId=await stableId(['ergon-create-v1',...identity]);c.current();
   try{await api.createErgonGoal(c.owner,{revision:view.revision,operationId,goalId,sourcePlanId:c.item.id,parentGoalId:null,action:c.item.kind,displayName:c.item.displayName,targetQuantity:c.item.targetQuantity});}catch{/* Read native authority after lost ACK; never create a different ID. */}
   view=await read(c.owner,c.current);goal=selectErgonNativeGoal(view,c.owner,c.item);
   if(!goal||goal.goalId!==goalId)throw Error('목표 저장을 확인하지 못했어요. 같은 목표로 다시 확인해 주세요.');return {goal,view,executionAllowed:false as const};
  })();flights.set(flightKey,promise);void promise.finally(()=>flights.delete(flightKey)).catch(()=>{});return promise;
 };
 const bindOnce=async(scope:ProgressScope,plan:ErgonPlanItem,challenge:ErgonChallenge)=>{
  const c=capture(scope,plan),snapshot=JSON.stringify(challenge),guard=()=>{c.current();if(snapshot!==JSON.stringify(challenge))throw Error('준비 요청이 바뀌었어요.');};let view=await read(c.owner,guard);let goal=selectErgonNativeGoal(view,c.owner,c.item);
  if(!goal||goal.lifecycle!=='active'||goal.quantitySatisfied||!uuid(challenge.nonce)||challenge.accountId!==scope.accountId||challenge.characterId!==scope.characterId||challenge.action!==plan.kind||challenge.displayName!==plan.displayName)throw Error('준비 요청과 목표가 달라요.');
  const verify=()=>{const row=goal!.requests.find(r=>r.requestId===challenge.nonce);if(!row)return false;if(row.action!==challenge.action||row.displayName!==challenge.displayName||row.craftCount!==(challenge.crafting?.craftCount??null)||row.outputPerCraft!==(challenge.crafting?.outputPerCraft??null)||row.expectedOutput!==(challenge.crafting?.expectedOutput??null))throw Error('기존 요청의 제작 조건이 달라요.');return true;};
  if(!verify()){
   if(view.goals.some(g=>g.goalId!==goal!.goalId&&g.requests.some(r=>r.requestId===challenge.nonce)))throw Error('다른 목표에 연결된 요청이에요.');
   if(goal.quantityUnconfirmed||!api.bindErgonPrepared)throw Error('기존 결과 또는 요청 연결을 확인해 주세요.');
   const operationId=await stableId(['ergon-bind-v1',goal.goalId,challenge.nonce]);guard();
   try{await api.bindErgonPrepared(c.owner,{revision:view.revision,operationId,goalId:goal.goalId,nonce:challenge.nonce});}catch{/* A stored request is evidence of registration, never execution authority. */}
   view=await read(c.owner,guard);goal=selectErgonNativeGoal(view,c.owner,c.item);if(!goal||!verify())throw Error('요청 저장을 확인하지 못했어요.');
  }
  return {goal,view,executionAllowed:false as const};
 };
 const bindPrepared=(scope:ProgressScope,plan:ErgonPlanItem,challenge:ErgonChallenge)=>{const key=JSON.stringify(['bind',contextVersion(),scope,plan,challenge]),prior=flights.get(key);if(prior)return prior;const promise=bindOnce(scope,plan,challenge);flights.set(key,promise);void promise.finally(()=>flights.delete(key)).catch(()=>{});return promise;};
 return {ensure,bindPrepared};
}
