# IRIS Windows overlay alpha. Run with: powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File iris/overlay.ps1
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$irisRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverProcess = $null
$localUrl = 'http://127.0.0.1:4317'

try {
    Invoke-WebRequest -Uri $localUrl -TimeoutSec 2 -UseBasicParsing | Out-Null
} catch {
    $serverProcess = Start-Process -FilePath 'node' -ArgumentList @('iris/server.mjs') -WorkingDirectory (Split-Path -Parent $irisRoot) -WindowStyle Hidden -PassThru
}

function New-IrisLabel([string]$text, [int]$x, [int]$y, [int]$width, [int]$height, [int]$size, [bool]$bold, [System.Drawing.Color]$color) {
    $label = [System.Windows.Forms.Label]::new()
    $label.Text = $text
    $label.Location = [System.Drawing.Point]::new($x, $y)
    $label.Size = [System.Drawing.Size]::new($width, $height)
    $label.ForeColor = $color
    $style = if ($bold) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
    $label.Font = [System.Drawing.Font]::new('Malgun Gothic', $size, $style)
    $label.BackColor = [System.Drawing.Color]::Transparent
    return $label
}

$gold = [System.Drawing.ColorTranslator]::FromHtml('#E8CA8A')
$main = [System.Drawing.ColorTranslator]::FromHtml('#F4EAD5')
$sub = [System.Drawing.ColorTranslator]::FromHtml('#AAA9A6')
$panel = [System.Drawing.ColorTranslator]::FromHtml('#101114')
$form = [System.Windows.Forms.Form]::new()
$form.Text = 'SANCTUM IRIS'
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
$form.BackColor = $panel
$form.ForeColor = $main
$form.ClientSize = [System.Drawing.Size]::new(292, 350)
$form.TopMost = $true
$form.ShowInTaskbar = $true
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$workingArea = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$form.Location = [System.Drawing.Point]::new($workingArea.Right - 310, $workingArea.Top + 90)
$form.Opacity = 0.94

$title = New-IrisLabel '✦ IRIS' 15 10 160 32 16 $true $gold
$form.Controls.Add($title)
$close = [System.Windows.Forms.Button]::new()
$close.Text = '×'
$close.Location = [System.Drawing.Point]::new(256, 11)
$close.Size = [System.Drawing.Size]::new(27, 26)
$close.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$close.FlatAppearance.BorderSize = 0
$close.BackColor = $panel
$close.ForeColor = $sub
$close.Add_Click({ $form.Close() })
$form.Controls.Add($close)
$collapse = [System.Windows.Forms.Button]::new()
$collapse.Text = '−'
$collapse.Location = [System.Drawing.Point]::new(226, 11)
$collapse.Size = [System.Drawing.Size]::new(27, 26)
$collapse.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$collapse.FlatAppearance.BorderSize = 0
$collapse.BackColor = $panel
$collapse.ForeColor = $sub
$collapse.Add_Click({
    if ($form.Height -gt 60) { $form.Height = 49; $collapse.Text = '+' }
    else { $form.Height = 350; $collapse.Text = '−' }
})
$form.Controls.Add($collapse)

$status = New-IrisLabel '게임 연결 확인 중' 16 47 260 25 9 $false $sub
$form.Controls.Add($status)
$fields = @(
    @('직업 · 레벨', 84), @('전투력', 113), @('생활력', 142),
    @('매력', 171), @('마도저항', 200), @('데코점수', 229),
    @('가공기', 258), @('일일 · 주간 숙제', 287)
)
$values = @{}
foreach ($field in $fields) {
    $label = New-IrisLabel $field[0] 16 $field[1] 122 24 9 $false $sub
    $value = New-IrisLabel '—' 140 $field[1] 137 24 9 $true $main
    $value.TextAlign = [System.Drawing.ContentAlignment]::MiddleRight
    $form.Controls.Add($label)
    $form.Controls.Add($value)
    $values[$field[0]] = $value
}
$foot = New-IrisLabel '읽기 전용 · 데이터 저장 없음' 16 322 260 20 8 $false $sub
$form.Controls.Add($foot)

$script:dragging = $false
$script:dragOffset = [System.Drawing.Point]::Empty
$dragDown = {
    param($sender, $event)
    if ($event.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $script:dragging = $true
        $script:dragOffset = [System.Drawing.Point]::new([System.Windows.Forms.Cursor]::Position.X - $form.Left, [System.Windows.Forms.Cursor]::Position.Y - $form.Top)
    }
}
$dragMove = {
    if ($script:dragging) {
        $cursor = [System.Windows.Forms.Cursor]::Position
        $form.Location = [System.Drawing.Point]::new($cursor.X - $script:dragOffset.X, $cursor.Y - $script:dragOffset.Y)
    }
}
$dragUp = { $script:dragging = $false }
foreach ($control in @($form, $title)) {
    $control.Add_MouseDown($dragDown)
    $control.Add_MouseMove($dragMove)
    $control.Add_MouseUp($dragUp)
}

function Format-IrisNumber($value) {
    if ($null -eq $value) { return '—' }
    return ('{0:N0}' -f [double]$value)
}

$timer = [System.Windows.Forms.Timer]::new()
$timer.Interval = 5000
$timer.Add_Tick({
    try {
        $result = Invoke-RestMethod -Uri "$localUrl/api/snapshot" -TimeoutSec 3
        if ($result.status -ne 'connected') { throw '게임 연결 대기' }
        $data = $result.data
        $status.Text = '● 게임 연결됨 · ' + ([datetime]$data.observedAt).ToLocalTime().ToString('HH:mm:ss')
        $status.ForeColor = [System.Drawing.ColorTranslator]::FromHtml('#69D8A4')
        $values['직업 · 레벨'].Text = "$($data.character.job) Lv.$($data.character.level)"
        $values['전투력'].Text = Format-IrisNumber $data.character.combatScore
        $values['생활력'].Text = Format-IrisNumber $data.character.livingScore
        $values['매력'].Text = Format-IrisNumber $data.character.attractivenessScore
        $values['마도저항'].Text = Format-IrisNumber $data.character.arcaneResistance
        $values['데코점수'].Text = Format-IrisNumber $data.character.decorScore
        $values['가공기'].Text = if ($data.processing.available) { "$($data.processing.facilityCount)개 · 완료 $($data.processing.completed)" } else { '조회 불가' }
        $daily = if ($data.missions.daily.available) { "$($data.missions.daily.completed)/$($data.missions.daily.total)" } else { '—' }
        $weekly = if ($data.missions.weekly.available) { "$($data.missions.weekly.completed)/$($data.missions.weekly.total)" } else { '—' }
        $values['일일 · 주간 숙제'].Text = "$daily · $weekly"
    } catch {
        $status.Text = '● 게임 또는 로컬 서버 연결 대기'
        $status.ForeColor = [System.Drawing.ColorTranslator]::FromHtml('#F5AB8C')
    }
})
$form.Add_Shown({ $timer.Start() })
try {
    [System.Windows.Forms.Application]::Run($form)
} finally {
    $timer.Stop()
    $timer.Dispose()
    $form.Dispose()
    if ($serverProcess -and -not $serverProcess.HasExited) { Stop-Process -Id $serverProcess.Id }
}
