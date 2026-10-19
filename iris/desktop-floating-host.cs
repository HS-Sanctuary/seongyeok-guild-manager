using System;using System.Drawing;using System.Collections.Generic;using System.Web.Script.Serialization;using System.Windows.Forms;
namespace IrisDesktop {
 public sealed partial class DesktopWebView {
  DesktopFloatingBoundsStore floatingStore;FloatingBoundsSnapshot floatingSnapshot;FloatingLayoutResult floatingLayout;DesktopFloatingHotkey floatingHotkey;
  Rectangle? floatingGameBounds;
  bool floatingMode,floatingMenu,floatingDialog,applyingFloating,gameFocusHandoff;string floatingSurface="none",floatingNotice="none",floatingPublished;long floatingRevision,floatingInteraction;
  bool FloatingModalOpen {get{return floatingDialog||closeDecision;}}
  Size FloatingPanelSize {get{return FloatingModalOpen?new Size(420,floatingDialogHeight):new Size(workspaceExpanded?980:420,680);}}
  int floatingDialogHeight=680;
  int floatingNoticeHeight=180;
  void InitializeFloating(){
   floatingStore=new DesktopFloatingBoundsStore(System.IO.Path.GetDirectoryName(profile));floatingSnapshot=floatingStore.Load(Bounds,new Point(Left,Top));
   Bounds=DesktopWorkspaceLayout.Restore(floatingSnapshot.NormalBounds,Screen.FromRectangle(floatingSnapshot.NormalBounds).WorkingArea);Overlay.IndependentBounds=()=>floatingMode;Overlay.VisualOpacity=percent=>floatingMode?floatingSnapshot.Preferences.Opacity:percent;
   floatingMode=Presentation.Compact;ApplyFloatingAccessories();Browser.DefaultBackgroundColor=Color.Transparent;
   Presentation.SetWindowedFloating(floatingSnapshot.Preferences.WindowedFloating);
   RegisterFloatingHotkey();ApplyFloatingLayout(true);
   VisibleChanged+=(s,e)=>ApplyFloatingLayout(true);
   Resize+=(s,e)=>ApplyFloatingLayout(true);
   Activated+=(s,e)=>{gameFocusHandoff=false;floatingInteraction++;};
   // Our deliberate handoff is not an outside click. Windows can deliver the
   // deactivation before its foreground observation settles; a queued blur must
   // also never dismiss a module opened by a newer command or activation.
   Deactivate+=(s,e)=>{if(!IsHandleCreated||IsDisposed)return;long interaction=floatingInteraction;bool handoff=gameFocusHandoff;BeginInvoke(new Action(()=>{if(!IsDisposed&&interaction==floatingInteraction&&!(handoff&&gameFocusHandoff)&&floatingMode&&(floatingMenu||floatingSurface!="none")&&!FloatingModalOpen&&!ContainsFocus&&!Addon.IsGameForeground)FloatingCommand("close");}));};
   ResizeEnd+=(s,e)=>SaveFloatingNormal();
  }
  void RegisterFloatingHotkey(){if(floatingSnapshot==null||!IsHandleCreated)return;if(floatingHotkey!=null)floatingHotkey.Dispose();var p=floatingSnapshot.Preferences;floatingHotkey=new DesktopFloatingHotkey(new Iris.WindowShortcuts(Handle),()=>{if(!documentReady||FloatingModalOpen)return;FloatingCommand("menu");if(floatingMenu){Show();if(!Addon.IsGameForeground){Activate();Browser.Focus();}}},p.Modifiers,p.Key);}
  void ReplaceRegion(Region region){var old=Region;Region=region;if(old!=null)old.Dispose();}
  void SaveFloating(){if(floatingSnapshot==null)return;floatingSnapshot.Persistent=floatingStore.Save(floatingSnapshot);}
  void SaveFloatingNormal(){if(floatingSnapshot==null||floatingMode||applyingFloating||WindowState!=FormWindowState.Normal)return;floatingSnapshot.NormalBounds=Bounds;SaveFloating();}
  int FloatingDpi(){using(var g=CreateGraphics())return (int)Math.Round(g.DpiX);}
  void ApplyFloatingAccessories(){foreach(Control control in Controls)if(control!=Browser)control.Visible=!floatingMode;}
  void SetFloatingMode(bool value){
   if(floatingSnapshot==null||value==floatingMode)return;
   if(value){if(workspaceExpanded)SetWorkspace(false);SaveFloatingNormal();floatingMode=true;}
   else{floatingMode=false;floatingMenu=false;floatingDialog=false;floatingSurface="none";MinimumSize=new Size(360,120);var work=Screen.FromRectangle(floatingSnapshot.NormalBounds).WorkingArea;MaximumSize=new Size(workspaceExpanded?1240:720,work.Height);Bounds=DesktopWorkspaceLayout.Restore(floatingSnapshot.NormalBounds,work);if(workspaceExpanded){workspaceBounds=Bounds;Bounds=DesktopWorkspaceLayout.Expand(Bounds,work);}}
   ApplyFloatingAccessories();
   ApplyFloatingLayout(true);
  }
  bool FloatingWindowVisible(){return Visible&&WindowState!=FormWindowState.Minimized;}
  bool ReturnGameFocus(){
   if(!floatingMode||!documentReady||FloatingModalOpen||allowClose)return false;
   bool previous=gameFocusHandoff;gameFocusHandoff=true;bool returned=false;
   try{returned=Addon.ReturnKeyboardToGame();return returned;}
   finally{if(!returned)gameFocusHandoff=previous;}
  }
  void FitFloatingDialog(int height){if(!floatingMode||!FloatingModalOpen||height<80||height>680||height==floatingDialogHeight)return;floatingDialogHeight=height;ApplyFloatingLayout(true);}
  async System.Threading.Tasks.Task MeasureFloatingDialogAsync(){
   if(fitting||!floatingMode||!FloatingModalOpen||!documentReady||!Visible||Browser.CoreWebView2==null)return;
   fitting=true;
   try{
    var core=Browser.CoreWebView2;string source=core.Source;long revision=floatingRevision;
    var result=await core.ExecuteScriptAsync("window.__irisFloatingDialogHeight?.() ?? null");int height;
    if(!IsDisposed&&documentReady&&floatingMode&&FloatingModalOpen&&Browser.CoreWebView2==core&&core.Source==source&&floatingRevision==revision&&Int32.TryParse(result,out height))FitFloatingDialog(height);
   }catch{/* Layout failure never changes auth, selection, or game input. */}finally{fitting=false;}
  }
  void MinimizeToFloating(){if(FloatingModalOpen)return;floatingMenu=false;floatingSurface="none";FloatingCommand("floating");}
  Rectangle FloatingContainer(Screen fallback){
   var client=Addon.ClientBounds;
   if(client.HasValue){
    var visible=Rectangle.Intersect(client.Value,Screen.FromRectangle(client.Value).WorkingArea);
    if(FloatingLayout.FitsContainer(visible,FloatingDpi())){
     if(floatingMode&&floatingGameBounds.HasValue){var previous=floatingGameBounds.Value;floatingSnapshot.FloatingAnchor.Offset(client.Value.Left-previous.Left,client.Value.Top-previous.Top);}
     floatingGameBounds=client;return visible;
    }
   }
   if(floatingGameBounds.HasValue){var safe=Rectangle.Intersect(floatingGameBounds.Value,Screen.FromRectangle(floatingGameBounds.Value).WorkingArea);if(FloatingLayout.FitsContainer(safe,FloatingDpi()))return safe;}
   return fallback.WorkingArea;
  }
  Rectangle ConstrainFloatingMove(Rectangle proposed){
   if(!floatingMode||floatingLayout==null)return proposed;
   return ConstrainFloatingDrag(proposed).Bounds;
  }
  FloatingLayoutResult ConstrainFloatingDrag(Rectangle proposed){
   var p=floatingSnapshot.Preferences;var area=FloatingContainer(Screen.FromRectangle(proposed));
   var anchor=new Point(proposed.Left+floatingLayout.Anchor.Left,proposed.Top+floatingLayout.Anchor.Top);
   return FloatingLayout.Calculate(anchor,area,FloatingPanelSize,floatingMenu&&!FloatingModalOpen,floatingNotice!="none"&&floatingSurface=="none"&&!FloatingModalOpen,floatingSurface!="none"||FloatingModalOpen,FloatingDpi(),p.IconSize,Math.Max(52,(p.Label.Length-2)*7+8),floatingNoticeHeight);
  }
  object FloatingState(){if(floatingSnapshot==null)throw new ArgumentException();if(floatingLayout==null)ApplyFloatingLayout(false);return new{schemaVersion=1,mode=floatingMode?"floating":"normal",menuOpen=floatingMode&&floatingMenu&&!FloatingModalOpen,surface=floatingMode?floatingSurface:"none",dialogOpen=floatingMode&&FloatingModalOpen,gameFocus=true,revision=floatingRevision,layout=floatingLayout.Geometry(),hotkeyAvailable=floatingHotkey!=null&&floatingHotkey.Available,hotkeyLabel=floatingSnapshot.Preferences.Label,preferences=floatingSnapshot.Preferences.State(),persistent=floatingSnapshot.Persistent,windowVisible=FloatingWindowVisible()};}
  object FloatingCommand(string command){
   if(command=="ergon"&&!DesktopBridge.ErgonAvailable)throw new ArgumentException();
   floatingInteraction++;
   if(command=="dialog-open"||command=="dialog-close"){if(!floatingDialog||command=="dialog-close")floatingDialogHeight=680;floatingDialog=command=="dialog-open";ApplyFloatingLayout(true);return FloatingState();}
   if(FloatingModalOpen)throw new ArgumentException();
   if(command=="normal"||command=="floating") {bool next=command=="floating";if(Presentation.Compact!=next)Presentation.Toggle();else SetFloatingMode(next);}
   else if(command=="close"){floatingMenu=false;floatingSurface="none";}
   else if(command=="menu"){if(!floatingMode){if(!Presentation.Compact)Presentation.Toggle();else SetFloatingMode(true);}floatingMenu=!floatingMenu;floatingSurface="none";}
   else if(Array.IndexOf(new[]{"kronos","synaxis","ergon","settings"},command)>=0){floatingSurface=command;floatingMenu=false;}
   else throw new ArgumentException();ApplyFloatingLayout(true);return FloatingState();
  }
  object FloatingNotice(string kind,int? height){if(Array.IndexOf(new[]{"none","information","character"},kind)<0||height.HasValue&&(height.Value<80||height.Value>360))throw new ArgumentException();int next=height??(kind!=floatingNotice?180:floatingNoticeHeight);if(kind!=floatingNotice||next!=floatingNoticeHeight){floatingNotice=kind;floatingNoticeHeight=next;ApplyFloatingLayout(true);}return FloatingState();}
  object FloatingPreferencesChange(Dictionary<string,object> r){
   var p=new FloatingPreferences{IconSize=(int)r["iconSize"],Opacity=(int)r["opacity"],Modifiers=unchecked((uint)(int)r["modifiers"]),Key=unchecked((uint)(int)r["key"]),WindowedFloating=r.ContainsKey("windowedFloating")?(bool)r["windowedFloating"]:floatingSnapshot.Preferences.WindowedFloating};
   if(!FloatingPreferences.Valid(p.IconSize,p.Opacity,p.Modifiers,p.Key))throw new ArgumentException();
   var before=floatingSnapshot.Preferences;bool changed=p.Modifiers!=before.Modifiers||p.Key!=before.Key;
   if(changed&&(floatingHotkey==null||!floatingHotkey.Change(p.Modifiers,p.Key)))throw new ArgumentException("floating_shortcut_unavailable");
   if(!changed&&floatingHotkey!=null&&!floatingHotkey.Available)floatingHotkey.Change(p.Modifiers,p.Key);
   floatingSnapshot.Preferences=p;SaveFloating();Presentation.SetWindowedFloating(p.WindowedFloating);ApplyFloatingLayout(true);return FloatingState();
  }
  void ApplyFloatingLayout(bool publish){
   if(floatingSnapshot==null||applyingFloating||IsDisposed)return;applyingFloating=true;
   try{
    var screen=Screen.FromPoint(floatingSnapshot.FloatingAnchor);var area=FloatingContainer(screen);int dpi=FloatingDpi();var p=floatingSnapshot.Preferences;
    floatingLayout=FloatingLayout.Calculate(floatingSnapshot.FloatingAnchor,area,FloatingPanelSize,floatingMode&&floatingMenu&&!FloatingModalOpen,floatingMode&&floatingNotice!="none"&&floatingSurface=="none"&&!FloatingModalOpen,floatingMode&&(floatingSurface!="none"||FloatingModalOpen),dpi,p.IconSize,Math.Max(52,(p.Label.Length-2)*7+8),floatingNoticeHeight);
    if(floatingMode){MinimumSize=new Size(1,1);MaximumSize=area.Size;Bounds=floatingLayout.Bounds;floatingSnapshot.FloatingAnchor=new Point(Left+floatingLayout.Anchor.Left,Top+floatingLayout.Anchor.Top);floatingSnapshot.Dpi=dpi;floatingSnapshot.MonitorId=screen.DeviceName;ReplaceRegion(floatingLayout.CreateRegion());}
    else OnSizeChanged(EventArgs.Empty);
    Overlay.RefreshOpacity();
    // Change events are content-addressed; the 250ms game observer does not flood the bridge.
    string serialized=new JavaScriptSerializer().Serialize(new{mode=floatingMode,menu=floatingMenu,surface=floatingSurface,dialog=FloatingModalOpen,layout=floatingLayout.Geometry(),prefs=p.State(),available=floatingHotkey!=null&&floatingHotkey.Available,persistent=floatingSnapshot.Persistent,windowVisible=FloatingWindowVisible()});
    if(serialized!=floatingPublished){floatingPublished=serialized;floatingRevision++;if(publish&&documentReady&&bridge!=null&&Browser.CoreWebView2!=null)Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new{version=1,kind="window.floating.changed",epoch=bridge.Epoch,environment=development?"development":"production",state=FloatingState()}));}
   }finally{applyingFloating=false;}
  }
 }
}
