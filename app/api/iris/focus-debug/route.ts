import {mkdir,stat,appendFile} from 'node:fs/promises';
import {join} from 'node:path';
export const runtime='nodejs';
export const dynamic='force-dynamic';
let writes:Promise<void>=Promise.resolve();
/** Local dev only. Fixed bounded destination, boolean metadata, no auth or game operations. */
export async function POST(request:Request){
 const url=new URL(request.url);
 if(process.env.NODE_ENV!=='development'||!['localhost','127.0.0.1'].includes(url.hostname)||request.headers.get('origin')!==url.origin)return new Response(null,{status:404});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return new Response(null,{status:400});
 const raw=await request.text();if(raw.length>1024)return new Response(null,{status:400});
 let value:Record<string,unknown>;
 try{value=JSON.parse(raw);}catch{return new Response(null,{status:400});}
 const booleans=['menu','capable','documentFocus','keyboard','pointer','modal','editing','selection'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==11||!['inactive','skip','request','reply','error','close'].includes(String(value.phase))||!['none','kronos','synaxis','ergon','settings'].includes(String(value.surface))||!booleans.every(key=>typeof value[key]==='boolean')||value.returned!==null&&typeof value.returned!=='boolean')return new Response(null,{status:400});
 const folder=join(process.cwd(),'.superpowers','sdd','2026-10-18-iris-floating-dialogs'),file=join(folder,'focus-trace.ndjson');
 writes=writes.catch(()=>{}).then(async()=>{
  await mkdir(folder,{recursive:true});const size=await stat(file).then(info=>info.size).catch(()=>0);if(size>=65536)return;
  await appendFile(file,JSON.stringify({at:new Date().toISOString(),state:value})+'\n','utf8');
 });
 try{await writes;return new Response(null,{status:204});}catch{return new Response(null,{status:503});}
}
