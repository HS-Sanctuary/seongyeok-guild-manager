param()
$ErrorActionPreference='Stop'
$policy=Join-Path $PSScriptRoot 'desktop-addon-policy.cs'
$adapter=Join-Path $PSScriptRoot 'desktop-addon.cs'
if(!(Test-Path $policy)){throw 'Missing independent game window policy'}
Add-Type -AssemblyName System.Windows.Forms
$sources=@((Get-Content -LiteralPath $policy -Raw -Encoding UTF8),('using Process = IrisDesktop.RestrictedProcessFixture;'+[Environment]::NewLine+(Get-Content -LiteralPath $adapter -Raw -Encoding UTF8)))
$sources+=@'
using System;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;
namespace IrisDesktop {
 // Only the external OS process API is substituted; adapter liveness logic stays real.
 public sealed class RestrictedProcessFixture : IDisposable {
  public static bool Exists=true, QueryDenied=false;
  public static long StartedTicks=100;
  public static RestrictedProcessFixture GetProcessById(int pid){if(!Exists||pid!=10)throw new ArgumentException("Process missing");return new RestrictedProcessFixture();}
  public string ProcessName {get{return "MabinogiMobile";}}
  public DateTime StartTime {get{if(QueryDenied)throw new System.ComponentModel.Win32Exception(5);return new DateTime(StartedTicks,DateTimeKind.Utc);}}
  public bool HasExited {get{throw new System.ComponentModel.Win32Exception(5);}}
  public void Dispose(){}
 }
 public static class AddonFixture {
  static int passed;
  static void Check(bool condition,string why){if(!condition)throw new Exception(why);passed++;}
  static GameWindowObservation Game(bool? alive,bool minimized,int pid,long started){return new GameWindowObservation {ProcessId=pid,StartedAtTicks=started,Alive=alive,Minimized=minimized,Handle=new IntPtr(3),Frame=new Rectangle(100,100,500,600)};}
  [DllImport("user32.dll")]static extern IntPtr GetWindowLongPtr(IntPtr handle,int index);
  [DllImport("user32.dll")]static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")]static extern IntPtr GetShellWindow();
  [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern IntPtr FindWindow(string name,string title);
  [DllImport("user32.dll")]static extern IntPtr GetWindow(IntPtr handle,uint command);
  [DllImport("user32.dll")]static extern bool SetWindowPos(IntPtr handle,IntPtr after,int x,int y,int width,int height,uint flags);
  static bool Raised(Form form){return (GetWindowLongPtr(form.Handle,-20).ToInt64()&8)!=0;}
  static bool Above(IntPtr first,IntPtr second){for(var h=GetWindow(first,2);h!=IntPtr.Zero;h=GetWindow(h,2))if(h==second)return true;return false;}
  static void OtherWindowOrderChecks(string root){
   using(var game=new NonActivatingLayerFixture())using(var peer=new NonActivatingLayerFixture())using(var addon=new NonActivatingLayerFixture()){
    game.Show();peer.Show();addon.Show();var foreground=GetForegroundWindow();var bounds=addon.Bounds;
    using(var tracker=new DesktopGameWindowTracker(addon,"development",Path.Combine(root,"real-order"),()=>false)){
     var type=tracker.GetType();var binding=System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance;
     var observation=Game(true,false,10,100);observation.Handle=game.Handle;type.GetField("tracked",binding).SetValue(tracker,observation);
     var apply=type.GetMethod("ApplySameLayer",binding);
     apply.Invoke(tracker,new object[]{game.Handle});Check(Raised(addon),"Game foreground raises addon before other-app switch");
     SetWindowPos(peer.Handle,IntPtr.Zero,0,0,0,0,0x0213);
     apply.Invoke(tracker,new object[]{peer.Handle});
     Check(Above(peer.Handle,addon.Handle),"Other app must actually occlude addon; clearing topmost alone leaves it in front");
     Check(!Raised(addon),"Yielded addon is non-topmost");
     Check(Above(peer.Handle,game.Handle),"Yielding must not raise the game over the clicked app");
     Check(addon.Bounds==bounds&&GetForegroundWindow()==foreground,"Yield changes only own z-order, never geometry or input focus");
     apply.Invoke(tracker,new object[]{game.Handle});Check(Raised(addon),"Game return restores addon layer");
     var desktop=GetShellWindow();Check(desktop!=IntPtr.Zero,"Interactive desktop shell is available for read-only anchor check");
     apply.Invoke(tracker,new object[]{desktop});Check(Raised(addon),"Desktop click retains addon above topmost wallpaper hosts");
     Check(Above(addon.Handle,desktop),"Desktop click must not bury addon behind desktop wallpaper");
     Check(addon.Visible&&addon.WindowState==FormWindowState.Normal,"Desktop click is not a minimize or hide action");
     var worker=FindWindow("WorkerW",null);
     if(worker!=IntPtr.Zero){apply.Invoke(tracker,new object[]{game.Handle});var aboveBefore=Above(addon.Handle,worker);apply.Invoke(tracker,new object[]{worker});Check(Raised(addon)&&Above(addon.Handle,worker)==aboveBefore&&addon.Visible,"Desktop host preserves the game-scoped layer, including special topmost WorkerW outside the ordinary z-order chain");}
     apply.Invoke(tracker,new object[]{game.Handle});
     apply.Invoke(tracker,new object[]{peer.Handle});Check(Above(peer.Handle,addon.Handle),"Repeated app switches also yield");
     SetWindowPos(addon.Handle,IntPtr.Zero,0,0,0,0,0x0213);
     apply.Invoke(tracker,new object[]{peer.Handle});Check(Above(peer.Handle,addon.Handle),"An already non-topmost addon must still yield if another native action raised it");
     type.GetField("preferences",binding).SetValue(tracker,new AddonWindowPreferences {SameLayer=false});
     SetWindowPos(addon.Handle,IntPtr.Zero,0,0,0,0,0x0213);
     apply.Invoke(tracker,new object[]{peer.Handle});Check(Above(addon.Handle,peer.Handle),"Disabled same-layer must not force independent addon behind another window");
    }
   }
  }
  static void TaskbarChecks(){
   var method=typeof(AddonWindowPolicy).GetMethod("YieldToTaskbar");
   Check(method!=null,"Taskbar geometry must distinguish edge hover from its hidden strip");
   var monitor=new Rectangle(0,0,1000,800);var addon=new Rectangle(0,0,320,800);
   Func<Rectangle,Point,uint,bool,bool> yield=(bar,cursor,edge,autoHide)=>(bool)method.Invoke(null,new object[]{monitor,bar,cursor,edge,autoHide,addon});
   Check(!yield(new Rectangle(0,798,1000,48),new Point(500,400),3,true),"Hidden bottom strip does not disable normal game layer");
   Check(yield(new Rectangle(0,798,1000,48),new Point(500,799),3,true),"Bottom edge hover yields before taskbar animation");
   Check(yield(new Rectangle(0,752,1000,48),new Point(500,400),3,true),"Revealed bar continues yielding after pointer leaves");
   Check(yield(new Rectangle(-46,0,48,800),new Point(1,300),0,true),"Left auto-hide edge yields");
   Check(yield(new Rectangle(0,-46,1000,48),new Point(500,1),1,true),"Top auto-hide edge yields");
   Check((bool)method.Invoke(null,new object[]{monitor,new Rectangle(998,0,48,800),new Point(999,300),(uint)2,true,new Rectangle(680,0,320,800)}),"Right auto-hide edge yields when addon occupies that edge");
   Check(!yield(new Rectangle(0,798,1000,48),new Point(500,800),3,true),"Pointer on another monitor is not this edge hover");
   Check(yield(new Rectangle(0,752,1000,48),new Point(500,400),3,false),"Fixed overlapping taskbar has priority");
   Check(!(bool)method.Invoke(null,new object[]{monitor,new Rectangle(0,752,1000,48),new Point(500,400),(uint)3,false,new Rectangle(0,0,320,740)}),"Fixed taskbar outside addon does not disable normal layer");
   Check(!(bool)method.Invoke(null,new object[]{new Rectangle(0,0,2560,1440),new Rectangle(0,1392,2560,48),new Point(1282,821),(uint)3,true,new Rectangle(193,1290,57,58)}),"Visible auto-hide taskbar must not bury a non-overlapping floating logo when game is clicked");
   Check((bool)method.Invoke(null,new object[]{new Rectangle(-1000,-800,1000,800),new Rectangle(-1000,-2,1000,48),new Point(-400,-1),(uint)3,true,new Rectangle(-1000,-800,320,800)}),"Negative monitor edge coordinates remain valid");
   Check(!(bool)method.Invoke(null,new object[]{monitor,new Rectangle(0,752,1000,48),new Point(500,799),(uint)3,true,new Rectangle(1000,0,320,800)}),"Non-overlapping monitor does not suppress addon");
  }
  static void LayerChecks(string root){
   using(var form=new NonActivatingLayerFixture()){
    form.Show();var originalForeground=GetForegroundWindow();
    using(var tracker=new DesktopGameWindowTracker(form,"development",Path.Combine(root,"layer"))){
     var type=tracker.GetType();var binding=System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance;
     var observation=Game(true,false,10,100);type.GetField("tracked",binding).SetValue(tracker,observation);
     var apply=type.GetMethod("ApplySameLayer",binding);
     // Old implementation has no persistent activation-scoped layer application.
     if(apply!=null)apply.Invoke(tracker,new object[]{observation.Handle});
     Check(Raised(form),"Game foreground must actually raise the native addon, not just report a successful HWND_TOP call");
     apply.Invoke(tracker,new object[]{new IntPtr(4)});Check(!Raised(form),"Other apps must immediately release addon topmost state");
     apply.Invoke(tracker,new object[]{form.Handle});Check(Raised(form),"Interacting with the addon preserves its visible layer");
     bool taskbarNeedsFront=true;
     var taskbarProbe=type.GetField("taskbarNeedsFront",binding);
     if(taskbarProbe!=null)taskbarProbe.SetValue(tracker,new Func<bool>(()=>taskbarNeedsFront));
     apply.Invoke(tracker,new object[]{observation.Handle});Check(!Raised(form),"Hover-revealed taskbar must release addon topmost even while game remains foreground");
     taskbarNeedsFront=false;apply.Invoke(tracker,new object[]{observation.Handle});Check(Raised(form),"Hidden taskbar restores game-scoped addon layer");
     taskbarNeedsFront=true;apply.Invoke(tracker,new object[]{form.Handle});Check(!Raised(form),"Taskbar has priority even while addon is foreground");
     taskbarNeedsFront=false;
     type.GetField("preferences",binding).SetValue(tracker,new AddonWindowPreferences {SameLayer=false});
     apply.Invoke(tracker,new object[]{observation.Handle});Check(!Raised(form),"Disabling same layer releases the native state");
     type.GetField("preferences",binding).SetValue(tracker,new AddonWindowPreferences());
     apply.Invoke(tracker,new object[]{observation.Handle});form.Hide();apply.Invoke(tracker,new object[]{observation.Handle});Check(!Raised(form),"Hidden addon cannot retain topmost state");form.Show();
     observation.Alive=null;apply.Invoke(tracker,new object[]{observation.Handle});Check(!Raised(form),"Unknown game liveness must not retain topmost state");observation.Alive=true;
     observation.Minimized=true;apply.Invoke(tracker,new object[]{observation.Handle});Check(!Raised(form),"Minimized game releases addon topmost state");observation.Minimized=false;
     tracker.SetDecisionOpen(true);apply.Invoke(tracker,new object[]{observation.Handle});Check(!Raised(form),"Exit decision does not keep an addon above other windows");tracker.SetDecisionOpen(false);
     apply.Invoke(tracker,new object[]{observation.Handle});tracker.Dispose();Check(!Raised(form),"Disposal releases native topmost state");
     Check(GetForegroundWindow()==originalForeground,"Layer updates never steal focus from another app");
    }
   }
  }
  public static int Run(string root){
   var alive=typeof(DesktopGameWindowTracker).GetMethod("Alive",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Static);
   var observed=Game(true,false,10,100);
   Check(Equals(alive.Invoke(null,new object[]{observed}),true),"Same live process remains tracked when higher-access HasExited is denied");
   RestrictedProcessFixture.Exists=false;Check(Equals(alive.Invoke(null,new object[]{observed}),false),"Missing PID confirms exit");RestrictedProcessFixture.Exists=true;
   RestrictedProcessFixture.QueryDenied=true;Check(alive.Invoke(null,new object[]{observed})==null,"Limited-query denial is unknown, not an exit");RestrictedProcessFixture.QueryDenied=false;
   RestrictedProcessFixture.StartedTicks=200;Check(Equals(alive.Invoke(null,new object[]{observed}),false),"Reused PID is not the original process lifetime");RestrictedProcessFixture.StartedTicks=100;
   TaskbarChecks();LayerChecks(root);OtherWindowOrderChecks(root);
   var work=new Rectangle(0,0,1600,900);var game=new Rectangle(400,100,500,600);
   var right=AddonWindowPolicy.Place(game,work,new Size(420,640),"right");Check(right.Attached&&right.ActualSide=="right"&&right.Bounds==new Rectangle(900,100,420,600),"Right docking bounds");
   var left=AddonWindowPolicy.Place(game,work,new Size(320,640),"left");Check(left.Attached&&left.Bounds==new Rectangle(80,100,320,600),"Left docking bounds");
   var fallback=AddonWindowPolicy.Place(new Rectangle(1050,0,550,800),work,new Size(420,640),"right");Check(fallback.Attached&&fallback.ActualSide=="left"&&fallback.Bounds.X==630,"Other side fallback");
   Check(!AddonWindowPolicy.Place(new Rectangle(0,0,1600,900),work,new Size(420,640),"right").Attached,"No room must not overlap game");
   Check(!AddonWindowPolicy.Place(game,work,new Size(420,640),"off").Attached,"Off must not dock");
   var wide=AddonWindowPolicy.Place(game,new Rectangle(0,0,2400,1440),new Size(600,640),"right");Check(wide.Attached&&wide.Bounds.Width==600,"Docking must preserve user-selected width above old 480 cap");
   var negative=AddonWindowPolicy.Place(new Rectangle(-1700,20,700,1000),new Rectangle(-1920,0,1920,900),new Size(420,640),"right");Check(negative.Bounds==new Rectangle(-1000,20,420,880),"Partially clipped game must keep its visible top, not pull addon to monitor top");
   var below=AddonWindowPolicy.Place(new Rectangle(40,90,488,1080),new Rectangle(0,0,1920,1080),new Size(360,640),"right");Check(below.Bounds==new Rectangle(528,90,360,990),"Game extends below screen: addon must align to visible game frame");
   var compactLeft=AddonWindowPolicy.Place(new Rectangle(573,127,490,950),new Rectangle(0,0,1920,1080),new Size(360,270),"left",false);Check(compactLeft.Attached&&compactLeft.Bounds==new Rectangle(213,127,360,270),"Manual compact must reattach left without inheriting game height");
   using(var addon=new NonActivatingLayerFixture())using(var tracker=new DesktopGameWindowTracker(addon,"development",Path.Combine(root,"offscreen"),()=>false)){
    addon.Show();var binding=System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance;var screenObservation=Game(true,false,10,100);typeof(DesktopGameWindowTracker).GetField("tracked",binding).SetValue(tracker,screenObservation);
    var follow=typeof(DesktopGameWindowTracker).GetMethod("FollowGameVisibility",binding);Check(follow!=null,"Game fully outside all monitors must hide the attached addon");
    screenObservation.Frame=new Rectangle(100000,100000,500,600);Check((bool)follow.Invoke(tracker,null)&&!addon.Visible,"Offscreen game leaves no floating addon");
    screenObservation.Frame=null;follow.Invoke(tracker,null);Check(!addon.Visible,"Unknown frame does not falsely restore hidden addon");
    screenObservation.Frame=Screen.PrimaryScreen.WorkingArea;follow.Invoke(tracker,null);Check(addon.Visible,"Game returns to a monitor: addon restores without activation");
    screenObservation.Frame=new Rectangle(100000,100000,500,600);follow.Invoke(tracker,null);tracker.RecordManualVisibility(true);screenObservation.Frame=Screen.PrimaryScreen.WorkingArea;follow.Invoke(tracker,null);Check(!addon.Visible,"User-hidden addon must not be reopened by screen return");
   }
   var session=new GameWindowSession();Check(!session.Observe(Game(true,false,10,100),false,false).RequestClose,"Initial discovery cannot close");
   Check(session.Observe(Game(true,true,10,100),false,false).Minimize,"Game minimize propagates");Check(!session.Observe(Game(true,true,10,100),false,false).Minimize,"Minimize event not repeated");Check(session.Observe(Game(true,false,10,100),false,false).Restore,"Game-origin minimized addon restores");
   session.Observe(Game(true,true,10,100),true,false);Check(!session.Observe(Game(true,false,10,100),true,false).Restore,"Manual hidden addon stays hidden");
   var noFrameSession=new GameWindowSession();var iconified=Game(true,true,10,100);iconified.Frame=null;
   Check(noFrameSession.Observe(iconified,false,false).Minimize,"Minimized game must hide addon even when DWM frame is unavailable");
   Check(noFrameSession.Observe(Game(true,false,10,100),false,false).Restore,"Missing minimized frame must not lose restore ownership");
   var restoredSession=new GameWindowSession();restoredSession.Observe(Game(true,true,10,100),false,false);restoredSession.ManualVisibility();
   Check(restoredSession.Observe(Game(true,true,10,100),false,false).Minimize,"Opening addon while game is still minimized must reapply game minimize");
   var missing=Game(null,false,10,100);missing.Handle=IntPtr.Zero;missing.Frame=null;Check(!session.Observe(missing,false,false).RequestClose,"Unknown liveness is not exit");
   missing.Alive=true;Check(!session.Observe(missing,false,false).RequestClose,"Handle replacement is not exit");
   Check(session.Observe(Game(false,false,10,100),false,false).RequestClose,"Confirmed process exit asks once");Check(!session.Observe(Game(false,false,10,100),false,false).RequestClose,"No repeated exit prompt");
   Check(!session.Observe(Game(true,true,10,200),false,true).Minimize,"Decision prevents new-session minimize");Check(!session.Observe(Game(true,false,10,200),false,true).Restore,"Decision prevents new-session restore");
   var prefs=new AddonPreferencesFile(root);bool valid;var initial=prefs.Load(out valid);Check(valid&&initial.DockSide=="right"&&initial.SameLayer,"Default prefs");
   var loadWidth=typeof(AddonPreferencesFile).GetMethod("LoadWidth");var saveWidth=typeof(AddonPreferencesFile).GetMethod("SaveWidth");Check(loadWidth!=null&&saveWidth!=null,"User width needs independent persistence");
   Check((bool)saveWidth.Invoke(prefs,new object[]{600}),"Valid manual width saves");object[] widthArgs={false};Check((int)loadWidth.Invoke(prefs,widthArgs)==600&&(bool)widthArgs[0],"Manual width survives reload");
   Check(!(bool)saveWidth.Invoke(prefs,new object[]{200}),"Width below readable minimum rejected");Check(!(bool)saveWidth.Invoke(prefs,new object[]{10000}),"Extreme width rejected");
   Check(prefs.Save(new AddonWindowPreferences {DockSide="left",SameLayer=false}),"Save prefs");var restored=prefs.Load(out valid);Check(valid&&restored.DockSide=="left"&&!restored.SameLayer,"Reload prefs");
   Check(!prefs.Save(new AddonWindowPreferences {DockSide="arbitrary",SameLayer=true}),"Reject invalid side");
   File.WriteAllText(Path.Combine(root,"window-preferences-v1.json"),"{\"version\":1,\"dockSide\":\"right\",\"sameLayer\":true,\"handle\":42}");prefs.Load(out valid);Check(!valid,"Unknown prefs keys refused");
   File.WriteAllText(Path.Combine(root,"window-preferences-v1.json"),new string('x',4097));prefs.Load(out valid);Check(!valid,"Oversized prefs refused");
   return passed;
  }
 }
 public sealed class NonActivatingLayerFixture:Form {
  protected override bool ShowWithoutActivation {get{return true;}}
  public NonActivatingLayerFixture(){ShowInTaskbar=false;StartPosition=FormStartPosition.Manual;Location=new Point(-30000,-30000);Size=new Size(100,100);}
 }
}
'@
$compiler=New-Object Microsoft.CSharp.CSharpCodeProvider
$parameters=New-Object System.CodeDom.Compiler.CompilerParameters
$parameters.GenerateInMemory=$true
$parameters.ReferencedAssemblies.AddRange([string[]]@('System.dll','System.Core.dll','System.Drawing.dll','System.Windows.Forms.dll','System.Web.Extensions.dll'))
try{
 $result=$compiler.CompileAssemblyFromSource($parameters,[string[]]$sources)
 if($result.Errors.HasErrors){throw (($result.Errors|Where-Object{!$_.IsWarning}|ForEach-Object{$_.ToString()}) -join [Environment]::NewLine)}
 $root=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-08-iris-addon-bar/prefs-'+[Guid]::NewGuid().ToString('N'))
 $count=[IrisDesktop.AddonFixture]::Run($root)
 Write-Output "Addon policy/preferences: $count passed; synthetic windows, no game control or browser session"
}finally{$compiler.Dispose()}
