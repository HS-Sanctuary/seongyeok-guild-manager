import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonCollection.ts')?loadTS('lib/irisErgonCollection.ts'):{};
const now=100000,frame=(items,observedAt=now)=>({schemaVersion:1,kind:'works',observedAt,source:'official-cli',data:{completedCount:items.filter(i=>i.completed).length,items}});
const row=(name,facility,completed=true)=>({name,facility,completed,state:null,remainingSeconds:completed?0:60});
test('collection selects one unambiguous completed anchor and previews every completed job in that facility',()=>{
 assert.equal(typeof api.ergonCollectionPreview,'function');const p=api.ergonCollectionPreview(frame([row('철괴','금속'),row('철괴','금속'),row('강철','금속'),row('목재','목재'),row('대기','금속',false)]),'금속',now);
 assert.equal(p.displayName,'철괴');assert.equal(p.ready,true);assert.deepEqual(p.completed,[{displayName:'철괴',count:2},{displayName:'강철',count:1}]);
});
test('same-name outputs in two facilities cannot redirect collection; another unique anchor is allowed',()=>{
 assert.equal(typeof api.ergonCollectionPreview,'function');const f=frame([row('공통','금속'),row('공통','목재')]);assert.equal(api.ergonCollectionPreview(f,'금속',now).ready,false);
 assert.equal(api.ergonCollectionPreview(frame([...f.data.items,row('강철','금속')]),'금속',now).displayName,'강철');
});
test('missing, old, empty, and unknown-completion observations never permit preparation',()=>{
 assert.equal(typeof api.ergonCollectionPreview,'function');for(const f of [null,frame([row('철괴','금속')],1),frame([]),frame([row('철괴','금속'),{...row('불명','금속'),completed:null}])])assert.equal(api.ergonCollectionPreview(f,'금속',now).ready,false);
});

const identity={accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'화선연'};
function actionTrial(){const calls=[];return {calls,api:{lifeActionCapabilities:async()=>({oneClickCollection:true,automaticReconciliation:true,collectionPolicyVersion:1}),setLifeContext:async value=>calls.push(['context',value]),lifeActionState:async()=>{throw Error('old blocked flag must not preempt native reconciliation');},collectLifeAction:async value=>{calls.push(['collect',value]);return {schemaVersion:1,id:value.requestId,state:'cancelled'};}}};}
const preview=()=>api.ergonCollectionPreview(frame([row('철괴','금속')]),'금속',now);
test('OneClickUsesOnlyCollectEndpoint and NativeReconciliationNotPreemptedByOldBlockedFlag',async()=>{
 assert.equal(typeof api.requestErgonCollection,'function');const trial=actionTrial();const receipt=await api.requestErgonCollection(trial.api,identity,preview(),()=>true);
 assert.equal(receipt.state,'cancelled');assert.deepEqual(trial.calls.map(c=>c[0]),['context','collect']);const sent=trial.calls[1][1];assert.deepEqual(Object.keys(sent).sort(),['requestId','requestedAt','accountId','characterId','facility','displayName'].sort());assert.equal(sent.facility,'금속');assert.equal(sent.displayName,'철괴');assert.equal(sent.requestId,receipt.id);assert.ok(Number.isSafeInteger(sent.requestedAt));
});
test('unreadable preview cannot submit a collection',async()=>{
 const trial=actionTrial();await assert.rejects(()=>api.requestErgonCollection(trial.api,identity,{...preview(),ready:false},()=>true));assert.equal(trial.calls.length,0);
});
test('LegacyCapabilitiesDoNotPretendAutomation',async()=>{
 const trial=actionTrial();trial.api.lifeActionCapabilities=async()=>({oneClickCollection:false});await assert.rejects(()=>api.requestErgonCollection(trial.api,identity,preview(),()=>true),/최신/);assert.equal(trial.calls.length,0);
});
test('leaving context during capability preparation never submits or resumes a click',async()=>{
 const trial=actionTrial();let current=true;trial.api.lifeActionCapabilities=async()=>{current=false;return {oneClickCollection:true,automaticReconciliation:true,collectionPolicyVersion:1};};assert.equal(await api.requestErgonCollection(trial.api,identity,preview(),()=>current),null);assert.equal(trial.calls.length,0);
});
test('leaving during native preflight cancels only its own click and still retains a committed receipt',async()=>{
 const trial=actionTrial();let current=true,finish;trial.api.collectLifeAction=value=>new Promise(resolve=>{trial.calls.push(['collect',value]);finish=()=>resolve({schemaVersion:1,id:value.requestId,state:'running'});});trial.api.cancelLifeAction=async nonce=>trial.calls.push(['cancel',nonce]);const pending=api.requestErgonCollection(trial.api,identity,preview(),()=>current);while(!finish)await new Promise(resolve=>setImmediate(resolve));current=false;await new Promise(resolve=>setTimeout(resolve,150));assert.equal(trial.calls.at(-1)[0],'cancel');assert.equal(trial.calls.at(-1)[1],trial.calls.find(c=>c[0]==='collect')[1].requestId);finish();assert.equal((await pending).state,'running');assert.equal(trial.calls.filter(c=>c[0]==='collect').length,1);
});
