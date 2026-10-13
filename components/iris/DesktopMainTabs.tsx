'use client';
import {KronosIcon,SynaxisIcon,ErgonIcon} from './DesktopIcons';
export type DesktopSection='kronos'|'synaxis'|'ergon';
const items=[
  {id:'kronos',name:'크로노스',subtitle:'캐릭터 관리',english:'CHRONOS',Icon:KronosIcon},
  {id:'synaxis',name:'시낙시스',subtitle:'파티 매칭',english:'SYNAXIS',Icon:SynaxisIcon},
  {id:'ergon',name:'에르곤',subtitle:'생활 매니저',english:'ERGON',Icon:ErgonIcon},
] as const;
export function DesktopMainTabs({section,locked,unread=false,onChoose}:{section:DesktopSection;locked:boolean;unread?:boolean;onChoose(section:DesktopSection):void}){
  return <nav className="iris-hud-tabs iris-main-tabs" aria-label="상위 메뉴">{items.map(({id,name,subtitle,english,Icon})=><button type="button" key={id} className="iris-desktop-button" aria-label={name} title={`${name} · ${subtitle}`} disabled={locked} aria-pressed={section===id} aria-controls={`iris-pane-${id}`} onClick={()=>onChoose(id)}>
    <span className="iris-main-tab-icon" aria-hidden="true"><Icon/></span>
    <span className="iris-main-tab-label" aria-hidden="true"><span className="iris-main-label-ko" data-module={id}><strong>{name}</strong><small>{subtitle}</small></span><span className="iris-main-label-en">{english}</span></span>
    {id==='synaxis'&&unread&&<span className="iris-party-red-dot" role="status" aria-label="새 파티 또는 길드버스"/>}
  </button>)}</nav>;
}
