'use client';
import {useEffect,useRef,useState} from 'react';
import {currencyColorContrast,defaultEmphasis,type CurrencyEmphasis,type CurrencyEmphasisMap} from '@/lib/irisAppearance';
import type {CurrencySnapshot} from '@/lib/irisCurrencies';
export function DesktopCurrencyAppearance({items,emphasis,onApply,onClose}:{items:CurrencySnapshot['items'];emphasis:CurrencyEmphasisMap;onApply(value:CurrencyEmphasisMap):void;onClose():void}){
  const [draft,setDraft]=useState(emphasis),[name,setName]=useState(items[0]?.name??''),[reset,setReset]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const selected=Object.hasOwn(draft,name)?draft[name]:defaultEmphasis;
  const [lowContrast,setLowContrast]=useState(false);
  useEffect(()=>{let live=true;const update=()=>queueMicrotask(()=>{if(!live)return;const background=getComputedStyle(document.documentElement).getPropertyValue('--inner-box').trim();const contrast=selected.color?currencyColorContrast(selected.color,background):null;setLowContrast(contrast!==null&&contrast<4.5);});update();const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});return()=>{live=false;observer.disconnect();};},[selected.color]);
  const update=(patch:Partial<CurrencyEmphasis>)=>setDraft(old=>({...old,[name]:{...(Object.hasOwn(old,name)?old[name]:defaultEmphasis),...patch}}));
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';root.current?.querySelector<HTMLElement>('select,button')?.focus();
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();onClose();}if(event.key==='Tab'){
      const controls=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)')??[]);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;previous?.focus();};
  },[onClose]);
  return <div className="iris-dialog-backdrop" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><div ref={root} className="iris-currency-editor" role="dialog" aria-modal="true" aria-labelledby="iris-currency-editor-heading">
    <header><h2 id="iris-currency-editor-heading">재화 강조 설정</h2><button type="button" className="iris-desktop-button iris-icon-button" aria-label="강조 설정 닫기" onClick={onClose}>×</button></header>
    <p className="iris-caption">원하는 항목만 강조해요. 항목명과 숫자에 함께 적용돼요.</p>
    <label>강조할 재화<select aria-label="강조할 재화" value={name} onChange={event=>setName(event.target.value)}>{items.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
    <fieldset disabled={!name} className="iris-emphasis-controls"><legend>표시 스타일</legend><label className="iris-color-control">글자색<input type="color" aria-label="글자색" value={selected.color??'#e8c985'} onChange={event=>update({color:event.target.value})}/></label><label><input type="checkbox" checked={selected.color===null} onChange={event=>update({color:event.target.checked?null:'#e8c985'})}/>테마 기본색</label><label><input type="checkbox" checked={selected.bold} onChange={event=>update({bold:event.target.checked})}/>굵게</label><label><input type="checkbox" checked={selected.italic} onChange={event=>update({italic:event.target.checked})}/>기울임</label></fieldset>
    <div className="iris-emphasis-preview" aria-label="강조 미리보기" style={{color:selected.color??'var(--text-main)',fontWeight:selected.bold?700:400,fontStyle:selected.italic?'italic':'normal'}}><span>{name||'재화 없음'}</span><span>{items.find(item=>item.name===name)?.amount?.toLocaleString('ko-KR')??'미확인'}</span></div>
    {selected.color&&<p className="iris-caption" role={lowContrast?'alert':undefined}>{lowContrast?'현재 배경과 대비가 낮아요. 더 밝거나 어두운 색을 골라 주세요.':'테마가 바뀌면 색의 대비도 달라져요. 미리보기를 확인해 주세요.'}</p>}
    <div className="iris-editor-actions"><button type="button" className="iris-desktop-button" disabled={!name} onClick={()=>setDraft(old=>{const next={...old};delete next[name];return next;})}>이 항목 기본값</button><button type="button" className="iris-desktop-button" onClick={()=>setReset(true)}>전체 기본값</button></div>
    {reset&&<section className="iris-reset-confirm" aria-label="전체 초기화 확인"><p>모든 재화 강조를 기본값으로 되돌릴까요?</p><button type="button" className="iris-desktop-button" onClick={()=>{setDraft({});setReset(false);}}>되돌리기</button><button type="button" className="iris-desktop-button" onClick={()=>setReset(false)}>취소</button></section>}
    <footer className="iris-editor-actions"><button type="button" className="iris-desktop-button" onClick={()=>{onApply(draft);onClose();}}>적용</button><button type="button" className="iris-desktop-button" onClick={onClose}>취소</button></footer>
  </div></div>;
}
