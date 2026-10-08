import {NextRequest,NextResponse} from 'next/server';
import {getServerSupabase,getSessionAccount,isPendingAccount,SANCTUM_SESSION_COOKIE} from '@/lib/server/sanctumSession';
import {saveIrisStats} from '@/lib/server/irisStatsWrite';
import {IrisWriteError} from '@/lib/irisKronosWrite';
import {statKeys} from '@/lib/irisStats';
const headers={'Cache-Control':'private, no-store'};
const fail=(error:unknown)=>{const status=error instanceof IrisWriteError?error.status:503;return NextResponse.json({message:status===409?'생텀 값이 바뀌었어요. 다시 불러와 비교해 주세요.':status===401?'다시 로그인해 주세요.':'스탯 연결을 확인해 주세요.'},{status,headers});};
async function authenticate(request:NextRequest){const account=await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);if(!account||isPendingAccount(account))throw new IrisWriteError(401);return account;}
export async function GET(request:NextRequest){try{
  const account=await authenticate(request),db=getServerSupabase(),columns='id,nickname,job,owner,combat_power,life_energy,magic_resistance,charm';
  const owned=await db.from('characters').select(columns).eq('owner',account.nickname).limit(101);
  const legacy=await db.from('characters').select(columns).eq('nickname',account.nickname).maybeSingle();
  if(owned.error||legacy.error||!Array.isArray(owned.data))throw new IrisWriteError(503);
  const rows=[...owned.data],main=legacy.data;if(main&&!main.owner&&!rows.some(r=>String(r.id)===String(main.id)))rows.unshift(main);
  if(rows.length>100)throw new IrisWriteError(503);
  return NextResponse.json({accountId:String(account.id),characters:rows.map(row=>({id:String(row.id),nickname:row.nickname,job:row.job,stats:Object.fromEntries(statKeys.map(k=>[k,row[k]]))}))},{headers});
}catch(error){return fail(error);}}
export async function POST(request:NextRequest){try{
  if(request.headers.get('origin')!==request.nextUrl.origin)throw new IrisWriteError(403);
  const account=await authenticate(request);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))throw new IrisWriteError(400);
  const reader=request.body?.getReader();if(!reader)throw new IrisWriteError(400);const chunks:Uint8Array[]=[];let bytes=0;
  while(true){const next=await reader.read();if(next.done)break;bytes+=next.value.byteLength;if(bytes>4096){await reader.cancel();throw new IrisWriteError(413);}chunks.push(next.value);}
  let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new IrisWriteError(400);}
  const result=await saveIrisStats(getServerSupabase(),{id:String(account.id),nickname:account.nickname},body);return NextResponse.json({result},{headers});
}catch(error){return fail(error);}}
