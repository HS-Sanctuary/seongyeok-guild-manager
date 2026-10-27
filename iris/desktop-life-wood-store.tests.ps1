param([Parameter(Mandatory=$true)][string]$Root)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding=New-Object System.Text.UTF8Encoding($false)
$sources=@('desktop-life-progress.cs','desktop-life-journal.cs','desktop-life-wood-store.cs','desktop-life-wood-connection.cs','desktop-life-wood-store.fixture.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
Add-Type -Path $sources -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
[IrisDesktop.WoodStoreFixture]::Serve($Root)
