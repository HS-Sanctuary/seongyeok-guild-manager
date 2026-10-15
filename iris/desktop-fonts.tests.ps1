$ErrorActionPreference='Stop'
$fontSource=Join-Path $PSScriptRoot 'desktop-fonts.cs'
if (!(Test-Path $fontSource)) { throw 'Installed font cache is missing; repeated reads cannot share a bounded name list' }
Add-Type -Path @($fontSource,(Join-Path $PSScriptRoot 'desktop-host.cs'),(Join-Path $PSScriptRoot 'desktop-store.cs'),(Join-Path $PSScriptRoot 'desktop-bridge.cs'),(Join-Path $PSScriptRoot 'desktop-cli-activity.cs')) -ReferencedAssemblies @('System.Drawing','System.Core','System.Security','System.Web.Extensions')
Add-Type -TypeDefinition @'
using System;
using System.Threading.Tasks;
public static class FontFixture {
 public static int Count;
 public static string[] Enumerate(){Count++;return new[]{"Segoe UI","맑은 고딕","Segoe UI"," bad ","C:/fonts/x.ttf","https://evil","x\n",new string('x',81)};}
 public static TaskCompletionSource<object> Pending=new TaskCompletionSource<object>();
 public static Task<object> Read(bool refresh){Count++;return Pending.Task;}
}
'@ -ReferencedAssemblies @('System.Core')
function Assert($ok,$message) { if (!$ok) {throw $message} }
$enumerate=[Delegate]::CreateDelegate([Func[string[]]],[FontFixture].GetMethod('Enumerate'))
$cache=New-Object IrisDesktop.DesktopInstalledFonts($enumerate)
$first=$cache.ReadAsync($false).GetAwaiter().GetResult()
$second=$cache.ReadAsync($false).GetAwaiter().GetResult()
Assert ([FontFixture]::Count -eq 1) 'Ordinary repeat reads enumerated OS twice'
Assert ($first.fonts.Count -eq 3 -and $first.fonts -contains 'Segoe UI' -and $first.fonts -contains '맑은 고딕') 'Unsafe names leaked or valid names lost'
$null=$cache.ReadAsync($true).GetAwaiter().GetResult()
Assert ([FontFixture]::Count -eq 2) 'Refresh did not re-enumerate'
$root=Join-Path (Split-Path $PSScriptRoot) '.superpowers/sdd/2026-10-12-iris-installed-fonts/bridge-probe'
$bridge=New-Object IrisDesktop.DesktopBridge((New-Object IrisDesktop.DesktopStore($root,'development')),$true)
$url=[Uri]'http://localhost:3000/iris/desktop'
$null=$bridge.Activate($url)
$read=[Delegate]::CreateDelegate([Func[bool,Threading.Tasks.Task[object]]],[FontFixture].GetMethod('Read'))
$bridge.BindFonts($read)
function Msg($id,$payload=$null) { @{version=1;id=[string]$id;epoch=$bridge.Epoch;method='window.fonts.list';payload=$payload}|ConvertTo-Json -Compress }
Assert (!(($bridge.HandleAsync([Uri]'https://evil.test/iris/desktop',(Msg 1)).GetAwaiter().GetResult()|ConvertFrom-Json).ok)) 'Foreign source enumerated fonts'
Assert (!(($bridge.HandleAsync($url,(Msg 1 @{path='x'})).GetAwaiter().GetResult()|ConvertFrom-Json).ok)) 'Font method accepted arbitrary payload'
$pending=$bridge.HandleAsync($url,(Msg 2))
Assert (!$pending.IsCompleted) 'Font read not awaited'
Assert (!(($bridge.HandleAsync($url,(Msg 3)).GetAwaiter().GetResult()|ConvertFrom-Json).ok)) 'Concurrent font read accepted'
$bridge.Revoke()
[FontFixture]::Pending.SetResult(@{fonts=@('Segoe UI')})
Assert (!(($pending.GetAwaiter().GetResult()|ConvertFrom-Json).ok)) 'Revoked result leaked'
Write-Output 'Installed fonts: cached names, filtering, refresh, source, payload, concurrency, revocation PASS'
