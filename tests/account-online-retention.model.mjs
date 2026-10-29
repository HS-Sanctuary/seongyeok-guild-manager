// Synthetic policy/scheduler model ONLY. Does not execute or prove PostgreSQL SQL.
// The SQL definition supplies the legacy-delete switch; transaction scheduling is
// independently modeled so lock, rollback and replay scenarios are deterministic.
// This model does NOT emulate PostgreSQL EPQ or count extra locks on rows that
// stop qualifying after concurrent UPDATE. Its 32 limit is returned candidates.
export function functionSql(source,name){
 const start=source.lastIndexOf(`create or replace function public.${name}(`);
 if(start<0)return '';
 const end=source.indexOf('$$;',source.indexOf('as $$',start));
 if(end<0)throw Error('unterminated function '+name);
 return source.slice(start,end+3);
}
export class RetentionModel{
 constructor(source){
  this.source=source;this.now=200_000_000;this.sessions=new Map();this.rows=new Map();this.locks=new Map();
  this.legacyDelete=/delete from public\.sanctum_online_connections c where c\.environment=input_environment/.test(functionSql(source,'sanctum_online_touch'));
  this.hasPrune=Boolean(functionSql(source,'sanctum_online_prune'));
 }
 key(environment,token,id){return `${environment}:${token}:${id}`;}
 begin(){return new RetentionTransaction(this);}
}
class RetentionTransaction{
 constructor(db){this.db=db;this.rowWrites=new Map();this.sessionWrites=new Map();this.owned=new Set();this.done=false;}
 lock(key){const owner=this.db.locks.get(key);if(owner&&owner!==this)return false;this.db.locks.set(key,this);this.owned.add(key);return true;}
 rows(){const view=new Map(this.db.rows);for(const [key,row]of this.rowWrites){if(row)view.set(key,row);else view.delete(key);}return view;}
 touch(token,id,sequence,action='touch',environment='local'){
  const d=this.db,s=this.sessionWrites.get(token)??d.sessions.get(token);
  if(!s||s.expires<=d.now)return {status:'unauthorized'};
  if(!this.lock('session:'+token))return {status:'busy'};
  if(d.legacyDelete)for(const [key,row]of this.rows())if(row.environment===environment&&row.token===token&&row.updated<d.now-86400000)this.rowWrites.set(key,null);
  const key=d.key(environment,token,id),rows=this.rows(),old=rows.get(key);
  if(old?.closed)return {status:'closed'};
  if(old&&old.sequence>=sequence)return {status:'stale'};
  const own=[...rows.values()].filter(r=>r.environment===environment&&r.token===token);
  if(!old&&(own.length>=256||(action==='touch'&&own.filter(r=>!r.closed&&r.expires>d.now).length>=8)))return {status:'limit'};
  const closed=action==='leave';
  this.rowWrites.set(key,{environment,token,id,sequence,closed,expires:closed?d.now:Math.min(s.expires,d.now+720000),updated:d.now});
  return {status:closed?'closed':'recorded'};
 }
 prune(environment,batch=128){
  if(!this.db.hasPrune)throw Error('retention proposal missing');
  if(!['production','preview','development','local'].includes(environment)||!Number.isInteger(batch)||batch<1||batch>256)return {status:'invalid',deleted:0};
  const d=this.db;
  let deleted=0,examined=0;
  const candidates=[...d.sessions].filter(([token,s])=>s.expires<=d.now&&[...this.rows().values()].some(r=>r.token===token&&r.environment===environment)).sort((a,b)=>a[1].expires-b[1].expires||a[0].localeCompare(b[0]));
  for(const [token]of candidates){
   if(examined===32||deleted===batch)break;
   if(!this.lock('session:'+token))continue;
   examined++;
   if((this.sessionWrites.get(token)??d.sessions.get(token)).expires>d.now)continue;
   for(const [key,row]of [...this.rows()].sort(([a],[b])=>a.localeCompare(b))){
    if(deleted===batch)break;
    if(row.environment===environment&&row.token===token&&this.lock('row:'+key)){this.rowWrites.set(key,null);deleted++;}
   }
  }
  return {status:'completed',deleted,sessions:examined};
 }
 extend(token,expires){if(!this.lock('session:'+token))return {status:'busy'};const s=this.db.sessions.get(token);this.sessionWrites.set(token,{...s,expires});return {status:'extended'};}
 revoke(token){if(!this.lock('session:'+token))return {status:'busy'};this.sessionWrites.set(token,null);for(const [key,row]of this.rows())if(row.token===token)this.rowWrites.set(key,null);return {status:'revoked'};}
 commit(){if(this.done)throw Error('transaction closed');for(const [key,s]of this.sessionWrites){if(s)this.db.sessions.set(key,s);else this.db.sessions.delete(key);}for(const [key,row]of this.rowWrites){if(row)this.db.rows.set(key,row);else this.db.rows.delete(key);}this.rollback();}
 rollback(){for(const key of this.owned)this.db.locks.delete(key);this.done=true;}
}
