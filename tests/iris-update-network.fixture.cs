using System;
using System.IO;
using System.Net;
using IrisDesktop;

// Public metadata only, in an actual .NET 4-targeted process like IRIS.exe.
// Does not download/install a ZIP or read login, game or protected queue records.
internal static class UpdateNetworkProbe {
 static int Main(string[] args) {
  try {
   ServicePointManager.SecurityProtocol=SecurityProtocolType.Ssl3|SecurityProtocolType.Tls;
   object state;
   if(args.Length==1){
    var type=System.Reflection.Assembly.LoadFrom(Path.GetFullPath(args[0])).GetType("IrisDesktop.DesktopUpdater",true);
    var updater=Activator.CreateInstance(type,new object[]{Path.GetTempPath(),"0.2.0"});
    state=((System.Threading.Tasks.Task<object>)type.GetMethod("CheckAsync").Invoke(updater,null)).GetAwaiter().GetResult();
   }else state=new DesktopUpdater(Path.GetTempPath(),"0.2.0").CheckAsync().GetAwaiter().GetResult();
   Func<string,string> field=name=>(string)state.GetType().GetField(name).GetValue(state);
   Console.WriteLine("phase="+field("phase")+" installed="+field("installedVersion")+" available="+field("availableVersion")+" error="+field("error"));
   if(field("phase")!="available"||field("error")!=null||DesktopUpdateRelease.CompareVersions(field("availableVersion"),"0.2.0")<=0)throw new Exception("Actual native HTTPS release check failed");
   if(ServicePointManager.SecurityProtocol!=SecurityProtocolType.Tls12)throw new Exception("Legacy TLS protocols still enabled");
   if(ServicePointManager.ServerCertificateValidationCallback!=null)throw new Exception("Certificate validation overridden");
   Console.WriteLine("PASS native HTTPS detection; TLS 1.2; default certificate validation");
   return 0;
  }catch(Exception error){Console.Error.WriteLine(error.Message);return 1;}
 }
}
