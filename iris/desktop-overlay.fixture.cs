using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
namespace IrisDesktop {
    public static class OverlayFixture {
        [DllImport("kernel32.dll",CharSet=CharSet.Unicode)] static extern IntPtr LoadLibrary(string path);
        [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr h,int id,uint mod,uint key);
        [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr h,int id);
        [DllImport("user32.dll")] static extern void mouse_event(uint flags,uint x,uint y,uint data,UIntPtr extra);
        [DllImport("user32.dll")] static extern IntPtr WindowFromPoint(Point point);
        [DllImport("user32.dll",EntryPoint="GetWindowLongW")] static extern int GetStyle(IntPtr h,int index);
        [DllImport("user32.dll")] static extern bool IsChild(IntPtr parent,IntPtr child);
        class RecreateForm:Form {public void Recreate(){RecreateHandle();}}
        static void Check(bool ok,string message){if(!ok)throw new Exception(message);}
        static async Task Exercise(string loader,string profile,bool skipClick){
            LoadLibrary(loader);
            using(var target=new Form {StartPosition=FormStartPosition.Manual,Bounds=new Rectangle(50,50,500,500),ShowInTaskbar=false,TopMost=true})
            using(var top=new RecreateForm {StartPosition=FormStartPosition.Manual,Bounds=new Rectangle(70,70,360,420),FormBorderStyle=FormBorderStyle.None,ShowInTaskbar=false})
            using(var web=new WebView2 {Dock=DockStyle.Fill}){
                var button=new Button {Dock=DockStyle.Fill,Text="Synthetic click target"};target.Controls.Add(button);
                int clicks=0;button.Click+=(s,e)=>clicks++;target.Show();top.Controls.Add(web);
                using(var overlay=new DesktopOverlayCoordinator(top,web)){
                    top.Show();await web.EnsureCoreWebView2Async(await CoreWebView2Environment.CreateAsync(null,profile,null));
                    web.NavigateToString("<html><body style='background:#223344'><button>WebView child</button></body></html>");
                    await Task.Delay(700);
                    Check(overlay.ShortcutsAvailable,"Both shortcuts must be available for native fixture (close competing IRIS manually)");
                    Check(!overlay.SetOpacityPercent(49)&&!overlay.SetOpacityPercent(101),"Invalid opacity accepted");
                    Check(overlay.SetOpacityPercent(50)&&overlay.SetOpacityPercent(100),"Bounded opacity rejected");
                    Check(overlay.SetClickThrough(true),"Click-through failed");
                    if(!skipClick){
                        var point=top.PointToScreen(new Point(150,180));
                        var hit=WindowFromPoint(point);Check(hit==button.Handle||IsChild(target.Handle,hit),"Underlying synthetic target is not at guarded test point; no input injected");
                        var old=Cursor.Position;try {Cursor.Position=point;mouse_event(2,0,0,0,UIntPtr.Zero);mouse_event(4,0,0,0,UIntPtr.Zero);await Task.Delay(150);}finally{Cursor.Position=old;}
                        Check(clicks==1,"Actual WebView child swallowed click instead of underlying synthetic target");
                    }
                    overlay.RestoreInteractive();Check(!overlay.ClickThrough&&top.Visible,"Tray recovery failed");
                    overlay.ToggleVisibility();Check(!top.Visible,"Visibility did not hide");overlay.ToggleVisibility();Check(top.Visible,"Visibility did not show");
                    Check(overlay.ClampBounds(new Rectangle(-500,-100,1000,1000),new Rectangle(20,20,400,600))==new Rectangle(20,20,400,600),"Bounds did not clamp");
                    Check(overlay.SetClickThrough(true),"Second toggle failed");top.Recreate();Check(!overlay.ClickThrough&&overlay.ShortcutsAvailable,"Handle recreation failed to restore/reacquire");
                }
                Check(RegisterHotKey(top.Handle,0x5a51,0x4003,0x49),"Disposed owner retained visibility shortcut");UnregisterHotKey(top.Handle,0x5a51);
                Check(RegisterHotKey(target.Handle,0x5a52,0x4003,0x4f),"Cannot reserve input shortcut for failure fixture");
                using(var blocked=new DesktopOverlayCoordinator(top,web)){Check(!blocked.ShortcutsAvailable&&!blocked.SetClickThrough(true),"Partial registration enabled unrecoverable passthrough");}
                UnregisterHotKey(target.Handle,0x5a52);top.Close();target.Close();
            }
        }
        public static void Run(string loader,string profile,bool skipClick){Exception failure=null;using(var pump=new Form {Opacity=0,ShowInTaskbar=false}){pump.Shown+=async(s,e)=>{try{await Exercise(loader,profile,skipClick);}catch(Exception ex){failure=ex;}finally{pump.Close();}};Application.Run(pump);}if(failure!=null)throw failure;}
    }
}
