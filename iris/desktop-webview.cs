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
        Func<object> updateState,updateApply;Func<Task<object>> updateCheck,updatePrepare;
        public void BindUpdater(Func<object> state,Func<Task<object>> check,Func<Task<object>> prepare,Func<object> apply){if(development)throw new ArgumentException("Production updater only");updateState=state;updateCheck=check;updatePrepare=prepare;updateApply=apply;}
        public void NotifyUpdateChanged(){if(IsDisposed||!IsHandleCreated)return;if(InvokeRequired){try{BeginInvoke(new Action(NotifyUpdateChanged));}catch{}return;}if(documentReady&&bridge!=null&&updateState!=null)try{Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="window.update.changed",epoch=bridge.Epoch,environment="production",state=updateState()}));}catch{/* A closed/navigated document gets no updater event. */}}
        public WebView2 Browser { get; private set; }
        public DesktopOverlayCoordinator Overlay {get;private set;}
        public DesktopGameWindowTracker Addon {get;private set;}
        readonly Timer fitTimer=new Timer {Interval=500};bool fitting;
        bool resizing;Rectangle resizeStart;int resizePointer;bool resizeLeft;
        public DesktopPresentationState Presentation {get;private set;}
        Rectangle expandedBounds;bool lastCompact,lastPanel;int contentHeight=240,layoutRevision;
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
            Width = 420; Height = 640;MinimumSize=new Size(360,120);MaximumSize=new Size(720,Screen.PrimaryScreen.WorkingArea.Height);
            FormBorderStyle=FormBorderStyle.None;TopMost=false;ShowInTaskbar=false;StartPosition=FormStartPosition.Manual;
            Location=new Point(Screen.PrimaryScreen.WorkingArea.Right-Width-20,Screen.PrimaryScreen.WorkingArea.Top+40);
            Browser = new WebView2 { Dock = DockStyle.Fill };
            Controls.Add(Browser);
            Addon=new DesktopGameWindowTracker(this,development?"development":"production",Path.GetDirectoryName(profile));
            Width=Addon.PreferredWidth;
            Presentation=new DesktopPresentationState(Path.GetDirectoryName(profile));lastCompact=Presentation.Compact;expandedBounds=Bounds;
            Presentation.Changed+=(s,e)=>ApplyPresentation();
            Addon.BindPresentation((frame,work,fullscreen)=>{Presentation.ObserveFullscreen(fullscreen);if(!Presentation.Compact)return false;var bounds=Bounds;bounds.Width=Addon.PreferredWidth;bounds.Height=Presentation.PanelOpen||closeDecision?600:contentHeight;if(Presentation.AnchorGameCorner){bounds.X=Addon.PreferredDockSide=="left"?work.Left+8:work.Right-bounds.Width-8;bounds.Y=work.Top+8;}ApplyAnchoredBounds(bounds,work);return true;});
            Location=new Point(Screen.PrimaryScreen.WorkingArea.Right-Width-20,Screen.PrimaryScreen.WorkingArea.Top+40);
            AddResizeEdge(true);AddResizeEdge(false);
            Overlay=new DesktopOverlayCoordinator(this,Browser,true);
            Overlay.ManualVisibility+=Addon.RecordManualVisibility;
            Addon.StateChanged+=(s,e)=>{if(documentReady&&bridge!=null)Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="window.addon.changed",epoch=bridge.Epoch,environment=development?"development":"production",state=Addon.State()}));};
            Addon.GameExited+=(s,e)=>RequestClose("game-exit");
            fitTimer.Tick+=async(s,e)=>{if(pendingCloseReason!=null&&!documentReady&&DateTime.UtcNow>=pendingCloseDeadline){FallbackClose();return;}if(fitting||resizing||Addon.IsAttached||closeDecision||!Presentation.Compact||Presentation.PanelOpen||!documentReady||!Visible||Browser.CoreWebView2==null)return;fitting=true;try{
                var source=Browser.CoreWebView2.Source;int revision=layoutRevision;var result=await Browser.CoreWebView2.ExecuteScriptAsync("Math.ceil(document.querySelector('.iris-desktop')?.getBoundingClientRect().height||0)");int height;
                if(documentReady&&revision==layoutRevision&&Browser.CoreWebView2.Source==source&&Int32.TryParse(result,NumberStyles.Integer,CultureInfo.InvariantCulture,out height)&&height>=60&&height<=20000)FitContentHeight(height);
            }catch{/* No queue/auth changes when layout measurement fails. */}finally{fitting=false;}};fitTimer.Start();
        }

        void FitContentHeight(int height) {
            if(Addon.IsAttached||closeDecision||resizing||!Presentation.Compact||Presentation.PanelOpen)return;
            contentHeight=height;
            var bounds=Bounds;
            bounds.Width=Addon.PreferredWidth;
            bounds.Height=height;
            ApplyAnchoredBounds(bounds,Screen.FromRectangle(bounds).WorkingArea);
        }
        void ApplyAnchoredBounds(Rectangle bounds,Rectangle work){
            // Content gets only the space below the bar; growing a panel never moves its anchor upward.
            int width=Math.Min(Math.Max(360,bounds.Width),Math.Min(720,work.Width));
            int top=Math.Max(work.Top,Math.Min(bounds.Top,work.Bottom-120));
            int height=Math.Min(Math.Max(120,bounds.Height),work.Bottom-top);
            MaximumSize=new Size(720,work.Height);
            Bounds=new Rectangle(Math.Max(work.Left,Math.Min(bounds.Left,work.Right-width)),top,width,height);
        }
        void ApplyPresentation(){
            if(IsDisposed)return;
            layoutRevision++;
            if(Presentation.Compact&&lastPanel&&!Presentation.PanelOpen)contentHeight=240;
            lastPanel=Presentation.PanelOpen;
            if(Presentation.Compact!=lastCompact){if(Presentation.Compact){expandedBounds=Bounds;contentHeight=240;}else{var restored=expandedBounds;restored.Width=Addon.PreferredWidth;if(Presentation.ManuallyMoved)restored.Location=Location;Bounds=Overlay.ClampBounds(restored,Screen.FromRectangle(restored).WorkingArea);}lastCompact=Presentation.Compact;}
            if(Presentation.Compact){var work=Screen.FromRectangle(Bounds).WorkingArea;var bounds=Bounds;bounds.Height=Presentation.PanelOpen||closeDecision?600:contentHeight;ApplyAnchoredBounds(bounds,work);}
            if(documentReady&&bridge!=null&&Browser.CoreWebView2!=null)try{Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="window.presentation.changed",epoch=bridge.Epoch,environment=development?"development":"production",state=Presentation.State()}));}catch{}
        }
        protected override void OnSizeChanged(EventArgs e){base.OnSizeChanged(e);if(Width>1&&Height>1){float dpi=96;if(IsHandleCreated)using(var graphics=CreateGraphics())dpi=graphics.DpiX;var old=Region;Region=DesktopRoundedWindow.RegionFor(Size,dpi);if(old!=null)old.Dispose();}}
        protected override void OnHandleCreated(EventArgs e){base.OnHandleCreated(e);OnSizeChanged(EventArgs.Empty);}
        protected override void WndProc(ref Message message){base.WndProc(ref message);if(message.Msg==0x02e0)OnSizeChanged(EventArgs.Empty);}
        void AddResizeEdge(bool left){
            var edge=new Panel {Dock=left?DockStyle.Left:DockStyle.Right,Width=5,Cursor=Cursors.SizeWE,BackColor=Color.FromArgb(48,48,48),AccessibleName=left?"왼쪽 창 폭 조절":"오른쪽 창 폭 조절"};
            edge.MouseDown+=(s,e)=>{if(e.Button!=MouseButtons.Left||closeDecision)return;resizing=true;resizeStart=Bounds;resizePointer=Cursor.Position.X;resizeLeft=left;Addon.SetDragging(true);edge.Capture=true;};
            edge.MouseMove+=(s,e)=>{if(!resizing||!edge.Capture)return;int delta=Cursor.Position.X-resizePointer;int width=Math.Max(360,Math.Min(720,resizeStart.Width+(resizeLeft?-delta:delta)));Bounds=new Rectangle(resizeLeft?resizeStart.Right-width:resizeStart.Left,resizeStart.Top,width,resizeStart.Height);};
            edge.MouseUp+=(s,e)=>{if(e.Button==MouseButtons.Left)edge.Capture=false;};
            edge.MouseCaptureChanged+=(s,e)=>{if(!resizing||edge.Capture)return;resizing=false;Addon.SetDragging(false);Addon.RecordPreferredWidth(Width);};
            Controls.Add(edge);
        }
        void DragWindow() {
            if(IsDisposed||closeDecision||!documentReady)return;
            Rectangle before=Bounds;Addon.SetDragging(true);
            try {ReleaseCapture();SendMessage(Handle,0xa1,new IntPtr(2),IntPtr.Zero);}
            finally {Addon.SetDragging(false);if(Bounds.Location!=before.Location){Presentation.RecordManualMove();if(!Presentation.IsFullscreen)Addon.DetachAfterDrag();}}
        }
        void Decision(bool open) {closeDecision=open;Addon.SetDecisionOpen(open);ApplyPresentation();if(!open)pendingCloseReason=null;}
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
                    Uri.TryCreate(e.Uri, UriKind.Absolute, out target) && (DesktopHostPolicy.ValidatePartyExternal(source, target, development) || DesktopHostPolicy.ValidateHomeExternal(source, target, development) || DesktopHostPolicy.ValidateUpdateNotesExternal(source,target,development))) {
                    try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(target.AbsoluteUri) { UseShellExecute = true }); }
                    catch { MessageBox.Show(this,"브라우저를 열지 못했어요. 생텀의 시낙시스 화면에서 파티 목록을 확인해주세요.","SANCTUM IRIS"); }
                }
            };
            core.PermissionRequested += (sender, e) => { e.State = CoreWebView2PermissionState.Deny; };
            core.DownloadStarting += (sender, e) => { e.Cancel = true; };
            if (store != null) {
                bridge = new DesktopBridge(store, development);
                if(updateState!=null)bridge.BindUpdater(updateState,updateCheck,updatePrepare,updateApply);
                bridge.BindGameStats(DesktopGameStatsReader.ReadAsync);
                var installedFonts=new DesktopInstalledFonts();bridge.BindFonts(installedFonts.ReadAsync);
                var alertSound=new DesktopAlertSound();bridge.BindAlertSound(alertSound.Play);
                bridge.BindPresentation(Presentation.State,()=>{Presentation.Toggle();return Presentation.State();},open=>{Presentation.SetPanelOpen(open);return Presentation.State();});
                bridge.BindCurrencies(DesktopGameStatsReader.ReadCurrenciesAsync);
                bridge.BindOverlay(Overlay.State,Overlay.SetClickThrough,Overlay.SetOpacityPercent);
                bridge.BindAddon(Addon.State,(side,layer)=>Addon.SetPreferences(new AddonWindowPreferences {DockSide=side,SameLayer=layer}),Decision);
                bridge.DragRequested+=(sender,e)=>{dragPending=true;};
                bridge.MinimizeRequested+=(sender,e)=>{if(!closeDecision){Addon.RecordManualVisibility(true);WindowState=FormWindowState.Minimized;}};
                Overlay.StateChanged+=(sender,e)=>{if(documentReady)core.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="overlay.changed",epoch=bridge.Epoch,state=Overlay.State()}));};
                bridge.HideRequested += (sender, e) => {Addon.RecordManualVisibility(true);Hide();};
                bridge.CloseRequested += (sender,e) => { allowClose = true; BeginInvoke(new Action(Close)); };
                // Runs before page scripts, so the completion announcement is never lost during hydration.
                await core.AddScriptToExecuteOnDocumentCreatedAsync("window.__irisDesktopBridge=null;window.__irisDesktopPendingClose=null;chrome.webview.addEventListener('message',function(e){var d=e.data;if(!d||d.version!==1)return;if(d.kind==='bridge.ready'&&Number.isSafeInteger(d.epoch)&&d.epoch>0&&['development','production'].includes(d.environment)){window.__irisDesktopBridge=d;window.dispatchEvent(new CustomEvent('iris-desktop-ready'));return;}var c=window.__irisDesktopBridge;if(!c||d.epoch!==c.epoch||d.environment!==c.environment)return;if(d.kind==='window.close.request'&&['manual','game-exit'].includes(d.reason)){window.__irisDesktopPendingClose=d;window.dispatchEvent(new CustomEvent('iris-desktop-close',{detail:d}));}if(d.kind==='window.addon.changed')window.dispatchEvent(new CustomEvent('iris-addon-state',{detail:d}));if(d.kind==='window.presentation.changed')window.dispatchEvent(new CustomEvent('iris-presentation-state',{detail:d}));if(d.kind==='window.update.changed')window.dispatchEvent(new CustomEvent('iris-update-state',{detail:d}));});");
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
