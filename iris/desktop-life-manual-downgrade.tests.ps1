param([Parameter(Mandatory=$true)][string]$Root)
$ErrorActionPreference='Stop'
$base=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/d2')).TrimEnd('\')+'\'
if(![IO.Path]::GetFullPath($Root).StartsWith($base,[StringComparison]::OrdinalIgnoreCase)){throw 'owned synthetic root required'}
$scratch=Join-Path $Root 'old-reader'
[void][IO.Directory]::CreateDirectory($scratch)
$original=& git show '2b451846c62661bccbfa64bc8260a64ac2015378:iris/desktop-life-progress.cs'
if($LASTEXITCODE -ne 0){throw 'fixed pre-D2 reader unavailable'}
[IO.File]::WriteAllText((Join-Path $scratch 'progress.cs'),($original -join "`n"),[Text.UTF8Encoding]::new($false))
$probe=@'
using System;using System.IO;using System.Linq;
namespace IrisDesktop { public static class ManualDowngradeFixture {
 public static void Run(string root,string golden){
  var old=ProgressDomain.Serializer().Deserialize<ProgressDocument>(File.ReadAllText(golden));ProgressDomain.Validate(old,"development");if(old.goals[0].action!="crafting"||old.attempts[0].confirmations[0].quantity!=3)throw new Exception("fixed golden mismatch");
  var store=new DesktopErgonProgressStore(root,"development");var before=File.ReadAllBytes(store.FilePath);var scope=new ProgressScope{environment="development",accountId="synthetic-account",characterId="synthetic-character"};var result=store.Load(scope);
  if(result.health=="ok"||!before.SequenceEqual(File.ReadAllBytes(store.FilePath)))throw new Exception("old reader accepted/changed new audit");
  Console.WriteLine("PASS D2V01 fixed old-v1 golden accepted; actual new-event DPAPI blocked without rewrite");
 }
}}
'@
[IO.File]::WriteAllText((Join-Path $scratch 'probe.cs'),$probe,[Text.UTF8Encoding]::new($false))
Add-Type -Path @((Join-Path $scratch 'progress.cs'),(Join-Path $scratch 'probe.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
[IrisDesktop.ManualDowngradeFixture]::Run([IO.Path]::GetFullPath($Root),(Join-Path $PSScriptRoot '../tests/fixtures/ergon-progress-v1-before-d2.json'))
