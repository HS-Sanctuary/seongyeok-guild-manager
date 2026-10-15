using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;
namespace IrisDesktop {
 public static class LifeAutomationFixture {
  static readonly JavaScriptSerializer Json=new JavaScriptSerializer();
  static void Check(bool value,string message){if(!value)throw new Exception(message);}
  static void Reject(Action action){try{action();}catch{return;}throw new Exception("Unsafe automation operation accepted");}
  static Dictionary<string,object> Row(object value){return Json.DeserializeObject(Json.Serialize(value)) as Dictionary<string,object>;}
  static Dictionary<string,object> Evidence(){return Row(new {sessionStartedAt=2000000L,checkedAt=2100000L,firstObservedAt=2098000L,secondObservedAt=2100000L,gameProcessId=123,contextVersion=1L,policyVersion=1,cliAbsent=true});}
  public static void Run(string root){
   var journal=new DesktopLifeJournal(root,"development",false);string id=Guid.NewGuid().ToString("D");journal.Begin(id,"a","c","gathering","wood",5);journal.SetOutcome(id,"unknown");
   var original=Row(journal.EntriesFor("a")[0]);byte[] before=File.ReadAllBytes(journal.FilePath);
   var store=new DesktopLifeAutomationStore(root,"development");Check(!store.CollectionAllowed("a",1),"Missing permission granted collection");store.GrantCollection("a",1);Check(store.CollectionAllowed("a",1)&&!store.CollectionAllowed("b",1),"Permission scope leaked");Reject(()=>store.GrantCollection("a",2));store.RevokeCollection("a");Check(!store.CollectionAllowed("a",1),"Revocation failed");
   using(var lease=journal.AcquireExecutionLease()){store.RecordSeparation("development",original,Evidence());store.RecordSeparation("development",original,Evidence());}
   Check(before.SequenceEqual(File.ReadAllBytes(journal.FilePath)),"OldUnknownRemainsByteIdentical");Check(store.IsSeparated("development",original),"Valid separation ignored");Check(store.SeparatedRequestIds("a").SequenceEqual(new[]{id})&&store.SeparatedRequestIds("b").Count==0,"Separation list leaked or duplicated");
   var backups=Directory.GetFiles(Path.Combine(root,"development","reconciliation-backups"),"*.dpapi");Check(backups.Length==1&&File.ReadAllBytes(backups[0]).SequenceEqual(before),"BackupExistsBeforeFirstAudit");
   var changed=Row(original);changed["displayName"]="other";Check(!store.IsSeparated("development",changed),"AlteredOriginalInvalidatesSeparation");Check(!store.IsSeparated("production",original),"ForeignEnvironmentCannotReuseGrantOrAudit");
   var peer=new DesktopLifeAutomationStore(root,"production");Check(!peer.CollectionAllowed("a",1)&&!peer.IsSeparated("production",original),"Foreign environment reused automation policy");
   journal.BindSeparation(store.IsSeparated);Check(!journal.HasUnresolved(),"Journal ignored separation predicate");var strict=new DesktopLifeJournal(root,"development",false);Check(strict.HasUnresolved(),"RollbackWithoutPredicateBlocksAgain");
   using(var gate=new FileStream(store.FilePath+".lock",FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None)){Reject(()=>store.GrantCollection("a",1));Reject(()=>journal.HasUnresolved());}
   string pending=Guid.NewGuid().ToString("D");journal.Begin(pending,"a","c","collect","metal",null);journal.SetOutcome(pending,"unknown");Check(journal.HasUnresolved(),"New unknown reused old separation");
   byte[] valid=File.ReadAllBytes(store.FilePath);using(var gate=new FileStream(store.FilePath,FileMode.Open,FileAccess.Read,FileShare.Read)){Reject(()=>store.GrantCollection("a",1));Check(valid.SequenceEqual(File.ReadAllBytes(store.FilePath)),"FailedAuditWriteKeepsOldFile");}
   File.WriteAllBytes(store.FilePath,new byte[]{1,2,3});Reject(()=>store.CollectionAllowed("a",1));Reject(()=>journal.HasUnresolved());File.WriteAllBytes(store.FilePath,valid);
   var fresh=new DesktopLifeAutomationStore(root,"development");Check(fresh.IsSeparated("development",original),"Separation did not survive reload");
   // Insert a peer unknown: a grant/audit in development must not hide it.
   var peerRoot=Path.Combine(root,"peer-check");var production=new DesktopLifeJournal(peerRoot,"production",false);production.Begin(Guid.NewGuid().ToString("D"),"other-account","c2","gathering","wood",5);var development=new DesktopLifeJournal(peerRoot,"development",false);development.BindSeparation(store.IsSeparated);Check(development.HasUnresolved(),"Peer unresolved disappeared");
  }
 }
}
