using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.Collections.Generic;
using System.Security.Principal;
using System.Security.Cryptography;
using System.Web.Script.Serialization;

namespace IrisDesktop {
 public sealed class UpdateTransaction {
  public string InstallDir,State;public int ParentId,NewPid;public long ParentTicks,NewTicks;public DesktopUpdateFile[] Baseline;
 }
 // App files only. Never traverses the Desktop store/profile or game directory.
 public static class DesktopUpdateInstall {
  public static string Root {get{return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Sanctum","IRIS","Updates");}}
  const string Marker=".iris-update-pending";
  static readonly string[] Installed=DesktopUpdateRelease.Names.Concat(new[]{"manifest.json"}).ToArray();
  public static void SafePath(string path){
   if(!Path.IsPathRooted(path)||Path.GetFullPath(path)!=path||path.TrimEnd(Path.DirectorySeparatorChar)==Path.GetPathRoot(path).TrimEnd(Path.DirectorySeparatorChar))throw new ArgumentException("Unsafe path");
   for(string p=path;!String.IsNullOrEmpty(p);p=Path.GetDirectoryName(p)){if((File.Exists(p)||Directory.Exists(p))&&(File.GetAttributes(p)&FileAttributes.ReparsePoint)!=0)throw new ArgumentException("Linked path rejected");if(p==Path.GetPathRoot(p))break;}
  }
  public static string Transaction(string token){if(token==null||!System.Text.RegularExpressions.Regex.IsMatch(token,@"\A[a-f0-9]{32}\z"))throw new ArgumentException("Invalid transaction");string path=Path.Combine(Root,token);SafePath(path);return path;}
  static void ValidateTransaction(string path){if(!Path.IsPathRooted(path)||Transaction(Path.GetFileName(path))!=path)throw new ArgumentException("Unknown transaction");}
  static string Json(object x){return new JavaScriptSerializer().Serialize(x);}
  public static void AtomicText(string path,string text){SafePath(path);string tmp=path+"."+Guid.NewGuid().ToString("N")+".tmp";try{using(var file=new FileStream(tmp,FileMode.CreateNew,FileAccess.Write,FileShare.None)){byte[] bytes=new UTF8Encoding(false,true).GetBytes(text);file.Write(bytes,0,bytes.Length);file.Flush(true);}if(File.Exists(path))File.Replace(tmp,path,null);else File.Move(tmp,path);}finally{if(File.Exists(tmp))File.Delete(tmp);}}
  static void CopyAtomic(string source,string target){SafePath(source);SafePath(target);string tmp=target+"."+Guid.NewGuid().ToString("N")+".tmp";try{using(var input=File.OpenRead(source))using(var output=new FileStream(tmp,FileMode.CreateNew,FileAccess.Write,FileShare.None)){input.CopyTo(output);output.Flush(true);}if(File.Exists(target))File.Replace(tmp,target,null);else File.Move(tmp,target);}finally{if(File.Exists(tmp))File.Delete(tmp);}}
  public static UpdateTransaction Read(string tx){
   ValidateTransaction(tx);string path=Path.Combine(tx,"transaction.json");SafePath(path);if(new FileInfo(path).Length>65536)throw new ArgumentException("Journal limit");
   var data=new JavaScriptSerializer {MaxJsonLength=65536,RecursionLimit=12}.Deserialize<UpdateTransaction>(File.ReadAllText(path));
   if(data==null||!new[]{"prepared","installing","installed","committed","rolled-back"}.Contains(data.State)||data.ParentId<1||data.ParentTicks<1||data.Baseline==null||data.Baseline.Length!=Installed.Length||!Installed.All(n=>data.Baseline.Count(f=>f.name==n)==1)||data.Baseline.Any(f=>f.sizeBytes<1||f.sizeBytes>DesktopUpdateRelease.ZipLimit||!System.Text.RegularExpressions.Regex.IsMatch(f.sha256??"",@"\A[a-f0-9]{64}\z")))throw new ArgumentException("Invalid journal");
   CheckInstall(data.InstallDir);return data;
  }
  static void Write(string tx,UpdateTransaction data){AtomicText(Path.Combine(tx,"transaction.json"),Json(data));}
  static void CheckInstall(string install){SafePath(install);string desktop=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Sanctum","IRIS","Desktop");if(install.StartsWith(desktop,StringComparison.OrdinalIgnoreCase)||install.StartsWith(Root,StringComparison.OrdinalIgnoreCase)||Root.StartsWith(install+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new ArgumentException("Protected root overlap");}
  static void CheckFiles(string folder,DesktopUpdateFile[] expected){SafePath(folder);foreach(var f in expected){string path=Path.Combine(folder,f.name);SafePath(path);if(!File.Exists(path)||new FileInfo(path).Length!=f.sizeBytes||DesktopUpdateRelease.Hash(path)!=f.sha256)throw new IOException("File integrity mismatch");}}
  static void WriteProbe(string install){foreach(var n in Installed){string path=Path.Combine(install,n);SafePath(path);if((File.GetAttributes(path)&FileAttributes.ReadOnly)!=0)throw new IOException("Read-only installation");}string probe=Path.Combine(install,".iris-write-"+Guid.NewGuid().ToString("N"));try{using(var s=new FileStream(probe,FileMode.CreateNew,FileAccess.Write,FileShare.None)){s.WriteByte(1);s.Flush(true);}}finally{if(File.Exists(probe))File.Delete(probe);}}
  public static string Prepare(string zip,string metadata,string install){
   CheckInstall(install);var release=DesktopUpdateRelease.Parse(metadata,true);string manifestPath=Path.Combine(install,"manifest.json");SafePath(manifestPath);byte[] manifestBytes=File.ReadAllBytes(manifestPath);
   var baseline=DesktopUpdateRelease.Parse(new UTF8Encoding(false,true).GetString(manifestBytes),false);string manifestHash;using(var hash=SHA256.Create())manifestHash=BitConverter.ToString(hash.ComputeHash(manifestBytes)).Replace("-","").ToLowerInvariant();
   var originals=baseline.Files.Concat(new[]{new DesktopUpdateFile{name="manifest.json",sizeBytes=manifestBytes.Length,sha256=manifestHash}}).ToArray();CheckFiles(install,originals);WriteProbe(install);
   if(DesktopUpdateRelease.CompareVersions(release.Version,baseline.Version)<=0||File.Exists(Path.Combine(install,Marker)))throw new IOException("Update not applicable");
   Directory.CreateDirectory(Root);string tx=Transaction(Guid.NewGuid().ToString("N"));Directory.CreateDirectory(tx);
   release.ValidateArchive(zip,Path.Combine(tx,"stage"));AtomicText(Path.Combine(tx,"release.json"),metadata);
   CheckFiles(install,originals);
   var current=Process.GetCurrentProcess();var data=new UpdateTransaction {InstallDir=install,State="prepared",ParentId=current.Id,ParentTicks=current.StartTime.ToUniversalTime().Ticks,Baseline=originals};
   var backup=Path.Combine(tx,"backup");Directory.CreateDirectory(backup);foreach(var n in Installed)CopyAtomic(Path.Combine(install,n),Path.Combine(backup,n));CheckFiles(backup,data.Baseline);
   // This is the already installed helper, not an unverified downloaded program.
   CheckFiles(install,originals);CopyAtomic(Path.Combine(backup,"IRIS.Updater.exe"),Path.Combine(tx,"worker.exe"));Write(tx,data);return tx;
  }
  public static void InstallFiles(string tx){
   var data=Read(tx);if(data.State!="prepared")throw new IOException("Transaction already applied");
   var release=DesktopUpdateRelease.Parse(File.ReadAllText(Path.Combine(tx,"release.json")),true);CheckFiles(Path.Combine(tx,"stage"),release.Files);
   if(!release.SameRelease(DesktopUpdateRelease.Parse(File.ReadAllText(Path.Combine(tx,"stage","manifest.json")),false)))throw new IOException("Stage manifest mismatch");
   CheckFiles(data.InstallDir,data.Baseline);CheckFiles(Path.Combine(tx,"backup"),data.Baseline);WriteProbe(data.InstallDir);
   data.State="installing";Write(tx,data);AtomicText(Path.Combine(data.InstallDir,Marker),Path.GetFileName(tx));
   foreach(var n in Installed)CopyAtomic(Path.Combine(tx,"stage",n),Path.Combine(data.InstallDir,n));
   data.State="installed";Write(tx,data);
  }
  public static void Rollback(string tx){
   var pending=Read(tx);WithNoHost(pending.InstallDir,()=>RollbackFiles(tx));
  }
  static void WithNoHost(string install,Action action){
   using(var queue=new Mutex(false,"Local\\SANCTUM.IRIS.Queue."+WindowsIdentity.GetCurrent().User.Value)){bool owned=false;try{
    try{owned=queue.WaitOne(0);}catch(AbandonedMutexException){owned=true;}if(!owned)throw new IOException("Another IRIS running");
    // Covers a just-launched replacement before it has opened its queue or
    // journalled its PID. Unknown process identity fails closed.
    foreach(var host in Process.GetProcessesByName("IRIS"))using(host){if(!host.HasExited&&String.Equals(Path.GetFullPath(host.MainModule.FileName),Path.Combine(install,"IRIS.exe"),StringComparison.OrdinalIgnoreCase))throw new IOException("Installation is running");}
    action();
   }finally{if(owned)queue.ReleaseMutex();}}
  }
  static void RollbackFiles(string tx){
   var data=Read(tx);if(data.State=="rolled-back")return;if(data.State!="installing"&&data.State!="installed")throw new IOException("No installed transaction to restore");
   CheckFiles(Path.Combine(tx,"backup"),data.Baseline);
   foreach(var n in Installed)CopyAtomic(Path.Combine(tx,"backup",n),Path.Combine(data.InstallDir,n));
   CheckFiles(data.InstallDir,data.Baseline);data.State="rolled-back";Write(tx,data);ClearMarker(tx,data.InstallDir);
  }
  static void ClearMarker(string tx,string install){string marker=Path.Combine(install,Marker);SafePath(marker);if(File.Exists(marker)){if(File.ReadAllText(marker)!=Path.GetFileName(tx))throw new IOException("Another pending update");File.Delete(marker);}}
  public static void WaitForParent(int pid,long ticks,int timeout){
   try{using(var parent=Process.GetProcessById(pid)){if(parent.StartTime.ToUniversalTime().Ticks!=ticks)return;if(!parent.WaitForExit(timeout))throw new IOException("Parent still running");}}catch(ArgumentException){/* Parent already ended. */}
  }
  static Process Launch(string install,string args){return Process.Start(new ProcessStartInfo {FileName=Path.Combine(install,"IRIS.exe"),Arguments=args,WorkingDirectory=install,UseShellExecute=false,CreateNoWindow=true});}
  public static void MarkReady(string token,string install){
   string tx=Transaction(token);var data=Read(tx);if(data.State!="installed"||data.InstallDir!=install)throw new IOException("Unexpected startup");
   var release=DesktopUpdateRelease.Parse(File.ReadAllText(Path.Combine(tx,"release.json")),true);CheckFiles(install,release.Files);var p=Process.GetCurrentProcess();AtomicText(Path.Combine(tx,"ready.json"),Json(new {pid=p.Id,ticks=p.StartTime.ToUniversalTime().Ticks,version=release.Version}));
  }
  static bool Ready(string tx,Process p,DesktopUpdateRelease release){try{var r=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(Path.Combine(tx,"ready.json")));return Convert.ToInt32(r["pid"])==p.Id&&Convert.ToInt64(r["ticks"])==p.StartTime.ToUniversalTime().Ticks&&Equals(r["version"],release.Version);}catch{return false;}}
  public static void Apply(string tx,bool recover){
   var data=Read(tx);WaitForParent(data.ParentId,data.ParentTicks,30000);
   using(var mutex=new Mutex(false,"Local\\SANCTUM.IRIS.Update."+Path.GetFileName(tx))){bool held=false;try{try{held=mutex.WaitOne(0);}catch(AbandonedMutexException){held=true;}if(!held)return;
    data=Read(tx);
    if(recover){if(data.State=="committed"||data.State=="rolled-back"){ClearMarker(tx,data.InstallDir);return;}Rollback(tx);using(var old=Launch(data.InstallDir,"")){}return;}
    var release=DesktopUpdateRelease.Parse(File.ReadAllText(Path.Combine(tx,"release.json")),true);Process child=null;
    try{
     // Other IRIS hosts sharing the protected queue must be closed before replacement.
     WithNoHost(data.InstallDir,()=>InstallFiles(tx));
     child=Launch(data.InstallDir,"--updated "+Path.GetFileName(tx));data=Read(tx);data.NewPid=child.Id;data.NewTicks=child.StartTime.ToUniversalTime().Ticks;Write(tx,data);
     var deadline=DateTime.UtcNow.AddSeconds(45);while(!child.HasExited&&DateTime.UtcNow<deadline&&!Ready(tx,child,release))Thread.Sleep(150);
     if(child.HasExited||!Ready(tx,child,release))throw new IOException("New app not ready");
     data.State="committed";Write(tx,data);ClearMarker(tx,data.InstallDir);
    }catch{
     if(child!=null&&!child.HasExited){if(child.StartTime.ToUniversalTime().Ticks!=data.NewTicks||Path.GetFullPath(child.MainModule.FileName)!=Path.Combine(data.InstallDir,"IRIS.exe"))throw new IOException("Unknown process, recovery deferred");child.Kill();if(!child.WaitForExit(10000))throw new IOException("New app still running");}
     data=Read(tx);if(data.State=="installing"||data.State=="installed")Rollback(tx);
     using(var old=Launch(data.InstallDir,"")){}throw;
    }finally{if(child!=null)child.Dispose();}
   }finally{if(held)mutex.ReleaseMutex();}}
  }
  // At ordinary startup, don't load a partially installed runtime. The copied
  // standalone old helper reads its journal and restores before another launch.
  public static bool RecoverStartup(string install,string[] args){
   CheckInstall(install);string marker=Path.Combine(install,Marker);SafePath(marker);if(!File.Exists(marker))return false;
   string token=File.ReadAllText(marker);string tx=Transaction(token);var data=Read(tx);if(data.InstallDir!=install)throw new IOException("Unknown installation marker");
   if(args.Length==2&&args[0]=="--updated"&&args[1]==token&&data.State=="installed")return false;
   if(data.State=="committed"||data.State=="rolled-back"){ClearMarker(tx,install);return false;}
   using(var active=new Mutex(false,"Local\\SANCTUM.IRIS.Update."+token)){bool held=false;try{
    try{held=active.WaitOne(0);}catch(AbandonedMutexException){held=true;}if(!held)return true;
    data=Read(tx);
   // If a launched replacement is alive, a duplicate launch must not roll it back.
   if(data.NewPid>0)try{using(var child=Process.GetProcessById(data.NewPid)){if(child.StartTime.ToUniversalTime().Ticks==data.NewTicks&&!child.HasExited)return true;}}catch(ArgumentException){}
   var current=Process.GetCurrentProcess();data.ParentId=current.Id;data.ParentTicks=current.StartTime.ToUniversalTime().Ticks;Write(tx,data);
   StartHelper(tx,true);return true;
   }finally{if(held)active.ReleaseMutex();}}
  }
  public static void StartHelper(string tx,bool recover){var data=Read(tx);string worker=Path.Combine(tx,"worker.exe");SafePath(worker);if(DesktopUpdateRelease.Hash(worker)!=data.Baseline.Single(f=>f.name=="IRIS.Updater.exe").sha256)throw new IOException("Helper integrity mismatch");using(var helper=Process.Start(new ProcessStartInfo {FileName=worker,Arguments=(recover?"--recover ":"--apply ")+Path.GetFileName(tx),WorkingDirectory=tx,UseShellExecute=false,CreateNoWindow=true})){} }
 }
}
