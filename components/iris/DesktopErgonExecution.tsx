'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {createDesktopStore} from '@/lib/irisDesktopStore';
import type {ErgonChallenge,ErgonActionState,ErgonActionRecord} from '@/lib/irisErgonActions';
import {planErgonQueue,advanceErgonQueue,refreshErgonQueue,stopErgonQueue,type ErgonQueuePreview} from '@/lib/irisErgonRunQueue';

type Api=Pick<ReturnType<typeof createDesktopStore>,'lifeActionCapabilities'|'setLifeContext'|'prepareLifeAction'|'confirmLifeAction'|'cancelLifeAction'|'lifeActionState'|'lifeActionHistory'>;
type Plan={kind:'gathering'|'altering'|'crafting';displayName:string;targetQuantity:number};
export function DesktopErgonExecution({api,plan,accountId,characterId,accountLabel,characterLabel,active,locked,onBusyChange}:{api?:Api;plan:Plan|null;accountId:string;characterId:string|null;accountLabel:string;characterLabel:string;active:boolean;locked:boolean;onBusyChange?:(busy:boolean)=>void}){
 const [supported,setSupported]=useState(false),[checking,setChecking]=useState(false),[challenge,setChallenge]=useState<ErgonChallenge|null>(null),[status,setStatus]=useState<ErgonActionState|null>(null),[records,setRecords]=useState<ErgonActionRecord[]>([]),[notice,setNotice]=useState('');
 const [staged,setStaged]=useState<ErgonQueuePreview|null>(null);
 const pending=useRef<ErgonChallenge|null>(null),flight=useRef(false),mounted=useRef(false),stageRef=useRef<ErgonQueuePreview|null>(null),lastSentId=useRef<string|null>(null);
 const scope=[accountId,characterId??'',plan?.kind??'',plan?.displayName??'',plan?.targetQuantity??'',active].join('\u001f'),generation=useRef(0),stateFlight=useRef(false);
 useLayoutEffect(()=>{const lifecycle=generation;lifecycle.current++;return()=>{lifecycle.current++;};},[scope,api]);
 const refresh=useCallback(async()=>{if(!api||stateFlight.current)return;const startedGeneration=generation.current;stateFlight.current=true;try{const next=await api.lifeActionState();if(!mounted.current||generation.current!==startedGeneration)return;setStatus(next);onBusyChange?.(next.busy);const row=next.current,previous=stageRef.current;if(row&&lastSentId.current===row.id&&previous&&previous.action==='crafting'&&previous.action===row.action&&previous.displayName===row.displayName&&row.accountId===accountId&&row.characterId===characterId&&row.state!=='running'){
   const advanced=advanceErgonQueue(previous,{id:row.id,state:row.state,owned:row.afterOwned,wings:row.afterWings});stageRef.current=advanced;setStaged(advanced);lastSentId.current=null;
  }if(!next.busy)await api.setLifeContext({accountId,characterId,accountLabel,characterLabel:characterId?characterLabel:null});if(!mounted.current||generation.current!==startedGeneration)return;const history=await api.lifeActionHistory(accountId);if(mounted.current&&generation.current===startedGeneration)setRecords(history.records);}catch{if(mounted.current&&generation.current===startedGeneration)setNotice('작업 상태를 확인하지 못했어요. 게임 화면과 연결을 확인해 주세요. 자동으로 다시 실행하지 않아요.');}finally{stateFlight.current=false;}},[api,accountId,characterId,accountLabel,characterLabel,onBusyChange]);
 useEffect(()=>{mounted.current=true;let current=true;if(api){void api.lifeActionCapabilities().then(()=>{if(current)setSupported(true);return refresh();}).catch(()=>{if(current)setNotice('최신 IRIS 앱에서만 작업을 실행할 수 있어요. 앱을 정상 종료 후 다시 열어 주세요.');});}return()=>{current=false;mounted.current=false;};},[api,refresh]);
 useEffect(()=>{if(!api||(!active&&!status?.busy))return;const timer=setInterval(()=>{void refresh();},2000);return()=>clearInterval(timer);},[api,refresh,active,status?.busy]);
 useEffect(()=>{let current=true;const previous=pending.current;pending.current=null;if(previous&&api)void api.cancelLifeAction(previous.nonce).catch(()=>{});stageRef.current=null;lastSentId.current=null;queueMicrotask(()=>{if(current&&mounted.current){setStaged(null);setChallenge(null);}});return()=>{current=false;const waiting=pending.current;pending.current=null;if(waiting&&api)void api.cancelLifeAction(waiting.nonce).catch(()=>{});};},[api,accountId,characterId,plan?.kind,plan?.displayName,plan?.targetQuantity]);
 const stopNext=useCallback(()=>{
  generation.current++;
  const previous=stageRef.current;if(previous){const stopped=stopErgonQueue(previous);stageRef.current=stopped;setStaged(stopped);}
  const waiting=pending.current;pending.current=null;setChallenge(null);
  if(waiting&&api)void api.cancelLifeAction(waiting.nonce).catch(()=>setNotice('준비 취소 응답이 불명확해요. 새 실행 전 상태를 확인해 주세요.'));
  setNotice('다음 작업을 중지했어요. 이미 요청한 게임 작업의 결과는 계속 확인해요.');
 },[api]);
 useEffect(()=>{if(!active)queueMicrotask(()=>{if(mounted.current)stopNext();});},[active,stopNext]);
 useEffect(()=>{
  const deadline=staged?.deadlineAt;if(deadline===undefined)return;
  const timer=setTimeout(()=>{
   const previous=stageRef.current;if(!previous||previous.deadlineAt!==deadline)return;
   generation.current++;
   const expired=refreshErgonQueue(previous,previous);stageRef.current=expired;setStaged(expired);
   const waiting=pending.current;pending.current=null;setChallenge(null);
   if(waiting&&api)void api.cancelLifeAction(waiting.nonce).catch(()=>{});
   setNotice(expired.reason);
  },Math.max(0,deadline-Date.now()));return()=>clearTimeout(timer);
 },[staged?.deadlineAt,api]);
 const prepare=async()=>{
  if(!api||!plan||!characterId||!active||locked||flight.current||status?.blocked)return;
  const prior=stageRef.current;
  if(prior&&(prior.stopped||(prior.deadlineAt!==undefined&&Date.now()>=prior.deadlineAt)||(prior.action==='crafting'&&!prior.ready))){setNotice(prior.reason);return;}
  const startedGeneration=generation.current;flight.current=true;setChecking(true);setNotice('');
  try{
   await api.setLifeContext({accountId,characterId,accountLabel,characterLabel});if(!mounted.current||generation.current!==startedGeneration)return;
   const value=await api.prepareLifeAction({accountId,characterId,action:plan.kind,displayName:plan.displayName});
   if(!mounted.current||generation.current!==startedGeneration){await api.cancelLifeAction(value.nonce);return;}
   const previous=stageRef.current,observation={owned:value.owned,producedPerRun:value.outputPerRun,wings:value.wings};
   const preview=previous?refreshErgonQueue(previous,observation):planErgonQueue({action:value.action,displayName:value.displayName,targetQuantity:plan.targetQuantity,...observation,blocked:!!status?.blocked,deadlineAt:Date.now()+300000});
   stageRef.current=preview;setStaged(preview);
   if(preview.stopped||(preview.deadlineAt!==undefined&&Date.now()>=preview.deadlineAt)||(preview.action==='crafting'&&!preview.ready)){await api.cancelLifeAction(value.nonce);setNotice(preview.reason);return;}
   pending.current=value;setChallenge(value);
  }catch{if(mounted.current&&generation.current===startedGeneration){setNotice('작업 준비가 중단됐어요. 게임 상태·캐릭터·재료·날개와 연결을 확인해 주세요. 명령은 시작하지 않았어요.');await refresh();}}
  finally{flight.current=false;if(mounted.current)setChecking(false);}
 };
 const cancel=async()=>{const value=pending.current;pending.current=null;setChallenge(null);if(value&&api)try{await api.cancelLifeAction(value.nonce);}catch{setNotice('준비 취소 응답을 확인하지 못했어요. 확인 버튼은 다시 누르지 말고 상태를 조회해 주세요.');}};
 const confirm=async()=>{const value=pending.current;if(!api||!value||flight.current||!active||locked)return;
  const previous=stageRef.current;if(previous){const checked=refreshErgonQueue(previous,previous);stageRef.current=checked;setStaged(checked);if(checked.stopped||(checked.deadlineAt!==undefined&&Date.now()>=checked.deadlineAt)||(checked.action==='crafting'&&!checked.ready)){await cancel();setNotice(checked.reason);return;}}
  flight.current=true;pending.current=null;setChecking(true);setChallenge(null);setNotice('게임 화면을 확인한 뒤 아이리스의 최종 확인창에서 선택해 주세요.');try{const result=await api.confirmLifeAction(value.nonce);if(result.state==='running')lastSentId.current=result.id;setNotice(result.state==='running'?'작업 요청을 보냈어요. 완료 여부를 확인 중이에요.':'작업을 취소했어요.');await refresh();}catch{setNotice('실행 결과를 확인하지 못했어요. 다시 누르지 말고 게임과 작업 기록을 확인해 주세요.');await refresh();}finally{flight.current=false;if(mounted.current)setChecking(false);}};
 const resetBatch=()=>{if(checking||flight.current||status?.blocked)return;stageRef.current=null;lastSentId.current=null;setStaged(null);setNotice('새 묶음은 최대 5회·날개 25개·새 준비/확인 시작 5분이에요. 다시 직접 준비해 주세요.');};
 const batchStopped=!!staged&&(!!staged.stopped||staged.expired||(staged.action==='crafting'&&!staged.ready));
 const current=status?.current;
 return <section aria-label="에르곤 작업 실행"><h3>1회 작업 실행</h3><p className="iris-caption">목표 {plan?.targetQuantity??'—'}개 계획 중 선택 품목을 한 번만 요청해요. 게임 화면의 실제 캐릭터는 마지막 확인창에서 직접 확인해 주세요.</p><p className="iris-caption">제작 묶음은 최대 5회·날개 25개. 5분 뒤에는 새 준비와 확인을 시작하지 않아요. 매 회 직접 확인하며 자동 재개하지 않아요.</p>
  {!api||!supported?<p role="status">{notice||'앱 실행 연결을 확인 중이에요.'}</p>:<>
   {status?.blocked&&<p role="alert">작업 중이거나 결과가 불명확한 요청이 있어 새 작업을 막았어요. 게임 화면과 아래 기록을 확인해 주세요.</p>}
   {notice&&<p role="status">{notice}</p>}
   {current&&<p>최근 작업: {current.displayName} · {current.state==='registered'?'가공 등록 확인 (생산 완료 아님)':current.state==='completed'?'완료 확인':current.state==='unknown'?'결과 미확정 · 재시도 금지':current.state==='running'?'결과 확인 중':'거절됨'}</p>}
   {!challenge?<><button type="button" className="iris-desktop-button" disabled={!plan||!characterId||!active||locked||checking||!!status?.blocked||batchStopped} onClick={()=>void prepare()}>1회 실행 준비</button>{staged&&staged.confirmedIds.length>0&&<p>{staged.ready?`남은 묶음: 최대 ${staged.stagedRuns}회 · 날개 최대 ${staged.maximumWings}개. 다음 실행은 다시 직접 준비해 주세요.`:staged.reason}</p>}</>:<div role="group" aria-label="에르곤 실행 확인"><p><strong>{challenge.displayName}</strong> · {challenge.action==='gathering'?'채집':challenge.action==='altering'?'가공 등록':'제작'} 1회</p><p>예상 날개 {challenge.expectedWings===null?'미확인':`${challenge.expectedWings}개`} · 최근 보유 {challenge.wings}개 · 가방 {challenge.owned??'수량 확인 불가'}개</p>{staged&&<p>{staged.ready?`이번 묶음 계획: 최대 ${staged.stagedRuns}회 · 날개 최대 ${staged.maximumWings}개. 매번 재조회와 직접 확인 후 진행해요.`:staged.reason}</p>}<p>생텀 선택: {challenge.accountLabel} / {challenge.characterLabel}</p><p className="iris-caption">실제 게임 캐릭터·재료는 마지막 창에서 다시 확인해 줘. 가공 등록은 생산 완료와 달라.</p><button type="button" className="iris-desktop-button" disabled={checking||!active||locked} onClick={()=>void confirm()}>게임 화면 확인 후 1회 실행</button><button type="button" className="iris-desktop-button" disabled={checking} onClick={()=>void cancel()}>준비 취소</button></div>}
   {staged&&<div className="grid gap-2">{!batchStopped&&<button type="button" className="iris-desktop-button" disabled={!active} onClick={stopNext}>다음 작업 중지</button>}{batchStopped&&<><p role="status">{staged.reason}</p><button type="button" className="iris-desktop-button" disabled={!active||locked||checking||!!status?.blocked} onClick={resetBatch}>새 묶음 준비</button></>}</div>}
   {records.length>0&&<section aria-label="보호 작업 기록"><h4>보호 작업 기록</h4>{records.slice(-10).reverse().map(row=><p key={row.requestId}>{row.displayName} · {row.state==='registered'?'등록':row.state==='completed'?'완료':row.state==='unknown'||row.state==='inflight'?'확인 필요':'거절'}</p>)}</section>}
  </>}
 </section>;
}
