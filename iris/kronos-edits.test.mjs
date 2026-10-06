import test from 'node:test';import assert from 'node:assert/strict';
const edit=(i=1,over={})=>({requestId:`11111111-1111-4111-8111-${String(i).padStart(12,'0')}`,generation:1,selectionVersion:1,accountId:'a',characterId:'c',category:'weekly',taskId:String(i),baseCompleted:0,desiredCompleted:1,periodKey:'2026-09-27T21:00:00.000Z',...over});
test('queue preserves first base, coalesces edits, return to base clears and caps at200',async()=>{
  const {KronosEditQueue}=await import('./kronos-edits.mjs');const q=new KronosEditQueue();
  assert.equal(q.stage(edit()),true);assert.equal(q.stage(edit(1,{baseCompleted:1,desiredCompleted:2})),true);
  assert.equal(q.snapshot().edits[0].baseCompleted,0);assert.equal(q.snapshot().edits[0].desiredCompleted,2);
  q.stage(edit(1,{desiredCompleted:0}));assert.equal(q.snapshot().edits.length,0);
  for(let i=1;i<=200;i++)assert.equal(q.stage(edit(i)),true);
  assert.equal(q.stage(edit(201)),false);assert.equal(q.snapshot().edits.length,200);
});
test('state size guard rejects without losing earlier edits',async()=>{
  const {KronosEditQueue}=await import('./kronos-edits.mjs');const q=new KronosEditQueue();
  q.stage(edit());const before=q.snapshot();
  assert.equal(q.stage(edit(2),()=>false),false);assert.deepEqual(q.snapshot(),before);
});
test('submitted queue blocks editing, claims once, partial results and unknown cannot resubmit',async()=>{
  const {KronosEditQueue}=await import('./kronos-edits.mjs');const q=new KronosEditQueue();
  q.stage(edit());q.stage(edit(2));assert.equal(q.submit(),true);assert.equal(q.submit(),false);assert.equal(q.stage(edit()),false);
  assert.equal(q.pending()[0].reconcileOnly,false);assert.equal(q.pending()[0].reconcileOnly,true);
  assert.equal(q.applyResult({requestId:edit().requestId,status:'saved',completed:9}),false);
  assert.equal(q.applyResult({requestId:edit().requestId,status:'saved',completed:1}),true);
  assert.equal(q.snapshot().edits.length,1);assert.equal(q.submit(),false);
  q.applyResult({requestId:edit(2).requestId,status:'failed',completed:0});assert.equal(q.submit(),true);
  q.discard();assert.equal(q.snapshot().edits.length,0);
});
