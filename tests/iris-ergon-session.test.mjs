import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonSession.ts')?loadTS('lib/irisErgonSession.ts'):{};
const frame={schemaVersion:1,kind:'inventory',source:'official-cli',observedAt:1000,data:{weight:2,maxWeight:100}};
test('duplicate refresh shares one read; disabled context starts no IO',async()=>{
 assert.equal(typeof api.createErgonSession,'function');let calls=0,resolve,active=true;
 const session=api.createErgonSession({read:()=>{calls++;return new Promise(r=>resolve=r)},allowed:()=>active,context:()=>1,onChange(){}});
 const a=session.refresh('inventory'),b=session.refresh('inventory');assert.equal(calls,1);
 resolve(frame);await Promise.all([a,b]);assert.equal(session.state().snapshots.inventory.data.weight,2);
 active=false;await session.refresh('inventory');assert.equal(calls,1);
});
test('switching character clears previous stock and prevents late snapshot adoption',async()=>{
 let resolve;const session=api.createErgonSession({read:()=>new Promise(r=>resolve=r),allowed:()=>true,context:()=>1,onChange(){}});
 let pending=session.refresh('inventory');resolve(frame);await pending;assert.equal(session.state().snapshots.inventory.data.weight,2);
 pending=session.refresh('inventory');assert.equal(typeof session.reset,'function');session.reset();assert.deepEqual(session.state().snapshots,{});resolve(frame);await pending;assert.deepEqual(session.state().snapshots,{});
});
test('suspension generation permanently discards reads even after returning',async()=>{
 let resolve;const session=api.createErgonSession({read:()=>new Promise(r=>resolve=r),allowed:()=>true,context:()=>1,onChange(){}});
 const operation=session.refresh('inventory');assert.equal(typeof session.invalidate,'function');session.invalidate();resolve(frame);await operation;
 assert.equal(session.state().snapshots.inventory,undefined);
});
test('context change discards late values and failures retain the last snapshot',async()=>{
 assert.equal(typeof api.createErgonSession,'function');let context=1,resolve,fail=false;
 const session=api.createErgonSession({read:()=>fail?Promise.reject(Error('offline')):new Promise(r=>resolve=r),allowed:()=>true,context:()=>context,onChange(){}});
 let operation=session.refresh('inventory');context=2;resolve(frame);await operation;assert.equal(session.state().snapshots.inventory,undefined);
 operation=session.refresh('inventory');resolve(frame);await operation;assert.equal(session.state().snapshots.inventory.observedAt,1000);
 fail=true;await session.refresh('inventory');assert.equal(session.state().snapshots.inventory.observedAt,1000);assert.match(session.state().notice,/offline/);
});
