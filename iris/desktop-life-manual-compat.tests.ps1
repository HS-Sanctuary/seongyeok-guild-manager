param([switch]$ExportGolden)
$ErrorActionPreference='Stop'
$base=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/d2'))
$root=Join-Path $base ([guid]::NewGuid().ToString('N').Substring(0,8))
$cursor=$root
while($cursor.Length -ge $base.Length){if((Test-Path -LiteralPath $cursor) -and ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Synthetic root cannot cross a reparse point'};$cursor=[IO.Path]::GetDirectoryName($cursor)}
[void][IO.Directory]::CreateDirectory($root)
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-life-progress.cs'),(Join-Path $PSScriptRoot 'desktop-life-manual-compat.fixture.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
if($ExportGolden){[IrisDesktop.ManualWoodCompatibilityFixture]::ExportGolden((Join-Path $PSScriptRoot '../tests/fixtures/ergon-progress-v1-before-d2.json'));exit}
[IrisDesktop.ManualWoodCompatibilityFixture]::Run($root)
