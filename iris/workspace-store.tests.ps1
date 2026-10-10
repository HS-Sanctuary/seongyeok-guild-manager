$ErrorActionPreference='Stop'
Add-Type -Path (Join-Path $PSScriptRoot 'desktop-store.cs') -ReferencedAssemblies @('System.Security','System.Web.Extensions','System.Core')
$probe=Join-Path (Split-Path $PSScriptRoot) ('.superpowers/sdd/2026-10-10-iris-workspace/store-'+[Guid]::NewGuid().ToString('N'))
$store=New-Object IrisDesktop.DesktopStore($probe,'development')
$entry=@{kind='workspace';environment='development';accountId='synthetic-account';characterId='A';itemKind='shop';itemId='1';field='count';scope='account';periodKey='2026-10-04T21:00:00.000Z';catalogKey=('a'*64);baseCompleted=2;desiredCompleted=9999;requestId='00000000-0000-4000-8000-000000000001';revision=1;deadlineAt=15000;phase='pending'}
$json=@{schemaVersion=3;entries=@($entry)}|ConvertTo-Json -Depth 8 -Compress
$store.Replace($json)
if(($store.Load()|ConvertFrom-Json).entries[0].desiredCompleted -ne 9999){throw 'Workspace intent lost'}
$entry.field='bookmark';$entry.baseCompleted=0;$entry.desiredCompleted=1
$store.Replace((@{schemaVersion=3;entries=@($entry)}|ConvertTo-Json -Depth 8 -Compress))
$entry.desiredCompleted=2
$rejected=$false;try{$store.Replace((@{schemaVersion=3;entries=@($entry)}|ConvertTo-Json -Depth 8 -Compress))}catch{$rejected=$true}
if(!$rejected){throw 'Bookmark outside boolean bounds accepted'}
Write-Output 'Workspace protected-store PASS'
