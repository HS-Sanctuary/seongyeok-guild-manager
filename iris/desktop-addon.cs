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
    }
    public sealed class DesktopGameWindowTracker : IDisposable {
        readonly Form window;
        readonly Timer timer = new Timer { Interval=250 };
        readonly GameWindowSession session = new GameWindowSession();
        readonly AddonPreferencesFile file;
        readonly Func<bool> taskbarNeedsFront;
        AddonWindowPreferences preferences;
        GameWindowObservation tracked;
        bool persistent, disposed, decisionOpen, manuallyHidden, dragging;
        string status="searching", actualSide="off", published;
        IntPtr layerHandle;
        bool layerTopMost;
        DateTime nextDiscovery=DateTime.MinValue;
        public bool IsAttached { get { return status=="attached"; } }
        public event EventHandler StateChanged, GameExited;
        public DesktopGameWindowTracker(Form window, string environment) : this(window, environment,
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"SANCTUM","IRIS",environment)) { }
        public DesktopGameWindowTracker(Form window, string environment, string preferencesRoot, Func<bool> taskbarNeedsFront = null) {
            if(window==null || (environment!="development" && environment!="production")) throw new ArgumentException();
            this.window=window; file=new AddonPreferencesFile(preferencesRoot); preferences=file.Load(out persistent);
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
        public void RecordManualVisibility(bool hidden) { manuallyHidden=hidden; session.ManualVisibility(); }
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
            if(tracked.Alive!=true||!tracked.Frame.HasValue) {status="unavailable";actualSide="off";Publish();return;}
            if(decisionOpen) { Publish(); return; }
            if(action.Minimize)window.WindowState=FormWindowState.Minimized;
            if(action.Restore) {window.Show();window.WindowState=FormWindowState.Normal;}
            if(tracked.Minimized||manuallyHidden||!window.Visible) {Publish();return;}
            Rectangle frame=tracked.Frame.Value,work=Screen.FromRectangle(frame).WorkingArea;
            var placement=AddonWindowPolicy.Place(frame,work,window.Size,preferences.DockSide);
            status=preferences.DockSide=="off"?"independent":placement.Attached?"attached":"no-space";actualSide=placement.ActualSide;
            if(placement.Attached) {
                window.MaximumSize=new Size(480,work.Height);
                if(window.Bounds!=placement.Bounds)SetWindowPos(window.Handle,IntPtr.Zero,placement.Bounds.X,placement.Bounds.Y,placement.Bounds.Width,placement.Bounds.Height,0x0014); // NOACTIVATE|NOZORDER
            }
            Publish();
            } finally { ApplySameLayer(GetForegroundWindow()); }
        }
        void ApplySameLayer(IntPtr foreground) {
            if(disposed||window.IsDisposed||!window.IsHandleCreated)return;
            bool desired=!decisionOpen&&!manuallyHidden&&window.Visible&&window.WindowState!=FormWindowState.Minimized&&
                tracked!=null&&tracked.Alive==true&&!tracked.Minimized&&tracked.Frame.HasValue&&
                AddonWindowPolicy.ShouldKeepAbove(preferences.SameLayer,foreground,window.Handle,tracked.Handle);
            if(desired&&taskbarNeedsFront())desired=false;
            SetLayer(desired);
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
        [DllImport("shell32.dll")]static extern UIntPtr SHAppBarMessage(uint message,ref NativeAppBar data);
        [DllImport("user32.dll")]static extern bool EnumWindows(EnumWindow callback,IntPtr parameter);
        [DllImport("user32.dll")]static extern bool IsWindow(IntPtr handle);
        [DllImport("user32.dll")]static extern bool IsWindowVisible(IntPtr handle);
        [DllImport("user32.dll")]static extern bool IsIconic(IntPtr handle);
        [DllImport("user32.dll")]static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]static extern IntPtr GetWindow(IntPtr handle,uint command);
        [DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr handle,out uint pid);
        [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern int GetWindowText(IntPtr handle,StringBuilder text,int count);
        [DllImport("user32.dll")]static extern bool GetWindowRect(IntPtr handle,out NativeRect rect);
        [DllImport("dwmapi.dll")]static extern int DwmGetWindowAttribute(IntPtr handle,uint attribute,out NativeRect rect,int size);
        [DllImport("user32.dll")]static extern bool PhysicalToLogicalPointForPerMonitorDPI(IntPtr handle,ref NativePoint point);
        [DllImport("user32.dll")]static extern bool SetWindowPos(IntPtr handle,IntPtr after,int x,int y,int width,int height,uint flags);
    }
}
