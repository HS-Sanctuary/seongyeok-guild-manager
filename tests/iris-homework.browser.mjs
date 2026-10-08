// Isolated synthetic account/native channel. All API routes are intercepted; no real DB writes.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const period='2026-10-07T21:00:00.000Z';let posts=0;
const tasks={daily:[{id:'1',name:'일일 미션',displayName:'미션',completed:0,total:1},{id:'2',name:'요일 던전',displayName:'요일',completed:0,total:1},{id:'3',name:'심층 던전',displayName:'심층',completed:0,total:1},{id:'4',name:'일일 아르바이트',displayName:'아르바이트',completed:1,total:1}],weekly:[{id:'9900',name:'검은 구멍',completed:0,total:11},{id:'9901',name:'소환의 결계',completed:0,total:7},{id:'9902',name:'뱅가드 브리치',completed:3,total:3},{id:'5',name:'[주간 목표] 정기 의뢰',displayName:'정기 의뢰',completed:1,total:1},{id:'6',name:'아주긴약칭없이전체이름보여주는미등록숙제',completed:0,total:1}],abyss:[{id:'7',name:'허상의 정박지',displayName:'허상',completed:0,total:1},{id:'8',name:'광기의 동굴',displayName:'동굴',completed:0,total:1},{id:'9',name:'흩어진 물길',displayName:'물길',completed:0,total:1}],raid:[{id:'10',name:'카브라크',displayName:'카브',completed:1,total:1},{id:'11',name:'화이트 서큐버스',displayName:'화서',completed:0,total:1},{id:'12',name:'에이렐',displayName:'에렐',completed:0,total:1}]};
await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url());let body={};
  if(url.pathname==='/api/auth/session')body={account:{id:'a',nickname:'owner',role:'길드원'}};
  if(url.pathname==='/api/iris/characters')body={accountId:'a',characters:[{id:'c',nickname:'열두글자캐릭터닉네임확인',job:'힐러',alias:null}]};
  if(url.pathname==='/api/iris/stats')body={accountId:'a',characters:[]};
  if(url.pathname==='/api/iris/kronos'){
    if(req.method()==='POST'){posts++;const {edit}=req.postDataJSON();assert.equal(edit.accountId,'a');assert.equal(edit.characterId,'c');const row=tasks[edit.category].find(r=>r.id===edit.taskId);assert.ok(row);row.completed=edit.desiredCompleted;body={result:{requestId:edit.requestId,status:'saved',completed:row.completed}};}
    else body={accountId:'a',characterId:'c',observedAt:new Date().toISOString(),writeContext:{periodKeys:Object.fromEntries(['daily','weekly','abyss','raid'].map(k=>[k,period])),classes:[]},details:{schemaVersion:1,tasks,classes:[]}};
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
await page.addInitScript(()=>{
  const listeners=new Set();let queue=null;
  window.__irisDesktopBridge={epoch:1,environment:'development'};
  window.chrome={webview:{addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),postMessage:m=>{
    if(m.method==='store.replace')queue=m.payload;
    const value=m.method==='store.load'?queue:m.method==='game.stats.read'?{observedAt:new Date().toISOString(),job:'힐러',level:100,stats:{combat_power:10,life_energy:20,magic_resistance:30,charm:40}}:m.method.startsWith('overlay.')?{clickThrough:false,shortcutsAvailable:true,opacityPercent:100}:null;
    queueMicrotask(()=>{for(const fn of listeners)fn({data:{version:1,id:m.id,epoch:1,ok:true,value}});});
  }}};
});
try{
  await page.goto(process.env.IRIS_TEST_URL??'http://localhost:3000/iris/desktop');
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();await page.getByRole('button',{name:'열두글자캐릭터닉네임확인 힐러',exact:true}).click();
  const board=page.locator('.iris-checkboard'),daily=page.getByRole('region',{name:'일일 숙제',exact:true}),weekly=page.getByRole('region',{name:'주간 숙제',exact:true});
  await daily.getByText('완료 1/4',{exact:true}).waitFor();
  assert.equal(posts,0);assert.equal(await daily.getByText('미션',{exact:true}).count(),1);
  assert.equal(await board.locator('details').count(),0);
  for(const name of ['일일','주간','어비스','레이드'])assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByText('허상의 정박지',{exact:true}).waitFor();await page.getByText('화이트 서큐버스',{exact:true}).waitFor();await page.getByText('에이렐',{exact:true}).waitFor();
  await page.getByRole('button',{name:'주간',exact:true}).click();assert.equal(await weekly.isVisible(),false);assert.equal(posts,0);
  await page.getByRole('button',{name:'주간',exact:true}).click();await weekly.getByText('완료 2/5',{exact:true}).waitFor();
  await page.getByRole('checkbox',{name:'일일 미션 완료',exact:true}).check();await daily.getByText('완료 2/4',{exact:true}).waitFor();
  await page.getByRole('button',{name:'검은 구멍 증가',exact:true}).click();await weekly.getByText('1/11',{exact:true}).waitFor();
  await page.getByRole('button',{name:'지금 저장',exact:true}).click();await page.getByText('미저장 변경 없음',{exact:true}).waitFor();assert.equal(posts,2);
  assert.equal(tasks.daily[0].completed,1);assert.equal(tasks.weekly[0].completed,1);
  await page.getByRole('checkbox',{name:'미완료만',exact:true}).check();
  assert.equal(await page.getByRole('checkbox',{name:'일일 미션 완료',exact:true}).count(),0);await daily.getByText('완료 2/4',{exact:true}).waitFor();
  await page.getByRole('checkbox',{name:'미완료만',exact:true}).uncheck();
  for(const name of ['일일','주간','어비스','레이드'])await page.getByRole('button',{name,exact:true}).click();
  await page.getByText('위에서 표시할 숙제 분류를 선택해 주세요.',{exact:true}).waitFor();assert.equal(posts,2);
  for(const name of ['일일','주간','어비스','레이드'])await page.getByRole('button',{name,exact:true}).click();
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow ${width}`);
    const first=await daily.locator('.iris-task-row').nth(0).boundingBox(),second=await daily.locator('.iris-task-row').nth(1).boundingBox();assert.equal(first.y,second.y,`Checkbox tasks share a two-column row at ${width}; grid ${await daily.locator('.iris-category-rows').evaluate(e=>getComputedStyle(e).gridTemplateColumns)}`);
    const repeat=await weekly.locator('[data-kind=counter]').first().boundingBox(),grid=await weekly.locator('.iris-category-rows').boundingBox();assert.ok(repeat.width>=grid.width-2,'Repeat controls span the full grid');
  }
  await page.setViewportSize({width:390,height:900});
  if(process.env.IRIS_UI_SCREENSHOT_DARK){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:process.env.IRIS_UI_SCREENSHOT_DARK,fullPage:true,animations:'disabled'});}
  await page.getByRole('button',{name:'설정',exact:true}).click();await page.getByRole('button',{name:'Lumen',exact:true}).click();await page.getByRole('button',{name:'이전 화면',exact:true}).click();
  await daily.getByText('완료 2/4',{exact:true}).waitFor();
  assert.notEqual(await daily.locator('[data-complete=true]').first().evaluate(e=>getComputedStyle(e).borderColor),await daily.locator('[data-complete=false]').first().evaluate(e=>getComputedStyle(e).borderColor),'Completed tiles retain a distinct border in the light theme');
  await page.evaluate(()=>window.scrollTo(0,0));
  if(process.env.IRIS_UI_SCREENSHOT)await page.screenshot({path:process.env.IRIS_UI_SCREENSHOT,fullPage:true,animations:'disabled'});
  assert.deepEqual(errors,[]);console.log('Homework DOM PASS: aliases, two-column checks, full-width counters, optimistic summaries, manual save, filter totals, 4 widths; synthetic only');
}catch(error){if(process.env.IRIS_UI_SCREENSHOT)await page.screenshot({path:process.env.IRIS_UI_SCREENSHOT,fullPage:true});throw error;}finally{await browser.close();}
