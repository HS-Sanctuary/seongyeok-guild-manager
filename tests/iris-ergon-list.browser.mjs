// Real queue/row components; only parent state and native IO boundary are synthetic.
import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2])('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopErgonQueue}=require('@/components/iris/DesktopErgonQueue');
window.trial={quantityCommits:[],commands:[],replacements:[]};
function App(){const [plans,setPlans]=React.useState([{id:'a',kind:'crafting',displayName:'검',targetQuantity:1},{id:'b',kind:'altering',displayName:'아주 긴 상급 목재 이름 전체 표시',targetQuantity:20}]),[selected,setSelected]=React.useState('a'),[locked,setLocked]=React.useState(false);window.trial.setLocked=setLocked;return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopErgonQueue,{plans,goals:{},snapshots:{},now:Date.now(),scope:'a/c',active:!locked,presentation:'workbench',selectedId:selected,onChangePlans:next=>{window.trial.quantityCommits.push(next);setPlans(next);},onSelect:setSelected,onReplace:id=>window.trial.replacements.push(id),onOpenChange:()=>{}}));}createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:390,height:1000}});page.setDefaultTimeout(4000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(fixture.origin);const region=page.getByRole('region',{name:'전체 작업 대기열',exact:true});await region.waitFor();
 const quantity=region.getByLabel('검 추가 수량',{exact:true});await quantity.fill('20');assert.equal(await page.evaluate(()=>window.trial.quantityCommits.length),0);
 await quantity.press('Enter');await region.getByRole('button',{name:'검 선택',exact:true}).focus();assert.equal(await page.evaluate(()=>window.trial.quantityCommits.length),1);
 await quantity.fill('');await quantity.press('Escape');assert.equal(await quantity.inputValue(),'20');assert.equal(await page.evaluate(()=>window.trial.quantityCommits.length),1);
 await quantity.fill('0');await quantity.blur();assert.equal(await quantity.getAttribute('aria-invalid'),'true');assert.equal(await page.evaluate(()=>window.trial.quantityCommits.length),1);await quantity.press('Escape');
 await quantity.fill('1000000');await quantity.blur();assert.equal(await page.evaluate(()=>window.trial.quantityCommits.at(-1)[0].targetQuantity),1000000);
 await region.getByRole('button',{name:'검 교체',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.trial.replacements),['a']);
 await page.evaluate(()=>window.trial.setLocked(true));await page.waitForFunction(()=>document.querySelector('input[aria-label="검 추가 수량"]').disabled);assert.equal(await quantity.isDisabled(),true);assert.equal(await region.getByRole('button',{name:'검 제거',exact:true}).isDisabled(),true);
 await page.evaluate(()=>window.trial.setLocked(false));await region.getByRole('button',{name:'검 제거',exact:true}).click();assert.equal(await region.getByLabel('검 추가 수량',{exact:true}).count(),0);
 await region.getByRole('button',{name:'아주 긴 상급 목재 이름 전체 표시 제거',exact:true}).click();await region.getByText('품목을 담아 작업을 시작해 보세요.',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.trial.commands.length),0);assert.deepEqual(errors,[]);console.log('PASS visible queue draft/Enter-blur once/Escape/range/replace/locked/remove/empty; no game commands');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
