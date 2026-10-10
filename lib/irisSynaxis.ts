export type SynaxisCharacter={id:string;nickname:string;job:string;combatPower:number;magicResistance:number;completed:string[]};
export type SynaxisOption={id:string;name:string;category:'레이드'|'어비스';difficulties:{name:string;capacity:4|8;minCombatPower:number}[]};
export type SynaxisData={accountId:string;canCreateBus:boolean;characters:SynaxisCharacter[];options:SynaxisOption[]};
export type SynaxisCreate={accountId:string;mode:'party'|'bus';contentId:string;difficulty:string;partyDate:string;timeStart:string;timeEnd:string;memo:string;members:{id:string;allowRepeat:boolean}[]};
export const canCreateIrisBus=(role:string)=>['길드마스터','부마스터','부마스터 대행'].includes(role);
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const text=(value:unknown,max=200):value is string=>typeof value==='string'&&!!value.trim()&&value.length<=max&&!/[\u0000-\u001f\u007f]/u.test(value);
export function parseSynaxisData(value:unknown,accountId:string):SynaxisData {
  if(!record(value)||value.accountId!==accountId||typeof value.canCreateBus!=='boolean'||!Array.isArray(value.characters)||value.characters.length>60||!Array.isArray(value.options)||value.options.length>20)throw new Error('파티 기준을 확인하지 못했어요.');
  const ids=new Set<string>();
  const characters=value.characters.map(c=>{
    if(!record(c)||!text(c.id,100)||ids.has(c.id)||!text(c.nickname,120)||!text(c.job,120)||![c.combatPower,c.magicResistance].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0)||!Array.isArray(c.completed)||c.completed.some(v=>!text(v,100)))throw new Error('캐릭터 기준을 확인하지 못했어요.');
    ids.add(c.id);return c as SynaxisCharacter;
  });
  const optionIds=new Set<string>();
  const options=value.options.map(o=>{
    if(!record(o)||!text(o.id,100)||optionIds.has(o.id)||!text(o.name)||!['레이드','어비스'].includes(String(o.category))||!Array.isArray(o.difficulties)||!o.difficulties.length||o.difficulties.length>20)throw new Error('컨텐츠 기준을 확인하지 못했어요.');
    const diffs=new Set<string>();for(const d of o.difficulties){if(!record(d)||!text(d.name,100)||diffs.has(d.name)||![4,8].includes(Number(d.capacity))||typeof d.capacity!=='number'||typeof d.minCombatPower!=='number'||!Number.isFinite(d.minCombatPower)||d.minCombatPower<0)throw new Error('난이도 기준을 확인하지 못했어요.');diffs.add(d.name);}
    optionIds.add(o.id);return o as SynaxisOption;
  });
  return {accountId,canCreateBus:value.canCreateBus,characters,options};
}
