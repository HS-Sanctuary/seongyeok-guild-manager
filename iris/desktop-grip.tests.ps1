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
  [System.Runtime.InteropServices.DllImport("user32.dll")]static extern IntPtr GetForegroundWindow();
  [System.Runtime.InteropServices.DllImport("user32.dll")]static extern bool SetForegroundWindow(IntPtr handle);
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
    var beforeLocked=window.Bounds;bool ergonLocked=false;try{command.Invoke(window,new object[]{"ergon"});}catch(TargetInvocationException error){ergonLocked=error.InnerException is ArgumentException;}
    Check(ergonLocked&&window.Bounds==beforeLocked,"Direct native ERGON command bypasses the release lock or changes layout");
    command.Invoke(window,new object[]{"kronos"});int panelHeight=window.Height;var panelBounds=window.Bounds;
    fit.Invoke(window,new object[]{1800});Check(window.Bounds==panelBounds,"Legacy content-height loop changes floating geometry");
    command.Invoke(window,new object[]{"close"});Check(window.Height<200&&window.Width<200,"Closed module retains large input region");
    window.Presentation.Toggle();placement(work,work,true);Check(!window.Presentation.Compact,"Repeated fullscreen overwrites user override");
    Check(window.Bounds==DesktopWorkspaceLayout.Restore(normal,Screen.FromRectangle(normal).WorkingArea),"Floating mode overwrites normal bounds");
    placement(new Rectangle(0,0,1280,720),work,false);Check(window.Width==600,"Windowed return loses stored width");
   }
   using(var restored=new DesktopWebView(true,widthProfile)){restored.Addon.Dispose();restored.Overlay.Dispose();Check(restored.Width==600,"Preferred width must restore on native restart");Check(restored.Browser.CoreWebView2==null,"Width restore must not open a user browser session");}
   string compactProfile=System.IO.Path.Combine(profile+"-compact","profile");
   new DesktopPresentationState(System.IO.Path.GetDirectoryName(compactProfile)).Toggle();
   using(var restored=new DesktopWebView(true,compactProfile)){
    restored.Addon.Dispose();restored.Overlay.Dispose();restored.Show();restored.PerformLayout();
    Check(restored.Presentation.Compact,"Compact startup fixture did not restore compact state");
    foreach(Control child in restored.Controls)if(child!=restored.Browser)Check(!child.Visible,"Saved compact startup leaves a resize edge visible");
    Check(restored.Browser.Bounds==restored.ClientRectangle,"Saved compact startup shifts browser coordinates away from native geometry");
    Check(restored.Browser.CoreWebView2==null,"Compact startup fixture opened browser session");
    var stateMethod=typeof(DesktopWebView).GetMethod("FloatingState",BindingFlags.Instance|BindingFlags.NonPublic);
    var serializer=new System.Web.Script.Serialization.JavaScriptSerializer();
    var shown=serializer.Deserialize<System.Collections.Generic.Dictionary<string,object>>(serializer.Serialize(stateMethod.Invoke(restored,null)));
    Check(shown.ContainsKey("gameFocus")&&Equals(shown["gameFocus"],true),"Actual native state omits the game-focus capability; the frontend handoff stays disabled");
    Check(shown.ContainsKey("windowVisible")&&Equals(shown["windowVisible"],true),"Native visible state is not published to notice clock");
    restored.Hide();
    var hidden=serializer.Deserialize<System.Collections.Generic.Dictionary<string,object>>(serializer.Serialize(stateMethod.Invoke(restored,null)));
    Check(hidden.ContainsKey("windowVisible")&&Equals(hidden["windowVisible"],false)&&Convert.ToInt64(hidden["revision"])>Convert.ToInt64(shown["revision"]),"Hiding native window leaves stale visible state/revision");
    restored.Presentation.Toggle();restored.Show();restored.PerformLayout();
    foreach(Control child in restored.Controls)if(child!=restored.Browser)Check(child.Visible,"Returning normal fails to restore resize edge");
   }
   string gameProfile=System.IO.Path.Combine(profile+"-game","profile");
   using(var game=new Form())using(var window=new DesktopWebView(true,gameProfile)){
    var binding=BindingFlags.Instance|BindingFlags.NonPublic;
    ((Timer)typeof(DesktopGameWindowTracker).GetField("timer",binding).GetValue(window.Addon)).Stop();
    game.FormBorderStyle=FormBorderStyle.FixedSingle;game.Text="마비노기 모바일";var work=Screen.PrimaryScreen.WorkingArea;
    game.Bounds=new Rectangle(work.Left+80,work.Top+80,640,420);var gameHandle=game.Handle;
    typeof(DesktopGameWindowTracker).GetField("tracked",binding).SetValue(window.Addon,new GameWindowObservation{Alive=true,ProcessId=System.Diagnostics.Process.GetCurrentProcess().Id,StartedAtTicks=100,Handle=gameHandle,Frame=game.Bounds});
    Check(window.Addon.ClientBounds==game.RectangleToScreen(game.ClientRectangle),"Game client adapter uses a different coordinate space from the addon Form");
    var command=typeof(DesktopWebView).GetMethod("FloatingCommand",binding);
    var normal=window.Bounds;window.Show();
    var handoff=typeof(DesktopWebView).GetMethod("ReturnGameFocus",binding);
    Check(handoff!=null,"Floating mouse actions have no guarded game keyboard focus handoff");
    Check(!(bool)handoff.Invoke(window,null),"Normal sidebar must never return game focus automatically");
    var minimize=Message.Create(window.Handle,0x0112,new IntPtr(0xf020),IntPtr.Zero);
    typeof(DesktopWebView).GetMethod("WndProc",binding).Invoke(window,new object[]{minimize});
    Check(window.Presentation.Compact&&window.WindowState==FormWindowState.Normal&&window.Visible,"IRIS minimize must fold into a visible floating logo, not hide the window");
    Check(game.RectangleToScreen(game.ClientRectangle).Contains(window.Bounds),"Floating logo and shortcut must stay inside game client, not the monitor");
    var constrain=typeof(DesktopWebView).GetMethod("ConstrainFloatingMove",binding);
    Check(constrain!=null,"Missing live floating drag boundary");
    foreach(var outside in new[]{new Point(-9000,-9000),new Point(9000,9000)}){
     var clipped=(Rectangle)constrain.Invoke(window,new object[]{new Rectangle(outside,window.Size)});
     Check(game.RectangleToScreen(game.ClientRectangle).Contains(clipped),"Live drag can escape game client");
    }
    var movingMemory=System.Runtime.InteropServices.Marshal.AllocHGlobal(16);
    try{
     System.Runtime.InteropServices.Marshal.Copy(new[]{-9000,-9000,-9000+window.Width,-9000+window.Height},0,movingMemory,4);
     var moving=Message.Create(window.Handle,0x0216,IntPtr.Zero,movingMemory);
     typeof(DesktopWebView).GetMethod("WndProc",binding).Invoke(window,new object[]{moving});
     var rect=new int[4];System.Runtime.InteropServices.Marshal.Copy(movingMemory,rect,0,4);
     Check(game.RectangleToScreen(game.ClientRectangle).Contains(Rectangle.FromLTRB(rect[0],rect[1],rect[2],rect[3])),"WM_MOVING did not clamp the actual native drag rectangle");
     // WM_MOVING normally commits this RECT in the OS after WndProc returns.
     window.Bounds=Rectangle.FromLTRB(rect[0],rect[1],rect[2],rect[3]);
    }finally{System.Runtime.InteropServices.Marshal.FreeHGlobal(movingMemory);}
    var placement=(Func<Rectangle,Rectangle,bool?,bool>)typeof(DesktopGameWindowTracker).GetField("presentationPlacement",binding).GetValue(window.Addon);
    var before=window.Location;game.Location=new Point(game.Left+40,game.Top+30);placement(game.Bounds,work,false);
    Check(window.Location==new Point(before.X+40,before.Y+30),"Game movement must carry floating anchor by the same offset");
    game.Size=new Size(360,280);placement(game.Bounds,work,false);
    Check(game.RectangleToScreen(game.ClientRectangle).Contains(window.Bounds),"Shrinking game leaves floating logo outside");
    command.Invoke(window,new object[]{"kronos"});
    Check(game.RectangleToScreen(game.ClientRectangle).Contains(window.Bounds),"Floating module extends beyond game client");
    typeof(DesktopWebView).GetMethod("Decision",binding).Invoke(window,new object[]{true});
    Check(!(bool)handoff.Invoke(window,null),"Protected close must retain keyboard focus");
    typeof(DesktopWebView).GetMethod("Decision",binding).Invoke(window,new object[]{false});
    minimize=Message.Create(window.Handle,0x0112,new IntPtr(0xf020),IntPtr.Zero);
    typeof(DesktopWebView).GetMethod("WndProc",binding).Invoke(window,new object[]{minimize});
    Check(window.Width<150&&window.Height<150&&window.Visible,"Repeated minimize must close the temporary module and keep the floating logo");
    var lastGameArea=game.RectangleToScreen(game.ClientRectangle);game.Text="not the tracked game";
    var held=(Rectangle)constrain.Invoke(window,new object[]{new Rectangle(new Point(-9000,-9000),window.Size)});
    Check(lastGameArea.Contains(held),"A temporarily unavailable game handle must retain the last safe game boundary");
    game.Text="마비노기 모바일";
    game.Size=new Size(640,420);placement(game.Bounds,work,false);
    var originalLocation=window.Location;var freeTarget=game.PointToScreen(new Point(230,150));
    var freeMemory=System.Runtime.InteropServices.Marshal.AllocHGlobal(16);
    try{
     System.Runtime.InteropServices.Marshal.Copy(new[]{freeTarget.X,freeTarget.Y,freeTarget.X+window.Width,freeTarget.Y+window.Height},0,freeMemory,4);
     var freeMove=Message.Create(window.Handle,0x0216,IntPtr.Zero,freeMemory);typeof(DesktopWebView).GetMethod("WndProc",binding).Invoke(window,new object[]{freeMove});
     var freeRect=new int[4];System.Runtime.InteropServices.Marshal.Copy(freeMemory,freeRect,0,4);window.Bounds=Rectangle.FromLTRB(freeRect[0],freeRect[1],freeRect[2],freeRect[3]);
     typeof(DesktopWebView).GetMethod("ApplyFloatingLayout",binding).Invoke(window,new object[]{false});
     Check(Math.Abs(window.Left-freeTarget.X)<40&&Math.Abs(window.Left-originalLocation.X)>60,"Layout refresh during free drag snaps logo back to the old left-hand vertical line");
    }finally{System.Runtime.InteropServices.Marshal.FreeHGlobal(freeMemory);}
    window.WindowState=FormWindowState.Minimized;
    Check(window.WindowState==FormWindowState.Minimized,"Game-driven minimize must not be intercepted as a user floating command");
    window.WindowState=FormWindowState.Normal;
    command.Invoke(window,new object[]{"normal"});
    Check(window.Bounds==normal,"Game-relative floating movement overwrites normal window bounds");
    Check(window.Browser.CoreWebView2==null,"Game boundary fixture opened a user browser session");
   }
   string windowedProfile=System.IO.Path.Combine(profile+"-windowed","profile");
   using(var window=new DesktopWebView(true,windowedProfile)){
    window.Addon.Dispose();window.Overlay.Dispose();var binding=BindingFlags.Instance|BindingFlags.NonPublic;
    var prefs=typeof(DesktopWebView).GetMethod("FloatingPreferencesChange",binding);
    var command=typeof(DesktopWebView).GetMethod("FloatingCommand",binding);
    prefs.Invoke(window,new object[]{new System.Collections.Generic.Dictionary<string,object>{{"iconSize",52},{"opacity",80},{"modifiers",1},{"key",192},{"windowedFloating",true}}});
    Check(window.Presentation.Compact&&window.Presentation.Automatic,"Host failed to apply windowed preference immediately");
    command.Invoke(window,new object[]{"normal"});
    window.Presentation.ObserveFullscreen(false);Check(!window.Presentation.Compact,"Host ignored explicit full-workspace override");
    prefs.Invoke(window,new object[]{new System.Collections.Generic.Dictionary<string,object>{{"iconSize",68},{"opacity",80},{"modifiers",1},{"key",192}}});
    Check(!window.Presentation.Compact,"Legacy size-only preference must not reset explicit workspace override");
   }
   using(var restored=new DesktopWebView(true,windowedProfile)){
    restored.Addon.Dispose();restored.Overlay.Dispose();restored.CreateControl();
    Check(restored.Presentation.Compact&&restored.Presentation.Automatic,"Windowed auto-floating must restore after native restart");
    foreach(Control child in restored.Controls)if(child!=restored.Browser)Check(!child.Visible,"Windowed preference startup exposes normal resize edges");
    typeof(DesktopWebView).GetMethod("FloatingPreferencesChange",BindingFlags.Instance|BindingFlags.NonPublic).Invoke(restored,new object[]{new System.Collections.Generic.Dictionary<string,object>{{"iconSize",68},{"opacity",80},{"modifiers",1},{"key",192},{"windowedFloating",false}}});
    Check(!restored.Presentation.Compact,"Disabling automatic windowed floating must restore normal mode");
    Check(restored.Browser.CoreWebView2==null,"Windowed preference fixture opened browser session");
   }
   string focusProfile=System.IO.Path.Combine(profile+"-focus","profile");
   using(var game=new Form())using(var peer=new Form())using(var window=new DesktopWebView(true,focusProfile)){
    var binding=BindingFlags.Instance|BindingFlags.NonPublic;
    ((Timer)typeof(DesktopGameWindowTracker).GetField("timer",binding).GetValue(window.Addon)).Stop();
    game.Text="마비노기 모바일";game.Show();peer.Show();window.Show();
    typeof(DesktopGameWindowTracker).GetField("tracked",binding).SetValue(window.Addon,new GameWindowObservation{Alive=true,ProcessId=System.Diagnostics.Process.GetCurrentProcess().Id,StartedAtTicks=System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime().Ticks,Handle=game.Handle,Frame=game.Bounds});
    typeof(DesktopWebView).GetField("documentReady",binding).SetValue(window,true);
    var command=typeof(DesktopWebView).GetMethod("FloatingCommand",binding);command.Invoke(window,new object[]{"floating"});command.Invoke(window,new object[]{"settings"});
    var handoff=typeof(DesktopWebView).GetMethod("ReturnGameFocus",binding);
    window.Activate();SetForegroundWindow(window.Handle);Application.DoEvents();
    Check(GetForegroundWindow()==window.Handle,"Owned focus fixture could not obtain foreground");
    Check((bool)handoff.Invoke(window,null)&&GetForegroundWindow()==game.Handle,"Mouse handoff failed to focus the tracked owned game fixture");
    Check(!(bool)handoff.Invoke(window,null)&&GetForegroundWindow()==game.Handle,"A duplicate handoff must be a harmless no-op once the game owns focus");
    // A successful handoff owns this deactivation even if the later foreground
    // observation is temporarily unavailable. Do not infer an outside click.
    game.Text="temporarily unavailable observation";
    Application.DoEvents();
    Check((string)typeof(DesktopWebView).GetField("floatingSurface",binding).GetValue(window)=="settings","Returning to game collapsed the floating settings surface");
    game.Text="마비노기 모바일";
    var hotkey=typeof(DesktopWebView).GetField("floatingHotkey",binding).GetValue(window);
    var toggle=(Action)typeof(DesktopFloatingHotkey).GetField("toggle",binding).GetValue(hotkey);toggle();Application.DoEvents();
    Check(GetForegroundWindow()==game.Handle,"Opening the floating menu by shortcut stole keyboard input from the game");
    peer.Activate();SetForegroundWindow(peer.Handle);Application.DoEvents();
    Check(!(bool)handoff.Invoke(window,null)&&GetForegroundWindow()==peer.Handle,"A late mouse handoff stole focus from another app");
    window.Activate();SetForegroundWindow(window.Handle);Application.DoEvents();
    command.Invoke(window,new object[]{"settings"});
    peer.Activate();SetForegroundWindow(peer.Handle);
    command.Invoke(window,new object[]{"kronos"});Application.DoEvents();
    Check((string)typeof(DesktopWebView).GetField("floatingSurface",binding).GetValue(window)=="kronos","A queued old deactivation collapsed a newer module command");
    window.Activate();SetForegroundWindow(window.Handle);Application.DoEvents();
    peer.Activate();SetForegroundWindow(peer.Handle);Application.DoEvents();
    Check((string)typeof(DesktopWebView).GetField("floatingSurface",binding).GetValue(window)=="none","A fresh unrelated-app deactivation no longer dismisses the floating panel");
    window.Activate();SetForegroundWindow(window.Handle);game.Text="not the tracked game";
    Check(!(bool)handoff.Invoke(window,null),"A replaced game target received keyboard focus");
    Check(window.Browser.CoreWebView2==null,"Focus fixture opened a real WebView session");
   }
   string repairProfile=System.IO.Path.Combine(profile+"-dialogs","profile");
   using(var window=new DesktopWebView(true,repairProfile)){
    window.Addon.Dispose();var binding=BindingFlags.Instance|BindingFlags.NonPublic;
    window.Show();typeof(DesktopWebView).GetField("documentReady",binding).SetValue(window,true);
    var command=typeof(DesktopWebView).GetMethod("FloatingCommand",binding);
    var workspace=typeof(DesktopWebView).GetMethod("SetWorkspace",binding);
    var decision=typeof(DesktopWebView).GetMethod("Decision",binding);
    var layout=typeof(DesktopWebView).GetField("floatingLayout",binding);
    var normal=window.Bounds;command.Invoke(window,new object[]{"floating"});command.Invoke(window,new object[]{"kronos"});
    var narrow=(FloatingLayoutResult)layout.GetValue(window);var anchor=new Point(window.Left+narrow.Anchor.X,window.Top+narrow.Anchor.Y);
    if(Environment.GetEnvironmentVariable("IRIS_REPAIR_SCENARIO")!="dialog"){
     workspace.Invoke(window,new object[]{true});var wide=(FloatingLayoutResult)layout.GetValue(window);
     Check(window.Presentation.Compact&&wide.Panel.Value.Width>narrow.Panel.Value.Width,"Floating wide control must expand the actual native panel, not reject or leave floating");
     Check(new Point(window.Left+wide.Anchor.X,window.Top+wide.Anchor.Y)==anchor,"Wide panel moved the floating logo");
     workspace.Invoke(window,new object[]{false});Check(((FloatingLayoutResult)layout.GetValue(window)).Panel.Value.Width==narrow.Panel.Value.Width,"Small workspace failed to restore floating panel width");
    }
    if(Environment.GetEnvironmentVariable("IRIS_REPAIR_SCENARIO")!="workspace"){
     command.Invoke(window,new object[]{"dialog-open"});var modal=(FloatingLayoutResult)layout.GetValue(window);
     Check(window.Presentation.Compact&&modal.Panel.HasValue,"Generic modal leaves floating or loses native input region");
     var fitDialog=typeof(DesktopWebView).GetMethod("FitFloatingDialog",binding);
     Check(fitDialog!=null,"Floating dialog has no content-height native fit");
     fitDialog.Invoke(window,new object[]{280});var compact=(FloatingLayoutResult)layout.GetValue(window);
     Check(Math.Abs(compact.Panel.Value.Height/compact.Scale-280)<2,"Short modal retains empty native height");
     Check(!window.Region.IsVisible(compact.Panel.Value.Right-10,compact.Panel.Value.Bottom+20),"Old lower modal whitespace still intercepts game input");
     fitDialog.Invoke(window,new object[]{-1});Check(((FloatingLayoutResult)layout.GetValue(window)).Panel.Value.Height==compact.Panel.Value.Height,"Invalid content measurement mutates geometry");
     command.Invoke(window,new object[]{"dialog-close"});Check(((FloatingLayoutResult)layout.GetValue(window)).Panel.HasValue,"Dismissing module modal must preserve its underlying module");
     Check(((FloatingLayoutResult)layout.GetValue(window)).Panel.Value.Height==narrow.Panel.Value.Height,"Dialog close fails to restore underlying module height");
     command.Invoke(window,new object[]{"close"});decision.Invoke(window,new object[]{true});
     Check(window.Presentation.Compact&&((FloatingLayoutResult)layout.GetValue(window)).Panel.HasValue,"Icon-only protected close must stay floating with a modal input panel");
     command.Invoke(window,new object[]{"dialog-close"});Check(((FloatingLayoutResult)layout.GetValue(window)).Panel.HasValue,"DOM modal sync must never clear protected-close geometry");
     bool blocked=false;try{workspace.Invoke(window,new object[]{true});}catch(TargetInvocationException){blocked=true;}Check(blocked,"Close decision allowed workspace expansion");
     decision.Invoke(window,new object[]{false});Check(window.Presentation.Compact&&!((FloatingLayoutResult)layout.GetValue(window)).Panel.HasValue,"Close cancellation must restore icon-only floating");
    }
    command.Invoke(window,new object[]{"normal"});Check(window.Bounds==normal,"Modal or wide changes overwrite the user's normal bounds");
    window.Overlay.SetOpacityPercent(30);command.Invoke(window,new object[]{"floating"});command.Invoke(window,new object[]{"kronos"});
    uint tintKey,tintFlags;byte tintAlpha;
    Check(GetLayeredWindowAttributes(window.Handle,out tintKey,out tintAlpha,out tintFlags)&&tintAlpha==204,"Floating module must use floating opacity, not the addon-window opacity");
    command.Invoke(window,new object[]{"close"});
    typeof(DesktopWebView).GetMethod("FloatingNotice",binding).Invoke(window,new object[]{"character",112});
    var bubble=(FloatingLayoutResult)layout.GetValue(window);
    Check(bubble.Bubble.HasValue&&Math.Abs(bubble.Bubble.Value.Height/bubble.Scale-112)<2,"Measured character bubble retains empty native input area");
    Check(!window.Region.IsVisible(bubble.Bubble.Value.Left,bubble.Bubble.Value.Top),"Bubble corner is a square native artefact, not a rounded speech panel");
    command.Invoke(window,new object[]{"normal"});
    Check(GetLayeredWindowAttributes(window.Handle,out tintKey,out tintAlpha,out tintFlags)&&tintAlpha==76,"Floating setting overwrote independent addon opacity");
    window.Hide();bool hiddenBlocked=false;try{workspace.Invoke(window,new object[]{true});}catch(TargetInvocationException){hiddenBlocked=true;}Check(hiddenBlocked,"Hidden workspace expansion bypasses visibility guard");
    Check(window.Browser.CoreWebView2==null,"Repair fixture opened user WebView session");
   }
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
