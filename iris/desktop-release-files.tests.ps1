$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot 'desktop-release-files.cs'
if(!(Test-Path -LiteralPath $source)){throw 'Missing compatibility-safe visible icon naming'}
Add-Type -Path $source
$trial=Join-Path ([IO.Path]::GetTempPath()) ('iris-icon-name-'+[guid]::NewGuid().ToString('N'))
[void](New-Item -ItemType Directory -Path $trial)
$friendlyName=[regex]::Unescape('\uC544\uC774\uB9AC\uC2A4 \uB85C\uACE0.ico')
$legacy=Join-Path $trial 'IRIS.ico';$visible=Join-Path $trial $friendlyName
[IO.File]::WriteAllBytes($legacy,[byte[]](1,2,3,4))
$before=(Get-FileHash -LiteralPath $legacy -Algorithm SHA256).Hash
if(![IrisDesktop.DesktopReleaseFiles]::EnsureIconName($trial)){throw 'Could not prepare visible icon name'}
if(!(Test-Path -LiteralPath $visible)){throw 'Missing distinguishable icon file'}
if((Get-FileHash -LiteralPath $visible -Algorithm SHA256).Hash -ne $before -or (Get-FileHash -LiteralPath $legacy -Algorithm SHA256).Hash -ne $before){throw 'Icon bytes changed'}
if(!([IO.File]::GetAttributes($legacy) -band [IO.FileAttributes]::Hidden)){throw 'Compatibility file must be hidden'}
if([IO.File]::GetAttributes($visible) -band [IO.FileAttributes]::Hidden){throw 'Named icon must be visible'}
if(![IrisDesktop.DesktopReleaseFiles]::EnsureIconName($trial)){throw 'Naming must be idempotent'}
$conflict=Join-Path $trial 'conflict';[void](New-Item -ItemType Directory -Path $conflict)
[IO.File]::WriteAllBytes((Join-Path $conflict 'IRIS.ico'),[byte[]](1,2))
$personal=Join-Path $conflict $friendlyName;[IO.File]::WriteAllBytes($personal,[byte[]](9,8))
if([IrisDesktop.DesktopReleaseFiles]::EnsureIconName($conflict)){throw 'Unowned conflicting file must not be replaced'}
if([IO.File]::ReadAllBytes($personal)[0] -ne 9){throw 'Personal file overwritten'}
if([IO.File]::GetAttributes((Join-Path $conflict 'IRIS.ico')) -band [IO.FileAttributes]::Hidden){throw 'Do not hide the only usable icon on conflict'}
if([IrisDesktop.DesktopReleaseFiles]::EnsureIconName((Join-Path $trial 'missing'))){throw 'Missing installation must fail softly'}
Write-Output 'PASS distinguishable visible icon, hidden compatibility icon, unchanged hashes, idempotence and conflicting personal file preservation'
