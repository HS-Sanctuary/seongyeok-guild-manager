$ErrorActionPreference='Stop'
$taskAutomationSource=Join-Path $PSScriptRoot 'desktop-life-automation.cs'
if(!(Test-Path -LiteralPath $taskAutomationSource)){throw 'Native automatic separation policy is not implemented'}
$taskSources=@('desktop-life-journal.cs','desktop-life-automation.cs','desktop-life-automation.fixture.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
Add-Type -Path $taskSources -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
$taskRoot=[IO.Path]::GetFullPath((Join-Path (Join-Path $PSScriptRoot '../.superpowers') ('life-automation-'+[guid]::NewGuid().ToString('N'))))
[IrisDesktop.LifeAutomationFixture]::Run($taskRoot)
& powershell.exe -NoProfile -File (Join-Path $PSScriptRoot 'desktop-life-journal.tests.ps1')
if($LASTEXITCODE -ne 0){throw 'Journal regression failed'}
Write-Output 'PASS original-preserving automatic separation store/grants/revocation/hash/environment/backup/atomic writes/rollback; synthetic private files only'
