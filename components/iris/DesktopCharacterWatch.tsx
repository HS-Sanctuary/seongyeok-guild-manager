'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {freshStats,type GameStats,type StatsCharacter} from '@/lib/irisStats';
import {createCharacterSwitchTracker} from '@/lib/irisCharacterSwitch';
import {createStatsTransport} from '@/lib/irisStatsTransport';
import {DesktopFocusDialog} from './DesktopFocusDialog';
import './character-focus.css';

type Props={accountId:string;characterId:string;characters:StatsCharacter[];locked:boolean;readGame():Promise<GameStats>;getContextVersion():number;getPreviousGame():GameStats|null;onGameRead(game:GameStats):void;onCharactersRead(rows:StatsCharacter[]):void;onSelectCharacter(id:string):void|Promise<boolean|void>;onChooseOther():void};
type Runtime={active:boolean;confirming:boolean;generation:number;tracker:ReturnType<typeof createCharacterSwitchTracker>;observation:GameStats|null;catalog:StatsCharacter[];poll?():Promise<void>;pause?():void};

// Best effort: autoplay restrictions or missing audio never delay the visual offer.
function playSwitchCue():()=>void {
  let audio:AudioContext|null=null,oscillator:OscillatorNode|null=null,timer:ReturnType<typeof setTimeout>|undefined,disposed=false;
  const stop=()=>{if(disposed)return;disposed=true;clearTimeout(timer);try{oscillator?.stop();}catch{}try{void audio?.close().catch(()=>{});}catch{}};
  try{
    audio=new AudioContext();
    const context=audio;
    void (async()=>{
      if(context.state==='suspended'){
        await Promise.race([context.resume(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Audio unavailable')),250);})]);
        clearTimeout(timer);
      }
      if(disposed||context.state!=='running'){stop();return;}
      oscillator=context.createOscillator();const gain=context.createGain(),start=context.currentTime;
      oscillator.type='sine';oscillator.frequency.setValueAtTime(720,start);oscillator.frequency.linearRampToValueAtTime(960,start+.14);
      gain.gain.setValueAtTime(.001,start);gain.gain.linearRampToValueAtTime(.025,start+.025);gain.gain.exponentialRampToValueAtTime(.001,start+.16);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.onended=stop;oscillator.start(start);oscillator.stop(start+.17);
    })().catch(stop);
  }catch{stop();}
  return stop;
}

// Mounted per selected character: delayed reads cannot change another account/selection.
export function DesktopCharacterWatch({accountId,characterId,characters,locked,readGame,getContextVersion,getPreviousGame,onGameRead,onCharactersRead,onSelectCharacter,onChooseOther}:Props){
  const [candidate,setCandidate]=useState<StatsCharacter|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const latest=useRef({characters,locked,onSelectCharacter,onChooseOther,onCharactersRead}),runtime=useRef<Runtime|null>(null);
  useEffect(()=>{latest.current={characters,locked,onSelectCharacter,onChooseOther,onCharactersRead};},[characters,locked,onSelectCharacter,onChooseOther,onCharactersRead]);
  useEffect(()=>{
    const version=getContextVersion(),context:Runtime={active:true,confirming:false,generation:0,tracker:createCharacterSwitchTracker(characterId,getPreviousGame()),observation:null,catalog:[]};runtime.current=context;
    const current=()=>context.active&&version===getContextVersion();
    let reading=false,nextReadAt=-Infinity,catalogAttempted=false,fallback:StatsCharacter[]=[];
    let timer:ReturnType<typeof setTimeout>|undefined,fastProbeId:string|null=null;
    const stopTimer=()=>clearTimeout(timer);
    const schedule=(delay:number)=>{stopTimer();nextReadAt=Date.now()+delay;if(current()&&!context.confirming&&!latest.current.locked&&document.visibilityState==='visible')timer=setTimeout(()=>void poll(),delay);};
    const invalidate=()=>{context.generation++;context.tracker.invalidate();context.observation=null;fastProbeId=null;setCandidate(null);};
    context.pause=()=>{stopTimer();context.generation++;context.tracker.invalidate();context.observation=null;fastProbeId=null;queueMicrotask(()=>{if(context.active)setCandidate(null);});};
    const poll=async()=>{
      if(!current()||reading||context.confirming)return;
      if(latest.current.locked||document.visibilityState!=='visible'){stopTimer();invalidate();return;}
      const remaining=nextReadAt-Date.now();
      if(remaining>0){schedule(remaining);return;}
      stopTimer();
      reading=true;const generation=context.generation;
      try{
        // Normally reuse the login catalog. A skipped/slow login probe gets one background retry.
        if(!latest.current.characters.length&&!catalogAttempted){catalogAttempted=true;fallback=await createStatsTransport(window.fetch.bind(window)).characters(accountId);if(current()&&generation===context.generation)latest.current.onCharactersRead(fallback);}
        if(!current()||generation!==context.generation||latest.current.locked)return;
        const game=await readGame();
        if(!current()||generation!==context.generation||context.confirming)return;
        if(latest.current.locked||document.visibilityState!=='visible'){invalidate();return;}
        context.observation=game;context.catalog=latest.current.characters.length?latest.current.characters:fallback;
        onGameRead(game);
        setCandidate(context.tracker.observe(context.catalog,game));setNotice('');
      }catch{if(current()&&generation===context.generation&&!context.confirming)invalidate();}
      finally{
        reading=false;
        // One early confirmation per pending candidate, never a permanent 1s
        // loop if CLI returns a cached timestamp. Schedule after completion so
        // slow CLI calls cannot overlap or accumulate timer ticks.
        const pending=context.tracker.unconfirmedCandidate(),fast=pending!==null&&pending!==fastProbeId;
        fastProbeId=pending;schedule(fast?1000:3000);
      }
    };
    context.poll=poll;
    const visible=()=>{if(document.visibilityState!=='visible'){stopTimer();invalidate();}else void poll();};
    queueMicrotask(()=>{if(context.active)void poll();});
    document.addEventListener('visibilitychange',visible);window.addEventListener('focus',poll);
    return()=>{context.active=false;stopTimer();document.removeEventListener('visibilitychange',visible);window.removeEventListener('focus',poll);};
  },[accountId,characterId,readGame,getContextVersion,getPreviousGame,onGameRead]);
  useEffect(()=>{
    const context=runtime.current;if(!context)return;
    if(locked)context.pause?.();
    else queueMicrotask(()=>{if(context.active)void context.poll?.();});
  },[locked]);
  const dismiss=useCallback(()=>{const context=runtime.current;if(!context||context.confirming)return;context.tracker.dismiss();setCandidate(null);setNotice('');},[]);
  useEffect(()=>{
    if(!candidate?.id||locked)return;
    return playSwitchCue();
  },[candidate?.id,locked]);
  const confirm=async()=>{
    const context=runtime.current;
    if(!context?.active||context.confirming||latest.current.locked||!candidate)return;
    const id=candidate.id,observedAt=context.observation?.observedAt,generation=context.generation,version=getContextVersion();context.confirming=true;setBusy(true);setNotice('');
    try{
      const game=await readGame();if(!context.active||generation!==context.generation||version!==getContextVersion()||latest.current.locked||document.visibilityState!=='visible')return;
      const rows=latest.current.characters.length?latest.current.characters:context.catalog;
      const matching=context.tracker.observe(rows,game);
      if(!freshStats(game)||!observedAt||Date.parse(game.observedAt)<Date.parse(observedAt)||matching?.id!==id){
        context.tracker.invalidate();setCandidate(null);setNotice('게임 정보가 바뀌었어요. 다음 조회에서 후보를 다시 확인할게요.');return;
      }
      onGameRead(game); // Carry the freshly confirmed character into the next watch.
      const selected=await latest.current.onSelectCharacter(id);
      if(context.active&&selected!==false){context.tracker.dismiss();setCandidate(null);}
    }catch{if(context.active&&generation===context.generation&&version===getContextVersion()&&!latest.current.locked&&document.visibilityState==='visible'){context.tracker.invalidate();setCandidate(null);setNotice('변경 정보를 확인하지 못했어요. 현재 캐릭터는 유지했어요.');}}
    finally{context.confirming=false;if(context.active){setBusy(false);void context.poll?.();}}
  };
  if(locked||(!candidate&&!notice))return null;
  if(!candidate)return <p className="iris-switch-notice" role="status">{notice}</p>;
  return <DesktopFocusDialog title="캐릭터 변경 추천" description="직업·스탯이 가까운 후보예요. 게임 화면과 비교해 주세요." onClose={dismiss} dismissDisabled={busy} className="iris-character-focus">
    <span className="iris-switch-eyebrow">캐릭터 변경 감지 · {candidate.job}</span><h3 className="iris-switch-question"><strong>{candidate.nickname}</strong><span>캐릭터로 변경하셨나요?</span></h3><p className="iris-switch-help">네를 누르면 게임 정보를 다시 확인한 뒤 생텀 선택 캐릭터를 바꿔요.</p>
    <div className="iris-switch-actions"><button type="button" className="iris-desktop-button" data-primary disabled={busy} onClick={()=>void confirm()}>{busy?'확인 중…':'네'}</button><button type="button" className="iris-desktop-button" disabled={busy} onClick={dismiss}>아니요</button><button type="button" className="iris-desktop-button" disabled={busy} onClick={()=>{dismiss();latest.current.onChooseOther();}}>다른 캐릭터</button></div>
  </DesktopFocusDialog>;
}
