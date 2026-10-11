'use client';
import {useEffect,useRef} from 'react';

export const kronosTabs={homework:'숙제',classes:'클래스',stats:'스탯',currencies:'재화',barter:'물물교환',shop:'상점구매',missions:'임무게시판'} as const;
export type KronosTab=keyof typeof kronosTabs;
const groups:ReadonlyArray<{title:string;description:string;items:ReadonlyArray<KronosTab>}>= [
  {title:'생텀 기록',description:'생텀에서 관리하는 기록',items:['homework','barter','shop','missions']},
  {title:'캐릭터 관리',description:'저장 레벨 · 게임 스탯 비교',items:['classes','stats']},
  {title:'게임 정보',description:'커넥터로 읽은 현재 정보',items:['currencies']},
];

export function DesktopFeaturePicker({value,disabled,open,onOpenChange,onChoose}:{value:KronosTab;disabled:boolean;open:boolean;onOpenChange(open:boolean):void;onChoose(tab:KronosTab):void}){
  const trigger=useRef<HTMLButtonElement>(null),list=useRef<HTMLElement>(null);
  const group=groups.find(group=>group.items.includes(value))!;
  useEffect(()=>{
    if(!open)return;
    const measure=()=>{
      const panel=list.current;if(!panel)return;
      const margin=parseFloat(getComputedStyle(document.documentElement).fontSize)*.75;
      panel.style.setProperty('--iris-feature-space',Math.max(0,window.innerHeight-panel.getBoundingClientRect().top-margin)+'px');
    };
    measure();
    list.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus();
    const observer=new ResizeObserver(measure);if(trigger.current?.parentElement)observer.observe(trigger.current.parentElement);observer.observe(document.documentElement);
    const outside=(event:PointerEvent)=>{if(!list.current?.contains(event.target as Node)&&!trigger.current?.contains(event.target as Node))onOpenChange(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onOpenChange(false);trigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    window.addEventListener('resize',measure);document.addEventListener('scroll',measure,{capture:true,passive:true});
    return()=>{observer.disconnect();document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('resize',measure);document.removeEventListener('scroll',measure,true);};
  },[open,onOpenChange]);
  return <nav className="iris-feature-picker" aria-label="크로노스 기능">
    <div className="iris-feature-current"><div><small>{group.title}</small><strong>{kronosTabs[value]}</strong></div><button ref={trigger} type="button" className="iris-desktop-button iris-feature-trigger" aria-label="기능 선택" aria-expanded={open} aria-controls="iris-feature-list" disabled={disabled} onClick={()=>onOpenChange(!open)}>기능 선택 <span aria-hidden="true">{open?'▴':'▾'}</span></button></div>
    {open&&<section ref={list} id="iris-feature-list" className="iris-feature-list" aria-label="크로노스 기능 선택">{groups.map(group=><div className="iris-feature-group" key={group.title}><h3>{group.title}</h3><p>{group.description}</p><div>{group.items.map(id=><button key={id} type="button" className="iris-desktop-button" disabled={disabled} aria-pressed={value===id} aria-controls={'iris-pane-'+id} onClick={()=>{onChoose(id);onOpenChange(false);trigger.current?.focus();}}>{kronosTabs[id]}{value===id&&<span aria-hidden="true"> ✓</span>}</button>)}</div></div>)}</section>}
  </nav>;
}
