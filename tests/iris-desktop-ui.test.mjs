import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const file='components/iris/DesktopCheckboard.tsx';
test('checkboard projects optimistic values with stable category/task keys through busy states',()=>{
  assert.equal(existsSync(file),true,'Missing desktop checkboard');
  const {DesktopCheckboard,desktopRows}=loadTS(file);
  const selected={accountId:'a',characterId:'b',writeContext:{periodKeys:{weekly:'period'}},details:{tasks:{daily:[],weekly:[{id:'x',name:'뱅가드 브리치',completed:0,total:3}],abyss:[],raid:[]},classes:[]}};
  const pending=[{environment:'development',accountId:'a',characterId:'b',category:'weekly',taskId:'x',periodKey:'period',desiredCompleted:2,phase:'pending',revision:1}];
  assert.deepEqual(desktopRows(selected,pending,'weekly').map(r=>[r.key,r.completed]),[['weekly:x',2]]);
  const html=renderToStaticMarkup(React.createElement(DesktopCheckboard,{selected,pending,locked:false,onEdit(){}}));
  assert.match(html,/뱅가드 브리치/);assert.match(html,/2\/3/);
  assert.deepEqual(desktopRows(selected,pending.map(e=>({...e,phase:'inflight'})),'weekly').map(r=>r.key),['weekly:x']);
});
test('save status explains 15-second debounce and exposes manual save and discard',()=>{
  const path='components/iris/DesktopSaveStatus.tsx';assert.equal(existsSync(path),true,'Missing desktop save status');
  const {DesktopSaveStatus}=loadTS(path);
  const html=renderToStaticMarkup(React.createElement(DesktopSaveStatus,{entries:[],now:0,locked:false,onSave(){},onDiscard(){},onRecover(){}}));
  assert.match(html,/15초/);assert.match(html,/지금 저장/);assert.match(html,/변경 버리기/);
});
test('save status groups repeated edits by nickname while exposing named unknown recovery',()=>{
  const {DesktopSaveStatus}=loadTS('components/iris/DesktopSaveStatus.tsx');
  const entries=[1,2,3,4,5].map(i=>({characterId:'84',category:'daily',taskId:'t'+i,requestId:'r'+i,deadlineAt:7000,phase:i===5?'unknown':'pending'}));
  const selected={characterId:'84',details:{tasks:{daily:[{id:'t5',name:'요일 던전'}]}}};
  const html=renderToStaticMarkup(React.createElement(DesktopSaveStatus,{entries,characters:[{id:'84',nickname:'화연'}],selected,now:0,locked:false,onSave(){},onDiscard(){},onRecover(){}}));
  assert.equal((html.match(/화연/g)??[]).length,1);assert.match(html,/5개/);assert.match(html,/요일 던전/);
  assert.match(html,/확인하고 재시도/);assert.doesNotMatch(html,/캐릭터 84/);
});
test('remaining filter hides completed tasks but retains paused recovery rows',()=>{
  const {DesktopCheckboard}=loadTS(file);
  const selected={accountId:'a',characterId:'b',writeContext:{periodKeys:{daily:'period'}},details:{tasks:{daily:[{id:'done',name:'완료된 미션',completed:1,total:1},{id:'paused',name:'보류된 미션',completed:1,total:1}],weekly:[],abyss:[],raid:[]},classes:[]}};
  const pending=[{accountId:'a',characterId:'b',category:'daily',taskId:'paused',periodKey:'period',desiredCompleted:1,phase:'unknown',revision:1}];
  const html=renderToStaticMarkup(React.createElement(DesktopCheckboard,{selected,pending,remainingOnly:true,locked:false,onEdit(){}}));
  assert.doesNotMatch(html,/완료된 미션/);assert.match(html,/보류된 미션/);
});
test('login form uses password input and account panel has no persistent code field',()=>{
  const login='components/iris/DesktopLogin.tsx',panel='components/iris/DesktopAccountPanel.tsx';
  assert.equal(existsSync(login)&&existsSync(panel),true,'Missing desktop authentication UI');
  const html=renderToStaticMarkup(React.createElement(loadTS(login).DesktopLogin,{busy:false,onLogin(){}}));
  assert.match(html,/type="password"/);assert.match(html,/로그인 유지/);
  assert.equal(/localStorage|sessionStorage/.test(readFileSync(login,'utf8')),false);
});
test('desktop route keeps global account switching outside the native queue workflow hidden',()=>{
  assert.equal(existsSync('app/iris/desktop/page.tsx'),true,'Missing desktop route');
  assert.match(readFileSync('app/layout.tsx','utf8'),/pathname === '\/iris\/desktop'/);
});
test('native close dialog offers save keep discard and cancel instead of silently dropping edits',()=>{
  const {DesktopCloseDialog}=loadTS('components/iris/DesktopSaveStatus.tsx');
  assert.equal(typeof DesktopCloseDialog,'function');
  const html=renderToStaticMarkup(React.createElement(DesktopCloseDialog,{busy:false,onChoose(){},onCancel(){}}));
  for(const text of ['저장하고 종료','보관하고 종료','버리고 종료','돌아가기'])assert.ok(html.includes(text));
});
test('storage failure close exposes explicit recent-change loss warning',()=>{
  const {DesktopCloseDialog}=loadTS('components/iris/DesktopSaveStatus.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopCloseDialog,{busy:false,storageFailed:true,onChoose(){},onCancel(){},onUnsafeClose(){}}));
  assert.match(html,/최근 변경을 잃을 수 있어요/);assert.match(html,/손실 가능성을 확인하고 종료/);
});
test('native tray provides loss-confirmed recovery exit when browser channel is unavailable',()=>{
  assert.match(readFileSync('iris/desktop.ps1','utf8'),/ConfirmRecoveryClose/);
  assert.match(readFileSync('iris/desktop-webview.cs','utf8'),/public void ConfirmRecoveryClose/);
});
test('optional desktop launcher rejects simultaneous legacy overlay to prevent competing edit queues',()=>{
  const source=readFileSync('iris/desktop.ps1','utf8');assert.match(source,/Win32_Process/);assert.match(source,/overlay\\\.ps1/);
});
