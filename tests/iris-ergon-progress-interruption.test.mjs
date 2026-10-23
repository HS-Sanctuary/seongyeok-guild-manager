import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

function worker(root,mode){
 const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','iris/desktop-life-progress-interruption.tests.ps1','-Mode',mode,'-Root',root],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
 const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal,output}));});
 return {child,done,output:()=>output};
}
async function ready(root,owned){
 const deadline=Date.now()+30000;
 while(Date.now()<deadline){
  try{return JSON.parse(await readFile(path.join(root,'ready.json'),'utf8'));}catch(e){if(e.code!=='ENOENT'&&e.code!=='EBUSY'&&!(e instanceof SyntaxError))throw e;}
  assert.equal(owned.child.exitCode,null,owned.output());
  await delay(25);
 }
 throw Error('N04 child did not reach the owned stop point: '+owned.output());
}
async function finish(owned){
 let timer;
 try{
  const result=await Promise.race([owned.done,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('N04 worker timeout')),30000);})]);
  assert.equal(result.code,0,result.output);return result;
 }finally{
  clearTimeout(timer);
  if(owned.child.exitCode===null&&owned.child.signalCode===null){owned.child.kill('SIGKILL');await owned.done;}
 }
}
test('N04 ready accepts durable marker after a normal child already exited',async()=>{
 const base=path.resolve('.superpowers/n04-synthetic');await mkdir(base,{recursive:true});
 const root=await mkdtemp(path.join(base,'marker-'));const marker={mode:'normal',pid:123};
 await writeFile(path.join(root,'ready.json'),JSON.stringify(marker));
 assert.deepEqual(await ready(root,{child:{exitCode:0},output:()=>''}),marker);
 const missing=await mkdtemp(path.join(base,'no-marker-'));
 await assert.rejects(()=>ready(missing,{child:{exitCode:0},output:()=> 'exited before marker'}));
});
test('N04 owned child interruption preserves native unknown and quantity history without replay',{skip:process.platform!=='win32',timeout:180000},async t=>{
 const base=path.resolve('.superpowers/n04-synthetic');await mkdir(base,{recursive:true});
 for(const mode of ['normal','response-loss','after-begin']){
  const root=await mkdtemp(path.join(base,mode+'-'));const owned=worker(root,mode);
  try{
   const marker=await ready(root,owned);assert.equal(marker.pid,owned.child.pid);assert.equal(marker.mode,mode);
   if(mode==='normal')await finish(owned);
   else{
    const probe=await finish(worker(root,'probe'));assert.match(probe.output,/PASS N04 paused lease/);
    assert.equal(owned.child.exitCode,null);assert.equal(owned.child.kill('SIGKILL'),true);
    const stopped=await owned.done;assert.notEqual(stopped.code,0); // Only the process object created above is killed.
   }
   const recovered=await finish(worker(root,'recover'));assert.match(recovered.output,/PASS N04 recovery/);
   const reopened=await finish(worker(root,'reopen'));assert.match(reopened.output,/PASS N04 stable reopen/);
   const result=JSON.parse(await readFile(path.join(root,'verified.json'),'utf8'));
   assert.equal(result.state,mode==='normal'?'completed':'unknown');
   assert.equal(result.dispatches,mode==='after-begin'?0:1);assert.equal(result.historyQuantity,2);
   assert.equal(result.historyConfirmations,2);assert.equal(result.newQuantity,null);
   t.diagnostic(`${mode}: writer=${marker.pid}, recovery=${result.pid}, state=${result.state}, dispatches=${result.dispatches}, history=3->2, newQuantity=null`);
  }finally{if(owned.child.exitCode===null&&owned.child.signalCode===null){owned.child.kill('SIGKILL');await owned.done;}}
 }
});
