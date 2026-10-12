'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {parseDesktopWindowEvent,type DesktopPresentation} from '@/lib/irisDesktopStore';
type Store={presentationState():Promise<DesktopPresentation>;togglePresentation():Promise<DesktopPresentation>;setPresentationPanel(open:boolean):Promise<DesktopPresentation>};
export function useDesktopPresentation(store:Store|null,panelOpen:boolean){
  const [state,setState]=useState<DesktopPresentation|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[modalOpen,setModalOpen]=useState(false);const running=useRef(false);
  useEffect(()=>{let alive=true;if(store)void store.presentationState().then(value=>{if(alive)setState(value);}).catch(()=>{if(alive)setError('접기 기능은 새 앱으로 다시 실행하면 사용할 수 있어요.');});const changed=(event:Event)=>{const native=window as Window&{__irisDesktopBridge?:{epoch:number;environment:string}};const message=parseDesktopWindowEvent((event as CustomEvent).detail,native.__irisDesktopBridge??null);if(alive&&message?.kind==='window.presentation.changed')setState(message.state);};window.addEventListener('iris-presentation-state',changed);return()=>{alive=false;window.removeEventListener('iris-presentation-state',changed);};},[store]);
  useEffect(()=>{const probe=()=>setModalOpen(!!document.querySelector('[role="dialog"]'));probe();const observer=new MutationObserver(probe);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();},[]);
  const desiredPanel=panelOpen||modalOpen,supported=!!state;
  useEffect(()=>{if(!supported||!store)return;let alive=true;void store.setPresentationPanel(desiredPanel).catch(()=>{if(alive)setError('창 높이를 맞추지 못했어요. 펼치기 버튼으로 복구해 주세요.');});return()=>{alive=false;};},[store,supported,desiredPanel]);
  const toggle=useCallback(async()=>{if(!store||running.current)return;running.current=true;setBusy(true);try{setState(await store.togglePresentation());setError('');}catch{setError('창을 접지 못했어요. 연결을 확인해 주세요.');}finally{running.current=false;setBusy(false);}},[store]);
  return {state,busy,error,toggle};
}
