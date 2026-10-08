import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
test('IRIS launchers cannot load or enable an external RAM cleaner',()=>{
  for(const file of ['iris/desktop.ps1','iris/overlay.ps1'])assert.doesNotMatch(readFileSync(file,'utf8'),/ram-companion|Add-IrisRamCompanionMenu|Start-IrisRamCompanion/);
  for(const file of ['iris/ram-companion.ps1','iris/configure-ram-companion.ps1'])assert.equal(existsSync(file),false,'External cleaner launcher remains available');
});
