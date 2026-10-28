// Read-only preflight. Never installs/starts a container, accepts no DB URL.
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export function pgPreflight(run=spawnSync,image=process.env.ASTRA_TEST_POSTGRES_IMAGE){
 const version=run('docker',['version','--format','{{.Server.Version}}'],{encoding:'utf8',windowsHide:true,timeout:5000});
 const dockerReady=!version.error&&version.status===0&&!!version.stdout?.trim();
 const imagePinned=typeof image==='string'&&/^postgres@sha256:[a-f0-9]{64}$/.test(image);
 let imageLocal=false;
 if(dockerReady&&imagePinned){const found=run('docker',['image','inspect',image,'--format','{{.Id}}'],{encoding:'utf8',windowsHide:true,timeout:5000});imageLocal=!found.error&&found.status===0&&!!found.stdout?.trim();}
 return {status:dockerReady&&imagePinned&&imageLocal?'READY_FOR_SEPARATE_SQL_SETUP':'NOT_RUN',dockerReady,imagePinned,imageLocal,realDatabaseCalls:0,containersStarted:0,note:'No DB URL or operational connection accepted. Docker/approved local digest required; SQL tests remain unexecuted.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(pgPreflight(),null,2));
