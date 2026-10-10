// Real DesktopPage/controller flow with synthetic API and native IO only.
// Run with: node tests/iris-character-switch.browser.mjs <bundled Node package.json>
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const {chromium}=createRequire(process.argv[2])('playwright');
const target=new URL(process.env.IRIS_TEST_URL??'http://localhost:3001/iris/desktop');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(target.hostname)&&target.port&&target.port!=='3000',
  'Use an isolated loopback preview, never the live localhost:3000 server');
assert.equal(target.pathname,'/iris/desktop');
const browser=await chromium.launch({channel:'msedge',headless:true});
const period='2026-10-07T21:00:00.000Z';
const characters=[{id:'7',nickname:'화연',job:'힐러',alias:null},{id:'8',nickname:'순월',job:'검술사',alias:null},{id:'9',nickname:'젼설',job:'석궁사수',alias:null}];
const savedRows=[
  {id:'7',nickname:'화연',job:'힐러',stats:{combat_power:'10000',life_energy:'2000',magic_resistance:'1000',charm:'3000'}},
  {id:'8',nickname:'순월',job:'검술사',stats:{combat_power:'20000',life_energy:'4000',magic_resistance:'2000',charm:'6000'}},
  {id:'9',nickname:'젼설',job:'석궁사수',stats:{combat_power:'30000',life_energy:'4000',magic_resistance:'4500',charm:'7000'}},
];
const scenario=process.env.IRIS_SWITCH_SCENARIO;
let passes=0;

