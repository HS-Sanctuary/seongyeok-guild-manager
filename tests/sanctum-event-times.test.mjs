import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
test('KST event transitions preserve boss, hourly barrier and deep reset boundaries',()=>{
 assert.ok(existsSync('lib/sanctumEventTimes.ts'),'shared KST event calculation unavailable');const {calculateSanctumEvents:calc}=loadTS('lib/sanctumEventTimes.ts');
 for(const [time,status,sec] of [['11:58:00','imminent',120],['12:00:00','active',1800],['12:30:00','waiting',9000]]){const state=calc(Date.parse(`2026-10-12T${time}+09:00`),[]);assert.equal(state.fieldBoss.status,status);assert.equal(state.fieldBoss.sec,sec);}
 for(const [time,status,sec] of [['00:00:00','imminent',119],['00:02:00','active',119],['00:04:00','waiting',3360]]){const state=calc(Date.parse(`2026-10-12T${time}+09:00`),[]);assert.equal(state.barrier.status,status);assert.equal(state.barrier.sec,sec);assert.equal(state.deep.sec,time==='00:00:00'?1800:time==='00:02:00'?1680:1560);}
 assert.equal(calc(Date.parse('2026-10-12T23:59:59+09:00'),[]).deep.sec,1);
});
test('only approved unexpired abyss reports confirm spawn; default is an estimate',()=>{
 if(!existsSync('lib/sanctumEventTimes.ts')){assert.fail('approved spawn calculation unavailable');}const {calculateSanctumEvents:calc}=loadTS('lib/sanctumEventTimes.ts'),at=Date.parse('2026-10-12T12:00:00+09:00');
 const row={id:'r',hole_time:new Date(at).toISOString(),status:'approved',reporter_name:'제보자'};
 assert.equal(calc(at-120000,[row]).abyss.status,'imminent');assert.equal(calc(at,[row]).abyss.status,'active');assert.equal(calc(at+900000,[row]).abyss.confirmed,false);assert.equal(calc(at,[{...row,status:'pending'}]).abyss.confirmed,false);
});
