import 'server-only';
import {getServerSupabase,hashSessionToken} from '@/lib/server/sanctumSession';
import {parseOnlineCommand,parseOnlineSnapshot,type OnlineCommand} from '@/lib/accountOnline';
export class AccountOnlineError extends Error {constructor(public readonly status:number,message:string){super(message);}}
const onlineEnvironment=()=>['production','preview','development'].includes(process.env.VERCEL_ENV??'')?process.env.VERCEL_ENV!:process.env.NODE_ENV==='development'?'development':'local';
export const accountOnlineEnabled=()=>process.env.SANCTUM_ACCOUNT_ONLINE_ENABLED==='true';
function authorize(token:string|undefined){if(!accountOnlineEnabled())throw new AccountOnlineError(503,'온라인 연결을 준비 중이에요.');if(!token)throw new AccountOnlineError(401,'로그인이 필요해요.');return hashSessionToken(token);}
function check(data:unknown):asserts data is Record<string,unknown>{if(!data||typeof data!=='object')throw Error();const status=(data as {status?:unknown}).status;if(status==='unauthorized')throw new AccountOnlineError(401,'로그인이 필요해요.');if(status==='conflict')throw new AccountOnlineError(409,'계정이 바뀌었어요.');if(status==='limit')throw new AccountOnlineError(429,'연결이 많아요. 잠시 후 다시 확인해 주세요.');}
export async function updateAccountOnline(token:string|undefined,command:OnlineCommand){
 const hash=authorize(token);
 try{
  const c=parseOnlineCommand(command),{data,error}=await getServerSupabase().rpc('sanctum_online_touch',{input_token_hash:hash,input_expected_account_id:c.expectedAccountId,input_connection_id:c.connectionId,input_sequence:c.sequence,input_kind:c.kind,input_action:c.action,input_environment:onlineEnvironment()});
  if(error)throw Error();check(data);
  if(!['recorded','closed','stale'].includes(data.status as string)||typeof data.accountId!=='string'||!/^[0-9a-f-]{36}$/i.test(data.accountId)||c.expectedAccountId&&data.accountId.toLowerCase()!==c.expectedAccountId.toLowerCase()||data.sequence!==c.sequence)throw Error();
  if(data.expiresAt!==null&&(typeof data.expiresAt!=='string'||!Number.isFinite(Date.parse(data.expiresAt))))throw Error();
  if(data.status==='recorded'&&data.expiresAt===null)throw Error();
  return {enabled:true,accountId:data.accountId,status:data.status,sequence:c.sequence,expiresAt:data.expiresAt===null?null:new Date(data.expiresAt as string).toISOString()};
 }catch(error){if(error instanceof AccountOnlineError)throw error;throw new AccountOnlineError(503,'온라인 연결을 확인하지 못했어요.');}
}
function normalizedTime(value:unknown):string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw Error();
 return new Date(value).toISOString();
}
export async function readAccountOnline(token:string|undefined){
 const hash=authorize(token);
 try{const {data,error}=await getServerSupabase().rpc('sanctum_online_snapshot',{input_token_hash:hash,input_environment:onlineEnvironment()});if(error)throw Error();check(data);if(!Array.isArray(data.accounts))throw Error();return parseOnlineSnapshot({...data,observedAt:normalizedTime(data.observedAt),accounts:data.accounts.map(row=>({accountId:row?.accountId,expiresAt:normalizedTime(row?.expiresAt)}))});}
 catch(error){if(error instanceof AccountOnlineError)throw error;throw new AccountOnlineError(503,'온라인 상태를 확인하지 못했어요.');}
}
