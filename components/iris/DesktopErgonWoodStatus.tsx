'use client';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {projectErgonWoodStatus,type WoodStatusIdentity} from '@/lib/irisErgonWoodStatus';
import type {ErgonPlanItem} from '@/lib/irisErgonPlan';
import type {ProgressScope,GoalView} from '@/lib/irisErgonProgress';
import {DesktopErgonManualWood,type ManualWoodApi} from './DesktopErgonManualWood';

type Status=ReturnType<typeof projectErgonWoodStatus>;
type Props={scope:ProgressScope;plan:ErgonPlanItem;goal:GoalView|null;active:boolean;locked:boolean;getContextVersion:()=>number;load?: (scope:ProgressScope,goalId:string)=>Promise<unknown>;manualApi?:ManualWoodApi;accountLabel?:string;characterLabel?:string;onDirtyChange?:(value:boolean)=>void};
const time=(at:number|null)=>at===null?'확인 필요':new Date(at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})+' KST';
export function DesktopErgonWoodStatus({scope,plan,goal,active,locked,getContextVersion,load,manualApi,accountLabel='',characterLabel='',onDirtyChange}:Props){
 const {environment,accountId,characterId}=scope,{id,kind,displayName,targetQuantity}=plan;
 const goalId=goal?.goalId,lifecycle=goal?.lifecycle,quantityUnconfirmed=goal?.quantityUnconfirmed;
 const identity=useMemo<WoodStatusIdentity|null>(()=>goalId&&kind==='altering'&&displayName==='목재'&&targetQuantity===100?{scope:{environment,accountId,characterId},goalId,plan:{id,kind,displayName,targetQuantity},lifecycle,quantityUnconfirmed}:null,[environment,accountId,characterId,goalId,id,kind,displayName,targetQuantity,lifecycle,quantityUnconfirmed]);
 const key=JSON.stringify(identity??[scope,plan]);
 const generation=useRef(0),version=useRef(getContextVersion);
 const [state,setState]=useState<{key:string;loading:boolean;value:Status|null;error:boolean}|null>(null);
 const [manualDirty,setManualDirty]=useState(false);
 const manualIdentity=useMemo(()=>goalId?{scope:{environment,accountId,characterId},goalId,sourcePlanId:id}:null,[environment,accountId,characterId,goalId,id]);
 const manualChanged=useCallback((value:boolean)=>{setManualDirty(value);onDirtyChange?.(value);},[onDirtyChange]);
 useLayoutEffect(()=>{version.current=getContextVersion;});
 useLayoutEffect(()=>{const token=generation;return()=>{token.current++;};},[key,active,locked]);
 const refresh=useCallback(async()=>{
  if(!identity||identity.lifecycle!=='active'||!load||!active||locked||manualDirty)return;
  const started=++generation.current,epoch=version.current();
  setState({key,loading:true,value:null,error:false});
  try{const raw=await load(identity.scope,identity.goalId);if(started!==generation.current)return;if(epoch!==version.current())throw Error('context changed');const value=projectErgonWoodStatus(raw,identity,Date.now());setState({key,loading:false,value,error:false});}
  catch{if(started===generation.current)setState({key,loading:false,value:null,error:true});}
 },[identity,load,active,locked,key,manualDirty]);
 useEffect(()=>{let current=true;queueMicrotask(()=>{if(current)void refresh();});return()=>{current=false;};},[refresh]);
 const current=state?.key===key?state:null,value=current?.value;
 return <section className="iris-ergon-wood-status" aria-label="선택 목표 가공 현황">
  <div className="iris-ergon-title"><h3>{displayName} 추가 {targetQuantity}개 · 가공 현황</h3><button className="iris-desktop-button" type="button" disabled={!identity||identity.lifecycle!=='active'||!load||!active||locked||manualDirty||current?.loading} onClick={()=>void refresh()}>가공 기록 새로고침</button></div>
  {!identity?<p className="iris-caption">{displayName==='목재'&&targetQuantity===100?'현재 계획과 일치하는 가공 목표 기록을 확인해야 해요.':'현재 가공 진행 기록은 목재 추가100 목표만 연결돼요.'}</p>:identity.lifecycle==='paused'?<><p role="status">{identity.quantityUnconfirmed?'보류 · 결과 확인 필요':'보류'}</p><p className="iris-caption">목표를 보류했어요. 보류된 목표의 가공 진척은 아직 조회하지 않아요.</p></>:!load?<p className="iris-caption">가공 기록 연결 준비 중이에요.</p>:current?.error?<p role="status">가공 기록을 읽지 못했어요. 원본 기록은 그대로예요.</p>:!value?<p role="status">{current?.loading?'가공 기록 읽는 중':'가공 기록 확인 대기'}</p>:<>
   <p role="status"><strong>{value.status}</strong></p>
   {manualApi?<p className="iris-caption">가공 관측 기록 · 수령 수량은 아래 사용자 확인과 별도로 관리해요.</p>:<p>{value.recorded===null?'확정 기록 확인 필요':`확정 기록 ${value.recorded}개 · 남은 목표 ${value.remaining}개`}</p>}
   <p className="iris-caption">실제 추가 확보량 확인 필요</p>
   <p className="iris-caption">기록 갱신 시각 확인 필요</p>
   {value.observedAt!==null&&<p className="iris-caption">관측 시각 <time dateTime={new Date(value.observedAt).toISOString()}>{time(value.observedAt)}</time> · 저장된 조회 당시 정보예요.</p>}
   {value.lastRestoredAt!==null&&<p className="iris-caption">복원 확인 시각 {time(value.lastRestoredAt)}</p>}
   {value.rows.length>0?<ul>{value.rows.map((row,index)=><li key={index}><strong>{row.facility} · {row.name}</strong><p>{row.status}</p><p className="iris-caption">{row.remainingSeconds===null?'조회 당시 남은 시간 확인 필요':`조회 당시 남은 시간 ${row.remainingSeconds}초`}</p></li>)}</ul>:<p className="iris-caption">확인된 가공 작업 관측이 없어요.</p>}
   <details><summary>진행을 막는 이유</summary>{value.blockers.map(text=><p className="iris-caption" key={text}>{text}</p>)}</details>
   <details><summary>직접 진행 전 확인</summary>
    <p className="iris-caption">{value.manualGuide.message}</p>
    {value.manualGuide.checks.length>0&&<ul aria-label="직접 확인할 항목">{value.manualGuide.checks.map(text=><li key={text}><p className="iris-caption">{text}</p></li>)}</ul>}
    <p className="iris-caption">{manualApi?'수령 후 아래 사용자 확인에 실제 추가 확보량을 기록할 수 있어요.':value.manualGuide.recordingNotice}</p>
   </details>
  </>}
  {identity&&manualIdentity&&manualApi&&<DesktopErgonManualWood identity={manualIdentity} api={manualApi} accountLabel={accountLabel} characterLabel={characterLabel} active={active} locked={locked||identity.lifecycle!=='active'||!!quantityUnconfirmed||!value||value.manualGuide.mode==='review-required'} getContextVersion={getContextVersion} onDirtyChange={manualChanged}/>}
 </section>;
}
