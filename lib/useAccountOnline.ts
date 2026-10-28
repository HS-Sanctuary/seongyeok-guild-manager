'use client';
import {useEffect,useState} from 'react';
import {onlineAccountIds,parseOnlineSnapshot,type OnlineSnapshot} from '@/lib/accountOnline';
export function useAccountOnline(viewerId:string|null){
 const [state,setState]=useState<{owner:string|null;mode:'loading'|'legacy'|'unavailable'|'ready';snapshot:OnlineSnapshot|null;receivedAt:number}>({owner:null,mode:'loading',snapshot:null,receivedAt:0});
 const [now,setNow]=useState(()=>performance.now());
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let active=true,busy=false,disabled=false,request:AbortController|null=null,nextRead=0;

  async function read(){
   if(!active||!viewerId||busy||disabled||performance.now()<nextRead)return;busy=true;nextRead=performance.now()+60_000;request=new AbortController();
   const timeout=setTimeout(()=>request?.abort(),10_000);
   try{
    const response=await fetch('/api/account/online',{credentials:'same-origin',cache:'no-store',signal:request.signal});
    if(!response.ok)throw Error();
    const value=await response.json();
    if(!active)return;
    if(value?.enabled===false){disabled=true;setState({owner:viewerId,mode:'legacy',snapshot:null,receivedAt:0});return;}
    const snapshot=parseOnlineSnapshot(value);if(snapshot.viewerId!==viewerId)throw Error();
    setNow(performance.now());setState({owner:viewerId,mode:'ready',snapshot,receivedAt:performance.now()});
   }catch{if(active)setState({owner:viewerId,mode:'unavailable',snapshot:null,receivedAt:0});}
   finally{clearTimeout(timeout);busy=false;}
  }
  void read();
  const tick=setInterval(()=>{setNow(performance.now());if(document.visibilityState==='visible')void read();},60_000);
  const changed=()=>{active=false;request?.abort();setState({owner:null,mode:'loading',snapshot:null,receivedAt:0});setRevision(value=>value+1);};
  const resume=()=>{setNow(performance.now());if(document.visibilityState==='visible')void read();};
  window.addEventListener('sanctum_account_changed',changed);window.addEventListener('online',resume);window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume);
  return()=>{active=false;request?.abort();clearInterval(tick);window.removeEventListener('sanctum_account_changed',changed);window.removeEventListener('online',resume);window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume);};
 },[viewerId,revision]);
 return {mode:state.owner===viewerId?state.mode:'loading',ids:onlineAccountIds(state.owner===viewerId?state.snapshot:null,state.snapshot?Date.parse(state.snapshot.observedAt)+Math.max(0,now-state.receivedAt):0)};
}
