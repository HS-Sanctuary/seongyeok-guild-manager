$ErrorActionPreference='Stop'
$root=Join-Path $PSScriptRoot ('../.superpowers/d2/'+[guid]::NewGuid().ToString('N').Substring(0,8))
$names=@('desktop-life-journal.cs','desktop-life-policy.cs','desktop-life-executor.cs','desktop-life-automation.cs','desktop-life-reconciliation.cs','desktop-cli-activity.cs','desktop-life-progress.cs','desktop-life-progress-coordinator.cs','desktop-life-progress-connection.cs','desktop-life-progress-approval.cs','desktop-life-wood-store.cs','desktop-life-progress-host.fixture.cs','desktop-life-manual-host.fixture.cs')
Add-Type -Path @($names|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security','System.Windows.Forms','System.Drawing')
[IrisDesktop.ManualWoodHostFixture]::Run([IO.Path]::GetFullPath($root)).GetAwaiter().GetResult()
