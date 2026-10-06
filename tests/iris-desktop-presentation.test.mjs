import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const file='lib/irisDesktopPresentation.ts';
const edit=(i,more={})=>({characterId:'84',accountId:'a',environment:'development',category:'daily',taskId:'t'+i,periodKey:'period',requestId:'r'+i,revision:1,baseCompleted:0,desiredCompleted:1,deadlineAt:7000,phase:'pending',...more});
function project(...args){assert.ok(existsSync(file),'Missing compact save projection');return loadTS(file).summarizeDesktopEdits(...args);}
test('groups same-character edits once and exposes named paused rows',()=>{
  const entries=[1,2,3,4,5].map(i=>edit(i,i===5?{phase:'unknown'}:{}));
  const selected={characterId:'84',accountId:'a',details:{tasks:{daily:[{id:'t5',name:'요일 던전'}],weekly:[],abyss:[],raid:[]}}};
  const result=project(entries,[{id:'84',nickname:'화연'}],selected,0);
  assert.deepEqual(result.groups,[{characterId:'84',nickname:'화연',count:5,remainingSeconds:7,phase:'unknown'}]);
  assert.equal(result.total,5);assert.equal(result.items[0].taskName,'요일 던전');assert.equal(result.items[0].phase,'unknown');
});
test('separate characters retain nearest deadlines and explicit missing-name fallback',()=>{
  const all=[edit(1),edit(2,{deadlineAt:3000}),edit(3,{characterId:'85',phase:'conflict'}),edit(4,{accountId:'other'})];
  const result=project(all.filter(e=>e.accountId==='a'),[{id:'84',nickname:'열두글자닉네임도그대로'}],null,4000);
  assert.equal(result.total,3);assert.equal(result.groups.find(g=>g.characterId==='84').remainingSeconds,0);
  assert.equal(result.groups.find(g=>g.characterId==='85').nickname,'캐릭터 확인 필요');
  assert.equal(result.items[0].taskName,'항목 확인 필요');
  assert.equal(result.groups[0].phase,'conflict');
});
test('empty queue and in-flight-only queue have no countdown',()=>{
  assert.deepEqual(project([],[],null,0),{groups:[],items:[],total:0});
  assert.equal(project([edit(1,{phase:'inflight'})],[],null,0).groups[0].remainingSeconds,null);
});
