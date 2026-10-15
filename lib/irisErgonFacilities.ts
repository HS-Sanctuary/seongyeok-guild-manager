import {ergonSnapshotStale,type ErgonSnapshot} from './irisErgonRead';

export type ErgonFacilitySummary={name:string;registered:number;completed:number;pending:number;unknown:number;nextReadySeconds:number|null;reviewCollection:boolean;capacity:null};

/** Observed jobs only, not facility capacity or permission to collect somebody else's outputs. */
export function summarizeErgonFacilities(snapshot:ErgonSnapshot<'works'>|null|undefined,now:number):{fresh:boolean;facilities:ErgonFacilitySummary[]}{
 if(!snapshot)return {fresh:false,facilities:[]};
 const fresh=!ergonSnapshotStale(snapshot,now),groups=new Map<string,ErgonFacilitySummary>();
 for(const work of snapshot.data.items){
  let facility=groups.get(work.facility);
  if(!facility){facility={name:work.facility,registered:0,completed:0,pending:0,unknown:0,nextReadySeconds:null,reviewCollection:false,capacity:null};groups.set(work.facility,facility);}
  facility.registered++;
  if(work.completed===true)facility.completed++;
  else if(work.completed===false){
   facility.pending++;
   if(work.remainingSeconds!==null)facility.nextReadySeconds=facility.nextReadySeconds===null?work.remainingSeconds:Math.min(facility.nextReadySeconds,work.remainingSeconds);
  }else facility.unknown++;
 }
 for(const facility of groups.values())facility.reviewCollection=fresh&&facility.unknown===0&&facility.completed>=Math.ceil(facility.registered/2);
 return {fresh,facilities:[...groups.values()]};
}
