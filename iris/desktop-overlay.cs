using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Iris;
namespace IrisDesktop {
    public sealed class DesktopOverlayCoordinator:NativeWindow,IDisposable {
        readonly Form window;readonly Control browser;
        HotkeyRecovery recovery;bool disposed,clickThrough;int opacity=100;
        public bool ClickThrough {get{return clickThrough;}}
        public bool ShortcutsAvailable {get{return recovery!=null&&recovery.Available;}}
        public int OpacityPercent {get{return opacity;}}
        public event EventHandler StateChanged;
        [DllImport("user32.dll",EntryPoint="GetWindowLongW")] static extern int Get32(IntPtr h,int i);
        [DllImport("user32.dll",EntryPoint="GetWindowLongPtrW")] static extern IntPtr Get64(IntPtr h,int i);
        [DllImport("user32.dll",EntryPoint="SetWindowLongW",SetLastError=true)] static extern int Set32(IntPtr h,int i,int v);
        [DllImport("user32.dll",EntryPoint="SetWindowLongPtrW",SetLastError=true)] static extern IntPtr Set64(IntPtr h,int i,IntPtr v);
        [DllImport("user32.dll",SetLastError=true)] static extern bool SetLayeredWindowAttributes(IntPtr h,uint key,byte alpha,uint flags);
        [DllImport("kernel32.dll")] static extern void SetLastError(uint error);
        public DesktopOverlayCoordinator(Form window,Control browser){
            if(window==null||browser==null)throw new ArgumentNullException();this.window=window;this.browser=browser;
            window.TopMost=true;window.HandleCreated+=Created;window.HandleDestroyed+=Destroyed;window.ResizeEnd+=Clamp;
            if(window.IsHandleCreated)Created(window,EventArgs.Empty);
        }
        public object State(){return new {clickThrough=ClickThrough,shortcutsAvailable=ShortcutsAvailable,opacityPercent=OpacityPercent};}
        void Changed(){if(StateChanged!=null)StateChanged(this,EventArgs.Empty);}
        void Created(object sender,EventArgs e){if(disposed)return;AssignHandle(window.Handle);recovery=new HotkeyRecovery(new WindowShortcuts(window.Handle));clickThrough=false;Apply(false,opacity);Changed();}
        void Destroyed(object sender,EventArgs e){if(recovery!=null)recovery.Dispose();recovery=null;clickThrough=false;ReleaseHandle();Changed();}
        bool Apply(bool input,int percent){
            if(!window.IsHandleCreated)return false;
            long style=IntPtr.Size==8?Get64(window.Handle,-20).ToInt64():Get32(window.Handle,-20);
            long updated=(style|0x80000L)&~0x20L;if(input)updated|=0x20L;
            SetLastError(0);long previous=IntPtr.Size==8?Set64(window.Handle,-20,new IntPtr(updated)).ToInt64():Set32(window.Handle,-20,(int)updated);
            if(previous==0&&Marshal.GetLastWin32Error()!=0)return false;
            return SetLayeredWindowAttributes(window.Handle,0,(byte)Math.Round(percent*255.0/100),2);
        }
        public bool SetClickThrough(bool enabled){
            if(disposed||(enabled&&!ShortcutsAvailable))return false;
            if(!Apply(enabled,opacity)){Apply(false,100);clickThrough=false;opacity=100;Changed();return false;}
            clickThrough=enabled;Changed();return true;
        }
        public bool SetOpacityPercent(int percent){if(disposed||percent<50||percent>100)return false;if(!Apply(clickThrough,percent))return false;opacity=percent;Changed();return true;}
        public Rectangle ClampBounds(Rectangle requested,Rectangle workingArea){
            int width=Math.Min(Math.Max(requested.Width,320),Math.Min(480,workingArea.Width));
            int height=Math.Min(Math.Max(requested.Height,120),workingArea.Height);
            return new Rectangle(Math.Max(workingArea.Left,Math.Min(requested.X,workingArea.Right-width)),Math.Max(workingArea.Top,Math.Min(requested.Y,workingArea.Bottom-height)),width,height);
        }
        void Clamp(object sender,EventArgs e){window.Bounds=ClampBounds(window.Bounds,Screen.FromRectangle(window.Bounds).WorkingArea);}
        public void RestoreInteractive(){if(disposed)return;SetClickThrough(false);Clamp(window,EventArgs.Empty);window.Show();window.WindowState=FormWindowState.Normal;window.Activate();browser.Focus();}
        public void ToggleVisibility(){if(disposed)return;if(window.Visible)window.Hide();else {Clamp(window,EventArgs.Empty);window.Show();}}
        protected override void WndProc(ref Message m){if(m.Msg==0x0312&&ShortcutsAvailable){if(m.WParam.ToInt32()==HotkeyRecovery.VisibilityId){ToggleVisibility();return;}if(m.WParam.ToInt32()==HotkeyRecovery.InputId){SetClickThrough(!clickThrough);return;}}base.WndProc(ref m);}
        public void Dispose(){if(disposed)return;SetClickThrough(false);disposed=true;window.HandleCreated-=Created;window.HandleDestroyed-=Destroyed;window.ResizeEnd-=Clamp;if(recovery!=null)recovery.Dispose();recovery=null;ReleaseHandle();}
    }
}
