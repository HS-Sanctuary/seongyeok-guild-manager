// Read-only local page and archive; account/API IO is blocked with guest data.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext(),page=await context.newPage();
const errors=[],writes=[],output=mkdtempSync(join(tmpdir(),'iris-download-page-'));
page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',async route=>{
 const request=route.request(),url=new URL(request.url());
 if(request.method()!=='GET')writes.push(url.pathname);
 if(url.origin==='http://localhost:3000'&&!url.pathname.startsWith('/api/'))return route.continue();
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({account:null,accounts:[],notices:[],data:[]})});
});
try{
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:900});await page.goto('http://localhost:3000/iris/download');
  await page.getByRole('link',{name:'베타 ZIP 다운로드',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no document overflow at '+width);
  const archive=await page.getByRole('link',{name:'베타 ZIP 다운로드',exact:true}).getAttribute('href');assert.equal(archive,'/IRIS/downloads/IRIS-beta.zip');
  await page.screenshot({path:join(output,width+'.png'),fullPage:true,animations:'disabled'});
 }
 const response=await context.request.get('http://localhost:3000/IRIS/downloads/IRIS-beta.zip');assert.equal(response.status(),200);
 const metadata=JSON.parse(readFileSync('public/IRIS/downloads/download.json','utf8'));
 assert.equal(createHash('sha256').update(await response.body()).digest('hex'),metadata.sha256,'served ZIP integrity');
 assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
 console.log('PASS local download page four widths, actual ZIP hash, guest read-only rendering; screenshots '+output);
}finally{await browser.close();}
