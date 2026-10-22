import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
const {createDesktopQueue}=loadTS('lib/irisDesktopQueue.ts');
const {createDesktopController}=loadTS('lib/irisDesktopController.ts');
const scope={environment:'development',accountId:'a',characterId:'c'};
const key={category:'weekly',taskId:'one',periodKey:'2026-10-18T21:00:00.000Z'};
function setup(){let now=0,id=0;return {at:n=>now=n,q:createDesktopQueue({environment:'development',now:()=>now,id:()=>`00000000-0000-4000-8000-${String(++id).padStart(12,'0')}`})};}
test('five rapid edits share first deadline without repeated 15 second waits',()=>{
 const {q,at}=setup();for(let i=0;i<5;i++){at(i*1000);q.edit(scope,{...key,taskId:String(i)},0,1);}
 assert.deepEqual(q.snapshot().entries.map(e=>e.deadlineAt),[15000,15000,15000,15000,15000]);
 at(15000);let requests=0;while(q.due('a').length){const row=q.claim(q.due('a')[0].requestId);assert.ok(row);requests++;q.settle(row.requestId,{kind:'saved',completed:1});}
 assert.equal(requests,5);assert.equal(q.snapshot().entries.length,0);
});
test('leaving makes only outgoing scope pending immediately due; unknown never replays',()=>{
 const {q,at}=setup();q.edit(scope,key,0,1);q.edit({...scope,characterId:'other'},key,0,1);at(1000);q.leaveCharacter(scope);
 assert.deepEqual(q.due('a').map(e=>e.characterId),['c']);const row=q.claim(q.due('a')[0].requestId);q.settle(row.requestId,{kind:'unknown'});q.leaveCharacter(scope);assert.equal(q.due('a').length,0);
});
test('inflight successor gets its own deadline and survives older ACK',()=>{
 const {q,at}=setup();q.edit(scope,key,0,1);q.saveNow(scope);const first=q.claim(q.due('a')[0].requestId);
 at(1000);q.edit(scope,key,1,2);q.settle(first.requestId,{kind:'saved',completed:1});assert.equal(q.snapshot().entries[0].deadlineAt,16000);assert.equal(q.snapshot().entries[0].desiredCompleted,2);
});
test('five mission checks dispatch five CAS writes in one due cycle with no repeated wait',async()=>{
 const {q,at}=setup();let reads=0,writes=0,inflight=0,maxInflight=0;
 const rows=Array.from({length:5},(_,i)=>({id:String(i+1),itemKind:'mission',scope:'character',total:1,completed:0,bookmarked:false,key:{itemKind:'mission',itemId:String(i+1),field:'count',scope:'character',periodKey:key.periodKey,catalogKey:'a'.repeat(64)}}));
 const values=new Map(rows.map(row=>[row.id,0]));
 const c=createDesktopController({queue:q,environment:'development',store:{load:async()=>null,replace:async()=>{}},transport:{session:async()=>({id:'a',nickname:'owner',role:'길드원'}),characters:async()=>[{id:'c',nickname:'가나',job:'힐러'}],details:async()=>{reads++;return {accountId:'a',characterId:'c',details:{tasks:{},classes:[],workspace:rows.map(row=>({...row,completed:values.get(row.id)}))},writeContext:{periodKeys:{},classes:[]}};},save:async edit=>{inflight++;maxInflight=Math.max(maxInflight,inflight);await Promise.resolve();values.set(edit.itemId,edit.desiredCompleted);writes++;inflight--;return {kind:'saved',completed:edit.desiredCompleted};}}});
 await c.start();await c.selectCharacter('c');reads=0;
 for(let i=0;i<5;i++){at(i*1000);await c.editWorkspace(rows[i].key,0,1);}
 at(14999);await c.tick();assert.equal(writes,0);at(15000);await c.tick();
 assert.equal(reads,5);assert.equal(writes,5);assert.equal(maxInflight,1);assert.equal(q.snapshot().entries.length,0);assert.deepEqual([...values.values()],[1,1,1,1,1]);
});
