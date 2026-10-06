import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
const token='b'.repeat(43), generation=3;
const summary={daily:{completed:1,total:2},weekly:{completed:0,total:4},abyss:{completed:0,total:1},raid:{completed:1,total:1}};

test('default browser fetch is not invoked with the relay instance as its receiver',async()=> {
  const savedFetch=globalThis.fetch;
  const statuses=[],timers=[],requests=[];
  // Browser Web IDL fetch rejects a non-Window receiver before any HTTP request.
  globalThis.fetch=async function(url) {
    if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
    requests.push(url);
    return Response.json(url==='/api/iris/characters' ? {accountId:'a',characters:[]} :
      url.endsWith('/selection') ? {generation,selectionVersion:1,selectedId:null} : {status:'consented'});
  };
  try {
    const {IrisRelay}=loadTS('lib/irisRelay.ts');
    const relay=new IrisRelay({token,generation,onStatus:s=>statuses.push(s),schedule:fn=>{timers.push(fn);return 1;},cancel:()=>{}});
    await relay.start();
    assert.ok(requests.includes('/api/iris/characters'));
    assert.match(statuses.at(-1),/캐릭터를 선택/);
    assert.equal(timers.length,1);
    await relay.stop();
  } finally {globalThis.fetch=savedFetch;}
});
test('connection fragment accepts only exact local origins and bounded single-use parameters',()=> {
  const {parseIrisConnectionFragment}=loadTS('lib/irisRelay.ts');
  assert.deepEqual(parseIrisConnectionFragment('http://localhost:3000',`#connect=${token}&g=3`),{token,generation:3});
  for(const [origin,hash] of [
    ['https://localhost:3000',`#connect=${token}&g=3`],
    ['http://localhost:3000.evil',`#connect=${token}&g=3`],
    ['http://localhost:3000',`#connect=${token}&g=0`],
    ['http://localhost:3000',`#connect=${token}&g=3&g=4`],
    ['http://localhost:3000',`#connect=short&g=3`],
  ]) assert.equal(parseIrisConnectionFragment(origin,hash),null);
});
function fixture(overrides={}) {
  const calls=[],timers=[],statuses=[];
  const fetcher=async(url,options={})=> {
    calls.push({url,options});
    const body=url==='/api/iris/characters' ? {accountId:'a',characters:[{id:7,nickname:'내캐릭터'}]} :
      url.includes('/selection') ? {generation,selectionVersion:8,selectedId:'7'} :
      url.startsWith('/api/iris/kronos') ? {accountId:'a',characterId:'7',summary} : {status:'received'};
    return Response.json(body);
  };
  const {IrisRelay}=loadTS('lib/irisRelay.ts');
  const relay=new IrisRelay({token,generation,fetcher,onStatus:s=>statuses.push(s),schedule:fn=>{timers.push(fn);return timers.length;},cancel:()=>{},...overrides});
  return {relay,calls,timers,statuses};
}
test('relay sends selected details and refuses oversized UTF-8 bodies before transmission',async()=> {
  for(const oversized of [false,true]) {
    const calls=[];
    const details={schemaVersion:1,tasks:{daily:[],weekly:[],abyss:[],raid:[]},classes:[{id:'1',name:oversized ? '가'.repeat(22000) : '전사',level:null}]};
    const {relay,statuses,timers}=fixture({fetcher:async(url,options)=>{
      calls.push({url,options});
      return Response.json(url==='/api/iris/characters' ? {accountId:'a',characters:[{id:7,nickname:'내캐릭터'}]} :
        url.endsWith('/selection') ? {generation,selectionVersion:8,selectedId:'7'} :
        url.startsWith('/api/iris/kronos') ? {accountId:'a',characterId:'7',summary,details} : {});
    }});
    await relay.start();
    const sent=calls.find(c=>c.url.endsWith('/summary'));
    if(oversized) {assert.equal(sent,undefined);assert.match(statuses.at(-1),/크기/);assert.equal(timers.length,0);}
    else assert.deepEqual(JSON.parse(sent.options.body).details,details);
    await relay.stop();
  }
});

