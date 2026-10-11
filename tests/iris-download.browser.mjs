// Local rendering only: every API/external request is replaced, no operational IO.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext();
await context.addInitScript(()=>{
 const account={id:'00000000-0000-4000-8000-000000000001',nickname:'화면검증',role:'길드원',theme:'aureum'};
 localStorage.setItem('sanctum_accounts',JSON.stringify([account]));
 localStorage.setItem('sanctum_active_account_id',account.id);
 localStorage.setItem('sanctum_iris_welcome_v1_'+account.id,'seen');
 localStorage.setItem('sanctum_iris_welcome_0.0.9_'+account.id,'seen');
});
// Only the local Next dev HMR socket may connect (Turbopack needs it to hydrate).
// HTTP routing alone does not intercept operational Supabase Realtime sockets.
await context.routeWebSocket('**/*',socket=>{
 const url=new URL(socket.url());
 if(url.origin==='ws://localhost:3000'&&url.pathname.startsWith('/_next/'))socket.connectToServer();
 else socket.close();
});
const page=await context.newPage();
let sessionGate=true;
let noticeFixture=[];
let noticeFailure=false;
const sessionWaiters=[];
const errors=[],writes=[],output=mkdtempSync(join(tmpdir(),'iris-download-page-'));
const headerOnly=process.argv.includes('--header-only');
function luminance(color){const values=color.match(/[\d.]+/g).slice(0,3).map(Number);return values.map(value=>{const c=color.startsWith('color(srgb ')?value:value/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,c,index)=>sum+c*[.2126,.7152,.0722][index],0);}
function contrast(foreground,background){const a=luminance(foreground),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
const themes=['aureum','lumen','nemeton','vesper','rosarium','elysium','custom_test'];
function applyTheme({font,theme}){
 document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize=font+'px';
 // Custom themes set core variables in layout, but do not override --accent-soft.
 const values={'--background':'#ffffff','--panel':'#ffffff','--panel-border':'#cbd5e1','--inner-box':'#eef2ff','--text-main':'#0f172a','--text-sub':'#475569','--accent':'#4338ca','--accent-fg':'#ffffff'};
 for(const [key,value] of Object.entries(values)){
  if(theme==='custom_test')document.documentElement.style.setProperty(key,value);
  else document.documentElement.style.removeProperty(key);
 }
}
page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',async route=>{
 const request=route.request(),url=new URL(request.url());
 if(url.pathname==='/api/auth/session'&&sessionGate)await new Promise(resolve=>sessionWaiters.push(resolve));
 // Next dev requests stack details for the intentionally failed notice read.
 if(request.method()!=='GET'&&!(url.origin==='http://localhost:3000'&&url.pathname==='/__nextjs_original-stack-frames'))writes.push(url.pathname);
 if(url.pathname==='/api/notices/reads'&&request.method()==='POST')assert.equal(request.postDataJSON().id,991,'read tracking may only mark the synthetic notice');
 if(url.origin==='http://localhost:3000'&&!url.pathname.startsWith('/api/'))return route.continue();
 if(url.pathname==='/rest/v1/notices'&&noticeFailure)return route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'Synthetic notice fetch failure'})});
 const account={id:'00000000-0000-4000-8000-000000000001',nickname:'화면검증',role:'길드원',status:'approved'};
 const body=url.pathname==='/api/auth/session'?{account}:url.pathname==='/rest/v1/notices'?noticeFixture:url.hostname.includes('supabase')?[]:{accounts:[account],notices:[],data:[]};
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
try{
 await page.goto('http://localhost:3000/');
 assert.equal(await page.getByRole('group',{name:'생텀 빠른 도구',exact:true}).count(),1,'download belongs with global tools, not a home banner');
 await page.getByRole('button',{name:'화면검증 계정 메뉴',exact:true}).waitFor();
 const welcome=page.getByRole('dialog',{name:/IRIS를 만나보세요/});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.equal(await welcome.count(),0,'local remembered account cannot open introduction before session verification');
 await page.evaluate(()=>window.scrollTo(0,500));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 sessionGate=false;sessionWaiters.forEach(resolve=>resolve());
 await page.locator('nav').first().evaluate(node=>Promise.all(node.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
 assert.equal(await welcome.count(),0,'delayed authentication cannot highlight a hidden header');
 await page.evaluate(()=>window.scrollTo(0,0));
 await welcome.waitFor();
 assert.equal(await welcome.count(),1,'first authenticated visit introduces the IRIS download button');
 assert.equal(await welcome.isVisible(),true);
 assert.equal(await welcome.getByRole('link',{name:'업데이트 노트 보기',exact:true}).getAttribute('href'),'/kerygma?note=iris');
 const target=await page.getByRole('link',{name:'IRIS 다운로드',exact:true}).boundingBox();
 const highlight=await page.locator('[data-iris-onboarding-target]').boundingBox();
 assert.ok(highlight.x<=target.x&&highlight.y<=target.y&&highlight.x+highlight.width>=target.x+target.width&&highlight.y+highlight.height>=target.y+target.height,'arrow highlights the real button');
 await page.locator('nav').first().evaluate(node=>{const banner=document.createElement('div');banner.dataset.testBanner='';banner.style.height='40px';node.prepend(banner);});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));
 const movedTarget=await page.locator('nav a[aria-label="IRIS 다운로드"]').boundingBox(),movedHighlight=await page.locator('[data-iris-onboarding-target]').boundingBox();
 assert.ok(Math.abs(movedHighlight.y-(movedTarget.y-4))<1,'late header banner keeps arrow attached to button');
 await page.locator('[data-test-banner]').evaluate(node=>node.remove());
 await page.keyboard.press('Escape');await welcome.waitFor({state:'hidden'});
 await page.reload();await page.getByRole('button',{name:'화면검증 계정 메뉴',exact:true}).waitFor();
 assert.equal(await welcome.count(),0,'dismissed guide does not repeat after reload');
 noticeFixture=[{id:990,type:'길드 공지사항',title:'IRIS 업데이트 노트',content:'<p>다른 작성자의 글</p>',author:'화면검증',created_at:'2026-10-11T00:00:00Z',is_pinned:false,comments:[]}];
 await page.goto('http://localhost:3000/kerygma?note=iris');
 await page.getByRole('status',{name:'IRIS 업데이트 노트'}).waitFor();
 assert.equal(await page.getByRole('link',{name:'IRIS 다운로드 안내',exact:true}).getAttribute('href'),'/iris/download','unpublished notes give a usable fallback');
 assert.equal(await page.getByRole('heading',{name:'IRIS 업데이트 노트',exact:true}).count(),0,'ordinary same-title post must not impersonate the official note');
 noticeFailure=true;await page.reload();
 await page.getByRole('status',{name:'IRIS 업데이트 노트'}).getByText(/불러오지 못했어요/).waitFor();
 noticeFailure=false;
 noticeFixture=[{id:991,type:'생텀 업데이트',title:'IRIS 업데이트 노트',content:'<p>합성 업데이트 내용</p>',author:'SANCTUM 시스템',created_at:'2026-10-11T00:00:00Z',is_pinned:false,comments:[]}];
 await page.reload();
 await page.getByRole('heading',{name:'IRIS 업데이트 노트',exact:true}).waitFor();
 assert.equal(await page.getByText('합성 업데이트 내용',{exact:true}).isVisible(),true,'canonical link opens the existing system note');
 await page.goto('http://localhost:3000/kerygma?id=991&note=iris');
 await page.getByRole('heading',{name:'IRIS 업데이트 노트',exact:true}).waitFor();
 await page.getByRole('button',{name:/목록/}).first().click();await page.waitForURL('**/kerygma?updates=iris');
 noticeFixture=[];
 await page.goto('http://localhost:3000/iris/download');
 assert.equal(await page.locator('section ol > li').count(),4,'game connector setup is a visible launch step, not a hidden prerequisite');
 const metadata=JSON.parse(readFileSync('public/IRIS/downloads/download.json','utf8'));
 const checksum=page.getByText(metadata.sha256,{exact:true});
 assert.equal(await checksum.isVisible(),false,'technical checksum starts folded');
 const verification=page.getByText('파일 확인값 보기',{exact:true});
 await verification.focus();await page.keyboard.press('Enter');
 assert.equal(await checksum.isVisible(),true,'keyboard can reveal checksum');
 await page.keyboard.press('Enter');assert.equal(await checksum.isVisible(),false);
 assert.equal(await page.getByText(/보안 프로그램을 끄지 마세요/).isVisible(),true,'security warning stays visible');
 assert.equal(await page.getByRole('link',{name:'생텀 웹 시낙시스',exact:true}).isVisible(),true,'known beta fallback stays visible');
 for(const width of headerOnly?[]:[320,390,768,1280]){
  await page.setViewportSize({width,height:900});await page.goto('http://localhost:3000/iris/download');
  await page.getByRole('link',{name:'베타 ZIP 다운로드',exact:true}).waitFor();
  for(const font of width<768?[18]:[18,20,22])for(const theme of themes){
   await page.evaluate(applyTheme,{font,theme});
   await page.locator('section details').evaluateAll(nodes=>nodes.forEach(node=>node.open=true));
   // Global theme colors transition for 250ms; measure the settled palette, not an intermediate frame.
   await page.locator('section[aria-labelledby="iris-download-title"]').evaluate(node=>Promise.all(node.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{}))));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`no overflow ${width}/${font}/${theme} with expanded guides`);
   const palette=await page.getByRole('link',{name:'베타 ZIP 다운로드',exact:true}).evaluate(node=>{
    const styles=getComputedStyle(node),root=getComputedStyle(document.documentElement),probe=document.createElement('span');
    probe.style.color='var(--accent-fg)';probe.style.backgroundColor='var(--accent)';document.body.append(probe);
    const expected=getComputedStyle(probe);const result={actual:[styles.color,styles.backgroundColor],expected:[expected.color,expected.backgroundColor],panel:root.getPropertyValue('--panel').trim()};probe.remove();return result;
   });
   assert.deepEqual(palette.actual,palette.expected,'download button uses global theme colors');
   assert.ok(contrast(...palette.actual)>=4.5,'CTA text remains readable');
   const badges=await page.locator('section[aria-labelledby="iris-download-title"] header > div > span, section ol > li > span').evaluateAll(nodes=>nodes.map(node=>{const styles=getComputedStyle(node);return [styles.color,styles.backgroundColor];}));
   for(const colors of badges)assert.ok(contrast(...colors)>=4.5,`small badge/step text contrast ${theme}: ${contrast(...colors).toFixed(2)}`);
   const mark=await page.locator('section[aria-labelledby="iris-download-title"] [data-iris-mark]').evaluate(node=>{const styles=getComputedStyle(node);return {color:styles.backgroundColor,mask:styles.maskImage};});
   assert.match(mark.mask,/IRIS/);assert.equal(mark.color,palette.expected[1],'brand mark uses the active accent');
  }
  await page.locator('section details').evaluateAll(nodes=>nodes.forEach(node=>node.open=false));
  await page.evaluate(applyTheme,{font:width<768?18:22,theme:'aureum'});
  const archive=await page.getByRole('link',{name:'베타 ZIP 다운로드',exact:true}).getAttribute('href');assert.equal(archive,'/IRIS/downloads/IRIS-beta.zip');
  await page.screenshot({path:join(output,width+'.png'),fullPage:true,animations:'disabled'});
  if(width===1280){await page.evaluate(applyTheme,{font:22,theme:'lumen'});await page.screenshot({path:join(output,'light.png'),fullPage:true,animations:'disabled'});}
 }
 await page.goto('http://localhost:3000/');
 const entry=page.getByRole('link',{name:'IRIS 다운로드',exact:true});await entry.waitFor();
 assert.equal(await entry.getAttribute('href'),'/iris/download');
 const tools=page.getByRole('group',{name:'생텀 빠른 도구',exact:true});
 assert.equal(await page.locator('section[aria-labelledby="iris-download-entry-title"]').count(),0,'no duplicate home banner');
 for(const width of headerOnly?[320]:[320,390,768,1280]){
  await page.setViewportSize({width,height:900});
  for(const font of width<768?[18]:[18,20,22])for(const theme of headerOnly?['aureum']:themes){
   await page.evaluate(applyTheme,{font,theme});
   await tools.evaluate(node=>Promise.all(node.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{}))));
   const bounds=await entry.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width,'home entry button stays within viewport');
   const wings=await tools.getByRole('button',{name:'정령의 날개 빠른 이동 열기'}).boundingBox();
   const palette=await tools.getByRole('button',{name:'생텀 페이지 설정 열기'}).boundingBox();
   const inbox=await tools.getByRole('button',{name:'알림함 열기'}).boundingBox();
   assert.ok(wings&&palette&&inbox,'all four tools visible on mobile too');
   assert.ok(Math.abs(wings.y-palette.y)<1&&Math.abs(inbox.y-bounds.y)<1&&inbox.y>wings.y,'two rows');
   assert.ok(Math.abs(wings.x-inbox.x)<1&&Math.abs(palette.x-bounds.x)<1,'two columns');
   assert.ok(Math.abs(wings.width-bounds.width)<1&&Math.abs(wings.height-bounds.height)<1,'same compact button size');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`header fits ${width}/${font}/${theme}`);
   const colors=await tools.evaluate(node=>{
    const anchor=node.querySelector('a'),mark=node.querySelector('[data-iris-mark]'),probe=document.createElement('span');
    probe.style.color='var(--accent-fg)';probe.style.backgroundColor='var(--accent)';node.append(probe);
    const styles=getComputedStyle(anchor),expected=getComputedStyle(probe);
    const result={button:[styles.color,styles.backgroundColor],expected:[expected.color,expected.backgroundColor],mark:getComputedStyle(mark).backgroundColor};probe.remove();return result;
   });
   assert.deepEqual(colors.button,colors.expected);assert.equal(colors.mark,colors.expected[0]);
   assert.ok(contrast(...colors.button)>=4.5,'IRIS icon remains readable');
  }
  await page.evaluate(applyTheme,{font:width<768?18:22,theme:'aureum'});
  await page.locator('nav').first().screenshot({path:join(output,'header-'+width+'.png'),animations:'disabled'});
  const wingsButton=tools.getByRole('button',{name:'정령의 날개 빠른 이동 열기'});
  await wingsButton.click();
  const wingsPanel=page.locator('#spirit-wings-menu');await wingsPanel.waitFor();
  await wingsPanel.evaluate(node=>Promise.all(node.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{}))));
  const headerBounds=await page.locator('nav').first().boundingBox(),panelBounds=await wingsPanel.boundingBox();
  assert.ok(panelBounds.y>=headerBounds.y+headerBounds.height-1,`popup opens below both rows ${JSON.stringify({headerBounds,panelBounds})}`);
  assert.ok(panelBounds.x>=0&&panelBounds.x+panelBounds.width<=width,'popup fits viewport');
  await page.keyboard.press('Escape');await wingsPanel.waitFor({state:'hidden'});
  await tools.getByRole('button',{name:'알림함 열기'}).click();
  const inboxPanel=page.locator('#sanctum-notification-inbox');await inboxPanel.waitFor();
  const inboxBounds=await inboxPanel.boundingBox();
  assert.ok(inboxBounds.y>=headerBounds.y+headerBounds.height-1,'inbox below both rows');
  await page.keyboard.press('Escape');await inboxPanel.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'화면검증 계정 메뉴',exact:true}).click();
  const accountPanel=page.locator('#sanctum-account-menu');await accountPanel.waitFor();
  const accountBounds=await accountPanel.boundingBox();
  assert.ok(accountBounds.y>=headerBounds.y+headerBounds.height-1,`account menu below tools ${JSON.stringify({headerBounds,accountBounds})}`);
  assert.ok(accountBounds.x>=0&&accountBounds.x+accountBounds.width<=width,'account menu fits viewport');
  await page.keyboard.press('Escape');await accountPanel.waitFor({state:'hidden'});
 }
 for(const width of headerOnly?[390]:[320,390,768,1280]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('sanctum_iris_welcome_')&&!key.startsWith('sanctum_iris_welcome_v1_'))localStorage.removeItem(key);});
  await page.reload();await welcome.waitFor();
  await page.evaluate(applyTheme,{font:width<768?18:22,theme:width===390?'lumen':'aureum'});
  const guideBox=await welcome.locator('section').boundingBox();
  assert.ok(guideBox.x>=0&&guideBox.x+guideBox.width<=width&&guideBox.y+guideBox.height<=900,'guide stays within viewport');
  if(width>=390){const a=await welcome.getByRole('link',{name:'다운로드 안내 보기',exact:true}).boundingBox(),b=await welcome.getByRole('link',{name:'업데이트 노트 보기',exact:true}).boundingBox();assert.ok(Math.abs(a.y-b.y)<1,'download and notes sit side by side when there is room');}
  await page.keyboard.press('Tab');assert.equal(await welcome.evaluate(node=>node.contains(document.activeElement)),true,'focus stays in introduction');
  await page.screenshot({path:join(output,'welcome-'+width+'.png'),animations:'disabled'});
  await page.mouse.click(5,895);await welcome.waitFor({state:'hidden'});
 }
 await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('sanctum_iris_welcome_')&&!key.startsWith('sanctum_iris_welcome_v1_'))localStorage.removeItem(key);});
 await page.reload();await welcome.waitFor();
 await welcome.getByRole('link',{name:'업데이트 노트 보기',exact:true}).click();await page.waitForURL('**/kerygma?note=iris');
 await page.getByRole('status',{name:'IRIS 업데이트 노트'}).waitFor();
 await page.goto('http://localhost:3000/');await page.getByRole('button',{name:'화면검증 계정 메뉴',exact:true}).waitFor();
 assert.equal(await welcome.count(),0,'notes navigation also acknowledges the current version');
 await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('sanctum_iris_welcome_')&&!key.startsWith('sanctum_iris_welcome_v1_'))localStorage.removeItem(key);});
 await page.reload();await welcome.waitFor();
 await welcome.getByRole('link',{name:'다운로드 안내 보기'}).click();await page.waitForURL('**/iris/download');
 await page.goto('http://localhost:3000/');await page.getByRole('button',{name:'화면검증 계정 메뉴',exact:true}).waitFor();
 assert.equal(await welcome.count(),0,'download navigation also acknowledges introduction');
 await entry.click();await page.waitForURL('**/iris/download');
 await page.getByRole('link',{name:'베타 ZIP 다운로드',exact:true}).waitFor();
 const response=await context.request.get('http://localhost:3000/IRIS/downloads/IRIS-beta.zip');assert.equal(response.status(),200);
 assert.equal(createHash('sha256').update(await response.body()).digest('hex'),metadata.sha256,'served ZIP integrity');
 sessionGate=true;
 await page.goto('http://localhost:3000/');
 await page.getByRole('button',{name:'화면검증 계정 메뉴',exact:true}).click();
 await page.getByRole('button',{name:'현재 계정 로그아웃'}).click();
 await page.waitForURL('**/login');
 const lateResponse=page.waitForResponse(response=>response.url().includes('/api/auth/session'));
 sessionGate=false;sessionWaiters.forEach(resolve=>resolve());await lateResponse;
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_user')),null,'late authentication cannot resurrect a logged-out account');
 assert.ok(writes.filter(path=>path==='/api/notices/reads').length>0,'opening the note retains existing read tracking');
 assert.deepEqual(writes.filter(path=>path!=='/api/notices/reads'),['/api/auth/logout']);assert.deepEqual(errors,[]);
 console.log(`PASS ${headerOnly?'narrow header regression':'four widths/three fonts/six themes+custom'}, global 2x2 tools/navigation/popups, first-login guide/late session/banner/logout, launch steps/disclosure/security/ZIP hash; screenshots ${output}`);
}finally{await browser.close();}
