using System;using System.Drawing;using System.Collections.Generic;using System.Web.Script.Serialization;using System.Windows.Forms;
namespace IrisDesktop {
 public sealed partial class DesktopWebView {
  DesktopFloatingBoundsStore floatingStore;FloatingBoundsSnapshot floatingSnapshot;FloatingLayoutResult floatingLayout;DesktopFloatingHotkey floatingHotkey;
  bool floatingMode,floatingMenu,applyingFloating;string floatingSurface="none",floatingNotice="none",floatingPublished;long floatingRevision;
  void InitializeFloating(){
   floatingStore=new DesktopFloatingBoundsStore(System.IO.Path.GetDirectoryName(profile));floatingSnapshot=floatingStore.Load(Bounds,new Point(Left,Top));
   Bounds=DesktopWorkspaceLayout.Restore(floatingSnapshot.NormalBounds,Screen.FromRectangle(floatingSnapshot.NormalBounds).WorkingArea);Overlay.IndependentBounds=()=>floatingMode;Overlay.VisualOpacity=percent=>floatingMode&&floatingSurface=="none"&&!closeDecision?floatingSnapshot.Preferences.Opacity:percent;
   floatingMode=Presentation.Compact;Browser.DefaultBackgroundColor=Color.Transparent;
   RegisterFloatingHotkey();ApplyFloatingLayout(true);
   Deactivate+=(s,e)=>{if(floatingMode&&(floatingMenu||floatingSurface!="none")&&!closeDecision)FloatingCommand("close");};
   ResizeEnd+=(s,e)=>SaveFloatingNormal();
  }
  void RegisterFloatingHotkey(){if(floatingSnapshot==null||!IsHandleCreated)return;if(floatingHotkey!=null)floatingHotkey.Dispose();var p=floatingSnapshot.Preferences;floatingHotkey=new DesktopFloatingHotkey(new Iris.WindowShortcuts(Handle),()=>{if(!documentReady||closeDecision)return;FloatingCommand("menu");if(floatingMenu){Show();Activate();Browser.Focus();}},p.Modifiers,p.Key);}
  void ReplaceRegion(Region region){var old=Region;Region=region;if(old!=null)old.Dispose();}
  void SaveFloating(){if(floatingSnapshot==null)return;floatingSnapshot.Persistent=floatingStore.Save(floatingSnapshot);}
  void SaveFloatingNormal(){if(floatingSnapshot==null||floatingMode||applyingFloating||WindowState!=FormWindowState.Normal)return;floatingSnapshot.NormalBounds=Bounds;SaveFloating();}
  int FloatingDpi(){using(var g=CreateGraphics())return (int)Math.Round(g.DpiX);}
  void SetFloatingMode(bool value){
   if(floatingSnapshot==null||value==floatingMode)return;
   if(value){if(workspaceExpanded)SetWorkspace(false);SaveFloatingNormal();floatingMode=true;}
   else{floatingMode=false;floatingMenu=false;floatingSurface="none";MinimumSize=new Size(360,120);MaximumSize=new Size(720,Screen.FromRectangle(floatingSnapshot.NormalBounds).WorkingArea.Height);Bounds=DesktopWorkspaceLayout.Restore(floatingSnapshot.NormalBounds,Screen.FromRectangle(floatingSnapshot.NormalBounds).WorkingArea);}
   foreach(Control control in Controls)if(control!=Browser)control.Visible=!floatingMode;
   ApplyFloatingLayout(true);
  }
  object FloatingState(){if(floatingSnapshot==null)throw new ArgumentException();if(floatingLayout==null)ApplyFloatingLayout(false);return new{schemaVersion=1,mode=floatingMode?"floating":"normal",menuOpen=floatingMode&&floatingMenu,surface=floatingMode?floatingSurface:"none",revision=floatingRevision,layout=floatingLayout.Geometry(),hotkeyAvailable=floatingHotkey!=null&&floatingHotkey.Available,hotkeyLabel=floatingSnapshot.Preferences.Label,preferences=floatingSnapshot.Preferences.State(),persistent=floatingSnapshot.Persistent};}
  object FloatingCommand(string command){
   if(closeDecision)throw new ArgumentException();
   if(command=="normal"||command=="floating") {bool next=command=="floating";if(Presentation.Compact!=next)Presentation.Toggle();else SetFloatingMode(next);}
   else if(command=="close"){floatingMenu=false;floatingSurface="none";}
   else if(command=="menu"){if(!floatingMode){if(!Presentation.Compact)Presentation.Toggle();else SetFloatingMode(true);}floatingMenu=!floatingMenu;floatingSurface="none";}
   else if(Array.IndexOf(new[]{"kronos","synaxis","ergon","settings"},command)>=0){floatingSurface=command;floatingMenu=false;}
   else throw new ArgumentException();ApplyFloatingLayout(true);return FloatingState();
  }
  object FloatingNotice(string kind){if(Array.IndexOf(new[]{"none","information","character"},kind)<0)throw new ArgumentException();if(kind!=floatingNotice){floatingNotice=kind;ApplyFloatingLayout(true);}return FloatingState();}
  object FloatingPreferencesChange(Dictionary<string,object> r){
   var p=new FloatingPreferences{IconSize=(int)r["iconSize"],Opacity=(int)r["opacity"],Modifiers=unchecked((uint)(int)r["modifiers"]),Key=unchecked((uint)(int)r["key"])};
   if(!FloatingPreferences.Valid(p.IconSize,p.Opacity,p.Modifiers,p.Key))throw new ArgumentException();
   var before=floatingSnapshot.Preferences;bool changed=p.Modifiers!=before.Modifiers||p.Key!=before.Key;
   if(changed&&(floatingHotkey==null||!floatingHotkey.Change(p.Modifiers,p.Key)))throw new ArgumentException("floating_shortcut_unavailable");
   if(!changed&&floatingHotkey!=null&&!floatingHotkey.Available)floatingHotkey.Change(p.Modifiers,p.Key);
   floatingSnapshot.Preferences=p;SaveFloating();ApplyFloatingLayout(true);return FloatingState();
  }
  void ApplyFloatingLayout(bool publish){
   if(floatingSnapshot==null||applyingFloating||IsDisposed)return;applyingFloating=true;
   try{
    var screen=Screen.FromPoint(floatingSnapshot.FloatingAnchor);int dpi=FloatingDpi();var p=floatingSnapshot.Preferences;
    floatingLayout=FloatingLayout.Calculate(floatingSnapshot.FloatingAnchor,screen.WorkingArea,new Size(420,680),floatingMode&&floatingMenu,floatingMode&&floatingNotice!="none"&&floatingSurface=="none",floatingMode&&floatingSurface!="none",dpi,p.IconSize,Math.Max(72,p.Label.Length*7+12));
    if(floatingMode){MinimumSize=new Size(1,1);MaximumSize=new Size(screen.WorkingArea.Width,screen.WorkingArea.Height);Bounds=floatingLayout.Bounds;floatingSnapshot.FloatingAnchor=new Point(Left+floatingLayout.Anchor.Left,Top+floatingLayout.Anchor.Top);floatingSnapshot.Dpi=dpi;floatingSnapshot.MonitorId=screen.DeviceName;ReplaceRegion(floatingLayout.CreateRegion());}
    else OnSizeChanged(EventArgs.Empty);
    Overlay.RefreshOpacity();
    // Change events are content-addressed; the 250ms game observer does not flood the bridge.
    string serialized=new JavaScriptSerializer().Serialize(new{mode=floatingMode,menu=floatingMenu,surface=floatingSurface,layout=floatingLayout.Geometry(),prefs=p.State(),available=floatingHotkey!=null&&floatingHotkey.Available,persistent=floatingSnapshot.Persistent});
    if(serialized!=floatingPublished){floatingPublished=serialized;floatingRevision++;if(publish&&documentReady&&bridge!=null&&Browser.CoreWebView2!=null)Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new{version=1,kind="window.floating.changed",epoch=bridge.Epoch,environment=development?"development":"production",state=FloatingState()}));}
   }finally{applyingFloating=false;}
  }
 }
}
