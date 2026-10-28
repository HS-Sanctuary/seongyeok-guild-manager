using System;using System.IO;using System.Net;using System.Reflection;using System.Threading.Tasks;using System.Web.Script.Serialization;using System.Collections.Generic;using System.Windows.Forms;using Microsoft.Web.WebView2.Core;
namespace IrisDesktop {
 // Only the owned fixture builder compiles this entry. Never a public app entry.
 public static class OnlineValidationEntry {
  static string owner,root;static int failure=1;static readonly JavaScriptSerializer json=new JavaScriptSerializer();
  static string Read(string path){var r=(HttpWebRequest)WebRequest.Create("http://localhost:3000"+path);r.Proxy=null;r.AllowAutoRedirect=false;r.Timeout=3000;r.ReadWriteTimeout=3000;r.Headers["X-Astra-Validation-Owner"]=owner;using(var response=r.GetResponse())using(var reader=new StreamReader(response.GetResponseStream())){var chars=new char[16384];var n=reader.ReadBlock(chars,0,chars.Length);return new string(chars,0,n);}}
  static Dictionary<string,object> State(){return json.DeserializeObject(Read("/__fixture/state")) as Dictionary<string,object>;}
  static void Require(bool ok,string message){if(!ok)throw new InvalidOperationException(message);}
  static void Stage(string value){File.AppendAllText(Path.Combine(root,"gui-stages.txt"),DateTime.UtcNow.ToString("o")+" "+value+Environment.NewLine);Console.WriteLine(value);}
  static int Online(){Stage("read_online");return ((object[])State()["accounts"]).Length;}
  static int Touches(){return Convert.ToInt32(((Dictionary<string,object>)State()["metrics"])["irisTouch"]);}
  static async Task Tick(DesktopWebView form){var c=(DesktopOnlineConnection)typeof(DesktopWebView).GetField("online",BindingFlags.Instance|BindingFlags.NonPublic).GetValue(form);await c.TickAsync();}
  static async Task Cookie(DesktopWebView form,string value){var m=form.Browser.CoreWebView2.CookieManager;foreach(var old in await m.GetCookiesAsync("http://localhost:3000/"))if(old.Name=="sanctum_session")m.DeleteCookie(old);if(value!=null){var c=m.CreateCookie("sanctum_session",value,"localhost","/");c.IsHttpOnly=true;c.IsSecure=false;m.AddOrUpdateCookie(c);}for(int probe=0;probe<20;probe++){int found=0;bool matches=true;foreach(var current in await m.GetCookiesAsync("http://localhost:3000/"))if(current.Name=="sanctum_session"){found++;matches=matches&&value!=null&&current.Value==value;}if(matches&&found==(value==null?0:1))return;await Task.Delay(50);}throw new InvalidOperationException("fixture cookie mutation did not settle within bounded readback; no retry of mutation");}
  static async Task ScriptProof(DesktopWebView form,string expression){
   var core=form.Browser.CoreWebView2;var tcs=new TaskCompletionSource<bool>();
   EventHandler<CoreWebView2WebMessageReceivedEventArgs> handler=(s,e)=>{try{var d=json.DeserializeObject(e.WebMessageAsJson) as Dictionary<string,object>;if(d!=null&&d.ContainsKey("fixtureProof")){if(!Equals(d["fixtureProof"],true))File.AppendAllText(Path.Combine(root,"gui-proof-failures.txt"),e.WebMessageAsJson+Environment.NewLine);tcs.TrySetResult(Equals(d["fixtureProof"],true));}}catch{}};
   core.WebMessageReceived+=handler;
   try{await core.ExecuteScriptAsync("Promise.resolve().then(async()=>{"+expression+"}).then(v=>chrome.webview.postMessage({fixtureProof:v===true})).catch(e=>chrome.webview.postMessage({fixtureProof:false,detail:String(e),messages:window.fixtureMessages}));");Require(await Task.WhenAny(tcs.Task,Task.Delay(10000))==tcs.Task&&await tcs.Task,"renderer proof failed: "+expression);}
   finally{core.WebMessageReceived-=handler;}
  }
  [STAThread] public static int Main(string[] args){
   if(args.Length!=4||args[0]!="--test-root"||args[2]!="--owned-gui"||args[3]!="--selftest"){Console.WriteLine("NOT_RUN: compile-only unless explicit owned GUI selftest");return 2;}
   try{root=Path.GetFullPath(args[1]);var parent=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"profiles")+Path.DirectorySeparatorChar;Require(root.StartsWith(parent,StringComparison.OrdinalIgnoreCase),"dedicated profile required");owner=File.ReadAllText(Path.Combine(root,"fixture-owner.txt")).Trim();Guid value;Require(Guid.TryParse(owner,out value)&&!DesktopBridge.ErgonAvailable,"owner/lock required");Require(Read("/__astra_validation")==owner,"owned API mismatch");Require(Equals(State()["database"],"owned-network-none-postgresql17"),"owned database mismatch");}
   catch{Console.WriteLine("NOT_RUN: isolated API/database/owner validation failed");return 2;}
   Application.EnableVisualStyles();
   using(var form=new DesktopWebView(true,Path.Combine(root,"WebViewProfile"),new DesktopStore(root,"development")))
   using(var tray=new NotifyIcon{Icon=System.Drawing.SystemIcons.Information,Text="ASTRA isolated validation",Visible=true}){
    form.Text="ASTRA 검증 전용 · 격리 프로필";form.EnableDesktopLifecycle();
    form.Shown+=async(s,e)=>{
     try{
      await form.InitializeAsync(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"WebView2Loader.dll"));
      var core=form.Browser.CoreWebView2;var nav=new TaskCompletionSource<bool>();core.NavigationCompleted+=(a,b)=>nav.TrySetResult(b.IsSuccess);form.Browser.Source=new Uri("http://localhost:3000/iris/desktop");
      Require(await Task.WhenAny(nav.Task,Task.Delay(15000))==nav.Task&&await nav.Task,"owned page navigation failed");
      await ScriptProof(form,"return !!window.__irisDesktopBridge&&typeof window.fixtureRequest==='function';");
      Stage("sidebar_login");await Cookie(form,"fixture-a");await Tick(form);Stage("sidebar_tick_returned");Require(Online()==1,"sidebar A missing");
      await ScriptProof(form,"try{await window.fixtureRequest('game.currencies');return false;}catch{return true;}");
      await ScriptProof(form,"try{await fetch('https://outside.invalid/forbidden');return false;}catch{return true;}");
      await ScriptProof(form,"await window.fixtureRequest('window.floating.command',{command:'floating'});await window.fixtureRequest('window.floating.command',{command:'menu'});return true;");
      await ScriptProof(form,"await new Promise(requestAnimationFrame);const b=document.querySelector('[aria-label=\"사이드바로 전환\"]');if(!b)return false;b.click();await new Promise(requestAnimationFrame);return true;");
      await ScriptProof(form,"const s=await window.fixtureRequest('window.floating.state');return s.mode==='normal';");
      using(var shot=File.Create(Path.Combine(root,"sidebar.png")))await core.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,shot);
      await ScriptProof(form,"await window.fixtureRequest('window.floating.command',{command:'floating'});return true;");
      Stage("hide_for_real_heartbeat");var before=Touches();form.Hide();Require(tray.Visible&&!form.Visible,"tray equivalent hide failed");
      // Real wall-clock check of the unchanged 300s scheduler while hidden.
      await Task.Delay(316000);Require(!form.Visible&&Touches()>before&&Online()==1,"hidden real heartbeat not maintained");
      form.Show();await Cookie(form,"fixture-b");await Tick(form);Require(Online()==1,"account switch count invalid");
      var accounts=(object[])State()["accounts"];Require(Equals(((Dictionary<string,object>)accounts[0])["accountId"],"22222222-2222-4222-8222-222222222222"),"old account survived switch");
      await Cookie(form,null);await Tick(form);Require(Online()==0,"logout did not leave");
      await Cookie(form,"fixture-a");await Tick(form);Require(Online()==1,"relogin missing");
      Require(Convert.ToInt32(((Dictionary<string,object>)State()["metrics"])["activity"])==0,"background changed activity");
      File.WriteAllText(Path.Combine(root,"gui-result.json"),json.Serialize(new{status="PASS",sidebar=true,floatingSidebarButton=true,trayHiddenHeartbeatSeconds=316,accountSwitch=true,logout=true,gameBridgeDenied=true,externalFetchDenied=true,normalCloseRequested=true}));
      failure=0;await core.ExecuteScriptAsync("window.fixtureRequest('window.close').catch(()=>{});");
     }catch(Exception error){failure=1;File.WriteAllText(Path.Combine(root,"gui-failure.txt"),error.ToString());form.Dispose();}
    };
    Application.Run(form);tray.Visible=false;
   }
   return failure;
  }
 }
}
