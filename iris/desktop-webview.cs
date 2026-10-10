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
    // Dedicated addon host; the game remains an unrelated, independently owned window.
    public sealed class DesktopWebView : Form {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        static extern IntPtr LoadLibraryEx(string file, IntPtr reserved, uint flags);
        readonly bool development;
        readonly string profile;
        readonly DesktopStore store;
        bool lifecycle, allowClose, documentReady, closeDecision, dragPending;
        string pendingCloseReason;
        DateTime pendingCloseDeadline;
        DesktopBridge bridge;
        public WebView2 Browser { get; private set; }
        public DesktopOverlayCoordinator Overlay {get;private set;}
        public DesktopGameWindowTracker Addon {get;private set;}
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
            Text = "IRIS for SANCTUM";
            Width = 420; Height = 640;MinimumSize=new Size(320,120);MaximumSize=new Size(480,Screen.PrimaryScreen.WorkingArea.Height);
            FormBorderStyle=FormBorderStyle.None;TopMost=false;ShowInTaskbar=false;StartPosition=FormStartPosition.Manual;
            Location=new Point(Screen.PrimaryScreen.WorkingArea.Right-Width-20,Screen.PrimaryScreen.WorkingArea.Top+40);
            Browser = new WebView2 { Dock = DockStyle.Fill };
            Controls.Add(Browser);
            Addon=new DesktopGameWindowTracker(this,development?"development":"production",Path.GetDirectoryName(profile));
            Overlay=new DesktopOverlayCoordinator(this,Browser,true);
            Overlay.ManualVisibility+=Addon.RecordManualVisibility;
            Addon.StateChanged+=(s,e)=>{if(documentReady&&bridge!=null)Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="window.addon.changed",epoch=bridge.Epoch,environment=development?"development":"production",state=Addon.State()}));};
            Addon.GameExited+=(s,e)=>RequestClose("game-exit");
            fitTimer.Tick+=async(s,e)=>{if(pendingCloseReason!=null&&!documentReady&&DateTime.UtcNow>=pendingCloseDeadline){FallbackClose();return;}if(fitting||Addon.IsAttached||closeDecision||!documentReady||!Visible||Browser.CoreWebView2==null)return;fitting=true;try{
                var source=Browser.CoreWebView2.Source;var result=await Browser.CoreWebView2.ExecuteScriptAsync("Math.ceil(document.querySelector('.iris-desktop')?.getBoundingClientRect().height||0)");int height;
                if(documentReady&&Browser.CoreWebView2.Source==source&&Int32.TryParse(result,NumberStyles.Integer,CultureInfo.InvariantCulture,out height)&&height>=60&&height<=20000)FitContentHeight(height);
            }catch{/* No queue/auth changes when layout measurement fails. */}finally{fitting=false;}};fitTimer.Start();
        }

        void FitContentHeight(int height) {
            if(Addon.IsAttached||closeDecision)return;
            var bounds=Bounds;
            bounds.Height=height;
            MaximumSize=new Size(480,Screen.FromRectangle(bounds).WorkingArea.Height);
            Bounds=Overlay.ClampBounds(bounds,Screen.FromRectangle(bounds).WorkingArea);
        }
        void DragWindow() {
            if(IsDisposed||closeDecision||!documentReady)return;
            Rectangle before=Bounds;Addon.SetDragging(true);
            try {ReleaseCapture();SendMessage(Handle,0xa1,new IntPtr(2),IntPtr.Zero);}
            finally {Addon.SetDragging(false);if(Bounds.Location!=before.Location)Addon.DetachAfterDrag();}
        }
        void Decision(bool open) {closeDecision=open;Addon.SetDecisionOpen(open);if(!open)pendingCloseReason=null;}
        void PostCloseRequest() {
            if(!documentReady||bridge==null||pendingCloseReason==null)return;
            Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="window.close.request",epoch=bridge.Epoch,environment=development?"development":"production",reason=pendingCloseReason}));
        }
        void RequestClose(string reason) {
            if(allowClose||closeDecision)return;
            Decision(true);pendingCloseReason=reason;pendingCloseDeadline=DateTime.UtcNow.AddSeconds(10);Overlay.RestoreInteractive();
            if(documentReady)PostCloseRequest();
        }
        void FallbackClose() {
            pendingCloseDeadline=DateTime.MaxValue;
            if(MessageBox.Show(this,"화면에 연결할 수 없어요. 기존 보호 대기함을 유지하고 IRIS를 종료할까요? 최근 편집의 보관 여부는 확인할 수 없어요.","IRIS for SANCTUM",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)==DialogResult.Yes){allowClose=true;BeginInvoke(new Action(Close));}
            else Decision(false);
        }

        // Only the release bootstrap failure path may bypass close protection.
        // Never abort a loaded editing document or touch its protected store.
        public bool AbortUninitializedStartup() {
            if (documentReady || (Browser.Source != null && Browser.Source.AbsolutePath == "/iris/desktop")) return false;
            pendingCloseReason = null; allowClose = true; fitTimer.Stop(); Close();
            return true;
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
            core.NewWindowRequested += (sender, e) => {
                e.Handled = true;
                Uri source, target;
                // A user-clicked party-list link opens only the fixed same-environment route.
                // No arbitrary external URL, script popup, or WebView navigation is granted.
                if (documentReady && e.IsUserInitiated && Uri.TryCreate(core.Source, UriKind.Absolute, out source) &&
                    Uri.TryCreate(e.Uri, UriKind.Absolute, out target) && (DesktopHostPolicy.ValidatePartyExternal(source, target, development) || DesktopHostPolicy.ValidateHomeExternal(source, target, development))) {
                    try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(target.AbsoluteUri) { UseShellExecute = true }); }
                    catch { MessageBox.Show(this,"브라우저를 열지 못했어요. 생텀의 시낙시스 화면에서 파티 목록을 확인해주세요.","SANCTUM IRIS"); }
                }
            };
            core.PermissionRequested += (sender, e) => { e.State = CoreWebView2PermissionState.Deny; };
            core.DownloadStarting += (sender, e) => { e.Cancel = true; };
            if (store != null) {
                bridge = new DesktopBridge(store, development);
                bridge.BindGameStats(DesktopGameStatsReader.ReadAsync);
                bridge.BindCurrencies(DesktopGameStatsReader.ReadCurrenciesAsync);
                bridge.BindOverlay(Overlay.State,Overlay.SetClickThrough,Overlay.SetOpacityPercent);
                bridge.BindAddon(Addon.State,(side,layer)=>Addon.SetPreferences(new AddonWindowPreferences {DockSide=side,SameLayer=layer}),Decision);
                bridge.DragRequested+=(sender,e)=>{dragPending=true;};
                bridge.MinimizeRequested+=(sender,e)=>{if(!closeDecision){Addon.RecordManualVisibility(true);WindowState=FormWindowState.Minimized;}};
                Overlay.StateChanged+=(sender,e)=>{if(documentReady)core.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="overlay.changed",epoch=bridge.Epoch,state=Overlay.State()}));};
                bridge.HideRequested += (sender, e) => {Addon.RecordManualVisibility(true);Hide();};
                bridge.CloseRequested += (sender,e) => { allowClose = true; BeginInvoke(new Action(Close)); };
                // Runs before page scripts, so the completion announcement is never lost during hydration.
                await core.AddScriptToExecuteOnDocumentCreatedAsync("window.__irisDesktopBridge=null;window.__irisDesktopPendingClose=null;chrome.webview.addEventListener('message',function(e){var d=e.data;if(!d||d.version!==1)return;if(d.kind==='bridge.ready'&&Number.isSafeInteger(d.epoch)&&d.epoch>0&&['development','production'].includes(d.environment)){window.__irisDesktopBridge=d;window.dispatchEvent(new CustomEvent('iris-desktop-ready'));return;}var c=window.__irisDesktopBridge;if(!c||d.epoch!==c.epoch||d.environment!==c.environment)return;if(d.kind==='window.close.request'&&['manual','game-exit'].includes(d.reason)){window.__irisDesktopPendingClose=d;window.dispatchEvent(new CustomEvent('iris-desktop-close',{detail:d}));}if(d.kind==='window.addon.changed')window.dispatchEvent(new CustomEvent('iris-addon-state',{detail:d}));});");
                core.NavigationStarting += (sender, e) => { documentReady = false; bridge.Revoke(); core.Settings.IsWebMessageEnabled = false; };
                core.NavigationCompleted += (sender, e) => {
                    Uri source;
                    if (e.IsSuccess && Uri.TryCreate(core.Source, UriKind.Absolute, out source) && bridge.Activate(source)) {
                        core.Settings.IsWebMessageEnabled = true;
                        documentReady = true;
                        core.PostWebMessageAsJson("{\"version\":1,\"kind\":\"bridge.ready\",\"epoch\":" + bridge.Epoch +
                            ",\"environment\":\"" + (development ? "development" : "production") + "\"}");
                        PostCloseRequest();
                    }
                };
                core.WebMessageReceived += async (sender, e) => {
                    Uri source;
                    if (Uri.TryCreate(e.Source, UriKind.Absolute, out source)) {
                        var reply=await bridge.HandleAsync(source,e.WebMessageAsJson);
                        if(!IsDisposed&&documentReady)try{core.PostWebMessageAsJson(reply);if(dragPending){dragPending=false;BeginInvoke(new Action(DragWindow));}}catch{dragPending=false;/* Closed/navigated documents never receive a stale result. */}
                    }
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
                RequestClose("manual");
            };
        }

        protected override void Dispose(bool disposing){if(disposing){fitTimer.Stop();fitTimer.Dispose();if(Addon!=null)Addon.Dispose();if(Overlay!=null)Overlay.Dispose();}base.Dispose(disposing);}

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
