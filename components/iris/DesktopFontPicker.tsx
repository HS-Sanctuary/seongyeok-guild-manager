'use client';
import {useEffect,useRef,useState} from 'react';
import type {DesktopFonts} from './useDesktopFonts';
export function DesktopFontPicker({fonts,busy,error,refresh,value,onChoose}:{value:string;onChoose(name:string):boolean}&DesktopFonts){
  const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[index,setIndex]=useState(0);
  const root=useRef<HTMLDivElement>(null),search=useRef<HTMLInputElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const names=['',...(fonts??[])].filter(name=>(name||'기본').toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  useEffect(()=>{if(!open)return;search.current?.focus();const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open]);
  const choose=(name:string)=>{if(onChoose(name)){setOpen(false);trigger.current?.focus();}};
  return <div className="iris-font-picker" ref={root}>
    <div className="iris-font-picker-controls"><button ref={trigger} type="button" className="iris-desktop-button" aria-label="설치 글꼴 선택" aria-expanded={open} aria-haspopup="listbox" disabled={fonts===null} onClick={()=>{setOpen(v=>!v);setQuery('');setIndex(0);}}>{value||'기본'} <span aria-hidden="true">▾</span></button><button type="button" className="iris-desktop-button" disabled={busy} onClick={refresh} aria-label="설치 글꼴 새로고침">↻</button></div>
    {busy&&<p role="status" className="iris-caption">설치 글꼴을 읽고 있어요.</p>}{error&&<p role="status" className="iris-caption">{error}</p>}
    {open&&<div className="iris-font-options"><input ref={search} className="iris-desktop-input" role="combobox" aria-label="글꼴 검색" aria-controls="iris-font-options" aria-expanded="true" aria-autocomplete="list" aria-activedescendant={names.length?`iris-font-option-${index}`:undefined} value={query} onChange={e=>{setQuery(e.target.value);setIndex(0);}} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setIndex(i=>Math.max(0,Math.min(names.length-1,i+(e.key==='ArrowDown'?1:-1))));}if(e.key==='Enter'&&names[index]!==undefined){e.preventDefault();choose(names[index]);}}}/><div id="iris-font-options" role="listbox" aria-label="설치 글꼴 목록">{names.map((name,i)=><button id={`iris-font-option-${i}`} type="button" role="option" aria-selected={name===value} className="iris-font-option" key={name} onClick={()=>choose(name)} onMouseEnter={()=>setIndex(i)}>{name||'기본'}</button>)}{names.length===0&&<p className="iris-caption">검색 결과가 없어요.</p>}</div></div>}
  </div>;
}
