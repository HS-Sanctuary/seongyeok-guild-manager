$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'desktop-store.cs'
if (!(Test-Path $source)) { throw 'Encrypted desktop queue store is missing' }
Add-Type -Path $source -ReferencedAssemblies @('System.Security', 'System.Web.Extensions', 'System.Core')
$probeRoot = Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-06-iris-compact-overlay/store-probes/' + [Guid]::NewGuid().ToString('N'))
$store = New-Object IrisDesktop.DesktopStore($probeRoot, 'development')
$entry = @{environment='development';accountId='synthetic-account';characterId='A';category='weekly';taskId='sentinel-task';periodKey='2026-10-04T21:00:00.000Z';requestId='00000000-0000-4000-8000-000000000001';revision=1;baseCompleted=0;desiredCompleted=1;deadlineAt=15000;phase='inflight'}
$snapshot = @{schemaVersion=1;entries=@($entry)} | ConvertTo-Json -Depth 8 -Compress
function Assert($ok, $message) { if (!$ok) { throw $message } }
function Reject($action, $message) { $rejected=$false; try { & $action } catch { $rejected=$true }; Assert $rejected $message }
$store.Replace($snapshot)
$cipher=[IO.File]::ReadAllBytes($store.FilePath)
Assert (!([Text.Encoding]::UTF8.GetString($cipher).Contains('sentinel-task'))) 'Queue leaked plaintext'
Assert (($store.Load() | ConvertFrom-Json).entries[0].taskId -eq 'sentinel-task') 'Queue restore lost data'
$production=New-Object IrisDesktop.DesktopStore($probeRoot, 'production')
Assert ($null -eq $production.Load()) 'Other environment queue loaded'
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($production.FilePath)) | Out-Null
[IO.File]::WriteAllBytes($production.FilePath,$cipher)
Reject { $production.Load() } 'Foreign environment ciphertext accepted'
Assert (!(Test-Path $production.FilePath)) 'Corrupt ciphertext not quarantined'
Assert (@(Get-ChildItem ([IO.Path]::GetDirectoryName($production.FilePath)) -Filter '*.corrupt-*').Count -eq 1) 'Quarantine evidence lost'
$entry.secret='must-not-persist'
Reject { $store.Replace((@{schemaVersion=1;entries=@($entry)} | ConvertTo-Json -Compress)) } 'Undocumented field accepted'
$entry.Remove('secret');$entry.desiredCompleted=-1
Reject { $store.Replace((@{schemaVersion=1;entries=@($entry)} | ConvertTo-Json -Compress)) } 'Negative count accepted'
$entry.desiredCompleted=1;$entry.environment='production'
Reject { $store.Replace((@{schemaVersion=1;entries=@($entry)} | ConvertTo-Json -Compress)) } 'Foreign entry persisted'
$entry.environment='development'
$before=[Convert]::ToBase64String([IO.File]::ReadAllBytes($store.FilePath))
$fileLock=[IO.File]::Open($store.FilePath,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::None)
try { Reject { $store.Replace('{"schemaVersion":1,"entries":[]}') } 'Locked atomic replacement succeeded' } finally { $fileLock.Dispose() }
Assert ([Convert]::ToBase64String([IO.File]::ReadAllBytes($store.FilePath)) -eq $before) 'Atomic failure destroyed previous file'
[IO.File]::WriteAllBytes($store.FilePath,$cipher[0..15])
Reject { $store.Load() } 'Truncated ciphertext accepted'
Assert (!(Test-Path $store.FilePath)) 'Truncated file not quarantined'
Write-Output 'Encrypted store: plaintext/restore/environment/schema/atomic failure/quarantine PASS'
