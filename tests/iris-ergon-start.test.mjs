import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonStart.ts')?loadTS('lib/irisErgonStart.ts'):{};
const flags=['autoPlaying','autoTraveling','dead','reviving','inCombat','dialoguePlaying','waitingForSelection','inBattlefield','tutorialPlaying','inScenario','sequencePlaying','performancePlaying','minigame','housingEdit','abyssSequence'];
const snapshots={activity:{kind:'activity',observedAt:1000,data:{...Object.fromEntries(flags.map(k=>[k,false])),dungeonState:'NotInDungeon',interactionType:'None'}},inventory:{kind:'inventory',observedAt:1000,data:{weight:10,maxWeight:100}},gathering:{kind:'gathering',observedAt:1000,data:{items:[{name:'통나무',toolOk:true}]}}};
const input={snapshots,currencies:{observedAt:new Date(1000).toISOString(),items:[{name:'정령의 날개',amount:10}]},kind:'gathering',displayName:'통나무',now:1001,unresolved:false,identityConfirmed:false};
test('dry-run requires explicit game identity and keeps execution disconnected',()=>{
 assert.equal(typeof api.checkErgonStart,'function');const value=api.checkErgonStart(input);
 assert.equal(value.canExecute,false);assert.equal(value.wings,10);assert.equal(value.costPerCommand,5);assert.equal(value.blockers.length,2);assert.ok(value.blockers.some(x=>x.includes('캐릭터')));
 const confirmed=api.checkErgonStart({...input,identityConfirmed:true});assert.equal(confirmed.canExecute,false);assert.ok(confirmed.blockers.some(x=>x.includes('실행 연결')));
});
test('active or unknown interaction is never treated as safe idle',()=>{
 for(const interactionType of ['Gathering','Talk',null])assert.ok(api.checkErgonStart({...input,snapshots:{...snapshots,activity:{...snapshots.activity,data:{...snapshots.activity.data,interactionType}}}}).blockers.some(x=>x.includes('게임 상태')));
});
test('each unsafe or unknown game state blocks; stale/overweight/wings and unresolved are checked',()=>{
 assert.equal(typeof api.checkErgonStart,'function');
 for(const flag of flags)for(const value of [true,null]){const result=api.checkErgonStart({...input,snapshots:{...snapshots,activity:{...snapshots.activity,data:{...snapshots.activity.data,[flag]:value}}}});assert.ok(result.blockers.some(x=>x.includes('게임 상태')));}
 for(const change of [{now:16000},{unresolved:true},{currencies:{...input.currencies,items:[{name:'정령의 날개',amount:4}]}},{snapshots:{...snapshots,inventory:{...snapshots.inventory,data:{weight:100,maxWeight:100}}}}])assert.ok(api.checkErgonStart({...input,...change}).blockers.length>2);
});
