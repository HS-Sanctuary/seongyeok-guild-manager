import {createHash} from 'node:crypto';
import type {SupabaseClient} from '@supabase/supabase-js';
import {BarterError,barterPeriodStart,buildBarterDetails,planBarterEdit,validateBarterEdit,type BarterCharacter,type BarterResult} from '@/lib/irisBarter';
export const barterDigest=(value:string)=>createHash('sha256').update(value).digest('hex');
export async function readIrisBarter(db:SupabaseClient,owner:string,characterId:string,now=new Date()){
  const [chars,trades]=await Promise.all([db.from('characters').select('id,nickname,owner,trade_checks').eq('owner',owner).limit(101),db.from('nexus_trades').select('id,map,npc,reward,reward_cnt,cost,cost_cnt,limit,reset_type,scope').limit(501)]);
  if(chars.error||trades.error||!Array.isArray(chars.data)||!Array.isArray(trades.data))throw new BarterError(503);
  return buildBarterDetails(chars.data,trades.data,characterId,now,barterDigest);
}
export async function saveIrisBarterEdit(db:SupabaseClient,account:{id:string;nickname:string},input:unknown,now:Date|(()=>Date)=()=>new Date()):Promise<BarterResult>{
  const clock=()=>typeof now==='function'?now():now;
  const edit=validateBarterEdit(input);if(edit.accountId!==account.id)throw new BarterError(403);
  const [chars,trades]=await Promise.all([db.from('characters').select('id,nickname,owner,trade_checks').eq('owner',account.nickname).limit(101),db.from('nexus_trades').select('id,map,npc,reward,reward_cnt,cost,cost_cnt,limit,reset_type,scope').limit(501)]);
  if(chars.error||trades.error||!Array.isArray(chars.data)||!Array.isArray(trades.data))throw new BarterError(503);
  if(!chars.data.some(c=>String(c.id)===edit.characterId&&c.owner===account.nickname))throw new BarterError(403);
  // Validate every target and its original item digest before the first CAS.
  const plan=planBarterEdit(chars.data,trades.data,edit,clock(),barterDigest);let written=false;
  const result=(status:'saved'|'unknown'):BarterResult=>({requestId:edit.requestId,status,completed:plan.completed,completedBy:plan.completedBy,baseRecords:plan.baseRecords});
  for(const change of plan.changes){
    try{
      const reset=trades.data.find(t=>String(t.id)===edit.tradeId)!.reset_type;
      if(new Date(barterPeriodStart(reset,clock())).toISOString()!==edit.periodKey){if(written)return result('unknown');throw new BarterError(409);}
      let query=db.from('characters').update({trade_checks:change.nextRaw}).eq('id',change.characterId).eq('owner',account.nickname);
      query=change.baseRaw===null?query.is('trade_checks',null):query.eq('trade_checks',JSON.stringify(change.baseRaw));
      const {data,error}=await query.select('id');
      if(error)return result('unknown');
      if(!data?.length){if(written)return result('unknown');throw new BarterError(409);}
      written=true;
    }catch(error){if(error instanceof BarterError&&!written)throw error;return result('unknown');}
  }
  try{
    // MAX is insufficient: every current owned copy must contain this exact intent.
    const [readback,latestCatalog]=await Promise.all([db.from('characters').select('id,nickname,owner,trade_checks').eq('owner',account.nickname).limit(101),db.from('nexus_trades').select('id,map,npc,reward,reward_cnt,cost,cost_cnt,limit,reset_type,scope').limit(501)]);
    if(readback.error||latestCatalog.error||!Array.isArray(readback.data)||!Array.isArray(latestCatalog.data))return result('unknown');
    const verified=planBarterEdit(readback.data as BarterCharacter[],latestCatalog.data,edit,clock(),barterDigest);
    return result(verified.changes.length===0?'saved':'unknown');
  }catch{return result('unknown');}
}
