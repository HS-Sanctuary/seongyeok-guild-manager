'use client';
import {useRef,useState} from 'react';
import type {ErgonPlanItem} from '@/lib/irisErgonPlan';

type Props={item:ErgonPlanItem;selected:boolean;disabled:boolean;confirmed:number;summary?:string;onSelect:()=>void;onQuantity:(quantity:number)=>void;onReplace?:()=>void;onRemove:()=>void};
export function DesktopErgonPlanRow({item,selected,disabled,confirmed,summary,onSelect,onQuantity,onReplace,onRemove}:Props){
 const [draft,setDraft]=useState<{base:number;value:string}|null>(null),sent=useRef<number|null>(null);
 const value=draft?.base===item.targetQuantity?draft.value:String(item.targetQuantity),number=Number(value),valid=value.trim()!==''&&Number.isSafeInteger(number)&&number>=1&&number<=1000000;
 const commit=(next=number)=>{if(disabled||!Number.isSafeInteger(next)||next<1||next>1000000)return;if(next!==item.targetQuantity&&sent.current!==next){sent.current=next;onQuantity(next);}setDraft(null);};
 return <article className="iris-ergon-plan-row" data-selected={selected}>
  <button type="button" className="iris-ergon-plan-select" aria-label={`${item.displayName} 선택`} aria-pressed={selected} disabled={disabled} onClick={onSelect}><strong>{item.displayName}</strong><span>{({gathering:'채집',altering:'가공',crafting:'제작'})[item.kind]}{selected?' · 선택됨':''}</span></button>
  <div className="iris-ergon-row-actions"><label><span className="iris-caption">추가 수량</span><span className="iris-ergon-stepper"><button type="button" className="iris-desktop-button" aria-label={`${item.displayName} 수량 줄이기`} disabled={disabled||(valid?number:item.targetQuantity)<=1} onMouseDown={e=>e.preventDefault()} onClick={()=>commit((valid?number:item.targetQuantity)-1)}>−</button><input aria-label={`${item.displayName} 추가 수량`} type="number" min="1" max="1000000" step="1" disabled={disabled} value={value} aria-invalid={!valid} onChange={event=>{sent.current=null;setDraft({base:item.targetQuantity,value:event.target.value});}} onBlur={()=>{if(valid)commit();}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();if(valid)commit();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();sent.current=null;setDraft(null);}}}/><button type="button" className="iris-desktop-button" aria-label={`${item.displayName} 수량 늘리기`} disabled={disabled||(valid?number:item.targetQuantity)>=1000000} onMouseDown={e=>e.preventDefault()} onClick={()=>commit((valid?number:item.targetQuantity)+1)}>+</button></span></label>
   {onReplace&&<button type="button" className="iris-desktop-button" data-ergon-role="neutral" disabled={disabled} aria-label={`${item.displayName} 교체`} onClick={onReplace}>교체</button>}<button type="button" className="iris-desktop-button" data-ergon-role="danger" disabled={disabled} aria-label={`${item.displayName} 제거`} onClick={onRemove}>제거</button>
  </div>{!valid&&<p role="alert" className="iris-caption">1~1,000,000 정수 · Esc로 복원</p>}
  {summary&&<p className="iris-caption">{summary}</p>}{confirmed>0&&<p className="iris-caption">확인된 추가 생산 {confirmed}개 · 남은 {Math.max(0,item.targetQuantity-confirmed)}개</p>}
 </article>;
}
