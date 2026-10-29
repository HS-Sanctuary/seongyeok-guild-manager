import test from 'node:test';
import assert from 'node:assert/strict';
import {measureOnlineScenario} from './account-online.metrics.mjs';
test('measured real handlers keep a day of online requests separate from activity and shutdown',async()=>{
 const m=await measureOnlineScenario({members:40,devices:2,hours:8,viewers:4});
 assert.deepEqual(m.steady,{onlineTouch:7680,onlineRead:1920,activityPost:1920,directoryRead:96,rpcCalls:11520});
 assert.equal(m.rpcAfterShutdown,11600);assert.equal(m.leaveRequests,80);assert.equal(m.failedRequests,0);
 assert.equal(m.monthlyApiSteady,348480);
 assert.equal(m.realDatabaseCalls,0);
});
test('24h two-connection usage exceeds the one-million comparison budget before unrelated traffic',async()=>{
 const m=await measureOnlineScenario({members:40,devices:2,hours:24,viewers:4});
 assert.deepEqual(m.steady,{onlineTouch:23040,onlineRead:5760,activityPost:5760,directoryRead:288,rpcCalls:34560});
 assert.equal(m.monthlyApiSteady,1045440);
 assert.equal(m.monthlyRpcAdapterCalls,1036800);
 assert.equal(m.monthlyApiSteady+m.leaveRequests*30,1047840,'daily shutdown assumption, not a monthly continuous process');
 assert.ok(m.monthlyApiSteady>1_000_000);
 assert.equal(m.failedRequests,0);assert.equal(m.realDatabaseCalls,0);
});
