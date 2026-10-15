$ErrorActionPreference='Stop'
Add-Type -Path @('desktop-host.cs','desktop-store.cs','desktop-bridge.cs','desktop-cli-activity.cs','desktop-workspace.fixture.cs'|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @('System.Security','System.Web.Extensions','System.Core')
$taskRoot=Join-Path $PSScriptRoot ('../.superpowers/sdd/2026-10-14-ergon-command-workspace/bridge-'+[guid]::NewGuid().ToString('N'))
$taskStore=New-Object IrisDesktop.DesktopStore($taskRoot,'development')
$taskBridge=New-Object IrisDesktop.DesktopBridge($taskStore,$true)
$taskUrl=[Uri]'http://localhost:3000/iris/desktop'
[void]$taskBridge.Activate($taskUrl)
[IrisDesktop.WorkspaceBridgeProbe]::Bind($taskBridge)
function SendWorkspace($id,$payload,$source=$taskUrl,$epoch=$taskBridge.Epoch){$taskBridge.Handle($source,(@{version=1;id=[string]$id;epoch=$epoch;method='window.workspace';payload=$payload}|ConvertTo-Json -Compress))|ConvertFrom-Json}
$taskReply=SendWorkspace 1 @{expanded=$true}
if(!$taskReply.ok){Write-Output ($taskReply|ConvertTo-Json -Compress);throw 'Boolean expansion unavailable'}
if((SendWorkspace 2 @{expanded=1240}).ok){throw 'Arbitrary numeric size accepted'}
if((SendWorkspace 3 @{expanded=$false;path='bad'}).ok){throw 'Extra property accepted'}
if((SendWorkspace 4 @{expanded=$true} ([Uri]'https://evil.test/iris/desktop')).ok){throw 'Foreign origin accepted'}
if((SendWorkspace 4 @{expanded=$true} $taskUrl ($taskBridge.Epoch-1)).ok){throw 'Stale epoch accepted'}
if([IrisDesktop.WorkspaceBridgeProbe]::Calls-ne 1){throw 'Rejected requests invoked window mutation'}
if(!(SendWorkspace 5 @{expanded=$false}).ok){throw 'Restore unavailable'}
if(Test-Path $taskStore.FilePath){throw 'Window mode wrote protected queue'}
Write-Output 'PASS workspace strict bool/extra property/origin/epoch/restore/no queue writes'
