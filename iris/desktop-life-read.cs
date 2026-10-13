using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace IrisDesktop {
    // Separate, read-only catalog boundary. Never dispatch browser command text.
    public static class DesktopLifeReader {
        const int Limit=1048576;
        static Dictionary<string,object> Object(object value){var row=value as Dictionary<string,object>;if(row==null||row.ContainsKey("pipe")||row.ContainsKey("error"))throw new ArgumentException();object status;var body=Field(row,"body") as Dictionary<string,object>;if(row.TryGetValue("status",out status)&&!Equals(status,"accepted"))throw new ArgumentException();if(body!=null&&(body.ContainsKey("error")||body.ContainsKey("pipe")))throw new ArgumentException();return row;}
        static object Field(Dictionary<string,object> row,string key){object value;return row.TryGetValue(key,out value)?value:null;}
        static object Nested(Dictionary<string,object> row,string key,string field){var inner=Field(row,key) as Dictionary<string,object>;return inner==null?null:Field(inner,field);}
        static object Text(object value,bool required=false){if(value==null&&!required)return null;var text=value as string;if(String.IsNullOrWhiteSpace(text)||text.Length>160)throw new ArgumentException();foreach(char c in text)if(c<32||c==127)throw new ArgumentException();return text;}
        static object Boolean(object value){if(value==null||value is bool)return value;throw new ArgumentException();}
        static object Number(object value,bool fraction=false){if(value==null)return null;if(value is bool||value is string)throw new ArgumentException();double n;if(!Double.TryParse(Convert.ToString(value,CultureInfo.InvariantCulture),NumberStyles.Float,CultureInfo.InvariantCulture,out n)||Double.IsNaN(n)||Double.IsInfinity(n)||n<0||n>9007199254740991d||(!fraction&&Math.Floor(n)!=n))throw new ArgumentException();return n;}
        static object[] Rows(object value,Func<Dictionary<string,object>,object> map){var array=value as object[];if(array==null||array.Length>2048)throw new ArgumentException();var result=new object[array.Length];for(int i=0;i<array.Length;i++)result[i]=map(Object(array[i]));return result;}
        static object Recipes(Dictionary<string,object> raw,bool craft){return new {unlocked=craft?Boolean(Field(raw,"craftingUnlocked")):null,items=Rows(Field(raw,"items"),r=>new {name=Text(Field(r,"DisplayName"),true),available=Boolean(Field(r,craft?"Craftable":"Alterable")),producedPerUnit=Number(Field(r,craft?"ProducedPerCraft":"ProducedPerWork")),reason=Text(Field(r,"Reason")),missing=Field(r,"MissingIngredients")==null?null:Rows(Field(r,"MissingIngredients"),m=>new {name=Text(Field(m,"DisplayName"),true),required=Number(Field(m,"Required")),owned=Number(Field(m,"Owned"))})})};}
        static string Command(string kind){switch(kind){case "activity":return "get_activity";case "inventory":return "get_inventory";case "works":return "get_altering_works";case "materials":return "get_items";case "gathering":return "get_gatherable_items";case "altering":return "get_alterable_items";case "crafting":return "get_craftable_items";default:throw new ArgumentException();}}
        public static object Normalize(string kind,string json){
            Command(kind);
            if(json==null||json.Length>Limit||Encoding.UTF8.GetByteCount(json)>Limit)throw new ArgumentException();
            var serializer=new JavaScriptSerializer {MaxJsonLength=Limit,RecursionLimit=16};
            var raw=serializer.DeserializeObject(json);object data;
            if(kind=="materials")data=new {items=Rows(raw,r=>{var location=Text(Field(r,"Location"),true) as string;if(location!="inventory"&&location!="account_storage"&&location!="character_storage")throw new ArgumentException();return new {name=Text(Field(r,"DisplayName"),true),category=Text(Field(r,"Category"),true),categoryName=Text(Field(r,"CategoryDisplayName")),location=location,count=Number(Field(r,"Count")),locked=Boolean(Field(r,"IsLocked"))};})};
            else {
                var r=Object(raw);
                switch(kind){
                    case "inventory":data=new {weight=Number(Field(r,"CurrentInventoryWeightAsDecimal")??Field(r,"CurrentInventoryWeight"),true),maxWeight=Number(Field(r,"MaxInventoryWeightAsDecimal")??Field(r,"MaxInventoryWeight"),true)};break;
                    case "gathering":data=new {items=Rows(Field(r,"items"),i=>new {name=Text(Field(i,"DisplayName"),true),toolOk=Boolean(Field(i,"ToolOk"))})};break;
                    case "works":data=new {completedCount=Number(Field(r,"completedCount")),items=Rows(Field(r,"works"),i=>new {name=Text(Field(i,"DisplayName"),true),facility=Text(Field(i,"FacilityName"),true),state=Text(Field(i,"State")),completed=Boolean(Field(i,"IsCompleted")),remainingSeconds=Number(Field(i,"RemainingSeconds"))})};break;
                    case "altering":case "crafting":data=Recipes(r,kind=="crafting");break;
                    case "activity":data=new {autoPlaying=Boolean(Field(r,"IsAutoPlaying")),autoTraveling=Boolean(Field(r,"IsAutoTraveling")),dead=Boolean(Field(r,"IsDead")),reviving=Boolean(Field(r,"IsReviving")),inCombat=Boolean(Field(r,"IsInCombat")),dialoguePlaying=Boolean(Field(r,"IsDialoguePlaying")),waitingForSelection=Boolean(Field(r,"IsWaitingForSelection")),inBattlefield=Boolean(Nested(r,"Battlefield","IsInBattleField")),tutorialPlaying=Boolean(Nested(r,"Tutorial","IsPlaying")),inScenario=Boolean(Nested(r,"Scenario","IsInScenario")),sequencePlaying=Boolean(Nested(r,"Scenario","IsSequencePlaying")),performancePlaying=Boolean(Nested(r,"Performance","IsPlaying")),minigame=Boolean(Nested(r,"Mode","IsPlayingMiniGame")),housingEdit=Boolean(Nested(r,"Mode","IsHousingEditMode")),abyssSequence=Boolean(Field(r,"IsAbyssResultSequencePlaying")),dungeonState=Text(Nested(r,"Dungeon","State")),interactionType=Text(Nested(r,"Interaction","LastRunningInteractionType")),mainButtonState=Text(Nested(r,"Mode","MainButtonState"))};break;
                    default:throw new ArgumentException();
                }
            }
            var snapshot=new {schemaVersion=1,kind=kind,observedAt=(long)(DateTime.UtcNow-new DateTime(1970,1,1)).TotalMilliseconds,source="official-cli",data=data};
            if(Encoding.UTF8.GetByteCount(serializer.Serialize(snapshot))>Limit-4096)throw new ArgumentException();
            return snapshot;
        }
        static async Task<string> BoundedRead(StreamReader stream){var text=new StringBuilder();var buffer=new char[2048];int n;while((n=await stream.ReadAsync(buffer,0,buffer.Length))>0){if(text.Length+n>Limit)throw new ArgumentException();text.Append(buffer,0,n);}var value=text.ToString();if(Encoding.UTF8.GetByteCount(value)>Limit)throw new ArgumentException();return value;}
        public static async Task<object> ReadAsync(string kind){
            var command=Command(kind);
            var path=Environment.GetEnvironmentVariable("MABINOGI_CLI_PATH");if(String.IsNullOrWhiteSpace(path))path=@"C:\Nexon\MabinogiMobile\MabinogiMobile_CLI.exe";
            if(!Path.IsPathRooted(path)||Path.GetFileName(path)!="MabinogiMobile_CLI.exe"||!File.Exists(path))throw new ArgumentException();
            // This body is constant, never derived from browser text.
            var arguments=command+(kind=="materials"?" \"{\\\"category\\\":\\\"Ingredient\\\"}\"":"");
            using(var process=new Process()){
                process.StartInfo=new ProcessStartInfo {FileName=path,Arguments=arguments,UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true,StandardOutputEncoding=Encoding.UTF8,StandardErrorEncoding=Encoding.UTF8};
                process.Start();try{
                    var stdout=BoundedRead(process.StandardOutput);var stderr=BoundedRead(process.StandardError);var exit=Task.Run(()=>process.WaitForExit());var all=Task.WhenAll(stdout,stderr,exit);
                    if(await Task.WhenAny(all,Task.Delay(8000))!=all)throw new ArgumentException();await all;if(process.ExitCode!=0)throw new ArgumentException();return Normalize(kind,await stdout);
                }finally{if(!process.HasExited)try{process.Kill();}catch{} }
            }
        }
    }
}
