// Synthetic integration fixture only. Never loads SANCTUM or real account cookies.
using System;
using System.IO;
using System.Diagnostics;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;

namespace IrisDesktop {
    public static class WebViewFixture {
        static void Check(bool condition, string message) {
            if (!condition) throw new Exception(message);
        }
        static void Intercept(DesktopWebView window, bool login) {
            var core = window.Browser.CoreWebView2;
            core.AddWebResourceRequestedFilter("http://localhost:3000/*", CoreWebView2WebResourceContext.All);
            core.WebResourceRequested += (sender, e) => {
                if (e.Request.Uri.EndsWith("/redirect")) {
                    e.Response = core.Environment.CreateWebResourceResponse(new MemoryStream(), 302, "Found", "Location: https://example.com/\r\n");
                    return;
                }
                bool session = e.Request.Uri.EndsWith("/session");
                string cookie = e.Request.Headers.Contains("Cookie") ? e.Request.Headers.GetHeader("Cookie") : "";
                string body = session ? (cookie.Contains("iris_fixture=synthetic") ? "authenticated" : "anonymous") :
                    "<!doctype html><title>IRIS synthetic fixture</title><body style='margin:0'><main class='iris-desktop' style='height:340px'>fixture</main></body>";
                string headers = "Content-Type: text/plain\r\nCache-Control: no-store\r\n";
                if (!session) headers = "Content-Type: text/html\r\nCache-Control: no-store\r\n";
                if (login && !session) headers += "Set-Cookie: iris_fixture=synthetic; Path=/; Max-Age=600; HttpOnly; SameSite=Lax\r\n";
                e.Response = core.Environment.CreateWebResourceResponse(
                    new MemoryStream(Encoding.UTF8.GetBytes(body)), 200, "OK", headers);
            };
        }
        static async Task Navigate(DesktopWebView window, string path = "/fixture") {
            var completion = new TaskCompletionSource<bool>();
            EventHandler<CoreWebView2NavigationCompletedEventArgs> handler = null;
            handler = (sender, e) => { window.Browser.CoreWebView2.NavigationCompleted -= handler; completion.TrySetResult(e.IsSuccess); };
            window.Browser.CoreWebView2.NavigationCompleted += handler;
            window.Browser.CoreWebView2.Navigate("http://localhost:3000" + path);
            Check(await Task.WhenAny(completion.Task, Task.Delay(15000)) == completion.Task, "navigation timeout");
            Check(await completion.Task, "fixture navigation failed");
        }
        static async Task Exercise(string loader, string profile) {
            Check(typeof(DesktopWebView).GetConstructor(new Type[] { typeof(bool), typeof(string), typeof(DesktopStore) }) != null, "Scoped store not integrated into WebView host");
            uint browserProcess;
            using (var first = new DesktopWebView(true, profile)) {
                first.Addon.Dispose();
                Check(first.Width<=480 && first.FormBorderStyle==FormBorderStyle.None && !first.TopMost,"Addon is still a global topmost window");
                first.ShowInTaskbar = false; first.Opacity = 0; first.Show();
                await first.InitializeAsync(loader);
                browserProcess = first.Browser.CoreWebView2.BrowserProcessId;
                Intercept(first, true);
                await Navigate(first);
                Check(await first.Browser.CoreWebView2.ExecuteScriptAsync("document.cookie") == "\"\"", "HttpOnly cookie visible to script");
                first.Close();
            }
            // Require the first browser process to end: retained in-memory cookies are not persistence evidence.
            bool exited = false;
            for (int i = 0; i < 150; i++) {
                try { using (var process = Process.GetProcessById((int)browserProcess)) { exited = process.HasExited; } }
                catch (ArgumentException) { exited = true; }
                if (exited) break;
                await Task.Delay(100);
            }
            Check(exited, "first browser process did not exit");
            using (var second = new DesktopWebView(true, profile)) {
                second.Addon.Dispose();
                second.ShowInTaskbar = false; second.Opacity = 0; second.Show();
                await second.InitializeAsync(loader);
                Check(second.Browser.CoreWebView2.BrowserProcessId != browserProcess, "second browser reused first process");
                Intercept(second, false);
                await Navigate(second);
                await second.Browser.CoreWebView2.ExecuteScriptAsync("fetch('/session').then(r=>r.text()).then(v=>document.title=v)");
                string title = "";
                for (int i = 0; i < 50; i++) {
                    title = await second.Browser.CoreWebView2.ExecuteScriptAsync("document.title");
                    if (title == "\"authenticated\"") break;
                    await Task.Delay(100);
                }
                Check(title == "\"authenticated\"", "persistent session not restored");
                Check(!second.Browser.CoreWebView2.Settings.AreHostObjectsAllowed, "host objects exposed");
                Check(!second.Browser.CoreWebView2.Settings.IsWebMessageEnabled, "unvalidated messages enabled");
                var blocked = new TaskCompletionSource<bool>();
                second.NavigationBlocked += (sender, e) => blocked.TrySetResult(true);
                second.Browser.CoreWebView2.Navigate("https://example.com/");
                Check(await Task.WhenAny(blocked.Task, Task.Delay(5000)) == blocked.Task, "foreign navigation not blocked");
                Check(second.Browser.CoreWebView2.Source.StartsWith("http://localhost:3000/"), "foreign origin loaded");
                var frameBlocked = new TaskCompletionSource<bool>();
                second.NavigationBlocked += (sender, e) => frameBlocked.TrySetResult(true);
                await second.Browser.CoreWebView2.ExecuteScriptAsync("const f=document.createElement('iframe');f.src='https://example.org/';document.body.append(f)");
                Check(await Task.WhenAny(frameBlocked.Task, Task.Delay(5000)) == frameBlocked.Task, "foreign frame not blocked");
                var popupBlocked = new TaskCompletionSource<bool>();
                second.Browser.CoreWebView2.NewWindowRequested += (sender, e) => popupBlocked.TrySetResult(e.Handled);
                await second.Browser.CoreWebView2.ExecuteScriptAsync("window.open('https://example.org/')");
                Check(await Task.WhenAny(popupBlocked.Task, Task.Delay(5000)) == popupBlocked.Task && await popupBlocked.Task, "popup not handled");
                var redirectBlocked = new TaskCompletionSource<bool>();
                second.NavigationBlocked += (sender, e) => redirectBlocked.TrySetResult(true);
                second.Browser.CoreWebView2.Navigate("http://localhost:3000/redirect");
                Check(await Task.WhenAny(redirectBlocked.Task, Task.Delay(5000)) == redirectBlocked.Task, "foreign redirect not blocked");
                second.Close();
            }
            var store = new DesktopStore(Path.Combine(profile, "QueueFixture"), "development");
            var constructor = typeof(DesktopWebView).GetConstructor(new Type[] { typeof(bool), typeof(string), typeof(DesktopStore) });
            using (var app = (DesktopWebView)constructor.Invoke(new object[] { true, profile, store })) {
                app.Addon.Dispose();
                app.ShowInTaskbar = false; app.Opacity = 0; app.Show();
                await app.InitializeAsync(loader); Intercept(app, false);
                await Navigate(app, "/iris/desktop");
                Check(app.Browser.CoreWebView2.Settings.IsWebMessageEnabled, "Desktop bridge disabled on authorized page");
                int nativeChrome=0;foreach(Control control in app.Controls)if(control.Dock==DockStyle.Top||control.Dock==DockStyle.Bottom)nativeChrome+=control.Height;
                await Task.Delay(700);Check(app.Height==340+nativeChrome,"Overlay did not fit trusted content height");
                await app.Browser.CoreWebView2.ExecuteScriptAsync("document.querySelector('main').style.height='120px'");
                await Task.Delay(700);Check(app.Height==120+nativeChrome,"Folded content did not shrink native window");
                string ready = await app.Browser.CoreWebView2.ExecuteScriptAsync("window.__irisDesktopBridge.epoch");
                Check(ready != "null" && ready != "undefined", "Bridge epoch not available to page");
                await app.Browser.CoreWebView2.ExecuteScriptAsync("window.bridgeReply=null;chrome.webview.addEventListener('message',e=>{if(e.data.id==='1')window.bridgeReply=e.data.ok});chrome.webview.postMessage({version:1,id:'1',epoch:window.__irisDesktopBridge.epoch,method:'store.replace',payload:{schemaVersion:2,entries:[]}})");
                string result = "";
                for (int i = 0; i < 50; i++) {
                    result = await app.Browser.CoreWebView2.ExecuteScriptAsync("window.bridgeReply");
                    if (result == "true") break;
                    await Task.Delay(100);
                }
                Check(result == "true" && store.Load() != null, "Browser request did not persist protected queue");
                store.Replace("{\"schemaVersion\":2,\"entries\":[{\"kind\":\"task\",\"environment\":\"development\",\"accountId\":\"synthetic-account\",\"characterId\":\"A\",\"category\":\"weekly\",\"taskId\":\"sentinel-task\",\"periodKey\":\"2026-10-04T21:00:00.000Z\",\"requestId\":\"00000000-0000-4000-8000-000000000001\",\"revision\":1,\"baseCompleted\":0,\"desiredCompleted\":1,\"deadlineAt\":15000,\"phase\":\"pending\"}]}");
                var kept=store.Load();app.Overlay.ToggleVisibility();app.Overlay.ToggleVisibility();
                if(app.Overlay.ShortcutsAvailable){Check(app.Overlay.SetClickThrough(true),"Input mode failed");}
                app.Overlay.RestoreInteractive();
                Check(store.Load()==kept,"Hide/show changed protected queue");
                await app.Browser.CoreWebView2.ExecuteScriptAsync("window.authFixture=document.createElement('input');authFixture.type='password';authFixture.value='synthetic-only';document.querySelector('main').append(authFixture);authFixture.focus();authFixture.setSelectionRange(2,5)");
                app.Activate();app.Browser.Focus();
                if(app.Overlay.ShortcutsAvailable){Check(app.Overlay.SetClickThrough(true),"Auth input pass-through failed");}
                app.Overlay.RestoreInteractive();await Task.Delay(600);
                Check(await app.Browser.CoreWebView2.ExecuteScriptAsync("authFixture.isConnected&&document.activeElement===authFixture&&authFixture.value==='synthetic-only'&&authFixture.selectionStart===2&&authFixture.selectionEnd===5") == "true","Auth input identity/value/selection/focus lost after native recovery");
                Check(await app.Browser.CoreWebView2.ExecuteScriptAsync("document.cookie") == "\"\"","Overlay exposed HttpOnly login");
                await Navigate(app, "/fixture");
                Check(!app.Browser.CoreWebView2.Settings.IsWebMessageEnabled, "Bridge remained enabled outside desktop route");
                await Navigate(app, "/iris/desktop");
                Check(store.Load()==kept,"Reload changed protected pending edit");
                await app.Browser.CoreWebView2.ExecuteScriptAsync("chrome.webview.postMessage({version:1,id:'2',epoch:"+ready+",method:'overlay.opacity',payload:{percent:50}})");
                await Task.Delay(200);Check(app.Overlay.OpacityPercent==100,"Stale document changed overlay state");
                app.EnableDesktopLifecycle();
                await app.Browser.CoreWebView2.ExecuteScriptAsync("window.closeSeen=false;window.addEventListener('iris-desktop-close',()=>window.closeSeen=true)");
                app.Close();
                Check(!app.IsDisposed, "Close discarded page before disposition");
                string closeSeen = "";
                for (int i=0;i<50;i++) {closeSeen=await app.Browser.CoreWebView2.ExecuteScriptAsync("window.closeSeen");if(closeSeen=="true")break;await Task.Delay(100);}
                Check(closeSeen=="true", "Native close did not reach disposition UI");
                var closed = new TaskCompletionSource<bool>();
                app.FormClosed += (sender,e) => closed.TrySetResult(true);
                await app.Browser.CoreWebView2.ExecuteScriptAsync("chrome.webview.postMessage({version:1,id:'1',epoch:window.__irisDesktopBridge.epoch,method:'window.close',payload:null})");
                Check(await Task.WhenAny(closed.Task,Task.Delay(5000))==closed.Task,"Authorized close did not close host");
                Check(store.Load()!=null,"Close lost protected queue");
            }
        }
        public static void Run(string loader, string profile) {
            Exception failure = null;
            var pump = new Form { ShowInTaskbar = false, Opacity = 0 };
            pump.Shown += async (sender, e) => {
                try { await Exercise(loader, profile); } catch (Exception ex) { failure = ex; }
                finally { pump.Close(); }
            };
            Application.Run(pump);
            pump.Dispose();
            if (failure != null) throw failure;
        }
    }
}
