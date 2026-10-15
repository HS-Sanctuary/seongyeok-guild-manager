using System;
using System.Linq;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
namespace IrisDesktop {
 public static class DesktopCliActivity {
  static readonly object Gate=new object();static readonly Dictionary<int,bool> Active=new Dictionary<int,bool>();
  sealed class Registration:IDisposable {readonly int id;public Registration(int id){this.id=id;}public void Dispose(){lock(Gate)Active.Remove(id);}}
  public static IDisposable Track(int processId,bool readOnly){if(processId<=0)throw new ArgumentException();lock(Gate){if(Active.ContainsKey(processId))throw new InvalidOperationException();Active.Add(processId,readOnly);}return new Registration(processId);}
  public static bool HasUnclassifiedOrActionCli(){
   try{lock(Gate){if(Active.Values.Any(readOnly=>!readOnly))return true;var processes=Process.GetProcessesByName("MabinogiMobile_CLI");try{foreach(var p in processes){bool readOnly;if(!p.HasExited&&(!Active.TryGetValue(p.Id,out readOnly)||!readOnly))return true;}}finally{foreach(var p in processes)p.Dispose();}return false;}}catch{return true;}
  }
  public static async Task<bool> WaitForReadsAsync(int timeoutMs){if(timeoutMs<0||timeoutMs>10000)throw new ArgumentException();var timer=Stopwatch.StartNew();while(true){lock(Gate)if(Active.Count==0)return !HasUnclassifiedOrActionCli();if(HasUnclassifiedOrActionCli()||timer.ElapsedMilliseconds>=timeoutMs)return false;await Task.Delay(50);}}
  // No process control or game memory access. Ambiguous/missing game ownership is not evidence.
  public static async Task<Dictionary<string,object>> ProbeAsync(Func<Task<object>> readActivity){
   int id;long started;var games=Process.GetProcessesByName("MabinogiMobile");try{if(games.Length!=1||games[0].HasExited)throw new InvalidOperationException();id=games[0].Id;started=games[0].StartTime.ToUniversalTime().Ticks;}finally{foreach(var p in games)p.Dispose();}
   if(HasUnclassifiedOrActionCli())throw new InvalidOperationException();var activity=await readActivity();
   using(var p=Process.GetProcessById(id))if(p.HasExited||p.StartTime.ToUniversalTime().Ticks!=started)throw new InvalidOperationException();
   return new Dictionary<string,object>{{"gameProcessId",id},{"gameStartedAt",started},{"cliAbsent",!HasUnclassifiedOrActionCli()},{"activity",activity}};
  }
 }
}
