import test from 'node:test';import assert from 'node:assert/strict';import {loadTS} from './load-ts.mjs';
test('focus diagnostics accept only local development boolean metadata, never text or arbitrary targets',async()=>{
 const original=process.env.NODE_ENV,writes=[];const fs={mkdir:async()=>{},stat:async()=>({size:0}),appendFile:async(_path,text)=>writes.push(JSON.parse(text))};
 try{process.env.NODE_ENV='development';const {POST}=loadTS('app/api/iris/focus-debug/route.ts',{'node:fs/promises':fs});
  const body={phase:'reply',surface:'ergon',menu:false,capable:true,documentFocus:true,keyboard:false,pointer:false,modal:false,editing:false,selection:false,returned:false};
  const request=(value=body,url='http://localhost:3000/api/iris/focus-debug',origin='http://localhost:3000')=>new Request(url,{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(value)});
  assert.equal((await POST(request())).status,204);assert.equal(writes.length,1);assert.deepEqual(writes[0].state,body);
  assert.equal((await POST(request({...body,phase:'close'}))).status,204);assert.equal(writes.length,2);
  for(const bad of [{...body,nickname:'private'},{...body,handle:42},{...body,keyboard:'true'},{...body,phase:'anything'}])assert.equal((await POST(request(bad))).status,400);
  assert.equal((await POST(request(body,'http://localhost:3000/api/iris/focus-debug','https://evil.test'))).status,404);
  assert.equal((await POST(request(body,'https://example.test/api/iris/focus-debug','https://example.test'))).status,404);
  process.env.NODE_ENV='production';assert.equal((await POST(request())).status,404);assert.equal(writes.length,2);
 }finally{if(original===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=original;}
});
