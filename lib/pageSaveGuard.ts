export async function flushPageBeforeAccountChange(){
  const promises:Promise<unknown>[]=[];
  window.dispatchEvent(new CustomEvent('sanctum_before_account_change',{detail:{waitUntil:(promise:Promise<unknown>)=>promises.push(promise)}}));
  try{await Promise.all(promises);}catch(error){window.dispatchEvent(new Event('sanctum_account_change_aborted'));throw error;}
}
