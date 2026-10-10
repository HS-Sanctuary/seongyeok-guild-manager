using System;
using System.IO;
using System.Drawing;
using System.Threading;
using System.Security.Principal;
using System.Windows.Forms;

namespace IrisDesktop {
    // Production-only entry point. No shell, development flag, arbitrary URL or
    // embedded credentials. Reuses the existing host, DPAPI store and mutexes.
    internal static class ReleaseProgram {
        [STAThread]
        static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            try { Run(); }
            catch { MessageBox.Show("IRIS를 시작하지 못했어요. ZIP을 모두 압축 해제했는지, Microsoft Edge WebView2 Runtime이 설치되어 있는지 확인해주세요. 기존 보호 대기함은 지우지 않아요.", "IRIS for SANCTUM", MessageBoxButtons.OK, MessageBoxIcon.Warning); }
        }
        static void Run() {
            const string environment = "production";
            string directory = AppDomain.CurrentDomain.BaseDirectory;
            string profile = DesktopHostPolicy.ProfilePath(environment);
            using (var owner = new DesktopSingleInstance(environment, profile)) {
                if (!owner.IsOwner) return;
                using (var queue = new Mutex(false, "Local\\SANCTUM.IRIS.Queue." + WindowsIdentity.GetCurrent().User.Value)) {
                    bool held;
                    try { held = queue.WaitOne(0); } catch (AbandonedMutexException) { held = true; }
                    if (!held) { MessageBox.Show("다른 IRIS가 실행 중이에요. 기존 앱을 정상 종료한 뒤 다시 열어주세요.", "IRIS for SANCTUM"); return; }
                    try {
                        var store = new DesktopStore(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Sanctum", "IRIS", "Desktop"), environment);
                        using (var window = new DesktopWebView(false, profile, store))
                        using (var icon = new Icon(Path.Combine(directory, "IRIS.ico")))
                        using (var tray = new NotifyIcon())
                        using (var menu = new ContextMenuStrip())
                        using (var timer = new System.Windows.Forms.Timer { Interval = 250 }) {
                            window.Icon = icon;
                            window.EnableDesktopLifecycle();
                            tray.Icon = icon; tray.Text = "IRIS for SANCTUM"; tray.ContextMenuStrip = menu; tray.Visible = true;
                            menu.Items.Add("센터 열기 · 입력 복구", null, (s,e) => window.Overlay.RestoreInteractive());
                            menu.Items.Add("종료", null, (s,e) => window.Close());
                            menu.Items.Add("복구 종료 · 최근 변경 손실 주의", null, (s,e) => window.ConfirmRecoveryClose());
                            tray.DoubleClick += (s,e) => window.Overlay.RestoreInteractive();
                            window.Resize += (s,e) => { if (window.WindowState == FormWindowState.Minimized) window.Hide(); };
                            window.Shown += async (s,e) => {
                                try {
                                    await window.InitializeAsync(Path.Combine(directory, "WebView2Loader.dll"));
                                    if (!window.IsDisposed) window.Browser.CoreWebView2.Navigate("https://sanctum-tawny-three.vercel.app/iris/desktop");
                                } catch {
                                    MessageBox.Show(window, "내장 화면을 시작하지 못했어요. Microsoft Edge WebView2 Runtime과 압축 해제된 파일을 확인해주세요. 자동 설치는 하지 않아요.", "IRIS for SANCTUM");
                                    window.AbortUninitializedStartup();
                                }
                            };
                            timer.Tick += (s,e) => { if (owner.TakeActivation()) window.Overlay.RestoreInteractive(); };
                            try { timer.Start(); Application.Run(window); }
                            finally { timer.Stop(); tray.Visible = false; }
                        }
                    } finally { queue.ReleaseMutex(); }
                }
            }
        }
    }
}
