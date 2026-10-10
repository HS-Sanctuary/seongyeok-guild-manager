import type {ContentItem} from '@/components/party/types';
import {normalizeDifficulty} from '@/lib/partyContentCatalog';
import {readSynaxisReceipt,writeSynaxisReceipt} from '@/lib/irisSynaxisTransport';
import {isGuildBusParty} from '@/lib/guildBusPolicy';

const difficultyOrder=['입문','쉬움','보통','어려움','매우어려움','지옥1','지옥2'];
const difficultyRank=(value:string)=>{const normalized=normalizeDifficulty(value),hell=normalized.match(/^지옥(\d+)$/);return hell?4+Number(hell[1]):difficultyOrder.indexOf(normalized);};
export type PartyActivityCounts={party:number;bus:number};
export function createPartyActivity(){
  const seen=new Set<string>(),unread=new Map<string,'party'|'bus'>();
  return {
    observe(event:{eventType:string;new?:Record<string,unknown>;old?:Record<string,unknown>}){
      const id=String(event.eventType==='DELETE'?event.old?.id??'':event.new?.id??'');
      if(!id)return;
      if(event.eventType==='DELETE'){seen.add(id);unread.delete(id);}
      if(event.eventType==='INSERT'&&!seen.has(id)){seen.add(id);unread.set(id,isGuildBusParty(event.new||{})?'bus':'party');}
    },
    acknowledge(kind:'party'|'bus',visibleIds?:string[]){for(const [id,type] of unread)if(type===kind&&(!visibleIds||visibleIds.includes(id)))unread.delete(id);},
    counts():PartyActivityCounts{return {party:[...unread.values()].filter(t=>t==='party').length,bus:[...unread.values()].filter(t=>t==='bus').length};},
  };
}
export function partyDefaultDifficulty(item:ContentItem):string {
  if(item.category==='어비스') {
    const veryHard=item.diffs.find(diff=>normalizeDifficulty(diff)==='매우어려움');
    if(veryHard)return veryHard;
  }
  return [...item.diffs].sort((a,b)=>difficultyRank(b)-difficultyRank(a))[0]||'';
}

/** One IRIS account owns this writer; a lost/partial response is never auto-replayed. */
export function scopedPartyRequest(accountId:string,current:()=>boolean,storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,fetcher:typeof fetch,onBusy:(busy:boolean)=>void=()=>{},timeoutMs=20_000) : typeof fetch {
  let pending=false;
  return async(input,init)=>{
    if(!current()||pending)throw new Error('현재 계정과 화면 상태를 다시 확인해주세요.');
    const path=String(input);
    if(init?.method?.toUpperCase()!=='POST'||!['/api/member-mutations','/api/parties/sync-checklist'].includes(path))throw new Error('지원하지 않는 파티 요청입니다.');
    if(readSynaxisReceipt(storage,accountId))throw new Error('이전 요청 결과를 목록에서 확인한 뒤 다시 진행해주세요.');
    const body=JSON.parse(String(init.body));
    pending=true;
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
    try {
      // A failed durable marker must prevent sending, rather than risk replay after restart.
      storage.setItem(`iris_synaxis_receipt:v1:${accountId}`,JSON.stringify({kind:'unknown',at:Date.now()}));
      onBusy(true);
      const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('응답 시간이 지났어요. 최신 목록에서 결과를 확인해주세요.'));},timeoutMs);});
      const response=await Promise.race([fetcher(input,{...init,signal:controller.signal,credentials:'same-origin',body:JSON.stringify({...body,expectedAccountId:accountId})}),deadline]);
      // 409/5xx can follow partial checklist saves. Preserve uncertainty in that case.
      if(response.ok||[400,401,403,404,422].includes(response.status)) {
        await response.clone().json();
        writeSynaxisReceipt(storage,accountId,null);
      }
      if(!current())throw new Error('계정 또는 화면이 바뀌었어요. 최신 목록을 확인해주세요.');
      return response;
    } finally {clearTimeout(timer);pending=false;onBusy(false);}
  };
}
