param([ValidateSet('domain','storage','all','vector','worker')][string]$Mode='all',[string]$Root='', [string]$WorkerGoal='', [string]$CaseID='')
$ErrorActionPreference='Stop'
$taskBase=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/progress-synthetic'))
if($Root -eq '') {$Root=Join-Path $taskBase ([guid]::NewGuid().ToString('N'))}
$taskRoot=[IO.Path]::GetFullPath($Root)
if(!$taskRoot.StartsWith($taskBase+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) {throw 'Synthetic root must be a child of the dedicated test directory'}
$taskCursor=$taskRoot
while($taskCursor.Length -ge $taskBase.Length) {
    if((Test-Path -LiteralPath $taskCursor) -and ((Get-Item -LiteralPath $taskCursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {throw 'Synthetic root cannot cross a reparse point'}
    $taskCursor=[IO.Path]::GetDirectoryName($taskCursor)
}
[void][IO.Directory]::CreateDirectory($taskRoot)
if(!(Test-Path (Join-Path $PSScriptRoot 'desktop-life-progress.cs'))) {throw 'FAIL Q01: progress domain contract is not implemented (fixture root validated)'}
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-life-progress.cs'),(Join-Path $PSScriptRoot 'desktop-life-progress.fixture.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
[IrisDesktop.ProgressFixture]::ScriptPath=$PSCommandPath
[IrisDesktop.ProgressFixture]::OnlyCase=$CaseID
if($Mode -eq 'worker') {[IrisDesktop.ProgressFixture]::Worker($taskRoot,$WorkerGoal); exit}
if($Mode -eq 'vector') {[IrisDesktop.ProgressFixture]::Vector($taskRoot); exit}
[IrisDesktop.ProgressFixture]::Run($taskRoot,$Mode)
