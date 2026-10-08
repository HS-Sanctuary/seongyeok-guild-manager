'use client';
import {useCallback,useEffect,useState} from 'react';
import type {CurrencySnapshot} from '@/lib/irisCurrencies';
import {defaultEmphasis,type AppearanceEnvironment} from '@/lib/irisAppearance';
import {useDesktopAppearance} from './useDesktopAppearance';
import {DesktopCurrencyAppearance} from './DesktopCurrencyAppearance';
import {SettingsIcon} from './DesktopIcons';
export function DesktopCurrencies({active,readCurrencies,environment,accountId}:{active:boolean;readCurrencies():Promise<CurrencySnapshot>;environment:AppearanceEnvironment;accountId:string}){
  const [snapshot,setSnapshot]=useState<CurrencySnapshot|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [editing,setEditing]=useState(false),appearance=useDesktopAppearance(environment,accountId,false);
  const closeEditor=useCallback(()=>setEditing(false),[]);
  useEffect(()=>{
    let live=true;
    if(active)queueMicrotask(()=>{if(!live)return;setBusy(true);setError('');void readCurrencies().then(value=>{if(live)setSnapshot(value);}).catch(()=>{if(live)setError('재화를 읽지 못했어요. 게임과 커넥터 활성화를 확인해 주세요. 이전 값은 최신 정보가 아니에요.');}).finally(()=>{if(live)setBusy(false);});});
    return()=>{live=false;};
  },[active,readCurrencies]);
  return <section className="iris-stats-card iris-currencies" aria-label="인게임 재화"><header className="iris-currency-heading"><h2>인게임 재화</h2><div><span className="iris-caption">{snapshot?`조회 ${new Date(snapshot.observedAt).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})}`:'조회 전'}</span><button type="button" className="iris-desktop-button iris-icon-button" aria-label="재화 강조 설정" title="재화 강조 설정" disabled={!snapshot?.items.length} onClick={()=>setEditing(true)}><SettingsIcon/></button></div></header>{busy&&<p role="status">재화 조회 중…</p>}{error&&<p role="alert">{error}</p>}{snapshot?<><dl className="iris-stats-values iris-currency-values">{snapshot.items.map(item=>{const style=Object.hasOwn(appearance.emphasis,item.name)?appearance.emphasis[item.name]:defaultEmphasis;return <div key={item.name} style={{color:style.color??'var(--text-main)',fontWeight:style.bold?700:400,fontStyle:style.italic?'italic':'normal'}}><dt>{item.name}</dt><dd>{item.amount===null?'미확인':item.amount.toLocaleString('ko-KR')}</dd></div>;})}</dl>{snapshot.items.length===0&&<p>조회된 재화가 없어요.</p>}</>:!busy&&<p>재화 탭을 열면 게임에서 조회해요.</p>}<p className="iris-caption iris-currency-note">조회만 해요. 생텀 DB에는 저장하지 않아요.</p>{!appearance.persistent&&<p className="iris-caption" role="status">표시 설정을 저장하지 못했어요. 이번 실행에만 적용돼요.</p>}{active&&editing&&snapshot&&<DesktopCurrencyAppearance items={snapshot.items} emphasis={appearance.emphasis} onApply={appearance.setEmphasis} onClose={closeEditor}/>}</section>;
}
