// Build an exact source copy without touching the running dev server or loading .env files.
import {mkdtempSync,cpSync,existsSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
const root=process.cwd(),directory=mkdtempSync(join(tmpdir(),'sanctum-iris-build-'));
for(const name of ['app','components','hooks','lib','public','types','next.config.ts','postcss.config.mjs','package.json','package-lock.json','tsconfig.json','next-env.d.ts','proxy.ts','middleware.ts']){
  if(existsSync(resolve(root,name)))cpSync(resolve(root,name),join(directory,name),{recursive:true});
}
symlinkSync(resolve(root,'node_modules'),join(directory,'node_modules'),'junction');
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
// Public synthetic placeholders only; no operational credentials or .env copied.
delete env.SUPABASE_SERVICE_ROLE_KEY;delete env.SUPABASE_SECRET_KEY;
env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';env.NEXT_PUBLIC_SUPABASE_ANON_KEY='synthetic-build-only';
console.log('Isolated build directory: '+directory);
const child=spawn(process.execPath,[join(directory,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:directory,env,stdio:'inherit',windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
