import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
test('Windows independent checkboard reads filters and recovers without game actions',{skip:process.platform!=='win32'},async t=>{
  let output;
  try {output=execFileSync('powershell.exe',['-NoProfile','-STA','-ExecutionPolicy','Bypass','-File',fileURLToPath(new URL('./overlay-checkboard.tests.ps1',import.meta.url))],{encoding:'utf8',timeout:30000,windowsHide:true});}
  catch(error) {if(!error.stdout) throw error;output=error.stdout;}
  for(const result of JSON.parse(output)) await t.test(result.name,()=>assert.equal(result.passed,true,result.error));
});
