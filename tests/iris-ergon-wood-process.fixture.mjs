import {FileRepo} from './iris-ergon-wood.fixture.mjs';
import {spawn} from 'node:child_process';import {writeFileSync} from 'node:fs';import path from 'node:path';
// Synthetic-only repository adapter. Real host integration must own its lease
// inside the host process; this stdin guardian is NOT a product execution path.
export class ProcessRepo extends FileRepo {
 async withActor(scope,body){return super.withActor(scope,async()=>{
  const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','iris/desktop-life-wood-process.tests.ps1','-Root',this.root],{windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='',owned=false,timer;
  const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>resolve({code,err}));});
  const admitted=new Promise((resolve,reject)=>{child.stdout.on('data',b=>{out+=b.toString();if(out.includes('CONTENDED'))writeFileSync(path.join(this.root,'contended-'+process.pid),'native lease denied sibling');if(out.includes('OWNED')&&!owned){owned=true;resolve();}});child.stderr.on('data',b=>err+=b.toString());child.once('error',reject);child.once('exit',code=>reject(Error('native test lease exited '+code+': '+err)));timer=setTimeout(()=>reject(Error('native test lease timeout')),20000);});
  try{await admitted;clearTimeout(timer);return await body();}
  finally{clearTimeout(timer);child.stdin.end();let cleanupTimer;try{const r=await Promise.race([done,new Promise((_,reject)=>cleanupTimer=setTimeout(()=>reject(Error('native helper EOF timeout')),5000))]);if(r.code!==0)throw Error('native helper failed: '+r.err);}finally{clearTimeout(cleanupTimer);if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await done;}}}
 });}
}
