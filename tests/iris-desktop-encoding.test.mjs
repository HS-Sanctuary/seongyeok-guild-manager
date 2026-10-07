import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('Windows PowerShell reads desktop tray labels without Korean corruption', { skip: process.platform !== 'win32' }, () => {
  const command = "[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding; $tokens=$null; $errors=$null; [void][System.Management.Automation.Language.Parser]::ParseFile((Join-Path (Get-Location) 'iris/desktop.ps1'),[ref]$tokens,[ref]$errors); if($errors.Count){exit 1}; @($tokens | Where-Object { $_ -is [System.Management.Automation.Language.StringToken] } | ForEach-Object { $_.Value }) | ConvertTo-Json -Compress";
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  const labels = JSON.parse(result.stdout.trim());
  for (const label of ['SANCTUM IRIS · 생텀 센터', '센터 열기 · 입력 복구', '종료', '복구 종료 · 최근 변경 손실 주의']) {
    assert.ok(labels.includes(label), `Windows PowerShell must preserve tray label: ${label}`);
  }
});
