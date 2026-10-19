'use client';
import {useEffect,useRef,type CSSProperties,type ReactNode} from 'react';import {KronosIcon,SynaxisIcon,ErgonIcon,SettingsIcon,PowerIcon} from './DesktopIcons';import {floatingShortcutCaption,type FloatingCommand,type FloatingRect,type FloatingState} from '@/lib/irisFloating';import './floating-hub.css';
import Image from 'next/image';
import {IRIS_ERGON_AVAILABLE} from '@/lib/irisFeatureAvailability';
import {LockIcon} from './DesktopIcons';
const buttons=[['kronos','크로노스',KronosIcon],['synaxis','시낙시스',SynaxisIcon],['ergon','에르곤',ErgonIcon],['settings','설정',SettingsIcon]] as const;
export const floatingRectStyle=(r:FloatingRect|null):CSSProperties|undefined=>r?{left:r.x,top:r.y,width:r.width,height:r.height}:undefined;
export function DesktopFloatingHub({state,onCommand,onDrag,onExit,onNoticeHeight,exitDisabled=false,children,notice}:{state:FloatingState|null;onCommand(c:FloatingCommand):void;onDrag():void;onExit?():void;onNoticeHeight?(height:number):void;exitDisabled?:boolean;children:ReactNode;notice?:ReactNode}){
 const floating=state?.mode==='floating',root=useRef<HTMLDivElement>(null),pointer=useRef<{x:number;y:number;dragged:boolean}|null>(null),suppressClick=useRef(false);
 const noticeRoot=useRef<HTMLDivElement>(null),showNotice=!!notice&&(!floating||!state?.menuOpen&&!!state?.layout.bubble),bubbleWidth=state?.layout.bubble?.width;
 useEffect(()=>{
  const node=noticeRoot.current;if(!floating||!showNotice||!node||!onNoticeHeight)return;
  let frame=0,last=0;const resize=new ResizeObserver(()=>schedule());
  const measure=()=>{frame=0;const child=node.firstElementChild;if(!child)return;const height=Math.max(80,Math.min(360,Math.ceil(child.getBoundingClientRect().height)));if(height!==last){last=height;onNoticeHeight(height);}};
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
  const observe=()=>{resize.disconnect();if(node.firstElementChild)resize.observe(node.firstElementChild);schedule();};
  const changes=new MutationObserver(observe);changes.observe(node,{childList:true,subtree:true});observe();
  return()=>{cancelAnimationFrame(frame);resize.disconnect();changes.disconnect();};
 },[floating,showNotice,bubbleWidth,onNoticeHeight]);
 useEffect(()=>{if(!floating)return;const modal=()=>!!document.querySelector('[role="dialog"]');const outside=(e:PointerEvent)=>{if(!e.defaultPrevented&&!modal()&&!root.current?.contains(e.target as Node))onCommand('close');},escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!e.defaultPrevented&&!modal()){e.preventDefault();onCommand('close');}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[floating,onCommand]);
 if(!state)return <div className="iris-floating-root" data-floating={false}><div key="workspace" className="iris-floating-workspace">{false}{children}</div></div>;
 const l=state.layout;
 const entries=[...buttons.map(([id,label,Icon])=>{const disabled=id==='ergon'&&!IRIS_ERGON_AVAILABLE;return {id,label:disabled?`${label} · 준비중`:label,Icon:disabled?LockIcon:Icon,action:()=>{if(!disabled)onCommand(id);},disabled};}),...(onExit&&l.menu.length===5?[{id:'exit',label:'종료',Icon:PowerIcon,action:onExit,disabled:exitDisabled}]:[])];
 return <div className="iris-floating-root" data-floating={floating} data-dialog-open={floating&&state.dialogOpen===true} data-side={l.side} data-vertical={l.vertical} ref={root}>
  {floating&&<><button type="button" className="iris-floating-logo" style={{left:l.anchor.x,top:l.anchor.y,width:l.anchor.size,height:l.anchor.size}} aria-label="IRIS 메뉴" title={state.hotkeyAvailable?'메뉴 · 끌어서 이동':'단축키 사용 불가 · 눌러서 메뉴 열기'} aria-expanded={state.menuOpen} onPointerDown={e=>{if(e.button!==0)return;suppressClick.current=false;pointer.current={x:e.clientX,y:e.clientY,dragged:false};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const p=pointer.current;if(!p||p.dragged||Math.hypot(e.clientX-p.x,e.clientY-p.y)<6)return;p.dragged=true;suppressClick.current=true;e.currentTarget.releasePointerCapture(e.pointerId);onDrag();}} onPointerUp={()=>{pointer.current=null;}} onLostPointerCapture={()=>{pointer.current=null;}} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}onCommand('menu');}}><Image src="/IRIS/logo/IRIS%20로고%20마크.svg" alt="" width={80} height={80} unoptimized draggable={false}/></button>
  {!state.menuOpen&&<span className="iris-floating-keycap" data-unavailable={!state.hotkeyAvailable} style={floatingRectStyle(l.badge)}>{floatingShortcutCaption(state.hotkeyLabel)}</span>}
  {state.menuOpen&&<nav className="iris-floating-menu" aria-label="플로팅 메뉴">{entries.map(({id,label,Icon,action,disabled},i)=><button type="button" className="iris-floating-feature" style={{...floatingRectStyle(l.menu[i]??null),'--iris-menu-step':i,'--iris-start-x':`${l.anchor.x+l.anchor.size/2-(l.menu[i]?.x??0)-(l.menu[i]?.width??36)/2}px`,'--iris-start-y':`${l.anchor.y+l.anchor.size/2-(l.menu[i]?.y??0)-(l.menu[i]?.height??36)/2}px`} as CSSProperties} title={label} aria-label={label} key={id} disabled={disabled} onClick={action}><Icon/></button>)}</nav>}
  </>}
  <div key="workspace" className="iris-floating-workspace" style={floating?floatingRectStyle(l.panel):undefined} hidden={floating&&state.surface==='none'}>{children}</div>
  {showNotice&&<div ref={noticeRoot} className="iris-floating-notice" style={floating?floatingRectStyle(l.bubble):undefined}>{notice}</div>}
 </div>;
}
