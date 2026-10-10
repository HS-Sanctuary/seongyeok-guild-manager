'use client';
import {AccountIcon,SettingsIcon,HomeIcon} from './DesktopIcons';
export function DesktopContextActions({onAccount,onSettings,accountOpen=false,settingsOpen=false,disabled=false}:{onAccount():void;onSettings():void;accountOpen?:boolean;settingsOpen?:boolean;disabled?:boolean}){
  return <nav className="iris-context-actions" aria-label="계정 도구">
    <button type="button" className="iris-desktop-button iris-icon-button" aria-label="계정" title="계정" aria-haspopup="dialog" aria-expanded={accountOpen} aria-pressed={accountOpen} disabled={disabled} onClick={onAccount}><AccountIcon/></button>
    <a className="iris-desktop-button iris-icon-button" aria-label="생텀 바로가기" title="생텀 바로가기 · 기본 브라우저" href="https://sanctum-tawny-three.vercel.app/" target="_blank" rel="noopener noreferrer"><HomeIcon/></a>
    <button type="button" className="iris-desktop-button iris-icon-button" aria-label="설정" title="설정" aria-pressed={settingsOpen} disabled={disabled} onClick={onSettings}><SettingsIcon/></button>
  </nav>;
}
