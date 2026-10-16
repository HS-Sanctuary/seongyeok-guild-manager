import {ergonSnapshotStale} from './irisErgonRead';
import type {ErgonSnapshots} from './irisErgonSession';
import type {ErgonSupplyPreview} from './irisErgonSupply';
import {ergonCollectionPreview} from './irisErgonCollection';

export type ErgonNextStep=
 | {kind:'action';action:'gathering'|'altering'|'crafting';displayName:string;quantity:number;note:string}
 | {kind:'collect';displayName:string;facility:string;note:string}
 | {kind:'wait';displayName:string;facility:string;pending:number;remainingSeconds:number|null;note:string}
 | {kind:'blocked';note:string};

/** Advice for one explicit preparation, never an authorization to perform a game action. */
export function selectErgonNextStep(preview:ErgonSupplyPreview,snapshots:ErgonSnapshots,now:number):ErgonNextStep{
 const blocked=(note:string):ErgonNextStep=>({kind:'blocked',note});
 for(const kind of ['materials','works','gathering','altering','crafting'] as const){
  const frame=snapshots[kind];if(!frame||ergonSnapshotStale(frame,now))return blocked('현재 재료와 시설을 새로고침해 주세요.');
 }
 // Never send the same production again merely because its outputs are not in the bag yet.
 // Pending jobs are not spendable inventory; collect first, then recalculate the whole path.
 for(const step of preview.steps.filter(row=>row.kind==='altering')){
  const works=snapshots.works!.data.items.filter(row=>row.name===step.displayName);
  if(!works.length)continue;
  if(works.some(row=>row.completed===null)||new Set(works.map(row=>row.facility)).size!==1)return blocked('가공 중인 같은 품목의 시설·완료 상태를 확인해 주세요.');
  const facility=works[0].facility;
  if(works.some(row=>row.completed===true)){
   const collection=ergonCollectionPreview(snapshots.works,facility,now);
   return collection.ready?{kind:'collect',facility,displayName:step.displayName,note:'완료품을 수령한 뒤 부족분을 다시 계산해요.'}:blocked(collection.reason);
  }
  const seconds=works.map(row=>row.remainingSeconds);
  return {kind:'wait',facility,displayName:step.displayName,pending:works.length,remainingSeconds:seconds.some(value=>value===null)?null:Math.min(...seconds as number[]),note:'등록된 가공품을 먼저 기다려요. 아직 가방 재고에 더하지 않아요.'};
 }
 const unresolved=preview.steps.find(row=>row.state==='blocked'||row.kind==='manual');
 if(unresolved)return blocked(unresolved.note||'선행 재료의 수급 경로를 확인해 주세요.');
 const step=preview.steps[0];
 if(!step)return blocked(preview.issues[0]??'현재 목표와 재료를 확인해 주세요.');
 if(!Number.isSafeInteger(step.additionalQuantity)||step.additionalQuantity<1||step.additionalQuantity>1000000)return blocked('필요 수량을 확인해 주세요.');
 if(step.kind==='gathering'){
  const matches=snapshots.gathering!.data.items.filter(row=>row.name===step.displayName);
  if(step.displayName!=='통나무'||matches.length!==1||matches[0].toolOk!==true)return blocked('이 재료의 채집 연결·도구 확인이 필요해요.');
  return {kind:'action',action:'gathering',displayName:step.displayName,quantity:Math.min(100,step.additionalQuantity),note:step.additionalQuantity>100?'이번 채집은 최대 100개예요. 확보 후 남은 양을 다시 계산해요.':'부족한 수량만 채집 준비해요.'};
 }
 if(step.kind!=='altering'&&step.kind!=='crafting')return blocked('가공 완료품 수령 여부를 새로고침해 주세요.');
 const catalog=snapshots[step.kind]!,rows=catalog.data.items.filter(row=>row.name===step.displayName);
 if(rows.length!==1||catalog.data.unlocked===false||rows[0].available!==true||!Number.isSafeInteger(rows[0].producedPerUnit)||rows[0].producedPerUnit!<=0)return blocked('게임에서 이 품목의 재료·제작 조건을 확인해 주세요.');
 return {kind:'action',action:step.kind,displayName:step.displayName,quantity:step.kind==='altering'?Math.min(step.additionalQuantity,rows[0].producedPerUnit!):step.additionalQuantity,note:step.kind==='altering'?'가공 1회 등록을 준비해요. 완료·수령 뒤 다음 부족분을 계산해요.':'남은 추가 수량의 제작을 준비해요.'};
}
