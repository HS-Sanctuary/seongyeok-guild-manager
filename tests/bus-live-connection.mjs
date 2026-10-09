// Read-only deployment diagnostic. No INSERT/UPDATE/DELETE or credential output.
import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!key)throw Error('Public client configuration is unavailable');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
let channel;
try {
  const result=await client.from('parties').select('id').limit(1);
  if(result.error)throw Error('Party baseline SELECT failed');
  console.log('Party baseline SELECT: OK');
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Realtime handshake timed out')),15000);
    channel=client.channel('sanctum-bus-readonly-diagnostic')
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'parties'},()=>{})
      .subscribe(status=>{
        if(status==='SUBSCRIBED'){clearTimeout(timer);console.log('Party Realtime: SUBSCRIBED');resolve();}
        else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timer);reject(Error(`Realtime handshake: ${status}`));}
      });
  });
} finally {if(channel)await client.removeChannel(channel);client.realtime.disconnect();}
