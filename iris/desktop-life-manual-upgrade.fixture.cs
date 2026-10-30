using System;using System.IO;using System.Linq;using System.Text;using System.Threading;using System.Reflection;using System.Collections.Generic;using System.Security.Cryptography;
namespace IrisDesktop {
 // Test-only. The same fixture compiles against the fixed pre-D2 reader and current reader.
 // ManualWood uses reflection solely to avoid adding any new member to the old reader.
 public static class ManualWoodUpgradeFixture {
  static readonly ProgressScope S=new ProgressScope{environment="development",accountId="synthetic-account",characterId="synthetic-character"};
  static readonly byte[] Entropy=Encoding.UTF8.GetBytes("SANCTUM:IRIS:ErgonProgress:v1:development");
  static string Id(){return Guid.NewGuid().ToString("D");}
  static void Need(bool value,string message){if(!value)throw new Exception(message);}
  static string PathAt(string root){return Path.Combine(root,"development","ergon-progress-v1.dpapi");}
  static string Text(string root,string name){return File.ReadAllText(Path.Combine(root,name));}
  static void Put(string root,string name,string text){File.WriteAllText(Path.Combine(root,name),text,new UTF8Encoding(false));}
  static ProgressDocument Read(string root){var plain=ProtectedData.Unprotect(File.ReadAllBytes(PathAt(root)),Entropy,DataProtectionScope.CurrentUser);try{var d=ProgressDomain.Serializer().Deserialize<ProgressDocument>(Encoding.UTF8.GetString(plain));ProgressDomain.Validate(d,"development");return d;}finally{Array.Clear(plain,0,plain.Length);}}
  static string Hash(string path){using(var h=SHA256.Create())return BitConverter.ToString(h.ComputeHash(File.ReadAllBytes(path))).Replace("-","").ToLowerInvariant();}
  static Dictionary<string,string> Inventory(string root){return Directory.GetFiles(Path.Combine(root,"development"),"ergon-progress-v1.dpapi*").Where(p=>!p.EndsWith(".lock",StringComparison.Ordinal)).ToDictionary(p=>Path.GetFileName(p),Hash);}
  static void Same(Dictionary<string,string> before,string root){Need(ProgressDomain.Canonical(before)==ProgressDomain.Canonical(Inventory(root)),"cipher/artifact inventory changed");}
  static ProgressMutation Receipt(string root,long quantity,string previous=null){return new ProgressMutation{kind=previous==null?"ConfirmManualWoodReceipt":"CorrectManualWoodReceipt",scope=S,goalId=Text(root,"goal.txt"),sourcePlanId=Text(root,"plan.txt"),action="altering",displayName="목재",targetQuantity=100,requestId=Text(root,"receipt.txt"),quantity=quantity,source="user-confirmed",supersedesEventId=previous,reason=previous==null?null:"synthetic correction"};}
  static Dictionary<string,object> Manual(string root,ProgressDocument d){var method=typeof(ProgressDomain).GetMethod("ManualWood",BindingFlags.NonPublic|BindingFlags.Static);Need(method!=null,"new reader required");return ProgressDomain.Serializer().Deserialize<Dictionary<string,object>>(ProgressDomain.Serialize(method.Invoke(null,new object[]{d,S,Text(root,"goal.txt"),"ok"})));}
  static void Total(string root,long expected,int history){var d=Read(root);var m=Manual(root,d);Need(Convert.ToInt64(m["confirmedQuantity"])==expected&&Convert.ToInt64(m["remainingQuantity"])==Math.Max(0,100-expected),"manual total mismatch");var receipts=(System.Collections.IEnumerable)m["receipts"];var first=receipts.Cast<object>().Cast<Dictionary<string,object>>().First();Need(((System.Collections.IEnumerable)first["confirmations"]).Cast<object>().Count()==history,"correction history lost");Need(d.attempts.Single().confirmations.Single().quantity==3,"legacy confirmed3 lost");}
  static void Prefix(string root,ProgressDocument d){var old=ProgressDomain.Serializer().Deserialize<ProgressDocument>(Text(root,"old-document.json"));Need(ProgressDomain.Serialize(d.auditEvents.Take(old.auditEvents.Count).ToList())==ProgressDomain.Serialize(old.auditEvents)&&d.auditEvents[old.auditEvents.Count-1].digest==old.commitDigest,"historical prefix/digest changed");}
  static void Pause(string root,string mode){Put(root,"ready.txt",mode);Thread.Sleep(Timeout.Infinite);}
  sealed class StopIO:IProgressFileIO {
   readonly IProgressFileIO inner=new ProgressFileIO();readonly string root,mode;
   internal StopIO(string root,string mode){this.root=root;this.mode=mode;}
   public byte[] ReadCipher(string p,int max){return inner.ReadCipher(p,max);}
   public void WriteNewAndFlush(string p,byte[] bytes){if(mode=="before"&&p.EndsWith(".tmp",StringComparison.Ordinal))Pause(root,mode);inner.WriteNewAndFlush(p,bytes);}
   public void ReplaceWithBackup(string a,string b,string c){inner.ReplaceWithBackup(a,b,c);if(mode=="after")Pause(root,mode);}
   public void MoveNew(string a,string b){inner.MoveNew(a,b);}
   public IDisposable AcquireExclusiveLock(string p){return inner.AcquireExclusiveLock(p);}
  }
  public static void Run(string root,string stage,string golden){
   Directory.CreateDirectory(root);
   if(stage=="seed-old"){
    var d=ProgressDomain.Serializer().Deserialize<ProgressDocument>(File.ReadAllText(golden));ProgressDomain.Validate(d,"development");Directory.CreateDirectory(Path.GetDirectoryName(PathAt(root)));var plain=Encoding.UTF8.GetBytes(File.ReadAllText(golden));try{File.WriteAllBytes(PathAt(root),ProtectedData.Protect(plain,Entropy,DataProtectionScope.CurrentUser));}finally{Array.Clear(plain,0,plain.Length);}
    Put(root,"goal.txt",Id());Put(root,"plan.txt",Id());Put(root,"receipt.txt",Id());Put(root,"operation.txt",Id());Put(root,"interruption-operation.txt",Id());
    var store=new DesktopErgonProgressStore(root,"development");Need(store.Load(S).view.goals[0].confirmedQuantity==3,"old golden invalid");var result=store.Commit(new ProgressMutation{kind="CreateGoal",scope=S,goalId=Text(root,"goal.txt"),sourcePlanId=Text(root,"plan.txt"),action="altering",displayName="목재",targetQuantity=100},d.revision,Guid.NewGuid());Need(result.status=="committed","old writer seed rejected");Put(root,"old-document.json",ProgressDomain.Serialize(Read(root)));Put(root,"old-inventory.json",ProgressDomain.Serialize(Inventory(root)));Console.WriteLine("PASS D2U-A1 fixed old reader validated confirmed3 and persisted wood goal via old writer");return;
   }
   var s=new DesktopErgonProgressStore(root,"development");
   if(stage=="append-new"){
    var before=Inventory(root);var old=ProgressDomain.Serializer().Deserialize<ProgressDocument>(Text(root,"old-document.json"));var snapshot=s.Load(S);var d=Read(root);Need(snapshot.health=="ok"&&snapshot.revision==old.revision&&d.commitDigest==old.commitDigest,"old->new revision/digest");Prefix(root,d);Same(before,root);
    Need(s.Commit(Receipt(root,35),old.revision,Guid.Parse(Text(root,"operation.txt"))).status=="committed","manual35 append");d=Read(root);Need(d.revision==old.revision+1,"manual revision");Prefix(root,d);Total(root,35,1);Put(root,"manual-inventory.json",ProgressDomain.Serialize(Inventory(root)));Console.WriteLine("PASS D2U-A2 new process read old bytes unchanged; append35 preserved audit prefix/revision/digest");return;
   }
   if(stage=="reject-old"){
    var before=Inventory(root);var snapshot=s.Load(S);Need(snapshot.health=="unavailable"&&snapshot.view.goals.Length==0,"old reader accepted new event");
    var result=s.Commit(new ProgressMutation{kind="SetLifecycle",scope=S,goalId=Text(root,"goal.txt"),lifecycle="paused"},snapshot.revision,Guid.NewGuid());Need(result.status=="unavailable","old safe commit accepted unsupported current");Same(before,root);
    Put(root,"old-result.json",ProgressDomain.Serialize(new{health=snapshot.health,error=snapshot.error,commitStatus=result.status,commitError=result.error,revision=snapshot.revision,recoveryCandidates=snapshot.view.recoveryCandidates}));Console.WriteLine("PASS D2U-B fixed old process rejects Load and safe Commit; current/backups/tmp/intent unchanged");return;
   }
   if(stage=="probe-old-recover"){
    var before=Inventory(root);var snapshot=s.Load(S);Need(snapshot.health=="unavailable","recovery probe requires unsupported new current");var candidate=snapshot.view.recoveryCandidates.OrderByDescending(c=>c.revision).First();
    var result=s.Commit(new ProgressMutation{kind="Recover",scope=S,goalId=Text(root,"goal.txt"),candidateDigest=candidate.commitDigest,candidateRevision=candidate.revision},snapshot.revision,Guid.NewGuid());
    var after=Inventory(root);Need(result.status=="committed"&&after["ergon-progress-v1.dpapi"]!=before["ergon-progress-v1.dpapi"],"old recovery behavior changed: reassess downgrade risk");Need(after.Any(p=>p.Key.EndsWith(".bak",StringComparison.Ordinal)&&p.Value==before["ergon-progress-v1.dpapi"]),"old recovery lost unsupported current bytes");var recovered=Read(root);Need(recovered.reviewRequired&&!recovered.auditEvents.Any(e=>e.mutation.kind=="ConfirmManualWoodReceipt"),"old recovery unexpectedly retained manual event");
    Put(root,"old-recover-result.json",ProgressDomain.Serialize(new{status=result.status,health=s.Load(S).health,revision=recovered.revision,currentChanged=true,unsupportedCipherRetainedInBackup=true,manualVisibleInCurrent=false}));Console.WriteLine("LIMIT D2U-B-recover explicit old Recover can publish an ancestor and hide manual35 from current; new-event cipher survives in backup. No universal no-overwrite guarantee.");return;
   }
   if(stage.StartsWith("stop-",StringComparison.Ordinal)){
    string mode=stage.Substring(5);var before=Inventory(root);Put(root,"interruption-before.json",ProgressDomain.Serialize(before));Directory.CreateDirectory(Path.Combine(root,"before-ciphers"));foreach(var name in before.Keys)File.Copy(Path.Combine(root,"development",name),Path.Combine(root,"before-ciphers",name));var m=Receipt(root,20);m.requestId=Text(root,"interruption-operation.txt");
    var interrupted=new DesktopErgonProgressStore(root,"development",new StopIO(root,mode));var result=interrupted.Commit(m,s.Load(S).revision,Guid.Parse(Text(root,"interruption-operation.txt")));Need(result.status=="committed","ack stop not committed");Pause(root,mode);return;
   }
   if(stage.StartsWith("check-",StringComparison.Ordinal)){
    string mode=stage.Substring(6);var before=ProgressDomain.Serializer().Deserialize<Dictionary<string,string>>(Text(root,"interruption-before.json"));var inventory=Inventory(root);var snapshot=s.Load(S);
    foreach(var item in before){
     bool retained=inventory.ContainsKey(item.Key)&&inventory[item.Key]==item.Value||item.Key=="ergon-progress-v1.dpapi"&&inventory.Any(x=>x.Key.EndsWith(".bak",StringComparison.Ordinal)&&x.Value==item.Value);
     // Successful Publish intentionally keeps two verified ancestors. A crash before
     // Rotate must preserve all artifacts; ACK loss occurs after normal rotation.
     if(!retained&&mode=="ack"&&item.Key.Contains(".verified.")&&item.Key.EndsWith(".bak",StringComparison.Ordinal)){
      var bytes=ProtectedData.Unprotect(File.ReadAllBytes(Path.Combine(root,"before-ciphers",item.Key)),Entropy,DataProtectionScope.CurrentUser);
      try{var ancestor=ProgressDomain.Serializer().Deserialize<ProgressDocument>(Encoding.UTF8.GetString(bytes));ProgressDomain.Validate(ancestor,"development");var current=Read(root);Need(ancestor.storeId==current.storeId&&ancestor.revision<current.revision-2&&current.auditEvents.Any(e=>e.digest==ancestor.commitDigest),"rotation removed non-ancestor or recent backup");retained=true;}finally{Array.Clear(bytes,0,bytes.Length);}
     }
     Need(retained,"prior cipher/backup lost");
    }
    if(mode=="before"){Need(snapshot.health=="ok","pre-save crash health");Same(before,root);Total(root,35,1);}
    else if(mode=="after"){Need(snapshot.health=="review-required"&&inventory.Keys.Any(p=>p.EndsWith(".intent",StringComparison.Ordinal)),"post-replace crash not review guarded");Need(Read(root).auditEvents.Last().mutation.quantity.ToString()=="20","published event lost");var blocked=s.Commit(new ProgressMutation{kind="SetLifecycle",scope=S,goalId=Text(root,"goal.txt"),lifecycle="paused"},snapshot.revision,Guid.NewGuid());Need(blocked.status!="committed","review guard bypass");Same(inventory,root);}
    else {Need(snapshot.health=="ok","ACK loss corrupted committed state");var m=Receipt(root,20);m.requestId=Text(root,"interruption-operation.txt");var duplicate=s.Commit(m,snapshot.revision-1,Guid.Parse(Text(root,"interruption-operation.txt")));Need(duplicate.status=="already-applied","ACK-loss replay not idempotent");var d=Read(root);Need(Convert.ToInt64(Manual(root,d)["confirmedQuantity"])==55&&d.auditEvents.Count(e=>e.operationId==Text(root,"interruption-operation.txt"))==1,"ACK replay duplicated quantity");Same(inventory,root);}
    Prefix(root,Read(root));Console.WriteLine("PASS D2U-C-"+mode+" killed process reopened with preserved current/backups and guarded semantics");return;
   }
   if(stage=="update-failure"){
    var before=Inventory(root);var package=Path.Combine(root,"synthetic-update.zip");File.WriteAllBytes(package,new byte[]{1,2,3});
    var release=new DesktopUpdateRelease{Version="0.4.4",SizeBytes=3,Sha256=new string('0',64),Files=new DesktopUpdateFile[0]};bool failed=false;try{release.ValidateArchive(package,Path.Combine(root,"stage"));}catch(ArgumentException e){Need(e.Message=="Archive integrity mismatch","wrong update rejection");failed=true;}
    Need(failed&&!Directory.Exists(Path.Combine(root,"stage")),"corrupt update accepted");Same(before,root);Total(root,35,1);Console.WriteLine("PASS D2U-C-update fixed main archive validator rejects failed synthetic download before stage; ledger/backups unchanged (no install/helper launch)");return;
   }
   if(stage=="restore-new"){
    var before=Inventory(root);Need(s.Load(S).health=="ok","new reader did not restore35");Total(root,35,1);Prefix(root,Read(root));Same(before,root);var correction=s.Commit(Receipt(root,30,Text(root,"operation.txt")),s.Load(S).revision,Guid.NewGuid());Need(correction.status=="committed","new correction failed");Total(root,30,2);Console.WriteLine("PASS D2U-D1 return to new reader restores35; correction30 retains original35");return;
   }
   if(stage=="restore-history"){
    var before=Inventory(root);Need(s.Load(S).health=="ok","correction restart health");Total(root,30,2);var d=Read(root);var events=d.auditEvents.Where(e=>e.mutation.requestId==Text(root,"receipt.txt")).ToArray();Need(events.Length==2&&Convert.ToInt64(events[0].mutation.quantity)==35&&Convert.ToInt64(events[1].mutation.quantity)==30&&events[1].mutation.supersedesEventId==events[0].eventId&&events[1].mutation.reason=="synthetic correction","correction chain lost");Prefix(root,d);Same(before,root);Console.WriteLine("PASS D2U-D2 fresh process restores35->30 correction history/prefix without rewrite");return;
   }
   throw new Exception("unknown fixture stage");
  }
 }
}
