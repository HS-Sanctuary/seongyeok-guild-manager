using System;
using System.Linq;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
using System.ComponentModel;
using System.Runtime.InteropServices;
namespace IrisDesktop {
 public static class DesktopCliActivity {
  static readonly object Gate=new object();static readonly Dictionary<int,bool> Active=new Dictionary<int,bool>();
  sealed class Registration:IDisposable {readonly int id;public Registration(int id){this.id=id;}public void Dispose(){lock(Gate)Active.Remove(id);}}
  public static IDisposable Track(int processId,bool readOnly){if(processId<=0)throw new ArgumentException();lock(Gate){if(Active.ContainsKey(processId))throw new InvalidOperationException();Active.Add(processId,readOnly);}return new Registration(processId);}
  [StructLayout(LayoutKind.Sequential)]struct FileTime {public uint Low,High;}
  [DllImport("kernel32.dll",SetLastError=true)]static extern IntPtr OpenProcess(uint access,[MarshalAs(UnmanagedType.Bool)]bool inherit,int id);
  [DllImport("kernel32.dll",SetLastError=true)][return:MarshalAs(UnmanagedType.Bool)]static extern bool GetProcessTimes(IntPtr process,out FileTime creation,out FileTime exit,out FileTime kernel,out FileTime user);
  [DllImport("kernel32.dll")][return:MarshalAs(UnmanagedType.Bool)]static extern bool CloseHandle(IntPtr handle);
  // Identity metadata only: no memory, debug privilege, process control, or elevated fallback.
  // Framework Process.HasExited/StartTime asks for broader access and fails on this game.
  static long ProcessStartedAt(int id){
   if(id<=0)throw new ArgumentException();var handle=OpenProcess(0x1000,false,id);if(handle==IntPtr.Zero)throw new Win32Exception(Marshal.GetLastWin32Error());
   try{FileTime creation,exit,kernel,user;if(!GetProcessTimes(handle,out creation,out exit,out kernel,out user))throw new Win32Exception(Marshal.GetLastWin32Error());if(exit.Low!=0||exit.High!=0)throw new InvalidOperationException();return DateTime.FromFileTimeUtc(((long)creation.High<<32)|creation.Low).Ticks;}finally{CloseHandle(handle);}
  }
  public static bool HasUnclassifiedOrActionCli(){
   try{lock(Gate){if(Active.Values.Any(readOnly=>!readOnly))return true;var processes=Process.GetProcessesByName("MabinogiMobile_CLI");try{foreach(var p in processes){bool readOnly;if(!p.HasExited&&(!Active.TryGetValue(p.Id,out readOnly)||!readOnly))return true;}}finally{foreach(var p in processes)p.Dispose();}return false;}}catch{return true;}
  }
  public static async Task<bool> WaitForReadsAsync(int timeoutMs){if(timeoutMs<0||timeoutMs>10000)throw new ArgumentException();var timer=Stopwatch.StartNew();while(true){lock(Gate)if(Active.Count==0)return !HasUnclassifiedOrActionCli();if(HasUnclassifiedOrActionCli()||timer.ElapsedMilliseconds>=timeoutMs)return false;await Task.Delay(50);}}
  // No process control or game memory access. Ambiguous/missing game ownership is not evidence.
  public static async Task<Dictionary<string,object>> ProbeAsync(Func<Task<object>> readActivity){
   int id;long started;var games=Process.GetProcessesByName("MabinogiMobile");try{if(games.Length!=1)throw new InvalidOperationException();id=games[0].Id;started=ProcessStartedAt(id);}finally{foreach(var p in games)p.Dispose();}
   if(HasUnclassifiedOrActionCli())throw new InvalidOperationException();var activity=await readActivity();
   if(ProcessStartedAt(id)!=started)throw new InvalidOperationException();
   return new Dictionary<string,object>{{"gameProcessId",id},{"gameStartedAt",started},{"cliAbsent",!HasUnclassifiedOrActionCli()},{"activity",activity}};
  }
 }
}
