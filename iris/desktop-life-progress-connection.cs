using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace IrisDesktop {
 // Native-only adapter. The bridge supplies identities and commands, never evidence or paths.
 internal sealed class DesktopLifeProgressConnection:IProgressExecutionActor {
  readonly DesktopLifeExecutor actor;readonly DesktopLifeJournal journal;readonly DesktopErgonProgressStore store;readonly Func<long> clock;readonly ProgressCoordinator coordinator;
  readonly string session=Guid.NewGuid().ToString("D");ProgressGoalView selected;Dictionary<string,object> frozen;LifePreflight before;bool consumed,declined;
  readonly Dictionary<string,string> goals=new Dictionary<string,string>(StringComparer.Ordinal);
  ProgressDocument validated,collectionDocument;
  internal DesktopLifeProgressConnection(DesktopLifeExecutor actor,DesktopLifeJournal journal,DesktopErgonProgressStore store,Func<long> clock){if(actor==null||journal==null||store==null||clock==null)throw new ArgumentNullException();this.actor=actor;this.journal=journal;this.store=store;this.clock=clock;coordinator=new ProgressCoordinator(store,this,clock);actor.BindProgress(ConfirmAsync,ObserveTerminal,CanPrepare,CollectionGuard,CollectionBegin);}
  bool CanPrepare(Dictionary<string,object> intent){if(selected==null)return false;var snapshot=store.Load(Scope());return snapshot.health=="ok"&&snapshot.view.goals.Any(g=>g.goalId==selected.goalId&&g.lifecycle=="active"&&!g.detached&&!g.quantitySatisfied&&!g.quantityUnconfirmed&&g.action==(string)intent["action"]&&g.displayName==(string)intent["displayName"]);}
  static void Need(bool ok,string why){if(!ok)throw new InvalidOperationException(why);}
  ProgressScope Scope(Dictionary<string,object> context){return new ProgressScope{environment=journal.EnvironmentName,accountId=(string)context["accountId"],characterId=(string)context["characterId"]};}
  ProgressScope Scope(){return Scope(actor.ProgressContext());}
  static Guid Operation(Dictionary<string,object> p){Guid id;Need(p["operationId"] is string&&Guid.TryParseExact((string)p["operationId"],"D",out id)&&id!=Guid.Empty,"operation-required");return Guid.Parse((string)p["operationId"]);}
  static long Revision(Dictionary<string,object> p){return ProgressDomain.Number(p["revision"],0,ProgressDomain.SafeInteger-1);}
  void Owner(Dictionary<string,object> p){var scope=Scope();Need(Equals(p["accountId"],scope.accountId)&&Equals(p["characterId"],scope.characterId),"foreign-context");}
  public ProgressExecutionContext CaptureContext(){var native=actor.ProgressContext();Need(selected!=null,"goal-required");return new ProgressExecutionContext{scope=Scope(native),goalId=selected.goalId,sourcePlanId=selected.sourcePlanId,parentGoalId=selected.parentGoalId,action=selected.action,displayName=selected.displayName,targetQuantity=selected.targetQuantity,sessionId=session,documentEpoch=Convert.ToInt64(native["document"]),contextVersion=Convert.ToInt64(native["contextVersion"])};}
  public Task<IDisposable> AcquireMutationAsync(){return actor.ProgressMutationAsync();}
  public ProgressPreparedRequest CapturePrepared(string id){var intent=consumed?frozen:actor.ProgressPrepared(id);if(intent==null||!Equals(intent["nonce"],id))return null;var c=CaptureContext();Need(Equals(intent["accountId"],c.scope.accountId)&&Equals(intent["characterId"],c.scope.characterId)&&Equals(intent["action"],c.action)&&Equals(intent["displayName"],c.displayName)&&Convert.ToInt64(intent["document"])==c.documentEpoch&&Convert.ToInt64(intent["contextVersion"])==c.contextVersion,"prepared-context-changed");object count=null,output=null,expected=null;if(c.action=="crafting"){count=intent.ContainsKey("craftCount")?intent["craftCount"]:1;output=intent["baselineOutput"];expected=ProgressDomain.Number(count,1,5)*ProgressDomain.Number(output,1,1000000);}return new ProgressPreparedRequest{context=c,requestId=id,commandDigest=ProgressDomain.Hash(ProgressDomain.Canonical(intent)),preparedAt=Convert.ToInt64(intent["preparedAt"]),expiresAt=Convert.ToInt64(intent["expiresAt"]),craftCount=count,outputPerCraft=output,expectedOutput=expected};}
  public void ConsumeNonce(ProgressPreparedRequest request){Need(!consumed,"nonce-consumed");frozen=actor.ProgressPrepared(request.requestId);Need(frozen!=null&&ProgressDomain.Hash(ProgressDomain.Canonical(frozen))==request.commandDigest,"prepared-changed");actor.ProgressConsume(frozen);consumed=true;}
  public async Task<IDisposable> AcquireExecutionLeaseAsync(ProgressPreparedRequest request){var lease=journal.AcquireExecutionLease();try{before=await Task.Run(()=>actor.ProgressCheck(frozen)).ConfigureAwait(false);using(var writer=store.AcquireWriter(new ProgressLockOwner())){validated=store.Inspect(writer);Audit(validated,request.requestId);}return lease;}catch{lease.Dispose();throw;}}
  public async Task<bool> ApproveAsync(ProgressPreparedRequest request){declined=!await actor.ProgressApproveAsync(frozen,before).ConfigureAwait(false);return !declined;}
  public async Task RevalidateAsync(ProgressPreparedRequest request){before=await Task.Run(()=>actor.ProgressCheck(frozen)).ConfigureAwait(false);using(var writer=store.AcquireWriter(new ProgressLockOwner())){validated=store.Inspect(writer);Audit(validated,request.requestId);}}
  public void RecordBegin(ProgressPreparedRequest request){actor.ProgressBegin(frozen,before);AuditRows(validated,request.requestId,true);}
  public void Dispatch(ProgressPreparedRequest request,ProgressRunLease offer){var owned=offer.Claim();try{actor.ProgressDispatch(new Dictionary<string,object>(frozen),before,owned,owned.AdmissionReleased);}catch{owned.Dispose();throw;}}
  async Task<object> ConfirmAsync(Dictionary<string,object> p){DesktopLifePolicy.Exact(p,"nonce");string id=DesktopLifePolicy.Text(p["nonce"],36);Need(frozen!=null&&Equals(frozen["nonce"],id),"binding-required");declined=false;var result=await coordinator.ConfirmAsync(id).ConfigureAwait(false);if(result.status!="dispatched"){if(declined)return new {schemaVersion=1,id=id,state="cancelled"};throw new InvalidOperationException(result.error);}return new {schemaVersion=1,id=id,state="running"};}
  Dictionary<string,object> Row(ProgressAttemptRecord a){return journal.EntriesFor(a.scope.accountId).Cast<Dictionary<string,object>>().SingleOrDefault(x=>Equals(x["requestId"],a.requestId));}
static void Match(ProgressAttemptRecord a,Dictionary<string,object> row,bool allowInflight=false){Need(row!=null&&Equals(row["accountId"],a.scope.accountId)&&Equals(row["characterId"],a.scope.characterId)&&Equals(row["action"],a.action)&&Equals(row["displayName"],a.displayName),"journal-ownership-mismatch");Need(!Equals(row["state"],"unknown")&&(allowInflight||!Equals(row["state"],"inflight")),"journal-unresolved");if(a.action=="crafting"){var craft=DesktopLifePolicy.Plain(row["crafting"]);Need(Convert.ToInt64(craft["craftCount"])==a.craftCount&&Convert.ToInt64(craft["outputPerCraft"])==a.outputPerCraft&&Convert.ToInt64(craft["expectedOutput"])==a.expectedOutput,"journal-crafting-mismatch");}}
  void Audit(ProgressDocument document,string pending){Need(!journal.HasUnresolved(),"native-unresolved");AuditRows(document,pending,false);}
  void AuditRows(ProgressDocument document,string pending,bool begun){Need(document!=null,"audit-required");foreach(var a in document.attempts){Need(a.scope.environment==journal.EnvironmentName,"foreign-environment");var row=Row(a);if(a.requestId==pending){Need(a.evidence==null&&a.confirmations.Count==0,"pending-request-reused");if(!begun)Need(row==null,"pending-request-reused");else{Need(row!=null&&Equals(row["state"],"inflight"),"begin-evidence-missing");Match(a,row,true);}continue;}Match(a,row);Need(a.evidence!=null&&a.evidence.outcome==(string)row["state"]&&a.evidence.rowDigest==ProgressDomain.Hash(ProgressDomain.Canonical(row)),"progress-terminal-mismatch");}}
  IDisposable CollectionGuard(){var writer=store.AcquireWriter(new ProgressLockOwner());try{collectionDocument=store.Inspect(writer);AuditRows(collectionDocument,null,false);return writer;}catch{writer.Dispose();throw;}}
  void CollectionBegin(){AuditRows(collectionDocument,null,false);}
  void ObserveTerminal(Dictionary<string,object> intent){string id=(string)intent["nonce"],goal;Need(goals.TryGetValue(id,out goal),"terminal-binding-missing");using(var writer=store.AcquireWriter(new ProgressLockOwner())){var d=store.Inspect(writer);var a=d.attempts.SingleOrDefault(x=>x.requestId==id&&x.goalId==goal);Need(a!=null,"terminal-request-missing");var row=Row(a);Match(a,row);string digest=ProgressDomain.Hash(ProgressDomain.Canonical(row));if(a.evidence!=null){Need(a.evidence.rowDigest==digest,"terminal-evidence-conflict");return;}var v=new NativeTerminalEvidence{scope=ProgressDomain.Clone(a.scope),goalId=goal,requestId=id,action=a.action,displayName=a.displayName,craftCount=a.craftCount,outputPerCraft=a.outputPerCraft,expectedOutput=a.expectedOutput,outcome=(string)row["state"],startedAt=Convert.ToInt64(row["startedAt"]),observedAt=clock(),verifierVersion=1,rowDigest=digest};var ack=store.Commit(new ProgressMutation{kind="ObserveNativeTerminal",scope=a.scope,goalId=goal,requestId=id,evidence=v},d.revision,Guid.NewGuid(),writer);Need(ack.status=="committed","terminal-save-failed");}}
  internal async Task<object> RequestAsync(string method,Dictionary<string,object> p){
   Need(p!=null,"payload-required");
   if(method=="createGoal"){
    DesktopLifePolicy.Exact(p,"accountId","characterId","revision","operationId","goalId","sourcePlanId","parentGoalId","action","displayName","targetQuantity");Owner(p);
    selected=new ProgressGoalView{goalId=(string)p["goalId"],sourcePlanId=(string)p["sourcePlanId"],parentGoalId=(string)p["parentGoalId"],action=(string)p["action"],displayName=(string)p["displayName"],targetQuantity=ProgressDomain.Number(p["targetQuantity"],1,1000000)};
    return await coordinator.CreateGoalAsync(Revision(p),Operation(p));
   }
   if(method=="bindPrepared"){
    DesktopLifePolicy.Exact(p,"accountId","characterId","revision","operationId","goalId","nonce");Owner(p);Need(!actor.Busy,"actor-busy");var view=store.Load(Scope());Need(view.health=="ok","store-unavailable");selected=view.view.goals.SingleOrDefault(x=>x.goalId==(string)p["goalId"]);Need(selected!=null,"goal-missing");string id=(string)p["nonce"];Need(!goals.ContainsKey(id),"duplicate-binding");consumed=false;frozen=actor.ProgressPrepared(id);Need(frozen!=null,"prepared-missing");var ack=await coordinator.BindPreparedAsync(id,Revision(p),Operation(p));if(ack.status=="bound")goals.Add(id,selected.goalId);return ack;
   }
   if(method=="confirmQuantity"||method=="correctQuantity"||method=="setLifecycle"||method=="detachPlan"){
    var common=new[]{"accountId","characterId","revision","operationId","goalId"};
    var specific=method=="confirmQuantity"?new[]{"requestId","quantity"}:method=="correctQuantity"?new[]{"requestId","quantity","supersedesEventId","reason"}:method=="setLifecycle"?new[]{"lifecycle"}:new[]{"sourcePlanId"};DesktopLifePolicy.Exact(p,common.Concat(specific).ToArray());Owner(p);var initial=actor.ProgressContext();
    using(await actor.ProgressMutationAsync())using(journal.AcquireExecutionLease()){
     Need(ProgressDomain.Canonical(initial)==ProgressDomain.Canonical(actor.ProgressContext()),"context-changed");
     using(var writer=store.AcquireWriter(new ProgressLockOwner())){var d=store.Inspect(writer);Audit(d,null);Owner(p);var m=new ProgressMutation{scope=Scope(),goalId=(string)p["goalId"]};
      if(method=="confirmQuantity"||method=="correctQuantity"){
       m.kind=method=="confirmQuantity"?"ConfirmQuantity":"CorrectQuantity";m.requestId=(string)p["requestId"];m.quantity=ProgressDomain.Number(p["quantity"],0,5000000);m.source="user-confirmed";
       if(method=="correctQuantity"){m.supersedesEventId=(string)p["supersedesEventId"];m.reason=(string)p["reason"];}
       // Explicit zero/extra/correction requires the later trusted native confirmation
       // contract. Do not accept browser-supplied acknowledgement flags as authority.
       var a=d.attempts.SingleOrDefault(x=>x.requestId==m.requestId&&x.goalId==m.goalId&&ProgressDomain.Same(x.scope,m.scope));Need(a!=null,"foreign-request");Need(method!="correctQuantity"&&Convert.ToInt64(m.quantity)>0&&Convert.ToInt64(m.quantity)<=a.expectedOutput,"quantity-explicit-approval-required");
      }else if(method=="setLifecycle"){m.kind="SetLifecycle";m.lifecycle=(string)p["lifecycle"];}else{m.kind="DetachPlan";m.sourcePlanId=(string)p["sourcePlanId"];}
      var ack=store.Commit(m,Revision(p),Operation(p),writer);Need(ack.status=="committed"||ack.status=="already-applied","progress-write-failed");return ack;
     }
    }
   }
   DesktopLifePolicy.Exact(p,"accountId","characterId");Owner(p);
   if(method=="capabilities")return new {schemaVersion=1,localOnly=true,executionConnected=false};
   if(method=="load"){using(await actor.ProgressMutationAsync())using(var writer=store.AcquireWriter(new ProgressLockOwner())){var view=store.Load(Scope(),writer).view;try{Audit(store.Inspect(writer),null);}catch{view.health="review-required";}return view;}}
   throw new ArgumentException("unsupported-progress-method");
  }
 }
}
