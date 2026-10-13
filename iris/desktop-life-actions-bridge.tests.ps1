$ErrorActionPreference='Stop'
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-host.cs'),(Join-Path $PSScriptRoot 'desktop-store.cs'),(Join-Path $PSScriptRoot 'desktop-bridge.cs')) -ReferencedAssemblies @('System.Security','System.Web.Extensions','System.Core')
$taskRoot=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/life-bridge-'+[guid]::NewGuid().ToString('N'))
$taskStore=New-Object IrisDesktop.DesktopStore($taskRoot,'development')
$taskBridge=New-Object IrisDesktop.DesktopBridge($taskStore,$true)
$taskUrl=[Uri]'http://localhost:3000/iris/desktop'
if(!$taskBridge.Activate($taskUrl)){throw 'Action bridge document rejected'}
Add-Type -TypeDefinition @'
using System;using System.Collections.Generic;using System.Threading.Tasks;
public static class LifeBridgeFixture {
 public static int Calls;
 public static object Cap(){return new {schemaVersion=1,actions=new[]{"crafting"}};}
 public static object Sync(string method,Dictionary<string,object> payload){return new {schemaVersion=1,method=method};}
 public static Task<object> Async(string method,Dictionary<string,object> payload){Calls++;return Task.FromResult<object>(new {schemaVersion=1,method=method});}
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
$updateState=[Func[object]]{return @{schemaVersion=1}}
$updateTask=[Func[Threading.Tasks.Task[object]]]{return [Threading.Tasks.Task]::FromResult([object]@{schemaVersion=1})}
$updateApply=[Func[object]]{return @{schemaVersion=1}}
$taskBridge.BindUpdater($updateState,$updateTask,$updateTask,$updateApply)
[LifeBridgeFixture]::IsBusy=$true
if((Request 'window.update.prepare' $null).ok){throw 'Update preparation overlapped a running life action'}
if((Request 'window.update.apply' $null).ok){throw 'Update helper started during a running life action'}
[LifeBridgeFixture]::IsBusy=$false
Write-Output 'PASS action bridge: source, epoch, fixed methods, strict payload and async callbacks'
