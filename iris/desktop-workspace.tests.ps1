$ErrorActionPreference='Stop'
Add-Type -TypeDefinition ((Get-Content (Join-Path $PSScriptRoot 'desktop-presentation.cs') -Raw -Encoding UTF8)+@'
namespace IrisDesktop {using System;using System.Drawing;
 public static class WorkspaceFixture {
  static void Check(bool ok,string message){if(!ok)throw new Exception(message);}
  public static void Run(){
   var monitor=new Rectangle(-1920,40,1920,1040);var previous=new Rectangle(-460,80,420,640);
   var wide=DesktopWorkspaceLayout.Expand(previous,monitor);Check(wide.Width>=1100&&monitor.Contains(wide),"Wide workspace escaped negative-coordinate monitor");
   var tiny=new Rectangle(0,0,800,600);Check(tiny.Contains(DesktopWorkspaceLayout.Expand(previous,tiny)),"Small monitor overflow");
   Check(DesktopWorkspaceLayout.Restore(previous,monitor)==previous,"Normal bounds changed on restore");
   Check(tiny.Contains(DesktopWorkspaceLayout.Restore(previous,tiny)),"Restore after display change escaped monitor");
  }
 }
}
'@) -ReferencedAssemblies @('System.Drawing','System.Core','System.Web.Extensions')
[IrisDesktop.WorkspaceFixture]::Run()
Write-Output 'PASS workspace monitor bounds/normal restore/display change; UI policy only'
