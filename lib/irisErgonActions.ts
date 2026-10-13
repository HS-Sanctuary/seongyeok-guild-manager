export type ErgonAction='gathering'|'altering'|'crafting'|'collect';
export type ErgonChallenge={schemaVersion:1;nonce:string;expiresAt:number;accountId:string;characterId:string;accountLabel:string;characterLabel:string;action:ErgonAction;displayName:string;expectedWings:5|null;wings:number;outputPerRun:number|null;owned:number|null;facility:string|null;completed:{displayName:string;count:number}[]};
export type ErgonActionCurrent={id:string;accountId:string;characterId:string;action:ErgonAction;displayName:string;state:'running'|'completed'|'registered'|'rejected'|'unknown';expectedWings:5|null;beforeWings:number;afterWings:number|null;afterOwned:number|null;message:string|null};
export type ErgonActionState={schemaVersion:1;busy:boolean;blocked:boolean;state:'idle'|ErgonActionCurrent['state'];current:ErgonActionCurrent|null};
export type ErgonActionRecord={requestId:string;accountId:string;characterId:string;action:ErgonAction;displayName:string;expectedWings:5|null;startedAt:number;state:'inflight'|'completed'|'registered'|'rejected'|'unknown'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function exact(value:unknown,keys:string[]):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
function name(value:unknown,max=160):value is string{return typeof value==='string'&&value.length>0&&value.length<=max&&value.trim().length>0&&!/[\x00-\x1f\x7f]/.test(value);}
function integer(value:unknown,max=Number.MAX_SAFE_INTEGER):value is number{return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=max;}
function action(value:unknown):value is ErgonAction{return value==='gathering'||value==='altering'||value==='crafting'||value==='collect';}
function cost(value:unknown){return value===null||value===5;}
function id(value:unknown):value is string{return typeof value==='string'&&uuid.test(value);}
export function parseErgonChallenge(value:unknown):ErgonChallenge{
 const keys=['schemaVersion','nonce','expiresAt','accountId','characterId','accountLabel','characterLabel','action','displayName','expectedWings','wings','outputPerRun','owned','facility','completed'];
 if(!exact(value,keys)||value.schemaVersion!==1||!id(value.nonce)||!integer(value.expiresAt)||value.expiresAt===0||!name(value.accountId,100)||!name(value.characterId,100)||!name(value.accountLabel,100)||!name(value.characterLabel,12)||!action(value.action)||!name(value.displayName)||!cost(value.expectedWings)||!integer(value.wings)||!(value.outputPerRun===null||integer(value.outputPerRun,1000000))||!(value.owned===null||integer(value.owned))||!(value.facility===null||name(value.facility))||!Array.isArray(value.completed)||value.completed.length>32||value.completed.some(item=>!exact(item,['displayName','count'])||!name(item.displayName)||!integer(item.count,2048)||item.count===0))throw Error('에르곤 작업 확인 내용을 검증하지 못했어요.');
 return value as ErgonChallenge;
}
export function parseErgonActionReceipt(value:unknown):{schemaVersion:1;id:string;state:'running'|'cancelled'}{
 if(!exact(value,['schemaVersion','id','state'])||value.schemaVersion!==1||!id(value.id)||(value.state!=='running'&&value.state!=='cancelled'))throw Error('에르곤 작업 접수 결과를 확인하지 못했어요.');return value as {schemaVersion:1;id:string;state:'running'|'cancelled'};
}
export function parseErgonActionState(value:unknown):ErgonActionState{
 if(!exact(value,['schemaVersion','busy','blocked','state','current'])||value.schemaVersion!==1||typeof value.busy!=='boolean'||typeof value.blocked!=='boolean'||!['idle','running','completed','registered','rejected','unknown'].includes(String(value.state)))throw Error('에르곤 작업 상태를 확인하지 못했어요.');
 if(value.current===null){if(value.state!=='idle'||value.busy)throw Error('에르곤 작업 상태가 맞지 않아요.');}
 else {const row=value.current;if(!exact(row,['id','accountId','characterId','action','displayName','state','expectedWings','beforeWings','afterWings','afterOwned','message'])||!id(row.id)||!name(row.accountId,100)||!name(row.characterId,100)||!action(row.action)||!name(row.displayName)||row.state!==value.state||!cost(row.expectedWings)||!integer(row.beforeWings)||!(row.afterWings===null||integer(row.afterWings))||!(row.afterOwned===null||integer(row.afterOwned))||!(row.message===null||name(row.message,100)))throw Error('에르곤 작업 상태가 맞지 않아요.');}
 if(value.state==='unknown'&&!value.blocked)throw Error('결과 미확정 작업이 보호되지 않았어요.');
 return value as ErgonActionState;
}
export function parseErgonActionHistory(value:unknown):{schemaVersion:1;blocked:boolean;records:ErgonActionRecord[]}{
 if(!exact(value,['schemaVersion','blocked','records'])||value.schemaVersion!==1||typeof value.blocked!=='boolean'||!Array.isArray(value.records)||value.records.length>300||value.records.some(row=>!exact(row,['requestId','accountId','characterId','action','displayName','expectedWings','startedAt','state'])||!id(row.requestId)||!name(row.accountId,100)||!name(row.characterId,100)||!action(row.action)||!name(row.displayName)||!cost(row.expectedWings)||!integer(row.startedAt)||!['inflight','completed','registered','rejected','unknown'].includes(String(row.state))))throw Error('에르곤 작업 기록을 검증하지 못했어요.');
 return value as {schemaVersion:1;blocked:boolean;records:ErgonActionRecord[]};
}
