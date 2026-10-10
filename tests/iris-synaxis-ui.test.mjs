import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
test('Synaxis transport never repeats ambiguous creation and scopes receipt per account',async()=>{
  const {createIrisSynaxisTransport,writeSynaxisReceipt,readSynaxisReceipt}=loadTS('lib/irisSynaxisTransport.ts');let calls=0;
  const transport=createIrisSynaxisTransport(async()=>{calls++;throw Error('lost receipt');});assert.equal((await transport.create({accountId:'A'})).kind,'unknown');assert.equal(calls,1);
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  writeSynaxisReceipt(storage,'A',{kind:'unknown',at:1});assert.equal(readSynaxisReceipt(storage,'A').kind,'unknown');assert.equal(readSynaxisReceipt(storage,'B'),null);
  values.set('iris_synaxis_receipt:v1:A','{"kind":"broken"}');assert.equal(readSynaxisReceipt(storage,'A').kind,'unknown');
});
test('unmount during creation clears parent busy but preserves account-scoped uncertainty until settlement',async()=>{
  let slots=[],cursor=0,effects=[],cleanups=[];const previous=globalThis.localStorage;
  const mock={...React,useState:init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef:init=>{const i=cursor++;if(!(i in slots))slots[i]={current:init};return slots[i];},useCallback:f=>f,useEffect:(f,deps)=>{const i=cursor++;if(!(i in slots)){slots[i]=deps;effects.push(f);}}};
  const {DesktopSynaxis}=loadTS('components/iris/DesktopSynaxis.tsx',{react:mock});
  const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
  let finish,busy=false,calls=0;const pending=new Promise(r=>finish=r);
  const props={account:{id:'A',nickname:'owner',role:'길드원'},active:false,locked:false,selectedId:null,initialData:{accountId:'A',canCreateBus:false,characters:[{id:'C',nickname:'char',job:'힐러',combatPower:1,magicResistance:1,completed:[]}],options:[{id:'raid_cabrak',name:'카브락',category:'레이드',difficulties:[{name:'어려움',capacity:8,minCombatPower:0}]}]},transport:{create:()=>{calls++;return pending;}},onBusyChange:v=>{busy=v;}};
  const render=()=>{cursor=0;const tree=DesktopSynaxis(props);for(const effect of effects.splice(0)){const cleanup=effect();if(cleanup)cleanups.push(cleanup);}return tree;};
  const flatten=node=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(flatten):[node,...flatten(node.props?.children)];
  try{
    let tree=render();await Promise.resolve();tree=render();flatten(tree).find(e=>e.type==='input'&&e.props.type==='radio').props.onChange({target:{checked:true}});
    tree=render();flatten(tree).find(e=>e.type==='button'&&e.props.children==='생성 내용 확인').props.onClick();tree=render();const button=flatten(tree).find(e=>e.type==='button'&&e.props.children==='생성 확정');
    const submitted=button.props.onClick();button.props.onClick();assert.equal(calls,1);assert.equal(busy,true);assert.equal(JSON.parse(storage.get('iris_synaxis_receipt:v1:A')).kind,'unknown');
    for(const cleanup of cleanups)cleanup();assert.equal(busy,false);finish({kind:'created',partyId:'1'});await submitted;await Promise.resolve();assert.equal(busy,false);assert.equal(JSON.parse(storage.get('iris_synaxis_receipt:v1:A')).partyId,'1');assert.equal(storage.has('iris_synaxis_receipt:v1:B'),false);
  }finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
test('Synaxis unavailable UI is read-only, bounded and explains explicit creation',()=>{
  assert.ok(existsSync('components/iris/DesktopSynaxis.tsx'),'UI missing');
  const {DesktopSynaxis}=loadTS('components/iris/DesktopSynaxis.tsx');const html=renderToStaticMarkup(React.createElement(DesktopSynaxis,{account:{id:'A',nickname:'한설',role:'길드원'},active:false,locked:true,selectedId:null}));
  assert.ok(html.includes('생텀 파티 목록'));assert.ok(html.includes('자동 저장'));assert.ok(!html.includes('생성 확정'));
});
