import type { FashionItem } from './gnosisLocal';
export const FASHION_KEY = 'gnosis_fashion_library_v1';
export const FASHION_TRANSFER_KEY = 'gnosis_fashion_transfer_v1';
export const FASHION_WORK_KEY = 'gnosis_fashion_work_v1';
export type FashionLook = {version:1;id:string;item:FashionItem;image:string|null;updatedAt:string};
type StoragePort = Pick<Storage,'getItem'|'setItem'>;
export function validFashionItem(value:unknown):value is FashionItem {
  if(!value||typeof value!=='object')return false;
  const row=value as FashionItem;
  return typeof row.itemName==='string'&&row.itemName.length<=100&&typeof row.rarity==='string'&&row.rarity.length<=40&&Array.isArray(row.dyeParts)&&row.dyeParts.length<=12&&row.dyeParts.every(color=>typeof color==='string'&&/^#[0-9a-f]{6}$/i.test(color));
}
export function parseFashion(value:unknown):FashionLook {
  const row=value as FashionLook|null;
  if(!row||row.version!==1||typeof row.id!=='string'||!row.id||row.id.length>100||!validFashionItem(row.item)||typeof row.updatedAt!=='string'||!Number.isFinite(Date.parse(row.updatedAt))||!(row.image===null||(typeof row.image==='string'&&row.image.length<=300000&&/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(row.image))))throw new Error('코디 정보를 읽을 수 없어요. 기존 저장은 보존했어요.');
  return {version:1,id:row.id,item:{...row.item,dyeParts:[...row.item.dyeParts]},image:row.image,updatedAt:row.updatedAt};
}
export function readFashion(storage:StoragePort):FashionLook[]{
  const raw=storage.getItem(FASHION_KEY);const rows:unknown=raw?JSON.parse(raw):[];
  if(!Array.isArray(rows)||rows.length>10)throw new Error('개인 저장함을 읽을 수 없어요. 기존 저장은 보존했어요.');
  const parsed=rows.map(parseFashion);
  if(new Set(parsed.map(row=>row.id)).size!==parsed.length)throw new Error('저장함의 중복 기록을 확인해주세요.');
  return parsed;
}
export function saveFashion(storage:StoragePort,value:FashionLook){
  const look=parseFashion(value),rows=readFashion(storage);
  const next=[look,...rows.filter(row=>row.id!==look.id)];
  if(next.length>10)throw new Error('개인 저장은 최대 10개예요. 기존 코디를 불러와 수정해주세요.');
  storage.setItem(FASHION_KEY,JSON.stringify(next));return next;
}
export function mergeFashionDraft<T extends object>(draft:T,value:unknown){
  const fashionLook=parseFashion(value);
  return {...draft,category:'패션',useFashion:true,itemData:fashionLook.item,fashionLook};
}
