import {IrisWriteError} from './irisKronosWrite';
export const statKeys=['combat_power','life_energy','magic_resistance','charm'] as const;
export type StatKey=typeof statKeys[number];
export type Stats=Record<StatKey,number|null>;
export type SavedStats=Record<StatKey,string|null>;
export type StatsCharacter={id:string;nickname:string;job:string;stats:SavedStats};
export type GameStats={observedAt:string;job:string;level:number|null;stats:Stats};
export function score(value:unknown):number|null {
  if(value&&typeof value==='object'&&!Array.isArray(value))value=(value as {Value?:unknown}).Value;
  if(typeof value==='string'){if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,6})?$/.test(value))return null;value=Number(value.replaceAll(',',''));}
  return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1_000_000_000?value:null;
}
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function identity(v:unknown):v is string{return typeof v==='string'&&v.length>0&&v.length<=100&&!/\s|[\u0000-\u001f]/.test(v);}
export function parseGameStats(v:unknown):GameStats {
  if(!object(v)||!object(v.stats)||Object.keys(v).length!==4||typeof v.observedAt!=='string'||!Number.isFinite(Date.parse(v.observedAt))||typeof v.job!=='string'||!v.job.trim()||v.job.length>60||/[\u0000-\u001f]/.test(v.job)||Object.keys(v.stats).length!==4)throw new IrisWriteError(400);
  const stats={} as Stats;
  for(const key of statKeys){const value=v.stats[key];if(value!==null&&(typeof value!=='number'||score(value)===null))throw new IrisWriteError(400);stats[key]=value as number|null;}
  if(v.level!==null&&(typeof v.level!=='number'||score(v.level)===null))throw new IrisWriteError(400);
  return {observedAt:v.observedAt,job:v.job,level:v.level as number|null,stats};
}
export function freshStats(game:GameStats,now=Date.now()){const age=now-Date.parse(game.observedAt);return age>=-5000&&age<=60000;}
export function statsFingerprint(game:GameStats){return JSON.stringify([game.job,game.level,...statKeys.map(k=>game.stats[k])]);}
export function rankStatsCandidates(characters:StatsCharacter[],game:GameStats){
  return characters.filter(c=>c.job===game.job).map(character=>{
    const distances=statKeys.flatMap(key=>{const saved=score(character.stats[key]),live=game.stats[key];return saved===null||live===null?[]:[Math.abs(saved-live)/Math.max(saved,live,1)];});
    return {character,score:distances.length?1-distances.reduce((a,b)=>a+b,0)/distances.length:0,compared:distances.length};
  }).sort((a,b)=>b.score-a.score);
}
export type StatsEdit={accountId:string;characterId:string;confirmed:true;observedAt:string;stats:Stats;base:SavedStats};
export function recommendStatsCharacter(characters:StatsCharacter[],game:GameStats):StatsCharacter|null {
  const ranked=rankStatsCandidates(characters,game),best=ranked[0];
  if(!best||best.compared<2||best.score<0.6||(ranked[1]&&best.score-ranked[1].score<0.05))return null;
  return best.character;
}
export function validateStatsEdit(v:unknown,now=Date.now()):StatsEdit {
  if(!object(v)||Object.keys(v).length!==6||!identity(v.accountId)||!identity(v.characterId)||v.confirmed!==true||typeof v.observedAt!=='string'||!object(v.stats)||!object(v.base)||Object.keys(v.stats).length!==4||Object.keys(v.base).length!==4)throw new IrisWriteError(400);
  const game=parseGameStats({observedAt:v.observedAt,job:'수동 확인',level:null,stats:v.stats});
  if(!freshStats(game,now))throw new IrisWriteError(400);
  for(const key of statKeys){const base=v.base[key];if(base!==null&&(typeof base!=='string'||base.length>60))throw new IrisWriteError(400);}
  if(statKeys.every(k=>game.stats[k]===null))throw new IrisWriteError(400);
  return v as StatsEdit;
}
