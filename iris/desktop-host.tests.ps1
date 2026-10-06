$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'desktop-host.cs'
if (-not (Test-Path $source)) { throw 'Missing desktop navigation/profile policy implementation' }
Add-Type -Path $source
$passed = 0
function Expect($actual, $expected, $label) {
    if ($actual -ne $expected) { throw "$label expected=$expected actual=$actual" }
    $script:passed++
}
foreach ($url in @('https://example.org/', 'https://sanctum-tawny-three.vercel.app.evil.org/', 'http://sanctum-tawny-three.vercel.app/', 'https://user@sanctum-tawny-three.vercel.app/', 'https://sanctum-tawny-three.vercel.app:444/', 'file:///C:/test.html', 'javascript:alert(1)')) {
    Expect ([IrisDesktop.DesktopHostPolicy]::ValidateNavigation([uri]$url, $false)) $false $url
}
Expect ([IrisDesktop.DesktopHostPolicy]::ValidateNavigation([uri]'https://sanctum-tawny-three.vercel.app/iris/desktop', $false)) $true 'production HTTPS'
Expect ([IrisDesktop.DesktopHostPolicy]::ValidateNavigation([uri]'http://localhost:3000/iris/desktop', $false)) $false 'localhost in production'
Expect ([IrisDesktop.DesktopHostPolicy]::ValidateNavigation([uri]'http://localhost:3000/iris/desktop', $true)) $true 'development origin'
Expect ([IrisDesktop.DesktopHostPolicy]::ValidateNavigation([uri]'http://localhost:3001/', $true)) $false 'other local port'
Expect ([IrisDesktop.DesktopHostPolicy]::ValidateNavigation([uri]'http://127.0.0.1:3000/', $true)) $false 'other origin spelling'
Expect ([IrisDesktop.DesktopHostPolicy]::ValidateNavigation([uri]'https://sanctum-tawny-three.vercel.app/', $true)) $false 'production cookie profile not reused in dev'
$prod = [IrisDesktop.DesktopHostPolicy]::ProfilePath('production')
$dev = [IrisDesktop.DesktopHostPolicy]::ProfilePath('development')
Expect ($prod -ne $dev) $true 'separate cookie profiles'
Expect ($prod.StartsWith([Environment]::GetFolderPath('LocalApplicationData') + [IO.Path]::DirectorySeparatorChar)) $true 'app data root'
$rejected = $false
try { [IrisDesktop.DesktopHostPolicy]::ProfilePath('../Chrome') | Out-Null } catch { $rejected = $true }
Expect $rejected $true 'profile traversal'
Write-Output "desktop host policy: $passed passed"
