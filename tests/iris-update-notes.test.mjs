import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisUpdateNotes.ts')?loadTS('lib/irisUpdateNotes.ts'):{};
const note={schemaVersion:1,version:'0.3.0',sections:[{title:'개선',items:['글꼴과 투명도 설정','<img src=x onerror=alert(1)>도 글자로만 표시']} ]};
test('release notes require the requested version and bounded plain-text sections',()=>{
 assert.equal(typeof api.parseIrisUpdateNotes,'function');assert.deepEqual(api.parseIrisUpdateNotes(note,'0.3.0'),note);
 for(const bad of [{...note,version:'0.2.2'},{...note,url:'https://bad.test'},{...note,sections:[{title:'개선',items:['x'.repeat(401)]}]},{...note,sections:[]}])assert.throws(()=>api.parseIrisUpdateNotes(bad,'0.3.0'));
});
test('notes fetch uses a fixed public version path, no credentials or redirects, and rejects oversize/error responses',async()=>{
 assert.equal(typeof api.readIrisUpdateNotes,'function');const calls=[];
 const fetcher=async(path,options)=>{calls.push([path,options]);return new Response(JSON.stringify(note),{headers:{'Content-Type':'application/json'}});};
 assert.deepEqual(await api.readIrisUpdateNotes('0.3.0',undefined,fetcher),note);assert.equal(calls[0][0],'/IRIS/notes/0.3.0.json');assert.equal(calls[0][1].credentials,'omit');assert.equal(calls[0][1].redirect,'error');
 await assert.rejects(api.readIrisUpdateNotes('../private',undefined,fetcher));assert.equal(calls.length,1);
 await assert.rejects(api.readIrisUpdateNotes('0.3.0',undefined,async()=>new Response('x'.repeat(17000),{headers:{'Content-Type':'application/json'}})));
 await assert.rejects(api.readIrisUpdateNotes('0.3.0',undefined,async()=>new Response('',{status:404})));
 await assert.rejects(api.readIrisUpdateNotes('0.3.0',undefined,async()=>new Response(JSON.stringify({...note,version:'0.2.2'}),{headers:{'Content-Type':'application/json'}})));
});
