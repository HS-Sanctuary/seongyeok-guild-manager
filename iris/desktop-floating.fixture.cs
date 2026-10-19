namespace Iris {public interface IShortcutRegistry {bool Register(int id,uint modifiers,uint key);void Unregister(int id);}}
namespace IrisDesktop {
 using System;using System.Drawing;using System.IO;
 public sealed class FloatingFakeRegistry:Iris.IShortcutRegistry {
  public int Registered,Released;public uint Mod,Key;public bool Fail;
  public bool Register(int id,uint mod,uint key){Mod=mod;Key=key;if(Fail)return false;Registered++;return true;}
  public void Unregister(int id){Released++;}
 }
 public static class FloatingFixture {
  static void Check(bool v,string m){if(!v)throw new Exception(m);}
  public static void Run(string root){
   Directory.CreateDirectory(root);var file=new DesktopFloatingBoundsStore(root);
   var oldSettings="{\"version\":2,\"normalX\":100,\"normalY\":80,\"normalWidth\":420,\"normalHeight\":640,\"anchorX\":900,\"anchorY\":350,\"monitorId\":\"\",\"dpi\":96,\"iconSize\":52,\"opacity\":80,\"modifiers\":1,\"key\":192,\"windowedFloating\":true}";
   File.WriteAllText(Path.Combine(root,"window-floating-v1.json"),oldSettings);
   var migrated=new DesktopFloatingBoundsStore(root).Load(Rectangle.Empty,Point.Empty);
   Check(migrated.Preferences.IconSize==36&&migrated.Preferences.WindowedFloating&&migrated.FloatingAnchor==new Point(900,350),"Migrate only the old default icon size and preserve window preference and position");
   File.WriteAllText(Path.Combine(root,"window-floating-v1.json"),oldSettings.Replace("\"iconSize\":52","\"iconSize\":68"));
   Check(new DesktopFloatingBoundsStore(root).Load(Rectangle.Empty,Point.Empty).Preferences.IconSize==68,"Migration overwrote a custom icon size");
   File.Delete(Path.Combine(root,"window-floating-v1.json"));
   var edgeWork=new Rectangle(0,0,1280,720);
   var compact=FloatingLayout.Calculate(new Point(-9000,100),edgeWork,new Size(380,600),false,false,false,96);
   Check(compact.Bounds.Left+compact.Anchor.Left==8,"Left boundary must be based on the logo, not a centered shortcut badge");
   Check(compact.Badge.Left==compact.Anchor.Left,"Left-edge shortcut must slide inward independently of the logo");
   var rightEdge=FloatingLayout.Calculate(new Point(9000,100),edgeWork,new Size(380,600),false,false,false,96);
   Check(rightEdge.Bounds.Left+rightEdge.Anchor.Right==1272&&rightEdge.Badge.Right==rightEdge.Anchor.Right,"Right boundary must use the logo and shift the shortcut inward");
   Check(compact.Anchor.Width==36&&compact.Badge.Width<=58&&compact.Badge.Height==20&&compact.Badge.Top-compact.Anchor.Bottom==2,"Compact logo and shortcut must match the small in-game control proportions");
   var menuOnly=FloatingLayout.Calculate(new Point(100,300),edgeWork,new Size(380,600),true,true,false,96);
   Check(!menuOnly.Bubble.HasValue,"Information bubble must not cover open feature menu buttons");
   var longMenu=FloatingLayout.Calculate(Point.Empty,edgeWork,new Size(380,600),true,false,false,96,36,176);
   using(var longRegion=longMenu.CreateRegion())Check(!longRegion.IsVisible(longMenu.Badge.Left+4,longMenu.Badge.Top+longMenu.Badge.Height/2),"Hidden long shortcut must not keep a native input area while menu buttons are open");
   using(var menuRegion=menuOnly.CreateRegion())foreach(var button in menuOnly.Menu){Check(!menuRegion.IsVisible(button.Left+1,button.Top+1),"Transparent circular menu corners still intercept game clicks");Check(menuRegion.IsVisible(button.Left+button.Width/2,button.Top+button.Height/2),"Menu center is not clickable");}
   var preference=typeof(FloatingPreferences).GetField("WindowedFloating");Check(preference!=null,"Windowed preference must survive native settings storage");
   bool rejected=false;try{FloatingLayout.Calculate(Point.Empty,new Rectangle(0,0,96,128),new Size(380,600),false,false,false,384);}catch(ArgumentException){rejected=true;}
   Check(rejected,"High DPI must reject a viewport too small for the minimum logo and shortcut, not publish negative geometry");
   foreach(int dpi in new[]{96,144,192,288,384,768}){
    var minimum=new Rectangle(0,0,dpi,(int)Math.Ceiling(128*dpi/96d));
    Check(FloatingLayout.FitsContainer(minimum,dpi)&&!FloatingLayout.FitsContainer(new Rectangle(0,0,minimum.Width,minimum.Height-1),dpi),"Container admission must scale with DPI");
    var scaled=FloatingLayout.Calculate(Point.Empty,minimum,new Size(380,600),false,false,false,dpi,80);
    Check(scaled.Anchor.Width>=80*dpi/96d&&minimum.Contains(scaled.Bounds),"Smallest admitted container loses the configured logo at high DPI");
   }
   var normal=new Rectangle(100,80,420,640);var s=file.Load(normal,new Point(800,300));s.FloatingAnchor=new Point(900,350);Check(file.Save(s),"save bounds");
   var again=file.Load(Rectangle.Empty,Point.Empty);Check(again.NormalBounds==normal&&again.FloatingAnchor==new Point(900,350),"NormalAndFloatingBoundsAreIndependent");
   preference.SetValue(again.Preferences,true);Check(file.Save(again),"save windowed preference");
   again.Preferences.IconSize=52;Check(file.Save(again)&&new DesktopFloatingBoundsStore(root).Load(Rectangle.Empty,Point.Empty).Preferences.IconSize==52,"New version must preserve an explicitly reselected size52");
   Check((bool)preference.GetValue(new DesktopFloatingBoundsStore(root).Load(Rectangle.Empty,Point.Empty).Preferences),"Windowed floating choice lost after native restart");
   var currentText=File.ReadAllText(Path.Combine(root,"window-floating-v1.json"));
   File.WriteAllText(Path.Combine(root,"window-floating-v1.json"),currentText.Replace("\"version\":3","\"version\":1").Replace(",\"windowedFloating\":true",""));
   var legacy=new DesktopFloatingBoundsStore(root).Load(Rectangle.Empty,Point.Empty);Check(!legacy.Unreadable&&legacy.NormalBounds==normal&&!(bool)preference.GetValue(legacy.Preferences),"Legacy settings must retain positions and default windowed floating off");
   foreach(int dpi in new[]{96,144,192})foreach(int size in new[]{36,52,80})foreach(var work in new[]{new Rectangle(-1920,0,1920,1080),new Rectangle(0,0,1280,720),new Rectangle(0,0,320,480)})foreach(var anchor in new[]{new Point(work.Left,work.Top),new Point(work.Right,work.Top),new Point(work.Left,work.Bottom),new Point(work.Right,work.Bottom),new Point(-4000,9000)}){
    var l=FloatingLayout.Calculate(anchor,work,new Size(380,600),true,true,true,dpi,size);
    Check(l.Menu.Length==5,"Floating menu must reserve a fifth hit region for the exit button after settings");
    Check(work.Contains(l.Bounds),"FloatingBoundsSurviveDpiAndMonitorRemoval");
    Check(l.Badge.Height==Math.Ceiling(20*dpi/96d),"Compact shortcut height differs from its native region");
    for(int a=0;a<l.Menu.Length;a++)for(int b=a+1;b<l.Menu.Length;b++)Check(!l.Menu[a].IntersectsWith(l.Menu[b]),"Corner menu buttons overlap");
    using(var region=l.CreateRegion())Check(region.IsVisible(l.Anchor.X+l.Anchor.Width/2,l.Anchor.Y+l.Anchor.Height/2),"logo region absent");
   }
   var closed=FloatingLayout.Calculate(new Point(100,100),new Rectangle(0,0,1280,720),new Size(380,600),false,false,false,96);
   Check(closed.Badge.Width<=58,"Compact shortcut retains unused horizontal padding");
   using(var r=closed.CreateRegion()){
    Check(!r.IsVisible(closed.Anchor.Left,closed.Anchor.Top),"invisible logo corners capture input");
    Check(!r.IsVisible(closed.Badge.Left,closed.Badge.Top)&&!r.IsVisible(closed.Badge.Right-1,closed.Badge.Bottom-1),"Shortcut native region leaves square corners outside rounded keycap");
    Check(r.IsVisible(closed.Badge.Left+closed.Badge.Width/2,closed.Badge.Top+1),"Rounded shortcut clipped its top border");
   }
   File.WriteAllText(Path.Combine(root,"window-floating-v1.json"),"corrupt original");var broken=new DesktopFloatingBoundsStore(root);var bad=broken.Load(normal,Point.Empty);Check(bad.Unreadable&&!broken.Save(bad)&&File.ReadAllText(Path.Combine(root,"window-floating-v1.json"))=="corrupt original","CorruptBoundsNeverOverwriteOriginal");
   var registry=new FloatingFakeRegistry();int toggles=0;var hotkey=new DesktopFloatingHotkey(registry,()=>toggles++);Check(hotkey.Available&&registry.Mod==0x4001&&registry.Key==0xc0,"default shortcut registration");
   hotkey.Dispatch(DesktopFloatingHotkey.Id);Check(toggles==1,"OneKeypressOneToggleAfterHandleRecreation");registry.Fail=true;Check(!hotkey.Change(2,0x4b)&&hotkey.Available,"failed replacement lost old shortcut");registry.Fail=false;Check(hotkey.Change(2,0x4b),"replacement failed");hotkey.Dispose();hotkey.Dispatch(DesktopFloatingHotkey.Id);Check(toggles==1&&registry.Registered==registry.Released,"hotkey lifetime mismatch");
   using(var next=new DesktopFloatingHotkey(registry,()=>toggles++)){next.Dispatch(DesktopFloatingHotkey.Id);}Check(toggles==2&&registry.Registered==registry.Released,"handle recreation");
   Check(FloatingPreferences.Valid(36,35,1,0xc0)&&FloatingPreferences.Valid(80,100,2,0x4b),"valid appearance rejected");Check(!FloatingPreferences.Valid(0,0,0,0xc0)&&!FloatingPreferences.Valid(81,101,1,0xc0)&&!FloatingPreferences.Valid(52,80,3,0x49),"unsafe preferences accepted");
  }
 }
}
