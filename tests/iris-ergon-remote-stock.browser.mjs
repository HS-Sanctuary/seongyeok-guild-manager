import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2]??'C:/Users/sungw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopErgonWorkbench}=require('@/components/iris/DesktopErgonWorkbench');
const now=Date.now(),frame=(kind,data)=>({schemaVersion:1,kind,source:'official-cli',observedAt:now,data});
const snapshots={materials:frame('materials',{items:[{name:'나무 진액',category:'Ingredient',location:'account_storage',count:40,locked:false}]}),altering:frame('altering',{items:[{name:'목재+',available:true,producedPerUnit:3,missing:[{name:'나무 진액',required:4,owned:0}]}]})};
const session={snapshots,now,loadingKinds:[],currencyBusy:false,refresh:async()=>{},refreshOverview:async()=>{}};
createRoot(document.getElementById('app')).render(React.createElement(DesktopErgonWorkbench,{session,characterLabel:'한설',plan:{id:'p',kind:'altering',displayName:'목재+',targetQuantity:1},disabled:false,onAddPlan:()=>{throw Error('storage should not request redundant gathering');},view:'materials'}));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:390,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(fixture.origin);const region=page.getByRole('region',{name:'선택 작업 재료'});
 await region.getByText('! 원격 사용 확인',{exact:true}).waitFor();
 await region.getByText('필요 4개 · 가방 0개 · 원격 사용 시 부족 0개',{exact:true}).waitFor();
 await region.getByText('계정 창고 40개 · 캐릭터 창고 0개',{exact:true}).waitFor();await region.getByText('전송기·부스러기·게임 확인 필요',{exact:true}).waitFor();
 assert.equal(await region.getByText('✓ 보유 충분',{exact:true}).count(),0,'remote material is conditional, not free or confirmed');
 assert.equal(await region.getByRole('button',{name:/계획 추가/}).count(),0,'do not ask to gather already stored material');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 console.log('PASS real React bag0/storage40 requires transmitter/scrap approval, not false shortage/free stock');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
