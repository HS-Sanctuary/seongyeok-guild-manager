$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot 'desktop-presentation.cs'
if (!(Test-Path $source)) { throw 'Compact presentation is missing; game-height docking cannot retain a small bar' }
Add-Type -TypeDefinition ((Get-Content $source -Raw -Encoding UTF8)+@'
namespace IrisDesktop { using System;using System.Drawing;
public static class PresentationFixture {
 static void Check(bool ok,string msg){if(!ok)throw new Exception(msg);}
 public static void Run(){
  var s=new DesktopPresentationState();s.ObserveFullscreen(true);Check(s.Compact&&s.Automatic,"Fullscreen did not compact");
  s.ObserveFullscreen(null);Check(s.Compact,"Unknown frame expanded");s.Toggle();Check(!s.Compact&&!s.Automatic,"Explicit override failed");s.ObserveFullscreen(true);Check(!s.Compact,"Repeated observation overwrote override");s.ObserveFullscreen(false);Check(!s.Compact,"Windowed return failed");
  s.Toggle();s.ObserveFullscreen(true);s.ObserveFullscreen(false);Check(s.Compact,"Manual compact was lost on exit");s.SetPanelOpen(true);Check(s.PanelOpen&&s.Compact,"Panel lost compact choice");s.SetPanelOpen(false);Check(!s.PanelOpen&&s.Compact,"Panel close expanded permanently");
  var a=new DesktopPresentationState();a.ObserveFullscreen(true);a.RecordManualMove();Check(!a.AnchorGameCorner,"Manual move overwritten");a.ObserveFullscreen(false);Check(!a.Compact,"Automatic return failed");
  using(var r=DesktopRoundedWindow.RegionFor(new Size(420,640),96)){Check(!r.IsVisible(0,0),"Square corner visible");Check(r.IsVisible(210,2)&&r.IsVisible(2,320),"Title/resize middle removed");}
  using(var r=DesktopRoundedWindow.RegionFor(new Size(720,180),144)){Check(!r.IsVisible(0,0)&&r.IsVisible(2,90),"DPI rounded edge failed");}
 }
}
}
'@) -ReferencedAssemblies @('System.Drawing','System.Core','System.Web.Extensions')
[IrisDesktop.PresentationFixture]::Run()
Write-Output 'Compact presentation: auto/manual/null/repeat/override/temporary panel/rounded edge PASS'
