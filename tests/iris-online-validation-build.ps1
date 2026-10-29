param([switch]$PrepareGui,[string]$Owner)
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outRoot=Join-Path $repo '.superpowers/av'
[void](New-Item -ItemType Directory -Force $outRoot)
$out=Join-Path $outRoot ([guid]::NewGuid().ToString('N').Substring(0,8))
[void](New-Item -ItemType Directory -Path $out)
$src=Join-Path $out 'source';[void](New-Item -ItemType Directory -Path $src)
# Immutable operating baseline, read only. No merge/check-out/index mutation.
$baseline='ca697706a874d21668091588940ceb61338d0700'
$build=Get-Content (Join-Path $repo 'iris/build-beta.ps1') -Raw -Encoding UTF8
$match=[regex]::Match($build,'\$sources=@\((.*?)\)\|ForEach-Object',[Text.RegularExpressions.RegexOptions]::Singleline)
if(!$match.Success){throw 'Native build source list missing'}
$names=@([regex]::Matches($match.Groups[1].Value,"'([^']+\.cs)'")|ForEach-Object{$_.Groups[1].Value})
$names+=@('desktop-update-policy.cs','desktop-update-install.cs','desktop-release-files.cs')
foreach($name in $names){Copy-Item -LiteralPath (Join-Path $repo ('iris/'+$name)) -Destination (Join-Path $src $name)}
$overrides=@('iris/desktop-floating.cs','components/iris/DesktopFloatingHub.tsx','components/iris/DesktopIcons.tsx','lib/irisFloating.ts')
foreach($relative in $overrides){
 $content=& git -C $repo show ($baseline+':'+$relative)
 if($LASTEXITCODE -ne 0){throw '0.4.3 baseline unavailable'}
 $target=if($relative -eq 'iris/desktop-floating.cs'){Join-Path $src 'desktop-floating.cs'}else{Join-Path (Join-Path $out 'web-overrides') $relative}
 [void](New-Item -ItemType Directory -Force (Split-Path $target))
 [IO.File]::WriteAllText($target,($content -join [Environment]::NewLine),[Text.UTF8Encoding]::new($false))
}
# Fixture-only safety restrictions. Product sources are never patched.
$p=Join-Path $src 'desktop-floating-host.cs';$text=Get-Content $p -Raw -Encoding UTF8
$found=[regex]::Matches($text,'(?m)^  void RegisterFloatingHotkey\(\)\{[^\r\n]*\}')
if($found.Count -ne 1){throw 'Hotkey fixture guard target changed'}
$text=[regex]::Replace($text,'(?m)^  void RegisterFloatingHotkey\(\)\{[^\r\n]*\}','  void RegisterFloatingHotkey(){ /* fixture: no global hotkey */ }')
[IO.File]::WriteAllText($p,$text,[Text.UTF8Encoding]::new($false))
$p=Join-Path $src 'desktop-bridge.cs';$text=Get-Content $p -Raw -Encoding UTF8
$needle='switch (message["method"] as string) {'
if(!($text.Contains($needle))){throw 'Game deny fixture guard target changed'}
$text=$text.Replace($needle,'if ((message["method"] as string ?? "").StartsWith("game.", StringComparison.Ordinal)) throw new ArgumentException("fixture_game_denied"); '+$needle)
[IO.File]::WriteAllText($p,$text,[Text.UTF8Encoding]::new($false))
$p=Join-Path $src 'desktop-webview.cs';$text=Get-Content $p -Raw -Encoding UTF8
$text=$text.Replace('bridge.BindGameFocus(ReturnGameFocus);','bridge.BindGameFocus(()=>false);')
[IO.File]::WriteAllText($p,$text,[Text.UTF8Encoding]::new($false))
# Future-only isolation. Current entry still unconditionally blocks the GUI.
$text=$text.Replace('var core = Browser.CoreWebView2;',@"
var core = Browser.CoreWebView2;
            core.AddWebResourceRequestedFilter("*",Microsoft.Web.WebView2.Core.CoreWebView2WebResourceContext.All);
            core.WebResourceRequested+=(sender,e)=>{
                Uri uri;
                if(!Uri.TryCreate(e.Request.Uri,UriKind.Absolute,out uri)||uri.Scheme!="http"||uri.Host!="localhost"||uri.Port!=3000)
                    e.Response=core.Environment.CreateWebResourceResponse(new System.IO.MemoryStream(),403,"Fixture blocked","");
            };
"@)
$text=$text.Replace('System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(target.AbsoluteUri) { UseShellExecute = true });','throw new InvalidOperationException("fixture_external_window_blocked");')
[IO.File]::WriteAllText($p,$text,[Text.UTF8Encoding]::new($false))
# Fixture observes no real game window. All changes are in the copied sources.
$p=Join-Path $src 'desktop-addon.cs';$text=Get-Content $p -Raw -Encoding UTF8
$needle='window.TopMost=false; timer.Tick+=(s,e)=>Tick(); timer.Start();'
if(!$text.Contains($needle)){throw 'Fixture tracker guard target changed'}
$text=$text.Replace($needle,'window.TopMost=false; /* isolated fixture: no game tracker timer */')
$tickPattern='(?s)        void Tick\(\) \{.*?(?=        void ApplyPlacement\()'
if([regex]::Matches($text,$tickPattern).Count -ne 1){throw 'Fixture tracker callback guard target changed'}
$text=[regex]::Replace($text,$tickPattern,'        void Tick() { /* fixture: no game observation from any callback */ }'+[Environment]::NewLine)
[IO.File]::WriteAllText($p,$text,[Text.UTF8Encoding]::new($false))
$version=Join-Path $src 'validation-version.cs'
[IO.File]::WriteAllText($version,'namespace IrisDesktop { internal static class DesktopNativeVersion { public const string Value="0.4.3"; } }',[Text.UTF8Encoding]::new($false))
$entry=Join-Path $repo 'tests/fixtures/desktop-online-validation.entry.cs'
if($PrepareGui){$parsedOwner=[guid]::Empty;if(![guid]::TryParse($Owner,[ref]$parsedOwner)){throw 'Owned GUI requires an explicit synthetic owner GUID'};$entry=Join-Path $repo 'tests/fixtures/desktop-online-live-validation.entry.cs'}
$sdk=Join-Path $repo 'iris/vendor/webview2/1.0.4258.31'
$core=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'
$forms=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'
$loader=Join-Path $sdk 'runtimes/win-x64/native/WebView2Loader.dll'
$compiler=Join-Path ([Environment]::GetFolderPath('Windows')) 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$refs=@($core,$forms,'System.Windows.Forms.dll','System.Drawing.dll','System.Core.dll','System.Security.dll','System.Web.Extensions.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll')|ForEach-Object{'/reference:'+$_}
$sources=@($names|ForEach-Object{Join-Path $src $_})+@($version,$entry)
$exe=Join-Path $out 'IRIS-ASTRA-validation.exe'
$log=& $compiler /nologo /target:exe /main:IrisDesktop.OnlineValidationEntry /platform:x64 /optimize+ /codepage:65001 ('/out:'+$exe) $refs $sources 2>&1
if($LASTEXITCODE -ne 0){$log|Set-Content -Encoding UTF8 (Join-Path $out 'compile.log');throw 'Isolated validation compile failed'}
Copy-Item $core,$forms,$loader -Destination $out
$owner=if($PrepareGui){$Owner}else{[guid]::NewGuid().ToString()};$profile=Join-Path (Join-Path $out 'profiles') $owner
[void](New-Item -ItemType Directory -Path $profile)
[IO.File]::WriteAllText((Join-Path $profile 'fixture-owner.txt'),$owner,[Text.UTF8Encoding]::new($false))
# Verify accidental/default invocation is harmless. It cannot create a WebView.
$result=& $exe --preflight
if($LASTEXITCODE -ne 2 -or $result -notmatch 'NOT_RUN'){throw 'Validation entry did not fail closed'}
$validRootResult=& $exe --test-root $profile
if($LASTEXITCODE -ne 2 -or $validRootResult -notmatch 'compile-only'){throw 'GUI gate was bypassed by a valid root'}
[void](New-Item -ItemType Directory -Force (Join-Path $repo '.superpowers/astra-online-validation'))
[pscustomobject]@{status=if($PrepareGui){'OWNED_GUI_SELFTEST_PREPARED'}else{'COMPILE_ONLY_GUI_BLOCKED'};baseline=$baseline;exe=$exe;testRoot=$profile;defaultLaunch='blocked';gameBridge='denied';globalHotkeys='disabled';webOverrideStatus=if($PrepareGui){'served_by_owned_fixture_bundler'}else{'staged_not_served'};database=if($PrepareGui){'runtime_owned_api_required'}else{'unavailable'};webOverrides=Join-Path $out 'web-overrides'} |
 ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $repo '.superpowers/astra-online-validation/test-build.json')
Write-Output 'PASS isolated IRIS compile + default launch denial. Explicit owned GUI requires separate API/database/owner selftest checks.'
