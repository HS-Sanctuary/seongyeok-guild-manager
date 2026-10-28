'use client';
import {useEffect} from 'react';
import {createOnlineReporter} from '@/lib/accountOnline';

export default function AccountOnlineReporter({accountId}:{accountId:string|null}){
 useEffect(()=>{
  const reporter=createOnlineReporter(async(command,signal)=>{
   const response=await fetch('/api/account/online',{method:'POST',credentials:'same-origin',cache:'no-store',keepalive:command.action==='leave',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify(command)});
   const value=await response.json().catch(()=>null);
   if(response.status===503&&value?.code==='online-disabled')return {enabled:false};
   if(!response.ok)throw Object.assign(Error('연결을 확인하지 못했어요.'),{status:response.status});
   if(value?.accountId!==command.expectedAccountId)throw Object.assign(Error('계정이 바뀌었어요.'),{status:409});
   return {enabled:true};
  });
  reporter.setAccount(accountId);void reporter.tick();
  const wake=()=>{void reporter.tick();};
  const changed=()=>{reporter.stop();reporter.setAccount(accountId);void reporter.tick();};
  const storage=(event:StorageEvent)=>{if(event.key==='nexus_user'||event.key==='sanctum_active_account_id')changed();};
  const pagehide=()=>reporter.stop();
  const pageshow=()=>{reporter.setAccount(accountId);wake();};
  const timer=window.setInterval(wake,15_000);
  window.addEventListener('online',wake);window.addEventListener('focus',wake);window.addEventListener('pagehide',pagehide);window.addEventListener('pageshow',pageshow);
  window.addEventListener('sanctum_account_changed',changed);window.addEventListener('storage',storage);
  return()=>{clearInterval(timer);reporter.stop();window.removeEventListener('online',wake);window.removeEventListener('focus',wake);window.removeEventListener('pagehide',pagehide);window.removeEventListener('pageshow',pageshow);window.removeEventListener('sanctum_account_changed',changed);window.removeEventListener('storage',storage);};
 },[accountId]);
 return null;
}
