// Real React/DOM check with synthetic APIs and native channel; never uses account cookies or DB.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext();const page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
let completed=0,posts=0,classPosts=0,reads=0,postStarted=0,characterFailure=false,period='2026-10-04T21:00:00.000Z';
const levels={A:65,B:53};
const account={id:'synthetic',nickname:'가나다라마바사아자차카타',role:'길드원'};
await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='http://localhost:3000'){await route.abort();return;}
  if(!url.pathname.startsWith('/api/')){await route.continue();return;}
  let result={};
  if(url.pathname==='/api/auth/session')result={account};
  if(url.pathname==='/api/iris/characters'){
    if(characterFailure){await route.fulfill({status:503,contentType:'application/json',body:'{}'});return;}
    result={accountId:account.id,characters:[{id:'A',nickname:account.nickname,job:'댄서',alias:''},{id:'B',nickname:'젼설',job:'격투가',alias:null}]};
  }
  if(url.pathname==='/api/iris/kronos'){
    if(route.request().method()==='GET')reads++;
    if(route.request().method()==='POST'){
      posts++;postStarted=Date.now();const {edit}=route.request().postDataJSON();completed=edit.desiredCompleted;
      await new Promise(r=>setTimeout(r,500));result={result:{requestId:edit.requestId,status:'saved',completed}};
    }else result={accountId:account.id,characterId:url.searchParams.get('characterId'),observedAt:'2026-10-05T00:00:00.000Z',writeContext:{periodKeys:Object.fromEntries(['daily','weekly','abyss','raid'].map(c=>[c,period])),classes:[{classId:'c',editable:true,baseLevel:levels[url.searchParams.get('characterId')]}]},details:{schemaVersion:1,tasks:{daily:[{id:'d',name:'일일 미션',completed:0,total:1}],weekly:[{id:'x',name:'뱅가드 브리치',completed,total:3}],abyss:[],raid:[]},classes:[{id:'c',name:'댄서',level:levels[url.searchParams.get('characterId')]}]}};
  }
  if(url.pathname==='/api/iris/classes'){
    const {edit}=route.request().postDataJSON();classPosts++;levels[edit.characterId]=edit.desiredLevel;
    await new Promise(r=>setTimeout(r,500));result={result:{requestId:edit.requestId,status:'saved',level:edit.desiredLevel}};
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
});
await page.addInitScript(()=>{
  const listeners=new Set();let queue=null;
  window.__irisDesktopBridge={epoch:1,environment:'development'};
  window.chrome={webview:{addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),postMessage:message=>{
    if(message.method==='store.replace')queue=message.payload;
    queueMicrotask(()=>{for(const fn of [...listeners])fn({data:{version:1,id:message.id,epoch:1,ok:!(window.fixtureCloseFailure&&message.method==='window.close'),error:'synthetic-close-failure',value:message.method==='store.capabilities'?{schemaVersion:3,barter:true}:message.method==='store.load'?queue:message.method.startsWith('overlay.')?{clickThrough:false,shortcutsAvailable:true,opacityPercent:100}:null}});});
  }}};
});
try{
  await page.goto('http://localhost:3000/iris/desktop');
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'캐릭터 선택',exact:true}).count(),1,'Compact character picker missing');
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#iris-character-list').isVisible(),false,'Escape must dismiss character picker');
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.getByRole('heading',{name:'IRIS for SANCTUM'}).click();
  assert.equal(await page.locator('#iris-character-list').isVisible(),false,'Outside pointer must dismiss character picker');
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.getByRole('button',{name:new RegExp(account.nickname+' .*댄서')}).click();
  assert.equal(await page.locator('#iris-character-list').isVisible(),false,'Selection must collapse picker');
  if(process.argv.includes('--class-only')){
    assert.equal(await page.getByLabel('댄서 레벨',{exact:true}).isVisible(),false,'Classes must not lengthen homework');
    await page.getByRole('button',{name:'클래스',exact:true}).click();
    const input=page.getByLabel('댄서 레벨',{exact:true}),gauge=page.getByLabel('댄서 레벨 게이지',{exact:true});
    await input.fill('53');await gauge.focus();await gauge.press('ArrowRight');
    await page.waitForFunction(()=>document.querySelector('[aria-label="댄서 레벨"]')?.value==='54');
    await input.fill('5.3');await page.getByRole('button',{name:'궁수',exact:true}).click();
    assert.equal(await input.isVisible(),true,'Filtered error must remain visible');
    assert.equal(await gauge.isDisabled(),true,'Invalid text must not become a valid gauge value');
    await page.getByRole('button',{name:'입력 되돌리기',exact:true}).click();
    assert.equal(await input.isVisible(),false,'Valid class must respect lineage filter');
    await page.getByRole('button',{name:'음유시인',exact:true}).click();
    assert.equal(await input.inputValue(),'54');
    await page.getByRole('button',{name:'지금 저장',exact:true}).click();await input.focus();
    await page.getByText('미저장 변경 없음',{exact:true}).waitFor();
    assert.equal(classPosts,1);assert.equal(posts,0);assert.equal(levels.A,54);
    await input.evaluate(e=>{window.fixtureClass=e;});await page.waitForTimeout(1200);
    assert.equal(await input.evaluate(e=>e===window.fixtureClass&&document.activeElement===e),true);
    for(const width of [320,390,768,1280]){
      await page.setViewportSize({width,height:700});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Class overflow ${width}`);
    }
    await page.setViewportSize({width:390,height:700});
    await page.screenshot({path:'.superpowers/sdd/2026-10-07-iris-class-level-editing/class-tab.png',fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('Class-only browser PASS: tab separation, gauge editing, lineage/error preservation, manual save, stable focus, 4 widths; synthetic APIs only');
    await browser.close();process.exit(0);
  }
  assert.equal(await page.getByRole('button',{name:'일일',exact:true}).getAttribute('aria-pressed'),'true','Daily category visible by default');
  assert.equal(await page.getByRole('button',{name:'주간',exact:true}).getAttribute('aria-pressed'),'true','Weekly category visible by default');
  const daily=page.locator('[data-task-key="daily:d"]');
  await daily.waitFor();await daily.click();
  await page.waitForFunction(()=>document.querySelector('[data-task-key="daily:d"] input')?.checked===true);
  await daily.locator('input').press('Space');
  await page.waitForFunction(()=>document.querySelector('[data-task-key="daily:d"] input')?.checked===false);
  await daily.locator('input').click();
  await page.waitForFunction(()=>document.querySelector('[data-task-key="daily:d"] input')?.checked===true);
  await page.getByLabel('미완료만').check();assert.equal(await daily.count(),0);
  await page.getByLabel('미완료만').uncheck();await daily.locator('input').click();
  await page.waitForFunction(()=>document.querySelector('[data-task-key="daily:d"] input')?.checked===false);
  const row=page.locator('[data-task-key="weekly:x"]');await row.waitFor();
  await row.evaluate(e=>{window.fixtureRow=e;});
  const editStarted=Date.now();await page.getByRole('button',{name:'뱅가드 브리치 증가'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-task-key="weekly:x"]')?.textContent.includes('1/3'));
  const editVisible=Date.now()-editStarted;
  assert.equal(/\d{8,}초/.test(await page.locator('body').innerText()),false,'Countdown used uninitialized clock');
  const manualStarted=Date.now();await page.getByRole('button',{name:'지금 저장',exact:true}).click();
  await page.getByRole('button',{name:'뱅가드 브리치 증가'}).focus();
  const focusBefore=await page.evaluate(()=>document.activeElement?.getAttribute('aria-label'));
  assert.equal(focusBefore,'뱅가드 브리치 증가','Background save must not disable focused editable row');
  await page.evaluate(()=>scrollTo(0,100));const scrollBefore=await page.evaluate(()=>scrollY);
  await page.waitForFunction(()=>document.querySelector('[data-task-key="weekly:x"]')?.textContent.includes('1/3'));
  await page.getByText('미저장 변경 없음',{exact:true}).waitFor();
  console.log(JSON.stringify({syntheticLatency:true,editToVisibleMs:editVisible,manualToPostMs:postStarted-manualStarted,postToAckVisibleMs:Date.now()-postStarted,posts,automaticDebounceMs:15000}));
  assert.equal(await row.evaluate(e=>e===window.fixtureRow),true,'Task DOM node replaced');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),focusBefore,'Focus changed during background save');
  assert.equal(await page.evaluate(()=>scrollY),scrollBefore,'Scroll changed during background save');
  assert.equal(posts,1);
  await page.getByRole('button',{name:'클래스',exact:true}).click();
  const classInput=page.getByLabel('댄서 레벨',{exact:true});
  await classInput.fill('66');await classInput.evaluate(e=>{window.fixtureClass=e;});
  await page.getByRole('button',{name:'지금 저장',exact:true}).click();await classInput.focus();
  await page.getByText('미저장 변경 없음',{exact:true}).waitFor();
  assert.equal(classPosts,1);assert.equal(await classInput.inputValue(),'66');
  assert.equal(await classInput.evaluate(e=>e===window.fixtureClass&&document.activeElement===e),true,'Class save replaced focused input');
  await classInput.fill('67');await classInput.fill('');
  assert.equal(await page.getByRole('button',{name:'지금 저장',exact:true}).isDisabled(),true);
  await page.waitForTimeout(16000);assert.equal(classPosts,1,'Invalid draft autosaved previous value');
  await page.getByRole('button',{name:'입력 되돌리기',exact:true}).click();
  assert.equal(await classInput.inputValue(),'67');
  await page.getByText('미저장 변경 없음',{exact:true}).waitFor({timeout:20000});
  assert.equal(classPosts,2);assert.equal(levels.A,67,'Valid reverted draft did not autosave');
  period='2026-10-11T21:00:00.000Z';completed=0;
  const beforeReads=reads;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(()=>document.querySelector('[data-task-key="weekly:x"]')?.textContent.includes('0/3'));
  assert.equal(reads,beforeReads+1);assert.equal(await row.evaluate(e=>e===window.fixtureRow),true);
  for(let i=0;i<4;i++)await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  assert.equal(reads,beforeReads+1,'Resume refresh must be bounded');
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('iris-desktop-close')));
  await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  for(const width of [320,420]){
    await page.setViewportSize({width,height:800});
    const fitted=await page.locator('.iris-desktop').evaluate(e=>Math.ceil(e.getBoundingClientRect().height));
    await page.setViewportSize({width,height:fitted});
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('iris-desktop-close')));
    const dialog=page.getByRole('dialog');await dialog.waitFor();
    assert.equal(await dialog.evaluate(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight;}),true,'Fitted HUD clips close dialog');
    await page.getByRole('button',{name:'돌아가기',exact:true}).focus();
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'돌아가기','Background tick changed close-dialog focus');
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:320,height:260});
  await page.evaluate(()=>{window.fixtureCloseFailure=true;window.dispatchEvent(new CustomEvent('iris-desktop-close'));});
  await page.getByRole('button',{name:'보관하고 종료',exact:true}).click();
  await page.getByText('보관 또는 종료 연결에 실패했어요.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('dialog').evaluate(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight;}),true,'Fitted HUD clips storage-failure recovery');
  await page.getByRole('button',{name:'손실 가능성을 확인하고 종료',exact:true}).focus();
  assert.equal(await page.getByRole('button',{name:'손실 가능성을 확인하고 종료',exact:true}).evaluate(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight;}),true);
  await page.keyboard.press('Escape');await page.evaluate(()=>{window.fixtureCloseFailure=false;});
  // Keep disposition finalizes the controller before a native close reply; use a fresh synthetic document for unrelated auth checks.
  await page.reload();await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.getByRole('button',{name:new RegExp(account.nickname+' .*댄서')}).click();
  for(const width of [320,390,768,1280])for(const font of [18,20,22])for(const theme of ['lumen','elysium','aureum','nemeton','vesper','rosarium']){
    await page.setViewportSize({width,height:800});await page.evaluate(({font,theme})=>{document.documentElement.style.fontSize=font+'px';document.documentElement.dataset.theme=theme;},{font,theme});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow ${width}/${font}/${theme}`);
  }
  await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>{document.documentElement.style.fontSize='20px';document.documentElement.dataset.theme='aureum';});
  await page.getByRole('button',{name:'설정',exact:true}).click();
  assert.equal(await page.getByRole('heading',{name:'Appearance',exact:true}).count(),1,'Addon settings missing');
  assert.equal(await page.getByText('게임 창에 붙이기',{exact:true}).count(),1,'Dock setting missing');
  assert.equal(await page.getByRole('button',{name:'클릭 통과 켜기',exact:true}).count(),0,'Overlay-only click-through setting must be absent');
  await page.getByRole('button',{name:account.nickname+' · 계정',exact:true}).click();
  await page.getByRole('button',{name:'다른 계정 추가',exact:true}).click();
  const secret=page.getByLabel('접속 코드',{exact:true});
  await secret.fill('synthetic-only');await secret.evaluate(e=>{window.fixtureInput=e;e.setSelectionRange(2,5);e.focus();});
  await page.waitForTimeout(1200);
  assert.equal(await secret.evaluate(e=>e===window.fixtureInput&&e.value==='synthetic-only'&&e.selectionStart===2&&e.selectionEnd===5&&document.activeElement===e),true,'Auth input changed during background tick');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#iris-account-panel').count(),0);
  await page.getByRole('button',{name:account.nickname+' · 계정',exact:true}).click();
  await page.getByRole('heading',{name:'IRIS for SANCTUM'}).click();assert.equal(await page.locator('#iris-account-panel').count(),0);
  await page.getByRole('button',{name:'설정',exact:true}).click();
  assert.deepEqual(errors,[]);
  await page.mouse.move(0,0);
  const expectedBorder=await page.evaluate(()=>{const el=document.createElement('div');el.style.color='var(--panel-border)';document.body.append(el);const c=getComputedStyle(el).color;el.remove();return c;});
  await page.waitForFunction(color=>getComputedStyle(document.querySelector('.iris-desktop-button')).borderTopColor===color,expectedBorder);
  await page.screenshot({path:'.superpowers/sdd/2026-10-07-iris-class-level-editing/desktop-ui.png',fullPage:true});
  await page.getByRole('button',{name:'숙제',exact:true}).click();
  await page.setViewportSize({width:390,height:700});await page.evaluate(()=>{document.documentElement.style.fontSize='18px';});
  await page.getByRole('button',{name:'클래스',exact:true}).click();
  await page.screenshot({path:'.superpowers/sdd/2026-10-07-iris-class-level-editing/compact-homework.png',fullPage:true});
  await page.screenshot({path:'.superpowers/sdd/2026-10-07-iris-class-level-editing/compact-folded.png',fullPage:true});
  characterFailure=true;await page.reload();
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.getByText('캐릭터 목록을 불러오지 못했어요. 로그인은 유지돼요.',{exact:true}).waitFor();
  assert.equal(await page.getByText('본인 계정에 등록된 캐릭터가 없어요.',{exact:true}).count(),0);
  characterFailure=false;await page.getByRole('button',{name:'캐릭터 다시 불러오기',exact:true}).click();
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();
  await page.getByRole('button',{name:new RegExp(account.nickname+' .*댄서')}).waitFor();
  assert.equal(posts,1,'Character retry must not issue a save');assert.deepEqual(errors,[]);
  console.log('Desktop DOM identity/focus/collapse, 72 layout/theme/font combinations, panel dismissal, synthetic save PASS');
}catch(error){console.log(await page.locator('body').innerText());throw error;}finally{await browser.close();}
