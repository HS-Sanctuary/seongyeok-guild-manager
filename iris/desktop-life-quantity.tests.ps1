$ErrorActionPreference='Stop'
$taskSources=@('desktop-life-journal.cs','desktop-life-policy.cs','desktop-life-executor.cs','desktop-life-progress.cs','desktop-life-progress-coordinator.cs','desktop-life-progress-connection.cs','desktop-life-progress-regression.fixture.cs','desktop-life-automation.cs','desktop-life-reconciliation.cs','desktop-cli-activity.cs','desktop-life-quantity.fixture.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
Add-Type -Path $taskSources -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
$taskRoot=[IO.Path]::GetFullPath((Join-Path (Join-Path $PSScriptRoot '../.superpowers') ('life-quantity-'+[guid]::NewGuid().ToString('N'))))
[IrisDesktop.LifeQuantityFixture]::Run($taskRoot).GetAwaiter().GetResult()
