// Real GuildBusCard handlers and transport. Only React lifecycle and external IO are isolated.
// A regression to native confirm/alert must fail with IRIS native dialogs disabled.
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {loadTS} from './load-ts.mjs';

const flatten=node=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(flatten):[node,...flatten(node.props?.children)];
const text=node=>typeof node==='string'?node:Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):'';
function fixture({answer=true,fail=false,web=false,operator=true}={}){
  const native=[],confirmations=[],notices=[],writes=[],deleted=[];let refreshed=0;
  const refs=[];let cursor=0;
  const hooks={...React,useState:init=>[typeof init==='function'?init():init,()=>{}],useEffect:()=>{},useMemo:f=>f(),useRef:init=>refs[cursor++]??(refs[cursor-1]={current:init})};
  const request=async(url,init)=>{writes.push({url,body:JSON.parse(init.body)});return new Response(JSON.stringify(fail?{message:'합성 권한 거부'}:{data:[]}),{status:fail?403:200});};
  const surface=web?null:{active:true,locked:false,confirm:async options=>{confirmations.push(options);return typeof answer==='function'?answer():answer;},notify:message=>notices.push(message)};
  const {default:Card}=loadTS('components/party/GuildBusCard.tsx',{
    react:hooks,'@/lib/supabase':{supabase:{}},
    '@/components/party/PartySurfaceContext':{usePartySurface:()=>surface,usePartyOperations:()=>({request,memberMutation:()=>{throw Error('Unexpected mutation');}})},
  });
  const tree=Card({party:{id:2,party_type:'길드버스',content_name:'레이드 - 카브락',difficulty:'어려움',party_date:'2026-10-12',time_start:'20:00',time_end:'23:59',max_members:8,status:'모집중',leader_name:operator?'합성계정':'다른운행자',members:[{name:'내캐릭터',owner:'합성계정',account_id:'fixture-account',job:'힐러',combat_power:120000,magic_resistance:8000,time_start:'20:00',time_end:'23:59'}]},currentUserNickname:'합성계정',currentUserAccountId:'fixture-account',currentUserRole:operator?'길드마스터':'길드원',myCharacterNames:['내캐릭터'],catalog:{loaded:true,error:null,powerReqs:[],contents:[],classes:[]},isMasterOrAdmin:operator,onJoinClick(){},onDeleteClick:async id=>{deleted.push(id);if(fail)throw Error('합성 해산 거부');},onRefresh:async()=>{refreshed++;}});
  const buttons=flatten(tree).filter(n=>n.type==='button');
  const previous={window:globalThis.window,confirm:globalThis.confirm,alert:globalThis.alert};
  const confirm=message=>{native.push(message);return web?answer:false;};
  globalThis.window={confirm};globalThis.confirm=confirm;globalThis.alert=message=>native.push(message);
  return {native,confirmations,notices,writes,deleted,get refreshed(){return refreshed;},
    remove:buttons.find(b=>text(b)==='해산'),leave:buttons.find(b=>b.props.title==='내캐릭터 버스 탈퇴'),
    restore(){for(const [key,value]of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}};
}

test('IRIS bus disband opens custom confirmation and awaits one deletion despite repeated clicks',async()=>{
  let finish;const wait=new Promise(r=>finish=r),f=fixture({answer:()=>wait});
  try{const pending=f.remove.props.onClick();f.remove.props.onClick();assert.equal(f.confirmations.length,1);assert.deepEqual(f.deleted,[]);finish(true);await pending;assert.deepEqual(f.deleted,[2]);assert.ok(f.notices.some(n=>/해산/.test(n)));assert.deepEqual(f.native,[]);}finally{f.restore();}
});
test('IRIS disband cancellation never deletes and releases its action lock',async()=>{
  const f=fixture({answer:false});try{await f.remove.props.onClick();await f.remove.props.onClick();assert.equal(f.confirmations.length,2);assert.deepEqual(f.deleted,[]);assert.deepEqual(f.native,[]);}finally{f.restore();}
});
test('IRIS disband rejection is visible instead of a silent native alert',async()=>{
  const f=fixture({fail:true});try{await f.remove.props.onClick();assert.ok(f.notices.some(n=>/합성 해산 거부/.test(n)));assert.deepEqual(f.native,[]);}finally{f.restore();}
});
test('IRIS character leave confirms before one narrow bus-member action and refreshes',async()=>{
  let finish;const wait=new Promise(r=>finish=r),f=fixture({answer:()=>wait});
  try{const pending=f.leave.props.onClick();f.leave.props.onClick();assert.equal(f.confirmations.length,1);assert.equal(f.writes.length,0);finish(true);await pending;assert.equal(f.writes.length,1);assert.deepEqual(f.writes[0].body.payload,{_busMemberAction:{type:'leave',name:'내캐릭터'}});assert.equal(f.writes[0].body.filter.value,2);assert.equal(f.refreshed,1);assert.ok(f.notices.some(n=>/탈퇴/.test(n)));assert.deepEqual(f.native,[]);}finally{f.restore();}
});
test('IRIS leave cancellation never writes and can reopen',async()=>{
  const f=fixture({answer:false});try{await f.leave.props.onClick();await f.leave.props.onClick();assert.equal(f.confirmations.length,2);assert.equal(f.writes.length,0);assert.deepEqual(f.native,[]);}finally{f.restore();}
});
test('IRIS leave rejection remains visible and does not refresh away the error',async()=>{
  const f=fixture({fail:true});try{await f.leave.props.onClick();assert.ok(f.notices.some(n=>/합성 권한 거부/.test(n)));assert.equal(f.refreshed,0);assert.deepEqual(f.native,[]);}finally{f.restore();}
});
test('regular guild member has no disband control but can leave their own character',()=>{
  const f=fixture({operator:false});try{assert.equal(f.remove,undefined);assert.ok(f.leave);}finally{f.restore();}
});
test('SANCTUM web keeps native confirmation and accepted disband callback',async()=>{
  const f=fixture({web:true});try{await f.remove.props.onClick();assert.deepEqual(f.deleted,[2]);assert.equal(f.native.length,1);assert.equal(f.confirmations.length,0);}finally{f.restore();}
});
