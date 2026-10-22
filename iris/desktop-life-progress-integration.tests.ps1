param([ValidateSet('all','report')][string]$Mode='all',[string]$Root='',[string]$CaseID='')
$ErrorActionPreference='Stop'
$taskBase=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/progress-integration-synthetic'))
if($Root -eq '') {$Root=Join-Path $taskBase ([guid]::NewGuid().ToString('N'))}
$taskRoot=[IO.Path]::GetFullPath($Root)
if(!$taskRoot.StartsWith($taskBase+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) {throw 'Synthetic root must be inside the integration test directory'}
$taskCursor=$taskRoot
while($taskCursor.Length -ge $taskBase.Length) {
    if((Test-Path -LiteralPath $taskCursor) -and ((Get-Item -LiteralPath $taskCursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {throw 'Synthetic root cannot cross a reparse point'}
    $taskCursor=[IO.Path]::GetDirectoryName($taskCursor)
}
if(!(Test-Path (Join-Path $PSScriptRoot 'desktop-life-progress-coordinator.cs'))) {throw 'FAIL A01: pre-dispatch progress coordinator is not implemented'}
[void][IO.Directory]::CreateDirectory($taskRoot)
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-life-progress.cs'),(Join-Path $PSScriptRoot 'desktop-life-progress-coordinator.cs'),(Join-Path $PSScriptRoot 'desktop-life-progress-integration.fixture.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
[IrisDesktop.ProgressIntegrationFixture]::Run($taskRoot,$Mode,$CaseID)
