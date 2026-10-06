param([string]$SupportPath = (Join-Path $PSScriptRoot 'overlay-support.cs'))
$ErrorActionPreference = 'Stop'
$results = @()
$loaded = Test-Path -LiteralPath $SupportPath
if ($loaded) {
    Add-Type -AssemblyName System.Net.Http
    Add-Type -AssemblyName System.Web.Extensions
    Add-Type -TypeDefinition (Get-Content -LiteralPath $SupportPath -Raw -Encoding UTF8) -ReferencedAssemblies System.dll,System.Core.dll,System.Net.Http.dll,System.Web.Extensions.dll
}
Add-Type -TypeDefinition @'
using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
public sealed class IrisTestHandler : HttpMessageHandler {
    public int Requests;
    public string Address;
    private TaskCompletionSource<HttpResponseMessage> pending;
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken token) {
        Requests++;
        Address = request.RequestUri.ToString();
        pending = new TaskCompletionSource<HttpResponseMessage>();
        token.Register(() => pending.TrySetCanceled());
        return pending.Task;
    }
    public void Reply(int status, string body) {
        pending.TrySetResult(new HttpResponseMessage((HttpStatusCode)status) { Content = new StringContent(body) });
    }
}
'@ -ReferencedAssemblies System.dll,System.Core.dll,System.Net.Http.dll
function Assert-True($condition, [string]$message) { if (-not $condition) { throw $message } }
function Test-Case([string]$name, [scriptblock]$body) {
    try {
        Assert-True $loaded 'Overlay support is not implemented'
        & $body
        $script:results += @{ name=$name; passed=$true }
    } catch { $script:results += @{ name=$name; passed=$false; error=$_.Exception.Message } }
}

