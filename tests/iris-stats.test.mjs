import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
import {memoryDB} from './memory-db.mjs';
import {NextRequest} from 'next/server.js';
const pure=()=>{assert.ok(existsSync('lib/irisStats.ts'),'Missing manually confirmed stats contract');return loadTS('lib/irisStats.ts');};
const now=Date.now();
const row={id:7,owner:'owner',nickname:'화연',job:'힐러',combat_power:'100',life_energy:'20',charm:'30',magic_resistance:null,levels:{힐러:65},daily_checks:['keep']};
const base={combat_power:'100',life_energy:'20',charm:'30',magic_resistance:null};
const game={observedAt:new Date(now).toISOString(),job:'힐러',level:100,stats:{combat_power:90,life_energy:0,charm:null,magic_resistance:40}};
const edit=(extra={})=>({accountId:'account',characterId:'7',confirmed:true,observedAt:game.observedAt,stats:game.stats,base,...extra});

test('stats API requires session, same origin and bounded JSON; reads only owned safe fields',async()=>{
  const db=memoryDB({characters:[row,{...row,id:8,nickname:'other',owner:'other'},{...row,id:9,nickname:'owner',owner:null}]});
  let account={id:'account',nickname:'owner',status:'승인'};
  const api=loadTS('app/api/iris/stats/route.ts',{'@/lib/server/sanctumSession':{getSessionAccount:async()=>account,isPendingAccount:a=>a.status==='승인대기',getServerSupabase:()=>db,SANCTUM_SESSION_COOKIE:'session'}});
  const request=(body,origin='http://localhost:3000')=>new NextRequest('http://localhost:3000/api/iris/stats',{method:'POST',headers:{origin,'content-type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)});
  const read=await api.GET(new NextRequest('http://localhost:3000/api/iris/stats'));
  assert.equal(read.status,200);assert.match(read.headers.get('cache-control'),/no-store/);
  const rows=(await read.json()).characters;assert.deepEqual(rows.map(r=>r.id),['9','7']);assert.equal(rows[0].owner,undefined);assert.equal(rows[0].levels,undefined);
  assert.equal((await api.POST(request(edit(),'https://evil.test'))).status,403);
  assert.equal((await api.POST(request(' '.repeat(4097)))).status,413);
  assert.equal((await api.POST(request(edit({confirmed:false})))).status,400);
  account=null;assert.equal((await api.POST(request(edit()))).status,401);
  account={id:'account',nickname:'owner',status:'승인대기'};assert.equal((await api.GET(new NextRequest('http://localhost:3000/api/iris/stats'))).status,401);
  assert.equal(db.writes.length,0);
});

test('stats transport rejects crossed account/malformed values and never retries unknown saves',async()=>{
  const {createStatsTransport,parseStatsCharacters}=loadTS('lib/irisStatsTransport.ts');
  const value={accountId:'account',characters:[{id:'7',nickname:'화연',job:'힐러',stats:base}]};
  assert.equal(parseStatsCharacters(value,'account').length,1);
  assert.throws(()=>parseStatsCharacters(value,'other'));
  assert.throws(()=>parseStatsCharacters({...value,characters:[{...value.characters[0],stats:{...base,charm:0}}]},'account'));
  let calls=0;const transport=createStatsTransport(async()=>{calls++;throw Error('lost response');});
  await assert.rejects(()=>transport.save(edit()));assert.equal(calls,1);
  const expired=createStatsTransport(async()=>new Response('{}',{status:401}));await assert.rejects(()=>expired.characters('account'),/로그인이 만료/);
});
test('stats normalization preserves missing/null and real zero; class Level is not inferred',()=>{
  const p=pure();assert.equal(p.score(null),null);assert.equal(p.score(''),null);assert.equal(p.score(false),null);assert.equal(p.score({Value:0}),0);assert.equal(p.score('1,234'),1234);assert.equal(p.score(-1),null);
  assert.deepEqual(p.parseGameStats(game).stats,game.stats);
});
test('candidate ranking is a suggestion, supports ambiguity, and rejects other jobs',()=>{
  const p=pure(),chars=[{id:'7',nickname:'화연',job:'힐러',stats:base},{id:'8',nickname:'다른힐러',job:'힐러',stats:base},{id:'9',nickname:'전사',job:'전사',stats:base}];
  const ranked=p.rankStatsCandidates(chars,game);assert.equal(ranked.length,2);assert.equal(ranked[0].score,ranked[1].score);
  assert.equal(p.rankStatsCandidates(chars,{...game,job:'장궁병'}).length,0);
});

test('login recommendation needs comparable stats and a separated plausible candidate',()=>{
  const {recommendStatsCharacter}=pure();
  const candidate={id:'7',nickname:'화연',job:'힐러',stats:{...base,life_energy:'0'}};
  assert.equal(recommendStatsCharacter([candidate],game)?.id,'7');
  assert.equal(recommendStatsCharacter([candidate,{...candidate,id:'8'}],game),null);
  assert.equal(recommendStatsCharacter([{...candidate,stats:{...base,combat_power:null,life_energy:null,charm:null}}],game),null);
  assert.equal(recommendStatsCharacter([{...candidate,job:'전사'}],game),null);
  assert.equal(recommendStatsCharacter([{...candidate,stats:{combat_power:'1000000',life_energy:'1000000',magic_resistance:'1000000',charm:'1000000'}}],game),null);
});
test('confirmation, freshness, and bounded exact fields are required',()=>{
  const p=pure();for(const extra of [{confirmed:false},{confirmed:'true'},{stats:{...game.stats,contribution:123}},{stats:{...game.stats,charm:'30'}},{observedAt:new Date(now-61000).toISOString()},{observedAt:new Date(now+10000).toISOString()},{base:{...base,owner:'other'}}])assert.throws(()=>p.validateStatsEdit(edit(extra),now));
  assert.doesNotThrow(()=>p.validateStatsEdit(edit(),now));
});
test('owned save preserves absent fields, zero/decrease, other columns; no-op and retry write zero times',async()=>{
  pure();const {saveIrisStats}=loadTS('lib/server/irisStatsWrite.ts');const db=memoryDB({characters:[row]});
  await saveIrisStats(db,{id:'account',nickname:'owner'},edit(),now);
  assert.deepEqual(db.writes[0].payload,{combat_power:'90',life_energy:'0',magic_resistance:'40'});
  assert.equal(db.tables.characters[0].charm,'30');assert.deepEqual(db.tables.characters[0].levels,{힐러:65});
  await saveIrisStats(db,{id:'account',nickname:'owner'},edit(),now);assert.equal(db.writes.length,1);
});
test('foreign account/character and concurrent updates cannot write',async()=>{
  pure();const {saveIrisStats}=loadTS('lib/server/irisStatsWrite.ts');
  for(const account of [{id:'other',nickname:'owner'},{id:'account',nickname:'other'}]){const db=memoryDB({characters:[row]});await assert.rejects(()=>saveIrisStats(db,account,edit(),now));assert.equal(db.writes.length,0);}
  const db=memoryDB({characters:[row]});db.tables.characters[0].combat_power='110';await assert.rejects(()=>saveIrisStats(db,{id:'account',nickname:'owner'},edit(),now),e=>e.status===409);assert.equal(db.writes.length,0);
  const raced=memoryDB({characters:[row]});const from=raced.from;raced.from=table=>{const q=from(table),update=q.update;q.update=payload=>{raced.tables.characters[0].charm='31';return update(payload);};return q;};
  await assert.rejects(()=>saveIrisStats(raced,{id:'account',nickname:'owner'},edit(),now),e=>e.status===409);assert.equal(raced.writes.length,0);
});
