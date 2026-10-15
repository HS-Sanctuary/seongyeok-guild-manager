$ErrorActionPreference='Stop'
if(!(Test-Path (Join-Path $PSScriptRoot 'desktop-life-reconciliation.cs'))){throw 'One-click native reconciliation is not implemented'}
$taskSources=@('desktop-life-journal.cs','desktop-life-automation.cs','desktop-life-policy.cs','desktop-cli-activity.cs','desktop-life-reconciliation.cs','desktop-life-executor.cs','desktop-life-collection.fixture.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
Add-Type -Path $taskSources -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
$taskRoot=[IO.Path]::GetFullPath((Join-Path (Join-Path $PSScriptRoot '../.superpowers') ('life-collection-'+[guid]::NewGuid().ToString('N'))))
[IrisDesktop.LifeCollectionFixture]::Run($taskRoot).GetAwaiter().GetResult()
Write-Output 'PASS one-click reconciliation/permission/TTL/replay/unknown; synthetic IO only'