async function fixture({rows=savedRows,catalog=characters}={}){
  const context=await browser.newContext({viewport:{width:390,height:900}});
  const page=await context.newPage(),errors=[],requests={statsPosts:0,statsReads:0,classPosts:[],kronosPosts:[],kronosReads:[],total:0};
  let account={id:'a',nickname:'owner',role:'길드원'};
  let logoutWait=null,releaseLogout=null,logoutStarted=false;
  let heldDetailsId=null,detailsWait=null,releaseDetails=null,detailsStarted=false;
  page.setDefaultTimeout(8000);
  page.on('pageerror',error=>errors.push(error.message));
  // Remote resources cannot reach accounts or production systems from this fixture.
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===target.origin)await route.continue();else await route.abort('blockedbyclient');
  });
  await page.route('**/api/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    requests.total++;
    assert.ok(requests.total<150,'API requests must remain bounded');
    let body={};
    const ownedCharacters=account?.id==='b'?catalog.map(c=>({...c,id:String(Number(c.id)+10)})):catalog;
    const ownedStats=account?.id==='b'?rows.map(c=>({...c,id:String(Number(c.id)+10)})):rows;
    if(url.pathname==='/api/auth/session')body={account};
    else if(url.pathname==='/api/auth/login'){account={id:'b',nickname:'other',role:'길드원'};body={account};}
    else if(url.pathname==='/api/auth/logout'){logoutStarted=true;if(logoutWait)await logoutWait;account=null;body={ok:true};}
    else if(url.pathname==='/api/iris/characters')body={accountId:account.id,characters:ownedCharacters};
    else if(url.pathname==='/api/iris/stats'){
      if(request.method()==='POST'){requests.statsPosts++;body={error:'Unexpected stats write'};}
      else {requests.statsReads++;body={accountId:account.id,characters:ownedStats};}
    }else if(url.pathname==='/api/iris/kronos'){
      if(request.method()==='POST'){
        const {edit}=request.postDataJSON();requests.kronosPosts.push(edit);
        body={result:{requestId:edit.requestId,status:'saved',completed:edit.desiredCompleted}};
      }else{
        const id=url.searchParams.get('characterId');
        assert.ok(ownedCharacters.some(c=>c.id===id),'Only this account fixture characters are readable');
        requests.kronosReads.push(id);
        if(id===heldDetailsId){detailsStarted=true;await detailsWait;}
        const level=id==='7'?11:id==='8'?22:33;
        body={accountId:account.id,characterId:id,observedAt:new Date().toISOString(),
          writeContext:{periodKeys:{daily:period,weekly:period,abyss:period,raid:period},
            classes:[{classId:'warrior',editable:true,baseLevel:level}]},
          details:{schemaVersion:1,tasks:{daily:[{id:'mission',name:'일일 미션',completed:0,total:1}],weekly:[],abyss:[],raid:[]},
            classes:[{id:'warrior',name:'전사',level}]}};
      }
    }else if(url.pathname==='/api/iris/classes'){
      const {edit}=request.postDataJSON();requests.classPosts.push(edit);
      body={result:{requestId:edit.requestId,status:'saved',level:edit.desiredLevel}};
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  assert.ok(page.clock&&typeof page.clock.install==='function','Playwright Clock is required');
  await page.clock.install({time:new Date('2026-10-08T03:00:00.000Z')});
  await page.addInitScript(()=>{
    const listeners=new Set(),held=[];
    let lastTimestamp=0;
    window.fixture={character:'7',reads:0,settled:0,failNext:0,holdNext:0,stamp:null,stale:false,hidden:false,queue:null};
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.fixture.hidden?'hidden':'visible'});
    window.__irisDesktopBridge={epoch:1,environment:'development'};
    window.fixtureReleaseGame=()=>{for(const reply of held.splice(0))reply();};
    window.chrome={webview:{
      addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),
      postMessage:message=>{
        const f=window.fixture;
        let value=null,ok=true;
        if(message.method==='store.capabilities')value={schemaVersion:3,barter:true};
        if(message.method==='store.replace')f.queue=JSON.parse(JSON.stringify(message.payload));
        if(message.method==='store.load')value=f.queue;
        if(message.method.startsWith('overlay.'))value={clickThrough:false,shortcutsAvailable:true,opacityPercent:100};
        if(message.method==='game.stats.read'){
          f.reads++;
          if(f.failNext>0){f.failNext--;ok=false;}
          const stamp=f.stamp??new Date(f.stale?Date.now()-61000:Math.max(Date.now(),lastTimestamp+1)).toISOString();
          lastTimestamp=Date.parse(stamp);
          value=f.character==='7'?{observedAt:stamp,job:'힐러',level:100,
            stats:{combat_power:10000,life_energy:2000,magic_resistance:1000,charm:3000}}:f.character==='9'?{observedAt:stamp,job:'석궁사수',level:100,
              stats:{combat_power:30000,life_energy:4000,magic_resistance:4500,charm:7000}}:
            {observedAt:stamp,job:'검술사',level:100,
              stats:{combat_power:20000,life_energy:4000,magic_resistance:2000,charm:6000}};
        }
        const reply=()=>queueMicrotask(()=>{
          for(const fn of listeners)fn({data:{version:1,id:message.id,epoch:1,ok,value}});
          if(message.method==='game.stats.read')f.settled++;
        });
        if(message.method==='game.stats.read'&&f.holdNext>0){f.holdNext--;held.push(reply);}else reply();
      },
    }};
  });
  await page.goto(target.href,{timeout:45000}); // First isolated dev compile can exceed action timeouts.
  await page.getByRole('button',{name:'네, 선택',exact:true}).click();
  await identity(page,'화연');
  await page.waitForFunction(()=>window.fixture.reads>=2&&window.fixture.settled===window.fixture.reads);
  await delay(120);
  // Freeze only after hydration, session IO and the selected-character baseline.
  const now=await page.evaluate(()=>Date.now());
  await page.clock.pauseAt(now+10);
  // Establish the watch baseline on the frozen clock, not at an arbitrary
  // hydration phase of its cadence. Re-selecting is a real user intent.
  const beforeBaseline=await page.evaluate(()=>window.fixture.reads);
  await choose(page,'화연','힐러');
  await page.waitForFunction(before=>window.fixture.reads>before&&window.fixture.settled===window.fixture.reads,beforeBaseline);
  await delay(80);
  assert.equal(await prompt(page).count(),0,'Initial baseline must never offer an immediate switch');
  return {page,context,errors,requests,
    holdLogout(){logoutWait=new Promise(resolve=>releaseLogout=resolve);},
    async waitForLogout(){for(let i=0;i<80&&!logoutStarted;i++)await delay(25);assert.equal(logoutStarted,true);},
    releaseLogout(){releaseLogout?.();},
    holdDetails(id){heldDetailsId=id;detailsWait=new Promise(resolve=>releaseDetails=resolve);},
    async waitForDetails(){for(let i=0;i<80&&!detailsStarted;i++)await delay(25);assert.equal(detailsStarted,true);},
    releaseDetails(){heldDetailsId=null;releaseDetails?.();}};
}

