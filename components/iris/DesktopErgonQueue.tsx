'use client';
import {useEffect,useRef,useState} from 'react';
import {buildErgonSupplyBatchPreview} from '@/lib/irisErgonSupply';
import {parseErgonReference,type ErgonRecipeReference} from '@/lib/irisErgonReference';
import {calculateErgonPlan,type ErgonPlanItem} from '@/lib/irisErgonPlan';
import type {ErgonSnapshots} from '@/lib/irisErgonSession';
import {confirmedErgonCraftOutput,needsErgonCraftQuantityConfirmation,type ErgonCraftGoal} from '@/lib/irisErgonCraftGoal';
import {editErgonPlans} from '@/lib/irisErgonPlanEdit';
import {DesktopErgonPlanRow} from './DesktopErgonPlanRow';
import {DesktopContextHelp} from './DesktopContextHelp';
import {selectErgonNativeGoal} from '@/lib/irisErgonGoalBinding';
import type {ProgressView,ProgressScope} from '@/lib/irisErgonProgress';

type Props={nativeProgress?:ProgressView|null;nativeScope?:ProgressScope;plans:ErgonPlanItem[];goals:Record<string,ErgonCraftGoal>;snapshots:ErgonSnapshots;now:number;scope:string;identity:{accountId:string;characterId:string|null};active:boolean;readReference?:(kind:'altering'|'crafting',name:string)=>Promise<ErgonRecipeReference|null>;onChangePlans:(plans:ErgonPlanItem[])=>void;onSelect:(id:string)=>void;onOpenChange:(open:boolean)=>void;presentation?:'disclosure'|'workbench';selectedId?:string;onReplace?:(id:string)=>void};
const referenceKey=(kind:string,name:string)=>JSON.stringify([kind,name]);
const labels={gathering:'채집',altering:'가공 등록',collect:'완료품 수령',crafting:'제작',manual:'직접 확인'};

