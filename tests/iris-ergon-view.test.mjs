import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
test('Ergon session renders a real read entry point and disables it outside the active panel',()=>{
 const Component=loadTS('components/iris/DesktopErgon.tsx').DesktopErgon;
 const html=renderToStaticMarkup(React.createElement(Component,{environment:'development',accountId:'a',characterId:'c',active:false,locked:false,read:async()=>{throw Error()},getContextVersion:()=>1}));
 assert.match(html,/가공 목록 조회/);assert.match(html,/제작 목록 조회/);assert.match(html,/가공 목록 조회<\/button>/);assert.match(html,/<button[^>]*disabled=""[^>]*>가공 목록 조회/);
});
test('official blocked reason and locked crafting system stay readable',()=>{
 const Component=loadTS('components/iris/DesktopErgon.tsx').DesktopErgonRecipeStatus;
 assert.equal(typeof Component,'function');
 const html=renderToStaticMarkup(React.createElement(Component,{recipe:{name:'상급 목재',available:false,producedPerUnit:3,reason:'시설 레벨 부족',missing:null},unlocked:false}));
 assert.match(html,/시설 레벨 부족/);assert.match(html,/제작 기능이 잠겨/);
 const unknown=renderToStaticMarkup(React.createElement(Component,{recipe:{name:'목재',available:null,producedPerUnit:null,reason:null,missing:null},unlocked:null}));
 assert.match(unknown,/조건 미확인/);assert.doesNotMatch(unknown,/제작 가능|잠겨/);
});
