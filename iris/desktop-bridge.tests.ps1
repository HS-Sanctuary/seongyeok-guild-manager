$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot 'desktop-bridge.cs'
if (!(Test-Path $source)) { throw 'Scoped desktop bridge is missing' }
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-host.cs'),(Join-Path $PSScriptRoot 'desktop-store.cs'),$source) -ReferencedAssemblies @('System.Security','System.Web.Extensions','System.Core')
$root=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-06-iris-compact-overlay/bridge-probes/'+[Guid]::NewGuid().ToString('N'))
$store=New-Object IrisDesktop.DesktopStore($root,'development')
$bridge=New-Object IrisDesktop.DesktopBridge($store,$true)
function Assert($ok,$message) { if (!$ok) {throw $message} }
$url=[Uri]'http://localhost:3000/iris/desktop'
Assert ($bridge.Activate($url)) 'Desktop document not activated'
$epoch=$bridge.Epoch
function Send($id,$method,$payload,$source=$url,$generation=$epoch) {
  $json=@{version=1;id=[string]$id;epoch=$generation;method=$method;payload=$payload}|ConvertTo-Json -Depth 20 -Compress
  return ($bridge.Handle($source,$json)|ConvertFrom-Json)
}
Assert (!(Send 1 'store.load' $null ([Uri]'https://evil.test/iris/desktop')).ok) 'Foreign source reached store'
Assert (!(Send 1 'store.load' $null ([Uri]'http://localhost:3000/login')).ok) 'Other document reached store'
Assert (!(Send 1 'store.load' $null $url ($epoch-1)).ok) 'Stale epoch accepted'
Assert (!(Send 1 'cookie.read' $null).ok) 'Generic native method accepted'
Assert (!(Test-Path $store.FilePath)) 'Rejected messages wrote a file'
Assert ((Send 2 'store.replace' @{schemaVersion=2;entries=@()}).ok) 'Valid snapshot not persisted'
$cipher=[IO.File]::ReadAllBytes($store.FilePath)
Assert (!(Send 2 'store.replace' @{schemaVersion=2;entries=@()}).ok) 'Replay accepted'
Assert ((Send 3 'store.load' $null).ok) 'Valid load failed'
Assert (!(Send 4 'store.replace' @{schemaVersion=2;entries=@();cookie='forbidden'}).ok) 'Secret payload accepted'
Assert ([Convert]::ToBase64String([IO.File]::ReadAllBytes($store.FilePath)) -eq [Convert]::ToBase64String($cipher)) 'Bad payload changed store'
$bridge.Revoke()
Assert (!(Send 5 'store.load' $null).ok) 'Revoked bridge stayed open'
Assert (!$bridge.Activate([Uri]'http://localhost:3000/iris')) 'Relay route enabled native bridge'
Assert ($bridge.Activate($url)) 'Desktop restore failed'
$script:closeCount=0
$bridge.add_CloseRequested({$script:closeCount++})
Assert ((Send 1 'window.close' $null $url $bridge.Epoch).ok) 'Guarded close unavailable'
Assert ($script:closeCount -eq 1) 'Close not dispatched exactly once'
Write-Output 'Desktop bridge: source/route/epoch/method/replay/schema/revocation PASS'
Add-Type -TypeDefinition 'public static class OverlayBridgeFixture { public static object Read(){return new {clickThrough=false,shortcutsAvailable=true,opacityPercent=100};} public static bool Input(bool enabled){return true;} public static bool Opacity(int percent){return true;} }'
$read=[Delegate]::CreateDelegate([Func[object]],[OverlayBridgeFixture].GetMethod('Read'))
$input=[Delegate]::CreateDelegate([Func[bool,bool]],[OverlayBridgeFixture].GetMethod('Input'))
$opacity=[Delegate]::CreateDelegate([Func[int,bool]],[OverlayBridgeFixture].GetMethod('Opacity'))
Assert ($null -ne [IrisDesktop.DesktopBridge].GetMethod('BindOverlay')) 'Missing bounded overlay bridge'
$bridge.BindOverlay($read,$input,$opacity)
Assert ((Send 2 'overlay.state' $null $url $bridge.Epoch).ok) 'Overlay state rejected'
Assert ((Send 3 'overlay.input' @{clickThrough=$true} $url $bridge.Epoch).ok) 'Valid input setting rejected'
Assert (!(Send 4 'overlay.input' @{clickThrough=$true;extra=1} $url $bridge.Epoch).ok) 'Extra input field accepted'
Assert (!(Send 5 'overlay.opacity' @{percent=49} $url $bridge.Epoch).ok) 'Opacity outside range accepted'
Assert ((Send 6 'overlay.opacity' @{percent=100} $url $bridge.Epoch).ok) 'Valid opacity rejected'
Assert (!(Send 7 'overlay.opacity' @{percent=50.5} $url $bridge.Epoch).ok) 'Fractional opacity accepted'
Assert (!(Send 8 'overlay.input' @{clickThrough='true'} $url $bridge.Epoch).ok) 'String boolean accepted'
Assert (!(Send 9 'overlay.state' $null $url ($bridge.Epoch-1)).ok) 'Stale epoch changed overlay'
Write-Output 'Overlay bridge: bounded methods, strict fields/types/ranges and stale epoch PASS'
