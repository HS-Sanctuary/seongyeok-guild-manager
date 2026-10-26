$ErrorActionPreference='Stop'
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
$sources=@('desktop-life-read.cs','desktop-cli-activity.cs','desktop-life-evidence.cs','desktop-life-evidence.fixture.cs','desktop-host.cs','desktop-store.cs','desktop-bridge.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
Add-Type -Path $sources -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
$result=[IrisDesktop.NativeEvidenceFixture]::Run().GetAwaiter().GetResult()
$root=Join-Path $PSScriptRoot ('../.superpowers/native-evidence/'+[guid]::NewGuid().ToString('N'))
$null=[IrisDesktop.NativeEvidenceFixture]::Bridge([IO.Path]::GetFullPath($root)).GetAwaiter().GetResult()
$result|ConvertTo-Json -Depth 25 -Compress
