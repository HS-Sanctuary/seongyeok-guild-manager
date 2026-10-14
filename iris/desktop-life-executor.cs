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
  Dictionary<string,object> context,prepared,current;long contextVersion;Task running;Task<string> performTask;
  Func<Task<string>> stop;readonly SemaphoreSlim control=new SemaphoreSlim(1,1);
  bool performInFlight,gatherUnsafe,sawGathering;int stopAttempts;long runVersion,runDocument;DateTime stopDeadline;Dictionary<string,object> gathering;
  public void BindStop(Func<Task<string>> stop){if(stop==null)throw new ArgumentException();lock(stateGate){if(Busy)DesktopLifePolicy.Fail("life_busy");this.stop=stop;}}
  Func<string,int,Task<string>> craft;
  public void BindCraft(Func<string,int,Task<string>> craft){if(craft==null)throw new ArgumentException();lock(stateGate){if(Busy)DesktopLifePolicy.Fail("life_busy");this.craft=craft;}}
  public bool Busy {get{lock(stateGate)return running!=null&&!running.IsCompleted;}}
  public DesktopLifeExecutor(DesktopLifeJournal journal,Func<string,Task<object>> read,Func<Task<object>> currency,Func<string,Task<object>> named,Func<string,string,Task<string>> perform,Func<object,bool> confirm,Func<bool> allowed,Func<long> epoch,Func<DateTime> clock){
   if(journal==null||read==null||currency==null||named==null||perform==null||confirm==null||allowed==null||epoch==null||clock==null)throw new ArgumentException();
   this.journal=journal;this.read=read;this.currency=currency;this.named=named;this.perform=perform;this.confirm=confirm;this.allowed=allowed;this.epoch=epoch;this.clock=clock;
   try{journal.RecoverInterrupted();}catch(IOException){/* A living sibling may own the execution lease; do not reinterpret its action. */}
  }
  public object Capabilities(){return new {schemaVersion=3,actions=new[]{"gathering","altering","crafting","collect"},gatheringNames=new[]{"\uD1B5\uB098\uBB34"},queue=false,collectCostKnown=false,quantityGathering=stop!=null,currentStop=stop!=null,quantityCrafting=craft!=null,maxCraftCount=5};}
  public object SetContext(Dictionary<string,object> value){
   DesktopLifePolicy.Exact(value,"accountId","characterId","accountLabel","characterLabel");
   DesktopLifePolicy.Text(value["accountId"],100);DesktopLifePolicy.Text(value["accountLabel"],100);
   if(value["characterId"]!=null){DesktopLifePolicy.Text(value["characterId"],100);DesktopLifePolicy.Text(value["characterLabel"],12);}else if(value["characterLabel"]!=null)DesktopLifePolicy.Fail("life_invalid");
   lock(stateGate){if(running!=null&&!running.IsCompleted)DesktopLifePolicy.Fail("life_busy");if(context==null||value.Any(pair=>!Equals(DesktopLifePolicy.Get(context,pair.Key),pair.Value))){contextVersion++;prepared=null;context=new Dictionary<string,object>(value);}}
   return new {schemaVersion=1};
  }
  Dictionary<string,object> Intent(Dictionary<string,object> value){
   bool quantity=value.ContainsKey("additionalQuantity")||value.ContainsKey("allowAutoStop");
   if(quantity){DesktopLifePolicy.Exact(value,"accountId","characterId","action","displayName","additionalQuantity","allowAutoStop");if(!Equals(value["action"],"gathering")||stop==null||!(value["allowAutoStop"] is bool))DesktopLifePolicy.Fail("life_unsupported");DesktopLifePolicy.Integer(value["additionalQuantity"],1,100);}else if(value.ContainsKey("craftCount")){DesktopLifePolicy.Exact(value,"accountId","characterId","action","displayName","craftCount");if(!Equals(value["action"],"crafting")||craft==null)DesktopLifePolicy.Fail("life_unsupported");DesktopLifePolicy.Integer(value["craftCount"],1,5);}else DesktopLifePolicy.Exact(value,"accountId","characterId","action","displayName");
   DesktopLifePolicy.Text(value["accountId"],100);DesktopLifePolicy.Text(value["characterId"],100);DesktopLifePolicy.Text(value["displayName"]);
   if(!new[]{"gathering","altering","crafting","collect"}.Contains(value["action"] as string))DesktopLifePolicy.Fail("life_unsupported");
   if(Equals(value["action"],"gathering")&&!quantity)DesktopLifePolicy.Fail("life_quantity_required");
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
   if(intent.ContainsKey("craftCount")){before.craftCount=(int)DesktopLifePolicy.Integer(intent["craftCount"],1,5);if(intent.ContainsKey("baselineOutput")&&!Equals(intent["baselineOutput"],before.outputPerRun))DesktopLifePolicy.Fail("life_recipe_changed");}
   var namedValue=await named(name);var stock=DesktopLifePolicy.Data(namedValue,"materials",clock());Ready(version,document);before.owned=intent.ContainsKey("additionalQuantity")?DesktopLifePolicy.GatherStock(stock,name):action=="crafting"?DesktopLifePolicy.CraftOwned(stock,name):DesktopLifePolicy.Owned(stock,name);
   if(intent.ContainsKey("additionalQuantity")){long quantity=DesktopLifePolicy.Integer(intent["additionalQuantity"],1,100);if(before.owned.Value>9007199254740991L-quantity)DesktopLifePolicy.Fail("life_invalid");if(intent.ContainsKey("baselineOwned")&&!Equals(intent["baselineOwned"],before.owned.Value))DesktopLifePolicy.Fail("life_stock_changed");}
   // The first snapshot may have aged while later fixed reads completed. Validate the whole set at the end.
   DesktopLifePolicy.SafeActivity(DesktopLifePolicy.Data(activity,"activity",clock()));DesktopLifePolicy.InventoryRoom(DesktopLifePolicy.Data(inventory,"inventory",clock()));DesktopLifePolicy.Wings(currencyValue,clock());DesktopLifePolicy.Data(worksValue,"works",clock());DesktopLifePolicy.Data(namedValue,"materials",clock());if(catalogValue!=null)DesktopLifePolicy.Data(catalogValue,action,clock());
   return before;
  }
  object Preview(Dictionary<string,object> p,LifePreflight before){
   Dictionary<string,object> labels;lock(stateGate)labels=new Dictionary<string,object>(context);
   var preview=DesktopLifePolicy.Plain(new {schemaVersion=1,nonce=p["nonce"],expiresAt=p["expiresAt"],accountId=p["accountId"],characterId=p["characterId"],accountLabel=labels["accountLabel"],characterLabel=labels["characterLabel"],action=p["action"],displayName=p["displayName"],expectedWings=before.expectedWings,wings=before.wings,outputPerRun=before.outputPerRun==0?(int?)null:before.outputPerRun,owned=before.owned,facility=before.facility,completed=before.completedNames.Select(pair=>new {displayName=pair.Key,count=pair.Value}).ToArray()});
   if(p.ContainsKey("additionalQuantity")){preview["schemaVersion"]=2;preview["gathering"]=Goal(p,before.owned.Value);}if(p.ContainsKey("craftCount")){preview["schemaVersion"]=3;preview["crafting"]=CraftGoal(before);}return preview;
  }
  Dictionary<string,object> CraftGoal(LifePreflight before){return new Dictionary<string,object>{{"craftCount",before.craftCount},{"outputPerCraft",before.outputPerRun},{"expectedOutput",(long)before.craftCount*before.outputPerRun}};}
  Dictionary<string,object> Goal(Dictionary<string,object> intent,long owned){return new Dictionary<string,object>{{"additionalQuantity",DesktopLifePolicy.Integer(intent["additionalQuantity"],1,100)},{"beforeOwned",owned},{"targetOwned",owned+DesktopLifePolicy.Integer(intent["additionalQuantity"],1,100)},{"currentOwned",owned},{"allowAutoStop",intent["allowAutoStop"]},{"stopReason",null},{"stopState","none"}};}
  public async Task<object> PrepareAsync(Dictionary<string,object> value){
   if(!await mutation.WaitAsync(0))DesktopLifePolicy.Fail("life_busy");
   try{if(Busy)DesktopLifePolicy.Fail("life_busy");var intent=Intent(value);long version,document=epoch();lock(stateGate)version=contextVersion;
    var before=await Check(intent,version,document);if(intent.ContainsKey("additionalQuantity"))intent["baselineOwned"]=before.owned.Value;if(intent.ContainsKey("craftCount"))intent["baselineOutput"]=before.outputPerRun;intent["nonce"]=Guid.NewGuid().ToString("D");intent["expiresAt"]=DesktopLifePolicy.Time(clock().AddSeconds(120));intent["document"]=document;intent["contextVersion"]=version;
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
    var goal=intent.ContainsKey("additionalQuantity")?Goal(intent,before.owned.Value):null;
    if(goal!=null)journal.UpdateGathering(nonce,goal);
    if(intent.ContainsKey("craftCount"))journal.UpdateCrafting(nonce,CraftGoal(before));
    lock(stateGate){current=new Dictionary<string,object>{{"id",nonce},{"accountId",intent["accountId"]},{"characterId",intent["characterId"]},{"action",intent["action"]},{"displayName",intent["displayName"]},{"state","running"},{"expectedWings",before.expectedWings},{"beforeWings",before.wings},{"afterWings",null},{"afterOwned",null},{"message",null}};
     gathering=goal;gatherUnsafe=false;sawGathering=false;stopAttempts=0;performInFlight=false;performTask=null;runVersion=version;runDocument=document;if(goal!=null)current["gathering"]=goal;if(intent.ContainsKey("craftCount"))current["crafting"]=CraftGoal(before);
     var ownedLease=lease;lease=null;running=Task.Run(()=>Run(intent,before,version,document,ownedLease));}
    return new {schemaVersion=1,id=nonce,state="running"};
   }finally{if(lease!=null)lease.Dispose();mutation.Release();}
  }
  async Task Run(Dictionary<string,object> intent,LifePreflight before,long version,long document,FileStream lease){
   string outcome="unknown";long? afterWings=null,afterOwned=null;
   try{
    // Consent and the final preflight already committed the action. Window hiding after that
    // must not turn a verifiable result into an unresolved global lock.
    ObservationContext(version,document);Task<string> execution;lock(stateGate){performInFlight=true;try{execution=intent.ContainsKey("craftCount")?craft((string)intent["displayName"],before.craftCount):perform((string)intent["action"],(string)intent["displayName"]);performTask=execution;}catch{performInFlight=false;throw;}}
    var monitor=gathering==null?Task.FromResult(true):WatchGathering(intent,version,document);string raw;
    Exception executionError=null;raw=null;try{raw=await execution;}catch(Exception error){executionError=error;}finally{lock(stateGate)performInFlight=false;}
    await monitor;await control.WaitAsync();control.Release();if(executionError!=null)throw executionError;ObservationContext(version,document);
    var afterWorks=DesktopLifePolicy.Data(await read("works"),"works",clock());ObservationContext(version,document);
    afterWings=DesktopLifePolicy.Wings(await currency(),clock());ObservationContext(version,document);
    string action=(string)intent["action"],name=(string)intent["displayName"];
    if(action=="crafting"||action=="gathering"){var stock=DesktopLifePolicy.Data(await named(name),"materials",clock());afterOwned=action=="crafting"?DesktopLifePolicy.CraftOwned(stock,name):gathering==null?DesktopLifePolicy.Owned(stock,name):DesktopLifePolicy.GatherStock(stock,name);ObservationContext(version,document);}
    outcome=DesktopLifePolicy.Outcome(action,name,raw,afterWorks,before);
    if(before.expectedWings.HasValue){var debit=before.wings-afterWings.Value;if(outcome=="rejected"?debit!=0:debit!=before.expectedWings.Value)outcome="unknown";}
    if(action=="gathering"&&outcome=="completed"&&(!before.owned.HasValue||!afterOwned.HasValue||afterOwned.Value<=before.owned.Value))outcome="unknown";
    if(action=="crafting"&&outcome=="completed"&&before.owned.HasValue&&(!afterOwned.HasValue||afterOwned.Value<=before.owned.Value))outcome="unknown";
    if(gathering!=null){var activity=DesktopLifePolicy.Data(await read("activity"),"activity",clock());ObservationContext(version,document);DesktopLifePolicy.SafeActivity(activity);
     lock(stateGate){if(afterOwned.HasValue)gathering["currentOwned"]=afterOwned.Value;
      if(gatherUnsafe||Equals(gathering["stopState"],"unknown"))outcome="unknown";
      else if(outcome=="stopped"){if(gathering["stopReason"]==null||!Equals(gathering["stopState"],"requested"))outcome="unknown";else if(Equals(gathering["stopReason"],"goal")&&afterOwned>=Convert.ToInt64(gathering["targetOwned"]))outcome="completed";}
      if(outcome=="completed"&&afterOwned<Convert.ToInt64(gathering["targetOwned"]))outcome="unknown";
      journal.UpdateGathering((string)intent["nonce"],gathering);
     }
    }else if(outcome=="stopped")outcome="unknown";
   }catch{outcome="unknown";}
   try{journal.SetOutcome((string)intent["nonce"],outcome);}catch{outcome="unknown";}
   finally{lock(stateGate){current["state"]=outcome;current["afterWings"]=afterWings;current["afterOwned"]=afterOwned;current["message"]=outcome=="unknown"?"life_result_unknown":null;}lease.Dispose();}
  }
  bool Live(string id,long version,long document){lock(stateGate)return performInFlight&&performTask!=null&&!performTask.IsCompleted&&current!=null&&Equals(current["id"],id)&&contextVersion==version&&epoch()==document;}
  void ProtectGathering(string id){lock(stateGate){if(current==null||!Equals(current["id"],id))return;gatherUnsafe=true;if(gathering!=null){gathering["stopState"]="unavailable";current["message"]="life_stop_unavailable";try{journal.UpdateGathering(id,gathering);}catch{}}}}
  async Task<bool> WatchGathering(Dictionary<string,object> intent,long version,long document){string id=(string)intent["nonce"];
   while(Live(id,version,document)){
    await Task.Delay(1000);if(!Live(id,version,document))break;
    try{
     var activity=DesktopLifePolicy.Data(await read("activity"),"activity",clock());if(!Live(id,version,document))break;
     bool canStop=DesktopLifePolicy.GatherActivity(activity);lock(stateGate){if(sawGathering&&!canStop&&Equals(DesktopLifePolicy.Get(activity,"mainButtonState"),"Compass")){ProtectGathering(id);break;}if(canStop)sawGathering=true;}
     long stock=DesktopLifePolicy.GatherStock(DesktopLifePolicy.Data(await named((string)intent["displayName"]),"materials",clock()),(string)intent["displayName"]);if(!Live(id,version,document))break;
     bool needStop;lock(stateGate){if(gatherUnsafe)break;if(stock<Convert.ToInt64(gathering["beforeOwned"]))throw new ArgumentException();if(Convert.ToInt64(gathering["currentOwned"])!=stock){gathering["currentOwned"]=stock;journal.UpdateGathering(id,gathering);}
      if((bool)gathering["allowAutoStop"]&&stock>=Convert.ToInt64(gathering["targetOwned"])&&gathering["stopReason"]==null){gathering["stopReason"]="goal";gathering["stopState"]="waiting";stopDeadline=clock().AddSeconds(10);journal.UpdateGathering(id,gathering);}
      needStop=gathering["stopReason"]!=null&&Equals(gathering["stopState"],"waiting");}
     if(needStop)await TryStop(id,version,document);
    }catch{if(Live(id,version,document))ProtectGathering(id);break;}
   }return true;
  }
  async Task TryStop(string id,long version,long document){if(!await control.WaitAsync(0))return;
   try{if(!Live(id,version,document))return;lock(stateGate){if(gatherUnsafe||!Equals(gathering["stopState"],"waiting"))return;if(clock()>=stopDeadline||stopAttempts>=3){gathering["stopState"]="unavailable";current["message"]="life_stop_unavailable";journal.UpdateGathering(id,gathering);return;}}
    var activity=DesktopLifePolicy.Data(await read("activity"),"activity",clock());if(!Live(id,version,document))return;
    if(!DesktopLifePolicy.GatherActivity(activity))return;
    Task<string> stopping;lock(stateGate){if(!Live(id,version,document)||gatherUnsafe||stop==null||!Equals(gathering["stopState"],"waiting"))return;if(clock()>=stopDeadline){gathering["stopState"]="unavailable";current["message"]="life_stop_unavailable";journal.UpdateGathering(id,gathering);return;}stopAttempts++;gathering["stopState"]="requested";journal.UpdateGathering(id,gathering);if(!Live(id,version,document)){gathering["stopState"]="none";journal.UpdateGathering(id,gathering);return;}stopping=stop();}
    string result=DesktopLifePolicy.StopResult(await stopping);lock(stateGate){if(!Equals(current["id"],id))return;gathering["stopState"]=result=="invalid_state"?"waiting":result;if(result=="unknown")gatherUnsafe=true;journal.UpdateGathering(id,gathering);}
   }catch{ProtectGathering(id);}finally{control.Release();}
  }
  public async Task<object> StopAsync(Dictionary<string,object> value){DesktopLifePolicy.Exact(value,"requestId","accountId","characterId");string id=DesktopLifePolicy.Text(value["requestId"],36);long version,document;
   lock(stateGate){if(current==null||!Equals(current["id"],id)||!Equals(current["accountId"],value["accountId"])||!Equals(current["characterId"],value["characterId"])||context==null||!Equals(context["accountId"],value["accountId"])||!Equals(context["characterId"],value["characterId"]))DesktopLifePolicy.Fail("life_context_changed");
    if(!performInFlight)return State();if(gathering==null||stop==null)DesktopLifePolicy.Fail("life_unsupported");if(gatherUnsafe)DesktopLifePolicy.Fail("life_stop_unavailable");version=runVersion;document=runDocument;Ready(version,document);
    if(gathering["stopReason"]==null){gathering["stopReason"]="manual";gathering["stopState"]="waiting";stopDeadline=clock().AddSeconds(10);journal.UpdateGathering(id,gathering);}}
   await TryStop(id,version,document);return State();
  }
  public object CancelPrepared(Dictionary<string,object> value){
   DesktopLifePolicy.Exact(value,"nonce");var nonce=DesktopLifePolicy.Text(value["nonce"],36);
   lock(stateGate)if(prepared!=null&&Equals(prepared["nonce"],nonce))prepared=null;
   return new {schemaVersion=1};
  }
  public object State(){bool busy=Busy;Dictionary<string,object> job;lock(stateGate){job=current!=null&&context!=null&&Equals(current["accountId"],context["accountId"])?new Dictionary<string,object>(current):null;if(job!=null&&job.ContainsKey("gathering"))job["gathering"]=new Dictionary<string,object>(gathering);}return new {schemaVersion=job!=null&&job.ContainsKey("crafting")?3:job!=null&&job.ContainsKey("gathering")?2:1,busy=busy,blocked=busy||journal.HasUnresolved(),state=job==null?"idle":job["state"],current=job};}
  public object History(Dictionary<string,object> value){DesktopLifePolicy.Exact(value,"accountId");lock(stateGate)if(context==null||!Equals(context["accountId"],value["accountId"]))DesktopLifePolicy.Fail("life_context_changed");var rows=journal.EntriesFor((string)value["accountId"]);return new {schemaVersion=rows.Cast<Dictionary<string,object>>().Any(row=>row.ContainsKey("crafting"))?3:rows.Cast<Dictionary<string,object>>().Any(row=>row.ContainsKey("gathering"))?2:1,blocked=Busy||journal.HasUnresolved(),records=rows};}
 }
}
