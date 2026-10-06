import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('Windows overlay display preferences and recovery behavior', {skip:process.platform !== 'win32'}, async t => {
  let output;
  try {
    output = execFileSync('powershell.exe', ['-NoProfile','-STA','-ExecutionPolicy','Bypass','-File',fileURLToPath(new URL('./overlay-support.tests.ps1',import.meta.url))], {encoding:'utf8',timeout:30_000,windowsHide:true});
  } catch (error) {
    output = error.stdout;
    if (!output) throw error;
  }
  const cases = JSON.parse(output);
  for (const result of cases) {
    await t.test(result.name, () => assert.equal(result.passed,true,result.error));
  }
});
