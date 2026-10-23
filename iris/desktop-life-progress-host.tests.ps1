param([string]$CaseID='')
$ErrorActionPreference='Stop'
$taskRoot=Join-Path $PSScriptRoot ('../.superpowers/b2-host/'+[guid]::NewGuid().ToString('N').Substring(0,12))
$taskSources=@('desktop-life-journal.cs','desktop-life-policy.cs','desktop-life-executor.cs','desktop-life-automation.cs','desktop-life-reconciliation.cs','desktop-cli-activity.cs','desktop-life-progress.cs','desktop-life-progress-coordinator.cs','desktop-life-progress-host.fixture.cs')
if(Test-Path (Join-Path $PSScriptRoot 'desktop-life-progress-connection.cs')){$taskSources+='desktop-life-progress-connection.cs'}
if(Test-Path (Join-Path $PSScriptRoot 'desktop-life-progress-approval.cs')){$taskSources+='desktop-life-progress-approval.cs'}
Add-Type -Path @($taskSources|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies @('System.Core','System.Web.Extensions','System.Security','System.Windows.Forms','System.Drawing')
if($CaseID -eq 'review'){[IrisDesktop.ProgressHostFixture]::Review([IO.Path]::GetFullPath($taskRoot)).GetAwaiter().GetResult()}else{[IrisDesktop.ProgressHostFixture]::Run([IO.Path]::GetFullPath($taskRoot)).GetAwaiter().GetResult()}
