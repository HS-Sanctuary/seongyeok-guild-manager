import type {ErgonActionCurrent,ErgonChallenge,ErgonCrafting} from './irisErgonActions';

type Identity={accountId:string;characterId:string;displayName:string;targetQuantity:number;outputPerCraft:number;planId?:string};
export type ErgonCraftGoal={identity:Identity;completedOutput:number;commandBudget:number;wingBudget:number;deadlineAt:number;stopped:boolean;blocked:boolean;pending:{id:string;beforeWings:number;crafting:ErgonCrafting}|null;observedIds:string[]};
const positive=(n:unknown,max=1000000):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>0&&n<=max;
export function createErgonCraftGoal(identity:Identity,now:number):ErgonCraftGoal{
 if(!positive(identity.targetQuantity)||!positive(identity.outputPerCraft)||!positive(now,8640000000000000-300000)||![identity.accountId,identity.characterId,identity.displayName].every(s=>typeof s==='string'&&s.trim()&&s.length<=160&&!/[\x00-\x1f\x7f]/.test(s)))throw Error('제작 목표와 캐릭터를 다시 확인해 주세요.');
 return {identity:{...identity},completedOutput:0,commandBudget:5,wingBudget:25,deadlineAt:now+300000,stopped:false,blocked:false,pending:null,observedIds:[]};
}
export function previewErgonCraftGoal(goal:ErgonCraftGoal,now:number){
 const remaining=Math.max(0,goal.identity.targetQuantity-goal.completedOutput),craftCount=Math.min(5,Math.ceil(remaining/goal.identity.outputPerCraft));
 const reason=goal.blocked?'이전 제작 결과를 확인해야 해요. 자동으로 다시 실행하지 않아요.':goal.pending?'이미 요청한 제작의 결과를 확인 중이에요.':!remaining?'추가 제작 목표를 완료했어요.':goal.stopped?'다음 제작을 중지했어요.':!Number.isFinite(now)||now>=goal.deadlineAt?'다음 준비 시간 한도가 끝났어요.':goal.commandBudget<1||goal.wingBudget<5?'이번 묶음의 횟수·날개 한도를 사용했어요.':goal.observedIds.length>=300?'이번 화면의 관측 한도에 닿았어요. 기록과 실제 수량을 확인해 주세요.':'';
 return {remaining,craftCount,expectedOutput:craftCount*goal.identity.outputPerCraft,ready:!reason,reason};
}
export function attachErgonCraftReceipt(goal:ErgonCraftGoal,id:string,challenge:Pick<ErgonChallenge,'accountId'|'characterId'|'action'|'displayName'|'wings'|'expectedWings'|'crafting'>):ErgonCraftGoal{
 const expected=Math.min(5,Math.ceil(Math.max(0,goal.identity.targetQuantity-goal.completedOutput)/goal.identity.outputPerCraft)),meta=challenge.crafting;
 if(goal.blocked||goal.pending||goal.commandBudget<1||goal.wingBudget<5||goal.observedIds.length>=300||typeof id!=='string'||!id.trim()||id.length>160||goal.observedIds.includes(id)||challenge.accountId!==goal.identity.accountId||challenge.characterId!==goal.identity.characterId||challenge.action!=='crafting'||challenge.displayName!==goal.identity.displayName||challenge.expectedWings!==5||!positive(challenge.wings,Number.MAX_SAFE_INTEGER)||challenge.wings<5||!meta||expected<1||meta.craftCount!==expected||meta.outputPerCraft!==goal.identity.outputPerCraft||meta.expectedOutput!==expected*meta.outputPerCraft)return {...goal,blocked:true};
 return {...goal,commandBudget:goal.commandBudget-1,wingBudget:goal.wingBudget-5,pending:{id,beforeWings:challenge.wings,crafting:{...meta}}};
}
export function observeErgonCraftGoal(goal:ErgonCraftGoal,row:ErgonActionCurrent):ErgonCraftGoal{
 const pending=goal.pending;if(!pending||row.id!==pending.id||row.state==='running')return goal;
 const meta=row.crafting,expected=pending.crafting;
 const confirmed=row.state==='completed'&&row.accountId===goal.identity.accountId&&row.characterId===goal.identity.characterId&&row.action==='crafting'&&row.displayName===goal.identity.displayName&&meta?.craftCount===expected.craftCount&&meta.outputPerCraft===expected.outputPerCraft&&meta.expectedOutput===expected.expectedOutput&&row.beforeWings===pending.beforeWings&&Number.isSafeInteger(row.afterWings)&&row.afterWings!==null&&row.afterWings>=0&&row.beforeWings-row.afterWings===5;
 return {...goal,pending:null,blocked:goal.blocked||!confirmed,completedOutput:goal.completedOutput+(confirmed?expected.expectedOutput:0),observedIds:[...goal.observedIds,pending.id]};
}
export const stopErgonCraftGoal=(goal:ErgonCraftGoal):ErgonCraftGoal=>({...goal,stopped:true});
export function renewErgonCraftBudget(goal:ErgonCraftGoal,now:number):ErgonCraftGoal{
 if(goal.pending||goal.blocked||!positive(now,8640000000000000-300000))return goal;
 return {...goal,commandBudget:5,wingBudget:25,deadlineAt:now+300000,stopped:false};
}
