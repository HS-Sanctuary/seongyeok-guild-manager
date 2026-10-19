'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {acceptFloatingRevision,parseFloatingState,type FloatingCommand,type FloatingPreferences,type FloatingState} from '@/lib/irisFloating';
import {parseDesktopWindowEvent} from '@/lib/irisDesktopStore';
import {useDesktopFloatingDialogs} from './useDesktopFloatingDialogs';
import {useDesktopFloatingFocus} from './useDesktopFloatingFocus';
type Store={floatingState():Promise<FloatingState>;floatingCommand(c:FloatingCommand):Promise<FloatingState>;setFloatingNotice(k:'none'|'information'|'character',height?:number):Promise<FloatingState>;setFloatingPreferences(p:FloatingPreferences):Promise<FloatingState>;returnGameFocus?():Promise<boolean>};
export function useDesktopFloating(store:Store|null){
 const [state,setState]=useState<FloatingState|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const generation=useRef(0),latest=useRef<FloatingState|null>(null),chain=useRef<Promise<unknown>>(Promise.resolve()),inFlight=useRef(0);
 useEffect(()=>{const epoch=++generation.current;latest.current=null;const accept=(s:FloatingState)=>{if(epoch!==generation.current)return;const next=acceptFloatingRevision(latest.current,parseFloatingState(s));latest.current=next;setState(next);};if(store)void store.floatingState().then(accept).catch(()=>{});const changed=(e:Event)=>{const context=(window as Window&{__irisDesktopBridge?:{epoch:number;environment:string}}).__irisDesktopBridge;const event=parseDesktopWindowEvent((e as CustomEvent).detail,context??null);if(event?.kind==='window.floating.changed')accept(event.state);};window.addEventListener('iris-floating-state',changed);return()=>{generation.current=epoch+1;window.removeEventListener('iris-floating-state',changed);};},[store]);
 const perform=useCallback((action:(s:Store)=>Promise<FloatingState>,serial=false)=>{if(!store)return Promise.resolve();const epoch=generation.current;inFlight.current++;setBusy(true);const invoke=async()=>{if(epoch!==generation.current)return;try{const reply=await action(store);if(epoch===generation.current){const next=acceptFloatingRevision(latest.current,reply);latest.current=next;setState(next);setError('');}}catch{if(epoch===generation.current)setError('설정을 적용하지 못했어요. 단축키 충돌 또는 앱 연결을 확인해 주세요. 기존 설정은 유지돼요.');}};const request=serial?chain.current.catch(()=>{}).then(invoke):invoke();if(serial)chain.current=request;return request.finally(()=>{if(epoch===generation.current){inFlight.current=Math.max(0,inFlight.current-1);setBusy(inFlight.current>0);}});},[store]);
 const noticeKind=useRef<'none'|'information'|'character'>('none');
 const command=useCallback((c:FloatingCommand)=>perform(s=>s.floatingCommand(c)),[perform]);const setNotice=useCallback((k:'none'|'information'|'character')=>{noticeKind.current=k;return perform(s=>s.setFloatingNotice(k),true);},[perform]);const preferences=useCallback((p:Partial<FloatingPreferences>)=>perform(s=>{if(!latest.current)throw Error('플로팅 연결을 확인해 주세요.');return s.setFloatingPreferences({...latest.current.preferences,...p});},true),[perform]);
 const resizeNotice=useCallback((height:number)=>perform(s=>s.setFloatingNotice(noticeKind.current,height),true),[perform]);
 const dialogCommand=useCallback((c:FloatingCommand)=>perform(s=>s.floatingCommand(c),true),[perform]);
 useDesktopFloatingDialogs(state,dialogCommand);
 const returnFocus=useCallback(()=>store?.returnGameFocus?.()??Promise.resolve(false),[store]);
 useDesktopFloatingFocus(state,returnFocus);
 return {state,supported:!!state,busy,error,command,setNotice,resizeNotice,preferences};
}
