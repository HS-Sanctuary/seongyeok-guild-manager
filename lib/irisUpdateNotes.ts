export type IrisUpdateNotes={schemaVersion:1;version:string;sections:{title:string;items:string[]}[]};
const versionPattern=/^(?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3})$/;
const limit=16384;
function exact(value:unknown,keys:string[]):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
function text(value:unknown,max:number):value is string{return typeof value==='string'&&value.length>0&&value.length<=max&&value===value.trim()&&!/[\x00-\x1f\x7f]/.test(value);}
export function parseIrisUpdateNotes(value:unknown,version:string):IrisUpdateNotes{
 if(!versionPattern.test(version)||!exact(value,['schemaVersion','version','sections'])||value.schemaVersion!==1||value.version!==version||!Array.isArray(value.sections)||value.sections.length<1||value.sections.length>6)throw Error('이 버전의 변경 내용을 확인하지 못했어요.');
 const sections=value.sections.map(section=>{if(!exact(section,['title','items'])||!text(section.title,60)||!Array.isArray(section.items)||section.items.length<1||section.items.length>10||!section.items.every(item=>text(item,400)))throw Error('변경 내용 형식을 확인하지 못했어요.');return {title:section.title,items:section.items as string[]};});
 return {schemaVersion:1,version,sections};
}
/** Public display-only metadata. Never trusted by the installer or rendered as HTML. */
export async function readIrisUpdateNotes(version:string,signal?:AbortSignal,fetcher:typeof fetch=fetch):Promise<IrisUpdateNotes>{
 if(!versionPattern.test(version))throw Error('업데이트 버전을 확인해 주세요.');
 const response=await fetcher(`/IRIS/notes/${version}.json`,{signal,cache:'no-store',credentials:'omit',redirect:'error'});
 if(!response.ok||!response.headers.get('content-type')?.toLowerCase().includes('application/json')||Number(response.headers.get('content-length'))>limit||!response.body)throw Error('변경 내용을 불러오지 못했어요.');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let total=0;
 try{for(;;){const chunk=await reader.read();if(chunk.done)break;total+=chunk.value.byteLength;if(total>limit){await reader.cancel();throw Error('변경 내용이 너무 길어요.');}chunks.push(chunk.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 return parseIrisUpdateNotes(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),version);
}
