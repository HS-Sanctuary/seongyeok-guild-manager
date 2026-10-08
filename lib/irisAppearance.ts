export const irisThemes={lumen:'Lumen',elysium:'Elysium',aureum:'Aureum',nemeton:'Nemeton',vesper:'Vesper',rosarium:'Rosarium'} as const;
export type IrisTheme=keyof typeof irisThemes;
export type AppearanceEnvironment='development'|'production';
export type CurrencyEmphasis={color:string|null;bold:boolean;italic:boolean};
export type CurrencyEmphasisMap=Record<string,CurrencyEmphasis>;
export const defaultEmphasis:CurrencyEmphasis={color:null,bold:false,italic:false};
export function currencyColorContrast(foreground:string,background:string):number|null{
  if(!/^#[0-9a-f]{6}$/i.test(foreground)||!/^#[0-9a-f]{6}$/i.test(background))return null;
  const luminance=(hex:string)=>{const values=[1,3,5].map(index=>{const value=parseInt(hex.slice(index,index+2),16)/255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;});return .2126*values[0]+.7152*values[1]+.0722*values[2];};
  const a=luminance(foreground),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
const scope=(environment:AppearanceEnvironment)=>{if(!['development','production'].includes(environment))throw Error('표시 설정 환경을 확인해 주세요.');return `iris_appearance:v1:${environment}`;};
const currencyKey=(environment:AppearanceEnvironment,id:string)=>{if(!id||id.length>200)throw Error('표시 설정 계정을 확인해 주세요.');return `${scope(environment)}:currencies:${encodeURIComponent(id)}`;};
export function parseCurrencyEmphasis(value:unknown):CurrencyEmphasisMap{
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>200)throw Error('재화 강조 설정을 확인해 주세요.');
  const result:CurrencyEmphasisMap=Object.create(null);
  for(const [name,raw] of Object.entries(value)){
    const row=raw as CurrencyEmphasis|null;
    if(!name.trim()||name.length>120||/[\x00-\x1f]/.test(name)||!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).length!==3||!Object.hasOwn(row,'color')||!Object.hasOwn(row,'bold')||!Object.hasOwn(row,'italic')||!(row.color===null||(typeof row.color==='string'&&/^#[0-9a-f]{6}$/i.test(row.color)))||typeof row.bold!=='boolean'||typeof row.italic!=='boolean')throw Error('재화 강조 설정을 확인해 주세요.');
    result[name]={color:row.color,bold:row.bold,italic:row.italic};
  }
  return result;
}
export function readAppearance(storage:Pick<Storage,'getItem'>,environment:AppearanceEnvironment,accountId:string|null){
  let theme:IrisTheme='aureum',emphasis:CurrencyEmphasisMap=Object.create(null),persistent=true;
  try{const raw=storage.getItem(`${scope(environment)}:theme`);if(raw!==null){if(!Object.hasOwn(irisThemes,raw))throw Error();theme=raw as IrisTheme;}}catch{persistent=false;}
  if(accountId)try{const raw=storage.getItem(currencyKey(environment,accountId));if(raw!==null){if(raw.length>32768)throw Error();const record=JSON.parse(raw);if(!record||record.version!==1||Object.keys(record).length!==2)throw Error();emphasis=parseCurrencyEmphasis(record.items);}}catch{persistent=false;}
  return {theme,emphasis,persistent};
}
export function writeTheme(storage:Pick<Storage,'setItem'>,environment:AppearanceEnvironment,theme:IrisTheme):boolean{
  try{if(!Object.hasOwn(irisThemes,theme))throw Error();storage.setItem(`${scope(environment)}:theme`,theme);return true;}catch{return false;}
}
export function writeCurrencyEmphasis(storage:Pick<Storage,'setItem'>,environment:AppearanceEnvironment,accountId:string,emphasis:CurrencyEmphasisMap):boolean{
  try{const data=JSON.stringify({version:1,items:parseCurrencyEmphasis(emphasis)});if(data.length>32768)throw Error();storage.setItem(currencyKey(environment,accountId),data);return true;}catch{return false;}
}
export function applyIrisTheme(theme:IrisTheme){
  const root=document.documentElement;root.dataset.theme=theme;
  for(const key of ['background','panel','panel-border','inner-box','text-main','text-sub','accent','accent-fg','accent-secondary','accent-secondary-fg','accent-secondary2','accent-secondary2-fg'])root.style.removeProperty(`--${key}`);
}
