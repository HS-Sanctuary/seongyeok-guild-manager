$ErrorActionPreference='Stop'
$goalManagementBase=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/goal-management-native'))
$goalManagementRoot=Join-Path $goalManagementBase ([guid]::NewGuid().ToString('N'))
$goalManagementCursor=$goalManagementRoot
while($goalManagementCursor){if((Test-Path -LiteralPath $goalManagementCursor)-and((Get-Item -LiteralPath $goalManagementCursor -Force).Attributes-band[IO.FileAttributes]::ReparsePoint)){throw 'Synthetic root cannot cross reparse point'};$goalManagementCursor=[IO.Path]::GetDirectoryName($goalManagementCursor)}
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-life-progress.cs'),(Join-Path $PSScriptRoot 'desktop-life-goal-management.fixture.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
[IrisDesktop.GoalManagementFixture]::Run($goalManagementRoot)
