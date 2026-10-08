import type {SupabaseClient} from '@supabase/supabase-js';
import {statKeys,score,validateStatsEdit,type SavedStats} from '@/lib/irisStats';
import {IrisWriteError} from '@/lib/irisKronosWrite';
export async function saveIrisStats(db:SupabaseClient,account:{id:string;nickname:string},value:unknown,now=Date.now()){
  const edit=validateStatsEdit(value,now);if(edit.accountId!==String(account.id))throw new IrisWriteError(403);
  const {data:row,error}=await db.from('characters').select('id,nickname,owner,combat_power,life_energy,magic_resistance,charm').eq('id',edit.characterId).maybeSingle();
  if(error)throw new IrisWriteError(503);
  if(!row||!(row.owner===account.nickname||(!row.owner&&row.nickname===account.nickname)))throw new IrisWriteError(403);
  const current={} as SavedStats,patch:Partial<SavedStats>={};
  for(const key of statKeys){if(row[key]!==null&&typeof row[key]!=='string')throw new IrisWriteError(503);current[key]=row[key];const desired=edit.stats[key];if(desired!==null&&score(row[key])!==desired)patch[key]=String(desired);}
  // An acknowledged/no-op retry causes no write, even if its baseline is old.
  if(Object.keys(patch).length){
    if(statKeys.some(k=>current[k]!==edit.base[k]))throw new IrisWriteError(409);
    let q=db.from('characters').update(patch).eq('id',row.id).eq('nickname',row.nickname);
    q=row.owner===null?q.is('owner',null):q.eq('owner',row.owner);
    for(const key of statKeys)q=current[key]===null?q.is(key,null):q.eq(key,current[key]);
    const updated=await q.select('id');if(updated.error)throw new IrisWriteError(503);if(updated.data?.length!==1)throw new IrisWriteError(409);
    Object.assign(current,patch);
  }
  return {status:'saved' as const,accountId:edit.accountId,characterId:edit.characterId,stats:current,changed:Object.keys(patch).length>0};
}
