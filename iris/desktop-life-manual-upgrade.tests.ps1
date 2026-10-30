param([string]$Root='', [string]$Stage='all')
$ErrorActionPreference='Stop'
$base=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/d2'))
if(!$Root){$Root=Join-Path $base ([guid]::NewGuid().ToString('N'))}
$Root=[IO.Path]::GetFullPath($Root)
if(!$Root.StartsWith($base+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'owned synthetic root required'}
$cursor=$Root
while($cursor){if((Test-Path -LiteralPath $cursor) -and ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Synthetic root cannot cross reparse points'};$cursor=[IO.Path]::GetDirectoryName($cursor)}
[void][IO.Directory]::CreateDirectory($Root)
$oldRevision='2b451846c62661bccbfa64bc8260a64ac2015378'
$mainRevision='ca697706'
function Export-Source([string]$revision,[string]$name,[string]$target){
 $content=& git show ($revision+':iris/'+$name)
 if($LASTEXITCODE -ne 0){throw ('fixed source unavailable: '+$name)}
 [IO.File]::WriteAllText($target,($content -join "`n"),[Text.UTF8Encoding]::new($false))
}
if($Stage -ne 'all'){
 $sources=Join-Path $Root 'sources'
 if(!(Test-Path -LiteralPath $sources)){throw 'prepared synthetic sources required'}
 $progress=if($Stage -eq 'seed-old' -or $Stage -eq 'reject-old' -or $Stage -eq 'probe-old-recover'){Join-Path $sources 'old-progress.cs'}else{Join-Path $PSScriptRoot 'desktop-life-progress.cs'}
 Add-Type -AssemblyName System.IO.Compression
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 Add-Type -Path @($progress,(Join-Path $sources 'main-update-policy.cs'),(Join-Path $PSScriptRoot 'desktop-life-manual-upgrade.fixture.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security','System.IO.Compression','System.IO.Compression.FileSystem')
 [IrisDesktop.ManualWoodUpgradeFixture]::Run($Root,$Stage,(Join-Path $PSScriptRoot '../tests/fixtures/ergon-progress-v1-before-d2.json'))
 exit
}
$sources=Join-Path $Root 'sources'
[void][IO.Directory]::CreateDirectory($sources)
Export-Source $oldRevision 'desktop-life-progress.cs' (Join-Path $sources 'old-progress.cs')
Export-Source $mainRevision 'desktop-update-policy.cs' (Join-Path $sources 'main-update-policy.cs')
$log=Join-Path $Root 'results.log'
function Run-Stage([string]$path,[string]$mode){
 $prior=$ErrorActionPreference
 $ErrorActionPreference='Continue'
 try{$output=& powershell.exe -NoProfile -File $PSCommandPath -Root $path -Stage $mode 2>&1;$code=$LASTEXITCODE}finally{$ErrorActionPreference=$prior}
 [IO.File]::AppendAllText($log,($output|Out-String))
 if($code -ne 0){throw ('stage failed: '+$mode+"`n"+($output|Out-String))}
 $output|Write-Output
}
Run-Stage $Root 'seed-old'
Run-Stage $Root 'append-new'
Run-Stage $Root 'reject-old'
Run-Stage $Root 'update-failure'
$recover=Join-Path $Root 'explicit-old-recover'
[void][IO.Directory]::CreateDirectory($recover)
foreach($name in @('development','sources','goal.txt','plan.txt','receipt.txt','operation.txt','interruption-operation.txt','old-document.json')){Copy-Item -LiteralPath (Join-Path $Root $name) -Destination $recover -Recurse}
Run-Stage $recover 'probe-old-recover'
foreach($mode in @('before','after','ack')){
 $trial=Join-Path $Root ('crash-'+$mode)
 [void][IO.Directory]::CreateDirectory($trial)
 # Copy only this fixture's own synthetic artifacts; never a real profile.
 foreach($name in @('development','sources','goal.txt','plan.txt','receipt.txt','operation.txt','interruption-operation.txt','old-document.json')){Copy-Item -LiteralPath (Join-Path $Root $name) -Destination $trial -Recurse}
 $process=Start-Process powershell.exe -ArgumentList @('-NoProfile','-File',('"'+$PSCommandPath+'"'),'-Root',('"'+$trial+'"'),'-Stage',('stop-'+$mode)) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $trial 'child.stdout.log') -RedirectStandardError (Join-Path $trial 'child.stderr.log')
 try{
  $deadline=[DateTime]::UtcNow.AddSeconds(30)
  while(!(Test-Path -LiteralPath (Join-Path $trial 'ready.txt'))){if($process.HasExited){throw ('stop child exited: '+(Get-Content -LiteralPath (Join-Path $trial 'child.stderr.log') -Raw))};if([DateTime]::UtcNow -gt $deadline){throw 'stop marker timeout'};Start-Sleep -Milliseconds 100}
 }finally{if(!$process.HasExited){Stop-Process -Id $process.Id -Force};$process.WaitForExit();$process.Dispose()}
 Run-Stage $trial ('check-'+$mode)
}
Run-Stage $Root 'restore-new'
Run-Stage $Root 'restore-history'
function Source-Hash([string]$name){$hash=[Security.Cryptography.SHA256]::Create();try{return [BitConverter]::ToString($hash.ComputeHash([IO.File]::ReadAllBytes((Join-Path $PSScriptRoot ('../'+$name))))).Replace('-','').ToLowerInvariant()}finally{$hash.Dispose()}}
[IO.File]::WriteAllText((Join-Path $Root 'source-hashes.json'),((@('iris/desktop-life-progress.cs','iris/desktop-life-manual-upgrade.fixture.cs','iris/desktop-life-manual-upgrade.tests.ps1','tests/fixtures/ergon-progress-v1-before-d2.json')|ForEach-Object{[pscustomobject]@{file=$_;sha256=(Source-Hash $_)}})|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Write-Output 'PASS D2U observation sequence complete; explicit old Recover remains a documented downgrade limitation; raw evidence retained under ignored .superpowers/d2'
