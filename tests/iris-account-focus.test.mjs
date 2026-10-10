import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';

const owner={id:'a',nickname:'한설',role:'길드원'};
const remembered=[owner,{id:'b',nickname:'열두글자닉네임확인중',role:'길드원'}];
const handlers={onSwitch:async()=>true,onLogout:async()=>true,onLogin:async()=>true};

// A hidden intermediate picker would make a remembered account unavailable at opening.
test('opening account management immediately exposes remembered accounts and auth actions',()=>{
  const {DesktopAccountPanel}=loadTS('components/iris/DesktopAccountPanel.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopAccountPanel,{account:owner,remembered,busy:false,...handlers}));
  assert.match(html,/<button[^>]*>열두글자닉네임확인중<\/button>/);
  assert.match(html,/<button[^>]*disabled=""[^>]*>한설 · 사용 중<\/button>/);
  assert.match(html,/<button[^>]*>다른 계정 로그인<\/button>/);
  assert.match(html,/<button[^>]*>로그아웃<\/button>/);
  assert.doesNotMatch(html,/<button[^>]*>계정 전환<\/button>/);
});

test('an in-progress account operation disables direct choices and auth actions',()=>{
  const {DesktopAccountPanel}=loadTS('components/iris/DesktopAccountPanel.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopAccountPanel,{account:owner,remembered,busy:true,...handlers}));
  for(const name of ['열두글자닉네임확인중','다른 계정 로그인','로그아웃'])assert.match(html,new RegExp('<button[^>]*disabled=""[^>]*>'+name+'</button>'));
});

// The account affordance must remain adjacent to settings, rather than buried in settings.
test('context actions expose account then home then settings',()=>{
  const {DesktopContextActions}=loadTS('components/iris/DesktopContextActions.tsx');
  const html=renderToStaticMarkup(React.createElement(DesktopContextActions,{onSettings(){},onAccount(){},accountOpen:true}));
  assert.match(html,/aria-label="계정"[^>]*aria-haspopup="dialog"[^>]*aria-expanded="true"/);
  assert.ok(html.indexOf('aria-label="계정"')>=0&&html.indexOf('aria-label="계정"')<html.indexOf('aria-label="설정"'));
  assert.ok(html.indexOf('aria-label="계정"')<html.indexOf('aria-label="생텀 바로가기"')&&html.indexOf('aria-label="생텀 바로가기"')<html.indexOf('aria-label="설정"'));
});
