'use client';

export const kronosTabs={homework:'숙제',classes:'클래스',stats:'스탯',currencies:'재화',barter:'물물교환',shop:'상점구매',missions:'임무게시판',alerts:'알림'} as const;
export type KronosTab=keyof typeof kronosTabs;
const rows:ReadonlyArray<ReadonlyArray<KronosTab>>=[['homework','classes','stats','currencies'],['barter','shop','missions','alerts']];

export function DesktopFeaturePicker({value,disabled,onChoose}:{value:KronosTab;disabled:boolean;onChoose(tab:KronosTab):void}){
  return <nav className="iris-feature-picker" aria-label="크로노스 기능">
    {rows.map((row,index)=><div className="iris-feature-row" key={index}>{row.map(id=><button key={id} type="button" className="iris-desktop-button" disabled={disabled} aria-pressed={value===id} aria-controls={'iris-pane-'+id} onClick={()=>onChoose(id)}>{kronosTabs[id]}</button>)}</div>)}
  </nav>;
}
