import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
test('Kronos exposes an always-visible content notification tab',()=>{const {DesktopFeaturePicker}=loadTS('components/iris/DesktopFeaturePicker.tsx');const html=renderToStaticMarkup(React.createElement(DesktopFeaturePicker,{value:'homework',disabled:false,onChoose(){}}));assert.match(html,/>알림<\/button>/);});
test('alert tracker suppresses old, off, unconfirmed and duplicate phases',()=>{
 assert.ok(existsSync('lib/irisContentAlerts.ts'),'content alert deduplication unavailable');const {defaultAlertSettings,createContentAlertTracker}=loadTS('lib/irisContentAlerts.ts');const settings=defaultAlertSettings(),tracker=createContentAlertTracker(10000),event={key:'boss:1:active',type:'fieldBoss',at:12000,phase:'active',confirmed:true};
 assert.equal(settings.deep.sound,true);assert.equal(tracker.take({...event,key:'old',at:9000},10000,settings),null);assert.equal(tracker.take(event,12000,settings).key,event.key);assert.equal(tracker.take(event,13000,settings),null);
 assert.equal(tracker.take({...event,key:'no',confirmed:false},12000,settings),null);assert.equal(tracker.take({...event,key:'late',at:11000},40000,settings),null);
 settings.barrier.enabled=false;assert.equal(tracker.take({...event,key:'barrier',type:'barrier'},12000,settings),null);
});
