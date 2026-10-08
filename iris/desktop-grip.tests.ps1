param()
# Hidden construction only; tracking explicitly disposed before creating a handle.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
$sdk=Join-Path $PSScriptRoot 'vendor/webview2/1.0.4258.31'
$core=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'
$forms=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'
[void][Reflection.Assembly]::LoadFrom($core)
[void][Reflection.Assembly]::LoadFrom($forms)
$sources=@('overlay-native.cs','desktop-overlay.cs','desktop-addon-policy.cs','desktop-addon.cs','desktop-host.cs','desktop-store.cs','desktop-bridge.cs','desktop-webview.cs'|ForEach-Object{Get-Content -LiteralPath (Join-Path $PSScriptRoot $_) -Raw -Encoding UTF8})
$sources+=@'
using System;using System.Drawing;using System.Reflection;using System.Windows.Forms;
namespace IrisDesktop {
 public static class DesktopGripFixture {
  static int passed;static void Check(bool ok,string message){if(!ok)throw new Exception(message);passed++;}
  public static int Run(string profile){
   using(var window=new DesktopWebView(true,profile)){
    var property=typeof(DesktopWebView).GetProperty("Addon");Check(property!=null,"Missing owned tracker");
    ((IDisposable)property.GetValue(window,null)).Dispose();window.Overlay.Dispose();
    Check(!window.TopMost,"Addon remains globally topmost");
    Check(window.Controls.Count==1&&window.Browser.Dock==DockStyle.Fill,"Duplicate native chrome instead of web title");
    Check(window.Browser.CoreWebView2==null,"Construction opens real browser");
    window.CreateControl();
    var fit=typeof(DesktopWebView).GetMethod("FitContentHeight",BindingFlags.Instance|BindingFlags.NonPublic);
    fit.Invoke(window,new object[]{340});window.PerformLayout();Check(window.Height==340&&window.Browser.Height==340,"Native chrome crops content");
    fit.Invoke(window,new object[]{120});window.PerformLayout();Check(window.Height==120,"Minimum content does not fit");
    Check(!window.Overlay.SetClickThrough(true),"Addon enables click through");Check(!window.Overlay.SetOpacityPercent(50),"Addon opacity changes");
    Check(!window.Overlay.ShortcutsAvailable&&!window.Overlay.ClickThrough&&window.Overlay.OpacityPercent==100,"Addon keeps overlay hotkey");
    Check(!window.Visible&&window.Browser.CoreWebView2==null,"Fixture opens user session");
   }return passed;
  }
 }
}
'@
$compiler=New-Object Microsoft.CSharp.CSharpCodeProvider
$parameters=New-Object System.CodeDom.Compiler.CompilerParameters
$parameters.GenerateInMemory=$true
$parameters.ReferencedAssemblies.AddRange([string[]]@($core,$forms,'System.dll','System.Windows.Forms.dll','System.Drawing.dll','System.Core.dll','System.Security.dll','System.Web.Extensions.dll'))
try{
 $result=$compiler.CompileAssemblyFromSource($parameters,[string[]]$sources)
 if($result.Errors.HasErrors){throw (($result.Errors|Where-Object{!$_.IsWarning}|ForEach-Object{$_.ToString()}) -join [Environment]::NewLine)}
 $profile=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-08-iris-addon-bar/unused-profile-'+[Guid]::NewGuid().ToString('N'))
 $count=[IrisDesktop.DesktopGripFixture]::Run($profile)
 if(Test-Path $profile){throw 'Unexpected browser profile'}
 Write-Output "Native addon chrome: $count passed; no browser session or game control"
}finally{$compiler.Dispose()}
