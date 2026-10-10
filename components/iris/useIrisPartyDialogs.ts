'use client';
import {useEffect,type RefObject} from 'react';

/** Focus the foremost existing party modal, including portals, inside this WebView only. */
export function useIrisPartyDialogs(root:RefObject<HTMLDivElement|null>,active:boolean){
  useEffect(()=>{
    if(!active)return;
    document.body.classList.add('iris-synaxis-mode');
    let top:HTMLElement|null=null,previous:HTMLElement|null=null,background:HTMLElement[]=[];
    const oldOverflow=document.body.style.overflow;
    const clearInert=()=>{background.forEach(e=>e.inert=false);background=[];};
    const items=(dialog:HTMLElement)=>Array.from(dialog.querySelectorAll<HTMLElement>('button,a[href],input,textarea,select,[tabindex]')).filter(e=>e.tabIndex>=0&&!e.matches(':disabled')&&e.getClientRects().length);
    const focusTop=()=>{if(top&&document.hasFocus())(items(top)[0]??top).focus({preventScroll:true});};
    const sync=()=>{
      const overlays=Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0,[data-party-dialog]')).filter(e=>e.getClientRects().length&&(root.current?.contains(e)||e.closest('[data-iris-party-portal]')||e.parentElement===document.body));
      overlays.sort((a,b)=>(Number(getComputedStyle(a).zIndex)||0)-(Number(getComputedStyle(b).zIndex)||0));
      const overlay=overlays.at(-1),next=overlay?.matches('[data-party-dialog]')?overlay:overlay?.firstElementChild instanceof HTMLElement?overlay.firstElementChild:null;
      if(next===top)return;
      clearInert();
      if(next){
        if(!top)previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
        top=next;top.setAttribute('role','dialog');top.setAttribute('aria-modal','true');top.tabIndex=-1;
        if(!top.hasAttribute('aria-label')&&!top.hasAttribute('aria-labelledby'))top.setAttribute('aria-label',top.querySelector('h2,h3')?.textContent||'시낙시스 설정');
        // Make siblings inert along the complete ancestor chain, preserving pre-existing inert.
        for(let node:HTMLElement|null=overlay??null;node?.parentElement;node=node.parentElement){for(const sibling of node.parentElement.children)if(sibling!==node&&sibling instanceof HTMLElement&&!sibling.inert){sibling.inert=true;background.push(sibling);}}
        document.body.style.overflow='hidden';focusTop();
      }else{
        top=null;document.body.style.overflow=oldOverflow;
        if(document.hasFocus()&&previous?.isConnected)previous.focus({preventScroll:true});previous=null;
      }
    };
    const key=(event:KeyboardEvent)=>{
      if(!top)return;
      if(event.key==='Escape'){
        const close=Array.from(top.querySelectorAll<HTMLButtonElement>('button')).find(e=>/^(×|✕|✖|닫기|취소)$/.test(e.textContent?.trim()||'')||/닫기/.test(e.getAttribute('aria-label')||''));
        if(close){event.preventDefault();event.stopImmediatePropagation();if(!close.disabled)close.click();}return;
      }
      if(event.key!=='Tab')return;
      const focus=items(top),first=focus[0],last=focus.at(-1),selected=document.activeElement;
      if(!first){event.preventDefault();top.focus();}
      else if(event.shiftKey&&(selected===first||!top.contains(selected))){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&(selected===last||selected===top||!top.contains(selected))){event.preventDefault();first.focus();}
    };
    const focus=(event:FocusEvent)=>{if(top&&!top.contains(event.target as Node))focusTop();};
    const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true});sync();
    document.addEventListener('keydown',key,true);document.addEventListener('focusin',focus);
    return()=>{observer.disconnect();document.removeEventListener('keydown',key,true);document.removeEventListener('focusin',focus);clearInert();document.body.style.overflow=oldOverflow;document.body.classList.remove('iris-synaxis-mode');};
  },[root,active]);
}
