param()
$ErrorActionPreference='Stop'
$policy=Join-Path $PSScriptRoot 'desktop-addon-policy.cs'
$adapter=Join-Path $PSScriptRoot 'desktop-addon.cs'
if(!(Test-Path $policy)){throw 'Missing independent game window policy'}
Add-Type -AssemblyName System.Windows.Forms
$sources=@((Get-Content -LiteralPath $policy -Raw -Encoding UTF8),(Get-Content -LiteralPath $adapter -Raw -Encoding UTF8))
$sources+=@'
using System;
using System.Drawing;
using System.IO;
namespace IrisDesktop {
 public static class AddonFixture {
  static int passed;
  static void Check(bool condition,string why){if(!condition)throw new Exception(why);passed++;}
  static GameWindowObservation Game(bool? alive,bool minimized,int pid,long started){return new GameWindowObservation {ProcessId=pid,StartedAtTicks=started,Alive=alive,Minimized=minimized,Handle=new IntPtr(3),Frame=new Rectangle(100,100,500,600)};}
  public static int Run(string root){
   var work=new Rectangle(0,0,1600,900);var game=new Rectangle(400,100,500,600);
   var right=AddonWindowPolicy.Place(game,work,new Size(420,640),"right");Check(right.Attached&&right.ActualSide=="right"&&right.Bounds==new Rectangle(900,100,420,600),"Right docking bounds");
   var left=AddonWindowPolicy.Place(game,work,new Size(320,640),"left");Check(left.Attached&&left.Bounds==new Rectangle(80,100,320,600),"Left docking bounds");
   var fallback=AddonWindowPolicy.Place(new Rectangle(1050,0,550,800),work,new Size(420,640),"right");Check(fallback.Attached&&fallback.ActualSide=="left"&&fallback.Bounds.X==630,"Other side fallback");
   Check(!AddonWindowPolicy.Place(new Rectangle(0,0,1600,900),work,new Size(420,640),"right").Attached,"No room must not overlap game");
   Check(!AddonWindowPolicy.Place(game,work,new Size(420,640),"off").Attached,"Off must not dock");
   var negative=AddonWindowPolicy.Place(new Rectangle(-1700,20,700,1000),new Rectangle(-1920,0,1920,900),new Size(420,640),"right");Check(negative.Bounds==new Rectangle(-1000,0,420,900),"Negative monitor and height clamp");
   var session=new GameWindowSession();Check(!session.Observe(Game(true,false,10,100),false,false).RequestClose,"Initial discovery cannot close");
   Check(session.Observe(Game(true,true,10,100),false,false).Minimize,"Game minimize propagates");Check(!session.Observe(Game(true,true,10,100),false,false).Minimize,"Minimize event not repeated");Check(session.Observe(Game(true,false,10,100),false,false).Restore,"Game-origin minimized addon restores");
   session.Observe(Game(true,true,10,100),true,false);Check(!session.Observe(Game(true,false,10,100),true,false).Restore,"Manual hidden addon stays hidden");
   var missing=Game(null,false,10,100);missing.Handle=IntPtr.Zero;missing.Frame=null;Check(!session.Observe(missing,false,false).RequestClose,"Unknown liveness is not exit");
   missing.Alive=true;Check(!session.Observe(missing,false,false).RequestClose,"Handle replacement is not exit");
   Check(session.Observe(Game(false,false,10,100),false,false).RequestClose,"Confirmed process exit asks once");Check(!session.Observe(Game(false,false,10,100),false,false).RequestClose,"No repeated exit prompt");
   Check(!session.Observe(Game(true,true,10,200),false,true).Minimize,"Decision prevents new-session minimize");Check(!session.Observe(Game(true,false,10,200),false,true).Restore,"Decision prevents new-session restore");
   var prefs=new AddonPreferencesFile(root);bool valid;var initial=prefs.Load(out valid);Check(valid&&initial.DockSide=="right"&&initial.SameLayer,"Default prefs");
   Check(prefs.Save(new AddonWindowPreferences {DockSide="left",SameLayer=false}),"Save prefs");var restored=prefs.Load(out valid);Check(valid&&restored.DockSide=="left"&&!restored.SameLayer,"Reload prefs");
   Check(!prefs.Save(new AddonWindowPreferences {DockSide="arbitrary",SameLayer=true}),"Reject invalid side");
   File.WriteAllText(Path.Combine(root,"window-preferences-v1.json"),"{\"version\":1,\"dockSide\":\"right\",\"sameLayer\":true,\"handle\":42}");prefs.Load(out valid);Check(!valid,"Unknown prefs keys refused");
   File.WriteAllText(Path.Combine(root,"window-preferences-v1.json"),new string('x',4097));prefs.Load(out valid);Check(!valid,"Oversized prefs refused");
   return passed;
  }
 }
}
'@
$compiler=New-Object Microsoft.CSharp.CSharpCodeProvider
$parameters=New-Object System.CodeDom.Compiler.CompilerParameters
$parameters.GenerateInMemory=$true
$parameters.ReferencedAssemblies.AddRange([string[]]@('System.dll','System.Core.dll','System.Drawing.dll','System.Windows.Forms.dll','System.Web.Extensions.dll'))
try{
 $result=$compiler.CompileAssemblyFromSource($parameters,[string[]]$sources)
 if($result.Errors.HasErrors){throw (($result.Errors|Where-Object{!$_.IsWarning}|ForEach-Object{$_.ToString()}) -join [Environment]::NewLine)}
 $root=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-08-iris-addon-bar/prefs-'+[Guid]::NewGuid().ToString('N'))
 $count=[IrisDesktop.AddonFixture]::Run($root)
 Write-Output "Addon policy/preferences: $count passed; synthetic windows, no game control or browser session"
}finally{$compiler.Dispose()}
