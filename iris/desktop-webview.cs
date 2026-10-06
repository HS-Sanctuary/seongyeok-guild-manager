using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Globalization;
using System.Web.Script.Serialization;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace IrisDesktop {
    // Candidate host only; not wired to the existing overlay or its launcher yet.
    public sealed class DesktopWebView : Form {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        static extern IntPtr LoadLibraryEx(string file, IntPtr reserved, uint flags);
        readonly bool development;
        readonly string profile;
        readonly DesktopStore store;
        bool lifecycle, allowClose, documentReady;
        public WebView2 Browser { get; private set; }
        public DesktopOverlayCoordinator Overlay {get;private set;}
        readonly Timer fitTimer=new Timer {Interval=500};bool fitting;
        [DllImport("user32.dll")] static extern bool ReleaseCapture();
        [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr h,int message,IntPtr w,IntPtr l);
        protected override bool ShowWithoutActivation {get{return true;}}
        public event EventHandler NavigationBlocked;

        public DesktopWebView(bool development, string profilePath) : this(development, profilePath, null) { }
        public DesktopWebView(bool development, string profilePath, DesktopStore store) {
            if (String.IsNullOrWhiteSpace(profilePath) || !Path.IsPathRooted(profilePath))
                throw new ArgumentException("Absolute dedicated profile path required", "profilePath");
            this.development = development;
            profile = Path.GetFullPath(profilePath);
            this.store = store;
            Text = "SANCTUM IRIS";
            Width = 420; Height = 640;MinimumSize=new Size(320,120);MaximumSize=new Size(480,Screen.PrimaryScreen.WorkingArea.Height);
            FormBorderStyle=FormBorderStyle.None;TopMost=true;ShowInTaskbar=false;StartPosition=FormStartPosition.Manual;
            Location=new Point(Screen.PrimaryScreen.WorkingArea.Right-Width-20,Screen.PrimaryScreen.WorkingArea.Top+40);
            Browser = new WebView2 { Dock = DockStyle.Fill };
            Controls.Add(Browser);
            var drag=new Panel {Dock=DockStyle.Top,Height=12,BackColor=Color.FromArgb(40,40,40),Cursor=Cursors.SizeAll};
            drag.MouseDown+=(s,e)=>{if(e.Button==MouseButtons.Left){ReleaseCapture();SendMessage(Handle,0xa1,new IntPtr(2),IntPtr.Zero);}};Controls.Add(drag);
            var resize=new Panel {Dock=DockStyle.Bottom,Height=8,BackColor=Color.FromArgb(40,40,40),Cursor=Cursors.SizeNWSE};
            resize.MouseDown+=(s,e)=>{if(e.Button==MouseButtons.Left){ReleaseCapture();SendMessage(Handle,0xa1,new IntPtr(17),IntPtr.Zero);}};Controls.Add(resize);
            Overlay=new DesktopOverlayCoordinator(this,Browser);
            fitTimer.Tick+=async(s,e)=>{if(fitting||!documentReady||!Visible||Browser.CoreWebView2==null)return;fitting=true;try{
                var source=Browser.CoreWebView2.Source;var result=await Browser.CoreWebView2.ExecuteScriptAsync("Math.ceil(document.querySelector('.iris-desktop')?.getBoundingClientRect().height||0)");int height;
                if(documentReady&&Browser.CoreWebView2.Source==source&&Int32.TryParse(result,NumberStyles.Integer,CultureInfo.InvariantCulture,out height)&&height>=60&&height<=20000){var bounds=Bounds;bounds.Height=height+20;Bounds=Overlay.ClampBounds(bounds,Screen.FromRectangle(bounds).WorkingArea);}
            }catch{/* No queue/auth changes when layout measurement fails. */}finally{fitting=false;}};fitTimer.Start();
        }

        public async Task InitializeAsync(string loaderPath) {
            if (!Path.IsPathRooted(loaderPath) || !File.Exists(loaderPath))
                throw new ArgumentException("Official SDK loader path required", "loaderPath");
            // Explicit absolute loader; no process/global PATH mutation or OS installation.
            if (LoadLibraryEx(Path.GetFullPath(loaderPath), IntPtr.Zero, 0x00000100) == IntPtr.Zero)
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
            var environment = await CoreWebView2Environment.CreateAsync(null, profile, null);
            await Browser.EnsureCoreWebView2Async(environment);
            var core = Browser.CoreWebView2;
            core.Settings.AreHostObjectsAllowed = false;
            core.Settings.IsWebMessageEnabled = false;
            core.Settings.AreDefaultScriptDialogsEnabled = false;
            core.Settings.AreDevToolsEnabled = development;
            core.NavigationStarting += GuardNavigation;
            core.FrameNavigationStarting += GuardNavigation;
            core.NewWindowRequested += (sender, e) => { e.Handled = true; };
            core.PermissionRequested += (sender, e) => { e.State = CoreWebView2PermissionState.Deny; };
            core.DownloadStarting += (sender, e) => { e.Cancel = true; };
            if (store != null) {
                var bridge = new DesktopBridge(store, development);
                bridge.BindOverlay(Overlay.State,Overlay.SetClickThrough,Overlay.SetOpacityPercent);
                Overlay.StateChanged+=(sender,e)=>{if(documentReady)core.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="overlay.changed",epoch=bridge.Epoch,state=Overlay.State()}));};
                bridge.HideRequested += (sender, e) => Hide();
                bridge.CloseRequested += (sender,e) => { allowClose = true; BeginInvoke(new Action(Close)); };
                // Runs before page scripts, so the completion announcement is never lost during hydration.
                await core.AddScriptToExecuteOnDocumentCreatedAsync("window.__irisDesktopBridge=null;chrome.webview.addEventListener('message',function(e){if(e.data&&e.data.version===1&&e.data.kind==='bridge.ready'){window.__irisDesktopBridge=e.data;window.dispatchEvent(new CustomEvent('iris-desktop-ready'));}if(e.data&&e.data.kind==='window.close.request')window.dispatchEvent(new CustomEvent('iris-desktop-close'));if(e.data&&e.data.kind==='overlay.changed')window.dispatchEvent(new CustomEvent('iris-overlay-state',{detail:e.data}));});");
                core.NavigationStarting += (sender, e) => { documentReady = false; bridge.Revoke(); core.Settings.IsWebMessageEnabled = false; };
                core.NavigationCompleted += (sender, e) => {
                    Uri source;
                    if (e.IsSuccess && Uri.TryCreate(core.Source, UriKind.Absolute, out source) && bridge.Activate(source)) {
                        core.Settings.IsWebMessageEnabled = true;
                        documentReady = true;
                        core.PostWebMessageAsJson("{\"version\":1,\"kind\":\"bridge.ready\",\"epoch\":" + bridge.Epoch +
                            ",\"environment\":\"" + (development ? "development" : "production") + "\"}");
                    }
                };
                core.WebMessageReceived += (sender, e) => {
                    Uri source;
                    if (Uri.TryCreate(e.Source, UriKind.Absolute, out source)) core.PostWebMessageAsJson(bridge.Handle(source, e.WebMessageAsJson));
                };
            }
        }

        public void ConfirmRecoveryClose() {
            Overlay.RestoreInteractive();
            if (MessageBox.Show(this,"보관 또는 화면 연결이 실패한 경우에만 사용해 주세요. 최근 변경을 잃을 수 있어요. 기존 보호 대기함을 덮어쓰지 않고 종료할까요?","SANCTUM IRIS · 복구 종료",MessageBoxButtons.YesNo,MessageBoxIcon.Warning) == DialogResult.Yes) {
                allowClose=true;BeginInvoke(new Action(Close));
            }
        }

        public void EnableDesktopLifecycle() {
            if (lifecycle || store == null) return;
            lifecycle = true;
            FormClosing += (sender,e) => {
                if (allowClose) return;
                e.Cancel = true;
                Overlay.RestoreInteractive();
                if (documentReady) Browser.CoreWebView2.PostWebMessageAsJson("{\"version\":1,\"kind\":\"window.close.request\"}");
                else if (MessageBox.Show(this, "화면에 연결할 수 없어요. 기존 대기함을 유지하고 종료할까요? 최근 편집이 보관되지 않았다면 복구 확인이 필요해요.", "SANCTUM IRIS", MessageBoxButtons.YesNo) == DialogResult.Yes) {
                    allowClose = true; BeginInvoke(new Action(Close));
                }
            };
        }

        protected override void Dispose(bool disposing){if(disposing){fitTimer.Stop();fitTimer.Dispose();if(Overlay!=null)Overlay.Dispose();}base.Dispose(disposing);}

        void GuardNavigation(object sender, CoreWebView2NavigationStartingEventArgs e) {
            Uri target;
            if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out target) ||
                !DesktopHostPolicy.ValidateNavigation(target, development)) {
                e.Cancel = true;
                var handler = NavigationBlocked;
                if (handler != null) handler(this, EventArgs.Empty);
            }
        }
    }
}
