// Real React/DOM and favorites hook; only HTTP is synthetic. No app server/native/DB.
// Run: node tests/barter-favorites-ui.browser.mjs <bundled Playwright package.json>
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname,extname} from 'node:path';
import ts from 'typescript';

const {chromium}=createRequire(process.argv[2])('playwright');
const repo=process.cwd(),modules=[],ids=new Map(),styles=[];
function include(file){
  file=resolve(file);
  if(ids.has(file))return ids.get(file);
  const id=modules.length;ids.set(file,id);modules.push(null);
  if(extname(file)==='.css'){styles.push(readFileSync(file,'utf8'));modules[id]='module.exports={};';return id;}
  const localRequire=createRequire(file);
  let source=readFileSync(file,'utf8');
  if(/\.tsx?$/.test(file))source=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  modules[id]=source.replace(/require\(["']([^"']+)["']\)/g,(_,name)=>{
    let target;
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?resolve(repo,name.slice(2)):resolve(dirname(file),name);
      target=[base,base+'.ts',base+'.tsx',base+'.js',base+'.json',resolve(base,'index.js')].find(path=>existsSync(path)&&extname(path));
    }
    target??=localRequire.resolve(name);
    return `require(${include(target)})`;
  });
  return id;
}
const localRequire=createRequire(resolve(repo,'package.json'));
const react=include(localRequire.resolve('react')),client=include(localRequire.resolve('react-dom/client'));
const web=include(resolve(repo,'components/character/TradeList.tsx')),iris=include(resolve(repo,'components/iris/DesktopBarter.tsx'));
const bundle=`(()=>{const process={env:{NODE_ENV:'development'}};const modules={${modules.map((code,id)=>`${id}:(require,module,exports)=>{${code}\n}`).join(',')}};const cache={};function require(id){if(cache[id])return cache[id].exports;const module=cache[id]={exports:{}};modules[id](require,module,module.exports);return module.exports;}window.favoritesComponents={React:require(${react}),createRoot:require(${client}).createRoot,TradeList:require(${web}).default,DesktopBarter:require(${iris}).DesktopBarter};})();`;
const css=readFileSync(resolve(repo,'app/iris/desktop/desktop.css'),'utf8')+'\n'+styles.join('\n');
const browser=await chromium.launch({channel:'msedge',headless:true});
const first='00000000-0000-4000-8000-000000000001',second='00000000-0000-4000-8000-000000000002';
let passed=0;
async function fixture({mode='web',legacy=null,holdGet=false,failGet=false,strict=false}={}){
  const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',route=>route.request().isNavigationRequest()&&route.request().url()==='http://barter-favorites.test/'?route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}):route.abort('blockedbyclient'));
  await page.goto('http://barter-favorites.test/');
  await page.setContent(`<style>html{font-size:18px;--text-main:#e8e5dd;--text-sub:#b1afa8;--panel:#1b1d22;--panel-border:#484b55;--inner-box:#292d35;--accent:#e0bd65;--kronos-reward:#83dbb4;--kronos-cost:#dfa993}*{box-sizing:border-box}body{margin:0;background:var(--panel);color:var(--text-main);padding:.4rem}button,input{font:inherit}${css}</style><main id="mount"></main>`);
  if(legacy)await page.evaluate(legacy=>localStorage.setItem('nexus_pinned_trades',JSON.stringify(legacy)),legacy);
  await page.addScriptTag({content:bundle});
  await page.evaluate(({mode:initialMode,holdGet,failGet,strict,first,second})=>{
    const {React,createRoot,TradeList,DesktopBarter}=window.favoritesComponents;
    window.fixture={accounts:{[first]:[2],[second]:[1]},gets:[],posts:[],held:[],holdGet,failGet,holdPost:false,failPost:false,edits:[]};
    window.fetch=async(input,init={})=>{
      const url=new URL(input,location.href),method=init.method??'GET',f=window.fixture;
      if(url.pathname!=='/api/kronos/barter-favorites'||!['GET','POST'].includes(method))throw Error('Unexpected external IO');
      let accountId,favorites;
      if(method==='GET'){
        accountId=url.searchParams.get('accountId');f.gets.push(accountId);favorites=strict&&f.gets.length===1?[]:[...(f.accounts[accountId]??[])];
        if(f.holdGet)await new Promise(release=>f.held.push({method,accountId,release}));
        if(f.failGet)return new Response('{}',{status:503});
      }else{
        const body=JSON.parse(init.body);accountId=body.accountId;f.posts.push(body);
        if(f.holdPost)await new Promise(release=>f.held.push({method,accountId,release}));
        if(f.failPost)return new Response('{}',{status:503});
        const current=f.accounts[accountId]??[];
        f.accounts[accountId]=body.importIds?[...new Set([...current,...body.importIds])]:body.favorite?[...new Set([...current,body.tradeId])]:current.filter(id=>id!==body.tradeId);
        favorites=[...f.accounts[accountId]];
      }
      return new Response(JSON.stringify({accountId,favorites}),{status:200,headers:{'Content-Type':'application/json'}});
    };
    const rows=[{id:1,map:'가 마을',npc:'가 상인',reward:'첫 품목',cost:'양털',limit:3,reset_type:'일간',scope:'캐릭당'},{id:2,map:'하 마을',npc:'하 상인',reward:'둘째 품목',cost:'우유',limit:5,reset_type:'주간',scope:'계정당'}];
    function App(){
      const [accountId,setAccountId]=React.useState(first),[mode,setMode]=React.useState(initialMode),[search,setSearch]=React.useState(''),[sort,setSort]=React.useState('asc'),[locked,setLocked]=React.useState(false);
      window.setFixtureAccount=setAccountId;window.setFixtureMode=setMode;window.setFixtureLock=setLocked;
      if(mode==='web')return React.createElement(TradeList,{accountId,accountNickname:'한설',categoryType:'barter',title:'물물교환',items:rows,tradeProgress:{1:1,2:4},tradeCompletedBy:{},tradeSearch:search,setTradeSearch:setSearch,tradeSortOrder:sort,setTradeSortOrder:setSort,updateTradeProgress(...args){window.fixture.edits.push(args);}});
      const selected=accountId?{accountId,characterId:'A',details:{barter:rows.map(row=>({id:String(row.id),map:row.map,npc:row.npc,reward:row.reward,cost:row.cost,rewardCount:1,costCount:2,total:row.limit,resetType:row.reset_type,scope:row.scope==='계정당'?'account':'character',completed:row.id===1?1:4,periodKey:'week',consistent:true}))},writeContext:{barter:rows.map(row=>({tradeId:String(row.id),periodKey:'week',scope:row.scope==='계정당'?'account':'character',catalogKey:'a'.repeat(64),baseRecords:[]}))}}:null;
      return React.createElement(DesktopBarter,{selected,pending:[],locked,onEdit(...args){window.fixture.edits.push(args);}});
    }
    const app=React.createElement(App);
    createRoot(document.querySelector('#mount')).render(strict?React.createElement(React.StrictMode,null,app):app);
  },{mode,holdGet,failGet,strict,first,second});
  return {page,context,errors};
}
const add=page=>page.getByRole('button',{name:'첫 품목 · 가 상인 즐겨찾기 추가',exact:true});
const remove=page=>page.getByRole('button',{name:'둘째 품목 · 하 상인 즐겨찾기 해제',exact:true});
async function ready(page){await remove(page).waitFor();await page.waitForFunction(()=>document.querySelector('button[aria-label="둘째 품목 · 하 상인 즐겨찾기 해제"]')?.disabled===false);}
async function run(name,body,options){
  const f=await fixture(options);
  try{await body(f);assert.deepEqual(f.errors,[]);passed++;console.log('PASS '+name);}
  finally{await f.context.close();}
}
try{
  await run('web favorites first, filter intersects search and explicit star saves',async({page})=>{
    await ready(page);
    const labels=await page.locator('button[aria-label*="즐겨찾기"]').evaluateAll(buttons=>buttons.map(button=>button.getAttribute('aria-label')));
    assert.deepEqual(labels,['둘째 품목 · 하 상인 즐겨찾기 해제','첫 품목 · 가 상인 즐겨찾기 추가']);
    await page.getByRole('checkbox',{name:'즐겨찾기만',exact:true}).check();assert.equal(await add(page).count(),0);
    await page.getByPlaceholder('NPC / 맵 / 보상 / 소모품 검색...').fill('없는품목');assert.equal(await remove(page).count(),0);assert.equal(await page.getByText('현재 검색 조건에 맞는 즐겨찾기 품목이 없습니다.').count(),1);
    await page.getByPlaceholder('NPC / 맵 / 보상 / 소모품 검색...').fill('');await remove(page).click();
    await page.getByText('즐겨찾기한 품목이 없습니다. 별표를 눌러 추가해 주세요.').waitFor();
    assert.deepEqual(await page.evaluate(()=>window.fixture.posts),[{accountId:first,tradeId:2,favorite:false}]);
    assert.deepEqual(await page.evaluate(()=>window.fixture.edits),[],'Favorites never invoke exchange counters');
    await page.getByRole('checkbox',{name:'즐겨찾기만',exact:true}).uncheck();await add(page).click();
    await page.getByRole('button',{name:'첫 품목 · 가 상인 즐겨찾기 해제',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.fixture.gets.length),1,'No polling or extra per-row reads');
  });
  await run('IRIS favorites share web state and preserve counters, filters and locked buttons',async({page})=>{
    await ready(page);await add(page).click();await page.getByRole('button',{name:'첫 품목 · 가 상인 즐겨찾기 해제',exact:true}).waitFor();
    await page.evaluate(()=>window.setFixtureMode('iris'));await ready(page);
    assert.deepEqual(await page.locator('[data-barter-id]').evaluateAll(rows=>rows.map(row=>row.getAttribute('data-barter-id'))),['1','2']);
    assert.equal(await page.getByRole('button',{name:'첫 품목 · 가 상인 즐겨찾기 해제',exact:true}).getAttribute('aria-pressed'),'true');
    await page.getByRole('checkbox',{name:'즐겨찾기만',exact:true}).check();await page.getByRole('combobox',{name:'물물교환 범위'}).selectOption('account');
    assert.deepEqual(await page.locator('[data-barter-id]').evaluateAll(rows=>rows.map(row=>row.getAttribute('data-barter-id'))),['2']);
    assert.equal(await page.locator('output[aria-label="둘째 품목 교환 횟수"]').textContent(),'4/5');
    await page.evaluate(()=>window.setFixtureLock(true));assert.equal(await remove(page).isDisabled(),true);
    for(const width of [320,390,768,1280])for(const font of [18,20,22]){
      await page.setViewportSize({width,height:900});await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',font);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px/${font}px stays within viewport`);
    }
    assert.deepEqual(await page.evaluate(()=>window.fixture.edits),[]);
  });
  await run('failed write keeps previous stars and requires explicit refresh',async({page})=>{
    await ready(page);await page.evaluate(()=>window.fixture.failPost=true);await remove(page).click();
    await page.getByText('저장 결과를 확인하지 못했어요. 다시 조회한 뒤 변경해 주세요.').waitFor();
    assert.equal(await remove(page).getAttribute('aria-pressed'),'true');assert.equal(await remove(page).isDisabled(),true);
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),1);
    await page.evaluate(()=>window.fixture.failPost=false);await page.getByRole('button',{name:'다시 조회',exact:true}).click();await ready(page);
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),1,'Refresh never replays a failed preference');
  });
  await run('legacy browser favorites need account confirmation and preserve the original list',async({page})=>{
    await ready(page);assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);
    await page.getByText('이 브라우저의 기존 즐겨찾기 1개 가져오기').click();
    const confirm=page.getByRole('button',{name:'확인하고 가져오기',exact:true});assert.equal(await confirm.isDisabled(),true);
    await page.getByRole('checkbox',{name:'이 계정의 즐겨찾기가 맞아요',exact:true}).check();await confirm.click();
    await page.waitForFunction(()=>window.fixture.posts.length===1&&localStorage.getItem('sanctum_barter_favorites_imported:'+window.fixture.gets[0])==='confirmed');
    assert.deepEqual(await page.evaluate(()=>window.fixture.posts),[{accountId:first,importIds:[1]}]);
    assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_pinned_trades')),'[1]');
  },{legacy:[1]});
  await run('late old-account read never exposes stars on new account',async({page})=>{
    await page.waitForFunction(()=>window.fixture.held.length===1);
    await page.evaluate(second=>window.setFixtureAccount(second),second);await page.waitForFunction(()=>window.fixture.held.length===2);
    await page.evaluate(first=>{const f=window.fixture;f.held.find(x=>x.accountId===first).release();},first);
    assert.equal(await page.getByRole('button',{name:'둘째 품목 · 하 상인 즐겨찾기 해제',exact:true}).count(),0);
    assert.equal(await add(page).isDisabled(),true);
    await page.evaluate(second=>window.fixture.held.find(x=>x.accountId===second).release(),second);
    await page.getByRole('button',{name:'첫 품목 · 가 상인 즐겨찾기 해제',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'둘째 품목 · 하 상인 즐겨찾기 추가',exact:true}).getAttribute('aria-pressed'),'false');
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);
  },{holdGet:true});
  await run('pending write blocks duplicates and old-account success cannot replace new stars',async({page})=>{
    await ready(page);await page.evaluate(()=>window.fixture.holdPost=true);await remove(page).click();await page.waitForFunction(()=>window.fixture.held.length===1);
    assert.equal(await remove(page).isDisabled(),true);
    await remove(page).evaluate(button=>{button.click();button.click();});assert.equal(await page.evaluate(()=>window.fixture.posts.length),1);
    await page.evaluate(second=>window.setFixtureAccount(second),second);
    await page.getByRole('button',{name:'첫 품목 · 가 상인 즐겨찾기 해제',exact:true}).waitFor();
    await page.evaluate(()=>window.fixture.held[0].release());
    assert.equal(await page.getByRole('button',{name:'첫 품목 · 가 상인 즐겨찾기 해제',exact:true}).getAttribute('aria-pressed'),'true');
    assert.equal(await page.getByRole('button',{name:'둘째 품목 · 하 상인 즐겨찾기 추가',exact:true}).getAttribute('aria-pressed'),'false');
  });
  await run('missing account cannot write or silently import browser favorites',async({page})=>{
    await ready(page);await page.evaluate(()=>window.setFixtureAccount(null));
    await page.getByText('로그인한 계정의 즐겨찾기를 사용할 수 있어요.').waitFor();
    assert.equal(await add(page).isDisabled(),true);assert.equal(await page.getByRole('button',{name:'확인하고 가져오기',exact:true}).count(),0);
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);
  },{legacy:[1]});
  await run('unavailable favorites API never blocks IRIS exchange actions',async({page})=>{
    await page.getByText('즐겨찾기를 불러오지 못했어요. 로그인·연결 상태를 확인하고 다시 조회해 주세요.').waitFor();
    assert.equal(await add(page).isDisabled(),true);
    await page.getByRole('button',{name:'둘째 품목 교환 횟수 증가',exact:true}).click();
    const edits=await page.evaluate(()=>window.fixture.edits);
    assert.equal(edits.length,1);assert.equal(edits[0][0].tradeId,'2');assert.equal(edits[0][1],4);assert.equal(edits[0][2],5);
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);
    await page.evaluate(()=>window.fixture.failGet=false);await page.getByRole('button',{name:'다시 조회',exact:true}).click();await ready(page);
  },{mode:'iris',failGet:true});
  await run('StrictMode obsolete load cannot replace the later account result',async({page})=>{
    await page.waitForFunction(()=>window.fixture.held.length===2);
    // Complete the replay's live request first, then its obsolete predecessor.
    await page.evaluate(()=>window.fixture.held[1].release());await ready(page);
    await page.evaluate(()=>window.fixture.held[0].release());await page.evaluate(()=>new Promise(requestAnimationFrame));
    assert.equal(await remove(page).getAttribute('aria-pressed'),'true');
    assert.equal(await add(page).getAttribute('aria-pressed'),'false');
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);
    assert.equal(await page.evaluate(()=>window.fixture.gets.length),2,'Only the development lifecycle replay issues reads');
  },{holdGet:true,strict:true});
  for(const mode of ['web','iris']) await run('unconfirmed '+mode+' favorites are not described as an empty saved list',async({page})=>{
    await page.waitForFunction(()=>window.fixture.held.length===1);
    await page.getByRole('checkbox',{name:'즐겨찾기만',exact:true}).check();
    await page.evaluate(()=>new Promise(requestAnimationFrame));
    assert.equal(await page.getByText('즐겨찾기를 불러오는 중이에요.',{exact:true}).count(),1);
    await page.evaluate(()=>{window.fixture.failGet=true;window.fixture.held[0].release();});
    await page.getByText('즐겨찾기를 불러오지 못했어요. 로그인·연결 상태를 확인하고 다시 조회해 주세요.').waitFor();
    assert.equal(await page.getByText('즐겨찾기를 먼저 다시 조회해 주세요.',{exact:true}).count(),1);
    assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);
  },{mode,holdGet:true});
  console.log(`Favorites UI: ${passed} scenarios passed; real React hook/components, HTTP fixture only`);
}finally{await browser.close();}
