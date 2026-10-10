import {NextRequest,NextResponse} from 'next/server';
import {getServerSupabase,getSessionAccount,isPendingAccount,SANCTUM_SESSION_COOKIE} from '@/lib/server/sanctumSession';
import {WorkspaceError} from '@/lib/irisWorkspace';
import {saveIrisWorkspaceEdit} from '@/lib/server/irisWorkspaceWrite';
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:NextRequest){
  try{
    if(request.headers.get('origin')!==request.nextUrl.origin)throw new WorkspaceError(403);
    const account=await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if(!account||isPendingAccount(account))throw new WorkspaceError(401);
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))throw new WorkspaceError(400);
    const reader=request.body?.getReader();if(!reader)throw new WorkspaceError(400);
    const chunks:Uint8Array[]=[];let bytes=0;
    while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>16384){await reader.cancel();throw new WorkspaceError(413);}chunks.push(value);}
    let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new WorkspaceError(400);}
    if(!body||Array.isArray(body)||Object.keys(body).length!==1||!Object.hasOwn(body,'edit'))throw new WorkspaceError(400);
    const result=await saveIrisWorkspaceEdit(getServerSupabase(),{id:String(account.id),nickname:account.nickname},body.edit);
    return NextResponse.json({result},{headers});
  }catch(error){const status=error instanceof WorkspaceError?error.status:503;return NextResponse.json({message:status===409?'상점·임무 정보나 기간이 바뀌었어요. 다시 확인해 주세요.':'상점·임무를 저장하지 못했어요.'},{status,headers});}
}
