using System;
using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace IrisDesktop {
 public static class LifeExecutorFixture {
  static readonly JavaScriptSerializer Json=new JavaScriptSerializer();
  static Dictionary<string,object> Object(object value){return Json.DeserializeObject(Json.Serialize(value)) as Dictionary<string,object>;}
  static void Check(bool ok,string message){if(!ok)throw new Exception(message);}
  static async Task Reject(Func<Task> action){try{await action();}catch{return;}throw new Exception("Unsafe life action accepted");}
  sealed class Trial {
   public DateTime now=new DateTime(2026,10,13,0,0,0,DateTimeKind.Utc);public long epoch=1;public bool allowed=true,consent=true,combat=false,overweight=false,available=true;public int calls;public decimal wings=30;public bool registered;public string receipt="{\"status\":\"accepted\",\"body\":{\"result\":\"completed\",\"craftCount\":1,\"rewards\":[],\"criticalRewards\":[]}}";public bool throwPerform;
   public DesktopLifeExecutor actor;public DesktopLifeJournal journal;public int readSeconds,consentSeconds,ownedCount=3;public bool produce=true;public Action onPerform;
   public Trial(string root){journal=new DesktopLifeJournal(root,"development",false);actor=new DesktopLifeExecutor(journal,Read,Currency,Named,Perform,p=>{now=now.AddSeconds(consentSeconds);return consent;},()=>allowed,()=>epoch,()=>now);actor.SetContext(new Dictionary<string,object>{{"accountId","a"},{"characterId","c"},{"accountLabel","account"},{"characterLabel","hero"}});}
   long Time(){return (long)(now-new DateTime(1970,1,1)).TotalMilliseconds;}
   object Frame(string kind,object data){return new {schemaVersion=1,kind=kind,observedAt=Time(),source="official-cli",data=data};}
   public Task<object> Read(string kind){now=now.AddSeconds(readSeconds);object data;
    if(kind=="activity")data=new {autoPlaying=false,autoTraveling=false,dead=false,reviving=false,inCombat=combat,dialoguePlaying=false,waitingForSelection=false,inBattlefield=false,tutorialPlaying=false,inScenario=false,sequencePlaying=false,performancePlaying=false,minigame=false,housingEdit=false,abyssSequence=false,dungeonState="NotInDungeon",interactionType="None"};
    else if(kind=="inventory")data=new {weight=overweight?100:10,maxWeight=100};
    else if(kind=="works")data=new {completedCount=0,items=registered?new object[]{new {name="wood",facility="mill",state="InProgress",completed=false,remainingSeconds=120}}:new object[0]};
    else if(kind=="gathering")data=new {items=new object[]{new {name="\uD1B5\uB098\uBB34",toolOk=true},new {name="unknown fish",toolOk=true}}};
    else data=new {unlocked=true,items=new object[]{new {name="wood",available=available,producedPerUnit=3,reason=(string)null,missing=(object)null}}};
    return Task.FromResult(Frame(kind,data));
   }
   public Task<object> Currency(){now=now.AddSeconds(readSeconds);return Task.FromResult<object>(new {observedAt=now.ToString("o"),items=new object[]{new {name="\uC815\uB839\uC758 \uB0A0\uAC1C",amount=wings}}});}
   public Task<object> Named(string name){now=now.AddSeconds(readSeconds);return Task.FromResult(Frame("materials",new {items=ownedCount==0?new object[0]:new object[]{new {name=name,category="Ingredient",categoryName="Material",location="inventory",count=ownedCount,locked=false}}}));}
   public Task<string> Perform(string action,string name){calls++;wings-=5;if(action=="altering")registered=true;if(action=="crafting"&&produce)ownedCount+=3;if(throwPerform)throw new IOException("synthetic response lost");if(onPerform!=null)onPerform();return Task.FromResult(receipt);}
   public Dictionary<string,object> Intent(string kind="crafting",string name="wood"){return new Dictionary<string,object>{{"accountId","a"},{"characterId","c"},{"action",kind},{"displayName",name}};}
   public async Task<Dictionary<string,object>> Prepare(string kind="crafting",string name="wood"){return Object(await actor.PrepareAsync(Intent(kind,name)));}
   public async Task<Dictionary<string,object>> Confirm(Dictionary<string,object> p){return Object(await actor.ConfirmAsync(new Dictionary<string,object>{{"nonce",p["nonce"]}}));}
   public async Task Wait(){for(int i=0;i<200&&actor.Busy;i++)await Task.Delay(5);Check(!actor.Busy,"Synthetic job did not finish");}
  }
  public static async Task Run(string root){
   var success=new Trial(Path.Combine(root,"completed"));var approval=await success.Prepare();Check(Convert.ToInt32(approval["expectedWings"])==5,"Command cost wrong");await success.Confirm(approval);await success.Wait();Check(success.calls==1,"Action not sent once");Check((string)Object(success.actor.State())["state"]=="completed","Completion not verified");Check(!success.journal.HasUnresolved(),"Completed record blocked");await Reject(()=>success.Confirm(approval));Check(success.calls==1,"Nonce replay sent action");
   var firstItem=new Trial(Path.Combine(root,"first-item"));firstItem.ownedCount=0;var firstPreview=await firstItem.Prepare();Check(Convert.ToInt32(firstPreview["owned"])==0,"Named empty stock was not zero");await firstItem.Confirm(firstPreview);await firstItem.Wait();Check((string)Object(firstItem.actor.State())["state"]=="completed","First-ever crafted stock was locked unknown");
   var overTarget=DesktopLifePolicy.Outcome("gathering","\uD1B5\uB098\uBB34","{\"status\":\"accepted\",\"body\":{\"result\":\"completed\",\"target\":3,\"gained\":4}}",new Dictionary<string,object>{{"items",new object[0]}},new LifePreflight());Check(overTarget=="completed","Over-target official gather result became unknown");
   var hiddenAfterSend=new Trial(Path.Combine(root,"hidden-after-send"));hiddenAfterSend.onPerform=()=>hiddenAfterSend.allowed=false;var hiddenPreview=await hiddenAfterSend.Prepare();await hiddenAfterSend.Confirm(hiddenPreview);await hiddenAfterSend.Wait();Check((string)Object(hiddenAfterSend.actor.State())["state"]=="completed","Hiding after dispatch discarded observed result");
   var cancel=new Trial(Path.Combine(root,"cancel"));cancel.consent=false;var no=await cancel.Prepare();Check((string)(await cancel.Confirm(no))["state"]=="cancelled"&&cancel.calls==0,"Cancel spent currency");
   var expire=new Trial(Path.Combine(root,"expire"));var expired=await expire.Prepare();expire.now=expire.now.AddSeconds(121);await Reject(()=>expire.Confirm(expired));Check(expire.calls==0,"Expired nonce executed");
   var late=new Trial(Path.Combine(root,"late-expiry"));late.readSeconds=2;var lated=await late.Prepare();late.consentSeconds=100;await Reject(()=>late.Confirm(lated));Check(late.calls==0,"Nonce expired during final recheck but executed");
   var stale=new Trial(Path.Combine(root,"stale-preflight"));stale.readSeconds=4;await Reject(()=>stale.Prepare());Check(stale.calls==0,"Mixed stale preflight accepted");
   var changed=new Trial(Path.Combine(root,"epoch"));var old=await changed.Prepare();changed.epoch++;await Reject(()=>changed.Confirm(old));Check(changed.calls==0,"Old document executed");
   var context=new Trial(Path.Combine(root,"context"));var wrong=await context.Prepare();context.actor.SetContext(new Dictionary<string,object>{{"accountId","b"},{"characterId","d"},{"accountLabel","other"},{"characterLabel","other"}});await Reject(()=>context.Confirm(wrong));Check(context.calls==0,"Foreign context executed");
   foreach(string condition in new[]{"combat","overweight","wings","recipe","hidden"}){var t=new Trial(Path.Combine(root,condition));var p=await t.Prepare();if(condition=="combat")t.combat=true;if(condition=="overweight")t.overweight=true;if(condition=="wings")t.wings=4;if(condition=="recipe")t.available=false;if(condition=="hidden")t.allowed=false;await Reject(()=>t.Confirm(p));Check(t.calls==0,"Preflight change sent command: "+condition);}
   var register=new Trial(Path.Combine(root,"registered"));register.receipt="{\"status\":\"accepted\",\"body\":{\"result\":\"started\"}}";var rp=await register.Prepare("altering");await register.Confirm(rp);await register.Wait();Check((string)Object(register.actor.State())["state"]=="registered","Registration became production completion");
   foreach(string output in new[]{"{\"status\":\"accepted\",\"body\":{\"result\":\"completed\",\"error\":\"timeout\"}}","{\"status\":\"accepted\",\"body\":{\"result\":\"started\"}}","{}"}){var t=new Trial(Path.Combine(root,Guid.NewGuid().ToString("N")));t.receipt=output;var p=await t.Prepare();await t.Confirm(p);await t.Wait();Check((string)Object(t.actor.State())["state"]=="unknown"&&t.journal.HasUnresolved(),"Unconfirmed action became success");await Reject(()=>t.actor.PrepareAsync(t.Intent()));Check(t.calls==1,"Unknown automatically retried");}
   var lost=new Trial(Path.Combine(root,"lost"));lost.throwPerform=true;var lp=await lost.Prepare();await lost.Confirm(lp);await lost.Wait();Check(lost.journal.HasUnresolved(),"Lost response cleared protected action");
   var silent=new Trial(Path.Combine(root,"silent-completion"));silent.produce=false;var sp=await silent.Prepare();await silent.Confirm(sp);await silent.Wait();Check((string)Object(silent.actor.State())["state"]=="unknown"&&silent.journal.HasUnresolved(),"Craft receipt without observed result was claimed complete");
   var rejectedSpent=new Trial(Path.Combine(root,"rejected-spent"));rejectedSpent.receipt="{\"status\":\"rejected\",\"body\":{\"error\":\"blocked\"}}";var rsp=await rejectedSpent.Prepare();await rejectedSpent.Confirm(rsp);await rejectedSpent.Wait();Check((string)Object(rejectedSpent.actor.State())["state"]=="unknown"&&rejectedSpent.journal.HasUnresolved(),"Rejected response after wing debit was treated as harmless");
   var invalid=new Trial(Path.Combine(root,"invalid"));var extra=invalid.Intent();extra["command"]="stop_action";await Reject(()=>invalid.actor.PrepareAsync(extra));await Reject(()=>invalid.actor.PrepareAsync(invalid.Intent("stop_action")));await Reject(()=>invalid.actor.PrepareAsync(invalid.Intent("gathering","unknown fish")));Check(invalid.calls==0,"Unapproved command/type was invoked");
   var cleanup=new Trial(Path.Combine(root,"cancel-nonce"));var first=await cleanup.Prepare();var second=await cleanup.Prepare();cleanup.actor.CancelPrepared(new Dictionary<string,object>{{"nonce",first["nonce"]}});await cleanup.Confirm(second);await cleanup.Wait();Check(cleanup.calls==1,"Old component cleanup cancelled a newer confirmation");
   var cancelCurrent=new Trial(Path.Combine(root,"cancel-current"));var pending=await cancelCurrent.Prepare();cancelCurrent.actor.CancelPrepared(new Dictionary<string,object>{{"nonce",pending["nonce"]}});await Reject(()=>cancelCurrent.Confirm(pending));Check(cancelCurrent.calls==0,"Cancelled confirmation executed");
   var switching=new Trial(Path.Combine(root,"running-context"));var chosen=await switching.Prepare();await switching.Confirm(chosen);await Reject(()=>Task.Run(()=>switching.actor.SetContext(new Dictionary<string,object>{{"accountId","b"},{"characterId","d"},{"accountLabel","other"},{"characterLabel","other"}})));await switching.Wait();Check(switching.calls==1,"Context changed while action was running");
   Console.WriteLine("PASS native actor completion/registration/cancel/nonce replay+expiry/epoch/context/preflight changes/unknown/lost response and allowlist");
  }
 }
}
