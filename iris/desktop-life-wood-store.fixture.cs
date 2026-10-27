using System;using System.IO;using System.Linq;using System.Collections.Generic;using System.Web.Script.Serialization;
namespace IrisDesktop {
 internal sealed class WoodFaultIO:IProgressFileIO {
  readonly IProgressFileIO inner=new ProgressFileIO();internal string fail;internal Action contextLost;
  void After(string stage){if(fail!=stage)return;fail=null;if(stage=="context"){contextLost();return;}throw new IOException("synthetic-write-failure-"+stage);}
  public byte[] ReadCipher(string p,int max){return inner.ReadCipher(p,max);}
  public void WriteNewAndFlush(string p,byte[] bytes){inner.WriteNewAndFlush(p,bytes);if(p.EndsWith(".tmp")){After("temp");After("context");}if(p.EndsWith(".intent"))After("intent");}
  public void ReplaceWithBackup(string a,string b,string c){inner.ReplaceWithBackup(a,b,c);After("replace");}
  public void MoveNew(string a,string b){inner.MoveNew(a,b);After("replace");}
  public IDisposable AcquireExclusiveLock(string p){return inner.AcquireExclusiveLock(p);}
 }
 public static class WoodStoreFixture {
  sealed class NoMutation:IDisposable {public void Dispose(){}}
  static readonly JavaScriptSerializer json=new JavaScriptSerializer {MaxJsonLength=4194304,RecursionLimit=64};
  static Dictionary<string,object> D(object x){return (Dictionary<string,object>)json.DeserializeObject(json.Serialize(x));}
  public static void Serve(string root){
   var full=Path.GetFullPath(root);var parent=Path.GetFullPath(Path.Combine(Environment.CurrentDirectory,".superpowers/wood-production"));Guid parsed;
   if(Path.GetDirectoryName(full)!=parent||!Guid.TryParseExact(Path.GetFileName(full),"D",out parsed)||!File.Exists(Path.Combine(full,"world.json")))throw new Exception("owned synthetic root required");
   var scope=new ProgressScope{environment="development",accountId="synthetic",characterId="wood-character"};string goal="10000000-0000-4000-8000-000000000001";var nativeRoot=Path.Combine(full,"native-c");
   var journal=new DesktopLifeJournal(nativeRoot,"development",false);var common=new DesktopErgonProgressStore(nativeRoot,"development");var old=common.Load(scope);
   if(old.view.goals.Length==0){var created=common.Commit(new ProgressMutation{kind="CreateGoal",scope=scope,goalId=goal,sourcePlanId="wood-plan",parentGoalId=null,action="altering",displayName="목재",targetQuantity=100},old.revision,Guid.NewGuid());if(created.status!="committed")throw new Exception("synthetic native goal failed");}
   bool contextValid=true;var io=new WoodFaultIO();io.contextLost=()=>contextValid=false;
   var store=new DesktopWoodProgressStore(nativeRoot,scope,goal,journal,common,true,io);DesktopWoodProgressStore.Session session=null;string line;
   while((line=Console.ReadLine())!=null){try{var r=(Dictionary<string,object>)json.DeserializeObject(line);string method=(string)r["method"];var p=r["payload"] as Dictionary<string,object>;object value=null;
    if(method=="begin"){session=store.Open(()=>contextValid);value=new {mode="simulation",executionAllowed=false};}
    else if(method=="end"){session.Dispose();session=null;value=true;}
    else if(method=="load")value=session.Load();
    else if(method=="commit")value=session.Commit(Convert.ToInt64(p["expected"]),(string)p["operationId"],D(p["state"]));
    else if(method=="journalBegin"){var c=D(p["command"]);string kind=(string)c["kind"];journal.Begin((string)c["id"],scope.accountId,scope.characterId,kind=="gather"?"gathering":kind=="register"?"altering":"collect",kind=="gather"?"통나무":"목재",kind=="collect"?(int?)null:5);value=true;}
    else if(method=="journalFinish"){journal.SetOutcome((string)p["id"],(string)p["outcome"]);value=true;}
    else if(method=="progress")value=common.Load(scope).view;
    else if(method=="progressPending"){var latest=common.Load(scope);long now=(long)(DateTime.UtcNow-new DateTime(1970,1,1)).TotalMilliseconds;var result=common.Commit(new ProgressMutation{kind="BindPreparedRequest",scope=scope,goalId=goal,requestId=Guid.NewGuid().ToString("D"),action="altering",displayName="목재",preparedAt=now,expiresAt=now+60000},latest.revision,Guid.NewGuid());if(result.status!="committed")throw new Exception("synthetic pending failed");value=true;}
    else if(method=="invalidate"){contextValid=false;value=true;}
    else if(method=="fault"){io.fail=(string)p["name"];value=true;}
    else if(method=="corrupt"){File.WriteAllBytes(store.FilePath,new byte[]{1,2,3});value=true;}
    else if(method=="rollback"){var backup=Directory.GetFiles(Path.GetDirectoryName(store.FilePath),Path.GetFileName(store.FilePath)+".verified.*.bak").First();File.Copy(backup,store.FilePath,true);value=true;}
    else if(method=="foreignBegin"){journal.Begin(Guid.NewGuid().ToString("D"),"foreign-account","other","altering","목재",5);value=true;}
    else if(method=="productionCommit"){var production=new DesktopWoodProgressStore(nativeRoot,scope,goal,journal,common,false);using(var s=production.Open(()=>contextValid))value=s.Commit(Convert.ToInt64(p["expected"]),(string)p["operationId"],D(p["state"]));}
    else if(method=="gatewayObserve"){var ctx=new Dictionary<string,object>{{"accountId",scope.accountId},{"characterId",scope.characterId},{"document",1},{"contextVersion",1}};int reads=0;var connection=new DesktopWoodProgressConnection(nativeRoot,scope.environment,journal,common,()=>ctx,()=>System.Threading.Tasks.Task.FromResult<IDisposable>(new NoMutation()),readRequest=>{reads++;return System.Threading.Tasks.Task.FromResult(p["packet"]);});var result=connection.RequestAsync("observe",D(p["request"])).GetAwaiter().GetResult();value=new {view=result,reads=reads};}
    else if(method=="paths")value=new {file=store.FilePath,journal=journal.FilePath};
    else if(method=="observe"){var production=new DesktopWoodProgressStore(nativeRoot,scope,goal,journal,common,false);using(var s=production.Open(()=>contextValid))value=s.Observe(D(p["config"]),D(p["packet"]));}
    else throw new Exception("unsupported synthetic method");
    Console.WriteLine(json.Serialize(new {ok=true,value=value}));Console.Out.Flush();
   }catch(Exception e){Console.WriteLine(json.Serialize(new {ok=false,error=e.GetType().Name+":"+e.Message}));Console.Out.Flush();}}
   if(session!=null)session.Dispose();
  }
 }
}
