using System;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace IrisDesktop {
 // Legacy execution regressions enter through real progress storage/binding, not a fake bypass.
 internal sealed class ProgressRegressionBinding {
  readonly DesktopLifeExecutor actor;readonly DesktopErgonProgressStore store;readonly DesktopLifeProgressConnection connection;
  internal ProgressRegressionBinding(DesktopLifeExecutor actor,DesktopLifeJournal journal,Func<long> clock){this.actor=actor;store=new DesktopErgonProgressStore(journal.RootPath,journal.EnvironmentName);connection=new DesktopLifeProgressConnection(actor,journal,store,clock);}
  internal async Task<object> Prepare(Dictionary<string,object> intent,bool bind=true){
   if(Equals(intent["action"],"collect"))return await actor.PrepareAsync(intent);
   var native=actor.ProgressContext();var scope=new ProgressScope{environment="development",accountId=(string)native["accountId"],characterId=(string)native["characterId"]};var snapshot=store.Load(scope);string goal=Guid.NewGuid().ToString("D");
   var create=new Dictionary<string,object>{{"accountId",scope.accountId},{"characterId",scope.characterId},{"goalId",goal},{"sourcePlanId","synthetic-regression"},{"parentGoalId",null},{"action",intent["action"]},{"displayName",intent["displayName"]},{"targetQuantity",100},{"revision",snapshot.revision},{"operationId",Guid.NewGuid().ToString("D")}};
   var saved=(ProgressExecutionResult)await connection.RequestAsync("createGoal",create);if(saved.status!="saved")throw new Exception("synthetic goal ACK: "+saved.error);
   var preview=await actor.PrepareAsync(intent);var nonce=(string)DesktopLifePolicy.Plain(preview)["nonce"];
   if(!bind)return preview;
   var bound=(ProgressExecutionResult)await connection.RequestAsync("bindPrepared",new Dictionary<string,object>{{"accountId",scope.accountId},{"characterId",scope.characterId},{"goalId",goal},{"nonce",nonce},{"revision",saved.revision},{"operationId",Guid.NewGuid().ToString("D")}});if(bound.status!="bound")throw new Exception("synthetic binding ACK: "+bound.error);return preview;
  }
 }
}
