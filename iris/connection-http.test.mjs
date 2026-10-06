import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createConnectionHandler } from './connection-http.mjs';

// Removing role/origin checks must expose synthetic account data and fail these tests.
const nativeToken = 'n'.repeat(43);
async function fixture(run, options = {}) {
  const handler = createConnectionHandler({ nativeToken, ...options });
  const server = http.createServer(async (req, res) => {
    if (!await handler(req, res)) { res.statusCode = 404; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(role, route, { method = 'GET', token = nativeToken, origin, body, raw, host } = {}) {
    const headers = { [`x-iris-${role}`]: token };
    if (origin !== undefined) headers.Origin = origin;
    if (host) headers.Host = host;
    if (body !== undefined || raw !== undefined) headers['Content-Type'] = 'application/json';
    return new Promise((resolve,reject) => {
      const req = http.request(`${base}/api/connection/${role}/${route}`, {method,headers}, res => {
        const chunks = [];
        res.on('data',chunk=>chunks.push(chunk));
        res.on('end',()=>resolve({status:res.statusCode,cors:res.headers['access-control-allow-origin'],data:JSON.parse(Buffer.concat(chunks))}));
      });
      req.on('error',reject);
      req.end(raw ?? (body === undefined ? undefined : JSON.stringify(body)));
    });
  }
  try { await run(request,base); } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
const browserOrigin = 'http://localhost:3000';
const characters = [{ id: 7, nickname: '테스트캐릭터', alias: '테스트', job: '대검전사' }];
const summary = { daily:{completed:1,total:2},weekly:{completed:0,total:3},abyss:{completed:0,total:1},raid:{completed:1,total:1} };
test('write HTTP routes isolate roles and require consent, pending edits prevent reconnect',async()=>{
  await fixture(async request=>{
    const c=await request('native','connect',{method:'POST',body:{}}),generation=c.data.generation;
    const b={token:c.data.browserToken,origin:browserOrigin};
    await request('browser','consent',{...b,method:'POST',body:{generation}});
    await request('browser','characters',{...b,method:'PUT',body:{generation,accountId:'a',characters}});
    const v=(await request('native','select',{method:'POST',body:{generation,characterId:'7'}})).data.selectionVersion;
    const d={schemaVersion:1,tasks:{daily:[{id:'1',name:'daily',completed:1,total:2}],weekly:[{id:'2',name:'weekly',completed:0,total:3}],abyss:[{id:'3',name:'abyss',completed:0,total:1}],raid:[{id:'4',name:'raid',completed:1,total:1}]},classes:[]};
    const periodKey='2026-09-27T21:00:00.000Z';
    await request('browser','summary',{...b,method:'PUT',body:{generation,selectionVersion:v,characterId:'7',summary,details:d,writeContext:{periodKeys:{daily:periodKey,weekly:periodKey,abyss:periodKey,raid:periodKey}}}});
    const edit={requestId:'11111111-1111-4111-8111-111111111111',generation,selectionVersion:v,accountId:'a',characterId:'7',category:'daily',taskId:'1',baseCompleted:1,desiredCompleted:2,periodKey};
    assert.equal((await request('native','edits',{method:'POST',body:{edit}})).status,409);
    assert.equal((await request('browser','write-consent',{...b,method:'POST',body:{generation,allowed:true}})).status,200);
    assert.equal((await request('native','edits',{method:'POST',body:{edit}})).status,200);
    assert.equal((await request('native','connect',{method:'POST',body:{}})).status,409);
    assert.equal((await request('browser','edits',{...b,origin:'https://evil.test'})).status,403);
    assert.equal((await request('native','edits/submit',{method:'POST',body:{generation,selectionVersion:v}})).status,200);
    assert.equal((await request('browser','edits',b)).data.edits[0].reconcileOnly,false);
    assert.equal((await request('browser','edits',b)).data.edits[0].reconcileOnly,true);
  });
});

test('allowed browser origin can read a rejected capability without receiving private state', async()=> {
  await fixture(async request=> {
    const rejected=await request('browser','consent',{method:'POST',origin:browserOrigin,token:'wrong',body:{generation:1}});
    assert.equal(rejected.status,403);
    assert.equal(rejected.cors,browserOrigin);
    assert.deepEqual(rejected.data,{error:'Connection request rejected'});
    const foreign=await request('browser','consent',{method:'POST',origin:'https://evil.example',token:'wrong',body:{generation:1}});
    assert.equal(foreign.status,403);
    assert.equal(foreign.cors,undefined);
    assert.equal((await request('native','state')).data.status,'disconnected');
  });
});

test('connection endpoints stay disabled without an owned native capability', async () => {
  await fixture(async request => {
    assert.equal((await request('native', 'connect', {method:'POST', body:{}})).status, 503);
  }, {nativeToken:undefined});
});
test('native connection rejects foreign Host, browser Origin and wrong token', async () => {
  await fixture(async request => {
    for (const overrides of [{host:'evil.example'}, {origin:browserOrigin}, {token:'bad'}, {origin:'null'}]) {
      assert.equal((await request('native','connect',{method:'POST',body:{},...overrides})).status,403);
    }
    assert.equal((await request('native','connect')).status,405);
  });
});
test('browser consent gates characters, native selection and versioned summaries', async () => {
  await fixture(async request => {
    const {data:connection} = await request('native','connect',{method:'POST',body:{}});
    const auth = {token:connection.browserToken,origin:browserOrigin};
    const payload = {generation:connection.generation,accountId:'synthetic-account',characters};
    assert.equal((await request('browser','characters',{...auth,method:'PUT',body:payload})).status,403);
    assert.equal((await request('browser','consent',{...auth,method:'POST',body:{generation:connection.generation}})).status,200);
    assert.equal((await request('browser','characters',{...auth,method:'PUT',body:payload})).status,200);
    const selection = await request('native','select',{method:'POST',body:{generation:connection.generation,characterId:7}});
    assert.equal(selection.status,200);
    const browserSelection = await request('browser','selection',auth);
    assert.equal(browserSelection.data.selectedId,'7');
    assert.equal(browserSelection.cors,browserOrigin);
    assert.equal((await request('browser','summary',{...auth,method:'PUT',body:{generation:connection.generation,selectionVersion:selection.data.selectionVersion,characterId:7,summary}})).status,200);
    const state = await request('native','state');
    assert.deepEqual(state.data.summary,summary);
    const details={schemaVersion:1,tasks:Object.fromEntries(Object.entries(summary).map(([category,count])=>[category,[{id:category,name:category,...count}]])),classes:[]};
    assert.equal((await request('browser','summary',{...auth,method:'PUT',body:{generation:connection.generation,selectionVersion:selection.data.selectionVersion,characterId:7,summary,details}})).status,200);
    assert.deepEqual((await request('native','state')).data.details,details);
    assert.equal(state.data.browserToken,undefined);
    assert.equal((await request('browser','summary',{...auth,method:'PUT',body:{generation:connection.generation,selectionVersion:0,characterId:7,summary}})).status,409);
    assert.equal((await request('browser','selection',{...auth,token:nativeToken})).status,403);
    assert.equal((await request('browser','selection',{...auth,origin:'https://sanctum-tawny-three.vercel.app'})).status,403);
  });
});
test('expired or revoked browser capability cannot keep old character data alive', async () => {
  let now = 1000;
  await fixture(async request => {
    const {data:first} = await request('native','connect',{method:'POST',body:{}});
    let auth = {token:first.browserToken,origin:browserOrigin};
    await request('browser','consent',{...auth,method:'POST',body:{generation:first.generation}});
    await request('browser','characters',{...auth,method:'PUT',body:{generation:first.generation,accountId:'a',characters}});
    now += 30 * 60_000;
    assert.equal((await request('browser','selection',auth)).status,403);
    assert.equal((await request('native','state')).data.accountId,null);
    const {data:second} = await request('native','connect',{method:'POST',body:{}});
    assert.notEqual(second.browserToken,first.browserToken);
    assert.equal((await request('browser','consent',{...auth,method:'POST',body:{generation:first.generation}})).status,403);
    auth = {token:second.browserToken,origin:browserOrigin};
    await request('native','disconnect',{method:'POST',body:{generation:second.generation}});
    assert.equal((await request('browser','consent',{...auth,method:'POST',body:{generation:second.generation}})).status,403);
  }, {now:()=>now});
});
test('malformed and oversized payloads never establish a connection', async () => {
  await fixture(async request => {
    assert.equal((await request('native','connect',{method:'POST',raw:'{'})).status,400);
    assert.equal((await request('native','connect',{method:'POST',raw:'x'.repeat(65537)})).status,413);
    assert.equal((await request('native','state')).data.status,'disconnected');
  });
});

test('actual IRIS server wires connection routes but CLI startup has no native permission', async () => {
  const { createIrisServer } = await import('./server.mjs');
  assert.equal(typeof createIrisServer,'function');
  for (const options of [{}, {nativeToken}]) {
    const server = createIrisServer(options);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try {
      const res = await fetch(`http://127.0.0.1:${server.address().port}/api/connection/native/state`, {headers:{'X-IRIS-Native':nativeToken}});
      assert.equal(res.status,options.nativeToken ? 200 : 503);
      const body = await res.json();
      if (options.nativeToken) assert.equal(body.status,'disconnected');
    } finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
  }
});

// Removing the post-body authorization check lets this old request revive a rotated session.
test('a slow browser body cannot restore characters after its connection is rotated', async () => {
  await fixture(async (request,base) => {
    const {data:first} = await request('native','connect',{method:'POST',body:{}});
    const auth = {token:first.browserToken,origin:browserOrigin};
    await request('browser','consent',{...auth,method:'POST',body:{generation:first.generation}});
    const payload = JSON.stringify({generation:first.generation,accountId:'old-account',characters});
    let received;
    const response = new Promise((resolve,reject) => {
      const req = http.request(`${base}/api/connection/browser/characters`, {method:'PUT',headers:{
        Origin:browserOrigin,'X-IRIS-Browser':first.browserToken,'Content-Type':'application/json',
        Expect:'100-continue','Content-Length':Buffer.byteLength(payload),
      }}, res=> {res.resume();res.on('end',()=>resolve(res.statusCode));});
      req.on('error',reject);
      received = req;
    });
    const ready = new Promise(resolve=>received.once('continue',resolve));
    received.flushHeaders(); await ready;
    received.write(payload.slice(0,10));
    await request('native','connect',{method:'POST',body:{}});
    received.end(payload.slice(10));
    assert.equal(await response,403);
    assert.equal((await request('native','state')).data.accountId,null);
  });
});

test('direct server subprocess starts disabled and terminates without orphaning its listener', async () => {
  const reservation = http.createServer();
  await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));
  const port = reservation.address().port;
  await new Promise(resolve=>reservation.close(resolve));
  const child = spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{
    env:{...process.env,IRIS_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe'],
  });
  const exited = once(child,'exit');
  try {
    await new Promise((resolve,reject)=> {
      const timer = setTimeout(()=>reject(new Error('Server startup timed out')),5000);
      child.once('error',error=>{clearTimeout(timer);reject(error);});
      child.once('exit',()=>{clearTimeout(timer);reject(new Error('Server exited before startup'));});
      child.stdout.once('data',()=>{clearTimeout(timer);resolve();});
    });
    const res = await fetch(`http://127.0.0.1:${port}/api/connection/native/state`,{headers:{'X-IRIS-Native':nativeToken}});
    assert.equal(res.status,503);
  } finally { child.kill(); await exited; }
  // Binding the exact port again proves this test-owned server did not survive cleanup.
  const probe = http.createServer();
  await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(port,'127.0.0.1',resolve);});
  await new Promise(resolve=>probe.close(resolve));
});

