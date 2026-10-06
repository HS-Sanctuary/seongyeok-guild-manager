import test from 'node:test';import assert from 'node:assert/strict';
const contract=await import('./action-contract.mjs').catch(()=>({}));
const plan=(job,catalog,options={})=>{assert.equal(typeof contract.planAction,'function','CLI request contract is not implemented');return contract.planAction(job,catalog,{now:10000,maxWingCost:5,...options});};
const fixture=()=>({observedAt:10000,gatherable:{items:[{DisplayName:'Exact Ore',ToolOk:true}]},alterable:{items:[{DisplayName:'Exact Plank',Alterable:true,ProducedPerWork:3}]},craftable:{craftingUnlocked:true,items:[{DisplayName:'Exact Food',Craftable:true,ProducedPerCraft:2}]},works:{works:[{DisplayName:'Finished Leather',FacilityName:'Leather Facility',State:'Completed',IsCompleted:true,RemainingSeconds:0},{DisplayName:'Pending Leather',FacilityName:'Leather Facility',State:'InProgress',IsCompleted:false,RemainingSeconds:25}]}});

test('missing transport response is unknown rather than a confirmed rejection',()=>{
  assert.equal(contract.classifyActionResult('gather',null),'unknown');
  assert.equal(contract.classifyActionResult('gather',{status:'unexpected'}),'unknown');
});

test('collection fails closed when display name also identifies another facility',()=>{
  const catalog=fixture();
  catalog.works.works.push({...catalog.works.works[0],FacilityName:'Other Facility'});
  assert.equal(plan({kind:'collect',target:'Leather Facility',quantity:1},catalog).reason,'ambiguous-work');
});
test('gathering contract cannot silently claim arbitrary target quantity or renamed catalog items',()=>{
  const catalog=fixture();
  assert.equal(plan({kind:'gather',target:'Exact Ore',quantity:20},catalog).reason,'unsupported-quantity');
  assert.equal(plan({kind:'gather',target:'exact ore',quantity:100},catalog).ok,false);
  assert.deepEqual(plan({kind:'gather',target:'Exact Ore',quantity:100},catalog),{ok:true,command:'execute_gathering',body:{displayName:'Exact Ore'},estimatedWingCost:5,outputLimit:100});
  catalog.gatherable.items[0].ToolOk=false;assert.equal(plan({kind:'gather',target:'Exact Ore',quantity:100},catalog).reason,'unavailable');
});
test('craft count is number of crafts and altering queues one work not immediate products',()=>{
  assert.deepEqual(plan({kind:'craft',target:'Exact Food',quantity:3},fixture()),{ok:true,command:'execute_crafting',body:{displayName:'Exact Food',craftCount:3},estimatedWingCost:5,expectedOutput:6});
  assert.deepEqual(plan({kind:'process',target:'Exact Plank',quantity:1},fixture()),{ok:true,command:'execute_altering',body:{displayName:'Exact Plank'},estimatedWingCost:5,expectedOutput:3});
  assert.equal(plan({kind:'process',target:'Exact Plank',quantity:2},fixture()).reason,'unsupported-quantity');
  const locked=fixture();locked.craftable.craftingUnlocked=false;assert.equal(plan({kind:'craft',target:'Exact Food',quantity:1},locked).ok,false);
});
test('facility collection selects only an actually completed work and no other facility',()=>{
  assert.deepEqual(plan({kind:'collect',target:'Leather Facility',quantity:1},fixture()),{ok:true,command:'complete_altering_work',body:{displayName:'Finished Leather'},estimatedWingCost:0,facility:'Leather Facility',completedWorks:1});
  assert.equal(plan({kind:'collect',target:'Unknown Facility',quantity:1},fixture()).reason,'no-completed-work');
  const catalog=fixture();catalog.works.works[0].IsCompleted=false;assert.equal(plan({kind:'collect',target:'Leather Facility',quantity:1},catalog).ok,false);
});
test('stale catalog, overspending and malformed data produce no command',()=>{
  const job={kind:'craft',target:'Exact Food',quantity:1};
  assert.equal(plan(job,fixture(),{maxWingCost:4}).reason,'cost-limit');
  const catalog=fixture();catalog.observedAt=-10000;assert.equal(plan(job,catalog).reason,'stale-catalog');
  catalog.observedAt=10001;assert.equal(plan(job,catalog).reason,'stale-catalog');
  catalog.observedAt=10000;catalog.craftable.items[0].ProducedPerCraft=NaN;assert.equal(plan(job,catalog).ok,false);
});
test('accepted alone is unknown; completed, registered, stopped and blocked are distinct',()=>{
  assert.equal(typeof contract.classifyActionResult,'function','CLI outcome contract is not implemented');
  const classify=contract.classifyActionResult;
  assert.equal(classify('collect',{status:'accepted',body:{collected:3}}),'completed');
  assert.equal(classify('collect',{status:'accepted',body:{}}),'unknown');
  assert.equal(classify('collect',{status:'accepted',body:{error:'timeout'}}),'unknown');
  assert.equal(classify('process',{status:'accepted',body:{result:'started'}}),'registered');
  assert.equal(classify('craft',{status:'accepted',body:{result:'completed'}}),'completed');
  assert.equal(classify('gather',{status:'accepted',body:{result:'completed',gained:100,target:100}}),'completed');
  assert.equal(classify('gather',{status:'accepted',body:{result:'started'}}),'running');
  assert.equal(classify('craft',{status:'accepted',body:{error:'blocked'}}),'blocked');
  assert.equal(classify('collect',{status:'accepted',body:{result:'stopped_by_user'}}),'stopped');
  assert.equal(classify('craft',{status:'rejected',body:{error:'not_available'}}),'failed');
  assert.equal(classify('collect',{status:'accepted',body:{collected:3,error:'timeout'}}),'unknown');
});
