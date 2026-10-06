using System;
using System.Collections.Generic;
using System.Globalization;
using System.Web.Script.Serialization;

namespace IrisDesktop {
    // No cookie, code, token, filesystem-path or generic invocation methods.
    public sealed class DesktopBridge {
        readonly DesktopStore store;
        readonly bool development;
        Uri document;
        long lastId;
        public long Epoch { get; private set; }
        public event EventHandler HideRequested;
        public event EventHandler CloseRequested;
        Func<object> overlayState;Func<bool,bool> overlayInput;Func<int,bool> overlayOpacity;
        public void BindOverlay(Func<object> state,Func<bool,bool> input,Func<int,bool> opacity){overlayState=state;overlayInput=input;overlayOpacity=opacity;}
        public DesktopBridge(DesktopStore store, bool development) {
            this.store = store; this.development = development; Epoch = 1;
        }
        public void Revoke() { document = null; lastId = 0; Epoch++; }
        public bool Activate(Uri source) {
            if (!DesktopHostPolicy.ValidateNavigation(source, development) || source.AbsolutePath != "/iris/desktop") return false;
            document = source; return true;
        }
        public string Handle(Uri source, string json) {
            var serializer = new JavaScriptSerializer { MaxJsonLength = 1052672, RecursionLimit = 32 };
            string id = ""; long epoch = 0;
            try {
                if (document == null || source == null || source.GetLeftPart(UriPartial.Path) != document.GetLeftPart(UriPartial.Path) ||
                    !DesktopHostPolicy.ValidateNavigation(source, development) || json == null || json.Length > 1052672) throw new ArgumentException();
                var message = serializer.DeserializeObject(json) as Dictionary<string, object>;
                if (message == null || message.Count != 5 || !message.ContainsKey("version") || !Equals(message["version"], 1) ||
                    !message.ContainsKey("id") || !message.ContainsKey("epoch") || !message.ContainsKey("method") || !message.ContainsKey("payload")) throw new ArgumentException();
                id = message["id"] as string; long sequence;
                if (id == null || !Int64.TryParse(id, NumberStyles.None, CultureInfo.InvariantCulture, out sequence) || sequence < 1 || sequence.ToString(CultureInfo.InvariantCulture) != id) throw new ArgumentException();
                if (!(message["epoch"] is int || message["epoch"] is long)) throw new ArgumentException();
                epoch = Convert.ToInt64(message["epoch"]);
                if (epoch != Epoch || sequence <= lastId || sequence > 9007199254740991L) throw new ArgumentException();
                lastId = sequence;
                object value = null;
                switch (message["method"] as string) {
                    case "store.load":
                        if (message["payload"] != null) throw new ArgumentException();
                        var restored = store.Load(); value = restored == null ? null : serializer.DeserializeObject(restored); break;
                    case "store.replace":
                        store.Replace(serializer.Serialize(message["payload"])); break;
                    case "window.hide":
                        if (message["payload"] != null) throw new ArgumentException();
                        var handler = HideRequested; if (handler != null) handler(this, EventArgs.Empty); break;
                    case "window.close":
                        if (message["payload"] != null) throw new ArgumentException();
                        var close = CloseRequested; if (close != null) close(this, EventArgs.Empty); break;
                    case "overlay.state":
                        if(message["payload"]!=null||overlayState==null)throw new ArgumentException();value=overlayState();break;
                    case "overlay.input":
                        var input=message["payload"] as Dictionary<string,object>;
                        if(input==null||input.Count!=1||!input.ContainsKey("clickThrough")||!(input["clickThrough"] is bool)||overlayInput==null||!overlayInput((bool)input["clickThrough"]))throw new ArgumentException();
                        value=overlayState();break;
                    case "overlay.opacity":
                        var opacity=message["payload"] as Dictionary<string,object>;
                        if(opacity==null||opacity.Count!=1||!opacity.ContainsKey("percent")||!(opacity["percent"] is int)||overlayOpacity==null)throw new ArgumentException();
                        int percent=(int)opacity["percent"];if(percent<50||percent>100||!overlayOpacity(percent))throw new ArgumentException();value=overlayState();break;
                    default: throw new ArgumentException();
                }
                return serializer.Serialize(new { version = 1, id = id, epoch = epoch, ok = true, value = value });
            } catch {
                // Never serialize exceptions containing local paths, ciphertext or user data.
                return serializer.Serialize(new { version = 1, id = id ?? "", epoch = epoch, ok = false, error = "protected_store_unavailable" });
            }
        }
    }
}
