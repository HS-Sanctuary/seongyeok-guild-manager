import {createHash} from 'node:crypto';
import type {SupabaseClient} from '@supabase/supabase-js';
import {buildWorkspaceDetails,validateWorkspaceEdit,WorkspaceError,type WorkspaceEdit} from '@/lib/irisWorkspace';
const digest=(v:string)=>createHash('sha256').update(v).digest('hex');
const columns='account_id,character_name,kind,item_id,period_start,count,bookmarked';
export async function readIrisWorkspace(db:SupabaseClient,accountId:string,nickname:string,now=new Date()){
  const [shops,missions,progress]=await Promise.all([
    db.from('kronos_shop_items').select('id,map,npc,reward,reward_cnt,cost_cnt,limit,reset_type,scope,is_active',{count:'exact'}).eq('is_active',true).limit(501),
    db.from('kronos_missions').select('id,town,title,description,max_count,rewards,is_active',{count:'exact'}).eq('is_active',true).limit(501),
    db.from('kronos_progress').select(columns,{count:'exact'}).eq('account_id',accountId).in('target_key',['',nickname]).limit(1001),
  ]);
  if(shops.error||missions.error||progress.error||!Array.isArray(shops.data)||!Array.isArray(missions.data)||!Array.isArray(progress.data)||(shops.count??0)>500||(missions.count??0)>500||(progress.count??0)>1000)throw new WorkspaceError(503);
  return buildWorkspaceDetails(shops.data,missions.data,progress.data,nickname,now,digest);
}
export async function saveIrisWorkspaceEdit(db:SupabaseClient,account:{id:string;nickname:string},input:unknown,now:Date|(()=>Date)=()=>new Date()){
  const edit=validateWorkspaceEdit(input),clock=()=>typeof now==='function'?now():now;
  if(edit.accountId!==account.id)throw new WorkspaceError(403);
  const owned=await db.from('characters').select('id,nickname,owner').eq('id',edit.characterId).eq('owner',account.nickname).maybeSingle();
  if(owned.error)throw new WorkspaceError(503);if(!owned.data)throw new WorkspaceError(403);
  const nickname=owned.data.nickname as string;
  const row=(await readIrisWorkspace(db,account.id,nickname,clock())).find(r=>r.itemKind===edit.itemKind&&r.id===edit.itemId);
  if(!row||row.scope!==edit.scope||row.key.catalogKey!==edit.catalogKey||row.key.periodKey!==edit.periodKey)throw new WorkspaceError(409);
  if(edit.field==='count'&&edit.desiredCompleted>row.total)throw new WorkspaceError(400);
  const result=(status:'saved'|'unknown')=>({requestId:edit.requestId,status,completed:edit.desiredCompleted});
  const current=edit.field==='bookmark'?Number(row.bookmarked):row.completed;
  if(current===edit.desiredCompleted)return result('saved');
  if(current!==edit.baseCompleted)throw new WorkspaceError(409);
  const target=(q:ReturnType<SupabaseClient['from']>,e:WorkspaceEdit)=>q.select(columns).eq('account_id',account.id).eq('kind',e.itemKind).eq('item_id',Number(e.itemId));
  // The generated target_key is read-only. Bind the nullable character column explicitly.
  const query=target(db.from('kronos_progress'),edit);
  const old=await (edit.scope==='account'?query.is('character_name',null):query.eq('character_name',nickname)).maybeSingle();
  if(old.error)throw new WorkspaceError(503);
  const baseline=old.data;
  const rawCount=baseline&&Date.parse(baseline.period_start)===Date.parse(edit.periodKey)?baseline.count:0;
  if((edit.field==='count'?rawCount:Number(baseline?.bookmarked??false))!==edit.baseCompleted)throw new WorkspaceError(409);
  // Recheck the period immediately before IO; stale intent must not be moved into a new week.
  const fresh=(await readIrisWorkspace(db,account.id,nickname,clock())).find(r=>r.itemKind===edit.itemKind&&r.id===edit.itemId);
  if(!fresh||fresh.key.periodKey!==edit.periodKey||fresh.key.catalogKey!==edit.catalogKey)throw new WorkspaceError(409);
  try{
    let response;
    if(baseline){
      const patch=edit.field==='count'?{count:edit.desiredCompleted,period_start:edit.periodKey}:{bookmarked:edit.desiredCompleted===1};
      let update=db.from('kronos_progress').update(patch).eq('account_id',account.id).eq('kind',edit.itemKind).eq('item_id',Number(edit.itemId));
      update=edit.scope==='account'?update.is('character_name',null):update.eq('character_name',nickname);
      // Count and bookmark CAS do not overwrite each other. Period is compared only for count.
      update=edit.field==='count'?update.eq('count',baseline.count).eq('period_start',baseline.period_start):update.eq('bookmarked',baseline.bookmarked);
      response=await update.select(columns);
    }else{
      response=await db.from('kronos_progress').insert({account_id:account.id,character_name:edit.scope==='account'?null:nickname,kind:edit.itemKind,item_id:Number(edit.itemId),period_start:edit.periodKey,count:edit.field==='count'?edit.desiredCompleted:0,bookmarked:edit.field==='bookmark'&&edit.desiredCompleted===1}).select(columns);
    }
    if(response.error||response.data?.length!==1)return result('unknown');
    const check=(await readIrisWorkspace(db,account.id,nickname,clock())).find(r=>r.itemKind===edit.itemKind&&r.id===edit.itemId);
    if(!check||check.key.catalogKey!==edit.catalogKey||check.key.periodKey!==edit.periodKey||(edit.field==='count'?check.completed:Number(check.bookmarked))!==edit.desiredCompleted)return result('unknown');
    return result('saved');
  }catch{return result('unknown');}
}
