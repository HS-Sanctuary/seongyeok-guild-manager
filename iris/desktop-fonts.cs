using System;
using System.Collections.Generic;
using System.Drawing.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace IrisDesktop {
    // Retains names only, never font files or native font handles.
    public sealed class DesktopInstalledFonts {
        readonly object gate=new object();
        readonly Func<string[]> enumerate;
        string[] cached;
        Task<object> pending;
        public DesktopInstalledFonts():this(ReadWindowsNames){}
        public DesktopInstalledFonts(Func<string[]> enumerate){if(enumerate==null)throw new ArgumentNullException("enumerate");this.enumerate=enumerate;}
        static string[] ReadWindowsNames(){
            using(var collection=new InstalledFontCollection()){
                var families=collection.Families;var names=new List<string>();
                try{foreach(var family in families)names.Add(family.Name);}
                finally{foreach(var family in families)family.Dispose();}
                return names.ToArray();
            }
        }
        public Task<object> ReadAsync(bool refresh){
            lock(gate){
                if(pending!=null)return pending;
                if(cached!=null&&!refresh)return Task.FromResult<object>(new Dictionary<string,object>{{"fonts",(string[])cached.Clone()}});
                pending=Task.Run<object>(()=>{
                    try{
                        var unique=new SortedSet<string>(StringComparer.OrdinalIgnoreCase);
                        var raw=enumerate();if(raw==null||raw.Length>16384)throw new ArgumentException();
                        foreach(var value in raw){
                            if(String.IsNullOrWhiteSpace(value)||value.Length>80||Regex.IsMatch(value,@"[\x00-\x1f\x7f]"))continue;
                            var name=value.Trim();
                            if(!Regex.IsMatch(name,@"^[\p{L}\p{N}][\p{L}\p{N} ._-]*$"))continue;
                            unique.Add(name);if(unique.Count>2048)throw new ArgumentException();
                        }
                        var result=new string[unique.Count];unique.CopyTo(result);
                        lock(gate){cached=result;}
                        return new Dictionary<string,object>{{"fonts",(string[])result.Clone()}};
                    }finally{lock(gate){pending=null;}}
                });
                return pending;
            }
        }
    }
}
