// Opt-in native GUI. Synthetic sessions/lease model, real production API handler and WebView cookies.
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {start043Fixture} from './account-online-043.fixture.mjs';
if(process.platform!=='win32')throw Error('Windows only');
const sdk=process.argv[process.argv.indexOf('--sdk')+1];if(!process.argv.includes('--sdk')||!sdk)throw Error('--sdk requires an already present SDK directory; no installation');
const fixture=await start043Fixture();let child,manifest;const probes=[];
async function eventually(check,label){for(let i=0;i<150;i++){if(check())return;await new Promise(d=>setTimeout(d,100));}throw Error(label);}
async function probe(profile){
 mkdirSync(profile,{recursive:true});writeFileSync(join(profile,'fixture-owner.txt'),fixture.owner);
 const p=spawn(manifest.exe,['--test-root',profile,'--owned-gui','--connection-probe'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 const result={p,profile,output:'',code:null};probes.push(result);
 const timer=setTimeout(()=>p.kill(),60000);
 p.stdout.on('data',b=>{result.output+=b;process.stdout.write(b);});p.stderr.on('data',b=>result.output+=b);
 result.exit=new Promise((done,reject)=>{p.on('error',reject);p.on('exit',code=>{clearTimeout(timer);result.code=code;writeFileSync(join(profile,'probe-native.log'),result.output);done(code);});});
 await eventually(()=>{if(p.exitCode!==null)throw Error('owned probe exited before ready: '+result.output);return result.output.includes('probe_ready');},'owned probe readiness');return result;
}
try{
 const manifestPath=join(fixture.snapshot.out,'gui-build.json');
 const compiled=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','tests/iris-online-043-build.ps1','-Owner',fixture.owner,'-Manifest',manifestPath,'-Sdk',resolve(sdk)],{encoding:'utf8',windowsHide:true,timeout:30000});
 writeFileSync(join(fixture.snapshot.out,'compile-run.log'),compiled.stdout+'\n'+compiled.stderr);assert.equal(compiled.status,0,compiled.stderr||compiled.stdout);
 manifest=JSON.parse(readFileSync(manifestPath,'utf8'));assert.equal(manifest.owner,fixture.owner);assert.ok(manifest.profile.startsWith(manifest.out));
 console.log('Launching owned 043 full DesktopPage; only synthetic sessions/lease model. Ports 3000 owned.');
 const exit=await new Promise((done,reject)=>{
  child=spawn(manifest.exe,['--test-root',manifest.profile,'--owned-gui','--full-ui'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';
  child.stdout.on('data',b=>{output+=b;process.stdout.write(b);});child.stderr.on('data',b=>output+=b);
  const timer=setTimeout(()=>{child.kill();reject(Error('owned GUI 150s deadline'));},150000);
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',code=>{clearTimeout(timer);writeFileSync(join(fixture.snapshot.out,'native.log'),output);done(code);});
 });
 if(exit!==0){let detail='';try{detail=readFileSync(join(manifest.profile,'failure.txt'),'utf8');}catch{}throw Error('Full GUI failed '+exit+': '+detail);}
 const native=JSON.parse(readFileSync(join(manifest.profile,'result.json'),'utf8'));
 assert.equal(native.status,'PASS');assert.equal(fixture.state().accounts.length,0,'normal UI close must leave');
 assert.ok(fixture.events.some(e=>e.path==='/api/auth/login'));assert.ok(fixture.events.some(e=>e.path==='/api/auth/switch'));assert.ok(fixture.events.some(e=>e.path==='/api/auth/logout'));assert.ok(fixture.metrics.touch>=5);assert.ok(fixture.metrics.leave>=4);
 console.log('Native duplicate / owned crash / TTL / surviving connection / same-profile restart');
 const first=await probe(join(manifest.out,'profiles','probe-one')),before=fixture.connections().length;
 const second=await probe(join(manifest.out,'profiles','probe-two'));
 assert.equal(fixture.state().accounts.length,1,'two native processes deduplicate account');assert.ok(fixture.connections().length>before,'second native process has a distinct connection');
 first.p.kill();await first.exit;assert.equal(fixture.state().accounts.length,1,'crash keeps lease until TTL');
 fixture.advance(721000);assert.equal(fixture.state().accounts.length,0,'crashed lease expires by synthetic TTL');
 writeFileSync(join(second.profile,'tick.request'),'owned');await eventually(()=>second.output.includes('probe_tick'),'survivor resumed heartbeat');assert.equal(fixture.state().accounts.length,1);
 writeFileSync(join(second.profile,'close.request'),'owned');assert.equal(await second.exit,0,'second owned UI normal close');assert.equal(fixture.state().accounts.length,0);
 const loginCount=fixture.events.filter(e=>e.path==='/api/auth/login').length,restarted=await probe(first.profile);
 assert.equal(fixture.events.filter(e=>e.path==='/api/auth/login').length,loginCount,'restart resumes actual cookie from own profile');assert.equal(fixture.state().accounts.length,1);
 writeFileSync(join(restarted.profile,'close.request'),'owned');assert.equal(await restarted.exit,0);assert.equal(fixture.state().accounts.length,0);
 const result={...native,normalCloseLeaveObserved:true,nativeDuplicateProcesses:true,ownedCrashTTL:true,survivingConnectionResume:true,sameOwnedProfileCookieRestart:true,owner:fixture.owner,baseline:manifest.baseline,sourceSnapshot:fixture.snapshot.out,nativeSnapshot:manifest.out,apiEvents:fixture.events,metrics:fixture.metrics,operationalAccess:0,limitations:['DB is the existing synthetic lease model, not PostgreSQL','Tray menu commands invoked programmatically; no physical taskbar click','Synthetic 721s clock advance and forced heartbeat; no OS sleep or NIC changes','No actual game, user IRIS, operational account or user profile accessed']};
 writeFileSync(join(fixture.snapshot.out,'gui-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}catch(error){writeFileSync(join(fixture.snapshot.out,'gui-failure.json'),JSON.stringify({error:String(error),state:fixture.state(),events:fixture.events,manifest},null,2));throw error;}
finally{if(child&&child.exitCode===null)child.kill();for(const probe of probes)if(probe.p.exitCode===null)probe.p.kill();await Promise.allSettled(probes.map(p=>p.exit));await fixture.close();console.log('Owned 043 fixture closed; port 3000 released.');}
