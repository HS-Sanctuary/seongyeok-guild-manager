'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useErgonSession,type ErgonSessionProps} from './useErgonSession';
import {useErgonPolling} from './useErgonPolling';
import {ergonSnapshotStale} from '@/lib/irisErgonRead';

import {editErgonPlans} from '@/lib/irisErgonPlanEdit';
import {parseErgonFavorites,readErgonFavorites,writeErgonFavorites,type ErgonFavorite} from '@/lib/irisErgonFavorites';
import type {ErgonPlanItem} from '@/lib/irisErgonPlan';
import type {ErgonNextStep} from '@/lib/irisErgonNextStep';
import type {ErgonRecipe} from '@/lib/irisErgonRead';
import {checkErgonStart} from '@/lib/irisErgonStart';
import {DesktopErgonExecution} from './DesktopErgonExecution';
import {DesktopErgonWorkbench} from './DesktopErgonWorkbench';
import {DesktopErgonQueue} from './DesktopErgonQueue';
import {DesktopErgonCatalog} from './DesktopErgonCatalog';
import {DesktopFocusDialog} from './DesktopFocusDialog';
import {confirmedErgonCraftOutput,needsErgonCraftQuantityConfirmation,type ErgonCraftGoal} from '@/lib/irisErgonCraftGoal';
import {ergonCollectionPreview,requestErgonCollection} from '@/lib/irisErgonCollection';
import {ErgonFacilityIcon} from './ErgonFacilityIcon';
import {DesktopContextHelp} from './DesktopContextHelp';
import {DesktopErgonCollectionPermission} from './DesktopErgonCollectionPermission';
import type {ErgonCollectionPolicy,ErgonCollectionIdentity} from '@/lib/irisErgonAutomation';
import type {createDesktopStore} from '@/lib/irisDesktopStore';
type ActionApi=Pick<ReturnType<typeof createDesktopStore>,'lifeActionCapabilities'|'setLifeContext'|'prepareLifeAction'|'confirmLifeAction'|'cancelLifeAction'|'lifeActionState'|'lifeActionHistory'|'stopLifeAction'|'collectLifeAction'|'collectionPolicy'|'revokeCollection'|'collectionObservation'>&Partial<Pick<ReturnType<typeof createDesktopStore>,'readLifeReference'|'setWorkspace'>>;
type ConnectedProps=ErgonSessionProps&{actions?:ActionApi;accountLabel?:string;characterLabel?:string;gameBusy?:boolean;onActionBusyChange?:(busy:boolean)=>void};
export function DesktopErgonRecipeStatus({recipe,unlocked}:{recipe:ErgonRecipe;unlocked?:boolean|null}){
 return <><span>{recipe.available===true?'가능':recipe.available===false?'재료·조건 확인':'조건 미확인'}</span>{unlocked===false&&<p className="iris-caption">제작 기능이 잠겨 있어요.</p>}{recipe.reason&&<p className="iris-caption">{recipe.reason}</p>}{recipe.missing&&<p className="iris-caption">현재 1회 부족분: {recipe.missing.map(m=>`${m.name} 필요 ${m.required??'?'} / 보유 ${m.owned??'?'}`).join(', ')}</p>}</>;
}
const areas={plan:{label:'작업 계획',text:'목표 품목·횟수·재료 소모를 먼저 확인하고 작업 순서를 계획하는 공간이에요.'},materials:{label:'재료 확보',text:'필요한 재료와 현재 재고를 비교하는 조회 기능을 순서대로 연결할 예정이에요.'},execution:{label:'자동 실행',text:'시설 하나의 수령부터 대상·소모 한도·중지 방법을 확인한 뒤 연결해요. 지금은 게임 명령을 실행하지 않아요.'},history:{label:'작업 기록',text:'아이리스가 요청한 작업과 실제 확인된 결과를 구분해서 보여줄 예정이에요. 생텀 숙제 기록과는 따로 관리해요.'}} as const;
export function DesktopErgon(props:ConnectedProps|{read?:undefined}={}){
  return props?.read?<ConnectedErgon {...props}/>:<ErgonShell/>;
}
function ErgonShell(){
  const [area,setArea]=useState<keyof typeof areas>('plan');
  return <div className="iris-ergon">
    <header><h2>에르곤 - 스마트 채집 가공 제작 생활 매니저</h2></header>
    <nav aria-label="에르곤 기능">{Object.entries(areas).map(([id,item])=><button key={id} type="button" className="iris-desktop-button" aria-pressed={area===id} aria-controls="iris-ergon-area" onClick={()=>setArea(id as keyof typeof areas)}>{item.label}</button>)}</nav>
    <section id="iris-ergon-area" aria-label={areas[area].label}><h3>{areas[area].label}</h3><p className="iris-caption">{areas[area].text}</p><p className="iris-ergon-stage">화면 준비 · 게임 연결 전</p></section>
  </div>;
}
function ConnectedErgon(props:ConnectedProps){
 const [wide,setWide]=useState(false),[windowBusy,setWindowBusy]=useState(false);
 const wideRef=useRef(false),windowFlight=useRef(false),workspaceGeneration=useRef(0);
 const setWorkspace=props.actions?.setWorkspace;
 useEffect(()=>{const lifecycle=workspaceGeneration,started=++lifecycle.current;if(!props.active)queueMicrotask(()=>{if(lifecycle.current===started){setWide(false);setWindowBusy(false);}});return()=>{lifecycle.current++;if(setWorkspace&&wideRef.current){wideRef.current=false;void setWorkspace(false).catch(()=>{});}};},[props.active,setWorkspace]);
 const toggleWorkspace=async()=>{if(!setWorkspace||windowFlight.current||props.locked||!props.active)return;const started=workspaceGeneration.current;windowFlight.current=true;setWindowBusy(true);try{const value=await setWorkspace(!wideRef.current);if(started!==workspaceGeneration.current){if(value.expanded)void setWorkspace(false).catch(()=>{});return;}wideRef.current=value.expanded;setWide(value.expanded);}catch{if(started===workspaceGeneration.current)setMessage('넓은 작업화면을 열지 못했어요. 실행 중인 작업이 끝난 뒤 다시 시도해 주세요. 계속 실패하면 최신 IRIS로 다시 실행해 주세요. 현재 작업 목록은 유지돼요.');}finally{windowFlight.current=false;if(started===workspaceGeneration.current)setWindowBusy(false);}};
 const [area,setArea]=useState<keyof typeof areas>('plan'),[kind,setKind]=useState<'gathering'|'altering'|'crafting'>('altering'),[search,setSearch]=useState(''),[quantity,setQuantity]=useState('1'),[location,setLocation]=useState('inventory'),[message,setMessage]=useState('');
 const [readPaused,setReadPaused]=useState(false);
 type ExecutionPlan=Parameters<typeof DesktopErgonExecution>[0]['plan'];
 const targetRef=useRef<ExecutionPlan>(null),[pinnedTarget,setPinnedTarget]=useState<{scope:string;plan:ExecutionPlan}|null>(null);
 const gameBusy=!!props.gameBusy||!!pinnedTarget;
 const [onlyFavorites,setOnlyFavorites]=useState(false),[catalogOpen,setCatalogOpen]=useState(false);
 const favoriteScope=JSON.stringify([props.environment,props.accountId]);
 const [favoriteState,setFavoriteState]=useState<{scope:string;items:ErgonFavorite[];persistent:boolean;unreadable:boolean}|null>(null);
 const favorites=favoriteState?.scope===favoriteScope?favoriteState.items:[];
 useEffect(()=>{let current=true;queueMicrotask(()=>{if(!current)return;try{const result=readErgonFavorites(localStorage,props.environment,props.accountId);setFavoriteState({scope:favoriteScope,...result});}catch{setFavoriteState({scope:favoriteScope,items:[],persistent:false,unreadable:false});}});return()=>{current=false;};},[favoriteScope,props.environment,props.accountId]);
 const session=useErgonSession({...props,locked:props.locked||readPaused||gameBusy,watchWorks:!props.actions&&area==='materials'});
 const collectionScope=JSON.stringify([props.environment,props.accountId,props.characterId]);
 const [policyState,setPolicyState]=useState<{scope:string;value:ErgonCollectionPolicy}|null>(null);const policy=policyState?.scope===collectionScope?policyState.value:null;const acceptPolicy=useCallback((value:ErgonCollectionPolicy)=>setPolicyState({scope:collectionScope,value}),[collectionScope]);
 const collectionFlight=useRef(false),collectionSequence=useRef(0),executionBusy=useRef(false),collectionRun=useRef<string|null>(null),collectionFocus=useRef<HTMLElement|null>(null);
 const collectionLive=useRef({scope:collectionScope,active:props.active});
 const collectionFlightTicket=useRef<number|null>(null);const [collectionObservationRequest,setCollectionObservationRequest]=useState<ErgonCollectionIdentity|null>(null);
 const [collectionBusy,setCollectionBusy]=useState(false),[collectionNotice,setCollectionNotice]=useState(''),[collectionRunId,setCollectionRunId]=useState<string|null>(null);
 useLayoutEffect(()=>{const sequence=collectionSequence;collectionLive.current={scope:collectionScope,active:props.active};return()=>{sequence.current++;};},[collectionScope,props.active]);
 const notifyActionBusy=props.onActionBusyChange;
 const reportBusy=useCallback((busy:boolean)=>{if(busy&&!executionBusy.current)setPinnedTarget({scope:collectionScope,plan:targetRef.current});if(!busy)setPinnedTarget(null);executionBusy.current=busy;notifyActionBusy?.(busy||collectionFlight.current||!!collectionRun.current);},[notifyActionBusy,collectionScope]);
 const settleCollection=useCallback((id:string,state:Parameters<NonNullable<Parameters<typeof DesktopErgonExecution>[0]['onExternalActionSettled']>>[1])=>{if(collectionRun.current!==id)return;collectionRun.current=null;setCollectionRunId(null);setCollectionObservationRequest(null);collectionSequence.current++;collectionFlightTicket.current=null;collectionFlight.current=false;setCollectionBusy(false);setCollectionNotice(previous=>state==='completed'?'수령 완료':state==='unknown'?'수령 결과를 확인하지 못했어요. 자동 재시도하지 않아요.':state==='cancelled'?'수령을 취소했어요.':previous==='확인 중'||previous==='이동·수령 중'?'수령이 완료되지 않았어요.':previous);notifyActionBusy?.(executionBusy.current||collectionFlight.current);},[notifyActionBusy]);
 const [collection,setCollection]=useState<{scope:string;facility:string;displayName:string|null}|null>(null);
 const collecting=collection?.scope===collectionScope?collection:null;
 const collectionPreview=collecting?ergonCollectionPreview(session.snapshots.works,collecting.facility,session.now):null;
 const openCollection=async(facility:string)=>{
  if(!props.actions||!props.characterId||!props.active||props.locked||readPaused||gameBusy||executionBusy.current||collectionRun.current||collectionFlight.current)return;
  const preview=ergonCollectionPreview(session.snapshots.works,facility,Date.now());if(!preview.ready){setMessage(preview.reason);return;}
  const ticket=++collectionSequence.current,isCurrent=()=>ticket===collectionSequence.current&&collectionLive.current.active&&collectionLive.current.scope===collectionScope;
  collectionFlight.current=true;collectionFlightTicket.current=ticket;setCollectionBusy(true);props.onActionBusyChange?.(true);setCollectionNotice('확인 중');
  setCollection({scope:collectionScope,facility,displayName:preview.displayName});setArea('execution');
  try{const receipt=await requestErgonCollection(props.actions,{accountId:props.accountId,characterId:props.characterId,accountLabel:props.accountLabel??'',characterLabel:props.characterLabel??''},preview,isCurrent,request=>{collectionRun.current=request.requestId;setCollectionRunId(request.requestId);setCollectionObservationRequest(request);});if(receipt?.state==='cancelled'&&collectionRun.current===receipt.id)settleCollection(receipt.id,'cancelled');if(isCurrent()&&receipt)setCollectionNotice(receipt.state==='running'?'이동·수령 중':'수령을 취소했어요.');}
  catch(error){if(isCurrent())setCollectionNotice(error instanceof Error?error.message:'수령 요청을 확인하지 못했어요. 게임과 작업 기록을 확인해 주세요.');}
  finally{if(collectionFlightTicket.current!==ticket)return;collectionFlightTicket.current=null;collectionFlight.current=false;setCollectionBusy(false);props.onActionBusyChange?.(executionBusy.current||!!collectionRun.current);}
 };
 useEffect(()=>{if(collecting&&area==='execution'){collectionFocus.current?.focus({preventScroll:true});collectionFocus.current?.scrollIntoView({block:'start'});}},[collecting,area]);
 const [checked,setChecked]=useState(false),[planId,setPlanId]=useState('');
 const [queueOpen,setQueueOpen]=useState(false);
 const [craftGoals,setCraftGoals]=useState<Record<string,ErgonCraftGoal>>({});
 const rootPlan=session.plans.find(row=>row.id===planId)??session.plans[0];
 const guideScope=JSON.stringify([collectionScope,rootPlan?.id,rootPlan?.kind,rootPlan?.displayName,rootPlan?.targetQuantity]);
 const [prerequisite,setPrerequisite]=useState<{scope:string;plan:ErgonPlanItem&{parentPlanId?:string}}|null>(null);
 const guided=prerequisite?.scope===guideScope?prerequisite:null;
 const selectedPlan=guided?.plan??rootPlan;
 useEffect(()=>{let current=true;queueMicrotask(()=>{if(current)setPrerequisite(previous=>!props.active||previous?.scope!==guideScope?null:previous);});return()=>{current=false;};},[props.active,guideScope]);
 const [replacement,setReplacement]=useState<{scope:string;id:string}|null>(null);
 const replacing=replacement?.scope===collectionScope?replacement:null;
 const disabled=!props.active||props.locked,gameDisabled=disabled||readPaused||gameBusy||collectionBusy||!!collectionRunId,now=session.now,catalog=session.snapshots[kind];
 const editable=()=>!disabled&&session.ready&&!session.unreadable;
 const editDisabled=disabled||!session.ready||session.unreadable;
 const refresh=(readKind:Parameters<typeof session.refresh>[0])=>void session.refresh(readKind);
 const save=(next:typeof session.plans)=>{if(!editable())return false;try{session.changePlans(next);setCraftGoals(previous=>Object.fromEntries(Object.entries(previous).filter(([id,goal])=>next.some(item=>item.id===goal.identity.parentPlanId&&(goal.blocked||goal.pending||needsErgonCraftQuantityConfirmation(goal))||item.id===id&&item.kind==='crafting'&&item.displayName===goal.identity.displayName&&(item.targetQuantity===goal.identity.targetQuantity||goal.blocked||goal.pending||needsErgonCraftQuantityConfirmation(goal))))));setMessage('');return true;}catch{setMessage('계획은 최대 50개, 목표는 1~1,000,000 정수로 입력해 주세요.');return false;}};
 const selectPlan=(id:string)=>{if(!editable())return;setPrerequisite(null);if(!collectionFlight.current&&!collectionRun.current)setCollection(null);setPlanId(id);setChecked(false);};
 const addPlan=(kind:'gathering'|'altering'|'crafting',displayName:string,targetQuantity:number)=>{if(!editable())return false;const existing=session.plans.find(row=>row.kind===kind&&row.displayName===displayName);if(existing){selectPlan(existing.id);setMessage('선택한 작업이에요. 목록에서 수량을 바꿀 수 있어요.');return true;}const id=crypto.randomUUID();if(!save([...session.plans,{id,kind,displayName,targetQuantity}]))return false;setPrerequisite(null);if(!collectionFlight.current&&!collectionRun.current)setCollection(null);setPlanId(id);return true;};
 const toggleFavorite=(item:ErgonFavorite)=>{if(disabled||favoriteState?.scope!==favoriteScope)return;const existing=favorites.some(row=>row.kind===item.kind&&row.displayName===item.displayName);try{const items=parseErgonFavorites({schemaVersion:1,items:existing?favorites.filter(row=>row.kind!==item.kind||row.displayName!==item.displayName):[...favorites,item]});let persistent=false;try{persistent=writeErgonFavorites(localStorage,props.environment,props.accountId,items);}catch{/* Blocked storage still permits session-only favorites. */}setFavoriteState({...favoriteState,items,persistent});}catch{setMessage('즐겨찾기는 최대 200개까지 담을 수 있어요.');}};
 const chooseCatalog=(item:ErgonFavorite)=>{if(!editable()||!catalog||!gameBusy&&!readPaused&&ergonSnapshotStale(catalog,Date.now())||item.kind!==kind||!catalog.data.items.some(row=>row.name===item.displayName)){setMessage('최신 품목 목록을 다시 조회해 주세요.');return;}if(!replacing){addPlan(item.kind,item.displayName,Number(quantity));return;}try{const result=editErgonPlans(session.plans,{type:'replace',id:replacing.id,kind:item.kind,displayName:item.displayName,newId:crypto.randomUUID()});if(result.duplicateId){setMessage('이미 담긴 품목이에요. 기존 작업을 선택했어요.');}else if(!save(result.items))return;if(result.selectedId)selectPlan(result.selectedId);setReplacement(null);}catch{setMessage('교체할 작업과 품목을 다시 확인해 주세요.');}};
 const beginReplace=(id:string)=>{if(!editable())return;const item=session.plans.find(row=>row.id===id);if(!item)return;setKind(item.kind);setSearch('');setOnlyFavorites(false);setReplacement({scope:collectionScope,id});if(!gameDisabled)void session.refresh(item.kind);};
 const renderCatalog=(isReplacing:boolean)=><DesktopErgonCatalog kind={kind} search={search} items={catalog?.data.items.map(row=>({name:row.name,available:'available' in row?row.available:row.toolOk,reason:'reason' in row?row.reason:undefined,producedPerUnit:'producedPerUnit' in row?row.producedPerUnit:undefined}))??[]} favorites={favorites} onlyFavorites={onlyFavorites} disabled={editDisabled||session.loadingKinds.includes(kind)} replacing={isReplacing} onKindChange={value=>{setKind(value);setSearch('');if(!gameDisabled)void session.refresh(value);}} onSearchChange={setSearch} onFavoritesOnlyChange={setOnlyFavorites} onToggleFavorite={toggleFavorite} onChoose={chooseCatalog} onCancelReplace={()=>setReplacement(null)}/>;
 const craftRecipe=selectedPlan?.kind==='crafting'?session.snapshots.crafting?.data.items.find(row=>row.name===selectedPlan.displayName):null;
 const candidatePlan:ExecutionPlan=collecting?(collecting.displayName?{id:`collect:${collecting.facility}`,kind:'collect',displayName:collecting.displayName,facility:collecting.facility,targetQuantity:1}:null):selectedPlan?{...selectedPlan,outputPerCraft:craftRecipe?.producedPerUnit}:null;
 // Planning may change freely; an already requested action keeps its original target.
 const executionPlan=pinnedTarget?.scope===collectionScope?pinnedTarget.plan:candidatePlan;
 useLayoutEffect(()=>{targetRef.current=executionPlan;});
 const selectedGoal=selectedPlan?craftGoals[selectedPlan.id]:undefined;
 const savedCraftGoal=selectedGoal&&selectedGoal.identity.accountId===props.accountId&&selectedGoal.identity.characterId===props.characterId&&selectedGoal.identity.planId===selectedPlan?.id&&selectedGoal.identity.displayName===selectedPlan?.displayName&&(selectedGoal.identity.targetQuantity===selectedPlan?.targetQuantity&&selectedGoal.identity.outputPerCraft===craftRecipe?.producedPerUnit||selectedGoal.blocked||selectedGoal.pending||needsErgonCraftQuantityConfirmation(selectedGoal))?selectedGoal:undefined;
 const reportCraftGoal=(goal:ErgonCraftGoal)=>{const identity=goal.identity,id=identity.planId;if(!id||identity.accountId!==props.accountId||identity.characterId!==props.characterId||!session.plans.some(item=>item.id===identity.parentPlanId||item.id===id&&item.kind==='crafting'&&item.displayName===identity.displayName&&(item.targetQuantity===identity.targetQuantity||goal.blocked||goal.pending||needsErgonCraftQuantityConfirmation(goal))))return;setCraftGoals(previous=>({...previous,[id]:goal}));};
 const {refresh:refreshRead,refreshOverview,ready,currencyNotice}=session,hasReadErrors=Object.keys(session.errors).length>0;
 const selectionKind=selectedPlan?.kind??kind;
 useErgonPolling({enabled:!!props.actions&&props.active&&!props.locked&&!gameBusy&&!readPaused&&!collectionBusy&&!collectionRunId&&ready&&!hasReadErrors&&!currencyNotice,scope:collectionScope,kinds:queueOpen||rootPlan&&rootPlan.kind!=='gathering'?['gathering','altering','crafting']:[kind,selectionKind],refresh:refreshRead,refreshOverview});
 const rootGoal=rootPlan?craftGoals[rootPlan.id]:undefined;
 const scopedRootGoal=rootGoal&&rootGoal.identity.accountId===props.accountId&&rootGoal.identity.characterId===props.characterId&&rootGoal.identity.planId===rootPlan?.id&&rootGoal.identity.displayName===rootPlan?.displayName?rootGoal:undefined;
 const rootRequiresReview=!!scopedRootGoal&&(scopedRootGoal.blocked||!!scopedRootGoal.pending||needsErgonCraftQuantityConfirmation(scopedRootGoal))||!!rootPlan&&Object.values(craftGoals).some(goal=>goal.identity.parentPlanId===rootPlan.id&&goal.identity.accountId===props.accountId&&goal.identity.characterId===props.characterId&&(goal.blocked||!!goal.pending||needsErgonCraftQuantityConfirmation(goal)));
 const rootProgress=scopedRootGoal&&scopedRootGoal.identity.targetQuantity===rootPlan?.targetQuantity&&scopedRootGoal.identity.outputPerCraft===session.snapshots.crafting?.data.items.find(row=>row.name===rootPlan?.displayName)?.producedPerUnit?confirmedErgonCraftOutput(scopedRootGoal):0;
 const remainingRoot=rootPlan?Math.max(0,rootPlan.targetQuantity-rootProgress):0;
 const chooseNext=(step:Extract<ErgonNextStep,{kind:'action'}>)=>{
  if(gameDisabled||rootRequiresReview||!rootPlan||session.loadingKinds.length||session.currencyBusy)return;
  setCollection(null);
  if(step.action===rootPlan.kind&&step.displayName===rootPlan.displayName)setPrerequisite(null);
  else setPrerequisite({scope:guideScope,plan:{id:'prerequisite:'+crypto.randomUUID(),parentPlanId:rootPlan.id,kind:step.action,displayName:step.displayName,targetQuantity:step.quantity}});
  setArea('execution');
 };
 const refreshWorkbench=async()=>{for(const next of ['gathering','altering','crafting'] as const)await refreshRead(next);await refreshOverview();};
 return <div className="iris-ergon" data-workspace={wide}><header className="iris-ergon-title"><div><div className="iris-ergon-section-heading"><h2>에르곤 · 생활 작업대</h2><DesktopContextHelp label="생활 작업대">품목과 목표 수량을 정하면 필요한 재료와 다음 작업을 확인할 수 있어요. 선택만으로 게임을 조작하지 않아요. 실행 준비 뒤 최종 확인이 필요해요.</DesktopContextHelp></div></div>{setWorkspace&&<button type="button" className="iris-desktop-button" data-ergon-role="neutral" disabled={disabled||windowBusy} aria-pressed={wide} onClick={()=>void toggleWorkspace()}>{wide?'작은 작업화면':'넓은 작업화면'}</button>}</header>
  <nav aria-label="에르곤 기능">{Object.entries(areas).map(([id,item])=><button key={id} type="button" className="iris-desktop-button" disabled={disabled} aria-pressed={area===id} onClick={()=>setArea(id as keyof typeof areas)}>{item.label}</button>)}</nav>
  {session.notice&&<p role="alert">{session.notice} 이전 값은 조회 당시 정보예요.</p>}{message&&<p role="alert">{message}</p>}
  <div className="iris-ergon-workspace" data-area={area}>
  {props.actions&&<DesktopErgonWorkbench collectionControls={<DesktopErgonCollectionPermission key={collectionScope} api={props.actions} accountId={props.accountId} policy={policy} disabled={gameDisabled} onChange={acceptPolicy}/>} view="overview" session={{...session,refreshOverview:refreshWorkbench}} plan={undefined} characterLabel={props.characterLabel??''} disabled={gameDisabled||session.unreadable} onAddPlan={addPlan} onCollection={facility=>void openCollection(facility)}/>}
  <section className="iris-ergon-focus" hidden={area!=='execution'&&area!=='history'&&!(props.actions&&area==='plan')||area==='plan'&&!selectedPlan&&!collecting} aria-label="선택 작업">
   {area!=='history'&&!collecting&&!props.actions&&<h3>{rootPlan?.displayName??'품목을 선택해 주세요'}</h3>}
   {guided&&rootPlan&&<div className="iris-ergon-guided-goal"><p>원래 목표 · {rootPlan.displayName} {rootPlan.targetQuantity}개</p><button type="button" className="iris-desktop-button" disabled={disabled} onClick={()=>setPrerequisite(null)}>원래 제작 목표로</button></div>}
   {collecting&&collectionPreview&&<section ref={collectionFocus} tabIndex={-1} aria-label="시설 수령 확인" className="iris-ergon-collection"><div className="iris-ergon-facility-heading"><ErgonFacilityIcon name={collecting.facility}/><h3>{collecting.facility}</h3></div>{collectionPreview.completed.map(row=><p key={row.displayName}>{row.displayName} · 완료 작업 {row.count}건</p>)}{collectionNotice&&<p role="status">{collectionNotice}</p>}{collectionPreview.reason&&<p role="status">{collectionPreview.reason}</p>}<p className="iris-caption">시설 완료품 전체 수령 · 비용 미확인</p><button type="button" className="iris-desktop-button" disabled={disabled} onClick={()=>{if(!collectionRun.current&&!collectionFlight.current){collectionSequence.current++;setCollection(null);}setArea('plan');}}>작업으로 돌아가기</button></section>}
   {!props.actions&&<><h3>작업 시작 전 점검</h3><button type="button" className="iris-desktop-button" disabled={disabled||!selectedPlan||session.loadingKinds.length>0||session.currencyBusy} onClick={()=>{setChecked(true);void session.inspect(selectedPlan.kind);}}>시작 전 점검</button>{session.currencyNotice&&<p role="alert">{session.currencyNotice}</p>}{checked&&selectedPlan&&(()=>{const result=checkErgonStart({snapshots:session.snapshots,currencies:session.currencies,kind:selectedPlan.kind,displayName:selectedPlan.displayName,now:session.now,unresolved:false,identityConfirmed:false});return <><p>정령의 날개 보유 {result.wings??'미확인'}개 · 채집/가공 등록/제작 명령당 {result.costPerCommand}개</p>{result.blockers.map(text=><p className="iris-caption" key={text}>{text}</p>)}{result.warnings.map(text=><p className="iris-caption" key={text}>{text}</p>)}</>;})()}</>}
   <DesktopErgonExecution onActionSettled={row=>{if(guided&&row.accountId===props.accountId&&row.characterId===props.characterId&&row.action===guided.plan.kind&&row.action!=='crafting'&&row.displayName===guided.plan.displayName&&['completed','registered','stopped'].includes(row.state))setPrerequisite(null);}} onReadPauseChange={setReadPaused} externalCollectionRequest={collectionObservationRequest} onCollectionPolicy={acceptPolicy} externalActionId={collectionRunId} onExternalActionSettled={settleCollection} collectionDirect={!!collecting} api={props.actions} plan={executionPlan} collectionReady={!collecting||!!collectionPreview?.ready&&collectionPreview.displayName===collecting.displayName} accountId={props.accountId} characterId={props.characterId} accountLabel={props.accountLabel??''} characterLabel={props.characterLabel??''} active={props.active&&(area==='execution'||!!props.actions&&area==='plan')} locked={props.locked||rootRequiresReview||gameBusy||collectionBusy||!!collectionRunId||session.loadingKinds.length>0||session.currencyBusy} onBusyChange={reportBusy} savedCraftGoal={collecting?undefined:savedCraftGoal} onCraftProgress={reportCraftGoal} historyVisible={area==='history'} onShowHistory={()=>setArea('history')} materialsPanel={!collecting&&props.actions&&rootPlan?(rootRequiresReview?<p role="status" className="iris-caption">제작 결과 확인 후 남은 재료를 계산해요.</p>:remainingRoot>0?<DesktopErgonWorkbench key={guideScope} view="materials" session={session} plan={{...rootPlan,targetQuantity:remainingRoot}} characterLabel={props.characterLabel??''} disabled={gameDisabled||session.unreadable} readReference={gameDisabled?undefined:props.actions.readLifeReference} onAddPlan={addPlan} onNextStep={chooseNext} onCollection={facility=>void openCollection(facility)}/>:<p className="iris-caption">확인된 목표 수량을 채웠어요. 새 추가 목표를 정하기 전에는 재료를 다시 예약하지 않아요.</p>):undefined} onQuantityChange={quantity=>{if(guided){setPrerequisite({...guided,plan:{...guided.plan,targetQuantity:quantity}});return;}if(selectedPlan)save(session.plans.map(row=>row.id===selectedPlan.id?{...row,targetQuantity:quantity}:row));}}/>
  </section>
  {area==='plan'&&<>
   <section className="iris-ergon-plan-picker" aria-label="작업 계획"><button type="button" className="iris-desktop-button iris-ergon-catalog-toggle" aria-expanded={catalogOpen||session.plans.length===0} onClick={()=>setCatalogOpen(value=>!value)}>품목 찾기</button><div className="iris-ergon-catalog-body" data-open={catalogOpen||session.plans.length===0}><div className="iris-ergon-section-heading"><h3>품목 · 수량 선택</h3><DesktopContextHelp label="품목 선택">채집·가공·제작 목록을 조회한 뒤 품목을 선택해 주세요. 수량은 기존 보유량에 더해 만들 목표예요. ★로 자주 쓰는 품목을 모아둘 수 있어요. 가공은 한 번에 작업 1건 등록이며, 목표 전체 생산 완료와 달라요.</DesktopContextHelp></div><label>목표 수량<input type="number" min="1" max="1000000" step="1" value={quantity} onChange={event=>setQuantity(event.target.value)}/></label>{!replacing&&renderCatalog(false)}</div>{favoriteState?.scope===favoriteScope&&(!favoriteState.persistent||favoriteState.unreadable)&&<p role="alert" className="iris-caption">즐겨찾기 {favoriteState.unreadable?'원본 확인 필요':'현재 창에서만 유지'}</p>}</section>
   <div className="iris-ergon-list-panel">{session.unreadable?<p role="alert">저장된 계획 확인 필요 · 원본 보존 중</p>:!session.persistent&&<p role="alert">계획은 현재 창에서만 유지돼요.</p>}<DesktopErgonQueue presentation="workbench" selectedId={rootPlan?.id} plans={session.plans} goals={craftGoals} snapshots={session.snapshots} now={now} scope={collectionScope} identity={{accountId:props.accountId,characterId:props.characterId}} active={!editDisabled} readReference={gameDisabled?undefined:props.actions?.readLifeReference} onChangePlans={save} onSelect={selectPlan} onReplace={beginReplace} onOpenChange={setQueueOpen}/></div>
  </>}
  {replacing&&<DesktopFocusDialog title="품목 교체" description="추가 수량은 유지하고, 새 품목의 작업으로 바꿔요." onClose={()=>setReplacement(null)}><div className="iris-ergon">{renderCatalog(true)}</div></DesktopFocusDialog>}
  {area==='materials'&&<section aria-label="재료 확보"><div className="iris-ergon-controls">{(['materials','inventory','works'] as const).map(value=><button key={value} type="button" className="iris-desktop-button" disabled={gameDisabled||session.loadingKinds.includes(value)} onClick={()=>refresh(value)}>{value==='materials'?'재료 조회':value==='inventory'?'가방 무게 조회':'가공 현황 조회'}</button>)}</div>
   <label>보관 위치<select value={location} onChange={e=>setLocation(e.target.value)}><option value="inventory">가방</option><option value="account_storage">계정 창고</option><option value="character_storage">캐릭터 창고</option></select></label><label>재료 검색<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   {session.snapshots.inventory&&<p>가방 무게 {session.snapshots.inventory.data.weight??'?'} / {session.snapshots.inventory.data.maxWeight??'?'}</p>}
   <div className="iris-ergon-list">{session.snapshots.materials?.data.items.filter(row=>row.location===location&&row.name.includes(search)).map((row,index)=><article key={index}><strong>{row.name}</strong><span>{row.count??'?'}개 · {row.locked===true?'잠김':row.locked===false?'잠금 해제':'잠금 미확인'}</span></article>)}</div>
   <h3>가공 중인 작업</h3>{session.snapshots.works?.data.items.map((row,index)=><article key={index}><strong>{row.facility} · {row.name}</strong><span>{row.completed===true?'수령 가능':row.remainingSeconds===null?'시간 미확인':`${row.remainingSeconds}초 남음`}</span></article>)}
  </section>}
  </div>
 </div>;
}
