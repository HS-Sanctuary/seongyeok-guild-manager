import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonSupply.ts')?loadTS('lib/irisErgonSupply.ts'):{};
const stamp=10000,frame=(kind,items)=>({schemaVersion:1,kind,observedAt:stamp,source:'official-cli',data:{items,unlocked:true}}),recipe=(name,output=1)=>({name,available:false,producedPerUnit:output,reason:null,missing:null}),ref=(kind,name,output,ingredients)=>({schemaVersion:1,kind,displayName:name,source:'installed-reference',modifiedAt:1000,outputPerUnit:output,complete:false,ingredients:ingredients.map(([name,required])=>({name,required}))});
const base={kind:'crafting',displayName:'검',additionalQuantity:3,now:stamp,materials:frame('materials',[{name:'목재',category:'Ingredient',location:'inventory',count:1,locked:false},{name:'통나무',category:'Ingredient',location:'inventory',count:1,locked:false}]),crafting:frame('crafting',[recipe('검')]),altering:frame('altering',[recipe('목재',3)]),gathering:frame('gathering',[{name:'통나무',toolOk:true}]),references:[ref('crafting','검',1,[['목재',2]]),ref('altering','목재',3,[['통나무',4]])]};
test('supply preview subtracts bag stock once, expands processing and orders gathering→processing→receipt→craft',()=>{
 assert.equal(typeof api.buildErgonSupplyPreview,'function');const preview=api.buildErgonSupplyPreview(base);assert.deepEqual(preview.steps.map(row=>row.kind),['gathering','altering','collect','crafting']);assert.equal(preview.steps[0].additionalQuantity,7);assert.equal(preview.steps[1].additionalQuantity,5);assert.equal(preview.steps[1].runs,2);assert.equal(preview.steps[1].expectedOutput,6);assert.equal(preview.wingMinimum,20);assert.equal(preview.wingMaximum,null);assert.equal(preview.automaticReady,false);assert.ok(preview.issues.some(row=>row.includes('참고')));
});
test('shared materials are reserved across dependencies without counting warehouses',()=>{
 const p={...base,additionalQuantity:1,materials:frame('materials',[{name:'통나무',category:'Ingredient',location:'inventory',count:5,locked:false},{name:'통나무',category:'Ingredient',location:'account_storage',count:100,locked:false}]),altering:frame('altering',[recipe('목재'),recipe('손잡이')]),references:[ref('crafting','검',1,[['목재',1],['손잡이',1]]),ref('altering','목재',1,[['통나무',4]]),ref('altering','손잡이',1,[['통나무',4]])]};
 const preview=api.buildErgonSupplyPreview(p);assert.equal(preview.steps.filter(row=>row.kind==='gathering').reduce((sum,row)=>sum+row.additionalQuantity,0),3);
});
test('missing references request only needed provider facts; stocked ingredients never cause cache reads',()=>{
 const without=api.buildErgonSupplyPreview({...base,references:[base.references[0]]});assert.deepEqual(without.referencesNeeded,[{kind:'altering',displayName:'목재'}]);
 const enough=api.buildErgonSupplyPreview({...base,materials:frame('materials',[{name:'목재',category:'Ingredient',location:'inventory',count:6,locked:false}]),references:[base.references[0]]});assert.deepEqual(enough.referencesNeeded,[]);assert.deepEqual(enough.steps.map(row=>row.kind),['crafting']);
});
test('cycles, stock ambiguity, stale frames and conflicting reference quantities never become executable',()=>{
 const cycle=api.buildErgonSupplyPreview({...base,altering:frame('altering',[recipe('목재')]),references:[base.references[0],ref('altering','목재',1,[['목재',2]])]});assert.ok(cycle.issues.some(row=>row.includes('순환')));
 const ambiguous=api.buildErgonSupplyPreview({...base,materials:frame('materials',[{name:'목재',category:'Ingredient',location:'inventory',count:1,locked:false},{name:'목재',category:'Food',location:'inventory',count:1,locked:false}])});assert.ok(ambiguous.issues.some(row=>row.includes('재고')));
 const stale=api.buildErgonSupplyPreview({...base,now:stamp+16000});assert.ok(stale.issues.some(row=>row.includes('다시 조회')));
 const conflict=api.buildErgonSupplyPreview({...base,crafting:frame('crafting',[{...recipe('검'),missing:[{name:'목재',required:99,owned:0}]}])});assert.ok(conflict.issues.some(row=>/달라|다르/.test(row)));assert.ok(conflict.steps.some(row=>row.state==='blocked'));
 for(const p of [cycle,ambiguous,stale,conflict])assert.equal(p.automaticReady,false);
});

test('official additional missing ingredients are not omitted by a partial reference',()=>{
 const input={...base,additionalQuantity:1,materials:frame('materials',[{name:'목재',category:'Ingredient',location:'inventory',count:2,locked:false}]),crafting:frame('crafting',[{...recipe('검'),missing:[{name:'광석',required:3,owned:0}]}]),gathering:frame('gathering',[{name:'광석',toolOk:true}])};
 const result=api.buildErgonSupplyPreview(input);assert.equal(result.steps[0].displayName,'광석');assert.equal(result.steps[0].additionalQuantity,3);assert.equal(result.wingMinimum,10);
 const unknown=api.buildErgonSupplyPreview({...input,crafting:frame('crafting',[{...recipe('검'),missing:[{name:'광석',required:null,owned:0}]}])});assert.ok(unknown.steps.some(row=>row.displayName==='광석'&&row.state==='blocked'));assert.equal(unknown.steps.at(-1).state,'blocked');
});

test('known locked crafting appears as a blocked stage rather than an ordinary preview',()=>{
 const input={...base,additionalQuantity:1,materials:frame('materials',[{name:'목재',category:'Ingredient',location:'inventory',count:2,locked:false}]),crafting:{...base.crafting,data:{...base.crafting.data,unlocked:false}}};
 const result=api.buildErgonSupplyPreview(input);assert.ok(result.issues.some(row=>row.includes('해금')));assert.equal(result.steps.at(-1).state,'blocked');
});
