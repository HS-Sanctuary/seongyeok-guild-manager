import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const now=Date.parse('2026-10-08T05:00:00Z');
const saved=(id,job,values)=>({id,nickname:id==='a'?'한설':'화연',job,stats:Object.fromEntries(['combat_power','life_energy','magic_resistance','charm'].map((key,i)=>[key,String(values[i])]))});
const characters=[saved('a','댄서',[10000,2000,1000,3000]),saved('b','힐러',[20000,4000,2000,6000])];
const game=(at=0,job='댄서',values=[10000,2000,1000,3000])=>({observedAt:new Date(now+at).toISOString(),job,level:100,stats:Object.fromEntries(['combat_power','life_energy','magic_resistance','charm'].map((key,i)=>[key,values[i]]))});
function tracker(){assert.ok(existsSync('lib/irisCharacterSwitch.ts'),'Missing safe in-game character change tracker');return loadTS('lib/irisCharacterSwitch.ts').createCharacterSwitchTracker('a');}
const observe=(t,snapshot,rows=characters)=>t.observe(rows,snapshot,Date.parse(snapshot.observedAt));

test('unchanged game observations do not replace an explicitly selected character',()=>{
  const t=tracker(),other=game(0,'힐러',[20000,4000,2000,6000]);
  assert.equal(observe(t,other),null);
  assert.equal(observe(t,{...other,observedAt:game(10000).observedAt}),null);
});
test('a different stable candidate requires two distinct fresh observations',()=>{
  const t=tracker();observe(t,game());
  const switched=game(10000,'힐러',[20000,4000,2000,6000]);
  assert.equal(observe(t,switched),null);
  assert.equal(observe(t,switched),null,'Shared in-flight result is not a second observation');
  assert.equal(observe(t,game(20000,'힐러',[20100,4000,2000,6000]))?.id,'b');
});
test('single-stat equipment fluctuation does not count as a character change',()=>{
  const t=tracker(),rows=[characters[0],saved('b','댄서',[18000,2000,1000,3000])];observe(t,game(),rows);
  for(const at of [10000,20000,30000])assert.equal(observe(t,game(at,'댄서',[18000,2000,1000,3000]),rows),null);
});
test('same-job multi-stat changes can suggest a separated matching character',()=>{
  const t=tracker(),rows=[characters[0],saved('b','댄서',[20000,4000,2000,6000])];observe(t,game(),rows);
  assert.equal(observe(t,game(10000,'댄서',[20000,4000,2000,6000]),rows),null);
  assert.equal(observe(t,game(20000,'댄서',[20000,4000,2000,6000]),rows)?.id,'b');
});
test('ambiguous, all-zero, or too incomplete snapshots never propose a switch',()=>{
  for(const [snapshot,rows] of [
    [game(10000,'힐러',[20000,4000,2000,6000]),[...characters,{...characters[1],id:'c'}]],
    [game(10000,'힐러',[0,0,0,0]),characters],
    [game(10000,'힌러',[20000,null,null,null]),characters],
    [game(10000,'힐러',[20000,null,null,null]),characters],
  ]){const t=tracker();observe(t,game());assert.equal(observe(t,snapshot,rows),null);assert.equal(observe(t,{...snapshot,observedAt:game(20000).observedAt},rows),null);}
});
test('a failed or stale read interrupts the consecutive-candidate streak',()=>{
  const t=tracker();observe(t,game());observe(t,game(10000,'힐러',[20000,4000,2000,6000]));
  assert.equal(t.observe(characters,game(10000,'힐러',[20000,4000,2000,6000]),now+80000),null);
  assert.equal(observe(t,game(90000,'힐러',[20000,4000,2000,6000])),null);
  t.invalidate();assert.equal(observe(t,game(100000,'힐러',[20000,4000,2000,6000])),null);
  assert.equal(observe(t,game(110000,'힐러',[20000,4000,2000,6000]))?.id,'b');
});
test('No suppresses the same candidate until returning to the selected character',()=>{
  const t=tracker();observe(t,game());observe(t,game(10000,'힐러',[20000,4000,2000,6000]));
  assert.equal(observe(t,game(20000,'힐러',[20000,4000,2000,6000]))?.id,'b');t.dismiss();
  for(const at of [30000,40000])assert.equal(observe(t,game(at,'힐러',[20100,4000,2000,6000])),null);
  assert.equal(observe(t,game(50000)),null);
  assert.equal(observe(t,game(60000,'힐러',[20000,4000,2000,6000])),null);
  assert.equal(observe(t,game(70000,'힐러',[20000,4000,2000,6000]))?.id,'b');
});
test('late older observations do not resurrect a candidate after returning to the current character',()=>{
  const t=tracker();observe(t,game());observe(t,game(10000,'힐러',[20000,4000,2000,6000]));
  assert.equal(observe(t,game(20000)),null);
  assert.equal(observe(t,game(10000,'힐러',[20000,4000,2000,6000])),null);
  assert.equal(observe(t,game(30000,'힐러',[20000,4000,2000,6000])),null);
});
test('zero-only overlap with missing saved power values cannot identify a character',()=>{
  const t=tracker(),rows=[characters[0],{id:'b',nickname:'화연',job:'댄서',stats:{combat_power:null,life_energy:null,magic_resistance:'0',charm:'0'}}];
  observe(t,game(),rows);
  assert.equal(observe(t,game(10000,'댄서',[20000,4000,0,0]),rows),null);
  assert.equal(observe(t,game(20000,'댄서',[20000,4000,0,0]),rows),null);
});
