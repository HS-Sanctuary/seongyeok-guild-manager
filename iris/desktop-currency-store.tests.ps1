$ErrorActionPreference='Stop'
if(-not(Test-Path (Join-Path $PSScriptRoot 'desktop-currency-store.cs'))){throw 'Missing currency cache implementation'}
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-currency-store.cs'),(Join-Path $PSScriptRoot 'desktop-currency-store.fixture.cs')) -ReferencedAssemblies System.Web.Extensions,System.Security
$root=Join-Path ([IO.Path]::GetTempPath()) ('iris-currency-synthetic-'+[guid]::NewGuid().ToString('N'))
$store=New-Object IrisDesktop.DesktopCurrencyStore($root,'development')
function Observe($owner,$time,$items){$store.Observe($owner,(@{observedAt=$time;items=$items}|ConvertTo-Json -Depth 8))|Out-Null}
if($null -ne $store.Load('a')){throw 'Missing cache must be null'}
Observe 'a' '2026-10-22T01:00:00.000Z' @(@{name='gold';amount=100},@{name='wing';amount=0})
$first=$store.Load('a')|ConvertFrom-Json
if($first.items[0].amount -ne 100 -or $first.items[1].amount -ne 0 -or $first.attribution -ne 'unverified'){throw 'Valid values/attribution lost'}
Observe 'a' '2026-10-22T02:00:00.000Z' @(@{name='gold';amount=$null})
Observe 'a' '2026-10-22T00:00:00.000Z' @(@{name='gold';amount=2})
Observe 'a' '2026-10-22T03:00:00.000Z' @()
$loaded=$store.Load('a')|ConvertFrom-Json
if($loaded.items[0].amount -ne 100 -or $loaded.items[0].observedAt -ne '2026-10-22T01:00:00.000Z'){throw 'Null/empty/older observation destroyed last good value'}
if($null -ne $store.Load('b')){throw 'Account cache leaked'}
$prod=New-Object IrisDesktop.DesktopCurrencyStore($root,'production');if($null -ne $prod.Load('a')){throw 'Environment cache leaked'}
$restart=New-Object IrisDesktop.DesktopCurrencyStore($root,'development');if(($restart.Load('a')|ConvertFrom-Json).items[0].amount -ne 100){throw 'Restart lost cache'}
$bad=$false;try{Observe 'a' '2026-10-22T04:00:00.000Z' @(@{name='gold';amount=-1})}catch{$bad=$true};if(-not $bad){throw 'Invalid quantity accepted'}
if(($store.Load('a')|ConvertFrom-Json).items[0].amount -ne 100){throw 'Invalid save destroyed cache'}
$files=@(Get-ChildItem -LiteralPath $root -Recurse -File)
if(-not $files.Count -or @($files|Where-Object{[Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($_.FullName)).Contains('gold')}).Count){throw 'Cache is plaintext'}
Write-Output 'PASS currency cache: zero/null/empty/stale/account/environment/restart/invalid/encryption; synthetic root only'
$main=@($files | Where-Object {$_.Extension -eq '.dpapi'})[0].FullName
$before=(Get-FileHash -LiteralPath $main).Hash
$locked=[IO.File]::Open($main,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read)
$failed=$false;try{Observe 'a' '2026-10-22T05:00:00.000Z' @(@{name='gold';amount=200})}catch{$failed=$true}finally{$locked.Dispose()}
if(-not $failed -or (Get-FileHash -LiteralPath $main).Hash -ne $before){throw 'Failed atomic replacement destroyed previous cache'}
# Only remove the fixture primary to simulate interrupted/missing primary; backup stays.
if(-not $main.StartsWith([IO.Path]::GetFullPath($root)+[IO.Path]::DirectorySeparatorChar)){throw 'Unsafe synthetic path'}
[IO.File]::Delete($main)
$recovered=New-Object IrisDesktop.DesktopCurrencyStore($root,'development')
$backup=$recovered.Load('a')|ConvertFrom-Json
if($null -eq $backup -or $backup.items[0].amount -ne 100){throw 'Missing primary must retain readable last-known backup'}
$blocked=$false;try{$recovered.Observe('a','{"observedAt":"2026-10-22T06:00:00.000Z","items":[{"name":"gold","amount":300}]}')|Out-Null}catch{$blocked=$true}
if(-not $blocked){throw 'Recovery cannot silently replace protected backup'}
Write-Output 'PASS atomic failure preserves bytes; missing primary restores backup without allowing silent replacement'
[IrisDesktop.CurrencyObservationFixture]::AssertStaleNotPersisted($store)
Write-Output 'PASS revoked document observation cannot persist'
