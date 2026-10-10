// Removing the IRIS-wide scrollbar skin must fail this test; real CSS/React,
// synthetic external IO only. Covers body portals and future overflow regions.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.IRIS_SYNAXIS_FIXTURE_PORT='3013';
const {server}=await import('./iris-synaxis.fixture.mjs');
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:390,height:850}});
const output=mkdtempSync(join(tmpdir(),'iris-scrollbars-'));
try {
  await page.goto('http://127.0.0.1:3013/?spacing=1');
  await page.locator('.iris-desktop').waitFor();
  await page.evaluate(()=>{
    const portal=document.createElement('section');portal.id='scroll-probe';
    portal.style.cssText='position:fixed;inset:100px 20px auto;height:240px;overflow:auto;background:var(--panel);z-index:100';
    portal.innerHTML='<div style="height:900px;width:600px">테마 스크롤 확인</div>';
    document.body.append(portal);
  });
  const thumbColors=new Set();
  for(const theme of ['aureum','lumen','nemeton','vesper','rosarium','elysium']) {
    await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    const values=await page.evaluate(()=>['html','.iris-desktop','#scroll-probe'].map(selector=>{
      const node=document.querySelector(selector),thumb=getComputedStyle(node,'::-webkit-scrollbar-thumb'),track=getComputedStyle(node,'::-webkit-scrollbar-track');
      return {thumb:thumb.backgroundColor,track:track.backgroundColor,radius:thumb.borderRadius,width:getComputedStyle(node,'::-webkit-scrollbar').width};
    }));
    for(const item of values){assert.notEqual(item.thumb,'rgba(0, 0, 0, 0)',theme+' visible thumb');assert.notEqual(item.track,'rgba(0, 0, 0, 0)',theme+' themed track');assert.ok(parseFloat(item.radius)>0,'rounded thumb');assert.ok(parseFloat(item.width)>=10&&parseFloat(item.width)<=16,'usable compact rail');}
    assert.deepEqual(values[0],values[2],'portal shares document skin');
    thumbColors.add(values[0].thumb);
    await page.locator('#scroll-probe').hover();await page.mouse.wheel(0,300);
    await page.waitForFunction(()=>document.querySelector('#scroll-probe').scrollTop>0);
    await page.evaluate(()=>document.querySelector('#scroll-probe').scrollTop=0);
    await page.screenshot({path:join(output,theme+'.png'),animations:'disabled'});
  }
  assert.equal(thumbColors.size,6,'each theme supplies its own thumb color');
  await page.emulateMedia({forcedColors:'active'});
  assert.equal(await page.locator('#scroll-probe').evaluate(n=>getComputedStyle(n).scrollbarColor),'auto','high contrast uses native colors');
  await page.emulateMedia({forcedColors:'none'});
  await page.evaluate(()=>document.querySelector('.iris-desktop').remove());
  assert.equal(await page.locator('#scroll-probe').evaluate(n=>getComputedStyle(n,'::-webkit-scrollbar-thumb').backgroundColor),'rgba(0, 0, 0, 0)','web outside IRIS unchanged');
  console.log('PASS six themes: root/nested/portal skin, wheel scrolling, forced colors and non-IRIS isolation');
  console.log('Screenshots '+output);
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
