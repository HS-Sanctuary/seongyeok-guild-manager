using System;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
namespace IrisDesktop {
 public static class CurrencyObservationFixture {
  public static void AssertStaleNotPersisted(DesktopCurrencyStore store){
   bool current=true;var pending=new TaskCompletionSource<object>();
   var refresh=store.RefreshAsync("stale-owner",()=>pending.Task,()=>current);
   current=false;
   pending.SetResult(new JavaScriptSerializer().DeserializeObject("{\"observedAt\":\"2026-10-22T01:00:00.000Z\",\"items\":[{\"name\":\"gold\",\"amount\":123}]}"));
   bool failed=false;try{refresh.GetAwaiter().GetResult();}catch(InvalidOperationException){failed=true;}
   if(!failed||store.Load("stale-owner")!=null)throw new Exception("Revoked observation reached disk");
  }
 }
}
