$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot 'desktop-lifecycle.cs'
if (!(Test-Path $source)) { throw 'Desktop singleton lifecycle missing' }
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-host.cs'),$source,(Join-Path $PSScriptRoot 'desktop-lifecycle.fixture.cs')) -ReferencedAssemblies @('System.Core','System.Security')
$profile=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-06-iris-compact-overlay/singleton-'+[Guid]::NewGuid().ToString('N'))
$first=New-Object IrisDesktop.DesktopSingleInstance('development',$profile)
$count=0
try {
 if($first.IsOwner){$count++}
 $second=New-Object IrisDesktop.DesktopSingleInstance('development',$profile)
 try {if($second.IsOwner){$count++};if($count-ne 1){throw 'Duplicate window created'};if(!$first.TakeActivation()){throw 'Existing window not signaled'}} finally {$second.Dispose()}
} finally {$first.Dispose()}
$reopened=New-Object IrisDesktop.DesktopSingleInstance('development',$profile)
try {if(!$reopened.IsOwner){throw 'Normal close did not release singleton'}}finally{$reopened.Dispose()}
if(![IrisDesktop.DesktopLifecycleFixture]::RecoverAbandoned($profile+'-abandoned')){throw 'Crash recovery treated abandoned owner as duplicate'}
Write-Output 'Desktop singleton: single owner, duplicate activation, normal release PASS'
