$ErrorActionPreference='Stop'
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-host.cs'),(Join-Path $PSScriptRoot 'desktop-store.cs'),(Join-Path $PSScriptRoot 'desktop-bridge.cs'),(Join-Path $PSScriptRoot 'desktop-cli-activity.cs')) -ReferencedAssemblies @('System.Security','System.Web.Extensions','System.Core')
$taskRoot=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/life-bridge-'+[guid]::NewGuid().ToString('N'))
$taskStore=New-Object IrisDesktop.DesktopStore($taskRoot,'development')
$taskBridge=New-Object IrisDesktop.DesktopBridge($taskStore,$true)
$taskUrl=[Uri]'http://localhost:3000/iris/desktop'
if(!$taskBridge.Activate($taskUrl)){throw 'Action bridge document rejected'}
Add-Type -TypeDefinition @'
using System;using System.Collections.Generic;using System.Threading.Tasks;
public static class LifeBridgeFixture {
 public static int Calls;
 public static string Failure;
 public static void ClearFailure(){Failure=null;}
 public static object Cap(){return new {schemaVersion=1,actions=new[]{"crafting"}};}
 public static object Sync(string method,Dictionary<string,object> payload){return new {schemaVersion=1,method=method};}
 public static Task<object> Async(string method,Dictionary<string,object> payload){Calls++;if(Failure!=null)throw new Exception(Failure);return Task.FromResult<object>(new {schemaVersion=1,method=method});}
 public static bool IsBusy;
 public static bool Busy(){return IsBusy;}
}
'@ -ReferencedAssemblies @('System.Core')
$cap=[Delegate]::CreateDelegate([Func[object]],[LifeBridgeFixture].GetMethod('Cap'))
$sync=[Delegate]::CreateDelegate([Func[string,[System.Collections.Generic.Dictionary[string,object]],object]],[LifeBridgeFixture].GetMethod('Sync'))
$async=[Delegate]::CreateDelegate([Func[string,[System.Collections.Generic.Dictionary[string,object]],[Threading.Tasks.Task[object]]]],[LifeBridgeFixture].GetMethod('Async'))
$busy=[Delegate]::CreateDelegate([Func[bool]],[LifeBridgeFixture].GetMethod('Busy'))
$taskBridge.BindLifeActions($cap,$sync,$async,$busy)
$script:nextId=0
function Request($method,$payload,$url=$taskUrl,$epoch=$taskBridge.Epoch) {
 $script:nextId++
 $frame=@{version=1;id=[string]$script:nextId;epoch=$epoch;method=$method;payload=$payload}|ConvertTo-Json -Depth 16 -Compress
 return ($taskBridge.HandleAsync($url,$frame).GetAwaiter().GetResult()|ConvertFrom-Json)
}
if(!(Request 'game.life.actions.capabilities' $null).ok){throw 'Capabilities not reachable'}
if((Request 'game.life.actions.prepare' @{accountId='a';characterId='c';action='crafting';displayName='wood';extra='execute'}).ok){throw 'Extra field reached action callback'}
if((Request 'game.life.actions.prepare' @{accountId='a';characterId='c';action='stop_action';displayName='wood'}).ok){throw 'Generic game action reached callback'}
if((Request 'game.life.actions.prepare' @{accountId='a';characterId='c';action='crafting';displayName='wood'} ([Uri]'https://evil.test/iris/desktop')).ok){throw 'Foreign source reached action callback'}
if((Request 'game.life.actions.prepare' @{accountId='a';characterId='c';action='crafting';displayName='wood'} $taskUrl ($taskBridge.Epoch-1)).ok){throw 'Stale epoch reached action callback'}
if((Request 'game.life.actions.confirm' @{nonce='n';extra='x'}).ok){throw 'Extra confirm field accepted'}
if([LifeBridgeFixture]::Calls -ne 0){throw 'Rejected action invoked native callback'}
if(!(Request 'game.life.actions.context' @{accountId='a';characterId='c';accountLabel='a';characterLabel='c'}).ok){throw 'Context not set'}
if(!(Request 'game.life.actions.prepare' @{accountId='a';characterId='c';action='crafting';displayName='wood'}).ok){throw 'Safe prepare not delivered'}
if(!(Request 'game.life.actions.confirm' @{nonce='n'}).ok){throw 'Safe confirm not delivered'}
if([LifeBridgeFixture]::Calls -ne 2){throw 'Prepare and confirm not delivered once'}
[LifeBridgeFixture]::Failure='life_not_enough_wings'
$taskFailure=Request 'game.life.actions.prepare' @{accountId='a';characterId='c';action='crafting';displayName='wood'}
if($taskFailure.ok -or $taskFailure.error -ne 'life_not_enough_wings'){throw 'Known safe preparation reason was lost'}
[LifeBridgeFixture]::Failure='C:/never-disclose/private-path.txt'
$taskUnknown=Request 'game.life.actions.prepare' @{accountId='a';characterId='c';action='crafting';displayName='wood'}
if($taskUnknown.ok -or ($taskUnknown|ConvertTo-Json) -match 'never-disclose' -or $taskUnknown.error -ne 'life_action_unavailable'){throw 'Unknown exception exposed raw details'}
[LifeBridgeFixture]::ClearFailure()
$updateState=[Func[object]]{return @{schemaVersion=1}}
$updateTask=[Func[Threading.Tasks.Task[object]]]{return [Threading.Tasks.Task]::FromResult([object]@{schemaVersion=1})}
$updateApply=[Func[object]]{return @{schemaVersion=1}}
$taskBridge.BindUpdater($updateState,$updateTask,$updateTask,$updateApply)
[LifeBridgeFixture]::IsBusy=$true
if(!(Request 'game.life.actions.stop' @{requestId='123e4567-e89b-12d3-a456-426614174000';accountId='a';characterId='c'}).ok){throw 'Current stop was blocked by ordinary action busy gate'}
if((Request 'game.life.actions.stop' @{requestId='n';accountId='a';characterId='c';command='stop_action'}).ok){throw 'Extra stop command field accepted'}
if((Request 'game.life.actions.stop' @{requestId='n';accountId='a';characterId='c'} ([Uri]'https://evil.test/iris/desktop')).ok){throw 'Foreign stop origin accepted'}
if((Request 'window.update.prepare' $null).ok){throw 'Update preparation overlapped a running life action'}
if((Request 'window.update.apply' $null).ok){throw 'Update helper started during a running life action'}
[LifeBridgeFixture]::IsBusy=$false
$taskClick=@{requestId='123e4567-e89b-12d3-a456-426614174000';requestedAt=1792022400000L;accountId='a';characterId='c';facility='mill';displayName='wood'}
if(!(Request 'game.life.actions.collect' $taskClick).ok){throw 'One-click collection endpoint missing'}
if(!(Request 'game.life.actions.collectionPolicy' @{accountId='a'}).ok){throw 'Collection policy endpoint missing'}
if(!(Request 'game.life.actions.revokeCollection' @{accountId='a'}).ok){throw 'Collection revocation endpoint missing'}
$taskExtra=$taskClick.Clone();$taskExtra.action='crafting'
if((Request 'game.life.actions.collect' $taskExtra).ok){throw 'Generic collection action field accepted'}
if((Request 'game.life.actions.collectionPolicy' @{accountId='a';granted=$true}).ok){throw 'Browser supplied permission accepted'}
if((Request 'game.life.actions.collect' $taskClick ([Uri]'https://evil.test/iris/desktop')).ok){throw 'Foreign collection origin accepted'}
Write-Output 'PASS action bridge: source, epoch, fixed methods, strict payload and async callbacks'
