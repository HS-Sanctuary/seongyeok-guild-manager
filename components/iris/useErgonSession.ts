'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createErgonSession} from '@/lib/irisErgonSession';
import {parseErgonPlans,readErgonPlans,writeErgonPlans,type ErgonPlanItem} from '@/lib/irisErgonPlan';
import type {ErgonReadKind,ErgonSnapshot} from '@/lib/irisErgonRead';
import type {CurrencySnapshot} from '@/lib/irisCurrencies';
export type ErgonSessionProps={environment:string;accountId:string;characterId:string|null;active:boolean;locked:boolean;watchWorks?:boolean;read:<K extends ErgonReadKind>(kind:K,allowed?:()=>boolean)=>Promise<ErgonSnapshot<K>>;readCurrencies?:(allowed?:()=>boolean)=>Promise<CurrencySnapshot>;getContextVersion:()=>number};
export function useErgonSession(props:ErgonSessionProps){
 const latest=useRef(props);useLayoutEffect(()=>{latest.current=props;});
 const mounted=useRef(false),generation=useRef(0);
 const [snapshotState,setSnapshotState]=useState<ReturnType<ReturnType<typeof createErgonSession>['state']>>({snapshots:{},notice:'',errors:{},loadingKinds:[]});
 const [now,setNow]=useState(0);
 const currencyScope=JSON.stringify([props.environment,props.accountId,props.characterId]);
 const [currencyState,setCurrencyState]=useState<{scope:string;value:CurrencySnapshot}|null>(null),[currencyError,setCurrencyError]=useState<{scope:string;text:string}|null>(null),[currencyBusy,setCurrencyBusy]=useState(false);const currencyPending=useRef<Promise<void>|null>(null);
 const currencies=currencyState?.scope===currencyScope?currencyState.value:null,currencyNotice=currencyError?.scope===currencyScope?currencyError.text:'';
 const planScope=JSON.stringify([props.environment,props.accountId]);
 const [plans,setPlans]=useState<ErgonPlanItem[]>([]),[persistent,setPersistent]=useState(true),[unreadable,setUnreadable]=useState(false),[loadedPlanScope,setLoadedPlanScope]=useState('');
 const ready=loadedPlanScope===planScope;
 const session=useRef<ReturnType<typeof createErgonSession>|null>(null);
 useLayoutEffect(()=>{
  const allowed=()=>mounted.current&&latest.current.active&&!latest.current.locked&&document.visibilityState==='visible';
  const reader=createErgonSession({read:kind=>{const started=generation.current;return latest.current.read(kind,()=>started===generation.current&&allowed());},allowed,context:()=>latest.current.getContextVersion(),onChange:()=>{if(mounted.current)setSnapshotState(reader.state());}});
  session.current=reader;return()=>{session.current=null;};
 },[]);
 useLayoutEffect(()=>{generation.current++;session.current?.invalidate();},[props.active,props.locked,props.watchWorks]);
 useLayoutEffect(()=>{generation.current++;session.current?.reset();},[props.environment,props.accountId,props.characterId]);
 useEffect(()=>{const changed=()=>{generation.current++;session.current?.invalidate();};document.addEventListener('visibilitychange',changed);return()=>document.removeEventListener('visibilitychange',changed);},[]);
 useEffect(()=>{mounted.current=true;let live=true;queueMicrotask(()=>{if(!live)return;try{const value=readErgonPlans(localStorage,props.environment,props.accountId);setPlans(value.items);setPersistent(value.persistent);setUnreadable(value.unreadable);}catch{setPlans([]);setPersistent(false);setUnreadable(false);}setLoadedPlanScope(planScope);});return()=>{live=false;mounted.current=false;};},[props.environment,props.accountId,planScope]);
 const refresh=useCallback((kind:ErgonReadKind)=>session.current?.refresh(kind)??Promise.resolve(),[]);
 const refreshCurrencies=useCallback(()=>{
  if(currencyPending.current)return currencyPending.current;
  const started=generation.current,context=latest.current.getContextVersion();
  const scope=JSON.stringify([latest.current.environment,latest.current.accountId,latest.current.characterId]);
  const allowed=()=>mounted.current&&started===generation.current&&context===latest.current.getContextVersion()&&latest.current.active&&!latest.current.locked&&document.visibilityState==='visible';
  if(!allowed())return Promise.resolve();
  const read=latest.current.readCurrencies;if(!read){setCurrencyError({scope,text:'최신 아이리스 앱의 재화 연결을 확인해 주세요.'});return Promise.resolve();}
  setCurrencyBusy(true);
  const operation=read(allowed).then(value=>{if(allowed()){setCurrencyState({scope,value});setCurrencyError(null);}}).catch(error=>{if(allowed())setCurrencyError({scope,text:error instanceof Error?error.message:'재화 조회를 확인해 주세요.'});}).finally(()=>{if(currencyPending.current===operation)currencyPending.current=null;if(mounted.current)setCurrencyBusy(false);});currencyPending.current=operation;return operation;
 },[]);
 const inspect=useCallback(async(kind:'gathering'|'altering'|'crafting')=>{
  const started=generation.current,context=latest.current.getContextVersion();
  const allowed=()=>mounted.current&&started===generation.current&&context===latest.current.getContextVersion()&&latest.current.active&&!latest.current.locked&&document.visibilityState==='visible';
  for(const next of ['activity','inventory',kind] as const){if(!allowed())return;await session.current?.refresh(next);if(!allowed()||session.current?.state().errors[next])return;}
  if(allowed())await refreshCurrencies();
 },[refreshCurrencies]);
 const overviewPending=useRef<Promise<void>|null>(null);
 const refreshOverview=useCallback(()=>{
  if(overviewPending.current)return overviewPending.current;
  const started=generation.current,context=latest.current.getContextVersion();
  const allowed=()=>mounted.current&&started===generation.current&&context===latest.current.getContextVersion()&&latest.current.active&&!latest.current.locked&&document.visibilityState==='visible';
  const operation=(async()=>{for(const kind of ['materials','works','inventory'] as const){if(!allowed())return;await session.current?.refresh(kind);if(!allowed()||session.current?.state().errors[kind])return;}if(allowed())await refreshCurrencies();})().finally(()=>{if(overviewPending.current===operation)overviewPending.current=null;});
  overviewPending.current=operation;return operation;
 },[refreshCurrencies]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const canPoll=props.active&&!props.locked&&props.watchWorks&&!!snapshotState.snapshots.works&&!Object.keys(snapshotState.errors).length;
 useEffect(()=>{if(!canPoll)return;const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh('works');},15000);return()=>clearInterval(timer);},[canPoll,refresh]);
 const changePlans=(next:ErgonPlanItem[],reset=false)=>{
  if(!ready||(unreadable&&!reset))return;
  parseErgonPlans({schemaVersion:1,items:next});setPlans(next);
  let saved=false;try{saved=writeErgonPlans(localStorage,props.environment,props.accountId,next,reset);}catch{/* Preserve session edits when local storage is unavailable. */}
  setPersistent(saved);if(saved&&reset)setUnreadable(false);
 };
 return {...snapshotState,now,refresh,inspect,refreshCurrencies,refreshOverview,currencies,currencyBusy,currencyNotice,plans:ready?plans:[],persistent:ready?persistent:true,unreadable:ready&&unreadable,ready,changePlans};
}
