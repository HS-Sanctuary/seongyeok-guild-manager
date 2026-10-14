export type ErgonRecipeReference={schemaVersion:1;kind:'crafting'|'altering';displayName:string;source:'installed-reference';modifiedAt:number;outputPerUnit:number;complete:false;ingredients:{name:string;required:number}[]};
const exact=(value:unknown,keys:string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const name=(value:unknown):value is string=>typeof value==='string'&&!!value.trim()&&value.length<=160&&!/[\x00-\x1f\x7f]/.test(value);
const positive=(value:unknown,max:number):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>0&&value<=max;
export function parseErgonReference(kind:'crafting'|'altering',displayName:string,value:unknown):ErgonRecipeReference|null{
 if(value===null)return null;
 if(!exact(value,['schemaVersion','kind','displayName','source','modifiedAt','outputPerUnit','complete','ingredients'])||value.schemaVersion!==1||value.kind!==kind||value.displayName!==displayName||!name(value.displayName)||value.source!=='installed-reference'||value.complete!==false||!positive(value.modifiedAt,8640000000000000)||!positive(value.outputPerUnit,1000000)||!Array.isArray(value.ingredients)||value.ingredients.length>32||value.ingredients.some(row=>!exact(row,['name','required'])||!name(row.name)||!positive(row.required,1000000))||new Set(value.ingredients.map(row=>row.name)).size!==value.ingredients.length)throw Error('참고 재료표의 형식을 확인하지 못했어요.');
 return value as ErgonRecipeReference;
}
