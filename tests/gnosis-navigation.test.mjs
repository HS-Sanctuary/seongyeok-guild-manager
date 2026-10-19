import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';

test('navigation edits can rename reorder and choose a built-in mark without changing category keys',()=>{
  const {DEFAULT_GNOSIS_NAVIGATION,parseGnosisNavigation}=loadTS('lib/gnosisNavigation.ts');
  const rows=DEFAULT_GNOSIS_NAVIGATION.map(row=>({...row}));
  const combat=rows.find(row=>row.key==='전투');
  combat.label='전투 공략'; combat.icon='전투';
  rows.unshift(rows.splice(rows.indexOf(combat),1)[0]);
  const result=parseGnosisNavigation({version:1,items:rows});
  assert.equal(result[0].key,'전투');
  assert.equal(result[0].label,'전투 공략');
  assert.equal(result.length,7);
});
test('settings reject missing duplicate and foreign keys and arbitrary asset paths',()=>{
  const {DEFAULT_GNOSIS_NAVIGATION,parseGnosisNavigation}=loadTS('lib/gnosisNavigation.ts');
  const rows=DEFAULT_GNOSIS_NAVIGATION.map(row=>({...row}));
  for(const items of [rows.slice(1),[rows[0],...rows.slice(0,-1)],rows.map((row,index)=>index?row:{...row,key:'unknown'}),rows.map((row,index)=>index?row:{...row,icon:'https://example.com/track.svg'}),rows.map((row,index)=>index?row:{...row,label:' '.repeat(3)})]) {
    assert.equal(parseGnosisNavigation({version:1,items}),null);
  }
  assert.equal(parseGnosisNavigation({version:2,items:rows}),null);
});
test('invalid drafts cannot silently erase categories or accept extra fields',()=>{
  const {DEFAULT_GNOSIS_NAVIGATION,parseGnosisNavigation}=loadTS('lib/gnosisNavigation.ts');
  assert.equal(parseGnosisNavigation(null),null);
  assert.equal(parseGnosisNavigation({version:1,items:[]}),null);
  assert.equal(parseGnosisNavigation({version:1,items:DEFAULT_GNOSIS_NAVIGATION,extra:'field'}),null);
});
