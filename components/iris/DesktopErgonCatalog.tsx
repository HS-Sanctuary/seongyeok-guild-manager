'use client';
import type {ErgonFavorite} from '@/lib/irisErgonFavorites';
import type {ErgonPlanItem} from '@/lib/irisErgonPlan';

type Props={kind:ErgonPlanItem['kind'];search:string;items:{name:string;available:boolean|null;reason?:string|null;producedPerUnit?:number|null}[];favorites:ErgonFavorite[];onlyFavorites:boolean;disabled:boolean;replacing:boolean;onKindChange:(kind:ErgonPlanItem['kind'])=>void;onSearchChange:(value:string)=>void;onFavoritesOnlyChange:(value:boolean)=>void;onToggleFavorite:(item:ErgonFavorite)=>void;onChoose:(item:ErgonFavorite)=>void;onCancelReplace:()=>void};
const unavailable:Record<string,string>={queue_full:'시설 가득 참',not_enough_ingredient:'재료 부족',insufficient_facility_level:'시설 단계 부족',ingredient_locked:'재료 잠김',insufficient_transfer_cost:'원격 사용 비용 부족',requires_user_interaction:'게임에서 직접 등록 필요'};
export function DesktopErgonCatalog({kind,search,items,favorites,onlyFavorites,disabled,replacing,onKindChange,onSearchChange,onFavoritesOnlyChange,onToggleFavorite,onChoose,onCancelReplace}:Props){
 const starred=(name:string)=>favorites.some(item=>item.kind===kind&&item.displayName===name);
 const visible:Props['items']=onlyFavorites?favorites.filter(item=>item.kind===kind).map(item=>items.find(row=>row.name===item.displayName)??{name:item.displayName,available:null}):items;
 const occurrences=new Map<string,number>();
 const matches=visible.map(row=>{const occurrence=occurrences.get(row.name)??0;occurrences.set(row.name,occurrence+1);return {...row,rowKey:JSON.stringify([kind,row.name,occurrence])};}).filter(row=>row.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 return <>
  <div className="iris-ergon-controls">{(['gathering','altering','crafting'] as const).map(value=><button type="button" key={value} className="iris-desktop-button" aria-pressed={kind===value} disabled={disabled} onClick={()=>onKindChange(value)}>{({gathering:'채집',altering:'가공',crafting:'제작'})[value]} 목록 조회</button>)}</div>
  <label>품목 검색<input value={search} onChange={event=>onSearchChange(event.target.value)} type="search"/></label>
  <div className="iris-ergon-filters"><button type="button" className="iris-desktop-button" aria-pressed={!onlyFavorites} onClick={()=>onFavoritesOnlyChange(false)}>전체</button><button type="button" className="iris-desktop-button" aria-pressed={onlyFavorites} onClick={()=>onFavoritesOnlyChange(true)}>즐겨찾기 ({favorites.filter(item=>item.kind===kind).length})</button>{replacing&&<button type="button" className="iris-desktop-button" onClick={onCancelReplace}>교체 취소</button>}</div>
  <div className="iris-ergon-list iris-ergon-catalog">{matches.map(row=><article key={row.rowKey}>
   <div className="iris-ergon-item-name"><button type="button" className="iris-desktop-button iris-ergon-star" aria-label={`${row.name} 즐겨찾기`} aria-pressed={starred(row.name)} disabled={disabled} onClick={()=>onToggleFavorite({kind,displayName:row.name})}>{starred(row.name)?'★':'☆'}</button><strong>{row.name}</strong></div>
   <span>{row.available===true?'가능':row.available===false?unavailable[row.reason??'']??'재료·조건 확인':'조건 미확인'}{row.producedPerUnit!==undefined&&row.producedPerUnit!==null&&row.producedPerUnit>0?` · ${kind==='altering'?'작업당':'1회 산출'} ${row.producedPerUnit}개`:''}</span>
   <button type="button" className="iris-desktop-button" data-ergon-role="add" disabled={disabled||!items.some(item=>item.name===row.name)} onClick={()=>onChoose({kind,displayName:row.name})}>{replacing?'교체 적용':'작업 선택'}</button>
  </article>)}{!matches.length&&<p className="iris-caption">{onlyFavorites?'즐겨찾기에 품목을 담아 보세요.':'목록을 조회하거나 검색어를 바꿔 보세요.'}</p>}</div>
 </>;
}
