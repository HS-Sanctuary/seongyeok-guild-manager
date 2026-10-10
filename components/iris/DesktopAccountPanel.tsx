'use client';
import {useRef,useState} from 'react';
import type {DesktopAccount} from '@/lib/irisDesktopTransport';
import {DesktopLogin} from './DesktopLogin';
import './focus-dialog.css';
type AccountAction=Promise<void|boolean>;
export function DesktopAccountPanel({account,remembered,busy,onSwitch,onLogout,onLogin,onClose}:{account:DesktopAccount;remembered:DesktopAccount[];busy:boolean;onSwitch(id:string):AccountAction;onLogout():AccountAction;onLogin(nickname:string,code:string,keep:boolean):AccountAction;onClose?():void}) {
  const [adding,setAdding]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState('');
  const submitting=useRef(false),locked=busy||pending;
  async function act(operation:()=>AccountAction){
    if(busy||submitting.current)return;
    submitting.current=true;setPending(true);setError('');
    try{
      if(await operation()===false){setError('계정 작업을 완료하지 못했어요. 다시 확인해 주세요.');return;}
      setAdding(false);onClose?.();
    }catch{setError('계정 작업을 완료하지 못했어요. 다시 확인해 주세요.');}
    finally{submitting.current=false;setPending(false);}
  }
  const choices=remembered.some(a=>a.id===account.id)?remembered:[account,...remembered];
  return <div className="iris-account-management iris-account-direct" aria-busy={locked}>
    <p>{account.nickname} · 계정</p>
    <section aria-label="계정 전환 목록" className="iris-account-options">
      {choices.map(a=><button type="button" key={a.id} className="iris-desktop-button" disabled={locked||account.id===a.id} onClick={()=>void act(()=>onSwitch(a.id))}>{a.nickname}{a.id===account.id?' · 사용 중':''}</button>)}
      {!choices.some(a=>a.id!==account.id)&&<p className="iris-caption">다른 계정 로그인으로 전환할 계정을 추가해 주세요.</p>}
    </section>
    <div className="iris-account-actions">
      <button type="button" className="iris-desktop-button" disabled={locked} aria-expanded={adding} aria-controls="iris-account-login" onClick={()=>setAdding(!adding)}>다른 계정 로그인</button>
      <button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>void act(onLogout)}>로그아웃</button>
    </div>
    <p className="iris-caption">한 계정씩 전환해요. 이전 계정의 미저장 변경은 보관돼요.</p>
    {error&&<p role="alert" className="iris-account-error">{error}</p>}
    {adding&&<section id="iris-account-login" aria-label="다른 계정 로그인"><DesktopLogin busy={locked} onLogin={async(...args)=>{await act(()=>onLogin(...args));}}/></section>}
  </div>;
}
