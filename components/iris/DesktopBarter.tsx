'use client';
import {useState} from 'react';
import {useBarterFavorites} from '@/hooks/useBarterFavorites';
import {BarterFavoritesFeedback} from '@/components/character/BarterFavoritesFeedback';
import type {DesktopDetails} from '@/lib/irisDesktopTransport';
import type {PendingEdit,BarterPendingEdit} from '@/lib/irisDesktopQueue';
import type {BarterKey,BarterScope} from '@/lib/irisBarter';
import './desktop-barter.css';
export function desktopBarterRows(selected:DesktopDetails,pending:PendingEdit[]){
  return (selected.details.barter??[]).map(row=>{
    const edits=pending.filter((e):e is BarterPendingEdit=>e.kind==='barter'&&e.accountId===selected.accountId&&e.tradeId===row.id&&e.scope===row.scope&&(e.scope==='account'||e.characterId===selected.characterId)&&e.periodKey===row.periodKey).sort((a,b)=>b.revision-a.revision);
    return {...row,completed:edits[0]?.desiredCompleted??row.completed,waiting:edits.length>0,paused:edits.some(e=>['unknown','conflict','expired','inflight'].includes(e.phase))};
  });
}
export function DesktopBarter({selected,pending,locked,onEdit}:{selected:DesktopDetails|null;pending:PendingEdit[];locked:boolean;onEdit(key:BarterKey,base:number,desired:number):void}){
  const [search,setSearch]=useState(''),[scope,setScope]=useState<BarterScope|'all'>('all'),[reset,setReset]=useState<'all'|'일간'|'주간'>('all'),[remaining,setRemaining]=useState(false),[favoritesOnly,setFavoritesOnly]=useState(false);
  const favoritesState=useBarterFavorites(selected?.accountId??null),favorites=favoritesState.favorites;
  if(!selected)return <p>캐릭터를 선택하면 저장된 물물교환을 볼 수 있어요.</p>;
  if(!selected.details.barter||!selected.writeContext.barter)return <p role="status">물물교환 정보를 불러오지 못했어요. 다시 조회하거나 생텀 웹에서 확인해 주세요.</p>;
  const rows=desktopBarterRows(selected,pending),q=search.trim().toLocaleLowerCase('ko-KR');
  const shown=rows.filter(r=>(scope==='all'||r.scope===scope)&&(reset==='all'||r.resetType===reset)&&(!remaining||r.completed<r.total||r.paused)&&(!favoritesOnly||favorites.includes(Number(r.id)))&&(!q||[r.map,r.npc,r.reward,r.cost].some(v=>v.toLocaleLowerCase('ko-KR').includes(q)))).sort((a,b)=>Number(favorites.includes(Number(b.id)))-Number(favorites.includes(Number(a.id))));
  return <div className="iris-barter">
    <label className="iris-barter-search"><span>물물교환 검색</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="NPC · 마을 · 보상 · 소모품"/></label>
    <div className="iris-barter-filters"><label>범위<select aria-label="물물교환 범위" value={scope} onChange={e=>setScope(e.target.value as BarterScope|'all')}><option value="all">전체</option><option value="character">캐릭당</option><option value="account">계정당</option></select></label><label>주기<select aria-label="물물교환 주기" value={reset} onChange={e=>setReset(e.target.value as 'all'|'일간'|'주간')}><option value="all">전체</option><option>일간</option><option>주간</option></select></label><label className="iris-barter-remaining"><input type="checkbox" checked={remaining} onChange={e=>setRemaining(e.target.checked)}/>미완료만</label><label><input type="checkbox" checked={favoritesOnly} onChange={e=>setFavoritesOnly(e.target.checked)}/>즐겨찾기만</label></div>
    <BarterFavoritesFeedback state={favoritesState} accountId={selected.accountId}/>
    <p className="iris-barter-note">완료 {rows.filter(r=>r.completed===r.total).length}/{rows.length} · 일간 매일 / 주간 월요일 06시 초기화</p>
    <div className="iris-barter-list">{shown.map(r=>{
      const context=selected.writeContext.barter!.find(c=>c.tradeId===r.id&&c.periodKey===r.periodKey),disabled=locked||r.paused||!context;
      const favorite=favorites.includes(Number(r.id)),favoriteLabel=`${r.reward} · ${r.npc} 즐겨찾기 ${favorite?'해제':'추가'}`;
      const edit=(desired:number)=>{if(context)onEdit(context,r.completed,desired);};
      return <section className="iris-barter-row" key={r.id} data-barter-id={r.id} data-complete={r.completed===r.total} data-paused={r.paused}>
        <div className="iris-barter-caption"><button type="button" className="iris-barter-favorite" aria-label={favoriteLabel} aria-pressed={favorite} title={favoriteLabel} disabled={locked||!favoritesState.ready||favoritesState.busy} onClick={()=>void favoritesState.toggle(Number(r.id))}>{favorite?'★':'☆'}</button><strong>{r.npc}<small>{r.map}</small></strong><span>{r.resetType} · {r.scope==='account'?'계정당':'캐릭당'}</span></div>
        <div className="iris-barter-item iris-barter-reward"><small>보상</small><span>{r.reward} × {r.rewardCount.toLocaleString('ko-KR')}</span></div>
        <div className="iris-barter-item iris-barter-cost"><small>소모</small><span>{r.cost} × {r.costCount.toLocaleString('ko-KR')}</span></div>
        <div className="iris-barter-controls"><span>{r.scope==='account'&&r.completed>0?(r.waiting?'저장 대기':r.completedBy??'완료 기록'):r.completed===r.total?'완료':''}</span><div className="iris-counter"><button type="button" className="iris-desktop-button iris-icon-button" aria-label={r.reward+' 교환 횟수 감소'} disabled={disabled||r.completed===0} onClick={()=>edit(r.completed-1)}>−</button><output aria-label={r.reward+' 교환 횟수'}>{r.completed}/{r.total}</output><button type="button" className="iris-desktop-button iris-icon-button" aria-label={r.reward+' 교환 횟수 증가'} disabled={disabled||r.completed>=r.total} onClick={()=>edit(r.completed+1)}>+</button><button type="button" className="iris-desktop-button" aria-label={r.reward+(r.completed===r.total?' 모두 초기화':' 모두 완료')} disabled={disabled} onClick={()=>edit(r.completed===r.total?0:r.total)}>{r.completed===r.total?'MIN':'MAX'}</button></div></div>
        {r.paused&&<p role="status" className="iris-barter-note">결과 확인 필요 · 저장 안내를 확인해 주세요.</p>}
      </section>;
    })}{shown.length===0&&<p className="iris-barter-note">{rows.length===0?'등록된 물물교환이 없어요.':favoritesOnly?(!favoritesState.ready?(favoritesState.busy?'즐겨찾기를 불러오는 중이에요.':'즐겨찾기를 먼저 다시 조회해 주세요.'):favorites.length===0?'즐겨찾기한 물물교환이 없어요. 별표를 눌러 추가해 주세요.':'조건에 맞는 즐겨찾기 물물교환이 없어요.'):'조건에 맞는 물물교환이 없어요.'}</p>}</div>
  </div>;
}
