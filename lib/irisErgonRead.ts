export const ergonReadKinds=['activity','inventory','works','materials','gathering','altering','crafting'] as const;
export type ErgonReadKind=typeof ergonReadKinds[number];
export type ErgonMaterial={name:string;category:string;categoryName:string|null;location:'inventory'|'account_storage'|'character_storage';count:number|null;locked:boolean|null};
export type ErgonRecipe={name:string;available:boolean|null;producedPerUnit:number|null;reason:string|null;missing:{name:string;required:number|null;owned:number|null}[]|null};
const activityFlags=['autoPlaying','autoTraveling','dead','reviving','inCombat','dialoguePlaying','waitingForSelection','inBattlefield','tutorialPlaying','inScenario','sequencePlaying','performancePlaying','minigame','housingEdit','abyssSequence'] as const;
export type ErgonData={
  activity:Record<typeof activityFlags[number],boolean|null>&{dungeonState:string|null;interactionType:string|null;mainButtonState?:string|null};
  inventory:{weight:number|null;maxWeight:number|null};
  works:{completedCount:number|null;items:{name:string;facility:string;state:string|null;completed:boolean|null;remainingSeconds:number|null}[]};
  materials:{items:ErgonMaterial[]};
  gathering:{items:{name:string;toolOk:boolean|null}[]};
  altering:{unlocked:boolean|null;items:ErgonRecipe[]};
  crafting:{unlocked:boolean|null;items:ErgonRecipe[]};
};
export type ErgonSnapshot<K extends ErgonReadKind=ErgonReadKind>={schemaVersion:1;kind:K;observedAt:number;source:'official-cli';data:ErgonData[K]};
export const validErgonReadKind=(value:unknown):value is ErgonReadKind=>typeof value==='string'&&(ergonReadKinds as readonly string[]).includes(value);
function invalid():never{throw Error('생활 조회 형식을 확인하지 못했어요. 다시 조회해 주세요.');}
function object(value:unknown,keys:readonly string[]):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))return invalid();
  const row=value as Record<string,unknown>;
  if(Object.keys(row).length!==keys.length||keys.some(k=>!Object.hasOwn(row,k)))return invalid();
  return row;
}
function text(value:unknown,nullable=false):string|null{
  if(nullable&&value===null)return null;
  if(typeof value!=='string'||!value.trim()||value.length>160||/[\x00-\x1f\x7f]/.test(value))return invalid();
  return value;
}
function number(value:unknown,decimal=false):number|null{
  if(value===null)return null;
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>Number.MAX_SAFE_INTEGER||(!decimal&&!Number.isSafeInteger(value)))return invalid();
  return value;
}
function bool(value:unknown):boolean|null{if(value===null||typeof value==='boolean')return value;return invalid();}
function rows<T>(value:unknown,parse:(value:unknown)=>T):T[]{if(!Array.isArray(value)||value.length>2048)return invalid();return value.map(parse);}
function recipe(value:unknown):ErgonRecipe{
  const r=object(value,['name','available','producedPerUnit','reason','missing']);
  return {name:text(r.name)!,available:bool(r.available),producedPerUnit:number(r.producedPerUnit),reason:text(r.reason,true),missing:r.missing===null?null:rows(r.missing,v=>{const m=object(v,['name','required','owned']);return {name:text(m.name)!,required:number(m.required),owned:number(m.owned)};})};
}
function data(kind:ErgonReadKind,value:unknown):ErgonData[ErgonReadKind]{
  switch(kind){
    case 'activity':{
      const hasMode=typeof value==='object'&&value!==null&&Object.hasOwn(value,'mainButtonState');
      const r=object(value,[...activityFlags,'dungeonState','interactionType',...(hasMode?['mainButtonState']:[])]);
      const result=Object.fromEntries(activityFlags.map(k=>[k,bool(r[k])])) as ErgonData['activity'];
      return {...result,dungeonState:text(r.dungeonState,true),interactionType:text(r.interactionType,true),mainButtonState:text(hasMode?r.mainButtonState:null,true)};
    }
    case 'inventory':{const r=object(value,['weight','maxWeight']);return {weight:number(r.weight,true),maxWeight:number(r.maxWeight,true)};}
    case 'works':{
      const r=object(value,['completedCount','items']);
      return {completedCount:number(r.completedCount),items:rows(r.items,v=>{const w=object(v,['name','facility','state','completed','remainingSeconds']);return {name:text(w.name)!,facility:text(w.facility)!,state:text(w.state,true),completed:bool(w.completed),remainingSeconds:number(w.remainingSeconds)};})};
    }
    case 'materials':{
      const r=object(value,['items']);return {items:rows(r.items,v=>{const m=object(v,['name','category','categoryName','location','count','locked']);if(!['inventory','account_storage','character_storage'].includes(String(m.location)))return invalid();return {name:text(m.name)!,category:text(m.category)!,categoryName:text(m.categoryName,true),location:m.location as ErgonMaterial['location'],count:number(m.count),locked:bool(m.locked)};})};
    }
    case 'gathering':{const r=object(value,['items']);return {items:rows(r.items,v=>{const g=object(v,['name','toolOk']);return {name:text(g.name)!,toolOk:bool(g.toolOk)};})};}
    case 'altering':case 'crafting':{const r=object(value,['unlocked','items']);return {unlocked:bool(r.unlocked),items:rows(r.items,recipe)};}
  }
}
/** Canonical native output only: raw CLI records never cross into trusted UI. */
export function parseErgonSnapshot<K extends ErgonReadKind>(kind:K,value:unknown):ErgonSnapshot<K>{
  if(!validErgonReadKind(kind))return invalid();
  const r=object(value,['schemaVersion','kind','observedAt','source','data']);
  if(r.schemaVersion!==1||r.kind!==kind||r.source!=='official-cli'||typeof r.observedAt!=='number'||!Number.isSafeInteger(r.observedAt)||r.observedAt<=0||r.observedAt>8640000000000000)return invalid();
  return {schemaVersion:1,kind,observedAt:r.observedAt,source:'official-cli',data:data(kind,r.data) as ErgonData[K]};
}
export function ergonSnapshotStale(snapshot:Pick<ErgonSnapshot,'observedAt'>,now:number):boolean{
  const age=now-snapshot.observedAt;
  return !Number.isFinite(age)||age<0||age>=15000;
}
