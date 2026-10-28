using System;
using System.IO;
using System.Net;
using System.Drawing;
using System.Windows.Forms;
namespace IrisDesktop {
 // Fixture entry point only. Never uses AppData, production singleton or updater.
 public static class OnlineValidationEntry {
  static readonly bool GuiIsolationReady=false;
  [STAThread] public static int Main(string[] args) {
   if(!GuiIsolationReady){Console.WriteLine("NOT_RUN: compile-only artifact; GUI isolation and PG backend are not validated");return 2;}
   if(args.Length!=2||args[0]!="--test-root"){Console.WriteLine("NOT_RUN: dedicated test root and owned localhost API required");return 2;}
   string root;
   try {
    root=Path.GetFullPath(args[1]);var parent=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"profiles")+Path.DirectorySeparatorChar;
    if(!root.StartsWith(parent,StringComparison.OrdinalIgnoreCase))throw new ArgumentException();
    var marker=Path.Combine(root,"fixture-owner.txt");var owner=File.ReadAllText(marker).Trim();Guid parsed;
    if(!Guid.TryParse(owner,out parsed)||DesktopBridge.ErgonAvailable)throw new ArgumentException();
    var request=(HttpWebRequest)WebRequest.Create("http://localhost:3000/__astra_validation");
    request.AllowAutoRedirect=false;request.Timeout=1500;request.ReadWriteTimeout=1500;
    request.Headers["X-Astra-Validation-Owner"]=owner;
    using(var response=request.GetResponse())using(var reader=new StreamReader(response.GetResponseStream())){
     var chars=new char[128];var n=reader.ReadBlock(chars,0,chars.Length);
     if(new string(chars,0,n).Trim()!=owner)throw new ArgumentException();
    }
   }catch{Console.WriteLine("NOT_RUN: isolated owner marker/API did not validate; no IRIS window or profile opened");return 2;}
   Application.EnableVisualStyles();
   using(var form=new DesktopWebView(true,Path.Combine(root,"WebViewProfile"),new DesktopStore(root,"development")))
   using(var tray=new NotifyIcon {Icon=SystemIcons.Information,Text="ASTRA isolated validation",Visible=true}){
    form.Text="ASTRA 검증 전용 · 격리 프로필";
    var menu=new ContextMenuStrip();
    menu.Items.Add("검증창 열기",null,(s,e)=>form.Show());
    menu.Items.Add("트레이로 숨기기",null,(s,e)=>form.Hide());
    menu.Items.Add("검증 종료",null,(s,e)=>form.Close());
    tray.ContextMenuStrip=menu;tray.DoubleClick+=(s,e)=>form.Show();
    form.EnableDesktopLifecycle();
    form.Shown+=async(s,e)=>{
     try{await form.InitializeAsync(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"WebView2Loader.dll"));form.Browser.Source=new Uri("http://localhost:3000/iris/desktop");}
     catch{Console.WriteLine("FAIL: isolated WebView initialization");form.Dispose();}
    };
    Application.Run(form);tray.Visible=false;
   }
   return 0;
  }
 }
}
