using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;

namespace IrisDesktop {
    // Candidate native-only boundary. NOT registered in the host/bridge or source lists.
    // A Phase B adapter must hold the existing actor mutation gate through the entire call,
    // consume the native nonce, own the global execution lease, and preserve its checks.
    // No caller-supplied evidence, paths, context, recipe or execution permission is accepted.
    internal interface IProgressExecutionActor {
        IDisposable AcquireMutation();
        // Mandatory, separate cross-process writer exclusion, outside the Store file lock.
        // Every host route that mutates this progress store must participate in the SAME
        // exclusion. Null means the adapter cannot establish this guarantee: fail closed.
        // The existing actor mutation gate alone is insufficient. Phase B must implement
        // and audit the shared writer policy before installing an adapter.
        IDisposable AcquireProgressWriterExclusion();
        ProgressExecutionContext CaptureContext();
        // During an owned confirmation admission this reads the actor's frozen active
        // intent, even after its public prepared nonce has been consumed. It must never
        // make that consumed nonce reusable. The current executor needs a B-only adapter.
        ProgressPreparedRequest CapturePrepared(string requestId);
        // On refusal/exception the adapter releases any lease it acquired itself. A
        // non-null result transfers that lease's disposal to this coordinator.
        IDisposable ConsumeAndApprove(ProgressPreparedRequest request);
        void Revalidate(ProgressPreparedRequest request);
        void RecordBegin(ProgressPreparedRequest request);
        void Dispatch(ProgressPreparedRequest request);
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
        IDisposable Mutation(){var held=actor.AcquireMutation();Need(held!=null,"native-mutation-not-owned");return held;}
        IDisposable WriterExclusion(){var held=actor.AcquireProgressWriterExclusion();Need(held!=null,"progress-writers-not-excluded");return held;}
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
        ProgressSnapshot Ack(ProgressCommitResult ack,ProgressExecutionContext c,long expected,Guid op){
            Need(ack!=null&&ack.status=="committed"&&ack.operationId==op.ToString("D")&&ack.revision==expected+1&&ack.view!=null&&ack.view.health=="ok","save-not-acknowledged");
            var fresh=store.Load(c.scope);Goal(fresh,c);Need(fresh.storeId!=null&&fresh.revision==ack.revision&&Same(fresh.view,ack.view),"save-ack-changed");return fresh;
        }
        internal ProgressExecutionResult CreateGoal(long expectedRevision,Guid operationId){
            try{using(Mutation())using(WriterExclusion()){
                Need(operationId!=Guid.Empty&&expectedRevision>=0&&expectedRevision<ProgressDomain.SafeInteger,"invalid-operation");var c=Current();
                var ack=store.Commit(GoalMutation(c),expectedRevision,operationId);var fresh=Ack(ack,c,expectedRevision,operationId);
                Need(Same(c,Current()),"context-changed-after-save");return new ProgressExecutionResult("saved",null,fresh.revision);
            }}catch(Exception){return new ProgressExecutionResult("blocked","goal-save-required");}
        }
        internal ProgressExecutionResult BindPrepared(string requestId,long expectedRevision,Guid operationId){
            try{using(Mutation())using(WriterExclusion()){
                Need(operationId!=Guid.Empty&&expectedRevision>=0&&expectedRevision<ProgressDomain.SafeInteger&&ProgressDomain.IsId(requestId),"invalid-operation");
                var c=Current();var before=store.Load(c.scope);var goal=Goal(before,c);
                Need(before.revision==expectedRevision&&!goal.requests.Any(x=>x.requestId==requestId)&&bindings.Count<ProgressDomain.AttemptLimit,"binding-conflict");
                var p=actor.CapturePrepared(requestId);Prepared(p,c,requestId);p=ProgressDomain.Clone(p);
                var ack=store.Commit(BindMutation(p),expectedRevision,operationId);var fresh=Ack(ack,c,expectedRevision,operationId);
                Prepared(actor.CapturePrepared(requestId),Current(),requestId);Need(Same(p,actor.CapturePrepared(requestId))&&Same(c,Current()),"prepared-changed-after-save");
                Need(BoundRequest(Goal(fresh,c),p),"binding-not-durable");
                bindings.Add(requestId,new Binding{request=p,storeId=fresh.storeId,revision=fresh.revision,viewDigest=ViewDigest(fresh)});
                return new ProgressExecutionResult("bound",null,fresh.revision);
            }}catch(Exception){return new ProgressExecutionResult("blocked","prepared-binding-required");}
        }
        static bool BoundRequest(ProgressGoalView g,ProgressPreparedRequest p){
            var r=g.requests.SingleOrDefault(x=>x.requestId==p.requestId);
            return r!=null&&r.terminalOutcome==null&&r.quantity==null&&r.confirmations.Length==0&&r.action==p.context.action&&r.displayName==p.context.displayName&&r.preparedAt==p.preparedAt&&r.expiresAt==p.expiresAt&&Same(r.craftCount,p.craftCount)&&Same(r.outputPerCraft,p.outputPerCraft)&&Same(r.expectedOutput,p.expectedOutput);
        }
        void CheckBinding(Binding b){
            var c=Current();Need(Same(c,b.request.context),"context-changed");Prepared(actor.CapturePrepared(b.request.requestId),c,b.request.requestId);Need(Same(actor.CapturePrepared(b.request.requestId),b.request),"recipe-changed");
            var s=store.Load(c.scope);var g=Goal(s,c);
            Need(s.storeId==b.storeId&&s.revision==b.revision&&ViewDigest(s)==b.viewDigest&&BoundRequest(g,b.request),"progress-changed-after-binding");
        }
        internal ProgressExecutionResult Confirm(string requestId){
            bool beginEntered=false;
            try{using(Mutation())using(WriterExclusion()){
                Binding b;Need(ProgressDomain.IsId(requestId)&&bindings.TryGetValue(requestId,out b),"binding-required");
                // Definite assignment is separate for legacy C# compilers. Remove before any
                // native dialog/callback can reenter, even on refusal, exception, or ACK loss.
                b=bindings[requestId];bindings.Remove(requestId);CheckBinding(b);
                var approvalLease=actor.ConsumeAndApprove(ProgressDomain.Clone(b.request));
                Need(approvalLease!=null,"native-approval-lease-not-owned");
                using(approvalLease){
                    actor.Revalidate(ProgressDomain.Clone(b.request));
                    // Store locks are released before every native call. The Phase B adapter
                    // must retain mutation+writer exclusion+lease and perform no await
                    // between this check and native Begin. A direct Store writer bypassing
                    // the shared exclusion remains a Phase B activation blocker.
                    CheckBinding(b);beginEntered=true;actor.RecordBegin(ProgressDomain.Clone(b.request));
                    actor.Dispatch(ProgressDomain.Clone(b.request));return new ProgressExecutionResult("dispatched",null,b.revision);
                }
            }}catch(Exception){return new ProgressExecutionResult(beginEntered?"dispatch-uncertain":"blocked",beginEntered?"native-result-review-required":"execution-protected");}
        }
    }
}
