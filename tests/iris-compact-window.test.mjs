import test from 'node:test';import assert from 'node:assert/strict';import {loadTS} from './load-ts.mjs';
const module=loadTS('lib/irisDesktopStore.ts');
test('compact state validates exact booleans and current scoped events',()=>{
 assert.equal(typeof module.parseDesktopPresentation,'function','compact state parser unavailable');const state={compact:true,automatic:false,panelOpen:false};assert.deepEqual(module.parseDesktopPresentation(state),state);
 for(const bad of [{...state,compact:1},{...state,hwnd:1},{compact:true}])assert.throws(()=>module.parseDesktopPresentation(bad));
 const message={version:1,kind:'window.presentation.changed',epoch:2,environment:'development',state};assert.deepEqual(module.parseDesktopWindowEvent(message,{epoch:2,environment:'development'}),{kind:message.kind,state});assert.equal(module.parseDesktopWindowEvent(message,{epoch:3,environment:'development'}),null);
});
