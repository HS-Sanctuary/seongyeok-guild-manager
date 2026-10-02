import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTS } from './load-ts.mjs';
const replacements = {'@/lib/supabase':{supabase:{}},'@/lib/memberMutationClient':{}};
const GuildBusCard = loadTS('components/party/GuildBusCard.tsx', replacements).default;
const PartyCard = loadTS('components/party/PartyCard.tsx', replacements).default;
const {compactMemberAlias} = loadTS('components/party/ResponsiveMemberName.tsx', replacements);
const catalog = {loaded:true,error:null,classes:[{name:'대검전사',role:'근딜'}],contents:[],powerReqs:[]};
const party = {id:1,content_name:'레이드 - 에이렐',difficulty:'어려움',time_start:'00:00',time_end:'24:00',max_members:4,status:'모집중',leader_name:'main',party_type:'1회 클리어',sub_content:'[성역 길드 버스] 보존할 공지',members:[{name:'alt',job:'대검전사',role:'탱커',roles:['탱커'],owner:'account',combat_power:100,allow_repeat:true}]};
const noop = () => {};

test('guild bus keeps the complete nickname in both the active slot and own participation chip', () => {
  const name = '열두글자캐릭터이름테스트';
  const member = {...party.members[0],name,character_name:name};
  const html = renderToStaticMarkup(React.createElement(GuildBusCard, {
    party:{...party,members:[member]}, catalog, myCharacterNames:[name],
    currentUserNickname:'account', onJoinClick:noop, onDeleteClick:noop,
    onRefresh:noop, isMasterOrAdmin:false,
  }));
  // Attribute titles are not visible text and must not hide a truncated label.
  const visibleText = html.replace(/<title>.*?<\/title>/g, '').replace(/<span[^>]*aria-hidden="true"[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]*>/g, '');
  assert.equal(visibleText.split(name).length - 1, 2);
});

test('active bus slot prefers the actual nickname even when a saved alias exists', () => {
  const name = '열두글자캐릭터이름테스트';
  const member = {...party.members[0],name,character_name:name,alias:'별명'};
  const html = renderToStaticMarkup(React.createElement(GuildBusCard, {
    party:{...party,members:[member]}, catalog, myCharacterNames:[name],
    currentUserNickname:'account', onJoinClick:noop, onDeleteClick:noop,
    onRefresh:noop, isMasterOrAdmin:false,
  }));
  const visibleText = html.replace(/<title>.*?<\/title>/g, '').replace(/<span[^>]*aria-hidden="true"[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]*>/g, '');
  assert.ok(visibleText.includes(name), 'the active slot must not always replace the actual nickname with its alias');
});

test('compact name uses the saved alias, or nickname first three when no valid alias exists', () => {
  const name = '열두글자캐릭터이름테스트';
  for (const [alias,tempAlias,want] of [
    [' 별명 ',undefined,'별명'],
    ['긴애칭이름',undefined,'긴애칭'],
    [undefined,undefined,'열두글'],
    ['   ',undefined,'열두글'],
    ['EMPTY','임시','임시'],
    ['NULL',undefined,'열두글'],
  ]) assert.equal(compactMemberAlias(name,alias,tempAlias),want);
});

test('current character directory alias wins over missing or historical bus-member aliases', () => {
  assert.equal(compactMemberAlias('열두글자캐릭터이름테스트',undefined,undefined,'별명'),'별명');
  assert.equal(compactMemberAlias('열두글자캐릭터이름테스트','옛별명',undefined,'새별명'),'새별명');
});
test('guild bus renders current class role and memo, exposes own alt repeat and leave controls', () => {
  const html=renderToStaticMarkup(React.createElement(GuildBusCard,{party,catalog,myCharacterNames:['alt'],currentUserNickname:'account',onJoinClick:noop,onDeleteClick:noop,onRefresh:noop,isMasterOrAdmin:false}));
  assert.ok(html.includes('근딜'));
  assert.ok(html.includes('보존할 공지'));
  assert.ok(html.includes('alt 버스 탈퇴'));
  assert.ok(!html.includes('버스 컨트롤러'));
});
test('normal card also uses current admin catalog, not historical saved tank role', () => {
  const html=renderToStaticMarkup(React.createElement(PartyCard,{party,catalog,myCharacterNames:['alt'],allCharactersMap:{},openJoinPopup:noop,setInspectCharacter:noop,handleLeaveParty:noop,handleDeleteParty:noop,isAdmin:false}));
  assert.ok(html.includes('근딜'));
});
