// Actual IRIS/shared components; only external IO and disabled native dialogs are synthetic.
// Catches confirm-gated no-op, premature/duplicate writes and excessive IRIS card heights.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
process.env.IRIS_SYNAXIS_FIXTURE_PORT='3010';
const {server}=await import('./iris-synaxis.fixture.mjs');
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:390,height:1050}}),errors=[],failures=[];
const screenshots=mkdtempSync(join(tmpdir(),'iris-party-controls-'));
page.setDefaultTimeout(4000);
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{localStorage.clear();window.nativeDialogCalls=[];window.confirm=message=>{window.nativeDialogCalls.push(message);return false;};window.alert=message=>window.nativeDialogCalls.push(message);});
const go=async(query='')=>{await page.goto('http://127.0.0.1:3010/?controls=1'+query);await page.getByRole('button',{name:'시낙시스',exact:true}).click();await page.getByText('시간대 불일치 (조율 필요)',{exact:true}).waitFor();};
const countWrites=()=>page.evaluate(()=>window.fixture.writes.length);
const dialog=()=>page.getByRole('dialog',{name:'파티 탈퇴',exact:true});
const leave=()=>page.getByRole('button',{name:'[열두글자닉네임테스트용] 탈퇴',exact:true});
const scenario=async(name,run)=>{try{await run();console.log('PASS '+name);}catch(error){failures.push(error);console.error('FAIL '+name+' '+error.message);console.error(await page.evaluate(()=>({writes:window.fixture.writes,notices:[...document.querySelectorAll('[role=status]')].map(n=>n.textContent),hidden:document.hidden,storage:{...localStorage},dialogs:[...document.querySelectorAll('[role=dialog]')].map(n=>n.textContent)})));}};
try{
  await scenario('IRIS cards are compact without hiding member information',async()=>{
    for(const width of [320,390]){
      await page.setViewportSize({width,height:1050});await go();
      const slots=page.locator('[class*="memberGrid"] > div');assert.equal(await slots.count(),4);
      const heights=await slots.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));
      assert.ok(heights[0]<=125&&heights[1]<=125,'member heights '+JSON.stringify(heights));
      assert.ok(heights[2]<=60&&heights[3]<=60,'empty slot heights '+JSON.stringify(heights));
      await slots.first().getByText('열두글자닉네임테스트용',{exact:true}).waitFor();
      for(const text of ['110,000','8,000','20:00 ~ 00:00'])assert.ok(await slots.first().getByText(text,{exact:true}).isVisible(),text+' remains readable');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.screenshot({path:join(screenshots,width+'-party.png')});
      await page.locator('.iris-synaxis-surface').evaluate(node=>node.classList.remove('iris-synaxis-surface'));
      assert.ok((await slots.first().boundingBox()).height>=150,'non-IRIS member layout stays unchanged');
    }
  });
  await scenario('leave cancellation never writes and Escape/backdrop close the IRIS confirmation',async()=>{
    await go();await leave().click();await dialog().waitFor();assert.equal(await countWrites(),0);
    await page.keyboard.press('Escape');await dialog().waitFor({state:'detached'});assert.equal(await countWrites(),0);
    await leave().click();await dialog().waitFor();await page.mouse.click(2,2);await dialog().waitFor({state:'detached'});assert.equal(await countWrites(),0);
    assert.deepEqual(await page.evaluate(()=>window.nativeDialogCalls),[]);
  });
  await scenario('accepted leave sends one scoped write, preserves other member, and permits rejoining with a new time',async()=>{
    await go();await leave().click();await dialog().waitFor();
    await dialog().getByRole('button',{name:'탈퇴하기',exact:true}).dblclick();
    await page.waitForFunction(()=>window.fixture.writes.length===1);
    await page.getByRole('status').filter({hasText:/탈퇴가 완료/}).waitFor();
    const write=await page.evaluate(()=>window.fixture.writes[0]);
    assert.equal(write.body.expectedAccountId,'fixture-account');assert.equal(write.body.action,'update');assert.equal(write.body.filter.value,1);
    assert.deepEqual(write.body.payload.members.map(m=>m.name),['타인캐릭터']);
    await page.getByRole('button',{name:'신청',exact:true}).click();
    await page.getByRole('radio',{name:'열두글자닉네임테스트용 참가 선택',exact:true}).check();
    const timeButtons=page.getByRole('dialog',{name:/파티 참여 신청/}).getByRole('button',{name:/^\d{2}:\d{2}.*▼/});
    await timeButtons.nth(0).click();await page.getByRole('dialog').last().getByRole('button',{name:'19:00',exact:true}).click();
    await page.getByRole('dialog').last().getByRole('button',{name:/시간 설정 완료/}).click();
    await timeButtons.nth(1).click();await page.getByRole('dialog').last().getByRole('button',{name:'23:00',exact:true}).click();
    await page.getByRole('dialog').last().getByRole('button',{name:/시간 설정 완료/}).click();
    await page.getByRole('button',{name:/파티 참가!/}).click();await page.waitForFunction(()=>window.fixture.writes.length===2);
    const member=await page.evaluate(()=>window.fixture.writes[1].body.payload.members.find(m=>m.name==='열두글자닉네임테스트용'));
    assert.equal(member.time_start,'19:00');assert.equal(member.time_end,'23:00');
    assert.deepEqual(await page.evaluate(()=>window.nativeDialogCalls.filter(m=>/탈퇴/.test(m))),[]);
  });
  await scenario('only admin can confirm force deletion, cancellation is safe, accepted delete updates the list',async()=>{
    await go('&member=1');assert.equal(await page.getByRole('button',{name:'강제 삭제',exact:true}).count(),0);
    await go();await page.getByRole('button',{name:'강제 삭제',exact:true}).click();
    const remove=page.getByRole('dialog',{name:'파티 강제 삭제',exact:true});await remove.waitFor();assert.equal(await countWrites(),0);
    await remove.getByRole('button',{name:'취소',exact:true}).click();await remove.waitFor({state:'detached'});assert.equal(await countWrites(),0);
    await page.getByRole('button',{name:'강제 삭제',exact:true}).click();await remove.getByRole('button',{name:'삭제하기',exact:true}).click();
    await page.getByRole('status').filter({hasText:/삭제되었습니다/}).waitFor();
    const write=await page.evaluate(()=>window.fixture.writes[0]);assert.equal(write.body.expectedAccountId,'fixture-account');assert.equal(write.body.action,'delete');assert.equal(write.body.filter.value,1);
    await page.waitForFunction(()=>document.querySelectorAll('[class*="cardContainer"]').length===0);assert.equal(await countWrites(),1);
  });
  await scenario('write failure remains visible without a native alert or lost card',async()=>{
    await go();await page.evaluate(()=>window.fixture.failNext=true);await leave().click();await dialog().getByRole('button',{name:'탈퇴하기',exact:true}).click();
    await page.getByRole('status').filter({hasText:/합성 권한 거부/}).waitFor();
    assert.equal(await countWrites(),1);assert.equal(await leave().count(),1);assert.deepEqual(await page.evaluate(()=>window.nativeDialogCalls),[]);
  });
  await scenario('inactive surface cancels a waiting confirmation without a write',async()=>{
    await go();await leave().click();await dialog().waitFor();await page.evaluate(()=>window.fixture.setShown(false));await dialog().waitFor({state:'detached'});
    await page.evaluate(()=>window.fixture.setShown(true));assert.equal(await countWrites(),0);assert.equal(await dialog().count(),0);
  });
  await scenario('a participant added during confirmation cancels the stale write and refreshes the list',async()=>{
    await go();await leave().click();await dialog().waitFor();
    await page.evaluate(()=>window.fixture.tables.parties[0].members.push({name:'새참가자',owner:'새계정',job:'힐러',time_start:'20:00',time_end:'23:00'}));
    await dialog().getByRole('button',{name:'탈퇴하기',exact:true}).click();
    await page.getByRole('status').filter({hasText:/파티 정보가 바뀌었어요/}).waitFor();assert.equal(await countWrites(),0);
    await page.getByText('새참가자',{exact:true}).waitFor();
    await leave().click();await dialog().getByRole('button',{name:'탈퇴하기',exact:true}).click();await page.waitForFunction(()=>window.fixture.writes.length===1);
    assert.deepEqual(await page.evaluate(()=>window.fixture.writes[0].body.payload.members.map(m=>m.name)),['타인캐릭터','새참가자']);
  });
  await scenario('a party removed during confirmation cancels the write and removes the stale card',async()=>{
    await go();await leave().click();await dialog().waitFor();await page.evaluate(()=>window.fixture.tables.parties=[]);
    await dialog().getByRole('button',{name:'탈퇴하기',exact:true}).click();
    await page.getByRole('status').filter({hasText:/파티 정보가 바뀌었어요/}).waitFor();assert.equal(await countWrites(),0);assert.equal(await leave().count(),0);
  });
  assert.deepEqual(errors,[],'uncaught browser errors');console.log('Screenshots '+screenshots);
  if(failures.length)throw new AggregateError(failures,'IRIS party control regression failures: '+failures.length);
}finally{await browser.close();server.close();}
