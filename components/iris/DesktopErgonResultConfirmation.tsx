'use client';
import {useEffect,useId,useRef,useState} from 'react';
import type {ErgonPlanItem} from '@/lib/irisErgonPlan';
import {useErgonProgress,type ErgonProgressApi} from './useErgonProgress';
import {parseErgonQuantityInput,type ProgressScope,type ProgressView,type GoalView,type ProgressRequestView,type ErgonQuantityWrite,type ErgonLifecycleWrite} from '@/lib/irisErgonProgress';
type Props={api?:ErgonProgressApi;scope:ProgressScope;active:boolean;locked:boolean;plans?:ErgonPlanItem[];canRemovePlan?:boolean;onRemovePlan?:(plan:ErgonPlanItem)=>boolean;onReplacePlan?:(plan:ErgonPlanItem,quantity:number)=>boolean;onDirtyChange?:(dirty:boolean)=>void;onViewChange?:(view:ProgressView|null)=>void};
export function DesktopErgonResultConfirmation(props:Props){return <ResultPanel key={JSON.stringify([props.scope.environment,props.scope.accountId,props.scope.characterId])} {...props}/>;}
function ResultPanel(props:Props){
 const progress=useErgonProgress(props),[drafts,setDrafts]=useState<Record<string,boolean>>({});
 const notifyView=props.onViewChange;useEffect(()=>{notifyView?.(progress.supported&&!progress.loading?progress.view:null);},[notifyView,progress.supported,progress.loading,progress.view]);
 const dirty=Object.values(drafts).some(Boolean),quantityDirty=Object.entries(drafts).some(([key,value])=>!key.startsWith('lifecycle:')&&value),lifecyclePending=Object.entries(drafts).some(([key,value])=>key.startsWith('lifecycle:')&&value),notify=useRef(props.onDirtyChange);
 useEffect(()=>{notify.current=props.onDirtyChange;notify.current?.(dirty||progress.busy);},[props.onDirtyChange,dirty,progress.busy]);
 useEffect(()=>()=>notify.current?.(false),[]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty||progress.busy){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,progress.busy]);
 const recordDirty=(id:string,value:boolean)=>setDrafts(previous=>previous[id]===value?previous:{...previous,[id]:value});
 const blocked=props.locked||!props.active||progress.busy||progress.loading||!progress.supported||progress.view?.health!=='ok';
 return <section className="iris-ergon-result" aria-label="ERGON · 제작 결과 확인"><h2>ERGON · 제작 결과 확인</h2>
  <p className="iris-caption">제작 명령 종료와 결과물 확보는 달라요. 이번 제작으로 추가 확보한 수량을 확인해 주세요. 가방 총재고가 아니에요.</p>
  {props.api&&progress.error&&<p role="alert">{progress.error}</p>}{!props.api&&<p>이 앱은 진행 기록 확인 기능을 지원하지 않아요.</p>}
  {!progress.supported&&progress.view&&<p className="iris-caption">아래는 마지막 확인 기록이에요. 현재 진척 계산과 새 저장은 보류했어요.</p>}
  <button type="button" className="iris-desktop-button" disabled={!props.active||progress.busy||progress.loading||quantityDirty} onClick={()=>void progress.reload()}>진행 기록 새로고침</button>
  {progress.loading?<p role="status">진행 기록 확인 중</p>:progress.view?.goals.length===0?<p>저장된 제작 목표가 없어요.</p>:null}
  {progress.view&&progress.view.health!=='ok'&&<p role="alert">기록과 원장 확인이 필요해요. 추가 저장과 실행을 막았어요.</p>}
  {progress.canConnect&&props.plans?.filter(p=>p.kind==='crafting'&&!progress.view?.goals.some(g=>g.sourcePlanId===p.id)).map(plan=><ConnectGoal key={plan.id} plan={plan} blocked={blocked||dirty&&!drafts['connect:'+plan.id]} connect={progress.connectGoal} onDirty={recordDirty}/>)}
  {props.onReplacePlan&&props.plans?.filter(p=>p.kind==='crafting').map(plan=>{const roots=progress.view?.goals.filter(g=>g.sourcePlanId===plan.id&&g.action===plan.kind&&g.displayName===plan.displayName&&g.lifecycle==='active'&&!g.detached&&g.parentGoalId===null)??[];if(roots.length!==1)return null;return <EmptyGoalReplacement key={plan.id} goal={roots[0]} plan={plan} blocked={blocked||props.canRemovePlan===false||Object.entries(drafts).some(([key,value])=>value&&key!=='lifecycle:replace:'+plan.id)} supported={progress.canReplace} replace={progress.replaceAndSave} save={props.onReplacePlan!} onDirty={recordDirty}/>;})}
  {progress.view?.goals.filter(g=>g.action==='crafting').map(goal=>{const matched=props.plans===undefined||props.plans.some(p=>p.id===goal.sourcePlanId&&p.kind===goal.action&&p.displayName===goal.displayName&&p.targetQuantity===goal.targetQuantity);return <article key={goal.goalId}>
   <h3>{goal.displayName}</h3><p>{goal.lifecycle==='paused'?'보류 중':goal.lifecycle==='cancelled'?'취소됨 · 이력 보존':goal.lifecycle==='archived'?'보관된 목표':'진행 중'}</p>
   <p>{goal.quantityUnconfirmed?`현재 확인 ${goal.confirmedQuantity}개 · 목표 ${goal.targetQuantity}개 · 남은 수량 확인 필요`:`목표 ${goal.targetQuantity}개 · 확인 ${goal.confirmedQuantity}개 · 남은 ${goal.remainingQuantity}개`}</p>
   {!matched&&<p role="status">현재 계획과 다른 보존 기록이에요. 원래 목표를 확인하기 전에는 수정하지 않아요.</p>}
   {goal.excessQuantity>0&&<p>목표보다 {goal.excessQuantity}개 더 확인했어요.</p>}
   {goal.requests.map(request=><RequestResult key={request.requestId} goal={goal} request={request} revision={progress.view!.revision} blocked={blocked||!matched||Object.entries(drafts).some(([id,value])=>id.startsWith('connect:')&&value)||lifecyclePending||goal.detached||goal.lifecycle==='cancelled'||goal.lifecycle==='archived'} write={progress.write} reload={progress.reload} onDirty={recordDirty}/>)}
   {props.onRemovePlan&&matched&&!goal.requests.length?<><EmptyGoalCancellation goal={goal} plan={props.plans?.find(p=>p.id===goal.sourcePlanId)} blocked={blocked||quantityDirty||props.canRemovePlan===false||Object.entries(drafts).some(([key,value])=>value&&key!=='lifecycle:'+goal.goalId)} cancel={progress.cancelAndRemove} remove={props.onRemovePlan} onDirty={recordDirty}/>{props.canRemovePlan===false&&<p role="status">미저장 계획을 먼저 저장한 뒤 목표를 그만둘 수 있어요.</p>}</>:<GoalLifecycle goal={goal} revision={progress.view!.revision} blocked={blocked||!matched||quantityDirty} cancelBlocked={!!props.onRemovePlan} write={progress.write} onDirty={recordDirty}/>}
  </article>;})}
  {dirty&&<p role="status">저장하지 않은 결과 입력이 있어요. 화면을 닫기 전에 저장하거나 초안만 버려 주세요.</p>}
 </section>;
}
type Write=ReturnType<typeof useErgonProgress>['write'];
function EmptyGoalReplacement({goal,plan,blocked,supported,replace,save,onDirty}:{goal:GoalView;plan:ErgonPlanItem;blocked:boolean;supported:boolean;replace:ReturnType<typeof useErgonProgress>['replaceAndSave'];save:(p:ErgonPlanItem,q:number)=>boolean;onDirty:(id:string,dirty:boolean)=>void}){
 const recovery=goal.targetQuantity!==plan.targetQuantity,[amount,setAmount]=useState(String(recovery?goal.targetQuantity:plan.targetQuantity)),[pending,setPending]=useState(recovery),id=useId(),notify=useRef(onDirty);useEffect(()=>{notify.current=onDirty;},[onDirty]);
 const dirty=pending||amount!==String(plan.targetQuantity);useEffect(()=>{const key='lifecycle:replace:'+plan.id;notify.current(key,dirty);return()=>notify.current(key,false);},[plan.id,dirty]);
 const quantity=/^[0-9]{1,7}$/.test(amount)?Number(amount):0,empty=goal.rootGoalId===goal.goalId&&!goal.requests.length&&!goal.confirmedQuantity&&!goal.quantityUnconfirmed&&!goal.registeredCount;
 const run=async()=>{if(blocked||!supported||!empty||quantity<1||quantity>1000000||quantity===plan.targetQuantity)return;if(!window.confirm(`${plan.displayName} 목표를 ${plan.targetQuantity}개에서 ${quantity}개로 변경할까요? 이전 기록은 보존하며 게임 작업을 실행하지 않아요.`))return;setPending(true);if(await replace(plan,quantity,save)){setPending(false);setAmount(String(quantity));}};
 return <div className="iris-ergon-controls"><label htmlFor={id}>새 목표 수량</label><input id={id} inputMode="numeric" value={amount} disabled={blocked||pending&&!recovery} onChange={e=>setAmount(e.target.value)}/><button type="button" className="iris-desktop-button" disabled={blocked||!supported||!empty||quantity<1||quantity>1000000||quantity===plan.targetQuantity} onClick={()=>void run()}>{pending||recovery?'수량 저장 상태 확인':'목표 수량 저장'}</button>{!pending&&!recovery&&<button type="button" className="iris-desktop-button" disabled={blocked} onClick={()=>setAmount(String(plan.targetQuantity))}>수량 초안 버리기</button>}{recovery&&<p role="status">native 목표 {goal.targetQuantity}개 · 계획 {plan.targetQuantity}개. 저장 상태 확인이 필요해요.</p>}{!supported&&<p>이 앱은 목표 수량 변경을 지원하지 않아요.</p>}{!empty&&<p>실행·확인 이력이 있는 목표는 수량을 변경하지 않아요.</p>}</div>;
}
function EmptyGoalCancellation({goal,plan,blocked,cancel,remove,onDirty}:{goal:GoalView;plan?:ErgonPlanItem;blocked:boolean;cancel:ReturnType<typeof useErgonProgress>['cancelAndRemove'];remove:(p:ErgonPlanItem)=>boolean;onDirty:(id:string,dirty:boolean)=>void}){
 const [pending,setPending]=useState(false),notice=useRef(onDirty);useEffect(()=>{notice.current=onDirty;},[onDirty]);useEffect(()=>{const key='lifecycle:'+goal.goalId;notice.current(key,pending);return()=>notice.current(key,false);},[goal.goalId,pending]);
 const empty=goal.parentGoalId===null&&!goal.detached&&!goal.requests.length&&!goal.quantityUnconfirmed&&!goal.confirmedQuantity&&!goal.registeredCount&&['active','cancelled'].includes(goal.lifecycle);
 const run=async()=>{if(blocked||!empty||!plan)return;if(!pending&&!window.confirm('목표를 그만두고 계획에서 제거할까요? 기존 기록은 보존하며, 이미 진행 중인 게임 작업을 취소하는 기능은 아니에요.'))return;setPending(true);if(await cancel(plan,remove))setPending(false);};
 return <><p className="iris-caption">실행·확인·보류 이력이 있는 목표는 변경하거나 제거하지 않아요.</p><button type="button" className="iris-desktop-button" disabled={blocked||!empty||!plan} onClick={()=>void run()}>{pending?'취소·계획 저장 상태 확인':'그만하기'}</button></>;
}
function ConnectGoal({plan,blocked,connect,onDirty}:{plan:ErgonPlanItem;blocked:boolean;connect:ReturnType<typeof useErgonProgress>['connectGoal'];onDirty:(id:string,dirty:boolean)=>void}){
 const [pending,setPending]=useState(false),notify=useRef(onDirty);useEffect(()=>{notify.current=onDirty;},[onDirty]);
 useEffect(()=>{notify.current('connect:'+plan.id,pending);return()=>notify.current('connect:'+plan.id,false);},[plan.id,pending]);
 return <div><p>{plan.displayName} · 목표 {plan.targetQuantity}개 · 진행 기록 연결 전</p><button type="button" className="iris-desktop-button" disabled={blocked} onClick={()=>void(async()=>{setPending(true);if(await connect(plan)==='saved')setPending(false);})()}>{pending?'목표 저장 상태 확인':'목표 기록 연결'}</button></div>;
}
function RequestResult({goal,request:r,revision,blocked,write,reload,onDirty}:{goal:GoalView;request:ProgressRequestView;revision:number;blocked:boolean;write:Write;reload:ReturnType<typeof useErgonProgress>['reload'];onDirty:(id:string,dirty:boolean)=>void}){
 const id=useId(),[amount,setAmount]=useState(''),[reason,setReason]=useState(''),[correct,setCorrect]=useState(false),[attempt,setAttempt]=useState<ErgonQuantityWrite|null>(null);
 const notify=useRef(onDirty);useEffect(()=>{notify.current=onDirty;},[onDirty]);
 const dirty=!!amount||!!reason||correct||!!attempt;
 useEffect(()=>{notify.current(r.requestId,dirty);return()=>notify.current(r.requestId,false);},[r.requestId,dirty]);
 const parsed=parseErgonQuantityInput(amount),latest=r.confirmations.at(-1),canWrite=r.terminalOutcome==='completed'&&(r.quantity===null||correct);
 const save=async()=>{
  if(blocked||!canWrite||parsed.kind!=='valid'||correct&&!reason.trim())return;
  const value=attempt??{revision,operationId:crypto.randomUUID(),goalId:goal.goalId,requestId:r.requestId,quantity:parsed.quantity,...(correct?{supersedesEventId:latest!.eventId,reason:reason.trim()}:{})};
  setAttempt(value);const result=await write('quantity',value);
  if(result==='saved'){setAttempt(null);setAmount('');setReason('');setCorrect(false);}else if(result==='rejected')setAttempt(null);
 };
 return <div className="iris-ergon-result-request"><p>이번 제작 {r.craftCount??'?'}회 · 기본 예상 산출 {r.expectedOutput??'?'}개</p>
  <p>{r.quantity===null?'실제 확보 수량 미확인':`사용자 확인 ${r.quantity}개`}</p>
  {r.terminalOutcome!=='completed'&&<p>제작 종료 근거를 확인하기 전에는 수량을 저장할 수 없어요.</p>}
  {r.quantity!==null&&!correct&&<button type="button" className="iris-desktop-button" disabled={blocked||!!attempt} onClick={()=>setCorrect(true)}>확인량 정정</button>}
  {canWrite&&<><label htmlFor={id}>실제로 확인한 추가 확보 수량</label><input id={id} inputMode="numeric" value={amount} disabled={blocked||!!attempt} onChange={e=>setAmount(e.target.value)}/>
   {correct&&<><label htmlFor={id+'-reason'}>정정 사유</label><input id={id+'-reason'} maxLength={400} value={reason} disabled={blocked||!!attempt} onChange={e=>setReason(e.target.value)}/></>}
   <p className="iris-caption">0개·예상 초과·정정은 Windows 확인창에서 다시 확인해요. 사용자 확인 기록이며 공식 보상 검증은 아니에요.</p>
   <div className="iris-ergon-controls"><button type="button" className="iris-desktop-button" disabled={blocked||parsed.kind!=='valid'||correct&&!reason.trim()} onClick={()=>void save()}>확인 수량 저장</button>
   <button type="button" className="iris-desktop-button" disabled={blocked||!!attempt} onClick={()=>{setAmount('');setReason('');setCorrect(false);}}>초안만 버리기</button>
   </div></>}
  {attempt&&<button type="button" className="iris-desktop-button" disabled={blocked} onClick={()=>void (async()=>{const loaded=await reload();if(!loaded||loaded.health!=='ok')return;const found=loaded.goals.find(g=>g.goalId===goal.goalId)?.requests.find(q=>q.requestId===r.requestId);if(!found)return;if(found.confirmations.some(c=>c.eventId===attempt.operationId)){setAmount('');setReason('');setCorrect(false);}setAttempt(null);})()}>저장 상태 확인</button>}
  {r.confirmations.length>0&&<details><summary>확인·정정 이력 ({r.confirmations.length})</summary><ul>{r.confirmations.map(c=><li key={c.eventId}>사용자 확인 {c.quantity}개{c.reason?` · ${c.reason}`:''}</li>)}</ul></details>}
 </div>;
}
function GoalLifecycle({goal,revision,blocked,cancelBlocked=false,write,onDirty}:{goal:GoalView;revision:number;blocked:boolean;cancelBlocked?:boolean;write:Write;onDirty:(id:string,dirty:boolean)=>void}){
 const [pending,setPending]=useState<ErgonLifecycleWrite|null>(null);
 const notify=useRef(onDirty);useEffect(()=>{notify.current=onDirty;},[onDirty]);
 useEffect(()=>{const key='lifecycle:'+goal.goalId;notify.current(key,!!pending);return()=>notify.current(key,false);},[goal.goalId,pending]);
 const change=async(lifecycle:'paused'|'cancelled')=>{if(blocked)return;const value=pending??{revision,operationId:crypto.randomUUID(),goalId:goal.goalId,lifecycle};setPending(value);const status=await write('lifecycle',value);if(status==='saved')setPending(null);};
 const inactive=goal.lifecycle==='cancelled'||goal.lifecycle==='archived'||goal.detached;
 return <div className="iris-ergon-controls"><button type="button" className="iris-desktop-button" disabled={blocked||inactive||goal.lifecycle==='paused'||!!pending} onClick={()=>void change('paused')}>{goal.quantityUnconfirmed?'나중에 확인 · 보류하기':'보류하기'}</button><button type="button" className="iris-desktop-button" disabled={blocked||inactive||!!pending||cancelBlocked} onClick={()=>{if(!cancelBlocked&&window.confirm('목표만 취소하고 기존 확인 이력과 원장은 보존할까요?'))void change('cancelled');}}>그만하기</button>{pending&&<button type="button" className="iris-desktop-button" disabled={blocked} onClick={()=>void change(pending.lifecycle)}>보류·취소 저장 상태 확인</button>}{cancelBlocked&&<p className="iris-caption">실행 이력이 있는 목표의 취소·계획 제거는 아직 지원하지 않아요. 기존 기록과 결과 관측을 유지해요.</p>}</div>;
}
