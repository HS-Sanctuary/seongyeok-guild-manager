'use client';
import {useEffect,useRef,useState} from 'react';
import type {DesktopAccount} from '@/lib/irisDesktopTransport';
import {DesktopLogin} from './DesktopLogin';
export function DesktopAccountPanel({account,remembered,busy,onSwitch,onLogout,onLogin}:{account:DesktopAccount;remembered:DesktopAccount[];busy:boolean;onSwitch(id:string):Promise<void>;onLogout():Promise<void>;onLogin(nickname:string,code:string,keep:boolean):Promise<void>}) {
  const [open,setOpen]=useState(false),[adding,setAdding]=useState(false);const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!open)return;
    const close=(e:PointerEvent)=>{if(root.current&&!root.current.contains(e.target as Node)){setOpen(false);setAdding(false);}};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);setAdding(false);trigger.current?.focus();}};
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
  },[open]);
  return <div ref={root} className="relative min-w-0"><button ref={trigger} type="button" className="iris-desktop-button" aria-expanded={open} aria-controls="iris-account-panel" onClick={()=>setOpen(!open)}>{account.nickname} · 계정</button>
    {open&&<section id="iris-account-panel" aria-label="계정 관리" className="absolute right-0 top-full z-20 mt-3 w-[min(20rem,80vw)] max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 space-y-3 shadow-lg">
      <p>한 계정씩 전환해요. 이전 계정의 미저장 변경은 보관돼요.</p>
      {remembered.map(a=><button type="button" key={a.id} className="iris-desktop-button w-full" disabled={busy||account.id===a.id} onClick={async()=>{await onSwitch(a.id);setOpen(false);}}>{a.nickname}{a.id===account.id?' · 사용 중':''}</button>)}
      <button type="button" className="iris-desktop-button" disabled={busy} onClick={()=>setAdding(!adding)}>다른 계정 추가</button>
      <button type="button" className="iris-desktop-button" disabled={busy} onClick={async()=>{await onLogout();setOpen(false);}}>로그아웃 · 변경 보관</button>
      {adding&&<DesktopLogin busy={busy} onLogin={async(...args)=>{await onLogin(...args);setOpen(false);setAdding(false);}}/>}
    </section>}
  </div>;
}
