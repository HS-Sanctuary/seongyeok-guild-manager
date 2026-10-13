import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
process.env.IRIS_SYNAXIS_FIXTURE_PORT='3011';
const {server}=await import('./iris-synaxis.fixture.mjs');
const {chromium}=createRequire(process.argv[2]??'C:/Users/sungw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage();page.setDefaultTimeout(3000);
try{
for(const width of [360,390,720])for(const font of [18,29.333333]){
await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:3011/?font='+font);await page.getByRole('button',{name:'시낙시스',exact:true}).click();
const title=page.getByRole('heading',{name:'시낙시스 - 스마트 파티 매칭 시스템 및 길드 버스',exact:true});await title.waitFor();assert.ok(await page.getByRole('button',{name:'다시 조회',exact:true}).isVisible());
assert.ok(await title.evaluate(n=>n.scrollWidth<=n.clientWidth+1),'wrapped full title stays readable');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no outer scroll');
}console.log('PASS compact Synaxis title/refresh at 3 widths × 2 fonts');
}finally{await browser.close();await new Promise(r=>server.close(r));}
