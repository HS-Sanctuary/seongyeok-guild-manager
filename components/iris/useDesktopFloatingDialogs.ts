'use client';
import {useEffect,useRef} from 'react';
import type {FloatingCommand,FloatingState} from '@/lib/irisFloating';
import './floating-dialogs.css';

/** Adapt both shared desktop dialogs and existing party portals to the native hit region. */
export function useDesktopFloatingDialogs(state:FloatingState|null,command:(c:FloatingCommand)=>Promise<void>){
 const current=useRef(state);useEffect(()=>{current.current=state;},[state]);
 const floating=state?.mode==='floating',supported=typeof state?.dialogOpen==='boolean';
 useEffect(()=>{
  if(!floating)return;
  const html=document.documentElement,marked=new Set<HTMLElement>();let desired:boolean|null=null;
  const host=window as Window&{__irisFloatingDialogHeight?:()=>number|null};
  const measure=()=>{
   const dialog=Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).filter(node=>!node.closest('[hidden]')&&node.getClientRects().length).at(-1);
   if(!dialog)return null;
   // Include clipped scroll bodies so a small previous dialog cannot trap a larger successor.
   const overflow=Array.from(dialog.children).reduce((sum,child)=>sum+Math.max(0,child.scrollHeight-child.clientHeight),0);
   const natural=Math.max(dialog.scrollHeight,dialog.getBoundingClientRect().height)+overflow;
   const backdrop=Array.from(marked).find(node=>node.contains(dialog)),style=backdrop?getComputedStyle(backdrop):null;
   return Math.max(80,Math.min(680,Math.ceil(natural+(style?parseFloat(style.paddingTop)+parseFloat(style.paddingBottom):0)+2)));
  };
  host.__irisFloatingDialogHeight=measure;
  html.dataset.irisFloatingDialogs='true';
  const sync=()=>{
   const overlays=new Set<HTMLElement>();
   for(const dialog of document.querySelectorAll<HTMLElement>('[role="dialog"]')){
    if(dialog.closest('[hidden]')||!dialog.getClientRects().length)continue;
    // A party dialog can be nested in another fixed overlay; adapt its own nearest backdrop only.
    for(let node:HTMLElement|null=dialog;node&&node!==document.body;node=node.parentElement){
     if(getComputedStyle(node).position==='fixed'){overlays.add(node);break;}
    }
   }
   for(const old of marked)if(!overlays.has(old)){delete old.dataset.irisFloatingDialog;marked.delete(old);}
   for(const overlay of overlays){overlay.dataset.irisFloatingDialog='';marked.add(overlay);}
   const open=overlays.size>0;
   if(desired===open)return;desired=open;
   if(supported)void command(open?'dialog-open':'dialog-close');
   // Older native apps have no modal-only hit region. Keep their module panels intact;
   // only icon-only dialogs need the legacy visible-window recovery.
   else if(open&&!current.current?.layout.panel)void command('normal');
  };
  const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['role','hidden']});sync();
  return()=>{observer.disconnect();delete html.dataset.irisFloatingDialogs;if(host.__irisFloatingDialogHeight===measure)delete host.__irisFloatingDialogHeight;for(const overlay of marked)delete overlay.dataset.irisFloatingDialog;};
 },[floating,supported,command]);
 const panel=state?.layout.panel,ready=!!panel,x=panel?.x??0,y=panel?.y??0,width=panel?.width??0,height=panel?.height??0;
 useEffect(()=>{
  if(!floating)return;
  const html=document.documentElement;
  html.dataset.irisFloatingDialogReady=ready?'true':'false';
  for(const [key,value] of Object.entries({x,y,width,height}))html.style.setProperty('--iris-dialog-'+key,value+'px');
  return()=>{delete html.dataset.irisFloatingDialogReady;for(const key of ['x','y','width','height'])html.style.removeProperty('--iris-dialog-'+key);};
 },[floating,ready,x,y,width,height]);
}
