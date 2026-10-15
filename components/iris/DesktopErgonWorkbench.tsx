'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {calculateErgonNeeds} from '@/lib/irisErgonNeeds';
import {ergonSnapshotStale} from '@/lib/irisErgonRead';
import type {ErgonPlanItem} from '@/lib/irisErgonPlan';
import type {useErgonSession} from './useErgonSession';
import type {ErgonRecipeReference} from '@/lib/irisErgonReference';
import {DesktopErgonSupplyPanel} from './DesktopErgonSupplyPanel';
import {summarizeErgonFacilities} from '@/lib/irisErgonFacilities';
import {ErgonFacilityIcon} from './ErgonFacilityIcon';

type Session=ReturnType<typeof useErgonSession>;
export function DesktopErgonWorkbench({session,plan,characterLabel,disabled,readReference,onAddPlan,onCollection,collectionControls,view='all'}:{session:Session;plan:ErgonPlanItem|undefined;characterLabel:string;disabled:boolean;readReference?:(kind:'altering'|'crafting',name:string)=>Promise<ErgonRecipeReference|null>;onAddPlan:(kind:ErgonPlanItem['kind'],name:string,quantity:number)=>void;onCollection?:(facility:string)=>void;collectionControls?:ReactNode;view?:'all'|'overview'|'materials'}){
 const referenceKey=[plan?.kind??'',plan?.displayName??''].join('\u001f');
 const planKind=plan?.kind,planName=plan?.displayName;
 const [referenceState,setReferenceState]=useState<{key:string;value:ErgonRecipeReference|null}>({key:'',value:null});
 useEffect(()=>{let current=true;if(!disabled&&readReference&&planKind&&planName&&planKind!=='gathering'){void readReference(planKind,planName).then(value=>{if(current)setReferenceState({key:referenceKey,value});}).catch(()=>{if(current)setReferenceState({key:referenceKey,value:null});});}return()=>{current=false;};},[disabled,readReference,planKind,planName,referenceKey]);
 const reference=referenceState.key===referenceKey?referenceState.value:null;
 const [supplyOpen,setSupplyOpen]=useState(false);
 const {refresh}=session;
 const needGather=!session.snapshots.gathering||ergonSnapshotStale(session.snapshots.gathering,session.now),needAlter=!session.snapshots.altering||ergonSnapshotStale(session.snapshots.altering,session.now),needCraft=!session.snapshots.crafting||ergonSnapshotStale(session.snapshots.crafting,session.now);
 useEffect(()=>{if(!supplyOpen||disabled)return;if(needGather)void refresh('gathering');if(needAlter)void refresh('altering');if(needCraft)void refresh('crafting');},[supplyOpen,disabled,needGather,needAlter,needCraft,refresh]);
 const catalog=plan?session.snapshots[plan.kind]:null;
 const recipe=plan&&catalog&&catalog.kind!=='gathering'?catalog.data.items.find(row=>row.name===plan.displayName):null;
 const needs=recipe&&catalog&&!ergonSnapshotStale(catalog,session.now)?calculateErgonNeeds(recipe,plan!.targetQuantity,session.snapshots.materials,session.now,reference):null;
 const currency=session.currencies,wings=currency?.items.find(row=>row.name==='정령의 날개')?.amount;
 const works=session.snapshots.works;
 const facilities=summarizeErgonFacilities(works,session.now);
 const number=(value:number|null|undefined)=>value==null?'미확인':value.toLocaleString('ko-KR');
 return <>
  {view!=='materials'&&<section aria-label="현재 캐릭터 생활 현황" className="iris-ergon-overview"><div className="iris-ergon-title"><h3>{characterLabel||'선택 캐릭터'} · 생활 현황</h3><button type="button" className="iris-desktop-button" data-ergon-role="neutral" disabled={disabled||session.loadingKinds.length>0||session.currencyBusy} onClick={()=>void session.refreshOverview()}>현황 새로고침</button></div>
   <div className="iris-ergon-metrics"><p>정령의 날개 <strong>{number(wings)}</strong></p><p>가방 무게 <strong>{number(session.snapshots.inventory?.data.weight)} / {number(session.snapshots.inventory?.data.maxWeight)}</strong></p><p>가공 완료 <strong>{number(works?.data.completedCount)}</strong></p></div>
   <p className="iris-caption">대기 중 10초마다 갱신</p>
   {session.currencyNotice&&<p role="alert">{session.currencyNotice}</p>}
   <div className="iris-ergon-facility-grid">{facilities.facilities.map(facility=><div className="iris-ergon-facility-status" key={facility.name}><div className="iris-ergon-facility-heading"><ErgonFacilityIcon name={facility.name}/><div><strong>{facility.name.replace(/\s*시설$/,'')}</strong><span className="iris-caption">완료 {number(facility.completed)}/{number(facility.registered)}{!facilities.fresh?' · 갱신 필요':facility.unknown?' · 확인 필요':facility.completed===0&&facility.nextReadySeconds!==null?` · ${Math.ceil(facility.nextReadySeconds/60)}분`:''}</span></div></div>{onCollection&&<button type="button" className="iris-desktop-button" data-ergon-role="add" aria-label={`${facility.name} 수령하러가기`} disabled={disabled||!facilities.fresh||facility.completed===0||facility.unknown>0} onClick={()=>onCollection(facility.name)}>수령</button>}</div>)}</div>
   {!!facilities.facilities.length&&<details className="iris-ergon-collection-help"><summary>수령 안내</summary><p className="iris-caption">시설의 완료품 전체 수령 · 비용 미확인 · 자동 재등록 없음</p>{collectionControls}</details>}
   {works&&<details className="iris-ergon-facilities"><summary>가공 시설 ({works.data.items.length}칸)</summary>{works.data.items.map((work,index)=><p key={index}><strong>{work.facility} · {work.name}</strong><span>{work.completed===true?'수령 가능':work.remainingSeconds===null?'남은 시간 미확인':`${Math.ceil(work.remainingSeconds/60)}분 남음`}</span></p>)}{!works.data.items.length&&<p className="iris-caption">조회된 가공 작업이 없어요.</p>}</details>}
  </section>}
  {view!=='overview'&&plan&&<section aria-label="선택 작업 재료" className="iris-ergon-needs"><h3>필요 재료 · 추가 {number(plan.targetQuantity)}개 기준</h3>{[...(needs?.rows??[])].sort((a,b)=>(b.deficit??Infinity)-(a.deficit??Infinity)).map((item,index)=>{
   const processing=session.snapshots.altering?.data.items.filter(row=>row.name===item.name)??[];
   const gathering=session.snapshots.gathering?.data.items.filter(row=>row.name===item.name&&row.name==='통나무')??[];
   return <div key={item.name+index} data-material-state={item.deficit===null?'unknown':item.deficit>0?'shortage':'enough'}><strong>{item.name}</strong><span className="iris-ergon-status">{item.deficit===null?'? 확인 필요':item.deficit>0?'! 재료 부족':'✓ 보유 충분'}</span><p>필요 {item.required??'?'}개 · 가방 {item.owned??'?'}개 · 부족 {item.deficit??'?'}개</p>{item.deficit!==null&&item.deficit>0&&(processing.length===1||gathering.length===1)&&<button type="button" className="iris-desktop-button" data-ergon-role="add" disabled={disabled} onClick={()=>onAddPlan(processing.length===1?'altering':'gathering',item.name,item.deficit!)}>{processing.length===1?'가공 계획 추가':'채집 계획 추가'}</button>}</div>;
  })}{needs?.conflict&&<p role="alert">참고 재료표와 현재 게임의 산출량 또는 재료량이 달라 참고 계산을 제외했어요.</p>}{needs?.coverage==='partial'?<p className="iris-caption">전체 재료표가 아니라 조회에 나타난 재료만 계산했어요.</p>:<p className="iris-caption">전체 재료표 미확인 · 선택 수량 전체의 재료 충족을 보장하지 않아요.</p>}<details className="iris-ergon-provenance"><summary>재료표 출처·주의사항</summary>{needs?.referenceUsed&&reference&&<p className="iris-caption">설치된 생활 커넥터 참고 재료표 · {new Date(reference.modifiedAt).toLocaleDateString('ko-KR')} 자료. 현재 게임의 전체 재료표로 검증된 자료는 아니에요.</p>}<p className="iris-caption">부족분은 가방 기준이에요. 가공 계획 등록은 생산 완료가 아니며, 수령 뒤 다시 확인해요.</p></details>
   {plan.kind!=='gathering'&&<details onToggle={event=>setSupplyOpen(event.currentTarget.open)}><summary>부족분 수급 순서 보기</summary>{supplyOpen&&<DesktopErgonSupplyPanel plan={plan} snapshots={session.snapshots} now={session.now} active={!disabled} rootReference={reference} rootReady={referenceState.key===referenceKey} readReference={readReference} onAddPlan={onAddPlan}/>}</details>}
  </section>}
 </>;
}
