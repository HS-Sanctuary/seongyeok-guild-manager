import {parseSynaxisData,type SynaxisCreate} from './irisSynaxis';
export type SynaxisResult={kind:'created';partyId:string}|{kind:'unknown'|'rejected';message:string};
export function createIrisSynaxisTransport(fetcher:typeof fetch=fetch){
  return {
    async load(accountId:string){
      const response=await fetcher('/api/iris/synaxis?accountId='+encodeURIComponent(accountId),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error(response.status===401?'로그인이 만료됐어요. 다시 로그인해주세요.':'파티 기준을 불러오지 못했어요. 다시 확인해주세요.');
      return parseSynaxisData(await response.json(),accountId);
    },
    async create(input:SynaxisCreate):Promise<SynaxisResult>{
      try{
        const response=await fetcher('/api/iris/synaxis',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(20000)});
        const body=await response.json();
        if(response.ok&&body?.kind==='created'&&typeof body.partyId==='string'&&/^\d+$/.test(body.partyId))return {kind:'created',partyId:body.partyId};
        if([400,401,403,409,413,503].includes(response.status)&&body?.kind!=='unknown')return {kind:'rejected',message:typeof body?.message==='string'?body.message:'생성 내용을 다시 확인해주세요.'};
      }catch{/* Never retry a POST whose result is uncertain. */}
      return {kind:'unknown',message:'생성 결과를 확인하지 못했어요. 생텀 파티 목록을 먼저 확인해주세요. 자동 재전송하지 않아요.'};
    },
  };
}
// Only a receipt/uncertainty marker, not a draft, credential, or automatic retry queue.
export type SynaxisReceipt={kind:'unknown';at:number}|{kind:'created';at:number;partyId:string};
const receiptKey=(accountId:string)=>'iris_synaxis_receipt:v1:'+accountId;
export function readSynaxisReceipt(storage:Pick<Storage,'getItem'>,accountId:string):SynaxisReceipt|null{
  try{const r:unknown=JSON.parse(storage.getItem(receiptKey(accountId))??'null');if(r===null)return null;if(r&&typeof r==='object'&&'kind'in r&&'at'in r&&Number.isSafeInteger(r.at)){if(r.kind==='unknown')return {kind:'unknown',at:r.at as number};if(r.kind==='created'&&'partyId'in r&&typeof r.partyId==='string'&&/^\d+$/.test(r.partyId))return {kind:'created',at:r.at as number,partyId:r.partyId};}}catch{/* A corrupt marker must not silently permit a retry. */}return {kind:'unknown',at:0};
}
export function writeSynaxisReceipt(storage:Pick<Storage,'setItem'|'removeItem'>,accountId:string,receipt:SynaxisReceipt|null){if(receipt)storage.setItem(receiptKey(accountId),JSON.stringify(receipt));else storage.removeItem(receiptKey(accountId));}
