using System;using System.IO;using System.Threading;using System.Diagnostics;
namespace IrisDesktop {
 // Test-only: lends the EXISTING native game lease to an owned Node fixture.
 // No action Begin/terminal, game CLI, host source-list or bridge integration.
 public static class WoodProcessLeaseFixture {
  public static void Hold(string root){
   FileStream lease=null;var watch=Stopwatch.StartNew();bool contended=false;
   while(lease==null){try{var journal=new DesktopLifeJournal(Path.Combine(root,"native-process-lease"),"development",false);lease=journal.AcquireExecutionLease();}catch(IOException){if(!contended){Console.WriteLine("CONTENDED");Console.Out.Flush();contended=true;}if(watch.ElapsedMilliseconds>15000)throw;Thread.Sleep(20);}}
   using(lease){Console.WriteLine("OWNED");Console.Out.Flush();Console.In.ReadToEnd();}
  }
 }
}
