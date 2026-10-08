'use client';
import {useState} from 'react';
import type {DesktopDetails} from '@/lib/irisDesktopTransport';
import type {PendingEdit,ClassPendingEdit} from '@/lib/irisDesktopQueue';
import type {DesktopClassDraft} from '@/lib/irisDesktopController';

const families:Record<string,string[]>={전사:['전사','대검전사','검술사','기사'],마법사:['마법사','화염술사','빙결술사','전격술사'],궁수:['궁수','장궁병','석궁사수'],음유시인:['음유시인','댄서','악사'],힐러:['힐러','사제','수도사','암흑술사'],도적:['도적','격투가','듀얼블레이드']};
export function filterDesktopClasses<T extends {id:string;name:string}>(rows:T[],family:string,drafts:Record<string,DesktopClassDraft>,paused:Set<string>):T[]{
  return rows.filter(row=>family==='전체'||families[family]?.includes(row.name)||!!drafts[row.id]?.error||paused.has(row.id));
}
export function DesktopClasses({selected,pending,locked,classDrafts={},onClassDraft,onRevertClassDraft}:{selected:DesktopDetails|null;pending:PendingEdit[];locked:boolean;classDrafts?:Record<string,DesktopClassDraft>;onClassDraft?(id:string,text:string):void;onRevertClassDraft?(id:string):void}){
  const [family,setFamily]=useState('전체');
  if(!selected)return <p>캐릭터를 선택하면 저장된 클래스 레벨을 볼 수 있어요.</p>;
  const scoped=pending.filter((e):e is ClassPendingEdit=>e.kind==='class'&&e.accountId===selected.accountId&&e.characterId===selected.characterId);
  const paused=new Set(scoped.filter(e=>['unknown','conflict','expired'].includes(e.phase)).map(e=>e.classId));
  const rows=filterDesktopClasses(selected.details.classes,family,classDrafts,paused);
  return <div className="iris-classes">
    <p className="iris-class-guide">생텀에 저장된 레벨이에요. 숫자나 게이지로 직접 수정해요.</p>
    <nav className="iris-class-filters" aria-label="클래스 계열">{['전체',...Object.keys(families)].map(name=><button key={name} type="button" className="iris-desktop-button" aria-pressed={family===name} onClick={()=>setFamily(name)}>{name}</button>)}</nav>
    <div className="iris-class-list" data-scrollable={family==='전체'||rows.length>4}>{rows.map(row=>{
      const edits=scoped.filter(e=>e.classId===row.id).sort((a,b)=>b.revision-a.revision);
      const editable=selected.writeContext.classes?.find(c=>c.classId===row.id)?.editable===true;
      const draft=classDrafts[row.id],text=draft?.text??String(edits[0]?.desiredLevel??row.level??'');
      const numeric=/^\d+$/.test(text)?Number(text):NaN;
      const valid=Number.isSafeInteger(numeric)&&numeric>=1&&numeric<=1000;
      const value=valid?numeric:1,max=Math.max(65,value),errorId='iris-class-error-'+row.id;
      const disabled=locked||!editable||!onClassDraft||paused.has(row.id);
      return <div key={row.id} className="iris-class-row">
        <label><span className="iris-class-name"><i aria-hidden="true" className="iris-class-icon" style={{maskImage:`url('/svgs/classes/${encodeURIComponent(row.name)}.svg')`}}/>{row.name}</span><span className="iris-level-label">Lv.</span><input type="text" inputMode="numeric" className="iris-class-input" aria-label={row.name+' 레벨'} aria-invalid={!!draft?.error} aria-describedby={draft?.error?errorId:undefined} autoComplete="off" maxLength={12} placeholder="미등록" value={text} disabled={disabled} onChange={e=>onClassDraft?.(row.id,e.target.value)}/></label>
        <div className="iris-class-gauge"><span>1</span><input type="range" aria-label={row.name+' 레벨 게이지'} min={1} max={max} value={value} disabled={disabled||!!draft?.error} style={{background:`linear-gradient(to right, var(--accent) ${(value-1)/(max-1)*100}%, var(--inner-box) ${(value-1)/(max-1)*100}%)`}} onChange={e=>onClassDraft?.(row.id,e.target.value)}/><span>{max}</span></div>
        {!editable&&<p>저장된 값을 웹에서 확인해 주세요.</p>}
        {paused.has(row.id)&&<p>저장 상태 확인이 필요해요. 위의 복구 안내를 확인해 주세요.</p>}
        {draft?.error&&<div><p id={errorId} role="alert">{draft.error}</p><button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>onRevertClassDraft?.(row.id)}>입력 되돌리기</button></div>}
      </div>;
    })}{rows.length===0&&<p>이 계열에 등록된 클래스가 없어요.</p>}</div>
    <p className="iris-class-guide">게임에서 자동으로 읽은 레벨이 아니에요. 변경은 마지막 조작 후 15초 뒤 저장돼요.</p>
  </div>;
}
