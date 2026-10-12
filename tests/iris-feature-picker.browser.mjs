// Real persistent feature buttons/Classes/CSS; isolated synthetic IO only.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
process.env.IRIS_SYNAXIS_FIXTURE_PORT='3011';
const {server}=await import('./iris-synaxis.fixture.mjs');
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];
page.setDefaultTimeout(3000);page.on('pageerror',e=>errors.push(e.message));
const go=async(font=18)=>{await page.goto('http://127.0.0.1:3011/?features=1&font='+font);await page.getByRole('button',{name:'크로노스',exact:true}).waitFor();};
const nav=()=>page.getByRole('navigation',{name:'크로노스 기능',exact:true});
const choose=async name=>nav().getByRole('button',{name,exact:true}).click();
const pairs=[['숙제','homework'],['클래스','classes'],['스탯','stats'],['재화','currencies'],['물물교환','barter'],['상점구매','shop'],['임무게시판','missions']];
try{
 await go();
 assert.equal(await page.getByRole('button',{name:'기능 선택',exact:true}).count(),0);
 assert.equal(await nav().getByRole('button').count(),8);
 for(const [name,id] of pairs){assert.equal(await nav().getByRole('button',{name,exact:true}).isVisible(),true);await choose(name);assert.equal(await page.locator('[aria-label="IRIS 센터"]').getAttribute('data-active-tab'),id);assert.equal(await nav().getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');}
 const before=await page.evaluate(()=>window.fixture.tabChanges.slice());await choose('임무게시판');
 assert.deepEqual(await page.evaluate(()=>window.fixture.tabChanges),before,'Reselecting current feature does not reread');
 assert.equal(await page.evaluate(()=>window.fixture.writes.length+window.fixture.reads.length),0);
 console.log('PASS seven direct buttons, selected state and no redundant activation/IO');
 await page.evaluate(()=>window.fixture.setLocked(true));await nav().locator('button:disabled').first().waitFor();assert.equal(await nav().locator('button:disabled').count(),8);
 await page.evaluate(()=>window.fixture.setLocked(false));await nav().locator('button:not(:disabled)').first().waitFor();await page.getByRole('button',{name:'계정',exact:true}).click();await nav().locator('button:disabled').first().waitFor();assert.equal(await nav().locator('button:disabled').count(),8);
 await page.evaluate(()=>window.fixture.setAccount(false));await choose('클래스');
 const input=page.getByRole('textbox',{name:'전사 레벨',exact:true});await input.fill('53');
 await choose('스탯');await page.getByRole('button',{name:'시낙시스',exact:true}).click();assert.equal(await nav().isVisible(),false);
 await page.getByRole('button',{name:'크로노스',exact:true}).click();await choose('클래스');assert.equal(await input.inputValue(),'53');
 await page.getByRole('button',{name:'설정',exact:true}).click();assert.equal(await nav().isVisible(),false);
 await page.getByRole('button',{name:'설정',exact:true}).click();assert.equal(await input.inputValue(),'53');
 assert.equal(await page.evaluate(()=>window.fixture.writes.length),0);
 console.log('PASS locked/account guards and class draft across section/settings changes');
 for(const width of [320,360,390,420,720,768,1280])for(const font of [18,20,22]){
  await page.setViewportSize({width,height:720});await go(font);
  for(const theme of ['aureum','lumen','elysium','nemeton','vesper','rosarium']){
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}/${font}/${theme} outer overflow`);
   const clipped=await nav().getByRole('button').evaluateAll(elements=>elements.filter(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2).map(e=>e.textContent));assert.deepEqual(clipped,[],`${width}/${font}/${theme} feature clipping`);
   const bounds=await page.getByRole('navigation',{name:'상위 메뉴',exact:true}).getByRole('button',{name:'크로노스',exact:true}).boundingBox();assert.ok(bounds.height<=font*2,`Upper button must be compact: ${bounds.height}`);assert.ok(bounds.height>=24,'Compact controls remain usable');
  }
 }
 console.log('PASS 21 width/font combinations × six themes; smaller upper buttons, unclipped labels');
 await page.setViewportSize({width:390,height:850});await go();await page.screenshot({path:'.superpowers/iris-restored-tabs-20261012.png'});
 assert.deepEqual(errors,[]);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
