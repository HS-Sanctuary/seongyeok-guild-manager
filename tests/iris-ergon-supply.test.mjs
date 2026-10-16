import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonSupply.ts')?loadTS('lib/irisErgonSupply.ts'):{};
const stamp=10000,frame=(kind,items)=>({schemaVersion:1,kind,observedAt:stamp,source:'official-cli',data:{items,unlocked:true}}),recipe=(name,output=1)=>({name,available:false,producedPerUnit:output,reason:null,missing:null}),ref=(kind,name,output,ingredients)=>({schemaVersion:1,kind,displayName:name,source:'installed-reference',modifiedAt:1000,outputPerUnit:output,complete:false,ingredients:ingredients.map(([name,required])=>({name,required}))});
const base={kind:'crafting',displayName:'검',additionalQuantity:3,now:stamp,materials:frame('materials',[{name:'목재',category:'Ingredient',location:'inventory',count:1,locked:false},{name:'통나무',category:'Ingredient',location:'inventory',count:1,locked:false}]),crafting:frame('crafting',[recipe('검')]),altering:frame('altering',[recipe('목재',3)]),gathering:frame('gathering',[{name:'통나무',toolOk:true}]),references:[ref('crafting','검',1,[['목재',2]]),ref('altering','목재',3,[['통나무',4]])]};
test('supply preview subtracts bag stock once, expands processing and orders gathering→processing→receipt→craft',()=>{
 assert.equal(typeof api.buildErgonSupplyPreview,'function');const preview=api.buildErgonSupplyPreview(base);assert.deepEqual(preview.steps.map(row=>row.kind),['gathering','altering','collect','crafting']);assert.equal(preview.steps[0].additionalQuantity,7);assert.equal(preview.steps[1].additionalQuantity,5);assert.equal(preview.steps[1].runs,2);assert.equal(preview.steps[1].expectedOutput,6);assert.equal(preview.wingMinimum,20);assert.equal(preview.wingMaximum,null);assert.equal(preview.automaticReady,false);assert.ok(preview.issues.some(row=>row.includes('참고')));
});
test('warehouse material advice is conditional on remote transfer and reserves storage only once',()=>{
 const p={...base,additionalQuantity:1,materials:frame('materials',[{name:'통나무',category:'Ingredient',location:'inventory',count:5,locked:false},{name:'통나무',category:'Ingredient',location:'account_storage',count:100,locked:false}]),altering:frame('altering',[recipe('목재'),recipe('손잡이')]),references:[ref('crafting','검',1,[['목재',1],['손잡이',1]]),ref('altering','목재',1,[['통나무',4]]),ref('altering','손잡이',1,[['통나무',4]])]};
 const preview=api.buildErgonSupplyPreview(p);assert.equal(preview.steps.filter(row=>row.kind==='gathering').reduce((sum,row)=>sum+row.additionalQuantity,0),0);
 assert.ok(preview.steps.some(row=>row.kind==='manual'&&row.note.includes('전송기')),'stored stock is not unconditional free material');assert.equal(preview.automaticReady,false);
 const limited=api.buildErgonSupplyPreview({...p,materials:frame('materials',[{name:'통나무',category:'Ingredient',location:'inventory',count:1,locked:false},{name:'통나무',category:'Ingredient',location:'account_storage',count:2,locked:false},{name:'통나무',category:'Ingredient',location:'character_storage',count:2,locked:false}])});assert.equal(limited.steps.find(row=>row.kind==='gathering').additionalQuantity,3,'warehouse stock must not be reused for both dependencies');
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

const goal=(id,name,quantity=1,kind='crafting')=>({id,kind,displayName:name,targetQuantity:quantity});
const batch=input=>{assert.equal(typeof api.buildErgonSupplyBatchPreview,'function');return api.buildErgonSupplyBatchPreview(input);};
test('two queued goals reserve the same bag stock only once and keep both additional outputs',()=>{
 const input={...base,plans:[goal('a','검'),goal('b','도끼')],materials:frame('materials',[{name:'통나무',category:'Ingredient',location:'inventory',count:5,locked:false},{name:'검',category:'Ingredient',location:'inventory',count:90,locked:false}]),crafting:frame('crafting',[recipe('검'),recipe('도끼')]),altering:frame('altering',[]),references:[ref('crafting','검',1,[['통나무',4]]),ref('crafting','도끼',1,[['통나무',4]])]};
 const p=batch(input);assert.equal(p.steps.find(s=>s.kind==='gathering').additionalQuantity,3);assert.deepEqual(p.steps.filter(s=>s.kind==='crafting').map(s=>[s.displayName,s.expectedOutput]),[['검',1],['도끼',1]]);assert.equal(p.automaticReady,false);
});
test('a queued final product stays reserved, only its rounding surplus supplies another goal',()=>{
 const p=batch({...base,plans:[goal('a','목재',1,'altering'),goal('b','검')],materials:frame('materials',[]),references:[ref('crafting','검',1,[['목재',3]]),ref('altering','목재',3,[['통나무',4]])]});
 assert.equal(p.steps.find(s=>s.kind==='gathering').additionalQuantity,8,'one final wood + three for sword needs two runs, not one');
 assert.deepEqual(p.steps.filter(s=>s.kind==='altering').map(s=>s.additionalQuantity),[1,1],'only two surplus wood are reserved for sword');
 assert.equal(p.steps.filter(s=>s.kind==='collect').length,2,'registration is not collected stock');
});
test('direct gather goals add quantities without subtracting existing finished stock',()=>{
 const p=batch({...base,plans:[goal('a','통나무',4,'gathering'),goal('b','통나무',3,'gathering')],materials:frame('materials',[{name:'통나무',category:'Ingredient',location:'inventory',count:100,locked:false}])});
 assert.equal(p.steps.length,1);assert.equal(p.steps[0].additionalQuantity,7);assert.equal(p.automaticReady,false);
});
test('queued preview enforces total node and depth bounds and rejects invalid or oversized goals',()=>{
 const empty=batch({...base,plans:[]});assert.deepEqual(empty.steps,[]);
 const huge=batch({...base,plans:Array.from({length:51},(_,i)=>goal(String(i),'검'))});assert.equal(huge.steps.length,0);assert.ok(huge.issues.length);
 const invalid=batch({...base,plans:[goal('a','검',0)]});assert.ok(invalid.issues.length);assert.equal(invalid.steps.length,0);
 const refs=[],recipes=[];for(let i=0;i<7;i++){refs.push(ref('crafting','품목'+i,1,[['품목'+(i+1),1]]));recipes.push(recipe('품목'+i));}
 const deep=batch({...base,plans:[goal('a','품목0')],materials:frame('materials',[]),crafting:frame('crafting',recipes),altering:frame('altering',[]),references:refs});assert.ok(deep.issues.some(s=>s.includes('길어')));assert.equal(deep.steps.at(-1).state,'blocked');assert.equal(deep.automaticReady,false);
 const capped=batch({...base,plans:Array.from({length:33},(_,i)=>goal(String(i),'통나무',1,'gathering'))});assert.ok(capped.issues.some(s=>s.includes('길어')));assert.ok(capped.steps.some(s=>s.state==='blocked'));
});
test('confirmed final outputs remain reserved in fresh bag stock; only confirmed rounding excess may feed another goal',()=>{
 const input={...base,plans:[goal('b','검')],materials:frame('materials',[{name:'목재',category:'Ingredient',location:'inventory',count:5,locked:false}]),crafting:frame('crafting',[recipe('검'),recipe('목재')]),altering:frame('altering',[]),references:[ref('crafting','검',1,[['목재',5]]),ref('crafting','목재',1,[['통나무',2]])],reservedOutputs:[{name:'목재',quantity:5}]};
 const p=batch(input);assert.equal(p.steps.find(s=>s.kind==='gathering')?.additionalQuantity,10,'confirmed final A5 must not be spent on final B');
 const extra=batch({...input,materials:frame('materials',[{name:'목재',category:'Ingredient',location:'inventory',count:7,locked:false}])});assert.equal(extra.steps.find(s=>s.kind==='gathering').additionalQuantity,6,'two confirmed excess wood are usable, five final wood are not');
 const partial=batch({...input,plans:[goal('a','목재',3),goal('b','검')],materials:frame('materials',[{name:'목재',category:'Ingredient',location:'inventory',count:2,locked:false}]),reservedOutputs:[{name:'목재',quantity:2}]});assert.equal(partial.steps.find(s=>s.kind==='gathering').additionalQuantity,16,'two completed plus three remaining final wood stay separate from five wood needed by sword');
 const invalid=batch({...input,reservedOutputs:[{name:'목재',quantity:-1}]});assert.equal(invalid.steps.length,0);assert.ok(invalid.issues.length);
});
