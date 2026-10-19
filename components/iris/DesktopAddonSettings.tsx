'use client';
import {useState,type ReactNode} from 'react';
import './addon-settings-categories.css';
import {DesktopFloatingSettings} from './DesktopFloatingSettings';
import type {FloatingState,FloatingPreferences} from '@/lib/irisFloating';
import {irisThemes,irisFontPoints,irisSavePositions,type IrisSavePosition,type IrisTheme,type IrisFontSize} from '@/lib/irisAppearance';
import type {DesktopAddonPreferences,DesktopAddonState} from '@/lib/irisDesktopStore';
import {DesktopFontPicker} from './DesktopFontPicker';
import type {DesktopFonts} from './useDesktopFonts';
const statusNames={searching:'게임 창을 기다리고 있어요.',attached:'게임 창에 붙어 있어요.',independent:'독립 창으로 사용 중이에요.', 'no-space':'옆 공간이 부족해 독립 창으로 유지해요.',unavailable:'게임 창을 확인할 수 없어 독립 창으로 유지해요.'};
export function DesktopAddonSettings({accountPanel,appearance,fonts,addonState,onPreferencesChange,onBack,onSavePreview,busy=false,error='',floating}:{accountPanel:ReactNode;appearance:{theme:IrisTheme;setTheme(theme:IrisTheme):void;savePosition?:IrisSavePosition;setSavePosition?(position:IrisSavePosition):void;opacityPercent?:number;setOpacityPercent?(percent:number):void;fontSize?:IrisFontSize;setFontSize?(size:IrisFontSize):void;fontFamily?:string;setFontFamily?(family:string):boolean;persistent:boolean};fonts?:DesktopFonts;addonState:DesktopAddonState|null;onPreferencesChange(value:DesktopAddonPreferences):void;onBack():void;onSavePreview?():void;busy?:boolean;error?:string;floating?:{state:FloatingState|null;busy:boolean;error:string;preferences(p:Partial<FloatingPreferences>):Promise<void>}}){
  const [category,setCategory]=useState<'floating'|'window'|'appearance'|'account'>('floating');
  const [customFont,setCustomFont]=useState(false),[fontDraft,setFontDraft]=useState<string|null>(null),[fontError,setFontError]=useState('');
  const family=appearance.fontFamily??'',preset=['','Malgun Gothic','Dotum','Gulim'].includes(family),fontChoice=customFont||!preset?'custom':family;
  return <section className="iris-addon-settings" aria-label="IRIS 설정">
    <header><h2>설정</h2><button type="button" className="iris-desktop-button" onClick={onBack}>이전 화면</button></header>
    {error&&<p role="alert" className="iris-caption">{error}</p>}
    <nav className="iris-settings-categories" aria-label="설정 분류">{([['floating','플로팅'],['window','사이드 바'],['appearance','테마·글꼴'],['account','계정·저장']] as const).map(([id,label])=><button type="button" key={id} className="iris-desktop-button" aria-pressed={category===id} onClick={()=>setCategory(id)}>{label}</button>)}</nav>
    <div hidden={category!=='floating'} aria-label="플로팅 설정">
    {floating&&<DesktopFloatingSettings state={floating.state} busy={busy} saving={floating.busy} error={floating.error} onChange={p=>floating.preferences(p)}/>}
    {!floating&&<p className="iris-caption">최신 IRIS 앱에서 플로팅 설정을 사용할 수 있어요.</p>}
    </div>
    <div hidden={category!=='window'} aria-label="사이드 바 설정">
    <section className="iris-setting-card"><h3>창 연동</h3><fieldset disabled={busy||!addonState}><legend>게임 창에 붙이기</legend><div className="iris-dock-buttons">{(['right','left','off'] as const).map(side=><button type="button" className="iris-desktop-button" aria-pressed={addonState?.dockSide===side} key={side} onClick={()=>onPreferencesChange({dockSide:side,sameLayer:addonState?.sameLayer??true})}>{{right:'오른쪽',left:'왼쪽',off:'끔'}[side]}</button>)}</div><label className="iris-setting-check"><input type="checkbox" checked={addonState?.sameLayer??true} onChange={event=>onPreferencesChange({dockSide:addonState?.dockSide??'right',sameLayer:event.target.checked})}/>게임과 같은 층으로 유지</label></fieldset><p role="status" className="iris-caption">{addonState?statusNames[addonState.status]:'새 앱으로 다시 실행하면 창 연동을 사용할 수 있어요.'}{addonState?.status==='attached'&&` (${addonState.actualSide==='right'?'오른쪽':'왼쪽'})`}</p><p className="iris-caption">직접 끌어 이동하면 붙이기가 꺼져요. 최소화 버튼은 플로팅으로 접고, 트레이에서도 IRIS를 다시 열 수 있어요.</p>{addonState&&!addonState.persistent&&<p role="alert" className="iris-caption">창 설정을 저장하지 못했어요. 이번 실행에만 적용돼요.</p>}</section>
    <p className="iris-caption">같은 층 유지는 게임·IRIS·바탕화면에서 유지돼요. 다른 프로그램을 누르면 그 뒤로 가요.</p>
    <section className="iris-setting-card"><h3>사이드 바 불투명도</h3><label className="iris-opacity-control"><span>{appearance.opacityPercent??100}%</span><input type="range" aria-label="투명도" min="30" max="100" step="1" value={appearance.opacityPercent??100} disabled={!appearance.setOpacityPercent} onChange={event=>appearance.setOpacityPercent?.(Number(event.target.value))}/></label><p className="iris-caption">사이드 바에만 적용해요. 플로팅 불투명도는 플로팅 분류에서 따로 조절해요.</p></section>
    </div>
    <div hidden={category!=='appearance'} aria-label="모양 설정">
    <section className="iris-setting-card"><h3>글자 설정</h3><p className="iris-caption">창 양쪽 가장자리를 끌어 폭을 조절해요. 선택한 폭은 재실행 후에도 유지돼요.</p>
      <label className="iris-caption">글자 크기<select aria-label="글자 크기" className="iris-desktop-input" disabled={!appearance.setFontSize} value={Number(((appearance.fontSize??18)*.75).toFixed(2))} onChange={event=>appearance.setFontSize?.(Number(event.target.value)*4/3)}>{irisFontPoints.map(pt=><option key={pt} value={pt}>{pt}pt</option>)}</select></label>
      {(appearance.fontSize??18)<40/3&&<p className="iris-caption" role="status">10pt 미만은 읽기 어려울 수 있어요. 큰 크기로 다시 바꿀 수 있어요.</p>}
      {fonts&&<DesktopFontPicker {...fonts} value={family} onChoose={name=>appearance.setFontFamily?.(name)??false}/>}
      <details><summary>글꼴 직접 입력</summary><label className="iris-caption">글꼴<select aria-label="글꼴" className="iris-desktop-input" disabled={!appearance.setFontFamily} value={fontChoice} onChange={event=>{const value=event.target.value;setCustomFont(value==='custom');setFontDraft(null);setFontError('');if(value!=='custom')appearance.setFontFamily?.(value);}}><option value="">기본</option><option value="Malgun Gothic">맑은 고딕</option><option value="Dotum">돋움</option><option value="Gulim">굴림</option><option value="custom">직접 입력</option></select></label>
      {fontChoice==='custom'&&<form onSubmit={event=>{event.preventDefault();if(!appearance.setFontFamily?.(fontDraft??family))setFontError('설치된 글꼴 이름을 80자 이내로 입력해 주세요.');else setFontError('');}}><label className="iris-caption">설치된 글꼴 이름<input className="iris-desktop-input" aria-label="설치된 글꼴 이름" maxLength={80} value={fontDraft??family} onChange={event=>setFontDraft(event.target.value)} placeholder="예: Segoe UI"/></label><button type="submit" className="iris-desktop-button">글꼴 적용</button>{fontError&&<p className="iris-caption" role="alert">{fontError}</p>}</form>}
      </details><p className="iris-caption">이 PC에 저장 · 없는 글꼴은 기본값 사용</p>
    </section>
    <section className="iris-setting-card"><h3>테마 선택</h3><div className="iris-theme-buttons">{Object.entries(irisThemes).map(([id,name])=><button type="button" className="iris-desktop-button" aria-pressed={appearance.theme===id} key={id} onClick={()=>appearance.setTheme(id as IrisTheme)}>{name}</button>)}</div>{!appearance.persistent&&<p role="alert" className="iris-caption">표시 설정을 저장하지 못했어요. 이번 실행에만 적용돼요.</p>}</section>
    </div>
    <div hidden={category!=='account'} aria-label="계정과 저장 설정">
    <section className="iris-setting-card"><h3>저장 안내 위치 설정</h3><div className="iris-save-position-buttons">{Object.entries(irisSavePositions).map(([id,label])=><button type="button" className="iris-desktop-button" key={id} disabled={!appearance.setSavePosition} aria-pressed={(appearance.savePosition??'bottom-right')===id} onClick={()=>appearance.setSavePosition?.(id as IrisSavePosition)}>{label}</button>)}</div><button type="button" className="iris-desktop-button" disabled={!onSavePreview} onClick={onSavePreview}>미리보기</button><p className="iris-caption">변경이 있을 때만 반투명하게 나타나요. 저장 완료 후 사라지고, 확인이 필요한 변경은 남아 있어요. 위치는 이 PC에만 기억해요.</p></section>
    <section className="iris-setting-card"><h3>생텀 계정</h3>{accountPanel}</section>
    <details className="iris-setting-card iris-usage-guide"><summary>사용 안내</summary><dl><div><dt>저장</dt><dd>숙제·물물교환·직접 입력한 클래스 레벨은 마지막 수정 후 15초에 저장해요.</dd></div><div><dt>게임 정보</dt><dd>스탯은 확인 후 직접 업데이트해요. 재화는 조회만 하고 DB에 저장하지 않아요.</dd></div><div><dt>초기화</dt><dd>일일 숙제는 06시, 주간 숙제는 월요일 06시예요. 물물교환은 품목에 표시된 주기를 따라요. 클래스 레벨은 유지돼요.</dd></div><div><dt>창 연동</dt><dd>게임 최소화·복원을 따라가요. 게임 종료 후 저장 또는 보관을 선택해 IRIS도 종료할 수 있어요.</dd></div></dl><p className="iris-caption">에르곤 작업은 대상과 소모를 확인한 뒤 직접 실행해요.</p></details>
    </div>
  </section>;
}
