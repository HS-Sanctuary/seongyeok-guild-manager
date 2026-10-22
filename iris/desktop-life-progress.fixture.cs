using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Web.Script.Serialization;
using System.Security.Cryptography;
using System.Text;
using System.Diagnostics;
using System.Threading;

namespace IrisDesktop {
    // Synthetic-only fixture. No existing journal, bridge, CLI or server reference.
    public static class ProgressFixture {
        static readonly JavaScriptSerializer Json=new JavaScriptSerializer {MaxJsonLength=4194304};
        static ProgressScope Scope(string c="synthetic-character") {return new ProgressScope {environment="development",accountId="synthetic-account",characterId=c};}
        static void Check(bool value,string message) {if(!value)throw new Exception(message);}
        static string Id(){return Guid.NewGuid().ToString("D");}
        sealed class DomainHarness {
            internal ProgressDocument doc=ProgressDomain.Empty("development");
            internal ProgressScope scope=Scope();
            internal ProgressCommitResult Send(ProgressMutation m,string op=null,long? rev=null) {var r=ProgressDomain.Commit(doc,m,rev??doc.revision,Guid.Parse(op??Id()),1000);if(r.document!=null)doc=r.document;return r;}
            internal string Goal(int target=4,string name="합성 검",string action="crafting",string parent=null) {var id=Id(); Check(Send(new ProgressMutation {kind="CreateGoal",scope=scope,goalId=id,sourcePlanId=Id(),displayName=name,action=action,targetQuantity=target,parentGoalId=parent}).status=="committed","create goal");return id;}
            internal string Request(string g,int expected=4,string action="crafting",bool terminal=true) {var id=Id();var b=new ProgressMutation {kind="BindPreparedRequest",scope=scope,goalId=g,requestId=id,action=action,displayName=doc.goals.Single(x=>x.goalId==g).displayName,craftCount=action=="crafting"?(object)expected:null,outputPerCraft=action=="crafting"?(object)1:null,expectedOutput=action=="crafting"?(object)expected:null,preparedAt=500,expiresAt=1500};Check(Send(b).status=="committed","bind"); if(terminal)Terminal(g,id,action=="crafting"?"completed":"registered"); return id;}
            internal void Terminal(string g,string r,string outcome) {var a=doc.attempts.Single(x=>x.requestId==r);Check(Send(new ProgressMutation {kind="ObserveNativeTerminal",scope=scope,goalId=g,requestId=r,evidence=new NativeTerminalEvidence {scope=scope,goalId=g,requestId=r,action=a.action,displayName=a.displayName,craftCount=a.craftCount,outputPerCraft=a.outputPerCraft,expectedOutput=a.expectedOutput,outcome=outcome,startedAt=600,observedAt=1000,verifierVersion=1,rowDigest=new string('a',64)}}).status=="committed","terminal");}
            internal ProgressMutation Confirm(string g,string r,object quantity,string supersedes=null) {return new ProgressMutation {kind=supersedes==null?"ConfirmQuantity":"CorrectQuantity",scope=scope,goalId=g,requestId=r,quantity=quantity,source="user-confirmed",supersedesEventId=supersedes,reason=supersedes==null?null:"오입력 정정",confirmation=new QuantityAcknowledgement {requestId=r,quantity=quantity,revision=doc.revision,zero=true,extra=true,correction=true}};}
            internal ProgressGoalView View(string g) {return ProgressDomain.Project(doc,scope,"ok").goals.Single(x=>x.goalId==g);}
        }
        public static string OnlyCase;
        static void Case(string id,Action run,List<string> failed) {if(!String.IsNullOrEmpty(OnlyCase)&&id!=OnlyCase)return;try{run();Console.WriteLine("PASS "+id);}catch(Exception e){failed.Add(id);Console.WriteLine("FAIL "+id+": "+e.GetType().FullName+": "+e.Message+(e.InnerException==null?"":" / "+e.InnerException.GetType().FullName));}}
        public static void Run(string root,string mode) {
            var failed=new List<string>();
            if(mode=="domain"||mode=="all") {
                Case("Q01",()=>{var h=new DomainHarness();var g=h.Goal();h.Request(g);var v=h.View(g);Check(v.confirmedQuantity==0&&v.quantityUnconfirmed&&!v.quantitySatisfied&&v.remainingQuantity==4,"expected four must remain unconfirmed");},failed);
                Case("Q02",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);Check(h.Send(h.Confirm(g,r,3)).status=="committed","confirm");Check(h.View(g).remainingQuantity==1,"three of four leaves one");},failed);
                Case("Q03",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);Check(h.View(g).requests[0].quantity==null,"null first");h.Send(h.Confirm(g,r,0));var v=h.View(g);Check(v.requests[0].quantity==0&&!v.quantityUnconfirmed,"explicit zero");},failed);
                Case("Q04",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);var rev=h.doc.revision;Check(h.Send(h.Confirm(g,r,null)).status=="rejected"&&h.doc.revision==rev,"null not zero event");},failed);
                Case("Q05",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);var m=h.Confirm(g,r,6);m.confirmation=null;Check(h.Send(m).status=="rejected","extra must be acknowledged");m.confirmation=h.Confirm(g,r,6).confirmation;h.Send(m);Check(h.View(g).excessQuantity==2,"extra quantity not clamped");},failed);
                Case("Q06",()=>{
                    foreach(var n in new object[]{-1,1.5,1.0000000000000002,1e-50,-1e-50,Double.Epsilon,Double.NaN,Double.PositiveInfinity,5000001,"3"}){var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);var rev=h.doc.revision;Check(h.Send(h.Confirm(g,r,n)).status=="rejected"&&h.doc.revision==rev,"unsafe number accepted: "+n);}
                    foreach(var n in new[]{1e-50,-1e-50,Double.Epsilon}){var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);var m=h.Confirm(g,r,0);m.confirmation.quantity=n;Check(h.Send(m).status=="rejected","tiny acknowledgement must not become zero");}
                },failed);
                Case("Q07",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);var m=h.Confirm(g,r,3);var op=Id();var rev=h.doc.revision;h.Send(m,op);var ev=h.View(g).requests[0].confirmations[0].eventId;h.Send(h.Confirm(g,r,2,ev));var count=h.doc.auditEvents.Count;var retry=h.Send(m,op,rev);Check(retry.status=="already-applied"&&retry.view.goals[0].confirmedQuantity==2&&h.doc.auditEvents.Count==count,"duplicate ACK must return latest");},failed);
                Case("Q08",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);var op=Id();h.Send(h.Confirm(g,r,3),op);Check(h.Send(h.Confirm(g,r,2),op).status=="conflict"&&h.View(g).confirmedQuantity==3,"same operation different meaning");},failed);
                Case("Q09",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);h.Send(h.Confirm(g,r,3));Check(h.Send(h.Confirm(g,r,2)).status=="rejected"&&h.View(g).confirmedQuantity==3,"second initial confirmation");},failed);
                Case("Q10",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);h.Send(h.Confirm(g,r,3));var ev=h.View(g).requests[0].confirmations.Last().eventId;h.Send(h.Confirm(g,r,2,ev));ev=h.View(g).requests[0].confirmations.Last().eventId;h.Send(h.Confirm(g,r,5,ev));Check(h.View(g).confirmedQuantity==5&&h.View(g).requests[0].confirmations.Select(x=>x.quantity).SequenceEqual(new long[]{3,2,5}),"replace not sum");},failed);
                Case("Q11",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);h.Send(h.Confirm(g,r,3));var ev=h.View(g).requests[0].confirmations.Last().eventId;h.Send(h.Confirm(g,r,2,ev));Check(h.Send(h.Confirm(g,r,1,ev)).status=="rejected"&&h.View(g).confirmedQuantity==2,"stale correction");},failed);
                Case("Q12",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);h.Send(h.Confirm(g,r,4));Check(h.View(g).quantitySatisfied,"four satisfied");h.Send(h.Confirm(g,r,3,h.View(g).requests[0].confirmations.Last().eventId));Check(!h.View(g).quantitySatisfied&&h.View(g).remainingQuantity==1,"correction reopens shortage");},failed);
                Case("Q14",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);var m=h.Confirm(g,r,3);m.source="official-verified";Check(h.Send(m).status=="rejected","source privilege");},failed);
                Case("Q15",()=>{var h=new DomainHarness();var parent=h.Goal();var child=h.Goal(3,"선행 합성품","crafting",parent);var r=h.Request(child,3);h.Send(h.Confirm(child,r,3));Check(h.View(parent).confirmedQuantity==0&&h.View(child).confirmedQuantity==3&&h.View(child).rootGoalId==parent,"child must not credit parent");},failed);
                Case("I01",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);foreach(var s in new[]{Scope("other-character"),new ProgressScope{environment="production",accountId="synthetic-account",characterId="synthetic-character"},new ProgressScope{environment="development",accountId="other-account",characterId="synthetic-character"}}){var m=h.Confirm(g,r,3);m.scope=s;Check(h.Send(m).status=="rejected","foreign confirmation");Check(ProgressDomain.Project(h.doc,s,"ok").goals.Length==0,"scope exposure");}},failed);
                Case("I02",()=>{var h=new DomainHarness();var a=h.Goal();var b=h.Goal();var r=h.Request(a);h.Send(h.Confirm(a,r,3));Check(h.View(b).confirmedQuantity==0&&h.View(a).sourcePlanId!=h.View(b).sourcePlanId,"same name distinct goal");},failed);
                Case("I04",()=>{var h=new DomainHarness();var old=h.Goal();var r=h.Request(old,4,"crafting",false);var fresh=h.Goal(7,"새 합성품");h.Terminal(old,r,"completed");h.Send(h.Confirm(old,r,3));Check(h.View(old).confirmedQuantity==3&&h.View(fresh).confirmedQuantity==0,"old response must not transfer");},failed);
                Case("I05",()=>{var h=new DomainHarness();var a=h.Goal();var r=h.Request(a);var b=h.Goal();var binding=new ProgressMutation{kind="BindPreparedRequest",scope=h.scope,goalId=b,requestId=r,action="crafting",displayName="합성 검",craftCount=4,outputPerCraft=1,expectedOutput=4,preparedAt=500,expiresAt=1500};Check(h.Send(binding).status=="rejected","request reuse");},failed);
                Case("I06",()=>{var h=new DomainHarness();var g=h.Goal(4,"합성 목재","altering");var a=h.Request(g,4,"altering",false);h.Terminal(g,a,"stopped");var b=h.Request(g,4,"altering");var v=h.View(g);Check(v.requests[0].processingRound==1&&v.requests[1].processingRound==2&&v.registeredCount==1&&v.confirmedQuantity==0,"round is not slots or output");},failed);
                Case("I07",()=>{var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);var rev=h.doc.revision;var first=ProgressDomain.Commit(h.doc,h.Confirm(g,r,3),rev,Guid.NewGuid(),2000);h.doc=first.document;var second=ProgressDomain.Commit(h.doc,h.Confirm(g,r,2),rev,Guid.NewGuid(),100);Check(second.status=="conflict"&&h.View(g).confirmedQuantity==3,"CAS beats time ordering");},failed);
            }
            if(mode=="storage"||mode=="all") Storage(root,failed);
            if(failed.Count>0)throw new Exception("Failed: "+String.Join(",",failed));
        }
        static readonly byte[] Entropy=Encoding.UTF8.GetBytes("SANCTUM:IRIS:ErgonProgress:v1:development");
        static string NewRoot(string root) {var p=Path.Combine(root,Guid.NewGuid().ToString("N"));Directory.CreateDirectory(p);return p;}
        static byte[] Raw(string file) {return File.ReadAllBytes(file);}
        static bool Equal(byte[] a,byte[] b){return a.SequenceEqual(b);}
        static void Seed(string root,ProgressDocument d) {var file=Path.Combine(root,"development","ergon-progress-v1.dpapi");Directory.CreateDirectory(Path.GetDirectoryName(file));File.WriteAllBytes(file,ProtectedData.Protect(Encoding.UTF8.GetBytes(ProgressDomain.Serialize(d)),Entropy,DataProtectionScope.CurrentUser));}
        static DomainHarness Baseline(){var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);h.Send(h.Confirm(g,r,3));return h;}
        static ProgressMutation Pause(DomainHarness h){return new ProgressMutation {kind="SetLifecycle",scope=h.scope,goalId=h.doc.goals[0].goalId,lifecycle="paused"};}
        sealed class FaultIO:IProgressFileIO {
            internal string fault;internal bool published;internal string diagnostic;readonly IProgressFileIO real=new ProgressFileIO();
            public byte[] ReadCipher(string path,int max){if(fault=="verify"&&published&&path.EndsWith(".dpapi"))throw new IOException("injected read verification");return real.ReadCipher(path,max);}
            public void WriteNewAndFlush(string path,byte[] bytes){if(fault=="write")throw new IOException("injected disk permission/space");if(fault=="partial"||fault=="terminate-partial"){using(var f=new FileStream(path,FileMode.CreateNew)){f.Write(bytes,0,Math.Min(17,bytes.Length));f.Flush(true);if(fault=="terminate-partial")Environment.Exit(23);}throw new IOException("injected interruption");}real.WriteNewAndFlush(path,bytes);}
            public void ReplaceWithBackup(string temp,string current,string backup){if(fault=="terminate-before-publish")Environment.Exit(24);if(fault=="replace"||fault=="before-publish")throw new IOException("injected replace");try{real.ReplaceWithBackup(temp,current,backup);published=true;}catch(Exception e){diagnostic=e.GetType().Name+":"+e.HResult+":"+e.Message;throw;}}
            public void MoveNew(string temp,string current){if(fault=="move")throw new IOException("injected move");real.MoveNew(temp,current);published=true;}
            public IDisposable AcquireExclusiveLock(string path){return real.AcquireExclusiveLock(path);}
        }
        static void Storage(string root,List<string> failed) {
            Case("S01",()=>{
                foreach(var bad in new[]{"C:relative-progress","\\relative-progress"}){bool rejected=false;try{new DesktopErgonProgressStore(bad,"development");}catch(InvalidDataException){rejected=true;}Check(rejected,"fully qualified root required");}
                var h=Baseline();var p=NewRoot(root);var untouched=new DesktopErgonProgressStore(p,"development");Check(!Directory.Exists(Path.GetDirectoryName(untouched.FilePath)),"constructor must not create/read a store");
                Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development",new FaultIO{fault="write"});var before=Raw(store.FilePath);var m=Pause(h);var input=ProgressDomain.Serialize(m);var ack=store.Commit(m,h.doc.revision,Guid.NewGuid());Check(ack.status=="unavailable","S01 injected write must not ACK: "+ack.status);
                Check(Equal(before,Raw(store.FilePath)),"S01 current ciphertext bytes changed after failed write");
                var fresh=new DesktopErgonProgressStore(p,"development").Load(h.scope);Check(fresh.revision==h.doc.revision,"S01 fresh revision expected="+h.doc.revision+" actual="+fresh.revision+" health="+fresh.health+" error="+fresh.error);
                Check(fresh.health=="ok","S01 fresh health="+fresh.health+" error="+fresh.error);
                Check(fresh.view.goals.Length==1&&fresh.view.goals[0].confirmedQuantity==3,"S01 last confirmed quantity not preserved");
                Check(ProgressDomain.Serialize(m)==input,"S01 mutation input changed after failed write");
                Console.WriteLine("DETAIL S01: ciphertext unchanged; revision="+fresh.revision+"; health="+fresh.health+"; confirmed=3; mutation unchanged");
            },failed);
            Case("S02",()=>{var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");var before=Raw(store.FilePath);Crash(p,h.doc.goals[0].goalId,"partial",23);var fresh=new DesktopErgonProgressStore(p,"development").Load(h.scope);Check(Equal(before,Raw(store.FilePath))&&fresh.revision==h.doc.revision&&fresh.view.goals[0].confirmedQuantity==3&&Directory.GetFiles(Path.GetDirectoryName(store.FilePath),"*.tmp").Length>0,"partial process termination cannot promote");},failed);
            Case("S03",()=>{var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");var before=Raw(store.FilePath);Crash(p,h.doc.goals[0].goalId,"flushed",24);var fresh=new DesktopErgonProgressStore(p,"development").Load(h.scope);Check(Equal(before,Raw(store.FilePath))&&fresh.revision==h.doc.revision&&fresh.view.goals[0].lifecycle=="active"&&fresh.health=="review-required","flushed candidate cannot become current after process termination");},failed);
            Case("S04",()=>{foreach(var fault in new[]{"replace","move"}){var h=Baseline();var p=NewRoot(root);if(fault=="replace")Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development",new FaultIO{fault=fault});byte[] before=File.Exists(store.FilePath)?Raw(store.FilePath):null;var m=fault=="move"?h.doc.auditEvents[0].mutation:Pause(h);var rev=fault=="move"?0:h.doc.revision;Check(store.Commit(m,rev,Guid.NewGuid()).status=="unavailable","publish failure ACK");Check(before==null?!File.Exists(store.FilePath):Equal(before,Raw(store.FilePath)),"no overwrite fallback");Check(new DesktopErgonProgressStore(p,"development").Load(h.scope).health!="ok"||before!=null,"first failed move is not fresh success");}},failed);
            Case("S05",()=>{
                var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");
                var m=Pause(h);var op=Guid.NewGuid();Check(store.Commit(m,h.doc.revision,op).status=="committed","commit before lost ACK");
                var retry=new DesktopErgonProgressStore(p,"development").Commit(m,h.doc.revision,op);Check(retry.status=="already-applied"&&retry.revision==h.doc.revision+1&&retry.view.goals[0].lifecycle=="paused","lost ACK applies once across restart");
                var g=h.doc.goals[0].goalId;var r=h.doc.attempts[0].requestId;var correction=h.Confirm(g,r,2,h.doc.attempts[0].confirmations.Last().eventId);correction.confirmation.revision=retry.revision;
                var corrected=store.Commit(correction,retry.revision,Guid.NewGuid());Check(corrected.status=="committed"&&corrected.view.goals[0].confirmedQuantity==2,"persisted correction");
                var old=h.doc.auditEvents.Last();var latest=new DesktopErgonProgressStore(p,"development").Commit(old.mutation,old.revision-1,Guid.Parse(old.operationId));
                Check(latest.status=="already-applied"&&latest.revision==corrected.revision&&latest.view.goals[0].confirmedQuantity==2&&latest.view.goals[0].requests[0].confirmations.Length==2&&latest.view.goals[0].lifecycle=="paused","late ACK must not restore three or unpause");
                Check(new DesktopErgonProgressStore(p,"development").Project(Scope("foreign-character")).goals.Length==0,"restart scope isolation");
            },failed);
            Case("S06",()=>{var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development",new FaultIO{fault="verify"});Check(store.Commit(Pause(h),h.doc.revision,Guid.NewGuid()).status=="unavailable","post replacement verification must withhold ACK");var fresh=new DesktopErgonProgressStore(p,"development").Load(h.scope);Check(fresh.health=="review-required"&&Directory.GetFiles(Path.GetDirectoryName(store.FilePath),"*.bak").Length>0&&Directory.GetFiles(Path.GetDirectoryName(store.FilePath),"*.intent").Length>0,"failed verification preserves candidates and protection");},failed);
            Case("S07",()=>{foreach(var fault in new[]{"corrupt","wrong-key","future"}){var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");store.Commit(Pause(h),h.doc.revision,Guid.NewGuid());if(fault=="corrupt")File.WriteAllBytes(store.FilePath,new byte[]{1,2,3});else if(fault=="wrong-key")File.WriteAllBytes(store.FilePath,ProtectedData.Protect(Encoding.UTF8.GetBytes(ProgressDomain.Serialize(h.doc)),Encoding.UTF8.GetBytes("unrelated synthetic entropy"),DataProtectionScope.CurrentUser));else{var raw=Json.DeserializeObject(ProgressDomain.Serialize(h.doc)) as Dictionary<string,object>;raw["schemaVersion"]=99;File.WriteAllBytes(store.FilePath,ProtectedData.Protect(Encoding.UTF8.GetBytes(Json.Serialize(raw)),Entropy,DataProtectionScope.CurrentUser));}var before=Raw(store.FilePath);var fresh=new DesktopErgonProgressStore(p,"development");var loaded=fresh.Load(h.scope);Check(loaded.health=="unavailable"&&loaded.view.recoveryCandidates.Length>0&&fresh.Commit(Pause(h),loaded.revision,Guid.NewGuid()).status=="unavailable"&&Equal(before,Raw(store.FilePath)),"bad current must not be replaced");}},failed);
            Case("S08",()=>{var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");store.Commit(Pause(h),h.doc.revision,Guid.NewGuid());File.Delete(store.FilePath);var fresh=new DesktopErgonProgressStore(p,"development");var loaded=fresh.Load(h.scope);Check(loaded.health=="review-required"&&!File.Exists(store.FilePath)&&fresh.Commit(h.doc.auditEvents[0].mutation,0,Guid.NewGuid()).status=="unavailable","missing current with artifacts not empty init");},failed);
            Case("S09",()=>{var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");var newer=Guid.NewGuid();store.Commit(Pause(h),h.doc.revision,newer);File.WriteAllBytes(store.FilePath,new byte[]{1});var loaded=store.Load(h.scope);var candidate=loaded.view.recoveryCandidates.Single(x=>x.revision==h.doc.revision);var recover=new ProgressMutation{kind="Recover",scope=h.scope,goalId=h.doc.goals[0].goalId,candidateDigest=candidate.commitDigest,candidateRevision=candidate.revision};var result=store.Commit(recover,loaded.revision,Guid.NewGuid());Check(result.status=="committed"&&result.view.health=="review-required","recovery is review only");var fresh=new DesktopErgonProgressStore(p,"development");Check(fresh.Commit(Pause(h),result.revision,newer).status=="rejected"&&!fresh.Project(h.scope).goals[0].quantitySatisfied,"lost operation cannot authorize/replay");},failed);
            Case("S10",()=>{
                var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");store.Commit(Pause(h),h.doc.revision,Guid.NewGuid());File.WriteAllBytes(store.FilePath,new byte[]{1});
                var loaded=store.Load(h.scope);var c=loaded.view.recoveryCandidates[0];var mutation=new ProgressMutation{kind="Recover",scope=h.scope,goalId=h.doc.goals[0].goalId,candidateDigest=c.commitDigest,candidateRevision=c.revision};var operation=Guid.NewGuid();
                var invalid=ProgressDomain.Clone(mutation);invalid.candidateRevision="not-a-revision";Check(store.Commit(invalid,loaded.revision,Guid.NewGuid()).status=="rejected","malformed recovery revision must reject without throwing");
                var result=store.Commit(mutation,loaded.revision,operation);var freshStore=new DesktopErgonProgressStore(p,"development");var fresh=freshStore.Load(h.scope);
                Check(result.status=="committed"&&fresh.revision>loaded.revision&&fresh.health=="review-required"&&fresh.view.goals[0].confirmedQuantity==3&&Directory.GetFiles(Path.GetDirectoryName(store.FilePath),"*.bak").Length>0,"recover must preserve fault and new revision");
                var retry=freshStore.Commit(mutation,loaded.revision,operation);Check(retry.status=="already-applied"&&retry.revision==fresh.revision&&retry.view.health=="review-required","recovery lost ACK also deduplicates before CAS");
            },failed);
            Case("S11",()=>Concurrent(root),failed);
            Case("S12",()=>{foreach(var change in new[]{"old","future","goal","chain","underflow","wrong-type"}){
                var h=Baseline();var p=NewRoot(root);if(change=="old")h.doc.schemaVersion=0;if(change=="future")h.doc.schemaVersion=2;if(change=="goal")h.doc.goals[0].targetQuantity=99;if(change=="chain")h.doc.auditEvents.Last().previousDigest=new string('b',64);
                if(change=="underflow"){h=new DomainHarness();var g=h.Goal();var r=h.Request(g);h.Send(h.Confirm(g,r,0));}
                Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");
                if(change=="underflow")File.WriteAllBytes(store.FilePath,ProtectedData.Protect(Encoding.UTF8.GetBytes(ProgressDomain.Serialize(h.doc).Replace("\"quantity\":0","\"quantity\":1e-50")),Entropy,DataProtectionScope.CurrentUser));
                if(change=="wrong-type")File.WriteAllBytes(store.FilePath,ProtectedData.Protect(Encoding.UTF8.GetBytes(ProgressDomain.Serialize(h.doc).Replace("\"revision\":4","\"revision\":\"broken\"")),Entropy,DataProtectionScope.CurrentUser));
                var before=Raw(store.FilePath);Check(store.Load(h.scope).health=="unavailable"&&store.Commit(Pause(h),h.doc.revision,Guid.NewGuid()).status=="unavailable"&&Equal(before,Raw(store.FilePath)),"unsupported/mismatched history unchanged: "+change);
            }},failed);
            Case("S13",()=>Capacity(root),failed);
            Case("S14",()=>{var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");var directory=Path.GetDirectoryName(store.FilePath);var foreign=store.FilePath+".verified.foreign.bak";File.WriteAllBytes(foreign,Raw(store.FilePath));var residual=store.FilePath+".unverified.tmp";File.WriteAllBytes(residual,new byte[]{4,5});for(int i=0;i<5;i++){var m=Pause(h);m.lifecycle=i%2==0?"paused":"active";var r=store.Commit(m,store.Load(h.scope).revision,Guid.NewGuid());Check(r.status=="committed","rotation commit");}var good=Directory.GetFiles(directory,"*.verified.*.bak").Where(x=>x!=foreign).ToArray();Check(good.Length==2&&File.Exists(foreign)&&File.Exists(residual)&&new DesktopErgonProgressStore(p,"development").Load(h.scope).health=="ok","only own verified ancestor backups rotate");},failed);
        }
        static void Capacity(string root) {
            foreach(var kind in new[]{"goals","attempts","events","terminal-events"}) {
                var boundary=ProgressDomain.Empty("development");
                if(kind=="goals")boundary.goals=Enumerable.Range(0,101).Select(i=>new ProgressGoalRecord()).ToList();
                if(kind=="attempts")boundary.attempts=Enumerable.Range(0,1001).Select(i=>new ProgressAttemptRecord()).ToList();
                if(kind=="events"||kind=="terminal-events")boundary.auditEvents=Enumerable.Range(0,4000+(kind=="events"?1:0)).Select(i=>new ProgressAuditEvent()).ToList();
                if(kind=="terminal-events")boundary.attempts.Add(new ProgressAttemptRecord());
                bool rejected=false;try{ProgressDomain.Capacity(boundary);}catch(InvalidDataException e){rejected=e.Message=="capacity";}Check(rejected,"record count and reserved-event boundary: "+kind);
            }
            var h=new DomainHarness();string pending=null,g=null;
            for(int i=0;i<100;i++){g=h.Goal(4,new string('목',160));pending=h.Request(g,4,"crafting",false);}
            Check(ProgressDomain.Project(h.doc,h.scope,"ok").capacityWarning,"80 percent warning");
            var m=Pause(h);int count=0;while(true){m.lifecycle=count%2==0?"paused":"active";var result=h.Send(m);if(result.status!="committed"){Check(result.error=="capacity","capacity reason");break;}if(++count>4000)throw new Exception("capacity did not stop");}
            var p=NewRoot(root);Seed(p,h.doc);var store=new DesktopErgonProgressStore(p,"development");var before=Raw(store.FilePath);Check(store.Commit(m,h.doc.revision,Guid.NewGuid()).status=="rejected"&&Equal(before,Raw(store.FilePath)),"unrelated cannot spend terminal reserve");
            var a=h.doc.attempts.Last();var terminal=new ProgressMutation {kind="ObserveNativeTerminal",scope=h.scope,goalId=g,requestId=pending,evidence=new NativeTerminalEvidence{scope=h.scope,goalId=g,requestId=pending,action=a.action,displayName=a.displayName,craftCount=a.craftCount,outputPerCraft=a.outputPerCraft,expectedOutput=a.expectedOutput,outcome="completed",startedAt=600,observedAt=1000,verifierVersion=1,rowDigest=new string('a',64)}};
            var saved=store.Commit(terminal,h.doc.revision,Guid.NewGuid());Check(saved.status=="committed"&&new DesktopErgonProgressStore(p,"development").Load(h.scope).revision==h.doc.revision+1,"reserved terminal must fit after admission stopped");
            var goal=h.doc.auditEvents[0].mutation;goal=ProgressDomain.Clone(goal);goal.goalId=Id();Check(h.Send(goal).status=="rejected","goal limit history preserved");
        }
        public static string ScriptPath;
        static Process Child(string root,string goal,string name) {
            var start=new ProcessStartInfo("powershell.exe","-NoProfile -ExecutionPolicy Bypass -File \""+ScriptPath+"\" -Mode worker -Root \""+root+"\" -WorkerGoal \""+goal+"|"+name+"\"");start.UseShellExecute=false;start.CreateNoWindow=true;return Process.Start(start);
        }
        static void Crash(string root,string goal,string name,int code){using(var child=Child(root,goal,name)){if(!child.WaitForExit(20000)){child.Kill();child.WaitForExit();throw new Exception("synthetic crash child timed out");}Check(child.ExitCode==code,"synthetic child did not terminate at the injected boundary");}}
        static void Concurrent(string root) {
            var h=Baseline();var p=NewRoot(root);Seed(p,h.doc);var goal=h.doc.goals[0].goalId;
            using(var a=Child(p,goal,"a"))using(var b=Child(p,goal,"b")){
                var timer=Stopwatch.StartNew();while(!(File.Exists(Path.Combine(p,"ready-a"))&&File.Exists(Path.Combine(p,"ready-b")))){if(timer.ElapsedMilliseconds>20000)throw new Exception("workers did not become ready");Thread.Sleep(10);}
                File.WriteAllText(Path.Combine(p,"go"),"go");Check(a.WaitForExit(20000)&&b.WaitForExit(20000)&&a.ExitCode==0&&b.ExitCode==0,"worker exited");
            }
            var outcomes=new[]{File.ReadAllText(Path.Combine(p,"result-a")),File.ReadAllText(Path.Combine(p,"result-b"))};Check(outcomes.Count(x=>x=="committed")==1&&outcomes.Count(x=>x=="conflict")==1,"two processes must have single winner: "+String.Join(",",outcomes)+" / "+String.Join(",",Directory.GetFiles(p,"error-*").Select(File.ReadAllText)));Check(new DesktopErgonProgressStore(p,"development").Load(h.scope).revision==h.doc.revision+1,"lost update");
        }
        public static string Vector(string root) {var h=new DomainHarness();var g=h.Goal();var r=h.Request(g);h.Send(h.Confirm(g,r,3));return Json.Serialize(ProgressDomain.Project(h.doc,h.scope,"ok"));}
        public static void Worker(string root,string goal) {
            var parts=goal.Split('|');Check(parts.Length==2&&new[]{"a","b","partial","flushed"}.Contains(parts[1]),"worker identity");
            var trace=new FaultIO();var store=new DesktopErgonProgressStore(root,"development",trace);var loaded=store.Load(Scope());
            var mutation=new ProgressMutation{kind="SetLifecycle",scope=Scope(),goalId=parts[0],lifecycle="paused"};
            if(parts[1]=="partial"||parts[1]=="flushed"){trace.fault=parts[1]=="partial"?"terminate-partial":"terminate-before-publish";store.Commit(mutation,loaded.revision,Guid.NewGuid());throw new Exception("crash injection did not terminate");}
            File.WriteAllText(Path.Combine(root,"ready-"+parts[1]),"ready");var timer=Stopwatch.StartNew();while(!File.Exists(Path.Combine(root,"go"))){if(timer.ElapsedMilliseconds>20000)throw new Exception("worker gate timeout");Thread.Sleep(10);}
            var r=store.Commit(mutation,loaded.revision,Guid.NewGuid());File.WriteAllText(Path.Combine(root,"error-"+parts[1]),loaded.health+":"+loaded.error+"/"+r.error+"/"+trace.diagnostic);File.WriteAllText(Path.Combine(root,"result-"+parts[1]),r.status);
        }
    }
}
