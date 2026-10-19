'use client';
import {useEffect,useRef} from 'react';
import type {FloatingState} from '@/lib/irisFloating';
import {traceIrisFocus,type IrisFocusTrace} from '@/lib/irisFocusTrace';

/** Return keyboard ownership after pointer-only actions, never forward game keys. */
export function useDesktopFloatingFocus(state:FloatingState|null,returnFocus:(()=>Promise<boolean>)|undefined){
 const enabled=state?.mode==='floating'&&state.gameFocus===true;
 const keyboardMode=useRef(false),pointerHeld=useRef(false);
 const surface=state?.surface,menuOpen=state?.menuOpen;
 useEffect(()=>{
  let frame=0,nextFrame=0,wheelTimer:ReturnType<typeof setTimeout>|undefined;
  const modal=()=>Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).some(node=>node.getClientRects().length>0);
  const editing=()=>document.activeElement instanceof Element&&document.activeElement.matches('textarea,select,[contenteditable]:not([contenteditable="false"]),input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"])');
  const report=(phase:IrisFocusTrace['phase'],returned:boolean|null=null)=>traceIrisFocus({phase,surface:surface??'none',menu:!!menuOpen,capable:!!enabled,documentFocus:document.hasFocus(),keyboard:keyboardMode.current,pointer:pointerHeld.current,modal:modal(),editing:editing(),selection:!!window.getSelection()?.toString(),returned});
  if(!enabled||!returnFocus){report('inactive');return;}
  const schedule=()=>{
   cancelAnimationFrame(frame);cancelAnimationFrame(nextFrame);
   frame=requestAnimationFrame(()=>{nextFrame=requestAnimationFrame(()=>{if(!keyboardMode.current&&!pointerHeld.current&&document.hasFocus()&&!modal()&&!editing()&&!window.getSelection()?.toString()){report('request');void returnFocus().then(focused=>report('reply',focused)).catch(()=>report('error'));}else report('skip');});});
  };
  const click=(event:MouseEvent)=>{
   if(!event.isTrusted||event.detail===0||modal()||!(event.target instanceof Element))return;
   const control=event.target.closest<HTMLElement>('button,input[type="checkbox"],input[type="radio"],summary,[role="button"]');
   if(control&&!control.matches(':disabled,[aria-disabled="true"]')&&!control.closest('[role="dialog"]'))schedule();
  };
  const press=(event:PointerEvent)=>{if(!event.isTrusted)return;keyboardMode.current=false;pointerHeld.current=true;};
  const release=(event:PointerEvent)=>{pointerHeld.current=false;if(event.isTrusted&&!modal()&&event.button===0)schedule();};
  const wheel=(event:WheelEvent)=>{if(!event.isTrusted||modal()||editing())return;keyboardMode.current=false;clearTimeout(wheelTimer);wheelTimer=setTimeout(schedule,80);};
  const key=(event:KeyboardEvent)=>{if(event.isTrusted&&['Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Home','End','PageUp','PageDown'].includes(event.key))keyboardMode.current=true;};
  // Capture remembers that the action began in a modal before its handler unmounts it.
  document.addEventListener('click',click,true);document.addEventListener('pointerdown',press,true);document.addEventListener('pointerup',release,true);document.addEventListener('pointercancel',release,true);document.addEventListener('keydown',key,true);document.addEventListener('wheel',wheel,{passive:true});
  // Opening via a native state reply needs a handoff even without another DOM click.
  schedule();
  return()=>{cancelAnimationFrame(frame);cancelAnimationFrame(nextFrame);clearTimeout(wheelTimer);document.removeEventListener('click',click,true);document.removeEventListener('pointerdown',press,true);document.removeEventListener('pointerup',release,true);document.removeEventListener('pointercancel',release,true);document.removeEventListener('keydown',key,true);document.removeEventListener('wheel',wheel);};
 },[enabled,returnFocus,surface,menuOpen]);
}
