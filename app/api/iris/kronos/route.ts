import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";
import { buildIrisKronosDetails, summarizeIrisKronosDetails } from "@/lib/irisKronos";
import {getIrisPeriodKeys,IrisWriteError} from '@/lib/irisKronosWrite';
import {saveIrisKronosEdit} from '@/lib/server/irisKronosWrite';
import {classWriteContext} from '@/lib/irisClassWrite';

const headers = {"Cache-Control":"private, no-store"};
export async function GET(request: NextRequest) {
  try {
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) return NextResponse.json({message:"로그인이 필요합니다."},{status:401,headers});
    const characterId = request.nextUrl.searchParams.get('characterId');
    if (!characterId || characterId.length > 100 || /[\u0000-\u0020\u007f]/u.test(characterId)) {
      return NextResponse.json({message:"캐릭터를 선택해 주세요."},{status:400,headers});
    }
    const db = getServerSupabase();
    const {data:character,error} = await db.from('characters')
      .select('id,nickname,owner,daily_checks,weekly_checks,raid_checks,levels').eq('id',characterId).maybeSingle();
    if (error) throw error;
    const owned = character && (character.owner === account.nickname || (!character.owner && character.nickname === account.nickname));
    if (!owned) return NextResponse.json({message:"본인 캐릭터만 조회할 수 있습니다."},{status:403,headers});
    const [tasks,contents,classes] = await Promise.all([
      db.from('nexus_tasks').select('id,type,name,mobile_name,max_count,is_active').eq('is_active',true),
      db.from('nexus_contents').select('id,type,name,mobile_name,short_name,is_active').eq('is_active',true),
      db.from('nexus_classes').select('id,name').eq('is_active',true).order('id'),
    ]);
    if (tasks.error || contents.error || classes.error || !Array.isArray(tasks.data) || !Array.isArray(contents.data) || !Array.isArray(classes.data)) throw new Error('Catalog unavailable');
    const observed=new Date();
    const details=buildIrisKronosDetails(character,tasks.data,contents.data,classes.data,observed);
    return NextResponse.json({accountId:account.id,characterId:String(character.id),
      summary:summarizeIrisKronosDetails(details),details,writeContext:{periodKeys:getIrisPeriodKeys(observed),classes:details.classes.map(c=>classWriteContext(character.levels,c.id,c.name))},observedAt:observed.toISOString()}, {headers});
  } catch {
    return NextResponse.json({message:"크로노스 정보를 불러오지 못했습니다."},{status:503,headers});
  }
}

export async function POST(request:NextRequest){
  try{
    if(request.headers.get('origin')!==request.nextUrl.origin)return NextResponse.json({message:'요청 출처를 확인해 주세요.'},{status:403,headers});
    const account=await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if(!account||isPendingAccount(account))return NextResponse.json({message:'로그인이 필요합니다.'},{status:401,headers});
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))throw new IrisWriteError(400);
    // Bound streamed bodies too, not only a forgeable Content-Length header.
    const reader=request.body?.getReader();if(!reader)throw new IrisWriteError(400);
    const chunks:Uint8Array[]=[];let bytes=0;
    while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>65536){await reader.cancel();throw new IrisWriteError(413);}chunks.push(value);}
    let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new IrisWriteError(400);}
    if(!body||Array.isArray(body)||Object.keys(body).length!==1||!Object.hasOwn(body,'edit'))throw new IrisWriteError(400);
    const result=await saveIrisKronosEdit(getServerSupabase(),{id:String(account.id),nickname:account.nickname},body.edit);
    return NextResponse.json({result},{headers});
  }catch(error){const status=error instanceof IrisWriteError?error.status:503;return NextResponse.json({message:status===409?'숙제 정보나 기간이 바뀌었어요. 다시 확인해 주세요.':'숙제를 저장하지 못했어요.'},{status,headers});}
}
