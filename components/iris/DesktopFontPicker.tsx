'use client';
import {useEffect,useId,useRef,useState} from 'react';
import type {DesktopFonts} from './useDesktopFonts';
import './font-picker.css';
export function DesktopFontPicker({fonts,busy,error,refresh,value,onChoose}:{value:string;onChoose(name:string):boolean}&DesktopFonts){
  const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[index,setIndex]=useState(0);
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const listId=useId();
  const names=['',...(fonts??[])].filter(name=>(name||'기본').toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  useEffect(()=>{if(!open)return;const selected=root.current?.querySelector<HTMLButtonElement>('[role=option][aria-selected=true]')??root.current?.querySelector<HTMLButtonElement>('[role=option]');selected?.focus();const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);trigger.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);};},[open]);
  const choose=(name:string)=>{if(onChoose(name)){setOpen(false);trigger.current?.focus();}};
  return <div className="iris-font-picker" ref={root}>
    <div className="iris-font-picker-controls"><button ref={trigger} type="button" className="iris-desktop-button" aria-label="설치 글꼴 선택" aria-expanded={open} aria-controls={listId} disabled={fonts===null} onClick={()=>{setOpen(v=>!v);setQuery('');setIndex(Math.max(0,['',...(fonts??[])].indexOf(value)));}}>{value||'기본'} <span aria-hidden="true">{open?'▴':'▾ 목록'}</span></button><button type="button" className="iris-desktop-button" disabled={busy} onClick={refresh} aria-label="설치 글꼴 새로고침">↻</button><button type="button" className="iris-desktop-button" disabled={!value} onClick={()=>choose('')} aria-label="기본 글꼴로 초기화">기본</button></div>
    <p className="iris-font-preview" aria-label="선택 글꼴 미리보기" style={value?{fontFamily:JSON.stringify(value)}:undefined}>성역에서 함께하는 하루 · Sanctum 012345</p>
    {busy&&<p role="status" className="iris-caption">설치 글꼴을 읽고 있어요.</p>}{error&&<p role="status" className="iris-caption">{error}</p>}
    {open&&<div className="iris-font-options" onKeyDown={e=>{if(e.target instanceof HTMLInputElement&&(e.key==='Home'||e.key==='End'))return;if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Home'||e.key==='End'){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?names.length-1:Math.max(0,Math.min(names.length-1,index+(e.key==='ArrowDown'?1:-1)));setIndex(next);root.current?.querySelector<HTMLButtonElement>(`[id="${CSS.escape(`${listId}-${next}`)}"]`)?.focus();}if(e.key==='Enter'&&e.target instanceof HTMLInputElement&&names[index]!==undefined){e.preventDefault();choose(names[index]);}}}>
      <p className="iris-caption">설치 글꼴 {fonts?.length??0}개 · 목록을 내려 바로 선택하세요.</p>
      <input className="iris-desktop-input" role="combobox" aria-label="글꼴 검색" placeholder="이름으로 좁히기 (선택 사항)" aria-controls={listId} aria-expanded="true" aria-autocomplete="list" value={query} onChange={e=>{setQuery(e.target.value);setIndex(0);}}/>
      <div id={listId} role="listbox" aria-label="설치 글꼴 목록">{names.map((name,i)=><button id={`${listId}-${i}`} type="button" role="option" tabIndex={i===index?0:-1} aria-selected={name===value} className="iris-font-option" key={name} onFocus={()=>setIndex(i)} onClick={()=>choose(name)}>{name||'기본'}</button>)}</div>
      {fonts?.length===0&&<p className="iris-caption">설치 글꼴이 없어요. 기본 글꼴을 사용하거나 새로고침해 주세요.</p>}{names.length===0&&<p role="status" className="iris-caption">검색 결과가 없어요.</p>}
    </div>}
  </div>;
}
