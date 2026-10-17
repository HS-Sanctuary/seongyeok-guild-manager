import type {IrisInformationNotice} from './irisNotificationQueue';
export type DeepReportRow={id:string|number;zone:string;channel:string;reported_at:string;reporter_name:string};
export type DeepReport={id:string;zone:string;zoneLabel:string;count:number;reportedAt:number;reporter:string;key:string};
const zones:Record<string,string>={hz_001:'창백한 산',hz_002:'센마이 평원'};
export function projectDeepReports(rows:unknown[],periodStart:number,now:number):DeepReport[]{
 const found=new Map<string,DeepReport>();if(!Number.isFinite(periodStart)||!Number.isFinite(now)||periodStart>now)return [];
 for(const input of rows){if(!input||typeof input!=='object')continue;const r=input as DeepReportRow;if(!['string','number'].includes(typeof r.id)||!String(r.id)||String(r.id).length>100||!Object.hasOwn(zones,r.zone)||typeof r.channel!=='string'||!/^[0-3]$/.test(r.channel)||typeof r.reported_at!=='string'||typeof r.reporter_name!=='string'||!r.reporter_name.trim()||r.reporter_name.length>160||/[\x00-\x1f\x7f]/.test(r.reporter_name))continue;
  const reportedAt=Date.parse(r.reported_at);if(!Number.isFinite(reportedAt)||reportedAt<periodStart||reportedAt>now)continue;const id=String(r.id),count=Number(r.channel),key=`deep:${id}:${reportedAt}:${r.zone}:${count}:${r.reporter_name}`;const report={id,zone:r.zone,zoneLabel:zones[r.zone],count,reportedAt,reporter:r.reporter_name,key};if(!found.has(id)||found.get(id)!.reportedAt<reportedAt)found.set(id,report);
 }
 return [...found.values()].sort((a,b)=>b.reportedAt-a.reportedAt||a.id.localeCompare(b.id));
}
export function deepReportNotice(report:DeepReport):IrisInformationNotice|null{if(report.count===0)return null;return {key:report.key,scope:'',title:'심층 구멍 제보',message:`${report.zoneLabel} · ${report.count}개 발생`,reporter:report.reporter,createdAt:report.reportedAt,expiresAt:Math.floor(report.reportedAt/1800000)*1800000+1800000,sound:true};}
export function createDeepReportTracker(){let known=new Map<string,DeepReport>();return {baseline(rows:DeepReport[]){known=new Map(rows.map(r=>[r.id,r]));},update(rows:DeepReport[]){const next=new Map(rows.map(r=>[r.id,r])),added:DeepReport[]=[],removed:string[]=[];for(const r of known.values())if(next.get(r.id)?.key!==r.key)removed.push(r.key);for(const r of rows){const prior=known.get(r.id);if(r.count>0&&(!prior||prior.zone!==r.zone||prior.count!==r.count||prior.reporter!==r.reporter))added.push(r);}known=next;return {added,removed};}};}
