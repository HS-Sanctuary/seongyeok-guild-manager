import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';

const {getKronosResetDay,kronosPeriodStart}=loadTS('lib/kronos.ts');
const allowance=iso=>{
  const {weekday}=getKronosResetDay(new Date(iso));
  return weekday===0?14:weekday+7;
};

test('game dates and weekdays change at KST06, never midnight',()=>{
  assert.deepEqual(getKronosResetDay(new Date('2026-10-05T05:59:59+09:00')),{key:'2026-10-04',weekday:0});
  assert.deepEqual(getKronosResetDay(new Date('2026-10-05T06:00:00+09:00')),{key:'2026-10-05',weekday:1});
  assert.deepEqual(getKronosResetDay(new Date('2026-10-06T00:00:00+09:00')),{key:'2026-10-05',weekday:1});
});

test('black hole allowance remains fourteen until Monday06; every day opens one slot',()=>{
  for(const [date,before,after] of [['05',14,8],['06',8,9],['07',9,10],['08',10,11],['09',11,12],['10',12,13],['11',13,14]]) {
    for(const time of ['00:00:00','05:59:59.999']) assert.equal(allowance(`2026-10-${date}T${time}+09:00`),before);
    assert.equal(allowance(`2026-10-${date}T06:00:00+09:00`),after);
  }
});

test('weekly reset and weekday agree across device timezones',()=>{
  const previous=process.env.TZ;
  try {
    for(const zone of ['UTC','Asia/Seoul','America/Los_Angeles']) {
      process.env.TZ=zone;
      const before=new Date('2026-10-04T20:59:59.999Z'),after=new Date('2026-10-04T21:00:00Z');
      assert.equal(allowance(before.toISOString()),14);
      assert.equal(allowance(after.toISOString()),8);
      assert.equal(new Date(kronosPeriodStart(before)).toISOString(),'2026-09-27T21:00:00.000Z');
      assert.equal(new Date(kronosPeriodStart(after)).toISOString(),'2026-10-04T21:00:00.000Z');
    }
  } finally {if(previous===undefined) delete process.env.TZ;else process.env.TZ=previous;}
});
