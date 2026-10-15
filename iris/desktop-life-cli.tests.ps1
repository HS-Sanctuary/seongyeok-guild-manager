$ErrorActionPreference='Stop'
$taskSource=Join-Path $PSScriptRoot 'desktop-life-cli.cs'
if(!(Test-Path $taskSource)){throw 'Fixed life CLI boundary missing'}
Add-Type -Path @($taskSource,(Join-Path $PSScriptRoot 'desktop-life-read.cs'),(Join-Path $PSScriptRoot 'desktop-cli-activity.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions')
$taskRoot=[IO.Path]::GetFullPath((Join-Path (Join-Path $PSScriptRoot '../.superpowers') ('life-cli-'+[guid]::NewGuid().ToString('N'))))
[void][IO.Directory]::CreateDirectory($taskRoot)
$taskExe=Join-Path $taskRoot 'MabinogiMobile_CLI.exe'
$taskProgram=@'
using System;using System.Text;using System.Web.Script.Serialization;
public static class FakeCli {public static void Main(string[] args){Console.OutputEncoding=new UTF8Encoding(false);var json=new JavaScriptSerializer();if(args[0]=="stop_action"){Console.Write(json.Serialize(new {command=args[0],argumentCount=args.Length}));return;}var body=json.DeserializeObject(args[1]) as System.Collections.Generic.Dictionary<string,object>;var name=(string)body[args[0]=="get_items"?"name":"displayName"];if(name=="sleep")System.Threading.Thread.Sleep(12000);if(args[0]=="get_items")Console.Write(json.Serialize(new object[]{new {DisplayName=name,Category="Food",CategoryDisplayName="Food",Location="inventory",Count=3,IsLocked=false}}));else Console.Write(json.Serialize(new {command=args[0],name=name,craftCount=body.ContainsKey("craftCount")?body["craftCount"]:null}));}}
'@
Add-Type -TypeDefinition $taskProgram -ReferencedAssemblies @('System.Web.Extensions') -OutputAssembly $taskExe -OutputType ConsoleApplication
$taskBefore=[Environment]::GetEnvironmentVariable('MABINOGI_CLI_PATH')
try{
 [Environment]::SetEnvironmentVariable('MABINOGI_CLI_PATH',$taskExe)
 $taskStop=[IrisDesktop.DesktopLifeCli]::StopAsync().GetAwaiter().GetResult()|ConvertFrom-Json
 if($taskStop.command -ne 'stop_action' -or $taskStop.argumentCount -ne 1){throw 'Fixed stop gained an injected body'}
 foreach($taskName in @('wood','a"b\tail','trailing\','spaces in name')){
  $taskCollect=[IrisDesktop.DesktopLifeCli]::PerformAsync('collect',$taskName).GetAwaiter().GetResult()|ConvertFrom-Json
  if($taskCollect.command -ne 'complete_altering_work' -or $taskCollect.name -ne $taskName -or $null -ne $taskCollect.craftCount){throw 'Facility collection did not send the exact travel-and-collect command'}
  $taskValue=[IrisDesktop.DesktopLifeCli]::PerformAsync('crafting',$taskName).GetAwaiter().GetResult()|ConvertFrom-Json
  if($taskValue.command -ne 'execute_crafting' -or $taskValue.name -ne $taskName -or $taskValue.craftCount -ne 1){throw 'CLI JSON argument changed'}
  $taskBatch=[IrisDesktop.DesktopLifeCli]::CraftAsync($taskName,3).GetAwaiter().GetResult()|ConvertFrom-Json
  if($taskBatch.command -ne 'execute_crafting' -or $taskBatch.name -ne $taskName -or $taskBatch.craftCount -ne 3){throw 'Batch craftCount or quoted name changed'}
  $taskRead=[IrisDesktop.DesktopLifeCli]::ReadNamedItemsAsync($taskName).GetAwaiter().GetResult()|ConvertTo-Json -Depth 20 -Compress|ConvertFrom-Json
  if($taskRead.data.items[0].name -ne $taskName -or $taskRead.data.items[0].count -ne 3){throw 'Named consumable lookup failed'}
 }
 try{$null=[IrisDesktop.DesktopLifeCli]::PerformAsync('stop_action','wood').GetAwaiter().GetResult();throw 'Generic game command accepted'}catch{if($_.Exception.Message -eq 'Generic game command accepted'){throw}}
 foreach($taskCount in @(0,6)){try{$null=[IrisDesktop.DesktopLifeCli]::CraftAsync('wood',$taskCount).GetAwaiter().GetResult();throw 'Invalid crafting count accepted'}catch{if($_.Exception.Message -eq 'Invalid crafting count accepted'){throw}}}
 $taskWatch=[Diagnostics.Stopwatch]::StartNew();$taskTimedOut=$false
 try{$null=[IrisDesktop.DesktopLifeCli]::ReadNamedItemsAsync('sleep').GetAwaiter().GetResult()}catch{$taskTimedOut=$true}
 if(!$taskTimedOut -or $taskWatch.ElapsedMilliseconds -gt 10000){throw 'Absolute 8s read deadline was not enforced'}
}finally{[Environment]::SetEnvironmentVariable('MABINOGI_CLI_PATH',$taskBefore)}
Write-Output 'PASS fixed action commands/craftCount1+3 and bounds/Windows JSON escaping/named Food lookup; spawned fake CLI only'
