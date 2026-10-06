namespace Iris
{
    public sealed class KronosEditRequestedEventArgs : System.EventArgs
    {
        public string Category {get;private set;}
        public string TaskId {get;private set;}
        public int DesiredCompleted {get;private set;}
        public KronosEditRequestedEventArgs(string category,string id,int desired) {Category=category;TaskId=id;DesiredCompleted=desired;}
    }
    public sealed class CheckboardWindow : OverlayWindow
    {
        private readonly System.Windows.Forms.Label identity;
        private readonly System.Windows.Forms.Button collapse;
        private readonly System.Windows.Forms.CheckBox remaining;
        private readonly System.Windows.Forms.Button save,discard;
        private readonly System.Windows.Forms.Panel viewport;
        private readonly System.Windows.Forms.FlowLayoutPanel rows;
        private readonly System.Drawing.Font textFont;
        private readonly System.Collections.Generic.HashSet<string> expanded = new System.Collections.Generic.HashSet<string>();
        private System.Collections.Generic.Dictionary<string,System.Collections.Generic.List<KronosTaskDisplay>> tasks;
        private System.Collections.Generic.List<KronosClassDisplay> classes;
        private string signature, nickname, status;
        private bool details, dragging;
        private System.Drawing.Point dragOffset;
        private System.Drawing.Color accent;
        private readonly int expandedHeight;
        private ConnectionDisplay writeView;
        private bool requestBusy;
        public bool CanEdit {get {return !requestBusy && details && writeView!=null && writeView.WriteAllowed && writeView.SaveState!="submitted" && writeView.SaveState!="unknown" && QueueMatches();}}
        public string RenderedText { get; private set; }
        public bool EnabledByUser { get; private set; }
        public bool Collapsed { get; private set; }
        public int ExpandedHeight { get { return expandedHeight; } }
        public event System.EventHandler PreferencesChanged;
        public event System.EventHandler<KronosEditRequestedEventArgs> EditRequested;
        public event System.EventHandler SaveRequested,DiscardRequested;

        public CheckboardWindow(OverlayWindow owner) : base(false)
        {
            if(owner==null) throw new System.ArgumentNullException("owner");
            ShortcutOwner=owner; EnabledByUser=true;
            Text="IRIS · 크로노스 체크보드";
            FormBorderStyle=System.Windows.Forms.FormBorderStyle.None;
            TopMost=true; ShowInTaskbar=false;
            StartPosition=System.Windows.Forms.FormStartPosition.Manual; Opacity=.94;
            expandedHeight=System.Math.Min(520,System.Windows.Forms.Screen.FromControl(owner).WorkingArea.Height);
            ClientSize=new System.Drawing.Size(360,expandedHeight);
            textFont=new System.Drawing.Font("Malgun Gothic",9);
            Font=textFont;
            var heading=new System.Windows.Forms.Label {Text="✦ 크로노스 체크보드",Bounds=new System.Drawing.Rectangle(12,9,270,27)};
            collapse=HeaderButton("−",297);
            var hide=HeaderButton("×",329);
            Controls.Add(heading); Controls.Add(collapse); Controls.Add(hide);
            collapse.Click+=delegate {SetCollapsed(!Collapsed);}; hide.Click+=delegate {HideByUser();};
            heading.MouseDown+=delegate(object sender,System.Windows.Forms.MouseEventArgs e) {
                if(e.Button==System.Windows.Forms.MouseButtons.Left) {dragging=true;dragOffset=e.Location; heading.Capture=true;}
            };
            heading.MouseMove+=delegate(object sender,System.Windows.Forms.MouseEventArgs e) {
                if(dragging) {var point=heading.PointToScreen(e.Location); Location=new System.Drawing.Point(point.X-dragOffset.X-heading.Left,point.Y-dragOffset.Y-heading.Top);}
            };
            heading.MouseUp+=delegate {dragging=false;heading.Capture=false;NotifyPreferences();};
            identity=new System.Windows.Forms.Label {Bounds=new System.Drawing.Rectangle(12,44,336,55)};
            save=new System.Windows.Forms.Button {Name="saveEdits",Text="변경 저장",Bounds=new System.Drawing.Rectangle(12,102,155,30),FlatStyle=System.Windows.Forms.FlatStyle.Flat};
            discard=new System.Windows.Forms.Button {Name="discardEdits",Text="변경 버리기",Bounds=new System.Drawing.Rectangle(175,102,173,30),FlatStyle=System.Windows.Forms.FlatStyle.Flat};
            save.Click+=delegate {if(save.Enabled && SaveRequested!=null) SaveRequested(this,System.EventArgs.Empty);};
            discard.Click+=delegate {if(discard.Enabled && DiscardRequested!=null) DiscardRequested(this,System.EventArgs.Empty);};
            remaining=new System.Windows.Forms.CheckBox {Text="남은 숙제만",Bounds=new System.Drawing.Rectangle(12,136,336,27)};
            remaining.CheckedChanged+=delegate {Render();};
            viewport=new System.Windows.Forms.Panel {Bounds=new System.Drawing.Rectangle(10,168,340,System.Math.Max(0,expandedHeight-178)),AutoScroll=true};
            rows=new System.Windows.Forms.FlowLayoutPanel {FlowDirection=System.Windows.Forms.FlowDirection.TopDown,WrapContents=false,AutoSize=true,AutoSizeMode=System.Windows.Forms.AutoSizeMode.GrowAndShrink,Width=316,Margin=System.Windows.Forms.Padding.Empty};
            viewport.Controls.Add(rows); Controls.Add(identity); Controls.Add(save);Controls.Add(discard);Controls.Add(remaining); Controls.Add(viewport);
            SetPalette(System.Drawing.ColorTranslator.FromHtml("#101114"),System.Drawing.ColorTranslator.FromHtml("#F4EAD5"),System.Drawing.ColorTranslator.FromHtml("#E8CA8A"));
            Clear("연결 대기");
        }
        private System.Windows.Forms.Button HeaderButton(string text,int x)
        {
            var button=new System.Windows.Forms.Button {Text=text,Bounds=new System.Drawing.Rectangle(x,9,25,27),FlatStyle=System.Windows.Forms.FlatStyle.Flat};
            button.FlatAppearance.BorderSize=0; return button;
        }
        public void SetPalette(System.Drawing.Color panel,System.Drawing.Color main,System.Drawing.Color highlight)
        {
            BackColor=panel;ForeColor=main;accent=highlight;
            PaintPalette(this);
        }
        private void PaintPalette(System.Windows.Forms.Control control)
        {
            foreach(System.Windows.Forms.Control child in control.Controls) {
                child.BackColor=BackColor; child.ForeColor=child is System.Windows.Forms.Button ? accent : ForeColor;
                PaintPalette(child);
            }
        }
        public void Apply(string character,string connectionStatus,System.Collections.Generic.Dictionary<string,System.Collections.Generic.List<KronosTaskDisplay>> taskRows,System.Collections.Generic.List<KronosClassDisplay> classRows,bool hasDetails)
        {writeView=null;ApplyCore(character,connectionStatus,taskRows,classRows,hasDetails);}
        public void ApplyDisplay(ConnectionDisplay view)
        {writeView=view;ApplyCore(view.Values[1],view.Values[0],view.Tasks,view.Classes,view.HasDetails);}
        public void SetRequestBusy(bool value) {if(requestBusy!=value) {requestBusy=value;signature=null;Render();}}
        private void ApplyCore(string character,string connectionStatus,System.Collections.Generic.Dictionary<string,System.Collections.Generic.List<KronosTaskDisplay>> taskRows,System.Collections.Generic.List<KronosClassDisplay> classRows,bool hasDetails)
        {
            var next=new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(new object[]{character,connectionStatus,taskRows,classRows,hasDetails,writeView==null?null:writeView.SaveState,writeView==null?null:writeView.PendingEdits,writeView!=null && writeView.WriteAllowed,requestBusy});
            if(next==signature) return;
            signature=next; nickname=character;status=connectionStatus;tasks=taskRows;classes=classRows;details=hasDetails;
            Render();
        }
        private bool QueueMatches()
        {
            if(writeView==null) return false;
            foreach(var e in writeView.PendingEdits) {
                string period;
                if(e.Generation!=writeView.Generation || e.SelectionVersion!=writeView.SelectionVersion || e.AccountId!=writeView.AccountId || e.CharacterId!=writeView.SelectedId || !writeView.PeriodKeys.TryGetValue(e.Category,out period) || period!=e.PeriodKey) return false;
            }
            return true;
        }
        private int Desired(string category,KronosTaskDisplay item)
        {
            if(writeView!=null && QueueMatches()) foreach(var e in writeView.PendingEdits) if(e.Category==category && e.TaskId==item.Id) return System.Math.Min(item.Total,e.DesiredCompleted);
            return item.Completed;
        }
        private void AddEditable(string category,KronosTaskDisplay item,int done)
        {
            var panel=new System.Windows.Forms.Panel {Width=310,Margin=System.Windows.Forms.Padding.Empty};
            var name=new System.Windows.Forms.Label {Text=item.Name,AutoSize=true,MaximumSize=new System.Drawing.Size(296,0),MinimumSize=new System.Drawing.Size(296,0),Location=new System.Drawing.Point(7,5)};
            panel.Controls.Add(name);int y=name.PreferredHeight+10;panel.Height=y+37;
            if(item.Total==1) {
                var button=new System.Windows.Forms.Button {Name="edit:"+category+":"+item.Id+":toggle",Text=done==1?"완료 · 취소":"완료 체크",Bounds=new System.Drawing.Rectangle(7,y,296,30),FlatStyle=System.Windows.Forms.FlatStyle.Flat,Enabled=CanEdit};
                button.Click+=delegate {RaiseEdit(category,item,done==1?0:1);};panel.Controls.Add(button);
            } else {
                var minus=new System.Windows.Forms.Button {Name="edit:"+category+":"+item.Id+":minus",Text="−",Bounds=new System.Drawing.Rectangle(7,y,55,30),FlatStyle=System.Windows.Forms.FlatStyle.Flat,Enabled=CanEdit && done>0};
                var plus=new System.Windows.Forms.Button {Name="edit:"+category+":"+item.Id+":plus",Text="+",Bounds=new System.Drawing.Rectangle(248,y,55,30),FlatStyle=System.Windows.Forms.FlatStyle.Flat,Enabled=CanEdit && done<item.Total};
                panel.Controls.Add(new System.Windows.Forms.Label {Text=done+"/"+item.Total,Bounds=new System.Drawing.Rectangle(66,y,178,30),TextAlign=System.Drawing.ContentAlignment.MiddleCenter});
                minus.Click+=delegate {RaiseEdit(category,item,done-1);};plus.Click+=delegate {RaiseEdit(category,item,done+1);};panel.Controls.Add(minus);panel.Controls.Add(plus);
            }
            rows.Controls.Add(panel);RenderedText+="\n"+item.Name+"  "+done+"/"+item.Total;
        }
        private void RaiseEdit(string category,KronosTaskDisplay item,int desired)
        {if(CanEdit && desired>=0 && desired<=item.Total && EditRequested!=null) EditRequested(this,new KronosEditRequestedEventArgs(category,item.Id,desired));}
        public void Clear(string message) {Apply(null,message,null,null,false);}
        public void SetValues(string[] ignored) {Clear("연결 대기");}
        public void SetRemainingOnly(bool value) {remaining.Checked=value;}
        public void SetSectionExpanded(string section,bool value)
        {
            if(value) expanded.Add(section);else expanded.Remove(section);Render();
        }
        private void AddText(string text)
        {
            rows.Controls.Add(new System.Windows.Forms.Label {Text=text,AutoSize=true,MaximumSize=new System.Drawing.Size(310,0),MinimumSize=new System.Drawing.Size(310,0),Padding=new System.Windows.Forms.Padding(7,5,7,5),Margin=System.Windows.Forms.Padding.Empty});
            RenderedText+="\n"+text;
        }
        private bool Section(string id,string title)
        {
            var button=new System.Windows.Forms.Button {Text=(expanded.Contains(id)?"− ":"+ ")+title,Width=310,Height=33,FlatStyle=System.Windows.Forms.FlatStyle.Flat,TextAlign=System.Drawing.ContentAlignment.MiddleLeft};
            button.Click+=delegate {SetSectionExpanded(id,!expanded.Contains(id));};
            rows.Controls.Add(button);RenderedText+="\n"+button.Text;return expanded.Contains(id);
        }
        private void Render()
        {
            if(rows==null) return;
            viewport.SuspendLayout(); rows.SuspendLayout();
            try {
                while(rows.Controls.Count>0) rows.Controls[0].Dispose();
                var state=writeView==null?"idle":writeView.SaveState;
                string label=state=="submitted"?"저장 대기 중":state=="unknown"?"저장 결과 확인 중 · 다시 저장하지 않음":state=="conflict"?"충돌 · 변경을 버리고 다시 확인":state=="failed"?"저장 실패 · 확인 후 다시 저장":state=="saved"?"저장 확인됨":writeView!=null && writeView.PendingCount>0?"미저장 "+writeView.PendingCount+"개":CanEdit?"수정 허용 · 변경 후 저장":"생텀 기록 · 읽기 전용";
                identity.Text=(System.String.IsNullOrEmpty(nickname)?"캐릭터 확인 대기":nickname)+"\n"+label;
                save.Enabled=CanEdit && writeView.PendingCount>0 && state!="conflict";
                discard.Enabled=!requestBusy && writeView!=null && writeView.PendingCount>0;
                RenderedText=identity.Text;remaining.Enabled=details;
                if(!details || tasks==null || classes==null) {
                    AddText(System.String.IsNullOrEmpty(status)?"연결 대기":status);
                    AddText("생텀 연결에서 현재 캐릭터를 확인해 주세요. 상세 기록이 없는 연결은 다시 연결해 주세요.");
                } else {
                    var ids=new[]{"daily","weekly","abyss","raid"};var names=new[]{"일일 숙제","주간 숙제","어비스","레이드"};
                    for(int i=0;i<ids.Length;i++) {
                        System.Collections.Generic.List<KronosTaskDisplay> items;
                        if(!tasks.TryGetValue(ids[i],out items)) items=new System.Collections.Generic.List<KronosTaskDisplay>();
                        int done=0,total=0;foreach(var item in items) {done+=Desired(ids[i],item);total+=item.Total;}
                        if(!Section(ids[i],names[i]+"  "+done+"/"+total)) continue;
                        int shown=0;
                        foreach(var item in items) {
                            int desired=Desired(ids[i],item);
                            if(remaining.Checked && desired==item.Total) continue;
                            if(writeView!=null && writeView.WriteAllowed) AddEditable(ids[i],item,desired);
                            else AddText(item.Name+"  "+desired+"/"+item.Total);shown++;
                        }
                        if(shown==0) AddText(items.Count==0?"등록된 항목이 없어요":"남은 숙제가 없어요");
                    }
                    if(Section("classes","클래스 · 생텀 저장값")) {
                        foreach(var item in classes) AddText(item.Name+"  "+(item.Level.HasValue?"Lv."+item.Level.Value:"미등록"));
                        if(classes.Count==0) AddText("등록된 클래스가 없어요");
                        AddText("게임에서 자동으로 읽은 클래스 레벨이 아닙니다.");
                    }
                }
                PaintPalette(this);
            } finally {rows.ResumeLayout(true);viewport.ResumeLayout(true);}
        }
        private void NotifyPreferences() {if(PreferencesChanged!=null) PreferencesChanged(this,System.EventArgs.Empty);}
        public void SetCollapsed(bool value) {Collapsed=value;viewport.Visible=!value;identity.Visible=!value;remaining.Visible=!value;save.Visible=!value;discard.Visible=!value;Height=value?44:expandedHeight;collapse.Text=value?"+":"−";NotifyPreferences();}
        public void HideByUser() {EnabledByUser=false;ApplyClickThrough(false);Hide();}
        public void ShowByUser() {EnabledByUser=true;ApplyClickThrough(false);Show();}
        public void RestoreIfEnabled() {ApplyClickThrough(false);if(EnabledByUser) Show();}
        protected override void OnFormClosing(System.Windows.Forms.FormClosingEventArgs e)
        {
            if(e.CloseReason==System.Windows.Forms.CloseReason.UserClosing) {e.Cancel=true;HideByUser();}base.OnFormClosing(e);
        }
        protected override void Dispose(bool disposing) {base.Dispose(disposing);if(disposing && textFont!=null) textFont.Dispose();}
    }
}
