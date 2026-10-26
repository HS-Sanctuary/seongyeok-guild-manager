'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createErgonSession} from '@/lib/irisErgonSession';
import {parseErgonPlans,readErgonPlans,writeErgonPlans,type ErgonPlanItem} from '@/lib/irisErgonPlan';
import {removeErgonPlanAfterCancel,replaceErgonPlanAfterGoal} from '@/lib/irisErgonGoalManagement';
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
 const planBaseline=useRef<ErgonPlanItem[]|null>(null),planDraft=useRef({plans,persistent,ready,unreadable,planScope});
 useLayoutEffect(()=>{planDraft.current={plans,persistent,ready,unreadable,planScope};},[plans,persistent,ready,unreadable,planScope]);
 const session=useRef<ReturnType<typeof createErgonSession>|null>(null);
 useLayoutEffect(()=>{
  const allowed=()=>mounted.current&&latest.current.active&&!latest.current.locked&&document.visibilityState==='visible';
  const reader=createErgonSession({read:kind=>{const started=generation.current;return latest.current.read(kind,()=>started===generation.current&&allowed());},allowed,context:()=>latest.current.getContextVersion(),onChange:()=>{if(mounted.current)setSnapshotState(reader.state());}});
  session.current=reader;return()=>{session.current=null;};
 },[]);
 useLayoutEffect(()=>{generation.current++;session.current?.invalidate();},[props.active,props.locked,props.watchWorks]);
 useLayoutEffect(()=>{generation.current++;session.current?.reset();},[props.environment,props.accountId,props.characterId]);
 useEffect(()=>{const changed=()=>{generation.current++;session.current?.invalidate();};document.addEventListener('visibilitychange',changed);return()=>document.removeEventListener('visibilitychange',changed);},[]);
 useEffect(()=>{mounted.current=true;let live=true;queueMicrotask(()=>{if(!live)return;try{const value=readErgonPlans(localStorage,props.environment,props.accountId);planBaseline.current=value.persistent&&!value.unreadable?value.items:null;setPlans(value.items);setPersistent(value.persistent);setUnreadable(value.unreadable);}catch{planBaseline.current=null;setPlans([]);setPersistent(false);setUnreadable(false);}setLoadedPlanScope(planScope);});return()=>{live=false;mounted.current=false;};},[props.environment,props.accountId,planScope]);
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
  setPersistent(saved);if(saved)planBaseline.current=parseErgonPlans({schemaVersion:1,items:next});if(saved&&reset)setUnreadable(false);
 };
 const removeCancelledPlan=(plan:ErgonPlanItem)=>{
  const p=latest.current,draft=planDraft.current;if(!ready||unreadable||!draft.persistent||draft.planScope!==planScope||JSON.stringify(draft.plans)!==JSON.stringify(plans)||!p.active||p.locked||p.environment!==props.environment||p.accountId!==props.accountId||p.characterId!==props.characterId||!p.characterId)throw Error('미저장 계획 또는 소유 범위 변경이 있어요. 현재 계획을 먼저 저장해 주세요.');
  const local=plans.find(row=>row.id===plan.id);if(local&&JSON.stringify(local)!==JSON.stringify(plan))throw Error('계획이 변경됐어요. 기존 기록을 확인해 주세요.');
  const stored=readErgonPlans(localStorage,p.environment,p.accountId);if(!stored.persistent||stored.unreadable||JSON.stringify(stored.items)!==JSON.stringify(draft.plans))throw Error('저장된 계획 목록이 달라요. 다른 편집을 보존하고 새로 확인해 주세요.');
  const next=removeErgonPlanAfterCancel(localStorage,{environment:p.environment as 'development'|'production',accountId:p.accountId,characterId:p.characterId},plan);planBaseline.current=next;setPlans(next);setPersistent(true);return true;
 };
 const replaceGoalPlan=(plan:ErgonPlanItem,quantity:number)=>{
  const p=latest.current,draft=planDraft.current;if(!draft.ready||draft.unreadable||!draft.persistent||draft.planScope!==planScope||JSON.stringify(draft.plans)!==JSON.stringify(plans)||!p.active||p.locked||p.environment!==props.environment||p.accountId!==props.accountId||p.characterId!==props.characterId||!p.characterId)throw Error('미저장 계획 또는 소유 범위 변경이 있어요. 현재 계획을 먼저 저장해 주세요.');
  const local=plans.find(row=>row.id===plan.id);if(!local||JSON.stringify(local)!==JSON.stringify(plan))throw Error('계획이 변경됐어요. 저장 상태 확인이 필요해요.');
  const expected=plans.map(row=>row.id===plan.id?{...row,targetQuantity:quantity}:row),stored=readErgonPlans(localStorage,p.environment,p.accountId);if(!stored.persistent||stored.unreadable||JSON.stringify(stored.items)!==JSON.stringify(draft.plans)&&JSON.stringify(stored.items)!==JSON.stringify(expected))throw Error('다른 편집이 있어요. 초안을 보존하고 저장 상태를 확인해 주세요.');
  const next=replaceErgonPlanAfterGoal(localStorage,{environment:p.environment as 'development'|'production',accountId:p.accountId,characterId:p.characterId},plan,quantity);planBaseline.current=next;setPlans(next);setPersistent(true);return true;
 };
 const retryPlans=()=>{const p=latest.current,draft=planDraft.current;if(!draft.ready||draft.unreadable||draft.planScope!==planScope||!p.active||p.locked||p.environment!==props.environment||p.accountId!==props.accountId)throw Error('현재 계획과 계정을 확인해 주세요.');const stored=readErgonPlans(localStorage,p.environment,p.accountId);if(!stored.persistent||stored.unreadable||planBaseline.current===null||JSON.stringify(stored.items)!==JSON.stringify(planBaseline.current))throw Error('다른 창에서 계획이 바뀌었거나 저장 상태를 확인할 수 없어요. 초안은 유지해요.');if(!writeErgonPlans(localStorage,p.environment,p.accountId,draft.plans))throw Error('계획을 저장하지 못했어요. 초안은 유지해요.');const verified=readErgonPlans(localStorage,p.environment,p.accountId);if(!verified.persistent||verified.unreadable||JSON.stringify(verified.items)!==JSON.stringify(draft.plans))throw Error('계획 저장 결과를 확인하지 못했어요.');planBaseline.current=parseErgonPlans({schemaVersion:1,items:draft.plans});setPersistent(true);return true;};
 return {...snapshotState,now,refresh,inspect,refreshCurrencies,refreshOverview,currencies,currencyBusy,currencyNotice,plans:ready?plans:[],persistent:ready?persistent:true,unreadable:ready&&unreadable,ready,changePlans,removeCancelledPlan,replaceGoalPlan,retryPlans};
}
