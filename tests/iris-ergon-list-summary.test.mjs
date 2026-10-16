import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {loadTS} from './load-ts.mjs';
const {DesktopErgonQueue}=loadTS('components/iris/DesktopErgonQueue.tsx');
test('visible work list retains known processing runs and wings without fabricating unknown cost',()=>{
 const plans=[{id:'wood',kind:'altering',displayName:'상급 목재',targetQuantity:20}],snapshot={schemaVersion:1,kind:'altering',source:'official-cli',observedAt:1000,data:{unlocked:true,items:[{name:'상급 목재',available:true,producedPerUnit:3,reason:null,missing:null}]}};
 const props={plans,goals:{},snapshots:{altering:snapshot},now:1001,scope:'a/c',active:true,presentation:'workbench',onChangePlans:()=>{},onSelect:()=>{},onOpenChange:()=>{}};
 const html=renderToStaticMarkup(React.createElement(DesktopErgonQueue,props));assert.match(html,/예상 7회 · 날개 35개/);
 const stale=renderToStaticMarkup(React.createElement(DesktopErgonQueue,{...props,now:16000}));assert.doesNotMatch(stale,/날개 35개/);
});
