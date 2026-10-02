// Local, read-only visual fixture: real components/CSS, synthetic party, no DB/session.
import {createServer} from 'node:http';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
import {createRequire} from 'node:module';
import {resolve,sep} from 'node:path';

const require = createRequire(import.meta.url);
const {webpack} = require('next/dist/compiled/webpack/webpack');
await new Promise((done, reject) => webpack({
  mode:'development', entry:resolve('tests/party-name-hydrate.tsx'),
  output:{path:resolve('.next/party-layout-preview'),filename:'name.js'},
  resolve:{extensions:['.tsx','.ts','.js']},
  module:{rules:[{test:/\.(tsx?|css)$/,exclude:/node_modules/,use:resolve('tests/party-preview-loader.cjs')}]},
},(error,stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString())) : done()));
// Keep generated assets in memory so a parallel Next build cannot remove them
// while this read-only verification server is serving a browser request.
const nameJS = readFileSync('.next/party-layout-preview/name.js');
const chunks = '.next/dev/static/chunks';
const cssFile = readdirSync(chunks).find(file => file.startsWith('app_globals_') && file.endsWith('.css'));
const globalCSS = readFileSync(`${chunks}/${cssFile}`,'utf8');

createServer((request,response) => {
  const url = new URL(request.url,'http://localhost:3010');
  if (url.pathname === '/name.js') {
    response.setHeader('Content-Type','text/javascript');
    response.end(nameJS);
    return;
  }
  if (url.pathname.startsWith('/svgs/')) {
    const asset = resolve('public',decodeURIComponent(url.pathname).slice(1));
    if (!asset.startsWith(resolve('public')+sep) || !existsSync(asset)) {
      response.writeHead(404);response.end();return;
    }
    response.setHeader('Content-Type','image/svg+xml');
    response.end(readFileSync(asset));return;
  }
  const width = Math.max(280,Math.min(1280,Number(url.searchParams.get('width')) || 540));
  const font = [18,20,22].includes(Number(url.searchParams.get('font'))) ? Number(url.searchParams.get('font')) : 20;
  const styles = {};
  let moduleCSS = '';
  for (const file of ['GuildBusCard','PartyFilterHeader']) {
    const path = `components/party/${file}.module.css`;
    const css = existsSync(path) ? readFileSync(path,'utf8') : '';
    styles[`./${file}.module.css`] = Object.fromEntries([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(match => [match[1],match[1]]));
    moduleCSS += css;
  }
  const replacements = {...styles,'@/lib/supabase':{supabase:{}},'@/lib/memberMutationClient':{}};
  const Card = loadTS('components/party/GuildBusCard.tsx',replacements).default;
  const Header = loadTS('components/party/PartyFilterHeader.tsx',replacements).default;
  const name = url.searchParams.get('name') || '열두글자캐릭터이름테스트';
  const alias = url.searchParams.get('alias') || '';
  const catalog = {loaded:true,error:null,classes:[{name:'대검전사',role:'근딜'}],contents:[],powerReqs:[]};
  const party = {id:'fixture',party_type:'길드버스',leader_name:name,content_name:'레이드 - 카브락',difficulty:'어려움',time_start:'00:00',time_end:'24:00',max_members:8,status:'모집중',sub_content:'공지 메모가 카드 안에서 표시됩니다.',members:[{name,character_name:name,job:'대검전사',owner:'fixture-account',combat_power:Number(url.searchParams.get('cp')) || 111646,allow_repeat:true,is_driver:true}]};
  const noop = () => {};
  const header = renderToStaticMarkup(React.createElement(Header,{activeDateFilter:'all',setActiveDateFilter:noop,setShowFilterCalendarModal:noop,selectedCategoryFilter:'전체',setSelectedCategoryFilter:noop,statusFilter:'전체보기',setStatusFilter:noop,partySearchTerm:'',setPartySearchTerm:noop,upcomingDates:[],datePartyCounts:{}}));
  const card = renderToStaticMarkup(React.createElement(Card,{party,catalog,characterProfiles:{[name]:{alias}},myCharacterNames:[name],currentUserNickname:'fixture-account',onJoinClick:noop,onDeleteClick:noop,onRefresh:noop,isMasterOrAdmin:true}));
  response.setHeader('Content-Type','text/html; charset=utf-8');
  const escape = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  response.end(`<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${globalCSS}\n${moduleCSS}\nhtml{font-size:${font}px!important}body{margin:0;padding:12px;background:#191919;color:#eee;--panel:#0d0d0d;--inner-box:#101010;--panel-border:#333;--accent:#edcd85;--accent-fg:#000;--text-main:#eee;--text-sub:#aaa;--accent-soft:#302817}main{width:${width}px;max-width:100%;margin:auto}section{margin-top:16px}</style></head><body data-fixture-name="${escape(name)}" data-fixture-alias="${escape(alias)}"><main>${header}<section>${card}</section></main><script defer src="/name.js"></script></body></html>`);
}).listen(3010,'127.0.0.1',() => console.log('Read-only synthetic layout fixture: http://localhost:3010'));
