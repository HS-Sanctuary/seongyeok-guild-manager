$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot 'desktop-bridge.cs'
if (!(Test-Path $source)) { throw 'Scoped desktop bridge is missing' }
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-host.cs'),(Join-Path $PSScriptRoot 'desktop-store.cs'),(Join-Path $PSScriptRoot 'desktop-cli-activity.cs'),$source) -ReferencedAssemblies @('System.Security','System.Web.Extensions','System.Core')
$root=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-08-iris-addon-bar/bridge-probes/'+[Guid]::NewGuid().ToString('N'))
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
Assert ((Send 2 'store.replace' @{schemaVersion=3;entries=@()}).ok) 'Valid snapshot not persisted'
$cipher=[IO.File]::ReadAllBytes($store.FilePath)
Assert (!(Send 2 'store.replace' @{schemaVersion=3;entries=@()}).ok) 'Replay accepted'
Assert ((Send 3 'store.load' $null).ok) 'Valid load failed'
$caps=Send 4 'store.capabilities' $null
Assert ($caps.ok -and $caps.value.schemaVersion -eq 3 -and $caps.value.barter -eq $true) 'Current protected queue capabilities missing'
Assert (!(Send 5 'store.replace' @{schemaVersion=3;entries=@();cookie='forbidden'}).ok) 'Secret payload accepted'
Assert ([Convert]::ToBase64String([IO.File]::ReadAllBytes($store.FilePath)) -eq [Convert]::ToBase64String($cipher)) 'Bad payload changed store'
$bridge.Revoke()
Assert (!(Send 6 'store.load' $null).ok) 'Revoked bridge stayed open'
Assert (!$bridge.Activate([Uri]'http://localhost:3000/iris')) 'Relay route enabled native bridge'
Assert ($bridge.Activate($url)) 'Desktop restore failed'
$script:closeCount=0
$bridge.add_CloseRequested({$script:closeCount++})
Assert ((Send 1 'window.close' $null $url $bridge.Epoch).ok) 'Guarded close unavailable'
Assert ($script:closeCount -eq 1) 'Close not dispatched exactly once'
Write-Output 'Desktop bridge: source/route/epoch/method/replay/schema/revocation PASS'
if(!$bridge.GetType().GetMethod('BindUpdater')){throw 'Missing scoped updater methods: web cannot request a verified app update'}
$originalBridge=$bridge
$bridge=New-Object IrisDesktop.DesktopBridge($store,$true)
Assert ($bridge.Activate($url)) 'Updater document activation failed'
Add-Type -TypeDefinition 'public static class UpdateBridgeFixture { public static object State(){return new System.Collections.Generic.Dictionary<string,object>{{"supported",true},{"installedVersion","0.1.0"},{"availableVersion","0.2.0"},{"phase","available"},{"progress",0},{"error",null}};} public static System.Threading.Tasks.Task<object> Check(){return System.Threading.Tasks.Task.FromResult(State());} public static object Apply(){return State();} }' -ReferencedAssemblies @('System.Core')
$updateState=[Delegate]::CreateDelegate([Func[object]],[UpdateBridgeFixture].GetMethod('State'))
$updateCheck=[Delegate]::CreateDelegate([Func[Threading.Tasks.Task[object]]],[UpdateBridgeFixture].GetMethod('Check'))
$bridge.BindUpdater($updateState,$updateCheck,$updateCheck,$updateState)
Assert (!(Send 2 'window.update.state' @{path='C:/evil'} $url $bridge.Epoch).ok) 'Updater accepted browser paths'
Assert ((Send 3 'window.update.state' $null $url $bridge.Epoch).value.installedVersion -eq '0.1.0') 'Installed native version missing'
Assert (!(Send 4 'window.update.apply' $null ([Uri]'https://evil.test/iris/desktop') $bridge.Epoch).ok) 'Foreign document triggered install'
$bridge=$originalBridge
Add-Type -TypeDefinition 'public static class OverlayBridgeFixture { public static object Read(){return new {clickThrough=false,shortcutsAvailable=true,opacityPercent=100};} public static bool Input(bool enabled){return true;} public static bool Opacity(int percent){return true;} }'
$read=[Delegate]::CreateDelegate([Func[object]],[OverlayBridgeFixture].GetMethod('Read'))
$input=[Delegate]::CreateDelegate([Func[bool,bool]],[OverlayBridgeFixture].GetMethod('Input'))
$opacity=[Delegate]::CreateDelegate([Func[int,bool]],[OverlayBridgeFixture].GetMethod('Opacity'))
Assert ($null -ne [IrisDesktop.DesktopBridge].GetMethod('BindOverlay')) 'Missing bounded overlay bridge'
$bridge.BindOverlay($read,$input,$opacity)
Assert ((Send 2 'overlay.state' $null $url $bridge.Epoch).ok) 'Overlay state rejected'
Assert ((Send 3 'overlay.input' @{clickThrough=$true} $url $bridge.Epoch).ok) 'Valid input setting rejected'
Assert (!(Send 4 'overlay.input' @{clickThrough=$true;extra=1} $url $bridge.Epoch).ok) 'Extra input field accepted'
Assert (!(Send 5 'overlay.opacity' @{percent=29} $url $bridge.Epoch).ok) 'Opacity outside range accepted'
Assert ((Send 6 'overlay.opacity' @{percent=30} $url $bridge.Epoch).ok) '30 percent opacity rejected'
Assert (!(Send 7 'overlay.opacity' @{percent=50.5} $url $bridge.Epoch).ok) 'Fractional opacity accepted'
Assert (!(Send 8 'overlay.input' @{clickThrough='true'} $url $bridge.Epoch).ok) 'String boolean accepted'
Assert (!(Send 9 'overlay.state' $null $url ($bridge.Epoch-1)).ok) 'Stale epoch changed overlay'
Write-Output 'Overlay bridge: bounded methods, strict fields/types/ranges and stale epoch PASS'
Add-Type -TypeDefinition @'
using System.Threading.Tasks;
public static class GameStatsBridgeFixture {
    public static TaskCompletionSource<object> Pending=new TaskCompletionSource<object>();
    public static Task<object> Read(){return Pending.Task;}
}
'@
$gameRead=[Delegate]::CreateDelegate([Func[System.Threading.Tasks.Task[object]]],[GameStatsBridgeFixture].GetMethod('Read'))
$bridge.BindGameStats($gameRead)
Assert (!(Send 10 'game.stats.read' @{command='anything'} $url $bridge.Epoch).ok) 'Browser supplied CLI arguments accepted'
$message=@{version=1;id='11';epoch=$bridge.Epoch;method='game.stats.read';payload=$null}|ConvertTo-Json -Compress
$pending=$bridge.HandleAsync($url,$message)
Assert (!$pending.IsCompleted) 'Game read did not await fixture'
Assert (!(Send 12 'game.stats.read' $null $url $bridge.Epoch).ok) 'Concurrent game read accepted'
$bridge.Revoke()
[GameStatsBridgeFixture]::Pending.SetResult(@{stats=@{combat_power=10}})
Assert (!(($pending.GetAwaiter().GetResult())|ConvertFrom-Json).ok) 'Revoked game result leaked into new document'
$snapshot=[IrisDesktop.DesktopGameStatsReader]::Normalize('{"EnabledCombatJobDisplayName":"healer","Level":100,"CombatScore":{"Value":0},"LivingScore":{"Value":null},"ArcaneResistance":{"Value":""}}')
Assert ($snapshot.stats.combat_power -eq 0) 'Real zero lost'
Assert ($null -eq $snapshot.stats.life_energy -and $null -eq $snapshot.stats.magic_resistance -and $null -eq $snapshot.stats.charm) 'Missing or empty scores became zero'
Assert ($snapshot.level -eq 100) 'Character Level lost'
Write-Output 'Game stats bridge: fixed read, concurrency, epoch revocation and strict missing/zero normalization PASS'
$currencies=[IrisDesktop.DesktopGameStatsReader]::NormalizeCurrencies('[{"DisplayName":"gold","Amount":12345678901},{"DisplayName":"silver","Amount":0},{"DisplayName":"unknown"}]')
Assert ($currencies.items[0].amount -eq 12345678901 -and $currencies.items[1].amount -eq 0 -and $null -eq $currencies.items[2].amount) 'Currency amount/zero/missing normalization failed'
try {[void][IrisDesktop.DesktopGameStatsReader]::NormalizeCurrencies('[{"DisplayName":"gold","Amount":-1}]');throw 'Negative amount accepted'} catch {Assert ($_.Exception.Message -ne 'Negative amount accepted') 'Negative currency accepted'}
$bridge.BindCurrencies($gameRead)
$bridge.Activate($url)|Out-Null
Assert (!(Send 1 'game.currencies.read' @{command='anything'} $url $bridge.Epoch).ok) 'Currency browser arguments accepted'
$message=@{version=1;id='2';epoch=$bridge.Epoch;method='game.currencies.read';payload=$null}|ConvertTo-Json -Compress
$result=($bridge.HandleAsync($url,$message).GetAwaiter().GetResult())|ConvertFrom-Json
Assert ($result.ok) 'Bounded currency method rejected'
Write-Output 'Currencies: fixed method, no browser arguments, large amounts/zero/missing PASS'
Assert ($null -ne [IrisDesktop.DesktopBridge].GetMethod('BindAddon')) 'Missing strict addon bridge'
Add-Type -TypeDefinition @'
public static class AddonBridgeFixture {
 public static object State(){return new {dockSide="right",sameLayer=true,tracked=false,actualSide="off",status="searching",persistent=true};}
 public static bool Preferences(string side,bool layer){return true;}
 public static void Decision(bool open){}
}
'@
$addonRead=[Delegate]::CreateDelegate([Func[object]],[AddonBridgeFixture].GetMethod('State'))
$addonPrefs=[Delegate]::CreateDelegate([Func[string,bool,bool]],[AddonBridgeFixture].GetMethod('Preferences'))
$addonDecision=[Delegate]::CreateDelegate([Action[bool]],[AddonBridgeFixture].GetMethod('Decision'))
$bridge.BindAddon($addonRead,$addonPrefs,$addonDecision)
Assert ((Send 3 'window.addon.state' $null $url $bridge.Epoch).ok) 'Addon state rejected'
Assert ((Send 4 'window.addon.preferences' @{dockSide='left';sameLayer=$false} $url $bridge.Epoch).ok) 'Addon preferences rejected'
Assert (!(Send 5 'window.addon.preferences' @{dockSide='left';sameLayer=$true;handle=42} $url $bridge.Epoch).ok) 'Arbitrary window handle accepted'
Assert (!(Send 6 'window.addon.preferences' @{dockSide='any';sameLayer=$true} $url $bridge.Epoch).ok) 'Invalid side accepted'
Assert (!(Send 7 'window.addon.preferences' @{dockSide='off';sameLayer='true'} $url $bridge.Epoch).ok) 'String layer accepted'
Assert (!(Send 8 'window.decision' @{open=$true;extra=1} $url $bridge.Epoch).ok) 'Extra decision key accepted'
Assert ((Send 9 'window.decision' @{open=$true} $url $bridge.Epoch).ok) 'Decision rejected'
Assert (!(Send 10 'window.drag' @{handle=42} $url $bridge.Epoch).ok) 'Drag accepted target input'
Assert ((Send 11 'window.drag' $null $url $bridge.Epoch).ok) 'Native drag unavailable'
Assert ((Send 12 'window.minimize' $null $url $bridge.Epoch).ok) 'Native minimize unavailable'
Write-Output 'Addon bridge: fixed methods, exact preferences/types and no HWND input PASS'
Add-Type -TypeDefinition @'
public static class FloatingBridgeFixture {
 public static int Calls;
 public static int Commands;
 public static object State(){return new System.Collections.Generic.Dictionary<string,object>{{"ok",true}};}
 public static object Command(string command){Commands++;return State();}
 public static object Preferences(System.Collections.Generic.Dictionary<string,object> p){Calls++;return p;}
}
'@ -ReferencedAssemblies @('System.Core')
$floatingState=[Delegate]::CreateDelegate([Func[object]],[FloatingBridgeFixture].GetMethod('State'))
$floatingCommand=[Delegate]::CreateDelegate([Func[string,object]],[FloatingBridgeFixture].GetMethod('Command'))
$floatingPrefs=[Delegate]::CreateDelegate([Func[Collections.Generic.Dictionary[string,object],object]],[FloatingBridgeFixture].GetMethod('Preferences'))
$bridge.BindFloating($floatingState,$floatingCommand,$floatingCommand,$floatingPrefs)
Assert ((Send 13 'window.floating.preferences' @{iconSize=52;opacity=80;modifiers=1;key=192;windowedFloating=$true} $url $bridge.Epoch).value.windowedFloating) 'Windowed floating preference did not reach its owner'
Assert ((Send 14 'window.floating.preferences' @{iconSize=52;opacity=80;modifiers=1;key=192} $url $bridge.Epoch).ok) 'Legacy preference message rejected'
foreach($bad in @(@{iconSize=52;opacity=80;modifiers=1;key=192;windowedFloating='true'},@{iconSize=52;opacity=80;modifiers=1;key=192;handle=12},@{iconSize=52;opacity=80;modifiers=1;key=192;windowedFloating=$true;extra=1})){
 Assert (!(Send ([guid]::NewGuid().ToString()) 'window.floating.preferences' $bad $url $bridge.Epoch).ok) 'Malformed floating preference reached owner'
}
Assert ([FloatingBridgeFixture]::Calls -eq 2) 'Rejected preferences had a native side effect'
Assert ((Send 15 'window.floating.command' @{command='dialog-open'} $url $bridge.Epoch).ok) 'Bounded modal-open command rejected'
Assert ((Send 16 'window.floating.notice' @{kind='character';height=112} $url $bridge.Epoch).ok) 'Measured notice height rejected'
Assert (!(Send 17 'window.floating.notice' @{kind='character';height=0} $url $bridge.Epoch).ok) 'Zero notice height accepted'
Assert (!(Send 18 'window.floating.notice' @{kind='character';height=361} $url $bridge.Epoch).ok) 'Unbounded notice height accepted'
Assert (!(Send 19 'window.floating.notice' @{kind='character';height='112'} $url $bridge.Epoch).ok) 'String notice height accepted'
Assert (!(Send 20 'window.floating.command' @{command='dialog-open';height=112} $url $bridge.Epoch).ok) 'Modal command accepted arbitrary geometry'
Assert (!(Send 21 'window.floating.notice' @{kind='character';height=112;handle=42} $url $bridge.Epoch).ok) 'Notice accepted native window handle'
Assert ([FloatingBridgeFixture]::Commands -eq 2) 'Rejected modal/notice messages had a side effect'
Write-Output 'Floating bridge: optional boolean, legacy message, strict field count and no rejected side effects PASS'
$focusMethod=$bridge.GetType().GetMethod('BindGameFocus')
Assert ($null -ne $focusMethod) 'Missing bounded game focus binding'
$script:focusCalls=0
$bridge.BindGameFocus([Func[bool]]{$script:focusCalls++;return $true})
Assert (!(Send 22 'window.game.focus' @{handle=42} $url $bridge.Epoch).ok) 'Focus method accepted arbitrary target'
Assert (!(Send 23 'window.game.focus' $null ([Uri]'https://evil.test/iris/desktop') $bridge.Epoch).ok) 'Foreign origin requested game focus'
Assert ((Send 24 'window.game.focus' $null $url $bridge.Epoch).value.focused) 'Valid focus request rejected'
Assert ($script:focusCalls -eq 1) 'Rejected focus request caused native side effects'
Write-Output 'Game focus: source/epoch validated, no target or key payload PASS'
