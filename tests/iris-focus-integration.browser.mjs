// Actual DesktopPage: synthetic accounts/native only, isolated preview required.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.argv[2])('playwright');
const target=new URL(process.env.IRIS_TEST_URL??'http://127.0.0.1:3001/iris/desktop');
assert.ok(['127.0.0.1','localhost'].includes(target.hostname)&&target.port!=='3000'&&target.port);
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:1400}}),page=await context.newPage();
const errors=[],writes=[];
page.setDefaultTimeout(8000);
page.on('pageerror',e=>errors.push(e.message));
const names=['전사','대검전사','검술사','기사','마법사','화염술사','빙결술사','전격술사','궁수','장궁병','석궁사수','음유시인','댄서','악사','힐러','사제','수도사','암흑술사','도적','격투가','듀얼블레이드'];
let account={id:'a',nickname:'가나다라마바사아자차카타',role:'길드원'};
let barterCount=0,barterBuyer=null,barterHash='b'.repeat(64);
const barterPosts=[];
const period='2026-10-07T21:00:00.000Z';
await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==target.origin){await route.abort();return;}
  if(!url.pathname.startsWith('/api/')){await route.continue();return;}
  let result={},status=200;
  if(url.pathname==='/api/auth/session')result={account};
  else if(url.pathname==='/api/auth/switch'){account={id:'b',nickname:'다른계정',role:'길드원'};result={account};}
  else if(url.pathname==='/api/auth/logout'){account=null;result={ok:true};}
  else if(url.pathname==='/api/iris/characters')result={accountId:account.id,characters:[{id:'A',nickname:account.nickname,job:'힐러',alias:null},{id:'B',nickname:'젼설',job:'석궁사수',alias:null}]};
  else if(url.pathname==='/api/iris/stats')result={accountId:account.id,characters:[]};
  else if(url.pathname==='/api/iris/kronos'){
    if(req.method()==='POST'){writes.push(req.postDataJSON());status=500;result={error:'unexpected save'};}
    else result={accountId:account.id,characterId:url.searchParams.get('characterId'),observedAt:'2026-10-09T01:00:00.000Z',
      writeContext:{periodKeys:{daily:period,weekly:period,abyss:period,raid:period},classes:names.map((_,i)=>({classId:String(i+1),editable:true,baseLevel:53})),barter:[{tradeId:'1',scope:'account',periodKey:period,catalogKey:'a'.repeat(64),baseRecords:['A','B'].map(characterId=>({characterId,recordKey:barterHash}))}]},
      details:{schemaVersion:1,tasks:{daily:[],weekly:[],abyss:[],raid:[]},classes:names.map((name,i)=>({id:String(i+1),name,level:53})),barter:[{id:'1',map:'티르코네일',npc:'데이안',reward:'우유',rewardCount:2,cost:'양털',costCount:5,total:3,resetType:'주간',scope:'account',completed:barterCount,completedBy:barterBuyer,periodKey:period,consistent:true}]}};
  }else if(url.pathname==='/api/iris/barter'&&req.method()==='POST'){
    const {edit}=req.postDataJSON();barterPosts.push(edit);barterCount=edit.desiredCompleted;barterHash='c'.repeat(64);barterBuyer=barterCount?(edit.characterId==='B'?'젼설':account.nickname):null;
    result={result:{requestId:edit.requestId,status:'saved',completed:barterCount,completedBy:barterBuyer,baseRecords:['A','B'].map(characterId=>({characterId,recordKey:barterHash}))}};
  }else if(req.method()==='POST'){writes.push({path:url.pathname});status=500;result={error:'Unexpected write'};}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
});
await page.addInitScript(()=>{
  localStorage.setItem('iris_desktop_accounts:v1',JSON.stringify([{id:'a',nickname:'가나다라마바사아자차카타',role:'길드원'},{id:'b',nickname:'다른계정',role:'길드원'}]));
  const listeners=new Set();let queue=null;
  window.__irisDesktopBridge={epoch:1,environment:'development'};
  window.chrome={webview:{addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f),postMessage:message=>{
    let value=null,ok=true;
    if(message.method==='store.capabilities')value={schemaVersion:3,barter:true};
    if(message.method==='store.load')value=queue;
    if(message.method==='store.replace')queue=message.payload;
    if(message.method==='window.addon.state'||message.method==='window.addon.preferences')value={dockSide:'left',sameLayer:true,tracked:true,actualSide:'left',status:'attached',persistent:true};
    if(message.method.startsWith('game.'))ok=false;
    queueMicrotask(()=>{for(const f of listeners)f({data:{version:1,id:message.id,epoch:1,ok,value}});});
  }}};
});
await page.clock.install({time:new Date('2026-10-09T01:00:00.000Z')});
try{
  await page.goto(target.href,{timeout:45000});
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.locator('#iris-character-list button').first().click();
  await page.getByRole('button',{name:'클래스',exact:true}).click();
  const list=page.locator('.iris-class-list');await list.waitFor();
  const bounds=await list.boundingBox();
  assert.ok(bounds.height>800,`All classes must fill tall window: ${JSON.stringify(bounds)}`);
  const footer=page.locator('.iris-classes .iris-class-guide').last();
  assert.ok((await footer.boundingBox()).y<1400,'Footer remains in viewport');
  await page.getByRole('button',{name:'힐러',exact:true}).click();
  assert.equal(await page.locator('.iris-class-row').count(),4);
  const natural=await list.boundingBox();assert.ok(natural.height<600,'Short family remains compact');
  await page.getByRole('button',{name:'전체',exact:true}).click();
  for(const [width,height] of [[320,700],[390,900],[768,900],[1280,1400]]){
    await page.setViewportSize({width,height});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No horizontal overflow ${width}`);
    const b=await list.boundingBox(),f=await footer.boundingBox();
    assert.ok(b.height>80&&b.y+b.height<=height+1&&f.y+f.height<=height+1,`List/footer boundary ${width}×${height}: ${JSON.stringify({list:b,footer:f})}`);
  }
  await page.setViewportSize({width:390,height:900});
  const trigger=page.getByRole('button',{name:'계정',exact:true});await trigger.click();
  const dialog=page.getByRole('dialog',{name:'생텀 계정',exact:true});await dialog.waitFor();
  assert.equal(await dialog.getByRole('button',{name:'계정 전환',exact:true}).count(),0,'Direct selection has no extra step');
  await dialog.getByRole('button',{name:/다른계정/}).click();
  await dialog.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.locator('#iris-character-list button').first().click();
  await trigger.click();
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  assert.equal(await trigger.evaluate(e=>document.activeElement===e),true,'Focus returns to account icon');
  await trigger.click();
  const b=await dialog.boundingBox();assert.ok(Math.abs(b.y+b.height/2-450)<20,'Account panel centered vertically');
  await page.mouse.click(2,2);await dialog.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'물물교환',exact:true}).click();
  await page.locator('#iris-pane-barter').waitFor();
  const counter=page.getByLabel('우유 교환 횟수',{exact:true});await counter.waitFor();
  const frozen=await page.evaluate(()=>Date.now());await page.clock.pauseAt(frozen+20);
  await page.getByRole('button',{name:'우유 교환 횟수 증가',exact:true}).click();
  await page.getByRole('button',{name:'우유 교환 횟수 증가',exact:true}).click();
  assert.equal(await counter.innerText(),'2/3');
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.locator('#iris-character-list button').last().click();
  await counter.waitFor();assert.equal(await counter.innerText(),'2/3','Shared pending remains on other character');
  await page.clock.runFor(14900);assert.equal(barterPosts.length,0,'No write before 15s since character change');
  await page.clock.runFor(1100);await page.getByText('미저장 변경 없음',{exact:true}).waitFor();
  assert.equal(barterPosts.length,1);assert.equal(barterPosts[0].desiredCompleted,2);
  await page.getByRole('button',{name:'우유 교환 횟수 감소',exact:true}).click();
  await page.getByRole('button',{name:'지금 저장',exact:true}).click();
  await page.getByText('미저장 변경 없음',{exact:true}).waitFor();
  assert.equal(barterPosts.length,2);assert.equal(barterPosts[1].characterId,'B');assert.equal(await counter.innerText(),'1/3');
  await page.getByRole('searchbox',{name:'물물교환 검색',exact:true}).fill('없는품목');
  await page.getByText('조건에 맞는 물물교환이 없어요.',{exact:true}).waitFor();
  await page.getByRole('searchbox',{name:'물물교환 검색',exact:true}).fill('');
  assert.equal(await page.getByRole('button',{name:'상점구매',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'설정',exact:true}).click();
  await page.getByRole('button',{name:'Lumen',exact:true}).click();
  await page.getByRole('button',{name:'이전 화면',exact:true}).click();
  await trigger.click();
  await page.screenshot({path:'.superpowers/iris-focus-light.png'});
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'설정',exact:true}).click();
  await page.getByRole('button',{name:'Aureum',exact:true}).click();
  await page.getByRole('button',{name:'이전 화면',exact:true}).click();
  await page.getByRole('button',{name:'클래스',exact:true}).click();
  await page.screenshot({path:'.superpowers/iris-focus-dark.png'});
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  console.log('Focus integration PASS: full/natural class height, 4 widths, direct account dialog/focus/Escape/backdrop, barter optimistic/shared character/15s+manual saves+search, 2 theme captures, only 2 synthetic barter writes');
}finally{await browser.close();}
