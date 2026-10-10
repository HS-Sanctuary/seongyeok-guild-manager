param([string]$OutputRoot)
$ErrorActionPreference='Stop'
if(!$OutputRoot){$OutputRoot=Join-Path ([IO.Path]::GetTempPath()) ('iris-release-test-'+[guid]::NewGuid().ToString('N'))}
$build=Join-Path $PSScriptRoot 'build-beta.ps1'
if(!(Test-Path -LiteralPath $build)){throw 'Missing release builder: package must include a production executable and only redistributable files'}
$result=& $build -OutputRoot $OutputRoot
$zip=$result.Zip
if(!(Test-Path -LiteralPath $zip)){throw 'No downloadable archive'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead($zip)
try{
 $names=@($archive.Entries|ForEach-Object{$_.FullName})
 foreach($file in @('IRIS.exe','IRIS.ico','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll','README.txt','LICENSE.WebView2.txt','NOTICE.WebView2.txt','manifest.json')){if($names -notcontains $file){throw ('Missing package file: '+$file)}}
 if($names.Count -ne 9){throw 'Package allowlist violated'}
 if(@($names|Where-Object{$_ -match 'env|profile|queue|CLI|node_modules|\.ps1$|\.cs$'}).Count){throw 'Private or source/development files leaked'}
}finally{$archive.Dispose()}
$manifest=Get-Content (Join-Path $result.Directory 'manifest.json') -Raw|ConvertFrom-Json
foreach($file in $manifest.files){if((Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $result.Directory $file.name)).Hash.ToLowerInvariant() -ne $file.sha256){throw 'Manifest integrity mismatch'}}
$bytes=[IO.File]::ReadAllBytes((Join-Path $result.Directory 'IRIS.ico'))
if([BitConverter]::ToUInt16($bytes,2) -ne 1 -or [BitConverter]::ToUInt16($bytes,4) -ne 7){throw 'Icon must have seven sizes'}
if((Get-AuthenticodeSignature (Join-Path $result.Directory 'IRIS.exe')).Status -ne 'NotSigned'){throw 'Expected unsigned beta candidate; signing status must be reported'}
Write-Output ('PASS release allowlist, icon, manifest hashes and unsigned beta state: '+$zip)
