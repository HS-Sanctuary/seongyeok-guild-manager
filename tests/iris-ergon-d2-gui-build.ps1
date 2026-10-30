param([Parameter(Mandatory=$true)][string]$Owner,[Parameter(Mandatory=$true)][string]$Manifest,[string]$Sdk)
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$info=& node (Join-Path $repo 'tests/ergon-d2-gui-source.mjs') $Owner | ConvertFrom-Json
if($LASTEXITCODE -ne 0){throw 'D2 source preparation failed'}
if(!$Sdk){$Sdk=Join-Path $repo 'iris/vendor/webview2/1.0.4258.31'}
$core=Join-Path $Sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll';$forms=Join-Path $Sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll';$loader=Join-Path $Sdk 'runtimes/win-x64/native/WebView2Loader.dll'
$compiler=Join-Path ([Environment]::GetFolderPath('Windows')) 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
foreach($required in @($core,$forms,$loader,$compiler)){if(!(Test-Path -LiteralPath $required)){throw 'Missing existing compiler/SDK; installation forbidden'}}
$refs=@($core,$forms,'System.Windows.Forms.dll','System.Drawing.dll','System.Core.dll','System.Security.dll','System.Web.Extensions.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll')|ForEach-Object{'/reference:'+$_}
$sources=@($info.names|ForEach-Object{Join-Path $info.src $_})+@((Join-Path $info.src 'validation-version.cs'),(Join-Path $repo 'tests/fixtures/desktop-ergon-d2.entry.cs'))
$exe=Join-Path $info.out 'IRIS-ERGON-D2-owned-fixture.exe'
$output=& $compiler /nologo /target:exe /main:IrisDesktop.D2GuiEntry /platform:x64 /optimize+ /codepage:65001 ('/out:'+$exe) $refs $sources 2>&1
$output|Set-Content -Encoding UTF8 (Join-Path $info.out 'compile.log')
if($LASTEXITCODE -ne 0){throw ($output|Out-String)}
$hashes=@();foreach($path in @($core,$forms,$loader)){Copy-Item -LiteralPath $path -Destination $info.out;$copy=Join-Path $info.out ([IO.Path]::GetFileName($path));$before=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash;$after=(Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash;if($before -ne $after){throw 'SDK copy hash mismatch'};$hashes+=@{file=[IO.Path]::GetFileName($path);sha256=$before}}
$denied=& $exe --preflight;if($LASTEXITCODE -ne 2 -or $denied -notmatch 'NOT_RUN'){throw 'default invocation bypassed owner gate'}
$denied=& $exe --test-root $info.profile;if($LASTEXITCODE -ne 2){throw 'profile-only invocation bypassed owner gate'}
$denied=& $exe --test-root $info.profile --owned-gui --manual-testing;if($LASTEXITCODE -ne 2){throw 'missing owned localhost server bypassed preflight'}
$readme=@"
D2 OWNED GUI ONLY. Never point at user data. Source manifest: $($info.out)/source-manifest.json
1. Start server from repository cwd: node tests/ergon-d2-gui.fixture.mjs `"$($info.out)/source-manifest.json`"
2. Start owned native form: & `"$exe`" --test-root `"$($info.profile)`" --owned-gui --manual-testing
3. Actual DesktopPage loads synthetic account A. Select 합성A캐릭터, open ERGON, then enter 35/저장 and operate actual Windows 확인/취소/X manually. Add20 then correct first35 to30 for manual50/remain50. Product public ERGON and executionConnected remain false.
4. Product prompts expire after real120s. Wait on actual prompt before approving. No automated approval.
5. Faults: POST localhost:3000/__d2/control with X-D2-Owner:$Owner and JSON {`"dropAck`":true,`"readFail`":true,`"epochOffset`":0}. Same controls can be written to own profile/control.json. dropAck happens after real RequestAsync, readFail blocks actual load replies. Reset with {}. epochOffset:1 while prompt open produces actual actor document drift. Controls never execute UI.
6. Observe profile/actual-read.json (real store projection), stages.txt; native/server PIDs and source hashes in manifests. Exercise dirty menu/close/character/floating/sidebar by clicking GUI. No sleep/realgame/CLI/updater/externalHTTP/profile access is authorized. Closing owned GUI and server is tester responsibility.
"@
[IO.File]::WriteAllText((Join-Path $info.out 'MANUAL.txt'),$readme,[Text.UTF8Encoding]::new($false))
$manifestData=@{exe=$exe;profile=$info.profile;owner=$Owner;out=$info.out;baseline=$info.baseline;sourceManifest=(Join-Path $info.out 'source-manifest.json');sdk=$hashes;status='COMPILED_PREFLIGHT_DENIED_GUI_NOT_RUN';manual=(Join-Path $info.out 'MANUAL.txt')}
[IO.File]::WriteAllText([IO.Path]::GetFullPath($Manifest),($manifestData|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
Write-Output 'PASS D2 compile + default/profile/missing-owner-server denial; actual GUI NOT RUN'
