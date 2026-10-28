import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('native online lifetime survives hidden/tray-equivalent ticks and fences cookie/close/late responses',{skip:process.platform!=='win32'},()=>{
 const result=spawnSync('powershell.exe',['-NoProfile','-File','iris/desktop-online.tests.ps1'],{encoding:'utf8',windowsHide:true,timeout:30000});
 assert.equal(result.status,0,result.stderr||result.stdout||result.error?.message);
 assert.match(result.stdout,/PASS native online/);
});