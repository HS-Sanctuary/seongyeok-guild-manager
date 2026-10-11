$ErrorActionPreference='Stop'
$root=Join-Path ([IO.Path]::GetTempPath()) ('iris-update-process-'+[guid]::NewGuid().ToString('N'))
[void](New-Item -ItemType Directory -Path $root)
$compiler=Join-Path ([Environment]::GetFolderPath('Windows')) 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$exe=Join-Path $root 'FixtureHarness.exe'
$refs=@('System.Core.dll','System.Security.dll','System.Web.Extensions.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll')|ForEach-Object{'/reference:'+$_}
$sources=@('desktop-update-policy.cs','desktop-update-install.cs','desktop-update-process.fixture.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
& $compiler /nologo /target:winexe /platform:x64 ('/out:'+$exe) $refs $sources
if($LASTEXITCODE -ne 0){throw 'Fixture compile failed'}
function RunFixture([string]$mode,[string]$arg){
 $process=Start-Process -FilePath $exe -ArgumentList @($mode,('"'+$arg+'"')) -WindowStyle Hidden -PassThru
 if(!$process.WaitForExit(15000)){throw 'Fixture process timeout (not forcibly terminated)'}
 if($process.ExitCode -ne 0){throw ('Fixture step failed: '+$mode)}
}
foreach($scenario in @('success','crash','recover')){
 $case=Join-Path $root $scenario;[void](New-Item -ItemType Directory -Path $case)
 RunFixture '--prepare' $case
 $token=[IO.File]::ReadAllText((Join-Path $case 'token'))
 $tx=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) ('Sanctum/IRIS/Updates/'+$token)
 $install=Join-Path $case 'installed'
 if($scenario -eq 'crash'){[IO.File]::WriteAllText((Join-Path $install 'fixture-crash'),'test')}
 if($scenario -eq 'recover'){RunFixture '--partial' $token;RunFixture '--recover' $token}else{RunFixture '--kick' $token}
 $deadline=[DateTime]::UtcNow.AddSeconds(15)
 while(!(Test-Path -LiteralPath (Join-Path $tx 'fixture-result')) -and [DateTime]::UtcNow -lt $deadline){Start-Sleep -Milliseconds 50}
 if(!(Test-Path -LiteralPath (Join-Path $tx 'fixture-result'))){throw 'Worker did not complete'}
 $journal=Get-Content (Join-Path $tx 'transaction.json') -Raw|ConvertFrom-Json
 $expected=if($scenario -eq 'success'){'committed'}else{'rolled-back'}
 if($journal.State -ne $expected){throw ('Wrong transaction result: '+$scenario+' '+$journal.State)}
 $marker=if($scenario -eq 'success'){'fixture-new-started'}else{'fixture-old-started'}
 while(!(Test-Path -LiteralPath (Join-Path $install $marker)) -and [DateTime]::UtcNow -lt $deadline){Start-Sleep -Milliseconds 50}
 if(!(Test-Path -LiteralPath (Join-Path $install $marker))){throw 'Expected app did not restart'}
 $readme=if($scenario -eq 'success'){'new README.txt'}else{'old README.txt'}
 if([IO.File]::ReadAllText((Join-Path $install 'README.txt')) -ne $readme){throw 'Replacement/restore mismatch'}
 if(Test-Path -LiteralPath (Join-Path $install '.iris-update-pending')){throw 'Pending marker was not cleared'}
 Write-Output ('PASS temporary process updater '+$scenario)
}
Write-Output ('Fixture outputs retained: '+$root)
