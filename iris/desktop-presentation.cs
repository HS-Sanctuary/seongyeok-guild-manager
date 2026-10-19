using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Text;
using System.Web.Script.Serialization;

namespace IrisDesktop {
 public static class DesktopWorkspaceLayout {
  public static Rectangle Restore(Rectangle saved,Rectangle work){
   if(work.Width<1||work.Height<1)throw new ArgumentException();
   int width=Math.Min(Math.Max(1,saved.Width),work.Width),height=Math.Min(Math.Max(1,saved.Height),work.Height);
   return new Rectangle(Math.Max(work.Left,Math.Min(saved.Left,work.Right-width)),Math.Max(work.Top,Math.Min(saved.Top,work.Bottom-height)),width,height);
  }
  public static Rectangle Expand(Rectangle current,Rectangle work){
   return Restore(new Rectangle(current.Left,current.Top,1240,Math.Max(760,current.Height)),work);
  }
 }
 public sealed class DesktopPresentationState {
  readonly string path;
  bool manual,fullscreen,moved,windowedFloating;
  public bool Compact {get;private set;}
  public bool Automatic {get;private set;}
  public bool IsFullscreen {get{return fullscreen;}}
  public bool PanelOpen {get;private set;}
  public bool AnchorGameCorner {get{return fullscreen&&!moved;}}
  public bool ManuallyMoved {get{return moved;}}
  public event EventHandler Changed;
  public DesktopPresentationState():this(null){}
  public DesktopPresentationState(string root){
   if(root==null)return;if(!Path.IsPathRooted(root))throw new ArgumentException();path=Path.Combine(root,"window-presentation-v1.json");
   try{if(!File.Exists(path))return;if(new FileInfo(path).Length>1024)throw new ArgumentException();var raw=new JavaScriptSerializer().DeserializeObject(File.ReadAllText(path)) as Dictionary<string,object>;if(raw==null||raw.Count!=2||!raw.ContainsKey("version")||!Equals(raw["version"],1)||!raw.ContainsKey("compact")||!(raw["compact"] is bool))throw new ArgumentException();manual=Compact=(bool)raw["compact"];}catch{manual=Compact=false;}
  }
  void Notify(){if(Changed!=null)Changed(this,EventArgs.Empty);}
  public object State(){return new {compact=Compact,automatic=Automatic,panelOpen=PanelOpen};}
  public void Toggle(){
   bool next=!Compact;
   if(path!=null){var temporary=path+"."+Guid.NewGuid().ToString("N")+".tmp";try{Directory.CreateDirectory(Path.GetDirectoryName(path));using(var f=new FileStream(temporary,FileMode.CreateNew,FileAccess.Write,FileShare.None)){var bytes=Encoding.UTF8.GetBytes(new JavaScriptSerializer().Serialize(new {version=1,compact=next}));f.Write(bytes,0,bytes.Length);f.Flush(true);}if(File.Exists(path))File.Replace(temporary,path,null);else File.Move(temporary,path);}finally{try{if(File.Exists(temporary))File.Delete(temporary);}catch{}}}
   manual=Compact=next;Automatic=false;Notify();
  }
  public void ObserveFullscreen(bool? active){
   if(!active.HasValue||active.Value==fullscreen)return;fullscreen=active.Value;
   if(fullscreen){moved=false;if(!manual){Compact=true;Automatic=true;}}
   else{if(Automatic){Compact=manual||windowedFloating;Automatic=!manual&&windowedFloating;}}
   Notify();
  }
  public void SetWindowedFloating(bool enabled){
   if(windowedFloating==enabled)return;windowedFloating=enabled;
   if(!fullscreen&&!manual){Compact=enabled;Automatic=enabled;}
   Notify();
  }
  public void SetPanelOpen(bool open){if(PanelOpen==open)return;PanelOpen=open;Notify();}
  public void RecordManualMove(){moved=true;Notify();}
 }
 public static class DesktopRoundedWindow {
  public static Region RegionFor(Size size,float dpi){
   float diameter=Math.Max(2,Math.Min(Math.Min(size.Width,size.Height),24*Math.Max(1,dpi/96)));
   using(var path=new GraphicsPath()){
    path.AddArc(0,0,diameter,diameter,180,90);path.AddArc(size.Width-diameter,0,diameter,diameter,270,90);path.AddArc(size.Width-diameter,size.Height-diameter,diameter,diameter,0,90);path.AddArc(0,size.Height-diameter,diameter,diameter,90,90);path.CloseFigure();return new Region(path);
   }
  }
 }
}
