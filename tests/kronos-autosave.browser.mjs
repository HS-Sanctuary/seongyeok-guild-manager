// Actual KRONOS page, synthetic network only; no live account or DB writes.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {loadTS} from './load-ts.mjs';
const {kronosPeriodStart}=loadTS('lib/kronos.ts');
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:850}}),errors=[],writes=[];
page.setDefaultTimeout(8000);
page.on('pageerror',error=>errors.push(error.message));
let fail=false,release=null,hold=false;
const workspaceWrites=[],workspaceRows=[];
let loseWorkspaceReply=false;
const shop={id:91,map:'던바튼',npc:'테스트상점',reward:'합성재료',reward_cnt:1,cost_cnt:10,limit:5,scope:'캐릭터당',reset_type:'주간',is_active:true};
const chars=['테스트별','다른별'].map((nickname,index)=>({id:String(index+1),nickname,owner:'테스트별',job:'전사',alias:'',is_main:index===0,sort_order:index,contribution:0,combat_power:100,life_energy:10,charm:10,magic_resistance:10,levels:{전사:1},daily_checks:[],weekly_checks:{normal:[],repeat:{}},raid_checks:[],trade_checks:{}}));
await page.addInitScript(()=>{localStorage.setItem('nexus_user',JSON.stringify({nickname:'테스트별',role:'길드원'}));});
await page.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname.startsWith('/rest/v1/')){const table=url.pathname.split('/').at(-1);let data=[];if(table==='characters')data=chars;if(table==='nexus_classes')data=[{id:1,name:'전사',is_active:true}];if(table==='nexus_tasks')data=[{id:1,name:'일일 미션',type:'daily',is_active:true},{id:2,name:'요일 던전',type:'daily',is_active:true}];await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});return;}
 if(url.origin!=='http://localhost:3000'){await route.abort();return;}
 if(url.pathname==='/api/kronos'){
   if(route.request().method()==='POST'){const input=route.request().postDataJSON();workspaceWrites.push(input);let row=workspaceRows.find(row=>row.kind===input.kind&&row.item_id===input.itemId);if(!row){row={kind:input.kind,item_id:input.itemId,character_name:input.character,count:0,bookmarked:false,period_start:new Date(kronosPeriodStart(new Date())).toISOString()};workspaceRows.push(row);}row.count+=input.delta;if(input.bookmarked!==undefined)row.bookmarked=input.bookmarked;if(loseWorkspaceReply){loseWorkspaceReply=false;await route.abort();return;}await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({progress:row})});return;}
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({shops:[shop],missions:[],progress:workspaceRows,notes:[]})});return;
 }
 if(url.pathname.startsWith('/api/')){let data={};if(url.pathname==='/api/auth/session')data={account:{id:'00000000-0000-4000-8000-000000000001',nickname:'테스트별',role:'길드원',status:'승인'}};if(url.pathname==='/api/member-mutations'){const input=route.request().postDataJSON();writes.push(input);if(hold){hold=false;await new Promise(r=>release=r);}if(fail){await route.fulfill({status:503,contentType:'application/json',body:'{"message":"synthetic failure"}'});return;}const target=chars.find(c=>c.nickname===input.filter?.value);if(target)Object.assign(target,input.payload);data={data:target?[target]:[]};}await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});return;}
 await route.continue();
});
const toolbar=()=>page.locator('[aria-label="크로노스 저장 상태"]');
const task=name=>page.getByText(name,{exact:true}).filter({visible:true}).first();
try{
 await page.goto('http://localhost:3000/character');
 await page.getByRole('button',{name:'다른별 전사',exact:true}).waitFor();
 await page.waitForTimeout(800);
 assert.equal(writes.length,0,'initial load must not write');
 assert.equal(await toolbar().count(),0,'clean page has no save panel');
 await page.clock.install();
 await task('일일 미션').click();await task('요일 던전').click();
 await toolbar().getByText(/미저장 2개/).waitFor();
 await page.screenshot({path:'.superpowers/kronos-autosave-pending-20261012.png'});
 await page.clock.runFor(14999);assert.equal(writes.length,0);
 await page.clock.runFor(1);await toolbar().waitFor({state:'hidden'});
 assert.equal(writes.length,1);assert.deepEqual(writes[0].payload.daily_checks,[1,2]);
 console.log('PASS actual page: no load write, immediate edits, 15s latest batch');
 await task('일일 미션').click();hold=true;await toolbar().getByRole('button',{name:'지금 저장'}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="크로노스 저장 상태"]')?.textContent.includes('저장 중'));
 await task('요일 던전').click();assert.equal(writes.length,2);release();
 await toolbar().waitFor({state:'hidden'});assert.equal(writes.length,3);assert.deepEqual(writes[2].payload.daily_checks,[]);
 console.log('PASS edits during manual save drain once without overlap');
 await task('일일 미션').click();fail=true;await toolbar().getByRole('button',{name:'지금 저장'}).click();await toolbar().getByText(/저장 실패/).waitFor();const count=writes.length;
 await page.clock.runFor(60000);assert.equal(writes.length,count);
 await page.getByRole('button',{name:'다른별 전사',exact:true}).click();await toolbar().getByText(/저장 실패/).waitFor();assert.equal(await page.getByRole('button',{name:'테스트별 전사',exact:true}).getAttribute('aria-pressed'),'true');
 fail=false;await toolbar().getByRole('button',{name:'다시 저장'}).click();await toolbar().waitFor({state:'hidden'});
 await task('요일 던전').click();await page.getByRole('button',{name:'다른별 전사',exact:true}).click();await page.clock.runFor(1000);await page.waitForTimeout(100);assert.equal(await page.getByRole('button',{name:'다른별 전사',exact:true}).getAttribute('aria-pressed'),'true');
 assert.deepEqual(chars[0].daily_checks,[1,2]);
 console.log('PASS failure preserves current character; retry and switch save first');
 const card=page.locator('article').filter({hasText:'테스트상점'});
 await card.getByRole('button',{name:'횟수 늘리기',exact:true}).click();await card.getByRole('button',{name:'횟수 늘리기',exact:true}).click();
 await toolbar().getByText(/미저장 1개/).waitFor();assert.equal(workspaceWrites.length,0);
 await page.clock.runFor(15000);await toolbar().waitFor({state:'hidden'});assert.equal(workspaceWrites.length,1);assert.equal(workspaceWrites[0].delta,2);
 await card.getByRole('button',{name:'횟수 늘리기',exact:true}).click();loseWorkspaceReply=true;await toolbar().getByRole('button',{name:'지금 저장'}).click();await toolbar().getByText(/저장 실패/).waitFor();assert.equal(workspaceWrites.length,2);
 await page.clock.runFor(60000);assert.equal(workspaceWrites.length,2);
 await toolbar().getByRole('button',{name:'다시 저장'}).click();await toolbar().waitFor({state:'hidden'});assert.equal(workspaceWrites.length,2,'lost POST reply must be read back, never repeat its delta');assert.equal(workspaceRows[0].count,3);
 console.log('PASS shop shared status and 15s batch; lost-reply retry reads back without duplicate delta');
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:850});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);}
 await page.setViewportSize({width:390,height:850});await page.screenshot({path:'.superpowers/kronos-autosave-20261012.png'});
 await task('일일 미션').click();assert.equal(await page.evaluate(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;}),true,'reload/close warns for pending edits');
 await page.evaluate(()=>{const link=document.createElement('a');link.href='/character?review=1';link.textContent='합성 이동';document.body.append(link);});const beforeUrl=page.url();fail=true;
 await page.getByRole('link',{name:'합성 이동',exact:true}).click();await toolbar().getByText(/저장 실패/).waitFor();assert.equal(page.url(),beforeUrl,'failed save blocks page navigation');
 fail=false;await page.getByRole('link',{name:'합성 이동',exact:true}).click();await page.waitForURL('**/character?review=1');
 console.log('PASS reload guard and link navigation: failure stays, success saves before leaving');
 assert.deepEqual(errors,[]);console.log('PASS 4 widths, no page errors; all IO synthetic');
}catch(error){console.log((await page.locator('body').innerText()).slice(0,6000));throw error;}finally{await browser.close();}
