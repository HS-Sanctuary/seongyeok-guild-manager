import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {loadTS} from './load-ts.mjs';
test('compact facility cards retain processing labels but use a narrow arrow-free collection button',()=>{
 const {DesktopErgonWorkbench}=loadTS('components/iris/DesktopErgonWorkbench.tsx',{'next/image':{__esModule:true,default:props=>React.createElement('img',props)}}),now=100000;
 const html=renderToStaticMarkup(React.createElement(DesktopErgonWorkbench,{view:'overview',characterLabel:'영겁',disabled:false,onAddPlan:()=>{},onCollection:()=>{},session:{now,loadingKinds:[],currencyBusy:false,refresh:()=>{},refreshOverview:()=>{},snapshots:{works:{schemaVersion:1,kind:'works',observedAt:now,source:'official-cli',data:{completedCount:2,items:[{name:'철괴',facility:'금속 가공 시설',completed:true},{name:'목재',facility:'목재 가공 시설',completed:true}]}}}}}));
 assert.match(html,/<strong>금속 가공<\/strong>/);assert.match(html,/<strong>목재 가공<\/strong>/);assert.match(html,/>수령<\/button>/);assert.doesNotMatch(html,/>수령 →<\/button>/);assert.match(html,/aria-label="금속 가공 시설 수령하러가기"/);
});
