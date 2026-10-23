$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot ('../.superpowers/quantity-approval/'+[guid]::NewGuid().ToString('N'))))
$taskSources=@('desktop-life-journal.cs','desktop-life-policy.cs','desktop-life-executor.cs','desktop-life-automation.cs','desktop-life-reconciliation.cs','desktop-cli-activity.cs','desktop-life-progress.cs','desktop-life-progress-coordinator.cs','desktop-life-progress-connection.cs','desktop-life-progress-approval.cs','desktop-life-progress-host.fixture.cs','desktop-life-progress-quantity.fixture.cs')
Add-Type -Path @($taskSources|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security','System.Windows.Forms','System.Drawing')
[IrisDesktop.ProgressQuantityFixture]::Run($taskRoot).GetAwaiter().GetResult()
