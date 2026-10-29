param([Parameter(Mandatory=$true)][string]$Owner,[Parameter(Mandatory=$true)][string]$Manifest,[string]$Sdk)
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$info=& node (Join-Path $repo 'tests/iris-online-043-source.mjs') $Owner | ConvertFrom-Json
if($LASTEXITCODE -ne 0){throw '043 source preparation failed'}
if(!$Sdk){$Sdk=Join-Path $repo 'iris/vendor/webview2/1.0.4258.31'}
$core=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll';$forms=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll';$loader=Join-Path $sdk 'runtimes/win-x64/native/WebView2Loader.dll'
$compiler=Join-Path ([Environment]::GetFolderPath('Windows')) 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
foreach($required in @($core,$forms,$loader,$compiler)){if(!(Test-Path -LiteralPath $required)){throw 'Missing local compiler or WebView SDK; no installation attempted'}}
$refs=@($core,$forms,'System.Windows.Forms.dll','System.Drawing.dll','System.Core.dll','System.Security.dll','System.Web.Extensions.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll')|ForEach-Object{'/reference:'+$_}
$sources=@($info.names|ForEach-Object{Join-Path $info.src $_})+@((Join-Path $info.src 'validation-version.cs'),(Join-Path $repo 'tests/fixtures/desktop-online-043.entry.cs'))
$exe=Join-Path $info.out 'IRIS-ASTRA-043-fixture.exe'
$output=& $compiler /nologo /target:exe /main:IrisDesktop.Online043Entry /platform:x64 /optimize+ /codepage:65001 ('/out:'+$exe) $refs $sources 2>&1
if($LASTEXITCODE -ne 0){$output|Set-Content -Encoding UTF8 (Join-Path $info.out 'compile.log');throw ($output|Out-String)}
Copy-Item -LiteralPath $core,$forms,$loader -Destination $info.out
$denied=& $exe --preflight
if($LASTEXITCODE -ne 2 -or $denied -notmatch 'NOT_RUN'){throw 'Default invocation failed to close'}
$validRoot=& $exe --test-root $info.profile
if($LASTEXITCODE -ne 2){throw 'Profile-only invocation bypassed owner gate'}
[IO.File]::WriteAllText([IO.Path]::GetFullPath($Manifest),(@{exe=$exe;profile=$info.profile;owner=$Owner;out=$info.out;baseline=$info.baseline;status='OWNED_043_FULL_UI_PREPARED'}|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Write-Output 'PASS 043 fixture compile + default/profile-only denial'
