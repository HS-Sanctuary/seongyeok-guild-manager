namespace Iris
{
    // One capsule per registered job. Painting is bounded, original counts remain exact.
    public sealed class ProcessingSlots : System.Windows.Forms.Control
    {
        public int CompletedCount { get; private set; }
        public int TotalCount { get; private set; }
        public int VisibleSlots { get { return System.Math.Min(14, TotalCount); } }
        public int HiddenSlots { get { return TotalCount - VisibleSlots; } }
        public int Value { get { return TotalCount == 0 ? 0 : CompletedCount * 100 / TotalCount; } }
        public ProcessingSlots()
        {
            SetStyle(System.Windows.Forms.ControlStyles.UserPaint | System.Windows.Forms.ControlStyles.AllPaintingInWmPaint |
                System.Windows.Forms.ControlStyles.OptimizedDoubleBuffer, true);
            ForeColor = System.Drawing.ColorTranslator.FromHtml("#F5AD45");
            Size = new System.Drawing.Size(130, 18);
            TabStop = false;
        }
        public void SetCounts(int completed, int total)
        {
            if (total < 0 || total > 10000 || completed < 0 || completed > total) { completed = 0; total = 0; }
            CompletedCount = completed; TotalCount = total; Invalidate();
        }
        protected override void OnPaint(System.Windows.Forms.PaintEventArgs e)
        {
            base.OnPaint(e);
            e.Graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
            using (var complete = new System.Drawing.SolidBrush(ForeColor))
            using (var waiting = new System.Drawing.SolidBrush(System.Drawing.Color.FromArgb(80, ForeColor)))
            {
                for (int i = 0; i < VisibleSlots; i++)
                {
                    float width = (ClientSize.Width - 6 * 3) / 7f;
                    float x = (i % 7) * (width + 3), y = (i / 7) * 9;
                    using (var pill = new System.Drawing.Drawing2D.GraphicsPath())
                    {
                        pill.AddArc(x, y, 6, 6, 90, 180);
                        pill.AddArc(x + width - 6, y, 6, 6, 270, 180);
                        pill.CloseFigure();
                        e.Graphics.FillPath(i < CompletedCount ? complete : waiting, pill);
                    }
                }
            }
        }
    }
    // Passive information window: one controller owns global shortcuts and polling.
    public sealed class ModuleWindow : OverlayWindow
    {
        private readonly System.Windows.Forms.Label[] values;
        private readonly System.Windows.Forms.Button collapse;
        private readonly System.Drawing.Font headingFont, labelFont, valueFont;
        private readonly int expandedHeight;
        private readonly ProcessingSlots[] processingGauges;
        private bool dragging;
        private System.Drawing.Point dragOffset;
        public bool Collapsed { get; private set; }
        public int ExpandedHeight { get { return expandedHeight; } }
        public bool EnabledByUser { get; private set; }
        public event System.EventHandler PreferencesChanged;
        public string[] RenderedValues
        {
            get
            {
                var result = new string[values.Length];
                for (int i = 0; i < values.Length; i++) result[i] = values[i].Text;
                return result;
            }
        }
        public ModuleWindow(string title, string[] fields, OverlayWindow owner) : this(title, fields, owner, false) { }
        public ModuleWindow(string title, string[] fields, OverlayWindow owner, bool processingGrid) : this(title,fields,owner,processingGrid,0) { }
        public ModuleWindow(string title, string[] fields, OverlayWindow owner, bool processingGrid, int footerHeight) : base(false)
        {
            if (fields == null || fields.Length < 1 || fields.Length > 8 || owner == null)
                throw new System.ArgumentException("A module requires an owner and 1-8 fields.");
            if (processingGrid && fields.Length != 6) throw new System.ArgumentException("A processing grid requires six facilities.");
            if(footerHeight<0 || footerHeight>200) throw new System.ArgumentException("Invalid footer height.");
            ShortcutOwner = owner;
            EnabledByUser = true;
            Text = "IRIS · " + title;
            FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            BackColor = System.Drawing.ColorTranslator.FromHtml("#101114");
            ForeColor = System.Drawing.ColorTranslator.FromHtml("#F4EAD5");
            TopMost = true;
            ShowInTaskbar = false;
            StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            Opacity = .94;
            expandedHeight = (processingGrid ? 240 : 54 + fields.Length * 31) + footerHeight;
            ClientSize = new System.Drawing.Size(processingGrid ? 430 : 292, expandedHeight);
            headingFont = new System.Drawing.Font("Malgun Gothic", 11, System.Drawing.FontStyle.Bold);
            labelFont = new System.Drawing.Font("Malgun Gothic", 9);
            valueFont = new System.Drawing.Font("Malgun Gothic", 9, System.Drawing.FontStyle.Bold);
            var heading = new System.Windows.Forms.Label {
                Text = "✦ " + title, Bounds = new System.Drawing.Rectangle(12, 9, Width - 79, 27),
                ForeColor = System.Drawing.ColorTranslator.FromHtml("#E8CA8A"), Font = headingFont
            };
            collapse = Button("−", Width - 63);
            var hide = Button("×", Width - 32);
            Controls.Add(heading); Controls.Add(collapse); Controls.Add(hide);
            collapse.Click += delegate { SetCollapsed(!Collapsed); };
            hide.Click += delegate { HideByUser(); };
            values = new System.Windows.Forms.Label[fields.Length];
            processingGauges = processingGrid ? new ProcessingSlots[6] : null;
            for (int i = 0; i < fields.Length; i++)
            {
                int cellX = 12 + (i % 3) * 136, cellY = 49 + (i / 3) * 88;
                Controls.Add(new System.Windows.Forms.Label {
                    Text = fields[i], Bounds = processingGrid ? new System.Drawing.Rectangle(cellX, cellY, 130, 22) : new System.Drawing.Rectangle(12, 49 + i * 31, 116, 29),
                    Font = labelFont, ForeColor = System.Drawing.ColorTranslator.FromHtml("#AAA9A6")
                });
                values[i] = new System.Windows.Forms.Label {
                    Text = "—", Bounds = processingGrid ? new System.Drawing.Rectangle(cellX, cellY + 22, 130, 44) : new System.Drawing.Rectangle(128, 49 + i * 31, 151, 29),
                    Font = valueFont, TextAlign = processingGrid ? System.Drawing.ContentAlignment.MiddleLeft : System.Drawing.ContentAlignment.MiddleRight
                };
                Controls.Add(values[i]);
                if (processingGrid)
                {
                    processingGauges[i] = new ProcessingSlots {
                        Bounds = new System.Drawing.Rectangle(cellX, cellY + 67, 130, 18)
                    };
                    Controls.Add(processingGauges[i]);
                }
            }
            heading.MouseDown += delegate(object sender, System.Windows.Forms.MouseEventArgs e) {
                if (e.Button != System.Windows.Forms.MouseButtons.Left) return;
                dragging = true; heading.Capture = true;
                var point = System.Windows.Forms.Cursor.Position;
                dragOffset = new System.Drawing.Point(point.X - Left, point.Y - Top);
            };
            heading.MouseMove += delegate {
                if (!dragging) return;
                var point = System.Windows.Forms.Cursor.Position;
                Location = new System.Drawing.Point(point.X - dragOffset.X, point.Y - dragOffset.Y);
            };
            heading.MouseUp += delegate {
                dragging = false; heading.Capture = false; NotifyPreferences();
            };
            VisibleChanged += delegate {
                if (!Visible) { dragging = false; Capture = false; heading.Capture = false; }
            };
        }
        private System.Windows.Forms.Button Button(string text, int x)
        {
            var button = new System.Windows.Forms.Button {
                Text = text, Bounds = new System.Drawing.Rectangle(x, 9, 25, 27),
                FlatStyle = System.Windows.Forms.FlatStyle.Flat, ForeColor = System.Drawing.ColorTranslator.FromHtml("#E8CA8A")
            };
            button.FlatAppearance.BorderSize = 0;
            return button;
        }
        private void NotifyPreferences()
        {
            if (PreferencesChanged != null) PreferencesChanged(this, System.EventArgs.Empty);
        }
        public void SetValues(string[] entries)
        {
            for (int i = 0; i < values.Length; i++)
                values[i].Text = entries != null && i < entries.Length && !System.String.IsNullOrEmpty(entries[i]) ? entries[i] : "—";
            if (processingGauges != null) foreach (var gauge in processingGauges) gauge.SetCounts(0, 0);
        }
        public void SetProcessing(string[] entries, int[] completed, int[] total)
        {
            SetValues(entries);
            if (processingGauges == null) return;
            for (int i = 0; i < processingGauges.Length; i++)
            {
                if (completed == null || total == null || i >= completed.Length || i >= total.Length ||
                    total[i] <= 0 || total[i] > 10000 || completed[i] < 0 || completed[i] > total[i]) continue;
                processingGauges[i].SetCounts(completed[i], total[i]);
                if (processingGauges[i].HiddenSlots > 0)
                    values[i].Text = "완료 " + completed[i] + "/" + total[i] + "\n추가 " + processingGauges[i].HiddenSlots + "개";
            }
        }
        public void SetCollapsed(bool collapsed)
        {
            Collapsed = collapsed;
            Height = collapsed ? 44 : expandedHeight;
            collapse.Text = collapsed ? "+" : "−";
            NotifyPreferences();
        }
        public void HideByUser() { EnabledByUser = false; ApplyClickThrough(false); Hide(); }
        public void ShowByUser() { EnabledByUser = true; ApplyClickThrough(false); Show(); }
        public void RestoreIfEnabled() { ApplyClickThrough(false); if (EnabledByUser) Show(); }
        protected override void OnFormClosing(System.Windows.Forms.FormClosingEventArgs e)
        {
            if (e.CloseReason == System.Windows.Forms.CloseReason.UserClosing)
            {
                e.Cancel = true;
                HideByUser();
            }
            base.OnFormClosing(e);
        }
        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing) { headingFont.Dispose(); labelFont.Dispose(); valueFont.Dispose(); }
        }
    }
}
