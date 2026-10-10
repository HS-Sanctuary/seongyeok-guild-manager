import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const {buildIrisKronosDetails}=loadTS('lib/irisKronos.ts');
const {createDesktopTransport}=loadTS('lib/irisDesktopTransport.ts');
const {DesktopCheckboard}=loadTS('components/iris/DesktopCheckboard.tsx');

test('task aliases reach display while abyss and raids retain full names without changing saved identities',()=>{
  const character={daily_checks:['일일 미션'],raid_checks:['허상의 정박지']};
  const before=JSON.stringify(character);
  const details=buildIrisKronosDetails(character,[{id:1,name:'일일 미션',mobile_name:' 미션 ',type:'daily'}],[{id:2,name:'허상의 정박지',mobile_name:'허상',short_name:'정박지',type:'abyss'},{id:3,name:'광기의 동굴',short_name:'동굴',type:'abyss'},{id:4,name:'카브라크',mobile_name:'\u0000',type:'raid'}],[],new Date('2026-10-08T07:00:00Z'));
  assert.deepEqual(details.tasks.daily[0],{id:'1',name:'일일 미션',displayName:'미션',completed:1,total:1});
  assert.deepEqual(details.tasks.abyss.map(r=>[r.id,r.name,r.displayName,r.completed]),[['2','허상의 정박지',undefined,1],['3','광기의 동굴',undefined,0]]);
  assert.equal(details.tasks.raid[0].displayName,undefined);
  assert.equal(JSON.stringify(character),before);
});

function payload(){return {accountId:'a',characterId:'c',observedAt:'2026-10-08T07:00:00.000Z',writeContext:{periodKeys:Object.fromEntries(['daily','weekly','abyss','raid'].map(k=>[k,'2026-10-07T21:00:00.000Z']))},details:{schemaVersion:1,tasks:{daily:[{id:'1',name:'일일 미션',displayName:'미션',completed:0,total:1}],weekly:[],abyss:[],raid:[]},classes:[]}};}
test('desktop transport retains validated optional aliases and remains compatible with old read responses',async()=>{
  const read=value=>createDesktopTransport({fetch:async()=>new Response(JSON.stringify(value))}).details('a','c');
  assert.equal((await read(payload())).details.tasks.daily[0].displayName,'미션');
  const legacy=payload();delete legacy.details.tasks.daily[0].displayName;
  assert.equal((await read(legacy)).details.tasks.daily[0].displayName,undefined);
  for(const alias of [42,'','\u0000','a'.repeat(121)]){const invalid=payload();invalid.details.tasks.daily[0].displayName=alias;await assert.rejects(read(invalid));}
});

test('checkboard exposes alias tiles and optimistic completed-item summaries while repeat rows remain full width',()=>{
  const selected=payload();selected.details.tasks.weekly=[{id:'2',name:'뱅가드 브리치',completed:0,total:3},{id:'3',name:'[주간 목표] 정기 의뢰',displayName:'정기 의뢰',completed:1,total:1}];
  const pending=[{kind:'task',accountId:'a',characterId:'c',category:'weekly',taskId:'2',periodKey:'2026-10-07T21:00:00.000Z',desiredCompleted:3,phase:'pending',revision:1}];
  const html=renderToStaticMarkup(React.createElement(DesktopCheckboard,{selected,pending,locked:false,onEdit(){}}));
  assert.match(html,/<span[^>]*>미션<\/span>/);
  assert.match(html,/title="일일 미션"/);assert.match(html,/aria-label="일일 미션 완료"/);
  assert.match(html,/주간 숙제[\s\S]*?완료 2\/2/);
  assert.match(html,/data-task-key="weekly:2"[^>]*data-kind="counter"/);
  assert.match(html,/data-task-key="weekly:3"[^>]*data-kind="check"/);
  assert.match(html,/aria-label="뱅가드 브리치 감소"/);assert.match(html,/3\/3/);
});

test('remaining-only mode retains full category totals and explains an empty filtered category',()=>{
  const selected=payload();selected.details.tasks.daily[0].completed=1;
  const html=renderToStaticMarkup(React.createElement(DesktopCheckboard,{selected,pending:[],remainingOnly:true,locked:false,onEdit(){}}));
  assert.match(html,/완료 1\/1/);assert.match(html,/모두 완료했어요/);assert.doesNotMatch(html,/data-task-key="daily:1"/);
});

test('owned Kronos GET actually projects existing alias columns from both catalogs',async()=>{
  const catalogs={characters:[{id:'c',nickname:'화연',owner:'한설',daily_checks:[],weekly_checks:[],raid_checks:[],levels:{}}],nexus_tasks:[{id:1,name:'일일 미션',mobile_name:'미션',type:'daily',is_active:true}],nexus_contents:[{id:2,name:'허상의 정박지',mobile_name:'허상',short_name:'정박지',type:'abyss',is_active:true}],nexus_classes:[]};
  const db={from(table){let columns=[];const query={select(value){columns=value.split(',');return query;},eq(){return query;},order(){return query;},maybeSingle(){return Promise.resolve({data:catalogs[table][0],error:null});},then(resolve){return Promise.resolve({data:catalogs[table].map(row=>Object.fromEntries(columns.filter(k=>k in row).map(k=>[k,row[k]]))),error:null}).then(resolve);}};return query;}};
  const {GET}=loadTS('app/api/iris/kronos/route.ts',{'@/lib/server/sanctumSession':{getSessionAccount:async()=>({id:'a',nickname:'한설'}),isPendingAccount:()=>false,getServerSupabase:()=>db,SANCTUM_SESSION_COOKIE:'fixture'}});
  const response=await GET({cookies:{get:()=>({value:'synthetic'})},nextUrl:new URL('http://localhost/api/iris/kronos?characterId=c')});
  assert.equal(response.status,200);const body=await response.json();
  assert.equal(body.details.tasks.daily[0].displayName,'미션');assert.equal(body.details.tasks.abyss[0].name,'허상의 정박지');assert.equal(body.details.tasks.abyss[0].displayName,undefined);
});

test('all homework categories start selected with no accordion and expose remaining-only control beside category toggles',()=>{
  const html=renderToStaticMarkup(React.createElement(DesktopCheckboard,{selected:payload(),pending:[],locked:false,onEdit(){}}));
  assert.doesNotMatch(html,/<details|<summary/);
  for(const title of ['일일','주간','어비스','레이드'])assert.match(html,new RegExp('<button[^>]*aria-pressed="true"[^>]*>'+title+'<'));
  assert.match(html,/미완료만/);assert.match(html,/aria-label="숙제 분류 표시"/);
});
