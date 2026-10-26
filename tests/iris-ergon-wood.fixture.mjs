import {mkdir,readFile,writeFile,rename,lstat} from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';
export const scope={environment:'development',accountId:'synthetic',characterId:'wood-character'},goalId='10000000-0000-4000-8000-000000000001',plan={id:'wood-plan',kind:'altering',displayName:'목재',targetQuantity:100},approval={id:'approval-wood',maxWings:1000,maxLogs:1000,maxGather:1000,expiresAt:9999999};
const copy=x=>structuredClone(x),locks=new Map();
export async function directory(){const base=path.resolve('.superpowers/wood-production');await mkdir(base,{recursive:true});const root=path.join(base,randomUUID());await mkdir(root);return root;}
async function own(root){if(!path.resolve(root).startsWith(path.resolve('.superpowers/wood-production')+path.sep))throw Error('synthetic root only');for(let p=path.resolve(root);p!==path.dirname(p);p=path.dirname(p)){try{if((await lstat(p)).isSymbolicLink())throw Error('reparse');}catch(e){if(e.code!=='ENOENT')throw e;}}}
async function load(file){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function save(file,value){const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(value),{flag:'wx'});await rename(temp,file);}
export class FileRepo {
 mode='synthetic';fail='';constructor(root){this.root=root;}
 async withActor(_scope,body){await own(this.root);const old=locks.get(this.root)??Promise.resolve();let release;const next=new Promise(r=>release=r);locks.set(this.root,next);await old;try{return await body();}finally{release();}}
 async load(){return load(path.join(this.root,'manager.json'));}
 async commit(expected,state){const before=await this.load();if((before?.revision??0)!==expected)throw Error('CAS');if(this.fail==='pending'&&state.events.at(-1)?.receipt===null)throw Error('write fail');if(this.fail==='terminal'&&state.events.at(-1)?.receipt)throw Error('terminal fail');await save(path.join(this.root,'manager.json'),state);if(this.fail==='ack'&&state.events.at(-1)?.receipt===null)throw Error('ACK lost');return copy(state);}
}
export class FakeWoodCli {
 mode='synthetic';fail='';extra=0;partial=0;active=0;maxActive=0;constructor(root){this.root=root;}
 async world(){return await load(path.join(this.root,'world.json'));}
 async init(){await save(path.join(this.root,'world.json'),{source:'synthetic-cli',scope,observedAt:1000,version:1,unknown:false,external:false,logs:2,wood:50,wings:1000,recipe:{id:'recipe-wood-v1',output:3,logs:2,durationMs:100},facility:{id:'mill',capacity:3},gatherLimit:20,works:[],commands:[],clock:1000,outputs:{}});}
 async change(fn){const w=await this.world();fn(w);await save(path.join(this.root,'world.json'),w);}
 async advance(ms=100){await this.change(w=>w.clock+=ms);}
 async observe(){const w=await this.world(),snapshot=copy(w);delete snapshot.commands;delete snapshot.clock;delete snapshot.outputs;return {...snapshot,observedAt:w.clock,works:w.works.map(job=>({...job,ready:w.clock>=job.readyAt}))};}
 async quote(command,snapshot){return {source:'synthetic-cli',commandId:command.id,version:snapshot.version,expiresAt:(await this.world()).clock+1000,wings:this.fail==='cost'?null:1,logs:command.kind==='register'?snapshot.recipe.logs:0};}
 async execute(command,quote){this.active++;this.maxActive=Math.max(this.maxActive,this.active);try{await new Promise(r=>setTimeout(r,1));const w=await this.world();if(w.commands.includes(command.id))throw Error('duplicate dispatch');w.commands.push(command.id);w.wings-=quote.wings;w.logs-=quote.logs;const receipt={source:'synthetic-cli',scope,commandId:command.id,beforeVersion:w.version,afterVersion:++w.version,wings:quote.wings,logs:quote.logs,gainedLogs:0,work:null,delivery:null};
 if(command.kind==='gather'){w.logs+=command.amount;receipt.gainedLogs=command.amount;}
 if(command.kind==='register'){const job={id:'work-'+command.id,recipeId:w.recipe.id,facilityId:w.facility.id,readyAt:w.clock+w.recipe.durationMs,ready:false};w.works.push(job);w.outputs[job.id]=w.recipe.output+this.extra;receipt.work=job;}
 if(command.kind==='collect'){const job=w.works.find(j=>j.id===command.workId);if(!job||w.clock<job.readyAt)throw Error('not ready');const left=w.outputs[job.id],quantity=this.partial?Math.min(this.partial,left):left;w.outputs[job.id]-=quantity;w.wood+=quantity;const closed=w.outputs[job.id]===0;receipt.delivery={id:'delivery-'+command.id,workId:job.id,quantity,closed};if(closed)w.works=w.works.filter(j=>j.id!==job.id);}
 await save(path.join(this.root,'world.json'),w);if(this.fail==='lost')throw Error('response lost');if(this.fail==='mismatch')receipt.afterVersion++;if(this.fail==='duplicate-delivery'&&receipt.delivery)receipt.delivery.id='duplicate';return receipt;
 }finally{this.active--;}}
 async native(){return {schemaVersion:1,revision:1,health:'ok',scope,capacityWarning:false,recoveryCandidates:[],goals:[{goalId,sourcePlanId:plan.id,parentGoalId:null,rootGoalId:goalId,action:'altering',displayName:plan.displayName,targetQuantity:plan.targetQuantity,lifecycle:'active',detached:false,confirmedQuantity:0,remainingQuantity:100,excessQuantity:0,quantityUnconfirmed:false,quantitySatisfied:false,registeredCount:0,requests:[]}]};}
}
