'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createDesktopQueue} from '@/lib/irisDesktopQueue';
import {createDesktopController} from '@/lib/irisDesktopController';
import {createDesktopTransport,type DesktopAccount} from '@/lib/irisDesktopTransport';
import {createDesktopStore,type DesktopOverlayState} from '@/lib/irisDesktopStore';
import {DesktopLogin} from '@/components/iris/DesktopLogin';
import {DesktopAccountPanel} from '@/components/iris/DesktopAccountPanel';
import {DesktopCenter} from '@/components/iris/DesktopCenter';
import {DesktopSaveStatus,DesktopCloseDialog} from '@/components/iris/DesktopSaveStatus';
import './desktop.css';
type Controller=ReturnType<typeof createDesktopController>;
type NativeContext={epoch:number;environment:string};
type NativeWindow=Window & {__irisDesktopBridge?:NativeContext;chrome?:{webview:Parameters<typeof createDesktopStore>[0]['channel']}};
export default function DesktopPage() {
  const controller=useRef<Controller|null>(null),starting=useRef(false);
  const protectedStore=useRef<ReturnType<typeof createDesktopStore>|null>(null);
  const [closing,setClosing]=useState(false);
  const [closeFailed,setCloseFailed]=useState(false);
  const [overlay,setOverlay]=useState<DesktopOverlayState|null>(null),[overlayError,setOverlayError]=useState(''),[overlayBusy,setOverlayBusy]=useState(false);
  const overlayRun=async(action:(store:ReturnType<typeof createDesktopStore>)=>Promise<DesktopOverlayState>)=>{if(!protectedStore.current)return;setOverlayBusy(true);setOverlayError('');try{setOverlay(await action(protectedStore.current));}catch{setOverlayError('오버레이 설정 연결을 확인해 주세요. 트레이에서 입력을 복구할 수 있어요.');}finally{setOverlayBusy(false);}};
  const cancelClose=useCallback(()=>setClosing(false),[]);
  const [state,setState]=useState<ReturnType<Controller['state']>|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(0),[remembered,setRemembered]=useState<DesktopAccount[]>([]);
  const publish=useCallback(()=>{if(controller.current)setState(controller.current.state());},[]);
  const run=useCallback(async(action:(c:Controller)=>Promise<void>,block=false)=>{
    const c=controller.current;if(!c)return;
    setError('');setNow(Date.now());if(block)setBusy(true);
    try {const operation=action(c);publish();await operation;return true;}
    catch(e){setError(e instanceof Error?e.message:'연결을 확인해 주세요.');return false;}
    finally{publish();if(block)setBusy(false);}
  },[publish]);
  useEffect(()=>{
    let alive=true;
    const start=async()=>{
      const native=window as NativeWindow,context=native.__irisDesktopBridge;
      if(starting.current||controller.current||!context||!native.chrome?.webview)return;
      starting.current=true;
      try {
        const queue=createDesktopQueue({environment:context.environment,now:Date.now,id:()=>crypto.randomUUID()});
        const store=createDesktopStore({channel:native.chrome.webview,context:()=>native.__irisDesktopBridge??null,environment:context.environment});
        protectedStore.current=store;
        const c=createDesktopController({queue,store,transport:createDesktopTransport({fetch:window.fetch.bind(window)}),environment:context.environment});
        controller.current=c;await c.start();if(alive)publish();
        try {const value=await store.overlayState();if(alive)setOverlay(value);}catch{if(alive)setOverlayError('새 창으로 다시 실행하면 오버레이 설정을 사용할 수 있어요.');}
      } catch(e){if(alive){setError(e instanceof Error?e.message:'앱 연결을 확인해 주세요.');publish();}}
      finally{starting.current=false;}
    };
    void start();window.addEventListener('iris-desktop-ready',start);
    // KST 06:00 is UTC 21:00: shift by three hours to compare game-day boundaries.
    const gameDay=()=>Math.floor((Date.now()+3*3600000)/86400000);
    let day=gameDay(),refreshing=false,lastRefresh=0;
    const refresh=()=>{const c=controller.current;if(!alive||!c||refreshing||Date.now()-lastRefresh<30000)return;refreshing=true;lastRefresh=Date.now();void c.refresh().then(publish).catch(e=>{setError(e instanceof Error?e.message:'기간을 확인해 주세요.');publish();}).finally(()=>{refreshing=false;});};
    const visible=()=>{if(document.visibilityState==='visible')refresh();};
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visible);
    const interval=setInterval(()=>{if(!alive)return;setNow(Date.now());if(gameDay()!==day){day=gameDay();lastRefresh=0;refresh();}const c=controller.current;if(c){void c.tick().then(publish).catch(e=>{setError(e instanceof Error?e.message:'저장 상태를 확인해 주세요.');publish();});publish();}},1000);
    const warn=(e:BeforeUnloadEvent)=>{if(controller.current?.state().queue.entries.length){e.preventDefault();e.returnValue='';}};
    window.addEventListener('beforeunload',warn);
    const close=()=>setClosing(true);window.addEventListener('iris-desktop-close',close);
    const overlayChanged=(event:Event)=>{const native=window as NativeWindow;const detail=(event as CustomEvent).detail;if(detail?.epoch===native.__irisDesktopBridge?.epoch)void protectedStore.current?.overlayState().then(value=>{if(alive)setOverlay(value);}).catch(()=>{if(alive)setOverlayError('오버레이 상태를 확인해 주세요.');});};
    window.addEventListener('iris-overlay-state',overlayChanged);
    return()=>{alive=false;clearInterval(interval);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visible);window.removeEventListener('iris-desktop-ready',start);window.removeEventListener('beforeunload',warn);window.removeEventListener('iris-desktop-close',close);window.removeEventListener('iris-overlay-state',overlayChanged);};
  },[publish]);
  useEffect(()=>{
    try {
      const raw:unknown=JSON.parse(localStorage.getItem('iris_desktop_accounts:v1')??'[]');
      const safe:DesktopAccount[]=Array.isArray(raw)?raw.filter(a=>a&&typeof a.id==='string'&&typeof a.nickname==='string'&&typeof a.role==='string').slice(0,20).map(a=>({id:a.id,nickname:a.nickname,role:a.role})):[];
      if(state?.account){const current=state.account;const next=[current,...safe.filter(a=>a.id!==current.id)].slice(0,20);localStorage.setItem('iris_desktop_accounts:v1',JSON.stringify(next));setRemembered(next);}else setRemembered(safe);
    }catch{/* Display metadata is optional; never use it as authentication. */}
  },[state?.account?.id,state?.account?.nickname,state?.account?.role]);
  const account=state?.account,selected=state?.selected??null,locked=!state||state.locked||busy;
  const entries=state?.queue.entries.filter(e=>e.accountId===account?.id)??[];
  return <main className="iris-desktop">
    {closing&&<DesktopCloseDialog busy={busy} storageFailed={state?.durabilityError||closeFailed} onCancel={cancelClose} onChoose={action=>void run(async c=>{await c.shutdown(action);await protectedStore.current?.close();},true).then(ok=>{if(!ok)setCloseFailed(true);})} onUnsafeClose={()=>void run(async c=>{await c.shutdownWithoutSaving();await protectedStore.current?.close();},true)}/>}
    {!account&&<header className="iris-hud-header"><h1 className="font-bold text-[var(--accent)]">IRIS · 생텀 센터</h1></header>}
    {error&&<p role="alert" className="rounded-2xl border border-[var(--accent)] p-4">{error}{state?.durabilityError&&' 미저장 변경 보관에 실패했어요. 재시작 전에 복구가 필요해요.'}</p>}
    {!state?<p role="status">IRIS 전용 앱에서 열면 보호된 대기함과 연결돼요. 일반 브라우저에서는 편집하지 않아요.</p>:!account?<section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5"><DesktopLogin busy={state.durabilityError||busy} onLogin={async(n,code,keep)=>{await run(c=>c.login(n,code,keep),true);}}/></section>:<>
      <DesktopCenter account={account} characters={state.characters} selected={selected} pending={entries} locked={locked} classDrafts={state.classDrafts} onClassDraft={(id,text)=>void run(c=>c.setClassDraft(id,text))} onRevertClassDraft={id=>void run(c=>c.revertClassDraft(id))} onClose={()=>setClosing(true)} onSelectCharacter={id=>void run(c=>c.selectCharacter(id))} onEdit={(key,base,desired)=>void run(c=>c.edit(key,base,desired))}
        accountPanel={<DesktopAccountPanel account={account} remembered={remembered} busy={locked} onSwitch={async id=>{await run(c=>c.switchAccount(id),true);}} onLogout={async()=>{await run(c=>c.logout('keep'),true);}} onLogin={async(n,code,keep)=>{await run(c=>c.login(n,code,keep),true);}}/>}
        overlayPanel={<div className="my-2 space-y-2 text-sm">{overlayError&&<p role="alert">{overlayError}</p>}<p>{overlay?.shortcutsAvailable?'Ctrl+Alt+I 표시 · Ctrl+Alt+O 클릭 통과':'단축키 연결 전에는 클릭 통과를 사용할 수 없어요.'}</p><button className="iris-desktop-button" type="button" disabled={overlayBusy||!overlay?.shortcutsAvailable} onClick={()=>void overlayRun(s=>s.setClickThrough(!overlay?.clickThrough))}>{overlay?.clickThrough?'클릭 통과 끄기':'클릭 통과 켜기'}</button><fieldset><legend>불투명도 {overlay?.opacityPercent??100}%</legend><div className="flex flex-wrap gap-2">{[50,75,100].map(percent=><button className="iris-desktop-button" type="button" key={percent} aria-pressed={overlay?.opacityPercent===percent} disabled={overlayBusy||!overlay} onClick={()=>void overlayRun(s=>s.setOpacityPercent(percent))}>{percent}%</button>)}</div></fieldset></div>}
        characterStatus={!state.charactersLoaded?<div className="space-y-2"><p>{locked?'캐릭터 목록을 불러오고 있어요.':'캐릭터 목록을 불러오지 못했어요. 로그인은 유지돼요.'}</p><button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>void run(c=>c.reloadCharacters(),true)}>캐릭터 다시 불러오기</button></div>:state.characters.length===0?<p>본인 계정에 등록된 캐릭터가 없어요.</p>:null}
        saveStatus={<DesktopSaveStatus entries={entries} characters={state.characters} selected={selected} hasInvalidClassDraft={state.hasInvalidClassDraft} lastSaveConfirmation={state.lastSaveConfirmation} now={now} locked={locked||!selected} onSave={()=>void run(c=>c.saveNow())} onDiscard={()=>void run(c=>c.discard())} onRecover={(id,action)=>void run(c=>c.recover(id,action))}/>}/>
    </>}
  </main>;
}
