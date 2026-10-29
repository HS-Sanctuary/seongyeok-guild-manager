'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {manualWoodOperationApplied,parseManualWoodView,type ManualWoodIdentity,type ManualWoodView,type ManualWoodWrite} from '@/lib/irisErgonManualWood';

export type ManualWoodApi={loadErgonManualWood:(scope:ManualWoodIdentity['scope'],goalId:string,sourcePlanId:string)=>Promise<unknown>;saveErgonManualWood:(scope:ManualWoodIdentity['scope'],value:ManualWoodWrite)=>Promise<unknown>};
type Props={identity:ManualWoodIdentity;api?:ManualWoodApi;accountLabel:string;characterLabel:string;active:boolean;locked:boolean;getContextVersion:()=>number;onDirtyChange:(dirty:boolean)=>void};
const timestamp=(n:number)=>new Date(n).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})+' KST';
/** Manual receipts are a separate native audit domain. Never grant game execution. */
export function DesktopErgonManualWood({identity,api,accountLabel,characterLabel,active,locked,getContextVersion,onDirtyChange}:Props){
 const [view,setView]=useState<ManualWoodView|null>(null),[input,setInput]=useState(''),[reason,setReason]=useState(''),[editing,setEditing]=useState<string|null>(null),[busy,setBusy]=useState(false),[pending,setPending]=useState<ManualWoodWrite|null>(null),[message,setMessage]=useState('');
 const generation=useRef(0),flight=useRef(false),dirty=useRef(false),latest=useRef({active,locked,getContextVersion,onDirtyChange});
 useLayoutEffect(()=>{latest.current={active,locked,getContextVersion,onDirtyChange};});
 const protect=useCallback((value:boolean)=>{dirty.current=value;latest.current.onDirtyChange(value);},[]);
 useLayoutEffect(()=>{const token=generation;return()=>{token.current++;};},[identity.scope.environment,identity.scope.accountId,identity.scope.characterId,identity.goalId,identity.sourcePlanId]);
 const read=useCallback(async()=>{
  if(!api||!latest.current.active||flight.current||dirty.current)return;
  const token=++generation.current,epoch=latest.current.getContextVersion();flight.current=true;setBusy(true);
  try{const raw=await api.loadErgonManualWood(identity.scope,identity.goalId,identity.sourcePlanId);if(token!==generation.current)return;if(epoch!==latest.current.getContextVersion())throw Error('context');setView(parseManualWoodView(raw,identity));setMessage('');}
  catch{if(token===generation.current){setView(null);setMessage('수동 확인 기록을 읽지 못했어요. 최신 IRIS와 기록 상태를 확인해 주세요.');}}
  finally{flight.current=false;if(token===generation.current)setBusy(false);}
 },[api,identity]);
 useEffect(()=>{let current=true;queueMicrotask(()=>{if(current)void read();});return()=>{current=false;};},[read,active]);
 const healthy=!!api&&active&&!locked&&view?.health==='ok'&&view.lifecycle==='active';
 const run=async(checkOnly:boolean)=>{
  if(!api||flight.current||!active||locked)return;
  let operation=pending;
  if(!operation){
   if(checkOnly||!healthy||!/^\d+$/.test(input)||!Number.isSafeInteger(Number(input))||Number(input)>5000000||editing&&!reason.trim())return;
   const previous=editing?view.receipts.find(r=>r.receiptId===editing)?.confirmations.at(-1):null;
   if(editing&&!previous)return;
   operation={revision:view.revision,operationId:crypto.randomUUID(),goalId:identity.goalId,sourcePlanId:identity.sourcePlanId,action:'altering',displayName:'목재',targetQuantity:100,receiptId:editing??crypto.randomUUID(),quantity:Number(input),...(previous?{supersedesEventId:previous.eventId,reason:reason.trim()}: {})};
   setPending(operation);
  }
  protect(true);flight.current=true;setBusy(true);setMessage('저장 상태 확인 중');
  const token=++generation.current,epoch=latest.current.getContextVersion(),fixed=operation;
  const current=()=>token===generation.current&&epoch===latest.current.getContextVersion()&&latest.current.active;
  try{
   if(!checkOnly){const result=await api.saveErgonManualWood(identity.scope,fixed);if(result&&typeof result==='object'&&'status' in result&&result.status==='not-applied'&&'view' in result){if(!current())throw Error('context');setView(parseManualWoodView(result.view,identity));setPending(null);setMessage('수량을 저장하지 않았어요. 입력을 확인하거나 취소해 주세요.');return;}}
   if(!current())throw Error('context');
   const actual=parseManualWoodView(await api.loadErgonManualWood(identity.scope,identity.goalId,identity.sourcePlanId),identity);
   if(!current())throw Error('context');
   if(!manualWoodOperationApplied(actual,fixed))throw Error('unconfirmed');
   setView(actual);setPending(null);setInput('');setReason('');setEditing(null);setMessage('사용자 확인 수량을 저장했어요.');protect(false);
  }catch{if(token===generation.current)setMessage('저장 상태 확인 필요 · 입력과 요청을 보관하고 있어요.');}
  finally{flight.current=false;if(token===generation.current)setBusy(false);}
 };
 const disabled=!healthy||busy||!!pending;
 return <section className="iris-ergon-manual-wood" aria-label="가공 수령량 사용자 확인">
  <h4>목재 추가100 · 수령량 확인</h4>
  <p className="iris-caption">{accountLabel||'선택 계정'} · {characterLabel||'선택 캐릭터'} · 사용자 직접 확인</p>
  <p role="status">{view?.confirmedQuantity===null||!view?'추가 확보량 미확인':`목표 100개 · 확인 ${view.confirmedQuantity}개 · 남은 ${view.remainingQuantity}개`}</p>
  <p className="iris-caption">게임에서 이번에 받은 추가 수량이에요. 가방 총량이나 시작 재고를 넣지 마세요. 자동 실행에는 사용하지 않아요.</p>
  {!api?<p className="iris-caption">수동 확인 저장 연결 준비 중이에요.</p>:view&&view.health!=='ok'?<p role="status">이전 작업이나 저장 기록을 먼저 확인해야 해요.</p>:view&&view.lifecycle!=='active'?<p role="status">보류·종료된 목표는 수량을 변경하지 않아요.</p>:null}
  <label>{editing?'정정할 추가 확보량':'이번에 추가 확보한 목재 수량'}<input aria-label="추가 확보량" type="number" min="0" max="5000000" step="1" value={input} disabled={disabled} onChange={e=>{setInput(e.target.value);protect(e.target.value!==''||reason!==''||!!editing);}}/></label>
  {editing&&<label>정정 이유<input aria-label="정정 이유" maxLength={400} value={reason} disabled={disabled} onChange={e=>{setReason(e.target.value);protect(true);}}/></label>}
  <div className="iris-ergon-manual-actions">
   <button type="button" className="iris-desktop-button" disabled={!healthy||busy||!pending&&(!/^\d+$/.test(input)||Number(input)>5000000||!!editing&&!reason.trim())} onClick={()=>void run(false)}>{pending?'같은 요청 다시 확인':'수량 저장'}</button>
   {pending&&<button type="button" className="iris-desktop-button" disabled={busy||!active||locked} onClick={()=>void run(true)}>저장 상태 확인</button>}
   {!pending&&<button type="button" className="iris-desktop-button" disabled={busy||!active} onClick={()=>{setInput('');setReason('');setEditing(null);protect(false);setMessage('');void read();}}>입력 취소·기록 새로고침</button>}
  </div>
  {message&&<p role="status">{message}</p>}
  {view&&view.receipts.length>0&&<details><summary>이전 확인·정정 이력</summary><ul>{view.receipts.map(row=><li key={row.receiptId}><p>추가 확보 {row.confirmations.at(-1)!.quantity}개 · 사용자 직접 확인</p><button type="button" className="iris-desktop-button" disabled={disabled||input!==""||reason!==""||editing!==null} onClick={()=>{setEditing(row.receiptId);setInput('');setReason('');protect(true);}}>이 수량 정정</button><ul>{row.confirmations.map(event=><li key={event.eventId}>{event.quantity}개 · {timestamp(event.confirmedAt)}{event.reason&&` · 정정: ${event.reason}`}</li>)}</ul></li>)}</ul></details>}
 </section>;
}
