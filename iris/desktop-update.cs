using System;
using System.IO;
using System.Net;
using System.Text;
using System.Diagnostics;
using System.Threading.Tasks;

namespace IrisDesktop {
 public sealed class DesktopUpdateState {
  public bool supported;public string installedVersion,availableVersion,phase,error;public int progress;
 }
 // HTTPS hosting is the release trust boundary; hashes detect damaged files,
 // not a compromised publisher. No arbitrary browser URL/path/command input.
 public sealed class DesktopUpdater {
  const string Origin="https://sanctum-tawny-three.vercel.app";
  readonly string install,version;readonly object gate=new object();bool working;
  DateTime lastCheck=DateTime.MinValue;DesktopUpdateRelease release;string metadata,transaction;
  DesktopUpdateState state;public event EventHandler Changed;
  public DesktopUpdater(string install,string version){DesktopUpdateRelease.CompareVersions(version,version);this.install=install;this.version=version;state=new DesktopUpdateState {supported=true,installedVersion=version,phase="idle",progress=0};}
  public object State(){lock(gate)return new DesktopUpdateState {supported=true,installedVersion=version,availableVersion=state.availableVersion,phase=state.phase,error=state.error,progress=state.progress};}
  void Set(string phase,string error,int progress){lock(gate){state.phase=phase;state.error=error;state.progress=progress;state.availableVersion=release==null?null:release.Version;}var changed=Changed;if(changed!=null)changed(this,EventArgs.Empty);}
  static void Download(string relative,string path,long limit,int seconds,Action<int> progress){
   var request=(HttpWebRequest)WebRequest.Create(Origin+relative);request.AllowAutoRedirect=false;request.Timeout=10000;request.ReadWriteTimeout=10000;request.Credentials=null;request.UseDefaultCredentials=false;request.Proxy=WebRequest.DefaultWebProxy;request.CachePolicy=new System.Net.Cache.RequestCachePolicy(System.Net.Cache.RequestCacheLevel.NoCacheNoStore);
   using(var response=(HttpWebResponse)request.GetResponse()){
    if(response.StatusCode!=HttpStatusCode.OK||response.ResponseUri.AbsoluteUri!=Origin+relative||response.ContentLength>limit)throw new IOException("Unsupported download");
    using(var input=response.GetResponseStream())using(var output=new FileStream(path,FileMode.CreateNew,FileAccess.Write,FileShare.None)){
     long total=0;var clock=Stopwatch.StartNew();var bytes=new byte[8192];int count,last=-1;
     while((count=input.Read(bytes,0,bytes.Length))>0){total+=count;if(total>limit||clock.Elapsed.TotalSeconds>seconds)throw new IOException("Download limit");output.Write(bytes,0,count);int p=response.ContentLength>0?(int)(total*100/response.ContentLength):0;if(p!=last){last=p;if(progress!=null)progress(p);}}output.Flush(true);
    }
   }
  }
  public async Task<object> CheckAsync(){
   lock(gate){if(working||transaction!=null||DateTime.UtcNow-lastCheck<TimeSpan.FromMinutes(30))return State();working=true;lastCheck=DateTime.UtcNow;}
   Set("checking",null,0);string path=null;
   try{await Task.Run(()=>{Directory.CreateDirectory(DesktopUpdateInstall.Root);path=Path.Combine(DesktopUpdateInstall.Root,"metadata-"+Guid.NewGuid().ToString("N")+".json");Download("/IRIS/downloads/download.json",path,DesktopUpdateRelease.MetadataLimit,10,null);string json=File.ReadAllText(path,new UTF8Encoding(false,true));var candidate=DesktopUpdateRelease.Parse(json,true);lock(gate){release=DesktopUpdateRelease.CompareVersions(candidate.Version,version)>0?candidate:null;metadata=release==null?null:json;}});Set(release==null?"idle":"available",null,0);}
   catch{lock(gate){release=null;metadata=null;}Set("error","check_failed",0);}
   finally{if(path!=null&&File.Exists(path))File.Delete(path);lock(gate)working=false;}return State();
  }
  public async Task<object> PrepareAsync(){
   lock(gate){if(transaction!=null)return State();if(working||release==null||metadata==null)throw new IOException("No update available");working=true;}
   Set("downloading",null,0);string zip=null;
   try{await Task.Run(()=>{zip=Path.Combine(DesktopUpdateInstall.Root,"download-"+Guid.NewGuid().ToString("N")+".zip");Download("/IRIS/downloads/IRIS-beta.zip",zip,release.SizeBytes,60,p=>Set("downloading",null,p));transaction=DesktopUpdateInstall.Prepare(zip,metadata,install);});Set("ready",null,100);}
   catch{Set("error","prepare_failed",0);}
   finally{if(zip!=null&&File.Exists(zip))File.Delete(zip);lock(gate)working=false;}return State();
  }
  public object Apply(){lock(gate){if(working||transaction==null||state.phase!="ready")throw new IOException("No verified update ready");DesktopUpdateInstall.StartHelper(transaction,false);Set("installing",null,100);return State();}}
 }
}
