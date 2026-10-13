'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {DesktopAccount,DesktopCharacter,DesktopDetails} from '@/lib/irisDesktopTransport';
import type {PendingEdit,TaskKey} from '@/lib/irisDesktopQueue';
import type {DesktopClassDraft} from '@/lib/irisDesktopController';
import {DesktopCharacterPicker} from './DesktopCharacterPicker';
import type {CharacterMetaDirectory,CharacterMetaIntent} from '@/lib/irisCharacterManagement';
import {DesktopCheckboard} from './DesktopCheckboard';
import {DesktopClasses} from './DesktopClasses';
import {DesktopMainTabs,type DesktopSection} from './DesktopMainTabs';
import {DesktopErgon} from './DesktopErgon';
import {DesktopFeaturePicker,kronosTabs} from './DesktopFeaturePicker';
export type DesktopTab=keyof typeof kronosTabs|'synaxis'|'ergon'|'settings';
export function DesktopCenter({account,characters,selected,pending,locked,saveStatus,contextActions,suspendDialogs=false,onCharacterDialogOpenChange,compact=false,onPanelOpenChange,contextPanelOpen=false,settingsOpen=false,settingsPanel,statsPanel,currenciesPanel,barterPanel,shopPanel,missionsPanel,alertsPanel,synaxisPanel,ergonPanel,synaxisUnread=false,onTabChange,characterStatus,characterPickerRequest=0,classDrafts,onClassDraft,onRevertClassDraft,onReadMetadata,onManageCharacter,onSelectCharacter,onEdit}:{account:DesktopAccount;characters:DesktopCharacter[];selected:DesktopDetails|null;pending:PendingEdit[];locked:boolean;saveStatus:ReactNode;contextActions?:ReactNode;suspendDialogs?:boolean;onCharacterDialogOpenChange?(open:boolean):void;compact?:boolean;onPanelOpenChange?(open:boolean):void;contextPanelOpen?:boolean;settingsOpen?:boolean;settingsPanel?:ReactNode;statsPanel?:ReactNode|((active:boolean)=>ReactNode);currenciesPanel?:(active:boolean)=>ReactNode;barterPanel?:ReactNode;shopPanel?:ReactNode;missionsPanel?:ReactNode;alertsPanel?:ReactNode;synaxisPanel?:(active:boolean)=>ReactNode;ergonPanel?:(active:boolean)=>ReactNode;synaxisUnread?:boolean;onTabChange?(tab:DesktopTab):void;characterStatus?:ReactNode;characterPickerRequest?:number;classDrafts?:Record<string,DesktopClassDraft>;onClassDraft?(id:string,text:string):void;onRevertClassDraft?(id:string):void;onReadMetadata?():Promise<CharacterMetaDirectory>;onManageCharacter?(intent:CharacterMetaIntent):Promise<void>;onSelectCharacter(id:string):void;onEdit(key:TaskKey,base:number,desired:number):void}){
  const [section,setSection]=useState<DesktopSection>('kronos'),[kronosTab,setKronosTab]=useState<keyof typeof kronosTabs>('homework'),[picker,setPicker]=useState(false),[remaining,setRemaining]=useState(false);
  const tab:DesktopTab=settingsOpen?'settings':section==='kronos'?kronosTab:section;
  const choose=(next:Exclude<DesktopTab,'settings'>)=>{if(tab!==next){if(next==='synaxis'||next==='ergon')setSection(next);else{setSection('kronos');setKronosTab(next);}onTabChange?.(next);}setPicker(false);if(compact)setTemporaryOpen(true);};
  useEffect(()=>{onCharacterDialogOpenChange?.(picker);},[picker,onCharacterDialogOpenChange]);
  const pickerButton=useRef<HTMLButtonElement>(null);
  const [temporaryOpen,setTemporaryOpen]=useState(false);const surface=useRef<HTMLElement>(null);
  useEffect(()=>{queueMicrotask(()=>setTemporaryOpen(false));},[compact]);
  useEffect(()=>{onPanelOpenChange?.(compact&&temporaryOpen);},[compact,temporaryOpen,onPanelOpenChange]);
  useEffect(()=>{if(!compact||!temporaryOpen)return;const dismiss=()=>setTemporaryOpen(false),outside=(e:PointerEvent)=>{if((e.target as Element).closest?.('[data-iris-save-overlay]'))return;if(!surface.current?.contains(e.target as Node))dismiss();},escape=(e:KeyboardEvent)=>{if(e.key==='Escape')dismiss();};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);window.addEventListener('blur',dismiss);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('blur',dismiss);};},[compact,temporaryOpen]);
  useEffect(()=>{if(!characterPickerRequest)return;queueMicrotask(()=>{setPicker(true);pickerButton.current?.focus();});},[characterPickerRequest]);
  const current=characters.find(c=>c.id===selected?.characterId);
  return <section className="iris-hud" data-active-tab={tab} data-compact={compact} data-panel-open={temporaryOpen} ref={surface} aria-label="IRIS 센터">
    <div className="iris-context-header">
    <div className="iris-character-bar"><button ref={pickerButton} type="button" className="iris-desktop-button iris-character-trigger" aria-expanded={picker} aria-controls="iris-character-list" aria-label="캐릭터 선택" onClick={()=>setPicker(!picker)}><span className="iris-selected-identity"><small>생텀 선택</small><strong>{current?.nickname??'캐릭터 선택'}</strong></span><span className="iris-selected-job">{current?.job??account.nickname} ▾</span></button><span className="iris-connection-dot" title="생텀 계정 연결됨" aria-label="생텀 계정 연결됨"/>{contextActions}</div>
    {picker&&<DesktopCharacterPicker active={!suspendDialogs} characters={characters} selectedId={selected?.characterId??null} busy={locked} onSelect={onSelectCharacter} onClose={()=>{setPicker(false);pickerButton.current?.focus();}} onReadMetadata={onReadMetadata} onManage={onManageCharacter}/>}
    </div>
    {characterStatus}
    {saveStatus}
    <div className="iris-center-content" hidden={settingsOpen}>
      <DesktopMainTabs section={section} locked={locked} unread={synaxisUnread} onChoose={id=>choose(id==='kronos'?kronosTab:id)}/>
      <div id="iris-pane-kronos" className="iris-kronos-content" hidden={section!=='kronos'}>
      <DesktopFeaturePicker value={kronosTab} disabled={locked||contextPanelOpen} onChoose={choose}/>
      <section id="iris-pane-homework" aria-label="숙제" hidden={tab!=='homework'||(compact&&!temporaryOpen)} className="iris-hud-body"><DesktopCheckboard selected={selected} pending={pending} locked={locked} remainingOnly={remaining} onRemainingChange={setRemaining} onEdit={onEdit}/></section>
      <section id="iris-pane-classes" aria-label="클래스" hidden={tab!=='classes'||(compact&&!temporaryOpen)} className="iris-hud-body"><DesktopClasses selected={selected} pending={pending} locked={locked} classDrafts={classDrafts} onClassDraft={onClassDraft} onRevertClassDraft={onRevertClassDraft}/></section>
      <section id="iris-pane-stats" aria-label="스탯" hidden={tab!=='stats'||(compact&&!temporaryOpen)} className="iris-hud-body">{typeof statsPanel==='function'?statsPanel(tab==='stats'&&(!compact||temporaryOpen)):statsPanel??<p>전용 앱에서 게임 스탯을 연결해 주세요.</p>}</section>
      <section id="iris-pane-currencies" aria-label="재화" hidden={tab!=='currencies'||(compact&&!temporaryOpen)} className="iris-hud-body">{currenciesPanel?.(tab==='currencies'&&(!compact||temporaryOpen))}</section>
      <section id="iris-pane-barter" aria-label="물물교환" hidden={tab!=='barter'||(compact&&!temporaryOpen)} className="iris-hud-body">{barterPanel??<p>캐릭터를 선택하면 저장된 물물교환 기록을 볼 수 있어요.</p>}</section>
      <section id="iris-pane-shop" aria-label="상점구매" hidden={tab!=='shop'||(compact&&!temporaryOpen)} className="iris-hud-body">{shopPanel}</section>
      <section id="iris-pane-missions" aria-label="임무게시판" hidden={tab!=='missions'||(compact&&!temporaryOpen)} className="iris-hud-body">{missionsPanel}</section>
      <section id="iris-pane-alerts" aria-label="알림" hidden={tab!=='alerts'||(compact&&!temporaryOpen)} className="iris-hud-body">{alertsPanel}</section>
      </div>
      <section id="iris-pane-synaxis" aria-label="시낙시스" hidden={tab!=='synaxis'||(compact&&!temporaryOpen)} className="iris-hud-body">{synaxisPanel?.(tab==='synaxis'&&(!compact||temporaryOpen))??<p>파티 생성 연결을 확인해주세요.</p>}</section>
      <section id="iris-pane-ergon" aria-label="에르곤" hidden={tab!=='ergon'||(compact&&!temporaryOpen)} className="iris-hud-body">{ergonPanel?.(tab==='ergon'&&(!compact||temporaryOpen))??<DesktopErgon/>}</section>
    </div>
    {settingsOpen&&settingsPanel}
  </section>;
}
