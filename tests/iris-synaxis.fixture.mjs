// Actual shared React surface + CSS, synthetic Supabase/HTTP only. No credentials.
import http from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const cssParts=[],modules=[],ids=new Map();
const io=`
const data=new Proxy({},{get:(_,key)=>window.fixture[key],set:(_,key,value)=>{window.fixture[key]=value;return true;}});
exports.supabase={from(table){let filters=[],single=false,allowEmpty=false;const q={select(){return q},order(){return q},neq(k,v){filters.push(r=>r[k]!==v);return q},eq(k,v){filters.push(r=>r[k]===v);return q},in(){return q},single(){single=true;return q},maybeSingle(){single=true;allowEmpty=true;return q},then(done){data.reads.push(table);const rows=(data.tables[table]||[]).filter(r=>filters.every(f=>f(r)));return Promise.resolve({data:JSON.parse(JSON.stringify(single?rows[0]??null:rows)),error:single&&!allowEmpty&&!rows.length?{code:'PGRST116',message:'단일 행이 없습니다.'}:null}).then(done)}};return q},channel(name){const c={name,on(type,filter,cb){c.callback=cb;return c},subscribe(cb){data.channels.push(c);queueMicrotask(()=>cb?.('SUBSCRIBED'));return c}};return c},removeChannel(c){data.channels=data.channels.filter(x=>x!==c);return Promise.resolve()}};`;
function visit(file,provided){
  if(ids.has(file))return ids.get(file);const id=modules.length;ids.set(file,id);modules.push(null);
  const raw=provided??readFileSync(file,'utf8');
  const code=['.ts','.tsx'].includes(extname(file))?ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true},fileName:file}).outputText:raw;
  const deps={};
  for(const m of code.matchAll(/\brequire\(['"]([^'"]+)['"]\)/g)){
    const name=m[1];if(name in deps)continue;
    if(name==='next/navigation'){deps[name]=visit(resolve('tests/__navigation.js'),`exports.useSearchParams=()=>new URLSearchParams();`);continue;}
    if(name==='@/lib/supabase'){deps[name]=visit(resolve('lib/supabase.ts'),io);continue;}
    if(name.endsWith('.css')){
      const path=resolve(dirname(file),name),rawCss=readFileSync(path,'utf8'),prefix='fixture_'+cssParts.length+'_';
      const keys=Object.fromEntries([...rawCss.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(x=>[x[1],name.endsWith('.module.css')?prefix+x[1]:x[1]]));
      cssParts.push(name.endsWith('.module.css')?rawCss.replace(/\.([a-zA-Z][\w-]*)/g,(_,key)=>'.'+keys[key]):rawCss);
      deps[name]=visit(path+'.js','module.exports='+JSON.stringify(keys));continue;
    }
    let target;if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(file),name);target=[base,base+'.ts',base+'.tsx'].find(existsSync);}else target=createRequire(file).resolve(name);
    assert.ok(target,'Unresolved '+name);deps[name]=visit(target);
  }
  modules[id]=`[function(require,module,exports){${code}\n},${JSON.stringify(deps)}]`;return id;
}
const entry=`
const React=require('react'),{createRoot}=require('react-dom/client');
const {DesktopSynaxisSurface}=require('../components/iris/DesktopSynaxisSurface.tsx');
const {DesktopCenter}=require('../components/iris/DesktopCenter.tsx');
const {DesktopStatsConfirmation}=require('../components/iris/DesktopStatsConfirmation.tsx');
const homework={accountId:'fixture-account',characterId:'1',writeContext:{periodKeys:{daily:'fixture-period',weekly:'fixture-period',abyss:'fixture-period',raid:'fixture-period'}},details:{tasks:{
daily:['일일 미션','요일 던전','심층 던전','일일 알바'].map((name,i)=>({id:'d'+i,name,completed:0,total:1})),
weekly:[{id:'w0',name:'검은 구멍',completed:0,total:13},{id:'w1',name:'소환의 결계',completed:0,total:7},{id:'w2',name:'뱅가드 브리치',completed:3,total:3},...['필드 보스','심던 매우 어려움','주간 정기 의뢰','멤버십 알바','국경 물자 보급'].map((name,i)=>({id:'w'+(i+3),name,completed:i===2?1:0,total:1}))],
abyss:['허상의 정박지','광기의 동굴','흩어진 물길','주말에는 어비스'].map((name,i)=>({id:'a'+i,name,completed:0,total:1})),
raid:['카브락','화이트 서큐버스','에이렐','주말에는 레이드'].map((name,i)=>({id:'r'+i,name,completed:i===0?1:0,total:1}))
},classes:[]}};
const h=React.createElement,today=new Date();today.setDate(today.getDate()+1);const date=today.toISOString().slice(0,10);
const chars=[{id:1,nickname:'내첫캐릭터',owner:'합성계정',job:'힐러',combat_power:120000,magic_resistance:8000,raid_checks:{카브락:true}},
 {id:2,nickname:'열두글자닉네임테스트용',owner:'합성계정',job:'검술사',combat_power:110000,magic_resistance:8000,raid_checks:{}},
 {id:3,nickname:'타인캐릭터',owner:'다른계정',job:'힐러',combat_power:130000,magic_resistance:8000,raid_checks:{}}];
const base={content_name:'레이드 - 카브락',difficulty:'어려움',party_date:date,time_start:'20:00',time_end:'23:59',max_members:8,status:'모집중',created_at:new Date().toISOString()};
const other={name:'타인캐릭터',job:'힐러',owner:'다른계정',account_id:'다른계정',combat_power:130000,magic_resistance:8000,time_start:'20:00',time_end:'23:59',roles:['힐러']};
const bus={...base,id:2,party_type:'길드버스',leader_name:'합성계정',memo:'합성 길드버스 공지',members:[{...other,name:'내첫캐릭터',owner:'합성계정',account_id:'합성계정'}]};
const reqs=[];['카브락','에이렐','화이트 서큐버스','허상의 정박지','광기의 동굴','흩어진 물길'].forEach((name,i)=>['입문','어려움','매우 어려움'].forEach((diff,j)=>reqs.push({id:10*i+j,content_name:name,content_type:i<3?'raid':'abyss',difficulty:diff,min_cp:50000,rec_cp:70000,op_cp:90000,rec_mr:1000,op_mr:2000,max_members:i===0?8:4})));
window.fixture={reads:[],writes:[],channels:[],tables:{characters:chars,parties:[{...base,id:1,party_type:'1회 클리어',leader_name:'타인캐릭터',members:[other]},bus],nexus_classes:[{id:1,name:'힐러',role:'힐러'},{id:2,name:'검술사',role:'근딜'}],nexus_contents:[{id:1,name:'카브락',code:'raid_cabrak',type:'raid',is_active:true,max_count:1},{id:2,name:'허상의 정박지',code:'abyss_1',type:'abyss',is_active:true,max_count:1}],content_power_reqs:reqs}};
if(new URLSearchParams(location.search).has('controls'))window.fixture.tables.parties=[{...base,id:1,content_name:'레이드 - 에이렐',max_members:4,time_end:'00:59',party_type:'1회 클리어',leader_name:chars[1].nickname,sub_content:'시간 조율 테스트',members:[{...other,name:chars[1].nickname,job:'검술사',owner:'합성계정',account_id:'fixture-account',combat_power:110000,time_end:'00:00'}, {...other,time_start:'18:00',time_end:'20:00'}]}];
window.fixture.emit=(type,row)=>{if(type==='INSERT')window.fixture.tables.parties.push(row);for(const c of window.fixture.channels)c.callback?.({eventType:type,new:row,old:row});};
window.fetch=async(url,init)=>{if(!init||init.method!=='POST')return new Response(JSON.stringify({accounts:[]}));const body=JSON.parse(init.body);window.fixture.writes.push({url,body});if(window.fixture.failNext){window.fixture.failNext=false;return new Response(JSON.stringify({message:'합성 권한 거부'}),{status:403});}const {payload}=body;if(body.action==='update'){const row=window.fixture.tables.parties.find(p=>p.id===body.filter.value);Object.assign(row,payload);}if(body.action==='delete')window.fixture.tables.parties=window.fixture.tables.parties.filter(p=>p.id!==body.filter.value);if(body.action==='insert'){const row={id:100+window.fixture.writes.length,...payload};window.fixture.emit('INSERT',row);}return new Response(JSON.stringify({data:[{id:100}],error:null}),{status:200});};
function App(){const [shown,setShown]=React.useState(true);window.fixture.setShown=setShown;const params=new URLSearchParams(location.search),[activity,setActivity]=React.useState({party:0,bus:0}),[busy,setBusy]=React.useState(false),[confirming,setConfirming]=React.useState(false),[statsBusy,setStatsBusy]=React.useState(false);window.fixture.setStatsBusy=setStatsBusy;window.fixture.confirmationActions??=[];window.fixture.homeworkEdits??=[];const account=React.useMemo(()=>({id:'fixture-account',nickname:'합성계정',role:params.get('member')?'길드원':'길드마스터'}),[]);return h('main',{className:'iris-desktop'},h('header',{style:{height:'2.25rem'}},'IRIS for SANCTUM'),h(DesktopCenter,{account,characters:chars.filter(c=>c.owner===account.nickname),selected:params.has('spacing')?homework:null,pending:[],locked:busy,saveStatus:null,onSelectCharacter(){},onEdit:(key,base,desired)=>window.fixture.homeworkEdits.push({key,base,desired}),statsPanel:active=>active&&params.has('nav')?h(React.Fragment,null,h('button',{className:'iris-desktop-button',onClick:()=>setConfirming(true)},'스탯 확인 열기'),confirming&&h(DesktopStatsConfirmation,{target:chars[1],characters:chars.filter(c=>c.owner===account.nickname),job:'힐러',busy:statsBusy,canConfirm:true,onConfirm:()=>window.fixture.confirmationActions.push('confirm'),onSelectCharacter:id=>{window.fixture.confirmationActions.push('select:'+id);setConfirming(false);},onCancel:()=>{window.fixture.confirmationActions.push('cancel');setConfirming(false);}})):null,synaxisUnread:activity.party+activity.bus>0,synaxisPanel:active=>h(DesktopSynaxisSurface,{account,active:active&&shown,locked:false,onBusyChange:setBusy,onActivityChange:setActivity})}));}
function BrandApp(){
 const {DesktopTitlebar}=require('../components/iris/DesktopTitlebar.tsx'),{DesktopContextActions}=require('../components/iris/DesktopContextActions.tsx');
 const [settings,setSettings]=React.useState(false),[accountOpen,setAccountOpen]=React.useState(false);
 const actions=h(DesktopContextActions,{accountOpen,settingsOpen:settings,onAccount:()=>{setSettings(false);setAccountOpen(v=>!v);},onSettings:()=>{setAccountOpen(false);setSettings(v=>!v);}});
 return h('main',{className:'iris-desktop'},h(DesktopTitlebar,{onDrag:()=>window.fixture.drag=true,onMinimize:()=>window.fixture.minimize=true,onClose:()=>window.fixture.close=true}),
 h(DesktopCenter,{account:{id:'a',nickname:'한설',role:'길드원'},characters:[{id:'1',nickname:'열두글자닉네임테스트용',job:'장궁병'}],selected:homework,pending:[],locked:false,saveStatus:null,onSelectCharacter(){},onEdit(){},contextActions:actions,settingsOpen:settings,settingsPanel:h('p',null,'설정 화면')}));
}
createRoot(document.getElementById('app')).render(h(new URLSearchParams(location.search).has('brand')?BrandApp:App));`;
const root=visit(resolve('tests/__synaxis-entry.js'),entry);
const script=`(function(){const process={env:{NODE_ENV:'production'}};const modules=[${modules.join(',')}],cache={};function run(id){if(cache[id])return cache[id].exports;const module=cache[id]={exports:{}};const [fn,deps]=modules[id];fn(name=>run(deps[name]),module,module.exports);return module.exports;}run(${root});})();`;
const tw=await postcss([tailwind({base:process.cwd()})]).process(readFileSync('app/globals.css','utf8'),{from:resolve('app/globals.css')});
const css=tw.css+readFileSync('app/iris/desktop/desktop.css','utf8')+cssParts.join('\n');
export const server=http.createServer((req,res)=>{
  if(req.url==='/fixture.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(script);return;}
  if(req.url.startsWith('/svgs/')||req.url.startsWith('/IRIS/')){const path=resolve('public','.'+decodeURIComponent(req.url));if(path.startsWith(resolve('public')+'\\')&&existsSync(path)){res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end(readFileSync(path));return;}res.writeHead(404);res.end();return;}
  const font=Number(new URL(req.url,'http://localhost').searchParams.get('font'))||18;
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'none'"});
  res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'html{font-size:'+font+'px!important}body{margin:0}</style></head><body><div id="app"></div><script src="/fixture.js"></script></body></html>');
});
server.listen(Number(process.env.IRIS_SYNAXIS_FIXTURE_PORT)||3008,'127.0.0.1',()=>console.log('IRIS shared Synaxis fixture port '+server.address().port+' · synthetic IO only'));
