'use client';
import {useCallback,useEffect,useState} from 'react';
import {irisThemes,applyIrisTheme,readAppearance,writeTheme,writeCurrencyEmphasis,type AppearanceEnvironment,type CurrencyEmphasisMap,type IrisTheme} from '@/lib/irisAppearance';
export function useDesktopAppearance(environment:AppearanceEnvironment,accountId:string|null,manageTheme=true){
  const [state,setState]=useState(()=>({theme:'aureum' as IrisTheme,emphasis:{} as CurrencyEmphasisMap,persistent:true,scope:''}));
  const currentScope=environment+':'+(accountId??'');
  useEffect(()=>{
    let live=true;
    queueMicrotask(()=>{if(!live||!manageTheme)return;let value:ReturnType<typeof readAppearance>;try{value=readAppearance(window.localStorage,environment,null);}catch{value={theme:'aureum',emphasis:{},persistent:false};}applyIrisTheme(value.theme);setState(old=>({...old,theme:value.theme,persistent:old.persistent&&value.persistent}));});
    const changed=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.environment===environment&&typeof detail.theme==='string'&&Object.hasOwn(irisThemes,detail.theme)){if(manageTheme)applyIrisTheme(detail.theme);setState(old=>({...old,theme:detail.theme,persistent:old.persistent&&detail.persistent!==false}));}};
    window.addEventListener('iris-appearance-theme',changed);return()=>{live=false;window.removeEventListener('iris-appearance-theme',changed);};
  },[environment,manageTheme]);
  useEffect(()=>{
    let live=true;queueMicrotask(()=>{if(!live)return;let value:ReturnType<typeof readAppearance>;try{value=readAppearance(window.localStorage,environment,accountId);}catch{value={theme:'aureum',emphasis:{},persistent:false};}setState(old=>({...old,emphasis:value.emphasis,persistent:old.persistent&&value.persistent,scope:currentScope}));});
    return()=>{live=false;};
  },[environment,accountId,currentScope]);
  const setTheme=useCallback((theme:IrisTheme)=>{if(!Object.hasOwn(irisThemes,theme))return;let persisted=false;try{persisted=writeTheme(window.localStorage,environment,theme);}catch{}applyIrisTheme(theme);setState(old=>({...old,theme,persistent:old.persistent&&persisted}));window.dispatchEvent(new CustomEvent('iris-appearance-theme',{detail:{environment,theme,persistent:persisted}}));},[environment]);
  const setEmphasis=useCallback((emphasis:CurrencyEmphasisMap)=>{let persisted=false;try{if(accountId)persisted=writeCurrencyEmphasis(window.localStorage,environment,accountId,emphasis);}catch{}setState(old=>({...old,emphasis,persistent:old.persistent&&persisted,scope:currentScope}));},[environment,accountId,currentScope]);
  return {...state,emphasis:state.scope===currentScope?state.emphasis:{},setTheme,setEmphasis};
}
