import {eligibleBusCandidates,isBusOperator,isGuildBusParty} from './guildBusPolicy';

type LiveParty=Record<string,unknown>;
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function accountAliases(member:Record<string,unknown>):string[] {
  return [member.account_id,member.owner,member.owner_account]
    .filter((value):value is string=>typeof value==='string' && !!value.trim())
    .map(value=>uuidPattern.test(value.trim())?value.trim().toLowerCase():value.trim());
}
function accountResolver(entries:Record<string,unknown>[]):(member:Record<string,unknown>)=>string {
  const parents=new Map<string,string>();
  const root=(key:string):string=>{
    let current=key;
    while(parents.has(current) && parents.get(current)!==current)current=parents.get(current)!;
    return current;
  };
  let hasUuid=false;
  for(const member of entries){
    const aliases=accountAliases(member);
    for(const alias of aliases){parents.set(alias,parents.get(alias)||alias);if(uuidPattern.test(alias))hasUuid=true;}
    for(const alias of aliases.slice(1)){
      const a=root(aliases[0]),b=root(alias);
      if(a===b)continue;
      // Prefer a verified UUID root; explicit legacy aliases join the same account.
      if(uuidPattern.test(b))parents.set(a,b);else parents.set(b,a);
    }
  }
  return member=>{
    const alias=accountAliases(member)[0];
    if(!alias)return '';
    const identity=root(alias);
    // In mixed legacy/UUID rows, unlinked labels could be another UUID's alt.
    return hasUuid && !uuidPattern.test(identity)?'':identity;
  };
}
function members(party:LiveParty):Record<string,unknown>[] {
  let value=party.members;
  if(typeof value==='string'){try{value=JSON.parse(value);}catch{return [];}}
  return Array.isArray(value)?value.filter((m):m is Record<string,unknown>=>!!m&&typeof m==='object'):[];
}
export function ownsBusEntry(party:LiveParty,names:Set<string>,accountId?:string,accountNickname?:string):boolean {
  return members(party).some(m=>
    (accountId && [m.account_id,m.owner_account,m.owner].includes(accountId)) ||
    (accountNickname && [m.owner_account,m.owner].includes(accountNickname)) ||
    names.has(String(m.character_name||m.name||'')));
}
function participantSettings(party:LiveParty):string {
  return JSON.stringify(members(party).map(m=>[
    String(m.character_name||m.name||''),!!m.allow_repeat,
    m.time_start||m.start_time||m.startTime||'',m.time_end||m.end_time||m.endTime||'',
  ]).sort(([a],[b])=>String(a).localeCompare(String(b))));
}
export function describeBusChanges(before:LiveParty,after:LiveParty):string[] {
  if(!isGuildBusParty(before)&&!isGuildBusParty(after))return [];
  const changed=(fields:string[])=>fields.some(key=>JSON.stringify(before[key]??null)!==JSON.stringify(after[key]??null));
  const changes:string[]=[];
  if(changed(['content_name','difficulty','selected_sub_contents']))changes.push('컨텐츠');
  if(changed(['memo','sub_content']))changes.push('공지');
  if(changed(['party_date','time_start','time_end']))changes.push('일정');
  if(changed(['max_members']))changes.push('출전 정원');
  if(participantSettings(before)!==participantSettings(after))changes.push('참가 설정');
  return changes;
}

// No storage or database access. Each live session starts with a fresh baseline.
export class BusLiveTracker {
  constructor(private accountId?:string,private accountNickname?:string){}
  private parties=new Map<string,LiveParty>();
  private names=new Set<string>();
  private readyIds=new Set<string>();
  seed(parties:LiveParty[],names:string[],now=new Date()){
    this.parties=new Map(parties.map(p=>[String(p.id),p]));this.names=new Set(names);
    // Initial/reconnected snapshots are baselines, not historical departure alerts.
    this.readyIds=new Set(parties.filter(p=>this.canDepart(p,now,true)).map(p=>String(p.id)));
  }
  remember(party:LiveParty){this.parties.set(String(party.id),party);}
  forget(id:string){this.parties.delete(id);this.readyIds.delete(id);}
  update(party:LiveParty):string[] {
    const previous=this.parties.get(String(party.id));this.remember(party);
    if(!previous || (!this.participates(previous)&&!this.participates(party)))return [];
    return describeBusChanges(previous,party);
  }
  participates(party:LiveParty){return ownsBusEntry(party,this.names,this.accountId,this.accountNickname);}
  private canDepart(party:LiveParty,now:Date,isAdmin:boolean):boolean {
    const capacity=Number(party.max_members);
    if(!isGuildBusParty(party) || ![4,8].includes(capacity) || party.status!=='모집중')return false;
    if(!isBusOperator(String(party.leader_name||''),this.accountNickname||'',[...this.names],isAdmin))return false;
    const entries=members(party),account=accountResolver(entries);
    const candidates=entries.map(m=>({
      character_name:String(m.character_name||m.name||''),
      account:account(m),
      time_start:String(m.time_start||m.start_time||m.startTime||''),
      time_end:String(m.time_end||m.end_time||m.endTime||''),
      is_completed:!!m.is_completed,allow_repeat:!!m.allow_repeat,
    })).filter(m=>m.account && m.character_name);
    const eligible=eligibleBusCandidates(candidates,{
      party_date:String(party.party_date||''),time_start:String(party.time_start||''),time_end:String(party.time_end||''),
    },now);
    return new Set(eligible.map(m=>m.account)).size>=capacity;
  }
  takeReadyBuses(now:Date,isAdmin:boolean):LiveParty[] {
    const next=new Set<string>(),departures:LiveParty[]=[];
    for(const [id,party] of this.parties){
      if(!this.canDepart(party,now,isAdmin))continue;
      next.add(id);
      if(!this.readyIds.has(id))departures.push(party);
    }
    this.readyIds=next;
    return departures;
  }
}
