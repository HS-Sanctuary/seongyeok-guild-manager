'use client';
import {useEffect,useRef} from 'react';
import type {PendingEdit} from '@/lib/irisDesktopQueue';
import type {DesktopCharacter,DesktopDetails} from '@/lib/irisDesktopTransport';
import {summarizeDesktopEdits} from '@/lib/irisDesktopPresentation';
import type {DesktopSaveConfirmation} from '@/lib/irisDesktopController';
const phaseNames = {pending:'저장 대기',inflight:'저장 중',unknown:'결과 확인 필요',conflict:'다른 변경과 충돌',expired:'초기화 시간이 지남'};
const confirmationTimeFormat=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
export function DesktopSaveStatus({entries,characters=[],selected=null,lastSaveConfirmation=null,now,locked,hasInvalidClassDraft=false,onSave,onDiscard,onRecover}:{entries:PendingEdit[];characters?:DesktopCharacter[];selected?:DesktopDetails|null;lastSaveConfirmation?:DesktopSaveConfirmation|null;now:number;locked:boolean;hasInvalidClassDraft?:boolean;onSave():void;onDiscard():void;onRecover(id:string,action:'retry'|'discard'):void}) {
  const summary=summarizeDesktopEdits(entries,characters,selected,now);
  const paused=summary.items.filter(e=>['unknown','conflict','expired'].includes(e.phase));
  return <section className="iris-save-status" aria-label="저장 상태">
    <div className="iris-save-actions"><span className="text-sm">{summary.total===0?'미저장 변경 없음':`이 계정 미저장 ${summary.total}개`}</span><button type="button" className="iris-desktop-button" disabled={locked||hasInvalidClassDraft} onClick={onSave}>지금 저장</button><button type="button" className="iris-desktop-button" disabled={locked} onClick={onDiscard}>변경 버리기</button></div>
    {hasInvalidClassDraft&&<p role="alert">클래스 입력을 고치거나 되돌릴 때까지 이 캐릭터의 자동저장을 멈춰요.</p>}
    {summary.groups.length>0&&<div role="status">{summary.groups.map(g=><p key={g.characterId} className="text-sm">{g.nickname} · {g.count}개 · {phaseNames[g.phase]}{g.remainingSeconds!==null?` · ${g.remainingSeconds}초`:''}</p>)}</div>}
    {paused.length>0&&<div role="alert" className="space-y-2">{paused.map(e=><div key={e.requestId} className="rounded-xl bg-[var(--inner-box)] p-2"><p>{e.taskName} · {phaseNames[e.phase]}</p><div className="flex flex-wrap gap-2">{e.phase==='unknown'&&<button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>onRecover(e.requestId,'retry')}>확인하고 재시도</button>}<button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>onRecover(e.requestId,'discard')}>이 변경 버리기</button></div></div>)}</div>}
    <details className="text-sm iris-save-help"><summary className="cursor-pointer">저장 안내 · 자동 15초</summary><p className="text-sm" role="status">{lastSaveConfirmation?<>{lastSaveConfirmation.nickname} · 마지막 저장 확인 <time dateTime={new Date(lastSaveConfirmation.confirmedAt).toISOString()}>{confirmationTimeFormat.format(lastSaveConfirmation.confirmedAt)}</time> (한국 시간)</>:'이번 실행에서 확인한 저장 시각 없음'}</p><p>마지막 유효 수정 후 15초 자동저장해요. 캐릭터를 바꿔도 이전 캐릭터의 변경은 따로 보관돼요.</p><p>지금 저장과 변경 버리기는 선택 캐릭터와 계정당 물물교환에 적용돼요.</p></details>
  </section>;
}
export function DesktopCloseDialog({busy,onChoose,onCancel,storageFailed=false,onUnsafeClose,reason='manual'}:{busy:boolean;onChoose(action:'save'|'keep'|'discard'):void;onCancel():void;storageFailed?:boolean;onUnsafeClose?():void;reason?:'manual'|'game-exit'}) {
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';root.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keyboard=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy)onCancel();if(e.key==='Tab'){
      const buttons=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);if(!buttons.length){e.preventDefault();return;}
      const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }};
    document.addEventListener('keydown',keyboard);return()=>{document.removeEventListener('keydown',keyboard);document.body.style.overflow=overflow;previous?.focus();};
  },[busy,onCancel]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e=>{if(e.target===e.currentTarget&&!busy)onCancel();}}>
    <div ref={root} role="dialog" aria-modal="true" aria-labelledby="iris-close-heading" className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 max-w-xl space-y-4">
      <h2 id="iris-close-heading" className="font-bold">{reason==='game-exit'?'게임이 종료됐어요. IRIS도 종료할까요?':'IRIS를 종료할까요?'}</h2><p>보관한 변경은 다음 실행에서 본인 확인 후 재시도할 수 있어요. 저장 결과가 불명확하면 창을 유지해요.</p>
      {storageFailed&&<div role="alert"><p>보관 또는 종료 연결에 실패했어요. 기존 보호 대기함은 유지돼요. 연결을 확인한 뒤 다시 시도해 주세요.</p>{reason==='manual'&&<><p>최근 변경을 잃을 수 있어요. 기존 보호 대기함을 덮어쓰지 않아요.</p><button type="button" className="iris-desktop-button" disabled={busy} onClick={onUnsafeClose}>손실 가능성을 확인하고 종료</button></>}</div>}
      <div className="flex flex-wrap gap-3">{(reason==='game-exit'?['save','keep'] as const:['save','keep','discard'] as const).map(action=><button type="button" key={action} className="iris-desktop-button" disabled={busy} onClick={()=>onChoose(action)}>{{save:'저장하고 종료',keep:'보관하고 종료',discard:'버리고 종료'}[action]}</button>)}<button type="button" className="iris-desktop-button" disabled={busy} onClick={onCancel}>{reason==='game-exit'?'취소':'돌아가기'}</button></div>
    </div>
  </div>;
}