Test-Case 'offscreen position returns fully inside the primary work area' {
    $point = [Iris.OverlayPreferences]::Place(6000, 2000, 292, 350, @(@{x=0;y=0;width=1920;height=1080}))
    Assert-True ($point.X -eq 1628 -and $point.Y -eq 730) 'Offscreen bounds were not clamped'
}
Test-Case 'negative-coordinate secondary monitor position is preserved' {
    $point = [Iris.OverlayPreferences]::Place(-500, 60, 292, 350, @(@{x=0;y=0;width=1920;height=1080},@{x=-1280;y=0;width=1280;height=1024}))
    Assert-True ($point.X -eq -500 -and $point.Y -eq 60) 'Valid secondary position changed'
}
Test-Case 'invalid preferences are ignored instead of hiding the window' {
    foreach ($json in @('{broken','{"version":2,"x":100,"y":10,"collapsed":true}','{"version":1,"x":"100","y":10,"collapsed":true}')) {
        Assert-True ($null -eq [Iris.OverlayPreferences]::Parse($json)) 'Malformed preferences were accepted'
    }
}
Test-Case 'preferences persist only position and collapsed state' {
    $folder = Join-Path ([IO.Path]::GetTempPath()) ('iris-overlay-test-' + [guid]::NewGuid().ToString('N'))
    $path = Join-Path $folder 'display.json'
    try {
        $prefs = [Iris.OverlayPreferences]::Parse('{"version":1,"x":10,"y":20,"collapsed":true,"nickname":"private","token":"secret","clickThrough":true,"hidden":true}')
        [Iris.OverlayPreferences]::Save($path, $prefs)
        $saved = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
        Assert-True ($saved.x -eq 10 -and $saved.y -eq 20 -and $saved.collapsed) 'Preferences did not round trip'
        Assert-True ((($saved.PSObject.Properties.Name | Sort-Object) -join ',') -eq 'collapsed,version,x,y') 'Sensitive or unsafe state was saved'
        $prefs.X = 30
        [Iris.OverlayPreferences]::Save($path, $prefs)
        Assert-True (([Iris.OverlayPreferences]::Parse([IO.File]::ReadAllText($path))).X -eq 30) 'Atomic replacement failed'
    } finally {
        if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path }
        if (Test-Path -LiteralPath $folder) { Remove-Item -LiteralPath $folder }
    }
}
Test-Case 'click through is refused when the recovery shortcut is unavailable' {
    $modes = [Iris.OverlayModes]::new()
    Assert-True (-not $modes.SetClickThrough($true, $false)) 'Click through enabled without recovery'
    Assert-True (-not $modes.ClickThrough -and -not $modes.Hidden) 'Startup was not interactive'
}
Test-Case 'showing a hidden overlay restores interactive input' {
    $modes = [Iris.OverlayModes]::new()
    Assert-True ($modes.SetClickThrough($true, $true)) 'Click through did not enable'
    $modes.ToggleHidden()
    Assert-True $modes.Hidden 'Hide failed'
    $modes.ToggleHidden()
    Assert-True (-not $modes.Hidden -and -not $modes.ClickThrough) 'Restore remained click through'
}
function Wait-Completed($poller) {
    $deadline = [datetime]::UtcNow.AddSeconds(3)
    while (-not $poller.IsCompleted -and [datetime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 10 }
    Assert-True $poller.IsCompleted 'Async response did not finish'
}
Test-Case 'slow snapshot polling returns immediately and refuses overlapping requests' {
    Assert-True ($null -ne ('Iris.SnapshotPoller' -as [type])) 'Async polling is not implemented'
    $handler = [IrisTestHandler]::new()
    $poller = [Iris.SnapshotPoller]::new($handler, 2000)
    try {
        $watch = [Diagnostics.Stopwatch]::StartNew()
        Assert-True ($poller.Start()) 'Request did not start'
        Assert-True ($watch.ElapsedMilliseconds -lt 250) 'Start blocked on the network'
        Assert-True (-not $poller.Start() -and $poller.IsPending) 'Overlapping request started'
        Assert-True ($null -eq $poller.TakeCompleted()) 'Pending request blocked or returned data'
        $handler.Reply(200, '{"status":"connected"}')
        Wait-Completed $poller
        $reply = $poller.TakeCompleted()
        Assert-True ($reply.Success -and $reply.Body -eq '{"status":"connected"}') 'Reply was lost'
        Assert-True ($handler.Requests -eq 1 -and $handler.Address -eq 'http://127.0.0.1:4317/api/snapshot') 'Unexpected destination or duplicate request'
        Assert-True (-not $poller.IsPending) 'Finished request was not released'
    } finally { $poller.Dispose() }
}
Test-Case 'HTTP disconnection does not expose old data as a successful reply' {
    Assert-True ($null -ne ('Iris.SnapshotPoller' -as [type])) 'Async polling is not implemented'
    $handler = [IrisTestHandler]::new()
    $poller = [Iris.SnapshotPoller]::new($handler, 2000)
    try {
        $null = $poller.Start()
        $handler.Reply(503, '{"status":"disconnected"}')
        Wait-Completed $poller
        $reply = $poller.TakeCompleted()
        Assert-True (-not $reply.Success -and $null -eq $reply.Body) 'Disconnected reply exposed data'
    } finally { $poller.Dispose() }
}
Test-Case 'cancel and timeout finish pending polling without starting a second request' {
    Assert-True ($null -ne ('Iris.SnapshotPoller' -as [type])) 'Async polling is not implemented'
    foreach ($cancel in @($true, $false)) {
        $poller = [Iris.SnapshotPoller]::new([IrisTestHandler]::new(), 150)
        try {
            $null = $poller.Start()
            if ($cancel) { $poller.Cancel() }
            Wait-Completed $poller
            Assert-True (-not $poller.Start()) 'Unconsumed request was overwritten'
            Assert-True (-not $poller.TakeCompleted().Success) 'Cancelled request succeeded'
        } finally { $poller.Dispose() }
    }
}
Test-Case 'hiding discards an already completed response until a fresh request succeeds' {
    $handler = [IrisTestHandler]::new()
    $poller = [Iris.SnapshotPoller]::new($handler, 2000)
    try {
        $null = $poller.Start()
        $handler.Reply(200, '{"status":"connected"}')
        Wait-Completed $poller
        $poller.Cancel()
        $reply = $poller.TakeCompleted()
        Assert-True (-not $reply.Success -and $reply.Cancelled) 'Hidden response was displayed after restore'
        Assert-True ($poller.Start()) 'Fresh polling remained blocked'
        $handler.Reply(200, '{"status":"connected"}')
        Wait-Completed $poller
        Assert-True ($poller.TakeCompleted().Success) 'Cancellation poisoned a fresh response'
    } finally { $poller.Dispose() }
}
Test-Case 'connected snapshot displays actual values and disconnect clears every row' {
    Assert-True ($null -ne ('Iris.SnapshotDisplay' -as [type])) 'Snapshot display is not implemented'
    $display = [Iris.SnapshotDisplay]::new()
    $now = [DateTimeOffset]::UtcNow
    $json = @{status='connected';data=@{observedAt=$now.ToString('o');character=@{job='TestJob';level=50;combatScore=123456;livingScore=12;attractivenessScore=13;arcaneResistance=14;decorScore=15};processing=@{available=$true;facilityCount=2;completed=1};missions=@{daily=@{available=$true;completed=3;total=5};weekly=@{available=$false}}}} | ConvertTo-Json -Depth 8 -Compress
    Assert-True ($display.Apply($json, $now)) 'Valid snapshot rejected'
    Assert-True ($display.Connected -and $display.Values[0] -eq 'TestJob Lv.50' -and $display.Values[1] -eq '123,456' -and $display.Values[7] -eq "3/5 $([char]0x00b7) $([char]0x2014)") 'Displayed values were wrong'
    $null = $display.Apply('{"status":"disconnected"}', $now)
    Assert-True (-not $display.Connected -and @($display.Values | Where-Object {$_ -ne [string][char]0x2014}).Count -eq 0) 'Old values remained after disconnect'
}
Test-Case 'stale and malformed snapshots clear old values instead of inventing zero' {
    Assert-True ($null -ne ('Iris.SnapshotDisplay' -as [type])) 'Snapshot display is not implemented'
    $display = [Iris.SnapshotDisplay]::new()
    $now = [DateTimeOffset]::UtcNow
    $json = @{status='connected';data=@{observedAt=$now.ToString('o');character=@{job='TestJob';level=$null;combatScore=$null}}} | ConvertTo-Json -Depth 8 -Compress
    Assert-True ($display.Apply($json,$now) -and $display.Values[1] -eq [string][char]0x2014) 'Missing score became zero'
    $display.Expire($now.AddSeconds(31))
    Assert-True (-not $display.Connected) 'Stale snapshot remained connected'
    foreach ($invalid in @('{broken','{"status":"connected","data":{}}',$json)) {
        Assert-True (-not $display.Apply($invalid,$now.AddMinutes(2))) 'Stale or malformed snapshot accepted'
    }
}
$nativePath = Join-Path $PSScriptRoot 'overlay-native.cs'
$nativeLoaded = Test-Path -LiteralPath $nativePath
if ($nativeLoaded) {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $shortcutFixture = @'
public sealed class IrisTestShortcuts : Iris.IShortcutRegistry {
    public int Registrations;
    public int Releases;
    public int FailOn;
    public bool Register(int id, uint modifiers, uint key) {
        if (modifiers != 0x4003 || (key != 0x49 && key != 0x4f)) throw new Exception("Unexpected shortcut");
        Registrations++;
        return Registrations != FailOn;
    }
    public void Unregister(int id) { Releases++; }
}
'@
    $modulePath = Join-Path $PSScriptRoot 'overlay-modules.cs'
    $moduleSource = if (Test-Path -LiteralPath $modulePath) { Get-Content -LiteralPath $modulePath -Raw -Encoding UTF8 } else { '' }
    Add-Type -TypeDefinition ((Get-Content -LiteralPath $nativePath -Raw -Encoding UTF8) + [Environment]::NewLine + $moduleSource + [Environment]::NewLine + $shortcutFixture) -ReferencedAssemblies System.dll,System.Core.dll,System.Windows.Forms.dll,System.Drawing.dll
}
Test-Case 'independent stats module displays all rows and clears missing values' {
    Assert-True ($null -ne ('Iris.ModuleWindow' -as [type])) 'Independent modules are not implemented'
    $owner = [Iris.OverlayWindow]::new()
    $module = [Iris.ModuleWindow]::new('Status', @('Job','Power','Living','Charm','Resistance','Decor'), $owner)
    try {
        $module.SetValues(@('LongJob Lv.100','123,456','12','13','14','15'))
        Assert-True ($module.RenderedValues.Count -eq 6 -and $module.RenderedValues[1] -eq '123,456' -and $module.RenderedValues[5] -eq '15') 'Module lost a metric'
        $module.SetValues(@('NewJob'))
        Assert-True ($module.RenderedValues[0] -eq 'NewJob' -and $module.RenderedValues[1] -eq [string][char]0x2014) 'Partial response retained old values'
        Assert-True (-not $module.OwnsShortcuts -and $module.ShortcutOwner -eq $owner) 'Module would duplicate global shortcut registration'
    } finally { $module.Dispose(); $owner.Dispose() }
}
Test-Case 'module accordion restores its full height and retains metric values' {
    Assert-True ($null -ne ('Iris.ModuleWindow' -as [type])) 'Independent modules are not implemented'
    $owner = [Iris.OverlayWindow]::new()
    $module = [Iris.ModuleWindow]::new('Processing', @('Ready'), $owner)
    try {
        $expanded = $module.Height
        $module.SetValues(@('2 ready'))
        $module.SetCollapsed($true)
        Assert-True ($module.Height -eq 44 -and $module.Collapsed) 'Accordion did not close'
        $module.SetCollapsed($false)
        Assert-True ($module.Height -eq $expanded -and $module.RenderedValues[0] -eq '2 ready') 'Accordion lost content or size'
    } finally { $module.Dispose(); $owner.Dispose() }
}
Test-Case 'whole-overlay restore preserves a module explicitly hidden by the user' {
    Assert-True ($null -ne ('Iris.ModuleWindow' -as [type])) 'Independent modules are not implemented'
    $owner = [Iris.OverlayWindow]::new()
    $module = [Iris.ModuleWindow]::new('Missions', @('Daily/Weekly'), $owner)
    try {
        $module.HideByUser()
        $module.RestoreIfEnabled()
        Assert-True (-not $module.EnabledByUser -and -not $module.Visible) 'Global restore reopened a deliberately hidden module'
        Assert-True (-not $module.ApplyClickThrough($true)) 'Module enabled click through without owner recovery'
    } finally { $module.Dispose(); $owner.Dispose() }
}
Test-Case 'module recovery clamps expanded bounds after a monitor is removed' {
    $tokens = $null; $errors = $null
    $tree = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'), [ref]$tokens, [ref]$errors)
    $move = $tree.Find({param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Move-IrisModuleInsideScreen'}, $true)
    Assert-True ($null -ne $move) 'Module recovery placement is not implemented'
    . ([scriptblock]::Create($move.Extent.Text))
    $owner = [Iris.OverlayWindow]::new()
    $module = [Iris.ModuleWindow]::new('Stats', @('Job','Power'), $owner)
    try {
        $module.Location = [Drawing.Point]::new(-1000,1500)
        $module.SetCollapsed($true)
        Move-IrisModuleInsideScreen $module @(@{x=0;y=0;width=1920;height=1080})
        Assert-True ($module.Left -eq 0 -and $module.Top -eq 964) "Module recovery bounds: x=$($module.Left), y=$($module.Top), expanded=$($module.ExpandedHeight)"
    } finally { $module.Dispose(); $owner.Dispose(); Remove-Item Function:Move-IrisModuleInsideScreen }
}
Test-Case 'system close hides an individual module instead of disposing its shared display' {
    $owner = [Iris.OverlayWindow]::new()
    $module = [Iris.ModuleWindow]::new('Stats', @('Job'), $owner)
    try {
        $closing = [Windows.Forms.FormClosingEventArgs]::new([Windows.Forms.CloseReason]::UserClosing, $false)
        $method = [Windows.Forms.Form].GetMethod('OnFormClosing', [Reflection.BindingFlags]'Instance,NonPublic')
        $method.Invoke($module, @($closing)) | Out-Null
        Assert-True ($closing.Cancel -and -not $module.EnabledByUser -and -not $module.IsDisposed) 'Individual system close could dispose a module still used by the shared timer'
    } finally { $module.Dispose(); $owner.Dispose() }
}
Test-Case 'shortcut collision releases partial registration and disables recovery' {
    Assert-True $nativeLoaded 'Native shortcut support is not implemented'
    $registry = [IrisTestShortcuts]::new()
    $registry.FailOn = 2
    $recovery = [Iris.HotkeyRecovery]::new($registry)
    Assert-True (-not $recovery.Available -and $registry.Releases -eq 1) 'Partial shortcut remained registered'
    $recovery.Dispose()
    Assert-True ($registry.Releases -eq 1) 'Shortcut released twice'
}
Test-Case 'successful shortcuts release both registrations exactly once on close' {
    Assert-True $nativeLoaded 'Native shortcut support is not implemented'
    $registry = [IrisTestShortcuts]::new()
    $recovery = [Iris.HotkeyRecovery]::new($registry)
    Assert-True ($recovery.Available -and $registry.Registrations -eq 2) 'Recovery shortcuts unavailable'
    $recovery.Dispose()
    $recovery.Dispose()
    Assert-True ($registry.Releases -eq 2 -and -not $recovery.Available) 'Native resources leaked'
}
Test-Case 'click through window style preserves existing flags and restores input' {
    Assert-True $nativeLoaded 'Native shortcut support is not implemented'
    $existing = 0x80088
    $through = [Iris.OverlayWindow]::StyleFor($existing, $true)
    $restored = [Iris.OverlayWindow]::StyleFor($through, $false)
    Assert-True ($through -eq ($existing -bor 0x20) -and $restored -eq $existing) 'Other window flags were changed'
}
Test-Case 'actual PowerShell timer handles slow, connected and disconnected replies without blocking' {
    $parseTokens = $null
    $parseErrors = $null
    $tree = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'), [ref]$parseTokens, [ref]$parseErrors)
    Assert-True ($parseErrors.Count -eq 0) 'Overlay script does not parse'
    $render = $tree.Find({param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Update-IrisSnapshot'}, $true)
    Set-Item -Path Function:Update-IrisSnapshot -Value $render.Body.GetScriptBlock()
    foreach($name in @('Poll-IrisConnection','Update-IrisConnection')) {
        $fn=$tree.Find({param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq $name},$true)
        Set-Item -Path ('Function:'+$name) -Value $fn.Body.GetScriptBlock()
    }
    $timerCall = $tree.Find({param($node) $node -is [System.Management.Automation.Language.InvokeMemberExpressionAst] -and $node.Member.Value -eq 'Add_Tick'}, $true)
    $tick = $timerCall.Arguments[0].ScriptBlock.GetScriptBlock()
    # Only the external label/window boundary is replaced; execute the actual script's timer and renderer.
    $values = @(1..8 | ForEach-Object { [pscustomobject]@{Text='old'} })
    $moduleOwner = [Iris.OverlayWindow]::new()
    $modules = @(
        [Iris.ModuleWindow]::new('Stats', @('Job','Power','Living','Charm','Resistance','Decor'), $moduleOwner),
        [Iris.ModuleWindow]::new('Processing', @('Metal','Wood','Leather','Fabric','Potion','Food'), $moduleOwner, $true),
        [Iris.ModuleWindow]::new('Game missions', @('Daily/Weekly'), $moduleOwner),
        [Iris.ModuleWindow]::new('Sanctum', @('Status','Character','Daily','Weekly','Abyss','Raid'),$moduleOwner,$false,105)
    )
    $characterSelect=[Windows.Forms.ComboBox]::new()
    $connectSanctum=[Windows.Forms.Button]::new();$confirmCharacter=[Windows.Forms.Button]::new()
    $script:connectionView=[Iris.ConnectionDisplay]::new()
    $script:ownedReady=$false; $script:ownedStart=$null; $script:nativeTask=$null; $script:lastSelection=$null; $script:nativeDiscard=$false
    $status = [pscustomobject]@{Text='';ForeColor=''}
    $green = 'green'; $sub = 'sub'; $warning = 'warning'
    $script:modes = [Iris.OverlayModes]::new()
    $script:nextPoll = [DateTimeOffset]::MinValue
    $script:failures = 0
    $display = [Iris.SnapshotDisplay]::new()
    $handler = [IrisTestHandler]::new()
    $poller = [Iris.SnapshotPoller]::new($handler, 2000)
    try {
        $watch = [Diagnostics.Stopwatch]::StartNew()
        & $tick
        Assert-True ($watch.ElapsedMilliseconds -lt 250 -and $poller.IsPending) 'Timer blocked on HTTP'
        $facility=([char]0xBAA9).ToString()+[char]0xC7AC+' '+[char]0xAC00+[char]0xACF5+' '+[char]0xC2DC+[char]0xC124
        $json = @{status='connected';data=@{observedAt=[DateTimeOffset]::UtcNow.ToString('o');character=@{job='TestJob';level=50;combatScore=123456};processing=@{available=$true;facilities=@(@{name=$facility;completed=1;total=3;remainingSeconds=60})}}} | ConvertTo-Json -Depth 8 -Compress
        $handler.Reply(200, $json)
        Wait-Completed $poller
        & $tick
        Assert-True ($modules[0].RenderedValues[1] -eq '123,456' -and $status.ForeColor -eq 'green') 'Actual timer did not distribute the snapshot to independent modules'
        $gauges=@($modules[1].Controls | Where-Object {$_ -is [Iris.ProcessingSlots]})
        Assert-True ($gauges[1].Value -eq 33 -and $modules[1].RenderedValues[1].Contains('1:00')) 'Actual timer lost processing grid values'
        $script:nextPoll = [DateTimeOffset]::MinValue
        & $tick
        $handler.Reply(503, '{}')
        Wait-Completed $poller
        & $tick
        Assert-True ($modules[0].RenderedValues[1] -eq [string][char]0x2014 -and $modules[1].RenderedValues[0] -eq [string][char]0x2014 -and $status.ForeColor -eq 'warning') 'Actual timer retained old module values after disconnect'
        Assert-True ($gauges[1].Value -eq 0) 'Actual timer retained a disconnected processing gauge'
        Assert-True ($script:failures -eq 1 -and $script:nextPoll -gt [DateTimeOffset]::UtcNow.AddSeconds(4)) 'Failed polling did not back off'
        $script:modes.ToggleHidden()
        $script:nextPoll = [DateTimeOffset]::MinValue
        & $tick
        Assert-True (-not $poller.IsPending) 'Hidden timer started polling'
        # A completed native response from before hiding must also be discarded
        # when the user restores before the timer consumes it.
        $script:modes.ToggleHidden()
        $native='{"generation":3,"selectionVersion":4,"accountId":"a","characters":[{"id":"7","nickname":"Test"}],"selectedId":"7","status":"connected","summary":{"daily":{"completed":1,"total":2},"weekly":{"completed":0,"total":1},"abyss":{"completed":0,"total":1},"raid":{"completed":0,"total":1}}}'
        $script:nativeTask=[Threading.Tasks.Task]::FromResult([string]$native)
        $script:nativeKind='state';$script:nativeDiscard=$true
        & $tick
        Assert-True ($modules[3].RenderedValues[2] -eq [string][char]0x2014 -and $null -eq $script:nativeTask) 'Completed pre-hide native reply survived restoration'
        $pending=[Threading.Tasks.TaskCompletionSource[string]]::new()
        $script:nativeTask=$pending.Task; $script:nativeKind='state';$script:nativeDiscard=$true
        & $tick
        Assert-True ($null -ne $script:nativeTask) 'Slow native request was overlapped'
        $pending.SetResult($native); & $tick
        Assert-True ($modules[3].RenderedValues[2] -eq [string][char]0x2014 -and $null -eq $script:nativeTask) 'Late native reply survived restoration'
    } finally {
        $poller.Dispose(); foreach ($module in $modules) { $module.Dispose() }; $moduleOwner.Dispose()
        $characterSelect.Dispose();$connectSanctum.Dispose();$confirmCharacter.Dispose()
        Remove-Item Function:Update-IrisSnapshot,Function:Poll-IrisConnection,Function:Update-IrisConnection
    }
}
Test-Case 'hiding during a drag releases mouse capture so restore cannot keep dragging' {
    $tokens = $null; $errors = $null
    $tree = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'), [ref]$tokens, [ref]$errors)
    $hide = $tree.Find({param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Hide-Iris'}, $true).Body.GetScriptBlock()
    $script:dragging = $true
    $script:modes = [Iris.OverlayModes]::new()
    $title = [pscustomobject]@{Capture=$true}
    $form = [pscustomobject]@{Capture=$true;Hidden=$false}
    $form | Add-Member ScriptMethod Hide { $this.Hidden = $true }
    $display = [Iris.SnapshotDisplay]::new()
    $poller = [Iris.SnapshotPoller]::new([IrisTestHandler]::new(),2000)
    function Update-IrisModes { }
    try {
        $script:nativeTask=[pscustomobject]@{IsCompleted=$false}
        & $hide
        Assert-True ($form.Hidden -and -not $script:dragging -and -not $title.Capture -and -not $form.Capture) 'Hidden drag kept capturing mouse input'
        Assert-True $script:nativeDiscard 'Native request was not marked for discard on hiding'
        $script:modes.ToggleHidden();$script:nativeTask=$null
        & $hide
        Assert-True (-not $script:nativeDiscard) 'Idle hiding would discard the next new connection request'
    } finally { $script:nativeTask=$null; $poller.Dispose() }
}
Test-Case 'command center hide releases capture without hiding other widgets or pausing updates' {
    $tokens=$null; $errors=$null
    $tree=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'),[ref]$tokens,[ref]$errors)
    $fn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Hide-IrisCommandCenter'},$true)
    Assert-True ($null -ne $fn) 'Command center hide is not implemented'
    . ([scriptblock]::Create($fn.Extent.Text))
    $form=[Windows.Forms.Form]::new(); $title=[Windows.Forms.Label]::new()
    $script:modes=[Iris.OverlayModes]::new(); $script:dragging=$true
    try {
        Hide-IrisCommandCenter
        Assert-True (-not $form.Visible -and -not $script:dragging -and -not $script:modes.Hidden) 'Center hide paused or globally hid widgets'
    } finally { $title.Dispose(); $form.Dispose(); Remove-Item Function:Hide-IrisCommandCenter }
}
Test-Case 'whole application exit requires approval and ignores nested requests' {
    $tokens=$null; $errors=$null
    $tree=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'),[ref]$tokens,[ref]$errors)
    $fn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Request-IrisExit'},$true)
    Assert-True ($null -ne $fn) 'Exit confirmation is not implemented'
    . ([scriptblock]::Create($fn.Extent.Text))
    $form=[pscustomobject]@{Closes=0}; $form | Add-Member ScriptMethod Close {$this.Closes++}
    $script:exitConfirmed=$false; $script:exitPromptOpen=$false
    function Confirm-IrisExit { return $false }
    Request-IrisExit
    Assert-True ($form.Closes -eq 0 -and -not $script:exitConfirmed -and -not $script:exitPromptOpen) 'Canceled exit closed IRIS'
    function Confirm-IrisExit { Request-IrisExit; return $true }
    Request-IrisExit
    Assert-True ($form.Closes -eq 1 -and $script:exitConfirmed -and -not $script:exitPromptOpen) 'Confirmed exit repeated or failed'
    Remove-Item Function:Confirm-IrisExit,Function:Request-IrisExit
}
Test-Case 'user closing center hides but OS shutdown is not canceled' {
    $tokens=$null; $errors=$null
    $tree=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'),[ref]$tokens,[ref]$errors)
    $fn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Handle-IrisClosing'},$true)
    Assert-True ($null -ne $fn) 'Center close protection is not implemented'
    . ([scriptblock]::Create($fn.Extent.Text))
    function Hide-IrisCommandCenter { $script:didHide=$true }
    $script:exitConfirmed=$false; $script:didHide=$false
    $e=[Windows.Forms.FormClosingEventArgs]::new([Windows.Forms.CloseReason]::UserClosing,$false)
    Handle-IrisClosing $null $e
    Assert-True ($e.Cancel -and $script:didHide) 'Alt-F4 exited application'
    $e=[Windows.Forms.FormClosingEventArgs]::new([Windows.Forms.CloseReason]::WindowsShutDown,$false)
    Handle-IrisClosing $null $e
    Assert-True (-not $e.Cancel) 'IRIS blocked Windows shutdown'
    Remove-Item Function:Hide-IrisCommandCenter,Function:Handle-IrisClosing
}
Test-Case 'display settings reject invisible opacity and unknown themes and ignore secrets on save' {
    Assert-True ($null -ne ('Iris.DisplayPreferences' -as [type])) 'Display preferences not implemented'
    foreach ($json in @('{"version":1,"theme":"lumen","opacityPercent":0}', '{"version":1,"theme":"unknown","opacityPercent":94}', '{"version":1,"theme":"aureum","opacityPercent":101}', '{"version":1,"theme":"aureum","opacityPercent":"94"}', 'null')) {
        Assert-True ($null -eq [Iris.DisplayPreferences]::Parse($json)) 'Unsafe display settings accepted'
    }
    $prefs=[Iris.DisplayPreferences]::Parse('{"version":1,"theme":"lumen","opacityPercent":40,"token":"not-a-real-secret"}')
    Assert-True ($prefs.Theme -eq 'lumen' -and $prefs.OpacityPercent -eq 40) 'Valid settings not loaded'
    $path=Join-Path ([IO.Path]::GetTempPath()) ('iris-display-test-' + [Guid]::NewGuid().ToString('N') + '.json')
    try {
        [Iris.DisplayPreferences]::Save($path,$prefs)
        $data=[IO.File]::ReadAllText($path) | ConvertFrom-Json
        Assert-True ($data.PSObject.Properties.Name.Count -eq 3 -and -not $data.token) 'Display persistence leaked additional data'
        $prefs.OpacityPercent=100
        [Iris.DisplayPreferences]::Save($path,$prefs)
        Assert-True ([Iris.DisplayPreferences]::Parse([IO.File]::ReadAllText($path)).OpacityPercent -eq 100) 'Atomic replacement failed'
    } finally { if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path } }
}
Test-Case 'appearance settings apply readable six-theme palettes and opacity to every widget' {
    $tokens=$null; $errors=$null
    $tree=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'),[ref]$tokens,[ref]$errors)
    $fn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Apply-IrisAppearance'},$true)
    Assert-True ($null -ne $fn) 'Appearance application not implemented'
    . ([scriptblock]::Create($fn.Extent.Text))
    $form=[Iris.OverlayWindow]::new(); $module=[Iris.ModuleWindow]::new('Stats',@('Job'),$form); $modules=@($module)
    $title=[Windows.Forms.Label]::new(); $hint=[Windows.Forms.Label]::new(); $foot=[Windows.Forms.Label]::new(); $close=[Windows.Forms.Button]::new()
    $form.Controls.Add($title); $form.Controls.Add($hint); $form.Controls.Add($foot); $form.Controls.Add($close)
    $script:appearance=[Iris.DisplayPreferences]::new()
    try {
        foreach ($theme in @('aureum','lumen','nemeton','vesper','rosarium','elysium')) {
            $script:appearance.Theme=$theme; $script:appearance.OpacityPercent=40
            Apply-IrisAppearance
            Assert-True ($form.Opacity -eq .4 -and $module.Opacity -eq .4 -and $form.BackColor -eq $module.BackColor -and $form.BackColor -ne $form.ForeColor) 'Widget appearance mismatched or unreadable'
        }
        $script:appearance.Theme='lumen'; $script:appearance.OpacityPercent=100
        Apply-IrisAppearance
        Assert-True ($form.BackColor.ToArgb() -eq [Drawing.Color]::White.ToArgb() -and $form.Opacity -eq 1) 'Light theme or opacity not restored'
    } finally { $module.Dispose(); $form.Dispose(); Remove-Item Function:Apply-IrisAppearance }
}
Test-Case 'six facility summaries map exactly and clear unavailable or stale processing values' {
    $display=[Iris.SnapshotDisplay]::new()
    Assert-True ($null -ne $display.PSObject.Properties['ProcessingValues']) 'Processing rows not implemented'
    $now=[DateTimeOffset]::UtcNow
    $suffix=' '+[char]0xAC00+[char]0xACF5+' '+[char]0xC2DC+[char]0xC124
    $wood=([char]0xBAA9).ToString()+[char]0xC7AC+$suffix
    $metal=([char]0xAE08).ToString()+[char]0xC18D+$suffix
    $potion=([char]0xC57D).ToString()+[char]0xD488+$suffix
    $json=@{status='connected';data=@{observedAt=$now.ToString('o');character=@{job='Test'};processing=@{available=$true;facilities=@(
        @{name=$wood;completed=1;total=3;remainingSeconds=60},
        @{name=$metal;completed=2;total=2;remainingSeconds=$null},
        @{name=$potion;completed=0;total=1;remainingSeconds=$null},
        @{name='Unknown facility';completed=9;total=9;remainingSeconds=1}
    )}}} | ConvertTo-Json -Depth 8 -Compress
    Assert-True ($display.Apply($json,$now)) 'Valid processing snapshot rejected'
    Assert-True ($display.ProcessingValues.Count -eq 6 -and $display.ProcessingCompleted[1] -eq 1 -and $display.ProcessingTotal[1] -eq 3 -and $display.ProcessingValues[1].Contains('1:00')) 'Facility mapping or time lost'
    Assert-True ($display.ProcessingTotal[2] -eq 0 -and $display.ProcessingValues[2] -eq (([char]0xB300).ToString()+[char]0xAE30)) 'Empty facility not distinguished'
    Assert-True ($display.ProcessingValues[4].Contains(([char]0xBBF8).ToString()+[char]0xC0C1)) 'Missing time invented zero'
    $display.Clear()
    Assert-True ($display.ProcessingTotal[1] -eq 0 -and $display.ProcessingValues[1] -eq [string][char]0x2014) 'Disconnected processing retained old data'
}
Test-Case 'processing grid has six non-overlapping cells and clears completion gauges on disconnect' {
    $owner=[Iris.OverlayWindow]::new()
    $ctor=[Iris.ModuleWindow].GetConstructor(@([string],[string[]],[Iris.OverlayWindow],[bool]))
    Assert-True ($null -ne $ctor) 'Processing grid constructor not implemented'
    $grid=[Iris.ModuleWindow]::new('Processing',@('Metal','Wood','Leather','Fabric','Potion','Food'),$owner,$true)
    try {
        $grid.SetProcessing(@('1/3','2/2'),@(1,2),@(3,2))
        $gauges=@($grid.Controls | Where-Object {$_ -is [Iris.ProcessingSlots]})
        Assert-True ($gauges.Count -eq 6 -and @($gauges.Left | Select-Object -Unique).Count -eq 3 -and @($gauges.Top | Select-Object -Unique).Count -eq 2) 'Grid not arranged three by two'
        Assert-True ($gauges[0].Value -eq 33 -and $gauges[1].Value -eq 100 -and $gauges[5].Value -eq 0) 'Gauge is not completed item proportion'
        foreach ($control in $grid.Controls) { Assert-True ($control.Right -le $grid.ClientSize.Width -and $control.Bottom -le $grid.ClientSize.Height) 'Processing content outside card' }
        $grid.SetCollapsed($true); $grid.SetCollapsed($false)
        Assert-True ($grid.Height -eq $grid.ExpandedHeight -and $gauges[0].Value -eq 33) 'Collapse lost progress'
        $grid.SetValues($null)
        Assert-True ($gauges[0].Value -eq 0 -and $grid.RenderedValues[0] -eq [string][char]0x2014) 'Disconnected grid kept old count'
    } finally {$grid.Dispose();$owner.Dispose()}
}
Test-Case 'malformed facility list is not reported as idle processing' {
    $display=[Iris.SnapshotDisplay]::new();$now=[DateTimeOffset]::UtcNow
    $json=@{status='connected';data=@{observedAt=$now.ToString('o');character=@{job='Test'};processing=@{available=$true;facilities=@{bad='not an array'}}}} | ConvertTo-Json -Depth 8 -Compress
    Assert-True ($display.Apply($json,$now)) 'Malformed optional data broke character display'
    $unavailable=([char]0xC870).ToString()+[char]0xD68C+' '+[char]0xBD88+[char]0xAC00
    Assert-True ($display.ProcessingValues[0] -eq $unavailable) 'Malformed facility list invented idle state'
}
Test-Case 'facility whitespace variation retains its registered category instead of inventing idle' {
    $display=[Iris.SnapshotDisplay]::new();$now=[DateTimeOffset]::UtcNow
    $name=([char]0xBAA9).ToString()+[char]0xC7AC+[char]0xA0+[char]0xAC00+[char]0xACF5+"`t"+[char]0xC2DC+[char]0xC124
    $json=@{status='connected';data=@{observedAt=$now.ToString('o');character=@{job='Test'};processing=@{available=$true;facilities=@(@{name=$name;completed=1;total=2;remainingSeconds=10})}}} | ConvertTo-Json -Depth 8 -Compress
    Assert-True ($display.Apply($json,$now)) 'Optional processing prevented character display'
    Assert-True ($display.ProcessingTotal[1] -eq 2 -and $display.ProcessingCompleted[1] -eq 1) 'Whitespace facility name was reported idle'
}
Test-Case 'processing slots represent individual completed jobs and bound huge queues without inventing counts' {
    Assert-True ($null -ne ('Iris.ProcessingSlots' -as [type])) 'Individual processing slots not implemented'
    $slots=[Iris.ProcessingSlots]::new()
    try {
        $slots.SetCounts(5,7)
        Assert-True ($slots.CompletedCount -eq 5 -and $slots.TotalCount -eq 7 -and $slots.VisibleSlots -eq 7 -and $slots.HiddenSlots -eq 0) 'Seven jobs not represented by seven slots'
        $slots.SetCounts(100,10000)
        Assert-True ($slots.VisibleSlots -eq 14 -and $slots.HiddenSlots -eq 9986 -and $slots.CompletedCount -eq 100) 'Large queue count lost or unbounded rendering'
        $slots.SetCounts(8,7)
        Assert-True ($slots.VisibleSlots -eq 0 -and $slots.TotalCount -eq 0) 'Invalid queue rendered completed jobs'
    } finally {$slots.Dispose()}
}
Test-Case 'painted capsule colors distinguish completed jobs from waiting jobs' {
    $slots=[Iris.ProcessingSlots]::new()
    $slots.BackColor=[Drawing.Color]::Black
    $slots.ForeColor=[Drawing.Color]::Orange
    $bitmap=[Drawing.Bitmap]::new(130,18)
    try {
        $slots.SetCounts(2,3)
        $slots.DrawToBitmap($bitmap,[Drawing.Rectangle]::new(0,0,130,18))
        Assert-True ($bitmap.GetPixel(8,3).ToArgb() -eq [Drawing.Color]::Orange.ToArgb() -and $bitmap.GetPixel(27,3).ToArgb() -eq [Drawing.Color]::Orange.ToArgb()) 'Completed capsules not painted'
        Assert-True ($bitmap.GetPixel(46,3).ToArgb() -ne [Drawing.Color]::Orange.ToArgb() -and $bitmap.GetPixel(46,3).ToArgb() -ne [Drawing.Color]::Black.ToArgb()) 'Waiting capsule indistinguishable or missing'
        Assert-True ($bitmap.GetPixel(65,3).ToArgb() -eq [Drawing.Color]::Black.ToArgb()) 'Extra job invented by rendering'
    } finally {$bitmap.Dispose();$slots.Dispose()}
}
Test-Case 'remembered selection is only suggested for the same account and current ownership' {
    $prefs=[Iris.RememberedSelection]::Parse('{"version":1,"accountId":"a","characterId":"7","token":"SECRET"}')
    Assert-True ($prefs.Suggest('a',@('7','8')) -eq '7') 'Own remembered ID not suggested'
    Assert-True ($null -eq $prefs.Suggest('b',@('7'))) 'Different account reused remembered ID'
    Assert-True ($null -eq $prefs.Suggest('a',@('8'))) 'Removed character reused remembered ID'
    Assert-True ($null -eq [Iris.RememberedSelection]::Parse('{"version":2,"accountId":"a","characterId":"7"}')) 'Bad version accepted'
    $path=Join-Path ([IO.Path]::GetTempPath()) ('iris-selection-'+[Guid]::NewGuid().ToString('N')+'.json')
    try {
        [Iris.RememberedSelection]::Save($path,$prefs)
        $json=[IO.File]::ReadAllText($path) | ConvertFrom-Json
        Assert-True (@($json.PSObject.Properties).Count -eq 3 -and $null -eq $json.token) 'Unexpected selection data saved'
    } finally {if(Test-Path -LiteralPath $path) {Remove-Item -LiteralPath $path}}
}
Test-Case 'native KRONOS display is distinct from game missions and clears stale or malformed data' {
    $view=[Iris.ConnectionDisplay]::new()
    $now=[DateTimeOffset]::UtcNow
    $name=-join (0..11 | ForEach-Object { [char](0xAC00+$_) })
    $empty=[string][char]0x2014
    $json='{"generation":3,"selectionVersion":4,"accountId":"a","characters":[{"id":"7","nickname":"NAME"}],"selectedId":"7","status":"connected","summary":{"daily":{"completed":1,"total":2},"weekly":{"completed":3,"total":4},"abyss":{"completed":0,"total":1},"raid":{"completed":1,"total":1}}}'.Replace('NAME',$name)
    Assert-True ($view.Apply($json,$now)) 'Valid native state refused'
    Assert-True ($view.Values[1] -eq $name -and $view.Values[2] -eq '1/2') 'Nickname or summary missing'
    $view.Expire($now.AddSeconds(61))
    Assert-True ($view.Characters.Count -eq 0 -and $view.Values[2] -eq $empty) 'Stale summary retained'
    Assert-True (-not $view.Apply($json.Replace('"completed":1,"total":2','"completed":9,"total":2'),$now)) 'Bad counts accepted'
    Assert-True ($view.Values[2] -eq $empty) 'Malformed state left prior counts'
}
Test-Case 'owned bootstrap passes no capability on command line and closes only its own server' {
    $reservation = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
    $reservation.Start(); $port=$reservation.LocalEndpoint.Port; $reservation.Stop()
    $owned=[Iris.OwnedServer]::new()
    try {
        $ready=$owned.StartAsync((Join-Path $PSScriptRoot 'owned-server.mjs'),$port).GetAwaiter().GetResult()
        Assert-True $ready 'Owned child bootstrap did not become ready'
        $state=$owned.RequestAsync('state','GET',$null).GetAwaiter().GetResult() | ConvertFrom-Json
        Assert-True ($state.status -eq 'disconnected') 'Private native capability was not accepted'
        $start=$owned.RequestAsync('connect','POST','{}').GetAwaiter().GetResult() | ConvertFrom-Json
        Assert-True ($start.generation -gt 0 -and $start.browserToken.Length -ge 43) 'Native connect unavailable'
    } finally { $owned.Dispose() }
    $probe=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$port)
    try { $probe.Start() } finally { $probe.Stop() }
}
foreach($editRoute in @('edits','edits/submit','edits/discard')) {
    Test-Case ('owned native client transports authorized POST '+$editRoute+' without bypassing server validation') {
        $reservation=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
        $reservation.Start();$port=$reservation.LocalEndpoint.Port;$reservation.Stop()
        $owned=[Iris.OwnedServer]::new()
        try {
            Assert-True ($owned.StartAsync((Join-Path $PSScriptRoot 'owned-server.mjs'),$port).GetAwaiter().GetResult()) 'Owned test server unavailable'
            # No browser consent or real identity: malformed requests must reach
            # the real HTTP handler and be rejected there, not by a stale client allowlist.
            $failure=$null
            try {$null=$owned.RequestAsync($editRoute,'POST','{}').GetAwaiter().GetResult()} catch {
                $failure=$_.Exception
                while($failure.InnerException) {$failure=$failure.InnerException}
            }
            Assert-True ($failure -is [Net.Http.HttpRequestException] -and $failure.Message.Contains('409')) ('Expected server 409, got '+$failure)
            foreach($badRoute in @($editRoute,'edits/unknown','../edits','browser/write-consent')) {
                $failure=$null
                try {$null=$owned.RequestAsync($badRoute,'GET','{}').GetAwaiter().GetResult()} catch {
                    $failure=$_.Exception
                    while($failure.InnerException) {$failure=$failure.InnerException}
                }
                Assert-True ($failure -is [ArgumentException]) 'Invalid route/method escaped native boundary'
            }
            $state=$owned.RequestAsync('state','GET',$null).GetAwaiter().GetResult() | ConvertFrom-Json
            Assert-True ($state.status -eq 'disconnected' -and @($state.editQueue.edits).Count -eq 0) 'Rejected edit changed state'
        } finally {$owned.Dispose()}
    }
}
Test-Case 'connection detail model retains saved class levels and clears all rows on invalid or expired data' {
    $view=[Iris.ConnectionDisplay]::new()
    $now=[DateTimeOffset]::UtcNow
    $taskName=([string][char]0xC77C)+([string][char]0xAC04)
    $state=@{generation=1;selectionVersion=1;accountId='a';characters=@(@{id='7';nickname='Test'});selectedId='7';status='connected';
        summary=@{daily=@{completed=1;total=1};weekly=@{completed=0;total=0};abyss=@{completed=0;total=0};raid=@{completed=0;total=0}};
        details=@{schemaVersion=1;tasks=@{daily=@(@{id='1';name=$taskName;completed=1;total=1});weekly=@();abyss=@();raid=@()};
            classes=@(@{id='1';name='Warrior';level=65},@{id='2';name='Mage';level=$null})}}
    Assert-True ($view.Apply(($state | ConvertTo-Json -Depth 15 -Compress),$now)) 'Valid details rejected'
    Assert-True ($view.HasDetails -and $view.Tasks['daily'][0].Name -eq $taskName) 'Task detail missing'
    Assert-True ($view.Classes[0].Level -eq 65 -and $null -eq $view.Classes[1].Level) 'Saved or missing class level wrong'
    $state.details.tasks.daily[0].completed=0
    Assert-True (-not $view.Apply(($state | ConvertTo-Json -Depth 15 -Compress),$now)) 'Mismatched summary accepted'
    Assert-True (-not $view.HasDetails -and $view.Classes.Count -eq 0) 'Invalid data left rows visible'
    $state.details.tasks.daily[0].completed=1
    $null=$view.Apply(($state | ConvertTo-Json -Depth 15 -Compress),$now)
    $view.Expire($now.AddSeconds(61))
    Assert-True (-not $view.HasDetails -and $view.Tasks.Count -eq 0) 'Expired detail remained'
    $state.Remove('details')
    Assert-True ($view.Apply(($state | ConvertTo-Json -Depth 15 -Compress),$now) -and -not $view.HasDetails) 'Legacy summary rejected'
}
Test-Case 'widget opacity has bounded independent defaults and no private persistence' {
    $type='Iris.WidgetDisplayPreferences' -as [type]
    Assert-True ($null -ne $type) 'Widget display preferences are not implemented'
    foreach($bad in @('{broken','{"version":2,"opacities":{}}','{"version":1,"opacities":{"unknown":70}}','{"version":1,"opacities":{"stats":39}}','{"version":1,"opacities":{"stats":"70"}}')) {
        Assert-True ($null -eq [Iris.WidgetDisplayPreferences]::Parse($bad)) 'Invalid widget appearance accepted'
    }
    $prefs=[Iris.WidgetDisplayPreferences]::Parse('{"version":1,"opacities":{"stats":40,"processing":100},"token":"PRIVATE"}')
    Assert-True ($prefs.GetOpacity('stats',94) -eq 40 -and $prefs.GetOpacity('processing',94) -eq 100 -and $prefs.GetOpacity('center',94) -eq 94) 'Opacity leaked to another widget'
    Assert-True (-not $prefs.SetOpacity('unknown',50) -and -not $prefs.SetOpacity('stats',101)) 'Unsafe override accepted'
    $folder=Join-Path ([IO.Path]::GetTempPath()) ('iris-widget-opacity-'+[guid]::NewGuid().ToString('N'));$path=Join-Path $folder 'display.json'
    try {
        [Iris.WidgetDisplayPreferences]::Save($path,$prefs)
        $saved=Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
        Assert-True ((($saved.PSObject.Properties.Name | Sort-Object) -join ',') -eq 'opacities,version') 'Private persistence field retained'
        Assert-True (([Iris.WidgetDisplayPreferences]::Parse([IO.File]::ReadAllText($path))).GetOpacity('stats',94) -eq 40) 'Persistence roundtrip failed'
        $prefs.Reset();Assert-True ($prefs.GetOpacity('stats',94) -eq 94) 'All reset retained overrides'
    } finally {if(Test-Path -LiteralPath $folder) {Remove-Item -LiteralPath $folder -Recurse -Force}}
}
$results | ConvertTo-Json -Compress
if ($results.Where({ -not $_.passed }).Count) { exit 1 }
