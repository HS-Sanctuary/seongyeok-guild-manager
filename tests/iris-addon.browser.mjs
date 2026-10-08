// Real desktop UI; synthetic native channel/APIs only. No production account or DB writes.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
let posts=0,accountId='a';
await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url());if(request.method()==='POST')posts++;
  let body={};
  if(url.pathname==='/api/auth/switch')accountId=request.postDataJSON().accountId;
  if(url.pathname==='/api/auth/session'||url.pathname==='/api/auth/switch')body={account:{id:accountId,nickname:accountId==='a'?'한설':'계정B',role:'길드원'}};
  if(url.pathname==='/api/iris/characters')body={accountId,characters:[{id:'c',nickname:'한설',job:'댄서',alias:null}]};
  if(url.pathname==='/api/iris/stats')body={accountId,characters:[]};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
await page.addInitScript(()=>{
  if(!localStorage.getItem('iris_desktop_accounts:v1'))localStorage.setItem('iris_desktop_accounts:v1',JSON.stringify([{id:'b',nickname:'계정B',role:'길드원'}]));
  const listeners=new Set();window.__irisDesktopBridge={epoch:1,environment:'development'};window.__addonCalls=[];
  window.chrome={webview:{addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),postMessage:m=>{
    window.__addonCalls.push(m.method);
    const value=m.method==='game.currencies.read'?{observedAt:'2026-10-08T07:07:55Z',items:[{name:'골드',amount:123456789},{name:'정령의 날개',amount:0},{name:'미확인 재화',amount:null}]}:m.method==='game.stats.read'?{observedAt:new Date().toISOString(),job:'댄서',level:100,stats:{combat_power:10,life_energy:20,magic_resistance:30,charm:40}}:m.method==='window.addon.state'||m.method==='window.addon.preferences'?{dockSide:'right',sameLayer:true,tracked:true,actualSide:'right',status:'attached',persistent:true}:m.method.startsWith('overlay.')?{clickThrough:false,shortcutsAvailable:true,opacityPercent:100}:null;
    queueMicrotask(()=>{for(const fn of listeners)fn({data:{version:1,id:m.id,epoch:1,ok:true,value}});});
  }}};
});
const currencyReads=()=>page.evaluate(()=>window.__addonCalls.filter(v=>v==='game.currencies.read').length);
try{
  await page.goto(process.env.IRIS_TEST_URL??'http://localhost:3000/iris/desktop');
  await page.getByRole('button',{name:'재화',exact:true}).click();await page.getByRole('heading',{name:'인게임 재화',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'재화 강조 설정',exact:true}).count(),1,'Currency header needs its appearance editor');
  const reads=await currencyReads();await page.getByRole('button',{name:'재화 강조 설정',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'재화 강조 설정',exact:true});await dialog.waitFor();
  await dialog.getByLabel('강조할 재화',{exact:true}).selectOption('골드');await dialog.getByLabel('글자색',{exact:true}).fill('#0d0d0e');await dialog.getByText('현재 배경과 대비가 낮아요. 더 밝거나 어두운 색을 골라 주세요.',{exact:true}).waitFor();await dialog.getByLabel('글자색',{exact:true}).fill('#ab12cd');
  await dialog.getByLabel('굵게',{exact:true}).check();await dialog.getByLabel('기울임',{exact:true}).check();await dialog.getByRole('button',{name:'적용',exact:true}).click();
  const gold=page.locator('.iris-currency-values>div').filter({has:page.getByText('골드',{exact:true})});
  await page.waitForFunction(()=>{const row=[...document.querySelectorAll('.iris-currency-values dt')].find(e=>e.textContent==='골드');return row&&getComputedStyle(row).color==='rgb(171, 18, 205)';});
  const style=await gold.locator('dt').evaluate(e=>({color:getComputedStyle(e).color,weight:getComputedStyle(e).fontWeight,style:getComputedStyle(e).fontStyle}));
  assert.deepEqual(style,{color:'rgb(171, 18, 205)',weight:'700',style:'italic'});assert.deepEqual(await gold.locator('dd').evaluate(e=>({color:getComputedStyle(e).color,weight:getComputedStyle(e).fontWeight,style:getComputedStyle(e).fontStyle})),style);
  assert.equal(await currencyReads(),reads);assert.equal(posts,0);
  await page.reload();await page.getByRole('button',{name:'재화',exact:true}).click();await gold.waitFor();assert.equal(await gold.locator('dt').evaluate(e=>getComputedStyle(e).fontWeight),'700');
  await page.getByRole('button',{name:'재화 강조 설정',exact:true}).click();await dialog.waitFor();await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.equal(await page.getByRole('button',{name:'재화 강조 설정',exact:true}).evaluate(e=>e===document.activeElement),true);
  for(const width of [320,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  if(process.env.IRIS_ADDON_FULL){
    await page.getByRole('button',{name:'설정',exact:true}).click();await page.getByRole('button',{name:'Lumen',exact:true}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'lumen');await page.reload();await page.getByRole('button',{name:'재화',exact:true}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'lumen');
    assert.equal(await page.getByText('IRIS for SANCTUM',{exact:true}).count(),1);await page.getByRole('button',{name:'IRIS 최소화',exact:true}).click();assert.ok(await page.evaluate(()=>window.__addonCalls.includes('window.minimize')));
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('iris-desktop-close',{detail:{version:1,kind:'window.close.request',epoch:1,environment:'development',reason:'game-exit'}})));await page.getByRole('heading',{name:'게임이 종료됐어요. IRIS도 종료할까요?',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'버리고 종료',exact:true}).count(),0);await page.getByRole('button',{name:'취소',exact:true}).click();
    await page.getByRole('button',{name:'설정',exact:true}).click();await page.getByRole('button',{name:'한설 · 계정',exact:true}).click();await page.getByRole('button',{name:'계정B',exact:true}).click();await page.getByRole('button',{name:'계정B · 계정',exact:true}).waitFor();await page.getByRole('button',{name:'이전 화면',exact:true}).click();await page.getByRole('button',{name:'재화',exact:true}).click();await gold.waitFor();assert.equal(await gold.locator('dt').evaluate(e=>getComputedStyle(e).fontWeight),'400','Account B cannot inherit A emphasis');
    await page.getByRole('button',{name:'설정',exact:true}).click();await page.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('iris_appearance:'))throw Error('fixture blocked');return set.call(this,key,value);};});await page.getByRole('button',{name:'Vesper',exact:true}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'vesper');await page.getByRole('button',{name:'계정B · 계정',exact:true}).click();await page.getByRole('button',{name:'한설',exact:true}).click();await page.getByRole('button',{name:'한설 · 계정',exact:true}).waitFor();assert.equal(await page.locator('html').getAttribute('data-theme'),'vesper','Session-only theme must survive account switching');
    assert.equal(posts,2,'Only explicit synthetic account switching writes');
  }
  assert.equal(posts,process.env.IRIS_ADDON_FULL?2:0);assert.deepEqual(errors,[]);console.log('Addon UI PASS: real currency editor, native read count stable, balance formatting, reload persistence, account isolation, blocked storage, Escape/focus, narrow layouts; synthetic only');
}finally{await browser.close();}
