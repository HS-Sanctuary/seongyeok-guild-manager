using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace IrisDesktop {
 public static class DesktopLifeCli {
  const int Limit=1048576;
  static string PathToCli(){var path=Environment.GetEnvironmentVariable("MABINOGI_CLI_PATH");if(String.IsNullOrWhiteSpace(path))path=@"C:\Nexon\MabinogiMobile\MabinogiMobile_CLI.exe";if(!Path.IsPathRooted(path)||Path.GetFileName(path)!="MabinogiMobile_CLI.exe"||!File.Exists(path))throw new ArgumentException();return path;}
  public static string QuoteArgument(string value){
   var result=new StringBuilder("\"");int slashes=0;
   foreach(char c in value){if(c=='\\'){slashes++;continue;}if(c=='\"'){result.Append('\\',slashes*2+1);result.Append(c);}else{result.Append('\\',slashes);result.Append(c);}slashes=0;}
   result.Append('\\',slashes*2);result.Append('"');return result.ToString();
  }
  static void Name(string value){if(String.IsNullOrWhiteSpace(value)||value.Length>160||value.Any(c=>c<32||c==127))throw new ArgumentException();}
  static async Task<string> Bounded(StreamReader stream){var text=new StringBuilder();var buffer=new char[4096];int n;while((n=await stream.ReadAsync(buffer,0,buffer.Length))>0){if(text.Length+n>Limit)throw new IOException("CLI output limit");text.Append(buffer,0,n);}var result=text.ToString();if(Encoding.UTF8.GetByteCount(result)>Limit)throw new IOException("CLI output limit");return result;}
  static async Task<string> Run(string command,string body,int timeout){
   using(var process=new Process()){
    process.StartInfo=new ProcessStartInfo {FileName=PathToCli(),Arguments=command+(body==null?"":" "+QuoteArgument(body)),UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true,StandardOutputEncoding=Encoding.UTF8,StandardErrorEncoding=Encoding.UTF8};
    process.Start();using(var registration=DesktopCliActivity.Track(process.Id,command=="get_items"))try{
     var output=Bounded(process.StandardOutput);var errors=Bounded(process.StandardError);var exit=Task.Run(()=>process.WaitForExit());var all=Task.WhenAll(output,errors,exit);
     // Detect a broken/oversized stream without waiting for its blocked writer to exit.
     var deadline=Task.Delay(timeout);var first=await Task.WhenAny(all,deadline,output,errors);
     if(first==output&&output.IsFaulted)await output;if(first==errors&&errors.IsFaulted)await errors;
     if(first!=all){var finish=await Task.WhenAny(all,deadline);if(finish!=all)throw new TimeoutException("CLI result unknown");}
     await all;if(process.ExitCode!=0)throw new IOException("CLI result unavailable");return await output;
    }finally{
     // Only release this CLI response process. This does NOT stop the game's action.
     // The executor durably marks a lost/timeout response unknown and forbids retries.
     if(!process.HasExited)try{process.Kill();}catch{}
    }
   }
  }
  public static async Task<object> ReadNamedItemsAsync(string displayName){Name(displayName);var body=new JavaScriptSerializer().Serialize(new {name=displayName});return DesktopLifeReader.Normalize("materials",await Run("get_items",body,8000));}
  public static Task<string> StopAsync(){return Run("stop_action",null,8000);}
  public static Task<string> CraftAsync(string displayName,int craftCount){Name(displayName);if(craftCount<1||craftCount>5)throw new ArgumentException();return Run("execute_crafting",new JavaScriptSerializer().Serialize(new {displayName=displayName,craftCount=craftCount}),600000);}
  public static Task<string> PerformAsync(string action,string displayName){
   Name(displayName);string command;
   switch(action){case "gathering":command="execute_gathering";break;case "altering":command="execute_altering";break;case "crafting":command="execute_crafting";break;case "collect":command="complete_altering_work";break;default:throw new ArgumentException();}
   var body=new Dictionary<string,object>{{"displayName",displayName}};if(action=="crafting")body.Add("craftCount",1);
   return Run(command,new JavaScriptSerializer().Serialize(body),600000);
  }
 }
}
