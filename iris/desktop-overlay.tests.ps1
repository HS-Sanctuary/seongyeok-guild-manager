param([switch]$SkipClick)
$ErrorActionPreference='Stop'
if(!(Test-Path (Join-Path $PSScriptRoot 'desktop-overlay.cs'))){throw 'Missing native overlay coordinator'}
Add-Type -AssemblyName System.Windows.Forms
$sdk=Join-Path $PSScriptRoot 'vendor/webview2/1.0.4258.31'
$core=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'
$forms=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'
[void][Reflection.Assembly]::LoadFrom($core)
[void][Reflection.Assembly]::LoadFrom($forms)
Add-Type -Path @('overlay-native.cs','desktop-overlay.cs','desktop-overlay.fixture.cs'|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @($core,$forms,'System.Windows.Forms','System.Drawing','System.Core')
$profile=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-06-iris-compact-overlay/overlay-profiles/'+[Guid]::NewGuid().ToString('N'))
[IrisDesktop.OverlayFixture]::Run((Join-Path $sdk 'runtimes/win-x64/native/WebView2Loader.dll'),$profile,[bool]$SkipClick)
Write-Output 'Native overlay: child WebView click-through, hotkey failure/recreation, recovery, opacity, bounds PASS'
