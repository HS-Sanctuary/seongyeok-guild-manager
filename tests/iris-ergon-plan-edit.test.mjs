import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const {editErgonPlans:edit}=existsSync('lib/irisErgonPlanEdit.ts')?loadTS('lib/irisErgonPlanEdit.ts'):{};
const original=()=>[{id:'a',kind:'crafting',displayName:'검',targetQuantity:20},{id:'b',kind:'altering',displayName:'목재',targetQuantity:3}];
test('quantity commits preserve identity and unrelated rows without mutating input',()=>{
 const rows=original(),result=edit(rows,{type:'quantity',id:'a',quantity:1000000});
 assert.equal(result.items[0].targetQuantity,1000000);assert.deepEqual(result.items[1],rows[1]);assert.equal(rows[0].targetQuantity,20);assert.equal(result.selectedId,'a');
 for(const n of [0,1.5,NaN,Infinity,1000001])assert.throws(()=>edit(rows,{type:'quantity',id:'a',quantity:n}));
 assert.throws(()=>edit(rows,{type:'quantity',id:'absent',quantity:1}));
});
test('replacement keeps quantity but creates a fresh identity and never merges duplicate goals',()=>{
 const rows=original(),result=edit(rows,{type:'replace',id:'a',kind:'crafting',displayName:'도끼',newId:'c'});
 assert.deepEqual(result.items[0],{id:'c',kind:'crafting',displayName:'도끼',targetQuantity:20});assert.equal(result.selectedId,'c');assert.equal(rows[0].displayName,'검');
 const duplicate=edit(rows,{type:'replace',id:'a',kind:'altering',displayName:'목재',newId:'c'});assert.deepEqual(duplicate.items,rows);assert.equal(duplicate.duplicateId,'b');
 const same=edit(rows,{type:'replace',id:'a',kind:'crafting',displayName:'검',newId:'c'});assert.deepEqual(same.items,rows);assert.equal(same.selectedId,'a');
 for(const change of [{newId:'a'},{newId:'b'},{displayName:''},{displayName:'bad\nname'},{kind:'collect'}])assert.throws(()=>edit(rows,{type:'replace',id:'a',kind:'crafting',displayName:'도끼',newId:'c',...change}));
});
test('removal selects adjacent surviving row and last removal yields empty selection',()=>{
 assert.equal(edit(original(),{type:'remove',id:'a'}).selectedId,'b');assert.equal(edit(original(),{type:'remove',id:'b'}).selectedId,'a');
 assert.deepEqual(edit(original().slice(0,1),{type:'remove',id:'a'}),{items:[],selectedId:null,duplicateId:null});
});
test('fifty existing goals stay within the original schema when edited',()=>{
 const rows=Array.from({length:50},(_,i)=>({id:String(i),kind:'crafting',displayName:'품목'+i,targetQuantity:1}));
 assert.equal(edit(rows,{type:'quantity',id:'49',quantity:2}).items.length,50);
 assert.deepEqual(edit(rows,{type:'replace',id:'0',kind:'crafting',displayName:'품목49',newId:'new'}).items,rows);
});
