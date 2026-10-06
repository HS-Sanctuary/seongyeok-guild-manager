import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadTS } from './load-ts.mjs';
const create = existsSync('lib/irisDesktopTransport.ts') ? loadTS('lib/irisDesktopTransport.ts').createDesktopTransport : undefined;
const edit = { environment:'development',accountId:'account',characterId:'A',category:'weekly',taskId:'9902',periodKey:'2026-10-04T21:00:00.000Z',requestId:'00000000-0000-4000-8000-000000000001',revision:1,baseCompleted:0,desiredCompleted:1,deadlineAt:15000,phase:'inflight' };
const reply = (body, status=200) => new Response(JSON.stringify(body), {status});
function adapter(fetch, timeoutMs=100) { assert.equal(typeof create,'function','Missing authenticated desktop transport'); return create({fetch,timeoutMs}); }
test('save adapts only server contract fields and preserves cookie-owned same-origin request',async()=>{
  let sent;
  const transport=adapter(async(path,init)=>{ sent={path,init};return reply({result:{requestId:edit.requestId,status:'saved',completed:1}}); });
  assert.deepEqual(await transport.save(edit),{kind:'saved',completed:1});
  assert.equal(sent.path,'/api/iris/kronos');assert.equal(sent.init.credentials,'same-origin');assert.equal(sent.init.redirect,'error');
  assert.deepEqual(JSON.parse(sent.init.body),{edit:{requestId:edit.requestId,generation:1,selectionVersion:1,accountId:'account',characterId:'A',category:'weekly',taskId:'9902',baseCompleted:0,desiredCompleted:1,periodKey:'2026-10-04T21:00:00.000Z'}});
});
test('ambiguous POST is unknown, never retransmitted',async()=>{
  for(const result of [reply({},503),reply({result:{requestId:'other',status:'saved',completed:1}}),reply({result:{requestId:edit.requestId,status:'saved',completed:0}})]){
    let calls=0;const transport=adapter(async()=>{calls++;return result;});
    assert.deepEqual(await transport.save(edit),{kind:'unknown'});assert.equal(calls,1);
  }
  let calls=0;const transport=adapter(async()=>{calls++;return new Promise(()=>{});},5);
  assert.deepEqual(await transport.save(edit),{kind:'unknown'});assert.equal(calls,1);
});
test('HTTP authentication and conflict outcomes remain distinct',async()=>{
  for(const [status,kind] of [[401,'unauthorized'],[409,'conflict'],[403,'rejected'],[400,'rejected']]){
    assert.deepEqual(await adapter(async()=>reply({},status)).save(edit),{kind});
  }
});
function details(){return {accountId:'account',characterId:'A',observedAt:'2026-10-05T00:00:00.000Z',writeContext:{periodKeys:{daily:'2026-10-04T21:00:00.000Z',weekly:'2026-10-04T21:00:00.000Z',abyss:'2026-10-04T21:00:00.000Z',raid:'2026-10-04T21:00:00.000Z'}},details:{schemaVersion:1,tasks:{daily:[],weekly:[{id:'9902',name:'뱅가드 브리치',completed:0,total:3}],abyss:[],raid:[]},classes:[{id:'1',name:'댄서',level:65}]}};}
test('details validates account, character, period and row bounds before exposing data',async()=>{
  const good=details();assert.equal((await adapter(async()=>reply(good)).details('account','A')).details.classes[0].level,65);
  for(const mutate of [v=>v.accountId='other',v=>v.characterId='B',v=>v.details.schemaVersion=2,v=>v.details.tasks.weekly[0].completed=4,v=>v.writeContext.periodKeys.weekly='2026-02-30T21:00:00.000Z',v=>v.details.tasks.weekly.push({...v.details.tasks.weekly[0]})]){
    const bad=details();mutate(bad);await assert.rejects(adapter(async()=>reply(bad)).details('account','A'));
  }
});
test('session rejects pending identities and strips undocumented fields',async()=>{
  const transport=adapter(async()=>reply({account:{id:'account',nickname:'뉴월',role:'부마스터',status:'active',secret:'not-for-client'}}));
  assert.deepEqual(await transport.session(),{id:'account',nickname:'뉴월',role:'부마스터'});
  assert.equal(await adapter(async()=>reply({account:{id:'account',nickname:'뉴월',role:'pending'}})).session(),null);
});
test('character ownership response and account switch identity must match requested account',async()=>{
  await assert.rejects(adapter(async()=>reply({accountId:'other',characters:[]})).characters('account'));
  await assert.rejects(adapter(async()=>reply({account:{id:'other',nickname:'다른'}})).switchAccount('account'));
});
test('characters accepts the empty optional alias produced by character registration',async()=>{
  const characters=[{id:7,nickname:'화연',job:'전사',alias:''},{id:8,nickname:'다른캐릭터',job:'댄서',alias:null}];
  assert.deepEqual(await adapter(async()=>reply({accountId:'account',characters})).characters('account'),
    characters.map(c=>({...c,id:String(c.id),alias:null})));
  for(const alias of [12,{},'\u0000']){
    await assert.rejects(adapter(async()=>reply({accountId:'account',characters:[{...characters[0],alias}]})).characters('account'));
  }
});
