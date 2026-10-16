'use client';
import {useEffect,useRef,useState} from 'react';
import {buildErgonSupplyPreview} from '@/lib/irisErgonSupply';
import type {ErgonRecipeReference} from '@/lib/irisErgonReference';
import type {ErgonPlanItem} from '@/lib/irisErgonPlan';
import type {ErgonSnapshots} from '@/lib/irisErgonSession';
import {selectErgonNextStep,type ErgonNextStep} from '@/lib/irisErgonNextStep';

type Kind='altering'|'crafting';
const key=(kind:Kind,name:string)=>kind+'\u001f'+name;
export function DesktopErgonSupplyPanel({plan,snapshots,now,active,rootReference,rootReady,readReference,onAddPlan,onNextStep,onCollection}:{plan:ErgonPlanItem; snapshots:ErgonSnapshots;now:number;active:boolean;rootReference:ErgonRecipeReference|null;rootReady:boolean;readReference?:(kind:Kind,name:string)=>Promise<ErgonRecipeReference|null>;onAddPlan:(kind:ErgonPlanItem['kind'],name:string,quantity:number)=>void;onNextStep?:(step:Extract<ErgonNextStep,{kind:'action'}>)=>void;onCollection?:(facility:string)=>void}){
 const scope=key(plan.kind==='gathering'?'crafting':plan.kind,plan.displayName)+'\u001f'+(rootReference?.modifiedAt??'none');
 const [cache,setCache]=useState<{scope:string;entries:Record<string,ErgonRecipeReference|null>}>({scope:'',entries:{}});
 const entries=cache.scope===scope?cache.entries:{};
 const refs=Object.values(entries).filter((row):row is ErgonRecipeReference=>row!==null);
 if(rootReference)refs.push(rootReference);
 const preview=plan.kind==='gathering'?null:buildErgonSupplyPreview({kind:plan.kind,displayName:plan.displayName,additionalQuantity:plan.targetQuantity,now,materials:snapshots.materials,crafting:snapshots.crafting,altering:snapshots.altering,gathering:snapshots.gathering,references:refs});
 const rootKey=plan.kind==='gathering'?'':key(plan.kind,plan.displayName);
 const requested=preview?.referencesNeeded.filter(row=>key(row.kind,row.displayName)!==rootKey&&!Object.hasOwn(entries,key(row.kind,row.displayName)))??[];
 const signature=JSON.stringify(requested),cachedCount=Object.keys(entries).length,queue=useRef<Promise<void>>(Promise.resolve());
 useEffect(()=>{
  let current=true;
  if(active&&rootReady&&readReference){
   const wanted=JSON.parse(signature) as {kind:Kind;displayName:string}[];
   const operation=queue.current.catch(()=>{}).then(async()=>{
    // Commit one reference per effect. Sibling cache writes must not cancel an in-flight read and fetch it twice.
    for(const item of wanted.slice(0,cachedCount<31?1:0)){
     if(!current)return;let value:ErgonRecipeReference|null=null;
     try{value=await readReference(item.kind,item.displayName);}catch{/* Failed references stay visibly incomplete; never execute or retry actions. */}
     if(!current)return;
     setCache(previous=>({scope,entries:{...(previous.scope===scope?previous.entries:{}),[key(item.kind,item.displayName)]:value}}));
    }
   });queue.current=operation;
  }
  return()=>{current=false;};
 },[active,rootReady,readReference,scope,signature,cachedCount]);
 if(!preview)return null;
 const labels={gathering:'채집',altering:'가공 등록',collect:'완료품 수령',crafting:'제작',manual:'직접 확인'};
 const next=selectErgonNextStep(preview,snapshots,now);
 const handleNextStep=(clickedAt:number)=>{if(!active)return;const fresh=selectErgonNextStep(preview,snapshots,clickedAt);if(fresh.kind==='action')onNextStep?.(fresh);else if(fresh.kind==='collect')onCollection?.(fresh.facility);};
 const steps=<>
  <ol>{preview.steps.map((step,index)=><li key={index}><div><strong>{labels[step.kind]} · {step.displayName}</strong><span>{step.runs===null?'수량·경로 확인 필요':`${step.runs}회 · 예상 ${step.expectedOutput}개`}</span></div><p className="iris-caption">{step.note}</p>{step.state==='preview'&&step.kind!=='collect'&&step.kind!=='manual'&&<button type="button" className="iris-desktop-button" disabled={!active||step.kind==='gathering'&&step.displayName!=='통나무'||step.additionalQuantity>1000000} onClick={()=>onAddPlan(step.kind as ErgonPlanItem['kind'],step.displayName,step.additionalQuantity)}>이 단계 계획 추가</button>}</li>)}</ol>
  <p>날개 최소 {preview.wingMinimum}개{preview.wingMaximum===null?' · 수령·초과량 등 총 상한 미확인':`~${preview.wingMaximum}개`}</p>
  {preview.issues.map(issue=><p className="iris-caption" key={issue}>{issue}</p>)}
  {requested.length>0&&Object.keys(entries).length>=31&&<p role="status">참고 조회 한도에 닿았어요. 계획을 나눠 주세요.</p>}
 </>;
 return <section aria-label="부족분 수급 순서" className="iris-ergon-supply">{onNextStep&&<section aria-label="다음 작업 안내" className="iris-ergon-next-step"><h4>다음 작업</h4>{next.kind==='action'?<><strong>{next.displayName} · {labels[next.action]} {next.quantity.toLocaleString('ko-KR')}개</strong><button type="button" className="iris-desktop-button" data-ergon-role="primary" disabled={!active} onClick={()=>handleNextStep(Date.now())}>이 단계 선택</button></>:next.kind==='collect'?<><strong>{next.facility} · 수령 가능</strong><button type="button" className="iris-desktop-button" data-ergon-role="add" disabled={!active||!onCollection} onClick={()=>handleNextStep(Date.now())}>완료품 수령</button></>:next.kind==='wait'?<strong>{next.displayName} · 가공 {next.pending}건 대기{next.remainingSeconds===null?'':` · 약 ${Math.ceil(next.remainingSeconds/60)}분`}</strong>:null}<p className="iris-caption">{next.note}</p><p className="iris-caption">참고 재료표 기반 · 선택 후 게임에서 조건을 다시 확인해요.</p></section>}{onNextStep?<details><summary>부족분 수급 순서 보기</summary>{steps}</details>:<><p className="iris-caption">읽기 전용 미리보기 · 자동으로 시작하지 않아요.</p>{steps}</>}</section>;
}
