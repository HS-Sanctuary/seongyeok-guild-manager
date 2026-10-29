import test from 'node:test';import assert from 'node:assert/strict';import {loadTS} from './load-ts.mjs';
const {projectErgonWoodStatus}=loadTS('lib/irisErgonWoodStatus.ts');
const scope={environment:'development',accountId:'a',characterId:'c'},plan={id:'p',kind:'altering',displayName:'목재',targetQuantity:100},goalId='10000000-0000-4000-8000-000000000001';
function view(){return {schemaVersion:1,scope,goalId,mode:'observation',health:'review-required',manager:{schemaVersion:1,revision:1,config:{scope,goalId,plan,approval:{id:'approval',maxWings:0,maxLogs:0,maxGather:0,expiresAt:1000}},phase:'blocked',reason:'unsupported',version:null,facts:null,baselineWood:null,events:[]},confirmed:0,remaining:100,source:'none',safetyState:'blocked',reserved:{wings:0,logs:0,gather:0},remainingBudget:{wings:0,logs:0,gather:0},recoveryHistory:[],observation:null,executionAllowed:false};}
test('D0 known record zero never claims verified acquisition zero or a completion timestamp',()=>{const r=projectErgonWoodStatus(view(),{scope,goalId,plan},1000);assert.equal(r.recorded,0);assert.equal(r.acquired,null);assert.equal(r.remaining,100);assert.equal(r.updatedAt,null);assert.equal(r.observedAt,null);assert.equal(r.status,'진행 차단');});
test('D0 absent record and unknown remain distinct from confirmed zero and failure',()=>{const v=view();v.manager=null;const r=projectErgonWoodStatus(v,{scope,goalId,plan},1000);assert.equal(r.recorded,null);assert.equal(r.remaining,null);v.manager=view().manager;v.safetyState='unknown';assert.equal(projectErgonWoodStatus(v,{scope,goalId,plan},1000).status,'결과 확인 필요');});
test('D0 refuses foreign plan, scope and synthetic positive receipt at the UI production boundary',()=>{for(const alter of [v=>v.scope.characterId='other',v=>v.manager.config.plan.id='other',v=>{v.mode='simulation';v.confirmed=3;v.remaining=97;v.source='synthetic-receipt';}]){const v=structuredClone(view());alter(v);assert.throws(()=>projectErgonWoodStatus(v,{scope,goalId,plan},1000));}});
test('D0 historical B remaining time is reported verbatim and never produces output or a current countdown',()=>{
 const v=view();v.observation={schemaVersion:1,scope,targetName:'목재',documentEpoch:1,contextVersion:1,observedAt:1000,gameIdentityVerified:false,inventory:null,materials:null,altering:null,evidence:{scope,works:{schemaVersion:1,kind:'works',source:'official-cli',observedAt:1000,data:{completedCount:0,items:[{name:'목재',facility:'목재 가공',state:'Processing',completed:false,remainingSeconds:90}]}},actionState:null,collection:null},collectionStatus:'not-retained',issues:['game-character-unverified','non-atomic-observations'],executionAllowed:false};
 const r=projectErgonWoodStatus(v,{scope,goalId,plan},100000);assert.equal(r.observedAt,1000);assert.equal(r.rows[0]?.remainingSeconds,90);assert.equal(r.rows[0]?.status,'가공 대기');assert.equal(r.recorded,0);assert.equal(r.acquired,null);assert.equal(r.remaining,100);
});
test('D0 display-only selection does not relax the existing execution selector',()=>{const {selectErgonNativeGoal}=loadTS('lib/irisErgonGoalBinding.ts');const g={goalId,sourcePlanId:'p',parentGoalId:null,detached:false,lifecycle:'active',action:'altering',displayName:'목재',targetQuantity:100};const v={scope,health:'review-required',goals:[g]};assert.equal(selectErgonNativeGoal(v,scope,plan),null);assert.equal(selectErgonNativeGoal(v,scope,plan,{forDisplayOnly:true}),g);assert.equal(selectErgonNativeGoal(v,{...scope,characterId:'other'},plan,{forDisplayOnly:true}),null);assert.equal(selectErgonNativeGoal({...v,goals:[g,g]},scope,plan,{forDisplayOnly:true}),null);});
test('D0 display selection remains closed when the progress store is unavailable',()=>{const {selectErgonNativeGoal}=loadTS('lib/irisErgonGoalBinding.ts');const g={goalId,sourcePlanId:'p',parentGoalId:null,detached:false,lifecycle:'active',action:'altering',displayName:'목재',targetQuantity:100};assert.equal(selectErgonNativeGoal({scope,health:'unavailable',goals:[g]},scope,plan,{forDisplayOnly:true}),null);});

