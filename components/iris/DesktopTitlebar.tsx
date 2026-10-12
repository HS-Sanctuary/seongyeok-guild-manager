'use client';
import {IRIS_VERSION_LABEL} from '@/lib/irisRelease';
import type {ReactNode} from 'react';
export function DesktopTitlebar({onDrag,onMinimize,onClose,updateControl,compact=false,onToggleCompact,compactBusy=false}:{onDrag():void;onMinimize():void;onClose():void;updateControl?:ReactNode;compact?:boolean;onToggleCompact?():void;compactBusy?:boolean}){
  return <header className="iris-titlebar" onMouseDown={event=>{if(event.button===0&&!(event.target as Element).closest('button,input,select,a')){event.preventDefault();onDrag();}}}>
    <h1 title="빈 영역을 끌어서 창을 이동해요."><span aria-hidden="true" className="iris-brand-mark" style={{maskImage:'url("'+encodeURI('/IRIS/logo/IRIS 로고 마크.svg')+'")',WebkitMaskImage:'url("'+encodeURI('/IRIS/logo/IRIS 로고 마크.svg')+'")'}}/><span className="iris-brand-title">IRIS <span>for SANCTUM</span><span className="iris-brand-version-row">{updateControl??<span className="iris-brand-version">{IRIS_VERSION_LABEL}</span>}</span></span></h1>
    <div className="iris-titlebar-actions"><button type="button" className="iris-desktop-button iris-icon-button" aria-label="IRIS 최소화" onClick={onMinimize}>−</button><button type="button" className="iris-desktop-button iris-icon-button" aria-label={compact?'IRIS 펼치기':'IRIS 접기'} aria-pressed={compact} disabled={!onToggleCompact||compactBusy} onClick={onToggleCompact}>□</button><button type="button" className="iris-desktop-button iris-icon-button" aria-label="IRIS 종료" onClick={onClose}>×</button></div>
  </header>;
}
