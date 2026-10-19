namespace IrisDesktop {
 using System;using System.IO;using System.Text;using System.Drawing;using System.Collections.Generic;using System.Web.Script.Serialization;
 public sealed class FloatingBoundsSnapshot {
  public Rectangle NormalBounds;public Point FloatingAnchor;public string MonitorId="";public int Dpi=96;public bool Persistent=true,Unreadable;public FloatingPreferences Preferences=new FloatingPreferences();
 }
 public sealed class DesktopFloatingBoundsStore {
  readonly string path;bool unreadable;
  public DesktopFloatingBoundsStore(string root){if(!Path.IsPathRooted(root))throw new ArgumentException();path=Path.Combine(root,"window-floating-v1.json");}
  static int Num(Dictionary<string,object> r,string k){object v;if(!r.TryGetValue(k,out v)||!(v is int))throw new ArgumentException();return (int)v;}
  public FloatingBoundsSnapshot Load(Rectangle normal,Point anchor){
   var s=new FloatingBoundsSnapshot{NormalBounds=normal,FloatingAnchor=anchor};
   try{if(!File.Exists(path))return s;if(new FileInfo(path).Length>4096)throw new ArgumentException();var r=new JavaScriptSerializer().DeserializeObject(File.ReadAllText(path,new UTF8Encoding(false,true))) as Dictionary<string,object>;if(r==null)throw new ArgumentException();int version=Num(r,"version");if(version==1?r.Count!=13:(version!=2&&version!=3)||r.Count!=14||!r.ContainsKey("windowedFloating")||!(r["windowedFloating"] is bool))throw new ArgumentException();
    var b=new Rectangle(Num(r,"normalX"),Num(r,"normalY"),Num(r,"normalWidth"),Num(r,"normalHeight"));var p=new FloatingPreferences{IconSize=Num(r,"iconSize"),Opacity=Num(r,"opacity"),Modifiers=(uint)Num(r,"modifiers"),Key=(uint)Num(r,"key")};
    p.WindowedFloating=version>=2&&(bool)r["windowedFloating"];
    if(version<3&&p.IconSize==52)p.IconSize=36;
    int dpi=Num(r,"dpi");if(b.Width<100||b.Width>20000||b.Height<100||b.Height>20000||dpi<48||dpi>768||!(r["monitorId"] is string)||((string)r["monitorId"]).Length>256||!FloatingPreferences.Valid(p.IconSize,p.Opacity,p.Modifiers,p.Key))throw new ArgumentException();
    s.NormalBounds=b;s.FloatingAnchor=new Point(Num(r,"anchorX"),Num(r,"anchorY"));s.Dpi=dpi;s.MonitorId=(string)r["monitorId"];s.Preferences=p;return s;
   }catch{unreadable=true;s.Unreadable=true;s.Persistent=false;return s;}
  }
  public bool Save(FloatingBoundsSnapshot s){
   if(unreadable||s.Unreadable||!FloatingPreferences.Valid(s.Preferences.IconSize,s.Preferences.Opacity,s.Preferences.Modifiers,s.Preferences.Key))return false;
   string tmp=path+"."+Guid.NewGuid().ToString("N")+".tmp";
   try{Directory.CreateDirectory(Path.GetDirectoryName(path));var b=s.NormalBounds;var p=s.Preferences;var data=new{version=3,normalX=b.X,normalY=b.Y,normalWidth=b.Width,normalHeight=b.Height,anchorX=s.FloatingAnchor.X,anchorY=s.FloatingAnchor.Y,monitorId=s.MonitorId,dpi=s.Dpi,iconSize=p.IconSize,opacity=p.Opacity,modifiers=p.Modifiers,key=p.Key,windowedFloating=p.WindowedFloating};
    using(var f=new FileStream(tmp,FileMode.CreateNew,FileAccess.Write,FileShare.None)){var bytes=Encoding.UTF8.GetBytes(new JavaScriptSerializer().Serialize(data));f.Write(bytes,0,bytes.Length);f.Flush(true);}if(File.Exists(path))File.Replace(tmp,path,null);else File.Move(tmp,path);return s.Persistent=true;
   }catch{s.Persistent=false;return false;}finally{try{if(File.Exists(tmp))File.Delete(tmp);}catch{}}
  }
 }
}
