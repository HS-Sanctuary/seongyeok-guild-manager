$ErrorActionPreference='Stop'
$root=Join-Path (Split-Path $PSScriptRoot) '.superpowers/astra-online'
[void](New-Item -ItemType Directory -Force $root)
$exe=Join-Path $root ('native-online-'+[guid]::NewGuid().ToString('N')+'.exe')
$compiler=Join-Path ([Environment]::GetFolderPath('Windows')) 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
& $compiler /nologo /target:exe /codepage:65001 ('/out:'+$exe) (Join-Path $PSScriptRoot 'desktop-online.cs') (Join-Path $PSScriptRoot 'desktop-online.fixture.cs')
if($LASTEXITCODE -ne 0){throw 'native online compile failed'}
& $exe
if($LASTEXITCODE -ne 0){throw 'native online synthetic failed'}
