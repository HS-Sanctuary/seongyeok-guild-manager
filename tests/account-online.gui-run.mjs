// Opt-in Windows selftest. Own process + own profile + own loopback PG only.
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {startPgOnlineFixture} from './account-online.pg-http.fixture.mjs';
if(process.platform!=='win32')throw Error('Windows fixture only');
const fixture=await startPgOnlineFixture();let child=null;
try{
 const build=spawnSync('powershell.exe',['-NoProfile','-File','tests/iris-online-validation-build.ps1','-PrepareGui','-Owner',fixture.pg.owner],{encoding:'utf8',windowsHide:true,timeout:30000});
 assert.equal(build.status,0,build.stderr||build.stdout);
 const manifest=JSON.parse(readFileSync('.superpowers/astra-online-validation/test-build.json','utf8').replace(/^\uFEFF/,''));
 assert.equal(manifest.status,'OWNED_GUI_SELFTEST_PREPARED');assert.ok(manifest.testRoot.endsWith(fixture.pg.owner));
 console.log('Owned PostgreSQL/API verified; launching only isolated GUI PID. Real 300s hidden heartbeat test follows.');
 const exit=await new Promise((done,reject)=>{
  child=spawn(manifest.exe,['--test-root',manifest.testRoot,'--owned-gui','--selftest'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';
  child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  const timer=setTimeout(()=>{child.kill();reject(Error('owned GUI selftest exceeded 420s'));},420000);
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',code=>{clearTimeout(timer);done({code,output});});
 });
 if(exit.code!==0){let detail='';try{detail=readFileSync(join(manifest.testRoot,'gui-failure.txt'),'utf8');}catch{}throw Error('owned GUI failed '+exit.code+': '+detail+' '+exit.output);}
 const result=JSON.parse(readFileSync(join(manifest.testRoot,'gui-result.json'),'utf8')),state=fixture.state();
 assert.equal(result.status,'PASS');assert.equal(state.accounts.length,0,'normal close must leave in actual DB');assert.equal(state.metrics.activity,0);assert.ok(state.metrics.irisTouch>=4);assert.ok(state.metrics.leave>=3);
 const report={...result,normalCloseObserved:true,realPostgreSQL:true,sourceBaseline:'ca69770 floating native + served web components',metrics:state.metrics,physicalDevices:1,limitations:['Test page is not the complete DesktopWorkspace/login UI','Network failure/TTL tested in browser+PG; no host NIC change or sleep test','Tray icon + hidden form; not a manual taskbar menu click'],operationalWrites:0};
 writeFileSync('.superpowers/astra-online-night/gui-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(error){writeFileSync('.superpowers/astra-online-night/gui-diagnostic.json',JSON.stringify(fixture.state(),null,2));throw error;}
finally{if(child&&child.exitCode===null)child.kill();await fixture.close();}
