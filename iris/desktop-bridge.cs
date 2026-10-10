using System;
using System.Collections.Generic;
using System.Globalization;
using System.Web.Script.Serialization;
using System.Threading.Tasks;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

namespace IrisDesktop {
    // No cookie, code, token, filesystem-path or generic invocation methods.
    public sealed class DesktopBridge {
        readonly DesktopStore store;
        readonly bool development;
        Uri document;
        long lastId;
        public long Epoch { get; private set; }
        public event EventHandler HideRequested;
        public event EventHandler CloseRequested;
        public event EventHandler DragRequested, MinimizeRequested;
        Func<object> addonState;Func<string,bool,bool> addonPreferences;Action<bool> addonDecision;
        public void BindAddon(Func<object> state,Func<string,bool,bool> preferences,Action<bool> decision){addonState=state;addonPreferences=preferences;addonDecision=decision;}
        Func<object> overlayState;Func<bool,bool> overlayInput;Func<int,bool> overlayOpacity;
        Func<Task<object>> gameRead,currencyRead; bool gameBusy;
        public void BindGameStats(Func<Task<object>> read){gameRead=read;}
        public void BindCurrencies(Func<Task<object>> read){currencyRead=read;}
        public async Task<string> HandleAsync(Uri source,string json){
            // Validate document/epoch/id synchronously before any asynchronous CLI work.
            var receipt=Handle(source,json);var serializer=new JavaScriptSerializer();
            var result=serializer.DeserializeObject(receipt) as Dictionary<string,object>;
            var marker=result!=null&&result.ContainsKey("value")?result["value"] as Dictionary<string,object>:null;
            if(marker==null||!marker.ContainsKey("gameReadPending"))return receipt;
            var epoch=Epoch;gameBusy=true;
            try{var value=await (marker.ContainsKey("currency")?currencyRead():gameRead());if(epoch!=Epoch||document==null)throw new ArgumentException();result["value"]=value;}
            catch{result["ok"]=false;result["value"]=null;result["error"]="game_stats_unavailable";}
            finally{gameBusy=false;}
            return serializer.Serialize(result);
        }
        public void BindOverlay(Func<object> state,Func<bool,bool> input,Func<int,bool> opacity){overlayState=state;overlayInput=input;overlayOpacity=opacity;}
        public DesktopBridge(DesktopStore store, bool development) {
            this.store = store; this.development = development; Epoch = 1;
        }
        public void Revoke() { document = null; lastId = 0; Epoch++; }
        public bool Activate(Uri source) {
            if (!DesktopHostPolicy.ValidateNavigation(source, development) || source.AbsolutePath != "/iris/desktop") return false;
            document = source; return true;
        }
        public string Handle(Uri source, string json) {
            var serializer = new JavaScriptSerializer { MaxJsonLength = 1052672, RecursionLimit = 32 };
            string id = ""; long epoch = 0;
            try {
                if (document == null || source == null || source.GetLeftPart(UriPartial.Path) != document.GetLeftPart(UriPartial.Path) ||
                    !DesktopHostPolicy.ValidateNavigation(source, development) || json == null || json.Length > 1052672) throw new ArgumentException();
                var message = serializer.DeserializeObject(json) as Dictionary<string, object>;
                if (message == null || message.Count != 5 || !message.ContainsKey("version") || !Equals(message["version"], 1) ||
                    !message.ContainsKey("id") || !message.ContainsKey("epoch") || !message.ContainsKey("method") || !message.ContainsKey("payload")) throw new ArgumentException();
                id = message["id"] as string; long sequence;
                if (id == null || !Int64.TryParse(id, NumberStyles.None, CultureInfo.InvariantCulture, out sequence) || sequence < 1 || sequence.ToString(CultureInfo.InvariantCulture) != id) throw new ArgumentException();
                if (!(message["epoch"] is int || message["epoch"] is long)) throw new ArgumentException();
                epoch = Convert.ToInt64(message["epoch"]);
                if (epoch != Epoch || sequence <= lastId || sequence > 9007199254740991L) throw new ArgumentException();
                lastId = sequence;
                object value = null;
                switch (message["method"] as string) {
                    case "store.capabilities":
                        if(message["payload"]!=null)throw new ArgumentException();value=new Dictionary<string,object>{{"schemaVersion",3},{"barter",true},{"workspace",true}};break;
                    case "window.addon.state":
                        if(message["payload"]!=null||addonState==null)throw new ArgumentException();value=addonState();break;
                    case "window.addon.preferences":
                        var prefs=message["payload"] as Dictionary<string,object>;
                        if(prefs==null||prefs.Count!=2||!prefs.ContainsKey("dockSide")||!prefs.ContainsKey("sameLayer")||!(prefs["sameLayer"] is bool)||addonPreferences==null)throw new ArgumentException();
                        string side=prefs["dockSide"] as string;if((side!="right"&&side!="left"&&side!="off")||!addonPreferences(side,(bool)prefs["sameLayer"]))throw new ArgumentException();value=addonState();break;
                    case "window.decision":
                        var decision=message["payload"] as Dictionary<string,object>;
                        if(decision==null||decision.Count!=1||!decision.ContainsKey("open")||!(decision["open"] is bool)||addonDecision==null)throw new ArgumentException();addonDecision((bool)decision["open"]);break;
                    case "window.drag":
                        if(message["payload"]!=null||addonState==null)throw new ArgumentException();if(DragRequested!=null)DragRequested(this,EventArgs.Empty);break;
                    case "window.minimize":
                        if(message["payload"]!=null||addonState==null)throw new ArgumentException();if(MinimizeRequested!=null)MinimizeRequested(this,EventArgs.Empty);break;
                    case "game.stats.read":
                        if(message["payload"]!=null||gameRead==null||gameBusy)throw new ArgumentException();
                        value=new {gameReadPending=true};break;
                    case "game.currencies.read":
                        if(message["payload"]!=null||currencyRead==null||gameBusy)throw new ArgumentException();
                        value=new {gameReadPending=true,currency=true};break;
                    case "store.load":
                        if (message["payload"] != null) throw new ArgumentException();
                        var restored = store.Load(); value = restored == null ? null : serializer.DeserializeObject(restored); break;
                    case "store.replace":
                        store.Replace(serializer.Serialize(message["payload"])); break;
                    case "window.hide":
                        if (message["payload"] != null) throw new ArgumentException();
                        var handler = HideRequested; if (handler != null) handler(this, EventArgs.Empty); break;
                    case "window.close":
                        if (message["payload"] != null) throw new ArgumentException();
                        var close = CloseRequested; if (close != null) close(this, EventArgs.Empty); break;
                    case "overlay.state":
                        if(message["payload"]!=null||overlayState==null)throw new ArgumentException();value=overlayState();break;
                    case "overlay.input":
                        var input=message["payload"] as Dictionary<string,object>;
                        if(input==null||input.Count!=1||!input.ContainsKey("clickThrough")||!(input["clickThrough"] is bool)||overlayInput==null||!overlayInput((bool)input["clickThrough"]))throw new ArgumentException();
                        value=overlayState();break;
                    case "overlay.opacity":
                        var opacity=message["payload"] as Dictionary<string,object>;
                        if(opacity==null||opacity.Count!=1||!opacity.ContainsKey("percent")||!(opacity["percent"] is int)||overlayOpacity==null)throw new ArgumentException();
                        int percent=(int)opacity["percent"];if(percent<50||percent>100||!overlayOpacity(percent))throw new ArgumentException();value=overlayState();break;
                    default: throw new ArgumentException();
                }
                return serializer.Serialize(new { version = 1, id = id, epoch = epoch, ok = true, value = value });
            } catch {
                // Never serialize exceptions containing local paths, ciphertext or user data.
                return serializer.Serialize(new { version = 1, id = id ?? "", epoch = epoch, ok = false, error = "protected_store_unavailable" });
            }
        }
    }
    // One fixed, read-only official CLI command; no browser-supplied paths or arguments.
    public static class DesktopGameStatsReader {
        static async Task<string> BoundedRead(StreamReader reader){var result=new StringBuilder();var buffer=new char[2048];int count;while((count=await reader.ReadAsync(buffer,0,buffer.Length))>0){if(result.Length+count>65536)throw new ArgumentException();result.Append(buffer,0,count);}return result.ToString();}
        static object Score(object value){
            var dict=value as Dictionary<string,object>;if(dict!=null){if(!dict.TryGetValue("Value",out value))return null;}
            if(value==null||value is bool)return null;
            var text=Convert.ToString(value,CultureInfo.InvariantCulture);if(!Regex.IsMatch(text,@"^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,6})?$"))return null;
            double score;if(!Double.TryParse(text.Replace(",",""),NumberStyles.AllowDecimalPoint,CultureInfo.InvariantCulture,out score)||score<0||score>1000000000||Double.IsInfinity(score)||Double.IsNaN(score))return null;return score;
        }
        public static object Normalize(string json){
            var raw=new JavaScriptSerializer {MaxJsonLength=65536,RecursionLimit=16}.DeserializeObject(json) as Dictionary<string,object>;
            if(raw==null||raw.ContainsKey("pipe"))throw new ArgumentException();
            var stats=new Dictionary<string,object>();var fields=new[]{"CombatScore","LivingScore","ArcaneResistance","AttractivenessScore"};var keys=new[]{"combat_power","life_energy","magic_resistance","charm"};bool any=false;
            for(int i=0;i<fields.Length;i++){object value;raw.TryGetValue(fields[i],out value);stats[keys[i]]=Score(value);any=any||stats[keys[i]]!=null;}if(!any)throw new ArgumentException();
            object job,level;raw.TryGetValue("EnabledCombatJobDisplayName",out job);raw.TryGetValue("Level",out level);var name=job as string;if(String.IsNullOrWhiteSpace(name))name="직업 확인 불가";if(name.Length>60||Regex.IsMatch(name,@"[\x00-\x1f]"))throw new ArgumentException();
            return new {observedAt=DateTime.UtcNow.ToString("o"),job=name,level=Score(level),stats=stats};
        }
        public static Task<object> ReadAsync(){return ReadFixed("get_my_info",Normalize);}
        public static Task<object> ReadCurrenciesAsync(){return ReadFixed("get_currencies",NormalizeCurrencies);}
        public static object NormalizeCurrencies(string json){
            var raw=new JavaScriptSerializer {MaxJsonLength=65536,RecursionLimit=16}.DeserializeObject(json) as object[];
            if(raw==null||raw.Length>200)throw new ArgumentException();
            var items=new List<object>();var names=new HashSet<string>();
            foreach(var entry in raw){var row=entry as Dictionary<string,object>;object nameValue,amount;if(row==null||!row.TryGetValue("DisplayName",out nameValue))throw new ArgumentException();var name=nameValue as string;
                if(String.IsNullOrWhiteSpace(name)||name.Length>120||Regex.IsMatch(name,@"[\x00-\x1f]")||!names.Add(name))throw new ArgumentException();
                row.TryGetValue("Amount",out amount);object normalized=null;if(amount!=null){if(amount is bool)throw new ArgumentException();decimal number;if(!Decimal.TryParse(Convert.ToString(amount,CultureInfo.InvariantCulture),NumberStyles.Number,CultureInfo.InvariantCulture,out number)||number<0||number>9007199254740991m||Decimal.Truncate(number)!=number)throw new ArgumentException();normalized=number;}
                items.Add(new {name=name,amount=normalized});
            }
            return new {observedAt=DateTime.UtcNow.ToString("o"),items=items};
        }
        static async Task<object> ReadFixed(string command,Func<string,object> normalize){
            var path=Environment.GetEnvironmentVariable("MABINOGI_CLI_PATH");if(String.IsNullOrWhiteSpace(path))path=@"C:\Nexon\MabinogiMobile\MabinogiMobile_CLI.exe";
            if(!Path.IsPathRooted(path)||Path.GetFileName(path)!="MabinogiMobile_CLI.exe"||!File.Exists(path))throw new ArgumentException();
            using(var process=new Process()){process.StartInfo=new ProcessStartInfo {FileName=path,Arguments=command,UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true,StandardOutputEncoding=Encoding.UTF8,StandardErrorEncoding=Encoding.UTF8};
                process.Start();try{var stdout=BoundedRead(process.StandardOutput);var stderr=BoundedRead(process.StandardError);var exit=Task.Run(()=>process.WaitForExit());var all=Task.WhenAll(stdout,stderr,exit);
                    if(await Task.WhenAny(all,Task.Delay(8000))!=all)throw new ArgumentException();await all;if(process.ExitCode!=0)throw new ArgumentException();return normalize(await stdout);
                }finally{if(!process.HasExited){try{process.Kill();}catch{}}}
            }
        }
    }
}
