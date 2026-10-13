import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonRead.ts')?loadTS('lib/irisErgonRead.ts'):{};
const frame=(kind,data)=>({schemaVersion:1,kind,observedAt:1000,source:'official-cli',data});
const material={name:'통나무',category:'Ingredient',categoryName:'재료',location:'inventory',count:3,locked:false};
const recipe={name:'목재',available:true,producedPerUnit:3,reason:null,missing:null};
test('owned materials keep bag/storage/locked quantities separate instead of merging',()=>{
  assert.equal(typeof api.parseErgonSnapshot,'function');
  const value=api.parseErgonSnapshot('materials',frame('materials',{items:[material,{...material,location:'account_storage',count:7},{...material,locked:true,count:10}]}));
  assert.deepEqual(value.data.items.map(x=>[x.location,x.count,x.locked]),[['inventory',3,false],['account_storage',7,false],['inventory',10,true]]);
});
test('missing recipe data is not interpreted as a complete bill of materials or zero cost',()=>{
  assert.equal(typeof api.parseErgonSnapshot,'function');
  const value=api.parseErgonSnapshot('crafting',frame('crafting',{unlocked:true,items:[recipe,{...recipe,name:'요리',producedPerUnit:null,available:null,missing:[{name:'고기',required:2,owned:1}]}]}));
  assert.equal(value.data.items[0].missing,null);assert.equal(value.data.items[1].producedPerUnit,null);assert.equal(value.data.items[1].available,null);
  assert.throws(()=>api.parseErgonSnapshot('crafting',frame('crafting',{unlocked:true,items:[{...recipe,producedPerUnit:-1}]})));
});
test('large legitimate catalogs are accepted whole and excessive lists rejected whole',()=>{
  assert.equal(typeof api.parseErgonSnapshot,'function');
  const items=Array.from({length:2048},(_,i)=>({...material,name:'재료'+i}));
  assert.equal(api.parseErgonSnapshot('materials',frame('materials',{items})).data.items.length,2048);
  assert.throws(()=>api.parseErgonSnapshot('materials',frame('materials',{items:[...items,material]})));
});
test('malformed envelopes, commands, quantities and labels never become usable snapshots',()=>{
  assert.equal(typeof api.parseErgonSnapshot,'function');const good=frame('materials',{items:[material]});
  for(const bad of [{...good,source:'unknown'},{...good,observedAt:NaN},{...good,observedAt:0},{...good,kind:'execute_gathering'},{...good,extra:true}])assert.throws(()=>api.parseErgonSnapshot('materials',bad));
  for(const field of [{count:-1},{count:1.5},{count:'3'},{count:Number.MAX_SAFE_INTEGER+1},{locked:'false'},{name:'x'.repeat(161)},{name:'통\n나무'},{location:'anywhere'}])assert.throws(()=>api.parseErgonSnapshot('materials',frame('materials',{items:[{...material,...field}]})));
});
test('read snapshots preserve fractional weight, incomplete status and facility jobs',()=>{
  assert.equal(typeof api.parseErgonSnapshot,'function');
  assert.deepEqual(api.parseErgonSnapshot('inventory',frame('inventory',{weight:12.5,maxWeight:null})).data,{weight:12.5,maxWeight:null});
  const jobs={completedCount:null,items:[{name:'목재',facility:'목공',state:'InProgress',completed:false,remainingSeconds:150}]};
  assert.deepEqual(api.parseErgonSnapshot('works',frame('works',jobs)).data,jobs);
  assert.deepEqual(api.parseErgonSnapshot('gathering',frame('gathering',{items:[{name:'통나무',toolOk:null}]})).data.items,[{name:'통나무',toolOk:null}]);
  assert.deepEqual(api.parseErgonSnapshot('altering',frame('altering',{unlocked:null,items:[{...recipe,producedPerUnit:0}]})).data.items[0].producedPerUnit,0);
});
test('unknown activity is preserved, never coerced to safe idle state',()=>{
  assert.equal(typeof api.parseErgonSnapshot,'function');
  const data=Object.fromEntries(['autoPlaying','autoTraveling','dead','reviving','inCombat','dialoguePlaying','waitingForSelection','inBattlefield','tutorialPlaying','inScenario','sequencePlaying','performancePlaying','minigame','housingEdit','abyssSequence','dungeonState','interactionType'].map(k=>[k,null]));
  assert.deepEqual(api.parseErgonSnapshot('activity',frame('activity',data)).data,data);
  assert.throws(()=>api.parseErgonSnapshot('activity',frame('activity',{...data,inCombat:'false'})));
});
test('old, future and invalid clock readings are never fresh',()=>{
  assert.equal(typeof api.ergonSnapshotStale,'function');const snapshot=frame('inventory',{weight:1,maxWeight:100});
  assert.equal(api.ergonSnapshotStale(snapshot,15999),false);assert.equal(api.ergonSnapshotStale(snapshot,16000),true);assert.equal(api.ergonSnapshotStale(snapshot,999),true);assert.equal(api.ergonSnapshotStale(snapshot,NaN),true);
});
