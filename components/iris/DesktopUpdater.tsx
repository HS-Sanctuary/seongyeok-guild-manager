'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {createDesktopStore} from '@/lib/irisDesktopStore';
import {parseDesktopWindowEvent} from '@/lib/irisDesktopStore';
import type {DesktopUpdateState} from '@/lib/irisDesktopUpdate';
import {IRIS_UPDATE_NOTES_HREF} from '@/lib/irisRelease';
import {DesktopFocusDialog} from './DesktopFocusDialog';
import {readIrisUpdateNotes,type IrisUpdateNotes} from '@/lib/irisUpdateNotes';
import './updater.css';
type Store=ReturnType<typeof createDesktopStore>;
export function DesktopUpdater({store,disabled,onBeforeApply,onBusyChange,inlineTarget=null}:{store:Store|null;disabled:boolean;onBeforeApply():Promise<boolean>;onBusyChange(busy:boolean):void;inlineTarget?:HTMLElement|null}){
 const [state,setState]=useState<DesktopUpdateState|null>(null),[unsupported,setUnsupported]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const working=useRef(false),mounted=useRef(false),callbacks=useRef({onBeforeApply,onBusyChange});
 const [notesCache,setNotesCache]=useState<Record<string,IrisUpdateNotes|null>>({});
 const notesVersion=state?.availableVersion;
 const notesVisible=open||!!inlineTarget;
 useEffect(()=>{
  if(!notesVisible||!notesVersion||Object.hasOwn(notesCache,notesVersion))return;
  let alive=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  const accept=(value:IrisUpdateNotes|null)=>{if(alive)setNotesCache(cache=>({...cache,[notesVersion]:value}));};
  void readIrisUpdateNotes(notesVersion,controller.signal).then(accept).catch(()=>accept(null)).finally(()=>clearTimeout(timer));
  return()=>{alive=false;clearTimeout(timer);controller.abort();};
 },[notesVisible,notesVersion,notesCache]);
 useEffect(()=>{callbacks.current={onBeforeApply,onBusyChange};},[onBeforeApply,onBusyChange]);
 useEffect(()=>{
  mounted.current=true;let alive=true,checking=false;
  const check=async()=>{if(!store||checking||working.current||document.visibilityState==='hidden')return;checking=true;try{const current=await store.updateState();if(!alive)return;setState(current);const fresh=await store.updateCheck();if(alive)setState(fresh);}catch{if(alive)setUnsupported(true);}finally{checking=false;}};
  const changed=(event:Event)=>{const context=(window as Window&{__irisDesktopBridge?:{epoch:number;environment:string}}).__irisDesktopBridge;const value=parseDesktopWindowEvent((event as CustomEvent).detail,context??null);if(alive&&value?.kind==='window.update.changed')setState(value.state);};
  void check();window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);window.addEventListener('iris-update-state',changed);
  return()=>{alive=false;mounted.current=false;window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);window.removeEventListener('iris-update-state',changed);};
 },[store]);
 const begin=async()=>{
  if(!store||working.current||disabled)return;working.current=true;setBusy(true);setError('');callbacks.current.onBusyChange(true);
  let restarting=false,protectedClose=false;
  try{
   await store.setCloseDecision(true);protectedClose=true;
   const prepared=await store.updatePrepare();if(mounted.current)setState(prepared);
   if(prepared.phase!=='ready')throw Error('prepare_failed');
   if(!await callbacks.current.onBeforeApply()){if(mounted.current)setError('preserve_failed');return;}
   const result=await store.updateApply();if(result.phase!=='installing')throw Error('apply_failed');restarting=true;if(mounted.current)setState(result);
  }catch{if(mounted.current)setError('update_failed');}
  finally{if(!restarting){if(protectedClose)try{await store.setCloseDecision(false);}catch{/* Keep native protection if its connection changed. */}working.current=false;if(mounted.current){setBusy(false);callbacks.current.onBusyChange(false);}}}
 };
 const available=!!state?.availableVersion;
 const currentNotes=notesVersion?notesCache[notesVersion]:undefined;
 const preview=currentNotes?.sections.flatMap(section=>section.items).slice(0,2);
 const showDialog=()=>{setError('');setOpen(true);};
 const message=error==='preserve_failed'?'미저장 변경을 보관하지 못했어요. 입력과 저장 상태를 확인한 뒤 다시 시도해 주세요.':error?'업데이트를 완료하지 못했어요. 보호 기록은 지우지 않았어요. 앱이 잠긴 상태라면 정상 종료 후 다시 실행해 주세요.':state?.error==='prepare_failed'?'파일을 준비하지 못했어요. 연결과 폴더 쓰기 권한을 확인한 뒤 다시 시도해 주세요.':'';
 return <>
  <span className="iris-brand-version">{state?`Beta ${state.installedVersion}`:unsupported?'Beta · 수동 업데이트':'Beta · 앱 연결 대기'}</span>
  {state?.error==='check_failed'&&<span role="status" className="iris-update-check-error" title="업데이트 서버에 연결하지 못했어요. 연결을 확인한 뒤 IRIS를 정상 종료하고 다시 실행해 주세요.">업데이트 조회 실패</span>}
  {available&&<button type="button" className="iris-update-button" disabled={disabled||busy} aria-label={`IRIS ${state.availableVersion} 업데이트`} onClick={showDialog}>↑ 업데이트</button>}
  {inlineTarget&&available&&createPortal(<section aria-label="업데이트가 있어요" className="iris-update-inline">
   <div className="iris-update-inline-heading"><h3>업데이트가 있어요 <span>Beta {state.availableVersion}</span></h3><button type="button" className="iris-desktop-button" disabled={disabled||busy} onClick={showDialog}>업데이트 확인</button></div>
   <div className="iris-update-inline-preview">{currentNotes===undefined?<p role="status">변경 내용을 불러오는 중이에요…</p>:preview?<ul>{preview.map((item,index)=><li key={index}>{item}</li>)}</ul>:<p>변경 내용은 업데이트 창에서 자세한 노트로 확인할 수 있어요.</p>}</div>
  </section>,inlineTarget)}
  {open&&state&&<DesktopFocusDialog title="IRIS 업데이트" onClose={()=>setOpen(false)} dismissDisabled={busy}>
   <p>Beta {state.installedVersion} → Beta {state.availableVersion}</p>
   <section aria-label="이번 업데이트" className="iris-update-notes"><h3>이번 업데이트</h3>{currentNotes===undefined?<p role="status">변경 내용을 불러오는 중이에요…</p>:currentNotes?currentNotes.sections.map((section,index)=><div key={index}><h4>{section.title}</h4><ul>{section.items.map((item,itemIndex)=><li key={itemIndex}>{item}</li>)}</ul></div>):<p role="status">이 버전의 요약을 불러오지 못했어요. 자세한 업데이트 노트를 확인해 주세요.</p>}</section>
   <p className="iris-caption">새 파일을 확인한 뒤 미저장 변경을 보호 보관하고 IRIS를 다시 시작해요. 게임·로그인·테마 기록은 지우지 않아요.</p>
   <p className="iris-caption">무료 미서명 베타라 Windows에서 차단할 수 있어요. 보안 프로그램을 끄지 말고, 차단되면 중단하고 알려주세요.</p>
   {busy&&<p role="status">{state.phase==='downloading'?`다운로드 중 ${state.progress}%`:state.phase==='installing'?'업데이트 후 다시 시작해요.':'파일 확인·변경 보관 중…'}</p>}
   {message&&<p role="alert">{message}</p>}
   <div className="iris-update-actions"><button type="button" className="iris-desktop-button" disabled={disabled||busy} onClick={()=>void begin()}>업데이트하고 다시 시작</button><a className="iris-desktop-button" href={`https://sanctum-tawny-three.vercel.app${IRIS_UPDATE_NOTES_HREF}`} target="_blank" rel="noreferrer">업데이트 노트</a><button type="button" className="iris-desktop-button" disabled={busy} onClick={()=>setOpen(false)}>취소</button></div>
  </DesktopFocusDialog>}
 </>;
}
