# IRIS Windows overlay alpha. See iris/README.md for process-local launch options.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
. (Join-Path $PSScriptRoot 'execution-lock.ps1')
$irisQueueOwner=Enter-IrisExecutionLock
if(!$irisQueueOwner){[void][System.Windows.Forms.MessageBox]::Show('다른 IRIS가 실행 중이에요. 기존 창에서 종료한 뒤 다시 열어 주세요.','SANCTUM IRIS');exit 1}
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Net.Http
Add-Type -AssemblyName System.Web.Extensions
$irisRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
# Compile shared model and widgets together: PowerShell's in-memory assemblies
# have no stable file path for a second Add-Type assembly reference.
$nativeSources = @('overlay-support.cs','overlay-native.cs','overlay-modules.cs','overlay-checkboard.cs') | ForEach-Object { Get-Content (Join-Path $irisRoot $_) -Raw -Encoding UTF8 }
$nativeImports = @($nativeSources | ForEach-Object { [regex]::Matches($_,'(?m)^using [^\r\n]+;') | ForEach-Object { $_.Value } } | Select-Object -Unique) -join [Environment]::NewLine
$nativeBodies = @($nativeSources | ForEach-Object { [regex]::Replace($_,'(?m)^using [^\r\n]+;','') }) -join [Environment]::NewLine
Add-Type -TypeDefinition ($nativeImports + [Environment]::NewLine + $nativeBodies) -ReferencedAssemblies System.dll,System.Core.dll,System.Net.Http.dll,System.Web.Extensions.dll,System.Windows.Forms.dll,System.Drawing.dll
$serverProcess = $null
$localUrl = 'http://127.0.0.1:4317'
$settingsPath = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'SanctumIRIS/overlay-settings.json'
$appearancePath = Join-Path (Split-Path -Parent $settingsPath) 'display-settings.json'
$widgetAppearancePath = Join-Path (Split-Path -Parent $settingsPath) 'widget-display-settings.json'
$script:widgetAppearance = [Iris.WidgetDisplayPreferences]::new()
try {
    if((Test-Path -LiteralPath $widgetAppearancePath) -and (Get-Item -LiteralPath $widgetAppearancePath).Length -lt 16384) {
        $loadedWidgetAppearance = [Iris.WidgetDisplayPreferences]::Parse([IO.File]::ReadAllText($widgetAppearancePath))
        if($loadedWidgetAppearance) {$script:widgetAppearance=$loadedWidgetAppearance}
    }
} catch {} # Broken cosmetic settings never prevent recovery.
$script:appearance = [Iris.DisplayPreferences]::new()
try {
    if ((Test-Path -LiteralPath $appearancePath) -and (Get-Item -LiteralPath $appearancePath).Length -lt 16384) {
        $loadedAppearance = [Iris.DisplayPreferences]::Parse([IO.File]::ReadAllText($appearancePath))
        if ($loadedAppearance) { $script:appearance = $loadedAppearance }
    }
} catch { } # Display preferences must never prevent recovery.
$expandedHeight = 410
$script:exitConfirmed = $false
$script:exitPromptOpen = $false
$script:preferences = [Iris.OverlayPreferences]::new()
try {
    if ((Test-Path -LiteralPath $settingsPath) -and (Get-Item -LiteralPath $settingsPath).Length -lt 16384) {
        $loadedPreferences = [Iris.OverlayPreferences]::Parse([IO.File]::ReadAllText($settingsPath))
        if ($loadedPreferences) { $script:preferences = $loadedPreferences }
    }
} catch { } # Damaged display settings must not prevent startup.

