import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
import {memoryDB} from './memory-db.mjs';
const load=()=>{assert.ok(existsSync('lib/server/irisSynaxis.ts'),'implementation missing');return loadTS('lib/server/irisSynaxis.ts');};
const account={id:'account',nickname:'한설',role:'길드마스터'},now=new Date('2026-10-09T21:30:00Z');
const input=(patch={})=>({accountId:'account',mode:'bus',contentId:'raid_cabrak',difficulty:'어려움',partyDate:'2026-10-10',timeStart:'20:00',timeEnd:'23:59',memo:'직접 적은 공지',members:[{id:'A',allowRepeat:false}],...patch});
const db=()=>memoryDB({characters:[{id:'A',nickname:'내캐릭터',owner:'한설',job:'대검전사',combat_power:'94,282',magic_resistance:'3,616',raid_checks:[1]},{id:'B',nickname:'다른캐릭터',owner:'남',job:'힐러'}],nexus_contents:[{id:1,type:'raid',name:'카브락',is_active:true},{id:2,type:'raid',name:'에이렐',is_active:true}],content_power_reqs:[{id:1,content_type:'raid',content_name:'카브락',difficulty:'어려움',max_members:8},{id:2,content_type:'raid',content_name:'에이렐',difficulty:'어려움',max_members:4}],nexus_classes:[{id:1,name:'대검전사',role:'근딜',is_active:true}]});
test('IRIS Synaxis reads only owned characters and DB-backed active 4/8 content',async()=>{
  const data=await load().readIrisSynaxis(db(),account);
  assert.equal(data.characters.length,1);assert.equal(data.characters[0].id,'A');assert.equal(data.canCreateBus,true);
  assert.deepEqual(data.options.map(o=>[o.id,o.difficulties[0].capacity]),[['raid_cabrak',8],['raid_eirel',4]]);
  assert.equal(data.characters[0].completed.includes('raid_cabrak'),true);
});
test('IRIS Synaxis builds authoritative bus/party payload, notice and own member data',async()=>{
  const {prepareIrisSynaxisCreate:prepare}=load();
  const bus=await prepare(db(),account,input(),now);
  assert.equal(bus.max_members,8);assert.equal(bus.memo,bus.sub_content);assert.ok(bus.memo.includes('직접 적은 공지'));
  assert.equal(bus.members[0].owner,'account');assert.equal(bus.members[0].combat_power,94282);assert.equal(bus.members[0].is_completed,false,'bus round state must not freeze current-week homework completion into future rounds');
  const party=await prepare(db(),{...account,role:'길드원'},input({mode:'party',contentId:'raid_eirel'}),now);
  assert.equal(party.max_members,4);assert.equal(party.sub_content,'직접 적은 공지');assert.equal(party.leader_name,'내캐릭터');
});
test('IRIS Synaxis rejects foreign, stale catalog, duplicates and malformed schedule without writes',async()=>{
  const {prepareIrisSynaxisCreate:prepare}=load();
  for(const patch of [{accountId:'other'},{members:[{id:'B',allowRepeat:false}]},{members:[{id:'A',allowRepeat:false},{id:'A',allowRepeat:true}]},{difficulty:'등록안됨'},{partyDate:'2026-02-30'},{timeEnd:'19:00'},{memo:'x'.repeat(2001)},{owner:'forged'}]) {
    const store=db();await assert.rejects(()=>prepare(store,account,input(patch),now));assert.equal(store.writes.length,0);
  }
  await assert.rejects(()=>prepare(db(),{...account,role:'길드원'},input(),now),e=>e.status===403);
  const store=db();store.tables.nexus_contents[0].is_active=false;await assert.rejects(()=>prepare(store,account,input(),now));
  const broken=db();broken.tables.content_power_reqs[0].max_members=5;await assert.rejects(()=>prepare(broken,account,input(),now));
});
test('IRIS Synaxis API checks session/origin/body before existing member-mutation delegation',async()=>{
  assert.ok(existsSync('app/api/iris/synaxis/route.ts'),'API missing');
  const {NextRequest,NextResponse}=await import('next/server.js');let session=account,calls=0,last=null;
  const route=loadTS('app/api/iris/synaxis/route.ts',{'@/lib/server/sanctumSession':{getSessionAccount:async()=>session,isPendingAccount:a=>a.role==='승인대기',SANCTUM_SESSION_COOKIE:'session',getServerSupabase:db},'@/app/api/member-mutations/route':{POST:async req=>{calls++;last=await req.json();return NextResponse.json({data:[{id:123}]});}}});
  const send=(value=input(),origin='http://localhost:3000',type='application/json')=>route.POST(new NextRequest('http://localhost:3000/api/iris/synaxis',{method:'POST',headers:{origin,'content-type':type,cookie:'session=fake'},body:JSON.stringify(value)}));
  assert.equal((await send(input(),'http://evil.test')).status,403);assert.equal((await send(input(),undefined,'text/plain')).status,400);
  assert.equal((await send({...input(),memo:'a'.repeat(20000)})).status,413);assert.equal(calls,0);
  session=null;assert.equal((await send()).status,401);session={...account,role:'길드원'};assert.equal((await send()).status,403);assert.equal(calls,0);
  session=account;const response=await send(input({partyDate:'2099-10-10'}));assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(calls,1);assert.equal(last.table,'parties');assert.equal(last.action,'insert');assert.equal(last.payload.max_members,8);
  const foreign=await route.GET(new NextRequest('http://localhost:3000/api/iris/synaxis?accountId=other',{headers:{cookie:'session=fake'}}));assert.equal(foreign.status,403);
});
test('existing member writer rejects account changes between IRIS preparation and commit',async()=>{
  const {NextRequest}=await import('next/server.js');
  const route=loadTS('app/api/member-mutations/route.ts',{'@/lib/server/sanctumSession':{getSessionAccount:async()=>({...account,id:'changed'}),isPendingAccount:()=>false,SANCTUM_SESSION_COOKIE:'session',getServerSupabase:()=>{throw Error('must not access DB');}}});
  const response=await route.POST(new NextRequest('http://localhost:3000/api/member-mutations',{method:'POST',headers:{origin:'http://localhost:3000'},body:JSON.stringify({table:'parties',action:'insert',expectedAccountId:'account',payload:{members:[]}})}));assert.equal(response.status,403);
});
