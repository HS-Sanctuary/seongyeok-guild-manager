import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';

// SSR cannot finish effects/fetches. Supply complete externally loaded hook state;
// the browser companion exercises the real hook and HTTP boundary.
const replacements=state=>({
  '@/hooks/useBarterFavorites':{useBarterFavorites:()=>({favorites:[2],ready:true,busy:false,message:'',refresh:async()=>{},toggle:async()=>true,importLegacy:async()=>true,...state})},
  '@/components/character/BarterFavoritesFeedback':{BarterFavoritesFeedback:()=>null},
});
const rows=[
  {id:1,map:'가 마을',npc:'가 상인',reward:'첫 품목',cost:'양털',limit:3,reset_type:'일간',scope:'캐릭당'},
  {id:2,map:'하 마을',npc:'하 상인',reward:'둘째 품목',cost:'우유',limit:5,reset_type:'주간',scope:'계정당'},
];
const webProps={accountId:'00000000-0000-4000-8000-000000000001',accountNickname:'한설',categoryType:'barter',title:'물물교환',items:rows,tradeProgress:{1:1,2:4},tradeCompletedBy:{},tradeSearch:'',setTradeSearch(){},tradeSortOrder:'asc',setTradeSortOrder(){},updateTradeProgress(){}};
const selected={accountId:webProps.accountId,characterId:'A',details:{barter:rows.map(row=>({id:String(row.id),map:row.map,npc:row.npc,reward:row.reward,cost:row.cost,rewardCount:1,costCount:2,total:row.limit,resetType:row.reset_type,scope:row.scope==='계정당'?'account':'character',completed:row.id===1?1:4,periodKey:'week',consistent:true}))},writeContext:{barter:rows.map(row=>({tradeId:String(row.id),periodKey:'week',scope:row.scope==='계정당'?'account':'character',catalogKey:'a'.repeat(64),baseRecords:[]}))}};
const buttonFor=(markup,label)=>markup.match(new RegExp(`<button(?=[^>]*aria-label="${label}")[^>]*>`))?.[0]??'';

test('web loaded account favorites lead the existing map sort and identify each star',()=>{
  const TradeList=loadTS('components/character/TradeList.tsx',replacements()).default;
  const markup=renderToStaticMarkup(React.createElement(TradeList,webProps));
  assert.ok(markup.indexOf('둘째 품목')<markup.indexOf('첫 품목'),'The account favorite precedes the alphabetically earlier map');
  assert.match(buttonFor(markup,'둘째 품목 · 하 상인 즐겨찾기 해제'),/aria-pressed="true"/);
  assert.match(markup,/즐겨찾기만/);
});

test('web favorite star stays disabled while account state is loading or saving',()=>{
  for(const state of [{ready:false},{busy:true}]){
    const TradeList=loadTS('components/character/TradeList.tsx',replacements(state)).default;
    const markup=renderToStaticMarkup(React.createElement(TradeList,webProps));
    assert.match(buttonFor(markup,'첫 품목 · 가 상인 즐겨찾기 추가'),/disabled/);
  }
});

test('IRIS uses numeric catalog favorites without changing exchange values and disables locked stars',()=>{
  const {DesktopBarter}=loadTS('components/iris/DesktopBarter.tsx',replacements());
  const markup=renderToStaticMarkup(React.createElement(DesktopBarter,{selected,pending:[],locked:true,onEdit(){}}));
  assert.ok(markup.indexOf('둘째 품목')<markup.indexOf('첫 품목'));
  assert.match(buttonFor(markup,'둘째 품목 · 하 상인 즐겨찾기 해제'),/aria-pressed="true"/);
  assert.match(buttonFor(markup,'둘째 품목 · 하 상인 즐겨찾기 해제'),/disabled/);
  assert.match(markup,/4\/5/);
  assert.match(markup,/1\/3/);
  assert.match(markup,/즐겨찾기만/);
});
