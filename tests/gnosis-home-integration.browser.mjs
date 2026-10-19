// Exact isolated production build only. Fresh browser data; all non-loopback IO blocked.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire('C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const origin=process.argv[2];assert.equal(origin,'http://127.0.0.1:3119','Use the owned synthetic production preview only');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{const url=new URL(route.request().url());return url.origin===origin||url.protocol==='data:'?route.continue():route.abort();});
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:900});await page.goto(origin+'/gnosis');
  await page.getByRole('heading',{name:'GNOSIS',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Board overflow at ${width}`);
  await page.getByRole('link',{name:'패션 시뮬레이터',exact:true}).click();
  await page.getByLabel('코디 이름',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Dressroom overflow at ${width}`);
  await page.getByText('개인 저장함은 이 브라우저에 보관돼요.',{exact:false}).waitFor();
 }
 await page.getByLabel('코디 이름',{exact:true}).fill('통합 확인용 코디');
 await page.getByLabel('등급',{exact:true}).fill('에픽');await page.getByRole('button',{name:'개인 저장',exact:true}).click();
 await page.locator('.gnosis-editor-status').filter({hasText:'개인 저장함에 저장했어요. 이 브라우저에서 다시 열 수 있어요.'}).waitFor();
 await page.reload();await page.getByLabel('코디 이름',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('코디 이름',{exact:true}).inputValue(),'통합 확인용 코디');
 await page.getByRole('button',{name:'공유하기',exact:true}).click();
 await page.getByRole('dialog',{name:'공유하기',exact:true}).waitFor();await page.keyboard.press('Escape');
 await page.getByRole('dialog',{name:'공유하기',exact:true}).waitFor({state:'hidden'});
 await page.goto(origin+'/gnosis/write');await page.locator('.gnosis-editor-page').waitFor();
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Writer overflow at ${width}`);}
 await page.screenshot({path:'.superpowers/sdd/2026-10-19-home-integration/gnosis-writer.png',fullPage:false});
 assert.deepEqual(errors,[]);
 console.log('PASS integrated GNOSIS board→dressroom, local-only save/reload, share Escape, writer layouts at 320/390/768/1280; no external IO or operational writes');
}finally{await browser.close();}
