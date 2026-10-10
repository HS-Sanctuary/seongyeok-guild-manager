'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {DesktopAccount,DesktopCharacter,DesktopDetails} from '@/lib/irisDesktopTransport';
import type {PendingEdit,TaskKey} from '@/lib/irisDesktopQueue';
import type {DesktopClassDraft} from '@/lib/irisDesktopController';
import {DesktopCheckboard} from './DesktopCheckboard';
import {DesktopClasses} from './DesktopClasses';
import {KronosIcon,SynaxisIcon} from './DesktopIcons';
const kronosTabs={homework:'숙제',classes:'클래스',stats:'스탯',currencies:'재화',barter:'물물교환',shop:'상점구매',missions:'임무게시판'} as const;
const sections={kronos:'크로노스',synaxis:'시낙시스'} as const;
export type DesktopTab=keyof typeof kronosTabs|'synaxis'|'settings';
export function DesktopCenter({account,characters,selected,pending,locked,saveStatus,contextActions,settingsOpen=false,settingsPanel,statsPanel,currenciesPanel,barterPanel,shopPanel,missionsPanel,synaxisPanel,synaxisUnread=false,onTabChange,characterStatus,characterPickerRequest=0,classDrafts,onClassDraft,onRevertClassDraft,onSelectCharacter,onEdit}:{account:DesktopAccount;characters:DesktopCharacter[];selected:DesktopDetails|null;pending:PendingEdit[];locked:boolean;saveStatus:ReactNode;contextActions?:ReactNode;settingsOpen?:boolean;settingsPanel?:ReactNode;statsPanel?:ReactNode|((active:boolean)=>ReactNode);currenciesPanel?:(active:boolean)=>ReactNode;barterPanel?:ReactNode;shopPanel?:ReactNode;missionsPanel?:ReactNode;synaxisPanel?:(active:boolean)=>ReactNode;synaxisUnread?:boolean;onTabChange?(tab:DesktopTab):void;characterStatus?:ReactNode;characterPickerRequest?:number;classDrafts?:Record<string,DesktopClassDraft>;onClassDraft?(id:string,text:string):void;onRevertClassDraft?(id:string):void;onSelectCharacter(id:string):void;onEdit(key:TaskKey,base:number,desired:number):void}){
  const [section,setSection]=useState<keyof typeof sections>('kronos'),[kronosTab,setKronosTab]=useState<keyof typeof kronosTabs>('homework'),[picker,setPicker]=useState(false),[remaining,setRemaining]=useState(false);
  const tab:DesktopTab=settingsOpen?'settings':section==='kronos'?kronosTab:section;
  const choose=(next:Exclude<DesktopTab,'settings'>)=>{if(tab!==next){if(next==='synaxis')setSection(next);else{setSection('kronos');setKronosTab(next);}onTabChange?.(next);}setPicker(false);};
  const pickerButton=useRef<HTMLButtonElement>(null);
  const pickerList=useRef<HTMLElement>(null);
  useEffect(()=>{if(!characterPickerRequest)return;queueMicrotask(()=>{setPicker(true);pickerButton.current?.focus();});},[characterPickerRequest]);
  useEffect(()=>{
    if(!picker)return;
    const outside=(e:PointerEvent)=>{if(!pickerList.current?.contains(e.target as Node)&&!pickerButton.current?.contains(e.target as Node))setPicker(false);};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPicker(false);pickerButton.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[picker]);
  const current=characters.find(c=>c.id===selected?.characterId);
  return <section className="iris-hud" data-active-tab={tab} aria-label="IRIS 센터">
    <div className="iris-context-header">
    <div className="iris-character-bar"><button ref={pickerButton} type="button" className="iris-desktop-button iris-character-trigger" aria-expanded={picker} aria-controls="iris-character-list" aria-label="캐릭터 선택" onClick={()=>setPicker(!picker)}><span className="iris-selected-identity"><small>생텀 선택</small><strong>{current?.nickname??'캐릭터 선택'}</strong></span><span className="iris-selected-job">{current?.job??account.nickname} ▾</span></button><span className="iris-connection-dot" title="생텀 계정 연결됨" aria-label="생텀 계정 연결됨"/>{contextActions}</div>
    <section ref={pickerList} id="iris-character-list" role="region" aria-label="내 캐릭터" hidden={!picker} className="iris-character-list">{characters.map(c=><button type="button" key={c.id} className="iris-desktop-button" aria-pressed={selected?.characterId===c.id} disabled={locked} onClick={()=>{onSelectCharacter(c.id);setPicker(false);pickerButton.current?.focus();}}>{c.nickname}<span className="block text-sm">{c.job}{pending.some(e=>e.characterId===c.id)?' · 미저장 변경':''}</span></button>)}</section>
    </div>
    {characterStatus}
    {saveStatus}
    <div className="iris-center-content" hidden={settingsOpen}>
      <nav className="iris-hud-tabs iris-main-tabs" aria-label="상위 메뉴">{Object.entries(sections).map(([id,title])=><button type="button" key={id} className="iris-desktop-button" disabled={locked} aria-pressed={section===id} aria-controls={'iris-pane-'+id} onClick={()=>choose(id==='kronos'?kronosTab:'synaxis')}><span className="iris-main-tab-icon" aria-hidden="true">{id==='kronos'?<KronosIcon/>:<SynaxisIcon/>}</span><span>{title}</span>{id==='synaxis'&&synaxisUnread&&<span className="iris-party-red-dot" role="status" aria-label="새 파티 또는 길드버스"/>}</button>)}</nav>
      <div id="iris-pane-kronos" className="iris-kronos-content" hidden={section!=='kronos'}>
      <nav className="iris-hud-tabs iris-kronos-tabs" aria-label="크로노스 기능">{Object.entries(kronosTabs).map(([id,title])=><button type="button" key={id} className="iris-desktop-button" disabled={locked} aria-pressed={kronosTab===id} aria-controls={'iris-pane-'+id} onClick={()=>choose(id as keyof typeof kronosTabs)}>{title}</button>)}</nav>
      <section id="iris-pane-homework" aria-label="숙제" hidden={tab!=='homework'} className="iris-hud-body"><DesktopCheckboard selected={selected} pending={pending} locked={locked} remainingOnly={remaining} onRemainingChange={setRemaining} onEdit={onEdit}/></section>
      <section id="iris-pane-classes" aria-label="클래스" hidden={tab!=='classes'} className="iris-hud-body"><DesktopClasses selected={selected} pending={pending} locked={locked} classDrafts={classDrafts} onClassDraft={onClassDraft} onRevertClassDraft={onRevertClassDraft}/></section>
      <section id="iris-pane-stats" aria-label="스탯" hidden={tab!=='stats'} className="iris-hud-body">{typeof statsPanel==='function'?statsPanel(tab==='stats'):statsPanel??<p>전용 앱에서 게임 스탯을 연결해 주세요.</p>}</section>
      <section id="iris-pane-currencies" aria-label="재화" hidden={tab!=='currencies'} className="iris-hud-body">{currenciesPanel?.(tab==='currencies')}</section>
      <section id="iris-pane-barter" aria-label="물물교환" hidden={tab!=='barter'} className="iris-hud-body">{barterPanel??<p>캐릭터를 선택하면 저장된 물물교환 기록을 볼 수 있어요.</p>}</section>
      <section id="iris-pane-shop" aria-label="상점구매" hidden={tab!=='shop'} className="iris-hud-body">{shopPanel}</section>
      <section id="iris-pane-missions" aria-label="임무게시판" hidden={tab!=='missions'} className="iris-hud-body">{missionsPanel}</section>
      </div>
      <section id="iris-pane-synaxis" aria-label="시낙시스" hidden={tab!=='synaxis'} className="iris-hud-body">{synaxisPanel?.(tab==='synaxis')??<p>파티 생성 연결을 확인해주세요.</p>}</section>
    </div>
    {settingsOpen&&settingsPanel}
  </section>;
}