const prompt=page=>page.getByRole('dialog',{name:'캐릭터 변경 추천',exact:true});
async function identity(page,name){
  await page.locator('.iris-selected-identity strong').filter({hasText:name}).waitFor();
  assert.equal(await page.locator('.iris-selected-identity strong').innerText(),name);
}
async function setGame(page,character,changes={}){
  await page.evaluate(({character,changes})=>Object.assign(window.fixture,{character},changes),{character,changes});
}
async function poll(page,{held=false,advance=3000}={}){
  const before=await page.evaluate(()=>window.fixture.reads);
  await page.clock.runFor(advance);
  await page.waitForFunction(before=>window.fixture.reads>before,before);
  if(!held)await page.waitForFunction(()=>window.fixture.settled===window.fixture.reads);
  await delay(80);
  assert.equal(await page.evaluate(()=>window.fixture.reads),before+1,'One native read per scheduled observation');
}
async function offer(page){
  await setGame(page,'8');
  await poll(page);
  assert.equal(await prompt(page).count(),0,'One changed observation must not offer a switch');
  await poll(page,{advance:1000});
  await prompt(page).waitFor();
  assert.match(await prompt(page).innerText(),/순월/);
  for(const name of ['네','아니요','다른 캐릭터'])assert.equal(await prompt(page).getByRole('button',{name,exact:true}).count(),1);
  await identity(page,'화연');
}
async function choose(page,name,job){
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.getByRole('region',{name:'내 캐릭터',exact:true}).getByRole('button',{name:new RegExp(`^${name} ${job}(?: · 미저장 변경)?$`)}).click();
  await identity(page,name);
}
async function run(name,body,options){
  if(scenario&&scenario!==name)return;
  const f=await fixture(options);
  try{
    await body(f);
    assert.equal(f.requests.statsPosts,0,'Character recommendation never writes stats');
    assert.deepEqual(f.errors,[],'The real desktop flow must have no page errors');
    passes++;console.log(`PASS ${name}`);
  }catch(error){
    console.error(`FAIL ${name}: ${error.message}`);
    console.error({native:await f.page.evaluate(()=>window.fixture),requests:f.requests});
    console.error(await f.page.locator('body').innerText());
    throw error;
  }finally{await f.context.close();}
}

