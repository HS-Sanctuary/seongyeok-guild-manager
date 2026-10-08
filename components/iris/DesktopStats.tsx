'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {freshStats,score,statKeys,statsFingerprint,type GameStats,type StatsCharacter} from '@/lib/irisStats';
import {createStatsTransport} from '@/lib/irisStatsTransport';
import {DesktopStatsConfirmation} from './DesktopStatsConfirmation';
const labels={combat_power:'전투력',life_energy:'생활력',magic_resistance:'마도저항',charm:'매력'};
export function DesktopStats({accountId,characterId,locked,readGame,onSelectCharacter,onBusyChange,onCharactersRead,active=true}:{accountId:string;characterId:string|null;locked:boolean;readGame():Promise<GameStats>;onSelectCharacter(id:string):void;onBusyChange(busy:boolean):void;onCharactersRead?(rows:StatsCharacter[]):void;active?:boolean}){
  const [characters,setCharacters]=useState<StatsCharacter[]>([]),[game,setGame]=useState<GameStats|null>(null),[confirming,setConfirming]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[now,setNow]=useState(0);
  const transport=useRef<ReturnType<typeof createStatsTransport>|null>(null),generation=useRef(0),inflight=useRef(false),alive=useRef(false);
  const target=characters.find(c=>c.id===characterId);
  const cancelConfirmation=useCallback(()=>{if(!inflight.current)setConfirming(false);},[]);
  const change=!!game&&!!target&&statKeys.some(k=>game.stats[k]!==null&&score(target.stats[k])!==game.stats[k]);
  const load=async()=>{
    if(inflight.current)return;const epoch=++generation.current;inflight.current=true;setBusy(true);setConfirming(false);setGame(null);setNotice('');
    try{const [rows,snapshot]=await Promise.all([transport.current!.characters(accountId),readGame()]);if(alive.current&&epoch===generation.current){setCharacters(rows);onCharactersRead?.(rows);setGame(snapshot);setNow(Date.now());}}
    catch(error){if(alive.current&&epoch===generation.current)setNotice(error instanceof Error&&error.message==='로그인이 만료됐어요. 다시 로그인해 주세요.'?error.message:'게임 스탯을 읽지 못했어요. 게임 실행과 AI 커넥터 활성화를 확인한 뒤 다시 읽어 주세요. 생텀 값은 유지돼요.');}
    finally{if(alive.current&&epoch===generation.current){inflight.current=false;setBusy(false);}}
  };
  useEffect(()=>{if(!active)return;const generationAtSetup=generation.current;alive.current=true;transport.current=createStatsTransport(window.fetch.bind(window));queueMicrotask(()=>{if(alive.current)void load();});const timer=setInterval(()=>setNow(Date.now()),1000);return()=>{alive.current=false;generation.current=generationAtSetup+1;inflight.current=false;clearInterval(timer);onBusyChange(false);};
  // Remounted by account + selected character; no snapshot/confirmation persistence.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[active]);
  const save=async()=>{
    if(inflight.current||locked||!target||!game||!confirming||!freshStats(game)||!change)return;
    const epoch=generation.current,expected=statsFingerprint(game),base={...target.stats};inflight.current=true;setBusy(true);onBusyChange(true);setNotice('');
    try{
      const fresh=await readGame();if(!alive.current||epoch!==generation.current)return;
      if(!freshStats(fresh)||statsFingerprint(fresh)!==expected){setGame(fresh);setConfirming(false);setNotice('게임 정보가 바뀌었어요. 업데이트를 눌러 캐릭터를 다시 확인해 주세요.');return;}
      await transport.current!.save({accountId,characterId:target.id,confirmed:true,observedAt:fresh.observedAt,stats:fresh.stats,base});
      const rows=await transport.current!.characters(accountId);if(!alive.current||epoch!==generation.current)return;setCharacters(rows);onCharactersRead?.(rows);
      const saved=rows.find(c=>c.id===target.id);if(!saved||statKeys.some(k=>fresh.stats[k]!==null&&score(saved.stats[k])!==fresh.stats[k]))throw Error('저장된 값을 다시 확인하지 못했어요.');
      setGame(fresh);setConfirming(false);setNotice(`${target.nickname} 인게임 정보를 생텀에 업데이트했어요.`);
    }catch(error){if(alive.current&&epoch===generation.current){setConfirming(false);setNotice(`${error instanceof Error?error.message:'저장 결과를 확인하지 못했어요.'} 재전송하지 않았어요. 다시 읽어 저장 상태부터 확인해 주세요.`);}}
    finally{if(alive.current&&epoch===generation.current){inflight.current=false;setBusy(false);onBusyChange(false);setNow(Date.now());}}
  };
  return <div className="space-y-3">
    <section className="iris-stats-card"><h2>생텀 데이터 스테이터스</h2><p className="text-sm">{target?`${target.nickname} · ${target.job}`:'캐릭터를 선택해 주세요.'}</p><StatsList stats={target?.stats}/></section>
    <div className="iris-stats-actions"><button type="button" className="iris-desktop-button" disabled={busy||locked} onClick={()=>void load()}>{busy?'조회 중…':'스탯 재조회'}</button><button type="button" aria-haspopup="dialog" className="iris-desktop-button" disabled={busy||locked||!target||!game||!freshStats(game,now)||!change} onClick={()=>setConfirming(true)}>↑ 생텀 DB에 업데이트</button></div>
    {game&&!change&&<p className="text-sm">읽은 스탯과 생텀 값이 같아요. 저장할 변경이 없어요.</p>}
    {confirming&&target&&game&&<DesktopStatsConfirmation target={target} characters={characters} job={game.job} busy={busy} locked={locked} canConfirm={freshStats(game,now)&&!locked} onConfirm={()=>void save()} onSelectCharacter={id=>{setConfirming(false);onSelectCharacter(id);}} onCancel={cancelConfirmation}/>}
    <section className="iris-stats-card"><h2>실제 인게임 스테이터스</h2><p className="text-sm">{game?`${game.job} · 캐릭터 레벨 ${game.level??'미확인'}`:'아직 게임 정보를 읽지 않았어요.'}</p><StatsList stats={game?.stats}/>{game&&<p className="text-sm">조회: {new Date(game.observedAt).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul'})}{!freshStats(game,now)&&' · 오래된 정보예요. 다시 읽어 주세요.'}</p>}</section>
    {notice&&<p role="status" className="text-sm">{notice}</p>}<p className="text-sm">누락된 값·클래스 레벨·길드공헌도는 업데이트하지 않아요. 자동 저장은 하지 않아요.</p>
  </div>;
}
function StatsList({stats}:{stats?:Record<string,string|number|null>}){return <dl className="iris-stats-values">{statKeys.map(key=><div key={key}><dt>{labels[key]}</dt><dd>{stats?.[key]==null?'미확인':typeof stats[key]==='number'?stats[key].toLocaleString('ko-KR'):stats[key]}</dd></div>)}</dl>;}
