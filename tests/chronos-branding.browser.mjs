// Real display components; synthetic navigation/notifications only, no game or DB IO.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2]??import.meta.url)('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{navItems}=require('@/types/layout'),Navbar=require('@/components/layout/Navbar').default,Mobile=require('@/components/layout/MobileBottomSheet').default,Checkboard=require('@/components/sanctum/KronosCheckboardSection').default,Join=require('@/components/party/GuildBusJoinModal').default,{DesktopMainTabs}=require('@/components/iris/DesktopMainTabs');
window.trial={paths:[],sections:[]};
function App(){const h=React.useRef(null),w=React.useRef(null),a=React.useRef(null),[open,O]=React.useState(false),[join,J]=React.useState(false);return React.createElement(React.Fragment,null,
React.createElement(Navbar,{headerRef:h,wingsRef:w,accountMenuRef:a,showNavbar:true,banner:null,pathname:'/character',navItems,isWingsOpen:false,setIsWingsOpen(){},isNotificationInboxOpen:false,setIsNotificationInboxOpen(){},isAccountMenuOpen:false,setIsAccountMenuOpen(){},setIsThemeModalOpen(){},mounted:true,activeAccount:null,accounts:[],switchAccount(){},pendingCount:0,handleLogout(){}}),
React.createElement('main',{style:{padding:'1rem',marginTop:'9rem'}},React.createElement(Checkboard,{myCharacters:[],dailyTasks:[],weeklyTasks:[],abyssList:[],raidList:[],accountProgressRate:0,checkTaskDone:()=>false,formatName:s=>s,router:{push:p=>window.trial.paths.push(p)}}),React.createElement('div',{className:'iris-desktop',id:'iris-test'},React.createElement(DesktopMainTabs,{section:'kronos',locked:false,onChoose:id=>window.trial.sections.push(id)})),React.createElement('button',{onClick:()=>J(true)},'합성 탑승창 열기')),
React.createElement(Mobile,{fabPosition:{x:12},handlePointerDown(){},handleMenuClick:()=>O(!open),isFabOpen:open,setIsFabOpen:O,isDraggingSheet:false,sheetDragY:0,handleSheetDragStart(){},setIsThemeModalOpen(){},navItems,pathname:'/character'}),
React.createElement(Join,{catalog:{classes:[],contents:[],powerReqs:[],loaded:true,error:''},isOpen:join,onClose:()=>J(false),myCharacters:[],onSubmit(){throw Error('Submission forbidden');},contentName:'허상의 접전',difficulty:'어려움'}));}
createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry,{
 'next/link':`module.exports=({children,href,onClick,...props})=>require('react').createElement('a',{...props,href,onClick:e=>{onClick?.(e);e.preventDefault();window.trial.paths.push(href);}},children);`,
 'next/navigation':`exports.useRouter=()=>({push:p=>window.trial.paths.push(p)});`,
 '@/hooks/useNoticeNotifications':`exports.useNoticeNotifications=()=>({browserPermission:'default',isLoaded:true,markAllAsRead(){},markAsRead(){},notifications:[],readIds:[],requestBrowserPermission:async()=>'default',unreadCount:0,preferences:{},setModuleEnabled(){},settingsError:''});`,
 './IrisWelcomeGuide':`module.exports=()=>null;`,
});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith(fixture.origin)?r.continue():r.abort());
 await page.goto(fixture.origin);
 const desktop=page.locator('.sanctum-nav-link[href="/character"]');
 await desktop.hover();
 assert.equal(await desktop.locator('.sanctum-nav-reveal').innerText(),'CHRONOS');
 await desktop.click();
 await page.getByRole('button',{name:'Learn More'}).click();
 await page.locator('#iris-test').getByRole('button',{name:'크로노스',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>window.trial.paths),['/character','/character']);
 assert.deepEqual(await page.evaluate(()=>window.trial.sections),['kronos']);
 for(const width of [320,390,768,1280])for(const font of [18,20,22]){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',font);
  const title=page.getByRole('heading',{name:'CHRONOS Check Board'});
  await title.waitFor();
  assert.equal(await title.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Checkboard title must not clip');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Display rename must not add horizontal page scrolling');
  if(width<640){
   await page.getByRole('button',{name:'성역 메뉴 열기',exact:true}).click();
   const mobile=page.locator('a[href="/character"]').filter({hasText:'CHRONOS'}).last();
   await mobile.waitFor({state:'visible'});assert.match(await mobile.innerText(),/크로노스/);
   await mobile.click();assert.equal((await page.evaluate(()=>window.trial.paths)).at(-1),'/character');
  }
 }
 if(process.env.CHRONOS_QA_CAPTURE==='1'){
  mkdirSync('.superpowers/sdd/2026-10-20-chronos-branding',{recursive:true});
  await desktop.hover();
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.sanctum-nav-link[href="/character"] .sanctum-nav-reveal')).opacity)>.95);
  await page.screenshot({path:'.superpowers/sdd/2026-10-20-chronos-branding/desktop.png',fullPage:true});
 }
 await page.getByRole('button',{name:'합성 탑승창 열기'}).click();
 await page.getByRole('button',{name:/버스 탑승 가이드 및 이용 안내/}).click();
 await page.getByText('완수 시 CHRONOS 주간 숙제 체크리스트가 자동으로 동기화됩니다.',{exact:true}).waitFor({state:'visible'});
 if(process.env.CHRONOS_QA_CAPTURE==='1'){
  await page.setViewportSize({width:390,height:900});
  await page.screenshot({path:'.superpowers/sdd/2026-10-20-chronos-branding/mobile-guide.png',fullPage:true});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS CHRONOS desktop/mobile/home/IRIS labels, existing route and protocol, guide, 12 responsive/font combinations; synthetic IO only');
}finally{await browser.close();await new Promise(done=>fixture.server.close(done));}
