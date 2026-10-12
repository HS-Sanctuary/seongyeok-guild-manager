'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
type FontStore={fonts():Promise<string[]>;refreshFonts():Promise<string[]>};
export type DesktopFonts={fonts:string[]|null;busy:boolean;error:string;refresh():void};
export function useDesktopFonts(store:FontStore|null,environment:string,active:boolean):DesktopFonts{
  const scope=useRef<{store:FontStore|null;environment:string;attempted:boolean;pending:Promise<void>|null}>({store,environment,attempted:false,pending:null});
  const [state,setState]=useState({environment,fonts:null as string[]|null,busy:false,error:''});
  const read=useCallback((refresh=false)=>{
    const current=scope.current;if(!store||current.store!==store||current.environment!==environment||current.pending||(!refresh&&current.attempted))return;
    current.attempted=true;setState(old=>({...old,environment,busy:true,error:''}));
    current.pending=(refresh?store.refreshFonts():store.fonts()).then(fonts=>{if(scope.current===current)setState({environment,fonts,busy:false,error:''});}).catch(()=>{if(scope.current===current)setState(old=>({...old,environment,busy:false,error:'자동 목록을 읽지 못했어요. 앱을 다시 실행하거나 직접 입력해 주세요.'}));}).finally(()=>{current.pending=null;});
  },[store,environment]);
  useEffect(()=>{if(scope.current.store!==store||scope.current.environment!==environment)scope.current={store,environment,attempted:false,pending:null};if(active)queueMicrotask(()=>read());return()=>{if(scope.current.store!==store||scope.current.environment!==environment)return;};},[store,environment,active,read]);
  useEffect(()=>()=>{scope.current={store:null,environment:'',attempted:false,pending:null};},[]);
  return {fonts:state.environment===environment?state.fonts:null,busy:state.environment===environment&&state.busy,error:state.environment===environment?state.error:'',refresh:()=>read(true)};
}