try{
  await run('stale-stat-offer-confirm-local-only',async({page,requests})=>{
    const remote=requests.statsReads,kronos=requests.kronosReads.length;
    await offer(page);
    assert.equal(requests.statsReads,remote,'Tolerant matching reuses the existing catalog');
    assert.equal(requests.kronosReads.length,kronos,'A suggestion alone does not refresh homework');
    const before=await page.evaluate(()=>window.fixture.reads);
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();
    await identity(page,'순월');
    assert.ok(await page.evaluate(()=>window.fixture.reads)>before,'Yes must re-read fresh game stats');
    assert.equal(requests.statsReads,remote);
    assert.equal(requests.kronosPosts.length,0);
    assert.equal(requests.classPosts.length,0);
  },{rows:savedRows.map(row=>row.id==='8'?{...row,stats:{...row.stats,magic_resistance:'0'}}:row)});
  await run('stale-stat-confirm-rechecks-candidate',async({page})=>{
    await offer(page);
    await setGame(page,'9');
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();
    await delay(100);
    await identity(page,'화연');
  },{rows:savedRows.map(row=>row.id==='8'?{...row,stats:{...row.stats,magic_resistance:'0'}}:row)});
  await run('stale-stat-ambiguous-rival-no-offer',async({page,requests})=>{
    const remote=requests.statsReads;
    await setGame(page,'8');
    for(let i=0;i<3;i++)await poll(page);
    assert.equal(await prompt(page).count(),0,'Three matching stats in a rival must prevent an exact candidate from winning');
    await identity(page,'화연');
    assert.equal(requests.statsReads,remote);
  },{rows:[...savedRows,{...savedRows[1],id:'10',nickname:'경쟁 후보',stats:{...savedRows[1].stats,magic_resistance:'0'}}],
    catalog:[...characters,{id:'10',nickname:'경쟁 후보',job:'검술사',alias:null}]});
  // A retained 10s cadence, unconditional 1s loop, or catalog fetch in each
  // poll breaks the intended latency/remote-load contract.
  await run('fast-local-only-cadence',async({page,requests})=>{
    const before=await page.evaluate(()=>window.fixture.reads),remote=requests.statsReads,kronos=requests.kronosReads.length;
    await page.clock.runFor(2900);await delay(50);
    assert.equal(await page.evaluate(()=>window.fixture.reads),before,'Unchanged game is not polled every second');
    await poll(page,{advance:100});
    await setGame(page,'8');await poll(page);
    assert.equal(await prompt(page).count(),0,'The first change remains unconfirmed');
    await page.clock.runFor(900);await delay(50);
    assert.equal(await prompt(page).count(),0);
    await poll(page,{advance:100});await prompt(page).waitFor();
    await identity(page,'화연');
    assert.equal(requests.statsReads,remote,'Fast native checks do not fetch the DB catalog');
    assert.equal(requests.kronosReads.length,kronos,'Fast native checks do not refresh Vercel homework');
    await poll(page);assert.equal(requests.statsReads,remote);
  });
  await run('slow-read-does-not-queue-polls',async({page,requests})=>{
    await setGame(page,'8',{holdNext:1});await poll(page,{held:true});
    const before=await page.evaluate(()=>window.fixture.reads),remote=requests.statsReads;
    await page.clock.runFor(9000);await delay(50);
    assert.equal(await page.evaluate(()=>window.fixture.reads),before,'Slow CLI has no overlapping or queued polling calls');
    await page.evaluate(()=>window.fixtureReleaseGame());await delay(80);
    assert.equal(await prompt(page).count(),0);
    await poll(page,{advance:1000});await prompt(page).waitFor();
    assert.equal(requests.statsReads,remote);
  });
  await run('duplicate-quick-probe-returns-to-normal-cadence',async({page})=>{
    const stamp=await page.evaluate(()=>new Date(Date.now()+3000).toISOString());
    await setGame(page,'8',{stamp});await poll(page);await poll(page,{advance:1000});
    assert.equal(await prompt(page).count(),0,'A cached timestamp is not fresh confirming evidence');
    const before=await page.evaluate(()=>window.fixture.reads);
    await page.clock.runFor(900);
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await page.clock.runFor(2000);await delay(50);
    assert.equal(await page.evaluate(()=>window.fixture.reads),before,'Cached evidence and focus must not create a continuing 1-second loop');
    await poll(page,{advance:100});assert.equal(await prompt(page).count(),0);
  });
  // This is the first RED target against the pre-feature isolated preview:
  // a missing watcher yields no inline recommendation after two fresh observations.
  await run('two-fresh-offers',async({page})=>{
    await offer(page);
  });
  await run('next-switch-before-remounted-baseline',async f=>{
    const {page,requests}=f;
    await offer(page);
    const catalogReads=requests.statsReads;
    f.holdDetails('8');
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();
    await f.waitForDetails();
    // The user enters the third character before the new selected watcher
    // mounts. Its first fresh read must compare against the confirmed second.
    await setGame(page,'9');
    const before=await page.evaluate(()=>window.fixture.reads);
    f.releaseDetails();await identity(page,'순월');
    await page.waitForFunction(before=>window.fixture.reads>before&&window.fixture.settled===window.fixture.reads,before);
    await delay(80);
    assert.equal(await prompt(page).count(),0,'One new observation is insufficient');
    await poll(page,{advance:3000});await prompt(page).waitFor();
    assert.match(await prompt(page).innerText(),/젼설/);
    await identity(page,'순월');
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();
    await identity(page,'젼설');
    assert.equal(requests.statsReads,catalogReads,'Retaining observations does not reload the DB catalog');
    assert.equal(requests.kronosPosts.length,0,'Recommendations do not save homework');
    assert.equal(requests.classPosts.length,0,'Recommendations do not save classes');
  });
  await run('new-account-does-not-inherit-game-observation',async({page})=>{
    await offer(page);
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();
    await identity(page,'순월');await delay(80);
    await page.getByRole('button',{name:'설정',exact:true}).click();
    await page.getByRole('button',{name:'로그아웃',exact:true}).click();
    await page.getByRole('button',{name:'로그인',exact:true}).waitFor();
    // Force the new account's initial game probe to fail: only a wrongly
    // retained prior-account observation could seed its selected watcher.
    await setGame(page,'9',{failNext:1});
    await page.getByRole('textbox',{name:'대표 캐릭터 닉네임',exact:true}).fill('other');
    await page.getByLabel('접속 코드',{exact:true}).fill('synthetic-no-access-code');
    await page.getByRole('button',{name:'로그인',exact:true}).click();
    await page.getByRole('button',{name:'캐릭터 선택',exact:true}).waitFor();
    await page.waitForFunction(()=>window.fixture.failNext===0&&window.fixture.reads===window.fixture.settled);
    await choose(page,'화연','힐러');
    await page.waitForFunction(()=>window.fixture.reads===window.fixture.settled);await delay(80);
    await poll(page);await poll(page);
    assert.equal(await prompt(page).count(),0,'Another account must start with its own baseline');
    await identity(page,'화연');
  });
  // Removing the two-observation gate, bypassing the real select controller, or
  // reassigning old drafts/queue entries makes this real UI scenario fail.
  await run('confirm-and-preserve-scope',async({page,requests})=>{
    await page.getByRole('button',{name:'클래스',exact:true}).click();
    await page.getByRole('textbox',{name:'전사 레벨',exact:true}).waitFor();
    await page.getByRole('textbox',{name:'전사 레벨',exact:true}).fill('23');
    await page.waitForFunction(()=>window.fixture.queue?.entries.length===1);
    assert.deepEqual(await page.evaluate(()=>window.fixture.queue.entries.map(e=>({accountId:e.accountId,characterId:e.characterId,kind:e.kind,desiredLevel:e.desiredLevel}))),
      [{accountId:'a',characterId:'7',kind:'class',desiredLevel:23}]);
    await offer(page);
    const reads=await page.evaluate(()=>window.fixture.reads);
    await setGame(page,'8',{holdNext:1});
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();
    await page.waitForFunction(reads=>window.fixture.reads===reads+1,reads);
    await identity(page,'화연');
    assert.equal(await page.evaluate(()=>window.fixture.reads),reads+1,'Yes must re-read before selecting the new character');
    await page.evaluate(()=>window.fixtureReleaseGame());
    await identity(page,'순월');
    assert.equal(await prompt(page).count(),0);
    assert.equal(await page.getByRole('textbox',{name:'전사 레벨',exact:true}).inputValue(),'22','The new character must show its own draft/base level');
    assert.deepEqual(await page.evaluate(()=>window.fixture.queue.entries.map(e=>e.characterId)),['7'],'Old pending change retains its owner');
    await choose(page,'화연','힐러');
    assert.equal(await page.getByRole('textbox',{name:'전사 레벨',exact:true}).inputValue(),'23','Returning to the old character restores its draft');
    assert.equal(requests.classPosts.length,0,'Selection does not auto-submit pending edits');
  });

  // Counting the same cached observation twice would make the second assertion fail.
  await run('distinct-observations',async({page})=>{
    const stamp=await page.evaluate(()=>new Date(Date.now()+3000).toISOString());
    await setGame(page,'8',{stamp});
    await poll(page);assert.equal(await prompt(page).count(),0);
    await poll(page);assert.equal(await prompt(page).count(),0,'Repeated observedAt cannot confirm the candidate');
    await setGame(page,'8',{stamp:null});
    await poll(page);await prompt(page).waitFor();
    await identity(page,'화연');
  });

  // Dropping the dismissed candidate or changing selection on No is a regression.
  await run('no-suppresses-same-candidate',async({page})=>{
    await offer(page);
    await prompt(page).getByRole('button',{name:'아니요',exact:true}).click();
    for(let i=0;i<3;i++){await poll(page);assert.equal(await prompt(page).count(),0,'Declined same candidate stays quiet');}
    await identity(page,'화연');
    await setGame(page,'7');await poll(page);
    await setGame(page,'8');await poll(page);assert.equal(await prompt(page).count(),0);
    await poll(page);await prompt(page).waitFor();
  });

  // An independent alternate list would miss the actual Center picker contract.
  await run('other-opens-existing-picker',async({page})=>{
    await offer(page);
    await prompt(page).getByRole('button',{name:'다른 캐릭터',exact:true}).click();
    assert.equal(await prompt(page).count(),0);
    await page.getByRole('region',{name:'내 캐릭터',exact:true}).waitFor();
    await identity(page,'화연');
    await page.getByRole('region',{name:'내 캐릭터',exact:true}).getByRole('button',{name:'순월 검술사',exact:true}).click();
    await identity(page,'순월');
    assert.equal(await page.getByRole('region',{name:'내 캐릭터',exact:true}).isVisible(),false);
  });

  // Accepting a stale recommendation without checking a new snapshot would select 8.
  await run('yes-rechecks-changed-game',async({page})=>{
    await offer(page);await setGame(page,'7');
    const before=await page.evaluate(()=>window.fixture.reads);
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();
    await page.waitForFunction(before=>window.fixture.settled>before,before);await delay(100);
    await identity(page,'화연');
    assert.equal(await prompt(page).getByRole('button',{name:'네',exact:true}).count(),0,'Changed-game feedback cannot retain an actionable old candidate');
    assert.equal(await page.evaluate(()=>window.fixture.reads),before+1);
  });

  // An overflowing recommendation or clipped action would block a mobile user.
  await run('prompt-responsive-layout',async({page})=>{
    if(process.env.IRIS_SWITCH_SCREENSHOT){
      await page.getByRole('button',{name:'설정',exact:true}).click();
      await page.getByRole('button',{name:'Vesper',exact:true}).click();
      await page.getByRole('button',{name:'이전 화면',exact:true}).click();
    }
    await offer(page);
    for(const width of [320,390,768,1280]){
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`No horizontal overflow at ${width}`);
      const bounds=await prompt(page).boundingBox();
      assert.ok(bounds&&bounds.x>=-1&&bounds.x+bounds.width<=width+1,`Recommendation remains inside ${width}px`);
      for(const name of ['네','아니요','다른 캐릭터']){
        const button=prompt(page).getByRole('button',{name,exact:true}),box=await button.boundingBox();
        assert.ok(box&&box.width>0&&box.x>=-1&&box.x+box.width<=width+1,`${name} is fully usable at ${width}px`);
        assert.equal(await button.evaluate(element=>element.scrollWidth>element.clientWidth),false,`${name} text is not clipped at ${width}px`);
      }
    }
    await page.setViewportSize({width:390,height:900});
    if(process.env.IRIS_SWITCH_SCREENSHOT)await page.screenshot({path:process.env.IRIS_SWITCH_SCREENSHOT,fullPage:true});
    await page.keyboard.press('Escape');assert.equal(await prompt(page).count(),0,'Escape dismisses the temporary recommendation');
    if(process.env.IRIS_SWITCH_SCREENSHOT){
      await page.getByRole('button',{name:'설정',exact:true}).click();
      await page.getByRole('button',{name:'루멘',exact:true}).click();
      await page.getByRole('button',{name:'크로노스',exact:true}).click();
      await setGame(page,'7');await poll(page);
      await offer(page);
      await page.screenshot({path:process.env.IRIS_SWITCH_SCREENSHOT.replace(/\.png$/i,'-light.png'),fullPage:true});
      await page.keyboard.press('Escape');assert.equal(await prompt(page).count(),0);
    }
  });

  // Preserving the streak through a failed IO read would prompt one interval early.
  await run('failed-read-resets-streak',async({page})=>{
    await setGame(page,'8');await poll(page);assert.equal(await prompt(page).count(),0);
    await setGame(page,'8',{failNext:1});await poll(page,{advance:1000});assert.equal(await prompt(page).count(),0);
    await poll(page);assert.equal(await prompt(page).count(),0,'A failed read resets the previous evidence');
    await poll(page,{advance:1000});await prompt(page).waitFor();
  });

  // Treating stale values as new evidence would display a switch despite no fresh read.
  await run('stale-read-does-not-recommend',async({page})=>{
    await setGame(page,'8',{stale:true});
    await poll(page);await poll(page);assert.equal(await prompt(page).count(),0);
    await setGame(page,'8',{stale:false});
    await poll(page);assert.equal(await prompt(page).count(),0);
    await poll(page,{advance:1000});await prompt(page).waitFor();
  });

  // Leaving background polling active during close/hidden states adds native reads.
  await run('closing-and-hidden-stop-polling',async({page})=>{
    await page.getByRole('button',{name:'IRIS 종료',exact:true}).click();
    await page.getByRole('dialog').waitFor();
    let before=await page.evaluate(()=>window.fixture.reads);
    await page.clock.runFor(21000);await delay(80);
    assert.equal(await page.evaluate(()=>window.fixture.reads),before,'Closing suspends the watcher');
    await page.getByRole('button',{name:'돌아가기',exact:true}).click();
    await delay(80);
    await page.waitForFunction(()=>window.fixture.reads===window.fixture.settled);
    await page.evaluate(()=>{window.fixture.hidden=true;document.dispatchEvent(new Event('visibilitychange'));});
    before=await page.evaluate(()=>window.fixture.reads);
    await page.clock.runFor(21000);await delay(80);
    assert.equal(await page.evaluate(()=>window.fixture.reads),before,'Hidden page suspends the watcher');
    await page.evaluate(()=>{window.fixture.hidden=false;document.dispatchEvent(new Event('visibilitychange'));});
    await page.clock.runFor(10000);
    await page.waitForFunction(before=>window.fixture.reads>before,before);
    assert.equal(await prompt(page).count(),0,'Resume takes a fresh baseline');
  });

  // The controller publishes a real lock while an account operation is in flight.
  // Failing to observe it would issue a watcher read during the pending logout.
  await run('locked-account-operation-stops-polling',async f=>{
    const {page}=f;
    f.holdLogout();
    await page.getByRole('button',{name:'설정',exact:true}).click();
    await page.getByRole('button',{name:'로그아웃',exact:true}).click();
    await f.waitForLogout();
    const before=await page.evaluate(()=>window.fixture.reads);
    await page.clock.runFor(11000);await delay(80);
    assert.equal(await page.evaluate(()=>window.fixture.reads),before,'A locked controller suspends watcher reads');
    f.releaseLogout();await page.getByRole('button',{name:'로그인',exact:true}).waitFor();
    assert.equal(await prompt(page).count(),0);
  });

  // Publishing a captured response after manual selection would revive an old offer.
  await run('manual-selection-cancels-old-read',async({page})=>{
    await setGame(page,'8');await poll(page);
    await setGame(page,'8',{holdNext:1});await poll(page,{held:true});
    await choose(page,'순월','검술사');
    await page.evaluate(()=>window.fixtureReleaseGame());await delay(120);
    await identity(page,'순월');assert.equal(await prompt(page).count(),0);
  });

  // Manual intent must cancel an accepted recommendation before the controller's
  // own details GET resolves; comparing only the rendered character ID is too late.
  await run('manual-intent-cancels-pending-yes',async f=>{
    const {page,requests}=f;
    await offer(page);
    await setGame(page,'8',{holdNext:1});
    const before=await page.evaluate(()=>window.fixture.reads);
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();
    await page.waitForFunction(before=>window.fixture.reads===before+1,before);
    f.holdDetails('7');
    await choose(page,'화연','힐러');await f.waitForDetails();
    const reads=requests.kronosReads.length;
    await page.evaluate(()=>window.fixtureReleaseGame());await delay(120);
    await identity(page,'화연');
    assert.equal(requests.kronosReads.length,reads,'Late Yes must not initiate a new candidate selection');
    f.releaseDetails();await delay(120);
    await identity(page,'화연');assert.equal(await prompt(page).count(),0);
  });

  // Close and cancel is still a new interaction generation: a prior accepted
  // recommendation cannot switch the character after returning to the Center.
  await run('close-cancel-cancels-pending-yes',async({page})=>{
    await offer(page);await setGame(page,'8',{holdNext:1});
    const before=await page.evaluate(()=>window.fixture.reads);
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();
    await page.waitForFunction(before=>window.fixture.reads===before+1,before);
    await page.getByRole('button',{name:'IRIS 종료',exact:true}).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button',{name:'돌아가기',exact:true}).click();
    await page.evaluate(()=>window.fixtureReleaseGame());await delay(120);
    await identity(page,'화연');assert.equal(await prompt(page).count(),0);
  });

  // A pre-hidden second observation is obsolete after becoming visible again.
  // Only two newly read observations may reconstruct evidence for the same candidate.
  await run('hidden-visible-discards-pending-observation',async({page})=>{
    await setGame(page,'8');await poll(page);
    await setGame(page,'8',{holdNext:1});await poll(page,{held:true});
    await page.evaluate(()=>{window.fixture.hidden=true;document.dispatchEvent(new Event('visibilitychange'));});
    await page.evaluate(()=>{window.fixture.hidden=false;document.dispatchEvent(new Event('visibilitychange'));});
    await page.evaluate(()=>window.fixtureReleaseGame());await delay(120);
    assert.equal(await prompt(page).count(),0,'An obsolete pre-hidden result is discarded');
    await poll(page);assert.equal(await prompt(page).count(),0,'One newly read observation is insufficient after resume');
    await poll(page);await prompt(page).waitFor();
    await identity(page,'화연');
  });

  // A response from the prior account must never survive account logout.
  await run('logout-cancels-old-read',async({page})=>{
    await setGame(page,'8');await poll(page);
    await setGame(page,'8',{holdNext:1});await poll(page,{held:true});
    await page.getByRole('button',{name:'설정',exact:true}).click();
    await page.getByRole('button',{name:'로그아웃',exact:true}).click();
    await page.getByRole('button',{name:'로그인',exact:true}).waitFor();
    await page.evaluate(()=>window.fixtureReleaseGame());await delay(120);
    assert.equal(await prompt(page).count(),0);
    assert.equal(await page.locator('.iris-selected-identity').count(),0);
    const before=await page.evaluate(()=>window.fixture.reads);
    await page.clock.runFor(21000);assert.equal(await page.evaluate(()=>window.fixture.reads),before);
  });
  assert.ok(passes>0,'IRIS_SWITCH_SCENARIO must select an existing scenario');
  console.log(`Character switch synthetic DOM: ${passes} scenarios passed; real JSX/controller, no live account/DB/game IO`);
}finally{await browser.close();}
