import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const file='components/iris/DesktopCheckboard.tsx';
test('class inputs use database defaults and preserve invalid draft text',()=>{
  const {DesktopClasses:DesktopCheckboard}=loadTS('components/iris/DesktopClasses.tsx');
  const selected={accountId:'a',characterId:'b',writeContext:{periodKeys:{},classes:[{classId:'1',editable:true,baseLevel:53},{classId:'2',editable:true,baseLevel:null},{classId:'3',editable:false,baseLevel:null}]},details:{tasks:{daily:[],weekly:[],abyss:[],raid:[]},classes:[{id:'1',name:'전사',level:53},{id:'2',name:'마법사',level:null},{id:'3',name:'잘못된값',level:null}]}};
  const props={selected,pending:[],locked:false,onEdit(){},onClassDraft(){},onRevertClassDraft(){}};
  const html=renderToStaticMarkup(React.createElement(DesktopCheckboard,props));
  assert.match(html,/aria-label="전사 레벨"[^>]*value="53"/);assert.match(html,/aria-label="마법사 레벨"[^>]*value=""/);
  assert.match(html,/웹에서 확인/);
  const invalid=renderToStaticMarkup(React.createElement(DesktopCheckboard,{...props,classDrafts:{'1':{text:'5.3',error:'정수를 입력해 주세요.'}}}));
  assert.match(invalid,/value="5.3"/);assert.match(invalid,/aria-invalid="true"/);assert.match(invalid,/정수를 입력/);
});

test('class gauges retain database levels above the displayed game range and never default missing levels into edits',()=>{
  const {DesktopClasses}=loadTS('components/iris/DesktopClasses.tsx');
  const selected={accountId:'a',characterId:'b',writeContext:{classes:[{classId:'1',editable:true},{classId:'2',editable:true}]},details:{classes:[{id:'1',name:'전사',level:88},{id:'2',name:'마법사',level:null}]}};
  const html=renderToStaticMarkup(React.createElement(DesktopClasses,{selected,pending:[],locked:false,onClassDraft(){}}));
  assert.match(html,/aria-label="전사 레벨 게이지"[^>]*max="88"[^>]*value="88"/);
  assert.match(html,/aria-label="마법사 레벨"[^>]*value=""/);
});

test('lineage filtering retains invalid drafts instead of hiding a blocked save',()=>{
  const {filterDesktopClasses}=loadTS('components/iris/DesktopClasses.tsx');
  const rows=[{id:'1',name:'전사'},{id:'2',name:'궁수'},{id:'3',name:'새 클래스'}];
  assert.deepEqual(filterDesktopClasses(rows,'궁수',{},new Set()).map(r=>r.id),['2']);
  assert.deepEqual(filterDesktopClasses(rows,'궁수',{'1':{text:'x',error:'오류'}},new Set(['3'])).map(r=>r.id),['1','2','3']);
});
test('desktop login uses Korean composition capable masked code input and retains required bounds',()=>{
  const {DesktopLogin}=loadTS('components/iris/DesktopLogin.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopLogin,{busy:false,onLogin:async()=>{}}));
  assert.match(html,/접속 코드 \(한글 입력 가능\)/);
  assert.match(html,/lang="ko"/);
  assert.match(html,/maxLength="128"/);
  assert.match(html,/required=""/);
  const locked=renderToStaticMarkup(React.createElement(DesktopLogin,{busy:true,onLogin:async()=>{}}));
  assert.match(locked,/aria-label="접속 코드"[^>]*disabled=""/);
});
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

test('save feedback renders selected-character confirmation in KST without hiding unknown recovery',()=>{
  const {DesktopSaveStatus}=loadTS('components/iris/DesktopSaveStatus.tsx');
  const props={entries:[{characterId:'A',category:'weekly',taskId:'t',requestId:'r',deadlineAt:0,phase:'unknown'}],characters:[{id:'A',nickname:'화연'}],now:0,locked:false,onSave(){},onDiscard(){},onRecover(){}};
  const empty=renderToStaticMarkup(React.createElement(DesktopSaveStatus,props));
  assert.doesNotMatch(empty,/<time/);
  const html=renderToStaticMarkup(React.createElement(DesktopSaveStatus,{...props,lastSaveConfirmation:{characterId:'A',nickname:'화연',confirmedAt:Date.parse('2026-10-07T10:42:08.000Z')}}));
  assert.match(html,/dateTime="2026-10-07T10:42:08.000Z"/i);assert.match(html,/19:42:08/);
  assert.match(html,/화연 · 마지막 저장 확인/);assert.match(html,/확인하고 재시도/);
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
