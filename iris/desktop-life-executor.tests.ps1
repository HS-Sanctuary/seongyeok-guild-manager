$ErrorActionPreference='Stop'
$taskSources=@('desktop-life-journal.cs','desktop-life-policy.cs','desktop-life-executor.cs','desktop-life-automation.cs','desktop-life-reconciliation.cs','desktop-cli-activity.cs','desktop-life-executor.fixture.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
foreach($taskFile in $taskSources){if(!(Test-Path $taskFile)){throw 'Life executor missing'}}
Add-Type -Path $taskSources -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
$taskRoot=[IO.Path]::GetFullPath((Join-Path (Join-Path $PSScriptRoot '../.superpowers') ('life-executor-'+[guid]::NewGuid().ToString('N'))))
[IrisDesktop.LifeExecutorFixture]::Run($taskRoot).GetAwaiter().GetResult()
Write-Output 'PASS native action nonce/preflight/consent/receipt/journal; synthetic IO only, no real game commands'
