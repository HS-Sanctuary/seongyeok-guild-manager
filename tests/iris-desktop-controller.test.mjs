import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const moduleCache=new Map();
const {createDesktopQueue}=loadTS('lib/irisDesktopQueue.ts',{},moduleCache);
const create=existsSync('lib/irisDesktopController.ts')?loadTS('lib/irisDesktopController.ts',{},moduleCache).createDesktopController:undefined;
const key={category:'weekly',taskId:'9902',periodKey:'2026-10-04T21:00:00.000Z'};
test('expired unknown account permits reauthentication without replaying queue',async()=>{
  const {DesktopTransportError}=loadTS('lib/irisDesktopTransport.ts',{},moduleCache);
  const s=await setup({transport:{save:async()=>({kind:'unknown'}),login:async()=>({id:'account',nickname:'뉴월',role:'길드원'})}});
  await s.controller.edit(key,0,1);await s.controller.saveNow();
  s.transport.details=async()=>{throw new DesktopTransportError(401);};
  await s.controller.login('뉴월','synthetic',true);
  assert.equal(s.controller.state().account.id,'account');assert.equal(s.queue.snapshot().entries[0].phase,'unknown');
});
test('offline keep-close does not inspect network and closing can be retried',async()=>{
  const s=await setup({transport:{save:async()=>({kind:'unknown'})}});
  await s.controller.edit(key,0,1);await s.controller.saveNow();
  s.transport.details=async()=>{throw Error('offline');};
  await s.controller.shutdown('keep');await s.controller.shutdown('keep');
  assert.equal(s.queue.snapshot().entries[0].phase,'unknown');
});
test('refresh updates selected period without replacing outstanding intent',async()=>{
  const s=await setup();await s.controller.edit(key,0,1);const read=s.transport.details;
  s.transport.details=async(...args)=>{const d=await read(...args);d.writeContext.periodKeys.weekly='2026-10-11T21:00:00.000Z';return d;};
  await s.controller.refresh();assert.equal(s.controller.state().selected.writeContext.periodKeys.weekly,'2026-10-11T21:00:00.000Z');
  assert.equal(s.queue.snapshot().entries[0].periodKey,key.periodKey);
});
test('resume refresh waits for active save instead of losing boundary update',async()=>{
  const wait=deferred();const s=await setup({transport:{save:async()=>wait.promise}});
  await s.controller.edit(key,0,1);const saving=s.controller.saveNow();await new Promise(r=>setImmediate(r));
  const read=s.transport.details;s.transport.details=async(...args)=>{const d=await read(...args);d.writeContext.periodKeys.weekly='2026-10-11T21:00:00.000Z';return d;};
  const refresh=s.controller.refresh();wait.resolve({kind:'saved',completed:1});await saving;await refresh;
  assert.equal(s.controller.state().selected.writeContext.periodKeys.weekly,'2026-10-11T21:00:00.000Z');
});
test('unreadable store permits only explicit loss-confirmed close without overwriting it',async()=>{
  let writes=0;const s=await setup();
  const c=create({queue:s.queue,transport:s.transport,environment:'development',store:{load:async()=>{throw Error('corrupt');},replace:async()=>{writes++;}}});
  await assert.rejects(c.start());await assert.rejects(c.shutdown('keep'));
  await c.shutdownWithoutSaving();assert.equal(writes,0);assert.equal(c.state().locked,true);
});
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
test('character load failure remains distinct from an empty account and permits read-only retry',async()=>{
  const s=await setup();let writes=0;
  s.transport.characters=async()=>{throw Error('invalid response');};
  const c=create({queue:s.queue,transport:s.transport,environment:'development',store:{load:async()=>null,replace:async()=>{writes++;}}});
  await assert.rejects(c.start());
  assert.equal(c.state().account.id,'account');assert.equal(c.state().charactersLoaded,false);
  s.transport.characters=async()=>[];
  await c.reloadCharacters();
  assert.equal(c.state().charactersLoaded,true);assert.deepEqual(c.state().characters,[]);assert.equal(writes,0);
});
async function setup(overrides={}){
  assert.equal(typeof create,'function','Missing desktop authentication controller');
  let now=0,sequence=0,active='account';const log=[];
  const queue=createDesktopQueue({environment:'development',now:()=>now,id:()=>`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`});
  const transport={session:async()=>({id:active,nickname:'뉴월',role:'길드원'}),characters:async()=>[{id:'A',nickname:'젼설',job:'댄서',alias:null},{id:'B',nickname:'뉴월',job:'격투가',alias:null}],
    details:async(accountId,characterId)=>{log.push(['get',accountId,characterId]);return {accountId,characterId,observedAt:'2026-10-05T00:00:00.000Z',writeContext:{periodKeys:{daily:key.periodKey,weekly:key.periodKey,abyss:key.periodKey,raid:key.periodKey}},details:{schemaVersion:1,tasks:{daily:[],weekly:[{id:'9902',name:'뱅가드 브리치',total:3,completed:0}],abyss:[],raid:[]},classes:[]}};},
    save:async e=>{log.push(['post',e.accountId,e.characterId]);return {kind:'saved',completed:e.desiredCompleted};},
    switchAccount:async id=>{log.push(['switch',id]);active=id;return {id,nickname:'다른',role:'길드원'};},logout:async()=>log.push(['logout']),...overrides.transport};
  const store={load:async()=>null,replace:async()=>{},...overrides.store};
  const controller=create({queue,transport,store,environment:'development'});
  await controller.start();await controller.selectCharacter('A');log.length=0;
  return {controller,queue,log,transport,at:v=>now=v};
}
test('account switch waits for in-flight save and locks new edits immediately',async()=>{
  const wait=deferred();const s=await setup({transport:{save:async()=>wait.promise}});
  await s.controller.edit(key,0,1);s.at(15000);const sending=s.controller.tick();
  await new Promise(r=>setImmediate(r));const switching=s.controller.switchAccount('other');
  assert.equal(s.controller.state().locked,true);assert.throws(()=>s.controller.edit(key,0,2));
  assert.equal(s.log.filter(x=>x[0]==='switch').length,0);
  wait.resolve({kind:'saved',completed:1});await sending;await switching;
  assert.equal(s.controller.state().account.id,'other');assert.equal(s.queue.snapshot().entries.length,0);
});
test('unknown POST reconciles original character before account switch without repeat POST',async()=>{
  const s=await setup();let saved=false;
  s.transport.save=async e=>{s.log.push(['post',e.characterId]);saved=true;return {kind:'unknown'};};
  const read=s.transport.details;s.transport.details=async(...args)=>{const d=await read(...args);if(saved)d.details.tasks.weekly[0].completed=1;return d;};
  await s.controller.edit(key,0,1);await s.controller.saveNow();await s.controller.switchAccount('other');
  assert.equal(s.log.filter(x=>x[0]==='post').length,1);assert.equal(s.queue.snapshot().entries.length,0);
  assert.deepEqual(s.log.slice(-2),[['get','account','A'],['switch','other']]);
});
test('unknown baseline stays paused until explicit retry, idle ticks never write it',async()=>{
  const s=await setup({transport:{save:async()=>({kind:'unknown'})}});
  await s.controller.edit(key,0,1);await s.controller.saveNow();s.at(60000);await s.controller.tick();await s.controller.tick();
  assert.equal(s.queue.snapshot().entries[0].phase,'unknown');await s.controller.switchAccount('other');
  assert.equal(s.queue.snapshot().entries[0].accountId,'account');
});
test('character B view cannot be overwritten by late A save, now save starts without timer tick',async()=>{
  const wait=deferred();const s=await setup({transport:{save:async e=>{s.log.push(['post',e.characterId]);return wait.promise;}}});
  await s.controller.edit(key,0,1);const sending=s.controller.saveNow();await new Promise(r=>setImmediate(r));
  assert.equal(s.log.some(x=>x[0]==='post'),true);await s.controller.selectCharacter('B');
  wait.resolve({kind:'saved',completed:1});await sending;
  assert.equal(s.controller.state().selected.characterId,'B');assert.equal(s.controller.state().selected.details.tasks.weekly[0].completed,0);
});
test('storage failure locks further writes and never sends an undurable claim',async()=>{
  const s=await setup();s.controller.edit(key,0,1);await new Promise(r=>setImmediate(r));
  // New controller with failed protected-store replacement; restored edit remains conservative unknown.
  const failing=create({queue:s.queue,transport:s.transport,environment:'development',store:{load:async()=>null,replace:async()=>{throw Error('disk');}}});
  await failing.start();await failing.selectCharacter('A');await assert.rejects(failing.edit(key,0,2));
  await assert.rejects(failing.tick());assert.equal(s.log.some(x=>x[0]==='post'),false);assert.equal(failing.state().locked,true);
});
test('unauthorized save stops all subsequent transmissions',async()=>{
  const s=await setup({transport:{save:async()=>({kind:'unauthorized'})}});
  await s.controller.edit(key,0,1);await s.controller.saveNow();assert.equal(s.controller.state().account,null);
  s.at(60000);await s.controller.tick();assert.equal(s.queue.snapshot().entries[0].phase,'unknown');
});
test('idle minute issues zero POST and period rollover expires edit without sending',async()=>{
  const s=await setup();s.at(60000);await s.controller.tick();assert.equal(s.log.length,0);
  await s.controller.edit(key,0,1);const read=s.transport.details;
  s.transport.details=async(...args)=>{const d=await read(...args);d.writeContext.periodKeys.weekly='2026-10-11T21:00:00.000Z';return d;};
  await s.controller.saveNow();assert.equal(s.log.some(x=>x[0]==='post'),false);assert.equal(s.queue.snapshot().entries[0].phase,'expired');
});
test('save-and-close keeps editing locked for the entire draining request',async()=>{
  const wait=deferred();const s=await setup({transport:{save:async()=>wait.promise}});
  await s.controller.edit(key,0,1);const closing=s.controller.shutdown('save');await new Promise(r=>setImmediate(r));
  assert.equal(s.controller.state().locked,true);assert.throws(()=>s.controller.edit(key,0,2));
  wait.resolve({kind:'saved',completed:1});await closing;assert.equal(s.queue.snapshot().entries.length,0);
});
test('partial success removes only acknowledged requests and pauses conflicts',async()=>{
  const s=await setup();await s.controller.edit(key,0,1);await s.controller.selectCharacter('B');await s.controller.edit(key,0,1);
  s.transport.save=async e=>{s.log.push(['post',e.characterId]);return e.characterId==='A'?{kind:'saved',completed:1}:{kind:'conflict'};};
  s.at(20000);await s.controller.tick();assert.deepEqual(s.log.filter(x=>x[0]==='post'),[['post','A'],['post','B']]);
  assert.deepEqual(s.queue.snapshot().entries.map(e=>[e.characterId,e.phase]),[['B','conflict']]);
});
test('later character selection wins even when earlier selection waits on protected storage',async()=>{
  const wait=deferred();let pause=false;
  const s=await setup({store:{replace:async()=>{if(pause){pause=false;await wait.promise;}}}});
  await s.controller.edit(key,0,1);pause=true;const first=s.controller.selectCharacter('B');
  await new Promise(r=>setImmediate(r));await s.controller.selectCharacter('A');wait.resolve();await first;
  assert.equal(s.controller.state().selected.characterId,'A');
});

