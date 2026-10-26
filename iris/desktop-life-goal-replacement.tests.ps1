param([ValidateSet('Parent','Race')][string]$Mode='Parent',[string]$Root,[int]$Target=70)
$ErrorActionPreference='Stop'
$replacementBase=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.superpowers/goal-replacement-native'))
if($Mode-eq'Parent'){$Root=Join-Path $replacementBase ([guid]::NewGuid().ToString('N'))}
$Root=[IO.Path]::GetFullPath($Root)
if(-not $Root.StartsWith($replacementBase+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Synthetic root required'}
$cursor=$Root
while($cursor){if((Test-Path -LiteralPath $cursor)-and((Get-Item -LiteralPath $cursor -Force).Attributes-band[IO.FileAttributes]::ReparsePoint)){throw 'Synthetic path cannot cross reparse point'};$cursor=[IO.Path]::GetDirectoryName($cursor)}
if($Mode-eq'Race'-and-not(Test-Path -LiteralPath (Join-Path $Root 'owner.test'))){throw 'Owned synthetic root required'}
Add-Type -Path @((Join-Path $PSScriptRoot 'desktop-life-progress.cs'),(Join-Path $PSScriptRoot 'desktop-life-goal-replacement.fixture.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security')
if($Mode-eq'Race'){[IrisDesktop.GoalReplacementFixture]::Race($Root,$Target);exit}
[IrisDesktop.GoalReplacementFixture]::Run($Root)
[IrisDesktop.GoalReplacementFixture]::Faults($Root)
[IrisDesktop.GoalReplacementFixture]::LineageBinding($Root)
[IrisDesktop.GoalReplacementFixture]::Lineage($Root)
$race=Join-Path $Root 'race';New-Item -ItemType Directory -Path $race -Force | Out-Null;Set-Content -LiteralPath (Join-Path $race 'owner.test') -Value 'synthetic';[IrisDesktop.GoalReplacementFixture]::SeedRace($race)
$processes=@();foreach($quantity in @(70,60)){$args=@('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$PSCommandPath+'"'),'-Mode','Race','-Root',('"'+$race+'"'),'-Target',$quantity);$processes+=Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $race "$quantity.out") -RedirectStandardError (Join-Path $race "$quantity.err")}
foreach($process in $processes){$process.WaitForExit();if($null-ne$process.ExitCode-and$process.ExitCode-ne0){throw 'Synthetic race child failed'}}
$states=@(Get-Content (Join-Path $race '70.out');Get-Content (Join-Path $race '60.out'));if(@($states|Where-Object{$_-eq'committed'}).Count-ne1-or@($states|Where-Object{$_-eq'conflict'}).Count-ne1){throw 'Expected exactly one winner and one conflict'}
[IrisDesktop.GoalReplacementFixture]::CheckRace($race)
