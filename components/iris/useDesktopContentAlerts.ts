'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {calculateSanctumEvents,type AbyssTimingReport} from '@/lib/sanctumEventTimes';
import {alertTypes,createContentAlertTracker,defaultAlertSettings,readAlertSettings,writeAlertSettings,type ContentAlert,type IrisAlertSettings} from '@/lib/irisContentAlerts';
export type DeepReport={id:string|number;zone:string;channel:string;reported_at:string;reporter_name:string};
export function useDesktopContentAlerts(accountId:string|null,environment:string,blocked:boolean){
  const [reports,setReports]=useState<{accountId:string|null;abyss:AbyssTimingReport[];deep:DeepReport[]}>({accountId:null,abyss:[],deep:[]}),[now,setNow]=useState(()=>Date.now()),[settings,setSettings]=useState<IrisAlertSettings>(defaultAlertSettings),[persistent,setPersistent]=useState(true),[error,setError]=useState(''),[nextAlert,setNextAlert]=useState<ContentAlert|null>(null);
  const current=useRef({blocked,settings,reports,nextAlert}),scope=useRef(0),loading=useRef(false),queue=useRef<ContentAlert[]>([]),tracker=useRef(createContentAlertTracker(0)),refreshAction=useRef<()=>Promise<void>>(async()=>{});
  useEffect(()=>{current.current={blocked,settings,reports,nextAlert};},[blocked,settings,reports,nextAlert]);
  useEffect(()=>{let prefs:ReturnType<typeof readAlertSettings>;try{prefs=readAlertSettings(window.localStorage,environment);}catch{prefs={settings:defaultAlertSettings(),persistent:false};}queueMicrotask(()=>{setSettings(prefs.settings);setPersistent(prefs.persistent);});},[environment]);
  useEffect(()=>{
    const epoch=++scope.current;let alive=true;const abort=new AbortController();queue.current=[];tracker.current=createContentAlertTracker(Date.now());loading.current=false;queueMicrotask(()=>{if(alive){setNextAlert(null);setReports({accountId,abyss:[],deep:[]});setError('');}});
    if(!accountId)return()=>{alive=false;abort.abort();};
    const refresh=async()=>{if(!alive||loading.current)return;loading.current=true;try{const [a,d]=await Promise.all([supabase.from('abyss_reports').select('id,hole_time,status,reporter_name').order('hole_time',{ascending:false}).limit(10).abortSignal(abort.signal),supabase.from('deep_holes').select('id,zone,channel,reported_at,reporter_name').order('reported_at',{ascending:false}).limit(20).abortSignal(abort.signal)]);if(a.error||d.error)throw Error();if(alive&&scope.current===epoch){setReports({accountId,abyss:a.data??[],deep:d.data??[]});setError('');}}catch{if(alive&&scope.current===epoch)setError('제보를 읽지 못했어요. 다시 조회해 주세요.');}finally{if(scope.current===epoch)loading.current=false;}};
    refreshAction.current=refresh;void refresh();
    const channels=(['abyss_reports','deep_holes'] as const).map(table=>{let subscribed=false;return supabase.channel(`iris-alerts:${accountId}:${epoch}:${table}`).on('postgres_changes',{event:'*',schema:'public',table},payload=>{if(!alive||scope.current!==epoch)return;const row=payload.new as Record<string,unknown>,old=payload.old as Record<string,unknown>;setReports(previous=>{if(previous.accountId!==accountId)return previous;const key=table==='abyss_reports'?'abyss':'deep',rows=previous[key].filter(r=>String(r.id)!==String(row.id??old.id));if(payload.eventType!=='DELETE'&&row.id!==undefined)rows.unshift(row as never);return {...previous,[key]:rows.slice(0,key==='abyss'?10:20)};});}).subscribe(status=>{if(!alive)return;if(status==='SUBSCRIBED'){if(subscribed){tracker.current=createContentAlertTracker(Date.now());queue.current=[];void refresh();}subscribed=true;}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')setError('실시간 제보 연결이 끊겼어요. 다시 조회해 주세요.');});});
    const tick=()=>{if(!alive)return;const at=Date.now(),value=current.current;setNow(at);if(value.reports.accountId!==accountId)return;const events=calculateSanctumEvents(at,value.reports.abyss),candidates:ContentAlert[]=[];
      for(const type of alertTypes){if(type==='deep')continue;const event=events[type];if(event.status==='waiting')continue;const began=event.status==='imminent'?event.at-120000:event.at;candidates.push({key:`${type}:${event.at}:${event.status}`,type,at:began,phase:event.status,confirmed:event.confirmed});}
      for(const row of value.reports.deep){const reported=Date.parse(row.reported_at),count=Number(row.channel);if(reported>events.deep.periodStart&&count>0&&count<=3)candidates.push({key:`deep:${row.id}:${row.reported_at}`,type:'deep',at:reported,phase:'report',confirmed:true,message:`${row.zone==='hz_001'?'창백한 산':row.zone==='hz_002'?'센마이 평원':row.zone} · ${count}개 제보`});}
      for(const candidate of candidates){const alert=tracker.current.take(candidate,at,value.settings);if(alert)queue.current.push(alert);}
      queue.current=queue.current.filter(alert=>at-alert.at<=15000&&value.settings[alert.type].enabled).slice(-4);
      if(!value.blocked&&!value.nextAlert&&!document.querySelector('[role="dialog"]')){const alert=queue.current.shift();if(alert){current.current={...value,nextAlert:alert};setNextAlert(alert);}}
    };tick();const timer=setInterval(tick,1000);
    return()=>{alive=false;abort.abort();clearInterval(timer);for(const channel of channels)void supabase.removeChannel(channel);refreshAction.current=async()=>{};};
  },[accountId,environment]);
  const changeSettings=useCallback((value:IrisAlertSettings)=>{setSettings(value);if(persistent){try{setPersistent(writeAlertSettings(window.localStorage,environment,value));}catch{setPersistent(false);}}},[environment,persistent]);
  const dismiss=useCallback(()=>{current.current={...current.current,nextAlert:null};setNextAlert(null);},[]);
  const visibleReports=reports.accountId===accountId?reports:{accountId,abyss:[],deep:[]};
  return {events:calculateSanctumEvents(now,visibleReports.abyss),reports:visibleReports,settings,setSettings:changeSettings,persistent,error,nextAlert:reports.accountId===accountId?nextAlert:null,dismiss,refresh:()=>refreshAction.current()};
}
