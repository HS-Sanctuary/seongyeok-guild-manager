using System;
using System.IO;
using System.Linq;
using System.Diagnostics;
using System.Runtime.ExceptionServices;
using System.Threading;
using System.Web.Script.Serialization;

namespace IrisDesktop {
 // Test-only observations of owned synthetic files. Never included in the host.
 internal static class N04Diagnostics {
  static string file;static readonly object gate=new object();
  [ThreadStatic] static bool writing;
  internal static void Start(string root,string mode){
   file=Path.Combine(root,"diagnostic-"+Process.GetCurrentProcess().Id+".jsonl");
   AppDomain.CurrentDomain.FirstChanceException+=Exception;
   Event("process-start",new {mode,rootLength=root.Length,journalTempLength=Path.Combine(root,"development","ergon-actions-v1.dpapi."+new string('x',32)+".tmp").Length});
  }
  static void Exception(object sender,FirstChanceExceptionEventArgs e){
   if(!(e.Exception is IOException))return;
   var frames=new StackTrace(false).GetFrames()??new StackFrame[0];
   Event("io-exception",new {type=e.Exception.GetType().Name,hresult=e.Exception.HResult,methods=frames.Select(f=>f.GetMethod().Name).ToArray()});
  }
  internal static void Event(string stage,object detail){
   if(file==null||writing)return;writing=true;
   try{lock(gate)File.AppendAllText(file,new JavaScriptSerializer().Serialize(new {stage,detail,ticks=Stopwatch.GetTimestamp(),pid=Process.GetCurrentProcess().Id,thread=Thread.CurrentThread.ManagedThreadId})+Environment.NewLine);}catch{}finally{writing=false;}
  }
  internal static void Stop(){Event("process-end",null);AppDomain.CurrentDomain.FirstChanceException-=Exception;file=null;}
  static string GcName(string root){using(var hash=System.Security.Cryptography.SHA256.Create())return "Local\\IRIS-N04-"+BitConverter.ToString(hash.ComputeHash(System.Text.Encoding.UTF8.GetBytes(root))).Replace("-","");}
  internal static void ArmGc(string root){
   var ready=new ManualResetEventSlim();var name=GcName(root);
   var thread=new Thread(()=>{using(var request=new EventWaitHandle(false,EventResetMode.ManualReset,name+"-request"))using(var done=new EventWaitHandle(false,EventResetMode.ManualReset,name+"-done")){ready.Set();if(!request.WaitOne(30000))return;GC.Collect();GC.WaitForPendingFinalizers();Event("owned-worker-gc",null);done.Set();}});
   thread.IsBackground=true;thread.Start();if(!ready.Wait(10000))throw new Exception("N04 owned GC channel did not initialize");
  }
  internal static void ForceOwnedGc(string root){using(var request=EventWaitHandle.OpenExisting(GcName(root)+"-request"))using(var done=EventWaitHandle.OpenExisting(GcName(root)+"-done")){request.Set();if(!done.WaitOne(10000))throw new Exception("N04 owned GC channel did not ACK");}}
  internal static void RecoveryBoundary(string root){
   foreach(var kind in new[]{"journal","game"}){
    var owned=Path.Combine(root,kind);var j=new DesktopLifeJournal(owned,"development",false);
    j.Begin(Guid.NewGuid().ToString("D"),"synthetic-account","synthetic-character","crafting","synthetic-sword",5);
    var before=File.ReadAllBytes(j.FilePath);bool rejected=false;
    using(var held=kind=="game"?j.AcquireExecutionLease():new FileStream(j.FilePath+".lock",FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None)){
     try{new DesktopLifeExecutor(j,k=>System.Threading.Tasks.Task.FromResult<object>(null),()=>System.Threading.Tasks.Task.FromResult<object>(null),k=>System.Threading.Tasks.Task.FromResult<object>(null),(a,n)=>System.Threading.Tasks.Task.FromResult("unused"),p=>false,()=>false,()=>1,()=>DateTime.UtcNow);}
     catch(IOException){rejected=true;}
    }
    if(!before.SequenceEqual(File.ReadAllBytes(j.FilePath)))throw new Exception("N04 recovery boundary rewrote protected synthetic journal");
    if(rejected!=(kind=="journal"))throw new Exception("N04 recovery "+kind+" I/O was confused with live sibling lease");
   }
   Console.WriteLine("PASS N04 recovery distinguishes journal I/O from live game lease without mutation");
  }
 }
}
