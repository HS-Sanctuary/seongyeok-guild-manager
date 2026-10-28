using System;
using System.Threading;
using System.Threading.Tasks;
namespace IrisDesktop {
 // Owns no files, CLI, game or renderer authority. Only an in-memory connection.
 public sealed class DesktopOnlineMessage {
  public string connectionId,kind="iris",action;public int sequence;public string expectedAccountId=null;
 }
 public sealed class DesktopOnlineConnection {
  readonly Func<Task<string>> readCookie;readonly Func<string,DesktopOnlineMessage,Task<int>> send;readonly Func<DateTime> now;
  string token,id;int sequence,busy;bool stopped,denied;DateTime next;
  public DesktopOnlineConnection(Func<Task<string>> readCookie,Func<string,DesktopOnlineMessage,Task<int>> send,Func<DateTime> now){this.readCookie=readCookie;this.send=send;this.now=now;}
  DesktopOnlineMessage Message(string action){return new DesktopOnlineMessage {connectionId=id,sequence=++sequence,action=action};}
  async Task LeaveAsync(){if(token!=null&&id!=null&&!denied){var old=token;var message=Message("leave");try{await send(old,message);}catch{/* TTL is authoritative fallback. */}}}
  public async Task TickAsync(){
   if(stopped||Interlocked.CompareExchange(ref busy,1,0)!=0)return;
   try{
    var current=await readCookie();if(stopped)return;
    if(current!=token){await LeaveAsync();if(stopped)return;token=current;id=Guid.NewGuid().ToString();sequence=0;denied=false;next=DateTime.MinValue;}
    if(token==null||denied||now()<next||stopped)return;
    next=now().AddSeconds(300);var status=await send(token,Message("touch"));
    if(status==401||status==403||status==409||status==410)denied=true;
   }catch{/* Transient failure is retried only at next scheduled heartbeat. */}
   finally{Interlocked.Exchange(ref busy,0);}
  }
  public async Task StopAsync(){if(stopped)return;stopped=true;await LeaveAsync();}
 }
}
