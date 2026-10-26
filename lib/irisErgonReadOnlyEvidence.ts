import {parseErgonSnapshot,ergonSnapshotStale,type ErgonSnapshot} from './irisErgonRead';
import {parseErgonActionState,type ErgonActionState} from './irisErgonActions';
import type {ProgressScope} from './irisErgonProgress';

/** Pure inspection only. No bridge, CLI, native writer, browser storage or IO.
 * This local packet/profile is NOT a new official CLI response schema.
 */
export type ReadOnlyEvidenceContext={scope:ProgressScope;targetName:string;now:number};
export type FlatCollectionProfile={collected:number;rewards:{Name:string;Amount:number}[];criticalRewards:{Name:string;Amount:number}[]};
export type ErgonReadOnlyDTO={
 profile:'ergon-readonly-evidence-v1';scope:ProgressScope;targetName:string;
 works:ErgonSnapshot<'works'>|null;actionState:ErgonActionState|null;collection:FlatCollectionProfile|null;
 cost:{policyExpectedWings:5|null;beforeWings:number|null;afterWings:number|null;observedWingDifference:number|null};
};
export type EvidenceDecision='automatic'|'user-confirmation'|'unsupported';
export type EvidenceFact={decision:EvidenceDecision;value:number|null;reason:string};
export type EvidenceFactKey='processingRows'|'reportedRewardRows'|'historicalWingDifference'|'workIdentity'|'facilitySlots'|'processingDuration'|'actualCollectedQuantity'|'confirmedCost'|'externalMutationExclusion'|'nativeRoundPersistence'|'approvalBudget'|'collectionScopeConsent'|'userAdditionalQuantity';
export type ErgonReadOnlyAssessment={valid:boolean;dto:ErgonReadOnlyDTO|null;facts:Record<EvidenceFactKey,EvidenceFact>;blockers:string[];automaticReady:false;executionAllowed:false;confirmedProgress:null};

