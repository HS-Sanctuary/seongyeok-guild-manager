// Isolated local browser fixture. Actual React/controller/queue, synthetic IO only.
// Start: node tests/iris-workspace.fixture.mjs ; inspect with approved browser tools.
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import ts from 'typescript';
function bundle(source){
  const modules=[],ids=new Map();
  function visit(file,provided){
    if(ids.has(file))return ids.get(file);
    const id=modules.length;ids.set(file,id);modules.push(null);
    const raw=provided??readFileSync(file,'utf8');
    const code=['.ts','.tsx'].includes(extname(file))?ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true},fileName:file}).outputText:raw;
    const deps={};
    for(const match of code.matchAll(/\brequire\(['"]([^'"]+)['"]\)/g)){
      const name=match[1];if(name in deps)continue;
      if(name.endsWith('.css')){deps[name]=visit(resolve('tests/__empty.css.js'),'module.exports={};');continue;}
      let dependency;
      if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(file),name);dependency=[base,base+'.ts',base+'.tsx'].find(existsSync);}
      else dependency=createRequire(file).resolve(name);
      assert.ok(dependency,'Unresolved test dependency '+name);deps[name]=visit(dependency);
    }
    modules[id]=`[function(require,module,exports){${code}\n},${JSON.stringify(deps)}]`;return id;
  }
  const root=visit(resolve('tests/__workspace-entry.js'),source);
  return `(function(){const process={env:{NODE_ENV:'production'}};const modules=[${modules.join(',')}],cache={};function run(id){if(cache[id])return cache[id].exports;const module=cache[id]={exports:{}};const [fn,deps]=modules[id];fn(name=>run(deps[name]),module,module.exports);return module.exports;}run(${root});})();`;
}
const entry=`
const React=require('react'),{createRoot}=require('react-dom/client');
const {DesktopCenter}=require('../components/iris/DesktopCenter.tsx');
const {DesktopWorkspace}=require('../components/iris/DesktopWorkspace.tsx');
const {DesktopSynaxis}=require('../components/iris/DesktopSynaxis.tsx');
const {createDesktopController}=require('../lib/irisDesktopController.ts');
const {createDesktopQueue}=require('../lib/irisDesktopQueue.ts');
const h=React.createElement,key={itemKind:'shop',itemId:'1',field:'count',scope:'account',periodKey:'2026-10-04T21:00:00.000Z',catalogKey:'a'.repeat(64)};
const characters=[{id:'A',nickname:'열두글자닉네임확인테스트',job:'장궁병'},{id:'B',nickname:'합성캐릭터두번째',job:'힐러'}];
const rows=[{id:'1',itemKind:'shop',title:'긴이름의상급설비증축도면',location:'티르코네일',npc:'앨빈',description:'',rewards:[{name:'긴이름의상급설비증축도면',count:1}],cost:10000000,requirement:'생활력 7,000 이상',total:9999,resetType:'주간',scope:'account',completed:2,bookmarked:false,key},
{id:'2',itemKind:'shop',title:'무한히긴라틴제목ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',location:'던바튼',npc:'조셀린',description:'긴 설명과 구매 조건을 줄 단위로 안전하게 읽을 수 있어야 합니다.',rewards:[{name:'긴 보상 항목의 전체 이름',count:999999999}],cost:1000000000,requirement:null,total:1,resetType:'주간',scope:'character',completed:3,bookmarked:false,key:{...key,itemId:'2',scope:'character'}},
{id:'3',itemKind:'mission',title:'합성 생활 지원 임무',location:'던바튼',npc:'',description:'긴 설명과 보상 두 가지가 카드 밖으로 나가지 않아야 합니다.',rewards:[{name:'주화',count:10},{name:'아주 긴 지원 보상 이름',count:9999}],cost:null,requirement:null,total:3,resetType:'주간',scope:'character',completed:0,bookmarked:false,key:{...key,itemKind:'mission',itemId:'3',scope:'character'}}];
const values=new Map(),queue=createDesktopQueue({environment:'development',now:()=>Date.now(),id:()=>crypto.randomUUID()});let writes=0,protectedSnapshot=null;
const details=(id)=>({accountId:'account',characterId:id,details:{tasks:{daily:[],weekly:[],abyss:[],raid:[]},classes:[],workspace:rows.map(r=>({...r,completed:values.get((r.scope==='account'?'shared':id)+':'+r.id+':count')??r.completed,bookmarked:!!(values.get((r.scope==='account'?'shared':id)+':'+r.id+':bookmark')??Number(r.bookmarked))}))},writeContext:{periodKeys:{},classes:[]}});
let partyWrites=0;
const synaxisData={accountId:'account',canCreateBus:true,characters:characters.map((c,i)=>({...c,combatPower:99999999,magicResistance:99999,completed:i?[]:['raid_cabrak']})),options:[{id:'raid_cabrak',name:'레이드 - 카브락',category:'레이드',difficulties:[{name:'매우 어려움',capacity:8,minCombatPower:90000}]},{id:'raid_eirel',name:'레이드 - 에이렐',category:'레이드',difficulties:[{name:'어려움',capacity:4,minCombatPower:90000}]}]};
const synaxisTransport={load:async()=>synaxisData,create:async input=>{partyWrites++;return input.memo.includes('응답실패')?{kind:'unknown',message:'합성 응답 실패 · 다시 보내지 않았어요.'}:{kind:'created',partyId:String(100+partyWrites)};}};
const controller=createDesktopController({queue,environment:'development',store:{load:async()=>protectedSnapshot,replace:async s=>protectedSnapshot=s},transport:{session:async()=>({id:'account',nickname:'합성계정',role:'길드원'}),characters:async()=>characters,details:async(a,id)=>details(id),save:async e=>{writes++;values.set((e.scope==='account'?'shared':e.characterId)+':'+e.itemId+':'+e.field,e.desiredCompleted);return {kind:'saved',completed:e.desiredCompleted};}}});
function App(){
 const [view,setView]=React.useState(null),[error,setError]=React.useState('');
 const refresh=()=>setView({...controller.state()});
 const run=async(fn)=>{try{await fn();setError('');}catch(e){setError(e.message);}refresh();};
 React.useEffect(()=>{let alive=true;controller.start().then(()=>controller.selectCharacter('A')).then(()=>{if(alive)refresh();});const timer=setInterval(()=>{controller.tick().then(()=>{if(alive)refresh();});},250);return()=>{alive=false;clearInterval(timer);};},[]);
 if(!view)return h('p',null,'합성 데이터 준비');
 const props={selected:view.selected,pending:view.queue.entries,locked:view.locked,onEdit:(k,b,d)=>run(()=>controller.editWorkspace(k,b,d))};
 return h('main',{className:'iris-desktop'},h('p',null,'IRIS 합성 검증 · 게임/DB 연결 없음'),h(DesktopCenter,{account:view.account,characters:view.characters,selected:view.selected,pending:view.queue.entries,locked:view.locked,onSelectCharacter:id=>run(()=>controller.selectCharacter(id)),onEdit(){},saveStatus:h('div',{className:'fixture-feedback'},h('button',{className:'iris-desktop-button',onClick:()=>run(()=>controller.saveNow())},'수동 저장'),h('output',{id:'fixture-status'},'대기 '+view.queue.entries.length+' · 저장 '+writes+' · 합성 생성 '+partyWrites)),shopPanel:h(DesktopWorkspace,{...props,kind:'shop'}),missionsPanel:h(DesktopWorkspace,{...props,kind:'mission'}),synaxisPanel:active=>h(DesktopSynaxis,{account:view.account,active,locked:view.locked,selectedId:view.selected?.characterId??null,transport:synaxisTransport})}),error&&h('p',{role:'alert'},error));
}
createRoot(document.getElementById('app')).render(h(App));`;
const script=bundle(entry);
const css=readFileSync('app/iris/desktop/desktop.css','utf8')+readFileSync('components/iris/desktop-workspace.css','utf8')+readFileSync('components/iris/desktop-synaxis.css','utf8');
http.createServer((req,res)=>{
  if(req.url==='/fixture.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(script);return;}
  const font=[18,20,22].includes(Number(new URL(req.url,'http://localhost').searchParams.get('font')))?Number(new URL(req.url,'http://localhost').searchParams.get('font')):18;
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'none'"});
  res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>IRIS workspace synthetic fixture</title><style>:root{font-size:'+font+'px;--panel:#171719;--inner-box:#101012;--text-main:#f5f5fb;--text-muted:#babacd;--accent:#e3c780;--panel-border:#38383b}*{box-sizing:border-box}body{margin:0;background:#171719;color:#f5f5fb}button,input,select{font:inherit}.fixture-feedback{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}'+css+'</style></head><body><div id="app"></div><script src="/fixture.js"></script></body></html>');
}).listen(3007,'127.0.0.1',()=>console.log('Synthetic workspace fixture http://127.0.0.1:3007 · no real IO'));
