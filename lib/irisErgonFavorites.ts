import type {ErgonPlanItem} from './irisErgonPlan';

export type ErgonFavorite={kind:ErgonPlanItem['kind'];displayName:string};
export type FavoriteStorage=Pick<Storage,'getItem'|'setItem'>;
const key=(environment:string,accountId:string)=>`iris_ergon_favorites:v1:${encodeURIComponent(environment)}:${encodeURIComponent(accountId)}`;
const fits=(raw:string)=>new TextEncoder().encode(raw).length<=32768;
export function parseErgonFavorites(value:unknown):ErgonFavorite[]{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('즐겨찾기 형식을 확인해 주세요.');
 const envelope=value as Record<string,unknown>;
 if(Object.keys(envelope).length!==2||envelope.schemaVersion!==1||!Array.isArray(envelope.items)||envelope.items.length>200||!fits(JSON.stringify(value)))throw Error('즐겨찾기는 최대 200개예요.');
 const seen=new Set<string>();
 return envelope.items.map(value=>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('즐겨찾기 형식을 확인해 주세요.');
  const row=value as ErgonFavorite;
  if(Object.keys(row).length!==2||!['gathering','altering','crafting'].includes(row.kind)||typeof row.displayName!=='string'||!row.displayName.trim()||row.displayName.length>160||/[\x00-\x1f\x7f]/.test(row.displayName))throw Error('즐겨찾기 품목을 확인해 주세요.');
  const identity=JSON.stringify([row.kind,row.displayName]);if(seen.has(identity))throw Error('이미 담긴 즐겨찾기예요.');seen.add(identity);
  return {kind:row.kind,displayName:row.displayName};
 });
}
export function readErgonFavorites(storage:FavoriteStorage,environment:string,accountId:string):{items:ErgonFavorite[];persistent:boolean;unreadable:boolean}{
 let raw:string|null;try{raw=storage.getItem(key(environment,accountId));}catch{return {items:[],persistent:false,unreadable:false};}
 if(raw===null)return {items:[],persistent:true,unreadable:false};
 try{if(!fits(raw))throw Error();return {items:parseErgonFavorites(JSON.parse(raw)),persistent:true,unreadable:false};}catch{return {items:[],persistent:true,unreadable:true};}
}
export function writeErgonFavorites(storage:FavoriteStorage,environment:string,accountId:string,items:ErgonFavorite[]):boolean{
 try{if(readErgonFavorites(storage,environment,accountId).unreadable)return false;const envelope={schemaVersion:1,items};parseErgonFavorites(envelope);storage.setItem(key(environment,accountId),JSON.stringify(envelope));return true;}catch{return false;}
}
