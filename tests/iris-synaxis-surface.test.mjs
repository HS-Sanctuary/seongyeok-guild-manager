import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
import {existsSync} from 'node:fs';
const policy=existsSync('lib/partySurfacePolicy.ts')?loadTS('lib/partySurfacePolicy.ts'):{};
const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};

test('stalled request releases busy state but keeps uncertain receipt and aborts IO',async()=>{
  const s=storage(),busy=[];let signal;
  const request=policy.scopedPartyRequest('A',()=>true,s,async(_,init)=>{signal=init.signal;return new Promise(()=>{});},v=>busy.push(v),5);
  await assert.rejects(request('/api/member-mutations',{method:'POST',body:'{}'}),/시간/);
  assert.equal(signal.aborted,true);assert.deepEqual(busy,[true,false]);
  assert.ok(s.getItem('iris_synaxis_receipt:v1:A'));
});

test('new content selections use highest raid difficulty regardless of row order',()=>{
  assert.equal(typeof policy.partyDefaultDifficulty,'function');
  assert.equal(policy.partyDefaultDifficulty({category:'레이드',diffs:['어려움','지옥2','입문','매우 어려움','지옥1'],defaultDiff:'어려움'}),'지옥2');
  assert.equal(policy.partyDefaultDifficulty({category:'레이드',diffs:['어려움','입문'],defaultDiff:'입문'}),'어려움');
  assert.equal(policy.partyDefaultDifficulty({category:'레이드',diffs:['지옥2','지옥 3','매우 어려움'],defaultDiff:'지옥2'}),'지옥 3');
});
test('abyss prefers very hard only when valid and never invents a difficulty',()=>{
  assert.equal(typeof policy.partyDefaultDifficulty,'function');
  assert.equal(policy.partyDefaultDifficulty({category:'어비스',diffs:['지옥1','매우 어려움','어려움'],defaultDiff:'어려움'}),'매우 어려움');
  assert.equal(policy.partyDefaultDifficulty({category:'어비스',diffs:['어려움'],defaultDiff:'어려움'}),'어려움');
  assert.equal(policy.partyDefaultDifficulty({category:'어비스',diffs:[],defaultDiff:'매우 어려움'}),'');
});
test('scoped write sends expected account and suppresses simultaneous duplicate IO',async()=>{
  assert.equal(typeof policy.scopedPartyRequest,'function');let finish,calls=0,body,busy=[];
  const pending=new Promise(r=>finish=r),s=storage();
  const request=policy.scopedPartyRequest('A',()=>true,s,async(url,init)=>{calls++;body=JSON.parse(init.body);return pending;},v=>busy.push(v));
  const first=request('/api/member-mutations',{method:'POST',body:JSON.stringify({table:'parties',action:'insert',payload:{}})});
  await assert.rejects(request('/api/member-mutations',{method:'POST',body:'{}'}));
  assert.equal(calls,1);assert.equal(body.expectedAccountId,'A');
  finish(new Response('{"data":[]}',{status:200}));await first;assert.deepEqual(busy,[true,false]);
});
test('inactive account blocks before IO and uncertain result blocks retry across restart but not other account',async()=>{
  assert.equal(typeof policy.scopedPartyRequest,'function');const s=storage();let calls=0;
  const io=async()=>{calls++;throw Error('connection lost');};
  await assert.rejects(policy.scopedPartyRequest('A',()=>false,s,io)('/api/member-mutations',{method:'POST',body:'{}'}));assert.equal(calls,0);
  await assert.rejects(policy.scopedPartyRequest('A',()=>true,s,io)('/api/member-mutations',{method:'POST',body:'{}'}));assert.equal(calls,1);
  await assert.rejects(policy.scopedPartyRequest('A',()=>true,s,io)('/api/member-mutations',{method:'POST',body:'{}'}));assert.equal(calls,1);
  await assert.rejects(policy.scopedPartyRequest('B',()=>true,s,io)('/api/member-mutations',{method:'POST',body:'{}'}));assert.equal(calls,2);
});
test('definite ownership rejection clears receipt; partial server conflict retains it',async()=>{
  assert.equal(typeof policy.scopedPartyRequest,'function');const s=storage();
  await policy.scopedPartyRequest('A',()=>true,s,async()=>new Response('{}',{status:403}))('/api/member-mutations',{method:'POST',body:'{}'});
  assert.equal(s.getItem('iris_synaxis_receipt:v1:A'),null);
  await policy.scopedPartyRequest('A',()=>true,s,async()=>new Response('{}',{status:409}))('/api/parties/sync-checklist',{method:'POST',body:'{}'});
  assert.ok(s.getItem('iris_synaxis_receipt:v1:A'));
});
test('new party activity deduplicates INSERT dots, separates buses and clears deleted or acknowledged entries',()=>{
  assert.equal(typeof policy.createPartyActivity,'function');const tracker=policy.createPartyActivity();
  const party={id:1,party_type:'1회 클리어'},bus={id:2,party_type:'길드버스'};
  tracker.observe({eventType:'INSERT',new:party});tracker.observe({eventType:'INSERT',new:party});tracker.observe({eventType:'INSERT',new:bus});
  assert.deepEqual(tracker.counts(),{party:1,bus:1});
  tracker.observe({eventType:'UPDATE',new:bus});assert.deepEqual(tracker.counts(),{party:1,bus:1});
  tracker.acknowledge('party',[]);assert.deepEqual(tracker.counts(),{party:1,bus:1});
  tracker.acknowledge('party',['1']);assert.deepEqual(tracker.counts(),{party:0,bus:1});
  tracker.acknowledge('party');assert.deepEqual(tracker.counts(),{party:0,bus:1});
  tracker.observe({eventType:'DELETE',old:{id:2}});assert.deepEqual(tracker.counts(),{party:0,bus:0});
});
