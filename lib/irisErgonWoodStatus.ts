import {parseErgonWoodNativeView} from './irisErgonWoodPersistence';
import {parseErgonNativeObservation} from './irisErgonNativeObservation';
import type {ErgonPlanItem} from './irisErgonPlan';
import type {ProgressScope,GoalView} from './irisErgonProgress';

export type WoodStatusIdentity={scope:ProgressScope;goalId:string;plan:ErgonPlanItem;lifecycle?:GoalView['lifecycle'];quantityUnconfirmed?:boolean};
/** Display stored evidence only. No command, approval, repository or clock-driven progress. */
export function projectErgonWoodStatus(raw:unknown,identity:WoodStatusIdentity,now:number){
 const {scope,goalId,plan}=identity;
 if(plan.kind!=='altering'||plan.displayName!=='목재'||plan.targetQuantity!==100)throw Error('현재 가공 기록은 목재 추가100 목표만 연결돼요.');
 const v=parseErgonWoodNativeView(raw,{scope,goalId},'observation');
 if(v.manager&&v.manager.config.plan.id!==plan.id)throw Error('현재 계획과 다른 가공 기록이에요.');
 const unknown=v.safetyState==='unknown'||identity.quantityUnconfirmed;
 const status=unknown?'결과 확인 필요':identity.lifecycle==='paused'?'보류':v.manager?'진행 차단':'기록 확인 필요';
 const blockers=[unknown?'이전 요청 결과를 확인해야 해서 자동 진행하지 않아요.':'작업 구분·시설 자리·실제 수령량·비용을 확인해야 자동 진행할 수 있어요.'];
 let observedAt:number|null=null;
 let rows:{name:string;facility:string;status:string;remainingSeconds:number|null}[]=[];
 if(v.observation!==null){
  try{
   const at=(v.observation as {observedAt?:unknown}).observedAt;
   if(typeof at!=='number'||!Number.isSafeInteger(at)||at<1||at>now)throw Error('observation time');
   // Validate against the packet's ORIGINAL observation time. This does not make
   // archived evidence fresh or authenticate a browser source label.
   const observation=parseErgonNativeObservation(v.observation,{scope,targetName:plan.displayName,now:at});
   observedAt=observation.observedAt;
   rows=(observation.assessment.dto?.works?.data.items??[]).filter(w=>w.name===plan.displayName).map(w=>({name:w.name,facility:w.facility,status:w.completed===true?'가공 완료 관측 · 수령 확인 필요':w.completed===false?'가공 대기':'상태 확인 필요',remainingSeconds:w.remainingSeconds}));
   blockers.push('선택 캐릭터와 게임 캐릭터가 같은지, 조회된 작업이 이 목표의 작업인지 확인이 필요해요.');
  }catch{blockers.push('저장된 관측 내용과 조회 시각을 확인해야 해요.');}
 }
 return {recorded:v.manager?v.confirmed:null,acquired:null,remaining:v.manager?v.remaining:null,status,updatedAt:null,observedAt,lastRestoredAt:v.recoveryHistory.at(-1)?.observedAt??null,rows,blockers};
}
