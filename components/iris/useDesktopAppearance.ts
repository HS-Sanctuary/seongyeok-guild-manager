'use client';
import {useCallback,useEffect,useState} from 'react';
import {readIrisOpacity,writeIrisOpacity,validIrisOpacity} from '@/lib/irisAppearance';
import {irisThemes,applyIrisTheme,applyIrisFontSize,validIrisFontSize,readIrisFontSize,writeIrisFontSize,readIrisFontFamily,writeIrisFontFamily,normalizeIrisFontFamily,irisFontFamilyCss,readAppearance,writeTheme,writeCurrencyEmphasis,type AppearanceEnvironment,type CurrencyEmphasisMap,type IrisTheme,type IrisFontSize} from '@/lib/irisAppearance';
export function useDesktopAppearance(environment:AppearanceEnvironment,accountId:string|null,manageTheme=true){
  const [state,setState]=useState(()=>({theme:'aureum' as IrisTheme,emphasis:{} as CurrencyEmphasisMap,persistent:true,scope:''}));
  const [fontSize,setFontState]=useState<IrisFontSize>(18);
  const [fontFamily,setFamilyState]=useState('');
  const [opacity,setOpacityState]=useState({percent:100,scope:''});
  useEffect(()=>{if(!manageTheme)return;let live=true;queueMicrotask(()=>{if(!live)return;let value;try{value=readIrisOpacity(window.localStorage,environment);}catch{value={percent:100,persistent:false};}setOpacityState({percent:value.percent,scope:environment});if(!value.persistent)setState(old=>({...old,persistent:false}));});return()=>{live=false;};},[environment,manageTheme]);
  const setOpacityPercent=useCallback((percent:number)=>{if(!validIrisOpacity(percent))return;let persistent=false;try{persistent=writeIrisOpacity(window.localStorage,environment,percent);}catch{}setOpacityState({percent,scope:environment});if(!persistent)setState(old=>({...old,persistent:false}));},[environment]);
  const currentScope=environment+':'+(accountId??'');
  useEffect(()=>{if(!manageTheme)return;const root=document.documentElement,value=irisFontFamilyCss(fontFamily)??'inherit';root.style.setProperty('--iris-font-family',value);return()=>{if(root.style.getPropertyValue('--iris-font-family')===value)root.style.removeProperty('--iris-font-family');};},[fontFamily,manageTheme]);
  useEffect(()=>{
    if(!manageTheme)return;let live=true;
    queueMicrotask(()=>{if(!live)return;let value:{fontSize:IrisFontSize;persistent:boolean};try{value=readIrisFontSize(window.localStorage,environment);}catch{value={fontSize:18,persistent:false};}applyIrisFontSize(value.fontSize);setFontState(value.fontSize);if(!value.persistent)setState(old=>({...old,persistent:false}));});
    return()=>{live=false;};
  },[environment,manageTheme]);
  useEffect(()=>{if(!manageTheme)return;let live=true;queueMicrotask(()=>{if(!live)return;let value:ReturnType<typeof readIrisFontFamily>;try{value=readIrisFontFamily(window.localStorage,environment);}catch{value={fontFamily:'',persistent:false};}setFamilyState(value.fontFamily);if(!value.persistent)setState(old=>({...old,persistent:false}));});return()=>{live=false;};},[environment,manageTheme]);
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
  const setFontSize=useCallback((size:IrisFontSize)=>{if(!validIrisFontSize(size))return;let persisted=false;try{persisted=writeIrisFontSize(window.localStorage,environment,size);}catch{}applyIrisFontSize(size);setFontState(size);if(!persisted)setState(old=>({...old,persistent:false}));},[environment]);
  const setFontFamily=useCallback((family:string)=>{let normalized:string;try{normalized=normalizeIrisFontFamily(family);}catch{return false;}let persisted=false;try{persisted=writeIrisFontFamily(window.localStorage,environment,normalized);}catch{}setFamilyState(normalized);if(!persisted)setState(old=>({...old,persistent:false}));return true;},[environment]);
  return {...state,opacityPercent:opacity.scope===environment?opacity.percent:100,opacityReady:opacity.scope===environment,setOpacityPercent,fontSize,setFontSize,fontFamily,fontFamilyCss:irisFontFamilyCss(fontFamily),setFontFamily,emphasis:state.scope===currentScope?state.emphasis:{},setTheme,setEmphasis};
}
