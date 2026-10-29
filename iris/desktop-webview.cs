using System;
using System.Collections.Generic;
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
    public sealed partial class DesktopWebView : Form {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        static extern IntPtr LoadLibraryEx(string file, IntPtr reserved, uint flags);
        readonly bool development;
        readonly string profile;
        readonly DesktopStore store;
        bool lifecycle, allowClose, documentReady, closeDecision, dragPending;
        string pendingCloseReason;
        DateTime pendingCloseDeadline;
        DesktopBridge bridge;
        DesktopLifeExecutor lifeActor;
        Func<object> updateState,updateApply;Func<Task<object>> updateCheck,updatePrepare;
        public void BindUpdater(Func<object> state,Func<Task<object>> check,Func<Task<object>> prepare,Func<object> apply){if(development)throw new ArgumentException("Production updater only");updateState=state;updateCheck=check;updatePrepare=prepare;updateApply=apply;}
        bool LifeActionAllowed(){return documentReady&&Visible&&WindowState!=FormWindowState.Minimized&&!closeDecision&&!allowClose;}
        bool AuthorizeCollection(object value){
            if(IsDisposed||Disposing)return false;if(InvokeRequired)return (bool)Invoke(new Func<bool>(()=>AuthorizeCollection(value)));if(!LifeActionAllowed())return false;
            var row=DesktopLifePolicy.Plain(value);
            return MessageBox.Show(this,"생텀 계정: "+row["accountLabel"]+"\n\n이 PC에서 시설 수령 버튼을 누르면, 게임에 현재 접속한 캐릭터가 해당 시설로 이동해 완료품 전체를 받도록 허용할까요?\n선택한 생텀 캐릭터와 실제 게임 캐릭터가 같은지는 직접 확인해 주세요.\n\n수령 비용은 아직 실측 전이에요. 채집·제작·재등록·자동 반복은 허용하지 않아요. 다른 자동화 프로그램과 동시에 실행하지 마세요.\n\n이 허용은 다음 실행에도 유지되며 수령 안내에서 끌 수 있어요.","IRIS · 원클릭 수령 허용",MessageBoxButtons.OKCancel,MessageBoxIcon.Question,MessageBoxDefaultButton.Button2)==DialogResult.OK;
        }
        Task<bool> ConfirmProgressQuantityAsync(ProgressQuantityPreview preview){
            return DesktopLifeProgressApproval.RequestAsync(this,()=>{
                if(!LifeActionAllowed())return false;
                var previous=preview.previousQuantity.HasValue?preview.previousQuantity.Value.ToString():"미확인";
                var expected=preview.expectedOutput.HasValue?preview.expectedOutput.Value.ToString():"미확인";
                var message="생텀 계정: "+preview.accountLabel+"\n캐릭터: "+preview.characterLabel+"\n품목: "+preview.displayName+"\n이번 요청: "+preview.requestId+"\n\n참고 예상 산출: "+expected+"개\n기존 확인: "+previous+" → 새 확인: "+preview.quantity+"개";
                if(preview.reason!=null)message+="\n정정 사유: "+preview.reason;
                message+="\n\n이번 요청으로 추가 확보한 수량이 맞나요?\n사용자 확인 기록으로 저장하며 공식 보상 검증이나 현재 가방 재고가 아니에요.\n이 확인으로 게임 행동을 시작하거나 unknown 보호를 해제하지 않아요.";
                return MessageBox.Show(this,message,"IRIS · 제작 수량 재확인",MessageBoxButtons.OKCancel,MessageBoxIcon.Question,MessageBoxDefaultButton.Button2)==DialogResult.OK;
            });
        }
        Task<bool> ConfirmManualWoodAsync(ManualWoodPreview preview){
            return DesktopLifeProgressApproval.RequestAsync(this,()=>{
                if(!LifeActionAllowed())return false;
                var message="생텀 계정: "+preview.accountLabel+"\n캐릭터: "+preview.characterLabel+"\n품목: "+preview.displayName+" · 추가 목표 "+preview.targetQuantity+"개\n\n이번 수령 확인: "+preview.quantity+"개";
                if(preview.previousQuantity.HasValue)message+="\n기존 기록 "+preview.previousQuantity.Value+"개를 교체해요.";
                if(preview.reason!=null)message+="\n정정 사유: "+preview.reason;
                message+="\n\n가방 총보유량이 아닌, 직접 수령한 추가 확보량이 맞나요?\n사용자 직접 확인으로 저장해요. 공식 수령 증명이나 게임 실행 승인이 아니에요.";
                return MessageBox.Show(this,message,"IRIS · 가공 수령량 확인",MessageBoxButtons.OKCancel,MessageBoxIcon.Question,MessageBoxDefaultButton.Button2)==DialogResult.OK;
            });
        }
        Task<bool> ConfirmLifeActionAsync(object preview){
            return DesktopLifeProgressApproval.RequestAsync(this,()=>ConfirmLifeAction(preview));
        }
        bool ConfirmLifeAction(object preview){
            if(IsDisposed||Disposing)return false;
            if(InvokeRequired)return (bool)Invoke(new Func<bool>(()=>ConfirmLifeAction(preview)));
            if(!LifeActionAllowed())return false;
            var row=DesktopLifePolicy.Plain(preview);
            var action=(string)row["action"];
            var label=action=="gathering"?"채집":action=="altering"?"가공 등록":action=="crafting"?"제작":"가공 완료품 모두 받기";
            var cost=row["expectedWings"]==null?"날개 소모량 미확인":Convert.ToString(row["expectedWings"])+"개";
            var message="생텀 계정: "+row["accountLabel"]+"\n선택 캐릭터: "+row["characterLabel"]+"\n게임 화면의 실제 캐릭터가 같은지 직접 확인해 주세요.\n\n"+label+": "+row["displayName"]+"\n예상 날개: "+cost+" / 최근 조회 보유: "+row["wings"]+"개";
            if(action=="crafting"&&row.ContainsKey("crafting")){var quantity=DesktopLifePolicy.Object(row["crafting"]);message+="\n제작 횟수: "+quantity["craftCount"]+"회 / 예상 결과물: "+quantity["expectedOutput"]+"개\n여러 횟수를 한 명령으로 요청해요. 재료가 부족하거나 시설 한도를 넘으면 거절될 수 있어요.";}
            if(action=="gathering"&&row.ContainsKey("gathering")){
                var goal=DesktopLifePolicy.Object(row["gathering"]);
                message+="\n가방 시작 "+goal["beforeOwned"]+"개 + 추가 "+goal["additionalQuantity"]+"개 → 목표 "+goal["targetOwned"]+"개";
                message+=(bool)goal["allowAutoStop"]?"\n목표 확보 시 현재 채집 중지를 요청해요.":"\n목표 자동 중지는 꺼져 있어요. 최대 100개까지 계속 캘 수 있어요.";
                message+="\n벌목 묶음·조회 지연으로 목표보다 더 캘 수 있어요.\n작업 중 다른 자동화 앱·연주·수동 행동을 함께 사용하지 마세요. 중지 명령은 현재 게임 행동에 영향을 줄 수 있어요.";
            }
            if(action=="collect"){
                var completed=row["completed"] as object[];
                message+="\n\n"+row["facility"]+" 시설의 완료품 전체를 수령해요. 확인 이후 새로 완료된 품목도 함께 받을 수 있어요.";
                if(completed!=null)foreach(var item in completed){var entry=item as System.Collections.Generic.Dictionary<string,object>;if(entry!=null)message+="\n· "+entry["displayName"]+" × "+entry["count"];}
                message+="\n수령 비용을 확인할 수 없어요. 게임 화면도 확인해 주세요.";
            }
            message+="\n\n한 번 실행하면 결과를 확인하기 전 자동 재시도하지 않아요. 이 작업을 시작할까요?";
            return MessageBox.Show(this,message,"에르곤 작업 최종 확인",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)==DialogResult.Yes;
        }
        public void NotifyUpdateChanged(){if(IsDisposed||!IsHandleCreated)return;if(InvokeRequired){try{BeginInvoke(new Action(NotifyUpdateChanged));}catch{}return;}if(documentReady&&bridge!=null&&updateState!=null)try{Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="window.update.changed",epoch=bridge.Epoch,environment="production",state=updateState()}));}catch{/* A closed/navigated document gets no updater event. */}}
        public WebView2 Browser { get; private set; }
        public DesktopOverlayCoordinator Overlay {get;private set;}
        public DesktopGameWindowTracker Addon {get;private set;}
        readonly Timer fitTimer=new Timer {Interval=500};bool fitting;
        bool resizing;Rectangle resizeStart;int resizePointer;bool resizeLeft;
        public DesktopPresentationState Presentation {get;private set;}
        Rectangle expandedBounds;bool lastCompact,lastPanel;int contentHeight=240,layoutRevision;
        Rectangle workspaceBounds;bool workspaceExpanded;
        object SetWorkspace(bool expanded){
            if(expanded&&(!LifeActionAllowed()||FloatingModalOpen||Presentation.Compact&&!floatingMode||lifeActor!=null&&lifeActor.Busy))throw new ArgumentException();
            if(floatingMode){workspaceExpanded=expanded;ApplyFloatingLayout(true);return new {expanded=workspaceExpanded};}
            if(expanded!=workspaceExpanded){
                var work=Screen.FromRectangle(Bounds).WorkingArea;
                if(expanded){workspaceBounds=Bounds;workspaceExpanded=true;MaximumSize=new Size(1240,work.Height);Bounds=DesktopWorkspaceLayout.Expand(Bounds,work);}
                else{workspaceExpanded=false;MaximumSize=new Size(720,work.Height);Bounds=DesktopWorkspaceLayout.Restore(workspaceBounds,work);}
            }
            return new {expanded=workspaceExpanded};
        }
        [DllImport("user32.dll")] static extern bool ReleaseCapture();
        [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr h,int message,IntPtr w,IntPtr l);
        [StructLayout(LayoutKind.Sequential)]struct MovingRectangle {public int Left,Top,Right,Bottom;}
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
            Addon.BindPresentation((frame,work,fullscreen)=>{Presentation.ObserveFullscreen(fullscreen);if(floatingSnapshot!=null&&floatingMode){ApplyFloatingLayout(true);return true;}if(workspaceExpanded){Bounds=DesktopWorkspaceLayout.Restore(Bounds,work);return true;}return false;},()=>workspaceExpanded||floatingMode);
            Location=new Point(Screen.PrimaryScreen.WorkingArea.Right-Width-20,Screen.PrimaryScreen.WorkingArea.Top+40);
            AddResizeEdge(true);AddResizeEdge(false);
            Overlay=new DesktopOverlayCoordinator(this,Browser,true);
            InitializeFloating();
            Overlay.ManualVisibility+=Addon.RecordManualVisibility;
            Addon.StateChanged+=(s,e)=>{if(documentReady&&bridge!=null)Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="window.addon.changed",epoch=bridge.Epoch,environment=development?"development":"production",state=Addon.State()}));};
            Addon.GameExited+=(s,e)=>RequestClose("game-exit");
            fitTimer.Tick+=async(s,e)=>{if(pendingCloseReason!=null&&!documentReady&&DateTime.UtcNow>=pendingCloseDeadline){FallbackClose();return;}if(floatingSnapshot!=null){await MeasureFloatingDialogAsync();return;}if(fitting||resizing||Addon.IsAttached||closeDecision||!Presentation.Compact||Presentation.PanelOpen||!documentReady||!Visible||Browser.CoreWebView2==null)return;fitting=true;try{
                var source=Browser.CoreWebView2.Source;int revision=layoutRevision;var result=await Browser.CoreWebView2.ExecuteScriptAsync("Math.ceil(document.querySelector('.iris-desktop')?.getBoundingClientRect().height||0)");int height;
                if(documentReady&&revision==layoutRevision&&Browser.CoreWebView2.Source==source&&Int32.TryParse(result,NumberStyles.Integer,CultureInfo.InvariantCulture,out height)&&height>=60&&height<=20000)FitContentHeight(height);
            }catch{/* No queue/auth changes when layout measurement fails. */}finally{fitting=false;}};fitTimer.Start();
        }

        void FitContentHeight(int height) {
            if(floatingSnapshot!=null)return;
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
            if(floatingSnapshot!=null){if(Presentation.Compact!=floatingMode)SetFloatingMode(Presentation.Compact);else ApplyFloatingLayout(true);return;}
            if(Presentation.Compact&&workspaceExpanded)SetWorkspace(false);
            layoutRevision++;
            if(Presentation.Compact&&lastPanel&&!Presentation.PanelOpen)contentHeight=240;
            lastPanel=Presentation.PanelOpen;
            if(Presentation.Compact!=lastCompact){if(Presentation.Compact){expandedBounds=Bounds;contentHeight=240;}else{var restored=expandedBounds;restored.Width=Addon.PreferredWidth;if(Presentation.ManuallyMoved)restored.Location=Location;Bounds=Overlay.ClampBounds(restored,Screen.FromRectangle(restored).WorkingArea);}lastCompact=Presentation.Compact;}
            if(Presentation.Compact){var work=Screen.FromRectangle(Bounds).WorkingArea;var bounds=Bounds;bounds.Height=Presentation.PanelOpen||closeDecision?600:contentHeight;ApplyAnchoredBounds(bounds,work);}
            if(documentReady&&bridge!=null&&Browser.CoreWebView2!=null)try{Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="window.presentation.changed",epoch=bridge.Epoch,environment=development?"development":"production",state=Presentation.State()}));}catch{}
        }
        protected override void OnSizeChanged(EventArgs e){base.OnSizeChanged(e);if(floatingMode){if(floatingLayout!=null)ReplaceRegion(floatingLayout.CreateRegion());return;}if(Width>1&&Height>1){float dpi=96;if(IsHandleCreated)using(var graphics=CreateGraphics())dpi=graphics.DpiX;ReplaceRegion(DesktopRoundedWindow.RegionFor(Size,dpi));}}
        protected override void OnHandleCreated(EventArgs e){base.OnHandleCreated(e);OnSizeChanged(EventArgs.Empty);RegisterFloatingHotkey();}
        protected override void OnHandleDestroyed(EventArgs e){if(floatingHotkey!=null)floatingHotkey.Dispose();floatingHotkey=null;base.OnHandleDestroyed(e);}
        protected override void WndProc(ref Message message){
            if(message.Msg==0x0112&&(message.WParam.ToInt64()&0xfff0)==0xf020&&floatingSnapshot!=null){MinimizeToFloating();return;}
            if(message.Msg==0x0216&&message.LParam!=IntPtr.Zero&&floatingMode){
                var rect=(MovingRectangle)Marshal.PtrToStructure(message.LParam,typeof(MovingRectangle));
                var moved=ConstrainFloatingDrag(Rectangle.FromLTRB(rect.Left,rect.Top,rect.Right,rect.Bottom));var bounded=moved.Bounds;
                // Publish the live drag anchor before resize/state callbacks can reapply the old one.
                floatingSnapshot.FloatingAnchor=new Point(bounded.Left+moved.Anchor.Left,bounded.Top+moved.Anchor.Top);floatingLayout=moved;
                rect.Left=bounded.Left;rect.Top=bounded.Top;rect.Right=bounded.Right;rect.Bottom=bounded.Bottom;
                Marshal.StructureToPtr(rect,message.LParam,false);message.Result=new IntPtr(1);return;
            }
            if(message.Msg==0x0312&&floatingHotkey!=null){floatingHotkey.Dispatch(message.WParam.ToInt32());return;}
            base.WndProc(ref message);if(message.Msg==0x02e0&&floatingSnapshot!=null)ApplyFloatingLayout(true);
        }
        void AddResizeEdge(bool left){
            var edge=new Panel {Dock=left?DockStyle.Left:DockStyle.Right,Width=5,Cursor=Cursors.SizeWE,BackColor=Color.FromArgb(48,48,48),AccessibleName=left?"왼쪽 창 폭 조절":"오른쪽 창 폭 조절"};
            edge.MouseDown+=(s,e)=>{if(floatingMode||e.Button!=MouseButtons.Left||closeDecision)return;resizing=true;resizeStart=Bounds;resizePointer=Cursor.Position.X;resizeLeft=left;Addon.SetDragging(true);edge.Capture=true;};
            edge.MouseMove+=(s,e)=>{if(!resizing||!edge.Capture)return;int delta=Cursor.Position.X-resizePointer;int width=Math.Max(360,Math.Min(workspaceExpanded?1240:720,resizeStart.Width+(resizeLeft?-delta:delta)));Bounds=new Rectangle(resizeLeft?resizeStart.Right-width:resizeStart.Left,resizeStart.Top,width,resizeStart.Height);};
            edge.MouseUp+=(s,e)=>{if(e.Button==MouseButtons.Left)edge.Capture=false;};
            edge.MouseCaptureChanged+=(s,e)=>{if(!resizing||edge.Capture)return;resizing=false;Addon.SetDragging(false);if(!workspaceExpanded)Addon.RecordPreferredWidth(Width);};
            edge.Visible=!floatingMode;Controls.Add(edge);
        }
        void DragWindow() {
            if(IsDisposed||FloatingModalOpen||!documentReady)return;
            if(floatingMode){floatingMenu=false;floatingSurface="none";ApplyFloatingLayout(true);}
            Rectangle before=Bounds;Addon.SetDragging(true);
            try {ReleaseCapture();SendMessage(Handle,0xa1,new IntPtr(2),IntPtr.Zero);}
            finally {Addon.SetDragging(false);if(Bounds.Location!=before.Location){if(floatingMode&&floatingLayout!=null){floatingSnapshot.FloatingAnchor=new Point(Left+floatingLayout.Anchor.Left,Top+floatingLayout.Anchor.Top);ApplyFloatingLayout(true);SaveFloating();}else{SaveFloatingNormal();Presentation.RecordManualMove();if(!Presentation.IsFullscreen)Addon.DetachAfterDrag();}}}
        }
        void Decision(bool open) {closeDecision=open;Addon.SetDecisionOpen(open);ApplyPresentation();if(!open)pendingCloseReason=null;}
        void PostCloseRequest() {
            if(!documentReady||bridge==null||pendingCloseReason==null)return;
            Browser.CoreWebView2.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="window.close.request",epoch=bridge.Epoch,environment=development?"development":"production",reason=pendingCloseReason}));
        }
        void RequestClose(string reason) {
            if(allowClose||closeDecision)return;
            if(lifeActor!=null&&lifeActor.Busy){MessageBox.Show(this,"게임 작업 응답을 확인 중이에요. 작업 결과가 표시된 뒤 종료해 주세요. 응답이 끊기면 재실행 때 결과 미확정으로 보호해요.","IRIS for SANCTUM",MessageBoxButtons.OK,MessageBoxIcon.Information);return;}
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
            InitializeOnline();
            if (store != null) {
                bridge = new DesktopBridge(store, development);
                if(updateState!=null)bridge.BindUpdater(updateState,updateCheck,updatePrepare,updateApply);
                bridge.BindGameStats(DesktopGameStatsReader.ReadAsync);
                var installedFonts=new DesktopInstalledFonts();bridge.BindFonts(installedFonts.ReadAsync);
                var alertSound=new DesktopAlertSound();bridge.BindAlertSound(alertSound.Play);
                bridge.BindPresentation(Presentation.State,()=>{Presentation.Toggle();return Presentation.State();},open=>{Presentation.SetPanelOpen(open);return Presentation.State();});
                bridge.BindFloating(FloatingState,FloatingCommand,FloatingNotice,FloatingPreferencesChange);
                bridge.BindGameFocus(ReturnGameFocus);
                bridge.BindWorkspace(SetWorkspace);
                bridge.BindCurrencies(DesktopGameStatsReader.ReadCurrenciesAsync);
                var currencyCache=new DesktopCurrencyStore(Path.GetDirectoryName(Path.GetDirectoryName(store.FilePath)),development?"development":"production");
                bridge.BindCurrencyCache(account=>{var json=currencyCache.Load(account);return json==null?null:new JavaScriptSerializer().DeserializeObject(json);},async account=>{
                    var ownerBridge=bridge;var ownerEpoch=ownerBridge.Epoch;
                    var json=await currencyCache.RefreshAsync(account,DesktopGameStatsReader.ReadCurrenciesAsync,()=>ReferenceEquals(bridge,ownerBridge)&&ownerEpoch==ownerBridge.Epoch&&documentReady);
                    return new JavaScriptSerializer().DeserializeObject(json);
                });
                bridge.BindLifeRead(async kind=>{if(!Visible||WindowState==FormWindowState.Minimized||closeDecision)throw new ArgumentException();return await DesktopLifeReader.ReadAsync(kind);});
                bridge.BindLifeReference((kind,name)=>{if(!LifeActionAllowed())throw new ArgumentException();return DesktopLifeReference.Read(kind,name);});
                try {
                    var journalRoot=Path.GetDirectoryName(Path.GetDirectoryName(store.FilePath));
                    var lifeJournal=new DesktopLifeJournal(journalRoot,development?"development":"production");
                    DesktopLifeEvidenceProvider lifeEvidence=null;
                    Func<string,string,Task<string>> observedPerform=async(action,name)=>{
                        Dictionary<string,object> origin=null;
                        if(action=="collect")try{origin=lifeActor.ProgressContext();}catch{}
                        var response=await DesktopLifeCli.PerformAsync(action,name);
                        // Reporting is non-authoritative and cannot change execution/terminal handling.
                        if(action=="collect"&&origin!=null&&lifeEvidence!=null)try{lifeEvidence.ReportCollection(origin,response);}catch{}
                        return response;
                    };
                    lifeActor=new DesktopLifeExecutor(lifeJournal,DesktopLifeReader.ReadAsync,DesktopGameStatsReader.ReadCurrenciesAsync,DesktopLifeCli.ReadNamedItemsAsync,observedPerform,ConfirmLifeAction,
                        ()=>!IsDisposed&&!Disposing&&((!InvokeRequired)?LifeActionAllowed():(bool)Invoke(new Func<bool>(LifeActionAllowed))),()=>bridge.Epoch,()=>DateTime.UtcNow);
                    lifeActor.BindStop(DesktopLifeCli.StopAsync);
                    lifeActor.BindCraft(DesktopLifeCli.CraftAsync);
                    lifeActor.BindCollectionAutomation(new DesktopLifeAutomationStore(journalRoot,development?"development":"production"),AuthorizeCollection,()=>DesktopCliActivity.ProbeAsync(()=>DesktopLifeReader.ReadAsync("activity")));
                    lifeActor.BindCollectionReadWait(bridge.WaitForCollectionReadsAsync);
                    lifeActor.BindProgressApproval(ConfirmLifeActionAsync);
                    var lifeProgress=new DesktopLifeProgressConnection(lifeActor,lifeJournal,new DesktopErgonProgressStore(journalRoot,development?"development":"production"),()=>DesktopLifePolicy.Time(DateTime.UtcNow));
                    lifeProgress.BindQuantityApproval(ConfirmProgressQuantityAsync);
                    lifeEvidence=new DesktopLifeEvidenceProvider(development?"development":"production",lifeActor.ProgressContext,lifeActor.State,DesktopLifeReader.ReadAsync,()=>!IsDisposed&&!Disposing&&Visible&&WindowState!=FormWindowState.Minimized&&!closeDecision,()=>DesktopLifePolicy.Time(DateTime.UtcNow));
                    bridge.BindLifeEvidence(lifeEvidence.ReadAsync);
                    var woodProgress=new DesktopWoodProgressConnection(journalRoot,development?"development":"production",lifeJournal,new DesktopErgonProgressStore(journalRoot,development?"development":"production"),lifeActor.ProgressContext,lifeActor.ProgressMutationAsync,lifeEvidence.ReadAsync);
                    lifeProgress.BindManualWoodApproval(ConfirmManualWoodAsync,woodProgress.ManualHealthy);
                    bridge.BindLifeActions(lifeActor.Capabilities,(method,payload)=>{
                        switch(method){
                            case "game.life.actions.context":return lifeActor.SetContext(payload);
                            case "game.life.actions.cancel":return lifeActor.CancelPrepared(payload);
                            case "game.life.actions.state":return lifeActor.State();
                            case "game.life.actions.history":return lifeActor.History(payload);
                            case "game.life.actions.collectionPolicy":return lifeActor.CollectionPolicy(payload);
                            case "game.life.actions.revokeCollection":return lifeActor.RevokeCollection(payload);
                            case "game.life.actions.collectionObservation":return lifeActor.CollectionObservation(payload);
                            default:throw new ArgumentException();
                        }
                    },(method,payload)=>method.StartsWith("game.life.wood.",StringComparison.Ordinal)?woodProgress.RequestAsync(method.Substring("game.life.wood.".Length),payload):method.StartsWith("game.life.progress.",StringComparison.Ordinal)?lifeProgress.RequestAsync(method.Substring("game.life.progress.".Length),payload):method=="game.life.actions.collect"?lifeActor.CollectOneClickAsync(payload):method=="game.life.actions.prepare"?lifeActor.PrepareAsync(payload):method=="game.life.actions.confirm"?lifeActor.ConfirmAsync(payload):method=="game.life.actions.stop"?lifeActor.StopAsync(payload):Task.FromException<object>(new ArgumentException()),()=>lifeActor.Busy);
                } catch { lifeActor=null; /* Other IRIS features stay available; execution remains closed. */ }
                bridge.BindOverlay(Overlay.State,Overlay.SetClickThrough,Overlay.SetOpacityPercent);
                bridge.BindAddon(Addon.State,(side,layer)=>Addon.SetPreferences(new AddonWindowPreferences {DockSide=side,SameLayer=layer}),Decision);
                bridge.DragRequested+=(sender,e)=>{dragPending=true;};
                bridge.MinimizeRequested+=(sender,e)=>MinimizeToFloating();
                Overlay.StateChanged+=(sender,e)=>{if(documentReady)core.PostWebMessageAsJson(new JavaScriptSerializer().Serialize(new {version=1,kind="overlay.changed",epoch=bridge.Epoch,state=Overlay.State()}));};
                bridge.HideRequested += (sender, e) => {Addon.RecordManualVisibility(true);Hide();};
                bridge.CloseRequested += (sender,e) => { if(lifeActor!=null&&lifeActor.Busy){RequestClose("manual");return;}allowClose = true; BeginInvoke(new Action(Close)); };
                // Runs before page scripts, so the completion announcement is never lost during hydration.
                await core.AddScriptToExecuteOnDocumentCreatedAsync("window.__irisDesktopBridge=null;window.__irisDesktopPendingClose=null;chrome.webview.addEventListener('message',function(e){var d=e.data;if(!d||d.version!==1)return;if(d.kind==='bridge.ready'&&Number.isSafeInteger(d.epoch)&&d.epoch>0&&['development','production'].includes(d.environment)){window.__irisDesktopBridge=d;window.dispatchEvent(new CustomEvent('iris-desktop-ready'));return;}var c=window.__irisDesktopBridge;if(!c||d.epoch!==c.epoch||d.environment!==c.environment)return;if(d.kind==='window.close.request'&&['manual','game-exit'].includes(d.reason)){window.__irisDesktopPendingClose=d;window.dispatchEvent(new CustomEvent('iris-desktop-close',{detail:d}));}if(d.kind==='window.addon.changed')window.dispatchEvent(new CustomEvent('iris-addon-state',{detail:d}));if(d.kind==='window.presentation.changed')window.dispatchEvent(new CustomEvent('iris-presentation-state',{detail:d}));if(d.kind==='window.update.changed')window.dispatchEvent(new CustomEvent('iris-update-state',{detail:d}));});");
                core.NavigationStarting += (sender, e) => { SetWorkspace(false);documentReady = false; bridge.Revoke(); core.Settings.IsWebMessageEnabled = false; };
                await core.AddScriptToExecuteOnDocumentCreatedAsync("chrome.webview.addEventListener('message',function(e){var d=e.data,c=window.__irisDesktopBridge;if(c&&d&&d.version===1&&d.kind==='window.floating.changed'&&d.epoch===c.epoch&&d.environment===c.environment)window.dispatchEvent(new CustomEvent('iris-floating-state',{detail:d}));});");
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

        readonly Timer onlineTimer = new Timer { Interval = 15000 };
        DesktopOnlineConnection online; bool onlineCloseComplete;
        async Task<string> ReadOnlineCookieAsync() {
            var core=Browser.CoreWebView2;Uri source;
            if(core==null||!Uri.TryCreate(core.Source,UriKind.Absolute,out source)||!DesktopHostPolicy.ValidateNavigation(source,development)||source.AbsolutePath!="/iris/desktop")return null;
            var cookies=await core.CookieManager.GetCookiesAsync(new Uri(source,"/api/account/online").AbsoluteUri);
            if(IsDisposed||core!=Browser.CoreWebView2)return null;
            string token=null;
            foreach(var cookie in cookies)if(cookie.Name=="sanctum_session"&&cookie.IsHttpOnly&&cookie.Path=="/"&&(development||cookie.IsSecure)){if(token!=null)return null;token=cookie.Value;}
            return String.IsNullOrWhiteSpace(token)?null:token;
        }
        Task<int> SendOnlineAsync(string token,DesktopOnlineMessage message) {
            // Fixed allowlisted deployment; never a renderer-provided URL or token.
            var origin=new Uri(development?"http://localhost:3000":"https://sanctum-tawny-three.vercel.app");
            return Task.Run(()=>{
                try {
                    var target=new Uri(origin,"/api/account/online");
                    var request=(System.Net.HttpWebRequest)System.Net.WebRequest.Create(target);
                    request.Method="POST";request.AllowAutoRedirect=false;request.Timeout=5000;request.ReadWriteTimeout=5000;
                    request.ContentType="application/json";request.Headers["Origin"]=origin.GetLeftPart(UriPartial.Authority);
                    request.CookieContainer=new System.Net.CookieContainer();
                    request.CookieContainer.Add(origin,new System.Net.Cookie("sanctum_session",token,"/",origin.Host){Secure=!development,HttpOnly=true});
                    var bytes=System.Text.Encoding.UTF8.GetBytes(new JavaScriptSerializer().Serialize(message));request.ContentLength=bytes.Length;
                    using(var stream=request.GetRequestStream())stream.Write(bytes,0,bytes.Length);
                    try {using(var response=(System.Net.HttpWebResponse)request.GetResponse())return (int)response.StatusCode;}
                    catch(System.Net.WebException error) {
                        using(var response=error.Response as System.Net.HttpWebResponse){
                            if(response==null)return 503;
                            if((int)response.StatusCode==503)using(var reader=new StreamReader(response.GetResponseStream())){
                                var buffer=new char[1024];var size=reader.ReadBlock(buffer,0,buffer.Length);
                                if(new string(buffer,0,size).Contains("\"code\":\"online-disabled\""))return 410;
                            }
                            return (int)response.StatusCode;
                        }
                    }
                }catch{return 503;}
            });
        }
        void InitializeOnline() {
            online=new DesktopOnlineConnection(ReadOnlineCookieAsync,SendOnlineAsync,()=>DateTime.UtcNow);
            onlineTimer.Tick+=async(sender,e)=>{if(!IsDisposed&&online!=null)await online.TickAsync();};
            onlineTimer.Start();
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
            FormClosing += async (sender,e) => {
                if (allowClose) { if(online!=null&&!onlineCloseComplete){e.Cancel=true;onlineCloseComplete=true;await online.StopAsync();if(!IsDisposed)BeginInvoke(new Action(Close));} return; }
                e.Cancel = true;
                RequestClose("manual");
            };
        }

        protected override void Dispose(bool disposing){if(disposing){onlineTimer.Stop();onlineTimer.Dispose();if(online!=null){var pendingOnlineClose=online.StopAsync();}SaveFloatingNormal();if(floatingHotkey!=null)floatingHotkey.Dispose();fitTimer.Stop();fitTimer.Dispose();if(Addon!=null)Addon.Dispose();if(Overlay!=null)Overlay.Dispose();}base.Dispose(disposing);}

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