test('default browser timers keep a successful connection alive and can cancel it safely',async()=> {
  const originalSchedule=globalThis.setTimeout,originalCancel=globalThis.clearTimeout;
  globalThis.setTimeout=function(...args) {
    if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
    return originalSchedule(...args);
  };
  globalThis.clearTimeout=function(...args) {
    if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
    return originalCancel(...args);
  };
  const {relay,statuses,calls}=fixture({schedule:undefined,cancel:undefined});
  try {
    await relay.start();
    assert.match(statuses.at(-1),/요약을 전달/);
    assert.equal(calls.some(c=>c.url.endsWith('/disconnect')),false);
    await relay.stop();
    assert.equal(calls.at(-1).url.endsWith('/disconnect'),true);
  } finally {
    await relay.stop();
    globalThis.setTimeout=originalSchedule;globalThis.clearTimeout=originalCancel;
  }
});
test('IRIS relay consents once, transmits only owned data and schedules after finishing one cycle',async()=> {
  const {relay,calls,timers}=fixture();
  await relay.start();
  assert.deepEqual(calls.map(c=>c.url.split('/').pop()),['consent','characters','characters','selection','kronos?characterId=7','summary']);
  const payload=JSON.parse(calls.at(-1).options.body);
  assert.deepEqual(payload,{generation:3,selectionVersion:8,characterId:'7',summary});
  assert.equal(calls.at(-1).options.headers['X-IRIS-Browser'],token);
  assert.equal(calls.at(-1).options.headers['X-IRIS-Native'],undefined);
  assert.equal(calls[1].options.credentials,'same-origin');
  assert.equal(calls[2].options.credentials,'omit');
  assert.equal(timers.length,1);
  await relay.stop();
});
test('IRIS relay clears local consent and revokes the bridge on session failure',async()=> {
  const calls=[];
  const {relay,statuses,timers}=fixture({fetcher:async(url,options)=>{calls.push(url);return url==='/api/iris/characters' ? Response.json({message:'secret'}, {status:401}) : Response.json({});}});
  await relay.start();
  assert.equal(calls.at(-1),'http://127.0.0.1:4317/api/connection/browser/disconnect');
  assert.equal(timers.length,0);
  assert.match(statuses.at(-1),/생텀 로그인/);
});

test('loopback transport failure is not reported as an expired Sanctum login',async()=> {
  const {relay,statuses,timers}=fixture({fetcher:async()=>{throw new TypeError('Failed to fetch');}});
  await relay.start();
  assert.match(statuses.at(-1),/아이리스.*연결/);
  assert.doesNotMatch(statuses.at(-1),/로그인.*만료/);
  assert.equal(timers.length,0);
});

test('expired bridge capability and unavailable Sanctum data have different recovery instructions',async()=> {
  for (const [failedUrl,status,expected] of [
    ['http://127.0.0.1:4317/api/connection/browser/consent',403,/새 읽기 연결/],
    ['/api/iris/characters',503,/생텀.*조회/],
    ['http://127.0.0.1:4317/api/connection/browser/characters',409,/캐릭터 목록.*연결 상태/],
  ]) {
    const {relay,statuses}=fixture({fetcher:async(url)=>Response.json(
      url==='/api/iris/characters' ? {accountId:'a',characters:[]} : {}, {status:url===failedUrl ? status : 200})});
    await relay.start();
    assert.match(statuses.at(-1),expected);
    assert.doesNotMatch(statuses.at(-1),/로그인 또는 연결/);
  }
});
test('stopping during a slow summary never sends that previous selection after shutdown',async()=> {
  let release,summaryStarted;
  const ready=new Promise(resolve=>summaryStarted=resolve);
  const sent=[];
  const {relay}=fixture({fetcher:async(url,options)=> {
    sent.push(url);
    if(url.startsWith('/api/iris/kronos')) {summaryStarted();return new Promise(resolve=>release=()=>resolve(Response.json({accountId:'a',characterId:'7',summary})));}
    return Response.json(url==='/api/iris/characters' ? {accountId:'a',characters:[{id:7,nickname:'내캐릭터'}]} : url.endsWith('/selection') ? {generation,selectionVersion:8,selectedId:'7'} : {});
  }});
  const running=relay.start();await ready;
  await relay.stop();release();await running;
  assert.equal(sent.some(url=>url.endsWith('/summary')),false);
});
test('conflicting selection is retried next cycle, not treated as a successful old summary',async()=> {
  const {relay,timers,statuses}=fixture({fetcher:async(url)=>Response.json(
    url==='/api/iris/characters' ? {accountId:'a',characters:[{id:7,nickname:'내캐릭터'}]} : url.endsWith('/selection') ? {generation,selectionVersion:1,selectedId:'7'} :
    url.startsWith('/api/iris/kronos') ? {accountId:'a',characterId:'7',summary} : {}, {status:url.endsWith('/summary') ? 409 : 200})});
  await relay.start();
  assert.equal(timers.length,1);
  assert.equal(statuses.at(-1),'캐릭터 선택 변경을 확인하고 있어요.');
  await relay.stop();
});
test('account consent conflict revokes immediately instead of retrying as a selection change',async()=> {
  const calls=[];
  const {relay,timers}=fixture({fetcher:async(url)=> {
    calls.push(url);
    return Response.json(url==='/api/iris/characters' ? {accountId:'a',characters:[]} : {},{status:url==='http://127.0.0.1:4317/api/connection/browser/characters' ? 409 : 200});
  }});
  await relay.start();
  assert.equal(timers.length,0);
  assert.ok(calls.includes('http://127.0.0.1:4317/api/connection/browser/characters'));
  assert.equal(calls.at(-1),'http://127.0.0.1:4317/api/connection/browser/disconnect');
});