test('restart pauses former inflight and foreign-account work without automatic POST',async()=>{
  const s=await setup();await s.controller.edit(key,0,1);s.queue.claim(s.queue.snapshot().entries[0].requestId);
  const snapshot=s.queue.snapshot();snapshot.entries.push({...snapshot.entries[0],accountId:'other',requestId:'00000000-0000-4000-8000-000000000099',phase:'pending'});
  const restored=await setup({store:{load:async()=>snapshot}});
  restored.at(60000);await restored.controller.tick();
  assert.deepEqual(restored.queue.snapshot().entries.map(e=>e.phase),['unknown','unknown']);
  assert.equal(restored.log.filter(e=>e[0]==='post').length,0);
  await restored.controller.switchAccount('other');assert.equal(restored.log.filter(e=>e[0]==='post').length,0);
});

test('unreadable protected queue locks recovery rather than silently starting empty',async()=>{
  const s=await setup();let attempts=0;
  const broken=create({queue:s.queue,transport:s.transport,environment:'development',store:{load:async()=>{attempts++;throw Error('corrupt');},replace:async()=>{}}});
  await assert.rejects(broken.start());assert.equal(broken.state().durabilityError,true);
  await assert.rejects(broken.start());assert.equal(attempts,1);
});

test('ack updates displayed baseline so a second increment does not conflict with first save',async()=>{
  const s=await setup();let saved=0;const read=s.transport.details;
  s.transport.details=async(...args)=>{const d=await read(...args);d.details.tasks.weekly[0].completed=saved;return d;};
  s.transport.save=async e=>{saved=e.desiredCompleted;return {kind:'saved',completed:saved};};
  await s.controller.edit(key,0,1);await s.controller.saveNow();
  assert.equal(s.controller.state().selected.details.tasks.weekly[0].completed,1);
  await s.controller.edit(key,1,2);await s.controller.saveNow();assert.equal(saved,2);
});

