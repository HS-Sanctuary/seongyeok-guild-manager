import {parseErgonSnapshot,ergonSnapshotStale,type ErgonSnapshot} from './irisErgonRead';
import {assessErgonReadOnlyEvidence,type ReadOnlyEvidenceContext,type ErgonReadOnlyAssessment} from './irisErgonReadOnlyEvidence';
import type {ProgressScope} from './irisErgonProgress';

export type ErgonNativeObservation={scope:ProgressScope;targetName:string;documentEpoch:number;contextVersion:number;observedAt:number;gameIdentityVerified:false;inventory:ErgonSnapshot<'inventory'>|null;materials:ErgonSnapshot<'materials'>|null;altering:ErgonSnapshot<'altering'>|null;assessment:ErgonReadOnlyAssessment;collectionStatus:'not-retained'|'reported-unverified';issues:string[];executionAllowed:false};
const keys=['schemaVersion','scope','targetName','documentEpoch','contextVersion','observedAt','gameIdentityVerified','inventory','materials','altering','evidence','collectionStatus','issues','executionAllowed'];
function need(v:unknown):asserts v{if(!v)throw Error('에르곤 native 관측의 문맥과 최신 상태를 다시 확인해 주세요.');}
function exact(v:unknown,k:string[]):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===k.length&&k.every(key=>Object.hasOwn(v,key));}
const integer=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
function freeze<T>(v:T):T{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
/** Pure parsing never authenticates a source label. Native object ownership is
 * admitted only by createDesktopStore's fixed-route response closure. */
export function parseErgonNativeObservation(value:unknown,expected:ReadOnlyEvidenceContext):ErgonNativeObservation{
 const r=structuredClone(value);need(exact(r,keys)&&r.schemaVersion===1&&r.executionAllowed===false&&r.gameIdentityVerified===false&&r.targetName===expected.targetName&&exact(r.scope,['environment','accountId','characterId']));
 const owner=r.scope;need(['development','production'].includes(String(owner.environment))&&(['environment','accountId','characterId'] as const).every(k=>owner[k]===expected.scope[k]));
 need(integer(r.documentEpoch)&&integer(r.contextVersion)&&integer(r.observedAt)&&!ergonSnapshotStale({observedAt:r.observedAt},expected.now));
 need(Array.isArray(r.issues)&&r.issues.length<=32&&r.issues.every(x=>typeof x==='string'&&/^[a-z-]{1,80}$/.test(x))&&new Set(r.issues).size===r.issues.length&&r.issues.includes('game-character-unverified')&&r.issues.includes('non-atomic-observations'));
 const observedAt=r.observedAt;
 const snapshot=<K extends 'inventory'|'materials'|'altering'>(kind:K)=>{if(r[kind]===null)return null;const v=parseErgonSnapshot(kind,r[kind]);need(!ergonSnapshotStale(v,expected.now)&&v.observedAt<=observedAt);return v;};
 const assessment=assessErgonReadOnlyEvidence(r.evidence,expected);need(assessment.valid&&assessment.dto);
 if(assessment.dto.works)need(!ergonSnapshotStale(assessment.dto.works,expected.now)&&assessment.dto.works.observedAt<=r.observedAt);
 need((r.collectionStatus==='not-retained'&&assessment.dto.collection===null)||(r.collectionStatus==='reported-unverified'&&assessment.dto.collection!==null));
 const blockers=[...assessment.blockers,'game-character-unverified','non-atomic-observations',...r.issues];
 const reviewed={...assessment,blockers:[...new Set(blockers)]};
 return freeze({scope:{...expected.scope},targetName:expected.targetName,documentEpoch:r.documentEpoch,contextVersion:r.contextVersion,observedAt:r.observedAt,gameIdentityVerified:false,inventory:snapshot('inventory'),materials:snapshot('materials'),altering:snapshot('altering'),assessment:reviewed,collectionStatus:r.collectionStatus,issues:[...r.issues],executionAllowed:false});
}
