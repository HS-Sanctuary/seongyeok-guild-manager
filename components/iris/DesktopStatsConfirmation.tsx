'use client';
import {useRef,useState} from 'react';
import {DesktopFocusDialog} from './DesktopFocusDialog';
import type {StatsCharacter} from '@/lib/irisStats';
export function DesktopStatsConfirmation({target,characters,job,busy,canConfirm,onConfirm,onSelectCharacter,onCancel,onChooseOther,locked=false}:{target:StatsCharacter;characters:StatsCharacter[];job:string;busy:boolean;canConfirm:boolean;onConfirm():void;onSelectCharacter(id:string):void;onCancel():void;onChooseOther?():void;locked?:boolean}){
  const cancel=useRef<HTMLButtonElement>(null),[choosing,setChoosing]=useState(false);
  return <DesktopFocusDialog title={choosing?'업데이트할 캐릭터 선택':<>현재 <strong className="text-[var(--accent)]">{target.nickname}</strong> 캐릭터가 맞나요?</>} onClose={onCancel} dismissDisabled={busy} initialFocusRef={cancel}>
      {choosing?<div className="flex flex-wrap gap-2">{characters.map(c=><button key={c.id} type="button" className="iris-desktop-button" disabled={busy||locked} onClick={()=>onSelectCharacter(c.id)}>{c.nickname} · {c.job}</button>)}</div>:<>
        <p className="text-sm">게임 화면과 비교해 주세요. {job!==target.job&&'게임 직업과 생텀 직업이 달라요. ' }확인하면 게임 정보를 다시 읽고 생텀에 업데이트해요.</p>
        {!canConfirm&&<p role="status" className="text-sm">정보가 오래됐어요. 창을 닫고 스탯을 다시 읽어 주세요.</p>}
      </>}
      <div className="iris-stats-confirm-actions" data-choosing={choosing}>
        {!choosing&&<><button type="button" className="iris-desktop-button" disabled={busy||locked||!canConfirm} onClick={onConfirm}>{busy?'업데이트 중…':'네, 업데이트'}</button><button type="button" className="iris-desktop-button" disabled={busy||locked} onClick={()=>{if(onChooseOther){onCancel();onChooseOther();}else setChoosing(true);}}>아니요, 다른 캐릭터</button></>}
        <button ref={cancel} type="button" data-cancel className="iris-desktop-button" disabled={busy} onClick={onCancel}>취소</button>
      </div>
  </DesktopFocusDialog>;
}
