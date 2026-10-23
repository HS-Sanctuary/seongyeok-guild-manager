import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('native quantity approval binds zero, extra and corrections without consuming game resources',{skip:process.platform!=='win32'},()=>{
 const output=execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','iris/desktop-life-progress-quantity.tests.ps1'],{encoding:'utf8',windowsHide:true,timeout:120000});
 for(let i=1;i<=12;i++)assert.match(output,new RegExp(`PASS V${String(i).padStart(2,'0')}`));
});
