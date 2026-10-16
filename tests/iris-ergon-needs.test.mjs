import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonNeeds.ts')?loadTS('lib/irisErgonNeeds.ts'):{};
const recipe={name:'검',available:false,producedPerUnit:1,reason:null,missing:[{name:'상급 목재',required:3,owned:2}]};
const frame=items=>({schemaVersion:1,kind:'materials',source:'official-cli',observedAt:10000,data:{items}});
test('partial needs multiply required quantities, subtract owned once and never assert full BOM',()=>{
 assert.equal(typeof api.calculateErgonNeeds,'function');const result=api.calculateErgonNeeds(recipe,3,null,10000);assert.equal(result.coverage,'partial');assert.equal(result.runs,3);assert.deepEqual(result.rows,[{name:'상급 목재',required:9,owned:2,stored:null,deficit:7}]);
 assert.equal(api.calculateErgonNeeds({...recipe,missing:null},3,null,10000).coverage,'unavailable');
});
test('material needs expose fresh warehouse stock separately from immediately usable bag stock',()=>{
 const row={name:'상급 목재',category:'Ingredient',categoryName:'재료',location:'inventory',count:3,locked:false};
 const needs=api.calculateErgonNeeds(recipe,3,frame([row,{...row,location:'account_storage',count:4},{...row,location:'character_storage',count:2}]),10000).rows[0];assert.equal(needs.deficit,6);assert.equal(needs.stored,6);
 assert.equal(api.calculateErgonNeeds(recipe,3,frame([row]),26000).rows[0].owned,null);
 for(const rows of [[{...row,locked:true}],[{...row,count:null}],[row,{...row,category:'Food'}]])assert.equal(api.calculateErgonNeeds(recipe,3,frame(rows),10000).rows[0].deficit,null);
});
test('account storage sap prevents a false shortage when the bag has no sap',()=>{
 const sap={name:'나무 진액',category:'Ingredient',location:'account_storage',count:40,locked:false};
 const current={...recipe,name:'상급 목재',producedPerUnit:3,available:true,missing:[{name:'나무 진액',required:4,owned:0}]};
 assert.deepEqual(api.calculateErgonNeeds(current,1,frame([sap]),10000).rows,[{name:'나무 진액',required:4,owned:0,stored:40,deficit:4}]);
});
test('unknown production units and invalid quantities do not invent a material goal',()=>{
 for(const quantity of [0,-1,1.2,Infinity])assert.equal(api.calculateErgonNeeds(recipe,quantity,null,10000).runs,null);
 assert.equal(api.calculateErgonNeeds({...recipe,producedPerUnit:null},3,null,10000).runs,null);
 assert.equal(api.calculateErgonNeeds({...recipe,producedPerUnit:3},4,null,10000).rows[0].required,6);
});
