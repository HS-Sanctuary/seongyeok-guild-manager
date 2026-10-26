'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {createDesktopStore} from '@/lib/irisDesktopStore';
import {createErgonGoalBinding} from '@/lib/irisErgonGoalBinding';
import {createErgonGoalCancellation,createErgonGoalReplacement} from '@/lib/irisErgonGoalManagement';
import type {ErgonPlanItem} from '@/lib/irisErgonPlan';
import {parseErgonProgressView,parseErgonProgressAck,type ProgressScope,type ProgressView,type ErgonQuantityWrite,type ErgonLifecycleWrite} from '@/lib/irisErgonProgress';

export type ErgonProgressApi=Pick<ReturnType<typeof createDesktopStore>,'ergonProgressCapabilities'|'loadErgonProgress'|'saveErgonQuantity'|'setErgonGoalLifecycle'>&Partial<Pick<ReturnType<typeof createDesktopStore>,'createErgonGoal'|'replaceErgonGoal'>>;
export function useErgonProgress({api,scope,active,locked}:{api?:ErgonProgressApi;scope:ProgressScope;active:boolean;locked:boolean}){
 const key=JSON.stringify([scope.environment,scope.accountId,scope.characterId]);
 const [state,setState]=useState<{key:string;view:ProgressView|null;error:string;loading:boolean;supported:boolean}>({key,view:null,error:'',loading:!!api,supported:!!api});
 const [busy,setBusy]=useState(false),flight=useRef(false),generation=useRef(0);
 const live=useRef({key,active,locked});
 useLayoutEffect(()=>{const lifecycle=generation;live.current={key,active,locked};lifecycle.current++;return()=>{lifecycle.current++;};},[key,active,locked,api]);
 const {environment,accountId,characterId}=scope;
 const reload=useCallback(async()=>{
  if(flight.current||!live.current.active)return null;
  const ticket=++generation.current,current=()=>generation.current===ticket&&live.current.key===key&&live.current.active;
  if(!api){setState(previous=>({key,view:previous.key===key?previous.view:null,error:'이 앱은 진행 기록 확인 기능을 지원하지 않아요.',loading:false,supported:false}));return null;}
  setState(previous=>({key,view:previous.key===key?previous.view:null,error:'',loading:true,supported:true}));
  try{
   const owner={environment,accountId,characterId},cap=await api.ergonProgressCapabilities(owner);
   if(cap.schemaVersion!==1||cap.localOnly!==true||cap.executionConnected!==false)throw Error('진행 기록 연결을 확인해 주세요.');
   const view=parseErgonProgressView(await api.loadErgonProgress(owner),owner);
   if(current()){setState({key,view,error:'',loading:false,supported:true});return view;}
  }catch{if(current())setState(previous=>({key,view:previous.key===key?previous.view:null,error:'진행 기록을 불러오지 못했어요. 입력을 유지했어요. 앱 연결과 캐릭터를 확인해 주세요.',loading:false,supported:false}));}
  return null;
 },[api,key,environment,accountId,characterId]);
 useEffect(()=>{let current=true;queueMicrotask(()=>{if(current&&active)void reload();});return()=>{current=false;};},[active,reload]);
 const write=async(kind:'quantity'|'lifecycle',payload:ErgonQuantityWrite|ErgonLifecycleWrite):Promise<'saved'|'rejected'|'unknown'|'stale'>=>{
  if(!api||flight.current||!live.current.active||live.current.locked||state.key!==key||state.loading||!state.supported||state.view?.health!=='ok')return 'rejected';
  flight.current=true;setBusy(true);const ticket=generation.current,current=()=>generation.current===ticket&&live.current.key===key&&live.current.active;
  try{
   const owner={environment,accountId,characterId};
   const raw=kind==='quantity'?await api.saveErgonQuantity(owner,payload as ErgonQuantityWrite):await api.setErgonGoalLifecycle(owner,payload as ErgonLifecycleWrite);
   if(!current())return 'stale';
   const ack=parseErgonProgressAck(raw,owner,payload.operationId,payload);
   if(ack.status!=='committed'&&ack.status!=='already-applied'){setState(previous=>({...previous,error:'저장하지 못했어요. 입력은 남아 있어요. 최신 기록을 확인해 주세요.'}));return 'rejected';}
   setState({key,view:ack.view,error:'',loading:false,supported:true});return 'saved';
  }catch{if(current())setState(previous=>({...previous,error:'저장 응답을 확인하지 못했어요. 입력을 유지했어요. 같은 요청으로 다시 확인해 주세요.'}));return 'unknown';}
  finally{flight.current=false;setBusy(false);}
 };
 const connectGoal=async(plan:ErgonPlanItem)=>{
  if(!api?.createErgonGoal||flight.current||!live.current.active||live.current.locked||state.key!==key||state.loading||!state.supported||state.view?.health!=='ok')return 'unknown' as const;
  flight.current=true;setBusy(true);const ticket=generation.current;
  try{const driver=createErgonGoalBinding({loadErgonProgress:api.loadErgonProgress,createErgonGoal:api.createErgonGoal},()=>generation.current);const result=await driver.ensure({environment,accountId,characterId},plan);if(ticket!==generation.current||live.current.key!==key||!live.current.active)return 'unknown' as const;setState({key,view:result.view,error:'',loading:false,supported:true});return 'saved' as const;}
  catch{if(ticket===generation.current)setState(previous=>({...previous,error:'목표 저장을 확인하지 못했어요. 같은 목표의 저장 상태를 다시 확인해 주세요.'}));return 'unknown' as const;}
  finally{flight.current=false;setBusy(false);}
 };
 const cancelAndRemove=async(plan:ErgonPlanItem,remove:(plan:ErgonPlanItem)=>boolean)=>{
  if(!api||flight.current||!live.current.active||live.current.locked||state.key!==key||state.loading||!state.supported)return false;
  flight.current=true;setBusy(true);const ticket=generation.current,current=()=>{if(ticket!==generation.current||live.current.key!==key||!live.current.active||live.current.locked)throw Error('목표 문맥이 바뀌었어요. 원래 캐릭터에서 상태를 확인해 주세요.');};
  try{const driver=createErgonGoalCancellation(api,()=>generation.current),result=await driver.cancel({environment,accountId,characterId},plan);current();setState({key,view:result.view,error:'',loading:false,supported:true});if(remove(plan)!==true)throw Error('목표는 취소됐지만 계획 제거를 확인하지 못했어요.');return true;}
  catch(error){if(ticket===generation.current)setState(previous=>({...previous,error:error instanceof Error?error.message:'취소·계획 저장 상태를 확인하지 못했어요.'}));return false;}
  finally{flight.current=false;setBusy(false);}
 };
 const replaceAndSave=async(plan:ErgonPlanItem,quantity:number,save:(plan:ErgonPlanItem,quantity:number)=>boolean)=>{
  if(!api?.replaceErgonGoal||flight.current||!live.current.active||live.current.locked||state.key!==key||state.loading||!state.supported)return false;
  flight.current=true;setBusy(true);const ticket=generation.current,current=()=>{if(ticket!==generation.current||live.current.key!==key||!live.current.active||live.current.locked)throw Error('목표 문맥이 바뀌었어요. 원래 캐릭터에서 저장 상태를 확인해 주세요.');};const owner={environment,accountId,characterId};
  try{const result=await createErgonGoalReplacement({loadErgonProgress:api.loadErgonProgress,replaceErgonGoal:api.replaceErgonGoal},()=>generation.current).replace(owner,plan,quantity);current();setState({key,view:result.view,error:'',loading:false,supported:true});if(save(plan,quantity)!==true)throw Error('계획 저장 상태 확인이 필요해요.');return true;}
  catch{try{current();const view=parseErgonProgressView(await api.loadErgonProgress(owner),owner);current();setState({key,view,error:'저장 상태 확인이 필요해요. native 목표가 변경됐을 수 있어요. 계획과 입력은 유지했어요.',loading:false,supported:true});}catch{/* Never apply a late foreign result. */}return false;}
  finally{flight.current=false;setBusy(false);}
 };
 return {view:state.key===key?state.view:null,error:state.key===key?state.error:'',loading:state.key!==key||state.loading,supported:state.key===key&&state.supported,busy,reload,write,connectGoal,cancelAndRemove,replaceAndSave,canReplace:!!api?.replaceErgonGoal,canConnect:!!api?.createErgonGoal};
}
