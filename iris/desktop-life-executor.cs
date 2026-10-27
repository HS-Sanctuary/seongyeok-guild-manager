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
  readonly long sessionStartedAt;bool coordinating;string pendingCollectionId;DesktopLifeAutomationStore automation;Func<object,bool> authorizeCollection;Func<Task<Dictionary<string,object>>> collectionProbe;
  Func<Task<bool>> collectionReadWait=()=>DesktopCliActivity.WaitForReadsAsync(10000);
  public void BindCollectionReadWait(Func<Task<bool>> wait){if(wait==null)throw new ArgumentException();lock(stateGate){if(Busy)DesktopLifePolicy.Fail("life_busy");collectionReadWait=wait;}}
  readonly Dictionary<string,Dictionary<string,object>> collectionAttempts=new Dictionary<string,Dictionary<string,object>>();
  Func<Dictionary<string,object>,Task<object>> progressConfirm;
  Action<Dictionary<string,object>> progressTerminal;
  Func<Dictionary<string,object>,bool> progressPrepare;
  Func<object,Task<bool>> progressApproval;
  Func<IDisposable> progressCollectionGuard;Action progressCollectionBegin;
  sealed class EmptyProgressGuard:IDisposable{public void Dispose(){}}
  IDisposable CollectionProgressGuard(){return progressCollectionGuard==null?new EmptyProgressGuard():progressCollectionGuard();}
  internal void BindProgressApproval(Func<object,Task<bool>> approve){if(approve==null)throw new ArgumentNullException();lock(stateGate){if(Busy)DesktopLifePolicy.Fail("life_busy");progressApproval=approve;}}
  internal void BindProgress(Func<Dictionary<string,object>,Task<object>> confirmRequest,Action<Dictionary<string,object>> terminal,Func<Dictionary<string,object>,bool> prepare,Func<IDisposable> collectionGuard,Action collectionBegin){if(confirmRequest==null||terminal==null||prepare==null||collectionGuard==null||collectionBegin==null)throw new ArgumentException();lock(stateGate){if(Busy||progressConfirm!=null)DesktopLifePolicy.Fail("life_busy");progressConfirm=confirmRequest;progressTerminal=terminal;progressPrepare=prepare;progressCollectionGuard=collectionGuard;progressCollectionBegin=collectionBegin;}}
  public object CollectionObservation(Dictionary<string,object> value){
   DesktopLifePolicy.Exact(value,"requestId","accountId","characterId");Guid parsed;string id=DesktopLifePolicy.Text(value["requestId"],36);if(!Guid.TryParseExact(id,"D",out parsed)||parsed==Guid.Empty)DesktopLifePolicy.Fail("life_invalid");DesktopLifePolicy.Text(value["accountId"],100);DesktopLifePolicy.Text(value["characterId"],100);
   lock(stateGate){Dictionary<string,object> attempt;collectionAttempts.TryGetValue(id,out attempt);bool known=attempt!=null&&Equals(attempt["accountId"],value["accountId"])&&Equals(attempt["characterId"],value["characterId"]);if(!known&&(context==null||!Equals(context["accountId"],value["accountId"])||!Equals(context["characterId"],value["characterId"])))DesktopLifePolicy.Fail("life_context_changed");
    if(coordinating&&pendingCollectionId==id)return new {schemaVersion=1,id=id,state="checking"};
    if(running!=null&&!running.IsCompleted&&current!=null&&Equals(current["id"],id)&&Equals(current["action"],"collect"))return new {schemaVersion=1,id=id,state="running"};
    var row=journal.EntriesFor((string)value["accountId"]).Cast<Dictionary<string,object>>().SingleOrDefault(r=>Equals(r["requestId"],id)&&Equals(r["characterId"],value["characterId"])&&Equals(r["action"],"collect"));
    if(row!=null)return new {schemaVersion=1,id=id,state=Equals(row["state"],"inflight")?"running":(string)row["state"]};
    // Bridge IDs are monotonic: this later read cannot be followed by acceptance of an earlier unregistered click.
    return new {schemaVersion=1,id=id,state=known?(string)attempt["state"]:"rejected"};
   }
  }
  public void BindCollectionAutomation(DesktopLifeAutomationStore store,Func<object,bool> authorize,Func<Task<Dictionary<string,object>>> probe){if(store==null||authorize==null||probe==null)throw new ArgumentException();lock(stateGate){if(Busy)DesktopLifePolicy.Fail("life_busy");automation=store;authorizeCollection=authorize;collectionProbe=probe;journal.BindSeparation((mode,row)=>new DesktopLifeAutomationStore(journal.RootPath,mode).IsSeparated(mode,row));}}
  Func<Task<string>> stop;readonly SemaphoreSlim control=new SemaphoreSlim(1,1);
  bool performInFlight,gatherUnsafe,sawGathering;int stopAttempts;long runVersion,runDocument;DateTime stopDeadline;Dictionary<string,object> gathering;
  public void BindStop(Func<Task<string>> stop){if(stop==null)throw new ArgumentException();lock(stateGate){if(Busy)DesktopLifePolicy.Fail("life_busy");this.stop=stop;}}
  Func<string,int,Task<string>> craft;
  public void BindCraft(Func<string,int,Task<string>> craft){if(craft==null)throw new ArgumentException();lock(stateGate){if(Busy)DesktopLifePolicy.Fail("life_busy");this.craft=craft;}}
  public bool Busy {get{lock(stateGate)return coordinating||running!=null&&!running.IsCompleted;}}
  public DesktopLifeExecutor(DesktopLifeJournal journal,Func<string,Task<object>> read,Func<Task<object>> currency,Func<string,Task<object>> named,Func<string,string,Task<string>> perform,Func<object,bool> confirm,Func<bool> allowed,Func<long> epoch,Func<DateTime> clock){
   if(journal==null||read==null||currency==null||named==null||perform==null||confirm==null||allowed==null||epoch==null||clock==null)throw new ArgumentException();
   this.journal=journal;this.read=read;this.currency=currency;this.named=named;this.perform=perform;this.confirm=confirm;this.allowed=allowed;this.epoch=epoch;this.clock=clock;
   sessionStartedAt=DesktopLifePolicy.Time(clock());
   try{journal.RecoverInterrupted();}catch(LifeExecutionLeaseBusyException){/* Only a positively identified sibling game lease may defer recovery. Other recovery I/O must remain visible. */}
  }
  public object Capabilities(){if(automation==null)return new {schemaVersion=3,actions=new[]{"gathering","altering","crafting","collect"},gatheringNames=new[]{"\uD1B5\uB098\uBB34"},queue=false,collectCostKnown=false,quantityGathering=stop!=null,currentStop=stop!=null,quantityCrafting=craft!=null,maxCraftCount=5};return new {schemaVersion=4,actions=new[]{"gathering","altering","crafting","collect"},gatheringNames=new[]{"\uD1B5\uB098\uBB34"},queue=false,collectCostKnown=false,quantityGathering=stop!=null,currentStop=stop!=null,quantityCrafting=craft!=null,maxCraftCount=5,oneClickCollection=true,automaticReconciliation=true,collectionPolicyVersion=1};}
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
   if(action=="collect"&&intent.ContainsKey("collectionFacility")&&!Equals(intent["collectionFacility"],before.facility))DesktopLifePolicy.Fail("life_context_changed");
   if(intent.ContainsKey("craftCount"))before.craftCount=(int)DesktopLifePolicy.Integer(intent["craftCount"],1,5);
   if(intent.ContainsKey("baselineOutput")&&!Equals(intent["baselineOutput"],before.outputPerRun))DesktopLifePolicy.Fail("life_recipe_changed");
   var namedValue=await named(name);var stock=DesktopLifePolicy.Data(namedValue,"materials",clock());Ready(version,document);before.owned=intent.ContainsKey("additionalQuantity")?DesktopLifePolicy.GatherStock(stock,name):action=="crafting"?DesktopLifePolicy.CraftOwned(stock,name):DesktopLifePolicy.Owned(stock,name);
   if(intent.ContainsKey("additionalQuantity")){long quantity=DesktopLifePolicy.Integer(intent["additionalQuantity"],1,100);if(before.owned.Value>9007199254740991L-quantity)DesktopLifePolicy.Fail("life_invalid");if(intent.ContainsKey("baselineOwned")&&!Equals(intent["baselineOwned"],before.owned.Value))DesktopLifePolicy.Fail("life_stock_changed");}
   // The first snapshot may have aged while later fixed reads completed. Validate the whole set at the end.
   DesktopLifePolicy.SafeActivity(DesktopLifePolicy.Data(activity,"activity",clock()));DesktopLifePolicy.InventoryRoom(DesktopLifePolicy.Data(inventory,"inventory",clock()));DesktopLifePolicy.Wings(currencyValue,clock());DesktopLifePolicy.Data(worksValue,"works",clock());DesktopLifePolicy.Data(namedValue,"materials",clock());if(catalogValue!=null)DesktopLifePolicy.Data(catalogValue,action,clock());
   before.validUntil=new[]{activity,inventory,worksValue,namedValue}.Select(frame=>DesktopLifePolicy.Integer(DesktopLifePolicy.Plain(frame)["observedAt"],1)+15000).Min();before.validUntil=Math.Min(before.validUntil,DesktopLifePolicy.Time(DateTimeOffset.Parse((string)DesktopLifePolicy.Plain(currencyValue)["observedAt"],System.Globalization.CultureInfo.InvariantCulture).UtcDateTime)+15000);if(catalogValue!=null)before.validUntil=Math.Min(before.validUntil,DesktopLifePolicy.Integer(DesktopLifePolicy.Plain(catalogValue)["observedAt"],1)+15000);
   return before;
  }
  object Preview(Dictionary<string,object> p,LifePreflight before){
   Dictionary<string,object> labels;lock(stateGate)labels=new Dictionary<string,object>(context);
   var preview=DesktopLifePolicy.Plain(new {schemaVersion=1,nonce=p["nonce"],expiresAt=p["expiresAt"],accountId=p["accountId"],characterId=p["characterId"],accountLabel=labels["accountLabel"],characterLabel=labels["characterLabel"],action=p["action"],displayName=p["displayName"],expectedWings=before.expectedWings,wings=before.wings,outputPerRun=before.outputPerRun==0?(int?)null:before.outputPerRun,owned=before.owned,facility=before.facility,completed=before.completedNames.Select(pair=>new {displayName=pair.Key,count=pair.Value}).ToArray()});
   if(p.ContainsKey("additionalQuantity")){preview["schemaVersion"]=2;preview["gathering"]=Goal(p,before.owned.Value);}if(p.ContainsKey("craftCount")){preview["schemaVersion"]=3;preview["crafting"]=CraftGoal(before);}return preview;
  }
  Dictionary<string,object> CraftGoal(LifePreflight before){return new Dictionary<string,object>{{"craftCount",before.craftCount},{"outputPerCraft",before.outputPerRun},{"expectedOutput",(long)before.craftCount*before.outputPerRun}};}
  Dictionary<string,object> Goal(Dictionary<string,object> intent,long owned){return new Dictionary<string,object>{{"additionalQuantity",DesktopLifePolicy.Integer(intent["additionalQuantity"],1,100)},{"beforeOwned",owned},{"targetOwned",owned+DesktopLifePolicy.Integer(intent["additionalQuantity"],1,100)},{"currentOwned",owned},{"allowAutoStop",intent["allowAutoStop"]},{"stopReason",null},{"stopState","none"}};}
  void PolicyAccount(Dictionary<string,object> value){DesktopLifePolicy.Exact(value,"accountId");DesktopLifePolicy.Text(value["accountId"],100);lock(stateGate)if(automation==null||context==null||!Equals(context["accountId"],value["accountId"]))DesktopLifePolicy.Fail("life_context_changed");}
  public object CollectionPolicy(Dictionary<string,object> value){PolicyAccount(value);try{return new {schemaVersion=1,policyVersion=1,granted=automation.CollectionAllowed((string)value["accountId"],1),separatedRequestIds=automation.SeparatedRequestIds((string)value["accountId"])};}catch{DesktopLifePolicy.Fail("life_permission_corrupt");return null;}}
  public object RevokeCollection(Dictionary<string,object> value){PolicyAccount(value);lock(stateGate){if(Busy)DesktopLifePolicy.Fail("life_busy");try{automation.RevokeCollection((string)value["accountId"]);}catch{DesktopLifePolicy.Fail("life_permission_corrupt");}}return CollectionPolicy(value);}
  void ClickReady(long version,long document,long deadline){Ready(version,document);if(DesktopLifePolicy.Time(clock())>=deadline)DesktopLifePolicy.Fail("life_nonce_expired");}
  async Task<Dictionary<string,object>> ProbeCollection(long version,long document,long deadline){ClickReady(version,document,deadline);Dictionary<string,object> result;try{result=await collectionProbe();DesktopLifePolicy.SafeActivity(DesktopLifePolicy.Data(result["activity"],"activity",clock()));if(!Equals(result["cliAbsent"],true)||DesktopLifePolicy.Integer(result["gameProcessId"],1)<1||DesktopLifePolicy.Integer(result["gameStartedAt"],1,Int64.MaxValue)<1||DesktopCliActivity.HasUnclassifiedOrActionCli())DesktopLifePolicy.Fail("life_reconcile_unavailable");}catch(LifeActionException error){if(error.Code=="life_game_blocked")throw;DesktopLifePolicy.Fail("life_reconcile_unavailable");return null;}catch{DesktopLifePolicy.Fail("life_reconcile_unavailable");return null;}ClickReady(version,document,deadline);result["contextVersion"]=version;result["document"]=document;return result;}
  public async Task<object> CollectOneClickAsync(Dictionary<string,object> value){
   DesktopLifePolicy.Exact(value,"requestId","requestedAt","accountId","characterId","facility","displayName");Guid parsed;string id=DesktopLifePolicy.Text(value["requestId"],36);if(!Guid.TryParseExact(id,"D",out parsed)||parsed==Guid.Empty)DesktopLifePolicy.Fail("life_invalid");
   long requested=DesktopLifePolicy.Integer(value["requestedAt"],1,8640000000000000L),now=DesktopLifePolicy.Time(clock());if(requested>now||now-requested>=120000)DesktopLifePolicy.Fail("life_nonce_expired");long deadline=requested+120000;
   DesktopLifePolicy.Text(value["facility"],160);if(automation==null)DesktopLifePolicy.Fail("life_unsupported");
   if(!await mutation.WaitAsync(0))DesktopLifePolicy.Fail("life_busy");FileStream lease=null;bool collectionCommitted=false,collectionCancelled=false;string attemptId=null;
   try{
    if(Busy)DesktopLifePolicy.Fail("life_busy");var intent=Intent(new Dictionary<string,object>{{"accountId",value["accountId"]},{"characterId",value["characterId"]},{"action","collect"},{"displayName",value["displayName"]}});long version,document=epoch();lock(stateGate){version=contextVersion;coordinating=true;pendingCollectionId=id;prepared=null;while(collectionAttempts.Count>=40)collectionAttempts.Remove(collectionAttempts.Keys.First());collectionAttempts[id]=new Dictionary<string,object>{{"accountId",value["accountId"]},{"characterId",value["characterId"]},{"state","checking"}};attemptId=id;}
    ClickReady(version,document,deadline);if(journal.EntriesFor((string)value["accountId"]).Cast<Dictionary<string,object>>().Any(r=>Equals(r["requestId"],id)))DesktopLifePolicy.Fail("life_request_replayed");
    bool granted;try{granted=automation.CollectionAllowed((string)value["accountId"],1);}catch{DesktopLifePolicy.Fail("life_permission_corrupt");return null;}
    if(!granted){Dictionary<string,object> labels;lock(stateGate)labels=new Dictionary<string,object>(context);if(!authorizeCollection(labels)){collectionCancelled=true;return new {schemaVersion=1,id=id,state="cancelled"};}ClickReady(version,document,deadline);try{automation.GrantCollection((string)value["accountId"],1);}catch{DesktopLifePolicy.Fail("life_permission_corrupt");}}
    if(!await collectionReadWait())DesktopLifePolicy.Fail("life_busy");ClickReady(version,document,deadline);lease=journal.AcquireExecutionLease();
    using(CollectionProgressGuard()){} // Never separate an unresolved row referenced by progress.
    var originals=new Dictionary<string,Dictionary<string,object>[]>();foreach(var mode in new[]{"development","production"})originals[mode]=new DesktopLifeJournal(journal.RootPath,mode,false).UnresolvedEntries();
    var first=await ProbeCollection(version,document,deadline);await Task.Delay(1000);var second=await ProbeCollection(version,document,deadline);
    if(!Equals(first["gameProcessId"],second["gameProcessId"])||!Equals(first["gameStartedAt"],second["gameStartedAt"]))DesktopLifePolicy.Fail("life_reconcile_unavailable");
    foreach(var mode in new[]{"development","production"}){
     var source=new DesktopLifeJournal(journal.RootPath,mode,false);var store=new DesktopLifeAutomationStore(journal.RootPath,mode);
     var latest=source.UnresolvedEntries();if(latest.Length!=originals[mode].Length||latest.Any(r=>!originals[mode].Any(o=>store.RecordHash(o)==store.RecordHash(r))))DesktopLifePolicy.Fail("life_reconcile_unavailable");
     foreach(var row in originals[mode]){
      if(store.IsSeparated(mode,row))continue;string hash=store.RecordHash(row);first["recordHash"]=hash;second["recordHash"]=hash;
      var evidence=new Dictionary<string,object>{{"sessionStartedAt",sessionStartedAt},{"checkedAt",DesktopLifePolicy.Time(clock())},{"leaseHeld",true},{"noExecution",running==null||running.IsCompleted},{"cliAbsent",!DesktopCliActivity.HasUnclassifiedOrActionCli()},{"gameProcessId",second["gameProcessId"]},{"gameStartedAt",second["gameStartedAt"]},{"contextVersion",version},{"document",document},{"recordHash",hash},{"first",first},{"second",second}};
      if(!DesktopLifeReconciliation.Evaluate(row,evidence))DesktopLifePolicy.Fail("life_reconcile_unavailable");ClickReady(version,document,deadline);
      store.RecordSeparation(mode,row,new Dictionary<string,object>{{"sessionStartedAt",sessionStartedAt},{"checkedAt",evidence["checkedAt"]},{"firstObservedAt",DesktopLifePolicy.Plain(first["activity"])["observedAt"]},{"secondObservedAt",DesktopLifePolicy.Plain(second["activity"])["observedAt"]},{"gameProcessId",second["gameProcessId"]},{"contextVersion",version},{"policyVersion",1},{"cliAbsent",true}});
     }
    }
    intent["collectionFacility"]=value["facility"];intent["nonce"]=id;var before=await Check(intent,version,document);var final=await ProbeCollection(version,document,deadline);if(!Equals(final["gameProcessId"],first["gameProcessId"])||!Equals(final["gameStartedAt"],first["gameStartedAt"]))DesktopLifePolicy.Fail("life_game_changed");ClickReady(version,document,deadline);
    if(DesktopLifePolicy.Time(clock())>=before.validUntil)DesktopLifePolicy.Fail("life_stale");
    using(CollectionProgressGuard()){
    journal.Begin(id,(string)value["accountId"],(string)value["characterId"],"collect",(string)value["displayName"],null);
    if(progressCollectionBegin!=null)progressCollectionBegin();
    collectionCommitted=true;
    lock(stateGate){current=new Dictionary<string,object>{{"id",id},{"accountId",value["accountId"]},{"characterId",value["characterId"]},{"action","collect"},{"displayName",value["displayName"]},{"state","running"},{"expectedWings",null},{"beforeWings",before.wings},{"afterWings",null},{"afterOwned",null},{"message",null}};gathering=null;gatherUnsafe=false;performInFlight=false;performTask=null;runVersion=version;runDocument=document;var ownedLease=lease;lease=null;running=Task.Run(()=>Run(intent,before,version,document,ownedLease));}
    return new {schemaVersion=1,id=id,state="running"};}
   }finally{if(lease!=null)lease.Dispose();lock(stateGate){if(attemptId!=null)collectionAttempts[attemptId]["state"]=collectionCommitted?"running":collectionCancelled?"cancelled":"rejected";coordinating=false;pendingCollectionId=null;}mutation.Release();}
  }
  public async Task<object> PrepareAsync(Dictionary<string,object> value){
   if(!await mutation.WaitAsync(0))DesktopLifePolicy.Fail("life_busy");
   try{if(Busy)DesktopLifePolicy.Fail("life_busy");var intent=Intent(value);if(!Equals(intent["action"],"collect")&&(progressPrepare==null||!progressPrepare(intent)))DesktopLifePolicy.Fail("life_progress_required");long version,document=epoch();lock(stateGate)version=contextVersion;
    var before=await Check(intent,version,document);if(Equals(intent["action"],"collect"))intent["collectionFacility"]=before.facility;if(intent.ContainsKey("additionalQuantity"))intent["baselineOwned"]=before.owned.Value;if(Equals(intent["action"],"crafting"))intent["baselineOutput"]=before.outputPerRun;intent["nonce"]=Guid.NewGuid().ToString("D");intent["preparedAt"]=DesktopLifePolicy.Time(clock());intent["expiresAt"]=DesktopLifePolicy.Time(clock().AddSeconds(120));intent["document"]=document;intent["contextVersion"]=version;
    lock(stateGate)prepared=intent;return Preview(intent,before);
   }finally{mutation.Release();}
  }
  public async Task<object> ConfirmAsync(Dictionary<string,object> value){
   DesktopLifePolicy.Exact(value,"nonce");var nonce=DesktopLifePolicy.Text(value["nonce"],36);
   bool consuming;lock(stateGate)consuming=prepared==null||!Equals(prepared["action"],"collect");
   if(consuming){if(progressConfirm==null)DesktopLifePolicy.Fail("life_progress_required");return await progressConfirm(value);}
   if(!await mutation.WaitAsync(0))DesktopLifePolicy.Fail("life_busy");FileStream lease=null;
   try{
    if(Busy)DesktopLifePolicy.Fail("life_busy");lock(stateGate)coordinating=true;Dictionary<string,object> intent;
    lock(stateGate){if(prepared==null||!Equals(prepared["nonce"],nonce))DesktopLifePolicy.Fail("life_nonce_invalid");intent=prepared;prepared=null;}
    long version=(long)intent["contextVersion"],document=(long)intent["document"];Ready(version,document);
    if(DesktopLifePolicy.Time(clock())>=(long)intent["expiresAt"])DesktopLifePolicy.Fail("life_nonce_expired");
    lease=journal.AcquireExecutionLease();var before=await Check(intent,version,document);
    if(!confirm(Preview(intent,before)))return new {schemaVersion=1,id=nonce,state="cancelled"};
    Ready(version,document);if(DesktopLifePolicy.Time(clock())>=(long)intent["expiresAt"])DesktopLifePolicy.Fail("life_nonce_expired");
    // A human can take time in the trusted native prompt. Re-read safety and cost after it.
    before=await Check(intent,version,document);Ready(version,document);if(DesktopLifePolicy.Time(clock())>=(long)intent["expiresAt"])DesktopLifePolicy.Fail("life_nonce_expired");
    using(CollectionProgressGuard()){
    journal.Begin(nonce,(string)intent["accountId"],(string)intent["characterId"],(string)intent["action"],(string)intent["displayName"],before.expectedWings);
    if(progressCollectionBegin!=null)progressCollectionBegin();
    var goal=intent.ContainsKey("additionalQuantity")?Goal(intent,before.owned.Value):null;
    if(goal!=null)journal.UpdateGathering(nonce,goal);
    if(intent.ContainsKey("craftCount"))journal.UpdateCrafting(nonce,CraftGoal(before));
    lock(stateGate){current=new Dictionary<string,object>{{"id",nonce},{"accountId",intent["accountId"]},{"characterId",intent["characterId"]},{"action",intent["action"]},{"displayName",intent["displayName"]},{"state","running"},{"expectedWings",before.expectedWings},{"beforeWings",before.wings},{"afterWings",null},{"afterOwned",null},{"message",null}};
     gathering=goal;gatherUnsafe=false;sawGathering=false;stopAttempts=0;performInFlight=false;performTask=null;runVersion=version;runDocument=document;if(goal!=null)current["gathering"]=goal;if(intent.ContainsKey("craftCount"))current["crafting"]=CraftGoal(before);
     var ownedLease=lease;lease=null;running=Task.Run(()=>Run(intent,before,version,document,ownedLease));}
    return new {schemaVersion=1,id=nonce,state="running"};}
   }finally{if(lease!=null)lease.Dispose();lock(stateGate)coordinating=false;mutation.Release();}
  }
  async Task Run(Dictionary<string,object> intent,LifePreflight before,long version,long document,IDisposable lease){
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
   finally{try{if(!Equals(intent["action"],"collect")&&progressTerminal!=null)progressTerminal(new Dictionary<string,object>(intent));}catch{lock(stateGate)current["message"]="life_progress_review";}finally{lock(stateGate){current["state"]=outcome;current["afterWings"]=afterWings;current["afterOwned"]=afterOwned;if(outcome=="unknown")current["message"]="life_result_unknown";}lease.Dispose();}}
  }
  sealed class ProgressMutationRelease:IDisposable {readonly DesktopLifeExecutor actor;bool disposed;internal ProgressMutationRelease(DesktopLifeExecutor a){actor=a;}public void Dispose(){if(disposed)return;disposed=true;lock(actor.stateGate)actor.coordinating=false;actor.mutation.Release();}}
  internal async Task<IDisposable> ProgressMutationAsync(){if(!await mutation.WaitAsync(0))DesktopLifePolicy.Fail("life_busy");if(Busy){mutation.Release();DesktopLifePolicy.Fail("life_busy");}lock(stateGate)coordinating=true;return new ProgressMutationRelease(this);}
  internal Dictionary<string,object> ProgressContext(){lock(stateGate){if(context==null||context["characterId"]==null)DesktopLifePolicy.Fail("life_context_changed");var result=new Dictionary<string,object>(context);result["document"]=epoch();result["contextVersion"]=contextVersion;return result;}}
  internal Dictionary<string,object> ProgressPrepared(string nonce){lock(stateGate)return prepared!=null&&Equals(prepared["nonce"],nonce)?new Dictionary<string,object>(prepared):null;}
  internal void ProgressConsume(Dictionary<string,object> intent){lock(stateGate){if(prepared==null||!Equals(prepared["nonce"],intent["nonce"]))DesktopLifePolicy.Fail("life_nonce_invalid");prepared=null;}}
  internal async Task<LifePreflight> ProgressCheck(Dictionary<string,object> intent){var result=await Check(intent,Convert.ToInt64(intent["contextVersion"]),Convert.ToInt64(intent["document"]));if(DesktopLifePolicy.Time(clock())>=Convert.ToInt64(intent["expiresAt"]))DesktopLifePolicy.Fail("life_nonce_expired");return result;}
  internal Task<bool> ProgressApproveAsync(Dictionary<string,object> intent,LifePreflight before){var preview=Preview(intent,before);return progressApproval==null?Task.FromResult(confirm(preview)):progressApproval(preview);}
  internal void ProgressBegin(Dictionary<string,object> intent,LifePreflight before){Ready(Convert.ToInt64(intent["contextVersion"]),Convert.ToInt64(intent["document"]));if(DesktopLifePolicy.Time(clock())>=before.validUntil)DesktopLifePolicy.Fail("life_stale");journal.Begin((string)intent["nonce"],(string)intent["accountId"],(string)intent["characterId"],(string)intent["action"],(string)intent["displayName"],before.expectedWings);if(Equals(intent["action"],"crafting"))journal.UpdateCrafting((string)intent["nonce"],CraftGoal(before));}
  internal void ProgressDispatch(Dictionary<string,object> intent,LifePreflight before,IDisposable lease,Task admissionReleased){lock(stateGate){var goal=intent.ContainsKey("additionalQuantity")?Goal(intent,before.owned.Value):null;if(goal!=null)journal.UpdateGathering((string)intent["nonce"],goal);current=new Dictionary<string,object>{{"id",intent["nonce"]},{"accountId",intent["accountId"]},{"characterId",intent["characterId"]},{"action",intent["action"]},{"displayName",intent["displayName"]},{"state","running"},{"expectedWings",before.expectedWings},{"beforeWings",before.wings},{"afterWings",null},{"afterOwned",null},{"message",null}};gathering=goal;gatherUnsafe=false;sawGathering=false;stopAttempts=0;performInFlight=false;performTask=null;runVersion=Convert.ToInt64(intent["contextVersion"]);runDocument=Convert.ToInt64(intent["document"]);if(goal!=null)current["gathering"]=goal;if(Equals(intent["action"],"crafting"))current["crafting"]=CraftGoal(before);running=Task.Run(async()=>{await admissionReleased.ConfigureAwait(false);await Run(intent,before,runVersion,runDocument,lease).ConfigureAwait(false);});}}
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
   lock(stateGate){if(prepared!=null&&Equals(prepared["nonce"],nonce))prepared=null;if(coordinating&&pendingCollectionId==nonce&&(running==null||running.IsCompleted))contextVersion++;}
   return new {schemaVersion=1};
  }
  public object State(){bool busy;lock(stateGate)busy=running!=null&&!running.IsCompleted;Dictionary<string,object> job;lock(stateGate){job=current!=null&&context!=null&&Equals(current["accountId"],context["accountId"])?new Dictionary<string,object>(current):null;if(job!=null&&job.ContainsKey("gathering"))job["gathering"]=new Dictionary<string,object>(gathering);}return new {schemaVersion=job!=null&&job.ContainsKey("crafting")?3:job!=null&&job.ContainsKey("gathering")?2:1,busy=busy,blocked=Busy||journal.HasUnresolved(),state=job==null?"idle":job["state"],current=job};}
  public object History(Dictionary<string,object> value){DesktopLifePolicy.Exact(value,"accountId");lock(stateGate)if(context==null||!Equals(context["accountId"],value["accountId"]))DesktopLifePolicy.Fail("life_context_changed");var rows=journal.EntriesFor((string)value["accountId"]);return new {schemaVersion=rows.Cast<Dictionary<string,object>>().Any(row=>row.ContainsKey("crafting"))?3:rows.Cast<Dictionary<string,object>>().Any(row=>row.ContainsKey("gathering"))?2:1,blocked=Busy||journal.HasUnresolved(),records=rows};}
 }
}
