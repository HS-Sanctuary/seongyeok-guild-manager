using System;
using System.Collections.Generic;
namespace IrisDesktop {
 public static class DesktopLifeReconciliation {
  public static bool Evaluate(Dictionary<string,object> record,Dictionary<string,object> evidence){
   try{
    DesktopLifeJournal.ValidateRecord(record);var e=evidence;long now=DesktopLifePolicy.Integer(e["checkedAt"],1),session=DesktopLifePolicy.Integer(e["sessionStartedAt"],1),started=DesktopLifePolicy.Integer(record["startedAt"],1);
    if(!Equals(record["state"],"unknown")||started>=session||now-started<720000||!Equals(e["leaseHeld"],true)||!Equals(e["noExecution"],true)||!Equals(e["cliAbsent"],true))return false;
    var first=DesktopLifePolicy.Object(e["first"]);var second=DesktopLifePolicy.Object(e["second"]);
    foreach(var s in new[]{first,second}){
     if(!Equals(s["cliAbsent"],true)||DesktopLifePolicy.Integer(s["gameProcessId"],1)!=DesktopLifePolicy.Integer(e["gameProcessId"],1)||DesktopLifePolicy.Integer(s["gameStartedAt"],1,Int64.MaxValue)!=DesktopLifePolicy.Integer(e["gameStartedAt"],1,Int64.MaxValue)||!Equals(s["contextVersion"],e["contextVersion"])||!Equals(s["document"],e["document"])||!Equals(s["recordHash"],e["recordHash"]))return false;
     DesktopLifePolicy.SafeActivity(DesktopLifePolicy.Data(s["activity"],"activity",new DateTime(1970,1,1,0,0,0,DateTimeKind.Utc).AddMilliseconds(now)));
    }
    var f=DesktopLifePolicy.Plain(first["activity"]);var s2=DesktopLifePolicy.Plain(second["activity"]);return DesktopLifePolicy.Integer(s2["observedAt"],1)-DesktopLifePolicy.Integer(f["observedAt"],1)>=1000;
   }catch{return false;}
  }
 }
}
