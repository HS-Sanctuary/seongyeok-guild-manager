'use client';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';

/** In-flow help never covers controls or creates a second native dialog. */
export function DesktopContextHelp({label,children}:{label:string;children:ReactNode}){
 const [open,setOpen]=useState(false),id=useId(),root=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);button.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};},[open]);
 return <div ref={root} className="iris-context-help" data-open={open}><button ref={button} type="button" className="iris-desktop-button" aria-label={`${label} 도움말`} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}>?</button>{open&&<div id={id} role="note" aria-label={label} className="iris-context-help-content">{children}</div>}</div>;
}
