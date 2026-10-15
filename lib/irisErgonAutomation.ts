export type ErgonCollectionPolicy={schemaVersion:1;policyVersion:1;granted:boolean;separatedRequestIds:string[]};
export type ErgonCollectionRequest={requestId:string;requestedAt:number;accountId:string;characterId:string;facility:string;displayName:string};
const uuid=/^(?!00000000-0000-0000-0000-000000000000$)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function exact(value:unknown,keys:string[]):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
export function automationText(value:unknown,max=100):value is string{return typeof value==='string'&&!!value.trim()&&value.length<=max&&!/[\x00-\x1f\x7f]/.test(value);}
export function parseErgonCollectionPolicy(value:unknown):ErgonCollectionPolicy{
 if(!exact(value,['schemaVersion','policyVersion','granted','separatedRequestIds'])||value.schemaVersion!==1||value.policyVersion!==1||typeof value.granted!=='boolean'||!Array.isArray(value.separatedRequestIds)||value.separatedRequestIds.length>300||value.separatedRequestIds.some(id=>typeof id!=='string'||!uuid.test(id))||new Set(value.separatedRequestIds.map(id=>(id as string).toLowerCase())).size!==value.separatedRequestIds.length)throw Error('수령 허용 상태를 확인하지 못했어요.');
 return {...value,separatedRequestIds:[...value.separatedRequestIds]} as ErgonCollectionPolicy;
}
export function validateErgonCollectionRequest(value:unknown):asserts value is ErgonCollectionRequest{
 if(!exact(value,['requestId','requestedAt','accountId','characterId','facility','displayName'])||typeof value.requestId!=='string'||!uuid.test(value.requestId)||typeof value.requestedAt!=='number'||!Number.isSafeInteger(value.requestedAt)||value.requestedAt<=0||value.requestedAt>8640000000000000||!automationText(value.accountId)||!automationText(value.characterId)||!automationText(value.facility,160)||!automationText(value.displayName,160))throw Error('수령할 시설과 캐릭터를 확인해 주세요.');
}
export function parseErgonActionCapabilities(value:unknown){
 const schema=(value as {schemaVersion?:unknown})?.schemaVersion,extended=schema===2||schema===3||schema===4,batch=schema===3||schema===4,automation=schema===4,keys=['schemaVersion','actions','gatheringNames','queue','collectCostKnown'];
 if(extended)keys.push('quantityGathering','currentStop');if(batch)keys.push('quantityCrafting','maxCraftCount');if(automation)keys.push('oneClickCollection','automaticReconciliation','collectionPolicyVersion');
 if(!exact(value,keys)||typeof schema!=='number'||![1,2,3,4].includes(schema)||!Array.isArray(value.actions)||value.actions.join(',')!=='gathering,altering,crafting,collect'||!Array.isArray(value.gatheringNames)||value.gatheringNames.join(',')!=='통나무'||value.queue!==false||value.collectCostKnown!==false||extended&&(typeof value.quantityGathering!=='boolean'||typeof value.currentStop!=='boolean')||batch&&(typeof value.quantityCrafting!=='boolean'||value.maxCraftCount!==5)||automation&&(value.oneClickCollection!==true||value.automaticReconciliation!==true||value.collectionPolicyVersion!==1))throw Error('에르곤 실행 기능을 확인하지 못했어요. 최신 앱으로 다시 실행해 주세요.');
 return {quantityGathering:extended&&value.quantityGathering===true,currentStop:extended&&value.currentStop===true,quantityCrafting:batch&&value.quantityCrafting===true,maxCraftCount:batch?5:0,oneClickCollection:automation,automaticReconciliation:automation,collectionPolicyVersion:automation?1:0};
}
