// Real component DOM in an isolated document. No app server, native bridge, accounts or database.
// Run: node tests/iris-focus-ui.browser.mjs <bundled Node package.json>
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname,extname} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import ts from 'typescript';

const {chromium}=createRequire(process.argv[2])('playwright');
const repo=process.cwd(),modules=[],ids=new Map(),styles=[];
function include(file){
  file=resolve(file);
  if(ids.has(file))return ids.get(file);
  const id=modules.length;ids.set(file,id);modules.push(null);
  if(extname(file)==='.css'){styles.push(readFileSync(file,'utf8'));modules[id]='module.exports={};';return id;}
  const localRequire=createRequire(file);
  let source=readFileSync(file,'utf8');
  if(/\.tsx?$/.test(file))source=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  modules[id]=source.replace(/require\(["']([^"']+)["']\)/g,(_,name)=>{
    let target;
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?resolve(repo,name.slice(2)):resolve(dirname(file),name);
      target=[base,base+'.ts',base+'.tsx',base+'.js',base+'.json',resolve(base,'index.js')].find(path=>existsSync(path)&&extname(path));
    }
    target??=localRequire.resolve(name);
    return `require(${include(target)})`;
  });
  return id;
}
const require=createRequire(resolve(repo,'package.json'));
const react=include(require.resolve('react')),client=include(require.resolve('react-dom/client'));
const classes=include(resolve(repo,'components/iris/DesktopClasses.tsx'));
const watch=include(resolve(repo,'components/iris/DesktopCharacterWatch.tsx'));
const statsSession=include(resolve(repo,'components/iris/DesktopStatsSession.tsx'));
const bundle=`(()=>{const process={env:{NODE_ENV:'development'}};const modules={${modules.map((code,id)=>`${id}:(require,module,exports)=>{${code}\n}`).join(',')}};const cache={};function require(id){if(cache[id])return cache[id].exports;const module=cache[id]={exports:{}};modules[id](require,module,module.exports);return module.exports;}window.focusComponents={React:require(${react}),createRoot:require(${client}).createRoot,DesktopClasses:require(${classes}).DesktopClasses,DesktopCharacterWatch:require(${watch}).DesktopCharacterWatch,DesktopStatsSession:require(${statsSession}).DesktopStatsSession};})();`;
const css=readFileSync(resolve(repo,'app/iris/desktop/desktop.css'),'utf8')+'\n'+styles.join('\n');
const browser=await chromium.launch({channel:'msedge',headless:true});
const scenario=process.env.IRIS_FOCUS_SCENARIO;
let passed=0;
async function fixture({width=390,height=900,audio='running'}={}){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',route=>route.abort('blockedbyclient'));
  await page.clock.install({time:new Date('2026-10-09T04:00:00.000Z')});
  await page.clock.pauseAt(new Date('2026-10-09T04:00:00.010Z'));
  await page.setContent(`<style>html{font-size:20px;--text-main:#e8e5dd;--text-muted:#b1afa8;--panel:#1b1d22;--panel-border:#484b55;--inner-box:#292d35;--accent:#e0bd65}*{box-sizing:border-box}body{margin:0}button,input{font:inherit}p,h2,h3{margin:0}${css}
  .fixture-shell{height:100dvh;display:flex;flex-direction:column;padding:.4rem}
  .fixture-header{flex:none;height:5rem}.fixture-pane{min-height:0;flex:1;display:flex;flex-direction:column}
  </style><div class="fixture-shell iris-desktop"><button class="iris-desktop-button" id="opener">외부 조작</button><header class="fixture-header">IRIS 센터</header><section class="fixture-pane" id="mount"></section></div>`);
  await page.addScriptTag({content:bundle});
  await page.evaluate(audio=>{
    window.fixture={selected:[],chooseOther:0,reads:0,settled:0,version:1,gameId:'A',previous:null,hold:false,held:[],cues:0,audio,fetches:0};
    window.fetch=async()=>{window.fixture.fetches++;throw Error('No remote calls are permitted in this fixture');};
    window.AudioContext=class{
      state=audio==='suspended'?'suspended':'running';currentTime=0;destination={};
      constructor(){if(audio==='failed')throw Error('Audio unavailable');}
      createOscillator(){return {type:'sine',frequency:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},start(){window.fixture.cues++;},stop(){this.onended?.();},onended:null};}
      createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
      resume(){return this.state==='suspended'?new Promise(()=>{}):Promise.resolve();}
      close(){this.state='closed';return Promise.resolve();}
    };
    const {React,createRoot,DesktopClasses,DesktopCharacterWatch,DesktopStatsSession}=window.focusComponents;
    const root=createRoot(document.querySelector('#mount'));
    const rows=[{id:'A',nickname:'현재캐릭터',job:'전사',stats:{combat_power:'10000',life_energy:'2000',magic_resistance:'1000',charm:'3000'}},{id:'B',nickname:'가나다라마바사아자차카타',job:'검술사',stats:{combat_power:'20000',life_energy:'4000',magic_resistance:'2000',charm:'6000'}},{id:'C',nickname:'세번째캐릭터',job:'궁수',stats:{combat_power:'30000',life_energy:'5000',magic_resistance:'3000',charm:'9000'}}];
    let lastTimestamp=Date.now()-1;
    const game=()=>{const f=window.fixture,row=rows.find(row=>row.id===f.gameId);lastTimestamp=Math.max(Date.now(),lastTimestamp+1);return {observedAt:new Date(lastTimestamp).toISOString(),job:row.job,level:100,stats:Object.fromEntries(Object.entries(row.stats).map(([key,value])=>[key,Number(value)]))};};
    const readGame=async()=>{const f=window.fixture,snapshot=game();f.reads++;if(f.hold)await new Promise(resolve=>f.held.push(resolve));f.settled++;return snapshot;};
    const getContextVersion=()=>window.fixture.version,getPreviousGame=()=>window.fixture.previous,onGameRead=game=>{window.fixture.previous=game;};
    function Watch(){const [locked,setLocked]=React.useState(false);window.fixtureSetLock=setLocked;return React.createElement(DesktopCharacterWatch,{accountId:'account',characterId:'A',characters:rows,locked,readGame,getContextVersion,getPreviousGame,onGameRead,onCharactersRead(){},onSelectCharacter(id){window.fixture.selected.push(id);return true;},onChooseOther(){window.fixture.chooseOther++;}});}
    window.fixtureMountWatch=()=>root.render(React.createElement(Watch));
    window.fixtureMountInitialSuggestion=()=>{
      window.fixture.gameId='B';
      window.fetch=async(input,init)=>{window.fixture.fetches++;if(input!=='/api/iris/stats'||init?.method!=='GET')throw Error('Only the synthetic initial stats catalog is permitted');return new Response(JSON.stringify({accountId:'account',characters:rows}),{status:200,headers:{'Content-Type':'application/json'}});};
      root.render(React.createElement(DesktopStatsSession,{accountId:'account',characterId:null,locked:false,readGame,watchVersion:1,getContextVersion,onSelectCharacter(id){window.fixture.selected.push(id);return true;},onChooseOther(){window.fixture.chooseOther++;},children:({suggestion})=>suggestion}));
    };
    window.fixtureMountClasses=()=>{const names=['전사','대검전사','검술사','기사','마법사','화염술사','빙결술사','전격술사','궁수','장궁병','석궁사수','음유시인','댄서','악사','힐러','사제','수도사','암흑술사','도적','격투가','듀얼블레이드'];const classes=names.map((name,i)=>({id:String(i),name,level:53}));root.render(React.createElement(DesktopClasses,{selected:{accountId:'account',characterId:'A',writeContext:{classes:classes.map(row=>({classId:row.id,editable:true,baseLevel:53}))},details:{classes}},pending:[],locked:false,onClassDraft(){}}));};
  },audio);
  return {page,context,errors};
}
const prompt=page=>page.getByRole('dialog',{name:'캐릭터 변경 추천',exact:true});
async function poll(page,advance=3000){
  const reads=await page.evaluate(()=>window.fixture.reads);
  await page.clock.runFor(advance);await delay(80);
  assert.equal(await page.evaluate(()=>window.fixture.reads),reads+1,'One read per completed polling interval');
}
async function mountWatch(page){await page.locator('#opener').focus();await page.evaluate(()=>window.fixtureMountWatch());await delay(80);assert.equal(await page.evaluate(()=>window.fixture.reads),1);}
async function offer(page,id='B'){
  await page.evaluate(id=>{window.fixture.gameId=id;},id);await poll(page);await poll(page,1000);
}
async function run(name,body,options){
  if(scenario&&scenario!==name)return;
  const f=await fixture(options);
  try{await body(f);assert.deepEqual(f.errors,[]);assert.equal(await f.page.evaluate(()=>window.fixture.fetches),options?.expectedFetches??0);passed++;console.log('PASS '+name);}
  finally{await f.context.close();}
}
try{
  // A shared three-column grid or a nickname inside the action labels makes the initial pair wrap and leave an unused third column.
  await run('initial-recommendation-two-actions',async({page})=>{
    await page.evaluate(()=>window.fixtureMountInitialSuggestion());await delay(100);
    const dialog=page.getByRole('dialog',{name:'접속 캐릭터 추천',exact:true});assert.equal(await dialog.count(),1);
    const layouts=[];
    for(const width of [320,390])for(const font of [18,20,22]){
      await page.setViewportSize({width,height:800});await page.evaluate(font=>{document.documentElement.style.fontSize=font+'px';},font);
      const layout=await dialog.evaluate(dialog=>{
        const actions=dialog.querySelector('.iris-switch-actions'),box=actions.getBoundingClientRect(),gap=parseFloat(getComputedStyle(actions).columnGap),buttons=[...actions.querySelectorAll('button')];
        const name=[...dialog.querySelectorAll('strong')].find(node=>node.textContent==='가나다라마바사아자차카타');
        const nameBox=name?.getBoundingClientRect(),nameStyle=name&&getComputedStyle(name);
        return {buttons:buttons.map(button=>{const bounds=button.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(button);return {label:button.textContent,lines:new Set([...range.getClientRects()].filter(rect=>rect.width>0).map(rect=>Math.round(rect.top*10)/10)).size,width:bounds.width,left:bounds.left,right:bounds.right,top:bounds.top};}),left:box.left,right:box.right,pairWidth:(box.width-gap)/2,name:name?.textContent,nameVisible:!!nameBox&&nameBox.width>0&&nameBox.top>=0&&nameBox.bottom<=innerHeight&&nameStyle.textOverflow!=='ellipsis'&&name.scrollWidth<=name.clientWidth,overflow:document.documentElement.scrollWidth>innerWidth};
      });
      layouts.push({width,font,...layout});
    }
    const failures=layouts.filter(layout=>layout.buttons.length!==2||layout.buttons.some(button=>button.lines!==1||Math.abs(button.width-layout.pairWidth)>2)||Math.abs(layout.buttons[0].left-layout.left)>2||Math.abs(layout.buttons[1].right-layout.right)>2||Math.abs(layout.buttons[0].top-layout.buttons[1].top)>2||!layout.nameVisible||layout.overflow);
    if(failures.length){
      await page.setViewportSize({width:320,height:800});await page.evaluate(()=>{document.documentElement.style.fontSize='18px';});
      await page.screenshot({path:'.superpowers/sdd/2026-10-09-iris-barter-focus/initial-recommendation-red.png'});
    }
    assert.deepEqual(failures,[],'Initial recommendation actions must stay on one line, occupy two equal full-width columns, and leave the complete 12-character nickname readable');
    assert.deepEqual(await page.evaluate(()=>window.fixture.selected),[],'Presenting the initial recommendation never selects automatically');
    await page.setViewportSize({width:390,height:800});await page.evaluate(()=>{document.documentElement.style.fontSize='20px';});
    await page.screenshot({path:'.superpowers/sdd/2026-10-09-iris-barter-focus/initial-recommendation-green.png'});
  },{width:320,height:800,expectedFetches:1});
  // Retaining the old capped list height leaves hundreds of pixels unused.
  await run('all-class-height',async({page})=>{
    await page.evaluate(()=>window.fixtureMountClasses());await delay(80);
    for(const width of [320,390])for(const height of [1400,900,560]){
      await page.setViewportSize({width,height});
      const bounds=await page.locator('.iris-class-list').evaluate(list=>{const pane=list.closest('.fixture-pane').getBoundingClientRect(),root=list.parentElement.getBoundingClientRect(),box=list.getBoundingClientRect(),footer=list.nextElementSibling.getBoundingClientRect();return {pane:pane.height,root:root.height,list:box.height,space:pane.bottom-footer.bottom,bottom:footer.bottom,scroll:list.scrollHeight>list.clientHeight,overflow:document.documentElement.scrollWidth>innerWidth};});
      assert.ok(Math.abs(bounds.space)<4,`The complete class pane must use remaining ${width}x${height} height: ${JSON.stringify(bounds)}`);
      assert.ok(bounds.bottom<=height,'Footer remains inside the viewport');assert.equal(bounds.overflow,false);
      if(height<=900)assert.equal(bounds.scroll,true,'Only the long list scrolls');
    }
    await page.setViewportSize({width:390,height:1400});await page.getByRole('button',{name:'궁수',exact:true}).click();
    const natural=await page.locator('.iris-class-list').evaluate(list=>({height:list.getBoundingClientRect().height,rows:[...list.children].reduce((sum,row)=>sum+row.getBoundingClientRect().height,0),scroll:list.scrollHeight>list.clientHeight,footer:list.nextElementSibling.getBoundingClientRect().bottom}));
    assert.ok(natural.height<350,'A short family does not stretch its rows through the window');assert.equal(natural.scroll,false);assert.ok(natural.footer<700);
  },{height:1400});
  // An inline panel or missing trap allows focus to escape into the underlying HUD.
  await run('focus-dialog',async({page})=>{
    await mountWatch(page);await offer(page);
    assert.equal(await prompt(page).count(),1,'Recommendation is a focused dialog');
    for(const width of [320,390])for(const height of [280,900]){
      await page.setViewportSize({width,height});
      const bounds=await prompt(page).evaluate(dialog=>{const box=dialog.getBoundingClientRect();return {top:box.top,bottom:box.bottom,center:(box.top+box.bottom)/2,overflow:document.documentElement.scrollWidth>innerWidth};});
      assert.ok(bounds.top>=0&&bounds.bottom<=height);assert.ok(Math.abs(bounds.center-height/2)<3);assert.equal(bounds.overflow,false);
    }
    assert.equal(await prompt(page).getByText('가나다라마바사아자차카타',{exact:true}).count(),1);
    await prompt(page).getByRole('button',{name:'다른 캐릭터',exact:true}).focus();await page.keyboard.press('Tab');
    assert.equal(await prompt(page).evaluate(dialog=>dialog.contains(document.activeElement)),true);
    await page.keyboard.press('Escape');assert.equal(await prompt(page).count(),0);assert.equal(await page.locator('#opener').evaluate(button=>button===document.activeElement),true);
    assert.deepEqual(await page.evaluate(()=>window.fixture.selected),[]);await poll(page);assert.equal(await prompt(page).count(),0);
  });
  // Re-announcing every polling object produces repeated sound for one visible offer.
  await run('single-sound',async({page})=>{
    await mountWatch(page);await offer(page);assert.equal(await page.evaluate(()=>window.fixture.cues),1,'One cue for a newly displayed candidate');
    await poll(page);await poll(page);assert.equal(await page.evaluate(()=>window.fixture.cues),1,'Repeated observations never repeat the cue');
    await page.evaluate(()=>{window.fixture.gameId='C';});await poll(page);await poll(page,1000);assert.equal(await page.evaluate(()=>window.fixture.cues),2,'A distinct newly offered candidate gets its own cue');
  });
  await run('audio-failure-keeps-offer',async({page})=>{
    await mountWatch(page);await offer(page);assert.equal(await prompt(page).count(),1);await prompt(page).getByRole('button',{name:'아니요',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.fixture.selected),[]);
  },{audio:'failed'});
  await run('autoplay-keeps-offer',async({page})=>{
    await mountWatch(page);await offer(page);await page.clock.runFor(300);await delay(40);assert.equal(await prompt(page).count(),1);assert.equal(await page.evaluate(()=>window.fixture.cues),0);await page.keyboard.press('Escape');
  },{audio:'suspended'});
  await run('backdrop-dismiss-suppresses-repeat',async({page})=>{
    await mountWatch(page);await offer(page);await page.mouse.click(2,2);assert.equal(await prompt(page).count(),0);
    await poll(page);await poll(page);assert.equal(await prompt(page).count(),0);assert.deepEqual(await page.evaluate(()=>window.fixture.selected),[]);assert.equal(await page.evaluate(()=>window.fixture.cues),1);
  });
  await run('choose-other-uses-existing-picker',async({page})=>{
    await mountWatch(page);await offer(page);await prompt(page).getByRole('button',{name:'다른 캐릭터',exact:true}).click();
    assert.equal(await prompt(page).count(),0);assert.equal(await page.evaluate(()=>window.fixture.chooseOther),1);assert.deepEqual(await page.evaluate(()=>window.fixture.selected),[]);
  });
  // A pre-lock CLI reply cannot create a modal underneath account/settings/close.
  await run('lock-invalidates-delayed-offer',async({page})=>{
    await mountWatch(page);await page.evaluate(()=>{window.fixture.gameId='B';});await poll(page);
    await page.evaluate(()=>{window.fixture.hold=true;});await page.clock.runFor(1000);await delay(60);
    await page.evaluate(()=>window.fixtureSetLock(true));await delay(60);await page.evaluate(()=>{window.fixture.hold=false;for(const release of window.fixture.held.splice(0))release();});await delay(80);
    const reads=await page.evaluate(()=>window.fixture.reads);await page.clock.runFor(9000);await delay(50);
    assert.equal(await page.evaluate(()=>window.fixture.reads),reads);assert.equal(await prompt(page).count(),0);assert.deepEqual(await page.evaluate(()=>window.fixture.selected),[]);
    await page.evaluate(()=>window.fixtureSetLock(false));await delay(60);await page.clock.runFor(900);await delay(60);assert.equal(await prompt(page).count(),0,'Resume still needs fresh confirmation');
    await page.clock.runFor(100);await delay(80);assert.equal(await prompt(page).count(),1);
  });
  // Yes always rereads; a changed game must leave the selected character intact.
  await run('confirm-rechecks-and-keeps-selection',async({page})=>{
    await mountWatch(page);await offer(page);await page.evaluate(()=>{window.fixture.gameId='C';});
    const reads=await page.evaluate(()=>window.fixture.reads);await prompt(page).getByRole('button',{name:'네',exact:true}).click();await delay(80);
    assert.ok(await page.evaluate(()=>window.fixture.reads)>reads);assert.deepEqual(await page.evaluate(()=>window.fixture.selected),[]);assert.equal(await prompt(page).count(),0);
  });
  await run('confirm-selects-only-fresh-candidate',async({page})=>{
    await mountWatch(page);await offer(page);const reads=await page.evaluate(()=>window.fixture.reads);
    await prompt(page).getByRole('button',{name:'네',exact:true}).click();await delay(80);
    assert.ok(await page.evaluate(()=>window.fixture.reads)>reads);assert.deepEqual(await page.evaluate(()=>window.fixture.selected),['B']);assert.equal(await prompt(page).count(),0);
  });
  console.log(`Focus UI: ${passed} scenarios passed; isolated real React components, external IO blocked`);
}finally{await browser.close();}
