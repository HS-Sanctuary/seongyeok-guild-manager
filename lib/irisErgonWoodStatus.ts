import {parseErgonWoodNativeView} from './irisErgonWoodPersistence';
import {parseErgonNativeObservation} from './irisErgonNativeObservation';
import type {ErgonPlanItem} from './irisErgonPlan';
import type {ProgressScope,GoalView} from './irisErgonProgress';

export type WoodStatusIdentity={scope:ProgressScope;goalId:string;plan:ErgonPlanItem;lifecycle?:GoalView['lifecycle'];quantityUnconfirmed?:boolean};
type ManualGuide={mode:'reference-only'|'review-required'|'record-needed';message:string;checks:string[];recordingNotice:string;quantityRecording:'unsupported';executionAllowed:false};
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
 let manualReviewRequired=unknown;
 let rows:{name:string;facility:string;status:string;remainingSeconds:number|null}[]=[];
 if(v.observation!==null){
  try{
   const at=(v.observation as {observedAt?:unknown}).observedAt;
   if(typeof at!=='number'||!Number.isSafeInteger(at)||at<1||at>now)throw Error('observation time');
   // Validate against the packet's ORIGINAL observation time. This does not make
   // archived evidence fresh or authenticate a browser source label.
   const observation=parseErgonNativeObservation(v.observation,{scope,targetName:plan.displayName,now:at});
   const action=observation.assessment.dto?.actionState;
   // Archived unresolved/busy evidence cannot become permission to continue by
   // waiting. This only changes guidance; it never edits the native safety state.
   if(action?.blocked||action?.busy||action?.state==='unknown'||action?.state==='running'||observation.issues.some(issue=>['native-unresolved','native-busy','actor-state-foreign'].includes(issue)))manualReviewRequired=true;
   observedAt=observation.observedAt;
   rows=(observation.assessment.dto?.works?.data.items??[]).filter(w=>w.name===plan.displayName).map(w=>({name:w.name,facility:w.facility,status:w.completed===true?'가공 완료 관측 · 수령 확인 필요':w.completed===false?'가공 대기':'상태 확인 필요',remainingSeconds:w.remainingSeconds}));
   blockers.push('선택 캐릭터와 게임 캐릭터가 같은지, 조회된 작업이 이 목표의 작업인지 확인이 필요해요.');
  }catch{manualReviewRequired=true;blockers.push('저장된 관측 내용과 조회 시각을 확인해야 해요.');}
 }
 const manualGuide:ManualGuide={mode:'reference-only',message:'아래는 게임에서 직접 확인할 때의 참고 안내예요. 현재 게임 상태 확인이나 실행 허가가 아니에요.',checks:[],recordingNotice:'가공 수령량의 사용자 확인 저장은 아직 연결되지 않았어요. 제작 결과 입력에 대신 넣지 마세요.',quantityRecording:'unsupported',executionAllowed:false};
 if(manualReviewRequired){manualGuide.mode='review-required';manualGuide.message='작업의 진행 상태를 먼저 확인해야 해요. 게임과 기존 기록을 대조하기 전에는 새 등록·수령을 진행하지 마세요.';}
 else if(identity.lifecycle==='paused'){manualGuide.mode='review-required';manualGuide.message='보류된 목표예요. 기존 기록을 확인하고 목표 상태부터 정리해 주세요.';}
 else if(!v.manager){manualGuide.mode='record-needed';manualGuide.message='현재 목표의 가공 기록부터 확인해 주세요. 기록이 없다는 이유로 새 작업을 시작하지 않아요.';}
 else manualGuide.checks=[
  '게임 캐릭터·가공 시설·실제 재료와 비용을 직접 확인하세요. 정령의 날개와 보관함 전송 비용도 포함해요.',
  '필요한 회차를 게임에서 직접 등록하고 완료를 확인한 뒤, 해당 시설 완료품 전체의 수령 범위를 확인하세요. 다른 작업과 섞였으면 이 목표의 수량으로 계산하지 마세요.',
  '직접 수령한 목재의 추가 확보량만 확인하세요. 대성공을 예상량에 더하지 않고 실제 받은 수량으로 확인해요.',
 ];
 return {recorded:v.manager?v.confirmed:null,acquired:null,remaining:v.manager?v.remaining:null,status,updatedAt:null,observedAt,lastRestoredAt:v.recoveryHistory.at(-1)?.observedAt??null,rows,blockers,manualGuide};
}
