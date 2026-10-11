using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.Security.Principal;
using System.Web.Script.Serialization;
using System.Collections.Generic;
using IrisDesktop;

// Executed only from an explicitly created temporary directory. No WebView,
// network, game, queue contents or real user installation are opened.
static class UpdateProcessFixture {
 static string Json(object value){return new JavaScriptSerializer().Serialize(value);}
 static int Main(string[] args){
  string install=AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
  try{
   if(args.Length==2&&args[0]=="--prepare"){Prepare(args[1]);return 0;}
   if(args.Length==2&&args[0]=="--updated"){
    if(File.Exists(Path.Combine(install,"fixture-crash")))return 3;
    using(var queue=new Mutex(false,"Local\\SANCTUM.IRIS.Queue."+WindowsIdentity.GetCurrent().User.Value)){
     bool held=false;try{try{held=queue.WaitOne(0);}catch(AbandonedMutexException){held=true;}if(!held)return 4;
      DesktopUpdateInstall.MarkReady(args[1],install);File.WriteAllText(Path.Combine(install,"fixture-new-started"),"new");
      var deadline=DateTime.UtcNow.AddSeconds(15);while(File.Exists(Path.Combine(install,".iris-update-pending"))&&DateTime.UtcNow<deadline)Thread.Sleep(50);
     }finally{if(held)queue.ReleaseMutex();}
    }return 0;
   }
   if(args.Length==2&&(args[0]=="--apply"||args[0]=="--recover")){
    string tx=DesktopUpdateInstall.Transaction(args[1]);int code=0;
    try{DesktopUpdateInstall.Apply(tx,args[0]=="--recover");}catch{code=9;}
    File.WriteAllText(Path.Combine(tx,"fixture-result"),code.ToString());return code;
   }
   if(args.Length==2&&args[0]=="--kick"){DesktopUpdateInstall.StartHelper(DesktopUpdateInstall.Transaction(args[1]),false);return 0;}
   if(args.Length==2&&args[0]=="--partial"){DesktopUpdateInstall.InstallFiles(DesktopUpdateInstall.Transaction(args[1]));return 0;}
   if(args.Length==0){File.WriteAllText(Path.Combine(install,"fixture-old-started"),"old");return 0;}
   return 2;
  }catch{return 8;}
 }
 static Dictionary<string,object> Manifest(string dir,string version){return new Dictionary<string,object>{
  {"schemaVersion",1},{"product","IRIS for SANCTUM"},{"channel","beta-candidate"},{"architecture","win-x64"},{"signature","unsigned"},{"version",version},{"updaterVersion",1},{"minUpdaterVersion",1},{"queueSchemaVersion",3},{"createdAtUtc","2026-10-11T00:00:00Z"},
  {"files",DesktopUpdateRelease.Names.Select(n=>new {name=n,sizeBytes=new FileInfo(Path.Combine(dir,n)).Length,sha256=DesktopUpdateRelease.Hash(Path.Combine(dir,n))}).ToArray()}};}
 static void Prepare(string root){
  string install=Path.Combine(root,"installed"),candidate=Path.Combine(root,"candidate");Directory.CreateDirectory(install);Directory.CreateDirectory(candidate);
  string harness=Process.GetCurrentProcess().MainModule.FileName;
  foreach(string n in DesktopUpdateRelease.Names){
   if(n=="IRIS.exe"||n=="IRIS.Updater.exe"){File.Copy(harness,Path.Combine(install,n));File.Copy(harness,Path.Combine(candidate,n));}
   else{File.WriteAllText(Path.Combine(install,n),"old "+n);File.WriteAllText(Path.Combine(candidate,n),"new "+n);}
  }
  File.WriteAllText(Path.Combine(install,"manifest.json"),Json(Manifest(install,"0.1.0")),new UTF8Encoding(false));
  var release=Manifest(candidate,"0.2.0");File.WriteAllText(Path.Combine(candidate,"manifest.json"),Json(release),new UTF8Encoding(false));
  string zip=Path.Combine(root,"update.zip");ZipFile.CreateFromDirectory(candidate,zip);release["sha256"]=DesktopUpdateRelease.Hash(zip);release["sizeBytes"]=new FileInfo(zip).Length;
  string tx=DesktopUpdateInstall.Prepare(zip,Json(release),install);File.WriteAllText(Path.Combine(root,"token"),Path.GetFileName(tx));
 }
}
