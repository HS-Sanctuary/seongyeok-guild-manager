param([Parameter(Mandatory=$true)][string]$OldPackage,[Parameter(Mandatory=$true)][string]$NewZip,[Parameter(Mandatory=$true)][string]$NewMetadata,[switch]$OfflineIsolatedWebView)
$ErrorActionPreference='Stop'
# Either sandbox AppData, or an explicitly requested offline fresh WebView.
# No application source hooks, production credentials or live page are used.
$profile=[Environment]::GetFolderPath('LocalApplicationData')
if($profile -notlike '*\Packages\sandbox.*' -and !$OfflineIsolatedWebView){throw 'Live trial requires isolated mode'}
if(@(Get-Process -Name IRIS -ErrorAction SilentlyContinue).Count){throw 'Close existing IRIS normally before the live trial'}
$root=Join-Path ([IO.Path]::GetTempPath()) ('iris-update-live-'+[guid]::NewGuid().ToString('N'))
$install=Join-Path $root 'installed'
[void](New-Item -ItemType Directory -Path $install)
if($OfflineIsolatedWebView){
 $testProfile=Join-Path $root 'fresh-webview';[void](New-Item -ItemType Directory -Path $testProfile)
 $env:WEBVIEW2_USER_DATA_FOLDER=$testProfile
 $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS='--host-resolver-rules=MAP * ~NOTFOUND --disable-background-networking'
}
$desktopRoot=Join-Path $profile 'Sanctum/IRIS/Desktop'
function ProtectedFingerprints {
 $map=@{}
 if(Test-Path -LiteralPath $desktopRoot){Get-ChildItem -LiteralPath $desktopRoot -File -Recurse | Where-Object { $_.FullName -notmatch '\\WebViewProfile\\' } | ForEach-Object {$map[$_.FullName]=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash}}
 return $map
}
$before=ProtectedFingerprints
$files=@('IRIS.exe','IRIS.Updater.exe','IRIS.ico','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll','README.txt','LICENSE.WebView2.txt','NOTICE.WebView2.txt','manifest.json')
foreach($name in $files){Copy-Item -LiteralPath (Join-Path $OldPackage $name) -Destination (Join-Path $install $name)}
$compiler=Join-Path ([Environment]::GetFolderPath('Windows')) 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$refs=@('System.Core.dll','System.Security.dll','System.Web.Extensions.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll')|ForEach-Object{'/reference:'+$_}
$sources=@('desktop-update-policy.cs','desktop-update-install.cs','desktop-update-live.fixture.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
$preparer=Join-Path $root 'Prepare.exe'
& $compiler /nologo /target:winexe /platform:x64 ('/out:'+$preparer) $refs $sources
if($LASTEXITCODE -ne 0){throw 'Live fixture compile failed'}
$tokenFile=Join-Path $root 'transaction-path'
$args=@($install,[IO.Path]::GetFullPath($NewZip),[IO.Path]::GetFullPath($NewMetadata),$tokenFile)|ForEach-Object{'"'+$_+'"'}
$prepare=Start-Process -FilePath $preparer -ArgumentList $args -WindowStyle Hidden -PassThru
if(!$prepare.WaitForExit(15000)){throw 'Prepare timeout; no process forcibly stopped'}
if($prepare.ExitCode -ne 0){if(Test-Path ($tokenFile+'.error')){Get-Content ($tokenFile+'.error') -Encoding UTF8};throw ('Live preparation failed; retained '+$root)}
$tx=[IO.File]::ReadAllText($tokenFile)
$expectedTx=Join-Path $profile ('Sanctum/IRIS/Updates/'+[IO.Path]::GetFileName($tx))
if([IO.Path]::GetFullPath($expectedTx) -ne $tx){throw 'Unexpected transaction profile'}
Add-Type -Path ($sources|Select-Object -First 2) -ReferencedAssemblies @('System.Core','System.Security','System.Web.Extensions','System.IO.Compression','System.IO.Compression.FileSystem')
[IrisDesktop.DesktopUpdateInstall]::StartHelper($tx,$false)
$deadline=[DateTime]::UtcNow.AddSeconds(55)
$journal=$null
while([DateTime]::UtcNow -lt $deadline){
 try{$journal=Get-Content (Join-Path $tx 'transaction.json') -Raw|ConvertFrom-Json}catch{}
 if($journal.State -eq 'committed' -or $journal.State -eq 'rolled-back'){break}
 Start-Sleep -Milliseconds 200
}
if($journal.State -ne 'committed'){throw ('Actual native/WebView trial did not commit: '+$journal.State+'; retained '+$root)}
$ready=Get-Content (Join-Path $tx 'ready.json') -Raw|ConvertFrom-Json
$newVersion=(Get-Content $NewMetadata -Raw|ConvertFrom-Json).version
if($ready.version -ne $newVersion -or $ready.pid -ne $journal.NewPid){throw 'Ready identity mismatch'}
$app=Get-Process -Id $journal.NewPid
if($app.StartTime.ToUniversalTime().Ticks -ne $journal.NewTicks -or $app.MainModule.FileName -ne (Join-Path $install 'IRIS.exe')){throw 'Unknown process; not touching it'}
if(Test-Path -LiteralPath (Join-Path $install '.iris-update-pending')){throw 'Pending marker still exists'}
$newManifest=Get-Content (Join-Path $install 'manifest.json') -Raw|ConvertFrom-Json
foreach($entry in $newManifest.files){if((Get-FileHash -LiteralPath (Join-Path $install $entry.name) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256){throw 'Installed payload mismatch'}}
# This is exclusively our temporary, signed-by-identity child with an empty
# sandbox profile; never terminate a pre-existing IRIS or any game process.
$app.Kill();$app.WaitForExit(10000)|Out-Null
$after=ProtectedFingerprints
if($before.Count -ne $after.Count){throw 'Protected file inventory changed'}
foreach($key in $before.Keys){if($before[$key] -ne $after[$key]){throw 'Protected file changed'}}
if($OfflineIsolatedWebView -and !(Test-Path -LiteralPath (Join-Path $testProfile 'EBWebView'))){throw 'Fresh WebView data was not created'}
Write-Output 'PASS protected queue/settings file fingerprints unchanged; no login or live web page'
Write-Output ('PASS real release EXE + original helper + WebView readiness: '+(Get-Content (Join-Path $OldPackage 'manifest.json') -Raw|ConvertFrom-Json).version+' -> '+$ready.version)
Write-Output ('Trial outputs retained: '+$root)
