import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {loadTS} from './load-ts.mjs';
import {memoryDB} from './memory-db.mjs';
const edit=(patch={})=>({requestId:'11111111-1111-4111-8111-111111111111',accountId:'account',characterId:'7',classId:'1',baseLevel:53,desiredLevel:54,...patch});
const row={id:7,owner:'owner',nickname:'내캐릭',levels:{전사:53,마법사:65,숨김:7,legacy:{x:1}},daily_checks:['보존']};
const classes=[{id:1,name:'전사',is_active:true},{id:2,name:'마법사',is_active:true},{id:3,name:'숨김',is_active:false}];
const pure=()=>loadTS('lib/irisClassWrite.ts');
function setup(account={id:'account',nickname:'owner',status:'승인'},character=row){
  const db=memoryDB({characters:[character],nexus_classes:classes});
  const route=loadTS('app/api/iris/classes/route.ts',{'@/lib/server/sanctumSession':{getSessionAccount:async()=>account,isPendingAccount:a=>a.status==='승인대기',getServerSupabase:()=>db,SANCTUM_SESSION_COOKIE:'session'}});
  const post=(body,origin='http://localhost:3000')=>route.POST(new NextRequest('http://localhost:3000/api/iris/classes',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)}));
  return {db,post,route};
}
test('class merge preserves unrelated and inactive keys and allows decreases',()=>{
  const {mergeClassLevel:merge}=pure();
  assert.deepEqual(merge(row.levels,'전사',53,54),{levels:{전사:54,마법사:65,숨김:7,legacy:{x:1}},changed:true});
  assert.equal(row.levels.전사,53);
  assert.equal(merge(row.levels,'전사',53,52).levels.전사,52);
  assert.deepEqual(merge(null,'전사',null,1),{levels:{전사:1},changed:true});
});
test('class validation rejects forged fields and invalid or coerced numbers',()=>{
  const {validateClassEdit:validate,mergeClassLevel:merge}=pure();
  for(const patch of [{owner:'other'},{className:'전사'},{levels:{}},{desiredLevel:0},{desiredLevel:1001},{desiredLevel:1.5},{desiredLevel:'54'},{baseLevel:0},{requestId:'x'},{classId:' '}])assert.throws(()=>validate(edit(patch)),e=>e.status===400);
  for(const raw of ['{}',[],{전사:0},{전사:'53'},{전사:null}])assert.throws(()=>merge(raw,'전사',null,54),e=>e.status===503);
  assert.throws(()=>merge(row.levels,'전사',52,54),e=>e.status===409);
});
test('authenticated class save updates only levels and no-op never writes',async()=>{
  const {post,db}=setup();const response=await post({edit:edit()});assert.equal(response.status,200);
  assert.deepEqual((await response.json()).result,{requestId:edit().requestId,status:'saved',level:54});
  assert.deepEqual(db.writes[0].payload,{levels:{전사:54,마법사:65,숨김:7,legacy:{x:1}}});
  assert.deepEqual(db.tables.characters[0].daily_checks,['보존']);
  assert.equal((await post({edit:edit()})).status,200);assert.equal(db.writes.length,1);
  const missing=setup(undefined,{...row,levels:null});assert.equal((await missing.post({edit:edit({baseLevel:null,desiredLevel:65})})).status,200);
});
test('class API rejects unauthenticated owners catalogs origin and oversized bodies',async()=>{
  for(const [account,character,body,origin,want] of [[null,row,{edit:edit()},undefined,401],[{id:'account',nickname:'other'},row,{edit:edit()},undefined,403],[undefined,{...row,owner:null},{edit:edit()},undefined,403],[undefined,row,{edit:edit({accountId:'other'})},undefined,403],[undefined,row,{edit:edit({classId:'3'})},undefined,400],[undefined,row,{edit:edit()},'https://evil.test',403],[undefined,row,{edit:edit(),padding:1},undefined,400],[undefined,row,{edit:edit(),padding:'x'.repeat(65536)},undefined,413]]){
    const s=setup(account,character);assert.equal((await s.post(body,origin)).status,want);assert.equal(s.db.writes.length,0);
  }
  const failed=setup();const from=failed.db.from;failed.db.from=table=>table==='nexus_classes'?{select(){return this;},eq(){return this;},then(resolve){return Promise.resolve({error:Error('unavailable'),data:null}).then(resolve);}}:from(table);
  assert.equal((await failed.post({edit:edit()})).status,503);
});
test('class CAS race never overwrites a concurrent different class update',async()=>{
  const {saveIrisClassEdit:save}=loadTS('lib/server/irisClassWrite.ts');
  const db=memoryDB({characters:[row],nexus_classes:classes});const from=db.from;
  db.from=table=>{const q=from(table),update=q.update;q.update=p=>{db.tables.characters[0].levels.마법사=66;return update(p);};return q;};
  await assert.rejects(()=>save(db,{id:'account',nickname:'owner'},edit()),e=>e.status===409);
  assert.equal(db.tables.characters[0].levels.전사,53);assert.equal(db.tables.characters[0].levels.마법사,66);assert.equal(db.writes.length,0);
});
