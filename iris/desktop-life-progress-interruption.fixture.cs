using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Web.Script.Serialization;
namespace IrisDesktop {
 // Compiled only by the isolated test runner. No product stop hook or actual CLI.
 public static class ProgressInterruptionFixture {
  static readonly JavaScriptSerializer Json=new JavaScriptSerializer();
  static void Need(bool ok,string why){if(!ok)throw new Exception(why);}
  static string Digest(string file){using(var hash=SHA256.Create())return BitConverter.ToString(hash.ComputeHash(File.ReadAllBytes(file))).Replace("-","");}
  static string Canonical(object value){return ProgressDomain.Canonical(value);}
  static Dictionary<string,object> Read(string file){return (Dictionary<string,object>)Json.DeserializeObject(File.ReadAllText(file));}
  static void Save(string file,object value){var bytes=Encoding.UTF8.GetBytes(Json.Serialize(value));using(var stream=new FileStream(file,FileMode.CreateNew,FileAccess.Write,FileShare.None)){stream.Write(bytes,0,bytes.Length);stream.Flush(true);}}
  static Dictionary<string,object> Identity(){return new Dictionary<string,object>{{"accountId","synthetic-account"},{"characterId","synthetic-character"}};}
  sealed class PausedBegin:IProgressExecutionActor {
   readonly IProgressExecutionActor inner;readonly Action pause;
   internal PausedBegin(IProgressExecutionActor inner,Action pause){this.inner=inner;this.pause=pause;}
   public Task<IDisposable> AcquireMutationAsync(){return inner.AcquireMutationAsync();}
   public ProgressExecutionContext CaptureContext(){return inner.CaptureContext();}
   public ProgressPreparedRequest CapturePrepared(string id){return inner.CapturePrepared(id);}
   public void ConsumeNonce(ProgressPreparedRequest p){inner.ConsumeNonce(p);}
   public Task<IDisposable> AcquireExecutionLeaseAsync(ProgressPreparedRequest p){return inner.AcquireExecutionLeaseAsync(p);}
   public Task<bool> ApproveAsync(ProgressPreparedRequest p){return inner.ApproveAsync(p);}
   public Task RevalidateAsync(ProgressPreparedRequest p){return inner.RevalidateAsync(p);}
   public void RecordBegin(ProgressPreparedRequest p){inner.RecordBegin(p);pause();throw new Exception("pause unexpectedly returned");}
   public void Dispatch(ProgressPreparedRequest p,ProgressRunLease offer){throw new Exception("N04 dispatched past the stop point");}
  }
  static async Task SeedHistory(ProgressHostFixture.Trial t,object c){
   var p=await ProgressHostFixture.Bound(t,c);await t.Confirm(p);await ProgressHostFixture.Wait(t);
   var s=t.store.Load(ProgressHostFixture.Scope());await ProgressHostFixture.Request(c,"confirmQuantity",ProgressHostFixture.ConfirmPayload(s,3));s=t.store.Load(ProgressHostFixture.Scope());
   var g=s.view.goals.Single();var request=g.requests.Single();
   // Seed a pre-existing correction with the already-approved Store domain, not a browser approval bypass.
   var mutation=new ProgressMutation{kind="CorrectQuantity",scope=ProgressHostFixture.Scope(),goalId=g.goalId,requestId=request.requestId,quantity=2,source="user-confirmed",supersedesEventId=request.confirmations.Last().eventId,reason="synthetic seed correction",confirmation=new QuantityAcknowledgement{requestId=request.requestId,quantity=2,revision=s.revision,correction=true}};
   Need(t.store.Commit(mutation,s.revision,Guid.NewGuid()).status=="committed","history correction seed");
  }
  static void Marker(ProgressHostFixture.Trial t,string mode,string id){
   var s=t.store.Load(ProgressHostFixture.Scope());var history=s.view.goals.First();
   Need(history.confirmedQuantity==2&&history.requests.Single().confirmations.Length==2,"seed history changed");
   int dispatches=File.Exists(Path.Combine(t.root,"dispatches.log"))?File.ReadAllLines(Path.Combine(t.root,"dispatches.log")).Length:0;
   Save(Path.Combine(t.root,"ready.json"),new {pid=Process.GetCurrentProcess().Id,mode=mode,requestId=id,progressDigest=Digest(t.store.FilePath),history=Canonical(history),rows=t.journal.EntriesFor("synthetic-account"),dispatches=dispatches});
  }
  static async Task Execute(string root,string mode){
   var t=new ProgressHostFixture.Trial(root,true);t.store=new DesktopErgonProgressStore(root,"development");var c=ProgressHostFixture.Attach(t);await SeedHistory(t,c);
   // The seed used its nonce. Start a fresh actor/session before the decorated admission.
   t=new ProgressHostFixture.Trial(root,true);t.store=new DesktopErgonProgressStore(root,"development");c=ProgressHostFixture.Attach(t);
   var goal=await ProgressHostFixture.Goal(t,c,"synthetic-next-plan");var p=await t.Prepare();string id=(string)p["nonce"];
   t.onPerform=()=>File.AppendAllText(Path.Combine(root,"dispatches.log"),"fake-command\n");
   if(mode=="after-begin"){
    var paused=new PausedBegin((IProgressExecutionActor)c,()=>{Marker(t,mode,id);Thread.Sleep(Timeout.Infinite);});
    var coordinator=new ProgressCoordinator(t.store,paused,()=>DesktopLifePolicy.Time(t.now));
    Need((await coordinator.BindPreparedAsync(id,t.store.Load(ProgressHostFixture.Scope()).revision,Guid.NewGuid())).status=="bound","paused binding ACK");
    await coordinator.ConfirmAsync(id);throw new Exception("N04 Begin pause was not reached");
   }
   var payload=ProgressHostFixture.Payload(t.store.Load(ProgressHostFixture.Scope()).revision);payload["goalId"]=goal;payload["nonce"]=id;
   Need(((ProgressExecutionResult)await ProgressHostFixture.Request(c,"bindPrepared",payload)).status=="bound","binding ACK");
   if(mode=="response-loss"){
    t.execution=new TaskCompletionSource<string>();t.onPerform=()=>{File.AppendAllText(Path.Combine(root,"dispatches.log"),"fake-command\n");Marker(t,mode,id);};
    await t.Confirm(p);await t.execution.Task;throw new Exception("pending response unexpectedly returned");
   }
   await t.Confirm(p);await ProgressHostFixture.Wait(t);Marker(t,mode,id);
  }
  static void Probe(string root){
   var m=Read(Path.Combine(root,"ready.json"));var j=new DesktopLifeJournal(root,"development",false);var s=new DesktopErgonProgressStore(root,"development");
   Need(Digest(s.FilePath)==(string)m["progressDigest"],"paused progress changed");
   bool held=false;try{using(j.AcquireExecutionLease()){};}catch(IOException){held=true;}Need(held,"paused child lost game lease");
   bool writerHeld=false;try{using(s.AcquireWriter(new ProgressLockOwner())){};}catch(IOException){writerHeld=true;}catch(InvalidOperationException){writerHeld=true;}
   Need(writerHeld==Equals(m["mode"],"after-begin"),"writer lifetime at stop point");
   Need(Equals(j.EntriesFor("synthetic-account").Cast<Dictionary<string,object>>().Single(x=>Equals(x["requestId"],m["requestId"]))["state"],"inflight"),"paused journal is not inflight");
   Console.WriteLine("PASS N04 paused lease / writer / inflight / progress digest");
  }
  static async Task Verify(string root,bool reopen){
   var m=Read(Path.Combine(root,"ready.json"));string mode=(string)m["mode"],id=(string)m["requestId"];bool normal=mode=="normal";
   var j=new DesktopLifeJournal(root,"development",false);string nativeBefore=Digest(j.FilePath);var before=j.EntriesFor("synthetic-account").Cast<Dictionary<string,object>>().ToArray();
   Need(Equals(before.Single(x=>Equals(x["requestId"],id))["state"],normal?"completed":reopen?"unknown":"inflight"),"restart input state mismatch");
   var t=new ProgressHostFixture.Trial(root,true);t.store=new DesktopErgonProgressStore(root,"development");var c=ProgressHostFixture.Attach(t);
   t.onPerform=()=>File.AppendAllText(Path.Combine(root,"dispatches.log"),"unexpected-replay\n");
   var expected=before.Select(row=>new Dictionary<string,object>(row)).ToArray();if(!normal)expected.Single(row=>Equals(row["requestId"],id))["state"]="unknown";
   Need(Canonical(t.journal.EntriesFor("synthetic-account"))==Canonical(expected),"recovery changed fields other than inflight state");
   if(normal||reopen)Need(Digest(j.FilePath)==nativeBefore,"terminal or existing unknown bytes rewritten");
   string nativeStable=Digest(j.FilePath);var s=t.store.Load(ProgressHostFixture.Scope());var history=s.view.goals.First();var current=s.view.goals.Last();
   Need(Canonical(history)==(string)m["history"],"confirmed/correction history changed");Need(current.requests.Single().quantity==null&&!current.quantitySatisfied,"expected quantity promoted");
   Need(current.requests.Single().terminalOutcome==(normal?"completed":null),"uncertain terminal promoted");
   var load=(ProgressProjection)await ProgressHostFixture.Request(c,"load",Identity());Need(load.health==(normal?"ok":"review-required"),"restart reconciliation health");
   bool rejected=false;try{await t.actor.ConfirmAsync(new Dictionary<string,object>{{"nonce",id}});}catch{rejected=true;}Need(rejected,"old nonce replay accepted");
   if(!normal){
    var quantity=ProgressHostFixture.Payload(s.revision);quantity["goalId"]=current.goalId;quantity["requestId"]=id;quantity["quantity"]=1;
    rejected=false;try{await ProgressHostFixture.Request(c,"confirmQuantity",quantity);}catch{rejected=true;}Need(rejected,"unknown allowed quantity");
    rejected=false;try{t.journal.Begin(Guid.NewGuid().ToString("D"),"synthetic-account","synthetic-character","crafting","synthetic-sword",5);}catch(IOException){rejected=true;}Need(rejected,"unknown allowed new Begin");
   }
   Need(t.calls==0&&Digest(t.store.FilePath)==(string)m["progressDigest"]&&Digest(j.FilePath)==nativeStable,"restart mutated protected state or consumed");
   using(t.journal.AcquireExecutionLease()){}using(t.store.AcquireWriter(new ProgressLockOwner())){}
   int dispatches=File.Exists(Path.Combine(root,"dispatches.log"))?File.ReadAllLines(Path.Combine(root,"dispatches.log")).Length:0;
   Need(dispatches==(mode=="after-begin"?0:1),"duplicate/new consumption across restart");
   var verified=new {pid=Process.GetCurrentProcess().Id,state=normal?"completed":"unknown",dispatches=dispatches,historyQuantity=history.confirmedQuantity,historyConfirmations=history.requests.Single().confirmations.Length,newQuantity=current.requests.Single().quantity};
   if(!reopen)Save(Path.Combine(root,"verified.json"),verified);
   Console.WriteLine(reopen?"PASS N04 stable reopen / unknown bytes / nonce / history / consumption":"PASS N04 recovery / inflight to unknown only / no quantity promotion or replay");
  }
  public static async Task Run(string root,string mode){Directory.CreateDirectory(root);if(mode=="probe")Probe(root);else if(mode=="recover"||mode=="reopen")await Verify(root,mode=="reopen");else await Execute(root,mode);}
 }
}
