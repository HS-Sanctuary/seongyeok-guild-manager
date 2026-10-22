import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
import {execFileSync} from 'node:child_process';

const api = existsSync('lib/irisErgonProgress.ts') ? loadTS('lib/irisErgonProgress.ts') : {};
const scope = {environment:'development',accountId:'synthetic-account',characterId:'synthetic-character'};
const goalId = '10000000-0000-4000-8000-000000000001';
const requestId = '20000000-0000-4000-8000-000000000001';
function view(quantity=null) {
  const confirmations = quantity===null ? [] : [{eventId:'30000000-0000-4000-8000-000000000001',revision:4,quantity,source:'user-confirmed',confirmedAt:1000,supersedesEventId:null,reason:null}];
  return {schemaVersion:1,revision:4,health:'ok',scope:{...scope},capacityWarning:false,recoveryCandidates:[],goals:[{
    goalId,sourcePlanId:'synthetic-plan',parentGoalId:null,rootGoalId:goalId,action:'crafting',displayName:'합성 검',targetQuantity:4,lifecycle:'active',detached:false,
    confirmedQuantity:quantity??0,remainingQuantity:Math.max(0,4-(quantity??0)),excessQuantity:Math.max(0,(quantity??0)-4),quantityUnconfirmed:quantity===null,quantitySatisfied:quantity!==null&&quantity>=4,registeredCount:0,
    requests:[{requestId,action:'crafting',displayName:'합성 검',craftCount:4,outputPerCraft:1,expectedOutput:4,processingRound:null,preparedAt:500,expiresAt:1500,terminalOutcome:'completed',quantity,confirmations}],
  }]};
}
function parse(value) { assert.equal(typeof api.parseErgonProgressView,'function','missing strict native projection contract'); return api.parseErgonProgressView(value,scope); }

test('Q04 empty quantity is not zero; Q06 unsafe inputs never clamp',()=>{
  assert.equal(typeof api.parseErgonQuantityInput,'function','missing quantity input contract');
  for (const text of ['', ' ', '\t']) assert.deepEqual(api.parseErgonQuantityInput(text),{kind:'empty'});
  assert.deepEqual(api.parseErgonQuantityInput('0'),{kind:'valid',quantity:0});
  assert.deepEqual(api.parseErgonQuantityInput(' 5000000 '),{kind:'valid',quantity:5000000});
  for(const text of ['-1','1.2','NaN','Infinity','5000001','1e3','0x10','１','+3',{},null]) assert.deepEqual(api.parseErgonQuantityInput(text),{kind:'invalid'});
});
test('Q01/Q02/Q03 native projections preserve null, explicit zero and three of four',()=>{
  assert.equal(parse(view()).goals[0].quantityUnconfirmed,true);
  assert.equal(parse(view(0)).goals[0].requests[0].quantity,0);
  assert.equal(parse(view(3)).goals[0].remainingQuantity,1);
});
test('Q05/Q12 excess and lowered quantities are checked against the actual latest contribution',()=>{
  assert.equal(parse(view(6)).goals[0].excessQuantity,2);
  const bad=view(3); bad.goals[0].quantitySatisfied=true; assert.throws(()=>parse(bad));
});
test('Q10/Q11 stale correction chains and inconsistent sums are rejected',()=>{
  const corrected=view(2), r=corrected.goals[0].requests[0];
  r.confirmations=[{...r.confirmations[0],quantity:3,revision:3}, {...r.confirmations[0],eventId:'30000000-0000-4000-8000-000000000002',supersedesEventId:r.confirmations[0].eventId,reason:'오입력 정정',revision:4}];
  assert.equal(parse(corrected).goals[0].confirmedQuantity,2);
  r.confirmations[1].supersedesEventId=null; assert.throws(()=>parse(corrected));
  const sum=view(3); sum.goals[0].confirmedQuantity=6; assert.throws(()=>parse(sum));
});
test('I01/I02/I05 foreign scope, duplicate goals and request reuse are rejected',()=>{
  for(const key of ['environment','accountId','characterId']) {const bad=view(3); bad.scope[key]='foreign'; assert.throws(()=>parse(bad));}
  const bad=view(3); bad.goals.push(structuredClone(bad.goals[0])); assert.throws(()=>parse(bad));
  bad.goals[1].goalId='10000000-0000-4000-8000-000000000002'; bad.goals[1].rootGoalId=bad.goals[1].goalId; assert.throws(()=>parse(bad));
});
test('Q06/Q14 reader rejects tampering, unknown fields and official quantity claims',()=>{
  for(const mutate of [v=>v.revision=1.5,v=>v.schemaVersion=2,v=>v.goals[0].targetQuantity=0,v=>v.goals[0].requests[0].confirmations[0].source='official-verified',v=>v.goals[0].requests[0].expectedOutput=5,v=>v.executeAllowed=true,v=>v.goals[0].requests[0].quantity=-1]) { const bad=view(3); mutate(bad); assert.throws(()=>parse(bad)); }
  const value=view(3), parsed=parse(value); parsed.goals[0].displayName='local edit'; assert.equal(value.goals[0].displayName,'합성 검','reader must not expose mutable native input');
});
test('I06 processing rounds are monotone identities, not production quantity or facility slots',()=>{
  const v=view(); const g=v.goals[0]; g.action='altering'; g.confirmedQuantity=0; g.remainingQuantity=4; g.quantityUnconfirmed=false; g.registeredCount=1;
  g.requests=[1,2].map((round)=>({...g.requests[0],requestId:`20000000-0000-4000-8000-00000000000${round}`,action:'altering',craftCount:null,outputPerCraft:null,expectedOutput:null,processingRound:round,terminalOutcome:round===1?'stopped':'registered'}));
  assert.equal(parse(v).goals[0].registeredCount,1);
  g.requests[1].processingRound=1; assert.throws(()=>parse(v));
});
test('native and TypeScript share the exact confirmed-three-of-four projection contract', {skip:process.platform!=='win32'},()=>{
  const output=execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','iris/desktop-life-progress.tests.ps1','-Mode','vector'],{encoding:'utf8',windowsHide:true,timeout:20000});
  const actual=parse(JSON.parse(output.replace(/^\uFEFF/,'')));
  assert.equal(actual.goals[0].confirmedQuantity,3);
  assert.equal(actual.goals[0].remainingQuantity,1);
  assert.equal(actual.goals[0].quantityUnconfirmed,false);
  assert.equal(actual.goals[0].requests[0].confirmations[0].source,'user-confirmed');
});

// Exported fixture is reused by native/TS vector verification without user data.
export {view,scope};
