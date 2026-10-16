import {ergonSnapshotStale,type ErgonRecipe,type ErgonSnapshot} from './irisErgonRead';
import type {ErgonRecipeReference} from './irisErgonReference';

export type ErgonNeed={name:string;required:number|null;owned:number|null;stored:number|null;deficit:number|null};
/** MissingIngredients is a partial list for one craft, not a complete bill of materials. */
export function calculateErgonNeeds(recipe:ErgonRecipe,additionalQuantity:number,materials:ErgonSnapshot<'materials'>|null|undefined,now:number,reference?:ErgonRecipeReference|null):{coverage:'partial'|'unavailable';runs:number|null;rows:ErgonNeed[];referenceUsed:boolean;conflict:boolean}{
 const output=recipe.producedPerUnit;
 const runs=Number.isSafeInteger(additionalQuantity)&&additionalQuantity>0&&additionalQuantity<=1000000&&output!==null&&Number.isSafeInteger(output)&&output>0?Math.ceil(additionalQuantity/output):null;
 const conflict=!!reference&&(reference.displayName!==recipe.name||reference.outputPerUnit!==recipe.producedPerUnit||recipe.missing?.some(item=>item.required!==null&&reference.ingredients.some(row=>row.name===item.name&&row.required!==item.required))===true);
 const referenceUsed=!!reference&&!conflict;
 const ingredients:{name:string;required:number|null;owned:number|null}[]=referenceUsed?reference!.ingredients.map(item=>({...item,owned:null})):[];
 for(const item of recipe.missing??[]){const existing=ingredients.findIndex(row=>row.name===item.name);if(existing>=0)ingredients[existing]=item;else ingredients.push(item);}
 if(!ingredients.length)return {coverage:'unavailable',runs,rows:[],referenceUsed,conflict};
 const rows=ingredients.map(item=>{
  let owned=item.owned,stored:number|null=null;
  if(materials){
   owned=null;
   if(!ergonSnapshotStale(materials,now)){
    const matching=materials.data.items.filter(row=>row.name===item.name);
    const bag=matching.filter(row=>row.location==='inventory');
    if(new Set(matching.map(row=>row.category)).size<=1&&bag.every(row=>row.locked===false&&row.count!==null&&Number.isSafeInteger(row.count)&&row.count>=0)){
     const total=bag.reduce((sum,row)=>sum+row.count!,0);if(Number.isSafeInteger(total))owned=total;
    }
    const storage=matching.filter(row=>row.location!=='inventory');
    if(new Set(matching.map(row=>row.category)).size<=1&&storage.every(row=>row.locked===false&&row.count!==null&&Number.isSafeInteger(row.count)&&row.count>=0)){
     const total=storage.reduce((sum,row)=>sum+row.count!,0);if(Number.isSafeInteger(total))stored=total;
    }
   }
  }
  const needed=runs!==null&&item.required!==null&&Number.isSafeInteger(item.required)&&item.required>0?runs*item.required:null;
  const required=needed!==null&&Number.isSafeInteger(needed)?needed:null;
  if(owned!==null&&(!Number.isSafeInteger(owned)||owned<0))owned=null;
  return {name:item.name,required,owned,stored,deficit:required!==null&&owned!==null?Math.max(0,required-owned):null};
 });
 return {coverage:'partial',runs,rows,referenceUsed,conflict};
}
