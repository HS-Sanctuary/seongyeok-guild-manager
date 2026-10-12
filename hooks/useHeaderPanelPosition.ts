'use client';
import {useEffect,type RefObject} from 'react';
/** Keep panels in their existing outside-click owner, anchored below its header. */
export function useHeaderPanelPosition(open:boolean,owner:RefObject<HTMLElement|null>){
  useEffect(()=>{if(!open||!owner.current)return;const anchor=owner.current,panel=anchor.querySelector<HTMLElement>('[data-header-panel]'),header=anchor.closest('[data-sanctum-header]');if(!panel)return;let frame=0,live=true;
    const update=()=>{frame=0;if(!live)return;const a=anchor.getBoundingClientRect(),h=header?.getBoundingClientRect(),width=Math.min(panel.getBoundingClientRect().width,window.innerWidth-24),left=Math.max(12,Math.min(a.right-width,window.innerWidth-12-width)),top=Math.max(8,h?.bottom??a.bottom)+8;Object.assign(panel.style,{left:(left-a.left)+'px',top:(top-a.top)+'px',maxHeight:Math.max(0,window.innerHeight-top-12)+'px',visibility:'visible'});};
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};const observer=new ResizeObserver(schedule);observer.observe(anchor);observer.observe(panel);if(header)observer.observe(header);window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,{passive:true,capture:true});schedule();return()=>{live=false;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);};
  },[open,owner]);
}
