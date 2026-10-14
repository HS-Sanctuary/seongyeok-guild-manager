import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonReference.ts')?loadTS('lib/irisErgonReference.ts'):{};
const reference={schemaVersion:1,kind:'crafting',displayName:'라이트 크로스보우S',source:'installed-reference',modifiedAt:10000,outputPerUnit:1,complete:false,ingredients:[{name:'상급 목재',required:3},{name:'강철괴',required:3}]};
test('selected installed reference is dated partial recipe facts, never inventory',()=>{
 assert.equal(typeof api.parseErgonReference,'function');assert.deepEqual(api.parseErgonReference('crafting','라이트 크로스보우S',reference),reference);assert.equal(api.parseErgonReference('crafting','absent',null),null);
 for(const bad of [{...reference,complete:true},{...reference,kind:'altering'},{...reference,source:'official-cli'},{...reference,displayName:'other'},{...reference,ingredients:[{name:'목재',required:3,Owned:100}]},{...reference,ingredients:[{name:'목재',required:3},{name:'목재',required:4}]}])assert.throws(()=>api.parseErgonReference('crafting','라이트 크로스보우S',bad));
});
test('reference fills absent current ingredient list but rejects production or quantity conflicts',()=>{
 const {calculateErgonNeeds}=loadTS('lib/irisErgonNeeds.ts');const recipe={name:reference.displayName,available:true,producedPerUnit:1,reason:null,missing:null},stock={schemaVersion:1,kind:'materials',source:'official-cli',observedAt:10000,data:{items:[{name:'상급 목재',category:'Ingredient',location:'inventory',count:3,locked:false},{name:'강철괴',category:'Ingredient',location:'inventory',count:6,locked:false}]}};
 const result=calculateErgonNeeds(recipe,3,stock,10000,reference);assert.equal(result.referenceUsed,true);assert.deepEqual(result.rows.map(row=>row.deficit),[6,3]);assert.equal(result.coverage,'partial');
 for(const current of [{...recipe,producedPerUnit:2},{...recipe,missing:[{name:'상급 목재',required:4,owned:0}]}])assert.equal(calculateErgonNeeds(current,3,stock,10000,reference).conflict,true);
});
