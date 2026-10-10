param([string]$OutputRoot=(Join-Path $PSScriptRoot '../build/iris-beta'),[switch]$PrepareDownload)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=[IO.Path]::GetFullPath($OutputRoot)
$release=Join-Path $root ('IRIS-beta-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N').Substring(0,8))
[void](New-Item -ItemType Directory -Path $release)
$sdk=Join-Path $PSScriptRoot 'vendor/webview2/1.0.4258.31'
$logo=Join-Path $PSScriptRoot '../public/IRIS/logo/IRIS logo.png'
$iconPath=Join-Path $release 'IRIS.ico'
# Format conversion only: preserve the entire supplied PNG inside a square at
# every Windows icon size. No cropping, background edits or new artwork.
$source=[Drawing.Image]::FromFile([IO.Path]::GetFullPath($logo))
$frames=New-Object 'Collections.Generic.List[byte[]]'
$sizes=@(16,24,32,48,64,128,256)
try{
 foreach($size in $sizes){
  $bitmap=New-Object Drawing.Bitmap($size,$size)
  $graphics=[Drawing.Graphics]::FromImage($bitmap)
  $stream=New-Object IO.MemoryStream
  try{
   $graphics.Clear([Drawing.Color]::Transparent)
   $graphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
   $scale=[Math]::Min($size/$source.Width,$size/$source.Height)
   $width=[int][Math]::Round($source.Width*$scale);$height=[int][Math]::Round($source.Height*$scale)
   $graphics.DrawImage($source,[int](($size-$width)/2),[int](($size-$height)/2),$width,$height)
   $bitmap.Save($stream,[Drawing.Imaging.ImageFormat]::Png);$frames.Add($stream.ToArray())
  }finally{$stream.Dispose();$graphics.Dispose();$bitmap.Dispose()}
 }
}finally{$source.Dispose()}
$file=[IO.File]::Create($iconPath);$writer=New-Object IO.BinaryWriter($file)
try{
 $writer.Write([uint16]0);$writer.Write([uint16]1);$writer.Write([uint16]$sizes.Count)
 $offset=6+16*$sizes.Count
 for($i=0;$i -lt $sizes.Count;$i++){
  $dimension=if($sizes[$i] -eq 256){0}else{$sizes[$i]}
  $writer.Write([byte]$dimension);$writer.Write([byte]$dimension);$writer.Write([byte]0);$writer.Write([byte]0)
  $writer.Write([uint16]1);$writer.Write([uint16]32);$writer.Write([uint32]$frames[$i].Length);$writer.Write([uint32]$offset)
  $offset+=$frames[$i].Length
 }
 foreach($frame in $frames){$writer.Write([byte[]]$frame)}
}finally{$writer.Dispose();$file.Dispose()}
$core=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'
$forms=Join-Path $sdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'
$loader=Join-Path $sdk 'runtimes/win-x64/native/WebView2Loader.dll'
$compiler=Join-Path ([Environment]::GetFolderPath('Windows')) 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
foreach($path in @($core,$forms,$loader,$compiler)){if(!(Test-Path -LiteralPath $path)){throw ('Missing required local build dependency: '+$path)}}
$sources=@('overlay-native.cs','desktop-overlay.cs','desktop-addon-policy.cs','desktop-addon.cs','desktop-host.cs','desktop-store.cs','desktop-bridge.cs','desktop-lifecycle.cs','desktop-webview.cs','desktop-release.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
$exe=Join-Path $release 'IRIS.exe'
$refs=@($core,$forms,'System.Windows.Forms.dll','System.Drawing.dll','System.Core.dll','System.Security.dll','System.Web.Extensions.dll')|ForEach-Object{'/reference:'+$_}
$compileOutput=& $compiler /nologo /target:winexe /platform:x64 /optimize+ /codepage:65001 ('/win32icon:'+$iconPath) ('/out:'+$exe) $refs $sources 2>&1
if($LASTEXITCODE -ne 0){throw ($compileOutput|Out-String)}
foreach($path in @($core,$forms,$loader)){Copy-Item -LiteralPath $path -Destination $release}
Copy-Item -LiteralPath (Join-Path $sdk 'LICENSE.txt') -Destination (Join-Path $release 'LICENSE.WebView2.txt')
Copy-Item -LiteralPath (Join-Path $sdk 'NOTICE.txt') -Destination (Join-Path $release 'NOTICE.WebView2.txt')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'BETA_README.txt') -Destination (Join-Path $release 'README.txt')
$entries=@(Get-ChildItem -LiteralPath $release -File|Sort-Object Name|ForEach-Object{@{name=$_.Name;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()}})
$manifest=@{product='IRIS for SANCTUM';channel='beta-candidate';architecture='win-x64';createdAtUtc=[DateTime]::UtcNow.ToString('o');signature='unsigned';webOrigin='https://sanctum-tawny-three.vercel.app';files=$entries}
[IO.File]::WriteAllText((Join-Path $release 'manifest.json'),($manifest|ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))
$zip=$release+'.zip'
[IO.Compression.ZipFile]::CreateFromDirectory($release,$zip,[IO.Compression.CompressionLevel]::Optimal,$false)
if($PrepareDownload){
 $public=Join-Path $PSScriptRoot '../public/IRIS/downloads'
 [void](New-Item -ItemType Directory -Path $public -Force)
 Copy-Item -LiteralPath $zip -Destination (Join-Path $public 'IRIS-beta.zip')
 Copy-Item -LiteralPath $iconPath -Destination (Join-Path $PSScriptRoot '../public/IRIS/logo/IRIS.ico')
 $download=@{channel='beta-candidate';architecture='win-x64';signature='unsigned';createdAtUtc=$manifest.createdAtUtc;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash.ToLowerInvariant();sizeBytes=(Get-Item -LiteralPath $zip).Length}
 [IO.File]::WriteAllText((Join-Path $public 'download.json'),($download|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
}
[pscustomobject]@{Directory=$release;Zip=$zip;Sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash.ToLowerInvariant()}
