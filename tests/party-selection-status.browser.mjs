// Actual three selection screens and CSS, isolated from all production IO.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname,extname} from 'node:path';
import ts from 'typescript';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const {chromium}=createRequire(process.argv[2])('playwright');
const repo=process.cwd(),modules=[],ids=new Map();
function include(file){
  file=resolve(file);if(ids.has(file))return ids.get(file);
  const id=modules.length;ids.set(file,id);modules.push(null);
  if(file===resolve('lib/supabase.ts')){modules[id]='exports.supabase={};';return id;}
  if(extname(file)==='.css'){modules[id]='module.exports={};';return id;}
  const local=createRequire(file);let source=readFileSync(file,'utf8');
  if(/\.tsx?$/.test(file))source=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  modules[id]=source.replace(/require\(["']([^"']+)["']\)/g,(_,name)=>{
    const base=name.startsWith('@/')?resolve(repo,name.slice(2)):name.startsWith('.')?resolve(dirname(file),name):null;
    const target=base&&[base,base+'.ts',base+'.tsx',base+'.js',resolve(base,'index.js')].find(f=>existsSync(f)&&extname(f));
    return `require(${include(target||local.resolve(name))})`;
  });return id;
}
const req=createRequire(resolve('package.json')),react=include(req.resolve('react')),client=include(req.resolve('react-dom/client'));
const screens=['components/party/modals/JoinPartyModal.tsx','components/party/GuildBusJoinModal.tsx','components/party/modals/BusCreateModal.tsx'].map(include);
const bundle=`(()=>{const process={env:{NODE_ENV:'development'}};const modules={${modules.map((code,id)=>`${id}:(require,module,exports)=>{${code}\n}`).join(',')}};const cache={};function require(id){if(cache[id])return cache[id].exports;const module=cache[id]={exports:{}};modules[id](require,module,module.exports);return module.exports;}window.components={React:require(${react}),createRoot:require(${client}).createRoot,screens:[${screens.map(id=>`require(${id}).default`).join(',')}]};})();`;
const css=(await postcss([tailwind({base:repo})]).process(readFileSync('app/globals.css','utf8'),{from:resolve('app/globals.css')})).css;
const browser=await chromium.launch({channel:'msedge',headless:true});let passed=0;
try{
  for(const mode of [0,1,2]){
    const context=await browser.newContext({viewport:{width:390,height:850}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}):r.abort('blockedbyclient'));
    await page.goto('http://selection-status.test/');
    await page.setContent(`<style>${css}\nhtml{font-size:18px!important}body{margin:0;background:#191919;color:#eee;--panel:#0d0d0d;--inner-box:#101010;--panel-border:#333;--accent:#edcd85;--accent-fg:#000;--text-main:#eee;--text-sub:#aaa;--accent-soft:#302817}</style><main id="mount"></main>`);
    await page.addScriptTag({content:bundle});
    await page.evaluate(mode=>{
      const {React,createRoot,screens}=window.components,Modal=screens[mode],noop=()=>{};
      const chars=[{id:9,nickname:'열두글자캐릭터이름테스트',job:'대검전사',raid_checks:'[1,"어비스 - 허상의 정박지"]',combat_power:100000,magic_resistance:3000},{id:10,nickname:'다른캐릭터',job:'힐러',raid_checks:{2:true,4:true}},{id:11,nickname:'확인불가',job:'전사'}];
      const catalog={loaded:true,error:null,classes:[],powerReqs:[{content_name:'카브락',content_type:'raid',difficulty:'어려움',max_members:8}],contents:[{id:1,type:'raid',name:'레이드 - 카브락',is_active:true},{id:2,type:'raid',name:'레이드 - 에이렐',is_active:true},{id:3,type:'abyss',name:'어비스 - 허상의 정박지',is_active:true},{id:4,type:'abyss',name:'어비스 - 광기의 동굴',is_active:true},{id:5,type:'raid',name:'숨겨진 레이드',is_active:false},{id:6,type:'daily',name:'일일 미션',is_active:true}]};
      const party={id:7,content_name:'레이드 - 카브락',difficulty:'어려움',party_date:'2026-10-09',time_start:'20:00',time_end:'23:59',max_members:8,status:'모집중',members:[]};
      window.fixture={submitted:[],catalog,chars};window.fetch=()=>{throw Error('No network expected');};
      function App(){
        const [selected,setSelected]=React.useState('다른캐릭터'),[selection,setSelection]=React.useState({}),[open,setOpen]=React.useState(true),[memo,setMemo]=React.useState('성역 길드 버스');
        const props=mode===0?{catalog,joinPopupParty:open?party:null,setJoinPopupParty:()=>setOpen(false),myCharacters:chars,joinSelectedChar:selected,setJoinSelectedChar:setSelected,joinTimeStart:'20:00',joinTimeEnd:'23:59',getDayOfWeekKorean:()=>'',executeJoinParty:()=>window.fixture.submitted.push(selected)}:mode===1?{catalog,isOpen:open,onClose:()=>setOpen(false),myCharacters:chars,onSubmit:data=>window.fixture.submitted.push(data),contentName:party.content_name,difficulty:'어려움'}:{catalog,showBusCreateModal:open,setShowBusCreateModal:setOpen,myCharacters:chars,busCreateContent:{id:'raid_1',name:'레이드 - 카브락',category:'레이드',size:8},setBusCreateContent:noop,busCreateDiff:'어려움',setBusCreateDiff:noop,busCreateDate:'2026-10-09',setBusCreateDate:noop,busCreateTimeStart:'20:00',setBusCreateTimeStart:noop,busCreateTimeEnd:'23:59',setBusCreateTimeEnd:noop,busCreateMemo:memo,setBusCreateMemo:setMemo,busCharSelections:selection,setBusCharSelections:setSelection,handleCreateGuildBus:()=>window.fixture.submitted.push(selection)};
        return React.createElement(Modal,props);
      }
      createRoot(document.querySelector('#mount')).render(React.createElement(App));
    },mode);
    if(mode===2)await page.getByRole('button',{name:/다음: 캐릭터 선택/}).click();
    const selector=page.getByRole(mode===0?'radio':'checkbox',{name:'열두글자캐릭터이름테스트 참가 선택',exact:true});
    const trigger=page.getByRole('button',{name:'열두글자캐릭터이름테스트 완료 상태 보기',exact:true});
    // Bus join intentionally preselects the first character; inspection must preserve that default too.
    if(mode===1)await selector.check();
    const selectedBefore=await selector.isChecked();
    await trigger.click({timeout:5000});
    assert.equal(await selector.isChecked(),selectedBefore,'inspection must not change participation');
    const region=page.getByRole('region',{name:'열두글자캐릭터이름테스트 레이드·어비스 완료 상태'});
    await region.waitFor();
    for(const [name,status] of [['카브락','완료'],['에이렐','미완료'],['허상의 정박지','완료'],['광기의 동굴','미완료']]){
      assert.ok((await region.getByRole('listitem').filter({hasText:name}).innerText()).includes(status));
    }
    assert.equal(await region.getByText('숨겨진 레이드').count(),0);assert.equal(await region.getByText('일일 미션').count(),0);
    await selector.check();assert.equal(await trigger.getAttribute('aria-expanded'),'true','selection preserves inspection');
    await trigger.click();assert.equal(await region.count(),0);assert.equal(await selector.isChecked(),true);
    await page.getByRole('button',{name:'다른캐릭터 완료 상태 보기',exact:true}).click();
    const other=page.getByRole('region',{name:'다른캐릭터 레이드·어비스 완료 상태'});
    assert.ok((await other.getByRole('listitem').filter({hasText:'에이렐'}).innerText()).includes('완료'));
    await page.getByRole('button',{name:'확인불가 완료 상태 보기',exact:true}).click();
    assert.equal(await other.count(),0,'one inspection open at a time');
    assert.ok((await page.getByRole('region',{name:'확인불가 레이드·어비스 완료 상태'}).innerText()).includes('확인할 수 없어요'));
    await trigger.click();
    for(const width of [320,390,768,1280])for(const font of [18,20,22]){
      await page.setViewportSize({width,height:850});await page.evaluate(font=>document.documentElement.style.setProperty('font-size',font+'px','important'),font);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${mode}/${width}/${font} document overflow`);
      const size=await region.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,rect:el.getBoundingClientRect().toJSON()}));
      assert.ok(size.scroll<=size.width,`${mode}/${width}/${font} panel overflow`);assert.ok(size.rect.left>=0&&size.rect.right<=width,`${mode}/${width}/${font} panel boundary`);
      const name=await trigger.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert.ok(name.scroll<=name.width,`${mode}/${width}/${font} nickname clipping`);
    }
    await page.setViewportSize({width:390,height:850});await page.evaluate(()=>document.documentElement.style.setProperty('font-size','18px','important'));
    await page.screenshot({path:resolve(`.next/party-selection-${mode}-390.png`)});
    assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>window.fixture.submitted.length),0);
    await context.close();console.log(`PASS ${['normal join','bus join','bus create'][mode]}: completion, separate selection, unknown data, 12 responsive combinations`);passed++;
  }
}finally{await browser.close();}
console.log(`${passed} selection browser scenarios passed; no production IO`);
