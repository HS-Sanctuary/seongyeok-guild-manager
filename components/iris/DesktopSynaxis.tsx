'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {DesktopAccount} from '@/lib/irisDesktopTransport';
import type {SynaxisCreate,SynaxisData} from '@/lib/irisSynaxis';
import {createIrisSynaxisTransport,readSynaxisReceipt,writeSynaxisReceipt,type SynaxisReceipt} from '@/lib/irisSynaxisTransport';
import './desktop-synaxis.css';
const defaultTransport=createIrisSynaxisTransport();
const kstToday=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
export function DesktopSynaxis({account,active,locked,selectedId,transport=defaultTransport,initialData,onBusyChange}:{account:DesktopAccount;active:boolean;locked:boolean;selectedId:string|null;transport?:ReturnType<typeof createIrisSynaxisTransport>;initialData?:SynaxisData;onBusyChange?(busy:boolean):void}){
  const [data,setData]=useState<SynaxisData|null>(initialData??null),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [mode,setMode]=useState<'party'|'bus'>('party'),[selection,setSelection]=useState({contentId:initialData?.options[0]?.id??'',difficulty:initialData?.options[0]?.difficulties[0]?.name??''});
  const {contentId,difficulty}=selection;
  const [date,setDate]=useState(kstToday),[start,setStart]=useState('20:00'),[end,setEnd]=useState('23:59'),[nextDay,setNextDay]=useState(false),[memo,setMemo]=useState('성역 파티 모집');
  const [members,setMembers]=useState<Record<string,boolean>>({}),[confirmation,setConfirmation]=useState<SynaxisCreate|null>(null),[receipt,setReceipt]=useState<SynaxisReceipt|null>(null),[receiptReady,setReceiptReady]=useState(false);
  const live=useRef(false),loaded=useRef(!!initialData),loadEpoch=useRef(0),submitting=useRef(false);
  useEffect(()=>{live.current=true;queueMicrotask(()=>{if(live.current){setReceipt(readSynaxisReceipt(localStorage,account.id));setReceiptReady(true);}});return()=>{live.current=false;};},[account.id]);
  useEffect(()=>()=>{onBusyChange?.(false);},[onBusyChange]);
  const refresh=useCallback(async()=>{
    if(submitting.current)return;const epoch=++loadEpoch.current;setLoading(true);setError('');setConfirmation(null);
    try{const next=await transport.load(account.id);if(!live.current||loadEpoch.current!==epoch)return;setData(next);loaded.current=true;
      setSelection(current=>{const option=next.options.find(o=>o.id===current.contentId)??next.options[0];return {contentId:option?.id??'',difficulty:option?.difficulties.find(d=>d.name===current.difficulty)?.name??option?.difficulties[0]?.name??''};});
      setMembers(current=>{const own=Object.fromEntries(Object.entries(current).filter(([id])=>next.characters.some(c=>c.id===id)));return Object.keys(own).length?own:selectedId&&next.characters.some(c=>c.id===selectedId)?{[selectedId]:false}:{};});
    }catch(e){if(live.current&&loadEpoch.current===epoch){setData(null);setError(e instanceof Error?e.message:'파티 기준을 확인해주세요.');}}
    finally{if(live.current&&loadEpoch.current===epoch)setLoading(false);}
  },[account.id,selectedId,transport]);
  useEffect(()=>{if(active&&!locked&&!loaded.current){loaded.current=true;void refresh();}},[active,locked,refresh]);
  const option=data?.options.find(o=>o.id===contentId),standard=option?.difficulties.find(d=>d.name===difficulty);
  const disabled=locked||busy||loading||!receiptReady||!!receipt;
  const selected=data?.characters.filter(c=>Object.hasOwn(members,c.id))??[];
  const clearReceipt=()=>{try{writeSynaxisReceipt(localStorage,account.id,null);setReceipt(null);setConfirmation(null);setError('');}catch{setError('생성 결과 기록을 정리하지 못했어요. 앱 저장 공간을 확인해주세요.');}};
  const review=()=>{if(disabled||!option||!standard||!selected.length||mode==='party'&&selected.length!==1)return;
    setConfirmation({accountId:account.id,mode,contentId,difficulty,partyDate:date,timeStart:start,timeEnd:end+(nextDay?' (+1일)':''),memo,members:selected.map(c=>({id:c.id,allowRepeat:mode==='bus'&&members[c.id]}))});setError('');};
  const submit=async()=>{
    if(!confirmation||disabled||submitting.current)return;
    // Persist uncertainty BEFORE the POST. Restart never silently offers the same submission again.
    const marker:SynaxisReceipt={kind:'unknown',at:Date.now()};
    try{writeSynaxisReceipt(localStorage,account.id,marker);}catch{setError('생성 결과를 보관할 수 없어 요청하지 않았어요. 앱 저장 공간을 확인해주세요.');return;}
    submitting.current=true;setBusy(true);onBusyChange?.(true);setReceipt(marker);setError('');
    try{const result=await transport.create(confirmation);
      if(result.kind==='created'){const saved:SynaxisReceipt={kind:'created',at:Date.now(),partyId:result.partyId};try{writeSynaxisReceipt(localStorage,account.id,saved);}catch{/* Keep the previous unknown marker if storage fails. */}if(live.current){setReceipt(saved);setConfirmation(null);}}
      else if(result.kind==='rejected'){try{writeSynaxisReceipt(localStorage,account.id,null);}catch{/* Never erase uncertainty in memory if persistence failed. */}if(live.current){setReceipt(readSynaxisReceipt(localStorage,account.id));setError(result.message);setConfirmation(null);}}
      else if(live.current){setError(result.message);setConfirmation(null);}
    }catch{if(live.current){setConfirmation(null);setError('생성 결과가 불명확해요. 생텀 파티 목록을 먼저 확인해주세요.');}}
    finally{submitting.current=false;if(live.current){setBusy(false);onBusyChange?.(false);}}
  };
  return <section className="iris-synaxis" aria-label="시낙시스 생성">
    <header><strong>시낙시스</strong><a href="/party" target="_blank" rel="noopener noreferrer">생텀 파티 목록 ↗</a></header>
    <p className="iris-caption">생성은 확인 후 한 번 요청해요. 15초 자동 저장 대상이 아니에요. 가입·출발·회차 운영은 생텀 파티 목록에서 이어가세요.</p>
    {busy&&<p role="status">생성 중이에요. 결과를 기다려주세요.</p>}
    {!busy&&receipt&&<div className="iris-synaxis-result" role="status"><strong>{receipt.kind==='created'?`생성 완료 · 파티 #${receipt.partyId}`:'생성 여부 확인 필요'}</strong><p>{receipt.kind==='created'?'생텀 파티 목록에 반영됐어요.':'다시 보내지 않았어요. 먼저 생텀 파티 목록에서 생성 여부를 확인해주세요.'}</p><button type="button" className="iris-desktop-button" disabled={locked} onClick={clearReceipt}>{receipt.kind==='created'?'새 파티 준비':'목록 확인했어요'}</button></div>}
    {error&&<p role="alert">{error}</p>}
    <button type="button" className="iris-desktop-button" disabled={locked||busy||loading} onClick={()=>void refresh()}>{loading?'기준 불러오는 중':'기준 새로고침'}</button>
    {!data?<p>본인 캐릭터와 운영 컨텐츠 기준을 불러오면 생성할 수 있어요.</p>:<>
      <div className="iris-synaxis-modes"><button type="button" className="iris-desktop-button" aria-pressed={mode==='party'} disabled={disabled} onClick={()=>{setMode('party');setMembers(selected[0]?{[selected[0].id]:false}:{});setConfirmation(null);}}>일반 파티</button><button type="button" className="iris-desktop-button" aria-pressed={mode==='bus'} disabled={disabled||!data.canCreateBus} onClick={()=>{setMode('bus');setConfirmation(null);}}>길드버스</button></div>
      {!data.canCreateBus&&<p className="iris-caption">길드버스는 운영진만 만들 수 있어요.</p>}
      {!data.options.length?<p>활성 컨텐츠의 난이도·정원이 아직 등록되지 않았어요.</p>:<fieldset disabled={disabled||!!confirmation} className="iris-synaxis-form"><legend>{mode==='bus'?'길드버스 설정':'일반 파티 설정'}</legend>
        <label>컨텐츠<select value={contentId} onChange={e=>{const o=data.options.find(o=>o.id===e.target.value);setSelection({contentId:e.target.value,difficulty:o?.difficulties[0]?.name??''});}}>{data.options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <label>난이도<select value={difficulty} onChange={e=>setSelection(current=>({...current,difficulty:e.target.value}))}>{option?.difficulties.map(d=><option key={d.name} value={d.name}>{d.name} · {d.capacity}인</option>)}</select></label>
        <p className="iris-caption">{standard?`출전 ${standard.capacity}인 · 최소 전투력 ${standard.minCombatPower.toLocaleString()}`:'난이도를 다시 선택해주세요.'}{mode==='bus'?' · 같은 계정 캐릭터는 대기열로 등록돼요.':''}</p>
        <label>날짜<input type="date" min={kstToday()} value={date} onChange={e=>setDate(e.target.value)}/></label>
        <div className="iris-synaxis-times"><label>시작<input type="time" value={start} onChange={e=>setStart(e.target.value)}/></label><label>종료<input type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label></div>
        <label className="iris-synaxis-check"><input type="checkbox" checked={nextDay} onChange={e=>setNextDay(e.target.checked)}/>종료는 다음날</label>
        <label>공지 메모<textarea rows={3} maxLength={2000} value={memo} onChange={e=>setMemo(e.target.value)}/></label>
        <strong>내 참가 캐릭터 {selected.length}개</strong>
        {!data.characters.length&&<p>이 계정에 등록된 캐릭터가 없어요.</p>}
        {data.characters.map(c=><article className="iris-synaxis-character" key={c.id}><label><input type={mode==='party'?'radio':'checkbox'} name="iris-synaxis-member" checked={Object.hasOwn(members,c.id)} onChange={e=>setMembers(current=>{if(mode==='party')return {[c.id]:false};const next={...current};if(e.target.checked)next[c.id]=false;else delete next[c.id];return next;})}/><strong>{c.nickname}</strong></label><span>{c.job} · 전투력 {c.combatPower.toLocaleString()} · 마도저항 {c.magicResistance.toLocaleString()}</span><span>{c.completed.includes(contentId)?'크로노스 완료 기록 있음':'크로노스 미완료'}</span>{standard&&c.combatPower<standard.minCombatPower&&<span>최소 전투력 미달 · 모집 전 확인해주세요.</span>}{mode==='bus'&&Object.hasOwn(members,c.id)&&<label className="iris-synaxis-check"><input type="checkbox" checked={members[c.id]} onChange={e=>setMembers(current=>({...current,[c.id]:e.target.checked}))}/>반복 참여 가능</label>}</article>)}
      </fieldset>}
      {confirmation?<div className="iris-synaxis-confirm" role="region" aria-label="생성 확인"><strong>{mode==='bus'?'길드버스':'일반 파티'} 생성 확인</strong><p>{option?.name} · {confirmation.difficulty} · {standard?.capacity}인</p><p>{confirmation.partyDate} · {confirmation.timeStart} ~ {confirmation.timeEnd}</p><p>{selected.map(c=>c.nickname).join(', ')}</p><p>{confirmation.memo}</p><div><button type="button" className="iris-desktop-button" disabled={disabled} onClick={()=>setConfirmation(null)}>다시 수정</button><button type="button" className="iris-desktop-button" disabled={disabled} onClick={()=>void submit()}>생성 확정</button></div></div>:<button type="button" className="iris-desktop-button iris-synaxis-submit" disabled={disabled||!standard||!selected.length||!memo.trim()||!date||!start||!end||mode==='party'&&selected.length!==1} onClick={review}>생성 내용 확인</button>}
    </>}
  </section>;
}
