using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Globalization;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
namespace IrisDesktop {
    // Display-only observations. This store never authorizes a game action.
    public sealed class DesktopCurrencyStore {
        readonly string directory,environment,mutexName;
        readonly byte[] entropy;
        readonly HashSet<string> damaged=new HashSet<string>();
        const int Limit=1048576;
        static readonly UTF8Encoding Utf8=new UTF8Encoding(false,true);
        static JavaScriptSerializer Json(){return new JavaScriptSerializer{MaxJsonLength=Limit,RecursionLimit=12};}
        static string Hash(string text){using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(Utf8.GetBytes(text))).Replace("-","").ToLowerInvariant();}
        static bool Text(string s,int max){return !String.IsNullOrWhiteSpace(s)&&s.Length<=max&&!s.Any(c=>c<32||c==127);}
        static bool Amount(object n){if(!(n is int||n is long||n is decimal||n is double))return false;try{var d=Convert.ToDecimal(n,CultureInfo.InvariantCulture);return d>=0&&d<=9007199254740991m&&Decimal.Truncate(d)==d;}catch{return false;}}
        static string Time(object value){DateTimeOffset d;if(!(value is string)||!DateTimeOffset.TryParse((string)value,CultureInfo.InvariantCulture,DateTimeStyles.RoundtripKind,out d)||d.Offset!=TimeSpan.Zero||d> DateTimeOffset.UtcNow.AddMinutes(1))throw new ArgumentException();return d.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'",CultureInfo.InvariantCulture);}
        public DesktopCurrencyStore(string root,string environment){
            if(!Path.IsPathRooted(root)||!(environment=="development"||environment=="production"))throw new ArgumentException();
            this.environment=environment;directory=Path.Combine(Path.GetFullPath(root),environment,"currency-cache-v1");
            entropy=Utf8.GetBytes("SANCTUM:IRIS:CurrencyCache:v1:"+environment);mutexName="Local\\IRIS.Currency."+Hash(directory.ToUpperInvariant());
        }
        string PathFor(string account){if(!Text(account,100))throw new ArgumentException();return Path.Combine(directory,Hash(account)+".dpapi");}
        Dictionary<string,object> Read(string path,string account){
            if(new FileInfo(path).Length>Limit)throw new IOException("Currency cache too large");
            var plain=ProtectedData.Unprotect(File.ReadAllBytes(path),entropy,DataProtectionScope.CurrentUser);
            try{var view=Json().DeserializeObject(Utf8.GetString(plain)) as Dictionary<string,object>;
                if(view==null||view.Count!=5||!Equals(view["schemaVersion"],1)||!Equals(view["environment"],environment)||!Equals(view["accountId"],account)||!Equals(view["attribution"],"unverified"))throw new IOException();
                Rows(view["items"],true);return view;
            }finally{Array.Clear(plain,0,plain.Length);}
        }
        static List<Dictionary<string,object>> Rows(object raw,bool cached){
            var array=raw as object[];if(array==null||array.Length>200)throw new ArgumentException();var names=new HashSet<string>();var rows=new List<Dictionary<string,object>>();
            foreach(var item in array){var row=item as Dictionary<string,object>;if(row==null||row.Count!=(cached?3:2)||!row.ContainsKey("name")||!row.ContainsKey("amount")||!Text(row["name"] as string,120)||!names.Add((string)row["name"])||!(row["amount"]==null&&!cached||Amount(row["amount"])))throw new ArgumentException();if(cached)Time(row["observedAt"]);rows.Add(row);}return rows;
        }
        T Locked<T>(Func<T> body){using(var mutex=new Mutex(false,mutexName)){bool held=false;try{try{held=mutex.WaitOne(1000);}catch(AbandonedMutexException){held=true;}if(!held)throw new IOException("Currency cache busy");return body();}finally{if(held)mutex.ReleaseMutex();}}}
        Dictionary<string,object> LoadCore(string account){
            var path=PathFor(account);if(!File.Exists(path)){if(!File.Exists(path+".bak"))return null;damaged.Add(account);return Read(path+".bak",account);}
            try{return Read(path,account);}catch{damaged.Add(account);if(File.Exists(path+".bak"))return Read(path+".bak",account);throw new IOException("Currency cache needs recovery");}
        }
        public string Load(string account){return Locked(()=>{var view=LoadCore(account);return view==null?null:Json().Serialize(view);});}
        public async Task<string> RefreshAsync(string account,Func<Task<object>> read,Func<bool> isCurrent){
            if(!isCurrent())throw new InvalidOperationException("Currency context changed");
            var observed=await read();
            if(!isCurrent())throw new InvalidOperationException("Currency context changed");
            return Observe(account,Json().Serialize(observed));
        }
        // Only the native host calls Observe with a successful normalized CLI response.
        // There is intentionally no browser method accepting a snapshot for persistence.
        public string Observe(string account,string normalized){return Locked(()=>{
            var path=PathFor(account);var previous=LoadCore(account);if(damaged.Contains(account))throw new IOException("Currency cache needs recovery");
            var value=Json().DeserializeObject(normalized) as Dictionary<string,object>;if(value==null||value.Count!=2)throw new ArgumentException();
            var time=Time(value["observedAt"]);var incoming=Rows(value["items"],false);var merged=previous==null?new List<Dictionary<string,object>>():Rows(previous["items"],true);
            foreach(var row in incoming){if(row["amount"]==null)continue;var old=merged.Find(r=>Equals(r["name"],row["name"]));if(old!=null&&String.CompareOrdinal((string)old["observedAt"],time)>0)continue;
                if(old!=null)merged.Remove(old);merged.Add(new Dictionary<string,object>{{"name",row["name"]},{"amount",row["amount"]},{"observedAt",time}});
            }
            if(merged.Count>200)throw new IOException("Currency cache capacity");
            var view=new Dictionary<string,object>{{"schemaVersion",1},{"environment",environment},{"accountId",account},{"attribution","unverified"},{"items",merged}};
            var json=Json().Serialize(view);var plain=Utf8.GetBytes(json);if(plain.Length>Limit)throw new IOException();byte[] cipher;
            try{cipher=ProtectedData.Protect(plain,entropy,DataProtectionScope.CurrentUser);}finally{Array.Clear(plain,0,plain.Length);}
            Directory.CreateDirectory(directory);var temp=path+"."+Guid.NewGuid().ToString("N")+".tmp";
            try{using(var file=new FileStream(temp,FileMode.CreateNew,FileAccess.Write,FileShare.None)){file.Write(cipher,0,cipher.Length);file.Flush(true);}if(File.Exists(path))File.Replace(temp,path,path+".bak");else File.Move(temp,path);}
            finally{if(File.Exists(temp))File.Delete(temp);}
            return json;
        });}
    }
}
