import test from 'node:test';import assert from 'node:assert/strict';import {loadTS} from './load-ts.mjs';
import {ConnectionState} from '../iris/connection-state.mjs';
const {IrisRelay}=loadTS('lib/irisRelay.ts');
const e={requestId:'11111111-1111-4111-8111-111111111111',generation:1,selectionVersion:2,accountId:'a',characterId:'7',category:'daily',taskId:'1',baseCompleted:0,desiredCompleted:1,periodKey:'2026-10-03T21:00:00.000Z'};
const data=completed=>({accountId:'a',characterId:'7',summary:{daily:{completed,total:1},weekly:{completed:0,total:0},abyss:{completed:0,total:0},raid:{completed:0,total:0}},details:{schemaVersion:1,tasks:{daily:[{id:'1',name:'daily',completed,total:1}],weekly:[],abyss:[],raid:[]},classes:[]},writeContext:{periodKeys:{daily:e.periodKey}}});
test('submitted edits are picked up within one second without repeated idle database reads',async()=>{
  let clock=1000,scheduled,posts=0,reads=0,submitted=false,allowed=false;
  const relay=new IrisRelay({token:'b'.repeat(43),generation:1,now:()=>clock,onStatus:()=>{},
    schedule:(fn,delay)=>{scheduled={fn,delay};return 1;},cancel:()=>{},fetcher:async(url,opts)=>{
      if(url==='/api/iris/characters'){reads++;return Response.json({accountId:'a',characters:[{id:'7',nickname:'own'}]});}
      if(url.endsWith('/write-consent')){allowed=JSON.parse(opts.body).allowed;return Response.json({});}
      if(url.endsWith('/selection'))return Response.json({generation:1,selectionVersion:2,selectedId:'7',writeAllowed:allowed});
      if(url.endsWith('/edits'))return Response.json({generation:1,edits:submitted?[{...e,reconcileOnly:false}]:[]});
      if(url.endsWith('/edits/results')){submitted=false;return Response.json({});}
      if(url.startsWith('/api/iris/kronos')){if(opts.method==='POST'){posts++;return Response.json({});}reads++;return Response.json(data(posts?1:0));}
      return Response.json({});
    }});
  try{
    await relay.start();await relay.setWriteAllowed(true);
    assert.ok(scheduled.delay<=1000,'save waits for the 15 second summary timer');
    for(let i=0;i<5;i++){clock+=1000;await scheduled.fn();}
    assert.equal(reads,2,'idle fast polling repeats database queries');
    submitted=true;clock+=1000;await scheduled.fn();assert.equal(posts,1);
    clock+=1000;await scheduled.fn();assert.equal(posts,1,'completed save replayed');
    clock=17000;await scheduled.fn();assert.ok(reads>=5,'periodic ownership and summary refresh stopped');
  }finally{await relay.stop();}
});
async function run({timeout=false,reconcileOnly=false,changeAccount=false,selectChanged=false,revokeDuringSave=false,getFailure=false}={}){
  let cycle,posts=0,gets=0,results=[],allowed=false,selected='7',version=2;const messages=[];
  const relay=new IrisRelay({token:'b'.repeat(43),generation:1,onStatus:m=>messages.push(m),schedule:f=>{cycle=f;return 1;},cancel:()=>{},fetcher:async(url,opts)=>{
    if(url==='/api/iris/characters')return Response.json({accountId:changeAccount&&posts?'other':'a',characters:[{id:'7',nickname:'own'}]});
    if(url.endsWith('/write-consent')){allowed=JSON.parse(opts.body).allowed;return Response.json({});}
    if(url.endsWith('/selection'))return Response.json({generation:1,selectionVersion:version,selectedId:selected,writeAllowed:allowed});
    if(url.endsWith('/edits'))return Response.json({generation:1,edits:[{...e,reconcileOnly}]});
    if(url.endsWith('/edits/results')){results.push(...JSON.parse(opts.body).results);return Response.json({});}
    if(url.startsWith('/api/iris/kronos')){
      if(opts.method==='POST'){posts++;if(revokeDuringSave)await relay.setWriteAllowed(false);if(selectChanged){selected='8';version++;}if(timeout)throw new TypeError('lost response');return Response.json({result:{requestId:e.requestId,status:'saved',completed:1}});}
      if(getFailure&&posts)return Response.json({},{status:503});
      gets++;return Response.json({...data(posts||reconcileOnly?1:0),accountId:changeAccount&&posts?'other':'a'});
    }
    return Response.json({});
  }});
  await relay.start();assert.equal(posts,0);
  await relay.setWriteAllowed(true);await cycle();
  await relay.stop();return {posts,gets,results,messages};
}
test('writes require separate consent and verify by GET before acknowledging',async()=>{const r=await run();assert.equal(r.posts,1);assert.deepEqual(r.results,[{requestId:e.requestId,status:'saved',completed:1}]);assert.ok(r.gets>=2);});
test('lost POST response rechecks without duplicate POST; claimed requests reconcile only',async()=>{assert.equal((await run({timeout:true})).results[0].status,'saved');const r=await run({reconcileOnly:true});assert.equal(r.posts,0);assert.equal(r.results[0].status,'saved');});
test('account or selected character transition prevents success from leaking to new identity',async()=>{for(const patch of [{changeAccount:true},{selectChanged:true}])assert.equal((await run(patch)).results.length,0);});
test('revoked consent stops acknowledgments; unavailable verification is unknown not saved',async()=>{
  const revoked=await run({revokeDuringSave:true});assert.equal(revoked.posts,1);assert.equal(revoked.results.length,0);
  const failed=await run({getFailure:true});assert.equal(failed.posts,1);assert.deepEqual(failed.results,[{requestId:e.requestId,status:'unknown',completed:null}]);
});

