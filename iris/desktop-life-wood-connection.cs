using System;using System.Linq;using System.Collections.Generic;using System.Threading.Tasks;
namespace IrisDesktop {
 // Production exposes only native observation/save/load, never a receipt writer.
 internal sealed class DesktopWoodProgressConnection {
  readonly string root,environment;readonly DesktopLifeJournal journal;readonly DesktopErgonProgressStore progress;readonly Func<Dictionary<string,object>> context;readonly Func<Task<IDisposable>> mutation;readonly Func<Dictionary<string,object>,Task<object>> observe;
  readonly object cacheGate=new object();readonly Dictionary<string,DesktopWoodProgressStore> stores=new Dictionary<string,DesktopWoodProgressStore>();
  internal DesktopWoodProgressConnection(string root,string environment,DesktopLifeJournal journal,DesktopErgonProgressStore progress,Func<Dictionary<string,object>> context,Func<Task<IDisposable>> mutation,Func<Dictionary<string,object>,Task<object>> observe){this.root=root;this.environment=environment;this.journal=journal;this.progress=progress;this.context=context;this.mutation=mutation;this.observe=observe;}
  static void Need(bool ok){if(!ok)throw new ArgumentException("wood-context-or-payload");}
  DesktopWoodProgressStore Store(ProgressScope scope,string goal){string key=ProgressDomain.Canonical(new {scope=scope,goalId=goal});lock(cacheGate){DesktopWoodProgressStore store;if(!stores.TryGetValue(key,out store)){Need(stores.Count<100);store=new DesktopWoodProgressStore(root,scope,goal,journal,progress);stores.Add(key,store);}return store;}}
  internal async Task<object> RequestAsync(string method,Dictionary<string,object> payload){
   Need((method=="load"||method=="observe")&&payload!=null&&payload.Count==(method=="load"?3:4)&&new[]{"accountId","characterId","goalId"}.All(payload.ContainsKey)&&(method=="load"||payload.ContainsKey("approval")));Need(ProgressDomain.Text(payload["accountId"] as string,100)&&ProgressDomain.Text(payload["characterId"] as string,100)&&ProgressDomain.IsId(payload["goalId"] as string));
   string meaning=ProgressDomain.Canonical(payload),owner=ProgressDomain.Canonical(context());var original=context();Need(Equals(original["accountId"],payload["accountId"])&&Equals(original["characterId"],payload["characterId"]));object packet=null;
   if(method=="observe"){var a=payload["approval"] as Dictionary<string,object>;Need(a!=null&&a.Count==5&&new[]{"id","maxWings","maxLogs","maxGather","expiresAt"}.All(a.ContainsKey)&&ProgressDomain.Text(a["id"] as string,160));ProgressDomain.Number(a["maxWings"],0,1000000);ProgressDomain.Number(a["maxLogs"],0,1000000);ProgressDomain.Number(a["maxGather"],0,1000000);ProgressDomain.Number(a["expiresAt"],1,ProgressDomain.TimeLimit);}
   Func<bool> current=()=>ProgressDomain.Canonical(payload)==meaning&&ProgressDomain.Canonical(context())==owner;
   if(method=="observe")packet=await observe(new Dictionary<string,object>{{"accountId",payload["accountId"]},{"characterId",payload["characterId"]},{"targetName","목재"}}).ConfigureAwait(false);
   Need(current());using(await mutation().ConfigureAwait(false)){Need(current());var scope=new ProgressScope{environment=environment,accountId=(string)payload["accountId"],characterId=(string)payload["characterId"]};var store=Store(scope,(string)payload["goalId"]);using(var session=store.Open(current)){if(method=="load")return session.Load();var approval=payload["approval"] as Dictionary<string,object>;Need(approval!=null);var normalized=ProgressDomain.Serializer().DeserializeObject(ProgressDomain.Serialize(packet)) as Dictionary<string,object>;Need(normalized!=null);return session.ObserveApproval(approval,normalized);}}
  }
 }
}
