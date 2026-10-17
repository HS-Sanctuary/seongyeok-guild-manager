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
   var normal=new Rectangle(100,80,420,640);var s=file.Load(normal,new Point(800,300));s.FloatingAnchor=new Point(900,350);Check(file.Save(s),"save bounds");
   var again=file.Load(Rectangle.Empty,Point.Empty);Check(again.NormalBounds==normal&&again.FloatingAnchor==new Point(900,350),"NormalAndFloatingBoundsAreIndependent");
   foreach(int dpi in new[]{96,144,192})foreach(int size in new[]{36,52,80})foreach(var work in new[]{new Rectangle(-1920,0,1920,1080),new Rectangle(0,0,1280,720),new Rectangle(0,0,320,480)})foreach(var anchor in new[]{new Point(work.Left,work.Top),new Point(work.Right,work.Top),new Point(work.Left,work.Bottom),new Point(work.Right,work.Bottom),new Point(-4000,9000)}){
    var l=FloatingLayout.Calculate(anchor,work,new Size(380,600),true,true,true,dpi,size);
    Check(work.Contains(l.Bounds),"FloatingBoundsSurviveDpiAndMonitorRemoval");
    using(var region=l.CreateRegion()) {Check(region.IsVisible(l.Anchor.X+l.Anchor.Width/2,l.Anchor.Y+l.Anchor.Height/2),"logo region absent");Check(region.IsVisible(l.Badge.X+l.Badge.Width/2,l.Badge.Y+l.Badge.Height/2),"badge clipped");}
   }
   var closed=FloatingLayout.Calculate(new Point(100,100),new Rectangle(0,0,1280,720),new Size(380,600),false,false,false,96);
   using(var r=closed.CreateRegion())Check(!r.IsVisible(closed.Anchor.Left,closed.Anchor.Top),"invisible logo corners capture input");
   File.WriteAllText(Path.Combine(root,"window-floating-v1.json"),"corrupt original");var broken=new DesktopFloatingBoundsStore(root);var bad=broken.Load(normal,Point.Empty);Check(bad.Unreadable&&!broken.Save(bad)&&File.ReadAllText(Path.Combine(root,"window-floating-v1.json"))=="corrupt original","CorruptBoundsNeverOverwriteOriginal");
   var registry=new FloatingFakeRegistry();int toggles=0;var hotkey=new DesktopFloatingHotkey(registry,()=>toggles++);Check(hotkey.Available&&registry.Mod==0x4001&&registry.Key==0xc0,"default shortcut registration");
   hotkey.Dispatch(DesktopFloatingHotkey.Id);Check(toggles==1,"OneKeypressOneToggleAfterHandleRecreation");registry.Fail=true;Check(!hotkey.Change(2,0x4b)&&hotkey.Available,"failed replacement lost old shortcut");registry.Fail=false;Check(hotkey.Change(2,0x4b),"replacement failed");hotkey.Dispose();hotkey.Dispatch(DesktopFloatingHotkey.Id);Check(toggles==1&&registry.Registered==registry.Released,"hotkey lifetime mismatch");
   using(var next=new DesktopFloatingHotkey(registry,()=>toggles++)){next.Dispatch(DesktopFloatingHotkey.Id);}Check(toggles==2&&registry.Registered==registry.Released,"handle recreation");
   Check(FloatingPreferences.Valid(36,35,1,0xc0)&&FloatingPreferences.Valid(80,100,2,0x4b),"valid appearance rejected");Check(!FloatingPreferences.Valid(0,0,0,0xc0)&&!FloatingPreferences.Valid(81,101,1,0xc0)&&!FloatingPreferences.Valid(52,80,3,0x49),"unsafe preferences accepted");
  }
 }
}
