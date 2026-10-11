using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Globalization;
using System.Security.Cryptography;
using System.Web.Script.Serialization;

namespace IrisDesktop {
 public sealed class DesktopUpdateFile {
  public string name;public long sizeBytes;public string sha256;
 }
 // No install, network, queue, CLI or browser access in this policy.
 public sealed class DesktopUpdateRelease {
  public const long ZipLimit=32L*1024*1024,ExpandedLimit=96L*1024*1024;
  public const int MetadataLimit=65536;
  public static readonly string[] Names={"IRIS.exe","IRIS.Updater.exe","IRIS.ico","Microsoft.Web.WebView2.Core.dll","Microsoft.Web.WebView2.WinForms.dll","WebView2Loader.dll","README.txt","LICENSE.WebView2.txt","NOTICE.WebView2.txt"};
  public string Version,CreatedAtUtc,Sha256;public long SizeBytes;public DesktopUpdateFile[] Files;
  static readonly UTF8Encoding Utf8=new UTF8Encoding(false,true);
  static readonly string[] Common={"schemaVersion","product","channel","architecture","signature","version","updaterVersion","minUpdaterVersion","queueSchemaVersion","createdAtUtc","files"};
  public static string Hash(string file){using(var s=File.OpenRead(file))using(var h=SHA256.Create())return BitConverter.ToString(h.ComputeHash(s)).Replace("-","").ToLowerInvariant();}
  static bool Integer(object x,long min,long max){if(!(x is int||x is long))return false;long v=Convert.ToInt64(x);return v>=min&&v<=max;}
  static string Digest(object x){var s=x as string;if(s==null||!Regex.IsMatch(s,@"\A[a-f0-9]{64}\z"))throw new ArgumentException("Invalid release hash");return s;}
  static int[] VersionParts(string s){if(s==null||!Regex.IsMatch(s,@"\A(?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3})\z"))throw new ArgumentException("Invalid native version");return s.Split('.').Select(Int32.Parse).ToArray();}
  public static int CompareVersions(string a,string b){var x=VersionParts(a);var y=VersionParts(b);for(int i=0;i<3;i++){int c=x[i].CompareTo(y[i]);if(c!=0)return c;}return 0;}
  public static DesktopUpdateRelease Parse(string json,bool archiveMetadata){
   if(json==null||Utf8.GetByteCount(json)>MetadataLimit)throw new ArgumentException("Release metadata limit");
   var r=new JavaScriptSerializer {MaxJsonLength=MetadataLimit,RecursionLimit=12}.DeserializeObject(json) as Dictionary<string,object>;
   var keys=archiveMetadata?Common.Concat(new[]{"sha256","sizeBytes"}).ToArray():Common;
   if(r==null||r.Count!=keys.Length||keys.Any(k=>!r.ContainsKey(k))||!Equals(r["schemaVersion"],1)||!Equals(r["product"],"IRIS for SANCTUM")||!Equals(r["channel"],"beta-candidate")||!Equals(r["architecture"],"win-x64")||!Equals(r["signature"],"unsigned")||!Equals(r["updaterVersion"],1)||!Equals(r["minUpdaterVersion"],1)||!Equals(r["queueSchemaVersion"],3))throw new ArgumentException("Unsupported release");
   string version=r["version"] as string,created=r["createdAtUtc"] as string;VersionParts(version);DateTimeOffset date;
   if(created==null||created.Length>40||!created.EndsWith("Z",StringComparison.Ordinal)||!DateTimeOffset.TryParse(created,CultureInfo.InvariantCulture,DateTimeStyles.AssumeUniversal,out date))throw new ArgumentException("Invalid release date");
   var rows=r["files"] as object[];if(rows==null||rows.Length!=Names.Length)throw new ArgumentException("Release file allowlist");
   var files=new List<DesktopUpdateFile>();var names=new HashSet<string>(StringComparer.Ordinal);long total=0;
   foreach(var row in rows){var f=row as Dictionary<string,object>;if(f==null||f.Count!=3||!f.ContainsKey("name")||!f.ContainsKey("sizeBytes")||!f.ContainsKey("sha256")||!Names.Contains(f["name"] as string,StringComparer.Ordinal)||!names.Add((string)f["name"])||!Integer(f["sizeBytes"],1,ZipLimit))throw new ArgumentException("Invalid release file");long size=Convert.ToInt64(f["sizeBytes"]);total+=size;files.Add(new DesktopUpdateFile{name=(string)f["name"],sizeBytes=size,sha256=Digest(f["sha256"])});}
   if(total>ExpandedLimit)throw new ArgumentException("Expanded release limit");
   var result=new DesktopUpdateRelease {Version=version,CreatedAtUtc=created,Files=files.ToArray()};
   if(archiveMetadata){if(!Integer(r["sizeBytes"],1,ZipLimit))throw new ArgumentException("ZIP limit");result.SizeBytes=Convert.ToInt64(r["sizeBytes"]);result.Sha256=Digest(r["sha256"]);}return result;
  }
  public bool SameRelease(DesktopUpdateRelease other){return other!=null&&Version==other.Version&&CreatedAtUtc==other.CreatedAtUtc&&Files.All(f=>other.Files.Any(o=>o.name==f.name&&o.sha256==f.sha256&&o.sizeBytes==f.sizeBytes));}
  public void ValidateArchive(string zip,string stage){
   if(!Path.IsPathRooted(stage)||Directory.Exists(stage)||File.Exists(stage))throw new ArgumentException("Fresh absolute stage required");
   var info=new FileInfo(zip);if(info.Length!=SizeBytes||Hash(zip)!=Sha256)throw new ArgumentException("Archive integrity mismatch");
   using(var archive=ZipFile.OpenRead(zip)){
    var names=new HashSet<string>(StringComparer.Ordinal);long total=0;
    foreach(var entry in archive.Entries){
     if((entry.FullName!="manifest.json"&&!Names.Contains(entry.FullName,StringComparer.Ordinal))||!names.Add(entry.FullName)||(entry.ExternalAttributes&0x400)!=0||((entry.ExternalAttributes>>16)&0xf000)==0xa000)throw new ArgumentException("Unsafe archive entry");
     var expected=Files.FirstOrDefault(f=>f.name==entry.FullName);long limit=expected==null?MetadataLimit:expected.sizeBytes;
     if(entry.Length!=limit&&expected!=null||entry.Length<1||entry.Length>limit)throw new ArgumentException("Archive entry limit");total+=entry.Length;
    }
    if(names.Count!=Names.Length+1||!names.Contains("manifest.json")||total>ExpandedLimit+MetadataLimit)throw new ArgumentException("Incomplete archive");
    string json;using(var stream=archive.GetEntry("manifest.json").Open())using(var reader=new StreamReader(stream,Utf8,false))json=reader.ReadToEnd();
    if(!SameRelease(Parse(json,false)))throw new ArgumentException("Inner release mismatch");
    Directory.CreateDirectory(stage);
    foreach(var entry in archive.Entries){var target=Path.Combine(stage,entry.FullName);using(var input=entry.Open())using(var output=new FileStream(target,FileMode.CreateNew,FileAccess.Write,FileShare.None)){var buffer=new byte[8192];long count=0;int n;while((n=input.Read(buffer,0,buffer.Length))>0){count+=n;if(count>entry.Length)throw new ArgumentException("Expanded entry limit");output.Write(buffer,0,n);}if(count!=entry.Length)throw new ArgumentException("Incomplete entry");}
     var expected=Files.FirstOrDefault(f=>f.name==entry.FullName);if(expected!=null&&Hash(target)!=expected.sha256)throw new ArgumentException("Payload integrity mismatch");
    }
   }
  }
 }
}
