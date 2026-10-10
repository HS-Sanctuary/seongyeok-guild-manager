'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createDesktopQueue} from '@/lib/irisDesktopQueue';
import {createDesktopController} from '@/lib/irisDesktopController';
import {createDesktopTransport,type DesktopAccount} from '@/lib/irisDesktopTransport';
import {createDesktopStore,parseDesktopWindowEvent,type DesktopAddonState,type DesktopAddonPreferences} from '@/lib/irisDesktopStore';
import {DesktopTitlebar} from '@/components/iris/DesktopTitlebar';
import {DesktopContextActions} from '@/components/iris/DesktopContextActions';
import {DesktopAddonSettings} from '@/components/iris/DesktopAddonSettings';
import {useDesktopAppearance} from '@/components/iris/useDesktopAppearance';
import {DesktopLogin} from '@/components/iris/DesktopLogin';
import {DesktopAccountPanel} from '@/components/iris/DesktopAccountPanel';
import {DesktopFocusDialog} from '@/components/iris/DesktopFocusDialog';
import {DesktopCenter} from '@/components/iris/DesktopCenter';
import {DesktopStats} from '@/components/iris/DesktopStats';
import {DesktopStatsSession} from '@/components/iris/DesktopStatsSession';
import {DesktopCurrencies} from '@/components/iris/DesktopCurrencies';
import {DesktopBarter} from '@/components/iris/DesktopBarter';
import {DesktopWorkspace} from '@/components/iris/DesktopWorkspace';
import {DesktopSynaxisSurface} from '@/components/iris/DesktopSynaxisSurface';
import type {CurrencySnapshot} from '@/lib/irisCurrencies';
import type {GameStats} from '@/lib/irisStats';
import {DesktopSaveStatus,DesktopCloseDialog} from '@/components/iris/DesktopSaveStatus';
import './desktop.css';
type Controller=ReturnType<typeof createDesktopController>;
type NativeContext={epoch:number;environment:string};
type NativeWindow=Window & {__irisDesktopBridge?:NativeContext;__irisDesktopPendingClose?:unknown;chrome?:{webview:Parameters<typeof createDesktopStore>[0]['channel']}};
export default function DesktopPage() {
  const controller=useRef<Controller|null>(null),starting=useRef(false);
  const protectedStore=useRef<ReturnType<typeof createDesktopStore>|null>(null);
  const [environment,setEnvironment]=useState<'development'|'production'>('production');
  const [workspaceReady,setWorkspaceReady]=useState(false);
  const [synaxisBusy,setSynaxisBusy]=useState(false);
  const [synaxisActivity,setSynaxisActivity]=useState({party:0,bus:0});
  const [closing,setClosing]=useState(false);
  const closingRef=useRef(false),addonReady=useRef(false);
  const [closeReason,setCloseReason]=useState<'manual'|'game-exit'>('manual');
  const [addon,setAddon]=useState<DesktopAddonState|null>(null),[addonError,setAddonError]=useState(''),[addonBusy,setAddonBusy]=useState(false);
  const addonActionBusy=useRef(false);
  const [settingsOpen,setSettingsOpen]=useState(false),[accountOpen,setAccountOpen]=useState(false);
  const preferencesChange=async(value:DesktopAddonPreferences)=>{const store=protectedStore.current;if(!store||addonActionBusy.current)return;addonActionBusy.current=true;setAddonBusy(true);setAddonError('');try{setAddon(await store.setAddonPreferences(value));}catch{setAddonError('창 설정을 적용하지 못했어요. 연결을 확인해 주세요.');}finally{addonActionBusy.current=false;setAddonBusy(false);}};
  const windowAction=(action:'drag'|'minimize')=>{if(closingRef.current)return;const store=protectedStore.current;if(store)void store[action]().catch(()=>setAddonError('새 IRIS 앱으로 다시 실행해 주세요. 창 연결을 확인하지 못했어요.'));};
  const [characterPickerRequest,setCharacterPickerRequest]=useState(0);
  const watchContext=useRef(0),[watchVersion,setWatchVersion]=useState(0);
  const invalidateWatch=useCallback(()=>{watchContext.current++;setWatchVersion(watchContext.current);},[]);
  const getWatchContext=useCallback(()=>watchContext.current,[]);
  const requestClose=useCallback((reason:'manual'|'game-exit'='manual')=>{if(closingRef.current)return;closingRef.current=true;invalidateWatch();setAccountOpen(false);setSettingsOpen(false);setCloseReason(reason);setClosing(true);if(addonReady.current)void protectedStore.current?.setCloseDecision(true).catch(()=>setAddonError('종료 연결을 확인해 주세요.'));},[invalidateWatch]);
  const [statsBusy,setStatsBusy]=useState(false);
  const statsBusyChanged=useCallback((value:boolean)=>{if(value)invalidateWatch();setStatsBusy(value);},[invalidateWatch]);
  const gameReadInFlight=useRef<Promise<GameStats>|null>(null);
  const nativeReads=useRef<Promise<unknown>>(Promise.resolve()),currencyInFlight=useRef<Promise<CurrencySnapshot>|null>(null);
  const readGameStats=useCallback(()=>{if(gameReadInFlight.current)return gameReadInFlight.current;const store=protectedStore.current;if(!store)return Promise.reject(new Error('앱 연결을 확인해 주세요.'));const pending=nativeReads.current.catch(()=>{}).then(()=>store.gameStats()).finally(()=>{if(gameReadInFlight.current===pending)gameReadInFlight.current=null;});nativeReads.current=pending;gameReadInFlight.current=pending;return pending;},[]);
  const readCurrencies=useCallback(()=>{if(currencyInFlight.current)return currencyInFlight.current;const store=protectedStore.current;if(!store)return Promise.reject(new Error('앱 연결을 확인해 주세요.'));const pending=nativeReads.current.catch(()=>{}).then(()=>store.currencies()).finally(()=>{if(currencyInFlight.current===pending)currencyInFlight.current=null;});nativeReads.current=pending;currencyInFlight.current=pending;return pending;},[]);
  const tabRefresh=useRef<Promise<void>|null>(null);
  const [closeFailed,setCloseFailed]=useState(false);
  const cancelClose=useCallback(()=>{const finish=()=>{closingRef.current=false;setClosing(false);setCloseFailed(false);};if(addonReady.current)void protectedStore.current?.setCloseDecision(false).then(finish).catch(()=>setAddonError('종료 질문을 닫지 못했어요. 연결을 확인해 주세요.'));else finish();},[]);
  const [state,setState]=useState<ReturnType<Controller['state']>|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(0),[remembered,setRemembered]=useState<DesktopAccount[]>([]);
  const publish=useCallback(()=>{if(controller.current)setState(controller.current.state());},[]);
  const run=useCallback(async(action:(c:Controller)=>Promise<void>,block=false)=>{
    const c=controller.current;if(!c)return;
    setError('');setNow(Date.now());if(block){invalidateWatch();setCharacterPickerRequest(0);setBusy(true);}
    try {const operation=action(c);publish();await operation;return true;}
    catch(e){setError(e instanceof Error?e.message:'연결을 확인해 주세요.');return false;}
    finally{publish();if(block)setBusy(false);}
  },[publish,invalidateWatch]);
  const selectCharacter=useCallback((id:string)=>{invalidateWatch();setCharacterPickerRequest(0);return run(c=>c.selectCharacter(id));},[invalidateWatch,run]);
  useEffect(()=>{
    let alive=true;
    const start=async()=>{
      const native=window as NativeWindow,context=native.__irisDesktopBridge;
      if(starting.current||controller.current||!context||!native.chrome?.webview)return;
      starting.current=true;
      setEnvironment(context.environment==='development'?'development':'production');
      try {
        const queue=createDesktopQueue({environment:context.environment,now:Date.now,id:()=>crypto.randomUUID()});
        const store=createDesktopStore({channel:native.chrome.webview,context:()=>native.__irisDesktopBridge??null,environment:context.environment});
        protectedStore.current=store;
        const c=createDesktopController({queue,store,transport:createDesktopTransport({fetch:window.fetch.bind(window)}),environment:context.environment});
        controller.current=c;await c.start();if(alive)publish();
        try{await store.workspaceCapabilities();if(alive)setWorkspaceReady(true);}catch{if(alive)setWorkspaceReady(false);}
        try {const value=await store.addonState();if(alive){addonReady.current=true;setAddon(value);}}catch{if(alive)setAddonError('IRIS를 정상 종료하고 다시 실행하면 창 연결 설정을 사용할 수 있어요.');}
        const pending=parseDesktopWindowEvent(native.__irisDesktopPendingClose,context);if(alive&&pending?.kind==='window.close.request'){native.__irisDesktopPendingClose=null;requestClose(pending.reason);}
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
    const close=(event:Event)=>{const native=window as NativeWindow;const message=parseDesktopWindowEvent((event as CustomEvent).detail,native.__irisDesktopBridge??null);if(message?.kind==='window.close.request'){native.__irisDesktopPendingClose=null;requestClose(message.reason);}};window.addEventListener('iris-desktop-close',close);
    const addonChanged=(event:Event)=>{const native=window as NativeWindow;const message=parseDesktopWindowEvent((event as CustomEvent).detail,native.__irisDesktopBridge??null);if(message?.kind==='window.addon.changed')setAddon(message.state);};
    window.addEventListener('iris-addon-state',addonChanged);
    return()=>{alive=false;clearInterval(interval);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visible);window.removeEventListener('iris-desktop-ready',start);window.removeEventListener('beforeunload',warn);window.removeEventListener('iris-desktop-close',close);window.removeEventListener('iris-addon-state',addonChanged);};
  },[publish,requestClose]);
  const accountForMemory=state?.account;
  const accountMemoryId=accountForMemory?.id,accountMemoryNickname=accountForMemory?.nickname,accountMemoryRole=accountForMemory?.role;
  useEffect(()=>{
    let live=true;
    try {
      const raw:unknown=JSON.parse(localStorage.getItem('iris_desktop_accounts:v1')??'[]');
      const safe:DesktopAccount[]=Array.isArray(raw)?raw.filter(a=>a&&typeof a.id==='string'&&typeof a.nickname==='string'&&typeof a.role==='string').slice(0,20).map(a=>({id:a.id,nickname:a.nickname,role:a.role})):[];
      const current=accountMemoryId&&accountMemoryNickname&&accountMemoryRole?{id:accountMemoryId,nickname:accountMemoryNickname,role:accountMemoryRole}:null;
      const next=current?[current,...safe.filter(a=>a.id!==current.id)].slice(0,20):safe;
      if(current)localStorage.setItem('iris_desktop_accounts:v1',JSON.stringify(next));
      queueMicrotask(()=>{if(live)setRemembered(next);});
    }catch{/* Display metadata is optional; never use it as authentication. */}
    return()=>{live=false;};
  },[accountMemoryId,accountMemoryNickname,accountMemoryRole]);
  const account=accountForMemory,selected=state?.selected??null,baseLocked=!state||state.locked||busy,locked=baseLocked||statsBusy||synaxisBusy;
  const entries=state?.queue.entries.filter(e=>e.accountId===account?.id)??[];
  const appearance=useDesktopAppearance(environment,account?.id??null);
  const openAccount=()=>{if(closing||busy||synaxisBusy)return;invalidateWatch();setSettingsOpen(false);setCharacterPickerRequest(0);setAccountOpen(true);};
  const contextActions=<DesktopContextActions accountOpen={accountOpen} settingsOpen={settingsOpen} disabled={closing||busy||synaxisBusy} onAccount={openAccount} onSettings={()=>{if(closing||busy||synaxisBusy)return;invalidateWatch();setAccountOpen(false);setSettingsOpen(value=>!value);}}/>;
  const settingsPanel=<DesktopAddonSettings appearance={appearance} addonState={addon} busy={addonBusy||closing} error={addonError} onPreferencesChange={value=>void preferencesChange(value)} onBack={()=>setSettingsOpen(false)} accountPanel={<><p className="iris-caption">{account?`${account.nickname} · 계정`:'생텀 계정으로 로그인해 주세요.'}</p><button type="button" className="iris-desktop-button" disabled={closing||busy} onClick={openAccount}>계정 관리 열기</button></>}/>;
  return <main className="iris-desktop">
    <DesktopTitlebar onDrag={()=>windowAction('drag')} onMinimize={()=>windowAction('minimize')} onClose={()=>requestClose()}/>
    {!account&&<div className="iris-context-header iris-login-tools">{contextActions}</div>}
    {accountOpen&&!closing&&<DesktopFocusDialog title="생텀 계정" onClose={()=>setAccountOpen(false)} dismissDisabled={busy}>{error&&<p role="alert">{error}</p>}{account?<DesktopAccountPanel account={account} remembered={remembered} busy={locked} onClose={()=>setAccountOpen(false)} onSwitch={id=>run(c=>c.switchAccount(id),true)} onLogout={()=>run(c=>c.logout('keep'),true)} onLogin={(n,code,keep)=>run(c=>c.login(n,code,keep),true)}/>:<DesktopLogin busy={!!state?.durabilityError||busy} onLogin={async(n,code,keep)=>{if(await run(c=>c.login(n,code,keep),true))setAccountOpen(false);}}/>}</DesktopFocusDialog>}
    {closing&&<DesktopCloseDialog reason={closeReason} busy={busy||statsBusy||synaxisBusy} storageFailed={state?.durabilityError||closeFailed} onCancel={cancelClose} onChoose={action=>void run(async c=>{await c.shutdown(action);await protectedStore.current?.close();},true).then(ok=>{if(!ok)setCloseFailed(true);})} onUnsafeClose={()=>void run(async c=>{await c.shutdownWithoutSaving();await protectedStore.current?.close();},true)}/>}
    {error&&<p role="alert" className="rounded-2xl border border-[var(--accent)] p-4">{error}{state?.durabilityError&&' 미저장 변경 보관에 실패했어요. 재시작 전에 복구가 필요해요.'}</p>}
    {!account&&settingsOpen?settingsPanel:!state?<p role="status">IRIS 전용 앱에서 열면 보호된 대기함과 연결돼요. 일반 브라우저에서는 편집하지 않아요.</p>:!account?<section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5"><DesktopLogin busy={state.durabilityError||busy} onLogin={async(n,code,keep)=>{await run(c=>c.login(n,code,keep),true);}}/></section>:<>
      <DesktopStatsSession key={account.id} accountId={account.id} characterId={selected?.characterId??null} locked={locked||closing||accountOpen||settingsOpen} readGame={readGameStats} watchVersion={watchVersion} getContextVersion={getWatchContext} onSelectCharacter={selectCharacter} onChooseOther={()=>setCharacterPickerRequest(value=>value+1)}>{({suggestion,onCharactersRead})=><DesktopCenter account={account} characters={state.characters} selected={selected} pending={entries} locked={locked} settingsOpen={settingsOpen} settingsPanel={settingsPanel} characterPickerRequest={characterPickerRequest} classDrafts={state.classDrafts} onClassDraft={(id,text)=>void run(c=>c.setClassDraft(id,text))} onRevertClassDraft={id=>void run(c=>c.revertClassDraft(id))} onSelectCharacter={id=>void selectCharacter(id)} onEdit={(key,base,desired)=>void run(c=>c.edit(key,base,desired))}
        contextActions={contextActions} onTabChange={tab=>{if((tab==='homework'||tab==='classes'||tab==='barter'||tab==='shop'||tab==='missions')&&!tabRefresh.current){const pending=run(c=>c.refresh()).then(()=>{}).finally(()=>{if(tabRefresh.current===pending)tabRefresh.current=null;});tabRefresh.current=pending;}}}
        statsPanel={active=>selected?<DesktopStats key={account.id+':'+selected.characterId} accountId={account.id} characterId={selected.characterId} locked={baseLocked} active={active} readGame={readGameStats} onSelectCharacter={id=>void selectCharacter(id)} onBusyChange={statsBusyChanged} onCharactersRead={onCharactersRead}/>:<p>캐릭터를 선택해 주세요.</p>}
        currenciesPanel={active=><DesktopCurrencies key={account.id} active={active} readCurrencies={readCurrencies} accountId={account.id} environment={environment}/>}
        barterPanel={<DesktopBarter selected={selected} pending={entries} locked={locked} onEdit={(key,base,desired)=>void run(c=>c.editBarter(key,base,desired))}/>}
        shopPanel={<>{!workspaceReady&&<p role="status" className="iris-caption">저장을 사용하려면 IRIS를 정상 종료하고 최신 앱으로 다시 실행해 주세요.</p>}<DesktopWorkspace key={account.id+':shop'} selected={selected} pending={entries} locked={locked||!workspaceReady} kind="shop" onEdit={(key,base,desired)=>void run(c=>c.editWorkspace(key,base,desired))}/></>}
        missionsPanel={<>{!workspaceReady&&<p role="status" className="iris-caption">저장을 사용하려면 IRIS를 정상 종료하고 최신 앱으로 다시 실행해 주세요.</p>}<DesktopWorkspace key={account.id+':missions'} selected={selected} pending={entries} locked={locked||!workspaceReady} kind="mission" onEdit={(key,base,desired)=>void run(c=>c.editWorkspace(key,base,desired))}/></>}
        synaxisUnread={synaxisActivity.party+synaxisActivity.bus>0}
        synaxisPanel={active=><DesktopSynaxisSurface key={account.id} account={account} active={active&&!closing&&!accountOpen&&!settingsOpen} locked={baseLocked||statsBusy||closing||accountOpen||settingsOpen} onBusyChange={setSynaxisBusy} onActivityChange={setSynaxisActivity}/>}
        characterStatus={<>{suggestion}{!state.charactersLoaded?<div className="space-y-2"><p>{locked?'캐릭터 목록을 불러오고 있어요.':'캐릭터 목록을 불러오지 못했어요. 로그인은 유지돼요.'}</p><button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>void run(c=>c.reloadCharacters(),true)}>캐릭터 다시 불러오기</button></div>:state.characters.length===0?<p>본인 계정에 등록된 캐릭터가 없어요.</p>:null}</>}
        saveStatus={<DesktopSaveStatus entries={entries} characters={state.characters} selected={selected} hasInvalidClassDraft={state.hasInvalidClassDraft} lastSaveConfirmation={state.lastSaveConfirmation} now={now} locked={locked||!selected} onSave={()=>void run(c=>c.saveNow())} onDiscard={()=>void run(c=>c.discard())} onRecover={(id,action)=>void run(c=>c.recover(id,action))}/>}/>}</DesktopStatsSession>
    </>}
  </main>;
}
