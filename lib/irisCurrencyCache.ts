export type CurrencyCacheScope={environment:string;accountId:string};
export type CurrencyCacheView={schemaVersion:1;environment:string;accountId:string;attribution:'unverified';items:{name:string;amount:number;observedAt:string}[]};
const exact=(value:unknown,keys:string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
export function parseCurrencyCache(value:unknown,scope:CurrencyCacheScope):CurrencyCacheView{
 if(!exact(value,['schemaVersion','environment','accountId','attribution','items'])||value.schemaVersion!==1||!['development','production'].includes(scope.environment)||!scope.accountId||value.environment!==scope.environment||value.accountId!==scope.accountId||value.attribution!=='unverified'||!Array.isArray(value.items)||value.items.length>200)throw Error('마지막 재화 기록을 확인하지 못했어요.');
 const names=new Set<string>();
 const items=value.items.map(row=>{
  if(!exact(row,['name','amount','observedAt'])||typeof row.name!=='string'||!row.name.trim()||row.name.length>120||/[\x00-\x1f\x7f]/.test(row.name)||names.has(row.name)||typeof row.amount!=='number'||!Number.isSafeInteger(row.amount)||row.amount<0||typeof row.observedAt!=='string'||!Number.isFinite(Date.parse(row.observedAt))||new Date(row.observedAt).toISOString()!==row.observedAt)throw Error('마지막 재화 기록을 확인하지 못했어요.');
  names.add(row.name);return {name:row.name,amount:row.amount,observedAt:row.observedAt};
 });
 return {schemaVersion:1,...scope,attribution:'unverified',items};
}
