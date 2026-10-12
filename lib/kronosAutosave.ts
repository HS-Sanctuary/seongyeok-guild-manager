export type KronosSaveFields=Record<string,string>;
export type KronosSaveState={pending:number;saving:boolean;error:boolean;dueAt:number|null};
// Owns one browser-page save stream. Each edit supplies its immutable render's
// writer; requests already sent are never cancelled or replayed automatically.
export function createKronosAutosave(options:{now?:()=>number;schedule?:(fn:()=>Promise<void>,delay:number)=>unknown;cancel?:(timer:unknown)=>void}={}){
  const now=options.now??Date.now,schedule=options.schedule??((fn,delay)=>setTimeout(()=>void fn(),delay)),cancel=options.cancel??(timer=>clearTimeout(timer as ReturnType<typeof setTimeout>));
  let base:KronosSaveFields={},latest:KronosSaveFields={},writer:(()=>Promise<void>)|null=null,dueAt:number|null=null,error=false,disposed=false,flight:Promise<void>|null=null,timer:unknown;
  const listeners=new Set<()=>void>();
  const pending=()=>new Set([...Object.keys(base),...Object.keys(latest)].filter(key=>base[key]!==latest[key])).size;
  const emit=()=>listeners.forEach(listener=>listener());
  const stop=()=>{if(timer!==undefined)cancel(timer);timer=undefined;};
  const arm=()=>{stop();if(disposed||error||flight||!pending()||dueAt===null)return;timer=schedule(async()=>{timer=undefined;try{await writeOne();}catch{/* Explicit retry only. */}},Math.max(0,dueAt-now()));};
  const writeOne=():Promise<void>=>{
    if(flight)return flight;
    if(disposed||!pending()||!writer)return Promise.resolve();
    stop();const fields={...latest},write=writer;error=false;
    flight=Promise.resolve().then(write).then(()=>{base=fields;if(!pending())dueAt=null;}).catch(reason=>{error=true;throw reason;}).finally(()=>{flight=null;emit();arm();});
    emit();return flight;
  };
  return {
    state:():KronosSaveState=>({pending:pending(),saving:!!flight,error,dueAt}),
    subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
    reset(fields:KronosSaveFields){if(flight||pending())throw Error('미저장 변경이 남아 있어요.');stop();base={...fields};latest={...fields};writer=null;dueAt=null;error=false;disposed=false;emit();},
    edit(fields:KronosSaveFields,write:()=>Promise<void>){if(disposed)return;latest={...fields};writer=write;dueAt=pending()||flight?now()+15000:null;emit();arm();},
    async flush(){stop();if(disposed)throw Error('저장 화면이 닫혔어요.');if(flight)await flight;while(pending())await writeOne();},
    dispose(){disposed=true;stop();listeners.clear();},
  };
}

// Semantic leaf IDs keep the counter meaningful: one task or stat = one edit,
// independent of array ordering or how many times its control was clicked.
export function kronosSaveFields(value:{profile:Record<string,unknown>;contribution:unknown;levels:Record<string,number>;daily:unknown[];weekly:unknown[];repeat:Record<string,boolean[]>;abyss:unknown[];raid:unknown[];trade:Record<string,number>;buyers:Record<string,string>}):KronosSaveFields{
  const fields:KronosSaveFields={};
  for(const [key,item] of Object.entries(value.profile))fields['profile:'+key]=String(item??'');
  fields.contribution=String(value.contribution??'');
  for(const [key,item] of Object.entries(value.levels))fields['level:'+key]=String(item);
  for(const key of ['daily','weekly','abyss','raid'] as const)for(const item of value[key])fields[key+':'+(typeof item==='object'?JSON.stringify(item):String(item))]='true';
  for(const [key,item] of Object.entries(value.repeat))fields['repeat:'+key]=JSON.stringify(item);
  for(const key of new Set([...Object.keys(value.trade),...Object.keys(value.buyers)]))if(value.trade[key])fields['trade:'+key]=JSON.stringify([value.trade[key],value.buyers[key]??'']);
  return fields;
}
