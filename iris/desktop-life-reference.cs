using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using System.Web.Script.Serialization;

namespace IrisDesktop {
 // Reads selected non-personal recipe facts from an optional installed reference; never imports or redistributes its database.
 public static class DesktopLifeReference {
  const int Limit=1048576;
  static void Kind(string kind){if(kind!="crafting"&&kind!="altering")throw new ArgumentException();}
  public static object Normalize(string kind,string displayName,string raw,long modifiedAt){
   Kind(kind);DesktopLifePolicy.Text(displayName);if(raw==null||Encoding.UTF8.GetByteCount(raw)>Limit||modifiedAt<1)throw new ArgumentException();
   var json=new JavaScriptSerializer {MaxJsonLength=Limit,RecursionLimit=16};var root=DesktopLifePolicy.Object(json.DeserializeObject(raw));
   var items=DesktopLifePolicy.Items(root).Select(DesktopLifePolicy.Object).Where(row=>Equals(DesktopLifePolicy.Get(row,"DisplayName"),displayName)).ToArray();
   if(items.Length==0)return null;if(items.Length!=1)throw new ArgumentException();
   var target=items[0];var list=DesktopLifePolicy.Get(target,"MissingIngredients") as object[];if(list==null||list.Length>32)throw new ArgumentException();
   var seen=new HashSet<string>();var ingredients=list.Select(value=>{var row=DesktopLifePolicy.Object(value);string name=DesktopLifePolicy.Text(DesktopLifePolicy.Get(row,"DisplayName"));if(!seen.Add(name))throw new ArgumentException();return new {name=name,required=DesktopLifePolicy.Integer(DesktopLifePolicy.Get(row,"Required"),1,1000000)};}).ToArray();
   long output=DesktopLifePolicy.Integer(DesktopLifePolicy.Get(target,kind=="crafting"?"ProducedPerCraft":"ProducedPerWork"),1,1000000);
   return new {schemaVersion=1,kind=kind,displayName=displayName,source="installed-reference",modifiedAt=modifiedAt,outputPerUnit=output,complete=false,ingredients=ingredients};
  }
  public static object Read(string kind,string displayName){
   Kind(kind);DesktopLifePolicy.Text(displayName);
   var root=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"AI_Connector");var file=Path.Combine(root,kind=="crafting"?"craftable_all.json":"alterable_all.json");
   if(!File.Exists(file))return null;if((File.GetAttributes(root)&FileAttributes.ReparsePoint)!=0||(File.GetAttributes(file)&FileAttributes.ReparsePoint)!=0)throw new IOException("Reference unavailable");
   var info=new FileInfo(file);if(info.Length>Limit)throw new IOException("Reference limit");var modified=info.LastWriteTimeUtc;
   string raw;using(var stream=new FileStream(file,FileMode.Open,FileAccess.Read,FileShare.Read)){if(stream.Length>Limit)throw new IOException("Reference limit");using(var reader=new StreamReader(stream,new UTF8Encoding(false,true),true))raw=reader.ReadToEnd();}
   if(File.GetLastWriteTimeUtc(file)!=modified)throw new IOException("Reference changed");return Normalize(kind,displayName,raw,DesktopLifePolicy.Time(modified));
  }
 }
}
