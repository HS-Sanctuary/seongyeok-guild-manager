param([string]$ExecutablePath, [switch]$Disable)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'ram-companion.ps1')
if (!$ExecutablePath) {
    $existing = Read-IrisRamSettings
    $ExecutablePath = $existing.ExecutablePath
    if (!$ExecutablePath) {
        $ExecutablePath = Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads/램누수정리v2/램누수정리v2.exe'
    }
}
Save-IrisRamSettings (!$Disable) $ExecutablePath
if ($Disable) { 'IRIS와 램 정리 함께 시작: 꺼짐 (실행 중인 프로그램은 유지)' }
else { 'IRIS와 램 정리 함께 시작: 켜짐 (다음 IRIS 시작부터 적용)' }
