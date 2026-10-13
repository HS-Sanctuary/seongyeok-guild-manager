using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace IrisDesktop {
 public sealed class DesktopLifeExecutor {
  readonly DesktopLifeJournal journal;readonly Func<string,Task<object>> read,named;
  readonly Func<Task<object>> currency;readonly Func<string,string,Task<string>> perform;
  readonly Func<object,bool> confirm;readonly Func<bool> allowed;readonly Func<long> epoch;readonly Func<DateTime> clock;
  readonly SemaphoreSlim mutation=new SemaphoreSlim(1,1);readonly object stateGate=new object();
  Dictionary<string,object> context,prepared,current;long contextVersion;Task running;
  public bool Busy {get{lock(stateGate)return running!=null&&!running.IsCompleted;}}
  public DesktopLifeExecutor(DesktopLifeJournal journal,Func<string,Task<object>> read,Func<Task<object>> currency,Func<string,Task<object>> named,Func<string,string,Task<string>> perform,Func<object,bool> confirm,Func<bool> allowed,Func<long> epoch,Func<DateTime> clock){
   if(journal==null||read==null||currency==null||named==null||perform==null||confirm==null||allowed==null||epoch==null||clock==null)throw new ArgumentException();
   this.journal=journal;this.read=read;this.currency=currency;this.named=named;this.perform=perform;this.confirm=confirm;this.allowed=allowed;this.epoch=epoch;this.clock=clock;
   try{journal.RecoverInterrupted();}catch(IOException){/* A living sibling may own the execution lease; do not reinterpret its action. */}
  }
  public object Capabilities(){return new {schemaVersion=1,actions=new[]{"gathering","altering","crafting","collect"},gatheringNames=new[]{"\uD1B5\uB098\uBB34"},queue=false,collectCostKnown=false};}
  public object SetContext(Dictionary<string,object> value){
   DesktopLifePolicy.Exact(value,"accountId","characterId","accountLabel","characterLabel");
   DesktopLifePolicy.Text(value["accountId"],100);DesktopLifePolicy.Text(value["accountLabel"],100);
   if(value["characterId"]!=null){DesktopLifePolicy.Text(value["characterId"],100);DesktopLifePolicy.Text(value["characterLabel"],12);}else if(value["characterLabel"]!=null)DesktopLifePolicy.Fail("life_invalid");
   lock(stateGate){if(running!=null&&!running.IsCompleted)DesktopLifePolicy.Fail("life_busy");if(context==null||value.Any(pair=>!Equals(DesktopLifePolicy.Get(context,pair.Key),pair.Value))){contextVersion++;prepared=null;context=new Dictionary<string,object>(value);}}
   return new {schemaVersion=1};
  }
  Dictionary<string,object> Intent(Dictionary<string,object> value){
   DesktopLifePolicy.Exact(value,"accountId","characterId","action","displayName");
   DesktopLifePolicy.Text(value["accountId"],100);DesktopLifePolicy.Text(value["characterId"],100);DesktopLifePolicy.Text(value["displayName"]);
   if(!new[]{"gathering","altering","crafting","collect"}.Contains(value["action"] as string))DesktopLifePolicy.Fail("life_unsupported");
   lock(stateGate)if(context==null||!Equals(context["accountId"],value["accountId"])||!Equals(context["characterId"],value["characterId"]))DesktopLifePolicy.Fail("life_context_changed");
   return new Dictionary<string,object>(value);
  }
  void Ready(long version,long document){if(!allowed())DesktopLifePolicy.Fail("life_hidden");if(epoch()!=document)DesktopLifePolicy.Fail("life_context_changed");lock(stateGate)if(contextVersion!=version)DesktopLifePolicy.Fail("life_context_changed");}
  void ObservationContext(long version,long document){if(epoch()!=document)DesktopLifePolicy.Fail("life_context_changed");lock(stateGate)if(contextVersion!=version)DesktopLifePolicy.Fail("life_context_changed");}
  async Task<LifePreflight> Check(Dictionary<string,object> intent,long version,long document){
   Ready(version,document);if(journal.HasUnresolved())DesktopLifePolicy.Fail("life_unresolved");
   var activity=await read("activity");DesktopLifePolicy.SafeActivity(DesktopLifePolicy.Data(activity,"activity",clock()));Ready(version,document);
   var inventory=await read("inventory");DesktopLifePolicy.InventoryRoom(DesktopLifePolicy.Data(inventory,"inventory",clock()));Ready(version,document);
   var currencyValue=await currency();long wings=DesktopLifePolicy.Wings(currencyValue,clock());Ready(version,document);
   string action=(string)intent["action"],name=(string)intent["displayName"];
   var worksValue=await read("works");var works=DesktopLifePolicy.Data(worksValue,"works",clock());Ready(version,document);
   var catalogValue=action=="collect"?null:await read(action);var catalog=action=="collect"?null:DesktopLifePolicy.Data(catalogValue,action,clock());Ready(version,document);
   var before=DesktopLifePolicy.Target(action,name,catalog,works,wings);
   var namedValue=await named(name);var stock=DesktopLifePolicy.Data(namedValue,"materials",clock());Ready(version,document);before.owned=DesktopLifePolicy.Owned(stock,name);
   // The first snapshot may have aged while later fixed reads completed. Validate the whole set at the end.
   DesktopLifePolicy.SafeActivity(DesktopLifePolicy.Data(activity,"activity",clock()));DesktopLifePolicy.InventoryRoom(DesktopLifePolicy.Data(inventory,"inventory",clock()));DesktopLifePolicy.Wings(currencyValue,clock());DesktopLifePolicy.Data(worksValue,"works",clock());DesktopLifePolicy.Data(namedValue,"materials",clock());if(catalogValue!=null)DesktopLifePolicy.Data(catalogValue,action,clock());
   return before;
  }
  object Preview(Dictionary<string,object> p,LifePreflight before){
   Dictionary<string,object> labels;lock(stateGate)labels=new Dictionary<string,object>(context);
   return new {schemaVersion=1,nonce=p["nonce"],expiresAt=p["expiresAt"],accountId=p["accountId"],characterId=p["characterId"],accountLabel=labels["accountLabel"],characterLabel=labels["characterLabel"],action=p["action"],displayName=p["displayName"],expectedWings=before.expectedWings,wings=before.wings,outputPerRun=before.outputPerRun==0?(int?)null:before.outputPerRun,owned=before.owned,facility=before.facility,completed=before.completedNames.Select(pair=>new {displayName=pair.Key,count=pair.Value}).ToArray()};
  }
  public async Task<object> PrepareAsync(Dictionary<string,object> value){
   if(!await mutation.WaitAsync(0))DesktopLifePolicy.Fail("life_busy");
   try{if(Busy)DesktopLifePolicy.Fail("life_busy");var intent=Intent(value);long version,document=epoch();lock(stateGate)version=contextVersion;
    var before=await Check(intent,version,document);intent["nonce"]=Guid.NewGuid().ToString("D");intent["expiresAt"]=DesktopLifePolicy.Time(clock().AddSeconds(120));intent["document"]=document;intent["contextVersion"]=version;
    lock(stateGate)prepared=intent;return Preview(intent,before);
   }finally{mutation.Release();}
  }
  public async Task<object> ConfirmAsync(Dictionary<string,object> value){
   DesktopLifePolicy.Exact(value,"nonce");var nonce=DesktopLifePolicy.Text(value["nonce"],36);
   if(!await mutation.WaitAsync(0))DesktopLifePolicy.Fail("life_busy");FileStream lease=null;
   try{
    if(Busy)DesktopLifePolicy.Fail("life_busy");Dictionary<string,object> intent;
    lock(stateGate){if(prepared==null||!Equals(prepared["nonce"],nonce))DesktopLifePolicy.Fail("life_nonce_invalid");intent=prepared;prepared=null;}
    long version=(long)intent["contextVersion"],document=(long)intent["document"];Ready(version,document);
    if(DesktopLifePolicy.Time(clock())>=(long)intent["expiresAt"])DesktopLifePolicy.Fail("life_nonce_expired");
    lease=journal.AcquireExecutionLease();var before=await Check(intent,version,document);
    if(!confirm(Preview(intent,before)))return new {schemaVersion=1,id=nonce,state="cancelled"};
    Ready(version,document);if(DesktopLifePolicy.Time(clock())>=(long)intent["expiresAt"])DesktopLifePolicy.Fail("life_nonce_expired");
    // A human can take time in the trusted native prompt. Re-read safety and cost after it.
    before=await Check(intent,version,document);Ready(version,document);if(DesktopLifePolicy.Time(clock())>=(long)intent["expiresAt"])DesktopLifePolicy.Fail("life_nonce_expired");
    journal.Begin(nonce,(string)intent["accountId"],(string)intent["characterId"],(string)intent["action"],(string)intent["displayName"],before.expectedWings);
    lock(stateGate){current=new Dictionary<string,object>{{"id",nonce},{"accountId",intent["accountId"]},{"characterId",intent["characterId"]},{"action",intent["action"]},{"displayName",intent["displayName"]},{"state","running"},{"expectedWings",before.expectedWings},{"beforeWings",before.wings},{"afterWings",null},{"afterOwned",null},{"message",null}};
     var ownedLease=lease;lease=null;running=Task.Run(()=>Run(intent,before,version,document,ownedLease));}
    return new {schemaVersion=1,id=nonce,state="running"};
   }finally{if(lease!=null)lease.Dispose();mutation.Release();}
  }
  async Task Run(Dictionary<string,object> intent,LifePreflight before,long version,long document,FileStream lease){
   string outcome="unknown";long? afterWings=null,afterOwned=null;
   try{
    // Consent and the final preflight already committed the action. Window hiding after that
    // must not turn a verifiable result into an unresolved global lock.
    ObservationContext(version,document);var raw=await perform((string)intent["action"],(string)intent["displayName"]);ObservationContext(version,document);
    var afterWorks=DesktopLifePolicy.Data(await read("works"),"works",clock());ObservationContext(version,document);
    afterWings=DesktopLifePolicy.Wings(await currency(),clock());ObservationContext(version,document);
    string action=(string)intent["action"],name=(string)intent["displayName"];
    if(action=="crafting"||action=="gathering")afterOwned=DesktopLifePolicy.Owned(DesktopLifePolicy.Data(await named(name),"materials",clock()),name);
    outcome=DesktopLifePolicy.Outcome(action,name,raw,afterWorks,before);
    if(before.expectedWings.HasValue){var debit=before.wings-afterWings.Value;if(outcome=="rejected"?debit!=0:debit!=before.expectedWings.Value)outcome="unknown";}
    if((action=="crafting"||action=="gathering")&&outcome=="completed"&&(!before.owned.HasValue||!afterOwned.HasValue||afterOwned.Value<=before.owned.Value))outcome="unknown";
   }catch{outcome="unknown";}
   try{journal.SetOutcome((string)intent["nonce"],outcome);}catch{outcome="unknown";}
   finally{lock(stateGate){current["state"]=outcome;current["afterWings"]=afterWings;current["afterOwned"]=afterOwned;current["message"]=outcome=="unknown"?"life_result_unknown":null;}lease.Dispose();}
  }
  public object CancelPrepared(Dictionary<string,object> value){
   DesktopLifePolicy.Exact(value,"nonce");var nonce=DesktopLifePolicy.Text(value["nonce"],36);
   lock(stateGate)if(prepared!=null&&Equals(prepared["nonce"],nonce))prepared=null;
   return new {schemaVersion=1};
  }
  public object State(){bool busy=Busy;Dictionary<string,object> job;lock(stateGate)job=current!=null&&context!=null&&Equals(current["accountId"],context["accountId"])?new Dictionary<string,object>(current):null;return new {schemaVersion=1,busy=busy,blocked=busy||journal.HasUnresolved(),state=job==null?"idle":job["state"],current=job};}
  public object History(Dictionary<string,object> value){DesktopLifePolicy.Exact(value,"accountId");lock(stateGate)if(context==null||!Equals(context["accountId"],value["accountId"]))DesktopLifePolicy.Fail("life_context_changed");return new {schemaVersion=1,blocked=Busy||journal.HasUnresolved(),records=journal.EntriesFor((string)value["accountId"])};}
 }
}
