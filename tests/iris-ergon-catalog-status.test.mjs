import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const {DesktopErgonCatalog}=loadTS('components/iris/DesktopErgonCatalog.tsx');
test('processing picker explains full facilities and output per work without pretending availability',()=>{
 const html=renderToStaticMarkup(React.createElement(DesktopErgonCatalog,{kind:'altering',search:'',items:[{name:'가죽+',available:false,reason:'queue_full',producedPerUnit:3}],favorites:[],onlyFavorites:false,disabled:false,replacing:false,onKindChange(){},onSearchChange(){},onFavoritesOnlyChange(){},onToggleFavorite(){},onChoose(){},onCancelReplace(){}}));
 assert.match(html,/시설 가득 참/);assert.match(html,/작업당 3개/);assert.doesNotMatch(html,/시작 가능/);
 assert.match(html,/작업 선택/,'A blocked recipe can still be planned without starting it');
});
