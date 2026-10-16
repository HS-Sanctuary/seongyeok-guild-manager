'use client';
import {useEffect,useRef} from 'react';
import type {ErgonReadKind} from '@/lib/irisErgonRead';

/** One serial idle refresh. Execution/receipt observation owns its independent cadence. */
export function useErgonPolling({enabled,scope,kinds,refresh,refreshOverview}:{enabled:boolean;scope:string;kinds:ErgonReadKind[];refresh:(kind:ErgonReadKind)=>Promise<void>;refreshOverview:()=>Promise<void>}){
 const tail=useRef<Promise<void>>(Promise.resolve());
 const signature=JSON.stringify([...new Set(kinds)]);
 useEffect(()=>{
  let live=true,queued=false;
  const allowed=()=>live&&enabled&&document.visibilityState==='visible';
  const run=()=>{
   if(!allowed()||queued)return;
   queued=true;
   tail.current=tail.current.catch(()=>{}).then(async()=>{
    if(!allowed())return;
    for(const kind of JSON.parse(signature) as ErgonReadKind[]){if(!allowed())return;await refresh(kind);}
    if(allowed())await refreshOverview();
   }).finally(()=>{queued=false;});
  };
  run();
  const timer=setInterval(run,15000);
  document.addEventListener('visibilitychange',run);
  return()=>{live=false;clearInterval(timer);document.removeEventListener('visibilitychange',run);};
 },[enabled,scope,signature,refresh,refreshOverview]);
}
