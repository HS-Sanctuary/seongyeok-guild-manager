$ErrorActionPreference='Stop'
$policy=Join-Path $PSScriptRoot 'desktop-update-policy.cs'
if(!(Test-Path -LiteralPath $policy)){throw 'Missing updater policy: trusted release packages cannot yet be validated'}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$sources=@($policy,(Join-Path $PSScriptRoot 'desktop-update.fixture.cs'))
$install=Join-Path $PSScriptRoot 'desktop-update-install.cs'
if(Test-Path -LiteralPath $install){$sources+=$install}
Add-Type -Path $sources -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security','System.IO.Compression','System.IO.Compression.FileSystem')
[IrisDesktop.UpdateFixture]::Run()
