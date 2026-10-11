// Anonymous production smoke test. Never submits forms or loads saved auth.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const {chromium}=createRequire(process.argv[2])('playwright');
const release=JSON.parse(readFileSync('public/IRIS/downloads/download.json','utf8'));
const origin='https://sanctum-tawny-three.vercel.app';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext(),page=await context.newPage(),errors=[],writes=[];
const output=mkdtempSync(join(tmpdir(),'iris-production-release-'));
await context.route('**/*',r=>{
 if(r.request().method()!=='GET'){writes.push(r.request().method());return r.abort();}
 return r.continue();
});
await context.routeWebSocket('**/*',socket=>socket.close());
page.on('pageerror',e=>errors.push(e.message));
try{
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:900});
  const response=await page.goto(origin+'/iris/download',{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.getByText('IRIS Beta '+release.version,{exact:true}).waitFor();
  await page.getByRole('heading',{name:'실행은 이렇게, 네 단계면 끝나요'}).waitFor();
  await page.getByRole('heading',{name:'AI 커넥터 켜기',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'베타 ZIP 다운로드',exact:false}).getAttribute('href'),'/IRIS/downloads/IRIS-beta.zip');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:join(output,'download-'+width+'.png'),fullPage:true});
 }
 const metadata=await context.request.get(origin+'/IRIS/downloads/download.json');assert.equal(metadata.status(),200);
 const live=await metadata.json();assert.equal(live.version,release.version);assert.equal(live.sha256,release.sha256);
 const zip=await context.request.get(origin+'/IRIS/downloads/IRIS-beta.zip');assert.equal(zip.status(),200);
 const bytes=await zip.body();assert.equal(bytes.length,release.sizeBytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),release.sha256);
 for(const path of ['/','/login','/character','/kerygma','/party','/admin']){
  const response=await context.request.get(origin+path);assert.equal(response.status(),200);
 }
 for(const path of ['/api/iris/synaxis','/api/iris/kronos']){
  const response=await context.request.get(origin+path);assert.equal(response.status(),401);
 }
 assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
 console.log('PASS production anonymous download four widths, release version/ZIP SHA, six core routes and guest API boundaries; '+output);
}finally{await browser.close();}
