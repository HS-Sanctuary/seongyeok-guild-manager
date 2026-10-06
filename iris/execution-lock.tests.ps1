$ErrorActionPreference='Stop'
$helper=Join-Path $PSScriptRoot 'execution-lock.ps1'
if(!(Test-Path $helper)){throw 'Shared legacy/desktop ownership guard missing'}
. $helper
$name='Local\SANCTUM.IRIS.Test.'+[Guid]::NewGuid().ToString('N')
$owner=Enter-IrisExecutionLock $name
try {
 if(!$owner){throw 'First owner not acquired'}
 $job=Start-Job -ScriptBlock {param($helper,$name);. $helper;$lock=Enter-IrisExecutionLock $name;if($lock){$lock.ReleaseMutex();$lock.Dispose();return 'owned'};'blocked'} -ArgumentList $helper,$name
 try { $result=$job|Wait-Job|Receive-Job;if($result-ne 'blocked'){throw 'Two queue owners admitted'} } finally {Remove-Job $job}
} finally {$owner.ReleaseMutex();$owner.Dispose()}
$again=Enter-IrisExecutionLock $name
try{if(!$again){throw 'Released ownership not reusable'}}finally{if($again){$again.ReleaseMutex();$again.Dispose()}}
'Shared queue execution: competing process blocked, release reusable PASS'
