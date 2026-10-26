import {ergonSnapshotStale,type ErgonSnapshot} from './irisErgonRead';
export type ErgonPlanItem={id:string;kind:'gathering'|'altering'|'crafting';displayName:string;targetQuantity:number};
export function requiredErgonRuns(quantity:number,verifiedOutput:number):number{
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>1000000||!Number.isSafeInteger(verifiedOutput)||verifiedOutput<1||verifiedOutput>1000000)throw Error('목표와 확인된 1회 산출량이 필요해요.');
 return Math.ceil(quantity/verifiedOutput);
}
type Storage=Pick<globalThis.Storage,'getItem'|'setItem'>;
const key=(environment:string,accountId:string)=>`iris_ergon_plans:v1:${encodeURIComponent(environment)}:${encodeURIComponent(accountId)}`;
const fits=(text:string)=>new TextEncoder().encode(text).length<=32768;
export function parseErgonPlans(value:unknown):ErgonPlanItem[]{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('계획 형식 오류');
 const envelope=value as Record<string,unknown>;
 if(Object.keys(envelope).length!==2||envelope.schemaVersion!==1||!Array.isArray(envelope.items)||envelope.items.length>50||!fits(JSON.stringify(value)))throw Error('계획 형식 오류');
 const ids=new Set<string>();
 return envelope.items.map(value=>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('계획 형식 오류');
  const r=value as ErgonPlanItem;
  if(Object.keys(r).length!==4||typeof r.id!=='string'||!r.id.trim()||r.id.length>160||ids.has(r.id)||!['gathering','altering','crafting'].includes(r.kind)||typeof r.displayName!=='string'||!r.displayName.trim()||r.displayName.length>160||/[\x00-\x1f\x7f]/.test(r.displayName+r.id)||!Number.isSafeInteger(r.targetQuantity)||r.targetQuantity<1||r.targetQuantity>1000000)throw Error('계획 형식 오류');
  ids.add(r.id);return {id:r.id,kind:r.kind,displayName:r.displayName,targetQuantity:r.targetQuantity};
 });
}
export function readErgonPlans(storage:Storage,environment:string,accountId:string):{items:ErgonPlanItem[];persistent:boolean;unreadable:boolean}{
 let raw:string|null;try{raw=storage.getItem(key(environment,accountId));}catch{return {items:[],persistent:false,unreadable:false};}
 if(raw===null)return {items:[],persistent:true,unreadable:false};
 try{if(!fits(raw))throw Error();return {items:parseErgonPlans(JSON.parse(raw)),persistent:true,unreadable:false};}catch{return {items:[],persistent:true,unreadable:true};}
}
export function writeErgonPlans(storage:Storage,environment:string,accountId:string,items:ErgonPlanItem[],reset=false):boolean{
 try{if(!reset&&readErgonPlans(storage,environment,accountId).unreadable)return false;const envelope={schemaVersion:1,items};parseErgonPlans(envelope);storage.setItem(key(environment,accountId),JSON.stringify(envelope));return true;}catch{return false;}
}
export function calculateErgonPlan(item:ErgonPlanItem,catalog:ErgonSnapshot|null|undefined,now:number){
 const result:{requiredRuns:number|null;wingMinimum:number|null;wingMaximum:number|null;outputPerRun:number|null;missingScope:'one-unit-only'|'unavailable';reasons:string[]}={requiredRuns:null,wingMinimum:null,wingMaximum:null,outputPerRun:null,missingScope:'unavailable',reasons:[]};
 if(!Number.isSafeInteger(item.targetQuantity)||item.targetQuantity<1||item.targetQuantity>1000000){result.reasons.push('목표 수량을 확인해 주세요.');return result;}
 if(!catalog||catalog.kind!==item.kind||ergonSnapshotStale(catalog,now)){result.reasons.push('최신 목록을 다시 조회해 주세요.');return result;}
 const items=(catalog.data as {items:{name:string;producedPerUnit?:number|null;missing?:unknown}[]}).items;
 const matches=items.filter(row=>row.name===item.displayName);
 if(matches.length!==1){result.reasons.push('품목을 하나로 확인하지 못했어요.');return result;}
 if(item.kind==='gathering'){
  result.requiredRuns=Math.ceil(item.targetQuantity/100);result.wingMinimum=result.requiredRuns*5;
  result.reasons.push('채집은 한 번에 최대 100개예요. 실제 수확량·총 날개 소모는 달라질 수 있어요.');return result;
 }
 const recipe=matches[0],output=recipe.producedPerUnit;
 result.missingScope=Array.isArray(recipe.missing)?'one-unit-only':'unavailable';
 result.reasons.push('전체 재료표가 없어 목표 전체의 부족 재료·연쇄 제작은 아직 계산하지 않아요.');
 if(typeof output!=='number'||!Number.isSafeInteger(output)||output<=0){result.reasons.push('1회 산출량을 확인하지 못했어요.');return result;}
 result.outputPerRun=output;result.requiredRuns=requiredErgonRuns(item.targetQuantity,output);result.wingMaximum=result.requiredRuns*5;result.wingMinimum=item.kind==='crafting'?5:result.wingMaximum;
 if(item.kind==='crafting')result.reasons.push('제작은 여러 횟수를 한 명령으로 묶을 수 있어요. 시설별 한도와 묶음 방식에 따라 날개 소모가 달라져요.');
 return result;
}
