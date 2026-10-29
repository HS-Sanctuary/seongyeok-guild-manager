param([string]$Root='', [switch]$Reopen,[string]$RaceOperation='', [switch]$RaceCheck)
$ErrorActionPreference='Stop'
if(!$Root){$Root=Join-Path (Join-Path $PSScriptRoot '../.superpowers/d2') ([guid]::NewGuid().ToString('N').Substring(0,8))}
$base=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/d2')).TrimEnd('\')+'\'
if(![IO.Path]::GetFullPath($Root).StartsWith($base,[StringComparison]::OrdinalIgnoreCase)){throw 'owned synthetic root required'}
[void][IO.Directory]::CreateDirectory($root)
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-life-progress.cs'),(Join-Path $PSScriptRoot 'desktop-life-manual-wood.fixture.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
if($Reopen){[IrisDesktop.ManualWoodFixture]::Reopen([IO.Path]::GetFullPath($Root))}elseif($RaceOperation){[IrisDesktop.ManualWoodFixture]::Race([IO.Path]::GetFullPath($Root),$RaceOperation)}elseif($RaceCheck){[IrisDesktop.ManualWoodFixture]::RaceCheck([IO.Path]::GetFullPath($Root))}else{[IrisDesktop.ManualWoodFixture]::Run([IO.Path]::GetFullPath($Root),(Join-Path $PSScriptRoot '../tests/fixtures/ergon-progress-v1-before-d2.json'));[IO.File]::WriteAllText((Join-Path $PSScriptRoot '../.superpowers/ergon-d2/last-domain-root.txt'),[IO.Path]::GetFullPath($Root))}
