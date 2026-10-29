using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Web.Script.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace IrisDesktop {
    // Logical operation ownership survives await without thread-affine locks or ambient
    // inheritance into child tasks. Callers pass the owner explicitly; duplicate ranks
    // and reverse acquisition fail before any OS/native resource is acquired.
    internal sealed class ProgressLockOwner {
        internal const int Mutation=10,Game=20,Writer=30,File=40;
        readonly object gate=new object();readonly SortedSet<int> ranks=new SortedSet<int>();
        internal sealed class Hold:IDisposable {
            readonly ProgressLockOwner owner;readonly int rank;bool disposed;
            internal Hold(ProgressLockOwner owner,int rank){this.owner=owner;this.rank=rank;}
            internal void CheckRelease(){lock(owner.gate){if(!disposed&&owner.ranks.Max!=rank)throw new InvalidOperationException("lock-release-order");}}
            internal void TransferOut(){lock(owner.gate){if(disposed)throw new InvalidOperationException("lock-already-released");owner.ranks.Remove(rank);disposed=true;}}
            public void Dispose(){lock(owner.gate){if(disposed)return;CheckRelease();owner.ranks.Remove(rank);disposed=true;}}
        }
        internal Hold Enter(int rank){lock(gate){if(ranks.Count!=0&&rank<=ranks.Max)throw new InvalidOperationException("lock-acquisition-order");ranks.Add(rank);return new Hold(this,rank);}}
    }
    internal sealed class ProgressWriterAdmission:IDisposable {
        readonly string key;readonly ProgressLockOwner owner;readonly ProgressLockOwner.Hold rank;readonly IDisposable resource;readonly Action released;readonly object gate=new object();bool busy,disposed;
        internal ProgressWriterAdmission(string key,ProgressLockOwner owner,ProgressLockOwner.Hold rank,IDisposable resource,Action released){this.key=key;this.owner=owner;this.rank=rank;this.resource=resource;this.released=released;}
        sealed class Use:IDisposable {readonly ProgressWriterAdmission admission;readonly ProgressLockOwner.Hold fileRank;bool disposed;internal Use(ProgressWriterAdmission a,ProgressLockOwner.Hold f){admission=a;fileRank=f;}public void Dispose(){lock(admission.gate){if(disposed)return;fileRank.Dispose();admission.busy=false;disposed=true;}}}
        internal IDisposable EnterStore(string file){lock(gate){if(disposed||busy||!String.Equals(key,Path.GetFullPath(file)+".writers.lock",StringComparison.OrdinalIgnoreCase)||!ProgressWriterGate.Owns(key,this))throw new InvalidOperationException("writer-admission-invalid");var fileRank=owner.Enter(ProgressLockOwner.File);busy=true;return new Use(this,fileRank);}}
        public void Dispose(){lock(gate){if(disposed)return;if(busy)throw new InvalidOperationException("writer-admission-in-use");rank.CheckRelease();try{resource.Dispose();}finally{rank.Dispose();disposed=true;released();}}}
    }
    internal static class ProgressWriterGate {
        static readonly object gate=new object();static readonly Dictionary<string,ProgressWriterAdmission> local=new Dictionary<string,ProgressWriterAdmission>(StringComparer.OrdinalIgnoreCase);
        internal static bool Owns(string key,ProgressWriterAdmission admission){lock(gate){ProgressWriterAdmission active;return local.TryGetValue(key,out active)&&Object.ReferenceEquals(active,admission);}}
        internal static ProgressWriterAdmission Acquire(string file,ProgressLockOwner owner){
            if(owner==null)throw new ArgumentNullException("owner");var rank=owner.Enter(ProgressLockOwner.Writer);var key=Path.GetFullPath(file)+".writers.lock";bool registered=false;IDisposable resource=null;
            try{
                lock(gate){if(local.ContainsKey(key))throw new IOException("writer-already-owned-in-process");local.Add(key,null);registered=true;}
                resource=new ProgressFileIO().AcquireExclusiveLock(key);
                var admission=new ProgressWriterAdmission(key,owner,rank,resource,()=>{lock(gate)local.Remove(key);});lock(gate)local[key]=admission;resource=null;return admission;
            }catch{if(resource!=null)resource.Dispose();if(registered)lock(gate)local.Remove(key);rank.Dispose();throw;}
        }
    }
    internal interface IProgressFileIO {byte[] ReadCipher(string path,int max);void WriteNewAndFlush(string path,byte[] bytes);void ReplaceWithBackup(string temp,string current,string backup);void MoveNew(string temp,string current);IDisposable AcquireExclusiveLock(string path);}
    internal sealed class ProgressFileIO:IProgressFileIO {
        public byte[] ReadCipher(string path,int max){using(var stream=new FileStream(path,FileMode.Open,FileAccess.Read,FileShare.Read)){ProgressDomain.Require(stream.Length>0&&stream.Length<=max,"cipher-size");var bytes=new byte[(int)stream.Length];int offset=0,n;while(offset<bytes.Length&&(n=stream.Read(bytes,offset,bytes.Length-offset))>0)offset+=n;ProgressDomain.Require(offset==bytes.Length,"cipher-read");return bytes;}}
        public void WriteNewAndFlush(string path,byte[] bytes){using(var stream=new FileStream(path,FileMode.CreateNew,FileAccess.Write,FileShare.None)){stream.Write(bytes,0,bytes.Length);stream.Flush(true);}}
        public void ReplaceWithBackup(string temp,string current,string backup){File.Replace(temp,current,backup);}
        public void MoveNew(string temp,string current){File.Move(temp,current);}
        public IDisposable AcquireExclusiveLock(string path){
            Directory.CreateDirectory(Path.GetDirectoryName(path));var timer=System.Diagnostics.Stopwatch.StartNew();
            while(true){try{return new FileStream(path,FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None);}catch(IOException){if(timer.ElapsedMilliseconds>=5000)throw;System.Threading.Thread.Sleep(20);}}
        }
    }
    internal sealed class DesktopErgonProgressStore {
        public string FilePath{get;private set;}
        readonly string environment,directory;readonly byte[] entropy;readonly IProgressFileIO io;
        sealed class State {internal ProgressDocument document;internal string health,error;internal long revision,highWater;internal List<ProgressDocument> candidates=new List<ProgressDocument>();}
        internal DesktopErgonProgressStore(string root,string environment,IProgressFileIO io=null){
            ProgressDomain.Require(!String.IsNullOrWhiteSpace(root)&&Path.IsPathRooted(root)&&(environment=="development"||environment=="production"),"invalid-root-environment");
            var rootPart=Path.GetPathRoot(root);ProgressDomain.Require(rootPart.Length>1&&!rootPart.EndsWith(":",StringComparison.Ordinal),"root-not-absolute");
            var full=Path.GetFullPath(root);ProgressDomain.Require(full.TrimEnd(Path.DirectorySeparatorChar)!=Path.GetPathRoot(full).TrimEnd(Path.DirectorySeparatorChar),"root-too-broad");
            this.environment=environment;this.io=io??new ProgressFileIO();directory=Path.Combine(full,environment);FilePath=Path.Combine(directory,"ergon-progress-v1.dpapi");entropy=ProgressDomain.Utf8.GetBytes("SANCTUM:IRIS:ErgonProgress:v1:"+environment);
            // No directories, reads, migration or existing journal objects in this constructor.
        }
        ProgressDocument Decode(string path){
            var cipher=io.ReadCipher(path,ProgressDomain.ByteLimit+8192);byte[] plain=ProtectedData.Unprotect(cipher,entropy,DataProtectionScope.CurrentUser);
            try{
                ProgressDomain.Require(plain.Length<=ProgressDomain.ByteLimit,"plain-size");var text=ProgressDomain.Utf8.GetString(plain);ProgressDomain.IntegerJsonTokens(text);var json=ProgressDomain.Serializer();
                var raw=json.DeserializeObject(text);var d=json.Deserialize<ProgressDocument>(text);
                ProgressDomain.Require(ProgressDomain.Canonical(raw)==ProgressDomain.Canonical(d),"document-fields");ProgressDomain.Validate(d,environment);return d;
            }catch(Exception e){
                // Legacy .NET numeric TypeConverter wraps invalid stored strings in a plain
                // Exception/FormatException pair. Treat it as bad data, not an escaping crash.
                if(e.GetType()==typeof(Exception)&&e.InnerException is FormatException)throw new InvalidDataException("document-format",e);throw;
            }finally{Array.Clear(plain,0,plain.Length);}
        }
        string[] Artifacts(){
            if(!Directory.Exists(directory))return new string[0];
            var paths=Directory.EnumerateFiles(directory,Path.GetFileName(FilePath)+".*").Where(x=>x.EndsWith(".tmp",StringComparison.Ordinal)||x.EndsWith(".bak",StringComparison.Ordinal)||x.EndsWith(".intent",StringComparison.Ordinal)).Take(201).ToArray();
            ProgressDomain.Require(paths.Length<=200,"artifact-limit");return paths;
        }
        State Read(){
            var s=new State();var files=Artifacts();bool exists=File.Exists(FilePath);
            if(exists){try{s.document=Decode(FilePath);s.revision=s.document.revision;s.health=s.document.reviewRequired||files.Any(x=>x.EndsWith(".intent",StringComparison.Ordinal))?"review-required":"ok";}catch(Exception e){if(!Recoverable(e))throw;s.health="unavailable";s.error="invalid-current";}}
            else {s.health=files.Length==0?"ok":"review-required";s.error=files.Length==0?null:"missing-current";if(files.Length==0)s.document=ProgressDomain.Empty(environment);}
            // Healthy reads do not repeatedly decrypt every backup or candidate.
            if(s.health!="ok"){
                if(s.document!=null)s.candidates.Add(s.document);
                foreach(var path in files){try{var d=Decode(path);s.highWater=Math.Max(s.highWater,d.revision);if(path.EndsWith(".bak",StringComparison.Ordinal)&&!s.candidates.Any(c=>c.commitDigest==d.commitDigest))s.candidates.Add(d);}catch(Exception e){if(!Recoverable(e))throw;}}
            }
            s.highWater=Math.Max(s.highWater,s.revision);if(s.document==null)s.revision=s.highWater;
            return s;
        }
        static bool Recoverable(Exception e){return e is InvalidDataException||e is IOException||e is UnauthorizedAccessException||e is CryptographicException||e is ArgumentException||e is InvalidOperationException||e is OverflowException||e is FormatException;}
        ProgressProjection View(State s,ProgressScope scope){
            var view=s.document==null?new ProgressProjection{scope=ProgressDomain.Clone(scope),revision=s.revision,health=s.health}:ProgressDomain.Project(s.document,scope,s.health);
            view.recoveryCandidates=s.candidates.OrderByDescending(x=>x.revision).Select(x=>new ProgressRecoveryCandidate{commitDigest=x.commitDigest,revision=x.revision}).ToArray();return view;
        }
        ProgressSnapshot Snapshot(State s,ProgressScope scope){return new ProgressSnapshot{environment=environment,storeId=s.document==null?null:s.document.storeId,revision=s.revision,health=s.health,error=s.error,view=View(s,scope)};}
        internal ProgressSnapshot Load(ProgressScope scope){
            ProgressDomain.Scope(scope);ProgressDomain.Require(scope.environment==environment,"foreign-scope");
            try{using(io.AcquireExclusiveLock(FilePath+".lock"))return Snapshot(Read(),scope);}catch(Exception e){if(!Recoverable(e))throw;return Snapshot(new State{health="unavailable",error="read-failed"},scope);}
        }
        internal ProgressProjection Project(ProgressScope scope){return Load(scope).view;}
        // Native reconciliation only: a short read under an already-owned writer.
        // Never serialized by the bridge and never constructs the existing action journal.
        internal ProgressDocument Inspect(ProgressWriterAdmission writer){using(writer.EnterStore(FilePath))using(io.AcquireExclusiveLock(FilePath+".lock")){var state=Read();ProgressDomain.Require(state.health=="ok","progress-review-required");return ProgressDomain.Clone(state.document);}}
        internal ProgressWriterAdmission AcquireWriter(ProgressLockOwner owner){return ProgressWriterGate.Acquire(FilePath,owner);}
        internal Task<ProgressWriterAdmission> AcquireWriterAsync(ProgressLockOwner owner){return Task.Run(()=>AcquireWriter(owner));}
        internal ProgressSnapshot Load(ProgressScope scope,ProgressWriterAdmission writer){if(writer==null)throw new InvalidOperationException("writer-admission-required");using(writer.EnterStore(FilePath))return Load(scope);}
        // Every mutation, including recovery and terminal evidence, reaches this common
        // exclusion. Direct callers cannot opt out. The explicit-owner overload is for
        // callers already holding the SAME Store's writer admission, never a new lock.
        internal ProgressCommitResult Commit(ProgressMutation mutation,long revision,Guid operation){
            try{using(var writer=AcquireWriter(new ProgressLockOwner()))return Commit(mutation,revision,operation,writer);}
            catch(Exception e){if(!Recoverable(e))throw;return new ProgressCommitResult{status="unavailable",operationId=operation.ToString("D"),error="writer-unavailable"};}
        }
        internal ProgressCommitResult Commit(ProgressMutation mutation,long revision,Guid operation,ProgressWriterAdmission writer,Action validate=null){
            try{if(writer==null)throw new InvalidOperationException("writer-admission-required");using(writer.EnterStore(FilePath))return CommitUnderWriter(mutation,revision,operation,validate);}
            catch(Exception e){if(!Recoverable(e))throw;return new ProgressCommitResult{status="unavailable",operationId=operation.ToString("D"),error="writer-admission-invalid"};}
        }
        ProgressCommitResult CommitUnderWriter(ProgressMutation mutation,long revision,Guid operation,Action validate){
            var op=operation.ToString("D");ProgressScope scope=mutation==null?null:mutation.scope;
            try{ProgressDomain.Scope(scope);ProgressDomain.Require(scope.environment==environment,"foreign-scope");}
            catch(InvalidDataException){return new ProgressCommitResult{status="rejected",operationId=op,error="invalid-scope"};}
            State state=null;
            try{using(io.AcquireExclusiveLock(FilePath+".lock")){
                state=Read();if(validate!=null)validate();ProgressCommitResult next;
                if(state.document!=null&&state.document.auditEvents.Any(e=>e.operationId==op)){
                    var duplicate=ProgressDomain.Commit(state.document,mutation,revision,operation,Now());duplicate.view=View(state,scope);duplicate.revision=state.revision;if(validate!=null)validate();return duplicate;
                }
                if(mutation.kind=="Recover"){
                    if(state.health=="ok"||revision!=state.revision)return Failure("conflict",op,state,scope,"recovery-revision");
                    long candidateRevision;try{candidateRevision=ProgressDomain.Number(mutation.candidateRevision,0,ProgressDomain.SafeInteger);}catch(InvalidDataException){return Failure("rejected",op,state,scope,"invalid-recovery-revision");}
                    var candidate=state.candidates.SingleOrDefault(x=>x.commitDigest==mutation.candidateDigest&&x.revision==candidateRevision);
                    if(candidate==null||!candidate.goals.Any(x=>x.goalId==mutation.goalId&&ProgressDomain.Same(x.scope,scope)))return Failure("rejected",op,state,scope,"recovery-candidate");
                    next=ProgressDomain.Commit(candidate,mutation,state.highWater,operation,Now(),state.highWater);
                }else{
                    if(state.document==null)return Failure("unavailable",op,state,scope,"current-unavailable");
                    // Dedup precedes both CAS and review checks. It returns the latest protected view.
                    if(state.health!="ok"&&!state.document.auditEvents.Any(e=>e.operationId==op))return Failure(state.document.reviewRequired?"rejected":"unavailable",op,state,scope,"review-required");
                    next=ProgressDomain.Commit(state.document,mutation,revision,operation,Now());
                }
                if(next.status!="committed"){next.view=View(state,scope);next.revision=state.revision;return next;}
                var candidateDoc=next.document;ProgressDomain.Validate(candidateDoc,environment);if(validate!=null)validate();Publish(candidateDoc,state.document,validate);
                // Never return the uncommitted candidate on an error. Only verified current reaches ACK.
                var committed=Read();ProgressDomain.Require(committed.document!=null&&committed.document.commitDigest==candidateDoc.commitDigest,"commit-verification");
                var result=new ProgressCommitResult{status="committed",operationId=op,revision=committed.document.revision,view=View(committed,scope)};if(validate!=null)validate();return result;
            }}catch(Exception e){if(!Recoverable(e))throw;var error=e is InvalidDataException?"invalid:"+e.Message:"storage:"+e.GetType().Name;return state==null?new ProgressCommitResult{status="unavailable",operationId=op,error=error}:Failure("unavailable",op,state,scope,error);}
        }
        static long Now(){return (long)(DateTime.UtcNow-new DateTime(1970,1,1)).TotalMilliseconds;}
        ProgressCommitResult Failure(string status,string op,State state,ProgressScope scope,string error){return new ProgressCommitResult{status=status,operationId=op,revision=state.revision,error=error,view=View(state,scope)};}
        void Publish(ProgressDocument d,ProgressDocument previous,Action validate){
            var plain=ProgressDomain.Utf8.GetBytes(ProgressDomain.Serialize(d));byte[] cipher;
            try{ProgressDomain.Require(plain.Length<=ProgressDomain.ByteLimit,"plain-size");cipher=ProtectedData.Protect(plain,entropy,DataProtectionScope.CurrentUser);}finally{Array.Clear(plain,0,plain.Length);}
            var suffix=Guid.NewGuid().ToString("N");var temp=FilePath+"."+suffix+".tmp";var intent=FilePath+"."+suffix+".intent";var backup=FilePath+".pending."+suffix+".bak";
            io.WriteNewAndFlush(temp,cipher);var checkedTemp=Decode(temp);ProgressDomain.Require(checkedTemp.commitDigest==d.commitDigest&&checkedTemp.storeId==d.storeId,"temp-verification");
            if(validate!=null)validate();
            // Durable encrypted intent makes a post-publish verification interruption visible after restart.
            io.WriteNewAndFlush(intent,cipher);
            if(validate!=null)validate();
            if(File.Exists(FilePath))io.ReplaceWithBackup(temp,FilePath,backup);else io.MoveNew(temp,FilePath);
            var checkedCurrent=Decode(FilePath);ProgressDomain.Require(checkedCurrent.commitDigest==d.commitDigest&&checkedCurrent.storeId==d.storeId,"current-verification");
            if(File.Exists(backup)&&previous!=null){var b=Decode(backup);ProgressDomain.Require(b.commitDigest==previous.commitDigest&&b.storeId==previous.storeId,"backup-verification");File.Move(backup,FilePath+".verified."+suffix+".bak");}
            File.Delete(intent);
            Rotate(d);
        }
        void Rotate(ProgressDocument current){
            // Only verified, same-store ancestors are eligible. Faults/forks/future schemas remain untouched.
            var ancestors=new List<Tuple<string,long>>();
            foreach(var file in Directory.EnumerateFiles(directory,Path.GetFileName(FilePath)+".verified.*.bak")){
                var name=Path.GetFileName(file);var prefix=Path.GetFileName(FilePath)+".verified.";Guid suffix;
                if(name.Length!=prefix.Length+32+4||!Guid.TryParseExact(name.Substring(prefix.Length,32),"N",out suffix)||suffix==Guid.Empty)continue;
                try{var d=Decode(file);if(d.storeId==current.storeId&&d.revision<current.revision&&current.auditEvents.Any(e=>e.revision==d.revision&&e.digest==d.commitDigest))ancestors.Add(Tuple.Create(file,d.revision));}catch(Exception e){if(!Recoverable(e))throw;}
            }
            foreach(var old in ancestors.OrderByDescending(x=>x.Item2).Skip(2)){try{File.Delete(old.Item1);}catch(IOException){}catch(UnauthorizedAccessException){}}
        }
    }
    // Phase 1, intentionally not in the host source lists or bridge. No execution authority.
    internal sealed class ProgressScope {public string environment{get;set;} public string accountId{get;set;} public string characterId{get;set;}}
    internal sealed class ManualWoodReceiptView {public string receiptId;public ProgressConfirmation[] confirmations;}
    internal sealed class ManualWoodView {public int schemaVersion=1;public ProgressScope scope;public string goalId,sourcePlanId,action,displayName,lifecycle,health;public long revision,targetQuantity;public long? confirmedQuantity,remainingQuantity;public ManualWoodReceiptView[] receipts;}
    internal sealed class QuantityAcknowledgement {public string requestId{get;set;} public object quantity{get;set;} public long revision{get;set;} public bool zero{get;set;} public bool extra{get;set;} public bool correction{get;set;}}
    internal sealed class NativeTerminalEvidence {
        public ProgressScope scope{get;set;} public string goalId{get;set;} public string requestId{get;set;} public string action{get;set;} public string displayName{get;set;}
        public object craftCount{get;set;} public object outputPerCraft{get;set;} public object expectedOutput{get;set;} public string outcome{get;set;}
        public long startedAt{get;set;} public long observedAt{get;set;} public int verifierVersion{get;set;} public string rowDigest{get;set;}
    }
    internal sealed class ProgressGoalReplacement {public string goalId{get;set;} public object targetQuantity{get;set;}}
    internal sealed class ProgressMutation {
        public ProgressGoalReplacement replacement{get;set;}
        public string kind{get;set;} public ProgressScope scope{get;set;} public string goalId{get;set;} public string requestId{get;set;}
        public string sourcePlanId{get;set;} public string parentGoalId{get;set;} public string action{get;set;} public string displayName{get;set;} public object targetQuantity{get;set;}
        public object craftCount{get;set;} public object outputPerCraft{get;set;} public object expectedOutput{get;set;} public object preparedAt{get;set;} public object expiresAt{get;set;}
        public object quantity{get;set;} public string source{get;set;} public string supersedesEventId{get;set;} public string reason{get;set;} public QuantityAcknowledgement confirmation{get;set;}
        public NativeTerminalEvidence evidence{get;set;} public string lifecycle{get;set;} public string candidateDigest{get;set;} public object candidateRevision{get;set;}
    }
    internal sealed class ProgressConfirmation {public string eventId{get;set;} public long revision{get;set;} public long quantity{get;set;} public string source{get;set;} public long confirmedAt{get;set;} public string supersedesEventId{get;set;} public string reason{get;set;}}
    internal sealed class ProgressGoalRecord {
        public ProgressScope scope{get;set;} public string goalId{get;set;} public string sourcePlanId{get;set;} public string parentGoalId{get;set;} public string rootGoalId{get;set;} public string action{get;set;} public string displayName{get;set;} public long targetQuantity{get;set;} public string lifecycle{get;set;} public bool detached{get;set;}
    }
    internal sealed class ProgressAttemptRecord {
        public string goalId{get;set;} public ProgressScope scope{get;set;} public string requestId{get;set;} public string action{get;set;} public string displayName{get;set;}
        public long? craftCount{get;set;} public long? outputPerCraft{get;set;} public long? expectedOutput{get;set;} public int? processingRound{get;set;} public long preparedAt{get;set;} public long expiresAt{get;set;}
        public NativeTerminalEvidence evidence{get;set;} public List<ProgressConfirmation> confirmations{get;set;}
        public ProgressAttemptRecord(){confirmations=new List<ProgressConfirmation>();}
    }
    internal sealed class ProgressAuditEvent {
        public string eventId{get;set;} public string operationId{get;set;} public string meaningDigest{get;set;} public long revision{get;set;} public long recordedAt{get;set;} public string previousDigest{get;set;} public string digest{get;set;} public ProgressMutation mutation{get;set;}
    }
    internal sealed class ProgressDocument {
        public int schemaVersion{get;set;} public string environment{get;set;} public string storeId{get;set;} public long revision{get;set;} public string previousCommitDigest{get;set;} public string commitDigest{get;set;} public bool reviewRequired{get;set;}
        public List<ProgressGoalRecord> goals{get;set;} public List<ProgressAttemptRecord> attempts{get;set;} public List<ProgressAuditEvent> auditEvents{get;set;}
        public ProgressDocument(){schemaVersion=1;goals=new List<ProgressGoalRecord>();attempts=new List<ProgressAttemptRecord>();auditEvents=new List<ProgressAuditEvent>();}
    }
    internal sealed class ProgressRequestView {
        public string requestId{get;set;} public string action{get;set;} public string displayName{get;set;} public long? craftCount{get;set;} public long? outputPerCraft{get;set;} public long? expectedOutput{get;set;} public int? processingRound{get;set;} public long preparedAt{get;set;} public long expiresAt{get;set;} public string terminalOutcome{get;set;} public long? quantity{get;set;} public ProgressConfirmation[] confirmations{get;set;}
    }
    internal sealed class ProgressGoalView {
        public string goalId{get;set;} public string sourcePlanId{get;set;} public string parentGoalId{get;set;} public string rootGoalId{get;set;} public string action{get;set;} public string displayName{get;set;} public long targetQuantity{get;set;} public string lifecycle{get;set;} public bool detached{get;set;}
        public long confirmedQuantity{get;set;} public long remainingQuantity{get;set;} public long excessQuantity{get;set;} public bool quantityUnconfirmed{get;set;} public bool quantitySatisfied{get;set;} public int registeredCount{get;set;} public ProgressRequestView[] requests{get;set;}
    }
    internal sealed class ProgressRecoveryCandidate {public string commitDigest{get;set;} public long revision{get;set;}}
    internal sealed class ProgressProjection {
        public int schemaVersion{get;set;} public long revision{get;set;} public string health{get;set;} public ProgressScope scope{get;set;} public bool capacityWarning{get;set;} public ProgressRecoveryCandidate[] recoveryCandidates{get;set;} public ProgressGoalView[] goals{get;set;}
        public ProgressProjection(){schemaVersion=1;recoveryCandidates=new ProgressRecoveryCandidate[0];goals=new ProgressGoalView[0];}
    }
    internal sealed class ProgressSnapshot {public int schemaVersion{get;set;} public string environment{get;set;} public string storeId{get;set;} public long revision{get;set;} public string health{get;set;} public string error{get;set;} public ProgressProjection view{get;set;} public ProgressSnapshot(){schemaVersion=1;}}
    internal sealed class ProgressCommitResult {
        public string status{get;set;} public string operationId{get;set;} public long revision{get;set;} public string error{get;set;} public ProgressProjection view{get;set;}
        // Never serialized to a browser. Store only publishes view after durable verification.
        [ScriptIgnore] internal ProgressDocument document{get;set;}
    }
    internal static class ProgressDomain {
        internal const int ByteLimit=4194304, GoalLimit=100, AttemptLimit=1000, EventLimit=4000, TerminalBytes=32768;
        internal const long SafeInteger=9007199254740991L, TimeLimit=8640000000000000L;
        internal static readonly string ZeroDigest=new string('0',64);
        internal static readonly UTF8Encoding Utf8=new UTF8Encoding(false,true);
        internal static JavaScriptSerializer Serializer(){return new JavaScriptSerializer{MaxJsonLength=ByteLimit,RecursionLimit=64};}
        internal static string Serialize(object value){return Serializer().Serialize(value);}
        internal static T Clone<T>(T value){return Serializer().Deserialize<T>(Serialize(value));}
        internal static void Require(bool value,string error){if(!value)throw new InvalidDataException(error);}
        internal static bool Text(string s,int max){return !String.IsNullOrWhiteSpace(s)&&s.Length<=max&&!s.Any(c=>c<32||c==127);}
        internal static bool IsId(string s){Guid id;return s!=null&&s.Length==36&&Guid.TryParseExact(s,"D",out id)&&id!=Guid.Empty&&id.ToString("D")==s;}
        internal static bool Digest(string s){return s!=null&&s.Length==64&&s.All(c=>c>='0'&&c<='9'||c>='a'&&c<='f');}
        internal static long Number(object value,long min,long max){
            if(value is double){var n=(double)value;Require(!Double.IsNaN(n)&&!Double.IsInfinity(n)&&Math.Truncate(n)==n&&n>=min&&n<=max,"invalid-number");return (long)n;}
            if(value is decimal){var n=(decimal)value;Require(n>=min&&n<=max&&Decimal.Truncate(n)==n,"invalid-number");return (long)n;}
            Require(value is int||value is long,"invalid-number");var whole=Convert.ToInt64(value);Require(whole>=min&&whole<=max,"invalid-number");return whole;
        }
        // Serializer decimal conversion can round tiny exponents to zero. This schema has
        // integer tokens only; reject fractions/exponents in the original bytes, before parsing.
        internal static void IntegerJsonTokens(string text){
            bool quoted=false,escaped=false;
            for(int i=0;i<text.Length;i++){
                var c=text[i];if(quoted){if(escaped)escaped=false;else if(c=='\\')escaped=true;else if(c=='"')quoted=false;continue;}
                if(c=='"'){quoted=true;continue;}
                if(c!='-'&&(c<'0'||c>'9'))continue;
                int start=i;if(c=='-'){i++;Require(i<text.Length,"invalid-json-number");}
                Require(text[i]>='0'&&text[i]<='9',"invalid-json-number");
                if(text[i]=='0')i++;else while(i<text.Length&&text[i]>='0'&&text[i]<='9')i++;
                Require(i-start<=17&&(i==text.Length||Char.IsWhiteSpace(text[i])||text[i]==','||text[i]==']'||text[i]=='}'),"invalid-json-number");i--;
            }
            Require(!quoted&&!escaped,"invalid-json-string");
        }
        static void OriginalNumbers(ProgressMutation m){
            if(m.replacement!=null)Number(m.replacement.targetQuantity,1,1000000);
            if(m.quantity!=null)Number(m.quantity,0,5000000);if(m.targetQuantity!=null)Number(m.targetQuantity,1,1000000);
            if(m.craftCount!=null)Number(m.craftCount,1,5);if(m.outputPerCraft!=null)Number(m.outputPerCraft,1,1000000);if(m.expectedOutput!=null)Number(m.expectedOutput,1,5000000);
            if(m.preparedAt!=null)Number(m.preparedAt,1,TimeLimit);if(m.expiresAt!=null)Number(m.expiresAt,1,TimeLimit);if(m.candidateRevision!=null)Number(m.candidateRevision,0,SafeInteger);
            if(m.confirmation!=null){Number(m.confirmation.quantity,0,5000000);Require(m.confirmation.revision>=0&&m.confirmation.revision<=SafeInteger,"invalid-number");}
            if(m.evidence!=null){if(m.evidence.craftCount!=null)Number(m.evidence.craftCount,1,5);if(m.evidence.outputPerCraft!=null)Number(m.evidence.outputPerCraft,1,1000000);if(m.evidence.expectedOutput!=null)Number(m.evidence.expectedOutput,1,5000000);}
        }
        internal static void Scope(ProgressScope s){Require(s!=null&&(s.environment=="development"||s.environment=="production")&&Text(s.accountId,100)&&Text(s.characterId,100),"invalid-scope");}
        internal static bool Same(ProgressScope a,ProgressScope b){return a!=null&&b!=null&&a.environment==b.environment&&a.accountId==b.accountId&&a.characterId==b.characterId;}
        internal static string Hash(string value){using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(Utf8.GetBytes(value))).Replace("-","").ToLowerInvariant();}
        static string CanonicalValue(object v){
            // v1 mutations lacked this optional member. Null adds no meaning and must
            // not change their historical event/document digests.
            var d=v as Dictionary<string,object>;if(d!=null)return "{"+String.Join(",",d.Keys.Where(k=>!(k=="replacement"&&d[k]==null&&d.ContainsKey("kind")&&d.ContainsKey("scope")&&d.ContainsKey("goalId"))).OrderBy(x=>x,StringComparer.Ordinal).Select(k=>Serialize(k)+":"+CanonicalValue(d[k])))+"}";
            var a=v as object[];if(a!=null)return "["+String.Join(",",a.Select(CanonicalValue))+"]";return Serialize(v);
        }
        internal static string Canonical(object value){return CanonicalValue(Serializer().DeserializeObject(Serialize(value)));}
        internal static ProgressDocument Empty(string environment){return new ProgressDocument{environment=environment,storeId=Guid.NewGuid().ToString("D"),previousCommitDigest=ZeroDigest,commitDigest=ZeroDigest};}
        internal static int Pending(ProgressDocument d){return d.attempts.Count(a=>a.evidence==null);}
        internal static bool CapacityWarning(ProgressDocument d){return d.goals.Count>=80||d.attempts.Count>=800||d.auditEvents.Count+Pending(d)>=3200||(long)Utf8.GetByteCount(Serialize(d))+(long)Pending(d)*TerminalBytes>=ByteLimit*8L/10;}
        internal static void Capacity(ProgressDocument d){Require(d.goals.Count<=GoalLimit&&d.attempts.Count<=AttemptLimit&&d.auditEvents.Count+Pending(d)<=EventLimit&&(long)Utf8.GetByteCount(Serialize(d))+(long)Pending(d)*TerminalBytes<=ByteLimit,"capacity");}
        internal static ProgressCommitResult Commit(ProgressDocument current,ProgressMutation mutation,long expectedRevision,Guid operationId,long now,long? recoveryFloor=null){
            var op=operationId.ToString("D");
            try{
                Require(operationId!=Guid.Empty&&expectedRevision>=0&&expectedRevision<=SafeInteger,"invalid-operation");Scope(mutation==null?null:mutation.scope);Require(mutation.scope.environment==current.environment,"foreign-scope");
                OriginalNumbers(mutation); // Must precede canonicalization and JSON Clone.
                var meaning=Hash(Canonical(mutation));var old=current.auditEvents.SingleOrDefault(x=>x.operationId==op);
                if(old!=null)return Result(old.meaningDigest==meaning?"already-applied":"conflict",op,current,mutation.scope,old.meaningDigest==meaning?null:"operation-meaning");
                if(recoveryFloor.HasValue?mutation.kind!="Recover"||expectedRevision!=recoveryFloor||expectedRevision<current.revision:expectedRevision!=current.revision)return Result("conflict",op,current,mutation.scope,"revision");
                Require(!current.reviewRequired||mutation.kind=="Recover","review-required");Require(current.revision<SafeInteger&&now>=1&&now<=TimeLimit,"invalid-revision-time");
                var d=Clone(current);var m=Clone(mutation);var e=new ProgressAuditEvent{eventId=op,operationId=op,meaningDigest=meaning,revision=(recoveryFloor??d.revision)+1,recordedAt=now,previousDigest=d.commitDigest,mutation=m};
                Apply(d,e,true);e.digest=Hash(Canonical(new {e.eventId,e.operationId,e.meaningDigest,e.revision,e.recordedAt,e.previousDigest,e.mutation}));d.auditEvents.Add(e);d.revision=e.revision;d.previousCommitDigest=e.previousDigest;d.commitDigest=e.digest;Capacity(d);
                var result=Result("committed",op,d,m.scope,null);result.document=d;return result;
            }catch(Exception e){if(!(e is InvalidDataException||e is ArgumentException||e is InvalidOperationException||e is OverflowException))throw;return Result("rejected",op,current,mutation==null?null:mutation.scope,e is InvalidDataException?e.Message:"invalid-mutation");}
        }
        internal static ProgressCommitResult Result(string status,string op,ProgressDocument d,ProgressScope scope,string error){
            ProgressProjection view=null;try{Scope(scope);view=Project(d,scope,d.reviewRequired?"review-required":"ok");}catch(InvalidDataException){}
            return new ProgressCommitResult{status=status,operationId=op,revision=d.revision,error=error,view=view};
        }
        static void Shape(ProgressMutation m,string[] extras){
            var allowed=new HashSet<string>(new[]{"kind","scope","goalId"}.Concat(extras));
            foreach(var p in typeof(ProgressMutation).GetProperties())Require(allowed.Contains(p.Name)||p.GetValue(m,null)==null,"unexpected-mutation-field");
        }
        static ProgressGoalRecord Goal(ProgressDocument d,ProgressMutation m){var g=d.goals.SingleOrDefault(x=>x.goalId==m.goalId);Require(g!=null&&Same(g.scope,m.scope),"foreign-goal");return g;}
        static ProgressAttemptRecord Attempt(ProgressDocument d,ProgressMutation m){var a=d.attempts.SingleOrDefault(x=>x.requestId==m.requestId);Require(a!=null&&a.goalId==m.goalId&&Same(a.scope,m.scope),"foreign-request");return a;}
        static bool Action(string action){return action=="crafting"||action=="altering"||action=="gathering";}
        static bool AttachedRoot(ProgressGoalRecord g){return g.parentGoalId==null&&!g.detached&&(g.lifecycle=="active"||g.lifecycle=="paused");}
        static void UniqueRoot(ProgressDocument d,ProgressScope scope,string plan,string except){Require(!d.goals.Any(x=>x.goalId!=except&&Same(x.scope,scope)&&x.sourcePlanId==plan&&AttachedRoot(x)),"duplicate-plan-root");}
        static void ActiveLineage(ProgressDocument d,ProgressGoalRecord goal){
            var seen=new HashSet<string>();var current=goal;
            while(true){Require(current!=null&&Same(current.scope,goal.scope)&&seen.Add(current.goalId)&&current.lifecycle=="active"&&!current.detached,"inactive-goal-lineage");if(current.parentGoalId==null){Require(current.goalId==goal.rootGoalId,"foreign-goal-root");return;}current=d.goals.SingleOrDefault(x=>x.goalId==current.parentGoalId);}
        }
        static void Apply(ProgressDocument d,ProgressAuditEvent e,bool live=false){
            var m=e.mutation;Scope(m.scope);Require(m.scope.environment==d.environment&&IsId(m.goalId),"foreign-scope");
            if(m.kind=="CreateGoal"){
                Shape(m,new[]{"sourcePlanId","parentGoalId","action","displayName","targetQuantity"});Require(!d.goals.Any(x=>x.goalId==m.goalId)&&Text(m.sourcePlanId,100)&&Action(m.action)&&Text(m.displayName,160),"invalid-goal");
                var parent=m.parentGoalId==null?null:d.goals.SingleOrDefault(x=>x.goalId==m.parentGoalId&&Same(x.scope,m.scope));Require(m.parentGoalId==null||parent!=null,"invalid-parent");
                if(live&&parent==null)UniqueRoot(d,m.scope,m.sourcePlanId,null);
                if(live&&parent!=null)ActiveLineage(d,parent);
                d.goals.Add(new ProgressGoalRecord{scope=Clone(m.scope),goalId=m.goalId,sourcePlanId=m.sourcePlanId,parentGoalId=m.parentGoalId,rootGoalId=parent==null?m.goalId:parent.rootGoalId,action=m.action,displayName=m.displayName,targetQuantity=Number(m.targetQuantity,1,1000000),lifecycle="active"});return;
            }
            if(m.kind=="Recover"){
                Shape(m,new[]{"candidateDigest","candidateRevision"});Require(m.candidateDigest==d.commitDigest&&Number(m.candidateRevision,0,SafeInteger)==d.revision,"invalid-recovery");d.reviewRequired=true;return;
            }
            var g=Goal(d,m);
            if(m.kind=="ConfirmManualWoodReceipt"||m.kind=="CorrectManualWoodReceipt"){
                Shape(m,new[]{"requestId","sourcePlanId","action","displayName","targetQuantity","quantity","source","supersedesEventId","reason"});
                Require(g.action=="altering"&&g.displayName=="목재"&&g.targetQuantity==100&&g.parentGoalId==null&&g.rootGoalId==g.goalId&&g.lifecycle=="active"&&!g.detached,"manual-wood-goal");
                Require(m.action==g.action&&m.displayName==g.displayName&&m.sourcePlanId==g.sourcePlanId&&Number(m.targetQuantity,1,1000000)==100&&IsId(m.requestId)&&m.source=="user-confirmed","manual-wood-identity");
                // In this domain requestId is a LOCAL receipt record key, never a game request.
                Require(!d.attempts.Any(row=>row.requestId==m.requestId),"manual-receipt-is-not-game-request");
                Require(!d.attempts.Any(row=>row.evidence==null||row.action=="crafting"&&row.evidence.outcome=="completed"&&row.confirmations.Count==0),"manual-unresolved");
                var prior=d.auditEvents.Where(x=>IsManualWood(x.mutation)&&x.mutation.requestId==m.requestId).ToArray();Number(m.quantity,0,5000000);
                if(m.kind=="CorrectManualWoodReceipt")Require(prior.Length>0&&prior.All(x=>x.mutation.goalId==g.goalId&&Same(x.mutation.scope,g.scope))&&m.supersedesEventId==prior.Last().eventId&&Text(m.reason,400),"manual-stale-correction");
                else Require(prior.Length==0&&m.supersedesEventId==null&&m.reason==null,"manual-duplicate-receipt");
                return; // No attempt, terminal, C delivery or persisted legacy field is created.
            }
            if(m.kind=="ReplaceEmptyGoal"){
                Shape(m,new[]{"sourcePlanId","action","displayName","targetQuantity","replacement"});var replacement=m.replacement;
                Require(replacement!=null&&IsId(replacement.goalId)&&!d.goals.Any(x=>x.goalId==replacement.goalId),"invalid-replacement");
                Require(g.parentGoalId==null&&g.rootGoalId==g.goalId&&g.lifecycle=="active"&&!g.detached&&g.action=="crafting"&&m.action==g.action&&m.sourcePlanId==g.sourcePlanId&&m.displayName==g.displayName&&Number(m.targetQuantity,1,1000000)==g.targetQuantity,"replacement-old-goal-mismatch");
                Require(!d.attempts.Any(attempt=>attempt.goalId==g.goalId)&&!d.goals.Any(x=>x.goalId!=g.goalId&&x.rootGoalId==g.goalId)&&!d.attempts.Any(attempt=>attempt.evidence==null||attempt.action=="crafting"&&attempt.evidence.outcome=="completed"&&attempt.confirmations.Count==0),"replacement-history-or-unresolved");
                UniqueRoot(d,m.scope,m.sourcePlanId,g.goalId);long target=Number(replacement.targetQuantity,1,1000000);Require(target!=g.targetQuantity,"replacement-quantity-unchanged");
                g.lifecycle="cancelled";g.detached=true;
                d.goals.Add(new ProgressGoalRecord{scope=Clone(g.scope),goalId=replacement.goalId,sourcePlanId=g.sourcePlanId,parentGoalId=null,rootGoalId=replacement.goalId,action=g.action,displayName=g.displayName,targetQuantity=target,lifecycle="active"});return;
            }
            if(m.kind=="SetLifecycle"){Shape(m,new[]{"lifecycle"});Require(new[]{"active","paused","cancelled","archived"}.Contains(m.lifecycle),"invalid-lifecycle");Require(!(g.lifecycle=="cancelled"||g.lifecycle=="archived")||m.lifecycle==g.lifecycle||m.lifecycle=="archived","terminal-goal");if(live&&g.parentGoalId==null&&(m.lifecycle=="active"||m.lifecycle=="paused")){Require(!g.detached,"detached-goal");UniqueRoot(d,g.scope,g.sourcePlanId,g.goalId);}g.lifecycle=m.lifecycle;return;}
            if(m.kind=="DetachPlan"){Shape(m,new[]{"sourcePlanId"});Require(m.sourcePlanId==g.sourcePlanId&&(g.lifecycle=="cancelled"||g.lifecycle=="archived"),"deactivate-before-detach");g.detached=true;return;}
            if(m.kind=="BindPreparedRequest"){
                Require(!d.auditEvents.Any(row=>IsManualWood(row.mutation)&&row.mutation.requestId==m.requestId),"game-request-is-not-manual-receipt");
                Shape(m,new[]{"requestId","action","displayName","craftCount","outputPerCraft","expectedOutput","preparedAt","expiresAt"});Require(g.lifecycle=="active"&&!g.detached&&IsId(m.requestId)&&!d.attempts.Any(x=>x.requestId==m.requestId)&&m.action==g.action&&m.displayName==g.displayName,"invalid-binding");
                Require(!d.attempts.Any(x=>x.goalId==g.goalId&&(x.evidence==null||x.action=="crafting"&&x.evidence.outcome=="completed"&&x.confirmations.Count==0)),"quantity-unconfirmed");
                if(live)ActiveLineage(d,g);
                long? count=null,output=null,expected=null;
                if(m.action=="crafting"){count=Number(m.craftCount,1,5);output=Number(m.outputPerCraft,1,1000000);expected=Number(m.expectedOutput,1,5000000);Require(expected==count*output,"invalid-crafting");}else Require(m.craftCount==null&&m.outputPerCraft==null&&m.expectedOutput==null,"invalid-crafting");
                var prepared=Number(m.preparedAt,1,TimeLimit);var expires=Number(m.expiresAt,prepared,TimeLimit);
                d.attempts.Add(new ProgressAttemptRecord{goalId=g.goalId,scope=Clone(m.scope),requestId=m.requestId,action=m.action,displayName=m.displayName,craftCount=count,outputPerCraft=output,expectedOutput=expected,processingRound=m.action=="altering"?(int?)(d.attempts.Count(x=>x.goalId==g.goalId&&x.action=="altering")+1):null,preparedAt=prepared,expiresAt=expires});return;
            }
            Require(IsId(m.requestId),"invalid-request");var a=Attempt(d,m);
            if(m.kind=="ObserveNativeTerminal"){
                Shape(m,new[]{"requestId","evidence"});var v=m.evidence;
                Require(a.evidence==null&&v!=null&&Same(v.scope,a.scope)&&v.goalId==a.goalId&&v.requestId==a.requestId&&v.action==a.action&&v.displayName==a.displayName,"invalid-evidence");
                Require(v.startedAt>=1&&v.startedAt<=TimeLimit&&v.observedAt>=1&&v.observedAt<=TimeLimit&&v.verifierVersion==1&&Digest(v.rowDigest),"invalid-evidence");
                Require(new[]{"completed","registered","rejected","stopped"}.Contains(v.outcome)&&(v.outcome!="registered"||a.action=="altering")&&(v.outcome!="completed"||a.action!="altering"),"invalid-outcome");
                if(a.action=="crafting")Require(Number(v.craftCount,1,5)==a.craftCount&&Number(v.outputPerCraft,1,1000000)==a.outputPerCraft&&Number(v.expectedOutput,1,5000000)==a.expectedOutput,"evidence-crafting");else Require(v.craftCount==null&&v.outputPerCraft==null&&v.expectedOutput==null,"evidence-crafting");
                Require(Utf8.GetByteCount(Serialize(e))+4096<=TerminalBytes,"terminal-reservation");a.evidence=Clone(v);return;
            }
            Require(m.kind=="ConfirmQuantity"||m.kind=="CorrectQuantity","invalid-kind");Shape(m,new[]{"requestId","quantity","source","supersedesEventId","reason","confirmation"});
            Require(a.action=="crafting"&&a.evidence!=null&&a.evidence.outcome=="completed"&&m.source=="user-confirmed","quantity-evidence");var quantity=Number(m.quantity,0,5000000);
            bool correction=m.kind=="CorrectQuantity";
            if(correction)Require(a.confirmations.Count>0&&m.supersedesEventId==a.confirmations.Last().eventId&&Text(m.reason,400),"stale-correction");else Require(a.confirmations.Count==0&&m.supersedesEventId==null&&m.reason==null,"duplicate-confirmation");
            if(quantity==0||quantity>a.expectedOutput||correction){var ack=m.confirmation;Require(ack!=null&&ack.requestId==a.requestId&&Number(ack.quantity,0,5000000)==quantity&&ack.revision==e.revision-1&&(quantity!=0||ack.zero)&&(quantity<=a.expectedOutput||ack.extra)&&(!correction||ack.correction),"quantity-acknowledgement");}
            a.confirmations.Add(new ProgressConfirmation{eventId=e.eventId,revision=e.revision,quantity=quantity,source="user-confirmed",confirmedAt=e.recordedAt,supersedesEventId=m.supersedesEventId,reason=m.reason});
        }
        internal static ProgressProjection Project(ProgressDocument d,ProgressScope scope,string health){
            Scope(scope);var projection=new ProgressProjection{scope=Clone(scope),revision=d.revision,health=health,capacityWarning=CapacityWarning(d)};
            projection.goals=d.goals.Where(g=>Same(g.scope,scope)).Select(g=>{
                var requests=d.attempts.Where(a=>a.goalId==g.goalId).Select(a=>new ProgressRequestView{requestId=a.requestId,action=a.action,displayName=a.displayName,craftCount=a.craftCount,outputPerCraft=a.outputPerCraft,expectedOutput=a.expectedOutput,processingRound=a.processingRound,preparedAt=a.preparedAt,expiresAt=a.expiresAt,terminalOutcome=a.evidence==null?null:a.evidence.outcome,quantity=a.confirmations.Count==0?(long?)null:a.confirmations.Last().quantity,confirmations=a.confirmations.Select(Clone).ToArray()}).ToArray();
                long confirmed=requests.Sum(r=>r.quantity??0);bool unknown=requests.Any(r=>r.terminalOutcome==null||r.action=="crafting"&&r.terminalOutcome=="completed"&&r.quantity==null);
                return new ProgressGoalView{goalId=g.goalId,sourcePlanId=g.sourcePlanId,parentGoalId=g.parentGoalId,rootGoalId=g.rootGoalId,action=g.action,displayName=g.displayName,targetQuantity=g.targetQuantity,lifecycle=g.lifecycle,detached=g.detached,confirmedQuantity=confirmed,remainingQuantity=Math.Max(0,g.targetQuantity-confirmed),excessQuantity=Math.Max(0,confirmed-g.targetQuantity),quantityUnconfirmed=unknown,quantitySatisfied=health=="ok"&&!unknown&&confirmed>=g.targetQuantity,registeredCount=requests.Count(r=>r.action=="altering"&&r.terminalOutcome=="registered"),requests=requests};
            }).ToArray();return projection;
        }
        static bool IsManualWood(ProgressMutation m){return m.kind=="ConfirmManualWoodReceipt"||m.kind=="CorrectManualWoodReceipt";}
        internal static ManualWoodView ManualWood(ProgressDocument d,ProgressScope scope,string goal,string health){
            Scope(scope);var g=d.goals.SingleOrDefault(x=>x.goalId==goal&&Same(x.scope,scope));Require(g!=null&&g.action=="altering"&&g.displayName=="목재"&&g.targetQuantity==100,"manual-wood-goal");
            var receipts=d.auditEvents.Where(e=>IsManualWood(e.mutation)&&e.mutation.goalId==goal&&Same(e.mutation.scope,scope)).GroupBy(e=>e.mutation.requestId).Select(group=>new ManualWoodReceiptView{receiptId=group.Key,confirmations=group.Select(e=>new ProgressConfirmation{eventId=e.eventId,revision=e.revision,quantity=Number(e.mutation.quantity,0,5000000),source="user-confirmed",confirmedAt=e.recordedAt,supersedesEventId=e.mutation.supersedesEventId,reason=e.mutation.reason}).ToArray()}).ToArray();
            long? total=receipts.Length==0?(long?)null:receipts.Sum(r=>r.confirmations.Last().quantity);
            return new ManualWoodView{scope=Clone(scope),goalId=g.goalId,sourcePlanId=g.sourcePlanId,action=g.action,displayName=g.displayName,targetQuantity=100,lifecycle=g.lifecycle,health=health,revision=d.revision,confirmedQuantity=total,remainingQuantity=total.HasValue?(long?)Math.Max(0,100-total.Value):null,receipts=receipts};
        }
        internal static void Validate(ProgressDocument d,string environment){
            Require(d!=null&&d.schemaVersion==1&&d.environment==environment&&IsId(d.storeId)&&d.revision>=0&&d.revision<=SafeInteger&&d.goals!=null&&d.attempts!=null&&d.auditEvents!=null&&d.auditEvents.Count<=EventLimit,"invalid-document");
            var replay=Empty(environment);replay.storeId=d.storeId;var operations=new HashSet<string>();
            foreach(var e in d.auditEvents){Require(e!=null&&e.mutation!=null&&IsId(e.eventId)&&e.operationId==e.eventId&&operations.Add(e.operationId)&&(e.mutation.kind=="Recover"?e.revision>replay.revision:e.revision==replay.revision+1)&&e.revision<=SafeInteger&&e.recordedAt>=1&&e.recordedAt<=TimeLimit&&e.previousDigest==replay.commitDigest&&e.meaningDigest==Hash(Canonical(e.mutation)),"invalid-event-chain");Require(e.digest==Hash(Canonical(new{e.eventId,e.operationId,e.meaningDigest,e.revision,e.recordedAt,e.previousDigest,e.mutation})),"invalid-event-digest");Require(!replay.reviewRequired||e.mutation.kind=="Recover","recovery-history");Apply(replay,e);replay.auditEvents.Add(e);replay.revision=e.revision;replay.previousCommitDigest=e.previousDigest;replay.commitDigest=e.digest;}
            Require(Canonical(d)==Canonical(replay),"projection-event-mismatch");Capacity(d);
        }
    }
}
