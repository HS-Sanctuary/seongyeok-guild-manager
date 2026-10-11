import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const storeModule=loadTS('lib/irisDesktopStore.ts');
const update=existsSync('lib/irisDesktopUpdate.ts')?loadTS('lib/irisDesktopUpdate.ts'):{};
const valid={supported:true,installedVersion:'0.1.0',availableVersion:'0.2.0',phase:'available',progress:0,error:null};
test('update state is native-owned, exact and never offers a same or older release',()=>{
 assert.equal(typeof update.parseDesktopUpdateState,'function','missing native update state boundary');
 assert.deepEqual(update.parseDesktopUpdateState(valid),valid);
 for(const bad of [{...valid,availableVersion:'0.1.0'},{...valid,availableVersion:'0.0.9'},{...valid,progress:101},{...valid,arbitraryPath:'C:/evil'},{...valid,installedVersion:'0.01.0'},{...valid,phase:'ready',availableVersion:null}])assert.throws(()=>update.parseDesktopUpdateState(bad));
});
test('updater client sends no browser paths and rejects replies from stale native generations',async()=>{
 let context={epoch:2,environment:'production'};const sent=[],listeners=new Set();const channel={postMessage:v=>sent.push(v),addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f)};
 const s=storeModule.createDesktopStore({channel,context:()=>context,environment:'production',timeoutMs:100});
 assert.equal(typeof s.updateState,'function','missing native updater methods');
 const p=s.updateState();assert.deepEqual(sent[0],{version:1,id:'1',epoch:2,method:'window.update.state',payload:null});for(const f of [...listeners])f({data:{version:1,id:'1',epoch:2,ok:true,value:valid}});assert.deepEqual(await p,valid);
 const late=s.updateCheck();context={epoch:3,environment:'production'};for(const f of [...listeners])f({data:{version:1,id:'2',epoch:2,ok:true,value:valid}});await assert.rejects(late);assert.equal(listeners.size,0);
});
test('native update events never accept another epoch or unsanitized native data',()=>{
 const message={version:1,kind:'window.update.changed',epoch:2,environment:'production',state:valid};
 const result=storeModule.parseDesktopWindowEvent(message,{epoch:2,environment:'production'});assert.equal(result?.kind,'window.update.changed');assert.equal(result.state.availableVersion,'0.2.0');
 assert.equal(storeModule.parseDesktopWindowEvent(message,{epoch:3,environment:'production'}),null);
 assert.equal(storeModule.parseDesktopWindowEvent({...message,state:{...valid,progress:-1}},{epoch:2,environment:'production'}),null);
});
test('titlebar can render installed native identity without claiming the web version is installed',()=>{
 const C=loadTS('components/iris/DesktopTitlebar.tsx').DesktopTitlebar;
 const html=renderToStaticMarkup(React.createElement(C,{onDrag(){},onMinimize(){},onClose(){},updateControl:React.createElement('span',null,'Beta 0.0.5')}));
 assert.ok(html.includes('Beta 0.0.5'));assert.ok(!html.includes('Beta 0.1.0'));
});
