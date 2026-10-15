import {ergonSnapshotStale,type ErgonSnapshot} from './irisErgonRead';
import type {createDesktopStore} from './irisDesktopStore';
import type {ErgonCollectionIdentity} from './irisErgonAutomation';
export function ergonCollectionPreview(snapshot:ErgonSnapshot<'works'>|null|undefined,facility:string,now:number){
 const rows=snapshot?.data.items??[],selected=rows.filter(row=>row.facility===facility),counts=new Map<string,number>();
 for(const row of selected)if(row.completed===true)counts.set(row.name,(counts.get(row.name)??0)+1);
 const completed=[...counts].map(([displayName,count])=>({displayName,count}));
 const displayName=completed.find(item=>rows.filter(row=>row.completed===true&&row.name===item.displayName).every(row=>row.facility===facility))?.displayName??null;
 const reason=!snapshot||ergonSnapshotStale(snapshot,now)?'현황을 새로고침해 주세요.':selected.some(row=>row.completed===null)?'완료 여부를 확인하지 못한 작업이 있어요.':!completed.length?'수령 가능한 완료품이 없어요.':!displayName?'같은 품목이 여러 시설에 있어 수령 대상을 구분할 수 없어요.':'';
 return {facility,displayName,completed,ready:!reason,reason};
}

type CollectionApi=Pick<ReturnType<typeof createDesktopStore>,'setLifeContext'|'lifeActionCapabilities'|'collectLifeAction'|'cancelLifeAction'>;
type CollectionIdentity={accountId:string;characterId:string;accountLabel:string;characterLabel:string};
// The official collection command includes travel and reward handling. Only native
// consent can commit it; no direct CLI, retry, other facility, or re-registration.
export async function requestErgonCollection(api:CollectionApi,identity:CollectionIdentity,preview:ReturnType<typeof ergonCollectionPreview>,isCurrent:()=>boolean,onSubmitted?:(request:ErgonCollectionIdentity)=>void){
 if(!preview.ready||!preview.displayName)throw Error(preview.reason||'수령 대상을 다시 확인해 주세요.');
 if(!isCurrent())return null;
 const click={requestId:crypto.randomUUID(),requestedAt:Date.now(),accountId:identity.accountId,characterId:identity.characterId,facility:preview.facility,displayName:preview.displayName};
 const caps=await api.lifeActionCapabilities();if(!isCurrent())return null;
 if(!caps.oneClickCollection||!caps.automaticReconciliation||caps.collectionPolicyVersion!==1)throw Error('원클릭 수령은 최신 IRIS로 다시 실행해 주세요.');
 await api.setLifeContext(identity);if(!isCurrent())return null;
 let cancelled=false;const watcher=setInterval(()=>{if(!isCurrent()&&!cancelled){cancelled=true;void api.cancelLifeAction(click.requestId).catch(()=>{});}},100);
 try{onSubmitted?.({requestId:click.requestId,accountId:click.accountId,characterId:click.characterId});return await api.collectLifeAction(click);}finally{clearInterval(watcher);}
}
