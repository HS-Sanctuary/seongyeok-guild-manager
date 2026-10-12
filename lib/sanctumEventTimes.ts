export type AbyssTimingReport={id:string|number;hole_time:string;status:string;reporter_name:string};
export type SanctumEventPhase={status:'waiting'|'imminent'|'active';sec:number;at:number;confirmed:boolean;reporter?:string;isDefault?:boolean};
const minute=60000,hour=3600000,day=86400000,kst=9*hour;
export function calculateSanctumEvents(now:number,reports:readonly AbyssTimingReport[]=[]){
  if(!Number.isFinite(now))throw Error('시간을 확인해 주세요.');
  const dayStart=Math.floor((now+kst)/day)*day-kst,hourStart=Math.floor(now/hour)*hour,elapsed=Math.floor((now-hourStart)/1000);
  const barrier:SanctumEventPhase={status:elapsed<120?'imminent':elapsed<240?'active':'waiting',sec:elapsed<120?119-elapsed:elapsed<240?239-elapsed:Math.floor((hourStart+hour-now)/1000),at:hourStart+2*minute,confirmed:true};
  let fieldBoss:SanctumEventPhase={status:'waiting',sec:0,at:dayStart+day+12*hour,confirmed:true};
  for(const h of [12,15,18,20,22]){const start=dayStart+h*hour;if(now>=start-2*minute&&now<start+30*minute){fieldBoss={status:now<start?'imminent':'active',sec:Math.floor(((now<start?start:start+30*minute)-now)/1000),at:start,confirmed:true};break;}if(now<start-2*minute){fieldBoss.at=start;break;}}
  if(fieldBoss.status==='waiting')fieldBoss.sec=Math.floor((fieldBoss.at-now)/1000);
  const latest=reports.filter(r=>r.status==='approved'&&Number.isFinite(Date.parse(r.hole_time))&&Date.parse(r.hole_time)+15*minute>now).sort((a,b)=>Date.parse(b.hole_time)-Date.parse(a.hole_time))[0];
  let abyss:SanctumEventPhase;
  if(latest){const at=Date.parse(latest.hole_time),diff=at-now;abyss={status:diff>0&&diff<=2*minute?'imminent':diff<=0?'active':'waiting',sec:Math.floor((diff<=0?at+15*minute-now:diff)/1000),at,confirmed:true,reporter:latest.reporter_name,isDefault:false};}
  else{const cycle=36*3600+15*60,epoch=Date.parse('2024-01-01T00:00:00Z')/1000;const sec=cycle-((now/1000-epoch)%cycle);abyss={status:'waiting',sec,at:now+sec*1000,confirmed:false,isDefault:true};}
  const periodStart=Math.floor(now/(30*minute))*30*minute,nextReset=periodStart+30*minute;
  return {fieldBoss,barrier,abyss,deep:{periodStart,nextReset,sec:Math.floor((nextReset-now)/1000)}};
}
