import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
test('D2 compatibility gate: current native v1 rejects unsafe extensions without modifying synthetic original',{skip:process.platform!=='win32'},()=>{
 const r=spawnSync('powershell.exe',['-NoProfile','-File','iris/desktop-life-manual-compat.tests.ps1'],{encoding:'utf8',windowsHide:true,timeout:60000});
 assert.equal(r.status,0,r.stderr||r.stdout||r.error?.message);for(let i=1;i<=8;i++)assert.match(r.stdout,new RegExp('PASS D2C0'+i+'-'));
});
