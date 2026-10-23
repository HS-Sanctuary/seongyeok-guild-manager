using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IrisDesktop {
    // Candidate native-only boundary. NOT registered in the host/bridge or source lists.
    // A Phase B adapter must hold the existing actor mutation gate through the entire call,
    // consume the native nonce, own the global execution lease, and preserve its checks.
    // No caller-supplied evidence, paths, context, recipe or execution permission is accepted.
    internal interface IProgressExecutionActor {
        Task<IDisposable> AcquireMutationAsync();
        ProgressExecutionContext CaptureContext();
        // During an owned confirmation admission this reads the actor's frozen active
        // intent, even after its public prepared nonce has been consumed. It must never
        // make that consumed nonce reusable. The current executor needs a B-only adapter.
        ProgressPreparedRequest CapturePrepared(string requestId);
        void ConsumeNonce(ProgressPreparedRequest request);
        // Acquisition is separate from a potentially asynchronous native user prompt.
        // Failed acquisition owns/releases its own partial resources; non-null transfers
        // disposal to ProgressExecutionLease, never to an approval result.
        Task<IDisposable> AcquireExecutionLeaseAsync(ProgressPreparedRequest request);
        Task<bool> ApproveAsync(ProgressPreparedRequest request);
        Task RevalidateAsync(ProgressPreparedRequest request);
        void RecordBegin(ProgressPreparedRequest request);
        // Claim the offer exactly once before starting Run. Run owns it through terminal.
        // Returning/throwing after Claim never transfers ownership back to the caller.
        void Dispatch(ProgressPreparedRequest request,ProgressRunLease offer);
    }
    internal sealed class ProgressExecutionLease:IDisposable {
        readonly object gate=new object();IDisposable resource;ProgressLockOwner.Hold rank;bool claimed,disposed,offered;ProgressRunOwnership transferred;
        ProgressExecutionLease(IDisposable resource,ProgressLockOwner.Hold rank){this.resource=resource;this.rank=rank;}
        internal static async Task<ProgressExecutionLease> AcquireAsync(ProgressLockOwner owner,Func<Task<IDisposable>> acquire){
            var rank=owner.Enter(ProgressLockOwner.Game);IDisposable resource=null;
            try{resource=await acquire().ConfigureAwait(false);if(resource==null)throw new InvalidOperationException("execution-lease-required");return new ProgressExecutionLease(resource,rank);}
            catch{try{if(resource!=null)resource.Dispose();}finally{rank.Dispose();}throw;}
        }
        internal ProgressRunLease Offer(){lock(gate){if(disposed||claimed||offered)throw new InvalidOperationException("execution-lease-not-owned");offered=true;return new ProgressRunLease(this);}}
        internal ProgressRunOwnership Claim(){lock(gate){if(disposed||claimed||!offered)throw new InvalidOperationException("run-lease-already-claimed");var owner=new ProgressLockOwner();var runRank=owner.Enter(ProgressLockOwner.Game);rank.TransferOut();claimed=true;transferred=new ProgressRunOwnership(owner,resource,runRank);resource=null;return transferred;}}
        public void Dispose(){lock(gate){if(disposed)return;if(!claimed){rank.CheckRelease();try{resource.Dispose();}finally{disposed=true;rank.Dispose();}}else{disposed=true;transferred.ReleaseAdmission();}}}
    }
    internal sealed class ProgressRunLease {
        readonly ProgressExecutionLease lease;readonly object gate=new object();bool claimed;
        internal ProgressRunLease(ProgressExecutionLease lease){this.lease=lease;}
        internal ProgressRunOwnership Claim(){lock(gate){if(claimed)throw new InvalidOperationException("run-lease-already-claimed");var run=lease.Claim();claimed=true;return run;}}
        internal bool Claimed{get{lock(gate)return claimed;}}
    }
    internal sealed class ProgressRunOwnership:IDisposable {
        readonly IDisposable resource;readonly ProgressLockOwner.Hold rank;readonly object gate=new object();bool disposed;
        internal ProgressLockOwner Owner{get;private set;}
        readonly TaskCompletionSource<bool> admissionReleased=new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        internal Task AdmissionReleased{get{return admissionReleased.Task;}}
        internal void ReleaseAdmission(){admissionReleased.TrySetResult(true);}
        internal ProgressRunOwnership(ProgressLockOwner owner,IDisposable resource,ProgressLockOwner.Hold rank){Owner=owner;this.resource=resource;this.rank=rank;}
        public void Dispose(){lock(gate){if(disposed)return;rank.CheckRelease();try{resource.Dispose();}finally{rank.Dispose();disposed=true;}}}
    }
    internal sealed class ProgressExecutionContext {
        public ProgressScope scope{get;set;}
        public string goalId{get;set;} public string sourcePlanId{get;set;} public string parentGoalId{get;set;}
        public string action{get;set;} public string displayName{get;set;} public long targetQuantity{get;set;}
        public string sessionId{get;set;} public long documentEpoch{get;set;} public long contextVersion{get;set;}
    }
    internal sealed class ProgressPreparedRequest {
        public ProgressExecutionContext context{get;set;} public string requestId{get;set;}
        // Native-generated digest of the COMPLETE frozen command, including gathering
        // quantity/baseline/target/auto-stop and action-specific policy. Never a UI digest.
        public string commandDigest{get;set;}
        public long preparedAt{get;set;} public long expiresAt{get;set;}
        public object craftCount{get;set;} public object outputPerCraft{get;set;} public object expectedOutput{get;set;}
    }
    internal sealed class ProgressExecutionResult {
        public int schemaVersion{get;set;} public string status{get;set;} public string error{get;set;} public long revision{get;set;}
        internal ProgressExecutionResult(string status,string error=null,long revision=0){schemaVersion=1;this.status=status;this.error=error;this.revision=revision;}
    }
    internal sealed class ProgressCoordinator {
        readonly DesktopErgonProgressStore store;readonly IProgressExecutionActor actor;readonly Func<long> clock;
        sealed class Binding {
            internal ProgressPreparedRequest request;internal string storeId,viewDigest;internal long revision;
        }
        // A receipt is process-local and one shot. A saved prepared row alone cannot mint it
        // after a restart. It is never serialized, returned, or treated as native authority.
        readonly Dictionary<string,Binding> bindings=new Dictionary<string,Binding>(StringComparer.Ordinal);
        internal ProgressCoordinator(DesktopErgonProgressStore store,IProgressExecutionActor actor,Func<long> clock){if(store==null||actor==null||clock==null)throw new ArgumentNullException();this.store=store;this.actor=actor;this.clock=clock;}
        static void Need(bool condition,string error){ProgressDomain.Require(condition,error);}
        async Task<IDisposable> MutationAsync(){var held=await actor.AcquireMutationAsync().ConfigureAwait(false);Need(held!=null,"native-mutation-not-owned");return held;}
        static void Context(ProgressExecutionContext c){
            Need(c!=null,"missing-native-context");ProgressDomain.Scope(c.scope);
            Need(ProgressDomain.IsId(c.goalId)&&ProgressDomain.IsId(c.sessionId)&&ProgressDomain.Text(c.sourcePlanId,100)&&(c.parentGoalId==null||ProgressDomain.IsId(c.parentGoalId)),"invalid-native-context");
            Need(new[]{"crafting","altering","gathering"}.Contains(c.action)&&ProgressDomain.Text(c.displayName,160)&&c.targetQuantity>=1&&c.targetQuantity<=1000000&&c.documentEpoch>=0&&c.contextVersion>=0,"invalid-native-goal");
        }
        static bool Same(object left,object right){return ProgressDomain.Canonical(left)==ProgressDomain.Canonical(right);}
        static string ViewDigest(ProgressSnapshot s){return ProgressDomain.Hash(ProgressDomain.Canonical(s.view));}
        ProgressExecutionContext Current(){var c=actor.CaptureContext();Context(c);return ProgressDomain.Clone(c);}
        ProgressGoalView Goal(ProgressSnapshot s,ProgressExecutionContext c){
            Need(s!=null&&s.health=="ok"&&s.view!=null&&s.view.health=="ok"&&ProgressDomain.Same(s.view.scope,c.scope),"progress-unavailable");
            var g=s.view.goals.SingleOrDefault(x=>x.goalId==c.goalId);
            Need(g!=null&&g.sourcePlanId==c.sourcePlanId&&g.parentGoalId==c.parentGoalId&&g.targetQuantity==c.targetQuantity&&g.action==c.action&&g.displayName==c.displayName,"goal-changed");
            Need(g.lifecycle=="active"&&!g.detached&&!g.quantitySatisfied,"goal-inactive-or-satisfied");return g;
        }
        void Prepared(ProgressPreparedRequest p,ProgressExecutionContext c,string id){
            Need(p!=null&&ProgressDomain.IsId(id)&&p.requestId==id&&ProgressDomain.Digest(p.commandDigest),"missing-prepared-request");Context(p.context);Need(Same(p.context,c),"prepared-context-changed");
            var now=clock();Need(now>=p.preparedAt&&p.preparedAt>=1&&p.expiresAt>p.preparedAt&&p.expiresAt<=ProgressDomain.TimeLimit&&now<p.expiresAt,"prepared-expired");
            // Check original numeric values BEFORE Clone/Canonical can normalize a tiny double.
            if(c.action=="crafting"){
                var count=ProgressDomain.Number(p.craftCount,1,5);var output=ProgressDomain.Number(p.outputPerCraft,1,1000000);Need(ProgressDomain.Number(p.expectedOutput,1,5000000)==count*output,"prepared-recipe");
            }else Need(p.craftCount==null&&p.outputPerCraft==null&&p.expectedOutput==null,"prepared-recipe");
        }
        static ProgressMutation GoalMutation(ProgressExecutionContext c){return new ProgressMutation{kind="CreateGoal",scope=c.scope,goalId=c.goalId,sourcePlanId=c.sourcePlanId,parentGoalId=c.parentGoalId,action=c.action,displayName=c.displayName,targetQuantity=c.targetQuantity};}
        static ProgressMutation BindMutation(ProgressPreparedRequest p){return new ProgressMutation{kind="BindPreparedRequest",scope=p.context.scope,goalId=p.context.goalId,requestId=p.requestId,action=p.context.action,displayName=p.context.displayName,preparedAt=p.preparedAt,expiresAt=p.expiresAt,craftCount=p.craftCount,outputPerCraft=p.outputPerCraft,expectedOutput=p.expectedOutput};}
        ProgressSnapshot Ack(ProgressCommitResult ack,ProgressExecutionContext c,long expected,Guid op,ProgressWriterAdmission writer){
            Need(ack!=null&&ack.status=="committed"&&ack.operationId==op.ToString("D")&&ack.revision==expected+1&&ack.view!=null&&ack.view.health=="ok","save-not-acknowledged");
            var fresh=store.Load(c.scope,writer);Goal(fresh,c);Need(fresh.storeId!=null&&fresh.revision==ack.revision&&Same(fresh.view,ack.view),"save-ack-changed");return fresh;
        }
        internal async Task<ProgressExecutionResult> CreateGoalAsync(long expectedRevision,Guid operationId){
            var owner=new ProgressLockOwner();
            try{var initial=Current();using(owner.Enter(ProgressLockOwner.Mutation))using(await MutationAsync().ConfigureAwait(false)){
                Need(Same(initial,Current()),"context-changed-during-mutation-wait");
                Need(operationId!=Guid.Empty&&expectedRevision>=0&&expectedRevision<ProgressDomain.SafeInteger,"invalid-operation");var c=initial;
                using(var writer=await store.AcquireWriterAsync(owner).ConfigureAwait(false)){
                    Need(Same(c,Current()),"context-changed-during-writer-wait");var ack=store.Commit(GoalMutation(c),expectedRevision,operationId,writer);var fresh=Ack(ack,c,expectedRevision,operationId,writer);
                    Need(Same(c,Current()),"context-changed-after-save");return new ProgressExecutionResult("saved",null,fresh.revision);
                }
            }}catch(Exception){return new ProgressExecutionResult("blocked","goal-save-required");}
        }
        internal async Task<ProgressExecutionResult> BindPreparedAsync(string requestId,long expectedRevision,Guid operationId){
            var owner=new ProgressLockOwner();
            try{var initial=Current();using(owner.Enter(ProgressLockOwner.Mutation))using(await MutationAsync().ConfigureAwait(false)){
                Need(Same(initial,Current()),"context-changed-during-mutation-wait");
                Need(operationId!=Guid.Empty&&expectedRevision>=0&&expectedRevision<ProgressDomain.SafeInteger&&ProgressDomain.IsId(requestId),"invalid-operation");
                var c=Current();using(var writer=await store.AcquireWriterAsync(owner).ConfigureAwait(false)){
                Need(Same(c,Current()),"context-changed-during-writer-wait");var before=store.Load(c.scope,writer);var goal=Goal(before,c);
                Need(before.revision==expectedRevision&&!goal.requests.Any(x=>x.requestId==requestId)&&bindings.Count<ProgressDomain.AttemptLimit,"binding-conflict");
                var p=actor.CapturePrepared(requestId);Prepared(p,c,requestId);p=ProgressDomain.Clone(p);
                var ack=store.Commit(BindMutation(p),expectedRevision,operationId,writer);var fresh=Ack(ack,c,expectedRevision,operationId,writer);
                Prepared(actor.CapturePrepared(requestId),Current(),requestId);Need(Same(p,actor.CapturePrepared(requestId))&&Same(c,Current()),"prepared-changed-after-save");
                Need(BoundRequest(Goal(fresh,c),p),"binding-not-durable");
                bindings.Add(requestId,new Binding{request=p,storeId=fresh.storeId,revision=fresh.revision,viewDigest=ViewDigest(fresh)});
                return new ProgressExecutionResult("bound",null,fresh.revision);
                }
            }}catch(Exception){return new ProgressExecutionResult("blocked","prepared-binding-required");}
        }
        static bool BoundRequest(ProgressGoalView g,ProgressPreparedRequest p){
            var r=g.requests.SingleOrDefault(x=>x.requestId==p.requestId);
            return r!=null&&r.terminalOutcome==null&&r.quantity==null&&r.confirmations.Length==0&&r.action==p.context.action&&r.displayName==p.context.displayName&&r.preparedAt==p.preparedAt&&r.expiresAt==p.expiresAt&&Same(r.craftCount,p.craftCount)&&Same(r.outputPerCraft,p.outputPerCraft)&&Same(r.expectedOutput,p.expectedOutput);
        }
        void CheckBinding(Binding b,ProgressWriterAdmission writer=null){
            var c=Current();Need(Same(c,b.request.context),"context-changed");Prepared(actor.CapturePrepared(b.request.requestId),c,b.request.requestId);Need(Same(actor.CapturePrepared(b.request.requestId),b.request),"recipe-changed");
            var s=writer==null?store.Load(c.scope):store.Load(c.scope,writer);var g=Goal(s,c);
            Need(s.storeId==b.storeId&&s.revision==b.revision&&ViewDigest(s)==b.viewDigest&&BoundRequest(g,b.request),"progress-changed-after-binding");
        }
        // No synchronous fallback: a legacy caller cannot bypass the async admission.
        internal ProgressExecutionResult Confirm(string requestId){return new ProgressExecutionResult("blocked","async-coordinator-required");}
        internal async Task<ProgressExecutionResult> ConfirmAsync(string requestId){
            bool beginEntered=false;
            var owner=new ProgressLockOwner();
            try{var initial=Current();using(owner.Enter(ProgressLockOwner.Mutation))using(await MutationAsync().ConfigureAwait(false)){
                Need(Same(initial,Current()),"context-changed-during-mutation-wait");
                Binding b;Need(ProgressDomain.IsId(requestId)&&bindings.TryGetValue(requestId,out b),"binding-required");
                // Definite assignment is separate for legacy C# compilers. Remove before any
                // native dialog/callback can reenter, even on refusal, exception, or ACK loss.
                b=bindings[requestId];bindings.Remove(requestId);CheckBinding(b);
                actor.ConsumeNonce(ProgressDomain.Clone(b.request));
                using(var executionLease=await ProgressExecutionLease.AcquireAsync(owner,()=>actor.AcquireExecutionLeaseAsync(ProgressDomain.Clone(b.request))).ConfigureAwait(false)){
                    CheckBinding(b);
                    // User approval may await UI. Neither writer exclusion nor Store file
                    // lock is held here. The native execution lease remains solely owned.
                    Need(await actor.ApproveAsync(ProgressDomain.Clone(b.request)).ConfigureAwait(false),"approval-declined");CheckBinding(b);
                    await actor.RevalidateAsync(ProgressDomain.Clone(b.request)).ConfigureAwait(false);CheckBinding(b);
                    using(var writer=await store.AcquireWriterAsync(owner).ConfigureAwait(false)){
                        // No await between the final saved/context/nonce check and Begin.
                        // Every direct Store.Commit now shares this exclusion as well.
                        CheckBinding(b,writer);beginEntered=true;actor.RecordBegin(ProgressDomain.Clone(b.request));
                        var offer=executionLease.Offer();actor.Dispatch(ProgressDomain.Clone(b.request),offer);Need(offer.Claimed,"run-did-not-claim-lease");
                        return new ProgressExecutionResult("dispatched",null,b.revision);
                    }
                }
            }}catch(Exception){return new ProgressExecutionResult(beginEntered?"dispatch-uncertain":"blocked",beginEntered?"native-result-review-required":"execution-protected");}
        }
    }
}
