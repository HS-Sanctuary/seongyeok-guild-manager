// Real close dialog/controller, exclusively intercepted API/native IO.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
let passed=0;
try{for(const mode of ['clean','kept','saved','unknown','conflict','unauthorized','invalid-draft','keep-failed','close-retry']){
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage(),errors=[];let completed=0,posts=0;
 page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-08T03:00:00.000Z')});
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin!==new URL(process.env.IRIS_TEST_URL??'http://localhost:3000/iris/desktop').origin){await route.abort();return;}
  if(!url.pathname.startsWith('/api/')){await route.continue();return;}
  const path=url.pathname;let body={},status=200;
  if(path==='/api/auth/session')body={account:{id:'a',nickname:'owner',role:'길드원'}};
  if(path==='/api/iris/characters')body={accountId:'a',characters:[{id:'c',nickname:'한설',job:'댄서',alias:null}]};
  if(path==='/api/iris/stats')body={accountId:'a',characters:[]};
  if(path==='/api/iris/kronos'){
   if(req.method()==='POST'){posts++;const {edit}=req.postDataJSON();status=mode==='unknown'?500:mode==='conflict'?409:mode==='unauthorized'?401:200;if(status===200)completed=edit.desiredCompleted;body={result:{requestId:edit.requestId,status:'saved',completed}};}
   else body={accountId:'a',characterId:'c',observedAt:new Date().toISOString(),writeContext:{periodKeys:Object.fromEntries(['daily','weekly','abyss','raid'].map(k=>[k,'2026-10-07T21:00:00.000Z'])),classes:[{classId:'warrior',editable:true,baseLevel:1}]},details:{schemaVersion:1,tasks:{daily:[{id:'mission',name:'일일 미션',completed,total:1}],weekly:[],abyss:[],raid:[]},classes:[{id:'warrior',name:'전사',level:1}]}};
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.addInitScript(()=>{
  const listeners=new Set();window.__irisDesktopBridge={epoch:1,environment:'development'};window.fixture={queue:null,close:0,fail:null,decisions:[]};
  window.chrome={webview:{addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),postMessage:m=>{
   const f=window.fixture,ok=f.fail!==m.method;let value=null;
   if(m.method==='store.capabilities')value={schemaVersion:3,barter:true};
   if(m.method==='store.load')value=f.queue;if(m.method==='store.replace'&&ok)f.queue=structuredClone(m.payload);
   if(m.method==='window.close'&&ok)f.close++;if(m.method==='window.decision')f.decisions.push(m.payload.open);
   if(m.method==='window.addon.state')value={dockSide:'right',sameLayer:true,tracked:true,actualSide:'right',status:'attached',persistent:true};
   if(m.method==='game.stats.read')value={observedAt:new Date().toISOString(),job:'댄서',level:100,stats:{combat_power:10,life_energy:20,magic_resistance:30,charm:40}};
   queueMicrotask(()=>{for(const fn of listeners)fn({data:{version:1,id:m.id,epoch:1,ok,value}});});
  }}};
 });
 try{
  await page.goto(process.env.IRIS_TEST_URL??'http://localhost:3000/iris/desktop');await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();await page.getByRole('button',{name:'한설 댄서',exact:true}).click();
  if(mode!=='clean'){await page.getByRole('checkbox',{name:'일일 미션 완료',exact:true}).check();await page.waitForFunction(()=>window.fixture.queue?.entries.length===1);}
  if(mode==='invalid-draft'){await chooseIrisFeature(page,'클래스');await page.getByRole('textbox',{name:'전사 레벨',exact:true}).fill('oops');}
  if(mode==='keep-failed')await page.evaluate(()=>window.fixture.fail='store.replace');
  if(mode==='close-retry')await page.evaluate(()=>window.fixture.fail='window.close');
  const ask=()=>page.evaluate(()=>window.dispatchEvent(new CustomEvent('iris-desktop-close',{detail:{version:1,kind:'window.close.request',epoch:1,environment:'development',reason:'game-exit'}})));
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('iris-desktop-close',{detail:{version:1,kind:'window.close.request',epoch:99,environment:'development',reason:'game-exit'}})));
  assert.equal(await page.getByRole('dialog').count(),0,'Stale event cannot close');
  await ask();await ask();await page.getByRole('heading',{name:'게임이 종료됐어요. IRIS도 종료할까요?',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'버리고 종료',exact:true}).count(),0);
  if(mode==='clean'){
   assert.equal(await page.getByRole('button',{name:'생텀에 저장 후 종료',exact:true}).count(),0);
   assert.equal(await page.getByRole('button',{name:'이 PC에 보관 후 종료',exact:true}).count(),0);
  }else{
   await page.getByText('다른 PC에는 전달되지 않아요.',{exact:false}).waitFor();
   if(mode==='kept')await page.screenshot({path:'.superpowers/iris-close-options-20261012.png'});
  }
  await page.getByRole('button',{name:mode==='clean'?'종료':mode==='kept'||mode==='keep-failed'||mode==='invalid-draft'?'이 PC에 보관 후 종료':'생텀에 저장 후 종료',exact:true}).click();
  if(mode==='clean'){await page.waitForFunction(()=>window.fixture.close===1);assert.equal(posts,0,'Clean exit must not submit writes');}
  else if(mode==='kept'){await page.waitForFunction(()=>window.fixture.close===1);assert.equal(posts,0,'Local keep must not submit unsent edits');assert.equal((await page.evaluate(()=>window.fixture.queue)).entries.length,1);}
  else if(mode==='saved'){await page.waitForFunction(()=>window.fixture.close===1);assert.equal(posts,1);assert.equal((await page.evaluate(()=>window.fixture.queue)).entries.length,0);}
  else{
   await page.getByText('보관 또는 종료 연결에 실패했어요. 기존 보호 대기함은 유지돼요. 연결을 확인한 뒤 다시 시도해 주세요.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.fixture.close),0);
   if(mode!=='close-retry')assert.equal((await page.evaluate(()=>window.fixture.queue)).entries.length,1);
   assert.equal(await page.getByRole('button',{name:'손실 가능성을 확인하고 종료',exact:true}).count(),0);
   if(mode==='close-retry'){await page.evaluate(()=>window.fixture.fail=null);await page.getByRole('button',{name:'이 PC에 보관 후 종료',exact:true}).click();await page.waitForFunction(()=>window.fixture.close===1);assert.equal(posts,1,'Native close retry must not repeat save');}
   else{await page.getByRole('button',{name:'취소',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});assert.equal(await page.evaluate(()=>window.fixture.decisions.at(-1)),false);}
  }
  assert.deepEqual(errors,[]);passed++;console.log(`PASS game-exit ${mode}`);
 }finally{await context.close();}
}console.log(`Addon lifecycle ${passed}/${passed} PASS; no real DB/game writes`);}finally{await browser.close();}
import {chooseIrisFeature} from './iris-feature-navigation.mjs';
