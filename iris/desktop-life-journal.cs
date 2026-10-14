using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Web.Script.Serialization;

namespace IrisDesktop {
    // Native-only future action journal. No browser method or game command is exposed here.
    public sealed class DesktopLifeJournal {
        const int Limit=1048576;
        readonly string environment,rootPath;
        readonly byte[] entropy;
        readonly JavaScriptSerializer json=new JavaScriptSerializer {MaxJsonLength=Limit,RecursionLimit=16};
        static readonly UTF8Encoding Utf8=new UTF8Encoding(false,true);
        static readonly string[] Fields={"requestId","accountId","characterId","action","displayName","expectedWings","startedAt","state"};
        public string FilePath {get;private set;}
        public DesktopLifeJournal(string root,string environment):this(root,environment,true){}
        public DesktopLifeJournal(string root,string environment,bool recoverInflight){
            if(!Path.IsPathRooted(root)||!new[]{"development","production"}.Contains(environment))throw new ArgumentException();
            this.environment=environment;rootPath=Path.GetFullPath(root);FilePath=Path.Combine(rootPath,environment,"ergon-actions-v1.dpapi");
            entropy=Utf8.GetBytes("SANCTUM:IRIS:ErgonActions:v1:"+environment);
            if(recoverInflight)RecoverInterrupted();else Locked(()=>{Read();return true;});
        }
        public FileStream AcquireExecutionLease(){Directory.CreateDirectory(rootPath);return new FileStream(Path.Combine(rootPath,"ergon-game.run-lock"),FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None);}
        public void RecoverInterrupted(){using(var lease=AcquireExecutionLease())Locked(()=>{var rows=Read();bool changed=false;foreach(var row in rows)if(Equals(row["state"],"inflight")){row["state"]="unknown";changed=true;}if(changed)Write(rows);return true;});}
        public object[] EntriesFor(string accountId){if(!Text(accountId,100))throw new ArgumentException();return Locked(()=>Read().Where(row=>Equals(row["accountId"],accountId)).Select(row=>(object)new Dictionary<string,object>(row)).ToArray());}
        T Locked<T>(Func<T> action){
            Directory.CreateDirectory(Path.GetDirectoryName(FilePath));
            // File sharing locks span Windows login/RDP sessions, unlike a Local named mutex.
            // The persistent empty lock file contains no account or action data.
            using(var gate=new FileStream(FilePath+".lock",FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None))return action();
        }
        static bool Text(object value,int limit){var s=value as string;return !String.IsNullOrWhiteSpace(s)&&s.Length<=limit&&!s.Any(c=>c<32||c==127);}
        static bool Integer(object value,long min,long max){if(!(value is int||value is long||value is decimal||value is double))return false;try{var n=Convert.ToDecimal(value);return n>=min&&n<=max&&Decimal.Truncate(n)==n;}catch{return false;}}
        static bool Unresolved(Dictionary<string,object> record){return Equals(record["state"],"inflight")||Equals(record["state"],"unknown");}
        void Validate(List<Dictionary<string,object>> rows){
            if(rows.Count>300)throw new IOException("Life journal limit");var ids=new HashSet<string>();
            foreach(var row in rows){Guid id;
                if(row==null||!(row.Count==Fields.Length||row.Count==Fields.Length+1&&(row.ContainsKey("gathering")||row.ContainsKey("crafting")))||Fields.Any(field=>!row.ContainsKey(field))||!(row["requestId"] is string)||!Guid.TryParse((string)row["requestId"],out id)||id==Guid.Empty||!ids.Add(id.ToString("D"))||!Text(row["accountId"],100)||!Text(row["characterId"],100)||!Text(row["displayName"],160)||!new[]{"gathering","altering","crafting","collect"}.Contains(row["action"] as string)||!new[]{"inflight","unknown","registered","completed","rejected","stopped"}.Contains(row["state"] as string)||!Integer(row["startedAt"],1,8640000000000000L)||!(Equals(row["action"],"collect")?row["expectedWings"]==null:Integer(row["expectedWings"],5,5)))throw new IOException("Life journal invalid");
                if(row.ContainsKey("gathering")){if(!Equals(row["action"],"gathering"))throw new IOException("Life journal invalid");ValidateGathering(row["gathering"]);}
                if(row.ContainsKey("crafting")){if(!Equals(row["action"],"crafting"))throw new IOException("Life journal invalid");ValidateCrafting(row["crafting"]);}
                if(Equals(row["state"],"stopped")&&(!Equals(row["action"],"gathering")||!row.ContainsKey("gathering")))throw new IOException("Life journal invalid");
            }
        }
        static void ValidateGathering(object value){var g=value as Dictionary<string,object>;var keys=new[]{"additionalQuantity","beforeOwned","targetOwned","currentOwned","allowAutoStop","stopReason","stopState"};if(g==null||g.Count!=keys.Length||keys.Any(k=>!g.ContainsKey(k))||!Integer(g["additionalQuantity"],1,100)||!Integer(g["beforeOwned"],0,9007199254740891L)||!Integer(g["targetOwned"],1,9007199254740991L)||Convert.ToInt64(g["targetOwned"])!=Convert.ToInt64(g["beforeOwned"])+Convert.ToInt64(g["additionalQuantity"])||!Integer(g["currentOwned"],0,9007199254740991L)||!(g["allowAutoStop"] is bool)||!(g["stopReason"]==null||Equals(g["stopReason"],"goal")||Equals(g["stopReason"],"manual"))||!new[]{"none","waiting","requested","unavailable","unknown"}.Contains(g["stopState"] as string))throw new IOException("Life gathering journal invalid");}
        static void ValidateCrafting(object value){var c=value as Dictionary<string,object>;if(c==null||c.Count!=3||!c.ContainsKey("craftCount")||!c.ContainsKey("outputPerCraft")||!c.ContainsKey("expectedOutput")||!Integer(c["craftCount"],1,5)||!Integer(c["outputPerCraft"],1,1000000)||!Integer(c["expectedOutput"],1,5000000)||Convert.ToInt64(c["expectedOutput"])!=Convert.ToInt64(c["craftCount"])*Convert.ToInt64(c["outputPerCraft"]))throw new IOException("Life crafting journal invalid");}
        List<Dictionary<string,object>> Read(){
            if(!File.Exists(FilePath))return new List<Dictionary<string,object>>();
            if(new FileInfo(FilePath).Length>Limit+4096)throw new IOException("Life journal limit");
            var bytes=ProtectedData.Unprotect(File.ReadAllBytes(FilePath),entropy,DataProtectionScope.CurrentUser);
            if(bytes.Length>Limit)throw new IOException("Life journal limit");
            var envelope=json.DeserializeObject(Utf8.GetString(bytes)) as Dictionary<string,object>;
            if(envelope==null||envelope.Count!=3||!envelope.ContainsKey("schemaVersion")||!(Equals(envelope["schemaVersion"],1)||Equals(envelope["schemaVersion"],2)||Equals(envelope["schemaVersion"],3))||!envelope.ContainsKey("environment")||!Equals(envelope["environment"],environment)||!envelope.ContainsKey("records")||!(envelope["records"] is object[]))throw new IOException("Life journal invalid");
            var rows=((object[])envelope["records"]).Select(value=>value as Dictionary<string,object>).ToList();Validate(rows);return rows;
        }
        void Write(List<Dictionary<string,object>> rows){
            Validate(rows);var bytes=Utf8.GetBytes(json.Serialize(new {schemaVersion=rows.Any(row=>row.ContainsKey("crafting"))?3:rows.Any(row=>row.ContainsKey("gathering"))?2:1,environment=environment,records=rows}));
            if(bytes.Length>Limit)throw new IOException("Life journal limit");
            var encrypted=ProtectedData.Protect(bytes,entropy,DataProtectionScope.CurrentUser);var temporary=FilePath+"."+Guid.NewGuid().ToString("N")+".tmp";
            Directory.CreateDirectory(Path.GetDirectoryName(FilePath));
            try{using(var stream=new FileStream(temporary,FileMode.CreateNew,FileAccess.Write,FileShare.None)){stream.Write(encrypted,0,encrypted.Length);stream.Flush(true);}if(File.Exists(FilePath))File.Replace(temporary,FilePath,null);else File.Move(temporary,FilePath);}
            finally{if(File.Exists(temporary))File.Delete(temporary);}
        }
        bool PeerUnresolved(){foreach(var mode in new[]{"development","production"}){if(mode==environment)continue;var file=Path.Combine(rootPath,mode,"ergon-actions-v1.dpapi");if(File.Exists(file)){var peer=new DesktopLifeJournal(rootPath,mode,false);if(peer.Locked(()=>peer.Read().Any(Unresolved)))return true;}}return false;}
        public bool HasUnresolved(){return Locked(()=>Read().Any(Unresolved))||PeerUnresolved();}
        public void Begin(string requestId,string accountId,string characterId,string action,string displayName,int? expectedWings){Locked(()=>{
            var rows=Read();Guid id;if(!Guid.TryParse(requestId,out id)||id==Guid.Empty||rows.Any(row=>Equals(row["requestId"],id.ToString("D")))||rows.Any(Unresolved)||PeerUnresolved())throw new IOException("Life action blocked");
            long now=(long)(DateTime.UtcNow-new DateTime(1970,1,1)).TotalMilliseconds;
            rows.RemoveAll(row=>!Unresolved(row)&&now-Convert.ToInt64(row["startedAt"])>30L*86400000);
            while(rows.Count>=300){var oldest=rows.FindIndex(row=>!Unresolved(row));if(oldest<0)throw new IOException("Unresolved journal full");rows.RemoveAt(oldest);}
            rows.Add(new Dictionary<string,object>{{"requestId",id.ToString("D")},{"accountId",accountId},{"characterId",characterId},{"action",action},{"displayName",displayName},{"expectedWings",expectedWings},{"startedAt",now},{"state","inflight"}});
            Write(rows);return true;
        });}
        public void SetOutcome(string requestId,string state){Locked(()=>{
            Guid id;if(!Guid.TryParse(requestId,out id)||!new[]{"unknown","registered","completed","rejected","stopped"}.Contains(state))throw new ArgumentException();
            var rows=Read();var record=rows.SingleOrDefault(row=>Equals(row["requestId"],id.ToString("D")));
            if(record==null||!Equals(record["state"],"inflight")||(state=="registered"&&!Equals(record["action"],"altering")))throw new IOException("Life action outcome invalid");
            record["state"]=state;Write(rows);return true;
        });}
        public void UpdateGathering(string requestId,Dictionary<string,object> gathering){Locked(()=>{ValidateGathering(gathering);var rows=Read();var record=rows.SingleOrDefault(row=>Equals(row["requestId"],requestId));if(record==null||!Equals(record["state"],"inflight")||!Equals(record["action"],"gathering"))throw new IOException("Life journal update invalid");record["gathering"]=new Dictionary<string,object>(gathering);Write(rows);return true;});}
        public void UpdateCrafting(string requestId,Dictionary<string,object> crafting){Locked(()=>{ValidateCrafting(crafting);var rows=Read();var record=rows.SingleOrDefault(row=>Equals(row["requestId"],requestId));if(record==null||!Equals(record["state"],"inflight")||!Equals(record["action"],"crafting"))throw new IOException("Life journal update invalid");record["crafting"]=new Dictionary<string,object>(crafting);Write(rows);return true;});}
    }
}
