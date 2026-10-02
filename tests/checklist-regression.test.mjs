import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
const matching = loadTS('lib/matchingUtils.ts');
const eirel = {id:13,name:'레이드 - 에이렐',type:'raid'};
test('legacy boolean map remains visible in KRONOS', () => {
  assert.equal(matching.isTaskChecked({'레이드 - 에이렐':true}, eirel), true);
});
test('numeric keys from old array spread recover existing entries rather than resetting them', () => {
  assert.deepEqual(matching.normalizeChecklist?.({'0':11,'1':12,'레이드 - 에이렐':true}), [11,12,'레이드 - 에이렐']);
});
test('completing one content preserves previous completed IDs', () => {
  assert.deepEqual(matching.setTaskChecked?.([11,12], eirel, true), [11,12,13]);
});
test('unchecking removes bus alias without removing other contents', () => {
  assert.deepEqual(matching.setTaskChecked?.([11,12,'레이드 - 에이렐',13], eirel, false), [11,12]);
});
test('weekly normal toggle retains repeat progress', () => {
  const raw = {normal:[1,2],repeat:{3:[true,false]},unknown:'keep'};
  assert.deepEqual(matching.setChecklistField?.(raw,{id:2,name:'task'},false,'weekly'), {normal:[1],repeat:{3:[true,false]},unknown:'keep'});
});
test('stale KRONOS autosave preserves a completion added by SYNAXIS after the page opened', () => {
  assert.deepEqual(matching.mergeChecklistEdit?.([11,12,13],[11,12],[12]),[12,13]);
});
test('stale weekly edit keeps unrelated newly saved repeat progress and metadata', () => {
  const base={normal:[1],repeat:{3:[false,false]}};
  const edited={normal:[],repeat:{3:[true,false]}};
  const stored={normal:[1,2],repeat:{3:[false,false],4:[true]},unknown:'keep'};
  assert.deepEqual(matching.mergeChecklistEdit?.(stored,base,edited),{normal:[2],repeat:{3:[true,false],4:[true]},unknown:'keep'});
});
