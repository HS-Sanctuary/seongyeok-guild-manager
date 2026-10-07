using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Globalization;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Web.Script.Serialization;

namespace IrisDesktop {
    public sealed class DesktopStoreCorruptionException : IOException {
        public DesktopStoreCorruptionException() : base("Saved queue was quarantined. Review recovery before editing.") { }
    }
    // Queue data only. Browser authentication stays in the dedicated WebView2 profile.
    public sealed class DesktopStore {
        const int Limit = 1048576;
        readonly string environment;
        readonly byte[] entropy;
        readonly byte[] legacyEntropy;
        readonly string legacyPath;
        bool damaged;
        readonly object gate = new object();
        static readonly UTF8Encoding Utf8 = new UTF8Encoding(false, true);
        static readonly string[] Fields = { "environment", "accountId", "characterId", "category", "taskId", "periodKey", "requestId", "revision", "baseCompleted", "desiredCompleted", "deadlineAt", "phase" };
        static readonly string[] ClassFields={"environment","accountId","characterId","kind","classId","baseLevel","desiredLevel","requestId","revision","deadlineAt","phase"};
        public string FilePath { get; private set; }
        public DesktopStore(string root, string environment) {
            if ((environment != "production" && environment != "development") || !Path.IsPathRooted(root)) throw new ArgumentException("Dedicated absolute store root/environment required");
            this.environment = environment;
            FilePath = Path.Combine(Path.GetFullPath(root), environment, "pending-v2.dpapi");
            legacyPath=Path.Combine(Path.GetFullPath(root),environment,"pending-v1.dpapi");
            entropy = Utf8.GetBytes("SANCTUM:IRIS:DesktopQueue:v2:" + environment);
            legacyEntropy=Utf8.GetBytes("SANCTUM:IRIS:DesktopQueue:v1:"+environment);
        }
        static bool Text(object value, int max) {
            var s = value as string;
            return s != null && s.Length > 0 && s.Length <= max && !s.Any(c => c <= 32 || c == 127);
        }
        static bool Integer(object value, long min, long max) {
            if (!(value is int || value is long || value is decimal || value is double)) return false;
            decimal n;
            try { n = Convert.ToDecimal(value, CultureInfo.InvariantCulture); } catch { return false; }
            return n >= min && n <= max && Decimal.Truncate(n) == n;
        }
        public void Validate(string json) { Validate(json,false); }
        void Validate(string json,bool legacy) {
            if (json == null || Utf8.GetByteCount(json) > Limit) throw new ArgumentException("Queue limit exceeded");
            var serializer = new JavaScriptSerializer { MaxJsonLength = Limit, RecursionLimit = 32 };
            var root = serializer.DeserializeObject(json) as Dictionary<string, object>;
            if (root == null || root.Count != 2 || !root.ContainsKey("schemaVersion") || !Integer(root["schemaVersion"], legacy?1:2, legacy?1:2) || !root.ContainsKey("entries")) throw new ArgumentException("Invalid queue schema");
            var entries = root["entries"] as object[];
            if (entries == null || entries.Length > 500) throw new ArgumentException("Invalid queue entries");
            var requests = new HashSet<string>(); var revisions = new HashSet<string>(); var pending = new HashSet<string>(); int flights = 0;
            foreach (var value in entries) {
                var e = value as Dictionary<string, object>;
                bool isClass=!legacy&&e!=null&&e.ContainsKey("kind")&&Equals(e["kind"],"class");
                var fields=legacy?Fields:isClass?ClassFields:Fields.Concat(new[]{"kind"}).ToArray();
                if (e == null || e.Count != fields.Length || fields.Any(f => !e.ContainsKey(f))) throw new ArgumentException("Invalid queue fields");
                if (!legacy&&!isClass&&!Equals(e["kind"],"task"))throw new ArgumentException("Invalid queue kind");
                bool validValue=isClass?Text(e["classId"],100)&&(e["baseLevel"]==null||Integer(e["baseLevel"],1,1000))&&Integer(e["desiredLevel"],1,1000):Text(e["taskId"],100)&&new[]{"daily","weekly","abyss","raid"}.Contains(e["category"] as string)&&Integer(e["baseCompleted"],0,1000)&&Integer(e["desiredCompleted"],0,1000);
                if (!Equals(e["environment"], environment) || !Text(e["accountId"], 100) || !Text(e["characterId"], 100) || !validValue ||
                    !new[] { "pending", "inflight", "unknown", "conflict", "expired" }.Contains(e["phase"] as string) ||
                    !Integer(e["revision"], 1, 9007199254740991L) || !Integer(e["deadlineAt"], 0, 9007199254740991L)) throw new ArgumentException("Invalid queue values");
                var request = e["requestId"] as string;
                if (request == null || !System.Text.RegularExpressions.Regex.IsMatch(request, "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$") || !requests.Add(request)) throw new ArgumentException("Invalid request identity");
                string period=null;
                if(!isClass){
                    period=e["periodKey"] as string;DateTimeOffset date;
                    if (period == null || !DateTimeOffset.TryParseExact(period, "yyyy-MM-dd'T'HH:mm:ss'.000Z'", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out date) ||
                        date.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'.000Z'", CultureInfo.InvariantCulture) != period) throw new ArgumentException("Invalid queue period");
                }
                var key = serializer.Serialize(isClass?new object[]{e["environment"],e["accountId"],e["characterId"],"class",e["classId"]}:new object[] { e["environment"], e["accountId"], e["characterId"],"task", e["category"], e["taskId"], period });
                if (!revisions.Add(key + ":" + e["revision"].ToString()) || (Equals(e["phase"], "pending") && !pending.Add(key))) throw new ArgumentException("Duplicate queue identity");
                if (Equals(e["phase"], "inflight") && ++flights > 1) throw new ArgumentException("Multiple inflight entries");
            }
        }
        public void Replace(string json) {
            lock (gate) {
                if(damaged||File.Exists(legacyPath))throw new IOException("Queue migration/recovery required; restart the updated app.");
                WriteAtomic(json);
            }
        }
        void WriteAtomic(string json){
                Validate(json);
                byte[] plain = Utf8.GetBytes(json), cipher;
                try { cipher = ProtectedData.Protect(plain, entropy, DataProtectionScope.CurrentUser); }
                finally { Array.Clear(plain, 0, plain.Length); }
                var directory = Path.GetDirectoryName(FilePath); Directory.CreateDirectory(directory);
                var temp = Path.Combine(directory, "pending-" + Guid.NewGuid().ToString("N") + ".tmp");
                try {
                    using (var output = new FileStream(temp, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { output.Write(cipher, 0, cipher.Length); output.Flush(true); }
                    if (File.Exists(FilePath)) File.Replace(temp, FilePath, null);
                    else File.Move(temp, FilePath);
                } finally {
                    if (File.Exists(temp)) File.Delete(temp); // Only this operation's encrypted temporary file.
                    Array.Clear(cipher, 0, cipher.Length);
                }
        }
        string Read(string path,byte[] key,bool legacy){
            var length=new FileInfo(path).Length;if(length<1||length>Limit+16384)throw new InvalidDataException();
            var cipher=File.ReadAllBytes(path);byte[] plain=ProtectedData.Unprotect(cipher,key,DataProtectionScope.CurrentUser);
            try{var json=Utf8.GetString(plain);Validate(json,legacy);return json;}finally{Array.Clear(plain,0,plain.Length);Array.Clear(cipher,0,cipher.Length);}
        }
        public string Load() {
            lock (gate) {
                if(damaged)throw new IOException("Queue recovery required.");
                if(File.Exists(legacyPath)){
                    if(File.Exists(FilePath))throw new IOException("Ambiguous active queue versions; retain both for recovery.");
                    try{
                        var json=Read(legacyPath,legacyEntropy,true);
                        var serializer=new JavaScriptSerializer{MaxJsonLength=Limit,RecursionLimit=32};
                        var root=(Dictionary<string,object>)serializer.DeserializeObject(json);root["schemaVersion"]=2;
                        foreach(Dictionary<string,object> entry in (object[])root["entries"])entry["kind"]="task";
                        var converted=serializer.Serialize(root);Validate(converted);WriteAtomic(converted);
                        if(Read(FilePath,entropy,false)!=converted)throw new IOException("Migration verification failed.");
                        File.Move(legacyPath,Path.Combine(Path.GetDirectoryName(legacyPath),"pending-v1.recovery-"+Guid.NewGuid().ToString("N")+".dpapi"));
                        return converted;
                    }catch{damaged=true;throw;}
                }
                if (!File.Exists(FilePath)) return null;
                try {
                    return Read(FilePath,entropy,false);
                } catch (Exception error) {
                    if (!(error is CryptographicException || error is ArgumentException || error is InvalidDataException || error is InvalidOperationException)) throw;
                    // Preserve damaged ciphertext for diagnosis, never quietly erase user edits.
                    File.Move(FilePath, FilePath + ".corrupt-" + Guid.NewGuid().ToString("N"));
                    damaged=true;
                    throw new DesktopStoreCorruptionException();
                }
            }
        }
    }
}
