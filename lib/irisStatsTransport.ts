import {statKeys,type StatsCharacter,type StatsEdit,type SavedStats} from './irisStats';
export function parseStatsCharacters(value:unknown,accountId:string):StatsCharacter[]{
  const v=value as {accountId?:unknown;characters?:unknown};if(!v||v.accountId!==accountId||!Array.isArray(v.characters)||v.characters.length>100)throw Error('본인 스탯 목록을 확인하지 못했어요.');
  const ids=new Set<string>();return v.characters.map(row=>{
    if(!row||typeof row.id!=='string'||!row.id||ids.has(row.id)||typeof row.nickname!=='string'||!row.nickname||row.nickname.length>24||typeof row.job!=='string'||!row.stats||typeof row.stats!=='object')throw Error('스탯 응답 형식을 확인해 주세요.');
    ids.add(row.id);const stats={} as SavedStats;for(const key of statKeys){const value=row.stats[key];if(value!==null&&(typeof value!=='string'||value.length>60))throw Error('스탯 응답 형식을 확인해 주세요.');stats[key]=value;}
    return {id:row.id,nickname:row.nickname,job:row.job,stats};
  });
}
export function createStatsTransport(fetcher:typeof fetch){
  async function request(body?:StatsEdit){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),15000);try{
    const response=await fetcher('/api/iris/stats',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',redirect:'error',signal:abort.signal,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
    if(!response.ok)throw Error(response.status===409?'생텀 값이 바뀌었어요. 다시 읽고 확인해 주세요.':response.status===401?'로그인이 만료됐어요. 다시 로그인해 주세요.':'스탯 조회 또는 저장에 실패했어요.');return await response.json() as unknown;
  }finally{clearTimeout(timer);}}
  return {async characters(accountId:string){return parseStatsCharacters(await request(),accountId);},async save(edit:StatsEdit){
    const value=await request(edit) as {result?:{status?:unknown;accountId?:unknown;characterId?:unknown}};
    if(value?.result?.status!=='saved'||value.result.accountId!==edit.accountId||value.result.characterId!==edit.characterId)throw Error('저장 결과를 확인하지 못했어요. 자동으로 재전송하지 않아요.');
  }};
}
