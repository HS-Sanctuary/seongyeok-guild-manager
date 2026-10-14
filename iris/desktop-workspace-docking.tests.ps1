$ErrorActionPreference='Stop'
Add-Type -Path @('desktop-addon-policy.cs','desktop-addon.cs','desktop-workspace-docking.fixture.cs'|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @('System.Core','System.Drawing','System.Windows.Forms','System.Web.Extensions')
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot ('../.superpowers/sdd/2026-10-14-ergon-command-workspace/dock-'+[guid]::NewGuid().ToString('N'))))
[IrisDesktop.WorkspaceDockingFixture]::Run($taskRoot)
Write-Output 'PASS real tracker placement: wide/windowed tick, compact/windowed docking, fullscreen, unchanged preference; synthetic frames, no visible windows'
