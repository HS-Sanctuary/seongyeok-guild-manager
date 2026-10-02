import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTS } from './load-ts.mjs';

const replacements = {'@/lib/supabase':{supabase:{}},'@/lib/memberMutationClient':{}};
const Modal = loadTS('components/party/modals/ContentSelectModal.tsx', replacements).default;
const {CONTENT_DB} = loadTS('components/party/types.ts');
const {findPartyPowerReq} = loadTS('lib/busUtils.ts', replacements);
const {isSupportedPartyContent} = loadTS('lib/partyContentCatalog.ts');
const noop = () => {};
const row = (content_type, content_name, difficulty, max_members = 4) => ({
  id:1, content_id:1, content_type, content_name, difficulty, max_members,
  min_cp:100, rec_cp:200, op_cp:300, rec_mr:0, op_mr:0,
});
// Literal fixtures match the verified catalog, not the production options builder.
const powerReqs = [
  ...['입문','어려움'].map(diff => row('raid','카브락',diff,8)),
  ...['어려움','매우 어려움'].map(diff => row('raid','화이트 서큐버스',diff)),
  ...['어려움','매우 어려움'].map(diff => row('raid','에이렐',diff)),
  ...['허상의 정박지','광기의 동굴','흩어진 물길'].flatMap(name =>
    ['입문','어려움','매우 어려움','지옥1','지옥2',...(name === '광기의 동굴' ? [] : ['지옥3'])]
      .map(diff => row('abyss',name,diff))),
];
const catalog = {loaded:true,error:null,classes:[],contents:[],powerReqs};
function render(id, options = {}) {
  const content = CONTENT_DB.find(c => c.id === id);
  return renderToStaticMarkup(React.createElement(Modal, {
    showContentModal:true,setShowContentModal:noop,tempContentCategory:content.category,
    setTempContentCategory:noop,tempContent:content,setTempContent:noop,
    tempDiff:'어려움',setTempDiff:noop,setTempSubContents:noop,applyContentModal:noop,catalog,
    ...options,
  }));
}
function difficulties(html) {
  return [...html.matchAll(/<button\b[^>]*>([^<]+)<\/button>/g)].map(m=>m[1].trim())
    .filter(text => /^(입문|어려움|매우 어려움|지옥\s*\d+)$/.test(text));
}
for (const [id, expected] of [
  ['raid_cabrak',['입문','어려움']],
  ['raid_succubus',['어려움','매우 어려움']],
  ['raid_eirel',['어려움','매우 어려움']],
]) {
  test(`${id}: real selector renders only its DB difficulties`, () => {
    assert.deepEqual(difficulties(render(id)), expected);
  });
}
test('individual abyss includes DB hell 3; multi selection uses their intersection', () => {
  assert.deepEqual(difficulties(render('abyss_1')), ['입문','어려움','매우 어려움','지옥1','지옥2','지옥3']);
  assert.deepEqual(difficulties(render('abyss_all')), ['입문','어려움','매우 어려움','지옥1','지옥2']);
  assert.deepEqual(difficulties(render('abyss_all',{tempSubContents:['abyss_1','abyss_3']})), ['입문','어려움','매우 어려움','지옥1','지옥2','지옥3']);
});
test('another category with the same name cannot supply raid difficulties', () => {
  assert.deepEqual(difficulties(render('raid_cabrak',{catalog:{...catalog,powerReqs:[...powerReqs,row('abyss','카브락','지옥3')]}})), ['입문','어려움']);
});
test('missing, loading or failed catalog does not invent options and disables apply', () => {
  for (const state of [{loaded:true,error:null},{loaded:false,error:null},{loaded:true,error:'실패'}]) {
    const html = render('raid_cabrak',{catalog:{...catalog,...state,powerReqs:[]}});
    assert.deepEqual(difficulties(html),[]);
    assert.match(html, /<button\b[^>]*disabled=""[^>]*>적용하기<\/button>/);
  }
});
test('selected difficulty determines capacity instead of first DB row', () => {
  const html = render('raid_eirel',{tempDiff:'매우 어려움',catalog:{...catalog,powerReqs:[row('raid','에이렐','어려움',4),row('raid','에이렐','매우 어려움',6)]}});
  assert.match(html, /6인/);
});
test('power requirements tolerate historical hell spacing without cross-category match', () => {
  const req = row('abyss','허상의 정박지','지옥1');
  assert.equal(findPartyPowerReq([req],'어비스 - 허상의 정박지','지옥 1'),req);
  assert.equal(findPartyPowerReq([row('abyss','카브락','어려움')],'레이드 - 카브락','어려움'),null);
});
test('submission guard rejects phantom raid difficulties and missing catalog rows', () => {
  const content = CONTENT_DB.find(c => c.id === 'raid_cabrak');
  assert.equal(isSupportedPartyContent(content,'어려움',powerReqs),true);
  assert.equal(isSupportedPartyContent(content,'매우 어려움',powerReqs),false);
  assert.equal(isSupportedPartyContent(content,'어려움',[]),false);
  assert.equal(isSupportedPartyContent(CONTENT_DB[0],'지옥3',powerReqs),false);
  assert.equal(isSupportedPartyContent(CONTENT_DB[0],'지옥 3',powerReqs,['abyss_1','abyss_3']),true);
});
test('stale unsupported selection is presented as the registered default, not kept hidden', () => {
  const html = render('raid_cabrak',{tempDiff:'지옥 2'});
  assert.deepEqual(difficulties(html),['입문','어려움']);
  assert.ok(!html.includes('지옥 2'));
});
test('both normal-party and guild-bus modal wrappers forward the same catalog', () => {
  const calls = [];
  const Child = props => {calls.push(props.catalog); return null;};
  const wrapped = {...replacements,'@/components/party/modals/ContentSelectModal':{__esModule:true,default:Child}};
  const BusModal = loadTS('components/party/modals/BusCreateModal.tsx',wrapped).default;
  const PartyModals = loadTS('components/party/PartyModals.tsx',{
    ...wrapped,'@/components/party/modals/BusCreateModal':{__esModule:true,default:BusModal},
  }).default;
  renderToStaticMarkup(React.createElement(PartyModals, {
    catalog,showContentModal:true,showBusCreateModal:true,tempContent:CONTENT_DB[0],tempDiff:'어려움',tempContentCategory:'어비스',
    busCreateContent:CONTENT_DB.find(c=>c.id==='raid_cabrak'),busCreateDiff:'어려움',
    busCharSelections:{},myCharacters:[],calendarDays:[],calendarYearMonth:{year:2026,month:10},
    busCreateDate:'2026-10-01',busCreateTimeStart:'20:00',busCreateTimeEnd:'23:59',
  }));
  assert.deepEqual(calls,[catalog,catalog]);
});
