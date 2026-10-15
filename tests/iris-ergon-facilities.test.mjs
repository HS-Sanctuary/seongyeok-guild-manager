import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonFacilities.ts')?loadTS('lib/irisErgonFacilities.ts'):{};
const now=10000,work=(i,completed,facility='목재 시설',remainingSeconds=30)=>({name:'품목'+i,facility,completed,state:null,remainingSeconds}),frame=items=>({schemaVersion:1,kind:'works',source:'official-cli',observedAt:now,data:{completedCount:items.filter(r=>r.completed===true).length,items}});
const summarize=(snapshot,at=now)=>{assert.equal(typeof api.summarizeErgonFacilities,'function');return api.summarizeErgonFacilities(snapshot,at);};
test('four of seven registered jobs advise collection without pretending to know facility capacity',()=>{
 const p=summarize(frame(Array.from({length:7},(_,i)=>work(i,i<4))));assert.equal(p.fresh,true);assert.equal(p.facilities.length,1);
 assert.deepEqual(p.facilities[0],{name:'목재 시설',registered:7,completed:4,pending:3,unknown:0,nextReadySeconds:30,reviewCollection:true,capacity:null});
 assert.equal(summarize(frame(Array.from({length:7},(_,i)=>work(i,i<3)))).facilities[0].reviewCollection,false);
});
test('unknown completion and stale or missing observations never advise collection',()=>{
 const unknown=summarize(frame([work(0,true),work(1,null)]));assert.equal(unknown.facilities[0].unknown,1);assert.equal(unknown.facilities[0].reviewCollection,false);
 const stale=summarize(frame([work(0,true)]),now+15000);assert.equal(stale.fresh,false);assert.equal(stale.facilities[0].reviewCollection,false);
 assert.deepEqual(summarize(null),{fresh:false,facilities:[]});assert.deepEqual(summarize(frame([])),{fresh:true,facilities:[]});
});
test('two facilities retain all observed jobs and the nearest known completion time independently',()=>{
 const p=summarize(frame([work(0,false,'목재 시설',120),work(1,false,'목재 시설',45),work(2,true,'금속 시설',0),work(3,true,'금속 시설',0)]));
 assert.equal(p.facilities[0].nextReadySeconds,45);assert.equal(p.facilities[0].reviewCollection,false);assert.equal(p.facilities[1].completed,2);assert.equal(p.facilities[1].reviewCollection,true);assert.equal(p.facilities[1].nextReadySeconds,null);
 const noTime=summarize(frame([work(0,false,'가죽 시설',null)]));assert.equal(noTime.facilities[0].nextReadySeconds,null);assert.equal(noTime.facilities[0].pending,1);
});
