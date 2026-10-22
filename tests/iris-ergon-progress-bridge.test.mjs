import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('candidate native boundary requires durable goal/binding and final native checks before one synthetic dispatch', {skip:process.platform!=='win32'},()=>{
  // Executes the native coordinator. This is not an installed host bridge test.
  const output=execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','iris/desktop-life-progress-integration.tests.ps1','-Mode','report'],{encoding:'utf8',timeout:120000,windowsHide:true});
  const report=JSON.parse(output.trim());
  assert.equal(report.failed,0,JSON.stringify(report.results));
  assert.equal(report.results.length,22);
  assert.ok(report.results.every(row=>row.status==='PASS'));
  assert.deepEqual(report.results.map(row=>row.id),Array.from({length:22},(_,i)=>`A${String(i+1).padStart(2,'0')}`));
});
