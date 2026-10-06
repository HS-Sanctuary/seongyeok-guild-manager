import type {SupabaseClient} from '@supabase/supabase-js';
import {computeIrisKronosEdit,validateIrisEdit,IrisWriteError,type IrisEditResult} from '@/lib/irisKronosWrite';
export async function saveIrisKronosEdit(db:SupabaseClient,account:{id:string;nickname:string},input:unknown,now=new Date()):Promise<IrisEditResult>{
  const edit=validateIrisEdit(input);
  if(edit.accountId!==String(account.id))throw new IrisWriteError(403);
  const {data:character,error}=await db.from('characters').select('id,owner,daily_checks,weekly_checks,raid_checks').eq('id',edit.characterId).eq('owner',account.nickname).maybeSingle();
  if(error)throw new IrisWriteError(503);
  if(!character || character.owner!==account.nickname)throw new IrisWriteError(403);
  const [tasks,contents]=await Promise.all([db.from('nexus_tasks').select('id,name,type,max_count,is_active').eq('is_active',true),db.from('nexus_contents').select('id,name,type,is_active').eq('is_active',true)]);
  if(tasks.error||contents.error||!tasks.data||!contents.data)throw new IrisWriteError(503);
  const change=computeIrisKronosEdit(character,{tasks:tasks.data,contents:contents.data},edit,now);
  if(change.changed){
    let q=db.from('characters').update({[change.field]:change.nextRaw}).eq('id',character.id).eq('owner',account.nickname);
    // These columns are JSONB, including legacy JSON string values. The filter
    // must encode that JSON string itself, not parse its contents as an array.
    q=change.baseRaw===null?q.is(change.field,null):q.eq(change.field,JSON.stringify(change.baseRaw));
    const {data:updated,error:writeError}=await q.select('id');
    if(writeError)throw new IrisWriteError(503);
    if(!updated?.length)throw new IrisWriteError(409);
  }
  return {requestId:edit.requestId,status:'saved',completed:change.completed};
}
