// Native validation server: fixed loopback origin + owned network:none PG.
// No .env, Supabase URL/key, operational login or arbitrary SQL endpoint.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {loadTS} from './load-ts.mjs';
import {startIrisFixture} from './iris-ui.fixture.mjs';
import {createPgFixture,bootstrapPg} from './account-online.pg.mjs';
export async function startPgOnlineFixture(){
 const pg=await createPgFixture();try{bootstrapPg(pg);}catch(error){pg.stop();throw error;}
 const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
 const tokens=['fixture-a','fixture-b'],hash=t=>createHash('sha256').update(t).digest('hex');
 const quote=s=>s===null?'null':"'"+String(s).replaceAll("'","''")+"'";
 for(let i=0;i<2;i++)pg.sql(`insert into public.sanctum_sessions values('${hash(tokens[i])}','${ids[i]}',clock_timestamp()+interval '1 day');`);
 pg.sql('delete from public.sanctum_online_connections;');
 const metrics={http:0,rpc:0,irisTouch:0,webTouch:0,leave:0,activity:0,external:0},observed=[];
 let offline=false;
 function row(sql){return JSON.parse(pg.sql(sql));}
 const actor=async token=>row(`select coalesce((select row_to_json(a) from public.sanctum_sessions s join public.accounts a on a.id=s.account_id where s.token_hash='${hash(token??'')}' and s.expires_at>clock_timestamp()),'null'::json);`);
 const db={rpc:async(name,a)=>{
  metrics.rpc++;let expression;
  if(name==='sanctum_online_touch'){
   if(a.input_action==='leave')metrics.leave++;else if(a.input_kind==='iris')metrics.irisTouch++;else metrics.webTouch++;
   expression=`public.sanctum_online_touch(${[a.input_token_hash,a.input_expected_account_id,a.input_connection_id,a.input_sequence,a.input_kind,a.input_action,a.input_environment].map(quote).join(',')})`;
  }else if(name==='sanctum_online_snapshot')expression=`public.sanctum_online_snapshot(${quote(a.input_token_hash)},${quote(a.input_environment)})`;
  else if(name==='sanctum_touch_account_activity'){metrics.activity++;expression=`public.sanctum_touch_account_activity(${quote(a.input_token_hash)},${quote(a.input_expected_account_id)})`;}
  else throw Error('unexpected fixture RPC');
  try{return {data:row('set role service_role;select '+expression+';'),error:null};}catch{return {data:null,error:{message:'owned fixture DB error'}};}
 }};
 const session={SANCTUM_SESSION_COOKIE:'sanctum_session',hashSessionToken:hash,getServerSupabase:()=>db,getSessionAccount:actor,isPendingAccount:a=>a.status!=='승인'};
 const saved={online:process.env.SANCTUM_ACCOUNT_ONLINE_ENABLED,activity:process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED};
 process.env.SANCTUM_ACCOUNT_ONLINE_ENABLED='true';process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED='true';
 const online=loadTS('lib/server/accountOnline.ts',{'server-only':{},'@/lib/server/sanctumSession':session});
 const activity=loadTS('lib/server/accountActivity.ts',{'server-only':{},'@/lib/server/sanctumSession':session});
 const next={'next/server':{NextResponse:{json:(body,init={})=>new Response(JSON.stringify(body),{...init,headers:{'Content-Type':'application/json',...init.headers}})}}};
 const routes=loadTS('app/api/account/online/route.ts',{...next,'@/lib/server/accountOnline':online,'@/lib/server/sanctumSession':session});
 const activityRoute=loadTS('app/api/account/activity/route.ts',{...next,'@/lib/server/accountActivity':activity,'@/lib/server/sanctumSession':session});
 const baseline='ca697706a874d21668091588940ceb61338d0700',sourceOverrides={};
 for(const path of ['components/iris/DesktopFloatingHub.tsx','components/iris/DesktopIcons.tsx','lib/irisFloating.ts'])sourceOverrides[resolve(path)]=execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'});
 const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopFloatingHub}=require('@/components/iris/DesktopFloatingHub');let sequence=0;const waiting=new Map();window.fixtureMessages=[];function request(method,payload=null){return new Promise((done,reject)=>{const b=window.__irisDesktopBridge;if(!b)return reject(Error('bridge not ready'));const id=String(++sequence);waiting.set(id,{done,reject});chrome.webview.postMessage({version:1,id,epoch:b.epoch,method,payload});setTimeout(()=>{if(waiting.has(id)){waiting.delete(id);reject(Error('fixture bridge deadline'));}},5000);});}window.fixtureRequest=request;function App(){const [state,setState]=React.useState(null);React.useEffect(()=>{if(!window.chrome?.webview)return;const ready=()=>request('window.floating.state').then(setState);const event=e=>setState(e.detail.state);const message=e=>{const d=e.data,w=waiting.get(d?.id);window.fixtureMessages.push(d);if(w){waiting.delete(d.id);if(d.ok)w.done(d.value);else w.reject(Error(d.error));}};chrome.webview.addEventListener('message',message);window.addEventListener('iris-desktop-ready',ready);window.addEventListener('iris-floating-state',event);if(window.__irisDesktopBridge)ready();return()=>{chrome.webview.removeEventListener('message',message);window.removeEventListener('iris-desktop-ready',ready);window.removeEventListener('iris-floating-state',event);};},[]);const command=c=>request('window.floating.command',{command:c}).then(setState);return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopFloatingHub,{state,onCommand:command,onDrag:()=>{},onExit:()=>request('window.close')},React.createElement('h1',null,'ASTRA 격리 검증'),React.createElement('p',null,'실제 작업대 전체가 아닌 native 온라인 수명·플로팅 검증 화면입니다.'),React.createElement('button',{onClick:()=>command('floating')},'플로팅으로 전환')));}createRoot(document.getElementById('app')).render(React.createElement(App));`;
 let fixture;
 try{fixture=await startIrisFixture(entry,{}, {port:3000,host:'localhost',sourceOverrides});}catch(e){pg.stop();throw e;}
 const fallback=fixture.server.listeners('request')[0];fixture.server.removeAllListeners('request');
 function state(){const snapshot=row(`set role service_role;select public.sanctum_online_snapshot('${hash(tokens[0])}','local');`);return {owner:pg.owner,database:'owned-network-none-postgresql17',accounts:snapshot.accounts,metrics,observed};}
 fixture.server.on('request',async(req,res)=>{
  metrics.http++;const url=req.url?.split('?')[0],origin=req.headers.origin;
  const received=Date.now();res.on('finish',()=>observed.push({path:url,status:res.statusCode,ms:Date.now()-received}));
  if(req.headers.host!=='localhost:3000'||origin&&origin!==fixture.origin){metrics.external++;res.writeHead(403);res.end();return;}
  if(url==='/__astra_validation'||url==='/__fixture/state'){
   if(req.headers['x-astra-validation-owner']!==pg.owner){res.writeHead(403);res.end();return;}
   pg.verify();res.writeHead(200,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end(url==='/__astra_validation'?pg.owner:JSON.stringify(state()));return;
  }
  if(url==='/api/account/online'||url==='/api/account/activity'){
   if(offline){res.writeHead(503);res.end();return;}
   try{let body='';for await(const b of req){body+=b;if(body.length>2048)throw Error('too big');}
    const request=new Request(fixture.origin+url,{method:req.method,headers:req.headers,...(req.method==='GET'?{}:{body})});
    const cookie=(req.headers.cookie??'').split(';').map(p=>p.trim().split('='));request.cookies={get:name=>{const value=cookie.find(([k])=>k===name)?.[1];return value?{value}:undefined;}};
    if(req.method==='POST'&&url==='/api/account/online'){const b=JSON.parse(body);observed.push({kind:b.kind,action:b.action,at:Date.now()});}
    const response=url==='/api/account/activity'?await activityRoute.POST(request):req.method==='POST'?await routes.POST(request):await routes.GET(request);
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
   }catch{res.writeHead(500);res.end('fixture request failed');}return;
  }
  if(!['/iris/desktop','/fixture.js',encodeURI('/IRIS/logo/IRIS 로고 마크.svg')].includes(url)&&!url?.startsWith('/svgs/')){res.writeHead(404);res.end();return;}
  const original=res.writeHead.bind(res);res.writeHead=(status,headers)=>{const safe={...headers};if(safe['Content-Security-Policy'])safe['Content-Security-Policy']=safe['Content-Security-Policy'].replace("connect-src 'none'","connect-src 'self'");return original(status,safe);};fallback(req,res);
 });
 return {pg,origin:fixture.origin,tokens,ids,state,metrics,sourceOverrides,offline:v=>offline=v,async close(){await new Promise(done=>fixture.server.close(done));pg.stop();for(const [key,name]of [['online','SANCTUM_ACCOUNT_ONLINE_ENABLED'],['activity','SANCTUM_ACCOUNT_ACTIVITY_ENABLED']])if(saved[key]===undefined)delete process.env[name];else process.env[name]=saved[key];}};
}
