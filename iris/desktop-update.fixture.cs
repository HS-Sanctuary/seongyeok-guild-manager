using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;

namespace IrisDesktop {
 public static class UpdateFixture {
  static readonly string[] Names={"IRIS.exe","IRIS.Updater.exe","IRIS.ico","Microsoft.Web.WebView2.Core.dll","Microsoft.Web.WebView2.WinForms.dll","WebView2Loader.dll","README.txt","LICENSE.WebView2.txt","NOTICE.WebView2.txt"};
  static string Hash(byte[] bytes){using(var h=SHA256.Create())return BitConverter.ToString(h.ComputeHash(bytes)).Replace("-","").ToLowerInvariant();}
  static string Json(object x){return new JavaScriptSerializer().Serialize(x);}
  static void Assert(bool ok,string message){if(!ok)throw new Exception(message);}
  static void Reject(Action a,string message){bool rejected=false;try{a();}catch{rejected=true;}Assert(rejected,message);}
  static void Entry(ZipArchive z,string name,byte[] bytes){using(var s=z.CreateEntry(name).Open())s.Write(bytes,0,bytes.Length);}
  static Dictionary<string,object> Metadata(string zip,string variant){
   var bytes=Names.ToDictionary(n=>n,n=>variant=="slow"?Enumerable.Repeat((byte)65,4*1024*1024).ToArray():Encoding.UTF8.GetBytes("new payload "+n));
   var release=new Dictionary<string,object>{{"schemaVersion",1},{"product","IRIS for SANCTUM"},{"channel","beta-candidate"},{"architecture","win-x64"},{"signature","unsigned"},{"version","0.2.0"},{"updaterVersion",1},{"minUpdaterVersion",1},{"queueSchemaVersion",3},{"createdAtUtc","2026-10-11T00:00:00Z"},{"files",Names.Select(n=>new {name=n,sizeBytes=bytes[n].Length,sha256=Hash(bytes[n])}).ToArray()}};
   using(var file=File.Create(zip))using(var z=new ZipArchive(file,ZipArchiveMode.Create)){
    foreach(var n in Names)Entry(z,n,variant=="payload"&&n=="IRIS.exe"?new byte[]{9}:bytes[n]);
    var inner=new Dictionary<string,object>(release);if(variant=="inner")inner["version"]="0.1.9";
    Entry(z,"manifest.json",Encoding.UTF8.GetBytes(Json(inner)));
    if(variant=="traversal")Entry(z,"../escape.exe",new byte[]{1});
    if(variant=="duplicate")Entry(z,"IRIS.exe",bytes["IRIS.exe"]);
    if(variant=="extra")Entry(z,"MabinogiMobile_CLI.exe",new byte[]{1});
   }
   release["sizeBytes"]=new FileInfo(zip).Length;release["sha256"]=Hash(File.ReadAllBytes(zip));return release;
  }
  public static void Run(){
   string root=Path.Combine(Path.GetTempPath(),"iris-update-policy-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(root);
   foreach(var variant in new[]{"valid","payload","traversal","duplicate","extra","inner"}){
    var zip=Path.Combine(root,variant+".zip");var m=Metadata(zip,variant);var r=DesktopUpdateRelease.Parse(Json(m),true);var stage=Path.Combine(root,variant);
    if(variant=="valid"){
     r.ValidateArchive(zip,stage);Assert(File.ReadAllText(Path.Combine(stage,"IRIS.exe"))=="new payload IRIS.exe","Valid package not extracted");Assert(Directory.GetFiles(stage).Length==10,"Unexpected extracted payload");
     Assert(DesktopUpdateRelease.CompareVersions("0.10.0","0.9.9")>0,"Lexical version comparison would miss update");
     Assert(DesktopUpdateRelease.CompareVersions("0.2.0","0.2.0")==0,"Same version offered");
     foreach(var invalid in new[]{"0.2","v0.2.0","0.02.0","-1.2.0","0.2.0-beta","99999999.0.0"})Reject(()=>DesktopUpdateRelease.CompareVersions(invalid,"0.1.0"),"Malformed version accepted");
     foreach(var key in new[]{"product","architecture","signature","minUpdaterVersion","queueSchemaVersion","sha256","sizeBytes"}){var bad=new Dictionary<string,object>(m);bad[key]=key=="minUpdaterVersion"?(object)2:key=="queueSchemaVersion"?(object)4:key=="sizeBytes"?(object)33554433:"invalid";Reject(()=>DesktopUpdateRelease.Parse(Json(bad),true),"Invalid metadata accepted "+key);}
     var outer=new Dictionary<string,object>(m);outer["arbitraryUrl"]="https://evil.test/payload";Reject(()=>DesktopUpdateRelease.Parse(Json(outer),true),"Unrecognized control metadata accepted");
     File.AppendAllText(zip,"tamper");Reject(()=>r.ValidateArchive(zip,Path.Combine(root,"tampered")),"Corrupt ZIP accepted");
    }else Reject(()=>r.ValidateArchive(zip,stage),"Unsafe package accepted "+variant);
   }
   Assert(!File.Exists(Path.Combine(root,"escape.exe")),"Archive escaped staging");
   var installPolicy=typeof(DesktopUpdateRelease).Assembly.GetType("IrisDesktop.DesktopUpdateInstall");
   Assert(installPolicy!=null,"Missing transactional updater: cannot back up or restore app files");
   var package=Path.Combine(root,"install.zip");var metadata=Metadata(package,"valid");var candidate=DesktopUpdateRelease.Parse(Json(metadata),true);
   var install=Path.Combine(root,"installed");candidate.ValidateArchive(package,install);
   // A real old manifest and payload, independent expected strings/hashes.
   var original=Names.ToDictionary(n=>n,n=>Encoding.UTF8.GetBytes("old payload "+n));
   foreach(var n in Names)File.WriteAllBytes(Path.Combine(install,n),original[n]);
   var old=new Dictionary<string,object>(metadata);old.Remove("sizeBytes");old.Remove("sha256");old["version"]="0.1.0";old["files"]=Names.Select(n=>new {name=n,sizeBytes=original[n].Length,sha256=Hash(original[n])}).ToArray();File.WriteAllText(Path.Combine(install,"manifest.json"),Json(old));
   var prepare=installPolicy.GetMethod("Prepare");var replace=installPolicy.GetMethod("InstallFiles");var restore=installPolicy.GetMethod("Rollback");
   var tx=(string)prepare.Invoke(null,new object[]{package,Json(metadata),install});
   Assert(File.ReadAllText(Path.Combine(install,"IRIS.exe"))=="old payload IRIS.exe","Preparation replaced live app");
   File.AppendAllText(Path.Combine(install,"README.txt")," changed");
   Reject(()=>replace.Invoke(null,new object[]{tx}),"Changed original overwritten");
   File.WriteAllBytes(Path.Combine(install,"README.txt"),original["README.txt"]);
   replace.Invoke(null,new object[]{tx});Assert(File.ReadAllText(Path.Combine(install,"IRIS.exe"))=="new payload IRIS.exe","App update not installed");
   restore.Invoke(null,new object[]{tx});Assert(File.ReadAllText(Path.Combine(install,"IRIS.exe"))=="old payload IRIS.exe","Rollback lost old app");Assert(File.ReadAllText(Path.Combine(install,"manifest.json"))==Json(old),"Rollback lost manifest");
   Assert(!File.Exists(Path.Combine(install,".iris-update-pending")),"Rollback left pending marker");
   var sentinel=Path.Combine(install,"personal.txt");File.WriteAllText(sentinel,"KEEP");
   foreach(var n in Names)File.WriteAllBytes(Path.Combine(install,n),original[n]);
   var tx2=(string)prepare.Invoke(null,new object[]{package,Json(metadata),install});replace.Invoke(null,new object[]{tx2});restore.Invoke(null,new object[]{tx2});Assert(File.ReadAllText(sentinel)=="KEEP","Updater modified unknown user files");
   var wait=installPolicy.GetMethod("WaitForParent");var current=System.Diagnostics.Process.GetCurrentProcess();Reject(()=>wait.Invoke(null,new object[]{current.Id,current.StartTime.ToUniversalTime().Ticks,1}),"Live parent accepted");
   // Mutate an original while real extraction is underway, not after Prepare.
   string large=Path.Combine(root,"slow.zip");var largeMetadata=Metadata(large,"slow");bool mutated=false,rejected=false;
   using(var watcher=new FileSystemWatcher(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Sanctum","IRIS","Updates"))){
    watcher.IncludeSubdirectories=true;watcher.NotifyFilter=NotifyFilters.FileName;
    watcher.Created+=(s,e)=>{if(e.Name.EndsWith("stage"+Path.DirectorySeparatorChar+"IRIS.exe")){File.AppendAllText(Path.Combine(install,"README.txt")," changed during extraction");mutated=true;}};
    watcher.EnableRaisingEvents=true;
    try{prepare.Invoke(null,new object[]{large,Json(largeMetadata),install});}catch{rejected=true;}
   }
   Assert(mutated,"Fixture did not observe extraction");Assert(rejected,"Original modified during extraction silently accepted");
   Assert(File.ReadAllText(Path.Combine(install,"README.txt")).EndsWith(" changed during extraction"),"Preparation overwrote changed original");
   File.WriteAllBytes(Path.Combine(install,"README.txt"),original["README.txt"]);
   // Simulate launch-before-journal crash (NewPid is still zero), with a host
   // owning the real shared queue exclusion. Only this fixture install is used.
   var tx3=(string)prepare.Invoke(null,new object[]{package,Json(metadata),install});replace.Invoke(null,new object[]{tx3});
   string journal=Path.Combine(tx3,"transaction.json");var record=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(journal));record["ParentId"]=Int32.MaxValue;record["ParentTicks"]=1;File.WriteAllText(journal,Json(record));
   var signaled=new System.Threading.ManualResetEvent(false);var releaseOwner=new System.Threading.ManualResetEvent(false);
   var owner=new System.Threading.Thread(()=>{using(var mutex=new System.Threading.Mutex(false,"Local\\SANCTUM.IRIS.Queue."+System.Security.Principal.WindowsIdentity.GetCurrent().User.Value)){bool held=false;try{try{held=mutex.WaitOne(0);}catch(System.Threading.AbandonedMutexException){held=true;}signaled.Set();releaseOwner.WaitOne();}finally{if(held)mutex.ReleaseMutex();}}});
   owner.Start();signaled.WaitOne();try{
    Reject(()=>installPolicy.GetMethod("Apply").Invoke(null,new object[]{tx3,true}),"Recovery allowed a live queue owner");
    Assert(File.ReadAllText(Path.Combine(install,"IRIS.exe"))=="new payload IRIS.exe","Recovery replaced files while a host owned queue");
    Assert(File.Exists(Path.Combine(install,".iris-update-pending")),"Unsafe recovery removed pending marker");
   }finally{releaseOwner.Set();owner.Join();signaled.Dispose();releaseOwner.Dispose();}
   installPolicy.GetMethod("MarkReady").Invoke(null,new object[]{Path.GetFileName(tx3),install});
   var ready=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(Path.Combine(tx3,"ready.json")));
   Assert(Convert.ToInt32(ready["pid"])==current.Id&&Convert.ToInt64(ready["ticks"])==current.StartTime.ToUniversalTime().Ticks&&Equals(ready["version"],"0.2.0"),"Startup handshake did not bind PID/start/version");
   restore.Invoke(null,new object[]{tx3});
   Reject(()=>installPolicy.GetMethod("MarkReady").Invoke(null,new object[]{Path.GetFileName(tx3),install}),"Rolled-back app accepted as new ready app");
   Console.WriteLine("PASS updater versions, strict metadata, payload hashes, ZIP traversal/duplicates/extra/inner mismatch; fixture "+root);
  }
 }
}
