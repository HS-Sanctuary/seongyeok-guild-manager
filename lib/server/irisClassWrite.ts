import type {SupabaseClient} from '@supabase/supabase-js';
import {validateClassEdit,mergeClassLevel} from '@/lib/irisClassWrite';
import {IrisWriteError} from '@/lib/irisKronosWrite';
export async function saveIrisClassEdit(db:SupabaseClient,account:{id:string;nickname:string},value:unknown):Promise<{requestId:string;status:'saved';level:number}>{
  const edit=validateClassEdit(value);
  if(edit.accountId!==String(account.id))throw new IrisWriteError(403);
  const {data:character,error}=await db.from('characters').select('id,owner,levels').eq('id',edit.characterId).eq('owner',account.nickname).maybeSingle();
  if(error)throw new IrisWriteError(503);
  if(!character||character.owner!==account.nickname)throw new IrisWriteError(403);
  const catalog=await db.from('nexus_classes').select('id,name,is_active').eq('is_active',true);
  if(catalog.error||!Array.isArray(catalog.data))throw new IrisWriteError(503);
  const matches=catalog.data.filter(c=>String(c.id)===edit.classId);
  if(matches.length!==1)throw new IrisWriteError(400);
  const name=matches[0].name;
  if(typeof name!=='string'||!name.trim()||catalog.data.filter(c=>c.name===name).length!==1)throw new IrisWriteError(503);
  const change=mergeClassLevel(character.levels,name,edit.baseLevel,edit.desiredLevel);
  if(change.changed){
    let q=db.from('characters').update({levels:change.levels}).eq('id',character.id).eq('owner',account.nickname);
    q=character.levels===null?q.is('levels',null):q.eq('levels',JSON.stringify(character.levels));
    const {data:updated,error:writeError}=await q.select('id');
    if(writeError)throw new IrisWriteError(503);
    if(updated?.length!==1)throw new IrisWriteError(409);
  }
  return {requestId:edit.requestId,status:'saved',level:edit.desiredLevel};
}
