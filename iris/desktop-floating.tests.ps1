$ErrorActionPreference='Stop'
$policy=Join-Path $PSScriptRoot 'desktop-floating.cs'
$store=Join-Path $PSScriptRoot 'desktop-floating-store.cs'
if(!(Test-Path $policy) -or !(Test-Path $store)){throw 'Floating layout/preferences policy is not implemented'}
Add-Type -TypeDefinition ((Get-Content $policy -Raw -Encoding UTF8)+(Get-Content $store -Raw -Encoding UTF8)+(Get-Content (Join-Path $PSScriptRoot 'desktop-floating.fixture.cs') -Raw -Encoding UTF8)) -ReferencedAssemblies @('System.Drawing','System.Core','System.Web.Extensions')
$fixtureRoot=Join-Path ([IO.Path]::GetTempPath()) ('iris-floating-fixture-'+[Guid]::NewGuid().ToString('N'))
try{[IrisDesktop.FloatingFixture]::Run($fixtureRoot)}finally{if(Test-Path -LiteralPath $fixtureRoot){Remove-Item -LiteralPath $fixtureRoot -Recurse -Force}}
Write-Output 'Floating: independent bounds / DPI corners / hit regions / corrupt preservation / configurable shortcut and appearance PASS'