$gold = [System.Drawing.ColorTranslator]::FromHtml('#E8CA8A')
$main = [System.Drawing.ColorTranslator]::FromHtml('#F4EAD5')
$sub = [System.Drawing.ColorTranslator]::FromHtml('#AAA9A6')
$panel = [System.Drawing.ColorTranslator]::FromHtml('#101114')
$green = [System.Drawing.ColorTranslator]::FromHtml('#69D8A4')
$warning = [System.Drawing.ColorTranslator]::FromHtml('#F5AB8C')
$fonts = [System.Collections.Generic.List[System.Drawing.Font]]::new()
function New-IrisLabel([string]$text, [int]$x, [int]$y, [int]$width, [int]$height, [int]$size, [bool]$bold, [System.Drawing.Color]$color) {
    $label = [System.Windows.Forms.Label]::new()
    $label.Text = $text
    $label.Location = [System.Drawing.Point]::new($x, $y)
    $label.Size = [System.Drawing.Size]::new($width, $height)
    $label.ForeColor = $color
    $style = if ($bold) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
    $label.Font = [System.Drawing.Font]::new('Malgun Gothic', $size, $style)
    $fonts.Add($label.Font)
    $label.BackColor = [System.Drawing.Color]::Transparent
    return $label
}
function New-IrisButton([string]$text, [int]$x, [int]$y, [int]$width) {
    $button = [System.Windows.Forms.Button]::new()
    $button.Text = $text
    $button.Location = [System.Drawing.Point]::new($x, $y)
    $button.Size = [System.Drawing.Size]::new($width, 27)
    $button.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $button.FlatAppearance.BorderSize = 0
    $button.BackColor = $panel
    $button.ForeColor = $gold
    $button.Font = [System.Drawing.Font]::new('Malgun Gothic', 9)
    $fonts.Add($button.Font)
    return $button
}
$form = [Iris.OverlayWindow]::new()
$form.Text = 'SANCTUM IRIS'
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
$form.BackColor = $panel
$form.ForeColor = $main
$form.ClientSize = [System.Drawing.Size]::new(292, $expandedHeight)
$form.TopMost = $true
$form.ShowInTaskbar = $true
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$form.Opacity = 0.94
if (-not $loadedPreferences) {
    $workArea = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
    $script:preferences.X = $workArea.Right - 310
    $script:preferences.Y = $workArea.Top + 90
}
function Move-IrisInsideScreen {
    $areas = @([System.Windows.Forms.Screen]::AllScreens | ForEach-Object {
        @{x=$_.WorkingArea.X; y=$_.WorkingArea.Y; width=$_.WorkingArea.Width; height=$_.WorkingArea.Height}
    })
    # Clamp with expanded size, even while collapsed.
    $point = [Iris.OverlayPreferences]::Place($script:preferences.X, $script:preferences.Y, $form.Width, $expandedHeight, $areas)
    $form.Location = [System.Drawing.Point]::new($point.X, $point.Y)
    $script:preferences.X = $point.X
    $script:preferences.Y = $point.Y
}
Move-IrisInsideScreen
$title = New-IrisLabel '✦ IRIS · 센터' 15 10 205 32 13 $true $gold
$form.Controls.Add($title)
$close = New-IrisButton '×' 256 11 27
$close.ForeColor = $sub
$close.Add_Click({ Hide-IrisCommandCenter })
$form.Controls.Add($close)
$collapse = New-IrisButton '−' 226 11 27
$form.Controls.Add($collapse)
$status = New-IrisLabel '게임 연결 확인 중' 16 47 260 28 9 $false $sub
$form.Controls.Add($status)
$modules = @(
    [Iris.ModuleWindow]::new('스테이터스', @('직업 · 레벨', '전투력', '생활력', '매력', '마도저항', '데코점수'), $form),
    [Iris.ModuleWindow]::new('가공 · 완료/등록', @('금속','목재','가죽','옷감','약품','식재료'), $form, $true),
    [Iris.ModuleWindow]::new('게임 미션', @('일일 · 주간'), $form),
    [Iris.ModuleWindow]::new('생텀 · 크로노스', @('연결 상태','선택한 캐릭터','일일 숙제','주간 숙제','어비스','레이드'), $form, $false, 105),
    [Iris.CheckboardWindow]::new($form)
)
$moduleIds = @('stats','processing','missions','kronos','checkboard')
$modulePreferences = @{}
function Move-IrisModuleInsideScreen($module, $areas = $null) {
    if (-not $areas) {
        $areas = @([System.Windows.Forms.Screen]::AllScreens | ForEach-Object {
            @{x=$_.WorkingArea.X; y=$_.WorkingArea.Y; width=$_.WorkingArea.Width; height=$_.WorkingArea.Height}
        })
    }
    $point = [Iris.OverlayPreferences]::Place($module.Left, $module.Top, $module.Width, $module.ExpandedHeight, $areas)
    $module.Location = [System.Drawing.Point]::new($point.X, $point.Y)
}
function Save-IrisModulePreferences($module) {
    $id = [string]$module.Tag
    if ($id -notin $moduleIds) { return }
    $prefs = $modulePreferences[$id]
    Move-IrisModuleInsideScreen $module
    $prefs.X = $module.Left; $prefs.Y = $module.Top; $prefs.Collapsed = $module.Collapsed
    try { [Iris.OverlayPreferences]::Save((Join-Path (Split-Path -Parent $settingsPath) ($id + '-window.json')), $prefs) }
    catch { $foot.Text = '창 설정 저장 불가 · 이번 창은 계속 사용 가능' }
}
$script:centerGameButtons = @()
$moduleY = $form.Top + $expandedHeight + 12
for ($index = 0; $index -lt $modules.Count; $index++) {
    $module = $modules[$index]
    $id = $moduleIds[$index]
    $module.Tag = $id
    $prefs = [Iris.OverlayPreferences]::new()
    $prefs.X = $form.Left; $prefs.Y = $moduleY
    $path = Join-Path (Split-Path -Parent $settingsPath) ($id + '-window.json')
    try {
        if ((Test-Path -LiteralPath $path) -and (Get-Item -LiteralPath $path).Length -lt 16384) {
            $loaded = [Iris.OverlayPreferences]::Parse([IO.File]::ReadAllText($path))
            if ($loaded) { $prefs = $loaded }
        }
    } catch { }
    $modulePreferences[$id] = $prefs
    $module.Location = [System.Drawing.Point]::new($prefs.X, $prefs.Y)
    $module.SetCollapsed($prefs.Collapsed)
    $module.Add_PreferencesChanged({ param($sender, $event) Save-IrisModulePreferences $sender })
    $moduleY += $module.ExpandedHeight + 12
    if ($index -lt 3) {
        $button = New-IrisButton @('상태','가공','미션')[$index] (11 + $index * 68) 81 65
        $button.Tag = $module
        $button.Add_Click({ param($sender, $event) Move-IrisModuleInsideScreen $sender.Tag; $sender.Tag.ShowByUser() })
        $form.Controls.Add($button)
        $script:centerGameButtons += $button
    }
}
$checkboardButton = New-IrisButton '숙제' 215 81 65
$checkboardButton.Add_Click({ Move-IrisModuleInsideScreen $modules[4]; $modules[4].ShowByUser() })
$form.Controls.Add($checkboardButton)
$kronosButton = New-IrisButton '생텀 연결 · 크로노스' 11 116 269
$kronosButton.Add_Click({ Move-IrisModuleInsideScreen $modules[3]; $modules[3].ShowByUser() })
$form.Controls.Add($kronosButton)
$throughButton = New-IrisButton '클릭 통과: 꺼짐' 11 155 164
$hideButton = New-IrisButton '전체 숨기기' 185 155 95
$form.Controls.Add($throughButton)
$form.Controls.Add($hideButton)
$settingsButton = New-IrisButton '테마 · 투명도' 11 190 164
$exitButton = New-IrisButton 'IRIS 종료' 185 190 95
$form.Controls.Add($settingsButton)
$form.Controls.Add($exitButton)
$hint = New-IrisLabel 'Ctrl+Alt+I 표시 · Ctrl+Alt+O 통과' 16 228 260 20 8 $false $sub
$form.Controls.Add($hint)
$foot = New-IrisLabel '×는 센터 숨기기 · 종료는 확인 후' 16 252 260 20 8 $false $sub
$form.Controls.Add($foot)
function Initialize-IrisCenterLayout {
    # A single center, with existing actions grouped by purpose instead of more center windows.
    $form.ClientSize = [Drawing.Size]::new(360,$expandedHeight)
    $title.SetBounds(18,14,260,32)
    $collapse.SetBounds(292,14,27,27); $close.SetBounds(324,14,27,27)
    $status.SetBounds(20,53,320,32)
    $gameHeading = New-IrisLabel '게임 · 실시간 위젯' 20 94 320 24 10 $true $gold
    $gameHeading.Name = 'center-game-heading'
    $sanctumHeading = New-IrisLabel '크로노스 · 생텀 기록' 20 174 320 24 10 $true $gold
    $sanctumHeading.Name = 'center-sanctum-heading'
    $form.Controls.AddRange(@($gameHeading,$sanctumHeading))
    for($i=0;$i -lt $script:centerGameButtons.Count;$i++) {
        $button = $script:centerGameButtons[$i]
        $button.SetBounds((20+$i*108),122,104,34)
        $button.AccessibleName = @('스테이터스 위젯 표시','가공 현황 위젯 표시','게임 미션 위젯 표시')[$i]
        $button.FlatAppearance.BorderSize = 1
    }
    $kronosButton.Text = '캐릭터 · 연결'; $kronosButton.SetBounds(20,202,156,36)
    $checkboardButton.Text = '숙제 · 체크보드'; $checkboardButton.SetBounds(184,202,156,36)
    $kronosButton.AccessibleName = '생텀 캐릭터 연결 위젯 표시'
    $checkboardButton.AccessibleName = '크로노스 숙제 체크보드 표시'
    $throughButton.SetBounds(20,262,156,32);$hideButton.SetBounds(184,262,156,32)
    $settingsButton.Text = '테마 · 표시 설정';$settingsButton.SetBounds(20,303,156,32)
    $exitButton.SetBounds(184,303,156,32)
    $hint.SetBounds(20,353,320,22);$foot.SetBounds(20,381,320,22)
    foreach($button in @($kronosButton,$checkboardButton,$throughButton,$hideButton,$settingsButton,$exitButton)) {
        $button.FlatAppearance.BorderSize = 1
        $button.AccessibleName = $button.Text
    }
    foreach($label in @($hint,$foot)) {
        $label.Font = [Drawing.Font]::new('Malgun Gothic',9)
        $fonts.Add($label.Font)
    }
}
Initialize-IrisCenterLayout
Move-IrisInsideScreen
$tooltip = [System.Windows.Forms.ToolTip]::new()
$tooltip.SetToolTip($throughButton, '클릭을 뒤의 게임으로 전달합니다. Ctrl+Alt+O 또는 트레이 메뉴로 되돌립니다.')
$tooltip.SetToolTip($hideButton, 'Ctrl+Alt+I 또는 트레이의 IRIS 아이콘으로 다시 표시합니다.')
$tooltip.SetToolTip($close, '커맨드센터만 숨깁니다. 트레이 또는 Ctrl+Alt+I로 복구합니다.')
$tooltip.SetToolTip($kronosButton, '생텀 로그인 후 본인 캐릭터를 연결합니다. 게임 미션과 생텀 숙제는 별개입니다.')
$tooltip.SetToolTip($checkboardButton, '항목별 숙제와 저장된 클래스 레벨. 변경 저장은 별도 웹 수정 동의가 필요합니다.')
$trayMenu = [System.Windows.Forms.ContextMenuStrip]::new()
$restoreMenu = $trayMenu.Items.Add('표시 · 조작 가능하게 복구')
$hideMenu = $trayMenu.Items.Add('숨기기')
$throughMenu = $trayMenu.Items.Add('클릭 통과: 꺼짐')
foreach ($module in $modules) {
    $item = $trayMenu.Items.Add($module.Text + ' 표시')
    $item.Tag = $module
    $item.Add_Click({ param($sender, $event) Restore-Iris; Move-IrisModuleInsideScreen $sender.Tag; $sender.Tag.ShowByUser() })
}
$exitMenu = $trayMenu.Items.Add('IRIS 종료')
$tray = [System.Windows.Forms.NotifyIcon]::new()
$tray.Icon = [System.Drawing.SystemIcons]::Application
$tray.Text = 'SANCTUM IRIS · 더블클릭으로 복구'
$tray.ContextMenuStrip = $trayMenu
. (Join-Path $PSScriptRoot 'ram-companion.ps1')
Add-IrisRamCompanionMenu $trayMenu
$script:modes = [Iris.OverlayModes]::new()
$display = [Iris.SnapshotDisplay]::new()
$poller = [Iris.SnapshotPoller]::new()
$script:nextPoll = [DateTimeOffset]::MinValue
$script:failures = 0
$script:ownedServer = $null
$script:ownedStart = $null
$script:ownedReady = $false
$script:nativeTask = $null
$script:nativeKind = ''
$script:nativeDiscard = $false
$script:nativeNext = [DateTimeOffset]::MinValue
$script:browserConnectionUrl = $null
$script:pendingSelection = $null
$script:confirmingSelection = $false
$script:connectionView = [Iris.ConnectionDisplay]::new()
$script:pendingEditCount = 0
$selectionPath = Join-Path (Split-Path -Parent $settingsPath) 'last-character.json'
$script:lastSelection = $null
try {
    if ((Test-Path -LiteralPath $selectionPath) -and (Get-Item -LiteralPath $selectionPath).Length -lt 4096) {
        $script:lastSelection = [Iris.RememberedSelection]::Parse([IO.File]::ReadAllText($selectionPath))
    }
} catch { }
$characterSelect = [Windows.Forms.ComboBox]::new()
$characterSelect.DropDownStyle = [Windows.Forms.ComboBoxStyle]::DropDownList
$characterSelect.SetBounds(12,242,268,28)
$confirmCharacter = New-IrisButton '현재 게임 캐릭터로 확인' 12 274 268
$connectSanctum = New-IrisButton '새 읽기 연결' 12 307 130
$openSanctum = New-IrisButton '생텀 화면 열기' 146 307 134
$openSanctum.Enabled = $false
$modules[3].Controls.AddRange([Windows.Forms.Control[]]@($characterSelect,$confirmCharacter,$connectSanctum,$openSanctum))
function Update-IrisConnection {
    $modules[3].SetValues($script:connectionView.Values)
    if ($modules.Count -gt 4) {
        $modules[4].ApplyDisplay($script:connectionView)
        # Background reads must not disable/rebuild the checkboard every poll.
        $modules[4].SetRequestBusy([bool]($script:nativeTask -and $script:nativeKind -ne 'state'))
    }
    $selectedId = if ($characterSelect.SelectedItem) { $characterSelect.SelectedItem.Id } else { $null }
    $currentIds = @($characterSelect.Items | ForEach-Object { $_.Id }) -join '|'
    $newIds = @($script:connectionView.Characters | ForEach-Object { $_.Id }) -join '|'
    $newNames = @($script:connectionView.Characters | ForEach-Object { $_.Nickname }) -join '|'
    $currentNames = @($characterSelect.Items | ForEach-Object { $_.Nickname }) -join '|'
    if ($currentIds -ne $newIds -or $currentNames -ne $newNames) {
        $characterSelect.Items.Clear()
        foreach ($character in $script:connectionView.Characters) { $null = $characterSelect.Items.Add($character) }
        if ($script:lastSelection -and -not $selectedId) {
            $selectedId = $script:lastSelection.Suggest($script:connectionView.AccountId,[string[]]@($script:connectionView.Characters | ForEach-Object { $_.Id }))
        }
        foreach ($character in $characterSelect.Items) { if ($character.Id -eq $selectedId) { $characterSelect.SelectedItem = $character; break } }
    }
    $connectSanctum.Enabled = $script:ownedReady -and -not $script:nativeTask
    $confirmCharacter.Enabled = $script:ownedReady -and -not $script:nativeTask -and $characterSelect.SelectedIndex -ge 0
}
function Stage-IrisKronosEdit($intent) {
    if (-not $script:ownedReady -or $script:nativeTask -or -not $modules[4].CanEdit) { return }
    $view = $script:connectionView
    $row = @($view.Tasks[$intent.Category] | Where-Object { $_.Id -eq $intent.TaskId }) | Select-Object -First 1
    if (-not $row -or $intent.DesiredCompleted -lt 0 -or $intent.DesiredCompleted -gt $row.Total) { return }
    $old = @($view.PendingEdits | Where-Object { $_.Category -eq $intent.Category -and $_.TaskId -eq $intent.TaskId }) | Select-Object -First 1
    $edit = @{requestId=if($old){$old.RequestId}else{[Guid]::NewGuid().ToString()};generation=$view.Generation;selectionVersion=$view.SelectionVersion;accountId=$view.AccountId;characterId=$view.SelectedId;category=$intent.Category;taskId=$intent.TaskId;baseCompleted=if($old){$old.BaseCompleted}else{$row.Completed};desiredCompleted=$intent.DesiredCompleted;periodKey=$view.PeriodKeys[$intent.Category]}
    $script:nativeKind='edits'
    $script:nativeTask=$script:ownedServer.RequestAsync('edits','POST',(@{edit=$edit}|ConvertTo-Json -Compress))
    # Keep a conservative exit warning until the next authoritative state reply.
    $script:pendingEditCount=[Math]::Max(1,$view.PendingCount)
    $modules[4].SetRequestBusy($true)
}
function Submit-IrisKronosEdits {
    if (-not $script:ownedReady -or $script:nativeTask -or -not $modules[4].CanEdit -or $script:connectionView.PendingCount -lt 1 -or $script:connectionView.SaveState -eq 'conflict') { return }
    $script:nativeKind='edits/submit'
    $body=@{generation=$script:connectionView.Generation;selectionVersion=$script:connectionView.SelectionVersion}|ConvertTo-Json -Compress
    $script:nativeTask=$script:ownedServer.RequestAsync('edits/submit','POST',$body)
    $modules[4].SetRequestBusy($true)
}
function Confirm-IrisPendingDiscard {
    if ($script:pendingEditCount -lt 1) { return $true }
    $script:confirmingSelection=$true
    try {
        return [Windows.Forms.MessageBox]::Show($modules[4],
            ('미저장 또는 결과 확인 중인 변경 '+$script:pendingEditCount+'개를 버릴까요? 이미 서버에 도착한 저장은 되돌리지 않습니다. 불확실한 저장은 생텀에서 확인해 주세요.'),
            '숙제 변경 폐기 확인',[Windows.Forms.MessageBoxButtons]::YesNo,[Windows.Forms.MessageBoxIcon]::Warning,[Windows.Forms.MessageBoxDefaultButton]::Button2) -eq [Windows.Forms.DialogResult]::Yes
    } finally { $script:confirmingSelection=$false }
}
$modules[4].add_EditRequested({param($sender,$intent) Stage-IrisKronosEdit $intent})
$modules[4].add_SaveRequested({Submit-IrisKronosEdits})
$modules[4].add_DiscardRequested({
    if (-not $script:ownedReady -or $script:nativeTask -or -not (Confirm-IrisPendingDiscard)) { return }
    $script:nativeKind='edits/discard'
    $script:nativeTask=$script:ownedServer.RequestAsync('edits/discard','POST',(@{generation=$script:connectionView.Generation}|ConvertTo-Json -Compress))
    $modules[4].SetRequestBusy($true)
})
$connectSanctum.Add_Click({
    if (-not $script:ownedReady -or $script:nativeTask) { return }
    if (-not (Confirm-IrisPendingDiscard)) { return }
    $script:connectionView.Clear(); Update-IrisConnection
    $script:browserConnectionUrl = $null; $openSanctum.Enabled = $false
    $script:nativeKind = 'connect'
    $script:nativeTask = $script:ownedServer.RequestAsync('connect','POST','{"discardPending":true}')
})
$openSanctum.Add_Click({
    if (-not $script:browserConnectionUrl) { return }
    # Explicit user action: background opening cannot be guaranteed by the default browser.
    try {
        Start-Process -FilePath $script:browserConnectionUrl
        $openSanctum.Enabled = $false
        $foot.Text = '생텀 탭에서 로그인·읽기 전달에 동의해 주세요'
    } catch { $foot.Text = '생텀 화면 열기 실패 · 잠시 후 다시 눌러 주세요' }
})
$confirmCharacter.Add_Click({
    if (-not $script:ownedReady -or $script:nativeTask -or -not $characterSelect.SelectedItem) { return }
    if (-not (Confirm-IrisPendingDiscard)) { return }
    $picked = $characterSelect.SelectedItem
    $accountId = $script:connectionView.AccountId
    $generation = $script:connectionView.Generation
    $script:confirmingSelection = $true
    try {
        $answer = [Windows.Forms.MessageBox]::Show($modules[3],
            ($picked.Nickname + '이 지금 게임에서 플레이 중인 캐릭터가 맞나요? 자동으로 확인한 결과는 아닙니다.'),
            '현재 캐릭터 확인',[Windows.Forms.MessageBoxButtons]::YesNo,[Windows.Forms.MessageBoxIcon]::Question,
            [Windows.Forms.MessageBoxDefaultButton]::Button2)
    } finally { $script:confirmingSelection = $false }
    if ($answer -ne [Windows.Forms.DialogResult]::Yes -or $script:nativeTask) { return }
    $script:pendingSelection = [Iris.RememberedSelection]::new($accountId,$picked.Id)
    $body = @{generation=$generation; characterId=$picked.Id;discardPending=$true} | ConvertTo-Json -Compress
    $script:connectionView.Clear(); Update-IrisConnection
    $script:nativeKind = 'select'
    $script:nativeTask = $script:ownedServer.RequestAsync('select','POST',$body)
})
function Poll-IrisConnection($now) {
    if ($script:ownedStart -and $script:ownedStart.IsCompleted) {
        $script:ownedReady = $script:ownedStart.GetAwaiter().GetResult()
        $script:ownedStart = $null
        if (-not $script:ownedReady) { $foot.Text = '생텀 연결 서버 시작 실패 · 기존 서버는 종료하지 않음' }
    }
    if ($script:nativeTask -and $script:nativeTask.IsCompleted) {
        try {
            $reply = $script:nativeTask.GetAwaiter().GetResult()
            if (-not $script:modes.Hidden -and -not $script:nativeDiscard) {
                if ($script:nativeKind -eq 'state') {
                    if ($script:connectionView.Apply($reply,$now)) { $script:pendingEditCount=$script:connectionView.PendingCount }
                }
                elseif ($script:nativeKind -eq 'connect') {
                    $connection = $reply | ConvertFrom-Json
                    if ($connection.browserToken -notmatch '^[A-Za-z0-9_-]{43,128}$' -or $connection.generation -lt 1) { throw 'Invalid connection' }
                    $script:browserConnectionUrl = 'http://localhost:3000/iris#connect=' + $connection.browserToken + '&g=' + $connection.generation
                    $openSanctum.Enabled = $true
                    $foot.Text = '생텀 화면 열기를 눌러 승인 · 창이 앞에 열릴 수 있어요'
                } elseif ($script:nativeKind -eq 'select' -and $script:pendingSelection) {
                    $script:lastSelection = $script:pendingSelection
                    try { [Iris.RememberedSelection]::Save($selectionPath,$script:lastSelection) }
                    catch { $foot.Text = '선택 기억 저장 불가 · 이번 연결은 사용 가능' }
                }
            }
        } catch { $script:connectionView.Clear(); $foot.Text = '생텀 연결 요청 실패 · 저장 중이었다면 생텀 기록을 먼저 확인해 주세요' }
        finally {
            $wasState=$script:nativeKind -eq 'state'
            $script:nativeTask=$null; $script:pendingSelection=$null; $script:nativeDiscard=$false
            $script:nativeNext=if($wasState){$now.AddSeconds(3)}else{$now}
        }
    }
    if ($script:modes.Hidden) { $script:connectionView.Clear() }
    else {
        $script:connectionView.Expire($now)
        if ($script:ownedReady -and -not $script:nativeTask -and -not $script:confirmingSelection -and $now -ge $script:nativeNext) {
            $script:nativeKind='state'; $script:nativeTask=$script:ownedServer.RequestAsync('state','GET',$null)
        }
    }
    Update-IrisConnection
}
function Save-IrisPreferences {
    $script:preferences.X = $form.Left
    $script:preferences.Y = $form.Top
    try { [Iris.OverlayPreferences]::Save($settingsPath, $script:preferences) }
    catch { $foot.Text = '창 설정 저장 불가 · 이번 창은 계속 사용 가능' }
}
function Update-IrisModes {
    $text = if ($script:modes.ClickThrough) { '클릭 통과: 켜짐' } else { '클릭 통과: 꺼짐' }
    $throughButton.Text = $text
    $throughMenu.Text = $text
    $throughButton.Enabled = $form.ShortcutsAvailable
    $throughMenu.Enabled = $form.ShortcutsAvailable -and -not $script:modes.Hidden
    $hint.Text = if ($form.ShortcutsAvailable) { 'Ctrl+Alt+I 표시 · Ctrl+Alt+O 통과' } else { '단축키 사용 불가 · 트레이로 복구 가능' }
}
function Update-IrisSnapshot {
    $modules[0].SetValues([string[]]$display.Values[0..5])
    $modules[1].SetProcessing($display.ProcessingValues, $display.ProcessingCompleted, $display.ProcessingTotal)
    $modules[2].SetValues([string[]]@($display.Values[7]))
    if ($display.Connected) {
        $status.Text = '● 게임 연결됨 · ' + $display.ObservedAt.ToLocalTime().ToString('HH:mm:ss')
        $status.ForeColor = $green
    } elseif ($poller.IsPending -and -not $script:modes.Hidden) {
        $status.Text = '● 게임 조회 중 · 이전 값은 표시하지 않음'
        $status.ForeColor = $sub
    } else {
        $status.Text = '● 게임 또는 로컬 서버 연결 대기'
        $status.ForeColor = $warning
    }
}
function Restore-Iris {
    if (-not $form.ApplyClickThrough($false)) { return }
    if ($script:modes.Hidden) { $script:modes.ToggleHidden() }
    $null = $script:modes.SetClickThrough($false, $form.ShortcutsAvailable)
    Move-IrisInsideScreen
    $form.WindowState = [System.Windows.Forms.FormWindowState]::Normal
    $display.Clear()
    $script:nextPoll = [DateTimeOffset]::MinValue
    Update-IrisModes
    Update-IrisSnapshot
    $form.Show()
    foreach ($module in $modules) { Move-IrisModuleInsideScreen $module; $module.RestoreIfEnabled() }
}
function Hide-IrisCommandCenter {
    $script:dragging = $false
    $form.Capture = $false
    $title.Capture = $false
    $form.Hide()
}
function Get-IrisExitMessage {
    $message='IRIS와 모든 위젯을 종료할까요? 게임은 종료하지 않습니다.'
    if ($script:pendingEditCount -gt 0) { $message += "`n미저장 또는 결과 확인 중인 변경 $script:pendingEditCount 개가 사라집니다. 이미 서버에 도착한 저장은 되돌리지 않습니다. 불확실한 결과는 생텀에서 확인해 주세요. 강제종료 후 복구는 보장하지 않습니다." }
    return $message
}
function Confirm-IrisExit {
    # Default to No so a repeated Enter or an accidental click cannot terminate IRIS.
    return [System.Windows.Forms.MessageBox]::Show($form,
        (Get-IrisExitMessage),
        'IRIS 종료 확인', [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question,
        [System.Windows.Forms.MessageBoxDefaultButton]::Button2) -eq [System.Windows.Forms.DialogResult]::Yes
}
function Request-IrisExit {
    if ($script:exitPromptOpen -or $script:exitConfirmed) { return }
    $script:exitPromptOpen = $true
    try {
        if (Confirm-IrisExit) { $script:exitConfirmed = $true; $form.Close() }
    } finally { $script:exitPromptOpen = $false }
}
function Handle-IrisClosing($sender, $event) {
    if ($event.CloseReason -eq [System.Windows.Forms.CloseReason]::UserClosing -and -not $script:exitConfirmed) {
        $event.Cancel = $true
        Hide-IrisCommandCenter
    }
}
function Apply-IrisAppearance {
    # Exact panel/text/sub/accent tokens from app/globals.css, six SANCTUM themes.
    $palettes = @{
        aureum = @('#101011','#EDEDED','#9CA3AF','#E6C788')
        lumen = @('#FFFFFF','#0F172A','#64748B','#2563EB')
        nemeton = @('#112A23','#EDF9F4','#A3C5B9','#48C9A0')
        vesper = @('#19142C','#F5F0FF','#B9AECF','#B18AF3')
        rosarium = @('#2B1922','#FFF4F7','#C7A9B5','#E88DA8')
        elysium = @('#EAF8E0','#1A2030','#5B665F','#6262B8')
    }
    $colors = $palettes[$script:appearance.Theme]
    $script:panel = [Drawing.ColorTranslator]::FromHtml($colors[0])
    $script:main = [Drawing.ColorTranslator]::FromHtml($colors[1])
    $script:sub = [Drawing.ColorTranslator]::FromHtml($colors[2])
    $script:gold = [Drawing.ColorTranslator]::FromHtml($colors[3])
    foreach ($window in @($form) + $modules) {
        $window.BackColor = $script:panel
        $window.ForeColor = $script:main
        $opacityId = if($window -eq $form) {'center'} else {[string]$window.Tag}
        $opacityPercent = $script:appearance.OpacityPercent
        if($script:widgetAppearance) {$opacityPercent=$script:widgetAppearance.GetOpacity($opacityId,$opacityPercent)}
        $window.Opacity = $opacityPercent / 100.0
        if ($window.PSObject.Methods['SetPalette']) { $window.SetPalette($script:panel,$script:main,$script:gold) }
        foreach ($control in $window.Controls) {
            if ($control -is [Windows.Forms.Button]) { $control.BackColor = $script:panel; $control.ForeColor = $script:gold; $control.FlatAppearance.BorderColor=$script:gold }
            elseif ($control -is [Windows.Forms.Label]) { $control.ForeColor = if($control.Name -like 'center-*-heading') {$script:gold} else {$script:main} }
        }
    }
    $title.ForeColor = $script:gold
    $hint.ForeColor = $script:sub
    $foot.ForeColor = $script:sub
    $close.ForeColor = $script:sub
    # Status uses the normal refresh path; keep contrast on bright backgrounds too.
    $script:green = if ($script:appearance.Theme -in @('lumen','elysium')) { [Drawing.ColorTranslator]::FromHtml('#047857') } else { [Drawing.ColorTranslator]::FromHtml('#69D8A4') }
    $script:warning = if ($script:appearance.Theme -in @('lumen','elysium')) { [Drawing.ColorTranslator]::FromHtml('#92400E') } else { [Drawing.ColorTranslator]::FromHtml('#F5AB8C') }
}
function Show-IrisDisplaySettings {
    Restore-Iris
    $dialog = [Windows.Forms.Form]::new()
    $dialog.Text = 'IRIS · 표시 설정'
    $dialog.ClientSize = [Drawing.Size]::new(360,315)
    $dialog.FormBorderStyle = [Windows.Forms.FormBorderStyle]::FixedDialog
    $dialog.MaximizeBox = $false; $dialog.MinimizeBox = $false
    $dialog.ShowInTaskbar = $false; $dialog.TopMost = $true
    $dialog.StartPosition = [Windows.Forms.FormStartPosition]::CenterParent
    $dialog.BackColor = $panel; $dialog.ForeColor = $main
    $themeLabel = [Windows.Forms.Label]::new(); $themeLabel.Text = '생텀 테마'; $themeLabel.SetBounds(16,18,300,24)
    $themeSelect = [Windows.Forms.ComboBox]::new(); $themeSelect.DropDownStyle = [Windows.Forms.ComboBoxStyle]::DropDownList
    $themeSelect.SetBounds(16,46,300,28)
    $themes = @('aureum','lumen','nemeton','vesper','rosarium','elysium')
    $themeSelect.Items.AddRange($themes)
    $themeSelect.SelectedItem = $script:appearance.Theme
    $targetLabel = [Windows.Forms.Label]::new();$targetLabel.Text='불투명도 적용할 창';$targetLabel.SetBounds(16,84,328,24)
    $targetSelect = [Windows.Forms.ComboBox]::new();$targetSelect.DropDownStyle=[Windows.Forms.ComboBoxStyle]::DropDownList;$targetSelect.SetBounds(16,112,328,28)
    $targetIds = @('all','center') + $moduleIds
    $targetSelect.Items.AddRange(@('전체 · 개별 설정 초기화','IRIS 센터','스테이터스','가공 현황','게임 미션','캐릭터 연결','크로노스 체크보드'))
    $targetSelect.SelectedIndex=0
    $opacityLabel = [Windows.Forms.Label]::new(); $opacityLabel.Text = '불투명도 · ' + $script:appearance.OpacityPercent + '%'; $opacityLabel.SetBounds(16,153,328,24)
    $slider = [Windows.Forms.TrackBar]::new(); $slider.Minimum = 40; $slider.Maximum = 100; $slider.TickFrequency = 10
    $slider.Value = $script:appearance.OpacityPercent; $slider.SetBounds(12,181,336,42)
    $targetSelect.Add_SelectedIndexChanged({
        $id=$targetIds[$targetSelect.SelectedIndex]
        $slider.Value=if($id -eq 'all') {$script:appearance.OpacityPercent} else {$script:widgetAppearance.GetOpacity($id,$script:appearance.OpacityPercent)}
    })
    $slider.Add_ValueChanged({ $opacityLabel.Text = '불투명도 · ' + $slider.Value + '%' })
    $description = [Windows.Forms.Label]::new(); $description.Text = '글자와 배경이 함께 투명해져요. 전체 적용은 개별 설정을 초기화합니다.'; $description.SetBounds(16,225,328,43)
    $save = [Windows.Forms.Button]::new(); $save.Text = '적용'; $save.SetBounds(156,275,86,28); $save.DialogResult = [Windows.Forms.DialogResult]::OK
    $cancel = [Windows.Forms.Button]::new(); $cancel.Text = '취소'; $cancel.SetBounds(254,275,86,28); $cancel.DialogResult = [Windows.Forms.DialogResult]::Cancel
    $dialog.AcceptButton = $save; $dialog.CancelButton = $cancel
    $dialog.Controls.AddRange(@($themeLabel,$themeSelect,$targetLabel,$targetSelect,$opacityLabel,$slider,$description,$save,$cancel))
    foreach($control in $dialog.Controls) {$control.BackColor=$panel;$control.ForeColor=$main}
    try {
        if ($dialog.ShowDialog($form) -eq [Windows.Forms.DialogResult]::OK) {
            $script:appearance.Theme = [string]$themeSelect.SelectedItem
            $opacityId=$targetIds[$targetSelect.SelectedIndex]
            if($opacityId -eq 'all') {$script:appearance.OpacityPercent=$slider.Value;$script:widgetAppearance.Reset()}
            else {$null=$script:widgetAppearance.SetOpacity($opacityId,$slider.Value)}
            Apply-IrisAppearance
            try {
                [Iris.DisplayPreferences]::Save($appearancePath,$script:appearance)
                [Iris.WidgetDisplayPreferences]::Save($widgetAppearancePath,$script:widgetAppearance)
            }
            catch { $foot.Text = '표시 설정 저장 실패 · 이번 실행에만 적용됨' }
        }
    } finally { $dialog.Dispose() }
}
function Hide-Iris {
    if ($script:modes.Hidden) { return }
    $script:dragging = $false
    $form.Capture = $false
    $title.Capture = $false
    $script:modes.ToggleHidden()
    $poller.Cancel()
    $display.Clear()
    $script:nativeDiscard = [bool]$script:nativeTask
    if ($script:ownedServer) { $script:ownedServer.CancelRequests(); $script:connectionView.Clear() }
    foreach ($module in $modules) { $module.ApplyClickThrough($false) | Out-Null; $module.SetValues($null); $module.Hide() }
    $form.Hide()
    Update-IrisModes
}
function Toggle-IrisClickThrough {
    if ($script:modes.Hidden -or -not $form.ShortcutsAvailable) { return }
    $enabled = -not $script:modes.ClickThrough
    $applied = $form.ApplyClickThrough($enabled)
    foreach ($module in $modules) {
        if ($module.Visible -and -not $module.ApplyClickThrough($enabled)) { $applied = $false }
    }
    if ($applied) { $null = $script:modes.SetClickThrough($enabled, $form.ShortcutsAvailable) }
    else {
        $form.ApplyClickThrough($false) | Out-Null
        foreach ($module in $modules) { $module.ApplyClickThrough($false) | Out-Null }
        $null = $script:modes.SetClickThrough($false, $false)
        Update-IrisModes
        $hint.Text = '클릭 모드 변경 실패 · 조작 가능 상태로 복구'
        return
    }
    Update-IrisModes
}
$form.Add_VisibilityShortcut({ if ($script:modes.Hidden -or -not $form.Visible) { Restore-Iris } else { Hide-Iris } })
$form.Add_InputShortcut({ Toggle-IrisClickThrough })
$form.Add_ShortcutsChanged({
    foreach ($module in $modules) { $module.ApplyClickThrough($false) | Out-Null }
    $null = $script:modes.SetClickThrough($false, $false)
    Update-IrisModes
})
$throughButton.Add_Click({ Toggle-IrisClickThrough })
$hideButton.Add_Click({ Hide-Iris })
$restoreMenu.Add_Click({ Restore-Iris })
$hideMenu.Add_Click({ Hide-Iris })
$throughMenu.Add_Click({ Toggle-IrisClickThrough })
$exitMenu.Add_Click({ Restore-Iris; Request-IrisExit })
$exitButton.Add_Click({ Request-IrisExit })
$settingsButton.Add_Click({ Show-IrisDisplaySettings })
$tray.Add_DoubleClick({ Restore-Iris })
$collapse.Add_Click({
    $script:preferences.Collapsed = -not $script:preferences.Collapsed
    $form.Height = if ($script:preferences.Collapsed) { 49 } else { $expandedHeight }
    $collapse.Text = if ($script:preferences.Collapsed) { '+' } else { '−' }
    Move-IrisInsideScreen
    Save-IrisPreferences
})
if ($script:preferences.Collapsed) { $form.Height = 49; $collapse.Text = '+' }
$script:dragging = $false
$script:dragOffset = [System.Drawing.Point]::Empty
$dragDown = {
    param($sender, $event)
    if ($event.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $script:dragging = $true
        $sender.Capture = $true
        $script:dragOffset = [System.Drawing.Point]::new([System.Windows.Forms.Cursor]::Position.X - $form.Left, [System.Windows.Forms.Cursor]::Position.Y - $form.Top)
    }
}
$dragMove = {
    if ($script:dragging) {
        $cursor = [System.Windows.Forms.Cursor]::Position
        $form.Location = [System.Drawing.Point]::new($cursor.X - $script:dragOffset.X, $cursor.Y - $script:dragOffset.Y)
    }
}
$dragUp = {
    param($sender, $event)
    if ($script:dragging) {
        $script:dragging = $false
        $sender.Capture = $false
        $script:preferences.X = $form.Left
        $script:preferences.Y = $form.Top
        Move-IrisInsideScreen
        Save-IrisPreferences
    }
}
foreach ($control in @($form, $title)) {
    $control.Add_MouseDown($dragDown)
    $control.Add_MouseMove($dragMove)
    $control.Add_MouseUp($dragUp)
}
$timer = [System.Windows.Forms.Timer]::new()
$timer.Interval = 200
$timer.Add_Tick({
    $now = [DateTimeOffset]::UtcNow
    Poll-IrisConnection $now
    if ($poller.IsCompleted) {
        $reply = $poller.TakeCompleted()
        if (-not $script:modes.Hidden) {
            $valid = $reply.Success -and $display.Apply($reply.Body, $now)
            if ($reply.Cancelled) { $display.Clear(); $script:nextPoll = [DateTimeOffset]::MinValue }
            elseif ($valid) { $script:failures = 0; $script:nextPoll = $now.AddSeconds(5) }
            else {
                $display.Clear()
                $script:failures = [Math]::Min(4, $script:failures + 1)
                $delay = [Math]::Min(30, 5 * [Math]::Pow(2, $script:failures - 1))
                $script:nextPoll = $now.AddSeconds($delay)
            }
        }
    }
    if (-not $script:modes.Hidden) {
        $display.Expire($now)
        if (-not $poller.IsPending -and $now -ge $script:nextPoll) { $null = $poller.Start() }
        Update-IrisSnapshot
    }
})
$form.Add_Shown({
    $tray.Visible = $true
    Apply-IrisAppearance
    foreach ($module in $modules) { Save-IrisModulePreferences $module; $module.RestoreIfEnabled() }
    Update-IrisModes; $null = $poller.Start(); $timer.Start()
})
$form.Add_FormClosing({
    param($sender, $event)
    Handle-IrisClosing $sender $event
    Save-IrisPreferences
    foreach ($module in $modules) { Save-IrisModulePreferences $module }
})
try {
    try { Invoke-WebRequest -Uri $localUrl -TimeoutSec 2 -UseBasicParsing | Out-Null }
    catch {
        $script:ownedServer = [Iris.OwnedServer]::new()
        $script:ownedStart = $script:ownedServer.StartAsync((Join-Path $irisRoot 'owned-server.mjs'),4317)
    }
    if (-not $script:ownedServer) { $foot.Text = '기존 로컬 서버는 게임 읽기만 · 생텀 연결은 재시작 필요' }
    [System.Windows.Forms.Application]::Run($form)
} finally {
    $timer.Stop()
    $timer.Dispose()
    $poller.Dispose()
    if ($script:ownedServer) { $script:ownedServer.Dispose() }
    $tray.Visible = $false
    $tray.Dispose()
    $trayMenu.Dispose()
    $tooltip.Dispose()
    foreach ($module in $modules) { $module.Dispose() }
    $form.Dispose()
    foreach ($font in $fonts) { $font.Dispose() }
    if ($serverProcess -and -not $serverProcess.HasExited) { Stop-Process -Id $serverProcess.Id }
    $irisQueueOwner.ReleaseMutex();$irisQueueOwner.Dispose()
}
