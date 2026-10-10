'use client';
import {useState} from 'react';
import type {DesktopDetails} from '@/lib/irisDesktopTransport';
import type {PendingEdit,WorkspacePendingEdit} from '@/lib/irisDesktopQueue';
import type {WorkspaceKey} from '@/lib/irisWorkspace';
import './desktop-workspace.css';
export function desktopWorkspaceRows(selected:DesktopDetails,pending:PendingEdit[]){
  return (selected.details.workspace??[]).map(row=>{
    const edits=pending.filter((e):e is WorkspacePendingEdit=>e.kind==='workspace'&&e.accountId===selected.accountId&&e.itemKind===row.itemKind&&e.itemId===row.id&&e.scope===row.scope&&(e.scope==='account'||e.characterId===selected.characterId)&&e.periodKey===row.key.periodKey).sort((a,b)=>b.revision-a.revision);
    return {...row,completed:edits.find(e=>e.field==='count')?.desiredCompleted??row.completed,bookmarked:edits.find(e=>e.field==='bookmark')?edits.find(e=>e.field==='bookmark')!.desiredCompleted===1:row.bookmarked,waiting:edits.length>0,paused:edits.some(e=>e.phase!=='pending')};
  });
}
export function DesktopWorkspace({selected,pending,locked,kind,onEdit}:{selected:DesktopDetails|null;pending:PendingEdit[];locked:boolean;kind:'shop'|'mission';onEdit(key:WorkspaceKey,base:number,desired:number):void}){
  const [search,setSearch]=useState(''),[remaining,setRemaining]=useState(false),[favorites,setFavorites]=useState(false),[scope,setScope]=useState('all'),[cycle,setCycle]=useState('all');
  const name=kind==='shop'?'상점구매':'임무게시판';
  if(!selected)return <p>캐릭터를 선택하면 저장된 {name} 기록을 볼 수 있어요.</p>;
  if(!selected.details.workspace)return <p role="status">{name} 정보를 불러오지 못했어요. 다시 조회하거나 생텀 웹에서 확인해 주세요.</p>;
  const rows=desktopWorkspaceRows(selected,pending).filter(r=>r.itemKind===kind),q=search.trim().toLocaleLowerCase('ko-KR');
  const shown=rows.filter(r=>(!remaining||r.completed!==r.total||r.paused)&&(!favorites||r.bookmarked)&&(scope==='all'||scope===r.scope)&&(cycle==='all'||cycle===r.resetType)&&(!q||[r.title,r.location,r.npc,r.description,...r.rewards.map(x=>x.name)].join(' ').toLocaleLowerCase('ko-KR').includes(q))).sort((a,b)=>Number(b.bookmarked)-Number(a.bookmarked)||a.location.localeCompare(b.location,'ko-KR')||a.title.localeCompare(b.title,'ko-KR'));
  return <div className="iris-workspace">
    <label className="iris-workspace-search"><span>{name} 검색</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={kind==='shop'?'마을 · NPC · 품목':'마을 · 임무 · 보상'}/></label>
    <div className="iris-workspace-filters">
      {kind==='shop'&&<><label>범위<select aria-label="상점 범위" value={scope} onChange={e=>setScope(e.target.value)}><option value="all">전체</option><option value="character">캐릭당</option><option value="account">계정당</option></select></label><label>주기<select aria-label="상점 주기" value={cycle} onChange={e=>setCycle(e.target.value)}><option value="all">전체</option><option>일간</option><option>주간</option></select></label></>}
      <label><input type="checkbox" checked={remaining} onChange={e=>setRemaining(e.target.checked)}/>미완료만</label><label><input type="checkbox" checked={favorites} onChange={e=>setFavorites(e.target.checked)}/>즐겨찾기만</label>
    </div>
    <p className="iris-workspace-note">완료 {rows.filter(r=>r.completed===r.total).length}/{rows.length} · {kind==='shop'?'일간 매일 / 주간 월요일':'매주 월요일'} 06시 초기화</p>
    <p className="iris-workspace-note">생텀 기록을 직접 수정해요. 게임 구매·임무 수행을 대신하지 않아요.</p>
    <div className="iris-workspace-list">{shown.map(r=>{
      const disabled=locked||r.paused,change=(field:'count'|'bookmark',desired:number)=>onEdit({...r.key,field},field==='count'?r.completed:Number(r.bookmarked),desired);
      return <article className="iris-workspace-card" data-workspace-id={r.itemKind+':'+r.id} data-complete={r.completed===r.total} key={r.itemKind+':'+r.id}>
        <header><button type="button" className="iris-workspace-star" aria-label={r.title+' 즐겨찾기'} aria-pressed={r.bookmarked} disabled={disabled} onClick={()=>change('bookmark',Number(!r.bookmarked))}>{r.bookmarked?'★':'☆'}</button><div><strong>{r.title}</strong><small>{r.location}{r.npc?' · '+r.npc:''}</small></div></header>
        <div className="iris-workspace-meta"><span>{r.resetType}</span><span>{r.scope==='account'?'계정당':'캐릭당'}</span>{r.waiting&&<span>{r.paused?'결과 확인 필요':'저장 대기'}</span>}</div>
        {r.description&&<p className="iris-workspace-description">{r.description}</p>}
        <ul className="iris-workspace-rewards" aria-label="보상">{r.rewards.map((reward,i)=><li key={i}><span>{reward.name}</span><strong>× {reward.count.toLocaleString('ko-KR')}</strong></li>)}</ul>
        {r.cost!==null&&<p className="iris-workspace-cost">1회 {r.cost.toLocaleString('ko-KR')} 골드 · 총 {(r.cost*r.total).toLocaleString('ko-KR')} 골드</p>}
        {r.requirement&&<p className="iris-workspace-note">구매 조건: {r.requirement}</p>}
        {r.completed>r.total&&<p className="iris-workspace-note">최대 횟수가 줄었어요. 저장된 {r.completed}회는 유지했어요. 감소 또는 MIN으로 직접 조정해 주세요.</p>}
        <div className="iris-workspace-controls"><button type="button" className="iris-desktop-button iris-icon-button" aria-label={r.title+' 횟수 감소'} disabled={disabled||r.completed===0} onClick={()=>change('count',Math.min(r.total,r.completed-1))}>−</button><output aria-label={r.title+' 횟수'}>{r.completed}/{r.total}</output><button type="button" className="iris-desktop-button iris-icon-button" aria-label={r.title+' 횟수 증가'} disabled={disabled||r.completed>=r.total} onClick={()=>change('count',r.completed+1)}>+</button><button type="button" className="iris-desktop-button" aria-label={r.title+(r.completed>=r.total?' 모두 초기화':' 모두 완료')} disabled={disabled} onClick={()=>change('count',r.completed>=r.total?0:r.total)}>{r.completed>=r.total?'MIN':'MAX'}</button></div>
        {r.paused&&<p role="status" className="iris-workspace-note">저장 안내에서 결과를 확인해 주세요.</p>}
      </article>;
    })}{shown.length===0&&<p className="iris-workspace-note">{rows.length?'조건에 맞는 항목이 없어요.':'등록된 항목이 없어요.'}</p>}</div>
  </div>;
}
