$ErrorActionPreference = 'Stop'
$sdk = Join-Path $PSScriptRoot 'vendor/webview2/1.0.4258.31'
$hostSource = Join-Path $PSScriptRoot 'desktop-webview.cs'
if (!(Test-Path $hostSource)) { throw 'Embedded desktop host is not implemented' }
Add-Type -AssemblyName System.Windows.Forms
$core = Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'
$forms = Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'
[void][Reflection.Assembly]::LoadFrom($core)
[void][Reflection.Assembly]::LoadFrom($forms)
$references = @($core, $forms, 'System.Windows.Forms', 'System.Drawing', 'System.Core', 'System.Security', 'System.Web.Extensions')
Add-Type -Path @((Join-Path $PSScriptRoot 'overlay-native.cs'),(Join-Path $PSScriptRoot 'desktop-overlay.cs'),(Join-Path $PSScriptRoot 'desktop-addon-policy.cs'),(Join-Path $PSScriptRoot 'desktop-addon.cs'),(Join-Path $PSScriptRoot 'desktop-host.cs'), (Join-Path $PSScriptRoot 'desktop-store.cs'), (Join-Path $PSScriptRoot 'desktop-bridge.cs'), $hostSource, (Join-Path $PSScriptRoot 'desktop-webview.fixture.cs')) -ReferencedAssemblies $references
$profile = Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-08-iris-addon-bar/browser-profiles/probe-' + [Guid]::NewGuid().ToString('N'))
$loader = Join-Path $sdk 'runtimes/win-x64/native/WebView2Loader.dll'
[IrisDesktop.WebViewFixture]::Run($loader, $profile)
Write-Output 'Embedded WebView2: session persistence, HttpOnly isolation, foreign navigation and security settings PASS'
