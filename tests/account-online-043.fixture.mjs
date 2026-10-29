// Full, unchanged DesktopPage/controller/transport over synthetic auth and lease model.
// Actual production online API handler is reused. Port 3000 is exclusively owned.
import {startOnlineHttpFixture} from './account-online.http.fixture.mjs';
import {prepareSources} from './iris-online-043-source.mjs';
import {randomUUID} from 'node:crypto';
export const fullEntry=`const React=require('react'),{createRoot}=require('react-dom/client'),Page=require('@/app/iris/desktop/page').default;
window.fixtureRelease=require('@/lib/irisRelease').IRIS_BETA_VERSION;
window.fixtureErrors=[];window.addEventListener('error',e=>fixtureErrors.push(String(e.error||e.message)));window.addEventListener('unhandledrejection',e=>fixtureErrors.push(String(e.reason)));
createRoot(document.getElementById('app')).render(React.createElement(Page));`;
const syntheticIO={
 '@/lib/supabase':`const q=new Proxy(function(){},{get:(_,k)=>k==='then'?(resolve)=>Promise.resolve({data:[],error:null}).then(resolve):()=>q,apply:()=>q});exports.supabase={from:()=>q,channel:()=>q,removeChannel:async()=>{}};`,
 'next/navigation':`exports.useRouter=()=>({push(){},refresh(){},replace(){}});exports.usePathname=()=>'/iris/desktop';exports.useSearchParams=()=>new URLSearchParams();`,
 'next/link':`module.exports=props=>require('react').createElement('a',props);`,
};
export async function start043Fixture(){
 const owner=randomUUID(),snapshot=prepareSources(owner);
 const base=await startOnlineHttpFixture({port:3000,host:'localhost',entry:fullEntry,replacements:syntheticIO,sourceOverrides:snapshot.overrides});
 base.tokens=['fixture-a','fixture-b'];base.state=()=>({owner,database:'synthetic-lease-model',accounts:[...base.activeIds()].map(accountId=>({accountId})),metrics:base.metrics});
 try{
 const account=i=>({id:base.ids[i],nickname:i===0?'합성A':'합성B',role:'길드원'}),events=[];let delay=0,isOffline=false,onlineDelay=0,delayedOnline=0;
 const fallback=base.server.listeners('request')[0];base.server.removeAllListeners('request');
 base.server.on('request',async(req,res)=>{
  const path=req.url?.split('?')[0],origin=req.headers.origin;
  if(req.headers.host!=='localhost:3000'||origin&&origin!==base.origin){res.writeHead(403);res.end();return;}
  if(path==='/__astra_validation'||path?.startsWith('/__fixture/')){
   if(req.headers['x-astra-validation-owner']!==owner){res.writeHead(403);res.end();return;}
   if(path==='/__astra_validation'){res.end(owner);return;}
   if(path==='/__fixture/state'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({...base.state(),delayedOnline}));return;}
   if(path==='/__fixture/advance'){base.advance(721000);res.end('ok');return;}
   if(path==='/__fixture/offline'){isOffline=req.method==='POST';res.end('ok');return;}
   if(path==='/__fixture/delay'){delay=700;res.end('ok');return;}
   if(path==='/__fixture/delay-online'){onlineDelay=2000;res.end('ok');return;}
   res.writeHead(404);res.end();return;
  }
  if(path?.startsWith('/api/auth/')||path==='/api/iris/characters'||path==='/api/iris/kronos'){
   const cookie=(req.headers.cookie??'').split(';').map(x=>x.trim().split('=')),token=cookie.find(([k])=>k==='sanctum_session')?.[1];let index=base.tokens.indexOf(token);
   let body={};try{if(req.method==='POST'){let text='';for await(const b of req){text+=b;if(text.length>2048)throw Error();}body=JSON.parse(text);}}catch{res.writeHead(400);res.end();return;}
   events.push({path,method:req.method,accountId:base.ids[index]??null});
   const reply=(value,status=200,headers={})=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...headers});res.end(JSON.stringify(value));};
   if(path==='/api/auth/login'||path==='/api/auth/switch'){
    index=path.endsWith('login')?['합성A','합성B'].indexOf(body.nickname):base.ids.indexOf(body.accountId);
    if(index<0||path.endsWith('login')&&body.code!=='synthetic-only'){reply({},401);return;}
    reply({account:account(index)},200,{'Set-Cookie':`sanctum_session=${base.tokens[index]}; HttpOnly; SameSite=Strict; Path=/${body.keepLoggedIn||path.endsWith('switch')?'; Max-Age=86400':''}`});return;
   }
   if(path==='/api/auth/logout'){reply({},200,{'Set-Cookie':'sanctum_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});return;}
   if(path==='/api/auth/session'){reply({account:index<0?null:account(index)});return;}
   if(index<0){reply({},401);return;}
   if(req.method!=='GET'){reply({},403);return;}
   if(path==='/api/iris/characters'){reply({accountId:base.ids[index],characters:[{id:String(index+1),nickname:account(index).nickname+'캐릭터',job:'전사',alias:null,isMain:true,editable:false}]});return;}
   if(path==='/api/iris/kronos'){
    if(delay){const ms=delay;delay=0;await new Promise(d=>setTimeout(d,ms));}
    const at=new Date().toISOString(),categories=['daily','weekly','abyss','raid'];reply({accountId:base.ids[index],characterId:String(index+1),observedAt:at,writeContext:{periodKeys:Object.fromEntries(categories.map(k=>[k,at])),classes:[]},details:{schemaVersion:1,tasks:Object.fromEntries(categories.map(k=>[k,[]])),classes:[],workspace:[]}});return;
   }
   reply({},404);return;
  }
  if(isOffline&&path==='/api/account/online'){res.writeHead(503);res.end('{}');return;}
  if(onlineDelay&&path==='/api/account/online'&&req.method==='POST'){const ms=onlineDelay;onlineDelay=0;delayedOnline++;await new Promise(d=>setTimeout(d,ms));delayedOnline--;}
  fallback(req,res);
 });
 return {...base,owner,snapshot,events,realPg:false};
 }catch(error){await base.close();throw error;}
}
