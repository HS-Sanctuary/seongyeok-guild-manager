using System;
using System.Threading.Tasks;
using System.Windows.Forms;
namespace IrisDesktop {
 // Owner destruction must complete a pending native approval without approving it.
 internal static class DesktopLifeProgressApproval {
  internal static async Task<bool> RequestAsync(Control owner,Func<bool> prompt){
   if(owner==null||prompt==null)throw new ArgumentNullException();
   var answer=new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
   EventHandler unavailable=(sender,args)=>answer.TrySetResult(false);
   owner.Disposed+=unavailable;owner.HandleDestroyed+=unavailable;
   try{
    if(owner.IsDisposed||owner.Disposing||!owner.IsHandleCreated)return false;
    try{owner.BeginInvoke(new Action(()=>{if(answer.Task.IsCompleted)return;try{answer.TrySetResult(!owner.IsDisposed&&!owner.Disposing&&prompt());}catch(Exception error){answer.TrySetException(error);}}));}catch{answer.TrySetResult(false);}
    return await answer.Task.ConfigureAwait(false);
   }finally{owner.Disposed-=unavailable;owner.HandleDestroyed-=unavailable;}
  }
 }
}
