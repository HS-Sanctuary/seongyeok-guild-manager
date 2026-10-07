$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'ram-companion.ps1')
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('iris-ram-' + [Guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($testRoot)
$testConfig = Join-Path $testRoot 'settings.json'
$testExe = Join-Path $testRoot '램누수정리v2.exe'
function Assert-Status($actual, $expected) { if ($actual.Status -ne $expected) { throw "Expected $expected, got $($actual.Status): $($actual.Message)" } }
$script:launchCalls = 0
$fakeLaunch = { param($path) $script:launchCalls++; [pscustomobject]@{ Id = 123 } }
try {
    Assert-Status (Start-IrisRamCompanion $testConfig {} $fakeLaunch) 'Disabled'
    [IO.File]::WriteAllText($testExe, 'test fixture, never execute')
    Save-IrisRamSettings $true $testExe $testConfig
    Assert-Status (Start-IrisRamCompanion $testConfig { param($name) @(1, 2) } $fakeLaunch) 'AlreadyRunning'
    if ($script:launchCalls -ne 0) { throw 'Existing parent/child process was duplicated' }
    Assert-Status (Start-IrisRamCompanion $testConfig {} $fakeLaunch) 'Started'
    if ($script:launchCalls -ne 1) { throw 'Startup did not launch exactly once' }
    Assert-Status (Start-IrisRamCompanion $testConfig {} { throw 'launch denied' }) 'Failed'
    [IO.File]::Delete($testExe)
    Assert-Status (Start-IrisRamCompanion $testConfig {} $fakeLaunch) 'Failed'
    Assert-Status (Start-IrisRamCompanion $testConfig { 1 } $fakeLaunch) 'AlreadyRunning'
    Save-IrisRamSettings $false $testExe $testConfig
    Assert-Status (Start-IrisRamCompanion $testConfig { throw 'must not inspect' } { throw 'must not launch' }) 'Disabled'
    [IO.File]::WriteAllText($testConfig, '{"version":1,"enabled":"true","executablePath":"x"}')
    Assert-Status (Start-IrisRamCompanion $testConfig {} $fakeLaunch) 'Failed'
    [IO.File]::WriteAllText($testConfig, '{broken')
    Assert-Status (Start-IrisRamCompanion $testConfig {} $fakeLaunch) 'Failed'
    'RAM companion: 9 scenarios PASS (no real executable launched)'
} finally {
    foreach ($testFile in @($testConfig, $testExe)) { if ([IO.File]::Exists($testFile)) { [IO.File]::Delete($testFile) } }
    [IO.Directory]::Delete($testRoot)
}
