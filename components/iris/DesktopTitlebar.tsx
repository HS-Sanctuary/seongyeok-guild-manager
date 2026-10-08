'use client';
import {SettingsIcon} from './DesktopIcons';
export function DesktopTitlebar({onDrag,onMinimize,onClose,onSettings,settingsOpen=false}:{onDrag():void;onMinimize():void;onClose():void;onSettings():void;settingsOpen?:boolean}){
  return <header className="iris-titlebar" onMouseDown={event=>{if(event.button===0&&!(event.target as Element).closest('button,input,select,a')){event.preventDefault();onDrag();}}}>
    <h1 title="빈 영역을 끌어서 창을 이동해요.">IRIS <span>for SANCTUM</span></h1>
    <div className="iris-titlebar-actions"><button type="button" className="iris-desktop-button iris-icon-button" aria-label="설정" aria-pressed={settingsOpen} onClick={onSettings}><SettingsIcon/></button><button type="button" className="iris-desktop-button iris-icon-button" aria-label="IRIS 최소화" onClick={onMinimize}>−</button><button type="button" className="iris-desktop-button iris-icon-button" aria-label="IRIS 종료" onClick={onClose}>×</button></div>
  </header>;
}
