// Offline route/reporter execution. No .env, real Supabase client or network.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {loadTS} from './load-ts.mjs';

export async function measureOnlineScenario({members=40,devices=2,hours=8,viewers=4}={}){
 if(![members,devices,hours,viewers].every(Number.isInteger)||members<1||members>40||devices<1||devices>2||hours<1||hours>24||viewers<1||viewers>members)throw Error('Invalid synthetic scenario');
 const saved=Object.fromEntries(['SANCTUM_ACCOUNT_ONLINE_ENABLED','SANCTUM_ACCOUNT_ACTIVITY_ENABLED'].map(k=>[k,process.env[k]]));
 process.env.SANCTUM_ACCOUNT_ONLINE_ENABLED='true';process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED='true';
 const hash=token=>createHash('sha256').update(token).digest('hex');
 let clock=Date.parse('2026-10-28T00:00:00.000Z');
 const sessions=Array.from({length:members*devices},(_,i)=>{
  const id=(i%members+1).toString(16).padStart(8,'0')+'-1111-4111-8111-111111111111';
  return {id,nickname:'합성'+(i%members+1),role:'길드원',status:'승인',token:'synthetic-validation-session-'+i};
 });
 const owners=new Map(sessions.map(s=>[hash(s.token),s]));
 const counts={onlineTouch:0,onlineRead:0,activityPost:0,directoryRead:0,rpcCalls:0};let failed=0,leaveRequests=0;
 const db={rpc:async(name,args)=>{
  counts.rpcCalls++;const owner=owners.get(args.input_token_hash);
  if(!owner)return {data:{status:'unauthorized'},error:null};
  if(name==='sanctum_online_touch')return {data:{status:args.input_action==='leave'?'closed':'recorded',accountId:owner.id,sequence:args.input_sequence,expiresAt:args.input_action==='leave'?null:new Date(clock+720000).toISOString()},error:null};
  if(name==='sanctum_online_snapshot')return {data:{enabled:true,viewerId:owner.id,observedAt:new Date(clock).toISOString(),accounts:[]},error:null};
  if(name==='sanctum_touch_account_activity')return {data:{status:'recorded',accountId:owner.id,lastActiveAt:new Date(clock).toISOString()},error:null};
  throw Error('Unexpected RPC');
 },from:table=>{
  const q={select:()=>q,eq:()=>q,in:()=>q,then:done=>Promise.resolve({data:table==='accounts'?sessions.slice(0,members):sessions.slice(0,members).map(s=>({account_id:s.id,last_active_at:new Date(clock).toISOString()})),error:null}).then(done)};
  return q;
 }};
 const serverSession={SANCTUM_SESSION_COOKIE:'synthetic_session',hashSessionToken:hash,getServerSupabase:()=>db,getSessionAccount:async token=>owners.get(hash(token??''))??null,isPendingAccount:a=>a.status!=='승인'};
 const onlineServer=loadTS('lib/server/accountOnline.ts',{'server-only':{},'@/lib/server/sanctumSession':serverSession});
 const activityServer=loadTS('lib/server/accountActivity.ts',{'server-only':{},'@/lib/server/sanctumSession':serverSession});
 const next={'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{...init,headers:{'Content-Type':'application/json',...init.headers}})}}};
 const replacement={...next,'@/lib/server/sanctumSession':serverSession,'@/lib/server/accountOnline':onlineServer,'@/lib/server/accountActivity':activityServer};
 const online=loadTS('app/api/account/online/route.ts',replacement),activity=loadTS('app/api/account/activity/route.ts',replacement),directory=loadTS('app/api/accounts/directory/route.ts',replacement);
 const request=(session,path,body)=>{
  const req=new Request('https://synthetic.invalid'+path,{method:body===undefined?'GET':'POST',headers:{origin:'https://synthetic.invalid','content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  req.cookies={get:()=>({value:session.token})};return req;
 };
 const {createOnlineReporter}=loadTS('lib/accountOnline.ts'),{createAccountActivityReporter}=loadTS('lib/accountActivity.ts');
 const jobs=[];
 const connections=sessions.map((session,i)=>{
  const onlineReporter=createOnlineReporter(async(command)=>{
   if(command.action==='touch')counts.onlineTouch++;else leaveRequests++;
   const pending=online.POST(request(session,'/api/account/online',command));jobs.push(pending);
   const response=await pending;if(!response.ok){failed++;throw Error('Synthetic online handler failed');}
   const data=await response.json();assert.equal(data.accountId,session.id);return {enabled:data.enabled};
  },()=>clock,()=>i.toString(16).padStart(8,'0')+'-2222-4222-8222-222222222222');
  const activityReporter=createAccountActivityReporter(async(expectedAccountId)=>{
   counts.activityPost++;const response=await activity.POST(request(session,'/api/account/activity',{expectedAccountId}));
   if(!response.ok){failed++;throw Error('Synthetic activity handler failed');}
   return response.json();
  },()=>clock);
  onlineReporter.setAccount(session.id);activityReporter.setAccount(session.id);return {onlineReporter,activityReporter};
 });
 const started=performance.now();
 try{
  for(let minute=0;minute<hours*60;minute++){
   clock=Date.parse('2026-10-28T00:00:00.000Z')+minute*60000;
   for(const c of connections)await c.onlineReporter.tick();
   for(let i=0;i<viewers;i++){
    counts.onlineRead++;const response=await online.GET(request(sessions[i],'/api/account/online'));
    if(!response.ok)failed++;await response.json();
   }
   // Synthetic trusted foreground input every20min, never background activity.
   if(minute%20===0){
    for(const c of connections)await c.activityReporter.report();
    for(let i=0;i<viewers;i++){
     counts.directoryRead++;const response=await directory.GET(request(sessions[i],'/api/accounts/directory'));if(!response.ok)failed++;await response.json();
    }
   }
  }
  const steady={...counts},steadyApi=steady.onlineTouch+steady.onlineRead+steady.activityPost+steady.directoryRead;
  for(const c of connections)c.onlineReporter.stop();
  await Promise.all(jobs);
  return {scenario:{members,devices,hours,viewers},steady,leaveRequests,rpcAfterShutdown:counts.rpcCalls,failedRequests:failed,monthlyApiSteady:steadyApi*30,monthlyRpcAdapterCalls:steady.rpcCalls*30,realDatabaseCalls:0,measuredWallMs:Math.round(performance.now()-started),limits:'Virtual day through real handlers/reporters + synthetic RPC/auth. Not HTTP/PG/Vercel CPU measurement; directory auth internals not measured.'};
 }finally{for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const results=[];
 for(const devices of [1,2])for(const hours of [8,24])results.push(await measureOnlineScenario({devices,hours}));
 mkdirSync('.superpowers/astra-online-validation',{recursive:true});
 writeFileSync('.superpowers/astra-online-validation/metrics.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
}
