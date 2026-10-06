using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Globalization;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace Iris
{
    public sealed class RememberedSelection
    {
        public string AccountId { get; private set; }
        public string CharacterId { get; private set; }
        public RememberedSelection(string accountId, string characterId)
        {
            if (!SafeId(accountId) || !SafeId(characterId)) throw new ArgumentException("Invalid selection.");
            AccountId=accountId; CharacterId=characterId;
        }
        internal static bool SafeId(string value)
        {
            if (String.IsNullOrWhiteSpace(value) || value.Length>100) return false;
            foreach(char c in value) if(Char.IsControl(c)) return false;
            return true;
        }
        public static RememberedSelection Parse(string json)
        {
            try {
                var data=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(json);
                if(data==null || !data.ContainsKey("version") || !Object.Equals(data["version"],1) ||
                    !data.ContainsKey("accountId") || !data.ContainsKey("characterId")) return null;
                return new RememberedSelection(data["accountId"] as string,data["characterId"] as string);
            } catch(ArgumentException) {return null;} catch(InvalidOperationException) {return null;}
        }
        public string Suggest(string accountId, string[] ownedIds)
        {
            return accountId==AccountId && ownedIds!=null && Array.IndexOf(ownedIds,CharacterId)>=0 ? CharacterId : null;
        }
        public static void Save(string path, RememberedSelection selection)
        {
            if(selection==null) throw new ArgumentNullException("selection");
            OverlayPreferences.SaveData(path,new Dictionary<string,object> {
                {"version",1},{"accountId",selection.AccountId},{"characterId",selection.CharacterId}
            });
        }
    }
    public sealed class ConnectionCharacter
    {
        public string Id {get;set;}
        public string Nickname {get;set;}
        public override string ToString() {return Nickname;}
    }
    public sealed class KronosTaskDisplay
    {
        public string Id {get;set;}
        public string Name {get;set;}
        public int Completed {get;set;}
        public int Total {get;set;}
    }
    public sealed class KronosClassDisplay
    {
        public string Id {get;set;}
        public string Name {get;set;}
        public int? Level {get;set;}
    }
    public sealed class KronosEditDisplay
    {
        public string RequestId {get;set;}
        public int Generation {get;set;}
        public int SelectionVersion {get;set;}
        public string AccountId {get;set;}
        public string CharacterId {get;set;}
        public string Category {get;set;}
        public string TaskId {get;set;}
        public int BaseCompleted {get;set;}
        public int DesiredCompleted {get;set;}
        public string PeriodKey {get;set;}
        public string Status {get;set;}
    }
    public sealed class ConnectionDisplay
    {
        public List<ConnectionCharacter> Characters {get;private set;}
        public string[] Values {get;private set;}
        public string AccountId {get;private set;}
        public string SelectedId {get;private set;}
        public int Generation {get;private set;}
        public int SelectionVersion {get;private set;}
        public Dictionary<string,List<KronosTaskDisplay>> Tasks {get;private set;}
        public List<KronosClassDisplay> Classes {get;private set;}
        public bool HasDetails {get;private set;}
        public bool WriteAllowed {get;private set;}
        public Dictionary<string,string> PeriodKeys {get;private set;}
        public List<KronosEditDisplay> PendingEdits {get;private set;}
        public int PendingCount {get {return PendingEdits.Count;}}
        public string SaveState {get;private set;}
        private DateTimeOffset receivedAt;
        public ConnectionDisplay() {Clear();}
        public void Clear()
        {
            Characters=new List<ConnectionCharacter>();AccountId=null;SelectedId=null;
            Generation=0;SelectionVersion=0;
            Tasks=new Dictionary<string,List<KronosTaskDisplay>>();Classes=new List<KronosClassDisplay>();HasDetails=false;
            WriteAllowed=false;PeriodKeys=new Dictionary<string,string>();PendingEdits=new List<KronosEditDisplay>();SaveState="idle";
            Values=new string[] {"연결 대기","—","—","—","—","—"};
        }
        public void Expire(DateTimeOffset now) {if((now-receivedAt).TotalSeconds>60 || now<receivedAt) Clear();}
        public bool Apply(string json, DateTimeOffset now)
        {
            Clear();
            try {
                var root=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(json);
                if(root==null || !(root["generation"] is int) || !(root["selectionVersion"] is int)) return false;
                Generation=(int)root["generation"];SelectionVersion=(int)root["selectionVersion"];
                var status=root["status"] as string;
                var labels=new Dictionary<string,string> {{"disconnected","연결 끊김"},{"stale","연결 만료"},
                    {"waiting-browser","브라우저 승인 대기"},{"waiting-selection","캐릭터 확인 대기"},
                    {"waiting-summary","요약 갱신 대기"},{"connected","생텀 읽기 연결됨"}};
                if(!labels.ContainsKey(status ?? "")) {Clear();return false;}
                var items=root["characters"] as IList;
                if(items==null || items.Count>100) {Clear();return false;}
                AccountId=root["accountId"] as string;
                if(items.Count>0 && !RememberedSelection.SafeId(AccountId)) {Clear();return false;}
                var ids=new HashSet<string>();
                foreach(object entry in items) {
                    var c=entry as Dictionary<string,object>;
                    string id=c==null ? null : c["id"] as string,nickname=c==null ? null : c["nickname"] as string;
                    if(!RememberedSelection.SafeId(id) || !RememberedSelection.SafeId(nickname) || nickname.Length>12 || !ids.Add(id)) {Clear();return false;}
                    Characters.Add(new ConnectionCharacter {Id=id,Nickname=nickname});
                }
                SelectedId=root["selectedId"] as string;
                if(SelectedId!=null && !ids.Contains(SelectedId)) {Clear();return false;}
                Values[0]=labels[status];
                foreach(var c in Characters) if(c.Id==SelectedId) Values[1]=c.Nickname;
                if(status=="connected") {
                    var summary=root["summary"] as Dictionary<string,object>;
                    string[] categories={"daily","weekly","abyss","raid"};
                    for(int i=0;i<4;i++) {
                        var count=summary==null ? null : summary[categories[i]] as Dictionary<string,object>;
                        if(SelectedId==null || count==null || !(count["completed"] is int) || !(count["total"] is int)) {Clear();return false;}
                        int done=(int)count["completed"],total=(int)count["total"];
                        if(done<0 || total<done || total>10000) {Clear();return false;}
                        Values[2+i]=done.ToString(CultureInfo.InvariantCulture)+"/"+total.ToString(CultureInfo.InvariantCulture);
                    }
                }
                object detail;
                if(status=="connected" && root.TryGetValue("details",out detail) && detail!=null && !ApplyDetails(detail,root["summary"] as Dictionary<string,object>)) {Clear();return false;}
                if(!ApplyWriteState(root,status)) {Clear();return false;}
                receivedAt=now;return true;
            } catch(ArgumentException) {Clear();return false;}
              catch(InvalidOperationException) {Clear();return false;}
              catch(KeyNotFoundException) {Clear();return false;}
        }
        private static bool Period(string value)
        {
            DateTimeOffset date;
            return value!=null && System.Text.RegularExpressions.Regex.IsMatch(value,@"^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$") && DateTimeOffset.TryParse(value,CultureInfo.InvariantCulture,DateTimeStyles.AssumeUniversal,out date);
        }
        private bool ApplyWriteState(Dictionary<string,object> root,string status)
        {
            object input;
            string[] categories={"daily","weekly","abyss","raid"};
            if(root.TryGetValue("editQueue",out input) && input!=null) {
                var queue=input as Dictionary<string,object>;
                if(queue==null) return false;
                SaveState=queue["state"] as string;
                if(Array.IndexOf(new[]{"idle","pending","submitted","unknown","saved","failed","conflict"},SaveState)<0) return false;
                var edits=queue["edits"] as IList;
                if(edits==null || edits.Count>200) return false;
                var requests=new HashSet<string>();var ids=new HashSet<string>();
                foreach(object item in edits) {
                    var e=item as Dictionary<string,object>;Guid request;
                    if(e==null || !(e["generation"] is int) || (int)e["generation"]<1 || !(e["selectionVersion"] is int) || (int)e["selectionVersion"]<1 ||
                        !Guid.TryParseExact(e["requestId"] as string,"D",out request) || !requests.Add(request.ToString()) ||
                        !RememberedSelection.SafeId(e["accountId"] as string) || !RememberedSelection.SafeId(e["characterId"] as string) ||
                        !DetailText(e["taskId"] as string,100) || Array.IndexOf(categories,e["category"] as string)<0 ||
                        !ids.Add((string)e["category"]+":"+(string)e["taskId"]) || !Period(e["periodKey"] as string) ||
                        !(e["baseCompleted"] is int) || !(e["desiredCompleted"] is int) || (int)e["baseCompleted"]<0 || (int)e["baseCompleted"]>1000 ||
                        (int)e["desiredCompleted"]<0 || (int)e["desiredCompleted"]>1000 || Array.IndexOf(new[]{"pending","submitted","unknown","failed","conflict"},e["status"] as string)<0) return false;
                    PendingEdits.Add(new KronosEditDisplay {RequestId=request.ToString(),Generation=(int)e["generation"],SelectionVersion=(int)e["selectionVersion"],AccountId=(string)e["accountId"],CharacterId=(string)e["characterId"],Category=(string)e["category"],TaskId=(string)e["taskId"],BaseCompleted=(int)e["baseCompleted"],DesiredCompleted=(int)e["desiredCompleted"],PeriodKey=(string)e["periodKey"],Status=(string)e["status"]});
                }
            }
            if(status!="connected" || !HasDetails || !root.TryGetValue("writeAllowed",out input) || !Object.Equals(input,true)) return true;
            object context;
            if(!root.TryGetValue("writeContext",out context)) return true;
            var dict=context as Dictionary<string,object>;object keys;
            if(dict==null || !dict.TryGetValue("periodKeys",out keys)) return true;
            var periods=keys as Dictionary<string,object>;
            if(periods==null) return true;
            foreach(string category in categories) {
                object key;if(!periods.TryGetValue(category,out key) || !Period(key as string)) {PeriodKeys.Clear();return true;}
                PeriodKeys[category]=(string)key;
            }
            WriteAllowed=true;return true;
        }
        private static bool DetailText(string value,int max)
        {
            if(String.IsNullOrWhiteSpace(value)) return false;
            int count=0;
            for(int i=0;i<value.Length;i++) {
                if(Char.IsControl(value[i])) return false;
                if(Char.IsHighSurrogate(value[i]) && i+1<value.Length && Char.IsLowSurrogate(value[i+1])) i++;
                if(++count>max) return false;
            }
            return true;
        }
        private bool ApplyDetails(object input,Dictionary<string,object> summary)
        {
            var data=input as Dictionary<string,object>;
            if(data==null || !Object.Equals(data["schemaVersion"],1)) return false;
            var tasks=data["tasks"] as Dictionary<string,object>;
            var classes=data["classes"] as IList;
            if(tasks==null || classes==null || classes.Count>100) return false;
            foreach(string category in new string[]{"daily","weekly","abyss","raid"}) {
                var list=tasks[category] as IList;
                if(list==null || list.Count>200) return false;
                var ids=new HashSet<string>();var rows=new List<KronosTaskDisplay>();int done=0,total=0;
                foreach(object entry in list) {
                    var row=entry as Dictionary<string,object>;
                    if(row==null || !DetailText(row["id"] as string,100) || !ids.Add(row["id"] as string) ||
                       !DetailText(row["name"] as string,120) || !(row["completed"] is int) || !(row["total"] is int)) return false;
                    int d=(int)row["completed"],t=(int)row["total"];
                    if(d<0 || t<1 || t>1000 || d>t) return false;
                    done+=d;total+=t;rows.Add(new KronosTaskDisplay{Id=(string)row["id"],Name=(string)row["name"],Completed=d,Total=t});
                }
                var count=summary[category] as Dictionary<string,object>;
                if(done!=(int)count["completed"] || total!=(int)count["total"]) return false;
                Tasks[category]=rows;
            }
            var classIds=new HashSet<string>();
            foreach(object entry in classes) {
                var row=entry as Dictionary<string,object>;
                if(row==null || !DetailText(row["id"] as string,100) || !classIds.Add(row["id"] as string) || !DetailText(row["name"] as string,120)) return false;
                object level=row["level"];
                if(level!=null && (!(level is int) || (int)level<1 || (int)level>1000)) return false;
                Classes.Add(new KronosClassDisplay{Id=(string)row["id"],Name=(string)row["name"],Level=level==null ? (int?)null : (int)level});
            }
            HasDetails=true;return true;
        }
    }
    // Owns a child process and its private stdin pipe. Never attaches a native
    // capability to an already-running or unverified local server.
    public sealed class OwnedServer : IDisposable
    {
        private System.Diagnostics.Process child;
        private HttpClient client;
        private string capability;
        private bool ready, disposed;
        private int port;
        public async Task<bool> StartAsync(string scriptPath, int serverPort)
        {
            if (disposed || child != null || serverPort < 1 || serverPort > 65535) return false;
            string fullPath = Path.GetFullPath(scriptPath);
            if (!File.Exists(fullPath) || fullPath.IndexOf('"') >= 0) return false;
            var bytes = new byte[32];
            using (var random = System.Security.Cryptography.RandomNumberGenerator.Create()) random.GetBytes(bytes);
            capability = Convert.ToBase64String(bytes).TrimEnd('=').Replace('+','-').Replace('/','_');
            Array.Clear(bytes,0,bytes.Length);
            port = serverPort;
            try
            {
                var info = new System.Diagnostics.ProcessStartInfo("node", "\"" + fullPath + "\"") {
                    UseShellExecute = false, CreateNoWindow = true,
                    RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true,
                    WorkingDirectory = Path.GetDirectoryName(fullPath)
                };
                info.EnvironmentVariables["IRIS_PORT"] = serverPort.ToString(CultureInfo.InvariantCulture);
                child = new System.Diagnostics.Process { StartInfo = info };
                // Drain generic diagnostics without retaining or showing raw payloads.
                child.ErrorDataReceived += delegate { };
                if (!child.Start()) { Dispose(); return false; }
                child.BeginErrorReadLine();
                child.StandardInput.WriteLine(capability);
                child.StandardInput.Flush();
                var line = child.StandardOutput.ReadLineAsync();
                if (await Task.WhenAny(line,Task.Delay(8000)).ConfigureAwait(false) != line ||
                    await line.ConfigureAwait(false) != "IRIS_READY" || child.HasExited) { Dispose(); return false; }
                client = new HttpClient(new HttpClientHandler { UseProxy = false, AllowAutoRedirect = false });
                client.Timeout = TimeSpan.FromSeconds(8);
                client.MaxResponseContentBufferSize = 65536;
                ready = true;
                return true;
            }
            catch { Dispose(); return false; }
        }
        public async Task<string> RequestAsync(string route, string method, string json)
        {
            if (!ready || disposed || child == null || child.HasExited) throw new InvalidOperationException("Owned connection unavailable.");
            if (!((route == "state" && method == "GET") ||
                ((route == "connect" || route == "select" || route == "disconnect" ||
                  route == "edits" || route == "edits/submit" || route == "edits/discard") && method == "POST")))
                throw new ArgumentException("Invalid native request.");
            using (var request = new HttpRequestMessage(new HttpMethod(method), "http://127.0.0.1:" + port.ToString(CultureInfo.InvariantCulture) + "/api/connection/native/" + route))
            {
                request.Headers.Add("X-IRIS-Native",capability);
                if (method == "POST") request.Content = new StringContent(json ?? "{}",Encoding.UTF8,"application/json");
                using (var response = await client.SendAsync(request).ConfigureAwait(false))
                {
                    response.EnsureSuccessStatusCode();
                    return await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                }
            }
        }
        public void CancelRequests() {if(client!=null && !disposed) client.CancelPendingRequests();}
        public void Dispose()
        {
            if (disposed) return;
            disposed = true; ready = false; capability = null;
            if (client != null) client.Dispose();
            if (child != null)
            {
                try {
                    if (!child.HasExited) {
                        child.StandardInput.Close();
                        if (!child.WaitForExit(1000)) { child.Kill(); child.WaitForExit(1000); }
                    }
                } catch (InvalidOperationException) { }
                finally { child.Dispose(); }
            }
        }
    }
    // Separate allowlist from position files: no accounts, game snapshots, or credentials.
    public sealed class DisplayPreferences
    {
        public string Theme { get; set; }
        public int OpacityPercent { get; set; }
        public DisplayPreferences() { Theme = "aureum"; OpacityPercent = 94; }
        public static bool ValidTheme(string theme)
        {
            return theme == "aureum" || theme == "lumen" || theme == "nemeton" ||
                theme == "vesper" || theme == "rosarium" || theme == "elysium";
        }
        public static DisplayPreferences Parse(string json)
        {
            try
            {
                var data = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(json);
                object version, theme, opacity;
                if (data == null || !data.TryGetValue("version", out version) || !(version is int) || (int)version != 1 ||
                    !data.TryGetValue("theme", out theme) || !(theme is string) || !ValidTheme((string)theme) ||
                    !data.TryGetValue("opacityPercent", out opacity) || !(opacity is int) || (int)opacity < 40 || (int)opacity > 100) return null;
                return new DisplayPreferences { Theme = (string)theme, OpacityPercent = (int)opacity };
            }
            catch (ArgumentException) { return null; }
            catch (InvalidOperationException) { return null; }
        }
        public static void Save(string path, DisplayPreferences preferences)
        {
            if (preferences == null || !ValidTheme(preferences.Theme) || preferences.OpacityPercent < 40 || preferences.OpacityPercent > 100)
                throw new ArgumentException("Invalid display preferences.");
            OverlayPreferences.SaveData(path, new Dictionary<string, object> {
                { "version", 1 }, { "theme", preferences.Theme }, { "opacityPercent", preferences.OpacityPercent }
            });
        }
    }
    public sealed class WidgetDisplayPreferences
    {
        private readonly Dictionary<string,int> opacities = new Dictionary<string,int>();
        private static bool Known(string id)
        {
            return id == "center" || id == "stats" || id == "processing" || id == "missions" || id == "kronos" || id == "checkboard";
        }
        public bool SetOpacity(string id,int percent)
        {
            if(!Known(id) || percent < 40 || percent > 100) return false;
            opacities[id] = percent; return true;
        }
        public int GetOpacity(string id,int fallback)
        {
            if(fallback < 40 || fallback > 100) throw new ArgumentException("Invalid opacity fallback.");
            int value; return Known(id) && opacities.TryGetValue(id,out value) ? value : fallback;
        }
        public void Reset() {opacities.Clear();}
        public static WidgetDisplayPreferences Parse(string json)
        {
            try {
                var data = new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(json);
                object version, raw;
                if(data == null || !data.TryGetValue("version",out version) || !(version is int) || (int)version != 1 ||
                    !data.TryGetValue("opacities",out raw)) return null;
                var entries = raw as Dictionary<string,object>;
                if(entries == null || entries.Count > 6) return null;
                var preferences = new WidgetDisplayPreferences();
                foreach(var entry in entries)
                    if(!(entry.Value is int) || !preferences.SetOpacity(entry.Key,(int)entry.Value)) return null;
                return preferences;
            } catch(ArgumentException) {return null;} catch(InvalidOperationException) {return null;}
        }
        public static void Save(string path,WidgetDisplayPreferences preferences)
        {
            if(preferences == null) throw new ArgumentNullException("preferences");
            OverlayPreferences.SaveData(path,new Dictionary<string,object> {
                {"version",1},{"opacities",new Dictionary<string,int>(preferences.opacities)}
            });
        }
    }
    public sealed class OverlayPoint
    {
        public int X { get; set; }
        public int Y { get; set; }
    }

    // Display preferences only. Game snapshots and interaction modes are never serialized.
    public sealed class OverlayPreferences
    {
        public int X { get; set; }
        public int Y { get; set; }
        public bool Collapsed { get; set; }

        public static OverlayPreferences Parse(string json)
        {
            try
            {
                var data = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(json);
                object version, x, y, collapsed;
                if (data == null || !data.TryGetValue("version", out version) || !(version is int) || (int)version != 1 ||
                    !data.TryGetValue("x", out x) || !(x is int) || !data.TryGetValue("y", out y) || !(y is int) ||
                    !data.TryGetValue("collapsed", out collapsed) || !(collapsed is bool)) return null;
                return new OverlayPreferences { X = (int)x, Y = (int)y, Collapsed = (bool)collapsed };
            }
            catch (ArgumentException) { return null; }
            catch (InvalidOperationException) { return null; }
        }

        public static void Save(string path, OverlayPreferences preferences)
        {
            if (preferences == null) throw new ArgumentNullException("preferences");
            SaveData(path, new Dictionary<string, object> {
                { "version", 1 }, { "x", preferences.X }, { "y", preferences.Y }, { "collapsed", preferences.Collapsed }
            });
        }
        internal static void SaveData(string path, Dictionary<string, object> data)
        {
            string fullPath = Path.GetFullPath(path);
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath));
            string temporary = fullPath + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                File.WriteAllText(temporary, new JavaScriptSerializer().Serialize(data), new UTF8Encoding(false));
                if (File.Exists(fullPath)) File.Replace(temporary, fullPath, null);
                else File.Move(temporary, fullPath);
            }
            finally { if (File.Exists(temporary)) File.Delete(temporary); }
        }

        public static OverlayPoint Place(int x, int y, int width, int height, object[] areas)
        {
            if (width <= 0 || height <= 0 || areas == null || areas.Length == 0)
                throw new ArgumentException("Window size and work areas are required.");
            OverlayPoint best = null;
            double bestDistance = double.MaxValue;
            foreach (IDictionary area in areas)
            {
                int left = Convert.ToInt32(area["x"]), top = Convert.ToInt32(area["y"]);
                int areaWidth = Convert.ToInt32(area["width"]), areaHeight = Convert.ToInt32(area["height"]);
                if (areaWidth <= 0 || areaHeight <= 0) continue;
                int clampedX = (int)Math.Max(left, Math.Min((long)x, (long)left + Math.Max(0, areaWidth - width)));
                int clampedY = (int)Math.Max(top, Math.Min((long)y, (long)top + Math.Max(0, areaHeight - height)));
                double dx = (double)x - clampedX, dy = (double)y - clampedY;
                double distance = dx * dx + dy * dy;
                if (distance < bestDistance)
                {
                    bestDistance = distance;
                    best = new OverlayPoint { X = clampedX, Y = clampedY };
                }
            }
            if (best == null) throw new ArgumentException("No valid work area.");
            return best;
        }
    }

    public sealed class OverlayModes
    {
        public bool Hidden { get; private set; }
        public bool ClickThrough { get; private set; }
        public bool SetClickThrough(bool enabled, bool recoveryShortcutRegistered)
        {
            if (enabled && (!recoveryShortcutRegistered || Hidden)) return false;
            ClickThrough = enabled;
            return true;
        }
        public void ToggleHidden()
        {
            Hidden = !Hidden;
            if (!Hidden) ClickThrough = false;
        }
    }

    public sealed class SnapshotReply
    {
        public bool Success { get; set; }
        public string Body { get; set; }
        public bool Cancelled { get; set; }
    }

    // The UI only starts and consumes tasks. No blocking wait on its message loop.
    public sealed class SnapshotPoller : IDisposable
    {
        private readonly HttpClient client;
        private Task<SnapshotReply> pending;
        private CancellationTokenSource cancellation;
        private bool disposed;
        private bool discardReply;
        public bool IsPending { get { return pending != null; } }
        public bool IsCompleted { get { return pending != null && pending.IsCompleted; } }

        public SnapshotPoller() : this(new HttpClientHandler { UseProxy = false, AllowAutoRedirect = false }, 45000) { }
        public SnapshotPoller(HttpMessageHandler handler, int timeoutMilliseconds)
        {
            client = new HttpClient(handler, true);
            client.Timeout = TimeSpan.FromMilliseconds(timeoutMilliseconds);
            client.MaxResponseContentBufferSize = 2000000;
        }
        public bool Start()
        {
            if (disposed || IsPending) return false;
            discardReply = false;
            cancellation = new CancellationTokenSource();
            pending = Read(cancellation.Token);
            return true;
        }
        private async Task<SnapshotReply> Read(CancellationToken token)
        {
            try
            {
                using (var response = await client.GetAsync("http://127.0.0.1:4317/api/snapshot", token).ConfigureAwait(false))
                {
                    if (!response.IsSuccessStatusCode) return new SnapshotReply();
                    string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                    return new SnapshotReply { Success = true, Body = body };
                }
            }
            catch (HttpRequestException) { return new SnapshotReply(); }
            catch (OperationCanceledException) { return new SnapshotReply(); }
            catch (ObjectDisposedException) { return new SnapshotReply(); }
        }
        public SnapshotReply TakeCompleted()
        {
            if (!IsCompleted) return null;
            try
            {
                var reply = pending.GetAwaiter().GetResult();
                return discardReply ? new SnapshotReply { Cancelled = true } : reply;
            }
            finally
            {
                pending = null;
                cancellation.Dispose();
                cancellation = null;
            }
        }
        public void Cancel()
        {
            if (cancellation == null) return;
            discardReply = true;
            cancellation.Cancel();
        }
        public void Dispose()
        {
            if (disposed) return;
            disposed = true;
            Cancel();
            client.Dispose();
            if (cancellation != null) cancellation.Dispose();
        }
    }

    public sealed class SnapshotDisplay
    {
        private const string Empty = "\u2014";
        public bool Connected { get; private set; }
        public DateTimeOffset ObservedAt { get; private set; }
        public string[] Values { get; private set; }
        public string[] ProcessingValues { get; private set; }
        public int[] ProcessingCompleted { get; private set; }
        public int[] ProcessingTotal { get; private set; }
        public SnapshotDisplay() { Clear(); }
        public void Clear()
        {
            Connected = false;
            Values = new string[] { Empty, Empty, Empty, Empty, Empty, Empty, Empty, Empty };
            ProcessingValues = new string[] { Empty, Empty, Empty, Empty, Empty, Empty };
            ProcessingCompleted = new int[6]; ProcessingTotal = new int[6];
        }
        public void Expire(DateTimeOffset now)
        {
            if (Connected && (now - ObservedAt).TotalSeconds > 30) Clear();
        }
        private static object Get(Dictionary<string, object> data, string key)
        {
            object value;
            return data != null && data.TryGetValue(key, out value) ? value : null;
        }
        private static Dictionary<string, object> Map(Dictionary<string, object> data, string key)
        {
            return Get(data, key) as Dictionary<string, object>;
        }
        private static string Number(object value)
        {
            if (!(value is int) && !(value is long) && !(value is double) && !(value is decimal)) return Empty;
            double number = Convert.ToDouble(value);
            return double.IsNaN(number) || double.IsInfinity(number) || number < 0 ? Empty : number.ToString("N0", CultureInfo.InvariantCulture);
        }
        private static bool Available(Dictionary<string, object> data)
        {
            return Object.Equals(Get(data, "available"), true);
        }
        private static string Mission(Dictionary<string, object> data)
        {
            return Available(data) ? Number(Get(data, "completed")) + "/" + Number(Get(data, "total")) : Empty;
        }
        private void ApplyProcessing(Dictionary<string, object> processing)
        {
            var facilities = Get(processing, "facilities") as IList;
            bool available = Available(processing) && facilities != null;
            for (int i = 0; i < 6; i++) ProcessingValues[i] = available ? "대기" : "조회 불가";
            if (!available) return;
            string[] names = { "금속", "목재", "가죽", "옷감", "약품", "식재료" };
            var seen = new bool[6];
            foreach (object entry in facilities)
            {
                var item = entry as Dictionary<string, object>;
                var name = Get(item, "name") as string;
                if (name == null) continue;
                name = System.Text.RegularExpressions.Regex.Replace(name, @"\s", "");
                int index = -1;
                for (int i = 0; i < 6; i++) if (name == names[i] + "가공시설" || name == names[i] + "가공") index = i;
                if (index < 0) continue;
                object completed = Get(item, "completed"), total = Get(item, "total");
                if (seen[index] || !(completed is int) || !(total is int) || (int)completed < 0 || (int)total < (int)completed || (int)total > 10000)
                {
                    seen[index] = true; ProcessingValues[index] = "조회 불가";
                    ProcessingCompleted[index] = 0; ProcessingTotal[index] = 0; continue;
                }
                seen[index] = true;
                ProcessingCompleted[index] = (int)completed; ProcessingTotal[index] = (int)total;
                if ((int)total == 0) { ProcessingValues[index] = "대기"; continue; }
                string time = "시간 미상";
                object secondsValue = Get(item, "remainingSeconds");
                if (secondsValue is int || secondsValue is long || secondsValue is double || secondsValue is decimal)
                {
                    double seconds = Convert.ToDouble(secondsValue);
                    if (!Double.IsNaN(seconds) && !Double.IsInfinity(seconds) && seconds > 0 && seconds <= 31536000)
                    {
                        int remaining = (int)Math.Ceiling(seconds);
                        time = "남은 " + (remaining / 60).ToString(CultureInfo.InvariantCulture) + ":" + (remaining % 60).ToString("D2", CultureInfo.InvariantCulture);
                    }
                }
                if ((int)completed == (int)total) time = "수령 가능";
                ProcessingValues[index] = "완료 " + completed + "/" + total + "\n" + time;
            }
        }
        public bool Apply(string json, DateTimeOffset now)
        {
            Clear();
            try
            {
                var root = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(json);
                var data = Map(root, "data");
                var character = Map(data, "character");
                DateTimeOffset observed;
                if (!Object.Equals(Get(root, "status"), "connected") || character == null ||
                    !DateTimeOffset.TryParse(Get(data, "observedAt") as string, CultureInfo.InvariantCulture, DateTimeStyles.None, out observed) ||
                    (now - observed).TotalSeconds > 30 || (observed - now).TotalSeconds > 5) return false;
                string job = Get(character, "job") as string;
                if (String.IsNullOrWhiteSpace(job)) return false;
                var processing = Map(data, "processing");
                var missions = Map(data, "missions");
                ApplyProcessing(processing);
                Values = new string[] {
                    job + " Lv." + Number(Get(character, "level")),
                    Number(Get(character, "combatScore")), Number(Get(character, "livingScore")),
                    Number(Get(character, "attractivenessScore")), Number(Get(character, "arcaneResistance")), Number(Get(character, "decorScore")),
                    Available(processing) ? Number(Get(processing, "facilityCount")) + "개 · 완료 " + Number(Get(processing, "completed")) : "조회 불가",
                    Mission(Map(missions, "daily")) + " · " + Mission(Map(missions, "weekly"))
                };
                ObservedAt = observed;
                Connected = true;
                return true;
            }
            catch (ArgumentException) { return false; }
            catch (InvalidOperationException) { return false; }
        }
    }
}
