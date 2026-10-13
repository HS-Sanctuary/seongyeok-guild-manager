import {parseErgonSnapshot,type ErgonReadKind,type ErgonSnapshot} from './irisErgonRead';
export type ErgonSnapshots=Partial<{[K in ErgonReadKind]:ErgonSnapshot<K>}>;
export function createErgonSession(options:{read:<K extends ErgonReadKind>(kind:K)=>Promise<ErgonSnapshot<K>>;allowed:()=>boolean;context:()=>number;onChange:()=>void}){
 let snapshots:ErgonSnapshots={},notice='',generation=0;
 const errors:Partial<Record<ErgonReadKind,string>>={};
 const pending=new Map<ErgonReadKind,Promise<void>>();
 return {state:()=>({snapshots,notice,errors:{...errors},loadingKinds:[...pending.keys()]}),invalidate(){generation++;},refresh(kind:ErgonReadKind):Promise<void>{
  const current=pending.get(kind);if(current)return current;
  if(!options.allowed())return Promise.resolve();
  const context=options.context(),started=generation;
  let operation:Promise<void>;
  try{operation=options.read(kind).then(value=>{
   if(started!==generation||context!==options.context()||!options.allowed())return;
   const parsed=parseErgonSnapshot(kind,value);snapshots={...snapshots,[kind]:parsed};delete errors[kind];notice=Object.values(errors)[0]??'';
  }).catch(error=>{if(started===generation&&context===options.context()&&options.allowed()){notice=error instanceof Error?error.message:'생활 조회를 확인해 주세요.';errors[kind]=notice;}}).finally(()=>{if(pending.get(kind)===operation)pending.delete(kind);options.onChange();});}
  catch(error){notice=error instanceof Error?error.message:'생활 조회를 확인해 주세요.';options.onChange();return Promise.resolve();}
  pending.set(kind,operation);options.onChange();return operation;
 }};
}
