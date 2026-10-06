'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {DesktopAccount,DesktopCharacter,DesktopDetails} from '@/lib/irisDesktopTransport';
import type {PendingEdit,TaskKey} from '@/lib/irisDesktopQueue';
import {DesktopCheckboard} from './DesktopCheckboard';
const tabs={homework:'숙제',stats:'스탯',synaxis:'시낙시스',settings:'설정'} as const;
const themes={lumen:'루멘',elysium:'엘리시움',aureum:'아우레움',nemeton:'네메톤',vesper:'베스퍼',rosarium:'로사리움'};
export function DesktopCenter({account,characters,selected,pending,locked,saveStatus,accountPanel,overlayPanel,characterStatus,onSelectCharacter,onEdit,onClose}:{account:DesktopAccount;characters:DesktopCharacter[];selected:DesktopDetails|null;pending:PendingEdit[];locked:boolean;saveStatus:ReactNode;accountPanel:ReactNode;overlayPanel?:ReactNode;characterStatus?:ReactNode;onSelectCharacter(id:string):void;onEdit(key:TaskKey,base:number,desired:number):void;onClose():void}){
  const [tab,setTab]=useState<keyof typeof tabs>('homework'),[folded,setFolded]=useState(false),[picker,setPicker]=useState(false),[remaining,setRemaining]=useState(false);
  const pickerButton=useRef<HTMLButtonElement>(null);
  const pickerList=useRef<HTMLElement>(null);
  useEffect(()=>{
    if(!picker)return;
    const outside=(e:PointerEvent)=>{if(!pickerList.current?.contains(e.target as Node)&&!pickerButton.current?.contains(e.target as Node))setPicker(false);};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPicker(false);pickerButton.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[picker]);
  const current=characters.find(c=>c.id===selected?.characterId);
  return <section className="iris-hud" aria-label="IRIS 센터">
    <header className="iris-hud-header"><h1 className="font-bold text-[var(--accent)]">IRIS · 생텀 센터</h1><div className="flex gap-1"><button type="button" className="iris-desktop-button iris-icon-button" aria-label={folded?'센터 펼치기':'센터 접기'} aria-expanded={!folded} onClick={()=>setFolded(!folded)}>{folded?'＋':'−'}</button><button type="button" className="iris-desktop-button iris-icon-button" aria-label="IRIS 종료" onClick={onClose}>×</button></div></header>
    <div className="iris-character-bar"><button ref={pickerButton} type="button" className="iris-desktop-button iris-character-trigger" aria-expanded={picker} aria-controls="iris-character-list" aria-label="캐릭터 선택" onClick={()=>setPicker(!picker)}><span>{current?.nickname??'캐릭터 선택'}</span><span className="text-sm">{current?.job??account.nickname} ▾</span></button><span className="iris-connection-dot" title="생텀 계정 연결됨" aria-label="생텀 계정 연결됨"/></div>
    <section ref={pickerList} id="iris-character-list" role="region" aria-label="내 캐릭터" hidden={!picker} className="iris-character-list">{characters.map(c=><button type="button" key={c.id} className="iris-desktop-button" aria-pressed={selected?.characterId===c.id} disabled={locked} onClick={()=>{onSelectCharacter(c.id);setPicker(false);pickerButton.current?.focus();}}>{c.nickname}<span className="block text-sm">{c.job}{pending.some(e=>e.characterId===c.id)?' · 미저장 변경':''}</span></button>)}</section>
    {characterStatus}
    {saveStatus}
    <div hidden={folded}>
      <nav className="iris-hud-tabs" aria-label="센터 기능">{Object.entries(tabs).map(([id,title])=><button type="button" key={id} className="iris-desktop-button" aria-pressed={tab===id} aria-controls={'iris-pane-'+id} onClick={()=>{setTab(id as keyof typeof tabs);setPicker(false);}}>{title}</button>)}</nav>
      <section id="iris-pane-homework" aria-label="숙제" hidden={tab!=='homework'} className="iris-hud-body"><label className="iris-filter"><input type="checkbox" checked={remaining} onChange={e=>setRemaining(e.target.checked)}/>남은 숙제만</label><DesktopCheckboard selected={selected} pending={pending} locked={locked} remainingOnly={remaining} onEdit={onEdit}/></section>
      <section id="iris-pane-stats" aria-label="스탯" hidden={tab!=='stats'} className="iris-hud-body"><p>게임 스탯 연결을 검증하고 있어요.</p><p className="text-sm">캐릭터 식별이 확인되기 전에는 자동으로 저장하지 않아요. 기존 생텀 값은 유지돼요.</p></section>
      <section id="iris-pane-synaxis" aria-label="시낙시스" hidden={tab!=='synaxis'} className="iris-hud-body"><p>시낙시스 상태 연결은 아직 지원하지 않아요.</p><p className="text-sm">연결이 확인되면 여기에 표시할게요.</p></section>
      <section id="iris-pane-settings" aria-label="설정" hidden={tab!=='settings'} className="iris-hud-body"><div>{accountPanel}</div>{overlayPanel}<fieldset><legend className="text-sm">센터 테마</legend><div className="iris-theme-buttons">{Object.entries(themes).map(([id,name])=><button key={id} type="button" className="iris-desktop-button" onClick={()=>{document.documentElement.dataset.theme=id;}}>{name}</button>)}</div></fieldset><details className="text-sm"><summary>사용 안내</summary><p>생텀 숙제 기록만 저장해요. 게임 조작이나 보상 수령은 하지 않아요. 일간 06시, 주간 월요일 06시에 초기화돼요.</p></details></section>
    </div>
  </section>;
}
