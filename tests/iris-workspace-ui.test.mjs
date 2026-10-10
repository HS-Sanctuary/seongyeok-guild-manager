import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const key={itemKind:'shop',itemId:'1',field:'count',scope:'account',periodKey:'2026-10-04T21:00:00.000Z',catalogKey:'a'.repeat(64)};
const row={id:'1',itemKind:'shop',title:'긴이름의상급설비증축도면',location:'티르코네일',npc:'앨빈',description:'',rewards:[{name:'긴이름의상급설비증축도면',count:1}],cost:10000000,requirement:'생활력 7,000 이상',total:9999,resetType:'주간',scope:'account',completed:2,bookmarked:false,key};
const selected={accountId:'account',characterId:'B',details:{workspace:[row]}};
const edit={...key,environment:'development',accountId:'account',characterId:'A',kind:'workspace',baseCompleted:2,desiredCompleted:9999,revision:1,phase:'pending'};
const module=()=>{assert.ok(existsSync('components/iris/DesktopWorkspace.tsx'),'workspace UI missing');return loadTS('components/iris/DesktopWorkspace.tsx');};
test('workspace UI overlays shared pending intent and shows full titles, conditions and compact controls',()=>{
  const {DesktopWorkspace,desktopWorkspaceRows}=module();assert.equal(desktopWorkspaceRows(selected,[edit])[0].completed,9999);
  const html=renderToStaticMarkup(React.createElement(DesktopWorkspace,{selected,pending:[edit],locked:false,kind:'shop',onEdit(){}}));
  assert.ok(html.includes('9999/9999'));assert.ok(html.includes(row.title));assert.ok(html.includes('계정당'));assert.ok(html.includes('생활력 7,000 이상'));assert.ok(html.includes('MIN'));
});
test('workspace UI missing details stays read-only and a paused result stays visible',()=>{
  const {DesktopWorkspace}=module();const html=renderToStaticMarkup(React.createElement(DesktopWorkspace,{selected:{...selected,details:{}},pending:[],locked:false,kind:'mission',onEdit(){}}));
  assert.ok(html.includes('불러오지 못했어요'));assert.equal(html.includes('MAX'),false);
  const paused=renderToStaticMarkup(React.createElement(DesktopWorkspace,{selected,pending:[{...edit,phase:'unknown'}],locked:false,kind:'shop',onEdit(){}}));assert.ok(paused.includes('결과 확인 필요'));assert.ok(paused.includes('disabled'));
});
