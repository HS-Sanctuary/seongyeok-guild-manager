export const alertTypes=['fieldBoss','barrier','abyss','deep'] as const;
export type IrisAlertType=typeof alertTypes[number];
export type IrisAlertSettings=Record<IrisAlertType,{enabled:boolean;sound:boolean}>;
export type ContentAlert={key:string;type:IrisAlertType;at:number;phase:'imminent'|'active'|'report';confirmed:boolean;message?:string};
export function defaultAlertSettings():IrisAlertSettings{return {fieldBoss:{enabled:true,sound:true},barrier:{enabled:true,sound:true},abyss:{enabled:true,sound:true},deep:{enabled:true,sound:true}};}
export function parseAlertSettings(raw:unknown):IrisAlertSettings{
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==4)throw Error('알림 설정을 확인해 주세요.');const value=raw as IrisAlertSettings;
  for(const type of alertTypes){const row=value[type];if(!Object.hasOwn(value,type)||!row||Object.keys(row).length!==2||typeof row.enabled!=='boolean'||typeof row.sound!=='boolean')throw Error('알림 설정을 확인해 주세요.');}return Object.fromEntries(alertTypes.map(type=>[type,{...value[type]}])) as IrisAlertSettings;
}
export function readAlertSettings(storage:Pick<Storage,'getItem'>,environment:string){try{const raw=storage.getItem(`iris:alerts:v1:${environment}`);if(!raw)return {settings:defaultAlertSettings(),persistent:true};const parsed=JSON.parse(raw);if(!parsed||parsed.version!==1||Object.keys(parsed).length!==2)throw Error();return {settings:parseAlertSettings(parsed.settings),persistent:true};}catch{return {settings:defaultAlertSettings(),persistent:false};}}
export function writeAlertSettings(storage:Pick<Storage,'setItem'>,environment:string,value:IrisAlertSettings){try{storage.setItem(`iris:alerts:v1:${environment}`,JSON.stringify({version:1,settings:parseAlertSettings(value)}));return true;}catch{return false;}}
export function createContentAlertTracker(startedAt:number){
  const seen=new Map<string,number>();
  return {take(event:ContentAlert,now:number,settings:IrisAlertSettings):ContentAlert|null{
    if(!event||!alertTypes.includes(event.type)||!Number.isFinite(event.at)||!Number.isFinite(now)||!event.key||event.key.length>200||!['imminent','active','report'].includes(event.phase))return null;
    if(event.at>now)return null;
    if(seen.has(event.key))return null;seen.set(event.key,event.at);
    for(const [key,at] of seen)if(now-at>2*86400000)seen.delete(key);
    if(seen.size>512)seen.delete(seen.keys().next().value!);
    return event.confirmed&&event.at>=startedAt&&now-event.at<=15000&&settings[event.type].enabled?event:null;
  }};
}
