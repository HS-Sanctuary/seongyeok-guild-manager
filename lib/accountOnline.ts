export const ONLINE_HEARTBEAT_MS = 300_000;
export const ONLINE_TTL_MS = 720_000;
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const plain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const time = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
export type OnlineCommand = {connectionId:string;sequence:number;kind:'web'|'iris';action:'touch'|'leave';expectedAccountId:string|null};
export type OnlineSnapshot = {enabled:true;viewerId:string;observedAt:string;accounts:{accountId:string;expiresAt:string}[]};
export function parseOnlineCommand(value:unknown):OnlineCommand {
 if (!plain(value) || Object.keys(value).sort().join(',') !== 'action,connectionId,expectedAccountId,kind,sequence' || !uuid(value.connectionId) || !Number.isSafeInteger(value.sequence) || (value.sequence as number)<1 || (value.sequence as number)>2147483647 || !['web','iris'].includes(value.kind as string) || !['touch','leave'].includes(value.action as string) || (value.expectedAccountId!==null&&!uuid(value.expectedAccountId)) || (value.kind==='web'&&value.expectedAccountId===null)) throw Error('연결 정보를 확인해 주세요.');
 return value as OnlineCommand;
}
export function parseOnlineSnapshot(value:unknown):OnlineSnapshot {
 if(!plain(value)||value.enabled!==true||!uuid(value.viewerId)||!time(value.observedAt)||!Array.isArray(value.accounts)||value.accounts.length>200)throw Error('온라인 상태를 확인하지 못했어요.');
 const observed=Date.parse(value.observedAt),seen=new Set<string>();
 const accounts=value.accounts.map(row=>{if(!plain(row)||!uuid(row.accountId)||seen.has(row.accountId)||!time(row.expiresAt)||Date.parse(row.expiresAt)<=observed||Date.parse(row.expiresAt)>observed+ONLINE_TTL_MS)throw Error('온라인 상태를 확인하지 못했어요.');seen.add(row.accountId);return {accountId:row.accountId,expiresAt:row.expiresAt};});
 return {enabled:true,viewerId:value.viewerId,observedAt:value.observedAt,accounts};
}
export function onlineAccountIds(snapshot:OnlineSnapshot|null,now=Date.now()):Set<string>{
 return new Set(snapshot?.accounts.filter(row=>Date.parse(row.expiresAt)>now).map(row=>row.accountId)??[]);
}
// Connection identity and timestamps are never evidence of activity. Session ownership
// is revalidated by the server; sequence + terminal leave fences delayed requests.
export function createOnlineReporter(send:(command:OnlineCommand,signal:AbortSignal)=>Promise<{enabled:boolean}>,now=()=>Date.now(),newId=()=>crypto.randomUUID()){
 let owner:string|null=null,connection:string|null=null,sequence=0,generation=0,next=0,disabled=false,flight:AbortController|null=null;
 function stop(){
  if(owner&&connection&&!disabled){const leave:OnlineCommand={connectionId:connection,sequence:++sequence,kind:'web',action:'leave',expectedAccountId:owner};void send(leave,new AbortController().signal).catch(()=>{});}
  owner=null;connection=null;generation++;flight?.abort();flight=null;
 }
 function setAccount(id:string|null){if(id!==null&&!uuid(id))id=null;if(owner===id)return;stop();owner=id;connection=id?newId():null;sequence=0;next=0;}
 async function tick(){
  if(disabled||!owner||!connection||flight||now()<next)return;
  const id=owner,version=generation,abort=new AbortController();flight=abort;next=now()+ONLINE_HEARTBEAT_MS;
  let timeout:ReturnType<typeof setTimeout>|undefined;
  let aborted:(()=>void)|undefined;
  try{
   const deadline=new Promise<never>((_resolve,reject)=>{
    aborted=()=>reject(Error('연결 요청이 중단됐어요.'));
    abort.signal.addEventListener('abort',aborted,{once:true});
    timeout=setTimeout(()=>abort.abort(),10_000);
   });
   const result=await Promise.race([send({connectionId:connection,sequence:++sequence,kind:'web',action:'touch',expectedAccountId:id},abort.signal),deadline]);
   if(version===generation&&!result.enabled)disabled=true;}
  catch(error){if(version===generation&&[401,403,409].includes((error as {status?:number}).status??0)){owner=null;connection=null;generation++;}}
  finally{clearTimeout(timeout);if(aborted)abort.signal.removeEventListener('abort',aborted);if(flight===abort)flight=null;}
 }
 return {setAccount,tick,stop};
}
