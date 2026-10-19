import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
test('local storage preserves legacy records and refuses damaged records before writing',()=>{
 const {readGuides,storeGuide}=loadTS('lib/gnosisLocal.ts');
 let raw=JSON.stringify([{id:2,title:'기존 글',content:'본문',sub_category:'도적',author:'한설',created_at:'2026-10-19',custom:'보존',comments:[]}]);
 const storage={getItem:()=>raw,setItem:(_,value)=>{raw=value;}};
 storeGuide(storage,{id:3,title:'새 글',content:'내용',sub_category:'전투',author:'한설',created_at:'2026-10-19'});
 assert.equal(readGuides(storage)[1].custom,'보존');
 raw='broken'; assert.throws(()=>storeGuide(storage,{id:4})); assert.equal(raw,'broken');
 raw='[]'; assert.throws(()=>storeGuide(storage,{id:4})); assert.equal(raw,'[]');
});
test('reply and like updates preserve sibling branches and support legacy nested replies',()=>{
 const {changeComment,flattenComments}=loadTS('lib/gnosisLocal.ts');
 const rows=[{id:1,author:'a',content:'부모',replies:[{id:2,author:'b',content:'답글',likes:2,replies:[]}]},{id:3,author:'c',content:'다른 댓글'}];
 const next=changeComment(rows,2,row=>({...row,likes:(row.likes||0)+1}));
 assert.equal(next[0].replies[0].likes,3); assert.equal(rows[0].replies[0].likes,2); assert.equal(next[1].content,'다른 댓글');
 assert.deepEqual(flattenComments(next).map(row=>[row.comment.id,row.depth]),[[1,0],[2,1],[3,0]]);
});
test('video URLs accept only YouTube hosts and exact IDs',()=>{
 const {youtubeId}=loadTS('lib/gnosisLocal.ts');
 assert.equal(youtubeId('https://youtu.be/dQw4w9WgXcQ'),'dQw4w9WgXcQ');
 assert.equal(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),'dQw4w9WgXcQ');
 for(const url of ['https://evil.test/youtube.com/watch?v=dQw4w9WgXcQ','javascript:alert(1)','https://youtube.com/watch?v=bad'])assert.equal(youtubeId(url),null);
});
test('formatted preview renders text safely while preserving legacy literal text',()=>{
 const Content=loadTS('components/gnosis/GnosisContent.tsx').default;
 const content='## 제목\n**강조**\n<img src=x onerror=alert(1)>\n[위험](javascript:alert(1))\n[자료](https://example.com)';
 const html=renderToStaticMarkup(createElement(Content,{content,formatted:true}));
 assert.match(html,/<h2>제목<\/h2>/); assert.match(html,/<strong>강조<\/strong>/);
 assert.doesNotMatch(html,/<img|href="javascript:/); assert.match(html,/&lt;img/); assert.match(html,/rel="noopener noreferrer"/);
 const old=renderToStaticMarkup(createElement(Content,{content:'**원래 글**'}));assert.doesNotMatch(old,/<strong>/);assert.match(old,/\*\*원래 글\*\*/);
});
test('publish comment reply and reload retain unrelated old posts and fields',()=>{
 const {readGuides,storeGuide,changeComment}=loadTS('lib/gnosisLocal.ts');
 let raw='[]';const storage={getItem:()=>raw,setItem:(_,value)=>{raw=value;}};
 const old={id:1,title:'보존',content:'기존',sub_category:'도적',author:'한설',created_at:'2026-10-19',custom:'유지'};
 storeGuide(storage,old);
 const post={...old,id:'new',title:'새 공략',content_format:'markdown',comments:[{id:'c1',author:'a',content:'질문',replies:[]}]};storeGuide(storage,post);
 const current=readGuides(storage)[0];storeGuide(storage,{...current,comments:changeComment(current.comments,'c1',row=>({...row,replies:[{id:'r1',author:'b',content:'답변'}]}))});
 assert.equal(readGuides(storage)[0].comments[0].replies[0].content,'답변');assert.deepEqual(readGuides(storage)[1],old);
});
