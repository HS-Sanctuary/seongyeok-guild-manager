'use client';
import {useEffect,useRef,useState} from 'react';
import {DesktopFocusDialog} from './DesktopFocusDialog';
import {createPortal} from 'react-dom';
import type {IrisSavePosition} from '@/lib/irisAppearance';
import type {PendingEdit} from '@/lib/irisDesktopQueue';
import type {DesktopCharacter,DesktopDetails} from '@/lib/irisDesktopTransport';
import {summarizeDesktopEdits} from '@/lib/irisDesktopPresentation';
import type {DesktopSaveConfirmation} from '@/lib/irisDesktopController';
const phaseNames = {pending:'저장 대기',inflight:'저장 중',unknown:'결과 확인 필요',conflict:'다른 변경과 충돌',expired:'초기화 시간이 지남'};
const confirmationTimeFormat=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
export function DesktopSaveStatus({entries,characters=[],selected=null,lastSaveConfirmation=null,now,locked,hasInvalidClassDraft=false,position='bottom-right',preview=false,suspended=false,inline=false,onSave,onDiscard,onRecover}:{entries:PendingEdit[];characters?:DesktopCharacter[];selected?:DesktopDetails|null;lastSaveConfirmation?:DesktopSaveConfirmation|null;now:number;locked:boolean;hasInvalidClassDraft?:boolean;position?:IrisSavePosition;preview?:boolean;suspended?:boolean;inline?:boolean;onSave():void;onDiscard():void;onRecover(id:string,action:'retry'|'discard'):void}) {
  const [portalTarget,setPortalTarget]=useState<HTMLElement|null>(null);
  useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)setPortalTarget(document.querySelector<HTMLElement>('.iris-floating-workspace')??document.body);});return()=>{active=false;};},[]);
  const summary=summarizeDesktopEdits(entries,characters,selected,now);
  const paused=summary.items.filter(e=>['unknown','conflict','expired'].includes(e.phase));
  const saved=!!lastSaveConfirmation&&now>=lastSaveConfirmation.confirmedAt&&now-lastSaveConfirmation.confirmedAt<3000;
  if(suspended||(!summary.total&&!hasInvalidClassDraft&&(!saved||inline)&&!preview))return null;
  const sample=preview&&!summary.total&&!hasInvalidClassDraft;
  if(inline){
    const deadlines=summary.groups.flatMap(group=>group.remainingSeconds===null?[]:[group.remainingSeconds]);
    const saving=summary.items.some(item=>item.phase==='inflight');
    const canSave=entries.some(item=>item.phase==='pending'&&(!selected||item.characterId===selected.characterId||(item.kind==='barter'||item.kind==='workspace')&&item.scope==='account'));
    const label=hasInvalidClassDraft?'입력 확인':paused.length?'저장 확인 필요':saving?'저장 중':'저장 대기';
    return <section className="iris-save-status iris-save-inline" aria-label={sample?'저장 안내 미리보기':'저장 상태'}>
      <div className="iris-save-actions"><span role="status">{sample?'변경 후 15초 자동 저장':`${label} ${summary.total}개${!paused.length&&!saving&&!hasInvalidClassDraft&&deadlines.length?` · ${Math.min(...deadlines)}초`:''}`}</span>{!sample&&<><button type="button" className="iris-desktop-button" title="선택 캐릭터와 계정 공용 변경을 저장해요." disabled={locked||hasInvalidClassDraft||!canSave} onClick={onSave}>지금 저장</button><button type="button" className="iris-desktop-button" title="선택 캐릭터와 계정 공용 변경을 버려요. 다른 캐릭터의 변경은 유지해요." disabled={locked} onClick={onDiscard}>버리기</button></>}</div>
      {hasInvalidClassDraft&&<p role="alert">클래스 입력을 고치거나 되돌려 주세요. 자동 저장은 잠시 멈췄어요.</p>}
      {paused.length>0&&<details className="iris-save-recovery"><summary>확인 필요 {paused.length}개</summary><div role="alert">{paused.map(item=><div key={item.requestId}><p>{characters.find(character=>character.id===item.characterId)?.nickname??'캐릭터 확인 필요'} · {item.taskName} · {phaseNames[item.phase]}</p><div className="iris-save-actions">{item.phase==='unknown'&&<button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>onRecover(item.requestId,'retry')}>확인하고 재시도</button>}<button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>onRecover(item.requestId,'discard')}>이 변경 버리기</button></div></div>)}</div></details>}
    </section>;
  }
  const node=<section className="iris-save-status iris-save-overlay" data-iris-save-overlay="" data-position={position} data-preview={sample||undefined} aria-label={sample?'저장 안내 미리보기':'저장 상태'}>
    {sample?<div role="status"><strong>저장 안내 미리보기</strong><p>변경 후 15초에 자동 저장해요.</p><small>미리보기예요. 실제 저장은 하지 않아요.</small></div>:<>
    {preview&&<p>위치 미리보기 · 아래에는 실제 변경 상태를 표시해요.</p>}
    {summary.total===0&&!hasInvalidClassDraft?<p role="status">✓ {lastSaveConfirmation?.nickname} · 저장 완료</p>:<>
    <div className="iris-save-actions"><span className="text-sm">{summary.total===0?'미저장 변경 없음':`이 계정 미저장 ${summary.total}개`}</span><button type="button" className="iris-desktop-button" disabled={locked||hasInvalidClassDraft} onClick={onSave}>지금 저장</button><button type="button" className="iris-desktop-button" disabled={locked} onClick={onDiscard}>변경 버리기</button></div>
    {hasInvalidClassDraft&&<p role="alert">클래스 입력을 고치거나 되돌릴 때까지 이 캐릭터의 자동저장을 멈춰요.</p>}
    {summary.groups.length>0&&<div role="status">{summary.groups.map(g=><p key={g.characterId} className="text-sm">{g.nickname} · {g.count}개 · {phaseNames[g.phase]}{g.remainingSeconds!==null?` · ${g.remainingSeconds}초`:''}</p>)}</div>}
    {paused.length>0&&<div role="alert" className="space-y-2">{paused.map(e=><div key={e.requestId} className="rounded-xl bg-[var(--inner-box)] p-2"><p>{e.taskName} · {phaseNames[e.phase]}</p><div className="flex flex-wrap gap-2">{e.phase==='unknown'&&<button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>onRecover(e.requestId,'retry')}>확인하고 재시도</button>}<button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>onRecover(e.requestId,'discard')}>이 변경 버리기</button></div></div>)}</div>}
    <details className="text-sm iris-save-help"><summary className="cursor-pointer">저장 안내 · 자동 15초</summary><p className="text-sm" role="status">{lastSaveConfirmation?<>{lastSaveConfirmation.nickname} · 마지막 저장 확인 <time dateTime={new Date(lastSaveConfirmation.confirmedAt).toISOString()}>{confirmationTimeFormat.format(lastSaveConfirmation.confirmedAt)}</time> (한국 시간)</>:'이번 실행에서 확인한 저장 시각 없음'}</p><p>마지막 유효 수정 후 15초 자동저장해요. 캐릭터를 바꿔도 이전 캐릭터의 변경은 따로 보관돼요.</p><p>지금 저장과 변경 버리기는 선택 캐릭터와 계정당 물물교환에 적용돼요.</p></details>
    </>}</>}
  </section>;
  return typeof document==='undefined'?node:portalTarget?createPortal(node,portalTarget):null;
}
export function DesktopCloseDialog({busy,onChoose,onCancel,storageFailed=false,onUnsafeClose,reason='manual',hasPending=true}:{busy:boolean;onChoose(action:'save'|'keep'|'discard'):void;onCancel():void;storageFailed?:boolean;onUnsafeClose?():void;reason?:'manual'|'game-exit';hasPending?:boolean}) {
  const cancel=useRef<HTMLButtonElement>(null);
  const needsChoice=hasPending||storageFailed;
  return <DesktopFocusDialog title={reason==='game-exit'?'게임이 종료됐어요. IRIS도 종료할까요?':'IRIS를 종료할까요?'} onClose={onCancel} dismissDisabled={busy} initialFocusRef={cancel}>
      {needsChoice?<dl className="iris-caption space-y-2"><div><dt className="font-semibold">생텀에 저장 후 종료</dt><dd>미저장 변경을 생텀 DB에 저장해요. 실패하거나 결과가 불확실하면 종료하지 않아요.</dd></div><div><dt className="font-semibold">이 PC에 보관 후 종료</dt><dd>아직 보내지 않은 변경을 이 PC에만 보관해요. 다음 실행에서 본인 확인 후 다시 저장할 수 있어요. 다른 PC에는 전달되지 않아요.</dd></div></dl>:<p className="iris-caption">미저장 변경이 없어요.</p>}
      {storageFailed&&<div role="alert"><p>보관 또는 종료 연결에 실패했어요. 기존 보호 대기함은 유지돼요. 연결을 확인한 뒤 다시 시도해 주세요.</p>{reason==='manual'&&<><p>최근 변경을 잃을 수 있어요. 기존 보호 대기함을 덮어쓰지 않아요.</p><button type="button" className="iris-desktop-button" disabled={busy} onClick={onUnsafeClose}>손실 가능성을 확인하고 종료</button></>}</div>}
      <div className="flex flex-wrap gap-3">{needsChoice?(reason==='game-exit'?['save','keep'] as const:['save','keep','discard'] as const).map(action=><button type="button" key={action} className="iris-desktop-button" disabled={busy} onClick={()=>onChoose(action)}>{{save:'생텀에 저장 후 종료',keep:'이 PC에 보관 후 종료',discard:'버리고 종료'}[action]}</button>):<button type="button" className="iris-desktop-button" disabled={busy} onClick={()=>onChoose('save')}>종료</button>}<button type="button" ref={cancel} className="iris-desktop-button" disabled={busy} onClick={onCancel}>{reason==='game-exit'?'취소':'돌아가기'}</button></div>
  </DesktopFocusDialog>;
}