/** Planning only. This component has no consuming/native approval API. */
export function DesktopErgonQueue({plans,goals,nativeProgress,nativeScope,snapshots,now,scope,identity,active,readReference,onChangePlans,onSelect,onOpenChange,presentation='disclosure',selectedId,onReplace}:Props){
 const [open,setOpen]=useState(false),[cache,setCache]=useState<{scope:string;entries:Record<string,ErgonRecipeReference|null>}>({scope:'',entries:{}});
 const entries=cache.scope===scope?cache.entries:{},references=Object.values(entries).filter((row):row is ErgonRecipeReference=>row!==null);
const confirmed=(item:ErgonPlanItem)=>{if(nativeProgress!==undefined)return nativeScope?selectErgonNativeGoal(nativeProgress,nativeScope,item)?.confirmedQuantity??0:0;const goal=goals[item.id],output=snapshots.crafting?.data.items.find(row=>row.name===item.displayName)?.producedPerUnit;return goal&&item.kind==='crafting'&&goal.identity.accountId===identity.accountId&&goal.identity.characterId===identity.characterId&&goal.identity.planId===item.id&&goal.identity.displayName===item.displayName&&goal.identity.targetQuantity===item.targetQuantity&&goal.identity.outputPerCraft===output?confirmedErgonCraftOutput(goal):0;};
const requiresQuantity=(item:ErgonPlanItem)=>{if(nativeProgress!==undefined){const native=nativeScope?selectErgonNativeGoal(nativeProgress,nativeScope,item):null;return !native||native.quantityUnconfirmed;}const goal=goals[item.id];return !!goal&&item.kind==='crafting'&&goal.identity.accountId===identity.accountId&&goal.identity.characterId===identity.characterId&&goal.identity.planId===item.id&&goal.identity.displayName===item.displayName&&(goal.blocked||needsErgonCraftQuantityConfirmation(goal));};
 const nativeCurrent=!!nativeProgress&&!!nativeScope&&nativeProgress.health==='ok'&&nativeProgress.scope.environment===nativeScope.environment&&nativeProgress.scope.accountId===nativeScope.accountId&&nativeProgress.scope.characterId===nativeScope.characterId;
 const managementLocked=(item:ErgonPlanItem)=>nativeProgress!==undefined&&(!nativeCurrent||nativeProgress!.goals.some(g=>g.sourcePlanId===item.id));
 const inactive=(item:ErgonPlanItem)=>nativeCurrent&&nativeProgress!.goals.some(g=>g.sourcePlanId===item.id)&&nativeProgress!.goals.filter(g=>g.sourcePlanId===item.id).every(g=>g.detached||g.lifecycle==='cancelled'||g.lifecycle==='archived');
 const outOfSync=(item:ErgonPlanItem)=>nativeCurrent&&nativeProgress!.goals.some(g=>g.sourcePlanId===item.id)&&!selectErgonNativeGoal(nativeProgress!,nativeScope!,item);
 const remainingPlans=plans.flatMap(item=>{const remaining=inactive(item)||outOfSync(item)?0:Math.max(0,item.targetQuantity-confirmed(item));return remaining?[{...item,targetQuantity:remaining}]:[];});
 const reservedOutputs=plans.flatMap(item=>{const quantity=inactive(item)||outOfSync(item)?0:Math.min(item.targetQuantity,confirmed(item));return quantity?[{name:item.displayName,quantity}]:[];});
 const preview=buildErgonSupplyBatchPreview({plans:remainingPlans,reservedOutputs,now,materials:snapshots.materials,crafting:snapshots.crafting,altering:snapshots.altering,gathering:snapshots.gathering,references});
 const requested=preview.referencesNeeded.filter(row=>!Object.hasOwn(entries,referenceKey(row.kind,row.displayName))),signature=JSON.stringify(requested),count=Object.keys(entries).length,queue=useRef<Promise<void>>(Promise.resolve());
 useEffect(()=>{
  let current=true;
  if(open&&active&&readReference&&count<32){
   const wanted=JSON.parse(signature) as {kind:'altering'|'crafting';displayName:string}[];
   queue.current=queue.current.catch(()=>{}).then(async()=>{
    const item=wanted[0];if(!current||!item)return;
    let value:ErgonRecipeReference|null=null;
    try{value=parseErgonReference(item.kind,item.displayName,await readReference(item.kind,item.displayName));}catch{/* Failed facts stay unverified; never retry consuming commands. */}
    if(current)setCache(previous=>({scope,entries:{...(previous.scope===scope?previous.entries:{}),[referenceKey(item.kind,item.displayName)]:value}}));
   });
  }
  return()=>{current=false;};
 },[open,active,readReference,scope,signature,count]);
 useEffect(()=>()=>onOpenChange(false),[onOpenChange]);
 const rowSummary=(item:ErgonPlanItem)=>{const cost=calculateErgonPlan(item,snapshots[item.kind],now);if(cost.requiredRuns===null)return undefined;const produced=item.kind==='altering'&&cost.outputPerRun!==null?cost.requiredRuns*cost.outputPerRun:null;return `${item.kind==='gathering'?'최소 예상':'예상'} ${cost.requiredRuns}회 · 날개 ${cost.wingMinimum}${cost.wingMaximum===null?'개 이상 (상한 미확인)':cost.wingMinimum!==cost.wingMaximum?`~${cost.wingMaximum}개`:'개'}${produced!==null&&produced>item.targetQuantity?` · 산출 ${produced}개 (+${produced-item.targetQuantity}개)`:''}`;};
const rows=<div className="iris-ergon-queue-goals">{!plans.length&&<p className="iris-caption">품목을 선택하고 수량을 정해 주세요.</p>}{plans.map(item=><DesktopErgonPlanRow key={item.id} item={item} selected={selectedId===item.id} disabled={!active} managementLocked={managementLocked(item)} confirmed={confirmed(item)} quantityUnavailable={nativeProgress!==undefined&&(!nativeScope||!selectErgonNativeGoal(nativeProgress,nativeScope,item))} quantityUnconfirmed={requiresQuantity(item)} summary={rowSummary(item)} onSelect={()=>{if(active)onSelect(item.id);}} onQuantity={quantity=>{if(active&&!managementLocked(item))onChangePlans(editErgonPlans(plans,{type:'quantity',id:item.id,quantity}).items);}} onReplace={onReplace?()=>{if(active&&!managementLocked(item))onReplace(item.id);}:undefined} onRemove={()=>{if(!active||managementLocked(item))return;const result=editErgonPlans(plans,{type:'remove',id:item.id});onChangePlans(result.items);if(item.id===selectedId&&result.selectedId)onSelect(result.selectedId);}}/>)}</div>;
 const previewContent=<>
  <p className="iris-caption">가방 기준 · 예상 산출은 확보량·완료품 예약에 쓰지 않아요. 수량 미확인 목표의 부족분은 잠정 계산이에요.</p>
  {plans.some(outOfSync)&&<p role="status">목표와 계획의 저장 상태 확인이 필요해요. 해당 품목의 부족분 계산·예약은 보류했어요.</p>}
  <ol>{preview.steps.map((step,index)=><li key={index} data-state={step.state}><strong>{labels[step.kind]} · {step.displayName} · 추가 {step.additionalQuantity.toLocaleString('ko-KR')}개</strong>{step.runs!==null&&<span>{step.runs.toLocaleString('ko-KR')}회 · 예상 {step.expectedOutput?.toLocaleString('ko-KR')}개</span>}<p className="iris-caption">{step.note}</p></li>)}</ol>
  {!!plans.length&&<p>확인된 날개 최소 {preview.wingMinimum.toLocaleString('ko-KR')}개 · 총 상한 미확인</p>}
  {preview.issues.map(issue=><p className="iris-caption" key={issue}>{issue}</p>)}
  {requested.length>0&&count>=32&&<p role="status">참고 조회 한도에 닿았어요. 계획을 나눠 확인해 주세요.</p>}
 </>;
 if(presentation==='workbench')return <section className="iris-ergon-task-list" aria-label="전체 작업 대기열"><div className="iris-ergon-section-heading"><h3>내 작업 목록 <span className="iris-caption">{plans.length}/50</span></h3><DesktopContextHelp label="작업 목록">품목을 누르면 해당 작업의 재료와 실행 준비를 보여줘요. 수량은 바로 수정하고, 다른 품목으로 교체하거나 제거할 수 있어요. 목록 편집만으로 재료를 쓰지 않아요. 완료 확인은 실제 결과가 검증된 경우에만 반영해요.</DesktopContextHelp></div>{rows}<details className="iris-ergon-queue" onToggle={event=>{setOpen(event.currentTarget.open);onOpenChange(event.currentTarget.open);}}><summary>전체 부족분 · 수급 순서</summary>{open&&previewContent}</details></section>;
 return <details className="iris-ergon-queue" onToggle={event=>{setOpen(event.currentTarget.open);onOpenChange(event.currentTarget.open);}}><summary>전체 대기열 ({plans.length}개)</summary>{open&&<section aria-label="전체 작업 대기열">{rows}<h3>전체 부족분 · 수급 순서</h3>{previewContent}</section>}</details>;
}
