import {NextRequest,NextResponse} from 'next/server';
import {AccountOnlineError,accountOnlineEnabled,updateAccountOnline,readAccountOnline} from '@/lib/server/accountOnline';
import {parseOnlineCommand} from '@/lib/accountOnline';
import {SANCTUM_SESSION_COOKIE} from '@/lib/server/sanctumSession';
const headers={'Cache-Control':'private, no-store'};
function failure(error:unknown){return NextResponse.json({message:error instanceof AccountOnlineError?error.message:'온라인 상태를 확인하지 못했어요.'},{status:error instanceof AccountOnlineError?error.status:503,headers});}
async function body(request:NextRequest){
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new AccountOnlineError(415,'JSON 요청이 필요해요.');
 const reader=request.body?.getReader();if(!reader)throw new AccountOnlineError(400,'연결 정보를 확인해 주세요.');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();throw new AccountOnlineError(413,'요청이 너무 커요.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 try{return parseOnlineCommand(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));}catch{throw new AccountOnlineError(400,'연결 정보를 확인해 주세요.');}
}
export async function POST(request:NextRequest){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({message:'요청 출처를 확인해 주세요.'},{status:403,headers});
 if(!accountOnlineEnabled())return NextResponse.json({enabled:false,code:'online-disabled'},{status:503,headers});
 try{return NextResponse.json(await updateAccountOnline(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value,await body(request)),{headers});}catch(error){return failure(error);}
}
export async function GET(request:NextRequest){
 if(!accountOnlineEnabled())return NextResponse.json({enabled:false},{headers});
 try{return NextResponse.json(await readAccountOnline(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value),{headers});}catch(error){return failure(error);}
}