function need(ok:unknown):asserts ok{if(!ok)throw Error('가공 읽기 전용 증거 형식/소유 범위를 확인해 주세요.');}
function exact(v:unknown,keys:string[]):Record<string,unknown>{need(v&&typeof v==='object'&&!Array.isArray(v));const r=v as Record<string,unknown>;need(Object.keys(r).length===keys.length&&keys.every(k=>Object.hasOwn(r,k)));return r;}
const name=(v:unknown,max=160):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max&&!/[\u0000-\u001f\u007f]/.test(v);
const integer=(v:unknown,min=0,max=Number.MAX_SAFE_INTEGER):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
function scope(v:unknown):ProgressScope{const r=exact(v,['environment','accountId','characterId']);need((r.environment==='development'||r.environment==='production')&&name(r.accountId,100)&&name(r.characterId,100));return {environment:r.environment,accountId:r.accountId,characterId:r.characterId};}
function contextOf(v:unknown):ReadOnlyEvidenceContext{const r=exact(v,['scope','targetName','now']);need(name(r.targetName)&&integer(r.now,1,8640000000000000));return {scope:scope(r.scope),targetName:r.targetName,now:r.now};}
const sameScope=(a:ProgressScope,b:ProgressScope)=>a.environment===b.environment&&a.accountId===b.accountId&&a.characterId===b.characterId;
function freeze<T>(v:T):T{if(v&&typeof v==='object'){for(const value of Object.values(v))freeze(value);Object.freeze(v);}return v;}
function collection(v:unknown):FlatCollectionProfile{
 const r=exact(v,['collected','rewards','criticalRewards']);need(integer(r.collected,1,2048));
 const rows=(v:unknown,nonempty:boolean)=>{need(Array.isArray(v)&&v.length<=2048&&(!nonempty||v.length>0));return v.map(value=>{const row=exact(value,['Name','Amount']);need(name(row.Name)&&integer(row.Amount,1));return {Name:row.Name,Amount:row.Amount};});};
 // Collected is a reported collection count, NOT output quantity. Keep base and
 // critical rows separate: their additive semantics have not been established.
 return {collected:r.collected,rewards:rows(r.rewards,true),criticalRewards:rows(r.criticalRewards,false)};
}
export function parseErgonReadOnlyDTO(value:unknown,expected:ReadOnlyEvidenceContext):ErgonReadOnlyDTO{
 const c=contextOf(expected),r=exact(structuredClone(value),['scope','works','actionState','collection']),owner=scope(r.scope);need(sameScope(owner,c.scope));
 const works=r.works===null?null:parseErgonSnapshot('works',r.works),state=r.actionState===null?null:parseErgonActionState(r.actionState),receipt=r.collection===null?null:collection(r.collection);
 const current=state?.current;if(current){need(current.accountId===owner.accountId&&current.characterId===owner.characterId&&current.id!=='00000000-0000-0000-0000-000000000000');}
 const before=current?.beforeWings??null,after=current?.afterWings??null;
 return freeze({profile:'ergon-readonly-evidence-v1',scope:owner,targetName:c.targetName,works,actionState:state,collection:receipt,cost:{policyExpectedWings:current?.expectedWings??null,beforeWings:before,afterWings:after,observedWingDifference:before===null||after===null?null:before-after}});
}
const unsupported=(reason:string):EvidenceFact=>({decision:'unsupported',value:null,reason});
const user=(reason:string):EvidenceFact=>({decision:'user-confirmation',value:null,reason});
const automatic=(value:number,reason:string):EvidenceFact=>({decision:'automatic',value,reason});
function unavailableFacts():Record<EvidenceFactKey,EvidenceFact>{return {
 processingRows:unsupported('작업 관측 없음/미지원'),reportedRewardRows:unsupported('지원하는 수령 보고 프로파일 없음'),historicalWingDifference:unsupported('해당 가공/수령의 역사 잔액 관측 없음'),
 workIdentity:unsupported('안정 작업 ID·요청 결합 근거 없음'),facilitySlots:unsupported('실제 정원/빈자리 근거 없음'),processingDuration:unsupported('실제 등록 시각/가공 기간 근거 없음'),
 actualCollectedQuantity:unsupported('보고된 보상과 요청/work/delivery 귀속·중복/합산 근거가 연결되지 않음'),confirmedCost:unsupported('정책 예상치/역사 잔액 차는 검증된 quote/실제 비용이 아님'),
 externalMutationExclusion:unsupported('외부 앱/수동 개입 배제·일관성 근거 없음'),nativeRoundPersistence:unsupported('native 가공 round/pending/delivery 저장 미연결'),
 approvalBudget:user('목표·재료·날개 예산의 사용자 승인이 필요함. 비용 검증을 대체하지 않음'),collectionScopeConsent:user('시설 완료품 전체 영향 범위 동의 필요. 단일 work 귀속을 대체하지 않음'),userAdditionalQuantity:user('수동 추가 확보량은 user-confirmed 출처로만 취급. 공식 증거/unknown 해제를 대체하지 않음'),
};}
/** automatic means observation/format evaluation, NEVER execution permission. */
export function assessErgonReadOnlyEvidence(value:unknown,expected:ReadOnlyEvidenceContext):ErgonReadOnlyAssessment{
 const facts=unavailableFacts(),blockers=['work-identity-unverified','facility-slots-unverified','duration-unverified','collection-quantity-unattributed','cost-unverified','external-exclusion-unverified','native-round-persistence-unconnected'];
 let dto:ErgonReadOnlyDTO;
 try{dto=parseErgonReadOnlyDTO(value,expected);}catch{return freeze({valid:false,dto:null,facts,blockers:['invalid-evidence',...blockers],automaticReady:false,executionAllowed:false,confirmedProgress:null});}
 if(dto.works&&!ergonSnapshotStale(dto.works,expected.now))facts.processingRows=automatic(dto.works.data.items.length,'현재 프로파일의 목록/상태/남은 시간 관측만 가능. 완료량·정원·실행 허가가 아님');
 else blockers.push(dto.works?'works-stale-or-future':'works-missing');
 if(dto.collection)facts.reportedRewardRows=automatic(dto.collection.rewards.length+dto.collection.criticalRewards.length,'지원 프로파일의 보고 행 수만 확인. collected/Amount를 실제 확보량으로 승격하거나 base+critical을 합산하지 않음');
 const current=dto.actionState?.current;
 if(current&&['altering','collect'].includes(current.action)&&current.displayName===dto.targetName&&dto.cost.observedWingDifference!==null)facts.historicalWingDifference=automatic(dto.cost.observedWingDifference,'관측 시각/독점 귀속이 보장되지 않은 역사 잔액 차. 0이어도 0비용 근거 아님');
 if(!dto.actionState)blockers.push('native-state-missing');
 else {if(dto.actionState.blocked||dto.actionState.state==='unknown')blockers.push('native-unresolved');if(dto.actionState.busy||dto.actionState.state==='running')blockers.push('native-busy');}
 return freeze({valid:true,dto,facts,blockers,automaticReady:false,executionAllowed:false,confirmedProgress:null});
}
