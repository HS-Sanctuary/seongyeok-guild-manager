$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
$sdk=Join-Path $PSScriptRoot 'vendor/webview2/1.0.4258.31'
$core=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll';$forms=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'
[void][Reflection.Assembly]::LoadFrom($core);[void][Reflection.Assembly]::LoadFrom($forms)
$sources=@('overlay-native.cs','desktop-overlay.cs','desktop-addon-policy.cs','desktop-addon.cs','desktop-host.cs','desktop-store.cs','desktop-bridge.cs','desktop-webview.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
Add-Type -Path $sources -ReferencedAssemblies @($core,$forms,'System.Windows.Forms','System.Drawing','System.Core','System.Security','System.Web.Extensions')
$profile=Join-Path ([IO.Path]::GetTempPath()) ('iris-startup-close-'+[guid]::NewGuid().ToString('N'))
$store=New-Object IrisDesktop.DesktopStore((Join-Path $profile 'synthetic-store'),'production')
$window=New-Object IrisDesktop.DesktopWebView($false,$profile,$store)
try{
 $window.EnableDesktopLifecycle();$null=$window.Handle
 if(!$window.AbortUninitializedStartup() -or !$window.IsDisposed){throw 'Failed startup must close immediately, not wait for protected-close dialogue'}
}finally{$window.Dispose()}
$ready=New-Object IrisDesktop.DesktopWebView($false,$profile,$store)
try{
 $ready.EnableDesktopLifecycle();$null=$ready.Handle
 $field=$ready.GetType().GetField('documentReady',[Reflection.BindingFlags]'Instance,NonPublic');$field.SetValue($ready,$true)
 if($ready.AbortUninitializedStartup() -or $ready.IsDisposed){throw 'Initialized session must never bypass protected close'}
}finally{$ready.Dispose()}
Write-Output 'PASS startup failure immediate close and ready-session protection; no network/game reads'
