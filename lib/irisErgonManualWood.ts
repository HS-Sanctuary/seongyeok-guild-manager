import type {ProgressScope,QuantityConfirmation} from './irisErgonProgress';
export type ManualWoodIdentity={scope:ProgressScope;goalId:string;sourcePlanId:string};
export type ManualWoodWrite={revision:number;operationId:string;goalId:string;sourcePlanId:string;action:'altering';displayName:'목재';targetQuantity:100;receiptId:string;quantity:number;supersedesEventId?:string;reason?:string};
export type ManualWoodView={schemaVersion:1;scope:ProgressScope;goalId:string;sourcePlanId:string;action:'altering';displayName:'목재';targetQuantity:100;lifecycle:'active'|'paused'|'cancelled'|'archived';health:'ok'|'review-required'|'unavailable';revision:number;confirmedQuantity:number|null;remainingQuantity:number|null;receipts:{receiptId:string;confirmations:QuantityConfirmation[]}[]};
function need(ok:unknown):asserts ok{if(!ok)throw Error('가공 수량 기록의 대상과 저장 상태를 확인해 주세요.');}
function object(value:unknown,keys:string[]):Record<string,unknown>{need(value&&typeof value==='object'&&!Array.isArray(value));const r=value as Record<string,unknown>;need(Object.keys(r).length===keys.length&&keys.every(k=>Object.hasOwn(r,k)));return r;}
const integer=(v:unknown,max=Number.MAX_SAFE_INTEGER):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
const id=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)&&v!=='00000000-0000-0000-0000-000000000000';
export function parseManualWoodView(raw:unknown,identity:ManualWoodIdentity):ManualWoodView{
 const r=object(raw,['schemaVersion','scope','goalId','sourcePlanId','action','displayName','targetQuantity','lifecycle','health','revision','confirmedQuantity','remainingQuantity','receipts']);const scope=object(r.scope,['environment','accountId','characterId']);
 need(r.schemaVersion===1&&id(r.goalId)&&r.goalId===identity.goalId&&r.sourcePlanId===identity.sourcePlanId&&r.action==='altering'&&r.displayName==='목재'&&r.targetQuantity===100&&integer(r.revision)&&['active','paused','cancelled','archived'].includes(String(r.lifecycle))&&['ok','review-required','unavailable'].includes(String(r.health)));
 need(['environment','accountId','characterId'].every(k=>scope[k]===identity.scope[k as keyof ProgressScope])&&Array.isArray(r.receipts)&&r.receipts.length<=4000);
 const receiptIds=new Set(),eventIds=new Set(),revisions=new Set();let total=0,events=0;
 for(const receipt of r.receipts){const row=object(receipt,['receiptId','confirmations']);need(id(row.receiptId)&&!receiptIds.has(row.receiptId));receiptIds.add(row.receiptId);need(Array.isArray(row.confirmations)&&row.confirmations.length>0);let previous:Record<string,unknown>|null=null;
  for(const entry of row.confirmations){const e=object(entry,['eventId','revision','quantity','source','confirmedAt','supersedesEventId','reason']);need(++events<=4000&&id(e.eventId)&&!eventIds.has(e.eventId)&&integer(e.revision)&&e.revision>0&&e.revision<=r.revision&&!revisions.has(e.revision)&&integer(e.quantity,5000000)&&e.source==='user-confirmed'&&integer(e.confirmedAt,8640000000000000)&&e.confirmedAt>0);eventIds.add(e.eventId);revisions.add(e.revision);
   need(previous?e.supersedesEventId===previous.eventId&&e.revision>Number(previous.revision)&&typeof e.reason==='string'&&!!e.reason.trim()&&e.reason.length<=400:e.supersedesEventId===null&&e.reason===null);previous=e;
  }total+=Number(previous!.quantity);
 }need(r.receipts.length===0?r.confirmedQuantity===null&&r.remainingQuantity===null:r.confirmedQuantity===total&&r.remainingQuantity===Math.max(0,100-total));return structuredClone(r) as unknown as ManualWoodView;
}
export function manualWoodOperationApplied(view:ManualWoodView,p:ManualWoodWrite){
 if(view.health!=='ok'||view.goalId!==p.goalId||view.sourcePlanId!==p.sourcePlanId||view.revision<=p.revision)return false;
 const event=view.receipts.find(r=>r.receiptId===p.receiptId)?.confirmations.find(c=>c.eventId===p.operationId);
 return !!event&&event.quantity===p.quantity&&event.revision===p.revision+1&&event.supersedesEventId===(p.supersedesEventId??null)&&event.reason===(p.reason??null)&&event.source==='user-confirmed';
}
