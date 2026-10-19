import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';

function renderWithState(file, name, states, props) {
 let index=0;
 const C=loadTS(file,{react:{...React,useState:initial=>[index<states.length?states[index++]:typeof initial==='function'?initial():initial,()=>{}]}})[name];
 return renderToStaticMarkup(React.createElement(C,props));
}
const updaterProps={store:null,disabled:false,onBeforeApply:async()=>true,onBusyChange(){}};
const failed={supported:true,installedVersion:'0.2.0',availableVersion:null,phase:'error',progress:0,error:'check_failed'};
test('failed native release check is visible beside installed version, without a false update offer',()=>{
 const html=renderWithState('components/iris/DesktopUpdater.tsx','DesktopUpdater',[failed,false,false,false,''],updaterProps);
 assert.ok(html.includes('Beta 0.2.0'));
 assert.ok(html.includes('업데이트 조회 실패'));
 assert.ok(html.includes('role="status"'));
 assert.ok(!html.includes('↑ 업데이트'));
});
test('newer native release still offers update beside the actual installed version',()=>{
 const html=renderWithState('components/iris/DesktopUpdater.tsx','DesktopUpdater',[{...failed,availableVersion:'0.2.2',phase:'available',error:null},false,false,false,''],updaterProps);
 assert.ok(html.includes('Beta 0.2.0'));
 assert.ok(html.includes('IRIS 0.2.2 업데이트'));
 assert.ok(!html.includes('업데이트 조회 실패'));
});
test('saved numeric strings and live numbers share comma grouping without changing saved values',()=>{
 const stats={combat_power:'94282',life_energy:'8822',magic_resistance:'3616',charm:'16540'};
 const before=JSON.stringify(stats);
 const character={id:'char',nickname:'거월',job:'대검전사',stats};
 const game={observedAt:new Date().toISOString(),job:'대검전사',level:100,stats:{combat_power:94906,life_energy:8822,magic_resistance:3616,charm:16548}};
 const html=renderWithState('components/iris/DesktopStats.tsx','DesktopStats',[[character],game,false,false,'',Date.now()],{accountId:'account',characterId:'char',locked:false,readGame:async()=>game,onSelectCharacter(){},onBusyChange(){}});
 for(const value of ['94,282','8,822','3,616','16,540','94,906','16,548'])assert.ok(html.includes(`<dd>${value}</dd>`),value);
 assert.equal(JSON.stringify(stats),before);
});
test('saved zero, already grouped values and unknown stats retain their meaning',()=>{
 const character={id:'char',nickname:'한설',job:'댄서',stats:{combat_power:'0',life_energy:'1,234',magic_resistance:null,charm:''}};
 const html=renderWithState('components/iris/DesktopStats.tsx','DesktopStats',[[character],null,false,false,'',0],{accountId:'account',characterId:'char',locked:false,readGame:async()=>null,onSelectCharacter(){},onBusyChange(){}});
 assert.ok(html.includes('<dd>0</dd>'));
 assert.ok(html.includes('<dd>1,234</dd>'));
 assert.ok(!html.includes('<dd></dd>'));
});
