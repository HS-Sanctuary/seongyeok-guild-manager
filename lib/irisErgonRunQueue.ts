type Input={action:string;displayName:string;targetQuantity:number;owned:number|null;producedPerRun:number|null;wings:number|null;blocked:boolean};
export type ErgonQueuePreview=Input&{remainingUnits:number|null;requiredRuns:number|null;stagedRuns:number;maximumWings:number;ready:boolean;reason:string;commandBudget:number;wingBudget:number;confirmedIds:string[]};
export function planErgonQueue(input:Input,budget:{commands:number;wings:number;confirmedIds:string[]}={commands:5,wings:25,confirmedIds:[]}):ErgonQueuePreview{
 const valid=Number.isSafeInteger(input.targetQuantity)&&input.targetQuantity>0&&input.targetQuantity<=1000000&&input.owned!==null&&Number.isSafeInteger(input.owned)&&input.owned>=0&&input.producedPerRun!==null&&Number.isSafeInteger(input.producedPerRun)&&input.producedPerRun>0&&input.wings!==null&&Number.isSafeInteger(input.wings)&&input.wings>=0&&Number.isSafeInteger(budget.commands)&&budget.commands>=0&&budget.commands<=5&&Number.isSafeInteger(budget.wings)&&budget.wings>=0&&budget.wings<=25;
 const remainingUnits=valid?Math.max(0,input.targetQuantity-input.owned!):null;
 const requiredRuns=remainingUnits===null?null:Math.ceil(remainingUnits/input.producedPerRun!);
 const stagedRuns=valid&&!input.blocked&&input.action==='crafting'&&requiredRuns!==null?Math.min(requiredRuns,budget.commands,Math.floor(budget.wings/5),Math.floor(input.wings!/5)):0;
 const ready=stagedRuns>0;
 return {...input,remainingUnits,requiredRuns,stagedRuns,maximumWings:stagedRuns*5,ready,reason:ready?'각 명령 전 재조회·최종 확인 필요':input.blocked?'이전 작업 결과를 먼저 확인해 주세요.':input.action!=='crafting'?'이 품목은 시설·채집 소요를 확인할 수 없어 묶음 실행을 계획할 수 없어요.':valid&&remainingUnits===0?'목표 수량을 보유 중이에요.':'재고·제작량·날개를 확인해 주세요.',commandBudget:budget.commands,wingBudget:budget.wings,confirmedIds:[...budget.confirmedIds]};
}
export function advanceErgonQueue(current:ErgonQueuePreview,result:{state:string;owned:number|null;wings:number|null;id?:string}):ErgonQueuePreview{
 const confirmed=result.state==='completed'&&current.ready&&typeof result.id==='string'&&result.id.length>0&&!current.confirmedIds.includes(result.id)&&result.wings!==null&&current.wings!==null&&current.wings-result.wings===5&&result.owned!==null&&current.owned!==null&&result.owned>=current.owned;
 if(!confirmed)return planErgonQueue({...current,owned:result.owned,wings:result.wings,blocked:true},{commands:0,wings:0,confirmedIds:current.confirmedIds});
 return planErgonQueue({...current,owned:result.owned,wings:result.wings,blocked:false},{commands:current.commandBudget-1,wings:current.wingBudget-5,confirmedIds:[...current.confirmedIds,result.id!]});
}
