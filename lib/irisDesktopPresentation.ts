import type {PendingEdit} from './irisDesktopQueue';
import type {DesktopCharacter,DesktopDetails} from './irisDesktopTransport';
const priority={unknown:0,conflict:1,expired:2,inflight:3,pending:4};
export function summarizeDesktopEdits(entries:PendingEdit[],characters:DesktopCharacter[],selected:DesktopDetails|null,now:number) {
  const groups:Array<{characterId:string;nickname:string;count:number;remainingSeconds:number|null;phase:PendingEdit['phase']}>=[];
  const items=entries.map(e=>({requestId:e.requestId,characterId:e.characterId,
    taskName:selected?.characterId===e.characterId ? selected.details.tasks[e.category]?.find(row=>row.id===e.taskId)?.name??'항목 확인 필요':'항목 확인 필요',phase:e.phase}));
  for(const e of entries){
    const remaining=e.phase==='pending'?Math.max(0,Math.ceil((e.deadlineAt-now)/1000)):null;
    const group=groups.find(g=>g.characterId===e.characterId);
    if(!group)groups.push({characterId:e.characterId,nickname:characters.find(c=>c.id===e.characterId)?.nickname??'캐릭터 확인 필요',count:1,remainingSeconds:remaining,phase:e.phase});
    else {group.count++;if(priority[e.phase]<priority[group.phase])group.phase=e.phase;
      if(remaining!==null)group.remainingSeconds=group.remainingSeconds===null?remaining:Math.min(group.remainingSeconds,remaining);}
  }
  groups.sort((a,b)=>priority[a.phase]-priority[b.phase]);items.sort((a,b)=>priority[a.phase]-priority[b.phase]);
  return {groups,items,total:entries.length};
}
