using System;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace IrisDesktop {
 public static class OnlineFixture {
  public static void Main(){Run().GetAwaiter().GetResult();Console.WriteLine("PASS native online: tray/hidden-independent, sequence, cookie ABA, failed network, disabled, close, single-flight; synthetic only");}
  static void Assert(bool b,string label){if(!b)throw new Exception(label);}
  static async Task Run(){
   string cookie="A";var time=new DateTime(2026,10,28,12,0,0,DateTimeKind.Utc);var sent=new List<DesktopOnlineMessage>();var tokens=new List<string>();int status=200;
   var p=new DesktopOnlineConnection(()=>Task.FromResult(cookie),(token,message)=>{tokens.Add(token);sent.Add(message);return Task.FromResult(status);},()=>time);
   await p.TickAsync();Assert(sent.Count==1&&sent[0].action=="touch","initial");
   await p.TickAsync();Assert(sent.Count==1,"no duplicate");
   time=time.AddSeconds(299);await p.TickAsync();Assert(sent.Count==1,"before 300 seconds");
   time=time.AddSeconds(1);await p.TickAsync();Assert(sent.Count==2,"hidden/tray heartbeat");
   cookie="B";await p.TickAsync();Assert(sent.Count==4&&tokens[2]=="A"&&sent[2].action=="leave"&&tokens[3]=="B","context old cookie cleanup");
   var b=sent[3].connectionId;cookie="A";await p.TickAsync();Assert(sent.Count==6&&sent[5].connectionId!=sent[0].connectionId&&sent[5].connectionId!=b,"ABA new instance");
   await p.StopAsync();Assert(sent[6].action=="leave"&&sent[6].sequence>sent[5].sequence,"close terminal sequence");
   time=time.AddHours(2);await p.TickAsync();Assert(sent.Count==7,"no work after close");
   int calls=0;var disabled=new DesktopOnlineConnection(()=>Task.FromResult("C"),(token,message)=>{calls++;return Task.FromResult(410);},()=>time);
   await disabled.TickAsync();time=time.AddHours(1);await disabled.TickAsync();Assert(calls==1,"disabled no retries");
   var gate=new TaskCompletionSource<int>();calls=0;
   var pending=new DesktopOnlineConnection(()=>Task.FromResult("D"),(token,message)=>{calls++;return message.action=="touch"?gate.Task:Task.FromResult(200);},()=>time);
   var work=pending.TickAsync();await pending.TickAsync();Assert(calls==1,"single flight");await pending.StopAsync();gate.SetResult(200);await work;await pending.TickAsync();Assert(calls==2,"late ACK cannot restart");
   calls=0;var offline=new DesktopOnlineConnection(()=>Task.FromResult("E"),(token,message)=>{calls++;throw new Exception("synthetic offline");},()=>time);
   await offline.TickAsync();await offline.TickAsync();Assert(calls==1,"bounded retry");time=time.AddSeconds(300);await offline.TickAsync();Assert(calls==2,"network recovery opportunity");
   var cookieGate=new TaskCompletionSource<string>();calls=0;var closing=new DesktopOnlineConnection(()=>cookieGate.Task,(token,message)=>{calls++;return Task.FromResult(200);},()=>time);
   work=closing.TickAsync();await closing.StopAsync();cookieGate.SetResult("F");await work;Assert(calls==0,"cookie read after close cannot touch");
  }
 }
}
