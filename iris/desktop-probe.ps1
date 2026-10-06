# Read-only capability inventory. Never opens/copies a browser profile or installs dependencies.
$ErrorActionPreference = 'Stop'
$runtimeVersions = @()
foreach ($root in @('HKLM:/SOFTWARE/WOW6432Node/Microsoft/EdgeUpdate/Clients', 'HKCU:/SOFTWARE/Microsoft/EdgeUpdate/Clients')) {
    foreach ($client in @(Get-ItemProperty "$root/*" -ErrorAction SilentlyContinue)) {
        if ($client.name -like '*WebView2*') { $runtimeVersions += [string]$client.pv }
    }
}
$repoPackages = Join-Path $PSScriptRoot 'vendor/webview2'
$nugetPackages = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.nuget/packages/microsoft.web.webview2'
$assemblies = @()
foreach ($root in @($repoPackages, $nugetPackages)) {
    if (Test-Path -LiteralPath $root) {
        $assemblies += @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter 'Microsoft.Web.WebView2.WinForms.dll' | Select-Object -ExpandProperty FullName)
    }
}
$sdkVersions = @()
if (Get-Command dotnet -ErrorAction SilentlyContinue) { $sdkVersions = @(& dotnet --list-sdks) }
[pscustomobject]@{
    runtimeInstalled = ($runtimeVersions.Count -gt 0)
    runtimeVersions = @($runtimeVersions | Sort-Object -Unique)
    managedAssemblyCandidates = $assemblies.Count
    dotnetSdkInstalled = ($sdkVersions.Count -gt 0)
    embeddedGate = 'not-tested'
    next = $(if ($assemblies.Count -eq 0) { 'Approve pinned WebView2 SDK acquisition before embedding; runtime alone is insufficient.' } else { 'Validate candidate compatibility and loader before embedding.' })
} | ConvertTo-Json -Depth 3
