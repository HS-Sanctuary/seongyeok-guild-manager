'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createHomeChecklistAutosave,type HomeCharacter} from '@/lib/homeChecklistAutosave';
import {memberMutationOrThrow} from '@/lib/memberMutationClient';
type Queue=ReturnType<typeof createHomeChecklistAutosave>;
export function useHomeChecklistAutosave(account:{id:string;nickname:string}|null,characters:HomeCharacter[],catalog:Parameters<Queue['edit']>[3],onSaved:(row:HomeCharacter)=>void){
  const [record,setRecord]=useState<{scope:string;queue:Queue}|null>(null),[state,setState]=useState({pending:0,saving:false,error:'',dueAt:null as number|null}),[clock,setClock]=useState(0),[leaving,setLeaving]=useState(false),[message,setMessage]=useState(''),[confirmed,setConfirmed]=useState(false);
  const id=account?.id??'',nickname=account?.nickname??'',catalogRef=useRef(catalog),savedRef=useRef(onSaved),accountChanging=useRef(false);
  useEffect(()=>{catalogRef.current=catalog;savedRef.current=onSaved;},[catalog,onSaved]);
  useEffect(()=>{if(!id||!nickname)return;let live=true,navigating=false,confirmationTimer:ReturnType<typeof setTimeout>|undefined;const queue=createHomeChecklistAutosave({account:{id,nickname},save:async(row,payload)=>{const data=await memberMutationOrThrow({table:'characters',action:'update',filter:{column:'nickname',value:row.nickname},payload},(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(15000)}));if(!Array.isArray(data)||data.length!==1)throw Error('저장 결과를 확인하지 못했어요. 변경은 유지했어요.');return data[0] as HomeCharacter;},onSaved:row=>{if(live){savedRef.current(row);setConfirmed(true);clearTimeout(confirmationTimer);confirmationTimer=setTimeout(()=>{if(live)setConfirmed(false);},2500);}}});
    const publish=()=>{const next=queue.state();queueMicrotask(()=>{if(live){setState(next);setClock(Date.now());}});};const unsubscribe=queue.subscribe(publish);queueMicrotask(()=>{if(live){setRecord({scope:id,queue});setMessage('');publish();}});
    const pending=()=>queue.state().pending||queue.state().saving;
    const flush=async()=>{if(navigating||accountChanging.current)throw Error('저장을 마치는 중이에요.');navigating=true;if(live)setLeaving(true);try{await queue.flush(catalogRef.current);}catch(error){if(live)setLeaving(false);throw error;}finally{navigating=false;}};
    const abortAccount=()=>{accountChanging.current=false;if(live)setLeaving(false);};
    const beforeAccount=(event:Event)=>{const detail=(event as CustomEvent<{waitUntil(p:Promise<unknown>):void}>).detail;if(!detail?.waitUntil)return;accountChanging.current=true;if(live)setLeaving(true);detail.waitUntil(queue.flush(catalogRef.current));};
    const unload=(event:BeforeUnloadEvent)=>{if(pending()){event.preventDefault();event.returnValue='';}};
    const click=(event:MouseEvent)=>{if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const anchor=(event.target as Element).closest?.('a[href]') as HTMLAnchorElement|null;if(!anchor||anchor.download||anchor.target==='_blank'||!pending())return;const url=new URL(anchor.href,location.href);if(!['http:','https:'].includes(url.protocol)||url.href===location.href||(url.pathname===location.pathname&&url.search===location.search&&url.hash))return;event.preventDefault();event.stopPropagation();void flush().then(()=>{if(live)location.assign(url.href);}).catch(()=>{/* Queue error stays visible. */});};
    const currentUrl=location.href,pop=(event:PopStateEvent)=>{if(!pending())return;const destination=location.href;event.stopImmediatePropagation();history.pushState(history.state,'',currentUrl);void flush().then(()=>{if(live)location.assign(destination);}).catch(()=>{});};
    accountChanging.current=false;
    const timer=setInterval(()=>{if(pending())setClock(Date.now());},1000);window.addEventListener('beforeunload',unload);window.addEventListener('sanctum_before_account_change',beforeAccount);window.addEventListener('sanctum_account_change_aborted',abortAccount);window.addEventListener('popstate',pop,true);document.addEventListener('click',click,true);
    return()=>{live=false;queue.dispose();unsubscribe();clearInterval(timer);clearTimeout(confirmationTimer);window.removeEventListener('beforeunload',unload);window.removeEventListener('sanctum_before_account_change',beforeAccount);window.removeEventListener('sanctum_account_change_aborted',abortAccount);window.removeEventListener('popstate',pop,true);document.removeEventListener('click',click,true);};
  },[id,nickname]);
  const active=record?.scope===id?record.queue:null;
  const toggle=useCallback((row:HomeCharacter,item:Parameters<Queue['edit']>[1],kind:Parameters<Queue['edit']>[2])=>{if(!active||leaving||accountChanging.current)return;try{active.edit(row,item,kind,catalogRef.current);setMessage('');}catch(error){setMessage(error instanceof Error?error.message:'변경을 준비하지 못했어요.');}},[active,leaving]);
  const flush=useCallback(async()=>{if(active)await active.flush(catalogRef.current);},[active]);
  const navigate=useCallback(async(go:()=>void)=>{if(leaving||accountChanging.current)return;setLeaving(true);try{await flush();go();}catch{setLeaving(false);/* Preserve view and error. */}},[flush,leaving]);
  return {characters:active?characters.map(row=>active.overlay(row,catalog)):characters,confirmed,state:active?state:{pending:0,saving:false,error:'',dueAt:null},remaining:state.dueAt===null?0:Math.max(0,Math.ceil((state.dueAt-clock)/1000)),locked:!active||leaving,message,toggle,flush,navigate};
}
