param([string]$PackagedExe)
$ErrorActionPreference='Stop'
$repo=Split-Path $PSScriptRoot -Parent
$csc=Join-Path ([Environment]::GetFolderPath('Windows')) 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$probeRoot=Join-Path $repo 'build/iris-update-network-test'
New-Item -ItemType Directory -Path $probeRoot -Force | Out-Null
$probe=Join-Path $probeRoot 'update-network-probe.exe'
$sources=@('iris/desktop-update-policy.cs','iris/desktop-update-install.cs','iris/desktop-update.cs','tests/iris-update-network.fixture.cs') | ForEach-Object { Join-Path $repo $_ }
& $csc /nologo /target:exe /platform:x64 ('/out:'+$probe) /reference:System.Core.dll /reference:System.Web.Extensions.dll /reference:System.Security.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll $sources
if($LASTEXITCODE -ne 0){throw 'Native network probe compilation failed'}
if($PackagedExe){& $probe ([IO.Path]::GetFullPath($PackagedExe))}else{& $probe}
if($LASTEXITCODE -ne 0){throw 'Actual native update HTTPS check failed'}
