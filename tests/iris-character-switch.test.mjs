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

// Losing the previous observation on a selected-character remount makes the
// first post-switch character the baseline and silently misses every later read.
test('a remounted tracker detects the next character from a fresh retained observation',()=>{
  const create=loadTS('lib/irisCharacterSwitch.ts').createCharacterSwitchTracker;
  const rows=[...characters,saved('c','석궁사수',[30000,4000,4500,7000])];
  const t=create('b',game(1000,'힐러',[20000,4000,2000,6000]),now+2000);
  const switched=game(3000,'석궁사수',[30000,4000,4500,7000]);
  assert.equal(observe(t,switched,rows),null,'The retained observation is not confirming evidence');
  assert.equal(observe(t,switched,rows),null,'A duplicate result cannot confirm');
  assert.equal(observe(t,game(4000,'석궁사수',[30000,4000,4500,7000]),rows)?.id,'c');
});

test('retained observations cannot override a manual selection when the game is unchanged',()=>{
  const create=loadTS('lib/irisCharacterSwitch.ts').createCharacterSwitchTracker;
  const t=create('a',game(1000,'힐러',[20000,4000,2000,6000]),now+2000);
  // Matching job is deliberately the same in both observations, regardless of
  // the character explicitly chosen in SANCTUM.
  assert.equal(observe(t,game(3000,'힐러',[20000,4000,2000,6000])),null);
  assert.equal(observe(t,game(4000,'힐러',[20000,4000,2000,6000])),null);
});

test('stale or incomplete retained observations do not seed a new tracker',()=>{
  const create=loadTS('lib/irisCharacterSwitch.ts').createCharacterSwitchTracker;
  for(const seed of [game(-61000),game(0,'댄서',[10000,null,null,null]),game(0,'댄서',[0,0,0,0])]){
    const t=create('a',seed,now);
    assert.equal(observe(t,game(1000,'힐러',[20000,4000,2000,6000])),null);
    assert.equal(observe(t,game(2000,'힐러',[20000,4000,2000,6000])),null);
  }
});

// The screenshot's zero resistance must not outweigh three close positive
// stats, but tolerant matching must also compare every same-job competitor.
test('three close positive stats suggest 밤설 despite one stale saved zero after two new reads',()=>{
  const t=tracker(),rows=[characters[0],saved('night','힐러',[91186,8366,0,20237])];
  observe(t,game(),rows);
  const first=game(10000,'힐러',[94149,9542,3428,20290]);
  assert.equal(observe(t,first,rows),null);
  assert.equal(observe(t,first,rows),null,'Duplicate evidence cannot confirm tolerant matching');
  assert.equal(observe(t,game(20000,'힐러',[94149,9542,3428,20290]),rows)?.id,'night');
});

test('one stale nonzero saved stat can be tolerated when the other three are close',()=>{
  const t=tracker(),rows=[characters[0],saved('b','힐러',[20000,4000,90000,6000])];
  observe(t,game(),rows);
  assert.equal(observe(t,game(10000,'힐러',[20000,4000,2000,6000]),rows),null);
  assert.equal(observe(t,game(20000,'힐러',[20000,4000,2000,6000]),rows)?.id,'b');
});

test('an exact four-stat candidate cannot beat a rival with the same three close stats',()=>{
  const t=tracker(),rows=[...characters,saved('c','힐러',[20000,4000,0,6000])];
  observe(t,game(),rows);
  for(const at of [10000,20000,30000])assert.equal(observe(t,game(at,'힐러',[20000,4000,2000,6000]),rows),null);
});

test('tolerant matching refuses two stale stats or fewer than three positive comparisons',()=>{
  for(const values of [[20000,4000,90000,90000],[20000,4000,0,null],[20000,4000,null,null]]){
    const t=tracker(),row=saved('b','힐러',values);
    // Preserve null rather than making it a numeric value in this fixture.
    for(let i=0;i<values.length;i++)if(values[i]===null)row.stats[['combat_power','life_energy','magic_resistance','charm'][i]]=null;
    const rows=[characters[0],row];observe(t,game(),rows);
    const live=values[2]===null?[90000,90000,2000,6000]:[20000,4000,2000,6000];
    for(const at of [10000,20000])assert.equal(observe(t,game(at,'힐러',live),rows),null);
  }
});

test('existing two-positive-stat exact matching remains available without tolerant matching',()=>{
  const t=tracker(),row={...characters[1],stats:{combat_power:'20000',life_energy:'4000',magic_resistance:null,charm:null}};
  const rows=[characters[0],row];observe(t,game(),rows);
  assert.equal(observe(t,game(10000,'힐러',[20000,4000,null,null]),rows),null);
  assert.equal(observe(t,game(20000,'힐러',[20000,4000,null,null]),rows)?.id,'b');
});
