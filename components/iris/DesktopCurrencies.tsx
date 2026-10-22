'use client';
import {useCallback,useEffect,useState} from 'react';
import type {CurrencySnapshot} from '@/lib/irisCurrencies';
import type {CurrencyCacheView} from '@/lib/irisCurrencyCache';
import {defaultEmphasis,type AppearanceEnvironment} from '@/lib/irisAppearance';
import {useDesktopAppearance} from './useDesktopAppearance';
import {DesktopCurrencyAppearance} from './DesktopCurrencyAppearance';
import {SettingsIcon} from './DesktopIcons';
const timeFormat=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
type Props={active:boolean;readPaused?:boolean;readCurrencies():Promise<CurrencySnapshot>;environment:AppearanceEnvironment;accountId:string;loadCache?():Promise<CurrencyCacheView|null>;refreshCache?():Promise<CurrencyCacheView>};
export function DesktopCurrencies({active,readPaused=false,readCurrencies,environment,accountId,loadCache,refreshCache}:Props){
 const [record,setRecord]=useState<CurrencyCacheView|null>(null),[snapshot,setSnapshot]=useState<CurrencySnapshot|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
 const [editing,setEditing]=useState(false),appearance=useDesktopAppearance(environment,accountId,false);
 const closeEditor=useCallback(()=>setEditing(false),[]);
 useEffect(()=>{
  let live=true;
  const accept=(value:CurrencyCacheView|null)=>{if(live&&value&&value.accountId===accountId&&value.environment===environment)setRecord(value);};
  void (async()=>{
   try{if(loadCache)accept(await loadCache());}catch{if(live)setError('마지막 재화 기록을 읽지 못했어요. 기존 파일은 유지돼요.');}
   if(!live||!active||readPaused)return;
   setBusy(true);setError('');
   try{if(refreshCache)accept(await refreshCache());else{const value=await readCurrencies();if(live)setSnapshot(value);}}
   catch{if(live)setError('재화 조회 또는 보관에 실패했어요. 마지막 확인값은 현재 잔액이 아니에요.');}
   finally{if(live)setBusy(false);}
  })();
  return()=>{live=false;};
 },[active,readPaused,readCurrencies,loadCache,refreshCache,environment,accountId,refresh]);
 const scoped=record?.accountId===accountId&&record.environment===environment?record:null;
 const items=scoped?.items??snapshot?.items.map(item=>({...item,observedAt:snapshot.observedAt}))??[];
 return <section className="iris-stats-card iris-currencies" aria-label="인게임 재화">
  <header className="iris-currency-heading"><h2>인게임 재화</h2><div><span className="iris-caption">{items.length?'마지막 확인 기록':'조회 전'}</span><button type="button" className="iris-desktop-button" disabled={busy||readPaused||!active} onClick={()=>setRefresh(n=>n+1)}>새로고침</button><button type="button" className="iris-desktop-button iris-icon-button" aria-label="재화 강조 설정" title="재화 강조 설정" disabled={!items.length} onClick={()=>setEditing(true)}><SettingsIcon/></button></div></header>
  {busy&&<p role="status">재화 조회 중…</p>}{error&&<p role="alert">{error}</p>}
  {!!items.length&&<><p className="iris-caption">게임 캐릭터 귀속 미확인 · 마지막 확인값이며 현재 가용 잔액을 보장하지 않아요.</p><dl className="iris-stats-values iris-currency-values">{items.map(item=>{const style=Object.hasOwn(appearance.emphasis,item.name)?appearance.emphasis[item.name]:defaultEmphasis;return <div key={item.name} style={{color:style.color??'var(--text-main)',fontWeight:style.bold?700:400,fontStyle:style.italic?'italic':'normal'}}><dt>{item.name}</dt><dd>{item.amount===null?'미확인':item.amount.toLocaleString('ko-KR')}</dd><span className="iris-caption"><time dateTime={item.observedAt}>{timeFormat.format(new Date(item.observedAt))}</time> (한국 시간)</span></div>;})}</dl></>}
  {!items.length&&!busy&&<p>보관된 재화가 없어요. 새로고침으로 조회해 주세요.</p>}
  {!refreshCache&&<p className="iris-caption">이 앱에서는 재화 기록을 보관하지 못해요. 이번 화면의 조회값만 표시해요.</p>}
  <p className="iris-caption iris-currency-note">조회 기록은 이 PC에만 보관해요. 생텀 DB에 저장하거나 자동 실행의 가용 잔액으로 사용하지 않아요.</p>
  {!appearance.persistent&&<p className="iris-caption" role="status">표시 설정을 저장하지 못했어요. 이번 실행에만 적용돼요.</p>}
  {active&&editing&&<DesktopCurrencyAppearance items={items} emphasis={appearance.emphasis} onApply={appearance.setEmphasis} onClose={closeEditor}/>}
 </section>;
}
