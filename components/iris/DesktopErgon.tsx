'use client';
import {useState} from 'react';
import {useErgonSession,type ErgonSessionProps} from './useErgonSession';
import {calculateErgonPlan} from '@/lib/irisErgonPlan';
import type {ErgonRecipe} from '@/lib/irisErgonRead';
import {checkErgonStart} from '@/lib/irisErgonStart';
import {DesktopErgonExecution} from './DesktopErgonExecution';
import type {createDesktopStore} from '@/lib/irisDesktopStore';
type ActionApi=Pick<ReturnType<typeof createDesktopStore>,'lifeActionCapabilities'|'setLifeContext'|'prepareLifeAction'|'confirmLifeAction'|'cancelLifeAction'|'lifeActionState'|'lifeActionHistory'|'stopLifeAction'>;
type ConnectedProps=ErgonSessionProps&{actions?:ActionApi;accountLabel?:string;characterLabel?:string;onActionBusyChange?:(busy:boolean)=>void};
export function DesktopErgonRecipeStatus({recipe,unlocked}:{recipe:ErgonRecipe;unlocked?:boolean|null}){
 return <><span>{recipe.available===true?'가능':recipe.available===false?'재료·조건 확인':'조건 미확인'}</span>{unlocked===false&&<p className="iris-caption">제작 기능이 잠겨 있어요.</p>}{recipe.reason&&<p className="iris-caption">{recipe.reason}</p>}{recipe.missing&&<p className="iris-caption">현재 1회 부족분: {recipe.missing.map(m=>`${m.name} 필요 ${m.required??'?'} / 보유 ${m.owned??'?'}`).join(', ')}</p>}</>;
}
const areas={plan:{label:'작업 계획',text:'목표 품목·횟수·재료 소모를 먼저 확인하고 작업 순서를 계획하는 공간이에요.'},materials:{label:'재료 확보',text:'필요한 재료와 현재 재고를 비교하는 조회 기능을 순서대로 연결할 예정이에요.'},execution:{label:'자동 실행',text:'시설 하나의 수령부터 대상·소모 한도·중지 방법을 확인한 뒤 연결해요. 지금은 게임 명령을 실행하지 않아요.'},history:{label:'작업 기록',text:'아이리스가 요청한 작업과 실제 확인된 결과를 구분해서 보여줄 예정이에요. 생텀 숙제 기록과는 따로 관리해요.'}} as const;
export function DesktopErgon(props:ConnectedProps|{read?:undefined}={}){
  return props?.read?<ConnectedErgon {...props}/>:<ErgonShell/>;
}
function ErgonShell(){
  const [area,setArea]=useState<keyof typeof areas>('plan');
  return <div className="iris-ergon">
    <header><h2>에르곤 - 스마트 채집 가공 제작 생활 매니저</h2></header>
    <nav aria-label="에르곤 기능">{Object.entries(areas).map(([id,item])=><button key={id} type="button" className="iris-desktop-button" aria-pressed={area===id} aria-controls="iris-ergon-area" onClick={()=>setArea(id as keyof typeof areas)}>{item.label}</button>)}</nav>
    <section id="iris-ergon-area" aria-label={areas[area].label}><h3>{areas[area].label}</h3><p className="iris-caption">{areas[area].text}</p><p className="iris-ergon-stage">화면 준비 · 게임 연결 전</p></section>
  </div>;
}
function ConnectedErgon(props:ConnectedProps){
 const [area,setArea]=useState<keyof typeof areas>('plan'),[kind,setKind]=useState<'gathering'|'altering'|'crafting'>('altering'),[search,setSearch]=useState(''),[quantity,setQuantity]=useState('1'),[location,setLocation]=useState('inventory'),[message,setMessage]=useState('');
 const session=useErgonSession({...props,watchWorks:area==='materials'});
 const [checked,setChecked]=useState(false),[planId,setPlanId]=useState('');
 const selectedPlan=session.plans.find(row=>row.id===planId)??session.plans[0];
 const disabled=!props.active||props.locked,now=session.now,catalog=session.snapshots[kind];
 const refresh=(readKind:Parameters<typeof session.refresh>[0])=>void session.refresh(readKind);
 const save=(next:typeof session.plans)=>{try{session.changePlans(next);setMessage('');}catch{setMessage('계획은 최대 50개, 목표는 1~1,000,000 정수로 입력해 주세요.');}};
 const title={gathering:'채집',altering:'가공',crafting:'제작'};
 return <div className="iris-ergon"><header><h2>에르곤 - 스마트 채집 가공 제작 생활 매니저</h2></header>
  <nav aria-label="에르곤 기능">{Object.entries(areas).map(([id,item])=><button key={id} type="button" className="iris-desktop-button" disabled={disabled} aria-pressed={area===id} onClick={()=>setArea(id as keyof typeof areas)}>{item.label}</button>)}</nav>
  {session.notice&&<p role="alert">{session.notice} 이전 값은 조회 당시 정보예요.</p>}{message&&<p role="alert">{message}</p>}
  {area==='plan'&&<section aria-label="작업 계획">
   <div className="iris-ergon-controls">{(['gathering','altering','crafting'] as const).map(value=><button type="button" key={value} className="iris-desktop-button" disabled={disabled||session.loadingKinds.includes(value)} onClick={()=>{setKind(value);refresh(value);}}>{title[value]} 목록 조회</button>)}</div>
   <label>품목 검색<input value={search} onChange={e=>setSearch(e.target.value)} type="search"/></label>
   <label>목표 수량<input type="number" min="1" max="1000000" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
   <p className="iris-caption">목표는 결과물 개수예요. 계획은 이 PC에만 저장돼요. 전체 재료표와 자동 작업은 아직 연결 전이에요.</p>
   {session.unreadable?<div role="alert">저장된 계획을 읽지 못했어요. 원본을 보존 중이에요.<button type="button" className="iris-desktop-button" onClick={()=>session.changePlans([],true)}>손상된 계획 초기화</button></div>:!session.persistent&&<p role="alert">로컬 저장에 실패했어요. 현재 계획은 창을 닫기 전까지만 유지돼요.</p>}
   {catalog&&<><p className="iris-caption">{title[kind]} {catalog.data.items.length}개 · {new Date(catalog.observedAt).toLocaleTimeString('ko-KR')} 조회</p><div className="iris-ergon-list">{catalog.data.items.filter(row=>row.name.includes(search)).map((row,index)=><article key={row.name+':'+index}><strong>{row.name}</strong>{'available' in row?<DesktopErgonRecipeStatus recipe={row} unlocked={'unlocked' in catalog.data?catalog.data.unlocked:null}/>:<span>{row.toolOk===true?'도구 확인됨':'도구 확인 필요'}</span>}<button type="button" className="iris-desktop-button" disabled={disabled||!session.ready||session.unreadable} onClick={()=>save([...session.plans,{id:crypto.randomUUID(),kind,displayName:row.name,targetQuantity:Number(quantity)}])}>계획에 추가</button></article>)}</div></>}
   <h3>내 작업 계획 ({session.plans.length}/50)</h3>{session.plans.map(item=>{const calculation=calculateErgonPlan(item,session.snapshots[item.kind],now);return <article key={item.id}><strong>{item.displayName} · {title[item.kind]}</strong><label>목표 수량<input disabled={disabled||session.unreadable} type="number" min="1" max="1000000" step="1" value={item.targetQuantity} onChange={e=>save(session.plans.map(row=>row.id===item.id?{...row,targetQuantity:Number(e.target.value)}:row))}/></label><p>{calculation.requiredRuns===null?'다시 조회하면 계산할 수 있어요.':`${item.kind==='gathering'?'최소 예상':'예상'} ${calculation.requiredRuns}회 · 날개 ${calculation.wingMinimum}${calculation.wingMaximum===null?'개 이상 (상한 미확인)':calculation.wingMaximum!==calculation.wingMinimum?`~${calculation.wingMaximum}개 (명령 묶음에 따라 달라짐)`:'개'}`}</p>{calculation.reasons.map(reason=><p key={reason} className="iris-caption">{reason}</p>)}<button disabled={disabled||session.unreadable} type="button" className="iris-desktop-button" onClick={()=>save(session.plans.filter(row=>row.id!==item.id))}>계획에서 빼기</button></article>;})}
  </section>}
  {area==='materials'&&<section aria-label="재료 확보"><div className="iris-ergon-controls">{(['materials','inventory','works'] as const).map(value=><button key={value} type="button" className="iris-desktop-button" disabled={disabled||session.loadingKinds.includes(value)} onClick={()=>refresh(value)}>{value==='materials'?'재료 조회':value==='inventory'?'가방 무게 조회':'가공 현황 조회'}</button>)}</div>
   <label>보관 위치<select value={location} onChange={e=>setLocation(e.target.value)}><option value="inventory">가방</option><option value="account_storage">계정 창고</option><option value="character_storage">캐릭터 창고</option></select></label><label>재료 검색<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   {session.snapshots.inventory&&<p>가방 무게 {session.snapshots.inventory.data.weight??'?'} / {session.snapshots.inventory.data.maxWeight??'?'}</p>}
   <div className="iris-ergon-list">{session.snapshots.materials?.data.items.filter(row=>row.location===location&&row.name.includes(search)).map((row,index)=><article key={index}><strong>{row.name}</strong><span>{row.count??'?'}개 · {row.locked===true?'잠김':row.locked===false?'잠금 해제':'잠금 미확인'}</span></article>)}</div>
   <h3>가공 중인 작업</h3>{session.snapshots.works?.data.items.map((row,index)=><article key={index}><strong>{row.facility} · {row.name}</strong><span>{row.completed===true?'수령 가능':row.remainingSeconds===null?'시간 미확인':`${row.remainingSeconds}초 남음`}</span></article>)}
  </section>}
  <section hidden={area!=='execution'} aria-label="자동 실행"><label>작업 계획<select disabled={disabled} value={selectedPlan?.id??''} onChange={event=>{setPlanId(event.target.value);setChecked(false);}}>{session.plans.map(item=><option key={item.id} value={item.id}>{item.displayName} · {item.targetQuantity}개</option>)}</select></label>{!props.actions&&<><h3>작업 시작 전 점검</h3><button type="button" className="iris-desktop-button" disabled={disabled||!selectedPlan||session.loadingKinds.length>0||session.currencyBusy} onClick={()=>{setChecked(true);void session.inspect(selectedPlan.kind);}}>시작 전 점검</button>{session.currencyNotice&&<p role="alert">{session.currencyNotice}</p>}{checked&&selectedPlan&&(()=>{const result=checkErgonStart({snapshots:session.snapshots,currencies:session.currencies,kind:selectedPlan.kind,displayName:selectedPlan.displayName,now:session.now,unresolved:false,identityConfirmed:false});return <><p>정령의 날개 보유 {result.wings??'미확인'}개 · 채집/가공 등록/제작 명령당 {result.costPerCommand}개</p>{result.blockers.map(text=><p className="iris-caption" key={text}>{text}</p>)}{result.warnings.map(text=><p className="iris-caption" key={text}>{text}</p>)}</>;})()}</>}<DesktopErgonExecution api={props.actions} plan={selectedPlan??null} accountId={props.accountId} characterId={props.characterId} accountLabel={props.accountLabel??''} characterLabel={props.characterLabel??''} active={props.active&&area==='execution'} locked={props.locked} onBusyChange={props.onActionBusyChange}/></section>
  {area==='history'&&<section><h3>{areas.history.label}</h3><p className="iris-caption">{areas.history.text}</p><p>보호 작업 기록은 자동 실행 탭의 1회 작업 아래에서 확인해 주세요. 조회나 계획 추가는 생산 성공으로 기록하지 않아요.</p></section>}
 </div>;
}
