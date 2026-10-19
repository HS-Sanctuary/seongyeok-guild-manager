import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
const sample={version:1,id:'look-a',item:{itemName:'밤하늘',rarity:'에픽',dyeParts:['#334455']},image:null,updatedAt:'2026-10-19T00:00:00.000Z'};
test('fashion sharing preserves existing post text, rich formatting, poll and settings',()=>{
 const {mergeFashionDraft}=loadTS('lib/gnosisFashion.ts');
 const base={title:'이미 작성한 제목',content:'설명',richDoc:[{tag:'p',children:[{text:'설명'}]}],poll:{title:'선택'},hideMedia:true,category:'전사'};
 const next=mergeFashionDraft(base,sample);
 assert.equal(next.title,base.title);assert.deepEqual(next.richDoc,base.richDoc);assert.deepEqual(next.poll,base.poll);assert.equal(next.hideMedia,true);assert.equal(next.category,'패션');assert.equal(next.useFashion,true);assert.equal(next.itemData.itemName,'밤하늘');assert.equal(base.category,'전사');assert.throws(()=>mergeFashionDraft(base,{...sample,image:'javascript:bad'}));
});
test('fashion saves update by ID and preserve other looks, rejecting malformed records without writes',()=>{
 const {saveFashion,readFashion}=loadTS('lib/gnosisFashion.ts');
 const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 saveFashion(storage,sample);saveFashion(storage,{...sample,id:'look-b'});saveFashion(storage,{...sample,item:{...sample.item,itemName:'수정'}});
 assert.equal(readFashion(storage).length,2);assert.equal(readFashion(storage)[0].item.itemName,'수정');
 const before=JSON.stringify([...values]);assert.throws(()=>saveFashion(storage,{...sample,item:{...sample.item,dyeParts:['javascript:bad']}}));assert.equal(JSON.stringify([...values]),before);
 values.set('gnosis_fashion_library_v1','broken');assert.throws(()=>saveFashion(storage,sample));assert.equal(values.get('gnosis_fashion_library_v1'),'broken');
});
test('fashion transfer rejects remote/SVG images and limits saved collection size',()=>{
 const {parseFashion,saveFashion}=loadTS('lib/gnosisFashion.ts');
 for(const image of ['https://example.com/image.png','data:image/svg+xml;base64,xxx'])assert.throws(()=>parseFashion({...sample,image}));
 assert.equal(parseFashion(sample).item.itemName,'밤하늘');
 const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 for(let i=0;i<10;i++)saveFashion(storage,{...sample,id:'look-'+i});
 assert.throws(()=>saveFashion(storage,{...sample,id:'eleventh'}));
});
