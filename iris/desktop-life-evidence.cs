using System;using System.Collections.Generic;using System.Linq;using System.Threading;using System.Threading.Tasks;using System.Web.Script.Serialization;
namespace IrisDesktop {
 // Read-only observation, not a production command or a quantity authority.
 // Only native delegates supply data. Browser input is identity/target only.
 public sealed class DesktopLifeEvidenceProvider {
  readonly string environment;readonly Func<Dictionary<string,object>> context;readonly Func<object> state;readonly Func<string,Task<object>> read;readonly Func<bool> allowed;readonly Func<long> clock;
  readonly SemaphoreSlim gate=new SemaphoreSlim(1,1);readonly object reportGate=new object();object report;string reportContext,reportRequest;long reportTime;
  static JavaScriptSerializer Json(){return new JavaScriptSerializer {MaxJsonLength=1048576,RecursionLimit=24};}
  static void Need(bool ok){if(!ok)throw new ArgumentException("life_context_changed");}
  static Dictionary<string,object> Plain(object v){var j=Json();return j.DeserializeObject(j.Serialize(v)) as Dictionary<string,object>;}
  static bool Exact(Dictionary<string,object> v,params string[] keys){return v!=null&&v.Count==keys.Length&&keys.All(v.ContainsKey);}
  static string Text(object v,int max){var s=v as string;Need(!String.IsNullOrWhiteSpace(s)&&s.Length<=max&&!s.Any(c=>c<32||c==127));return s;}
  static long Number(object v){Need(v!=null&&!(v is bool)&&!(v is string));double n=Convert.ToDouble(v);Need(!Double.IsNaN(n)&&!Double.IsInfinity(n)&&n>=0&&n<=9007199254740991d&&Math.Floor(n)==n);return (long)n;}
  static string Digest(object v){return Json().Serialize(v);}
  public DesktopLifeEvidenceProvider(string environment,Func<Dictionary<string,object>> context,Func<object> state,Func<string,Task<object>> read,Func<bool> allowed,Func<long> clock){Need(environment=="development"||environment=="production");this.environment=environment;this.context=context;this.state=state;this.read=read;this.allowed=allowed;this.clock=clock;}
  void Check(string owner,string initialState){Need(allowed()&&Digest(context())==owner&&Digest(state())==initialState);}
  static object RewardRows(object v,bool nonempty){var a=v as object[];Need(a!=null&&a.Length<=2048&&(!nonempty||a.Length>0));return a.Select(value=>{var r=value as Dictionary<string,object>;Need(Exact(r,"Name","Amount"));string name=Text(r["Name"],160);long amount=Number(r["Amount"]);Need(amount>0);return (object)new {Name=name,Amount=amount};}).ToArray();}
  // Observes an already executed response only; never invokes CLI, mutates a
  // journal, saves raw replies or turns reports into confirmed output.
  public void ReportCollection(Dictionary<string,object> origin,string raw){
   lock(reportGate){report=null;reportContext=null;reportRequest=null;try{Need(raw!=null&&raw.Length<=1048576&&Digest(origin)==Digest(context()));var row=Json().DeserializeObject(raw) as Dictionary<string,object>;Need(Exact(row,"collected","rewards","criticalRewards"));long count=Number(row["collected"]);Need(count>0&&count<=2048);var s=Plain(state());var current=s["current"] as Dictionary<string,object>;Need(current!=null&&Equals(current["action"],"collect")&&Equals(current["accountId"],origin["accountId"])&&Equals(current["characterId"],origin["characterId"]));var value=new {collected=count,rewards=RewardRows(row["rewards"],true),criticalRewards=RewardRows(row["criticalRewards"],false)};Need(Digest(origin)==Digest(context()));report=value;reportContext=Digest(origin);reportRequest=(string)current["id"];reportTime=clock();}catch{report=null;}}
  }
  public async Task<object> ReadAsync(Dictionary<string,object> request){
   Need(Exact(request,"accountId","characterId","targetName"));string account=Text(request["accountId"],100),character=Text(request["characterId"],100),target=Text(request["targetName"],160);
   Need(await gate.WaitAsync(0).ConfigureAwait(false));try{
    var initial=Plain(context());Need(initial!=null&&Equals(initial["accountId"],account)&&Equals(initial["characterId"],character)&&allowed());string owner=Digest(initial);var actionState=Plain(state());string initialState=Digest(actionState);long started=clock();Need(started>0);var issues=new List<string>{"game-character-unverified","non-atomic-observations"};
    var values=new Dictionary<string,object>{{"inventory",null},{"materials",null},{"altering",null},{"works",null}};
    bool busy=Equals(actionState["busy"],true),blocked=Equals(actionState["blocked"],true)||Equals(actionState["state"],"unknown");
    if(busy||blocked)issues.Add(busy?"native-busy":"native-unresolved");
    else foreach(string kind in new[]{"materials","inventory","altering","works"}){
     Check(owner,initialState);object value=null;
     // Existing DesktopLifeReader bounds one read at 8 seconds. Do not start
     // another call without that budget; never abandon an in-flight reader.
     long elapsed=clock()-started;Need(elapsed>=0);if(elapsed>7000){issues.Add(kind+"-budget-exhausted");continue;}
     try{value=await read(kind).ConfigureAwait(false);}catch{issues.Add(kind+"-unavailable");}
     Check(owner,initialState);
     if(value!=null)try{var snapshot=Plain(value);Need(snapshot!=null&&Equals(snapshot["kind"],kind)&&Equals(snapshot["source"],"official-cli")&&Number(snapshot["schemaVersion"])==1);long now=clock(),at=Number(snapshot["observedAt"]);Need(at>0&&now>=at&&now-at<15000);values[kind]=snapshot;}catch{issues.Add(kind+"-invalid-or-stale");}
    }
    Check(owner,initialState);long finished=clock();Need(finished>=started&&finished-started<15000);
    // Earlier snapshots may expire while the later readers are in flight.
    foreach(string kind in values.Keys.ToArray())if(values[kind]!=null){var v=(Dictionary<string,object>)values[kind];if(finished-Number(v["observedAt"])>=15000){values[kind]=null;issues.Add(kind+"-invalid-or-stale");}}
    var current=actionState["current"] as Dictionary<string,object>;if(current!=null&&(!Equals(current["accountId"],account)||!Equals(current["characterId"],character))){actionState=null;issues.Add("actor-state-foreign");}
    object collection=null;string collectionStatus="not-retained";lock(reportGate){if(report!=null&&current!=null&&reportContext==owner&&Equals(current["id"],reportRequest)&&Equals(current["displayName"],target)&&finished>=reportTime&&finished-reportTime<15000){collection=Plain(report);collectionStatus="reported-unverified";}}
    if(collection==null)issues.Add("collection-report-unavailable");Check(owner,initialState);
    var scope=new {environment=environment,accountId=account,characterId=character};
    return new {schemaVersion=1,scope=scope,targetName=target,documentEpoch=Number(initial["document"]),contextVersion=Number(initial["contextVersion"]),observedAt=finished,gameIdentityVerified=false,inventory=values["inventory"],materials=values["materials"],altering=values["altering"],evidence=new {scope=scope,works=values["works"],actionState=actionState,collection=collection},collectionStatus=collectionStatus,issues=issues.Distinct().ToArray(),executionAllowed=false};
   }finally{gate.Release();}
  }
 }
}
