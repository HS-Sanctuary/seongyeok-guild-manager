'use client';
import type { DesktopDetails } from '@/lib/irisDesktopTransport';
import type { PendingEdit, TaskKey } from '@/lib/irisDesktopQueue';
const categories = ['daily','weekly','abyss','raid'] as const;
const titles = {daily:'일일 숙제',weekly:'주간 숙제',abyss:'어비스',raid:'레이드'};
export function desktopRows(selected: DesktopDetails, pending: PendingEdit[], category: TaskKey['category']) {
  return selected.details.tasks[category].map(row => {
    const edits = pending.filter(e => e.accountId === selected.accountId && e.characterId === selected.characterId && e.category === category && e.taskId === row.id && e.periodKey === selected.writeContext.periodKeys[category]).sort((a,b)=>b.revision-a.revision);
    return {...row,key:category+':'+row.id,completed:edits[0]?.desiredCompleted ?? row.completed,
      paused:edits.some(e=>['unknown','conflict','expired'].includes(e.phase))};
  });
}
export function DesktopCheckboard({selected,pending,locked,remainingOnly=false,onEdit}:{selected:DesktopDetails|null;pending:PendingEdit[];locked:boolean;remainingOnly?:boolean;onEdit(key:TaskKey,base:number,desired:number):void}) {
  if (!selected) return <p>캐릭터를 선택하면 저장된 숙제를 볼 수 있어요.</p>;
  return <div className="iris-checkboard">
    {categories.map(category=><details key={category} open={category==='daily'} className="iris-category">
      <summary className="font-bold cursor-pointer text-[var(--accent)]">{titles[category]}</summary>
      <div className="iris-category-rows">{desktopRows(selected,pending,category).filter(row=>!remainingOnly||row.completed<row.total||row.paused).map(row=><div key={row.key} data-task-key={row.key} className="iris-task-row" data-complete={row.completed===row.total}>
        {row.total === 1 ? <label className="iris-check-row"><span>{row.name}</span><input aria-label={row.name+' 완료'} type="checkbox" checked={row.completed===1} disabled={locked||row.paused} onChange={e=>onEdit({category,taskId:row.id,periodKey:selected.writeContext.periodKeys[category]},row.completed,e.target.checked?1:0)}/></label> : <><span className="iris-task-name">{row.name}</span>
          <div className="iris-counter"><button type="button" className="iris-desktop-button iris-icon-button" aria-label={row.name+' 감소'} disabled={locked||row.paused||row.completed===0} onClick={()=>onEdit({category,taskId:row.id,periodKey:selected.writeContext.periodKeys[category]},row.completed,row.completed-1)}>−</button>
          <span>{row.completed}/{row.total}</span><button type="button" className="iris-desktop-button iris-icon-button" aria-label={row.name+' 증가'} disabled={locked||row.paused||row.completed>=row.total} onClick={()=>onEdit({category,taskId:row.id,periodKey:selected.writeContext.periodKeys[category]},row.completed,row.completed+1)}>+</button></div></>}
      </div>)}{selected.details.tasks[category].length===0&&<p>등록된 항목이 없어요.</p>}</div>
    </details>)}
    <details className="iris-category"><summary className="cursor-pointer font-bold">클래스 · 저장된 레벨</summary><div className="mt-2 space-y-1">{selected.details.classes.map(row=><p key={row.id}>{row.name} · {row.level===null?'미등록':'Lv. '+row.level}</p>)}</div><p className="mt-2 text-sm">게임 클래스 레벨을 자동으로 읽은 결과는 아니에요.</p></details>
  </div>;
}
