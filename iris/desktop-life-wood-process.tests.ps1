param([Parameter(Mandatory=$true)][string]$Root)
$ErrorActionPreference='Stop'
$base=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/wood-production'))
$Root=[IO.Path]::GetFullPath($Root)
if([IO.Path]::GetDirectoryName($Root)-ne$base-or[IO.Path]::GetFileName($Root)-notmatch'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'){throw 'Owned synthetic root required'}
foreach($target in @($Root,(Join-Path $Root 'native-process-lease/development'))){$cursor=$target;while($cursor){if((Test-Path -LiteralPath $cursor)-and((Get-Item -LiteralPath $cursor -Force).Attributes-band[IO.FileAttributes]::ReparsePoint)){throw 'Synthetic root cannot cross reparse point'};$cursor=[IO.Path]::GetDirectoryName($cursor)}}
if(-not(Test-Path -LiteralPath (Join-Path $Root 'world.json'))){throw 'Owned synthetic world required'}
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-life-journal.cs'),(Join-Path $PSScriptRoot 'desktop-life-wood-process.fixture.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
[IrisDesktop.WoodProcessLeaseFixture]::Hold($Root)
