using System;using System.IO;using System.Linq;using System.Threading.Tasks;using System.Collections.Generic;using System.Web.Script.Serialization;
namespace IrisDesktop {
 public static class GoalReplacementHostFixture {
  static void Need(bool ok,string why){if(!ok)throw new Exception(why);}
  static Dictionary<string,object> Obj(object value){var j=new JavaScriptSerializer();return (Dictionary<string,object>)j.DeserializeObject(j.Serialize(value));}
  static Dictionary<string,object> Payload(string old){var p=ProgressHostFixture.Payload(1);p["goalId"]=old;p["sourcePlanId"]="synthetic-plan";p["action"]="crafting";p["displayName"]="synthetic-sword";p["targetQuantity"]=4;p["replacementQuantity"]=3;return p;}
  public static async Task Run(string root){
   var t=new ProgressHostFixture.Trial(root);t.store=new DesktopErgonProgressStore(t.root,"development");var c=ProgressHostFixture.Attach(t);string old=await ProgressHostFixture.Goal(t,c);var payload=Payload(old);Need((string)Obj(await ProgressHostFixture.Request(c,"replaceEmptyGoal",payload))["status"]=="committed","J01 native ACK");Need((string)Obj(await ProgressHostFixture.Request(c,"replaceEmptyGoal",payload))["status"]=="already-applied","J01 replay");Need(t.calls==0&&t.store.Load(ProgressHostFixture.Scope()).view.goals.Count(g=>g.lifecycle=="active")==1,"J01 consuming or duplicate");using(t.journal.AcquireExecutionLease()){}Console.WriteLine("PASS J01 actual native connection, durable replacement/replay, zero executor dispatch, lease released");
   foreach(var mode in new[]{"character","account","unknown","extra","history"}){
    var trial=new ProgressHostFixture.Trial(root);trial.store=new DesktopErgonProgressStore(trial.root,"development");var connection=ProgressHostFixture.Attach(trial);var goal=await ProgressHostFixture.Goal(trial,connection);var p=Payload(goal);
    if(mode=="character")p["characterId"]="other";if(mode=="account")p["accountId"]="other";if(mode=="extra")p["path"]="forbidden";
    if(mode=="unknown")trial.journal.Begin(Guid.NewGuid().ToString("D"),"other-synthetic","other","crafting","synthetic",5);
    if(mode=="history"){Need(trial.store.Commit(new ProgressMutation{kind="BindPreparedRequest",scope=ProgressHostFixture.Scope(),goalId=goal,requestId=Guid.NewGuid().ToString("D"),action="crafting",displayName="synthetic-sword",craftCount=1,outputPerCraft=1,expectedOutput=1,preparedAt=1,expiresAt=2},1,Guid.NewGuid()).status=="committed","history seed");p["revision"]=2;}
    var before=File.ReadAllBytes(trial.store.FilePath);bool rejected=false;try{await ProgressHostFixture.Request(connection,"replaceEmptyGoal",p);}catch{rejected=true;}Need(rejected&&trial.calls==0&&before.SequenceEqual(File.ReadAllBytes(trial.store.FilePath)),"J02 "+mode);if(mode=="unknown")Need(trial.journal.HasUnresolved(),"J02 unknown cleared");
   }Console.WriteLine("PASS J02 native ownership/allowlist/global unknown/history remain fail-closed without writes or dispatch");
  }
 }
}
