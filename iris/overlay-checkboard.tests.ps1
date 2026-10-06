$ErrorActionPreference='Stop'
$results=@()
Add-Type -AssemblyName System.Windows.Forms,System.Drawing,System.Net.Http,System.Web.Extensions
function Test-Case([string]$name,[scriptblock]$body) {
    try { & $body; $script:results+=@{name=$name;passed=$true} }
    catch { $script:results+=@{name=$name;passed=$false;error=$_.Exception.Message} }
}
function Assert-True($condition,[string]$message) { if(-not $condition) {throw $message} }
Test-Case 'checkboard preserves summary when filtering and clears private rows' {
    $source=@('overlay-support.cs','overlay-native.cs','overlay-modules.cs','overlay-checkboard.cs') | ForEach-Object {Get-Content (Join-Path $PSScriptRoot $_) -Raw -Encoding UTF8}
    $imports=@($source | ForEach-Object {[regex]::Matches($_,'(?m)^using [^\r\n]+;') | ForEach-Object {$_.Value}} | Select-Object -Unique) -join [Environment]::NewLine
    $bodies=@($source | ForEach-Object {[regex]::Replace($_,'(?m)^using [^\r\n]+;','')}) -join [Environment]::NewLine
    Add-Type -TypeDefinition ($imports+[Environment]::NewLine+$bodies) -ReferencedAssemblies System.dll,System.Core.dll,System.Windows.Forms.dll,System.Drawing.dll,System.Net.Http.dll,System.Web.Extensions.dll
    $owner=[Iris.OverlayWindow]::new($false)
    $window=[Iris.CheckboardWindow]::new($owner)
    try {
        $tasks=[Collections.Generic.Dictionary[string,Collections.Generic.List[Iris.KronosTaskDisplay]]]::new()
        foreach($category in @('daily','weekly','abyss','raid')) {$tasks[$category]=[Collections.Generic.List[Iris.KronosTaskDisplay]]::new()}
        $tasks['daily'].Add([Iris.KronosTaskDisplay]@{Id='1';Name='Done';Completed=1;Total=1})
        $tasks['daily'].Add([Iris.KronosTaskDisplay]@{Id='2';Name='Remaining';Completed=1;Total=3})
        $classes=[Collections.Generic.List[Iris.KronosClassDisplay]]::new()
        $classes.Add([Iris.KronosClassDisplay]@{Id='1';Name='Warrior';Level=65})
        $classes.Add([Iris.KronosClassDisplay]@{Id='2';Name='Mage';Level=$null})
        $window.Apply('Test','connected',$tasks,$classes,$true)
        $window.SetSectionExpanded('daily',$true)
        $window.SetSectionExpanded('classes',$true)
        Assert-True ($window.RenderedText.Contains('Done') -and $window.RenderedText.Contains('1/3')) 'Task rows missing'
        Assert-True ($window.RenderedText.Contains('65') -and $window.RenderedText.Contains('Mage')) 'Classes missing'
        $window.SetRemainingOnly($true)
        Assert-True (-not $window.RenderedText.Contains('Done') -and $window.RenderedText.Contains('2/4')) 'Filter changed summary or retained completed row'
        $window.Clear('waiting')
        Assert-True (-not $window.RenderedText.Contains('Warrior') -and -not $window.RenderedText.Contains('Remaining')) 'Old details remained'
        $window.SetCollapsed($true);Assert-True ($window.Height -eq 44) 'Collapse failed'
        $window.SetCollapsed($false)
        $window.HideByUser();Assert-True (-not $window.EnabledByUser) 'User hide failed'
        $window.ShowByUser();Assert-True ($window.EnabledByUser -and -not $window.IsDisposed) 'Restore failed'
        $window.Close();Assert-True (-not $window.IsDisposed) 'Close disposed shared widget'
    } finally {$window.Dispose();$owner.Dispose()}
}
Test-Case 'single center groups existing widget controls without overlap and preserves actions' {
    $tokens=$null;$errors=$null
    $tree=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'),[ref]$tokens,[ref]$errors)
    $fn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Initialize-IrisCenterLayout'},$true)
    Assert-True ($null -ne $fn) 'Grouped center layout is not implemented'
    $form=[Iris.OverlayWindow]::new($false)
    $form.FormBorderStyle=[Windows.Forms.FormBorderStyle]::None
    $form.BackColor=[Drawing.ColorTranslator]::FromHtml('#101011')
    $fonts=[Collections.Generic.List[Drawing.Font]]::new()
    $expandedHeight=410
    $gold=[Drawing.Color]::Gold;$sub=[Drawing.Color]::Gray;$main=[Drawing.Color]::White;$panel=[Drawing.Color]::Black
    foreach($name in @('title','status','hint','foot')) {Set-Variable -Name $name -Value ([Windows.Forms.Label]::new());$form.Controls.Add((Get-Variable $name -ValueOnly))}
    foreach($name in @('close','collapse','checkboardButton','kronosButton','throughButton','hideButton','settingsButton','exitButton')) {Set-Variable -Name $name -Value ([Windows.Forms.Button]::new());$form.Controls.Add((Get-Variable $name -ValueOnly))}
    $script:centerGameButtons=@([Windows.Forms.Button]::new(),[Windows.Forms.Button]::new(),[Windows.Forms.Button]::new())
    foreach($button in $script:centerGameButtons) {$form.Controls.Add($button)}
    $title.Text='IRIS Center';$status.Text='Connected - synthetic test'
    $hint.Text='Ctrl+Alt+I show / Ctrl+Alt+O input';$foot.Text='Close hides / Exit asks confirmation'
    $close.Text='x';$collapse.Text='-';$throughButton.Text='Input: enabled';$hideButton.Text='Hide all';$exitButton.Text='Exit IRIS'
    for($i=0;$i -lt 3;$i++) {$script:centerGameButtons[$i].Text=@('Status','Processing','Missions')[$i]}
    $script:centerClicked=0;$checkboardButton.Add_Click({$script:centerClicked++})
    $labelFn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'New-IrisLabel'},$true)
    . ([scriptblock]::Create($labelFn.Extent.Text))
    try {
        & $fn.Body.GetScriptBlock()
        foreach($control in $form.Controls) {$control.BackColor=$form.BackColor;$control.ForeColor=[Drawing.ColorTranslator]::FromHtml('#E6C788')}
        $form.Show();[Windows.Forms.Application]::DoEvents();$checkboardButton.PerformClick()
        Assert-True ($script:centerClicked -eq 1) 'Existing widget action was replaced'
        $buttons=@($form.Controls | Where-Object {$_ -is [Windows.Forms.Button]})
        foreach($button in $buttons) {
            Assert-True ($button.Right -le $form.ClientSize.Width -and $button.Bottom -le $form.ClientSize.Height) 'Control clipped'
            foreach($other in $buttons) {if($button -ne $other) {Assert-True (-not $button.Bounds.IntersectsWith($other.Bounds)) 'Buttons overlap'}}
        }
        Assert-True ($checkboardButton.Top -gt $script:centerGameButtons[0].Bottom) 'Game and Sanctum entrypoints not separated'
        Assert-True ($form.Controls.Find('center-game-heading',$false).Length -eq 1 -and $form.Controls.Find('center-sanctum-heading',$false).Length -eq 1) 'Category labels missing'
        if($env:IRIS_CENTER_TEST_IMAGE) {
            $bitmap=[Drawing.Bitmap]::new($form.Width,$form.Height)
            try {$form.DrawToBitmap($bitmap,[Drawing.Rectangle]::new(0,0,$bitmap.Width,$bitmap.Height));$bitmap.Save($env:IRIS_CENTER_TEST_IMAGE)} finally {$bitmap.Dispose()}
        }
    } finally {$form.Dispose();foreach($font in $fonts){$font.Dispose()}}
}
Test-Case 'empty and completed catalogs differ and long large lists scroll without truncation' {
    $owner=[Iris.OverlayWindow]::new($false);$widget=[Iris.CheckboardWindow]::new($owner)
    try {
        $tasks=[Collections.Generic.Dictionary[string,Collections.Generic.List[Iris.KronosTaskDisplay]]]::new()
        foreach($category in @('daily','weekly','abyss','raid')) {$tasks[$category]=[Collections.Generic.List[Iris.KronosTaskDisplay]]::new()}
        $classes=[Collections.Generic.List[Iris.KronosClassDisplay]]::new()
        $tasks['daily'].Add([Iris.KronosTaskDisplay]@{Id='done';Name='Finished';Completed=1;Total=1})
        $widget.Apply(('N'*12),'connected',$tasks,$classes,$true)
        $widget.SetSectionExpanded('daily',$true);$widget.SetSectionExpanded('weekly',$true);$widget.SetRemainingOnly($true)
        $noRemaining=([string][char]0xB0A8)+[char]0xC740+' '+[char]0xC219+[char]0xC81C+[char]0xAC00
        $empty=([string][char]0xB4F1)+[char]0xB85D+[char]0xB41C
        Assert-True ($widget.RenderedText.Contains($noRemaining) -and $widget.RenderedText.Contains($empty)) 'Empty and finished catalogs indistinguishable'
        $tasks['daily'].Clear()
        $longName=([string][char]0xAC00)*120
        for($i=0;$i -lt 200;$i++) {$tasks['daily'].Add([Iris.KronosTaskDisplay]@{Id=[string]$i;Name=$longName;Completed=0;Total=1})}
        $widget.SetRemainingOnly($false);$widget.Apply(('N'*12),'connected',$tasks,$classes,$true)
        $widget.Show();[Windows.Forms.Application]::DoEvents()
        $viewport=@($widget.Controls | Where-Object {$_ -is [Windows.Forms.Panel]})[0]
        $flow=$viewport.Controls[0]
        $nameLabel=$flow.Controls[1]
        Assert-True ($widget.RenderedText.Contains($longName) -and -not $nameLabel.AutoEllipsis -and $nameLabel.Height -gt 30) 'Long name clipped or ellipsized'
        Assert-True ($viewport.VerticalScroll.Visible -and -not $viewport.HorizontalScroll.Visible) 'Long list lacks vertical scroll or overflows horizontally'
        Assert-True ($widget.Height -le [Windows.Forms.Screen]::FromControl($owner).WorkingArea.Height) 'Widget exceeds work area'
        $before=$flow.Controls[0]
        $widget.Apply(('N'*12),'connected',$tasks,$classes,$true)
        Assert-True ([object]::ReferenceEquals($before,$flow.Controls[0])) 'Identical polling reply recreated controls'
        $widget.Clear('disconnected')
        Assert-True (-not $widget.RenderedText.Contains($longName)) 'Large old catalog survived clear'
    } finally {$widget.Dispose();$owner.Dispose()}
}
Test-Case 'nested checkboard controls follow all six palettes and opacity' {
    $tokens=$null;$errors=$null
    $tree=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'),[ref]$tokens,[ref]$errors)
    Assert-True ($errors.Count -eq 0) 'Overlay script parse failed'
    $fn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Apply-IrisAppearance'},$true)
    . ([scriptblock]::Create($fn.Extent.Text))
    $form=[Iris.OverlayWindow]::new($false);$widget=[Iris.CheckboardWindow]::new($form);$modules=@($widget)
    $title=[Windows.Forms.Label]::new();$hint=[Windows.Forms.Label]::new();$foot=[Windows.Forms.Label]::new();$close=[Windows.Forms.Button]::new()
    $script:appearance=[Iris.DisplayPreferences]::new()
    try {
        foreach($theme in @('aureum','lumen','nemeton','vesper','rosarium','elysium')) {
            $script:appearance.Theme=$theme;$script:appearance.OpacityPercent=40
            Apply-IrisAppearance
            $viewport=@($widget.Controls | Where-Object {$_ -is [Windows.Forms.Panel]})[0]
            $label=$viewport.Controls[0].Controls[0]
            Assert-True ($label.BackColor.ToArgb() -eq $widget.BackColor.ToArgb() -and $label.ForeColor.ToArgb() -eq $widget.ForeColor.ToArgb()) 'Nested row palette stale'
            Assert-True ($widget.Opacity -eq .4) 'Widget opacity stale'
        }
    } finally {$widget.Dispose();$form.Dispose();Remove-Item Function:Apply-IrisAppearance}
}
Test-Case 'controller applies widget opacity independently and global reset restores fallback' {
    $tokens=$null;$errors=$null
    $tree=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'),[ref]$tokens,[ref]$errors)
    $fn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Apply-IrisAppearance'},$true)
    . ([scriptblock]::Create($fn.Extent.Text))
    $form=[Iris.OverlayWindow]::new($false);$widget=[Iris.CheckboardWindow]::new($form);$widget.Tag='checkboard';$modules=@($widget)
    $title=[Windows.Forms.Label]::new();$hint=[Windows.Forms.Label]::new();$foot=[Windows.Forms.Label]::new();$close=[Windows.Forms.Button]::new()
    $script:appearance=[Iris.DisplayPreferences]::new();$script:appearance.OpacityPercent=94
    $script:widgetAppearance=[Iris.WidgetDisplayPreferences]::new()
    $null=$script:widgetAppearance.SetOpacity('center',100);$null=$script:widgetAppearance.SetOpacity('checkboard',65)
    try {
        Apply-IrisAppearance
        Assert-True ($form.Opacity -eq 1 -and $widget.Opacity -eq .65) 'Individual opacity was ignored'
        $script:widgetAppearance.Reset();Apply-IrisAppearance
        Assert-True ($form.Opacity -eq .94 -and $widget.Opacity -eq .94) 'Global reset did not restore fallback'
    } finally {$widget.Dispose();$form.Dispose();$script:widgetAppearance=$null;Remove-Item Function:Apply-IrisAppearance}
}
Test-Case 'actual connection update distributes validated details and clears the independent widget' {
    $tokens=$null;$errors=$null
    $tree=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'),[ref]$tokens,[ref]$errors)
    $fn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Update-IrisConnection'},$true)
    . ([scriptblock]::Create($fn.Extent.Text))
    $owner=[Iris.OverlayWindow]::new($false);$widget=[Iris.CheckboardWindow]::new($owner)
    $connection=[Iris.ModuleWindow]::new('Connection',@('Status','Character','Daily','Weekly','Abyss','Raid'),$owner)
    $modules=@($null,$null,$null,$connection,$widget)
    $characterSelect=[Windows.Forms.ComboBox]::new();$connectSanctum=[Windows.Forms.Button]::new();$confirmCharacter=[Windows.Forms.Button]::new()
    $script:lastSelection=$null;$script:ownedReady=$false;$script:nativeTask=$null
    $script:connectionView=[Iris.ConnectionDisplay]::new()
    try {
        $root=@{generation=1;selectionVersion=1;status='connected';accountId='account';selectedId='1';characters=@(@{id='1';nickname='Test'});summary=@{};details=@{schemaVersion=1;tasks=@{};classes=@(@{id='1';name='Warrior';level=65})}}
        foreach($category in @('daily','weekly','abyss','raid')) {
            $root.summary[$category]=@{completed=0;total=1}
            $root.details.tasks[$category]=@(@{id='1';name='LiveRow';completed=0;total=1})
        }
        Assert-True ($script:connectionView.Apply(($root | ConvertTo-Json -Depth 10 -Compress),[DateTimeOffset]::UtcNow)) 'Synthetic native state rejected'
        Update-IrisConnection
        $widget.SetSectionExpanded('daily',$true);$widget.SetSectionExpanded('classes',$true)
        Assert-True ($widget.RenderedText.Contains('Test') -and $widget.RenderedText.Contains('LiveRow') -and $widget.RenderedText.Contains('65')) 'Shared update did not forward details'
        $viewport=@($widget.Controls | Where-Object {$_ -is [Windows.Forms.Panel]})[0]
        $before=$viewport.Controls[0].Controls[0]
        $script:nativeKind='state';$script:nativeTask=[Threading.Tasks.Task]::FromResult('synthetic state')
        Update-IrisConnection
        $script:nativeTask=$null;Update-IrisConnection
        Assert-True ([object]::ReferenceEquals($before,$viewport.Controls[0].Controls[0])) 'Read-only polling disposed stable checkboard rows'
        $script:connectionView.Clear();Update-IrisConnection
        Assert-True (-not $widget.RenderedText.Contains('LiveRow') -and -not $widget.RenderedText.Contains('Warrior')) 'Shared clear retained old private rows'
    } finally {
        $widget.Dispose();$connection.Dispose();$owner.Dispose();$characterSelect.Dispose();$connectSanctum.Dispose();$confirmCharacter.Dispose()
        Remove-Item Function:Update-IrisConnection
    }
}
Test-Case 'write consent enables bounded edit intents and queue states survive display polling' {
    $owner=[Iris.OverlayWindow]::new($false);$widget=[Iris.CheckboardWindow]::new($owner)
    try {
        $root=@{generation=1;selectionVersion=2;status='connected';accountId='a';selectedId='7';characters=@(@{id='7';nickname='Test'});summary=@{};details=@{schemaVersion=1;tasks=@{};classes=@()};writeAllowed=$false;writeContext=@{periodKeys=@{}};editQueue=@{state='idle';edits=@()}}
        foreach($category in @('daily','weekly','abyss','raid')) {
            $root.summary[$category]=@{completed=0;total=0};$root.details.tasks[$category]=@()
            $root.writeContext.periodKeys[$category]='2026-10-03T21:00:00.000Z'
        }
        $root.summary.daily=@{completed=0;total=3};$root.details.tasks.daily=@(@{id='1';name='Repeat';completed=0;total=3})
        $view=[Iris.ConnectionDisplay]::new()
        Assert-True ($view.Apply(($root|ConvertTo-Json -Depth 12 -Compress),[DateTimeOffset]::UtcNow)) 'Read state rejected'
        $widget.ApplyDisplay($view);$widget.SetSectionExpanded('daily',$true)
        Assert-True (-not $widget.CanEdit) 'Read consent permitted writes'
        $root.writeAllowed=$true
        Assert-True ($view.Apply(($root|ConvertTo-Json -Depth 12 -Compress),[DateTimeOffset]::UtcNow)) 'Write state rejected'
        $widget.ApplyDisplay($view)
        Assert-True ($widget.CanEdit) 'Separate write consent did not enable controls'
        $script:editIntent=$null
        $widget.add_EditRequested({param($s,$e) $script:editIntent=$e})
        $button=$widget.Controls.Find('edit:daily:1:plus',$true)[0]
        $widget.Show();$button.PerformClick()
        Assert-True ($script:editIntent.Category -eq 'daily' -and $script:editIntent.TaskId -eq '1' -and $script:editIntent.DesiredCompleted -eq 1) 'Plus did not raise bounded edit intent'
        $edit=@{requestId='11111111-1111-4111-8111-111111111111';generation=1;selectionVersion=2;accountId='a';characterId='7';category='daily';taskId='1';baseCompleted=0;desiredCompleted=2;periodKey=$root.writeContext.periodKeys.daily;status='pending'}
        $root.editQueue=@{state='pending';edits=@($edit)}
        Assert-True ($view.Apply(($root|ConvertTo-Json -Depth 12 -Compress),[DateTimeOffset]::UtcNow)) 'Pending state rejected'
        $widget.ApplyDisplay($view)
        Assert-True ($view.PendingCount -eq 1 -and $widget.RenderedText.Contains('2/3') -and $widget.Controls.Find('saveEdits',$true)[0].Enabled) 'Pending edit lost or save disabled'
        $widget.SetRequestBusy($true);Assert-True (-not $widget.Controls.Find('saveEdits',$true)[0].Enabled) 'Duplicate click was not locked'
        $widget.SetRequestBusy($false)
        $edit.desiredCompleted=3;$null=$view.Apply(($root|ConvertTo-Json -Depth 12 -Compress),[DateTimeOffset]::UtcNow);$widget.ApplyDisplay($view)
        Assert-True (-not $widget.Controls.Find('edit:daily:1:plus',$true)[0].Enabled -and $widget.Controls.Find('edit:daily:1:minus',$true)[0].Enabled) 'Repeat upper bound not locked'
        $widget.HideByUser();$widget.ShowByUser();$widget.Close()
        Assert-True ($view.PendingCount -eq 1 -and -not $widget.IsDisposed) 'Widget close destroyed pending memory'
        foreach($colors in @(@('#0B0B0C','#E8CA8A'),@('#FFFFFF','#806336'),@('#072522','#93CFA6'),@('#1A1027','#CAADF2'),@('#300F16','#EF9BAC'),@('#ECF7DF','#665CB4'))) {
            $widget.SetPalette([Drawing.ColorTranslator]::FromHtml($colors[0]),[Drawing.ColorTranslator]::FromHtml($colors[1]),[Drawing.ColorTranslator]::FromHtml($colors[1]))
            $plus=$widget.Controls.Find('edit:daily:1:plus',$true)[0]
            Assert-True ($plus.BackColor.ToArgb() -eq $widget.BackColor.ToArgb()) 'Editable controls missed theme'
        }
        $widget.ShowByUser();[Windows.Forms.Application]::DoEvents()
        if($env:IRIS_TEST_CAPTURE) {
            $bitmap=[Drawing.Bitmap]::new($widget.Width,$widget.Height)
            try {$widget.DrawToBitmap($bitmap,$widget.ClientRectangle);$bitmap.Save($env:IRIS_TEST_CAPTURE,[Drawing.Imaging.ImageFormat]::Png)} finally {$bitmap.Dispose()}
        }
        $root.editQueue.state='unknown';$edit.status='unknown'
        $null=$view.Apply(($root|ConvertTo-Json -Depth 12 -Compress),[DateTimeOffset]::UtcNow);$widget.ApplyDisplay($view)
        Assert-True (-not $widget.CanEdit -and -not $widget.Controls.Find('saveEdits',$true)[0].Enabled) 'Unknown result permits duplicate save'
        $root.writeContext.periodKeys.daily='invalid'
        $null=$view.Apply(($root|ConvertTo-Json -Depth 12 -Compress),[DateTimeOffset]::UtcNow);$widget.ApplyDisplay($view)
        Assert-True (-not $widget.CanEdit) 'Malformed period enables editing'
        $widget.Clear('disconnected');Assert-True (-not $widget.CanEdit -and -not $widget.RenderedText.Contains('Repeat')) 'Disconnected state retained edits'
    } finally {$widget.Dispose();$owner.Dispose()}
}
Test-Case 'controller stages identity bound intent once and exit warns about pending changes' {
    $tokens=$null;$errors=$null
    $tree=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'overlay.ps1'),[ref]$tokens,[ref]$errors)
    foreach($name in @('Stage-IrisKronosEdit','Submit-IrisKronosEdits','Get-IrisExitMessage')) {
        $fn=$tree.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
        Assert-True ($null -ne $fn) ('Missing controller function '+$name)
        . ([scriptblock]::Create($fn.Extent.Text))
    }
    $owner=[Iris.OverlayWindow]::new($false);$widget=[Iris.CheckboardWindow]::new($owner);$modules=@($null,$null,$null,$null,$widget)
    $foot=[Windows.Forms.Label]::new();$script:ownedReady=$true;$script:nativeTask=$null;$script:pendingEditCount=1
    $script:ownedServer=[pscustomobject]@{}
    $script:ownedServer | Add-Member ScriptMethod RequestAsync {param($route,$method,$body) $script:captured=@{route=$route;method=$method;body=($body|ConvertFrom-Json)};return [Threading.Tasks.Task]::FromResult('ok')}
    try {
        $root=@{generation=1;selectionVersion=2;status='connected';accountId='a';selectedId='7';characters=@(@{id='7';nickname='Test'});summary=@{};details=@{schemaVersion=1;tasks=@{};classes=@()};writeAllowed=$true;writeContext=@{periodKeys=@{}};editQueue=@{state='idle';edits=@()}}
        foreach($c in @('daily','weekly','abyss','raid')) {$root.summary[$c]=@{completed=0;total=0};$root.details.tasks[$c]=@();$root.writeContext.periodKeys[$c]='2026-10-03T21:00:00.000Z'}
        $root.summary.daily=@{completed=0;total=3};$root.details.tasks.daily=@(@{id='1';name='Repeat';completed=0;total=3})
        $script:connectionView=[Iris.ConnectionDisplay]::new();$null=$script:connectionView.Apply(($root|ConvertTo-Json -Depth 12 -Compress),[DateTimeOffset]::UtcNow)
        $widget.ApplyDisplay($script:connectionView)
        Stage-IrisKronosEdit ([Iris.KronosEditRequestedEventArgs]::new('daily','1',2))
        Assert-True ($script:captured.route -eq 'edits' -and $script:captured.body.edit.characterId -eq '7' -and $script:captured.body.edit.baseCompleted -eq 0 -and $script:captured.body.edit.desiredCompleted -eq 2) 'Controller leaked or lost edit identity'
        $previous=$script:captured;Stage-IrisKronosEdit ([Iris.KronosEditRequestedEventArgs]::new('daily','1',3))
        Assert-True ([object]::ReferenceEquals($previous,$script:captured)) 'In flight request duplicated'
        $message=Get-IrisExitMessage
        Assert-True ($message.Contains('1') -and $message.Length -gt 80) 'Pending changes absent from exit warning'
    } finally {$widget.Dispose();$owner.Dispose();$foot.Dispose();foreach($name in @('Stage-IrisKronosEdit','Submit-IrisKronosEdits','Get-IrisExitMessage')) {Remove-Item ('Function:'+$name)}}
}
ConvertTo-Json -InputObject @($results) -Compress
if($results.Where({-not $_.passed}).Count) {exit 1}
