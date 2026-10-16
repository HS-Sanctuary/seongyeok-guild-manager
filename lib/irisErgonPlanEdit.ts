import {parseErgonPlans,type ErgonPlanItem} from './irisErgonPlan';

export type PlanEdit=
 |{type:'quantity';id:string;quantity:number}
 |{type:'replace';id:string;kind:ErgonPlanItem['kind'];displayName:string;newId:string}
 |{type:'remove';id:string};

export function editErgonPlans(items:ErgonPlanItem[],edit:PlanEdit):{items:ErgonPlanItem[];selectedId:string|null;duplicateId:string|null}{
 const rows=parseErgonPlans({schemaVersion:1,items}),index=rows.findIndex(row=>row.id===edit.id);
 if(index<0)throw Error('작업을 다시 선택해 주세요.');
 const current=rows[index];
 if(edit.type==='replace'){
  if(current.kind===edit.kind&&current.displayName===edit.displayName)return {items:rows,selectedId:current.id,duplicateId:null};
  const candidate={...current,id:edit.newId,kind:edit.kind,displayName:edit.displayName};
  parseErgonPlans({schemaVersion:1,items:[candidate]});
  if(rows.some(row=>row.id===edit.newId))throw Error('새 작업 식별자를 확인해 주세요.');
  const duplicate=rows.find(row=>row.kind===edit.kind&&row.displayName===edit.displayName);
  if(duplicate)return {items:rows,selectedId:duplicate.id,duplicateId:duplicate.id};
  rows[index]=candidate;
 }else if(edit.type==='quantity')rows[index]={...current,targetQuantity:edit.quantity};
 else if(edit.type==='remove')rows.splice(index,1);
 else throw Error('작업 편집을 확인해 주세요.');
 const next=parseErgonPlans({schemaVersion:1,items:rows});
 return {items:next,selectedId:edit.type==='remove'?(next[index]??next[index-1])?.id??null:next[index].id,duplicateId:null};
}
