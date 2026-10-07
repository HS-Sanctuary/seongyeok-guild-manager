import {IrisWriteError} from './irisKronosWrite';
export type ClassEditRequest={requestId:string;accountId:string;characterId:string;classId:string;baseLevel:number|null;desiredLevel:number};
export type ClassWriteContext={classId:string;editable:boolean;baseLevel:number|null};
const level=(v:unknown):v is number=>Number.isSafeInteger(v)&&(v as number)>=1&&(v as number)<=1000;
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function validateClassEdit(value:unknown):ClassEditRequest{
  const fields=['requestId','accountId','characterId','classId','baseLevel','desiredLevel'];
  if(!object(value)||Object.keys(value).length!==fields.length||Object.keys(value).some(k=>!fields.includes(k))||
    typeof value.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestId)||
    [value.accountId,value.characterId,value.classId].some(v=>typeof v!=='string'||!v||v.length>100||/[\u0000-\u0020\u007f]/u.test(v))||
    (value.baseLevel!==null&&!level(value.baseLevel))||!level(value.desiredLevel))throw new IrisWriteError(400);
  return value as ClassEditRequest;
}
export function classWriteContext(raw:unknown,classId:string,className:string):ClassWriteContext{
  if(raw!==null&&!object(raw))return {classId,editable:false,baseLevel:null};
  if(raw===null||!Object.hasOwn(raw,className))return {classId,editable:true,baseLevel:null};
  return level(raw[className])?{classId,editable:true,baseLevel:raw[className]}:{classId,editable:false,baseLevel:null};
}
export function mergeClassLevel(raw:unknown,className:string,baseLevel:number|null,desiredLevel:number):{levels:Record<string,unknown>;changed:boolean}{
  if(typeof className!=='string'||!className.trim()||['__proto__','constructor','prototype'].includes(className)||
    (baseLevel!==null&&!level(baseLevel))||!level(desiredLevel))throw new IrisWriteError(400);
  const context=classWriteContext(raw,'unused',className);
  if(!context.editable)throw new IrisWriteError(503);
  const levels={...(raw as Record<string,unknown>|null??{})};
  if(context.baseLevel===desiredLevel)return {levels,changed:false};
  if(context.baseLevel!==baseLevel)throw new IrisWriteError(409);
  return {levels:{...levels,[className]:desiredLevel},changed:true};
}
