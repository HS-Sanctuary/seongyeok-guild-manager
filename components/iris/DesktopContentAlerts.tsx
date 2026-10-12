'use client';
import {useEffect,useRef,useState} from 'react';
import {alertTypes,type IrisAlertType} from '@/lib/irisContentAlerts';
import type {useDesktopContentAlerts} from './useDesktopContentAlerts';
import {DesktopContentReport} from './DesktopContentReport';
import {DesktopFocusDialog} from './DesktopFocusDialog';
const titles={fieldBoss:'필드보스',barrier:'소환의 결계',abyss:'어비스 구멍',deep:'심층 구멍'};
const marks={fieldBoss:'필드보스',barrier:'여신상',abyss:'어비스',deep:'레이드'};
function AlertMark({type}:{type:IrisAlertType}){const url=encodeURI(`/svgs/contens mark/${marks[type]} 마크.svg`);return <span className="iris-alert-mark" aria-hidden="true" style={{maskImage:`url("${url}")`,WebkitMaskImage:`url("${url}")`}}/>;}
export function DesktopContentAlerts({alerts,locked,suspendDialogs=false,onReportBusy}:{alerts:ReturnType<typeof useDesktopContentAlerts>;locked:boolean;suspendDialogs?:boolean;onReportBusy?(busy:boolean):void}){
  const [report,setReport]=useState<'deep'|'abyss'|null>(null);
  return <div className="iris-content-alerts"><header><h2>콘텐츠 알림</h2><button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>void alerts.refresh()}>제보 재조회</button></header>{alerts.error&&<p className="iris-caption" role="status">{alerts.error}</p>}{!alerts.persistent&&<p className="iris-caption" role="alert">설정을 저장하지 못했어요. 이번 실행에만 적용돼요.</p>}{alertTypes.map(type=>{const settings=alerts.settings[type],event=alerts.events[type],time=type==='deep'?`${Math.floor(event.sec/60)}분 후 제보 초기화`:`${Math.floor(event.sec/60)}분 ${Math.floor(event.sec%60)}초`;return <section className="iris-alert-card" key={type}><h3><AlertMark type={type}/>{titles[type]}</h3><p className="iris-caption">{type!=='deep'&&'status' in event?(event.status==='active'?'출현중 · ':event.status==='imminent'?'출현 임박 · ':'다음 안내 · '):''}{time}{type==='abyss'&&'isDefault' in event&&event.isDefault?' (예상 주기)':''}</p><div className="iris-alert-switches"><label><input type="checkbox" checked={settings.enabled} onChange={e=>alerts.setSettings({...alerts.settings,[type]:{...settings,enabled:e.target.checked}})}/>{titles[type]} 알림</label><label><input type="checkbox" checked={settings.sound} disabled={!settings.enabled} onChange={e=>alerts.setSettings({...alerts.settings,[type]:{...settings,sound:e.target.checked}})}/>소리 {settings.sound?'ON':'OFF'}</label></div>{(type==='deep'||type==='abyss')&&<button type="button" className="iris-desktop-button" disabled={locked} onClick={()=>setReport(type)}>제보하기</button>}</section>;})}<p className="iris-caption">한국 시간 기준 · 이 PC의 알림 설정만 저장해요. 구멍은 CLI 조회가 아니라 생텀 제보를 사용해요.</p>{report&&<DesktopContentReport active={!suspendDialogs} onBusyChange={onReportBusy} type={report} onClose={()=>setReport(null)} onSaved={()=>void alerts.refresh()}/>}</div>;
}
export function DesktopContentAlertModal({alerts,playSound,blocked=false}:{alerts:ReturnType<typeof useDesktopContentAlerts>;playSound?:()=>Promise<void>;blocked?:boolean}){
  const alert=alerts.nextAlert,[soundError,setSoundError]=useState('');const played=useRef('');
  useEffect(()=>{if(!alert||played.current===alert.key)return;played.current=alert.key;queueMicrotask(()=>setSoundError(''));if(alerts.settings[alert.type].enabled&&alerts.settings[alert.type].sound){if(playSound)void playSound().catch(()=>setSoundError('소리를 재생하지 못했어요. 화면 알림은 유지돼요.'));else queueMicrotask(()=>setSoundError('새 앱으로 다시 실행하면 알림 소리도 사용할 수 있어요.'));}},[alert,alerts.settings,playSound]);
  if(!alert||blocked)return null;
  const title=alert.phase==='report'?'심층 구멍 제보 도착':`${titles[alert.type]} ${alert.phase==='imminent'?'출현 2분 전!':'출현!'}`;
  return <DesktopFocusDialog title={title} onClose={alerts.dismiss}><div className="iris-content-alert-message"><AlertMark type={alert.type}/><p>{alert.message??'게임에서 확인해 주세요.'}</p></div>{soundError&&<p className="iris-caption" role="status">{soundError}</p>}<button type="button" className="iris-desktop-button" onClick={alerts.dismiss}>확인</button></DesktopFocusDialog>;
}
