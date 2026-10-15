'use client';
import {useEffect,useRef,useState} from 'react';
import {buildErgonSupplyBatchPreview} from '@/lib/irisErgonSupply';
import {parseErgonReference,type ErgonRecipeReference} from '@/lib/irisErgonReference';
import type {ErgonPlanItem} from '@/lib/irisErgonPlan';
import type {ErgonSnapshots} from '@/lib/irisErgonSession';
import type {ErgonCraftGoal} from '@/lib/irisErgonCraftGoal';

type Props={plans:ErgonPlanItem[];goals:Record<string,ErgonCraftGoal>;snapshots:ErgonSnapshots;now:number;scope:string;active:boolean;readReference?:(kind:'altering'|'crafting',name:string)=>Promise<ErgonRecipeReference|null>;onChangePlans:(plans:ErgonPlanItem[])=>void;onSelect:(id:string)=>void;onOpenChange:(open:boolean)=>void};
const referenceKey=(kind:string,name:string)=>JSON.stringify([kind,name]);
const labels={gathering:'채집',altering:'가공 등록',collect:'완료품 수령',crafting:'제작',manual:'직접 확인'};
function Quantity({item,disabled,onChange}:{item:ErgonPlanItem;disabled:boolean;onChange:(quantity:number)=>void}){
 const [draft,setDraft]=useState<{base:number;value:string}|null>(null);
 const value=draft?.base===item.targetQuantity?draft.value:String(item.targetQuantity),number=Number(value),valid=value.trim()!==''&&Number.isSafeInteger(number)&&number>=1&&number<=1000000;
 return <label>{item.displayName} 추가 수량<input type="number" min="1" max="1000000" step="1" disabled={disabled} value={value} aria-invalid={!valid} onBlur={()=>{if(!valid)setDraft(null);}} onChange={event=>{const value=event.target.value,next=Number(value),ok=value.trim()!==''&&Number.isSafeInteger(next)&&next>=1&&next<=1000000;setDraft({base:ok?next:item.targetQuantity,value});if(ok)onChange(next);}}/></label>;
}

/** Planning only. This component has no consuming/native approval API. */
export function DesktopErgonQueue({plans,goals,snapshots,now,scope,active,readReference,onChangePlans,onSelect,onOpenChange}:Props){
 const [open,setOpen]=useState(false),[cache,setCache]=useState<{scope:string;entries:Record<string,ErgonRecipeReference|null>}>({scope:'',entries:{}});
 const entries=cache.scope===scope?cache.entries:{},references=Object.values(entries).filter((row):row is ErgonRecipeReference=>row!==null);
 const confirmed=(item:ErgonPlanItem)=>{const goal=goals[item.id];return goal&&item.kind==='crafting'&&goal.identity.planId===item.id&&goal.identity.displayName===item.displayName&&goal.identity.targetQuantity===item.targetQuantity?goal.completedOutput:0;};
 const remainingPlans=plans.flatMap(item=>{const remaining=Math.max(0,item.targetQuantity-confirmed(item));return remaining?[{...item,targetQuantity:remaining}]:[];});
 const preview=buildErgonSupplyBatchPreview({plans:remainingPlans,now,materials:snapshots.materials,crafting:snapshots.crafting,altering:snapshots.altering,gathering:snapshots.gathering,references});
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
 return <details className="iris-ergon-queue" onToggle={event=>{setOpen(event.currentTarget.open);onOpenChange(event.currentTarget.open);}}><summary>전체 대기열 ({plans.length}개)</summary>{open&&<section aria-label="전체 작업 대기열">
  <p className="iris-caption">계정에 보관한 계획 · 현재 캐릭터의 가방 기준이에요. 추가할 결과물은 서로 빼앗지 않고, 재료 재고는 한 번만 사용해요.</p>
  {!plans.length&&<p className="iris-caption">품목을 담으면 여러 작업의 부족분을 함께 볼 수 있어요.</p>}
  <div className="iris-ergon-queue-goals">{plans.map(item=><article key={item.id}><strong>{item.displayName} · {labels[item.kind]}</strong><Quantity item={item} disabled={!active} onChange={quantity=>onChangePlans(plans.map(row=>row.id===item.id?{...row,targetQuantity:quantity}:row))}/>{confirmed(item)>0&&<p className="iris-caption">확인된 추가 생산 {confirmed(item)}개 · 남은 {Math.max(0,item.targetQuantity-confirmed(item))}개</p>}<div className="iris-ergon-controls"><button type="button" className="iris-desktop-button" disabled={!active} aria-label={item.displayName+' 선택'} onClick={()=>onSelect(item.id)}>선택</button><button type="button" className="iris-desktop-button" disabled={!active} aria-label={item.displayName+' 제거'} onClick={()=>onChangePlans(plans.filter(row=>row.id!==item.id))}>제거</button></div></article>)}</div>
  <h3>전체 부족분 · 수급 순서</h3><p className="iris-caption">예상 산출은 실제 보유량이 아니에요. 가공 완료품을 수령한 뒤 실제 가방으로 다시 확인해야 해요. 참고 재료표가 불완전해 자동으로 시작하지 않아요.</p>
  <ol>{preview.steps.map((step,index)=><li key={index} data-state={step.state}><strong>{labels[step.kind]} · {step.displayName} · 추가 {step.additionalQuantity.toLocaleString('ko-KR')}개</strong>{step.runs!==null&&<span>{step.runs.toLocaleString('ko-KR')}회 · 예상 {step.expectedOutput?.toLocaleString('ko-KR')}개</span>}<p className="iris-caption">{step.note}</p></li>)}</ol>
  {!!plans.length&&<p>확인된 날개 최소 {preview.wingMinimum.toLocaleString('ko-KR')}개 · 총 상한 미확인</p>}
  {preview.issues.map(issue=><p className="iris-caption" key={issue}>{issue}</p>)}
  {requested.length>0&&count>=32&&<p role="status">참고 조회 한도에 닿았어요. 계획을 나눠 확인해 주세요.</p>}
 </section>}</details>;
}
