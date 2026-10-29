// Shared SQL emitted by the opt-in owned-PG runner. No database access here.
const A='11111111-1111-4111-8111-111111111111';
const token=c=>`repeat('${c}',64)`;
export const touch=(c,id,sequence=1,action='touch',environment='local')=>
 `select public.sanctum_online_touch(${token(c)},'${A}','${id}',${sequence},'web','${action}','${environment}');`;
export const expiredRowsSql=()=>`delete from public.sanctum_online_connections;
 update public.sanctum_sessions set expires_at=clock_timestamp()-interval '1 minute' where token_hash=${token('e')};
 insert into public.sanctum_online_connections select 'local',${token('e')},md5('race'||i)::uuid,'web',1,true,clock_timestamp(),clock_timestamp() from generate_series(1,3)i;`;
