# Local, opt-in companion. Never change the cleaner's settings or terminate it.
function Get-IrisRamSettingsPath {
    Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Sanctum/IRIS/ram-companion.json'
}

function Read-IrisRamSettings {
    param([string]$Path = (Get-IrisRamSettingsPath))
    if (!(Test-Path -LiteralPath $Path)) { return [pscustomobject]@{ Enabled = $false; ExecutablePath = '' } }
    if ((Get-Item -LiteralPath $Path).Length -gt 8192) { throw '램 정리 연결 설정이 너무 큽니다.' }
    $value = [IO.File]::ReadAllText($Path) | ConvertFrom-Json -ErrorAction Stop
    if ($value.version -ne 1 -or $value.enabled -isnot [bool] -or $value.executablePath -isnot [string]) {
        throw '램 정리 연결 설정 형식이 올바르지 않습니다.'
    }
    [pscustomobject]@{ Enabled = $value.enabled; ExecutablePath = $value.executablePath }
}

function Save-IrisRamSettings {
    param([bool]$Enabled, [string]$ExecutablePath, [string]$Path = (Get-IrisRamSettingsPath))
    if (![IO.Path]::IsPathRooted($ExecutablePath) -or [IO.Path]::GetFileName($ExecutablePath) -ne '램누수정리v2.exe') {
        throw '램누수정리v2.exe의 전체 경로를 지정해 주세요.'
    }
    $fullPath = [IO.Path]::GetFullPath($ExecutablePath)
    if ($Enabled -and !(Test-Path -LiteralPath $fullPath -PathType Leaf)) { throw '램 정리 실행 파일을 찾을 수 없습니다.' }
    $folder = Split-Path -Parent $Path
    [void][IO.Directory]::CreateDirectory($folder)
    $temporary = Join-Path $folder ([Guid]::NewGuid().ToString('N') + '.tmp')
    $backup = $temporary + '.bak'
    try {
        $json = @{ version = 1; enabled = $Enabled; executablePath = $fullPath } | ConvertTo-Json
        [IO.File]::WriteAllText($temporary, $json, [Text.UTF8Encoding]::new($false))
        if (Test-Path -LiteralPath $Path) { [IO.File]::Replace($temporary, $Path, $backup) }
        else { [IO.File]::Move($temporary, $Path) }
    } finally {
        if (Test-Path -LiteralPath $temporary) { [IO.File]::Delete($temporary) }
        if (Test-Path -LiteralPath $backup) { [IO.File]::Delete($backup) }
    }
}

function Start-IrisRamCompanion {
    param(
        [string]$SettingsPath = (Get-IrisRamSettingsPath),
        [scriptblock]$FindRunning = { param($name) @(Get-Process -Name $name -ErrorAction SilentlyContinue) },
        [scriptblock]$Launch = { param($path) Start-Process -FilePath $path -WorkingDirectory (Split-Path -Parent $path) -WindowStyle Hidden -PassThru }
    )
    $guard = $null; $owned = $false
    try {
        $settings = Read-IrisRamSettings $SettingsPath
        if (!$settings.Enabled) { return [pscustomobject]@{ Status = 'Disabled'; Message = '램 정리 함께 시작: 꺼짐' } }
        $path = $settings.ExecutablePath
        if (![IO.Path]::IsPathRooted($path) -or [IO.Path]::GetFileName($path) -ne '램누수정리v2.exe') { throw '램 정리 실행 파일 경로가 올바르지 않습니다.' }
        $guard = [Threading.Mutex]::new($false, ('Local\SANCTUM.IRIS.RamStart.' + [Security.Principal.WindowsIdentity]::GetCurrent().User.Value))
        try { $owned = $guard.WaitOne(0) } catch [Threading.AbandonedMutexException] { $owned = $true }
        if (!$owned) { return [pscustomobject]@{ Status = 'Busy'; Message = '다른 IRIS에서 램 정리 시작을 확인 중입니다.' } }
        # Parent/child packaging may expose two processes. Either means already running.
        if (@(& $FindRunning ([IO.Path]::GetFileNameWithoutExtension($path))).Count -gt 0) {
            return [pscustomobject]@{ Status = 'AlreadyRunning'; Message = '기존 램 정리 프로그램 사용 중' }
        }
        if (!(Test-Path -LiteralPath $path -PathType Leaf)) { throw '램 정리 실행 파일이 이동되었거나 없습니다.' }
        $process = & $Launch $path
        if (!$process) { throw '램 정리 프로그램을 시작하지 못했습니다.' }
        [pscustomobject]@{ Status = 'Started'; Message = '램 정리 프로그램 시작 요청 완료' }
    } catch {
        [pscustomobject]@{ Status = 'Failed'; Message = ('램 정리 함께 시작 실패: ' + $_.Exception.Message) }
    } finally {
        if ($owned) { $guard.ReleaseMutex() }
        if ($guard) { $guard.Dispose() }
    }
}

function Add-IrisRamCompanionMenu {
    param($Menu)
    $status = Start-IrisRamCompanion
    $label = $Menu.Items.Add($status.Message)
    $label.Enabled = $false
    $toggle = $Menu.Items.Add('램 정리 함께 시작 · 다음 실행부터')
    try { $toggle.Checked = (Read-IrisRamSettings).Enabled } catch { $toggle.Enabled = $false }
    $toggle.add_Click({
        param($sender, $event)
        try {
            $settings = Read-IrisRamSettings
            if (!$settings.ExecutablePath) { throw '먼저 iris/configure-ram-companion.ps1로 실행 파일을 연결해 주세요.' }
            Save-IrisRamSettings (!$settings.Enabled) $settings.ExecutablePath
            $sender.Checked = !$settings.Enabled
        } catch { [void][Windows.Forms.MessageBox]::Show($_.Exception.Message, 'SANCTUM IRIS · 램 정리') }
    })
}
