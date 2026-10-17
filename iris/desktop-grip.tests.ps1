param()
# Hidden construction only; tracking explicitly disposed before creating a handle.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
$sdk=Join-Path $PSScriptRoot 'vendor/webview2/1.0.4258.31'
$core=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'
$forms=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'
[void][Reflection.Assembly]::LoadFrom($core)
[void][Reflection.Assembly]::LoadFrom($forms)
$sources=@('overlay-native.cs','desktop-overlay.cs','desktop-addon-policy.cs','desktop-addon.cs','desktop-host.cs','desktop-store.cs','desktop-bridge.cs','desktop-life-read.cs','desktop-life-journal.cs','desktop-life-policy.cs','desktop-life-cli.cs','desktop-life-executor.cs','desktop-life-automation.cs','desktop-life-reference.cs','desktop-life-reconciliation.cs','desktop-cli-activity.cs','desktop-fonts.cs','desktop-presentation.cs','desktop-floating.cs','desktop-floating-store.cs','desktop-floating-host.cs','desktop-alert-sound.cs','desktop-webview.cs'|ForEach-Object{Get-Content -LiteralPath (Join-Path $PSScriptRoot $_) -Raw -Encoding UTF8})
$sources+=@'
using System;using System.Drawing;using System.Reflection;using System.Windows.Forms;
namespace IrisDesktop {
 public static class DesktopGripFixture {
  [System.Runtime.InteropServices.DllImport("user32.dll")]static extern bool GetLayeredWindowAttributes(IntPtr h,out uint key,out byte alpha,out uint flags);
  static int passed;static void Check(bool ok,string message){if(!ok)throw new Exception(message);passed++;}
  public static int Run(string profile){
   using(var window=new DesktopWebView(true,profile)){
    var property=typeof(DesktopWebView).GetProperty("Addon");Check(property!=null,"Missing owned tracker");
    ((IDisposable)property.GetValue(window,null)).Dispose();
    Check(!window.TopMost,"Addon remains globally topmost");
    Check(window.Controls.Count==3&&window.Browser.Dock==DockStyle.Fill,"Expected web surface and two manual width edges only");
    Check(window.Browser.CoreWebView2==null,"Construction opens real browser");
    window.CreateControl();var ownedHandle=window.Handle;
    Check(window.Region!=null&&!window.Region.IsVisible(0,0)&&window.Region.IsVisible(2,window.Height/2),"Actual window corners or middle resize edge are square/clipped");
    var fit=typeof(DesktopWebView).GetMethod("FitContentHeight",BindingFlags.Instance|BindingFlags.NonPublic);
    fit.Invoke(window,new object[]{340});window.PerformLayout();Check(window.Height==640&&window.Browser.Height==640,"Independent expanded window must not resize per menu");
    fit.Invoke(window,new object[]{120});window.PerformLayout();Check(window.Height==640,"Short menu must not shrink expanded window");
    Check(!window.Overlay.SetClickThrough(true),"Addon enables click through");Check(window.Overlay.SetOpacityPercent(30)&&window.Overlay.OpacityPercent==30,"Addon must allow user opacity down to 30 percent");Check(!window.Overlay.SetOpacityPercent(29),"Opacity below 30 accepted");window.Overlay.SetOpacityPercent(100);
    Check(!window.Overlay.ShortcutsAvailable&&!window.Overlay.ClickThrough&&window.Overlay.OpacityPercent==100,"Addon keeps overlay hotkey");
    window.Presentation.Toggle();window.Overlay.SetOpacityPercent(30);uint color,flags;byte alpha;Check(GetLayeredWindowAttributes(window.Handle,out color,out alpha,out flags)&&alpha==204,"Normal appearance overwrites independent floating opacity");window.Presentation.Toggle();Check(GetLayeredWindowAttributes(window.Handle,out color,out alpha,out flags)&&alpha==76,"Returning normal loses normal opacity");window.Overlay.SetOpacityPercent(100);
    Check(!window.Visible&&window.Browser.CoreWebView2==null,"Fixture opens user session");
   }
   string widthProfile=System.IO.Path.Combine(profile+"-width","profile");
   using(var window=new DesktopWebView(true,widthProfile)){
    window.Width=600;window.Addon.RecordPreferredWidth(600);window.Addon.Dispose();window.Overlay.Dispose();window.CreateControl();
    var fit=typeof(DesktopWebView).GetMethod("FitContentHeight",BindingFlags.Instance|BindingFlags.NonPublic);fit.Invoke(window,new object[]{350});
    Check(window.Width==600,"Automatic content height must not change manual width");
    var placement=(Func<Rectangle,Rectangle,bool?,bool>)typeof(DesktopGameWindowTracker).GetField("presentationPlacement",BindingFlags.Instance|BindingFlags.NonPublic).GetValue(window.Addon);
    var normal=window.Bounds;var work=new Rectangle(0,0,1920,1080);Check(placement(work,work,true)&&window.Height<200&&window.Width<200,"Fullscreen must expose only logo and keycap, not old rectangle");
    var anchor=window.Location;placement(work,work,true);Check(window.Location==anchor,"Repeated fullscreen moved floating anchor");
    var command=typeof(DesktopWebView).GetMethod("FloatingCommand",BindingFlags.Instance|BindingFlags.NonPublic);
    command.Invoke(window,new object[]{"ergon"});int panelHeight=window.Height;var panelBounds=window.Bounds;
    fit.Invoke(window,new object[]{1800});Check(window.Bounds==panelBounds,"Legacy content-height loop changes floating geometry");
    command.Invoke(window,new object[]{"close"});Check(window.Height<200&&window.Width<200,"Closed module retains large input region");
    window.Presentation.Toggle();placement(work,work,true);Check(!window.Presentation.Compact,"Repeated fullscreen overwrites user override");
    Check(window.Bounds==DesktopWorkspaceLayout.Restore(normal,Screen.FromRectangle(normal).WorkingArea),"Floating mode overwrites normal bounds");
    placement(new Rectangle(0,0,1280,720),work,false);Check(window.Width==600,"Windowed return loses stored width");
   }
   using(var restored=new DesktopWebView(true,widthProfile)){restored.Addon.Dispose();restored.Overlay.Dispose();Check(restored.Width==600,"Preferred width must restore on native restart");Check(restored.Browser.CoreWebView2==null,"Width restore must not open a user browser session");}
   return passed;
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
 $profile=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-17-iris-floating-hub/native-fixtures/grip-'+[Guid]::NewGuid().ToString('N')+'/WebView')
 $count=[IrisDesktop.DesktopGripFixture]::Run($profile)
 if(Test-Path $profile){throw 'Unexpected browser profile'}
 Write-Output "Native addon chrome: $count passed; no browser session or game control"
}finally{$compiler.Dispose()}
