'use client';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {freshStats,recommendStatsCharacter,statKeys,type GameStats,type StatsCharacter} from '@/lib/irisStats';
import {createStatsTransport} from '@/lib/irisStatsTransport';
import {DesktopCharacterWatch} from './DesktopCharacterWatch';
import {DesktopFocusDialog} from './DesktopFocusDialog';
export function DesktopStatsSession({accountId,characterId,locked,readGame,watchVersion,getContextVersion,onSelectCharacter,onChooseOther,children}:{accountId:string;characterId:string|null;locked:boolean;readGame():Promise<GameStats>;watchVersion:number;getContextVersion():number;onSelectCharacter(id:string):void|Promise<boolean|void>;onChooseOther():void;children(value:{suggestion:ReactNode;ready:boolean;initialGame:GameStats|null;onCharactersRead(rows:StatsCharacter[]):void}):ReactNode}){
  const [ready,setReady]=useState(false),[game,setGame]=useState<GameStats|null>(null),[characters,setCharacters]=useState<StatsCharacter[]>([]),[dismissed,setDismissed]=useState(false),[choosing,setChoosing]=useState(false),[notice,setNotice]=useState('');
  // DesktopPage keys this session by account: no observation crosses accounts
  // or persists to disk. Updating it does not rerender or issue another read.
  const previousGame=useRef<GameStats|null>(null);
  const getPreviousGame=useCallback(()=>previousGame.current,[]);
  const rememberGame=useCallback((snapshot:GameStats)=>{
    if(!freshStats(snapshot)||statKeys.filter(key=>(snapshot.stats[key]??0)>0).length<2)return;
    if(previousGame.current&&Date.parse(snapshot.observedAt)<=Date.parse(previousGame.current.observedAt))return;
    previousGame.current=snapshot;
  },[]);
  useEffect(()=>{
    let active=true,settled=false;
    const finish=(snapshot:GameStats|null,rows:StatsCharacter[],message='')=>{if(!active||settled)return;settled=true;if(snapshot)rememberGame(snapshot);setGame(snapshot);setCharacters(rows);setNotice(message);setReady(true);};
    const timer=setTimeout(()=>finish(null,[],'후보 확인이 늦어져 추천을 건너뛰었어요. 캐릭터를 직접 선택해 주세요.'),4000);
    // Skip the first StrictMode probe before performing external IO.
    queueMicrotask(()=>{if(!active)return;const transport=createStatsTransport(window.fetch.bind(window));
      void Promise.all([transport.characters(accountId),readGame()]).then(([rows,snapshot])=>{finish(freshStats(snapshot)?snapshot:null,rows);}).catch(()=>finish(null,[],'추천 정보를 읽지 못했어요. 캐릭터를 직접 선택해 주세요.'));
    });
    return()=>{active=false;clearTimeout(timer);};
  },[accountId,readGame,rememberGame]);
  const candidate=game?recommendStatsCharacter(characters,game):null;
  const select=(id:string)=>{setDismissed(true);onSelectCharacter(id);};
  const suggestion=locked?null:characterId?ready?<DesktopCharacterWatch key={accountId+':'+characterId+':'+watchVersion} accountId={accountId} characterId={characterId} characters={characters} locked={locked} readGame={readGame} getContextVersion={getContextVersion} getPreviousGame={getPreviousGame} onGameRead={rememberGame} onCharactersRead={setCharacters} onSelectCharacter={onSelectCharacter} onChooseOther={onChooseOther}/>:null:dismissed?null:ready&&candidate&&!choosing?<DesktopFocusDialog title="접속 캐릭터 추천" onClose={()=>setDismissed(true)}><p>지금 접속한 캐릭터가 <strong className="text-[var(--accent)]">{candidate.nickname}</strong>인가요?</p><p className="iris-caption">직업·스탯이 가까운 후보예요. 신원 확인은 아니며 저장하지 않아요.</p><div className="iris-switch-actions iris-switch-actions-pair"><button type="button" className="iris-desktop-button" disabled={!game||!freshStats(game)} onClick={()=>select(candidate.id)}>네, 선택</button><button type="button" className="iris-desktop-button" onClick={()=>setChoosing(true)}>직접 선택</button></div></DesktopFocusDialog>:<section aria-label="접속 캐릭터 추천" className="iris-stats-card my-2 text-sm">
    {!ready?<p role="status">접속 캐릭터 후보 확인 중… 기다리지 않고 직접 선택해도 돼요.</p>:<>
      {candidate&&!choosing?<><p>접속 캐릭터 추천: <strong className="text-[var(--accent)]">{candidate.nickname}</strong> 캐릭터가 맞나요?</p><p>직업·스탯이 가까운 후보예요. 신원 확인은 아니며 저장하지 않아요.</p><div className="flex flex-wrap gap-2 mt-2"><button type="button" className="iris-desktop-button" disabled={locked||!game||!freshStats(game)} onClick={()=>select(candidate.id)}>네, {candidate.nickname}로 시작</button><button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>setChoosing(true)}>아니요, 직접 선택</button></div></>:<>
        <p>{notice||'후보가 비슷하거나 비교할 정보가 부족해요. 캐릭터를 직접 선택해 주세요.'}</p>
        {characters.length>0&&<div className="flex flex-wrap gap-2 mt-2">{characters.map(c=><button key={c.id} type="button" className="iris-desktop-button" disabled={locked} onClick={()=>select(c.id)}>{c.nickname} · {c.job}</button>)}</div>}
      </>}
      <button type="button" className="iris-desktop-button mt-2" onClick={()=>setDismissed(true)}>추천 닫기</button>
    </>}
  </section>;
  return children({suggestion,ready,initialGame:game,onCharactersRead:setCharacters});
}
