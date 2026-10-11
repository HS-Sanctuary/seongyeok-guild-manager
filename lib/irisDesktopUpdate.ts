export type DesktopUpdateState={supported:true;installedVersion:string;availableVersion:string|null;phase:'idle'|'checking'|'available'|'downloading'|'ready'|'installing'|'error';progress:number;error:null|'check_failed'|'prepare_failed'};
const version=/^(?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3})$/;
function newer(a:string,b:string){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i];}return false;}
export function parseDesktopUpdateState(value:unknown):DesktopUpdateState {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('업데이트 상태를 확인해 주세요.');
 const v=value as Record<string,unknown>,keys=['supported','installedVersion','availableVersion','phase','progress','error'];
 if(Object.keys(v).length!==keys.length||!keys.every(k=>Object.hasOwn(v,k))||v.supported!==true||typeof v.installedVersion!=='string'||!version.test(v.installedVersion)||!(v.availableVersion===null||typeof v.availableVersion==='string'&&version.test(v.availableVersion)&&newer(v.availableVersion,v.installedVersion))||!['idle','checking','available','downloading','ready','installing','error'].includes(String(v.phase))||!Number.isInteger(v.progress)||Number(v.progress)<0||Number(v.progress)>100||!(v.error===null||v.error==='check_failed'||v.error==='prepare_failed')||(['available','downloading','ready','installing'].includes(String(v.phase))&&v.availableVersion===null))throw Error('업데이트 상태를 확인해 주세요.');
 return {...v} as DesktopUpdateState;
}
