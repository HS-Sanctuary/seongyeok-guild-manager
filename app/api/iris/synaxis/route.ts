import {NextRequest,NextResponse} from 'next/server';
import {getServerSupabase,getSessionAccount,isPendingAccount,SANCTUM_SESSION_COOKIE} from '@/lib/server/sanctumSession';
import {IrisSynaxisError,readIrisSynaxis,prepareIrisSynaxisCreate} from '@/lib/server/irisSynaxis';
import {POST as memberMutation} from '@/app/api/member-mutations/route';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:NextRequest){
  try{
    const account=await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if(!account||isPendingAccount(account))return NextResponse.json({message:'로그인이 필요합니다.'},{status:401,headers});
    if(request.nextUrl.searchParams.get('accountId')!==String(account.id))return NextResponse.json({message:'계정을 다시 확인해주세요.'},{status:403,headers});
    return NextResponse.json(await readIrisSynaxis(getServerSupabase(),{...account,id:String(account.id)}),{headers});
  }catch{return NextResponse.json({message:'파티 기준을 불러오지 못했어요. 다시 확인해주세요.'},{status:503,headers});}
}
export async function POST(request:NextRequest){
  let submitted=false;
  try{
    if(request.headers.get('origin')!==request.nextUrl.origin)return NextResponse.json({message:'요청 출처를 확인해주세요.'},{status:403,headers});
    const account=await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if(!account||isPendingAccount(account))return NextResponse.json({message:'로그인이 필요합니다.'},{status:401,headers});
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))throw new IrisSynaxisError('생성 요청을 확인해주세요.');
    const reader=request.body?.getReader();if(!reader)throw new IrisSynaxisError('생성 요청을 확인해주세요.');
    let size=0;const chunks:Uint8Array[]=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw new IrisSynaxisError('생성 내용이 너무 길어요.',413);}chunks.push(value);}
    let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new IrisSynaxisError('생성 내용을 확인해주세요.');}
    const payload=await prepareIrisSynaxisCreate(getServerSupabase(),{...account,id:String(account.id)},input);
    // Reuse the existing authenticated member write path, not a second direct DB writer.
    submitted=true;
    const response=await memberMutation(new NextRequest(new URL('/api/member-mutations',request.url),{method:'POST',headers:{origin:request.nextUrl.origin,'content-type':'application/json',cookie:request.headers.get('cookie')??''},body:JSON.stringify({table:'parties',action:'insert',expectedAccountId:String(account.id),payload})}));
    if(response.status===401||response.status===403)return NextResponse.json({message:'계정 또는 생성 권한을 다시 확인해주세요.'},{status:response.status,headers});
    if(!response.ok)throw new Error('Write outcome uncertain');
    const body=await response.json();const id=body?.data?.[0]?.id;
    if((typeof id!=='number'&&typeof id!=='string')||!/^\d+$/.test(String(id)))throw new Error('Write receipt missing');
    return NextResponse.json({kind:'created',partyId:String(id)},{headers});
  }catch(error){
    if(submitted)return NextResponse.json({kind:'unknown',message:'생성 결과를 확인하지 못했어요. 생텀 파티 목록을 먼저 확인해주세요. 자동 재전송하지 않아요.'},{status:502,headers});
    const status=error instanceof IrisSynaxisError?error.status:503;
    return NextResponse.json({message:error instanceof IrisSynaxisError?error.message:'생성 기준을 확인하지 못했어요. 다시 불러와주세요.'},{status,headers});
  }
}
