import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadTS } from './load-ts.mjs';

const path = 'lib/irisDesktopQueue.ts';
const create = existsSync(path) ? loadTS(path).createDesktopQueue : undefined;
const A = { environment: 'development', accountId: 'account', characterId: 'A' };
const B = { ...A, characterId: 'B' };
const key = { category: 'weekly', taskId: 'vanguard', periodKey: '2026-10-04T21:00:00.000Z' };
test('task and class share debounce while blocked characters cannot dispatch',()=>{
  const {queue,at}=setup();queue.edit(A,key,0,1);queue.edit(B,key,0,1);
  at(1000);queue.editClass(A,'1',null,53);
  assert.equal(queue.snapshot().schemaVersion,3);
  assert.deepEqual(queue.snapshot().entries.filter(e=>e.characterId==='A').map(e=>e.deadlineAt),[16000,16000]);
  at(16000);assert.deepEqual(queue.due('account',new Set(['A'])).map(e=>e.characterId),['B']);
  const c=queue.snapshot().entries.find(e=>e.kind==='class');assert.equal(c.baseLevel,null);assert.equal('periodKey' in c,false);
  queue.saveNow(A);const task=queue.claim(queue.due('account')[0].requestId);queue.settle(task.requestId,{kind:'saved',completed:1});
  const flight=queue.claim(queue.due('account').find(e=>e.kind==='class').requestId);queue.settle(flight.requestId,{kind:'saved',level:53});
  assert.equal(queue.snapshot().entries.some(e=>e.kind==='class'),false);
});
test('class original baseline survives edits and schema1 migration is strict',()=>{
  const {queue,at}=setup();queue.editClass(A,'1',53,54);queue.editClass(A,'1',54,55);
  assert.equal(queue.snapshot().entries[0].baseLevel,53);queue.editClass(A,'1',55,53);assert.equal(queue.snapshot().entries.length,0);
  assert.throws(()=>queue.editClass(A,'1',null,0));assert.throws(()=>queue.editClass(A,'1',0,1));
  queue.edit(A,key,0,1);const v2=queue.snapshot(),legacy=structuredClone(v2);legacy.schemaVersion=1;delete legacy.entries[0].kind;
  const {migrateDesktopQueueV1:migrate}=loadTS(path);assert.deepEqual(migrate(legacy,'development'),v2);
  assert.throws(()=>migrate({...legacy,extra:true},'development'));assert.throws(()=>migrate(legacy,'production'));
  const malformed=structuredClone(v2);malformed.entries[0].kind='class';assert.throws(()=>queue.restore(malformed));
  queue.restore(v2);at(60000);assert.equal(queue.due('account').length,0);
});
test('verified unknown recovery retains latest successor with original baseline', () => {
  const {queue}=setup();queue.edit(A,key,0,1);queue.saveNow(A);
  const first=queue.claim(queue.due('account')[0].requestId);
  queue.edit(A,key,1,2);queue.settle(first.requestId,{kind:'unknown'});
  const successor=queue.snapshot().entries[1];queue.recover(first.requestId,'retry');
  assert.deepEqual(queue.snapshot().entries.map(e=>[e.requestId,e.baseCompleted,e.desiredCompleted,e.phase]),[[successor.requestId,0,2,'pending']]);
  assert.equal(queue.due('account').length,1);
});
function setup() {
  assert.equal(typeof create, 'function', 'Missing character-bound desktop queue');
  let clock = 0, sequence = 0;
  const queue = create({ environment: 'development', now: () => clock, id: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}` });
  return { queue, at: value => { clock = value; } };
}

test('A switch schedules A independently of B', () => {
  const { queue, at } = setup();
  queue.edit(A, key, 0, 1); at(2000); queue.leaveCharacter(A);
  at(10000); queue.edit(B, key, 0, 1);
  at(16999); assert.equal(queue.due('account').length, 0);
  at(17000); assert.deepEqual(queue.due('account').map(e => e.characterId), ['A']);
  at(25000); assert.deepEqual(queue.due('account').map(e => e.characterId), ['A', 'B']);
});
test('every edit restarts the whole character deadline, not other characters', () => {
  const { queue, at } = setup();
  queue.edit(A, key, 0, 1); queue.edit(B, key, 0, 1);
  at(12000); queue.edit(A, { ...key, taskId: 'other' }, 0, 1);
  at(15000); assert.deepEqual(queue.due('account').map(e => e.characterId), ['B']);
  at(27000); assert.equal(queue.due('account').filter(e => e.characterId === 'A').length, 2);
});
test('coalescing preserves original baseline and returning to baseline creates no write', () => {
  const { queue, at } = setup();
  queue.edit(A, key, 0, 1); at(1000); queue.edit(A, key, 1, 2);
  assert.equal(queue.snapshot().entries[0].baseCompleted, 0);
  assert.equal(queue.snapshot().entries[0].desiredCompleted, 2);
  queue.edit(A, key, 2, 0); at(60000);
  assert.deepEqual(queue.due('account'), []);
  queue.leaveCharacter(B); assert.equal(queue.snapshot().entries.length, 0);
});
test('save now is immediate and discard affects only the chosen character pending edits', () => {
  const { queue } = setup(); queue.edit(A, key, 0, 1); queue.edit(B, key, 0, 1);
  queue.saveNow(A); assert.deepEqual(queue.due('account').map(e => e.characterId), ['A']);
  queue.discard(A); assert.deepEqual(queue.snapshot().entries.map(e => e.characterId), ['B']);
});
test('A to B to A keeps independent deadlines and account queues are isolated', () => {
  const { queue, at } = setup(); queue.edit(A, key, 0, 1);
  at(1000); queue.leaveCharacter(A); queue.edit(B, key, 0, 1);
  at(2000); queue.leaveCharacter(B);
  queue.edit({ ...A, accountId: 'other' }, key, 0, 1);
  at(16000); assert.deepEqual(queue.due('account').map(e => e.characterId), ['A']);
  at(17000); assert.equal(queue.due('other').length, 1);
});
test('claim is once-only and serial across all characters', () => {
  const { queue, at } = setup(); queue.edit(A, key, 0, 1); queue.edit(B, key, 0, 1); at(15000);
  const [a, b] = queue.due('account'); assert.equal(queue.claim(a.requestId).phase, 'inflight');
  assert.equal(queue.claim(a.requestId), null); assert.equal(queue.claim(b.requestId), null);
  queue.settle(a.requestId, { kind: 'saved', completed: 1 });
  assert.equal(queue.claim(b.requestId).characterId, 'B');
});
test('late A success preserves B and edits made during A saving', () => {
  const { queue, at } = setup(); queue.edit(A, key, 0, 1); at(15000);
  const a = queue.claim(queue.due('account')[0].requestId);
  at(16000); queue.edit(A, key, 0, 2); queue.edit(B, key, 0, 1);
  queue.settle(a.requestId, { kind: 'saved', completed: 1 });
  const entries = queue.snapshot().entries;
  assert.equal(entries.length, 2);
  assert.equal(entries.find(e => e.characterId === 'A').baseCompleted, 1);
  assert.equal(entries.find(e => e.characterId === 'A').desiredCompleted, 2);
  assert.equal(entries.find(e => e.characterId === 'B').desiredCompleted, 1);
  queue.settle(a.requestId, { kind: 'saved', completed: 1 });
  assert.equal(queue.snapshot().entries.length, 2, 'duplicate acknowledgment removed new work');
});
test('undo while saving remains a separate write against acknowledged value', () => {
  const { queue, at } = setup(); queue.edit(A, key, 0, 1); at(15000);
  const a = queue.claim(queue.due('account')[0].requestId);
  queue.edit(A, key, 0, 0); queue.discard(B);
  queue.settle(a.requestId, { kind: 'saved', completed: 1 });
  assert.equal(queue.snapshot().entries[0].baseCompleted, 1);
  assert.equal(queue.snapshot().entries[0].desiredCompleted, 0);
});
test('discard never deletes inflight and no-op successor is removed', () => {
  const { queue, at } = setup(); queue.edit(A, key, 0, 1); at(15000);
  const a = queue.claim(queue.due('account')[0].requestId);
  queue.edit(A, key, 0, 2); queue.edit(A, key, 0, 1);
  queue.discard(A); assert.equal(queue.snapshot().entries.length, 1);
  queue.settle(a.requestId, { kind: 'saved', completed: 1 });
  assert.equal(queue.snapshot().entries.length, 0);
});
test('unknown outcome blocks automatic replay and preserves newer revision', () => {
  const { queue, at } = setup(); queue.edit(A, key, 0, 1); at(15000);
  const a = queue.claim(queue.due('account')[0].requestId);
  queue.edit(A, key, 0, 2); queue.settle(a.requestId, { kind: 'unknown' });
  at(60000); queue.saveNow(A); assert.deepEqual(queue.due('account'), []);
  assert.equal(queue.claim(a.requestId), null);
  assert.throws(() => queue.edit(A, key, 0, 3), /unresolved/i);
  queue.settle(a.requestId, { kind: 'saved', completed: 1 });
  assert.equal(queue.due('account')[0].desiredCompleted, 2);
});
test('conflict and expired period never become due or silently disappear', () => {
  for (const kind of ['conflict', 'expired']) {
    const { queue, at } = setup(); queue.edit(A, key, 0, 1); at(15000);
    const a = queue.claim(queue.due('account')[0].requestId);
    queue.settle(a.requestId, { kind }); queue.discard(A); at(60000);
    assert.equal(queue.snapshot().entries[0].phase, kind);
    assert.deepEqual(queue.due('account'), []);
  }
});
test('snapshot is detached and JSON recovery never automatically replays pending or inflight', () => {
  const { queue, at } = setup(); queue.edit(A, key, 0, 1); queue.edit(B, key, 0, 1); at(15000);
  queue.claim(queue.due('account')[0].requestId);
  const snapshot = JSON.parse(JSON.stringify(queue.snapshot()));
  queue.restore(snapshot); at(60000); assert.deepEqual(queue.due('account'), []);
  assert.ok(queue.snapshot().entries.every(e => e.phase === 'unknown'));
  snapshot.entries[0].desiredCompleted = 99;
  assert.equal(queue.snapshot().entries[0].desiredCompleted, 1);
});
test('malformed recovery is atomic and rejects duplicate identities and secret fields', () => {
  const { queue } = setup(); queue.edit(A, key, 0, 1); const before = queue.snapshot();
  for (const mutate of [s => { s.schemaVersion = 4; }, s => s.entries.push({ ...s.entries[0] }),
    s => { s.entries[0].code = 'must-not-store'; }, s => { s.entries[0].desiredCompleted = -1; },
    s => { s.entries[0].deadlineAt = NaN; }, s => { s.entries[0].phase = 'invented'; }]) {
    const bad = structuredClone(before); mutate(bad);
    assert.throws(() => queue.restore(bad)); assert.deepEqual(queue.snapshot(), before);
  }
});
test('invalid edits and queue capacity rejection leave previous work intact', () => {
  const { queue } = setup(); queue.edit(A, key, 0, 1); const before = queue.snapshot();
  assert.throws(() => queue.edit(A, key, 0, 1001));
  assert.throws(() => queue.edit({ ...A, accountId: '' }, key, 0, 1));
  assert.deepEqual(queue.snapshot(), before);
  for (let i = 1; i < 500; i++) queue.edit(A, { ...key, taskId: `task-${i}` }, 0, 1);
  assert.throws(() => queue.edit(B, key, 0, 1), /capacity/i);
  assert.equal(queue.snapshot().entries.length, 500);
});
test('different periods and environments never coalesce and bad success cannot discard work', () => {
  const { queue, at } = setup(); queue.edit(A, key, 0, 1);
  queue.edit(A, { ...key, periodKey: '2026-10-11T21:00:00.000Z' }, 0, 1);
  queue.edit({ ...A, environment: 'production' }, key, 0, 1); at(15000);
  const a = queue.claim(queue.due('account')[0].requestId);
  assert.throws(() => queue.settle(a.requestId, { kind: 'saved', completed: 2 }));
  assert.equal(queue.snapshot().entries.length, 3);
});
test('development queue cannot dispatch production work even by direct claim', () => {
  const { queue, at } = setup();
  queue.edit({ ...A, environment: 'production' }, key, 0, 1); at(15000);
  assert.deepEqual(queue.due('account'), []);
  assert.equal(queue.claim(queue.snapshot().entries[0].requestId), null);
});
test('noncanonical period dates cannot create unsendable durable edits', () => {
  const { queue } = setup();
  assert.throws(() => queue.edit(A, { ...key, periodKey: '2026-02-30T21:00:00.000Z' }, 0, 1));
  assert.deepEqual(queue.snapshot().entries, []);
});
test('UUID rejected by server contract cannot create unsendable durable edits', () => {
  const invalidIdQueue = create({ environment: 'development', now: () => 0,
    id: () => '00000000-0000-0000-0000-000000000000' });
  assert.throws(() => invalidIdQueue.edit(A, key, 0, 1));
  assert.deepEqual(invalidIdQueue.snapshot().entries, []);
});
