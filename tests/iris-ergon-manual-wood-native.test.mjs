import test from 'node:test';import assert from 'node:assert/strict';import {spawn,spawnSync} from 'node:child_process';import {randomUUID} from 'node:crypto';import {mkdirSync,readFileSync} from 'node:fs';
test('D2 native DPAPI/domain, approval, fresh-process recovery and fixed pre-D2 downgrade boundary',{skip:process.platform!=='win32',timeout:180000},async()=>{
 mkdirSync('.superpowers/ergon-d2',{recursive:true});
 const run=(file,args=[])=>{const p=spawnSync('powershell.exe',['-NoProfile','-File',file,...args],{encoding:'utf8',timeout:120000});assert.equal(p.status,0,p.stdout+'\n'+p.stderr);return p.stdout;};
 assert.match(run('iris/desktop-life-manual-wood.tests.ps1'),/PASS D2D09/);
 const root=readFileSync('.superpowers/ergon-d2/last-domain-root.txt','utf8');assert.match(run('iris/desktop-life-manual-wood.tests.ps1',['-Reopen','-Root',root]),/PASS D2D10/);assert.match(run('iris/desktop-life-manual-downgrade.tests.ps1',['-Root',root]),/PASS D2V01/);
 const workers=await Promise.all([1,2].map(()=>new Promise((resolve,reject)=>{const p=spawn('powershell.exe',['-NoProfile','-File','iris/desktop-life-manual-wood.tests.ps1','-Root',root,'-RaceOperation',randomUUID()],{windowsHide:true});let output='';p.stdout.on('data',v=>output+=v);p.stderr.on('data',v=>output+=v);p.on('error',reject);p.on('exit',code=>code===0?resolve(output):reject(Error(output)));})));assert.equal(workers.filter(o=>o.includes('RACE committed')).length,1);assert.equal(workers.filter(o=>o.includes('RACE conflict')).length,1);assert.match(run('iris/desktop-life-manual-wood.tests.ps1',['-Root',root,'-RaceCheck']),/PASS D2D12/);
 assert.match(run('iris/desktop-life-manual-host.tests.ps1'),/PASS D2H06/);
});
