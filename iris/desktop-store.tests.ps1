$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'desktop-store.cs'
if (!(Test-Path $source)) { throw 'Encrypted desktop queue store is missing' }
Add-Type -Path $source -ReferencedAssemblies @('System.Security', 'System.Web.Extensions', 'System.Core')
Add-Type -AssemblyName System.Security
$migrationRoot = Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-07-iris-class-level-editing/store-migration/' + [Guid]::NewGuid().ToString('N'))
$legacyDir=Join-Path $migrationRoot 'development'
[IO.Directory]::CreateDirectory($legacyDir) | Out-Null
$legacyPath=Join-Path $legacyDir 'pending-v1.dpapi'
$legacyJson='{"schemaVersion":1,"entries":[{"environment":"development","accountId":"test","characterId":"A","category":"daily","taskId":"1","periodKey":"2026-10-04T21:00:00.000Z","requestId":"00000000-0000-4000-8000-000000000001","revision":1,"baseCompleted":0,"desiredCompleted":1,"deadlineAt":15000,"phase":"pending"}]}'
$legacyCipher=[Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes($legacyJson),[Text.Encoding]::UTF8.GetBytes('SANCTUM:IRIS:DesktopQueue:v1:development'),[Security.Cryptography.DataProtectionScope]::CurrentUser)
[IO.File]::WriteAllBytes($legacyPath,$legacyCipher)
$migrating=New-Object IrisDesktop.DesktopStore($migrationRoot,'development')
$migrated=$migrating.Load() | ConvertFrom-Json
if($migrated.schemaVersion -ne 2 -or $migrated.entries[0].kind -ne 'task' -or $migrated.entries[0].desiredCompleted -ne 1){throw 'Migration lost legacy task'}
if((Test-Path $legacyPath) -or @(Get-ChildItem $legacyDir -Filter 'pending-v1.recovery-*.dpapi').Count -ne 1){throw 'Migration did not retain legacy recovery backup'}
[IO.File]::WriteAllBytes($legacyPath,$legacyCipher)
try{$migrating.Load();throw 'AMBIGUOUS_ACCEPTED'}catch{if($_.Exception.Message -match 'AMBIGUOUS_ACCEPTED'){throw}}
try{$migrating.Replace('{"schemaVersion":2,"entries":[]}');throw 'AMBIGUOUS_WRITE'}catch{if($_.Exception.Message -match 'AMBIGUOUS_WRITE'){throw}}
$probeRoot = Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-07-iris-class-level-editing/store-probes/' + [Guid]::NewGuid().ToString('N'))
$store = New-Object IrisDesktop.DesktopStore($probeRoot, 'development')
$entry = @{kind='task';environment='development';accountId='synthetic-account';characterId='A';category='weekly';taskId='sentinel-task';periodKey='2026-10-04T21:00:00.000Z';requestId='00000000-0000-4000-8000-000000000001';revision=1;baseCompleted=0;desiredCompleted=1;deadlineAt=15000;phase='inflight'}
$snapshot = @{schemaVersion=2;entries=@($entry)} | ConvertTo-Json -Depth 8 -Compress
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
Reject { $store.Replace((@{schemaVersion=2;entries=@($entry)} | ConvertTo-Json -Compress)) } 'Undocumented field accepted'
$entry.Remove('secret');$entry.desiredCompleted=-1
Reject { $store.Replace((@{schemaVersion=2;entries=@($entry)} | ConvertTo-Json -Compress)) } 'Negative count accepted'
$entry.desiredCompleted=1;$entry.environment='production'
Reject { $store.Replace((@{schemaVersion=2;entries=@($entry)} | ConvertTo-Json -Compress)) } 'Foreign entry persisted'
$entry.environment='development'
$before=[Convert]::ToBase64String([IO.File]::ReadAllBytes($store.FilePath))
$fileLock=[IO.File]::Open($store.FilePath,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::None)
try { Reject { $store.Replace('{"schemaVersion":2,"entries":[]}') } 'Locked atomic replacement succeeded' } finally { $fileLock.Dispose() }
Assert ([Convert]::ToBase64String([IO.File]::ReadAllBytes($store.FilePath)) -eq $before) 'Atomic failure destroyed previous file'
$classEntry=@{kind='class';environment='development';accountId='synthetic-account';characterId='A';classId='synthetic-class';baseLevel=$null;desiredLevel=53;requestId='00000000-0000-4000-8000-000000000002';revision=2;deadlineAt=15000;phase='pending'}
$store.Replace((@{schemaVersion=2;entries=@($entry,$classEntry)}|ConvertTo-Json -Depth 8 -Compress))
Assert (($store.Load()|ConvertFrom-Json).entries[1].baseLevel -eq $null) 'Nullable class baseline lost'
$classEntry.desiredLevel=0
Reject {$store.Replace((@{schemaVersion=2;entries=@($classEntry)}|ConvertTo-Json -Compress))} 'Invalid class level accepted'
$classEntry.desiredLevel=53;$classEntry.periodKey='2026-10-04T21:00:00.000Z'
Reject {$store.Replace((@{schemaVersion=2;entries=@($classEntry)}|ConvertTo-Json -Compress))} 'Class period accepted'
[IO.File]::WriteAllBytes($store.FilePath,$cipher[0..15])
Reject { $store.Load() } 'Truncated ciphertext accepted'
Assert (!(Test-Path $store.FilePath)) 'Truncated file not quarantined'
$interruptedRoot=Join-Path $migrationRoot 'interrupted'
$interruptedDir=Join-Path $interruptedRoot 'development'
[IO.Directory]::CreateDirectory($interruptedDir)|Out-Null
$interruptedLegacy=Join-Path $interruptedDir 'pending-v1.dpapi'
[IO.File]::WriteAllBytes($interruptedLegacy,$legacyCipher)
$interrupted=New-Object IrisDesktop.DesktopStore($interruptedRoot,'development')
$legacyLock=[IO.File]::Open($interruptedLegacy,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read)
try {Reject {$interrupted.Load()} 'Interrupted legacy rename accepted'}finally{$legacyLock.Dispose()}
Assert (Test-Path $interruptedLegacy) 'Interrupted migration deleted original'
Assert (Test-Path $interrupted.FilePath) 'Interrupted migration did not preserve new encrypted file'
$restarted=New-Object IrisDesktop.DesktopStore($interruptedRoot,'development')
Reject {$restarted.Load()} 'Ambiguous restart accepted'
Reject {$restarted.Replace('{"schemaVersion":2,"entries":[]}')} 'Ambiguous restart overwrote evidence'
Write-Output 'Encrypted store: plaintext/restore/environment/schema/atomic failure/quarantine PASS'
