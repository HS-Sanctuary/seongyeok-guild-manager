$ErrorActionPreference='Stop'
$replacementRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot ('../.superpowers/goal-replacement-host/'+[guid]::NewGuid().ToString('N'))))
$cursor=$replacementRoot;while($cursor){if((Test-Path -LiteralPath $cursor)-and((Get-Item -LiteralPath $cursor -Force).Attributes-band[IO.FileAttributes]::ReparsePoint)){throw 'Synthetic root cannot cross reparse point'};$cursor=[IO.Path]::GetDirectoryName($cursor)}
$sources=@('desktop-life-journal.cs','desktop-life-policy.cs','desktop-life-executor.cs','desktop-life-automation.cs','desktop-life-reconciliation.cs','desktop-cli-activity.cs','desktop-life-progress.cs','desktop-life-progress-coordinator.cs','desktop-life-progress-host.fixture.cs','desktop-life-progress-connection.cs','desktop-life-progress-approval.cs','desktop-life-goal-replacement-host.fixture.cs')
Add-Type -Path @($sources|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security','System.Windows.Forms','System.Drawing')
[IrisDesktop.GoalReplacementHostFixture]::Run($replacementRoot).GetAwaiter().GetResult()
