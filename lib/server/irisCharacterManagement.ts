import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {parseCharacterMetaIntent,type CharacterMetaIntent} from '@/lib/irisCharacterManagement';
type Row={id:string|number;nickname:string;job:string;owner:string;is_main:boolean|null;alias:string|null;sort_order:number|null};
export class CharacterMetaError extends Error{constructor(message:string,public status=409){super(message);}}
async function owned(db:SupabaseClient,owner:string):Promise<Row[]>{const result=await db.from('characters').select('id,nickname,job,owner,is_main,alias,sort_order').eq('owner',owner).order('sort_order',{ascending:true}).limit(101);if(result.error||!result.data||result.data.length>100)throw new CharacterMetaError('캐릭터 목록을 읽지 못했어요.',503);return result.data as Row[];}
export async function readCharacterMetadata(db:SupabaseClient,owner:string){const [characters,catalog]=await Promise.all([owned(db,owner),db.from('nexus_classes').select('name').eq('is_active',true).limit(200)]);if(catalog.error||!catalog.data)throw new CharacterMetaError('클래스 목록을 읽지 못했어요.',503);return {characters:characters.map(row=>({id:String(row.id),nickname:row.nickname,job:row.job,alias:row.alias,isMain:row.is_main===true,editable:true})),jobs:catalog.data.map(row=>row.name as string)};}
export async function manageOwnedCharacter(db:SupabaseClient,owner:string,raw:CharacterMetaIntent){
 const intent=parseCharacterMetaIntent(raw),before=await owned(db,owner),target=before.find(row=>String(row.id)===intent.characterId);
 if(intent.action!=='create'&&(!target||target.nickname!==intent.expected!.nickname||target.job!==intent.expected!.job||(target.is_main===true)!==intent.expected!.isMain))throw new CharacterMetaError('다른 창에서 캐릭터 정보가 바뀌었거나 소유를 확인하지 못했어요. 다시 읽어 주세요.');
 if(intent.action==='create'&&before.length>=100)throw new CharacterMetaError('등록 가능한 캐릭터 수를 초과했어요.');
 if(intent.action!=='makeMain'){
  if(!target||intent.job!==target.job){const catalog=await db.from('nexus_classes').select('name').eq('is_active',true).eq('name',intent.job).limit(1);if(catalog.error||!catalog.data?.some(row=>row.name===intent.job))throw new CharacterMetaError('사용 가능한 주클래스를 선택해 주세요.');}
  const collision=await db.from('characters').select('id').eq('nickname',intent.nickname).limit(2);if(collision.error)throw new CharacterMetaError('닉네임을 확인하지 못했어요.',503);if(collision.data?.some(row=>String(row.id)!==String(target?.id??'')))throw new CharacterMetaError('이미 등록된 닉네임이에요.');
 }
 if(intent.action==='create'){const result=await db.from('characters').insert({nickname:intent.nickname,job:intent.job,owner,is_main:false,alias:null,sort_order:before.length,contribution:0}).select('id').single();if(result.error||!result.data)throw new CharacterMetaError('등록 결과를 확인하지 못했어요. 다시 만들기 전에 목록을 확인해 주세요.',503);}
 else if(intent.action==='update'){
  let write=db.from('characters').update({nickname:intent.nickname,job:intent.job}).eq('id',target!.id).eq('owner',owner).eq('nickname',target!.nickname).eq('job',target!.job);
  write=target!.is_main===null?write.is('is_main',null):write.eq('is_main',target!.is_main);
  const result=await write.select('id').maybeSingle();if(result.error||!result.data)throw new CharacterMetaError('캐릭터 변경을 확인하지 못했어요. 현재 값을 다시 읽어 주세요.');
 }else{
  const others=before.filter(row=>row.is_main===true&&String(row.id)!==String(target!.id));
  if(others.length){const clear=await db.from('characters').update({is_main:false}).eq('owner',owner).in('id',others.map(row=>row.id)).eq('is_main',true).select('id');if(clear.error||clear.data?.length!==others.length)throw new CharacterMetaError('대표 변경이 일부만 적용됐을 수 있어요. 현재 목록을 먼저 확인해 주세요.',503);}
  let write=db.from('characters').update({is_main:true}).eq('id',target!.id).eq('owner',owner).eq('nickname',target!.nickname).eq('job',target!.job);write=target!.is_main===null?write.is('is_main',null):write.eq('is_main',target!.is_main);
  const set=await write.select('id').maybeSingle();if(set.error||!set.data)throw new CharacterMetaError('대표 변경이 일부만 적용됐을 수 있어요. 현재 목록을 먼저 확인해 주세요.',503);
 }
 const after=await readCharacterMetadata(db,owner);
 if(intent.action==='makeMain'&&(after.characters.filter(row=>row.isMain).length!==1||!after.characters.find(row=>row.id===intent.characterId)?.isMain))throw new CharacterMetaError('대표 변경 결과가 다른 창과 겹쳤어요. 목록을 다시 읽고 대표를 확인해 주세요.',503);
 if(intent.action!=='makeMain'&&!after.characters.some(row=>row.nickname===intent.nickname&&row.job===intent.job&&(intent.action==='create'||row.id===intent.characterId)))throw new CharacterMetaError('변경 결과를 확인하지 못했어요. 현재 목록을 다시 읽어 주세요.',503);
 return after;
}
