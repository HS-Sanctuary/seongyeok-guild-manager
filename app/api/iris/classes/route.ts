import {NextRequest,NextResponse} from 'next/server';
import {getServerSupabase,getSessionAccount,isPendingAccount,SANCTUM_SESSION_COOKIE} from '@/lib/server/sanctumSession';
import {saveIrisClassEdit} from '@/lib/server/irisClassWrite';
import {IrisWriteError} from '@/lib/irisKronosWrite';
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:NextRequest){
  try{
    if(request.headers.get('origin')!==request.nextUrl.origin)throw new IrisWriteError(403);
    const account=await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if(!account||isPendingAccount(account))throw new IrisWriteError(401);
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))throw new IrisWriteError(400);
    const reader=request.body?.getReader();if(!reader)throw new IrisWriteError(400);
    const chunks:Uint8Array[]=[];let bytes=0;
    while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>65536){await reader.cancel();throw new IrisWriteError(413);}chunks.push(value);}
    let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new IrisWriteError(400);}
    if(!body||Array.isArray(body)||Object.keys(body).length!==1||!Object.hasOwn(body,'edit'))throw new IrisWriteError(400);
    const result=await saveIrisClassEdit(getServerSupabase(),{id:String(account.id),nickname:account.nickname},body.edit);
    return NextResponse.json({result},{headers});
  }catch(error){const status=error instanceof IrisWriteError?error.status:503;return NextResponse.json({message:status===409?'클래스 정보가 바뀌었어요. 다시 확인해 주세요.':status===503?'저장된 클래스 정보를 웹에서 확인해 주세요.':'클래스 레벨을 저장하지 못했어요.'},{status,headers});}
}
