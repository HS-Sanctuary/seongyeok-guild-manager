export type CurrencySnapshot={observedAt:string;items:{name:string;amount:number|null}[]};
export function parseCurrencies(value:unknown):CurrencySnapshot{
  const raw=value as CurrencySnapshot|null;
  if(!raw||typeof raw.observedAt!=='string'||!Number.isFinite(Date.parse(raw.observedAt))||!Array.isArray(raw.items)||raw.items.length>200)throw Error('재화 응답을 확인하지 못했어요.');
  const names=new Set<string>();
  const items=raw.items.map(item=>{
    if(!item||typeof item.name!=='string'||!item.name.trim()||item.name.length>120||/[\x00-\x1f]/.test(item.name)||names.has(item.name)||!(item.amount===null||(typeof item.amount==='number'&&Number.isSafeInteger(item.amount)&&item.amount>=0)))throw Error('재화 응답을 확인하지 못했어요.');
    names.add(item.name);return {name:item.name,amount:item.amount};
  });
  return {observedAt:raw.observedAt,items};
}
