using System;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Windows.Forms;
namespace IrisDesktop {
 public static class WorkspaceDockingFixture {
  static void Check(bool ok,string message){if(!ok)throw new Exception(message);}
  public static void Run(string root){
   // Never shown; synthetic frames only. No discovery, real game handle or user input.
   using(var window=new Form {ShowInTaskbar=false,Opacity=0,MaximumSize=new Size(1240,1000),Bounds=new Rectangle(0,40,1240,760)})
   using(var tracker=new DesktopGameWindowTracker(window,"development",root,()=>false)){
    var handle=window.Handle;
    var apply=typeof(DesktopGameWindowTracker).GetMethod("ApplyPlacement",BindingFlags.Instance|BindingFlags.NonPublic);
    tracker.BindPresentation((frame,work,fullscreen)=>true,()=>true);
    apply.Invoke(tracker,new object[]{new Rectangle(0,40,500,600),new Rectangle(0,0,1920,1080),false});
    Check(window.Width==1240&&window.MaximumSize.Width==1240,"Windowed docking collapsed workspace");
    Check(tracker.PreferredWidth==420,"Workspace overwrote narrow preference");
    tracker.BindPresentation((frame,work,fullscreen)=>true,()=>false);
    apply.Invoke(tracker,new object[]{new Rectangle(0,40,500,600),new Rectangle(0,0,1920,1080),false});
    Check(window.MaximumSize.Width==720,"Windowed compact docking was disabled");
    window.MaximumSize=new Size(1240,1000);window.Width=1240;
    tracker.BindPresentation((frame,work,fullscreen)=>true);
    apply.Invoke(tracker,new object[]{new Rectangle(0,0,1920,1080),new Rectangle(0,0,1920,1040),true});
    Check(window.Width==1240,"Existing fullscreen placement was overridden");
    Check(!File.Exists(Path.Combine(root,"window-width-v1.json")),"Workspace saved a width preference");
   }
  }
 }
}
