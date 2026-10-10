'use client';
import {useEffect,useRef,useState} from 'react';
import type {StatsCharacter} from '@/lib/irisStats';
export function DesktopStatsConfirmation({target,characters,job,busy,canConfirm,onConfirm,onSelectCharacter,onCancel,locked=false}:{target:StatsCharacter;characters:StatsCharacter[];job:string;busy:boolean;canConfirm:boolean;onConfirm():void;onSelectCharacter(id:string):void;onCancel():void;locked?:boolean}){
  const root=useRef<HTMLDivElement>(null),[choosing,setChoosing]=useState(false);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    (root.current?.querySelector<HTMLButtonElement>('button[data-cancel]:not(:disabled)')??root.current)?.focus();
    const keyboard=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){e.preventDefault();if(!busy)onCancel();}
      if(e.key==='Tab'){
        const buttons=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]),first=buttons[0],last=buttons.at(-1);
        if(!first){e.preventDefault();root.current?.focus();return;}
        if(!root.current?.contains(document.activeElement)){e.preventDefault();first.focus();}
        else if(e.shiftKey&&(document.activeElement===first||document.activeElement===root.current)){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',keyboard);return()=>{document.removeEventListener('keydown',keyboard);document.body.style.overflow=overflow;previous?.focus();};
  },[busy,onCancel]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3" onClick={e=>{if(e.target===e.currentTarget&&!busy)onCancel();}}>
    <div ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="iris-stats-confirm-heading" className="w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 space-y-3">
      <h2 id="iris-stats-confirm-heading">{choosing?'업데이트할 캐릭터 선택':<>현재 <strong className="text-[var(--accent)]">{target.nickname}</strong> 캐릭터가 맞나요?</>}</h2>
      {choosing?<div className="flex flex-wrap gap-2">{characters.map(c=><button key={c.id} type="button" className="iris-desktop-button" disabled={busy||locked} onClick={()=>onSelectCharacter(c.id)}>{c.nickname} · {c.job}</button>)}</div>:<>
        <p className="text-sm">게임 화면과 비교해 주세요. {job!==target.job&&'게임 직업과 생텀 직업이 달라요. ' }확인하면 게임 정보를 다시 읽고 생텀에 업데이트해요.</p>
        {!canConfirm&&<p role="status" className="text-sm">정보가 오래됐어요. 창을 닫고 스탯을 다시 읽어 주세요.</p>}
      </>}
      <div className="iris-stats-confirm-actions" data-choosing={choosing}>
        {!choosing&&<><button type="button" className="iris-desktop-button" disabled={busy||locked||!canConfirm} onClick={onConfirm}>{busy?'업데이트 중…':'네, 업데이트'}</button><button type="button" className="iris-desktop-button" disabled={busy||locked} onClick={()=>setChoosing(true)}>아니요, 다른 캐릭터</button></>}
        <button type="button" data-cancel className="iris-desktop-button" disabled={busy} onClick={onCancel}>취소</button>
      </div>
    </div>
  </div>;
}
