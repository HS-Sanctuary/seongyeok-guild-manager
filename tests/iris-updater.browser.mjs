import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
process.env.IRIS_SYNAXIS_FIXTURE_PORT='3017';
const {server}=await import('./iris-synaxis.fixture.mjs');
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext(),page=await context.newPage(),errors=[];
await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:3017'?r.continue():r.abort());
page.on('pageerror',e=>errors.push(e.message));const output=mkdtempSync(join(tmpdir(),'iris-update-ui-'));
try{
 for(const [width,font] of [[320,18],[390,18],[768,18],[1280,18],[1280,20],[1280,22]]){
  await page.setViewportSize({width,height:850});await page.goto('http://127.0.0.1:3017/?brand=1&updater=1&font='+font);
  const update=page.getByRole('button',{name:'IRIS 0.2.0 업데이트',exact:true});await update.waitFor({timeout:5000});await page.getByText('Beta 0.1.0',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await update.click();await page.getByRole('dialog',{name:'IRIS 업데이트',exact:true}).waitFor();assert.equal(await page.getByRole('link',{name:'업데이트 노트',exact:true}).getAttribute('href'),'https://sanctum-tawny-three.vercel.app/kerygma?note=iris');
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.iris-titlebar,.iris-focus-dialog')].some(n=>n.scrollWidth>n.clientWidth+2)),false);
  await page.screenshot({path:join(output,width+'-'+font+'.png'),animations:'disabled'});await page.getByRole('button',{name:'취소',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0);
 }
 for(const mode of ['same','older','unsupported']){await page.goto('http://127.0.0.1:3017/?brand=1&updater=1&mode='+mode);await page.getByText(mode==='unsupported'?'Beta · 수동 업데이트':'Beta 0.1.0',{exact:true}).waitFor();assert.equal(await page.locator('.iris-update-button').count(),0);}
 await page.setViewportSize({width:390,height:850});await page.goto('http://127.0.0.1:3017/?brand=1&updater=1');
 await page.addStyleTag({content:'* { transition:none!important; animation:none!important; }'});
 const themeColors=new Set();
 for(const theme of ['aureum','lumen','nemeton','vesper','rosarium','elysium']){
  await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
  themeColors.add(await page.locator('.iris-update-button').evaluate(n=>getComputedStyle(n).borderColor));
  await page.getByRole('button',{name:'IRIS 0.2.0 업데이트'}).click();await page.getByRole('dialog').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
 }
 assert.equal(themeColors.size,6,'Update button must follow all six theme accents');
 for(const mode of ['preserve','download','success']){
  await page.goto('http://127.0.0.1:3017/?brand=1&updater=1');await page.getByRole('button',{name:'IRIS 0.2.0 업데이트'}).click();await page.evaluate(m=>{window.fixture.updateFailure=m==='success'?null:m;},mode);
  const start=page.getByRole('button',{name:'업데이트하고 다시 시작',exact:true});await start.click();
  if(mode!=='success'){await page.getByRole('alert').waitFor();assert.equal(await page.evaluate(()=>window.fixture.updateCalls.filter(c=>c==='window.update.apply').length),0);assert.equal(await start.isEnabled(),true);}
  else{await page.getByText('업데이트 후 다시 시작해요.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.fixture.preserved),1);assert.equal(await page.evaluate(()=>window.fixture.updateCalls.filter(c=>c==='window.update.apply').length),1);assert.equal(await start.isEnabled(),false,'Installing must stay locked until process exits');}
 }
 await page.goto('http://127.0.0.1:3017/?brand=1&updater=1');await page.getByRole('button',{name:'IRIS 0.2.0 업데이트'}).click();await page.evaluate(()=>window.fixture.delayPrepare=true);await page.getByRole('button',{name:'업데이트하고 다시 시작',exact:true}).click();
 await page.waitForFunction(()=>window.fixture.finishPrepare);assert.deepEqual(await page.evaluate(()=>window.fixture.closeDecisions),[true],'Native close protection must precede download');await page.evaluate(()=>{window.fixture.updateFailure='preserve';window.fixture.finishPrepare();});await page.getByRole('alert').waitFor();await page.waitForFunction(()=>window.fixture.closeDecisions.length===2);assert.deepEqual(await page.evaluate(()=>window.fixture.closeDecisions),[true,false]);
 assert.deepEqual(errors,[]);console.log('PASS updater UI: native version, conditional button, four widths/three fonts, dialog/cancel, failed prepare/preserve no apply, one successful apply; '+output);
}finally{await browser.close();await new Promise(r=>server.close(r));}
