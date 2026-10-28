// Opt-in real PostgreSQL fixture. Never accepts a URL, operational env or data.
import {spawn,spawnSync} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
export const image='postgres@sha256:2cd2c0f809604aaeff6f0ec8f40aecbd025613107561015c69369a1a7f1d3416';
const docker=process.platform==='win32'?join(process.env.LOCALAPPDATA,'Programs/DockerDesktop/resources/bin/docker.exe'):'docker';
function run(args,input){const r=spawnSync(docker,args,{input,encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:4*1024*1024});if(r.error||r.status!==0)throw Error(`fixture docker ${args[0]} failed: ${r.stderr||r.error}`);return r.stdout.trim();}
export async function createPgFixture(){
 const owner=randomUUID(),project='astra-night-'+owner.slice(0,8),root=resolve('.superpowers/astra-online-night',owner);mkdirSync(root,{recursive:true});
 const password=join(root,'password.txt');writeFileSync(password,randomBytes(32).toString('hex'),{mode:0o600});
 const env={...process.env,ASTRA_VALIDATION_PROJECT:project,ASTRA_VALIDATION_OWNER:owner,ASTRA_TEST_POSTGRES_IMAGE:image,ASTRA_TEST_PASSWORD_FILE:password};
 const composeArgs=['compose','-f',resolve('tests/fixtures/astra-online.compose.yml'),'-p',project];
 const compose=args=>{const r=spawnSync(docker,[...composeArgs,...args],{env,encoding:'utf8',windowsHide:true,timeout:30000});if(r.error||r.status!==0)throw Error('owned compose failed: '+r.stderr);return r.stdout.trim();};
 const existing=compose(['ps','-aq']);if(existing)throw Error('new fixture project unexpectedly exists');
 const expectedImage=run(['image','inspect',image,'--format','{{.Id}}']);
 compose(['up','-d','--no-build','--pull','never']);
 const container=compose(['ps','-q','postgres']);if(!/^[0-9a-f]{64}$/.test(container))throw Error('ambiguous fixture container');
 function verify(){const [info]=JSON.parse(run(['inspect',container]));
  if(info.Config.Labels['sanctum.fixture.owner']!==owner||info.Config.Labels['com.docker.compose.project']!==project||info.Config.Labels['sanctum.fixture']!=='astra-online-validation'||info.Image!==expectedImage||info.HostConfig.NetworkMode!=='none'||Object.keys(info.HostConfig.PortBindings??{}).length||Object.keys(info.NetworkSettings.Networks??{}).some(n=>n!=='none')||!info.HostConfig.Tmpfs?.['/var/lib/postgresql/data'])throw Error('fixture ownership/isolation mismatch');
  for(const m of info.Mounts??[])if(m.Type!=='tmpfs'&&(m.Type!=='bind'||m.Destination!=='/run/secrets/astra_test_password'||m.RW||!m.Source.replaceAll('\\','/').endsWith('/'+owner+'/password.txt')))throw Error('unexpected fixture mount');
 }
 writeFileSync(join(root,'owner.json'),JSON.stringify({owner,project,container,image},null,2));
 verify();let ready=false;for(let i=0;i<20;i++){const r=spawnSync(docker,['exec',container,'pg_isready','-U','astra_fixture_admin','-d','astra_validation'],{encoding:'utf8',windowsHide:true,timeout:3000});if(r.status===0){ready=true;break;}}if(!ready){verify();run(['stop','--time','5',container]);throw Error('fixture PG did not become ready within bounded probes');}
 const prefix=['exec','-i','-e','PGOPTIONS=-c astra.validation_mode=isolated',container,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','astra_fixture_admin','-d','astra_validation'];
 function sql(text){verify();return run(prefix,text);}
 async function sqlAsync(text){verify();return await new Promise((done,reject)=>{const p=spawn(docker,prefix,{windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('exit',code=>code===0?done(out.trim()):reject(Error(err)));p.stdin.end(text);});}
 function session(){verify();const p=spawn(docker,prefix,{windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='',waiter=null,closed=false;
  p.stdout.on('data',b=>{out+=b;if(waiter&&out.includes(waiter.marker)){const w=waiter;waiter=null;const answer=out.slice(0,out.indexOf(w.marker));out=out.slice(out.indexOf(w.marker)+w.marker.length);clearTimeout(w.timer);w.done(answer.trim());}});
  p.stderr.on('data',b=>err+=b);p.on('error',e=>{if(waiter){clearTimeout(waiter.timer);waiter.reject(e);waiter=null;}});p.on('exit',code=>{closed=true;if(waiter){clearTimeout(waiter.timer);waiter.reject(Error(`psql exit ${code}: ${err}`));waiter=null;}});
  return {query(text){if(waiter||closed)throw Error('fixture session busy/closed');return new Promise((done,reject)=>{const marker='barrier_'+randomUUID().replaceAll('-','');const timer=setTimeout(()=>{p.kill();reject(Error('bounded SQL session deadline: '+err));},15000);waiter={marker,done,reject,timer};p.stdin.write(text+'\n\\echo '+marker+'\n');});},close(){p.stdin.end();},get stderr(){return err;}};
 }
 const fixture={owner,project,container,root,sql,sqlAsync,session,verify,stop(){verify();run(['stop','--time','5',container]);}};
 writeFileSync(join(root,'owner.json'),JSON.stringify({owner,project,container,image},null,2));
 return fixture;
}
export function bootstrapPg(f){
 f.sql(readFileSync('tests/fixtures/astra-online.pg-bootstrap.sql','utf8'));
 for(const path of ['supabase/proposals/20261028_account_activity.sql','supabase/proposals/20261028_account_online.sql'])f.sql(readFileSync(path,'utf8'));
 f.sql(readFileSync('tests/fixtures/astra-online.pg-cases.sql','utf8'));
}
