'use client';
import {useEffect,useId,useRef,type ReactNode,type RefObject} from 'react';
import {createPortal} from 'react-dom';
import './focus-dialog.css';

type FocusDialogProps={title:ReactNode;description?:string;onClose():void;children:ReactNode;dismissDisabled?:boolean;initialFocusRef?:RefObject<HTMLElement|null>;className?:string};
const focusSelector='button,input,select,textarea,a[href],[tabindex]';
const dialogStack:HTMLElement[]=[];
const inertOwners=new Map<HTMLElement,{count:number;original:boolean}>();
let originalOverflow='',initialFocus:HTMLElement|null=null;
function focusable(root:HTMLElement){return Array.from(root.querySelectorAll<HTMLElement>(focusSelector)).filter(node=>node.tabIndex>=0&&!node.matches(':disabled,[aria-disabled="true"]')&&node.getClientRects().length>0);}

/** Manages focus inside the current WebView document; never activates a native window. */
export function DesktopFocusDialog({title,description,onClose,children,dismissDisabled=false,initialFocusRef,className=''}:FocusDialogProps){
  const root=useRef<HTMLDivElement>(null),closeState=useRef({onClose,dismissDisabled});
  const titleId=useId(),descriptionId=useId();
  useEffect(()=>{closeState.current={onClose,dismissDisabled};},[onClose,dismissDisabled]);
  useEffect(()=>{
    const dialog=root.current;if(!dialog)return;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    if(!dialogStack.length){originalOverflow=document.body.style.overflow;initialFocus=previous;}
    dialogStack.push(dialog);
    const top=()=>dialogStack.at(-1)===dialog;
    const backdrop=dialog.parentElement;
    const siblings=Array.from(document.body.children).filter((element):element is HTMLElement=>element instanceof HTMLElement&&element!==backdrop);
    siblings.forEach(element=>{const owner=inertOwners.get(element)??{count:0,original:element.inert};owner.count++;inertOwners.set(element,owner);element.inert=true;});document.body.style.overflow='hidden';
    const focusInside=()=>{if(top()&&document.hasFocus())(initialFocusRef?.current??focusable(dialog)[0]??dialog).focus({preventScroll:true});};
    focusInside();
    const focus=(event:FocusEvent)=>{if(!dialog.contains(event.target as Node))focusInside();};
    const key=(event:KeyboardEvent)=>{
      if(!top())return;
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(!closeState.current.dismissDisabled)closeState.current.onClose();return;}
      if(event.key!=='Tab')return;
      const items=focusable(dialog),first=items[0],last=items.at(-1),active=document.activeElement;
      if(!first){event.preventDefault();dialog.focus({preventScroll:true});}
      else if(event.shiftKey&&(active===first||active===dialog||!dialog.contains(active))){event.preventDefault();last?.focus({preventScroll:true});}
      else if(!event.shiftKey&&(active===last||active===dialog||!dialog.contains(active))){event.preventDefault();first.focus({preventScroll:true});}
    };
    document.addEventListener('keydown',key,true);document.addEventListener('focusin',focus);
    return()=>{
      const index=dialogStack.indexOf(dialog);if(index>=0)dialogStack.splice(index,1);
      document.removeEventListener('keydown',key,true);document.removeEventListener('focusin',focus);
      siblings.forEach(element=>{const owner=inertOwners.get(element);if(!owner)return;if(--owner.count===0){element.inert=owner.original;inertOwners.delete(element);}else element.inert=true;});
      if(!dialogStack.length)document.body.style.overflow=originalOverflow;
      const restore=previous?.isConnected?previous:!dialogStack.length?initialFocus:null;
      if(document.hasFocus()&&restore?.isConnected)restore.focus({preventScroll:true});
      if(!dialogStack.length)initialFocus=null;
    };
  },[initialFocusRef]);
  const node=<div className="iris-focus-backdrop" onPointerDown={event=>{if(event.target===event.currentTarget&&!dismissDisabled){event.preventDefault();onClose();}}}>
    <div ref={root} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description?descriptionId:undefined} tabIndex={-1} className={`iris-focus-dialog ${className}`}>
      <header className="iris-focus-dialog-header"><h2 id={titleId}>{title}</h2><button type="button" className="iris-desktop-button iris-icon-button" aria-label="닫기" disabled={dismissDisabled} onClick={onClose}>×</button></header>
      <div className="iris-focus-dialog-body">{description&&<p id={descriptionId} className="iris-caption">{description}</p>}{children}</div>
    </div>
  </div>;
  return typeof document==='undefined'?node:createPortal(node,document.body);
}
