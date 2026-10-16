import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonFavorites.ts')?loadTS('lib/irisErgonFavorites.ts'):{};
const item={kind:'crafting',displayName:'검'},envelope=items=>({schemaVersion:1,items});
const storage=()=>{const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
test('favorites validate exact bounded pairs without duplicating catalog or private data',()=>{
 assert.deepEqual(api.parseErgonFavorites(envelope([item,{kind:'altering',displayName:'검'}])),[item,{kind:'altering',displayName:'검'}]);
 assert.equal(api.parseErgonFavorites(envelope(Array.from({length:200},(_,i)=>({...item,displayName:'검'+i})))).length,200);
 for(const raw of [envelope([item,item]),envelope([{...item,owned:10}]),envelope([{...item,displayName:'\n'}]),envelope([{...item,kind:'collect'}]),{...envelope([]),other:true},envelope(Array.from({length:201},(_,i)=>({...item,displayName:'검'+i}))),envelope(Array.from({length:200},(_,i)=>({...item,displayName:'검'.repeat(140)+i})))])assert.throws(()=>api.parseErgonFavorites(raw));
});
test('favorites isolate account/environment keys including delimiter-like names',()=>{
 const s=storage();assert.equal(api.writeErgonFavorites(s,'dev:a','b',[item]),true);
 assert.deepEqual(api.readErgonFavorites(s,'dev:a','b').items,[item]);
 for(const [env,account] of [['dev','a:b'],['dev:a','other'],['production','b']])assert.deepEqual(api.readErgonFavorites(s,env,account).items,[]);
});
test('damaged original favorites are not overwritten and inaccessible storage falls back safely',()=>{
 const s=storage();s.values.set('iris_ergon_favorites:v1:dev:a','{bad');
 assert.equal(api.readErgonFavorites(s,'dev','a').unreadable,true);assert.equal(api.writeErgonFavorites(s,'dev','a',[item]),false);assert.equal(s.values.get('iris_ergon_favorites:v1:dev:a'),'{bad');
 const blocked={getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}};
 assert.deepEqual(api.readErgonFavorites(blocked,'dev','a'),{items:[],persistent:false,unreadable:false});assert.equal(api.writeErgonFavorites(blocked,'dev','a',[item]),false);
 const noWrite={getItem:()=>null,setItem:()=>{throw Error('quota');}};assert.equal(api.writeErgonFavorites(noWrite,'dev','a',[item]),false);
});
