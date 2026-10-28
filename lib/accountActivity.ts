export const ACTIVITY_INTERVAL_MS=20*60*1000;
export type ActivityAccount={id:string;nickname:string;lastActiveAt:string|null};
export type ActivityDirectory={viewer:{id:string;nickname:string};observedAt:string;accounts:ActivityAccount[]};
export const activityAccountId=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const nickname=(v:unknown):v is string=>typeof v==='string'&&!!v.trim()&&Array.from(v).length<=12&&!/[\x00-\x1f\x7f]/.test(v);
const stamp=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
export function parseActivityDirectory(value:unknown):ActivityDirectory{
 if(!object(value)||!object(value.viewer)||!activityAccountId(value.viewer.id)||!nickname(value.viewer.nickname)||!stamp(value.observedAt)||!Array.isArray(value.accounts)||value.accounts.length>200)throw Error('활동 기록을 확인하지 못했어요.');
 const observedAt=value.observedAt,ids=new Set<string>(),names=new Set<string>();
 const accounts=value.accounts.map(row=>{if(!object(row)||!activityAccountId(row.id)||!nickname(row.nickname)||ids.has(row.id)||names.has(row.nickname)||(row.lastActiveAt!==null&&(!stamp(row.lastActiveAt)||Date.parse(row.lastActiveAt)>Date.parse(observedAt))))throw Error('활동 기록을 확인하지 못했어요.');ids.add(row.id);names.add(row.nickname);return {id:row.id,nickname:row.nickname,lastActiveAt:row.lastActiveAt as string|null};});
 return {viewer:{id:value.viewer.id,nickname:value.viewer.nickname},observedAt,accounts};
}
export function formatRecentActivity(value:string|null|undefined,now=Date.now()):string{
 if(!stamp(value)||!Number.isFinite(now)||Date.parse(value)>now+60000)return '기록 없음';
 const elapsed=Math.max(0,now-Date.parse(value)),days=Math.floor((now+9*3600000)/86400000)-Math.floor((Date.parse(value)+9*3600000)/86400000);
 if(days===1)return '어제';if(days>1)return `${days}일 전`;
 if(elapsed<60000)return '최근 활동 방금 전';if(elapsed<3600000)return `최근 활동 ${Math.floor(elapsed/60000)}분 전`;
 return `최근 활동 ${Math.floor(elapsed/3600000)}시간 전`;
}
// An expected ID is a cross-account guard, never authentication. The server
// resolves the cookie and DB time. No localStorage history or heartbeat exists.
export function createAccountActivityReporter(send:(expectedAccountId:string,signal:AbortSignal)=>Promise<{accountId:string}>,now=()=>Date.now()){
 let owner:string|null=null,generation=0,flight:{generation:number;abort:AbortController}|null=null,disabled=false;
 const next=new Map<string,number>();
 function setAccount(id:string|null){if(id!==null&&!activityAccountId(id))id=null;if(owner===id)return;owner=id;generation++;flight?.abort.abort();flight=null;}
 async function report():Promise<boolean>{
  const id=owner,version=generation,time=now();if(disabled||!id||flight||!Number.isFinite(time)||time<(next.get(id)??0))return false;
  const pending={generation:version,abort:new AbortController()};flight=pending;next.set(id,time+60000);if(next.size>100)next.delete(next.keys().next().value!);
  try{const result=await send(id,pending.abort.signal);if(version!==generation||id!==owner||pending.abort.signal.aborted)return false;if(result.accountId!==id)throw Object.assign(Error('활동 계정이 바뀌었어요.'),{status:409});next.set(id,time+ACTIVITY_INTERVAL_MS);return true;}
  catch(error){if(version===generation){const {status,code}=(error as {status?:number;code?:string})??{};if(status===503&&code==='activity-disabled')disabled=true;else if(status===401||status===403||status===409)setAccount(null);}return false;}
  finally{if(flight===pending)flight=null;}
 }
 return {setAccount,report};
}
