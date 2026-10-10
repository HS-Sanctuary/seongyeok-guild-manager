'use client';
import {useState} from 'react';
import {cleanItemName} from '@/lib/matchingUtils';
import type { DesktopDetails } from '@/lib/irisDesktopTransport';
import type { PendingEdit, TaskKey,TaskPendingEdit } from '@/lib/irisDesktopQueue';
const categories = ['daily','weekly','abyss','raid'] as const;
const titles = {daily:'일일 숙제',weekly:'주간 숙제',abyss:'어비스',raid:'레이드'};
const filters = {daily:'일일',weekly:'주간',abyss:'어비스',raid:'레이드'};
export function desktopRows(selected: DesktopDetails, pending: PendingEdit[], category: TaskKey['category']) {
  return selected.details.tasks[category].map(row => {
    const edits = pending.filter((e):e is TaskPendingEdit => e.kind==='task' && e.accountId === selected.accountId && e.characterId === selected.characterId && e.category === category && e.taskId === row.id && e.periodKey === selected.writeContext.periodKeys[category]).sort((a,b)=>b.revision-a.revision);
    return {...row,key:category+':'+row.id,completed:edits[0]?.desiredCompleted ?? row.completed,
      paused:edits.some(e=>['unknown','conflict','expired'].includes(e.phase))};
  });
}
export function DesktopCheckboard({selected,pending,locked,remainingOnly=false,onRemainingChange,onEdit}:{selected:DesktopDetails|null;pending:PendingEdit[];locked:boolean;remainingOnly?:boolean;onRemainingChange?(value:boolean):void;onEdit(key:TaskKey,base:number,desired:number):void}) {
  const [enabled,setEnabled]=useState<readonly TaskKey['category'][]>(categories);
  if (!selected) return <p>캐릭터를 선택하면 저장된 숙제를 볼 수 있어요.</p>;
  return <div className="iris-checkboard">
    <div className="iris-homework-toolbar"><nav className="iris-homework-filters" aria-label="숙제 분류 표시">{categories.map(category=><button type="button" className="iris-desktop-button" key={category} aria-pressed={enabled.includes(category)} aria-controls={'iris-tasks-'+category} onClick={()=>setEnabled(current=>current.includes(category)?current.filter(c=>c!==category):[...current,category])}>{filters[category]}</button>)}</nav><label className="iris-homework-remaining"><input type="checkbox" checked={remainingOnly} onChange={e=>onRemainingChange?.(e.target.checked)}/>미완료만</label></div>
    {enabled.length===0&&<p role="status" className="iris-category-empty">위에서 표시할 숙제 분류를 선택해 주세요.</p>}
    {categories.map(category=>{
      const rows=desktopRows(selected,pending,category);
      const visible=rows.filter(row=>!remainingOnly||row.completed<row.total||row.paused);
      const completed=rows.filter(row=>row.completed===row.total).length;
      return <section key={category} id={'iris-tasks-'+category} aria-label={titles[category]} hidden={!enabled.includes(category)} className="iris-category">
      <div className="iris-category-caption"><h3>{titles[category]}</h3><span className="iris-category-count">완료 {completed}/{rows.length}</span></div>
      <div className="iris-category-rows">{visible.map(row=><div key={row.key} data-task-key={row.key} data-kind={row.total===1?'check':'counter'} className="iris-task-row" data-complete={row.completed===row.total} data-paused={row.paused} title={row.name}>
        {row.total === 1 ? <label className="iris-check-row"><span>{category==='abyss'||category==='raid'?(cleanItemName(row.name)||row.name):row.displayName||row.name}</span><input aria-label={row.name+' 완료'} type="checkbox" checked={row.completed===1} disabled={locked||row.paused} onChange={e=>onEdit({category,taskId:row.id,periodKey:selected.writeContext.periodKeys[category]},row.completed,e.target.checked?1:0)}/></label> : <><span className="iris-task-name">{category==='abyss'||category==='raid'?(cleanItemName(row.name)||row.name):row.displayName||row.name}</span>
          <div className="iris-counter"><button type="button" className="iris-desktop-button iris-icon-button" aria-label={row.name+' 감소'} disabled={locked||row.paused||row.completed===0} onClick={()=>onEdit({category,taskId:row.id,periodKey:selected.writeContext.periodKeys[category]},row.completed,row.completed-1)}>−</button>
          <span>{row.completed}/{row.total}</span><button type="button" className="iris-desktop-button iris-icon-button" aria-label={row.name+' 증가'} disabled={locked||row.paused||row.completed>=row.total} onClick={()=>onEdit({category,taskId:row.id,periodKey:selected.writeContext.periodKeys[category]},row.completed,row.completed+1)}>+</button></div></>}
        {row.paused&&<small className="iris-task-warning">확인 필요 · 저장 안내를 확인해 주세요.</small>}
      </div>)}{visible.length===0&&<p className="iris-category-empty">{rows.length===0?'등록된 항목이 없어요.':'모두 완료했어요.'}</p>}</div>
    </section>;})}
  </div>;
}
