import {ergonSnapshotStale,type ErgonReadKind,type ErgonData} from './irisErgonRead';
import type {ErgonSnapshots} from './irisErgonSession';
import type {CurrencySnapshot} from './irisCurrencies';
/** Informational preflight only. Native execution must independently repeat every check. */
export function checkErgonStart(input:{snapshots:ErgonSnapshots;currencies:CurrencySnapshot|null;kind:'gathering'|'altering'|'crafting';displayName:string;now:number;unresolved:boolean;identityConfirmed:boolean}){
 const blockers:string[]=[],warnings:string[]=[];
 const fresh=(kind:ErgonReadKind)=>{const value=input.snapshots[kind];return value&&!ergonSnapshotStale(value,input.now)?value:null;};
 const activity=fresh('activity')?.data as ErgonData['activity']|undefined;
 const flags=['autoPlaying','autoTraveling','dead','reviving','inCombat','dialoguePlaying','waitingForSelection','inBattlefield','tutorialPlaying','inScenario','sequencePlaying','performancePlaying','minigame','housingEdit','abyssSequence'] as const;
 if(!activity||activity.dungeonState!=='NotInDungeon'||activity.interactionType!=='None'||flags.some(key=>activity[key]!==false))blockers.push('게임 상태가 작업 가능 상태인지 확인하지 못했어요. 전투·이동·다른 자동 작업 중이거나 확인되지 않은 상태예요.');
 const inventory=fresh('inventory')?.data as NonNullable<ErgonSnapshots['inventory']>['data']|undefined;
 if(!inventory||inventory.weight===null||inventory.maxWeight===null||inventory.maxWeight<=0||inventory.weight>=inventory.maxWeight)blockers.push('가방 무게를 확인하거나 공간을 확보해 주세요.');
 const currency=input.currencies,age=currency?input.now-Date.parse(currency.observedAt):NaN;
 const matches=currency?.items.filter(row=>row.name==='정령의 날개')??[];
 const wings=matches.length===1?matches[0].amount:null;
 if(!Number.isFinite(age)||age<0||age>=15000||wings===null||wings<5)blockers.push('최신 정령의 날개 보유량을 확인해 주세요. 명령 한 번에 5개가 필요해요.');
 const catalog=fresh(input.kind)?.data as {items:{name:string;toolOk?:boolean|null;available?:boolean|null}[];unlocked?:boolean|null}|undefined;
 const items=catalog?.items.filter(row=>row.name===input.displayName)??[];
 if(items.length!==1||(input.kind==='gathering'?items[0]?.toolOk!==true:items[0]?.available!==true)||(input.kind==='crafting'&&catalog?.unlocked!==true))blockers.push('목록에서 이 품목의 도구·재료·제작 조건을 확인해 주세요.');
 if(input.unresolved)blockers.push('결과가 불명확한 이전 작업을 먼저 확인해야 해요. 자동 재시도는 하지 않아요.');
 if(!input.identityConfirmed)blockers.push('생텀에서 선택한 캐릭터와 실제 게임 캐릭터는 별개예요. 게임에서 작업할 캐릭터를 직접 확인해야 해요.');
 if(input.kind==='gathering')warnings.push('한 번에 최대 100개이며 목표 개수에서 정확히 멈추는 기능은 아직 없어요. 낚시 품목은 무기한 진행될 수 있어 제외해야 해요.');
 if(input.kind==='altering')warnings.push('가공 명령 완료는 작업 등록이에요. 생산 완료·수령과는 달라요.');
 blockers.push('보호 작업 기록과 native 실행 연결을 준비 중이에요. 이 점검은 게임 행동을 시작하지 않아요.');
 return {canExecute:false as const,wings,costPerCommand:5,blockers,warnings};
}