test('a slow native disconnect cannot revoke a newer connection', async () => {
  await fixture(async (request,base) => {
    const {data:first} = await request('native','connect',{method:'POST',body:{}});
    const payload = JSON.stringify({generation:first.generation});
    let pending;
    const response = new Promise((resolve,reject) => {
      pending = http.request(`${base}/api/connection/native/disconnect`,{method:'POST',headers:{
        'X-IRIS-Native':nativeToken,'Content-Type':'application/json',Expect:'100-continue',
        'Content-Length':Buffer.byteLength(payload),
      }},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
      pending.on('error',reject);
    });
    const ready = new Promise(resolve=>pending.once('continue',resolve));
    pending.flushHeaders();await ready;pending.write(payload.slice(0,5));
    const {data:second} = await request('native','connect',{method:'POST',body:{}});
    pending.end(payload.slice(5));
    assert.equal(await response,409);
    const {data:state} = await request('native','state');
    assert.equal(state.generation,second.generation);
    assert.equal(state.status,'waiting-browser');
  });
});

test('switching account revokes previous consent even after its character display goes stale', async () => {
  for (const elapsed of [0,60001]) {
    let now = 1000;
    await fixture(async request=> {
      const {data:connection} = await request('native','connect',{method:'POST',body:{}});
      const auth = {token:connection.browserToken,origin:browserOrigin};
      await request('browser','consent',{...auth,method:'POST',body:{generation:connection.generation}});
      assert.equal((await request('browser','characters',{...auth,method:'PUT',body:{generation:connection.generation,accountId:'a',characters}})).status,200);
      now += elapsed;
      assert.equal((await request('browser','characters',{...auth,method:'PUT',body:{generation:connection.generation,accountId:'b',characters}})).status,409);
      assert.equal((await request('native','state')).data.status,'disconnected');
      assert.equal((await request('browser','selection',auth)).status,403);
    },{now:()=>now});
  }
});
