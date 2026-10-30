import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('D2 fixed old/new processes preserve audit, block ordinary downgrade writes, characterize explicit recovery risk and restore history', {skip:process.platform!=='win32', timeout:180000}, () => {
  const r=spawnSync('powershell.exe',['-NoProfile','-File','iris/desktop-life-manual-upgrade.tests.ps1'],{encoding:'utf8',windowsHide:true,timeout:170000});
  assert.equal(r.status,0,r.stderr||r.stdout||r.error?.message);
  for(const id of ['D2U-A1','D2U-A2','D2U-B','D2U-C-before','D2U-C-after','D2U-C-ack','D2U-C-update','D2U-D1','D2U-D2']) assert.ok(r.stdout.includes('PASS '+id),`missing ${id}: ${r.stdout}`);
  assert.ok(r.stdout.includes('LIMIT D2U-B-recover'),'explicit old Recover risk must remain visible in the evidence');
});
