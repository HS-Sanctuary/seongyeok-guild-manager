import assert from 'node:assert/strict';
import test from 'node:test';

const queueExports = await import('./action-queue.mjs').catch(() => ({}));
const create = () => {
  assert.equal(typeof queueExports.AutomationQueue, 'function', 'safe automation queue is not implemented');
  let time = 10_000;
  const queue = new queueExports.AutomationQueue({ supportedCommands:['gather','collect'], now:() => time });
  const frame = () => ({characterKey:'confirmed-local-character',observedAt:time,connected:true,blocked:false,inventoryRatio:0.5});
  return {queue,frame,advance:delta => {time+=delta;}};
};

test('unsupported jobs and invalid quantities never enter the queue', () => {
  const {queue} = create();
  for(const job of [{kind:'craft',target:'item',quantity:1},{kind:'gather',target:'',quantity:1},{kind:'gather',target:'item',quantity:101},{kind:'collect',target:'facility',quantity:1,command:'injected'}])
    assert.equal(queue.enqueue(job),false);
  assert.equal(queue.snapshot().jobs.length,0);
});
test('disabled defaults require explicit character-bound start and fresh safe snapshot', () => {
  const {queue,frame} = create();
  assert.ok(queue.enqueue({kind:'gather',target:'ore',quantity:20}));
  assert.equal(queue.claim(frame()),null);
  assert.equal(queue.start({characterKey:'confirmed-local-character',maxSeconds:120,inventoryLimit:0.9}),true);
  for(const bad of [{...frame(),connected:false},{...frame(),blocked:true},{...frame(),characterKey:'different'},{...frame(),observedAt:-10_000},{...frame(),observedAt:10_001},{...frame(),inventoryRatio:NaN},{...frame(),inventoryRatio:0.9}]) {
    assert.equal(queue.claim(bad),null);
    assert.equal(queue.snapshot().enabled,false);
    assert.equal(queue.start({characterKey:'confirmed-local-character',maxSeconds:120,inventoryLimit:0.9}),true);
  }
  assert.equal(queue.claim(frame()).quantity,20);
});
test('one claim at a time; accepted is not success and terminal duplicate cannot mutate next job', () => {
  const {queue,frame} = create();
  queue.enqueue({kind:'collect',target:'metal facility',quantity:1});
  queue.enqueue({kind:'gather',target:'wood',quantity:10});
  queue.start({characterKey:'confirmed-local-character',maxSeconds:120,inventoryLimit:0.9});
  const first=queue.claim(frame());
  assert.equal(queue.claim(frame()),null);
  assert.equal(queue.settle(first.id,'accepted'),true);
  assert.equal(queue.snapshot().jobs[0].status,'running');
  assert.equal(queue.claim(frame()),null);
  assert.equal(queue.settle(first.id,'completed'),true);
  const second=queue.claim(frame());
  assert.notEqual(second.id,first.id);
  assert.equal(queue.settle(first.id,'failed'),false);
  assert.equal(queue.snapshot().jobs[1].status,'running');
});
test('unknown outcome halts all future actions and cannot be cleared by start', () => {
  const {queue,frame} = create();
  queue.enqueue({kind:'collect',target:'leather facility',quantity:1});
  queue.enqueue({kind:'gather',target:'herb',quantity:10});
  queue.start({characterKey:'confirmed-local-character',maxSeconds:120,inventoryLimit:0.9});
  const first=queue.claim(frame());
  assert.equal(queue.settle(first.id,'timeout'),true);
  assert.equal(queue.snapshot().jobs[0].status,'unknown');
  assert.equal(queue.start({characterKey:'confirmed-local-character',maxSeconds:120,inventoryLimit:0.9}),false);
  assert.equal(queue.claim(frame()),null);
  assert.equal(queue.settle(first.id,'completed'),true);
  assert.equal(queue.claim(frame()),null,'late completion must not resume automatically');
});
test('stop is not a claim that dispatched work was canceled', () => {
  const {queue,frame} = create();
  queue.enqueue({kind:'gather',target:'ore',quantity:10});
  queue.start({characterKey:'confirmed-local-character',maxSeconds:120,inventoryLimit:0.9});
  const job=queue.claim(frame()); queue.stop();
  assert.equal(queue.snapshot().jobs[0].status,'running');
  assert.equal(queue.start({characterKey:'confirmed-local-character',maxSeconds:120,inventoryLimit:0.9}),false);
  assert.equal(queue.settle(job.id,'canceled'),true);
  assert.equal(queue.claim(frame()),null);
});
test('time ceiling and failed/blocked results require a fresh explicit start', () => {
  const {queue,frame,advance} = create();
  queue.enqueue({kind:'gather',target:'ore',quantity:1});
  queue.start({characterKey:'confirmed-local-character',maxSeconds:1,inventoryLimit:0.5});
  advance(1_000); assert.equal(queue.claim({...frame(),inventoryRatio:0.1}),null);
  assert.equal(queue.snapshot().enabled,false);
  assert.equal(queue.start({characterKey:'confirmed-local-character',maxSeconds:3_601,inventoryLimit:0.9}),false);
  assert.equal(queue.start({characterKey:'confirmed-local-character',maxSeconds:120,inventoryLimit:0.96}),false);
  queue.start({characterKey:'confirmed-local-character',maxSeconds:120,inventoryLimit:0.9});
  const job=queue.claim(frame()); assert.equal(queue.settle(job.id,'blocked'),true);
  assert.equal(queue.snapshot().enabled,false);
});
test('queue cap and detached snapshot prevent unbounded or external state mutations', () => {
  const {queue} = create();
  for(let i=0;i<100;i++) assert.ok(queue.enqueue({kind:'gather',target:'ore',quantity:1}));
  assert.equal(queue.enqueue({kind:'gather',target:'ore',quantity:1}),false);
  const snapshot=queue.snapshot(); snapshot.jobs[0].quantity=100; snapshot.jobs.length=0;
  assert.equal(queue.snapshot().jobs.length,100); assert.equal(queue.snapshot().jobs[0].quantity,1);
});

test('duplicate start cannot extend an active time ceiling', () => {
  const {queue,frame,advance}=create();
  queue.enqueue({kind:'gather',target:'ore',quantity:100});
  assert.equal(queue.start({characterKey:'confirmed-local-character',maxSeconds:1,inventoryLimit:0.9}),true);
  advance(500);
  assert.equal(queue.start({characterKey:'confirmed-local-character',maxSeconds:3600,inventoryLimit:0.9}),false);
  advance(500);
  assert.equal(queue.claim(frame()),null);
});
