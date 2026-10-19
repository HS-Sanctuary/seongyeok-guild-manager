$ErrorActionPreference='Stop'
Add-Type -Path @('desktop-host.cs','desktop-store.cs','desktop-bridge.cs','desktop-cli-activity.cs'|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @('System.Core','System.Security','System.Web.Extensions')
Add-Type -TypeDefinition @'
using System;using System.Collections.Generic;using System.Threading.Tasks;
public static class ErgonReleaseProbe {
 public static int Actions,Floating;
 public static object Cap(){return new Dictionary<string,object>{{"schemaVersion",1}};}
 public static object Sync(string method,Dictionary<string,object> payload){return new Dictionary<string,object>{{"method",method}};}
 public static Task<object> Async(string method,Dictionary<string,object> payload){Actions++;return Task.FromResult<object>(new Dictionary<string,object>{{"method",method}});}
 public static bool Busy(){return false;}
 public static object State(){return new Dictionary<string,object>{{"surface","none"}};}
 public static object Command(string command){Floating++;return new Dictionary<string,object>{{"surface",command}};}
 public static object Notice(string kind){return new Dictionary<string,object>{{"kind",kind}};}
 public static object Prefs(Dictionary<string,object> prefs){return prefs;}
}
'@ -ReferencedAssemblies @('System.Core')
$cap=[Delegate]::CreateDelegate([Func[object]],[ErgonReleaseProbe].GetMethod('Cap'))
$sync=[Delegate]::CreateDelegate([Func[string,[System.Collections.Generic.Dictionary[string,object]],object]],[ErgonReleaseProbe].GetMethod('Sync'))
$async=[Delegate]::CreateDelegate([Func[string,[System.Collections.Generic.Dictionary[string,object]],[Threading.Tasks.Task[object]]]],[ErgonReleaseProbe].GetMethod('Async'))
$busy=[Delegate]::CreateDelegate([Func[bool]],[ErgonReleaseProbe].GetMethod('Busy'))
$state=[Delegate]::CreateDelegate([Func[object]],[ErgonReleaseProbe].GetMethod('State'))
$command=[Delegate]::CreateDelegate([Func[string,object]],[ErgonReleaseProbe].GetMethod('Command'))
$notice=[Delegate]::CreateDelegate([Func[string,object]],[ErgonReleaseProbe].GetMethod('Notice'))
$prefs=[Delegate]::CreateDelegate([Func[[System.Collections.Generic.Dictionary[string,object]],object]],[ErgonReleaseProbe].GetMethod('Prefs'))
foreach($development in @($false,$true)){
 $taskRoot=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/ergon-release-'+[guid]::NewGuid().ToString('N'))
 $taskStore=New-Object IrisDesktop.DesktopStore($taskRoot,$(if($development){'development'}else{'production'}))
 $taskBridge=New-Object IrisDesktop.DesktopBridge($taskStore,$development)
 $taskUrl=[Uri]$(if($development){'http://localhost:3000/iris/desktop'}else{'https://sanctum-tawny-three.vercel.app/iris/desktop'})
 if(!$taskBridge.Activate($taskUrl)){throw 'Release fixture document rejected'}
 $taskBridge.BindLifeActions($cap,$sync,$async,$busy);$taskBridge.BindFloating($state,$command,$notice,$prefs)
 $script:sequence=0
 function Request($method,$payload){$script:sequence++;$frame=@{version=1;id=[string]$script:sequence;epoch=$taskBridge.Epoch;method=$method;payload=$payload}|ConvertTo-Json -Depth 12 -Compress;return ($taskBridge.HandleAsync($taskUrl,$frame).GetAwaiter().GetResult()|ConvertFrom-Json)}
 $before=[ErgonReleaseProbe]::Actions
 foreach($row in @(
  @('game.life.actions.prepare',@{accountId='a';characterId='c';action='crafting';displayName='wood'}),
  @('game.life.actions.confirm',@{nonce='stale-nonce'}),
  @('game.life.actions.collect',@{requestId='123e4567-e89b-12d3-a456-426614174000';requestedAt=1792022400000L;accountId='a';characterId='c';facility='mill';displayName='wood'})
 )){if((Request $row[0] $row[1]).ok){throw ('Locked ERGON accepted '+$row[0]+' development='+$development)}}
 if([ErgonReleaseProbe]::Actions -ne $before){throw 'Release lock invoked an action delegate'}
 $beforeFloating=[ErgonReleaseProbe]::Floating
 if((Request 'window.floating.command' @{command='ergon'}).ok){throw 'Stale floating ERGON command bypassed release lock'}
 if([ErgonReleaseProbe]::Floating -ne $beforeFloating){throw 'Locked command reached native presentation'}
 foreach($row in @(
  @('game.life.actions.history',@{accountId='a'}),@('game.life.actions.state',$null),@('game.life.actions.cancel',@{nonce='stale-nonce'}),
  @('game.life.actions.collectionObservation',@{requestId='old';accountId='a';characterId='c'}),@('game.life.actions.revokeCollection',@{accountId='a'}),
  @('game.life.actions.stop',@{requestId='123e4567-e89b-12d3-a456-426614174000';accountId='a';characterId='c'})
 )){if(!(Request $row[0] $row[1]).ok){throw ('Safety/history endpoint became unavailable '+$row[0])}}
 if(!(Request 'window.floating.command' @{command='kronos'}).ok){throw 'Other floating module was locked'}
 if(Test-Path $taskStore.FilePath){throw 'Release gate changed protected saved plans'}
}
Write-Output 'PASS ERGON release gate: production/development block consumption and stale floating commands; stop/history/reconciliation preserved; no saved-store writes'
