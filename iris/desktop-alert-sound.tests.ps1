$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot 'desktop-alert-sound.cs'
if (!(Test-Path $source)) { throw 'Bounded owned alert bell is unavailable' }
Add-Type -TypeDefinition ((Get-Content $source -Raw -Encoding UTF8)+@'
namespace IrisDesktop { using System;using System.IO;
public static class BellFixture {
 public static void Run(){int calls=0;var now=new DateTime(2026,10,12);byte[] bytes=null;var bell=new DesktopAlertSound(()=>now,wave=>{calls++;bytes=wave;});
  if(!bell.Play()||bell.Play()||calls!=1)throw new Exception("Rate limit failed");
  using(var r=new BinaryReader(new MemoryStream(bytes))){if(new string(r.ReadChars(4))!="RIFF")throw new Exception("No WAV");r.BaseStream.Position=24;int hz=r.ReadInt32();r.BaseStream.Position=40;int length=r.ReadInt32();if(length/(hz*2.0)>=1||length<=0)throw new Exception("Long or empty bell");}
  now=now.AddSeconds(2);if(!bell.Play()||calls!=2)throw new Exception("Bell stayed muted");
 }
}}
'@) -ReferencedAssemblies @('System','System.Core')
[IrisDesktop.BellFixture]::Run()
Write-Output 'Bell: owned WAV under1sec, rate limit2sec, silent sink PASS'
