// Real HTTP and production API handlers; only session/DB IO is synthetic.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {loadTS} from './load-ts.mjs';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
const names=['가나다라마바사아자차카타','아이리스전용','기록없는계정'];
function literal(name){
 const source=ts.createSourceFile('fixture.mjs',readFileSync('tests/account-online.browser.mjs','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 for(const statement of source.statements)if(ts.isVariableStatement(statement))for(const d of statement.declarationList.declarations)if(d.name.getText(source)===name&&ts.isTaggedTemplateExpression(d.initializer))return d.initializer.template.rawText??d.initializer.template.text;
 throw Error('Shared fixture literal missing');
}
export async function startOnlineHttpFixture(options={}){
 const saved={online:process.env.SANCTUM_ACCOUNT_ONLINE_ENABLED,activity:process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED};
 process.env.SANCTUM_ACCOUNT_ONLINE_ENABLED='true';process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED='true';
 let now=Date.parse('2026-10-28T12:00:00.000Z');const lastActive=ids.map((_,i)=>new Date(now-(i===0?180000:7200000)).toISOString());
 const sessions=new Map([['fixture-a',0],['fixture-b',1],['fixture-b2',1]].map(([token,index])=>[token,{token,index,active:true}]));
 const hashed=new Map([...sessions.values()].map(s=>[createHash('sha256').update(s.token).digest('hex'),s]));
 const leases=new Map(),metrics={http:0,rpc:0,touch:0,leave:0,read:0,activityPost:0,denied:0};
 const actor=s=>s?.active?{id:ids[s.index],nickname:names[s.index],role:'길드원',status:'승인'}:null;
 const db={rpc:async(name,args)=>{
  metrics.rpc++;const session=hashed.get(args.input_token_hash),owner=actor(session);
  if(!owner)return {data:{status:'unauthorized'},error:null};
  if(name==='sanctum_online_touch'){
   if(args.input_expected_account_id&&args.input_expected_account_id!==owner.id)return {data:{status:'conflict'},error:null};
   const key=args.input_token_hash+':'+args.input_environment+':'+args.input_connection_id,old=leases.get(key);
   if(args.input_action==='leave')metrics.leave++;else metrics.touch++;
   let row=old,status;
   if(old?.closed)status='closed';
   else if(old&&old.sequence>=args.input_sequence)status='stale';
   else{row={session,accountId:owner.id,sequence:args.input_sequence,closed:args.input_action==='leave',expiresAt:now+720000};leases.set(key,row);status=row.closed?'closed':'recorded';}
   return {data:{status,accountId:owner.id,sequence:args.input_sequence,expiresAt:row.closed?null:new Date(row.expiresAt).toISOString()},error:null};
  }
  if(name==='sanctum_online_snapshot'){
   const online=new Map();for(const row of leases.values())if(row.session.active&&!row.closed&&row.expiresAt>now)online.set(row.accountId,Math.max(online.get(row.accountId)??0,row.expiresAt));
   return {data:{enabled:true,viewerId:owner.id,observedAt:new Date(now).toISOString(),accounts:[...online].map(([accountId,expiry])=>({accountId,expiresAt:new Date(expiry).toISOString()}))},error:null};
  }
  throw Error('Unexpected synthetic RPC');
 },from:table=>{const q={select:()=>q,eq:()=>q,in:()=>q,then:done=>Promise.resolve({data:table==='accounts'?ids.map((id,i)=>({id,nickname:names[i],role:'길드원'})):ids.map((account_id,i)=>({account_id,last_active_at:i===2?null:lastActive[i]})),error:null}).then(done)};return q;}};
 const serverSession={SANCTUM_SESSION_COOKIE:'sanctum_session',hashSessionToken:t=>createHash('sha256').update(t).digest('hex'),getServerSupabase:()=>db,getSessionAccount:async token=>actor(sessions.get(token)),isPendingAccount:a=>a.status!=='승인'};
 const server=loadTS('lib/server/accountOnline.ts',{'server-only':{},'@/lib/server/sanctumSession':serverSession});
 const next={'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{...init,headers:{'Content-Type':'application/json',...init.headers}})}}};
 const routes=loadTS('app/api/account/online/route.ts',{...next,'@/lib/server/accountOnline':server,'@/lib/server/sanctumSession':serverSession});
 const directory=loadTS('app/api/accounts/directory/route.ts',{...next,'@/lib/server/sanctumSession':serverSession,'@/lib/server/accountActivity':{accountActivityEnabled:()=>true}});
 const entry='const __nativeFetch=window.fetch.bind(window);'+literal('entry')+'\nwindow.fetch=__nativeFetch;';
 const replacement={'../../../lib/supabase':literal('fakeDb'),'../../../lib/matchingUtils':"exports.isTaskChecked=()=>false;",'next/navigation':"exports.useRouter=()=>({push(){}});",'@/components/common/ClassIcon':"module.exports=()=>require('react').createElement('span',null,'직업');"};
 const fixture=await startIrisFixture(options.entry??entry,{...replacement,...options.replacements},options),fallback=fixture.server.listeners('request')[0];fixture.server.removeAllListeners('request');
 fixture.server.on('request',async(req,res)=>{
  if(!req.url?.startsWith('/api/')){
   // Original no-network component fixture forbids fetch. This separate HTTP
   // fixture permits its own loopback origin only; browser routes deny others.
   const writeHead=res.writeHead.bind(res);
   res.writeHead=(status,headers)=>{const safe={...headers};if(safe['Content-Security-Policy'])safe['Content-Security-Policy']=safe['Content-Security-Policy'].replace("connect-src 'none'","connect-src 'self'");return writeHead(status,safe);};
   fallback(req,res);return;
  }
  metrics.http++;
  try{
   let bytes=Buffer.alloc(0);for await(const chunk of req){bytes=Buffer.concat([bytes,chunk]);if(bytes.length>2048)break;}
   const request=new Request(fixture.origin+req.url,{method:req.method,headers:req.headers,...(req.method==='GET'?{}:{body:bytes})});
   const cookies=Object.fromEntries((req.headers.cookie??'').split(';').map(s=>s.trim().split('=')));
   request.cookies={get:name=>cookies[name]?{value:cookies[name]}:undefined};
   let response;
   if(req.url==='/api/account/online'){
    if(req.method==='POST')response=await routes.POST(request);else{metrics.read++;response=await routes.GET(request);}
   }else if(req.url==='/api/accounts/directory')response=await directory.GET(request);
   else{metrics.activityPost++;response=new Response('{}',{status:403});}
   if(response.status===401||response.status===409)metrics.denied++;
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500);res.end('{}');}
 });
 return {...fixture,metrics,ids,names,connections:()=>[...leases.values()].map(r=>({accountId:r.accountId,sequence:r.sequence,closed:r.closed,expiresAt:r.expiresAt})),advance:ms=>{now+=ms;},revoke:token=>{const s=sessions.get(token);if(s)s.active=false;},activeIds:()=>new Set([...leases.values()].filter(r=>r.session.active&&!r.closed&&r.expiresAt>now).map(r=>r.accountId)),close:async()=>{
  await new Promise(resolve=>fixture.server.close(resolve));
  for(const [k,key] of [['online','SANCTUM_ACCOUNT_ONLINE_ENABLED'],['activity','SANCTUM_ACCOUNT_ACTIVITY_ENABLED']]){if(saved[k]===undefined)delete process.env[key];else process.env[key]=saved[k];}
 }};
}
