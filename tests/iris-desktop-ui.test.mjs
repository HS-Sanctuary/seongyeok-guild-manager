import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const file='components/iris/DesktopCheckboard.tsx';

test('font size dropdown includes point-size bounds without display-resolution labels',()=>{
  const {DesktopAddonSettings}=loadTS('components/iris/DesktopAddonSettings.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopAddonSettings,{accountPanel:null,appearance:{theme:'aureum',persistent:true,fontSize:18,setTheme(){},setFontSize(){}},addonState:null,onPreferencesChange(){},onBack(){}}));
  assert.match(html,/<select[^>]*aria-label="글자 크기"/);for(const size of [6,22])assert.match(html,new RegExp('<option[^>]*>'+size+'pt</option>'));
  assert.doesNotMatch(html,/FHD|QHD/);
});

test('all Kronos features are immediately available without opening a picker',()=>{
  const {DesktopFeaturePicker}=loadTS('components/iris/DesktopFeaturePicker.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopFeaturePicker,{value:'homework',disabled:false,onChoose(){}}));
  for(const title of ['숙제','클래스','스탯','재화','물물교환','상점구매','임무게시판'])assert.match(html,new RegExp('<button[^>]*>'+title+'</button>'));
  assert.doesNotMatch(html,/기능 선택|aria-expanded/);
  assert.match(html,/aria-pressed="true"[^>]*>숙제<\/button>/);
  const locked=renderToStaticMarkup(React.createElement(DesktopFeaturePicker,{value:'homework',disabled:true,onChoose(){}}));
  assert.equal((locked.match(/disabled=""/g)??[]).length,8);
});

test('account actions and remembered accounts are directly available without a switch step',()=>{
  const {DesktopAccountPanel}=loadTS('components/iris/DesktopAccountPanel.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopAccountPanel,{account:{id:'a',nickname:'화연',role:'길드원'},remembered:[],busy:false,onSwitch:async()=>{},onLogout:async()=>{},onLogin:async()=>{}}));
  for(const label of ['다른 계정 로그인','로그아웃'])assert.match(html,new RegExp('<button[^>]*>'+label+'</button>'));
  assert.doesNotMatch(html,/<button[^>]*>계정 전환<\/button>/);
  const locked=renderToStaticMarkup(React.createElement(DesktopAccountPanel,{account:{id:'a',nickname:'화연',role:'길드원'},remembered:[],busy:true,onSwitch:async()=>{},onLogout:async()=>{},onLogin:async()=>{}}));
  for(const label of ['다른 계정 로그인','로그아웃'])assert.match(locked,new RegExp('<button[^>]*disabled=""[^>]*>'+label+'</button>'));
});

test('center enables barter, shop and missions as separate Kronos panels',()=>{
  const {DesktopCenter}=loadTS('components/iris/DesktopCenter.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopCenter,{account:{id:'a',nickname:'한설',role:'길드원'},characters:[{id:'7',nickname:'열두글자캐릭터닉네임확인',job:'장궁병'}],selected:{characterId:'7',details:{tasks:{daily:[],weekly:[],abyss:[],raid:[]},classes:[]}},pending:[],locked:false,onSelectCharacter(){},onEdit(){},onClose(){}}));
  assert.match(html,/aria-label="상위 메뉴"/);assert.match(html,/aria-label="크로노스 기능"/);
  for(const id of ['shop','missions','barter'])assert.match(html,new RegExp('id="iris-pane-'+id+'"'));
  const {DesktopFeaturePicker}=loadTS('components/iris/DesktopFeaturePicker.tsx');
  const choices=renderToStaticMarkup(React.createElement(DesktopFeaturePicker,{value:'homework',disabled:false,onChoose(){}}));
  for(const label of ['상점구매','임무게시판','물물교환'])assert.match(choices,new RegExp('<button(?![^>]*disabled)[^>]*>'+label));
  assert.doesNotMatch(html,/<span>준비 중<\/span>/);
  assert.match(html,/생텀 선택/);assert.match(html,/열두글자캐릭터닉네임확인/);
});

test('empty save status does not reserve a blank live-status row and places save-time info in disclosure',()=>{
  const {DesktopSaveStatus}=loadTS('components/iris/DesktopSaveStatus.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopSaveStatus,{entries:[],now:0,locked:false,onSave(){},onDiscard(){},onRecover(){}}));
  assert.doesNotMatch(html,/<div role="status"><\/div>/);
  assert.match(html,/<details[^>]*>[\s\S]*이번 실행에서 확인한 저장 시각 없음[\s\S]*<\/details>/);
});

test('stats actions expose refresh before update and confirmation highlights the target nickname',()=>{
  const props={accountId:'a',characterId:'b',locked:false,readGame:async()=>{},onSelectCharacter(){},onBusyChange(){}};
  const html=renderToStaticMarkup(React.createElement(loadTS('components/iris/DesktopStats.tsx').DesktopStats,props));
  assert.ok(html.indexOf('스탯 재조회')>=0&&html.indexOf('스탯 재조회')<html.indexOf('생텀 DB에 업데이트'));
  const dialog=renderToStaticMarkup(React.createElement(loadTS('components/iris/DesktopStatsConfirmation.tsx').DesktopStatsConfirmation,{target:{id:'b',nickname:'탄월',job:'도적'},characters:[],job:'도적',busy:false,canConfirm:true,onConfirm(){},onSelectCharacter(){},onCancel(){}}));
  assert.match(dialog,/<strong[^>]*>탄월<\/strong>/);
});

test('stats initial screen has an update trigger but no permanent nickname confirmation',()=>{
  const {DesktopStats}=loadTS('components/iris/DesktopStats.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopStats,{accountId:'a',characterId:'b',locked:false,readGame:async()=>{},onSelectCharacter(){},onBusyChange(){}}));
  assert.match(html,/aria-haspopup="dialog"/);assert.doesNotMatch(html,/네, 맞아요/);
});

test('short filtered class lists expand naturally while all classes retain a scroll boundary',()=>{
  const {DesktopClasses}=loadTS('components/iris/DesktopClasses.tsx');
  const selected={accountId:'a',characterId:'b',writeContext:{classes:[]},details:{classes:[{id:'1',name:'전사',level:1}]}};
  const html=renderToStaticMarkup(React.createElement(DesktopClasses,{selected,pending:[],locked:false}));
  assert.match(html,/data-scrollable="true"/);
});
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
  const pending=[{kind:'task',environment:'development',accountId:'a',characterId:'b',category:'weekly',taskId:'x',periodKey:'period',desiredCompleted:2,phase:'pending',revision:1}];
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
  const pending=[{kind:'task',accountId:'a',characterId:'b',category:'daily',taskId:'paused',periodKey:'period',desiredCompleted:1,phase:'unknown',revision:1}];
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
  for(const text of ['생텀에 저장 후 종료','이 PC에 보관 후 종료','버리고 종료','돌아가기'])assert.ok(html.includes(text));
});
test('clean native close has one exit action but storage failures retain recovery choices',()=>{
  const {DesktopCloseDialog}=loadTS('components/iris/DesktopSaveStatus.tsx');
  const props={busy:false,hasPending:false,onChoose(){},onCancel(){}};
  const clean=renderToStaticMarkup(React.createElement(DesktopCloseDialog,props));
  assert.match(clean,/>종료<\/button>/);
  assert.doesNotMatch(clean,/생텀에 저장 후 종료|이 PC에 보관 후 종료|버리고 종료/);
  const failed=renderToStaticMarkup(React.createElement(DesktopCloseDialog,{...props,storageFailed:true}));
  assert.match(failed,/생텀에 저장 후 종료/);assert.match(failed,/이 PC에 보관 후 종료/);
  const busy=renderToStaticMarkup(React.createElement(DesktopCloseDialog,{...props,busy:true}));
  assert.match(busy,/<button[^>]*disabled=""[^>]*>종료<\/button>/);
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
