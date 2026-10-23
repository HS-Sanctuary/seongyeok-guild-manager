param([Parameter(Mandatory=$true)][ValidateSet('normal','response-loss','after-begin','probe','recover','reopen')][string]$Mode,[Parameter(Mandatory=$true)][string]$Root)
$ErrorActionPreference='Stop'
$taskBase=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/n04-synthetic'))
$taskRoot=[IO.Path]::GetFullPath($Root)
if(!$taskRoot.StartsWith($taskBase+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'N04 root must be inside its synthetic directory'}
$taskCursor=$taskRoot
while($taskCursor){if((Test-Path -LiteralPath $taskCursor) -and ((Get-Item -LiteralPath $taskCursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'N04 root cannot cross a reparse point'};$taskCursor=[IO.Path]::GetDirectoryName($taskCursor)}
$taskSources=@('desktop-life-journal.cs','desktop-life-policy.cs','desktop-life-executor.cs','desktop-life-automation.cs','desktop-life-reconciliation.cs','desktop-cli-activity.cs','desktop-life-progress.cs','desktop-life-progress-coordinator.cs','desktop-life-progress-connection.cs','desktop-life-progress-approval.cs','desktop-life-progress-host.fixture.cs','desktop-life-progress-interruption.fixture.cs')
Add-Type -Path @($taskSources|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security','System.Windows.Forms','System.Drawing')
[IrisDesktop.ProgressInterruptionFixture]::Run($taskRoot,$Mode).GetAwaiter().GetResult()
