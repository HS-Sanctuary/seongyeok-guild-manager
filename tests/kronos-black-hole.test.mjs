import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';

const {getKronosTaskLists,buildIrisKronosDetails}=loadTS('lib/irisKronos.ts');
const {kronosPeriodStart}=loadTS('lib/kronos.ts');
const limit=iso=>getKronosTaskLists([],new Date(iso)).weekly[0].max_count;

test('reset notice identifies the game day rather than midnight or the UTC date',()=>{
  const {getKronosResetDay}=loadTS('lib/kronos.ts');
  assert.equal(typeof getKronosResetDay,'function');
  assert.deepEqual(getKronosResetDay(new Date('2026-10-05T05:59:59+09:00')),{key:'2026-10-04',weekday:0});
  assert.deepEqual(getKronosResetDay(new Date('2026-10-05T06:00:00+09:00')),{key:'2026-10-05',weekday:1});
  assert.deepEqual(getKronosResetDay(new Date('2026-10-06T00:00:00+09:00')),{key:'2026-10-05',weekday:1});
  assert.deepEqual(getKronosResetDay(new Date('2026-10-06T06:00:00+09:00')),{key:'2026-10-06',weekday:2});
});

test('Sunday allowance stays fourteen through Monday midnight until KST06 reset',()=>{
  for(const iso of ['2026-10-04T23:59:59+09:00','2026-10-05T00:00:00+09:00','2026-10-05T05:59:59.999+09:00']) assert.equal(limit(iso),14,iso);
  assert.equal(limit('2026-10-05T06:00:00+09:00'),8);
  const raw={weekly_checks:{repeat:{9900:Array(14).fill(true)}}};
  const before=buildIrisKronosDetails(raw,[],[],[],new Date('2026-10-05T05:59:59+09:00'));
  assert.deepEqual(before.tasks.weekly[0],{id:'9900',name:'검은 구멍',completed:14,total:14});
  assert.equal(raw.weekly_checks.repeat[9900].length,14,'Reading must not erase saved completions');
});

test('daily allowance uses the same Korean06 reset day throughout the week',()=>{
  for(const [date,before,after] of [['05',14,8],['06',8,9],['07',9,10],['08',10,11],['09',11,12],['10',12,13],['11',13,14]]) {
    assert.equal(limit(`2026-10-${date}T00:00:00+09:00`),before);
    assert.equal(limit(`2026-10-${date}T05:59:59+09:00`),before);
    assert.equal(limit(`2026-10-${date}T06:00:00+09:00`),after);
  }
});

test('allowance and weekly period change together at Monday06 regardless of process timezone',()=>{
  const previous=process.env.TZ;
  try {
    for(const zone of ['UTC','Asia/Seoul','America/Los_Angeles']) {
      process.env.TZ=zone;
      const before=new Date('2026-10-04T20:59:59.999Z'),after=new Date('2026-10-04T21:00:00Z');
      assert.equal(limit(before.toISOString()),14);
      assert.equal(limit(after.toISOString()),8);
      assert.equal(new Date(kronosPeriodStart(before)).toISOString(),'2026-09-27T21:00:00.000Z');
      assert.equal(new Date(kronosPeriodStart(after)).toISOString(),'2026-10-04T21:00:00.000Z');
    }
  } finally {if(previous===undefined) delete process.env.TZ;else process.env.TZ=previous;}
});
