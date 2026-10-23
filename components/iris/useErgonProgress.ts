'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {createDesktopStore} from '@/lib/irisDesktopStore';
import {parseErgonProgressView,parseErgonProgressAck,type ProgressScope,type ProgressView,type ErgonQuantityWrite,type ErgonLifecycleWrite} from '@/lib/irisErgonProgress';

export type ErgonProgressApi=Pick<ReturnType<typeof createDesktopStore>,'ergonProgressCapabilities'|'loadErgonProgress'|'saveErgonQuantity'|'setErgonGoalLifecycle'>;
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
 return {view:state.key===key?state.view:null,error:state.key===key?state.error:'',loading:state.key!==key||state.loading,supported:state.key===key&&state.supported,busy,reload,write};
}
