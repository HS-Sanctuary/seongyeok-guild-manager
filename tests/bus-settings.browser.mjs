// Actual React edit dialog/CSS; synthetic directory and HTTP only. Never writes a real bus.
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
  if(file===resolve('lib/supabase.ts')){modules[id]='exports.supabase={from:()=>window.fixture.query};';return id;}
  if(extname(file)==='.css'){modules[id]='module.exports={};';return id;}
  const local=createRequire(file);let source=readFileSync(file,'utf8');
  if(/\.tsx?$/.test(file))source=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  modules[id]=source.replace(/require\(["']([^"']+)["']\)/g,(_,name)=>{
    const base=name.startsWith('@/')?resolve(repo,name.slice(2)):name.startsWith('.')?resolve(dirname(file),name):null;
    const target=base&&[base,base+'.ts',base+'.tsx',base+'.js',resolve(base,'index.js')].find(f=>existsSync(f)&&extname(f));
    return `require(${include(target||local.resolve(name))})`;
  });return id;
}
const req=createRequire(resolve('package.json')),react=include(req.resolve('react')),client=include(req.resolve('react-dom/client')),modal=include(resolve('components/party/modals/BusEditModal.tsx'));
const bundle=`(()=>{const process={env:{NODE_ENV:'development'}};const modules={${modules.map((code,id)=>`${id}:(require,module,exports)=>{${code}\n}`).join(',')}};const cache={};function require(id){if(cache[id])return cache[id].exports;const module=cache[id]={exports:{}};modules[id](require,module,module.exports);return module.exports;}window.components={React:require(${react}),createRoot:require(${client}).createRoot,Modal:require(${modal}).default};})();`;
const css=(await postcss([tailwind({base:repo})]).process(readFileSync('app/globals.css','utf8'),{from:resolve('app/globals.css')})).css;
const browser=await chromium.launch({channel:'msedge',headless:true});let passed=0;
async function fixture({holdGet=false}={}){
  const context=await browser.newContext({viewport:{width:390,height:850}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}):r.abort('blockedbyclient'));
  await page.goto('http://bus-settings.test/');
  await page.setContent(`<style>${css}\nhtml{font-size:18px!important}body{margin:0;background:#191919;color:#eee;--panel:#0d0d0d;--inner-box:#101010;--panel-border:#333;--accent:#edcd85;--accent-fg:#000;--text-main:#eee;--text-sub:#aaa;--accent-soft:#302817}</style><main id="mount"></main>`);
  await page.addScriptTag({content:bundle});
  await page.evaluate(({holdGet})=>{
    const {React,createRoot,Modal}=window.components;
    const characters=Array.from({length:8},(_,i)=>({id:i+1,nickname:i===0?'열두글자캐릭터이름테스트':`참가${i}`,owner:i===0||i===6?'제스':`계정${i}`,job:'대검전사',combat_power:'100000',magic_resistance:'3000'}));
    const members=characters.slice(0,6).map((c,i)=>({name:c.nickname,character_name:c.nickname,character_id:c.id,job:c.job,owner:c.owner,time_start:i===0?'22:00':'20:00',time_end:i===0?'23:00':'23:59',allow_repeat:true}));
    const party={id:7,leader_name:'제스',status:'모집중',content_name:'레이드 - 카브락',difficulty:'어려움',party_date:'2026-10-09',time_start:'20:00',time_end:'23:59',max_members:8,sub_content:'[성역 길드 버스] 원래 안내',memo:'[성역 길드 버스] 원래 안내',selected_sub_contents:null,members};
    const catalog={loaded:true,error:null,classes:[],contents:[],powerReqs:[{content_name:'카브락',content_type:'raid',difficulty:'어려움',max_members:8},{content_name:'에이렐',content_type:'raid',difficulty:'어려움',max_members:4}]};
    window.fixture={posts:[],held:[],fail:false,saved:0,holdPost:false,holdGet,characters};
    window.fixture.query={select(){return this;},eq(key,value){this.filter=[key,value];return this;},order(){return this;},async then(done){if(window.fixture.holdGet)await new Promise(r=>window.fixture.releaseGet=r);return done({data:this.filter?characters.filter(c=>c[this.filter[0]]===this.filter[1]):characters,error:null});}};
    window.confirm=()=>true;
    window.fetch=async(url,init)=>{
      if(url!=='/api/member-mutations')throw Error('Unexpected external IO');
      const f=window.fixture;f.posts.push(JSON.parse(init.body));
      if(f.holdPost)await new Promise(r=>f.held.push(r));
      return new Response(JSON.stringify(f.fail?{message:'다른 화면에서 변경됐어요. 새로고침해주세요.'}:{data:[]}),{status:f.fail?409:200});
    };
    function App(){const [open,setOpen]=React.useState(false);return React.createElement(React.Fragment,null,React.createElement('button',{onClick:()=>setOpen(true)},'버스 수정 열기'),open&&React.createElement(Modal,{party,catalog,accountNickname:'제스',onClose:()=>setOpen(false),onSaved:()=>{window.fixture.saved++;}}));}
    createRoot(document.querySelector('#mount')).render(React.createElement(App));
  },{holdGet});
  await page.getByRole('button',{name:'버스 수정 열기'}).click();
  if(!holdGet)await page.getByRole('dialog',{name:'길드 버스 수정',exact:true}).waitFor();
  return {page,context,errors};
}
async function run(name,body,options){const f=await fixture(options);try{await body(f);assert.deepEqual(f.errors,[]);passed++;console.log('PASS '+name);}finally{await f.context.close();}}
const notice=p=>p.getByPlaceholder('버스 승객 안내용 공지');
const participants=p=>p.getByRole('button',{name:/2️⃣ 참가자 선택/});
const submit=p=>p.getByRole('button',{name:/수정 저장 · 재편성/});
try{
  await run('content change preserves custom notice, four seats retain six registrants and individual times',async({page})=>{
    await notice(page).fill('오늘은 에이렐로 변경합니다');
    await page.getByText('카브락',{exact:true}).click();
    await page.getByRole('button',{name:/에이렐/}).click();await page.getByRole('button',{name:'적용하기',exact:true}).click();
    assert.equal(await notice(page).inputValue(),'오늘은 에이렐로 변경합니다');
    await page.getByText(/출전 정원 4명 · 등록 6캐릭터/).waitFor();await participants(page).click();
    assert.equal(await page.getByRole('checkbox',{name:/참가 선택$/}).count(),1);
    assert.equal(await page.getByLabel('열두글자캐릭터이름테스트 참가 시작',{exact:true}).count(),0);
    await page.getByText('다른 계정 참가자 · 신청 정보 유지',{exact:true}).waitFor();
    assert.equal(await page.getByRole('checkbox',{name:'참가1 참가 선택',exact:true}).count(),0);
    await submit(page).click();await page.waitForFunction(()=>window.fixture.saved===1);
    const data=await page.evaluate(()=>window.fixture.posts[0].payload._busSettings);
    assert.equal(data.contentId,'raid_eirel');assert.equal(data.members.length,1);assert.equal(data.members[0].timeStart,undefined);assert.equal(data.memo,'오늘은 에이렐로 변경합니다');
  });
  await run('visible errors retain draft; explicit participant changes; pending save blocks duplicate and close',async({page})=>{
    await notice(page).fill('오류에도 남을 공지');await participants(page).click();
    await page.getByRole('button',{name:'내 캐릭터 추가·교체'}).click();await page.getByRole('checkbox',{name:'참가6 참가 선택',exact:true}).check();
    assert.equal(await page.getByRole('checkbox',{name:'참가7 참가 선택',exact:true}).count(),0);
    await page.getByRole('checkbox',{name:'열두글자캐릭터이름테스트 참가 선택',exact:true}).uncheck();
    await page.evaluate(()=>window.fixture.fail=true);await submit(page).click();await page.getByRole('alert').waitFor();
    await page.getByRole('button',{name:/1️⃣ 버스 수정 설정/}).click();assert.equal(await notice(page).inputValue(),'오류에도 남을 공지');
    await participants(page).click();await page.evaluate(()=>{window.fixture.fail=false;window.fixture.holdPost=true;});await submit(page).click();
    await page.waitForFunction(()=>window.fixture.held.length===1);await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog',{name:'길드 버스 수정',exact:true}).count(),1);
    await page.getByRole('button',{name:'저장 중…'}).evaluate(b=>{b.click();b.click();});assert.equal(await page.evaluate(()=>window.fixture.posts.length),2);
    const data=await page.evaluate(()=>window.fixture.posts[1].payload._busSettings);assert.equal(data.members.length,1);assert.equal(data.members[0].name,'참가6');assert.equal(data.members[0].timeStart,undefined);
    await page.evaluate(()=>window.fixture.held[0]());await page.waitForFunction(()=>window.fixture.saved===1);
  });
  await run('responsive edit stays inside screen, long name and time controls remain usable',async({page})=>{
    await participants(page).click();
    for(const width of [320,390,768,1280])for(const font of [18,20,22]){
      await page.setViewportSize({width,height:850});await page.evaluate(font=>document.documentElement.style.setProperty('font-size',font+'px','important'),font);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}/${font} document overflow`);
      const bounds=await page.getByRole('dialog',{name:'길드 버스 수정',exact:true}).evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,rect:el.getBoundingClientRect().toJSON()}));
      assert.ok(bounds.scroll<=bounds.width,`${width}/${font} dialog overflow`);
      assert.ok(bounds.rect.left>=0&&bounds.rect.right<=width,`${width}/${font} dialog boundary`);
      const button=await submit(page).evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert.ok(button.scroll<=button.width,`${width}/${font} save button clipping`);
    }
    await page.setViewportSize({width:390,height:850});await page.evaluate(()=>document.documentElement.style.setProperty('font-size','18px','important'));await page.screenshot({path:resolve('.next/bus-settings-390.png')});
    await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.getByRole('button',{name:'버스 수정 열기'}).evaluate(b=>document.activeElement===b),true);
  });
  await run('Escape dismisses content panel before editor and backdrop closes main editor',async({page})=>{
    await notice(page).fill('보존할 입력');await page.getByText('카브락',{exact:true}).click();await page.getByText('목표 컨텐츠 선택',{exact:true}).waitFor();await page.keyboard.press('Escape');
    assert.equal(await page.getByText('목표 컨텐츠 선택',{exact:true}).count(),0);assert.equal(await notice(page).inputValue(),'보존할 입력');
    await page.mouse.click(1,1);assert.equal(await page.getByRole('dialog').count(),0);
  });
  await run('loading can be dismissed without waiting on directory',async({page})=>{
    await page.getByRole('dialog',{name:'길드 버스 수정 준비'}).waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
    await page.evaluate(()=>window.fixture.releaseGet());assert.equal(await page.evaluate(()=>window.fixture.posts.length),0);
  },{holdGet:true});
}finally{await browser.close();}
console.log(`${passed} bus-settings browser scenarios passed; no real network writes`);
