$ErrorActionPreference='Stop'
$taskSource=Join-Path $PSScriptRoot 'desktop-life-journal.cs'
if(!(Test-Path $taskSource)){throw 'Protected life journal missing'}
Add-Type -Path $taskSource -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
$taskRoot=Join-Path (Join-Path $PSScriptRoot '../.superpowers') ('life-journal-'+[guid]::NewGuid().ToString('N'))
$taskStore=New-Object IrisDesktop.DesktopLifeJournal([IO.Path]::GetFullPath($taskRoot),'development')
function Assert($value,$message){if(!$value){throw $message}}
function Reject($action){try{&$action}catch{return};throw 'Invalid journal transition accepted'}
[void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($taskStore.FilePath))
$taskLock=[IO.File]::Open($taskStore.FilePath+'.lock',[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
try { Reject { $taskStore.HasUnresolved() } } finally { $taskLock.Dispose() }
$taskId=[guid]::NewGuid().ToString()
$taskStore.Begin($taskId,'account-a','character-a','gathering','wood',5)
Assert ($taskStore.HasUnresolved()) 'Inflight operation was not blocked'
Reject { $taskStore.Begin([guid]::NewGuid().ToString(),'account-b','character-b','altering','wood',5) }
$taskStore.SetOutcome($taskId,'unknown')
Reject { $taskStore.SetOutcome($taskId,'completed') }
$taskReload=New-Object IrisDesktop.DesktopLifeJournal([IO.Path]::GetFullPath($taskRoot),'development')
Assert ($taskReload.HasUnresolved()) 'Restart lost unknown operation'
$taskRaw=[IO.File]::ReadAllBytes($taskReload.FilePath)
Assert (![Text.Encoding]::UTF8.GetString($taskRaw).Contains('character-a')) 'Journal exposed plaintext'
$taskOther=New-Object IrisDesktop.DesktopLifeJournal([IO.Path]::GetFullPath($taskRoot),'production')
Assert ($taskOther.EntriesFor('account-a').Length -eq 0) 'Environment records mixed'
Assert ($taskOther.HasUnresolved()) 'Changing environment bypassed unknown game action'
$taskRunLease=$taskStore.AcquireExecutionLease()
try { Reject { $taskOther.AcquireExecutionLease() } } finally { $taskRunLease.Dispose() }
$taskRecoveryRoot=Join-Path $taskRoot 'restart'
$taskInflight=New-Object IrisDesktop.DesktopLifeJournal($taskRecoveryRoot,'development')
$taskInflight.Begin([guid]::NewGuid().ToString(),'account-a','character-a','crafting','wood',5)
$taskAfterRestart=New-Object IrisDesktop.DesktopLifeJournal($taskRecoveryRoot,'development')
Assert ($taskAfterRestart.HasUnresolved()) 'Inflight restart became success'
$taskFreshRoot=Join-Path $taskRoot 'fresh'
$taskFresh=New-Object IrisDesktop.DesktopLifeJournal($taskFreshRoot,'development')
$taskFresh.Begin($taskId,'account-a','character-a','altering','wood',5)
$taskFresh.SetOutcome($taskId,'registered')
Assert (!$taskFresh.HasUnresolved()) 'Registration falsely blocked forever'
Reject { $taskFresh.Begin($taskId,'account-a','character-a','altering','wood',5) }
Reject { $taskFresh.Begin([guid]::NewGuid().ToString(),'account-a','character-a','stop_action','wood',5) }
[IO.File]::WriteAllBytes($taskFresh.FilePath,[byte[]]@(1,2,3))
Reject { $taskFresh.HasUnresolved() }
Assert (([IO.File]::ReadAllBytes($taskFresh.FilePath)).Length -eq 3) 'Corruption was overwritten'
Write-Output 'PASS DPAPI journal: unknown/restart/cross-account block, environment separation, replay rejection, corruption preservation; game commands zero'