test('serial batch renews native freshness and retains only failed items',async()=>{
  let now=1000,cycle,posts=0;const state=new ConnectionState({now:()=>now}),generation=state.begin();
  const snapshot=done=>{const value=data(done);value.details.tasks.daily.push({id:'2',name:'second',completed:0,total:1});value.summary.daily.total=2;value.writeContext.periodKeys=Object.fromEntries(['daily','weekly','abyss','raid'].map(k=>[k,e.periodKey]));return value;};
  let completed=0;const relay=new IrisRelay({token:'b'.repeat(43),generation,onStatus:()=>{},schedule:f=>{cycle=f;return 1;},cancel:()=>{},fetcher:async(url,opts)=>{
    const body=opts.body?JSON.parse(opts.body):null;
    if(url==='/api/iris/characters')return Response.json({accountId:'a',characters:[{id:'7',nickname:'own'}]});
    if(url.endsWith('/characters')){state.setCharacters(generation,body);return Response.json({});}
    if(url.endsWith('/selection'))return Response.json(state.snapshot());
    if(url.endsWith('/summary')){assert.ok(state.setSummary(generation,body.selectionVersion,'7',body.summary,body.details,body.writeContext));return Response.json({});}
    if(url.endsWith('/write-consent')){state.setWriteAllowed(generation,body.allowed);return Response.json({});}
    if(url.endsWith('/edits'))return Response.json({generation,edits:state.takeEdits(generation)});
    if(url.endsWith('/edits/results')){assert.ok(state.applyEditResults(generation,body.selectionVersion,body.results));return Response.json({});}
    if(url.startsWith('/api/iris/kronos')){
      if(opts.method==='POST'){posts++;now+=35000;if(body.edit.taskId==='2')return Response.json({},{status:503});completed=1;return Response.json({});}
      return Response.json(snapshot(completed));
    }
    return Response.json({});
  }});
  await relay.start();const version=state.select(generation,'7');await cycle();await relay.setWriteAllowed(true);
  state.stageEdit({...e,generation,selectionVersion:version});state.stageEdit({...e,requestId:'22222222-2222-4222-8222-222222222222',generation,selectionVersion:version,taskId:'2'});
  state.submitEdits(generation,version);await cycle();
  assert.equal(posts,2);assert.equal(state.snapshot().status,'connected');assert.deepEqual(state.snapshot().editQueue.edits.map(r=>[r.taskId,r.status]),[['2','failed']]);await relay.stop();
});

test('lost write-consent response stops lease renewal instead of leaving native permission active',async()=>{
  let cycle, failConsent=false, consent=true, disconnects=0, summaries=0;
  const changes=[];
  const relay=new IrisRelay({token:'b'.repeat(43),generation:1,onStatus:()=>{},onWriteAllowed:value=>changes.push(value),schedule:f=>{cycle=f;return 1;},cancel:()=>{},fetcher:async(url,opts)=>{
    if(url==='/api/iris/characters')return Response.json({accountId:'a',characters:[{id:'7',nickname:'own'}]});
    if(url.endsWith('/selection'))return Response.json({generation:1,selectionVersion:2,selectedId:'7',writeAllowed:consent});
    if(url.endsWith('/write-consent')){
      if(failConsent)throw new TypeError('response not delivered');
      consent=JSON.parse(opts.body).allowed; return Response.json({});
    }
    if(url.endsWith('/disconnect')){disconnects++;consent=false;return Response.json({});}
    if(url.endsWith('/summary')){summaries++;return Response.json({});}
    if(url.startsWith('/api/iris/kronos'))return Response.json(data(0));
    if(url.endsWith('/edits'))return Response.json({generation:1,edits:[]});
    return Response.json({});
  }});
  await relay.start();await relay.setWriteAllowed(true);failConsent=true;
  await assert.rejects(relay.setWriteAllowed(false));
  const before=summaries;await cycle();
  assert.equal(disconnects,1);assert.equal(consent,false);assert.equal(summaries,before);
  assert.equal(changes.at(-1),false);
});
