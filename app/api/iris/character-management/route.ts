import {NextRequest,NextResponse} from 'next/server';
import {getServerSupabase,getSessionAccount,isPendingAccount,SANCTUM_SESSION_COOKIE} from '@/lib/server/sanctumSession';
import {CharacterMetaError,manageOwnedCharacter,readCharacterMetadata} from '@/lib/server/irisCharacterManagement';
import {parseCharacterMetaIntent} from '@/lib/irisCharacterManagement';
const headers={'Cache-Control':'private, no-store'};
async function execute(request:NextRequest,write:boolean){try{
 if(write&&request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({message:'요청 출처를 확인해 주세요.'},{status:403,headers});
 const account=await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);if(!account||isPendingAccount(account))return NextResponse.json({message:'로그인이 필요해요.'},{status:401,headers});
 let intent;
 if(write){const declared=Number(request.headers.get('content-length')||'0');if(declared>4096)throw new CharacterMetaError('변경 요청이 너무 커요.',400);const text=await request.text();if(new TextEncoder().encode(text).byteLength>4096)throw new CharacterMetaError('변경 요청이 너무 커요.',400);try{intent=parseCharacterMetaIntent(JSON.parse(text));}catch{throw new CharacterMetaError('변경할 닉네임·주클래스를 확인해 주세요.',400);}}
 const db=getServerSupabase(),result=intent?await manageOwnedCharacter(db,account.nickname,intent):await readCharacterMetadata(db,account.nickname);return NextResponse.json({accountId:account.id,...result},{headers});
 }catch(error){return NextResponse.json({message:error instanceof CharacterMetaError?error.message:'현재 캐릭터 정보를 확인하지 못했어요. 다시 읽어 주세요.'},{status:error instanceof CharacterMetaError?error.status:503,headers});}}
export const GET=(request:NextRequest)=>execute(request,false);
export const POST=(request:NextRequest)=>execute(request,true);
