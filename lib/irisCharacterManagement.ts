import type {DesktopCharacter} from './irisDesktopTransport';
export type CharacterMetaIntent={action:'create'|'update'|'makeMain';characterId?:string;nickname?:string;job?:string;expected?:{nickname:string;job:string;isMain:boolean}};
export type CharacterMetaDirectory={accountId:string;characters:DesktopCharacter[];jobs:string[]};
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function name(v:unknown):v is string{return typeof v==='string'&&v.length>0&&v.length<=80&&v===v.trim()&&!/[\x00-\x1f\x7f]/.test(v);}
export function parseCharacterMetaIntent(raw:unknown):CharacterMetaIntent{
 if(!object(raw)||!['create','update','makeMain'].includes(String(raw.action)))throw Error('캐릭터 변경 요청을 확인해 주세요.');
 const keys=raw.action==='create'?['action','nickname','job']:raw.action==='update'?['action','characterId','nickname','job','expected']:['action','characterId','expected'];
 if(Object.keys(raw).length!==keys.length||!keys.every(k=>Object.hasOwn(raw,k)))throw Error('허용되지 않은 캐릭터 변경 항목이에요.');
 if(raw.action!=='create'&&(!name(raw.characterId)||!object(raw.expected)||Object.keys(raw.expected).length!==3||!name(raw.expected.nickname)||!name(raw.expected.job)||typeof raw.expected.isMain!=='boolean'))throw Error('기존 캐릭터 정보를 다시 읽어 주세요.');
 if(raw.action!=='makeMain'&&(!name(raw.nickname)||!name(raw.job)||([...raw.nickname].length>12&&(raw.action==='create'||raw.nickname!==(raw.expected as {nickname:string}).nickname))))throw Error('닉네임은 1~12자로 입력해 주세요.');
 return structuredClone(raw) as CharacterMetaIntent;
}
export function parseCharacterMetaDirectory(raw:unknown,accountId:string):CharacterMetaDirectory{
 if(!object(raw)||raw.accountId!==accountId||!Array.isArray(raw.characters)||raw.characters.length>100||!Array.isArray(raw.jobs)||raw.jobs.length>200||!raw.jobs.every(name))throw Error('캐릭터 관리 목록을 확인하지 못했어요.');
 const ids=new Set<string>();const characters=raw.characters.map((row:unknown)=>{if(!object(row))throw Error('캐릭터 정보를 확인해 주세요.');const id=typeof row.id==='number'?String(row.id):row.id;if(!name(id)||ids.has(id)||!name(row.nickname)||!name(row.job)||typeof row.isMain!=='boolean'||typeof row.editable!=='boolean')throw Error('캐릭터 정보를 확인해 주세요.');ids.add(id);return {id,nickname:row.nickname,job:row.job,alias:typeof row.alias==='string'?row.alias:null,isMain:row.isMain,editable:row.editable};});return {accountId,characters,jobs:[...new Set(raw.jobs)]};
}
