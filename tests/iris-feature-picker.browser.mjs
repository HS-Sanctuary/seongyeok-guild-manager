// Real DesktopCenter/Classes and themed CSS; synthetic data, no game or account IO.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {join} from 'node:path';
process.env.IRIS_SYNAXIS_FIXTURE_PORT='3011';
const {server}=await import('./iris-synaxis.fixture.mjs');
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];
page.setDefaultTimeout(2500);page.on('pageerror',e=>errors.push(e.message));
const go=async()=>{await page.goto('http://127.0.0.1:3011/?features=1');await page.getByRole('button',{name:'크로노스',exact:true}).waitFor();};
const trigger=()=>page.getByRole('button',{name:'기능 선택',exact:true});
const list=()=>page.getByRole('region',{name:'크로노스 기능 선택',exact:true});
const choose=async(name)=>{await trigger().click();await list().getByRole('button',{name,exact:true}).click();};
const focused=locator=>locator.evaluate(e=>e===document.activeElement);
try{
  await go();
  assert.equal(await page.getByRole('button',{name:'스탯',exact:true}).isVisible(),false,'closed selection hides feature controls');
  await trigger().click();
  for(const name of ['생텀 기록','캐릭터 관리','게임 정보'])assert.equal(await list().getByRole('heading',{name,exact:true}).count(),1);
  const pairs=[['숙제','homework'],['물물교환','barter'],['상점구매','shop'],['임무게시판','missions'],['클래스','classes'],['스탯','stats'],['재화','currencies']];
  assert.equal(await list().getByRole('button').count(),7);
  await page.keyboard.press('Escape');assert.equal(await focused(trigger()),true);
  for(const [name,id] of pairs){await choose(name);assert.equal(await page.locator('[aria-label="IRIS 센터"]').getAttribute('data-active-tab'),id);assert.equal(await list().count(),0);assert.equal(await focused(trigger()),true);}
  const before=await page.evaluate(()=>window.fixture.tabChanges.slice());
  await choose('재화');await trigger().click();await page.keyboard.press('Escape');
  assert.deepEqual(await page.evaluate(()=>window.fixture.tabChanges),before,'same selection/open/close has no activation');
  assert.equal(await page.evaluate(()=>window.fixture.writes.length+window.fixture.reads.length),0);
  console.log('PASS grouped feature selection preserves all seven IDs without IO');

  await go();await trigger().click();assert.equal(await focused(list().getByRole('button',{name:'숙제',exact:true})),true);
  await page.keyboard.press('Escape');assert.equal(await focused(trigger()),true);
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#iris-feature-list')),false);
  await trigger().click();await page.getByRole('button',{name:'계정',exact:true}).click();assert.equal(await list().count(),0);await page.getByRole('region',{name:'계정 화면'}).waitFor();
  await page.evaluate(()=>window.fixture.setAccount(false));await trigger().click();
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();assert.equal(await list().count(),0);
  await trigger().focus();await page.keyboard.press('Enter');assert.equal(await page.getByRole('region',{name:'내 캐릭터',exact:true}).count(),0);
  await page.getByRole('button',{name:'시낙시스',exact:true}).click();assert.equal(await trigger().isVisible(),false);
  await page.getByRole('button',{name:'크로노스',exact:true}).click();assert.equal(await list().count(),0);
  console.log('PASS dismissal, hidden controls and panel exclusivity');

  await go();await trigger().click();await page.evaluate(()=>window.fixture.setLocked(true));await list().waitFor({state:'hidden'});assert.equal(await trigger().isDisabled(),true);
  await page.evaluate(()=>window.fixture.setLocked(false));await trigger().click();await page.evaluate(()=>window.fixture.setSelected('2'));await list().waitFor({state:'hidden'});
  await trigger().click();await page.evaluate(()=>window.fixture.setSettings(true));await list().waitFor({state:'hidden'});
  await page.evaluate(()=>window.fixture.setSettings(false));await trigger().click();await page.evaluate(()=>window.fixture.setAccount(true));await list().waitFor({state:'hidden'});
  console.log('PASS closes on lock, character, settings and account transitions');

  await go();await choose('클래스');const input=page.getByRole('textbox',{name:'전사 레벨',exact:true});await input.fill('53');
  await choose('스탯');await page.getByRole('button',{name:'시낙시스',exact:true}).click();await page.getByRole('button',{name:'크로노스',exact:true}).click();await choose('클래스');assert.equal(await input.inputValue(),'53');
  await page.getByRole('button',{name:'설정',exact:true}).click();await page.getByRole('button',{name:'설정',exact:true}).click();assert.equal(await input.inputValue(),'53');
  assert.equal(await page.evaluate(()=>window.fixture.writes.length),0);assert.equal(await page.evaluate(()=>window.fixture.drafts['warrior'].text),'53');
  console.log('PASS class draft survives feature, section and settings round trips');
  for(const [width,font] of [[320,18],[390,18],[768,18],[1280,18],[1280,20],[1280,22]]){
    await page.setViewportSize({width,height:720});await page.goto('http://127.0.0.1:3011/?features=1&font='+font);await trigger().click();
    for(const theme of ['aureum','lumen','elysium','nemeton','vesper','rosarium']){
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      await page.waitForFunction(()=>!document.getAnimations().some(animation=>animation.playState==='running'));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      const clipped=await list().getByRole('button').evaluateAll(elements=>elements.filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.textContent));assert.deepEqual(clipped,[]);
      const contrasts=await list().getByRole('button').evaluateAll(elements=>{
        const ctx=document.createElement('canvas').getContext('2d');
        const rgb=color=>{ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
        const light=color=>rgb(color).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        return elements.map(e=>{const s=getComputedStyle(e),a=light(s.color),b=light(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
      });
      for(const ratio of contrasts)assert.ok(ratio>=4.5,theme+' feature contrast '+ratio.toFixed(2));
    }
  }
  await page.setViewportSize({width:320,height:380});await go();await trigger().click();
  assert.equal(await list().evaluate(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY)),true,'short viewport scrolls only the feature list');
  const outerScroll=await page.evaluate(()=>scrollY);await list().evaluate(e=>e.scrollTop=e.scrollHeight);
  const last=await list().getByRole('button',{name:'재화',exact:true}).boundingBox();assert.ok(last&&last.y>=0&&last.y+last.height<=380,'last feature fits without scrolling the outer page');assert.equal(await page.evaluate(()=>scrollY),outerScroll);
  await list().getByRole('button',{name:'재화',exact:true}).click();assert.equal(await page.locator('[aria-label="IRIS 센터"]').getAttribute('data-active-tab'),'currencies');
  console.log('PASS responsive layout, six themes and short viewport access');
  await page.setViewportSize({width:390,height:850});await go();
  const output='.superpowers/sdd/2026-10-11-iris-navigation';
  for(const theme of ['aureum','lumen']){
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await page.waitForFunction(()=>!document.getAnimations().some(animation=>animation.playState==='running'));
    await page.screenshot({path:join(output,theme+'-closed.png')});await trigger().click();await page.screenshot({path:join(output,theme+'-open.png')});await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