test('explicit retry first checks unknown baseline and never posts when period expired',async()=>{
  const s=await setup({transport:{save:async()=>({kind:'unknown'})}});
  await s.controller.edit(key,0,1);await s.controller.saveNow();
  assert.equal(typeof s.controller.recover,'function');
  const id=s.queue.snapshot().entries[0].requestId;const read=s.transport.details;
  s.transport.details=async(...args)=>{const d=await read(...args);d.writeContext.periodKeys.weekly='2026-10-11T21:00:00.000Z';return d;};
  await s.controller.recover(id,'retry');assert.equal(s.queue.snapshot().entries[0].phase,'expired');
});

test('explicit recovery retries only verified baseline, discard removes related paused successors',async()=>{
  const s=await setup({transport:{save:async()=>({kind:'unknown'})}});
  await s.controller.edit(key,0,1);await s.controller.saveNow();const id=s.queue.snapshot().entries[0].requestId;
  assert.equal(typeof s.controller.recover,'function');
  s.transport.save=async()=>({kind:'saved',completed:1});await s.controller.recover(id,'retry');
  assert.equal(s.queue.snapshot().entries.length,0);
});

test('additional login cannot change cookies until old account unknown result inspected',async()=>{
  const s=await setup({transport:{save:async()=>({kind:'unknown'}),login:async()=>{s.log.push(['login']);return {id:'other',nickname:'한설',role:'길드원'};}}});
  await s.controller.edit(key,0,1);await s.controller.saveNow();
  assert.equal(typeof s.controller.login,'function');await s.controller.login('한설','synthetic-code',true);
  assert.deepEqual(s.log.slice(-2),[['get','account','A'],['login']]);assert.equal(s.controller.state().account.id,'other');
  assert.equal(JSON.stringify(s.controller.state()).includes('synthetic-code'),false);
});
