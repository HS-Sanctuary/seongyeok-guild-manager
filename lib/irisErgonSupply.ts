import {ergonSnapshotStale,type ErgonRecipe,type ErgonSnapshot} from './irisErgonRead';
import type {ErgonRecipeReference} from './irisErgonReference';
import {parseErgonPlans,type ErgonPlanItem} from './irisErgonPlan';

type Kind='crafting'|'altering';
export type ErgonSupplyStep={kind:Kind|'gathering'|'collect'|'manual';displayName:string;additionalQuantity:number;runs:number|null;expectedOutput:number|null;state:'preview'|'blocked';note:string};
export type ErgonSupplyPreview={steps:ErgonSupplyStep[];issues:string[];referencesNeeded:{kind:Kind;displayName:string}[];wingMinimum:number;wingMaximum:number|null;automaticReady:false};
export type ErgonSupplyInput={kind:Kind;displayName:string;additionalQuantity:number;now:number;materials:ErgonSnapshot<'materials'>|null|undefined;crafting:ErgonSnapshot<'crafting'>|null|undefined;altering:ErgonSnapshot<'altering'>|null|undefined;gathering:ErgonSnapshot<'gathering'>|null|undefined;references:ErgonRecipeReference[]};

/** Read-only supply sketch. Partial reference facts are never execution-authoritative. */
export function buildErgonSupplyPreview(input:ErgonSupplyInput):ErgonSupplyPreview{
 return buildSupply(input,[{id:'single',kind:input.kind,displayName:input.displayName,targetQuantity:input.additionalQuantity}],8);
}
type BatchInput=Omit<ErgonSupplyInput,'kind'|'displayName'|'additionalQuantity'>&{plans:ErgonPlanItem[]};
export function buildErgonSupplyBatchPreview(input:BatchInput):ErgonSupplyPreview{
 return buildSupply(input,input.plans,4);
}
function buildSupply(input:Omit<ErgonSupplyInput,'kind'|'displayName'|'additionalQuantity'>,plans:ErgonPlanItem[],maxDepth:number):ErgonSupplyPreview{
 const result:ErgonSupplyPreview={steps:[],issues:[],referencesNeeded:[],wingMinimum:0,wingMaximum:0,automaticReady:false};
 const issue=(text:string)=>{if(!result.issues.includes(text))result.issues.push(text);};
 const validQuantity=(n:number)=>Number.isSafeInteger(n)&&n>0&&n<=1000000;
 try{parseErgonPlans({schemaVersion:1,items:plans});}catch{issue('계획은 최대 50개, 목표 수량은 1~1,000,000 정수로 확인해 주세요.');result.wingMaximum=null;return result;}
 if(!plans.length)return result;
 if(!input.materials||ergonSnapshotStale(input.materials,input.now)){issue('현재 가방을 다시 조회해 주세요.');return result;}
 const fresh=<K extends 'crafting'|'altering'|'gathering'>(kind:K)=>{const frame=input[kind];return frame&&!ergonSnapshotStale(frame,input.now)?frame:null;};
 const left=new Map<string,number|null>(),gathered=new Map<string,ErgonSupplyStep>();let nodes=0;
 const stock=(name:string)=>{
  if(left.has(name))return left.get(name)!;
  const matches=input.materials!.data.items.filter(row=>row.name===name),bag=matches.filter(row=>row.location==='inventory');
  let count:number|null=null;
  if(new Set(matches.map(row=>row.category)).size<=1&&bag.every(row=>row.locked===false&&row.count!==null&&Number.isSafeInteger(row.count)&&row.count>=0)){
   const sum=bag.reduce((total,row)=>total+row.count!,0);if(Number.isSafeInteger(sum))count=sum;
  }
  left.set(name,count);return count;
 };
 const blocked=(name:string,quantity:number,note:string)=>{issue(note);result.steps.push({kind:'manual',displayName:name,additionalQuantity:quantity,runs:null,expectedOutput:null,state:'blocked',note});};
 const need=(name:string,quantity:number,path:Set<string>,depth:number)=>{
  if(++nodes>32||depth>maxDepth){blocked(name,quantity,'수급 경로가 너무 길어요. 계획을 나눠 주세요.');return;}
  if(!validQuantity(quantity)){blocked(name,quantity,'필요 수량이 너무 커요. 계획을 나눠 주세요.');return;}
  if(path.has(name)){blocked(name,quantity,'재료표에 순환 경로가 있어요. 확인이 필요해요.');return;}
  const owned=stock(name);if(owned===null){blocked(name,quantity,'잠김·동명·미확인 재고를 먼저 확인해 주세요.');return;}
  const used=Math.min(owned,quantity),missing=quantity-used;left.set(name,owned-used);if(!missing)return;
  const providers: {kind:Kind;row:ErgonRecipe}[]=[];
  for(const kind of ['altering','crafting'] as const)for(const row of fresh(kind)?.data.items??[])if(row.name===name)providers.push({kind,row});
  const raw=fresh('gathering')?.data.items.filter(row=>row.name===name)??[];
  if(providers.length+raw.length>1){blocked(name,missing,'같은 품목의 수급 경로가 여러 개예요. 경로를 확인해 주세요.');return;}
  if(providers.length===1){produce(providers[0].kind,name,missing,new Set(path),depth);return;}
  if(raw.length===1&&raw[0].toolOk===true){
   const previous=gathered.get(name),total=(previous?.additionalQuantity??0)+missing;
   if(!validQuantity(total)){blocked(name,missing,'필요 채집 수량이 너무 커요. 계획을 나눠 주세요.');return;}
   gathered.set(name,{kind:'gathering',displayName:name,additionalQuantity:total,runs:Math.ceil(total/100),expectedOutput:total,state:'preview',note:'채집 수확·중지 지연으로 더 확보할 수 있어요.'});return;
  }
  blocked(name,missing,raw.length?'채집 도구를 확인해 주세요.':'수동 확보 또는 수급 경로 확인이 필요해요.');
 };
 const produce=(kind:Kind,name:string,quantity:number,path:Set<string>,depth:number)=>{
  const catalog=fresh(kind),rows=catalog?.data.items.filter(row=>row.name===name)??[];
  if(rows.length!==1){blocked(name,quantity,'품목 목록을 다시 조회하고 경로를 확인해 주세요.');return;}
  if(kind==='crafting'&&catalog?.data.unlocked===false){blocked(name,quantity,'제작 기능이 아직 해금되지 않았어요. 게임에서 조건을 확인해 주세요.');return;}
  const recipe=rows[0],refs=input.references.filter(row=>row.kind===kind&&row.displayName===name);
  if(refs.length!==1||!refs[0].ingredients.length){
   if(!refs.length&&!result.referencesNeeded.some(row=>row.kind===kind&&row.displayName===name))result.referencesNeeded.push({kind,displayName:name});
   blocked(name,quantity,'확인 가능한 참고 재료표가 필요해요.');return;
  }
  const reference=refs[0];
  if(reference.outputPerUnit!==recipe.producedPerUnit||recipe.missing?.some(item=>item.required!==null&&reference.ingredients.some(row=>row.name===item.name&&row.required!==item.required))){blocked(name,quantity,'참고 재료표와 현재 게임의 수량이 달라요.');return;}
  const ingredients:{name:string;required:number|null}[]=reference.ingredients.map(row=>({...row}));
  // Official missing rows are partial too, but every reported dependency must remain visible.
  for(const item of recipe.missing??[]){const index=ingredients.findIndex(row=>row.name===item.name);if(index>=0)ingredients[index]={name:item.name,required:item.required};else ingredients.push({name:item.name,required:item.required});}
  if(ingredients.length>32){blocked(name,quantity,'재료 항목이 너무 많아요. 계획을 나눠 확인해 주세요.');return;}
  issue('참고 재료표 기반 미리보기예요. 전체 재료·최신성이 검증되지 않아 자동 실행하지 않아요.');
  const runs=Math.ceil(quantity/reference.outputPerUnit),expectedOutput=runs*reference.outputPerUnit;
  if(!Number.isSafeInteger(expectedOutput)){blocked(name,quantity,'생산 수량을 계산하지 못했어요.');return;}
  const next=new Set(path);next.add(name);const beforeChildren=result.steps.length;
  for(const item of ingredients){if(item.required===null||!validQuantity(item.required)){blocked(item.name,quantity,'현재 게임의 필요 수량을 확인하지 못했어요.');}else{const required=item.required*runs;need(item.name,required,next,depth+1);}if(nodes>32)break;}
  const state=result.steps.slice(beforeChildren).some(row=>row.state==='blocked')?'blocked':'preview';
  result.steps.push({kind,displayName:name,additionalQuantity:quantity,runs,expectedOutput,state,note:state==='blocked'?'선행 재료를 먼저 확인해야 해요.':kind==='altering'?'가공 등록 뒤 완료품을 수령해야 다음 재료로 사용할 수 있어요.':'목표는 이번에 추가할 결과물이에요.'});
  if(kind==='altering')result.steps.push({kind:'collect',displayName:name,additionalQuantity:expectedOutput,runs:1,expectedOutput,state,note:'시설의 완료품 전체를 수령해요. 비용과 완료 시점은 별도 확인이 필요해요.'});
  // Carry only the unit-rounding surplus, not quantities already reserved for the consuming parent.
  if(state==='preview'){
   // Only the rounded excess is available to other goals; never steal a final target's deliverables.
   const available=stock(name);if(available!==null)left.set(name,available+expectedOutput-quantity);
  }
 };
 // Root is additional production, not a total-inventory goal: do not subtract existing finished items.
 for(const plan of plans){
  if(++nodes>32){blocked(plan.displayName,plan.targetQuantity,'수급 경로가 너무 길어요. 계획을 나눠 주세요.');continue;}
  if(plan.kind!=='gathering'){produce(plan.kind,plan.displayName,plan.targetQuantity,new Set(),0);continue;}
  const rows=fresh('gathering')?.data.items.filter(row=>row.name===plan.displayName)??[];
  if(rows.length!==1||rows[0].toolOk!==true){blocked(plan.displayName,plan.targetQuantity,'최신 채집 품목·도구를 먼저 확인해 주세요.');continue;}
  const total=(gathered.get(plan.displayName)?.additionalQuantity??0)+plan.targetQuantity;
  if(!validQuantity(total)){blocked(plan.displayName,plan.targetQuantity,'필요 채집 수량이 너무 커요. 계획을 나눠 주세요.');continue;}
  gathered.set(plan.displayName,{kind:'gathering',displayName:plan.displayName,additionalQuantity:total,runs:Math.ceil(total/100),expectedOutput:total,state:'preview',note:'추가 채집 목표예요. 실제 수확·중지 지연으로 더 확보할 수 있어요.'});
 }
 result.steps=[...gathered.values(),...result.steps];
 for(const step of result.steps){
  if(step.state==='blocked'||step.kind==='collect'||step.kind==='manual'){result.wingMaximum=null;continue;}
  const minimum=step.kind==='gathering'?Math.ceil(step.additionalQuantity/100)*5:step.kind==='crafting'?Math.ceil(step.runs!/5)*5:step.runs!*5;
  result.wingMinimum+=minimum;
  if(step.kind==='gathering')result.wingMaximum=null;
  else if(result.wingMaximum!==null)result.wingMaximum+=step.runs!*5;
 }
 return result;
}
