'use client';
import {Suspense,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {DesktopAccount} from '@/lib/irisDesktopTransport';
import SynaxisSurface from '@/components/party/SynaxisSurface';
import {PartySurfaceContext,type PartyConfirmation} from '@/components/party/PartySurfaceContext';
import {createPartyActivity,scopedPartyRequest,type PartyActivityCounts} from '@/lib/partySurfacePolicy';
import {readSynaxisReceipt,writeSynaxisReceipt} from '@/lib/irisSynaxisTransport';
import {supabase} from '@/lib/supabase';
import {useIrisPartyDialogs} from './useIrisPartyDialogs';
import './desktop-synaxis-surface.css';

type Props={account:DesktopAccount;active:boolean;locked:boolean;onBusyChange?(busy:boolean):void;onActivityChange?(counts:PartyActivityCounts):void};
export function DesktopSynaxisSurface({account,active,locked,onBusyChange,onActivityChange}:Props){
  const current=useRef({accountId:account.id,active,locked});current.current={accountId:account.id,active,locked};
  const callbacks=useRef({onBusyChange,onActivityChange});callbacks.current={onBusyChange,onActivityChange};
  const alive=useRef(true),root=useRef<HTMLDivElement>(null);
  const tracker=useMemo(()=>createPartyActivity(),[account.id]);
  const [activity,setActivity]=useState<PartyActivityCounts>({party:0,bus:0}),[refreshToken,setRefreshToken]=useState(0);
  const [pending,setPending]=useState(false),[uncertain,setUncertain]=useState(false),[verified,setVerified]=useState(false),[connectionError,setConnectionError]=useState(false);
  const [confirmation,setConfirmation]=useState<PartyConfirmation|null>(null),[notice,setNotice]=useState('');
  const confirmResolver=useRef<((accepted:boolean)=>void)|null>(null);
  const closeConfirmation=useCallback((accepted=false)=>{
    const resolve=confirmResolver.current;confirmResolver.current=null;setConfirmation(null);resolve?.(accepted);
  },[]);
  const confirm=useCallback((options:PartyConfirmation)=>{
    if(!alive.current||!current.current.active||current.current.locked||confirmResolver.current)return Promise.resolve(false);
    setNotice('');return new Promise<boolean>(resolve=>{confirmResolver.current=resolve;setConfirmation(options);});
  },[]);
  const notify=useCallback((message:string)=>{if(alive.current&&current.current.active&&!current.current.locked)setNotice(message);},[]);
  useEffect(()=>{
    if(!active||locked)closeConfirmation();
    return()=>{const resolve=confirmResolver.current;confirmResolver.current=null;resolve?.(false);};
  },[account.id,active,locked,closeConfirmation]);
  const acknowledge=useCallback((kind:'party'|'bus',visibleIds?:string[])=>{
    tracker.acknowledge(kind,visibleIds);const counts=tracker.counts();
    setActivity(prev=>prev.party===counts.party&&prev.bus===counts.bus?prev:counts);
  },[tracker]);
  const onLoaded=useCallback(()=>setVerified(true),[]);
  useEffect(()=>{
    alive.current=true;setUncertain(Boolean(readSynaxisReceipt(localStorage,account.id)));
    return()=>{alive.current=false;callbacks.current.onBusyChange?.(false);callbacks.current.onActivityChange?.({party:0,bus:0});};
  },[account.id]);
  useEffect(()=>{callbacks.current.onActivityChange?.(activity);},[activity]);
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>|undefined,live=true;
    const channel=supabase.channel(`iris-synaxis-${account.id}`).on('postgres_changes',{event:'*',schema:'public',table:'parties'},event=>{
      if(!live)return;
      tracker.observe(event);setActivity(tracker.counts());
      clearTimeout(timer);timer=setTimeout(()=>{if(live)setRefreshToken(v=>v+1);},200);
    }).subscribe(status=>{
      if(!live)return;
      setConnectionError(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status));
      if(status==='SUBSCRIBED')setRefreshToken(v=>v+1);
    });
    return()=>{live=false;clearTimeout(timer);void supabase.removeChannel(channel);};
  },[account.id,tracker]);
  const request=useMemo(()=>scopedPartyRequest(account.id,()=>alive.current&&current.current.accountId===account.id&&current.current.active&&!current.current.locked&&!document.hidden,
    {getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v),removeItem:k=>localStorage.removeItem(k)},(...args)=>fetch(...args),busy=>{
      if(alive.current){setPending(busy);if(!busy){setUncertain(Boolean(readSynaxisReceipt(localStorage,account.id)));setVerified(false);}}
      callbacks.current.onBusyChange?.(busy);
    }),[account.id]);
  const context=useMemo(()=>({account,active,locked:locked||pending,request,refreshToken,activity,
    acknowledge,onLoaded,confirm,notify,
  }),[account,active,locked,pending,request,refreshToken,activity,acknowledge,onLoaded,confirm,notify]);
  useIrisPartyDialogs(root,active&&!locked);
  return <div ref={root} className="iris-synaxis-host">
    {uncertain&&<section className="iris-synaxis-recovery" role="alert"><p>이전 요청 결과를 확인해야 해요. 아래 최신 목록에서 반영 여부를 확인해주세요. 자동으로 다시 보내지 않아요.</p><button type="button" className="iris-desktop-button" disabled={pending||locked||!active||!verified} onClick={()=>{if(window.confirm('최신 목록에서 이전 요청의 반영 여부를 확인했나요? 같은 요청을 중복 실행하지 않도록 주의해주세요.')){try{writeSynaxisReceipt(localStorage,account.id,null);setUncertain(false);}catch{setUncertain(true);}}}}>목록 확인 완료</button></section>}
    {connectionError&&<p role="status" className="iris-caption">실시간 연결을 확인하지 못했어요. 다시 조회로 최신 목록을 확인할 수 있어요.</p>}
    {notice&&<section className="iris-party-notice" role="status"><p>{notice}</p><button type="button" className="iris-desktop-button iris-icon-button" aria-label="파티 안내 닫기" onClick={()=>setNotice('')}>×</button></section>}
    <PartySurfaceContext.Provider value={context}><Suspense fallback={<p role="status">시낙시스 불러오는 중…</p>}><SynaxisSurface/></Suspense></PartySurfaceContext.Provider>
    {active&&!locked&&confirmation&&<div className="fixed inset-0 z-[100001] iris-party-confirm-backdrop" onClick={event=>{if(event.target===event.currentTarget)closeConfirmation();}}>
      <section className="iris-party-confirm" role="dialog" aria-modal="true" aria-labelledby="iris-party-confirm-title" aria-describedby="iris-party-confirm-message">
        <h2 id="iris-party-confirm-title">{confirmation.title}</h2><p id="iris-party-confirm-message">{confirmation.message}</p>
        <div><button type="button" className="iris-desktop-button" onClick={()=>closeConfirmation()}>취소</button><button type="button" className="iris-desktop-button iris-party-confirm-submit" onClick={()=>closeConfirmation(true)}>{confirmation.confirmLabel}</button></div>
      </section>
    </div>}
  </div>;
}
