import test from 'node:test';
import assert from 'node:assert/strict';

let ConnectionState;
try { ({ConnectionState} = await import('./connection-state.mjs')); } catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
const chars = [{id:7,nickname:'TestA',job:'Job',alias:'A'},{id:'8',nickname:'TestB',job:'Job',alias:'B'}];
const summary = {daily:{completed:1,total:3},weekly:{completed:2,total:4},abyss:{completed:0,total:1},raid:{completed:1,total:2}};
function setup() {
  assert.equal(typeof ConnectionState,'function','Memory connection state is not implemented');
  let time = 1000;
  const state = new ConnectionState({now:()=>time});
  const generation = state.begin();
  assert.equal(state.setCharacters(generation,{accountId:'account-A',characters:chars}),true);
  return {state,generation,advance:ms=>{time += ms;}};
}
const details={schemaVersion:1,tasks:{daily:[{id:'1',name:'일간',completed:1,total:3}],
  weekly:[{id:'2',name:'주간',completed:2,total:4}],abyss:[{id:'3',name:'어비스',completed:0,total:1}],
  raid:[{id:'4',name:'레이드',completed:1,total:2}]},classes:[{id:'1',name:'전사',level:65},{id:'2',name:'마법사',level:null}]};
test('writes need separate consent and fresh matching selection, retain pending through polls and block transition',()=>{
  const {state,generation,advance}=setup(),version=state.select(generation,'7');
  const periodKey='2026-09-27T21:00:00.000Z',context={periodKeys:{daily:periodKey,weekly:periodKey,abyss:periodKey,raid:periodKey}};
  state.setSummary(generation,version,'7',summary,details,context);
  const edit={requestId:'11111111-1111-4111-8111-111111111111',generation,selectionVersion:version,accountId:'account-A',characterId:'7',category:'daily',taskId:'1',baseCompleted:1,desiredCompleted:2,periodKey};
  assert.equal(state.stageEdit(edit),false);assert.equal(state.setWriteAllowed(generation,true),true);assert.equal(state.stageEdit(edit),true);
  state.setSummary(generation,version,'7',summary,details,context);assert.equal(state.snapshot().editQueue.edits.length,1);
  assert.equal(state.select(generation,'8'),null);assert.equal(state.stageEdit({...edit,characterId:'8'}),false);
  assert.equal(state.submitEdits(generation,version),true);assert.equal(state.takeEdits(generation).length,1);
  assert.equal(state.applyEditResults(generation,version,[{requestId:'wrong',status:'saved',completed:2}]),false);
  advance(61000);assert.equal(state.snapshot().writeAllowed,false);assert.equal(state.stageEdit(edit),false);assert.equal(state.takeEdits(generation).length,0);
  assert.equal(state.snapshot().editQueue.edits.length,1);
  assert.equal(state.select(generation,'8',true),null); // expired directory is not revived
});
test('account transition revokes write consent and retained old queue cannot execute in revived directory',()=>{
  const {state,generation,advance}=setup(),v=state.select(generation,'7');
  const periodKey='2026-09-27T21:00:00.000Z',context={periodKeys:Object.fromEntries(['daily','weekly','abyss','raid'].map(k=>[k,periodKey]))};
  const e={requestId:'11111111-1111-4111-8111-111111111111',generation,selectionVersion:v,accountId:'account-A',characterId:'7',category:'daily',taskId:'1',baseCompleted:1,desiredCompleted:2,periodKey};
  state.setSummary(generation,v,'7',summary,details,context);state.setWriteAllowed(generation,true);state.stageEdit(e);state.submitEdits(generation,v);
  state.setCharacters(generation,{accountId:'account-B',characters:chars});
  assert.equal(state.snapshot().writeAllowed,false);
  state.setWriteAllowed(generation,true);assert.deepEqual(state.takeEdits(generation),[]);
  advance(61000);state.snapshot();state.setCharacters(generation,{accountId:'account-A',characters:chars});state.setWriteAllowed(generation,true);
  assert.deepEqual(state.takeEdits(generation),[]);
});
test('details are validated atomically and cleared with selection or freshness changes',()=> {
  const {state,generation,advance}=setup();
  const version=state.select(generation,'7');
  assert.equal(state.setSummary(generation,version,'7',summary,details),true);
  assert.deepEqual(state.snapshot().details,details);
  const bad=structuredClone(details);bad.tasks.daily[0].completed=2;
  assert.equal(state.setSummary(generation,version,'7',summary,bad),false);
  assert.equal(state.snapshot().summary,null);
  assert.equal(state.snapshot().details,null);
  assert.equal(state.setSummary(generation,version,'7',summary,details),true);
  state.select(generation,'8');
  assert.equal(state.snapshot().details,null);
  assert.equal(state.setSummary(generation,version,'7',summary,details),false);
  const next=state.select(generation,'7');
  state.setSummary(generation,next,'7',summary,details);advance(60001);
  assert.equal(state.snapshot().details,null);
});
test('unknown schemas duplicate IDs and unbounded detail inputs are rejected',()=> {
  const {state,generation}=setup();const version=state.select(generation,'7');
  const changes=[d=>d.schemaVersion=2,d=>d.tasks.daily.push(d.tasks.daily[0]),d=>d.classes.push(d.classes[0]),
    d=>d.classes[0].level=1.5,d=>d.tasks.daily[0].name='가'.repeat(121),d=>d.tasks.daily[0].total=1001,
    d=>d.tasks.daily=Array(201).fill(d.tasks.daily[0]),d=>d.classes=Array(101).fill(d.classes[0])];
  for(const change of changes) {const input=structuredClone(details);change(input);assert.equal(state.setSummary(generation,version,'7',summary,input),false);}
  state.setSummary(generation,version,'7',summary);
  assert.equal(state.snapshot().details,null);
});
test('late summary for a previous character or connection cannot replace the current selection',()=>{
  const {state,generation} = setup();
  const a = state.select(generation,'7');
  const b = state.select(generation,'8');
  assert.equal(state.setSummary(generation,a,'7',summary),false);
  assert.equal(state.snapshot().summary,null);
  assert.equal(state.setSummary(generation,b,'8',summary),true);
  state.begin();
  assert.equal(state.setSummary(generation,b,'8',summary),false);
  assert.equal(state.snapshot().selectedId,null);
});
test('account change and character removal clear the selected character and its summary',()=>{
  const {state,generation} = setup();
  const version = state.select(generation,'7');
  state.setSummary(generation,version,'7',summary);
  state.setCharacters(generation,{accountId:'account-B',characters:chars});
  assert.equal(state.snapshot().selectedId,null);
  assert.equal(state.snapshot().summary,null);
  state.select(generation,'8');
  state.setCharacters(generation,{accountId:'account-B',characters:[chars[0]]});
  assert.equal(state.snapshot().selectedId,null);
});
test('browser freshness expires after 60 seconds and cannot expose stale summary',()=>{
  const {state,generation,advance} = setup();
  const version = state.select(generation,'7');
  state.setSummary(generation,version,'7',summary);
  advance(60_000);
  assert.deepEqual(state.snapshot().summary,summary);
  advance(1);
  const stale = state.snapshot();
  assert.equal(stale.status,'stale');
  assert.equal(stale.summary,null);
  assert.equal(stale.selectedId,null);
  assert.deepEqual(stale.characters,[]);
  assert.equal(state.setSummary(generation,version,'7',summary),false);
});
test('invalid lists and summaries are rejected without allowing unknown selections',()=>{
  const {state,generation} = setup();
  assert.equal(state.setCharacters(generation,null),false);
  assert.equal(state.select(generation,'not-owned'),null);
  for (const characters of [[chars[0],chars[0]], [{id:'x',nickname:'가'.repeat(13)}], Array(101).fill(chars[0])]) {
    assert.equal(state.setCharacters(generation,{accountId:'account-A',characters}),false);
  }
  const version = state.select(generation,'7');
  for (const daily of [{completed:-1,total:3},{completed:4,total:3},{completed:1.5,total:3},{completed:0,total:10001}]) {
    assert.equal(state.setSummary(generation,version,'7',{...summary,daily}),false);
  }
  assert.equal(state.snapshot().summary,null);
});
test('inputs and returned snapshots cannot mutate private memory or retain extra fields',()=>{
  const {state,generation} = setup();
  const version = state.select(generation,'7');
  const input = structuredClone({...summary,secret:'discard'});
  state.setSummary(generation,version,'7',input);
  input.daily.completed = 3;
  const snapshot = state.snapshot();
  assert.equal(snapshot.summary.daily.completed,1);
  assert.equal(snapshot.summary.secret,undefined);
  snapshot.characters[0].nickname = 'Changed';
  snapshot.summary.daily.completed = 3;
  assert.equal(state.snapshot().characters[0].nickname,'TestA');
  assert.equal(state.snapshot().summary.daily.completed,1);
  state.disconnect();
  assert.equal(state.snapshot().status,'disconnected');
  assert.equal(state.snapshot().accountId,null);
});
