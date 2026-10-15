$ErrorActionPreference='Stop'
Add-Type -Path @('desktop-host.cs','desktop-store.cs','desktop-bridge.cs','desktop-cli-activity.cs'|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @('System.Core','System.Security','System.Web.Extensions')
if([IrisDesktop.DesktopBridge].GetMethod('BindLifeRead') -eq $null){throw 'Life bridge binding missing'}
Add-Type -TypeDefinition @'
using System;using System.Threading.Tasks;
public class LifeReadProbe {
 public int Calls;
 public TaskCompletionSource<object> Gate=new TaskCompletionSource<object>();
 public Func<string,Task<object>> Reader {get{return kind=>{Calls++;return Gate.Task;};}}
}
'@
$root=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-13-ergon-read-planning/native-bridge/'+[Guid]::NewGuid().ToString('N'))
$store=New-Object IrisDesktop.DesktopStore($root,'development')
$bridge=New-Object IrisDesktop.DesktopBridge($store,$true);$url=[Uri]'http://localhost:3000/iris/desktop';$null=$bridge.Activate($url);$epoch=$bridge.Epoch
$probe=New-Object LifeReadProbe;$bridge.BindLifeRead($probe.Reader)
function Message($id,$method,$payload,$e=$epoch){@{version=1;id=[string]$id;epoch=$e;method=$method;payload=$payload}|ConvertTo-Json -Compress}
function Assert($ok,$label){if(!$ok){throw $label}}
$caps=$bridge.Handle($url,(Message 1 'game.life.capabilities' $null))|ConvertFrom-Json
Assert ($caps.ok -and $caps.value.readOnly -and $caps.value.kinds.Count -eq 7) 'Life capabilities wrong'
$foreign=$bridge.Handle([Uri]'https://evil.test/iris/desktop',(Message 2 'game.life.read' @{kind='gathering'}))|ConvertFrom-Json
Assert (!$foreign.ok -and $probe.Calls -eq 0) 'Foreign document called reader'
$bad=$bridge.Handle($url,(Message 2 'game.life.read' @{kind='execute_gathering'}))|ConvertFrom-Json
Assert (!$bad.ok -and $probe.Calls -eq 0) 'Action kind called reader'
$bad=$bridge.Handle($url,(Message 3 'game.life.read' @{kind='gathering';command='arbitrary'}))|ConvertFrom-Json
Assert (!$bad.ok -and $probe.Calls -eq 0) 'Extra argument called reader'
$pending=$bridge.HandleAsync($url,(Message 4 'game.life.read' @{kind='gathering'}))
Assert ($probe.Calls -eq 1) 'Read did not start once'
$busy=$bridge.Handle($url,(Message 5 'game.life.read' @{kind='inventory'}))|ConvertFrom-Json
Assert (!$busy.ok -and $probe.Calls -eq 1) 'Overlapping native read started'
$replay=$bridge.Handle($url,(Message 4 'game.life.read' @{kind='gathering'}))|ConvertFrom-Json
Assert (!$replay.ok -and $probe.Calls -eq 1) 'Replay started'
$bridge.Revoke();$probe.Gate.SetResult(@{data='old'})
$settled=$pending.GetAwaiter().GetResult()|ConvertFrom-Json
Assert (!$settled.ok) 'Revoked document received stale life success'
Assert (!(Test-Path $store.FilePath)) 'Read-only methods changed protected save queue'
Write-Output 'PASS life bridge capability, origin, allowlist, payload, single flight, replay, revoke, no queue writes'
