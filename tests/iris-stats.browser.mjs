// Synthetic end-to-end flow; isolated browser, no account cookies or production data.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
let posts=0,reads=0,slowStats=false,kronosReads=0;
const stats={combat_power:'100',life_energy:'0',magic_resistance:null,charm:'30'};
await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url());let value={};
  if(url.pathname==='/api/auth/session')value={account:{id:'a',nickname:'owner',role:'길드원'}};
  if(url.pathname==='/api/iris/characters')value={accountId:'a',characters:[{id:'7',nickname:'화연',job:'힐러',alias:null}]};
  if(url.pathname==='/api/iris/kronos'){kronosReads++;const classes=['전사','대검전사','검술사','기사','궁수'].map((name,i)=>({id:String(i),name,level:1}));value={accountId:'a',characterId:'7',observedAt:new Date().toISOString(),writeContext:{periodKeys:Object.fromEntries(['daily','weekly','abyss','raid'].map(k=>[k,'2026-10-07T21:00:00.000Z'])),classes:classes.map(c=>({classId:c.id,editable:true,baseLevel:1}))},details:{schemaVersion:1,tasks:{daily:[],weekly:[],abyss:[],raid:[]},classes}};}
  if(url.pathname==='/api/iris/stats'){
    if(request.method()==='POST'){posts++;const edit=request.postDataJSON();assert.equal(edit.confirmed,true);assert.equal(edit.characterId,'7');for(const [k,v] of Object.entries(edit.stats))if(v!==null)stats[k]=String(v);value={result:{status:'saved',accountId:'a',characterId:'7'}};}
    else{reads++;if(slowStats)await new Promise(resolve=>setTimeout(resolve,6000));value={accountId:'a',characters:[{id:'7',nickname:'화연',job:'힐러',stats}]};}
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
});
await page.addInitScript(()=>{
  const listeners=new Set();let queue=null;window.fixtureScore=90;window.fixtureGameReads=0;
  window.__irisDesktopBridge={epoch:1,environment:'development'};window.fixtureCurrencyReads=0;
  window.chrome={webview:{addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),postMessage:message=>{
    if(message.method==='store.replace')queue=message.payload;
    if(message.method==='game.stats.read')window.fixtureGameReads++;
    if(message.method==='game.currencies.read')window.fixtureCurrencyReads++;
    const value=message.method==='store.capabilities'?{schemaVersion:3,barter:true}:message.method==='game.currencies.read'?{observedAt:new Date().toISOString(),items:[{name:'골드',amount:12345678901},{name:'은동전',amount:0},{name:'웨카',amount:null}]}:message.method==='game.stats.read'?{observedAt:new Date().toISOString(),job:'힐러',level:100,stats:{combat_power:window.fixtureScore,life_energy:0,magic_resistance:40,charm:null}}:message.method==='store.load'?queue:message.method.startsWith('overlay.')?{clickThrough:false,shortcutsAvailable:true,opacityPercent:100}:null;
    queueMicrotask(()=>{for(const fn of listeners)fn({data:{version:1,id:message.id,epoch:1,ok:true,value}});});
  }}};
});
try{
  await page.goto(process.env.IRIS_TEST_URL??'http://localhost:3001/iris/desktop');
  await page.getByRole('button',{name:'네, 선택',exact:true}).click();assert.equal(posts,0,'Login suggestion never writes');
  assert.equal(await page.getByRole('navigation',{name:'상위 메뉴',exact:true}).count(),1,'Three parent menus must be separate from Kronos actions');
  assert.equal(await page.getByRole('button',{name:'물물교환',exact:true}).isDisabled(),false);
  for(const name of ['상점구매','임무게시판'])assert.equal(await page.getByRole('button',{name,exact:true}).isDisabled(),true);
  if(process.env.IRIS_UI_SCREENSHOT)await page.screenshot({path:process.env.IRIS_UI_SCREENSHOT,fullPage:true});
  await page.evaluate(()=>window.fixtureScore=89);
  await page.getByRole('button',{name:'스탯',exact:true}).click();
  await page.getByRole('heading',{name:'실제 인게임 스테이터스',exact:true}).waitFor();
  await page.locator('#iris-pane-stats .iris-stats-card').last().getByText('89',{exact:true}).waitFor();
  assert.equal(await page.getByRole('dialog').count(),0,'No permanent confirmation');
  const update=page.getByRole('button',{name:'↑ 생텀 DB에 업데이트',exact:true});
  await update.click();await page.getByRole('dialog').waitFor();assert.equal(posts,0);
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await update.evaluate(e=>e===document.activeElement),true);
  await update.click();await page.getByRole('button',{name:'아니요, 다른 캐릭터',exact:true}).click();await page.getByRole('heading',{name:'업데이트할 캐릭터 선택',exact:true}).waitFor();assert.equal(posts,0);
  await page.getByRole('button',{name:'취소',exact:true}).click();
  await update.click();
  await page.evaluate(()=>window.fixtureScore=91);
  await page.getByRole('button',{name:'네, 업데이트',exact:true}).click();await page.getByText('게임 정보가 바뀌었어요. 업데이트를 눌러 캐릭터를 다시 확인해 주세요.',{exact:true}).waitFor();assert.equal(posts,0);
  await update.click();await page.getByRole('button',{name:'네, 업데이트',exact:true}).click();
  await page.getByText('화연 인게임 정보를 생텀에 업데이트했어요.',{exact:true}).waitFor();
  assert.equal(posts,1);assert.deepEqual(stats,{combat_power:'91',life_energy:'0',magic_resistance:'40',charm:'30'});
  assert.equal(await update.isDisabled(),true);
  const before=reads;await page.waitForTimeout(2100);assert.equal(reads,before,'Game watcher does not poll the DB catalog');
  await page.getByRole('button',{name:'스탯 재조회',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0,'Refresh clears confirmation');
  await page.getByRole('button',{name:'재화',exact:true}).click();await page.getByText('12,345,678,901',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.fixtureCurrencyReads),1);assert.equal(posts,1);
  await page.getByRole('button',{name:'재화',exact:true}).click();assert.equal(await page.evaluate(()=>window.fixtureCurrencyReads),1,'Same tab does not reread');
  await page.getByRole('button',{name:'설정',exact:true}).click();assert.equal(await page.getByRole('navigation',{name:'크로노스 기능',exact:true}).isVisible(),false);
  await page.getByRole('button',{name:'크로노스',exact:true}).click();assert.equal(await page.getByRole('button',{name:'재화',exact:true}).getAttribute('aria-pressed'),'true','Returning to Kronos restores its last selected subtab');
  await page.waitForFunction(()=>window.fixtureCurrencyReads===2);
  await page.setViewportSize({width:390,height:420});
  await page.evaluate(()=>document.querySelector('#iris-pane-currencies').style.minHeight='1100px');
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  const sticky=await page.locator('.iris-context-header').boundingBox();assert.ok(sticky&&sticky.y>=-1&&sticky.y+sticky.height<420,'Selected character feedback remains visible while scrolling');
  assert.match(await page.locator('.iris-selected-identity').innerText(),/생텀 선택[\s\S]*화연/);
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();await page.getByRole('region',{name:'내 캐릭터',exact:true}).waitFor();
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'캐릭터 선택',exact:true}).getAttribute('aria-expanded'),'false');
  await page.evaluate(()=>{document.querySelector('#iris-pane-currencies').style.minHeight='';window.scrollTo(0,0);});
  await page.setViewportSize({width:390,height:900});
  await page.getByRole('button',{name:'클래스',exact:true}).click();await page.getByRole('button',{name:'전사',exact:true}).click();
  assert.equal(await page.locator('.iris-class-list').evaluate(e=>e.scrollHeight>e.clientHeight),false,'Four-row filtered list has no internal scroll');
  await page.getByRole('button',{name:'전체',exact:true}).click();assert.equal(await page.locator('.iris-class-list').evaluate(e=>e.scrollHeight>e.clientHeight),true,'All classes retain internal scroll');
  for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}`);}
  await page.getByRole('textbox',{name:'전사 레벨',exact:true}).fill('x');
  const priorReads=kronosReads;await page.getByRole('button',{name:'숙제',exact:true}).click();
  await page.waitForTimeout(300);assert.equal(kronosReads,priorReads+1,'Homework tab refreshes once');
  await page.getByRole('button',{name:'숙제',exact:true}).click();await page.waitForTimeout(100);assert.equal(kronosReads,priorReads+1,'Same homework tab does not refresh');
  await page.getByRole('button',{name:'클래스',exact:true}).click();
  await page.waitForTimeout(300);assert.equal(await page.getByRole('textbox',{name:'전사 레벨',exact:true}).inputValue(),'x','Refresh preserves invalid unsaved draft');assert.equal(posts,1);
  slowStats=true;await page.reload();
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();await page.getByRole('button',{name:'화연 힐러',exact:true}).click();
  await page.getByRole('button',{name:'클래스',exact:true}).click();await page.getByRole('button',{name:'전사',exact:true}).click();
  await page.waitForTimeout(4300);
  assert.equal(await page.getByRole('textbox',{name:'전사 레벨',exact:true}).isDisabled(),false,'Background stats load must not lock class editing');
  await page.waitForTimeout(2200);assert.equal(await page.getByRole('button',{name:'네, 선택',exact:true}).count(),0,'Late suggestion must not override manual selection');
  assert.deepEqual(errors,[]);console.log(`Stats synthetic DOM PASS: manual confirmation, changed snapshot, 0/decrease/missing, one POST, no catalog polling, reset, four widths (${reads} GETs)`);
}catch(error){console.log(await page.locator('body').innerText());throw error;}finally{await browser.close();}
