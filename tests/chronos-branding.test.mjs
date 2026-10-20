import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {loadTS} from './load-ts.mjs';

const h=React.createElement;
const {navItems}=loadTS('types/layout.ts');
const Link=({children,...props})=>h('a',props,children);

test('mobile character navigation displays CHRONOS without changing the character route',()=>{
 const Mobile=loadTS('components/layout/MobileBottomSheet.tsx',{'next/link':Link}).default;
 const html=renderToStaticMarkup(h(Mobile,{fabPosition:{x:12},handlePointerDown(){},handleMenuClick(){},isFabOpen:true,setIsFabOpen(){},isDraggingSheet:false,sheetDragY:0,handleSheetDragStart(){},setIsThemeModalOpen(){},navItems,pathname:'/character'}));
 const character=html.match(/<a\b[^>]*href="\/character"[\s\S]*?<\/a>/)?.[0];
 assert.ok(character,'Existing /character destination must remain available');
 assert.match(character,/CHRONOS/);
 assert.match(character,/크로노스/);
 assert.doesNotMatch(character,/KRONOS/);
});

test('home checkboard displays CHRONOS and preserves its character workspace entry',()=>{
 const Checkboard=loadTS('components/sanctum/KronosCheckboardSection.tsx').default;
 const html=renderToStaticMarkup(h(Checkboard,{myCharacters:[],dailyTasks:[],weeklyTasks:[],abyssList:[],raidList:[],accountProgressRate:0,checkTaskDone:()=>false,formatName:s=>s,router:{push(){}}}));
 assert.match(html,/CHRONOS Check Board/);
 assert.match(html,/Learn More/);
 assert.doesNotMatch(html,/Kronos Check Board/);
});

test('IRIS displays CHRONOS but selects the existing kronos protocol identifier',()=>{
 const {DesktopMainTabs}=loadTS('components/iris/DesktopMainTabs.tsx');
 const selected=[],element=DesktopMainTabs({section:'kronos',locked:false,onChoose:id=>selected.push(id)});
 const html=renderToStaticMarkup(element);
 assert.match(html,/CHRONOS/);
 const buttons=React.Children.toArray(element.props.children);
 const button=buttons.find(b=>b.props['aria-label']==='크로노스');
 assert.equal(button.props['aria-pressed'],true);
 assert.equal(button.props['aria-controls'],'iris-pane-kronos');
 button.props.onClick();
 assert.deepEqual(selected,['kronos']);
});

test('cancelled bus round completion mentions CHRONOS and never acquires the action lock',async()=>{
 // Execute the production handler up to the cancelled consent boundary; no DB transport.
 const file='components/party/GuildBusCard.tsx',source=readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let expression;
 function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='handleCompleteAndNextRound')expression=node.initializer.getText(ast);ts.forEachChild(node,visit);}
 visit(ast);assert.ok(expression);
 const js=ts.transpileModule('const handler='+expression,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const lock={current:false},messages=[];
 const handler=new Function('canManage','actionLock','catalog','activeMembers','confirm','alert',js+';return handler;')(true,lock,{loaded:true,error:''},[{character_name:'synthetic'}],message=>{messages.push(message);return false;},()=>{throw Error('Unexpected alert');});
 await handler();
 assert.equal(messages.length,1);
 assert.match(messages[0],/1명의 CHRONOS 숙제/);
 assert.equal(lock.current,false);
});