function archived(v,actionState=null){
 v.observation={schemaVersion:1,scope,targetName:'목재',documentEpoch:1,contextVersion:1,observedAt:1000,gameIdentityVerified:false,inventory:null,materials:null,altering:null,evidence:{scope,works:{schemaVersion:1,kind:'works',source:'official-cli',observedAt:1000,data:{completedCount:1,items:[{name:'목재',facility:'목재 가공',state:'Completed',completed:true,remainingSeconds:0}]}},actionState,collection:null},collectionStatus:'not-retained',issues:['game-character-unverified','non-atomic-observations'],executionAllowed:false};
 return v;
}
function nativeState(state){return {schemaVersion:1,busy:state==='running',blocked:state==='unknown',state,current:{id:goalId,accountId:scope.accountId,characterId:scope.characterId,action:'collect',displayName:'목재',state,expectedWings:null,beforeWings:100,afterWings:null,afterOwned:null,message:null}};}

test('D1 guide is reference only and never offers a quantity writer or an execution permission',()=>{
 const v=view(),before=structuredClone(v),r=projectErgonWoodStatus(v,{scope,goalId,plan},1000);
 assert.equal(r.manualGuide.mode,'reference-only');assert.equal(r.manualGuide.executionAllowed,false);assert.equal(r.manualGuide.quantityRecording,'unsupported');
 assert.equal(r.manualGuide.checks.length,3);assert.match(r.manualGuide.checks.join(' '),/캐릭터.*비용.*시설 완료품 전체.*추가 확보량/);
 assert.match(r.manualGuide.recordingNotice,/제작 결과 입력에 대신 넣지/);assert.deepEqual(v,before);assert.equal(r.acquired,null);assert.equal(r.recorded,0);
});

test('D1 unknown and unconfirmed quantity hide manual continuation instructions without changing history',()=>{
 for(const change of [v=>v.safetyState='unknown',()=>{}]){const v=view();change(v);const r=projectErgonWoodStatus(v,{scope,goalId,plan,quantityUnconfirmed:true},1000);assert.equal(r.manualGuide.mode,'review-required');assert.deepEqual(r.manualGuide.checks,[]);assert.match(r.manualGuide.message,/새 등록·수령/);assert.equal(r.acquired,null);}
 const v=view();v.safetyState='unknown';assert.equal(projectErgonWoodStatus(v,{scope,goalId,plan},1000).manualGuide.mode,'review-required');
});

test('D1 archived native unknown or running state is not turned into a manual permission',()=>{
 for(const state of ['unknown','running']){const r=projectErgonWoodStatus(archived(view(),nativeState(state)),{scope,goalId,plan},100000);assert.equal(r.manualGuide.mode,'review-required');assert.deepEqual(r.manualGuide.checks,[]);assert.equal(r.manualGuide.executionAllowed,false);}
});

test('D1 completed zero-second observation does not establish slots, cost, acquired quantity or collection authority',()=>{
 const r=projectErgonWoodStatus(archived(view()),{scope,goalId,plan},100000);
 assert.equal(r.rows[0].remainingSeconds,0);assert.equal(r.acquired,null);assert.equal(r.remaining,100);assert.equal(r.manualGuide.mode,'reference-only');assert.equal(r.manualGuide.executionAllowed,false);assert.equal(r.manualGuide.quantityRecording,'unsupported');
 assert.doesNotMatch(r.manualGuide.checks.join(' '),/정원 ?7|비용 ?0|날개 ?5/);
});

test('D1 absent or malformed records and paused goals do not show manual next steps',()=>{
 const absent=view();absent.manager=null;
 assert.equal(projectErgonWoodStatus(absent,{scope,goalId,plan},1000).manualGuide.mode,'record-needed');
 const bad=archived(view());bad.observation.observedAt=1001;
 const review=projectErgonWoodStatus(bad,{scope,goalId,plan},1000).manualGuide;
 assert.equal(review.mode,'review-required');assert.match(review.message,/진행 상태를 먼저 확인/);assert.doesNotMatch(review.message,/미해결 또는 진행 중인 작업 기록/);
 assert.deepEqual(projectErgonWoodStatus(view(),{scope,goalId,plan,lifecycle:'paused'},1000).manualGuide.checks,[]);
});
