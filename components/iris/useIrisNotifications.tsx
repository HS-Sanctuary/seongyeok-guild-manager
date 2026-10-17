'use client';
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';import {createIrisNotificationQueue,type IrisInformationNotice,type VisibleIrisNotice} from '@/lib/irisNotificationQueue';import type {FloatingState} from '@/lib/irisFloating';import {DesktopNotificationHost,type CharacterNotice} from './DesktopNotificationHost';
type Api={push(n:IrisInformationNotice,sound?:()=>Promise<void>):void;remove(key:string):void;character(n:CharacterNotice):void;clearCharacter(key:string):void};
type View={information:VisibleIrisNotice|null;character:CharacterNotice|null;now:number;pending:number;dismiss(key:string):void;collapse():void;reopen():void;hasCharacter:boolean};
const Actions=createContext<Api|null>(null),Display=createContext<View|null>(null);
export function useIrisNotifications(){return useContext(Actions);}
export function IrisNotificationsProvider({scope,floating,onNoticeKind,children}:{scope:string;floating:FloatingState|null;onNoticeKind(k:'none'|'information'|'character'):Promise<void>;children:ReactNode}){
 const queue=useMemo(()=>createIrisNotificationQueue(scope),[scope]),[revision,setRevision]=useState(0),[now,setNow]=useState(()=>Date.now()),[character,setCharacter]=useState<CharacterNotice|null>(null),[collapsed,setCollapsed]=useState<string|null>(null);const sounds=useRef(new Map<string,()=>Promise<void>>()),played=useRef(new Set<string>());
 const api=useMemo<Api>(()=>({push(n,sound){queue.push(n);if(sound)sounds.current.set(n.key,sound);setRevision(r=>r+1);},remove(key){queue.remove(key);sounds.current.delete(key);setRevision(r=>r+1);},character(n){setCharacter(n);},clearCharacter(key){setCharacter(c=>c?.key===key?null:c);}}),[queue]);
 const validCharacter=character?.scope===scope?character:null,visibleCharacter=validCharacter&&collapsed!==validCharacter.key?validCharacter:null;
 const kind=visibleCharacter?'character':queue.state().visible||queue.state().pending.length?'information':'none';
 useEffect(()=>{if(!visibleCharacter)return;const outside=(event:PointerEvent)=>{if(!(event.target as Element).closest?.('.iris-notification-bubble,.iris-floating-logo'))setCollapsed(visibleCharacter.key);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[visibleCharacter]);
 useEffect(()=>{void onNoticeKind(kind);},[kind,onNoticeKind]);
 const canShow=!visibleCharacter&&(floating?.mode!=='floating'||!!floating.layout.bubble||floating.surface!=='none');
 useEffect(()=>{let live=true;const tick=()=>{if(!live)return;const at=Date.now();queue.tick(at);if(canShow)queue.show(at);setNow(at);setRevision(r=>r+1);};queueMicrotask(tick);const timer=setInterval(tick,100);document.addEventListener('visibilitychange',tick);return()=>{live=false;clearInterval(timer);document.removeEventListener('visibilitychange',tick);};},[queue,canShow]);
 const previousMenu=useRef(false);
 const candidateKey=validCharacter?.key??null;
 useEffect(()=>{const wasOpen=previousMenu.current;previousMenu.current=!!floating?.menuOpen;if(floating?.menuOpen&&candidateKey)queueMicrotask(()=>setCollapsed(candidateKey));else if(wasOpen)queueMicrotask(()=>setCollapsed(null));},[floating?.menuOpen,candidateKey]);
 const snapshot=queue.state();
 useEffect(()=>{const current=snapshot.visible;if(!canShow||!current||played.current.has(current.notice.key))return;played.current.add(current.notice.key);const sound=sounds.current.get(current.notice.key);if(current.notice.sound&&sound)void sound().catch(()=>{});},[snapshot.visible,canShow]);
 useEffect(()=>{sounds.current.clear();played.current.clear();},[scope]);
 const dismiss=useCallback((key:string)=>{queue.dismiss(key);sounds.current.delete(key);setRevision(r=>r+1);},[queue]);const collapse=useCallback(()=>setCollapsed(validCharacter?.key??null),[validCharacter?.key]);
 const view:View={information:canShow?snapshot.visible:null,character:visibleCharacter,now,pending:snapshot.pending.length,dismiss,collapse,reopen:()=>setCollapsed(null),hasCharacter:!!validCharacter};
 void revision;return <Actions.Provider value={api}><Display.Provider value={view}>{children}</Display.Provider></Actions.Provider>;
}
export function DesktopNotificationLayer(){const v=useContext(Display);return v?<DesktopNotificationHost {...v} onDismiss={v.dismiss} onCharacterCollapse={v.collapse}/>:null;}
export function DesktopCharacterPrompt({notice}:{notice:CharacterNotice}){const api=useContext(Actions);useEffect(()=>{api?.character(notice);return()=>api?.clearCharacter(notice.key);},[api,notice]);return null;}
export function DesktopPendingCharacterButton(){const v=useContext(Display);return v?.hasCharacter&&!v.character?<button type="button" className="iris-desktop-button" onClick={v.reopen}>캐릭터 확인</button>:null;}
