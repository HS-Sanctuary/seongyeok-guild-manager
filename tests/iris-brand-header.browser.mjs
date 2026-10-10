import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
process.env.IRIS_SYNAXIS_FIXTURE_PORT='3014';
const {server}=await import('./iris-synaxis.fixture.mjs');
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage();
const output=mkdtempSync(join(tmpdir(),'iris-brand-header-')),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(const [width,font] of [[320,18],[390,18],[768,18],[1280,18],[1280,20],[1280,22]]){
  await page.setViewportSize({width,height:850});await page.goto('http://127.0.0.1:3014/?brand=1&font='+font);
  await page.getByRole('button',{name:'계정',exact:true}).waitFor();
  await page.addStyleTag({content:'* { transition:none!important; }'});
  assert.equal(await page.locator('.iris-titlebar button').count(),2);
  assert.equal(await page.locator('.iris-character-bar .iris-context-actions').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.iris-titlebar,.iris-character-bar button,.iris-context-actions')].filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.className)),[],'no clipped header');
  const home=page.getByRole('link',{name:'생텀 바로가기'});assert.equal(await home.getAttribute('href'),'https://sanctum-tawny-three.vercel.app/');assert.equal(await home.getAttribute('target'),'_blank');
 }
 const colors=new Set();
 for(const theme of ['aureum','lumen','nemeton','vesper','rosarium','elysium']){
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const mark=page.locator('.iris-brand-mark');const [color,mask]=await mark.evaluate(n=>[getComputedStyle(n).backgroundColor,getComputedStyle(n).maskImage]);
  colors.add(color);assert.match(decodeURI(mask),/IRIS 로고 마크\.svg/);
  await page.setViewportSize({width:390,height:850});await page.screenshot({path:join(output,theme+'.png'),animations:'disabled'});
 }
 assert.equal(colors.size,6);
 await page.getByRole('button',{name:'계정',exact:true}).click();assert.equal(await page.getByRole('button',{name:'계정',exact:true}).getAttribute('aria-expanded'),'true');
 await page.getByRole('button',{name:'설정',exact:true}).click();assert.equal(await page.getByRole('button',{name:'계정',exact:true}).getAttribute('aria-expanded'),'false');await page.getByText('설정 화면').waitFor();
 await page.getByRole('button',{name:'IRIS 최소화'}).click();await page.getByRole('button',{name:'IRIS 종료'}).click();
 assert.deepEqual(await page.evaluate(()=>[window.fixture.minimize,window.fixture.close]),[true,true]);assert.deepEqual(errors,[]);
 console.log('PASS header: four widths/three fonts, six theme marks, tools/lockstep panels and window callbacks');console.log('Screenshots '+output);
}finally{await browser.close();await new Promise(r=>server.close(r));}
