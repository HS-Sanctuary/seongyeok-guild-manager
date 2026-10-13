import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const render=(path,name,props)=>renderToStaticMarkup(React.createElement(loadTS(path)[name],props));
const center={account:{id:'a',nickname:'한설',role:'길드원'},characters:[],selected:null,pending:[],locked:false,saveStatus:null,onSelectCharacter(){},onEdit(){}};
const save={entries:[],now:0,locked:false,onSave(){},onDiscard(){},onRecover(){}};
test('main navigation exposes ERGON beside existing modules with bilingual visual labels',()=>{
  const html=render('components/iris/DesktopCenter.tsx','DesktopCenter',center);
  for(const name of ['크로노스','시낙시스','에르곤'])assert.match(html,new RegExp('aria-label="'+name+'"'));
  for(const name of ['CHRONOS','SYNAXIS','ERGON','캐릭터 관리','파티 매칭','생활 매니저'])assert.ok(html.includes(name),name);
  assert.match(html,/id="iris-pane-ergon"[^>]*hidden=""/);
});
test('idle save state renders nothing, without reserving an inline toolbar',()=>assert.equal(render('components/iris/DesktopSaveStatus.tsx','DesktopSaveStatus',save),''));

test('ERGON introduction is one compact functional heading without the old brand or Greek paragraphs',()=>{
  const html=render('components/iris/DesktopErgon.tsx','DesktopErgon',{});
  assert.match(html,/에르곤 - 스마트 채집 가공 제작 생활 매니저/);
  assert.doesNotMatch(html,/IRIS for SANCTUM|<h2>ERGON|고대 그리스|성역의 여정|에르곤 · 생활 매니저/);
});

test('Synaxis uses the shared abyss mark rather than the raid mark',()=>{
  const html=render('components/iris/DesktopIcons.tsx','SynaxisIcon',{}),mask=decodeURI(html.match(/mask-image:(url\([^)]*\))/)[1]);
  assert.match(mask,/어비스 마크\.svg/);assert.doesNotMatch(mask,/레이드 마크/);
});
test('pending overlay exposes recovery without reserving document flow',()=>{
  const html=render('components/iris/DesktopSaveStatus.tsx','DesktopSaveStatus',{...save,position:'top-left',entries:[{characterId:'c',category:'daily',taskId:'t',requestId:'r',deadlineAt:15000,phase:'unknown'}]});
  assert.match(html,/data-iris-save-overlay/);assert.match(html,/data-position="top-left"/);assert.match(html,/확인하고 재시도/);
});
test('save preview is distinguishable from a real save and has no action controls',()=>{
  const html=render('components/iris/DesktopSaveStatus.tsx','DesktopSaveStatus',{...save,preview:true,position:'bottom-left'});
  assert.match(html,/미리보기/);assert.match(html,/data-position="bottom-left"/);assert.doesNotMatch(html,/<button/);
});
test('local save corner persists in its environment and rejects unknown values',()=>{
  const a=loadTS('lib/irisAppearance.ts'),values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  assert.equal(typeof a.writeIrisSavePosition,'function');
  assert.equal(a.writeIrisSavePosition(storage,'development','top-left'),true);
  assert.equal(a.readIrisSavePosition(storage,'development').position,'top-left');assert.equal(a.readIrisSavePosition(storage,'production').position,'bottom-right');
  assert.equal(a.writeIrisSavePosition(storage,'development','url(bad)'),false);assert.equal(a.readIrisSavePosition(storage,'development').position,'top-left');
  assert.equal(a.readIrisSavePosition({getItem(){throw Error();}},'development').persistent,false);
});
