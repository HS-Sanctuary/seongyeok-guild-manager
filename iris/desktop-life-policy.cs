using System;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using System.Globalization;
using System.Web.Script.Serialization;

namespace IrisDesktop {
 public sealed class LifeActionException:Exception {public string Code {get;private set;}public LifeActionException(string code):base(code){Code=code;}}
 public sealed class LifePreflight {
  public long wings;public int? expectedWings;public int outputPerRun;public int craftCount=1;public long? owned;public string facility;public Dictionary<string,int> completedNames=new Dictionary<string,int>();public int pendingBefore;
 }
 public static class DesktopLifePolicy {
  static readonly string[] Flags={"autoPlaying","autoTraveling","dead","reviving","inCombat","dialoguePlaying","waitingForSelection","inBattlefield","tutorialPlaying","inScenario","sequencePlaying","performancePlaying","minigame","housingEdit","abyssSequence"};
  public static void Fail(string code){throw new LifeActionException(code);}
  public static Dictionary<string,object> Object(object value){var row=value as Dictionary<string,object>;if(row==null)Fail("life_invalid");return row;}
  public static Dictionary<string,object> Plain(object value){var json=new JavaScriptSerializer {MaxJsonLength=1048576,RecursionLimit=16};var text=json.Serialize(value);if(Encoding.UTF8.GetByteCount(text)>1048576)Fail("life_invalid");return Object(json.DeserializeObject(text));}
  public static object Get(Dictionary<string,object> row,string key){object value;return row.TryGetValue(key,out value)?value:null;}
  public static string Text(object value,int max=160){var text=value as string;if(String.IsNullOrWhiteSpace(text)||text.Length>max||text.Any(c=>c<32||c==127))Fail("life_invalid");return text;}
  public static long Integer(object value,long min=0,long max=9007199254740991L){if(!(value is int||value is long||value is decimal||value is double))Fail("life_invalid");decimal n;try{n=Convert.ToDecimal(value,CultureInfo.InvariantCulture);}catch{Fail("life_invalid");return 0;}if(n<min||n>max||Decimal.Truncate(n)!=n)Fail("life_invalid");return (long)n;}
  public static void Exact(Dictionary<string,object> row,params string[] fields){if(row.Count!=fields.Length||fields.Any(key=>!row.ContainsKey(key)))Fail("life_invalid");}
  public static long Time(DateTime now){return (long)(now.ToUniversalTime()-new DateTime(1970,1,1,0,0,0,DateTimeKind.Utc)).TotalMilliseconds;}
  public static Dictionary<string,object> Data(object value,string kind,DateTime now){var frame=Plain(value);Exact(frame,"schemaVersion","kind","observedAt","source","data");if(!Equals(frame["schemaVersion"],1)||!Equals(frame["kind"],kind)||!Equals(frame["source"],"official-cli"))Fail("life_invalid");long age=Time(now)-Integer(frame["observedAt"],1);if(age<0||age>=15000)Fail("life_stale");return Object(frame["data"]);}
  public static object[] Items(Dictionary<string,object> data){var items=Get(data,"items") as object[];if(items==null||items.Length>2048)Fail("life_invalid");return items;}
  // LastRunningInteractionType describes history. Only a known idle main button and all idle flags allow preparation.
  public static void SafeActivity(Dictionary<string,object> data){if(!Equals(Get(data,"dungeonState"),"NotInDungeon")||!Equals(Get(data,"mainButtonState"),"Compass")||Flags.Any(key=>!Equals(Get(data,key),false)))Fail("life_game_blocked");}
  public static void InventoryRoom(Dictionary<string,object> data){var weight=Get(data,"weight");var maximum=Get(data,"maxWeight");if(weight==null||maximum==null||weight is bool||maximum is bool||weight is string||maximum is string)Fail("life_weight_unknown");double w,m;try{w=Convert.ToDouble(weight,CultureInfo.InvariantCulture);m=Convert.ToDouble(maximum,CultureInfo.InvariantCulture);}catch{Fail("life_weight_unknown");return;}if(Double.IsNaN(w)||Double.IsNaN(m)||Double.IsInfinity(w)||Double.IsInfinity(m)||w<0||m<=0||w>=m)Fail("life_overweight");}
  public static long Wings(object value,DateTime now){var currency=Plain(value);DateTimeOffset observed=default(DateTimeOffset);var text=Get(currency,"observedAt") as string;if(text==null||!DateTimeOffset.TryParse(text,CultureInfo.InvariantCulture,DateTimeStyles.None,out observed))Fail("life_currency_unknown");double age=(now.ToUniversalTime()-observed.UtcDateTime).TotalMilliseconds;if(age<0||age>=15000)Fail("life_stale");var rows=Items(currency).Select(Object).Where(row=>Equals(Get(row,"name"),"\uC815\uB839\uC758 \uB0A0\uAC1C")).ToArray();if(rows.Length!=1||Get(rows[0],"amount")==null)Fail("life_currency_unknown");return Integer(rows[0]["amount"]);}
  public static LifePreflight Target(string action,string name,Dictionary<string,object> catalog,Dictionary<string,object> works,long wings){
   var result=new LifePreflight {wings=wings,expectedWings=action=="collect"?(int?)null:5};
   if(action!="collect"&&wings<5)Fail("life_not_enough_wings");
   if(action=="collect"){
    var rows=Items(works).Select(Object).ToArray();var matches=rows.Where(row=>Equals(Get(row,"name"),name)&&Equals(Get(row,"completed"),true)).ToArray();
    if(matches.Length==0)Fail("life_not_completed");var facilities=matches.Select(row=>Text(Get(row,"facility"))).Distinct().ToArray();if(facilities.Length!=1)Fail("life_ambiguous");result.facility=facilities[0];
    foreach(var row in rows.Where(row=>Equals(Get(row,"facility"),result.facility)&&Equals(Get(row,"completed"),true))){var item=Text(Get(row,"name"));int count;result.completedNames.TryGetValue(item,out count);result.completedNames[item]=count+1;}
    if(result.completedNames.Count>32||result.completedNames.Keys.Sum(s=>s.Length)>1000)Fail("life_preview_limit");return result;
   }
   var candidates=Items(catalog).Select(Object).Where(row=>Equals(Get(row,"name"),name)).ToArray();if(candidates.Length!=1)Fail("life_ambiguous");var target=candidates[0];
   if(action=="gathering"){
    // First verified regular-gather sample from the official CLI contract. Fishing has no finite goal.
    if(name!="\uD1B5\uB098\uBB34")Fail("life_gathering_unverified");if(!Equals(Get(target,"toolOk"),true))Fail("life_tool_missing");return result;
   }
   if(action!="altering"&&action!="crafting")Fail("life_unsupported");
   if(!Equals(Get(target,"available"),true)||(action=="crafting"&&!Equals(Get(catalog,"unlocked"),true)))Fail("life_not_available");
   result.outputPerRun=(int)Integer(Get(target,"producedPerUnit"),1,1000000);
   if(action=="altering")result.pendingBefore=Items(works).Select(Object).Count(row=>Equals(Get(row,"name"),name)&&Equals(Get(row,"completed"),false));
   return result;
  }
  public static long? Owned(Dictionary<string,object> named,string name){var rows=Items(named).Select(Object).Where(row=>Equals(Get(row,"name"),name)).ToArray();if(rows.Select(row=>Get(row,"category") as string).Distinct().Count()>1)Fail("life_ambiguous_output");long count=0;foreach(var row in rows.Where(row=>Equals(Get(row,"location"),"inventory"))){if(!Equals(Get(row,"locked"),false))Fail("life_output_locked");count=checked(count+Integer(Get(row,"count")));if(count>9007199254740991L)Fail("life_invalid");}return count;}
  // get_items intentionally excludes equipment. Absence cannot establish a zero equipment inventory.
  public static long? CraftOwned(Dictionary<string,object> named,string name){if(!Items(named).Select(Object).Any(row=>Equals(Get(row,"name"),name)))return null;return Owned(named,name);}
  public static long GatherStock(Dictionary<string,object> named,string name){
   var rows=Items(named).Select(Object).ToArray();if(rows.Any(row=>!Equals(Get(row,"name"),name)||!Equals(Get(row,"category"),"Ingredient")||!new[]{"inventory","account_storage","character_storage"}.Contains(Get(row,"location") as string)))Fail("life_ambiguous_output");
   var inventory=rows.Where(row=>Equals(Get(row,"location"),"inventory")).ToArray();if(inventory.Length>1)Fail("life_ambiguous_output");
   if(inventory.Length==0)return 0;if(!Equals(Get(inventory[0],"locked"),false))Fail("life_output_locked");return Integer(Get(inventory[0],"count"));
  }
  public static bool GatherActivity(Dictionary<string,object> data){
   if(!Equals(Get(data,"dungeonState"),"NotInDungeon")||Flags.Where(key=>key!="autoTraveling").Any(key=>!Equals(Get(data,key),false)))Fail("life_game_changed");
   string mode=Get(data,"mainButtonState") as string;
   if(mode=="Stop"){if(!Equals(Get(data,"interactionType"),"Gathering")||!Equals(Get(data,"autoTraveling"),false))Fail("life_game_changed");return true;}
   if(mode!="Compass"&&mode!="Hide")Fail("life_game_changed");return false;
  }
  public static string StopResult(string raw){try{var root=Object(new JavaScriptSerializer().DeserializeObject(raw));var body=Get(root,"body") as Dictionary<string,object>;if(body==null)return "unknown";if(Equals(Get(body,"error"),"invalid_state"))return "invalid_state";return Equals(Get(root,"status"),"accepted")&&!body.ContainsKey("error")?"requested":"unknown";}catch{return "unknown";}}
  public static string Outcome(string action,string name,string raw,Dictionary<string,object> afterWorks,LifePreflight before){
   Dictionary<string,object> root;try{root=Object(new JavaScriptSerializer {MaxJsonLength=1048576,RecursionLimit=16}.DeserializeObject(raw));}catch{return "unknown";}
   var body=Get(root,"body") as Dictionary<string,object>;if(body==null)return "unknown";
   if(Equals(Get(root,"status"),"rejected")||Equals(Get(root,"status"),"invalid_body"))return "rejected";
   if(!Equals(Get(root,"status"),"accepted")||body.ContainsKey("error"))return "unknown";
   if(action=="altering")return Equals(Get(body,"result"),"started")&&Items(afterWorks).Select(Object).Count(row=>Equals(Get(row,"name"),name)&&Equals(Get(row,"completed"),false))>before.pendingBefore?"registered":"unknown";
   if(action=="crafting"){try{return Equals(Get(body,"result"),"completed")&&Integer(Get(body,"craftCount"),1,5)==before.craftCount?"completed":"unknown";}catch{return "unknown";}}
   if(action=="gathering"){
    if(Equals(Get(body,"result"),"stopped"))return "stopped";
    if(!Equals(Get(body,"result"),"completed"))return "unknown";try{long gained=Integer(Get(body,"gained"),1),target=Integer(Get(body,"target"),1,100);return gained>=target?"completed":"unknown";}catch{return "unknown";}
   }
   if(action=="collect"){
    var collected=Get(body,"collected");bool confirmed=Equals(collected,true);if(!confirmed&&collected!=null)try{confirmed=Integer(collected,1,2048)>0;}catch{}
    int pending=Items(afterWorks).Select(Object).Count(row=>Equals(Get(row,"facility"),before.facility)&&Equals(Get(row,"completed"),true));return confirmed&&pending<before.completedNames.Values.Sum()?"completed":"unknown";
   }
   return "unknown";
  }
 }
}
