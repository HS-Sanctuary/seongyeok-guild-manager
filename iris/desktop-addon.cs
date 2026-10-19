using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace IrisDesktop {
    // Separate appearance file: never opens authentication, WebView profile or protected queue files.
    public sealed class AddonPreferencesFile {
        readonly string root, path;
        public AddonPreferencesFile(string root) {
            if (String.IsNullOrWhiteSpace(root) || !Path.IsPathRooted(root)) throw new ArgumentException();
            this.root = Path.GetFullPath(root); path = Path.Combine(this.root, "window-preferences-v1.json");
        }
        public AddonWindowPreferences Load(out bool valid) {
            valid = true;
            try {
                if (!File.Exists(path)) return new AddonWindowPreferences();
                if (new FileInfo(path).Length > 4096) throw new ArgumentException();
                var json = File.ReadAllText(path, new UTF8Encoding(false, true));
                var value = new JavaScriptSerializer { MaxJsonLength = 4096, RecursionLimit = 4 }.DeserializeObject(json) as Dictionary<string, object>;
                if (value == null || value.Count != 3 || !value.ContainsKey("version") || !Equals(value["version"], 1) || !value.ContainsKey("dockSide") || !value.ContainsKey("sameLayer") || !(value["sameLayer"] is bool)) throw new ArgumentException();
                var result = new AddonWindowPreferences { DockSide = value["dockSide"] as string, SameLayer = (bool)value["sameLayer"] };
                if (!AddonWindowPreferences.Valid(result)) throw new ArgumentException();
                return result;
            } catch { valid = false; return new AddonWindowPreferences(); }
        }
        public bool Save(AddonWindowPreferences value) {
            if (!AddonWindowPreferences.Valid(value)) return false;
            string temporary = Path.Combine(root, "window-preferences-" + Guid.NewGuid().ToString("N") + ".tmp");
            try {
                Directory.CreateDirectory(root);
                byte[] bytes = new UTF8Encoding(false).GetBytes(new JavaScriptSerializer().Serialize(new {version=1,dockSide=value.DockSide,sameLayer=value.SameLayer}));
                using (var file = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { file.Write(bytes, 0, bytes.Length); file.Flush(true); }
                if (File.Exists(path)) File.Replace(temporary, path, null); else File.Move(temporary, path);
                return true;
            } catch { return false; }
            finally { try { if (File.Exists(temporary)) File.Delete(temporary); } catch { } }
        }
        public int LoadWidth(out bool valid){
            valid=true;
            try{var widthPath=Path.Combine(root,"window-width-v1.json");if(!File.Exists(widthPath))return 420;if(new FileInfo(widthPath).Length>1024)throw new ArgumentException();var data=new JavaScriptSerializer().DeserializeObject(File.ReadAllText(widthPath)) as Dictionary<string,object>;if(data==null||data.Count!=2||!data.ContainsKey("version")||!Equals(data["version"],1)||!data.ContainsKey("width")||!(data["width"] is int))throw new ArgumentException();int width=(int)data["width"];if(width<360||width>720)throw new ArgumentException();return width;}
            catch{valid=false;return 420;}
        }
        public bool SaveWidth(int width){
            if(width<360||width>720)return false;
            string target=Path.Combine(root,"window-width-v1.json"),temporary=Path.Combine(root,"window-width-"+Guid.NewGuid().ToString("N")+".tmp");
            try{Directory.CreateDirectory(root);using(var stream=new FileStream(temporary,FileMode.CreateNew,FileAccess.Write,FileShare.None)){var bytes=Encoding.UTF8.GetBytes(new JavaScriptSerializer().Serialize(new {version=1,width=width}));stream.Write(bytes,0,bytes.Length);stream.Flush(true);}if(File.Exists(target))File.Replace(temporary,target,null);else File.Move(temporary,target);return true;}
            catch{return false;}finally{try{if(File.Exists(temporary))File.Delete(temporary);}catch{}}
        }
    }
    public sealed class DesktopGameWindowTracker : IDisposable {
        readonly Form window;
        readonly Timer timer = new Timer { Interval=250 };
        readonly GameWindowSession session = new GameWindowSession();
        readonly AddonPreferencesFile file;
        readonly Func<bool> taskbarNeedsFront;
        AddonWindowPreferences preferences;
        GameWindowObservation tracked;
        bool persistent, disposed, decisionOpen, manuallyHidden, dragging, hiddenByScreen;
        string status="searching", actualSide="off", published;
        IntPtr layerHandle;
        bool layerTopMost;
        DateTime nextDiscovery=DateTime.MinValue;
        public int PreferredWidth {get;private set;}
        public string PreferredDockSide {get{return preferences.DockSide;}}
        public bool IsAttached { get { return status=="attached"; } }
        bool FocusTargetValid {get{return !disposed&&tracked!=null&&tracked.Alive==true&&!tracked.Minimized&&Matches(tracked.Handle,tracked.ProcessId)&&IsWindowVisible(tracked.Handle)&&!IsIconic(tracked.Handle);}}
        public bool IsGameForeground {get{return FocusTargetValid&&GetForegroundWindow()==tracked.Handle;}}
        // A user mouse action may return focus only from this addon to its tracked game.
        // Never synthesize keys, activate an unrelated app, or undo a later Alt+Tab.
        public bool ReturnKeyboardToGame(){
            if(!FocusTargetValid||window.IsDisposed||!window.IsHandleCreated||!window.Visible||window.WindowState==FormWindowState.Minimized||GetAncestor(GetForegroundWindow(),2)!=window.Handle||Alive(tracked)!=true)return false;
            return SetForegroundWindow(tracked.Handle);
        }
        public Rectangle? ClientBounds {get{return tracked!=null&&tracked.Alive==true&&!tracked.Minimized&&Matches(tracked.Handle,tracked.ProcessId)?ClientFrame(tracked.Handle):null;}}
        Func<Rectangle,Rectangle,bool?,bool> presentationPlacement;
        Func<bool> independentPlacement;
        public void BindPresentation(Func<Rectangle,Rectangle,bool?,bool> placement,Func<bool> independent=null){presentationPlacement=placement;independentPlacement=independent;}
        public event EventHandler StateChanged, GameExited;
        public DesktopGameWindowTracker(Form window, string environment) : this(window, environment,
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"SANCTUM","IRIS",environment)) { }
        public DesktopGameWindowTracker(Form window, string environment, string preferencesRoot, Func<bool> taskbarNeedsFront = null) {
            if(window==null || (environment!="development" && environment!="production")) throw new ArgumentException();
            this.window=window; file=new AddonPreferencesFile(preferencesRoot); preferences=file.Load(out persistent);
            bool widthValid;PreferredWidth=file.LoadWidth(out widthValid);persistent=persistent&&widthValid;
            this.taskbarNeedsFront=taskbarNeedsFront??(()=>TaskbarNeedsFront(window.Handle));
            window.TopMost=false; timer.Tick+=(s,e)=>Tick(); timer.Start();
        }
        public object State() { return new {dockSide=preferences.DockSide,sameLayer=preferences.SameLayer,tracked=tracked!=null&&tracked.Alive==true,actualSide=actualSide,status=status,persistent=persistent}; }
        void Publish() {
            string current=new JavaScriptSerializer().Serialize(State()); if(current==published)return;
            published=current; if(StateChanged!=null)StateChanged(this,EventArgs.Empty);
        }
        public bool SetPreferences(AddonWindowPreferences value) {
            if(disposed||!AddonWindowPreferences.Valid(value))return false;
            preferences=new AddonWindowPreferences {DockSide=value.DockSide,SameLayer=value.SameLayer};
            persistent=file.Save(preferences); Tick(); Publish(); return true;
        }
        public void SetDecisionOpen(bool open) { decisionOpen=open; }
        public void SetDragging(bool value) { dragging=value; }
        public void RecordPreferredWidth(int width){if(disposed)return;PreferredWidth=Math.Max(360,Math.Min(720,width));persistent=file.SaveWidth(PreferredWidth)&&persistent;Tick();Publish();}
        public void RecordManualVisibility(bool hidden) { manuallyHidden=hidden; hiddenByScreen=false; session.ManualVisibility(); }
        public void DetachAfterDrag() { SetPreferences(new AddonWindowPreferences {DockSide="off",SameLayer=preferences.SameLayer}); }
        void Tick() {
            if(disposed||window.IsDisposed||!window.IsHandleCreated)return;
            try {
            if(dragging)return;
            if(tracked==null) {
                if(DateTime.UtcNow<nextDiscovery)return; nextDiscovery=DateTime.UtcNow.AddSeconds(1);
                bool unavailable; tracked=Discover(out unavailable); status=unavailable?"unavailable":"searching";
            } else {
                tracked.Alive=Alive(tracked);
                if(tracked.Alive==true) {
                    // Re-enumeration is limited to lost handles; cached handles are checked by PID and title.
                    if(!Matches(tracked.Handle,tracked.ProcessId))tracked.Handle=FindWindow(tracked.ProcessId);
                    tracked.Frame=Frame(tracked.Handle); tracked.Minimized=tracked.Handle!=IntPtr.Zero&&IsIconic(tracked.Handle);
                }
            }
            if(tracked==null) { actualSide="off";Publish();return; }
            var action=session.Observe(tracked,manuallyHidden,decisionOpen);
            if(action.RequestClose) {
                status="independent"; actualSide="off"; tracked=null; nextDiscovery=DateTime.UtcNow.AddSeconds(1);
                decisionOpen=true; Publish(); if(GameExited!=null)GameExited(this,EventArgs.Empty); return;
            }
            if(tracked.Alive!=true) {status="unavailable";actualSide="off";Publish();return;}
            if(decisionOpen) { Publish(); return; }
            if(action.Minimize)window.WindowState=FormWindowState.Minimized;
            if(action.Restore) {window.Show();window.WindowState=FormWindowState.Normal;}
            if(FollowGameVisibility()) {Publish();return;}
            if(tracked.Minimized||manuallyHidden||!window.Visible) {Publish();return;}
            if(!tracked.Frame.HasValue){status="unavailable";actualSide="off";Publish();return;}
            Rectangle frame=tracked.Frame.Value,work=Screen.FromRectangle(frame).WorkingArea;
            var monitor=Screen.FromRectangle(frame).Bounds;bool fills=frame.Left<=monitor.Left+2&&frame.Top<=monitor.Top+2&&frame.Right>=monitor.Right-2&&frame.Bottom>=monitor.Bottom-2;
            ApplyPlacement(frame,work,tracked.Handle==IntPtr.Zero?(bool?)null:IsZoomed(tracked.Handle)||fills);
            } finally { ApplySameLayer(GetForegroundWindow()); }
        }
        void ApplyPlacement(Rectangle frame,Rectangle work,bool? fullscreen){
            bool compactPlacement=presentationPlacement!=null&&presentationPlacement(frame,work,fullscreen);
            if(independentPlacement!=null&&independentPlacement()||compactPlacement&&fullscreen!=false){status="independent";actualSide="off";Publish();return;}
            var placement=AddonWindowPolicy.Place(frame,work,new Size(PreferredWidth,window.Height),preferences.DockSide,!compactPlacement);
            status=preferences.DockSide=="off"?"independent":placement.Attached?"attached":"no-space";actualSide=placement.ActualSide;
            if(placement.Attached) {
                window.MaximumSize=new Size(720,work.Height);
                if(window.Bounds!=placement.Bounds)SetWindowPos(window.Handle,IntPtr.Zero,placement.Bounds.X,placement.Bounds.Y,placement.Bounds.Width,placement.Bounds.Height,0x0014); // NOACTIVATE|NOZORDER
            }
            Publish();
        }
        bool FollowGameVisibility() {
            if(tracked==null||tracked.Alive!=true||!tracked.Frame.HasValue||decisionOpen)return hiddenByScreen;
            bool outside=preferences.DockSide!="off";
            if(outside)foreach(var screen in Screen.AllScreens)if(screen.Bounds.IntersectsWith(tracked.Frame.Value)){outside=false;break;}
            if(outside){if(!manuallyHidden){hiddenByScreen=true;window.Hide();}return true;}
            if(hiddenByScreen&&!tracked.Minimized){hiddenByScreen=false;if(!manuallyHidden)window.Show();}
            return hiddenByScreen;
        }
        void ApplySameLayer(IntPtr foreground) {
            if(disposed||window.IsDisposed||!window.IsHandleCreated)return;
            bool desired=!decisionOpen&&!manuallyHidden&&window.Visible&&window.WindowState!=FormWindowState.Minimized&&
                tracked!=null&&tracked.Alive==true&&!tracked.Minimized&&tracked.Frame.HasValue&&
                preferences.SameLayer&&(AddonWindowPolicy.ShouldKeepAbove(true,foreground,window.Handle,tracked.Handle)||IsDesktopBackground(foreground));
            if(desired&&taskbarNeedsFront())desired=false;
            SetLayer(desired);
            // HWND_NOTOPMOST leaves a demoted window at the front of ordinary windows.
            // Yield our own HWND behind the clicked app as well; never move/activate it.
            if(!desired&&preferences.SameLayer&&!decisionOpen&&!manuallyHidden&&window.Visible&&
                window.WindowState!=FormWindowState.Minimized&&tracked!=null&&tracked.Alive==true&&!tracked.Minimized&&
                foreground!=IntPtr.Zero&&foreground!=window.Handle&&foreground!=tracked.Handle&&IsWindow(foreground)&&!IsDesktopBackground(foreground)&&
                IsAbove(window.Handle,foreground)) {
                if(SetWindowPos(window.Handle,foreground,0,0,0,0,0x0213))layerTopMost=false;
            }
        }
        static bool IsDesktopBackground(IntPtr handle) {
            if(handle==IntPtr.Zero||!IsWindow(handle))return false;
            IntPtr root=GetAncestor(handle,2);if(root==IntPtr.Zero)root=handle;
            if(root==GetShellWindow())return true;
            var name=new StringBuilder(64);GetClassName(root,name,name.Capacity);
            return name.ToString()=="Progman"||name.ToString()=="WorkerW"||name.ToString()=="SHELLDLL_DefView";
        }
        static bool IsAbove(IntPtr own,IntPtr other) {
            int remaining=4096;
            for(IntPtr current=GetWindow(own,2);current!=IntPtr.Zero&&remaining-->0;current=GetWindow(current,2))
                if(current==other)return true;
            return false;
        }
        static bool TaskbarNeedsFront(IntPtr own) {
            // Read shell geometry only. Never move/activate the taskbar or change its settings.
            // All values below use physical coordinates, including mixed-DPI monitors.
            IntPtr previous=SetThreadDpiAwarenessContext(new IntPtr(-4));
            try {
                NativeRect ownRect;if(!GetWindowRect(own,out ownRect))return true;
                Rectangle addon=Rectangle.FromLTRB(ownRect.Left,ownRect.Top,ownRect.Right,ownRect.Bottom);
                NativePoint point;bool hasCursor=GetCursorPos(out point);
                Point cursor=hasCursor?new Point(point.X,point.Y):new Point(Int32.MinValue,Int32.MinValue);
                bool yield=false;
                EnumWindows((handle,unused)=>{
                    var name=new StringBuilder(64);GetClassName(handle,name,name.Capacity);
                    if((name.ToString()!="Shell_TrayWnd"&&name.ToString()!="Shell_SecondaryTrayWnd")||!IsWindowVisible(handle))return true;
                    var info=new NativeMonitor {Size=Marshal.SizeOf(typeof(NativeMonitor))};
                    NativeRect rect;if(!GetMonitorInfo(MonitorFromWindow(handle,2),ref info)||!GetWindowRect(handle,out rect)){yield=true;return false;}
                    Rectangle monitor=Rectangle.FromLTRB(info.Bounds.Left,info.Bounds.Top,info.Bounds.Right,info.Bounds.Bottom);
                    if(!monitor.IntersectsWith(addon))return true;
                    Rectangle bar=Rectangle.FromLTRB(rect.Left,rect.Top,rect.Right,rect.Bottom);
                    uint edge=bar.Width>=bar.Height?(uint)(bar.Top+bar.Height/2<monitor.Top+monitor.Height/2?1:3):(uint)(bar.Left+bar.Width/2<monitor.Left+monitor.Width/2?0:2);
                    bool autoHide=false;
                    for(uint side=0;side<4;side++) {
                        var data=new NativeAppBar {Size=(uint)Marshal.SizeOf(typeof(NativeAppBar)),Edge=side,Rect=info.Bounds};
                        if(SHAppBarMessage(11,ref data).ToUInt64()==unchecked((ulong)handle.ToInt64())){autoHide=true;edge=side;break;}
                    }
                    if(!autoHide){var state=new NativeAppBar {Size=(uint)Marshal.SizeOf(typeof(NativeAppBar))};autoHide=(SHAppBarMessage(4,ref state).ToUInt64()&1)!=0;}
                    yield=AddonWindowPolicy.YieldToTaskbar(monitor,bar,cursor,edge,autoHide,addon);
                    return !yield;
                },IntPtr.Zero);
                return yield;
            } catch {return true;}
            finally {if(previous!=IntPtr.Zero)SetThreadDpiAwarenessContext(previous);}
        }
        void SetLayer(bool desired) {
            if(window.IsDisposed||!window.IsHandleCreated)return;
            IntPtr own=window.Handle;
            if(layerHandle!=own){layerHandle=own;layerTopMost=false;}
            if(layerTopMost==desired)return;
            // HWND_TOP may succeed without moving an inactive process's window.
            // Scope topmost to game/addon foreground, clear it for every other app,
            // and never change the protected game's window or steal input focus.
            if(SetWindowPos(own,new IntPtr(desired?-1:-2),0,0,0,0,0x0213))layerTopMost=desired;
        }
        static bool? Alive(GameWindowObservation value) {
            try {using(var process=Process.GetProcessById(value.ProcessId)) {
                // .NET Framework HasExited requests SYNCHRONIZE access, which protected
                // games may deny. The readable start time already identifies this lifetime.
                return process.StartTime.ToUniversalTime().Ticks==value.StartedAtTicks; // PID reuse is old-session exit
            }} catch(ArgumentException){return false;}catch {return null;}
        }
        GameWindowObservation Discover(out bool unavailable) {
            unavailable=false; var found=new List<GameWindowObservation>(); bool denied=false;
            EnumWindows((handle,unused)=>{
                if(!IsWindowVisible(handle)||GetWindow(handle,4)!=IntPtr.Zero||Title(handle)!="마비노기 모바일")return true;
                uint pid;GetWindowThreadProcessId(handle,out pid);
                try {using(var process=Process.GetProcessById((int)pid)) {
                    if(process.ProcessName=="MabinogiMobile")found.Add(new GameWindowObservation {ProcessId=(int)pid,StartedAtTicks=process.StartTime.ToUniversalTime().Ticks,Alive=true,Handle=handle,Frame=Frame(handle),Minimized=IsIconic(handle)});
                }}catch {denied=true;}return true;
            },IntPtr.Zero);
            unavailable=denied||found.Count>1;return !unavailable&&found.Count==1?found[0]:null;
        }
        static IntPtr FindWindow(int pid) {
            IntPtr result=IntPtr.Zero;int count=0;EnumWindows((handle,unused)=>{if(Matches(handle,pid)&&IsWindowVisible(handle)&&GetWindow(handle,4)==IntPtr.Zero){count++;result=handle;}return true;},IntPtr.Zero);
            return count==1?result:IntPtr.Zero;
        }
        static bool Matches(IntPtr handle,int pid) {uint actual;return handle!=IntPtr.Zero&&IsWindow(handle)&&GetWindowThreadProcessId(handle,out actual)!=0&&actual==pid&&Title(handle)=="마비노기 모바일";}
        static string Title(IntPtr handle) {var text=new StringBuilder(160);GetWindowText(handle,text,text.Capacity);return text.ToString();}
        Rectangle? ClientFrame(IntPtr handle) {
            if(handle==IntPtr.Zero)return null;NativePoint top,bottom;
            // Ask Windows for the same coordinate space used by the addon Form, avoiding double scaling.
            var awareness=GetWindowDpiAwarenessContext(window.Handle);
            var previous=awareness!=IntPtr.Zero?SetThreadDpiAwarenessContext(awareness):IntPtr.Zero;
            try{
                NativeRect rect;if(!GetClientRect(handle,out rect)||rect.Right<=rect.Left||rect.Bottom<=rect.Top)return null;
                top=new NativePoint{X=rect.Left,Y=rect.Top};bottom=new NativePoint{X=rect.Right,Y=rect.Bottom};
                if(!ClientToScreen(handle,ref top)||!ClientToScreen(handle,ref bottom))return null;
            }finally{if(previous!=IntPtr.Zero)SetThreadDpiAwarenessContext(previous);}
            return Rectangle.FromLTRB(top.X,top.Y,bottom.X,bottom.Y);
        }
        Rectangle? Frame(IntPtr handle) {
            if(handle==IntPtr.Zero)return null;NativeRect rect;
            try {if(DwmGetWindowAttribute(handle,9,out rect,Marshal.SizeOf(typeof(NativeRect)))==0) {
                var top=new NativePoint {X=rect.Left,Y=rect.Top};var bottom=new NativePoint {X=rect.Right,Y=rect.Bottom};
                if(PhysicalToLogicalPointForPerMonitorDPI(window.Handle,ref top)&&PhysicalToLogicalPointForPerMonitorDPI(window.Handle,ref bottom))return Rectangle.FromLTRB(top.X,top.Y,bottom.X,bottom.Y);
            }}catch(EntryPointNotFoundException) { }
            return GetWindowRect(handle,out rect)?(Rectangle?)Rectangle.FromLTRB(rect.Left,rect.Top,rect.Right,rect.Bottom):null;
        }
        public void Dispose(){if(disposed)return;SetLayer(false);disposed=true;timer.Stop();timer.Dispose();}
        delegate bool EnumWindow(IntPtr handle,IntPtr parameter);
        [StructLayout(LayoutKind.Sequential)]struct NativeRect {public int Left,Top,Right,Bottom;}
        [StructLayout(LayoutKind.Sequential)]struct NativePoint {public int X,Y;}
        [StructLayout(LayoutKind.Sequential)]struct NativeMonitor {public int Size;public NativeRect Bounds,Work;public uint Flags;}
        [StructLayout(LayoutKind.Sequential)]struct NativeAppBar {public uint Size;public IntPtr Handle;public uint Callback,Edge;public NativeRect Rect;public IntPtr Parameter;}
        [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern int GetClassName(IntPtr handle,StringBuilder name,int count);
        [DllImport("user32.dll")]static extern bool GetCursorPos(out NativePoint point);
        [DllImport("user32.dll")]static extern IntPtr MonitorFromWindow(IntPtr handle,uint flags);
        [DllImport("user32.dll")]static extern bool GetMonitorInfo(IntPtr handle,ref NativeMonitor info);
        [DllImport("user32.dll")]static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
        [DllImport("user32.dll")]static extern IntPtr GetWindowDpiAwarenessContext(IntPtr handle);
        [DllImport("shell32.dll")]static extern UIntPtr SHAppBarMessage(uint message,ref NativeAppBar data);
        [DllImport("user32.dll")]static extern bool EnumWindows(EnumWindow callback,IntPtr parameter);
        [DllImport("user32.dll")]static extern bool IsWindow(IntPtr handle);
        [DllImport("user32.dll")]static extern bool IsWindowVisible(IntPtr handle);
        [DllImport("user32.dll")]static extern bool IsIconic(IntPtr handle);
        [DllImport("user32.dll")]static extern bool IsZoomed(IntPtr handle);
        [DllImport("user32.dll")]static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]static extern bool SetForegroundWindow(IntPtr handle);
        [DllImport("user32.dll")]static extern IntPtr GetShellWindow();
        [DllImport("user32.dll")]static extern IntPtr GetAncestor(IntPtr handle,uint flags);
        [DllImport("user32.dll")]static extern IntPtr GetWindow(IntPtr handle,uint command);
        [DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr handle,out uint pid);
        [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern int GetWindowText(IntPtr handle,StringBuilder text,int count);
        [DllImport("user32.dll")]static extern bool GetWindowRect(IntPtr handle,out NativeRect rect);
        [DllImport("user32.dll")]static extern bool GetClientRect(IntPtr handle,out NativeRect rect);
        [DllImport("user32.dll")]static extern bool ClientToScreen(IntPtr handle,ref NativePoint point);
        [DllImport("dwmapi.dll")]static extern int DwmGetWindowAttribute(IntPtr handle,uint attribute,out NativeRect rect,int size);
        [DllImport("user32.dll")]static extern bool PhysicalToLogicalPointForPerMonitorDPI(IntPtr handle,ref NativePoint point);
        [DllImport("user32.dll")]static extern bool SetWindowPos(IntPtr handle,IntPtr after,int x,int y,int width,int height,uint flags);
    }
}
