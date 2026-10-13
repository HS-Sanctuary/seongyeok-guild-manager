import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonPlan.ts')?loadTS('lib/irisErgonPlan.ts'):{};
const item={id:'one',kind:'crafting',displayName:'목재',targetQuantity:20};
const catalog={observedAt:1000,kind:'crafting',data:{items:[{name:'목재',producedPerUnit:3,missing:[{name:'통나무',required:2,owned:1}]}]}};
test('plans reject invalid goals, duplicate identities and excessive rows',()=>{
 assert.equal(typeof api.parseErgonPlans,'function');
 assert.deepEqual(api.parseErgonPlans({schemaVersion:1,items:[item]}),[item]);
 for(const quantity of [0,NaN,1.5,1000001])assert.throws(()=>api.parseErgonPlans({schemaVersion:1,items:[{...item,targetQuantity:quantity}]}));
 assert.throws(()=>api.parseErgonPlans({schemaVersion:1,items:[item,item]}));
 assert.throws(()=>api.parseErgonPlans({schemaVersion:1,items:Array.from({length:51},(_,i)=>({...item,id:String(i)}))}));
});
test('ceil outputs and current one-unit shortage never invent a total BOM',()=>{
 assert.equal(typeof api.calculateErgonPlan,'function');
 const result=api.calculateErgonPlan(item,catalog,1001);
 assert.equal(result.requiredRuns,7);assert.equal(result.wingMinimum,5);assert.equal(result.wingMaximum,35);assert.equal(result.missingScope,'one-unit-only');
 for(const amount of [null,0])assert.equal(api.calculateErgonPlan(item,{...catalog,data:{items:[{...catalog.data.items[0],producedPerUnit:amount}]}},1001).requiredRuns,null);
 assert.equal(api.calculateErgonPlan(item,catalog,16000).requiredRuns,null);
 assert.equal(api.calculateErgonPlan(item,{...catalog,data:{items:[...catalog.data.items,...catalog.data.items]}},1001).requiredRuns,null);
});
test('altering uses one registration per output batch; crafting can group craftCount per call',()=>{
 const result=api.calculateErgonPlan({...item,kind:'altering'},{...catalog,kind:'altering'},1001);
 assert.equal(result.requiredRuns,7);assert.equal(result.wingMinimum,35);assert.equal(result.wingMaximum,35);
});
test('gathering hundred is an upper bound not exact production',()=>{
 const result=api.calculateErgonPlan({...item,kind:'gathering'},{kind:'gathering',observedAt:1000,data:{items:[{name:'목재',toolOk:true}]}},1001);
 assert.equal(result.requiredRuns,1);assert.equal(result.wingMinimum,5);assert.equal(result.wingMaximum,null);assert.equal(result.outputPerRun,null);
});
test('local plans isolate account/environment and preserve corrupt original data',()=>{
 assert.equal(typeof api.readErgonPlans,'function');
 const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 assert.equal(api.writeErgonPlans(storage,'development','a',[item]),true);
 assert.deepEqual(api.readErgonPlans(storage,'development','a').items,[item]);
 assert.deepEqual(api.readErgonPlans(storage,'production','a').items,[]);assert.deepEqual(api.readErgonPlans(storage,'development','b').items,[]);
 const key=[...values.keys()][0];values.set(key,'damaged');
 assert.equal(api.readErgonPlans(storage,'development','a').unreadable,true);
 assert.equal(api.writeErgonPlans(storage,'development','a',[item]),false);assert.equal(values.get(key),'damaged');
 assert.equal(api.writeErgonPlans(storage,'development','a',[item],true),true);
 assert.equal(api.writeErgonPlans({getItem(){throw Error()},setItem(){throw Error()}},'development','a',[item]),false);
});
