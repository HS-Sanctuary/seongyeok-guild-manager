'use client';
import {useEffect,useState} from 'react';
import {createAccountActivityReporter} from '@/lib/accountActivity';

// Both the web layout and IRIS use this input-driven boundary. It has no timer,
// no per-character writes and no independent identity stored in localStorage.
export default function AccountActivityReporter({accountId}:{accountId:string|null}){
 const [reporter]=useState(()=>createAccountActivityReporter(async(expectedAccountId,signal)=>{
  const response=await fetch('/api/account/activity',{method:'POST',credentials:'same-origin',cache:'no-store',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedAccountId})});
  const value=await response.json().catch(()=>null);
  if(!response.ok)throw Object.assign(Error('활동 기록을 저장하지 못했어요.'),{status:response.status,code:value?.code});
  if(value?.accountId!==expectedAccountId)throw Object.assign(Error('계정이 바뀌었어요.'),{status:409});
  if(!signal.aborted)window.dispatchEvent(new Event('sanctum_activity_recorded'));
  return {accountId:value.accountId};
 }));
 useEffect(()=>{
  const current=reporter;current.setAccount(accountId);
  let recheck=false;
  const active=()=>{if(document.visibilityState==='visible'&&document.hasFocus()){if(recheck){current.setAccount(accountId);recheck=false;}void current.report();}};
  const input=(event:Event)=>{if(event.isTrusted)active();};
  const invalidate=()=>current.setAccount(null);
  active();document.addEventListener('pointerdown',input,{passive:true});document.addEventListener('keydown',input);document.addEventListener('visibilitychange',active);window.addEventListener('focus',active);
  window.addEventListener('sanctum_account_changed',invalidate);
  // A different tab may replace the cookie; a fresh authenticated owner is needed.
  const storage=(event:StorageEvent)=>{if(event.key==='nexus_user'||event.key==='sanctum_active_account_id'){invalidate();recheck=true;}};window.addEventListener('storage',storage);
  return()=>{current.setAccount(null);document.removeEventListener('pointerdown',input);document.removeEventListener('keydown',input);document.removeEventListener('visibilitychange',active);window.removeEventListener('focus',active);window.removeEventListener('sanctum_account_changed',invalidate);window.removeEventListener('storage',storage);};
 },[accountId,reporter]);
 return null;
}
