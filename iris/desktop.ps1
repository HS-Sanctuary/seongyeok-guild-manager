param([switch]$Development)
# Optional candidate only. Existing overlay/default launcher remains unchanged until manual acceptance.
$ErrorActionPreference='Stop'
if([Threading.Thread]::CurrentThread.ApartmentState -ne 'STA'){throw 'Run with powershell -NoProfile -STA -File iris/desktop.ps1 -Development'}
Add-Type -AssemblyName System.Windows.Forms
$irisLegacyOverlay=Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe' OR Name = 'pwsh.exe'" | Where-Object {$_.ProcessId -ne $PID -and $_.CommandLine -match 'overlay\.ps1'} | Select-Object -First 1
if($irisLegacyOverlay){[void][System.Windows.Forms.MessageBox]::Show('기존 IRIS의 종료 버튼을 먼저 눌러 주세요. 이전 체크보드와 새 앱을 동시에 저장 연결하지 않아요.','SANCTUM IRIS');exit 1}
$irisDesktopEnvironment=if($Development){'development'}else{'production'}
$irisDesktopSdk=Join-Path $PSScriptRoot 'vendor/webview2/1.0.4258.31'
$irisDesktopCore=Join-Path $irisDesktopSdk 'lib/net462/Microsoft.Web.WebView2.Core.dll'
$irisDesktopForms=Join-Path $irisDesktopSdk 'lib/net462/Microsoft.Web.WebView2.WinForms.dll'
if(!(Test-Path $irisDesktopCore)){throw 'Approved project-local WebView2 SDK is required. No automatic installation.'}
[void][Reflection.Assembly]::LoadFrom($irisDesktopCore)
[void][Reflection.Assembly]::LoadFrom($irisDesktopForms)
$irisDesktopReferences=@($irisDesktopCore,$irisDesktopForms,'System.Windows.Forms','System.Drawing','System.Core','System.Security','System.Web.Extensions')
Add-Type -Path @('overlay-native.cs','desktop-overlay.cs','desktop-host.cs','desktop-store.cs','desktop-bridge.cs','desktop-lifecycle.cs','desktop-webview.cs'|ForEach-Object{Join-Path $PSScriptRoot $_}) -ReferencedAssemblies $irisDesktopReferences
$irisDesktopProfile=[IrisDesktop.DesktopHostPolicy]::ProfilePath($irisDesktopEnvironment)
$irisDesktopOwner=New-Object IrisDesktop.DesktopSingleInstance($irisDesktopEnvironment,$irisDesktopProfile)
if(!$irisDesktopOwner.IsOwner){$irisDesktopOwner.Dispose();exit 0}
. (Join-Path $PSScriptRoot 'execution-lock.ps1')
$irisQueueOwner=Enter-IrisExecutionLock
if(!$irisQueueOwner){$irisDesktopOwner.Dispose();[void][System.Windows.Forms.MessageBox]::Show('다른 IRIS가 실행 중이에요. 기존 창에서 종료한 뒤 다시 열어 주세요.','SANCTUM IRIS');exit 1}
$irisDesktopStoreRoot=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Sanctum/IRIS/Desktop'
$irisDesktopStore=New-Object IrisDesktop.DesktopStore($irisDesktopStoreRoot,$irisDesktopEnvironment)
$irisDesktopWindow=New-Object IrisDesktop.DesktopWebView([bool]$Development,$irisDesktopProfile,$irisDesktopStore)
$irisDesktopWindow.EnableDesktopLifecycle()
$irisDesktopTray=New-Object System.Windows.Forms.NotifyIcon
$irisDesktopTray.Icon=[System.Drawing.SystemIcons]::Application
$irisDesktopTray.Text='SANCTUM IRIS · 생텀 센터'
$irisDesktopTray.Visible=$true
$irisDesktopMenu=New-Object System.Windows.Forms.ContextMenuStrip
[void]$irisDesktopMenu.Items.Add('센터 열기 · 입력 복구',$null,{ $irisDesktopWindow.Overlay.RestoreInteractive() })
[void]$irisDesktopMenu.Items.Add('종료',$null,{ $irisDesktopWindow.Close() })
[void]$irisDesktopMenu.Items.Add('복구 종료 · 최근 변경 손실 주의',$null,{ $irisDesktopWindow.ConfirmRecoveryClose() })
$irisDesktopTray.ContextMenuStrip=$irisDesktopMenu
$irisDesktopTray.add_DoubleClick({$irisDesktopWindow.Overlay.RestoreInteractive()})
$irisDesktopWindow.add_Resize({if($irisDesktopWindow.WindowState -eq 'Minimized'){$irisDesktopWindow.Hide()}})
$script:irisDesktopInit=$null
$irisDesktopWindow.add_Shown({$script:irisDesktopInit=$irisDesktopWindow.InitializeAsync((Join-Path $irisDesktopSdk 'runtimes/win-x64/native/WebView2Loader.dll'))})
$irisDesktopTimer=New-Object System.Windows.Forms.Timer
$irisDesktopTimer.Interval=250
$irisDesktopTimer.add_Tick({
 if($irisDesktopOwner.TakeActivation()){$irisDesktopWindow.Overlay.RestoreInteractive()}
 if($script:irisDesktopInit -and $script:irisDesktopInit.IsCompleted){
  if($script:irisDesktopInit.IsFaulted){$script:irisDesktopInit=$null;[void][System.Windows.Forms.MessageBox]::Show('내장 화면을 시작하지 못했어요. WebView2와 로컬 서버 실행 상태를 확인해 주세요.','SANCTUM IRIS');return}
  $script:irisDesktopInit=$null
  $irisDesktopTarget=if($Development){'http://localhost:3000/iris/desktop'}else{'https://sanctum-tawny-three.vercel.app/iris/desktop'}
  $irisDesktopWindow.Browser.CoreWebView2.Navigate($irisDesktopTarget)
 }
})
try{$irisDesktopTimer.Start();[System.Windows.Forms.Application]::Run($irisDesktopWindow)}
finally{$irisDesktopTimer.Stop();$irisDesktopTimer.Dispose();$irisDesktopTray.Visible=$false;$irisDesktopTray.Dispose();$irisDesktopMenu.Dispose();$irisDesktopWindow.Dispose();$irisQueueOwner.ReleaseMutex();$irisQueueOwner.Dispose();$irisDesktopOwner.Dispose()}
