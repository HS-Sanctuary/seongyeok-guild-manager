using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Web.Script.Serialization;

namespace IrisDesktop {
    // Native-only consent and audit sidecar. Never changes the original action journal.
    public sealed class DesktopLifeAutomationStore {
        const int Limit=1048576;
        readonly string root,environment;
        readonly byte[] entropy;
        readonly JavaScriptSerializer json=new JavaScriptSerializer {MaxJsonLength=Limit,RecursionLimit=24};
        static readonly UTF8Encoding Utf8=new UTF8Encoding(false,true);
        public string FilePath {get;private set;}
        public DesktopLifeAutomationStore(string root,string environment){
            if(!Path.IsPathRooted(root)||!new[]{"development","production"}.Contains(environment))throw new ArgumentException();
            this.root=Path.GetFullPath(root);this.environment=environment;
            FilePath=Path.Combine(this.root,environment,"ergon-automation-v1.dpapi");entropy=Utf8.GetBytes("SANCTUM:IRIS:ErgonAutomation:v1:"+environment);
        }
        static bool Text(object value,int max){var s=value as string;return !String.IsNullOrWhiteSpace(s)&&s.Length<=max&&!s.Any(c=>c<32||c==127);}
        static bool Number(object v){return (v is int||v is long||v is decimal||v is double)&&Convert.ToDecimal(v)>=0&&Convert.ToDecimal(v)<=8640000000000000L&&Decimal.Truncate(Convert.ToDecimal(v))==Convert.ToDecimal(v);}
        static long Now(){return (long)(DateTime.UtcNow-new DateTime(1970,1,1)).TotalMilliseconds;}
        T Locked<T>(Func<T> work){Directory.CreateDirectory(Path.GetDirectoryName(FilePath));using(var gate=new FileStream(FilePath+".lock",FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None))return work();}
        Dictionary<string,object> Empty(){return new Dictionary<string,object>{{"schemaVersion",1},{"environment",environment},{"collectionGrants",new object[0]},{"reconciliations",new object[0]}};}
        static Dictionary<string,object> Row(object o){var row=o as Dictionary<string,object>;if(row==null)throw new IOException("Life automation invalid");return row;}
        static void Keys(Dictionary<string,object> row,params string[] names){if(row.Count!=names.Length||names.Any(n=>!row.ContainsKey(n)))throw new IOException("Life automation invalid");}
        static void ValidateEvidence(Dictionary<string,object> e){
            Keys(e,"sessionStartedAt","checkedAt","firstObservedAt","secondObservedAt","gameProcessId","contextVersion","policyVersion","cliAbsent");
            if(e.Any(p=>p.Key!="cliAbsent"&&!Number(p.Value))||!Equals(e["policyVersion"],1)||!Equals(e["cliAbsent"],true)||Convert.ToInt64(e["gameProcessId"])<=0||Convert.ToInt64(e["secondObservedAt"])<Convert.ToInt64(e["firstObservedAt"]))throw new IOException("Life automation evidence invalid");
        }
        Dictionary<string,object> Read(){
            if(!File.Exists(FilePath))return Empty();
            if(new FileInfo(FilePath).Length>Limit+4096)throw new IOException("Life automation limit");
            var plain=ProtectedData.Unprotect(File.ReadAllBytes(FilePath),entropy,DataProtectionScope.CurrentUser);if(plain.Length>Limit)throw new IOException("Life automation limit");
            var value=Row(json.DeserializeObject(Utf8.GetString(plain)));Validate(value);return value;
        }
        void Validate(Dictionary<string,object> value){
            Keys(value,"schemaVersion","environment","collectionGrants","reconciliations");
            if(!Equals(value["schemaVersion"],1)||!Equals(value["environment"],environment)||!(value["collectionGrants"] is object[])||!(value["reconciliations"] is object[]))throw new IOException("Life automation invalid");
            var grants=(object[])value["collectionGrants"];var audits=(object[])value["reconciliations"];if(grants.Length>40||audits.Length>300)throw new IOException("Life automation limit");
            var accounts=new HashSet<string>();foreach(var o in grants){var g=Row(o);Keys(g,"accountId","policyVersion","authorizedAt");if(!Text(g["accountId"],100)||!accounts.Add((string)g["accountId"])||!Equals(g["policyVersion"],1)||!Number(g["authorizedAt"]))throw new IOException("Life automation grant invalid");}
            var ids=new HashSet<string>();foreach(var o in audits){var a=Row(o);Keys(a,"requestId","accountId","recordHash","evidence");Guid id;var hash=a["recordHash"] as string;if(!Text(a["accountId"],100)||!(a["requestId"] is string)||!Guid.TryParse((string)a["requestId"],out id)||id==Guid.Empty||!ids.Add(id.ToString("D"))||hash==null||hash.Length!=64||hash.Any(c=>!Uri.IsHexDigit(c)))throw new IOException("Life automation audit invalid");ValidateEvidence(Row(a["evidence"]));}
        }
        void Write(Dictionary<string,object> value){
            Validate(value);var plain=Utf8.GetBytes(json.Serialize(value));if(plain.Length>Limit)throw new IOException("Life automation limit");var bytes=ProtectedData.Protect(plain,entropy,DataProtectionScope.CurrentUser);var temporary=FilePath+"."+Guid.NewGuid().ToString("N")+".tmp";
            try{using(var f=new FileStream(temporary,FileMode.CreateNew,FileAccess.Write,FileShare.None)){f.Write(bytes,0,bytes.Length);f.Flush(true);}if(File.Exists(FilePath))File.Replace(temporary,FilePath,null);else File.Move(temporary,FilePath);}finally{if(File.Exists(temporary))File.Delete(temporary);}
        }
        static void Account(string account){if(!Text(account,100))throw new ArgumentException();}
        public bool CollectionAllowed(string accountId,int policyVersion){Account(accountId);if(policyVersion!=1)return false;return Locked(()=>((object[])Read()["collectionGrants"]).Select(Row).Any(g=>Equals(g["accountId"],accountId)&&Equals(g["policyVersion"],policyVersion)));}
        public void GrantCollection(string accountId,int policyVersion){Account(accountId);if(policyVersion!=1)throw new ArgumentException();Locked(()=>{var v=Read();var grants=((object[])v["collectionGrants"]).Select(Row).Where(g=>!Equals(g["accountId"],accountId)).Cast<object>().ToList();grants.Add(new Dictionary<string,object>{{"accountId",accountId},{"policyVersion",1},{"authorizedAt",Now()}});v["collectionGrants"]=grants.ToArray();Write(v);return true;});}
        public void RevokeCollection(string accountId){Account(accountId);Locked(()=>{var v=Read();v["collectionGrants"]=((object[])v["collectionGrants"]).Select(Row).Where(g=>!Equals(g["accountId"],accountId)).Cast<object>().ToArray();Write(v);return true;});}
        string Canonical(object value){var map=value as Dictionary<string,object>;if(map!=null)return "{"+String.Join(",",map.Keys.OrderBy(k=>k,StringComparer.Ordinal).Select(k=>json.Serialize(k)+":"+Canonical(map[k])))+"}";var array=value as IEnumerable;if(array!=null&&!(value is string))return "["+String.Join(",",array.Cast<object>().Select(Canonical))+"]";return json.Serialize(value);}
        public string RecordHash(Dictionary<string,object> original){DesktopLifeJournal.ValidateRecord(original);using(var hash=SHA256.Create())return String.Concat(hash.ComputeHash(Utf8.GetBytes(Canonical(original))).Select(b=>b.ToString("x2")));}
        bool Matches(Dictionary<string,object> audit,Dictionary<string,object> original){return Equals(original["state"],"unknown")&&Equals(audit["requestId"],original["requestId"])&&Equals(audit["accountId"],original["accountId"])&&Equals(audit["recordHash"],RecordHash(original));}
        public bool IsSeparated(string mode,Dictionary<string,object> original){if(mode!=environment)return false;DesktopLifeJournal.ValidateRecord(original);return Locked(()=>((object[])Read()["reconciliations"]).Select(Row).Any(a=>Matches(a,original)));}
        public void RecordSeparation(string mode,Dictionary<string,object> original,Dictionary<string,object> evidence){
            if(mode!=environment||!Equals(original["state"],"unknown"))throw new ArgumentException();string hash=RecordHash(original);ValidateEvidence(evidence);
            // Caller owns the global execution lease; re-read the original before taking the sidecar lock.
            var journal=new DesktopLifeJournal(root,environment,false);if(!journal.UnresolvedEntries().Any(r=>Equals(r["requestId"],original["requestId"])&&RecordHash(r)==hash))throw new IOException("Life original changed");
            Locked(()=>{var v=Read();var audits=((object[])v["reconciliations"]).Select(Row).ToList();var prior=audits.SingleOrDefault(a=>Equals(a["requestId"],original["requestId"]));if(prior!=null){if(!Matches(prior,original))throw new IOException("Life original changed");return true;}
                string backup=Path.Combine(root,environment,"reconciliation-backups");Directory.CreateDirectory(backup);File.Copy(journal.FilePath,Path.Combine(backup,"ergon-actions-"+Guid.NewGuid().ToString("N")+".dpapi"),false);
                audits.Add(new Dictionary<string,object>{{"requestId",original["requestId"]},{"accountId",original["accountId"]},{"recordHash",hash},{"evidence",evidence}});v["reconciliations"]=audits.Cast<object>().ToArray();Write(v);return true;});
        }
        public IReadOnlyList<string> SeparatedRequestIds(string accountId){Account(accountId);var audits=Locked(()=>((object[])Read()["reconciliations"]).Select(Row).Where(a=>Equals(a["accountId"],accountId)).ToArray());var originals=new DesktopLifeJournal(root,environment,false).UnresolvedEntries();return audits.Where(a=>originals.Any(r=>Matches(a,r))).Select(a=>(string)a["requestId"]).ToArray();}
    }
}
