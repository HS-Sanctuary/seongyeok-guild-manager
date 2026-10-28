import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
const connectionId='33333333-3333-4333-8333-333333333333';
const command={connectionId,sequence:1,kind:'web',action:'touch',expectedAccountId:A};
const api=()=>loadTS('lib/accountOnline.ts');
test('online expiry is independent of recent activity and rejects foreign/future leases',()=>{
 const {parseOnlineSnapshot,onlineAccountIds}=api();
 const s=parseOnlineSnapshot({enabled:true,viewerId:A,observedAt:'2026-10-28T12:00:00.000Z',accounts:[{accountId:A,expiresAt:'2026-10-28T12:12:00.000Z'},{accountId:B,expiresAt:'2026-10-28T12:03:00.000Z'}]});
 assert.deepEqual([...onlineAccountIds(s,Date.parse('2026-10-28T12:04:00Z'))],[A]);
 assert.equal(onlineAccountIds(s,Date.parse('2026-10-28T12:12:00Z')).size,0);
 assert.throws(()=>parseOnlineSnapshot({...s,accounts:[{accountId:A,expiresAt:'2027-01-01T00:00:00.000Z'}]}));
 assert.throws(()=>parseOnlineSnapshot({...s,accounts:[s.accounts[0],s.accounts[0]]}));
 assert.throws(()=>parseOnlineSnapshot({...s,accounts:[{accountId:A,expiresAt:'2026-10-28T12:12:00.001Z'}]}));
});
test('strict commands reject spoof fields, invalid sequences and web missing expected owner',()=>{
 const {parseOnlineCommand}=api();
 assert.deepEqual(parseOnlineCommand(command),command);
 for(const c of [{...command,nickname:'admin'},{...command,accountId:B},{...command,sequence:0},{...command,sequence:1.5},{...command,expectedAccountId:null},{...command,kind:'native'},{...command,action:'online'}])assert.throws(()=>parseOnlineCommand(c));
 assert.equal(parseOnlineCommand({...command,kind:'iris',expectedAccountId:null}).expectedAccountId,null);
});
test('web reporter sends at most one inflight, bounded heartbeat, terminal leave and fresh identity',async()=>{
 const {createOnlineReporter}=api();let clock=0;const sent=[];let resolve;let id=3;
 const send=async(c)=>{sent.push(c);if(sent.length===1)await new Promise(r=>resolve=r);return {enabled:true};};
 const r=createOnlineReporter(send,()=>clock,()=>String(id++).padStart(8,'0')+'-3333-4333-8333-333333333333');
 r.setAccount(A);const pending=r.tick();await r.tick();assert.equal(sent.length,1);
 resolve();await pending;clock=299999;await r.tick();assert.equal(sent.length,1);
 clock=300000;await r.tick();assert.equal(sent.length,2);
 r.setAccount(B);await r.tick();assert.equal(sent[2].action,'leave');assert.equal(sent[2].expectedAccountId,A);
 assert.equal(sent[3].expectedAccountId,B);assert.notEqual(sent[3].connectionId,sent[0].connectionId);
 r.stop();await r.tick();assert.equal(sent.at(-1).action,'leave');
});
test('disabled, denial, offline failures and ABA never authorize late work',async()=>{
 const {createOnlineReporter}=api();let clock=0;const calls=[];let finish;
 const r=createOnlineReporter(async(c)=>{calls.push(c);if(calls.length===1)await new Promise(r=>finish=r);return {enabled:true};},()=>clock,()=>connectionId);
 r.setAccount(A);const p=r.tick();r.setAccount(B);r.setAccount(A);finish();await p;await r.tick();assert.equal(calls.at(-1).expectedAccountId,A);
 let count=0;const disabled=createOnlineReporter(async()=>{count++;return {enabled:false};},()=>clock,()=>connectionId);
 disabled.setAccount(A);await disabled.tick();clock=999999;await disabled.tick();assert.equal(count,1);
 let failures=0;const offline=createOnlineReporter(async()=>{failures++;throw Error('offline');},()=>clock,()=>connectionId);
 offline.setAccount(A);await offline.tick();await offline.tick();assert.equal(failures,1);clock+=300000;await offline.tick();assert.equal(failures,2);
});

test('hanging heartbeat is bounded and a later schedule can recover without late ACK effects',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const {createOnlineReporter}=api();let clock=0,calls=0,firstSignal;
 const r=createOnlineReporter(async(c,signal)=>{calls++;if(calls===1){firstSignal=signal;await new Promise(()=>{});}return {enabled:true};},()=>clock,()=>connectionId);
 r.setAccount(A);const pending=r.tick();t.mock.timers.tick(10001);await new Promise(setImmediate);assert.equal(firstSignal.aborted,true);await pending;
 clock=300000;await r.tick();assert.equal(calls,2);
 r.stop();t.mock.timers.reset();
});
