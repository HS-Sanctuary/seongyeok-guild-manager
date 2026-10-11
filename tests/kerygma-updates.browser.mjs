// Fresh local browser. Every operational HTTP/WS request is replaced.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext();
const output=mkdtempSync(join(tmpdir(),'kerygma-updates-'));
let notices=[
 {id:701,title:'SANCTUM Beta v2.3 업데이트',type:'생텀 업데이트',author:'SANCTUM 시스템'},
 {id:702,title:'IRIS 업데이트 노트',type:'생텀 업데이트',author:'SANCTUM 시스템'},
 {id:703,title:'일반 업데이트 기록',type:'생텀 업데이트',author:'한설'},
 {id:704,title:'길드 공지 확인',type:'길드 공지사항',author:'한설'},
].map(n=>({...n,content:'<p>합성 본문 '+n.id+'</p>',created_at:'2026-10-11T00:00:00Z',is_pinned:false,comments:[]}));
const listedNotices=notices;
const errors=[],writes=[];
await context.routeWebSocket('**/*',socket=>{
 const url=new URL(socket.url());
 if(url.origin==='ws://localhost:3000'&&url.pathname.startsWith('/_next/'))socket.connectToServer();else socket.close();
});
await context.route('**/*',route=>{
 const request=route.request(),url=new URL(request.url());
 if(url.origin==='http://localhost:3000'&&!url.pathname.startsWith('/api/'))return route.continue();
 if(request.method()!=='GET'){
  writes.push(url.pathname);
  assert.equal(url.pathname,'/api/notices/reads');assert.ok([701,702].includes(request.postDataJSON().id));
 }
 const body=url.pathname==='/rest/v1/notices'?notices:url.hostname.includes('supabase')?[]:url.pathname==='/api/auth/session'?{}:{accounts:[],data:[]};
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto('http://localhost:3000/kerygma?updates=sanctum');
 await page.getByText('SANCTUM Beta v2.3 업데이트',{exact:true}).first().waitFor();
 const group=page.getByRole('group',{name:'업데이트 분류',exact:true});
 assert.equal(await group.count(),1,'update category exposes its two child tabs');
 const sanctum=group.getByRole('button',{name:'생텀 업데이트',exact:true}),iris=group.getByRole('button',{name:'IRIS 업데이트',exact:true});
 assert.equal(await sanctum.getAttribute('aria-pressed'),'true');
 assert.equal(await page.getByText('IRIS 업데이트 노트',{exact:true}).count(),0,'SANCTUM tab excludes the dedicated IRIS note');
 assert.equal(await page.getByText('길드 공지 확인',{exact:true}).count(),0,'updates exclude unrelated categories');
 await iris.click();await page.waitForURL('**/kerygma?updates=iris');
 await page.getByText('IRIS 업데이트 노트',{exact:true}).waitFor();
 assert.equal(await iris.getAttribute('aria-pressed'),'true');
 assert.equal(await page.getByText('SANCTUM Beta v2.3 업데이트',{exact:true}).count(),0);
 await page.reload();await page.getByText('IRIS 업데이트 노트',{exact:true}).waitFor();
 assert.equal(await iris.getAttribute('aria-pressed'),'true','reload retains selected channel');
 await page.getByText('IRIS 업데이트 노트',{exact:true}).click();
 await page.waitForURL('**/kerygma?id=702&updates=iris');
 await page.getByRole('heading',{name:'IRIS 업데이트 노트',exact:true}).waitFor();
 await page.getByRole('button',{name:/목록/}).first().click();await page.waitForURL('**/kerygma?updates=iris');
 assert.equal(await iris.getAttribute('aria-pressed'),'true','reader returns to its original child tab');
 await sanctum.click();await page.waitForURL('**/kerygma?updates=sanctum');
 await page.goBack();await page.waitForURL('**/kerygma?updates=iris');
 assert.equal(await iris.getAttribute('aria-pressed'),'true','history retains selected channel');
 for(const width of [320,390,768,1280])for(const font of width<768?[18]:[18,20,22])for(const theme of ['aureum','lumen','nemeton','vesper','rosarium','elysium']){
  await page.setViewportSize({width,height:900});
  await page.evaluate(({font,theme})=>{document.documentElement.style.fontSize=font+'px';document.documentElement.dataset.theme=theme;},{font,theme});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`viewport fits ${width}/${font}/${theme}`);
  const boxes=await group.getByRole('button').evaluateAll(nodes=>nodes.map(node=>({box:node.getBoundingClientRect().toJSON(),font:parseFloat(getComputedStyle(node).fontSize),clipped:node.scrollWidth>node.clientWidth+1})));
  assert.ok(boxes.every(({box,font,clipped})=>box.x>=0&&box.right<=width&&font>=12&&!clipped),'subtabs readable and unclipped');
  if(theme==='aureum'&&font===(width<768?18:22))await page.screenshot({path:join(output,width+'.png'),fullPage:true,animations:'disabled'});
 }
 await page.goto('http://localhost:3000/kerygma?note=iris');await page.getByRole('heading',{name:'IRIS 업데이트 노트',exact:true}).waitFor();
 await page.getByRole('button',{name:/목록/}).first().click();await page.waitForURL('**/kerygma?updates=iris');
 notices=[];await page.reload();await page.getByText('등록된 게시글이 없습니다.',{exact:true}).waitFor();
 assert.equal(await iris.getAttribute('aria-pressed'),'true','empty IRIS channel is still selectable');
 notices=listedNotices;
 await page.setViewportSize({width:320,height:900});await page.goto('http://localhost:3000/kerygma');
 await page.getByRole('button',{name:'변경',exact:true}).click();
 await page.getByRole('button',{name:'생텀 업데이트',exact:true}).click();await page.waitForURL('**/kerygma?updates=sanctum');
 assert.equal(await sanctum.getAttribute('aria-pressed'),'true','mobile category picker enters parent update section');
 await iris.focus();await page.keyboard.press('Enter');await page.waitForURL('**/kerygma?updates=iris');
 await page.getByRole('button',{name:'변경',exact:true}).click();await page.getByRole('button',{name:'길드 공지사항',exact:true}).click();
 await page.waitForURL('**/kerygma');assert.equal(await group.count(),0,'other categories hide update subtabs');
 await page.getByText('길드 공지 확인',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);assert.ok(writes.every(path=>path==='/api/notices/reads'));
 console.log('PASS update subtabs/filter/reload/history/reader return/empty, 4 widths/3 fonts/6 themes; '+output);
}finally{await browser.close();}
