import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const h=React.createElement;
test('titlebar displays the themeable IRIS asset and only window actions',()=>{
  const {DesktopTitlebar}=loadTS('components/iris/DesktopTitlebar.tsx');
  const html=renderToStaticMarkup(h(DesktopTitlebar,{onDrag(){},onClose(){},onMinimize(){},onSettings(){},onAccount(){}}));
  assert.match(html,/iris-brand-mark/);
  assert.match(decodeURI(html),/IRIS 로고 마크\.svg/);
  assert.doesNotMatch(html,/aria-label="(?:설정|계정)"/);
  assert.match(html,/aria-label="IRIS 종료"/);
});
test('context tools appear next to character picker rather than below content',()=>{
  const {DesktopCenter}=loadTS('components/iris/DesktopCenter.tsx');
  const html=renderToStaticMarkup(h(DesktopCenter,{account:{id:'a',nickname:'한설',role:'길드원'},characters:[],selected:null,pending:[],locked:false,saveStatus:null,onSelectCharacter(){},onEdit(){},contextActions:h('nav',{'aria-label':'계정 도구'},'tools')}));
  assert.match(html,/iris-character-bar[\s\S]*aria-label="계정 도구"/);
  assert.ok(html.indexOf('aria-label="계정 도구"')<html.indexOf('id="iris-character-list"'));
});
